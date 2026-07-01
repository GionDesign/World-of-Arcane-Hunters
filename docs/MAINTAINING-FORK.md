# Maintaining Your Personal Fork

This document is your reference for keeping your deployment configuration safe when
pulling upstream updates. It lists exactly what lives in git vs. what lives outside
git, what this fork changed vs. the upstream, and how to pull updates safely.

---

## What is "yours" vs. "upstream"

### Lives entirely outside git (safe from any git pull)

These are your personal deployment assets. They live on the server or in external
services and git can never touch them.

| Asset | Where it lives | What it contains |
|---|---|---|
| `/opt/eastbrook/.env` on the Droplet | Droplet filesystem | `DATABASE_URL`, `REALM_NAME`, `PUBLIC_ORIGIN`, `ADMIN_HOSTNAME`, `TURNSTILE_SECRET`, and all other runtime secrets |
| `/etc/caddy/Caddyfile` on the Droplet | Droplet filesystem | Your domain names, TLS sites, `trusted_proxies` Cloudflare ranges |
| GitHub `production` environment secrets | GitHub repository settings | `DROPLET_IP`, `DROPLET_SSH_KEY`, `DO_REGISTRY_TOKEN`, `DO_REGISTRY_NAME`, `VITE_TURNSTILE_SITEKEY` |
| DNS records | Your registrar / Cloudflare | A records pointing your domains at the Droplet |
| Cloudflare dashboard settings | Cloudflare | SSL/TLS mode, Speed settings, Cache rules, Firewall rules |
| Supabase project | supabase.com | Postgres database, connection string |

None of these are tracked by git. A `git pull` or `git reset --hard` on the Droplet
will never touch them.

---

### Lives in git — new files (your exclusive ownership)

These files do not exist in the upstream project. The upstream community cannot
overwrite them; if upstream ever adds a file with the same name, git will flag a
conflict (not silently overwrite).

| File | What it is |
|---|---|
| `docs/SETUP-DIGITALOCEAN.md` | Complete DigitalOcean + Supabase deployment guide |
| `docs/SETUP-LOCAL-MAC.md` | Local Mac development setup guide (includes no-Docker/UTM VM path) |
| `docs/SETUP-CLOUDFLARE.md` | Cloudflare DNS, proxy, WAF, and Turnstile guide |
| `docs/MAINTAINING-FORK.md` | This file |
| `.env.local.example` | Minimal env template for no-Docker local dev (UTM VM, plain Linux, CI); complements `.env.example` which targets Docker Compose |
| `docs/CUSTOM-CONTENT.md` | Guide for adding custom game content via `src/sim/content/custom/` |
| `docs/SETUP-LOCAL-SUPABASE.md` | Local development guide with local/production Supabase switching |
| `FORK.md` | Fork rules — loaded by reference from `CLAUDE.md` |
| `src/sim/content/custom/index.ts` | Assembly barrel: imports from per-zone sub-modules and re-exports `CUSTOM_*` groups consumed by `data.ts` |
| `src/sim/content/custom/dragons_blight/items.ts` | Dragon's Blight items (quest drops, rewards, epics) |
| `src/sim/content/custom/dragons_blight/mobs.ts` | Dragon's Blight overworld mobs + dungeon mobs |
| `src/sim/content/custom/dragons_blight/npcs.ts` | Dragon's Blight NPCs |
| `src/sim/content/custom/dragons_blight/quests.ts` | Dragon's Blight quest chain + order |
| `src/sim/content/custom/dragons_blight/zones.ts` | Dragon's Blight ZoneDef |
| `src/sim/content/custom/dragons_blight/camps.ts` | Dragon's Blight mob spawn camps |
| `src/sim/content/custom/dragons_blight/props.ts` | Dragon's Blight props, objects, and roads |
| `src/sim/content/custom/dragons_blight/dungeons.ts` | Dragon's Maw dungeon definition |
| `src/sim/content/custom/i18n_ids.ts` | Fork-owned i18n extension point: exports ID arrays and English names imported by upstream `world_entity_i18n.ts` and `items.ts` |
| `src/sim/content/custom/CLAUDE.md` | Local authoring guide for the custom content directory (updated to describe per-zone structure) |
| `src/render/characters/custom/index.ts` | Custom creature visual overrides (CUSTOM_VISUALS + CUSTOM_MOB_KEYS) |
| `src/render/characters/custom/CLAUDE.md` | Local authoring guide for the custom visual directory |
| `public/models/creatures/custom/` | Fork-owned directory for custom GLB model files |
| `docs/custom-content/CREATURE-MODELS.md` | Step-by-step guide for overriding and adding creature models |

---

### Lives in git — changes to upstream files

These are the only upstream files this fork modified. They are the ones to check
after pulling a large upstream update.

#### `server/main.ts` — `ADMIN_HOSTNAME` feature

Two additions were made. Search for `ADMIN_HOSTNAME` to find them:

**Addition 1** — constant near the top of the file (after `MAX_WS_PER_IP_HARD`):
```typescript
// Custom hostname that triggers the admin dashboard shell. When unset the default
// pattern (any subdomain starting with "admin.") is used. Strip port so comparisons
// work whether Caddy forwards a bare host or host:port header.
const ADMIN_HOSTNAME = (process.env.ADMIN_HOSTNAME ?? '').toLowerCase().replace(/:\d+$/, '');
```

**Addition 2** — replacement of `isAdminRequest()`:
```typescript
// The admin dashboard is reached via:
//   1. A hostname match: ADMIN_HOSTNAME env var (exact match) when set, otherwise
//      any subdomain starting with "admin." (e.g. admin.world.example.com).
//   2. The /admin or /admin/ path on any domain — always works; useful for
//      single-domain setups (world.example.com/admin) and local dev.
// The hostname only picks which HTML shell is served (admin.html vs index.html);
// the admin API itself is gated by the is_admin account flag, not the hostname.
function isAdminRequest(req: http.IncomingMessage): boolean {
  const host = String(req.headers.host ?? '').toLowerCase().replace(/:\d+$/, '');
  const urlPath = (req.url ?? '/').split('?')[0];
  const adminByHost = ADMIN_HOSTNAME ? host === ADMIN_HOSTNAME : host.startsWith('admin.');
  return adminByHost || urlPath === '/admin' || urlPath === '/admin/';
}
```

The original upstream `isAdminRequest()` only checked `host.startsWith('admin.')` —
this fork extends it to also support an explicit hostname via env var and the `/admin`
path.

#### `.env.example` — `ADMIN_HOSTNAME` documentation

A commented block was added in the "Admin dashboard" section:
```bash
# ── Admin dashboard ───────────────────────────────────────────────────────────
# By default the admin shell is served on any hostname starting with "admin."
# (e.g. admin.world.yourdomain.com) or at the /admin path on any domain.
# Set this if your admin hostname does not follow the "admin.*" prefix pattern:
#   ADMIN_HOSTNAME=admin-world.example.com     ← fully custom hostname
#   ADMIN_HOSTNAME=admin.world.example.com     ← explicit instead of wildcard match
# Leave unset if you use the /admin path or an "admin.*" subdomain.
#ADMIN_HOSTNAME=
```

#### `README.md` — DigitalOcean section replaced with a pointer

The upstream "Deploying to DigitalOcean + Supabase" section (Steps 1–7, ~255 lines)
was replaced with a short pointer block so contributors cannot accidentally edit or
override the fork's detailed deployment guide. The replacement text is:

```markdown
## Deploying to DigitalOcean + Supabase

See **[docs/SETUP-DIGITALOCEAN.md](docs/SETUP-DIGITALOCEAN.md)** for the complete
step-by-step guide: Supabase project, DigitalOcean Container Registry, Droplet
provisioning, Caddy TLS, GitHub Actions CI/CD, admin dashboard, and all environment
variable reference.

If you are routing traffic through **Cloudflare**, read
**[docs/SETUP-CLOUDFLARE.md](docs/SETUP-CLOUDFLARE.md)** as well — it covers DNS,
SSL/TLS mode, Caddy `trusted_proxies` configuration, WAF, and Turnstile integration.
```

If upstream ever adds new content to the DigitalOcean section, check whether anything
new in `README.md` belongs in `docs/SETUP-DIGITALOCEAN.md` instead, then keep the pointer.

---

#### `DEPLOY.md` — two additions

1. A third cross-reference link was added to the "Looking for a different deployment
   target?" block at the top, pointing to `docs/SETUP-CLOUDFLARE.md`.
2. A Cloudflare callout was added inside the "Rate limiting and trusted proxy IPs"
   section, explaining that `TRUSTED_PROXY_IPS` should not be used when Cloudflare
   proxy + Caddy `trusted_proxies` is in use.

#### `src/render/characters/manifest.ts` -- custom visual hook

Three additions wire `src/render/characters/custom/index.ts` into the upstream
visual dispatch. Search for `CUSTOM_VISUALS` to find all three.

**Import line added** (after the existing imports, before the first `export`):
```typescript
// Fork custom visuals -- never touched by upstream merges (see MAINTAINING-FORK.md).
import { CUSTOM_MOB_KEYS, CUSTOM_VISUALS } from './custom';
```

**Spread added inside `VISUALS`** (last entry before the closing `};` of the VISUALS record):
```typescript
  // Fork custom visuals (entries here shadow any upstream key with the same name).
  ...CUSTOM_VISUALS,
};
```

**Spread added inside `MOB_KEYS`** (last entry before the closing `};` of the MOB_KEYS record):
```typescript
  // Fork custom mob-key overrides (entries here win over any upstream mapping).
  ...CUSTOM_MOB_KEYS,
};
```

To verify all three are present after a merge:
```bash
grep -n "CUSTOM_MOB_KEYS\|CUSTOM_VISUALS" src/render/characters/manifest.ts
# Expect exactly 3 hits: the import line + the two spreads
```

---

#### `src/sim/data.ts` — custom content hook

An import block and merge additions were added to connect `src/sim/content/custom/`
to the engine. This is the only upstream sim file modified by this fork.

**Import block added** (after the `temple` import, before `mergeItems`):
```typescript
// Fork-exclusive custom content (src/sim/content/custom/index.ts). This import
// and the merges below are the only fork additions to this upstream file.
import {
  CUSTOM_CAMPS, CUSTOM_DUNGEON_DEFS, CUSTOM_DUNGEON_MOBS, CUSTOM_ITEMS, CUSTOM_MOBS,
  CUSTOM_NPCS, CUSTOM_OBJECTS, CUSTOM_PROPS, CUSTOM_QUEST_ORDER, CUSTOM_QUESTS,
  CUSTOM_ROADS, CUSTOM_ZONES,
} from './content/custom';
```

**Merge additions** (each line shows the upstream original and the fork addition):
```typescript
// ITEMS (append CUSTOM_ITEMS):
export const ITEMS = mergeItems(BASE_ITEMS, ZONE2_ITEMS, ZONE3_ITEMS, TEMPLE_ITEMS, CUSTOM_ITEMS);

// MOBS (append CUSTOM_MOBS + CUSTOM_DUNGEON_MOBS):
export const MOBS = { ...ZONE1_MOBS, .../* upstream */, ...CUSTOM_MOBS, ...CUSTOM_DUNGEON_MOBS };

// NPCS (append CUSTOM_NPCS):
export const NPCS = { ...ZONE1_NPCS, .../* upstream */, ...CUSTOM_NPCS };

// QUESTS (append CUSTOM_QUESTS):
export const QUESTS = { ...ZONE1_QUESTS, .../* upstream */, ...CUSTOM_QUESTS };

// QUEST_ORDER (append CUSTOM_QUEST_ORDER):
export const QUEST_ORDER = [...ZONE1_QUEST_ORDER, .../* upstream */, ...CUSTOM_QUEST_ORDER];

// CAMPS (append CUSTOM_CAMPS LAST -- determinism):
export const CAMPS = [...ZONE1_CAMPS, .../* upstream */, ...CUSTOM_CAMPS];

// GROUND_OBJECTS (append CUSTOM_OBJECTS):
export const GROUND_OBJECTS = [...ZONE1_OBJECTS, .../* upstream */, ...CUSTOM_OBJECTS];

// ROADS (append CUSTOM_ROADS):
export const ROADS = [...ZONE1_ROADS, .../* upstream */, ...CUSTOM_ROADS];

// PROPS (add CUSTOM_PROPS to mergeProps call):
export const PROPS = mergeProps([ZONE1_PROPS, .../* upstream */, CUSTOM_PROPS]);

// ZONES (spread CUSTOM_ZONES):
export const ZONES = [ZONE1_ZONE, ZONE2_ZONE, ZONE3_ZONE, ...CUSTOM_ZONES];

// DUNGEONS (spread CUSTOM_DUNGEON_DEFS):
export const DUNGEONS = { ...DUNGEON_DEFS, ...TEMPLE_DUNGEON_DEFS, ...CUSTOM_DUNGEON_DEFS };
```

If lost in a merge: search `data.ts` for each export and append the `CUSTOM_*`
spread. Always append LAST (especially `CUSTOM_CAMPS`) to preserve determinism.

#### `CLAUDE.md` — fork pointer

The "Fork rules" section in CLAUDE.md was changed from a verbose rule block to a
short pointer directing Claude to read `FORK.md` first. If upstream ever edits
`CLAUDE.md` and removes that pointer section, re-add this single paragraph:

```markdown
## Fork rules (read FORK.md first)
This is a personal deployment fork. **Before making any changes, read `FORK.md`
in the repository root.** It defines the fork maintenance rules, the custom content
pattern (`src/sim/content/custom/`), the upstream sync workflow, and the list of
upstream files this fork has modified. Those rules take precedence over the generic
guidance below. `docs/MAINTAINING-FORK.md` has the full record of every change made
to upstream files, with exact code snippets for re-applying after a bad merge.
```

---

#### Brand rename (2026-06) -- "World of ClaudeCraft" to "World of Arcane Hunters"

This is a large-surface, mostly mechanical change. The replacement map is:

| Old value | New value | Notes |
|---|---|---|
| `World of ClaudeCraft` | `World of Arcane Hunters` | Game name |
| `World of Claudecraft` | `World of Arcane Hunters` | Alternate-case variant in JSON-LD |
| `ClaudeCraft` | `WoAH` | Short name (PWA, apple-mobile-web-app-title) |
| `Claudemoon` | `Eastbrook` | Realm name |
| `worldofclaudecraft.com` | `TODO-your-domain.com` | Domain (placeholder until real domain is set) |
| `https://github.com/levy-street/world-of-claudecraft` | `https://github.com/giondesign/world-of-arcane-hunters` | GitHub repo |
| `https://discord.gg/GjhnUsBtw` | `https://discord.gg/TODO` | Discord (placeholder) |
| `https://github.com/sponsors/levy-street` | `https://github.com/sponsors/TODO` | Donate URL (placeholder) |

**New fork-owned file:** `src/ui/i18n.catalog/fork_brand.ts` -- FORK_BRAND constants object.
Import it in `src/ui/i18n.catalog/index.ts` (already done; see that file).

**Files changed by category:**

*Catalog / i18n (upstream files):*
- `src/ui/i18n.catalog/index.ts` -- imports FORK_BRAND; 7 English string values use FORK_BRAND constants
- `src/ui/i18n.catalog/guide.ts` -- brand, brandShort, footer.rights, home.title, worldPage.intro
- `src/ui/i18n.catalog/shell.ts` -- seo.*, a11y.github/discord/donate, mobilePreflight.*Open step, serverUnavailable.*

*Locale overlays (all 13 `src/ui/i18n.locales/*.ts`):*
All overlays were bulk-updated with the replacement map above. Key detail: `seo.officialBody`
entries containing the old domain were removed from Latin locales (they fall back to the English
catalog which has no domain in the sentence). For non-Latin locales (ja_JP, ko_KR, ru_RU, zh_CN,
zh_TW) the `seo.officialBody` key was kept without the domain prefix (required by
`tests/i18n_completeness.test.ts` which checks non-Latin locales do not leak English).

After any merge that touches locale files, run: `npm run i18n:gen && npm run i18n:hash -- --write`
and `npm test` to verify the i18n gates pass.

*Server:*
- `server/realm.ts` -- `DEFAULT_REALM_NAME = 'Eastbrook'`; `TRUSTED_PUBLIC_HOST_ORIGINS` updated
  to `TODO-your-domain.com`. Add a TODO comment: update to your production domain when known.

*Static HTML entry points:*
- `index.html` -- apple-mobile-web-app-title, canonical, hreflang, og:site_name, og:*, JSON-LD
  (name, alternateName removed, sameAs reduced to fork GitHub only), social handles removed
- `play.html` -- canonical, hreflang, og:*, JSON-LD (alternateName removed, sameAs fork only)
- `admin.html` -- title/og:title `World of Arcane Hunters - Admin`
- `guide.html` -- canonical, hreflang, og:*, JSON-LD

*Public HTML pages:*
- `public/server-unavailable.html` -- brand name + realm name in all 14 inline locale blocks
- `public/links.html` -- brand name, domain, GitHub URL in all 14 locale blocks
- `public/support.html`, `public/terms.html`, `public/privacy.html`, `public/data-deletion.html`,
  `public/merch.html` -- brand name, domain, GitHub URL (email + Discord contact info not changed)
- `public/sitemap.xml` -- all `<loc>` URLs
- `public/robots.txt` -- Sitemap: directives

*TypeScript source:*
- `src/main.ts` -- `SITE_URL` constant; `updateSeoMetadata()` sameAs array (reduced to fork GitHub
  only, social handles removed); JSON-LD `name` fields; `alternateName` fields removed

*Generated artifacts (do NOT hand-edit -- regenerate):*
- `src/ui/i18n.resolved.generated/` -- re-run `npm run i18n:gen`
- `src/ui/i18n.status.summary.json` -- regenerated by `npm run i18n:scan`
- `src/ui/i18n.resolved.sha256` -- re-baseline with `npm run i18n:hash -- --write`
- `src/admin/i18n.resolved.generated/` -- re-run `npm run i18n:admin`

*Test files updated to match new values:*
- `tests/snapshots.test.ts` -- Claudemoon -> Eastbrook
- `tests/social_system.test.ts` -- Claudemoon -> Eastbrook
- `tests/realm_public_origin.test.ts` -- domain
- `tests/homepage_foundation.test.ts` -- brand name + domain
- `tests/guide.test.ts` -- domain
- `tests/client_shell.test.ts` -- domain, og:site_name, GitHub URL, robots.txt, sitemap

**To re-apply after a bad merge:** re-run the bulk replacements from the map above,
re-run `npm run i18n:gen && npm run i18n:hash -- --write`, then `npm test`.
The tests will catch any missed replacements.

**TODOs for this fork (pending user input):**

The client bundle (HTML, JS) is handled automatically at build time via the variable substitution
system (see FORK.md "Build-time brand URL injection"). You only need to set GitHub Actions
repository variables -- no source edits required for these:
- Set `VITE_SITE_URL` GitHub Actions repo variable (Settings > Secrets and variables > Actions >
  Variables) to your production domain (e.g. `https://mysite.com`).
- Set `VITE_DISCORD_URL` repo variable to your Discord invite URL, or leave empty if none.
- Set `VITE_DONATE_URL` repo variable to your donate URL, or leave empty if none.

These still require manual source edits (server or i18n scripts, not Vite-bundled):
- `server/realm.ts` `TRUSTED_PUBLIC_HOST_ORIGINS`: add your real domain (the `PUBLIC_ORIGIN`
  server runtime env var is the primary setting; the `TRUSTED_PUBLIC_HOST_ORIGINS` list is
  a secondary allowlist for multi-realm setups).
- `src/ui/i18n.catalog/fork_brand.ts` `siteUrl`/`discordUrl`/`donateUrl`: update these
  display-only constants if you want them to show the real values in places that don't use
  Vite defines (currently unused in runtime code; purely documentary).

Other pending items:
- Replace logo images: `public/worldofclaudecraft-logo.png`, `public/woc_logo_square.webp`,
  `public/woc-logo-hero.webp`, favicon files
- Update social handles in `public/links.html` copy object (X/Twitter, Instagram, TikTok,
  YouTube, Reddit)

---

#### Analytics ID injection (2026-06) -- third-party tracking control

Replaces hard-coded upstream analytics IDs with `TODO-` placeholder tokens and adds
`<!-- WOC:GA:START/END -->` / `<!-- WOC:META:START/END -->` marker comments around
each block. `brandTokenPlugin` in `vite.config.ts` strips the block when the
corresponding env var is unset, or injects the real ID when it is set.

**Upstream files modified:**

`index.html` -- GA script block (lines 149-161) wrapped in `<!-- WOC:GA:START/END -->`
markers; `G-BR5Z7GT7C2` replaced with `TODO-ga-measurement-id`. Meta Pixel block
(lines 162-170) wrapped in `<!-- WOC:META:START/END -->` markers; `1692101265042180`
replaced with `TODO-meta-pixel-id`. Noscript pixel in `<body>` also wrapped in
`<!-- WOC:META:START/END -->` markers with the same placeholder.

`play.html` -- GA script block wrapped in `<!-- WOC:GA:START/END -->` markers;
`G-BR5Z7GT7C2` replaced with `TODO-ga-measurement-id`.

`vite.config.ts` -- added `gaId`/`metaPixelId` env reads and extended
`brandTokenPlugin.transformIndexHtml` with block-strip/inject logic for both markers.
Re-apply snippet for the env reads (after the `donateUrl` line):
```typescript
const gaId = env(['VITE_GA_ID']) ?? '';
const metaPixelId = env(['VITE_META_PIXEL_ID']) ?? '';
```
Re-apply snippet for the plugin logic (inside `transformIndexHtml`, after brand URL replacements):
```typescript
if (gaId) {
  result = result
    .replace(/<!-- WOC:GA:START -->\n?/g, '')
    .replace(/<!-- WOC:GA:END -->\n?/g, '')
    .replaceAll('TODO-ga-measurement-id', gaId);
} else {
  result = result.replace(/<!-- WOC:GA:START -->[\s\S]*?<!-- WOC:GA:END -->\n?/g, '');
}
if (metaPixelId) {
  result = result
    .replace(/<!-- WOC:META:START -->/g, '')
    .replace(/<!-- WOC:META:END -->/g, '')
    .replaceAll('TODO-meta-pixel-id', metaPixelId);
} else {
  result = result.replace(/<!-- WOC:META:START -->[\s\S]*?<!-- WOC:META:END -->/g, '');
}
```

`Dockerfile` -- added `ARG VITE_GA_ID=""` and `ARG VITE_META_PIXEL_ID=""` and passes
them to the `npm run build` env block.

`.github/workflows/deploy.yml` -- added `--build-arg VITE_GA_ID` and
`--build-arg VITE_META_PIXEL_ID` to the docker build step. Documents them as optional
repo variables in the header comment.

`.env.example` -- added documentation block for `VITE_GA_ID` and `VITE_META_PIXEL_ID`.

**If upstream changes the GA or Meta Pixel block structure:** Re-apply the placeholder
tokens and marker comments to the new block shape, then verify `brandTokenPlugin` still
strips/injects correctly by running `npm run build` without the env vars set and checking
that `dist/index.html` contains no `googletagmanager` or `facebook.net` references.

---

#### Build-time brand URL injection (2026-06) -- variable substitution system

Added to prevent upstream file changes from breaking the domain/Discord/donate
configurations. Source files keep `TODO-your-domain.com` / `https://discord.gg/TODO` /
`https://github.com/sponsors/TODO` as placeholder tokens. At deploy time, three
environment variables replace them in the build output. No source edits are needed.

**New fork-owned file:** `scripts/brand_inject.mjs` -- post-build token patcher for
`dist/` static files (robots.txt, sitemap.xml, legal pages).

**Upstream files modified:**

`vite.config.ts` -- added `siteUrl`/`discordUrl`/`donateUrl` env reads, `__SITE_URL__`/
`__DISCORD_URL__`/`__DONATE_URL__` in the `define` block, and `brandTokenPlugin()` in the
plugins list. If a merge drops these, re-add after the `appBuildId` block:
```typescript
const siteUrl = (env(['VITE_SITE_URL']) ?? 'https://TODO-your-domain.com').replace(/\/$/, '');
const discordUrl = env(['VITE_DISCORD_URL']) ?? 'https://discord.gg/TODO';
const donateUrl = env(['VITE_DONATE_URL']) ?? 'https://github.com/sponsors/TODO';
```
And the plugin:
```typescript
function brandTokenPlugin() {
  const siteDomain = siteUrl.replace(/^https?:\/\//, '');
  return {
    name: 'woc-brand-token',
    apply: 'build' as const,
    transformIndexHtml(html: string): string {
      return html
        .replaceAll('https://TODO-your-domain.com', siteUrl)
        .replaceAll('TODO-your-domain.com', siteDomain)
        .replaceAll('https://discord.gg/TODO', discordUrl)
        .replaceAll('https://github.com/sponsors/TODO', donateUrl);
    },
  };
}
```
Add `brandTokenPlugin()` to the `plugins` array and `__SITE_URL__`/`__DISCORD_URL__`/
`__DONATE_URL__` to the `define` block.

`scripts/build_sitemap.mjs` -- changed `const ORIGIN = 'https://worldofclaudecraft.com'` to:
```javascript
const ORIGIN = (process.env.VITE_SITE_URL ?? 'https://TODO-your-domain.com').replace(/\/$/, '');
```

`src/main.ts` -- replaced `const SITE_URL = 'https://TODO-your-domain.com/';` with:
```typescript
declare const __SITE_URL__: string;
const SITE_URL = __SITE_URL__.replace(/\/?$/, '/');
```
And replaced all hardcoded `'https://TODO-your-domain.com/...'` strings in the JSON-LD
builder with template literals using `SITE_URL` (e.g. `\`${SITE_URL}#website\``).

`src/ui/hud.ts` -- added `declare const __SITE_URL__: string;` after the imports and
changed `siteUrl: 'worldofclaudecraft.com'` (player card footer display) to:
```typescript
siteUrl: __SITE_URL__.replace(/^https?:\/\//, '').replace(/\/$/, ''),
```

`Dockerfile` -- added `ARG VITE_SITE_URL="https://TODO-your-domain.com"`,
`ARG VITE_DISCORD_URL="https://discord.gg/TODO"`, `ARG VITE_DONATE_URL=...`, and
passes them as env vars to `npm run build`; also runs `npm run brand:inject` post-build.

`.github/workflows/deploy.yml` -- added `--build-arg VITE_SITE_URL`, `VITE_DISCORD_URL`,
`VITE_DONATE_URL` to the docker build step (reads from GitHub Actions repo variables).

`.env.example` -- added documentation block for `VITE_SITE_URL`, `VITE_DISCORD_URL`,
`VITE_DONATE_URL`.

**If upstream changes the placeholder domain:** The upstream project uses
`worldofclaudecraft.com`. Our fork uses `TODO-your-domain.com` as the placeholder. If
upstream adds NEW files containing `worldofclaudecraft.com`, those will NOT be patched by
`brand_inject.mjs` (which only replaces `TODO-your-domain.com`). After a merge, search for
`worldofclaudecraft.com` in the merged result and update as needed.

---

#### `src/ui/world_entity_i18n.ts` -- Dragon's Blight entity IDs

Dragon's Blight entity IDs are imported from `src/sim/content/custom/i18n_ids.ts`
via spread operators so upstream merges to this upstream file never wipe the fork's
entries. The upstream file now imports five named constants and spreads them:

```typescript
import {
  CUSTOM_DUNGEON_IDS,
  CUSTOM_MOB_IDS,
  CUSTOM_NPC_IDS,
  CUSTOM_QUEST_IDS,
  CUSTOM_ZONE_IDS,
} from '../sim/content/custom/i18n_ids';

const MOB_IDS = [
  .../* upstream mob IDs */,
  // Dragon's Blight custom zone mobs (imported from src/sim/content/custom/i18n_ids.ts)
  ...CUSTOM_MOB_IDS,
] as const;
// Same pattern for NPC_IDS, QUEST_IDS, ZONE_IDS, DUNGEON_IDS.
```

If the import block or the five `...CUSTOM_*_IDS` spreads are lost in a merge,
restore the import statement at the top of `src/ui/world_entity_i18n.ts` and
the five spread entries at the end of each respective array. All actual IDs live
in `src/sim/content/custom/i18n_ids.ts` (a fork-owned file).

To verify the spreads survived a merge:
```bash
grep -c "CUSTOM_" src/ui/world_entity_i18n.ts
# Expect: 10 (1 import line with 5 names + 5 spread usages)
```

Each of the 13 non-English `src/ui/i18n.locales/<lang>.ts` overlay files also has
the matching 52 translation keys (`entities.mobs.custom_*.name`,
`entities.npcs.custom_*.*`, `entities.quests.custom_*.*`,
`entities.zones.custom_*.name`, `entities.dungeons.custom_*.name`). Note: es_ES and
fr_CA inherit the 3 new overworld mob name keys (custom_skullfire_brute,
custom_blightshroud_stalker, custom_ironpelt_monkroose) from their base locales (es
and fr_FR respectively) rather than carrying explicit entries -- the dialect-resolution
test requires any explicit dialect key to diverge from its base. These overlay
files are fork-owned (no upstream equivalent), so they can never conflict -- but
they DO need to be re-populated if they are accidentally deleted or if upstream
renames the overlay file format. After any mass deletion or format change, re-add
the keys from `src/sim/content/custom/i18n_ids.ts` IDs and regenerate:
```bash
npm run i18n:gen && node scripts/i18n_resolved_hash.mjs --write
I18N_RELEASE_TIER=1 npm test
```

---

#### `src/ui/i18n.catalog/items.ts` -- Dragon's Blight item catalog entries

Dragon's Blight item IDs and English names are imported from
`src/sim/content/custom/i18n_ids.ts` via spreads so upstream merges to this file
never wipe the fork's entries. The upstream file now imports two constants:

```typescript
import {
  CUSTOM_ITEM_ENTITY_IDS,
  CUSTOM_ITEM_EN_NAMES,
} from '../../sim/content/custom/i18n_ids';

const ITEM_ENTITY_IDS = [
  .../* upstream item IDs */,
  // Dragon's Blight custom items (imported from src/sim/content/custom/i18n_ids.ts)
  ...CUSTOM_ITEM_ENTITY_IDS,
] as const;

// In itemNamesEn entities.items block:
items: itemTranslations([
  .../* upstream English names */,
  // Dragon's Blight custom item names (imported from src/sim/content/custom/i18n_ids.ts)
  ...CUSTOM_ITEM_EN_NAMES,
]),
```

All 9 custom item IDs and their English names live in `src/sim/content/custom/i18n_ids.ts`.
The 9 items are:
```
custom_drake_scale, custom_wyvern_heartstone, custom_blight_ember,
custom_drakebone_shoulders, custom_scorchwing_cowl, custom_blight_stalkers_hood,
custom_ignaraxis_greatblade, custom_cinderstave_eternal, custom_fang_of_ignaraxis
```

If the import block or the two `...CUSTOM_ITEM_*` spreads are lost in a merge,
restore the import at the top of `src/ui/i18n.catalog/items.ts` and the two spread
entries at the end of `ITEM_ENTITY_IDS` and the `itemNamesEn` positional array.

The per-locale positional name arrays inside `items.ts` (es, fr_FR, de_DE, it_IT,
pt_BR) have the 9 Dragon's Blight item names appended at the end. These are
fork-specific additions appended to the end of each per-locale array; an upstream
merge that adds items between existing upstream items will not conflict with them.

To verify the spreads survived a merge:
```bash
grep -c "CUSTOM_" src/ui/i18n.catalog/items.ts
# Expect: 4 (1 import line + 1 CUSTOM_ITEM_ENTITY_IDS spread + 1 CUSTOM_ITEM_EN_NAMES spread + blank)
```

After re-applying, regenerate artifacts:
```bash
npm run i18n:gen && node scripts/i18n_resolved_hash.mjs --write
```

---

#### `tests/delves.test.ts` -- RNG seed index (restored to upstream value)

Dragon's Blight's 9 CUSTOM_CAMPS originally shifted the main world-gen RNG stream
(causing 185 extra draws) and required this test to use `rollFor(48)` instead of
the upstream `rollFor(42)`. After the secondary RNG fix in `src/sim/sim.ts`
(see section below), CUSTOM_CAMPS use an isolated RNG, so the main stream is no
longer shifted and the test uses the upstream value:

```typescript
expect(rollFor(42)).toBe(true)  // upstream value, no fork change needed
```

If a future upstream pull adds more camps and this test fails, run:
```bash
# 1. Regenerate parity golden traces:
UPDATE_PARITY=1 npx vitest run tests/parity

# 2. Run delves in isolation to see the failure message:
npx vitest run tests/delves.test.ts

# 3. The failure message shows the actual seed index that returned true.
#    Update the test assertion to that new index.
```

To verify the delves test uses the UPSTREAM value (not a fork override):
```bash
grep -n "rollFor" tests/delves.test.ts
# Expect: rollFor(42) -- if it shows a different number, the main RNG was shifted
```

---

#### `src/sim/sim.ts` -- secondary RNG for CUSTOM_CAMPS mob initialization

Dragon's Blight adds 9 CUSTOM_CAMPS with 37 total mobs. Each mob's spawn position
draws 5 values from the world-gen RNG (`ang`, `r`, `level`, `facing`, `wanderTimer`),
totalling 185 extra draws that shift ALL downstream RNG state including spell hit
rolls. This caused 6 upstream test failures (pvp_safety and sim.test.ts).

The fix: a secondary `Rng` instance (seeded `cfg.seed ^ 0x464f524b`) is used for
CUSTOM_CAMPS mob initialization so they do not draw from the main `this.rng` stream.
CUSTOM_CAMPS remain in the global `CAMPS` array (required for world.ts terrain
flattening and decoration avoidance); only the mob-initialization loop is isolated.

**Fork change in the camp initialization block** (near line 998):
```typescript
import { CUSTOM_CAMPS } from './content/custom';  // added at top of imports

// In the constructor, replacing the original `for (const camp of CAMPS)` loop:
const customCampSet = new Set(CUSTOM_CAMPS);
const customRng = new Rng(this.cfg.seed ^ 0x464f524b);
for (const camp of CAMPS) {
  const template = MOBS[camp.mobId];
  const minHeight = this.mobCanSpawnInWater(template) ? WATER_LEVEL - 0.5 : WATER_LEVEL + 0.4;
  const rng = customCampSet.has(camp) ? customRng : this.rng;
  for (let i = 0; i < camp.count; i++) {
    const ang = rng.range(0, Math.PI * 2);
    const r = Math.sqrt(rng.next()) * camp.radius;
    // ... (uses rng for level, facing, wanderTimer)
  }
}
```

If this change is lost in a merge (e.g. upstream rewrites the camp init block):
1. Search for `// Mobs from camps` in `src/sim/sim.ts`
2. Re-add the `import { CUSTOM_CAMPS }` at the top and rebuild the loop using the
   pattern above (one `const customRng = new Rng(this.cfg.seed ^ 0x464f524b)` before
   the loop, and `const rng = customCampSet.has(camp) ? customRng : this.rng` inside)

To verify the change survived:
```bash
grep -n "customRng\|customCampSet\|CUSTOM_CAMPS" src/sim/sim.ts
# Expect: 3+ hits (import, set creation, rng selection)
```

---

#### `tests/threat.test.ts` -- ghost wolf cancellation test (projectile-loop fix)

The "Ghost Wolf drops before casting shaman spells from the same button press" test
verifies that casting flame_shock while in ghost wolf form drops the form. Upstream
v0.16.0 rewrote the test to make flame_shock reliable: the player is set to `gm = true`
(invulnerable, so the wolf cannot kill them), the wolf's `moveSpeed = 0` (rooted, so
it cannot escape), and a projectile loop waits up to 20 ticks for the bolt to land.
This is now upstream behaviour, not a fork change.

During the v0.16.0 merge the `const beforeHp = wolf.hp;` variable declaration was
accidentally dropped, causing a `ReferenceError: beforeHp is not defined` at runtime.

**Fork fix** -- restored the missing `beforeHp` declaration before the cast:
```typescript
sim.player.gcdRemaining = 0;
const beforeHp = wolf.hp;   // must be declared before castAbility
sim.castAbility('flame_shock');
expect(sim.player.auras.some((a) => a.id === 'ghost_wolf')).toBe(false);
// Flame Shock is a projectile: damage lands when the bolt reaches the wolf.
for (let i = 0; i < 20 && wolf.hp >= beforeHp; i++) sim.tick();
expect(wolf.hp).toBeLessThan(beforeHp);
```

If this is lost in a future merge, look for the flame_shock cast in the ghost wolf
block and ensure `const beforeHp = wolf.hp;` appears immediately before `castAbility`.

---

#### `tests/dungeons.test.ts` -- TypeScript access fixes for rollLoot and loot field

The upstream dungeon test exercises `rollLoot` (a private method on `Sim`) and reads
`warden.loot.copper`. Two TypeScript strict-mode errors required fork fixes:

**Fix 1** -- `rollLoot` is declared `private` in `Sim`, so `(sim as AnySim).rollLoot`
does not bypass the visibility check. The fix casts through `unknown` to an explicit
inline type:

```typescript
// Old (TS2341 -- 'rollLoot' is private):
(sim as AnySim).rollLoot(warden, meta, [meta]);

// New (bypasses private visibility via unknown intermediary):
(sim as unknown as { rollLoot: (m: unknown, meta: unknown, eligible: unknown[]) => void })
  .rollLoot(warden, meta, [meta]);
```

This pattern appears twice in the file: once for the dragonclaw warden loot test (line ~257)
and once inside the ignaraxis loot loop (line ~285).

**Fix 2** -- `warden.loot` is typed `LootBag | null`. TypeScript does not narrow through
Vitest's `expect(...).not.toBeNull()`. The fix adds a non-null assertion on the next line:

```typescript
// Old (TS18047 -- 'warden.loot' is possibly 'null'):
expect(warden.loot.copper).toBeGreaterThan(0);

// New:
expect(warden.loot!.copper).toBeGreaterThan(0);
```

**Verification:**
```bash
grep -n "rollLoot\|warden\.loot!" tests/dungeons.test.ts
# Expect: two rollLoot lines with the unknown-cast pattern and warden.loot! with the assertion
```

If upstream refactors `rollLoot` to be public or changes `loot` to non-nullable, these
workarounds can be removed.

---

#### `src/main.ts` -- skip auto-fullscreen in local dev

`requestPreferredFullscreen()` was extended with an early return when Vite's dev
mode is active (`import.meta.env.DEV`). This prevents the browser from
auto-entering fullscreen during `npm run dev`, making local iteration easier.
Players can still toggle fullscreen via the options menu.

**Code change** (inside `requestPreferredFullscreen`, after the `if (NATIVE_APP) return;` guard):

```typescript
// Before:
function requestPreferredFullscreen(): void {
  if (NATIVE_APP) return;
  if (useTouchInterface()) {
    requestMobileFullscreenLandscape();
    return;
  }
  if (new Settings().get('fullscreen') >= 0.5) requestBrowserFullscreen();
}

// After:
function requestPreferredFullscreen(): void {
  if (NATIVE_APP) return;
  // Skip auto-fullscreen in local dev (npm run dev) so the window stays at its
  // current size. Players can still enable fullscreen via the options menu.
  if (import.meta.env.DEV) return;
  if (useTouchInterface()) {
    requestMobileFullscreenLandscape();
    return;
  }
  if (new Settings().get('fullscreen') >= 0.5) requestBrowserFullscreen();
}
```

**Verification:**
```bash
grep -n "import.meta.env.DEV" src/main.ts
# Expect: at least 2 hits -- one in requestPreferredFullscreen and one for devCommands
grep -A5 "function requestPreferredFullscreen" src/main.ts
# Expect: NATIVE_APP guard, then import.meta.env.DEV guard, then touch/fullscreen logic
```

If this is lost in a merge, the window auto-enters fullscreen on `npm run dev`.
Re-add the two-line comment+guard after the `if (NATIVE_APP) return;` line.

---

#### `src/sim/types.ts` -- Dragon's Maw interior type added to DungeonDef union

The `DungeonDef.interior` field is a TypeScript literal union. Adding a new interior
string requires extending this union or `tsc` rejects the custom dungeon definition.

**Code change** (line with `interior:` inside `DungeonDef`):
```typescript
// Before:
interior: 'crypt' | 'sanctum' | 'temple' | 'nythraxis';
// After:
interior: 'crypt' | 'sanctum' | 'temple' | 'nythraxis' | 'dragons_maw';
```

**Verification:** `grep "interior:.*dragons_maw" src/sim/types.ts` should return 1 hit.

If this is lost in a merge, `tsc --noEmit` will report TS2322 on `index.ts` for the
`'dragons_maw'` string. Re-add the union member to fix it.

---

#### `src/sim/dungeon_layout.ts` -- Dragon's Maw interior layout

Added `DRAGONS_MAW_LAYOUT: DungeonLayout` (exported) for the Dragon's Maw dungeon.
This is a single open chamber (no waist stubs) sized to fit the Dragon's Maw spawn
positions (z 35, 65, 95, 130).

**Why:** Every `DungeonDef.interior` string must map to a `DungeonLayout` in this
file, a renderer case in `src/render/dungeon.ts`, and a collider set in
`src/sim/colliders.ts`. Without a dedicated layout, the dungeon falls back to the
crypt or sanctum geometry, which places waist-wall colliders that embed mob spawns
inside solid geometry (causing them to float and blocking navigation).

**Code added** (insert before the `ARENA_SPAWN_A` line):
```typescript
// Dragon's Maw (interior 'dragons_maw'): a single vast dragon's lair chamber,
// z -19..150. No waist stubs so players move freely between the three mob groups.
// Boss dais at z 130 for Ignaraxis. Side walls span the full length.
export const DRAGONS_MAW_LAYOUT: DungeonLayout = {
  zMin: -19,
  zMax: 150,
  sideWallZ: 65.5,  // centre: (150 + (-19)) / 2
  sideWallHd: 84.5, // half-depth: (150 - (-19)) / 2
  pillars: grid(10, 120, 25, [-14, 14]),
  tombs: [],
  stubs: [],
  dais: { x: 0, z: 130, r: 13 },
};
```

**Verification:** `grep -c "DRAGONS_MAW_LAYOUT" src/sim/dungeon_layout.ts` should return 1.

---

#### `src/render/dungeon.ts` -- hook points for dungeon_custom.ts

`dungeon.ts` is an upstream file; all Dragon's Maw rendering logic lives in the
fork-owned `src/render/dungeon_custom.ts` instead. This entry documents the small
hook points that wire the custom file in. When an upstream merge loses one of these
hooks, re-apply the change described here and verify tests pass.

**Import block** (add after the last local import, e.g. after `radialGlowTexture`):
```typescript
import {
  type CustomDungeonVariantId,
  CUSTOM_TORCH_COLORS,
  CUSTOM_NO_BANNER_VARIANTS,
  getCustomDungeonLayout,
  isCustomDungeonVariant,
  customFloorKind,
  customWallKind,
  customWallDressing as applyCustomWallDressing,
} from './dungeon_custom';
```

**`DungeonInteriorVariant` union** -- replace the literal `'dragons_maw'` member with
the imported type (keeps the union correct when new custom variants are added to
`dungeon_custom.ts` without touching this union):
```typescript
export type DungeonInteriorVariant =
  | 'crypt'
  | 'bastion'
  | 'sanctum'
  | 'temple'
  | 'arena'
  | 'nythraxis'
  | CustomDungeonVariantId   // <- was the literal 'dragons_maw'
  | 'delve_ossuary'
  | 'delve_bell'
  | 'delve_hall'
  | 'delve_finale';
```

**`TORCH_COLORS`** -- replace the hardcoded `dragons_maw` entry with a spread:
```typescript
  nythraxis: { flame: 0x8f5cff, emissive: 0x4b1c9a, light: 0x7b4dff },
  ...CUSTOM_TORCH_COLORS,
  // delve reliquaries ...
```

**`buildInterior` layout chain** -- replace the `interior === 'dragons_maw' ?
DRAGONS_MAW_LAYOUT :` case with the lookup helper (also remove `DRAGONS_MAW_LAYOUT`
from the `dungeon_layout` import line):
```typescript
    const layout =
      opts?.layout ??
      getCustomDungeonLayout(interior) ??
      (interior === 'sanctum'
        ? SANCTUM_LAYOUT
        : interior === 'temple'
          ? TEMPLE_LAYOUT
          : interior === 'arena'
            ? ARENA_LAYOUT
            : interior === 'nythraxis'
              ? NYTHRAXIS_LAYOUT
              : CRYPT_LAYOUT);
```

**`variantFor` method** -- replace `if (interior === 'dragons_maw') return 'dragons_maw';`
with the guard that covers all current and future custom variants:
```typescript
    if (isCustomDungeonVariant(interior)) return interior;
```

**`floorKind` method** -- replace the `dragons_maw` if-block with a one-liner
(insert before the `'sanctum'` branch):
```typescript
    if (isCustomDungeonVariant(variant)) return customFloorKind(variant, t);
```

**`wallKind` method** -- same pattern (insert before the `'sanctum'` branch):
```typescript
    if (isCustomDungeonVariant(variant)) return customWallKind(variant, t);
```

**`placeWalls` method** -- replace `variant !== 'dragons_maw'` with the set lookup:
```typescript
        if (i % bannerEvery === 2 && kind !== 'wall_archedwindow_gated' && !CUSTOM_NO_BANNER_VARIANTS.has(variant)) {
```

**`placeWallDressing` method** -- add an early-return block immediately after the
`'arena'` early-return and before the rubble code:
```typescript
    // Custom variants own all their dressing (including rubble) in dungeon_custom.ts
    if (isCustomDungeonVariant(variant)) {
      applyCustomWallDressing(variant, (k, x, y, z, ry, sc) => p.add(k, x, y, z, ry, sc), layout);
      return;
    }
```
(The old `if (variant === 'dragons_maw') { ... return; }` block that was further down
in `placeWallDressing` is removed entirely.)

**Verification:**
```bash
grep -c "CUSTOM_TORCH_COLORS\|isCustomDungeonVariant\|applyCustomWallDressing\|dungeon_custom" src/render/dungeon.ts
# Expect: 7+ (import block + TORCH_COLORS spread + variantFor + floorKind + wallKind + placeWalls + placeWallDressing)
ls src/render/dungeon_custom.ts
# Expect: file exists (it is fork-owned; upstream merges never touch it)
```

---

#### `src/render/dungeon_custom.ts` -- fork-owned Dragon's Maw rendering (new file)

This file is fork-owned and never touched by upstream merges. It follows the same
pattern as `src/render/characters/custom/index.ts`. All Dragon's Maw-specific
rendering logic lives here; `dungeon.ts` only imports/delegates.

The file must export:
- `CustomDungeonVariantId` -- type union of all custom variant ids (`'dragons_maw'`)
- `CUSTOM_TORCH_COLORS` -- torch colour objects keyed by `CustomDungeonVariantId`
- `CUSTOM_DUNGEON_LAYOUTS` -- layout objects keyed by `CustomDungeonVariantId`
- `getCustomDungeonLayout(interior)` -- lookup helper used by `buildInterior`
- `isCustomDungeonVariant(interior)` -- type guard
- `CUSTOM_NO_BANNER_VARIANTS` -- set of variants that suppress side-wall banners
- `customFloorKind(variant, t)` -- floor tile kind dispatch
- `customWallKind(variant, t)` -- wall module kind dispatch
- `customWallDressing(variant, add, layout)` -- wall dressing placement via callback

If this file is accidentally lost after a merge, recreate it from the source in
the repository or from the commit history. Do not inline dragons_maw logic into
`dungeon.ts` -- that defeats the purpose of the fork-owned file.

**Verification:** `ls src/render/dungeon_custom.ts` should return the file path.

---

#### `src/sim/colliders.ts` -- Dragon's Maw collision set

Two changes to register `'dragons_maw'` colliders.

**Import change:** Add `DRAGONS_MAW_LAYOUT` to the import from `'./dungeon_layout'`.

**Collider constant + INTERIOR_COLLIDERS entry** (add after the existing layout constants):
```typescript
const DRAGONS_MAW_COLLIDERS: Collider[] = layoutColliders(DRAGONS_MAW_LAYOUT);

// Interior collider sets keyed by DungeonDef.interior.
const INTERIOR_COLLIDERS: Record<string, Collider[]> = {
  crypt: CRYPT_COLLIDERS,
  sanctum: SANCTUM_COLLIDERS,
  temple: TEMPLE_COLLIDERS,
  nythraxis: NYTHRAXIS_COLLIDERS,
  dragons_maw: DRAGONS_MAW_COLLIDERS,   // <- added
};
```

Without this, the `'dragons_maw'` interior string has NO collision -- players and
mobs would walk through the walls.

**Verification:**
```bash
grep -c "DRAGONS_MAW" src/sim/colliders.ts
# Expect: 3 (import + const + INTERIOR_COLLIDERS entry)
```

---

#### `src/sim/data.ts` -- ARENA_X and DELVE_X_MIN shifted to open custom dungeon slot

**Why:** All upstream dungeon indices 0-5 are occupied (Hollow Crypt=0, Sunken Bastion=1,
Gravewyrm=2, Drowned Temple=3, Nythraxis Crypt=4, Nythraxis Arena=5). Index 6 would place a
dungeon at x=4500, but `dungeonAt()` returns null for x >= ARENA_X_MIN. Shifting ARENA_X from
4200 to 4700 opens index 6. DELVE_X_MIN is shifted from 4800 to 5300 (+500) to maintain the
>=500u gap that `tests/delves.test.ts` guards.

**Original (upstream):**
```typescript
export const ARENA_X = 4200; // arena instances share this x; slots stack along z
export const ARENA_X_MIN = ARENA_X; // x at/after this = an arena instance, not a dungeon
```
```typescript
// DELVE_X_MIN must stay above ARENA_X_MIN (4000) and ARENA_X (4200).
// 4800 sits clear of the v0.10.0 layout: dungeons end at ARENA_X_MIN (4000) and
// the arena pit is centred at ARENA_X (4200, ~±22u footprint). The delve band's
// west edge (DELVE_BAND_X_MIN = 4773) leaves a comfortable margin past the arena.
export const DELVE_X_MIN = 4800;
```

**Fork version (re-apply after any upstream overwrite):**
```typescript
export const ARENA_X = 4700; // arena instances share this x; slots stack along z
export const ARENA_X_MIN = ARENA_X; // x at/after this = an arena instance, not a dungeon
```
```typescript
// ARENA_X shifted from 4200 to 4700 (fork change, see docs/MAINTAINING-FORK.md)
// to open index 6 (x=4500) for the custom Dragon's Maw dungeon. DELVE_X_MIN
// was moved from 4800 to 5300 (+500) to maintain the >=500u gap that the
// delves test guards (DELVE_BAND_X_MIN - ARENA_X = 5273 - 4700 = 573).
// The arena pit footprint (~22u) still clears the delve band by >550u.
export const DELVE_X_MIN = 5300;
```

**Verification:**
```bash
grep "ARENA_X = " src/sim/data.ts   # should show 4700
grep "DELVE_X_MIN = " src/sim/data.ts  # should show 5300
```

After re-applying, regenerate parity traces:
```bash
UPDATE_PARITY=1 npx vitest run tests/parity
```

---

#### `tests/delves.test.ts` -- DELVE_X_MIN pin test updated to 5300

**Why:** The pin test hardcodes the expected `DELVE_X_MIN` value. It must be updated when
the constant changes.

**Original (upstream):**
```typescript
it('pins the absolute 4800 boundary against the arena seam (relocation regression)', () => {
    // DELVE_X_MIN moved 3600 -> 4800 when v0.10.0 pushed the arena to x=4200.
    // ...
    expect(DELVE_X_MIN).toBe(4800);
```

**Fork version:**
```typescript
it('pins the absolute boundary against the arena seam (relocation regression)', () => {
    // DELVE_X_MIN moved 3600 -> 4800 (v0.10.0, arena to x=4200) -> 5300 (fork,
    // arena to x=4700 to open custom dungeon index 6 at x=4500).
    // ...
    expect(DELVE_X_MIN).toBe(5300);
```

Also update the nearby arena comment from `ARENA_X = 4200` to `ARENA_X = 4700`.

**Verification:**
```bash
grep "DELVE_X_MIN\).toBe" tests/delves.test.ts   # should show 5300
```

---

#### `tests/map_window_view.test.ts` -- makeDelveWorld player position uses DELVE_X_MIN (5300)

The `makeDelveWorld` helper builds a stub world for testing the map-window delve mode
discriminator. It sets the player's `pos.x` and the `delveRun.origin.x` to a coordinate
inside the delve band. The upstream test used x=5000 (valid for the upstream DELVE_X_MIN
of 4800) but this fork shifts DELVE_X_MIN to 5300 to open a custom dungeon slot; x=5000
falls BELOW the fork's DELVE_X_MIN and is treated as overworld, causing the discriminator
to return 'overworld' instead of 'delve'.

**Fork change** -- `makeDelveWorld` uses x=5300 to stay inside the fork's delve band:
```typescript
// Old (upstream x=5000, outside the fork delve band DELVE_X_MIN=5300):
player: { ..., pos: { x: 5000, z: 0 }, ... },
delveRun: { ..., origin: { x: 5000, z: 0 } },

// New (fork x=5300, at the fork DELVE_X_MIN boundary):
player: { ..., pos: { x: 5300, z: 0 }, ... },
delveRun: { ..., origin: { x: 5300, z: 0 } },
```

**Verification:**
```bash
grep "makeDelveWorld\|x: 5" tests/map_window_view.test.ts | head -5
# Expect: pos: { x: 5300, z: 0 } and origin: { x: 5300, z: 0 }
```

If this is lost (upstream updates the helper with a new x value below 5300), update
both the `pos.x` and `origin.x` to any value >= 5300 that places the player inside
the delve band.

---

#### `src/ui/i18n.catalog/index.ts` -- FORK_BRAND import (upstream merge may drop it)

The English catalog barrel imports `FORK_BRAND` from the fork-owned
`src/ui/i18n.catalog/fork_brand.ts` to embed the game name, GitHub URL, and other
brand constants into seven catalog string values. This import line can be silently
dropped during an upstream merge that rewrites the top of `index.ts`.

**Import to restore** (add alongside the other local catalog imports):
```typescript
import { FORK_BRAND } from './fork_brand';
```

The seven usages are: `meta.copyright`, `meta.githubLink`, `shell.playAria`,
`social.defaultRealm`, `social.brandWordmark`, `social.nativeShareBody`, and
`social.nativeShareTitle`.

**Verification:**
```bash
grep "FORK_BRAND" src/ui/i18n.catalog/index.ts | head -3
# Expect: import line + at least 2 usage lines
```

If missing, `node scripts/i18n_scan.mjs` will throw `ReferenceError: FORK_BRAND is not
defined` and `npm run i18n:gen` will fail, so this is caught early.

---

#### `src/sim/content/custom/dragons_blight/items.ts` -- armorType required field (upstream v0.16.0+)

Upstream v0.16.0 added `armorType: ArmorType` as a REQUIRED field on `ArmorItemDef`
(`src/sim/types.ts`). Custom armor items must include this field or `armor_type_catalog.test.ts`
will fail.

The three Dragon's Blight armor pieces and their correct values:

```typescript
custom_drakebone_shoulders: { armorType: 'mail', ... }   // warrior/paladin/shaman
custom_scorchwing_cowl:     { armorType: 'cloth', ... }  // mage/priest/warlock/druid
custom_blight_stalkers_hood: { armorType: 'leather', ... } // rogue/hunter
```

To verify after a merge:
```bash
grep "armorType" src/sim/content/custom/dragons_blight/items.ts
# Expect: 3 hits (one per armor piece)
npx vitest run tests/armor_type_catalog.test.ts
```

---

#### `src/sim/content/custom/dragons_blight/items.ts` -- epic weapon stat budget (upstream v0.16.0+)

Upstream v0.16.0 added item level stat budget enforcement. Epic quality weapons at sourceLevel=20
have itemLevel = 20 + QUALITY_ILVL_BONUS[epic=6] = 26, mainhand slotMult=1.0, quality epic mult=1.0,
STAT_PER_ILVL=0.7 => budget = Math.round(26 * 1.0 * 1.0 * 0.7) = 18.

The three Dragon's Blight epic weapons must sum to exactly 18 primary stats:

```typescript
custom_ignaraxis_greatblade: { stats: { str: 12, sta: 6 } }    // 12+6 = 18
custom_cinderstave_eternal:  { stats: { int: 13, spi: 5 } }    // 13+5 = 18
custom_fang_of_ignaraxis:    { stats: { agi: 12, sta: 6 } }    // 12+6 = 18
```

To verify after a merge:
```bash
npx vitest run tests/item_level.test.ts
```

---

### Post-merge i18n and parity regeneration (custom content)

Whenever a merge changes upstream content (new zones, mobs, camps, quests) or
upstream locale files, run these regeneration commands before running the test suite:

```bash
# Regenerate parity golden traces (required after ANY upstream content that changes
# camp count, mob IDs, or tick-phase order -- a wrong golden fails tests/parity):
UPDATE_PARITY=1 npx vitest run tests/parity

# Regenerate i18n resolved files and hash baseline (required after ANY change to
# src/ui/i18n.locales/*.ts or src/ui/i18n.catalog/**/*.ts):
npm run i18n:gen && node scripts/i18n_resolved_hash.mjs --write

# Verify at release tier (I18N_RELEASE_TIER=1 means pending=0 is required):
I18N_RELEASE_TIER=1 npx vitest run tests/i18n_completeness.test.ts \
  tests/i18n_status_registry.test.ts tests/i18n_resolved_equivalence.test.ts
```

---

## Post-merge failure recovery

If the build or server fails after a merge, follow the full protocol in
`FORK.md` Rule 5. That rule covers:
- Step-by-step health checks (grep commands for every fork-specific addition)
- Systematic review of every entry in this document to confirm it survived
- How to adapt the custom content hook when upstream refactors `data.ts`
- What to do when upstream changes a shared type interface that custom content uses
- TypeScript error triage, test-suite checks, and build pipeline verification
- Documentation update requirements after every fix

The short version of the health checks is also in `FORK.md` Rule 4.
Full code snippets to re-apply any lost change are in the sections above.

---

## How to safely pull upstream updates

### The safe workflow

```bash
# 1. Fetch the latest upstream changes
git fetch origin master

# 2. Merge with upstream winning all conflicts automatically
git merge -X theirs origin/master
```

`git merge -X theirs` creates a merge commit and preserves the full fork history in
`git log`. When the same lines were changed by both upstream and the fork, `-X theirs`
keeps upstream's version automatically -- no manual conflict resolution required.

**This is intentional.** Fork additions to upstream files are small, documented, and
re-applied from `docs/MAINTAINING-FORK.md` after every merge. Letting upstream win
automatically is safer than resolving a complex upstream diff by hand, where it is
easy to accidentally discard an upstream fix or introduce a merge artifact.

**After the merge, the health checks below are the recovery step.** Treat them as
the normal part of every merge cycle, not as an exceptional response to a failure.
Every check that returns fewer hits than expected means upstream overwrote that
addition; re-apply it from the code block in the relevant section of this file.

### What to check after a merge

```bash
# 1. Verify ADMIN_HOSTNAME code survived
grep -n "ADMIN_HOSTNAME" server/main.ts
# Expect: two hits -- the constant and the adminByHost line in isAdminRequest()

# 2. Verify custom content hook survived
grep -n "CUSTOM_CAMPS" src/sim/data.ts
# Expect: the import line and the CAMPS spread

# 3. Verify fork-owned files still exist
ls docs/SETUP-DIGITALOCEAN.md docs/SETUP-LOCAL-MAC.md \
   docs/SETUP-CLOUDFLARE.md docs/MAINTAINING-FORK.md \
   docs/custom-content/ADDING-CUSTOM-CONTENT.md \
   docs/custom-content/items.md docs/custom-content/mobs.md \
   docs/custom-content/zones.md docs/custom-content/dungeons.md \
   src/sim/content/custom/index.ts FORK.md

# 4. Verify Dragon's Blight i18n import spreads survived in world_entity_i18n.ts
grep -c "CUSTOM_" src/ui/world_entity_i18n.ts
# Expect: 10 (import line with 5 names + 5 ...CUSTOM_*_IDS spreads)

# 5. Verify Dragon's Blight import spreads survived in items catalog
grep -c "CUSTOM_" src/ui/i18n.catalog/items.ts
# Expect: 4 (import line + CUSTOM_ITEM_ENTITY_IDS spread + CUSTOM_ITEM_EN_NAMES spread)

# 6. Verify secondary RNG for CUSTOM_CAMPS survived in sim.ts
grep -c "customRng\|customCampSet" src/sim/sim.ts
# Expect: 3 (customCampSet declaration, customRng declaration, rng= ternary)

# 7. Verify delves test uses upstream seed value (not a fork override)
grep -n "rollFor" tests/delves.test.ts
# Expect: rollFor(42) -- if it shows a different value, the main RNG stream was shifted

# 8. After any upstream content or locale change, regenerate i18n artifacts and parity:
UPDATE_PARITY=1 npx vitest run tests/parity
npm run i18n:gen && node scripts/i18n_resolved_hash.mjs --write
```

If any check fails, re-apply from the code blocks documented in this file.

### What NOT to do

```bash
# DANGER — this discards all your commits and matches upstream exactly
git reset --hard origin/master

# DANGER — this force-overwrites all your branch history
git push --force origin master

# AVOID — a plain merge without -X theirs stops at every conflict and
# requires manual resolution; it is easy to accidentally discard an upstream
# fix or leave a merge marker in the file. Always use -X theirs instead.
git merge origin/master   # plain merge -- use "git merge -X theirs origin/master"
```

`reset --hard` and `push --force` are irreversible without the exact commit hash.
A plain merge is recoverable (`git merge --abort`) but unnecessary -- `-X theirs`
handles conflicts automatically and produces a cleaner result.

---

## If an upstream merge wipes your code changes

If the two `server/main.ts` additions are ever lost, re-apply them from the code
blocks documented above. They are self-contained — there are no other files to change.

To confirm the ADMIN_HOSTNAME feature is wired up after re-applying:
```bash
# Start the server locally and test
PUBLIC_ORIGIN=http://localhost:8787 ADMIN_HOSTNAME=test.localhost \
  node dist-server/main.js &

curl -s -o /dev/null -w "%{http_code}" -H "Host: test.localhost" http://localhost:8787/
# Should return 200 and serve admin.html
```

---

## Future changes that would conflict

If the upstream significantly refactors `isAdminRequest()` or moves it to a separate
module, a merge conflict will occur in `server/main.ts`. The resolution is always to
keep both the upstream change AND the `ADMIN_HOSTNAME` env-var path (the one-line
`adminByHost` constant).

All other fork-specific files are either new (no upstream equivalent) or additions
to sections that upstream has not changed. They are unlikely to conflict.
