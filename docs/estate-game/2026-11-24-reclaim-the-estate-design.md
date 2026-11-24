# Reclaim the Estate: Design

**Date:** 2026-11-24
**Status:** Draft. Waiting on Castle Quest's real task list for the Three Lakes deal.
**Lineage:** Reclaim City (`docs/superpowers/specs/2026-09-07-reclaim-city-design.md`) + Solarpunk Utopia (`lizTheDeveloper/solarpunk_utopia`, `lizTheDeveloper/solarpunk_utopia_project`)
**First campaign:** Castle Quest, Three Lakes Estate, Lake Trasimeno, Umbria (https://castlequest.eu)

> This doc lives here temporarily. It should move to its own repo (see Open Questions).

## Overview

Getting land for an intentional community is hundreds of small, boring, important tasks spread across a group of busy people. Most attempts don't fail because the vision is bad. They fail because the work stalls: nobody gets the survey quote, the bylaws sit in a Google Doc no one opens, and the deposit deadline passes.

Reclaim the Estate turns that work into a shared restoration game. A crew restores an abandoned estate room by room, and every room maps to a real step toward owning and living on the land. When the real task is done, the room comes back to life for the whole crew.

**Core promise:** The overwhelming project plan becomes a house you can watch coming back to life.

**Who plays:** Millennials, roughly 30 to 45. They have jobs, some have kids, and they have limited evenings. They want to be part of something meaningful and are tired of renting. They respond to visible progress, peer recognition and short, clearly scoped tasks. They do not respond to guilt, streak-shaming or leaderboards that rank friends against each other.

## What Carries Over From Reclaim City

| Reclaim City | Reclaim the Estate | Reuse |
|---|---|---|
| City map with districts | Estate map with wings | Map and building-state rendering (`src/components/building.js`, `city-lights.js`) |
| Building states: occupied, in progress, liberated | Room states: overgrown, scaffolded, restored, lived-in | Same three-state system plus a fourth, social state |
| Briefing (why + exact steps + external links) | Same | `src/screens` briefing pattern |
| Debrief (structured field report, not a checkbox) | Same, but the report is shared with the crew | Debrief pattern |
| "Not yet" with no penalty | "Not yet," plus **hand off** | Extended |
| Companion (the Scout) | The Steward | New character, same role |
| Liberation % | Restoration %, per wing and for the whole estate | `fill-bar.js`, `hud.js` |
| Single player, local state | **Crew (multiplayer), shared state** | **New. The main build cost.** |

## The Main Difference: A Crew, Not a Solo Player

Reclaim City is about *your* accounts. This game is about a *group* project. That changes three things:

1. **Shared estate state.** Everyone in a crew sees the same estate. One person's finished mission restores a room for everybody.
2. **Claiming.** A player claims a mission so two people don't do the same task. The claim is visible ("Malena is on this").
3. **Hand-off instead of failure.** If a claimed mission hasn't moved in N days (the crew sets N), it turns into **stalled scaffolding**. The claimer gets one gentle check-in, then anyone can pick it up. Nobody is named as a failure. The building simply shows the work waiting.

### Why this motivates people (and what we avoid)

Using Yu-kai Chou's Octalysis framework (run the `octalysis-audit` skill on the finished design):

- **Epic Meaning** (white hat): "We are taking land off the speculative market." This is the main drive.
- **Development & Accomplishment** (white hat): a visible room coming back. Same mechanism as Reclaim City.
- **Social Influence & Relatedness** (white hat): crew members see and thank each other's work. **Kudos, not rankings.**
- **Ownership** (white hat): you literally restored that room. Your name goes on its plaque.
- **Avoided on purpose:** loss aversion (no streaks that break), scarcity pressure (no fake timers), leaderboards between crew members. Real deadlines (deposits, visa appointments) are shown as real deadlines, labelled as such and never invented.

## Estate Structure

### Wings (phases of getting land)

The order follows the real dependency chain: you can't do due diligence without a property shortlist or raise money without an ownership structure.

| # | Wing | Real-world work | Done when |
|---|---|---|---|
| 1 | **The Gate**: Crew | Shared vision, non-negotiables, who's in and at what commitment level, how decisions get made before there are bylaws | Crew charter signed by everyone |
| 2 | **The Library**: Research | Property shortlist, zoning and permitted use (*destinazione d'uso*), the comune and its politics, visits to existing communities (Damanhur, Tertulia) | One target property chosen |
| 3 | **The Counting House**: Money and structure | Total budget, contributor and investor list, legal structure (housing cooperative, APS association, SRL company, or a foundation holding the land in trust), equity vs. use rights | Term sheet everyone agrees to |
| 4 | **The Cellar**: Due diligence | Structural survey, title search (*visura catastale*), choosing a *notaio*, environmental and heritage constraints, utility and water rights | Due diligence report with go / no-go |
| 5 | **The Great Hall**: Governance | Bylaws, membership terms, joining and leaving, what happens to someone's stake when they leave, conflict resolution, decision method (e.g. sociocracy, consent) | Bylaws adopted |
| 6 | **The Tower**: Relocation | Visa route for each person (e.g. elective residence, digital nomad, EU citizens' rights), *codice fiscale*, residency registration (*residenza*), healthcare enrollment | Every relocating member has a route and a timeline |
| 7 | **The Grove and Kitchen**: Move-in | Preliminary contract and deposit (*compromesso* / *caparra*), closing at the notaio, renovation triage, olive grove care, getting the restaurant running, first residency season | Keys in hand, first people living there |

**Accuracy note:** The Italian legal, visa and tax details above are starting points, not advice. Each mission that touches law, money or immigration must name its source (official government page or a professional), must have a "check with your notaio / commercialista / immigration lawyer" step, and must be reviewed by Castle Quest's consultants before launch. Rules and income thresholds change. A mission must never hardcode a number without a source and a "last checked" date.

### Mission phases inside each wing

Like Reclaim City's Survey → Recon → Fortify → Reclaim:

1. **Dream**: what do *we* want from this wing? (Discussion missions.)
2. **Research**: find out what's actually true. (Look-it-up missions.)
3. **Prepare**: drafts, quotes, comparisons. (Make-a-thing missions.)
4. **Commit**: the crew decides and signs. (Group decision missions.)

### Mission types

| Type | Who | Example | Debrief |
|---|---|---|---|
| **Solo** | One person | "Get two quotes for a structural survey of the main building" | Quotes attached, short notes |
| **Pair** | Two people | "Call the comune's technical office about permitted use" (one Italian speaker, one note-taker) | Call summary |
| **Crew** | Everyone | "Each of us writes our 3 non-negotiables" | Every member submits; the room restores at 100% |
| **Decision** | Crew vote | "Adopt the governance method" | Result of the crew's chosen decision method |
| **Personal** | Each relocating person, private | "Check which visa route fits you" | Private: the crew sees only "on track / needs help" |

**Size:** every mission must fit in **15 to 30 minutes** of focused work. Anything bigger gets split. That's the most important design rule. A mission named "Write the bylaws" is a bug.

### Example mission

```
THE CELLAR: TITLE SEARCH
────────────────────────
Before anyone puts money down, we need to know who actually
owns this land, and whether there are mortgages, liens or
disputed boundaries on it. Italian property records are public.

YOUR MOVE
  Step 1: Get the property's cadastral data (foglio, particella)
          from the seller or the listing.
  Step 2: Request a visura catastale through the Agenzia delle
          Entrate's online service, or ask the crew's notaio.
  Step 3: Upload the PDF and note anything you don't understand.

Takes about 25 minutes        Claimed by: you
[Go do it →]   [Not yet]   [Hand off]
```

Debrief:
- **What did you find?** Clean / Something to ask the notaio about / Couldn't get it
- **Attach:** the document
- **Flag for the crew?** Yes / No

## Progression and Rewards

### Room states

1. **Overgrown**: ivy, broken shutters, dark windows. Nobody has touched it.
2. **Scaffolded**: someone has claimed a mission here. Their name is on the scaffold sign.
3. **Restored**: missions done. Shutters open, light inside.
4. **Lived-in**: shown only after real move-in milestones. Laundry on the line, someone cooking, music.

**Stalled scaffolding**: a claim past the crew's N-day window shows faded scaffolding with a "help wanted" sign. It's neutral, not red, and never shaming.

### The Steward

The companion. A warm, slightly wry old caretaker who has looked after the empty estate for years and is quietly thrilled that people have finally come.

- Briefs missions with the estate's history ("The Cellar flooded in '87. Ask about drainage.")
- Notices and names crew members' work ("Nicole finished the survey quotes. The Cellar is half lit now.")
- Asks for help on stalled scaffolding without blaming anyone ("This one's been waiting a while. Anyone have 20 minutes?")
- Never guilt-trips. Same tone rules as the Scout in Reclaim City.

### Plaques and the Estate Book

- Every restored room gets a plaque listing who restored it. This is permanent.
- **The Estate Book** is the crew's shared log of every debrief: the findings, documents and decisions. It doubles as the actual project archive. When the notaio asks for the survey, it's in the Book. **This is what makes the game useful outside the game.** The work products are real.

### Kudos

Crew members can thank each other for a specific mission. Kudos show on plaques. There is no total, no ranking, no "top contributor."

## Values and the Money Tension

`solarpunk_utopia_project` says: *"Non-Monetary: No money, no crypto, no tokens."* Buying a 60-room estate needs capital. The game says this out loud instead of hiding it:

- **The Counting House is honest:** land costs money; here is how we raise it and who holds what.
- **The community land trust is introduced as the bridge.** Capital buys the land, a trust or foundation holds it so it can never be resold for speculation, and life on the land runs as a gift economy. Italy has no established CLT legal form like the US does, so this is an open research question for The Counting House, not a promise.
- **After move-in, the game hands off to Solarpunk Utopia.** Once The Grove and Kitchen is restored, the crew's daily coordination (time banking, needs/offers, shared tools) moves to the `solarpunk_utopia` mesh app. The estate game is the before; Solarpunk Utopia is the after.
- **No in-game currency.** Rewards are rooms, plaques, kudos and the Book. Nothing to buy, nothing to trade.

## Data and Privacy

We just built a privacy game, so this one has to meet the same standard.

- Personal missions (visas, finances, health) are **private to the member**. The crew sees status only.
- Documents (IDs, financial statements) are not stored in the game unless the crew turns on encrypted storage. By default, the game stores a link or a "done" flag, and the document lives in the crew's own storage.
- A crew can export the whole Estate Book and leave at any time.
- No third-party analytics. No selling or sharing of data, ever. (Castle Quest's Airtable funnel stays a separate, clearly labelled opt-in step.)

## Campaigns (Engine vs. Content)

- **Engine:** open source, generic. Wings, missions, states, crew, Steward. Any group trying to get land can use it.
- **Campaign:** content packs. `castle-quest-three-lakes` is the first: Italian law, Umbria, the actual property. Later campaigns could be "Detroit land bank lot," "Portuguese quinta," "US rural CLT."
- Missions are data (JSON or Markdown), not code, so a campaign can be written by a non-developer. Same approach as Reclaim City's `src/data`.

## Technical Sketch

- **Front end:** fork the Reclaim City shell (vanilla JS, router, state, PWA, service worker). Swap the city map for an estate map.
- **Shared state:** the main new piece. Options, cheapest first:
  1. A small hosted service (like `collective/service` in this repo) with a crew invite link. **Recommended for v1.**
  2. Local-first sync (CRDT), which fits the Solarpunk mesh philosophy but costs more to build.
  3. Later: sync over the `solarpunk_utopia` mesh network.
- **Notifications:** opt-in only, at most one per day, and only about the crew's work, never manipulative.

## v1 Scope

**In:**
- One crew, invite link, 2 to 12 members
- The Gate and The Library wings, fully written (about 25 to 35 missions)
- Claim / not yet / hand off / stalled scaffolding
- Room states 1 to 3, plaques, kudos, Estate Book
- The Steward, with briefing and reaction lines
- The Castle Quest campaign for those two wings

**Out (v2+):** the remaining wings, encrypted document storage, decision voting UI, the Lived-in state, the Solarpunk Utopia hand-off, more campaigns.

**Why start with The Gate and Library:** they don't depend on the Three Lakes deal closing, they're useful to any crew, and they test whether the crew mechanic actually gets millennials to show up before we build the money and legal wings.

## Success Measures

- Share of claimed missions finished within the crew's window
- Share of stalled missions picked up by someone else (this measures whether the hand-off mechanic works)
- Weekly active members per crew
- Ultimately: did the crew get the land?

## Open Questions

1. **Castle Quest's real task list** for Three Lakes. This is required before writing missions for wings 3 to 7.
2. **Repo:** move this doc to a new repo (proposed name `reclaim-the-estate`) once it's created.
3. **Deal structure:** open-source engine + Castle Quest campaign is proposed. Not yet agreed.
4. **Who reviews legal, tax and visa content?** Castle Quest's consultants (Jordan Hammond, Malena Grosz, Nicole Reese) or an Italian professional.
5. **Which land-holding structure** works in Italy as a CLT equivalent (foundation? cooperative with a lock on resale?). This needs research before The Counting House is written.
6. **Language:** English first, or English and Italian from v1?
