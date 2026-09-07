import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialState,
  hasSavedState,
  loadState,
  saveState,
  updateMission,
  toggleAccount,
  updateStreak,
  STATE_VERSION,
} from '../src/state.js';

const store = {};
const mockStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, val) => { store[key] = val; }),
  removeItem: vi.fn((key) => { delete store[key]; }),
};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.clearAllMocks();
});

describe('createInitialState', () => {
  it('returns state with correct version', () => {
    const state = createInitialState();
    expect(state.version).toBe(STATE_VERSION);
  });

  it('has empty missions and default accounts', () => {
    const state = createInitialState();
    expect(state.missions).toEqual({});
    expect(Object.keys(state.accounts).length).toBeGreaterThan(0);
  });

  it('has streak initialized to zero', () => {
    const state = createInitialState();
    expect(state.streak.current).toBe(0);
    expect(state.streak.best).toBe(0);
  });
});

describe('loadState / saveState', () => {
  it('returns initial state when localStorage is empty', () => {
    const state = loadState(mockStorage);
    expect(state.version).toBe(STATE_VERSION);
  });

  it('round-trips through save and load', () => {
    const state = createInitialState();
    state.missions['gmail-recon-breach'] = {
      status: 'completed',
      finding: 'no-breaches',
    };
    saveState(state, mockStorage);
    const loaded = loadState(mockStorage);
    expect(loaded.missions['gmail-recon-breach'].status).toBe('completed');
  });
});

describe('hasSavedState', () => {
  it('returns false when storage is empty', () => {
    expect(hasSavedState(mockStorage)).toBe(false);
  });

  it('returns true when a valid state is saved', () => {
    saveState(createInitialState(), mockStorage);
    expect(hasSavedState(mockStorage)).toBe(true);
  });

  it('returns false when the stored value is not valid JSON', () => {
    store['reclaim-city-state'] = '{not-json';
    expect(hasSavedState(mockStorage)).toBe(false);
  });

  it('returns false when the stored version does not match', () => {
    saveState(createInitialState(), mockStorage);
    store['reclaim-city-state'] = JSON.stringify({ version: STATE_VERSION + 1 });
    expect(hasSavedState(mockStorage)).toBe(false);
  });
});

describe('updateMission', () => {
  it('sets mission status and preserves other state', () => {
    const state = createInitialState();
    const next = updateMission(state, 'gmail-recon-breach', {
      status: 'completed',
      finding: 'no-breaches',
      action: 'already-strong',
    });
    expect(next.missions['gmail-recon-breach'].status).toBe('completed');
    expect(next.version).toBe(state.version);
  });
});

describe('toggleAccount', () => {
  it('disables an account', () => {
    const state = createInitialState();
    const next = toggleAccount(state, 'gmail', false);
    expect(next.accounts.gmail.enabled).toBe(false);
  });
});

describe('updateStreak', () => {
  it('increments streak for same-day completion', () => {
    const state = createInitialState();
    state.streak.lastDate = new Date().toISOString().split('T')[0];
    state.streak.current = 3;
    const next = updateStreak(state);
    expect(next.streak.current).toBe(3);
  });

  it('increments streak for next-day completion', () => {
    const state = createInitialState();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    state.streak.lastDate = yesterday;
    state.streak.current = 3;
    const next = updateStreak(state);
    expect(next.streak.current).toBe(4);
  });

  it('resets streak if more than 1 day gap', () => {
    const state = createInitialState();
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    state.streak.lastDate = threeDaysAgo;
    state.streak.current = 5;
    const next = updateStreak(state);
    expect(next.streak.current).toBe(1);
  });
});
