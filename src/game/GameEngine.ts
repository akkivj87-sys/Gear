/**
 * Master Game Engine for Rooftop Parkour: Apex Flow.
 * Integrates Three.js PBR rendering, Cannon-es physics, audio synthesis,
 * input polling, level loading, checkpoints, collectibles, and ghost speedrun tracking.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameConfig } from './config/GameConfig';
import { CHARACTERS, CharacterArchetype } from './config/Characters';
import { LEVELS, LevelDefinition } from './level/LevelData';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { LevelLoader } from './level/LevelLoader';
import { PlayerController } from './player/PlayerController';
import { InputManager } from './input/InputManager';
import { AudioManager } from './audio/AudioManager';
import { GhostSystem, GhostRunData } from './ghost/GhostSystem';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: {
    timer: number;
    timerString: string;
    checkpointsReached: number;
    totalCheckpoints: number;
    collectiblesGathered: number;
    totalCollectibles: number;
    score: number;
    speed: number;
    momentumMultiplier: number;
    comboCount: number;
    playerState: string;
    comboMessage: string;
    isFirstPerson: boolean;
    grappleAvailable: boolean;
    grappleLocked: boolean;
    grappleDistance: number | null;
    nextCheckpointDistance: number;
    nextCheckpointAngle: number;
  }) => void;
  onLevelComplete: (summary: {
    levelName: string;
    time: number;
    timeString: string;
    score: number;
    collectibles: number;
    totalCollectibles: number;
    isNewBest: boolean;
    nextLevelId: string | null;
  }) => void;
  onPauseToggle: (isPaused: boolean) => void;
}

export class GameEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Subsystems
  public audio: AudioManager;
  public input: InputManager;
  public physics: PhysicsWorld;
  public levelLoader: LevelLoader;
  public player: PlayerController;
  public ghost: GhostSystem;

  // Game Loop State
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number = 0;

  // Level & Progression State
  public currentLevel: LevelDefinition;
  public currentArchetype: CharacterArchetype;
  private levelStartTime: number = 0;
  private elapsedTime: number = 0;
  private currentScore: number = 0;
  private activeCheckpointPos: THREE.Vector3;
  private checkpointsHitCount: number = 0;
  private collectiblesCount: number = 0;
  private isLevelCompleted: boolean = false;

  private callbacks: GameEngineCallbacks;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.currentLevel = LEVELS[0];
    this.currentArchetype = CHARACTERS[0];

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb26b3e); // Golden hour rooftop sunset sky
    this.scene.fog = new THREE.FogExp2(0xa86138, 0.0068);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(
      GameConfig.camera.baseFov,
      container.clientWidth / container.clientHeight,
      0.1,
      1200
    );

    // 3. Renderer setup
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Studio Environment Reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 5. Lighting Rig
    this.setupLighting();

    // 6. Subsystems initialization
    this.audio = new AudioManager();
    this.input = new InputManager();
    this.input.attach(this.renderer.domElement);

    this.physics = new PhysicsWorld();
    this.levelLoader = new LevelLoader(this.scene, this.physics);
    this.player = new PlayerController(this.camera, this.physics, this.audio);
    this.player.setArchetype(this.currentArchetype);

    this.scene.add(this.player.model.group);
    this.scene.add(this.player.model.fpGroup);
    if (this.player.grappleLineMesh) {
      this.scene.add(this.player.grappleLineMesh);
    }

    this.ghost = new GhostSystem(this.scene);
    this.clock = new THREE.Clock();
    this.activeCheckpointPos = new THREE.Vector3(...this.currentLevel.startPosition);

    // Wire Combo Toasts
    this.player.onComboToast = (msg: string) => {
      this.callbacks.onStatsUpdate(this.getStatsSnapshot(msg));
    };

    // Resize Handler
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Initialize Level 1
    this.loadLevel(this.currentLevel.id);
  }

  private getStatsSnapshot(comboMsg: string = this.player.lastComboAction) {
    const horizSpeed = Math.sqrt(
      this.player.velocity.x * this.player.velocity.x +
        this.player.velocity.z * this.player.velocity.z
    );

    const nextCp = this.levelLoader.activeCheckpoints.find((cp) => !cp.hit);
    let checkpointDirectionAngle = 0;
    let checkpointDistance = 0;
    if (nextCp) {
      const p = this.player.body.position;
      const dx = nextCp.x - p.x;
      const dz = nextCp.z - p.z;
      checkpointDistance = Math.round(Math.hypot(dx, dz));
      const targetAngle = Math.atan2(dx, dz);
      const diff = targetAngle - (-this.player.yaw);
      checkpointDirectionAngle = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
    }

    const targetedGrapple = this.player.getTargetedGrappleAnchor();

    return {
      timer: this.elapsedTime,
      timerString: this.formatTime(this.elapsedTime),
      checkpointsReached: this.checkpointsHitCount,
      totalCheckpoints: this.currentLevel.checkpoints.length,
      collectiblesGathered: this.collectiblesCount,
      totalCollectibles: this.currentLevel.collectibles.length,
      score: this.currentScore,
      speed: horizSpeed,
      momentumMultiplier: this.player.momentumMultiplier,
      comboCount: this.player.comboCount,
      playerState: this.player.stateMachine.current,
      comboMessage: comboMsg,
      isFirstPerson: this.player.isFirstPerson,
      grappleAvailable: this.player.grappleAnchorsList.length > 0,
      grappleLocked: targetedGrapple !== null,
      grappleDistance: targetedGrapple ? targetedGrapple.distance : null,
      nextCheckpointDistance: checkpointDistance,
      nextCheckpointAngle: checkpointDirectionAngle,
    };
  }

  private setupLighting(): void {
    // Golden Hour Warm Sunset Key Light + Cool City Ground Fill
    const hemiLight = new THREE.HemisphereLight(0xffdfba, 0x242d38, 0.75);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffae66, 1.6);
    dirLight.position.set(160, 110, -90);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 480;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    dirLight.shadow.camera.top = 120;
    dirLight.shadow.camera.bottom = -120;
    dirLight.shadow.bias = -0.0004;
    this.scene.add(dirLight);

    // Subtle Rim Light for athlete silhouette pop
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
    rimLight.position.set(-100, 80, 120);
    this.scene.add(rimLight);
  }

  public selectArchetype(archetypeId: string): void {
    const found = CHARACTERS.find((c) => c.id === archetypeId);
    if (found) {
      this.currentArchetype = found;
      this.player.setArchetype(found);
    }
  }

  public loadLevel(levelId: string): void {
    const found = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    this.currentLevel = found;
    this.levelLoader.loadLevel(found);

    // Provide grapple anchors to player controller
    this.player.grappleAnchorsList = this.levelLoader.activeGrappleAnchors;

    // Reset level state
    this.activeCheckpointPos.set(...found.startPosition);
    this.checkpointsHitCount = 0;
    this.collectiblesCount = 0;
    this.currentScore = 0;
    this.elapsedTime = 0;
    this.isLevelCompleted = false;

    // Respawn player at level start
    this.player.respawn(this.activeCheckpointPos);

    // Load best ghost run for this level
    this.ghost.loadBestGhost(levelId);
    this.ghost.startRecording();
    this.levelStartTime = performance.now();
  }

  public restartCurrentLevel(): void {
    this.loadLevel(this.currentLevel.id);
    if (this.isPaused) {
      this.togglePause();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.audio.init();
    this.audio.resume();
    this.clock.start();
    this.levelStartTime = performance.now();
    this.tick();
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    this.callbacks.onPauseToggle(this.isPaused);
    if (this.isPaused) {
      this.input.exitPointerLock();
    } else {
      this.clock.getDelta(); // Clear accumulated delta
    }
  }

  private tick = (): void => {
    this.animationFrameId = requestAnimationFrame(this.tick);

    const rawDelta = this.clock.getDelta();
    const deltaTime = Math.min(rawDelta, 0.08); // Protect physics against huge lag spikes

    if (!this.isRunning || this.isPaused) {
      // Keep rendering static view while paused
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 1. Gather Input
    const inputState = this.input.update();

    if (inputState.pausePressed) {
      this.togglePause();
      return;
    }

    if (inputState.respawnPressed) {
      this.player.respawn(this.activeCheckpointPos);
    }

    // 2. Step Cannon-es Physics World
    this.physics.step(deltaTime);

    // 3. Update Player Kinematics & States
    this.player.update(deltaTime, inputState);

    // 4. Update Level Animations (rotating checkpoint rings, bobbing collectibles)
    this.levelLoader.updateAnimations(deltaTime);

    // 5. Update Run Timer
    if (!this.isLevelCompleted) {
      this.elapsedTime += deltaTime;
      this.ghost.recordFrame(
        this.elapsedTime,
        this.player.model.group.position,
        this.player.yaw,
        deltaTime
      );
    }

    // 6. Checkpoint Collision Checking
    this.checkCheckpointHits();

    // 7. Collectible Collision Checking
    this.checkCollectibleHits();

    // 8. Skyscraper Fall Bounds Check (Respawn)
    if (this.player.body.position.y < -12) {
      this.player.respawn(this.activeCheckpointPos);
      this.audio.playLand(1.5);
    }

    // 9. Update Ghost Replay Playback
    this.ghost.updatePlayback(this.elapsedTime);

    // 10. Dispatch HUD Stats Callback
    this.callbacks.onStatsUpdate(this.getStatsSnapshot());

    // 11. Render Scene
    this.renderer.render(this.scene, this.camera);
  };

  private checkCheckpointHits(): void {
    const p = this.player.body.position;
    const playerPos = new THREE.Vector3(p.x, p.y, p.z);

    for (let i = 0; i < this.levelLoader.activeCheckpoints.length; i++) {
      const cp = this.levelLoader.activeCheckpoints[i];
      if (!cp.hit) {
        const cpPos = new THREE.Vector3(cp.x, cp.y, cp.z);
        if (playerPos.distanceTo(cpPos) < 5.2) {
          cp.hit = true;
          this.checkpointsHitCount++;
          this.activeCheckpointPos.set(cp.x, cp.y + 1.2, cp.z);

          // Change checkpoint visual to green completed glow
          (cp.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x00ff88);
          (cp.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x00ff66);
          (cp.glowMesh.material as THREE.MeshBasicMaterial).color.setHex(0x00ff88);

          this.audio.playCheckpoint();
          this.currentScore += 500;

          // Check if this was the final Goal checkpoint!
          if (i === this.levelLoader.activeCheckpoints.length - 1) {
            this.handleLevelWin();
          }
          break;
        }
      }
    }
  }

  private checkCollectibleHits(): void {
    const p = this.player.body.position;
    const playerPos = new THREE.Vector3(p.x, p.y, p.z);

    for (const item of this.levelLoader.activeCollectibles) {
      if (!item.collected) {
        if (playerPos.distanceTo(new THREE.Vector3(item.x, item.y, item.z)) < 2.5) {
          item.collected = true;
          item.mesh.visible = false;
          this.collectiblesCount++;
          this.currentScore += item.points;
          this.audio.playCollectible();
        }
      }
    }
  }

  private handleLevelWin(): void {
    if (this.isLevelCompleted) return;
    this.isLevelCompleted = true;

    this.audio.playLevelComplete();

    // Check personal best and save ghost
    const isNewRecord = this.ghost.finishRun(
      this.currentLevel.id,
      this.elapsedTime,
      this.currentArchetype.name
    );

    // Determine next level
    const currentIdx = LEVELS.findIndex((l) => l.id === this.currentLevel.id);
    const nextLevelId = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1].id : null;

    this.callbacks.onLevelComplete({
      levelName: this.currentLevel.name,
      time: this.elapsedTime,
      timeString: this.formatTime(this.elapsedTime),
      score: this.currentScore,
      collectibles: this.collectiblesCount,
      totalCollectibles: this.currentLevel.collectibles.length,
      isNewBest: isNewRecord,
      nextLevelId,
    });
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s}.${ms}`;
  }

  private handleResize(): void {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.input.detach();
    this.levelLoader.clear();
    this.renderer.dispose();
  }
}
