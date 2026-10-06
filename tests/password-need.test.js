import { describe, it, expect } from 'vitest';
import { createInitialState, updateMission } from '../src/state.js';
import { passwordResetNeed, reopenStaleNotNeeded, notNeededReasons } from '../src/utils/password-need.js';
import { isMissionDone } from '../src/utils/mission-status.js';
import {
  calcDistrictProgress,
  calcIntegrity,
  calcExposure,
  calcFindings,
  getAccountPhaseGate,
  getBuildingState,
} from '../src/utils/calc.js';
import { isCityComplete } from '../src/utils/ghost.js';
import { yourPart } from '../src/utils/collective.js';
import { restoreEvents } from '../src/utils/restore.js';
import { getMissionsForDistrict } from '../src/data/missions.js';
import { isCoreMission } from '../src/utils/calc.js';

const set = (state, id, rec) => updateMission(state, id, rec);
const breach = (state, acct, finding, extra = {}) =>
  set(state, `${acct}-recon-breach`, { status: finding === 'skip' ? 'skipped' : 'completed', finding, ...extra });
const login = (state, acct, finding) =>
  set(state, `${acct}-recon-login`, { status: finding === 'skip' ? 'skipped' : 'completed', finding });

describe('passwordResetNeed: reset only when the password is compromised', () => {
  const s0 = createInitialState();

  it('is unknown before any recon (behaves like today)', () => {
    expect(passwordResetNeed(s0, 'gmail')).toBe('unknown');
  });

  it('is unknown when the breach check was skipped', () => {
    expect(passwordResetNeed(breach(s0, 'gmail', 'skip'), 'gmail')).toBe('unknown');
  });

  it('is not-needed after a clean breach check', () => {
    expect(passwordResetNeed(breach(s0, 'gmail', 'no-breaches'), 'gmail')).toBe('not-needed');
  });

  it.each([
    ['1-2-breaches', 'no', 'not-needed'],
    ['3plus-breaches', 'no', 'not-needed'],
    ['1-2-breaches', 'yes', 'needed'],
    ['3plus-breaches', 'yes', 'needed'],
    ['1-2-breaches', 'unsure', 'needed'],
    ['3plus-breaches', 'unsure', 'needed'],
  ])('breach %s with password_exposed %s is %s', (finding, exposed, need) => {
    expect(passwordResetNeed(breach(s0, 'gmail', finding, { password_exposed: exposed }), 'gmail')).toBe(need);
  });

  it('an old save with a breach and no password_exposed answer is needed', () => {
    expect(passwordResetNeed(breach(s0, 'gmail', '1-2-breaches'), 'gmail')).toBe('needed');
  });

  it('is needed when the password manager flagged the account, even after a clean check', () => {
    const s = { ...breach(s0, 'gmail', 'no-breaches'), pmFlagged: ['gmail'] };
    expect(passwordResetNeed(s, 'gmail')).toBe('needed');
    expect(passwordResetNeed({ ...s, pmFlagged: ['yahoo'] }, 'gmail')).toBe('not-needed');
  });

  it('is needed when flagged by the password manager with no breach check at all', () => {
    expect(passwordResetNeed({ ...s0, pmFlagged: ['state_dmv'] }, 'state_dmv')).toBe('needed');
  });

  it.each([
    ['1-2-breaches', 'needed'],
    ['3plus-breaches', 'needed'],
    ['no-breaches', 'not-needed'],
    ['skip', 'not-needed'],
  ])('login history %s after a clean breach check is %s', (finding, need) => {
    const s = login(breach(s0, 'gmail', 'no-breaches'), 'gmail', finding);
    expect(passwordResetNeed(s, 'gmail')).toBe(need);
  });

  it('suspicious logins alone make it needed', () => {
    expect(passwordResetNeed(login(s0, 'gmail', '3plus-breaches'), 'gmail')).toBe('needed');
  });

  it('accounts with no breach check stay unknown', () => {
    expect(passwordResetNeed(s0, 'state_dmv')).toBe('unknown');
  });

  it('gives only reasons that are true', () => {
    expect(notNeededReasons(breach(s0, 'gmail', 'no-breaches'), 'gmail')).toEqual([
      'Your breach check found no breaches.',
    ]);
    const s = login(
      { ...breach(s0, 'gmail', '1-2-breaches', { password_exposed: 'no' }), pmFlagged: [] },
      'gmail', 'no-breaches',
    );
    const s2 = set(s, 'password_manager-recon-report', { status: 'completed' });
    expect(notNeededReasons(s2, 'gmail')).toEqual([
      'The breaches you found didn’t include your password.',
      'Your password manager didn’t flag it.',
      'Your login history looked clean.',
    ]);
  });
});

describe('reopenStaleNotNeeded', () => {
  it('reopens a not-needed password mission once the account is flagged', () => {
    let s = breach(createInitialState(), 'gmail', 'no-breaches');
    s = set(s, 'gmail-fortify-password', { status: 'not-needed' });
    s = set(s, 'yahoo-fortify-password', { status: 'not-needed' });
    s = breach(s, 'yahoo', 'no-breaches');
    s = { ...s, pmFlagged: ['gmail'] };
    const out = reopenStaleNotNeeded(s);
    expect(out.missions['gmail-fortify-password'].status).toBeUndefined();
    expect(out.missions['yahoo-fortify-password'].status).toBe('not-needed');
  });

  it('leaves a completed reset alone', () => {
    let s = set(createInitialState(), 'gmail-fortify-password', { status: 'completed', action: 'reset-password' });
    s = { ...s, pmFlagged: ['gmail'] };
    expect(reopenStaleNotNeeded(s)).toBe(s);
  });
});

describe('not-needed counts as done for progress, never as a real action', () => {
  it('isMissionDone is true for completed and not-needed only', () => {
    expect(isMissionDone({ status: 'completed' })).toBe(true);
    expect(isMissionDone({ status: 'not-needed' })).toBe(true);
    expect(isMissionDone({ status: 'skipped' })).toBe(false);
    expect(isMissionDone(undefined)).toBe(false);
  });

  function allCoreDone(passwordStatus) {
    let s = createInitialState();
    for (const m of getMissionsForDistrict('master-keys').filter(isCoreMission)) {
      if (m.id.endsWith('-fortify-password')) {
        s = set(s, m.id, passwordStatus === 'completed'
          ? { status: 'completed', action: 'reset-password' }
          : { status: passwordStatus });
      } else if (m.id.endsWith('-recon-breach')) {
        s = set(s, m.id, { status: 'completed', finding: 'no-breaches' });
      } else {
        s = set(s, m.id, { status: 'completed', action: 'already-enabled', method: 'authenticator' });
      }
    }
    return s;
  }

  it('district %, buildings, gates, integrity and exposure match a completed reset', () => {
    const nn = allCoreDone('not-needed');
    const done = allCoreDone('completed');
    expect(calcDistrictProgress(nn, 'master-keys').percent).toBe(100);
    expect(calcDistrictProgress(nn, 'master-keys')).toEqual(calcDistrictProgress(done, 'master-keys'));
    expect(getBuildingState(nn, 'gmail')).toBe('liberated');
    expect(getAccountPhaseGate(nn, 'master-keys', 'gmail', 'fortify').unlocked).toBe(true);
    expect(calcIntegrity(nn)).toBe(calcIntegrity(done));
    expect(calcExposure(nn)).toBe(calcExposure(done));
  });

  it('isCityComplete accepts not-needed', () => {
    let s = allCoreDone('not-needed');
    for (const id of Object.keys(s.accounts)) {
      if (s.accounts[id].district !== 'master-keys') s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: false } } };
    }
    expect(isCityComplete(s)).toBe(true);
  });

  it('a not-needed mission is not a password reset in findings or your part', () => {
    let s = breach(createInitialState(), 'gmail', '1-2-breaches', { password_exposed: 'no' });
    s = set(s, 'gmail-fortify-password', { status: 'not-needed' });
    expect(calcFindings(s).passwordsReset).toBe(0);
    expect(yourPart(s)).toEqual({ found: 1, fixed: 0 });
  });

  it('restore re-sends not-needed missions with their status', () => {
    const s = set(createInitialState(), 'gmail-fortify-password', { status: 'not-needed' });
    const ev = restoreEvents(s).find((e) => e.data.mission === 'gmail-fortify-password');
    expect(ev).toBeTruthy();
    expect(ev.data.status).toBe('not-needed');
    expect(ev.data.restored).toBe('1');
  });
});

describe('restore sends the new answers too', () => {
  it('password_exposed and the 2FA method go back with the same keys', () => {
    let s = breach(createInitialState(), 'gmail', '1-2-breaches', { password_exposed: 'unsure' });
    s = set(s, 'gmail-fortify-2fa', { status: 'completed', action: 'enabled-2fa', method: 'none', method_setup: 'passkey' });
    const evs = restoreEvents(s);
    expect(evs.find((e) => e.data.mission === 'gmail-recon-breach').data).toMatchObject({ password_exposed: 'unsure', finding: '1-2-breaches' });
    expect(evs.find((e) => e.data.mission === 'gmail-fortify-2fa').data).toMatchObject({ method: 'passkey', status: 'completed' });
  });

  it('an old save sends exactly what it used to', () => {
    const s = set(createInitialState(), 'gmail-fortify-2fa', { status: 'completed', action: 'enabled-2fa' });
    expect(restoreEvents(s).find((e) => e.data.mission === 'gmail-fortify-2fa').data).toEqual({
      mission: 'gmail-fortify-2fa', district: 'master-keys', phase: 'fortify', status: 'completed', restored: '1',
    });
  });
});
