// Fork-exclusive custom content. Add your custom zones, mobs, items, quests,
// NPCs, and dungeons here. This file (and this whole directory) is owned by this
// fork -- upstream never touches it. See CLAUDE.md in this directory for full
// authoring guidance and the rules that keep custom content safe from merges.
//
// ID naming: prefix every id with "custom_" to avoid collisions if upstream
// later adds content with the same short name (e.g. "custom_direwolf", not "direwolf").
//
// Dungeon indices: upstream uses 0-2 + temple (see data.ts). Use 10+ here.
//
// Determinism: CUSTOM_CAMPS is appended LAST by data.ts -- do not reorder
// existing entries or you will shift world-gen RNG for every camp that follows.

import type {
  CampDef, DungeonDef, GroundObjectDef, ItemDef, MobTemplate, NpcDef,
  QuestDef, ZoneDef, ZonePropsDef,
} from '../../types';

// ---------------------------------------------------------------------------
// Items
// Reference: src/sim/content/items.ts for shape examples.
// ---------------------------------------------------------------------------
export const CUSTOM_ITEMS: Record<string, ItemDef> = {
  // Example (delete or keep as-is -- empty records are fine):
  // custom_wolf_pelt: {
  //   id: 'custom_wolf_pelt',
  //   name: 'Wolf Pelt',
  //   kind: 'quest',
  //   slot: 'quest',
  //   quality: 'common',
  //   sellValue: 15,
  // },
};

// ---------------------------------------------------------------------------
// Mobs / creatures (overworld -- walk the world and spawn via CUSTOM_CAMPS)
// Reference: src/sim/content/zone1.ts ZONE1_MOBS for shape examples.
// ---------------------------------------------------------------------------
export const CUSTOM_MOBS: Record<string, MobTemplate> = {
  // Example:
  // custom_direwolf: {
  //   id: 'custom_direwolf',
  //   name: 'Dire Wolf',
  //   minLevel: 15, maxLevel: 18,
  //   family: 'beast',
  //   hpBase: 55, hpPerLevel: 22,
  //   dmgBase: 9, dmgPerLevel: 2.2,
  //   attackSpeed: 1.8,
  //   armorPerLevel: 14,
  //   moveSpeed: 9,
  //   aggroRadius: 12,
  //   loot: [{ copper: 60, chance: 1 }],
  //   scale: 1.1, color: 0x555555,
  // },
};

// ---------------------------------------------------------------------------
// Mobs that only appear inside custom dungeons (never in overworld camps).
// Reference: src/sim/content/dungeons.ts DUNGEON_MOBS for shape examples.
// ---------------------------------------------------------------------------
export const CUSTOM_DUNGEON_MOBS: Record<string, MobTemplate> = {};

// ---------------------------------------------------------------------------
// NPCs (quest givers, vendors, trainers)
// Reference: src/sim/content/zone1.ts ZONE1_NPCS for shape examples.
// ---------------------------------------------------------------------------
export const CUSTOM_NPCS: Record<string, NpcDef> = {};

// ---------------------------------------------------------------------------
// Quests
// Reference: src/sim/content/zone1.ts ZONE1_QUESTS for shape examples.
// itemRewards is keyed by PlayerClass (or archetype: 'warrior'/'rogue'/'mage').
// ---------------------------------------------------------------------------
export const CUSTOM_QUESTS: Record<string, QuestDef> = {};

// Quest order controls level-gate progression and quest-log order.
// List quest IDs in the order players should receive them.
export const CUSTOM_QUEST_ORDER: string[] = [];

// ---------------------------------------------------------------------------
// Camps -- spawns mobs in the overworld. Each entry reserves one world-gen RNG
// draw; appended LAST by data.ts so upstream camp order is never disturbed.
// ---------------------------------------------------------------------------
export const CUSTOM_CAMPS: CampDef[] = [
  // Example:
  // { mobId: 'custom_direwolf', center: { x: 60, z: 400 }, radius: 20, count: 5 },
];

// ---------------------------------------------------------------------------
// Ground objects (herbs, ore nodes, collectibles)
// Reference: src/sim/content/zone1.ts ZONE1_OBJECTS for shape examples.
// ---------------------------------------------------------------------------
export const CUSTOM_OBJECTS: GroundObjectDef[] = [];

// ---------------------------------------------------------------------------
// Roads -- line segments used for terrain path painting.
// Format: array of polylines, each polyline is an array of { x, z } points.
// ---------------------------------------------------------------------------
export const CUSTOM_ROADS: { x: number; z: number }[][] = [];

// ---------------------------------------------------------------------------
// Props -- static world geometry (buildings, wells, docks, tents, etc.)
// Reference: src/sim/content/zone1.ts ZONE1_PROPS for shape examples.
// ---------------------------------------------------------------------------
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [],
  wells: [],
  stalls: [],
  mines: [],
  docks: [],
  tents: [],
  crates: [],
  campfires: [],
  mudHuts: [],
  ruinRings: [],
  fences: [],
  graveyards: [],
};

// ---------------------------------------------------------------------------
// Zones -- world bands extending the map north (above upstream zone 3 zMax 360).
// Each zone needs a matching CUSTOM_CAMPS entry to populate mobs.
// Reference: src/sim/content/zone1.ts ZONE1_ZONE for shape examples.
// ---------------------------------------------------------------------------
export const CUSTOM_ZONES: ZoneDef[] = [
  // Example (start at zMin: 360, above the last upstream zone):
  // {
  //   id: 'custom_zone1',
  //   name: 'The Ashenmoor',
  //   zMin: 360, zMax: 540,
  //   levelRange: [18, 25],
  //   biome: 'tundra',
  //   hub: { x: 0, z: 450, radius: 25, name: 'Ashenmoor Camp' },
  //   graveyard: { x: -20, z: 460 },
  //   lakes: [],
  //   pois: [{ x: 0, z: 450, label: 'Ashenmoor Camp' }],
  //   welcome: 'The Ashenmoor stretches out before you.',
  // },
];

// ---------------------------------------------------------------------------
// Dungeons
// Indices 0-2 are upstream (Hollow Crypt / Sunken Bastion / Gravewyrm).
// Temple dungeons use indices 3+. Use index 10+ for custom dungeons.
// x-origin = 900 + index * 600, so index 10 -> x: 6900.
// Reference: src/sim/content/dungeons.ts DUNGEON_DEFS for shape examples.
// ---------------------------------------------------------------------------
export const CUSTOM_DUNGEON_DEFS: Record<string, DungeonDef> = {};
