// What a pageview (or an error report) may say about where the player is.
// A building interior names an account, and a re-check names a mission on
// one: those stay on the device. So does any screen of a mission for an account
// the player added by hand (its id carries a hash of the name; data/custom-missions.js).
// Every other route goes out unchanged.
import { parseRoute } from '../router.js';
import { isCustomMission } from '../data/custom-missions.js';

const PRIVATE_HASH = { building: '#/building', recheck: '#/mission/recheck' };
const MISSION_SCREENS = new Set(['briefing', 'debrief', 'recheck']);

function privateHash(route) {
  if (MISSION_SCREENS.has(route?.screen) && isCustomMission(route.params?.id)) return '#/mission/custom';
  return PRIVATE_HASH[route?.screen];
}

function withHash(href, hash) {
  const i = href.indexOf('#');
  return (i === -1 ? href : href.slice(0, i)) + hash;
}

export function pageviewUrl(route, href) {
  const hash = privateHash(route);
  return hash && typeof href === 'string' ? withHash(href, hash) : href;
}

// The same rule when only the URL is known (error reports, breadcrumbs).
export function sanitizeHref(href) {
  if (typeof href !== 'string') return href;
  const i = href.indexOf('#');
  if (i === -1) return href;
  return pageviewUrl(parseRoute(href.slice(i)), href);
}

// The error-report context for a screen: private screens send no params.
export function errorContext(route) {
  return privateHash(route) ? { screen: route.screen } : { screen: route?.screen, params: route?.params };
}

// An error report carries the page URL and navigation breadcrumbs: the same
// rule applies to each of them before the report leaves the device.
export function scrubEventUrls(event) {
  if (!event || typeof event !== 'object') return event;
  if (event.request?.url) event.request.url = sanitizeHref(event.request.url);
  for (const b of event.breadcrumbs ?? []) {
    if (b?.category !== 'navigation' || !b.data) continue;
    if (b.data.from) b.data.from = sanitizeHref(b.data.from);
    if (b.data.to) b.data.to = sanitizeHref(b.data.to);
  }
  return event;
}
