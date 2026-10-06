// Players can turn off anonymous play stats. Off means the analytics script is
// never loaded (index.html checks ANALYTICS_OFF_KEY before injecting it), and
// Umami's own `umami.disabled` flag is set so a script already loaded this
// session stops sending immediately.
export const ANALYTICS_OFF_KEY = 'reclaim-city.analytics-off';
export const UMAMI_DISABLED_KEY = 'umami.disabled';

// Remembered for this page load too, so blocked storage can't leave sharing on
// after the player turned it off.
let offInMemory = false;

export function isAnalyticsOff() {
  if (offInMemory) return true;
  try {
    return localStorage.getItem(ANALYTICS_OFF_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAnalyticsOff(off) {
  offInMemory = Boolean(off);
  try {
    if (off) {
      localStorage.setItem(ANALYTICS_OFF_KEY, '1');
      localStorage.setItem(UMAMI_DISABLED_KEY, '1');
    } else {
      localStorage.removeItem(ANALYTICS_OFF_KEY);
      localStorage.removeItem(UMAMI_DISABLED_KEY);
    }
  } catch {
    // Storage blocked (private mode): nothing persists, and nothing to undo.
  }
}

// When this browser last turned sharing off (sent `opted-out`), so the game can
// tell whether tonight's run has deleted its data yet.
export const OPTED_OUT_AT_KEY = 'reclaim-city.opted-out-at';

export function getOptedOutAt() {
  try {
    return localStorage.getItem(OPTED_OUT_AT_KEY) || null;
  } catch {
    return null;
  }
}

export function setOptedOutAt(iso) {
  try {
    if (iso) localStorage.setItem(OPTED_OUT_AT_KEY, iso);
    else localStorage.removeItem(OPTED_OUT_AT_KEY);
  } catch {
    // Storage blocked: nothing to remember.
  }
}
