// The Big Check: every broker the player's missions and sweeps don't reach, grouped by kind, for a
// completionist to tick off. Pure: (map, lighting) in, rows out. Ticks live in the saved game only
// and count for nothing but the map's stars. Nothing here is tracked or put in a URL.
import { isBuyer } from './broker-lighting.js';
import { shortName } from './broker-view.js';
import { MISSIONS } from '../data/missions.js';

export const BIG_CHECK_GROUPS = Object.freeze([
  ['people-search', 'People search'],
  ['marketing', 'Marketing'],
  ['risk-identity', 'Risk and identity'],
  ['location', 'Location'],
  ['financial', 'Financial'],
  ['health', 'Health'],
  ['automotive', 'Automotive'],
  ['identity-resolution', 'Identity resolution'],
  ['data-marketplace', 'Data marketplaces'],
  ['ad-network', 'Ad networks'],
  ['', 'Not yet classified'],
]);

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const missionIds = new Set(MISSIONS.map((m) => m.id));

// The first broker mission (not a recon) that covers this record, or null. The star card's
// "Covered by" uses the same rule, so a broker never shows a tick box and a mission at once.
export function coveringMission(b) {
  return (Array.isArray(b?.missions) ? b.missions : [])
    .find((m) => typeof m === 'string' && !m.includes('-recon-') && missionIds.has(m)) ?? null;
}

// May the player tick this one? Only a reachable broker no mission covers.
export function tickable(b) {
  return isObj(b) && !isBuyer(b) && b.optOut?.method !== 'none' && coveringMission(b) === null;
}

// Lit by something other than a Big Check tick (a checklist line, a legacy filing, DROP). The
// Big Check leaves these rows out, and the star card offers no unticked box on them.
export function litElsewhere(star) {
  if (star?.state !== 'lit' && star?.state !== 'amber') return false;
  return (Array.isArray(star.via) ? star.via : []).some((v) => v !== 'big-check');
}

const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function bigCheckGroups(map, lighting) {
  const brokers = (Array.isArray(map?.brokers) ? map.brokers : []).filter((b) => isObj(b) && typeof b.id === 'string');
  const buckets = new Map(BIG_CHECK_GROUPS.map(([kind]) => [kind, []]));
  const frozen = new Set(Array.isArray(lighting?.frozen) ? lighting.frozen : []);
  for (const b of brokers) {
    if (isBuyer(b) || b.optOut?.method === 'none') continue;
    const star = lighting?.stars?.[b.id];
    if (litElsewhere(star)) continue;
    const first = Array.isArray(b.kind) && typeof b.kind[0] === 'string' ? b.kind[0] : '';
    const bucket = buckets.get(first) ?? buckets.get('');
    bucket.push({
      id: b.id,
      name: shortName(b.name ?? b.id) || b.id,
      mission: coveringMission(b),
      ticked: Array.isArray(star?.via) && star.via.includes('big-check'),
      frozen: frozen.has(b.id),
    });
  }
  return BIG_CHECK_GROUPS
    .map(([kind, label]) => ({ kind, label, rows: buckets.get(kind).sort(byName) }))
    .filter((g) => g.rows.length > 0);
}

// The filter's rule (the screen's in-place filter uses it too): a case-insensitive substring of the name.
export function nameMatches(name, query) {
  const q = String(query ?? '').trim().toLowerCase();
  return q === '' || String(name ?? '').toLowerCase().includes(q);
}

export function filterBigCheck(groups, query) {
  if (String(query ?? '').trim() === '') return groups;
  return groups
    .map((g) => ({ ...g, rows: g.rows.filter((r) => nameMatches(r.name, query)) }))
    .filter((g) => g.rows.length > 0);
}
