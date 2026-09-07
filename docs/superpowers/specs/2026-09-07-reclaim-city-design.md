# Reclaim City: Identity Defense Game

**Date:** 2026-09-07
**Status:** Design
**Origin:** Gamification of the [Identity Defense Bench](https://themultiverse.school/tools/identity-defense-bench)

## Overview

Reclaim City turns the Identity Defense Bench — a comprehensive but overwhelming privacy checklist — into a city-liberation game. Players reclaim a city occupied by data brokers, building by building, by completing real-world privacy and security actions. The bench's content is fully preserved but restructured around a campaign of bite-sized missions instead of a wall of checkboxes.

**Inspiration:** Hank Green's phone-down app (do a real-world action → get a digital reward), applied to privacy defense.

**Core promise:** The worksheet of fear becomes a game of getting your data back.

## Core Game Loop

1. **See the city** — The player's home screen is a city map showing districts in various states of occupation (dark/surveilled) and liberation (bright/thriving).
2. **Pick a mission** — Select from available missions in a district, or follow the game's recommended next mission.
3. **Get briefed** — A guided walkthrough explains WHY this action matters and exactly WHAT to do, with direct links to external sites.
4. **Do the real-world action** — The player leaves the game, goes to the external site, and performs the action.
5. **Debrief** — Report back with structured answers about what was found. Not a checkbox — a field report.
6. **Watch the city transform** — The building associated with the mission visually transforms. Surveillance cameras come off, lights come on, citizens appear.

## City Structure

### Districts

The bench is currently organized by action type (check all accounts for breaches, then all for password health, etc.). The game reorganizes by **domain** — parts of the player's digital life. This makes progress feel natural: "today I'm securing my email" instead of "today I'm doing breach checks on 40 accounts."

| Chapter | District Name | Bench Content | Why This Order |
|---------|--------------|---------------|----------------|
| 1 | The Master Keys | Email + Identity Providers (Google, Apple, Microsoft, Facebook Login) | Email is the master key — password resets for everything flow through it. Secure this first or nothing else matters. |
| 2 | The Vault | Financial — banks, PayPal, Venmo, Cash App, crypto, investments | Money. Direct loss risk. |
| 3 | The Square | Social media + messaging — Instagram, Twitter, Discord, WhatsApp, Signal, Slack | Hijacked social accounts impersonate you to people who trust you. |
| 4 | The Archives | Cloud storage + work — Google Drive, Dropbox, GitHub, employer SSO | Files, tax returns, ID scans, professional reputation. |
| 5 | The Marketplace | Shopping + streaming — Amazon, Netflix, DoorDash, Uber | Lower stakes but real attack surface (stored payment methods, address). |
| 6 | The Capitol | Government — SSA, IRS, DMV, healthcare, student loans | Legal identity. Compromise here is identity theft in the fullest sense. |
| 7 | The Perimeter | Border crossing prep, device security, scam defense | Cross-cutting defenses that protect the whole city. |
| 8 | The Reclamation | Data broker opt-outs | The endgame: getting your data back from the brokers who sell it. |

### Mission Phases Within Each District

Each district's missions are layered in a natural progression:

1. **Survey** — "Which of these accounts do you actually have?" The player builds their personal map. Accounts they don't have are skipped, keeping the mission count relevant.
2. **Recon** — Breach checks (haveibeenpwned), login history reviews. "Find out what's been compromised."
3. **Fortify** — Password resets, 2FA setup, recovery options. "Lock it down."
4. **Reclaim** — Privacy settings, data opt-outs, cleanup. "Take it back."

## Mission Design

### Briefing

Each mission has a guided walkthrough, not just a task name:

```
BREACH RECON: GMAIL
───────────────────
Data brokers buy and sell leaked credentials by the million.
If your password appeared in a breach, it's already in automated
attack scripts hitting login pages right now.

YOUR MOVE
  Step 1: Open haveibeenpwned.com
  Step 2: Enter your Gmail address
  Step 3: Read the results

[Go do it →]

Estimated time: 2 minutes
```

### Debrief

After returning from the real-world action, the player reports back with structured choices:

- **What did you find?** (No breaches / 1-2 breaches / 3+ breaches)
- **What did you do about it?** (Reset password / Already had a unique password / I'll come back to this)

The debrief serves three purposes:
1. **Light verification** — answering requires having actually seen the results
2. **Security posture capture** — answers feed the exposure score and companion reactions
3. **Emotional reframe** — reporting intel, not checking a box

### The "Not Yet" Option

Every mission debrief includes a "Couldn't check right now" or "I'll come back to this" option. The mission stays queued with no penalty. The bench has no middle ground (unchecked = undone); the game normalizes coming back tomorrow.

### Findings Affect the City

- Building where a breach was found and fixed → a battle scar/trophy mark (pride, not shame)
- Building that was clean → lights up normally
- Building skipped ("I don't have this account") → doesn't appear in the city

The city tells the story of what the player actually encountered.

## Progression & Rewards

### Visual City Progression

Buildings have three visual states:
- **Occupied** — dark windows, glitchy static, surveillance cameras, data-broker antennas pulsing red
- **In progress** — scaffolding, some lights flickering on
- **Liberated** — lights on, citizens on the sidewalk, gardens, murals

District completion triggers a larger celebration: the district banner goes up, the whole block lights up.

### The Companion

A guide character who lives in the city and partners with the player in the liberation effort. Not a pet to raise — a collaborator.

- Delivers mission briefings with personality
- Reacts to debrief results ("Yikes, 3 breaches. Good thing we caught that.")
- Moves more freely through the city as districts are liberated
- Occasionally checks in during drip mode ("The Vault is 60% liberated — two more days at this pace")
- Tone: warm, encouraging, slightly wry. Never shaming.

### Stats

- **Liberation %** — per district and citywide. The headline number.
- **Exposure score** — starts high, drops with each completed action. Framed as "how much of your data is currently for sale."
- **Findings log** — concrete record: "You found 3 breaches, reset 8 passwords, filed 5 opt-outs."
- **Streak** — consecutive sessions with a completed mission (drip mode).

### Shareable Milestone Cards

When a player completes a chapter, they get a generated card they can share:

```
┌──────────────────────────────────┐
│  🏛️ THE MASTER KEYS: LIBERATED  │
│                                  │
│  5 accounts secured              │
│  2 breaches found and fixed      │
│  100% liberation                 │
│                                  │
│  Reclaim your city →             │
│  themultiverse.school/reclaim    │
├──────────────────────────────────┤
│  reclaim city                    │
└──────────────────────────────────┘
```

No account required to share. The card is generated client-side. The link drives new players to the game.

## Pacing Modes

### Campaign Mode

- All chapters visible from the start
- Chapter 1 ("The Master Keys") highlighted as "Start Here" with companion explanation
- No artificial locks — players can jump to any chapter if urgency demands it
- Within a chapter, missions are ordered by phase (Survey → Recon → Fortify → Reclaim)
- A focused player can finish a chapter in 30-45 minutes

### Drip Mode

- Player opts in and picks frequency: daily, every other day, 3x/week
- The game serves one mission at a time, drawn from the current chapter in smart order
- Notification (browser push or email): "Today's mission: Breach Recon on your primary bank. Estimated time: 3 minutes."
- Streak tracking for consecutive completions
- Companion check-ins on progress

### Switching Between Modes

Players can switch anytime. Start in drip, get motivated, binge a chapter. Start in campaign, get busy, switch to drip. The city tracks what's done regardless of how you got there.

## Platform & Data

### Tech

- Web app, greenfield
- Hosted alongside the bench on themultiverse.school (or a subdomain/path like themultiverse.school/reclaim)
- The existing bench is plain HTML/CSS/JS with no framework — tech choice for the game is open

### Data Storage

- **Browser-local only** (localStorage). No accounts, no server-side user data.
- Matches the bench's existing model: "Your answers stay in your browser."
- A privacy game that requires an account would undermine its own message.
- Trade-off: progress doesn't sync across devices. Acceptable for the audience and the message.

### Relationship to the Bench

- The game is a new product, not a modification of the bench
- The bench's checklist content is the source of truth for mission content
- The bench remains available as a reference/power-user tool
- No data sync between bench and game (both are browser-local but independent)

## Content Scope

### From the Bench (Station 1: Account Map)

The bench's Account Map station covers 10 categories with ~40 pre-listed accounts, each with 4 sub-actions (breach check, login review, breach flag, password reset), plus the ability to add custom accounts. This maps to approximately:

- Chapter 1 (Master Keys): ~25 missions (5 email + 4 identity providers, each with Survey + Recon + Fortify)
- Chapter 2 (Vault): ~35 missions (7 financial accounts)
- Chapter 3 (Square): ~30 missions (6 social + 5 communication)
- Chapter 4 (Archives): ~20 missions (4 cloud + 4 work)
- Chapter 5 (Marketplace): ~25 missions (5 shopping + 4 streaming)
- Chapter 6 (Capitol): ~25 missions (5 government)

### From the Bench (Stations 2-8)

Stations 2-8 (Password Health, Recovery Audit, Rebuild, Data Cleanup, Border Crossing, Scam Defense, Audit Card) become missions distributed across chapters or concentrated in Chapters 7-8 (The Perimeter, The Reclamation). Full content mapping required during implementation.

### Custom Accounts

The bench allows adding custom accounts. The game should too — during the Survey phase of any district, a player can add accounts the game doesn't list. These generate the same mission sequence (Recon → Fortify → Reclaim) as pre-listed accounts.

## Non-Goals

- No server-side accounts or authentication
- No social features beyond shareable milestone cards
- No real-time verification of external actions (debrief is trust-based)
- No mobile app — web only (responsive design for mobile browsers)
- No integration with external APIs (haveibeenpwned, etc.) — the game links to them, doesn't call them
