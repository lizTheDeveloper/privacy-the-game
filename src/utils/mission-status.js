// What counts as done, and which missions are in play for this player.
import { ACCOUNTS } from '../data/accounts.js';
import { twoFactorMethod } from './two-factor.js';
import { pmNumbers } from './pm-numbers.js';

// 'not-needed' is a password reset the player's own recon showed wasn't
// needed. It counts as done for progress, never as a security action.
export const DONE_STATUSES = new Set(['completed', 'not-needed']);

export function isMissionDone(record) {
  return DONE_STATUSES.has(record?.status);
}

// Done for progress: the mission itself, or the old mission it replaces
// (recon Phase 2), so a save that filed the old breach check keeps its
// district %, gates and buildings.
export function isMissionDoneIn(state, mission) {
  return isMissionDone(state?.missions?.[mission.id])
    || Boolean(mission.replaces && isMissionDone(state?.missions?.[mission.replaces]));
}

// Saves made from this moment on get the password check as a core Master Keys mission.
export const PASSWORD_CHECK_FOR_ALL_SINCE = '2026-11-17T12:00:00.000Z';

// Missions that only appear once something is true (mission.unlock).
export function isMissionAvailable(state, mission) {
  const u = mission.unlock;
  if (!u) return true;
  if (u.type === 'password-check') {
    if (isMissionDone(state.missions?.[mission.id])) return true;
    if (Boolean(state.passwordManager) && state.passwordManager !== 'none') return true;
    // Everyone's since the password check replaced the Pwned Passwords step (Liz 2026-11-17).
    // An older save keeps the rule it was finished under: only with a password manager.
    return !state.createdAt || state.createdAt >= PASSWORD_CHECK_FOR_ALL_SINCE;
  }
  if (u.type === 'password-manager') {
    // A finished report keeps counting if the answer later changes to "none".
    if (isMissionDone(state.missions?.[mission.id])) return true;
    return Boolean(state.passwordManager) && state.passwordManager !== 'none';
  }
  if (u.type === 'pm-burst') {
    if (isMissionDone(state.missions?.[mission.id])) return true;
    const hasManager = Boolean(state.passwordManager) && state.passwordManager !== 'none';
    return hasManager && (pmNumbers(state)?.left || 0) > 0;
  }
  const rec = state.missions?.[u.mission];
  if (rec?.status !== 'completed') return false;
  const method = twoFactorMethod(rec);
  if (u.type === '2fa-method') return u.methods.includes(method);
  // A save from before the method question (method unknown) had 2FA on.
  if (u.type === '2fa-done') return method !== 'none';
  return false;
}

// Enabled account (or a mission that belongs to no account) and unlocked.
// A legacy mission (replaced) is never in play: hidden from every list and
// never offered. Its record still loads, restores and counts through
// isMissionDoneIn on its replacement.
export function isMissionInPlay(state, mission) {
  if (mission.legacy) return false;
  // A mission for any of several accounts (the vehicle privacy report: any car).
  if (mission.inPlayIfAny) {
    return mission.inPlayIfAny.some((id) => state.accounts?.[id]?.enabled) && isMissionAvailable(state, mission);
  }
  const accountOn = ACCOUNTS[mission.accountId] ? Boolean(state.accounts?.[mission.accountId]?.enabled) : true;
  return accountOn && isMissionAvailable(state, mission);
}
