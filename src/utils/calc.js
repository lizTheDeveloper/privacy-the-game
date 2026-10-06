import { MISSIONS, getMissionsForAccount, getMissionsForDistrict } from '../data/missions.js';
import { isMissionDone, isMissionInPlay } from './mission-status.js';

export { isMissionDone };

const OPTIONAL_WEIGHT = 0.5;

export function isCoreMission(mission) {
  return mission.phase !== 'survey' && !mission.optional;
}

function weightedScore(missions, isDone) {
  let total = 0;
  let done = 0;
  for (const m of missions) {
    const weight = m.optional && !m.countsWhenDone ? OPTIONAL_WEIGHT : 1;
    total += weight;
    if (isDone(m)) done += weight;
  }
  return { total, done };
}

// Bonus missions that unlock later (optional + mission.unlock) count toward
// integrity and exposure only once done, so unlocking one never lowers a
// score. A core mission that unlocks (the password-manager report) counts
// like any core mission once it is in play.
function scoredMissions(state) {
  return MISSIONS.filter((m) => m.phase !== 'survey' && isMissionInPlay(state, m)
    && (!(m.unlock && m.optional) || isMissionDone(state.missions[m.id])));
}

export function calcIntegrity(state) {
  const relevant = scoredMissions(state);
  if (relevant.length === 0) return 0;
  const { total, done } = weightedScore(relevant, (m) => isMissionDone(state.missions[m.id]));
  if (done === 0) return 0;
  return Math.max(1, Math.round((done / total) * 100));
}

export function calcExposure(state) {
  const relevant = scoredMissions(state);
  const { total, done } = weightedScore(relevant, (m) => isMissionDone(state.missions[m.id]));
  const perPoint = total > 0 ? 1000 / total : 0;
  return Math.max(0, Math.round(1000 - done * perPoint));
}

export function calcDistrictProgress(state, districtId) {
  const inDistrict = getMissionsForDistrict(districtId).filter((m) => isMissionInPlay(state, m));
  const isDone = (m) => isMissionDone(state.missions[m.id]);
  // A bonus that counts like core once done (countsWhenDone) never lowers %.
  const countsAsCore = (m) => isCoreMission(m) || (m.countsWhenDone && isDone(m));
  const relevant = inDistrict.filter(countsAsCore);
  const bonus = inDistrict.filter((m) => m.phase !== 'survey' && m.optional && !countsAsCore(m));
  const completed = relevant.filter(isDone).length;
  const bonusCompleted = bonus.filter(isDone).length;
  return {
    total: relevant.length,
    completed,
    percent: relevant.length ? Math.round((completed / relevant.length) * 100) : 0,
    bonusTotal: bonus.length,
    bonusCompleted,
  };
}

export function calcFindings(state) {
  const missions = Object.values(state.missions).filter((m) => m.status === 'completed');
  return {
    breachesFound: missions.filter((m) => m.finding && m.finding !== 'no-breaches').length,
    passwordsReset: missions.filter((m) => m.action === 'reset-password').length,
    twoFactorEnabled: missions.filter((m) => m.action === 'enabled-2fa').length,
    optOutsFiled: missions.filter((m) => m.action === 'filed-optout').length,
  };
}

export function getAccountPhaseGate(state, districtId, accountId, prereqPhase) {
  const prereqMissions = getMissionsForDistrict(districtId).filter(
    (m) => m.phase === prereqPhase && m.accountId === accountId && !m.optional,
  );
  const remaining = prereqMissions.filter((m) => !isMissionDone(state.missions[m.id])).length;
  return { total: prereqMissions.length, remaining, unlocked: remaining === 0 };
}

export function getBuildingState(state, accountId) {
  const missions = getMissionsForAccount(accountId).filter(isCoreMission);
  if (missions.length === 0) return 'occupied';
  const completed = missions.filter((m) => isMissionDone(state.missions[m.id]));
  if (completed.length === 0) return 'occupied';
  if (completed.length < missions.length) return 'in-progress';
  const hadBreach = completed.some((m) => {
    const s = state.missions[m.id];
    return s?.finding && s.finding !== 'no-breaches';
  });
  return hadBreach ? 'liberated-scarred' : 'liberated';
}
