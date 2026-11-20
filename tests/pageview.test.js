import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseRoute } from '../src/router.js';
import { pageviewUrl, sanitizeHref, errorContext, scrubEventUrls } from '../src/utils/pageview-url.js';

describe('trackPageview', () => {
  beforeEach(() => {
    vi.resetModules();
    const store = {};
    globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
    globalThis.umami = { track: vi.fn() };
  });

  it('the broker map hash goes out unchanged', () => {
    expect(pageviewUrl(parseRoute('#/reclamation/map'), 'https://x.test/#/reclamation/map')).toBe('https://x.test/#/reclamation/map');
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

describe('pageviewUrl', () => {
  it('pageviewUrl strips the account from building routes only', () => {
    expect(pageviewUrl({ screen: 'building' }, 'https://x/reclaim-city/#/building/gmail')).toBe('https://x/reclaim-city/#/building');
    expect(pageviewUrl({ screen: 'district' }, 'https://x/#/district/vault')).toBe('https://x/#/district/vault');
  });

  it('strips the mission id from re-check routes', () => {
    expect(pageviewUrl({ screen: 'recheck' }, 'https://x/reclaim-city/#/mission/gmail-recon-login/recheck')).toBe('https://x/reclaim-city/#/mission/recheck');
    expect(pageviewUrl({ screen: 'briefing' }, 'https://x/#/mission/gmail-recon-login/briefing')).toBe('https://x/#/mission/gmail-recon-login/briefing');
  });

  it('sanitizeHref applies the same rule from the URL alone (error reports)', () => {
    expect(sanitizeHref('https://x/#/building/gmail')).toBe('https://x/#/building');
    expect(sanitizeHref('https://x/#/mission/gmail-recon-login/recheck')).toBe('https://x/#/mission/recheck');
    expect(sanitizeHref('https://x/#/district/vault')).toBe('https://x/#/district/vault');
    expect(sanitizeHref('https://x/')).toBe('https://x/');
    expect(sanitizeHref(undefined)).toBe(undefined);
  });

  it('error context for building and re-check screens carries no params', () => {
    expect(errorContext({ screen: 'building', params: { id: 'gmail' } })).toEqual({ screen: 'building' });
    expect(errorContext({ screen: 'recheck', params: { id: 'gmail-recon-login' } })).toEqual({ screen: 'recheck' });
    expect(errorContext({ screen: 'district', params: { id: 'vault' } })).toEqual({ screen: 'district', params: { id: 'vault' } });
  });

  it('error reports lose the account from the page URL and navigation breadcrumbs', () => {
    const event = {
      request: { url: 'https://x/#/building/gmail' },
      breadcrumbs: [
        { category: 'navigation', data: { from: 'https://x/#/district/master-keys', to: 'https://x/#/building/gmail' } },
        { category: 'navigation', data: { from: '/#/mission/gmail-recon-login/recheck', to: '/#/city' } },
        { category: 'console', message: 'hi' },
      ],
    };
    const out = scrubEventUrls(event);
    expect(out.request.url).toBe('https://x/#/building');
    expect(out.breadcrumbs[0].data).toEqual({ from: 'https://x/#/district/master-keys', to: 'https://x/#/building' });
    expect(out.breadcrumbs[1].data.from).toBe('/#/mission/recheck');
    expect(JSON.stringify(out)).not.toContain('gmail');
  });
});
