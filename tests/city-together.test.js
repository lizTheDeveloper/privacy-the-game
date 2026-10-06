import { describe, it, expect, beforeEach } from 'vitest';
import { renderCityTogether } from '../src/screens/city-together.js';
import { createInitialState } from '../src/state.js';
import { shouldAutoLoad } from '../src/utils/collective.js';
import { setChosenPod } from '../src/utils/pod-pref.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

const DATA = {
  k: 50, asOf: '2026-10-06T04:00:00Z',
  city: { players: 11865, fortified: { pct: 18, fixed: 970, breached: 5424 }, ghosts: 3, optedOut: 12,
          byAddress: [{ id: 'gmail', label: 'Gmail', checks: 2759, breachRatePct: 85 }] },
  pods: [
    { id: 'us-il-chicago', label: 'Chicago', players: 312, fortified: { pct: 22 }, ghosts: 1 },
    { id: 'us-wa-seattle', label: 'Seattle', players: 300, fortified: { pct: 30 } },
    { id: 'gb', label: 'United Kingdom' },
  ],
};
const ready = { status: 'ready', data: DATA };

describe('The Whole City', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('shows the city score, board, breach map and footer', () => {
    const html = renderCityTogether(createInitialState(), { collective: ready });
    expect(html).toContain('CITY FORTIFIED');
    expect(html).toMatch(/18%/);
    expect(html).toMatch(/Gmail/);
    expect(html).toMatch(/85%/);
    expect(html.indexOf('Seattle')).toBeLessThan(html.indexOf('Chicago'));
    expect(html).toMatch(/anonymous browser sessions/);
    expect(html).toMatch(/12 opted out/);
  });

  it('highlights your pod and shows its numbers', () => {
    setChosenPod('us-il-chicago');
    const html = renderCityTogether(createInitialState(), { collective: ready });
    expect(html).toMatch(/Chicago · 312 players · 22% fortified/);
    expect(html).toMatch(/1 have gone ghost here/);
    expect(html).toMatch(/data-yours="true"[^>]*>[\s\S]*?Chicago/);
  });

  it('your part comes from local state', () => {
    const s = createInitialState();
    s.missions['gmail-recon-breach'] = { status: 'completed', finding: '3plus-breaches' };
    const html = renderCityTogether(s, { collective: ready });
    expect(html).toMatch(/You found 1 breached account and fixed 0/);
  });

  it('error shows no collective figures', () => {
    const html = renderCityTogether(createInitialState(), { collective: { status: 'error' } });
    expect(html).toMatch(/Couldn't reach the city tonight/);
    expect(html).not.toMatch(/18%|11,865|Gmail|CITY FORTIFIED|Seattle|Chicago/);
  });

  it('loading and idle show the gathering line', () => {
    expect(renderCityTogether(createInitialState(), { collective: { status: 'loading' } })).toMatch(/Gathering the city…/);
    expect(renderCityTogether(createInitialState())).toMatch(/Gathering the city…/);
  });

  it('missing figures never render undefined or NaN', () => {
    const sparse = { status: 'ready', data: { asOf: 'x', city: {}, pods: [{ id: 'gb', label: 'United Kingdom' }] } };
    const html = renderCityTogether(createInitialState(), { collective: sparse });
    expect(html).toMatch(/Not enough players yet to say/);
    expect(html).not.toMatch(/undefined|NaN/);
  });

  it('escapes labels', () => {
    const evil = { status: 'ready', data: { ...DATA, pods: [{ id: 'x', label: '<img src=x>' }] } };
    expect(renderCityTogether(createInitialState(), { collective: evil })).not.toContain('<img src=x>');
  });

  it('error view offers a retry control', () => {
    const html = renderCityTogether(createInitialState(), { collective: { status: 'error' } });
    expect(html).toContain('data-action="collective-retry"');
  });
});

describe('shouldAutoLoad', () => {
  it('fires only from idle on collective screens', () => {
    expect(shouldAutoLoad('together', 'idle')).toBe(true);
    for (const st of ['loading', 'ready', 'error']) expect(shouldAutoLoad('together', st)).toBe(false);
    expect(shouldAutoLoad('stats', 'idle')).toBe(false);
    expect(shouldAutoLoad('ghost', 'idle', ['ghost', 'ghost-done'])).toBe(true);
    expect(shouldAutoLoad('ghost', 'error', ['ghost'])).toBe(false);
  });
});
