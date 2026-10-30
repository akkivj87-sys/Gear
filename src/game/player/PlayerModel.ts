/**
 * High-detail procedural 3D Parkour Athlete Model.
 * Composed of 10+ distinct hierarchical parts:
 * - Oversized hoodie torso with zipper & collar accent
 * - Tactical courier runner pack with reflective buckles
 * - Head with athletic visor / cap
 * - Multi-joint arms with wrist guards & fingerless parkour gloves
 * - Articulated legs with cargo pockets & high-top rubber sneakers
 * - Cyber neon accent trims matching specialist colors
 * - Supports procedural kinematic IK-like running, sliding, vaulting, and rolling.
 */

import * as THREE from 'three';
import { CharacterArchetype } from '../config/Characters';
import { MovementState } from '../state/StateMachine';

export class PlayerModel {
  public group: THREE.Group;
  public fpGroup: THREE.Group; // First person hands rig

  // Third Person Limb References
  private hips: THREE.Group;
  private torsoMesh!: THREE.Mesh;
  private headGroup!: THREE.Group;
  private leftArmGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private leftLegGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;
  private backpackMesh!: THREE.Mesh;

  // First Person Arms
  private fpLeftArm!: THREE.Group;
  private fpRightArm!: THREE.Group;

  // Materials for archetype coloring
  private jacketMat!: THREE.MeshStandardMaterial;
  private pantsMat!: THREE.MeshStandardMaterial;
  private skinMat!: THREE.MeshStandardMaterial;
  private accentMat!: THREE.MeshStandardMaterial;
  private shoeMat!: THREE.MeshStandardMaterial;
  private gloveMat!: THREE.MeshStandardMaterial;

  private archetype!: CharacterArchetype;
  private animTimer: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'PlayerThirdPersonModel';

    this.fpGroup = new THREE.Group();
    this.fpGroup.name = 'PlayerFirstPersonRig';

    this.hips = new THREE.Group();
    this.group.add(this.hips);
  }

  public build(archetype: CharacterArchetype): void {
    this.archetype = archetype;

    // Clear existing children
    while (this.hips.children.length > 0) {
      this.hips.remove(this.hips.children[0]);
    }
    while (this.fpGroup.children.length > 0) {
      this.fpGroup.remove(this.fpGroup.children[0]);
    }

    // Initialize Materials with physical PBR properties
    this.jacketMat = new THREE.MeshStandardMaterial({
      color: archetype.colors.jacket,
      roughness: 0.65,
      metalness: 0.15,
    });

    this.pantsMat = new THREE.MeshStandardMaterial({
      color: archetype.colors.pants,
      roughness: 0.75,
      metalness: 0.05,
    });

    this.skinMat = new THREE.MeshStandardMaterial({
      color: archetype.colors.body,
      roughness: 0.55,
      metalness: 0.0,
    });

    this.accentMat = new THREE.MeshStandardMaterial({
      color: archetype.colors.accent,
      emissive: archetype.colors.glow,
      emissiveIntensity: 0.65,
      roughness: 0.3,
      metalness: 0.5,
    });

    this.shoeMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
      metalness: 0.2,
    });

    this.gloveMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.5,
      metalness: 0.3,
    });

    this.buildThirdPersonMesh();
    this.buildFirstPersonMesh();
  }

  private buildThirdPersonMesh(): void {
    // 1. Torso & Hoodie
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.85, 0.44);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.jacketMat);
    this.torsoMesh.position.y = 1.25;
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.hips.add(this.torsoMesh);

    // Accent Zipper & Cyber Stripe
    const stripeGeo = new THREE.BoxGeometry(0.08, 0.84, 0.02);
    const stripeMesh = new THREE.Mesh(stripeGeo, this.accentMat);
    stripeMesh.position.set(0, 0, 0.23);
    this.torsoMesh.add(stripeMesh);

    // 2. Torso Accessories / Packs
    if (this.archetype.id === 'rebel' || this.archetype.id === 'thinker') {
      // Tactical Courier Backpack
      const packGeo = new THREE.BoxGeometry(0.48, 0.62, 0.24);
      this.backpackMesh = new THREE.Mesh(packGeo, this.gloveMat);
      this.backpackMesh.position.set(0, 1.3, -0.32);
      this.backpackMesh.castShadow = true;
      this.hips.add(this.backpackMesh);

      const buckleGeo = new THREE.BoxGeometry(0.3, 0.06, 0.04);
      const buckleMesh = new THREE.Mesh(buckleGeo, this.accentMat);
      buckleMesh.position.set(0, 0, -0.13);
      this.backpackMesh.add(buckleMesh);
    } else if (this.archetype.id === 'brawler') {
      // High-Collar Tactical Windbreaker & Chest Rig Harness
      const collarGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.22, 12, 1, true);
      const collarMesh = new THREE.Mesh(collarGeo, this.jacketMat);
      collarMesh.position.set(0, 1.7, 0.02);
      this.hips.add(collarMesh);

      // Harness Cross Straps
      const strapGeo = new THREE.BoxGeometry(0.65, 0.08, 0.04);
      const strap1 = new THREE.Mesh(strapGeo, this.gloveMat);
      strap1.position.set(0, 1.4, 0.23);
      strap1.rotation.z = 0.45;
      this.hips.add(strap1);

      const strap2 = new THREE.Mesh(strapGeo, this.gloveMat);
      strap2.position.set(0, 1.4, 0.23);
      strap2.rotation.z = -0.45;
      this.hips.add(strap2);
    } else if (this.archetype.id === 'free_spirit') {
      // Front Cross-Body Chest Sling Bag
      const slingGeo = new THREE.BoxGeometry(0.38, 0.26, 0.16);
      const slingMesh = new THREE.Mesh(slingGeo, this.gloveMat);
      slingMesh.position.set(0.08, 1.32, 0.28);
      slingMesh.rotation.z = -0.2;
      this.hips.add(slingMesh);

      // Sling Strap
      const strapGeo = new THREE.BoxGeometry(0.75, 0.06, 0.03);
      const strapMesh = new THREE.Mesh(strapGeo, this.gloveMat);
      strapMesh.position.set(0, 1.35, 0.23);
      strapMesh.rotation.z = 0.55;
      this.hips.add(strapMesh);
    }

    // 3. Head & Specialist Accessories
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.82, 0);

    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, this.skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Hair / Headgear based on Artwork
    if (this.archetype.id === 'thinker') {
      // Grey Knit Beanie
      const beanieGeo = new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
      const beanieMat = new THREE.MeshStandardMaterial({
        color: this.archetype.colors.beanie || 0x3d4349,
        roughness: 0.9,
      });
      const beanieMesh = new THREE.Mesh(beanieGeo, beanieMat);
      beanieMesh.position.y = 0.04;
      this.headGroup.add(beanieMesh);
    } else if (this.archetype.id === 'rebel') {
      // Dark Messy Hair + Sunglasses
      const hairGeo = new THREE.SphereGeometry(0.25, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.9 });
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      hairMesh.position.y = 0.05;
      this.headGroup.add(hairMesh);

      // Dark Sunglasses
      const shadesGeo = new THREE.BoxGeometry(0.34, 0.08, 0.06);
      const shadesMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.8 });
      const shadesMesh = new THREE.Mesh(shadesGeo, shadesMat);
      shadesMesh.position.set(0, 0.02, 0.22);
      this.headGroup.add(shadesMesh);
    } else if (this.archetype.id === 'free_spirit') {
      // Flowing Hair + DJ Headphones resting around neck
      const hairGeo = new THREE.SphereGeometry(0.26, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.85 });
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      hairMesh.position.y = 0.06;
      this.headGroup.add(hairMesh);

      // Over-Ear Headphones around neck
      const padGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
      const leftPad = new THREE.Mesh(padGeo, padMat);
      leftPad.rotation.z = Math.PI / 2;
      leftPad.position.set(-0.25, -0.22, 0.05);
      this.headGroup.add(leftPad);

      const rightPad = new THREE.Mesh(padGeo, padMat);
      rightPad.rotation.z = Math.PI / 2;
      rightPad.position.set(0.25, -0.22, 0.05);
      this.headGroup.add(rightPad);
    } else if (this.archetype.id === 'brawler') {
      // Spiky Dark Hair
      const hairGeo = new THREE.SphereGeometry(0.26, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 });
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      hairMesh.position.y = 0.06;
      this.headGroup.add(hairMesh);
    }

    this.hips.add(this.headGroup);

    // 4. Arms
    this.leftArmGroup = this.createArm(-0.46, true);
    this.rightArmGroup = this.createArm(0.46, false);
    this.hips.add(this.leftArmGroup);
    this.hips.add(this.rightArmGroup);

    // 5. Legs
    this.leftLegGroup = this.createLeg(-0.2, true);
    this.rightLegGroup = this.createLeg(0.2, false);
    this.hips.add(this.leftLegGroup);
    this.hips.add(this.rightLegGroup);
  }

  private createArm(xOffset: number, isLeft: boolean): THREE.Group {
    const armRoot = new THREE.Group();
    armRoot.position.set(xOffset, 1.55, 0);

    // Upper Arm
    const upperGeo = new THREE.BoxGeometry(0.2, 0.42, 0.2);
    const upperMesh = new THREE.Mesh(upperGeo, this.jacketMat);
    upperMesh.position.y = -0.2;
    upperMesh.castShadow = true;
    armRoot.add(upperMesh);

    // Forearm & Glove
    const forearmGeo = new THREE.BoxGeometry(0.18, 0.44, 0.18);
    const forearmMesh = new THREE.Mesh(forearmGeo, this.skinMat);
    forearmMesh.position.y = -0.58;
    forearmMesh.castShadow = true;
    armRoot.add(forearmMesh);

    // Parkour Glove
    const gloveGeo = new THREE.BoxGeometry(0.2, 0.22, 0.2);
    const gloveMesh = new THREE.Mesh(gloveGeo, this.gloveMat);
    gloveMesh.position.y = -0.7;
    gloveMesh.castShadow = true;
    armRoot.add(gloveMesh);

    // Accent Wrist Band
    const bandGeo = new THREE.BoxGeometry(0.21, 0.06, 0.21);
    const bandMesh = new THREE.Mesh(bandGeo, this.accentMat);
    bandMesh.position.y = -0.58;
    armRoot.add(bandMesh);

    return armRoot;
  }

  private createLeg(xOffset: number, isLeft: boolean): THREE.Group {
    const legRoot = new THREE.Group();
    legRoot.position.set(xOffset, 0.85, 0);

    // Thigh
    const thighGeo = new THREE.BoxGeometry(0.24, 0.45, 0.24);
    const thighMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    thighMesh.position.y = -0.22;
    thighMesh.castShadow = true;
    legRoot.add(thighMesh);

    // Cargo Pocket
    const pocketGeo = new THREE.BoxGeometry(0.08, 0.2, 0.18);
    const pocketMesh = new THREE.Mesh(pocketGeo, this.pantsMat);
    pocketMesh.position.set(isLeft ? -0.14 : 0.14, -0.22, 0);
    legRoot.add(pocketMesh);

    // Calf
    const calfGeo = new THREE.BoxGeometry(0.22, 0.42, 0.22);
    const calfMesh = new THREE.Mesh(calfGeo, this.pantsMat);
    calfMesh.position.y = -0.58;
    calfMesh.castShadow = true;
    legRoot.add(calfMesh);

    // High-top Parkour Sneaker
    const shoeGeo = new THREE.BoxGeometry(0.24, 0.18, 0.42);
    const shoeMesh = new THREE.Mesh(shoeGeo, this.shoeMat);
    shoeMesh.position.set(0, -0.8, 0.07);
    shoeMesh.castShadow = true;
    legRoot.add(shoeMesh);

    // Sneaker Sole (Grippy rubber)
    const soleGeo = new THREE.BoxGeometry(0.26, 0.05, 0.44);
    const soleMesh = new THREE.Mesh(soleGeo, this.accentMat);
    soleMesh.position.set(0, -0.88, 0.07);
    legRoot.add(soleMesh);

    return legRoot;
  }

  private buildFirstPersonMesh(): void {
    // Left Arm
    this.fpLeftArm = new THREE.Group();
    this.fpLeftArm.position.set(-0.38, -0.25, -0.55);

    const fForearmGeo = new THREE.BoxGeometry(0.14, 0.14, 0.48);
    const fForearm = new THREE.Mesh(fForearmGeo, this.jacketMat);
    fForearm.position.z = -0.15;
    this.fpLeftArm.add(fForearm);

    const fGloveGeo = new THREE.BoxGeometry(0.15, 0.15, 0.22);
    const fGlove = new THREE.Mesh(fGloveGeo, this.gloveMat);
    fGlove.position.z = -0.38;
    this.fpLeftArm.add(fGlove);

    const fAccentGeo = new THREE.BoxGeometry(0.16, 0.04, 0.08);
    const fAccent = new THREE.Mesh(fAccentGeo, this.accentMat);
    fAccent.position.set(0, 0.07, -0.32);
    this.fpLeftArm.add(fAccent);

    // Right Arm
    this.fpRightArm = new THREE.Group();
    this.fpRightArm.position.set(0.38, -0.25, -0.55);

    const fForearmR = new THREE.Mesh(fForearmGeo, this.jacketMat);
    fForearmR.position.z = -0.15;
    this.fpRightArm.add(fForearmR);

    const fGloveR = new THREE.Mesh(fGloveGeo, this.gloveMat);
    fGloveR.position.z = -0.38;
    this.fpRightArm.add(fGloveR);

    const fAccentR = new THREE.Mesh(fAccentGeo, this.accentMat);
    fAccentR.position.set(0, 0.07, -0.32);
    this.fpRightArm.add(fAccentR);

    this.fpGroup.add(this.fpLeftArm);
    this.fpGroup.add(this.fpRightArm);
  }

  public updateAnimation(
    state: MovementState,
    speed: number,
    deltaTime: number,
    isFirstPerson: boolean
  ): void {
    this.animTimer += deltaTime * Math.max(1.0, speed * 0.8);

    // Toggle visibility between first person arms & full body
    this.hips.visible = !isFirstPerson;
    this.fpGroup.visible = isFirstPerson;

    const cycle = Math.sin(this.animTimer * 10);
    const cycleCos = Math.cos(this.animTimer * 10);

    if (state === 'IDLE') {
      const breath = Math.sin(performance.now() * 0.0025) * 0.03;
      this.hips.position.y = breath;
      this.torsoMesh.rotation.x = 0;
      this.leftArmGroup.rotation.set(0, 0, 0.1);
      this.rightArmGroup.rotation.set(0, 0, -0.1);
      this.leftLegGroup.rotation.set(0, 0, 0);
      this.rightLegGroup.rotation.set(0, 0, 0);

      if (isFirstPerson) {
        this.fpLeftArm.position.y = -0.25 + breath;
        this.fpRightArm.position.y = -0.25 + breath;
        this.fpLeftArm.rotation.set(0, 0, 0);
        this.fpRightArm.rotation.set(0, 0, 0);
      }
    } else if (state === 'WALK' || state === 'RUN' || state === 'SPRINT') {
      const stride = state === 'SPRINT' ? 1.05 : state === 'RUN' ? 0.75 : 0.45;
      this.hips.position.y = Math.abs(cycle) * 0.08;

      // Forward lean based on speed
      this.torsoMesh.rotation.x = stride * 0.22;

      // Alternating legs and arms
      this.leftLegGroup.rotation.x = cycle * stride;
      this.rightLegGroup.rotation.x = -cycle * stride;
      this.leftArmGroup.rotation.x = -cycle * stride * 0.8;
      this.rightArmGroup.rotation.x = cycle * stride * 0.8;

      if (isFirstPerson) {
        // Natural runner hand pump in first person
        this.fpLeftArm.position.y = -0.25 + cycle * 0.05;
        this.fpLeftArm.position.z = -0.55 + cycleCos * 0.08;
        this.fpRightArm.position.y = -0.25 - cycle * 0.05;
        this.fpRightArm.position.z = -0.55 - cycleCos * 0.08;
      }
    } else if (state === 'SLIDE') {
      // Low profile slide pose
      this.hips.position.y = -0.45;
      this.torsoMesh.rotation.x = -0.4; // Lean torso backward
      this.leftLegGroup.rotation.set(-1.1, 0, 0.2); // Left leg extended forward
      this.rightLegGroup.rotation.set(-0.7, 0, -0.2);
      this.leftArmGroup.rotation.set(0.6, 0, 0.3); // Ground brace arm
      this.rightArmGroup.rotation.set(-0.5, 0, -0.2);

      if (isFirstPerson) {
        this.fpLeftArm.position.set(-0.35, -0.38, -0.4);
        this.fpRightArm.position.set(0.35, -0.15, -0.5);
      }
    } else if (state === 'JUMP' || state === 'DOUBLE_JUMP') {
      this.hips.position.y = 0.1;
      this.leftLegGroup.rotation.set(0.45, 0, 0.1); // Tucked knees
      this.rightLegGroup.rotation.set(0.35, 0, -0.1);
      this.leftArmGroup.rotation.set(-0.9, 0, 0.3); // Arms high for air balance
      this.rightArmGroup.rotation.set(-0.9, 0, -0.3);

      if (isFirstPerson) {
        this.fpLeftArm.position.set(-0.38, -0.1, -0.45);
        this.fpRightArm.position.set(0.38, -0.1, -0.45);
      }
    } else if (state === 'FALL') {
      this.hips.position.y = 0;
      this.leftLegGroup.rotation.set(0.2, 0, 0.15);
      this.rightLegGroup.rotation.set(0.2, 0, -0.15);
      this.leftArmGroup.rotation.set(-0.5, 0, 0.4);
      this.rightArmGroup.rotation.set(-0.5, 0, -0.4);
    } else if (state === 'WALL_RUN') {
      this.torsoMesh.rotation.z = 0.25;
      this.leftLegGroup.rotation.set(-0.4, 0, 0.3);
      this.rightLegGroup.rotation.set(0.4, 0, -0.3);
      this.leftArmGroup.rotation.set(0.2, 0, 0.5);
      this.rightArmGroup.rotation.set(-0.3, 0, -0.2);
    } else if (state === 'VAULT' || state === 'MANTLE') {
      // Climbing pull-up pose
      this.leftArmGroup.rotation.set(-1.4, 0, 0.2);
      this.rightArmGroup.rotation.set(-1.4, 0, -0.2);
      this.leftLegGroup.rotation.set(0.8, 0, 0);
      this.rightLegGroup.rotation.set(0.5, 0, 0);

      if (isFirstPerson) {
        this.fpLeftArm.position.set(-0.3, 0.05, -0.4);
        this.fpRightArm.position.set(0.3, 0.05, -0.4);
      }
    } else if (state === 'ROLL') {
      // Tucked roll
      this.hips.position.y = -0.3;
      this.leftLegGroup.rotation.set(1.4, 0, 0);
      this.rightLegGroup.rotation.set(1.4, 0, 0);
      this.leftArmGroup.rotation.set(1.2, 0, 0);
      this.rightArmGroup.rotation.set(1.2, 0, 0);
    } else if (state === 'GRAPPLE') {
      this.leftArmGroup.rotation.set(-1.6, 0, 0.1);
      this.rightArmGroup.rotation.set(-0.8, 0, -0.3);
    }
  }

  public setRotationY(angle: number): void {
    this.group.rotation.y = angle;
  }

  public setRollAngle(angle: number): void {
    this.group.rotation.z = angle;
  }

  public setPitchAngle(angle: number): void {
    this.group.rotation.x = angle;
  }
}
