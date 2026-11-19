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

Deploys are this manual rsync only. There is no CI deploy: the old GitHub Actions workflow was removed in v7.13.3 (the studio runs no GitHub-hosted CI and keeps no deploy keys on GitHub).

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
- **GlitchTip:** `errors.multiversegames.ai` project 15 `reclaim-city` (its own project since v7.3.1; before that it shared MVEE's project 2). The browser client (`src/utils/errors.js`) and the collective job (`collective/job/install.sh` default `job.env`) both use the project 15 DSN.

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

## Web cabinet mode (campus)

campus.themultiverse.school opens Reclaim City in an iframe at `/reclaim-city/?cabinet=campus`
(the query comes before the hash). Cabinet mode is on only when the page is framed AND that
query is present (`src/utils/cabinet.js`). Then the game posts
`{ type: 'mg:ready', v: 1, game: 'reclaim-city' }` to `https://campus.themultiverse.school`
(never `*`) once it has booted, and hides the SUPPORT and Patreon asks. Nothing else changes, and
nothing changes outside cabinet mode. There is no launch pass (free game, no accounts).

Framing is allowed by play-portal's nginx, which sends
`Content-Security-Policy: frame-ancestors 'self' https://campus.themultiverse.school` for
`/reclaim-city/` only. Deploy the play-portal change with this one or campus's iframe is refused.
A frame that blocks storage plays without saving.

## Scout's voice ("Read it to me")

Scout reads in a recorded ElevenLabs voice (`collective/service/voice.js`). The service only voices lines on `collective/voice-lines.json`, which is built from the game's own text. After changing any mission, step or dialogue text:

```sh
node scripts/voice-lines.mjs        # tests/voice-lines.test.js fails until you do
```

Every game deploy also syncs the list (the service rereads it within a minute):

```sh
rsync -az collective/voice-lines.json games:/opt/reclaim-city-collective/voice/voice-lines.json
```

Then record the new and changed lines ahead of players, so nobody hears the browser's voice on a line's first listen:

```sh
scripts/warm-voice.sh --dry-run     # how many lines and characters are missing; spends nothing
scripts/warm-voice.sh               # records them in the background (unit rc-voice-warm)
ssh games journalctl -u rc-voice-warm -f
```

It runs `collective/service/warm.js` in the service's image (same voice, model and key) without restarting the service. It records only lines with no recording, or with a bad one (not an mp3, or under ~0.2s); a recorded line is never sent again. Ids are a hash of the spoken text, so a changed line is a new id and the old recording just stays on disk, unused. It checks the ElevenLabs plan first and stops before fewer than 100,000 characters would be left (`--reserve N`; `--max-chars N` caps a run). If it can't read the plan, or a limit isn't a number, it records nothing; `--allow-unknown-budget --max-chars N` spends at most N anyway.

A line is also recorded the first time a player asks for it and kept in `/opt/reclaim-city-collective/voice-cache/`. `VOICE_DAILY_CHARS` (default 150,000) caps new recording per day; past it, and for any line not on the list, the game reads with the browser's own voice. The key is `ELEVENLABS_API_KEY` in `/opt/reclaim-city-collective/voice.env` (root, 600).

Updating the service itself: `rsync -az --exclude node_modules --exclude test collective/service/ games:/opt/reclaim-city-collective/service/` then `ssh games 'cd /opt/reclaim-city-collective/service && docker compose up -d --build'`.
