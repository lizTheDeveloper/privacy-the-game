import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderCityMap, BACKDROP_SLOTS, wideBlockPositions } from '../src/screens/city-map.js';
import { createInitialState } from '../src/state.js';
import { setChosenPod } from '../src/utils/pod-pref.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

// Today's map (captured from 08cfee2 before the broader city was added).
const TODAY = readFileSync(new URL('./fixtures/city-map-no-data.html', import.meta.url), 'utf8');

const POD = (id, label, players, pct) => ({ id, label, level: 'city', players, ...(pct === undefined ? {} : { fortified: { pct } }) });
const DATA = {
  k: 50, asOf: '2026-10-06T04:00:00Z', city: { players: 6000 },
  pods: [
    POD('us-wa-seattle', 'Seattle', 264, 24),
    POD('us-il-chicago', 'Chicago', 248, 21),
    POD('us-rest', 'Rest of United States', 4100, 16),
    POD('gb', 'United Kingdom', 503),
    { id: 'us-il-rest', label: 'Rest of Illinois' }, // suppressed: no player count
  ],
};
const ready = (data) => ({ collective: { status: 'ready', data } });

// The wide layer is emitted just before the map (so it paints beneath it); split them apart.
const wideOf = (html) => (html.includes('<div class="city-wide"') ? html.slice(html.indexOf('<div class="city-wide"'), html.indexOf('<div class="city-map')) : '');
const mapOf = (html) => html.slice(html.indexOf('<div class="city-map'));

function podBlocks(html) {
  return [...html.matchAll(/<a class="city-block city-pod[^"]*"[^>]*>/g)].map((m) => m[0]);
}

describe('city map: the broader city', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('without collective data the map is exactly today\'s', () => {
    const s = createInitialState();
    expect(renderCityMap(s)).toBe(TODAY);
    for (const status of ['idle', 'loading', 'error']) {
      expect(renderCityMap(s, { collective: { status } })).toBe(TODAY);
    }
  });

  it('with data: one labelled block per published pod, linking to the whole city', () => {
    const html = renderCityMap(createInitialState(), ready(DATA));
    const blocks = podBlocks(html);
    expect(blocks).toHaveLength(4);
    for (const b of blocks) expect(b).toContain('href="#/city-together"');
    expect(html).toContain('data-label="Seattle · 264 players · 24% fortified"');
    expect(html).toContain('aria-label="Seattle · 264 players · 24% fortified"');
    expect(html).toContain('data-label="United Kingdom · 503 players"');
    expect(html).not.toContain('Rest of Illinois');
    expect(html).not.toMatch(/undefined|NaN/);
  });

  it('largest pods take the nearest backdrop slots; unfilled slots keep today\'s silhouettes', () => {
    const html = renderCityMap(createInitialState(), ready(DATA));
    const slotOf = Object.fromEntries([...html.matchAll(/data-pod="([^"]+)" data-slot="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    expect(slotOf['us-rest']).toBe(BACKDROP_SLOTS[0].key);
    expect(slotOf.gb).toBe(BACKDROP_SLOTS[1].key);
    expect(slotOf['us-wa-seattle']).toBe(BACKDROP_SLOTS[2].key);
    expect(slotOf['us-il-chicago']).toBe(BACKDROP_SLOTS[3].key);
    const generic = html.match(/<div class="city-block city-block--(far|mid)"/g) || [];
    expect(generic).toHaveLength(9 - 4);
  });

  it('your pod sits in the slot nearest your districts, highlighted', () => {
    setChosenPod('us-il-chicago');
    const html = renderCityMap(createInitialState(), ready(DATA));
    const blocks = podBlocks(html);
    const yours = blocks.filter((b) => b.includes('is-yours'));
    expect(yours).toHaveLength(1);
    expect(yours[0]).toContain('data-pod="us-il-chicago"');
    expect(yours[0]).toContain(`data-slot="${BACKDROP_SLOTS[0].key}"`);
  });

  it('lit windows follow fortified pct; a pod without pct stays dim', () => {
    const html = renderCityMap(createInitialState(), ready(DATA));
    const block = (id) => html.slice(html.indexOf(`data-pod="${id}"`), html.indexOf('</a>', html.indexOf(`data-pod="${id}"`)));
    expect(block('gb')).not.toMatch(/_lib\.png|iso_liberated/);
    const lit = (id) => (block(id).match(/iso_tower_lib\.png|iso_liberated\.png/g) || []).length;
    expect(lit('us-wa-seattle')).toBeGreaterThan(0);
  });

  it('a big city spills past the frame: extra rings render outside the 960px map for wide screens only', () => {
    const many = { ...DATA, pods: Array.from({ length: 30 }, (_, i) => POD(`p${i}`, `Place ${i}`, 60 + i * 10, i)) };
    const html = renderCityMap(createInitialState(), ready(many));
    expect(podBlocks(html)).toHaveLength(30);
    const wide = wideOf(html);
    expect(html).toContain('<div class="city-wide"');
    expect(podBlocks(wide)).toHaveLength(30 - 9);
    expect(html).toMatch(/@media \(min-width: \d+px\)[^{]*\{[^}]*\.city-wide/);
  });

  it('few pods: no wide layer at all', () => {
    expect(renderCityMap(createInitialState(), ready(DATA))).not.toContain('<div class="city-wide"');
  });

  it('district blocks, labels and scout are unchanged by the data', () => {
    const s = createInitialState();
    const html = renderCityMap(s, ready(DATA));
    const between = (h, a, b) => h.slice(h.indexOf(a), h.indexOf(b, h.indexOf(a)));
    expect(between(html, '<div class="city-plaza"', '<div class="city-vignette">')).toBe(between(TODAY, '<div class="city-plaza"', '<div class="city-vignette">'));
    expect(html.slice(html.indexOf('<div class="city-vignette">'), html.lastIndexOf('</div>'))).toBe(TODAY.slice(TODAY.indexOf('<div class="city-vignette">'), TODAY.lastIndexOf('</div>')));
  });

  it('escapes pod labels', () => {
    const evil = { ...DATA, pods: [POD('x', '"><img src=x>', 99, 10)] };
    const html = renderCityMap(createInitialState(), ready(evil));
    expect(html).not.toContain('<img src=x>');
  });
});

describe('city map: backdrop pods stay behind your city', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });
  const big = { ...DATA, pods: Array.from({ length: 20 }, (_, i) => POD(`p${i}`, `Place ${i}`, 50000 - i, 30)) };

  it('in-map pods are never drawn larger than the old silhouettes (scale capped at 1)', () => {
    const html = renderCityMap(createInitialState(), ready(big));
    const mapPart = mapOf(html);
    const blocks = [...mapPart.matchAll(/<a class="city-block city-pod[\s\S]*?<\/a>/g)].map((m) => m[0]);
    expect(blocks).toHaveLength(9);
    for (const b of blocks) {
      for (const [, w] of b.matchAll(/width: ([\d.]+)px; z-index/g)) expect(Number(w)).toBeLessThanOrEqual(80);
    }
    const wide = wideOf(html);
    const wideWidths = [...wide.matchAll(/width: ([\d.]+)px; z-index/g)].map((m) => Number(m[1]));
    expect(Math.max(...wideWidths)).toBeGreaterThan(80); // the wide layer may still go bigger
  });

  it('hover/focus does not lift a pod above the district clusters', () => {
    const html = renderCityMap(createInitialState(), ready(DATA));
    const rule = html.match(/\.city-pod:hover, \.city-pod:focus-visible \{[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule[0]).not.toMatch(/z-index/);
  });
});

describe('city map: the wide city is one continuous city', () => {
  it('the wide layer paints under the map yet above the page, so its pods take the pointer', () => {
    const many = { ...DATA, pods: Array.from({ length: 30 }, (_, i) => POD(`p${i}`, `Place ${i}`, 60 + i * 10, i)) };
    const html = renderCityMap(createInitialState(), ready(many));
    expect(html.indexOf('<div class="city-wide"')).toBeLessThan(html.indexOf('<div class="city-map'));
    const rule = html.match(/\.city-wide \{ display: block;[^}]*\}/)[0];
    expect(rule).toMatch(/z-index: 0;/);
    expect(rule).not.toMatch(/z-index: -1/);
  });

  it('on tall screens the wide layer reaches the bottom of the window; its sky stays 720px', () => {
    const many = { ...DATA, pods: Array.from({ length: 30 }, (_, i) => POD(`p${i}`, `Place ${i}`, 60 + i * 10, i)) };
    const html = renderCityMap(createInitialState(), ready(many));
    const rule = html.match(/\.city-wide \{ display: block;[^}]*\}/)[0];
    expect(rule).toContain('height: max(720px, 100vh)');
    expect(rule).toMatch(/linear-gradient\([^;]*\) top \/ 100% 720px no-repeat, #101626/);
    expect(html).toMatch(/\.city-wide::after \{[^}]*calc\(100% - 216px\)/);
    expect(html).toContain('#000 calc(100% - 180px), transparent calc(100% - 20px)');
  });

  it('more pods than the side band holds spill into rows below, nearest first', () => {
    const all = wideBlockPositions(Infinity);
    const lower = all.filter((at) => at[0] + at[1] > 6);
    expect(lower.length).toBeGreaterThan(40);
    const d = (at) => Math.hypot((at[0] - at[1]) * 120, (at[0] + at[1]) * 60 + 20 - 140);
    for (let i = 1; i < lower.length; i += 1) expect(d(lower[i])).toBeGreaterThanOrEqual(d(lower[i - 1]) - 1e-9);
  });

  beforeEach(() => { globalThis.localStorage = memoryStorage(); });
  // Independent of the module: block (bc, br) centre in px from tile (0,0), and the plaza at block (1,1).
  const centre = ([bc, br]) => ({ x: (bc - br) * 120, y: (bc + br) * 60 + 20 });
  const dist = (at) => { const c = centre(at); return Math.hypot(c.x - 0, c.y - 140); };
  const cap = () => wideBlockPositions(Infinity).length;

  it('every wide block sits on the iso block lattice, outside the 960px map, with no two on one lot', () => {
    const CAP = cap();
    expect(CAP).toBeGreaterThanOrEqual(60);
    const all = wideBlockPositions(CAP);
    const keys = new Set();
    for (const at of all) {
      expect(at).toHaveLength(2);
      for (const v of at) expect(Number.isInteger(v)).toBe(true);
      // Beside the map (past its districts and backdrop), or well below it (under the Scout, tall screens only).
      expect(Math.abs(centre(at).x) >= 480 || centre(at).y + 232 >= 820).toBe(true);
      keys.add(at.join('_'));
    }
    expect(keys.size).toBe(all.length);
  });

  it('fills nearest-first with no holes: every lattice spot closer than the farthest block is taken', () => {
    const CAP = cap();
    const all = wideBlockPositions(CAP);
    const band = all.filter((at) => at[0] + at[1] <= 6).length; // rows every wide screen shows
    expect(all.slice(0, band).every((at) => at[0] + at[1] <= 6)).toBe(true); // the band fills first
    for (let n = 1; n <= band; n += 1) {
      const some = wideBlockPositions(n);
      expect(some).toEqual(all.slice(0, n)); // a stable prefix: more pods only add further-out blocks
      const far = Math.max(...some.map(dist));
      const taken = new Set(some.map((a) => a.join('_')));
      for (const at of all.slice(0, band)) if (dist(at) < far - 1e-9) expect(taken.has(at.join('_'))).toBe(true);
      const left = some.filter((a) => centre(a).x < 0).length;
      expect(Math.abs(left - (n - left))).toBeLessThanOrEqual(1); // both sides grow together
    }
  });

  it('neighbouring wide blocks share a street: the first column hugs the map, one block pitch apart', () => {
    const first = wideBlockPositions(10).map(centre);
    for (const side of [-1, 1]) {
      const col = first.filter((c) => Math.sign(c.x) === side);
      expect(new Set(col.map((c) => c.x))).toEqual(new Set([480 * side]));
      const ys = col.map((c) => c.y).sort((a, b) => a - b);
      for (let i = 1; i < ys.length; i += 1) expect(ys[i] - ys[i - 1]).toBe(120);
    }
  });

  it('wide pods take the wide blocks in order: largest nearest', () => {
    const many = { ...DATA, pods: Array.from({ length: 40 }, (_, i) => POD(`p${i}`, `Place ${i}`, 5000 - i * 10, i)) };
    const html = renderCityMap(createInitialState(), ready(many));
    const wide = wideOf(html);
    const slots = [...wide.matchAll(/data-pod="p(\d+)" data-slot="([^"]+)"/g)].map((m) => [Number(m[1]), m[2]]);
    expect(slots).toEqual(wideBlockPositions(31).map((at, i) => [9 + i, `wide-${at.join('_')}`]));
    for (const [, key] of slots) expect(BACKDROP_SLOTS.some((s) => s.key === key && s.layer === 'wide')).toBe(true);
  });

  it('the wide layer has one ground element carrying the tile grid and the street lattice', () => {
    const many = { ...DATA, pods: Array.from({ length: 30 }, (_, i) => POD(`p${i}`, `Place ${i}`, 60 + i * 10, i)) };
    const html = renderCityMap(createInitialState(), ready(many));
    const wide = wideOf(html);
    expect(wide.match(/class="city-wide__ground"/g)).toHaveLength(1);
    const rule = html.match(/\.city-wide__ground \{[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule[0]).toContain('background-size: 240px 120px, 80px 40px'); // street lattice at BLOCK_PITCH, tiles at TW x TH
    expect(rule[0]).toMatch(/mask-image:/); // fades toward the screen edges
  });

  it('new wide-city CSS lives only inside the wide media query (phones and narrow windows untouched)', () => {
    const many = { ...DATA, pods: Array.from({ length: 30 }, (_, i) => POD(`p${i}`, `Place ${i}`, 60 + i * 10, i)) };
    const html = renderCityMap(createInitialState(), ready(many));
    const start = html.indexOf('@media (min-width: 1000px) {');
    expect(start).toBeGreaterThan(-1);
    let depth = 0;
    let end = start;
    for (let i = html.indexOf('{', start); i < html.length; i += 1) {
      if (html[i] === '{') depth += 1;
      if (html[i] === '}') depth -= 1;
      if (depth === 0) { end = i; break; }
    }
    const inside = html.slice(start, end);
    const outside = html.slice(0, start) + html.slice(end);
    for (const sel of ['.city-wide__ground {', '.city-wide + .city-map']) {
      expect(inside).toContain(sel);
      expect(outside).not.toContain(sel);
    }
  });

  it('few pods (no wide layer): no ground, no see-through map', () => {
    const html = renderCityMap(createInitialState(), ready(DATA));
    expect(html).not.toContain('class="city-wide__ground"');
  });
});

describe('welcome back survives the re-draw when data arrives', () => {
  const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
  const played = () => {
    const s = createInitialState();
    s.missions['gmail-recon-breach'] = { status: 'completed', finding: 'no-breaches' };
    s.lastCityVisit = new Date().toISOString(); // the first draw of this visit already stamped it
    return s;
  };

  it('uses when the player last saw the map before this visit', () => {
    const html = renderCityMap(played(), { arrival: { before: threeDaysAgo } });
    expect(html).toContain('good to see you');
  });

  it('no welcome back when the last visit before this one was recent', () => {
    const html = renderCityMap(played(), { arrival: { before: new Date().toISOString() } });
    expect(html).not.toContain('good to see you');
  });
});
