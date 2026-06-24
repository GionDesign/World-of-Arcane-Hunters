# Local Development with Supabase

This guide is for the **fork operator** — it assumes you have an existing Supabase
project running in production (see `docs/SETUP-DIGITALOCEAN.md`) and want to run the
game server locally against either a **local Supabase instance** (fast, free, offline)
or your **live production database** (to debug real player data or schema issues).

By the end you will be able to:

- Run the game server locally with a local Supabase instance (no cost, no internet needed)
- Switch to your live production Supabase with a single command
- Run both the Vite client dev server and the game server locally
- Grant yourself admin, run tests, and use E2E scripts

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone and Install](#2-clone-and-install)
3. [Set Up Local Supabase](#3-set-up-local-supabase)
4. [Configure Environment Files](#4-configure-environment-files)
5. [Switching Between Local and Production Database](#5-switching-between-local-and-production-database)
6. [Start the Servers](#6-start-the-servers)
7. [Verify Everything Works](#7-verify-everything-works)
8. [Grant Yourself Admin](#8-grant-yourself-admin)
9. [Running Tests](#9-running-tests)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### Node.js 22

The project requires Node.js 22. The recommended way is via `nvm`:

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc   # or ~/.bashrc

# Install and use Node.js 22
nvm install 22
nvm use 22
nvm alias default 22
node --version    # should print v22.x.x
```

### Docker Desktop

Docker Desktop runs the local Supabase stack in containers.

Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
After installing, launch Docker Desktop and wait for it to reach a steady state
(the icon in the menu bar stops animating).

Verify:

```bash
docker --version           # Docker version 27.x.x or newer
docker compose version     # Docker Compose version v2.x.x or newer
```

### Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (winget)
winget install Supabase.CLI

# Linux
brew install supabase/tap/supabase   # Homebrew on Linux also works

supabase --version   # should print 1.x.x or higher
```

### PostgreSQL client (for running raw SQL)

```bash
# macOS
brew install libpq
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Ubuntu / Debian
sudo apt-get install -y postgresql-client

psql --version
```

---

## 2. Clone and Install

```bash
git clone https://github.com/giondesign/world-of-arcane-hunters.git
cd world-of-arcane-hunters

# If working from your personal fork:
git clone https://github.com/<your-username>/world-of-arcane-hunters.git
cd world-of-arcane-hunters
git remote add upstream https://github.com/giondesign/world-of-arcane-hunters.git

# Switch to the deployment branch
git checkout claude/friendly-albattani-23ybq8

npm install
```

---

## 3. Set Up Local Supabase

This step starts the full Supabase stack on your machine: Postgres 16, Studio
(web dashboard), Auth, and Storage. It mirrors the production Supabase environment.

### 3.1 Initialize Supabase in the project (one-time)

```bash
supabase init
```

This creates a `supabase/` directory with a config file. The directory is in
`.gitignore` so it does not affect the repo.

### 3.2 Start the local Supabase stack

```bash
supabase start
```

Docker Desktop must be running. First run downloads several images (~2 GB total) and
takes 2–5 minutes. Subsequent starts take about 10–20 seconds.

When complete you will see output like:

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

**Your local database connection string is:**

```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 3.3 (Optional) Open Supabase Studio

Supabase Studio is a full database dashboard — the same UI as cloud Supabase, running
locally. Open it at the Studio URL shown above (usually `http://127.0.0.1:54323`).

You can browse tables, run SQL queries, and inspect data here. It is very useful when
debugging schema issues or inspecting character saves locally.

### 3.4 Stop the local Supabase stack

```bash
# Stop all containers but keep your local data:
supabase stop

# Stop and wipe all local data (full reset):
supabase stop --no-backup
```

---

## 4. Configure Environment Files

Rather than editing `.env` directly each time you switch databases, use two separate
files: one for local, one for production. A script swaps them.

### 4.1 Create the local database env file

Create `.env.local-db` in the project root:

```bash
cat > .env.local-db << 'EOF'
# ── LOCAL SUPABASE ────────────────────────────────────────────────────────────
# Connect to local Supabase CLI instance (supabase start must be running).

DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
POSTGRES_PASSWORD=local-dev-not-used

PORT=8787
EASTBROOK_MEDIA_DIR=./media-cache

# Realm identity
REALM_NAME=Claudemoon
# REALM_TYPE=Normal

# Leave these empty for local dev (bot gate disabled)
# TURNSTILE_SECRET=
# VITE_TURNSTILE_SITEKEY=

# Dev commands — only for E2E bot scripts, never in production
# ALLOW_DEV_COMMANDS=1
EOF
```

### 4.2 Create the production database env file

> **Important:** This file contains your real production `DATABASE_URL`. It is
> gitignored (`.env.*` files are in `.gitignore`) so it will never be committed.
> Verify with `git status` that it shows up under "Untracked files" and is NOT
> staged.

Create `.env.prod-db` in the project root:

```bash
cat > .env.prod-db << 'EOF'
# ── PRODUCTION SUPABASE ───────────────────────────────────────────────────────
# Connects to the live Supabase instance.
# WARNING: this runs against real player data. Be careful.

DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
POSTGRES_PASSWORD=not-used-locally

PORT=8787
EASTBROOK_MEDIA_DIR=./media-cache

REALM_NAME=Claudemoon
# REALM_TYPE=Normal

# Leave these empty for local dev
# TURNSTILE_SECRET=
# VITE_TURNSTILE_SITEKEY=
EOF
```

Replace the `DATABASE_URL` value with your actual Supabase Session connection string
from Step 2 of `docs/SETUP-DIGITALOCEAN.md`. Use port **5432**, not 6543.

### 4.3 Add a switching script

Add this to `package.json` under `"scripts"` (or run the commands directly):

Open `package.json`, find the `"scripts"` block, and add two lines:

```json
"db:local": "cp .env.local-db .env && echo 'Switched to LOCAL Supabase'",
"db:prod": "cp .env.prod-db .env && echo 'Switched to PRODUCTION Supabase (WARNING: real data)'"
```

After adding these scripts you can switch with:

```bash
npm run db:local    # point to local Supabase CLI instance
npm run db:prod     # point to production Supabase
```

> **How it works:** Both commands simply overwrite `.env` with the chosen file. The
> game server reads `.env` at startup. Restart `npm run server` after switching.

### 4.4 Initial setup — start with local

For first-time setup, always start with local:

```bash
npm run db:local
```

Verify `.env` now contains your local database URL:

```bash
grep DATABASE_URL .env
# Should print: DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

---

## 5. Switching Between Local and Production Database

This is the core workflow for day-to-day development.

### Switch to local Supabase (default for development)

```bash
# 1. Make sure local Supabase is running
supabase start     # skip if already running (supabase status to check)

# 2. Switch .env to local
npm run db:local

# 3. Restart the game server
# (Ctrl+C the running server, then:)
npm run server
```

You are now running against a local database. All player accounts, characters, and
world state are isolated on your machine. Safe to experiment freely.

### Switch to production Supabase

```bash
# 1. Stop local Supabase (optional — saves memory, not required)
supabase stop

# 2. Switch .env to production
npm run db:prod

# 3. Restart the game server
npm run server
```

You are now running the game server locally but connected to the live production
database. This is useful for:
- Debugging a production schema issue locally
- Granting admin to a player without SSH-ing to the Droplet
- Running a SQL query against live data before executing it on the server

> **Warning:** Any changes you make while connected to production affect real players.
> Do not run with `ALLOW_DEV_COMMANDS=1` or run E2E bot scripts in this mode.

### Check which database you are currently pointed at

```bash
grep DATABASE_URL .env
```

- `127.0.0.1:54322` = local Supabase
- `pooler.supabase.com` = production Supabase

---

## 6. Start the Servers

You need two servers running side by side. Open two terminal windows.

### Terminal 1 — Game server

```bash
npm run server
```

Expected startup output:

```
[db] schema ready (tables created or verified)
[server] listening on 0.0.0.0:8787
[game] realm "Claudemoon" started — tick rate 20 Hz
```

> The schema creates itself automatically on first boot against a fresh database.
> No separate migration step is needed.

Leave this terminal open. Use `Ctrl+C` to stop the server (characters are saved on
graceful shutdown).

### Terminal 2 — Vite dev client

```bash
npm run dev
```

Expected output:

```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser.

> The Vite dev server proxies `/api`, `/admin/api`, and `/ws` to the game server on
> `:8787`. Both servers must be running for online play to work.

---

## 7. Verify Everything Works

### Offline mode (no database needed)

1. Open `http://localhost:5173`.
2. Click **Play Offline**.
3. Create a character, click **Enter World**.
4. You should load into Eastbrook Vale. Try moving and attacking.

Offline mode runs entirely in the browser. The game server and database are not used.

### Online mode (both servers must be running)

1. Open `http://localhost:5173`.
2. Click **Play Online**.
3. Click **Create Account**, enter a username and password.
4. Click **Create Character**, pick a class.
5. Click **Enter World**.

To test multiplayer, open a second private browser window, create another account,
and log in — both characters should appear in the world.

### API health check

```bash
curl -s http://localhost:8787/api/status | python3 -m json.tool
```

Expected:

```json
{
  "ok": true,
  "players_online": 0,
  "realm": "Claudemoon",
  "version": "..."
}
```

### Confirm database connection

**Local Supabase:**

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\dt"
```

**Production Supabase (when switched):**

```bash
psql "$(grep DATABASE_URL .env | cut -d= -f2-)" -c "\dt"
```

You should see all game tables: `accounts`, `characters`, `chat_log`, etc.

---

## 8. Grant Yourself Admin

After creating an account in online mode:

**Local Supabase:**

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "UPDATE accounts SET is_admin = TRUE WHERE username = 'your-username';"
```

**Production Supabase (when switched):**

```bash
psql "$(grep DATABASE_URL .env | cut -d= -f2-)" \
  -c "UPDATE accounts SET is_admin = TRUE WHERE username = 'your-username';"
```

The admin dashboard is always available at:

```
http://localhost:5173/admin    (via Vite — recommended, has HMR)
http://localhost:8787/admin    (directly on the game server)
```

No extra configuration needed for local dev — the `/admin` path always triggers the
admin shell regardless of hostname.

---

## 9. Running Tests

### Full suite

```bash
npm test
```

Tests always run against local code. They spin up their own in-memory sim and do not
connect to any database — switching between local and production has no effect on tests.

### Single file (faster iteration)

```bash
npx vitest run tests/sim.test.ts
npx vitest run tests/combat.test.ts
npx vitest run tests/localization_fixes.test.ts
```

### Type-check only

```bash
npx tsc --noEmit
```

### E2E bot scripts (require `ALLOW_DEV_COMMANDS=1` and local database)

Switch to local first:

```bash
npm run db:local
```

Add `ALLOW_DEV_COMMANDS=1` to `.env.local-db` temporarily (or edit `.env` directly),
then restart `npm run server`:

```bash
node scripts/crypt_raid.mjs       # five bots clear the Hollow Crypt
node scripts/social_e2e.mjs       # trade + duel over the wire
node scripts/mp_integration.mjs   # REST + WS + persistence checks
```

> **Never run E2E bot scripts against production.** They create, level, and delete test
> accounts and can generate significant database writes.

---

## 10. Troubleshooting

### `supabase start` fails or hangs

- Confirm Docker Desktop is running and has enough resources (at least 4 GB RAM allocated).
- Try: `supabase stop --no-backup && supabase start` for a clean restart.
- On Apple Silicon (M1/M2/M3/M4), ensure Docker Desktop is set to use the native ARM engine.

### `npm run server` — `ECONNREFUSED` or `database connection failed`

- Check which database `.env` currently points at: `grep DATABASE_URL .env`
- **Local:** is `supabase start` running? Check with `supabase status`.
- **Production:** confirm the URL is correct and the Supabase project is not paused
  (free-tier projects pause after 7 days of inactivity — visit supabase.com to resume).

### The schema is not created on fresh local Supabase

The game server applies the schema at startup. If you connected before the server ran,
the tables will be missing. Start `npm run server` and look for `[db] schema ready` in
the output. Then reconnect with `psql` or Studio.

### Switched to production but still seeing local data

Restart `npm run server` after switching `.env`. The server only reads `DATABASE_URL`
at startup, not continuously.

### `supabase status` shows a different DB port

The Supabase CLI may assign a different port if the default is in use. Check the DB URL
from `supabase status` and update `.env.local-db` to match, then re-run `npm run db:local`.

### Production connection refused from local machine

Supabase production databases accept connections from any IP by default. If you added
IP allowlists in Supabase project settings, you may need to add your local public IP.
Check **Supabase project settings → Database → Network restrictions**.

### Port 5173 or 8787 already in use

```bash
lsof -i :5173   # find what is using the Vite port
lsof -i :8787   # find what is using the game server port
kill <PID>      # stop the conflicting process
```

### Reset local Supabase completely

```bash
supabase stop --no-backup   # wipes all local data
supabase start              # fresh stack
npm run db:local            # re-apply local .env
npm run server              # re-applies the schema
```

Testing deployment