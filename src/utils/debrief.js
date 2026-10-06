// Debrief questions: conditional follow-ups (showIf), questions whose options
// depend on the player (optionsFrom), multi-select answers, and what a set of
// answers records and tracks. Pure, so screens, app and restore share it.
import { MISSIONS, missionDistrict } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { twoFactorAction, twoFactorMethod } from './two-factor.js';
import { updateMission } from '../state.js';
import { isPasswordMission, passwordResetNeed, reopenStaleNotNeeded } from './password-need.js';
import { pmNumbers, applyBurst } from './pm-numbers.js';
import { isMissionDone } from './mission-status.js';

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

const answered = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '');

// Does a follow-up show for this answer to the question it depends on?
export function showIfMatches(showIf, answer) {
  if (showIf.values) return showIf.values.includes(answer);
  if (showIf.notValues) return answered(answer) && !showIf.notValues.includes(answer);
  return true;
}

// Questions shown for these answers, in order.
export function visibleQuestions(mission, answers = {}) {
  return mission.debriefQs.filter((q) => !q.showIf || showIfMatches(q.showIf, answers[q.showIf.question]));
}

// A number answer (or one of the question's options, like "skip"), or
// undefined if it isn't a whole number in range. maxFrom caps rather than rejects.
function numberAnswer(q, raw, answers) {
  if (q.options?.some((o) => o.value === raw)) return raw;
  const s = String(raw ?? '').trim();
  if (!/^\d+$/.test(s)) return undefined;
  let n = Number(s);
  if (n < (q.min ?? 0) || (q.max !== undefined && n > q.max)) return undefined;
  if (q.maxFrom) n = Math.min(n, Number(answers[q.maxFrom]) || 0);
  return n;
}

// What a debrief records: { status, record, pmFlagged? }, or null while a
// shown question is still unanswered.
export function debriefRecord(mission, answers) {
  const shown = visibleQuestions(mission, answers);
  if (shown.length === 0 || !shown.every((q) => answered(answers[q.id]))) return null;
  const a = {};
  for (const q of shown) {
    a[q.id] = q.type === 'number' ? numberAnswer(q, answers[q.id], answers) : answers[q.id];
    if (a[q.id] === undefined) return null;
  }
  const values = Object.values(a).flat();
  let status = values.some((v) => DEFERRED.has(v)) ? 'skipped' : 'completed';
  const record = { status, finding: a.finding, action: a.action };
  for (const key of ['password_exposed', 'method', 'method_setup']) if (a[key] !== undefined) record[key] = a[key];
  if (mission.debriefQs.some((q) => q.kind === 'two-factor')) record.action = twoFactorAction(a);
  const out = { status, record };
  if ('flagged_count' in a) {
    // The password manager's report. Its numbers stay in this browser.
    if (status === 'completed') {
      const ids = (a.flagged || []).filter((v) => v !== 'none');
      record.action = ids.length ? 'flagged' : 'none-flagged';
      record.flagged = a.flagged;
      record.flagged_count = a.flagged_count;
      record.throwaway_count = a.throwaway_count;
      out.pmFlagged = ids;
      out.pm = { pmFlaggedCount: a.flagged_count, pmThrowaway: Math.min(a.throwaway_count, a.flagged_count) };
    } else record.action = 'skip';
  }
  if ('changed' in a) {
    // A burst of "Change the next 3".
    const changed = a.changed === 'more' ? a.changed_more : Number(a.changed) || 0;
    const junk = a.junk === 'yes' ? a.junk_count : 0;
    if (status === 'completed' && changed + junk === 0) status = 'skipped';
    record.status = status;
    out.status = status;
    out.burst = { changed, junk };
    delete record.action;
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
  if (mission.stepsBuilder === 'pm-burst') return pmBurstSteps(mission, state);
  return mission.steps;
}

// "Change the next 3": open the report, then the order to work in. Accounts
// here that the manager flagged come first (they're among the email/money ones).
function pmBurstSteps(mission, state) {
  const report = mission.reportSteps[state?.passwordManager] || mission.reportSteps.other;
  const steps = report.filter((st) => !/^Note which of your accounts/.test(st.text));
  const inCity = (state?.pmFlagged || [])
    .filter((id) => ACCOUNTS[id] && !isMissionDone(state.missions?.[`${id}-fortify-password`]))
    .map((id) => ACCOUNTS[id].name);
  if (inCity.length) {
    steps.push({ text: `Start with the ones that are in the city too: ${inCity.join(', ')} — and file each one’s Password Reset mission as you go` });
  }
  steps.push({ text: 'Change the next 3, in this order: 1) email accounts, 2) bank, payment and money apps, 3) anything you use to sign in to other things (Apple, Google, Microsoft or Facebook logins), 4) shopping with saved cards, 5) social, 6) the rest' });
  steps.push({ text: 'Within your manager, do compromised or leaked passwords before reused ones, and reused before weak' });
  steps.push({ text: 'Test logins and joke passwords with nothing real behind them? Delete the entry (or close the account) instead of changing it' });
  return steps;
}

const ANSWER_KEYS = ['finding', 'action', 'password_exposed', 'method', 'method_setup', 'flagged', 'flagged_count', 'throwaway_count'];

// Filing a debrief: { state, event } — event is what to track as
// mission-completed ({ status }), or null when nothing should be sent — or
// null while the form is incomplete. Answers replace the previous ones.
export function fileDebrief(state, mission, answers, now = new Date().toISOString()) {
  const r = debriefRecord(mission, answers);
  if (!r) return null;
  if (r.burst) {
    const n = pmNumbers(state);
    if (!n) return null;
    if (r.status !== 'completed') {
      return { state: updateMission(state, mission.id, { status: 'skipped' }), event: { status: 'skipped' } };
    }
    const nums = applyBurst(n, r.burst.changed, r.burst.junk);
    let next = { ...state, ...nums, pmBurstAt: now };
    // The mission stays open for the next burst until every real one is changed.
    const allDone = pmNumbers(next).left === 0;
    // The last burst's answers, for the filed debrief (local; never tracked —
    // missionEventData doesn't read them).
    const last = { changed: String(r.burst.changed), junk: r.burst.junk > 0 ? 'yes' : 'no', junk_count: r.burst.junk > 0 ? r.burst.junk : undefined };
    next = updateMission(next, mission.id, { status: allDone ? 'completed' : undefined, lastBurstAt: now, ...last });
    // One event for the whole job, when it's done — not one per burst — so the
    // count of actions matches what restore would resend.
    return { state: next, event: allDone ? { status: 'completed' } : null };
  }
  const update = Object.fromEntries(ANSWER_KEYS.map((k) => [k, undefined]));
  let next = updateMission(state, mission.id, { ...update, ...r.record });
  if (r.pmFlagged) next = { ...next, pmFlagged: r.pmFlagged };
  if (r.pm) next = { ...next, ...r.pm, pmChanged: Math.min(next.pmChanged || 0, r.pm.pmFlaggedCount - r.pm.pmThrowaway) };
  return { state: reopenStaleNotNeeded(next), event: { status: r.record.status } };
}

export function applyDebrief(state, mission, answers) {
  return fileDebrief(state, mission, answers)?.state ?? null;
}

// "GOT IT" on a password reset the player's recon showed isn't needed.
export function recordNotNeeded(state, missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!isPasswordMission(mission) || passwordResetNeed(state, mission.accountId) !== 'not-needed') return state;
  return updateMission(state, missionId, { status: 'not-needed', action: undefined });
}
