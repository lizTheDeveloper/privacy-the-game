import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { SATELLITES, satelliteBand, satelliteLines, satDimmed, SAT_BAND } from '../../src/utils/satellites.js';
import { satelliteCard } from '../../src/components/satellite-card.js';
import { constellationSvg } from '../../src/components/constellation.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { setHome } from '../../src/utils/broker-state.js';
import { satelliteView, VIEW_BOUNDS } from '../../src/utils/broker-view.js';
import { renderBrokerMap } from '../../src/screens/broker-map.js';
import { createInitialState } from '../../src/state.js';
import { isPrivateBreadcrumb } from '../../src/utils/errorNoise.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const T = '2026-10-29';
const light = (state) => brokerLighting(map, state, T);
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

describe('government satellites', () => {
  it('exactly the 12 US government buyers', () => {
    const gov = map.brokers.filter((b) => b.id.startsWith('us-') && b.kind.includes('buyer')).map((b) => b.id).sort();
    expect(SATELLITES.map((s) => s.id).sort()).toEqual(gov);
    expect(SATELLITES.map((s) => s.initials)).toEqual(['FBI', 'ICE', 'CBP', 'DEA', 'USMS', 'USSS', 'IRS', 'DCSA', 'ARMY', 'NAVY', 'USAF', 'SOCOM']);
  });

  it('43 lines with the documented counts', () => {
    const lines = satelliteLines(map, light({}));
    const counts = Object.fromEntries(SATELLITES.map((s) => [s.initials, lines[s.id].total]));
    expect(counts).toEqual({ ICE: 7, FBI: 6, USMS: 5, ARMY: 4, CBP: 4, IRS: 4, DEA: 3, NAVY: 3, USAF: 2, DCSA: 2, USSS: 2, SOCOM: 1 });
    expect(Object.values(lines).reduce((t, s) => t + s.total, 0)).toBe(43);
  });

  it('5 lines have no known way out', () => {
    const lines = satelliteLines(map, light({}));
    const noWay = Object.values(lines).flatMap((s) => s.lines.filter((l) => !l.way).map((l) => l.broker.id)).sort();
    expect(noWay).toEqual(['anomaly-six', ...Array(4).fill('thomson-reuters-special-services')]);
  });

  it('a broker with no known way out still cuts its line if the player lights it (Big Check)', () => {
    const lines = satelliteLines(map, light({ bigCheck: { 'anomaly-six': T } }));
    expect(lines['us-socom']).toMatchObject({ cut: 1, cuttable: 1 });
    expect(satDimmed(lines['us-socom'])).toBe(true);
    const ice = lines['us-ice'].lines.find((l) => l.broker.id === 'thomson-reuters-special-services');
    expect(ice).toMatchObject({ way: false, cut: false });
  });

  it('a lit broker cuts its line', () => {
    const lines = satelliteLines(map, light({ bigCheck: { 'clearview-ai': T } }));
    expect(lines['us-army'].lines.find((l) => l.broker.id === 'clearview-ai').cut).toBe(true);
    expect(lines['us-army'].cut).toBe(1);
  });

  it('halos and previews never cut a line', () => {
    const state = setHome({ brokerFiled: {
      'ad_trackers-fortify-bulk': { lines: { daa: T }, since: T },
      'people_search-reclaim-stragglers': { lines: { drop: T }, since: T },
    } }, 'US-TX');
    const lines = satelliteLines(map, light(state));
    expect(Object.values(lines).reduce((t, s) => t + s.cut, 0)).toBe(0);
  });

  it('SOCOM never dims on its own; a satellite with every cuttable line cut does', () => {
    const lines = satelliteLines(map, light({}));
    expect(lines['us-socom'].cuttable).toBe(0);
    expect(satDimmed(lines['us-socom'])).toBe(false);
    const usss = lines['us-usss'];
    const all = Object.fromEntries(usss.lines.filter((l) => l.way).map((l) => [l.broker.id, T]));
    expect(satDimmed(satelliteLines(map, light({ bigCheck: all }))['us-usss'])).toBe(true);
  });

  it('drawn above the field with initials only: no image, no link, no seal, no diamond', () => {
    const svg = constellationSvg({ map, layout, lighting: light({}) });
    expect(svg.match(/class="sat[ "]/g)).toHaveLength(12);
    expect(svg.match(/data-sat="\d+"/g)).toHaveLength(12);
    expect(svg).not.toMatch(/<image|<a |href=|seal/i);
    expect(svg.match(/class="buyer"/g)).toHaveLength(6);
    for (const s of satelliteBand()) expect(s.y).toBeLessThan(0);
    expect(SAT_BAND.top).toBe(VIEW_BOUNDS.top);
  });

  it('the satellite view shows the band', () => {
    const v = satelliteView(0.8);
    expect(v.y).toBeLessThanOrEqual(SAT_BAND.y - 30);
    expect(v.w).toBe(1000);
  });

  it('the card names the buyer, counts the lines, and links each broker by star index', () => {
    const c = satelliteCard(map, layout, light({}), 0);
    expect(c).toContain('Federal Bureau of Investigation is a buyer.');
    expect(c).toContain('0 of 5 lines cut · 1 with no known way out');
    expect(c).toMatch(/data-action="select-star" data-star="\d+"/);
    expect(c).toContain('data-action="close-sat"');
    expect(c).not.toMatch(/data-star="us-/);
    expect(satelliteCard(map, layout, light({}), 11)).toContain('1 line, and no known way out of it');
  });

  it('the screen shows a satellite card in the star card slot, and its clicks stay private', () => {
    const h = renderBrokerMap(createInitialState(), { status: 'ready', data: { map, layout }, today: T, selectedSat: 1 });
    expect(h).toContain('class="star-card satellite-card"');
    expect(h).not.toContain('<section class="sky-ladder');
    for (const m of ['section.star-card.satellite-card > button.satellite-broker', 'button.constellation-zoom'])
      expect(isPrivateBreadcrumb({ category: 'ui.click', message: m })).toBe(true);
  });
});
