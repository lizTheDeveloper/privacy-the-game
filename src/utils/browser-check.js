// Will this browser keep the player's save? All progress lives in localStorage
// (state.js), with no accounts, so a browser that drops it loses the whole city.
// Links from social posts open in the app's own browser (Instagram, Facebook,
// TikTok...), which often keeps storage only while it's open, and private windows
// forget everything when closed (Liz 2026-11-18: "you have to tell them that their
// info is not saving").
//
// Pure functions: everything they read is passed in, so the tests can feed them
// real user agents and fake storage. Nothing here is sent anywhere; the one
// analytics event (components/browser-warning.js) carries only the kind and an
// app id from IN_APP_IDS, never the user agent.

// Checked in order: Messenger before Facebook (Messenger's UA carries FBAV too),
// Threads before Instagram (Threads is built on Instagram's).
const IN_APPS = [
  { id: 'messenger', name: 'Messenger', test: /FBAN\/Messenger|FB_IAB\/Orca-Android|MessengerLite/i },
  { id: 'facebook', name: 'Facebook', test: /FBAN\/|FBAV\/|FB_IAB\/|FBIOS|FB4A/ },
  { id: 'threads', name: 'Threads', test: /\bBarcelona \d|\bThreads\b/ },
  { id: 'instagram', name: 'Instagram', test: /\bInstagram\b/i },
  { id: 'tiktok', name: 'TikTok', test: /musical_ly|BytedanceWebview|\bTikTok\b|\btrill_\d/i },
  { id: 'snapchat', name: 'Snapchat', test: /\bSnapchat\b/i },
  { id: 'linkedin', name: 'LinkedIn', test: /LinkedInApp/i },
  { id: 'twitter', name: 'X', test: /\bTwitter\b|TwitterAndroid/i },
  { id: 'pinterest', name: 'Pinterest', test: /\bPinterest\b/i },
  { id: 'line', name: 'LINE', test: /\bLine\/\d/ },
  { id: 'wechat', name: 'WeChat', test: /MicroMessenger/i },
  { id: 'google', name: 'the Google app', test: /\bGSA\/\d/ },
];

// The only app ids that may leave this browser (as the analytics event's `app`).
export const IN_APP_IDS = [...IN_APPS.map((a) => a.id), 'webview'];

export function platformOf(ua = '') {
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

// The app whose built-in browser this is: { id, name }, or null for a real browser.
// `standalone`: the game was added to the home screen, which keeps its own storage
// (an iOS home-screen app's user agent can lack the Safari token too).
export function detectInAppBrowser(ua = '', { standalone = false } = {}) {
  if (typeof ua !== 'string' || !ua) return null;
  for (const app of IN_APPS) {
    if (app.test.test(ua)) return { id: app.id, name: app.name };
  }
  if (standalone) return null;
  // An app's iOS web view (WKWebView) has no "Safari/" token; Safari, Chrome,
  // Firefox and Edge on iPhone all do.
  if (platformOf(ua) === 'ios' && /AppleWebKit/.test(ua) && !/Safari\//.test(ua)) return { id: 'webview', name: null };
  // Android's web view marks itself "; wv)".
  if (/Android/.test(ua) && /;\s*wv\)/.test(ua)) return { id: 'webview', name: null };
  return null;
}

// Can this browser write and read back localStorage? A blocked frame throws on the
// bare `localStorage` read, old Safari private windows throw on setItem.
export function storageWorks(getStorage = () => globalThis.localStorage) {
  try {
    const s = getStorage();
    if (!s) return false;
    const key = 'reclaim-city.storage-probe';
    const value = String(Math.random());
    s.setItem(key, value);
    const ok = s.getItem(key) === value;
    s.removeItem(key);
    return ok;
  } catch {
    return false;
  }
}

// Private windows get a small, memory-only quota. Under this, it's probably one.
export const SMALL_QUOTA = 120 * 1024 * 1024;

// A hint, never proof, that this is a private window: true only on a signal that a
// normal window doesn't give. persisted() = true rules it out; false is what most
// normal windows say too, so on its own it means nothing.
export async function privateHint(nav = globalThis.navigator) {
  try {
    const st = nav?.storage;
    if (!st) return false;
    if (typeof st.persisted === 'function' && (await st.persisted()) === true) return false;
    if (typeof st.estimate === 'function') {
      const { quota } = (await st.estimate()) || {};
      if (typeof quota === 'number' && quota > 0 && quota < SMALL_QUOTA) return true;
    }
    // Safari's private windows refuse the private file system with this reason.
    if (typeof st.getDirectory === 'function') {
      try {
        await st.getDirectory();
      } catch (e) {
        if (/unknown transient reason/i.test(String(e?.message || e))) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// What the warning should say, first from what can be known right away. `kind` is
// null when nothing is wrong; then `privateHint` may still find a private window.
// Broken storage comes first: that one is certain.
export function checkBrowser({ ua = '', standalone = false, storageOk = true } = {}) {
  const inApp = detectInAppBrowser(ua, { standalone });
  const platform = platformOf(ua);
  if (!storageOk) return { kind: 'no-storage', app: inApp, platform };
  if (inApp) return { kind: 'in-app', app: inApp, platform };
  return { kind: null, app: null, platform };
}
