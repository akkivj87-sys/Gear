/**
 * High-performance PlayerController for Rooftop Parkour: Apex Flow.
 * Features:
 * - Momentum accumulation & decay
 * - Variable-height jumps, double jumps, coyote time, and jump buffering
 * - Low-crouch slides with momentum conversion
 * - Dynamic wall-running (horizontal wall adhesion, gravity falloff, camera tilt, wall-jumps)
 * - Ledge detection with smooth procedural vaults and mantles
 * - Grapple hook zip and swing physics
 * - Fall damage prevention via timed safety rolls
 * - Dynamic camera with FOV scaling, head bob, wall tilt, and first/third person switching
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameConfig } from '../config/GameConfig';
import { CharacterArchetype } from '../config/Characters';
import { StateMachine, MovementState } from '../state/StateMachine';
import { InputState } from '../input/InputManager';
import { PhysicsWorld, RaycastHit } from '../physics/PhysicsWorld';
import { PlayerModel } from './PlayerModel';
import { AudioManager } from '../audio/AudioManager';

export interface GrappleAnchor {
  position: THREE.Vector3;
  mesh?: THREE.Mesh | THREE.Group;
}

export class PlayerController {
  public model: PlayerModel;
  public stateMachine: StateMachine;
  public body: CANNON.Body;
  public camera: THREE.PerspectiveCamera;

  private archetype!: CharacterArchetype;
  private physics: PhysicsWorld;
  private audio: AudioManager;

  // Camera orientation
  public yaw: number = 0; // Horizontal rotation (radians)
  public pitch: number = 0; // Vertical look angle (radians)
  public roll: number = 0; // Camera tilt (radians)
  public isFirstPerson: boolean = false;

  // Head Bob & Camera Effects
  private bobTimer: number = 0;
  private targetFov: number = GameConfig.camera.baseFov;
  public screenShake: number = 0;

  // Core Movement State
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = false;
  private groundContactNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  // Momentum System
  public momentumMultiplier: number = 1.0;
  public comboCount: number = 0;
  public lastComboAction: string = '';
  public onComboToast?: (message: string) => void;

  // Jump helpers
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private canDoubleJump: boolean = false;
  private isHoldingJump: boolean = false;

  // Wall-run helpers
  private wallRunNormal: THREE.Vector3 = new THREE.Vector3();
  private wallRunSide: 'left' | 'right' | null = null;
  private wallRunTimer: number = 0;

  // Slide helpers
  private slideTimer: number = 0;
  private slideDirection: THREE.Vector3 = new THREE.Vector3();

  // Mantle & Vault kinematic helpers
  private mantleStartPos: THREE.Vector3 = new THREE.Vector3();
  private mantleEndPos: THREE.Vector3 = new THREE.Vector3();
  private mantleProgress: number = 0;

  // Roll helpers
  private rollTimer: number = 0;
  private bufferedRoll: boolean = false;

  // Grapple helpers
  public activeGrappleAnchor: GrappleAnchor | null = null;
  public grappleTargetPoint: THREE.Vector3 | null = null;
  public grappleLineMesh: THREE.Line | null = null;
  public grappleAnchorsList: GrappleAnchor[] = [];

  // Footstep audio timer
  private footstepTimer: number = 0;

  // Pre-allocated math vectors for zero garbage collection
  private _forward = new THREE.Vector3();
  private _right = new THREE.Vector3();
  private _moveDir = new THREE.Vector3();
  private _targetVel = new THREE.Vector3();
  private _camOffset = new THREE.Vector3();
  private _rayStart = new THREE.Vector3();
  private _rayEnd = new THREE.Vector3();

  constructor(
    camera: THREE.PerspectiveCamera,
    physics: PhysicsWorld,
    audio: AudioManager
  ) {
    this.camera = camera;
    this.physics = physics;
    this.audio = audio;
    this.stateMachine = new StateMachine();
    this.model = new PlayerModel();

    // Create Cannon-es Player Physics Body
    // Using a cylinder with half-spheres on top and bottom (capsule approximation)
    const radius = 0.42;
    const height = 1.35;
    const playerShape = new CANNON.Cylinder(radius, radius, height, 12);

    this.body = new CANNON.Body({
      mass: 75, // Standard human runner mass
      shape: playerShape,
      fixedRotation: true, // Camera controls rotation, prevent physics tipping
      linearDamping: 0.05,
    });
    this.body.position.set(0, 45, 10);
    this.physics.world.addBody(this.body);

    this.initGrappleVisual();
  }

  public setArchetype(archetype: CharacterArchetype): void {
    this.archetype = archetype;
    this.model.build(archetype);
  }

  public respawn(pos: THREE.Vector3): void {
    this.body.position.set(pos.x, pos.y, pos.z);
    this.body.velocity.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.momentumMultiplier = 1.0;
    this.comboCount = 0;
    this.activeGrappleAnchor = null;
    this.stateMachine.changeState('FALL');
  }

  private initGrappleVisual(): void {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // 2 vertices x 3
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    this.grappleLineMesh = new THREE.Line(geo, mat);
    this.grappleLineMesh.visible = false;
  }

  /**
   * Main player update loop. Called every frame with safe delta time.
   */
  public update(deltaTime: number, input: InputState): void {
    // 1. Update Camera Rotation from Mouse / Touch deltas
    this.updateCameraRotation(input);

    // 2. Raycast Ground Collision Check
    this.checkGroundCollision();

    // 3. Jump Buffering & Coyote Time tracking
    if (this.isGrounded) {
      this.coyoteTimer = GameConfig.movement.coyoteTime;
      this.canDoubleJump = true;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - deltaTime);
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = GameConfig.movement.jumpBufferTime;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - deltaTime);
    }

    if (input.rollPressed) {
      this.bufferedRoll = true;
      setTimeout(() => (this.bufferedRoll = false), GameConfig.parkour.rollWindowBeforeLand * 1000);
    }

    if (input.viewTogglePressed) {
      this.isFirstPerson = !this.isFirstPerson;
    }

    // 4. State-specific Movement Logic
    this.processMovementState(deltaTime, input);

    // 5. Update Cannon Physics Body Position to Three.js Model
    this.model.group.position.set(
      this.body.position.x,
      this.body.position.y - 0.7,
      this.body.position.z
    );
    this.model.setRotationY(this.yaw);

    // Sync velocity vector
    this.velocity.set(this.body.velocity.x, this.body.velocity.y, this.body.velocity.z);

    // 6. Camera Positioning & Procedural Bobbing/Tilting
    this.updateCamera(deltaTime, input);

    // 7. Update Model Limbs Animation
    const horizontalSpeed = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
    );
    this.model.updateAnimation(
      this.stateMachine.current,
      horizontalSpeed,
      deltaTime,
      this.isFirstPerson
    );

    // 8. Footstep & Wind Audio
    this.updateAudio(deltaTime, horizontalSpeed);

    // 9. Update Grapple Line Visual
    this.updateGrappleVisual();

    // 10. Update State Machine Timer
    this.stateMachine.update(deltaTime);
  }

  // --- CAMERA ORIENTATION ---

  private updateCameraRotation(input: InputState): void {
    const sens = GameConfig.camera.mouseSensitivity;
    this.yaw -= input.lookDeltaX * sens;
    this.pitch -= input.lookDeltaY * sens;

    // Clamp pitch to avoid gimbal flip (-88 to +88 degrees)
    const maxPitch = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  // --- GROUND RAYCAST ---

  private checkGroundCollision(): void {
    const p = this.body.position;
    this._rayStart.set(p.x, p.y - 0.5, p.z);
    this._rayEnd.set(p.x, p.y - 1.1, p.z);

    const hit = this.physics.raycast(this._rayStart, this._rayEnd, this.body);

    const wasGrounded = this.isGrounded;
    this.isGrounded = hit.hasHit && hit.normal.y > 0.55;

    if (this.isGrounded) {
      this.groundContactNormal.copy(hit.normal);
      // Hard Landing check
      if (!wasGrounded && this.body.velocity.y < GameConfig.parkour.hardLandThresholdSpeed) {
        if (this.bufferedRoll) {
          this.triggerRoll();
        } else {
          // Hard landing impact
          this.screenShake = 0.35;
          this.audio.playLand(1.8);
          this.momentumMultiplier = Math.max(0.7, this.momentumMultiplier * 0.6);
          this.triggerComboToast('HARD IMPACT - DIVE ROLL TO PRESERVE MOMENTUM');
        }
      } else if (!wasGrounded) {
        this.audio.playLand(0.9);
      }
    }
  }

  // --- MOVEMENT STATE MACHINE & PARKOUR ACTIONS ---

  private processMovementState(deltaTime: number, input: InputState): void {
    const curr = this.stateMachine.current;

    // Handle Grapple Hook Trigger
    if (input.grapplePressed) {
      this.tryTriggerGrapple();
    }

    if (curr === 'GRAPPLE') {
      this.updateGrapple(deltaTime, input);
      return;
    }

    if (curr === 'MANTLE' || curr === 'VAULT') {
      this.updateMantleKinematics(deltaTime);
      return;
    }

    if (curr === 'ROLL') {
      this.updateRoll(deltaTime);
      return;
    }

    if (curr === 'SLIDE') {
      this.updateSlide(deltaTime, input);
      return;
    }

    // Check Wall-Run eligibility if airborne and moving forward
    if (!this.isGrounded && input.forward > 0.3) {
      if (this.checkWallRun(deltaTime, input)) {
        return;
      }
    } else if (curr === 'WALL_RUN') {
      this.exitWallRun();
    }

    // Check Ledge Vault / Mantle if facing obstacle
    if (input.forward > 0.5 && (curr === 'RUN' || curr === 'SPRINT' || !this.isGrounded)) {
      if (this.checkLedgeParkour()) {
        return;
      }
    }

    // Standard Ground / Airborne Navigation
    this.updateStandardMovement(deltaTime, input);
  }

  private updateStandardMovement(deltaTime: number, input: InputState): void {
    // Calculate movement directions relative to camera yaw
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    this._moveDir.set(0, 0, 0);
    this._moveDir.addScaledVector(this._forward, input.forward);
    this._moveDir.addScaledVector(this._right, input.right);

    const hasInput = this._moveDir.lengthSq() > 0.01;
    if (hasInput) {
      this._moveDir.normalize();
    }

    // Determine target speed based on sprint / run / walk
    let baseSpeed = GameConfig.movement.walkSpeed;
    if (input.isSprinting && hasInput) {
      baseSpeed = GameConfig.movement.sprintSpeed;
    } else if (hasInput) {
      baseSpeed = GameConfig.movement.runSpeed;
    }

    const effectiveTargetSpeed =
      baseSpeed * this.archetype.modifiers.speedMultiplier * this.momentumMultiplier;

    // Smooth horizontal acceleration / deceleration
    const currentVx = this.body.velocity.x;
    const currentVz = this.body.velocity.z;

    const accel = this.isGrounded
      ? (hasInput ? GameConfig.movement.acceleration : GameConfig.movement.deceleration)
      : GameConfig.movement.acceleration * GameConfig.movement.airControl;

    const targetVx = hasInput ? this._moveDir.x * effectiveTargetSpeed : 0;
    const targetVz = hasInput ? this._moveDir.z * effectiveTargetSpeed : 0;

    this.body.velocity.x = THREE.MathUtils.damp(currentVx, targetVx, accel, deltaTime);
    this.body.velocity.z = THREE.MathUtils.damp(currentVz, targetVz, accel, deltaTime);

    // Momentum decay when stopping or idling
    if (!hasInput && this.isGrounded) {
      this.momentumMultiplier = THREE.MathUtils.damp(
        this.momentumMultiplier,
        1.0,
        GameConfig.movement.momentumDecayRate,
        deltaTime
      );
    }

    // Slide Trigger Check: Sprinting + Slide Input on ground
    if (
      this.isGrounded &&
      input.slidePressed &&
      (this.stateMachine.current === 'SPRINT' || this.stateMachine.current === 'RUN')
    ) {
      this.triggerSlide();
      return;
    }

    // Jump Execution (Jump Buffering & Coyote Time)
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.executeJump();
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    } else if (input.jumpPressed && !this.isGrounded && this.canDoubleJump) {
      this.executeDoubleJump();
    }

    // Variable Jump Height: cut upward velocity if jump key released early
    if (this.isHoldingJump && !input.jumpHeld && this.body.velocity.y > 2.0) {
      this.body.velocity.y *= 0.55;
      this.isHoldingJump = false;
    }

    // Update Grounded / Airborne Movement States
    if (this.isGrounded) {
      if (!hasInput) {
        this.stateMachine.changeState('IDLE');
      } else if (input.isSprinting) {
        this.stateMachine.changeState('SPRINT');
      } else if (effectiveTargetSpeed > GameConfig.movement.walkSpeed + 1) {
        this.stateMachine.changeState('RUN');
      } else {
        this.stateMachine.changeState('WALK');
      }
    } else {
      if (this.body.velocity.y < -1.0) {
        this.stateMachine.changeState('FALL');
      }
    }
  }

  // --- JUMPING MECHANICS ---

  private executeJump(): void {
    const jumpPower = this.archetype.modifiers.jumpPower;
    this.body.velocity.y = jumpPower;
    this.isHoldingJump = true;
    this.isGrounded = false;
    this.stateMachine.changeState('JUMP');
    this.audio.playJump();
  }

  private executeDoubleJump(): void {
    const bonus = this.archetype.modifiers.doubleJumpBonus;
    this.body.velocity.y = GameConfig.movement.doubleJumpForce * bonus;
    this.canDoubleJump = false;
    this.isHoldingJump = true;
    this.stateMachine.changeState('DOUBLE_JUMP');
    this.audio.playDoubleJump();
    this.addMomentum(0.1, 'AIR FLIP DOUBLE JUMP');
  }

  // --- SLIDE MECHANICS ---

  private triggerSlide(): void {
    this.stateMachine.changeState('SLIDE');
    this.slideTimer = GameConfig.movement.slideDuration;

    // Slide forward along current movement vector
    const horizSpeed = Math.sqrt(
      this.body.velocity.x * this.body.velocity.x + this.body.velocity.z * this.body.velocity.z
    );
    this.slideDirection
      .set(this.body.velocity.x, 0, this.body.velocity.z)
      .normalize();

    // Give slide an instant kinetic boost
    const boost = (horizSpeed + GameConfig.movement.slideSpeedBoost) * 1.05;
    this.body.velocity.x = this.slideDirection.x * boost;
    this.body.velocity.z = this.slideDirection.z * boost;

    this.audio.setSlideActive(true, 1.0);
    this.addMomentum(0.12, 'POWER SLIDE');
  }

  private updateSlide(deltaTime: number, input: InputState): void {
    this.slideTimer -= deltaTime;

    // Slide friction
    const currentSpeed = Math.sqrt(
      this.body.velocity.x * this.body.velocity.x + this.body.velocity.z * this.body.velocity.z
    );

    const targetSpeed = Math.max(0, currentSpeed - GameConfig.movement.slideFriction * deltaTime);
    this.body.velocity.x = this.slideDirection.x * targetSpeed;
    this.body.velocity.z = this.slideDirection.z * targetSpeed;

    // Allow slide-jump for massive forward leap
    if (input.jumpPressed && this.isGrounded) {
      this.audio.setSlideActive(false);
      this.executeJump();
      this.addMomentum(0.18, 'SLIDE HOP BOOST');
      return;
    }

    if (this.slideTimer <= 0 || !this.isGrounded || currentSpeed < 4.0) {
      this.audio.setSlideActive(false);
      this.stateMachine.changeState(this.isGrounded ? 'RUN' : 'FALL');
    }
  }

  // --- WALL-RUN MECHANICS ---

  private checkWallRun(deltaTime: number, input: InputState): boolean {
    const p = this.body.position;
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
    const rayDist = GameConfig.wallrun.wallRayDistance;

    // Raycast Left
    this._rayStart.set(p.x, p.y, p.z);
    this._rayEnd.copy(this._rayStart).addScaledVector(this._right, -rayDist);
    const hitLeft = this.physics.raycast(this._rayStart, this._rayEnd, this.body);

    // Raycast Right
    this._rayEnd.copy(this._rayStart).addScaledVector(this._right, rayDist);
    const hitRight = this.physics.raycast(this._rayStart, this._rayEnd, this.body);

    let activeHit: RaycastHit | null = null;
    let side: 'left' | 'right' | null = null;

    if (hitLeft.hasHit && Math.abs(hitLeft.normal.y) < 0.3) {
      activeHit = hitLeft;
      side = 'left';
    } else if (hitRight.hasHit && Math.abs(hitRight.normal.y) < 0.3) {
      activeHit = hitRight;
      side = 'right';
    }

    if (activeHit && side) {
      this.wallRunNormal.copy(activeHit.normal);
      this.wallRunSide = side;

      if (this.stateMachine.current !== 'WALL_RUN') {
        this.stateMachine.changeState('WALL_RUN');
        this.wallRunTimer = GameConfig.wallrun.durationMax;
        this.audio.playWallRun();
        this.canDoubleJump = true; // Refresh double jump off walls!
        this.addMomentum(0.15, `WALL RUN ${side.toUpperCase()}`);
      }

      this.updateWallRun(deltaTime, input);
      return true;
    }

    return false;
  }

  private updateWallRun(deltaTime: number, input: InputState): void {
    this.wallRunTimer -= deltaTime;

    // Wall-Run direction is tangent to the wall normal
    // cross wallNormal with UP to get tangent
    const wallTangent = new THREE.Vector3().crossVectors(this.wallRunNormal, new THREE.Vector3(0, 1, 0));
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();

    // Ensure tangent points in forward direction
    if (wallTangent.dot(this._forward) < 0) {
      wallTangent.negate();
    }

    const wallSpeed =
      GameConfig.movement.sprintSpeed *
      this.archetype.modifiers.speedMultiplier *
      this.archetype.modifiers.wallRunBonus *
      this.momentumMultiplier;

    this.body.velocity.x = wallTangent.x * wallSpeed;
    this.body.velocity.z = wallTangent.z * wallSpeed;

    // Drastically reduce gravity falloff while wall-running
    this.body.velocity.y = Math.max(-2.5, this.body.velocity.y * 0.92);

    // Camera roll tilt
    const tiltTarget =
      this.wallRunSide === 'left'
        ? -GameConfig.wallrun.cameraTiltAngle
        : GameConfig.wallrun.cameraTiltAngle;
    this.roll = THREE.MathUtils.damp(
      this.roll,
      tiltTarget,
      GameConfig.camera.rollSmoothSpeed,
      deltaTime
    );

    // Wall-Jump Kickoff
    if (input.jumpPressed) {
      const up = GameConfig.wallrun.jumpUpForce * this.archetype.modifiers.jumpPower * 0.08;
      const away = GameConfig.wallrun.jumpAwayForce;

      this.body.velocity.x += this.wallRunNormal.x * away;
      this.body.velocity.z += this.wallRunNormal.z * away;
      this.body.velocity.y = up;

      this.audio.playJump();
      this.exitWallRun();
      this.addMomentum(0.2, 'WALL-KICK LAUNCH');
    }

    if (this.wallRunTimer <= 0) {
      this.exitWallRun();
    }
  }

  private exitWallRun(): void {
    this.wallRunSide = null;
    this.stateMachine.changeState('FALL');
  }

  // --- LEDGE VAULT & MANTLE (CLIMB) ---

  private checkLedgeParkour(): boolean {
    const p = this.body.position;
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();

    // 1. Check waist / chest obstacle (1.1m)
    this._rayStart.set(p.x, p.y + 0.2, p.z);
    this._rayEnd.copy(this._rayStart).addScaledVector(this._forward, 1.4);
    const hitWall = this.physics.raycast(this._rayStart, this._rayEnd, this.body);

    if (!hitWall.hasHit) return false;

    // 2. Check headroom (2.2m)
    this._rayStart.set(p.x, p.y + 2.2, p.z);
    this._rayEnd.copy(this._rayStart).addScaledVector(this._forward, 1.4);
    const hitHeadroom = this.physics.raycast(this._rayStart, this._rayEnd, this.body);

    // If headroom is blocked by a solid wall, can't vault or mantle
    if (hitHeadroom.hasHit) return false;

    // 3. Downward raycast from above obstacle to find the rooftop / ledge surface
    const ledgeProbeStart = new THREE.Vector3()
      .copy(hitWall.point)
      .addScaledVector(this._forward, 0.4);
    ledgeProbeStart.y = p.y + 3.0;

    const ledgeProbeEnd = new THREE.Vector3().copy(ledgeProbeStart);
    ledgeProbeEnd.y = p.y - 0.5;

    const hitLedge = this.physics.raycast(ledgeProbeStart, ledgeProbeEnd, this.body);
    if (!hitLedge.hasHit) return false;

    const ledgeHeight = hitLedge.point.y - (p.y - 0.7);

    // Low obstacle -> Swift Vault
    if (
      ledgeHeight >= GameConfig.parkour.vaultMinHeight &&
      ledgeHeight <= GameConfig.parkour.vaultMaxHeight
    ) {
      this.triggerVault(hitLedge.point);
      return true;
    }

    // High obstacle -> Mantle Climb
    if (
      ledgeHeight > GameConfig.parkour.vaultMaxHeight &&
      ledgeHeight <= GameConfig.parkour.mantleMaxHeight
    ) {
      this.triggerMantle(hitLedge.point);
      return true;
    }

    return false;
  }

  private triggerVault(targetLedge: THREE.Vector3): void {
    this.stateMachine.changeState('VAULT');
    this.mantleStartPos.copy(this.body.position as unknown as THREE.Vector3);
    this.mantleEndPos.set(
      targetLedge.x + this._forward.x * 0.8,
      targetLedge.y + 0.8,
      targetLedge.z + this._forward.z * 0.8
    );
    this.mantleProgress = 0;
    this.audio.playMantle();
    this.addMomentum(0.14, 'SMOOTH OBSTACLE VAULT');
  }

  private triggerMantle(targetLedge: THREE.Vector3): void {
    this.stateMachine.changeState('MANTLE');
    this.mantleStartPos.copy(this.body.position as unknown as THREE.Vector3);
    this.mantleEndPos.set(
      targetLedge.x + this._forward.x * 0.5,
      targetLedge.y + 0.85,
      targetLedge.z + this._forward.z * 0.5
    );
    this.mantleProgress = 0;
    this.body.velocity.set(0, 0, 0);
    this.audio.playMantle();
    this.addMomentum(0.18, 'LEDGE MANTLE CLIMB');
  }

  private updateMantleKinematics(deltaTime: number): void {
    const duration =
      this.stateMachine.current === 'VAULT' ? 0.28 : GameConfig.parkour.mantleDuration;
    this.mantleProgress += deltaTime / duration;

    // Smooth cubic hermite curve
    const t = Math.min(1.0, this.mantleProgress);
    const smooth = t * t * (3 - 2 * t);

    this.body.position.x = THREE.MathUtils.lerp(
      this.mantleStartPos.x,
      this.mantleEndPos.x,
      smooth
    );
    this.body.position.y = THREE.MathUtils.lerp(
      this.mantleStartPos.y,
      this.mantleEndPos.y,
      smooth
    );
    this.body.position.z = THREE.MathUtils.lerp(
      this.mantleStartPos.z,
      this.mantleEndPos.z,
      smooth
    );

    if (t >= 1.0) {
      // Finished mantle: propel forward
      const forwardBoost =
        this.stateMachine.current === 'VAULT' ? GameConfig.parkour.vaultForwardBoost : 7.0;
      this.body.velocity.x = this._forward.x * forwardBoost;
      this.body.velocity.z = this._forward.z * forwardBoost;
      this.body.velocity.y = 2.0;
      this.stateMachine.changeState('RUN');
    }
  }

  // --- LANDING DIVE ROLL ---

  private triggerRoll(): void {
    this.stateMachine.changeState('ROLL');
    this.rollTimer = 0.45;
    this.audio.playRoll();
    this.addMomentum(0.25, 'PERFECT SAFETY ROLL + MOMENTUM PRESERVED');

    // Convert downward momentum to forward burst
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const burst = 18.0 * this.archetype.modifiers.speedMultiplier;
    this.body.velocity.x = this._forward.x * burst;
    this.body.velocity.z = this._forward.z * burst;
  }

  private updateRoll(deltaTime: number): void {
    this.rollTimer -= deltaTime;
    // Pitch model full 360 over roll duration
    const progress = 1.0 - this.rollTimer / 0.45;
    this.model.setPitchAngle(progress * Math.PI * 2);

    if (this.rollTimer <= 0) {
      this.model.setPitchAngle(0);
      this.stateMachine.changeState('SPRINT');
    }
  }

  // --- GRAPPLE HOOK ---

  private tryTriggerGrapple(): void {
    if (this.stateMachine.current === 'GRAPPLE') {
      // Disengage grapple
      this.activeGrappleAnchor = null;
      this.stateMachine.changeState('FALL');
      return;
    }

    const p = this.body.position;
    const playerPos = new THREE.Vector3(p.x, p.y, p.z);
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();

    const maxDist =
      GameConfig.grapple.maxDistance * this.archetype.modifiers.grappleBonus;

    // Find closest anchor in view cone
    let bestAnchor: GrappleAnchor | null = null;
    let bestDot = 0.55; // Must be roughly in front of player

    for (const anchor of this.grappleAnchorsList) {
      const dist = playerPos.distanceTo(anchor.position);
      if (dist <= maxDist) {
        const toAnchor = new THREE.Vector3().subVectors(anchor.position, playerPos).normalize();
        const dot = this._forward.dot(toAnchor);
        if (dot > bestDot) {
          bestDot = dot;
          bestAnchor = anchor;
        }
      }
    }

    if (bestAnchor) {
      this.activeGrappleAnchor = bestAnchor;
      this.grappleTargetPoint = bestAnchor.position.clone();
      this.stateMachine.changeState('GRAPPLE');
      this.audio.playGrappleFire();
      this.addMomentum(0.22, 'CYBER GRAPPLE ZIPLINE');
    }
  }

  public getTargetedGrappleAnchor(): { anchor: GrappleAnchor; distance: number } | null {
    const p = this.body.position;
    const playerPos = new THREE.Vector3(p.x, p.y, p.z);
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();

    const maxDist =
      GameConfig.grapple.maxDistance * (this.archetype?.modifiers.grappleBonus || 1.0);

    let bestAnchor: GrappleAnchor | null = null;
    let bestDist = Infinity;
    let bestDot = 0.55;

    for (const anchor of this.grappleAnchorsList) {
      const dist = playerPos.distanceTo(anchor.position);
      if (dist <= maxDist) {
        const toAnchor = new THREE.Vector3().subVectors(anchor.position, playerPos).normalize();
        const dot = this._forward.dot(toAnchor);
        if (dot > bestDot) {
          bestDot = dot;
          bestAnchor = anchor;
          bestDist = dist;
        }
      }
    }

    if (bestAnchor) {
      return { anchor: bestAnchor, distance: Math.round(bestDist) };
    }
    return null;
  }

  private updateGrapple(deltaTime: number, input: InputState): void {
    if (!this.activeGrappleAnchor || !this.grappleTargetPoint) {
      this.stateMachine.changeState('FALL');
      return;
    }

    const p = this.body.position;
    const playerPos = new THREE.Vector3(p.x, p.y, p.z);
    const toAnchor = new THREE.Vector3().subVectors(this.grappleTargetPoint, playerPos);
    const dist = toAnchor.length();

    if (dist < 3.2 || input.jumpPressed) {
      // Release grapple with high-speed launch
      this.activeGrappleAnchor = null;
      this.grappleTargetPoint = null;
      this.body.velocity.y = 12.0; // Launch upward over rooftop!
      this.stateMachine.changeState('FALL');
      this.audio.playJump();
      this.addMomentum(0.2, 'GRAPPLE APEX LAUNCH');
      return;
    }

    toAnchor.normalize();
    const pullSpeed =
      GameConfig.grapple.pullSpeed * this.archetype.modifiers.grappleBonus * this.momentumMultiplier;

    this.body.velocity.x = toAnchor.x * pullSpeed;
    this.body.velocity.y = toAnchor.y * pullSpeed + 2.5; // slight lift
    this.body.velocity.z = toAnchor.z * pullSpeed;
  }

  private updateGrappleVisual(): void {
    if (this.grappleLineMesh) {
      if (this.activeGrappleAnchor && this.grappleTargetPoint) {
        this.grappleLineMesh.visible = true;
        const positions = this.grappleLineMesh.geometry.attributes.position.array as Float32Array;
        // From player hand / chest
        positions[0] = this.body.position.x;
        positions[1] = this.body.position.y + 0.5;
        positions[2] = this.body.position.z;
        // To anchor point
        positions[3] = this.grappleTargetPoint.x;
        positions[4] = this.grappleTargetPoint.y;
        positions[5] = this.grappleTargetPoint.z;
        this.grappleLineMesh.geometry.attributes.position.needsUpdate = true;
      } else {
        this.grappleLineMesh.visible = false;
      }
    }
  }

  // --- MOMENTUM & COMBO TOASTS ---

  private addMomentum(amount: number, reason: string): void {
    const bonus = amount * this.archetype.modifiers.momentumRetention;
    this.momentumMultiplier = Math.min(
      GameConfig.movement.maxMomentumMultiplier,
      this.momentumMultiplier + bonus
    );
    this.comboCount++;
    this.lastComboAction = reason;
    this.triggerComboToast(`${reason} +${Math.round(bonus * 1000)} FLOW`);
  }

  private triggerComboToast(text: string): void {
    if (this.onComboToast) {
      this.onComboToast(text);
    }
  }

  // --- DYNAMIC CAMERA & BOBBING ---

  private updateCamera(deltaTime: number, input: InputState): void {
    const p = this.body.position;
    const speed = Math.sqrt(
      this.body.velocity.x * this.body.velocity.x + this.body.velocity.z * this.body.velocity.z
    );

    // Dynamic FOV based on speed and momentum
    const speedRatio = Math.min(1.0, (speed - 8.0) / 16.0);
    this.targetFov = THREE.MathUtils.lerp(
      GameConfig.camera.baseFov,
      GameConfig.camera.sprintFov,
      Math.max(0, speedRatio)
    );
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 6.0, deltaTime);
    this.camera.updateProjectionMatrix();

    // Head Bob (active while grounded and moving)
    let bobX = 0;
    let bobY = 0;
    if (this.isGrounded && speed > 2.0) {
      this.bobTimer += deltaTime * GameConfig.camera.headBobFrequency * (speed / 10.0);
      bobX = Math.sin(this.bobTimer * 0.5) * GameConfig.camera.headBobAmplitude * 0.5;
      bobY = Math.abs(Math.sin(this.bobTimer)) * GameConfig.camera.headBobAmplitude;
    } else {
      this.bobTimer = 0;
    }

    // Screen Shake decay
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0.005) {
      shakeX = (Math.random() * 2 - 1) * this.screenShake;
      shakeY = (Math.random() * 2 - 1) * this.screenShake;
      this.screenShake = THREE.MathUtils.damp(this.screenShake, 0, 8.0, deltaTime);
    }

    // Reset camera roll smoothly if not wall running
    if (this.stateMachine.current !== 'WALL_RUN') {
      this.roll = THREE.MathUtils.damp(this.roll, 0, GameConfig.camera.rollSmoothSpeed, deltaTime);
    }

    if (this.isFirstPerson) {
      // First Person: Camera placed at player's head
      this.camera.position.set(
        p.x + bobX + shakeX,
        p.y + GameConfig.camera.firstPersonEyeHeight - 0.7 + bobY + shakeY,
        p.z
      );

      // Camera orientation from pitch, yaw, roll
      this.camera.rotation.set(0, 0, 0);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      this.camera.rotation.z = this.roll;

      // Attach FP hands rig to camera
      this.model.fpGroup.position.copy(this.camera.position);
      this.model.fpGroup.rotation.copy(this.camera.rotation);
    } else {
      // Third Person: Camera follows behind player
      const offset = GameConfig.camera.thirdPersonOffset;

      // Calculate camera position rotated by yaw
      const camX = p.x - Math.sin(this.yaw) * -offset.z * Math.cos(this.pitch);
      const camY = p.y + offset.y + Math.sin(this.pitch) * offset.z + shakeY;
      const camZ = p.z - Math.cos(this.yaw) * -offset.z * Math.cos(this.pitch);

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(p.x, p.y + 1.2, p.z);
      this.camera.rotation.z += this.roll;
    }
  }

  // --- AUDIO DISPATCH ---

  private updateAudio(deltaTime: number, speed: number): void {
    // Footstep audio cadence
    if (this.isGrounded && speed > 2.0) {
      const stepInterval = THREE.MathUtils.lerp(0.42, 0.24, Math.min(1.0, speed / 16.0));
      this.footstepTimer += deltaTime;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        this.audio.playFootstep(speed / 10.0);
      }
    } else {
      this.footstepTimer = 0.2; // Ready for immediate step upon landing
    }

    // High speed wind sound
    this.audio.updateSpeedWind(speed);
  }
}
