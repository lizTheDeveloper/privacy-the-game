# Sky Ladder and Government Satellites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break the Broker Constellation into a biggest-first ladder of opt-out tasks chosen by a location quiz, and draw the 12 US government buyers as satellites whose lines go dark as the player opts out.

**Architecture:** Pure data and logic modules (`data/sky-ladder.js`, `utils/sky-ladder.js`, `utils/satellites.js`) feed the existing pure renderers (`screens/broker-map.js`, `components/constellation.js`). All selection state stays in `app.js` memory, as star selection does today. The location answer is a new saved field (`home`) kept in step with the existing `caResident`, so the lighting function's DROP rule doesn't change.

**Tech Stack:** Vanilla ES modules, SVG, vitest (node environment), Playwright for the browser check. Tests run on the vast box (`~/.claude/bin/vast-test --full ~/src/privacy-the-game`).

**Spec:** `docs/superpowers/specs/2026-10-29-sky-ladder-and-satellites-design.md` (builds on `2026-10-18-broker-constellation-design.md`).

## Global Constraints

- The location answer, the IP guess, rung selection and satellite selection never go in a URL, `track()`, `missionEventData`, a GlitchTip context or a bug-report body. Map controls carry classes `errorNoise.js` treats as private UI, and no broker id or state code goes in an element id, name or title.
- DROP never lights anything unless `home === 'US-CA'` (equivalently `caResident === 'yes'`).
- GPC and DAA never light a star and never count toward FIELD COVERED.
- Satellites carry initials only: FBI, ICE, CBP, IRS, DEA, USSS, USMS, ARMY, NAVY, USAF, SOCOM, DCSA. No seals, logos or agency colours.
- Every URL a player can open is in `tests/fixtures/verified-urls.json`, checked live.
- Every new player-facing string sits in `src/data/dialogue.js` or `src/data/sky-ladder.js` and passes the existing content tests.
- Every interactive control is ≥44px on phones. Motion respects `prefers-reduced-motion`.
- Never remove existing features (DROP panel, WHAT'S LEFT, Big Check link, star list, KEY).
- Each PR bumps the version (package.json, lock, `style.css?v=` in index.html).

## Review Focus

1. **A save with `caResident: 'no'` and no `home`** must ask the state question and must keep DROP unlit until it's answered. Test: `broker-state.test.js` "old 'no' asks again and DROP stays off" (Task 1).
2. **`/whoami` failing, slow or returning garbage** (`region: null`, `'US-ZZ'`, a non-US country) must still show a usable picker. Test: `location-quiz.test.js` "bad or missing guesses fall back to the picker" (Task 3).
3. **A rung whose stars are all already lit by another route** (for example LiveRamp lit through the Big Check) must show done, not todo. Test: `sky-ladder.test.js` "a rung is done when every star it covers is lit, however it was lit" (Task 2).
4. **Phones: the ladder sheet and the star card both wanting the bottom of the screen.** Opening one closes the other. Test: `app-wiring.test.js` "selecting a star closes the ladder sheet and opening the ladder closes the card" (Task 4).
5. **A satellite whose brokers are lit only by a halo or the DROP preview** must not count lines as cut. Test: `satellites.test.js` "halos and previews never cut a line" (Task 5).

---

### Task 1: The location answer and OptOutPrescreen in the save and the lighting

**Files:**
- Modify: `src/utils/broker-state.js`
- Modify: `src/utils/broker-lighting.js`
- Create: `src/data/sky-ladder.js` (constants only in this task)
- Test: `tests/broker-game/broker-state.test.js`, `tests/broker-game/lighting.test.js`

**Interfaces:**
- Produces:
  - `HOME_VALUES`: `/^US-[A-Z]{2}$/` codes from `US_STATES`, plus `'outside-us'` and `'unsaid'`.
  - `US_STATES`: frozen `[['US-AL','Alabama'], …]`, the 50 states plus DC, in `sky-ladder.js`.
  - `setHome(state, value) -> state`: sets `home`, and sets `caResident` to `'yes'` for `US-CA`, `'unsaid'` for `unsaid`, `'no'` otherwise. An invalid value deletes both fields.
  - `homeOf(state) -> string|null`: `state.home` if valid; else `'US-CA'` when `caResident === 'yes'`; `'unsaid'` when `'unsaid'`; else `null` (unanswered, including an old `'no'`).
  - `setPrescreen(state, day|null) -> state`: `state.prescreen = day` (YYYY-MM-DD) or deleted.
  - `PRESCREEN = { brokers: ['equifax-information-services','experian-information-solutions','trans-union','innovis-data-solutions'], days: 1826 }`, in `sky-ladder.js`.
  - The `brokerLighting` result gains `via` value `'prescreen'`. A star lit only by prescreen goes `'amber'` at age ≥ `PRESCREEN.days`.
- `cleanBrokerState` drops an invalid `home` or `prescreen`, and migrates `caResident: 'yes'` to `home: 'US-CA'` when `home` is absent.

- [ ] **Step 1: Write failing tests** in `broker-state.test.js`: `setHome(s,'US-TX')` gives `{home:'US-TX', caResident:'no'}`; `'US-CA'` gives `caResident:'yes'`; `'unsaid'` gives `'unsaid'`; `'US-ZZ'` deletes both. `homeOf({caResident:'yes'})==='US-CA'`; `homeOf({caResident:'no'})===null` ("old 'no' asks again and DROP stays off": with a DROP line filed, `brokerLighting(...).drop==='not-resident'` and no CA star is lit). `cleanBrokerState({home:'bogus'})` has no `home`; `cleanBrokerState({caResident:'yes'})` gains `home:'US-CA'`. In `lighting.test.js`: `prescreen:'2026-01-01'` lights exactly the four `PRESCREEN.brokers` (lit, via `['prescreen']`); with `today` = 2031-01-02 they're `'amber'`; prescreen never lights a parent record (`equifax`, `experian`, `transunion`).
- [ ] **Step 2: Run them** with `npx vitest run tests/broker-game/broker-state.test.js tests/broker-game/lighting.test.js`. Expected: FAIL (`setHome` not exported).
- [ ] **Step 3: Implement** `US_STATES` and `PRESCREEN` in `sky-ladder.js`; `setHome`, `homeOf`, `setPrescreen` and the clean/migrate rules in `broker-state.js`; the prescreen hits and amber rule in `brokerLighting` (add `'prescreen'` to `VIA_ORDER` after `'drop'`).
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat(sky): home location and OptOutPrescreen in the save and lighting`.

### Task 2: The ladder logic

**Files:**
- Modify: `src/data/sky-ladder.js` (rung definitions, GPC states, copy)
- Create: `src/utils/sky-ladder.js`
- Test: `tests/broker-game/sky-ladder.test.js`

**Interfaces:**
- Consumes: `brokerLighting`, `homeOf`, `PRESCREEN`, `BROKER_CHECKLISTS`, `LEGACY_ALL_ANSWERS`.
- Produces:
  - `GPC_STATES`: frozen `{ 'US-TX': { since: 'YYYY-MM-DD', url, line }, … }`, from the research (official URLs only, each in `verified-urls.json`).
  - `GPC_MISSION = 'scam_defense-fortify-tools'`.
  - `ladder(map, state, lighting, today) -> Rung[]`, where `Rung = { id, label, kind: 'drop'|'gpc'|'daa'|'prescreen'|'line', mission: string|null, starIds: string[], count: number|null, status: 'done'|'amber'|'todo'|'preview', text: string, doneOn: string|null }`.
  - `nextRung(rungs) -> Rung|null`: the first rung whose status is `'todo'` or `'amber'`.
- **Order** (fixed for everyone): drop, gpc, daa, prescreen, then one rung per checklist line that isn't a sweep (deduplicated by line id across missions, first mission wins), sorted by `starIds.length` desc, then by summed broker `reach` desc, then by label. Lines with no lit-able brokers (`site` lines, or the NAI sweep) come last as `count: 0`.
- **Rung status:**
  - `drop`: `'preview'` unless `homeOf === 'US-CA'`; for CA, `'done'` when `lighting.drop === 'lit'`, else `'todo'`. `starIds` are the CA-registered reachable brokers (603).
  - `gpc`: `'done'` when `state.missions[GPC_MISSION]` is completed with a `LEGACY_ALL_ANSWERS` answer; `starIds: []`, `count: null`.
  - `daa`: `'done'` when the `daa` sweep line has a date; `starIds` are the DAA members.
  - `prescreen`: `'done'` / `'amber'` from `lighting.stars` of `PRESCREEN.brokers`.
  - `line`: `'done'` when every one of its `starIds` is `'lit'`; `'amber'` if any is amber and none is dim; else `'todo'`. Its `mission` is the checklist's mission id.
- **Text:** `text` picks by home: DROP CA, DROP elsewhere ("California residents can erase these 603 with one request. {State} doesn't offer this yet."), GPC in a `GPC_STATES` state ("Companies must honor this in {State}."), GPC elsewhere ("Companies don't have to honor this where you live, but many do."). Exact strings live in `sky-ladder.js`.

- [ ] **Step 1: Write failing tests** in `sky-ladder.test.js` against the real `broker-map.json`:
  - "the order is fixed": ids start `['drop','gpc','daa','prescreen','thomson…']` for both `US-CA` and `US-TX`.
  - "drop previews outside California": DROP `status==='preview'` and `starIds.length===603` for `US-TX`; `'todo'` for `US-CA` with nothing filed.
  - "next skips previews": `nextRung` is `gpc` for `US-TX` with nothing done, and `drop` for `US-CA`.
  - "GPC is done by its mission": completing `scam_defense-fortify-tools` with `defense_done:'done'` makes it `'done'`.
  - "a rung is done when every star it covers is lit, however it was lit": LiveRamp ticked in `bigCheck` makes the LiveRamp rung `'done'`.
  - "zero-star lines sit last with count 0".
  - "GPC text by state": `US-TX` gets the must-honor text and `US-AL` the may-ignore text, given the research's list.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** `ladder` and `nextRung`; fill `GPC_STATES` from the research; add each GPC URL and the OptOutPrescreen URLs to `verified-urls.json` after a live `curl -sIL` check.
- [ ] **Step 4: Run them.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat(sky): the ladder of opt-outs, biggest first`.

### Task 3: The location quiz

**Files:**
- Create: `src/components/location-quiz.js`
- Modify: `src/screens/broker-map.js` (replace `residencyBlock` with the quiz and its "Not in {State}? Change" control; keep the DROP panel)
- Modify: `src/app.js` (fetch `/whoami` on the first sky open only if `!isAnalyticsOff() && !hasGoneGhost()`; new map actions `quiz-yes`, `quiz-pick`, `quiz-outside`, `quiz-unsaid`, `quiz-guess`, `change-home`)
- Test: `tests/broker-game/location-quiz.test.js`, `tests/broker-game/map-screen.test.js`, `tests/broker-game/privacy.test.js`

**Interfaces:**
- Consumes: `US_STATES`, `homeOf`, `setHome`, `whoamiView` (app.js).
- Produces:
  - `guessFromWhoami(whoami) -> 'US-XX'|'outside-us'|null`: `region` matching `/^US-[A-Z]{2}$/` and in `US_STATES`; a `country` other than `US` gives `'outside-us'`; anything else gives `null`.
  - `locationQuiz({ home, guess, editing, guessAllowed, guessStatus }) -> html`. It shows the confirm prompt when there's a guess, else the picker (a `<select>` of `US_STATES` plus OUTSIDE THE US and RATHER NOT SAY buttons); a GUESS FOR ME button when `!guessAllowed`; and the answered line with a CHANGE button when `home` is set and not `editing`.

- [ ] **Step 1: Write failing tests:**
  - "guesses": `{region:'US-TX'}` → `'US-TX'`; `{country:'DE'}` → `'outside-us'`; `{region:'US-ZZ'}` → `null`.
  - "bad or missing guesses fall back to the picker": `null`, `{}`, `{status:'error'}`.
  - "renders the confirm line": "Looks like you're in Texas. Is that right?"
  - "the picker has every state and the outside/unsaid buttons".
  - "the answer is never in markup ids, names or titles".
  - "the guess fetch is gated": `app-wiring.test.js` reads `app.js` and asserts the first-sky-open `loadWhoami()` call is guarded by `isAnalyticsOff()` and `hasGoneGhost()`.
  - In `privacy.test.js`: after `setHome`, no `track`/`missionEventData`/`errorContext` output contains the state code.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the component, its wiring in `broker-map.js` (where `residencyBlock` was) and the app actions. Existing `set-residency` and `change-residency` actions are replaced; the `RESIDENCY_LABEL` block goes. The DROP panel stays and reads from `homeOf`.
- [ ] **Step 4: Run them**, plus `tests/broker-game`. Expected: PASS. Update tests that pinned the old residency block.
- [ ] **Step 5: Commit** with `feat(sky): where do you live? quiz, from the IP guess`.

### Task 4: The ladder on the sky

**Files:**
- Create: `src/components/sky-ladder.js` (the rung list and the rung card)
- Modify: `src/screens/broker-map.js` (place the ladder; pass `highlight` to the SVG)
- Modify: `src/components/constellation.js` (`highlight: Set<string>`: those stars draw brighter with a pulse ring, the rest dim to 35%; `shimmer: boolean` draws the GPC whole-sky layer)
- Modify: `src/app.js` (in-memory `selectedRung`, `ladderOpen`; actions `select-rung`, `close-rung`, `ladder-toggle`, `prescreen-did`, `prescreen-undo`; camera fit to the rung's stars via `zoomViewBox` around their bounding box, width clamped 260–1000)
- Modify: `src/data/dialogue.js` (`SKY_LADDER_DIALOGUE`: quiz, first rung, drop-not-CA, first line cut)
- Test: `tests/broker-game/sky-ladder-ui.test.js`, `tests/broker-game/app-wiring.test.js`, `tests/broker-game/constellation.test.js`

**Interfaces:**
- Consumes: `ladder`, `nextRung` (Task 2); `locationQuiz` (Task 3).
- Produces:
  - `ladderPanel(rungs, { selectedId, open }) -> html`. Each rung is a `button[data-action="select-rung"][data-rung="<index>"]` (an index, never a broker id) showing label, count ("603 stars", "every website", "0 stars mapped yet") and status (done with date, re-check due, preview). The next rung is marked NEXT.
  - `rungCard(rung, { state }) -> html`. Go is a link to `#/mission/<mission>/briefing` for mission rungs. Prescreen has its steps, its sourced links and an I DID THIS button (I DID THIS → `setPrescreen(state, localDay())`, with an undo). DROP preview has "Why not me?" and no Go.
  - `constellationSvg({… highlight, shimmer })`.
- Layout: desktop ≥900px, a column beside the sky (the card column becomes ladder or star card, never both); phones, a bottom sheet collapsed to "NEXT: {label}", using the star card's sheet styles. Opening a star closes the rung and vice versa.

- [ ] **Step 1: Write failing tests:**
  - "rungs in order with NEXT on the first todo".
  - "rung buttons carry an index, never an id".
  - "DROP preview has no Go and says why".
  - "I DID THIS records today and the four bureau stars light".
  - "highlight dims the rest and rings the rung's stars".
  - "shimmer only when GPC is done or selected".
  - "selecting a star closes the ladder sheet and opening the ladder closes the card".
  - "rung selection never reaches the URL" (location.hash unchanged; no `track`).
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the component, the SVG options, the screen layout and the app state and actions.
- [ ] **Step 4: Run them**, plus `tests/broker-game`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(sky): the ladder beside the sky, with previews`.

### Task 5: Government satellites

**Files:**
- Create: `src/utils/satellites.js`
- Modify: `src/components/constellation.js` (draw satellites and beams; no diamond for a satellite agency; hit targets `data-sat="<index>"`)
- Create: `src/components/satellite-card.js`
- Modify: `src/screens/broker-map.js`, `src/app.js` (actions `select-sat`, `close-sat`; the same card slot as the star card), `src/utils/broker-view.js` (`VIEW_BOUNDS` reaches the satellite band; RESET and full zoom-out show it)
- Modify: `src/data/dialogue.js` (satellite Scout line), the map's KEY (a "Government buyer" satellite swatch, "Line cut", "No way out")
- Test: `tests/broker-game/satellites.test.js`, `tests/broker-game/constellation.test.js`

**Interfaces:**
- Produces:
  - `SATELLITES`: frozen `[{ id:'us-fbi', initials:'FBI' }, …]`, the 12, in a fixed left-to-right order.
  - `satelliteBand(layoutSize = 1000) -> { y, xs: number[] }`: positions spread evenly across the top in a band above the field (y around −60).
  - `satelliteLines(map, lighting) -> { [satId]: { lines: [{ broker, cut: boolean, way: boolean, link }], cut: number, cuttable: number, total: number } }`. `way` is false when the broker has no opt-out on file (`optOut` null or method `none`) and isn't CA-registered. `cut` is true only when the broker's star is `'lit'` or `'amber'`.
  - `satelliteCard(map, lighting, satId) -> html`: "The FBI is a buyer. You can't opt out of a buyer. You can opt out of the brokers it buys from." Then each line with its claim and source link, cut or not, "no way out" where it applies, and a link that selects that broker's star.
- Drawing: a small SVG satellite (body plus two panels) with its initials; beams from the satellite to each broker. Uncut beams are pale dashed; cut beams are drawn dark and faint; no-way-out beams are magenta. A satellite with every cuttable line cut dims; SOCOM never dims. A slow drift (a CSS transform on the group), off under `prefers-reduced-motion`. The 12 agencies' old diamonds and their faint business links are not drawn.

- [ ] **Step 1: Write failing tests:**
  - "exactly the 12": `SATELLITES` ids equal the `us-` buyers in `broker-map.json`.
  - "43 lines with the documented counts": ICE 7, FBI 6, USMS 5, ARMY 4, CBP 4, IRS 4, DEA 3, NAVY 3, USAF 2, DCSA 2, USSS 2, SOCOM 1.
  - "5 no-way-out lines": Thomson Reuters Special Services ×4, Anomaly Six ×1.
  - "a lit broker cuts its line": lighting a broker via `bigCheck` cuts it.
  - "halos and previews never cut a line": DAA filed, and DROP filed for `US-TX`, cut nothing.
  - "SOCOM never dims".
  - "initials only, no img or href to a seal".
  - "no diamond for a satellite agency".
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the module, the drawing, the card and the wiring.
- [ ] **Step 4: Run them**, plus `tests/broker-game`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(sky): government satellites and the lines you cut`.

### Task 6: Content sweep, release and browser check

**Files:**
- Modify: `package.json`, `package-lock.json`, `src/index.html` (v7.6.0)
- Modify: any test pinning old map strings
- Test: full suite on the vast box; Playwright screenshots

- [ ] **Step 1:** Run the full suite on the vast box: `~/.claude/bin/vast-test --full ~/src/privacy-the-game`. Expected: all pass.
- [ ] **Step 2:** Run a Playwright pass at 1280×800 and 390×844 (service worker cleared). Check:
  - the quiz with a mocked `/whoami` of `US-TX`, then CA;
  - the ladder closed and open;
  - DROP selected as a preview, with 603 stars highlighted;
  - I DID THIS on prescreen lighting four stars;
  - RESET showing the satellites;
  - a satellite card;
  - the console clean of app errors.
- [ ] **Step 3:** Run an independent whole-branch review (fresh reviewer, most capable model), fix its findings, and rerun Step 1.
- [ ] **Step 4:** Bump to v7.6.0, open the PR, merge, deploy (DEPLOY.md), and verify the live version string and that the new files serve 200.
