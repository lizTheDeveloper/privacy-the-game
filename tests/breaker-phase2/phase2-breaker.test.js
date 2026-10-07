// Breaker for recon campaign Phase 2 (git diff 125ac6b..HEAD). Each test names
// the promise it pins. A test marked FAILS describes behaviour the breaker
// believes is wrong; the comment above it says why.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';
import { ACCOUNTS } from '../../src/data/accounts.js';
import { DISTRICTS } from '../../src/data/districts.js';
import { createInitialState, updateMission } from '../../src/state.js';
import { fileDebrief, missionEventData, visibleQuestions, prefillAnswer, pmReportAccounts } from '../../src/utils/debrief.js';
import {
  calcDistrictProgress, calcIntegrity, calcFindings, getAccountPhaseGate, getBuildingState, isCoreMission, isBreachFound,
  districtBreachedAddresses,
} from '../../src/utils/calc.js';
import { isMissionInPlay } from '../../src/utils/mission-status.js';
import { restoreEvents } from '../../src/utils/restore.js';
import { isCityComplete } from '../../src/utils/ghost.js';
import {
  passwordResetNeed, resetNeedSources, notNeededReasons, reopenStaleNotNeeded, passwordReconNotes, fraudContactLine,
} from '../../src/utils/password-need.js';
import { renderDistrict } from '../../src/screens/district.js';
import { renderBriefing } from '../../src/screens/briefing.js';
import { renderDebrief, debriefReaction } from '../../src/screens/debrief.js';
import { renderMilestone } from '../../src/screens/milestone.js';
import { nextAvailableMission } from '../../src/screens/city-map.js';
import { milestoneCardLine } from '../../src/utils/milestone-card.js';
import { yourPart } from '../../src/utils/collective.js';
import { renderCityTogether } from '../../src/screens/city-together.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const byId = (id) => MISSIONS.find((m) => m.id === id);
const NEW = MISSIONS.filter((m) => m.replaces);
const LEGACY = MISSIONS.filter((m) => m.legacy);
const MONEY = ['primary_bank', 'credit_card', 'paypal', 'venmo', 'cashapp', 'crypto_exchange', 'investment_account'];
const SENT = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method']);

function allOn() {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: true } } };
  return s;
}
const file = (s, id, answers) => {
  const r = fileDebrief(s, byId(id), answers);
  if (!r) throw new Error(`could not file ${id} with ${JSON.stringify(answers)}`);
  return r.state;
};
const rec = (s, id, fields) => updateMission(s, id, { status: 'completed', ...fields });
// Every in-play core mission done, replaced ones through `via` ('legacy'|'new').
function everythingDone(via) {
  let s = allOn();
  for (const m of MISSIONS) {
    if (m.legacy) continue;
    if (!isMissionInPlay(s, m) || !isCoreMission(m)) continue;
    if (m.replaces && via === 'legacy') s = rec(s, m.replaces, { finding: 'no-breaches' });
    else s = rec(s, m.id, {});
  }
  return s;
}
// Several passes: unlocks (2FA methods) appear as earlier missions get done.
function cityDone(via) {
  let s = everythingDone(via);
  for (let i = 0; i < 4; i += 1) {
    for (const m of MISSIONS) {
      if (m.legacy || !isMissionInPlay(s, m) || !isCoreMission(m)) continue;
      if (m.replaces && via === 'legacy') { if (!s.missions[m.replaces]) s = rec(s, m.replaces, { finding: 'no-breaches' }); } else if (!s.missions[m.id]) s = rec(s, m.id, {});
    }
  }
  return s;
}

describe('promise 4: old saves keep district %, gates, buildings, picker', () => {
  // FAILS (promise 4): district.js:485 decides the landing tab from
  // getMissionsForDistrict(...), which now skips legacy missions. A save whose
  // only filed records in a district are legacy breach checks (the very
  // records promise 4 says keep counting) lands on the SURVEY tab as if
  // nothing had been done, though the district shows progress. Before Phase 2
  // that save landed on RECON.
  it.each(['vault', 'capitol', 'marketplace', 'square', 'archives'])('%s: a save with only a legacy record lands on recon, not survey', (districtId) => {
    const legacy = LEGACY.find((m) => (DISTRICTS.find((d) => d.id === districtId).id) === ACCOUNTS[m.accountId].district);
    let s = allOn();
    s = rec(s, legacy.id, { finding: 'no-breaches' });
    expect(calcDistrictProgress(s, districtId).completed).toBeGreaterThan(0);
    const html = renderDistrict(s, districtId);
    expect(html).not.toMatch(/INVENTORY SURVEY/);
  });

  it('legacy and new both filed count once: percent, completed and integrity equal "new only"', () => {
    let both = allOn();
    both = rec(both, 'primary_bank-recon-breach', { finding: '1-2-breaches' });
    both = rec(both, 'primary_bank-recon-password', { pw_status: 'pw-clean', activity: 'activity-clean' });
    let onlyNew = allOn();
    onlyNew = rec(onlyNew, 'primary_bank-recon-password', { pw_status: 'pw-clean', activity: 'activity-clean' });
    let onlyLegacy = allOn();
    onlyLegacy = rec(onlyLegacy, 'primary_bank-recon-breach', { finding: '1-2-breaches' });
    expect(calcDistrictProgress(both, 'vault')).toEqual(calcDistrictProgress(onlyNew, 'vault'));
    expect(calcDistrictProgress(both, 'vault')).toEqual(calcDistrictProgress(onlyLegacy, 'vault'));
    expect(calcIntegrity(both)).toBe(calcIntegrity(onlyNew));
    expect(calcIntegrity(both)).toBe(calcIntegrity(onlyLegacy));
  });

  it('a legacy record filed skipped does not count and does not unlock; the new mission is still offered', () => {
    let s = allOn();
    s = updateMission(s, 'primary_bank-recon-breach', { status: 'skipped', finding: 'skip' });
    expect(calcDistrictProgress(s, 'vault').completed).toBe(0);
    expect(getAccountPhaseGate(s, 'vault', 'primary_bank', 'recon').unlocked).toBe(false);
    expect(isMissionInPlay(s, byId('primary_bank-recon-password'))).toBe(true);
    expect(isMissionInPlay(s, byId('primary_bank-recon-breach'))).toBe(false);
  });

  it('legacy done unlocks only its own account in a multi-account district', () => {
    let s = allOn();
    s = rec(s, 'primary_bank-recon-breach', { finding: 'no-breaches' });
    expect(getAccountPhaseGate(s, 'vault', 'primary_bank', 'recon').unlocked).toBe(true);
    for (const other of MONEY.filter((a) => a !== 'primary_bank')) {
      expect(getAccountPhaseGate(s, 'vault', other, 'recon').unlocked, other).toBe(false);
    }
    const html = renderDistrict(s, 'vault', 'fortify');
    expect(html).toMatch(/Complete RECON for Credit Card Portal first/);
    expect(html).not.toMatch(/Complete RECON for Bank first/);
  });

  it('every replaced account: a done legacy record satisfies the gate and the new mission still shows START', () => {
    for (const m of NEW) {
      let s = allOn();
      s = rec(s, m.replaces, { finding: 'no-breaches' });
      const district = ACCOUNTS[m.accountId].district;
      const gate = getAccountPhaseGate(s, district, m.accountId, 'recon');
      // A gate can still wait on the account's other recon missions, never on the legacy one.
      const others = MISSIONS.filter((x) => !x.legacy && x.phase === 'recon' && x.accountId === m.accountId && !x.optional && x.id !== m.id);
      const remainingOthers = others.filter((x) => !s.missions[x.id]).length;
      expect(gate.remaining, m.id).toBe(remainingOthers);
    }
  });

  it('legacy 3plus-breaches on a service never scars its building or counts as a found breach', () => {
    for (const m of LEGACY) {
      let s = allOn();
      s = rec(s, m.id, { finding: '3plus-breaches', password_exposed: 'yes' });
      expect(getBuildingState(s, m.accountId), m.id).not.toBe('liberated-scarred');
      expect(calcFindings(s).breachesFound, m.id).toBe(0);
      expect(isBreachFound(m.id, s.missions[m.id]), m.id).toBe(false);
    }
  });

  it('the next-mission picker never returns a legacy mission and skips an account whose legacy record is done', () => {
    let s = allOn();
    for (const m of LEGACY) s = rec(s, m.id, { finding: 'no-breaches' });
    for (let i = 0; i < 30; i += 1) {
      const next = nextAvailableMission(s);
      if (!next) break;
      expect(next.legacy).toBeFalsy();
      expect(LEGACY.some((l) => l.replacedBy === next.id)).toBe(false);
      s = rec(s, next.id, {});
    }
  });

  it('city complete and ghost unlock are the same whether replaced recon was filed as legacy or new', () => {
    const viaLegacy = cityDone('legacy');
    const viaNew = cityDone('new');
    expect(isCityComplete(viaNew)).toBe(true);
    expect(isCityComplete(viaLegacy)).toBe(true);
    for (const d of DISTRICTS) expect(calcDistrictProgress(viaLegacy, d.id), d.id).toEqual(calcDistrictProgress(viaNew, d.id));
  });

  it('facility districts hold no replaced recon, so their rows and % are untouched by legacy handling', () => {
    for (const d of DISTRICTS.filter((x) => x.type === 'facility')) {
      expect(LEGACY.some((m) => ACCOUNTS[m.accountId].district === d.id), d.id).toBe(false);
      const html = renderDistrict(allOn(), d.id);
      expect(html.length).toBeGreaterThan(500);
    }
  });
});

describe('promise 4 and 3: restore of legacy and new records', () => {
  it('a legacy record restores with only whitelisted keys, as before', () => {
    let s = allOn();
    for (const m of LEGACY) s = rec(s, m.id, { finding: '1-2-breaches', password_exposed: 'yes' });
    s = updateMission(s, 'amazon-recon-breach', { status: 'skipped', finding: 'skip' });
    const events = restoreEvents(s);
    const legacyEvents = events.filter((e) => e.data.mission?.endsWith('-recon-breach'));
    expect(legacyEvents).toHaveLength(LEGACY.length);
    for (const e of events) {
      for (const k of Object.keys(e.data)) expect([...SENT, 'restored'], `${e.data.mission} ${k}`).toContain(k);
      expect(e.data.restored).toBe('1');
    }
  });

  it('a new record with every local-only key (answers, offered list, reopened) restores without them', () => {
    let s = allOn();
    s = rec(s, 'healthcare_portal-recon-activity', {
      pw_status: 'pw-leaked', activity: 'activity-confirmed', provider_breach: 'on-hhs-list', service_breach: 'in-service-breach',
      changed_since: 'no', flagged_offered: ['gmail'], reopened: ['pm'],
    });
    const [e] = restoreEvents(s).filter((x) => x.data.mission === 'healthcare_portal-recon-activity');
    expect(Object.keys(e.data).sort()).toEqual(['district', 'mission', 'phase', 'restored', 'status']);
    expect(JSON.stringify(e)).not.toMatch(/pw-|activity-|service|hhs|changed/);
  });

  it('a district finished through legacy records restores district-completed, same as live', () => {
    const s = cityDone('legacy');
    const done = restoreEvents(s).filter((e) => e.name === 'district-completed').map((e) => e.data.district).sort();
    const live = DISTRICTS.filter((d) => calcDistrictProgress(s, d.id).percent === 100 && calcDistrictProgress(s, d.id).total > 0).map((d) => d.id).sort();
    expect(done).toEqual(live);
    expect(done).toContain('vault');
  });
});

describe('promise 3: new missions track whitelisted keys only, in every answer combination', () => {
  function combos(m) {
    const res = [];
    const rec2 = (a) => {
      const q = visibleQuestions(m, a).find((x) => a[x.id] === undefined);
      if (!q) { res.push(a); return; }
      for (const o of q.options) rec2({ ...a, [q.id]: o.value });
    };
    rec2({});
    return res;
  }
  it('filing event and missionEventData never carry pw_status, activity, service_breach or any answer value', () => {
    const s0 = allOn();
    let n = 0;
    for (const m of NEW) {
      for (const a of combos(m)) {
        const r = fileDebrief(s0, m, a);
        expect(r, `${m.id} ${JSON.stringify(a)}`).not.toBeNull();
        const data = missionEventData(m, { ...r.state.missions[m.id], status: r.event.status });
        expect(Object.keys(r.event)).toEqual(['status']);
        for (const k of Object.keys(data)) expect(SENT.has(k), `${m.id} ${k}`).toBe(true);
        const text = JSON.stringify(data);
        for (const v of Object.values(a)) if (v !== 'skip') expect(text.includes(`"${v}"`), `${m.id} leaked ${v}`).toBe(false);
        n += 1;
      }
    }
    expect(n).toBeGreaterThan(100);
  });

  it('refiling a new mission replaces its answers, so a hidden changed_since never lingers', () => {
    let s = allOn();
    s = file(s, 'linkedin-recon-service', { service_breach: 'in-service-breach', changed_since: 'yes', pw_status: 'pw-clean' });
    expect(s.missions['linkedin-recon-service'].changed_since).toBe('yes');
    s = file(s, 'linkedin-recon-service', { service_breach: 'not-in-service-breach', pw_status: 'pw-clean' });
    expect(s.missions['linkedin-recon-service'].changed_since).toBeUndefined();
  });
});

describe('promise 2: password-need follows each account’s own evidence', () => {
  const need = (s, a = 'primary_bank') => passwordResetNeed(s, a);
  const base = () => allOn();

  it.each([
    [{ pw_status: 'pw-leaked' }, 'needed'],
    [{ pw_status: 'pw-reused' }, 'needed'],
    [{ pw_status: 'pw-clean' }, 'not-needed'],
    [{ pw_status: 'pw-not-saved' }, 'unknown'],
    [{ pw_status: 'pw-clean', activity: 'activity-clean' }, 'not-needed'],
    [{ pw_status: 'pw-clean', activity: 'activity-unknown' }, 'needed'],
    [{ pw_status: 'pw-clean', activity: 'activity-confirmed' }, 'needed'],
    [{ pw_status: 'pw-not-saved', activity: 'activity-clean' }, 'unknown'],
    [{ activity: 'activity-clean' }, 'unknown'],
    [{ pw_status: 'pw-leaked', activity: 'activity-clean' }, 'needed'],
    [{ pw_status: 'skip', activity: 'activity-confirmed' }, 'needed'],
    [{ pw_status: 'pw-clean', activity: 'skip' }, 'not-needed'],
    [{ pw_status: 'skip', activity: 'skip' }, 'unknown'],
  ])('bank %j -> %s (completed or skipped filing, same answer)', (answers, expected) => {
    let s = base();
    s = updateMission(s, 'primary_bank-recon-password', { status: 'completed', ...answers });
    expect(need(s)).toBe(expected);
    s = updateMission(s, 'primary_bank-recon-password', { status: 'skipped' });
    expect(need(s)).toBe(expected);
  });

  it('every old non-email -recon-breach record is ignored, whatever it says', () => {
    for (const m of LEGACY.filter((x) => byId(`${x.accountId}-fortify-password`))) {
      for (const f of ['no-breaches', '1-2-breaches', '3plus-breaches']) {
        let s = base();
        s = rec(s, m.id, { finding: f, password_exposed: f === 'no-breaches' ? undefined : 'yes' });
        expect(passwordResetNeed(s, m.accountId), `${m.id} ${f}`).toBe('unknown');
        expect(resetNeedSources(s, m.accountId)).toEqual([]);
      }
    }
  });

  it('a legacy clean record plus a new pw-clean is not-needed for the new reason alone', () => {
    let s = base();
    s = rec(s, 'primary_bank-recon-breach', { finding: 'no-breaches' });
    s = rec(s, 'primary_bank-recon-password', { pw_status: 'pw-clean', activity: 'activity-clean' });
    expect(need(s)).toBe('not-needed');
    expect(notNeededReasons(s, 'primary_bank')).toEqual([
      'Your password manager didn’t flag it.',
      'Everything in its recent activity was yours.',
    ]);
  });

  it('not-needed reasons only state answers the player gave', () => {
    let s = base();
    s = rec(s, 'primary_bank-recon-breach', { finding: 'no-breaches' });
    s = updateMission(s, 'primary_bank-recon-password', { status: 'skipped', pw_status: 'pw-clean', activity: 'skip' });
    const reasons = notNeededReasons(s, 'primary_bank').join(' ');
    expect(reasons).not.toMatch(/breach check found no breaches/);
    expect(reasons).not.toMatch(/activity was yours/);
  });

  it('email addresses keep their own check; pw-clean on a non-email never borrows it', () => {
    let s = base();
    s = rec(s, 'gmail-recon-breach', { finding: 'no-breaches' });
    expect(need(s, 'gmail')).toBe('not-needed');
    s = rec(s, 'gmail-recon-breach', { finding: '3plus-breaches', password_exposed: 'no' });
    expect(need(s, 'gmail')).toBe('not-needed');
    s = rec(s, 'gmail-recon-breach', { finding: '3plus-breaches', password_exposed: undefined });
    expect(need(s, 'gmail')).toBe('needed');
    expect(need(s, 'primary_bank')).toBe('unknown');
  });

  it('a password manager flag outranks the player’s own pw-clean (conservative)', () => {
    let s = base();
    s = rec(s, 'primary_bank-recon-password', { pw_status: 'pw-clean', activity: 'activity-clean' });
    s = { ...s, pmFlagged: ['primary_bank'] };
    expect(need(s)).toBe('needed');
  });

  it('service breach: needed unless changed; not sure counts as not changed; no-password breach never needs', () => {
    const li = (a) => rec(base(), 'linkedin-recon-service', { pw_status: 'pw-clean', ...a });
    expect(need(li({ service_breach: 'in-service-breach', changed_since: 'no' }), 'linkedin')).toBe('needed');
    expect(need(li({ service_breach: 'in-service-breach', changed_since: 'unsure' }), 'linkedin')).toBe('needed');
    expect(need(li({ service_breach: 'in-service-breach' }), 'linkedin')).toBe('needed');
    expect(need(li({ service_breach: 'in-service-breach', changed_since: 'yes' }), 'linkedin')).toBe('not-needed');
    expect(need(li({ service_breach: 'not-in-service-breach' }), 'linkedin')).toBe('not-needed');
    const tw = rec(base(), 'twitter-recon-service', { service_breach: 'in-service-breach', pw_status: 'pw-not-saved' });
    expect(need(tw, 'twitter')).toBe('unknown');
    const fb = rec(base(), 'facebook-recon-password', { service_breach: 'in-service-breach', pw_status: 'pw-clean' });
    expect(need(fb, 'facebook')).toBe('not-needed');
  });

  it('the changed-since reason is only given when it is true', () => {
    const s = rec(base(), 'dropbox-recon-service', { pw_status: 'pw-clean', service_breach: 'in-service-breach', changed_since: 'yes' });
    const r = notNeededReasons(s, 'dropbox').join(' ');
    expect(r).toMatch(/changed it since its own breach/);
    expect(r).not.toMatch(/isn’t in your breach results/);
  });

  describe('a not-needed reset reopens only on new needed evidence', () => {
    const notNeeded = (s, id = 'primary_bank-fortify-password') => ({ ...s, missions: { ...s.missions, [id]: { status: 'not-needed' } } });

    it.each([
      [{ pw_status: 'pw-clean', activity: 'activity-clean' }],
      [{ pw_status: 'pw-clean', activity: 'skip' }],
      [{ pw_status: 'pw-not-saved', activity: 'activity-clean' }],
    ])('%j keeps it not-needed', (answers) => {
      let s = notNeeded(rec(base(), 'primary_bank-recon-breach', { finding: 'no-breaches' }));
      s = file(s, 'primary_bank-recon-password', answers);
      expect(s.missions['primary_bank-fortify-password'].status).toBe('not-needed');
      expect(s.missions['primary_bank-fortify-password'].reopened).toBeUndefined();
    });

    it.each([
      [{ pw_status: 'pw-leaked', activity: 'activity-clean' }, 'pm'],
      [{ pw_status: 'pw-clean', activity: 'activity-unknown' }, 'activity'],
      [{ pw_status: 'pw-clean', activity: 'activity-confirmed' }, 'activity'],
    ])('%j reopens it for %s', (answers, source) => {
      let s = notNeeded(base());
      s = file(s, 'primary_bank-recon-password', answers);
      const r = s.missions['primary_bank-fortify-password'];
      expect(r.status).toBeUndefined();
      expect(r.reopened).toContain(source);
    });

    it('a restored or old legacy breach record never reopens it, in either filing order', () => {
      let s = notNeeded(base());
      s = rec(s, 'primary_bank-recon-breach', { finding: '3plus-breaches', password_exposed: 'yes' });
      expect(reopenStaleNotNeeded(s).missions['primary_bank-fortify-password'].status).toBe('not-needed');
      s = file(s, 'primary_bank-recon-password', { pw_status: 'pw-clean', activity: 'activity-clean' });
      expect(s.missions['primary_bank-fortify-password'].status).toBe('not-needed');
    });

    it('filing order: the report flags the account after a pw-clean recon, and the other way round', () => {
      const report = (s, flagged) => file(s, 'password_manager-recon-report', { flagged_count: String(flagged.length), throwaway_count: '0', flagged: flagged.length ? flagged : ['none'] });
      let a = notNeeded(base());
      a = file(a, 'primary_bank-recon-password', { pw_status: 'pw-clean', activity: 'activity-clean' });
      a = report(a, ['primary_bank']);
      expect(a.missions['primary_bank-fortify-password'].status).toBeUndefined();
      expect(a.missions['primary_bank-fortify-password'].reopened).toContain('pm');

      let b = report(notNeeded(base()), ['primary_bank']);
      expect(b.missions['primary_bank-fortify-password'].reopened).toContain('pm');
      b = file(b, 'primary_bank-recon-password', { pw_status: 'pw-leaked', activity: 'activity-clean' });
      expect(passwordResetNeed(b, 'primary_bank')).toBe('needed');
    });

    it('the briefing says why it is back on, and the list stops calling it done', () => {
      let s = notNeeded(base());
      s = file(s, 'primary_bank-recon-password', { pw_status: 'pw-clean', activity: 'activity-unknown' });
      const html = renderBriefing(s, 'primary_bank-fortify-password');
      expect(html).toMatch(/reset is back on/);
      expect(renderDistrict(s, 'vault', 'fortify')).not.toMatch(/NO RESET NEEDED/);
    });
  });

  it('money line: card for bank and card, "report it" for the other money apps, nothing for non-money or non-confirmed', () => {
    for (const a of MONEY) {
      let s = rec(base(), `${a}-recon-password`, { pw_status: 'pw-clean', activity: 'activity-confirmed' });
      const line = fraudContactLine(s, a);
      if (a === 'primary_bank' || a === 'credit_card') expect(line).toMatch(/back of your card/);
      // Edited by the builder for the reviewer's low (2026-10-07): the debrief's
      // generic names ("your brokerage", "your exchange"), never a building name.
      else expect(line).toMatch(new RegExp(`Report it to ${{ paypal: 'PayPal', venmo: 'Venmo', cashapp: 'Cash App', crypto_exchange: 'your exchange', investment_account: 'your brokerage' }[a]} `));
      s = rec(base(), `${a}-recon-password`, { pw_status: 'pw-clean', activity: 'activity-unknown' });
      expect(fraudContactLine(s, a)).toBeNull();
    }
    const amazon = rec(base(), 'amazon-recon-activity', { pw_status: 'pw-clean', activity: 'activity-confirmed' });
    expect(fraudContactLine(amazon, 'amazon')).toBeNull();
    const html = renderBriefing(rec(base(), 'primary_bank-recon-password', { pw_status: 'pw-leaked', activity: 'activity-confirmed' }), 'primary_bank-fortify-password');
    expect(html).toMatch(/back of your card/);
  });

  it('pw-not-saved gets the reuse warning only while the reset is not already needed', () => {
    let s = rec(base(), 'paypal-recon-password', { pw_status: 'pw-not-saved', activity: 'activity-clean' });
    expect(passwordReconNotes(s, 'paypal')).toEqual(['If you’ve used this password anywhere else, change it.']);
    s = rec(base(), 'paypal-recon-password', { pw_status: 'pw-not-saved', activity: 'activity-unknown' });
    expect(passwordReconNotes(s, 'paypal')).toEqual([]);
  });
});

describe('promise 6: Q-PW pre-fill and the report list', () => {
  const report = (s, flagged) => file(s, 'password_manager-recon-report', { flagged_count: String(flagged.length), throwaway_count: '0', flagged: flagged.length ? flagged : ['none'] });
  const q = (id) => byId(id).debriefQs.find((x) => x.id === 'pw_status');

  it('flagged -> leaked, offered and not flagged -> clean, switched to None -> clean, skipped report -> nothing', () => {
    let s = report(allOn(), ['primary_bank']);
    expect(prefillAnswer(q('primary_bank-recon-password'), byId('primary_bank-recon-password'), s)).toBe('pw-leaked');
    expect(prefillAnswer(q('paypal-recon-password'), byId('paypal-recon-password'), s)).toBe('pw-clean');
    s = report(s, []);
    expect(s.pmFlagged).toEqual([]);
    expect(prefillAnswer(q('primary_bank-recon-password'), byId('primary_bank-recon-password'), s)).toBe('pw-clean');
    s = file(s, 'password_manager-recon-report', { flagged_count: 'skip' });
    expect(prefillAnswer(q('primary_bank-recon-password'), byId('primary_bank-recon-password'), s)).toBeUndefined();
  });

  it('an account enabled after the report was filed is never pre-filled clean', () => {
    let s = allOn();
    s = { ...s, accounts: { ...s.accounts, discord: { ...s.accounts.discord, enabled: false } } };
    s = report(s, []);
    s = { ...s, accounts: { ...s.accounts, discord: { ...s.accounts.discord, enabled: true } } };
    expect(prefillAnswer(q('discord-recon-password'), byId('discord-recon-password'), s)).toBeUndefined();
    expect(renderDebrief(s, 'discord-recon-password')).not.toMatch(/data-prefilled/);
  });

  it('the pre-filled radio is checked in the debrief, and only that one', () => {
    const s = report(allOn(), ['primary_bank']);
    const html = renderDebrief(s, 'primary_bank-recon-password');
    expect(html).toMatch(/data-prefilled="pw_status"/);
    expect(html.match(/name="q_pw_status" value="pw-leaked" checked/g)).toHaveLength(1);
    expect(html.match(/name="q_pw_status"[^>]* checked/g)).toHaveLength(1);
    expect(html.match(/name="q_activity"[^>]* checked/g)).toBeNull();
  });

  // Edited by the builder for ruling 5 (2026-10-07): only accounts with a
  // password the player could change (password/passwords/lockdown mission,
  // or a recon that asks pw_status), not every account with a recon mission.
  it('the flaggable list holds every enabled account with a changeable password, and none disabled', () => {
    const s = allOn();
    const list = pmReportAccounts(s);
    const withPassword = new Set(MISSIONS.filter((m) => ACCOUNTS[m.accountId]
      && (/-fortify-(password|passwords|lockdown)$/.test(m.id) || (m.phase === 'recon' && !m.legacy && m.debriefQs.some((q) => q.id === 'pw_status'))))
      .map((m) => m.accountId));
    expect(new Set(list)).toEqual(withPassword);
    const off = { ...s, accounts: { ...s.accounts, instagram: { ...s.accounts.instagram, enabled: false } } };
    expect(pmReportAccounts(off)).not.toContain('instagram');
    expect(list).toContain('amazon');
    expect(list).toContain('instagram');
  });

  it('an account without a Password Reset mission can be flagged without breaking the burst or need', () => {
    let s = report(allOn(), ['instagram', 'primary_bank']);
    expect(s.pmFlagged).toEqual(['instagram', 'primary_bank']);
    expect(passwordResetNeed(s, 'instagram')).toBe('needed');
    expect(() => renderDistrict(s, 'vault')).not.toThrow();
    expect(() => renderDistrict(s, 'square', 'recon')).not.toThrow();
  });
});

describe('promise 5: copy is literally true', () => {
  const state = (over) => ({ ...allOn(), ...over });

  // FAILS (promise 5, severity ordering): the line Scout speaks on a money
  // account is meant to be the most severe answer. activity-confirmed and
  // pw-leaked/pw-reused are both 'crit', the tie goes to question order
  // (pw_status first), so "Your manager has seen this password in a leak.
  // Changing it is the fix." replaces "Call the number on the back of your
  // card..." / "Report it to X...". Money moved that the player didn't move
  // is the more urgent fact and the password line never mentions it.
  it.each(NEW.filter((m) => m.debriefQs.some((q) => q.id === 'activity') && m.debriefQs.some((q) => q.id === 'pw_status')).map((m) => m.id))(
    '%s: confirmed activity is not hidden by a leaked or reused password', (id) => {
      const m = byId(id);
      for (const pw of ['pw-leaked', 'pw-reused']) {
        const answers = {};
        for (const qn of m.debriefQs) {
          if (qn.id === 'pw_status') answers[qn.id] = pw;
          else if (qn.id === 'activity') answers[qn.id] = 'activity-confirmed';
          else answers[qn.id] = qn.options[0].value;
        }
        const s = file(allOn(), id, answers);
        expect(debriefReaction(s, m).line, `${id} ${pw}`).toBe(m.scoutDialog.debrief['activity-confirmed']);
      }
    });

  it('a clean answer never speaks over a worse one (crit/warn vs safe/skip), for every pair', () => {
    const worse = new Set(['pw-leaked', 'pw-reused', 'activity-unknown', 'activity-confirmed', 'in-service-breach']);
    const better = ['pw-clean', 'activity-clean', 'not-in-service-breach'];
    for (const m of NEW) {
      const qs = m.debriefQs.filter((q) => ['pw_status', 'activity', 'service_breach'].includes(q.id));
      for (const a of qs) for (const b of qs) {
        if (a === b) continue;
        for (const oa of a.options.filter((o) => worse.has(o.value) && o.severity !== 'warn')) {
          for (const ob of b.options.filter((o) => better.includes(o.value))) {
            const answers = {};
            for (const qn of m.debriefQs) answers[qn.id] = qn.options.find((o) => o.severity === 'safe')?.value ?? qn.options[0].value;
            answers[a.id] = oa.value; answers[b.id] = ob.value;
            const r = fileDebrief(allOn(), m, answers);
            if (!r) continue;
            const line = debriefReaction(r.state, m)?.line;
            expect(line, `${m.id} ${oa.value}+${ob.value}`).not.toBe(m.scoutDialog.debrief[ob.value]);
          }
        }
      }
    }
  });

  it('the Whole City footer says breach rates count email addresses only', () => {
    const data = { asOf: '2026-10-07T00:00:00Z', city: { players: 100, fortified: { pct: 20, fixed: 1, breached: 5 }, byAddress: [] }, pods: [] };
    const html = renderCityTogether(allOn(), { collective: { status: 'ready', data } });
    expect(html).toMatch(/Breach rates now count email addresses only\./);
  });

  // FAILS (promise 5): fortified.{pct,fixed,breached} now come only from the 8
  // email-address checks (build.sql rc_breached), and the builder changed Your
  // Part from "breached accounts" to "email addresses" for that reason. The
  // CITY FORTIFIED panel still says "Of breached accounts found by everyone",
  // so the same count is called accounts one line above a footer that says
  // addresses only. A reader takes "accounts" to include banks and services,
  // which are no longer counted.
  it('the CITY FORTIFIED explainer talks about addresses, not accounts', () => {
    const data = { asOf: '2026-10-07T00:00:00Z', city: { players: 100, fortified: { pct: 20, fixed: 1, breached: 5 }, byAddress: [] }, pods: [] };
    const html = renderCityTogether(allOn(), { collective: { status: 'ready', data } });
    expect(html).not.toMatch(/breached accounts/i);
  });

  it('the chapter stat counts email-address checks only and is absent where there are none', () => {
    let s = allOn();
    s = rec(s, 'gmail-recon-breach', { finding: '1-2-breaches' });
    s = rec(s, 'outlook-recon-breach', { finding: 'no-breaches' });
    for (const m of LEGACY) s = rec(s, m.id, { finding: '3plus-breaches' });
    expect(districtBreachedAddresses(s, 'master-keys')).toBe(1);
    expect(districtBreachedAddresses(s, 'vault')).toBeNull();
    expect(districtBreachedAddresses(s, 'square')).toBeNull();
    const mk = renderMilestone(s, 'master-keys');
    expect(mk).toMatch(/>1<\/div>\s*<div[^>]*>ADDRESS FOUND IN A BREACH</);
    expect(mk).not.toMatch(/BREACHES FIXED/i);
    expect(renderMilestone(s, 'vault')).not.toMatch(/FOUND IN A BREACH/);
    expect(milestoneCardLine({ accountsSecured: 3, addressesBreached: 2, integrityPercent: 10 })).toBe('3 accounts secured · 2 addresses found in a breach · 10% integrity');
    expect(milestoneCardLine({ accountsSecured: 3, addressesBreached: null, integrityPercent: 10 })).not.toMatch(/breach/);
    expect(yourPart(s)).toEqual({ found: 1, fixed: 0 });
  });
});

describe('promise 7: nothing in the new pages can force a wide layout', () => {
  // jsdom has no layout; the browser sweep (360 and 390, briefings, debriefs,
  // districts, milestone, Whole City, with filed answers, reopened resets,
  // fraud lines) found no overflow. This pins the static causes of overflow.
  it('no unbroken word over 34 characters and no fixed width over 320px in any new briefing or debrief', () => {
    let s = allOn();
    s = { ...s, passwordManager: '1password', pmFlagged: ['primary_bank'] };
    for (const m of NEW) {
      for (const screen of [renderBriefing(s, m.id), renderDebrief(s, m.id)]) {
        const text = screen.replace(/<[^>]+>/g, ' ');
        for (const w of text.split(/\s+/)) expect(w.length, `${m.id}: ${w}`).toBeLessThanOrEqual(34);
        for (const px of screen.matchAll(/(?<![-\w])(?:min-)?width:\s*(\d+)px/g)) expect(Number(px[1]), m.id).toBeLessThanOrEqual(320);
      }
    }
  });
});
