// Breaker round 3 for recon campaign Phase 1: the burst's stored answers and
// the local-day streak (zones, DST, old UTC-dated saves, bad markers).
// A failing test names the behaviour it believes is wrong. Passing tests pin edges.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';
import { fileDebrief, missionEventData } from '../../src/utils/debrief.js';
import { renderDebrief } from '../../src/screens/debrief.js';
import { restoreEvents } from '../../src/utils/restore.js';
import { createInitialState, localDay, updateStreak, streakAfterFiling } from '../../src/state.js';

const BURST = MISSIONS.find((m) => m.id === 'password_manager-fortify-burst');
const pm = (extra = {}) => ({ ...createInitialState(), passwordManager: 'other', pmFlaggedCount: 40, pmThrowaway: 0, pmChanged: 0, ...extra });

// ── Burst ──────────────────────────────────────────────────────────
describe('burst answers: refiling, totals, old values', () => {
  it('refiling "more" as a listed number clears changed_more and junk_count', () => {
    let s = fileDebrief(pm({ pmFlaggedCount: 8 }), BURST, { changed: 'more', changed_more: '6', junk: 'yes', junk_count: '2' }).state;
    expect(s.missions[BURST.id]).toMatchObject({ changed: 'more', changed_more: 6, junk: 'yes', junk_count: 2 });
    s = fileDebrief(s, BURST, { changed: '2', junk: 'no' }).state;
    const rec = s.missions[BURST.id];
    expect(rec.changed).toBe('2');
    expect(rec.changed_more).toBeUndefined();
    expect(rec.junk_count).toBeUndefined();
    const html = renderDebrief(s, BURST.id);
    expect(html).not.toContain('More than 3');
    expect(html).not.toMatch(/Not recorded/);
  });

  it('totals add across a "more" burst and a listed one, and a stored changed_more never feeds the sum twice', () => {
    let s = fileDebrief(pm(), BURST, { changed: 'more', changed_more: '6', junk: 'no' }).state;
    expect(s.pmChanged).toBe(6);
    s = fileDebrief(s, BURST, { changed: '3', junk: 'no' }).state;
    expect(s.pmChanged).toBe(9);
    s = fileDebrief(s, BURST, { changed: 'more', changed_more: '4', junk: 'yes', junk_count: '1' }).state;
    expect(s.pmChanged).toBe(13);
    expect(s.pmThrowaway).toBe(1);
  });

  it('"more" below 4 is refused (no filing), at 3 and at 0', () => {
    expect(fileDebrief(pm(), BURST, { changed: 'more', changed_more: '3', junk: 'no' })).toBeNull();
    expect(fileDebrief(pm(), BURST, { changed: 'more', changed_more: '0', junk: 'no' })).toBeNull();
    expect(fileDebrief(pm(), BURST, { changed: 'more', changed_more: '-5', junk: 'no' })).toBeNull();
    expect(fileDebrief(pm(), BURST, { changed: 'more', changed_more: '4.5', junk: 'no' })).toBeNull();
  });

  it('"more" bigger than what is left caps the total but keeps what the player said', () => {
    const f = fileDebrief(pm({ pmFlaggedCount: 5 }), BURST, { changed: 'more', changed_more: '50', junk: 'no' });
    expect(f.state.pmChanged).toBe(5);
    expect(f.state.missions[BURST.id].changed_more).toBe(50);
    expect(f.state.missions[BURST.id].status).toBe('completed');
  });

  it('"more" with a mid-job state (not done) stores the answers and reopens without "Not recorded"', () => {
    const f = fileDebrief(pm(), BURST, { changed: 'more', changed_more: '4', junk: 'no' });
    expect(f.event).toBeNull();
    const s = { ...f.state, missions: { ...f.state.missions, [BURST.id]: { ...f.state.missions[BURST.id], status: 'completed' } } };
    const html = renderDebrief(s, BURST.id);
    expect(html).toContain('More than 3');
    expect(html).not.toMatch(/Not recorded/);
  });

  it('old saves: numeric strings above 3 reopen as "More than 3"; 0-3 stay their option; JSON numbers do not print raw or crash', () => {
    for (const [changed, expectMore] of [['4', true], ['9999', true], ['3', false], ['0', false], ['1', false]]) {
      const s = pm();
      s.missions[BURST.id] = { status: 'completed', changed, junk: 'no' };
      const html = renderDebrief(s, BURST.id);
      expect(html.includes('More than 3')).toBe(expectMore);
      expect(html).not.toMatch(/Not recorded/);
    }
    const s = pm();
    s.missions[BURST.id] = { status: 'completed', changed: 12, junk: 'no' };
    expect(() => renderDebrief(s, BURST.id)).not.toThrow();
  });

  it('an old save already holding changed_more with a number stays consistent', () => {
    const s = pm();
    s.missions[BURST.id] = { status: 'completed', changed: '8', changed_more: 8, junk: 'no' };
    const html = renderDebrief(s, BURST.id);
    expect(html).toContain('More than 3');
    expect(html).not.toMatch(/Not recorded/);
  });

  it('a skipped burst after a "more" burst does not touch the stored totals', () => {
    let s = fileDebrief(pm(), BURST, { changed: 'more', changed_more: '6', junk: 'no' }).state;
    const f = fileDebrief(s, BURST, { changed: 'later', junk: 'no' });
    expect(f.event).toEqual({ status: 'skipped' });
    expect(f.state.pmChanged).toBe(6);
  });

  it('restore never resends burst answers', () => {
    const f = fileDebrief(pm({ pmFlaggedCount: 5 }), BURST, { changed: 'more', changed_more: '5', junk: 'no' });
    const ev = restoreEvents(f.state).filter((e) => e.name === 'mission-completed' && e.data.mission === BURST.id);
    for (const e of ev) for (const k of ['changed', 'changed_more', 'junk', 'junk_count']) expect(k in e.data).toBe(false);
    expect(Object.keys(missionEventData(BURST, f.state.missions[BURST.id]))).not.toContain('changed_more');
  });
});

// ── Streak ─────────────────────────────────────────────────────────
describe('local-day streak', () => {
  const realTZ = process.env.TZ;
  const at = (tz, iso) => { process.env.TZ = tz; vi.useRealTimers(); vi.useFakeTimers({ toFake: ['Date'], now: new Date(iso) }); };
  afterEach(() => { vi.useRealTimers(); process.env.TZ = realTZ; });
  const fresh = (streak, extra = {}) => ({ ...createInitialState(), streak, ...extra });
  const file = (s) => streakAfterFiling(s, { status: 'completed' });

  it('the forced TZ is really in effect and a runtime TZ change takes (the harness is honest)', () => {
    at('America/Los_Angeles', '2026-10-07T03:00:00Z');
    expect(localDay()).toBe('2026-10-06');
    at('Asia/Tokyo', '2026-10-07T03:00:00Z');
    expect(localDay()).toBe('2026-10-07');
  });

  // Moving west after filing on the far side of the date line: lastDate is a
  // day in the player's future.
  it('travelling west (lastDate is tomorrow locally) keeps the streak', () => {
    // Filed 2026-10-06 in Tokyo (current 5). Landed in LA, where it is still
    // 2026-10-05. updateStreak finds neither today nor yesterday in [lastDate]
    // and resets the streak to 1, and moves lastDate backwards a day. A date
    // in the future is not a missed day: the streak should stay 5 (and not
    // regress lastDate, which would let the same real day count again).
    at('America/Los_Angeles', '2026-10-05T12:00:00-07:00');
    const s = file(fresh({ current: 5, best: 5, lastDate: '2026-10-06' }, { streakLocalDay: 1 }));
    expect(s.streak.current).toBe(5);
  });

  it('a device clock set back a day does not lose the streak', () => {
    // Same defect, no travel: lastDate ahead of today by one day.
    at('America/Los_Angeles', '2026-10-05T12:00:00-07:00');
    const s = file(fresh({ current: 9, best: 9, lastDate: '2026-10-06' }, { streakLocalDay: 1 }));
    expect(s.streak.best).toBe(9);
    expect(s.streak.current).toBeGreaterThanOrEqual(9);
  });

  // A hand-edited or corrupted lastDate. Old code compared strings and never
  // threw; addDays builds new Date(`${garbage}T00:00:00Z`) and toISOString()
  // throws RangeError on an Invalid Date. UTC (the forced test TZ) returns
  // before addDays for an old save, so only a real zone hits it.
  it('an old save with an unparseable lastDate does not throw in a non-UTC zone', () => {
    at('America/Los_Angeles', '2026-10-07T12:00:00-07:00');
    const old = fresh({ current: 3, best: 3, lastDate: 'not-a-date' });
    expect(() => file(old)).not.toThrow();
    expect(file(old).streak.current).toBe(1);
  });

  it('a new save with an unparseable lastDate resets rather than throws', () => {
    at('America/Los_Angeles', '2026-10-07T12:00:00-07:00');
    const s = file(fresh({ current: 3, best: 3, lastDate: 'garbage' }, { streakLocalDay: 1 }));
    expect(s.streak).toEqual({ current: 1, best: 3, lastDate: '2026-10-07' });
  });

  it('missing, zero and garbage streakLocalDay markers: a new-style save with a future-proof marker value works', () => {
    at('America/Los_Angeles', '2026-10-07T12:00:00-07:00');
    for (const marker of [true, 2, 'yes']) {
      const s = file(fresh({ current: 3, best: 3, lastDate: '2026-10-06' }, { streakLocalDay: marker }));
      expect(s.streak).toEqual({ current: 4, best: 4, lastDate: '2026-10-07' });
    }
  });

  it('streakLocalDay 0 or null is treated as an old save, which stays lenient', () => {
    at('America/Los_Angeles', '2026-10-07T12:00:00-07:00');
    for (const marker of [0, null, undefined, '']) {
      const s = file(fresh({ current: 3, best: 3, lastDate: '2026-10-06' }, { streakLocalDay: marker }));
      expect(s.streak.current).toBe(4);
      expect(s.streakLocalDay).toBe(1);
    }
  });

  it('no lastDate at all starts at 1 in every zone', () => {
    for (const tz of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
      at(tz, '2026-10-07T12:00:00Z');
      expect(file(fresh({ current: 0, best: 0, lastDate: null })).streak.current).toBe(1);
    }
  });

  describe('DST', () => {
    const chain = (tz, instants) => {
      let s = fresh({ current: 0, best: 0, lastDate: null });
      const out = [];
      for (const iso of instants) { at(tz, iso); s = file(s); out.push(s.streak.current); }
      return out;
    };

    it('Pacific spring forward (2026-03-08): late Saturday, Sunday, Monday count 1,2,3', () => {
      expect(chain('America/Los_Angeles', ['2026-03-07T23:30:00-08:00', '2026-03-08T12:00:00-07:00', '2026-03-09T00:10:00-07:00'])).toEqual([1, 2, 3]);
    });

    it('Pacific fall back (2026-11-01): the repeated 01:30 is one day, then Monday extends', () => {
      expect(chain('America/Los_Angeles', ['2026-10-31T23:30:00-07:00', '2026-11-01T01:30:00-07:00', '2026-11-01T01:30:00-08:00', '2026-11-01T23:59:00-08:00', '2026-11-02T00:01:00-08:00'])).toEqual([1, 2, 2, 2, 3]);
    });

    it('Sydney spring forward (2026-10-04) and fall back (2026-04-05) count each local day once', () => {
      expect(chain('Australia/Sydney', ['2026-10-03T23:30:00+10:00', '2026-10-04T03:30:00+11:00', '2026-10-05T00:30:00+11:00'])).toEqual([1, 2, 3]);
      expect(chain('Australia/Sydney', ['2026-04-04T23:30:00+11:00', '2026-04-05T02:30:00+11:00', '2026-04-05T02:30:00+10:00', '2026-04-06T00:30:00+10:00'])).toEqual([1, 2, 2, 3]);
    });

    it('a zone whose DST skips midnight (America/Sao_Paulo style historic, Asia/Beirut) still gets one count per day', () => {
      // Beirut moves 00:00 -> 01:00 on the last Sunday of March (2026-03-29).
      expect(chain('Asia/Beirut', ['2026-03-28T23:30:00+02:00', '2026-03-29T01:10:00+03:00', '2026-03-30T00:10:00+03:00'])).toEqual([1, 2, 3]);
    });

    it('year and leap-day boundaries are consecutive', () => {
      expect(chain('America/Los_Angeles', ['2027-12-31T20:00:00-08:00', '2028-01-01T20:00:00-08:00'])).toEqual([1, 2]);
      expect(chain('America/Los_Angeles', ['2028-02-28T20:00:00-08:00', '2028-02-29T20:00:00-08:00', '2028-03-01T20:00:00-08:00'])).toEqual([1, 2, 3]);
      expect(chain('Asia/Tokyo', ['2027-02-28T20:00:00+09:00', '2027-03-01T20:00:00+09:00'])).toEqual([1, 2]);
    });

    it('extreme zones (UTC+14, UTC-11) count consecutive local days', () => {
      expect(chain('Pacific/Kiritimati', ['2026-10-07T00:30:00+14:00', '2026-10-08T23:30:00+14:00'])).toEqual([1, 2]);
      expect(chain('Pacific/Pago_Pago', ['2026-10-07T00:30:00-11:00', '2026-10-08T23:30:00-11:00'])).toEqual([1, 2]);
    });
  });

  describe('save written in one zone, loaded in another', () => {
    it('new save written in LA (local 10-06) and played in Tokyo the next local morning extends', () => {
      at('America/Los_Angeles', '2026-10-06T20:00:00-07:00');
      const s = file(fresh({ current: 0, best: 0, lastDate: null }));
      expect(s.streak.lastDate).toBe('2026-10-06');
      at('Asia/Tokyo', '2026-10-07T20:00:00+09:00');
      expect(file(s).streak.current).toBe(2);
    });

    it('new save written in Tokyo (10-07) and played the same wall-clock evening in LA (10-06) does not double count or lose days afterwards', () => {
      at('Asia/Tokyo', '2026-10-07T08:00:00+09:00');
      let s = file(fresh({ current: 4, best: 4, lastDate: '2026-10-06' }, { streakLocalDay: 1 }));
      expect(s.streak).toEqual({ current: 5, best: 4 + 1, lastDate: '2026-10-07' });
      // Now in LA it is 10-06 15:30 (the same instant 16 hours later: 10-07 00:00 JST = 10-06 08:00 PDT).
      at('America/Los_Angeles', '2026-10-06T16:00:00-07:00');
      const t = file(s);
      // Same defect as the travel-west test: Tokyo's 10-07 is LA's future, so
      // updateStreak resets 5 to 1. Nothing should be added or lost here.
      expect(t.streak.current).toBe(5);
    });

    it('old save (UTC date) loaded in a third zone east and west of the writer does not reset a continuing streak', () => {
      const old = () => fresh({ current: 6, best: 6, lastDate: '2026-10-06' });
      at('Asia/Kolkata', '2026-10-08T10:00:00+05:30');
      expect(file(old()).streak.current).toBe(7);
      at('America/Sao_Paulo', '2026-10-07T10:00:00-03:00');
      expect(file(old()).streak.current).toBe(7);
      at('Pacific/Auckland', '2026-10-08T10:00:00+13:00');
      expect(file(old()).streak.current).toBe(7);
    });
  });

  describe('streakAfterFiling', () => {
    it('skipped does not touch the marker, streak or best', () => {
      at('America/Los_Angeles', '2026-10-07T12:00:00-07:00');
      const old = fresh({ current: 3, best: 5, lastDate: '2026-10-06' });
      expect(streakAfterFiling(old, { status: 'skipped' })).toBe(old);
    });

    it('not-needed, undefined and null events extend like a completed one', () => {
      at('America/Los_Angeles', '2026-10-07T12:00:00-07:00');
      for (const ev of [{ status: 'not-needed' }, null, undefined, {}]) {
        expect(streakAfterFiling(fresh({ current: 3, best: 3, lastDate: '2026-10-06' }, { streakLocalDay: 1 }), ev).streak.current).toBe(4);
      }
    });

    it('a second filing the same local day returns the same state object', () => {
      at('Asia/Tokyo', '2026-10-07T01:00:00+09:00');
      const once = updateStreak(fresh({ current: 0, best: 0, lastDate: null }));
      at('Asia/Tokyo', '2026-10-07T23:59:00+09:00');
      expect(updateStreak(once)).toBe(once);
    });
  });
});
