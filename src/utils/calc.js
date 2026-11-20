import { MISSIONS, getMissionsForAccount, getMissionsForDistrict } from '../data/missions.js';
import { isMissionDone, isMissionDoneIn, isMissionInPlay } from './mission-status.js';
import { DISTRICTS } from '../data/districts.js';

export { isMissionDone };

const OPTIONAL_WEIGHT = 0.5;

export function isCoreMission(mission) {
  return mission.phase !== 'survey' && !mission.optional;
}

// A bonus weighs half. One that counts like core once done (countsWhenDone)
// weighs half until it's done, then 1 (re-review 5).
export function missionWeight(m, done) {
  if (!m.optional) return 1;
  return m.countsWhenDone && done ? 1 : OPTIONAL_WEIGHT;
}

function weightedScore(missions, isDone) {
  let total = 0;
  let done = 0;
  for (const m of missions) {
    const d = isDone(m);
    const weight = missionWeight(m, d);
    total += weight;
    if (d) done += weight;
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

// The missions a district's progress counts: in play (not legacy, not for an
// account the player doesn't have) and core, or a bonus that counts like core
// once done (countsWhenDone), so it never lowers %.
function countedMissions(state, inDistrict) {
  return inDistrict.filter((m) => isCoreMission(m) || (m.countsWhenDone && isMissionDoneIn(state, m)));
}

export function calcDistrictProgress(state, districtId) {
  const inDistrict = getMissionsForDistrict(districtId).filter((m) => isMissionInPlay(state, m));
  const isDone = (m) => isMissionDoneIn(state, m);
  const countsAsCore = (m) => isCoreMission(m) || (m.countsWhenDone && isDone(m));
  const relevant = countedMissions(state, inDistrict);
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

// A district in parts (Liz 2026-11-18: "yes, make the district bar count the current chapter
// only"). The Master Keys has 27 or so missions, so after the first one its bar was a sliver.
// "Chapter" already means a whole district here (The Master Keys is Chapter 1), so these are
// parts: the district's missions in the order the game hands them out (check, then lock, then
// take back), each kind cut into even parts of up to PART_MAX. The same missions as
// calcDistrictProgress, so the counts agree. Nothing here is tracked or sent.
const PART_PHASES = ['recon', 'fortify', 'reclaim'];
export const PART_MAX = 8;
export const PART_NAMES = { recon: 'Check your accounts', fortify: 'Lock them up', reclaim: 'Take your data back' };

export function districtParts(state, districtId) {
  const relevant = countedMissions(state, getMissionsForDistrict(districtId).filter((m) => isMissionInPlay(state, m)));
  const phases = [...PART_PHASES, ...new Set(relevant.map((m) => m.phase).filter((p) => !PART_PHASES.includes(p)))];
  const parts = [];
  for (const phase of phases) {
    const list = relevant.filter((m) => m.phase === phase);
    if (!list.length) continue;
    const count = Math.ceil(list.length / PART_MAX);
    const base = Math.floor(list.length / count);
    let at = 0;
    for (let i = 0; i < count; i += 1) {
      const size = base + (i < list.length % count ? 1 : 0);
      parts.push({ phase, name: PART_NAMES[phase] || 'More missions', missions: list.slice(at, at + size) });
      at += size;
    }
  }
  return foldLoneParts(parts).map((part, i) => ({ ...part, chapter: i + 1 }));
}

// A part with only one mission folds into the part before it, or the first part into the one
// after (Liz 2026-11-19: "a part with only one mission should fold"): one tap filling a whole
// bar feels hollow, and it makes "OF N" bigger for nothing. The missions keep their order. The
// merged part takes the name (and phase) of the part that brings more missions, the earlier one
// on a tie, so it still reads as one plain thing to do. It may run past PART_MAX. A district
// with one mission in all keeps its one part.
export function foldLoneParts(parts) {
  const merge = (a, b) => {
    const named = b.missions.length > a.missions.length ? b : a;
    return { phase: named.phase, name: named.name, missions: [...a.missions, ...b.missions] };
  };
  const out = [];
  for (const part of parts) {
    if (part.missions.length === 1 && out.length) out[out.length - 1] = merge(out[out.length - 1], part);
    else out.push(part);
  }
  if (out.length > 1 && out[0].missions.length === 1) out.splice(0, 2, merge(out[0], out[1]));
  return out;
}

// The part the What's next bar shows: the earliest one with missions left, or
// (missionId, the report just filed) the part that mission is in, so the bar
// moves for it and shows full when it finished the part.
// { chapter, of, name, label, completed, total, done, next } or null.
export function calcChapterProgress(state, districtId, { missionId = null } = {}) {
  const parts = districtParts(state, districtId);
  if (!parts.length) return null;
  const left = (part) => part.missions.some((m) => !isMissionDoneIn(state, m));
  const pinned = missionId ? parts.findIndex((part) => part.missions.some((m) => m.id === missionId)) : -1;
  const firstLeft = parts.findIndex(left);
  const part = parts[pinned > -1 ? pinned : firstLeft > -1 ? firstLeft : parts.length - 1];
  const completed = part.missions.filter((m) => isMissionDoneIn(state, m)).length;
  const total = part.missions.length;
  const done = completed >= total;
  const next = done ? parts.find((p) => p !== part && left(p)) || null : null;
  const district = DISTRICTS.find((d) => d.id === districtId);
  return {
    chapter: part.chapter,
    of: parts.length,
    name: part.name,
    label: `PART ${part.chapter} OF ${parts.length}${district ? ` · ${district.name.toUpperCase()}` : ''}`,
    completed,
    total,
    done,
    next: next && { chapter: next.chapter, name: next.name },
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
// method question, or a two-factor / two-step / registration lock question.
// The IRS IP PIN shares the enabled-2fa value but isn't 2FA.
// Ruling (re-review 5): Signal's registration lock is a re-registration PIN
// like WhatsApp's two-step PIN, so it counts too.
export function isTwoFactorMission(mission) {
  return Boolean(mission?.debriefQs?.some((q) => q.kind === 'two-factor' || /two-factor|two-step|registration lock/i.test(q.label || '')));
}

// A filed opt-out: the mission is tagged `optOut: { questionId: [values] }` in
// the data, and the completed record answers one of those values. One per
// mission, however many brokers its form covered.
export function isOptOutFiled(mission, record) {
  if (!mission?.optOut || record?.status !== 'completed') return false;
  return Object.entries(mission.optOut).some(([q, vals]) => vals.includes(record[q]));
}

export function calcFindings(state) {
  const entries = Object.entries(state.missions);
  const missions = entries.map(([, m]) => m).filter((m) => m.status === 'completed');
  const byId = new Map(MISSIONS.map((m) => [m.id, m]));
  return {
    breachesFound: addressChecks(state).filter((c) => c.breached).length,
    passwordsReset: missions.filter((m) => m.action === 'reset-password').length,
    twoFactorEnabled: entries.filter(([id, m]) => m.status === 'completed' && m.action === 'enabled-2fa' && isTwoFactorMission(byId.get(id))).length,
    optOutsFiled: entries.filter(([id, m]) => isOptOutFiled(byId.get(id), m)).length,
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
