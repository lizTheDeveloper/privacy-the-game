// Saved-game fields for the Broker Constellation: which checklist lines the
// player filed (and when), whether they live in California, and Big Check
// ticks. Pure helpers. Nothing here is ever tracked or put in a URL.
// Must not import state.js (state.js imports this for loadState).

import { checklistFor, LEGACY_ALL_ANSWERS } from '../data/broker-checklists.js';
import { STATE_NAME } from '../data/sky-ladder.js';

export const RESIDENCY = ['yes', 'no', 'unsaid'];

// Where the player lives (the sky's location quiz): a US state code, 'outside-us' or 'unsaid'.
// Kept in step with caResident, which the lighting reads for DROP.
const validHome = (v) => v === 'outside-us' || v === 'unsaid' || (typeof v === 'string' && Object.hasOwn(STATE_NAME, v));

// Scout's one-time lines on the field map (broker-scout.js): brokerMap.scout[key] is 1 once shown,
// 0 while pending (its trigger fired on a visit that showed another line; ruling T3-b).
export const MAP_SCOUT_KEYS = Object.freeze(['opened', 'sweep', 'firstHub', 'noOptOut', 'bigCheck']);

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// A real YYYY-MM-DD day (round-trips through Date), or null.
function realDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const t = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === day ? day : null;
}

// The local calendar day of an ISO time (same rule as localDay in state.js).
export function dayOf(iso) {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// A save is untrusted JSON: a "__proto__" key would set the output's
// prototype instead of a field, so it is dropped.
const SKIP = '__proto__';

function cleanDays(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (k !== SKIP && realDay(v)) out[k] = v;
  return out;
}

function cleanFiled(filed) {
  if (!isObj(filed)) return undefined;
  const out = {};
  for (const [id, entry] of Object.entries(filed)) {
    if (id === SKIP || !isObj(entry) || !isObj(entry.lines)) continue;
    const e = { lines: cleanDays(entry.lines) };
    if (realDay(entry.since)) e.since = entry.since;
    out[id] = e;
  }
  return out;
}

export function cleanBrokerState(state) {
  if (!isObj(state)) return state;
  const next = { ...state };
  let changed = false;
  const drop = (key) => { delete next[key]; changed = true; };
  if ('brokerFiled' in state) {
    const c = cleanFiled(state.brokerFiled);
    if (c === undefined) drop('brokerFiled');
    else if (JSON.stringify(c) !== JSON.stringify(state.brokerFiled)) { next.brokerFiled = c; changed = true; }
  }
  if ('caResident' in state && !RESIDENCY.includes(state.caResident)) drop('caResident');
  if ('home' in state && !validHome(state.home)) drop('home');
  if ('prescreen' in state && !realDay(state.prescreen)) drop('prescreen');
  if ('bigCheck' in state) {
    if (!isObj(state.bigCheck)) drop('bigCheck');
    else {
      const c = cleanDays(state.bigCheck);
      if (Object.keys(c).length !== Object.keys(state.bigCheck).length) { next.bigCheck = c; changed = true; }
    }
  }
  if ('brokerMap' in state) {
    if (!isObj(state.brokerMap)) drop('brokerMap');
    else {
      const c = cleanBrokerMap(state.brokerMap);
      if (c !== state.brokerMap) { next.brokerMap = c; changed = true; }
    }
  }
  return changed ? next : state;
}

// seenLit is a list of ids; scout keeps only known keys set to 0 (pending) or 1 (seen).
function cleanBrokerMap(bm) {
  let out = bm;
  const set = (key, value) => {
    if (out === bm) out = { ...bm };
    if (value === undefined) delete out[key];
    else out[key] = value;
  };
  if ('seenLit' in bm) {
    if (!Array.isArray(bm.seenLit)) set('seenLit', undefined);
    else if (bm.seenLit.some((id) => typeof id !== 'string')) set('seenLit', bm.seenLit.filter((id) => typeof id === 'string'));
  }
  if ('scout' in bm) {
    if (!isObj(bm.scout)) set('scout', undefined);
    else {
      const scout = {};
      for (const k of MAP_SCOUT_KEYS) if (Object.hasOwn(bm.scout, k) && (bm.scout[k] === 0 || bm.scout[k] === 1)) scout[k] = bm.scout[k];
      if (Object.keys(scout).length !== Object.keys(bm.scout).length) set('scout', scout);
    }
  }
  return out;
}

// One of Scout's map lines has been shown: it never shows again on this save. Never touches
// seenLit (its absence is what makes a map visit the first).
export function markScoutSeen(state, key) {
  if (!MAP_SCOUT_KEYS.includes(key)) return state;
  const prev = isObj(state?.brokerMap) ? state.brokerMap : {};
  const scout = isObj(prev.scout) ? prev.scout : {};
  if (scout[key] === 1) return state;
  return { ...state, brokerMap: { ...prev, scout: { ...scout, [key]: 1 } } };
}

// Lines whose trigger fired on a visit that showed another line: pending (0), so a later visit shows
// them. A seen line stays seen; unknown keys are ignored.
export function markScoutPending(state, keys) {
  const todo = (Array.isArray(keys) ? keys : []).filter((k) => MAP_SCOUT_KEYS.includes(k));
  const prev = isObj(state?.brokerMap) ? state.brokerMap : {};
  const scout = isObj(prev.scout) ? prev.scout : {};
  const add = todo.filter((k) => scout[k] !== 1 && scout[k] !== 0);
  if (!add.length) return state;
  const next = { ...scout };
  for (const k of add) next[k] = 0;
  return { ...state, brokerMap: { ...prev, scout: next } };
}

// The map's lit stars the player has already seen bloom. A save whose brokerMap isn't a plain
// object starts it fresh.
export function markMapSeen(state, litIds) {
  const prev = isObj(state.brokerMap) ? state.brokerMap : {};
  return { ...state, brokerMap: { ...prev, seenLit: [...new Set(litIds)].sort() } };
}

// Lit ids not yet seen on the map. A first visit (no seenLit) treats every lit star as new.
export function newlyLitIds(state, litIds) {
  const seen = isObj(state?.brokerMap) && Array.isArray(state.brokerMap.seenLit) ? new Set(state.brokerMap.seenLit) : new Set();
  return new Set(litIds.filter((id) => !seen.has(id)));
}

function withEntry(state, missionId, entry) {
  return { ...state, brokerFiled: { ...(isObj(state.brokerFiled) ? state.brokerFiled : {}), [missionId]: entry } };
}

export function recordChecklist(state, missionId, lineIds, day, { first = false } = {}) {
  const list = checklistFor(missionId);
  if (!list || (lineIds.length === 0 && !first)) return state;
  const prev = state.brokerFiled?.[missionId];
  const lines = { ...(isObj(prev?.lines) ? prev.lines : {}) };
  const valid = new Set(list.map((l) => l.id));
  for (const id of lineIds) if (valid.has(id)) lines[id] = day;
  const entry = { lines };
  const since = prev?.since ?? (first ? day : undefined);
  if (since) entry.since = since;
  return withEntry(state, missionId, entry);
}

// The debrief's ticks count only on a completed filing.
export function applyChecklistFiling(state, missionId, status, lineIds, day) {
  return status === 'completed' ? recordChecklist(state, missionId, lineIds, day, { first: true }) : state;
}

export function setResidency(state, value) {
  const next = { ...state };
  if (RESIDENCY.includes(value)) next.caResident = value;
  else delete next.caResident;
  return next;
}

export function setHome(state, value) {
  const next = { ...state };
  if (validHome(value)) {
    next.home = value;
    next.caResident = value === 'US-CA' ? 'yes' : value === 'unsaid' ? 'unsaid' : 'no';
  } else {
    delete next.home;
    delete next.caResident;
  }
  return next;
}

// The player's answer, or what an older save's California answer says. An old "not in California"
// says nothing about which state, so it reads as unanswered (the quiz asks again; DROP stays off).
export function homeOf(state) {
  if (validHome(state?.home)) return state.home;
  if (state?.caResident === 'yes') return 'US-CA';
  if (state?.caResident === 'unsaid') return 'unsaid';
  return null;
}

// The day the player did OptOutPrescreen, or null to clear it.
export function setPrescreen(state, day) {
  const next = { ...state };
  if (realDay(day)) next.prescreen = day;
  else delete next.prescreen;
  return next;
}

export function setBigCheck(state, brokerId, ticked, day) {
  const bigCheck = { ...(isObj(state.bigCheck) ? state.bigCheck : {}) };
  if (ticked) bigCheck[brokerId] = day;
  else delete bigCheck[brokerId];
  return { ...state, bigCheck };
}

// A legacy "all" filing (completed, answered all-submitted / done) becomes
// explicit lines at its completedAt day, so a later re-check can't erase it.
export function materializeLegacy(state, missionId) {
  const list = checklistFor(missionId);
  const rec = state.missions?.[missionId];
  if (!list || rec?.status !== 'completed') return state;
  const isAll = Object.entries(LEGACY_ALL_ANSWERS).some(([q, vals]) => vals.includes(rec[q]));
  if (!isAll || state.brokerFiled?.[missionId]?.since) return state;
  const day = dayOf(rec.completedAt);
  if (!day) return state;
  const prev = state.brokerFiled?.[missionId];
  const lines = { ...(isObj(prev?.lines) ? prev.lines : {}) };
  for (const l of list) if (!lines[l.id]) lines[l.id] = day;
  return withEntry(state, missionId, { lines, since: day });
}
