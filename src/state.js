import { captureError } from './utils/errors.js';

export const STATE_VERSION = 1;
const STORAGE_KEY = 'reclaim-city-state';

const DEFAULT_ACCOUNTS = {
  gmail: { enabled: true, name: 'Gmail', district: 'master-keys' },
  outlook: { enabled: true, name: 'Outlook', district: 'master-keys' },
  icloud: { enabled: true, name: 'iCloud Mail', district: 'master-keys' },
  yahoo: { enabled: true, name: 'Yahoo Mail', district: 'master-keys' },
  protonmail: { enabled: true, name: 'ProtonMail', district: 'master-keys' },
  apple_id: { enabled: true, name: 'Apple ID', district: 'master-keys' },
  google: { enabled: true, name: 'Google Account', district: 'master-keys' },
  microsoft: { enabled: true, name: 'Microsoft', district: 'master-keys' },
  facebook: { enabled: true, name: 'Facebook Login', district: 'master-keys' },
};

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
