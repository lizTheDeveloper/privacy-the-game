import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderBrokerMap } from '../../src/screens/broker-map.js';
import { renderBigCheck } from '../../src/screens/big-check.js';
import { BROKER_MAP_DIALOGUE } from '../../src/data/dialogue.js';
import { setReadLevel } from '../../src/utils/reading.js';
import { createInitialState } from '../../src/state.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const mini = JSON.parse(readFileSync('tests/fixtures/broker-map-mini.json', 'utf8'));
const T = '2026-10-23';
const NO_MISSION = 'No mission covers this one yet: file with them, then tick it in the Big Check';
const NOTE = "Optional. It never counts toward your districts, your city lights or the city's totals.";

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const count = (s, sub) => s.split(sub).length - 1;

describe('the broker map says it once', () => {
  const html = renderBrokerMap(setReadLevel(createInitialState(), 'full'), { status: 'ready', data: { map, layout }, today: T });

  it('the legend sits behind a KEY tap on phones and shows open from 900px', () => {
    expect(html).toMatch(/<details class="map-key" data-open-desktop><summary>KEY<\/summary><ul class="map-legend">/);
    // Closed in the markup; app.js opens it from 900px (applyOpenDesktop).
    expect(html).not.toMatch(/<details class="map-key"[^>]*\sopen/);
    for (const t of ['You filed', 'Re-check due', 'No opt-out exists', 'Not yet', 'Buyers']) expect(html).toContain(t);
  });

  it("What's left says the no-mission sentence once, above the list", () => {
    const left = html.slice(html.indexOf('class="map-panel map-whats-left"'));
    const rows = left.slice(left.indexOf('<ul class="map-left">'), left.indexOf('</ul>'));
    expect(count(rows, '<li>')).toBeGreaterThan(1);
    expect(count(html, NO_MISSION)).toBe(1);
    expect(left.indexOf(NO_MISSION)).toBeLessThan(left.indexOf('<ul class="map-left">'));
    // Each row it applies to still says so, with a mark that points at the sentence.
    const marked = count(rows, 'class="none-mark"');
    // A no-mission row opens the broker's own form (new tab) when we have one, else the Big Check.
    const bigCheckRows = count(rows, 'href="#/reclamation/big-check"') + count(rows, 'target="_blank"');
    expect(marked).toBe(bigCheckRows);
    // Every visual * is hidden from screen readers; the rows say "(no mission yet)" in words.
    const stars = [...left.matchAll(/<span class="none-mark"([^>]*)>\*<\/span>/g)];
    expect(stars.length).toBe(marked + 1);
    for (const m of stars) expect(m[1]).toContain('aria-hidden="true"');
    expect(count(rows, '<span class="sr-only"> (no mission yet)</span>')).toBe(marked);
  });
});

describe('the Big Check says it once', () => {
  const render = (extra) => renderBigCheck(createInitialState(), { status: 'ready', data: { map: mini, layout }, today: T, ...extra });

  it("with Scout's first-visit line showing, the header note is dropped", () => {
    expect(BROKER_MAP_DIALOGUE.bigCheck).toContain('never counts toward your districts');
    const html = render({ scoutLine: BROKER_MAP_DIALOGUE.bigCheck });
    expect(html).not.toContain(NOTE);
    expect(html).toContain("never counts toward your districts, your city lights or the city's totals");
  });

  it('without Scout, the note stays', () => {
    expect(render({})).toContain(NOTE);
  });
});
