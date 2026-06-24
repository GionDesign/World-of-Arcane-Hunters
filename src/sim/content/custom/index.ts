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

// ===========================================================================
// THE CINDERHOLD
// A volcanic zone north of Zone 3. Level range 22-30. Peaks biome (closest
// to volcanic rocky terrain available). Hub: Ember Watch outpost at x:0 z:990.
// ===========================================================================

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------
export const CUSTOM_ITEMS: Record<string, ItemDef> = {

  // -- Quest / collection items -----------------------------------------------

  custom_ember_core: {
    id: 'custom_ember_core',
    name: 'Smoldering Ember Core',
    kind: 'quest',
    quality: 'common',
    sellValue: 30,
  },

  custom_magma_pelt: {
    id: 'custom_magma_pelt',
    name: 'Scorched Magma Hound Pelt',
    kind: 'quest',
    quality: 'common',
    sellValue: 25,
  },

  custom_cinder_tusk: {
    id: 'custom_cinder_tusk',
    name: 'Cinder Troll Tusk',
    kind: 'quest',
    quality: 'common',
    sellValue: 20,
  },

  // -- Junk drops (vendor trash) ----------------------------------------------

  custom_slag_fragment: {
    id: 'custom_slag_fragment',
    name: 'Slag Fragment',
    kind: 'junk',
    quality: 'poor',
    sellValue: 12,
  },

  custom_ash_bone: {
    id: 'custom_ash_bone',
    name: 'Ash Bone',
    kind: 'junk',
    quality: 'poor',
    sellValue: 8,
  },

  // -- Quest reward weapons ---------------------------------------------------

  custom_blaze_reaver: {
    id: 'custom_blaze_reaver',
    name: 'Blaze Reaver',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'uncommon',
    sellValue: 350,
    weapon: { min: 22, max: 34, speed: 3.5 },
    stats: { str: 6, sta: 3 },
    requiredClass: ['warrior', 'paladin', 'shaman'],
  },

  custom_inferno_staff: {
    id: 'custom_inferno_staff',
    name: 'Inferno Staff',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'uncommon',
    sellValue: 350,
    weapon: { min: 18, max: 28, speed: 2.8 },
    stats: { int: 14, spi: 4 },
    requiredClass: ['mage', 'priest', 'warlock', 'druid'],
  },

  custom_cinderfang_dagger: {
    id: 'custom_cinderfang_dagger',
    name: 'Cinderfang Dagger',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'uncommon',
    sellValue: 300,
    weapon: { min: 14, max: 20, speed: 1.7, dagger: true },
    stats: { agi: 10, sta: 3 },
    requiredClass: ['rogue', 'hunter'],
  },

  // -- Consumables (sold by hub vendor) ----------------------------------------

  custom_fire_resistance_potion: {
    id: 'custom_fire_resistance_potion',
    name: 'Fire Resistance Potion',
    kind: 'potion',
    quality: 'common',
    buyValue: 120,
    sellValue: 40,
    potionHp: 180,
  },

  custom_charred_ration: {
    id: 'custom_charred_ration',
    name: 'Charred Field Ration',
    kind: 'food',
    quality: 'common',
    buyValue: 30,
    sellValue: 10,
    foodHp: 200,
  },

};

// ---------------------------------------------------------------------------
// Overworld mobs
// ---------------------------------------------------------------------------
export const CUSTOM_MOBS: Record<string, MobTemplate> = {

  // Lava Elemental -- molten rock creature, slow and hard-hitting
  custom_lava_elemental: {
    id: 'custom_lava_elemental',
    name: 'Lava Elemental',
    minLevel: 22, maxLevel: 25,
    family: 'elemental',
    hpBase: 80, hpPerLevel: 32,
    dmgBase: 13, dmgPerLevel: 3.2,
    attackSpeed: 2.2,
    armorPerLevel: 30,
    moveSpeed: 6,
    aggroRadius: 10,
    loot: [
      { copper: 90, chance: 1 },
      { itemId: 'custom_ember_core', chance: 0.6 },
      { itemId: 'custom_slag_fragment', chance: 0.5 },
    ],
    scale: 1.2, color: 0xff4400,
  },

  // Ember Imp -- small, fast, low HP fire demons that swarm in packs
  custom_ember_imp: {
    id: 'custom_ember_imp',
    name: 'Ember Imp',
    minLevel: 20, maxLevel: 23,
    family: 'demon',
    hpBase: 45, hpPerLevel: 18,
    dmgBase: 10, dmgPerLevel: 2.5,
    attackSpeed: 1.5,
    armorPerLevel: 16,
    moveSpeed: 11,
    aggroRadius: 14,
    loot: [
      { copper: 60, chance: 1 },
      { itemId: 'custom_slag_fragment', chance: 0.4 },
    ],
    scale: 0.8, color: 0xdd2200,
  },

  // Magma Hound -- volcanic beast with scorched hide
  custom_magma_hound: {
    id: 'custom_magma_hound',
    name: 'Magma Hound',
    minLevel: 23, maxLevel: 26,
    family: 'beast',
    hpBase: 75, hpPerLevel: 28,
    dmgBase: 12, dmgPerLevel: 3.0,
    attackSpeed: 1.8,
    armorPerLevel: 22,
    moveSpeed: 10,
    aggroRadius: 13,
    loot: [
      { copper: 100, chance: 1 },
      { itemId: 'custom_magma_pelt', chance: 0.65 },
    ],
    scale: 1.1, color: 0x993300,
  },

  // Cinder Troll -- large brutish troll coated in ash and embers
  custom_cinder_troll: {
    id: 'custom_cinder_troll',
    name: 'Cinder Troll',
    minLevel: 25, maxLevel: 28,
    family: 'troll',
    hpBase: 110, hpPerLevel: 38,
    dmgBase: 16, dmgPerLevel: 3.8,
    attackSpeed: 2.4,
    armorPerLevel: 35,
    moveSpeed: 7,
    aggroRadius: 11,
    loot: [
      { copper: 140, chance: 1 },
      { itemId: 'custom_cinder_tusk', chance: 0.5 },
      { itemId: 'custom_ash_bone', chance: 0.7 },
    ],
    scale: 1.35, color: 0x663300,
  },

  // Flamecaller -- humanoid fire cult caster, ranged attacks
  custom_flamecaller: {
    id: 'custom_flamecaller',
    name: 'Flamecaller',
    minLevel: 24, maxLevel: 27,
    family: 'humanoid',
    hpBase: 70, hpPerLevel: 25,
    dmgBase: 14, dmgPerLevel: 3.5,
    attackSpeed: 2.0,
    armorPerLevel: 18,
    moveSpeed: 8,
    aggroRadius: 15,
    loot: [
      { copper: 120, chance: 1 },
      { itemId: 'custom_ember_core', chance: 0.35 },
      { itemId: 'custom_slag_fragment', chance: 0.5 },
    ],
    scale: 1.0, color: 0xcc3300,
  },

  // Molten Colossus -- elite zone boss, massive elemental
  custom_molten_colossus: {
    id: 'custom_molten_colossus',
    name: 'Molten Colossus',
    minLevel: 29, maxLevel: 30,
    family: 'elemental',
    hpBase: 600, hpPerLevel: 140,
    dmgBase: 24, dmgPerLevel: 5.0,
    attackSpeed: 2.5,
    armorPerLevel: 45,
    moveSpeed: 5,
    aggroRadius: 18,
    boss: true,
    elite: true,
    ccImmune: true,
    aoePulse: { min: 18, max: 28, radius: 12, every: 6, name: 'Magma Burst' },
    enrage: { belowHpPct: 0.25, dmgMult: 1.6, hasteMult: 1.3 },
    summonAdds: { mobId: 'custom_lava_elemental', count: 2, atHpPct: [0.5, 0.2] },
    loot: [
      { copper: 2500, chance: 1 },
      { itemId: 'custom_blaze_reaver', chance: 0.25 },
      { itemId: 'custom_inferno_staff', chance: 0.25 },
      { itemId: 'custom_cinderfang_dagger', chance: 0.25 },
      { itemId: 'custom_ember_core', chance: 1.0 },
    ],
    scale: 1.7, color: 0xff6600,
  },

};

// ---------------------------------------------------------------------------
// Dungeon-only mobs (none yet -- placeholder for future Cinderhold dungeon)
// ---------------------------------------------------------------------------
export const CUSTOM_DUNGEON_MOBS: Record<string, MobTemplate> = {};

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------
export const CUSTOM_NPCS: Record<string, NpcDef> = {

  custom_warden_cael: {
    id: 'custom_warden_cael',
    name: 'Warden Cael',
    title: 'Ember Watch Commander',
    pos: { x: 3, z: 990 },
    facing: 3.14,
    color: 0x886644,
    questIds: [
      'custom_q_quench_the_elementals',
      'custom_q_hound_culling',
      'custom_q_troll_tide',
    ],
    greeting: 'The Cinderhold grows more dangerous by the hour. We need every able hand.',
    vendorItems: ['custom_fire_resistance_potion', 'custom_charred_ration'],
  },

};

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------
export const CUSTOM_QUESTS: Record<string, QuestDef> = {

  custom_q_quench_the_elementals: {
    id: 'custom_q_quench_the_elementals',
    name: 'Quench the Elementals',
    giverNpcId: 'custom_warden_cael',
    turnInNpcId: 'custom_warden_cael',
    text: 'The lava elementals are surging up from the fissures and cutting off '
        + 'our supply lines. Destroy 10 of them and bring back 5 ember cores as proof. '
        + 'Be careful -- they pulse heat as they die.',
    completionText: 'Good work. The fissures seem calmer for now. These cores could '
        + 'be useful to our artificers.',
    objectives: [
      { type: 'kill', targetMobId: 'custom_lava_elemental', count: 10, label: 'Lava Elementals destroyed' },
      { type: 'collect', itemId: 'custom_ember_core', count: 5, label: 'Ember Cores collected' },
    ],
    xpReward: 1100,
    copperReward: 400,
    itemRewards: {
      warrior: 'custom_blaze_reaver',
      paladin: 'custom_blaze_reaver',
      shaman: 'custom_blaze_reaver',
      rogue: 'custom_cinderfang_dagger',
      hunter: 'custom_cinderfang_dagger',
      mage: 'custom_inferno_staff',
      priest: 'custom_inferno_staff',
      warlock: 'custom_inferno_staff',
      druid: 'custom_inferno_staff',
    },
    minLevel: 21,
  },

  custom_q_hound_culling: {
    id: 'custom_q_hound_culling',
    name: 'The Hound Pack',
    giverNpcId: 'custom_warden_cael',
    turnInNpcId: 'custom_warden_cael',
    text: 'Magma hounds have been prowling the western ridgeline and attacking '
        + 'our scouts. Put down 8 of them and collect their pelts. The hide is '
        + 'fire-resistant -- we can use it for armor patches.',
    completionText: 'These pelts will do nicely. Our leatherworker will get them '
        + 'treated before the next patrol.',
    objectives: [
      { type: 'kill', targetMobId: 'custom_magma_hound', count: 8, label: 'Magma Hounds slain' },
      { type: 'collect', itemId: 'custom_magma_pelt', count: 5, label: 'Magma Hound Pelts' },
    ],
    xpReward: 950,
    copperReward: 350,
    itemRewards: {
      warrior: 'custom_blaze_reaver',
      paladin: 'custom_blaze_reaver',
      shaman: 'custom_blaze_reaver',
      rogue: 'custom_cinderfang_dagger',
      hunter: 'custom_cinderfang_dagger',
      mage: 'custom_inferno_staff',
      priest: 'custom_inferno_staff',
      warlock: 'custom_inferno_staff',
      druid: 'custom_inferno_staff',
    },
    minLevel: 22,
  },

  custom_q_troll_tide: {
    id: 'custom_q_troll_tide',
    name: 'Troll Tide',
    giverNpcId: 'custom_warden_cael',
    turnInNpcId: 'custom_warden_cael',
    text: 'The cinder trolls are massing to the north. They have claimed the '
        + 'old fire shrine and we cannot let them hold it. Kill 6 cinder trolls '
        + 'and bring me 4 of their tusks as trophies.',
    completionText: 'The shrine is ours again. Well fought.',
    objectives: [
      { type: 'kill', targetMobId: 'custom_cinder_troll', count: 6, label: 'Cinder Trolls killed' },
      { type: 'collect', itemId: 'custom_cinder_tusk', count: 4, label: 'Cinder Troll Tusks' },
    ],
    xpReward: 1300,
    copperReward: 500,
    itemRewards: {
      warrior: 'custom_blaze_reaver',
      paladin: 'custom_blaze_reaver',
      shaman: 'custom_blaze_reaver',
      rogue: 'custom_cinderfang_dagger',
      hunter: 'custom_cinderfang_dagger',
      mage: 'custom_inferno_staff',
      priest: 'custom_inferno_staff',
      warlock: 'custom_inferno_staff',
      druid: 'custom_inferno_staff',
    },
    minLevel: 24,
  },

};

export const CUSTOM_QUEST_ORDER: string[] = [
  'custom_q_quench_the_elementals',
  'custom_q_hound_culling',
  'custom_q_troll_tide',
];

// ---------------------------------------------------------------------------
// Camps -- placed inside the Cinderhold z-band (900-1080).
// DO NOT reorder existing entries -- each draws world-gen RNG in array order.
// ---------------------------------------------------------------------------
export const CUSTOM_CAMPS: CampDef[] = [
  // Southern fissure zone -- ember imps swarm near the entry
  { mobId: 'custom_ember_imp', center: { x: -50, z: 925 }, radius: 22, count: 7 },
  { mobId: 'custom_ember_imp', center: { x: 55, z: 935 }, radius: 18, count: 6 },

  // Central lava fields -- elementals erupt from ground fissures
  { mobId: 'custom_lava_elemental', center: { x: -35, z: 955 }, radius: 20, count: 5 },
  { mobId: 'custom_lava_elemental', center: { x: 45, z: 965 }, radius: 18, count: 4 },
  { mobId: 'custom_lava_elemental', center: { x: 0, z: 975 }, radius: 15, count: 4 },

  // Western ridge -- magma hound pack territory
  { mobId: 'custom_magma_hound', center: { x: -70, z: 980 }, radius: 25, count: 6 },
  { mobId: 'custom_magma_hound', center: { x: -60, z: 1005 }, radius: 20, count: 5 },

  // Eastern cliffs -- flamecallers holding a ruined shrine
  { mobId: 'custom_flamecaller', center: { x: 65, z: 995 }, radius: 18, count: 4 },
  { mobId: 'custom_flamecaller', center: { x: 70, z: 1020 }, radius: 15, count: 4 },

  // Northern wastes -- cinder troll territory
  { mobId: 'custom_cinder_troll', center: { x: -20, z: 1030 }, radius: 25, count: 5 },
  { mobId: 'custom_cinder_troll', center: { x: 30, z: 1045 }, radius: 22, count: 4 },

  // Deep north -- Molten Colossus lair (single boss spawn)
  { mobId: 'custom_molten_colossus', center: { x: 0, z: 1065 }, radius: 8, count: 1 },
];

// ---------------------------------------------------------------------------
// Ground objects (ember cores scattered near fissures)
// ---------------------------------------------------------------------------
export const CUSTOM_OBJECTS: GroundObjectDef[] = [
  {
    itemId: 'custom_ember_core',
    name: 'Glowing Fissure Core',
    positions: [
      { x: -40, z: 948 },
      { x: 50, z: 958 },
      { x: -10, z: 968 },
      { x: 25, z: 982 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Roads -- path from zone border south to Ember Watch hub
// ---------------------------------------------------------------------------
export const CUSTOM_ROADS: { x: number; z: number }[][] = [
  [
    { x: 0, z: 902 },
    { x: 0, z: 930 },
    { x: 0, z: 960 },
    { x: 0, z: 990 },
  ],
];

// ---------------------------------------------------------------------------
// Props -- Ember Watch outpost buildings and decorations
// ---------------------------------------------------------------------------
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'house', x: 8, z: 990, w: 9, d: 7, rot: 0 },
    { kind: 'house', x: -10, z: 985, w: 7, d: 6, rot: 0.3 },
  ],
  wells: [
    { x: 0, z: 988, r: 1.5 },
  ],
  campfires: [
    [3, 993],
    [-6, 995],
    [12, 998],
    [-30, 1030],
  ],
  tents: [
    { x: -16, z: 992, rot: 0, scale: 1.0 },
    { x: 18, z: 996, rot: 1.2, scale: 1.0 },
  ],
  ruinRings: [
    { x: 65, z: 1000, ringR: 12, columns: 6 },
    { x: -55, z: 1038, ringR: 8, columns: 4 },
  ],
  stalls: [], mines: [], docks: [], crates: [], mudHuts: [], fences: [], graveyards: [],
};

// ---------------------------------------------------------------------------
// Zone definition
// ---------------------------------------------------------------------------
export const CUSTOM_ZONES: ZoneDef[] = [
  {
    id: 'custom_cinderhold',
    name: 'The Cinderhold',
    zMin: 900, zMax: 1080,
    levelRange: [20, 20],
    biome: 'peaks',
    hub: {
      x: 0, z: 990,
      radius: 35,
      name: 'Ember Watch',
    },
    graveyard: { x: -25, z: 993 },
    lakes: [],
    pois: [
      { x: 0, z: 990, label: 'Ember Watch' },
      { x: -65, z: 992, label: 'Western Ridge' },
      { x: 67, z: 1000, label: 'The Ash Shrine' },
      { x: 0, z: 1065, label: 'Colossus Lair' },
    ],
    welcome: 'The heat hits you before the smoke clears. Welcome to the Cinderhold.',
  },
];

// ---------------------------------------------------------------------------
// Dungeons (none yet for this zone)
// ---------------------------------------------------------------------------
export const CUSTOM_DUNGEON_DEFS: Record<string, DungeonDef> = {};
