import { captureError } from './utils/errors.js';
import { ACCOUNTS } from './data/accounts.js';

export const STATE_VERSION = 1;
const STORAGE_KEY = 'reclaim-city-state';

const DEFAULT_ACCOUNTS = Object.fromEntries(
  Object.entries(ACCOUNTS).map(([id, a]) => [id, { enabled: true, name: a.name, district: a.district }]),
);

export function createInitialState() {
  return {
    version: STATE_VERSION,
    createdAt: new Date().toISOString(),
    accounts: structuredClone(DEFAULT_ACCOUNTS),
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
    return parsed;
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

export function toggleAccount(state, accountId, enabled) {
  return {
    ...state,
    accounts: {
      ...state.accounts,
      [accountId]: { ...state.accounts[accountId], enabled },
    },
  };
}

export function updateStreak(state) {
  const today = new Date().toISOString().split('T')[0];
  const { lastDate, current, best } = state.streak;

  if (lastDate === today) return state;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isConsecutive = lastDate === yesterday;
  const newCurrent = isConsecutive ? current + 1 : 1;
  const newBest = Math.max(best, newCurrent);

  return {
    ...state,
    streak: { current: newCurrent, best: newBest, lastDate: today },
  };
}
