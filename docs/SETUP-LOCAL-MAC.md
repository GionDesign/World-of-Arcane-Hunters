# Local Development Setup — Mac

This guide walks through setting up World of Arcane Hunters for local development on a
Mac. By the end you will have:

- A local Supabase instance (Postgres + Studio dashboard) running via Docker Desktop
- The game server running on `localhost:8787`
- The Vite dev server running on `localhost:5173` (hot reload)
- Both **offline** and **online** play modes working

**Estimated setup time:** 15–20 minutes.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Install Node.js Dependencies](#3-install-nodejs-dependencies)
4. [Choose a Local Database Option](#4-choose-a-local-database-option)
   - [Option A — Docker Compose (simplest)](#option-a--docker-compose-simplest)
   - [Option B — Supabase CLI (local Supabase stack)](#option-b--supabase-cli-local-supabase-stack)
   - [Option C — No Docker (UTM VM / remote Supabase)](#option-c--no-docker-utm-vm--remote-supabase)
5. [Configure the `.env` File](#5-configure-the-env-file)
6. [Start the Game Server](#6-start-the-game-server)
7. [Start the Vite Dev Server](#7-start-the-vite-dev-server)
8. [Verify Everything Works](#8-verify-everything-works)
9. [Grant Yourself Admin Access](#9-grant-yourself-admin-access)
10. [Running Tests](#10-running-tests)
11. [Running E2E and Browser Scripts](#11-running-e2e-and-browser-scripts)
12. [Environment Variable Reference](#12-environment-variable-reference)
13. [Multiple Realms Locally](#13-multiple-realms-locally)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

Install the following tools before starting.

### 1.1 Homebrew

If you do not have Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the printed instructions to add Homebrew to your `PATH` (especially on Apple
Silicon where the prefix is `/opt/homebrew`).

### 1.2 Node.js 22

The project requires Node.js 22. The recommended way is via `nvm`:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload your shell (or open a new terminal)
source ~/.zshrc   # or ~/.bashrc if you use bash

# Install and activate Node.js 22
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version    # should print v22.x.x
npm --version     # should print 10.x.x
```

Alternatively via Homebrew (installs to a fixed path, no version switching):

```bash
brew install node@22
echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
node --version
```

### 1.3 Docker Desktop for Mac (Options A and B only)

> **Skip this step if you are on a UTM virtual machine or any environment where
> Docker does not work.** Use [Option C](#option-c--no-docker-utm-vm--remote-supabase)
> instead — it requires no Docker at all.

Docker Desktop runs the database and (optionally) the full Supabase stack in containers.

1. Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
   Choose the version for your chip: **Apple Silicon (M1/M2/M3/M4)** or **Intel**.
2. Open the `.dmg`, drag Docker to Applications.
3. Launch Docker Desktop and follow the onboarding. Accept the licence.
4. Wait for the whale icon in the menu bar to show a steady state (not spinning).
5. Verify from a terminal:
   ```bash
   docker --version          # Docker version 27.x.x
   docker compose version    # Docker Compose version v2.x.x
   ```

### 1.4 Git

Xcode Command Line Tools includes Git on Mac:

```bash
git --version   # if this works you're good
# If not:
xcode-select --install
```

### 1.5 PostgreSQL client (for running raw SQL commands)

```bash
brew install libpq
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql --version
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/giondesign/world-of-arcane-hunters.git
cd world-of-arcane-hunters
```

If you are working from a fork:

```bash
git clone https://github.com/<your-username>/world-of-arcane-hunters.git
cd world-of-arcane-hunters
git remote add upstream https://github.com/giondesign/world-of-arcane-hunters.git
```

---

## 3. Install Node.js Dependencies

```bash
npm install
```

This installs all runtime and dev dependencies (Three.js, Vite, Vitest, esbuild,
TypeScript, etc.). Expect ~2–3 minutes on first install.

---

## 4. Choose a Local Database Option

You need a local Postgres 16 instance. Pick one of the two options below.

**Use Option A (Docker Compose)** unless you specifically want the Supabase Studio UI,
local auth emulation, or want your local setup to mirror the production Supabase
environment exactly.

---

### Option A — Docker Compose (simplest)

The project ships a `docker-compose.yml` that starts a `postgres:16-alpine` container.
This is the fastest path.

#### Start Postgres

```bash
npm run db:up
```

This runs `docker compose up -d postgres`. Docker pulls the image on first run (~300 MB)
and starts the container. The database listens on `127.0.0.1:5433` (not the default
5432, to avoid conflicting with any system Postgres).

Verify it is running:

```bash
docker compose ps
# eastbrook-db   Up  (healthy)
```

#### Connection details for Option A

| Setting | Value |
|---|---|
| Host | `127.0.0.1` |
| Port | `5433` |
| User | `eastbrook` |
| Password | whatever you set as `POSTGRES_PASSWORD` in `.env` |
| Database | `eastbrook` |
| Full URL | `postgres://eastbrook:<password>@127.0.0.1:5433/eastbrook` |

Skip ahead to [Step 5](#5-configure-the-env-file).

---

### Option B — Supabase CLI (local Supabase stack)

This spins up the full Supabase stack locally: Postgres, Studio (web dashboard at
[localhost:54323](http://localhost:54323)), Auth, Storage, and Edge Functions. Use
this when you want a local experience that mirrors the production Supabase setup.

#### 4B.1 Install the Supabase CLI

```bash
brew install supabase/tap/supabase
supabase --version   # should print 1.x.x or higher
```

#### 4B.2 Initialize Supabase in the project (one-time)

Run from inside the project directory:

```bash
supabase init
```

This creates a `supabase/` directory (config file and migrations folder). The
`supabase/` directory is gitignored by default — check `.gitignore`.

#### 4B.3 Start the local Supabase stack

```bash
supabase start
```

Docker Desktop must be running. This downloads several images on first run (~2 GB total)
and takes 2–5 minutes. Once complete you will see output like:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGci...
service_role key: eyJhbGci...
```

**Copy the `DB URL` line** — you need it for the next step.

#### 4B.4 (Optional) Open Supabase Studio

Point your browser at the **Studio URL** shown above (usually
[http://127.0.0.1:54323](http://127.0.0.1:54323)). Studio is a full database management
UI: table editor, SQL editor, logs, and auth management — just like the Supabase cloud
dashboard but running locally.

#### Connection details for Option B

| Setting | Value |
|---|---|
| Full URL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Host | `127.0.0.1` |
| Port | `54322` |
| User | `postgres` |
| Password | `postgres` (default local Supabase password) |
| Database | `postgres` |

> **Note:** The local Supabase Postgres password is always `postgres` — it is not a
> real security concern since it only listens on loopback. The game server uses this URL
> the same way it uses the production Supabase URL, but targeting your laptop's port.

#### Stopping and resetting

```bash
# Stop all containers but keep data
supabase stop

# Stop and wipe all local data (full reset)
supabase stop --no-backup
```

---

### Option C — No Docker (UTM VM / remote Supabase)

Use this option when Docker is not available on your machine — for example, inside a
**UTM virtual machine on Apple Silicon Mac**, a plain Linux box, or any environment
where Docker containers do not work.

Instead of running a local database container, you point `DATABASE_URL` directly at
your existing Supabase project (production or a separate staging project). The game
server and Vite dev server run as plain Node processes — no containers needed.

> **Which Supabase project should you use?**
> Using production means real player data is live during your session. This is fine
> for read-heavy tasks or testing features that don't create or destroy data. For
> active development that writes accounts, characters, or chat, create a free second
> Supabase project at [supabase.com](https://supabase.com) and use that as staging.
> Both options use the exact same steps below.

#### C.1 Find your Supabase connection string

1. Open [supabase.com](https://supabase.com) and log in.
2. Select your project.
3. Go to **Settings > Database**.
4. Scroll to **Connection string** and click the **URI** tab.
5. Copy the string. It looks like:
   ```
   postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
   Replace `[YOUR-PASSWORD]` with your database password (set when you created the project,
   or reset under **Settings > Database > Reset database password**).

> **Note:** Use the **Direct connection** string (port 5432), not the Transaction pooler
> (port 6543). The direct connection gives the server a persistent session, which is
> required for some Postgres features used at startup. The Session pooler (also port 5432
> but under **Connection pooling**) also works if the direct connection is firewalled.

#### C.2 Configure your environment file

Copy the no-Docker example and edit it:

```bash
cp .env.local.example .env
```

Open `.env` and set `DATABASE_URL` to the connection string from step C.1:

```env
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

That is the only required change. Every other variable in `.env.local.example` has a
working default for local dev and can stay commented out.

> **POSTGRES_PASSWORD is not needed.** It is only read by `docker-compose.yml`, which
> you are not using. Leave it absent from your `.env`.

Skip to [Step 6](#6-start-the-game-server) — you do not need to start any database
container. The server connects to Supabase over the internet.

#### Connection details summary for Option C

| Setting | Value |
|---|---|
| Host | `db.[YOUR-PROJECT-REF].supabase.co` |
| Port | `5432` |
| User | `postgres` |
| Database | `postgres` |
| Full URL | from Supabase dashboard Settings > Database > URI tab |

---

## 5. Configure the `.env` File

Copy the example and edit it:

```bash
cp .env.example .env
```

Now open `.env` in your editor:

```bash
# macOS built-in editor
nano .env

# or VS Code
code .env
```

### 5.1 Minimum required settings

Set these based on which database option you chose in Step 4:

**For Option A (Docker Compose):**

```env
# Generate a random password — keep it consistent with DATABASE_URL below
POSTGRES_PASSWORD=my-local-dev-password-change-me

# Must match POSTGRES_PASSWORD above
DATABASE_URL=postgres://eastbrook:my-local-dev-password-change-me@127.0.0.1:5433/eastbrook
```

**For Option B (Supabase CLI):**

```env
# Not used by the server when DATABASE_URL is set, but required by docker-compose.yml
# (set it to anything for local dev)
POSTGRES_PASSWORD=local-dev-not-used

# Use the DB URL from `supabase start` output
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**For Option C (No Docker — remote Supabase):**

```env
# POSTGRES_PASSWORD is NOT needed for this option — omit it entirely.

# Paste the URI from Supabase dashboard > Settings > Database > URI tab:
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

If you used `cp .env.local.example .env` in Option C step C.2, the file is already
structured correctly — just fill in `DATABASE_URL`.

### 5.2 Full annotated `.env` for local development

Below is a complete `.env` with every variable explained. Copy this and adjust for your
chosen database option. Uncomment only the variables you need:

```env
# ── Database ─────────────────────────────────────────────────────────────────

# Required by docker-compose.yml (Option A only). Make it long and random even
# for local dev so you don't forget to change it for production.
POSTGRES_PASSWORD=my-local-dev-password-32chars-min

# Connection string the game server uses.
# Option A (Docker Compose):
DATABASE_URL=postgres://eastbrook:my-local-dev-password-32chars-min@127.0.0.1:5433/eastbrook
# Option B (Supabase CLI):
# DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# ── Server port ───────────────────────────────────────────────────────────────
# Default is 8787. Uncomment to override.
# PORT=8787

# ── Media cache ───────────────────────────────────────────────────────────────
# Where content-hashed GLB/texture files are stored between server restarts.
# Default for local dev (relative to project root) is fine:
EASTBROOK_MEDIA_DIR=./media-cache

# ── Realm identity ────────────────────────────────────────────────────────────
# The name of this world shard. Shown to players in the realm list.
# REALM_NAME=Claudemoon
# REALM_TYPE=Normal

# ── MediaWiki (player wiki) ───────────────────────────────────────────────────
# Only needed if you run `docker compose up` (the full stack including MediaWiki).
# For basic dev (npm run server + npm run dev) you can leave these as-is.
MEDIAWIKI_DB_NAME=mediawiki
MEDIAWIKI_DB_USER=mediawiki
MEDIAWIKI_DB_PASSWORD=mediawiki-local-dev
MEDIAWIKI_ADMIN_USER=WikiAdmin
MEDIAWIKI_ADMIN_PASS=local-wiki-admin-pass
MEDIAWIKI_SERVER=http://localhost:8080
WIKI_URL=http://localhost:8080/wiki/index.php/Main_Page

# ── Bot gate ─────────────────────────────────────────────────────────────────
# Leave empty for local dev (gate is disabled when both are unset).
# TURNSTILE_SECRET=
# VITE_TURNSTILE_SITEKEY=

# ── Restart countdown ─────────────────────────────────────────────────────────
# RESTART_COUNTDOWN_SECRET=

# ── Public origin ─────────────────────────────────────────────────────────────
# Leave unset for local dev. The server falls back to request origin.
# PUBLIC_ORIGIN=https://play.yourgame.com

# ── Chat logs ─────────────────────────────────────────────────────────────────
# CHAT_LOG_RETENTION_DAYS=90

# ── Dev commands (for E2E test bots only) ────────────────────────────────────
# Uncomment ONLY when running scripts/crypt_raid.mjs or social_e2e.mjs locally.
# NEVER set this on a server reachable from the internet.
# ALLOW_DEV_COMMANDS=1

# ── ElevenLabs (voice generation scripts only) ────────────────────────────────
# Only needed if running scripts/gen_npc_voices.mjs or scripts/gen_npc_lines.mjs.
# ELEVENLABS_API_KEY=your-key-here

# ── Solana / $WOC ─────────────────────────────────────────────────────────────
# Server-side only. Public mainnet RPC is rate-limited — use a dedicated endpoint
# in production but the default is fine for local dev.
# SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# WOC_MINT=3WjLscH2JsXLEFJZRA9z8ti8yRGxWGKbqymPd7UicRth

# ── Wallet UI kill switch ─────────────────────────────────────────────────────
# VITE_WALLET_DISABLED=1
```

---

## 6. Start the Game Server

The game server is the **authoritative backend** — it handles HTTP REST, WebSocket
connections, combat resolution, persistence to Postgres, and everything else.

In a terminal window:

```bash
npm run server
```

This does two things:
1. **`npm run build:server`** — esbuild compiles `server/main.ts` and its imports into
   `dist-server/server.cjs` (takes ~1–2 seconds).
2. **`node dist-server/server.cjs`** — starts the HTTP + WebSocket server.

Expected startup output:

```
[db] schema ready (tables created or verified)
[server] listening on 0.0.0.0:8787
[game] realm "Claudemoon" started — tick rate 20 Hz
```

> **Leave this terminal open.** The server runs in the foreground. Use `Ctrl+C` to stop
> it (all connected characters are saved before shutdown).

> **The schema creates itself on first boot.** There is no separate `migrate` command.
> The game server runs `ensureSchema()` at startup, which applies the DDL against your
> Postgres instance. If the tables already exist it is idempotent. You should see
> `[db] schema ready` in the output.

---

## 7. Start the Vite Dev Server

The Vite dev server serves the client (browser game) with hot module replacement.
It proxies `/api`, `/admin/api`, and `/ws` requests to the game server on `:8787`.

In a **second terminal window** (keep the server terminal from Step 6 open):

```bash
npm run dev
```

Expected output:

```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open `http://localhost:5173` in your browser.

---

## 8. Verify Everything Works

### 8.1 Offline mode

1. Open `http://localhost:5173`.
2. Click **Play Offline**.
3. Enter a character name, pick a class, click **Enter World**.
4. You should load into Eastbrook Vale. Try moving with WASD and attacking a wolf.
5. Offline mode does not need the game server — it runs entirely in the browser.

### 8.2 Online mode

Online mode requires both `npm run server` (Step 6) and `npm run dev` (Step 7) to be
running.

1. Open `http://localhost:5173`.
2. Click **Play Online**.
3. Click **Create Account**, enter a username and password.
4. Click **Create Character**, pick a class and name.
5. Click **Enter World**.

To test multiplayer, open a second browser window (or use a private/incognito window),
create a second account, and log in — you should see the other character in the world.

### 8.3 Check the API status endpoint

```bash
curl -s http://localhost:8787/api/status
```

Expected:

```json
{"ok":true,"players_online":0,"realm":"Claudemoon","version":"..."}
```

### 8.4 Check Postgres connectivity

**Option A:**

```bash
psql postgres://eastbrook:<POSTGRES_PASSWORD>@127.0.0.1:5433/eastbrook -c "\dt"
```

**Option B (Supabase CLI):**

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\dt"
```

You should see all game tables: `accounts`, `auth_tokens`, `characters`, `world_state`,
`chat_log`, `arena_queue`, `arena_bouts`, etc.

---

## 9. Grant Yourself Admin Access

After creating an in-game account in online mode (Step 8.2):

**Option A (Docker Compose):**

```bash
psql postgres://eastbrook:<POSTGRES_PASSWORD>@127.0.0.1:5433/eastbrook \
  -c "UPDATE accounts SET is_admin = TRUE WHERE username = 'your-username';"
```

**Option B (Supabase CLI):**

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "UPDATE accounts SET is_admin = TRUE WHERE username = 'your-username';"
```

Or use the convenience script (works for both database options):

```bash
npm run admin:grant -- your-username
# To revoke:
npm run admin:grant -- your-username --revoke
```

### Accessing the admin dashboard locally

The admin dashboard is always available at the `/admin` path — no extra configuration
needed for local dev:

```
http://localhost:5173/admin    ← via Vite dev server (recommended, has HMR)
http://localhost:8787/admin    ← directly on the game server port
```

Log in with your admin account. The server detects `/admin` as the admin shell
regardless of what hostname or port you use.

> **How the admin detection works:** The server serves `admin.html` (the admin SPA)
> when either the URL path is `/admin`, or the `Host` header starts with `admin.`, or
> the `Host` header exactly matches the `ADMIN_HOSTNAME` env var. In production you can
> reach the admin panel on a separate subdomain or a fully custom hostname — see
> [SETUP-DIGITALOCEAN.md Step 9](SETUP-DIGITALOCEAN.md#9-configure-and-access-the-admin-dashboard)
> for all three options with Caddy configuration examples.

---

## 10. Running Tests

### Full test suite

```bash
npm test
```

The test runner (`vitest`) automatically runs the i18n build pipeline before executing
tests. The suite covers: combat formulas, all 9 classes, quests, parties, duels, trades,
elites, the crypt instance, arena, and chat localization.

### Single test file (faster iteration)

```bash
npx vitest run tests/sim.test.ts
npx vitest run tests/combat.test.ts
npx vitest run tests/localization_fixes.test.ts
```

### Watch mode (re-runs on save)

```bash
npx vitest
```

### Type-check only (no tests)

```bash
npx tsc --noEmit
```

### i18n artifact generation (required before committing changes to UI strings)

```bash
npm run i18n:gen
```

This regenerates the type-checked locale files in `src/ui/i18n.resolved.generated/`.
If you changed any i18n keys without running this, `git diff` will show a diff and the
CI check will fail.

---

## 11. Running E2E and Browser Scripts

These scripts drive real browsers via Puppeteer. They require **both servers running**
(`npm run server` and `npm run dev`).

### One-time setup: install Chromium

```bash
npx puppeteer browsers install chrome
```

### Smoke tests (single-class E2E)

```bash
node scripts/smoke_browser.mjs    # warrior: combat, loot, vendor, quest
node scripts/smoke_mage.mjs       # mage: casting, polymorph, conjure+drink, death/release
node scripts/smoke_rogue.mjs      # rogue: combo points, eviscerate, vendor, eating
```

### Visual tour (screenshot tour into `tmp/`)

```bash
node scripts/visual_tour.mjs
node scripts/tour_temple.mjs      # Glimmermere + Drowned Temple
```

### Multiplayer integration suite (26 checks)

```bash
node scripts/mp_integration.mjs   # REST + WS + persistence checks (server running)
node scripts/mp_browser.mjs       # two real browser clients see each other
```

### Bot-driven scripts (require `ALLOW_DEV_COMMANDS=1`)

Add this line to your `.env` before running these:

```env
ALLOW_DEV_COMMANDS=1
```

Then restart `npm run server` and run:

```bash
node scripts/crypt_raid.mjs       # five bots clear the Hollow Crypt
node scripts/social_e2e.mjs       # trade + duel over the wire
node scripts/arena_visual.mjs     # two clients queue + fight a ranked 1v1
```

> **Never set `ALLOW_DEV_COMMANDS=1` on any server reachable from the internet.** It
> enables level/teleport/item cheat commands.

---

## 12. Environment Variable Reference

All variables for local development live in `.env` in the project root.

### Server runtime variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | Postgres connection string. Option A: `postgres://eastbrook:<pw>@127.0.0.1:5433/eastbrook`. Option B: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`. |
| `POSTGRES_PASSWORD` | Yes (for docker-compose) | — | Password for the `eastbrook` Postgres user. Only read by `docker-compose.yml`; not used directly by the server (which reads `DATABASE_URL`). Must match the password in `DATABASE_URL`. |
| `PORT` | No | `8787` | HTTP + WebSocket port. |
| `EASTBROOK_MEDIA_DIR` | No | `./media-cache` | Directory for persistent media files. Default is fine locally. |
| `REALM_NAME` | No | `Claudemoon` | Realm name shown to players. |
| `REALM_TYPE` | No | `Normal` | Realm type: `Normal`, `PvP`, `RP`, `RP-PvP`. |
| `PUBLIC_ORIGIN` | No | — | Canonical origin for absolute URLs. Leave unset locally. |
| `WIKI_URL` | No | `http://localhost:8080/wiki/...` | Where `/wiki` redirects go. |
| `ADMIN_HOSTNAME` | No | — | Leave unset locally. The `/admin` path always works for local dev. In production, set to a custom admin hostname if it does not follow the `admin.*` prefix pattern. |
| `TURNSTILE_SECRET` | No | — | Leave empty locally (gate disabled). |
| `RESTART_COUNTDOWN_SECRET` | No | — | Leave empty locally. |
| `CHAT_LOG_RETENTION_DAYS` | No | `90` | Days to keep chat logs. |
| `TRUSTED_PROXY_IPS` | No | (auto) | Leave unset locally. |
| `USERNAME_BANLIST` | No | — | Inline banned username terms. |
| `USERNAME_BANLIST_FILE` | No | — | Path to banned username terms file. |
| `ALLOW_DEV_COMMANDS` | No | — | Set to `1` for E2E bot scripts only. **Never in production.** |
| `ELEVENLABS_API_KEY` | No | — | Only needed for NPC voice generation scripts. |
| `SOLANA_RPC_URL` | No | Solana mainnet public | Solana RPC endpoint. |
| `WOC_MINT` | No | canonical mint | $WOC token mint. |

### Client build-time variables (Vite inlines these)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_TURNSTILE_SITEKEY` | No | — | Turnstile public site key. Empty = widget not rendered. Leave unset locally. |
| `VITE_WALLET_DISABLED` | No | — | Set to `1` to hide the wallet-link UI. |

### MediaWiki variables (only if running the full `docker compose up` stack)

| Variable | Default | Description |
|---|---|---|
| `MEDIAWIKI_DB_NAME` | `mediawiki` | MediaWiki database name (MariaDB). |
| `MEDIAWIKI_DB_USER` | `mediawiki` | MediaWiki database user. |
| `MEDIAWIKI_DB_PASSWORD` | `mediawiki-change-me` | MediaWiki database password. Change for any real deployment. |
| `MEDIAWIKI_ADMIN_USER` | `WikiAdmin` | Admin username for the wiki. |
| `MEDIAWIKI_ADMIN_PASS` | `change-me-admin-password` | Admin password for the wiki. Change immediately. |
| `MEDIAWIKI_SERVER` | `http://localhost:8080` | Public origin of the wiki. Change to your domain in production. |
| `MEDIAWIKI_SECRET_KEY` | (generated) | Long random key for MediaWiki sessions. Use a random 64-char string in production. |
| `MEDIAWIKI_UPGRADE_KEY` | (generated) | Protects the MediaWiki upgrade script. |

---

## 13. Multiple Realms Locally

To run two realms on your Mac simultaneously:

```bash
# Terminal 1 — Realm 1 (Claudemoon on 8787)
REALM_NAME=Claudemoon PORT=8787 node dist-server/server.cjs

# Terminal 2 — Realm 2 (Ironforge on 8788, same DATABASE_URL)
REALM_NAME=Ironforge PORT=8788 node dist-server/server.cjs
```

Or use the built-in multi-realm script:

```bash
npm run realms
```

This starts both realm processes from a single command. Each realm is isolated — players
in Claudemoon and Ironforge cannot see each other.

---

## 14. Troubleshooting

### `npm install` fails

- Confirm you are on Node.js 22: `node --version`
- Clear the npm cache: `npm cache clean --force && npm install`
- On Apple Silicon, some native modules may need Rosetta. Try:
  `arch -x86_64 npm install` (rare with this project's dependencies)

### `npm run server` — `ECONNREFUSED` or `database connection failed`

- The Postgres container is not running.
  - Option A: `npm run db:up` (then `docker compose ps` to verify `eastbrook-db` is healthy)
  - Option B: `supabase start` (then `supabase status` to check state)
  - Option C: no container needed — verify your `DATABASE_URL` in `.env` is set correctly
    (see step C.1 for how to find it in the Supabase dashboard).
- The `DATABASE_URL` in `.env` does not match the running database.
  - Option A: check that the password in `DATABASE_URL` matches `POSTGRES_PASSWORD` in `.env`.
  - Option B: confirm the port is `54322` (not 5432 or 5433).
  - Option C: confirm the password in the URL is your Supabase database password (not your
    Supabase login password). Reset it under Settings > Database if needed.

### Option C — server connects but SSL or timeout errors

Some network environments (VM NAT, corporate firewalls) block outbound port 5432 to
Supabase's direct connection host.

1. Try the **Session pooler** URL instead (Settings > Database > Connection pooling >
   Session mode, port 5432 on a different host):
   ```env
   DATABASE_URL=postgres://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
2. If the VM's NAT blocks all outbound Postgres traffic, open port 5432 in your UTM
   network settings or switch to a bridged network adapter.
3. Test connectivity directly from the VM:
   ```bash
   # Should print the Postgres version if the connection works:
   psql "postgres://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" -c "SELECT version();"
   ```

### `npm run dev` — blank page or websocket errors in browser console

- Make sure `npm run server` is running first — the Vite proxy forwards `/api` and `/ws`
  to `:8787`.
- Check for port conflicts: `lsof -i :8787` and `lsof -i :5173`.

### Port 5433 already in use

Another process (or a previous Docker container) is using port 5433. Find and stop it:

```bash
lsof -i :5433
# Then kill the PID shown, or:
docker ps -a    # look for a stopped eastbrook-db
docker rm eastbrook-db
npm run db:up
```

### Docker Desktop not starting

- Ensure macOS is up to date (Docker Desktop requires macOS 12 Monterey or later).
- Try: **Docker Desktop menu → Troubleshoot → Reset to factory defaults**.

### Schema not created (tables missing)

If you run `psql` and see no tables, the server failed during startup schema setup.
Check server logs for errors like `permission denied` or `advisory lock timeout`.

A common cause with Supabase CLI is connecting to the wrong port. Confirm:

```bash
# Should show the postgres service on port 54322
supabase status
```

Then verify `DATABASE_URL` in `.env` uses port `54322`.

### `npm test` — i18n artifact is out of date

If you see a diff error on the generated locale files:

```bash
npm run i18n:gen
git add src/ui/i18n.resolved.generated src/admin/i18n.resolved.generated src/ui/i18n.status.summary.json
npm test
```

### `npm run dev` shows Vite warning about `VITE_*` variables

This is expected if you leave `VITE_TURNSTILE_SITEKEY` empty — the Turnstile widget
simply does not render locally, which is correct. You do not need Turnstile for local
development.

### Supabase Studio shows empty tables after server starts

The game schema is separate from the Supabase public schema. Run from Studio's SQL
editor:

```sql
\dt
-- or
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

If tables are present, they appear in Studio under **Table Editor → public schema**.

### Reset local database completely

**Option A:**

```bash
npm run db:down   # stops and removes the postgres container and its volume
npm run db:up     # starts fresh (all data wiped)
```

**Option B:**

```bash
supabase stop --no-backup   # wipes all local Supabase data
supabase start              # fresh start
```

Then restart `npm run server` to re-apply the schema.
