# Deploying World of Claudecraft on AWS

> **Levy Street production** is deployed via Ansible, not this document:
> the `eastbrook_game` role in the internal `ansible-scripts` repo runs
> the stack on `idyllic-games-prod` behind nginx + certbot at
> https://worldofclaudecraft.com. Re-running
> `ansible-playbook playbooks/setup_server.yml -e target_host=idyllic-games-prod`
> pulls and redeploys. The guide below is the generic, standalone path.

> **Looking for a different deployment target?**
> - [docs/SETUP-DIGITALOCEAN.md](docs/SETUP-DIGITALOCEAN.md) — DigitalOcean Droplet + Supabase + GitHub Actions CI/CD
> - [docs/SETUP-LOCAL-MAC.md](docs/SETUP-LOCAL-MAC.md) — Local Mac development with local Supabase or Docker Compose
> - [docs/SETUP-CLOUDFLARE.md](docs/SETUP-CLOUDFLARE.md) — Cloudflare DNS, proxy, WAF, and Turnstile integration (works alongside either deployment target)

One EC2 instance runs everything: the game server, Postgres, MediaWiki, and Caddy
(TLS reverse proxy). Sized for a small population — a `t4g.small`
(~$14/month all-in) is comfortable for a handful of concurrent players.

## 1. Confirm the repo is public

The standalone first-boot script clones
`https://github.com/levy-street/world-of-claudecraft.git` anonymously. If you
are deploying a private fork instead, use a deploy key or another secret
manager-specific flow; do not paste long-lived personal access tokens into EC2
user data.

## 2. Launch the instance

In the EC2 console:

| Setting | Value |
|---|---|
| AMI | Ubuntu Server 24.04 LTS (**arm64**) |
| Instance type | `t4g.small` (2 vCPU Graviton, 2 GB) |
| Storage | 20 GB gp3 |
| Security group | Inbound: **22** (your IP only), **80**, **443** — nothing else |
| User data | Paste `deploy/user-data.sh` with `DOMAIN` filled in |

Leave `DOMAIN=""` if you want to test by IP first over plain HTTP —
you can set the domain later (step 4).

Allocate an **Elastic IP** and associate it with the instance so the
address survives restarts.

The game server and Postgres bind to loopback only (`127.0.0.1:8787` /
`127.0.0.1:5433`); Caddy is the sole public entrance, so the security
group above is the whole exposure story.

First boot takes a few minutes (Docker image build). Watch it with:

```bash
ssh ubuntu@<elastic-ip> sudo tail -f /var/log/eastbrook-setup.log
```

## 3. Point DNS at it

Create an **A record** for your domain (e.g. `play.example.com`) pointing
at the Elastic IP. In Route 53: Hosted zone → Create record → A →
the Elastic IP.

## 4. Turn on TLS (if you started without a domain)

```bash
ssh ubuntu@<elastic-ip>
echo 'play.example.com {
	route /wiki* {
		reverse_proxy localhost:8080
	}
	reverse_proxy localhost:8787
	encode gzip
}' | sudo tee /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy fetches and renews the Let's Encrypt certificate automatically;
WebSockets are proxied with no extra config, and the client auto-selects
`wss://` on https pages. Open `https://play.example.com` and you're live.

## Updating the game

```bash
ssh ubuntu@<elastic-ip>
cd /opt/eastbrook
sudo git pull
sudo docker compose up -d --build
```

Players online during the restart are disconnected for a few seconds and
can log straight back in; the server saves all characters on shutdown.

## Backups

A nightly `pg_dump` runs at 03:15 UTC via `/etc/cron.d/eastbrook-backup`,
writing gzipped dumps to `/var/backups/eastbrook/` and keeping 14 days.

Restore (stack must be up):

```bash
gunzip -c /var/backups/eastbrook/eastbrook-2026-06-10.sql.gz \
  | sudo docker exec -i eastbrook-db psql -U eastbrook eastbrook
```

For off-box safety, sync the directory to S3 occasionally:
`aws s3 sync /var/backups/eastbrook s3://your-bucket/eastbrook/`.

## Operational notes

- **Secrets**: the Postgres password is generated at first boot into
  `/opt/eastbrook/.env` (mode 600, gitignored). Nothing else to manage.
- **Username bans**: set `USERNAME_BANLIST_FILE=/opt/eastbrook/username-banlist.txt`
  to load blocked username terms from a private newline- or comma-separated
  file. `USERNAME_BANLIST` can also provide a comma-separated inline list.
- **Chat filter**: the word lists are now **managed live from the admin
  dashboard** (Chat Filter tab), stored in the database and seeded with sensible
  defaults on first boot. Two tiers: *soft* words are masked client-side with
  `****` (players can toggle the filter off in Options), and *hard* words (slurs)
  are blocked server-side and escalate from a warning to account-wide timed mutes
  (durations editable in the same tab). `CHAT_CENSOR_LIST` / `CHAT_CENSOR_FILE`
  are still read **once**, on the first boot of a fresh database, to seed the soft
  list — after that they are ignored and the dashboard is authoritative.
- **Realms (horizontal scaling)**: each server process serves one realm,
  set by `REALM_NAME` (default `Claudemoon`). To add a realm, run another
  process against the **same** `DATABASE_URL` with a different `REALM_NAME`
  and `PORT` (e.g. behind its own vhost or compose service). Characters,
  friends, guilds, presence, and the World Market are realm-scoped, so the
  worlds are fully isolated: players on different realms can't see, whisper,
  friend, guild, or share an auction house with each other. Concurrent boots
  serialize their schema setup behind a
  Postgres advisory lock, so starting several at once is safe. Character and
  guild names remain globally unique across realms.
- **Raid reset time zone**: raid lockouts end at the next 3 AM (03:00, the classic daily
  reset) in the realm's civil time zone. Set `REALM_RESET_TZ` to an IANA zone per
  realm process (e.g. `America/New_York`, `Europe/Paris`); it defaults to
  `America/New_York`. The process must run on a full-ICU Node (the default for
  modern Node); an unresolvable zone falls back to the default, and if even the
  default cannot be resolved the process fails fast at boot.
- **Bot gate (Cloudflare Turnstile)**: login and registration can be gated by
  Turnstile so headless clients (the aiohttp/websockets bot wave) can't create or
  sign into accounts. It is **off until configured**: both halves must be set or
  the gate silently does nothing:
  - `TURNSTILE_SECRET` (server runtime, secret): enables server-side verification.
  - `VITE_TURNSTILE_SITEKEY` (public): renders the widget. This is read by the
    **client and inlined at `npm run build` time**, so it must be present when the
    image/bundle is built, not just at runtime. Use a separate Turnstile widget per
    environment (dev vs prod). If the origin's nginx (in the `ansible-scripts` repo)
    sets a Content-Security-Policy, it must allow `script-src`/`frame-src
    https://challenges.cloudflare.com` or the widget won't load.
- **Wallet linking**: the wallet UI uses injected Solana browser wallets and no
  third-party wallet-connect project id. $WOC balance reads are server-side
  only: set `SOLANA_RPC_URL` to a production Solana RPC endpoint and leave it
  unprefixed so API keys are not bundled into the client. `WOC_MINT` defaults to
  the canonical token mint and should only be overridden if that mint changes.
  Set `PUBLIC_ORIGIN` in single-realm production so shared player-card pages
  emit stable absolute Open Graph URLs.
- **Never** set `ALLOW_DEV_COMMANDS=1` in production: it enables the
  level/teleport cheats used by the test bots.
- **Bot detector (implementation)**: the open-source tree ships with a no-op stub
  (`server/bot_detector/stub.ts`). Detection hooks are wired in, but they observe
  nothing and never act. To bundle the real behavioral detector, clone the private
  `bot_detector` repo into `private/bot_detector` **before** `npm run build` (or
  `npm run build:server`). The Docker build copies `private/` into the build stage,
  so the same rule applies to deploys that run `docker compose build`: the private
  checkout must exist before the image is built. That directory is not part of the
  public checkout. At build time, confirm which implementation was picked:
  `[build:server] bot detector: stub (no-op)` vs `… bot detector: private`.
- **Anti-bot runtime knobs**: `MAX_WS_PER_IP_HARD` (default `20`) caps simultaneous
  WebSocket connections per source IP; extra connections are refused at the
  handshake. `ANTIBOT_ENFORCE=1` lets the detector act on its findings (e.g. kick);
  when unset, detection is observe-only. With the no-op stub, enforcement has no
  effect regardless of this flag.
- Logs: `sudo docker compose -f /opt/eastbrook/docker-compose.yml logs -f game`.
- If the instance ever feels tight, stop → change instance type →
  start. Everything lives in Docker plus one EBS volume, so nothing
  else changes.

## Admin dashboard

The admin dashboard (account/character/session metrics, live players,
server health) is served by the same game server process on the same port.
There are three ways to reach it — pick whichever fits your domain setup:

| Option | URL | Config needed |
|---|---|---|
| Path-based | `https://your-game-domain.com/admin` | None — always works |
| `admin.*` subdomain | `https://admin.your-game-domain.com` | DNS A record + nginx/Caddy block |
| Custom hostname | `https://admin-your-game.com` | DNS + proxy block + `ADMIN_HOSTNAME` env var |

**Path-based** is the simplest and requires no extra DNS record or env var. Use it
when the game is already on a subdomain (`world.example.com/admin`).

**`admin.*` subdomain** is auto-detected — the server serves `admin.html` for any
`Host` header starting with `admin.`. Add an A record for `admin.your-game-domain.com`
pointing at the same IP, and add a second nginx/Caddy site block that proxies to the
same game port.

**Custom hostname** (e.g. `admin-world.example.com`) requires setting `ADMIN_HOSTNAME`:

```env
# In the server's .env file:
ADMIN_HOSTNAME=admin-world.example.com
```

Then add the DNS record and a proxy block for that hostname. See
[docs/SETUP-DIGITALOCEAN.md Step 9](docs/SETUP-DIGITALOCEAN.md#9-configure-and-access-the-admin-dashboard)
for complete Caddy configuration examples for all three options.

**Nginx (Ansible production):** point an additional server block at the game port
(`proxy_pass http://localhost:8787`). The Node server selects which HTML shell to serve
based on the `Host` header — no separate upstream needed.

**Local dev**: open `http://localhost:8787/admin` (or `http://localhost:5173/admin`
under `npm run dev`).

Access requires signing in with a game account that has the `is_admin`
flag. The hostname only selects which HTML shell is served — every
`/admin/api/*` call is always checked against the account flag.

Grant the first admin:

```bash
# locally
npm run admin:grant -- <username>

# on the box (the runtime image only ships bundled code, so use psql)
sudo docker exec eastbrook-db psql -U eastbrook eastbrook \
  -c "UPDATE accounts SET is_admin = TRUE WHERE username = '<username>';"
```

Revoke with `npm run admin:grant -- <username> --revoke` (or set the
flag to `FALSE` in SQL).

---

## Optional features

The sections below cover optional features that apply to any deployment target
(AWS, DigitalOcean, or local). All of these are configured via environment
variables in the server's `.env` file (or the host's environment).

### Bot gate — Cloudflare Turnstile

Turnstile gates `POST /api/register` and `POST /api/login` with a browser
challenge, blocking headless bot clients that cannot solve it. The gate is
**off by default** — both halves must be set, or it is silently disabled.

**Step 1 — Create a Turnstile widget**

1. Sign in to [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile**.
2. Click **Add widget**.
3. Set the hostname to your game domain (e.g. `play.example.com`). For local
   testing, add `localhost` as a second hostname.
4. Widget type: **Managed** (recommended).
5. Copy the **Site Key** (public) and **Secret Key** (private).

**Step 2 — Configure the server**

Add the secret key to the server's `.env`:

```env
TURNSTILE_SECRET=0x4AAAAAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Step 3 — Configure the client build**

The site key must be present at `npm run build` time (Vite inlines it). Pass
it as a Docker build argument in the compose file or export it before building:

```env
VITE_TURNSTILE_SITEKEY=0x4AAAAAAA_public_key_here
```

In the GitHub Actions workflow it is passed via the `VITE_TURNSTILE_SITEKEY`
build secret. For the docker-compose local build, set it in `.env` (it is
declared as a build `arg` in `docker-compose.yml`).

**Content-Security-Policy note:** if your nginx or Caddy sets a `Content-Security-Policy`
header, add `https://challenges.cloudflare.com` to both `script-src` and
`frame-src`, or the widget will not load.

---

### Solana wallet-link and $WOC balance

Players can link a Solana wallet to display their $WOC token balance in-game.
No third-party wallet-connect project ID is required — the server uses injected
browser wallets and a direct RPC call.

Set these in the server's `.env` (not prefixed `VITE_` — they never reach the
client bundle):

```env
# Production Solana RPC endpoint (the public mainnet default is rate-limited).
# Use a dedicated endpoint from Helius, QuickNode, Triton, or similar.
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=<your-key>

# $WOC SPL token mint. Override only if the canonical mint changes.
WOC_MINT=3WjLscH2JsXLEFJZRA9z8ti8yRGxWGKbqymPd7UicRth
```

To disable the wallet UI entirely in a given deploy (for example, a private or
dev build), set at build time:

```env
VITE_WALLET_DISABLED=1
```

---

### Public origin for player cards and Open Graph

Server-generated URLs (player card pages, Open Graph `og:image` meta tags) use
`PUBLIC_ORIGIN` to build absolute URLs. Without it, the server falls back to
the `Host` header of each incoming request, which is fine in single-origin
setups but breaks shared player card links in multi-origin ones.

```env
PUBLIC_ORIGIN=https://play.example.com
```

In multi-realm deployments, `PUBLIC_ORIGIN` is superseded by the per-realm
origin in `REALMS` (see below).

---

### Multiple realms (horizontal scaling)

Each game process serves one realm. To add a second realm, run another process
against the same `DATABASE_URL` with a different `REALM_NAME` and `PORT`.

**Environment variables per realm process:**

| Variable | Realm 1 | Realm 2 |
|---|---|---|
| `REALM_NAME` | `Claudemoon` | `Ironforge` |
| `REALM_TYPE` | `Normal` | `PvP` |
| `PORT` | `8787` | `8788` |
| `DATABASE_URL` | (same for both) | (same for both) |

**Advertising the realm list to clients (`REALMS`):**

When `REALMS` is set, clients see a WoW-style realm list. Set the same value
on every realm process so they all advertise the full directory:

```env
REALMS=Claudemoon=https://play.example.com=Normal,Ironforge=https://ironforge.example.com=PvP
```

Format: `Name=https://origin=Type` entries separated by commas. `Type` is
optional and defaults to `Normal`. The CORS allowlist is derived from these
origins automatically — you do not need a separate `CORS_ORIGINS` setting.

**Caddy configuration for two realms on one host:**

```
play.example.com {
    reverse_proxy localhost:8787
    encode gzip
}

ironforge.example.com {
    reverse_proxy localhost:8788
    encode gzip
}
```

**Character and guild names** remain globally unique across all realms even
though character and social data is realm-scoped. Concurrent boots of multiple
realm processes serialize schema setup safely behind a Postgres advisory lock.

---

### Username ban list

Block usernames containing specific terms (case-insensitive, substring match).

**Inline list in `.env`:**

```env
USERNAME_BANLIST=admin,moderator,gm,gamemaster,support
```

**File-based list** (preferred for large lists):

```env
USERNAME_BANLIST_FILE=/opt/eastbrook/username-banlist.txt
```

The file uses one term per line or comma separation. The file is read once at
server startup; restart the server to pick up changes.

---

### Chat filter configuration

The chat filter has two tiers:

- **Soft** (cosmetic): words are masked client-side with `****`. Players can
  toggle the filter off in Options.
- **Hard** (server-enforced): words (typically slurs) are blocked server-side.
  Repeated violations escalate from a warning to timed account-wide mutes.

**The filter is managed live from the admin dashboard** (Chat Filter tab) after
the first boot. These environment variables only **seed** the soft list on the
very first boot of a fresh database and are ignored thereafter:

```env
# Seed the soft censor list on first boot (comma-separated terms).
CHAT_CENSOR_LIST=badword1,badword2

# Or point to a file:
CHAT_CENSOR_FILE=/opt/eastbrook/chat-censor.txt
```

After the first boot, add and remove words from the admin dashboard — do not
modify these env vars expecting live changes.

---

### Chat log retention

Chat logs are stored in Postgres and pruned at boot and daily:

```env
# Keep 90 days of chat logs. Set to 0 to keep forever (table grows unbounded).
CHAT_LOG_RETENTION_DAYS=90
```

---

### Rate limiting and trusted proxy IPs

The server rate-limits login and registration attempts per IP. When running
behind a reverse proxy (Caddy, nginx), the real client IP comes from
`X-Forwarded-For`. The server trusts `X-Forwarded-For` only from proxy IPs it
considers safe:

- By default, loopback (`127.0.0.0/8`) and private RFC-1918 ranges
  (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are trusted.
- This is correct when Caddy runs on the same host (connects from loopback).

If your proxy connects from a non-private IP (e.g. a load balancer on a
separate host), pin it explicitly:

```env
TRUSTED_PROXY_IPS=203.0.113.10,203.0.113.11
```

Comma-separated IPs or CIDR blocks. Setting this incorrectly can cause all
players to be rate-limited under a single IP.

> **Using Cloudflare as a proxy?** Do **not** list Cloudflare IPs in
> `TRUSTED_PROXY_IPS`. Instead, configure Caddy's global `trusted_proxies`
> block with Cloudflare's CIDR ranges — Caddy then resolves the real player IP
> from Cloudflare's `CF-Connecting-IP` / `X-Forwarded-For` header and passes it
> as a clean single-hop XFF to the game server, which already trusts the Docker
> bridge (private range). See [docs/SETUP-CLOUDFLARE.md](docs/SETUP-CLOUDFLARE.md#5-update-caddy-for-cloudflare-ip-passthrough)
> for the complete Caddyfile snippet.

---

### Custom admin hostname (`ADMIN_HOSTNAME`)

By default the server serves the admin dashboard for any hostname starting with
`admin.` (e.g. `admin.your-game.com`) or for the `/admin` URL path on any domain.

If you want to use a hostname that does not follow the `admin.*` prefix
(e.g. `admin-world.example.com` or `dashboard.example.com`), set:

```env
ADMIN_HOSTNAME=admin-world.example.com
```

With this set, only requests where the `Host` header exactly equals this value trigger
the admin shell. The `/admin` path still works on all domains regardless of this
setting. Restart the container after changing this variable.

---

### Graceful restart countdown

Before a production restart, you can broadcast in-game countdown announcements
so players have time to finish what they are doing. The `/internal/restart-countdown`
endpoint triggers this:

```env
# Long random value; set the same value in your deploy tooling.
RESTART_COUNTDOWN_SECRET=your-64-char-random-hex-here
```

Generate a value:

```bash
openssl rand -hex 32
```

Trigger a countdown (loopback-only — from the server itself):

```bash
curl -s -X POST http://localhost:8787/internal/restart-countdown \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-64-char-random-hex-here","seconds":300}'
```

This broadcasts a "Server restarting in 5 minutes" message (and subsequent
countdowns) to all connected players. After the countdown, you can safely
restart the container — characters are saved on shutdown (`SIGTERM`).

---

### NPC voice generation (offline tooling)

The voice generation scripts use ElevenLabs to synthesize NPC dialogue MP3s.
These scripts are developer tooling, not used by the running server:

```env
# Only needed when running scripts/gen_npc_voices.mjs or scripts/gen_npc_lines.mjs.
ELEVENLABS_API_KEY=your-api-key-from-elevenlabs-io
```

```bash
npm run voices:gen    # designs NPC voices
npm run voices:lines  # synthesizes line MP3s into public/audio/voice/
```

---

### Complete environment variable reference

For the full annotated list of every supported environment variable and whether
it belongs on the server, in the build environment, or in GitHub secrets, see
[docs/SETUP-DIGITALOCEAN.md — Environment Variable Reference](docs/SETUP-DIGITALOCEAN.md#10-environment-variable-reference)
and the inline comments in [`.env.example`](.env.example).
