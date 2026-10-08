// Recon campaign, phase 3 (audit X4): Google/Gmail, Apple ID/iCloud and
// Microsoft/Outlook are usually one address and one account. The second
// mission of each pair asks "same address?" first. "Same" files without a
// second check: a new question id (same_address), never a finding, so nothing
// is counted twice. Old saves keep their records and progress.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS } from '../src/data/missions.js';
import { createInitialState, updateMission } from '../src/state.js';
import { debriefRecord, fileDebrief, missionEventData, visibleQuestions, prefillAnswer } from '../src/utils/debrief.js';
import { passwordResetNeed, resetNeedSources, notNeededReasons } from '../src/utils/password-need.js';
import { calcFindings, calcDistrictProgress, isBreachFound } from '../src/utils/calc.js';
import { yourPart } from '../src/utils/collective.js';
import { restoreEvents } from '../src/utils/restore.js';
import { renderDebrief, debriefReaction } from '../src/screens/debrief.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDistrict } from '../src/screens/district.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const byId = (id) => MISSIONS.find((m) => m.id === id);
const PAIRS = [
  ['google', 'gmail', 'Gmail'],
  ['apple_id', 'icloud', 'iCloud'],
  ['microsoft', 'outlook', 'Outlook'],
];
const SENT_KEYS = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method', 'same_address']);
const s0 = createInitialState();
const set = (state, id, rec) => updateMission(state, id, rec);

describe.each(PAIRS)('%s asks whether it is the same address as %s', (acct, partner, name) => {
  for (const kind of ['breach', 'login']) {
    const id = `${acct}-recon-${kind}`;

    it(`${id}: the first question is same_address, naming ${name}`, () => {
      const q = byId(id).debriefQs[0];
      expect(q.id).toBe('same_address');
      expect(q.label).toBe(`Is this the same address as your ${name}?`);
      expect(q.options.map((o) => o.value)).toEqual([`same-as-${partner}`, 'different-address', 'skip']);
      expect(q.showIf).toBeUndefined();
    });

    it(`${id}: "same" files completed with no finding and sends no finding`, () => {
      const m = byId(id);
      expect(visibleQuestions(m, {}).map((q) => q.id)).toEqual(['same_address']);
      const r = debriefRecord(m, { same_address: `same-as-${partner}` });
      expect(r.status).toBe('completed');
      expect(r.record.finding).toBeUndefined();
      expect(r.record.same_address).toBe(`same-as-${partner}`);
      const data = missionEventData(m, r.record);
      expect(data.finding).toBeUndefined();
      for (const k of Object.keys(data)) expect(SENT_KEYS.has(k), k).toBe(true);
    });

    it(`${id}: "different" asks the usual check`, () => {
      const m = byId(id);
      const shown = visibleQuestions(m, { same_address: 'different-address' }).map((q) => q.id);
      expect(shown).toContain('finding');
      const r = debriefRecord(m, { same_address: 'different-address', finding: 'no-breaches' });
      expect(r.record.finding).toBe('no-breaches');
      expect(missionEventData(m, r.record).finding).toBe('no-breaches');
    });

    it(`${id}: a finding left over from switching to "same" is dropped`, () => {
      const m = byId(id);
      const answers = { same_address: `same-as-${partner}`, finding: '3plus-breaches', password_exposed: 'yes' };
      expect(visibleQuestions(m, answers).map((q) => q.id)).toEqual(['same_address']);
      const r = debriefRecord(m, answers);
      expect(r.record.finding).toBeUndefined();
      expect(r.record.password_exposed).toBeUndefined();
    });

    it(`${id}: Scout says the ${name} check covers it`, () => {
      const filed = fileDebrief(s0, byId(id), { same_address: `same-as-${partner}` });
      const line = debriefReaction(filed.state, byId(id)).line;
      expect(line).toContain(`Your ${name}`);
      expect(line).not.toMatch(/breaches|no exposure|clean/i);
    });
  }

  it(`the breach check's follow-up still chains: different + breached asks about the password`, () => {
    const m = byId(`${acct}-recon-breach`);
    const shown = visibleQuestions(m, { same_address: 'different-address', finding: '1-2-breaches' }).map((q) => q.id);
    expect(shown).toEqual(['same_address', 'finding', 'password_exposed']);
  });

  it('the login check pre-fills from the breach check’s answer', () => {
    const login = byId(`${acct}-recon-login`);
    const q = login.debriefQs[0];
    expect(prefillAnswer(q, login, s0)).toBeUndefined();
    const s = set(s0, `${acct}-recon-breach`, { status: 'completed', same_address: `same-as-${partner}` });
    expect(prefillAnswer(q, login, s)).toBe(`same-as-${partner}`);
    const d = set(s0, `${acct}-recon-breach`, { status: 'completed', same_address: 'different-address', finding: 'no-breaches' });
    expect(prefillAnswer(q, login, d)).toBe('different-address');
  });

  it('a pre-filled "different" shows the login question at once', () => {
    const s = set(s0, `${acct}-recon-breach`, { status: 'completed', same_address: 'different-address', finding: 'no-breaches' });
    const html = renderDebrief(s, `${acct}-recon-login`);
    const group = html.match(/<div data-question="finding"[^>]*>/)[0];
    expect(group).not.toMatch(/\shidden(\s|>)/);
    const fresh = renderDebrief(s0, `${acct}-recon-login`).match(/<div data-question="finding"[^>]*>/)[0];
    expect(fresh).toMatch(/\shidden(\s|>)/);
  });

  it('password need follows the partner’s checks when it is the same address', () => {
    const same = set(s0, `${acct}-recon-breach`, { status: 'completed', same_address: `same-as-${partner}` });
    expect(passwordResetNeed(same, acct)).toBe('unknown');
    const leaked = set(same, `${partner}-recon-breach`, { status: 'completed', finding: '3plus-breaches', password_exposed: 'yes' });
    expect(resetNeedSources(leaked, acct)).toEqual(['breach']);
    const clean = set(same, `${partner}-recon-breach`, { status: 'completed', finding: 'no-breaches' });
    expect(passwordResetNeed(clean, acct)).toBe('not-needed');
    expect(notNeededReasons(clean, acct)).toContain('Your breach check found no breaches.');
    expect(notNeededReasons(clean, acct)).not.toContain('Your login history looked clean.');

    const loginSame = set(clean, `${acct}-recon-login`, { status: 'completed', same_address: `same-as-${partner}` });
    expect(notNeededReasons(loginSame, acct)).not.toContain('Your login history looked clean.');
    const partnerLogin = set(loginSame, `${partner}-recon-login`, { status: 'completed', finding: '3plus-breaches' });
    expect(resetNeedSources(partnerLogin, acct)).toEqual(['login']);
    const partnerClean = set(loginSame, `${partner}-recon-login`, { status: 'completed', finding: 'no-breaches' });
    expect(notNeededReasons(partnerClean, acct)).toContain('Your login history looked clean.');
  });

  it('a different address keeps its own evidence', () => {
    const s = set(set(s0, `${acct}-recon-breach`, { status: 'completed', same_address: 'different-address', finding: 'no-breaches' }),
      `${partner}-recon-breach`, { status: 'completed', finding: '3plus-breaches', password_exposed: 'yes' });
    expect(passwordResetNeed(s, acct)).toBe('not-needed');
  });

  it('one address is counted once on Stats and Your Part', () => {
    let s = set(s0, `${partner}-recon-breach`, { status: 'completed', finding: '3plus-breaches', password_exposed: 'yes' });
    s = set(s, `${acct}-recon-breach`, { status: 'completed', same_address: `same-as-${partner}` });
    expect(calcFindings(s).breachesFound).toBe(1);
    expect(yourPart(s).found).toBe(1);
    expect(isBreachFound(`${acct}-recon-breach`, s.missions[`${acct}-recon-breach`])).toBe(false);
  });

  it('the same_address answer is tracked, live and on restore (ruling 2026-10-07)', () => {
    for (const kind of ['breach', 'login']) {
      const m = byId(`${acct}-recon-${kind}`);
      const same = debriefRecord(m, { same_address: `same-as-${partner}` });
      expect(missionEventData(m, same.record).same_address).toBe(`same-as-${partner}`);
      const diff = debriefRecord(m, { same_address: 'different-address', finding: 'no-breaches' });
      expect(missionEventData(m, diff.record).same_address).toBe('different-address');
    }
    const s = set(set(s0, `${acct}-recon-breach`, { status: 'completed', same_address: 'different-address', finding: 'no-breaches' }),
      `${acct}-recon-login`, { status: 'completed', same_address: `same-as-${partner}` });
    const ev = restoreEvents(s);
    expect(ev.find((e) => e.data.mission === `${acct}-recon-breach`).data.same_address).toBe('different-address');
    expect(ev.find((e) => e.data.mission === `${acct}-recon-login`).data.same_address).toBe(`same-as-${partner}`);
    // An old save never answered it, and nothing is invented for it.
    const old = set(s0, `${acct}-recon-breach`, { status: 'completed', finding: '3plus-breaches' });
    expect(restoreEvents(old).find((e) => e.data.mission === `${acct}-recon-breach`).data.same_address).toBeUndefined();
    // A malformed stored value is never resent.
    const bad = set(s0, `${acct}-recon-breach`, { status: 'completed', same_address: "same', text: 'x" });
    expect(restoreEvents(bad).find((e) => e.data.mission === `${acct}-recon-breach`).data.same_address).toBeUndefined();
  });

  it('restore resends "same" without a finding', () => {
    const s = set(s0, `${acct}-recon-breach`, { status: 'completed', same_address: `same-as-${partner}` });
    const ev = restoreEvents(s).find((e) => e.data.mission === `${acct}-recon-breach`);
    expect(ev.data.finding).toBeUndefined();
    expect(ev.data.status).toBe('completed');
  });

  it('an old save’s check keeps its finding, progress and reopened answers', () => {
    const old = set(s0, `${acct}-recon-breach`, { status: 'completed', finding: '3plus-breaches', password_exposed: 'yes' });
    expect(isBreachFound(`${acct}-recon-breach`, old.missions[`${acct}-recon-breach`])).toBe(true);
    expect(resetNeedSources(old, acct)).toEqual(['breach']);
    const html = renderDebrief(old, `${acct}-recon-breach`);
    expect(html).not.toContain('Not recorded');
    expect(html).toContain('Found in 3+ breaches');
    expect(calcDistrictProgress(old, 'master-keys').completed).toBeGreaterThan(0);
    const ev = restoreEvents(old).find((e) => e.data.mission === `${acct}-recon-breach`);
    expect(ev.data.finding).toBe('3plus-breaches');
  });

  it('the filed "same" shows its answer in the district list', () => {
    let s = s0;
    for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: true } } };
    s = set(s, `${acct}-recon-breach`, { status: 'completed', same_address: `same-as-${partner}` });
    expect(renderDistrict(s, 'master-keys', 'recon')).toContain(`Yes — it’s my ${name} address`);
  });

  it('the briefing tells a same-address player to skip the second check', () => {
    const m = byId(`${acct}-recon-breach`);
    expect(m.steps[0].text).toContain(`Same address as your ${name}?`);
    expect(m.steps[0].url).toBeUndefined();
    expect(renderBriefing(s0, m.id)).toContain(`Same address as your ${name}?`);
  });
});

describe('X4 copy', () => {
  it('the Microsoft check no longer says a LinkedIn breach matters', () => {
    const m = byId('microsoft-recon-breach');
    expect(JSON.stringify(m)).not.toMatch(/LinkedIn/);
  });

  it('the Password Reset briefing’s not-needed line follows the partner check', () => {
    let s = set(s0, 'gmail-recon-breach', { status: 'completed', finding: 'no-breaches' });
    s = set(s, 'google-recon-breach', { status: 'completed', same_address: 'same-as-gmail' });
    const html = renderBriefing(s, 'google-fortify-password');
    expect(html).toContain('Your breach check found no breaches.');
    expect(html).toContain('Clean record.');
  });
});
