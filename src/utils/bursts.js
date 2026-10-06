// Password resets in small bursts (Liz, 2026-10-06). Two sources of "how many
// passwords need changing":
//  - the password manager's own number (state.pmFlaggedCount, minus the
//    throwaways the player deleted, state.pmThrowaway) — when present, the
//    "Change the next 3" bonus mission is the burst, and the per-category
//    asks on each district (pm-categories.js) count toward the same total;
//  - otherwise the game's own accounts whose reset is needed
//    (passwordResetNeed === 'needed'), paced three at a time with
//    state.passwordBurst = { ids, startedAt }.
// Every number here stays in this browser: none of it is ever tracked.
import { MISSIONS, missionDistrict } from '../data/missions.js';
import { DISTRICTS } from '../data/districts.js';
import { isMissionDone } from './mission-status.js';
import { isPasswordMission, passwordResetNeed, resetNeedSources } from './password-need.js';
import { pmNumbers, BURST_SIZE, hasManager } from './pm-numbers.js';
import { openCategoryCount, usedCategories } from './pm-categories.js';

export { pmNumbers, applyBurst, BURST_SIZE } from './pm-numbers.js';
export const PM_BURST_ID = 'password_manager-fortify-burst';
const RETURN_AFTER_MS = 6 * 60 * 60 * 1000;
const plural = (n, one, many) => (n === 1 ? one : many);

const districtRank = (m) => DISTRICTS.findIndex((d) => d.id === missionDistrict(m));

// The game's password-reset missions whose reset is needed, in the order the
// districts show them (Master Keys first).
export function neededResets(state) {
  return MISSIONS
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => isPasswordMission(m) && state.accounts?.[m.accountId]?.enabled
      && passwordResetNeed(state, m.accountId) === 'needed')
    .sort((a, b) => districtRank(a.m) - districtRank(b.m) || a.i - b.i)
    .map(({ m }) => m);
}

// Counts for the game's own accounts. source 'pm' when the password manager
// is the only reason for every one of them.
export function resetCounts(state) {
  const list = neededResets(state);
  const done = list.filter((m) => isMissionDone(state.missions?.[m.id])).length;
  // Only credit the manager while the player still says they use one.
  const pmOnly = hasManager(state) && list.length > 0 && list.every((m) => {
    const src = resetNeedSources(state, m.accountId);
    return src.length === 1 && src[0] === 'pm';
  });
  return { total: list.length, done, left: list.length - done, source: pmOnly ? 'pm' : 'mixed' };
}

export function pmDoneLine(n) {
  if (n.real === 0) return "All junk — nothing real to change. Delete the throwaways and you're done.";
  return n.throwaway > 0
    ? `That's all ${n.real} that matter. The junk's gone, the real ones are changed.`
    : `That's all ${n.flagged}. Every password your manager flagged is changed.`;
}

// The lines shown wherever password progress is shown. [] when nothing to say.
export function passwordProgressLines(state) {
  const n = pmNumbers(state);
  const game = resetCounts(state);
  if (n && n.flagged > 0) {
    const lines = [n.throwaway > 0
      ? `${n.flagged} flagged, ${n.throwaway} ${plural(n.throwaway, 'throwaway', 'throwaways')} — ${n.real} that matter.`
      : `Your password manager flagged ${n.flagged} ${plural(n.flagged, 'password', 'passwords')}. ${n.left} to change.`];
    let progress = n.left === 0 ? pmDoneLine(n) : `${n.changed} of ${n.real} changed`;
    if (game.left > 0) progress += `, and ${game.left} ${plural(game.left, 'account here needs', 'accounts here need')} a new password`;
    lines.push(progress);
    if (n.left > 0 && usedCategories(state)) {
      lines.push(`${openCategoryCount(state)} of ${DISTRICTS.length} categories still open.`);
    }
    return lines;
  }
  if (game.total === 0) return [];
  if (game.left === 0) return [`All ${game.total} changed.`];
  const head = game.source === 'pm'
    ? `Your password manager flagged ${game.total} ${plural(game.total, 'password', 'passwords')}. ${game.left} to change.`
    : `${game.total} ${plural(game.total, 'password needs', 'passwords need')} changing. ${game.left} to change.`;
  return [head, `${game.done} of ${game.total} changed`];
}

// ── Game-account bursts (only when the manager gave no number) ──

const burstDone = (state, id) => {
  const m = MISSIONS.find((x) => x.id === id);
  return !m || isMissionDone(state.missions?.[id]) || passwordResetNeed(state, m.accountId) !== 'needed';
};

function nextThree(state) {
  return neededResets(state).filter((m) => !isMissionDone(state.missions?.[m.id])).slice(0, BURST_SIZE).map((m) => m.id);
}

export function usesGameBursts(state) {
  return !(pmNumbers(state)?.flagged > 0);
}

// Up to three needed-and-not-done reset ids in the current burst: the saved
// burst's open ones, or (no burst saved yet) the three it would start with.
// [] once the saved burst is finished — the next waits for the player.
export function currentBurst(state) {
  if (!usesGameBursts(state)) return [];
  const saved = state.passwordBurst;
  if (saved?.ids?.length) return saved.ids.filter((id) => !burstDone(state, id));
  return nextThree(state);
}

export function startBurst(state, now = new Date().toISOString()) {
  const ids = nextThree(state);
  if (!ids.length) return state;
  return { ...state, passwordBurst: { ids, startedAt: now } };
}

// Start a burst only when there is none (first time resets are needed).
export function ensureBurst(state, now) {
  if (!usesGameBursts(state) || state.passwordBurst?.ids?.length) return state;
  return startBurst(state, now);
}

// Scout on the game-account burst: { text, button? } or null.
export function burstScout(state) {
  if (!usesGameBursts(state)) return null;
  const counts = resetCounts(state);
  if (counts.total === 0) return null;
  if (counts.left === 0) return { text: `That's all ${counts.total}. Every password that needed changing is changed.` };
  const saved = state.passwordBurst?.ids?.length ? state.passwordBurst.ids : null;
  const ids = saved || nextThree(state);
  const open = ids.filter((id) => !burstDone(state, id));
  if (open.length === 0) {
    const k = Math.min(BURST_SIZE, counts.left);
    return {
      text: `That's a burst. ${counts.left} still to change — take a breather, or line up the next ${k}.`,
      button: `LINE UP THE NEXT ${k}`,
    };
  }
  if (open.length === ids.length) return { text: `${counts.left} to change. Let's do ${ids.length} now — one at a time, and I'll keep count.` };
  return { text: `${open.length} left in this burst.` };
}

// Needed resets outside the current burst are not pushed (still listed).
export function isHeldBack(state, mission) {
  if (!usesGameBursts(state) || !isPasswordMission(mission)) return false;
  if (isMissionDone(state.missions?.[mission.id])) return false;
  if (passwordResetNeed(state, mission.accountId) !== 'needed') return false;
  return !currentBurst(state).includes(mission.id);
}

// ── Manager bursts ──

export function pmBurstBriefingLine(state) {
  const n = pmNumbers(state);
  if (!n) return null;
  if (n.left === 0) return pmDoneLine(n);
  if (n.left >= 10) return `${n.left} is a lot. Nobody does that in one sitting. Three at a time, and the scary ones first.`;
  return `${n.left} to change. Let's do three now.`;
}

// City-map Scout when a burst was finished over 6 hours ago and more remain.
export function returnPacingLine(state, now = Date.now()) {
  const n = pmNumbers(state);
  if (!n || n.left === 0 || !state.pmBurstAt) return null;
  if (now - Date.parse(state.pmBurstAt) <= RETURN_AFTER_MS) return null;
  return `Welcome back. ${n.left} still to change — want to do the next three?`;
}
