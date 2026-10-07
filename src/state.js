import { captureError } from './utils/errors.js';
import { ACCOUNTS } from './data/accounts.js';
import { migrateBrokenAnswers } from './utils/migrate-answers.js';

export const STATE_VERSION = 1;
const STORAGE_KEY = 'reclaim-city-state';

const DEFAULT_ACCOUNTS = Object.fromEntries(
  Object.entries(ACCOUNTS).map(([id, a]) => [
    id,
    { enabled: a.district !== 'freeway', name: a.name, district: a.district },
  ]),
);

export function createInitialState() {
  return {
    version: STATE_VERSION,
    createdAt: new Date().toISOString(),
    accounts: structuredClone(DEFAULT_ACCOUNTS),
    vehicles: [],
    missions: {},
    streak: { current: 0, best: 0, lastDate: null },
  };
}

export function loadState(storage = localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (parsed.version !== STATE_VERSION) return createInitialState();
    for (const [id, a] of Object.entries(DEFAULT_ACCOUNTS)) {
      if (!parsed.accounts[id]) {
        parsed.accounts[id] = { enabled: true, name: a.name, district: a.district };
      }
    }
    return migrateBrokenAnswers(parsed);
  } catch (error) {
    captureError(error, { operation: 'loadState' });
    return createInitialState();
  }
}

export function hasSavedState(storage = localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return JSON.parse(raw).version === STATE_VERSION;
  } catch {
    return false;
  }
}

export function saveState(state, storage = localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    captureError(error, { operation: 'saveState' });
  }
}

export function updateMission(state, missionId, update) {
  return {
    ...state,
    missions: {
      ...state.missions,
      [missionId]: {
        ...state.missions[missionId],
        ...update,
        completedAt: update.status === 'completed' ? new Date().toISOString() : undefined,
      },
    },
  };
}

// The player has left for the real site (on phones that's another tab, and the
// game's tab may be reloaded meanwhile). Remember it so the briefing offers
// "I did it" when they come back. Status is untouched: started is not done.
export function markMissionStarted(state, missionId) {
  return {
    ...state,
    startedMissions: { ...state.startedMissions, [missionId]: new Date().toISOString() },
  };
}

export function toggleAccount(state, accountId, enabled) {
  return {
    ...state,
    accounts: {
      ...state.accounts,
      [accountId]: { ...state.accounts[accountId], enabled },
    },
  };
}

// Streak days are the player's local calendar day (YYYY-MM-DD).
export function localDay(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

const DAY_MS = 86400000;

// A YYYY-MM-DD day as a UTC-midnight timestamp, or null if it isn't one.
function dayValue(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const t = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === day ? t : null;
}

// A lastDate at most this far after local today is travel or a clock set
// back (time zones are at most ~26h apart): keep the streak. Further ahead is
// a broken clock: start again.
const AHEAD_TOLERANCE_DAYS = 2;

// How many days after local today the last filing may have been (0 = today,
// -1 = yesterday). Saves from before streakLocalDay wrote lastDate as the UTC
// date, which covers two local days: the one before it west of UTC, the one
// after it east of UTC.
function lastDayOffsets(state, now, todayValue) {
  const last = dayValue(state.streak.lastDate);
  if (last === null) return null;
  const d = Math.round((last - todayValue) / DAY_MS);
  if (state.streakLocalDay) return [d];
  const offset = now.getTimezoneOffset(); // minutes; > 0 west of UTC
  if (offset > 0) return [d - 1, d];
  if (offset < 0) return [d, d + 1];
  return [d];
}

export function updateStreak(state) {
  const now = new Date();
  const today = localDay(now);
  const { current, best } = state.streak;
  const offsets = lastDayOffsets(state, now, dayValue(today));
  const set = (n) => ({ ...state, streakLocalDay: 1, streak: { current: n, best: Math.max(best, n), lastDate: today } });

  if (offsets === null) return set(1); // no lastDate, or one that isn't a date
  if (state.streakLocalDay && offsets[0] === 0) return state;
  if (offsets.includes(0)) return set(Math.max(current, 1)); // same day (an old save's may be ambiguous): no double count
  if (offsets.includes(-1)) return set(current + 1);
  // Ahead of today: travelled west or the clock went back. lastDate never
  // moves backwards, so the same real day can't count twice.
  if (offsets.some((d) => d > 0 && d <= AHEAD_TOLERANCE_DAYS)) return state;
  return set(1);
}

// After a debrief is filed: a skipped filing doesn't extend the streak.
// event is fileDebrief's ({ status }), or null for a mid-job burst (real work).
export function streakAfterFiling(state, event) {
  return event?.status === 'skipped' ? state : updateStreak(state);
}
