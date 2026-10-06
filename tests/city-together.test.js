import { describe, it, expect, beforeEach } from 'vitest';
import { renderCityTogether, cityStats } from '../src/screens/city-together.js';
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
    expect(html).toContain("Loading this page doesn't track you.");
    expect(html).toMatch(/in places with enough players to count, this share has been fixed/);
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

describe('The Whole City: the city in numbers', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  const FULL = {
    ...DATA,
    city: { ...DATA.city, breachChecks: 9388, breachRatePct: 58, breach3PlusPct: 46, actions: 22534, districts: 365,
            passwords: 1683, twoFactor: 1502, creditFreezes: 151, privacy: 1312, brokerOptOuts: 402, historyReviewed: 96,
            countries: 97, phonePct: 74 },
  };
  const panel = (html, key) => {
    const at = html.indexOf(`data-stat-panel="${key}"`);
    return at < 0 ? null : html.slice(at, html.indexOf('</button>', at));
  };

  it('one panel per numeric figure, in order', () => {
    expect(cityStats(FULL.city).map((s) => s.key)).toEqual([
      'players', 'actions', 'breachChecks', 'breachRatePct', 'passwords', 'twoFactor', 'creditFreezes', 'privacy',
      'brokerOptOuts', 'historyReviewed', 'districts', 'countries', 'phonePct', 'ghosts', 'optedOut',
    ]);
  });

  it('renders each figure with its words', () => {
    const html = renderCityTogether(createInitialState(), { collective: { status: 'ready', data: FULL } });
    expect(panel(html, 'players')).toMatch(/11,865/);
    expect(panel(html, 'actions')).toMatch(/22,534/);
    expect(panel(html, 'breachChecks')).toMatch(/9,388/);
    expect(panel(html, 'breachRatePct')).toMatch(/58%[\s\S]*46% in three or more/);
    expect(panel(html, 'passwords')).toMatch(/1,683[\s\S]*PASSWORDS CHANGED|PASSWORDS CHANGED[\s\S]*1,683/);
    expect(panel(html, 'twoFactor')).toMatch(/1,502/);
    expect(panel(html, 'creditFreezes')).toMatch(/151/);
    expect(panel(html, 'privacy')).toMatch(/1,312/);
    expect(panel(html, 'brokerOptOuts')).toMatch(/402/);
    expect(panel(html, 'historyReviewed')).toMatch(/96/);
    expect(panel(html, 'districts')).toMatch(/365/);
    expect(panel(html, 'countries')).toMatch(/97/);
    expect(panel(html, 'phonePct')).toMatch(/74%/);
    expect(panel(html, 'ghosts')).toMatch(/3/);
    expect(panel(html, 'optedOut')).toMatch(/12/);
  });

  it('each panel offers SHARE', () => {
    const html = renderCityTogether(createInitialState(), { collective: { status: 'ready', data: FULL } });
    for (const s of cityStats(FULL.city)) expect(panel(html, s.key)).toContain(`data-action="share-stat" data-stat="${s.key}"`);
  });

  it('figures that are absent or not numbers get no panel', () => {
    const city = { players: 11865, passwords: 'lots', twoFactor: null, phonePct: NaN, breach3PlusPct: 40 };
    expect(cityStats(city).map((s) => s.key)).toEqual(['players']);
    const html = renderCityTogether(createInitialState(), { collective: { status: 'ready', data: { ...DATA, city } } });
    expect(html).not.toContain('data-stat-panel="passwords"');
    expect(html).not.toMatch(/undefined|NaN/);
  });

  it('breach rate without the 3+ figure has no sub line', () => {
    expect(cityStats({ breachRatePct: 58 })[0].sub).toBe('');
  });

  it('the existing panels are still there, unchanged', () => {
    const before = renderCityTogether(createInitialState(), { collective: ready });
    const after = renderCityTogether(createInitialState(), { collective: { status: 'ready', data: FULL } });
    for (const marker of ['CITY FORTIFIED', 'PLACES', 'ADDRESSES FOUND IN A KNOWN BREACH', 'YOUR PART', 'GO GHOST', 'anonymous browser sessions']) {
      expect(after).toContain(marker);
      expect(before).toContain(marker);
    }
  });

  it('no figures panel while loading or on error', () => {
    for (const status of ['loading', 'error']) {
      expect(renderCityTogether(createInitialState(), { collective: { status } })).not.toContain('data-stat-panel');
    }
  });
});
