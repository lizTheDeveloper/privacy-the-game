// Recon campaign, phase 2: password-need.js follows the account's own
// evidence (password manager verdict, account activity, the service's own
// breach), and ignores an old non-email "breach check" that only re-checked
// the player's email address.
import { describe, it, expect } from 'vitest';
import { createInitialState, updateMission } from '../src/state.js';
import {
  passwordResetNeed, resetNeedSources, notNeededReasons, isPmFlagged, fraudContactLine, passwordReconNotes,
  reopenStaleNotNeeded, reopenReasonLine,
} from '../src/utils/password-need.js';
import { fileDebrief } from '../src/utils/debrief.js';
import { MISSIONS } from '../src/data/missions.js';
const byIdNeed = (id) => MISSIONS.find((m) => m.id === id);
import { renderBriefing } from '../src/screens/briefing.js';
import { PASSWORD_EXPOSED_QUESTION } from '../src/data/missions-passwords.js';

const s0 = createInitialState();
const set = (state, id, rec) => updateMission(state, id, rec);
const pw = (state, acct, value, extra = {}) =>
  set(state, `${acct}-recon-password`, { status: value === 'skip' ? 'skipped' : 'completed', pw_status: value, ...extra });
const legacy = (state, acct, finding, extra = {}) =>
  set(state, `${acct}-recon-breach`, { status: 'completed', finding, ...extra });

describe('Q-PW: the password manager verdict on this account', () => {
  it.each([
    ['pw-leaked', 'needed'],
    ['pw-reused', 'needed'],
    ['pw-clean', 'not-needed'],
    ['pw-not-saved', 'unknown'],
    ['skip', 'unknown'],
  ])('pw_status %s is %s', (value, need) => {
    expect(passwordResetNeed(pw(s0, 'primary_bank', value), 'primary_bank')).toBe(need);
  });

  it('a leaked or reused verdict is a password-manager source and shows as flagged', () => {
    const s = pw(s0, 'paypal', 'pw-reused');
    expect(resetNeedSources(s, 'paypal')).toEqual(['pm']);
    expect(isPmFlagged(s, 'paypal')).toBe(true);
    expect(isPmFlagged(pw(s0, 'paypal', 'pw-clean'), 'paypal')).toBe(false);
    expect(isPmFlagged({ ...s0, pmFlagged: ['paypal'] }, 'paypal')).toBe(true);
  });

  it('the report flag still wins over a clean answer', () => {
    const s = { ...pw(s0, 'venmo', 'pw-clean'), pmFlagged: ['venmo'] };
    expect(passwordResetNeed(s, 'venmo')).toBe('needed');
  });

  it('pw-clean gives a true reason, never the email breach reason', () => {
    const r = notNeededReasons(pw(s0, 'primary_bank', 'pw-clean'), 'primary_bank');
    expect(r).toContain('Your password manager didn’t flag it.');
    expect(r.join(' ')).not.toMatch(/breach/i);
  });
});

describe('Q-ACT: something only the account can show', () => {
  const act = (state, acct, value, id = `${acct}-recon-password`) =>
    set(state, id, { status: value === 'skip' ? 'skipped' : 'completed', activity: value });

  it.each([
    ['activity-unknown', 'needed'],
    ['activity-confirmed', 'needed'],
    ['activity-clean', 'unknown'],
  ])('activity %s alone is %s', (value, need) => {
    expect(passwordResetNeed(act(s0, 'credit_card', value), 'credit_card')).toBe(need);
  });

  it('activity is its own source', () => {
    expect(resetNeedSources(act(s0, 'cashapp', 'activity-confirmed'), 'cashapp')).toEqual(['activity']);
  });

  it('activity on an -activity mission counts too', () => {
    expect(passwordResetNeed(act(s0, 'amazon', 'activity-unknown', 'amazon-recon-activity'), 'amazon')).toBe('needed');
  });

  it('a filing left open by one skipped answer still carries the evidence it has', () => {
    const s = set(s0, 'primary_bank-recon-password', { status: 'skipped', pw_status: 'skip', activity: 'activity-confirmed' });
    expect(passwordResetNeed(s, 'primary_bank')).toBe('needed');
  });

  it('a clean password with clean activity is not-needed with both reasons', () => {
    const s = set(s0, 'primary_bank-recon-password', { status: 'completed', pw_status: 'pw-clean', activity: 'activity-clean' });
    expect(passwordResetNeed(s, 'primary_bank')).toBe('not-needed');
    expect(notNeededReasons(s, 'primary_bank')).toEqual([
      'Your password manager didn’t flag it.',
      'Everything in its recent activity was yours.',
    ]);
  });

  it('activity-confirmed on a money account gives the call-your-bank line; elsewhere nothing', () => {
    expect(fraudContactLine(act(s0, 'primary_bank', 'activity-confirmed'), 'primary_bank')).toMatch(/back of your card/);
    expect(fraudContactLine(act(s0, 'credit_card', 'activity-confirmed'), 'credit_card')).toMatch(/back of your card/);
    expect(fraudContactLine(act(s0, 'paypal', 'activity-confirmed'), 'paypal')).toMatch(/PayPal/);
    expect(fraudContactLine(act(s0, 'primary_bank', 'activity-unknown'), 'primary_bank')).toBe(null);
    expect(fraudContactLine(act(s0, 'amazon', 'activity-confirmed', 'amazon-recon-activity'), 'amazon')).toBe(null);
  });
});

describe('legacy -recon-breach records', () => {
  it.each(['primary_bank', 'credit_card', 'paypal', 'venmo', 'cashapp', 'investment_account', 'healthcare_portal', 'facebook'])(
    'an old clean %s email re-check no longer says NO RESET NEEDED', (acct) => {
      const s = legacy(s0, acct, 'no-breaches');
      expect(passwordResetNeed(s, acct)).toBe('unknown');
      expect(notNeededReasons(s, acct)).toEqual([]);
    });

  it('an old breached non-email record is ignored too (it was the email again)', () => {
    const s = legacy(s0, 'primary_bank', '3plus-breaches', { password_exposed: 'yes' });
    expect(passwordResetNeed(s, 'primary_bank')).toBe('unknown');
    expect(resetNeedSources(s, 'primary_bank')).toEqual([]);
  });

  it('old record plus new evidence: the new evidence decides', () => {
    expect(passwordResetNeed(pw(legacy(s0, 'primary_bank', 'no-breaches'), 'primary_bank', 'pw-leaked'), 'primary_bank')).toBe('needed');
    expect(passwordResetNeed(pw(legacy(s0, 'primary_bank', '3plus-breaches'), 'primary_bank', 'pw-clean'), 'primary_bank')).toBe('not-needed');
  });

  it.each(['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'google', 'apple_id', 'microsoft'])(
    'an email address breach check (%s) still decides as before', (acct) => {
      expect(passwordResetNeed(legacy(s0, acct, 'no-breaches'), acct)).toBe('not-needed');
      expect(passwordResetNeed(legacy(s0, acct, '1-2-breaches', { password_exposed: 'no' }), acct)).toBe('not-needed');
      expect(passwordResetNeed(legacy(s0, acct, '1-2-breaches', { password_exposed: 'yes' }), acct)).toBe('needed');
      expect(notNeededReasons(legacy(s0, acct, 'no-breaches'), acct)).toContain('Your breach check found no breaches.');
    });
});

describe('X5: the password_exposed question says which password', () => {
  it('asks about the password used on the breached site, with the reuse hint', () => {
    expect(PASSWORD_EXPOSED_QUESTION.label).toBe('Did any of those breaches include the password you used on that site?');
    expect(PASSWORD_EXPOSED_QUESTION.hint).toContain('If you ever used that same password for this account, treat this account’s password as leaked.');
    expect(PASSWORD_EXPOSED_QUESTION.options.map((o) => o.value)).toEqual(['yes', 'no', 'unsure']);
    expect(PASSWORD_EXPOSED_QUESTION.id).toBe('password_exposed');
  });
});

describe('the Password Reset briefing carries the recon’s notes', () => {
  it('money moved: who to call; not in a manager: the reuse warning', () => {
    const moved = set(s0, 'primary_bank-recon-password', { status: 'completed', pw_status: 'pw-clean', activity: 'activity-confirmed' });
    expect(passwordReconNotes(moved, 'primary_bank')[0]).toMatch(/back of your card/);
    expect(renderBriefing(moved, 'primary_bank-fortify-password')).toMatch(/back of your card/);
    const notSaved = pw(s0, 'paypal', 'pw-not-saved');
    expect(passwordReconNotes(notSaved, 'paypal')).toEqual(['If you’ve used this password anywhere else, change it.']);
    expect(renderBriefing(notSaved, 'paypal-fortify-password')).toContain('If you’ve used this password anywhere else, change it.');
    expect(passwordReconNotes(pw(s0, 'paypal', 'pw-clean'), 'paypal')).toEqual([]);
  });
});

describe('ruling: a not-needed reset reopens only on the player’s new evidence', () => {
  const base = () => {
    let s = legacy(s0, 'primary_bank', 'no-breaches');
    s = set(s, 'primary_bank-fortify-password', { status: 'not-needed' });
    return { ...s, accounts: { ...s.accounts, primary_bank: { ...s.accounts.primary_bank, enabled: true } } };
  };
  const bank = byIdNeed('primary_bank-recon-password');

  it('the rule change alone keeps the filed not-needed (progress unchanged)', () => {
    const s = base();
    expect(passwordResetNeed(s, 'primary_bank')).toBe('unknown');
    expect(s.missions['primary_bank-fortify-password'].status).toBe('not-needed');
    expect(reopenStaleNotNeeded(s).missions['primary_bank-fortify-password'].status).toBe('not-needed');
  });

  it.each([
    [{ pw_status: 'pw-leaked', activity: 'activity-clean' }, 'pm', /password manager/],
    [{ pw_status: 'pw-reused', activity: 'activity-clean' }, 'pm', /password manager/],
    [{ pw_status: 'pw-clean', activity: 'activity-unknown' }, 'activity', /didn’t recognize/],
    [{ pw_status: 'pw-clean', activity: 'activity-confirmed' }, 'activity', /didn’t do/],
  ])('filing %o reopens it, says why on the briefing', (answers, source, line) => {
    const filed = fileDebrief(base(), bank, answers);
    const rec = filed.state.missions['primary_bank-fortify-password'];
    expect(rec.status).toBeUndefined();
    expect(rec.reopened).toContain(source);
    const html = renderBriefing(filed.state, 'primary_bank-fortify-password');
    expect(html).toMatch(line);
    expect(html).toContain('NOT NOW');
    expect(html).not.toContain('NO RESET NEEDED');
  });

  it('clean new evidence keeps it not-needed', () => {
    const filed = fileDebrief(base(), bank, { pw_status: 'pw-clean', activity: 'activity-clean' });
    expect(filed.state.missions['primary_bank-fortify-password'].status).toBe('not-needed');
  });

  it('a service breach that had passwords reopens it too', () => {
    // No account with a password-bearing service breach has a Password Reset
    // mission today; the rule is generic, so check it on the evidence alone.
    expect(reopenReasonLine(['service'])).toMatch(/breach included/);
  });

  it('the reopen note goes once the reset is filed again', () => {
    const filed = fileDebrief(base(), bank, { pw_status: 'pw-leaked', activity: 'activity-clean' });
    const s = set(filed.state, 'primary_bank-fortify-password', { status: 'completed', action: 'reset-password' });
    expect(renderBriefing(s, 'primary_bank-fortify-password')).not.toMatch(/back on/);
  });
});
