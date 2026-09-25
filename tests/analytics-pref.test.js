import { describe, it, expect, beforeEach } from 'vitest';
import { isAnalyticsOff, setAnalyticsOff, ANALYTICS_OFF_KEY, UMAMI_DISABLED_KEY } from '../src/utils/analytics-pref.js';
import { renderStats } from '../src/screens/stats.js';
import { createInitialState } from '../src/state.js';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

describe('analytics opt-out', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('is on by default', () => {
    expect(isAnalyticsOff()).toBe(false);
  });

  it('turning it off also sets Umami\'s own disable flag, so tracking stops mid-session', () => {
    setAnalyticsOff(true);
    expect(isAnalyticsOff()).toBe(true);
    expect(localStorage.getItem(ANALYTICS_OFF_KEY)).toBe('1');
    expect(localStorage.getItem(UMAMI_DISABLED_KEY)).toBe('1');
  });

  it('turning it back on clears both flags', () => {
    setAnalyticsOff(true);
    setAnalyticsOff(false);
    expect(isAnalyticsOff()).toBe(false);
    expect(localStorage.getItem(ANALYTICS_OFF_KEY)).toBeNull();
    expect(localStorage.getItem(UMAMI_DISABLED_KEY)).toBeNull();
  });

  it('never throws when storage is unavailable (private mode)', () => {
    globalThis.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
    expect(isAnalyticsOff()).toBe(false);
    expect(() => setAnalyticsOff(true)).not.toThrow();
  });

  it('the stats screen shows the toggle and its current state', () => {
    const on = renderStats(createInitialState());
    expect(on).toContain('data-action="toggle-analytics"');
    expect(on).toMatch(/Sharing is on/);
    setAnalyticsOff(true);
    expect(renderStats(createInitialState())).toMatch(/Sharing is off/);
  });
});
