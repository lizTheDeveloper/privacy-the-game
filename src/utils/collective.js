import { getChosenPod } from './pod-pref.js';

// Relative to /reclaim-city/: served by rc-collective behind Traefik.
export const COLLECTIVE_URL = 'api/collective.json';
export const WHOAMI_URL = 'api/whoami';

const BREACHED = new Set(['1-2-breaches', '3plus-breaches']);

export function parseCollective(json) {
  if (!json || typeof json !== 'object') return null;
  if (!json.city || typeof json.city !== 'object' || !Array.isArray(json.pods) || typeof json.asOf !== 'string') return null;
  const pods = json.pods.filter((p) => p && typeof p.id === 'string' && typeof p.label === 'string');
  const byAddress = Array.isArray(json.city.byAddress) ? json.city.byAddress.filter((a) => a && typeof a.id === 'string') : [];
  return { ...json, city: { ...json.city, byAddress }, pods };
}

export async function fetchCollective(fetchImpl = fetch) {
  try {
    const res = await fetchImpl(COLLECTIVE_URL, { cache: 'no-cache' });
    if (!res.ok) return { ok: false };
    const data = parseCollective(await res.json());
    return data ? { ok: true, data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function fetchWhoami(fetchImpl = fetch, nav = globalThis.navigator, scr = globalThis.screen) {
  const params = new URLSearchParams();
  if (scr?.width && scr?.height) params.set('screen', `${scr.width}x${scr.height}`);
  if (nav?.language) params.set('lang', nav.language);
  try {
    const res = await fetchImpl(`${WHOAMI_URL}?${params}`, { cache: 'no-store' });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return data && typeof data === 'object' ? { ok: true, data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export function findPod(collective, id) {
  if (!collective || !id) return null;
  return collective.pods.find((p) => p.id === id) || null;
}

export function displayPodId(collective, whoami) {
  const chosen = getChosenPod();
  if (findPod(collective, chosen)) return chosen;
  const guessed = whoami?.pod?.id;
  return findPod(collective, guessed) ? guessed : null;
}

export function podBoard(collective) {
  if (!collective) return [];
  const pct = (p) => (typeof p.fortified?.pct === 'number' ? p.fortified.pct : null);
  return [...collective.pods].sort((a, b) => {
    const pa = pct(a);
    const pb = pct(b);
    if (pa === null && pb === null) return a.label.localeCompare(b.label);
    if (pa === null) return 1;
    if (pb === null) return -1;
    return pb - pa || a.label.localeCompare(b.label);
  });
}

export function yourPart(state) {
  let found = 0;
  let fixed = 0;
  for (const [id, m] of Object.entries(state?.missions || {})) {
    if (!id.endsWith('-recon-breach') || m?.status !== 'completed' || !BREACHED.has(m.finding)) continue;
    found += 1;
    const acct = id.slice(0, -'-recon-breach'.length);
    const done = (mid) => state.missions[mid]?.status === 'completed';
    if (done(`${acct}-fortify-password`) || done(`${acct}-fortify-2fa`)) fixed += 1;
  }
  return { found, fixed };
}

export function fmt(n) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-US') : '';
}

// Screens that read the collective data; load it once on entry, never re-trigger from error.
export const COLLECTIVE_SCREENS = ['together'];

export function shouldAutoLoad(screen, status, screens = COLLECTIVE_SCREENS) {
  return screens.includes(screen) && status === 'idle';
}
