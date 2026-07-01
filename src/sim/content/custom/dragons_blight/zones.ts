import type { ZoneDef } from '../../../types';

// Dragon's Blight -- Zone 4 (zMin:900, immediately after Zone 3's zMax:900).
// The zone system requires strict contiguity (ZONES[i].zMax === ZONES[i+1].zMin).
// If upstream adds a new zone that also starts at z=900, shift this zone northward.
// See docs/MAINTAINING-FORK.md and docs/custom-content/zones.md for the procedure.
export const DRAGONS_BLIGHT_ZONES: ZoneDef[] = [
  {
    id: 'custom_dragons_blight',
    name: "Dragon's Blight",
    zMin: 900, zMax: 1260,
    levelRange: [18, 20],
    biome: 'peaks',
    hub: { x: 0, z: 960, radius: 32, name: 'Blightwatch Post' },
    graveyard: { x: -19, z: 972 },
    lakes: [],
    pois: [
      { x: 0,   z: 960,  label: 'Blightwatch Post' },
      { x: -25, z: 1080, label: "Fenris's Outpost" },
      { x: -48, z: 1190, label: "Dragon's Maw" },
    ],
    welcome: "The Dragon's Blight stretches before you, choked with ash and the distant echo of ancient fire.",
  },
];
