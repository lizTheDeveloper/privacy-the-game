// The sky ladder: the opt-outs that cover the most stars first. Pure: (map, state, lighting) in,
// rungs out. The order is the same for everyone; where the player lives changes only each rung's
// text and whether it can light anything (spec 2026-10-29). Nothing here is tracked.

import { BROKER_CHECKLISTS } from '../data/broker-checklists.js';
import {
  DROP_MISSION, DAA_MISSION, GPC_MISSION, GPC_DONE, GPC_STATES, LADDER_COPY, PRESCREEN, STATE_NAME,
} from '../data/sky-ladder.js';
import { isBuyer, lineDates } from './broker-lighting.js';
import { homeOf } from './broker-state.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const reachableCa = (b) => b.registries?.CA && !isBuyer(b) && b.optOut?.method !== 'none';
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

function starStatus(ids, lighting) {
  const states = ids.map((id) => lighting.stars?.[id]?.state);
  if (states.some((s) => s !== 'lit' && s !== 'amber')) return 'todo';
  return states.includes('amber') ? 'amber' : 'done';
}

const latest = (ids, lighting) => ids.map((id) => lighting.stars?.[id]?.litOn).filter(Boolean).sort().pop() ?? null;

export function ladder(map, state, lighting, checklists = BROKER_CHECKLISTS) {
  const brokers = Array.isArray(map?.brokers) ? map.brokers : [];
  const known = new Set(brokers.map((b) => b.id));
  const reach = new Map(brokers.map((b) => [b.id, Number.isFinite(b.reach) ? b.reach : 0]));
  const home = homeOf(state);
  const stateName = STATE_NAME[home] ?? null;

  const dropIds = brokers.filter(reachableCa).map((b) => b.id);
  const dropDates = lineDates(state, DROP_MISSION, checklists);
  const drop = {
    id: 'drop', kind: 'drop', label: LADDER_COPY.drop.label, mission: DROP_MISSION, starIds: dropIds, count: dropIds.length,
    status: home !== 'US-CA' ? 'preview' : lighting.drop === 'lit' ? 'done' : 'todo',
    text: fill(home === 'US-CA' ? LADDER_COPY.drop.ca : stateName ? LADDER_COPY.drop.other : LADDER_COPY.drop.outside, { count: dropIds.length, state: stateName }),
    doneOn: home === 'US-CA' && lighting.drop === 'lit' ? (dropDates.drop ?? null) : null,
  };

  const gpcRec = isObj(state?.missions?.[GPC_MISSION]) ? state.missions[GPC_MISSION] : null;
  const gpcDone = gpcRec?.status === 'completed' && GPC_DONE.includes(gpcRec.action);
  const gpc = {
    id: 'gpc', kind: 'gpc', label: LADDER_COPY.gpc.label, mission: GPC_MISSION, starIds: [], count: null,
    status: gpcDone ? 'done' : 'todo',
    text: fill(Object.hasOwn(GPC_STATES, home ?? '') ? LADDER_COPY.gpc.must : LADDER_COPY.gpc.may, { state: stateName }),
    doneOn: gpcDone && typeof gpcRec.completedAt === 'string' ? gpcRec.completedAt.slice(0, 10) : null,
  };

  const daaIds = (map?.sweeps?.daa?.members ?? []).filter((id) => known.has(id));
  const daaDay = lineDates(state, DAA_MISSION, checklists).daa ?? null;
  const daa = {
    id: 'daa', kind: 'daa', label: LADDER_COPY.daa.label, mission: DAA_MISSION, starIds: daaIds, count: daaIds.length,
    status: daaDay ? 'done' : 'todo', text: LADDER_COPY.daa.body, doneOn: daaDay,
  };

  const preIds = PRESCREEN.brokers.filter((id) => known.has(id));
  const prescreen = {
    id: 'prescreen', kind: 'prescreen', label: LADDER_COPY.prescreen.label, mission: null, starIds: preIds, count: preIds.length,
    status: state?.prescreen ? starStatus(preIds, lighting) : 'todo', text: LADDER_COPY.prescreen.body,
    doneOn: state?.prescreen ?? null,
  };

  // One rung per checklist line that isn't DROP or the DAA, first mission wins a shared line id.
  const seen = new Set(['drop', 'daa']);
  const lines = [];
  for (const [mission, list] of Object.entries(isObj(checklists) ? checklists : {})) {
    if (!Array.isArray(list)) continue;
    const dates = lineDates(state, mission, checklists);
    for (const l of list) {
      if (seen.has(l.id)) continue;
      seen.add(l.id);
      const ids = (Array.isArray(l.brokers) ? l.brokers : []).filter((id) => known.has(id));
      const status = ids.length ? starStatus(ids, lighting) : dates[l.id] ? 'done' : 'todo';
      lines.push({
        id: `line:${l.id}`, kind: 'line', label: l.label, mission, starIds: ids, count: ids.length,
        status, text: l.hint ?? '', doneOn: status === 'todo' ? null : (dates[l.id] ?? latest(ids, lighting)),
      });
    }
  }
  const sum = (r) => r.starIds.reduce((t, id) => t + (reach.get(id) ?? 0), 0);
  lines.sort((a, b) => b.starIds.length - a.starIds.length || sum(b) - sum(a) || a.label.localeCompare(b.label));

  return [drop, gpc, daa, prescreen, ...lines];
}

// The biggest rung the player can still do: a preview (DROP outside California) never is.
export function nextRung(rungs) {
  return (Array.isArray(rungs) ? rungs : []).find((r) => r.status === 'todo' || r.status === 'amber') ?? null;
}
