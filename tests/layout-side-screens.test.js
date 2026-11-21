// The side screens' layout audit (Liz 2026-11-20: "go screen by screen and question the layout
// again, look at it from the simple perspective, and the advanced perspective").
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialState } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { renderPrism } from '../src/screens/prism.js';
import { renderGhostDone, renderGhostEarly } from '../src/screens/ghost.js';
import { GHOST_DIALOGUE } from '../src/data/dialogue.js';
import { GHOST_KEY } from '../src/utils/ghost.js';
import { renderStats, DISTRICTS_BY_CHAPTER } from '../src/screens/stats.js';
import { nextUp, simpleTitle } from '../src/screens/next.js';
import { DISTRICTS } from '../src/data/districts.js';
import { renderGovernment } from '../src/screens/government.js';
import { renderLeak, leakOrigin } from '../src/screens/leak.js';
import { renderGarage, renderAddForm, renderVehicleCard } from '../src/screens/garage.js';
import { renderTimeline } from '../src/screens/timeline.js';
import { renderCityTogether, nextBreachCheck } from '../src/screens/city-together.js';
import { LADDER_CSS } from '../src/components/sky-ladder.js';
import { renderBigCheck, unconfirmedPage } from '../src/screens/big-check.js';
import { bigCheckGroups } from '../src/utils/big-check.js';
import { brokerLighting } from '../src/utils/broker-lighting.js';
import { setBigCheck } from '../src/utils/broker-state.js';
import { renderSaints } from '../src/screens/saints.js';
import { textOf } from './helpers/on-page.mjs';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

const noStyle = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaries = (html) => (noStyle(html).match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
const fresh = (level = 'simplest') => setReadLevel(createInitialState(), level);

describe('PRISM', () => {
  it('its filled buttons have dark words: the cyan link colour no longer wins (it was 1.1:1 on lime)', () => {
    const html = renderPrism(fresh('full'));
    const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
    // .prism-panel a (0,1,1) beat .prism-go (0,1,0): the fix is a rule at least as specific.
    expect(css).toMatch(/\.prism-panel \.prism-go\{color:#090B10\}/);
    expect(css).toMatch(/\.prism-panel a\.btn-primary\{[^}]*color:#090B10/);
    expect(css.indexOf('.prism-panel .prism-go{')).toBeGreaterThan(css.indexOf('.prism-panel a{'));
  });

  it('WHAT YOU CAN DO is the one bright button, in both modes', () => {
    for (const level of ['simplest', 'full']) {
      const html = renderPrism(fresh(level));
      expect(primaries(html), level).toBe(1);
      expect(html).toMatch(/WHAT YOU CAN DO<\/div><p>[^<]*<\/p><a class="btn-primary" href="https:\/\/prism-break\.org/);
    }
  });

  it('Advanced: WHAT YOU CAN DO sits right under the companies; Simple: picture, one line, then what to do', () => {
    const adv = renderPrism(fresh('full'));
    const slides = adv.indexOf('WHO WAS ON THE SLIDES');
    const defend = adv.indexOf('WHAT YOU CAN DO');
    expect(slides).toBeGreaterThan(-1);
    expect(defend).toBeGreaterThan(slides);
    expect(defend).toBeLessThan(adv.indexOf('WHAT IT WAS'));
    const simple = renderPrism(fresh('simplest'));
    const order = ['class="prism-diagram"', 'data-prism-yours', 'WHAT YOU CAN DO', 'WHO WAS ON THE SLIDES'].map((k) => simple.indexOf(k));
    expect(order.every((v) => v > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(textOf(simple)).toMatch(/\d of your companies (was|were) on the slides\./);
  });

  it('the key is true before the player changes their list (defaults show "· yours")', () => {
    const text = textOf(renderPrism(fresh('full')));
    expect(text).not.toContain('you told the city');
    expect(text).toContain('a company that runs accounts on your list');
  });

  it('a name under the cables is listed once (Reddit is an account in two districts)', () => {
    const s = fresh('full');
    s.accounts.reddit = { ...s.accounts.reddit, enabled: true };
    s.accounts.ai_reddit = { ...s.accounts.ai_reddit, enabled: true };
    const html = renderPrism(s);
    const cables = html.slice(html.indexOf('EVERYTHING ELSE: THE CABLES'), html.indexOf('STILL RUNNING'));
    expect((cables.match(/Reddit/g) || []).length).toBe(1);
    expect(cables).not.toContain('dashed');
  });
});

describe('Ghost', () => {
  const ghost = (early) => localStorage.setItem(GHOST_KEY, JSON.stringify({ at: '2026-11-20T10:00:00Z', silent: false, early, nonce: 'n' }));

  it('an early ghost gets doneEarly, which never says the brokers have stopped', () => {
    ghost(true);
    const html = renderGhostDone(fresh(), {});
    expect(html.replaceAll('&#39;', "'")).toContain(GHOST_DIALOGUE.doneEarly);
    expect(html).not.toContain('Not the brokers');
    expect(GHOST_DIALOGUE.doneEarly).not.toMatch(/city's yours|no more watchers/i);
    expect(GHOST_DIALOGUE.doneEarly).toMatch(/brokers are still/);
  });

  it('a ghost after the whole city keeps the endgame line', () => {
    ghost(false);
    expect(renderGhostDone(fresh(), {}).replaceAll('&#39;', "'")).toContain(GHOST_DIALOGUE.done);
  });

  it('#/ghost/early: three off-white lines above GO GHOST NOW, one saying it can\'t be undone', () => {
    const html = renderGhostEarly(fresh(), {});
    const list = html.match(/<ul data-ghost-early-what style="([^"]*)">([\s\S]*?)<\/ul>/);
    expect(list).toBeTruthy();
    expect(list[1]).toContain('color: var(--offwhite)');
    expect((list[2].match(/<li/g) || []).length).toBe(3);
    expect(list[2]).toContain("You can't undo this");
    expect(html.indexOf('data-ghost-early-what')).toBeLessThan(html.indexOf('GO GHOST NOW'));
  });

  it('what our analytics can see reads off-white, not grey', () => {
    const src = readFileSync(new URL('../src/screens/stats.js', import.meta.url), 'utf8');
    expect(src).toMatch(/const WHOAMI_TEXT = '[^']*color: var\(--offwhite\)/);
  });
});

describe('Your City (stats)', () => {
  it('districts are in chapter order, and no two share a chapter', () => {
    const chapters = DISTRICTS.map((d) => d.chapter);
    expect(new Set(chapters).size).toBe(chapters.length);
    const html = renderStats(fresh('full'));
    const shown = [...html.matchAll(/data-district-row="([^"]+)"/g)].map((m) => m[1]);
    expect(shown).toEqual(DISTRICTS_BY_CHAPTER.map((d) => d.id));
    const nums = shown.map((id) => DISTRICTS.find((d) => d.id === id).chapter);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
  });

  it('chapters run in the order missions are played: Foundry before Grid', () => {
    const ch = Object.fromEntries(DISTRICTS.map((d) => [d.id, d.chapter]));
    expect([ch.reclamation, ch.freeway, ch.foundry, ch.grid, ch.clinic, ch.trail, ch.field]).toEqual([8, 9, 10, 11, 12, 13, 14]);
  });

  it('one bright button: the same next mission as What\'s next', () => {
    for (const level of ['simplest', 'full']) {
      const s = fresh(level);
      const html = renderStats(s);
      const up = nextUp(s);
      expect(primaries(html), level).toBe(1);
      expect(html).toContain(`data-stats-next href="#/mission/${up.mission.id}/briefing"`);
      expect(textOf(html)).toContain(`Next: ${simpleTitle(up.mission)}`);
    }
  });

  it('the Freeway says how it opens and goes to the Garage; rows are 44px with a ›', () => {
    const html = renderStats(fresh('full'));
    expect(html).toMatch(/<a href="#\/garage" data-district-row="freeway"/);
    expect(textOf(html)).toContain('ADD A CAR IN THE GARAGE TO OPEN IT');
    const rows = noStyle(html).match(/<a href="[^"]*" data-district-row="[^"]+" style="[^"]*"/g);
    expect(rows).toHaveLength(DISTRICTS.length);
    for (const r of rows) expect(r).toContain('min-height: 44px');
    expect((html.match(/&rsaquo;<\/span>/g) || []).length).toBe(DISTRICTS.length);
  });

  it('Simple says two-step sign-in; a new player is told how exposure goes down', () => {
    const simple = textOf(renderStats(fresh('simplest')));
    expect(simple).toContain('TWO-STEP SIGN-IN ON');
    expect(simple).not.toContain('2FA ENABLED');
    expect(simple).toContain('goes down as you finish missions');
    const s = fresh('full');
    s.missions = { 'gmail-recon-breach': { status: 'completed' } };
    expect(renderStats(s)).not.toContain('data-exposure-note');
  });
});

describe('Who gets your data, and a badge\'s page', () => {
  const data = { entries: [], channels: [], agencies: [], programs: [], paperwork: [{ myth: 'm', reality: 'r', sources: [] }], origins: [], pipes: [] };

  it('the government map has a way back to the city, and names whose work the myth does', () => {
    let html;
    try { html = renderGovernment(fresh('full'), data); } catch { html = null; }
    const src = readFileSync(new URL('../src/screens/government.js', import.meta.url), 'utf8');
    expect(src).toContain('<a class="back-link" href="#/city">← THE CITY</a>');
    expect(src).toContain("The myth does the agencies' work for them.");
    if (html) expect(html).toContain('href="#/city"');
  });

  it('a badge page remembers where it was opened from', () => {
    const building = { screen: 'building', params: { id: 'gmail' } };
    const leak = { screen: 'leak', params: { id: 'muscular' } };
    const from = leakOrigin(leak, building, null);
    expect(from).toEqual({ screen: 'building', id: 'gmail' });
    // Kept while the page re-draws; gone on leaving.
    expect(leakOrigin(leak, leak, from)).toEqual(from);
    expect(leakOrigin({ screen: 'city', params: {} }, leak, from)).toBe(null);
    const html = renderLeak(fresh('full'), { id: 'x', title: 'T', summary: 's', sources: [] }, { from });
    expect(html).toMatch(/<a class="back-link" data-leak-back href="#\/building\/gmail">← GMAIL<\/a>/);
    // The government map and PRISM stay, after it.
    expect(html.indexOf('data-leak-back')).toBeLessThan(html.indexOf('href="#/government"'));
    expect(html).toContain('href="#/prism"');
    // From PRISM, back goes to PRISM.
    expect(renderLeak(fresh('full'), { id: 'x', title: 'T', summary: 's', sources: [] }, { from: { screen: 'prism', id: null } })).toMatch(/data-leak-back href="#\/prism">← PRISM/);
    // Opened cold: back to the government map, as before.
    expect(renderLeak(fresh('full'), { id: 'x', title: 'T', summary: 's', sources: [] })).toMatch(/data-leak-back href="#\/government">← WHO GETS YOUR DATA/);
  });

  it('app.js keeps the origin in memory on every draw', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app).toContain('leakFrom = leakOrigin(route, lastRoute, leakFrom);');
    expect(app).toContain('renderLeak(state, leakById(id), { from: leakFrom })');
  });
});

describe('Garage', () => {
  const car = { make: 'Toyota', model: 'Camry', year: '2019', nickname: '', addedAt: '2026-11-01T00:00:00Z' };

  it('the form: real buttons, readable labels, an example year', () => {
    const html = renderAddForm();
    expect(html).toMatch(/<button type="button" class="btn-primary" data-action="add-vehicle"[^>]*>ADD TO GARAGE<\/button>/);
    expect(html).toMatch(/<button type="button" class="btn-secondary" data-action="cancel-add-vehicle"[^>]*>CANCEL<\/button>/);
    expect(html).not.toMatch(/<span data-action=/);
    expect(html).toContain('placeholder="e.g. 2019"');
    expect(html).not.toContain('placeholder="2024"');
    for (const [id, word] of [['vehicle-make', 'Make'], ['vehicle-model', 'Model'], ['vehicle-year', 'Year'], ['vehicle-nickname', 'Nickname']]) {
      expect(html).toMatch(new RegExp(`<label for="${id}" style="font-size: 13px;[^"]*color: var\\(--offwhite\\)[^"]*">${word}`));
    }
    expect(html).not.toContain('font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5)');
    // One column on a phone: the model's example isn't cut off.
    expect(html).toContain('grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))');
  });

  it('REMOVE is a button that asks on the card first, never a browser dialog', () => {
    const s = fresh();
    s.vehicles = [car];
    const html = renderGarage(s);
    expect(html).toMatch(/<button type="button" class="btn-secondary" data-action="remove-vehicle-ask" data-index="0"[^>]*>REMOVE<\/button>/);
    expect(html).not.toContain('data-action="remove-vehicle"');
    const asking = renderGarage(s, { confirmRemove: 0 });
    expect(asking).toContain('data-remove-confirm');
    expect(asking).toMatch(/<button type="button" class="btn-secondary" data-action="remove-vehicle" data-index="0"[^>]*>YES, REMOVE IT<\/button>/);
    expect(asking).toContain('data-action="remove-vehicle-keep"');
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    const handler = app.slice(app.indexOf("action === 'remove-vehicle-ask'"), app.indexOf("action === 'edit-social-profile'"));
    expect(handler).not.toMatch(/confirm\(/);
  });

  it('IN PROGRESS is a bar that fills: "0 of 3 opt-outs"', () => {
    const html = renderVehicleCard(fresh(), car, 0);
    expect(textOf(html)).not.toContain('IN PROGRESS');
    expect(textOf(html)).toContain('0 of 3 opt-outs');
    expect(html).toMatch(/class="fill-bar[^"]*"[^>]*aria-valuemax="3" aria-valuenow="0"/);
  });

  it('the ADD VEHICLE card hides while the form is open', () => {
    expect(renderGarage(fresh())).toContain('data-add-vehicle-card');
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    const open = app.slice(app.indexOf("action === 'show-add-vehicle'"), app.indexOf("action === 'add-vehicle'"));
    expect(open).toMatch(/\[data-add-vehicle-card\][\s\S]*display = 'none'/);
    expect(open).toMatch(/cancel-add-vehicle[\s\S]*display = 'flex'/);
  });
});

describe('Social timeline', () => {
  it('SET UP is a real button, the first one is the bright one, and a bar says how many are set up', () => {
    const s = fresh();
    const html = renderTimeline(s);
    const setUps = noStyle(html).match(/<button type="button" class="[^"]*" data-action="edit-social-profile"[^>]*>SET UP<\/button>/g) || [];
    expect(setUps.length).toBeGreaterThan(1);
    expect(setUps[0]).toContain('class="btn-primary"');
    for (const b of setUps.slice(1)) expect(b).toContain('class="btn-secondary"');
    for (const b of setUps) expect(b).toContain('min-height: 44px');
    expect(primaries(html)).toBe(1);
    expect(html).toContain('data-timeline-progress');
    expect(textOf(html)).toMatch(/0 of \d set up/);
  });
});

describe('the sky ladder on a phone', () => {
  it('is solid, like the star card, and the quiz\'s title isn\'t said twice', () => {
    expect(LADDER_CSS).toMatch(/\.sky-ladder\{[^}]*background:#11151F/);
    expect(LADDER_CSS).toMatch(/\.sky-ladder-body \.residency \.label\{display:none\}/);
  });

  it('the archived source links and DROP\'s "File it" are 44px tap targets', () => {
    const src = readFileSync(new URL('../src/screens/broker-map.js', import.meta.url), 'utf8');
    expect(src).toMatch(/\.star-card-src a,[^{]*\.map-drop a\{display:inline-flex;align-items:center;min-height:44px;min-width:44px\}/);
  });
});

describe('The Whole City', () => {
  const DATA = { k: 50, asOf: '2026-11-19T04:00:00Z', city: { players: 100, fortified: { pct: 18 } }, pods: [{ id: 'a', label: 'Chicago', players: 60, fortified: { pct: 22 } }] };

  it('Your part is under the ring, and its breach check is the one bright button', () => {
    const s = fresh();
    const html = renderCityTogether(s, { collective: { status: 'ready', data: DATA } });
    expect(primaries(html)).toBe(1);
    const m = nextBreachCheck(s);
    expect(html).toMatch(new RegExp(`class="btn-primary" data-your-part-go href="#/mission/${m.id}/briefing"`));
    expect(html.indexOf('CITY FORTIFIED')).toBeLessThan(html.indexOf('data-your-part'));
    expect(html.indexOf('data-your-part')).toBeLessThan(html.indexOf('PLACES'));
    // What we know about you is a way to Your City, not the next thing: outlined.
    expect(html).toMatch(/class="btn-secondary scout-action" href="#\/stats"/);
  });

  it('place names are words, not cyan (they aren\'t links)', () => {
    const html = renderCityTogether(fresh(), { collective: { status: 'ready', data: DATA } });
    const row = html.match(/letter-spacing: 1px; color: ([^;]+);">Chicago</);
    expect(row[1]).toBe('var(--offwhite)');
  });
});

describe('The Big Check', () => {
  const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
  const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
  const render = (s) => renderBigCheck(s, { status: 'ready', data: { map, layout }, today: '2026-11-20' });
  const rowOf = (html, name) => (html.match(new RegExp(`<li class="big-check-row[^"]*"><p class="big-check-name">${name}</p>[\\s\\S]*?</li>`)) || [])[0];

  it('a broker whose opt-out page we couldn\'t confirm says so, and offers no "I filed with them"', () => {
    const s = fresh('full');
    const groups = bigCheckGroups(map, brokerLighting(map, s, '2026-11-20'));
    const byId = new Map(map.brokers.map((b) => [b.id, b]));
    const row = groups.flatMap((g) => g.rows).find((r) => !r.mission && unconfirmedPage(byId.get(r.id)));
    expect(row).toBeTruthy();
    const html = render(s);
    const li = rowOf(html, row.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '&amp;'));
    expect(li).toContain('No working opt-out page right now.');
    expect(li).not.toContain('I filed with them');
    // A tick already saved keeps its box, so it can be unticked.
    const ticked = setBigCheck(s, row.id, true, '2026-11-20');
    const li2 = rowOf(render(ticked), row.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '&amp;'));
    expect(li2).toContain('I filed with them');
    expect(li2).toContain('checked');
  });

  it('the title is neutral until something is ticked, then lime', () => {
    const s = fresh('full');
    expect(render(s)).toContain('class="big-check-head big-check-head--none"');
    const groups = bigCheckGroups(map, brokerLighting(map, s, '2026-11-20'));
    const id = groups.flatMap((g) => g.rows).find((r) => !r.mission).id;
    expect(render(setBigCheck(s, id, true, '2026-11-20'))).toContain('class="big-check-head">');
  });
});

describe('The saints deck', () => {
  it('dots, not initials; the names stay in the labels; "1 of 9"; 44px tall targets', () => {
    const html = renderSaints(fresh());
    expect(html).not.toMatch(/<span aria-hidden="true">[A-Z]{2,3}<\/span>/);
    expect((html.match(/<span class="deck-dot-mark" aria-hidden="true"><\/span>/g) || []).length).toBe(9);
    expect(html).toMatch(/class="deck-dot deck-dot--named[^"]*" data-deck-to="0" aria-label="Saint Aaron Swartz"/);
    expect(html).toContain('1 of 9');
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.deck-dot--named \{[^}]*flex: 0 1 44px;[^}]*min-height: 44px/);
  });
});
