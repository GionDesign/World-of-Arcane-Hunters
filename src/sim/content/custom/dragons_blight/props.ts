import type { GroundObjectDef, ZonePropsDef } from '../../../types';

export const DRAGONS_BLIGHT_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'inn',   x: 0,   z: 962, w: 12, d: 10, rot: 0 },
    { kind: 'house', x: -18, z: 958, w: 10, d: 8,  rot: 0 },
  ],
  wells:  [{ x: 8, z: 955, r: 1.5 }, { x: -111, z: 1128, r: 1.5 }],
  stalls: [{ x: 16, z: 960, rot: Math.PI / 2, r: 2.5 }],
  tents:  [{ x: -22, z: 1082, rot: 0, scale: 1.0 }, { x: -109, z: 1122, rot: 5, scale: 1.0 }],
  campfires: [
    [0,    972],
    [-22,  1086],
    [-101, 1130],
  ],
  crates: [
    [20,   958],
    [-15,  963],
    [-101, 1126],
    [-99,  1128],
    [-99,  1124],
    [-99,  1133],
    [-101, 1134],
  ],
  fences: [
    { x1: -99, z1: 1136, x2: -108, z2: 1141 },
    { x1: -98, z1: 1141, x2: -98,  z2: 1123 },
    { x1: -98, z1: 1123, x2: -108, z2: 1118 },
    { x1: -108, z1: 1118, x2: -118, z2: 1124 },
  ],
  mines:     [{ x: 150, z: 1000, rot: 4.55 }],
  docks:     [],
  mudHuts:   [],
  ruinRings: [{ x: -50, z: 1140, ringR: 18, columns: 6 }],
  graveyards: [{ x: -19, z: 972 }],
};

export const DRAGONS_BLIGHT_OBJECTS: GroundObjectDef[] = [];

export const DRAGONS_BLIGHT_ROADS: { x: number; z: number }[][] = [
  // Main road from zone entry into Blightwatch Post
  [
    { x: 0,  z: 900 },
    { x: 2,  z: 930 },
    { x: 0,  z: 960 },
  ],
  // Scout trail from hub north to Fenris's outpost
  [
    { x: 0,   z: 960  },
    { x: -8,  z: 1000 },
    { x: -15, z: 1040 },
    { x: -22, z: 1080 },
  ],
  // Path from scout outpost to Dragon's Maw dungeon entrance
  [
    { x: -22, z: 1080 },
    { x: -30, z: 1120 },
    { x: -40, z: 1160 },
    { x: -48, z: 1190 },
  ],
  // Path to mystery ruin in the west
  [
    { x: -13, z: 1041 },
    { x: 13,  z: 1052 },
    { x: 28,  z: 1037 },
    { x: 47,  z: 1023 },
    { x: 108, z: 1023 },
    { x: 108, z: 1040 },
    { x: 150, z: 1000 },
  ],
];
