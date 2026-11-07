// api/whoami is sent only while sharing is on and the player hasn't gone ghost
// (logic sweep #8). The ghost screen used to look the player up on arrival
// whatever the switch said. SHOW ME on Your City is the lesson ("what any site
// sees"), so with sharing off it shows what the browser itself reports,
// read on the device, and sends nothing.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shouldAutoWhoami, lookUpWhoami, WHOAMI_URL } from '../src/utils/collective.js';
import { renderStats, renderWhoamiPanel } from '../src/screens/stats.js';
import { setAnalyticsOff } from '../src/utils/analytics-pref.js';
import { markGoneGhost } from '../src/utils/ghost.js';
import { createInitialState } from '../src/state.js';
import { textOf } from './helpers/on-page.mjs';
import { readFileSync } from 'node:fs';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const NAV = { language: 'en-US', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' };
const SCR = { width: 390, height: 844 };
const APP = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

describe('the ghost screen and the sky look the player up only while sharing is on', () => {
  it('sharing on: the ghost screen and a broker map with no home look up', () => {
    expect(shouldAutoWhoami('ghost', 'idle', { allowed: true, homeKnown: false })).toBe(true);
    expect(shouldAutoWhoami('broker-map', 'idle', { allowed: true, homeKnown: false })).toBe(true);
    expect(shouldAutoWhoami('broker-map', 'idle', { allowed: true, homeKnown: true })).toBe(false);
    expect(shouldAutoWhoami('ghost', 'ready', { allowed: true, homeKnown: false })).toBe(false);
    expect(shouldAutoWhoami('stats', 'idle', { allowed: true, homeKnown: false })).toBe(false);
  });

  it('sharing off or gone ghost: no screen looks up on its own', () => {
    for (const screen of ['ghost', 'broker-map', 'stats', 'city']) {
      expect(shouldAutoWhoami(screen, 'idle', { allowed: false, homeKnown: false }), screen).toBe(false);
    }
  });

  it('app.js decides with it, for every screen, and loads through lookUpWhoami', () => {
    expect(APP).toMatch(/if \(shouldAutoWhoami\(route\.screen, whoamiView\.status, \{ allowed: guessAllowed\(\)/);
    expect(APP).not.toMatch(/route\.screen === 'ghost' && whoamiView\.status === 'idle'/);
    expect(APP).toMatch(/const allowed = guessAllowed\(\);[\s\S]{0,200}lookUpWhoami\(\{ allowed \}\)/);
    expect(APP).not.toMatch(/fetchWhoami\(/);
  });
});

describe('SHOW ME follows the sharing switch', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('sharing on: asks api/whoami', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ city: 'Chicago' }) }));
    const view = await lookUpWhoami({ allowed: true, fetchImpl, nav: NAV, scr: SCR });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toMatch(new RegExp(`^${WHOAMI_URL}\\?`));
    expect(view).toEqual({ status: 'ready', data: { city: 'Chicago' } });
  });

  it('sharing off: sends nothing, and shows what the browser itself reports', async () => {
    const fetchImpl = vi.fn();
    const view = await lookUpWhoami({ allowed: false, fetchImpl, nav: NAV, scr: SCR });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(view).toEqual({ status: 'local', data: { language: 'en-US', screen: '390x844', userAgent: NAV.userAgent } });
    setAnalyticsOff(true);
    const text = textOf(renderStats(createInitialState(), { whoami: view }));
    expect(text).toContain('Sharing is off, so we didn\'t ask our server.');
    expect(text).toContain('en-US · 390x844');
    expect(text).toContain(NAV.userAgent);
    expect(text).toContain('Sharing is off. Nothing from this browser is sent.');
    expect(text).not.toContain('Asking our analytics');
  });

  it('gone ghost: the same local view', async () => {
    markGoneGhost({ silent: true });
    const view = await lookUpWhoami({ allowed: false, nav: NAV, scr: SCR, fetchImpl: vi.fn() });
    expect(textOf(renderWhoamiPanel({ whoami: view }))).toContain('we didn\'t ask our server');
  });

  it('a local view left over after sharing is turned back on offers SHOW ME again', () => {
    setAnalyticsOff(false);
    const html = renderWhoamiPanel({ whoami: { status: 'local', data: { language: 'en-US' } } });
    expect(html).toContain('data-action="whoami-open"');
    expect(textOf(html)).not.toContain('we didn\'t ask our server');
  });
});
