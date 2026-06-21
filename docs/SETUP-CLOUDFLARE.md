# Cloudflare Configuration Guide

This guide covers a complete Cloudflare setup for World of Arcane Hunters when the game
is hosted on a DigitalOcean Droplet with Supabase as the database. It assumes you have
already completed [SETUP-DIGITALOCEAN.md](SETUP-DIGITALOCEAN.md).

**What Cloudflare gives you:**
- DDoS protection and traffic scrubbing at the edge
- Free universal TLS — players see a valid Cloudflare certificate
- CDN caching for static assets (GLB models, textures, JS bundles)
- Real IP hiding — your Droplet IP is never exposed in DNS
- Turnstile bot gate integration (already supported by the game server)
- WAF rules and rate limiting at the edge

**What Cloudflare does NOT replace:**
- Caddy still manages TLS between Cloudflare and your Droplet (backend connection)
- The game server still handles all rate limiting, auth, and WebSocket logic
- Supabase connects directly from the Droplet — it does **not** go through Cloudflare

---

## Routing architecture

```
Player browser
    │ HTTPS/WSS  (Cloudflare's cert — players never see your Droplet's cert)
    ▼
Cloudflare Edge  ──── WAF, DDoS, cache, Turnstile
    │ HTTPS  (Caddy's Let's Encrypt cert — Full strict mode)
    │ Sets: CF-Connecting-IP, X-Forwarded-For, CF-IPCountry headers
    ▼
Caddy on Droplet :443
    │ HTTP  (loopback only — 127.0.0.1:8787)
    │ Caddy trusts Cloudflare IPs → resolves real client IP → passes in XFF
    ▼
Game server in Docker :8787  (REST + WebSocket)
    │ Direct TCP  (not through Cloudflare)
    ▼
Supabase Postgres :5432
```

---

## Table of Contents

1. [Add Your Domain to Cloudflare](#1-add-your-domain-to-cloudflare)
2. [DNS Records](#2-dns-records)
3. [SSL/TLS Configuration](#3-ssltls-configuration)
4. [Update Caddy for Cloudflare Real-IP](#4-update-caddy-for-cloudflare-real-ip)
5. [Cloudflare Speed Settings to Disable](#5-cloudflare-speed-settings-to-disable)
6. [Cache Rules](#6-cache-rules)
7. [Network Settings (WebSocket + HTTP/3)](#7-network-settings-websocket--http3)
8. [Security and WAF Rules](#8-security-and-waf-rules)
9. [Lock the Droplet to Cloudflare IPs Only](#9-lock-the-droplet-to-cloudflare-ips-only)
10. [Admin Dashboard via Cloudflare](#10-admin-dashboard-via-cloudflare)
11. [Cloudflare Turnstile Integration](#11-cloudflare-turnstile-integration)
12. [Environment Variable Changes](#12-environment-variable-changes)
13. [Verifying Everything Works](#13-verifying-everything-works)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Add Your Domain to Cloudflare

If your domain is already on Cloudflare, skip to [Step 2](#2-dns-records).

### 1.1 Add site

1. In [dash.cloudflare.com](https://dash.cloudflare.com) → **Add a Site**.
2. Enter your root domain (e.g. `example.com` — not the subdomain).
3. Select the **Free** plan and click **Continue**.
4. Cloudflare scans your existing DNS records. Review them and click **Continue**.

### 1.2 Update nameservers

Cloudflare gives you two nameservers (e.g. `aria.ns.cloudflare.com` and
`bart.ns.cloudflare.com`). Replace your registrar's nameservers with these.

At your registrar (Namecheap, GoDaddy, Google Domains, etc.):
- Find **Nameservers** or **DNS Settings**
- Set to **Custom nameservers** and enter both Cloudflare nameserver addresses
- Save

Nameserver propagation can take up to 24 hours. Cloudflare emails you when it is
complete. You can also check from the Cloudflare dashboard — the site status will
change from "Pending Nameserver Update" to "Active".

---

## 2. DNS Records

All records that should be behind the Cloudflare proxy use the **orange cloud** icon
(Proxied). Records that should go direct (no Cloudflare) use the **grey cloud** (DNS only).

### 2.1 Which records to create

For the game on a subdomain (e.g. `world.example.com`), the most common configurations:

---

**Configuration A — Game on subdomain, admin via `/admin` path (one record)**

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `world` | `<your Droplet reserved IP>` | Proxied (orange) |

Access the admin dashboard at `https://world.example.com/admin`.
No extra DNS record needed. Simplest option.

---

**Configuration B — Game on subdomain, admin on `admin.world.example.com`**

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `world` | `<your Droplet reserved IP>` | Proxied (orange) |
| A | `admin.world` | `<your Droplet reserved IP>` | Proxied (orange) |

Both point at the same IP. Caddy serves both with separate TLS certificates.
No `ADMIN_HOSTNAME` env var needed — the server auto-detects `admin.*` hostnames.

---

**Configuration C — Game on subdomain, admin on custom hostname**

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `world` | `<your Droplet reserved IP>` | Proxied (orange) |
| A | `admin-world` | `<your Droplet reserved IP>` | Proxied (orange) |

Requires `ADMIN_HOSTNAME=admin-world.example.com` in `/opt/eastbrook/.env`.
See [Step 10](#10-admin-dashboard-via-cloudflare) for full details.

---

**Configuration D — Game on root domain**

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `@` | `<your Droplet reserved IP>` | Proxied (orange) |
| A | `admin` | `<your Droplet reserved IP>` | Proxied (orange) |

`@` is the root domain (`example.com`). Admin at `admin.example.com`.

---

### 2.2 How to create each record

In your Cloudflare domain → **DNS → Records → Add record**:

- **Type:** A
- **Name:** `world` (or `@` for root)
- **IPv4 address:** your Droplet's reserved IP
- **Proxy status:** click the cloud icon so it turns **orange** (Proxied)
- **TTL:** Auto (Cloudflare controls TTL for proxied records)

Click **Save**.

> **Why orange cloud (Proxied)?**
> Proxied mode hides your Droplet's real IP from DNS responses. Players and attackers
> never see `143.198.xxx.xxx`. All traffic flows through Cloudflare's edge, which
> provides DDoS scrubbing, WAF, and caching. If you use DNS-only (grey cloud), your
> origin IP is exposed and Cloudflare cannot protect or accelerate it.

> **Supabase DNS — leave it alone.** Cloudflare only needs records for your game
> domain. The Supabase connection string points at Supabase's own infrastructure and
> connects directly from your Droplet — it does not go through Cloudflare.

---

## 3. SSL/TLS Configuration

This is the most important setting to get right. The wrong mode causes redirect loops
or insecure connections.

### 3.1 Set SSL/TLS mode to Full (strict)

In Cloudflare → **SSL/TLS → Overview**:

Set the mode to **Full (strict)**.

| Mode | What it does | Use? |
|---|---|---|
| Off | No encryption anywhere | No |
| Flexible | HTTPS to Cloudflare, plain HTTP to your server | No — insecure, causes redirect loop with Caddy |
| Full | HTTPS to Cloudflare, HTTPS to server (any cert) | No — accepts expired/self-signed certs |
| **Full (strict)** | **HTTPS to Cloudflare, HTTPS to server with valid cert** | **Yes — correct for Caddy + Let's Encrypt** |

> **Why not Flexible?** Caddy redirects all HTTP to HTTPS. Flexible mode sends HTTP
> from Cloudflare to Caddy, Caddy redirects to HTTPS, Cloudflare follows to port 443,
> Caddy serves HTTPS — but Cloudflare then tries to send the response back over HTTP
> again. This creates an infinite redirect loop.

### 3.2 Enable Always Use HTTPS

In **SSL/TLS → Edge Certificates**:

- **Always Use HTTPS:** ON — redirects all `http://` requests to `https://`
- **Minimum TLS Version:** TLS 1.2
- **TLS 1.3:** ON
- **Automatic HTTPS Rewrites:** ON — rewrites mixed-content `http://` links in HTML to `https://`

### 3.3 HSTS (optional but recommended)

In **SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS)**:

- **Enable HSTS:** ON
- **Max Age:** 6 months (15768000 seconds) — start with a low value first
- **Include subdomains:** ON (if all your subdomains also use HTTPS)
- **Preload:** OFF until you are confident in your setup

> **Warning:** HSTS is hard to undo once browsers cache it. Start with a short max-age
> and increase it only after confirming everything works over HTTPS for several days.

---

## 4. Update Caddy for Cloudflare Real-IP

This is a critical step. When Cloudflare proxies traffic, your Droplet sees
**Cloudflare's IP** as the connection source, not the player's real IP. Without
this fix, the game server's rate limiter (which tracks requests per client IP) would
rate-limit all players together as if they were all the same user.

Cloudflare sets the real client IP in the `X-Forwarded-For` and `CF-Connecting-IP`
headers. You need to tell Caddy to trust Cloudflare's IP ranges so it can extract the
real IP and pass it to the game server correctly.

### 4.1 Update the Caddyfile

SSH into your Droplet and replace the Caddyfile:

```bash
cat > /etc/caddy/Caddyfile << 'EOF'
{
    # Tell Caddy to trust X-Forwarded-For from Cloudflare's IP ranges.
    # Caddy resolves the real client IP from the XFF chain and passes it
    # downstream, so the game server sees the correct per-player IP for rate
    # limiting. Update these ranges when Cloudflare publishes changes (rare):
    # https://www.cloudflare.com/ips-v4
    # https://www.cloudflare.com/ips-v6
    servers {
        trusted_proxies static \
            103.21.244.0/22 \
            103.22.200.0/22 \
            103.31.4.0/22 \
            104.16.0.0/13 \
            104.24.0.0/14 \
            108.162.192.0/18 \
            131.0.72.0/22 \
            141.101.64.0/18 \
            162.158.0.0/15 \
            172.64.0.0/13 \
            173.245.48.0/20 \
            188.114.96.0/20 \
            190.93.240.0/20 \
            197.234.240.0/22 \
            198.41.128.0/17 \
            2400:cb00::/32 \
            2606:4700::/32 \
            2803:f800::/32 \
            2405:b500::/32 \
            2405:8100::/32 \
            2a06:98c0::/29 \
            2c0f:f248::/32
    }
}

world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}
EOF

systemctl reload caddy
```

Replace `world.example.com` with your actual game domain. If you also have an admin
subdomain, add it as a second site block — see [Step 10](#10-admin-dashboard-via-cloudflare).

### 4.2 Why this works (the XFF chain)

With the global `trusted_proxies` block set:

1. Cloudflare edge receives player request (real IP: `203.0.113.5`)
2. Cloudflare forwards to Droplet:443 with `X-Forwarded-For: 203.0.113.5` and `CF-Connecting-IP: 203.0.113.5`
3. Caddy sees the connection from a Cloudflare IP (trusted) → reads real IP from XFF → `203.0.113.5`
4. Caddy reverse-proxies to `localhost:8787` with `X-Forwarded-For: 203.0.113.5`
5. Game server receives connection from Docker bridge IP (private range, trusted by default) → reads XFF → `203.0.113.5`
6. Rate limiter tracks `203.0.113.5` correctly ✓

### 4.3 Do not set TRUSTED_PROXY_IPS in the game server

You do **not** need to add Cloudflare's IPs to `TRUSTED_PROXY_IPS` in
`/opt/eastbrook/.env`. Caddy handles the XFF chain — the game server only ever sees
a connection from the Docker bridge (a private range IP, trusted by default).

If you previously set `TRUSTED_PROXY_IPS`, you can remove it unless you have another
non-private proxy in your stack.

### 4.4 Keeping Cloudflare IP ranges up to date

Cloudflare rarely changes their IP ranges but does occasionally add blocks. The current
canonical lists are at:

```
https://www.cloudflare.com/ips-v4
https://www.cloudflare.com/ips-v6
```

If you want to automate keeping Caddy's trusted_proxies in sync, add a weekly cron job
on the Droplet that fetches the lists and reloads Caddy:

```bash
cat > /etc/cron.d/caddy-cf-ips << 'EOF'
0 4 * * 0 root /usr/local/bin/update-caddy-cf-ips.sh
EOF
```

```bash
cat > /usr/local/bin/update-caddy-cf-ips.sh << 'SCRIPT'
#!/bin/bash
# Fetch current Cloudflare IP ranges and rebuild the Caddyfile trusted_proxies block.
# Runs weekly; exits silently if fetch fails so Caddy is not disrupted.
set -e
IPV4=$(curl -sf https://www.cloudflare.com/ips-v4 || echo "")
IPV6=$(curl -sf https://www.cloudflare.com/ips-v6 || echo "")
if [ -z "$IPV4" ] || [ -z "$IPV6" ]; then exit 0; fi
RANGES=$(echo "$IPV4 $IPV6" | tr ' \n' ' ' | xargs)
# Only reload if ranges actually changed
NEW_HASH=$(echo "$RANGES" | sha256sum | cut -d' ' -f1)
CACHED=/tmp/cf-ip-hash
OLD_HASH=$(cat "$CACHED" 2>/dev/null || echo "")
if [ "$NEW_HASH" = "$OLD_HASH" ]; then exit 0; fi
echo "$NEW_HASH" > "$CACHED"
systemctl reload caddy
SCRIPT
chmod +x /usr/local/bin/update-caddy-cf-ips.sh
```

---

## 5. Cloudflare Speed Settings to Disable

Several Cloudflare speed optimizations are designed for traditional websites and
**actively break Three.js games**. Disable all of these.

Go to **Speed → Optimization** in the Cloudflare dashboard.

### 5.1 Rocket Loader — MUST DISABLE

**Speed → Optimization → Content Optimization → Rocket Loader: OFF**

Rocket Loader injects JavaScript that defers and wraps other scripts in an async loader.
It specifically breaks:
- WebGL context acquisition (Three.js)
- Web Audio API initialization (the game's procedural audio)
- Import map and module loading order

Set it to **Off** and never enable it.

### 5.2 Auto Minify — Disable

**Speed → Optimization → Content Optimization → Auto Minify: uncheck JavaScript, CSS, HTML**

Vite already minifies all code at build time. Cloudflare re-minifying already-minified
content can corrupt the output (especially ES module class fields and private methods).

Uncheck all three boxes.

### 5.3 Mirage — Disable

**Speed → Optimization → Image Optimization → Mirage: OFF**

Mirage intercepts image requests and serves lazy-loaded proxied versions. The game
loads textures dynamically via Three.js `TextureLoader`. Mirage's URL rewriting
breaks these dynamic texture loads.

### 5.4 Polish — Disable

**Speed → Optimization → Image Optimization → Polish: Off**

Polish re-encodes images. The game ships GLB files (3D models), HDR environment maps,
and KTX2 textures — none of which are standard images. Polish will either corrupt
these binary assets or serve them with wrong content-type headers.

Set to **Off**.

### 5.5 Speed Brain and Early Hints — Leave at default

These are safe to leave on or off. They prefetch navigation which does not affect
a single-page application.

---

## 6. Cache Rules

By default, Cloudflare caches responses based on file extension and Cache-Control
headers. The game server already sets appropriate headers (immutable for content-hashed
assets, no-store for API), but adding explicit cache rules is belt-and-suspenders.

### 6.1 Create cache rules

Go to **Caching → Cache Rules → Create rule**.

**Rule 1 — Never cache API and WebSocket endpoints**

- **Rule name:** `bypass-dynamic`
- **When:** Field: `URI Path` — Operator: `starts with` — Value: `/api`
  Click **Or**, add: `URI Path` starts with `/admin/api`
  Click **Or**, add: `URI Path` starts with `/internal`
  Click **Or**, add: `URI Path` equals `/ws`
- **Cache eligibility:** Bypass cache
- **Click Deploy**

**Rule 2 — Cache content-hashed assets forever**

- **Rule name:** `cache-immutable-assets`
- **When:** `URI Path` starts with `/assets/`
- **Cache eligibility:** Eligible for cache
- **Edge TTL:** Ignore Cache-Control, use 1 year (31536000 seconds)
- **Browser TTL:** Respect Existing Headers
- **Click Deploy**

### 6.2 Cloudflare's default caching behavior

For everything not covered by your rules, Cloudflare's defaults are:

- HTML files (`index.html`, `admin.html`): not cached by default (correct — these have no content hash)
- GLB/GLTF files: cached by default via file extension (good)
- WASM files: cached by default (good)
- Requests with `Cache-Control: no-store` or `private`: bypassed (game API already sets these)

---

## 7. Network Settings (WebSocket + HTTP/3)

### 7.1 Confirm WebSocket support

Go to **Network → WebSockets**.

WebSockets must be **Enabled** (this is the default on all Cloudflare plans). The game
uses persistent WebSocket connections for the 20 Hz real-time game loop.

> **Cloudflare WebSocket timeout:** Cloudflare closes idle WebSocket connections after
> 100 seconds. The game server sends a WebSocket ping every 30 seconds, so this
> timeout never triggers in normal play. Players who tab away for more than 100 seconds
> without any frame activity will be disconnected and can reconnect.

### 7.2 HTTP/3 (QUIC)

Go to **Network → HTTP/3 (with QUIC)**.

Leave this **On**. HTTP/3 improves initial connection time. The WebSocket connection
upgrades from HTTP/1.1 or HTTP/2 — HTTP/3 does not interfere with WebSocket traffic.

### 7.3 gRPC — leave Off

The game does not use gRPC. Leave it off.

### 7.4 Pseudo IPv4 — leave Off

Not needed. The game handles both IPv4 and IPv6.

---

## 8. Security and WAF Rules

### 8.1 Security level

Go to **Security → Settings → Security Level**.

Set to **Medium**. This challenges suspicious visitors (known bad IPs, TOR exits,
VPN exits with poor reputation) with a browser integrity check before serving the game.

- **Low:** Only blocks known attack IPs. Fine if you have many players from VPNs.
- **Medium:** Recommended default.
- **High:** Challenges many residential IPs — may annoy legitimate players.

### 8.2 Bot Fight Mode

Go to **Security → Bots → Bot Fight Mode**.

Enable **Bot Fight Mode** (free). This blocks simple bots before they reach your server.
Combined with the game's own Turnstile gate, it provides two layers of bot protection.

### 8.3 Custom WAF rule — block non-Cloudflare origin access (optional)

When you complete [Step 9](#9-lock-the-droplet-to-cloudflare-ips-only) (DigitalOcean
Firewall), direct-to-origin access is blocked at the network level. As a defence-in-depth
measure, you can also add a Cloudflare WAF rule that challenges requests that do not carry
expected Cloudflare headers — but since the Droplet firewall is the authoritative block,
this rule is optional.

### 8.4 Rate limiting (Cloudflare-level) — optional

Go to **Security → WAF → Rate limiting rules**.

Cloudflare-level rate limiting acts before traffic reaches your Droplet at all. The game
server has its own in-memory rate limiter, but adding a Cloudflare rule reduces the load
of flood events on your Droplet:

- **Rule:** `URI Path` starts with `/api/register` OR `/api/login`
- **Rate:** 10 requests per minute per IP
- **Action:** Block for 1 minute

This complements (not replaces) the server's own rate limiter.

### 8.5 DDoS protection settings

Go to **Security → DDoS**.

The **HTTP DDoS Attack Protection** rule set is enabled by default. Click
**Deploy a DDoS override** if you want to adjust sensitivity:
- Set to **High** sensitivity for a game (more traffic patterns are consistent)

---

## 9. Lock the Droplet to Cloudflare IPs Only

By default, anyone who discovers your Droplet's IP address can connect directly —
bypassing Cloudflare's WAF, DDoS protection, and your hidden-IP benefit. A
DigitalOcean Droplet Firewall locks HTTP/HTTPS traffic to Cloudflare's IP ranges only.

### 9.1 Create a DigitalOcean Droplet Firewall

1. In the DigitalOcean console → **Networking → Firewalls → Create Firewall**.
2. Name it `woc-prod-firewall`.

**Inbound rules:**

| Type | Protocol | Port | Sources |
|---|---|---|---|
| Custom | TCP | 22 | Your own IP address (e.g. `203.0.113.100/32`) |
| HTTP | TCP | 80 | (Cloudflare IPs — see below) |
| HTTPS | TCP | 443 | (Cloudflare IPs — see below) |

For the HTTP and HTTPS sources, add all of Cloudflare's published IPv4 and IPv6 ranges.
As of 2026, these are:

**IPv4 (add all as sources for ports 80 and 443):**
```
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
104.16.0.0/13
104.24.0.0/14
108.162.192.0/18
131.0.72.0/22
141.101.64.0/18
162.158.0.0/15
172.64.0.0/13
173.245.48.0/20
188.114.96.0/20
190.93.240.0/20
197.234.240.0/22
198.41.128.0/17
```

**IPv6:**
```
2400:cb00::/32
2606:4700::/32
2803:f800::/32
2405:b500::/32
2405:8100::/32
2a06:98c0::/29
2c0f:f248::/32
```

The canonical always-current list is at:
- [cloudflare.com/ips-v4](https://www.cloudflare.com/ips-v4)
- [cloudflare.com/ips-v6](https://www.cloudflare.com/ips-v6)

**Outbound rules:** Leave all outbound traffic open (default). The server needs to
reach Supabase (port 5432), Cloudflare's Turnstile API (port 443), and package
mirrors.

3. Under **Apply to Droplets**, select your `woc-prod` Droplet.
4. Click **Create Firewall**.

### 9.2 Test that direct IP access is blocked

After creating the firewall, test from a machine that is not in the allowlist:

```bash
curl -v --max-time 5 http://<your-droplet-ip>/api/status
# Should time out or get connection refused — NOT the game server response
```

And via Cloudflare (should still work):

```bash
curl -s https://world.example.com/api/status
# {"ok":true,"players_online":0,...}
```

> **SSH access:** Port 22 only allows your own IP. If your IP changes (home network,
> travel), you can temporarily edit the firewall rule in the DigitalOcean console to
> add your new IP. For teams, use a VPN or bastion host.

---

## 10. Admin Dashboard via Cloudflare

The admin panel is served by the same game server on the same port as the game.
Cloudflare proxies both through the same upstream (`localhost:8787`). The server
decides which HTML shell to serve (`index.html` vs `admin.html`) based on hostname
or path.

### Option A — Admin at `/admin` path (no second record)

If you only created one DNS record (`world.example.com`), the admin dashboard is
always reachable at:

```
https://world.example.com/admin
```

No Cloudflare, Caddy, or env var changes needed. This is the simplest option when
your game is already on a subdomain.

### Option B — Admin on `admin.world.example.com`

**Step 1: Add DNS record in Cloudflare**

In Cloudflare DNS → Add record:

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `admin.world` | `<Droplet reserved IP>` | Proxied (orange) |

**Step 2: Add Caddy site block**

On the Droplet, edit `/etc/caddy/Caddyfile` and add a second site inside the same
file (after the global `{ ... }` block):

```
{
    servers {
        trusted_proxies static ... (Cloudflare IP ranges from Step 4)
    }
}

world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}

admin.world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}
```

```bash
systemctl reload caddy
```

No `ADMIN_HOSTNAME` env var needed. The server auto-detects any `admin.*` hostname.

**Access:** `https://admin.world.example.com`

### Option C — Admin on a fully custom hostname (e.g. `admin-world.example.com`)

**Step 1: Add DNS record in Cloudflare**

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `admin-world` | `<Droplet reserved IP>` | Proxied (orange) |

**Step 2: Set ADMIN_HOSTNAME in the Droplet .env**

```bash
nano /opt/eastbrook/.env
# Add or update this line:
ADMIN_HOSTNAME=admin-world.example.com
```

**Step 3: Add Caddy site block**

```
admin-world.example.com {
    reverse_proxy localhost:8787
    encode gzip
}
```

**Step 4: Restart the game container**

```bash
cd /opt/eastbrook
GAME_IMAGE=$(docker inspect eastbrook-game --format '{{.Config.Image}}') \
  docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate game
systemctl reload caddy
```

**Access:** `https://admin-world.example.com`

### Admin SSL/TLS note

Each additional hostname gets its own TLS certificate from Caddy (Let's Encrypt) and
its own Cloudflare Universal SSL certificate on the edge. You do not need to change
anything in Cloudflare's SSL/TLS settings — the same Full (strict) mode applies to all
hostnames in your zone.

---

## 11. Cloudflare Turnstile Integration

The game already has full Turnstile support built in. Cloudflare Turnstile is a
CAPTCHA-alternative that gates `/api/register` and `/api/login`. Since you are already
routing through Cloudflare, the Turnstile widget loads from `challenges.cloudflare.com`
without any CSP or proxy issues.

### 11.1 Create or update the Turnstile widget

1. In the Cloudflare dashboard → **Turnstile** (left sidebar).
2. Click **Add widget** (or edit an existing one).
3. Add **every hostname** the game runs on:
   - `world.example.com` (game domain)
   - `admin.world.example.com` (admin — optional, the widget only renders on the game login page)
4. Widget type: **Managed** (recommended)
5. Copy both keys.

### 11.2 Set the keys

**Server-side secret** — on the Droplet in `/opt/eastbrook/.env`:

```env
TURNSTILE_SECRET=0x4AAAAAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Client-side site key** — in your GitHub `production` environment secret:

```
VITE_TURNSTILE_SITEKEY=0x4AAAAAAAyyyy_public_key_here
```

This is baked into the client bundle at build time. Re-deploy after changing it.

### 11.3 Content Security Policy for Turnstile

If you add a Cloudflare Transform Rule to set a `Content-Security-Policy` header (see
Step 8), include these sources or the Turnstile widget will be blocked:

```
script-src 'self' https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com;
```

The game does not have a CSP by default, so this only applies if you add one.

---

## 12. Environment Variable Changes

When routing through Cloudflare with the Caddy trusted_proxies configuration in
Step 4, the changes to `/opt/eastbrook/.env` are minimal:

### Required changes

| Variable | Value | Reason |
|---|---|---|
| `PUBLIC_ORIGIN` | `https://world.example.com` | Absolute URLs in server-generated content use the Cloudflare-fronted domain, not the Droplet IP |
| `TURNSTILE_SECRET` | your secret key | Required if using Turnstile |

### Not needed (contrary to what you might expect)

| Variable | Why not needed |
|---|---|
| `TRUSTED_PROXY_IPS` | Caddy handles the XFF chain. The game server always sees a Docker bridge IP (private, trusted by default) — not Cloudflare's IPs |

### Optional changes

| Variable | Value | When to set |
|---|---|---|
| `ADMIN_HOSTNAME` | `admin-world.example.com` | Only for Option C custom admin hostname |
| `WIKI_URL` | `https://world.example.com/wiki/index.php/Main_Page` | If running MediaWiki behind Cloudflare too |

---

## 13. Verifying Everything Works

### 13.1 Basic connectivity

```bash
# Game API — should return JSON with Cloudflare response headers
curl -sv https://world.example.com/api/status 2>&1 | grep -E "HTTP|cf-ray|server"
# Look for: cf-ray: <id> and server: cloudflare in response headers

# Game loads in browser
# Open https://world.example.com → Play Online → should load without console errors

# Admin dashboard
# https://world.example.com/admin (or your admin URL) → login page appears
```

### 13.2 WebSocket connection

Open the game in a browser → Play Online → Create account → Enter World. The game
should connect and you should see the world load and your character move.

To verify the WebSocket goes through Cloudflare (not direct):

1. Open browser DevTools → **Network** tab → filter by **WS**
2. Click the `/ws` request
3. You should see WebSocket frames flowing under **Messages**
4. In **Headers**, confirm the URL is `wss://world.example.com/ws`

### 13.3 Real IP rate limiting

Confirm the server sees real player IPs (not Cloudflare IPs):

```bash
# On the Droplet
docker logs eastbrook-game 2>&1 | grep "rate"
```

If you see individual player IP addresses (not Cloudflare ranges like 103.x.x.x or
104.x.x.x), the XFF chain is working correctly.

### 13.4 Cache validation

```bash
# This should have cf-cache-status: MISS on first request, HIT on second
curl -sv https://world.example.com/assets/<any-hashed-file>.js 2>&1 | grep cf-cache

# This should always be BYPASS (never cached)
curl -sv https://world.example.com/api/status 2>&1 | grep cf-cache
```

### 13.5 Check Cloudflare Analytics

Go to **Analytics → Traffic** in the Cloudflare dashboard. After a few minutes of
traffic, you should see:
- Requests broken down by cached vs uncached
- Bandwidth saved by the CDN
- Threat activity blocked by the WAF and Bot Fight Mode

---

## 14. Troubleshooting

### ERR_TOO_MANY_REDIRECTS in browser

**Cause:** SSL/TLS mode is set to **Flexible** instead of Full (strict). Caddy
redirects HTTP → HTTPS, Cloudflare sends HTTP to Caddy, infinite loop.

**Fix:** Cloudflare → **SSL/TLS → Overview → Full (strict)**.

### 522 Connection Timed Out (Cloudflare error page)

**Cause:** Cloudflare cannot reach your origin server. Possible causes:
- The Droplet Firewall (Step 9) is blocking Cloudflare's IPs — verify your firewall
  rules include all current Cloudflare IP ranges
- Caddy is not running: `systemctl status caddy`
- The game container is down: `docker ps`

```bash
# Test origin connectivity directly from the Droplet
curl -s http://localhost:8787/api/status
```

### 521 Web Server Is Down

**Cause:** Cloudflare reached the Droplet but the server refused the connection.
Caddy may not be listening on port 443.

```bash
ss -tlnp | grep 443   # Should show caddy listening on 0.0.0.0:443
systemctl restart caddy
journalctl -u caddy -n 30
```

### Players see Cloudflare IPs in server logs (rate limiting broken)

**Cause:** Caddy `trusted_proxies` is not configured, so Caddy is not resolving the
real client IP.

**Fix:** Ensure the global `{ servers { trusted_proxies static ... } }` block is in
`/etc/caddy/Caddyfile` with the full current Cloudflare IP list (Step 4.1). Then:

```bash
systemctl reload caddy
```

### Turnstile widget does not appear on login/register

**Causes:**
- `VITE_TURNSTILE_SITEKEY` is not set or was not set during the Docker build
  (it is baked in at build time, not runtime — a re-deploy is required)
- The hostname in your Turnstile widget configuration does not include your game domain
  (Cloudflare dashboard → Turnstile → your widget → add the domain)
- Rocket Loader is ON — it defers and can block Turnstile's script from loading
  (Step 5.1)

### Admin dashboard returns 404 or serves game instead

**Cause:** The admin hostname is not being detected. Possible causes:
- DNS record for the admin hostname does not exist in Cloudflare
- Caddy does not have a site block for the admin hostname
- For custom hostnames (Option C): `ADMIN_HOSTNAME` env var is not set, or is set to
  a different value than the actual hostname the request arrives with

Check:

```bash
# What host does the game server see for an admin request?
docker logs eastbrook-game 2>&1 | head -20

# Is ADMIN_HOSTNAME set?
grep ADMIN_HOSTNAME /opt/eastbrook/.env
```

### GLB models or textures not loading (404 or corrupted)

**Cause:** Polish is re-encoding the binary assets (Step 5.4).

**Fix:** Cloudflare → **Speed → Optimization → Polish → Off**. Also purge the cache:
**Caching → Configuration → Purge Everything**.

### Caddy fails to get Let's Encrypt certificate

When a new hostname is added to the Caddyfile, Caddy tries to get a certificate via
the ACME HTTP-01 challenge. This requires port 80 to be accessible from Let's Encrypt's
servers.

If Cloudflare is proxying the domain (orange cloud), the ACME challenge goes through
Cloudflare → Caddy. Cloudflare does NOT cache `/.well-known/acme-challenge/` paths,
so the challenge reaches Caddy correctly.

However, if the DigitalOcean Firewall was set too restrictively (e.g. blocking port 80),
the challenge fails. Ensure port 80 from Cloudflare IPs is open in the firewall (Step 9).

Check certificate status:
```bash
journalctl -u caddy --no-pager -n 30 | grep -i "acme\|cert\|tls"
```
