// Boots the real src/app.js in node with a tiny fake browser, so a test can
// drive the real click handlers and watch everything that could leave the
// device: umami.track (every analytics.js path ends there), fetch and
// navigator.sendBeacon. No jsdom: the fake DOM only does what app.js asks of
// it, and querySelector answers come from the test (`setQuery`).
//
// Use from a test file:
//   const h = await bootApp({ state, hash: '#/district/vault' });
//   h.setQuery('#pm-cat-num-vault', { value: '7' });
//   await h.click('pm-cat-flag', { district: 'vault' });
//   expect(h.egress()).toEqual([]);
import { vi } from 'vitest';

class FakeClassList {
  constructor() { this.set = new Set(); }
  add(...c) { for (const x of c) this.set.add(x); }
  remove(...c) { for (const x of c) this.set.delete(x); }
  toggle(c, on) { const want = on ?? !this.set.has(c); if (want) this.set.add(c); else this.set.delete(c); return want; }
  contains(c) { return this.set.has(c); }
}

export class FakeEl {
  // loose: unknown querySelector()s answer with a fresh element instead of null
  // (for the page furniture outside #app: the bug dialog, the class ad).
  constructor({ dataset = {}, value, matches = () => false, loose = false } = {}) {
    this.loose = loose;
    this.dataset = { ...dataset };
    this.value = value;
    this.hidden = true;
    this.innerHTML = '';
    this.classList = new FakeClassList();
    this.style = { setProperty() {}, removeProperty() {} };
    this.listeners = {};
    this.queries = new Map();
    this.queryAll = new Map();
    this._matches = matches;
    this.focused = 0;
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn); }
  querySelector(sel) { return this.queries.get(sel) ?? (this.loose ? new FakeEl({ loose: true }) : null); }
  get firstElementChild() { return new FakeEl({ loose: true }); }
  get isConnected() { return true; }
  querySelectorAll(sel) { return this.queryAll?.get(sel) ?? []; }
  closest(sel) { return this._matches(sel) ? this : null; }
  matches(sel) { return this._matches(sel); }
  contains() { return true; }
  focus() { this.focused += 1; }
  scrollIntoView() {}
  getBoundingClientRect() { return { x: 0, y: 0, top: 0, left: 0, width: 400, height: 800, right: 400, bottom: 800 }; }
  setAttribute() {}
  removeAttribute() {}
  getAttribute() { return null; }
  appendChild(c) { return c; }
  remove() {}
}

function memoryStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

// Installs the fake browser, seeds the save, imports app.js fresh.
export async function bootApp({ state, hash = '#/city', storage = {} } = {}) {
  vi.resetModules();
  const app = new FakeEl();
  const body = new FakeEl();
  const docListeners = {};
  const winListeners = {};
  const umami = { track: vi.fn(() => Promise.resolve()) };
  const fetchSpy = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => '' }));
  const beacon = vi.fn(() => true);
  const seed = { ...storage };
  if (state) seed['reclaim-city-state'] = JSON.stringify(state);
  const localStorage = memoryStorage(seed);
  const location = { hash, href: `https://example.test/${hash}`, hostname: 'example.test', origin: 'https://example.test', pathname: '/', search: '' };
  const document = {
    getElementById: (id) => (id === 'app' ? app : null),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => new FakeEl({ loose: true }),
    addEventListener: (t, fn) => { (docListeners[t] ||= []).push(fn); },
    removeEventListener() {},
    body,
    head: new FakeEl(),
    documentElement: new FakeEl(),
    activeElement: null,
    visibilityState: 'visible',
    title: '',
  };
  const window = {
    innerWidth: 400,
    innerHeight: 800,
    addEventListener: (t, fn) => { (winListeners[t] ||= []).push(fn); },
    removeEventListener() {},
    location,
    localStorage,
    open: vi.fn(),
  };
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', document);
  vi.stubGlobal('location', location);
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('history', { replaceState() {}, pushState() {} });
  vi.stubGlobal('navigator', { sendBeacon: beacon, userAgent: 'node', language: 'en-US', serviceWorker: undefined });
  vi.stubGlobal('CSS', { escape: (s) => String(s) });
  vi.stubGlobal('umami', umami);
  vi.stubGlobal('fetch', fetchSpy);
  vi.stubGlobal('requestAnimationFrame', (fn) => setTimeout(fn, 0));
  vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id));

  await import('../../src/app.js');

  const fire = async (type, target) => {
    const event = { type, target, clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {} };
    await Promise.all((app.listeners[type] || []).map((fn) => fn(event)));
    // Let any timers the handler set (a re-render) run.
    await new Promise((r) => setTimeout(r, 0));
  };

  return {
    app,
    window,
    state: () => window.reclaimCity.state,
    setQuery: (selector, opts) => {
      const el = opts instanceof FakeEl ? opts : new FakeEl(opts);
      app.queries.set(selector, el);
      return el;
    },
    setQueryAll: (selector, list) => {
      const els = list.map((o) => (o instanceof FakeEl ? o : new FakeEl(o)));
      app.queryAll.set(selector, els);
      return els;
    },
    // A click on an element carrying data-action (and its other data-* fields).
    click: (action, dataset = {}) => fire('click', new FakeEl({
      dataset: { action, ...dataset },
      matches: (sel) => sel === '[data-action]',
    })),
    // Any other event on #app (submit, change, input) with a target the test builds.
    fire: (type, target) => fire(type, target),
    // Every timer the handlers set (Scout's cheer before a navigation) has run.
    settle: (ms = 2000) => new Promise((r) => setTimeout(r, ms)),
    // Everything that could have left the device, as [channel, ...args] rows.
    egress: () => [
      ...umami.track.mock.calls.map((a) => ['umami.track', ...a]),
      ...fetchSpy.mock.calls.map((a) => ['fetch', ...a]),
      ...beacon.mock.calls.map((a) => ['sendBeacon', ...a]),
    ],
    clearEgress: () => { umami.track.mockClear(); fetchSpy.mockClear(); beacon.mockClear(); },
    umami,
    fetch: fetchSpy,
  };
}
