# Changelog

Reclaim City's releases. Versions before 7.13.0 are described in their pull requests and commit messages (`git log`).

## 7.41.1 (2026-11-20): The milestone's buttons don't depend on your passwords

In 7.39.1, when passwords your manager flagged were still left, the "you took it back" screen added a bright CHANGE THEM button and dimmed CONTINUE. So where you were likely to tap next, and the links on the page, still depended on your password answer.

- **The milestone has the same buttons for everyone:** SHARE CARD, "← Back to" the district, and CONTINUE (or WHAT'S NEXT) as the bright one.
- **With passwords left,** only the words change: "2 passwords still to change. They're on the district page."
- Nothing was removed, and nothing new is sent.

## 7.41.0 (2026-11-20): Something to do on every side screen

Five changes Liz picked from the side-screen review.

- **What you can do.** A badge's page, PRISM, the government map and The Whole City used to end at their sources. Now each one has up to three missions about the same companies or data, the ones you haven't done first. Each button says what it opens ("Opens the “Opt Out: LexisNexis” mission, in The Freeway."). Missions you've done show a ✓, and if you've done them all it says "You’ve done these ✓". A Freeway mission when you haven't added a car yet is one button: "Add your car in the Garage first". GM's Smart Driver page links the LexisNexis and Verisk opt-outs. On PRISM, PRISM BREAK stays the bright button and says it opens prism-break.org in a new tab. In the government map, the "Your apps" and "Buying your data" files link "Opt out of location brokers ›". Every badge was matched to missions by hand, and only to missions about the same company or data.
- **The broker sky.** In Simple, the sky on a phone is a short banner. Under it is one card with your next step: the "Where do you live?" question if you haven't answered it, then the biggest opt-out you haven't done, with its button. The heading says "Brokers you've reached", with a bar. The key shows four rows, and the rest is under "More of the key". In Advanced, the list that slides up says "Next: <the next opt-out> ›". In both, DROP is explained in one line ("California's one form that asks every registered broker to delete you") and FILE DROP is a button. Each opt-out says "Opens <broker>'s form in a new tab; come back and tick it." DROP is still only for Californians.
- **Who gets your data, on a phone.** Tapping an agency or a pipe opens its file as a sheet from the bottom of the screen, over the map. It scrolls on its own, closes with × or Escape, and the page doesn't jump. When it closes, you're back on what you tapped. In Simple, the map starts with where your data comes from and the pipes it goes through. Agencies show up after you pick one, with their full names next to the letters (ICE, U.S. Immigration and Customs Enforcement). Computers look the same as before.
- **The social timeline.** SET UP opens the form inside that platform's card, not at the bottom of the page, and its button changes to CLOSE. SAVE and CANCEL are real buttons, and each answer's description is easy to read. In Simple, you first tap which platforms you use, then answer one question at a time, with "1 of 3" and a bar. Your answers are saved the same way as before, and EDIT keeps them.
- **The Big Check.** The people-search group opens first, headed "Start here: these sell your address". The other groups start folded. Each group's count is a bar now. A broker a mission covers says "Covered by: <mission> ›" on one line.
- Nothing was removed, and nothing new is tracked or sent.
## 7.39.1 (2026-11-20): Your password answers change what you see, never what we count

7.38.0 made passwords your password manager flagged, and you haven't changed yet, keep a district under 100%. That number also decided when the game sent "district completed", what it resent when you restore your data, and whether going ghost counted as early. So someone reading our analytics could have guessed that you had flagged passwords. This fixes that.

- **What we count only ever looks at your missions.** Finishing a district's missions sends the same things, and opens the same "you took it back" screen, whether or not you have flagged passwords. Restoring your data and going ghost work the same way too.
- **What you see still counts them.** The district says, for example, "96% · 2 passwords to change", and the city map and Your City show it the same way. When the missions are done but passwords are left, the milestone says MISSIONS DONE and "2 passwords still to change." with a CHANGE THEM button, instead of LIBERATED (7.41.1 replaced that button: see above).
- **Changing the last one** no longer jumps to the milestone (it already showed when the missions were done). The panel says "All changed ✓", right where you are, and nothing is sent.
- Nothing was removed.

## 7.39.0 (2026-11-21): A district for Simple players

Simple players were getting the Advanced district: tabs called SURVEY, RECON, FORTIFY and RECLAIM, up to 19 rows that all looked the same, and names like "OSINT Sieve". Liz asked for a real Simple district (Advanced stays as it was).

- **Tabs in plain words.** In Simple the tabs are "Your accounts", "Check your accounts", "Lock them up" and "Take your data back", the same words as the parts on What's next. They fit four across a phone on two lines. The links haven't changed.
- **A short list first.** A tab shows the mission to do next (lit), and the next two not done yet. "Show all 19" (with the real number) opens the whole list right there, the same list as before, and "Show fewer" folds it back. Missions you've done wait in a "Done (9)" fold at the end.
- **Plain names.** A mission is named the way its Simple briefing names it ("Gmail"), with one plain line under it saying what it does. The OSINT Sieve missions and a few others with hard names have plain ones now, like "See what your photos give away" and "Turn off the TV setting that reports what you watch". The ANT CATALOG badge reads NSA SPY TOOLS, and still opens its sources.
- **A tab that waits on the one before** says so in plain words ("First: “Check your accounts” for PayPal", GO THERE), and its one bright button is the next mission on that earlier tab (in both modes). On The Archives it used to point you at a mission further along.
- **READY** is plain grey text now, not a box that looked like a button (both modes).
- Nothing was removed, and nothing new is tracked or sent.

## 7.38.0 (2026-11-20): The open door first, a Quick Quest that goes to the fix, and 100% means done

- **A building shows the open door first, and lit.** The floors now go Roof, Ground floor, Alcove, Records desk. The first door you can still close starts unfolded, and its SEAL IT is the one bright button on the screen; the other SEAL ITs are outlined. The roof is now called "Health check" (Signal is also an app in the city). A row that needs work says "Fix it" and takes you to the door it closes (the worst one is lit when no SEAL IT is); a healthy row has a quiet "Check again" link instead of SWEEP.
- **In Simple mode, a building is shorter.** The count is a bar that fills: "1 of 4 doors locked". Each roof row says how it is in words (Good, Could be better, Needs fixing, Not checked) before the bars. The leak badges are one chip, like "9 leaks name Facebook ›", that opens to all of them. The records desk, the alcove, your devices and why antennas fade are under one "More about this building".
- **In Advanced mode** the badges are all still there, on their own row under the count, and big enough to tap.
- **Quick Quest is one list on a phone**, a row per problem, each saying where it takes you. Picking one opens the mission that fixes it: "My email got hacked" opens your email's breach check, or its password reset once the check is done. If you don't have that account (or the fix is still locked), it goes to the district as before, and the row says so.
- **100% SECURED means nothing left to do.** Passwords your password manager flagged in a district, and you haven't changed yet, now keep that district under 100% (they count as one more thing to do, and fill in as you change them). The district can't be taken back, and its milestone doesn't show, until they're changed. When that's the last thing left, its SAVE is the bright button. Accounts whose own password reset is already a mission aren't counted twice. These numbers still never leave your browser: the milestone they finish isn't sent as an event or a page visit, and an error report doesn't name it.
- Nothing was removed.

## 7.37.0 (2026-11-20): The side screens, questioned one by one

The same screen-by-screen look at the layout, on the screens off to the side: PRISM, going ghost, the phishing quiz, the broker sky, Your City, the government map, a badge's page, the garage, the social timeline, the Big Check, the saints and The Whole City.

- **PRISM.** PRISM BREAK and LIGHT A CANDLE had cyan words on a lime button, almost impossible to read; the words are dark now. PRISM BREAK is the page's one bright button. In Advanced, WHAT YOU CAN DO comes right after the list of companies instead of at the very bottom. In Simple, the page goes: the picture, "5 of your companies were on the slides", what you can do, then the rest. Reddit isn't listed twice under the cables, and those names are plain words, not boxes that looked like buttons. The magenta key says "a company that runs accounts on your list", which is true before and after you change your list.
- **Going ghost.** Going ghost early no longer ends with "Not the brokers… the city's yours": Scout says the brokers are still out there and your missions are waiting. Before GO GHOST NOW, three readable lines say what it does, including that you can't undo it once tonight's run has deleted your data (you can still cancel before then). What our analytics can see about you is readable, not grey.
- **The phishing quiz.** After you answer, the page scrolls to the verdict so NEXT is on screen. Finishing the twelve now shows your result: a bar for how many you got right, the kinds of message you missed, BACK TO THE PERIMETER and KEEP PRACTICING. The quiz's count is "IN A ROW", so it isn't confused with your daily streak, and Scout's line is easy to read.
- **The broker sky.** The list that slides up on a phone is solid, so the map's labels don't show through it. "WHERE DO YOU LIVE?" is said once. The "archived" source links and "File it" are full-size tap targets.
- **Your City.** The districts are in chapter order. The Foundry and The Grid were both chapter 10; now The Foundry is 10, The Grid 11, The Clinic 12, The Trail 13 and The Field 14, the order you play them in (and finishing The Foundry now leads on to The Grid). The Freeway says "Add a car in the Garage to open it" and goes to the garage, instead of "LOCKED CONTENT". There's a bright "Next:" button for your next mission, the same one What's next shows. Each district row is a full-size tap target with a ›. Simple says "Two-step sign-in" instead of 2FA, and a new player is told that exposure goes down as you finish missions.
- **Who gets your data** has a way back to the city, and says the myth does the agencies' work for them.
- **A badge's page** goes back to where you tapped the badge (a building, PRISM, a district), not always to the government map. The government map and PRISM links are still there.
- **The garage.** The form's labels are readable, the year says "e.g. 2019" so it doesn't look filled in, and the model's example isn't cut off. ADD TO GARAGE and CANCEL are real buttons. The ADD VEHICLE card hides while the form is open. REMOVE asks "Take this car out of your garage?" on the card before it does anything. A car's IN PROGRESS is a bar: "1 of 3 opt-outs".
- **The social timeline.** SET UP is a real, full-size button, the first one not set up is the bright one, and a bar shows how many are set up.
- **The Big Check.** The title is lime only once you've ticked something. A broker whose opt-out page we couldn't confirm says "No working opt-out page right now" instead of offering "I filed with them" (a tick you already saved stays, so you can untick it).
- **The saints.** The letters under each saint (AS, ES…) are dots now, with "1 of 9"; each saint's name is still read out to a screen reader.
- **The Whole City.** "Your part" is under the ring, with RUN A BREACH CHECK as the page's bright button. WHAT WE KNOW ABOUT YOU is outlined. Place names aren't cyan, because you can't tap them.
- Nothing was removed, and nothing new is tracked or sent.

## 7.36.0 (2026-11-20): The next thing first, on the main screens

Liz asked for a screen-by-screen look at the layout, from a Simple player's side and an Advanced player's side. These are the fixes on the main screens: the districts, What's next, the milestone, the bank notes and the warning bar.

- **A district puts the next mission first.** Partway through the game, the password-manager question, the password resets, Scout's welcome and the bank notes all sat above the tabs. Next up's START ended up below the first screen on a phone, and on a computer too. Now a district goes: its name and bar, Next up, the tabs and the missions, and then those four. Nothing was taken away. A mission that needs to know where your passwords are still asks you itself before its first step.
- **Scout's welcome is open the first time you visit a district.** After that it's one line, "Scout's welcome", that opens it again. DISMISS still hides it for good.
- **A finished tab points somewhere.** With every mission on a tab done, Next up shows the next tab's mission and says which tab it's on. If the whole district is done, it shows the "you took it back" screen if you haven't seen it yet. After that it shows What's next in Simple mode, or the district your next mission is in.
- **DONE WITH SURVEY waits for the passwords question.** It used to stick to the bottom of a phone and cover the "Where are your passwords saved?" answers. Now it stays in place, under the question, until you've answered it. That question now reads like a question: big, bold, white letters.
- **What's next: the bar matches the card.** The bar now counts the part of the district that the card's mission is in. Before, it could say "Part 1 · Check your accounts" above "Give your bank a new password".
- **An empty bar looks empty.** The "you are here" piece of a bar is an outline now, not a glowing fill. A bar with nothing done no longer looks partly done.
- **The milestone:** the share card is drawn as soon as the screen opens, not left as an empty black box. In Simple mode, "6% CITY INTEGRITY" next to LIBERATED is now a bar of the city's districts, with the ones you've taken back filled in. The top bar has normal room at the sides again. On a phone, SHARE CARD and the next button come right after your numbers, so they no longer cover them.
- **Your bank notes:** with nothing saved, the form comes first and the empty "SAVED · 0" list is gone. The field names are plain white words ("Bank, card or app"), not cyan capitals, because cyan means you can tap it. After you save one, the button back to your mission becomes the bright one.
- **The "won't save your progress" bar:** "How to fix" is an amber outline now, so the screen still has just one filled button. Once it's opened, tapping anywhere else on the page closes it back to the slim bar. On a mission's steps it's one short line: "Progress won't save."
- **Bigger buttons to tap** (at least 44 pixels tall, without looking much bigger): a district's tabs, ← CITY, the START buttons in a mission list and in Next up, the city's place buttons, and the password answers.
- Which districts you've visited and which milestones you've seen are remembered on this device only. Nothing new is tracked or sent.
## 7.35.0 (2026-11-20): The mission screens, questioned one by one

Liz asked for every screen to be looked at again, from Simple's side and from Advanced's. These are the clear problems found on the mission briefing, the step cards and the report.

- **DONE waits for your answer.** On a step that asks something (the Amazon orders card, the breach check), DONE stays an outline until you answer, then it lights up with "Saved. Now tap DONE." It still works if you tap it early.
- **A picked answer is cyan, not green.** Green means done or good, and "Yes, I saw orders I don't know" is neither. A picked answer now has a cyan edge and a plain tick.
- **"When it opens:" no longer jumps ahead.** A step that asks a question doesn't list the next steps above it any more (the orders card listed steps 4 to 6 before you'd answered). In Advanced, a briefing that already lists every step under YOUR MOVE doesn't list them again above GO DO IT.
- **Report questions look like questions.** Each one is big, bold and in its own words, like on the step cards, instead of small grey capitals.
- **SUBMIT REPORT lights up when you're done.** Until every question has an answer ("Couldn't check" counts), it's an outline that says how many are left. It still works if you tap it early: it shows what's missing. There's room under the last answer so the bar at the bottom of a phone doesn't cover it.
- **Simple doesn't show SAFE, WARN and CRIT on the report.** They gave away the "right" answer before you'd said what you found. Advanced keeps them.
- **A filed report in Simple goes on to What's next,** and shows how far the district is as the filling bar, not "PROGRESS: 25%".
- **No tick beside "Steps 0/3".** The steps get their tick on the report only once they're all done.
- **Simple asks where your passwords are saved once,** on the "Before you start" card, not also on the briefing right above START.
- **A step card starts with what to do.** "Open haveibeenpwned.com again" is a small link under the instruction, not the first thing on the card.
- **Clearer extra buttons in Simple.** On a password reset, "I ALREADY HAVE THIS" now says "My password is already strong, and I don't use it anywhere else". "I don't have Gmail" is a normal-size quiet button, smaller than START.
- **The two-places step isn't repeated in grey** under its card. "Change where my passwords are" is still there.
- **Bigger tap targets:** the report's link back to the mission, and the site links in "See the steps", are at least 44 pixels tall.
- Nothing new is tracked or sent. Your answers stay on your device.

## 7.34.1 (2026-11-19): A district's next mission is on the first screen

On a phone, a district's bright START (the one thing to tap next, since 7.33.0) often sat under the intro, the tabs and the missions already done, so you had to scroll to find it. Liz: "district yes if its nav".

- **Next up, at the top of the tab.** When the bright button takes you somewhere (the next mission's START or CONTINUE, or Phishing training once The Perimeter's missions are done) and it would be off the first screen, it comes up under the tab bar with the mission's name. On a district without tabs (The Perimeter, The Reclamation and the others) it's under the fill bar. Simple mode reads "Next: Breach Recon: Apple ID"; Advanced keeps a NEXT UP label.
- **Only when it's needed.** If the mission's own button is already on the first screen, nothing changes. The page checks again when pictures finish loading, so a list that gets pushed down still gets Next up.
- **Still one bright button.** While Next up shows, the mission's row in the list keeps its lit edge and has an outlined START. Nothing was removed: the whole list is where it was.
- **The Survey's DONE WITH SURVEY — START RECON stays on screen** at the bottom of a phone while you answer, like SUBMIT REPORT does. It stays after your answers, not above them.
- **Buttons that do something in place don't move.** TURN ON THE FIELD, the switches and the survey chips stay where they are.
- **Fixed along the way:** a tab whose first mission was behind "Complete RECON first" lit nothing, even with other missions ready. Now the first mission you can start is lit. Missions for accounts you added yourself no longer each get a bright START when the game's own list already has one.
- Nothing new is tracked or sent.

## 7.34.0 (2026-11-19): Focus music pops out on a computer

Focus music used to play inside the game's page: a reload stopped it, and outside a mission there was no button to turn it off.

- **On a computer, Focus music opens a small window of its own.** The music lives there, so the same music keeps playing on every screen, through a reload, and while you're in another tab doing a step. The window has play/pause, previous/next track, volume, and a button back to the game. Close it to stop. Your computer's media keys work too.
- **The game's buttons follow the window.** Focus music shows "(on)" while the window plays, and tapping it pauses or plays the window's music. While music is on, every screen's top bar has a **Music on** button that stops it.
- **Phones play in the page, as before**, with the step on the lock screen. So does a computer that blocks pop-ups, and the campus cabinet.
- **The music window never replaces the game's offline copy.** The service worker saved every page it loaded as the game's offline page; the music window is now kept under its own name.
- Nothing new is tracked or sent: the game and the window talk inside your browser. Only the window's volume is remembered, on your computer.

## 7.33.2 (2026-11-19): No part with only one mission

The What's next bar counts one part of a district at a time (7.30.1). Some parts had only one mission, so one tap filled the whole bar, which felt empty, and it made "PART 1 OF N" bigger than it needed to be.

- **A part with one mission joins the part next to it.** It joins the part before it, or, if it's the first part, the part after it. The missions stay in the same order. A district with only one mission still has its one part.
- **The joined part keeps the name of the part with more missions**, so it still says one plain thing to do ("Lock them up", not a mix).
- **Where it changes:** The Vault goes from 4 parts to 3, The Capitol from 3 to 2, and The Perimeter from 4 to 3 (its first part is now "Lock them up", starting with the phishing check). Every other district is the same.
- The parts are numbered again from 1, so "PART X OF N" and "Next: part …" match. Every mission is still in exactly one part, and the counts still match the district's own progress.
- Nothing new is tracked or sent.

## 7.33.1 (2026-11-18): One report per visit when a browser can't save

A browser that can't save (an old Safari private window, Instagram's or TikTok's in-app browser, a page that blocks storage) fails every save, and the game saves on every tap. Each failure sent us an error report, so one player could send dozens. They already see the warning that their progress isn't saving (7.31.0), so the extra reports told us nothing new.

- **One storage report per visit.** The first save that fails sends one report, as before. The rest in that visit don't, wherever in the game the save came from. Opening the game again counts as a new visit, so we still learn how often it happens.
- **Everything else reports as before.** Other errors are untouched, and a save that fails for another reason (the game's own data can't be written down, which is a bug) still reports every time.
- **With sharing off, nothing is sent**, as before. Every failure still shows in the browser's console.
- Nothing new is tracked or sent.

## 7.33.0 (2026-11-18): One thing to tap next

A player, in an Instagram comment: "Colors are off. Need better color coordination in regard to understanding where to click. When clicking on something it would be nice if the color popped more. As in, when you click on a link that takes you to a new screen there is so much for me to look at it. It feels overwhelming and the things I'm supposed to be working on are not clear. There are so many important things on each page, but I need your help to ONLY highlight and emphasize the part that is supposed to do next. There are so many different words highlighted, each page feels like extra work."

- **A colour language, the same on every screen** (written at the top of its section in `style.css`). **Filled cyan with a glow** is the one thing to tap next. **A cyan outline or cyan words** is something you can tap that isn't next. **Lime** is done, good, progress. **Amber** is a warning. **Magenta** is danger and exposure only. Everything else is off-white to read and grey for labels. Words you can't tap are never cyan any more.
- **One bright button per screen.** The top bar's What's next is an outline now (it was a second bright button on the city, every district and the milestone). A facility district (The Perimeter and the others) had a filled START on every row, 16 of them: now only the one to do next is filled. A skipped mission's START, RE-CHECK and RETRY are outlines. On Advanced's briefing, GO DO IT is the bright button and the step list's DONE is an outline. Nothing was removed: every button and link is still there.
- **The next one is lit.** On a district's mission list the next mission's row has a cyan edge; the others are quiet outlines. On the city map the district your next mission is in is the one lit card ("START HERE", then "NEXT UP"), and Scout's NEXT MISSION is a filled button.
- **Quieter around it.** The city's six shortcut buttons (Quick Quest, Stats, Look up, Prism, Who gets it, Whole city) are one quiet style instead of magenta, cyan and lime. District names, mission names, CHAPTER, THREAT INTEL, YOUR FIRST MISSION, SCOUT and the other labels are off-white or grey, not glowing cyan. BONUS is grey, not magenta. "Flagged by your password manager" is amber. Support us and the studio link are grey, not lime. The scores keep their colour on the number only. LIBERATED is lime, because it's good news.
- **Pressing pops.** Every button moves down a little and flashes brighter when you press it, and a phone's tap flash is cyan.
- **Arriving shows the way.** On a new screen its bright button pulses once. Not on every re-draw, and not with reduced motion.
- **Keyboard focus shows** on every link and button.
- **Easier to read.** Small grey text (minutes, mission counts, inactive tabs, NOT NOW, See the whole city, district codes) was under WCAG AA contrast in about 200 places across the main screens; it's all AA now. Real instructions stay off-white.
- Nothing about this is tracked.

## 7.32.0 (2026-11-18): Before you go, what to do there

A player, in an Instagram comment: "Sometimes you tell me to click on a link to go somewhere but not what to do once I'm there. Then I go back to the game and the instructions are there. If you could put the instructions for what to do before I click the link, that would help."

- **"When it opens:" before every OPEN button.** On a phone the other site covers the game, so a step that opens a website now lists what to do there first: the steps that happen on that site, numbered, each in its first sentence, then "Then come back here and tap DONE." It stops at the next step with a link of its own, at a step that happens somewhere else, or at the step that asks a question here. Simple mode shows up to 3, Advanced up to 4 (with "tap DONE to see the rest" when there are more). Full-size white words in a box, not small gray. The OPEN button stays on the first screen of a 390×844 phone.
- **Those steps are still their own cards**, with their own DONE and their questions. It's a preview, not a merge.
- **Advanced's briefing says it above GO DO IT**, for the site GO DO IT opens (on a phone the step slides are behind you by then).
- **Read it to me reads it** before you leave: the step, "When it opens:", each step, and come back. Scout's list has the new lines (`node scripts/voice-lines.mjs`).
- **Steps that aren't on that site are marked as elsewhere**, so the preview, Help's "open it again" and Simple's "On example.com" don't send you to the wrong place: in-app and phone Settings steps (Venmo's passcode, Alexa, Temu's notifications, Instagram's archive, the car apps' insurance programs, Apple Health, Fitbit, iPhone and Android tracking switches, Private DNS), calls (SSA, carriers), other companies listed after a link (Oracle, X-Mode, Merlin and Tracers, the people-search sites without a link, Afterpay and Zip, other cards and loyalty programs), email (Spokeo's confirmation link), a Password Reset's "Check it saved" in the Passwords app or a password app, and the password check's second place (the Mac, Edge, Firefox).
- **Links with nothing to do there now say what to do**: Google's Password Checkup (Simple and Advanced), Facebook's Activity Log, the Google Safe Browsing checker, Apple's App Tracking Transparency page (now says where the switch is on the iPhone), and the USPhonebook, ThatsThem, SmartBackgroundChecks, SearchPeopleFree and SpyDialer opt-outs.
- Nothing about this is tracked.

## 7.31.0 (2026-11-18): Saying so when a browser won't keep your progress

Liz: "if people are on like Instagram's browser or like, you know, the temporary browser, you have to tell them that their info is not saving. That's a huge thing that is confusing people who aren't tech literate."

- **A warning when progress won't stay.** Links from social posts open in the app's own browser, which often forgets everything when it closes. The game now spots Instagram, Facebook, Messenger, TikTok, Snapchat, LinkedIn, Threads, X, Pinterest, LINE, WeChat, the Google app and other apps' built-in browsers, a browser that can't save at all, and (as a hint only) a private window. The start page shows it in full: "Instagram’s browser won’t save your progress. If you close it, you start over." with numbered steps for that app ("Tap ••• at the top right. Look for “Open in external browser”."), and a **Copy the link** button to paste into Safari or Chrome. Every other screen has a slim bar with **How to fix**. **Hide this** lasts until the page closes, and works when storage doesn't. Advanced mode says the same in one line.
- **No more promises it can't keep.** What's next, Where are my passwords?, the devices question and the saints' candles said progress "is saved on this phone"; in those browsers they now say it won't keep, and where to open the game instead.
- Starting the game scrolls to the top, so the bar is in view.
- One event when the warning shows: the kind (app browser, private window, no storage) and the app's name from a fixed list. Never the browser's own details. The warning is not read aloud.

## 7.30.1 (2026-11-18): What’s next counts the part you’re in

Liz: "yes, make the district bar count the current chapter only".

- **The What’s next bar counts one part of the district, not all of it.** The Master Keys has 28 missions, so after the first one the bar was a sliver. Each district is now in parts of a few missions (up to 8), in the order the game hands them out: Check your accounts, then Lock them up, then Take your data back. The Master Keys is five parts (5, 5, 6, 6, 6). One mission fills a fifth of the first bar.
- **"Part", not "chapter"**: the game already calls each district a chapter (The Master Keys is Chapter 1, The Vault is Chapter 2), so the bar says PART 1 OF 5 · THE MASTER KEYS, with the part’s name under it.
- **Finishing a part**: the report that finishes it shows the bar full and green, with "Part 1 done! Next: part 2, check your accounts." Next time, the bar starts the next part from empty.
- It counts the same missions as the district’s own progress: accounts you said you don’t have, bonus missions and old replaced missions are left out. The district page’s bar still shows the whole district.
- Nothing about this is tracked or sent.

## 7.30.0 (2026-11-18): Passwords in two places are fine; your devices come first

Liz: "Your passwords are in two places. This is like a huge step that we're asking them to suddenly do … migrate their passwords. So look for any place where you've asked for a hidden migration. What I want you to do is just gather signals … there might be a reason, it might be backed up … most people do this, and I'm a security person … don't ask them to do a migration right there … just say, okay, you know, we'll remember that it's two places and prompt you to check both places." And: "find out what their other devices are, if they're in simple mode, because you can help clarify what to do and where to go … if they're using an iPhone but then they have a Windows computer … it's going to make them feel like they're doing it bad … So separate information gathering and signal gathering from action taking."

- **Two places, no migration.** When Where are my passwords? finds them in two places that don't share (an iPhone and Chrome on a computer), it no longer asks the player to pick one main place. It says lots of people keep passwords in two places, that it can be a backup, that they don't need to move them, and that the game will remember both and remind them to update both. One button: OK, REMEMBER BOTH.
- **Both places are remembered** (`passwordPlaces`, on this phone only; the first stays the one answer everything else reads). A Password Reset says so up front ("Do this on your iPhone first. Then you'll update Chrome on your computer too"), checks it saved there, then ends with "Now update Chrome on your computer too. It still has the old password", with how to find it and where to see the new password. The password check reads the report in both places. The Vault's bank pointer names both.
- **Simple mode asks about your devices first**, on a "Before you start" card of its own, before a mission's first step when the steps depend on them: What phone do you have? (iPhone, Android, I don't have one) and What computer do you use? (Windows, Mac, Chromebook, I share one, I don't have one). Asked once, kept on this phone. Then where your passwords are, if the game doesn't know yet. An iPhone and a Windows computer (or a Chromebook, or an Android phone and a Mac) get a note up front: they may not keep the same passwords, that's normal, and the game will help check each place. "Skip this. Show me all the steps." is always there.
- **No questions mid-step.** In Simple mode a step card is only the step; the "Showing steps for…" lines sit under it.
- **The finder skips what your devices already said:** no "What kind of phone?" when you've said iPhone, Chrome straight away on a Chromebook, no Safari on Windows, no "On my phone" without a phone.
- **Other hidden moves, softened (nothing removed):** the bulk ad opt-out's "Install or switch to a browser with Global Privacy Control" is now "Optional: try a browser…", with "Do I have to switch? No. … Your saved passwords stay in it." Harden Your Browser's Firefox steps say you don't have to switch. Scout's line for "I don't save passwords" no longer says to start using a password manager ("Nothing to set up today"). Gmail's reset and ProtonMail's new-password step say "saved where you keep your passwords" instead of "in a password manager".
- None of these answers is sent anywhere.

## 7.29.0 (2026-11-18): Bars that fill, and a little celebration

Liz: "we need a little bit more... celebration when things are good", "we need to see a bar fill, we need to 'see security as a process'", "for simple mode, use a bar", "a big, visual, motivating, filling bar … that like, visibly animatedly fills up", "on advanced mode even, bars filling? motivating".

- **A bar that fills**, everywhere a mission counts its steps: it pours from where it was to where it is now (a little past, then settling), a shine sweeps it as it grows, each step is a segment and the one being worked on glows softly, and a full bar turns green and glows. Simple mode's step screens show a big one instead of "Step 2 of 4" (the numbers are still read out to screen readers). After DONE the bar scrolls into view so it's seen filling.
- **Districts have a bar too**, on the district page (Simple and Advanced) and on What's next: "YOUR PROGRESS IN THE MASTER KEYS … Security is a process. Every mission fills this a little more." Started missions show a small bar on their row, and What's next's "Keep going" card shows how far along, not "You were on step 2 of 4".
- **Celebration for good news:** confetti when every step is done, and "Nice work!" with confetti on What's next when Scout's news is good (a clean check). Worrying news gets no party. Reduced motion: no confetti, bars just show where they are.
- **Where are my passwords?** "On your computer, what do you use to go on the internet?": each browser button carries the browser's own icon (Chrome, Safari, Edge, Firefox), and so does the "Look in…" heading. "Look in Chrome" (and Edge, Firefox) is a **numbered list**, one action per step, all the same size; "if that doesn't work" (an older Mac, a Samsung phone) is its own labeled amber box instead of small gray text that read as optional (Liz: "the second step is in gray and that's really small and contextually gray reads as an optional step … use a numbered list").

## 7.28.0 (2026-11-18): The orders step asks about your orders, and about the people at home

Liz: "in marketplace It says open your orders anything you didn't order … I think you should look for ones like that and it's like That's where you can ask the question. Did you see any orders that you don't remember ordering? Yes or no … And then it also leads you to ask other people in the house that use that account."

- **Amazon, Temu, Shein and eBay** ask their own orders question on the orders step: “Did you see any orders you don’t remember ordering?” Yes / No / Couldn’t check (eBay: “anything you don’t remember buying?”).
- **A Yes asks the people at home:** “Ask the other people in your home who use this account. Did one of them order it?” “Yes, it was them” is fine. “No, nobody did” gets Scout’s line to report it to the store from inside its app or website, then change the password, and puts the Password Reset back on.
- **The whole report is asked on the steps** for these four: the password manager’s answer on its step, the orders question on the orders step, and addresses and cards on their own step (that question no longer asks about orders too). The last DONE sends it to Scout. Advanced mode’s report screen shows the same questions in full, with a hint to ask the people at home.
- **Safari:** the space under a step card’s answers is gone (a fieldset’s legend was counted twice).
- Answers stay on this phone. Nothing about them is sent.

## 7.27.0 (2026-11-18): Read it to me is a switch, with a buffer

Liz: "make read to me a toggle instead of a button you have to press every time … make it visibly like a toggle", "stream or prefetch … the next few readings so that they have it in the buffer", "don't unload right away either".

- **Read it to me is an on/off switch** (a track and a knob; cyan when on), remembered on this phone. On, Scout reads each mission screen as it comes: the briefing, every new step, the report. Re-drawing the same screen (picking an answer) doesn't start him over; leaving the mission screens stops him. Off stops him at once.
- **Phones:** the switch's tap lets the page play sound for the rest of the visit (one reused player, unlocked with a tenth of a second of silence). After a reload, Scout starts on the first tap.
- **The buffer:** while a line plays, the rest of the screen and the next two steps download ahead and stay in memory for the visit (the 80 most recent clips), so the next step and going back play at once. A line not fetched yet streams as before. Only lines on Scout's list are fetched; the player's own words never leave the phone.

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
