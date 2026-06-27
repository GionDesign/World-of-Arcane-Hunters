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
// DRAGON'S BLIGHT -- Custom Zone 4
// A fire-scorched highland gripped by the dread of an ancient dragon awakening.
// Level range: 18-20 (endgame). Hub: Blightwatch Post (z ~960).
// Quest chain: 5 quests leading to Ignaraxis the Eternal in Dragon's Maw.
// zMin:900 -- immediately after Zone 3 (Thornpeak Heights zMax:900). The
// zone system requires strict contiguity; if upstream later adds zones here
// this custom zone must be shifted. See docs/MAINTAINING-FORK.md.
// ===========================================================================

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------
export const CUSTOM_ITEMS: Record<string, ItemDef> = {

  // --- Quest drop items (collected during chain) ---
  custom_drake_scale: {
    id: 'custom_drake_scale',
    name: 'Ashwalker Drake Scale',
    kind: 'quest',
    slot: undefined,
    quality: 'common',
    sellValue: 0,
    noVendorSell: true,
  },
  custom_wyvern_heartstone: {
    id: 'custom_wyvern_heartstone',
    name: 'Scorchwing Heartstone',
    kind: 'quest',
    slot: undefined,
    quality: 'common',
    sellValue: 0,
    noVendorSell: true,
  },
  custom_blight_ember: {
    id: 'custom_blight_ember',
    name: 'Blight Ember',
    kind: 'quest',
    slot: undefined,
    quality: 'uncommon',
    sellValue: 0,
    noVendorSell: true,
  },

  // --- Intermediate quest rewards (uncommon/rare) ---
  custom_drakebone_shoulders: {
    id: 'custom_drakebone_shoulders',
    name: 'Drakebone Shoulderguards',
    kind: 'armor',
    slot: 'shoulder',
    quality: 'rare',
    stats: { armor: 160, str: 8, sta: 6 },
    sellValue: 3000,
    requiredClass: ['warrior', 'paladin', 'shaman'],
  },
  custom_scorchwing_cowl: {
    id: 'custom_scorchwing_cowl',
    name: 'Scorchwing Cowl',
    kind: 'armor',
    slot: 'helmet',
    quality: 'rare',
    stats: { armor: 55, int: 9, spi: 5 },
    sellValue: 3000,
    requiredClass: ['mage', 'priest', 'warlock', 'druid'],
  },
  custom_blight_stalkers_hood: {
    id: 'custom_blight_stalkers_hood',
    name: "Blightstalker's Hood",
    kind: 'armor',
    slot: 'helmet',
    quality: 'rare',
    stats: { armor: 90, agi: 9, sta: 5 },
    sellValue: 3000,
    requiredClass: ['rogue', 'hunter'],
  },

  // --- Epic final rewards (Ignaraxis drops, gated by quest 5 being active) ---
  custom_ignaraxis_greatblade: {
    id: 'custom_ignaraxis_greatblade',
    name: 'Ignaraxis Greatblade',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'epic',
    weapon: { min: 34, max: 54, speed: 2.8 },
    stats: { str: 13, sta: 8 },
    sellValue: 9500,
    requiredClass: ['warrior', 'paladin', 'shaman'],
  },
  custom_cinderstave_eternal: {
    id: 'custom_cinderstave_eternal',
    name: 'Cinderstave of the Eternal',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'epic',
    weapon: { min: 36, max: 58, speed: 3.0 },
    stats: { int: 15, spi: 7 },
    sellValue: 9500,
    requiredClass: ['mage', 'priest', 'warlock', 'druid'],
  },
  custom_fang_of_ignaraxis: {
    id: 'custom_fang_of_ignaraxis',
    name: 'Fang of Ignaraxis',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'epic',
    weapon: { min: 22, max: 34, speed: 1.7, dagger: true },
    stats: { agi: 13, sta: 6 },
    sellValue: 9500,
    requiredClass: ['rogue', 'hunter'],
  },
};

// ---------------------------------------------------------------------------
// Overworld mobs
// ---------------------------------------------------------------------------
export const CUSTOM_MOBS: Record<string, MobTemplate> = {

  // Ashwalker Drakes: young fire-touched drakes, common throughout the Blight.
  // L18-19, dragonkin, aggressive but manageable for geared solo players.
  custom_ashwalker_drake: {
    id: 'custom_ashwalker_drake',
    name: 'Ashwalker Drake',
    minLevel: 18, maxLevel: 19,
    family: 'dragonkin',
    hpBase: 62, hpPerLevel: 22,
    dmgBase: 11, dmgPerLevel: 2.4,
    attackSpeed: 1.9,
    armorPerLevel: 16,
    moveSpeed: 8,
    aggroRadius: 11,
    loot: [
      { copper: 85, chance: 1 },
      { itemId: 'custom_drake_scale', chance: 0.65, questId: 'custom_marks_of_the_drake' },
    ],
    scale: 1.15, color: 0x884422,
  },

  // Scorchwing Wyverns: larger, more dangerous cousins. Found deeper in the zone.
  // L19-20, dragonkin, harder hitting. Require more careful pulls.
  custom_scorchwing_wyvern: {
    id: 'custom_scorchwing_wyvern',
    name: 'Scorchwing Wyvern',
    minLevel: 19, maxLevel: 20,
    family: 'dragonkin',
    hpBase: 68, hpPerLevel: 24,
    dmgBase: 12, dmgPerLevel: 2.6,
    attackSpeed: 1.8,
    armorPerLevel: 19,
    moveSpeed: 9,
    aggroRadius: 13,
    loot: [
      { copper: 110, chance: 1 },
      { itemId: 'custom_wyvern_heartstone', chance: 0.55, questId: 'custom_into_the_blight' },
    ],
    scale: 1.25, color: 0xAA3311,
  },

  // Skullfire Brutes: orcish marauders drawn to the Blight by the dragon's call.
  // L18-19, humanoid, solid melee fighters. Patrol the southern blight edge.
  custom_skullfire_brute: {
    id: 'custom_skullfire_brute',
    name: 'Skullfire Brute',
    minLevel: 18, maxLevel: 19,
    family: 'humanoid',
    hpBase: 58, hpPerLevel: 20,
    dmgBase: 11, dmgPerLevel: 2.3,
    attackSpeed: 2.0,
    armorPerLevel: 15,
    moveSpeed: 7,
    aggroRadius: 10,
    loot: [{ copper: 90, chance: 1 }],
    scale: 1.2, color: 0x664422,
  },

  // Blightshroud Stalkers: swift shadow hunters that stalk the deeper Blight.
  // L19-20, humanoid, fast attack speed and high aggro range.
  custom_blightshroud_stalker: {
    id: 'custom_blightshroud_stalker',
    name: 'Blightshroud Stalker',
    minLevel: 19, maxLevel: 20,
    family: 'humanoid',
    hpBase: 48, hpPerLevel: 16,
    dmgBase: 12, dmgPerLevel: 2.4,
    attackSpeed: 1.6,
    armorPerLevel: 14,
    moveSpeed: 9,
    aggroRadius: 14,
    loot: [{ copper: 105, chance: 1 }],
    scale: 0.95, color: 0x222233,
  },

  // Ironpelt Monkroose: a blight-touched bipedal mongoose beast.
  // L18-19, humanoid, quick but not threatening alone. Found in packs.
  custom_ironpelt_monkroose: {
    id: 'custom_ironpelt_monkroose',
    name: 'Ironpelt Monkroose',
    minLevel: 18, maxLevel: 19,
    family: 'humanoid',
    hpBase: 55, hpPerLevel: 19,
    dmgBase: 10, dmgPerLevel: 2.2,
    attackSpeed: 1.8,
    armorPerLevel: 14,
    moveSpeed: 8,
    aggroRadius: 11,
    loot: [{ copper: 80, chance: 1 }],
    scale: 1.05, color: 0x886633,
  },

  // Blighted Sentinels: ancient dragonkin guardians corrupted by Ignaraxis's aura.
  // L20 elite -- intended as a 2-player challenge. Patrol near the dungeon entrance.
  custom_blighted_sentinel: {
    id: 'custom_blighted_sentinel',
    name: 'Blighted Sentinel',
    minLevel: 20, maxLevel: 20,
    family: 'dragonkin',
    elite: true,
    rare: true,
    ccImmune: true,
    respawnMult: 5.0,
    hpBase: 310, hpPerLevel: 0,
    dmgBase: 17, dmgPerLevel: 0,
    attackSpeed: 2.2,
    armorPerLevel: 30,
    moveSpeed: 7,
    aggroRadius: 14,
    aoePulse: { min: 20, max: 28, radius: 7, every: 9, name: 'Blight Breath', school: 'fire' },
    enrage: { belowHpPct: 0.30, dmgMult: 1.45, hasteMult: 1.25 },
    loot: [
      { copper: 240, chance: 1 },
      { itemId: 'custom_blight_ember', chance: 0.70, questId: 'custom_eye_of_the_storm' },
    ],
    scale: 1.5, color: 0x553300,
  },
};

// ---------------------------------------------------------------------------
// Dungeon mobs (Dragon's Maw -- interior only)
// ---------------------------------------------------------------------------
export const CUSTOM_DUNGEON_MOBS: Record<string, MobTemplate> = {

  // Dragonclaw Wardens: armored dragonkin guards lining the maw's corridors.
  custom_dragonclaw_warden: {
    id: 'custom_dragonclaw_warden',
    name: 'Dragonclaw Warden',
    minLevel: 20, maxLevel: 20,
    family: 'dragonkin',
    elite: true,
    hpBase: 70, hpPerLevel: 25,
    dmgBase: 13, dmgPerLevel: 2.8,
    attackSpeed: 2.0,
    armorPerLevel: 24,
    moveSpeed: 6,
    aggroRadius: 12,
    loot: [
      { copper: 160, chance: 1 },
    ],
    scale: 1.25, color: 0x773322,
  },

  // Ignaraxis the Eternal: ancient fire dragon, the dragon hunt's final quarry. 3-player boss.
  custom_ignaraxis: {
    id: 'custom_ignaraxis',
    name: 'Ignaraxis the Eternal',
    minLevel: 20, maxLevel: 20,
    family: 'dragonkin',
    boss: true,
    elite: true,
    ccImmune: true,
    hpBase: 480, hpPerLevel: 52,
    dmgBase: 16, dmgPerLevel: 3.2,
    attackSpeed: 2.4,
    armorPerLevel: 34,
    moveSpeed: 5,
    aggroRadius: 18,
    aoePulse: { min: 32, max: 46, radius: 14, every: 8, name: 'Eternal Flame', school: 'fire' },
    enrage: { belowHpPct: 0.25, dmgMult: 1.6, hasteMult: 1.4 },
    loot: [
      { copper: 60000, chance: 1 },
      { itemId: 'custom_ignaraxis_greatblade', chance: 0.30 },
      { itemId: 'custom_cinderstave_eternal',  chance: 0.30 },
      { itemId: 'custom_fang_of_ignaraxis',    chance: 0.30 },
    ],
    scale: 1.8, color: 0x992200,
  },
};

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------
export const CUSTOM_NPCS: Record<string, NpcDef> = {

  // Commander Vael: the grizzled officer who holds Blightwatch Post together.
  // Quest giver for quests 1, 2, and the ambient patrol quest.
  custom_commander_vael: {
    id: 'custom_commander_vael',
    name: 'Commander Vael',
    title: 'Blightwatch Officer',
    pos: { x: 0, z: 962 },
    facing: Math.PI,
    color: 0x7A6A50,
    questIds: ['custom_proving_ground', 'custom_marks_of_the_drake', 'custom_blight_patrol'],
    greeting: 'Stand ready, $N. This blight does not sleep, and neither do we.',
  },

  // Scout Fenris: advance scout stationed in the deeper Blight, past the wyvern nests.
  // Quest giver for quests 3 and 4.
  custom_scout_fenris: {
    id: 'custom_scout_fenris',
    name: 'Scout Fenris',
    title: 'Blightwatch Scout',
    pos: { x: -25, z: 1080 },
    facing: 0,
    color: 0x556644,
    questIds: ['custom_into_the_blight', 'custom_eye_of_the_storm'],
    greeting: 'You made it through the wyvern grounds? Good. I could use someone capable out here.',
  },

  // Elder Draxis: a veteran dragonslayer who served before the Post was built.
  // Quest giver for quest 5 (the dungeon quest) and vendor for basic supplies.
  custom_elder_draxis: {
    id: 'custom_elder_draxis',
    name: 'Elder Draxis',
    title: 'Dragonslayer',
    pos: { x: 12, z: 958 },
    facing: Math.PI,
    color: 0x886655,
    questIds: ['custom_eternal_flame'],
    vendorItems: ['healing_potion', 'mana_potion'],
    greeting: 'I have hunted dragons for thirty years, $N. Ignaraxis is not like the others.',
  },
};

// ---------------------------------------------------------------------------
// Quests -- Dragon Hunt chain (5 quests, each requires the previous)
// Plus one ambient patrol quest available throughout the zone.
// ---------------------------------------------------------------------------
export const CUSTOM_QUESTS: Record<string, QuestDef> = {

  // Quest 1: Kill 10 ashwalker drakes. Introduces the zone threats.
  custom_proving_ground: {
    id: 'custom_proving_ground',
    name: 'Proving Ground',
    giverNpcId: 'custom_commander_vael',
    turnInNpcId: 'custom_commander_vael',
    text: 'The ashwalker drakes have pushed to the edges of our camp, $N. Thin their numbers -- ten of them -- and prove you belong in the Blight.',
    completionText: 'Ten drakes down. Not bad. You might just survive out here, $N.',
    objectives: [
      { type: 'kill', targetMobId: 'custom_ashwalker_drake', count: 10, label: 'Ashwalker Drakes slain' },
    ],
    xpReward: 3000,
    copperReward: 80,
    itemRewards: {},
    minLevel: 18,
  },

  // Quest 2: Collect 8 drake scales -- materials for dragonslaying gear.
  custom_marks_of_the_drake: {
    id: 'custom_marks_of_the_drake',
    name: 'Marks of the Drake',
    giverNpcId: 'custom_commander_vael',
    turnInNpcId: 'custom_commander_vael',
    text: 'Drake scales are tough as plate, $N. I need eight of them to outfit the next patrol. The drakes do not give them up easily -- take what you can.',
    completionText: 'Eight scales. These will hold up against fire better than anything we can forge. Well done.',
    objectives: [
      { type: 'collect', itemId: 'custom_drake_scale', count: 8, label: 'Ashwalker Drake Scales' },
    ],
    xpReward: 4000,
    copperReward: 100,
    itemRewards: {
      warrior: 'custom_drakebone_shoulders',
      rogue:   'custom_blight_stalkers_hood',
      mage:    'custom_scorchwing_cowl',
    },
    minLevel: 18,
    requiresQuest: 'custom_proving_ground',
  },

  // Quest 3: Kill 8 scorchwing wyverns AND collect 5 wyvern heartstones.
  // Directed by Scout Fenris deeper in the zone.
  custom_into_the_blight: {
    id: 'custom_into_the_blight',
    name: 'Into the Blight',
    giverNpcId: 'custom_scout_fenris',
    turnInNpcId: 'custom_scout_fenris',
    text: 'Those scorchwing wyverns are nesting between us and the dungeon, $N. Eight of them need to go, and I need five of their heartstones for the commander\'s alchemist. They\'re deep, but I know you can reach them.',
    completionText: 'The nesting ground is clear. Those heartstones will be worth more to us than you know.',
    objectives: [
      { type: 'kill',    targetMobId: 'custom_scorchwing_wyvern', count: 8, label: 'Scorchwing Wyverns slain' },
      { type: 'collect', itemId: 'custom_wyvern_heartstone',       count: 5, label: 'Scorchwing Heartstones' },
    ],
    xpReward: 5500,
    copperReward: 150,
    itemRewards: {},
    minLevel: 19,
    requiresQuest: 'custom_marks_of_the_drake',
  },

  // Quest 4: Slay 3 blighted sentinels and collect 3 blight embers from them.
  custom_eye_of_the_storm: {
    id: 'custom_eye_of_the_storm',
    name: 'Eye of the Storm',
    giverNpcId: 'custom_scout_fenris',
    turnInNpcId: 'custom_scout_fenris',
    text: 'The blighted sentinels are Ignaraxis\'s outer guard, $N. Ancient dragonkin warped by centuries near that creature. Take down three of them and bring me the blight embers from their cores. If you can manage them, you\'re ready for the maw.',
    completionText: 'Three sentinels down and embers in hand. You\'re ready, $N. Go speak with Elder Draxis back at the post. He has been waiting a long time for this.',
    objectives: [
      { type: 'kill',    targetMobId: 'custom_blighted_sentinel', count: 3, label: 'Blighted Sentinels slain' },
      { type: 'collect', itemId: 'custom_blight_ember',           count: 3, label: 'Blight Embers' },
    ],
    xpReward: 7000,
    copperReward: 200,
    itemRewards: {},
    minLevel: 20,
    requiresQuest: 'custom_into_the_blight',
    suggestedPlayers: 2,
  },

  // Quest 5: Enter Dragon's Maw and slay Ignaraxis. The epic culmination.
  custom_eternal_flame: {
    id: 'custom_eternal_flame',
    name: 'The Eternal Flame',
    giverNpcId: 'custom_elder_draxis',
    turnInNpcId: 'custom_elder_draxis',
    text: 'Ignaraxis the Eternal has slumbered in the Dragon\'s Maw for an age, $N. The Blight above us is his breath given form. Enter the maw, face him in his lair, and end it. Your companions will be necessary -- this is not a hunt for one alone.',
    completionText: 'The Eternal Flame is extinguished, $N. I have waited thirty years to say those words. The Blight will fade now. Take this -- you\'ve more than earned it.',
    objectives: [
      { type: 'kill', targetMobId: 'custom_ignaraxis', count: 1, label: 'Ignaraxis the Eternal slain' },
    ],
    xpReward: 10000,
    copperReward: 600,
    itemRewards: {
      warrior: 'custom_ignaraxis_greatblade',
      rogue:   'custom_fang_of_ignaraxis',
      mage:    'custom_cinderstave_eternal',
    },
    minLevel: 20,
    requiresQuest: 'custom_eye_of_the_storm',
    suggestedPlayers: 3,
  },

  // Ambient patrol quest: run alongside the main chain for extra XP.
  // No requiresQuest -- available from the moment players reach the Blight.
  custom_blight_patrol: {
    id: 'custom_blight_patrol',
    name: 'Blight Patrol',
    giverNpcId: 'custom_commander_vael',
    turnInNpcId: 'custom_commander_vael',
    text: 'We cannot let the drakes and wyverns overrun the approaches, $N. Patrol the Blight, cut down fifteen drakes and eight wyverns, and report back. Keeps our flanks clear while the chain of command handles the bigger picture.',
    completionText: 'Flanks are clear. The men breathe easier when someone is out there making a difference. Good work, $N.',
    objectives: [
      { type: 'kill', targetMobId: 'custom_ashwalker_drake',   count: 15, label: 'Ashwalker Drakes slain' },
      { type: 'kill', targetMobId: 'custom_scorchwing_wyvern', count: 8,  label: 'Scorchwing Wyverns slain' },
    ],
    xpReward: 4000,
    copperReward: 250,
    itemRewards: {},
    minLevel: 18,
  },
};

export const CUSTOM_QUEST_ORDER: string[] = [
  'custom_proving_ground',
  'custom_marks_of_the_drake',
  'custom_blight_patrol',
  'custom_into_the_blight',
  'custom_eye_of_the_storm',
  'custom_eternal_flame',
];

// ---------------------------------------------------------------------------
// Camps -- ALWAYS append new camps at the end; never reorder existing entries
// ---------------------------------------------------------------------------
export const CUSTOM_CAMPS: CampDef[] = [
  // Ashwalker drakes -- near the hub and along the southern blight
  { mobId: 'custom_ashwalker_drake', center: { x: 40,  z: 930  }, radius: 25, count: 6 },
  { mobId: 'custom_ashwalker_drake', center: { x: -50, z: 950  }, radius: 20, count: 5 },
  { mobId: 'custom_ashwalker_drake', center: { x: 20,  z: 980  }, radius: 22, count: 5 },
  { mobId: 'custom_ashwalker_drake', center: { x: -30, z: 1010 }, radius: 18, count: 4 },

  // Scorchwing wyverns -- deeper in the zone, past the scout outpost
  { mobId: 'custom_scorchwing_wyvern', center: { x: 55,  z: 1050 }, radius: 28, count: 5 },
  { mobId: 'custom_scorchwing_wyvern', center: { x: -10, z: 1075 }, radius: 24, count: 4 },
  { mobId: 'custom_scorchwing_wyvern', center: { x: 35,  z: 1110 }, radius: 20, count: 4 },

  // Blighted sentinels -- patrolling near the dungeon entrance
  { mobId: 'custom_blighted_sentinel', center: { x: -60, z: 1140 }, radius: 30, count: 2 },
  { mobId: 'custom_blighted_sentinel', center: { x: 10,  z: 1170 }, radius: 25, count: 2 },

  // Skullfire Brutes -- southern blight edge, between the drake packs
  { mobId: 'custom_skullfire_brute', center: { x: 60,  z: 915 }, radius: 22, count: 4 },
  { mobId: 'custom_skullfire_brute', center: { x: -40, z: 935 }, radius: 20, count: 4 },

  // Blightshroud Stalkers -- north of the scout outpost
  { mobId: 'custom_blightshroud_stalker', center: { x: -45, z: 1100 }, radius: 22, count: 3 },
  { mobId: 'custom_blightshroud_stalker', center: { x: 30,  z: 1130 }, radius: 20, count: 3 },

  // Ironpelt Monkroose -- scattered across the southern blight
  { mobId: 'custom_ironpelt_monkroose', center: { x: -65, z: 910 }, radius: 25, count: 5 },
  { mobId: 'custom_ironpelt_monkroose', center: { x: 25,  z: 945 }, radius: 22, count: 4 },
];

// ---------------------------------------------------------------------------
// Ground objects
// ---------------------------------------------------------------------------
export const CUSTOM_OBJECTS: GroundObjectDef[] = [];

// ---------------------------------------------------------------------------
// Roads
// ---------------------------------------------------------------------------
export const CUSTOM_ROADS: { x: number; z: number }[][] = [
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
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'inn',   x: 0,   z: 962, w: 12, d: 10, rot: 0 },
    { kind: 'house', x: -18, z: 958, w: 10, d: 8,  rot: 0 },
  ],
  wells:     [{ x: 8, z: 955, r: 1.5 }],
  stalls:    [{ x: 16, z: 960, rot: Math.PI / 2, r: 2.5 }],
  tents:     [{ x: -22, z: 1082, rot: 0, scale: 1.0 }],
  campfires: [
    [0,   972],
    [-22, 1086],
  ],
  crates:    [
    [20,  958],
    [-15, 963],
  ],
  fences:    [],
  mines:     [],
  docks:     [],
  mudHuts:   [],
  ruinRings: [{ x: -50, z: 1140, ringR: 18, columns: 6 }],
  graveyards: [{ x: -10, z: 958 }],
};

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------
export const CUSTOM_ZONES: ZoneDef[] = [
  {
    id: 'custom_dragons_blight',
    name: "Dragon's Blight",
    zMin: 900, zMax: 1260,
    levelRange: [18, 20],
    biome: 'peaks',
    hub: { x: 0, z: 960, radius: 32, name: 'Blightwatch Post' },
    graveyard: { x: -14, z: 972 },
    lakes: [],
    pois: [
      { x: 0,   z: 960,  label: 'Blightwatch Post' },
      { x: -25, z: 1080, label: "Fenris's Outpost" },
      { x: -48, z: 1190, label: "Dragon's Maw" },
    ],
    welcome: "The Dragon's Blight stretches before you, choked with ash and the distant echo of ancient fire.",
  },
];

// ---------------------------------------------------------------------------
// Dungeons
// ---------------------------------------------------------------------------
export const CUSTOM_DUNGEON_DEFS: Record<string, DungeonDef> = {
  custom_dragons_maw: {
    id: 'custom_dragons_maw',
    name: "Dragon's Maw",
    index: 6,                           // x-origin = 900 + 6*600 = 4500 (must be < ARENA_X_MIN 4700)
    doorPos: { x: -48, z: 1190 },      // overworld entrance portal
    entry: { x: 0, z: 20 },
    exitOffset: { x: 0, z: 5 },
    interior: 'dragons_maw',
    suggestedPlayers: 3,
    enterText: "The heat is suffocating. Something vast stirs in the darkness ahead.",
    leaveText: "You emerge from the Dragon's Maw, the air outside cold against your skin.",
    spawns: [
      { mobId: 'custom_dragonclaw_warden', x: -12, z: 35 },
      { mobId: 'custom_dragonclaw_warden', x: 12,  z: 35 },
      { mobId: 'custom_dragonclaw_warden', x: -15, z: 65 },
      { mobId: 'custom_dragonclaw_warden', x: 15,  z: 65 },
      { mobId: 'custom_dragonclaw_warden', x: -8,  z: 95 },
      { mobId: 'custom_dragonclaw_warden', x: 8,   z: 95 },
      { mobId: 'custom_ignaraxis',         x: 0,   z: 130 },
    ],
  },
};
