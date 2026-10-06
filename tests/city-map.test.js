import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderCityMap, BACKDROP_SLOTS } from '../src/screens/city-map.js';
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
    const wide = html.slice(html.indexOf('<div class="city-wide"'));
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
    const mapPart = html.slice(0, html.indexOf('<div class="city-wide"'));
    const blocks = [...mapPart.matchAll(/<a class="city-block city-pod[\s\S]*?<\/a>/g)].map((m) => m[0]);
    expect(blocks).toHaveLength(9);
    for (const b of blocks) {
      for (const [, w] of b.matchAll(/width: ([\d.]+)px; z-index/g)) expect(Number(w)).toBeLessThanOrEqual(80);
    }
    const wide = html.slice(html.indexOf('<div class="city-wide"'));
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
