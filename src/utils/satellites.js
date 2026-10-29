// The government satellites (spec 2026-10-29): the 12 US agencies in the dataset are buyers, so
// they never light. They're drawn as satellites in a band above the broker field, with a line down
// to each broker the public record shows them buying from. Lighting that broker cuts the line.
// Pure. Initials only: no seal, logo or agency colour.

import { isBuyer } from './broker-lighting.js';

export const SATELLITES = Object.freeze([
  ['us-fbi', 'FBI'], ['us-ice', 'ICE'], ['us-cbp', 'CBP'], ['us-dea', 'DEA'], ['us-usms', 'USMS'], ['us-usss', 'USSS'],
  ['us-irs', 'IRS'], ['us-dcsa', 'DCSA'], ['us-army', 'ARMY'], ['us-navy', 'NAVY'], ['us-air-force', 'USAF'], ['us-socom', 'SOCOM'],
].map(([id, initials]) => Object.freeze({ id, initials })));

export const SATELLITE_IDS = new Set(SATELLITES.map((s) => s.id));

// The band above the field (map y < 0). The view's top bound (VIEW_BOUNDS.top) reaches it.
export const SAT_BAND = Object.freeze({ top: -170, y: -80 });

// Where each satellite hangs: evenly across the left 80% of the map (the zoom buttons sit over the
// top-right corner), in two staggered rows. u: map units per CSS px, so the rows stay apart on screen.
export function satelliteBand(size = 1000, u = 1) {
  const n = SATELLITES.length;
  const k = Number.isFinite(u) && u > 0 ? u : 1;
  return SATELLITES.map((s, i) => ({ ...s, index: i, x: size * (0.04 + (0.78 * i) / (n - 1)), y: SAT_BAND.y + (i % 2 ? 15 : -15) * k }));
}

// A broker with no opt-out on file and no California registration can't be filed with by anyone,
// so a line to it can never be cut.
const hasWayOut = (b) => Boolean(b) && !isBuyer(b) && ((b.optOut && b.optOut.method !== 'none') || Boolean(b.registries?.CA));

// { [satId]: { lines: [{ broker, way, cut, link }], cut, cuttable, total } }. A line is cut only by
// a lit or re-check-due star; a browser-only halo or a DROP preview never cuts one.
export function satelliteLines(map, lighting) {
  const byId = new Map((Array.isArray(map?.brokers) ? map.brokers : []).map((b) => [b.id, b]));
  const out = {};
  for (const s of SATELLITES) out[s.id] = { lines: [], cut: 0, cuttable: 0, total: 0 };
  for (const l of Array.isArray(map?.links) ? map.links : []) {
    if (l?.type !== 'buys' || !SATELLITE_IDS.has(l.from)) continue;
    const b = byId.get(l.to);
    if (!b) continue;
    const way = hasWayOut(b);
    const st = lighting?.stars?.[b.id]?.state;
    const cut = way && (st === 'lit' || st === 'amber');
    const sat = out[l.from];
    sat.lines.push({ broker: b, way, cut, link: l });
    sat.total += 1;
    if (way) sat.cuttable += 1;
    if (cut) sat.cut += 1;
  }
  return out;
}

// Every cuttable line cut (and at least one): the satellite dims. One with none to cut never does.
export const satDimmed = (sat) => sat.cuttable > 0 && sat.cut === sat.cuttable;
