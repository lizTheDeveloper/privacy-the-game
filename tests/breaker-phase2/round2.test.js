// Breaker round 2 for recon campaign Phase 2 (git diff 1869baa..HEAD, and a
// fresh look at 125ac6b..HEAD -- src collective). A failing test carries a
// FAILS comment naming the behaviour the breaker believes is wrong.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS, missionDistrict } from '../../src/data/missions.js';
import { ACCOUNTS } from '../../src/data/accounts.js';
import { DISTRICTS } from '../../src/data/districts.js';
import { createInitialState, updateMission } from '../../src/state.js';
import { fileDebrief, pmReportAccounts } from '../../src/utils/debrief.js';
import { calcFindings, districtBreachedAddresses, isBreachFound } from '../../src/utils/calc.js';
import { passwordResetNeed, resetNeedSources } from '../../src/utils/password-need.js';
import { renderDistrict } from '../../src/screens/district.js';
import { renderDebrief, debriefReaction } from '../../src/screens/debrief.js';
import { milestoneCardLine } from '../../src/utils/milestone-card.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const byId = (id) => MISSIONS.find((m) => m.id === id);
const NEW = MISSIONS.filter((m) => m.replaces);
const MASTER_KEYS = DISTRICTS.find((d) => MISSIONS.some((m) => !m.legacy && m.id.endsWith('-recon-breach') && missionDistrict(m) === d.id && ['gmail'].includes(m.accountId))).id;

function allOn() {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: true } } };
  return s;
}
const rec = (s, id, fields) => updateMission(s, id, { status: 'completed', ...fields });
const skipped = (s, id) => updateMission(s, id, { status: 'skipped', finding: 'skip' });
const EMAIL = ['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'google', 'apple_id', 'microsoft'];

describe('flaggable accounts (password-manager report list)', () => {
  const listed = () => new Set(pmReportAccounts(allOn()));

  it('every account that asks about its password or has a sign-in mission is listed', () => {
    const l = listed();
    for (const m of MISSIONS) {
      if (m.legacy || !ACCOUNTS[m.accountId]) continue;
      const asksPw = m.debriefQs?.some((q) => q.id === 'pw_status');
      const signIn = /-(recon-login|fortify-2fa|fortify-password|fortify-passwords|fortify-lockdown)$/.test(m.id);
      if (asksPw || signIn) expect(l.has(m.accountId), `${m.accountId} (${m.id})`).toBe(true);
    }
  });

  it('accounts with no password to change are never listed', () => {
    const l = listed();
    for (const id of Object.keys(ACCOUNTS)) {
      if (/^(car_|ai_|smart_)/.test(id) || ['whatsapp', 'signal', 'telegram', 'gdrive', 'people_search', 'ad_trackers', 'location_brokers',
        'credit_freeze', 'sim_protection', 'photo_metadata', 'browser_fingerprint', 'device_security'].includes(id)) {
        expect(l.has(id), id).toBe(false);
      }
    }
  });

  it('a disabled account is not listed and each account appears once', () => {
    let s = allOn();
    s = { ...s, accounts: { ...s.accounts, instagram: { ...s.accounts.instagram, enabled: false } } };
    const list = pmReportAccounts(s);
    expect(list).not.toContain('instagram');
    expect(new Set(list).size).toBe(list.length);
  });

  describe('old save whose pmFlagged holds an account that is no longer flaggable', () => {
    const stale = () => {
      const reportId = MISSIONS.find((m) => m.debriefQs?.some((q) => q.optionsFrom === 'password-accounts')).id;
      const s = rec(allOn(), reportId, { action: 'flagged', flagged: ['whatsapp', 'gdrive', 'instagram'], flagged_count: 3, throwaway_count: 0 });
      return { ...s, pmFlagged: ['whatsapp', 'gdrive', 'instagram'] };
    };

    it('does not hide the stale name in the filed report or the district summary', () => {
      const reportId = MISSIONS.find((m) => m.debriefQs?.some((q) => q.optionsFrom === 'password-accounts')).id;
      const s = stale();
      const html = renderDebrief(s, reportId);
      for (const id of ['whatsapp', 'gdrive', 'instagram']) expect(html, id).toContain(ACCOUNTS[id].name);
    });

    it('a still-flaggable flagged account still marks its reset as needed; a stale one marks nothing and crashes nothing', () => {
      const s = stale();
      expect(resetNeedSources(s, 'instagram')).toContain('pm');
      expect(() => passwordResetNeed(s, 'whatsapp')).not.toThrow();
      expect(() => passwordResetNeed(s, 'gdrive')).not.toThrow();
      for (const id of ['whatsapp', 'gdrive']) {
        expect(MISSIONS.some((m) => m.accountId === id && m.id.endsWith('-fortify-password')), id).toBe(false);
      }
    });
  });
});

describe('chapter address stat with mixed filings', () => {
  const a = (s) => districtBreachedAddresses(s, MASTER_KEYS);

  it('breach + skipped + clean counts only the breach', () => {
    let s = allOn();
    s = rec(s, 'gmail-recon-breach', { finding: '3plus-breaches' });
    s = skipped(s, 'outlook-recon-breach');
    s = rec(s, 'yahoo-recon-breach', { finding: 'no-breaches' });
    expect(a(s)).toBe(1);
  });

  it('skipped + clean shows 0, not hidden', () => {
    let s = allOn();
    s = skipped(s, 'gmail-recon-breach');
    s = rec(s, 'yahoo-recon-breach', { finding: 'no-breaches' });
    expect(a(s)).toBe(0);
  });

  it('only skipped checks hides the stat, and the card leaves the line out', () => {
    let s = allOn();
    for (const id of EMAIL) s = skipped(s, `${id}-recon-breach`);
    expect(a(s)).toBeNull();
    expect(milestoneCardLine({ accountsSecured: 3, addressesBreached: a(s), integrityPercent: 40 })).not.toMatch(/breach/);
  });

  it('a breach later refiled as skipped stops counting (the record is replaced, not merged)', () => {
    let s = allOn();
    s = rec(s, 'gmail-recon-breach', { finding: '1-2-breaches', password_exposed: 'yes' });
    expect(a(s)).toBe(1);
    const m = byId('gmail-recon-breach');
    const answers = {};
    for (const q of m.debriefQs) answers[q.id] = q.options.find((o) => o.value === 'skip')?.value;
    const r = fileDebrief(s, m, answers);
    expect(r).not.toBeNull();
    expect(r.state.missions['gmail-recon-breach'].status).toBe('skipped');
    expect(a(r.state)).toBeNull();
    expect(calcFindings(r.state).breachesFound).toBe(0);
  });

  it('a completed record with an unknown finding value neither counts nor shows the stat', () => {
    let s = allOn();
    s = rec(s, 'gmail-recon-breach', { finding: 'garbled' });
    expect(a(s)).toBeNull();
  });

  it('a legacy bank/service breach check never counts and never un-hides the stat', () => {
    let s = allOn();
    s = rec(s, 'primary_bank-recon-breach', { finding: '3plus-breaches' });
    s = rec(s, 'paypal-recon-breach', { finding: '1-2-breaches' });
    expect(a(s)).toBeNull();
    expect(isBreachFound('primary_bank-recon-breach', s.missions['primary_bank-recon-breach'])).toBe(false);
  });

  it('every non-Master-Keys district has no address stat whatever is filed', () => {
    let s = allOn();
    for (const m of MISSIONS) if (m.id.endsWith('-recon-breach')) s = rec(s, m.id, { finding: '3plus-breaches' });
    for (const d of DISTRICTS) if (d.id !== MASTER_KEYS) expect(districtBreachedAddresses(s, d.id), d.id).toBeNull();
  });
});

describe('landing tab, legacy records', () => {
  // A district whose only legacy record is skipped lands the same as one whose
  // only new record is skipped: nothing is "filed".
  it('only a skipped legacy record lands on survey, like only a skipped new record', () => {
    const m = NEW[0];
    const d = missionDistrict(m);
    const legacy = skipped(allOn(), m.replaces);
    const fresh = skipped(allOn(), m.id);
    const survey = (s) => /INVENTORY SURVEY/.test(renderDistrict(s, d));
    expect(survey(legacy)).toBe(survey(fresh));
  });

  it('every replaced mission: a completed legacy record alone lands off the survey tab', () => {
    for (const m of NEW) {
      const d = DISTRICTS.find((x) => x.id === missionDistrict(m));
      if (!d || d.type === 'facility') continue;
      const s = rec(allOn(), m.replaces, { finding: 'no-breaches' });
      expect(renderDistrict(s, d.id), `${m.replaces} in ${d.id}`).not.toMatch(/INVENTORY SURVEY/);
    }
  });

  it('a district with nothing filed still lands on survey', () => {
    expect(renderDistrict(allOn(), MASTER_KEYS)).toMatch(/INVENTORY SURVEY/);
  });
});

describe('severity across three answers and ties', () => {
  const RANK = { crit: 3, warn: 2, safe: 1, skip: 0 };
  const three = NEW.filter((m) => m.scoutBySeverity && m.debriefQs.filter((q) => q.options?.some((o) => Object.hasOwn(m.scoutDialog?.debrief || {}, o.value))).length >= 3);

  it('some mission has three lined questions', () => {
    expect(three.length).toBeGreaterThan(0);
  });

  it('the spoken line is one of the most severe answers, and activity wins a tie', () => {
    for (const m of three) {
      const lined = m.debriefQs.filter((q) => q.options?.some((o) => Object.hasOwn(m.scoutDialog.debrief, o.value)));
      const opts = lined.map((q) => q.options.filter((o) => Object.hasOwn(m.scoutDialog.debrief, o.value) && o.severity !== 'skip'));
      const combos = opts.reduce((acc, os) => acc.flatMap((c) => os.map((o) => [...c, o])), [[]]);
      for (const c of combos) {
        const stored = { status: 'completed' };
        lined.forEach((q, i) => { stored[q.id] = c[i].value; });
        const s = { ...allOn(), missions: { [m.id]: stored } };
        const line = debriefReaction(s, m)?.line;
        const top = Math.max(...c.map((o) => RANK[o.severity] ?? -1));
        const winners = c.filter((o) => (RANK[o.severity] ?? -1) === top);
        const allowed = winners.map((o) => m.scoutDialog.debrief[o.value]);
        expect(allowed, `${m.id} ${c.map((o) => o.value)}`).toContain(line);
        const actIdx = lined.findIndex((q) => q.id === 'activity');
        if (actIdx >= 0 && winners.includes(c[actIdx])) expect(line, `${m.id} ${c.map((o) => o.value)}`).toBe(m.scoutDialog.debrief[c[actIdx].value]);
      }
    }
  });

  it('a skipped follow-up value never speaks over a real answer', () => {
    for (const m of NEW.filter((x) => x.scoutBySeverity)) {
      const stored = { status: 'completed' };
      for (const q of m.debriefQs) {
        const real = q.options?.find((o) => Object.hasOwn(m.scoutDialog.debrief, o.value) && o.severity === 'crit');
        if (real) { stored[q.id] = real.value; break; }
      }
      const key = Object.keys(stored).find((k) => k !== 'status');
      if (!key) continue;
      const other = m.debriefQs.find((q) => q.id !== key && q.options?.some((o) => o.value === 'skip'));
      if (other) stored[other.id] = 'skip';
      const s = { ...allOn(), missions: { [m.id]: stored } };
      expect(debriefReaction(s, m).line, m.id).toBe(m.scoutDialog.debrief[stored[key]]);
    }
  });
});
