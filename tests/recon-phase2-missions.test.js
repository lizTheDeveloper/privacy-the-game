// Recon campaign, phase 2: per-account recon replaces 18 "Breach Recon"
// missions that re-checked the player's email address. Old records keep
// loading, restoring and counting; new missions send only whitelisted keys.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS, getMissionsForDistrict, missionDistrict } from '../src/data/missions.js';
import { RECON_ACCOUNT_MISSIONS } from '../src/data/missions-recon-accounts.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { createInitialState, updateMission } from '../src/state.js';
import {
  debriefRecord, fileDebrief, missionEventData, questionOptions, visibleQuestions, pmReportAccounts, missionSteps,
} from '../src/utils/debrief.js';
import { calcDistrictProgress, calcIntegrity, getAccountPhaseGate, getBuildingState, isCoreMission } from '../src/utils/calc.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';
import { restoreEvents } from '../src/utils/restore.js';
import { passwordResetNeed, resetNeedSources, notNeededReasons } from '../src/utils/password-need.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderDebrief, debriefReaction } from '../src/screens/debrief.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { nextAvailableMission } from '../src/screens/city-map.js';
import { DISTRICTS } from '../src/data/districts.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const byId = (id) => MISSIONS.find((m) => m.id === id);
const EMAIL = ['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'google', 'apple_id', 'microsoft'];
const REPLACED = {
  facebook: 'password', primary_bank: 'password', credit_card: 'password', paypal: 'password', venmo: 'password',
  cashapp: 'password', crypto_exchange: 'password', investment_account: 'password', healthcare_portal: 'activity',
  instagram: 'service', twitter: 'service', linkedin: 'service', dropbox: 'service',
  discord: 'password', reddit: 'password', amazon: 'activity', ebay: 'activity', uber: 'activity',
};
const SENT_KEYS = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method']);

// Every account enabled, and a first answer for every shown question.
function allOn() {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: true } } };
  return s;
}
function answersFor(m, pick = (q) => q.options.find((o) => o.severity !== 'skip')?.value) {
  const a = {};
  for (let i = 0; i < 3; i += 1) for (const q of visibleQuestions(m, a)) if (a[q.id] === undefined) a[q.id] = pick(q);
  return a;
}

describe('the replacement map', () => {
  it('replaces exactly the 18 non-email breach checks, with the brief’s ids', () => {
    const legacy = MISSIONS.filter((m) => m.legacy).map((m) => m.id).sort();
    expect(legacy).toEqual(Object.keys(REPLACED).map((a) => `${a}-recon-breach`).sort());
    for (const [acct, kind] of Object.entries(REPLACED)) {
      const old = byId(`${acct}-recon-breach`);
      const neu = byId(`${acct}-recon-${kind}`);
      expect(neu, acct).toBeTruthy();
      expect(old.replacedBy).toBe(neu.id);
      expect(neu.replaces).toBe(old.id);
      expect(neu.accountId).toBe(acct);
      expect(missionDistrict(neu)).toBe(missionDistrict(old));
      expect(neu.phase).toBe('recon');
      expect(Boolean(neu.optional)).toBe(Boolean(old.optional));
    }
    for (const a of EMAIL) expect(byId(`${a}-recon-breach`).legacy).toBeFalsy();
  });

  it('no new mission uses finding or password_exposed, and no new mission is an HIBP email check', () => {
    for (const m of RECON_ACCOUNT_MISSIONS) {
      const ids = m.debriefQs.map((q) => q.id);
      expect(ids, m.id).not.toContain('finding');
      expect(ids, m.id).not.toContain('password_exposed');
      expect(m.steps.some((st) => /enter (the|your) email/i.test(st.text)), m.id).toBe(false);
    }
  });

  it('the four real service breaches ask about that breach by its HIBP name', () => {
    const expected = {
      linkedin: ['“LinkedIn”', true], dropbox: ['“Dropbox”', true],
      twitter: ['“Twitter (200M)”', false], instagram: ['“Instagram”', false],
    };
    for (const [acct, [name, pw]] of Object.entries(expected)) {
      const m = byId(`${acct}-recon-service`);
      const q = m.debriefQs.find((x) => x.id === 'service_breach');
      expect(q.label, acct).toContain(name);
      expect(m.serviceBreachHadPasswords, acct).toBe(pw);
      expect(q.options.map((o) => o.value)).toEqual(['in-service-breach', 'not-in-service-breach', 'skip']);
    }
  });
});

describe('legacy missions are hidden but keep counting', () => {
  it('a legacy mission is never in play, never listed, never offered', () => {
    const s = allOn();
    for (const m of MISSIONS.filter((x) => x.legacy)) expect(isMissionInPlay(s, m), m.id).toBe(false);
    for (const d of DISTRICTS) {
      const html = renderDistrict(s, d.id, 'recon');
      for (const m of MISSIONS.filter((x) => x.legacy)) expect(html, `${d.id} ${m.id}`).not.toContain(`#/mission/${m.id}/`);
    }
    let st = s;
    for (let i = 0; i < 400; i += 1) {
      const next = nextAvailableMission(st);
      if (!next) break;
      expect(next.legacy, next.id).toBeFalsy();
      st = updateMission(st, next.id, { status: 'completed' });
    }
  });

  it('the new recon shows in its district’s recon list', () => {
    const s = allOn();
    for (const m of RECON_ACCOUNT_MISSIONS) {
      expect(renderDistrict(s, missionDistrict(m), 'recon'), m.id).toContain(`#/mission/${m.id}/briefing`);
    }
  });

  it('an old save keeps its district %, integrity, gates and buildings', () => {
    // A save from before Phase 2: every core mission of the time done.
    const s0 = allOn();
    let old = s0;
    for (const m of MISSIONS) {
      if (m.replaces || m.phase === 'survey' || m.optional || m.unlock) continue;
      old = updateMission(old, m.id, { status: 'completed', finding: m.id.endsWith('-recon-breach') ? 'no-breaches' : undefined });
    }
    for (const d of DISTRICTS) {
      const p = calcDistrictProgress(old, d.id);
      if (p.total) expect(p.percent, d.id).toBe(100);
    }
    for (const acct of Object.keys(REPLACED)) {
      const district = ACCOUNTS[acct].district;
      expect(getAccountPhaseGate(old, district, acct, 'recon').unlocked, acct).toBe(true);
      expect(getBuildingState(old, acct), acct).toBe('liberated');
    }
    // Integrity counts the replaced slot as done.
    let fresh = s0;
    for (const m of MISSIONS) {
      if (m.legacy || m.phase === 'survey' || m.optional || m.unlock) continue;
      fresh = updateMission(fresh, m.id, { status: 'completed' });
    }
    expect(calcIntegrity(old)).toBe(calcIntegrity(fresh));
  });

  it('a legacy recon on its own unlocks fortify for that account (nobody re-locked)', () => {
    const s = updateMission(allOn(), 'primary_bank-recon-breach', { status: 'completed', finding: 'no-breaches' });
    expect(getAccountPhaseGate(s, 'vault', 'primary_bank', 'recon').unlocked).toBe(true);
    expect(renderDistrict(s, 'vault', 'fortify')).toContain('#/mission/primary_bank-fortify-password/briefing');
    // A skipped legacy record never unlocked it, and still doesn't.
    const sk = updateMission(allOn(), 'primary_bank-recon-breach', { status: 'skipped', finding: 'skip' });
    expect(getAccountPhaseGate(sk, 'vault', 'primary_bank', 'recon').unlocked).toBe(false);
  });

  it('the new recon still offers itself to an old save, with a note that the old check counts', () => {
    const s = updateMission(allOn(), 'primary_bank-recon-breach', { status: 'completed', finding: 'no-breaches' });
    const html = renderDistrict(s, 'vault', 'recon');
    expect(html).toContain('#/mission/primary_bank-recon-password/briefing');
    expect(html).toContain('Your earlier email check still counts toward progress.');
  });

  it('an old legacy record still opens its debrief', () => {
    const s = updateMission(allOn(), 'paypal-recon-breach', { status: 'completed', finding: '1-2-breaches', password_exposed: 'no' });
    expect(renderDebrief(s, 'paypal-recon-breach')).toMatch(/Found in 1.2 breaches/);
  });
});

describe('new missions render, file and track only whitelisted keys', () => {
  it('every new mission renders its briefing and debrief', () => {
    const s = allOn();
    for (const m of RECON_ACCOUNT_MISSIONS) {
      expect(renderBriefing(s, m.id), m.id).toContain(m.title.split(':').pop().trim());
      const html = renderDebrief(s, m.id);
      for (const q of m.debriefQs) expect(html, `${m.id} ${q.id}`).toContain(`name="q_${q.id}"`);
    }
  });

  it('filing sends only mission/district/phase/status, live and on restore', () => {
    let s = allOn();
    for (const m of RECON_ACCOUNT_MISSIONS) {
      const filed = fileDebrief(s, m, answersFor(m));
      expect(filed, m.id).toBeTruthy();
      expect(filed.state.missions[m.id].status, m.id).toBe('completed');
      const data = missionEventData(m, { ...filed.state.missions[m.id], status: filed.event.status });
      expect(Object.keys(data).sort(), m.id).toEqual(['district', 'mission', 'phase', 'status']);
      s = filed.state;
    }
    const events = restoreEvents(s).filter((e) => e.name === 'mission-completed');
    for (const e of events) for (const k of Object.keys(e.data)) expect(SENT_KEYS.has(k) || k === 'restored', `${e.data.mission} ${k}`).toBe(true);
    for (const m of RECON_ACCOUNT_MISSIONS) expect(events.some((e) => e.data.mission === m.id), m.id).toBe(true);
  });

  it('restore resends an old legacy record exactly as before (build.sql excludes it)', () => {
    const s = updateMission(allOn(), 'primary_bank-recon-breach', { status: 'completed', finding: '3plus-breaches', password_exposed: 'yes' });
    const ev = restoreEvents(s).find((e) => e.data.mission === 'primary_bank-recon-breach');
    expect(ev.data).toMatchObject({ finding: '3plus-breaches', password_exposed: 'yes', status: 'completed', restored: '1' });
  });

  it('a skip answer files skipped; reopening shows every answer', () => {
    const m = byId('primary_bank-recon-password');
    const r = debriefRecord(m, { pw_status: 'skip', activity: 'activity-clean' });
    expect(r.status).toBe('skipped');
    const filed = fileDebrief(allOn(), m, { pw_status: 'pw-reused', activity: 'activity-unknown' });
    const html = renderDebrief(filed.state, m.id);
    expect(html).toContain('Listed as reused');
    expect(html).toContain('Something I don’t recognize');
  });

  it('LinkedIn and Dropbox ask "changed since" only after a hit', () => {
    for (const id of ['linkedin-recon-service', 'dropbox-recon-service']) {
      const m = byId(id);
      expect(visibleQuestions(m, { service_breach: 'not-in-service-breach' }).map((q) => q.id)).not.toContain('changed_since');
      expect(visibleQuestions(m, { service_breach: 'in-service-breach' }).map((q) => q.id)).toContain('changed_since');
    }
  });
});

describe('Q-SVC and password need', () => {
  const svc = (acct, service_breach, changed_since) =>
    updateMission(createInitialState(), `${acct}-recon-service`, { status: 'completed', service_breach, changed_since, pw_status: 'pw-not-saved' });

  it('a breach that included passwords needs a reset unless the password changed since', () => {
    expect(passwordResetNeed(svc('linkedin', 'in-service-breach', 'no'), 'linkedin')).toBe('needed');
    expect(passwordResetNeed(svc('linkedin', 'in-service-breach', 'unsure'), 'linkedin')).toBe('needed');
    expect(resetNeedSources(svc('dropbox', 'in-service-breach', 'no'), 'dropbox')).toEqual(['service']);
    expect(passwordResetNeed(svc('dropbox', 'in-service-breach', 'yes'), 'dropbox')).toBe('unknown');
  });

  it('a scrape with no passwords never triggers a reset', () => {
    for (const acct of ['instagram', 'twitter']) expect(passwordResetNeed(svc(acct, 'in-service-breach'), acct)).toBe('unknown');
    const fb = updateMission(createInitialState(), 'facebook-recon-password', { status: 'completed', service_breach: 'in-service-breach', pw_status: 'pw-clean' });
    expect(passwordResetNeed(fb, 'facebook')).toBe('not-needed');
    expect(notNeededReasons(fb, 'facebook')).toEqual(['Your password manager didn’t flag it.']);
  });
});

describe('Q-PW pre-fill and the widened report list', () => {
  const pmState = (flagged, offered) => {
    let s = { ...allOn(), passwordManager: '1password', pmFlagged: flagged };
    s = updateMission(s, 'password_manager-recon-report', { status: 'completed', flagged, flagged_offered: offered });
    return s;
  };
  const checked = (html, value) => new RegExp(`value="${value}" checked`).test(html);

  it('flagged -> leaked, listed and not flagged -> not flagged, never listed -> nothing', () => {
    expect(checked(renderDebrief(pmState(['primary_bank'], ['primary_bank']), 'primary_bank-recon-password'), 'pw-leaked')).toBe(true);
    const clean = renderDebrief(pmState([], ['amazon']), 'amazon-recon-activity');
    expect(checked(clean, 'pw-clean')).toBe(true);
    expect(clean).toContain('Filled in from your password manager report');
    const never = renderDebrief(pmState([], ['gmail']), 'amazon-recon-activity');
    expect(never).not.toMatch(/ checked/);
  });

  it('an old report (no offered list) pre-fills clean only for accounts it could list then', () => {
    const s = pmState([], undefined);
    expect(checked(renderDebrief(s, 'primary_bank-recon-password'), 'pw-clean')).toBe(true);
    expect(renderDebrief(s, 'amazon-recon-activity')).not.toMatch(/ checked/);
  });

  it('no report filed: nothing pre-filled', () => {
    expect(renderDebrief(allOn(), 'primary_bank-recon-password')).not.toMatch(/ checked/);
  });

  it('the report can flag every account with a recon mission, and remembers what it offered', () => {
    const s = { ...allOn(), passwordManager: '1password' };
    const ids = pmReportAccounts(s);
    for (const m of RECON_ACCOUNT_MISSIONS) expect(ids, m.accountId).toContain(m.accountId);
    const pm = byId('password_manager-recon-report');
    const q = pm.debriefQs.find((x) => x.id === 'flagged');
    expect(questionOptions(q, s).map((o) => o.value)).toContain('amazon');
    const filed = fileDebrief(s, pm, { flagged_count: '2', throwaway_count: '0', flagged: ['amazon'] });
    expect(filed.state.missions[pm.id].flagged_offered).toEqual(ids);
    expect(missionEventData(pm, filed.state.missions[pm.id])).not.toHaveProperty('flagged_offered');
  });

  it('a flagged account without a Password Reset mission is never sent to one', () => {
    const s = { ...allOn(), passwordManager: '1password', pmFlagged: ['amazon', 'gmail'] };
    const burst = byId('password_manager-fortify-burst');
    const text = missionSteps(burst, s).map((st) => st.text).join(' ');
    expect(text).toContain(ACCOUNTS.gmail.name);
    expect(text).not.toContain('Amazon');
  });
});

describe('Scout on the new checks', () => {
  it('the most severe answer speaks: a clean password never hides money that moved', () => {
    const m = byId('primary_bank-recon-password');
    const s = updateMission(allOn(), m.id, { status: 'completed', pw_status: 'pw-clean', activity: 'activity-confirmed' });
    expect(debriefReaction(s, m).line).toMatch(/back of your card/);
  });

  it('every answer of every new mission has its own line, with no district breach talk', () => {
    for (const m of RECON_ACCOUNT_MISSIONS) {
      for (const q of m.debriefQs) {
        for (const o of q.options) {
          const s = updateMission(allOn(), m.id, { status: 'completed', [q.id]: o.value });
          const line = debriefReaction(s, m)?.line;
          if (o.value === 'skip') continue;
          expect(m.scoutDialog.debrief[o.value] || q.id === 'changed_since', `${m.id} ${q.id}=${o.value}`).toBeTruthy();
          expect(line, `${m.id} ${q.id}=${o.value}`).not.toMatch(/breaches? (found|on this)|Three-plus|No exposure/i);
        }
      }
    }
  });

  it('money accounts say who to call on confirmed activity; core missions stay core', () => {
    for (const acct of ['primary_bank', 'credit_card', 'paypal', 'venmo', 'cashapp', 'crypto_exchange', 'investment_account']) {
      const m = byId(`${acct}-recon-password`);
      expect(m.scoutDialog.debrief['activity-confirmed'], acct).toMatch(/Call the number on the back|Report it to/);
      expect(isCoreMission(m)).toBe(isCoreMission(byId(`${acct}-recon-breach`)));
    }
  });
});

describe('district lists are unchanged in size', () => {
  it('each district has as many recon missions as before (one replaced by one)', () => {
    for (const d of DISTRICTS) {
      const now = getMissionsForDistrict(d.id).filter((m) => m.phase === 'recon').length;
      const before = MISSIONS.filter((m) => !m.replaces && missionDistrict(m) === d.id && m.phase === 'recon').length;
      expect(now, d.id).toBe(before);
    }
  });
});
