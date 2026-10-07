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

function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Saves from before streakLocalDay wrote lastDate as the UTC date. That UTC
// day covers two local days: the one before it west of UTC, the one after it
// east of UTC. Either may be the day the player actually filed.
function possibleLastDays(state, now) {
  const { lastDate } = state.streak;
  if (!lastDate) return [];
  if (state.streakLocalDay) return [lastDate];
  const offset = now.getTimezoneOffset(); // minutes; > 0 west of UTC
  if (offset > 0) return [addDays(lastDate, -1), lastDate];
  if (offset < 0) return [lastDate, addDays(lastDate, 1)];
  return [lastDate];
}

export function updateStreak(state) {
  const now = new Date();
  const today = localDay(now);
  const { current, best } = state.streak;
  const last = possibleLastDays(state, now);

  if (state.streakLocalDay && last[0] === today) return state;

  let newCurrent;
  if (last.includes(today)) newCurrent = Math.max(current, 1); // same day (an old save's may be ambiguous): no double count
  else if (last.includes(addDays(today, -1))) newCurrent = current + 1;
  else newCurrent = 1;
  const newBest = Math.max(best, newCurrent);

  return {
    ...state,
    streakLocalDay: 1,
    streak: { current: newCurrent, best: newBest, lastDate: today },
  };
}

// After a debrief is filed: a skipped filing doesn't extend the streak.
// event is fileDebrief's ({ status }), or null for a mid-job burst (real work).
export function streakAfterFiling(state, event) {
  return event?.status === 'skipped' ? state : updateStreak(state);
}
