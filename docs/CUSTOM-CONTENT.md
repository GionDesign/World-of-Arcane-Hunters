# Adding Custom Content

This guide explains how to add custom mobs, items, zones, quests, NPCs, and dungeons
to your fork without touching any upstream code. Everything goes in one file:
`src/sim/content/custom/index.ts`.

**How it works:** `data.ts` (the engine's content merge layer) imports your custom
content file and appends it to every lookup table the game uses. Your mobs appear in
the world alongside upstream mobs; your items drop from loot tables; your quests show
up in the quest log. The engine cannot tell the difference.

---

## Quick start — your first mob in 5 minutes

Open `src/sim/content/custom/index.ts`. Find `CUSTOM_MOBS` and `CUSTOM_CAMPS` and
add one entry each:

```typescript
export const CUSTOM_MOBS: Record<string, MobTemplate> = {
  custom_direwolf: {
    id: 'custom_direwolf',
    name: 'Dire Wolf',
    minLevel: 15, maxLevel: 18,
    family: 'beast',
    hpBase: 55, hpPerLevel: 22,
    dmgBase: 9, dmgPerLevel: 2.2,
    attackSpeed: 1.8,
    armorPerLevel: 14,
    moveSpeed: 9,
    aggroRadius: 12,
    loot: [{ copper: 60, chance: 1 }],
    scale: 1.1, color: 0x777777,
  },
};

export const CUSTOM_CAMPS: CampDef[] = [
  { mobId: 'custom_direwolf', center: { x: 60, z: 50 }, radius: 20, count: 5 },
];
```

Start the dev server (`npm run dev`) and navigate to x=60, z=50 in the world. Five
dire wolves will be roaming there. That's the whole loop.

---

## Content types

### Mobs (creatures)

Mobs are defined in `CUSTOM_MOBS` and spawned via `CUSTOM_CAMPS`. A mob definition
describes its stats; a camp entry tells the world where and how many to place.

**Required fields:**

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID. Must start with `custom_`. Must match the key name. |
| `name` | string | Display name shown to players. |
| `minLevel` / `maxLevel` | number | Level range. Individual spawns are randomized within this range. |
| `family` | string | Mob type — affects abilities and player bonuses. See families below. |
| `hpBase` | number | HP at level 1. |
| `hpPerLevel` | number | HP added per level (so HP = hpBase + level * hpPerLevel). |
| `dmgBase` | number | Minimum damage at level 1. |
| `dmgPerLevel` | number | Damage scaling per level. |
| `attackSpeed` | number | Seconds between auto-attacks (1.5-2.5 is typical). |
| `armorPerLevel` | number | Armor per level (16-20 is light, 30-40 is heavy). |
| `moveSpeed` | number | Movement speed (8-10 for normal mobs). |
| `aggroRadius` | number | Yards at which an equal-level mob detects players (8-15 typical). |
| `loot` | array | What the mob drops. See Loot section below. |
| `scale` | number | Visual size multiplier (1.0 = normal). |
| `color` | number | Hex color tint for the procedural mesh (e.g. `0x886644` for brown). |

**Families:** `beast`, `humanoid`, `murloc`, `spider`, `kobold`, `undead`, `troll`,
`ogre`, `elemental`, `dragonkin`, `demon`

**Optional modifiers:**

```typescript
boss: true,        // boss frame, skull icon on minimap
elite: true,       // 2.3x HP, 1.5x damage, 2x XP
rare: true,        // rare spawn quality framing
ccImmune: true,    // immune to crowd-control effects
canSwim: true,     // can follow players into water
respawnMult: 2,    // spawns twice as fast as default
```

**Boss mechanics** (for named boss mobs):

```typescript
// AoE pulse: deals damage to everyone within radius every N seconds
aoePulse: { min: 20, max: 30, radius: 10, every: 5, name: 'Shadow Pulse' },

// Enrage: damage multiplier when HP drops below threshold
enrage: { belowHpPct: 0.25, dmgMult: 1.5 },

// Add spawns: summons minions at HP thresholds
summonAdds: { mobId: 'custom_shadow_spawn', count: 3, atHpPct: [0.5, 0.25] },
```

**Full mob example:**

```typescript
export const CUSTOM_MOBS: Record<string, MobTemplate> = {
  custom_direwolf: {
    id: 'custom_direwolf',
    name: 'Dire Wolf',
    minLevel: 15, maxLevel: 18,
    family: 'beast',
    hpBase: 55, hpPerLevel: 22,
    dmgBase: 9, dmgPerLevel: 2.2,
    attackSpeed: 1.8,
    armorPerLevel: 14,
    moveSpeed: 9,
    aggroRadius: 12,
    loot: [
      { copper: 60, chance: 1 },
      { itemId: 'custom_wolf_pelt', chance: 0.8 },
      { itemId: 'custom_wolf_fang', chance: 0.4 },
    ],
    scale: 1.1, color: 0x555555,
  },

  custom_alpha_wolf: {
    id: 'custom_alpha_wolf',
    name: 'Alpha Wolf',
    minLevel: 20, maxLevel: 20,
    family: 'beast',
    hpBase: 120, hpPerLevel: 40,
    dmgBase: 14, dmgPerLevel: 3.5,
    attackSpeed: 1.6,
    armorPerLevel: 20,
    moveSpeed: 8,
    aggroRadius: 16,
    boss: true,
    elite: true,
    enrage: { belowHpPct: 0.3, dmgMult: 1.4 },
    loot: [
      { copper: 500, chance: 1 },
      { itemId: 'custom_alpha_fang', chance: 1.0 },
    ],
    scale: 1.4, color: 0x222222,
  },
};
```

---

### Camps (mob spawns)

Camps tell the world where to place mob spawns in the overworld. Add entries to
`CUSTOM_CAMPS`.

```typescript
export const CUSTOM_CAMPS: CampDef[] = [
  {
    mobId: 'custom_direwolf',   // must exist in CUSTOM_MOBS or MOBS
    center: { x: 60, z: 50 },  // world coordinates (see Coordinates section)
    radius: 20,                  // mobs roam within this radius of center
    count: 5,                    // how many spawn
  },
  {
    mobId: 'custom_alpha_wolf',
    center: { x: 80, z: 70 },
    radius: 4,
    count: 1,
  },
];
```

> **Determinism rule:** Never reorder existing entries in `CUSTOM_CAMPS`. Each entry
> draws from the world-generation RNG in array order. Inserting before an existing
> entry shifts all later camp positions. Always append new camps at the end.

**World coordinates:** The world is a north-south strip. x runs from -180 to 180
(west to east). z runs from about -90 (south, Zone 1 start) to 360 (north, Zone 3
end). Zone 1 is roughly z: -90 to 0, Zone 2 is z: 0 to 180, Zone 3 is z: 180 to
360. Custom zones (if you add them) start at z: 360 and go north from there.

---

### Items

Items are defined in `CUSTOM_ITEMS`. Every item referenced in mob loot or quest
rewards must exist here.

**Item kinds and slots:**

| Kind | Description |
|---|---|
| `weapon` | Equippable weapon. Requires `slot` and `weapon`. |
| `armor` | Equippable armor. Requires `slot` and `stats` or `armorType`. |
| `quest` | Quest item. Not equippable, typically no sell value. |
| `food` | Consumable; regenerates HP while sitting. Use `foodHp`. |
| `drink` | Consumable; regenerates mana while sitting. Use `drinkMana`. |
| `potion` | Consumable; restores HP instantly. Use `potionHp`. |
| `elixir` | Consumable; grants a temporary stat buff. Use `elixir`. |
| `junk` | Vendor trash. Set a `sellValue`. |

**Weapon slots:** `mainhand`, `offhand`, `twohand`, `ranged`

**Armor slots:** `head`, `chest`, `legs`, `feet`, `hands`, `waist`, `wrist`,
`back`, `neck`, `ring`, `trinket`

**Quality (name color):** `poor` (gray), `common` (white), `uncommon` (green),
`rare` (blue), `epic` (purple), `legendary` (orange)

**Full item examples:**

```typescript
export const CUSTOM_ITEMS: Record<string, ItemDef> = {
  // Quest item (for mob loot or quest objectives)
  custom_wolf_pelt: {
    id: 'custom_wolf_pelt',
    name: 'Dire Wolf Pelt',
    kind: 'quest',
    slot: undefined,
    quality: 'common',
    sellValue: 25,
  },

  // Vendor trash (junk drop)
  custom_wolf_fang: {
    id: 'custom_wolf_fang',
    name: 'Wolf Fang',
    kind: 'junk',
    quality: 'poor',
    sellValue: 10,
  },

  // Weapon (two-handed sword for warriors)
  custom_alpha_fang_sword: {
    id: 'custom_alpha_fang_sword',
    name: "Alpha's Fang Sword",
    kind: 'weapon',
    slot: 'twohand',
    quality: 'uncommon',
    requiredClass: ['warrior'],
    sellValue: 200,
    weapon: {
      minDmg: 18, maxDmg: 28,
      attackSpeed: 3.4,
      dps: 6.8,
    },
  },

  // Armor (leather chest for rogues and hunters)
  custom_wolf_hide_chest: {
    id: 'custom_wolf_hide_chest',
    name: 'Wolfskin Vest',
    kind: 'armor',
    slot: 'chest',
    quality: 'uncommon',
    armorType: 'leather',
    requiredClass: ['rogue', 'hunter'],
    sellValue: 150,
    stats: { agility: 8, stamina: 6 },
  },

  // Food (sits and eats to restore HP)
  custom_wolf_steak: {
    id: 'custom_wolf_steak',
    name: 'Wolf Steak',
    kind: 'food',
    quality: 'common',
    sellValue: 5,
    foodHp: 120,  // total HP restored over 18 seconds while sitting
  },

  // Elixir (temporary stat buff)
  custom_hunters_elixir: {
    id: 'custom_hunters_elixir',
    name: "Hunter's Elixir",
    kind: 'elixir',
    quality: 'uncommon',
    sellValue: 80,
    elixir: {
      aura: "Hunter's Focus",
      kind: 'buff_ap',      // attack power buff
      value: 20,            // +20 attack power
      duration: 3600,       // 1 hour in seconds
    },
  },
};
```

**Stats available for armor:** `strength`, `agility`, `stamina`, `intellect`,
`spirit`, `spellPower`, `attackPower`, `critChance`, `hitChance`, `defense`,
`dodge`, `parry`, `armor`

---

### Quests

Quests connect NPCs, mobs, and items into a progression. A quest needs a giver NPC,
a turn-in NPC (can be the same), and at least one objective.

**Objective types:**

| Type | What it requires |
|---|---|
| `kill` | Kill `count` of mob `targetMobId` |
| `collect` | Pick up `count` items with `itemId` from mob loot |
| `interact` | Interact with NPC `targetNpcId` or ground object `targetObjectItemId` |

**Full quest example:**

```typescript
export const CUSTOM_QUESTS: Record<string, QuestDef> = {
  custom_q_wolf_threat: {
    id: 'custom_q_wolf_threat',
    name: 'The Wolf Threat',
    giverNpcId: 'custom_ranger_npc',      // must exist in CUSTOM_NPCS
    turnInNpcId: 'custom_ranger_npc',
    text: 'The dire wolves have been attacking our scouts. Kill 8 of them and '
        + 'bring me 5 pelts as proof.',
    completionText: 'Well done. The pack will think twice about coming near camp.',
    objectives: [
      {
        type: 'kill',
        targetMobId: 'custom_direwolf',
        count: 8,
        label: 'Dire Wolves slain',
      },
      {
        type: 'collect',
        itemId: 'custom_wolf_pelt',
        count: 5,
        label: 'Dire Wolf Pelts',
      },
    ],
    xpReward: 800,
    copperReward: 200,      // 2 silver
    itemRewards: {
      warrior: 'custom_alpha_fang_sword',
      rogue: 'custom_wolf_hide_chest',
      mage: 'custom_wolf_hide_chest',     // use archetype: warrior/rogue/mage
    },
    minLevel: 14,
  },
};

// List quest IDs in the order players receive them (controls quest-log ordering).
export const CUSTOM_QUEST_ORDER: string[] = [
  'custom_q_wolf_threat',
];
```

> **Item rewards** are keyed by class archetype: `warrior` (covers warrior, paladin,
> shaman), `rogue` (covers rogue, hunter), `mage` (covers mage, priest, warlock,
> druid). You can also key by any specific class to give it a different reward.
> It is fine to give the same item to multiple archetypes (as above).

---

### NPCs

NPCs are quest givers, vendors, and trainers placed in the world at fixed positions.

```typescript
export const CUSTOM_NPCS: Record<string, NpcDef> = {
  custom_ranger_npc: {
    id: 'custom_ranger_npc',
    name: 'Ranger Aldwyn',
    title: 'Wilderness Scout',
    pos: { x: 65, z: 55 },    // world coordinates (near the wolf camp)
    facing: 3.14,              // facing direction in radians (3.14 = south)
    color: 0x996633,           // NPC color tint
    questIds: ['custom_q_wolf_threat'],   // quests this NPC offers
    greeting: 'Watch yourself out there. The wolves are restless.',
    vendorItems: ['custom_wolf_steak', 'custom_hunters_elixir'],  // optional
  },
};
```

> **`facing`:** 0 = north, 1.57 = east, 3.14 = south, 4.71 = west

---

### Zones (maps)

Custom zones extend the world northward. Zones are z-axis bands; the last upstream
zone ends at `zMax: 360`, so start custom zones at `zMin: 360`.

**Biomes:** `vale` (green grassland), `marsh` (dark swamp), `peaks` (gray mountains)

```typescript
export const CUSTOM_ZONES: ZoneDef[] = [
  {
    id: 'custom_ashenmoor',
    name: 'The Ashenmoor',
    zMin: 360, zMax: 540,
    levelRange: [18, 25],
    biome: 'peaks',
    hub: {
      x: 0, z: 450,
      radius: 30,
      name: 'Ashenmoor Outpost',
    },
    graveyard: { x: -20, z: 455 },   // where players respawn in this zone
    lakes: [
      { x: 40, z: 420, radius: 15 }, // optional decorative lakes
    ],
    pois: [
      { x: 0, z: 450, label: 'Ashenmoor Outpost' },
      { x: -60, z: 510, label: 'The Shattered Peaks' },
    ],
    welcome: 'The Ashenmoor stretches before you, silent and cold.',
  },
];
```

Place your zone's mob camps inside the `zMin`/`zMax` band:

```typescript
export const CUSTOM_CAMPS: CampDef[] = [
  { mobId: 'custom_direwolf', center: { x: -60, z: 410 }, radius: 25, count: 6 },
  { mobId: 'custom_alpha_wolf', center: { x: -55, z: 420 }, radius: 6, count: 1 },
];
```

---

### Dungeons

Dungeons are instanced encounters — each group gets a private copy. Players enter
through a portal in the overworld and fight through a structured layout.

**Before creating a dungeon you need:**
- Custom dungeon mobs (`CUSTOM_DUNGEON_MOBS`) — separate from overworld mobs
- A dungeon definition (`CUSTOM_DUNGEON_DEFS`) — the entrance, layout, and spawn list

**Available interior layouts:** `crypt`, `sanctum`, `temple`, `nythraxis`
(These control the renderer geometry and collision. You cannot add new interior types
without touching the upstream renderer, which is an upstream file change.)

**Dungeon index:** must be unique. Upstream uses 0-2; temple uses 3+. Use **10+**.
The x-origin of each dungeon instance is `900 + index * 600`, so index 10 = x: 6900.

```typescript
// Mobs that ONLY appear inside this dungeon (not in the overworld):
export const CUSTOM_DUNGEON_MOBS: Record<string, MobTemplate> = {
  custom_dungeon_skeleton: {
    id: 'custom_dungeon_skeleton',
    name: 'Risen Skeleton',
    minLevel: 20, maxLevel: 22,
    family: 'undead',
    hpBase: 90, hpPerLevel: 30,
    dmgBase: 12, dmgPerLevel: 3.0,
    attackSpeed: 2.0,
    armorPerLevel: 25,
    moveSpeed: 7,
    aggroRadius: 10,
    loot: [{ copper: 80, chance: 1 }],
    scale: 1.0, color: 0xddddcc,
  },

  custom_dungeon_boss: {
    id: 'custom_dungeon_boss',
    name: 'The Bonelord',
    minLevel: 22, maxLevel: 22,
    family: 'undead',
    hpBase: 800, hpPerLevel: 120,
    dmgBase: 20, dmgPerLevel: 4.0,
    attackSpeed: 2.0,
    armorPerLevel: 30,
    moveSpeed: 6,
    aggroRadius: 20,
    boss: true,
    elite: true,
    aoePulse: { min: 15, max: 25, radius: 8, every: 8, name: 'Bone Shatter' },
    enrage: { belowHpPct: 0.2, dmgMult: 1.6 },
    loot: [
      { copper: 2000, chance: 1 },
      { itemId: 'custom_alpha_fang_sword', chance: 0.3 },
    ],
    scale: 1.3, color: 0x888877,
  },
};

// Spawn positions are relative to the dungeon instance origin (not world coords):
export const CUSTOM_DUNGEON_DEFS: Record<string, DungeonDef> = {
  custom_bone_crypt: {
    id: 'custom_bone_crypt',
    name: 'The Bone Crypt',
    index: 10,                              // unique, use 10+
    doorPos: { x: -30, z: 380 },           // overworld entrance portal position
    entry: { x: 0, z: 4 },                 // player arrives here (instance-local)
    exitOffset: { x: 0, z: -6 },           // exit portal (instance-local)
    interior: 'crypt',                      // 'crypt' | 'sanctum' | 'temple' | 'nythraxis'
    suggestedPlayers: 5,
    enterText: 'You descend into the Bone Crypt.',
    leaveText: 'You emerge from the darkness.',
    spawns: [
      // x and z are relative to the instance origin
      { mobId: 'custom_dungeon_skeleton', x: 0, z: 20 },
      { mobId: 'custom_dungeon_skeleton', x: 5, z: 25 },
      { mobId: 'custom_dungeon_skeleton', x: -5, z: 25 },
      { mobId: 'custom_dungeon_skeleton', x: 0, z: 45 },
      { mobId: 'custom_dungeon_boss', x: 0, z: 70 },   // boss at the back
    ],
  },
};
```

---

### Ground objects (collectibles)

Ground objects are sparkle items players can click to pick up — herbs, ore nodes,
quest items in the world.

```typescript
export const CUSTOM_OBJECTS: GroundObjectDef[] = [
  {
    itemId: 'custom_wolf_pelt',        // item added to inventory when clicked
    name: 'Scattered Pelt',            // display name when hovering
    positions: [
      { x: 55, z: 45 },
      { x: 70, z: 60 },
      { x: 45, z: 70 },
    ],
  },
];
```

---

### Static world props

Props are static geometry — buildings, wells, campfires, tents, docks, and so on.
They block player movement (collision) and are rendered by the engine. Add them to
`CUSTOM_PROPS`.

```typescript
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'house', x: 65, z: 55, w: 8, d: 6, rot: 0 },   // near the NPC
  ],
  wells: [{ x: 62, z: 58, r: 1.5 }],
  campfires: [[65, 60]],   // [x, z] pairs
  tents: [{ x: 70, z: 50, rot: 0.5, scale: 1.0 }],
  // Leave everything else empty:
  stalls: [], mines: [], docks: [], crates: [], mudHuts: [],
  ruinRings: [], fences: [], graveyards: [],
};
```

---

## Putting it all together — a complete example

This is a minimal but complete custom zone with one quest chain:

```typescript
// ── Items ────────────────────────────────────────────────────────────────────

export const CUSTOM_ITEMS: Record<string, ItemDef> = {
  custom_wolf_pelt: {
    id: 'custom_wolf_pelt', name: 'Dire Wolf Pelt',
    kind: 'quest', quality: 'common', sellValue: 25,
  },
  custom_scout_sword: {
    id: 'custom_scout_sword', name: "Scout's Edge",
    kind: 'weapon', slot: 'mainhand', quality: 'uncommon',
    sellValue: 300,
    weapon: { minDmg: 12, maxDmg: 18, attackSpeed: 2.4, dps: 6.25 },
  },
  custom_scout_staff: {
    id: 'custom_scout_staff', name: "Scout's Staff",
    kind: 'weapon', slot: 'twohand', quality: 'uncommon',
    sellValue: 300,
    weapon: { minDmg: 14, maxDmg: 22, attackSpeed: 2.8, dps: 6.4 },
  },
};

// ── Mobs ─────────────────────────────────────────────────────────────────────

export const CUSTOM_MOBS: Record<string, MobTemplate> = {
  custom_direwolf: {
    id: 'custom_direwolf', name: 'Dire Wolf',
    minLevel: 15, maxLevel: 18,
    family: 'beast',
    hpBase: 55, hpPerLevel: 22,
    dmgBase: 9, dmgPerLevel: 2.2,
    attackSpeed: 1.8, armorPerLevel: 14,
    moveSpeed: 9, aggroRadius: 12,
    loot: [
      { copper: 60, chance: 1 },
      { itemId: 'custom_wolf_pelt', chance: 0.5 },
    ],
    scale: 1.1, color: 0x555555,
  },
};
export const CUSTOM_DUNGEON_MOBS: Record<string, MobTemplate> = {};

// ── NPCs ─────────────────────────────────────────────────────────────────────

export const CUSTOM_NPCS: Record<string, NpcDef> = {
  custom_scout_captain: {
    id: 'custom_scout_captain', name: 'Captain Vayne',
    title: 'Ashenmoor Scouts',
    pos: { x: 2, z: 450 }, facing: 3.14,
    color: 0x886644,
    questIds: ['custom_q_wolves'],
    greeting: 'The wolves grow bolder by the day. We need your help.',
  },
};

// ── Quests ───────────────────────────────────────────────────────────────────

export const CUSTOM_QUESTS: Record<string, QuestDef> = {
  custom_q_wolves: {
    id: 'custom_q_wolves', name: 'Dire Warning',
    giverNpcId: 'custom_scout_captain', turnInNpcId: 'custom_scout_captain',
    text: 'The dire wolves have been attacking our patrols. Slay 10 of them '
        + 'and collect 5 pelts as proof.',
    completionText: 'Good work. That should buy us some peace.',
    objectives: [
      { type: 'kill', targetMobId: 'custom_direwolf', count: 10, label: 'Dire Wolves slain' },
      { type: 'collect', itemId: 'custom_wolf_pelt', count: 5, label: 'Dire Wolf Pelts' },
    ],
    xpReward: 900,
    copperReward: 300,
    itemRewards: { warrior: 'custom_scout_sword', mage: 'custom_scout_staff', rogue: 'custom_scout_sword' },
    minLevel: 14,
  },
};
export const CUSTOM_QUEST_ORDER: string[] = ['custom_q_wolves'];

// ── Camps ────────────────────────────────────────────────────────────────────

export const CUSTOM_CAMPS: CampDef[] = [
  { mobId: 'custom_direwolf', center: { x: -40, z: 410 }, radius: 25, count: 6 },
  { mobId: 'custom_direwolf', center: { x: 40, z: 420 }, radius: 20, count: 5 },
];

// ── Objects / Roads / Props / Dungeons ───────────────────────────────────────

export const CUSTOM_OBJECTS: GroundObjectDef[] = [];
export const CUSTOM_ROADS: { x: number; z: number }[][] = [];
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [{ kind: 'house', x: 0, z: 452, w: 10, d: 8, rot: 0 }],
  wells: [{ x: -5, z: 455, r: 1.5 }], campfires: [[3, 448]],
  stalls: [], mines: [], docks: [], tents: [], crates: [],
  mudHuts: [], ruinRings: [], fences: [], graveyards: [],
};

// ── Zone ─────────────────────────────────────────────────────────────────────

export const CUSTOM_ZONES: ZoneDef[] = [
  {
    id: 'custom_ashenmoor', name: 'The Ashenmoor',
    zMin: 360, zMax: 540, levelRange: [14, 20],
    biome: 'peaks',
    hub: { x: 0, z: 450, radius: 30, name: 'Ashenmoor Outpost' },
    graveyard: { x: -20, z: 455 },
    lakes: [], pois: [{ x: 0, z: 450, label: 'Ashenmoor Outpost' }],
    welcome: 'The Ashenmoor stretches before you.',
  },
];
export const CUSTOM_DUNGEON_DEFS: Record<string, DungeonDef> = {};
```

---

## Testing

After editing `src/sim/content/custom/index.ts`, start the dev server:

```bash
npm run dev       # client on :5173
npm run server    # game server on :8787 (in a second terminal)
```

Walk to the coordinates of your zone or camps. Use `/teleport x z` (requires
`ALLOW_DEV_COMMANDS=1` in your local `.env`) to jump directly there.

Run the test suite to catch type errors and broken references:

```bash
npm test
# or just the sim test while iterating:
npx vitest run tests/sim.test.ts
```

Common errors:
- `Cannot find mob 'custom_xyz'` — the mob ID in a `CampDef` or `loot` entry does
  not exist in `CUSTOM_MOBS`
- `Cannot find item 'custom_xyz'` — the item ID in loot or a quest reward does not
  exist in `CUSTOM_ITEMS`
- TypeScript error on `biome` — use exactly `'vale'`, `'marsh'`, or `'peaks'`
- TypeScript error on `interior` — use exactly `'crypt'`, `'sanctum'`, `'temple'`,
  or `'nythraxis'`

---

## What you cannot add without touching upstream files

| What | Why | Upstream file needed |
|---|---|---|
| New player classes (a 10th class) | `PlayerClass` is a typed union in `types.ts`; `CLASSES` is keyed by it | `src/sim/types.ts` |
| New dungeon interior layouts | Interior geometry and collision are hardcoded per key | `src/render/dungeon.ts`, `src/sim/dungeon_layout.ts` |
| New biome types | `BiomeId` is a typed union | `src/sim/types.ts` |
| New mob families | `MobFamily` is a typed union | `src/sim/types.ts` |
| New ability types | Ability system is deeply integrated in `sim.ts` | Several sim files |

If you add a new class or biome, document the upstream file changes in
`docs/MAINTAINING-FORK.md` so future merges can re-apply them if needed.
