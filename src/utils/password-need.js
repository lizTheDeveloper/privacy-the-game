// Password resets only when the password is compromised (Liz, 2026-10-06):
// a leak that included the password (or "not sure"), a password manager
// flag, or someone else in the account. Otherwise a reset is busywork.
//
// Evidence, per account (recon Phase 2):
//  - an email address's own breach check (HIBP searches by address, so only
//    the 8 email-address accounts have one that means anything);
//  - the password manager's verdict on this account (pw_status, or the
//    report's flagged list);
//  - the account's own activity (activity) and login check (finding);
//  - this service's own breach, when it included passwords (service_breach).
// An old "-recon-breach" record on any other account only re-checked the
// player's email address, so it is ignored: it proves nothing either way.
import { MISSIONS } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { EMAIL_ACCOUNT_IDS } from './calc.js';

const BREACHED = new Set(['1-2-breaches', '3plus-breaches']);
const PW_FLAGGED = new Set(['pw-leaked', 'pw-reused']);
const ACTIVITY_BAD = new Set(['activity-unknown', 'activity-confirmed']);
// The new recon missions that carry pw_status / activity / service_breach.
export const NEW_RECON_SUFFIXES = ['-recon-password', '-recon-activity', '-recon-service'];
// A filing left open by one "couldn't check" answer still says what it says.
const FILED = new Set(['completed', 'skipped']);
export const PM_MISSION_ID = 'password_manager-recon-report';

// Money accounts, and who to call when something moved that the player
// didn't move. Nothing to do with passwords: it stops the money first.
const CARD_LINE = 'Call the number on the back of your card and tell them what you didn’t do. Use that number, not one from an email or text.';
export const MONEY_ACCOUNTS = new Set(['primary_bank', 'credit_card', 'paypal', 'venmo', 'cashapp', 'crypto_exchange', 'investment_account']);

export function isPasswordMission(mission) {
  return Boolean(mission?.id?.endsWith('-fortify-password'));
}

function done(state, id) {
  const r = state.missions?.[id];
  return r?.status === 'completed' ? r : null;
}

function filed(state, id) {
  const r = state.missions?.[id];
  return FILED.has(r?.status) ? r : null;
}

// The email address's breach check, or null (every other account's old
// -recon-breach re-checked the email and is ignored).
function emailBreach(state, accountId) {
  return EMAIL_ACCOUNT_IDS.has(accountId) ? done(state, `${accountId}-recon-breach`) : null;
}

// The new recon's answers for this account, merged.
function evidence(state, accountId) {
  const out = { pw: null, activity: null, service: null, changedSince: null, serviceHadPasswords: false, serviceName: null };
  for (const suffix of NEW_RECON_SUFFIXES) {
    const id = `${accountId}${suffix}`;
    const r = filed(state, id);
    if (!r) continue;
    if (r.pw_status) out.pw = r.pw_status;
    if (r.activity) out.activity = r.activity;
    if (r.service_breach) {
      const m = MISSIONS.find((x) => x.id === id);
      out.service = r.service_breach;
      out.changedSince = r.changed_since || null;
      out.serviceHadPasswords = Boolean(m?.serviceBreachHadPasswords);
      out.serviceName = m?.serviceBreachName || null;
    }
  }
  return out;
}

// The service's own breach included passwords, and the password hasn't
// been changed since (not sure counts as not changed).
function serviceBreachNeeds(ev) {
  return ev.service === 'in-service-breach' && ev.serviceHadPasswords && ev.changedSince !== 'yes';
}

// Flagged by the password manager: on the report's list, or the player's
// own reading of it on this account's recon.
export function isPmFlagged(state, accountId) {
  return (state.pmFlagged || []).includes(accountId) || PW_FLAGGED.has(evidence(state, accountId).pw);
}

// Why a reset is needed: any of 'breach' (the leak included the password, or
// not sure), 'pm' (the password manager flagged it), 'login' (someone else
// was in the account), 'activity' (the account shows something the player
// didn't do), 'service' (this service's own breach had passwords). Empty
// when it isn't needed.
export function resetNeedSources(state, accountId) {
  const out = [];
  const breach = emailBreach(state, accountId);
  const loginRec = done(state, `${accountId}-recon-login`);
  const ev = evidence(state, accountId);
  if (breach && BREACHED.has(breach.finding) && breach.password_exposed !== 'no') out.push('breach');
  if ((state.pmFlagged || []).includes(accountId) || PW_FLAGGED.has(ev.pw)) out.push('pm');
  if (loginRec && BREACHED.has(loginRec.finding)) out.push('login');
  if (ACTIVITY_BAD.has(ev.activity)) out.push('activity');
  if (serviceBreachNeeds(ev)) out.push('service');
  return out;
}

// 'needed' | 'not-needed' | 'unknown'
export function passwordResetNeed(state, accountId) {
  if (resetNeedSources(state, accountId).length) return 'needed';
  const breach = emailBreach(state, accountId);
  // A breach with no answer about the password (older saves) counts as exposed,
  // so only "no" reaches here.
  if (breach && (breach.finding === 'no-breaches' || BREACHED.has(breach.finding))) return 'not-needed';
  if (evidence(state, accountId).pw === 'pw-clean') return 'not-needed';
  return 'unknown';
}

// Why no reset is needed: only the things that are true.
export function notNeededReasons(state, accountId) {
  if (passwordResetNeed(state, accountId) !== 'not-needed') return [];
  const reasons = [];
  const breach = emailBreach(state, accountId);
  const ev = evidence(state, accountId);
  if (breach?.finding === 'no-breaches') reasons.push('Your breach check found no breaches.');
  else if (breach) reasons.push('The breaches you found didn’t include your password.');
  if (ev.pw === 'pw-clean' || done(state, PM_MISSION_ID)) reasons.push('Your password manager didn’t flag it.');
  if (ev.activity === 'activity-clean') reasons.push('Everything in its recent activity was yours.');
  if (ev.serviceHadPasswords && ev.service === 'not-in-service-breach') {
    reasons.push(`${ev.serviceName ? `“${ev.serviceName}”` : 'Its own breach'} isn’t in your breach results.`);
  }
  if (ev.serviceHadPasswords && ev.service === 'in-service-breach' && ev.changedSince === 'yes') {
    reasons.push('You’ve changed it since its own breach.');
  }
  if (done(state, `${accountId}-recon-login`)) reasons.push('Your login history looked clean.');
  return reasons;
}

// Something moved that the player didn't move, on a money account: who to
// call. null otherwise.
export function fraudContactLine(state, accountId) {
  if (!MONEY_ACCOUNTS.has(accountId)) return null;
  if (evidence(state, accountId).activity !== 'activity-confirmed') return null;
  if (accountId === 'primary_bank' || accountId === 'credit_card') return CARD_LINE;
  const name = ACCOUNTS[accountId]?.name || 'the company';
  return `Report it to ${name} from inside its app or its own website, not through a link or number from an email or text.`;
}

// Lines for the Password Reset briefing from the account's own recon: who to
// call when money moved, and the reuse warning when no manager can vouch for
// the password.
export function passwordReconNotes(state, accountId) {
  const notes = [];
  const call = fraudContactLine(state, accountId);
  if (call) notes.push(call);
  if (evidence(state, accountId).pw === 'pw-not-saved' && passwordResetNeed(state, accountId) !== 'needed') {
    notes.push('If you’ve used this password anywhere else, change it.');
  }
  return notes;
}

// A "no reset needed" answer stops being true once something new shows the
// password is compromised (a later password-manager flag, a login check).
export function reopenStaleNotNeeded(state) {
  let out = state;
  for (const m of MISSIONS) {
    if (!isPasswordMission(m)) continue;
    if (state.missions?.[m.id]?.status !== 'not-needed') continue;
    if (passwordResetNeed(state, m.accountId) !== 'needed') continue;
    // Reopened by the player's own new answer: remember why, so the
    // briefing can say it (ruling 2026-10-07).
    const { status, ...rest } = out.missions[m.id];
    out = { ...out, missions: { ...out.missions, [m.id]: { ...rest, reopened: resetNeedSources(state, m.accountId) } } };
  }
  return out;
}

// Scout on a reset that was "not needed" and is back on, by the first reason.
const REOPEN_LINES = {
  pm: 'Your password manager has flagged this password since you filed it as not needed. So the reset is back on.',
  activity: 'Your recon found activity on this account you didn’t recognize or didn’t do. So the reset is back on.',
  service: 'This service’s own breach included passwords, and you haven’t changed it since. So the reset is back on.',
  login: 'Your login check found someone else in this account. So the reset is back on.',
  breach: 'Your breach check found a leak that may include this password. So the reset is back on.',
};

export function reopenReasonLine(sources) {
  const first = (sources || []).find((x) => REOPEN_LINES[x]);
  return first ? REOPEN_LINES[first] : null;
}
