// The only module that talks to Umami. Everything else calls these, so a
// missed call site can't send an event after a player turns sharing off.
import { isAnalyticsOff, setAnalyticsOff } from './analytics-pref.js';
import { getChosenPod, isPodAuto, POD_AUTO } from './pod-pref.js';

function tracker() {
  if (isAnalyticsOff()) return null;
  const u = globalThis.umami;
  return u && typeof u.track === 'function' ? u : null;
}

function withPod(data) {
  const pod = getChosenPod() || (isPodAuto() ? POD_AUTO : null);
  return pod ? { ...(data || {}), pod } : data;
}

export function track(name, data) {
  const u = tracker();
  if (u) u.track(name, withPod(data));
}

// Pageviews: Umami's script records one per screen change by itself (and
// stops when sharing is off, through `umami.disabled`). The game sends none:
// a hand-built pageview without the website id is rejected (400).

// Send one event and wait for it (bounded). True if a send was attempted.
export async function trackNow(name, data, { timeoutMs = 1500 } = {}) {
  const u = tracker();
  if (!u) return false;
  try {
    await Promise.race([
      Promise.resolve(u.track(name, withPod(data))),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    // Best effort.
  }
  return true;
}

// Send one last event, wait for it (bounded), then stop tracking for good.
// Sharing turns off even if the send fails, hangs, or the script never loaded.
export async function trackThenStop(name, data, { timeoutMs = 1500 } = {}) {
  const u = tracker();
  if (u) {
    try {
      await Promise.race([
        Promise.resolve(u.track(name, withPod(data))),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    } catch {
      // Best effort; turning sharing off below is what matters.
    }
  }
  setAnalyticsOff(true);
}

// After turning sharing back on, the script may still be loading. Resolves true
// once it can send, false if it never arrives within timeoutMs.
export async function waitForTracker({ timeoutMs = 3000, pollMs = 100 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (tracker()) return true;
    if (Date.now() >= deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}
