# Changelog

Reclaim City's releases. Versions before 7.13.0 are described in their pull requests and commit messages (`git log`).

## 7.26.0 (2026-11-18): "Where are my passwords?" and resets that use it

Liz: "for changing their passwords, we really need to get them in that password manager … walk them through, do they use Chrome as a password manager? Do they use your phone passwords? … they're not always going to know … Most people have a mixed, like where they can only log in on one computer and they don't know why."

- **Where are my passwords? (`#/passwords`)**, one question per card: phone, computer, both, or a password app; iPhone or Android; which browser on the computer (with "I don't know" → how to tell by the icon). Then **go look**: how to open the Passwords app, Google Password Manager, Chrome / Edge settings (search "passwords"), Firefox, or a Mac. "Do you see your accounts there?"
- **Mixed setups explained**: an iPhone and Chrome don't share, "that's why a password can work on one and not the other". The player picks a main place. An iPhone and a Mac do share, and it says so. Nothing saved: start saving in the place they looked.
- Opened from **"Help me find where they are"** on the password check and every Password Reset (first in Simple mode, with "I know where" folded under it). The answer is the same one the missions already used, and it stays on this phone.
- **Password Resets follow it** (all but Cash App's PIN): do this on the device where your passwords are saved, let it make the new one ("Use Strong Password" on Apple, "Use suggested password" in Chrome, Edge's and Firefox's own, or the password app's generator), then **check it saved** (search for Gmail, your bank…).
- Scout's voice list gains those lines (190 lines, about 12.7k characters).

## 7.25.0 (2026-11-18): Simple mode's "What's next"

Liz: "it just dumps you in the master keys and you're suddenly in recon again … make it really clear for the simple mode what we're doing next … card by card, and just assume we're going to lose people and that we're coming back."

- **What's next (`#/next`)**: one card with one thing to do. Half-done comes first ("KEEP GOING · You were on step 2 of 3"), otherwise the next mission in plain words ("NEXT · Outlook · See if a business lost your Outlook email address…", START, and "I don't have Outlook"). It says the progress is saved on this phone and they can come back any time.
- **After a report in Simple mode** the game lands there instead of on the district's tabs: "✓ Sent to Scout", Scout's line, then the next card. A finished district's celebration carries on to What's next too.
- **Opening the game again in Simple mode** starts on What's next (from the map or a district; a mission screen stays where it was). Picking Simple mode on the welcome screen starts on the first mission's card.
- **The top bar** has a **What's next ▶** button in Simple mode on every screen but the missions.
- "I don't have Gmail" now comes back to What's next, with Scout's "Got it" and Put Gmail back above the next card.

## 7.24.0 (2026-11-18): Simple mode and Advanced mode; the steps already told Scout

Liz: "when they click the start button, we should say simple mode, advanced mode … change the support to support us, and then put a tiny dollar icon, and then next to support, put simple mode."

- **PLAY asks "How do you want to play?"**: Simple mode (fewer words, one step at a time) or Advanced mode (all the details). "Full intel" is now **Advanced mode** everywhere.
- **The top bar** says **$ Support us** (a tiny circled dollar sign), with the other mode beside it: "Simple mode" when you're in Advanced, "Advanced mode" when you're in Simple. Mission screens keep the full Simple / Advanced switch in their own row.
- **No asking twice.** When the step cards already asked everything the report asks (Gmail's "Were you in any leaks?" → No), the last button says **DONE ✓ SEND TO SCOUT** and files the report. If the report has more to ask (a leak was found, so "was a password in it?"), REPORT BACK opens it as before.
- **How to get back.** Under a Simple step's OPEN THE WEBSITE: "It opens a new page. When you're done there, tap Back to come back here." (Computers: "come back to this tab".) It always opened a new tab, but on a phone a new tab looks like leaving the game.

## 7.23.0 (2026-11-18): "I don't have Gmail" on the Simple briefing

Liz: "there's no button that says I don't have Gmail … use I don't have Gmail as really big words, but use the secondary button so that it's not as big and blue."

- **The Simple briefing has a way out** for something the player doesn't have: "I don't have Gmail", "I don't use Instagram", "I don't have a bank account". Big words, on the quiet secondary button under START.
- It turns that account off (the same switch as the district's list) and goes back to the district, where Scout says "Got it. I took Gmail off your list." with a **Put Gmail back** button.
- Shown for the accounts a person has or uses (email, money, social, cloud, shopping, AI, smart devices). Not for the Capitol's government accounts (worth making before a thief does), cars (only listed because the player added one), or the topic districts.
- The AI missions name what they're really about: "I don't have Facebook or Instagram" for Meta AI, "I don't have LinkedIn" for LinkedIn AI.

## 7.22.1 (2026-11-17): Scout only fetches his own lines

- The game now checks a line against Scout's list (`src/data/voice-ids.txt`, loaded the first time someone taps Read it to me) before asking for a recording. A line with anything of the player's in it, such as their own numbers or a mission they made, is read by the browser's voice and never leaves the browser, not even as a hash. (7.22.0 asked the server for every line; the server never voiced unlisted ones, but the request itself carried the hash.)

## 7.22.0 (2026-11-17): Scout reads it to you, in his own voice

Liz: "can you also get Scout to read everything to you."

- **Read it to me is Scout's voice** (ElevenLabs "David – Space Adventurer Pirate"), line by line: the briefing and Scout's line, each step (with its open "Is this safe?" note), and now the **report screen** too, which gets the same top-bar row (Scout's greeting and line, each question and its answers).
- Lines come from the game's own server (`api/voice/<id>.mp3`) and are kept by the browser. The server records a line the first time anyone asks for it and keeps it. It only voices lines on `collective/voice-lines.json` (5,155 lines, built from the game's own words by `scripts/voice-lines.mjs`), so nothing a player typed or chose is ever sent to ElevenLabs; a daily cap (150k characters) bounds spending.
- Any line not on the list (lines with the player's own numbers in them, account names in a list) or not recordable right now is read by the browser's voice, and Scout carries on with the next.
- Menu paths are read as "Settings, then Privacy" instead of "Settings greater-than Privacy".
- Two Recon steps still named the password check's old title; they now say "Check the passwords saved on your phone or computer".

## 7.21.0 (2026-11-17): The password check is its own mission; reading controls at the top

Liz: "It takes people to the Have I Been Pwned passwords page. That's a whole separate mission… focus on passwords saved in their browser or on their phone, because those managers can tell you the number."

- **The breach checks stop at the email.** None of the 26 email/breach checks ends with Pwned Passwords any more (Gmail's is 3 steps, not 4).
- **The password check** ("Check the passwords saved on your phone or computer") is a core Master Keys mission for every new save. It asks "Where are your passwords saved?" right on the mission, with the phone and the browser first (iPhone/iPad/Mac, Android/Chrome, Edge, Firefox, then 1Password, Bitwarden and the rest), and shows that place's security report steps. The report back asks for the number it gives. "I don't save passwords" looks on the phone first, then falls back to checking one password at Pwned Passwords, with "Is this safe?" open on the card.
- The Master Keys question is now "Where are your passwords saved?" (the same answer).
- **Old saves keep their 100%:** a save made before this release keeps the old rule (the check counts only once they say where their passwords are saved), so no finished district drops.
- **Simple / Full intel, Read it to me and Focus music** are one row in the top bar on every briefing and step screen, not at the bottom ("Read" and "Music" on a phone). The step card keeps Help.

## 7.20.0 (2026-11-17): Short and Simplest are one level, Simple

Liz: "merge simple + simplest into a single view." The reading levels are now **Simple** (the default) and **Full intel**.

- **Simple** is the old Simplest screen for everyone: one step at a time, the big ‹ Back, "Step 2 of 4", OPEN THE WEBSITE before DONE, and the ten-hundred-word copy where a mission has it (the plain lead where it doesn't). Mission screens are 8–25 words shorter than Short was, and START sits higher.
- Simple keeps "See the steps" on the briefing and one "Finished already? Report back" on the step screen, so nobody who has already done the job is stuck tapping through.
- A save that chose Short now reads as Simple. Junk or prototype-key levels (`constructor`, `__proto__`) fall back to Simple too.
- Scout's "fewer words?" offer is now only made to Full intel readers.

## 7.19.0 (2026-11-17): Each thing said once, and the buttons you need on screen

From a phone audit of every screen (iPhone size, Short): information shown twice, and key buttons below the first screen.

- **District pages on phones** put the tabs and the task first. The building grid, which lists the same accounts as the survey and the mission lists, moves below them.
- **Mission lists:** only the mission to do next has the bright START, and the rest are quieter. Rows no longer repeat the tab's name (RECON on every Recon card) or the account's name under its icon. "Optional bonus — never blocks progress or Secured" is said once above the list, not on every bonus row. Master Keys' Recon tab: 322 → 223 words.
- **Mission screens at every reading level** get the big ‹ Back at the top left instead of the breadcrumb. The step screen counts once ("Step 2 of 4" beside Back): no trail, no STEP N OF M on the card, no count on All steps. Help and Read it to me are buttons, shown once. "Open haveibeenpwned.com" gets a plain OPEN button instead of naming the site twice.
- **SUBMIT REPORT and CONTINUE stay on screen** on phones, pinned to the bottom edge while the answers scroll (they sat 1–2 screens down).
- **Stats** no longer repeats Integrity, Exposure and Streak in the top bar above its own dials.
- **The password check** (Liz): Simplest no longer says "check your password on the same website". It says "Now open “Pwned Passwords”. It is a different check, made by the same people, and it never gets your email address." "Is this safe?" is open on the card at every level. It explains that you should normally never type a password into a website, and why this one never gets your password or your email.
- "LIBERATED" fits on a phone (it was cut to "LIBERATE").

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
