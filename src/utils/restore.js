// Bringing deleted data back: the browser still holds the whole save, so a
// player whose data was deleted can send it again. Pure parts only.
import { MISSIONS } from '../data/missions.js';
import { missionEventData } from './debrief.js';
import { DISTRICTS } from '../data/districts.js';
import { calcDistrictProgress } from './calc.js';
import { notYetRun } from './ghost.js';

const RESENT = new Set(['completed', 'skipped', 'not-needed']);
const ANSWER_KEYS = ['finding', 'password_exposed', 'method', 'same_address'];

// Never resend an answer that isn't a clean id (an old save's broken string).
function cleanAnswers(data) {
  const out = { ...data };
  for (const k of ANSWER_KEYS) if (out[k] !== undefined && !/^[a-z0-9-]+$/.test(String(out[k]))) delete out[k];
  return out;
}

// The events the game would have sent, with the same keys, marked restored.
export function restoreEvents(state) {
  const out = [];
  // Oldest filing first (no completedAt, e.g. skipped: first), so the
  // collective job's "latest filing wins" matches the save (ruling 2026-10-08).
  const byTime = Object.entries(state?.missions || {})
    .sort(([, a], [, b]) => String(a?.completedAt || '').localeCompare(String(b?.completedAt || '')));
  for (const [id, m] of byTime) {
    if (!RESENT.has(m?.status)) continue;
    const mission = MISSIONS.find((x) => x.id === id);
    if (!mission) continue;
    out.push({ name: 'mission-completed', data: { ...cleanAnswers(missionEventData(mission, m)), restored: '1' } });
  }
  for (const d of DISTRICTS) {
    const p = calcDistrictProgress(state, d.id);
    if (p.total > 0 && p.percent === 100) out.push({ name: 'district-completed', data: { district: d.id, restored: '1' } });
  }
  return out;
}

function deletions({ ghostInfo, optedOutAt }) {
  const list = [];
  if (optedOutAt) list.push({ kind: 'opted-out', at: optedOutAt });
  if (ghostInfo?.early) list.push({ kind: 'ghost-early', at: ghostInfo.at });
  return list;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Deletions tonight's run has already carried out ('opted-out' | 'ghost-early').
// When the same nightly run removed both, the job counted one opt-out and no
// early ghost, so only 'opted-out' is given back. We can't see the previous
// run, so "same run" means both moments fall in the 24 hours before asOf.
// Removed on different nights, both counters went up and both come back.
export function deletedKinds({ ghostInfo = null, optedOutAt = null, collective = null } = {}) {
  const done = deletions({ ghostInfo, optedOutAt }).filter((d) => !notYetRun(d.at, collective));
  if (done.length === 2) {
    const asOf = Date.parse(collective.asOf);
    const sameRun = done.every((d) => {
      const t = Date.parse(d.at);
      return t <= asOf && t > asOf - DAY_MS;
    });
    if (sameRun) return ['opted-out'];
  }
  return done.map((d) => d.kind);
}

// 'pending' wins: something can still be cancelled before tonight's run.
export function deletionStatus({ ghostInfo = null, optedOutAt = null, collective = null } = {}) {
  const list = deletions({ ghostInfo, optedOutAt });
  if (list.length === 0) return 'none';
  if (list.some((d) => notYetRun(d.at, collective))) return 'pending';
  return 'deleted';
}
