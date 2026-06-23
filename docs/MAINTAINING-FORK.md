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
| `docs/SETUP-LOCAL-MAC.md` | Local Mac development setup guide |
| `docs/SETUP-CLOUDFLARE.md` | Cloudflare DNS, proxy, WAF, and Turnstile guide |
| `docs/MAINTAINING-FORK.md` | This file |
| `docs/CUSTOM-CONTENT.md` | Guide for adding custom game content via `src/sim/content/custom/` |
| `FORK.md` | Fork rules — loaded by reference from `CLAUDE.md` |
| `src/sim/content/custom/index.ts` | Custom game content scaffold (mobs, items, zones, quests, etc.) |
| `src/sim/content/custom/CLAUDE.md` | Local authoring guide for the custom content directory |

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

## How to safely pull upstream updates

### The safe workflow

```bash
# 1. Fetch the latest upstream changes
git fetch origin master

# 2. Merge onto your branch — NOT reset --hard
git merge origin/master
```

`git merge` creates a merge commit. Your fork-specific commits are preserved in the
history and appear in `git log`. If there is a conflict:

- Git will stop and print the conflicting files
- Open the file; conflicts are marked with `<<<`, `===`, and `>>>`
- Keep **both** your additions AND the upstream additions (usually they're in
  different parts of the file)
- Run `git add <file>` then `git commit` to finish the merge

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
   src/sim/content/custom/index.ts FORK.md
```

If any check fails, re-apply from the code blocks documented in this file.

### What NOT to do

```bash
# DANGER — this discards all your commits and matches upstream exactly
git reset --hard origin/master

# DANGER — this force-overwrites all your branch history
git push --force origin master
```

These operations are irreversible without knowing the exact commit hash to restore.

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
