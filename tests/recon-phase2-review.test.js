// Recon campaign, phase 2 reviewer: FIX FIRST items (C1, I1) and the lows.
import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, updateMission } from '../src/state.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderStats } from '../src/screens/stats.js';
import { PASSWORD_DIALOGUE } from '../src/data/dialogue.js';
import { fraudContactLine } from '../src/utils/password-need.js';
import { MISSIONS } from '../src/data/missions.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const on = (s, ...ids) => ({ ...s, accounts: Object.fromEntries(Object.entries(s.accounts).map(([k, v]) => [k, ids.includes(k) ? { ...v, enabled: true } : v])) });
const s0 = on(createInitialState(), 'primary_bank', 'gmail', 'investment_account', 'paypal');
const set = (s, id, rec) => updateMission(s, id, rec);
const byId = (id) => MISSIONS.find((m) => m.id === id);

describe('C1: the not-needed Scout line says only what is true', () => {
  it('bank: pw-clean + activity-clean gets the password-manager line', () => {
    const s = set(s0, 'primary_bank-recon-password', { status: 'completed', pw_status: 'pw-clean', activity: 'activity-clean' });
    const html = renderBriefing(s, 'primary_bank-fortify-password');
    expect(html).toContain(PASSWORD_DIALOGUE.notNeededPm);
    expect(html).not.toContain(PASSWORD_DIALOGUE.notNeeded);
    expect(html).not.toContain(PASSWORD_DIALOGUE.notNeededAfterLeak);
  });

  it('an old clean legacy record on the bank never says "clean record"', () => {
    let s = set(s0, 'primary_bank-recon-breach', { status: 'completed', finding: 'no-breaches' });
    expect(renderBriefing(s, 'primary_bank-fortify-password')).not.toMatch(/Clean record/);
    s = set(s, 'primary_bank-recon-password', { status: 'completed', pw_status: 'pw-clean', activity: 'activity-clean' });
    const html = renderBriefing(s, 'primary_bank-fortify-password');
    expect(html).not.toMatch(/Clean record/);
    expect(html).toContain(PASSWORD_DIALOGUE.notNeededPm);
  });

  it('email: no breaches gets "clean record"; a leak without the password gets the after-leak line', () => {
    const clean = set(s0, 'gmail-recon-breach', { status: 'completed', finding: 'no-breaches' });
    expect(renderBriefing(clean, 'gmail-fortify-password')).toContain(PASSWORD_DIALOGUE.notNeeded);
    const leak = set(s0, 'gmail-recon-breach', { status: 'completed', finding: '1-2-breaches', password_exposed: 'no' });
    expect(renderBriefing(leak, 'gmail-fortify-password')).toContain(PASSWORD_DIALOGUE.notNeededAfterLeak);
  });
});

describe('I1: the NO RESET NEEDED badge only while it is true', () => {
  it('a not-needed record whose verdict is now unknown shows FILED, keeps its status', () => {
    let s = set(s0, 'primary_bank-recon-breach', { status: 'completed', finding: 'no-breaches' });
    s = set(s, 'primary_bank-fortify-password', { status: 'not-needed' });
    const html = renderDistrict(s, 'vault', 'fortify');
    expect(html).not.toContain('NO RESET NEEDED');
    expect(html).toMatch(/>FILED</);
    expect(s.missions['primary_bank-fortify-password'].status).toBe('not-needed');
  });

  it('a not-needed record that is still not needed keeps the badge', () => {
    let s = set(s0, 'primary_bank-recon-password', { status: 'completed', pw_status: 'pw-clean', activity: 'activity-clean' });
    s = set(s, 'primary_bank-fortify-password', { status: 'not-needed' });
    expect(renderDistrict(s, 'vault', 'fortify')).toContain('NO RESET NEEDED');
  });
});

describe('lows', () => {
  it('fraud line uses the generic name, never the building name', () => {
    const s = set(s0, 'investment_account-recon-password', { status: 'completed', pw_status: 'pw-clean', activity: 'activity-confirmed' });
    expect(fraudContactLine(s, 'investment_account')).toMatch(/Report it to your brokerage/);
    expect(fraudContactLine(s, 'investment_account')).not.toMatch(/Investment Account/);
  });

  it('healthcare on the HHS list: watch your claims, no password claim', () => {
    const line = byId('healthcare_portal-recon-activity').scoutDialog.debrief['on-hhs-list'];
    expect(line).toMatch(/claims/);
    expect(line).not.toMatch(/password/i);
  });

  it('Vanguard path and Reddit sessions copy', () => {
    const inv = byId('investment_account-recon-password').steps.map((x) => x.text).join(' ');
    expect(inv).toContain('Vanguard app: Profile → Login & security / Device management');
    expect(byId('reddit-recon-password').briefing).toContain('resetting the password signs out your other sessions');
  });

  it('Stats labels the breach count as email addresses', () => {
    const html = renderStats(set(s0, 'gmail-recon-breach', { status: 'completed', finding: '1-2-breaches' }));
    expect(html).not.toContain('BREACHES FOUND');
    expect(html).toContain('ADDRESSES IN A BREACH');
  });
});
