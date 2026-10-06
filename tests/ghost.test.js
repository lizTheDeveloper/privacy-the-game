import { describe, it, expect, beforeEach } from 'vitest';
import { isCityComplete, hasGoneGhost, markGoneGhost } from '../src/utils/ghost.js';
import { renderGhost, renderGhostDone } from '../src/screens/ghost.js';
import { createInitialState } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { isCoreMission } from '../src/utils/calc.js';
import { setChosenPod } from '../src/utils/pod-pref.js';
import { parseRoute } from '../src/router.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function completeCity() {
  const s = createInitialState();
  for (const m of MISSIONS) {
    if (isCoreMission(m) && s.accounts[m.accountId]?.enabled) s.missions[m.id] = { status: 'completed' };
  }
  return s;
}

describe('isCityComplete', () => {
  it('false for a new player', () => expect(isCityComplete(createInitialState())).toBe(false));
  it('true when every enabled district core path is done', () => expect(isCityComplete(completeCity())).toBe(true));
  it('false when one core mission is left', () => {
    const s = completeCity();
    const left = MISSIONS.find((m) => isCoreMission(m) && s.accounts[m.accountId]?.enabled);
    delete s.missions[left.id];
    expect(isCityComplete(s)).toBe(false);
  });
  it('false when every account is disabled (nothing was ever played)', () => {
    const s = createInitialState();
    for (const a of Object.values(s.accounts)) a.enabled = false;
    expect(isCityComplete(s)).toBe(false);
  });
});

describe('ghost flag', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });
  it('persists and survives blocked storage', () => {
    expect(hasGoneGhost()).toBe(false);
    markGoneGhost();
    expect(hasGoneGhost()).toBe(true);
    globalThis.localStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() {} };
    expect(hasGoneGhost()).toBe(false);
    expect(() => markGoneGhost()).not.toThrow();
  });
});

describe('screens', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('routes', () => {
    expect(parseRoute('#/ghost').screen).toBe('ghost');
    expect(parseRoute('#/ghost/done').screen).toBe('ghost-done');
  });

  it('briefing explains what happens and offers the switch', () => {
    const html = renderGhost(completeCity(), { whoami: { status: 'idle' } });
    expect(html).toMatch(/It's us/);
    expect(html).toMatch(/Everything you already did stays in the city's totals/);
    expect(html).toContain('data-action="go-ghost"');
    expect(html).toContain('WHAT WE KNOW ABOUT YOU');
  });

  it('briefing is not reachable before the city is complete', () => {
    expect(renderGhost(createInitialState(), {})).not.toContain('data-action="go-ghost"');
  });

  it('already ghost: briefing shows the finale', () => {
    markGoneGhost();
    expect(renderGhost(completeCity(), {})).toContain('YOU HAVE GONE GHOST');
  });

  it('finale counts the player in, pod and city', () => {
    setChosenPod('us-il-chicago');
    const collective = { status: 'ready', data: { asOf: 'x', city: { ghosts: 311 },
      pods: [{ id: 'us-il-chicago', label: 'Chicago', ghosts: 12 }] } };
    const html = renderGhostDone(completeCity(), { collective });
    expect(html).toContain('YOU HAVE GONE GHOST');
    expect(html).toMatch(/one of 13 in Chicago and 312 across the city/);
  });

  it('finale without numbers', () => {
    const html = renderGhostDone(completeCity(), { collective: { status: 'error' } });
    expect(html).toMatch(/newest ghost in the city/);
    expect(html).not.toMatch(/undefined|NaN/);
  });

  it('finale escapes pod labels', () => {
    setChosenPod('p');
    const collective = { status: 'ready', data: { asOf: 'x', city: { ghosts: 1 },
      pods: [{ id: 'p', label: '<img src=x>', ghosts: 1 }] } };
    expect(renderGhostDone(completeCity(), { collective })).not.toContain('<img src=x>');
  });
});
