# Custom Content: Quests

Quests are given by NPCs and have kill, collect, or interact objectives.
All custom quests go in `CUSTOM_QUESTS` and the ordering goes in
`CUSTOM_QUEST_ORDER`, both exported from `src/sim/content/custom/index.ts`.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## QuestDef fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Quest title (English) |
| `giverNpcId` | string | yes | NPC that gives this quest |
| `turnInNpcId` | string | yes | NPC the player returns to (can be same as giver) |
| `text` | string | yes | Quest description. `$N` = player name, `$C` = player class |
| `completionText` | string | yes | Text shown on turn-in |
| `objectives` | QuestObjective[] | yes | Array of objectives (see below) |
| `xpReward` | number | yes | XP granted on turn-in |
| `copperReward` | number | yes | Copper granted on turn-in |
| `itemRewards` | object | yes | Class-keyed item rewards (see below) |
| `requiresQuest` | string | no | Only available after this quest ID is turned in |
| `minLevel` | number | no | Minimum player level to accept |
| `suggestedPlayers` | number | no | Suggested group size (2, 3, etc.) |

---

## Objective types

**Kill objective:** Player must kill a specific mob type.
```typescript
{ type: 'kill', targetMobId: 'custom_direwolf', count: 8, label: 'Dire Wolves slain' }
```

**Collect objective:** Player must loot a specific item.
```typescript
{ type: 'collect', itemId: 'custom_wolf_pelt', count: 5, label: 'Wolf Pelts collected' }
```
The item must also be in the mob's `loot` array with `questId` pointing to this
quest, so it only drops while the quest is active and incomplete.

**Interact objective:** Player must right-click an NPC or ground object.
```typescript
// Talk to an NPC:
{ type: 'interact', targetNpcId: 'custom_ranger_quinn', count: 1, label: 'Report to Quinn' }
// Activate a ground object:
{ type: 'interact', targetObjectItemId: 'custom_standing_stone', count: 3, label: 'Stones activated' }
```

---

## Item rewards

`itemRewards` maps a class archetype to an item ID. Use the three archetypes to
give the same reward to a group of classes:
- `'warrior'` covers warrior, paladin, shaman
- `'rogue'` covers rogue, hunter
- `'mage'` covers mage, priest, warlock, druid

```typescript
// Same item for everyone:
itemRewards: {
  warrior: 'custom_healing_potion',
  rogue:   'custom_healing_potion',
  mage:    'custom_healing_potion',
}

// Different item per role:
itemRewards: {
  warrior: 'custom_iron_sword',
  rogue:   'custom_iron_sword',
  mage:    'custom_healing_potion',
}
```

---

## CUSTOM_QUEST_ORDER

List every custom quest ID in the order players should receive them. This controls
level-gate progression and quest-log display order.

```typescript
export const CUSTOM_QUEST_ORDER: string[] = [
  'custom_hunt_wolves',    // first quest in the chain
  'custom_clear_crypt',    // unlocked after hunt_wolves via requiresQuest
];
```

---

## Step-by-step

1. Open `src/sim/content/custom/index.ts`.
2. Add your quest inside `CUSTOM_QUESTS`:

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
```

3. Verify the quest giver NPC has this quest ID in its `questIds` array
   (see [npcs.md](./npcs.md)).
4. For a `collect` objective, verify the item exists in `CUSTOM_ITEMS` and the
   mob's `loot` entry has `questId` set (see [items.md](./items.md) and [mobs.md](./mobs.md)).
5. Add the quest ID to `CUSTOM_QUEST_ORDER` in the correct chain position.
6. Run `npm test` to verify no errors.
