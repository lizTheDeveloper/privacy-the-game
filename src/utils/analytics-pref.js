// Players can turn off anonymous play stats. Off means the analytics script is
// never loaded (index.html checks ANALYTICS_OFF_KEY before injecting it), and
// Umami's own `umami.disabled` flag is set so a script already loaded this
// session stops sending immediately.
export const ANALYTICS_OFF_KEY = 'reclaim-city.analytics-off';
export const UMAMI_DISABLED_KEY = 'umami.disabled';

export function isAnalyticsOff() {
  try {
    return localStorage.getItem(ANALYTICS_OFF_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAnalyticsOff(off) {
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
