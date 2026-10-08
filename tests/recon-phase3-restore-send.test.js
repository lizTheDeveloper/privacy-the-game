// Restore delivery (Phase 3 reviewer I1, ruling): Umami's tracker swallows
// errors, so restore posts each event itself to /api/send, counts it only on
// res.ok, aborts each request after 15 s, stops at the first failure keeping
// the restore on offer, and a retry resumes without resending what arrived.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  sendConfirmed, sendRestore, umamiPayload, analyticsHost, eventKey, loadConfirmed, clearConfirmed, WEBSITE_ID, SEND_TIMEOUT_MS,
} from '../src/utils/restore-send.js';
import { setAnalyticsOff } from '../src/utils/analytics-pref.js';
import { trackNow } from '../src/utils/analytics.js';

const APP = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const restoreFn = APP.slice(APP.indexOf('async function restoreData()'), APP.indexOf('async function restoreData()') + 3500);

let store;
beforeEach(() => {
  store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  setAnalyticsOff(false);
});
afterEach(() => { vi.useRealTimers(); });

const env = { location: { hostname: 'play.multiversegames.ai', pathname: '/reclaim-city/', search: '' }, screen: { width: 390, height: 844 }, navigator: { language: 'en-US' }, document: { title: 'Reclaim City' } };
const EVENTS = [
  { name: 'data-restored', data: { kind: 'opted-out' } },
  { name: 'mission-completed', data: { mission: 'gmail-recon-breach', status: 'completed', restored: '1' } },
  { name: 'mission-completed', data: { mission: 'google-recon-breach', status: 'completed', restored: '1' } },
  { name: 'district-completed', data: { district: 'master-keys', restored: '1' } },
];

describe('the payload is what Umami’s script sends', () => {
  it('website id, hostname, url, screen, language, name and data, posted to the same host', () => {
    const p = umamiPayload('mission-completed', { mission: 'x' }, env);
    expect(p).toEqual({ type: 'event', payload: { website: WEBSITE_ID, hostname: 'play.multiversegames.ai', language: 'en-US', referrer: '', screen: '390x844', title: 'Reclaim City', url: '/reclaim-city/', name: 'mission-completed', data: { mission: 'x' } } });
    expect(analyticsHost('play.multiversestudios.xyz')).toBe('https://analytics.multiversestudios.xyz');
    expect(analyticsHost('play.multiversegames.ai')).toBe('https://analytics.multiversegames.ai');
  });
});

describe('sendConfirmed', () => {
  it('ok only on res.ok', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => { calls.push([url, JSON.parse(init.body)]); return { ok: true }; };
    expect(await sendConfirmed('a', {}, { fetchImpl, env })).toBe(true);
    expect(calls[0][0]).toBe('https://analytics.multiversegames.ai/api/send');
    expect(await sendConfirmed('a', {}, { fetchImpl: async () => ({ ok: false, status: 500 }), env })).toBe(false);
    expect(await sendConfirmed('a', {}, { fetchImpl: async () => { throw new Error('net'); }, env })).toBe(false);
  });

  it('never sends while sharing is off or umami.disabled is set', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    setAnalyticsOff(true);
    expect(await sendConfirmed('a', {}, { fetchImpl, env })).toBe(false);
    setAnalyticsOff(false);
    store['umami.disabled'] = '1';
    expect(await sendConfirmed('a', {}, { fetchImpl, env })).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('aborts a request after 15 s and reports failure', async () => {
    vi.useFakeTimers();
    let aborted = false;
    const fetchImpl = (url, init) => new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); });
    });
    const p = sendConfirmed('a', {}, { fetchImpl, env });
    await vi.advanceTimersByTimeAsync(SEND_TIMEOUT_MS - 1);
    expect(aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await p).toBe(false);
    expect(aborted).toBe(true);
  });
});

describe('sendRestore', () => {
  it('sends one at a time, in order', async () => {
    const log = [];
    const r = await sendRestore(EVENTS, { send: async (name, data) => { log.push(eventKey({ name, data })); return true; } });
    expect(r).toEqual({ ok: true, sent: 4, total: 4 });
    expect(log).toEqual(['r:opted-out', 'm:gmail-recon-breach', 'm:google-recon-breach', 'd:master-keys']);
  });

  it('a 500 stops the restore; the retry resumes without resending confirmed events', async () => {
    const sent = [];
    let fail = true;
    const send = async (name, data) => {
      const k = eventKey({ name, data });
      if (k === 'm:google-recon-breach' && fail) return false;
      sent.push(k);
      return true;
    };
    const first = await sendRestore(EVENTS, { send });
    expect(first).toEqual({ ok: false, sent: 2, total: 4 });
    expect(loadConfirmed()).toEqual(['r:opted-out', 'm:gmail-recon-breach']);
    fail = false;
    const second = await sendRestore(EVENTS, { send });
    expect(second).toEqual({ ok: true, sent: 4, total: 4 });
    expect(sent).toEqual(['r:opted-out', 'm:gmail-recon-breach', 'm:google-recon-breach', 'd:master-keys']);
    clearConfirmed();
    expect(loadConfirmed()).toEqual([]);
  });

  it('a timeout stops it the same way (real sender, mock fetch that never answers)', async () => {
    vi.useFakeTimers();
    let n = 0;
    const fetchImpl = (url, init) => {
      n += 1;
      if (n === 2) return new Promise((res, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))));
      return Promise.resolve({ ok: true });
    };
    const p = sendRestore(EVENTS, { send: (name, data) => sendConfirmed(name, data, { fetchImpl, env }) });
    await vi.advanceTimersByTimeAsync(SEND_TIMEOUT_MS + 1);
    expect(await p).toEqual({ ok: false, sent: 1, total: 4 });
  });
});

describe('the app’s restore path', () => {
  it('uses the confirmed sender and keeps the flags on failure', () => {
    expect(restoreFn).toMatch(/await sendRestore\(events,/);
    const failAt = restoreFn.indexOf('if (!result.ok)');
    const clearAt = restoreFn.indexOf('clearGhost();');
    expect(failAt).toBeGreaterThan(-1);
    expect(clearAt).toBeGreaterThan(failAt);
    expect(restoreFn.slice(failAt, clearAt)).toMatch(/RESTORE_DIALOGUE\.stopped\(result\.sent, result\.total\)[\s\S]*return;/);
    expect(restoreFn).not.toMatch(/await trackNow\(events\[i\]/);
  });

  it('trackNow still waits for the tracker’s send to settle, and cancel paths stay bounded', async () => {
    expect(APP).toMatch(/trackNow\('ghost-cancelled', \{ nonce \}, \{ timeoutMs: 1500 \}\)/);
    vi.useFakeTimers();
    const log = [];
    globalThis.umami = { track: (name) => new Promise((res) => setTimeout(() => { log.push(name); res(); }, name === 'first' ? 30000 : 10)) };
    const run = (async () => { await trackNow('first', {}); await trackNow('second', {}); })();
    await vi.advanceTimersByTimeAsync(40000);
    await run;
    expect(log).toEqual(['first', 'second']);
    delete globalThis.umami;
  });
});
