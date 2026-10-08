// Old saves: before v4.7.1 some debrief options were one broken string
// ("skip', text: 'I'll look later', severity: 'skip"), and that whole string
// was stored as the answer. Repair it to its clean id (the token before the
// first '). Runs once per save.
//
// Ruling (Phase 3 re-review 4): an already-filed record keeps its status.
// Demoting it to skipped could drop a finished city below 100% and send GO
// GHOST to the early-ghost deletion. Only the broken value is cleaned; new
// filings still file skips properly.

function cleanId(v) {
  return typeof v === 'string' && v.includes("'") ? v.slice(0, v.indexOf("'")) : v;
}

export function migrateBrokenAnswers(state) {
  if (!state?.missions || state.answersRepaired) return state;
  const missions = { ...state.missions };
  for (const [id, record] of Object.entries(missions)) {
    if (!record || typeof record !== 'object') continue;
    let next = null;
    for (const [key, value] of Object.entries(record)) {
      const fixed = Array.isArray(value) ? value.map(cleanId) : cleanId(value);
      const changed = Array.isArray(value) ? fixed.some((v, i) => v !== value[i]) : fixed !== value;
      if (!changed) continue;
      next = next || { ...record };
      next[key] = fixed;
    }
    if (!next) continue;
    missions[id] = next;
  }
  return { ...state, missions, answersRepaired: 1 };
}
