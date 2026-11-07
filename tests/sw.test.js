import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// sw.js is a classic script, so evaluate it with stubs and pull the pieces out.
const src = readFileSync('src/sw.js', 'utf8');
const listeners = {};
const stored = [];
const ctx = {
  self: { addEventListener: (type, fn) => { listeners[type] = fn; } },
  location: { origin: 'https://x.test' },
  URL,
  caches: {
    match: async () => undefined,
    open: async () => ({ put: async (req, res) => { stored.push([req.url, res]); } }),
  },
  fetch: async () => ({ ok: true, clone() { return { cloned: true }; } }),
};
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__t = { shouldIntercept, CACHE_NAME };', ctx);
const { shouldIntercept, CACHE_NAME } = ctx.__t;

describe('service worker', () => {
  it('never intercepts API requests', () => {
    expect(shouldIntercept(new URL('https://x.test/api/whoami'))).toBe(false);
    expect(shouldIntercept(new URL('https://x.test/reclaim-city/api/collective.json'))).toBe(false);
  });
  it('still handles the app shell', () => {
    expect(shouldIntercept(new URL('https://x.test/reclaim-city/app.js'))).toBe(true);
    expect(shouldIntercept(new URL('https://x.test/'))).toBe(true);
  });
  it('cache name moved past v1 so old stored API answers are dropped', () => {
    expect(CACHE_NAME).not.toBe('reclaim-city-v1');
  });
  it('caches the broker map data files', async () => {
    expect(shouldIntercept(new URL('https://x.test/reclaim-city/data/broker-map.json'))).toBe(true);
    expect(shouldIntercept(new URL('https://x.test/reclaim-city/data/broker-layout.json'))).toBe(true);
    // Through the real fetch handler: the network answer is put in the cache.
    stored.length = 0;
    for (const url of ['https://x.test/reclaim-city/data/broker-map.json', 'https://x.test/reclaim-city/data/broker-layout.json']) {
      let answered = null;
      listeners.fetch({ request: { url, mode: 'cors' }, respondWith: (p) => { answered = p; } });
      expect(answered, url).not.toBeNull();
      await answered;
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(stored.map(([u]) => u)).toEqual(['https://x.test/reclaim-city/data/broker-map.json', 'https://x.test/reclaim-city/data/broker-layout.json']);
    expect(stored[0][1]).toEqual({ cloned: true });
  });

  it('leaves API answers to the network: no respondWith, nothing cached', () => {
    stored.length = 0;
    let answered = false;
    listeners.fetch({ request: { url: 'https://x.test/reclaim-city/api/collective.json', mode: 'cors' }, respondWith: () => { answered = true; } });
    expect(answered).toBe(false);
    expect(stored).toEqual([]);
  });
});
