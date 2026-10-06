import { describe, it, expect, beforeEach, vi } from 'vitest';
import { restoreEvents, deletionStatus, deletedKinds } from '../src/utils/restore.js';
import { getGhostInfo, markGoneGhost, clearGhost, isGhostPending, GHOST_KEY } from '../src/utils/ghost.js';
import { getOptedOutAt, setOptedOutAt, getOptedOutNonce, newNonce, OPTED_OUT_AT_KEY } from '../src/utils/analytics-pref.js';
import { setAnalyticsOff } from '../src/utils/analytics-pref.js';
import { waitForTracker } from '../src/utils/analytics.js';
import { createInitialState } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { isCoreMission, calcDistrictProgress } from '../src/utils/calc.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

const data = (asOf) => ({ asOf, city: {}, pods: [] });

describe('ghost record', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('stores early and reads it back', () => {
    markGoneGhost({ early: true });
    expect(getGhostInfo()).toMatchObject({ silent: false, early: true });
    expect(typeof getGhostInfo().at).toBe('string');
  });

  it('older stored values read back as not early', () => {
    localStorage.setItem(GHOST_KEY, '2026-10-01T00:00:00Z');
    expect(getGhostInfo()).toEqual({ at: '2026-10-01T00:00:00Z', silent: false, early: false, nonce: null });
    localStorage.setItem(GHOST_KEY, JSON.stringify({ at: '2026-10-01T00:00:00Z', silent: true }));
    expect(getGhostInfo()).toEqual({ at: '2026-10-01T00:00:00Z', silent: true, early: false, nonce: null });
  });

  it('keeps the nonce sent with went-ghost-early', () => {
    markGoneGhost({ early: true, nonce: 'abc123' });
    expect(getGhostInfo().nonce).toBe('abc123');
  });

  it('clearGhost removes it and never throws', () => {
    markGoneGhost({ early: true });
    clearGhost();
    expect(getGhostInfo()).toBeNull();
    globalThis.localStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
    expect(() => clearGhost()).not.toThrow();
  });
});

describe('isGhostPending', () => {
  const early = (at) => ({ at, silent: false, early: true });
  it('no collective yet: pending', () => expect(isGhostPending(early('2026-10-06T10:00:00Z'), null)).toBe(true));
  it('ghost later than the published file: pending', () =>
    expect(isGhostPending(early('2026-10-06T10:00:00Z'), data('2026-10-06T03:00:00Z'))).toBe(true));
  it('ghost earlier than the published file: went through', () =>
    expect(isGhostPending(early('2026-10-06T10:00:00Z'), data('2026-10-07T03:00:00Z'))).toBe(false));
  it('a final-mission ghost is never pending', () => {
    expect(isGhostPending({ at: '2026-10-06T10:00:00Z', silent: false, early: false }, null)).toBe(false);
    expect(isGhostPending(null, null)).toBe(false);
  });
  it('a published file less than 10 minutes after the ghost is still pending (clock skew)', () => {
    expect(isGhostPending(early('2026-10-06T10:00:00Z'), data('2026-10-06T10:05:00Z'))).toBe(true);
    expect(isGhostPending(early('2026-10-06T10:00:00Z'), data('2026-10-06T10:09:59Z'))).toBe(true);
    expect(isGhostPending(early('2026-10-06T10:00:00Z'), data('2026-10-06T10:11:00Z'))).toBe(false);
    // Browser clock ahead of the server: the file says 09:55, the ghost says 10:00.
    expect(isGhostPending(early('2026-10-06T10:00:00Z'), data('2026-10-06T09:55:00Z'))).toBe(true);
  });
  it('unparseable dates count as pending', () =>
    expect(isGhostPending(early('2026-10-06T10:00:00Z'), data('nonsense'))).toBe(true));
});

describe('opted-out timestamp', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });
  it('round trips and clears', () => {
    expect(getOptedOutAt()).toBeNull();
    setOptedOutAt('2026-10-06T10:00:00Z');
    expect(localStorage.getItem(OPTED_OUT_AT_KEY)).toBe('2026-10-06T10:00:00Z');
    expect(getOptedOutAt()).toBe('2026-10-06T10:00:00Z');
    setOptedOutAt(null);
    expect(getOptedOutAt()).toBeNull();
  });
  it('keeps the nonce sent with opted-out, and clears it with the timestamp', () => {
    setOptedOutAt('2026-10-06T10:00:00Z', 'n1');
    expect(getOptedOutNonce()).toBe('n1');
    setOptedOutAt(null);
    expect(getOptedOutNonce()).toBeNull();
  });
  it('never throws on blocked storage', () => {
    globalThis.localStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
    expect(getOptedOutAt()).toBeNull();
    expect(getOptedOutNonce()).toBeNull();
    expect(() => setOptedOutAt('x')).not.toThrow();
    expect(() => setOptedOutAt(null)).not.toThrow();
  });
});

describe('newNonce', () => {
  it('is 16 random bytes as hex', () => {
    const a = newNonce();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(newNonce()).not.toBe(a);
  });
});

describe('deletionStatus', () => {
  const at = '2026-10-06T10:00:00Z';
  const before = data('2026-10-06T03:00:00Z');
  const after = data('2026-10-07T03:00:00Z');
  const early = { at, silent: false, early: true };

  it('nothing recorded: none', () => expect(deletionStatus({ ghostInfo: null, optedOutAt: null, collective: after })).toBe('none'));
  it('a final-mission ghost deletes nothing', () =>
    expect(deletionStatus({ ghostInfo: { at, silent: false, early: false }, optedOutAt: null, collective: after })).toBe('none'));
  it('early ghost: pending, then deleted', () => {
    expect(deletionStatus({ ghostInfo: early, collective: before })).toBe('pending');
    expect(deletionStatus({ ghostInfo: early, collective: null })).toBe('pending');
    expect(deletionStatus({ ghostInfo: early, collective: after })).toBe('deleted');
  });
  it('opt-out: pending, then deleted', () => {
    expect(deletionStatus({ optedOutAt: at, collective: before })).toBe('pending');
    expect(deletionStatus({ optedOutAt: at, collective: null })).toBe('pending');
    expect(deletionStatus({ optedOutAt: at, collective: after })).toBe('deleted');
  });
  it('within 10 minutes of the published file: still pending', () => {
    expect(deletionStatus({ optedOutAt: at, collective: data('2026-10-06T10:05:00Z') })).toBe('pending');
    expect(deletionStatus({ optedOutAt: at, collective: data('2026-10-06T10:10:01Z') })).toBe('deleted');
  });
  it('kinds that went through', () => {
    // Both went through: the job counted this person once, as an opt-out.
    expect(deletedKinds({ ghostInfo: early, optedOutAt: '2026-10-01T00:00:00Z', collective: after })).toEqual(['opted-out']);
    expect(deletedKinds({ ghostInfo: early, optedOutAt: null, collective: after })).toEqual(['ghost-early']);
    expect(deletedKinds({ ghostInfo: early, optedOutAt: null, collective: before })).toEqual([]);
    expect(deletedKinds({ ghostInfo: null, optedOutAt: at, collective: after })).toEqual(['opted-out']);
  });
});

describe('restoreEvents', () => {
  it('re-sends completed and skipped missions with the keys the game sends, plus restored', () => {
    const s = createInitialState();
    s.missions['gmail-recon-breach'] = { status: 'completed', finding: '3plus-breaches', action: 'x' };
    s.missions['gmail-recon-login'] = { status: 'skipped' };
    s.missions['gmail-fortify-password'] = { status: 'started' };
    const ev = restoreEvents(s);
    const missions = ev.filter((e) => e.name === 'mission-completed');
    expect(missions).toHaveLength(2);
    const breach = missions.find((e) => e.data.mission === 'gmail-recon-breach');
    const m = MISSIONS.find((x) => x.id === 'gmail-recon-breach');
    expect(breach.data).toEqual({ mission: 'gmail-recon-breach', district: ACCOUNTS[m.accountId].district,
      finding: '3plus-breaches', phase: m.phase, status: 'completed', restored: '1' });
    const login = missions.find((e) => e.data.mission === 'gmail-recon-login');
    expect(login.data.status).toBe('skipped');
    expect(login.data.restored).toBe('1');
    expect('finding' in login.data).toBe(false);
    expect(ev.some((e) => e.name === 'district-completed')).toBe(false);
  });

  it('skips missions the game no longer has', () => {
    const s = createInitialState();
    s.missions['no-such-mission'] = { status: 'completed' };
    expect(restoreEvents(s)).toEqual([]);
  });

  it('sends district-completed only for districts at 100%', () => {
    const s = createInitialState();
    const district = ACCOUNTS.gmail.district;
    for (const m of MISSIONS) {
      if (isCoreMission(m) && s.accounts[m.accountId]?.enabled && ACCOUNTS[m.accountId]?.district === district) {
        s.missions[m.id] = { status: 'completed' };
      }
    }
    expect(calcDistrictProgress(s, district).percent).toBe(100);
    const districts = restoreEvents(s).filter((e) => e.name === 'district-completed');
    expect(districts).toEqual([{ name: 'district-completed', data: { district, restored: '1' } }]);
  });
});

describe('waitForTracker', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); setAnalyticsOff(false); delete globalThis.umami; });

  it('resolves true once the script appears', async () => {
    setTimeout(() => { globalThis.umami = { track: vi.fn() }; }, 30);
    expect(await waitForTracker({ timeoutMs: 1000, pollMs: 10 })).toBe(true);
  });

  it('resolves false if it never loads', async () => {
    expect(await waitForTracker({ timeoutMs: 50, pollMs: 10 })).toBe(false);
  });

  it('resolves false while sharing is off', async () => {
    globalThis.umami = { track: vi.fn() };
    setAnalyticsOff(true);
    expect(await waitForTracker({ timeoutMs: 50, pollMs: 10 })).toBe(false);
  });
});
