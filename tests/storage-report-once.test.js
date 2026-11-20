// A browser that can't save fails every save, and the game saves on every tap:
// one player in Instagram's browser sent GlitchTip a report per tap. Liz
// 2026-11-18: send the storage-failure report once per visit (page load), not
// once per save. Every failure still goes to the console; other errors, and a
// save that fails for another reason (a state JSON can't hold), report as before.
import { describe, it, expect, beforeEach, vi } from 'vitest';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function fullStorage() {
  return {
    getItem: () => null,
    setItem: () => { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); },
    removeItem: () => {},
  };
}

let Sentry;
async function load({ off = false } = {}) {
  vi.resetModules();
  globalThis.localStorage = memoryStorage();
  if (off) localStorage.setItem('reclaim-city.analytics-off', '1');
  const et = new EventTarget();
  globalThis.window = et;
  globalThis.addEventListener = et.addEventListener.bind(et);
  globalThis.removeEventListener = et.removeEventListener.bind(et);
  globalThis.dispatchEvent = et.dispatchEvent.bind(et);
  globalThis.location = { hostname: 'play.multiversegames.ai', origin: 'https://play.multiversegames.ai', href: 'https://play.multiversegames.ai/reclaim-city/#/city' };
  Sentry = { init: vi.fn(), close: vi.fn(() => Promise.resolve(true)), captureException: vi.fn() };
  globalThis.Sentry = Sentry;
  const errors = await import('../src/utils/errors.js');
  const state = await import('../src/state.js');
  const pref = await import('../src/utils/analytics-pref.js');
  errors.initErrorTracking();
  return { errors, state, pref };
}

describe('a browser that cannot save reports it once per visit', () => {
  let consoleError;
  beforeEach(() => {
    delete globalThis.umami;
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('three failing saves send one report, with its context; all three reach the console', async () => {
    const { state } = await load();
    const bad = fullStorage();
    const s = state.createInitialState();
    state.saveState(s, bad);
    state.saveState(s, bad);
    state.saveState(s, bad);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [err, hint] = Sentry.captureException.mock.calls[0];
    expect(err.name).toBe('QuotaExceededError');
    expect(hint).toEqual({ extra: { operation: 'saveState' } });
    expect(consoleError).toHaveBeenCalledTimes(3);
  });

  it("app.js's wrappers share the same once: no second report from them", async () => {
    const { state, errors } = await load();
    state.saveState(state.createInitialState(), fullStorage());
    errors.captureStorageWriteError(new Error('wrapper'), { screen: 'saveState' });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(2);
  });

  it('a fresh visit (reset) sends again', async () => {
    const { state, errors } = await load();
    const bad = fullStorage();
    state.saveState(state.createInitialState(), bad);
    state.saveState(state.createInitialState(), bad);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    errors._resetStorageWriteReport();
    state.saveState(state.createInitialState(), bad);
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
  });

  it('an unrelated captureError still reports every time, before and after a storage failure', async () => {
    const { state, errors } = await load();
    errors.captureError(new Error('boom'), { operation: 'test' });
    state.saveState(state.createInitialState(), fullStorage());
    errors.captureError(new Error('boom again'), { operation: 'test' });
    errors.captureError(new Error('and again'), { operation: 'test' });
    expect(Sentry.captureException).toHaveBeenCalledTimes(4);
  });

  it('a state JSON cannot hold is a bug, not a storage failure: it reports on every save', async () => {
    const { state } = await load();
    const circular = state.createInitialState();
    circular.self = circular;
    const good = memoryStorage();
    state.saveState(circular, good);
    state.saveState(circular, good);
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
    expect(Sentry.captureException.mock.calls[0][0]).toBeInstanceOf(TypeError);
    // ...and it doesn't use up the storage report.
    state.saveState(state.createInitialState(), fullStorage());
    expect(Sentry.captureException).toHaveBeenCalledTimes(3);
  });

  it('with sharing off nothing is sent and the once is not used up', async () => {
    const { state, pref } = await load({ off: true });
    const bad = fullStorage();
    state.saveState(state.createInitialState(), bad);
    expect(Sentry.captureException).not.toHaveBeenCalled();
    pref.setAnalyticsOff(false);
    state.saveState(state.createInitialState(), bad);
    state.saveState(state.createInitialState(), bad);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
