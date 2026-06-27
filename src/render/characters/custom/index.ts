// Fork-owned creature visual overrides and new creature definitions.
// This file is never touched by upstream merges.
//
// CUSTOM_MOB_KEYS  -- overrides or additions to the MOB_KEYS dispatch table
//                     (templateId -> visual key). Entries here win over upstream.
// CUSTOM_VISUALS   -- new VisualDef entries (visual key -> GLB + animation config).
//                     Can also shadow an upstream key to replace its model entirely.
//
// Both are spread LAST into manifest.ts so custom entries always take precedence.
// See docs/custom-content/CREATURE-MODELS.md for the full authoring guide.

import type { ClipMap, VisualDef } from '../manifest';

// Base path for GLBs placed in this fork's exclusive model directory.
// Drop .glb files into public/models/creatures/custom/ and reference them as:
//   `${CUSTOM_CREATURES}/mymodel.glb`
const CUSTOM_CREATURES = 'models/creatures/custom';

// ---------------------------------------------------------------------------
// CUSTOM_MOB_KEYS
//
// Maps mob template IDs to visual keys. Entries here are merged LAST into the
// upstream MOB_KEYS table, so they override any upstream mapping for that id.
//
// Use this to:
//   - Give a specific mob a unique model (override a family fallback)
//   - Redirect an upstream creature to a custom visual key
//   - Give each warlock pet its own distinct model/appearance
//
// Format:
//   templateId: 'visual_key',
//
// The visual key must exist in either the upstream VISUALS or CUSTOM_VISUALS below.
// ---------------------------------------------------------------------------

export const CUSTOM_MOB_KEYS: Record<string, string> = {
  // Warlock pets: give each a distinct visual key so they can have unique
  // models, scales, and tints rather than all sharing mob_demonalt.
  // Currently mapped to existing upstream visual keys (same models,
  // but now individually controllable). Swap the visual key to a
  // CUSTOM_VISUALS entry below when you add a unique GLB for each pet.
  felhunter:  'mob_demonalt',
  felguard:   'mob_demonalt',
  infernal:   'mob_demonalt',
  doomguard:  'mob_demonalt',

  // Custom overworld creatures (Dragon's Blight zone).
  custom_skullfire_brute:      'custom_orcskull',
  custom_blightshroud_stalker: 'custom_ninja',
  custom_ironpelt_monkroose:   'custom_monkroose',

  // Dragon's Maw boss uses the alien model.
  custom_ignaraxis: 'custom_alien_boss',
};

// ---------------------------------------------------------------------------
// CUSTOM_VISUALS
//
// Defines new visual keys (or shadows upstream keys) with GLB + animation config.
// Spread LAST into manifest.ts VISUALS, so a key here silently replaces any
// upstream entry with the same name.
//
// Required fields: url, height, clips
// Use an existing upstream ClipMap factory for compatible rigs:
//   animal(['Attack'])         -- Quaternius 4-legged beasts
//   BIPED14                   -- 14-bone humanoid biped (demons, orcs, etc.)
//   FLOATING                  -- hovering/flying creatures
//   kaykit(['ClipName'])       -- KayKit humanoid characters
//   skeletonClips(['ClipName'])-- KayKit skeleton warriors/mages/rogues
//
// See docs/custom-content/CREATURE-MODELS.md for field reference and examples.
// ---------------------------------------------------------------------------

// ClipMap for the 14-animation biped rig used by all four new creature GLBs
// (orcskull / alien / ninja / monkroose). Clip names match the GLB exactly.
const BIPED14_JUMP: ClipMap = {
  idle:   'Idle',
  walk:   'Walk',
  run:    'Run',
  attack: ['Punch', 'Weapon'],
  hit:    ['HitReact'],
  death:  'Death',
  jump:   'Jump_Idle',
};

export const CUSTOM_VISUALS: Record<string, VisualDef> = {
  // Example -- new creature from a Quaternius pack:
  // custom_forest_bear: {
  //   url: `${CUSTOM_CREATURES}/forest_bear.glb`,
  //   height: 2.2,
  //   clips: animal(['Attack']),
  //   tint: 'entity',
  //   tintStrength: 0.3,
  // },

  // Example -- warlock felhunter with a unique model:
  // custom_felhunter: {
  //   url: `${CUSTOM_CREATURES}/felhunter.glb`,
  //   height: 1.4,
  //   clips: animal(['Attack']),
  //   tint: 'entity',
  //   tintStrength: 0.5,
  // },

  // Skullfire Brute (orcskull.glb) -- orc marauder overworld mob.
  custom_orcskull: {
    url: `${CUSTOM_CREATURES}/orcskull.glb`,
    height: 1.85,
    clips: BIPED14_JUMP,
    tint: 'entity',
    tintStrength: 0.35,
  },

  // Blightshroud Stalker (ninja.glb) -- swift humanoid overworld mob.
  custom_ninja: {
    url: `${CUSTOM_CREATURES}/ninja.glb`,
    height: 1.70,
    clips: BIPED14_JUMP,
    tint: 'entity',
    tintStrength: 0.30,
  },

  // Ironpelt Monkroose (monkroose.glb) -- bipedal beast overworld mob.
  custom_monkroose: {
    url: `${CUSTOM_CREATURES}/monkroose.glb`,
    height: 1.65,
    clips: BIPED14_JUMP,
    tint: 'entity',
    tintStrength: 0.35,
  },

  // Ignaraxis the Eternal boss (alien.glb) -- Dragon's Maw final boss.
  // Scale 1.8 on the mob template gives an imposing in-game height of ~3.15 u.
  custom_alien_boss: {
    url: `${CUSTOM_CREATURES}/alien.glb`,
    height: 1.75,
    clips: BIPED14_JUMP,
    tint: 'entity',
    tintStrength: 0.50,
  },
};
