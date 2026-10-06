// Which feeling Scout shows at each moment (Task 16). Pure: screens pass the
// result to renderScout / scoutSprite. undefined means today's still sprite.
import { twoFactorMethod, STRONG_METHODS, CODE_METHODS, TWO_FA_METHODS } from './two-factor.js';

const HOUR = 3600 * 1000;
const LONG_AWAY_H = 24; // the same "been a while" as Scout's return lines
const WEEK_H = 24 * 7;

// arrival: { before } — when the player last saw the map before this visit
// (null: never). Unknown arrival (undefined): no feeling.
export function feelingForCity(state, arrival, now = Date.now(), { cityComplete = false } = {}) {
  if (cityComplete) return 'proud';
  if (!arrival) return undefined;
  if (!arrival.before) return 'wave';
  const hours = (now - new Date(arrival.before).getTime()) / HOUR;
  if (hours > WEEK_H) return ['wave', 'hug'];
  if (hours >= LONG_AWAY_H) return 'wave';
  return undefined;
}

const isTwoFactorMission = (mission) => mission.debriefQs.some((q) => q.kind === 'two-factor');

// A breach check asks how many breaches; the same answers on a login, device
// or sharing check mean someone else has been in.
function isBreachCheck(mission) {
  const finding = mission.debriefQs.find((q) => q.id === 'finding');
  const opt = finding?.options?.find((o) => o.value === '1-2-breaches');
  return Boolean(opt && /breach/i.test(opt.text));
}

export function feelingForDebrief(mission, record = {}) {
  if (record.status !== 'completed') return 'thinkingA';
  if (isTwoFactorMission(mission)) {
    const method = twoFactorMethod(record);
    if (STRONG_METHODS.includes(method)) return 'proud';
    if (CODE_METHODS.includes(method)) return 'thinkingB';
    return undefined;
  }
  const { finding, action } = record;
  if (finding === 'no-breaches') return 'happy';
  if (finding === '3plus-breaches') return 'worried';
  if (finding === '1-2-breaches') return isBreachCheck(mission) ? 'thinkingA' : 'worried';
  if (action === 'reset-password') return 'proud';
  return undefined;
}

// The first 2FA mission filed with a real second step earns a hug, once per
// save. Remembered as { mission, seen }.
export function noteFirstTwoFactor(state, mission, record) {
  if (state.scoutHugs?.twoFactor) return state;
  if (!isTwoFactorMission(mission) || record?.status !== 'completed') return state;
  if (!TWO_FA_METHODS.includes(twoFactorMethod(record))) return state;
  return { ...state, scoutHugs: { ...state.scoutHugs, twoFactor: { mission: mission.id, seen: false } } };
}

export function twoFactorHugDue(state, missionId) {
  const hug = state.scoutHugs?.twoFactor;
  return Boolean(hug && hug.mission === missionId && !hug.seen);
}

export function markTwoFactorHugSeen(state) {
  const hug = state.scoutHugs?.twoFactor;
  if (!hug || hug.seen) return state;
  return { ...state, scoutHugs: { ...state.scoutHugs, twoFactor: { ...hug, seen: true } } };
}

// The finale: sad to see you go, then a wave. Already off (silent): just a wave.
export function feelingForGhostDone(info) {
  return info?.silent ? 'wave' : ['sad', 'wave'];
}
