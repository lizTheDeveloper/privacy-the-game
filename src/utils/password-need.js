// Password resets only when the password is compromised (Liz, 2026-10-06):
// a leak that included the password (or "not sure"), a password manager
// flag, or someone else in the account. Otherwise a reset is busywork.
import { MISSIONS } from '../data/missions.js';

const BREACHED = new Set(['1-2-breaches', '3plus-breaches']);
export const PM_MISSION_ID = 'password_manager-recon-report';

export function isPasswordMission(mission) {
  return Boolean(mission?.id?.endsWith('-fortify-password'));
}

function done(state, id) {
  const r = state.missions?.[id];
  return r?.status === 'completed' ? r : null;
}

// 'needed' | 'not-needed' | 'unknown'
export function passwordResetNeed(state, accountId) {
  const breach = done(state, `${accountId}-recon-breach`);
  const loginRec = done(state, `${accountId}-recon-login`);
  const flagged = (state.pmFlagged || []).includes(accountId);
  // A breach with no answer about the password (older saves) counts as exposed.
  if (breach && BREACHED.has(breach.finding) && breach.password_exposed !== 'no') return 'needed';
  if (flagged) return 'needed';
  if (loginRec && BREACHED.has(loginRec.finding)) return 'needed';
  if (breach && (breach.finding === 'no-breaches' || BREACHED.has(breach.finding))) return 'not-needed';
  return 'unknown';
}

// Why no reset is needed: only the things that are true.
export function notNeededReasons(state, accountId) {
  if (passwordResetNeed(state, accountId) !== 'not-needed') return [];
  const reasons = [];
  const breach = done(state, `${accountId}-recon-breach`);
  if (breach.finding === 'no-breaches') reasons.push('Your breach check found no breaches.');
  else reasons.push('The breaches you found didn’t include your password.');
  if (done(state, PM_MISSION_ID)) reasons.push('Your password manager didn’t flag it.');
  if (done(state, `${accountId}-recon-login`)) reasons.push('Your login history looked clean.');
  return reasons;
}

// A "no reset needed" answer stops being true once something new shows the
// password is compromised (a later password-manager flag, a login check).
export function reopenStaleNotNeeded(state) {
  let out = state;
  for (const m of MISSIONS) {
    if (!isPasswordMission(m)) continue;
    if (state.missions?.[m.id]?.status !== 'not-needed') continue;
    if (passwordResetNeed(state, m.accountId) !== 'needed') continue;
    const { status, ...rest } = out.missions[m.id];
    out = { ...out, missions: { ...out.missions, [m.id]: rest } };
  }
  return out;
}
