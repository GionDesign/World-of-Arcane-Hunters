# Custom Content: Camps

Camps place overworld mobs at specific world coordinates. Each camp entry defines
one mob type, a centre point, a scatter radius, and a spawn count.

All camp entries go in the `CUSTOM_CAMPS` export in `src/sim/content/custom/index.ts`.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `mobId` | string | yes | The mob ID to spawn (must exist in `CUSTOM_MOBS`) |
| `center` | `{x, z}` | yes | World coordinates of the spawn centre |
| `radius` | number | yes | Radius in yards; mobs scatter randomly within this |
| `count` | number | yes | Number of mobs in this camp |

---

## Determinism rule (read before editing)

`CUSTOM_CAMPS` is appended LAST to the engine's full camps array by `data.ts`. Each
camp draws one world-generation RNG value in array order. **Never insert a new camp
before an existing one** -- doing so shifts every subsequent camp's spawn positions
and changes the world layout. Always append new camps to the END of the array.

---

## Step-by-step

1. Decide where in the world you want mobs to appear. For custom zones, use
   coordinates with `z` inside your zone's `zMin`/`zMax` band (see [zones.md](./zones.md)).
2. Add camp entries at the BOTTOM of the `CUSTOM_CAMPS` array:

```typescript
export const CUSTOM_CAMPS: CampDef[] = [
  // Existing camps stay here unchanged -- never reorder these
  { mobId: 'custom_direwolf', center: { x: 30,  z: 2040 }, radius: 25, count: 6 },
  // New camps go at the end
  { mobId: 'custom_direwolf', center: { x: -40, z: 2090 }, radius: 20, count: 4 },
];
```

3. Run `npm test` to verify no errors.

---

## Tips

- `radius` of 15-25 yards gives a natural scattered feel for a group of 4-6 mobs.
- Keep `count` between 3 and 8 for overworld camps; large counts create performance
  pressure in dense zones.
- Place multiple small camps rather than one large one to create interesting
  patrol zones for players to navigate.
- Camp `center.z` must fall within a zone's `zMin`/`zMax` band for the mob to
  count toward that zone's respawn quota.
