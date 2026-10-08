import { MISSIONS, getMissionsForAccount, getMissionsForDistrict } from '../data/missions.js';
import { isMissionDone, isMissionDoneIn, isMissionInPlay } from './mission-status.js';

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
    && (!(m.unlock && m.optional) || isMissionDoneIn(state, m)));
}

export function calcIntegrity(state) {
  const relevant = scoredMissions(state);
  if (relevant.length === 0) return 0;
  const { total, done } = weightedScore(relevant, (m) => isMissionDoneIn(state, m));
  if (done === 0) return 0;
  return Math.max(1, Math.round((done / total) * 100));
}

export function calcExposure(state) {
  const relevant = scoredMissions(state);
  const { total, done } = weightedScore(relevant, (m) => isMissionDoneIn(state, m));
  const perPoint = total > 0 ? 1000 / total : 0;
  return Math.max(0, Math.round(1000 - done * perPoint));
}

export function calcDistrictProgress(state, districtId) {
  const inDistrict = getMissionsForDistrict(districtId).filter((m) => isMissionInPlay(state, m));
  const isDone = (m) => isMissionDoneIn(state, m);
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

// Recon X4: the second account of each pair is usually the same address and
// the same account as the first. Its checks ask "same address?" first
// (same_address); "same" files without a finding, and its evidence is the
// partner's.
export const ADDRESS_PARTNER = { google: 'gmail', apple_id: 'icloud', microsoft: 'outlook' };

export function isSameAddress(record) {
  return typeof record?.same_address === 'string' && record.same_address.startsWith('same-as-');
}

export function isEmailBreachCheck(missionId) {
  return typeof missionId === 'string' && missionId.endsWith('-recon-breach')
    && EMAIL_ACCOUNT_IDS.has(missionId.slice(0, -'-recon-breach'.length));
}

// A breach found: an email address's breach check that found one (the same
// rule as build.sql's allowlist). Login, device, car, AI and smart-home
// answers reuse "finding" with other meanings, and an old "breach check" on a
// bank or service only re-checked the email address, so none of them count.
export function isBreachFound(missionId, record) {
  return isEmailBreachCheck(missionId)
    && record?.status === 'completed' && BREACH_FINDINGS.has(record.finding);
}

// The player's email addresses, counted the way build.sql counts them: one
// check per address. The two accounts of a pair (Gmail/Google, iCloud/Apple
// ID, Outlook/Microsoft) are one address, with the later answer, and either
// account's reset or 2FA fixes it, unless the second account says
// "different-address": then each is its own address, fixed only by its own.
// [{ acct, finding, breached, fixed }]
const CHECK_FINDINGS = new Set(['no-breaches', ...BREACH_FINDINGS]);

export function addressChecks(state) {
  const rec = (a) => state?.missions?.[`${a}-recon-breach`];
  const valid = (a) => (rec(a)?.status === 'completed' && CHECK_FINDINGS.has(rec(a).finding) ? rec(a) : null);
  const fixedBy = (accts) => accts.some((a) => ['-fortify-password', '-fortify-2fa']
    .some((sfx) => state?.missions?.[`${a}${sfx}`]?.status === 'completed'));
  const out = [];
  const push = (acct, r, accts) => out.push({ acct, finding: r.finding, breached: BREACH_FINDINGS.has(r.finding), fixed: fixedBy(accts) });
  for (const a of EMAIL_ACCOUNT_IDS) {
    if (ADDRESS_PARTNER[a]) continue; // counted with its partner below
    const second = Object.keys(ADDRESS_PARTNER).find((k) => ADDRESS_PARTNER[k] === a);
    const r1 = valid(a);
    const r2 = second ? valid(second) : null;
    if (!second || rec(second)?.same_address === 'different-address') {
      if (r1) push(a, r1, [a]);
      if (r2) push(second, r2, [second]);
      continue;
    }
    if (!r1 && !r2) continue;
    // The later answer, as build.sql; with no time to tell them apart (old
    // saves), the more severe one.
    const rank = { 'no-breaches': 0, '1-2-breaches': 1, '3plus-breaches': 2 };
    const t1 = r1?.completedAt || '';
    const t2 = r2?.completedAt || '';
    const latest = !r1 ? r2 : !r2 ? r1
      : t1 !== t2 ? (t2 > t1 ? r2 : r1)
        : (rank[r2.finding] > rank[r1.finding] ? r2 : r1);
    push(r1 ? a : second, latest, [a, second]);
  }
  return out;
}

// Email addresses found in a breach in this district, or null until an
// address was checked (completed with a breach answer; only The Master Keys
// has address checks). Counted like addressChecks.
export function districtBreachedAddresses(state, districtId) {
  const here = new Set(getMissionsForDistrict(districtId).filter((m) => isEmailBreachCheck(m.id)).map((m) => m.accountId));
  const checks = addressChecks(state).filter((c) => here.has(c.acct));
  if (checks.length === 0) return null;
  return checks.filter((c) => c.breached).length;
}

// A mission whose debrief asks about a second sign-in step (reviewer I4): the
// method question, or a two-factor / two-step question. An IRS IP PIN and
// Signal's registration lock share the enabled-2fa value but aren't 2FA.
export function isTwoFactorMission(mission) {
  return Boolean(mission?.debriefQs?.some((q) => q.kind === 'two-factor' || /two-factor|two-step/i.test(q.label || '')));
}

export function calcFindings(state) {
  const entries = Object.entries(state.missions);
  const missions = entries.map(([, m]) => m).filter((m) => m.status === 'completed');
  const byId = new Map(MISSIONS.map((m) => [m.id, m]));
  return {
    breachesFound: addressChecks(state).filter((c) => c.breached).length,
    passwordsReset: missions.filter((m) => m.action === 'reset-password').length,
    twoFactorEnabled: entries.filter(([id, m]) => m.status === 'completed' && m.action === 'enabled-2fa' && isTwoFactorMission(byId.get(id))).length,
    optOutsFiled: missions.filter((m) => m.action === 'filed-optout').length,
  };
}

export function getAccountPhaseGate(state, districtId, accountId, prereqPhase) {
  const prereqMissions = getMissionsForDistrict(districtId).filter(
    (m) => m.phase === prereqPhase && m.accountId === accountId && !m.optional && !m.legacy,
  );
  // A filed legacy recon satisfies its replacement, so nobody is re-locked.
  const remaining = prereqMissions.filter((m) => !isMissionDoneIn(state, m)).length;
  return { total: prereqMissions.length, remaining, unlocked: remaining === 0 };
}

export function getBuildingState(state, accountId) {
  const missions = getMissionsForAccount(accountId).filter((m) => isCoreMission(m) && !m.legacy);
  if (missions.length === 0) return 'occupied';
  const completed = missions.filter((m) => isMissionDoneIn(state, m));
  if (completed.length === 0) return 'occupied';
  if (completed.length < missions.length) return 'in-progress';
  const hadBreach = getMissionsForAccount(accountId).some((m) => isBreachFound(m.id, state.missions[m.id]));
  return hadBreach ? 'liberated-scarred' : 'liberated';
}
