import { describe, it, expect, beforeEach } from 'vitest';
import { parseCollective, fetchCollective, fetchWhoami, findPod, displayPodId, podBoard, yourPart, fmt, backdropPods, COLLECTIVE_SCREENS } from '../src/utils/collective.js';
import { setChosenPod } from '../src/utils/pod-pref.js';
import { createInitialState } from '../src/state.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

export const DOC = {
  k: 50, asOf: '2026-10-06T04:00:00Z',
  city: { players: 11865, fortified: { pct: 18, fixed: 970, breached: 5424 }, ghosts: 3, optedOut: 12,
          byAddress: [{ id: 'gmail', label: 'Gmail', checks: 2759, breachRatePct: 85 }] },
  pods: [
    { id: 'us-il-chicago', label: 'Chicago', level: 'city', players: 312, fortified: { pct: 22, fixed: 40, breached: 182 }, ghosts: 1 },
    { id: 'us-wa-seattle', label: 'Seattle', level: 'city', players: 300, fortified: { pct: 30, fixed: 60, breached: 200 }, ghosts: 0 },
    { id: 'gb', label: 'United Kingdom', level: 'country' },
  ],
};

describe('parseCollective', () => {
  it('accepts a good document', () => expect(parseCollective(DOC).pods).toHaveLength(3));
  it('rejects documents without city, pods or asOf', () => {
    expect(parseCollective(null)).toBeNull();
    expect(parseCollective({ ...DOC, city: undefined })).toBeNull();
    expect(parseCollective({ ...DOC, pods: {} })).toBeNull();
    expect(parseCollective({ ...DOC, asOf: 5 })).toBeNull();
  });
  it('drops malformed pods', () => {
    expect(parseCollective({ ...DOC, pods: [...DOC.pods, null, { id: 3 }] }).pods).toHaveLength(3);
  });
});

describe('fetchers', () => {
  it('fetchCollective: ok on 200 + valid, not ok on 503/garbage/network', async () => {
    const ok = await fetchCollective(async () => ({ ok: true, json: async () => DOC }));
    expect(ok.ok).toBe(true);
    expect((await fetchCollective(async () => ({ ok: false, json: async () => ({}) }))).ok).toBe(false);
    expect((await fetchCollective(async () => ({ ok: true, json: async () => ({ nope: 1 }) }))).ok).toBe(false);
    expect((await fetchCollective(async () => { throw new Error('offline'); })).ok).toBe(false);
  });
  it('fetchWhoami sends screen and language', async () => {
    let url;
    const r = await fetchWhoami(async (u) => { url = u; return { ok: true, json: async () => ({ city: 'Chicago' }) }; },
      { language: 'en-US' }, { width: 390, height: 844 });
    expect(url).toBe('api/whoami?screen=390x844&lang=en-US');
    expect(r).toEqual({ ok: true, data: { city: 'Chicago' } });
  });
});

describe('pods', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });
  it('findPod', () => {
    expect(findPod(DOC, 'gb').label).toBe('United Kingdom');
    expect(findPod(DOC, 'atlantis')).toBeNull();
  });
  it('displayPodId prefers a published choice, falls back to whoami, ignores vanished pods', () => {
    const who = { pod: { id: 'us-il-chicago' } };
    expect(displayPodId(DOC, who)).toBe('us-il-chicago');
    setChosenPod('us-wa-seattle');
    expect(displayPodId(DOC, who)).toBe('us-wa-seattle');
    setChosenPod('vanished-town');
    expect(displayPodId(DOC, who)).toBe('us-il-chicago');
    expect(displayPodId(DOC, null)).toBeNull();
  });
  it('podBoard ranks by fortified, pods without figures last', () => {
    expect(podBoard(DOC).map((p) => p.id)).toEqual(['us-wa-seattle', 'us-il-chicago', 'gb']);
  });
});

describe('yourPart', () => {
  it('counts breached accounts found and fixed, from local state only', () => {
    const s = createInitialState();
    s.missions['gmail-recon-breach'] = { status: 'completed', finding: '3plus-breaches' };
    s.missions['gmail-fortify-password'] = { status: 'completed' };
    s.missions['yahoo-recon-breach'] = { status: 'completed', finding: '1-2-breaches' };
    s.missions['google-recon-breach'] = { status: 'completed', finding: 'no-breaches' };
    s.missions['outlook-recon-breach'] = { status: 'skipped', finding: 'skip' };
    expect(yourPart(s)).toEqual({ found: 2, fixed: 1 });
  });
});

describe('fmt', () => {
  it('formats numbers and blanks the rest', () => {
    expect(fmt(11865)).toBe('11,865');
    expect(fmt(undefined)).toBe('');
    expect(fmt(NaN)).toBe('');
  });
});

describe('backdropPods', () => {
  const SLOTS = ['near', 's1', 's2', 's3'];
  const pod = (id, players, pct) => ({ id, label: id.toUpperCase(), players, ...(pct === undefined ? {} : { fortified: { pct } }) });
  const doc = (pods) => ({ asOf: 'x', city: {}, pods });

  it('returns null without collective data (the backdrop stays as it is)', () => {
    expect(backdropPods(null, null, SLOTS)).toBeNull();
    expect(backdropPods(undefined, 'a', SLOTS)).toBeNull();
  });

  it('places published pods largest first, one per slot, dropping the overflow', () => {
    const out = backdropPods(doc([pod('a', 60, 10), pod('b', 4100, 16), pod('c', 264, 24), pod('d', 300), pod('e', 51, 5)]), null, SLOTS);
    expect(out.map((p) => p.id)).toEqual(['b', 'd', 'c', 'a']);
    expect(out.map((p) => p.slot)).toEqual(SLOTS);
  });

  it('skips pods that publish no player count', () => {
    const out = backdropPods(doc([pod('a', 60), { id: 'gb', label: 'United Kingdom' }, { id: 'x', label: 'X', players: NaN }]), null, SLOTS);
    expect(out.map((p) => p.id)).toEqual(['a']);
  });

  it('puts your pod in the nearest slot, highlighted, whatever its size', () => {
    const out = backdropPods(doc([pod('big', 4100, 16), pod('mine', 60, 30), pod('mid', 300, 20)]), 'mine', SLOTS);
    expect(out[0]).toMatchObject({ id: 'mine', slot: 'near', yours: true });
    expect(out.slice(1).map((p) => [p.id, p.yours])).toEqual([['big', false], ['mid', false]]);
  });

  it('ignores a display pod that is not published', () => {
    const out = backdropPods(doc([pod('a', 60, 10)]), 'gone', SLOTS);
    expect(out[0]).toMatchObject({ id: 'a', yours: false });
  });

  it('lit fraction is fortified pct / 100; no pct means dim (null)', () => {
    const out = backdropPods(doc([pod('a', 264, 24), pod('b', 60)]), null, SLOTS);
    expect(out[0].lit).toBeCloseTo(0.24);
    expect(out[1].lit).toBeNull();
  });

  it('height grows with log(players), the largest pod is 1', () => {
    const out = backdropPods(doc([pod('a', 10000), pod('b', 100)]), null, SLOTS);
    expect(out[0].height).toBe(1);
    expect(out[1].height).toBeCloseTo(0.5);
  });

  it('labels read "Seattle · 264 players · 24% fortified"', () => {
    const out = backdropPods(doc([{ id: 's', label: 'Seattle', players: 264, fortified: { pct: 24 } }, { id: 'g', label: 'Glasgow', players: 1234 }]), null, SLOTS);
    expect(out.map((p) => p.text)).toEqual(['Glasgow · 1,234 players', 'Seattle · 264 players · 24% fortified']);
  });

  it('empty slot list or no published pods places nothing', () => {
    expect(backdropPods(doc([pod('a', 60)]), null, [])).toEqual([]);
    expect(backdropPods(doc([]), null, SLOTS)).toEqual([]);
  });
});

describe('COLLECTIVE_SCREENS', () => {
  it('the city map loads the collective data too', () => {
    expect(COLLECTIVE_SCREENS).toEqual(expect.arrayContaining(['together', 'city']));
  });
});
