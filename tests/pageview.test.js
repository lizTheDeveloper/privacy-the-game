import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('trackPageview', () => {
  beforeEach(() => {
    vi.resetModules();
    const store = {};
    globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
    globalThis.umami = { track: vi.fn() };
  });

  it('leaves the page load to Umami, then sends each screen change with Umami\'s own props', async () => {
    const { trackPageview } = await import('../src/utils/analytics.js');
    trackPageview('https://x/reclaim-city/#/city', 'city');
    expect(umami.track).not.toHaveBeenCalled();
    trackPageview('https://x/reclaim-city/#/stats', 'stats');
    expect(umami.track).toHaveBeenCalledTimes(1);
    const payload = umami.track.mock.calls[0][0]({ website: 'w', hostname: 'x', url: 'old', title: 'Reclaim City' });
    expect(payload).toEqual({ website: 'w', hostname: 'x', url: 'https://x/reclaim-city/#/stats', title: 'stats' });
  });

  it('sends nothing when sharing is off', async () => {
    const { trackPageview } = await import('../src/utils/analytics.js');
    const { setAnalyticsOff } = await import('../src/utils/analytics-pref.js');
    trackPageview('a', 'city');
    setAnalyticsOff(true);
    trackPageview('b', 'stats');
    expect(umami.track).not.toHaveBeenCalled();
  });
});
