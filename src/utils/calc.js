import { MISSIONS, getMissionsForAccount, getMissionsForDistrict } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';

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
  const enabled = Object.entries(state.accounts).filter(([, a]) => a.enabled).map(([id]) => id);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey');
  if (relevant.length === 0) return 0;
  const { total, done } = weightedScore(relevant, (m) => state.missions[m.id]?.status === 'completed');
  if (done === 0) return 0;
  return Math.max(1, Math.round((done / total) * 100));
}

export function calcExposure(state) {
  const enabled = Object.entries(state.accounts).filter(([, a]) => a.enabled).map(([id]) => id);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey');
  const { total, done } = weightedScore(relevant, (m) => state.missions[m.id]?.status === 'completed');
  const perPoint = total > 0 ? 1000 / total : 0;
  return Math.max(0, Math.round(1000 - done * perPoint));
}

export function calcDistrictProgress(state, districtId) {
  const acctIds = Object.entries(ACCOUNTS).filter(([, a]) => a.district === districtId).map(([id]) => id);
  const enabled = acctIds.filter((id) => state.accounts[id]?.enabled);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && isCoreMission(m));
  const bonus = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey' && m.optional);
  const isDone = (m) => state.missions[m.id]?.status === 'completed';
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
  const remaining = prereqMissions.filter((m) => state.missions[m.id]?.status !== 'completed').length;
  return { total: prereqMissions.length, remaining, unlocked: remaining === 0 };
}

export function getBuildingState(state, accountId) {
  const missions = getMissionsForAccount(accountId).filter(isCoreMission);
  if (missions.length === 0) return 'occupied';
  const completed = missions.filter((m) => state.missions[m.id]?.status === 'completed');
  if (completed.length === 0) return 'occupied';
  if (completed.length < missions.length) return 'in-progress';
  const hadBreach = completed.some((m) => {
    const s = state.missions[m.id];
    return s?.finding && s.finding !== 'no-breaches';
  });
  return hadBreach ? 'liberated-scarred' : 'liberated';
}
