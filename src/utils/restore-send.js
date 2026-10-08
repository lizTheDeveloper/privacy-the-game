// Restore's own sender (Phase 3 reviewer I1). Umami's tracker swallows network
// errors, so umami.track never tells us whether an event arrived. Restore posts
// each event itself to the same /api/send endpoint, with the payload Umami's
// script builds, and counts it only when the server says ok. One at a time,
// oldest filing first; on the first failure it stops and remembers which
// events were confirmed, so a retry continues where it stopped and nothing is
// counted twice.
import { isAnalyticsOff, UMAMI_DISABLED_KEY } from './analytics-pref.js';
import { withPod } from './analytics.js';

export const WEBSITE_ID = '9a3e18e2-56a6-4b69-90af-d88db951b600';
export const RESTORE_PROGRESS_KEY = 'reclaim-city.restore-confirmed';
export const SEND_TIMEOUT_MS = 15000;

// The same host index.html loads the script from.
export function analyticsHost(hostname = globalThis.location?.hostname || '') {
  return hostname.endsWith('multiversestudios.xyz') ? 'https://analytics.multiversestudios.xyz' : 'https://analytics.multiversegames.ai';
}

function umamiDisabled() {
  try {
    return globalThis.localStorage?.getItem(UMAMI_DISABLED_KEY) === '1';
  } catch {
    return false;
  }
}

// What Umami's script sends for umami.track(name, data).
export function umamiPayload(name, data, env = globalThis) {
  const loc = env.location || {};
  const scr = env.screen || {};
  return {
    type: 'event',
    payload: {
      website: WEBSITE_ID,
      hostname: loc.hostname || '',
      language: env.navigator?.language || '',
      referrer: '',
      screen: scr.width && scr.height ? `${scr.width}x${scr.height}` : '',
      title: env.document?.title || '',
      url: `${loc.pathname || '/'}${loc.search || ''}`,
      name,
      data: withPod(data),
    },
  };
}

// One event, confirmed: true only when the server answered ok. Never sends
// while sharing is off. Each request is aborted after timeoutMs, so an
// abandoned request can't land later and reorder the rest.
export async function sendConfirmed(name, data, { fetchImpl = globalThis.fetch, timeoutMs = SEND_TIMEOUT_MS, env = globalThis } = {}) {
  if (isAnalyticsOff() || umamiDisabled() || typeof fetchImpl !== 'function') return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${analyticsHost(env.location?.hostname)}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(umamiPayload(name, data, env)),
      signal: controller.signal,
    });
    return Boolean(res?.ok);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// A stable key per event, so a retry skips what was confirmed.
export function eventKey(e) {
  if (e.name === 'mission-completed') return `m:${e.data?.mission}`;
  if (e.name === 'district-completed') return `d:${e.data?.district}`;
  if (e.name === 'data-restored') return `r:${e.data?.kind}`;
  return `${e.name}:${JSON.stringify(e.data || {})}`;
}

export function loadConfirmed() {
  try {
    const v = JSON.parse(globalThis.localStorage?.getItem(RESTORE_PROGRESS_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveConfirmed(keys) {
  try {
    globalThis.localStorage?.setItem(RESTORE_PROGRESS_KEY, JSON.stringify(keys));
  } catch {
    // Storage blocked: a retry may resend; nothing else to do.
  }
}

export function clearConfirmed() {
  try {
    globalThis.localStorage?.removeItem(RESTORE_PROGRESS_KEY);
  } catch {
    // nothing
  }
}

// Send what isn't confirmed yet, in order, one at a time; stop at the first
// failure. Returns { ok, sent, total }: ok only when every event is confirmed.
export async function sendRestore(events, { send = sendConfirmed, onProgress = () => {} } = {}) {
  const confirmed = loadConfirmed();
  const done = new Set(confirmed);
  const todo = events.filter((e) => !done.has(eventKey(e)));
  for (let i = 0; i < todo.length; i += 1) {
    const ok = await send(todo[i].name, todo[i].data);
    if (!ok) return { ok: false, sent: events.length - todo.length + i, total: events.length };
    confirmed.push(eventKey(todo[i]));
    saveConfirmed(confirmed);
    onProgress(events.length - todo.length + i + 1, events.length);
  }
  return { ok: true, sent: events.length, total: events.length };
}
