# Custom Content: Map Layout Guide

This guide explains how to relocate and add every type of custom world content:
creature camps, zone respawn points, buildings, wells, stalls, tents, campfires,
crates, fences, graveyards, mud huts, ruin rings, and mines.

All examples use the Dragon's Blight zone (`zMin: 900, zMax: 1260`). Adapt the
coordinates to your own zone band.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Coordinate system

The world uses a right-handed X/Z plane (Y is up, handled by the terrain system).

- **X axis**: east (+) / west (-)
- **Z axis**: north (+) / south (-); zones are stacked north along Z
- Each zone occupies a contiguous Z band (`zMin` to `zMax`)
- The hub is roughly at the centre of the Z band for your zone

Dragon's Blight reference points:

| Location | x | z |
|---|---|---|
| Zone entry (south edge) | 0 | 900 |
| Blightwatch Post (hub) | 0 | 960 |
| Scout Fenris's outpost | -25 | 1080 |
| Dragon's Maw dungeon entrance | -48 | 1190 |
| Zone north edge | -- | 1260 |

All props and camps must have a Z coordinate within your zone's `zMin`/`zMax` band.

---

## Creature camps

Camps are defined in `CUSTOM_CAMPS` in `src/sim/content/custom/index.ts`.

### CRITICAL: Append-only rule

Each camp draws from the secondary RNG stream in array order. **Never insert a
camp before an existing one.** Always add new camps to the END of `CUSTOM_CAMPS`.
Reordering existing entries changes every subsequent camp's spawn positions and
breaks the world layout.

### CampDef fields

| Field | Type | Description |
|---|---|---|
| `mobId` | string | Mob ID to spawn (must exist in `CUSTOM_MOBS`) |
| `center.x` | number | World X coordinate of the spawn centre |
| `center.z` | number | World Z coordinate of the spawn centre |
| `radius` | number | Scatter radius in yards; mobs appear randomly within this circle |
| `count` | number | Number of mobs in this camp |

### Relocating an existing camp

Change `center.x` and/or `center.z` in place. Do not change the array order.

Before:
```typescript
{ mobId: 'custom_ashwalker_drake', center: { x: 40, z: 930 }, radius: 25, count: 6 },
```

After (moved west and slightly north):
```typescript
{ mobId: 'custom_ashwalker_drake', center: { x: -30, z: 925 }, radius: 25, count: 6 },
```

### Adding a new camp

Append at the END of `CUSTOM_CAMPS`. Never insert in the middle.

```typescript
export const CUSTOM_CAMPS: CampDef[] = [
  // ... existing camps stay exactly here, unchanged ...

  // NEW: extra ironpelt pack near the northern edge -- append at end
  { mobId: 'custom_ironpelt_monkroose', center: { x: 50, z: 1200 }, radius: 20, count: 4 },
];
```

### Tips

- A radius of 15-25 yards gives natural scatter for a group of 4-6 mobs.
- Keep count between 3 and 8 for overworld camps.
- Place camps so there is at least one radius of separation between camp centres
  to avoid a solid wall of aggro for players walking through.

---

## Zone respawn point (graveyard)

The zone respawn point determines where players appear after dying and selecting
"Release Spirit". It is set on the `ZoneDef` object in `CUSTOM_ZONES`.

This is distinct from the decorative graveyard prop clusters (see "Decorative
graveyards" below). The zone graveyard is a single coordinate; the prop
graveyards are visual props placed nearby.

### ZoneDef graveyard field

```typescript
graveyard: { x: number; z: number }
```

Place this near the hub, offset slightly from the centre so players do not
respawn inside a building.

### Relocating the respawn point

Find the `graveyard` field in your zone's `ZoneDef` entry in `CUSTOM_ZONES` and
update the coordinates:

Before:
```typescript
graveyard: { x: -14, z: 972 },
```

After (moved to the west side of the hub):
```typescript
graveyard: { x: -28, z: 965 },
```

### Choosing respawn coordinates

- Place the respawn point inside the hub area (within about 20-30 yards of hub centre).
- Avoid placing it inside or overlapping a building footprint.
- The decorative graveyard prop (the headstone cluster) should be within a few
  yards of this coordinate for visual coherence.

---

## Buildings

Buildings are defined in `CUSTOM_PROPS.buildings`. The renderer draws a 3D
structure; the sim creates a movement-blocking collision box.

### BuildingDef fields

| Field | Type | Description |
|---|---|---|
| `kind` | `'house'` or `'inn'` or `'chapel'` | Structure type |
| `x` | number | Centre X coordinate |
| `z` | number | Centre Z coordinate |
| `w` | number | Width in yards (east-west) |
| `d` | number | Depth in yards (north-south) |
| `rot` | number | Rotation in radians (`0` = axis-aligned) |

### Relocating a building

Find the building entry in `CUSTOM_PROPS.buildings` and change `x`/`z`:

Before:
```typescript
buildings: [
  { kind: 'inn',   x: 0,   z: 962, w: 12, d: 10, rot: 0 },
  { kind: 'house', x: -18, z: 958, w: 10, d: 8,  rot: 0 },
],
```

After (moved the inn further north and the house east):
```typescript
buildings: [
  { kind: 'inn',   x: 0,  z: 968, w: 12, d: 10, rot: 0 },
  { kind: 'house', x: 20, z: 958, w: 10, d: 8,  rot: 0 },
],
```

### Adding a new building

Append to the `buildings` array:

```typescript
buildings: [
  { kind: 'inn',    x: 0,   z: 962, w: 12, d: 10, rot: 0 },
  { kind: 'house',  x: -18, z: 958, w: 10, d: 8,  rot: 0 },
  // NEW: a small chapel on the east side of the post
  { kind: 'chapel', x: 22,  z: 962, w: 8,  d: 7,  rot: 0 },
],
```

### Tips

- `w` (width) is the east-west dimension; `d` (depth) is the north-south dimension.
- Avoid overlapping buildings; leave at least 4-6 yards between footprints so
  players can move between them.
- `rot: Math.PI / 2` rotates 90 degrees; `rot: Math.PI / 4` rotates 45 degrees.
- Place wells, stalls, and campfires in the open areas between buildings to fill out
  the hub feel.

---

## Decorative graveyards

Decorative graveyards are clusters of 6 headstones, placed as visual props in
`CUSTOM_PROPS.graveyards`. They are separate from the zone respawn point.

### Relocating a decorative graveyard

Find the entry in `CUSTOM_PROPS.graveyards` and update the coordinates:

Before:
```typescript
graveyards: [{ x: -10, z: 958 }],
```

After (moved away from the main hub buildings):
```typescript
graveyards: [{ x: -30, z: 970 }],
```

### Adding a decorative graveyard

Append to the array. Dragon's Blight example: add a second cluster near the
ruined road north of the post:

```typescript
graveyards: [
  { x: -10, z: 958 },   // existing cluster at the hub
  { x: -20, z: 1010 },  // NEW: a smaller burial site along the scout trail
],
```

### Tip

Place the zone respawn `graveyard` coordinate (on `ZoneDef`) close to one of
these decorative clusters so the visual and the mechanic align.

---

## Wells

Wells are decorative cylindrical structures in `CUSTOM_PROPS.wells`.

### WellDef fields

| Field | Type | Description |
|---|---|---|
| `x` | number | Centre X coordinate |
| `z` | number | Centre Z coordinate |
| `r` | number | Radius of the well cap |

### Relocating a well

```typescript
// Before:
wells: [{ x: 8, z: 955, r: 1.5 }],

// After (moved to the open square in front of the inn):
wells: [{ x: 3, z: 955, r: 1.5 }],
```

### Adding a well

```typescript
wells: [
  { x: 3, z: 955, r: 1.5 },   // existing well
  { x: -30, z: 1082, r: 1.2 }, // NEW: a smaller well at the scout outpost
],
```

---

## Stalls

Stalls are market tent structures in `CUSTOM_PROPS.stalls`.

### StallDef fields

| Field | Type | Description |
|---|---|---|
| `x` | number | Centre X |
| `z` | number | Centre Z |
| `rot` | number | Rotation in radians |
| `r` | number | Radius (controls size) |

### Relocating a stall

```typescript
// Before:
stalls: [{ x: 16, z: 960, rot: Math.PI / 2, r: 2.5 }],

// After (moved to the south-east corner of the hub):
stalls: [{ x: 25, z: 948, rot: 0, r: 2.5 }],
```

### Adding a stall

```typescript
stalls: [
  { x: 25, z: 948, rot: 0,            r: 2.5 },  // existing stall
  { x: 12, z: 948, rot: Math.PI / 2,  r: 2.0 },  // NEW: second vendor stall
],
```

---

## Tents

Tents are in `CUSTOM_PROPS.tents`. Commonly used for outpost camps away from
the main hub.

### TentDef fields

| Field | Type | Description |
|---|---|---|
| `x` | number | Centre X |
| `z` | number | Centre Z |
| `rot` | number | Rotation in radians |
| `scale` | number | Size multiplier (1.0 = default) |

### Relocating a tent

```typescript
// Before:
tents: [{ x: -22, z: 1082, rot: 0, scale: 1.0 }],

// After (moved to match Scout Fenris's exact NPC position):
tents: [{ x: -25, z: 1080, rot: 0, scale: 1.0 }],
```

### Adding a tent

```typescript
tents: [
  { x: -25, z: 1080, rot: 0,          scale: 1.0 },  // existing scout outpost tent
  { x: -45, z: 1188, rot: Math.PI,    scale: 1.2 },  // NEW: large tent near dungeon entrance
],
```

---

## Campfires

Campfires are defined as `[x, z]` pairs in `CUSTOM_PROPS.campfires`.

### Relocating a campfire

```typescript
// Before:
campfires: [
  [0,   972],
  [-22, 1086],
],

// After (moved hub campfire to the centre square):
campfires: [
  [3,   968],   // hub -- moved to open square
  [-22, 1086],  // scout outpost -- unchanged
],
```

### Adding a campfire

```typescript
campfires: [
  [3,   968],
  [-22, 1086],
  [-48, 1190],  // NEW: campfire at the dungeon approach
],
```

---

## Crates

Crates are `[x, z]` pairs in `CUSTOM_PROPS.crates`. They are decorative
scatter objects.

### Relocating crates

```typescript
// Before:
crates: [
  [20,  958],
  [-15, 963],
],

// After (clustered near the inn entrance):
crates: [
  [8,   958],
  [14,  958],
],
```

### Adding crates

```typescript
crates: [
  [8,   958],
  [14,  958],
  [-22, 1082],  // NEW: supply crates at the scout outpost
],
```

---

## Fences

Fences are line segments defined in `CUSTOM_PROPS.fences`. Each fence runs from
point `(x1, z1)` to `(x2, z2)` and blocks movement along that line.

### FenceDef fields

| Field | Type | Description |
|---|---|---|
| `x1`, `z1` | number | Start point |
| `x2`, `z2` | number | End point |

### Adding a fence perimeter around the hub

```typescript
fences: [
  // South wall of hub perimeter
  { x1: -35, z1: 945, x2: 35, z2: 945 },
  // North wall
  { x1: -35, z1: 985, x2: 35, z2: 985 },
  // West wall (with a gap for the road entrance)
  { x1: -35, z1: 945, x2: -35, z2: 955 },
  { x1: -35, z1: 975, x2: -35, z2: 985 },
  // East wall
  { x1: 35,  z1: 945, x2: 35,  z2: 985 },
],
```

### Relocating a fence segment

Change the coordinate values of the start and end points. Keep fence segments
connected at their endpoints if you want a continuous barrier.

---

## Mud huts

Mud huts are `[x, z]` pairs in `CUSTOM_PROPS.mudHuts`. Used for tribal or
primitive settlement aesthetics.

### Adding mud huts (new example -- none in Dragon's Blight currently)

```typescript
mudHuts: [
  [60, 1050],  // hut on the east side of the wyvern grounds
  [75, 1065],
  [55, 1070],
],
```

### Relocating a mud hut

Find the entry and change its coordinates:

```typescript
// Before:
mudHuts: [[60, 1050]],

// After (shifted north):
mudHuts: [[60, 1060]],
```

---

## Ruin rings

Ruin rings are circular formations of ruined columns in `CUSTOM_PROPS.ruinRings`.

### RuinRingDef fields

| Field | Type | Description |
|---|---|---|
| `x` | number | Centre X |
| `z` | number | Centre Z |
| `ringR` | number | Ring radius in yards |
| `columns` | number | Number of columns in the ring |

### Relocating a ruin ring

```typescript
// Before:
ruinRings: [{ x: -50, z: 1140, ringR: 18, columns: 6 }],

// After (moved deeper into the blight):
ruinRings: [{ x: -55, z: 1155, ringR: 18, columns: 6 }],
```

### Adding a ruin ring

```typescript
ruinRings: [
  { x: -55, z: 1155, ringR: 18, columns: 6 },  // existing ring
  { x: 70,  z: 1200, ringR: 12, columns: 4 },  // NEW: smaller ruin near the dungeon
],
```

---

## Mines

Mines are entrance structures in `CUSTOM_PROPS.mines`. Used for mine-shaft
aesthetics.

### MineDef fields

| Field | Type | Description |
|---|---|---|
| `x` | number | Position X |
| `z` | number | Position Z |
| `rot` | number | Rotation in radians |

### Adding a mine (new example -- none in Dragon's Blight currently)

```typescript
mines: [
  { x: 80, z: 1100, rot: Math.PI },  // abandoned mine on the eastern ridge
],
```

---

## Full CUSTOM_PROPS example

The complete structure showing all prop types together for Dragon's Blight:

```typescript
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'inn',   x: 0,   z: 962, w: 12, d: 10, rot: 0 },
    { kind: 'house', x: -18, z: 958, w: 10, d: 8,  rot: 0 },
  ],
  wells:     [{ x: 8, z: 955, r: 1.5 }],
  stalls:    [{ x: 16, z: 960, rot: Math.PI / 2, r: 2.5 }],
  tents:     [{ x: -22, z: 1082, rot: 0, scale: 1.0 }],
  campfires: [
    [0,   972],
    [-22, 1086],
  ],
  crates: [
    [20,  958],
    [-15, 963],
  ],
  fences:    [],
  mines:     [],
  docks:     [],
  mudHuts:   [],
  ruinRings: [{ x: -50, z: 1140, ringR: 18, columns: 6 }],
  graveyards: [{ x: -10, z: 958 }],
};
```

All unused arrays must be present as empty arrays (`[]`). The type system
requires all fields.

---

## Testing after changes

```bash
npm test
```

Focus tests:
- `tests/sim.test.ts` -- verifies content IDs resolve and the sim boots cleanly
- `tests/progression.test.ts` -- verifies zone Z-band contiguity

If you added new camps, parity golden traces must be regenerated:

```bash
UPDATE_PARITY=1 npx vitest run tests/parity
npm test
```
