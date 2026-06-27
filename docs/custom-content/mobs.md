# Custom Content: Mobs

Covers overworld mobs (`CUSTOM_MOBS`) and dungeon-only mobs (`CUSTOM_DUNGEON_MOBS`).
Both use the same field shape; only the export name differs. To make overworld mobs
appear in the world you also need a camp entry -- see [camps.md](./camps.md).

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Fields (both CUSTOM_MOBS and CUSTOM_DUNGEON_MOBS)

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
  chance: number,   // drop chance 0 to 1 (1 = always, 0.1 = 10%)
  questId?: string, // only drop while this quest is active and incomplete
}
```

---

## Overworld mobs (CUSTOM_MOBS)

Overworld mobs appear via camp spawn points. They roam, aggro, and respawn in
the open world.

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

3. Add a camp entry in `CUSTOM_CAMPS` to place this mob in the world (see [camps.md](./camps.md)).
4. Run `npm test` to verify no errors.

---

## Dungeon mobs (CUSTOM_DUNGEON_MOBS)

Dungeon mobs exist only inside dungeon instances and never appear in the overworld.
They use the same field shape as overworld mobs. Use `elite: true` or `boss: true`
for tougher encounters; dungeon mobs often have fixed levels (`hpPerLevel: 0`,
`dmgPerLevel: 0`) and higher base stats.

### Step-by-step

1. Open `src/sim/content/custom/index.ts`.
2. Add your mob inside the `CUSTOM_DUNGEON_MOBS` object:

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

3. Reference this mob's ID in your dungeon's `spawns` array (see [dungeons.md](./dungeons.md)).
4. Run `npm test` to verify no errors.
