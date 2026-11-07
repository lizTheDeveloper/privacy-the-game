# Changelog

Reclaim City's releases. Versions before 7.13.0 are described in their pull requests and commit messages (`git log`).

## 7.13.3 (2026-11-06): Test sweep

- **Privacy promises are tested by what the app does, not by what its source says.** A new harness (`tests/helpers/app-harness.mjs`) boots the real `app.js` in node and watches every way out: Umami, `fetch` and `sendBeacon`. The password manager's per-category counts, re-checks, saints' candles, bank notes, custom accounts' missions, where you live, the sky ladder and `api/whoami` with sharing off are now checked through the real click handlers. The source greps they replace passed with a leak routed through a renamed helper, and with `api/whoami` sent while sharing was off.
- **The Whole City says what a player is.** Scout's explainer and the footer now say a player is a browser session, not a person: one person counts again per device, connection and month. The explainer no longer says "nobody can be picked out".
- **ACTIONS TAKEN counts each mission once per player**, and DISTRICTS each district once: a debrief re-filed or resent by restore used to count again.
- **YOUR PLACE finds a city however it is spelled**: the lookup groups "St Louis" and "St. Louis" the way the nightly job does.
- **The collective tests run from the repo:** `npm run test:collective` (the service and the runner) and `npm run test:collective:sql` (the SQL tests, on a throwaway local Postgres).
- **The bounty guard** closes bounty PRs that add data files under `research/data-brokers/build/` (only the four config files may change), accepts only real Wayback snapshot links as evidence (not `/save/` links or CONTRIBUTING's placeholder), and holds outside PRs that change the test config, fixtures, `package.json` or the guard itself for a maintainer.
- **`npm run brokers:validate` checks what contributors edit**: the curation config in `build/` and the research records in `staging/`, as well as the dataset. Sources need http(s) URLs, real Wayback snapshots, a known kind and a real date; registry years are four digits. The test suite runs it on the real data and checks `broker-map.json` against a fresh export. `brokers:check-urls` checks that the machine is online first, and won't write a run where more than 20% of URLs come back dead unless given `--force`.
- Removed the GitHub Actions deploy workflow (it had failed on every run since September; deploys are the manual rsync in DEPLOY.md).
- Flaky timing tests fixed: two slow sweeps now draw deterministically, and the map's render test bounds output size instead of wall-clock time.

## 7.13.2 (2026-11-06): Logic sweep

- **OPT-OUTS FILED counts every opt-out.** It counted only the two car-broker missions. Opt-out missions are now tagged in the data (`optOut`), and 50 count: broker purges, AI training, car makers, carriers, loyalty programs, genetic research.
- **The streak ends when a day is missed.** The HUD, Your City and the welcome-back note all read the streak as it stands today. BEST is kept.
- **A repaired or older save keeps the Freeway's car accounts off.** Missing accounts are filled from the new-city defaults, not switched on.
- **The government map files every entry by its own pipe.** Each leak entry names its pipe in the data; the id guessing is gone. Nineteen entries moved: for example TURBINE, iSpy, the ANT catalog and the bugged routers to Hacking tools, and the Verizon order and Dishfire to Phone records. A seventh pipe, "Kept by the company", holds Ring staff, Tesla staff and Alexa recordings, which no agency took.
- **Sharing off means no crash reports either.** GlitchTip starts only while sharing is on and the player hasn't gone ghost, and stops when either changes. The ghost screen no longer looks the player up with sharing off, and SHOW ME then shows what the browser itself reports, without sending anything.
- **The first load after a release runs the new code.** The service worker fetches scripts, the stylesheet and data network-first, keeping the cache for offline play.
- **Bug reports name a building or re-check screen without the account**, by the same rule as pageviews.
- Removed unused code: `setResidency`, `isFullySealed`, `weakerMethod`, `applyDebrief`, `lastBurstAt`.

## 7.13.0 (2026-11-02): Nearly there, finished

**Scout speaks in every district.** The Foundry, The Freeway, The Grid, The Clinic and The Trail now have Scout's welcome, the 25 / 50 / 75 / 100% check-ins, lore drops on their briefings, a line for a parked mission, and allied organizations once the district is taken back. Before this, Scout spoke only in the first eight districts.
- The Grid, Clinic and Trail lines come from the drafts in `docs/scout-dialogue-ch10..12`, cut to what each district's own mission briefings say. Where a draft and the briefings disagreed, the briefings won. For example, Wyze disclosed its 2019 exposure within days, and 23andMe has a new owner. Foundry and Freeway are new writing in the same voice.
- A new test holds every number Scout says in these districts to that district's missions.
- Threats name who does them (Meta, LexisNexis and Verisk, prosecutors in states with abortion bans, a SIM-swap crew), never an unnamed "they".
- Fix: the facility intro for The Grid, The Clinic and The Trail waited for a Scout welcome that didn't exist, so it never showed. It shows now, once Scout's welcome is dismissed.

**Accounts you add get their own missions.** "Add another account..." on a survey now gives that account four missions: a sign-in check (Recon), its password and a second step (Fortify), and its recovery email and phone (Reclaim).
- The game doesn't know these services, so the steps work on almost any account. There are no links, no menu names and no claims about what the service does. There is one line for the district's kind of account (for example, "if it offers alerts for sign-ins or payments, turn them on").
- The password mission says to change the password only if there's a reason to, the same rule as everywhere else in the game.
- They are bonus missions: they never count toward a district's progress, its lights or the city's totals, so adding an account can't take a finished district below 100%.
- Private, like bank notes: the name stays in this browser. A mission id carries a hash of the name, never the name itself. These missions send no analytics events, their screens are reported as `#/mission/custom`, and their rows are dropped from error-report breadcrumbs.

**Reminders, honestly.** The "streak reminder" could only run when the game was opened, so it reached only players who were already back, and the game has no push server.
- The game no longer asks for notification permission, because nothing could be delivered with it, and it shows no system notification.
- What the streak check finds now appears on the city map as a note labelled WELCOME BACK. For example: "Your 3-day streak is still going. File one mission today to keep it." Or: "...ended while you were away. Everything you secured still counts."
- The permission code stays in `utils/notifications.js` behind `REMINDERS_DELIVERABLE = false`, ready for real push when the app ships it.
