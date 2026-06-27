# Adding Custom Content

This guide covers every content type you can add to the fork without touching
upstream files. All custom content lives in one file:
`src/sim/content/custom/index.ts`

That file exports named groups which `src/sim/data.ts` appends to the engine's
flat lookup tables. The engine sees your content identically to upstream content.

---

## Before You Start

**File:** Open `src/sim/content/custom/index.ts` in your editor. Every content
type in this guide goes into that single file.

**ID rule:** Prefix every ID with `custom_`. For example: `custom_direwolf`,
`custom_wolf_pelt`, `custom_thornwood_zone`. This prevents any future upstream
name from colliding with yours.

**Testing:** After any change, run:
```bash
npm test
```
Or, faster, just the sim test:
```bash
npx vitest run tests/sim.test.ts
```
Content that references a non-existent ID (a mob's loot item, a quest's mob
target) will cause a runtime error when the sim tries to resolve it.

**World coordinate reference:**
- x: west to east (-180 to +180, with 0 at centre)
- z: increases northward
  - Zone 1 (Eastbrook Vale): z -180 to 180
  - Zone 2 (Mirefen Marsh): z 180 to 540
  - Zone 3 (Thornpeak Heights): z 540 to 900
  - Custom zones: z 2000 and above (see zone overlap notes in section 7)

---

## Content Types

1. [Items](#1-items)
2. [Mobs (overworld creatures)](#2-mobs-overworld-creatures)
3. [Dungeon Mobs](#3-dungeon-mobs)
4. [Camps (mob spawn placement)](#4-camps-mob-spawn-placement)
5. [NPCs (quest givers, vendors)](#5-npcs-quest-givers-vendors)
6. [Quests](#6-quests)
7. [Zones (new world areas)](#7-zones-new-world-areas)
8. [Ground Objects (herbs, ore nodes)](#8-ground-objects-herbs-ore-nodes)
9. [Props (static world geometry)](#9-props-static-world-geometry)
10. [Roads](#10-roads)
11. [Dungeons](#11-dungeons)
12. [Complete working example](#12-complete-working-example)

---

## 1. Items

Items are weapons, armor, consumables, and quest objectives.

**Section in index.ts:** `CUSTOM_ITEMS`

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Display name (English; localized at client) |
| `kind` | string | yes | `'weapon'`, `'armor'`, `'quest'`, `'junk'`, `'food'`, `'drink'`, `'tool'`, `'potion'`, `'elixir'` |
| `slot` | string | for equippable | `'mainhand'`, `'helmet'`, `'shoulder'`, `'chest'`, `'waist'`, `'legs'`, `'gloves'`, `'feet'` |
| `sellValue` | number | yes | Copper the vendor pays (0 for quest items) |
| `buyValue` | number | no | Copper the vendor charges; omit if not sold by a vendor |
| `quality` | string | no | `'poor'`, `'common'`, `'uncommon'`, `'rare'`, `'epic'`, `'legendary'` (default common) |
| `requiredClass` | PlayerClass[] | no | Lock to specific classes (e.g. `['warrior', 'paladin']`) |
| `stats` | object | no | Stat bonuses for equippable items (see Stats shape below) |
| `weapon` | object | no | Weapon stats (see below) |
| `armorType` | string | no | `'cloth'`, `'leather'`, `'mail'` |
| `foodHp` | number | no | Total HP restored over 18 sec when sitting (food items) |
| `drinkMana` | number | no | Total mana restored over 18 sec when sitting (drink items) |
| `potionHp` | number | no | HP restored instantly in combat (potion items) |
| `potionMana` | number | no | Mana restored instantly in combat (potion items) |
| `elixir` | object | no | Temporary stat-buff aura on use (see below) |
| `questId` | string | no | Quest this item is tied to; restricts drop to when quest is active |
| `noVendorSell` | boolean | no | Prevent player from selling to vendors |
| `noDiscard` | boolean | no | Prevent player from discarding |

**Stats shape** (all fields optional):
```typescript
stats: {
  strength: number,
  agility: number,
  stamina: number,
  intellect: number,
  spirit: number,
  attackPower: number,
  spellPower: number,
  armor: number,
}
```

**Weapon shape:**
```typescript
weapon: {
  dps: number,          // damage per second
  speed: number,        // attack speed in seconds (e.g. 2.0)
  type: 'sword' | 'axe' | 'mace' | 'dagger' | 'polearm' | 'staff' | 'wand' | 'bow' | 'gun',
}
```

**Elixir shape:**
```typescript
elixir: {
  aura: string,         // flavor name shown in buff frame
  kind: AuraKind,       // e.g. 'buff_ap', 'buff_sta', 'buff_int'
  value: number,        // stat amount
  duration: number,     // buff length in seconds
}
```

### Step-by-step

1. Open `src/sim/content/custom/index.ts`.
2. Add your item inside the `CUSTOM_ITEMS` object:

```typescript
export const CUSTOM_ITEMS: Record<string, ItemDef> = {
  custom_wolf_pelt: {
    id: 'custom_wolf_pelt',
    name: 'Wolf Pelt',
    kind: 'quest',
    slot: 'quest',
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
    buyValue: 480,
    armorType: undefined,
    weapon: { dps: 14, speed: 2.4, type: 'sword' },
    stats: { strength: 8, stamina: 5 },
    requiredClass: ['warrior', 'paladin'],
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
```

3. If the item is a quest reward, you will reference its ID in your quest's
   `itemRewards` field (see [Quests](#6-quests) below).
4. If the item drops from a mob, add it to that mob's `loot` array with `questId`
   if it is a quest drop (see [Mobs](#2-mobs-overworld-creatures) below).
5. If the item is sold by a vendor NPC, add its ID to the NPC's `vendorItems`
   array (see [NPCs](#5-npcs-quest-givers-vendors) below).
6. Run `npm test` to verify no errors.

---

## 2. Mobs (overworld creatures)

Overworld mobs walk the world and appear via camp spawn points.

**Section in index.ts:** `CUSTOM_MOBS`

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Display name (English) |
| `minLevel` | number | yes | Minimum spawn level |
| `maxLevel` | number | yes | Maximum spawn level |
| `family` | MobFamily | yes | `'beast'`, `'humanoid'`, `'murloc'`, `'spider'`, `'kobold'`, `'undead'`, `'troll'`, `'ogre'`, `'elemental'`, `'dragonkin'`, `'demon'` |
| `hpBase` | number | yes | Base HP at level 1 |
| `hpPerLevel` | number | yes | Additional HP per level |
| `dmgBase` | number | yes | Base damage per hit at level 1 |
| `dmgPerLevel` | number | yes | Additional damage per level |
| `attackSpeed` | number | yes | Seconds between attacks (lower = faster) |
| `armorPerLevel` | number | yes | Armor gained per level |
| `moveSpeed` | number | yes | Movement speed in yards/sec (players move at 7) |
| `aggroRadius` | number | yes | Radius in yards at which mob notices players |
| `loot` | LootEntry[] | yes | Array of loot entries (can be empty: `[]`) |
| `scale` | number | no | Visual scale multiplier (1.0 = normal) |
| `color` | number | no | Hex color tint (e.g. `0x885533`) |
| `elite` | boolean | no | Marks mob as elite (HP/damage bonus) |
| `boss` | boolean | no | Marks mob as a boss |

**Loot entry shape:**
```typescript
{
  itemId?: string,  // item to drop (omit for copper-only drops)
  copper?: number,  // copper amount to drop
  chance: number,   // drop chance from 0 to 1 (1 = always, 0.1 = 10%)
  questId?: string, // only drop while this quest is active and incomplete
}
```

### Step-by-step

1. Open `src/sim/content/custom/index.ts`.
2. Add your mob inside the `CUSTOM_MOBS` object:

```typescript
export const CUSTOM_MOBS: Record<string, MobTemplate> = {
  custom_direwolf: {
    id: 'custom_direwolf',
    name: 'Dire Wolf',
    minLevel: 18,
    maxLevel: 22,
    family: 'beast',
    hpBase: 60,
    hpPerLevel: 25,
    dmgBase: 10,
    dmgPerLevel: 2.5,
    attackSpeed: 1.8,
    armorPerLevel: 15,
    moveSpeed: 9,
    aggroRadius: 12,
    loot: [
      { copper: 80, chance: 1 },
      { itemId: 'custom_wolf_pelt', chance: 0.5, questId: 'custom_hunt_wolves' },
    ],
    scale: 1.2,
    color: 0x444444,
  },
};
```

3. To make this mob appear in the world, add a camp entry in `CUSTOM_CAMPS`
   (see [Camps](#4-camps-mob-spawn-placement) below).
4. Run `npm test` to verify no errors.

---

## 3. Dungeon Mobs

Dungeon mobs are creatures that appear only inside dungeon instances, never in
the overworld. They follow the same shape as overworld mobs.

**Section in index.ts:** `CUSTOM_DUNGEON_MOBS`

### Step-by-step

1. Open `src/sim/content/custom/index.ts`.
2. Add your dungeon mob inside the `CUSTOM_DUNGEON_MOBS` object:

```typescript
export const CUSTOM_DUNGEON_MOBS: Record<string, MobTemplate> = {
  custom_crypt_guardian: {
    id: 'custom_crypt_guardian',
    name: 'Crypt Guardian',
    minLevel: 20,
    maxLevel: 20,
    family: 'undead',
    hpBase: 400,
    hpPerLevel: 0,
    dmgBase: 30,
    dmgPerLevel: 0,
    attackSpeed: 2.2,
    armorPerLevel: 40,
    moveSpeed: 5,
    aggroRadius: 15,
    elite: true,
    loot: [
      { copper: 200, chance: 1 },
      { itemId: 'custom_iron_sword', chance: 0.15 },
    ],
    scale: 1.4,
    color: 0x777799,
  },
};
```

3. Reference this mob's ID in your dungeon's `spawns` array
   (see [Dungeons](#11-dungeons) below).
4. Run `npm test` to verify no errors.

---

## 4. Camps (mob spawn placement)

Camps place mobs at specific locations in the overworld. Each camp defines one
mob type, a centre point, a scatter radius, and a spawn count.

**Section in index.ts:** `CUSTOM_CAMPS`

**Important:** CUSTOM_CAMPS is appended last by `data.ts`. Never reorder
existing camp entries. Each camp draws one world-generation RNG value in
array order; reordering shifts every subsequent camp's spawn positions.

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `mobId` | string | yes | The mob ID to spawn (must exist in CUSTOM_MOBS) |
| `center` | `{x, z}` | yes | World coordinates of the spawn centre |
| `radius` | number | yes | Radius in yards; mobs scatter randomly within this |
| `count` | number | yes | Number of mobs in this camp |

### Step-by-step

1. Decide where in the world you want mobs to appear. For custom zones,
   use coordinates inside your zone's z band (see [Zones](#7-zones-new-world-areas)).
2. Add camp entries at the bottom of the `CUSTOM_CAMPS` array. Always append;
   never insert before existing entries:

```typescript
export const CUSTOM_CAMPS: CampDef[] = [
  // First camp -- appended first, draws first RNG
  { mobId: 'custom_direwolf', center: { x: 30, z: 400 }, radius: 25, count: 6 },
  // Second camp -- always append new camps after existing ones
  { mobId: 'custom_direwolf', center: { x: -40, z: 450 }, radius: 20, count: 4 },
];
```

3. Run `npm test` to verify no errors.

---

## 5. NPCs (quest givers, vendors)

NPCs stand at a fixed world position and can offer quests, sell items, or both.

**Section in index.ts:** `CUSTOM_NPCS`

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Display name (English) |
| `title` | string | yes | Sub-title shown under name (e.g. `'Quest Giver'`; use `''` if none) |
| `pos` | `{x, z}` | yes | World position (place near your zone hub) |
| `facing` | number | yes | Facing direction in radians (0 = south, Math.PI = north) |
| `color` | number | yes | Hex color tint for the NPC model (e.g. `0xCCBB99`) |
| `questIds` | string[] | yes | Array of quest IDs this NPC gives (empty array if none) |
| `vendorItems` | string[] | no | Item IDs this NPC sells (omit if not a vendor) |
| `greeting` | string | yes | Text shown when player opens the NPC dialog (English) |

### Step-by-step

1. Open `src/sim/content/custom/index.ts`.
2. Add your NPC inside the `CUSTOM_NPCS` object:

```typescript
export const CUSTOM_NPCS: Record<string, NpcDef> = {
  custom_ranger_quinn: {
    id: 'custom_ranger_quinn',
    name: 'Ranger Quinn',
    title: 'Scout',
    pos: { x: 5, z: 420 },
    facing: 0,
    color: 0x8B6914,
    questIds: ['custom_hunt_wolves'],
    greeting: 'The wolves beyond camp have grown bold. I need your help, $N.',
  },

  custom_supply_vendor: {
    id: 'custom_supply_vendor',
    name: 'Camp Supplier',
    title: 'Trade Goods',
    pos: { x: 10, z: 415 },
    facing: Math.PI,
    color: 0xAA9977,
    questIds: [],
    vendorItems: ['custom_healing_potion'],
    greeting: 'Stock up before you head out.',
  },
};
```

3. When a quest references this NPC as `giverNpcId` or `turnInNpcId`, the ID
   used must exactly match the `id` field here.
4. Run `npm test` to verify no errors.

---

## 6. Quests

Quests are given by NPCs and have kill, collect, or interact objectives.

**Sections in index.ts:** `CUSTOM_QUESTS` and `CUSTOM_QUEST_ORDER`

### QuestDef fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Quest title (English) |
| `giverNpcId` | string | yes | NPC that gives this quest |
| `turnInNpcId` | string | yes | NPC the player returns to (can be same as giver) |
| `text` | string | yes | Quest description shown to player. `$N` = player name, `$C` = player class |
| `completionText` | string | yes | Text shown on turn-in |
| `objectives` | QuestObjective[] | yes | Array of objectives (see below) |
| `xpReward` | number | yes | XP granted on turn-in |
| `copperReward` | number | yes | Copper granted on turn-in |
| `itemRewards` | object | yes | Class-keyed item rewards (see below) |
| `requiresQuest` | string | no | This quest only becomes available after this quest ID is turned in |
| `minLevel` | number | no | Minimum player level to accept |
| `suggestedPlayers` | number | no | Suggested group size (2, 3, etc.) |

### Objective types

**Kill objective:** Player must kill a specific mob type.
```typescript
{ type: 'kill', targetMobId: 'custom_direwolf', count: 8, label: 'Dire Wolves slain' }
```

**Collect objective:** Player must loot a specific item.
```typescript
{ type: 'collect', itemId: 'custom_wolf_pelt', count: 5, label: 'Wolf Pelts collected' }
```
The item must also be in the mob's `loot` array with `questId` pointing to this
quest (so it only drops while the quest is active).

**Interact objective:** Player must right-click an NPC or ground object.
```typescript
{ type: 'interact', targetNpcId: 'custom_ranger_quinn', count: 1, label: 'Report to Quinn' }
// or for a ground object:
{ type: 'interact', targetObjectItemId: 'custom_standing_stone', count: 3, label: 'Stones activated' }
```

### Item rewards

`itemRewards` maps a `PlayerClass` (or archetype) to an item ID. Use archetypes
to give the same reward to a group of classes:
- `'warrior'` covers warrior, paladin, shaman
- `'rogue'` covers rogue, hunter
- `'mage'` covers mage, priest, warlock, druid

```typescript
itemRewards: {
  warrior: 'custom_iron_sword',    // warriors, paladins, and shamans all get this
  rogue:   'custom_iron_sword',    // rogues and hunters get this
  mage:    'custom_iron_sword',    // mages, priests, warlocks, and druids get this
}
// Or give the same item to everyone:
itemRewards: {
  warrior: 'custom_healing_potion',
  rogue:   'custom_healing_potion',
  mage:    'custom_healing_potion',
}
// Or give different items per class:
itemRewards: {
  warrior: 'custom_iron_sword',
  rogue:   'custom_iron_sword',
  mage:    'custom_healing_potion',
}
```

### CUSTOM_QUEST_ORDER

List every custom quest ID in the order players should receive them. This
controls level-gate progression and quest-log display order.

### Step-by-step

1. Open `src/sim/content/custom/index.ts`.
2. Add your quest inside the `CUSTOM_QUESTS` object:

```typescript
export const CUSTOM_QUESTS: Record<string, QuestDef> = {
  custom_hunt_wolves: {
    id: 'custom_hunt_wolves',
    name: 'A Wolf Problem',
    giverNpcId: 'custom_ranger_quinn',
    turnInNpcId: 'custom_ranger_quinn',
    text: 'The dire wolves north of camp are attacking our scouts. Kill 8 of them and bring me 5 of their pelts as proof.',
    completionText: 'Well done, $N. The scouts can move freely now.',
    objectives: [
      { type: 'kill',    targetMobId: 'custom_direwolf',  count: 8, label: 'Dire Wolves slain' },
      { type: 'collect', itemId: 'custom_wolf_pelt',       count: 5, label: 'Wolf Pelts collected' },
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
```

3. Make sure `custom_wolf_pelt` exists in `CUSTOM_ITEMS` and that the direwolf's
   loot entry references `questId: 'custom_hunt_wolves'`.
4. Make sure `custom_ranger_quinn` exists in `CUSTOM_NPCS` with
   `questIds: ['custom_hunt_wolves']`.
5. Add the quest ID to `CUSTOM_QUEST_ORDER`:

```typescript
export const CUSTOM_QUEST_ORDER: string[] = [
  'custom_hunt_wolves',
];
```

6. Run `npm test` to verify no errors.

---

## 7. Zones (new world areas)

Zones are north-running world bands. Upstream zone 3 (Thornpeak Heights) ends at
z 900. Custom zones should start at z 2000 or higher -- see the overlap avoidance
section below before choosing your z values.

**Section in index.ts:** `CUSTOM_ZONES`

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Zone name shown on map (English) |
| `zMin` | number | yes | Southern boundary (2000 or higher; zones stack northward) |
| `zMax` | number | yes | Northern boundary |
| `levelRange` | [min, max] | yes | Recommended player level range |
| `biome` | BiomeId | yes | `'vale'`, `'marsh'`, or `'peaks'` (controls terrain color and texture) |
| `hub` | object | yes | Main settlement (terrain flattens here; see below) |
| `graveyard` | `{x, z}` | yes | Player respawn point inside this zone |
| `lakes` | array | yes | Array of `{x, z, radius}` lake definitions (can be `[]`) |
| `pois` | array | yes | Points of interest shown on map: `{x, z, label}` (can be `[]`) |
| `welcome` | string | yes | Short message shown in chat on first entry (English) |

**Hub shape:**
```typescript
hub: { x: number, z: number, radius: number, name: string }
```
The radius is the settlement flat zone (terrain geometry flattens within it).

**Biome reference:**
- `'vale'` - green rolling hills (like zone 1 Eastbrook Vale)
- `'marsh'` - murky wetlands (like zone 2 Mirefen Marsh)
- `'peaks'` - snowy high-altitude terrain (like zone 3 Thornpeak Heights)

### Step-by-step

1. Decide the z band. Start at 2000 for your first zone (see overlap avoidance
   below). If you add a second zone, start it at the first zone's zMax.
2. Add your zone inside the `CUSTOM_ZONES` array:

```typescript
export const CUSTOM_ZONES: ZoneDef[] = [
  {
    id: 'custom_ashenmoor',
    name: 'The Ashenmoor',
    zMin: 2000,
    zMax: 2360,
    levelRange: [18, 25],
    biome: 'marsh',
    hub: { x: 0, z: 2060, radius: 30, name: 'Ashenmoor Camp' },
    graveyard: { x: -10, z: 2070 },
    lakes: [
      { x: 60, z: 2120, radius: 40 },
    ],
    pois: [
      { x: 0,  z: 2060, label: 'Ashenmoor Camp' },
      { x: 60, z: 2120, label: 'The Mire' },
    ],
    welcome: 'The Ashenmoor stretches before you, bleak and fog-shrouded.',
  },
];
```

3. Add NPC and camp spawn points with z coordinates inside your zone's band.
4. Run `npm test` to verify no errors.

### Zone overlap avoidance

**Why overlap happens:** `CUSTOM_ZONES` are appended LAST into the engine's `ZONES`
array (by `src/sim/data.ts`). When the engine resolves which zone a player is in, it
searches `ZONES` in order. If an upstream zone covers the same z range as a custom zone,
the upstream zone appears earlier in the array and wins -- the custom zone's hub, level
range, and welcome text are invisible even though the zone entry exists.

**Why z=2000+ is the safe starting point:** Upstream currently ends at z=900 (zone 3).
With the z=2000+ buffer, upstream would need to add at least 3 more full-width zones
before colliding with custom content. Each upstream zone so far spans ~360 units
(zone 2 and zone 3 each span 360), so a buffer of 1100+ units is comfortable runway.

**Detecting overlap after a merge:** Any upstream merge that adds a new zone file is
visible from the file list in the merge commit. After a merge, run:

```bash
# Check the current upstream zone z-boundaries (zone files only, not custom)
grep -n "zMin\|zMax" src/sim/content/zone*.ts src/sim/content/temple.ts 2>/dev/null
```

Compare the highest `zMax` value in that output against the lowest `zMin` in your
`CUSTOM_ZONES`. If any upstream zMax is greater than or equal to your custom zMin,
you have an overlap.

**Fixing an overlap:** Only files you own need to change. Open
`src/sim/content/custom/index.ts` and shift all your custom z values northward:

1. Increase every `CUSTOM_ZONES` entry's `zMin` and `zMax` to clear the upstream
   zone's `zMax` by at least 100 units (e.g. upstream new zMax=1260, shift custom
   start to 1400 or higher).
2. Update every `CUSTOM_CAMPS` entry: shift `center.z` by the same delta.
3. Update hub `z`, `graveyard.z`, `lakes[].z`, and `pois[].z` inside `CUSTOM_ZONES`
   by the same delta.
4. Update any `CUSTOM_NPCS`, `CUSTOM_ROADS`, `CUSTOM_PROPS`, and `CUSTOM_OBJECTS`
   positions that were inside the old z band.
5. Run `npm test` to confirm no errors.

The fix is always safe: all custom content lives in the fork-owned `custom/index.ts`
and no upstream merge can overwrite it. A number change in that file is all that is
ever needed to resolve an overlap.

---

## 8. Ground Objects (herbs, ore nodes)

Ground objects are sparkle-animated interactables players right-click to collect
an item. They are used for quest items, crafting materials, and collectibles.

**Section in index.ts:** `CUSTOM_OBJECTS`

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `itemId` | string | yes | The item granted when interacted with (must exist in CUSTOM_ITEMS) |
| `name` | string | yes | Display name shown when hovering (English) |
| `positions` | `{x,z}[]` | yes | Array of world coordinates where this object spawns |

### Step-by-step

1. Create the item the object grants in `CUSTOM_ITEMS` (see [Items](#1-items)).
   For quest items use `kind: 'quest'`.
2. Add the ground object inside `CUSTOM_OBJECTS`:

```typescript
export const CUSTOM_OBJECTS: GroundObjectDef[] = [
  {
    itemId: 'custom_emberbloom',
    name: 'Emberbloom Flower',
    positions: [
      { x: 20,  z: 410 },
      { x: -35, z: 440 },
      { x: 55,  z: 465 },
      { x: -10, z: 500 },
    ],
  },
];
```

3. To make a quest require collecting from ground objects, use an `'interact'`
   objective in your quest with `targetObjectItemId: 'custom_emberbloom'`.
4. Run `npm test` to verify no errors.

---

## 9. Props (static world geometry)

Props are buildings, wells, tents, fences, campfires, and other static objects
that block movement and appear visually in the world.

**Section in index.ts:** `CUSTOM_PROPS`

Each prop type is an array inside the `CUSTOM_PROPS` object. Add entries to the
relevant array for your zone.

### Prop types

**Buildings** (blocks movement, renderer draws as a 3D structure):
```typescript
buildings: [
  { kind: 'house', x: 5, z: 420, w: 10, d: 8, rot: 0 },
  { kind: 'inn',   x: -8, z: 415, w: 12, d: 10, rot: 0 },
  // kind: 'house' | 'inn' | 'chapel'
  // w = width (east-west), d = depth (north-south), rot = rotation in radians
]
```

**Wells** (decorative cylinder):
```typescript
wells: [
  { x: 0, z: 418, r: 1.5 },
  // r = radius
]
```

**Stalls** (market stalls, vendor tents):
```typescript
stalls: [
  { x: 12, z: 416, rot: 0, r: 2 },
]
```

**Tents:**
```typescript
tents: [
  { x: -20, z: 430, rot: 0.5, scale: 1.0 },
]
```

**Campfires** (light source decoration):
```typescript
campfires: [
  [0, 425],     // [x, z]
  [15, 435],
]
```

**Crates:**
```typescript
crates: [
  [8, 420],     // [x, z]
]
```

**Fences** (line segments that block movement):
```typescript
fences: [
  { x1: -30, z1: 400, x2: 30, z2: 400 },  // south perimeter fence
  { x1: 30,  z1: 400, x2: 30, z2: 450 },  // east perimeter fence
]
```

**Graveyards** (6-headstone cluster):
```typescript
graveyards: [
  { x: -25, z: 430 },
]
```

**Mud huts:**
```typescript
mudHuts: [
  [40, 460],    // [x, z]
]
```

**Ruin rings** (circular ruin formations):
```typescript
ruinRings: [
  { x: 70, z: 490, ringR: 15, columns: 8 },
]
```

**Mines** (mine entrance geometry):
```typescript
mines: [
  { x: -60, z: 480, rot: 0 },
]
```

### Step-by-step

1. Plan the layout of your zone hub on paper or in a grid.
2. Populate the relevant prop arrays inside `CUSTOM_PROPS`:

```typescript
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'inn',   x: 0,   z: 420, w: 12, d: 10, rot: 0 },
    { kind: 'house', x: -15, z: 418, w: 8,  d: 7,  rot: 0 },
  ],
  wells: [
    { x: 5, z: 415, r: 1.5 },
  ],
  stalls:    [],
  mines:     [],
  docks:     [],
  tents:     [{ x: 18, z: 425, rot: 0, scale: 1.0 }],
  crates:    [[10, 420]],
  campfires: [[0, 430]],
  mudHuts:   [],
  ruinRings: [],
  fences:    [
    { x1: -30, z1: 405, x2: 30, z2: 405 },
  ],
  graveyards: [],
};
```

3. Run `npm test` to verify no errors.

---

## 10. Roads

Roads are polyline paths that paint texture onto the terrain to visually indicate
a trail or road between locations.

**Section in index.ts:** `CUSTOM_ROADS`

Each road is an array of `{x, z}` points. Add as many points as needed to
trace the path. The renderer connects them into a painted strip.

### Step-by-step

1. Plan the path you want to mark on the terrain.
2. Add road definitions inside `CUSTOM_ROADS`:

```typescript
export const CUSTOM_ROADS: { x: number; z: number }[][] = [
  // Road from zone entry point north to Ashenmoor Camp
  [
    { x: 0, z: 2000 },
    { x: 2, z: 2020 },
    { x: 1, z: 2040 },
    { x: 0, z: 2060 },
  ],
  // Branch road east to The Mire
  [
    { x: 0,  z: 2060 },
    { x: 30, z: 2090 },
    { x: 60, z: 2120 },
  ],
];
```

3. Run `npm test` to verify no errors.

---

## 11. Dungeons

Dungeons are instanced interior areas entered through a portal in the overworld.
Each instance has its own coordinate space.

**Sections in index.ts:** `CUSTOM_DUNGEON_DEFS` and `CUSTOM_DUNGEON_MOBS`

**Index rule:** Upstream dungeons use indices 0-2 (Hollow Crypt, Sunken Bastion,
Gravewyrm). Temple dungeons use 3+. Custom dungeons must use index 10 or
higher to avoid conflicts.

**x-origin formula:** `900 + index * 600`
- index 10 = x origin at 6900
- index 11 = x origin at 7500

Spawn coordinates inside the dungeon are **relative to the instance origin**
(i.e., offset from that x value, z near 0).

### DungeonDef fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Dungeon name (English) |
| `index` | number | yes | Unique integer 10+ (determines x-band) |
| `doorPos` | `{x, z}` | yes | Overworld entrance portal position |
| `entry` | `{x, z}` | yes | Player arrival point inside the dungeon (instance-local) |
| `exitOffset` | `{x, z}` | yes | Exit portal position inside the dungeon (instance-local) |
| `spawns` | DungeonSpawn[] | yes | Mob spawn list (instance-local coordinates) |
| `interior` | string | yes | `'crypt'`, `'sanctum'`, `'temple'`, or `'nythraxis'` (renderer and collider key) |
| `suggestedPlayers` | number | yes | Recommended group size |
| `enterText` | string | yes | Chat message when player enters (English) |
| `leaveText` | string | yes | Chat message when player leaves (English) |
| `overworldDoor` | boolean | no | Set false if the door is only reachable from another dungeon |

**DungeonSpawn shape:**
```typescript
{ mobId: string, x: number, z: number }
// Coordinates are relative to the instance x-origin
```

**Interior reference:**
- `'crypt'` - stone crypt with columns (classic undead dungeon look)
- `'sanctum'` - ornate hall (humanoid/cult aesthetic)
- `'temple'` - open-air temple ruins
- `'nythraxis'` - the raid boss's unique void-portal chamber

### Step-by-step

1. Add the dungeon mobs to `CUSTOM_DUNGEON_MOBS` (see [Dungeon Mobs](#3-dungeon-mobs)).
2. Choose an index (10+ and unique). Calculate the x-origin: `900 + index * 600`.
3. Plan your dungeon layout with instance-local spawn coordinates.
4. Add the dungeon inside `CUSTOM_DUNGEON_DEFS`:

```typescript
export const CUSTOM_DUNGEON_DEFS: Record<string, DungeonDef> = {
  custom_ashenmoor_crypt: {
    id: 'custom_ashenmoor_crypt',
    name: 'Ashenmoor Crypt',
    index: 10,                              // x-origin = 900 + 10*600 = 6900
    doorPos: { x: -50, z: 2020 },          // overworld entrance portal (inside custom zone)
    entry: { x: 0, z: 20 },               // player appears here inside
    exitOffset: { x: 0, z: 5 },           // exit portal, instance-local
    interior: 'crypt',
    suggestedPlayers: 3,
    enterText: 'The crypt air is cold and still.',
    leaveText: 'You emerge from the Ashenmoor Crypt.',
    spawns: [
      { mobId: 'custom_crypt_guardian', x: 0,   z: 40  },
      { mobId: 'custom_crypt_guardian', x: -15, z: 60  },
      { mobId: 'custom_crypt_guardian', x: 15,  z: 60  },
      { mobId: 'custom_crypt_guardian', x: 0,   z: 80  },  // final boss position
    ],
  },
};
```

5. Place the dungeon door prop in the overworld by adding a building or a visual
   marker near `doorPos` in `CUSTOM_PROPS` (optional but recommended).
6. Run `npm test` to verify no errors.

---

## 12. Complete working example

This section ties all the pieces together into one coherent zone with mobs,
NPCs, quests, and a dungeon. Copy and adapt this as a starting template.

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
// Mobs
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
    pos: { x: 5, z: 420 },
    facing: 0,
    color: 0x8B6914,
    questIds: ['custom_hunt_wolves'],
    greeting: 'The wolves beyond camp have grown bold. I need your help, $N.',
  },
  custom_supply_vendor: {
    id: 'custom_supply_vendor',
    name: 'Camp Supplier',
    title: 'Trade Goods',
    pos: { x: 10, z: 415 },
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
// Camps
// ---------------------------------------------------------------------------
export const CUSTOM_CAMPS: CampDef[] = [
  { mobId: 'custom_direwolf', center: { x: 30,  z: 400 }, radius: 25, count: 6 },
  { mobId: 'custom_direwolf', center: { x: -40, z: 450 }, radius: 20, count: 4 },
];

// ---------------------------------------------------------------------------
// Ground objects
// ---------------------------------------------------------------------------
export const CUSTOM_OBJECTS: GroundObjectDef[] = [];

// ---------------------------------------------------------------------------
// Roads
// ---------------------------------------------------------------------------
export const CUSTOM_ROADS: { x: number; z: number }[][] = [
  [
    { x: 0, z: 360 },
    { x: 1, z: 390 },
    { x: 0, z: 420 },
  ],
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'inn', x: 0, z: 420, w: 12, d: 10, rot: 0 },
  ],
  wells:      [{ x: 5, z: 415, r: 1.5 }],
  stalls:     [],
  mines:      [],
  docks:      [],
  tents:      [],
  crates:     [],
  campfires:  [[0, 430]],
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

---

## Testing and verification

After adding any content, always run:

```bash
npm test
```

For a faster focused run:
```bash
npx vitest run tests/sim.test.ts
```

Common errors and their causes:

| Error | Likely cause |
|---|---|
| `Cannot resolve mob id 'custom_xyz'` | A camp or dungeon spawn references a mob ID that does not exist in CUSTOM_MOBS or CUSTOM_DUNGEON_MOBS |
| `Cannot resolve item id 'custom_xyz'` | A loot entry, quest reward, or vendor list references an item ID that does not exist in CUSTOM_ITEMS |
| `Cannot resolve quest id 'custom_xyz'` | A mob's loot `questId` or a quest's `requiresQuest` references a quest ID that does not exist in CUSTOM_QUESTS |
| `Cannot resolve npc id 'custom_xyz'` | A quest's `giverNpcId` or `turnInNpcId` references an NPC that does not exist in CUSTOM_NPCS |
| Camp position out of range | Check that camp `center.z` falls inside a zone's `zMin`/`zMax` band |

---

## What you CANNOT add here

Adding a new **player class** requires extending the `PlayerClass` union type in
`src/sim/types.ts`, which is an upstream file. Every class method and content
table is statically typed to that union. Document any such change in
`docs/MAINTAINING-FORK.md` and follow the fork rules in `FORK.md`.

Everything else (mobs, items, quests, NPCs, zones, dungeons, objects, props,
roads) can be added purely in this file with no upstream file changes.
