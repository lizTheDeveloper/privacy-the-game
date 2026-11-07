import { captureError } from './utils/errors.js';
import { ACCOUNTS } from './data/accounts.js';
import { migrateBrokenAnswers } from './utils/migrate-answers.js';
import { cleanBrokerState } from './utils/broker-state.js';

export const STATE_VERSION = 1;

// A storage-blocked iframe throws on the bare `localStorage` read, which a
// default parameter would do outside the try blocks below. Null = play without saving.
function defaultStorage() {
  try {
    return localStorage;
  } catch {
    return null;
  }
}
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

export function loadState(storage = defaultStorage()) {
  if (!storage) return createInitialState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STATE_VERSION) return createInitialState();
    // A save with no `accounts` object (an older build, or a corrupted
    // write) threw "Cannot read properties of undefined (reading 'gmail')"
    // below, and the catch then replaced the whole save with a new city,
    // losing every filed mission. Start the account list from the defaults
    // instead (the loop below fills it), keep the rest of the save as it is,
    // and report the repair so the corruption still shows up in GlitchTip.
    // Other fields are left untouched (tests/breaker-phase1/round2.test.js).
    if (parsed.accounts === null || typeof parsed.accounts !== 'object' || Array.isArray(parsed.accounts)) {
      captureError(new Error('loadState: save had no accounts object'), { operation: 'loadState', repaired: 'accounts' });
      parsed.accounts = {};
    }
    // The HUD, Stats and updateStreak all read state.streak.current, so a save
    // with no streak object loaded and then every screen drew "Something
    // broke" (GlitchTip #440, after the accounts repair above on the same
    // save). A missing streak holds nothing to keep: start it at zero, keep the
    // rest of the save, and report the repair. A streak that is there is kept as it is.
    if (parsed.streak === null || typeof parsed.streak !== 'object' || Array.isArray(parsed.streak)) {
      captureError(new Error('loadState: save had no streak object'), { operation: 'loadState', repaired: 'streak' });
      parsed.streak = { current: 0, best: 0, lastDate: null };
    }
    // A missing account (the repair above, or one a later release added) gets
    // the new-city default: Freeway car accounts stay off until a vehicle is added.
    for (const [id, a] of Object.entries(DEFAULT_ACCOUNTS)) {
      if (!parsed.accounts[id]) parsed.accounts[id] = structuredClone(a);
    }
    return cleanBrokerState(migrateBrokenAnswers(parsed));
  } catch (error) {
    captureError(error, { operation: 'loadState' });
    return createInitialState();
  }
}

export function hasSavedState(storage = defaultStorage()) {
  if (!storage) return false;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return JSON.parse(raw).version === STATE_VERSION;
  } catch {
    return false;
  }
}

export function saveState(state, storage = defaultStorage()) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    captureError(error, { operation: 'saveState' });
  }
}

export function updateMission(state, missionId, update) {
  // A new filing supersedes any re-check of the old one (its dates included).
  const { rechecked: _r, findingAt: _f, ...prev } = state.missions[missionId] || {};
  return {
    ...state,
    missions: {
      ...state.missions,
      [missionId]: {
        ...prev,
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
  // An old save's day may be yesterday or today: give the +1 (a missed day
  // costs the player more than a rare double count).
  if (offsets.includes(-1)) return set(current + 1);
  if (offsets.includes(0)) return set(Math.max(current, 1)); // same day: no double count
  // Ahead of today: travelled west or the clock went back. lastDate never
  // moves backwards, so the same real day can't count twice.
  if (offsets.some((d) => d > 0 && d <= AHEAD_TOLERANCE_DAYS)) return state;
  return set(1);
}

// The streak as it stands on `now`. updateStreak runs only on a filing, so the
// stored count outlives a missed day; every screen reads this instead.
// current: the stored count while the last filing was today or yesterday (or
// a day or two ahead, as updateStreak allows), else 0. filedToday: the last
// filing already counts for today (an old save whose UTC day may be yesterday
// is treated as yesterday, as updateStreak does).
export function streakNow(state, now = new Date()) {
  const kept = state?.streak?.current || 0;
  const offsets = kept ? lastDayOffsets(state, now, dayValue(localDay(now))) : null;
  if (!offsets) return { current: 0, kept, filedToday: false };
  const yesterday = offsets.includes(-1);
  const filedToday = !yesterday && offsets.some((d) => d >= 0 && d <= AHEAD_TOLERANCE_DAYS);
  return { current: yesterday || filedToday ? kept : 0, kept, filedToday };
}

export function displayStreak(state, now = new Date()) {
  return streakNow(state, now).current;
}

// After a debrief is filed: a skipped filing doesn't extend the streak.
// event is fileDebrief's ({ status }), or null for a mid-job burst (real work).
export function streakAfterFiling(state, event) {
  return event?.status === 'skipped' ? state : updateStreak(state);
}
