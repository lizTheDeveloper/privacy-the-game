// Every streak case, run in several real timezones (the suite itself runs in
// UTC, which hid the non-UTC paths). Times are local wall-clock times.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createInitialState, streakAfterFiling } from '../src/state.js';

const ZONES = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney'];
const realTZ = process.env.TZ;
afterEach(() => { vi.useRealTimers(); process.env.TZ = realTZ; });

const DONE = { status: 'completed' };
const day = (d) => `2026-10-${String(d).padStart(2, '0')}`;
const save = (streak, local = true) => ({ ...createInitialState(), streak, ...(local ? { streakLocalDay: 1 } : {}) });

describe.each(ZONES)('streak in %s', (zone) => {
  // Local wall-clock time on 2026-10-<d> in this zone.
  const at = (d, h, m = 0) => {
    process.env.TZ = zone;
    if (!vi.isFakeTimers()) vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, d, h, m));
  };
  const localInstant = (d, h) => { process.env.TZ = zone; return new Date(2026, 9, d, h); };

  it('the first filing starts at 1 on the local day', () => {
    at(7, 23, 30);
    expect(streakAfterFiling(save({ current: 0, best: 0, lastDate: null }), DONE).streak).toEqual({ current: 1, best: 1, lastDate: day(7) });
  });

  it('late one evening, just after midnight the next: +1', () => {
    at(7, 23, 30);
    let s = streakAfterFiling(save({ current: 2, best: 2, lastDate: day(6) }), DONE);
    expect(s.streak).toEqual({ current: 3, best: 3, lastDate: day(7) });
    at(8, 0, 30);
    s = streakAfterFiling(s, DONE);
    expect(s.streak).toEqual({ current: 4, best: 4, lastDate: day(8) });
  });

  it('just after midnight and late the same local day: counted once', () => {
    at(7, 0, 30);
    const once = streakAfterFiling(save({ current: 2, best: 2, lastDate: day(6) }), DONE);
    at(7, 23, 30);
    expect(streakAfterFiling(once, DONE)).toBe(once);
  });

  it('a two-day gap resets to 1 and keeps best', () => {
    at(9, 12);
    expect(streakAfterFiling(save({ current: 4, best: 6, lastDate: day(7) }), DONE).streak).toEqual({ current: 1, best: 6, lastDate: day(9) });
  });

  it('a skipped filing changes nothing', () => {
    at(8, 12);
    const s = save({ current: 4, best: 6, lastDate: day(7) });
    expect(streakAfterFiling(s, { status: 'skipped' })).toBe(s);
  });

  it('a lastDate one day ahead (travelled west, clock set back) keeps the streak and lastDate', () => {
    at(5, 12);
    const s = save({ current: 5, best: 7, lastDate: day(6) });
    const out = streakAfterFiling(s, DONE);
    expect(out.streak).toEqual({ current: 5, best: 7, lastDate: day(6) });
  });

  it('a lastDate months ahead (a broken clock) resets to 1 and keeps best', () => {
    at(8, 12);
    expect(streakAfterFiling(save({ current: 3, best: 5, lastDate: '2026-12-01' }), DONE).streak).toEqual({ current: 1, best: 5, lastDate: day(8) });
  });

  it.each([['old', false], ['new', true]])('an unparseable lastDate (%s save) resets cleanly, never throws', (_, local) => {
    at(7, 12);
    for (const lastDate of ['not-a-date', 'garbage', '2026-13-45', '2026-02-30', 42, {}]) {
      const s = save({ current: 3, best: 3, lastDate }, local);
      expect(() => streakAfterFiling(s, DONE)).not.toThrow();
      expect(streakAfterFiling(s, DONE).streak).toEqual({ current: 1, best: 3, lastDate: day(7) });
    }
  });

  // A UTC date covers parts of two local days, so an old save filed
  // yesterday evening can't be told from one filed earlier today: it never
  // resets, and counts at most once more (the same day never counts twice).
  it('an old save (UTC lastDate) from yesterday evening never resets', () => {
    const lastDate = localInstant(7, 20).toISOString().slice(0, 10);
    at(8, 9);
    const out = streakAfterFiling(save({ current: 4, best: 4, lastDate }, false), DONE);
    expect([4, 5]).toContain(out.streak.current);
    expect(out.streak.lastDate).toBe(day(8));
  });

  it('an old save (UTC lastDate) from yesterday morning extends today', () => {
    const lastDate = localInstant(7, 7).toISOString().slice(0, 10);
    at(8, 21);
    expect(streakAfterFiling(save({ current: 4, best: 4, lastDate }, false), DONE).streak.current).toBe(5);
  });

  it('an old save (UTC lastDate) from earlier today does not double count', () => {
    for (const [h1, h2] of [[7, 21], [20, 23]]) {
      const lastDate = localInstant(8, h1).toISOString().slice(0, 10);
      at(8, h2);
      const out = streakAfterFiling(save({ current: 4, best: 4, lastDate }, false), DONE);
      expect(out.streak.current).toBe(4);
      expect(out.streak.best).toBe(4);
    }
  });
});
