# Custom Content: NPCs

NPCs stand at a fixed world position and can offer quests, sell items, or both.
All custom NPCs go in the `CUSTOM_NPCS` export in `src/sim/content/custom/index.ts`.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Fields

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

---

## Step-by-step

1. Open `src/sim/content/custom/index.ts`.
2. Add your NPC inside the `CUSTOM_NPCS` object:

```typescript
export const CUSTOM_NPCS: Record<string, NpcDef> = {
  // Quest giver NPC
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

  // Vendor NPC
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
```

3. When a quest references this NPC as `giverNpcId` or `turnInNpcId`, the ID
   used must exactly match the `id` field here.
4. Items listed in `vendorItems` must exist in `CUSTOM_ITEMS` (see [items.md](./items.md)).
5. Quest IDs listed in `questIds` must exist in `CUSTOM_QUESTS` (see [quests.md](./quests.md)).
6. Run `npm test` to verify no errors.

---

## Placement tips

- Place NPCs within your zone's hub radius so the terrain is flat around them.
- `facing: 0` faces south (toward incoming players); `facing: Math.PI` faces north.
- `color` is a hex tint on the base humanoid mesh. Values around `0x997755` give a
  natural skin tone; `0x8B4513` gives a darker complexion.
- For an NPC that only sells (no quests), set `questIds: []`.
- For a quest giver that is not a vendor, omit `vendorItems` entirely.
- `$N` in `greeting` is replaced with the player's name at runtime.
