import type { ItemDef } from '../../../types';

// Quest drop items
const QUEST_ITEMS: Record<string, ItemDef> = {
  custom_drake_scale: {
    id: 'custom_drake_scale',
    name: 'Ashwalker Drake Scale',
    kind: 'quest',
    slot: undefined,
    quality: 'common',
    sellValue: 0,
    noVendorSell: true,
  },
  custom_wyvern_heartstone: {
    id: 'custom_wyvern_heartstone',
    name: 'Scorchwing Heartstone',
    kind: 'quest',
    slot: undefined,
    quality: 'common',
    sellValue: 0,
    noVendorSell: true,
  },
  custom_blight_ember: {
    id: 'custom_blight_ember',
    name: 'Blight Ember',
    kind: 'quest',
    slot: undefined,
    quality: 'uncommon',
    sellValue: 0,
    noVendorSell: true,
  },
};

// Intermediate quest rewards (uncommon/rare)
const REWARD_ITEMS: Record<string, ItemDef> = {
  custom_drakebone_shoulders: {
    id: 'custom_drakebone_shoulders',
    name: 'Drakebone Shoulderguards',
    kind: 'armor',
    slot: 'shoulder',
    armorType: 'mail',
    quality: 'rare',
    stats: { armor: 160, str: 8, sta: 6 },
    sellValue: 3000,
    requiredClass: ['warrior', 'paladin', 'shaman'],
  },
  custom_scorchwing_cowl: {
    id: 'custom_scorchwing_cowl',
    name: 'Scorchwing Cowl',
    kind: 'armor',
    slot: 'helmet',
    armorType: 'cloth',
    quality: 'rare',
    stats: { armor: 55, int: 9, spi: 5 },
    sellValue: 3000,
    requiredClass: ['mage', 'priest', 'warlock', 'druid'],
  },
  custom_blight_stalkers_hood: {
    id: 'custom_blight_stalkers_hood',
    name: "Blightstalker's Hood",
    kind: 'armor',
    slot: 'helmet',
    armorType: 'leather',
    quality: 'rare',
    stats: { armor: 90, agi: 9, sta: 5 },
    sellValue: 3000,
    requiredClass: ['rogue', 'hunter'],
  },
};

// Epic final rewards (Ignaraxis drops, gated by quest 5)
const EPIC_ITEMS: Record<string, ItemDef> = {
  custom_ignaraxis_greatblade: {
    id: 'custom_ignaraxis_greatblade',
    name: 'Ignaraxis Greatblade',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'epic',
    weapon: { min: 34, max: 54, speed: 2.8 },
    stats: { str: 12, sta: 6 },
    sellValue: 9500,
    requiredClass: ['warrior', 'paladin', 'shaman'],
  },
  custom_cinderstave_eternal: {
    id: 'custom_cinderstave_eternal',
    name: 'Cinderstave of the Eternal',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'epic',
    weapon: { min: 36, max: 58, speed: 3.0 },
    stats: { int: 13, spi: 5 },
    sellValue: 9500,
    requiredClass: ['mage', 'priest', 'warlock', 'druid'],
  },
  custom_fang_of_ignaraxis: {
    id: 'custom_fang_of_ignaraxis',
    name: 'Fang of Ignaraxis',
    kind: 'weapon',
    slot: 'mainhand',
    quality: 'epic',
    weapon: { min: 22, max: 34, speed: 1.7, dagger: true },
    stats: { agi: 12, sta: 6 },
    sellValue: 9500,
    requiredClass: ['rogue', 'hunter'],
  },
};

export const DRAGONS_BLIGHT_ITEMS: Record<string, ItemDef> = {
  ...QUEST_ITEMS,
  ...REWARD_ITEMS,
  ...EPIC_ITEMS,
};
