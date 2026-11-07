// "Sharing is off. Nothing from this browser is sent." is true for error
// reports too (logic sweep #8): with sharing off, or after GO GHOST, GlitchTip
// is never started, and turning sharing off (or going ghost) mid-session stops it.
import { describe, it, expect, beforeEach, vi } from 'vitest';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

let Sentry;
async function load({ off = false, ghost = false } = {}) {
  vi.resetModules();
  globalThis.localStorage = memoryStorage();
  if (off) localStorage.setItem('reclaim-city.analytics-off', '1');
  if (ghost) localStorage.setItem('reclaim-city.gone-ghost', JSON.stringify({ at: '2026-11-01T00:00:00Z' }));
  const et = new EventTarget();
  globalThis.window = et;
  globalThis.addEventListener = et.addEventListener.bind(et);
  globalThis.removeEventListener = et.removeEventListener.bind(et);
  globalThis.dispatchEvent = et.dispatchEvent.bind(et);
  globalThis.location = { hostname: 'play.multiversegames.ai', origin: 'https://play.multiversegames.ai', href: 'https://play.multiversegames.ai/reclaim-city/#/stats' };
  Sentry = { init: vi.fn(), close: vi.fn(() => Promise.resolve(true)), captureException: vi.fn() };
  globalThis.Sentry = Sentry;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const errors = await import('../src/utils/errors.js');
  const pref = await import('../src/utils/analytics-pref.js');
  const ghostMod = await import('../src/utils/ghost.js');
  const analytics = await import('../src/utils/analytics.js');
  return { errors, pref, ghostMod, analytics };
}
const beforeSend = () => Sentry.init.mock.calls.at(-1)[0].beforeSend;
const EVENT = { exception: { values: [{ type: 'Error', value: 'boom', stacktrace: { frames: [{ filename: 'https://play.multiversegames.ai/reclaim-city/app.js' }] } }] } };

describe('error reports follow the sharing switch', () => {
  beforeEach(() => { delete globalThis.umami; });

  it('sharing off when the game opens: GlitchTip is never started and nothing is captured', async () => {
    const { errors } = await load({ off: true });
    errors.initErrorTracking();
    expect(Sentry.init).not.toHaveBeenCalled();
    errors.captureError(new Error('boom'), { operation: 'test' });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('gone ghost when the game opens: GlitchTip is never started', async () => {
    const { errors } = await load({ ghost: true });
    errors.initErrorTracking();
    expect(Sentry.init).not.toHaveBeenCalled();
    errors.captureError(new Error('boom'));
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('sharing on: reports are sent as before', async () => {
    const { errors } = await load();
    errors.initErrorTracking();
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(beforeSend()(structuredClone(EVENT))).not.toBeNull();
    errors.captureError(new Error('boom'));
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it('turning sharing off on Your City (trackThenStop) stops GlitchTip at once', async () => {
    const { errors, analytics } = await load();
    errors.initErrorTracking();
    const send = beforeSend();
    await analytics.trackThenStop('opted-out', undefined, { timeoutMs: 1 });
    expect(Sentry.close).toHaveBeenCalled();
    // an event already queued is dropped, and nothing new is captured
    expect(send(structuredClone(EVENT))).toBeNull();
    errors.captureError(new Error('boom'));
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('going ghost stops GlitchTip; calling the ghost off with sharing on starts it again', async () => {
    const { errors, ghostMod } = await load();
    errors.initErrorTracking();
    ghostMod.markGoneGhost({ silent: false });
    expect(Sentry.close).toHaveBeenCalledTimes(1);
    ghostMod.clearGhost();
    expect(Sentry.init).toHaveBeenCalledTimes(2);
  });

  it('turning sharing back on starts it, once', async () => {
    const { errors, pref } = await load({ off: true });
    errors.initErrorTracking();
    pref.setAnalyticsOff(false);
    pref.setAnalyticsOff(false);
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    errors.captureError(new Error('boom'));
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
