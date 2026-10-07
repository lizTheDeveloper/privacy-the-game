// Breaker round 4 for recon campaign Phase 1: the future-lastDate streak rule,
// strict date parsing, DST edges and old-vs-new saves. These pass: they pin
// the edges the round-3 fix has to keep.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createInitialState, updateStreak, streakAfterFiling } from '../../src/state.js';

const realTZ = process.env.TZ;
afterEach(() => { vi.useRealTimers(); process.env.TZ = realTZ; });

const ZONES = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney'];
const at = (zone, y, m, d, h = 12) => {
  process.env.TZ = zone;
  if (!vi.isFakeTimers()) vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(y, m - 1, d, h));
};
const save = (streak, local = true) => ({ ...createInitialState(), streak, ...(local ? { streakLocalDay: 1 } : {}) });
const DONE = { status: 'completed' };

describe.each(ZONES)('future lastDate in %s', (zone) => {
  it('a lastDate 2 days ahead keeps the streak, 3 days ahead resets, best kept', () => {
    at(zone, 2026, 10, 7);
    const two = updateStreak(save({ current: 6, best: 9, lastDate: '2026-10-09' }));
    expect(two.streak).toEqual({ current: 6, best: 9, lastDate: '2026-10-09' });
    const three = updateStreak(save({ current: 6, best: 9, lastDate: '2026-10-10' }));
    expect(three.streak).toEqual({ current: 1, best: 9, lastDate: '2026-10-07' });
  });

  it('after a future date, real daily filings resume with exactly +1 and no double count', () => {
    let s = save({ current: 4, best: 4, lastDate: '2026-10-09' });
    const seen = [];
    for (const d of [7, 8, 9, 10, 11]) {
      at(zone, 2026, 10, d, 20);
      s = streakAfterFiling(s, DONE);
      s = streakAfterFiling(s, DONE); // twice the same day
      seen.push(s.streak.current);
    }
    expect(seen).toEqual([4, 4, 4, 5, 6]);
    expect(s.streak).toEqual({ current: 6, best: 6, lastDate: '2026-10-11' });
  });

  it('a gap after a future date still resets', () => {
    at(zone, 2026, 10, 7);
    const s = save({ current: 4, best: 4, lastDate: '2026-10-08' });
    at(zone, 2026, 10, 10);
    expect(updateStreak(s).streak).toEqual({ current: 1, best: 4, lastDate: '2026-10-10' });
  });

  it.each([
    ['whitespace', ' 2026-10-07'],
    ['trailing newline', '2026-10-07\n'],
    ['ISO timestamp', '2026-10-07T12:00:00.000Z'],
    ['numeric', 20261007],
    ['epoch ms', 1791360000000],
    ['slashes', '2026/10/07'],
    ['impossible day', '2026-02-30'],
    ['month 13', '2026-13-01'],
    ['empty', ''],
    ['object', {}],
  ])('a %s lastDate resets cleanly (no throw), best kept', (_n, lastDate) => {
    at(zone, 2026, 10, 7);
    for (const local of [true, false]) {
      const out = updateStreak(save({ current: 5, best: 8, lastDate }, local));
      expect(out.streak).toEqual({ current: 1, best: 8, lastDate: '2026-10-07' });
    }
  });

  it('old save (UTC lastDate) three or more days ahead resets, never throws', () => {
    at(zone, 2026, 10, 7);
    expect(updateStreak(save({ current: 5, best: 5, lastDate: '2026-11-30' }, false)).streak.current).toBe(1);
  });
});

describe('DST edges', () => {
  it('Los Angeles fall-back (Nov 1): 2 days ahead across the 25h day is still 2', () => {
    at('America/Los_Angeles', 2026, 10, 31);
    expect(updateStreak(save({ current: 3, best: 3, lastDate: '2026-11-02' })).streak.current).toBe(3);
    expect(updateStreak(save({ current: 3, best: 3, lastDate: '2026-11-03' })).streak.current).toBe(1);
    // yesterday across the same boundary
    at('America/Los_Angeles', 2026, 11, 2);
    expect(updateStreak(save({ current: 3, best: 3, lastDate: '2026-11-01' })).streak.current).toBe(4);
  });

  it('Sydney spring-forward (Oct 4): yesterday and 2-ahead behave', () => {
    at('Australia/Sydney', 2026, 10, 5);
    expect(updateStreak(save({ current: 3, best: 3, lastDate: '2026-10-04' })).streak.current).toBe(4);
    at('Australia/Sydney', 2026, 10, 3, 23);
    expect(updateStreak(save({ current: 3, best: 3, lastDate: '2026-10-05' })).streak.current).toBe(3);
    expect(updateStreak(save({ current: 3, best: 3, lastDate: '2026-10-06' })).streak.current).toBe(1);
  });

  it('LA spring-forward (Mar 8 2026) yesterday', () => {
    at('America/Los_Angeles', 2026, 3, 9, 0);
    expect(updateStreak(save({ current: 2, best: 2, lastDate: '2026-03-08' })).streak.current).toBe(3);
  });
});
