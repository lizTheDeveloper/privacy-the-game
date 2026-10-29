import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderBrokerMap } from '../../src/screens/broker-map.js';
import { ladderPanel, rungCard } from '../../src/components/sky-ladder.js';
import { constellationSvg } from '../../src/components/constellation.js';
import { ladder } from '../../src/utils/sky-ladder.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { fitView } from '../../src/utils/broker-view.js';
import { setHome, setPrescreen } from '../../src/utils/broker-state.js';
import { createInitialState } from '../../src/state.js';
import { isPrivateBreadcrumb } from '../../src/utils/errorNoise.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const data = { map, layout };
const T = '2026-10-29';
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });
const draw = (state, opts = {}) => renderBrokerMap(state, { status: 'ready', data, today: T, ...opts });
const rungsFor = (state) => ladder(map, state, brokerLighting(map, state, T));

describe('the ladder on the sky', () => {
  it('rungs in order with NEXT on the first thing the player can do', () => {
    const h = ladderPanel(rungsFor(setHome({}, 'US-TX')));
    const list = h.slice(h.indexOf('<ol class="sky-rungs">'));
    expect(list.indexOf('California DROP')).toBeLessThan(list.indexOf('Global Privacy Control'));
    expect(h).toMatch(/<span class="sky-rung-next">NEXT<\/span> Global Privacy Control/);
    expect(h).toContain('NEXT: Global Privacy Control');
    expect(h).toContain('603 stars · <span class="sky-rung-status">California only</span>');
  });

  it('rung buttons carry an index, never a broker id', () => {
    const h = ladderPanel(rungsFor({}));
    const attrs = [...h.matchAll(/data-rung="([^"]*)"/g)].map((m) => m[1]);
    expect(attrs.every((v) => /^\d+$/.test(v))).toBe(true);
    expect(h).not.toMatch(/data-(?:star|id|broker)=/);
  });

  it('DROP outside California has no Go and says why', () => {
    const drop = rungsFor(setHome({}, 'US-TX'))[0];
    const c = rungCard(drop, { home: 'US-TX' });
    expect(c).toContain('Why not me?');
    expect(c).not.toContain('FILE DROP');
    expect(rungCard(rungsFor(setHome({}, 'US-CA'))[0], { home: 'US-CA' })).toContain('href="#/mission/people_search-reclaim-stragglers/briefing"');
  });

  it('GPC in a law state links the law; elsewhere it says companies may ignore it', () => {
    const tx = rungsFor(setHome({}, 'US-CO'))[1];
    expect(rungCard(tx, { home: 'US-CO' })).toContain('href="https://coag.gov/resources/colorado-privacy-act/"');
    const al = rungsFor(setHome({}, 'US-AL'))[1];
    expect(rungCard(al, { home: 'US-AL' })).toContain("don't have to honor this where you live");
    expect(rungCard(al, { home: 'US-AL' })).toContain('href="#/mission/scam_defense-fortify-tools/briefing"');
  });

  it('OptOutPrescreen offers I DID THIS, then UNDO, with its two links', () => {
    const before = rungsFor({})[3];
    expect(rungCard(before)).toContain('data-action="prescreen-did"');
    expect(rungCard(before)).toContain('href="https://www.optoutprescreen.com/"');
    const after = rungsFor(setPrescreen({}, T))[3];
    expect(rungCard(after)).toContain('data-action="prescreen-undo"');
  });

  it('a selected rung highlights its stars on the sky and dims the rest', () => {
    const s = setHome(createInitialState(), 'US-TX');
    const h = draw(s, { rung: 2 });
    expect(h).toContain('class="constellation constellation--focus"');
    expect(h.match(/class="hl-ring"/g)).toHaveLength(99);
    expect(draw(s)).not.toContain('class="constellation constellation--focus"');
  });

  it('shimmer only when GPC is done or selected', () => {
    const s = setHome(createInitialState(), 'US-TX');
    expect(draw(s)).not.toContain('class="shimmer"');
    expect(draw(s, { rung: 1 })).toContain('class="shimmer"');
    const done = { ...s, missions: { ...s.missions, 'scam_defense-fortify-tools': { status: 'completed', action: 'completed' } } };
    expect(draw(done)).toContain('class="shimmer"');
  });

  it('the side holds the ladder, or a star card, never both', () => {
    const s = createInitialState();
    expect(draw(s)).toContain('class="sky-ladder');
    const withCard = draw(s, { selectedId: 'spokeo', rung: 2 });
    expect(withCard).toContain('class="star-card"');
    expect(withCard).not.toContain('class="sky-ladder');
    expect(withCard).not.toContain('class="constellation constellation--focus"');
  });

  it('fitView frames a rung and the whole sky for none', () => {
    const v = fitView(layout, ['spokeo', 'whitepages'], 2);
    expect(v.w).toBeGreaterThanOrEqual(260);
    expect(v.h).toBeCloseTo(v.w * 2);
    expect(fitView(layout, [], 1).w).toBe(1000);
  });

  it('ladder clicks never become breadcrumbs, and selection never reaches the URL or track()', () => {
    for (const m of ['button.sky-rung', 'button.sky-ladder-bar', 'button.sky-rung-did', 'button.star-card-close'])
      expect(isPrivateBreadcrumb({ category: 'ui.click', message: m })).toBe(true);
    const app = readFileSync('src/app.js', 'utf8');
    const fn = app.slice(app.indexOf('function ladderAction'), app.indexOf('const MAP_ACTIONS'));
    expect(fn).not.toMatch(/track\(|navigate\(|location\.hash|captureError/);
  });

  it('selecting a star closes the ladder sheet and opening the ladder closes the card', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const open = app.slice(app.indexOf('function openCard'), app.indexOf('function closeCard'));
    expect(open).toMatch(/selectedRung = null;\n {2}ladderOpen = false;/);
    const fn = app.slice(app.indexOf('function ladderAction'), app.indexOf('const MAP_ACTIONS'));
    expect(fn).toMatch(/selectedRung = index;\n {4}selectedId = null;/);
  });
});

describe('constellation highlight', () => {
  it('rings exactly the highlighted stars', () => {
    const lighting = brokerLighting(map, {}, T);
    const svg = constellationSvg({ map, layout, lighting, highlight: ['spokeo', 'whitepages'] });
    expect(svg.match(/class="hl-ring"/g)).toHaveLength(2);
    expect(svg.match(/ is-hl"/g)).toHaveLength(2);
  });
});
