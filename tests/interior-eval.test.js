import { describe, it, expect } from 'vitest';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
const toggleOn = (s, id) => toggleAccount(s, id, true);
import { getInterior } from '../src/data/interiors/index.js';
import { MISSIONS } from '../src/data/missions.js';
import { applyRecheck } from '../src/utils/debrief.js';
import { allControllableSealed } from '../src/utils/interior-state.js';
import {
  freshness, recordDate, currentTwoFactor, entryState, checkupRows, sealedCount,
} from '../src/utils/interior.js';

const NOW = new Date('2026-10-20T00:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 864e5).toISOString();
function file(state, id, update, at) {
  const s = updateMission(state, id, { status: 'completed', ...update });
  if (at) s.missions[id].completedAt = at;
  return s;
}
const gmail = () => getInterior('gmail');
const byRule = (rule) => gmail().entries.find((e) => e.rule === rule);

describe('freshness', () => {
  it('10d fresh, 45d aging, 120d stale, missing/invalid unknown', () => {
    expect(freshness(daysAgo(10), NOW)).toBe('fresh');
    expect(freshness(daysAgo(30), NOW)).toBe('fresh');
    expect(freshness(daysAgo(45), NOW)).toBe('aging');
    expect(freshness(daysAgo(90), NOW)).toBe('aging');
    expect(freshness(daysAgo(120), NOW)).toBe('stale');
    expect(freshness(undefined, NOW)).toBe('unknown');
    expect(freshness('garbage', NOW)).toBe('unknown');
  });
  it('recordDate prefers rechecked over completedAt', () => {
    expect(recordDate({ rechecked: 'a', completedAt: 'b' })).toBe('a');
    expect(recordDate({ completedAt: 'b' })).toBe('b');
    expect(recordDate(undefined)).toBeUndefined();
  });
});

describe('entryState on gmail', () => {
  it('a fresh save: every controllable entry is not-checked, 0/0, not fully sealed', () => {
    const s = createInitialState();
    for (const e of gmail().entries) {
      expect(entryState(s, 'gmail', e).state).toBe(e.rule === 'beyond' ? 'beyond' : 'not-checked');
    }
    expect(sealedCount(s, 'gmail')).toEqual({ sealed: 0, total: 0 });
    expect(allControllableSealed(s, 'gmail')).toBe(false);
  });

  it('sms: phone line and mail slot open; authenticator: phone sealed with note, mail open; passkey both sealed', () => {
    const sim = byRule('sim-swap'); const ph = byRule('phishing');
    let s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' });
    expect(entryState(s, 'gmail', sim).state).toBe('open');
    expect(entryState(s, 'gmail', ph).state).toBe('open');
    s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'authenticator' });
    const r = entryState(s, 'gmail', sim);
    expect(r.state).toBe('sealed');
    expect(r.note).toBe('Sign-in codes no longer travel by text. A recovery phone number can still reopen this door: check under recovery options and remove it, or keep it only if the carrier account has a PIN.');
    expect(entryState(s, 'gmail', ph).state).toBe('open');
    s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'passkey' });
    expect(entryState(s, 'gmail', sim).state).toBe('sealed');
    expect(entryState(s, 'gmail', ph).state).toBe('sealed');
    expect(entryState(s, 'gmail', ph).note).toBe('Sealed while you sign in with the passkey. Your password still works as a backup, so a page that asks for your password and a code is the tell.');
  });

  it('a sealed Apple mail slot carries no note; Proton notes the authenticator backup (security keys)', () => {
    const pp = getInterior('protonmail').entries.find((e) => e.rule === 'phishing');
    expect(entryState(file(createInitialState(), 'protonmail-fortify-2fa', { method: 'passkey' }), 'protonmail', pp).note).toMatch(/^Sealed while you sign in with the security key\. If an authenticator code still works/);
    for (const id of ['apple_id', 'icloud']) {
      const ph = getInterior(id).entries.find((e) => e.rule === 'phishing');
      const r = entryState(file(createInitialState(), `${id}-fortify-2fa`, { method: 'passkey' }), id, ph);
      expect(r.state, id).toBe('sealed');
      expect(r.note, id).toBeUndefined();
    }
    const g = getInterior('google').entries.find((e) => e.rule === 'phishing');
    expect(entryState(file(createInitialState(), 'google-fortify-2fa', { method: 'passkey' }), 'google', g).note).toBe('Sealed while you sign in with the passkey. Your password still works as a backup, so a page that asks for your password and a code is the tell.');
  });

  it('2FA upgrade filed later wins over the original', () => {
    let s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' }, daysAgo(50));
    s = file(s, 'gmail-fortify-2fa-upgrade', { method: 'passkey' }, daysAgo(5));
    expect(currentTwoFactor(s, 'gmail')).toMatchObject({ method: 'passkey', missionId: 'gmail-fortify-2fa-upgrade' });
    expect(entryState(s, 'gmail', byRule('phishing')).state).toBe('sealed');
  });

  it('legacy 2FA record with no method is not-checked, never open', () => {
    const s = file(createInitialState(), 'gmail-fortify-2fa', { action: 'enabled-2fa' });
    expect(currentTwoFactor(s, 'gmail').method).toBeNull();
    expect(entryState(s, 'gmail', byRule('sim-swap')).state).toBe('not-checked');
    expect(entryState(s, 'gmail', byRule('phishing')).state).toBe('not-checked');
  });

  it('already-strong seals the front door; pm flag without reset opens it', () => {
    const pw = byRule('password-unique');
    let s = file(createInitialState(), 'gmail-fortify-password', { action: 'already-strong' });
    expect(entryState(s, 'gmail', pw).state).toBe('sealed');
    s = file({ ...createInitialState(), pmFlagged: ['gmail'] }, 'password_manager-recon-report', { action: 'flagged' }, daysAgo(5));
    expect(entryState(s, 'gmail', pw).state).toBe('open');
    s = file(s, 'gmail-fortify-password', { action: 'reset-password' }, daysAgo(1));
    expect(entryState(s, 'gmail', pw).state).toBe('sealed');
  });

  it('pw-clean evidence seals', () => {
    const s = file(createInitialState(), 'gmail-recon-password', { pw_status: 'pw-clean' });
    expect(entryState(s, 'gmail', byRule('password-unique')).state).toBe('sealed');
  });

  // The building's count (sealedCount) leaves out not-checked and beyond; FULLY
  // SEALED (allControllableSealed) needs every door in reach checked and sealed.
  it('the sealed count ignores not-checked and beyond; one seal is not fully sealed', () => {
    let s = file(createInitialState(), 'gmail-fortify-password', { action: 'reset-password' });
    expect(sealedCount(s, 'gmail')).toEqual({ sealed: 1, total: 1 });
    expect(allControllableSealed(s, 'gmail')).toBe(false);
    s = file(s, 'gmail-fortify-2fa', { method: 'sms' });
    expect(sealedCount(s, 'gmail').sealed).toBeLessThan(sealedCount(s, 'gmail').total);
  });
});

describe('devices and reglock (synthetic entries)', () => {
  const dev = { rule: 'devices' }; const reg = { rule: 'reglock' };
  it('devices', () => {
    expect(entryState(createInitialState(), 'signal', dev).state).toBe('not-checked');
    let s = file(createInitialState(), 'signal-recon-devices', { finding: 'no-breaches' });
    expect(entryState(s, 'signal', dev).state).toBe('sealed');
    s = file(createInitialState(), 'signal-recon-devices', { finding: '3plus-breaches' });
    expect(entryState(s, 'signal', dev).state).toBe('open');
    s = file(createInitialState(), 'gmail-recon-login', { finding: '1-2-breaches' });
    expect(entryState(s, 'gmail', dev).state).toBe('open');
  });
  it('reglock', () => {
    expect(entryState(createInitialState(), 'signal', reg).state).toBe('not-checked');
    for (const [a, st] of [['enabled-2fa', 'sealed'], ['already-enabled', 'sealed'], ['later', 'open']]) {
      const s = file(createInitialState(), 'signal-fortify-reglock', { action: a });
      expect(entryState(s, 'signal', reg).state).toBe(st);
      expect(entryState(s, 'signal', reg).note).toBe(st === 'sealed' ? 'Sealed while you use Signal at least once a week. After 7 days without use, the lock expires.' : undefined);
    }
  });
});

describe('checkupRows', () => {
  it('leak row only for email-address accounts', () => {
    const s = createInitialState();
    expect(checkupRows(s, 'gmail', NOW).map((r) => r.id)).toEqual(['password', 'leak', 'two-factor', 'devices']);
    expect(checkupRows(s, 'facebook', NOW).map((r) => r.id)).toEqual(['password', 'two-factor', 'devices']);
    expect(checkupRows(s, 'gmail', NOW).every((r) => r.status === 'not-checked')).toBe(true);
  });
  it('facebook with only the replaced recon record reads without throwing', () => {
    const s = file(createInitialState(), 'facebook-recon-breach', { finding: 'no-breaches' });
    expect(() => checkupRows(s, 'facebook', NOW)).not.toThrow();
  });
  it('a completed record without completedAt has freshness unknown', () => {
    const s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'passkey' });
    delete s.missions['gmail-fortify-2fa'].completedAt;
    const row = checkupRows(s, 'gmail', NOW).find((r) => r.id === 'two-factor');
    expect(row.status).toBe('ok');
    expect(row.freshness).toBe('unknown');
  });
  it('statuses map filings', () => {
    let s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' }, daysAgo(10));
    s = file(s, 'gmail-recon-breach', { finding: '3plus-breaches', password_exposed: 'yes' });
    const rows = Object.fromEntries(checkupRows(s, 'gmail', NOW).map((r) => [r.id, r]));
    expect(rows['two-factor']).toMatchObject({ status: 'warn', freshness: 'fresh', missionId: 'gmail-fortify-2fa' });
    expect(rows.leak.status).toBe('crit');
  });
});

describe('checkupRows only shows rows a mission can fill (fix round 1)', () => {
  it('signal: no password or two-factor rows; a registration-lock row instead', () => {
    const s = createInitialState();
    const rows = checkupRows(s, 'signal', NOW);
    expect(rows.map((r) => r.id)).toEqual(['reglock', 'devices']);
    const lock = rows.find((r) => r.id === 'reglock');
    expect(lock).toMatchObject({ status: 'not-checked', missionId: 'signal-fortify-reglock' });
    expect(lock.label).not.toMatch(/\bthey\b/i);
  });

  it('registration-lock row status follows the filed action', () => {
    const st = (action) => checkupRows(file(createInitialState(), 'signal-fortify-reglock', { action }, daysAgo(3)), 'signal', NOW).find((r) => r.id === 'reglock');
    expect(st('enabled-2fa')).toMatchObject({ status: 'ok', freshness: 'fresh' });
    expect(st('already-enabled').status).toBe('ok');
    expect(st('later').status).toBe('crit');
  });

  it('gmail rows are unchanged and have no registration-lock row', () => {
    expect(checkupRows(createInitialState(), 'gmail', NOW).map((r) => r.id)).toEqual(['password', 'leak', 'two-factor', 'devices']);
  });
});

describe('final fixes: password seal follows later flags', () => {
  const pw = () => byRule('password-unique');
  const report = (s, at) => file({ ...s, pmFlagged: ['gmail'] }, 'password_manager-recon-report', { action: 'flagged' }, at);

  it('already-strong, then a password-manager flag: open, roof crit', () => {
    let s = file(createInitialState(), 'gmail-fortify-password', { action: 'already-strong' }, daysAgo(10));
    s = report(s, daysAgo(2));
    expect(entryState(s, 'gmail', pw()).state).toBe('open');
    expect(checkupRows(s, 'gmail', NOW).find((r) => r.id === 'password').status).toBe('crit');
  });

  it('pw-clean, then a later flag: open', () => {
    let s = file(createInitialState(), 'gmail-recon-password', { pw_status: 'pw-clean' }, daysAgo(10));
    s = report(s, daysAgo(2));
    expect(entryState(s, 'gmail', pw()).state).toBe('open');
  });

  it('reset after the flag: sealed; reset before the flag: open', () => {
    const flagged = report(createInitialState(), daysAgo(5));
    expect(entryState(file(flagged, 'gmail-fortify-password', { action: 'reset-password' }, daysAgo(1)), 'gmail', pw()).state).toBe('sealed');
    const early = file(createInitialState(), 'gmail-fortify-password', { action: 'reset-password' }, daysAgo(9));
    expect(entryState(report(early, daysAgo(5)), 'gmail', pw()).state).toBe('open');
  });

  it('a login check with strangers filed after the reset: open', () => {
    let s = file(createInitialState(), 'gmail-fortify-password', { action: 'reset-password' }, daysAgo(9));
    s = file(s, 'gmail-recon-login', { finding: '1-2-breaches' }, daysAgo(3));
    expect(entryState(s, 'gmail', pw()).state).toBe('open');
  });

  it('no date to compare: not sealed', () => {
    let s = report(createInitialState(), daysAgo(5));
    s = file(s, 'gmail-fortify-password', { action: 'reset-password' });
    delete s.missions['gmail-fortify-password'].completedAt;
    expect(entryState(s, 'gmail', pw()).state).toBe('open');
  });
});

describe('final fixes: pw-clean seal carries its recon mission and date', () => {
  it('facebook: pw-clean gives a dated row on facebook-recon-password', () => {
    const s = file(toggleOn(createInitialState(), 'facebook'), 'facebook-recon-password', { pw_status: 'pw-clean', service_breach: 'not-in-service-breach' }, daysAgo(4));
    const row = checkupRows(s, 'facebook', NOW).find((r) => r.id === 'password');
    expect(row.status).toBe('ok');
    expect(row.missionId).toBe('facebook-recon-password');
    expect(row.freshness).toBe('fresh');
    const e = getInterior('facebook').entries.find((x) => x.rule === 'password-unique');
    expect(entryState(s, 'facebook', e)).toMatchObject({ state: 'sealed', missionId: 'facebook-recon-password', date: daysAgo(4) });
  });
});

describe('final fixes: skipped filings that say the door is open', () => {
  const skip = (s, id, update) => updateMission(s, id, { status: 'skipped', ...update });
  it('2FA "nothing yet" + "later": phone line and mail slot open, roof crit, START to the briefing', () => {
    const s = skip(createInitialState(), 'gmail-fortify-2fa', { method: 'none', method_setup: 'later', action: 'later' });
    expect(entryState(s, 'gmail', byRule('sim-swap')).state).toBe('open');
    expect(entryState(s, 'gmail', byRule('phishing')).state).toBe('open');
    const row = checkupRows(s, 'gmail', NOW).find((r) => r.id === 'two-factor');
    expect(row).toMatchObject({ status: 'crit', label: 'No two-step sign-in', missionId: 'gmail-fortify-2fa' });
  });
  it('old-save 2FA "later" (action only) also reads open', () => {
    const s = skip(createInitialState(), 'gmail-fortify-2fa', { action: 'later' });
    expect(entryState(s, 'gmail', byRule('sim-swap')).state).toBe('open');
  });
  it('a skipped 2FA filing without "later" stays not-checked', () => {
    const s = skip(createInitialState(), 'gmail-fortify-2fa', { method: 'skip' });
    expect(entryState(s, 'gmail', byRule('sim-swap')).state).toBe('not-checked');
    expect(checkupRows(s, 'gmail', NOW).find((r) => r.id === 'two-factor').status).toBe('not-checked');
  });
  it('Signal reglock "later" (skipped): open, roof "Registration lock is off" crit', () => {
    const s = skip(toggleOn(createInitialState(), 'signal'), 'signal-fortify-reglock', { action: 'later' });
    const e = getInterior('signal').entries.find((x) => x.rule === 'reglock');
    expect(entryState(s, 'signal', e)).toMatchObject({ state: 'open', missionId: 'signal-fortify-reglock' });
    expect(checkupRows(s, 'signal', NOW).find((r) => r.id === 'reglock')).toMatchObject({ status: 'crit', label: 'Registration lock is off' });
  });
  it('a reglock skipped some other way stays not-checked', () => {
    const s = skip(createInitialState(), 'signal-fortify-reglock', { action: 'skip' });
    expect(checkupRows(s, 'signal', NOW).find((r) => r.id === 'reglock').status).toBe('not-checked');
  });
});

describe('residual fixes: sweeps and undated filings', () => {
  const pw = () => byRule('password-unique');
  const login = MISSIONS.find((m) => m.id === 'gmail-recon-login');
  const answersFrom = (rec) => Object.fromEntries(login.debriefQs.filter((q) => rec[q.id] !== undefined).map((q) => [q.id, rec[q.id]]));

  it('a sweep with the same answers keeps a later reset sealed', () => {
    let s = file(createInitialState(), 'gmail-recon-login', { finding: '1-2-breaches' }, daysAgo(10));
    s = file(s, 'gmail-fortify-password', { action: 'reset-password' }, daysAgo(5));
    expect(entryState(s, 'gmail', pw()).state).toBe('sealed');
    const swept = applyRecheck(s, login, answersFrom(s.missions['gmail-recon-login']), daysAgo(1));
    expect(swept.missions['gmail-recon-login'].rechecked).toBe(daysAgo(1));
    expect(entryState(swept, 'gmail', pw()).state).toBe('sealed');
  });

  it('a sweep that finds something new opens the door again', () => {
    let s = file(createInitialState(), 'gmail-recon-login', { finding: '1-2-breaches' }, daysAgo(10));
    s = file(s, 'gmail-fortify-password', { action: 'reset-password' }, daysAgo(5));
    const answers = { ...answersFrom(s.missions['gmail-recon-login']), finding: '3plus-breaches' };
    const swept = applyRecheck(s, login, answers, daysAgo(1));
    expect(swept.missions['gmail-recon-login'].findingAt).toBe(daysAgo(1));
    expect(entryState(swept, 'gmail', pw()).state).toBe('open');
  });

  it('an undated skipped recon behind the need: a dated reset seals', () => {
    const fbPw = getInterior('facebook').entries.find((e) => e.rule === 'password-unique');
    let s = updateMission(toggleOn(createInitialState(), 'facebook'), 'facebook-recon-password', { status: 'skipped', pw_status: 'pw-leaked' });
    expect(s.missions['facebook-recon-password'].completedAt).toBeUndefined();
    expect(entryState(s, 'facebook', fbPw).state).toBe('open');
    s = file(s, 'facebook-fortify-password', { action: 'reset-password' }, daysAgo(1));
    expect(entryState(s, 'facebook', fbPw).state).toBe('sealed');
  });

  it('filing again clears an earlier sweep’s dates', () => {
    let s = file(createInitialState(), 'gmail-recon-login', { finding: 'no-breaches' }, daysAgo(40));
    s.missions['gmail-recon-login'].rechecked = daysAgo(30);
    s.missions['gmail-recon-login'].findingAt = daysAgo(30);
    s = updateMission(s, 'gmail-recon-login', { status: 'completed', finding: '1-2-breaches' });
    expect(s.missions['gmail-recon-login'].rechecked).toBeUndefined();
    expect(s.missions['gmail-recon-login'].findingAt).toBeUndefined();
    expect(recordDate(s.missions['gmail-recon-login'])).toBe(s.missions['gmail-recon-login'].completedAt);
  });
});
