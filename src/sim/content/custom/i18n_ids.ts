// Fork-owned i18n extension point for Dragon's Blight custom content.
// src/ui/world_entity_i18n.ts and src/ui/i18n.catalog/items.ts import from
// here so upstream merges to those files never wipe our custom entity IDs.
// Adding a new custom entity: add its ID here, then run:
//   npm run i18n:gen && node scripts/i18n_resolved_hash.mjs --write

export const CUSTOM_MOB_IDS = [
  'custom_ashwalker_drake',
  'custom_scorchwing_wyvern',
  'custom_blighted_sentinel',
  'custom_dragonclaw_warden',
  'custom_ignaraxis',
  'custom_skullfire_brute',
  'custom_blightshroud_stalker',
  'custom_ironpelt_monkroose',
] as const;

export const CUSTOM_NPC_IDS = [
  'custom_commander_vael',
  'custom_scout_fenris',
  'custom_elder_draxis',
] as const;

export const CUSTOM_QUEST_IDS = [
  'custom_proving_ground',
  'custom_marks_of_the_drake',
  'custom_into_the_blight',
  'custom_eye_of_the_storm',
  'custom_eternal_flame',
  'custom_blight_patrol',
] as const;

export const CUSTOM_ZONE_IDS = ['custom_dragons_blight'] as const;

export const CUSTOM_DUNGEON_IDS = ['custom_dragons_maw'] as const;

// Item IDs must stay in the same order as CUSTOM_ITEM_EN_NAMES below.
export const CUSTOM_ITEM_ENTITY_IDS = [
  'custom_drake_scale',
  'custom_wyvern_heartstone',
  'custom_blight_ember',
  'custom_drakebone_shoulders',
  'custom_scorchwing_cowl',
  'custom_blight_stalkers_hood',
  'custom_ignaraxis_greatblade',
  'custom_cinderstave_eternal',
  'custom_fang_of_ignaraxis',
] as const;

// English item names in the same order as CUSTOM_ITEM_ENTITY_IDS.
export const CUSTOM_ITEM_EN_NAMES = [
  'Ashwalker Drake Scale',
  'Scorchwing Heartstone',
  'Blight Ember',
  'Drakebone Shoulderguards',
  'Scorchwing Cowl',
  "Blightstalker's Hood",
  'Ignaraxis Greatblade',
  'Cinderstave of the Eternal',
  'Fang of Ignaraxis',
] as const;
