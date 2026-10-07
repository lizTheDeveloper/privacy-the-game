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

// Accounts whose breach check is an email address (HIBP looks addresses up).
export const EMAIL_ACCOUNT_IDS = new Set(['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'google', 'apple_id', 'microsoft']);
const BREACH_FINDINGS = new Set(['1-2-breaches', '3plus-breaches']);

export function isEmailBreachCheck(missionId) {
  return typeof missionId === 'string' && missionId.endsWith('-recon-breach')
    && EMAIL_ACCOUNT_IDS.has(missionId.slice(0, -'-recon-breach'.length));
}

// A breach found: a breach check that found one. Login, device, car, AI and
// smart-home answers reuse "finding" with other meanings, so they never count.
export function isBreachFound(missionId, record) {
  return typeof missionId === 'string' && missionId.endsWith('-recon-breach')
    && record?.status === 'completed' && BREACH_FINDINGS.has(record.finding);
}

export function calcFindings(state) {
  const entries = Object.entries(state.missions);
  const missions = entries.map(([, m]) => m).filter((m) => m.status === 'completed');
  return {
    breachesFound: entries.filter(([id, m]) => isBreachFound(id, m)).length,
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
  const hadBreach = completed.some((m) => isBreachFound(m.id, state.missions[m.id]));
  return hadBreach ? 'liberated-scarred' : 'liberated';
}
