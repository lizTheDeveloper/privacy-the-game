// Scout's lines on the field map. Each shows once per save: app.js marks a line seen
// (markScoutSeen) after the render that showed it. Pure: nothing here is tracked or put in a URL.
import { BROKER_MAP_DIALOGUE } from '../data/dialogue.js';
import { MAP_SCOUT_KEYS } from './broker-state.js';

export { MAP_SCOUT_KEYS };

// DROP lights every California-registered broker at once; this many newly lit through it is a sweep.
const SWEEP_MIN = 10;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const seen = (state, key) => isObj(state?.brokerMap) && isObj(state.brokerMap.scout) && state.brokerMap.scout[key] === 1;
const said = (key) => ({ key, line: BROKER_MAP_DIALOGUE[key] });

const scoutValue = (state, key) => (isObj(state?.brokerMap) && isObj(state.brokerMap.scout) ? state.brokerMap.scout[key] : undefined);

// The map lines whose trigger fires on this visit and that aren't seen yet, in MAP_SCOUT_KEYS
// order: sweep (ten or more newly lit through DROP) and firstHub (a newly lit star is a hub).
// opened needs no trigger. Sweep comes first: six hubs are CA-registered, so the DROP visit lights
// a hub too, and that visit should explain DROP, not point at one hub among hundreds of stars.
export function mapScoutTriggers(state, map, lighting, newlyLit) {
  const fresh = newlyLit instanceof Set ? newlyLit : new Set(newlyLit ?? []);
  const brokers = Array.isArray(map?.brokers) ? map.brokers : [];
  const out = [];
  if (!seen(state, 'sweep')) {
    let n = 0;
    for (const id of fresh) if (Array.isArray(lighting?.stars?.[id]?.via) && lighting.stars[id].via.includes('drop')) n++;
    if (n >= SWEEP_MIN) out.push('sweep');
  }
  if (!seen(state, 'firstHub') && brokers.some((b) => b?.hub === true && fresh.has(b.id))) out.push('firstHub');
  return out;
}

// The visit's line: in MAP_SCOUT_KEYS order, the first unseen line that is triggered now or pending
// (opened always qualifies until seen). One per visit; app.js marks the other triggered lines
// pending (markScoutPending) and this one seen. app.js never asks on a first visit: Liz's
// firstVisit line shows then, so opened is the first line from the second visit on.
export function mapScoutLine(state, map, lighting, newlyLit) {
  if (!seen(state, 'opened')) return said('opened');
  const now = mapScoutTriggers(state, map, lighting, newlyLit);
  const key = ['sweep', 'firstHub'].find((k) => !seen(state, k) && (now.includes(k) || scoutValue(state, k) === 0));
  return key ? said(key) : null;
}

// The first card opened for a no-opt-out star.
export function cardScoutLine(state, lighting, id) {
  return lighting?.stars?.[id]?.state === 'no-opt-out' && !seen(state, 'noOptOut') ? BROKER_MAP_DIALOGUE.noOptOut : null;
}

// The first Big Check visit.
export function bigCheckScoutLine(state) {
  return seen(state, 'bigCheck') ? null : BROKER_MAP_DIALOGUE.bigCheck;
}
