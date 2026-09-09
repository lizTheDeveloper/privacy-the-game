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

export function initRouter(onRoute) {
  const handle = () => onRoute(parseRoute(location.hash));
  window.addEventListener('hashchange', handle);
  handle();
}
