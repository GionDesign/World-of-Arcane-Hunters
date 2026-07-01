import type { CampDef } from '../../../types';

// IMPORTANT: Never reorder or insert camps before existing entries.
// Each camp draws from the secondary customRng stream in array position order.
// Reordering shifts every subsequent camp's spawn positions.
// New camps must always be appended at the END.
export const DRAGONS_BLIGHT_CAMPS: CampDef[] = [
  // Ashwalker drakes -- near the hub and along the southern blight
  { mobId: 'custom_ashwalker_drake', center: { x: 64,  z: 943  }, radius: 25, count: 6 },
  { mobId: 'custom_ashwalker_drake', center: { x: -50, z: 950  }, radius: 20, count: 5 },
  { mobId: 'custom_ashwalker_drake', center: { x: 71,  z: 982  }, radius: 22, count: 5 },
  { mobId: 'custom_ashwalker_drake', center: { x: -45, z: 1010 }, radius: 18, count: 4 },

  // Scorchwing wyverns -- deeper in the zone, past the scout outpost
  { mobId: 'custom_scorchwing_wyvern', center: { x: 55, z: 1050 }, radius: 28, count: 5 },
  { mobId: 'custom_scorchwing_wyvern', center: { x: 11, z: 1077 }, radius: 24, count: 4 },
  { mobId: 'custom_scorchwing_wyvern', center: { x: 35, z: 1110 }, radius: 20, count: 4 },

  // Blighted sentinels -- patrolling near the dungeon entrance
  { mobId: 'custom_blighted_sentinel', center: { x: -60, z: 1140 }, radius: 30, count: 2 },
  { mobId: 'custom_blighted_sentinel', center: { x: 10,  z: 1170 }, radius: 25, count: 2 },

  // Skullfire Brutes -- southern blight edge, between the drake packs
  { mobId: 'custom_skullfire_brute', center: { x: 60,  z: 915 }, radius: 22, count: 4 },
  { mobId: 'custom_skullfire_brute', center: { x: -40, z: 935 }, radius: 20, count: 4 },

  // Blightshroud Stalkers -- north of the scout outpost
  { mobId: 'custom_blightshroud_stalker', center: { x: -70, z: 1100 }, radius: 22, count: 3 },
  { mobId: 'custom_blightshroud_stalker', center: { x: 30,  z: 1130 }, radius: 20, count: 3 },

  // Ironpelt Monkroose -- scattered across the southern blight
  { mobId: 'custom_ironpelt_monkroose', center: { x: -75, z: 956 }, radius: 25, count: 5 },
  { mobId: 'custom_ironpelt_monkroose', center: { x: 67,  z: 947 }, radius: 22, count: 4 },
];
