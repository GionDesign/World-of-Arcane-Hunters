# Custom Content: Dungeons

Dungeons are instanced interior areas entered through a portal in the overworld.
Each instance has its own coordinate space. Custom dungeons go in `CUSTOM_DUNGEON_DEFS`
and their exclusive mobs go in `CUSTOM_DUNGEON_MOBS`, both in
`src/sim/content/custom/index.ts`.

For the dungeon mob field reference, see [mobs.md](./mobs.md).

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Index and coordinate rules

**Index rule:** Upstream dungeons use indices 0-2 (Hollow Crypt, Sunken Bastion,
Gravewyrm). Temple dungeons use 3+. **Custom dungeons must use index 10 or higher**
to avoid conflicts with any future upstream dungeon additions.

**x-origin formula:** `900 + index * 600`
- index 10 = x origin at 6900
- index 11 = x origin at 7500
- index 12 = x origin at 8100

Spawn coordinates inside the dungeon are **relative to the instance origin** (offset
from that x value, with z near 0). The overworld `doorPos` uses regular world
coordinates and should be placed inside your custom zone's z band.

---

## DungeonDef fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Dungeon name (English) |
| `index` | number | yes | Unique integer 10+ (determines x-band) |
| `doorPos` | `{x, z}` | yes | Overworld entrance portal position |
| `entry` | `{x, z}` | yes | Player arrival point inside the dungeon (instance-local) |
| `exitOffset` | `{x, z}` | yes | Exit portal position inside the dungeon (instance-local) |
| `spawns` | DungeonSpawn[] | yes | Mob spawn list (instance-local coordinates) |
| `interior` | string | yes | `'crypt'`, `'sanctum'`, `'temple'`, or `'nythraxis'` |
| `suggestedPlayers` | number | yes | Recommended group size |
| `enterText` | string | yes | Chat message when player enters (English) |
| `leaveText` | string | yes | Chat message when player leaves (English) |
| `overworldDoor` | boolean | no | Set false if door is only reachable from another dungeon |

**DungeonSpawn shape:**
```typescript
{ mobId: string, x: number, z: number }
// Coordinates are relative to the instance x-origin (instance-local)
```

**Interior reference:**
- `'crypt'` - stone crypt with columns (classic undead dungeon look)
- `'sanctum'` - ornate hall (humanoid/cult aesthetic)
- `'temple'` - open-air temple ruins
- `'nythraxis'` - the raid boss's unique void-portal chamber

---

## Step-by-step

1. Add the dungeon mobs to `CUSTOM_DUNGEON_MOBS` (see [mobs.md](./mobs.md)).
2. Choose an index (10+ and unique per dungeon). Calculate the x-origin:
   `900 + index * 600`.
3. Plan instance-local spawn coordinates (x offsets from 0, z starting near 20-40
   for the first encounter).
4. Add the dungeon inside `CUSTOM_DUNGEON_DEFS`:

```typescript
export const CUSTOM_DUNGEON_DEFS: Record<string, DungeonDef> = {
  custom_ashenmoor_crypt: {
    id: 'custom_ashenmoor_crypt',
    name: 'Ashenmoor Crypt',
    index: 10,                              // x-origin = 900 + 10*600 = 6900
    doorPos: { x: -50, z: 2020 },          // overworld entrance (inside custom zone)
    entry: { x: 0, z: 20 },               // player appears here inside
    exitOffset: { x: 0, z: 5 },           // exit portal, instance-local
    interior: 'crypt',
    suggestedPlayers: 3,
    enterText: 'The crypt air is cold and still.',
    leaveText: 'You emerge from the Ashenmoor Crypt.',
    spawns: [
      { mobId: 'custom_crypt_guardian', x: 0,   z: 40 },
      { mobId: 'custom_crypt_guardian', x: -15, z: 60 },
      { mobId: 'custom_crypt_guardian', x: 15,  z: 60 },
      { mobId: 'custom_crypt_guardian', x: 0,   z: 80 },  // final boss position
    ],
  },
};
```

5. Optionally place a prop (building or visual marker) near `doorPos` in
   `CUSTOM_PROPS` to mark the dungeon entrance (see [props.md](./props.md)).
6. Run `npm test` to verify no errors.

---

## Tips

- Instance-local z increases as players move deeper into the dungeon. Place early
  trash mobs at low z (20-40) and the final boss at higher z (60-100).
- Use `x` offsets to create side rooms and branching corridors.
- `elite: true` on dungeon mobs doubles their effective HP and damage relative to
  their base stats -- standard for non-boss dungeon encounters.
- `boss: true` should be reserved for the final encounter in the dungeon.
- `suggestedPlayers: 3` is standard for a 3-person dungeon; use `5` for a
  full-party dungeon.
