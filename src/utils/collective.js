import { getChosenPod } from './pod-pref.js';
import { addressChecks } from './calc.js';

// Relative to /reclaim-city/: served by rc-collective behind Traefik.
export const COLLECTIVE_URL = 'api/collective.json';
export const WHOAMI_URL = 'api/whoami';


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

// Email addresses only, counted like build.sql (calc.js addressChecks): one
// per address, a "same" pair once, fixed by either account of the pair.
export function yourPart(state) {
  const breached = addressChecks(state).filter((c) => c.breached);
  return { found: breached.length, fixed: breached.filter((c) => c.fixed).length };
}

export function fmt(n) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-US') : '';
}

// Screens that read the collective data; load it once on entry, never re-trigger from error.
export const COLLECTIVE_SCREENS = ['together', 'city'];

export function shouldAutoLoad(screen, status, screens = COLLECTIVE_SCREENS) {
  return screens.includes(screen) && status === 'idle';
}

// The broader city behind the player's districts: one block per published pod
// (a pod with a player count). The player's own pod takes the nearest slot,
// the rest fill the slots largest first. `slots` is ordered nearest first.
// Returns null without data, so the map keeps its plain backdrop.
export function backdropPods(collective, displayId, slots) {
  if (!collective || !Array.isArray(collective.pods)) return null;
  const published = collective.pods.filter((p) => p && typeof p.id === 'string' && typeof p.players === 'number' && Number.isFinite(p.players) && p.players > 0);
  if (!published.length || !slots?.length) return [];
  const maxLog = Math.log(Math.max(2, ...published.map((p) => p.players)));
  const yours = published.find((p) => p.id === displayId) || null;
  const rest = published.filter((p) => p !== yours)
    .sort((a, b) => b.players - a.players || String(a.label).localeCompare(String(b.label)));
  const ordered = yours ? [yours, ...rest] : rest;
  return ordered.slice(0, slots.length).map((p, i) => {
    const pct = typeof p.fortified?.pct === 'number' && Number.isFinite(p.fortified.pct) ? p.fortified.pct : null;
    const parts = [String(p.label ?? p.id), `${fmt(p.players)} players`];
    if (pct !== null) parts.push(`${fmt(pct)}% fortified`);
    return {
      slot: slots[i],
      id: p.id,
      label: String(p.label ?? p.id),
      players: p.players,
      height: Math.min(1, Math.log(Math.max(2, p.players)) / maxLog),
      lit: pct === null ? null : Math.min(1, Math.max(0, pct / 100)),
      yours: p === yours,
      text: parts.join(' · '),
    };
  });
}
