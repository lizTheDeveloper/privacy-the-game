import { describe, it, expect, beforeEach } from 'vitest';
import { parseCollective, fetchCollective, fetchWhoami, findPod, displayPodId, podBoard, yourPart, fmt } from '../src/utils/collective.js';
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
