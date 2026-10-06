// The password manager's numbers (local only, never tracked).
const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

// The manager's numbers, capped so they always add up; null without a count.
export function pmNumbers(state) {
  if (!Number.isFinite(state?.pmFlaggedCount)) return null;
  const flagged = num(state.pmFlaggedCount);
  const throwaway = Math.min(num(state.pmThrowaway), flagged);
  const real = flagged - throwaway;
  const changed = Math.min(num(state.pmChanged), real);
  return { flagged, throwaway, real, changed, left: real - changed };
}

// Burst outcome: new manager numbers after "changed N, deleted M junk".
export function applyBurst(numbers, changedN, junkN) {
  const throwaway = Math.min(numbers.throwaway + num(junkN), numbers.flagged - numbers.changed);
  const real = numbers.flagged - throwaway;
  const changed = Math.min(numbers.changed + num(changedN), real);
  return { pmThrowaway: throwaway, pmChanged: changed };
}

