// Debrief questions: conditional follow-ups (showIf), questions whose options
// depend on the player (optionsFrom), multi-select answers, and what a set of
// answers records and tracks. Pure, so screens, app and restore share it.
import { MISSIONS, missionDistrict } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { twoFactorAction, twoFactorMethod } from './two-factor.js';

const DEFERRED = new Set(['skip', 'later']);

export function questionOptions(q, state) {
  if (q.optionsFrom === 'password-accounts') {
    const accounts = [];
    for (const m of MISSIONS) {
      if (!m.id.endsWith('-fortify-password')) continue;
      if (!state?.accounts?.[m.accountId]?.enabled || accounts.includes(m.accountId)) continue;
      accounts.push(m.accountId);
    }
    return [...accounts.map((id) => ({ value: id, text: ACCOUNTS[id]?.name || id })), ...q.options];
  }
  return q.options;
}

// Questions shown for these answers, in order. A follow-up shows only when
// the question it depends on has one of its values.
export function visibleQuestions(mission, answers = {}) {
  return mission.debriefQs.filter((q) => !q.showIf || q.showIf.values.includes(answers[q.showIf.question]));
}

const answered = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '');

// What a debrief records: { status, record, pmFlagged? }, or null while a
// shown question is still unanswered.
export function debriefRecord(mission, answers) {
  const shown = visibleQuestions(mission, answers);
  if (shown.length === 0 || !shown.every((q) => answered(answers[q.id]))) return null;
  const a = Object.fromEntries(shown.map((q) => [q.id, answers[q.id]]));
  const values = Object.values(a).flat();
  const status = values.some((v) => DEFERRED.has(v)) ? 'skipped' : 'completed';
  const record = { status, finding: a.finding, action: a.action };
  for (const key of ['password_exposed', 'method', 'method_setup']) if (a[key] !== undefined) record[key] = a[key];
  if (mission.debriefQs.some((q) => q.kind === 'two-factor')) record.action = twoFactorAction(a);
  const out = { status, record };
  if (Array.isArray(a.flagged)) {
    const ids = a.flagged.filter((v) => v !== 'none' && v !== 'skip');
    record.action = ids.length ? 'flagged' : 'none-flagged';
    if (status === 'completed') out.pmFlagged = ids;
    else record.action = 'skip';
  }
  for (const k of Object.keys(record)) if (record[k] === undefined) delete record[k];
  return out;
}

// The mission-completed event data, the same live and on restore.
export function missionEventData(mission, record) {
  const data = {
    mission: mission.id,
    district: missionDistrict(mission),
    finding: record.finding,
    phase: mission.phase,
    status: record.status,
    password_exposed: record.password_exposed,
    method: record.method ? twoFactorMethod(record) : undefined,
  };
  for (const k of Object.keys(data)) if (data[k] === undefined || data[k] === null) delete data[k];
  return data;
}

// A mission's steps for this player (the password-manager report is tailored).
export function missionSteps(mission, state) {
  if (mission.stepsByManager) return mission.stepsByManager[state?.passwordManager] || mission.steps;
  return mission.steps;
}
