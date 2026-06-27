# Fork Rules -- Personal Deployment Fork

This file contains rules specific to this personal fork of World of Arcane Hunters.
It is loaded by reference from `CLAUDE.md` and takes precedence over generic guidance
in that file. Every future Claude session working on this repo must read this file
before making any changes.

---

## This is a personal fork

The branch `claude/friendly-albattani-23ybq8` is the live deployment branch.
This fork is maintained by one operator (not open to community contributions).
The upstream community project continues to evolve; this fork pulls those updates
and adds custom deployment configuration and game content on top.

---

## Rule 1: Prefer new files over modifying upstream files

New files (`docs/SETUP-*.md`, `src/sim/content/custom/index.ts`, `FORK.md`, etc.)
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
never touches it. All custom zones, mobs, items, quests, NPCs, and dungeons go in
`src/sim/content/custom/index.ts`.

**Never add custom content directly to upstream content files** (`classes.ts`,
`zone1.ts`, `dungeons.ts`, etc.). Only `src/sim/data.ts` was modified (to import
and merge custom content), and that modification is already documented in
`docs/MAINTAINING-FORK.md`.

See `src/sim/content/custom/CLAUDE.md` for:
- How to add each content type (mobs, items, zones, quests, dungeons)
- ID naming conventions (use `custom_` prefix)
- Determinism rules (CUSTOM_CAMPS must stay appended last)
- Dungeon index rules (use 10+ to avoid upstream collisions)
- What requires touching an upstream file (new player CLASSES cannot be isolated)

---

## Rule 4: Safe upstream sync workflow

When pulling upstream updates:

```bash
# SAFE: merge preserves our commits
git fetch origin master
git merge origin/master

# NEVER do this -- it silently discards all fork-specific commits
git reset --hard origin/master
```

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

# Check for zone overlap (upstream ends at z=900; custom zones must start at z=2000+)
grep -n "zMax" src/sim/content/zone*.ts src/sim/content/temple.ts 2>/dev/null
grep -n "zMin" src/sim/content/custom/index.ts
# If any upstream zMax reaches or exceeds your custom zMin, see
# docs/custom-content/zones.md for the fix procedure.
```

If `grep` returns nothing, re-apply the code from `docs/MAINTAINING-FORK.md`.

---

## Rule 5: Post-merge failure recovery protocol

If the build fails, tests break, or the server crashes after pulling from upstream/master,
follow this protocol in order. Do not skip steps -- a passing test suite is the only
acceptable exit condition.

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
   FORK.md \
   src/sim/content/custom/index.ts src/sim/content/custom/CLAUDE.md \
   src/render/characters/custom/index.ts src/render/characters/custom/CLAUDE.md \
   public/models/creatures/custom/.gitkeep \
   scripts/brand_inject.mjs src/ui/i18n.catalog/fork_brand.ts

# Verify custom visual hook survived in manifest.ts
grep -n "CUSTOM_MOB_KEYS\|CUSTOM_VISUALS" src/render/characters/manifest.ts
# Expect: 3 hits -- import line + ...CUSTOM_VISUALS spread + ...CUSTOM_MOB_KEYS spread

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
grep -n "zMin\|zMax" src/sim/content/custom/index.ts
# Confirm no upstream zMax is >= your lowest custom zMin (custom zones should start at 2000+)
# If any upstream zone's zMax reaches or exceeds a custom zone's zMin, shift the
# custom zone northward -- see docs/custom-content/zones.md for the fix procedure.
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
that `src/sim/content/custom/index.ts` imports (e.g. `MobTemplate`, `ItemDef`,
`ZoneDef`, `DungeonDef`), update the import in `index.ts` to match.

**If upstream changed the `ZoneDef`, `MobTemplate`, `ItemDef`, `DungeonDef`, or
`NpcDef` interface shape** (added a required field, changed a field type, removed
a field), then `src/sim/content/custom/index.ts` may have type errors. Fix them
by updating the custom content entries to satisfy the new shape. Also update the
relevant guide in `docs/custom-content/` (e.g. `zones.md` for ZoneDef, `items.md`
for ItemDef, `mobs.md` for MobTemplate, `dungeons.md` for DungeonDef) to show the
new field requirements.

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

If i18n tests fail after a merge that touched locale files:
```bash
npm run i18n:gen && npm run i18n:hash -- --write
npm test
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
- **Brand rename (2026-06):** ~30 upstream files updated -- game name, realm name, domain, GitHub URL.
  See the "Brand rename" section in `docs/MAINTAINING-FORK.md` for the full replacement map.

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
