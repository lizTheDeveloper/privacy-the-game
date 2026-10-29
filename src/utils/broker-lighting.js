// Which Broker Constellation stars are lit, and how much of the field that
// covers. Pure: (map, saved state, today) in, lighting out. Nothing here is
// tracked or put in a URL.
//
// A line lights only the records it names (never a parent's). A `none`
// opt-out star is never lit and sits outside the coverage denominator. Buyers
// are never lit. DROP lights CA-registered brokers only for a California
// resident. A sweep in map.sweeps (only DAA WebChoices: the NAI runs no one-shot opt-out) gives a "this browser only" halo, never a light. Freezes
// give a ring, never a light. Re-check-due (amber) stars count in full.

import { BROKER_CHECKLISTS, LEGACY_ALL_ANSWERS, FREEZE_RINGS } from '../data/broker-checklists.js';
import { dayOf } from './broker-state.js';
import { PRESCREEN } from '../data/sky-ladder.js';

export const RECHECK_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;
const VIA_ORDER = ['checklist', 'legacy', 'drop', 'prescreen', 'big-check'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (obj, key) => isObj(obj) && Object.hasOwn(obj, key);
const kinds = (b) => (Array.isArray(b?.kind) ? b.kind : []);

// UTC midnight of a real YYYY-MM-DD day, or null (as dayValue in state.js).
function dayValue(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const t = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === day ? t : null;
}

export function isBuyer(broker) {
  return kinds(broker).includes('buyer');
}

const noOptOut = (b) => b?.optOut?.method === 'none';
const reachable = (b) => !isBuyer(b) && !noOptOut(b);

function listFor(checklists, missionId) {
  return own(checklists, missionId) && Array.isArray(checklists[missionId]) ? checklists[missionId] : null;
}

function isLegacyAll(rec) {
  return Object.entries(LEGACY_ALL_ANSWERS).some(([q, vals]) => vals.includes(rec[q]));
}

// Each line's day and where it came from ('checklist' or 'legacy').
function datedLines(state, missionId, checklists) {
  const out = new Map();
  const list = listFor(checklists, missionId);
  if (!list) return out;
  const entry = own(state?.brokerFiled, missionId) ? state.brokerFiled[missionId] : null;
  const recorded = isObj(entry) && isObj(entry.lines) ? entry.lines : {};
  for (const l of list) {
    if (own(recorded, l.id) && dayValue(recorded[l.id]) !== null) out.set(l.id, { day: recorded[l.id], via: 'checklist' });
  }
  const rec = own(state?.missions, missionId) ? state.missions[missionId] : null;
  const since = isObj(entry) && entry.since;
  if (isObj(rec) && rec.status === 'completed' && !since && isLegacyAll(rec)) {
    const day = dayOf(rec.completedAt);
    if (dayValue(day) !== null) for (const l of list) if (!out.has(l.id)) out.set(l.id, { day, via: 'legacy' });
  }
  return out;
}

export function lineDates(state, missionId, checklists = BROKER_CHECKLISTS) {
  const out = {};
  for (const [id, { day }] of datedLines(state, missionId, checklists)) out[id] = day;
  return out;
}

export function isChecklistPending(state, missionId, checklists = BROKER_CHECKLISTS) {
  const rec = own(state?.missions, missionId) ? state.missions[missionId] : null;
  if (!isObj(rec) || rec.status !== 'completed' || !listFor(checklists, missionId)) return false;
  return datedLines(state, missionId, checklists).size === 0;
}

const later = (a, b) => (a === null || b > a ? b : a);

export function brokerLighting(map, state, today, checklists = BROKER_CHECKLISTS) {
  const brokers = (Array.isArray(map?.brokers) ? map.brokers : []).filter((b) => isObj(b) && typeof b.id === 'string');
  const known = new Set(brokers.map((b) => b.id));
  const hits = new Map(); // id -> { litOn, via: Set }
  const hit = (id, day, via) => {
    if (!known.has(id)) return;
    const h = hits.get(id) ?? { litOn: null, via: new Set() };
    h.litOn = later(h.litOn, day);
    h.via.add(via);
    hits.set(id, h);
  };

  const sweeps = new Set();
  let dropDay = null;
  const pending = [];
  for (const missionId of Object.keys(isObj(checklists) ? checklists : {})) {
    const list = listFor(checklists, missionId);
    if (!list) continue;
    const dated = datedLines(state, missionId, checklists);
    if (isChecklistPending(state, missionId, checklists)) pending.push(missionId);
    for (const l of list) {
      const d = dated.get(l.id);
      if (!d) continue;
      if (l.sweep === 'drop') dropDay = later(dropDay, d.day);
      else if (l.sweep) sweeps.add(l.sweep);
      else for (const id of Array.isArray(l.brokers) ? l.brokers : []) hit(id, d.day, d.via);
    }
  }

  const resident = state?.caResident;
  let drop = 'off';
  if (dropDay !== null) drop = resident === 'yes' ? 'lit' : resident === 'no' || resident === 'unsaid' ? 'not-resident' : 'ask';
  if (drop === 'lit') for (const b of brokers) if (b.registries?.CA) hit(b.id, dropDay, 'drop');

  if (dayValue(state?.prescreen) !== null) for (const id of PRESCREEN.brokers) hit(id, state.prescreen, 'prescreen');

  if (isObj(state?.bigCheck)) {
    for (const [id, day] of Object.entries(state.bigCheck)) if (dayValue(day) !== null) hit(id, day, 'big-check');
  }

  const todayValue = dayValue(today);
  const stars = {};
  for (const b of brokers) {
    const h = hits.get(b.id);
    if (noOptOut(b)) stars[b.id] = { state: 'no-opt-out', litOn: null, via: [] };
    else if (!h || isBuyer(b)) stars[b.id] = { state: 'dim', litOn: null, via: [] };
    else {
      const via = VIA_ORDER.filter((v) => h.via.has(v));
      const age = todayValue === null ? null : Math.round((todayValue - dayValue(h.litOn)) / DAY_MS);
      // OptOutPrescreen's online opt-out lasts five years; a star lit by nothing else goes amber then.
      const prescreenOnly = h.via.size === 1 && h.via.has('prescreen');
      const amber = age !== null && (prescreenOnly
        ? age >= PRESCREEN.days
        : kinds(b).includes('people-search') && !h.via.has('drop') && age >= RECHECK_DAYS);
      stars[b.id] = { state: amber ? 'amber' : 'lit', litOn: h.litOn, via };
    }
  }

  const frozen = new Set();
  for (const r of FREEZE_RINGS) {
    const rec = own(state?.missions, r.mission) ? state.missions[r.mission] : null;
    if (isObj(rec) && rec.status === 'completed' && r.values.includes(rec[r.question])) for (const id of r.brokers) if (known.has(id)) frozen.add(id);
  }

  const halo = new Set();
  for (const s of sweeps) {
    const members = map?.sweeps?.[s]?.members ?? [];
    for (const id of Array.isArray(members) ? members : []) if (known.has(id)) halo.add(id);
  }

  return { stars, frozen: [...frozen].sort(), halo: [...halo].sort(), pending: pending.sort(), drop };
}

export function fieldCoverage(map, lighting) {
  const brokers = (Array.isArray(map?.brokers) ? map.brokers : []).filter(isObj);
  const on = (b) => {
    const s = lighting?.stars?.[b.id]?.state;
    return s === 'lit' || s === 'amber';
  };
  let total = 0;
  let lit = 0;
  for (const b of brokers) {
    if (!reachable(b)) continue;
    const reach = Number.isFinite(b.reach) ? b.reach : 0;
    total += reach;
    if (on(b)) lit += reach;
  }
  const hubs = brokers.filter((b) => b.hub === true);
  return {
    percent: total > 0 ? Math.floor((100 * lit) / total) : 0,
    // Something is lit, so a floored 0% is "under 1%", not nothing (ruling M8).
    anyLit: lit > 0,
    hubsLit: hubs.filter(on).length,
    hubsTotal: hubs.length,
  };
}

export function fieldHeader({ percent, hubsLit, hubsTotal, anyLit = false }) {
  const shown = percent === 0 && anyLit ? '<1' : percent;
  return `FIELD COVERED: ${shown}% · HUBS LIT ${hubsLit}/${hubsTotal}`;
}
