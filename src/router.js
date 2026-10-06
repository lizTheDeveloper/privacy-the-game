const ROUTES = [
  { pattern: /^#\/city$/, screen: 'city', params: () => ({}) },
  {
    pattern: /^#\/district\/([^/?]+)(?:\?(.*))?$/,
    screen: 'district',
    params: (m) => ({
      id: m[1],
      tab: m[2] ? new URLSearchParams(m[2]).get('tab') : undefined,
    }),
  },
  { pattern: /^#\/mission\/([^/]+)\/briefing$/, screen: 'briefing', params: (m) => ({ id: m[1] }) },
  { pattern: /^#\/mission\/([^/]+)\/debrief$/, screen: 'debrief', params: (m) => ({ id: m[1] }) },
  { pattern: /^#\/milestone\/([^/]+)$/, screen: 'milestone', params: (m) => ({ districtId: m[1] }) },
  { pattern: /^#\/garage$/, screen: 'garage', params: () => ({}) },
  { pattern: /^#\/timeline$/, screen: 'timeline', params: () => ({}) },
  { pattern: /^#\/quiz\/phishing$/, screen: 'phishing', params: () => ({}) },
  { pattern: /^#\/quickquest$/, screen: 'quickquest', params: () => ({}) },
  { pattern: /^#\/city-together$/, screen: 'together', params: () => ({}) },
  { pattern: /^#\/ghost$/, screen: 'ghost', params: () => ({}) },
  { pattern: /^#\/ghost\/done$/, screen: 'ghost-done', params: () => ({}) },
  { pattern: /^#\/ghost\/early$/, screen: 'ghost-early', params: () => ({}) },
  { pattern: /^#\/stats$/, screen: 'stats', params: () => ({}) },
];

export function parseRoute(hash) {
  for (const route of ROUTES) {
    const match = hash.match(route.pattern);
    if (match) return { screen: route.screen, params: route.params(match) };
  }
  return { screen: 'city', params: {} };
}

export function navigate(path) {
  location.hash = path;
}

// Why a screen is being drawn. Only a navigation (first load, hashchange) is
// a pageview; re-drawing the same screen because data arrived or an action
// changed state is not.
export const RENDER_CAUSE = { NAVIGATE: 'navigate', REFRESH: 'refresh' };

export function tracksPageview(cause) {
  return cause === RENDER_CAUSE.NAVIGATE;
}

export function initRouter(onRoute) {
  const handle = () => onRoute(parseRoute(location.hash), RENDER_CAUSE.NAVIGATE);
  window.addEventListener('hashchange', handle);
  handle();
}
