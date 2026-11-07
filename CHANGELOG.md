# Changelog

Reclaim City's releases. Versions before 7.13.0 are described in their pull requests and commit messages (`git log`).

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
