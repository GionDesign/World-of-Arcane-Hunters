// Fork-owned dungeon rendering overrides. This file is never touched by
// upstream merges. It is the render-side companion to src/sim/content/custom/
// and follows the same pattern as src/render/characters/custom/index.ts.
//
// All Dragon's Maw visual variant logic lives here. dungeon.ts imports these
// exports and delegates to them via small hooks documented in MAINTAINING-FORK.md.
// When adding a second custom dungeon: add its variant id to CustomDungeonVariantId,
// add its torch colors to CUSTOM_TORCH_COLORS, its layout to CUSTOM_DUNGEON_LAYOUTS,
// and add branches to customFloorKind / customWallKind / customWallDressing.

import { DRAGONS_MAW_LAYOUT, DUNGEON_WALL_X, type DungeonLayout } from '../sim/dungeon_layout';

// ---------------------------------------------------------------------------
// Variant type
// ---------------------------------------------------------------------------

export type CustomDungeonVariantId = 'dragons_maw';

interface TorchColors {
  flame: number;
  emissive: number;
  light: number;
}

// ---------------------------------------------------------------------------
// Torch colours -- spread last into dungeon.ts TORCH_COLORS
// ---------------------------------------------------------------------------

export const CUSTOM_TORCH_COLORS: Record<CustomDungeonVariantId, TorchColors> = {
  // Dragon's Maw burns with dragonfire heat: deep amber-orange torches
  dragons_maw: { flame: 0xff8020, emissive: 0xcc3a08, light: 0xff6020 },
};

// ---------------------------------------------------------------------------
// Layout lookup -- used by buildInterior to pick the right DungeonLayout
// ---------------------------------------------------------------------------

export const CUSTOM_DUNGEON_LAYOUTS: Record<CustomDungeonVariantId, DungeonLayout> = {
  dragons_maw: DRAGONS_MAW_LAYOUT,
};

/** Returns the DungeonLayout for `interior` if it is a custom variant, else undefined. */
export function getCustomDungeonLayout(interior: string): DungeonLayout | undefined {
  return interior in CUSTOM_DUNGEON_LAYOUTS
    ? CUSTOM_DUNGEON_LAYOUTS[interior as CustomDungeonVariantId]
    : undefined;
}

// ---------------------------------------------------------------------------
// Variant identification
// ---------------------------------------------------------------------------

/** True when `interior` names a custom-owned dungeon variant. */
export function isCustomDungeonVariant(interior: string): interior is CustomDungeonVariantId {
  return interior in CUSTOM_TORCH_COLORS;
}

/** Custom variants that suppress upstream banner placement on side walls. */
export const CUSTOM_NO_BANNER_VARIANTS: ReadonlySet<string> = new Set<CustomDungeonVariantId>([
  'dragons_maw',
]);

// ---------------------------------------------------------------------------
// Deterministic helpers -- local copies of private dungeon.ts functions.
// Pure math, no deps; duplication avoids circular imports.
// ---------------------------------------------------------------------------

function hash2(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

type WeightedKinds = [name: string, weight: number][];

function pickKind(kinds: WeightedKinds, t: number): string {
  let total = 0;
  for (const [, w] of kinds) total += w;
  let acc = 0;
  for (const [name, w] of kinds) {
    acc += w;
    if (t * total < acc) return name;
  }
  return kinds[kinds.length - 1][0];
}

// ---------------------------------------------------------------------------
// Floor tile kind
// ---------------------------------------------------------------------------

/** Returns the floor tile kind for a custom variant. */
export function customFloorKind(variant: CustomDungeonVariantId, t: number): string {
  if (variant === 'dragons_maw') {
    // Rockier cave floor: more dirt, gravel, and cracked stone than the crypt
    return pickKind(
      [
        ['floor_tile_large', 38],
        ['floor_tile_large_rocks', 24],
        ['floor_dirt_large', 18],
        ['floor_dirt_large_rocky', 12],
        ['quad', 8],
      ],
      t,
    );
  }
  return 'floor_tile_large'; // unreachable; satisfies exhaustive union
}

// ---------------------------------------------------------------------------
// Wall module kind
// ---------------------------------------------------------------------------

/** Returns the wall module kind for a custom variant. */
export function customWallKind(variant: CustomDungeonVariantId, t: number): string {
  if (variant === 'dragons_maw') {
    // Cracked cave masonry: heavily cracked, no gated windows
    return pickKind(
      [
        ['wall', 42],
        ['wall_pillar', 18],
        ['wall_cracked', 32],
        ['wall_arched', 8],
      ],
      t,
    );
  }
  return 'wall'; // unreachable
}

// ---------------------------------------------------------------------------
// Wall dressing
// ---------------------------------------------------------------------------

/**
 * Place custom wall dressing by calling `add` (bound to the caller's Placements
 * instance). Handles all wall-side props for the variant, including rubble.
 * Called BEFORE the upstream rubble/dressing code -- the caller must return
 * immediately after this function (it takes full ownership of the variant's output).
 */
export function customWallDressing(
  variant: CustomDungeonVariantId,
  add: (
    kind: string,
    x: number,
    y: number,
    z: number,
    rotY: number,
    scale: number | [number, number, number],
  ) => void,
  layout: DungeonLayout,
): void {
  if (variant === 'dragons_maw') {
    // Rubble mounds at cave wall bases (matches upstream crypt-default positions)
    for (const [wx, wz] of [[-19, -13], [19, 6], [-18, 70], [19, 108]] as [number, number][]) {
      add('rubble_half', wx < 0 ? -22 : 22, 0, wz, wx < 0 ? 0 : Math.PI, 1.1);
    }
    // Scorched cave walls: scattered bones and candles, no ritual furniture
    const wallEdge = (layout.wallX ?? DUNGEON_WALL_X) - 1.6;
    for (let z = layout.zMin + 20; z < layout.zMax - 10; z += 28) {
      for (const side of [-1, 1]) {
        const r = hash2(side * 4.7, z);
        if (r < 0.3) continue;
        const face = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        add(r < 0.6 ? 'bone_A' : 'skull', side * wallEdge, 0, z + 4, face, 1.4);
        if (r > 0.7) add('candle_lit', side * (wallEdge - 1.4), 0, z + 1, hash2(z, side) * Math.PI, 1.2);
      }
    }
  }
}
