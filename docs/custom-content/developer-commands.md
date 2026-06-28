# Developer Commands

This document covers all developer and debug commands available during local
development and testing. None of these commands are accessible in production.

---

## Overview: two command surfaces

| Surface | Where | How to enable |
|---|---|---|
| Offline chat commands | In-browser, `npm run dev` | Automatic (Vite dev mode) |
| Online WS dev commands | Connected to server | `ALLOW_DEV_COMMANDS=1` in `.env` |

**NEVER set `ALLOW_DEV_COMMANDS=1` when `DATABASE_URL` points at your production
database.** These commands bypass normal gameplay restrictions and have no access
control beyond the env flag. Set it only for local dev or a dedicated test server.

---

## Offline dev chat commands

Available automatically in the offline (single-player browser) mode when running
`npm run dev`. The Sim detects Vite's dev mode (`import.meta.env.DEV`) and
enables `devCommands` automatically -- no `.env` change needed.

Type these directly in the in-game chat box:

### `/dev level N`

Sets your character's level to N (1 to max level).

```
/dev level 20
```

Aliases: `/devlevel N`

### `/dev tp X Z`

Teleports your character to world coordinates (X, Z). The Y (height) is
resolved from the terrain, so you always land on the ground.

```
/dev tp 0 960
/dev tp -48 1190
```

Aliases: `/devtp X Z`

Common destinations in Dragon's Blight:

| Destination | Command |
|---|---|
| Blightwatch Post hub | `/dev tp 0 960` |
| Scout Fenris's outpost | `/dev tp -25 1080` |
| Dragon's Maw entrance | `/dev tp -48 1190` |
| Zone south edge | `/dev tp 0 900` |

### `/dev give itemId [count]`

Adds an item to your inventory by its ID. Count defaults to 1; max is 20 per command.

```
/dev give healing_potion
/dev give custom_drake_scale 8
/dev give custom_fang_of_ignaraxis
```

To find item IDs, search `src/sim/content/` for the item definition or check
`CUSTOM_ITEMS` in `src/sim/content/custom/index.ts`.

### `/dev` (help)

Shows the list of available dev commands in the chat box:

```
/dev
```

---

## Standard chat commands (always available)

These commands are available in both offline and online play with no special flags.

### Channels

| Command | Effect |
|---|---|
| `/s <message>` or `/say <message>` | Say something to nearby players |
| `/y <message>` or `/yell <message>` | Yell (wider range) |
| `/g <message>` or `/general <message>` | General channel |
| `/p <message>` | Party channel |
| `/world <message>` | World channel (if joined) |
| `/lfg <message>` | LFG channel (if joined) |
| `/w <name> <message>` | Whisper a player by name |
| `/r <message>` | Reply to last whisper |
| `/join <world\|lfg>` | Join an opt-in channel |
| `/leave <world\|lfg>` | Leave an opt-in channel |

### Player state readouts

| Command | Shows |
|---|---|
| `/played` | Total time played |
| `/xp` | Current XP and progress to next level |
| `/gold` | Current money |
| `/stats` | Character stats (str, agi, int, etc.) |
| `/bags` | Bag inventory summary |
| `/gear` | Equipped items |
| `/abilities` | Known abilities |
| `/buffs` | Active buffs and durations |
| `/cooldowns` | Ability cooldown states |
| `/quest` | Active quest objectives |
| `/completed` | Completed quest list |

### World readouts

| Command | Shows |
|---|---|
| `/where` | Current zone and coordinates |
| `/zones` | Zone list with level ranges |
| `/nearby` | Nearby players and mobs |
| `/pois` | Points of interest in current zone |
| `/graveyard` | Nearest graveyard/respawn location |
| `/dungeons` | Dungeon list and entrance locations |
| `/arena` | Arena status |
| `/session` | Session info (uptime, player count) |
| `/listings` | World Market current listings |
| `/buyback` | Items available for buyback from vendors |

### Combat readouts

| Command | Shows |
|---|---|
| `/target` | Current target info |
| `/targetbuffs` | Target's active buffs |
| `/range` | Distance to current target |
| `/attack` | Attack stats (hit %, crit %, speed) |
| `/casting` | Current cast progress |
| `/combat` | Combat log (recent damage events) |
| `/threat` | Threat table for current target |
| `/consider` | Target level vs your level (conning) |
| `/combo` | Current combo points (rogue) |
| `/overpower` | Overpower state (warrior) |

### Social

| Command | Shows / Does |
|---|---|
| `/roll` | Rolls a random number (1-100) |
| `/inspect <name>` | Shows another player's level, class, and HP |
| `/follow <name>` | Follow a player |
| `/unfollow` | Stop following |
| `/assist <name>` | Assist a player (target their target) |
| `/afk` | Toggle AFK status |
| `/dnd` | Toggle Do Not Disturb (blocks whispers) |
| `/who` | Online player roster (online play only) |

### Pet and class commands

| Command | Shows |
|---|---|
| `/pet` | Warlock pet status |
| `/pettaunt` | Pet threat state |
| `/speed` | Movement speed |
| `/consumable` | Current consumable (food/drink) |
| `/potion` | Potion cooldown |
| `/form` | Druid current form |
| `/manaregen` | Mana regen rate |
| `/falling` | Falling state and fall damage |
| `/queued` | Queued ability |
| `/savedmana` | Evocation / Innervate saved mana state |

### Help

```
/help
```

Prints a summary of all commands to chat.

---

## Online server dev commands (require `ALLOW_DEV_COMMANDS=1`)

These commands are sent as WebSocket messages from the client to the server.
They are implemented by the HUD dev panel or browser console (not typed in chat).
The server checks `process.env.ALLOW_DEV_COMMANDS === '1'` on every message and
silently ignores them if the flag is not set.

These are primarily used by automated E2E scripts in `scripts/`.

### `dev_level`

```json
{ "cmd": "dev_level", "level": 20 }
```

Sets the player's level server-side.

### `dev_teleport`

```json
{ "cmd": "dev_teleport", "x": -48, "z": 1190 }
```

Teleports the player to (X, Z). The server resolves the terrain Y.

### `dev_give`

```json
{ "cmd": "dev_give", "item": "custom_fang_of_ignaraxis", "count": 1 }
```

Adds an item to the player's inventory. Count is clamped to 1-20.

---

## `/woctier N` (online, `ALLOW_DEV_COMMANDS=1`)

Forces your character's `$WOC` holder-tier flair badge to tier N (0-10) without
requiring a linked wallet with actual token balance. Useful for testing the
nameplate badge display.

Type in chat while connected to the server:

```
/woctier 5
```

The badge level resets to the real verified balance on the next balance refresh or
after rejoining. The force-set is broadcast to all players in the session so the
nameplate renders immediately.

This command requires `ALLOW_DEV_COMMANDS=1` on the server. It does nothing in
offline mode.

---

## Setting up `ALLOW_DEV_COMMANDS=1`

Add to your local `.env` (never commit this):

```env
ALLOW_DEV_COMMANDS=1
```

Then restart the server:

```bash
npm run server
```

To verify it is active, check the server startup log -- it will print a warning
when dev commands are enabled.

**DANGER: Do not set this when `DATABASE_URL` points at your production database.**
It enables level/teleport/item cheats with no access control. Use it only against a
local Postgres instance or a dedicated test database.

---

## E2E and bot scripts

The `scripts/` directory contains Puppeteer-based E2E and bot-raid scripts that use
`dev_teleport` and `dev_level` over WebSocket to set up scenarios. These require:

1. `npm run server` with `ALLOW_DEV_COMMANDS=1`
2. `npm run dev` (Vite client on :5173)

See the individual script headers for usage instructions.
