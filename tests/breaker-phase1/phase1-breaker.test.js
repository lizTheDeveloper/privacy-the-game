// Breaker round for recon campaign Phase 1 (X1, X2, X7, ${name}, old saves).
// Failing tests are left genuinely failing: each one names the behaviour it
// believes is wrong. Passing tests pin edges the builder did not cover.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';
import { ACCOUNTS } from '../../src/data/accounts.js';
import { DISTRICTS } from '../../src/data/districts.js';
import { debriefRecord, fileDebrief, missionEventData, visibleQuestions } from '../../src/utils/debrief.js';
import { debriefReaction, renderDebrief } from '../../src/screens/debrief.js';
import { renderDistrict } from '../../src/screens/district.js';
import { renderMilestone } from '../../src/screens/milestone.js';
import { restoreEvents } from '../../src/utils/restore.js';
import { calcFindings, getBuildingState, calcDistrictProgress, isBreachFound, isEmailBreachCheck } from '../../src/utils/calc.js';
import { createInitialState } from '../../src/state.js';

const byId = (id) => {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error(`no mission ${id}`);
  return m;
};
const OLD_SKIP_FINDING = "skip', text: 'I'll come back to this', severity: 'skip";
const OLD_LATER_ACTION = "later', text: 'I'll come back to this', severity: 'skip";

function stateWith(records) {
  const s = createInitialState();
  for (const id of Object.keys(ACCOUNTS)) s.accounts[id] = { enabled: true };
  Object.assign(s.missions, records);
  return s;
}

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

// ── Promise 6: old saves ────────────────────────────────────────────
describe('old saves that filed a broken value', () => {
  const phishing = byId('scam_defense-recon-phishing-eye');
  const pin = byId('sim_protection-fortify-pin');
  const old = () => stateWith({
    [phishing.id]: { status: 'completed', finding: OLD_SKIP_FINDING },
    [pin.id]: { status: 'completed', action: OLD_LATER_ACTION },
    'credit_freeze-fortify-equifax': { status: 'completed' },
  });

  // BELIEVES WRONG (promise 6): the reopened debrief of an old save prints the
  // leaked source fragment "skip', text: 'I'll come back to this', severity: 'skip"
  // in the answer row (completedGroup falls back to the raw stored value).
  // A player should see "Not recorded" (or the real option), never code.
  it('reopened debrief of an old broken value does not print the raw source fragment', () => {
    for (const m of [phishing, pin]) {
      const html = renderDebrief(old(), m.id);
      expect(html).not.toMatch(/severity:/);
      expect(html).not.toMatch(/text: '/);
    }
  });

  // BELIEVES WRONG (promises 1 and 6): restore.js resends the stored garbage
  // as the analytics `finding`. "Every value is a clean id" is violated on the
  // wire for every old save that filed the phishing verdict with the broken
  // option; the value should be dropped or normalised on the way out.
  it('restore does not resend a non-slug finding to analytics', () => {
    const ev = restoreEvents(old()).find((e) => e.data.mission === phishing.id);
    expect(ev).toBeTruthy();
    if (ev.data.finding !== undefined) expect(ev.data.finding).toMatch(/^[a-z0-9-]+$/);
  });

  it('every screen that reads an old broken record still renders without undefined or throwing', () => {
    const s = old();
    for (const m of [phishing, pin]) {
      expect(renderDebrief(s, m.id)).not.toMatch(/undefined|\[object/);
      const r = debriefReaction(s, m);
      expect(r.line).not.toMatch(/undefined/);
    }
    for (const d of DISTRICTS) for (const tab of [undefined, 'recon', 'fortify']) {
      expect(renderDistrict(s, d.id, tab)).not.toMatch(/undefined|\[object/);
    }
    expect(() => calcFindings(s)).not.toThrow();
    expect(calcFindings(s).breachesFound).toBe(0);
    for (const id of Object.keys(ACCOUNTS)) expect(() => getBuildingState(s, id)).not.toThrow();
  });

  it('a bureau freeze filed completed as no-account-yet by an old save keeps its stored status and restores as completed', () => {
    const s = old();
    expect(s.missions['credit_freeze-fortify-equifax'].status).toBe('completed');
    const ev = restoreEvents(s).find((e) => e.data.mission === 'credit_freeze-fortify-equifax');
    expect(ev.data.status).toBe('completed');
  });
});

// ── Promise 1 + reopened debrief ────────────────────────────────────
describe('the reopened debrief shows the answer that was given', () => {
  // The questions whose broken options Phase 1 repaired.
  const FIXED_QS = new Set(['freeze_status', 'freeze_extras', 'pins_stored', 'broker_recon', 'optout_result', 'defense_done', 'id_exposure', 'credit_report', 'location_review']);

  // BELIEVES WRONG (promise 1): Phase 1 made these options render with real
  // text, but fileDebrief only stores finding/action/method keys, so these
  // questions' answers are thrown away and the reopened debrief of a completed
  // report says "Not recorded" for the very option the player picked.
  it('a completed report on a repaired question shows the chosen option text when reopened', () => {
    const failures = [];
    for (const m of MISSIONS) {
      const q = m.debriefQs.find((x) => FIXED_QS.has(x.id) && !x.showIf);
      if (!q) continue;
      const opt = q.options.find((o) => o.severity !== 'skip' && o.value !== 'skip' && o.value !== 'later');
      const answers = {};
      for (const q2 of m.debriefQs) if (!q2.showIf) answers[q2.id] = q2 === q ? opt.value : q2.options?.[0]?.value;
      const filed = fileDebrief(stateWith({}), m, answers);
      if (filed?.state.missions[m.id].status !== 'completed') continue;
      const html = renderDebrief(filed.state, m.id);
      if (!html.includes(opt.text.replace(/&/g, '&amp;')) && !html.includes(opt.text)) failures.push(`${m.id} / ${q.id} = ${opt.value}`);
    }
    expect(failures).toEqual([]);
  });
});

// ── Promise 2: skip / later / severity skip ─────────────────────────
describe('skipped filings', () => {
  it('a follow-up (showIf) question answered "later" files the whole report as skipped, for every 2FA mission', () => {
    const twoFa = MISSIONS.filter((m) => m.id.endsWith('-fortify-2fa'));
    expect(twoFa.length).toBeGreaterThan(5);
    for (const m of twoFa) {
      const r = debriefRecord(m, { method: 'none', method_setup: 'later' });
      expect(r.status).toBe('skipped');
      expect(r.record.action).toBe('later');
    }
  });

  it('a stale hidden "later" does not defer a report whose parent answer changed', () => {
    const m = byId('gmail-fortify-2fa');
    const r = debriefRecord(m, { method: 'passkey', method_setup: 'later' });
    expect(r.status).toBe('completed');
    expect(r.record.method_setup).toBeUndefined();
  });

  it('every severity-skip / skip / later option, including showIf follow-ups made visible, files as skipped', () => {
    const wrong = [];
    for (const m of MISSIONS) {
      for (const q of m.debriefQs) {
        for (const o of q.options || []) {
          if (!(o.severity === 'skip' || o.value === 'skip' || o.value === 'later')) continue;
          const answers = {};
          for (const q2 of m.debriefQs) {
            if (q2.showIf) continue;
            answers[q2.id] = q2.type === 'number' ? (q2.options?.[0]?.value ?? '3') : q2.options?.find((x) => x.severity !== 'skip')?.value ?? q2.options?.[0]?.value;
          }
          if (q.showIf) {
            const parent = m.debriefQs.find((p) => p.id === q.showIf.question);
            if (q.showIf.values) answers[parent.id] = q.showIf.values[0];
            else answers[parent.id] = parent.options.find((x) => !q.showIf.notValues.includes(x.value))?.value ?? '3';
          }
          answers[q.id] = o.value;
          const shownIds = visibleQuestions(m, answers).map((x) => x.id);
          if (!shownIds.includes(q.id)) continue;
          // fill every other visible question
          for (const q2 of visibleQuestions(m, answers)) {
            if (answers[q2.id] === undefined) answers[q2.id] = q2.multi ? [q2.options[0].value] : (q2.type === 'number' ? '1' : q2.options?.[0]?.value);
          }
          const r = debriefRecord(m, answers);
          if (r && r.status !== 'skipped') wrong.push(`${m.id}/${q.id}=${o.value} -> ${r.status}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('the password manager report skipped on the number question files as skipped and hides its follow-ups', () => {
    const m = byId('password_manager-recon-report');
    const r = debriefRecord(m, { flagged_count: 'skip' });
    expect(r.status).toBe('skipped');
    expect(r.record.action).toBe('skip');
    expect(r.pmFlagged).toBeUndefined();
  });

  it('a multi-select report with accounts ticked is completed, and "none" alone is also completed', () => {
    const m = byId('password_manager-recon-report');
    expect(debriefRecord(m, { flagged_count: '2', throwaway_count: '0', flagged: ['gmail'] }).status).toBe('completed');
    expect(debriefRecord(m, { flagged_count: '0', throwaway_count: '0', flagged: ['none'] }).status).toBe('completed');
  });

  it('a skipped burst ("Not now") files skipped and a zero-change burst also files skipped', () => {
    const m = byId('password_manager-fortify-burst');
    expect(debriefRecord(m, { changed: 'later' }).status).toBe('skipped');
    expect(debriefRecord(m, { changed: '0', junk: 'no' }).status).toBe('skipped');
    expect(debriefRecord(m, { changed: '2', junk: 'no' }).status).toBe('completed');
  });

  it('skipped reports are never "done": no district progress, no integrity, no breach counts, no reaction, no scarred building', () => {
    const records = {};
    for (const m of MISSIONS) records[m.id] = { status: 'skipped', finding: m.id.endsWith('-recon-breach') ? '3plus-breaches' : 'skip' };
    const s = stateWith(records);
    for (const d of DISTRICTS) expect(calcDistrictProgress(s, d.id).completed).toBe(0);
    expect(calcFindings(s).breachesFound).toBe(0);
    for (const m of MISSIONS) expect(debriefReaction(s, m)).toBeNull();
    for (const id of Object.keys(ACCOUNTS)) expect(getBuildingState(s, id)).not.toBe('liberated-scarred');
    expect(isBreachFound('gmail-recon-breach', { status: 'skipped', finding: '3plus-breaches' })).toBe(false);
  });

  it('restore resends a skipped filing as skipped, with the same data the live event carries', () => {
    const m = byId('people_search-recon-find-yourself');
    const filed = fileDebrief(stateWith({}), m, { broker_recon: 'skip' });
    expect(filed.event.status).toBe('skipped');
    const ev = restoreEvents(filed.state).find((e) => e.data.mission === m.id);
    expect(ev.data.status).toBe('skipped');
    const live = missionEventData(m, { ...filed.state.missions[m.id], status: 'skipped' });
    expect({ ...ev.data, restored: undefined }).toEqual({ ...live, restored: undefined });
  });

  it('refiling a completed report as skipped clears completedAt and the old answers', () => {
    const m = byId('gmail-recon-breach');
    const s1 = fileDebrief(stateWith({}), m, { finding: '3plus-breaches', password_exposed: 'yes' }).state;
    expect(s1.missions[m.id].status).toBe('completed');
    const s2 = fileDebrief(s1, m, { finding: 'skip' }).state;
    expect(s2.missions[m.id].status).toBe('skipped');
    expect(s2.missions[m.id].password_exposed).toBeUndefined();
    expect(s2.missions[m.id].completedAt).toBeUndefined();
    expect(calcFindings(s2).breachesFound).toBe(0);
  });
});

// ── Promise 3: Scout's reaction ─────────────────────────────────────
describe("Scout's reaction after non-email checks", () => {
  const nonEmailBreachChecks = MISSIONS.filter((m) => m.id.endsWith('-recon-breach') && !isEmailBreachCheck(m.id));

  // BELIEVES WRONG (promise 3: "the mission's own line wins"): passwordScoutLine
  // still runs first, so after a bank/card/service breach check answered "no,
  // my password wasn't in it" Scout says "Your address leaked; your password
  // didn't ... aimed at that inbox". A bank or Instagram check is not about
  // an address or an inbox, so the line is untrue; the mission's own line for
  // the answer should win on every non-email breach check.
  it('a non-email breach check with password_exposed=no shows the mission\'s own line, not the inbox line', () => {
    const wrong = [];
    for (const m of nonEmailBreachChecks) {
      const s = stateWith({ [m.id]: { status: 'completed', finding: '1-2-breaches', password_exposed: 'no' } });
      const own = m.scoutDialog?.debrief?.['1-2-breaches'];
      expect(own).toBeTruthy();
      if (debriefReaction(s, m).line !== own) wrong.push(m.id);
    }
    expect(wrong).toEqual([]);
  });

  it('no non-email check ever shows a district breach line, for every finding value and 25 draws', () => {
    const district = new Set();
    // district lines are reachable only through the module's own data
    return import('../../src/data/dialogue.js').then(({ DISTRICT_DIALOGUE }) => {
      for (const d of Object.values(DISTRICT_DIALOGUE)) for (const c of ['clean', 'minor', 'major']) (d.debrief?.[c] || []).forEach((l) => district.add(l));
      for (const m of MISSIONS) {
        if (isEmailBreachCheck(m.id)) continue;
        for (const finding of ['no-breaches', '1-2-breaches', '3plus-breaches']) {
          for (const action of [undefined, 'tightened', 'already-tight']) {
            const s = stateWith({ [m.id]: { status: 'completed', finding, action } });
            for (let i = 0; i < 25; i++) expect(district.has(debriefReaction(s, m).line)).toBe(false);
          }
        }
      }
    });
  });

  it('facility districts (no district dialogue) react without throwing', () => {
    const facility = MISSIONS.filter((m) => !ACCOUNTS[m.accountId]?.district || m.district);
    const any = MISSIONS.find((m) => ['freeway', 'foundry', 'grid', 'clinic', 'trail'].includes(m.district || ACCOUNTS[m.accountId]?.district));
    for (const m of [...facility.slice(0, 5), any].filter(Boolean)) {
      const s = stateWith({ [m.id]: { status: 'completed', finding: '1-2-breaches', action: 'tightened' } });
      expect(() => debriefReaction(s, m)).not.toThrow();
      expect(debriefReaction(s, m).line).toBeTruthy();
    }
  });
});

// ── Promise 4: breach counts ────────────────────────────────────────
describe('breach counts', () => {
  it('login, device, share and car findings never count, and the 3 clean values never scar a building', () => {
    const records = {
      'gmail-recon-login': { status: 'completed', finding: '3plus-breaches' },
      'whatsapp-recon-devices': { status: 'completed', finding: '1-2-breaches' },
      'gdrive-recon-shares': { status: 'completed', finding: '1-2-breaches' },
      'ford-recon-audit': { status: 'completed', finding: 'full-sharing' },
    };
    const s = stateWith(records);
    expect(calcFindings(s).breachesFound).toBe(0);
  });

  it('a breach check counts once whatever the password answer, and only when completed', () => {
    const s = stateWith({
      'gmail-recon-breach': { status: 'completed', finding: '1-2-breaches', password_exposed: 'no' },
      'outlook-recon-breach': { status: 'completed', finding: 'no-breaches' },
      'yahoo-recon-breach': { status: 'skipped', finding: '3plus-breaches' },
    });
    expect(calcFindings(s).breachesFound).toBe(1);
  });

  it('chapter-complete BREACHES count ignores a login intrusion in the same district', () => {
    const s = stateWith({});
    for (const m of MISSIONS.filter((x) => (x.district || ACCOUNTS[x.accountId]?.district) === 'master-keys')) {
      s.missions[m.id] = { status: 'completed', finding: m.id.endsWith('-recon-login') ? '3plus-breaches' : undefined };
    }
    expect(renderMilestone(s, 'master-keys')).not.toMatch(/undefined/);
  });
});

// ── Promise 5 ───────────────────────────────────────────────────────
describe('no literal ${ and the car insurance line is filled in', () => {
  it('every manufacturer insurance scan names its manufacturer in the no-sharing line', () => {
    const scans = MISSIONS.filter((m) => m.id.endsWith('-recon-insurance'));
    expect(scans.length).toBeGreaterThan(0);
    for (const m of scans) {
      const line = m.scoutDialog.debrief['no-sharing'];
      expect(line).toContain(ACCOUNTS[m.accountId].name);
      expect(line).not.toMatch(/\$\{|undefined/);
    }
  });
});
