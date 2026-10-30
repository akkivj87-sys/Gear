/**
 * LevelLoader for Rooftop Parkour: Apex Flow.
 * Procedurally generates 3D architecture, physical collision boxes,
 * moving platforms, interactive checkpoints, collectibles, and an instanced skyline backdrop.
 */

import * as THREE from 'three';
import { LevelDefinition, CheckpointData, CollectibleData } from './LevelData';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { GrappleAnchor } from '../player/PlayerController';

export interface RuntimeCheckpoint extends CheckpointData {
  mesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  hit: boolean;
}

export interface RuntimeCollectible extends CollectibleData {
  mesh: THREE.Group;
  collected: boolean;
}

export class LevelLoader {
  private scene: THREE.Scene;
  private physics: PhysicsWorld;
  private levelGroup: THREE.Group;

  public activeCheckpoints: RuntimeCheckpoint[] = [];
  public activeCollectibles: RuntimeCollectible[] = [];
  public activeGrappleAnchors: GrappleAnchor[] = [];

  // Instanced Skyline Mesh
  private backgroundSkylineMesh: THREE.InstancedMesh | null = null;

  // Shared reusable materials
  private concreteMat: THREE.MeshStandardMaterial;
  private roofMatA: THREE.MeshStandardMaterial;
  private roofMatB: THREE.MeshStandardMaterial;
  private metalMat: THREE.MeshStandardMaterial;
  private acMat: THREE.MeshStandardMaterial;
  private neonMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, physics: PhysicsWorld) {
    this.scene = scene;
    this.physics = physics;
    this.levelGroup = new THREE.Group();
    this.levelGroup.name = 'CurrentLevelGroup';
    this.scene.add(this.levelGroup);

    // Initialize PBR Materials
    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0x5a6572,
      roughness: 0.85,
      metalness: 0.1,
    });
    this.roofMatA = new THREE.MeshStandardMaterial({
      color: 0x8a452d,
      roughness: 0.38, // Wet asphalt sheen reflecting golden hour sky
      metalness: 0.25,
    });
    this.roofMatB = new THREE.MeshStandardMaterial({
      color: 0x2e3947,
      roughness: 0.35,
      metalness: 0.3,
    });
    this.metalMat = new THREE.MeshStandardMaterial({
      color: 0x7c8590,
      roughness: 0.35,
      metalness: 0.8,
    });
    this.acMat = new THREE.MeshStandardMaterial({
      color: 0x8e97a0,
      roughness: 0.5,
      metalness: 0.4,
    });
    this.neonMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x00b4d8,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
  }

  public loadLevel(levelDef: LevelDefinition): void {
    this.clear();

    // 1. Build Rooftops & Buildings
    levelDef.buildings.forEach((b, idx) => {
      this.createBuilding(b, idx);
    });

    // 2. Build Obstacles (AC units, pipes, billboards, water towers, cranes)
    levelDef.obstacles.forEach((obs) => {
      this.createObstacle(obs);
    });

    // 3. Build Moving Platforms
    levelDef.movingPlatforms.forEach((plat) => {
      this.createMovingPlatform(plat);
    });

    // 4. Build Interactive Checkpoints
    levelDef.checkpoints.forEach((cp) => {
      this.createCheckpoint(cp);
    });

    // 5. Build Collectible Cubes
    levelDef.collectibles.forEach((item) => {
      this.createCollectible(item);
    });

    // 6. Build Grapple Anchor Beacons
    levelDef.grappleAnchors.forEach((anc) => {
      this.createGrappleAnchor(anc);
    });

    // 7. Build Massive Instanced Skyline Backdrop
    this.createInstancedSkyline();
  }

  private createBuilding(b: LevelDefinition['buildings'][0], idx: number): void {
    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(b.x, 0, b.z);

    // Main Skyscraper Body
    const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.concreteMat);
    bodyMesh.position.y = b.h / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    buildingGroup.add(bodyMesh);

    // Rooftop Surface / Parapet
    const roofColor = b.roofColor || (idx % 2 === 0 ? 0x9e5239 : 0x3d4a58);
    const roofMat = roofColor === 0x9e5239 ? this.roofMatA : this.roofMatB;

    const roofGeo = new THREE.BoxGeometry(b.w + 0.6, 1.2, b.d + 0.6);
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.y = b.h;
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    buildingGroup.add(roofMesh);

    // Decorative Parapet Wall Trim along roof edges (adds depth for mantling)
    const rimGeo = new THREE.BoxGeometry(b.w + 0.8, 0.4, 0.5);
    const rimMeshNorth = new THREE.Mesh(rimGeo, this.metalMat);
    rimMeshNorth.position.set(0, b.h + 0.8, -b.d / 2);
    buildingGroup.add(rimMeshNorth);

    const rimMeshSouth = new THREE.Mesh(rimGeo, this.metalMat);
    rimMeshSouth.position.set(0, b.h + 0.8, b.d / 2);
    buildingGroup.add(rimMeshSouth);

    // Corner Telecommunications Antenna & Aviation Red Warning Beacon
    if (idx % 2 === 0) {
      const antGeo = new THREE.CylinderGeometry(0.08, 0.12, 6.0, 8);
      const antMesh = new THREE.Mesh(antGeo, this.metalMat);
      antMesh.position.set(b.w * 0.4, b.h + 3.6, b.d * 0.4);
      buildingGroup.add(antMesh);

      const beaconGeo = new THREE.SphereGeometry(0.22, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(b.w * 0.4, b.h + 6.6, b.d * 0.4);
      buildingGroup.add(beaconMesh);
    }

    this.levelGroup.add(buildingGroup);

    // Register Static Physics Body in Cannon
    // Main body collision
    this.physics.addStaticBox(
      new THREE.Vector3(b.x, b.h / 2, b.z),
      new THREE.Vector3(b.w / 2, b.h / 2, b.d / 2)
    );

    // Rooftop top lip collision
    this.physics.addStaticBox(
      new THREE.Vector3(b.x, b.h + 0.6, b.z),
      new THREE.Vector3((b.w + 0.6) / 2, 0.6, (b.d + 0.6) / 2)
    );
  }

  private createObstacle(obs: LevelDefinition['obstacles'][0]): void {
    const w = obs.w || 2.5;
    const h = obs.h || 1.8;
    const d = obs.d || 2.5;

    if (obs.type === 'ac_unit' || obs.type === 'vent') {
      const acGroup = new THREE.Group();
      acGroup.position.set(obs.x, obs.y + h / 2, obs.z);

      const acGeo = new THREE.BoxGeometry(w, h, d);
      const acMesh = new THREE.Mesh(acGeo, this.acMat);
      acMesh.castShadow = true;
      acMesh.receiveShadow = true;
      acGroup.add(acMesh);

      // Fan Grill Accent
      const fanGeo = new THREE.CylinderGeometry(0.35 * Math.min(w, d), 0.35 * Math.min(w, d), 0.1, 12);
      const fanMesh = new THREE.Mesh(fanGeo, this.metalMat);
      fanMesh.position.y = h / 2 + 0.05;
      acGroup.add(fanMesh);

      this.levelGroup.add(acGroup);

      this.physics.addStaticBox(
        new THREE.Vector3(obs.x, obs.y + h / 2, obs.z),
        new THREE.Vector3(w / 2, h / 2, d / 2)
      );
    } else if (obs.type === 'billboard') {
      // Wall-run surface
      const boardGroup = new THREE.Group();
      boardGroup.position.set(obs.x, obs.y, obs.z);
      if (obs.rotationY) boardGroup.rotation.y = obs.rotationY;

      const boardGeo = new THREE.BoxGeometry(w, h, d);
      const boardMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.4,
        metalness: 0.6,
      });
      const boardMesh = new THREE.Mesh(boardGeo, boardMat);
      boardMesh.castShadow = true;
      boardMesh.receiveShadow = true;
      boardGroup.add(boardMesh);

      // Neon Sign Border & Glow
      const neonBorderGeo = new THREE.BoxGeometry(w + 0.1, h * 0.9, 0.3);
      const neonStrip = new THREE.Mesh(neonBorderGeo, this.neonMat);
      neonStrip.position.z = d / 2 + 0.1;
      boardGroup.add(neonStrip);

      this.levelGroup.add(boardGroup);

      // Physics box with rotation
      const quat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        obs.rotationY || 0
      );
      this.physics.addStaticBox(
        new THREE.Vector3(obs.x, obs.y, obs.z),
        new THREE.Vector3(w / 2, h / 2, d / 2),
        quat
      );
    } else if (obs.type === 'pipe') {
      // Cylindrical balance beam / pipe
      const pipeGeo = new THREE.BoxGeometry(w, h, d);
      const pipeMesh = new THREE.Mesh(pipeGeo, this.metalMat);
      pipeMesh.position.set(obs.x, obs.y, obs.z);
      pipeMesh.castShadow = true;
      pipeMesh.receiveShadow = true;
      this.levelGroup.add(pipeMesh);

      this.physics.addStaticBox(
        new THREE.Vector3(obs.x, obs.y, obs.z),
        new THREE.Vector3(w / 2, h / 2, d / 2)
      );
    } else if (obs.type === 'water_tower') {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(obs.x, obs.y, obs.z);

      // Legs / Truss
      const legGeo = new THREE.CylinderGeometry(0.2, 0.2, h * 0.6, 8);
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeo, this.metalMat);
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        leg.position.set(Math.cos(angle) * (w * 0.35), h * 0.3, Math.sin(angle) * (d * 0.35));
        leg.castShadow = true;
        towerGroup.add(leg);
      }

      // Tank
      const tankGeo = new THREE.CylinderGeometry(w * 0.45, w * 0.45, h * 0.5, 16);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x6e5239, roughness: 0.6 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.y = h * 0.75;
      tank.castShadow = true;
      towerGroup.add(tank);

      this.levelGroup.add(towerGroup);

      this.physics.addStaticBox(
        new THREE.Vector3(obs.x, obs.y + h / 2, obs.z),
        new THREE.Vector3(w / 2, h / 2, d / 2)
      );
    } else if (obs.type === 'crane') {
      const craneGroup = new THREE.Group();
      craneGroup.position.set(obs.x, obs.y, obs.z);

      // Mast
      const mastGeo = new THREE.BoxGeometry(w, h, d);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = h / 2;
      mast.castShadow = true;
      craneGroup.add(mast);

      // Jib Horizontal Arm
      const jibGeo = new THREE.BoxGeometry(w * 0.8, 1.2, 28);
      const jib = new THREE.Mesh(jibGeo, mastMat);
      jib.position.set(0, h + 0.6, -10);
      jib.castShadow = true;
      craneGroup.add(jib);

      this.levelGroup.add(craneGroup);

      this.physics.addStaticBox(
        new THREE.Vector3(obs.x, obs.y + h / 2, obs.z),
        new THREE.Vector3(w / 2, h / 2, d / 2)
      );
      this.physics.addStaticBox(
        new THREE.Vector3(obs.x, obs.y + h + 0.6, obs.z - 10),
        new THREE.Vector3((w * 0.8) / 2, 0.6, 14)
      );
    }
  }

  private createMovingPlatform(plat: LevelDefinition['movingPlatforms'][0]): void {
    const [w, h, d] = plat.size;
    const group = new THREE.Group();

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: plat.color || 0x00d2ff,
      metalness: 0.7,
      roughness: 0.25,
      emissive: plat.color || 0x00d2ff,
      emissiveIntensity: 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Guard rails
    const railGeo = new THREE.BoxGeometry(w, 0.5, 0.1);
    const railMat = this.metalMat;
    const railFront = new THREE.Mesh(railGeo, railMat);
    railFront.position.set(0, 0.5, d / 2);
    group.add(railFront);

    const railBack = new THREE.Mesh(railGeo, railMat);
    railBack.position.set(0, 0.5, -d / 2);
    group.add(railBack);

    this.levelGroup.add(group);

    const startPos = new THREE.Vector3(...plat.startPos);
    const endPos = new THREE.Vector3(...plat.endPos);

    this.physics.addMovingPlatform(
      group,
      new THREE.Vector3(w / 2, h / 2, d / 2),
      startPos,
      endPos,
      plat.speed
    );
  }

  private createCheckpoint(cp: CheckpointData): void {
    // Holographic Torus Ring
    const ringGeo = new THREE.TorusGeometry(3.2, 0.35, 16, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(cp.x, cp.y, cp.z);
    ring.castShadow = true;
    this.levelGroup.add(ring);

    // Inner pulsating beacon beam
    const glowGeo = new THREE.CylinderGeometry(2.8, 2.8, 0.2, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.set(cp.x, cp.y, cp.z);
    this.levelGroup.add(glowMesh);

    this.activeCheckpoints.push({
      ...cp,
      mesh: ring,
      glowMesh: glowMesh,
      hit: false,
    });
  }

  private createCollectible(item: CollectibleData): void {
    const itemGroup = new THREE.Group();
    itemGroup.position.set(item.x, item.y, item.z);

    // Floating Cyber Data Cube
    const cubeGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d2ff,
      emissiveIntensity: 0.9,
      metalness: 0.8,
      roughness: 0.2,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    itemGroup.add(cube);

    // Orbiting Ring
    const orbitGeo = new THREE.TorusGeometry(0.85, 0.06, 8, 24);
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 3;
    itemGroup.add(orbit);

    this.levelGroup.add(itemGroup);

    this.activeCollectibles.push({
      ...item,
      mesh: itemGroup,
      collected: false,
    });
  }

  private createGrappleAnchor(anc: LevelDefinition['grappleAnchors'][0]): void {
    const anchorGroup = new THREE.Group();
    anchorGroup.position.set(anc.x, anc.y, anc.z);

    // Mast / Pipe mount
    const mastGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.5, 8);
    const mast = new THREE.Mesh(mastGeo, this.metalMat);
    anchorGroup.add(mast);

    // Target Ring with Cyber Glow
    const ringGeo = new THREE.TorusGeometry(1.2, 0.15, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00e5ff,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 1.25;
    anchorGroup.add(ring);

    this.levelGroup.add(anchorGroup);

    this.activeGrappleAnchors.push({
      position: new THREE.Vector3(anc.x, anc.y + 1.25, anc.z),
      mesh: anchorGroup,
    });
  }

  private createInstancedSkyline(): void {
    const count = 90;
    const baseGeo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ color: 0x333d4b });

    this.backgroundSkylineMesh = new THREE.InstancedMesh(baseGeo, mat, count);
    this.backgroundSkylineMesh.castShadow = false;
    this.backgroundSkylineMesh.receiveShadow = false;

    const dummy = new THREE.Object3D();
    const colors = [0x2a3342, 0x1f2733, 0x3b4656, 0x242d3a];

    let instanceIdx = 0;
    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * 550;
      const rz = (Math.random() - 0.5) * 550;

      // Keep playable rooftop center clear
      if (Math.abs(rx) < 65 && Math.abs(rz) < 220) continue;

      const rw = 25 + Math.random() * 30;
      const rh = 40 + Math.random() * 120;
      const rd = 25 + Math.random() * 30;

      dummy.position.set(rx, rh / 2 - 25, rz);
      dummy.scale.set(rw, rh, rd);
      dummy.updateMatrix();

      this.backgroundSkylineMesh.setMatrixAt(instanceIdx, dummy.matrix);
      this.backgroundSkylineMesh.setColorAt(
        instanceIdx,
        new THREE.Color(colors[Math.floor(Math.random() * colors.length)])
      );
      instanceIdx++;
    }

    this.backgroundSkylineMesh.count = instanceIdx;
    this.backgroundSkylineMesh.instanceMatrix.needsUpdate = true;
    if (this.backgroundSkylineMesh.instanceColor) {
      this.backgroundSkylineMesh.instanceColor.needsUpdate = true;
    }
    this.levelGroup.add(this.backgroundSkylineMesh);
  }

  public updateAnimations(deltaTime: number): void {
    const time = performance.now() * 0.002;

    // Rotate Checkpoints
    for (const cp of this.activeCheckpoints) {
      if (!cp.hit) {
        cp.mesh.rotation.z += deltaTime * 1.5;
        cp.glowMesh.scale.setScalar(1.0 + Math.sin(time * 3) * 0.08);
      }
    }

    // Bob and rotate Collectibles
    for (const item of this.activeCollectibles) {
      if (!item.collected) {
        item.mesh.rotation.y += deltaTime * 2.2;
        item.mesh.position.y = item.y + Math.sin(time * 2.5 + item.id) * 0.25;
      }
    }

    // Rotate Grapple Anchor Rings
    for (const anc of this.activeGrappleAnchors) {
      if (anc.mesh) {
        anc.mesh.rotation.y += deltaTime * 1.0;
      }
    }
  }

  public clear(): void {
    this.physics.clear();

    while (this.levelGroup.children.length > 0) {
      const child = this.levelGroup.children[0];
      this.levelGroup.remove(child);
    }

    this.activeCheckpoints = [];
    this.activeCollectibles = [];
    this.activeGrappleAnchors = [];
  }
}
