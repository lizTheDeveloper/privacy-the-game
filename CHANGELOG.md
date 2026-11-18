# Changelog

Reclaim City's releases. Versions before 7.13.0 are described in their pull requests and commit messages (`git log`).

## 7.18.0 (2026-11-17): Simplest works like a phone app; Scout starts you out

Liz on her phone: Simplest still had too many words, DONE sat there before you'd been anywhere, "the box at the top" sent people looking at the top of the game, and Back was tiny text.

- **Simplest step screens.** A big **‹ Back** at the top left (to the step before, or the briefing from step 1) and "Step 2 of 4" in words on the right. Gone from these screens: the score bar, Support, the Read / Steps / Report back trail, the second list of steps, "Finished already?", "Read the briefing again", and the second Read it to me.
- **OPEN first, then DONE.** A step with a website shows one bright button, **OPEN THE WEBSITE ↗**, with the site's address underneath as the phone's address bar shows it. DONE appears once you've opened it, and OPEN becomes a quiet "Open the website again". What you opened is remembered for this visit only, on this device.
- **Every step says where it happens.** A step that happens on a site opened earlier shows "🌐 On haveibeenpwned.com ↗" above the words (tap it to go back there). The email check now says: "On that website, type your Gmail email address in the “Email address” box, and tap “Check”", the box and button as Have I Been Pwned labels them.
- **Help and Read it to me** are big buttons, not small links.
- **Scout starts you out.** On phones Scout's line and NEXT MISSION come first on the city map, right under the top bar, before the buttons and the map.
- Short and Full intel are unchanged.

## 7.17.0 (2026-11-17): The Field, and the way back to the course

- **The Field (chapter 13)** is an opt-in district for people whose work makes them a target: journalists, organizers, clinic workers, legal observers, mutual aid. Nine buildings, 74 missions, built from The Multiverse School's Field Opsec playbooks (shipped in #519).
- **Every Field mission now links its full checklist.** The briefing has a "Full checklist — Field Opsec Kit" box that lists the playbooks the mission comes from, each linking to that playbook's bench in the course's kit, The kit is free and needs no account; a "Take the class" link sits underneath. The links open in a new tab and send no referrer, so the school never learns which mission sent you. Missions outside The Field don't show the box.

## 7.16.3 (2026-11-17): City buttons on phones

- On phones the city map's button row (QUICK QUEST, STATS, LOOK UP, PRISM, WHO GETS IT, WHOLE CITY) was squeezed into a thin strip down the left edge, and the strip pushed the city down and left a big empty gap. The desktop width cap from 7.10.1 was never lifted for phones. The buttons now wrap across the full width under the sector readout, with the city right below them.

## 7.16.2 (2026-11-17): Mission links checked

- **Kia:** "Open Kia's privacy request form" now opens the privacy-rights request form (customercare.kiausa.com/PrivacyManagement), not the Customer Care home page. This covers Kia's audit, opt-out and delete missions.
- **Spokeo:** the one long step is now three that match the page: search your name on spokeo.com and copy the web address of the page about you; paste it with your email on the opt-out page and tap "Opt Out"; tap the link in the email Spokeo sends. The opt-out page has no search box or "Remove this listing" button.
- **Google recovery email** (Wire the Recovery Path): "Ways we can verify it's you" is now "How you sign in to Google," then Recovery email.

## 7.16.1 (2026-11-14): Fewer words on the step

- The question on a results step is now **Yes / No** first: "Were you in any leaks?" Yes, No, Couldn’t check. Only a Yes brings **"How many?"** (1 or 2, 3 or more), then "Did a leak have your password in it?" Yes, No, Not sure. Sign-in checks ask "Any you don’t know?" the same way. Answers on the card drop their long tails ("Yes — passwords were in the leaked data" is just "Yes"); the report keeps its full wording.

## 7.16.0 (2026-11-14): Answer on the step, plain Help

- **Say what you found on the step where you see it.** Step 3 of the Gmail leak check says "Read the results — note how many breaches", and the place to say so was two screens later. Now that step shows the report's answers as big buttons: No breaches found, Found in 1–2, Found in 3+, Couldn’t check. Pick one that says you were in a leak and "Did any of those include the password?" appears on the same card. The report starts with your answers picked and says "You picked this on the step." This covers all 44 email leak checks and sign-in/device checks, and the "Same address as your Gmail?" steps. Your answers stay on this device until you file the report.
- **"Stuck?" is now "Help"**, and it talks about the step in front of you: where it happens ("You do this on haveibeenpwned.com", with a button to open it again), and what to do ("Find the empty box on the page. Tap it and type."; "The answer is on the page you have open. Scroll down."; "Look for a button or switch with the same words as this step."). The out-of-place "It’s OK to skip a step" line is gone; Help ends with a **SKIP THIS STEP FOR NOW** button instead, and Skip moved off the card's main row into it.

## 7.15.0 (2026-11-13): One step at a time

7.14.0 still asked too much at once (Liz: "still hard to use"). Screenshots of a new player's path showed a 4-step mission spread over 8 phone slides, two counters that disagreed ("3 of 8" and "STEP 1 OF 4"), and three buttons that all meant "next" on one screen.

- **The briefing is one short screen** (Short and Simplest): the plain line, Why it matters, Scout's line, "4 steps · about 2 min", See the steps (each with its link), and one **START**. The reading switch, Read it to me and Focus music sit quietly at the bottom.
- **Then one step at a time:** a big card with the step, its **OPEN** link, its notes folded under it (no more slides of their own), one **DONE**, and Back, Stuck?, Skip and Read it to me. When every step is done: **REPORT BACK**. All steps, Read the briefing again and Finished already? are a tap away.
- **Full intel** keeps the long briefing and its phone slides.
- **Focus music** now plays Cultures of the Belt's calm tracks, one after another, from the same portal. It never starts on its own: only a tap on Focus music plays it.

## 7.14.0 (2026-11-13): Easier to read, easier to follow

Most US adults read at literacy Level 2 or 3, and many lose their place in a task with several steps. This release makes the missions plainer for everyone without talking down to strong readers.

- **Every mission opens with one plain line** saying what it does for you ("Find out which apps can read your fitness tracker info."). The full briefing is one tap away under **Why it matters**. Three reading levels: **Short** (the default), **Full intel** (the briefing as before) and **Simplest**. Scout asks once; the switch stays on every briefing.
- **Simplest** is written with the ten hundred most used English words (the Up-Goer Five list), plus the words on your own phone screen (password, app, settings…), account names and on-screen labels in quotes. It covers the email leak checks, the Gmail sign-in check and Gmail two-step sign-in, the missions new players meet first.
- **Step by step.** Tick each step off, or skip it. The briefing says **STEP 2 OF 5** with a bar, and lights the next step with **DONE**, **Stuck?** and **Read it to me**. Ticks are saved, so after a trip to your phone's Settings you come back to where you were. **GO DO IT** on a mission with several steps now keeps the steps on screen; it used to jump to the report, which never showed steps 2 to 5.
- **Where you are in a mission**: Read › Steps n/N › Report back, on the briefing and the report. Mission rows say **CONTINUE** and **Step 3 of 5**, and Scout on the city map offers to pick up where you left off.
- **Only your steps.** The first mission with steps for different phones, trackers, phone companies, computers or cameras asks which you have, then shows only those (Show all is always there, and Change).
- **Menu paths as chips** (Settings › Health › Data Access). **Stuck?** names the menu item to search for and says skipping is fine.
- **I ALREADY HAVE THIS** on fortify and reclaim missions (and any with an "already" answer) goes straight to the report with that answer picked.
- **One action per step**: 71 steps that asked for two or more things are split (same words, same order), and the password manager check is two steps. A readability ratchet in the tests keeps briefings' reading grade and multi-action steps from creeping back up.
- **Read it to me** uses your browser's own voice. **Focus music** (off until you tap it) plays a calm loop; while it plays, your phone's lock screen shows the step you're on, and its next button ticks it.
- **All of this stays on your device.** Your reading level, your devices, your ticks, skips, Stuck? and Read it to me are never sent; Scout uses them only to offer, once, fewer words or the full intel. The one thing sent is the existing mission-started, the first time a tick starts a mission.

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
