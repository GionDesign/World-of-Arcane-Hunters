# Post-Merge Maintenance Prompt

Copy the block below verbatim and paste it as your first message in a new Claude
Code session immediately after completing a `git merge origin/master`. The session
must have read `FORK.md` and `docs/MAINTAINING-FORK.md` before acting -- the prompt
instructs it to do so. Run this every time; do not skip steps.

---

## The prompt (copy from the dashes below)

---

I have just merged the latest `master` (upstream) into this fork using
`git merge -X theirs origin/master`. Upstream wins all conflicts automatically, so
fork additions to upstream files are routinely overwritten and must be re-applied.
This is normal and expected -- the steps below are the standard re-apply cycle, not
an error-recovery path.

Please read `FORK.md` and `docs/MAINTAINING-FORK.md` in full before making any
changes. The cycle has three phases:

1. **Re-apply**: restore every fork addition that upstream overwrote (Steps 1-2).
2. **Adapt**: check whether upstream changed the surrounding code in a way that means
   the restored snippet no longer fits -- new required fields, renamed functions,
   refactored patterns -- and update the re-applied code to match (Steps 3-5).
3. **Verify and document**: run tests, build, and update all docs so the next merge
   starts with an accurate record (Steps 6-11).

Work through every step in order. Commit and push after step 10. Do not skip or
reorder steps. Every health check that returns fewer hits than expected means upstream
overwrote that addition; re-apply it from the code block in `docs/MAINTAINING-FORK.md`
before moving on.

### Step 1 -- health check: fork-owned files

Verify all fork-owned files still exist:

```bash
ls docs/SETUP-DIGITALOCEAN.md docs/SETUP-LOCAL-MAC.md docs/SETUP-CLOUDFLARE.md \
   docs/SETUP-LOCAL-SUPABASE.md docs/MAINTAINING-FORK.md docs/CUSTOM-CONTENT.md \
   docs/custom-content/ADDING-CUSTOM-CONTENT.md docs/custom-content/CREATURE-MODELS.md \
   docs/custom-content/items.md docs/custom-content/mobs.md docs/custom-content/camps.md \
   docs/custom-content/npcs.md docs/custom-content/quests.md docs/custom-content/zones.md \
   docs/custom-content/ground-objects.md docs/custom-content/props.md \
   docs/custom-content/roads.md docs/custom-content/dungeons.md \
   docs/custom-content/complete-example.md \
   docs/custom-content/map-layout.md docs/custom-content/developer-commands.md \
   docs/post-merge-prompt.md \
   FORK.md \
   src/sim/content/custom/index.ts src/sim/content/custom/i18n_ids.ts \
   src/sim/content/custom/CLAUDE.md \
   src/sim/content/custom/dragons_blight/items.ts \
   src/sim/content/custom/dragons_blight/mobs.ts \
   src/sim/content/custom/dragons_blight/npcs.ts \
   src/sim/content/custom/dragons_blight/quests.ts \
   src/sim/content/custom/dragons_blight/zones.ts \
   src/sim/content/custom/dragons_blight/camps.ts \
   src/sim/content/custom/dragons_blight/props.ts \
   src/sim/content/custom/dragons_blight/dungeons.ts \
   src/render/dungeon_custom.ts \
   src/render/characters/custom/index.ts src/render/characters/custom/CLAUDE.md \
   public/models/creatures/custom/.gitkeep \
   scripts/brand_inject.mjs src/ui/i18n.catalog/fork_brand.ts
```

If any file is missing, re-create it from `docs/MAINTAINING-FORK.md` or the git
history (`git log --all --full-history -- <path>`).

### Step 2 -- re-apply: upstream file modifications

Because upstream wins all conflicts, every addition this fork made to an upstream
file may have been overwritten. Run each grep command below. Any check that returns
fewer hits than expected means that addition was lost; re-apply it immediately from
the matching code block in `docs/MAINTAINING-FORK.md` before running the next check.

```bash
# ADMIN_HOSTNAME in server/main.ts (expect 2: constant + adminByHost line)
grep -n "ADMIN_HOSTNAME" server/main.ts

# Custom content hook in data.ts (expect: import block + one spread per table)
grep -n "CUSTOM_CAMPS\|CUSTOM_MOBS\|CUSTOM_ITEMS\|CUSTOM_NPCS\|CUSTOM_QUESTS\|CUSTOM_ZONES\|CUSTOM_DUNGEON" src/sim/data.ts

# Custom visual hook in manifest.ts (expect 3: import + 2 spreads)
grep -n "CUSTOM_MOB_KEYS\|CUSTOM_VISUALS" src/render/characters/manifest.ts

# Dragon's Maw interior type (expect 1)
grep -c "dragons_maw" src/sim/types.ts

# Dragon's Maw layout (expect 1)
grep -c "DRAGONS_MAW_LAYOUT" src/sim/dungeon_layout.ts

# Custom dungeon renderer hooks (expect 7+)
grep -c "CUSTOM_TORCH_COLORS\|isCustomDungeonVariant\|applyCustomWallDressing\|dungeon_custom" src/render/dungeon.ts

# Dragon's Maw colliders (expect 3)
grep -c "DRAGONS_MAW" src/sim/colliders.ts

# Secondary RNG for CUSTOM_CAMPS (expect 3+)
grep -c "customRng\|customCampSet" src/sim/sim.ts

# ARENA_X and DELVE_X_MIN fork values
grep "ARENA_X = " src/sim/data.ts          # expect 4700
grep "DELVE_X_MIN = " src/sim/data.ts      # expect 5300
grep "DELVE_X_MIN\).toBe" tests/delves.test.ts  # expect 5300

# Dragon's Blight i18n spreads in world_entity_i18n.ts (expect 10)
grep -c "CUSTOM_" src/ui/world_entity_i18n.ts

# Dragon's Blight item spreads in items catalog (expect 4)
grep -c "CUSTOM_" src/ui/i18n.catalog/items.ts

# FORK_BRAND import in catalog index (expect 3+: import + usages)
grep -c "FORK_BRAND" src/ui/i18n.catalog/index.ts

# Brand injection in vite.config.ts (expect: siteUrl + define entries + brandTokenPlugin)
grep -n "brandTokenPlugin\|__SITE_URL__\|VITE_SITE_URL" vite.config.ts
# brandTokenPlugin() must also be REGISTERED in the plugins array, not just defined
# (expect 2+; a merge that rewrites the plugins array can drop the fork's entry while
# leaving the function intact -- see "Brand rename scope audit (2026-07)" in
# docs/MAINTAINING-FORK.md)
grep -c "brandTokenPlugin" vite.config.ts

# src/main.ts SITE_URL must read the build-injected constant, never a hardcoded literal
grep -A1 "^declare const __SITE_URL__" src/main.ts

# play.html / guide.html hreflang + community-link blocks (missed by the original
# 2026-06 brand rename; expect 20+ hits each, one per hreflang alternate)
grep -c "https://TODO-your-domain.com" play.html guide.html

# Brand args in Dockerfile (expect: VITE_SITE_URL + VITE_DISCORD_URL + VITE_DONATE_URL)
grep -n "VITE_SITE_URL\|VITE_DISCORD_URL\|VITE_DONATE_URL" Dockerfile

# Brand args in deploy workflow (expect same 3)
grep -n "VITE_SITE_URL\|VITE_DISCORD_URL\|VITE_DONATE_URL" .github/workflows/deploy.yml

# GA / Meta Pixel markers in index.html (expect WOC:GA:START and WOC:META:START)
grep -c "WOC:GA:START\|WOC:META:START" index.html
```

### Step 3 -- adapt: check that re-applied code still fits upstream's new shape

Re-applying a code block verbatim is only correct if upstream did not also change the
surrounding context. Upstream may have: renamed a function, changed a type signature,
moved a block, added a required field, or refactored a pattern. Each of these means
the verbatim snippet re-applies cleanly but is now wrong. This step catches that.

**3a -- TypeScript compile check.** This is the fastest signal that a re-applied
snippet is structurally wrong:

```bash
npx tsc --noEmit 2>&1 | head -60
```

For every error in a fork-modified file:
1. Read the error. Does it reference a type or field that changed upstream?
2. Open `src/sim/types.ts` (or the file the error points to) and find the new shape.
3. Update the re-applied code to match -- do not just suppress the error.
4. Document the new required-field or type change in `docs/MAINTAINING-FORK.md`.

Common upstream interface changes and how they affect fork content:
- New required field on `ArmorItemDef` -> add it to all 3 armor items in
  `dragons_blight/items.ts`; document in MAINTAINING-FORK.md
- New required field on `MobTemplate` -> all mobs in `dragons_blight/mobs.ts`
- New required field on `ZoneDef` -> `dragons_blight/zones.ts`
- New required field on `DungeonDef` -> `dragons_blight/dungeons.ts`
- New required field on `NpcDef` -> `dragons_blight/npcs.ts`
- Renamed export in `dungeon_layout.ts` or `colliders.ts` -> update the import
  in the fork's re-applied hook in `dungeon.ts` / `colliders.ts`

**3b -- Functional diff review.** Even if TypeScript is happy, upstream may have
changed the LOGIC around a re-applied addition in a way that makes it incorrect.
Check the git diff for each upstream file this fork modifies:

```bash
git diff ORIG_HEAD..HEAD -- server/main.ts src/sim/data.ts src/sim/sim.ts \
  src/render/characters/manifest.ts src/render/dungeon.ts \
  src/sim/types.ts src/sim/dungeon_layout.ts src/sim/colliders.ts \
  src/ui/world_entity_i18n.ts src/ui/i18n.catalog/items.ts \
  src/ui/i18n.catalog/index.ts vite.config.ts
```

For each file, ask: did upstream change the function or block that the fork addition
hooks into? If yes, adapt the addition to fit the new upstream shape. The intent of
the fork addition stays; only the syntax or insertion point changes.

**3c -- Zone contiguity check.** If upstream added or extended a zone:

```bash
grep -n "zMin\|zMax" src/sim/content/zone*.ts src/sim/content/temple.ts 2>/dev/null
grep -n "zMin\|zMax" src/sim/content/custom/dragons_blight/zones.ts
```

Dragon's Blight must start exactly where the last upstream zone ends (`zMin: 900`).
If any upstream zone now has `zMax > 900`, the custom zone must shift northward.
See `docs/custom-content/zones.md` for the fix procedure.

### Step 4 -- upstream naming and brand drift

Upstream uses `worldofclaudecraft.com`, `World of ClaudeCraft` (and the un-capitalized
`World of Claudecraft` alternate-case variant), `Claudemoon`. The fork's REAL production
domain is `world.arcanehunters.com` (already live in `server/realm.ts` and
`src/ui/i18n.catalog/fork_brand.ts`), used directly (not the `TODO-your-domain.com`
placeholder) in files outside the build-time injection system (bot/, scripts/, tests/,
package.json, docs). Source files INSIDE the injection system (index.html, play.html,
guide.html, admin.html, public/ static pages, `src/main.ts`'s `SITE_URL`) correctly keep
the `TODO-your-domain.com` placeholder and get the real domain injected at build time --
do not hardcode `world.arcanehunters.com` into those. Brand name: `World of Arcane
Hunters` / `Eastbrook`. After any merge, run the FULL case-insensitive, whole-tree sweep,
not just the narrow curated file list below -- a 2026-07 audit found ~50 additional files
(mostly `server/*.ts`, `src/ui/i18n.locales/*.ts`, `src/guide/*.ts`, `play.html`/
`guide.html`, `bot/*.ts`, `scripts/*.mjs`, `README.md` + its 20 `docs/i18n/` mirrors) that
the original 2026-06 pass never covered:

```bash
grep -rliE "world[-_%20+]*of[-_%20+]*claudecraft|claudemoon|levy-street|GjhnUsBtw" \
  --include="*.ts" --include="*.html" --include="*.css" --include="*.txt" \
  --include="*.md" --include="*.json" --include="*.mjs" --include="*.yml" . \
  2>/dev/null | grep -v node_modules | grep -v "\.git/"
```

Exclude the known, deliberately-pending results before treating anything as a regression:
`public/*-logo.png` / `public/World-of-ClaudeCraft-Whitepaper-v1.0.pdf` (pending asset
replacement), `public/links.html`'s social-handle copy object + its own JSON-LD `sameAs`
array (pending real social accounts), any `@levystreet.com` email address (contact info is
intentionally not rebranded), `docs/hud-ux-and-accessibility/phase-*.md` (upstream-authored
historical dev-session notes, not current guidance), `TERMS_AND_CONDITIONS.md` /
`PRIVACY_POLICY.md` / `public/terms.html` / `public/privacy.html` (name a real NZ company
as the operating entity -- ask the site owner before touching, do not fix silently), the
mobile app's `com.worldofclaudecraft` bundle ID in `capacitor.config.ts` /
`android/app/build.gradle` / `ios/App/App.xcodeproj/project.pbxproj` (permanent once
published to a store -- ask before renaming), and this file's / `MAINTAINING-FORK.md`'s
own doc-prose references to `worldofclaudecraft.com` (describing upstream's domain for
grep-pattern purposes, not stale content). Everything else is a real leak -- re-apply from
the "Brand rename (2026-06)", "Brand rename scope audit (2026-07)", and "Brand rename scope
audit, part 2 (2026-07)" sections in `docs/MAINTAINING-FORK.md`; the latter two have the
full file lists and the exact case-sensitivity gotcha in `server/player_card.ts`'s
trusted-host map.

Also run the two narrower, faster health checks for the two files that regress most often
(a merge can revert these even when nothing else does, since they're small isolated diffs):

```bash
# vite.config.ts: brandTokenPlugin() must be in the plugins array, not just defined (expect 2+)
grep -c "brandTokenPlugin" vite.config.ts

# src/main.ts: SITE_URL must read the injected constant, never a hardcoded literal
grep -A1 "^declare const __SITE_URL__" src/main.ts
```

Also check for new upstream files that contain the upstream domain but were not in our
replacement map:

```bash
git diff origin/master..HEAD --name-only | xargs grep -l "worldofclaudecraft" 2>/dev/null
```

### Step 5 -- new upstream features that need custom adaptation

Review the upstream changelog or the git diff for new systems that may need fork-side
adjustments. Focus on:

1. **New HTML entry points** (new `.html` files): check for upstream brand strings and
   analytics IDs that need the `TODO-` placeholder treatment and marker comments.

2. **New static public/ files** (robots.txt siblings, new legal pages): if they contain
   the upstream domain, add them to `scripts/brand_inject.mjs` token replacement list.

3. **New analytics or tracking IDs**: wrap in `<!-- WOC:GA:START/END -->` or
   `<!-- WOC:META:START/END -->` markers so the build plugin can strip/inject them.

4. **New locale overlay format or new locale files**: if upstream added a new language
   overlay file, add the Dragon's Blight entity translation block to it (copy the
   pattern from an existing overlay like `nl_NL.ts`). Registered entity IDs are in
   `src/sim/content/custom/i18n_ids.ts`.

5. **New catalog domain files** (`src/ui/i18n.catalog/<domain>.ts`): if upstream added
   a new catalog file, it may include brand strings from the upstream project name;
   apply the brand replacement map.

6. **New upstream test assertions that hardcode world constants**: ARENA_X, DELVE_X_MIN,
   realm names, domains. Update them to match fork values.

7. **New dungeon interiors**: if upstream added a new `DungeonDef.interior` union member,
   verify the `CustomDungeonVariantId` union in `src/render/dungeon_custom.ts` does not
   conflict with the new member name.

8. **New CAMPS in upstream zones**: if upstream added new overworld camps, the main RNG
   stream shifts and all parity golden traces need regeneration:
   ```bash
   UPDATE_PARITY=1 npx vitest run tests/parity
   ```

### Step 6 -- i18n: restore custom entities and regenerate

If the merge touched any locale file or the catalog, verify Dragon's Blight custom
entity translations are intact in all 13 non-English overlays:

```bash
# Quick spot-check: each overlay must have at least one custom_ entity key
for f in src/ui/i18n.locales/*.ts; do
  count=$(grep -c "custom_" "$f" 2>/dev/null || echo 0)
  echo "$f: $count custom keys"
done
```

Each overlay should have approximately 52 keys (mobs, NPCs, quests, zone, dungeon,
items). If any overlay shows 0 or far fewer, re-add the block from the
`src/ui/world_entity_i18n.ts` section of `docs/MAINTAINING-FORK.md`.

If any locale or catalog file was changed (including by the merge), regenerate:

```bash
npm run i18n:gen && node scripts/i18n_resolved_hash.mjs --write
git add src/ui/i18n.resolved.generated/ src/ui/i18n.resolved.sha256 \
        src/ui/i18n.status.summary.json
```

Verify at release tier (pending=0 required):

```bash
I18N_RELEASE_TIER=1 npx vitest run tests/i18n_completeness.test.ts \
  tests/i18n_resolved_equivalence.test.ts
```

### Step 7 -- full test suite

```bash
npm test
```

Key tests to pay attention to:
- `tests/architecture.test.ts` -- sim purity; zero DOM/browser imports in sim/
- `tests/sim.test.ts` -- custom content IDs, basic sim health
- `tests/parity/` -- RNG golden traces; fails if upstream content shifted camp/mob order
- `tests/localization_fixes.test.ts` -- S3 i18n guard; new sim strings need a matcher
- `tests/armor_type_catalog.test.ts` -- all armor items have armorType
- `tests/item_level.test.ts` -- epic weapon stat budgets correct
- `tests/delves.test.ts` -- DELVE_X_MIN=5300 and rollFor(42)
- `tests/dungeons.test.ts` -- Dragon's Maw loot, Dragon's Blight NPCs
- `tests/localization_coverage.test.ts` -- the "no canonical fallbacks" and placeholder-marker
  checks; a new upstream locale with no translations yet is expected/fine (PR tier), but a
  brand-map sed that leaves a literal "TODO" inside already-translated prose (e.g.
  `seo.officialBody`) is a real PR-tier failure -- see "Brand rename scope audit (2026-07)"
  in `docs/MAINTAINING-FORK.md` for the exact fix pattern (remove the key for Latin locales,
  reword to drop the domain clause for non-Latin locales that had one).
- `tests/who_filter.test.ts`, `tests/server_i18n.test.ts`, `tests/email_templates.test.ts`,
  `tests/wallet_server.test.ts`, `tests/player_card_server.test.ts`,
  `tests/client_shell.test.ts`, `tests/guide.test.ts` -- hardcode expected brand/realm text
  or URLs as fixtures; update in the same change as any brand-map fix.

If parity tests fail after upstream content changes:
```bash
UPDATE_PARITY=1 npx vitest run tests/parity
npm test
```

If i18n equivalence tests fail after locale regeneration, make sure the generated
files are staged:
```bash
git add src/ui/i18n.resolved.generated/ src/ui/i18n.resolved.sha256
npm test
```

### Step 8 -- build pipeline and brand injection

```bash
npm run build
```

After a clean build, run the brand injection and verify no placeholder tokens remain:

```bash
VITE_SITE_URL=https://world.arcanehunters.com \
VITE_DISCORD_URL=https://discord.gg/TODO \
VITE_DONATE_URL=https://github.com/sponsors/TODO \
npm run brand:inject

grep -r "TODO-your-domain\|discord.gg/TODO\|sponsors/TODO" dist/ \
  --include="*.html" --include="*.txt" --include="*.xml"
# Expect: no output (all tokens replaced)
```

Also verify the GA/Meta Pixel blocks are stripped when env vars are unset:

```bash
grep -c "googletagmanager\|facebook.net" dist/index.html
# Expect: 0 (blocks stripped because VITE_GA_ID and VITE_META_PIXEL_ID were not set above)
```

### Step 9 -- update all documentation

If any fork-applied code was re-applied or adapted because upstream refactored the
surrounding code, update `docs/MAINTAINING-FORK.md`:

1. **Code snippet out of date?** Update the snippet to show the new surrounding context,
   the exact insertion point, and the re-apply instructions.

2. **New required interface field?** Add a section under the relevant per-zone file
   (e.g. `dragons_blight/items.ts`) documenting the field, its correct value for each
   custom content entry, and a verification command.

3. **Upstream refactored a function or moved a file?** Update the grep verification
   command in the matching MAINTAINING-FORK.md section, and update FORK.md Rule 4 and
   Rule 5 Step 2 if the health-check grep needs to change.

4. **New upstream feature adapted for the fork?** Add a full entry to
   `docs/MAINTAINING-FORK.md` under "Lives in git -- changes to upstream files" and a
   one-liner to the "Short list" section of `FORK.md`.

5. **FORK.md "This is a personal fork" section**: if the live deployment branch name
   changed, update it.

6. **`src/sim/content/custom/CLAUDE.md`**: if dungeon index rules changed (upstream
   used a previously custom-reserved slot), update the index table.

7. **`docs/custom-content/*.md` guides**: if any type interface changed (new required
   fields, renamed fields), update the field reference table and example in the relevant
   per-type guide.

8. **`docs/post-merge-prompt.md` (this file)**: if any of the above changes affected
   what future merges need to check, update this prompt so the next run reflects the
   new reality. Specifically:
   - A new fork-owned file -> add it to the Step 1 `ls` command.
   - A new upstream file modification -> add a grep line to Step 2.
   - A new interface field that will need re-checking -> add it to Step 4's "Common
     upstream interface changes" list.
   - A new brand token or new upstream placeholder URL -> add it to Step 5's grep
     and to the Step 6 guidance.
   - A new test that hardcodes a fork value -> add it to Step 8's key-tests list.
   - A new entry in the MAINTAINING-FORK.md short list -> add a row to the
     "Quick-reference: what this fork changes" table at the bottom of this file.
   - A new fork-owned file -> add a bullet to the "Quick-reference: fork-owned new
     files" list at the bottom of this file.
   This keeps the prompt self-maintaining: one merge cycle of work, and the next
   session starts with an accurate checklist.

### Step 10 -- commit and push

```bash
git add -p   # review and stage everything
git status   # confirm no unexpected files
git commit -m "chore(fork): post-merge maintenance after upstream sync"
git push -u origin <branch>
```

---

## Quick-reference: what this fork changes from upstream

| System | Where | What |
|---|---|---|
| Admin routing | `server/main.ts` | `ADMIN_HOSTNAME` env var + `/admin` path support |
| Custom content hook | `src/sim/data.ts` | CUSTOM_* imports + spreads (last in every table) |
| Custom visual hook | `src/render/characters/manifest.ts` | CUSTOM_VISUALS + CUSTOM_MOB_KEYS spreads |
| Dragon's Maw interior | `src/sim/types.ts` | `'dragons_maw'` added to DungeonDef.interior union |
| Dragon's Maw layout | `src/sim/dungeon_layout.ts` | DRAGONS_MAW_LAYOUT added |
| Dragon's Maw renderer | `src/render/dungeon.ts` | 7+ hook points delegating to `dungeon_custom.ts` |
| Dragon's Maw colliders | `src/sim/colliders.ts` | DRAGONS_MAW_COLLIDERS + entry in INTERIOR_COLLIDERS |
| Secondary camp RNG | `src/sim/sim.ts` | customRng (seed^0x464f524b) for CUSTOM_CAMPS mob init |
| Dungeon x-origin space | `src/sim/data.ts` | ARENA_X 4200->4700, DELVE_X_MIN 4800->5300 |
| Delves test pin | `tests/delves.test.ts` | DELVE_X_MIN assertion: 4800->5300 |
| Delve world test | `tests/map_window_view.test.ts` | makeDelveWorld x: 5000->5300 |
| Entity i18n | `src/ui/world_entity_i18n.ts` | CUSTOM_MOB/NPC/QUEST/ZONE/DUNGEON_IDS spreads |
| Item catalog i18n | `src/ui/i18n.catalog/items.ts` | CUSTOM_ITEM_ENTITY_IDS + CUSTOM_ITEM_EN_NAMES spreads |
| Fork brand constants | `src/ui/i18n.catalog/index.ts` | `import { FORK_BRAND } from './fork_brand'` |
| Brand URL injection | `vite.config.ts` | siteUrl/discordUrl/donateUrl env reads + define block + brandTokenPlugin |
| Brand static files | `scripts/build_sitemap.mjs` | ORIGIN reads VITE_SITE_URL |
| Brand JS constant | `src/main.ts` | `declare const __SITE_URL__` + template literals |
| Brand HUD display | `src/ui/hud.ts` | siteUrl reads `__SITE_URL__` |
| Docker brand args | `Dockerfile` | ARG VITE_SITE_URL/DISCORD_URL/DONATE_URL/GA_ID/META_PIXEL_ID |
| Deploy workflow | `.github/workflows/deploy.yml` | --build-arg for all 5 brand vars |
| GA/Meta Pixel control | `index.html`, `play.html`, `vite.config.ts` | WOC:GA/META markers + brandTokenPlugin strip/inject |
| Dev fullscreen skip | `src/main.ts` | `if (import.meta.env.DEV) return` in requestPreferredFullscreen |
| Ghost wolf test fix | `tests/threat.test.ts` | `const beforeHp = wolf.hp` restored before castAbility |
| Dungeon test fixes | `tests/dungeons.test.ts` | rollLoot unknown-cast + warden.loot! non-null |
| Realm name | `server/realm.ts` | DEFAULT_REALM_NAME = 'Eastbrook' |
| Snapshots test | `tests/snapshots.test.ts` | Claudemoon -> Eastbrook |
| Brand rename (extended, 2026-07) | ~15 `server/*.ts`, `src/ui/i18n.catalog/hud_chrome.ts`, all `src/ui/i18n.locales/*.ts`, `src/guide/*.ts`, `play.html`, `guide.html`, `public/press.html`, `public/llms.txt`, `public/merch.html` | brand/realm proper-noun swap; see "Brand rename scope audit (2026-07)" in MAINTAINING-FORK.md for the full list |
| Trusted-host case fix | `server/player_card.ts` | `TRUSTED_PUBLIC_HOST_ORIGINS` keys lowercased (matched against a lowercased Host header) |
| i18n coverage gate fix | `tests/localization_coverage.test.ts` | item-translation "no canonical fallback" check gated behind `RELEASE_TIER`, matching its own two-tier design comment |
| New locale seo copy | `src/ui/i18n.locales/{da_DK,id_ID,nl_NL,pl_PL,sv_SE,tr_TR,vi_VN,ko_KR}.ts` | `seo.officialBody` domain-prefix removed/reworded so it doesn't ship a literal "TODO" string |

## Quick-reference: fork-owned new files (never conflict with upstream)

- `src/sim/content/custom/` -- all Dragon's Blight custom game content
- `src/sim/content/custom/i18n_ids.ts` -- entity ID extension point for i18n
- `src/render/dungeon_custom.ts` -- Dragon's Maw dungeon rendering
- `src/render/characters/custom/` -- custom creature visual overrides
- `public/models/creatures/custom/` -- custom GLB model files
- `src/ui/i18n.catalog/fork_brand.ts` -- FORK_BRAND constants
- `scripts/brand_inject.mjs` -- post-build token replacement for static files
- `docs/SETUP-DIGITALOCEAN.md` -- DigitalOcean + Supabase deployment guide
- `docs/SETUP-LOCAL-MAC.md` -- local Mac dev guide
- `docs/SETUP-CLOUDFLARE.md` -- Cloudflare guide
- `docs/SETUP-LOCAL-SUPABASE.md` -- local Supabase guide
- `docs/CUSTOM-CONTENT.md` -- overview guide for custom content
- `docs/custom-content/` -- per-type authoring guides
- `docs/post-merge-prompt.md` -- this file
- `FORK.md` -- fork rules
