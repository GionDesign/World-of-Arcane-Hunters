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
   docs/MAINTAINING-FORK.md docs/CUSTOM-CONTENT.md FORK.md

# Verify README pointer survived (not the full upstream section)
grep -c "docs/SETUP-DIGITALOCEAN.md" README.md
```

If `grep` returns nothing, re-apply the code from `docs/MAINTAINING-FORK.md`.

---

## Rule 5: Deployment configuration lives outside git

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
