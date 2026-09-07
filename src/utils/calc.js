import { MISSIONS, getMissionsForAccount } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';

export function calcIntegrity(state) {
  const enabled = Object.entries(state.accounts).filter(([, a]) => a.enabled).map(([id]) => id);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey');
  if (relevant.length === 0) return 0;
  const completed = relevant.filter((m) => state.missions[m.id]?.status === 'completed').length;
  return Math.round((completed / relevant.length) * 100);
}

export function calcExposure(state) {
  const enabled = Object.entries(state.accounts).filter(([, a]) => a.enabled).map(([id]) => id);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey');
  const completed = relevant.filter((m) => state.missions[m.id]?.status === 'completed').length;
  const perMission = relevant.length > 0 ? 1000 / relevant.length : 0;
  return Math.max(0, Math.round(1000 - completed * perMission));
}

export function calcDistrictProgress(state, districtId) {
  const acctIds = Object.entries(ACCOUNTS).filter(([, a]) => a.district === districtId).map(([id]) => id);
  const enabled = acctIds.filter((id) => state.accounts[id]?.enabled);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey');
  const completed = relevant.filter((m) => state.missions[m.id]?.status === 'completed').length;
  return { total: relevant.length, completed, percent: relevant.length ? Math.round((completed / relevant.length) * 100) : 0 };
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

export function getBuildingState(state, accountId) {
  const missions = getMissionsForAccount(accountId).filter((m) => m.phase !== 'survey');
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
