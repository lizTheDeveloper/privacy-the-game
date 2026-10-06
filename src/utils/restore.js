// Bringing deleted data back: the browser still holds the whole save, so a
// player whose data was deleted can send it again. Pure parts only.
import { MISSIONS } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { DISTRICTS } from '../data/districts.js';
import { calcDistrictProgress } from './calc.js';
import { notYetRun } from './ghost.js';

const RESENT = new Set(['completed', 'skipped']);

// The events the game would have sent, with the same keys, marked restored.
export function restoreEvents(state) {
  const out = [];
  for (const [id, m] of Object.entries(state?.missions || {})) {
    if (!RESENT.has(m?.status)) continue;
    const mission = MISSIONS.find((x) => x.id === id);
    if (!mission) continue;
    const data = {
      mission: id,
      district: ACCOUNTS[mission.accountId]?.district,
      finding: m.finding,
      phase: mission.phase,
      status: m.status,
      restored: '1',
    };
    for (const k of Object.keys(data)) if (data[k] === undefined || data[k] === null) delete data[k];
    out.push({ name: 'mission-completed', data });
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
