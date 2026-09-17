# Deploying Reclaim City

Reclaim City is a static site served from the Multiverse Games play portal on Hetzner.

**Live URL:** https://play.multiversestudios.xyz/reclaim-city/
**Homepage listing:** https://multiversegames.ai/ (top of hero section)

## Server

- **Host alias:** `games` (see `~/.ssh/config`)
- **IP:** 157.180.120.104
- **Container:** `play-portal` (nginx, managed by docker-compose)
- **Files on server:** `/opt/play-portal/reclaim-city/`
- **Dockerfile line:** `COPY reclaim-city/ /usr/share/nginx/html/reclaim-city/`

## Manual deploy

From the repo root:

```bash
# 1. Rsync src/ to the server
rsync -avz -e "ssh" --delete \
  --exclude='.git' --exclude='node_modules' --exclude='docs' \
  --exclude='tests' --exclude='.claude' --exclude='.github' \
  ./src/ games:/opt/play-portal/reclaim-city/

# 2. Rebuild and restart the container
ssh games "cd /opt/play-portal && docker compose -f docker-compose.prod.yml build && docker compose -f docker-compose.prod.yml up -d"

# 3. Verify
curl -s -o /dev/null -w "%{http_code}" https://play.multiversestudios.xyz/reclaim-city/
# Should return 200
```

## What gets deployed

Everything in `src/` is deployed. The server serves static files — no build step.

- `src/index.html` — entry point
- `src/app.js` — main app (ES module)
- `src/style.css` — cyberpunk design system
- `src/router.js` — hash-based routing
- `src/state.js` — localStorage state management
- `src/data/` — districts, accounts, missions
- `src/screens/` — city map, district, briefing, debrief, stats, milestone
- `src/components/` — HUD, building, scout
- `src/utils/` — calc, errors (GlitchTip), milestone card
- `src/assets/` — pixel art buildings, characters, UI

## Analytics and error tracking

- **Umami:** Shared with Multiverse Games (`analytics.multiversegames.ai`, website ID `38d680a7-28d1-42fd-9fd5-a66702675b88`)
- **GlitchTip:** `errors.multiversegames.ai` project 2 (same DSN as MVEE)

## Symlink

This repo is symlinked into the Multiverse Games monorepo:

```
~/src/multiverse_games/games/reclaim-city -> ../../privacy-the-game
```

## Homepage listing

The marketing site at `multiversegames.ai` lists Reclaim City in the hero section. That file lives at `/opt/marketing-site/html/index.html` on the `games` server. To update the listing, edit that file and rebuild the marketing-site container:

```bash
ssh games "cd /opt/marketing-site && docker compose build && docker compose up -d"
```
