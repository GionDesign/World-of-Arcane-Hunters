# Custom Content: Ground Objects

Ground objects are sparkle-animated interactables that players right-click to collect
an item. They are used for quest items, crafting materials, and collectibles.
All custom ground objects go in the `CUSTOM_OBJECTS` export in
`src/sim/content/custom/index.ts`.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `itemId` | string | yes | The item granted on interaction (must exist in `CUSTOM_ITEMS`) |
| `name` | string | yes | Display name shown when hovering (English) |
| `positions` | `{x, z}[]` | yes | Array of world coordinates where this object spawns |

---

## Step-by-step

1. Create the item the object grants in `CUSTOM_ITEMS` (see [items.md](./items.md)).
   For quest items use `kind: 'quest'`.
2. Add the ground object inside `CUSTOM_OBJECTS`:

```typescript
export const CUSTOM_OBJECTS: GroundObjectDef[] = [
  {
    itemId: 'custom_emberbloom',
    name: 'Emberbloom Flower',
    positions: [
      { x: 20,  z: 2040 },
      { x: -35, z: 2080 },
      { x: 55,  z: 2110 },
      { x: -10, z: 2140 },
    ],
  },
];
```

3. To make a quest require collecting from ground objects, use an `'interact'`
   objective in your quest with `targetObjectItemId: 'custom_emberbloom'`
   (see [quests.md](./quests.md)).
4. Run `npm test` to verify no errors.

---

## Tips

- Spread positions across the zone to encourage exploration rather than clustering
  them all at the hub.
- Ground objects respawn after a short timer; use `positions` counts that match
  the expected player traffic for the zone.
- Objects placed outside any zone's `zMin`/`zMax` band still spawn but have no
  zone context for quest tracking -- keep positions inside your zone's band.
