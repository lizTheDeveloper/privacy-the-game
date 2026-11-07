// Building Interiors evaluator: save state + interior content -> checkup rows,
// entry seal states, counts and freshness. Pure; never fabricates state:
// anything unfiled or unreadable is 'not-checked'. Seals lean strict.
import { getInterior } from '../data/interiors/index.js';
import { MISSIONS } from '../data/missions.js';
import { EMAIL_ACCOUNT_IDS } from './calc.js';
import { isMissionDoneIn } from './mission-status.js';
import { twoFactorMethod, STRONG_METHODS } from './two-factor.js';
import { passwordResetNeed, passwordEvidence, emailBreachRecord, resetNeedDates } from './password-need.js';

const DAY = 864e5;
const SIM_NOTE = 'Sign-in codes no longer travel by text. A recovery phone number can still reopen this door: check under recovery options and remove it, or keep it only if the carrier account has a PIN.';
// A passkey seals the mail slot only while it's the way in; the password
// still works. An entry can override (Apple: security keys replace it).
const PHISH_NOTE = 'Sealed while you sign in with the passkey. Your password still works as a backup, so a page that asks for your password and a code is the tell.';
const REGLOCK_NOTE = 'Sealed while you use Signal at least once a week. After 7 days without use, the lock expires.';
const BREACHED = new Set(['1-2-breaches', '3plus-breaches']);

export function freshness(iso, now = new Date()) {
  if (!iso) return 'unknown';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'unknown';
  const days = (now.getTime() - t) / DAY;
  if (days <= 30) return 'fresh';
  if (days <= 90) return 'aging';
  return 'stale';
}

export function recordDate(record) {
  return record?.rechecked ?? record?.completedAt;
}

// The completed record for a mission id (or the old one it replaces), else null.
function doneRecord(state, id) {
  const mission = MISSIONS.find((m) => m.id === id) || { id };
  if (!isMissionDoneIn(state, mission)) return null;
  const own = state?.missions?.[id];
  if (own?.status === 'completed') return own;
  const old = mission.replaces ? state?.missions?.[mission.replaces] : null;
  return old?.status === 'completed' ? old : null;
}

const time = (iso) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
};

// A 2FA filing the player skipped because nothing protects the account yet
// ("Nothing yet", then "I'll come back"; or the old "later"). It is still a
// filing, and what it says is that the door is open.
function twoFactorLeftOpen(rec) {
  if (rec?.status !== 'skipped') return false;
  if (rec.method === 'none') return rec.method_setup === 'later';
  return !rec.method && rec.action === 'later';
}

export function currentTwoFactor(state, accountId) {
  // The base mission is filed again only after any upgrade (the upgrade needs
  // it filed with codes), so a skipped "nothing yet" on it is the newest word.
  const baseId = `${accountId}-fortify-2fa`;
  if (twoFactorLeftOpen(state?.missions?.[baseId])) return { method: 'none', missionId: baseId, date: undefined, skipped: true };
  const ids = [`${accountId}-fortify-2fa`, `${accountId}-fortify-2fa-upgrade`];
  let best = null;
  for (const id of ids) {
    const r = doneRecord(state, id);
    if (!r) continue;
    // Later date wins; a tie goes to the upgrade (listed last).
    if (!best || time(recordDate(r)) >= time(recordDate(best.r))) best = { id, r };
  }
  if (!best) return { method: null, missionId: null, date: undefined };
  const method = twoFactorMethod(best.r) ?? null;
  return { method, missionId: best.id, date: recordDate(best.r) };
}

const MISSION_IDS = new Set(MISSIONS.map((m) => m.id));
const hasMission = (id) => MISSION_IDS.has(id);

function devicesMissionId(accountId) {
  return accountId === 'signal' ? 'signal-recon-devices' : `${accountId}-recon-login`;
}

// A reset answers the need only when it came after every dated filing behind
// it. An undated reset doesn't seal (seals lean strict); an undated filing
// (an older save's skipped recon) can't be shown newer, so any dated reset
// answers it. Otherwise nothing could ever seal that door.
function resetAfterNeed(state, accountId, rec) {
  const at = Date.parse(recordDate(rec));
  if (Number.isNaN(at)) return false;
  const dates = resetNeedDates(state, accountId);
  return dates.length > 0 && dates.every((d) => {
    const t = Date.parse(d);
    return Number.isNaN(t) || t < at;
  });
}

function passwordSeal(state, accountId) {
  const id = `${accountId}-fortify-password`;
  const rec = doneRecord(state, id);
  const needed = passwordResetNeed(state, accountId) === 'needed';
  if (rec?.action === 'reset-password' && (!needed || resetAfterNeed(state, accountId, rec))) {
    return { sealed: true, missionId: id, date: recordDate(rec) };
  }
  if (needed) return { sealed: false };
  if (rec?.action === 'already-strong') return { sealed: true, missionId: id, date: recordDate(rec) };
  // The password manager's verdict, from the recon that recorded it.
  const ev = passwordEvidence(state, accountId);
  if (ev.pw === 'pw-clean') {
    return { sealed: true, missionId: ev.pwFrom, date: recordDate(state?.missions?.[ev.pwFrom]) };
  }
  return { sealed: false };
}

// Signal's registration lock: the completed record, or a skipped "I'll come
// back" (which says the lock is off). Other skips stay not-checked.
function reglockRecord(state, id) {
  const rec = doneRecord(state, id);
  if (rec) return rec;
  const own = state?.missions?.[id];
  return own?.status === 'skipped' && own.action === 'later' ? own : null;
}

export function entryState(state, accountId, entry) {
  const nc = { state: 'not-checked', missionId: null, date: undefined };
  switch (entry?.rule) {
    case 'beyond':
      return { state: 'beyond', missionId: null, date: undefined };
    case 'password-unique': {
      const seal = passwordSeal(state, accountId);
      if (seal.sealed) return { state: 'sealed', missionId: seal.missionId, date: seal.date };
      if (passwordResetNeed(state, accountId) === 'needed') {
        return { state: 'open', missionId: `${accountId}-fortify-password`, date: undefined };
      }
      return nc;
    }
    case 'sim-swap':
    case 'phishing': {
      const { method, missionId, date } = currentTwoFactor(state, accountId);
      if (!method) return nc;
      if (entry.rule === 'phishing') {
        if (method !== 'passkey') return { state: 'open', missionId, date };
        const note = Object.hasOwn(entry, 'sealedNote') ? entry.sealedNote : PHISH_NOTE;
        return note ? { state: 'sealed', missionId, date, note } : { state: 'sealed', missionId, date };
      }
      if (STRONG_METHODS.includes(method)) return { state: 'sealed', missionId, date, note: SIM_NOTE };
      if (['sms', 'email', 'none'].includes(method)) return { state: 'open', missionId, date };
      return nc;
    }
    case 'devices': {
      const id = devicesMissionId(accountId);
      const rec = doneRecord(state, id);
      if (!rec) return nc;
      const date = recordDate(rec);
      if (rec.finding === 'no-breaches') return { state: 'sealed', missionId: id, date };
      if (BREACHED.has(rec.finding)) return { state: 'open', missionId: id, date };
      return nc;
    }
    case 'reglock': {
      const id = 'signal-fortify-reglock';
      const rec = reglockRecord(state, id);
      if (!rec) return nc;
      const date = recordDate(rec);
      if (['enabled-2fa', 'already-enabled'].includes(rec.action)) return { state: 'sealed', missionId: id, date, note: REGLOCK_NOTE };
      if (rec.action === 'later') return { state: 'open', missionId: id, date };
      return nc;
    }
    default:
      return nc;
  }
}

export function checkupRows(state, accountId, now = new Date()) {
  const row = (id, status, label, missionId, date) => ({
    id, status, label, missionId: missionId ?? null, freshness: freshness(date, now),
  });
  const rows = [];

  // A row shows only when a mission for this account can fill it.
  const pwId = `${accountId}-fortify-password`;
  if (hasMission(pwId)) {
    const seal = passwordSeal(state, accountId);
    if (seal.sealed) rows.push(row('password', 'ok', 'Password is unique', seal.missionId ?? pwId, seal.date));
    else if (passwordResetNeed(state, accountId) === 'needed') rows.push(row('password', 'crit', 'Password needs a reset', pwId));
    else rows.push(row('password', 'not-checked', 'Password not checked', pwId));
  }

  if (EMAIL_ACCOUNT_IDS.has(accountId)) {
    const id = `${accountId}-recon-breach`;
    const rec = emailBreachRecord(state, accountId);
    const date = recordDate(rec);
    if (rec?.finding === 'no-breaches') rows.push(row('leak', 'ok', 'No known leaks', id, date));
    else if (rec && BREACHED.has(rec.finding)) {
      rows.push(row('leak', rec.password_exposed === 'no' ? 'warn' : 'crit', 'Address found in a leak', id, date));
    } else rows.push(row('leak', 'not-checked', 'Leaks not checked', id));
  }

  if (hasMission(`${accountId}-fortify-2fa`) || hasMission(`${accountId}-fortify-2fa-upgrade`)) {
    const tf = currentTwoFactor(state, accountId);
    const tfId = tf.missionId ?? `${accountId}-fortify-2fa`;
    if (!tf.method) rows.push(row('two-factor', 'not-checked', 'Two-step sign-in not checked', tfId));
    else if (STRONG_METHODS.includes(tf.method)) rows.push(row('two-factor', 'ok', 'Strong two-step sign-in', tfId, tf.date));
    else if (tf.method === 'none') rows.push(row('two-factor', 'crit', 'No two-step sign-in', tfId, tf.date));
    else rows.push(row('two-factor', 'warn', 'Two-step sign-in by code only', tfId, tf.date));
  }

  const lockId = `${accountId}-fortify-reglock`;
  if (hasMission(lockId)) {
    const rec = reglockRecord(state, lockId);
    if (rec && ['enabled-2fa', 'already-enabled'].includes(rec.action)) rows.push(row('reglock', 'ok', 'Registration lock is on', lockId, recordDate(rec)));
    else if (rec?.action === 'later') rows.push(row('reglock', 'crit', 'Registration lock is off', lockId, recordDate(rec)));
    else rows.push(row('reglock', 'not-checked', 'Registration lock not checked', lockId));
  }

  const dId = devicesMissionId(accountId);
  if (!hasMission(dId)) return rows;
  const dRec = doneRecord(state, dId);
  const dDate = recordDate(dRec);
  if (dRec?.finding === 'no-breaches') rows.push(row('devices', 'ok', 'Sign-ins look like yours', dId, dDate));
  else if (dRec?.finding === '1-2-breaches') rows.push(row('devices', 'warn', 'A sign-in was not yours', dId, dDate));
  else if (dRec?.finding === '3plus-breaches') rows.push(row('devices', 'crit', 'Several sign-ins were not yours', dId, dDate));
  else rows.push(row('devices', 'not-checked', 'Sign-ins not checked', dId));
  return rows;
}

export function sealedCount(state, accountId) {
  let sealed = 0;
  let open = 0;
  for (const e of getInterior(accountId)?.entries ?? []) {
    const s = entryState(state, accountId, e).state;
    if (s === 'sealed') sealed += 1;
    else if (s === 'open') open += 1;
  }
  return { sealed, total: sealed + open };
}
