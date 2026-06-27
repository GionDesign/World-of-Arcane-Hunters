# Complete Working Example

This ties all content types together into one coherent custom zone with mobs,
NPCs, quests, camps, props, roads, and a dungeon. Copy and adapt this as a
starting template for your first custom zone.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

```typescript
// src/sim/content/custom/index.ts

import type {
  CampDef, DungeonDef, GroundObjectDef, ItemDef, MobTemplate, NpcDef,
  QuestDef, ZoneDef, ZonePropsDef,
} from '../../types';

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------
export const CUSTOM_ITEMS: Record<string, ItemDef> = {
  custom_wolf_pelt: {
    id: 'custom_wolf_pelt',
    name: 'Wolf Pelt',
    kind: 'quest',
    slot: undefined,
    quality: 'common',
    sellValue: 0,
    noVendorSell: true,
  },
  custom_iron_sword: {
    id: 'custom_iron_sword',
    name: 'Iron Sword',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'uncommon',
    sellValue: 120,
    weapon: { dps: 14, speed: 2.4, type: 'sword' },
    stats: { strength: 8, stamina: 5 },
  },
  custom_healing_potion: {
    id: 'custom_healing_potion',
    name: 'Healing Potion',
    kind: 'potion',
    sellValue: 10,
    buyValue: 50,
    potionHp: 300,
    quality: 'common',
  },
};

// ---------------------------------------------------------------------------
// Overworld mobs
// ---------------------------------------------------------------------------
export const CUSTOM_MOBS: Record<string, MobTemplate> = {
  custom_direwolf: {
    id: 'custom_direwolf',
    name: 'Dire Wolf',
    minLevel: 18, maxLevel: 22,
    family: 'beast',
    hpBase: 60, hpPerLevel: 25,
    dmgBase: 10, dmgPerLevel: 2.5,
    attackSpeed: 1.8,
    armorPerLevel: 15,
    moveSpeed: 9,
    aggroRadius: 12,
    loot: [
      { copper: 80, chance: 1 },
      { itemId: 'custom_wolf_pelt', chance: 0.6, questId: 'custom_hunt_wolves' },
    ],
    scale: 1.2, color: 0x444444,
  },
};

// ---------------------------------------------------------------------------
// Dungeon mobs
// ---------------------------------------------------------------------------
export const CUSTOM_DUNGEON_MOBS: Record<string, MobTemplate> = {
  custom_crypt_guardian: {
    id: 'custom_crypt_guardian',
    name: 'Crypt Guardian',
    minLevel: 20, maxLevel: 20,
    family: 'undead',
    hpBase: 400, hpPerLevel: 0,
    dmgBase: 30, dmgPerLevel: 0,
    attackSpeed: 2.2,
    armorPerLevel: 40,
    moveSpeed: 5,
    aggroRadius: 15,
    elite: true,
    loot: [
      { copper: 200, chance: 1 },
      { itemId: 'custom_iron_sword', chance: 0.15 },
    ],
    scale: 1.4, color: 0x777799,
  },
};

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------
export const CUSTOM_NPCS: Record<string, NpcDef> = {
  custom_ranger_quinn: {
    id: 'custom_ranger_quinn',
    name: 'Ranger Quinn',
    title: 'Scout',
    pos: { x: 5, z: 2060 },
    facing: 0,
    color: 0x8B6914,
    questIds: ['custom_hunt_wolves'],
    greeting: 'The wolves beyond camp have grown bold. I need your help, $N.',
  },
  custom_supply_vendor: {
    id: 'custom_supply_vendor',
    name: 'Camp Supplier',
    title: 'Trade Goods',
    pos: { x: 10, z: 2055 },
    facing: Math.PI,
    color: 0xAA9977,
    questIds: [],
    vendorItems: ['custom_healing_potion'],
    greeting: 'Stock up before you head out.',
  },
};

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------
export const CUSTOM_QUESTS: Record<string, QuestDef> = {
  custom_hunt_wolves: {
    id: 'custom_hunt_wolves',
    name: 'A Wolf Problem',
    giverNpcId: 'custom_ranger_quinn',
    turnInNpcId: 'custom_ranger_quinn',
    text: 'The dire wolves north of camp are attacking our scouts, $N. Kill 8 of them and bring me 5 pelts.',
    completionText: 'Well done, $N. The scouts can move freely now.',
    objectives: [
      { type: 'kill',    targetMobId: 'custom_direwolf', count: 8, label: 'Dire Wolves slain' },
      { type: 'collect', itemId: 'custom_wolf_pelt',      count: 5, label: 'Wolf Pelts collected' },
    ],
    xpReward: 1800,
    copperReward: 150,
    itemRewards: {
      warrior: 'custom_iron_sword',
      rogue:   'custom_iron_sword',
      mage:    'custom_healing_potion',
    },
    minLevel: 18,
  },
};

export const CUSTOM_QUEST_ORDER: string[] = [
  'custom_hunt_wolves',
];

// ---------------------------------------------------------------------------
// Camps -- ALWAYS append new camps at the end; never reorder existing entries
// ---------------------------------------------------------------------------
export const CUSTOM_CAMPS: CampDef[] = [
  { mobId: 'custom_direwolf', center: { x: 30,  z: 2040 }, radius: 25, count: 6 },
  { mobId: 'custom_direwolf', center: { x: -40, z: 2090 }, radius: 20, count: 4 },
];

// ---------------------------------------------------------------------------
// Ground objects
// ---------------------------------------------------------------------------
export const CUSTOM_OBJECTS: GroundObjectDef[] = [];

// ---------------------------------------------------------------------------
// Roads
// ---------------------------------------------------------------------------
export const CUSTOM_ROADS: { x: number; z: number }[][] = [
  // Main approach road to hub
  [
    { x: 0, z: 2000 },
    { x: 1, z: 2030 },
    { x: 0, z: 2060 },
  ],
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'inn', x: 0, z: 2060, w: 12, d: 10, rot: 0 },
  ],
  wells:      [{ x: 5, z: 2055, r: 1.5 }],
  stalls:     [],
  mines:      [],
  docks:      [],
  tents:      [],
  crates:     [],
  campfires:  [[0, 2070]],
  mudHuts:    [],
  ruinRings:  [],
  fences:     [],
  graveyards: [],
};

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------
export const CUSTOM_ZONES: ZoneDef[] = [
  {
    id: 'custom_ashenmoor',
    name: 'The Ashenmoor',
    zMin: 2000, zMax: 2360,
    levelRange: [18, 25],
    biome: 'marsh',
    hub: { x: 0, z: 2060, radius: 30, name: 'Ashenmoor Camp' },
    graveyard: { x: -10, z: 2070 },
    lakes: [{ x: 60, z: 2120, radius: 40 }],
    pois: [
      { x: 0, z: 2060, label: 'Ashenmoor Camp' },
    ],
    welcome: 'The Ashenmoor stretches before you, bleak and fog-shrouded.',
  },
];

// ---------------------------------------------------------------------------
// Dungeons
// ---------------------------------------------------------------------------
export const CUSTOM_DUNGEON_DEFS: Record<string, DungeonDef> = {
  custom_ashenmoor_crypt: {
    id: 'custom_ashenmoor_crypt',
    name: 'Ashenmoor Crypt',
    index: 10,                        // x-origin = 900 + 10*600 = 6900
    doorPos: { x: -50, z: 2020 },    // overworld entrance portal
    entry: { x: 0, z: 20 },
    exitOffset: { x: 0, z: 5 },
    interior: 'crypt',
    suggestedPlayers: 3,
    enterText: 'The crypt air is cold and still.',
    leaveText: 'You emerge from the Ashenmoor Crypt.',
    spawns: [
      { mobId: 'custom_crypt_guardian', x: 0,   z: 40 },
      { mobId: 'custom_crypt_guardian', x: -15, z: 60 },
      { mobId: 'custom_crypt_guardian', x: 15,  z: 60 },
      { mobId: 'custom_crypt_guardian', x: 0,   z: 80 },
    ],
  },
};
```
