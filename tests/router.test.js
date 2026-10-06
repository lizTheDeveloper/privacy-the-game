import { describe, it, expect } from 'vitest';
import { parseRoute } from '../src/router.js';

describe('parseRoute', () => {
  it('parses city map route', () => {
    expect(parseRoute('#/city')).toEqual({ screen: 'city', params: {} });
  });

  it('parses district route', () => {
    expect(parseRoute('#/district/master-keys')).toEqual({
      screen: 'district',
      params: { id: 'master-keys' },
    });
  });

  it('parses district route with tab query parameter', () => {
    expect(parseRoute('#/district/master-keys?tab=fortify')).toEqual({
      screen: 'district',
      params: { id: 'master-keys', tab: 'fortify' },
    });
    expect(parseRoute('#/district/master-keys?tab=reclaim')).toEqual({
      screen: 'district',
      params: { id: 'master-keys', tab: 'reclaim' },
    });
    expect(parseRoute('#/district/master-keys?tab=survey')).toEqual({
      screen: 'district',
      params: { id: 'master-keys', tab: 'survey' },
    });
  });

  it('parses mission briefing route', () => {
    expect(parseRoute('#/mission/gmail-recon-breach/briefing')).toEqual({
      screen: 'briefing',
      params: { id: 'gmail-recon-breach' },
    });
  });

  it('parses mission debrief route', () => {
    expect(parseRoute('#/mission/gmail-recon-breach/debrief')).toEqual({
      screen: 'debrief',
      params: { id: 'gmail-recon-breach' },
    });
  });

  it('parses stats route', () => {
    expect(parseRoute('#/stats')).toEqual({ screen: 'stats', params: {} });
  });

  it('parses milestone route', () => {
    expect(parseRoute('#/milestone/master-keys')).toEqual({
      screen: 'milestone',
      params: { districtId: 'master-keys' },
    });
  });

  it('routes the whole city', () => {
    expect(parseRoute('#/city-together')).toEqual({ screen: 'together', params: {} });
  });

  it('defaults to city for unknown routes', () => {
    expect(parseRoute('#/unknown')).toEqual({ screen: 'city', params: {} });
    expect(parseRoute('')).toEqual({ screen: 'city', params: {} });
  });
});

describe('pageviews follow navigation, not re-renders', async () => {
  const { initRouter, tracksPageview, RENDER_CAUSE } = await import('../src/router.js');

  it('only a navigation counts as a pageview', () => {
    expect(tracksPageview(RENDER_CAUSE.NAVIGATE)).toBe(true);
    expect(tracksPageview(RENDER_CAUSE.REFRESH)).toBe(false);
    expect(tracksPageview(undefined)).toBe(false); // a bare re-render (data arrived, an action) never counts
  });

  it('initRouter renders the first load and each hashchange as navigations', () => {
    const listeners = {};
    const saved = { window: globalThis.window, location: globalThis.location };
    globalThis.window = { addEventListener: (ev, fn) => { listeners[ev] = fn; } };
    globalThis.location = { hash: '#/city' };
    const calls = [];
    try {
      initRouter((route, cause) => calls.push([route.screen, cause]));
      globalThis.location.hash = '#/city-together';
      listeners.hashchange();
    } finally {
      globalThis.window = saved.window;
      globalThis.location = saved.location;
    }
    expect(calls).toEqual([['city', RENDER_CAUSE.NAVIGATE], ['together', RENDER_CAUSE.NAVIGATE]]);
  });
});

describe('app.js wiring: data arriving never logs a pageview', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const body = (name) => {
    const at = src.indexOf(`function ${name}(`);
    return src.slice(at, src.indexOf('\n}\n', at));
  };

  it('render tracks only when the cause is a navigation', () => {
    expect(body('render')).toMatch(/if \(tracksPageview\(cause\)\) trackPageview\(/);
    expect((src.match(/trackPageview\(/g) || []).length).toBe(1);
    expect(body('render')).toContain('cause = RENDER_CAUSE.REFRESH');
    expect(body('renderCurrentRoute')).toContain('cause = RENDER_CAUSE.REFRESH');
  });

  it('loadCollective and loadWhoami re-render as refreshes', () => {
    for (const fn of ['loadCollective', 'loadWhoami']) {
      const b = body(fn);
      expect(b).toContain('renderCurrentRoute()');
      expect(b).not.toContain('NAVIGATE');
    }
  });

  it('only leaving the welcome screen asks for a navigation outside the router', () => {
    expect((src.match(/RENDER_CAUSE\.NAVIGATE/g) || []).length).toBe(1);
    expect(src).toMatch(/begin-game[\s\S]{0,300}renderCurrentRoute\(RENDER_CAUSE\.NAVIGATE\)/);
  });
});
