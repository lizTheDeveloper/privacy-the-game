// Reading levels, device filtering and step-by-step progress for a mission.
//
// Liz (2026-11-13): most Americans read at literacy Level 2 or 3 and multi-step tasks lose a
// lot of people. Don't talk down to strong readers; make the steps easy to follow for
// everyone else. So:
// - Short is the default: a one-line plain lead, with the full intel one tap away under
//   "Why it matters". Full shows the intel as it always was. Simplest uses the ten hundred
//   most common words (plus phone words) where a mission has that version.
// - Steps that only apply to one kind of phone or device are shown only to players who have
//   it, once they've said which (asked at the first mission that needs it, then remembered).
// - Each step can be ticked off or skipped, and the ticks are saved, so a player who goes off
//   to their phone's Settings comes back to "Step 3 of 5".
// Everything here stays in this browser. None of it is ever sent to track().

import { missionSteps } from './debrief.js';
import { plainText } from './readability.js';

export const READ_LEVELS = ['short', 'full', 'simplest'];
export const READ_LEVEL_LABELS = { short: 'Short', full: 'Full intel', simplest: 'Simplest' };

export function readLevel(state) {
  const l = state?.reading?.level;
  return READ_LEVELS.includes(l) ? l : 'short';
}

// Has the player picked a level yet (Scout asks once)?
export function readLevelChosen(state) {
  return READ_LEVELS.includes(state?.reading?.level);
}

export function setReadLevel(state, level) {
  if (!READ_LEVELS.includes(level)) return state;
  return { ...state, reading: { ...state.reading, level } };
}

// --- The intel at each level -------------------------------------------------------------

// What the intel panel shows: `intel` up front, and `why` (the full intel) behind a tap.
// Full shows the briefing as it was. A mission without a lead (a player's own account) shows
// its whole briefing at every level: there is nothing shorter to show.
export function intelFor(mission, level) {
  const lead = level === 'simplest' ? (mission.simple?.lead || mission.lead) : mission.lead;
  if (level === 'full' || !lead) return { intel: mission.briefing, why: '' };
  return { intel: lead, why: mission.briefing };
}

export function hasSimplest(mission) {
  return Boolean(mission?.simple?.lead);
}

// --- Devices -----------------------------------------------------------------------------

// A step that starts "iPhone: …" or "Fitbit: …" is for players with that device. The groups
// are the questions the briefing can ask; only a mission with steps for two or more options
// of a group asks (one lone "Fitbit:" step is just shown).
export const GEAR_GROUPS = {
  phone: {
    question: 'Which phone do you use?',
    options: {
      iphone: { label: 'iPhone', match: /^(on (your |an )?)?(iphone|ios|ipad|apple health)\b/i },
      android: { label: 'Android', match: /^(on (your |an )?)?(android|samsung|pixel|google pixel)\b/i },
    },
  },
  tracker: {
    question: 'Which tracker do you wear?',
    options: {
      fitbit: { label: 'Fitbit', match: /^fitbit\b/i },
      apple_watch: { label: 'Apple Watch', match: /^apple watch\b/i },
      garmin: { label: 'Garmin', match: /^garmin\b/i },
      whoop: { label: 'Whoop', match: /^whoop\b/i },
      oura: { label: 'Oura', match: /^oura\b/i },
    },
  },
  carrier: {
    question: 'Who is your phone company?',
    options: {
      att: { label: 'AT&T', match: /^at&(amp;)?t\b/i },
      verizon: { label: 'Verizon', match: /^verizon\b/i },
      tmobile: { label: 'T-Mobile', match: /^t-mobile\b/i },
    },
  },
  computer: {
    question: 'Which computer do you use?',
    options: {
      mac: { label: 'Mac', match: /^(on (your |a )?)?mac(os)?\b/i },
      windows: { label: 'Windows', match: /^(on (your |a )?)?windows\b/i },
    },
  },
  camera: {
    question: 'Which camera do you have?',
    options: {
      ring: { label: 'Ring', match: /^ring\b/i },
      wyze: { label: 'Wyze', match: /^wyze\b/i },
      nest: { label: 'Nest', match: /^(google )?nest\b/i },
    },
  },
};

// The device a step is for, from its "Label:" opening; null for a step for everyone.
export function gearTag(step) {
  const t = plainText(step?.text || '');
  const head = t.match(/^([^:]{1,40}):\s/);
  if (!head) return null;
  for (const [group, g] of Object.entries(GEAR_GROUPS)) {
    for (const [option, o] of Object.entries(g.options)) {
      if (o.match.test(head[1])) return { group, option };
    }
  }
  return null;
}

// The device questions this list of steps needs: a group with steps for 2+ options.
export function gearQuestions(steps) {
  const seen = {};
  for (const st of steps) {
    const tag = gearTag(st);
    if (!tag) continue;
    (seen[tag.group] ||= new Set()).add(tag.option);
  }
  return Object.entries(seen)
    .filter(([, opts]) => opts.size >= 2)
    .map(([group, opts]) => ({ group, options: Object.keys(GEAR_GROUPS[group].options).filter((o) => opts.has(o)) }));
}

// 'all', an option id, or undefined (not asked yet: every step shows).
export function gearChoice(state, group) {
  return state?.gear?.[group];
}

export function setGear(state, group, value) {
  if (!GEAR_GROUPS[group]) return state;
  if (value !== 'all' && !GEAR_GROUPS[group].options[value]) return state;
  return { ...state, gear: { ...state.gear, [group]: value } };
}

// --- The steps ---------------------------------------------------------------------------

// A step's key: from its words, so a saved tick survives a step moving, and a step whose
// words change starts unticked (it may now ask for something else).
export function stepKey(step) {
  const t = plainText(step?.text || '');
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// The steps this player sees, in order: the Simplest ones where the mission has them, minus
// steps for devices the player said they don't have.
export function visibleSteps(mission, state, level = readLevel(state)) {
  const all = level === 'simplest' && mission.simple?.steps?.length ? mission.simple.steps : missionSteps(mission, state) || [];
  const asked = new Set(gearQuestions(all).map((q) => q.group));
  return all.filter((st) => {
    const tag = gearTag(st);
    if (!tag || !asked.has(tag.group)) return true;
    const choice = gearChoice(state, tag.group);
    return !choice || choice === 'all' || choice === tag.option;
  });
}

// --- Progress ----------------------------------------------------------------------------

export function stepMarks(state, missionId) {
  return state?.stepProgress?.[missionId]?.marks || {};
}

// mark: 'done', 'skipped', or null to clear.
export function markStep(state, missionId, key, mark, now = new Date().toISOString()) {
  const prev = state.stepProgress?.[missionId] || {};
  const marks = { ...prev.marks };
  if (mark === 'done' || mark === 'skipped') marks[key] = mark;
  else delete marks[key];
  return { ...state, stepProgress: { ...state.stepProgress, [missionId]: { ...prev, marks, at: now } } };
}

// Where the player is: how many steps are handled, and which one is next (-1 when all are).
export function progressFor(state, missionId, steps) {
  const marks = stepMarks(state, missionId);
  let done = 0;
  let skipped = 0;
  let current = -1;
  steps.forEach((st, i) => {
    const m = marks[stepKey(st)];
    if (m === 'done') done++;
    else if (m === 'skipped') skipped++;
    else if (current === -1) current = i;
  });
  return { done, skipped, total: steps.length, handled: done + skipped, current };
}

// The short line for a mission row or the city's "pick up where you left off".
export function progressLabel(p) {
  if (!p.total || !p.handled) return '';
  if (p.current === -1) return 'All steps done — file your report';
  return `Step ${p.current + 1} of ${p.total}`;
}

// The missions the player has ticked at least one step of and not filed, newest first.
export function missionsInProgress(state, isFiled) {
  return Object.entries(state?.stepProgress || {})
    .filter(([id, p]) => Object.keys(p.marks || {}).length && !isFiled(state.missions?.[id]))
    .sort((a, b) => String(b[1].at).localeCompare(String(a[1].at)))
    .map(([id]) => id);
}

// --- "I already have this" ---------------------------------------------------------------

// The answer a mission's report has for "it was already done", if any: the first question's
// option that says "already" and is safe.
export function alreadyOption(mission) {
  const q = mission?.debriefQs?.[0];
  const opt = q?.options?.find((o) => /\balready\b/i.test(plainText(o.text)) && o.severity === 'safe');
  return opt ? { question: q.id, value: opt.value } : null;
}

// Who can say "I already have this": any mission with an "already" answer, and any fortify
// or reclaim mission (a change the player may have made before the game; its report then
// asks what they have). Never a recon mission without one: a look has to be taken.
export function canSayAlready(mission) {
  if (!mission?.debriefQs?.length) return false;
  return Boolean(alreadyOption(mission)) || mission.phase === 'fortify' || mission.phase === 'reclaim';
}

export function markAlready(state, missionId, now = new Date().toISOString()) {
  const prev = state.stepProgress?.[missionId] || {};
  return { ...state, stepProgress: { ...state.stepProgress, [missionId]: { ...prev, already: true, at: now } } };
}

export function saidAlready(state, missionId) {
  return Boolean(state?.stepProgress?.[missionId]?.already);
}
