# Fork Rules -- Personal Deployment Fork

This file contains rules specific to this personal fork of World of Arcane Hunters.
It is loaded by reference from `CLAUDE.md` and takes precedence over generic guidance
in that file. Every future Claude session working on this repo must read this file
before making any changes.

---

## This is a personal fork

The branch `master` is the live deployment branch; feature work lands on `feature/<slug>` branches and is merged to master via pull request.
This fork is maintained by one operator (not open to community contributions).
The upstream community project continues to evolve; this fork pulls those updates
and adds custom deployment configuration and game content on top.

---

## Rule 1: Prefer new files over modifying upstream files

New files (`docs/SETUP-*.md`, `src/sim/content/custom/`, `FORK.md`, etc.)
are completely safe from upstream merge conflicts. A modification to an existing
upstream file (e.g. `server/main.ts`) is a conflict risk on every future pull.

When adding a feature or configuration:
- **Can it go in a new file?** Do it there. New files are never overwritten.
- **Must it touch an existing upstream file?** Then document it in `docs/MAINTAINING-FORK.md`
  immediately after making the change.

---

## Rule 2: Every upstream file modification must be recorded

When you change any file that also exists in the upstream project, you MUST:

1. Make the change.
2. Open `docs/MAINTAINING-FORK.md`.
3. Add an entry to the "Lives in git -- changes to upstream files" section with:
   - File path
   - One-line description of the change
   - The EXACT code snippet (old and new, or the addition) so it can be re-applied
     if a future merge loses it.

This is not optional. The record is what allows the operator to recover from a bad
merge without losing their customizations.

---

## Rule 3: Custom game content goes in `src/sim/content/custom/`

The directory `src/sim/content/custom/` is owned entirely by this fork. Upstream
never touches it. Custom content is split into per-zone subdirectories:

```
custom/
├── index.ts                   -- assembly barrel: re-exports CUSTOM_* groups for data.ts
├── i18n_ids.ts                -- fork-owned i18n extension point (IDs + English names)
├── CLAUDE.md                  -- authoring guide
└── dragons_blight/            -- Zone 4, levels 18-20
    ├── items.ts   mobs.ts   npcs.ts   quests.ts
    ├── zones.ts   camps.ts  props.ts  dungeons.ts
```

**Never add custom content directly to upstream content files** (`classes.ts`,
`zone1.ts`, `dungeons.ts`, etc.). Only `src/sim/data.ts` was modified (to import
and merge custom content), and that modification is already documented in
`docs/MAINTAINING-FORK.md`.

See `src/sim/content/custom/CLAUDE.md` for:
- How to add each content type (mobs, items, zones, quests, dungeons)
- ID naming conventions (use `custom_` prefix)
- Determinism rules (CUSTOM_CAMPS must stay appended last)
- Dungeon index rules (index 6 is the only remaining slot)
- What requires touching an upstream file (new player CLASSES cannot be isolated)

---

## Rule 4: Safe upstream sync workflow

When pulling upstream updates, upstream always wins conflicts. Use `-X theirs` so
every conflict is auto-resolved in upstream's favour without manual intervention:

```bash
git fetch origin master
git merge -X theirs origin/master

# NEVER do this -- it silently discards all fork-specific commits
git reset --hard origin/master
```

`-X theirs` means: when upstream and this fork changed the same lines, upstream's
version is kept automatically. This is intentional -- fork additions to upstream
files are small, documented, and easy to re-apply; manual conflict resolution on a
complex upstream diff is error-prone. The health checks below are the recovery step
and run after EVERY merge as a matter of routine, not only when things look broken.

After any merge, run this health check:

```bash
# Verify our ADMIN_HOSTNAME code survived
grep -n "ADMIN_HOSTNAME" server/main.ts

# Verify custom content hook survived
grep -n "CUSTOM_CAMPS" src/sim/data.ts

# Verify our docs files still exist
ls docs/SETUP-DIGITALOCEAN.md docs/SETUP-LOCAL-MAC.md docs/SETUP-CLOUDFLARE.md \
   docs/SETUP-LOCAL-SUPABASE.md docs/MAINTAINING-FORK.md docs/CUSTOM-CONTENT.md FORK.md

# Verify README pointer survived (not the full upstream section)
grep -c "docs/SETUP-DIGITALOCEAN.md" README.md

# Verify brandTokenPlugin() is REGISTERED, not just defined (a merge that rewrites the
# plugins array can drop the fork's entry while leaving the function itself intact --
# expect 2+ hits, not 1)
grep -c "brandTokenPlugin" vite.config.ts

# Verify src/main.ts SITE_URL still reads the build-injected constant, not a hardcoded
# upstream or un-injected string literal
grep -A1 "^declare const __SITE_URL__" src/main.ts

# Verify play.html/guide.html hreflang blocks and Discord/GitHub links survived (these
# were missing from the original 2026-06 brand rename file list and are easy to lose
# again on the next merge; see "Brand rename scope audit (2026-07)" in MAINTAINING-FORK.md)
grep -c "https://TODO-your-domain.com" play.html guide.html

# Check for zone contiguity: upstream Zone 3 ends at z=900; Dragon's Blight starts at z=900.
# If upstream adds a new Zone 4 that also starts at z=900 (or extends to z>900), there
# will be a gap or overlap. The progression test requires ZONES[i].zMax === ZONES[i+1].zMin.
grep -n "zMin\|zMax" src/sim/content/zone*.ts src/sim/content/temple.ts 2>/dev/null
grep -n "zMin\|zMax" src/sim/content/custom/dragons_blight/zones.ts
# Custom Dragon's Blight: zMin:900, zMax:1260. If any upstream zone's zMax > 900,
# shift custom zone northward -- see docs/custom-content/zones.md for the fix procedure.
```

If any grep returns fewer hits than expected, upstream overwrote that addition.
Re-apply it from the matching code block in `docs/MAINTAINING-FORK.md`.
Run the full protocol in Rule 5 -- every check, every time.

---

## Rule 5: Post-merge re-apply protocol

After every upstream merge (`git merge -X theirs origin/master`), upstream's version
of any conflicting file is kept automatically. Fork additions to upstream files are
therefore routinely overwritten and must be re-applied. This is the expected, normal
workflow -- not an error condition. Run through every step below after every merge.
A passing test suite is the only acceptable exit condition.

### Step 1 -- run the health checks

```bash
# Verify ADMIN_HOSTNAME code survived
grep -n "ADMIN_HOSTNAME" server/main.ts
# Expect: two hits -- the constant and the adminByHost line in isAdminRequest()

# Verify custom content hook survived
grep -n "CUSTOM_CAMPS\|CUSTOM_MOBS\|CUSTOM_ITEMS\|CUSTOM_NPCS\|CUSTOM_QUESTS\|CUSTOM_ZONES\|CUSTOM_DUNGEON" src/sim/data.ts
# Expect: the import block and one spread per table

# Verify fork-owned files still exist
ls docs/SETUP-DIGITALOCEAN.md docs/SETUP-LOCAL-MAC.md docs/SETUP-CLOUDFLARE.md \
   docs/SETUP-LOCAL-SUPABASE.md docs/MAINTAINING-FORK.md docs/CUSTOM-CONTENT.md \
   docs/custom-content/ADDING-CUSTOM-CONTENT.md docs/custom-content/CREATURE-MODELS.md \
   docs/custom-content/items.md docs/custom-content/mobs.md docs/custom-content/camps.md \
   docs/custom-content/npcs.md docs/custom-content/quests.md docs/custom-content/zones.md \
   docs/custom-content/ground-objects.md docs/custom-content/props.md \
   docs/custom-content/roads.md docs/custom-content/dungeons.md \
   docs/custom-content/complete-example.md \
   docs/custom-content/map-layout.md docs/custom-content/developer-commands.md \
   FORK.md \
   src/sim/content/custom/index.ts src/sim/content/custom/CLAUDE.md \
   src/sim/content/custom/dragons_blight/items.ts \
   src/sim/content/custom/dragons_blight/mobs.ts \
   src/sim/content/custom/dragons_blight/npcs.ts \
   src/sim/content/custom/dragons_blight/quests.ts \
   src/sim/content/custom/dragons_blight/zones.ts \
   src/sim/content/custom/dragons_blight/camps.ts \
   src/sim/content/custom/dragons_blight/props.ts \
   src/sim/content/custom/dragons_blight/dungeons.ts \
   src/render/characters/custom/index.ts src/render/characters/custom/CLAUDE.md \
   public/models/creatures/custom/.gitkeep \
   scripts/brand_inject.mjs src/ui/i18n.catalog/fork_brand.ts

# Verify custom visual hook survived in manifest.ts
grep -n "CUSTOM_MOB_KEYS\|CUSTOM_VISUALS" src/render/characters/manifest.ts
# Expect: 3 hits -- import line + ...CUSTOM_VISUALS spread + ...CUSTOM_MOB_KEYS spread

# Verify Dragon's Maw union member survived in types.ts
grep -c "dragons_maw" src/sim/types.ts
# Expect: 1

# Verify Dragon's Maw layout survived in dungeon_layout.ts
grep -c "DRAGONS_MAW_LAYOUT" src/sim/dungeon_layout.ts
# Expect: 1

# Verify custom dungeon renderer hooks survived in dungeon.ts
grep -c "CUSTOM_TORCH_COLORS\|isCustomDungeonVariant\|applyCustomWallDressing\|dungeon_custom" src/render/dungeon.ts
# Expect: 7+ (import block + TORCH_COLORS spread + variantFor + floorKind + wallKind + placeWalls + placeWallDressing)

# Verify fork-owned dungeon rendering custom file exists
ls src/render/dungeon_custom.ts

# Verify Dragon's Maw colliders survived in colliders.ts
grep -c "DRAGONS_MAW" src/sim/colliders.ts
# Expect: 3 (import + const + INTERIOR_COLLIDERS entry)

# Verify brand injection survived in vite.config.ts
grep -n "brandTokenPlugin\|__SITE_URL__\|VITE_SITE_URL\|VITE_GA_ID\|WOC:GA" vite.config.ts
# Expect: env reads for gaId/metaPixelId, define block entries, brandTokenPlugin in plugins

# Verify Dockerfile brand args survived
grep -n "VITE_SITE_URL\|VITE_DISCORD_URL\|VITE_DONATE_URL" Dockerfile

# Verify the deploy workflow passes the brand args
grep -n "VITE_SITE_URL\|VITE_DISCORD_URL\|VITE_DONATE_URL" .github/workflows/deploy.yml

# Check for zone overlap: compare upstream zone z-boundaries against custom zone zMin values
grep -n "zMin\|zMax" src/sim/content/zone*.ts src/sim/content/temple.ts 2>/dev/null
# Then check your custom zones:
grep -n "zMin\|zMax" src/sim/content/custom/dragons_blight/zones.ts
# Dragon's Blight custom zone: zMin:900, zMax:1260.
# The zone contiguity invariant (ZONES[i].zMax === ZONES[i+1].zMin) means custom zones
# must start exactly where the last upstream zone ends. Currently that is z=900.
# If upstream adds a new upstream zone 4 (zMin:900), the custom zone must shift north.
# See docs/custom-content/zones.md and docs/MAINTAINING-FORK.md for the fix procedure.
```

If any check returns nothing or is missing, re-apply from `docs/MAINTAINING-FORK.md`
before continuing.

### Step 2 -- review every documented upstream change

Open `docs/MAINTAINING-FORK.md` and read through the "Lives in git -- changes to
upstream files" section. For each entry:

1. Open the file in the editor and search for the documented change.
2. If the change is missing or wrong: re-apply the exact code from the doc block.
3. If upstream refactored the surrounding code (renamed a function, moved the
   section, changed the merge pattern): adapt the fork addition to fit the new
   upstream shape -- the intent stays, the syntax adapts. See Step 3 for the
   most common refactor patterns.

Do not skip any entry even if you think the error is unrelated. Silent regressions
in one section often surface as failures in another.

### Step 3 -- diagnose upstream refactors that affect custom content

If `src/sim/data.ts` was refactored by upstream, the custom content hook may need
to be updated. The hook has two parts that must stay in sync:

**The import block** (search for `CUSTOM_CAMPS` in data.ts):
```typescript
import {
  CUSTOM_CAMPS, CUSTOM_DUNGEON_DEFS, CUSTOM_DUNGEON_MOBS, CUSTOM_ITEMS, CUSTOM_MOBS,
  CUSTOM_NPCS, CUSTOM_OBJECTS, CUSTOM_PROPS, CUSTOM_QUEST_ORDER, CUSTOM_QUESTS,
  CUSTOM_ROADS, CUSTOM_ZONES,
} from './content/custom';
```

**The merge lines** -- each export that upstream builds by spreading content arrays
must also spread the matching `CUSTOM_*` export. For example, if upstream changes:
```typescript
export const MOBS = { ...ZONE1_MOBS, ...ZONE2_MOBS };
// to:
export const MOBS = mergeMobs(ZONE1_MOBS, ZONE2_MOBS);
```
Then the fork line must change to append custom mobs in the new form:
```typescript
export const MOBS = { ...mergeMobs(ZONE1_MOBS, ZONE2_MOBS), ...CUSTOM_MOBS, ...CUSTOM_DUNGEON_MOBS };
```
The rule is: `CUSTOM_*` spreads always come LAST. For CAMPS specifically, being
last is required for determinism (each camp draws world-gen RNG in array order).

Check the TypeScript types too: if upstream renamed a type in `src/sim/types.ts`
that the per-zone files import (e.g. `MobTemplate`, `ItemDef`, `ZoneDef`, `DungeonDef`),
update the import in the relevant file under `src/sim/content/custom/dragons_blight/` to match.

**If upstream changed the `ZoneDef`, `MobTemplate`, `ItemDef`, `DungeonDef`, or
`NpcDef` interface shape** (added a required field, changed a field type, removed
a field), then the per-zone content files may have type errors. Fix them by updating
the custom content entries in the relevant `dragons_blight/*.ts` file to satisfy
the new shape. Also update the relevant guide in `docs/custom-content/` (e.g.
`zones.md` for ZoneDef, `items.md` for ItemDef, `mobs.md` for MobTemplate, `dungeons.md`
for DungeonDef) to show the new field requirements. Document the change in
`docs/MAINTAINING-FORK.md` under the appropriate file heading.

### Step 4 -- fix TypeScript errors before running tests

After re-applying any missing code, check for TypeScript errors:
```bash
npx tsc --noEmit
```

Fix type errors before running tests. A type error in a shared type (`types.ts`,
`world_api.ts`) will cause cascade failures in the test suite that mask the real issue.

### Step 5 -- run the full test suite

```bash
npm test
```

Tests to pay attention to for fork-specific regressions:
- `tests/architecture.test.ts` -- sim purity; fails if a bad import was added to sim files
- `tests/sim.test.ts` -- custom content IDs and basic sim health
- `tests/localization_fixes.test.ts` -- S3 i18n guard; fails if a new sim string has no matcher
- `tests/localization_fixes.test.ts` -- also catches brand URL drift if upstream changed placeholder values
- `tests/parity/` -- RNG draw-order golden traces; fails if upstream content shifts camp/entity order

If i18n tests fail after a merge that touched locale files:
```bash
npm run i18n:gen && node scripts/i18n_resolved_hash.mjs --write
npm test
```

If parity tests fail after a merge that changed upstream content (new camps/mobs/zones):
```bash
UPDATE_PARITY=1 npx vitest run tests/parity
# This regenerates the golden traces. Then re-run npm test to confirm all pass.
```

### Step 6 -- verify the build pipeline

```bash
npm run build
```

If the build succeeds, run the post-build brand injection to confirm token
replacement is still working:
```bash
VITE_SITE_URL=https://world.arcanehunters.com \
VITE_DISCORD_URL=https://discord.gg/TODO \
VITE_DONATE_URL=https://github.com/sponsors/TODO \
npm run brand:inject
```

Then check that the tokens were replaced in the dist output:
```bash
grep -r "TODO-your-domain\|discord.gg/TODO\|sponsors/TODO" dist/ --include="*.html" --include="*.txt" --include="*.xml"
# Should return nothing (all tokens replaced)
```

### Step 7 -- update documentation to match any upstream refactors

After all code is fixed and tests are green, update the docs to reflect the new state:

1. **`docs/MAINTAINING-FORK.md`** -- update the code snippet for any entry where
   the surrounding upstream code changed. The goal is that a future merge can be
   re-applied from the doc without context. If a function was renamed or moved,
   update the snippet to show where it lives now.

2. **`FORK.md` "What was changed from upstream" short list** -- if the change
   description or file path changed, update the one-liner.

3. **`docs/custom-content/`** -- if any type interface changed (new required fields,
   renamed fields), update the field reference table and example in the relevant
   per-type guide: `zones.md`, `items.md`, `mobs.md`, `dungeons.md`, `npcs.md`,
   `quests.md`, `camps.md`, `props.md`, `ground-objects.md`, or `roads.md`.
   `ADDING-CUSTOM-CONTENT.md` is now the index; the per-type files carry the detail.

4. **`src/sim/content/custom/CLAUDE.md`** -- if the authoring rules changed
   (e.g., a new upstream dungeon index now takes index 3-9, pushing the custom
   minimum to a higher number), update the index rule.

5. **Any `CLAUDE.md` that references a file path or line number** -- file paths in
   CLAUDE.md comments go stale. Re-verify any `file:line` reference that was near
   code you touched.

The docs are the record that allows the next merge to go smoothly. If you fixed
something without documenting how, the same fix will need to be re-derived next time.

---

## Rule 6: Deployment configuration lives outside git

The actual deployment credentials and domain settings are NEVER in git:

| Asset | Location | Safe from git? |
|---|---|---|
| `/opt/eastbrook/.env` | Droplet filesystem | Yes |
| `/etc/caddy/Caddyfile` | Droplet filesystem | Yes |
| GitHub `production` secrets | GitHub repository settings | Yes |
| DNS records | Registrar / Cloudflare | Yes |
| Cloudflare dashboard settings | Cloudflare | Yes |

---

## Reference: What was changed from upstream

A full list of all upstream file modifications with exact code snippets is in
`docs/MAINTAINING-FORK.md`. Review that file when resolving merge conflicts.

**Short list:**
- `server/main.ts` -- added `ADMIN_HOSTNAME` constant + updated `isAdminRequest()`
- `.env.example` -- added `ADMIN_HOSTNAME` documentation block
- `DEPLOY.md` -- added Cloudflare guide link and rate-limiting note
- `README.md` -- replaced DigitalOcean deployment section with pointer to `docs/SETUP-DIGITALOCEAN.md`
- `src/sim/data.ts` -- added import + merges for `src/sim/content/custom/`
- `src/render/characters/manifest.ts` -- added import + spreads for `src/render/characters/custom/`
- `src/sim/types.ts` -- `DungeonDef.interior` union extended with `'dragons_maw'`
- `src/sim/dungeon_layout.ts` -- added `DRAGONS_MAW_LAYOUT` for the Dragon's Maw custom dungeon interior
- `src/render/dungeon.ts` -- added import + hook points for `dungeon_custom.ts`: `CustomDungeonVariantId` in union, `...CUSTOM_TORCH_COLORS` spread, `isCustomDungeonVariant` delegates in `variantFor`/`floorKind`/`wallKind`/`placeWallDressing`, `getCustomDungeonLayout` in `buildInterior`, `CUSTOM_NO_BANNER_VARIANTS` check in `placeWalls`
- `src/sim/colliders.ts` -- added `DRAGONS_MAW_COLLIDERS` and `dragons_maw` entry in `INTERIOR_COLLIDERS`
- `src/sim/sim.ts` -- secondary RNG (`customRng = new Rng(seed ^ 0x464f524b)`) for CUSTOM_CAMPS mob init to prevent main RNG stream shift
- `src/ui/world_entity_i18n.ts` -- imports Dragon's Blight entity IDs from `src/sim/content/custom/i18n_ids.ts` via spread
- `src/ui/i18n.catalog/items.ts` -- imports Dragon's Blight item IDs + English names from `src/sim/content/custom/i18n_ids.ts` via spread
- `tests/threat.test.ts` -- ghost wolf cancellation test: replaced RNG-sensitive `wolf.hp` check with GCD check
- `tests/dungeons.test.ts` -- rollLoot private-access and loot null-safety fixes (TypeScript strict-mode TS2341/TS18047)
- `src/main.ts` -- `requestPreferredFullscreen()` skips auto-fullscreen in local dev (`import.meta.env.DEV`)
- `src/sim/data.ts` -- `ARENA_X` shifted 4200 -> 4700 and `DELVE_X_MIN` shifted 4800 -> 5300 to open dungeon index 6 (x=4500) for Dragon's Maw; all upstream indices 0-5 were occupied
- `tests/delves.test.ts` -- pin test updated from `DELVE_X_MIN = 4800` to 5300 and from `ARENA_X = 4200` comment to 4700
- **Brand rename (2026-06):** ~30 upstream files updated -- game name, realm name, domain, GitHub URL.
  See the "Brand rename" section in `docs/MAINTAINING-FORK.md` for the full replacement map.
- **Brand rename scope audit (2026-07):** the 2026-06 pass missed `play.html`/`guide.html`'s
  hreflang blocks, `public/press.html`, `public/llms.txt`, ~15 `server/*.ts` files (TOTP
  issuer, wallet-sign message, email/OAuth/GitHub-repo-default text), `src/ui/i18n.catalog/
  hud_chrome.ts` + all 20 locale overlays' brand/realm proper nouns, and the `src/guide/*`
  wiki shell; also found two live regressions (`vite.config.ts`'s `brandTokenPlugin()` not
  registered in the plugins array, `src/main.ts` `SITE_URL` reverted to a hardcoded string)
  and one case-sensitivity bug in `server/player_card.ts`'s trusted-host map. Full detail
  and the extended health-check list: "Brand rename scope audit (2026-07)" in
  `docs/MAINTAINING-FORK.md`.

**Fork-owned new files (never conflict with upstream):**
- `src/ui/i18n.catalog/fork_brand.ts` -- central brand constants (`FORK_BRAND`); imported by `index.ts`
- `scripts/brand_inject.mjs` -- post-build token replacement: patches dist/ static files with real brand URLs
- `docs/custom-content/ADDING-CUSTOM-CONTENT.md` -- index and quick-reference for all custom content guides
- `docs/custom-content/items.md` -- items guide
- `docs/custom-content/mobs.md` -- overworld and dungeon mobs guide
- `docs/custom-content/camps.md` -- camp spawn placement guide
- `docs/custom-content/npcs.md` -- NPC guide
- `docs/custom-content/quests.md` -- quests guide
- `docs/custom-content/zones.md` -- zones guide (includes overlap avoidance)
- `docs/custom-content/ground-objects.md` -- ground objects guide
- `docs/custom-content/props.md` -- props guide
- `docs/custom-content/roads.md` -- roads guide
- `docs/custom-content/dungeons.md` -- dungeons guide
- `docs/custom-content/complete-example.md` -- complete zone template
- `docs/custom-content/map-layout.md` -- step-by-step guide for relocating and adding camps, buildings, respawn points, and all prop types
- `docs/custom-content/developer-commands.md` -- all dev/debug commands for local development
- `src/sim/content/custom/dragons_blight/` -- per-zone content module (items, mobs, npcs, quests, zones, camps, props, dungeons)
- `src/render/dungeon_custom.ts` -- fork-owned Dragon's Maw dungeon rendering: `CustomDungeonVariantId` type, torch colours, layout lookup, floor/wall kind tables, wall dressing (hooked into `dungeon.ts` via small delegates)
- `src/render/characters/custom/index.ts` -- custom creature visual overrides (CUSTOM_VISUALS + CUSTOM_MOB_KEYS)
- `src/render/characters/custom/CLAUDE.md` -- authoring guide for the custom visual directory
- `public/models/creatures/custom/` -- fork-owned directory for custom GLB model files
- `docs/custom-content/CREATURE-MODELS.md` -- step-by-step guide for overriding and adding creature models

**Build-time brand URL injection (variable substitution system):**
Source files keep `TODO-your-domain.com` / `https://discord.gg/TODO` / `https://github.com/sponsors/TODO`
as placeholders so tests and source-level checks always pass. At deploy time, three environment
variables replace the placeholders in the built output:

| Variable | Where to set | Description |
|---|---|---|
| `VITE_SITE_URL` | GitHub Actions repo variable | Full https:// origin, no trailing slash |
| `VITE_DISCORD_URL` | GitHub Actions repo variable | Discord invite URL |
| `VITE_DONATE_URL` | GitHub Actions repo variable | Donate/sponsor URL |
| `VITE_GA_ID` | GitHub Actions repo variable | Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX). Leave unset to strip GA entirely. |
| `VITE_META_PIXEL_ID` | GitHub Actions repo variable | Meta (Facebook) Pixel numeric ID. Leave unset to strip Meta Pixel entirely. |

These are passed as Docker `--build-arg` values in `.github/workflows/deploy.yml`. The build
pipeline substitutes them in three places:
1. **JS/TS bundles** -- via Vite `define` block (`__SITE_URL__`, `__DISCORD_URL__`, `__DONATE_URL__`)
2. **HTML entry files** (index.html, play.html, guide.html) -- via `brandTokenPlugin` in `vite.config.ts`
3. **Static public/ files** (robots.txt, sitemap.xml, legal pages) -- via `npm run brand:inject` (post-build)

If upstream updates these files and changes a TODO placeholder URL to something else, the
`brand_inject.mjs` script will no longer match the old token. In that case:
1. Update the TODO placeholder in `brand_inject.mjs` / `vite.config.ts` to match the new token.
2. Run `npm run build && npm run brand:inject` to verify the replacement works.
3. Document the updated token in `docs/MAINTAINING-FORK.md`.

**Analytics ID injection (third-party tracking control):**
The upstream HTML files contain Google Analytics and Meta Pixel script blocks with upstream
tracking IDs. This fork replaces those IDs with `TODO-` placeholder tokens and wraps each
block in `<!-- WOC:GA:START/END -->` / `<!-- WOC:META:START/END -->` marker comments.
At build time, `brandTokenPlugin` in `vite.config.ts` either:
- Strips the entire block when the env var is not set (default -- no tracking ships).
- Removes the markers and injects your real ID when the env var is set.

This means a fork build with no `VITE_GA_ID` / `VITE_META_PIXEL_ID` set ships zero
third-party analytics. Set your own IDs as GitHub Actions repo variables to re-enable
tracking under your own accounts.
