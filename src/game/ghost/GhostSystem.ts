/**
 * Ghost Replay System for Rooftop Parkour: Apex Flow.
 * Records player movement trajectories during speedruns and replays
 * a translucent holographic ghost runner of your personal best run.
 */

import * as THREE from 'three';

export interface GhostFrame {
  time: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface GhostRunData {
  levelId: string;
  totalTime: number;
  characterName: string;
  frames: GhostFrame[];
}

export class GhostSystem {
  private currentRunFrames: GhostFrame[] = [];
  private bestGhostRun: GhostRunData | null = null;
  private isRecording: boolean = false;
  private sampleTimer: number = 0;
  private sampleInterval: number = 0.05; // 20 frames per second recording

  // Holographic Ghost 3D Mesh
  public ghostMesh: THREE.Group;
  private ghostMaterial: THREE.MeshBasicMaterial;
  private isEnabled: boolean = true;

  constructor(scene: THREE.Scene) {
    this.ghostMesh = new THREE.Group();
    this.ghostMesh.name = 'SpeedrunGhostMesh';
    this.ghostMesh.visible = false;

    // Translucent cyan holographic material
    this.ghostMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });

    this.buildGhostVisual();
    scene.add(this.ghostMesh);
  }

  private buildGhostVisual(): void {
    // Holographic runner silhouette
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.85, 0.44);
    const torso = new THREE.Mesh(torsoGeo, this.ghostMaterial);
    torso.position.y = 1.25;
    this.ghostMesh.add(torso);

    const headGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const head = new THREE.Mesh(headGeo, this.ghostMaterial);
    head.position.y = 1.82;
    this.ghostMesh.add(head);

    const legGeo = new THREE.BoxGeometry(0.24, 0.85, 0.24);
    const leftLeg = new THREE.Mesh(legGeo, this.ghostMaterial);
    leftLeg.position.set(-0.2, 0.42, 0);
    this.ghostMesh.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, this.ghostMaterial);
    rightLeg.position.set(0.2, 0.42, 0);
    this.ghostMesh.add(rightLeg);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.ghostMesh.visible = false;
    }
  }

  public loadBestGhost(levelId: string): GhostRunData | null {
    try {
      const dataStr = localStorage.getItem(`apex_flow_ghost_${levelId}`);
      if (dataStr) {
        this.bestGhostRun = JSON.parse(dataStr);
        return this.bestGhostRun;
      }
    } catch {
      // storage error
    }
    this.bestGhostRun = null;
    return null;
  }

  public startRecording(): void {
    this.currentRunFrames = [];
    this.isRecording = true;
    this.sampleTimer = 0;
  }

  public recordFrame(time: number, pos: THREE.Vector3, yaw: number, deltaTime: number): void {
    if (!this.isRecording) return;
    this.sampleTimer += deltaTime;
    if (this.sampleTimer >= this.sampleInterval) {
      this.sampleTimer = 0;
      this.currentRunFrames.push({
        time,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        yaw,
      });
    }
  }

  public finishRun(levelId: string, totalTime: number, characterName: string): boolean {
    this.isRecording = false;

    const previousBestTime = this.bestGhostRun ? this.bestGhostRun.totalTime : Infinity;
    const isNewRecord = totalTime < previousBestTime;

    if (isNewRecord && this.currentRunFrames.length > 0) {
      const newGhost: GhostRunData = {
        levelId,
        totalTime,
        characterName,
        frames: this.currentRunFrames,
      };
      this.bestGhostRun = newGhost;
      try {
        localStorage.setItem(`apex_flow_ghost_${levelId}`, JSON.stringify(newGhost));
      } catch {
        // quota exceeded
      }
      return true;
    }

    return false;
  }

  public updatePlayback(currentTime: number): void {
    if (!this.isEnabled || !this.bestGhostRun || this.bestGhostRun.frames.length < 2) {
      this.ghostMesh.visible = false;
      return;
    }

    const frames = this.bestGhostRun.frames;

    // If current time exceeds ghost run time, hide ghost
    if (currentTime > this.bestGhostRun.totalTime) {
      this.ghostMesh.visible = false;
      return;
    }

    this.ghostMesh.visible = true;

    // Find the two adjacent keyframes
    let idx = 0;
    while (idx < frames.length - 1 && frames[idx + 1].time < currentTime) {
      idx++;
    }

    const f1 = frames[idx];
    const f2 = frames[Math.min(frames.length - 1, idx + 1)];

    const span = f2.time - f1.time;
    const alpha = span > 0 ? (currentTime - f1.time) / span : 0;
    const clampedAlpha = Math.max(0, Math.min(1, alpha));

    // Linear interpolation between ghost positions
    const gx = THREE.MathUtils.lerp(f1.x, f2.x, clampedAlpha);
    const gy = THREE.MathUtils.lerp(f1.y, f2.y, clampedAlpha);
    const gz = THREE.MathUtils.lerp(f1.z, f2.z, clampedAlpha);
    const gyaw = THREE.MathUtils.lerp(f1.yaw, f2.yaw, clampedAlpha);

    this.ghostMesh.position.set(gx, gy - 0.7, gz);
    this.ghostMesh.rotation.y = gyaw;
  }
}
