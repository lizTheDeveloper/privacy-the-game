import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { sanitizeHref } from '../src/utils/pageview-url.js';

// index.html's inline loader is a classic script: run it with stubs and take
// the Umami before-send hook and the script tag it injects.
const html = readFileSync('src/index.html', 'utf8');
const loader = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('__rcLoadAnalytics'));

function run({ off = false } = {}) {
  const appended = [];
  const el = () => { const attrs = {}; return { attrs, setAttribute: (k, v) => { attrs[k] = v; } }; };
  const ctx = {
    location: { hostname: 'reclaim.example' },
    localStorage: { getItem: () => (off ? '1' : null) },
    document: { createElement: el, head: { appendChild: (s) => appended.push(s) } },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(loader, ctx);
  return { hook: ctx.__rcBeforeSend, appended };
}

const PRIVATE = [
  ['https://x/reclaim-city/#/building/gmail', 'https://x/reclaim-city/#/building'],
  ['https://x/reclaim-city/#/mission/gmail-recon-login/recheck', 'https://x/reclaim-city/#/mission/recheck'],
  // A mission for an account the player added by hand (data/custom-missions.js), on any of its screens.
  ['https://x/reclaim-city/#/mission/custom_square_1a2b3c_signin/briefing', 'https://x/reclaim-city/#/mission/custom'],
  ['https://x/reclaim-city/#/mission/custom_square_1a2b3c_signin/debrief', 'https://x/reclaim-city/#/mission/custom'],
  ['https://x/reclaim-city/#/mission/custom_square_1a2b3c_signin/recheck', 'https://x/reclaim-city/#/mission/custom'],
];
const PUBLIC = [
  'https://x/reclaim-city/#/district/master-keys',
  'https://x/reclaim-city/#/mission/gmail-recon-login/briefing',
  'https://x/reclaim-city/',
  'https://www.google.com/',
  '',
];

describe('Umami before-send hook (index.html)', () => {
  it('the injected tracker names the hook, and the hook exists before it loads', () => {
    const { hook, appended } = run();
    expect(typeof hook).toBe('function');
    expect(appended).toHaveLength(1);
    expect(appended[0].attrs['data-before-send']).toBe('__rcBeforeSend');
  });

  it('strips the account and mission id from url and referrer; other fields untouched', () => {
    const { hook } = run();
    for (const [raw, clean] of PRIVATE) {
      const payload = { website: 'w', hostname: 'x', screen: '390x844', language: 'en', title: 'building', url: raw, referrer: raw, name: 'mission_complete', data: { district: 'master-keys', url: raw } };
      const out = hook('event', payload);
      expect(out.url).toBe(clean);
      expect(out.referrer).toBe(clean);
      expect(out).toMatchObject({ website: 'w', hostname: 'x', screen: '390x844', language: 'en', title: 'building', name: 'mission_complete' });
      // Custom event data is not the hook's to rewrite.
      expect(out.data).toEqual({ district: 'master-keys', url: raw });
    }
  });

  it('leaves every other url alone, and adds no fields', () => {
    const { hook } = run();
    for (const u of PUBLIC) expect(hook('pageview', { url: u, referrer: u })).toEqual({ url: u, referrer: u });
    expect(hook('event', { name: 'x' })).toEqual({ name: 'x' });
  });

  it('never throws and always returns the payload', () => {
    const { hook } = run();
    expect(hook('event', undefined)).toBeUndefined();
    expect(hook('event', null)).toBeNull();
    const frozen = Object.freeze({ url: 'https://x/#/building/gmail' });
    expect(() => hook('event', frozen)).not.toThrow();
    expect(hook('event', frozen)).toBe(frozen);
    expect(hook('pageview', { url: 42, referrer: null })).toEqual({ url: 42, referrer: null });
  });

  it('matches sanitizeHref (pageview-url.js) on every case', () => {
    const { hook } = run();
    for (const u of [...PRIVATE.map(([r]) => r), ...PUBLIC, 'https://x/#/building/gmail/extra', 'https://x/#/building/']) {
      expect(hook('event', { url: u }).url, u).toBe(sanitizeHref(u));
    }
  });

  it('nothing loads when sharing is off', () => {
    expect(run({ off: true }).appended).toHaveLength(0);
  });
});
