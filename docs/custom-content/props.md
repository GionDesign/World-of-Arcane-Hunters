# Custom Content: Props

Props are buildings, wells, tents, fences, campfires, and other static objects
that block movement and appear visually in the world. All custom props go in the
`CUSTOM_PROPS` export in `src/sim/content/custom/index.ts`.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Prop types reference

**Buildings** (blocks movement, renderer draws as a 3D structure):
```typescript
buildings: [
  { kind: 'house', x: 5,  z: 2060, w: 10, d: 8,  rot: 0 },
  { kind: 'inn',   x: -8, z: 2055, w: 12, d: 10, rot: 0 },
  // kind: 'house' | 'inn' | 'chapel'
  // w = width (east-west), d = depth (north-south), rot = rotation in radians
]
```

**Wells** (decorative cylinder):
```typescript
wells: [
  { x: 0, z: 2058, r: 1.5 },
  // r = radius
]
```

**Stalls** (market stalls, vendor tents):
```typescript
stalls: [
  { x: 12, z: 2056, rot: 0, r: 2 },
]
```

**Tents:**
```typescript
tents: [
  { x: -20, z: 2070, rot: 0.5, scale: 1.0 },
]
```

**Campfires** (light source decoration):
```typescript
campfires: [
  [0, 2065],     // [x, z]
  [15, 2075],
]
```

**Crates:**
```typescript
crates: [
  [8, 2060],     // [x, z]
]
```

**Fences** (line segments that block movement):
```typescript
fences: [
  { x1: -30, z1: 2045, x2: 30, z2: 2045 },  // south perimeter fence
  { x1: 30,  z1: 2045, x2: 30, z2: 2090 },  // east perimeter fence
]
```

**Graveyards** (6-headstone cluster):
```typescript
graveyards: [
  { x: -25, z: 2070 },
]
```

**Mud huts:**
```typescript
mudHuts: [
  [40, 2100],    // [x, z]
]
```

**Ruin rings** (circular ruin formations):
```typescript
ruinRings: [
  { x: 70, z: 2130, ringR: 15, columns: 8 },
]
```

**Mines** (mine entrance geometry):
```typescript
mines: [
  { x: -60, z: 2120, rot: 0 },
]
```

---

## Step-by-step

1. Plan the layout of your zone hub on paper or in a grid. The hub `z` is the
   centre point; build outward from there.
2. Populate the relevant prop arrays inside `CUSTOM_PROPS`. All unused arrays
   must still be present as empty arrays:

```typescript
export const CUSTOM_PROPS: ZonePropsDef = {
  buildings: [
    { kind: 'inn',   x: 0,   z: 2060, w: 12, d: 10, rot: 0 },
    { kind: 'house', x: -15, z: 2058, w: 8,  d: 7,  rot: 0 },
  ],
  wells: [
    { x: 5, z: 2055, r: 1.5 },
  ],
  stalls:    [],
  mines:     [],
  docks:     [],
  tents:     [{ x: 18, z: 2065, rot: 0, scale: 1.0 }],
  crates:    [[10, 2060]],
  campfires: [[0, 2070]],
  mudHuts:   [],
  ruinRings: [],
  fences:    [
    { x1: -30, z1: 2045, x2: 30, z2: 2045 },
  ],
  graveyards: [],
};
```

3. Run `npm test` to verify no errors.

---

## Tips

- Keep props within your zone's `zMin`/`zMax` band so they render in the correct
  terrain region.
- Buildings with large `w`/`d` values create movement blockers that steer player
  pathing through the hub naturally.
- `rot` is in radians; common values: `0` (aligned to axes), `Math.PI / 4`
  (45 degrees), `Math.PI / 2` (90 degrees).
- `docks` works the same as `mines` -- an entrance structure geometry placed at
  the given position.
