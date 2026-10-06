import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { track, trackPageview, trackThenStop } from '../src/utils/analytics.js';
import { setChosenPod, getChosenPod } from '../src/utils/pod-pref.js';
import { isAnalyticsOff, setAnalyticsOff } from '../src/utils/analytics-pref.js';
import { renderStats } from '../src/screens/stats.js';
import { createInitialState } from '../src/state.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

describe('track()', () => {
  beforeEach(() => {
    globalThis.localStorage = memoryStorage();
    globalThis.umami = { track: vi.fn(() => Promise.resolve()) };
  });

  it('sends events with their data', () => {
    track('mission-started', { mission: 'x' });
    expect(umami.track).toHaveBeenCalledWith('mission-started', { mission: 'x' });
  });

  it('adds the chosen pod to every event', () => {
    setChosenPod('us-wa-seattle');
    track('mission-started', { mission: 'x' });
    track('went-ghost');
    expect(umami.track).toHaveBeenNthCalledWith(1, 'mission-started', { mission: 'x', pod: 'us-wa-seattle' });
    expect(umami.track).toHaveBeenNthCalledWith(2, 'went-ghost', { pod: 'us-wa-seattle' });
  });

  it('does nothing when sharing is off or umami is absent', () => {
    setAnalyticsOff(true);
    track('mission-started');
    trackPageview('#/city', 'city');
    expect(umami.track).not.toHaveBeenCalled();
    setAnalyticsOff(false);
    delete globalThis.umami;
    expect(() => track('mission-started')).not.toThrow();
  });

  it('pod storage failures never throw', () => {
    globalThis.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
    expect(getChosenPod()).toBeNull();
    expect(() => setChosenPod('x')).not.toThrow();
    expect(() => track('mission-started')).not.toThrow();
  });
});

describe('trackThenStop()', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('sends the farewell first, then turns sharing off', async () => {
    const calls = [];
    globalThis.umami = { track: vi.fn(() => { calls.push(isAnalyticsOff()); return Promise.resolve(); }) };
    await trackThenStop('opted-out');
    expect(calls).toEqual([false]);
    expect(isAnalyticsOff()).toBe(true);
    track('mission-started');
    expect(umami.track).toHaveBeenCalledTimes(1);
  });

  it('does not hang when the send never resolves', async () => {
    globalThis.umami = { track: vi.fn(() => new Promise(() => {})) };
    await trackThenStop('opted-out', {}, { timeoutMs: 20 });
    expect(isAnalyticsOff()).toBe(true);
  });

  it('still turns sharing off when umami never loaded', async () => {
    delete globalThis.umami;
    await trackThenStop('opted-out');
    expect(isAnalyticsOff()).toBe(true);
  });
});

describe('only analytics.js talks to umami', () => {
  const ALLOWED = new Set(['src/utils/analytics.js', 'src/utils/analytics-pref.js', 'src/index.html']);
  function walk(dir) {
    return readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? (f === 'assets' ? [] : walk(p)) : [p];
    });
  }
  it('no other source file references umami', () => {
    const offenders = walk('src').filter((p) => /\.(js|html)$/.test(p) && !ALLOWED.has(p) && /\bumami\b/.test(readFileSync(p, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('sharing copy', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });
  it('promises deletion of this month on this device, and nothing more', () => {
    const html = renderStats(createInitialState());
    expect(html).toMatch(/Tonight we delete what this device sent us this month/);
    expect(html).toMatch(/one more person opted out/);
  });
  it('is honest that server backups roll over within about a week', () => {
    const html = renderStats(createInitialState());
    expect(html).toMatch(/Server backups that may still hold it roll over within about a week\./);
  });
});
