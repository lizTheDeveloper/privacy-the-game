import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseRoute } from '../../src/router.js';
import { bigCheckGroups, filterBigCheck } from '../../src/utils/big-check.js';
import { renderBigCheck } from '../../src/screens/big-check.js';
import { renderBrokerMap } from '../../src/screens/broker-map.js';
import { starCard } from '../../src/components/star-card.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { setBigCheck } from '../../src/utils/broker-state.js';
import { calcDistrictProgress, calcIntegrity } from '../../src/utils/calc.js';
import { restoreEvents } from '../../src/utils/restore.js';
import { isPrivateBreadcrumb } from '../../src/utils/errorNoise.js';
import { DISTRICTS } from '../../src/data/districts.js';
import { MISSIONS } from '../../src/data/missions.js';
import { createInitialState } from '../../src/state.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const mini = JSON.parse(readFileSync('tests/fixtures/broker-map-mini.json', 'utf8'));
const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const T = '2026-10-23';
const WF = 'people_search-fortify-web-forms';
const STRAG = 'people_search-reclaim-stragglers';
const fresh = () => createInitialState();
const rowIds = (groups) => groups.flatMap((g) => g.rows.map((r) => r.id));
const groupsFor = (m, s) => bigCheckGroups(m, brokerLighting(m, s, T));
const render = (s, m = mini, extra = {}) => renderBigCheck(s, { status: 'ready', data: { map: m, layout }, today: T, ...extra });
const hrefs = (html) => [...html.matchAll(/href="([^"]*)"/g)].map((x) => x[1].replace(/&amp;/g, '&'));
// Each group's summary, as text.
const summaries = (html) => [...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map((x) => x[1].replace(/<[^>]*>/g, ''));
// The screen's own markup, without the HUD above it.
const root = (html) => html.slice(html.indexOf('<div class="big-check'));

describe('the Big Check', () => {
  it('the route is one fixed hash', () => {
    expect(parseRoute('#/reclamation/big-check')).toEqual({ screen: 'big-check', params: {} });
    expect(parseRoute('#/reclamation/big-check/spokeo').screen).toBe('city');
    expect(parseRoute('#/reclamation/big-check?q=spokeo').screen).toBe('city');
  });

  it('rows exclude buyers, no-opt-out brokers and anything already lit', () => {
    const ids = rowIds(groupsFor(mini, fresh()));
    expect(ids).not.toContain('us-ice');
    expect(ids).not.toContain('nope');
    expect(ids).toContain('spokeo');
    expect(ids).toContain('tail-1');
    expect(ids).toContain('tail-2'); // an unknown route still belongs on the list
    expect(ids).toContain('criteo'); // a halo is not a light
    const filed = { ...fresh(), brokerFiled: { [WF]: { lines: { spokeo: T } } } };
    expect(rowIds(groupsFor(mini, filed))).not.toContain('spokeo');
  });

  it('DROP-lit brokers leave the list', () => {
    const s = { ...fresh(), brokerFiled: { [STRAG]: { lines: { drop: T } } }, caResident: 'yes' };
    const ids = rowIds(groupsFor(mini, s));
    for (const id of ['tail-1', 'hub-a', 'equifax-information-services', 'spokeo', 'acxiom']) expect(ids).not.toContain(id);
    expect(ids).toContain('tail-2');
    expect(ids).toContain('whitepages');
    // Not a resident: DROP lights nothing, so nothing leaves.
    expect(rowIds(groupsFor(mini, { ...s, caResident: 'no' }))).toContain('tail-1');
  });

  it('a broker with a mission shows the mission, not a tick box', () => {
    const groups = groupsFor(mini, fresh());
    const row = groups.flatMap((g) => g.rows).find((r) => r.id === 'whitepages');
    expect(row.mission).toBe(WF);
    expect(groups.flatMap((g) => g.rows).find((r) => r.id === 'tail-1').mission).toBeNull();
    const html = render(fresh());
    expect(html).not.toContain('data-big-check="whitepages"');
    expect(html).toContain(`href="#/mission/${WF}/briefing"`);
    expect(html).toContain('In a mission:');
    expect(html).toContain('data-big-check="tail-1"');
    expect(html).toContain('I filed with them');
  });

  it('a ticked broker that gains a mission stays lit', () => {
    const s = setBigCheck(fresh(), 'whitepages', true, '2026-10-01');
    const l = brokerLighting(mini, s, T);
    expect(l.stars.whitepages.state).toBe('lit');
    expect(l.stars.whitepages.via).toEqual(['big-check']);
    const row = bigCheckGroups(mini, l).flatMap((g) => g.rows).find((r) => r.id === 'whitepages');
    expect(row).toMatchObject({ mission: WF, ticked: true });
    const html = render(s);
    // Its box stays, checked, so it can be unticked (final review M2).
    expect(html).toMatch(/data-big-check="whitepages"[^>]*checked/);
    expect(html).toContain(`href="#/mission/${WF}/briefing"`);
  });

  it('a tick marks its row and counts in its group', () => {
    const s = setBigCheck(fresh(), 'tail-1', true, T);
    const groups = groupsFor(mini, s);
    expect(groups.flatMap((g) => g.rows).find((r) => r.id === 'tail-1').ticked).toBe(true);
    const html = render(s);
    expect(html).toMatch(/data-big-check="tail-1"[^>]*checked/);
    expect(summaries(html)).toContain('Not yet classified · 1/2');
  });

  it('groups come in the fixed order with their labels, rows by name', () => {
    const groups = groupsFor(mini, fresh());
    expect(groups.map((g) => g.label)).toEqual(['People search', 'Marketing', 'Risk and identity', 'Financial', 'Ad networks', 'Not yet classified']);
    expect(groups[0].rows.map((r) => r.id)).toEqual(['beenverified', 'spokeo', 'whitepages']);
    expect(groups.map((g) => g.kind)).toEqual(['people-search', 'marketing', 'risk-identity', 'financial', 'ad-network', '']);
  });

  it('unclassified brokers group last as Not yet classified', () => {
    const groups = groupsFor(map, fresh());
    const last = groups[groups.length - 1];
    expect(last).toMatchObject({ kind: '', label: 'Not yet classified' });
    expect(last.rows.length).toBeGreaterThan(500);
    expect(groups.find((g) => g.kind === 'people-search')).toBeTruthy();
    // Every row on the real map is reachable: never a buyer, never `none`.
    const byId = new Map(map.brokers.map((b) => [b.id, b]));
    for (const id of rowIds(groups)) {
      expect(byId.get(id).kind ?? []).not.toContain('buyer');
      expect(byId.get(id).optOut?.method).not.toBe('none');
    }
  });

  it('filtering to nothing says so', () => {
    const groups = groupsFor(mini, fresh());
    expect(filterBigCheck(groups, '')).toBe(groups);
    expect(rowIds(filterBigCheck(groups, 'TAIL'))).toEqual(['tail-1', 'tail-2']);
    expect(filterBigCheck(groups, 'zzz-nothing')).toEqual([]);
    const html = render(fresh(), mini, { query: 'zzz-nothing' });
    expect(html).toMatch(/<p class="big-check-empty"[^>]*>No brokers match<\/p>/);
    expect(html).not.toMatch(/<p class="big-check-empty"[^>]*hidden/);
    // With rows, the line is there for the in-place filter but hidden.
    expect(render(fresh())).toMatch(/<p class="big-check-empty"[^>]*hidden[^>]*>No brokers match/);
    expect(render(fresh())).toContain('<input type="search" data-big-check-filter');
  });

  it('Big Check ticks count for nothing but the map', () => {
    const base = { ...fresh(), missions: { [WF]: { status: 'completed', optout_result: 'all-submitted', completedAt: '2026-10-01T12:00:00.000Z' } } };
    let ticked = base;
    for (const b of map.brokers) ticked = setBigCheck(ticked, b.id, true, T);
    for (const d of DISTRICTS) expect(calcDistrictProgress(ticked, d.id), d.id).toEqual(calcDistrictProgress(base, d.id));
    expect(calcIntegrity(ticked)).toBe(calcIntegrity(base));
    expect(JSON.stringify(restoreEvents(ticked))).toBe(JSON.stringify(restoreEvents(base)));
  });

  it('the Big Check screen links nowhere but missions, the map and verified opt-outs', () => {
    const byId = new Map(map.brokers.map((b) => [b.id, b]));
    const verified = new Set(map.brokers.filter((b) => b.optOut?.status === 'verified' && b.optOut.method !== 'none').map((b) => b.optOut.url));
    const missionIds = new Set(MISSIONS.map((m) => m.id));
    const s = { ...fresh(), missions: { [WF]: { status: 'completed', completedAt: '2026-10-01T12:00:00.000Z' } } };
    const html = root(render(s, map));
    const links = hrefs(html);
    expect(links).toContain('#/reclamation/map');
    for (const h of links) {
      if (h === '#/reclamation/map') continue;
      const m = h.match(/^#\/mission\/([^/]+)\/(briefing|recheck)$/);
      if (m) { expect(missionIds.has(m[1]), h).toBe(true); continue; }
      expect(verified.has(h), h).toBe(true);
    }
    expect(byId.size).toBeGreaterThan(0);
    // Nothing per-broker in an id, name or title attribute.
    expect(html).not.toMatch(/\s(?:id|name|title)="/);
  });

  it('a row in a completed mission links its re-check', () => {
    const s = { ...fresh(), missions: { [WF]: { status: 'completed', completedAt: '2026-10-01T12:00:00.000Z' } } };
    const html = render(s);
    expect(html).toContain(`href="#/mission/${WF}/recheck"`);
    expect(html).toMatch(new RegExp(`href="#/mission/${WF}/recheck"[^>]*>RE-CHECK<`));
    expect(html).not.toContain(`href="#/mission/${WF}/briefing"`);
  });

  it('every group starts closed', () => {
    const html = render(fresh(), map);
    expect(html).toContain('<details');
    expect(html).not.toMatch(/<details[^>]*\sopen/);
    expect(summaries(html).find((t) => t.startsWith('Not yet classified'))).toMatch(/^Not yet classified · 0\/\d+$/);
  });

  it('the screen keeps to a phone: no wide fixed widths, no nowrap, 44px targets', () => {
    const html = render(fresh(), map);
    for (const mm of html.matchAll(/(?:min-)?width:\s*(\d{3,4})px/g)) {
      if (Number(mm[1]) > 360) expect(html.slice(Math.max(0, mm.index - 4), mm.index)).toMatch(/max-/);
    }
    expect(html).not.toMatch(/white-space:\s*nowrap/);
    expect(html).toContain('<div class="big-check">');
    expect(html).toContain('THE BIG CHECK');
    expect(html).toContain("Optional. It never counts toward your districts, your city lights or the city's totals.");
    expect(html).toMatch(/\.big-check-tick\{[^}]*min-height:44px/);
  });

  it('loading and error states match the map\'s', () => {
    expect(renderBigCheck(fresh(), { status: 'loading' })).toContain('constellation--loading');
    expect(renderBigCheck(fresh(), { status: 'error' })).toContain('data-action="retry-broker-data"');
  });

  it('Big Check breadcrumbs never leave the device', () => {
    expect(isPrivateBreadcrumb({ category: 'ui.input', message: 'div.big-check > details > label > input[type="checkbox"]' })).toBe(true);
    expect(isPrivateBreadcrumb({ category: 'ui.input', message: 'div.big-check > input[type="search"]' })).toBe(true);
  });

  it('a long-tail card has the tick box; a mission broker\'s card does not', () => {
    const l = brokerLighting(mini, fresh(), T);
    expect(starCard(mini, l, 'tail-1', fresh())).toContain('data-big-check="tail-1"');
    expect(starCard(mini, l, 'tail-1', fresh())).toContain('I filed with them');
    expect(starCard(mini, l, 'spokeo', fresh())).not.toContain('data-big-check');
    expect(starCard(mini, l, 'us-ice', fresh())).not.toContain('data-big-check');
    expect(starCard(mini, l, 'nope', fresh())).not.toContain('data-big-check');
    const s = setBigCheck(fresh(), 'tail-1', true, T);
    expect(starCard(mini, brokerLighting(mini, s, T), 'tail-1', s)).toMatch(/data-big-check="tail-1"[^>]*checked/);
  });

  it('the map links to the Big Check, and so do its no-mission rows', () => {
    const html = renderBrokerMap(fresh(), { status: 'ready', data: { map, layout }, today: T });
    expect(html).toMatch(/<a [^>]*href="#\/reclamation\/big-check"[^>]*>THE BIG CHECK →<\/a>/);
    const left = html.slice(html.indexOf('map-whats-left'));
    expect(left).toMatch(/href="#\/reclamation\/big-check"[^>]*>[^<]*· reach/);
    expect(left).toContain('No mission covers this one yet: file with them, then tick it in the Big Check');
  });

  it('a tick on the map keeps the star card sheet scrolled where it was', () => {
    const src = readFileSync('src/app.js', 'utf8');
    const i = src.indexOf('function bigCheckChange');
    const body = src.slice(i, src.indexOf('\n}\n', i));
    const save = body.indexOf(".star-card')?.scrollTop");
    const draw = body.indexOf('renderCurrentRoute()', save);
    const restore = body.indexOf('card.scrollTop = scrollTop', draw);
    const focus = body.indexOf('.focus(', restore);
    expect(save).toBeGreaterThan(-1);
    expect(draw).toBeGreaterThan(save);
    expect(restore).toBeGreaterThan(draw);
    expect(focus).toBeGreaterThan(restore);
  });

  it('"In a mission:" always puts its link on a line of its own', () => {
    const done = { ...fresh(), missions: { [WF]: { status: 'completed', completedAt: '2026-10-01T12:00:00.000Z' } } };
    for (const s of [fresh(), done]) {
      const lines = [...render(s).matchAll(/<div class="big-check-mission">In a mission:<div class="big-check-mission-go">([\s\S]*?)<\/div><\/div>/g)];
      expect(lines.length).toBeGreaterThan(0);
      for (const [, go] of lines) expect(go).toMatch(/<a href="#\/mission\/[^"]+\/(briefing|recheck)">/);
    }
    expect(render(fresh())).toMatch(/\.big-check-mission-go\{[^}]*min-height:44px/);
  });

  it('the tick wiring stays in memory and never tracks', () => {
    const src = readFileSync('src/app.js', 'utf8');
    const i = src.indexOf('function bigCheckChange');
    expect(i).toBeGreaterThan(-1);
    const body = src.slice(i, src.indexOf('\n}\n', i));
    expect(body).toContain('setBigCheck(state,');
    expect(body).toContain('localDay()');
    expect(body).not.toMatch(/\btrack\(|navigate\(/);
    for (const f of ['src/utils/big-check.js', 'src/screens/big-check.js']) {
      expect(readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '')).not.toMatch(/import[^;]*analytics|\btrack\(/);
    }
  });
});

// Final whole-branch review (final-review.md): I1, M1, M2, M5, M7.
describe('final review fixes', () => {
  const EQ = 'credit_freeze-fortify-equifax';
  const dropYes = () => ({ ...fresh(), brokerFiled: { [STRAG]: { lines: { drop: T } } }, caResident: 'yes' });

  it('I1: a card offers no unticked box on a star lit by something else; a ticked one still shows', () => {
    const s = dropYes();
    const l = brokerLighting(mini, s, T);
    expect(l.stars['tail-1'].via).toContain('drop');
    expect(starCard(mini, l, 'tail-1', s)).not.toContain('data-big-check');
    const t = setBigCheck(s, 'tail-1', true, T);
    expect(starCard(mini, brokerLighting(mini, t, T), 'tail-1', t)).toMatch(/data-big-check="tail-1"[^>]*checked/);
    // The real map: a DROP-lit, mission-less CA broker.
    const ml = brokerLighting(map, s, T);
    const id = map.brokers.find((b) => ml.stars[b.id]?.via?.includes('drop') && !(b.missions ?? []).length && b.optOut?.method !== 'none').id;
    expect(starCard(map, ml, id, s)).not.toContain('data-big-check');
  });

  it('M1: a group counts only the rows it can tick', () => {
    const html = render(setBigCheck(fresh(), 'tail-1', true, T));
    expect(summaries(html)).toContain('Not yet classified · 1/2');
    // People search is all mission rows in the mini map: nothing to tick, so no count.
    expect(summaries(html)).toContain('People search');
    expect(summaries(html).find((t) => t.startsWith('Risk and identity'))).toBe('Risk and identity · 0/1');
    // A stale tick on a mission row doesn't count either.
    const stale = render(setBigCheck(fresh(), 'whitepages', true, T));
    expect(summaries(stale)).toContain('People search');
    expect(stale).toMatch(/<li class="big-check-row big-check-row-mission">/);
  });

  it('M1: the live count only counts tickable rows', () => {
    const src = readFileSync('src/app.js', 'utf8');
    const i = src.indexOf('function bigCheckChange');
    const body = src.slice(i, src.indexOf('\n}\n', i));
    expect(body).toContain('.big-check-row:not(.big-check-row-mission) [data-big-check]:checked');
  });

  it('M2: a ticked broker now in a mission shows its checked box beside the mission link', () => {
    const s = setBigCheck(fresh(), 'whitepages', true, '2026-10-01');
    const html = render(s);
    const row = html.slice(html.indexOf('<p class="big-check-name">whitepages'));
    const li = row.slice(0, row.indexOf('</li>'));
    expect(li).toContain(`href="#/mission/${WF}/briefing"`);
    expect(li).toMatch(/data-big-check="whitepages"[^>]*checked/);
    expect(render(fresh())).not.toContain('data-big-check="whitepages"');
    const card = starCard(mini, brokerLighting(mini, s, T), 'whitepages', s);
    expect(card).toContain(`href="#/mission/${WF}/briefing"`);
    expect(card).toMatch(/data-big-check="whitepages"[^>]*checked/);
    expect(starCard(mini, brokerLighting(mini, fresh(), T), 'whitepages', fresh())).not.toContain('data-big-check');
  });

  it('M5: a frozen star\'s tick says a freeze isn\'t an opt-out', () => {
    const NOTE = "A freeze isn't an opt-out: tick this only if you used their opt-out.";
    const s = { ...fresh(), missions: { [EQ]: { status: 'completed', freeze_status: 'now-frozen' } } };
    const l = brokerLighting(mini, s, T);
    expect(l.frozen).toContain('equifax-information-services');
    const card = starCard(mini, l, 'equifax-information-services', s);
    expect(card).toContain('data-big-check="equifax-information-services"');
    expect(card).toContain(NOTE);
    const html = render(s);
    const row = html.slice(html.indexOf('<p class="big-check-name">equifax-information-services'));
    expect(row.slice(0, row.indexOf('</li>'))).toContain(NOTE);
    // Not frozen: no note.
    expect(render(fresh())).not.toContain(NOTE);
    expect(starCard(mini, brokerLighting(mini, fresh(), T), 'equifax-information-services', fresh())).not.toContain(NOTE);
  });

  it('M7: each tick names its broker in visually hidden text, never in an attribute', () => {
    const html = render(fresh());
    expect(html).toMatch(/data-big-check="tail-1"[^>]*> I filed with them<span class="vh"> \(tail-1\)<\/span><\/label>/);
    expect(html).not.toMatch(/aria-label="[^"]*tail-1/);
    expect(html).toMatch(/\.vh\{[^}]*position:absolute/);
    const odd = { ...mini, brokers: mini.brokers.map((b) => (b.id === 'tail-1' ? { ...b, name: 'A<b>&"Co' } : b)) };
    expect(render(fresh(), odd)).toContain('<span class="vh"> (A&lt;b&gt;&amp;&quot;Co)</span>');
    const card = starCard(mini, brokerLighting(mini, fresh(), T), 'tail-1', fresh());
    expect(card).toContain('<span class="vh"> (tail-1)</span>');
    expect(renderBrokerMap(fresh(), { status: 'ready', data: { map, layout }, today: T })).toMatch(/\.vh\{[^}]*position:absolute/);
  });

  it('M6: the filter hides rows inside one animation frame at a time', () => {
    const src = readFileSync('src/app.js', 'utf8');
    const i = src.indexOf('function bigCheckFilter');
    const body = src.slice(i, src.indexOf('\n}\n', i));
    expect(body).toContain('requestAnimationFrame(');
    expect(body).toMatch(/if \(filterFrame\) return/);
  });
});
