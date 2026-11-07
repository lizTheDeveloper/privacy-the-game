// The streak on screen ends when a day is missed (logic sweep #3). The stored
// count only changes on a filing, so the HUD, Stats and the welcome-back note
// all read the streak as it stands today, from lastDate.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createInitialState, displayStreak } from '../src/state.js';
import { renderHud } from '../src/components/hud.js';
import { renderStats } from '../src/screens/stats.js';
import { welcomeBackNote } from '../src/utils/notifications.js';
import { textOf } from './helpers/on-page.mjs';

const ZONES = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo'];
const realTZ = process.env.TZ;
afterEach(() => { vi.useRealTimers(); process.env.TZ = realTZ; });

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

const HOUR = 3600000;
const day = (d) => `2026-11-${String(d).padStart(2, '0')}`;
const save = (current, lastDate, local = true) => ({
  ...createInitialState(),
  streak: { current, best: Math.max(current, 7), lastDate },
  missions: { 'gmail-recon-breach': { status: 'completed' } },
  ...(local ? { streakLocalDay: 1 } : {}),
});
const hudStreak = (html) => textOf(html).match(/(\d+)d STREAK/)?.[1];
const statsStreak = (html) => textOf(html).match(/EXPOSURE (\d+)d BEST (\d+)d STREAK/)?.slice(1);

describe.each(ZONES)('streak on screen in %s', (zone) => {
  const at = (d, h) => {
    process.env.TZ = zone;
    globalThis.localStorage = memoryStorage();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, d, h));
    return Date.now();
  };

  it('a streak whose last filing was 10 days ago shows 0 on the HUD and Stats, and BEST is kept', () => {
    at(16, 12);
    const s = save(5, day(6));
    expect(displayStreak(s)).toBe(0);
    expect(hudStreak(renderHud(s))).toBe('0');
    expect(statsStreak(renderStats(s))).toEqual(['0', '7']);
    expect(s.streak.current).toBe(5); // the save itself is untouched
  });

  it('today or yesterday still shows the streak', () => {
    at(16, 12);
    expect(hudStreak(renderHud(save(5, day(16))))).toBe('5');
    expect(hudStreak(renderHud(save(5, day(15))))).toBe('5');
    expect(statsStreak(renderStats(save(5, day(15))))).toEqual(['5', '7']);
    expect(hudStreak(renderHud(save(5, day(14))))).toBe('0');
  });

  it('the welcome-back note and the HUD agree, for new and old saves, early and late in the day', () => {
    for (const h of [0, 12, 23]) {
      for (let back = -2; back <= 5; back++) {
        for (const local of [true, false]) {
          const now = at(16, h);
          const s = save(4, day(16 - back), local);
          const shown = Number(hudStreak(renderHud(s)));
          const note = welcomeBackNote(s, now - 30 * HOUR, now);
          const label = `${h}h, ${back} days back, ${local ? 'local' : 'old'} save`;
          if (shown > 0) expect(note, label).toMatch(/^Your 4-day streak is still going/);
          else expect(note, label).toMatch(/^Your 4-day streak ended while you were away/);
        }
      }
    }
  });
});

describe('displayStreak edge cases', () => {
  it('no streak, or no date, shows 0', () => {
    expect(displayStreak(createInitialState())).toBe(0);
    expect(displayStreak({ streak: { current: 3, best: 3, lastDate: null } })).toBe(0);
    expect(displayStreak({ streak: { current: 3, best: 3, lastDate: 'garbage' } })).toBe(0);
  });
});
