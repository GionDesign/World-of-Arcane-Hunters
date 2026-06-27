# Custom Content: Zones

Zones are north-running world bands that define terrain, level range, hub settlement,
and respawn point for an area. All custom zones go in the `CUSTOM_ZONES` export in
`src/sim/content/custom/index.ts`.

Back to index: [ADDING-CUSTOM-CONTENT.md](./ADDING-CUSTOM-CONTENT.md)

---

## Upstream zone boundaries (verified from source)

| Zone | Name | zMin | zMax |
|---|---|---|---|
| Zone 1 | Eastbrook Vale | -180 | 180 |
| Zone 2 | Mirefen Marsh | 180 | 540 |
| Zone 3 | Thornpeak Heights | 540 | 900 |

**Custom zones must start at z=2000 or higher.** See the overlap avoidance section
below before choosing your z values.

---

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique ID with `custom_` prefix |
| `name` | string | yes | Zone name shown on map (English) |
| `zMin` | number | yes | Southern boundary (2000 or higher; zones stack northward) |
| `zMax` | number | yes | Northern boundary |
| `levelRange` | [min, max] | yes | Recommended player level range |
| `biome` | BiomeId | yes | `'vale'`, `'marsh'`, or `'peaks'` (controls terrain color and texture) |
| `hub` | object | yes | Main settlement (terrain flattens here; see below) |
| `graveyard` | `{x, z}` | yes | Player respawn point inside this zone |
| `lakes` | array | yes | Array of `{x, z, radius}` lake definitions (can be `[]`) |
| `pois` | array | yes | Points of interest shown on map: `{x, z, label}` (can be `[]`) |
| `welcome` | string | yes | Short message shown in chat on first entry (English) |

**Hub shape:**
```typescript
hub: { x: number, z: number, radius: number, name: string }
```
The radius is the settlement flat zone (terrain geometry flattens within it).

**Biome reference:**
- `'vale'` - green rolling hills (like zone 1 Eastbrook Vale)
- `'marsh'` - murky wetlands (like zone 2 Mirefen Marsh)
- `'peaks'` - snowy high-altitude terrain (like zone 3 Thornpeak Heights)

---

## Step-by-step

1. Decide the z band. Start at 2000 for your first zone (see overlap avoidance below).
   If you add a second zone, start it at the first zone's `zMax`.
2. Add your zone inside the `CUSTOM_ZONES` array:

```typescript
export const CUSTOM_ZONES: ZoneDef[] = [
  {
    id: 'custom_ashenmoor',
    name: 'The Ashenmoor',
    zMin: 2000,
    zMax: 2360,
    levelRange: [18, 25],
    biome: 'marsh',
    hub: { x: 0, z: 2060, radius: 30, name: 'Ashenmoor Camp' },
    graveyard: { x: -10, z: 2070 },
    lakes: [
      { x: 60, z: 2120, radius: 40 },
    ],
    pois: [
      { x: 0,  z: 2060, label: 'Ashenmoor Camp' },
      { x: 60, z: 2120, label: 'The Mire' },
    ],
    welcome: 'The Ashenmoor stretches before you, bleak and fog-shrouded.',
  },
];
```

3. Add camp entries in `CUSTOM_CAMPS` with `center.z` inside this zone's band
   (see [camps.md](./camps.md)).
4. Place NPCs near the hub `z` coordinate (see [npcs.md](./npcs.md)).
5. Run `npm test` to verify no errors.

---

## Zone overlap avoidance

### Why overlap happens

`CUSTOM_ZONES` are appended LAST into the engine's `ZONES` array by `src/sim/data.ts`.
When the engine resolves which zone a player is in, it searches `ZONES` in order. If an
upstream zone covers the same z range as a custom zone, the upstream zone appears earlier
in the array and wins -- the custom zone's hub, level range, and welcome text are
invisible even though the zone entry still exists in the array.

### Why z=2000+ is the safe starting point

Upstream currently ends at z=900 (zone 3). With z=2000+ as the custom start, upstream
would need to add at least 3 more full-width zones before reaching custom content. Each
upstream zone spans roughly 360 units (zones 2 and 3 each span 360), so the 1100-unit
gap between z=900 and z=2000 is comfortable runway.

### Detecting overlap after a merge

After any upstream merge, run:

```bash
# Check current upstream zone z-boundaries
grep -n "zMin\|zMax" src/sim/content/zone*.ts src/sim/content/temple.ts 2>/dev/null

# Then check your custom zones:
grep -n "zMin\|zMax" src/sim/content/custom/index.ts
```

Compare the highest upstream `zMax` against the lowest custom `zMin`. If any upstream
`zMax` is greater than or equal to your custom `zMin`, there is an overlap to fix.

### Fixing an overlap

Only files you own need to change. Open `src/sim/content/custom/index.ts` and shift
all custom z values northward by a consistent delta:

1. Increase every `CUSTOM_ZONES` entry's `zMin` and `zMax` to clear the new upstream
   `zMax` by at least 100 units (e.g. upstream new zMax=1260, shift custom start to
   1400 or higher -- or simply restore to 2000+ for a permanent safe margin).
2. Update every `CUSTOM_CAMPS` entry: shift `center.z` by the same delta.
3. Update `hub.z`, `graveyard.z`, all `lakes[].z`, and all `pois[].z` inside
   `CUSTOM_ZONES` by the same delta.
4. Update any `CUSTOM_NPCS` `pos.z`, `CUSTOM_ROADS` point z values, `CUSTOM_PROPS`
   building/well/etc z values, and `CUSTOM_OBJECTS` `positions[].z` that were inside
   the old z band.
5. Run `npm test` to confirm no errors.

The fix is always safe: all custom content lives in the fork-owned `custom/index.ts`
and no upstream merge can overwrite it.
