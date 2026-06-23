# Deploying World of Arcane Hunters — DigitalOcean + Supabase

This guide walks through a complete production deployment on a DigitalOcean Droplet
backed by Supabase for Postgres. The full stack is:

- **Supabase** — managed Postgres 16 (external DB, no local Postgres on the Droplet)
- **DigitalOcean Container Registry** — stores your Docker images
- **DigitalOcean Droplet** — Ubuntu 24.04 VPS that runs the game container
- **Caddy** — TLS reverse proxy (automatic Let's Encrypt; WebSocket-aware)
- **GitHub Actions** — CI/CD pipeline: test → build → push → deploy on every `release/**` push

**Estimated cost:** ~$12/month (Droplet, 1 vCPU / 2 GB RAM) + $0 (Supabase free tier). Upgrade
to Supabase Pro ($25/month) once you have regular players to disable free-tier auto-pause.

---

## Domain naming convention used in this guide

Every example that says `world.example.com` or `admin.world.example.com` is a
**placeholder for your own domain**. Replace them consistently throughout. Common patterns:

| Use case | Example |
|---|---|
| Subdomain of your personal site | `world.yourdomain.com` |
| Root domain | `yourgame.com` |
| Admin via path (no extra DNS) | `world.yourdomain.com/admin` |
| Admin as a second subdomain | `admin.world.yourdomain.com` |
| Admin as a fully separate hostname | `admin-world.yourdomain.com` (needs `ADMIN_HOSTNAME`) |

See [Step 9](#9-configure-and-access-the-admin-dashboard) for a full explanation of
all three admin access options and when to use each.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create the Supabase Project](#2-create-the-supabase-project)
3. [Create the DigitalOcean Container Registry](#3-create-the-digitalocean-container-registry)
4. [Create the DigitalOcean Droplet](#4-create-the-digitalocean-droplet)
5. [Provision the Droplet](#5-provision-the-droplet)
6. [Configure GitHub Secrets](#6-configure-github-secrets)
7. [Configure Cloudflare Turnstile (Optional Bot Gate)](#7-configure-cloudflare-turnstile-optional-bot-gate)
8. [Trigger the First Deploy](#8-trigger-the-first-deploy)
9. [Configure and Access the Admin Dashboard](#9-configure-and-access-the-admin-dashboard)
10. [Environment Variable Reference](#10-environment-variable-reference)
11. [Ongoing Operations](#11-ongoing-operations)
12. [Multiple Realms](#12-multiple-realms)
13. [Surviving Upstream Updates with a Custom Domain](#13-surviving-upstream-updates-with-a-custom-domain)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

Before starting you need:

- A **GitHub account** with this repository forked or cloned under your user/org.
- A **DigitalOcean account** — [cloud.digitalocean.com](https://cloud.digitalocean.com).
- A **Supabase account** — [supabase.com](https://supabase.com).
- A **registered domain name** with access to DNS (e.g. `play.yourgame.com`). You can
  test without one first by IP, but HTTPS/WSS requires a domain.
- (Optional) A **Cloudflare account** to set up the Turnstile bot gate.

You do **not** need to install anything locally for the production deploy — GitHub Actions
does the building. If you want to test locally before pushing, see
[SETUP-LOCAL-MAC.md](SETUP-LOCAL-MAC.md).

---

## 2. Create the Supabase Project

### 2.1 Sign in and create a project

1. Go to [supabase.com](https://supabase.com) → **Sign In** → **New project**.
2. Give it a name (e.g. `world-of-arcane-hunters`).
3. Choose an **organization** (create one if needed).
4. Select a **region** geographically close to your DigitalOcean Droplet:
   - NYC3 Droplet → `us-east-1` Supabase
   - AMS3 Droplet → `eu-west-2` Supabase
   - SFO3 Droplet → `us-west-1` Supabase
5. Set a **strong database password** (use a random generator — 32+ characters, mixed
   case/digits/symbols). **Save it somewhere safe immediately.** Supabase does not let
   you retrieve it later from the dashboard; you can only reset it.
6. Click **Create new project** and wait ~2 minutes for provisioning to complete.

### 2.2 Copy the connection string

1. In your Supabase project, go to **Project Settings** (gear icon) → **Database**.
2. Scroll to **Connection string** → select the **Session** tab (not "Transaction").
3. Copy the connection string for **port 5432**. It looks like:
   ```
   postgresql://postgres.[project-ref]:[your-password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
   Replace `[your-password]` with the password you set in step 2.1.5.

> **Why port 5432, not 6543?**
> Port 6543 uses PgBouncer in transaction-pooling mode, which is incompatible with
> Postgres advisory locks (`pg_advisory_xact_lock`). The game server uses an advisory
> lock during schema setup to safely handle concurrent boots. Always use the Session
> connection on port 5432.

This connection string is your `DATABASE_URL`. Store it securely — you will add it to
the Droplet's `.env` file in Step 5, **not** to GitHub secrets.

### 2.3 Note the free-tier auto-pause behavior

On the Supabase free tier, a project **auto-pauses after 7 days with no database queries**.
Step 5 includes a daily cron job that prevents this. If you upgrade to Supabase Pro the
auto-pause is disabled permanently.

---

## 3. Create the DigitalOcean Container Registry

The registry stores your Docker images between GitHub Actions (push) and the Droplet (pull).

1. In the DigitalOcean console, go to **Container Registry** in the left menu.
2. Click **Create Registry**.
3. Choose a name (e.g. `woc` or `arcane-hunters`). This slug is your `DO_REGISTRY_NAME`.
   The full registry URL will be `registry.digitalocean.com/<DO_REGISTRY_NAME>`.
4. Select the **Starter** plan (free, 500 MB storage — sufficient for one game image).
5. Click **Create Registry**.

### 3.1 Create a DigitalOcean API token

This token lets GitHub Actions push images to the registry.

1. In the DigitalOcean console, go to **API** in the left menu → **Tokens** tab.
2. Click **Generate New Token**.
3. Give it a name: `woc-ci` or similar.
4. Set expiration: choose **No expiry** for a production CI token (or set a calendar
   reminder to rotate it if you prefer expiring tokens).
5. Under **Scopes**, grant **Read** and **Write**.
6. Click **Generate Token**.
7. **Copy the token immediately** — DigitalOcean shows it only once. This is your
   `DO_REGISTRY_TOKEN`, and it goes into GitHub secrets in Step 6.

---

## 4. Create the DigitalOcean Droplet

### 4.1 Create the Droplet

In the DigitalOcean console, go to **Create → Droplets** and configure:

| Setting | Recommended value |
|---|---|
| Region | Match your Supabase region (e.g. NYC3 for us-east) |
| OS | Ubuntu 24.04 LTS (x86) |
| Droplet type | **Basic** |
| CPU | Premium AMD · 1 vCPU · 2 GB RAM · 50 GB SSD — **$12/month** |
| SSH keys | Click **New SSH Key**, paste your local public key (`~/.ssh/id_ed25519.pub` or similar) |
| Hostname | `woc-prod` (or any name you like) |
| Backups | Optional — enable weekly automated backups (+20% of Droplet cost) |

Click **Create Droplet** and wait for it to appear with a green status dot (~30 seconds).

### 4.2 Assign a Reserved IP

A reserved IP stays the same even if you later resize, rebuild, or destroy and recreate
the Droplet. This is critical so your DNS record stays stable.

1. In the DigitalOcean console, go to **Networking → Reserved IPs**.
2. Click **Reserve a Regional IP** → choose the same region as your Droplet → **Reserve IP**.
3. In the dropdown next to the new IP, click **Assign to Droplet** → select `woc-prod`.

Note this reserved IP — it goes into GitHub secrets as `DROPLET_IP` in Step 6.

### 4.3 Point your domain at the Droplet

In your domain registrar's DNS settings (or Cloudflare, or DigitalOcean Domains), create
an A record for each hostname you want. The game only needs **one** A record. The admin
panel can share the same record or use a separate one — see the options below.

**Game on a subdomain (most common):**

```
Type:  A
Name:  world        ← makes world.yourdomain.com
Value: <reserved IP>
TTL:   3600
```

**Game on the root domain:**

```
Type:  A
Name:  @
Value: <reserved IP>
TTL:   3600
```

**Admin on a second subdomain** (only needed for Option B or C in Step 9):

```
Type:  A
Name:  admin.world  ← makes admin.world.yourdomain.com
Value: <reserved IP>   ← same IP as the game record
TTL:   3600
```

Or for a fully custom admin hostname:

```
Type:  A
Name:  admin-world  ← makes admin-world.yourdomain.com
Value: <reserved IP>
TTL:   3600
```

DNS propagation can take up to 48 hours but is usually under 5 minutes with a low TTL.
Caddy cannot issue a TLS certificate until DNS resolves correctly.

> **Routing traffic through Cloudflare?** If you plan to enable the Cloudflare proxy
> (orange cloud icon), read [SETUP-CLOUDFLARE.md](SETUP-CLOUDFLARE.md) alongside this
> guide before continuing. It covers DNS record types for proxied vs. DNS-only mode,
> the SSL/TLS mode that must be set to avoid redirect loops with Caddy, which Cloudflare
> speed features to disable (Rocket Loader and Auto Minify break the game), and the Caddy
> `trusted_proxies` update required for rate limiting to see real player IPs.

---

## 5. Provision the Droplet

SSH in as root using the key you added in Step 4.1:

```bash
ssh root@<your-reserved-ip>
```

Run each block below in order.

### 5.1 Install Docker, Compose v2, Caddy, and PostgreSQL client

```bash
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y docker.io docker-compose-v2 caddy postgresql-client curl
systemctl enable --now docker
```

Verify Docker is running:

```bash
docker --version
docker compose version
caddy version
```

### 5.2 Create the app directory structure

```bash
mkdir -p /opt/eastbrook/media-cache
```

The `media-cache` directory is a persistent volume for content-hashed media files (GLB
models, textures). It survives container replacements so players do not re-download assets
on every deploy.

### 5.3 Write the runtime `.env` file

Replace every placeholder with your real values:

```bash
cat > /opt/eastbrook/.env << 'ENVEOF'
# ── Database ─────────────────────────────────────────────────────────────────
# Supabase Session connection string — MUST use port 5432, not 6543.
# Copied from Supabase Project Settings → Database → Connection string → Session.
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# ── Media volume ──────────────────────────────────────────────────────────────
# Absolute path to the host directory that persists media files across deployments.
EASTBROOK_MEDIA_DIR=/opt/eastbrook/media-cache

# ── Realm identity ───────────────────────────────────────────────────────────
# Name shown to players in the realm list. Letters, digits, spaces, _ and - up to 24 chars.
REALM_NAME=Claudemoon
# Realm type: Normal | PvP | RP | RP-PvP
REALM_TYPE=Normal

# ── Public origin (for player card Open Graph URLs) ──────────────────────────
# Set to your actual domain once it is live. Server-generated absolute links use this.
PUBLIC_ORIGIN=https://play.yourgame.com

# ── Bot gate (Cloudflare Turnstile) ──────────────────────────────────────────
# Server-side secret key. Unset or empty = gate disabled (no human verification).
# Obtain from Cloudflare dashboard → Turnstile → your site → Secret Key.
TURNSTILE_SECRET=

# ── Deploy countdown endpoint ─────────────────────────────────────────────────
# Long random value (openssl rand -hex 32) that guards /internal/restart-countdown.
# Leave empty if you don't use the graceful-restart countdown feature.
RESTART_COUNTDOWN_SECRET=

# ── Wiki redirect URL ────────────────────────────────────────────────────────
# Where the game server 302-redirects /wiki requests. Defaults shown; change to your
# public wiki URL if you run MediaWiki behind a reverse proxy.
# WIKI_URL=https://play.yourgame.com/wiki/index.php/Main_Page

# ── Chat logs ────────────────────────────────────────────────────────────────
# How many days of chat logs to retain. 0 = keep forever.
CHAT_LOG_RETENTION_DAYS=90

# ── Rate limiting ─────────────────────────────────────────────────────────────
# Comma-separated IPs whose X-Forwarded-For is trusted for rate-limiting.
# Default trusts loopback + RFC-1918 private ranges (correct for Caddy on same host).
# TRUSTED_PROXY_IPS=

# ── Username ban list ─────────────────────────────────────────────────────────
# Optional: inline comma-separated banned name terms. Or set a file path:
# USERNAME_BANLIST_FILE=/opt/eastbrook/username-banlist.txt
# USERNAME_BANLIST=

# ── Solana / $WOC integration ─────────────────────────────────────────────────
# Server-side only (never VITE_-prefixed). Set a dedicated RPC endpoint.
# SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# WOC_MINT=3WjLscH2JsXLEFJZRA9z8ti8yRGxWGKbqymPd7UicRth
ENVEOF

chmod 600 /opt/eastbrook/.env
```

> **Security note:** This file is readable only by root (`chmod 600`). It never gets
> committed to Git or uploaded to GitHub. The `DATABASE_URL`, `TURNSTILE_SECRET`, and
> `RESTART_COUNTDOWN_SECRET` stay on the Droplet only — the GitHub Actions workflow
> reads secrets for the registry/SSH, not for these runtime values.

### 5.4 Authenticate Docker with the DigitalOcean Container Registry

This saves the registry credentials to `/root/.docker/config.json` so every future
`docker pull` works without re-authenticating:

```bash
# Replace <YOUR_DO_REGISTRY_TOKEN> with the token from Step 3.1
echo "<YOUR_DO_REGISTRY_TOKEN>" | docker login registry.digitalocean.com \
  -u "<YOUR_DO_REGISTRY_TOKEN>" --password-stdin
```

You should see: `Login Succeeded`

### 5.5 Generate the deploy SSH keypair

GitHub Actions needs SSH access to the Droplet to upload `docker-compose.prod.yml` and
restart the container. Generate a dedicated keypair for this:

```bash
ssh-keygen -t ed25519 -f /root/.ssh/woc-deploy -N "" -C "woc-deploy-ci"
cat /root/.ssh/woc-deploy.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

Now print the **private key** — you will paste this into a GitHub secret:

```bash
echo ""
echo "=== Copy everything below into GitHub secret DROPLET_SSH_KEY ==="
cat /root/.ssh/woc-deploy
echo "=== End of key ==="
```

Copy the entire block including the `-----BEGIN OPENSSH PRIVATE KEY-----` and
`-----END OPENSSH PRIVATE KEY-----` lines.

### 5.6 Configure Caddy (TLS reverse proxy)

Choose the Caddy configuration that matches your admin dashboard preference. All three
options work — pick whichever suits your domain setup. Replace every `world.example.com`
with your actual domain.

---

**Option A — Admin at `/admin` path (same domain, no extra DNS record)**

This is the simplest option. The game and admin dashboard share the same hostname.
Navigate to `https://world.example.com/admin` to reach the dashboard.

```bash
cat > /etc/caddy/Caddyfile << 'EOF'
world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}
EOF
```

No `ADMIN_HOSTNAME` env var is needed. The `/admin` path is always detected by the
server regardless of hostname.

---

**Option B — Admin on `admin.world.example.com` (subdomain of your game domain)**

The game runs on `world.example.com` and the admin dashboard on `admin.world.example.com`.
Both point to the same Droplet IP and the same port 8787. Caddy issues separate TLS
certificates for each.

DNS: you need an A record for both `world.example.com` and `admin.world.example.com`
pointing at the same reserved IP (see Step 4.3).

```bash
cat > /etc/caddy/Caddyfile << 'EOF'
world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}

admin.world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}
EOF
```

No `ADMIN_HOSTNAME` env var is needed. The server detects any hostname starting with
`admin.` automatically.

---

**Option C — Admin on a fully custom hostname (e.g. `admin-world.example.com`)**

Use this when you want a hostname that does not follow the `admin.*` prefix pattern —
for example `admin-world.example.com`, `dashboard.example.com`, or any other name.
This requires setting `ADMIN_HOSTNAME` in `/opt/eastbrook/.env`.

DNS: A record for both `world.example.com` and your chosen admin hostname (Step 4.3).

```bash
cat > /etc/caddy/Caddyfile << 'EOF'
world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}

admin-world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}
EOF
```

Then add `ADMIN_HOSTNAME` to `/opt/eastbrook/.env`:

```bash
# In /opt/eastbrook/.env — add this line:
ADMIN_HOSTNAME=admin-world.example.com
```

---

After writing the Caddyfile, enable and start Caddy:

```bash
systemctl enable caddy
systemctl restart caddy
```

Caddy automatically obtains and renews Let's Encrypt TLS certificates. The game's
WebSocket connections are proxied transparently — no extra configuration needed. The
client automatically switches to `wss://` when loaded over `https://`.

Verify Caddy started cleanly:

```bash
systemctl status caddy
journalctl -u caddy --no-pager -n 20
```

> **DNS must resolve before Caddy can issue a certificate.** If your DNS is not
> propagated yet, Caddy will log an ACME challenge failure and retry automatically.
> This is fine — just wait and it will succeed once DNS is live.

> **Using Cloudflare proxy (orange cloud)?** The Caddy options above work as-is for
> routing and TLS. However, two additional steps are required:
>
> 1. **Add a global `trusted_proxies` block** at the top of the Caddyfile (before any
>    site blocks) with Cloudflare's published CIDR ranges. This tells Caddy to read the
>    real player IP from the `X-Forwarded-For` header that Cloudflare sets, instead of
>    treating all traffic as coming from Cloudflare's IPs. Without this, every player
>    shares Cloudflare's IP and the rate limiter fires on the first login.
> 2. **Set SSL/TLS mode to Full (strict)** in the Cloudflare dashboard for your domain.
>    Flexible mode causes an infinite redirect loop because Caddy redirects HTTP → HTTPS
>    while Cloudflare keeps sending HTTP to the origin.
>
> See [SETUP-CLOUDFLARE.md — Step 5](SETUP-CLOUDFLARE.md#5-update-caddy-for-cloudflare-ip-passthrough)
> for the complete Caddyfile snippet with all Cloudflare CIDR ranges included.

### 5.7 Supabase free-tier keep-alive cron job

Supabase pauses free projects after 7 days of inactivity. This daily cron job pings the
database at noon UTC to prevent that. Replace the DATABASE_URL placeholder:

```bash
cat > /etc/cron.d/supabase-keepalive << 'EOF'
0 12 * * * root psql "postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -c "SELECT 1" >/dev/null 2>&1
EOF
```

Verify the cron file has correct syntax:

```bash
crontab -l
cat /etc/cron.d/supabase-keepalive
```

---

## 6. Configure GitHub Secrets

### 6.1 Create a GitHub Environment named `production`

1. In your GitHub repository, go to **Settings → Environments**.
2. Click **New environment** → name it `production` → click **Configure environment**.
3. Optional: enable **Required reviewers** if you want a human approval step before
   each production deploy.
4. Optional: limit deployments to the `release/**` branch pattern.

### 6.2 Add secrets to the `production` environment

In the `production` environment configuration, click **Add secret** for each of these:

| Secret name | Where to get the value |
|---|---|
| `DO_REGISTRY_TOKEN` | The API token created in Step 3.1 |
| `DO_REGISTRY_NAME` | The registry name slug from Step 3 (e.g. `woc`) |
| `DROPLET_IP` | The reserved IP from Step 4.2 |
| `DROPLET_SSH_KEY` | The private key printed in Step 5.5 — include the full `-----BEGIN…-----END…` block |
| `VITE_TURNSTILE_SITEKEY` | Cloudflare Turnstile **site** key (see Step 7). Set to empty string `""` if not using Turnstile. |

> **Why doesn't `DATABASE_URL` go in GitHub secrets?**
> `DATABASE_URL` is a runtime secret that only the running container needs. It lives in
> `/opt/eastbrook/.env` on the Droplet. The GitHub Actions workflow connects to the
> Droplet via SSH and the container reads `.env` at startup. This keeps the DB password
> out of GitHub's secret store entirely, which is an additional layer of isolation.

> **`VITE_TURNSTILE_SITEKEY` is a public key.** Vite inlines every `VITE_*` variable
> into the client JavaScript bundle at build time. This key is designed to be public
> (it identifies your Turnstile widget, not a secret). Never put `DATABASE_URL` or any
> other secret into a `VITE_*` variable.

---

## 7. Configure Cloudflare Turnstile (Optional Bot Gate)

Turnstile is a CAPTCHA-like widget that blocks automated bot signups and logins.
If you do not set it up, the gate is simply disabled and anyone can register.

### 7.1 Create a Turnstile widget

1. Log into [Cloudflare dashboard](https://dash.cloudflare.com) → **Turnstile** in the
   left sidebar.
2. Click **Add widget**.
3. Give it a name (e.g. `World of Arcane Hunters — Production`).
4. Under **Hostnames**, add your game domain (e.g. `play.yourgame.com`).
5. Widget type: **Managed** (recommended — auto-adjusts challenge difficulty).
6. Click **Create**.
7. Copy both keys:
   - **Site Key** (public) → goes into GitHub secret `VITE_TURNSTILE_SITEKEY`
   - **Secret Key** (private) → goes into `/opt/eastbrook/.env` as `TURNSTILE_SECRET`

### 7.2 Add the secret key to the Droplet

```bash
# Edit the .env file and fill in TURNSTILE_SECRET
nano /opt/eastbrook/.env
# Find the line: TURNSTILE_SECRET=
# Add your secret key: TURNSTILE_SECRET=0x4AAAAAAAxxxx...
```

### 7.3 Add the site key to GitHub secrets

Update the `VITE_TURNSTILE_SITEKEY` secret in the `production` environment (Step 6.2)
with the Site Key value.

> **Both halves must be set, or the gate does nothing.** If `VITE_TURNSTILE_SITEKEY`
> is empty, no widget renders in the client. If `TURNSTILE_SECRET` is empty, the
> server skips verification. The gate is all-or-nothing.

---

## 8. Trigger the First Deploy

The deploy workflow runs automatically whenever you push to a `release/**` branch.

### 8.1 Push to a release branch

From your local machine (with the repository cloned):

```bash
git checkout -b release/1.0
git push origin release/1.0
```

Or from the GitHub web UI: **Branches → New branch**, name it `release/1.0`.

### 8.2 Watch the workflow

1. In your GitHub repository, click the **Actions** tab.
2. You should see a workflow run called **Deploy** triggered by your push.
3. Click it to watch the live log. The workflow runs these steps in order:

   ```
   Test → Build → Push → Deploy
   ```

   - **Test**: runs the full release-tier test suite including all 14 locales and TypeScript
     type-check. If any test fails, the deploy is aborted.
   - **Build**: runs `docker build` with `VITE_TURNSTILE_SITEKEY` baked into the client
     bundle. The image is tagged with the Git commit SHA and `latest`.
   - **Push**: uploads both tags to your DigitalOcean Container Registry.
   - **Deploy**: SSH into the Droplet, copy `docker-compose.prod.yml`, pull the new image,
     recreate the game container. Players are disconnected for ~5 seconds; all characters
     are saved on shutdown.

The first build takes ~4 minutes (npm install inside Docker). Subsequent builds are
faster due to layer caching.

### 8.3 Verify the deployment

Once the workflow shows green, run from the Droplet (or any machine with curl):

```bash
curl -s https://play.yourgame.com/api/status
```

Expected response:

```json
{"ok":true,"players_online":0,"realm":"Claudemoon","version":"..."}
```

Check the game server logs on the Droplet:

```bash
docker logs eastbrook-game --tail 50
```

You should see lines like:

```
[db] schema ready
[server] listening on 0.0.0.0:8787
[game] realm "Claudemoon" started — tick rate 20 Hz
```

---

## 9. Configure and Access the Admin Dashboard

The admin dashboard is a separate single-page app (`admin.html`) served by the same
game server process on the same port as the game. The server decides which HTML shell
to serve based on the incoming hostname or URL path. The actual security is the
`is_admin` flag on the account — the hostname is routing only.

### 9.1 How the server decides: game vs admin shell

The server serves `admin.html` when either of these is true:

| Trigger | Example | Requires config? |
|---|---|---|
| URL path is `/admin` or `/admin/` | `world.example.com/admin` | No |
| Host header starts with `admin.` | `admin.world.example.com` | No (just DNS + Caddy) |
| Host header exactly equals `ADMIN_HOSTNAME` | `admin-world.example.com` | Yes — set `ADMIN_HOSTNAME` |

Any other request gets the game shell (`index.html`).

### 9.2 Choose your admin access option

**Option A — Path-based (recommended for single-domain or subdomain setups)**

No extra DNS record, no env var. Just visit the `/admin` path on your game domain:

```
https://world.example.com/admin
```

Use this when your game is already on a subdomain (`world.example.com`) and you do
not want another subdomain to manage. It works immediately after deploy.

---

**Option B — `admin.world.example.com` subdomain**

Add an A record for `admin.world.example.com` pointing at the same reserved IP, and
add the Caddy block for it (both done in Steps 4.3 and 5.6). No env var needed.

The server auto-detects any hostname starting with `admin.` — so `admin.world.example.com`,
`admin.yourgame.com`, and `admin.anything.com` all trigger the admin shell if they
resolve to your Droplet.

---

**Option C — Fully custom admin hostname**

For a hostname that does not start with `admin.` (e.g. `admin-world.example.com` or
`dashboard.yourdomain.com`), set `ADMIN_HOSTNAME` in `/opt/eastbrook/.env`:

```env
ADMIN_HOSTNAME=admin-world.example.com
```

Then add that hostname to your DNS (Step 4.3) and Caddy (Step 5.6). Restart the
container after changing `.env`:

```bash
cd /opt/eastbrook
GAME_IMAGE=$(docker inspect eastbrook-game --format '{{.Config.Image}}') \
  docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate game
```

### 9.3 Create an in-game account and grant admin

1. Open your game URL in a browser (e.g. `https://world.example.com`) → **Play Online**
   → **Create Account**. Use the username you want as admin.

2. From the Droplet, grant the admin flag:

```bash
psql "$(grep ^DATABASE_URL /opt/eastbrook/.env | cut -d= -f2-)" \
  -c "UPDATE accounts SET is_admin = TRUE WHERE username = 'your-username';"
```

You should see: `UPDATE 1`

3. Navigate to the admin dashboard using whichever option you configured:
   - **Option A:** `https://world.example.com/admin`
   - **Option B:** `https://admin.world.example.com`
   - **Option C:** `https://admin-world.example.com` (or whatever hostname you set)

Log in with your admin account. The dashboard shows:
- Live player count and online sessions
- Account and character management
- Chat filter word lists (soft/hard tiers)
- Moderation and player reports
- Server health metrics

---

## 10. Environment Variable Reference

### Runtime variables (in `/opt/eastbrook/.env` on the Droplet)

These are read by the game server process at startup. They never leave the Droplet.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | Supabase Session connection string, port 5432. |
| `EASTBROOK_MEDIA_DIR` | **Yes** | `./media-cache` | Host directory for persistent media files. Set to `/opt/eastbrook/media-cache` in production. |
| `REALM_NAME` | No | `Claudemoon` | Realm name shown to players. Letters, digits, spaces, `_`, `-`, up to 24 chars. |
| `REALM_TYPE` | No | `Normal` | Realm type: `Normal`, `PvP`, `RP`, or `RP-PvP`. |
| `PUBLIC_ORIGIN` | No | — | Canonical origin for server-generated absolute URLs (e.g. player card Open Graph). Set to `https://play.yourgame.com`. |
| `PORT` | No | `8787` | HTTP + WebSocket port the server binds to. Change only if running multiple realms on one host. |
| `ADMIN_HOSTNAME` | No | — | Custom hostname that serves the admin dashboard. Unset = any `admin.*` subdomain triggers admin. Set to `admin-world.example.com` for a non-`admin.` prefix hostname. The `/admin` path always works regardless. |
| `TURNSTILE_SECRET` | No | — | Cloudflare Turnstile server-side secret. Empty = gate disabled. |
| `RESTART_COUNTDOWN_SECRET` | No | — | Guards `POST /internal/restart-countdown`. Set a random 32-byte hex value if you use graceful restart announcements. |
| `WIKI_URL` | No | `http://localhost:8080/wiki/...` | Where `/wiki` requests are 302-redirected. Set to your public wiki URL in production. |
| `CHAT_LOG_RETENTION_DAYS` | No | `90` | Days to keep chat logs. `0` = keep forever. |
| `TRUSTED_PROXY_IPS` | No | (loopback + private ranges) | Comma-separated IPs trusted to set `X-Forwarded-For` for rate limiting. Only change if your proxy connects from a non-private IP. **Do not set this for Cloudflare** — use Caddy `trusted_proxies` instead (see [SETUP-CLOUDFLARE.md](SETUP-CLOUDFLARE.md#5-update-caddy-for-cloudflare-ip-passthrough)). |
| `USERNAME_BANLIST` | No | — | Inline comma-separated banned username terms. |
| `USERNAME_BANLIST_FILE` | No | — | Path to a newline- or comma-separated file of banned username terms. |
| `CHAT_CENSOR_LIST` | No | — | Seeds the soft chat censor list on first boot only. Managed live in the admin dashboard thereafter. |
| `CHAT_CENSOR_FILE` | No | — | Path to a file that seeds the chat censor list on first boot. |
| `SOLANA_RPC_URL` | No | Solana mainnet public | RPC endpoint for reading $WOC token balances. Use a dedicated endpoint in production. |
| `WOC_MINT` | No | canonical mint | Override only if the $WOC token mint address changes. |
| `NATIVE_ATTESTATION_REQUIRED` | No | — | Set to `1` to require mobile app attestation (Google Play Integrity / Apple DeviceCheck) for native client builds. Web players are unaffected. |
| `GOOGLE_PLAY_INTEGRITY_SERVICE_ACCOUNT_JSON` | No | — | Google service account JSON for Android Play Integrity verification. Only needed for native Android builds. |
| `GOOGLE_PLAY_INTEGRITY_SIGNING_PEM` | No | — | PEM private key for signing Play Integrity tokens. |
| `GOOGLE_PLAY_INTEGRITY_PACKAGE_NAME` | No | — | Android package name (e.g. `com.worldofclaudecraft`). |
| `GOOGLE_PLAY_INTEGRITY_CERT_DIGESTS` | No | — | Expected certificate SHA-256 digests (comma-separated). |
| `GOOGLE_PLAY_INTEGRITY_DEVICE_VERDICT` | No | `MEETS_DEVICE_INTEGRITY` | Minimum device integrity verdict required. |
| `PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER` | No | — | Google Cloud project number for Play Integrity API. |
| `APPLE_TEAM_ID` | No | — | Apple Developer Team ID for iOS DeviceCheck. |
| `APPLE_BUNDLE_ID` | No | — | iOS app bundle ID (e.g. `com.worldofclaudecraft`). |
| `APPLE_DEVICECHECK_KEY_ID` | No | — | Key ID for the Apple DeviceCheck signing key. |
| `APPLE_DEVICECHECK_SIGNING_PEM` | No | — | PEM private key for Apple DeviceCheck token signing. |
| `APPLE_DEVICECHECK_ENV` | No | `production` | Apple DeviceCheck environment: `production` or `sandbox`. |
| `REALMS` | No | — | Comma-separated `Name=https://origin=Type` entries for the realm list screen. Required for multi-realm deployments. |
| `ALLOW_DEV_COMMANDS` | **NEVER** | — | **Never set this on a public server.** Enables cheat commands. Dev and test bots only. |

### Build-time variables (in GitHub `production` environment secrets)

These are read by the Docker build step in GitHub Actions and inlined into the client
JavaScript bundle by Vite. They are never available at server runtime.

| Variable / Secret | Required | Description |
|---|---|---|
| `VITE_TURNSTILE_SITEKEY` | No | Cloudflare Turnstile **public site key**. Renders the challenge widget. Empty = no widget. |
| `VITE_WALLET_DISABLED` | No | Set to `1` to hide the Solana wallet-link UI in this build. |

### CI/CD secrets (in GitHub `production` environment secrets)

| Secret | Description |
|---|---|
| `DO_REGISTRY_TOKEN` | DigitalOcean API token with registry Read + Write scope. |
| `DO_REGISTRY_NAME` | Registry name slug (e.g. `woc`). |
| `DROPLET_IP` | Reserved IP of the Droplet. |
| `DROPLET_SSH_KEY` | Full ED25519 private key for Droplet SSH access. |

---

## 11. Ongoing Operations

### Deploying updates

Every push to any `release/**` branch triggers a full deploy automatically.

To deploy the same code again (e.g. after updating `.env` on the Droplet):

```bash
ssh root@<reserved-ip>
cd /opt/eastbrook
GAME_IMAGE=$(docker inspect eastbrook-game --format '{{.Config.Image}}') \
  docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate game
```

### Viewing logs

```bash
# Live game server logs
docker logs -f eastbrook-game

# Last 100 lines
docker logs eastbrook-game --tail 100

# Filter for errors
docker logs eastbrook-game 2>&1 | grep -i error
```

### Health check

```bash
# From the Droplet
curl -s http://localhost:8787/api/status

# From any machine (over TLS)
curl -s https://play.yourgame.com/api/status
```

### Backups

Supabase Pro includes automated daily backups. On the free tier you should back up
manually. Run this on the Droplet to dump the database:

```bash
mkdir -p /var/backups/eastbrook
pg_dump "$(grep DATABASE_URL /opt/eastbrook/.env | cut -d= -f2-)" \
  | gzip > /var/backups/eastbrook/eastbrook-$(date +%Y-%m-%d).sql.gz
```

Add a daily cron job:

```bash
cat > /etc/cron.d/eastbrook-backup << 'EOF'
15 3 * * * root pg_dump "$(grep DATABASE_URL /opt/eastbrook/.env | cut -d= -f2-)" | gzip > /var/backups/eastbrook/eastbrook-$(date +%Y-%m-%d).sql.gz && find /var/backups/eastbrook -name "*.sql.gz" -mtime +14 -delete
EOF
```

This runs at 03:15 UTC and keeps 14 days of backups.

To restore a backup:

```bash
gunzip -c /var/backups/eastbrook/eastbrook-2026-06-21.sql.gz \
  | psql "$(grep DATABASE_URL /opt/eastbrook/.env | cut -d= -f2-)"
```

### Revoking admin access

```bash
psql "$(grep DATABASE_URL /opt/eastbrook/.env | cut -d= -f2-)" \
  -c "UPDATE accounts SET is_admin = FALSE WHERE username = 'username';"
```

### Rotating the DO_REGISTRY_TOKEN

1. Create a new token in DigitalOcean API → Tokens.
2. Update the `DO_REGISTRY_TOKEN` GitHub secret.
3. Re-authenticate Docker on the Droplet:
   ```bash
   echo "<NEW_TOKEN>" | docker login registry.digitalocean.com -u "<NEW_TOKEN>" --password-stdin
   ```
4. Delete the old token in DigitalOcean.

---

## 12. Multiple Realms

Each realm is one server process pointing at the same Supabase database with a different
`REALM_NAME` and `PORT`. Characters, friends, guilds, and presence are fully isolated
between realms; only account login is shared.

### On a single Droplet

Add a second entry to `/opt/eastbrook/.env`:

```bash
# Second realm
REALM_NAME_2=Ironforge
PORT_2=8788
```

Create a second `docker-compose.prod.yml` service (or a separate compose file) that
passes these values and opens a second loopback port.

Add a second Caddy site block in `/etc/caddy/Caddyfile`:

```
ironforge.yourgame.com {
    reverse_proxy localhost:8788
    encode gzip
}
```

Set `REALMS` in `.env` to advertise both realms in the client's realm list:

```
REALMS=Claudemoon=https://play.yourgame.com=Normal,Ironforge=https://ironforge.yourgame.com=PvP
```

Restart Caddy after editing the Caddyfile:

```bash
systemctl reload caddy
```

---

## 13. Surviving Upstream Updates with a Custom Domain

When you pull new game code from the upstream repository, your custom domain
configuration is **not affected** — because all of it lives outside the repo.

### What lives outside the repo (safe from upstream changes)

| Location | What it contains | Affected by `git pull`? |
|---|---|---|
| `/opt/eastbrook/.env` on the Droplet | `DATABASE_URL`, `REALM_NAME`, `PUBLIC_ORIGIN`, `ADMIN_HOSTNAME`, all secrets | No — not tracked by git |
| `/etc/caddy/Caddyfile` on the Droplet | Your domain names, TLS config, all Caddy site blocks | No — not tracked by git |
| DNS records at your registrar | A records pointing your domains at the Droplet | No — external |
| GitHub `production` environment secrets | `DROPLET_IP`, `DROPLET_SSH_KEY`, `DO_REGISTRY_TOKEN`, `DO_REGISTRY_NAME`, `VITE_TURNSTILE_SITEKEY` | No — stored in GitHub, not in repo |

### What an upstream update CAN change

| File | What it is | What to watch for |
|---|---|---|
| `docker-compose.prod.yml` | Production compose file synced to Droplet on deploy | Rarely changes. If it does, the old Caddy config and `.env` still work — these compose files don't touch your Caddyfile |
| `.env.example` | Documentation of available variables | Review diff when updating — new variables might be relevant to enable |
| `server/main.ts` | Server code, including `isAdminRequest` | If the upstream admin detection logic changes, check the diff — your `ADMIN_HOSTNAME` env var is always respected |
| `Dockerfile` | Build image | Transparent — you just get a newer image |

### Recommended workflow for pulling upstream updates

```bash
# 1. On your local machine, fetch from upstream
git remote add upstream https://github.com/giondesign/world-of-arcane-hunters.git
git fetch upstream

# 2. Merge or rebase onto your working branch
git checkout main
git merge upstream/main

# 3. Review the diff, especially:
git diff upstream/main HEAD -- .env.example           # new env vars?
git diff upstream/main HEAD -- server/main.ts         # admin detection changed?
git diff upstream/main HEAD -- docker-compose.prod.yml # compose changes?

# 4. Push to your release branch to trigger deploy
git push origin release/your-version
```

### If you want to track .env changes safely

Keep a private `.env.production` file outside the repo (e.g. in a password manager or
private gist) that records your full production `.env`. When `.env.example` gains a new
variable in an upstream update, compare and add the new var to your Droplet's
`/opt/eastbrook/.env` if you want to enable it.

```bash
# On the Droplet — add a new variable from upstream
nano /opt/eastbrook/.env

# Then restart the game container to pick it up
cd /opt/eastbrook
GAME_IMAGE=$(docker inspect eastbrook-game --format '{{.Config.Image}}') \
  docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate game
```

New environment variables are always **opt-in** — the server falls back to a sensible
default when a variable is absent, so upstream updates do not break a running deployment
when you have not set the new variable yet.

---

## 14. Troubleshooting

### Container fails to start

```bash
docker logs eastbrook-game
```

Common causes:
- **`DATABASE_URL` incorrect or unreachable** — verify the connection string and that
  the Supabase project is not paused (check the Supabase dashboard).
- **Port conflict** — another process is on 8787. `lsof -i :8787` to find it.

### Caddy not issuing TLS certificate

```bash
journalctl -u caddy --no-pager -n 50
```

Common causes:
- DNS not propagated yet — `dig world.example.com` (replace with your actual domain) should return your reserved IP.
- Port 80 or 443 blocked by firewall — check DigitalOcean's Droplet Firewall or
  `ufw status` if you have ufw enabled.

### GitHub Actions deploy fails at SSH step

- Confirm `DROPLET_IP` matches the reserved IP exactly.
- Confirm `DROPLET_SSH_KEY` includes the full PEM block including header/footer.
- Verify the public key is in `/root/.ssh/authorized_keys` on the Droplet.
  ```bash
  cat /root/.ssh/authorized_keys | grep woc-deploy-ci
  ```

### Supabase connection refused

- Always use port **5432** (Session mode), not 6543.
- Free-tier projects auto-pause — visit the Supabase dashboard and click **Restore project**.
- Confirm the database password in `DATABASE_URL` matches what Supabase has. If you
  lost the password, reset it in **Supabase → Project Settings → Database → Reset database password**.

### "Name already taken" error on character creation

Character names are globally unique across all realms. Use a different name, or if
you are testing, delete the conflicting character from Supabase:

```bash
psql "$DATABASE_URL" -c "DELETE FROM characters WHERE name = 'TestChar';"
```

### Checking whether the schema is installed

```bash
psql "$DATABASE_URL" -c "\dt"
```

You should see tables: `accounts`, `auth_tokens`, `characters`, `world_state`,
`chat_log`, `arena_queue`, `arena_bouts`, `social_*`, etc. If the tables are absent,
the server failed to run schema setup — check `docker logs eastbrook-game` for errors.
