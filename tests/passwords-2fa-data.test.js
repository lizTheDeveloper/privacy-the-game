import { describe, it, expect } from 'vitest';
import { MISSIONS, getMissionsForDistrict, missionDistrict } from '../src/data/missions.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { PASSWORD_MANAGERS, CRITICAL_ACCOUNTS } from '../src/data/missions-passwords.js';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
import { isMissionAvailable, isMissionInPlay } from '../src/utils/mission-status.js';
import { calcDistrictProgress, isCoreMission } from '../src/utils/calc.js';
import {
  questionOptions,
  visibleQuestions,
  debriefRecord,
  missionEventData,
  missionSteps,
} from '../src/utils/debrief.js';

const byId = (id) => MISSIONS.find((m) => m.id === id);
const twoFaAccounts = MISSIONS.filter((m) => m.id.endsWith('-fortify-2fa')).map((m) => m.accountId);

describe('breach checks ask whether the password leaked', () => {
  const breachMissions = MISSIONS.filter((m) => m.id.endsWith('-recon-breach'));

  it('every breach check has the conditional password_exposed question', () => {
    expect(breachMissions.length).toBe(26);
    for (const m of breachMissions) {
      const q = m.debriefQs.find((x) => x.id === 'password_exposed');
      expect(q, m.id).toBeTruthy();
      expect(q.label).toBe('Did any of those breaches include your password?');
      expect(q.options.map((o) => [o.value, o.text])).toEqual([
        ['yes', 'Yes — passwords were in the leaked data'],
        ['no', 'No — only things like email or username'],
        ['unsure', 'Not sure'],
      ]);
    }
  });

  it('the question shows only after a breach finding', () => {
    const m = byId('gmail-recon-breach');
    const ids = (answers) => visibleQuestions(m, answers).map((q) => q.id);
    expect(ids({})).toEqual(['finding']);
    expect(ids({ finding: 'no-breaches' })).toEqual(['finding']);
    expect(ids({ finding: 'skip' })).toEqual(['finding']);
    expect(ids({ finding: '1-2-breaches' })).toEqual(['finding', 'password_exposed']);
    expect(ids({ finding: '3plus-breaches' })).toEqual(['finding', 'password_exposed']);
  });

  it('records and tracks password_exposed; needs it after a breach', () => {
    const m = byId('gmail-recon-breach');
    const s = createInitialState();
    expect(debriefRecord(m, { finding: '1-2-breaches' }, s)).toBeNull();
    const r = debriefRecord(m, { finding: '1-2-breaches', password_exposed: 'no' }, s);
    expect(r.record).toMatchObject({ status: 'completed', finding: '1-2-breaches', password_exposed: 'no' });
    expect(missionEventData(m, r.record)).toEqual({
      mission: 'gmail-recon-breach', district: 'master-keys', finding: '1-2-breaches',
      phase: 'recon', status: 'completed', password_exposed: 'no',
    });
  });

  it('a clean check ignores a stale password_exposed answer', () => {
    const m = byId('gmail-recon-breach');
    const r = debriefRecord(m, { finding: 'no-breaches', password_exposed: 'yes' }, createInitialState());
    expect(r.record.password_exposed).toBeUndefined();
  });

  it('login history is not a breach check and gets no extra question', () => {
    expect(byId('gmail-recon-login').debriefQs.map((q) => q.id)).toEqual(['finding']);
  });
});

describe('two-factor asks what you have', () => {
  it('every -fortify-2fa mission asks for the method', () => {
    expect(twoFaAccounts.sort()).toEqual(
      ['apple_id', 'facebook', 'gmail', 'google', 'icloud', 'microsoft', 'outlook', 'primary_bank', 'protonmail', 'yahoo'],
    );
    for (const acct of twoFaAccounts) {
      const [q1, q2] = byId(`${acct}-fortify-2fa`).debriefQs;
      expect(q1.id).toBe('method');
      expect(q1.label).toBe('What protects this account now?');
      expect(q1.options.map((o) => [o.value, o.text])).toEqual([
        ['passkey', 'A passkey or security key'],
        ['authenticator', 'An authenticator app'],
        ['sms', 'Text-message codes (SMS)'],
        ['email', 'Codes by email'],
        ['none', 'Nothing yet — I’ll set it up now'],
      ]);
      expect(q2.id).toBe('method_setup');
      expect(q2.options.map((o) => o.value)).toEqual(['passkey', 'authenticator', 'sms', 'email', 'later']);
    }
  });

  it('PIN-style locks keep their own debrief', () => {
    for (const id of ['irs-fortify-ip-pin', 'whatsapp-fortify-reglock', 'signal-fortify-reglock', 'telegram-fortify-twostep']) {
      expect(byId(id).debriefQs[0].id, id).toBe('action');
    }
  });

  it('the setup question shows only for "nothing yet"', () => {
    const m = byId('gmail-fortify-2fa');
    expect(visibleQuestions(m, { method: 'sms' }).map((q) => q.id)).toEqual(['method']);
    expect(visibleQuestions(m, { method: 'none' }).map((q) => q.id)).toEqual(['method', 'method_setup']);
  });

  it.each([
    [{ method: 'passkey' }, 'completed', 'already-enabled', 'passkey'],
    [{ method: 'authenticator' }, 'completed', 'already-enabled', 'authenticator'],
    [{ method: 'sms' }, 'completed', 'already-enabled', 'sms'],
    [{ method: 'email' }, 'completed', 'already-enabled', 'email'],
    [{ method: 'none', method_setup: 'authenticator' }, 'completed', 'enabled-2fa', 'authenticator'],
    [{ method: 'none', method_setup: 'sms' }, 'completed', 'enabled-2fa', 'sms'],
    [{ method: 'none', method_setup: 'later' }, 'skipped', 'later', 'none'],
  ])('%j -> %s / %s, tracks method %s', (answers, status, action, method) => {
    const m = byId('gmail-fortify-2fa');
    const r = debriefRecord(m, answers, createInitialState());
    expect(r.record.status).toBe(status);
    expect(r.record.action).toBe(action);
    expect(missionEventData(m, r.record).method).toBe(method);
  });

  it('"nothing yet" without a setup answer is incomplete', () => {
    expect(debriefRecord(byId('gmail-fortify-2fa'), { method: 'none' }, createInitialState())).toBeNull();
  });
});

describe('bonus missions: upgrade from codes, backup way in', () => {
  const done2fa = (s, acct, rec) => updateMission(s, `${acct}-fortify-2fa`, { status: 'completed', ...rec });

  it('every 2FA account has an optional upgrade mission', () => {
    for (const acct of twoFaAccounts) {
      const m = byId(`${acct}-fortify-2fa-upgrade`);
      expect(m, acct).toBeTruthy();
      expect(m.optional).toBe(true);
      expect(m.phase).toBe('fortify');
    }
  });

  it('upgrade appears only after 2FA by text or email codes', () => {
    const m = byId('gmail-fortify-2fa-upgrade');
    const s = createInitialState();
    expect(isMissionAvailable(s, m)).toBe(false);
    expect(isMissionAvailable(done2fa(s, 'gmail', { method: 'sms', action: 'already-enabled' }), m)).toBe(true);
    expect(isMissionAvailable(done2fa(s, 'gmail', { method: 'email', action: 'already-enabled' }), m)).toBe(true);
    expect(isMissionAvailable(done2fa(s, 'gmail', { method: 'none', method_setup: 'sms', action: 'enabled-2fa' }), m)).toBe(true);
    expect(isMissionAvailable(done2fa(s, 'gmail', { method: 'authenticator' }), m)).toBe(false);
    expect(isMissionAvailable(done2fa(s, 'gmail', { method: 'passkey' }), m)).toBe(false);
    // An old save: 2FA on, method unknown. No upgrade nudge without knowing.
    expect(isMissionAvailable(done2fa(s, 'gmail', { action: 'enabled-2fa' }), m)).toBe(false);
  });

  it('backup missions exist only for critical accounts', () => {
    expect(CRITICAL_ACCOUNTS).toEqual(
      ['gmail', 'google', 'outlook', 'microsoft', 'apple_id', 'icloud', 'protonmail', 'yahoo', 'primary_bank'],
    );
    const backups = MISSIONS.filter((m) => m.id.endsWith('-fortify-2fa-backup')).map((m) => m.accountId);
    expect(backups.sort()).toEqual([...CRITICAL_ACCOUNTS].sort());
    expect(byId('facebook-fortify-2fa-backup')).toBeUndefined();
    for (const acct of CRITICAL_ACCOUNTS) expect(byId(`${acct}-fortify-2fa-backup`).optional).toBe(true);
  });

  it('backup appears once 2FA is done with something other than "nothing"', () => {
    const m = byId('gmail-fortify-2fa-backup');
    const s = createInitialState();
    expect(isMissionAvailable(s, m)).toBe(false);
    expect(isMissionAvailable(done2fa(s, 'gmail', { method: 'passkey' }), m)).toBe(true);
    expect(isMissionAvailable(done2fa(s, 'gmail', { method: 'sms' }), m)).toBe(true);
    expect(isMissionAvailable(done2fa(s, 'gmail', { action: 'already-enabled' }), m)).toBe(true); // old save
    const later = updateMission(s, 'gmail-fortify-2fa', { status: 'skipped', method: 'none', method_setup: 'later' });
    expect(isMissionAvailable(later, m)).toBe(false);
  });

  it('a disabled account hides its bonus missions', () => {
    const m = byId('gmail-fortify-2fa-backup');
    const s = toggleAccount(done2fa(createInitialState(), 'gmail', { method: 'passkey' }), 'gmail', false);
    expect(isMissionInPlay(s, m)).toBe(false);
  });

  it('upgrades and backups are never core; a save without a manager answer keeps its totals', () => {
    const core = getMissionsForDistrict('master-keys').filter(isCoreMission);
    expect(core.map((m) => m.id).filter((id) => id.startsWith('password_manager-'))).toEqual(['password_manager-recon-report']);
    const vaultCore = getMissionsForDistrict('vault').filter(isCoreMission);
    for (const m of [...core, ...vaultCore]) {
      expect(m.id).not.toMatch(/-fortify-2fa-(upgrade|backup)$/);
    }
    expect(calcDistrictProgress(createInitialState(), 'master-keys').total).toBe(27);
  });

  it('an old save with the core path done stays at 100%', () => {
    let s = createInitialState();
    for (const m of getMissionsForDistrict('master-keys').filter(isCoreMission)) {
      if (m.unlock) continue; // the password-manager report: not in an old save
      s = updateMission(s, m.id, { status: 'completed', action: m.id.endsWith('2fa') ? 'enabled-2fa' : undefined });
    }
    expect(calcDistrictProgress(s, 'master-keys').percent).toBe(100);
  });
});

describe('password manager recon', () => {
  const pm = byId('password_manager-recon-report');

  it('is a core Master Keys recon mission (in play only with a manager)', () => {
    expect(pm.title).toBe('Check your password manager’s security report');
    expect(pm.optional).toBeFalsy();
    expect(isCoreMission(pm)).toBe(true);
    expect(pm.phase).toBe('recon');
    expect(missionDistrict(pm)).toBe('master-keys');
    expect(getMissionsForDistrict('master-keys')).toContain(pm);
  });

  it('lists the managers players can pick', () => {
    expect(PASSWORD_MANAGERS.map((p) => p.value)).toEqual(
      ['apple', 'google', '1password', 'bitwarden', 'proton', 'dashlane', 'lastpass', 'firefox', 'edge', 'other', 'none'],
    );
    expect(PASSWORD_MANAGERS.at(-1).text).toBe('No, I don’t use one');
  });

  it('appears only for players who use a password manager', () => {
    const s = createInitialState();
    expect(isMissionInPlay(s, pm)).toBe(false);
    expect(isMissionInPlay({ ...s, passwordManager: 'none' }, pm)).toBe(false);
    expect(isMissionInPlay({ ...s, passwordManager: 'bitwarden' }, pm)).toBe(true);
  });

  it.each([
    ['apple', /Security Recommendations/],
    ['apple', /Mac: open the Passwords app/],
    ['google', /Password Checkup/],
    ['1password', /Watchtower/],
    ['bitwarden', /Exposed passwords and Reused passwords/],
    ['proton', /Pass Monitor/],
    ['dashlane', /Password Health/],
    ['dashlane', /Dark Web Monitoring/],
    ['lastpass', /Security Dashboard/],
    ['firefox', /about:logins/],
    ['edge', /Password Monitor/],
    ['other', /Security, Health, Watchtower or Checkup report/],
  ])('steps for %s mention %s', (manager, re) => {
    const text = missionSteps(pm, { passwordManager: manager }).map((st) => st.text).join(' ');
    expect(text).toMatch(re);
  });

  it.each([
    ['google', 'https://passwords.google.com/checkup'],
    ['bitwarden', 'https://vault.bitwarden.com/#/reports'],
    ['firefox', 'https://monitor.mozilla.org'],
  ])('steps for %s link %s', (manager, url) => {
    expect(missionSteps(pm, { passwordManager: manager }).map((st) => st.url)).toContain(url);
  });

  it('other missions keep their own steps', () => {
    const m = byId('gmail-recon-breach');
    expect(missionSteps(m, { passwordManager: 'google' })).toBe(m.steps);
  });

  it('asks which enabled accounts with password missions were flagged', () => {
    let s = { ...createInitialState(), passwordManager: '1password' };
    s = toggleAccount(s, 'yahoo', false);
    const q = pm.debriefQs[0];
    expect(q.multi).toBe(true);
    expect(q.label).toBe('Which of your accounts did it flag as compromised or reused?');
    const opts = questionOptions(q, s);
    const values = opts.map((o) => o.value);
    expect(values).toContain('gmail');
    expect(values).toContain('primary_bank');
    expect(values).not.toContain('yahoo');        // disabled
    expect(values).not.toContain('instagram');    // no password mission
    expect(values.slice(-2)).toEqual(['none', 'skip']);
    expect(opts.find((o) => o.value === 'gmail').text).toBe(ACCOUNTS.gmail.name);
    expect(opts.at(-2).text).toBe('None were flagged');
    expect(opts.at(-1).text).toBe('Couldn’t check right now');
  });

  it('stores flagged account ids', () => {
    const s = { ...createInitialState(), passwordManager: '1password' };
    const r = debriefRecord(pm, { flagged: ['gmail', 'paypal'] }, s);
    expect(r.record.status).toBe('completed');
    expect(r.pmFlagged).toEqual(['gmail', 'paypal']);
    expect(debriefRecord(pm, { flagged: ['none'] }, s).pmFlagged).toEqual([]);
    const skip = debriefRecord(pm, { flagged: ['skip'] }, s);
    expect(skip.record.status).toBe('skipped');
    expect(skip.pmFlagged).toBeUndefined();
    expect(debriefRecord(pm, { flagged: [] }, s)).toBeNull();
  });
});
