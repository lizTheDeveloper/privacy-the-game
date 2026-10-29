import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  constellationSvg, RECHECK_OPACITY, HIT_PX, STAR_LABEL_SCALE, labelBox, LABEL_LINE_EM, LABEL_CLEAR_EM, DIM_TINTS, TWINKLE_EVERY, LABEL_TIGHT_EM, BUYER_LINK_OPACITY, SELECTED_LINK_OPACITY,
} from '../../src/components/constellation.js';
import { shortName, nearestStar, zoomViewBox } from '../../src/utils/broker-view.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { setResidency } from '../../src/utils/broker-state.js';

const mini = JSON.parse(readFileSync('tests/fixtures/broker-map-mini.json', 'utf8'));
const realMap = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const realLayout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));

// One star per fixture broker, on a simple grid; hub-a is big.
const layout = {
  formatVersion: 1,
  asOf: mini.asOf,
  size: 1000,
  stars: mini.brokers.map((b, i) => [b.id, 100 + (i % 4) * 200, 100 + Math.floor(i / 4) * 200, b.hub ? 10 : 2]),
};
const map = {
  ...mini,
  brokers: mini.brokers.map((b) => (b.id === 'hub-a' ? { ...b, name: 'Hub Alpha Holdings, Inc.' } : b)),
  links: [
    { from: 'hub-a', to: 'acxiom', type: 'owns', tier: 'A', sources: [{ url: 'u1' }, { url: 'u2' }] },
    { from: 'hub-a', to: 'tail-1', type: 'supplies', tier: 'B', sources: [{ url: 'u1' }] },
    { from: 'hub-a', to: 'tail-2', type: 'supplies', tier: 'C', sources: [{ url: 'u1' }, { url: 'u2' }, { url: 'u3' }, { url: 'u4' }] },
    { from: 'hub-a', to: 'ghost', type: 'owns', tier: 'A', sources: [] },
  ],
};

const star = (state, litOn = null) => ({ state, litOn, via: state === 'lit' || state === 'amber' ? ['checklist'] : [] });
const lighting = {
  stars: Object.fromEntries(mini.brokers.map((b) => [b.id, star(b.optOut?.method === 'none' ? 'no-opt-out' : 'dim')])),
  frozen: ['equifax-information-services'],
  halo: ['criteo'],
  pending: [],
  drop: 'off',
};
lighting.stars.spokeo = star('amber', '2026-03-01');
lighting.stars.acxiom = star('lit', '2026-10-01');
lighting.stars['hub-a'] = star('lit', '2026-10-01');
lighting.stars.whitepages = star('lit', '2026-10-01');

const render = (over = {}) => constellationSvg({ map, layout, lighting, ...over });
const realLight = brokerLighting(realMap, {}, '2026-10-19');
// Every whitespace-separated token of every attribute value.
const attrTokens = (s) => new Set([...s.matchAll(/="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)));
// The visible labels and the boxes they cover, read back from the markup.
function labelsOf(s) {
  return [...s.matchAll(/<text class="(hub-label|star-label)" x="([-\d.]+)" y="([-\d.]+)" font-size="([\d.]+)"[^>]*?(?: text-anchor="(\w+)")?>(.*?)<\/text>/g)].map((m) => {
    const [, cls, x, y, fs, anchor = 'start', body] = m;
    const lines = body.includes('<tspan') ? [...body.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((t) => t[1]) : [body];
    const f = Number(fs);
    const cy = Number(y) - f * 0.85 + (lines.length * f * LABEL_LINE_EM) / 2;
    return { cls, text: lines.join(' '), box: labelBox(lines, f, Number(x), anchor, cy) };
  });
}
const intersects = (a, b) => a.left < b.right - 1e-6 && b.left < a.right - 1e-6 && a.top < b.bottom - 1e-6 && b.top < a.bottom - 1e-6;
const realAt = (id) => realLayout.stars.find((s) => s[0] === id);
const svg = render();
// The opening tag of the star drawn at a broker's layout position.
const at = (id) => layout.stars.find((s) => s[0] === id);
const starTag = (s, id) => {
  const [, x, y] = at(id);
  return s.match(new RegExp(`<circle class="star(?: [^"]*)?" cx="${x}" cy="${y}"[^>]*>`))?.[0];
};

describe('shortName', () => {
  it('strips one trailing legal suffix or comma', () => {
    expect(shortName('Experian plc')).toBe('Experian');
    expect(shortName('TransUnion Risk and Alternative Data Solutions, Inc.')).toBe('TransUnion Risk and Alternative Data Solutions');
    expect(shortName('Experian Information Solutions, Inc')).toBe('Experian Information Solutions');
    expect(shortName('General Motors LLC')).toBe('General Motors');
    expect(shortName('RELX PLC')).toBe('RELX');
    expect(shortName('West Publishing Corp')).toBe('West Publishing');
    expect(shortName('Acme L.L.C.')).toBe('Acme');
    expect(shortName('Acme Ltd')).toBe('Acme');
    expect(shortName('Acme Corporation')).toBe('Acme');
    expect(shortName('Acme Company')).toBe('Acme');
    expect(shortName('Acme Co.')).toBe('Acme');
    expect(shortName('Acme,')).toBe('Acme');
    expect(shortName('TransUnion')).toBe('TransUnion');
    expect(shortName('Acme Inc. Inc.')).toBe('Acme Inc.');
  });
});

describe('constellationSvg', () => {
  it('draws the layout\'s constellation figures and names, distinct from documented links', () => {
    const lit = brokerLighting(realMap, {}, '2026-10-24');
    const s = constellationSvg({ map: realMap, layout: realLayout, lighting: lit, px: 343 });
    expect((s.match(/<line class="figure"/g) ?? []).length).toBe(realLayout.figures.length);
    const shown = [...s.matchAll(/<text class="const-name"[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    expect(shown.length).toBeGreaterThan(0);
    for (const t of shown) expect(realLayout.names.map((m) => m[0].toUpperCase())).toContain(t);
    // Figures are drawn under the links and never share their class.
    expect(s.indexOf('<g class="figures">')).toBeLessThan(s.indexOf('<g class="links">'));
    expect(s).not.toMatch(/class="figure link|class="link figure/);
  });

  it('a constellation name shows only whole, in view, and clear of the names before it and of labels', () => {
    const brokers = [{ id: 'h', name: 'Hubco', hub: true, reach: 9 }];
    const lay = { stars: [['h', 500, 500, 8]], names: [['Location', 300, 300], ['Health', 305, 302], ['Edge', 2, 300], ['Under', 515, 497]] };
    const s = constellationSvg({ map: { brokers, links: [] }, layout: lay, lighting: { stars: {} }, view: { x: 0, y: 0, w: 1000 }, px: 1000 });
    const shown = [...s.matchAll(/<text class="const-name"[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    expect(shown).toEqual(['LOCATION']); // HEALTH overlaps it, EDGE is cut off, UNDER sits on the hub's name
    expect(s).toMatch(/class="hub-label"[^>]*>Hubco</);
  });

  it('not-yet stars vary in tint and some twinkle, by id only (no meaning), only with motion allowed', () => {
    const s = constellationSvg({ map: realMap, layout: realLayout, lighting: brokerLighting(realMap, {}, '2026-10-24'), px: 343 });
    const fills = new Set([...s.matchAll(/class="star star--dim[^"]*"[^>]*fill="(#[0-9a-f]+)"/gi)].map((m) => m[1].toLowerCase()));
    expect(fills.size).toBeGreaterThan(2);
    for (const f of fills) expect(DIM_TINTS.map((c) => c.toLowerCase())).toContain(f);
    const tw = (s.match(/star--tw/g) ?? []).length;
    expect(tw).toBeGreaterThan(30);
    expect(tw).toBeLessThan(realMap.brokers.length / (TWINKLE_EVERY - 3));
    // The twinkle rule sits inside the reduced-motion guard.
    const guard = s.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(guard).toBeGreaterThan(-1);
    expect(s.indexOf('.star--tw{')).toBeGreaterThan(guard);
    expect(constellationSvg({ map: realMap, layout: realLayout, lighting: brokerLighting(realMap, {}, '2026-10-24'), px: 343 })).toBe(s);
  });

  it('a figure glows only when both of its stars are lit', () => {
    const brokers = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
    const lay = { stars: [['a', 100, 100, 2], ['b', 120, 100, 2], ['c', 140, 100, 2]], figures: [[0, 1], [1, 2]] };
    const lit = { stars: { a: { state: 'lit' }, b: { state: 'lit' } } };
    const s = constellationSvg({ map: { brokers, links: [] }, layout: lay, lighting: lit, px: 343 });
    expect((s.match(/class="figure figure--lit"/g) ?? []).length).toBe(1);
    expect((s.match(/class="figure"/g) ?? []).length).toBe(1);
  });

  it('labels keep their clearance across zoomed views of the real sky; only a hub falls back to tight', () => {
    const grow = (b, d) => ({ left: b.left - d, right: b.right + d, top: b.top - d, bottom: b.bottom + d });
    for (const w of [1000, 400, 200]) {
      for (let x = 0; x + w <= 1000; x += w / 2) {
        for (let y = 0; y + w <= 1000; y += w / 2) {
          const s = constellationSvg({ map: realMap, layout: realLayout, lighting: realLight, view: { x, y, w, h: w * 1.75 }, px: 343 });
          const ls = labelsOf(s);
          for (let i = 0; i < ls.length; i += 1) for (let j = i + 1; j < ls.length; j += 1) {
            const [p, q] = [ls[i], ls[j]];
            const f = Math.min(p.box.bottom - p.box.top, q.box.bottom - q.box.top) / LABEL_LINE_EM;
            const em = p.cls === 'star-label' && q.cls === 'star-label' ? LABEL_CLEAR_EM : LABEL_TIGHT_EM;
            const half = (f * em) / 2 - 1e-6;
            expect(intersects(grow(p.box, half), grow(q.box, half)), `${p.text} / ${q.text} at ${x},${y},${w}`).toBe(false);
          }
        }
      }
    }
  });

  it("a crowded own star's name covers dim dots but never another of the player's stars; amber names are amber", () => {
    // Free Data Services (re-check due) once took a spot right over lit Intelius.
    const ring = [[-6, 0], [0, -4], [0, 4], [-6, -4], [6, -4], [-6, 4], [6, 4], [-12, 0], [0, -8], [0, 8]];
    const brokers = [{ id: 'fds', name: 'Free Data Services' }, { id: 'int', name: 'Intelius' }, ...ring.map((_, i) => ({ id: `d${i}`, name: `Dim ${i}` }))];
    const lay = { stars: [['fds', 500, 500, 2], ['int', 506, 500, 2], ...ring.map(([dx, dy], i) => [`d${i}`, 500 + dx, 500 + dy, 2])] };
    const lit = { stars: { fds: { state: 'amber', litOn: '2026-06-01' }, int: { state: 'lit', litOn: '2026-10-20' } } };
    const s = constellationSvg({ map: { brokers, links: [] }, layout: lay, lighting: lit, view: { x: 400, y: 440, w: 200, h: 136.85 }, px: 928 });
    const ls = labelsOf(s);
    const intMark = { left: 504, right: 508, top: 498, bottom: 502 };
    const fdsMark = { left: 498, right: 502, top: 498, bottom: 502 };
    for (const l of ls) {
      if (l.text === 'Free Data Services') expect(intersects(l.box, intMark)).toBe(false);
      if (l.text === 'Intelius') expect(intersects(l.box, fdsMark)).toBe(false);
    }
    expect(s).toMatch(/<text class="star-label"[^>]*fill="#FF9F00"[^>]*>Free Data Services<\/text>/);
  });

  it("the player's lit star keeps its name when dim stars crowd every side", () => {
    // Intelius once sat boxed in by dim neighbours on desktop and went unnamed.
    const ring = [[-6, 0], [6, 0], [0, -4], [0, 4], [-6, -4], [6, -4], [-6, 4], [6, 4], [-12, 0], [12, 0], [0, -8], [0, 8]];
    const brokers = [{ id: 'mine', name: 'Intelius' }, ...ring.map((_, i) => ({ id: `d${i}`, name: `Dim ${i}` }))];
    const lay = { stars: [['mine', 500, 500, 2], ...ring.map(([dx, dy], i) => [`d${i}`, 500 + dx, 500 + dy, 2])] };
    const lit = { stars: { mine: { state: 'lit', litOn: '2026-10-20' } } };
    const s = constellationSvg({ map: { brokers, links: [] }, layout: lay, lighting: lit, view: { x: 400, y: 440, w: 200, h: 136.85 }, px: 928 });
    expect(labelsOf(s).map((l) => l.text)).toContain('Intelius');
  });

  it("a few lit stars are named even zoomed out; a DROP crowd of them is not", () => {
    const d = '2026-10-20';
    const few = brokerLighting(realMap, { missions: {}, brokerFiled: { 'people_search-fortify-web-forms': { since: d, lines: { spokeo: d, whitepages: d, beenverified: d } } } }, '2026-10-24');
    // A 360px phone zoomed right out (the map opens zoomed in on the lit stars). On a 320px phone the
    // three sit too close together at this zoom since the sky stopped being a circle (2026-10-29).
    const names = labelsOf(constellationSvg({ map: realMap, layout: realLayout, lighting: few, px: 328 })).map((l) => l.text);
    expect(names).toEqual(expect.arrayContaining(['Spokeo', 'Whitepages', 'BeenVerified']));
    const crowd = brokerLighting(realMap, setResidency({ brokerFiled: { 'people_search-reclaim-stragglers': { since: d, lines: { drop: d } } } }, 'yes'), '2026-10-24');
    expect(labelsOf(constellationSvg({ map: realMap, layout: realLayout, lighting: crowd, px: 288 })).every((l) => l.cls === 'hub-label')).toBe(true);
  });

  it('no two labels stack into one name on a phone with DROP lit, wherever the view is', () => {
    // Babel Street and Experian Information Solutions once stacked 2px apart and read as one name.
    // The sky was re-laid (2026-10-29), so check every hub's phone view (328px wide), not one pair.
    const lit = brokerLighting(realMap, setResidency({ brokerFiled: { 'people_search-reclaim-stragglers': { since: '2026-10-20', lines: { drop: '2026-10-20' } } } }, 'yes'), '2026-10-24');
    const hubs = realMap.brokers.filter((b) => b.hub).map((b) => realLayout.stars.find((st) => st[0] === b.id));
    let checked = 0;
    for (const [, hx, hy] of hubs) {
      const view = { x: hx - 208.44, y: hy - 381.29, w: 416.88, h: 762.58 };
      const ls = labelsOf(constellationSvg({ map: realMap, layout: realLayout, lighting: lit, view, px: 328 }));
      for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
        const a = ls[i].box, b = ls[j].box;
        const f = Math.min(a.bottom - a.top, b.bottom - b.top) / LABEL_LINE_EM;
        const gap = Math.max(b.top - a.bottom, a.top - b.bottom, b.left - a.right, a.left - b.right);
        expect(gap, `${ls[i].text} / ${ls[j].text}`).toBeGreaterThanOrEqual(f * LABEL_TIGHT_EM - 1e-6);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('is one svg with a viewBox from the view and an accessible label', () => {
    expect(svg).toMatch(/^<svg class="constellation" viewBox="0 0 1000 1000" role="img" aria-label="Map of data brokers: [^"]+"/);
    expect(render({ view: { x: 100, y: 50, w: 400 } })).toMatch(/viewBox="100 50 400 400"/);
    expect(svg.trim().endsWith('</svg>')).toBe(true);
  });

  it('draws one mark per laid-out broker', () => {
    const circles = svg.match(/<circle class="star[ "]/g).length;
    const xs = svg.match(/<path class="star-x"/g).length;
    const diamonds = (svg.match(/<rect class="buyer"/g) ?? []).length;
    const sats = svg.match(/<g class="sat[ "]/g).length;
    // The fixture's one buyer is ICE, a government buyer: drawn as a satellite, not a star.
    expect(circles + xs + diamonds).toBe(11);
    expect(sats).toBe(1);
  });

  it('lit, amber and dim stars get their class', () => {
    expect(starTag(svg, 'acxiom')).toMatch(/class="star star--lit"/);
    expect(starTag(svg, 'spokeo')).toMatch(/class="star star--amber"/);
    expect(starTag(svg, 'beenverified')).toMatch(/class="star star--dim( star--tw)?"/);
    expect(starTag(svg, 'acxiom')).toMatch(/C6FF00/i);
    expect(starTag(svg, 'spokeo')).toMatch(/FF9F00/i);
    expect(DIM_TINTS.some((c) => starTag(svg, 'beenverified').toLowerCase().includes(c.toLowerCase()))).toBe(true);
  });

  it('a re-check-due star draws dimmer than a freshly filed one', () => {
    expect(RECHECK_OPACITY).toBe(0.55);
    expect(starTag(svg, 'spokeo')).toMatch(/class="star star--amber"/);
    expect(starTag(svg, 'spokeo')).toContain('fill-opacity="0.55"');
    expect(starTag(svg, 'acxiom')).toMatch(/class="star star--lit"/);
    expect(starTag(svg, 'acxiom')).not.toMatch(/fill-opacity/);
  });

  it('only a freshly lit star glows; an amber one does not, and never blooms', () => {
    const glows = svg.match(/<circle class="glow[^"]*"[^>]*>/g);
    expect(glows).toHaveLength(3); // acxiom, whitepages, hub-a
    const [, sx, sy] = at('spokeo');
    expect(glows.join('')).not.toContain(`cx="${sx}" cy="${sy}"`);
    const s = render({ newlyLit: new Set(['spokeo']) });
    expect(starTag(s, 'spokeo')).not.toMatch(/star--new/);
  });

  it('a no-opt-out star is a magenta ✕', () => {
    const x = svg.match(/<path class="star-x"[^>]*>/g);
    expect(x).toHaveLength(1);
    expect(x[0]).toMatch(/stroke="#FF2D9B"/i);
    expect(x[0]).toMatch(/d="M[^"]+L[^"]+M[^"]+L[^"]+"/);
  });

  it('a buyer is a diamond; a government buyer is a satellite instead', () => {
    expect(svg).not.toMatch(/<rect class="buyer"/);
    expect(svg.match(/<g class="sat[ "][^>]*>/g)).toHaveLength(1);
    const real = constellationSvg({ map: realMap, layout: realLayout, lighting: brokerLighting(realMap, {}, '2026-10-19') });
    const d = real.match(/<rect class="buyer"[^>]*>/g);
    expect(d).toHaveLength(6);
    for (const tag of d) expect(tag).toMatch(/stroke="#8a93a6"[^>]*transform="rotate\(45 /);
    expect(d[0]).toMatch(/fill="none"/);
  });

  it('a frozen star gets the frozen ring', () => {
    const rings = svg.match(/<circle class="ring-frozen"[^>]*>/g);
    expect(rings).toHaveLength(1);
    const [, x, y, r] = at('equifax-information-services');
    expect(rings[0]).toContain(`cx="${x}" cy="${y}" r="${r + 3}"`);
    expect(rings[0]).toMatch(/stroke="#00E5FF"/i);
    expect(rings[0]).toMatch(/stroke-dasharray/);
  });

  it('a halo star gets a faint halo', () => {
    const halos = svg.match(/<circle class="halo"[^>]*>/g);
    expect(halos).toHaveLength(1);
    const [, x, y, r] = at('criteo');
    expect(halos[0]).toContain(`cx="${x}" cy="${y}" r="${r + 4}"`);
    expect(halos[0]).toMatch(/fill="#EDEFF3"/);
    expect(halos[0]).toMatch(/opacity="0.12"/);
  });

  it('a halo is never lime', () => {
    expect(svg.match(/<circle class="halo"[^>]*>/g).join('')).not.toMatch(/C6FF00/i);
    // Even when the halo star is itself lit.
    const both = { ...lighting, stars: { ...lighting.stars, criteo: star('lit', '2026-10-01') } };
    expect(render({ lighting: both }).match(/<circle class="halo"[^>]*>/g).join('')).not.toMatch(/C6FF00/i);
  });

  it('newly lit stars bloom', () => {
    const s = render({ newlyLit: new Set(['whitepages', 'acxiom', 'hub-a']) });
    // Id order: acxiom 0, hub-a 1, whitepages 2.
    expect(starTag(s, 'acxiom')).toMatch(/class="star star--lit star--new" [^>]*style="animation-delay:0ms"/);
    expect(starTag(s, 'hub-a')).toMatch(/style="animation-delay:60ms"/);
    expect(starTag(s, 'whitepages')).toMatch(/style="animation-delay:120ms"/);
    expect(s.match(/star--new/g).length).toBeGreaterThanOrEqual(3);
    expect(svg).not.toMatch(/class="star [^"]*star--new/);
    // A dim star in the set does not bloom.
    expect(starTag(render({ newlyLit: new Set(['beenverified']) }), 'beenverified')).not.toMatch(/star--new/);
  });

  it('the bloom delay wraps every 20 stars', () => {
    const ids = Array.from({ length: 25 }, (_, i) => `s${String(i).padStart(2, '0')}`);
    const m = { brokers: ids.map((id) => ({ id, name: id, kind: [], optOut: { method: 'web-form' }, hub: false })), links: [] };
    const l = { stars: Object.fromEntries(ids.map((id) => [id, star('lit', '2026-10-01')])), frozen: [], halo: [] };
    const lay = { stars: ids.map((id, i) => [id, i * 10, 500, 2]) };
    const s = constellationSvg({ map: m, layout: lay, lighting: l, newlyLit: new Set(ids) });
    const delays = [...s.matchAll(/class="star [^"]*" [^>]*style="animation-delay:(\d+)ms"/g)].map((x) => Number(x[1]));
    expect(delays).toHaveLength(25);
    expect(delays[19]).toBe(19 * 60);
    expect(delays[20]).toBe(0);
    expect(delays[24]).toBe(240);
  });

  it('keeps the bloom inside a no-preference motion query', () => {
    const style = svg.match(/<style>([\s\S]*?)<\/style>/)[1];
    expect(style).toMatch(/@keyframes/);
    const motion = style.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(motion).toBeGreaterThanOrEqual(0);
    const before = style.slice(0, motion);
    expect(before).not.toMatch(/@keyframes|animation/);
  });

  it('the selected star gets a selection ring', () => {
    expect(svg).not.toMatch(/class="selected"/);
    const s = render({ selectedId: 'spokeo' });
    const [, x, y] = at('spokeo');
    expect(s).toMatch(new RegExp(`<circle class="selected" cx="${x}" cy="${y}"`));
    expect(render({ selectedId: 'ghost' })).not.toMatch(/class="selected"/);
  });

  it('draws the layers in order: links, stars, rings and halos, effects, labels', () => {
    const s = render({ selectedId: 'spokeo', newlyLit: new Set(['acxiom']) });
    const pos = ['<line class="link"', '<circle class="star', '<circle class="ring-frozen"', '<circle class="halo"', '<circle class="selected"', '<text class="hub-label"']
      .map((t) => s.indexOf(t));
    expect(pos.every((p) => p > 0)).toBe(true);
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });

  it('links fade with fewer sources and dash only tier C', () => {
    const lines = svg.match(/<line class="link"[^>]*>/g);
    expect(lines).toHaveLength(3); // the ghost link is skipped
    expect(lines[0]).toMatch(/opacity="0.45"/);
    expect(lines[1]).toMatch(/opacity="0.3"/);
    expect(lines[2]).toMatch(/opacity="0.6"/);
    expect(lines[0]).not.toMatch(/dasharray/);
    expect(lines[1]).not.toMatch(/dasharray/);
    expect(lines[2]).toMatch(/stroke-dasharray/);
    const [, x1, y1] = at('hub-a');
    const [, x2, y2] = at('acxiom');
    expect(lines[0]).toContain(`x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`);
  });

  it('stars missing from the layout or the map are skipped', () => {
    const lay = { stars: [...layout.stars.filter((s) => s[0] !== 'acxiom'), ['not-in-map', 5, 5, 2]] };
    const s = constellationSvg({ map, layout: lay, lighting });
    const marks = s.match(/<circle class="star[ "]|<path class="star-x"|<rect class="buyer"/g).length;
    expect(marks).toBe(10); // 12 laid out, less acxiom, less ICE (a satellite); not-in-map never draws
    expect(s).not.toMatch(/cx="5" cy="5"/);
    // The link to the missing star goes too.
    expect(s.match(/<line class="link"/g)).toHaveLength(2);
    // A broker with no lighting entry still draws, dim.
    const noLight = { ...lighting, stars: { ...lighting.stars } };
    delete noLight.stars.tail1;
    delete noLight.stars['tail-1'];
    expect(starTag(constellationSvg({ map, layout, lighting: noLight }), 'tail-1')).toMatch(/star--dim/);
  });

  it('hub labels use the short name', () => {
    const labels = svg.match(/<text class="hub-label"[^>]*>[^<]*<\/text>/g);
    expect(labels).toHaveLength(1);
    expect(labels[0]).toMatch(/>Hub Alpha Holdings<\/text>/);
    const [, x, y, r] = at('hub-a');
    expect(labels[0]).toMatch(/font-size="22"/);
  });

  it('a long hub name wraps onto two lines', () => {
    const m = { ...map, brokers: map.brokers.map((b) => (b.id === 'hub-a' ? { ...b, name: 'TransUnion Risk and Alternative Data Solutions, Inc.' } : b)) };
    const label = constellationSvg({ map: m, layout, lighting }).match(/<text class="hub-label"[^>]*>(.*?)<\/text>/)[1];
    const parts = [...label.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((x) => x[1]);
    expect(parts).toEqual(['TransUnion Risk and', 'Alternative Data Solutions']);
  });

  it('escapes names', () => {
    const m = { ...map, brokers: map.brokers.map((b) => (b.id === 'hub-a' ? { ...b, name: 'A&B <Data>' } : b)) };
    expect(constellationSvg({ map: m, layout, lighting })).toContain('>A&amp;B &lt;Data&gt;</text>');
  });

  it('the SVG carries no links and no broker ids', () => {
    const renders = [
      svg,
      render({ selectedId: 'spokeo', newlyLit: new Set(['acxiom', 'whitepages']) }),
      render({ selectedId: 'spokeo', view: { x: 80, y: 80, w: 381 }, px: 686 }), // zoomed: every star named
    ];
    for (const s of renders) {
      expect(s).not.toMatch(/href=|<a\b/);
      const tokens = attrTokens(s);
      for (const b of mini.brokers) expect(tokens.has(b.id), b.id).toBe(false);
    }
    // The real map, zoomed in on a cluster with a star selected.
    const ids = realMap.brokers.map((b) => b.id);
    const s = constellationSvg({ map: realMap, layout: realLayout, lighting: realLight, selectedId: 'transunion', view: { x: 520, y: 420, w: 160 }, px: 343 });
    expect(s).toMatch(/class="star-label"/);
    const tokens = attrTokens(s);
    for (const id of ids) if (tokens.has(id)) throw new Error(`broker id in an attribute: ${id}`);
  });

  it('renders the real map in under 200ms in node', () => {
    const l = brokerLighting(realMap, {}, '2026-10-19');
    const lit = { ...l, stars: { ...l.stars } };
    const ids = Object.keys(lit.stars);
    for (const id of ids.slice(0, 300)) if (lit.stars[id].state === 'dim') lit.stars[id] = star('lit', '2026-10-01');
    const t0 = performance.now();
    const s = constellationSvg({ map: realMap, layout: realLayout, lighting: lit, newlyLit: new Set(ids.slice(0, 300)) });
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(200);
    const marks = s.match(/<circle class="star[ "]|<path class="star-x"|<rect class="buyer"/g).length;
    expect(marks).toBe(realMap.brokers.length - 12);
    expect(s.match(/<g class="sat[ "]/g)).toHaveLength(12);
    expect(s.match(/<text class="hub-label"/g).length).toBeGreaterThanOrEqual(10);
    expect(s.match(/<line class="link"/g).length).toBeGreaterThan(0);
    expect(s).not.toMatch(/\bfilter="/);
  });
});

// Liz feedback 2026-10-24: "the map is too tiny and I can't tap it" / "or zoom".
describe('nearestStar', () => {
  const lay = { stars: [['a', 100, 100, 2], ['b', 110, 100, 2], ['c', 500, 500, 8], 'junk', ['d', NaN, 1, 2]] };
  it('resolves to the nearest centre, not the uppermost circle', () => {
    expect(nearestStar(lay, 104, 100, 50)).toBe(0);
    expect(nearestStar(lay, 106, 101, 50)).toBe(1);
    expect(nearestStar(lay, 480, 470, 50)).toBe(2);
  });
  it('returns -1 beyond maxDist or for an empty layout', () => {
    expect(nearestStar(lay, 300, 300, 50)).toBe(-1);
    expect(nearestStar({}, 1, 1, 50)).toBe(-1);
    expect(nearestStar(lay, 300, 300)).not.toBe(-1);
  });
  it('is fast enough to run per tap on the real map', () => {
    const t0 = performance.now();
    for (let i = 0; i < 100; i += 1) nearestStar(realLayout, i * 10, 500, 60);
    expect(performance.now() - t0).toBeLessThan(100);
  });
});

describe('zoomViewBox', () => {
  it('zooms in about a point that stays put', () => {
    const v = zoomViewBox({ x: 0, y: 0, w: 1000 }, 2, 400, 600);
    expect(v.w).toBe(500);
    // (400, 600) sits at the same fraction of the box before and after.
    expect((400 - v.x) / v.w).toBeCloseTo(0.4);
    expect((600 - v.y) / v.w).toBeCloseTo(0.6);
  });
  it('zooms out and keeps the box on the map', () => {
    expect(zoomViewBox({ x: 600, y: 600, w: 300 }, 0.5, 900, 900)).toEqual({ x: 300, y: 300, w: 600 });
    expect(zoomViewBox({ x: 100, y: 100, w: 500 }, 0.1, 0, 0)).toEqual({ x: 0, y: 0, w: 1000 });
  });
  it('holds the width to its bounds', () => {
    expect(zoomViewBox({ x: 0, y: 0, w: 200 }, 10, 100, 100, { minW: 120 }).w).toBe(120);
    expect(zoomViewBox({ x: 0, y: 0, w: 200 }, 10, 100, 100).w).toBe(100);
    expect(zoomViewBox({ x: 0, y: 0, w: 800 }, 0.5, 0, 0, { maxW: 900 }).w).toBe(900);
  });
  it('a bad factor or point is a no-op about the centre', () => {
    expect(zoomViewBox({ x: 100, y: 100, w: 400 }, NaN)).toEqual({ x: 100, y: 100, w: 400 });
    expect(zoomViewBox({ x: 100, y: 100, w: 400 }, 2).w).toBe(200);
    expect(zoomViewBox({ x: 100, y: 100, w: 400 }, 2).x).toBe(200);
  });
});

describe('constellationSvg: tappable and zoomable', () => {
  const hitsOf = (s) => s.match(/<circle class="star-hit"[^>]*>/g) ?? [];
  const rOf = (tag) => Number(tag.match(/ r="([\d.]+)"/)[1]);

  it('every drawn star gets a hit circle keyed by its layout index, on top of everything', () => {
    const s = render({ selectedId: 'spokeo' });
    const hits = hitsOf(s);
    // Every laid-out star but ICE (drawn as a satellite, with its own data-sat hit).
    const ice = layout.stars.findIndex((st) => st[0] === 'us-ice');
    expect(hits).toHaveLength(11);
    const idx = hits.map((h) => Number(h.match(/data-star="(\d+)"/)[1]));
    expect(idx.sort((a, b) => a - b)).toEqual([...Array(12).keys()].filter((i) => i !== ice));
    expect(s.match(/<circle class="sat-hit"[^>]*data-sat="1"/g)).toHaveLength(1);
    for (const h of hits) expect(h).toMatch(/fill="transparent" pointer-events="all"/);
    expect(s.indexOf('<circle class="star-hit"')).toBeGreaterThan(s.lastIndexOf('<text class="hub-label"'));
    // Only the hit layer takes pointer events.
    expect(s).toMatch(/\.constellation \.labels\{pointer-events:none\}/);
  });

  it(`a hit circle is at least ${HIT_PX} CSS px in radius at the drawn scale`, () => {
    expect(HIT_PX).toBeGreaterThanOrEqual(22);
    for (const [view, px] of [[{ x: 0, y: 0, w: 1000 }, 343], [{ x: 300, y: 300, w: 330 }, 343], [{ x: 400, y: 400, w: 150 }, 900]]) {
      const unitsPerPx = view.w / px;
      for (const h of hitsOf(render({ view, px }))) expect(rOf(h) / unitsPerPx).toBeGreaterThanOrEqual(HIT_PX - 0.01);
    }
    // With no px given, it assumes a phone's 343px.
    for (const h of hitsOf(render())) expect(rOf(h) * (343 / 1000)).toBeGreaterThanOrEqual(HIT_PX - 0.01);
  });

  it('labels hold a steady on-screen size as the view zooms', () => {
    const fs = (s) => Number(s.match(/<text class="hub-label"[^>]*font-size="([\d.]+)"/)[1]);
    const a = render({ view: { x: 0, y: 0, w: 1000 }, px: 343 });
    const b = render({ view: { x: 300, y: 300, w: 330 }, px: 343 });
    expect(fs(a) * (343 / 1000)).toBeCloseTo(12, 0);
    expect(fs(b) * (343 / 330)).toBeCloseTo(12, 0);
    expect(fs(render())).toBe(22); // unit-sized when the drawn width is unknown
  });

  it('strokes do not scale with zoom', () => {
    const style = svg.match(/<style>([\s\S]*?)<\/style>/)[1];
    for (const cls of ['link', 'star-x', 'buyer', 'ring-frozen', 'selected', 'burst']) {
      expect(style).toMatch(new RegExp(`\\.${cls}[^{]*\\{[^}]*vector-effect:non-scaling-stroke|\\.${cls},[^{]*\\{vector-effect:non-scaling-stroke`));
    }
  });

  it('other non-hub stars are named only once zoomed in, and only those in view', () => {
    // With nothing of the player's lit (a few lit ones are always named: see the test above).
    const unlit = { stars: {} };
    expect(render({ px: 343, lighting: unlit })).not.toMatch(/class="star-label"/);
    // Grid stars sit 200 apart from (100, 100); this view covers the four in the top-left corner.
    const w = 686 / STAR_LABEL_SCALE;
    const s = render({ view: { x: 80, y: 80, w }, px: 686 });
    const names = [...s.matchAll(/<text class="star-label"[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    expect(names).toEqual(['spokeo', 'whitepages', 'lexisnexis-risk-solutions', 'equifax-information-services']);
    expect(render({ view: { x: 80, y: 80, w: w * 1.2 }, px: 686, lighting: unlit })).not.toMatch(/class="star-label"/);
  });

  it('nothing blocks the browser or the map from zooming', () => {
    expect(svg).not.toMatch(/touch-action:\s*none/);
    expect(svg).not.toMatch(/user-scalable/);
  });

  it('is the night sky over Reclaim City: a sky gradient and one skyline along the bottom of the view', () => {
    expect(svg).toMatch(/<linearGradient id="rc-sky"/);
    const sky = render({ view: { x: 200, y: 100, w: 400 } }).match(/<g class="skyline" transform="([^"]+)">([\s\S]*?)<\/g>/);
    expect(sky[1]).toBe('translate(200 500) scale(0.4)');
    expect(sky[2].match(/<path/g)).toHaveLength(2);
    expect(svg.indexOf('class="skyline"')).toBeLessThan(svg.indexOf('class="hub-label"'));
  });
});

describe('constellationSvg: labels never collide (controller fix round 1)', () => {
  const tu = realAt('transunion');
  const cases = [
    ['full view, unknown width', {}],
    ['full view at 343px', { px: 343 }],
    ['full view at 900px', { px: 900 }],
    ['TransUnion zoom w330 at 343px', { view: { x: tu[1] - 165, y: tu[2] - 165, w: 330 }, px: 343 }],
    ['deep zoom w150 at 343px (star names)', { view: { x: tu[1] - 75, y: tu[2] - 75, w: 150 }, px: 343 }],
    ['TransUnion zoom, TRADS selected', { view: { x: tu[1] - 165, y: tu[2] - 165, w: 330 }, px: 343, selectedId: 'transunion-risk-and-alternative-data-solutions' }],
  ];
  for (const [name, over] of cases) {
    it(`no two visible labels intersect and none leaves the view: ${name}`, () => {
      const view = over.view ?? { x: 0, y: 0, w: 1000 };
      const s = constellationSvg({ map: realMap, layout: realLayout, lighting: realLight, ...over });
      const ls = labelsOf(s);
      expect(ls.length).toBeGreaterThan(0);
      expect(ls.length).toBe((s.match(/<text class="(hub|star)-label"/g) ?? []).length);
      for (let i = 0; i < ls.length; i += 1) {
        const b = ls[i].box;
        expect(b.left, ls[i].text).toBeGreaterThanOrEqual(view.x - 1e-6);
        expect(b.right, ls[i].text).toBeLessThanOrEqual(view.x + view.w + 1e-6);
        expect(b.top, ls[i].text).toBeGreaterThanOrEqual(view.y - 1e-6);
        expect(b.bottom, ls[i].text).toBeLessThanOrEqual(view.y + view.w + 1e-6);
        for (let j = i + 1; j < ls.length; j += 1) expect(intersects(b, ls[j].box), `${ls[i].text} / ${ls[j].text}`).toBe(false);
      }
      // TransUnion (reach 18) outranks TransUnion RADS (reach 7): it always reads.
      expect(ls.map((l) => l.text)).toContain('TransUnion');
      if (over.selectedId) expect(ls.map((l) => l.text)).toContain('TransUnion Risk and Alternative Data Solutions');
    });
  }

  it('the selected star is always labelled, even a crowded non-hub at full view', () => {
    const id = realLayout.stars.find((st) => !realMap.brokers.find((b) => b.id === st[0]).hub && st[2] > 400 && st[2] < 600)[0];
    const name = shortName(realMap.brokers.find((b) => b.id === id).name);
    const s = constellationSvg({ map: realMap, layout: realLayout, lighting: realLight, selectedId: id, px: 343 });
    expect(labelsOf(s).map((l) => l.text.replace(/&amp;/g, '&'))).toContain(name);
  });

  it('labels sit on no drawn star mark, including a no-opt-out cross', () => {
    const sp = render({ view: { x: 0, y: 0, w: 800 }, px: 400 });
    const marks = layout.stars.map(([id, x, y, r]) => {
      const m = lighting.stars[id].state === 'no-opt-out' ? r + 2 : r;
      return { id, left: x - m, right: x + m, top: y - m, bottom: y + m };
    });
    const ls = labelsOf(sp);
    expect(ls.length).toBeGreaterThan(0);
    for (const l of ls) for (const m of marks) expect(intersects(l.box, m), `${l.text} sits on ${m.id}`).toBe(false);
  });
});

describe('constellationSvg: links (controller ruling M3)', () => {
  const m = { ...map, links: [...map.links, { from: 'us-ice', to: 'hub-a', type: 'supplies', tier: 'A', sources: [{ url: 'a' }, { url: 'b' }, { url: 'c' }] }] };
  const linkTags = (s) => s.match(/<line class="link[^"]*"[^>]*>/g);
  const [, bx, by] = at('us-ice');

  it("a buyer's links stay faint", () => {
    expect(BUYER_LINK_OPACITY).toBeLessThanOrEqual(0.15);
    // ICE is a satellite now: its purchase is a beam from the satellite, not a faint link from a diamond.
    const mini = constellationSvg({ map: m, layout, lighting });
    expect((linkTags(mini) ?? []).find((t) => t.includes(`x1="${bx}" y1="${by}"`))).toBeUndefined();
    const buys = { ...map, links: [...map.links, { from: 'us-ice', to: 'hub-a', type: 'buys', tier: 'A', claim: 'c', sources: [{ url: 'a' }] }] };
    expect(constellationSvg({ map: buys, layout, lighting })).toMatch(/<line class="beam[ "]/);
    // On the real map too.
    const buyers = new Set(realMap.brokers.filter((b) => b.kind.includes('buyer')).map((b) => b.id));
    const pts = new Set(realLayout.stars.filter((st) => buyers.has(st[0])).map((st) => `${st[1]},${st[2]}`));
    const real = linkTags(constellationSvg({ map: realMap, layout: realLayout, lighting: realLight }));
    let n = 0;
    for (const t of real) {
      const [, x1, y1, x2, y2, op] = t.match(/x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" opacity="([\d.]+)"/);
      if (pts.has(`${x1},${y1}`) || pts.has(`${x2},${y2}`)) { n += 1; expect(Number(op)).toBeLessThanOrEqual(0.15); }
    }
    expect(n).toBeGreaterThan(0);
  });

  it("the selected star's links brighten", () => {
    expect(SELECTED_LINK_OPACITY).toBeGreaterThanOrEqual(0.8);
    const s = constellationSvg({ map: m, layout, lighting, selectedId: 'acxiom' });
    const sel = s.match(/<line class="link link--selected"[^>]*>/g);
    expect(sel).toHaveLength(1);
    expect(sel[0]).toMatch(/opacity="0.8"/);
    const [, ax, ay] = at('acxiom');
    expect(sel[0]).toContain(`x2="${ax}" y2="${ay}"`);
    // Selecting a satellite brightens its beams.
    const buys = { ...map, links: [...map.links, { from: 'us-ice', to: 'hub-a', type: 'buys', tier: 'A', claim: 'c', sources: [{ url: 'a' }] }] };
    const b = constellationSvg({ map: buys, layout, lighting, selectedSat: 1 }).match(/<line class="beam[^"]*beam--sel"/g);
    expect(b.length).toBeGreaterThan(0);
    expect(svg).not.toMatch(/link--selected/);
  });
});

describe('constellationSvg: the skyline hides no star', () => {
  it('draws under every star, link and label', () => {
    const s = constellationSvg({ map: realMap, layout: realLayout, lighting: realLight, px: 343 });
    const sky = s.indexOf('<g class="skyline"');
    expect(sky).toBeGreaterThan(s.indexOf('<g class="sky"'));
    for (const g of ['links', 'stars', 'rings', 'effects', 'labels', 'hits']) expect(s.indexOf(`<g class="${g}"`), g).toBeGreaterThan(sky);
  });
});

describe('zoomViewBox, zoomed right out', () => {
  it('centres the sky top to bottom when the whole width is in view, on any screen shape', () => {
    // Desktop (wide) and phone (tall) stages; any anchor.
    for (const h of [690, 1750]) for (const cy of [0, 300, 900]) {
      const v = zoomViewBox({ x: 0, y: cy, w: 500, h: h / 2 }, 0.5, 500, cy, { padY: 0.5 });
      expect(v.w).toBe(1000);
      expect(v.y + v.h / 2).toBeCloseTo(500, 6);
    }
  });
});
