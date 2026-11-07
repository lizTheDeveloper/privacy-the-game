// After a deploy the first load runs the new code (logic sweep #7). sw.js used
// to answer every script from its cache and refresh it behind the page, so the
// first open after each release ran the old JavaScript against the new
// stylesheet, and a bug report from it carried the new version label.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync('src/sw.js', 'utf8');
const ORIGIN = 'https://x.test';
const BASE = `${ORIGIN}/reclaim-city/`;

// A small service-worker world: one cache store, a network we control.
function world() {
  const listeners = {};
  const store = new Map(); // url -> body
  const res = (body, extra = {}) => ({ ok: true, body, redirected: false, clone() { return res(body, extra); }, ...extra });
  const net = { online: true, files: new Map(), calls: [] };
  const abs = (r) => new URL(typeof r === 'string' ? r : r.url, BASE).href;
  const cache = {
    put: async (r, v) => { store.set(abs(r), v.body); },
    addAll: async (list) => { for (const u of list) store.set(abs(u), net.files.get(abs(u)) ?? 'precached'); },
  };
  const ctx = {
    self: { addEventListener: (t, f) => { listeners[t] = f; }, skipWaiting() {}, clients: { claim() {} } },
    location: new URL(`${BASE}sw.js`),
    URL,
    caches: {
      open: async () => cache,
      match: async (r) => (store.has(abs(r)) ? res(store.get(abs(r))) : undefined),
      keys: async () => [],
    },
    fetch: async (r, init) => {
      net.calls.push({ url: abs(r), init });
      if (!net.online) throw new TypeError('Failed to fetch');
      return res(net.files.get(abs(r)) ?? `404 ${abs(r)}`, { ok: net.files.has(abs(r)) });
    },
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const get = async (path, { mode = 'cors', destination = 'script' } = {}) => {
    let p;
    const settle = [];
    listeners.fetch({ request: { url: new URL(path, BASE).href, mode, destination, method: 'GET' }, respondWith: (x) => { p = x; }, waitUntil: (x) => settle.push(x) });
    if (!p) return 'not intercepted';
    const r = await p;
    await Promise.all(settle);
    await new Promise((ok) => setTimeout(ok, 0));
    return r?.body;
  };
  return { store, net, get, abs };
}

describe('service worker: code is network-first', () => {
  let w;
  beforeEach(() => { w = world(); });

  it('a script cached from the last release is not served when the network has the new one', async () => {
    w.store.set(w.abs('app.js'), 'old app');
    w.store.set(w.abs('utils/calc.js'), 'old calc');
    w.net.files.set(w.abs('app.js'), 'new app');
    w.net.files.set(w.abs('utils/calc.js'), 'new calc');
    expect(await w.get('app.js')).toBe('new app');
    expect(await w.get('utils/calc.js')).toBe('new calc');
    // and the cache now holds the new copy, for offline
    expect(w.store.get(w.abs('utils/calc.js'))).toBe('new calc');
  });

  it('asks past the browser cache (nginx gives static files a long max-age)', async () => {
    w.net.files.set(w.abs('app.js'), 'new app');
    await w.get('app.js');
    expect(w.net.calls.at(-1).init?.cache).toBe('no-cache');
  });

  it('JSON data and the stylesheet are network-first too', async () => {
    w.store.set(w.abs('data/broker-map.json'), 'old map');
    w.net.files.set(w.abs('data/broker-map.json'), 'new map');
    expect(await w.get('data/broker-map.json', { destination: '' })).toBe('new map');
    w.store.set(w.abs('style.css?v=1'), 'old css');
    w.net.files.set(w.abs('style.css?v=1'), 'new css');
    expect(await w.get('style.css?v=1', { destination: 'style' })).toBe('new css');
  });

  it('offline, the last copy that loaded is served, so the game still plays', async () => {
    w.net.files.set(w.abs('app.js'), 'v2 app');
    w.net.files.set(w.abs('index.html'), 'v2 page');
    await w.get('app.js');
    await w.get('index.html', { mode: 'navigate', destination: 'document' });
    w.net.online = false;
    expect(await w.get('app.js')).toBe('v2 app');
    // the page offline is the newest one that loaded, so it asks for the same release's stylesheet
    expect(await w.get('index.html', { mode: 'navigate', destination: 'document' })).toBe('v2 page');
    expect(await w.get('./', { mode: 'navigate', destination: 'document' })).toBe('v2 page');
  });

  it('API answers are still never touched', async () => {
    w.store.set(w.abs('api/whoami'), 'cached who');
    expect(await w.get('api/whoami', { destination: '' })).toBe('not intercepted');
    expect(w.net.calls).toEqual([]);
  });
});
