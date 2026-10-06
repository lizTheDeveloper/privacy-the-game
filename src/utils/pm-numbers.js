// The password manager's numbers (local only, never tracked).
const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

export const BURST_SIZE = 3;

// A manager the player said they use ("No" and unanswered don't count).
export function hasManager(state) {
  return Boolean(state?.passwordManager) && state.passwordManager !== 'none';
}

// Passwords changed through the per-category asks (state.pmByDistrict).
export function categoryChangedTotal(state) {
  let total = 0;
  for (const e of Object.values(state?.pmByDistrict || {})) total += Math.min(num(e?.changed), num(e?.flagged));
  return total;
}

// The manager's numbers, capped so they always add up; null without a count
// or once the player says they don't use a manager (the stored numbers stay).
// changed = bursts (pmChanged) + per-category changes, capped at real.
export function pmNumbers(state) {
  if (!Number.isFinite(state?.pmFlaggedCount) || !hasManager(state)) return null;
  const flagged = num(state.pmFlaggedCount);
  const throwaway = Math.min(num(state.pmThrowaway), flagged);
  const real = flagged - throwaway;
  const fromBursts = num(state.pmChanged);
  const fromCategories = categoryChangedTotal(state);
  const changed = Math.min(fromBursts + fromCategories, real);
  return { flagged, throwaway, real, changed, left: real - changed, fromBursts, fromCategories };
}

// Burst outcome: new manager numbers after "changed N, deleted M junk".
// pmChanged holds burst changes only; categories are added on top.
export function applyBurst(numbers, changedN, junkN) {
  const throwaway = Math.min(numbers.throwaway + num(junkN), numbers.flagged - numbers.changed);
  const real = numbers.flagged - throwaway;
  const fromBursts = numbers.fromBursts ?? numbers.changed;
  const changed = Math.min(fromBursts + num(changedN), real);
  return { pmThrowaway: throwaway, pmChanged: changed };
}
