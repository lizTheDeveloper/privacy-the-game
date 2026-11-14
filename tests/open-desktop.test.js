import { describe, it, expect, beforeEach } from 'vitest';
import { setReadLevel } from '../src/utils/reading.js';
import { readFileSync } from 'node:fs';
import { applyOpenDesktop, recordHandToggle, desktopFoldKey } from '../src/components/deck.js';
import { renderBrokerMap } from '../src/screens/broker-map.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

// A stand-in <details>: attributes, dataset and open, enough for the helpers.
function fakeDetails(attrs = {}) {
  return {
    open: false,
    dataset: {},
    className: attrs.class ?? '',
    getAttribute: (k) => attrs[k] ?? null,
  };
}
const rootOf = (list) => ({ querySelectorAll: (sel) => (sel === 'details[data-open-desktop]' ? list : []) });

describe('open on desktop, by script', () => {
  it('opens every data-open-desktop details at 900px and up, closes them below', () => {
    const list = [fakeDetails({ class: 'map-key' }), fakeDetails({ class: 'scout-remind' })];
    applyOpenDesktop(rootOf(list), true, new Map());
    expect(list.map((d) => d.open)).toEqual([true, true]);
    applyOpenDesktop(rootOf(list), false, new Map());
    expect(list.map((d) => d.open)).toEqual([false, false]);
  });

  it("under 900px a details the player opened or closed by hand keeps the player's choice", () => {
    const a = fakeDetails({ class: 'saint-story', 'data-fold': 'saint-story-x' });
    const b = fakeDetails({ class: 'map-key' });
    const hand = new Map([[desktopFoldKey(a, 0), false], [desktopFoldKey(b, 1), true]]);
    applyOpenDesktop(rootOf([a, b]), false, hand);
    expect([a.open, b.open]).toEqual([false, true]);
  });

  it('from 900px every one is open, whatever the hand state (its summary is hidden there)', () => {
    const a = fakeDetails({ class: 'saint-story', 'data-fold': 'saint-story-x' });
    const hand = new Map([[desktopFoldKey(a, 0), false]]);
    applyOpenDesktop(rootOf([a]), true, hand);
    expect(a.open).toBe(true);
    expect(hand.get(desktopFoldKey(a, 0))).toBe(false); // kept for the way back under 900px
  });

  it('rotate: closed by hand on a phone, wider open with its content, narrower closed again as the player left it', () => {
    const d = fakeDetails({ class: 'entry-fold', 'data-fold': 'entry-gmail-x' });
    const hand = new Map();
    applyOpenDesktop(rootOf([d]), false, hand);
    d.open = true; recordHandToggle(d, 0, hand); // the player opens it
    d.open = false; recordHandToggle(d, 0, hand); // and closes it again
    expect(d.open).toBe(false);
    applyOpenDesktop(rootOf([d]), true, hand); // rotated to 900px+
    expect(d.open).toBe(true);
    recordHandToggle(d, 0, hand); // the script's own toggle event
    applyOpenDesktop(rootOf([d]), false, hand); // and back
    expect(d.open).toBe(false);
    // One opened by hand stays open through the same trip.
    d.open = true; recordHandToggle(d, 0, hand);
    applyOpenDesktop(rootOf([d]), true, hand);
    recordHandToggle(d, 0, hand);
    applyOpenDesktop(rootOf([d]), false, hand);
    expect(d.open).toBe(true);
  });

  it('a toggle the script made is not a hand toggle; a toggle against it is', () => {
    const d = fakeDetails({ class: 'map-key' });
    const hand = new Map();
    applyOpenDesktop(rootOf([d]), true, hand);
    recordHandToggle(d, 0, hand); // the toggle event from the script's own open
    expect(hand.size).toBe(0);
    d.open = false; // the player closes it
    recordHandToggle(d, 0, hand);
    expect(hand.get(desktopFoldKey(d, 0))).toBe(false);
  });

  it('a fold key is its data-fold, else its class and place', () => {
    expect(desktopFoldKey(fakeDetails({ 'data-fold': 'entry-a-b' }), 3)).toBe('entry-a-b');
    expect(desktopFoldKey(fakeDetails({ class: 'brief-more' }), 2)).toBe('brief-more#2');
  });

  it('every open-on-desktop details carries data-open-desktop', () => {
    const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
    const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
    expect(renderBrokerMap(createInitialState(), { status: 'ready', data: { map, layout } })).toMatch(/<details class="map-key" data-open-desktop>/);
    expect(renderDebrief(createInitialState(), 'gmail-recon-login')).toMatch(/<details class="scout-remind" data-open-desktop>/);
    // "More intel" is the Full intel level's fold (Short and Simplest put the intel under "Why it matters").
    const withMore = MISSIONS.map((m) => renderBriefing(setReadLevel(createInitialState(), 'full'), m.id)).find((h) => h.includes('brief-more'));
    expect(withMore).toMatch(/<details class="brief-more" data-open-desktop>/);
    for (const f of ['src/screens/saints.js', 'src/screens/building.js']) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<details class="(saint-story|entry-fold)"[^>]*>/g)) expect(m[0], f).toContain('data-open-desktop');
    }
  });

  it('nothing relies on ::details-content any more', () => {
    expect(readFileSync('src/style.css', 'utf8')).not.toContain('::details-content');
  });

  it('app.js applies it after every render and on a breakpoint change', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const render = app.indexOf('restoreFolds(app, foldsBefore);');
    expect(app.indexOf('applyOpenDesktop(app', render)).toBeGreaterThan(render);
    expect(app).toMatch(/matchMedia\('\(min-width: 900px\)'\)/);
    expect(app).toMatch(/addEventListener\('change'/);
    expect(app).toMatch(/recordHandToggle\(/);
  });
});
