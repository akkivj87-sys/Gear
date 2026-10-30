/**
 * Physics engine wrapper using Cannon-es for real-time 3D rigid body dynamics,
 * raycasting, ground queries, wall detection, and moving platform kinematics.
 */

import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig';

export interface RaycastHit {
  hasHit: boolean;
  distance: number;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  body: CANNON.Body | null;
}

export interface MovingPlatformData {
  body: CANNON.Body;
  mesh: THREE.Mesh | THREE.Group;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  speed: number;
  timeOffset: number;
}

export class PhysicsWorld {
  public world: CANNON.World;
  private defaultMaterial: CANNON.Material;
  private playerMaterial: CANNON.Material;
  private staticBodies: CANNON.Body[] = [];
  private movingPlatforms: MovingPlatformData[] = [];

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, GameConfig.physics.gravity, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    (this.world.solver as CANNON.GSSolver).iterations = 10;

    this.defaultMaterial = new CANNON.Material('default');
    this.playerMaterial = new CANNON.Material('player');

    const contactMaterial = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.defaultMaterial,
      {
        friction: 0.0, // We control horizontal friction manually for tight parkour feel
        restitution: 0.0, // No bouncing
      }
    );
    this.world.addContactMaterial(contactMaterial);
    this.world.defaultContactMaterial = contactMaterial;
  }

  public step(deltaTime: number): void {
    const fixedTime = GameConfig.physics.fixedTimeStep;
    const maxSubSteps = GameConfig.physics.maxSubSteps;
    this.world.step(fixedTime, deltaTime, maxSubSteps);

    // Update Kinematic Moving Platforms
    const now = performance.now() * 0.001;
    for (const p of this.movingPlatforms) {
      const progress = (Math.sin(now * p.speed + p.timeOffset) + 1) * 0.5; // 0 to 1 smooth oscillation
      const targetX = THREE.MathUtils.lerp(p.startPos.x, p.endPos.x, progress);
      const targetY = THREE.MathUtils.lerp(p.startPos.y, p.endPos.y, progress);
      const targetZ = THREE.MathUtils.lerp(p.startPos.z, p.endPos.z, progress);

      // Compute velocity for friction carry-over
      p.body.velocity.set(
        (targetX - p.body.position.x) / deltaTime,
        (targetY - p.body.position.y) / deltaTime,
        (targetZ - p.body.position.z) / deltaTime
      );

      p.body.position.set(targetX, targetY, targetZ);
      p.mesh.position.set(targetX, targetY, targetZ);
    }
  }

  public addStaticBox(
    position: THREE.Vector3,
    halfExtents: THREE.Vector3,
    quaternion?: THREE.Quaternion
  ): CANNON.Body {
    const shape = new CANNON.Box(
      new CANNON.Vec3(halfExtents.x, halfExtents.y, halfExtents.z)
    );
    const body = new CANNON.Body({
      mass: 0, // static
      material: this.defaultMaterial,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });

    if (quaternion) {
      body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }

    this.world.addBody(body);
    this.staticBodies.push(body);
    return body;
  }

  public addMovingPlatform(
    mesh: THREE.Mesh | THREE.Group,
    halfExtents: THREE.Vector3,
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    speed: number = 1.0,
    timeOffset: number = 0
  ): MovingPlatformData {
    const shape = new CANNON.Box(
      new CANNON.Vec3(halfExtents.x, halfExtents.y, halfExtents.z)
    );
    const body = new CANNON.Body({
      type: CANNON.Body.KINEMATIC,
      mass: 0,
      material: this.defaultMaterial,
      shape: shape,
      position: new CANNON.Vec3(startPos.x, startPos.y, startPos.z),
    });

    this.world.addBody(body);
    const platformData: MovingPlatformData = {
      body,
      mesh,
      startPos,
      endPos,
      speed,
      timeOffset,
    };
    this.movingPlatforms.push(platformData);
    return platformData;
  }

  /**
   * Performs an accurate raycast in the Cannon physics world.
   */
  public raycast(
    from: THREE.Vector3,
    to: THREE.Vector3,
    ignoreBody?: CANNON.Body
  ): RaycastHit {
    const fromVec = new CANNON.Vec3(from.x, from.y, from.z);
    const toVec = new CANNON.Vec3(to.x, to.y, to.z);
    const result = new CANNON.RaycastResult();

    const ray = new CANNON.Ray(fromVec, toVec);
    ray.skipBackfaces = true;

    // Raycast against all static and moving bodies
    let closestHit: RaycastHit = {
      hasHit: false,
      distance: Infinity,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(0, 1, 0),
      body: null,
    };

    const maxDist = from.distanceTo(to);

    for (const body of this.world.bodies) {
      if (body === ignoreBody || body.mass > 0) continue; // ignore player and dynamic bodies
      result.reset();
      ray.intersectBody(body, result);

      if (result.hasHit && result.distance < closestHit.distance && result.distance <= maxDist) {
        closestHit = {
          hasHit: true,
          distance: result.distance,
          point: new THREE.Vector3(
            result.hitPointWorld.x,
            result.hitPointWorld.y,
            result.hitPointWorld.z
          ),
          normal: new THREE.Vector3(
            result.hitNormalWorld.x,
            result.hitNormalWorld.y,
            result.hitNormalWorld.z
          ),
          body: body,
        };
      }
    }

    return closestHit;
  }

  public clear(): void {
    for (const body of this.staticBodies) {
      this.world.removeBody(body);
    }
    for (const p of this.movingPlatforms) {
      this.world.removeBody(p.body);
    }
    this.staticBodies = [];
    this.movingPlatforms = [];
  }
}
