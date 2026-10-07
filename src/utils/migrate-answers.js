// Old saves: before v4.7.1 some debrief options were one broken string
// ("skip', text: 'I'll look later', severity: 'skip"), and that whole string
// was stored as the answer. Repair it to its clean id (the token before the
// first '). A repaired skip/later answer (or one whose option is marked
// severity 'skip') was never done: file it as skipped. Runs once per save.
import { MISSIONS } from '../data/missions.js';

const DEFERRED = new Set(['skip', 'later']);

function cleanId(v) {
  return typeof v === 'string' && v.includes("'") ? v.slice(0, v.indexOf("'")) : v;
}

function isSkipAnswer(mission, key, value) {
  if (DEFERRED.has(value)) return true;
  const q = mission?.debriefQs?.find((x) => x.id === key);
  return Boolean(q?.options?.some((o) => o.value === value && o.severity === 'skip'));
}

export function migrateBrokenAnswers(state) {
  if (!state?.missions || state.answersRepaired) return state;
  const missions = { ...state.missions };
  for (const [id, record] of Object.entries(missions)) {
    if (!record || typeof record !== 'object') continue;
    const mission = MISSIONS.find((m) => m.id === id);
    let next = null;
    let skipped = false;
    for (const [key, value] of Object.entries(record)) {
      const fixed = Array.isArray(value) ? value.map(cleanId) : cleanId(value);
      const changed = Array.isArray(value) ? fixed.some((v, i) => v !== value[i]) : fixed !== value;
      if (!changed) continue;
      next = next || { ...record };
      next[key] = fixed;
      if ([fixed].flat().some((v) => isSkipAnswer(mission, key, v))) skipped = true;
    }
    if (!next) continue;
    if (skipped && next.status === 'completed') {
      next.status = 'skipped';
      delete next.completedAt;
    }
    missions[id] = next;
  }
  return { ...state, missions, answersRepaired: 1 };
}
