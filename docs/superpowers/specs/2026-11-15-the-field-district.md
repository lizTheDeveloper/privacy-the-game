# The Field (chapter 13): authoring brief

The Field brings The Multiverse School's **Field Opsec** course into Reclaim City as an
**opt-in** district for people whose work makes them a target: journalists,
organizers, clinic workers, legal observers and mutual aid coordinators. It starts
switched off and never counts toward the city until a player turns it on.
The engine work is done: `optIn` in `districts.js`, `utils/opt-in.js`, the panel in
`screens/district.js`, and `shares` in `screens/briefing.js`.

## Where the content comes from (read-only)

`/Users/annhoward/src/themultiverse.school-wt-field-opsec-kit/tools/field_opsec_kit/`

- `content/playbooks/NN.json` — each playbook already rewritten as plain checklist
  steps: `do`, `how` (exact menu paths), `why`, `mistake`, `tiers`
  (low/mid/state) and `kind` (once/habit/moment). **This is your primary source.**
- `source/playbooks/NN - *.md` — the original playbook. Check facts against it.
- `content/drills/DNN.json` — drills. Use them for reclaim-phase rehearsal missions.

**No invention.** Every step, number, menu path and claim must come from these
files. Every mission gets `playbooks: ['NN', …]` naming its sources.
`tests/the-field.test.js` checks that the 9 buildings together cover every
playbook from 01 to 29.

## Buildings (src/data/accounts-field.js)

| Building id | Name | Playbooks |
|---|---|---|
| who_is_after_you | Who's After You | 01, 02 |
| quiet_lines | Quiet Lines | 04, 05, 06 |
| the_meet | The Meet | 07, 08, 09, 10 |
| the_crossing | The Crossing | 11, 12, 13, 14 |
| hostile_ground | Hostile Ground | 15, 16 |
| lockdown | Lockdown | 03, 17, 18, 19, 20 |
| the_door | The Door | 21, 22 |
| burn_protocol | Burn Protocol | 23, 24, 25 |
| the_crew | The Crew | 26, 27, 28, 29 |

## Missions per building

- **Core:** exactly 3 per building, one per phase: `recon`, `fortify`, `reclaim`.
  - **recon:** look at where you stand. Name your adversary, list your accounts, check
    your devices. Debrief with `FIELD_RECON_DEBRIEF`.
  - **fortify:** set it up. These are the `once` steps. Debrief with `FIELD_DEBRIEF`.
  - **reclaim:** make it a reflex. Rehearse the `moment` steps, run the drill,
    build the `habit`. Debrief with `FIELD_DEBRIEF`.
- **Bonus:** add `optional: true` missions (any phase) until every playbook in the
  building has at least one mission that lists it. Bonus missions never block
  Secured.
- **Ids:** `<building>-<phase>-<slug>`, for example `the_door-reclaim-script`. Ids
  must be unique and stay stable once published.

## Sharing: Liz's rule — "wherever they share stuff let them share, otherwise make sure they're different"

Before writing a mission, search the existing missions for the same job:

```bash
grep -rn -i "<keyword>" src/data/missions*.js
```

- **Search these areas:** 2FA and security keys (`*-fortify-2fa`, Master Keys),
  passwords, SIM protection and device security (`missions-perimeter.js`:
  `sim_protection`, `device_security`, `border_prep`), data-broker and
  people-search opt-outs (`missions-reclamation.js`), photo metadata
  (`missions-trail.js`) and the phishing quiz.
- **If an existing mission already does a step's job,** don't repeat the step.
  Add that mission's id to the Field mission's `shares: [...]`. The briefing then
  shows it as "Already in Reclaim City — part of this job", with a link.
- **Keep only what's different.** Field steps are the field-specific part: tier
  decisions, travel devices, compelled unlock, the door script, burn procedures,
  source handling, team rules.
- **If a whole Field mission would duplicate an existing one,** don't write it. Write
  a different mission from the same playbook instead.

## The mission shape (copy `src/data/missions-trail.js`)

```js
import { FIELD_DEBRIEF, FIELD_RECON_DEBRIEF, scoutField } from './missions-field-shared.js';

{
  id: 'lockdown-fortify-device',
  accountId: 'lockdown',
  phase: 'fortify',
  title: 'Lock Down Every Device You Work On',
  briefing: '…plain, short…',
  steps: [ { text: 'Mac: System Settings → Privacy & Security → FileVault. Turn it on.' }, … ],
  debriefQs: FIELD_DEBRIEF,
  scoutDialog: {
    briefing: '"…Scout, in quotes…"',
    debrief: scoutField('"…done…"', '"…already…"', '"…n/a…"'),
  },
  estimatedMinutes: 10,
  playbooks: ['03'],
  shares: ['gmail-fortify-2fa'],     // optional
  // optional: true,                  // bonus
},
```

A recon mission's `scoutDialog.debrief` is an object with one line for each
`FIELD_RECON_DEBRIEF` option: `covered`, `some-gaps`, `wide-open`, `skip`.

Each file exports `FIELD_MISSIONS_X` (the array) and `FIELD_LEADS_X`, which maps
every mission id to its lead.

## Text rules (all enforced by tests; run `npx vitest run`)

- **Leads** (`FIELD_LEADS_X`): one sentence ending in `.`, **16 words or fewer**, grade 6
  or lower, **no digits**, never the word "they". Say what the mission does for the
  player.
- **Briefings:** the game-wide **median grade must stay at or below 8.51** and the 90th
  percentile at or below **11.89**, so aim for grade 6 to 8. Use short sentences and
  short words. Check with
  `node -e "import('./src/utils/readability.js').then(r=>console.log(r.fkGrade('…')))"`.
- **Steps:** **one action per step** (`isCompoundStep` must be false). Never write
  "Open X. Tap Y." or "do A, then do B". Split them. A menu path written with `→`
  counts as one action, and so does an aside in (brackets). Keep each step short.
- **No `url:` inside step text.** A link goes in the step's `url` property, and only
  if the source gives it.
- **Scout** speaks in quotes, warm and direct, with no hedging. **Every number Scout
  says must appear in the district's missions** (briefings or steps). Never write an
  unnamed "they" doing the threatening: name who did it ("a border agent", "the
  platform", "a doxxer").
- **`estimatedMinutes`:** an honest small integer for a sitting. A core
  building's three missions should total 30 or fewer.
- **Voice:** the game's (read `missions-trail.js`), the reader is scared and busy,
  and the course rule is: "You don't need to be a genius to be safe. You need to
  follow the checklist."

## Done means

- `npx vitest run` is green.
- Your file has 3 core missions per building, plus bonus missions until every playbook
  in your buildings is covered.
- Every mission has a lead.
- No step duplicates an existing mission; overlaps are listed in `shares`.
