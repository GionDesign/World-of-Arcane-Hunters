<!-- src/sim/content/custom/ -- fork-exclusive custom game content.
     This whole directory is owned by this fork and never exists in upstream.
     Root CLAUDE.md (fork maintenance, architecture) and src/sim/CLAUDE.md load alongside. -->

# src/sim/content/custom/ -- custom game content

This directory holds all fork-specific game content: custom zones, mobs, items,
quests, NPCs, and dungeons. It is the ONLY place to add content.

**Never add custom content to the upstream files** (`zone1.ts`, `classes.ts`,
`dungeons.ts`, etc.). Always add it here so upstream merges cannot conflict.

## How it works

`index.ts` exports named constant groups (`CUSTOM_MOBS`, `CUSTOM_ITEMS`, etc.).
`src/sim/data.ts` imports and appends these to the engine's flat lookup tables.
The engine (`sim.ts`) sees your content identically to upstream content.

## Adding content

Full step-by-step guides, field references, and examples for every content type
live in `docs/custom-content/`. Links are provided in each section below.

### New mobs / creatures
Add to `CUSTOM_MOBS` in `index.ts`. Each entry is a `MobTemplate` from `../types`.
Dungeon-only mobs go in `CUSTOM_DUNGEON_MOBS` (same shape, never appear overworld).

ID rules:
- Use a descriptive snake_case id with a `custom_` prefix: `custom_direwolf`
- The prefix prevents future upstream names from colliding with yours
- The id must match the `id` field in the `MobTemplate` record

```typescript
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
  scale: 1.1, color: 0x555555,
},
```

To make mobs spawn in the world, add a `CampDef` entry to `CUSTOM_CAMPS`.
Full guide: `docs/custom-content/mobs.md` -- `docs/custom-content/camps.md`

### New items
Add to `CUSTOM_ITEMS` in `index.ts`. Each entry is an `ItemDef` from `../types`.
Use `custom_` prefix. Items used only as quest objectives can have `kind: 'quest'`.
Full guide: `docs/custom-content/items.md`

### New NPCs
Add to `CUSTOM_NPCS` in `index.ts`. Each entry is a `NpcDef` from `../types`.
NPCs stand at a fixed world position and can give quests, sell items, or both.
Full guide: `docs/custom-content/npcs.md`

### New zones / maps
Add a `ZoneDef` to `CUSTOM_ZONES`. Zones are a north-running strip:
- `zMin`/`zMax` define the z-axis band (must be higher than the last upstream zone)
- `biome` controls terrain color and texture (`'vale'`, `'marsh'`, `'peaks'`)
- `hub` is the main settlement (terrain flattens there)
- `graveyard` is where players respawn in this zone

**Upstream zone boundaries (verified from source):**
- Zone 1 (Eastbrook Vale): zMin -180, zMax 180
- Zone 2 (Mirefen Marsh): zMin 180, zMax 540
- Zone 3 (Thornpeak Heights): zMin 540, zMax 900

**Start custom zones at `zMin: 2000` or higher.** The z=2000+ buffer gives runway
for upstream to add several more zones without conflicting with yours. If you place a
custom zone at z=900 and upstream later adds zone 4 at z=900-1260, that upstream zone
wins the biome and zone lookups (it is spread before CUSTOM_ZONES in the ZONES array).

**After any upstream merge:** compare the highest upstream zone zMax against your
custom zones' zMin values. See `docs/custom-content/zones.md` for the full overlap
detection and recovery procedure.

Add mob spawn points to `CUSTOM_CAMPS` with `center.z` inside your zone's band.
Full guide: `docs/custom-content/zones.md`

### New quests
Add to `CUSTOM_QUESTS` (a `QuestDef`) and list the id in `CUSTOM_QUEST_ORDER`
(determines quest-log order and level-gate progression).
Full guide: `docs/custom-content/quests.md`

### New dungeons
Add a `DungeonDef` to `CUSTOM_DUNGEON_DEFS` and any dungeon-only mobs to
`CUSTOM_DUNGEON_MOBS`.

Dungeon index rules:
- Upstream uses indices 0-2 (Hollow Crypt, Sunken Bastion, Gravewyrm)
- Temple dungeons use higher indices (defined in `temple.ts`)
- Custom dungeons: **use index 10+ to be safe** (e.g. `index: 10`, `index: 11`, ...)
- The x-origin of each dungeon is `900 + index * 600` -- so index 10 = x: 6900

Full guide: `docs/custom-content/dungeons.md`

### Props and static world objects
Add buildings, wells, crates, etc. to `CUSTOM_PROPS` (a `ZonePropsDef`).
Add interactable ground objects (herbs, ore) to `CUSTOM_OBJECTS`.
Add terrain road markings to `CUSTOM_ROADS`.
Full guides: `docs/custom-content/props.md` -- `docs/custom-content/ground-objects.md` -- `docs/custom-content/roads.md`

## What you CANNOT add without touching upstream files

| Content | Safe here? | Upstream file needed |
|---|---|---|
| Mobs / creatures | Yes | None |
| Items | Yes | None |
| Zones / maps | Yes | None |
| Quests | Yes | None |
| NPCs | Yes | None |
| Dungeons | Yes | None |
| **New player classes** | **No** | `src/sim/types.ts` (the `PlayerClass` union type must be extended) |

Adding a new player CLASS requires extending `PlayerClass` in `src/sim/types.ts`
(an upstream file) because `CLASSES: Record<PlayerClass, ClassDef>` is statically
typed to the union. Document any such change in `docs/MAINTAINING-FORK.md`.

## Determinism

Content is appended LAST in every table (`data.ts` handles this). Do not reorder
existing entries in `CUSTOM_CAMPS` -- each camp draws world-gen RNG in array order,
so insertion before an existing camp shifts all later camps' spawn positions.

All mob IDs, item IDs, quest IDs referenced in your content must exist in the tables
before the sim starts -- cross-reference within the same `index.ts` is fine.

## Testing

After adding content:
```bash
npm test                                 # run the full test suite
npx vitest run tests/sim.test.ts         # focused sim test
```

Content that references non-existent IDs (a mob's `loot` itemId, a quest's
`targetMobId`) will cause runtime errors when the sim tries to resolve them.
