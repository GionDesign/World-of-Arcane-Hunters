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
  - Custom zones: z 2000 and above (see [zones.md](./zones.md) for overlap notes)

---

## Content type guides

Each content type has its own dedicated guide. Start with the guide for the type
you want to add, then follow the cross-links for anything it depends on.

| Guide | Content | Export in index.ts |
|---|---|---|
| [items.md](./items.md) | Weapons, armor, potions, quest items | `CUSTOM_ITEMS` |
| [mobs.md](./mobs.md) | Overworld creatures and dungeon-only mobs | `CUSTOM_MOBS`, `CUSTOM_DUNGEON_MOBS` |
| [camps.md](./camps.md) | Mob spawn placements in the overworld | `CUSTOM_CAMPS` |
| [npcs.md](./npcs.md) | Quest givers, vendors | `CUSTOM_NPCS` |
| [quests.md](./quests.md) | Kill, collect, and interact quests | `CUSTOM_QUESTS`, `CUSTOM_QUEST_ORDER` |
| [zones.md](./zones.md) | New world areas + overlap avoidance | `CUSTOM_ZONES` |
| [ground-objects.md](./ground-objects.md) | Herbs, ore nodes, interactables | `CUSTOM_OBJECTS` |
| [props.md](./props.md) | Buildings, wells, fences, campfires | `CUSTOM_PROPS` |
| [roads.md](./roads.md) | Terrain road markings | `CUSTOM_ROADS` |
| [dungeons.md](./dungeons.md) | Instanced dungeon areas | `CUSTOM_DUNGEON_DEFS` |
| [complete-example.md](./complete-example.md) | Full zone template (all types together) | all |
| [CREATURE-MODELS.md](./CREATURE-MODELS.md) | Custom creature GLB models and visual overrides | render-side only |

---

## Common errors

| Error | Likely cause |
|---|---|
| `Cannot resolve mob id 'custom_xyz'` | A camp or dungeon spawn references a mob ID that does not exist in `CUSTOM_MOBS` or `CUSTOM_DUNGEON_MOBS` |
| `Cannot resolve item id 'custom_xyz'` | A loot entry, quest reward, or vendor list references an item ID that does not exist in `CUSTOM_ITEMS` |
| `Cannot resolve quest id 'custom_xyz'` | A mob's loot `questId` or a quest's `requiresQuest` references a quest ID that does not exist in `CUSTOM_QUESTS` |
| `Cannot resolve npc id 'custom_xyz'` | A quest's `giverNpcId` or `turnInNpcId` references an NPC that does not exist in `CUSTOM_NPCS` |
| Camp position out of range | Check that camp `center.z` falls inside a zone's `zMin`/`zMax` band |

---

## What you CANNOT add here

Adding a new **player class** requires extending the `PlayerClass` union type in
`src/sim/types.ts`, which is an upstream file. Every class method and content
table is statically typed to that union. Document any such change in
`docs/MAINTAINING-FORK.md` and follow the fork rules in `FORK.md`.

Everything else (mobs, items, quests, NPCs, zones, dungeons, objects, props,
roads, creature models) can be added purely in the fork-owned custom files with
no upstream changes.
