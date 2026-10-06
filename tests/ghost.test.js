import { describe, it, expect, beforeEach } from 'vitest';
import { isCityComplete, hasGoneGhost, markGoneGhost, getGhostInfo, GHOST_KEY } from '../src/utils/ghost.js';
import { renderGhost, renderGhostDone } from '../src/screens/ghost.js';
import { createInitialState } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { isCoreMission } from '../src/utils/calc.js';
import { setChosenPod } from '../src/utils/pod-pref.js';
import { parseRoute } from '../src/router.js';
import { setAnalyticsOff } from '../src/utils/analytics-pref.js';

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
    expect(getGhostInfo().silent).toBe(false);
    globalThis.localStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() {} };
    expect(hasGoneGhost()).toBe(false);
    expect(() => markGoneGhost()).not.toThrow();
  });
});

describe('screens', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); setAnalyticsOff(false); });

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
    markGoneGhost();
    const collective = { status: 'ready', data: { asOf: 'x', city: { ghosts: 311 },
      pods: [{ id: 'us-il-chicago', label: 'Chicago', ghosts: 12 }] } };
    const html = renderGhostDone(completeCity(), { collective });
    expect(html).toContain('YOU HAVE GONE GHOST');
    expect(html).toMatch(/one of 13 in Chicago and 312 across the city/);
  });

  it('finale adds +1 only when the ghost moment is later than the published file', () => {
    setChosenPod('us-il-chicago');
    localStorage.setItem(GHOST_KEY, JSON.stringify({ at: '2026-10-07T10:00:00Z', silent: false }));
    const mk = (asOf) => ({ collective: { status: 'ready', data: { asOf, city: { ghosts: 311 },
      pods: [{ id: 'us-il-chicago', label: 'Chicago', ghosts: 12 }] } } });
    // File published before they went ghost: not counted yet.
    expect(renderGhostDone(completeCity(), mk('2026-10-06T03:00:00Z'))).toMatch(/one of 13 in Chicago and 312 across/);
    // File published after: already counted.
    expect(renderGhostDone(completeCity(), mk('2026-10-08T03:00:00Z'))).toMatch(/one of 12 in Chicago and 311 across/);
    // Unparseable asOf: add one.
    expect(renderGhostDone(completeCity(), mk('nonsense'))).toMatch(/one of 13 in Chicago and 312 across/);
  });

  it('finale without numbers', () => {
    markGoneGhost();
    const html = renderGhostDone(completeCity(), { collective: { status: 'error' } });
    expect(html).toMatch(/newest ghost in the city/);
    expect(html).not.toMatch(/undefined|NaN/);
  });

  it('finale escapes pod labels', () => {
    setChosenPod('p');
    markGoneGhost();
    const collective = { status: 'ready', data: { asOf: 'x', city: { ghosts: 1 },
      pods: [{ id: 'p', label: '<img src=x>', ghosts: 1 }] } };
    expect(renderGhostDone(completeCity(), { collective })).not.toContain('<img src=x>');
  });

  it('#/ghost/done is gated: without having gone ghost it shows the briefing, or the locked panel', () => {
    const done = renderGhostDone(completeCity(), {});
    expect(done).not.toContain('YOU HAVE GONE GHOST');
    expect(done).toContain('data-action="go-ghost"');
    const locked = renderGhostDone(createInitialState(), {});
    expect(locked).not.toContain('YOU HAVE GONE GHOST');
    expect(locked).not.toContain('data-action="go-ghost"');
  });

  it('sharing already off: briefing shows the already-off sentence instead of the counted promise', () => {
    setAnalyticsOff(true);
    const html = renderGhost(completeCity(), {});
    expect(html).toContain("You'd already switched us off, so there was nothing left for us to stop.");
    expect(html).not.toMatch(/counted as one more person/);
  });

  it('silent ghost: finale shows no +1 and the already-off line', () => {
    markGoneGhost({ silent: true });
    expect(getGhostInfo().silent).toBe(true);
    const collective = { status: 'ready', data: { asOf: 'x', city: { ghosts: 311 }, pods: [] } };
    const html = renderGhostDone(completeCity(), { collective });
    expect(html).toContain("You'd already switched us off, so there was nothing left for us to stop.");
    expect(html).not.toMatch(/312|311|newest ghost/);
  });

  it('Scout\'s explanation ends with the honest sentence', () => {
    const html = renderGhost(completeCity(), {});
    expect(html).toContain('We keep nothing new about you after that.');
    expect(html).not.toContain('Nothing else about you is kept.');
  });
});
