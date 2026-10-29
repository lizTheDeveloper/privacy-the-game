import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderBrokerMap, hasSweepMembers, controlsFor } from '../../src/screens/broker-map.js';
import { renderDistrict } from '../../src/screens/district.js';
import { RECHECK_OPACITY, constellationSvg, labelBox, LABEL_LINE_EM } from '../../src/components/constellation.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { whatsLeft, litIds, initialView, withRatio, zoomViewBox, zoomAnchor, litBunch, VIEW_BOUNDS } from '../../src/utils/broker-view.js';
import { markMapSeen, newlyLitIds, cleanBrokerState, setResidency, setHome } from '../../src/utils/broker-state.js';
import { BROKER_MAP_DIALOGUE } from '../../src/data/dialogue.js';
import { isPrivateBreadcrumb } from '../../src/utils/errorNoise.js';
import { DISTRICTS } from '../../src/data/districts.js';
import { createInitialState } from '../../src/state.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const data = { map, layout };
// The framing tests pin the people-search stars they light where Plan 2's layout put them: every data rebuild re-spaces
// the outer ring, and these tests are about how the view frames lit stars, not about where the stars land.
const PLAN2_POS = {
  spokeo: [876.4, 716.1], whitepages: [643.5, 915.9], beenverified: [674.5, 154.6], mylife: [527.6, 927.7], nuwber: [234.9, 173.5],
  'beenverified-llc-and-its-subsidiaries-and-affiliates': [559.5, 871.2], // the BeenVerified line lights this record too
};
const framing = { ...layout, stars: layout.stars.map((s) => (PLAN2_POS[s[0]] ? [s[0], ...PLAN2_POS[s[0]], s[3]] : s)) };
const T = '2026-10-19';
const WF = 'people_search-fortify-web-forms';
const STRAG = 'people_search-reclaim-stragglers';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const fresh = () => createInitialState();
const draw = (state, opts = {}) => renderBrokerMap(state, { status: 'ready', data, today: T, ...opts });
const withLines = (state, missionId, lines) => ({ ...state, brokerFiled: { ...(state.brokerFiled ?? {}), [missionId]: { lines, since: '2026-10-01' } } });
const filedState = () => withLines(fresh(), WF, { spokeo: '2026-10-01', whitepages: '2026-10-01' });
// The header's text, its no-wrap spans removed.
const head = (html) => (html.match(/<h1 class="map-head">(.*?)<\/h1>/)?.[1] ?? '').replace(/<[^>]+>/g, '');
const countNew = (html) => (html.match(/class="star star--lit star--new"/g) ?? []).length;

describe('the map screen', () => {
  const html = draw(fresh());

  it('a new player sees 0% and 0/12', () => expect(head(html)).toBe('FIELD COVERED: 0% · HUBS LIT 0/12'));
  it('neither half of the header breaks across lines', () => expect(html).toMatch(/<span class="nw">FIELD COVERED: 0%<\/span> · <span class="nw">HUBS LIT 0\/12<\/span>/));
  it('labels the number as an estimate', () => expect(html).toContain('estimated share of the field your opt-outs reach'));
  it('has the back link and the SVG', () => {
    expect(html).toContain('href="#/district/reclamation"');
    expect(html).toContain('← THE RECLAMATION');
    expect(html).toContain('<svg class="constellation"');
  });

  it('the legend shows every mark, re-check due as dimmed amber', () => {
    for (const t of ['You filed', 'Re-check due', 'No opt-out exists', 'Not yet', 'Credit frozen (still sells data)', 'Buyers']) expect(html).toContain(t);
    const legend = html.slice(html.indexOf('class="map-legend"'));
    expect(legend).toMatch(new RegExp(`fill="#FF9F00" fill-opacity="${RECHECK_OPACITY}"`));
  });

  it('the browser-only legend row shows only when a sweep has members', () => {
    // The real map carries the DAA WebChoices sweep, so the row shows; a map without sweeps hides it.
    expect(hasSweepMembers(map)).toBe(true);
    expect(html).toContain('Opted out in this browser only');
    const { sweeps: _sweeps, ...bare } = map;
    expect(hasSweepMembers(bare)).toBe(false);
    expect(draw(fresh(), { data: { map: bare, layout } })).not.toContain('Opted out in this browser only');
    expect(hasSweepMembers({ sweeps: { nai: { members: [] } } })).toBe(false);
    const withSweep = { ...bare, sweeps: { nai: { members: [map.brokers[0].id] } } };
    expect(hasSweepMembers(withSweep)).toBe(true);
    expect(draw(fresh(), { data: { map: withSweep, layout } })).toContain('Opted out in this browser only');
  });

  it('zoom buttons are real buttons, with a reset', () => {
    expect(html).toContain('data-action="map-zoom" data-dir="in"');
    expect(html).toContain('data-action="map-zoom" data-dir="out"');
    expect(html).toContain('data-action="map-zoom" data-dir="reset"');
    expect(html).toMatch(/\.constellation-zoom\{[^}]*min-width:44px[^}]*min-height:44px/);
  });

  it('draws at the stage size it is given, with that many px per unit', () => {
    const view = { x: 100, y: 100, w: 300, h: 600 };
    const h = draw(fresh(), { view, stage: { w: 343, h: 686 } });
    expect(h).toContain('viewBox="100 100 300 600"');
    expect(h).toContain('height:686px');
    // A hub label is 12 CSS px: 12 / (343 / 300) map units.
    expect(h).toMatch(/class="hub-label"[^>]*font-size="10\.5"/);
  });

  it('asks where the player lives, with a state picker and the outside/unsaid answers', () => {
    const res = html.slice(html.indexOf('<div class="residency"'));
    expect(res).toContain('WHERE DO YOU LIVE?');
    expect(res).toContain('data-action="quiz-pick"');
    expect(res).toContain('<option value="US-TX">Texas</option>');
    expect(res).toContain('data-action="quiz-outside"');
    expect(res).toContain('data-action="quiz-unsaid"');
    expect(res).not.toContain('change-home');
  });

  it('a guess is offered to confirm', () => {
    const h = draw(fresh(), { quiz: { guess: 'US-TX' } });
    expect(h).toContain("Looks like you're in Texas. Is that right?");
    expect(h).toContain('data-action="quiz-yes" data-value="US-TX"');
  });

  it('an answered location shows the answer and CHANGE; an old California yes reads as California', () => {
    expect(draw(setHome(fresh(), 'US-TX'))).toContain('NOT IN TEXAS? CHANGE');
    expect(draw(setResidency(fresh(), 'yes'))).toContain('Where you live: <strong>California</strong>');
    expect(draw(setHome(fresh(), 'outside-us'))).toContain('Where you live: <strong>Outside the US</strong>');
    // An old "not in California" doesn't say which state: asked again.
    expect(draw(setResidency(fresh(), 'no'))).toContain('WHERE DO YOU LIVE?');
    const editing = draw(setHome(fresh(), 'US-TX'), { editingResidency: true });
    expect(editing).toContain('data-action="quiz-pick"');
  });

  it.each([['no']])('DROP explains why it lights nothing for %s', (v) => {
    const h = draw(setResidency(withLines(fresh(), STRAG, { drop: '2026-10-01' }), v));
    expect(h).toContain("DROP is only for California residents, so it doesn't light anything for you. Your other opt-outs still do.");
    expect(BROKER_MAP_DIALOGUE.dropNotResident).toBe("DROP is only for California residents, so it doesn't light anything for you. Your other opt-outs still do.");
  });

  it('DROP reads lit, ask and off', () => {
    const dropped = withLines(fresh(), STRAG, { drop: '2026-10-01' });
    expect(draw(setResidency(dropped, 'yes'))).toContain('DROP: filed. It lights the brokers registered in California.');
    expect(draw(dropped)).toContain('DROP: filed. Tell the map where you live to light it.');
    expect(html).toContain('DROP: not filed yet.');
    expect(html).toContain('href="#/mission/people_search-reclaim-stragglers/briefing"');
  });

  it('the pending nudge links each pending mission\'s re-check', () => {
    const s = { ...fresh(), missions: { [WF]: { status: 'completed', optout_result: 'some-submitted', completedAt: '2026-10-01T12:00:00.000Z' } } };
    const h = draw(s);
    expect(h).toContain(BROKER_MAP_DIALOGUE.nudge);
    expect(BROKER_MAP_DIALOGUE.nudge).toBe('Tell Scout which ones you filed.');
    expect(h).toContain('href="#/mission/people_search-fortify-web-forms/recheck"');
    expect(h).not.toContain('/debrief"');
    expect(html).not.toContain(BROKER_MAP_DIALOGUE.nudge);
  });

  it('whatsLeft on a new save is the top five by reach', () => {
    expect(whatsLeft(map, brokerLighting(map, {}, T)).map((r) => r.id)).toEqual(['transunion', 'experian', 'relx-plc', 'general-motors', 'equifax']);
  });

  it('whatsLeft rows carry a non-recon mission or none, and skip lit stars', () => {
    const rows = whatsLeft(map, brokerLighting(map, {}, T), 900);
    for (const r of rows) {
      const b = map.brokers.find((x) => x.id === r.id);
      expect(r.mission).toBe(b.missions.find((m) => !m.includes('-recon-')) ?? null);
      expect(b.optOut?.method).not.toBe('none');
      expect(b.kind).not.toContain('buyer');
    }
    const l = brokerLighting(map, filedState(), T);
    expect(whatsLeft(map, l, 900).map((r) => r.id)).not.toContain('spokeo');
  });

  it('what\'s left lists name · reach and a briefing link or the no-mission line', () => {
    expect(html).toContain("WHAT'S LEFT THAT MATTERS");
    expect(html).toContain('TransUnion · reach 18');
    expect(html).toContain('No mission covers this one yet');
    const s = { ...fresh() };
    const withMission = whatsLeft(map, brokerLighting(map, s, T), 900).find((r) => r.mission);
    expect(withMission).toBeTruthy();
  });

  it('first visit blooms every lit star; the next visit blooms none', () => {
    let s = filedState();
    const l = brokerLighting(map, s, T);
    const lit = litIds(l);
    expect(lit).toEqual(['spokeo', 'whitepages']);
    const first = newlyLitIds(s, lit);
    expect([...first].sort()).toEqual(lit);
    expect(countNew(draw(s, { newlyLit: first }))).toBe(2);
    s = markMapSeen(s, lit);
    expect(s.brokerMap.seenLit).toEqual(['spokeo', 'whitepages']);
    expect([...newlyLitIds(s, lit)]).toEqual([]);
    expect(countNew(draw(s, { newlyLit: newlyLitIds(s, lit) }))).toBe(0);
    // A newly lit star blooms alone.
    const more = withLines(s, STRAG, { mylife: '2026-10-02' });
    expect([...newlyLitIds(more, litIds(brokerLighting(map, more, T)))]).toEqual(['mylife']);
  });

  it('markMapSeen sorts, and a broken brokerMap starts fresh', () => {
    expect(markMapSeen({ brokerMap: 'x' }, ['b', 'a']).brokerMap).toEqual({ seenLit: ['a', 'b'] });
    expect(markMapSeen({ brokerMap: { seenLit: ['z'], other: 1 } }, ['b']).brokerMap).toEqual({ seenLit: ['b'], other: 1 });
    expect(cleanBrokerState({ brokerMap: [] })).toEqual({});
    expect(cleanBrokerState({ brokerMap: { seenLit: 'x' } })).toEqual({ brokerMap: {} });
    expect(cleanBrokerState({ brokerMap: { seenLit: ['a', 3] } })).toEqual({ brokerMap: { seenLit: ['a'] } });
    const ok = { brokerMap: { seenLit: ['a'] } };
    expect(cleanBrokerState(ok)).toBe(ok);
    expect([...newlyLitIds({ brokerMap: 'x' }, ['a'])]).toEqual(['a']);
  });

  it('the first visit gets Scout\'s constellation line; later visits do not', () => {
    expect(draw(fresh(), { firstVisit: true })).toContain("There's a whole constellation of data brokers");
    expect(html).not.toContain("There's a whole constellation of data brokers");
  });

  it('the bloom only runs without reduced motion', () => {
    const h = draw(filedState(), { newlyLit: new Set(['spokeo']) });
    const css = h.match(/<style>([\s\S]*?)<\/style>/g).join('');
    const motion = css.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(motion).toBeGreaterThan(-1);
    for (const m of css.matchAll(/\.star--new[^{]*\{/g)) expect(m.index).toBeGreaterThan(motion);
    expect(css.slice(0, motion)).not.toMatch(/animation\s*:\s*(?!none)/);
  });

  it('a list view reaches every hub and lit star by keyboard', () => {
    const closed = draw(filedState());
    expect(closed).toContain('data-action="map-list"');
    expect(closed).toContain('aria-expanded="false"');
    const open = draw(filedState(), { listOpen: true });
    expect(open).toContain('aria-expanded="true"');
    const items = [...open.matchAll(/<button type="button" class="constellation-star"[^>]*data-action="select-star" data-star="(\d+)"/g)].map((m) => layout.stars[Number(m[1])][0]);
    for (const id of ['spokeo', 'whitepages', 'transunion', 'experian']) expect(items).toContain(id);
    expect(items).toHaveLength(14);
  });

  it('a selected star is named under the map', () => {
    const h = draw(fresh(), { selectedId: 'spokeo' });
    expect(h).toMatch(/class="constellation-pick"[^>]*aria-live="polite"[^>]*>[^<]*Spokeo/);
  });

  it('no broker id goes in an id, name or title attribute', () => {
    const h = draw(filedState(), { selectedId: 'spokeo', listOpen: true });
    const ids = new Set(map.brokers.map((b) => b.id));
    for (const m of h.matchAll(/\s(id|name|title)="([^"]*)"/g)) {
      for (const tok of m[2].split(/\s+/)) expect(ids.has(tok)).toBe(false);
    }
    expect(h).not.toMatch(/href="#\/reclamation\/map[^"]/);
  });

  it('map, list and residency clicks never become breadcrumbs', () => {
    for (const m of ['svg.constellation', 'button.constellation-zoom', 'button.constellation-star', 'div.residency > button.btn', 'button.residency-btn', 'button.constellation-list'])
      expect(isPrivateBreadcrumb({ category: 'ui.click', message: m })).toBe(true);
    expect(html).toMatch(/class="[^"]*constellation-zoom/);
    expect(html).toMatch(/class="[^"]*residency-btn/);
  });
});

describe('the opening view', () => {
  it('opens zoomed in around the player\'s lit stars', () => {
    const l = brokerLighting(map, filedState(), T);
    const v = initialView(map, framing, l, 2);
    expect(v.w).toBeLessThan(600);
    expect(v.h).toBeCloseTo(v.w * 2);
    const pos = Object.fromEntries(framing.stars.map((s) => [s[0], s]));
    for (const id of ['spokeo', 'whitepages']) {
      const [, x, y] = pos[id];
      expect(x).toBeGreaterThanOrEqual(v.x);
      expect(x).toBeLessThanOrEqual(v.x + v.w);
      expect(y).toBeGreaterThanOrEqual(v.y);
      expect(y).toBeLessThanOrEqual(v.y + v.h);
    }
  });

  it('lit stars spread across the sky open on their tightest bunch, still zoomed in', () => {
    const lines = { spokeo: '2026-10-01', whitepages: '2026-10-01', beenverified: '2026-10-01' };
    const s = withLines(withLines(fresh(), WF, lines), STRAG, { mylife: '2026-10-02', nuwber: '2026-10-02' });
    const v = initialView(map, framing, brokerLighting(map, s, T), 2);
    expect(v.w).toBeLessThanOrEqual(600);
    const pos = Object.fromEntries(framing.stars.map((x) => [x[0], x]));
    const shown = ['whitepages', 'mylife'].filter((id) => pos[id][1] >= v.x && pos[id][1] <= v.x + v.w && pos[id][2] >= v.y && pos[id][2] <= v.y + v.h);
    expect(shown).toEqual(['whitepages', 'mylife']);
  });

  it('with nothing lit, opens on the densest hub cluster', () => {
    const v = initialView(map, layout, brokerLighting(map, {}, T), 1);
    expect(v.w).toBeLessThan(500);
    expect(v.h).toBe(v.w);
    const inView = layout.stars.filter(([, x, y]) => x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h);
    expect(inView.some(([id]) => map.brokers.find((b) => b.id === id)?.hub)).toBe(true);
  });

  it('withRatio keeps the centre and width; zoomViewBox keeps the ratio', () => {
    const v = withRatio({ x: 100, y: 100, w: 200 }, 2);
    expect(v).toEqual({ x: 100, y: 0, w: 200, h: 400 });
    const z = zoomViewBox(v, 2, 200, 200);
    expect(z.h / z.w).toBeCloseTo(2);
    expect(z.w).toBe(100);
    const out = zoomViewBox({ x: 0, y: 0, w: 1000, h: 2000 }, 0.5, 500, 500);
    expect(out).toEqual({ x: 0, y: -500, w: 1000, h: 2000 });
  });
});

describe('the way in', () => {
  const reclamation = renderDistrict(fresh(), 'reclamation');

  it('the way in sits on The Reclamation\'s facility screen', () => {
    const at = reclamation.indexOf('href="#/reclamation/map"');
    expect(at).toBeGreaterThan(reclamation.indexOf('DISTRICT FACILITIES'));
    expect(at).toBeLessThan(reclamation.indexOf('Welcome to The Reclamation'));
    expect(at).toBeLessThan(reclamation.indexOf('class="panel" style="margin: 0 16px; overflow: hidden;"'));
    expect(reclamation).toContain('LOOK UP');
    expect(reclamation).toContain('Your data drifted up out of the city. Go find it.');
  });

  it('only The Reclamation links to the map', () => {
    for (const d of DISTRICTS) {
      if (d.id === 'reclamation') continue;
      expect(renderDistrict(fresh(), d.id)).not.toContain('#/reclamation/map');
    }
  });
});

// Label boxes read back from markup (as constellation.test.js does).
function labelsOf(svg) {
  const out = [];
  for (const m of svg.matchAll(/<text class="(hub-label|star-label)" x="([^"]+)" y="([^"]+)" font-size="([^"]+)"[^>]*?(?: text-anchor="(\w+)")?>(.*?)<\/text>/g)) {
    const [, cls, x, y, fs, anchor = 'start', inner] = m;
    const f = Number(fs);
    const lines = inner.includes('<tspan') ? [...inner.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((t) => t[1]) : [inner];
    const top = Number(y) - f * 0.85;
    const cy = top + (lines.length * f * LABEL_LINE_EM) / 2;
    out.push({ cls, text: lines.join(' '), box: labelBox(lines.map((t) => t.replace(/&amp;/g, '&')), f, Number(x), anchor, cy) });
  }
  return out;
}

describe('fix round 1: labels clear of the zoom buttons and the edges (ruling M5)', () => {
  const lighting = brokerLighting(map, {}, T);
  const PX = 328;
  const STAGE_H = 628;
  const CONTROLS = { w: 60, h: 212 }; // four buttons since ↓ GOV (2026-10-29)
  const around = (id, w) => {
    const s = layout.stars.find((x) => x[0] === id);
    const h = (w * STAGE_H) / PX;
    return zoomViewBox({ x: s[1] - w / 2, y: s[2] - h / 2, w, h }, 1, s[1], s[2], VIEW_BOUNDS);
  };

  it.each([[260], [130], [100]])('at w%i on Equifax no label sits under the buttons or past an edge', (w) => {
    const v = around('equifax', w);
    const svg = constellationSvg({ map, layout, lighting, view: v, px: PX, controls: CONTROLS });
    const scale = PX / v.w;
    const ctl = { left: v.x + v.w - CONTROLS.w / scale, top: v.y, bottom: v.y + CONTROLS.h / scale };
    const labels = labelsOf(svg);
    expect(labels.length).toBeGreaterThan(0);
    for (const { box } of labels) {
      expect(box.left).toBeGreaterThanOrEqual(v.x - 1e-6);
      expect(box.right).toBeLessThanOrEqual(v.x + v.w + 1e-6);
      expect(box.right <= ctl.left || box.top >= ctl.bottom).toBe(true);
    }
  });

  it('the screen passes the button corner to the SVG', () => {
    const v = around('equifax', 130);
    const h = draw(fresh(), { view: v, stage: { w: PX, h: STAGE_H } });
    const svg = h.slice(h.indexOf('<svg class="constellation"'), h.indexOf('</svg>') + 6);
    expect(svg).toBe(constellationSvg({ map, layout, lighting, view: v, px: PX, controls: CONTROLS }));
  });

  it('the label width estimate counts letter-spacing and the outline', () => {
    const b = labelBox(['IXI Corporation'], 10, 0, 'start', 0);
    expect(b.right - b.left).toBeGreaterThanOrEqual(15 * (10 * 0.62 + 0.5));
  });

  it('amber stars never bloom (an old filing going stale is not new light)', () => {
    const l = { stars: { spokeo: { state: 'amber', litOn: '2026-01-01', via: ['checklist'] } }, frozen: [], halo: [], pending: [], drop: 'off' };
    const svg = constellationSvg({ map, layout, lighting: l, newlyLit: new Set(['spokeo']) });
    expect(svg).toContain('star--amber');
    expect(svg).not.toMatch(/class="[^"]*(star--new|glow--new)/);
    expect(svg).not.toContain('class="burst"');
  });
});

describe('fix round 1: framing', () => {
  it('a lit bunch near the bottom rim opens centred on it (the view may run past the map)', () => {
    const s = withLines(withLines(fresh(), WF, { whitepages: '2026-10-01' }), STRAG, { mylife: '2026-10-02' });
    const l = brokerLighting(map, s, T);
    const b = litBunch(framing, l, 2);
    const v = initialView(map, framing, l, 2);
    expect(v.y + v.h).toBeGreaterThan(1000);
    expect(v.x + v.w / 2).toBeCloseTo(b.cx, 0);
    expect(v.y + v.h / 2).toBeCloseTo(b.cy, 0);
  });

  it('+/- zoom about the selected star, else the lit bunch, else the centre', () => {
    const l = brokerLighting(map, filedState(), T);
    const v = { x: 400, y: 400, w: 500, h: 1000 };
    const sp = framing.stars.find((x) => x[0] === 'spokeo');
    expect(zoomAnchor(v, framing, l, 'spokeo')).toEqual({ x: sp[1], y: sp[2] });
    const b = litBunch(framing, l, 2);
    expect(zoomAnchor(v, framing, l, null)).toEqual({ x: b.cx, y: b.cy });
    expect(zoomAnchor({ x: 0, y: 0, w: 200, h: 400 }, framing, l, 'spokeo')).toBeNull();
    expect(zoomAnchor({ x: 0, y: 0, w: 200, h: 400 }, framing, brokerLighting(map, {}, T), null)).toBeNull();
    // Zooming about the anchor keeps it at the same place on screen.
    const z = zoomViewBox(v, 2, sp[1], sp[2], VIEW_BOUNDS);
    expect((sp[1] - z.x) / z.w).toBeCloseTo((sp[1] - v.x) / v.w);
  });

  it("Scout's first-visit line floats inside the stage, dismissable, off the zoom buttons", () => {
    const h = draw(fresh(), { firstVisit: true });
    const stage = h.slice(h.indexOf('<div class="map-stage"'), h.indexOf('<p class="constellation-pick"'));
    expect(stage).toContain("There's a whole constellation");
    expect(stage.indexOf('class="constellation-scout"')).toBeLessThan(stage.indexOf('class="constellation-controls"'));
    expect(stage).toContain('data-action="dismiss-scout"');
    expect(h).toMatch(/\.constellation-scout\{[^}]*position:absolute[^}]*right:68px/);
    expect(h).toMatch(/\.constellation-scout-x\{[^}]*width:44px;height:44px/);
    expect(draw(fresh(), { firstVisit: false })).not.toContain('class="constellation-scout"');
  });

  it('on screens under 360px the zoom buttons lie in a row at the bottom-right, still 44px', () => {
    expect(controlsFor({ w: 287, h: 400 })).toMatchObject({ corner: 'bottom-right' });
    expect(controlsFor({ w: 343, h: 600 }).corner).toBeUndefined();
    expect(controlsFor(null).corner).toBeUndefined();
    const h = draw(fresh());
    expect(h).toMatch(/@media \(max-width:359\.98px\)\{\.constellation-controls\{top:auto;bottom:8px;flex-direction:row\}/);
  });

  it('the header reads <1% (escaped) when something is lit but the share floors to 0; DROP-yes stays 59%', () => {
    const h = draw(withLines(fresh(), WF, { spokeo: '2026-10-01' }));
    expect(head(h)).toBe('FIELD COVERED: &lt;1% · HUBS LIT 0/12');
    const drop = draw(setResidency(withLines(fresh(), STRAG, { drop: '2026-10-01' }), 'yes'));
    expect(head(drop)).toBe('FIELD COVERED: 59% · HUBS LIT 6/12');
  });

  it('DROP with "rather not say" has its own line', () => {
    const h = draw(setResidency(withLines(fresh(), STRAG, { drop: '2026-10-01' }), 'unsaid'));
    expect(h).toContain('We only light DROP if you tell us you live in California.');
    expect(h).not.toContain('DROP is only for California residents');
    expect(BROKER_MAP_DIALOGUE.dropUnsaid).toBe('We only light DROP if you tell us you live in California.');
  });
});
