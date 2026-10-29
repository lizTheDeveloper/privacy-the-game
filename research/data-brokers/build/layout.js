// CLI + library: build src/data/broker-layout.json, the fixed star coordinates for the Broker
// Constellation map, so phones draw the map without running a simulation.
// Run: npm run brokers:layout (after brokers:export). Deterministic: same input, byte-identical output.
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readFile, readdir, writeFile } from 'node:fs/promises';

export const FORMAT_VERSION = 1;
const SIZE = 1000;
// Liz (2026-10-29): "make the stars not be a circle". The sky is a wide field with ragged edges, not a
// disc: it fills the map's width, from just under the top to above the satellites' band at the bottom.
export const SKY = Object.freeze({ left: 24, right: 976, top: 56, bottom: 820 });
const CX = SIZE / 2;
export const CY = (SKY.top + SKY.bottom) / 2;
const BUYER_ROW_Y = 26; // non-government buyers: a row along the top edge
const GOV_ROW_Y = 900; // government buyers: drawn as satellites at the bottom (src/utils/satellites.js)
// Linked brokers and hubs stay inside these boxes (half-widths, half-heights about the field's centre).
export const INNER_BOX = Object.freeze({ hx: 400, hy: 300 });
const HUB_BOX = Object.freeze({ hx: 340, hy: 250 });
// Liz (2026-10-24): "the stars are a ring instead of like... constellations". The unlinked crowd is cut
// into small constellations of one kind each, scattered over the whole sky between the hubs.
const ASTERISM_MAX = 13; // stars per constellation, at most
const ASTERISM_MIN = 4; // and at least (a kind with fewer stars is one smaller constellation)
const CLUSTERS = 11; // regions the constellations gather in, with dark sky between
const CLUSTER_SIGMA = 62; // spread of a region's constellation centres
const CENTRE_GAP = 46; // no two constellation centres closer than this
const FIGURE_MIN = 4; // stars joined into a constellation's figure…
const FIGURE_MAX = 7; // …the rest are loose field stars around it
const FIG_STEP_MIN = 20; // a figure is an angular zigzag, each step this long…
const FIG_STEP_SPAN = 16; // …plus up to this much
const FIELD_SIGMA = 16; // spread of the field stars round the figure
const STAR_GAP = 9; // no two crowd stars closer than this
const CLEAR_OF_LINKED = 24; // crowd stars keep this far from any linked star
const CLEAR_OF_HUB = 62; // and this far from a hub (its nebula)
const SEED = 20261018;
const ITERATIONS = 400;
const T_START = 60;
const T_END = 0.5;
const HUB_GAP = 140;
const PUSH_PASSES = 200;
// Controller ruling M1 (2026-10-23, mockup A): hubs are bright stars with their crowd as a nebula around them.
const REPULSION = 0.06; // scale on FR repulsion k^2/d
const BUYER_PULL = 0.05; // weight of attraction along a link to a fixed buyer
const HUB_GRAVITY = 0.02; // pull of each hub toward the centre, per unit distance
const HUB_REPULSION = 2; // extra push between hubs closer than HUB_GAP + HUB_MARGIN
const HUB_MARGIN = 20;
const NEBULA_SPRING = 1; // spring from a non-hub to its anchor
const NEBULA_DIST = 60; // rest length of that spring
const GRAVITY = 0.25; // pull of each non-hub toward the centre, per unit distance
const CROWD_SEED = SEED + 1;
// The constellation each kind is named for on the map (the Big Check's group names).
export const KIND_NAMES = Object.freeze({
  'people-search': 'People search', marketing: 'Marketing', 'risk-identity': 'Risk and identity', location: 'Location',
  financial: 'Financial', health: 'Health', automotive: 'Automotive', 'identity-resolution': 'Identity resolution',
  'data-marketplace': 'Data marketplaces', 'ad-network': 'Ad networks',
});

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const round1 = (n) => Math.round(n * 10) / 10 + 0; // + 0 turns -0 into 0

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const starRadius = (reach, known) => 2 + 2.2 * Math.log2(reach) + (known ? 1 : 0);

function clamp(p, box) {
  p.x = Math.min(CX + box.hx, Math.max(CX - box.hx, p.x));
  p.y = Math.min(CY + box.hy, Math.max(CY - box.hy, p.y));
}

// The field's ragged edge: each side is pulled in by a slow, deterministic wave (0–60 units), so the
// sky ends unevenly, like a real one seen between rooftops, never as a circle or a clean rectangle.
const wave = (t, a, b, c) => 30 + 16 * Math.sin(t * a + 1.3) + 10 * Math.sin(t * b + 4.1) + 4 * Math.sin(t * c);
export function inSky(x, y) {
  return x >= SKY.left + wave(y / SIZE, 7.1, 13.3, 29) && x <= SKY.right - wave(y / SIZE, 5.3, 11.9, 31)
    && y >= SKY.top + wave(x / SIZE, 6.2, 15.1, 27) && y <= SKY.bottom - wave(x / SIZE, 8.4, 12.7, 23);
}

export function computeLayout(map, sizeKnown) {
  const brokers = [...map.brokers].sort((a, b) => cmp(a.id, b.id));
  const isBuyer = (b) => b.kind.includes('buyer');
  const linkedIds = new Set(map.links.flatMap((l) => [l.from, l.to]));
  const pos = new Map();

  // Buyers, no longer a ring round the sky: the government ones in a row at the bottom (the game draws
  // them as satellites there), the rest in a row along the top. Evenly spaced, in id order.
  const buyers = brokers.filter(isBuyer);
  const gov = buyers.filter((b) => b.id.startsWith('us-'));
  const others = buyers.filter((b) => !b.id.startsWith('us-'));
  const row = (list, y) => list.forEach((b, i) => pos.set(b.id, { x: SIZE * (0.06 + (0.88 * (i + 0.5)) / list.length), y }));
  row(gov, GOV_ROW_Y);
  row(others, BUYER_ROW_Y);

  const unlinked = brokers.filter((b) => !isBuyer(b) && !linkedIds.has(b.id));

  // Linked non-buyers by Fruchterman-Reingold inside INNER, buyers as fixed anchors.
  const movers = brokers.filter((b) => !isBuyer(b) && linkedIds.has(b.id));
  const rand = mulberry32(SEED);
  for (const b of movers) {
    pos.set(b.id, { x: CX + (rand() * 2 - 1) * INNER_BOX.hx, y: CY + (rand() * 2 - 1) * INNER_BOX.hy });
  }
  const moving = new Set(movers.map((b) => b.id));
  const buyerIds = new Set(buyers.map((b) => b.id));
  const hubIds = new Set(movers.filter((b) => b.hub).map((b) => b.id));
  const edgeKeys = new Set();
  const edges = [];
  for (const l of map.links) {
    if (l.from === l.to) continue;
    const [u, v] = cmp(l.from, l.to) < 0 ? [l.from, l.to] : [l.to, l.from];
    const key = `${u}\u0000${v}`;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    edges.push([u, v]);
  }
  edges.sort((a, b) => cmp(a[0], b[0]) || cmp(a[1], b[1]));
  const neighbours = new Map(movers.map((b) => [b.id, []]));
  for (const [u, v] of edges) {
    if (neighbours.has(u)) neighbours.get(u).push(v);
    if (neighbours.has(v)) neighbours.get(v).push(u);
  }
  // Each non-hub's nebula anchors: the hubs it is linked to, else its linked non-buyer neighbours, else
  // (linked only to buyers) the centre.
  const anchorsOf = new Map();
  for (const b of movers) {
    if (b.hub) continue;
    const nb = neighbours.get(b.id);
    const hubsLinked = nb.filter((id) => hubIds.has(id));
    anchorsOf.set(b.id, hubsLinked.length ? hubsLinked : nb.filter((id) => moving.has(id)));
  }
  const anchorPoint = (id) => {
    const ids = anchorsOf.get(id);
    if (!ids.length) return { x: CX, y: CY };
    let x = 0, y = 0;
    for (const a of ids) { x += pos.get(a).x; y += pos.get(a).y; }
    return { x: x / ids.length, y: y / ids.length };
  };

  const n = movers.length;
  if (n > 0) {
    const k = Math.sqrt((4 * INNER_BOX.hx * INNER_BOX.hy) / n);
    const k2 = k * k;
    for (let it = 0; it < ITERATIONS; it++) {
      const t = ITERATIONS === 1 ? T_END : T_START + ((T_END - T_START) * it) / (ITERATIONS - 1);
      const disp = new Map(movers.map((b) => [b.id, { x: 0, y: 0 }]));
      const add = (id, dx, dy, f) => { const dd = disp.get(id); dd.x += dx * f; dd.y += dy * f; };
      for (let i = 0; i < n; i++) {
        const p = pos.get(movers[i].id);
        for (let j = i + 1; j < n; j++) {
          const q = pos.get(movers[j].id);
          let dx = p.x - q.x, dy = p.y - q.y;
          let d = Math.hypot(dx, dy);
          if (d < 0.01) { dx = 0.01; dy = 0; d = 0.01; }
          let f = (REPULSION * k2) / d;
          const bothHubs = movers[i].hub && movers[j].hub;
          if (bothHubs && d < HUB_GAP + HUB_MARGIN) f += HUB_REPULSION * (HUB_GAP + HUB_MARGIN - d);
          add(movers[i].id, dx / d, dy / d, f);
          add(movers[j].id, dx / d, dy / d, -f);
        }
      }
      for (const [u, v] of edges) {
        const p = pos.get(u), q = pos.get(v);
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < 0.01) continue;
        // Buyers are fixed anchors whose pull is weak, so hubs are not dragged to the rim.
        const w = buyerIds.has(u) || buyerIds.has(v) ? BUYER_PULL : 1;
        const f = (w * d * d) / k;
        if (moving.has(u)) add(u, dx / d, dy / d, -f);
        if (moving.has(v)) add(v, dx / d, dy / d, f);
      }
      for (const b of movers) {
        const p = pos.get(b.id);
        if (b.hub) {
          // Hubs: gentle gravity toward the centre keeps them off the edge.
          add(b.id, CX - p.x, CY - p.y, HUB_GRAVITY);
        } else {
          // Nebula spring: settle NEBULA_DIST from the anchor (hub(s) linked to, else linked neighbours).
          const a = anchorPoint(b.id);
          const dx = a.x - p.x, dy = a.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d > 0.01) add(b.id, dx / d, dy / d, NEBULA_SPRING * (d - NEBULA_DIST));
          add(b.id, CX - p.x, CY - p.y, GRAVITY);
        }
      }
      for (const b of movers) {
        const p = pos.get(b.id), dv = disp.get(b.id);
        const len = Math.hypot(dv.x, dv.y);
        if (len > 0) {
          const step = Math.min(len, t);
          p.x += (dv.x / len) * step; p.y += (dv.y / len) * step;
        }
        clamp(p, b.hub ? HUB_BOX : INNER_BOX);
      }
    }

    // Spread the hubs: no two closer than HUB_GAP. A hub's nebula moves with it.
    const hubList = movers.filter((b) => b.hub).map((b) => b.id);
    const before = new Map(hubList.map((id) => [id, { ...pos.get(id) }]));
    for (let pass = 0; pass < PUSH_PASSES; pass++) {
      let moved = false;
      for (let i = 0; i < hubList.length; i++) {
        for (let j = i + 1; j < hubList.length; j++) {
          const p = pos.get(hubList[i]), q = pos.get(hubList[j]);
          let dx = q.x - p.x, dy = q.y - p.y;
          let d = Math.hypot(dx, dy);
          if (d >= HUB_GAP) continue;
          if (d < 0.01) { dx = 1; dy = 0; d = 1; }
          const push = (HUB_GAP - d) / 2 + 0.05;
          p.x -= (dx / d) * push; p.y -= (dy / d) * push;
          q.x += (dx / d) * push; q.y += (dy / d) * push;
          clamp(p, HUB_BOX); clamp(q, HUB_BOX);
          moved = true;
        }
      }
      if (!moved) break;
    }
    for (const [id, anchors] of anchorsOf) {
      const hubAnchors = anchors.filter((a) => hubIds.has(a));
      if (!hubAnchors.length) continue;
      let sx = 0, sy = 0;
      for (const h of hubAnchors) { sx += pos.get(h).x - before.get(h).x; sy += pos.get(h).y - before.get(h).y; }
      const p = pos.get(id);
      p.x += sx / hubAnchors.length; p.y += sy / hubAnchors.length;
      clamp(p, INNER_BOX);
    }
  }

  const { figures, names } = placeConstellations(unlinked, pos, movers, mulberry32(CROWD_SEED));

  const stars = brokers.map((b) => {
    const p = pos.get(b.id);
    return [b.id, round1(p.x), round1(p.y), round1(starRadius(b.reach, sizeKnown.has(b.id)))];
  });
  const index = new Map(brokers.map((b, i) => [b.id, i]));
  return {
    formatVersion: FORMAT_VERSION, asOf: map.asOf, size: SIZE, stars,
    // Constellation lines: [i, j] star indices, same kind of company, not a documented link.
    figures: figures.map(([a, b]) => [index.get(a), index.get(b)]).sort((x, y) => x[0] - y[0] || x[1] - y[1]),
    // Constellation names: [label, x, y].
    names: names.map(([l, x, y]) => [l, round1(x), round1(y)]),
  };
}


// Cut the unlinked crowd into constellations of one kind (at most ASTERISM_MAX stars), scatter their
// centres over the open sky, and join each constellation's stars by a minimum spanning tree (its
// figure). Same-kind constellations sit near each other, and each named kind gets one name.
function placeConstellations(unlinked, pos, movers, rand) {
  const byKind = new Map();
  for (const b of unlinked) {
    const k = b.kind[0] ?? '';
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k).push(b);
  }
  const kinds = [...byKind.keys()].sort((a, b) => (a === '') - (b === '') || cmp(a, b));
  // Real constellations vary: cut each kind into runs of ASTERISM_MIN..ASTERISM_MAX stars.
  const chunksOf = (k) => {
    const list = byKind.get(k);
    const out = [];
    for (let i = 0; i < list.length;) {
      let size = ASTERISM_MIN + Math.floor(rand() * (ASTERISM_MAX - ASTERISM_MIN + 1));
      if (list.length - (i + size) < ASTERISM_MIN) size = list.length - i; // no stub at the end
      if (size > ASTERISM_MAX) size = Math.ceil((list.length - i) / 2);
      out.push({ kind: k, members: list.slice(i, i + size) });
      i += size;
    }
    return out;
  };
  // Named kinds spread round the sky: each followed by an even share of the unnamed constellations,
  // so the walk below doesn't bunch every name in one corner.
  const namedKinds = kinds.filter((k) => k !== '');
  const unnamed = byKind.has('') ? chunksOf('') : [];
  const chunks = [];
  namedKinds.forEach((k, i) => {
    chunks.push(...chunksOf(k));
    const from = Math.round((unnamed.length * i) / Math.max(1, namedKinds.length));
    const to = Math.round((unnamed.length * (i + 1)) / Math.max(1, namedKinds.length));
    chunks.push(...unnamed.slice(from, to));
  });
  if (!namedKinds.length) chunks.push(...unnamed);
  if (!chunks.length) return { figures: [], names: [] };

  const fixed = movers.map((b) => ({ ...pos.get(b.id), hub: b.hub === true }));
  const open = (x, y, clear = 1) => inSky(x, y)
    && fixed.every((f) => Math.hypot(f.x - x, f.y - y) >= (f.hub ? CLEAR_OF_HUB : CLEAR_OF_LINKED) * clear);

  // Centres gather in a few regions with dark sky between, as stars do: region seeds spread over the
  // open sky, then each centre a Gaussian step from a seed. The gap shrinks only if the sky runs out.
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const seeds = [];
  for (let tries = 0; tries < 20000 && seeds.length < CLUSTERS; tries++) {
    const x = SKY.left + rand() * (SKY.right - SKY.left), y = SKY.top + rand() * (SKY.bottom - SKY.top);
    if (open(x, y, 1.6) && seeds.every((q) => Math.hypot(q.x - x, q.y - y) >= 190)) seeds.push({ x, y });
  }
  if (!seeds.length) seeds.push({ x: CX, y: CY });
  let gap = CENTRE_GAP;
  let centres = [];
  while (centres.length < chunks.length && gap > 10) {
    centres = [];
    for (let tries = 0; tries < 40000 && centres.length < chunks.length; tries++) {
      const seed = seeds[tries % seeds.length];
      const sigma = CLUSTER_SIGMA * (1 + Math.floor(tries / 8000) * 0.35); // widen if a region fills
      const x = seed.x + gauss() * sigma, y = seed.y + gauss() * sigma;
      if (!open(x, y, 1.6)) continue;
      if (centres.every((c) => Math.hypot(c.x - x, c.y - y) >= gap)) centres.push({ x, y });
    }
    gap *= 0.94;
  }
  // Same-kind constellations side by side: walk the centres nearest-first from the topmost.
  const order = [];
  const left = [...centres];
  let at = left.reduce((best, c) => (c.y < best.y ? c : best), left[0]);
  while (left.length) {
    left.sort((a, b) => Math.hypot(a.x - at.x, a.y - at.y) - Math.hypot(b.x - at.x, b.y - at.y));
    at = left.shift();
    order.push(at);
  }

  const placed = [];
  const figures = [];
  const named = new Map();
  chunks.forEach((chunk, ci) => {
    const centre = order[ci] ?? { x: CX, y: CY };
    const m = chunk.members.length;
    const pts = [];
    const ok = (x, y) => open(x, y) && placed.every((q) => Math.hypot(q.x - x, q.y - y) >= STAR_GAP);
    const put = (b, p) => { pos.set(b.id, p); placed.push(p); pts.push({ id: b.id, ...p }); };
    const scatter = (sigma, c = centre) => {
      for (let t = 0; t < 400; t++) {
        const g = 1 + t / 120;
        const x = c.x + gauss() * sigma * g, y = c.y + gauss() * sigma * g;
        if (ok(x, y)) return { x, y };
      }
      return { x: c.x + (rand() - 0.5) * sigma, y: c.y + (rand() - 0.5) * sigma };
    };
    // As in the real sky, a few stars make the figure and the rest are loose field stars around it.
    const nFig = Math.min(m, FIGURE_MIN + Math.floor(rand() * (FIGURE_MAX - FIGURE_MIN + 1)));
    const fig = [];
    let heading = 2 * Math.PI * rand();
    let turn = rand() < 0.5 ? 1 : -1;
    chunk.members.slice(0, nFig).forEach((b, i) => {
      let p = null;
      let from = null;
      if (i === 0) p = scatter(6);
      // An angular zigzag: each step long, turning one way then the other; now and then a branch.
      for (let t = 0; t < 80 && !p; t++) {
        from = rand() < 0.22 && fig.length > 2 ? fig[Math.floor(rand() * (fig.length - 1))] : fig[fig.length - 1];
        const a = heading + turn * (0.35 + rand() * 1.0) + (t > 20 ? (rand() - 0.5) * t * 0.05 : 0);
        const r = FIG_STEP_MIN + rand() * FIG_STEP_SPAN;
        const x = from.x + r * Math.cos(a), y = from.y + r * Math.sin(a);
        if (ok(x, y)) { p = { x, y }; heading = a; turn = -turn; }
      }
      if (!p) { p = scatter(14); from = fig[fig.length - 1] ?? null; }
      put(b, p);
      const me = { id: b.id, ...p };
      if (from) figures.push(cmp(from.id, b.id) < 0 ? [from.id, b.id] : [b.id, from.id]);
      fig.push(me);
    });
    // Field stars gather round the figure's middle.
    const mid = { x: fig.reduce((t, p) => t + p.x, 0) / fig.length, y: fig.reduce((t, p) => t + p.y, 0) / fig.length };
    for (const b of chunk.members.slice(nFig)) put(b, scatter(FIELD_SIGMA + 3 * Math.sqrt(m), mid));
    if (chunk.kind && KIND_NAMES[chunk.kind]) {
      if (!named.has(chunk.kind)) named.set(chunk.kind, []);
      named.get(chunk.kind).push(...pts);
    }
  });
  // One name per kind, just above its first constellation.
  const names = [];
  // Biggest kinds first: when names crowd, the map keeps theirs.
  for (const k of [...kinds].sort((a, b) => byKind.get(b).length - byKind.get(a).length || cmp(a, b))) {
    const pts = named.get(k);
    if (!pts) continue;
    const first = pts.slice(0, Math.min(pts.length, ASTERISM_MAX));
    // Kept in from the sky's edge so a long name isn't cut off.
    const x = Math.min(SKY.right - 80, Math.max(SKY.left + 80, first.reduce((s, p) => s + p.x, 0) / first.length));
    const y = Math.min(...first.map((p) => p.y)) - 14;
    names.push([KIND_NAMES[k], x, y]);
  }
  return { figures, names };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const mapPath = resolve(dir, '../../src/data/broker-map.json');
  const outPath = resolve(dir, '../../src/data/broker-layout.json');
  const map = JSON.parse(await readFile(mapPath, 'utf8'));
  const sizeKnown = new Set();
  for (const f of (await readdir(join(dir, 'brokers'))).filter((x) => x.endsWith('.json'))) {
    const b = JSON.parse(await readFile(join(dir, 'brokers', f), 'utf8'));
    if (b.size?.known === true) sizeKnown.add(b.id);
  }
  const text = JSON.stringify(computeLayout(map, sizeKnown));
  await writeFile(outPath, text);
  console.log(`wrote ${outPath}: ${map.brokers.length} stars, ${(Buffer.byteLength(text) / 1024).toFixed(1)} KB (${Buffer.byteLength(text)} bytes)`);
}
