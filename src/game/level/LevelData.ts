/**
 * Structured Level Data for Rooftop Parkour: Apex Flow.
 * 3 Levels with increasing difficulty, obstacles, moving platforms, and grapple points.
 */

export interface RooftopBuildingData {
  x: number;
  y: number; // base Y or top Y computed from height
  z: number;
  w: number;
  d: number;
  h: number;
  roofColor?: number;
  facadeColor?: number;
}

export interface ObstacleData {
  type: 'ac_unit' | 'pipe' | 'vent' | 'billboard' | 'water_tower' | 'crane';
  x: number;
  y: number;
  z: number;
  w?: number;
  h?: number;
  d?: number;
  rotationY?: number;
}

export interface MovingPlatformDef {
  startPos: [number, number, number];
  endPos: [number, number, number];
  size: [number, number, number];
  speed: number;
  color?: number;
}

export interface CheckpointData {
  id: number;
  x: number;
  y: number;
  z: number;
  name: string;
}

export interface CollectibleData {
  id: number;
  x: number;
  y: number;
  z: number;
  name: string;
  points: number;
}

export interface GrappleAnchorData {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface LevelDefinition {
  id: string;
  name: string;
  subtitle: string;
  difficulty: 'ROOKIE' | 'VETERAN' | 'APEX';
  parTime: number; // seconds
  startPosition: [number, number, number];
  buildings: RooftopBuildingData[];
  obstacles: ObstacleData[];
  movingPlatforms: MovingPlatformDef[];
  checkpoints: CheckpointData[];
  collectibles: CollectibleData[];
  grappleAnchors: GrappleAnchorData[];
}

export const LEVELS: LevelDefinition[] = [
  // ================= LEVEL 1: NEON SKYLINE =================
  {
    id: 'level_1',
    name: 'NEON SKYLINE',
    subtitle: 'Rookie Run • Core Momentum & Vaults',
    difficulty: 'ROOKIE',
    parTime: 45.0,
    startPosition: [0, 42, 10],
    buildings: [
      { x: 0, y: 0, z: 0, w: 26, d: 34, h: 40, roofColor: 0x9e5239 },
      { x: 0, y: 0, z: -48, w: 24, d: 30, h: 41, roofColor: 0x48525e },
      { x: -30, y: 0, z: -86, w: 26, d: 32, h: 43, roofColor: 0x9e5239 },
      { x: 0, y: 0, z: -130, w: 28, d: 36, h: 44, roofColor: 0x3d4a58 },
      { x: 0, y: 0, z: -180, w: 32, d: 38, h: 45, roofColor: 0xb56345 },
    ],
    obstacles: [
      // Vault AC units on Building 1
      { type: 'ac_unit', x: 0, y: 41, z: 2, w: 2.5, h: 1.2, d: 2.2 },
      { type: 'ac_unit', x: -4, y: 41, z: -8, w: 2.4, h: 1.2, d: 2.0 },
      // Billboard Wall-Run on gap between Building 1 and 2
      { type: 'billboard', x: 12, y: 45, z: -32, w: 2.0, h: 8.0, d: 22, rotationY: 0 },
      // Building 2 pipes & vents
      { type: 'pipe', x: 0, y: 42, z: -48, w: 20, h: 1.0, d: 1.0 },
      { type: 'ac_unit', x: 5, y: 42.5, z: -55, w: 2.5, h: 1.3, d: 2.5 },
      // Billboard for Wall Run to Building 3
      { type: 'billboard', x: -14, y: 46, z: -68, w: 18, h: 8.0, d: 2.0, rotationY: 0.5 },
      // Water tower on final roof
      { type: 'water_tower', x: 8, y: 47, z: -180, w: 4, h: 7, d: 4 },
    ],
    movingPlatforms: [
      // Gentle floating maintenance platform across chasm to final roof
      {
        startPos: [0, 44.5, -145],
        endPos: [0, 44.5, -165],
        size: [6, 0.8, 6],
        speed: 1.2,
        color: 0xffaa00,
      },
    ],
    checkpoints: [
      { id: 1, x: 0, y: 42.5, z: 0, name: 'STARTING ROOF' },
      { id: 2, x: 0, y: 43.5, z: -48, name: 'SOLAR DECK' },
      { id: 3, x: -30, y: 45.5, z: -86, name: 'WEST MEZZANINE' },
      { id: 4, x: 0, y: 46.5, z: -130, name: 'ANTENNA SPIRE' },
      { id: 5, x: 0, y: 47.5, z: -180, name: 'GOAL ROOFTOP' },
    ],
    collectibles: [
      { id: 1, x: -5, y: 42.5, z: -4, name: 'Flow Orb 1', points: 100 },
      { id: 2, x: 12, y: 47.0, z: -32, name: 'Wall-Run Spray Can', points: 250 },
      { id: 3, x: -33, y: 45.0, z: -86, name: 'Cyber Data Chip', points: 150 },
      { id: 4, x: 0, y: 46.5, z: -155, name: 'Skyway Core', points: 300 },
    ],
    grappleAnchors: [
      { id: 1, x: 12, y: 52, z: -32 },
      { id: 2, x: 0, y: 54, z: -155 },
    ],
  },

  // ================= LEVEL 2: DISTRICT 9 =================
  {
    id: 'level_2',
    name: 'DISTRICT 9',
    subtitle: 'Industrial Vertigo • Cranes & Precision Pipes',
    difficulty: 'VETERAN',
    parTime: 55.0,
    startPosition: [0, 46, 12],
    buildings: [
      { x: 0, y: 0, z: 0, w: 24, d: 30, h: 44, roofColor: 0x3d4a58 },
      { x: 28, y: 0, z: -45, w: 22, d: 28, h: 47, roofColor: 0x9e5239 },
      { x: -25, y: 0, z: -90, w: 26, d: 26, h: 50, roofColor: 0x2e3846 },
      { x: 15, y: 0, z: -140, w: 24, d: 32, h: 52, roofColor: 0x8a452c },
      { x: -10, y: 0, z: -195, w: 30, d: 35, h: 54, roofColor: 0x3d4a58 },
    ],
    obstacles: [
      // High AC vents requiring mantle
      { type: 'vent', x: 0, y: 45.5, z: -5, w: 3.5, h: 2.2, d: 3.5 },
      // Balance Pipe run between buildings
      { type: 'pipe', x: 14, y: 46.5, z: -22, w: 1.4, h: 0.8, d: 24 },
      // Massive industrial crane
      { type: 'crane', x: 30, y: 52, z: -45, w: 3, h: 14, d: 3 },
      // Double Wall-Run billboards in chasm
      { type: 'billboard', x: 4, y: 51, z: -68, w: 1.5, h: 9.0, d: 25 },
      { type: 'billboard', x: -6, y: 51, z: -68, w: 1.5, h: 9.0, d: 25 },
      // Water tower
      { type: 'water_tower', x: -28, y: 53, z: -95, w: 4.5, h: 8, d: 4.5 },
    ],
    movingPlatforms: [
      // Swinging Industrial Crane Hoist Platform
      {
        startPos: [2, 51.0, -112],
        endPos: [2, 51.0, -126],
        size: [7, 0.8, 7],
        speed: 1.6,
        color: 0x00d2ff,
      },
      // Vertical lift platform
      {
        startPos: [15, 52.5, -165],
        endPos: [0, 55.0, -180],
        size: [6, 0.8, 6],
        speed: 1.4,
        color: 0xff3b30,
      },
    ],
    checkpoints: [
      { id: 1, x: 0, y: 46.5, z: 0, name: 'FACTORY ALPHA' },
      { id: 2, x: 28, y: 49.5, z: -45, name: 'CRANE DEPOT' },
      { id: 3, x: -25, y: 52.5, z: -90, name: 'WATER TOWER SUMMIT' },
      { id: 4, x: 15, y: 54.5, z: -140, name: 'SKY GANTRY' },
      { id: 5, x: -10, y: 56.5, z: -195, name: 'REFINERY GOAL' },
    ],
    collectibles: [
      { id: 1, x: 14, y: 47.5, z: -22, name: 'Pipe Master Core', points: 150 },
      { id: 2, x: 30, y: 58.0, z: -45, name: 'Crane Jib Trophy', points: 300 },
      { id: 3, x: -6, y: 54.0, z: -68, name: 'Wall Scuff Tag', points: 200 },
      { id: 4, x: 2, y: 53.0, z: -119, name: 'Crane Hoist Relic', points: 250 },
      { id: 5, x: 15, y: 57.0, z: -165, name: 'Industrial Vapor', points: 200 },
    ],
    grappleAnchors: [
      { id: 1, x: 30, y: 62, z: -45 },
      { id: 2, x: -28, y: 61, z: -95 },
      { id: 3, x: 2, y: 63, z: -119 },
      { id: 4, x: 0, y: 64, z: -175 },
    ],
  },

  // ================= LEVEL 3: APEX SPIRE =================
  {
    id: 'level_3',
    name: 'APEX SPIRE',
    subtitle: 'Cyber Chasm • Skyward Grapple & Apex Momentum',
    difficulty: 'APEX',
    parTime: 70.0,
    startPosition: [0, 52, 10],
    buildings: [
      { x: 0, y: 0, z: 0, w: 22, d: 26, h: 50, roofColor: 0x1f242e },
      { x: -35, y: 0, z: -50, w: 20, d: 24, h: 54, roofColor: 0x9e5239 },
      { x: 30, y: 0, z: -105, w: 24, d: 28, h: 58, roofColor: 0x1f242e },
      { x: -20, y: 0, z: -165, w: 22, d: 26, h: 63, roofColor: 0x48525e },
      { x: 25, y: 0, z: -225, w: 26, d: 30, h: 68, roofColor: 0x9e5239 },
      { x: 0, y: 0, z: -290, w: 34, d: 40, h: 74, roofColor: 0x00d2ff },
    ],
    obstacles: [
      { type: 'vent', x: 0, y: 51.5, z: -4, w: 4, h: 2.5, d: 4 },
      // Huge cyber wall between B1 and B2
      { type: 'billboard', x: -16, y: 56, z: -24, w: 2.0, h: 10.0, d: 28 },
      // Twin high-rise billboards
      { type: 'billboard', x: -4, y: 61, z: -76, w: 2.0, h: 12.0, d: 30 },
      // Spire Crane
      { type: 'crane', x: 30, y: 64, z: -105, w: 4, h: 18, d: 4 },
      // Antenna Array on B4
      { type: 'water_tower', x: -20, y: 67, z: -165, w: 5, h: 10, d: 5 },
    ],
    movingPlatforms: [
      // High-speed aerial transport platform
      {
        startPos: [5, 60.0, -130],
        endPos: [5, 62.0, -150],
        size: [6, 0.8, 6],
        speed: 1.8,
        color: 0xa855f7,
      },
      // Giant swinging skyway platform
      {
        startPos: [4, 66.0, -190],
        endPos: [20, 67.0, -210],
        size: [7, 0.8, 7],
        speed: 1.7,
        color: 0x00f0ff,
      },
      // Apex Spire final ascent lift
      {
        startPos: [12, 70.0, -255],
        endPos: [0, 75.0, -270],
        size: [8, 0.8, 8],
        speed: 2.0,
        color: 0xffaa00,
      },
    ],
    checkpoints: [
      { id: 1, x: 0, y: 52.5, z: 0, name: 'APEX LOWER PAD' },
      { id: 2, x: -35, y: 56.5, z: -50, name: 'WEST CYBER BALCONY' },
      { id: 3, x: 30, y: 60.5, z: -105, name: 'SPIRE CRANE JIB' },
      { id: 4, x: -20, y: 65.5, z: -165, name: 'SKYWAY JUNCTION' },
      { id: 5, x: 25, y: 70.5, z: -225, name: 'STRATOSPHERE PLATFORM' },
      { id: 6, x: 0, y: 76.5, z: -290, name: 'APEX PINNACLE' },
    ],
    collectibles: [
      { id: 1, x: -16, y: 59.0, z: -24, name: 'High-Altitude Tag', points: 300 },
      { id: 2, x: -4, y: 64.0, z: -76, name: 'Vertigo Data Cube', points: 400 },
      { id: 3, x: 30, y: 75.0, z: -105, name: 'Apex Spire Crown', points: 500 },
      { id: 4, x: 5, y: 63.0, z: -140, name: 'Zipline Core', points: 350 },
      { id: 5, x: 4, y: 68.0, z: -200, name: 'Plasma Battery', points: 400 },
      { id: 6, x: 0, y: 78.5, z: -290, name: 'APEX CHAMPION TROPHY', points: 1000 },
    ],
    grappleAnchors: [
      { id: 1, x: -16, y: 66, z: -24 },
      { id: 2, x: -4, y: 72, z: -76 },
      { id: 3, x: 30, y: 78, z: -105 },
      { id: 4, x: -20, y: 76, z: -165 },
      { id: 5, x: 12, y: 78, z: -240 },
      { id: 6, x: 0, y: 86, z: -285 },
    ],
  },
];
