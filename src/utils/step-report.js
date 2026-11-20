import { fileDebrief } from './debrief.js';
import { stepAnswers } from './reading.js';
import { checklistFor } from '../data/broker-checklists.js';

// The answers a player gave on the step cards, when they are the whole report (Liz 2026-11-18:
// "when the game is slowly asking you one question at a time, you're reporting back to Scout at
// that point already"). Then the last DONE files it, and the report screen isn't asked again.
// null: something on the report wasn't asked on a step (or it has a broker checklist, or it is
// already filed), so REPORT BACK opens the report as before.
export function stepReportAnswers(state, mission) {
  if (!mission?.debriefQs?.length || checklistFor(mission.id)) return null;
  if (state.missions?.[mission.id]?.status === 'completed') return null;
  // Only a real option of a one-answer question counts (a step card never asks numbers or pick-all).
  const options = new Map(mission.debriefQs.filter((q) => !q.multi && q.type !== 'number').map((q) => [q.id, new Set((q.options || []).map((o) => o.value))]));
  const answers = Object.fromEntries(Object.entries(stepAnswers(state, mission.id)).filter(([k, v]) => options.get(k)?.has(v)));
  if (!Object.keys(answers).length) return null;
  return fileDebrief(state, mission, answers) ? answers : null;
}
