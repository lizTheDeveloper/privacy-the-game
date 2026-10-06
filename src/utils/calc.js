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
    const weight = m.optional ? OPTIONAL_WEIGHT : 1;
    total += weight;
    if (isDone(m)) done += weight;
  }
  return { total, done };
}

export function calcIntegrity(state) {
  const relevant = MISSIONS.filter((m) => m.phase !== 'survey' && isMissionInPlay(state, m));
  if (relevant.length === 0) return 0;
  const { total, done } = weightedScore(relevant, (m) => isMissionDone(state.missions[m.id]));
  if (done === 0) return 0;
  return Math.max(1, Math.round((done / total) * 100));
}

export function calcExposure(state) {
  const relevant = MISSIONS.filter((m) => m.phase !== 'survey' && isMissionInPlay(state, m));
  const { total, done } = weightedScore(relevant, (m) => isMissionDone(state.missions[m.id]));
  const perPoint = total > 0 ? 1000 / total : 0;
  return Math.max(0, Math.round(1000 - done * perPoint));
}

export function calcDistrictProgress(state, districtId) {
  const inDistrict = getMissionsForDistrict(districtId).filter((m) => isMissionInPlay(state, m));
  const relevant = inDistrict.filter(isCoreMission);
  const bonus = inDistrict.filter((m) => m.phase !== 'survey' && m.optional);
  const isDone = (m) => isMissionDone(state.missions[m.id]);
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
