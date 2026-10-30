/**
 * Global gameplay, physics, and camera configuration for Rooftop Parkour: Apex Flow.
 * Easily tweakable parameters for game feel, acceleration, friction, and mechanics.
 */

export interface GameConfigType {
  physics: {
    gravity: number;
    fixedTimeStep: number;
    maxSubSteps: number;
  };
  movement: {
    walkSpeed: number;
    runSpeed: number;
    sprintSpeed: number;
    slideSpeedBoost: number;
    slideDuration: number;
    slideFriction: number;
    acceleration: number;
    deceleration: number;
    airControl: number;
    jumpForce: number;
    doubleJumpForce: number;
    coyoteTime: number; // in seconds
    jumpBufferTime: number; // in seconds
    maxMomentumMultiplier: number;
    momentumGainPerChain: number;
    momentumDecayRate: number;
  };
  wallrun: {
    minSpeed: number;
    wallRayDistance: number;
    gravityReduction: number;
    durationMax: number;
    jumpUpForce: number;
    jumpAwayForce: number;
    cameraTiltAngle: number; // in radians
  };
  parkour: {
    vaultMaxHeight: number;
    vaultMinHeight: number;
    vaultForwardBoost: number;
    mantleMaxHeight: number;
    mantleMinHeight: number;
    mantleDuration: number;
    rollWindowBeforeLand: number; // in seconds
    hardLandThresholdSpeed: number;
  };
  grapple: {
    maxDistance: number;
    pullSpeed: number;
    swingDamping: number;
  };
  camera: {
    baseFov: number;
    sprintFov: number;
    firstPersonEyeHeight: number;
    thirdPersonOffset: { x: number; y: number; z: number };
    mouseSensitivity: number;
    headBobFrequency: number;
    headBobAmplitude: number;
    rollSmoothSpeed: number;
  };
}

export const GameConfig: GameConfigType = {
  physics: {
    gravity: -28.0,
    fixedTimeStep: 1 / 60,
    maxSubSteps: 3,
  },
  movement: {
    walkSpeed: 7.0,
    runSpeed: 12.0,
    sprintSpeed: 16.5,
    slideSpeedBoost: 5.5,
    slideDuration: 0.85,
    slideFriction: 3.8,
    acceleration: 45.0,
    deceleration: 25.0,
    airControl: 0.45,
    jumpForce: 13.5,
    doubleJumpForce: 12.0,
    coyoteTime: 0.18, // 180ms coyote jump tolerance
    jumpBufferTime: 0.16, // 160ms jump buffer
    maxMomentumMultiplier: 1.85,
    momentumGainPerChain: 0.15,
    momentumDecayRate: 0.65,
  },
  wallrun: {
    minSpeed: 7.5,
    wallRayDistance: 1.25,
    gravityReduction: 0.28, // gravity is reduced to 28% while wall running
    durationMax: 1.75,
    jumpUpForce: 11.5,
    jumpAwayForce: 11.0,
    cameraTiltAngle: 0.22, // ~13 degrees
  },
  parkour: {
    vaultMaxHeight: 1.35,
    vaultMinHeight: 0.6,
    vaultForwardBoost: 10.0,
    mantleMaxHeight: 2.8,
    mantleMinHeight: 1.4,
    mantleDuration: 0.45,
    rollWindowBeforeLand: 0.25,
    hardLandThresholdSpeed: -14.0,
  },
  grapple: {
    maxDistance: 45.0,
    pullSpeed: 24.0,
    swingDamping: 0.985,
  },
  camera: {
    baseFov: 70,
    sprintFov: 88,
    firstPersonEyeHeight: 1.75,
    thirdPersonOffset: { x: 0, y: 2.2, z: 4.8 },
    mouseSensitivity: 0.0022,
    headBobFrequency: 9.5,
    headBobAmplitude: 0.065,
    rollSmoothSpeed: 8.0,
  },
};
