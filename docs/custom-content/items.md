# Custom Content: Items

All custom items go in the `CUSTOM_ITEMS` export in `src/sim/content/custom/index.ts`.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Fields

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

---

## Step-by-step

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

3. If the item is a quest reward, reference its ID in your quest's `itemRewards` field (see [quests.md](./quests.md)).
4. If the item drops from a mob, add it to that mob's `loot` array (see [mobs.md](./mobs.md)).
5. If the item is sold by a vendor NPC, add its ID to the NPC's `vendorItems` array (see [npcs.md](./npcs.md)).
6. Run `npm test` to verify no errors.
