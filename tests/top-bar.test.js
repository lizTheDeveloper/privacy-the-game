import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderHud, initHudMenu, hudMenuOpen, supportNote, _resetHudMenu } from '../src/components/hud.js';
import { topTools } from '../src/components/top-tools.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { renderNext, nextUp } from '../src/screens/next.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderMilestone } from '../src/screens/milestone.js';
import { renderQuickQuest } from '../src/screens/quick-quest.js';
import { renderStats } from '../src/screens/stats.js';
import { renderPrism } from '../src/screens/prism.js';
import { createInitialState, updateMission, markMissionStarted } from '../src/state.js';
import { setReadLevel, markStep, visibleSteps, stepKey } from '../src/utils/reading.js';
import { textOf } from './helpers/on-page.mjs';

// Liz 2026-11-20: "Do it" — one short top bar, the same on every screen, with everything else
// under More; and on the city, one way forward with the map lower.

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); _resetHudMenu(); });
afterEach(() => vi.unstubAllGlobals());

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const citySrc = readFileSync(new URL('../src/screens/city-map.js', import.meta.url), 'utf8');
const fresh = (level) => setReadLevel(createInitialState(), level);
const FIRST = 'gmail-recon-breach';
const filed = (level) => updateMission(fresh(level), FIRST, { status: 'completed', finding: 'no-breaches' });
const headerOf = (html) => {
  const m = /<header class="hud[^"]*" data-hud>[\s\S]*?<\/header>/.exec(html);
  return m ? m[0] : '';
};
const primaries = (html) => (html.replace(/<style>[\s\S]*?<\/style>/g, '').match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;

const ROUTES = {
  city: (s) => renderCityMap(s),
  next: (s) => renderNext(s),
  district: (s) => renderDistrict(s, 'master-keys'),
  briefing: (s) => renderBriefing(s, FIRST),
  steps: (s) => renderBriefing(markMissionStarted(s, FIRST), FIRST),
  debrief: (s) => renderDebrief(s, FIRST),
  filed: (s) => renderDebrief(updateMission(s, FIRST, { status: 'completed', finding: 'no-breaches' }), FIRST),
  milestone: (s) => renderMilestone(s, 'master-keys'),
  quickquest: (s) => renderQuickQuest(s),
  stats: (s) => renderStats(s),
  prism: (s) => renderPrism(s),
};

// The bar's parts, in order. The way on and Read it to me change by mode and screen; these don't.
const SKELETON = ['class="hud-bar"', 'class="hud-brand"', 'class="hud-way"', 'class="hud-end"', 'data-hud-more aria-expanded="false" aria-controls="hud-menu"',
  'id="hud-menu" data-hud-menu hidden', 'data-level="simplest"', 'data-level="full"', 'data-action="focus-music"', 'data-bug-report',
  'buy.stripe.com', 'patreon.com', 'data-studio-link="hud"'];

describe('one short top bar, the same on every screen', () => {
  for (const level of ['simplest', 'full']) {
    for (const [route, render] of Object.entries(ROUTES)) {
      it(`${level}: ${route} has the bar, its parts in the same order, once`, () => {
        const html = render(fresh(level));
        expect((html.match(/data-hud>/g) || []).length, route).toBe(1);
        const hud = headerOf(html);
        let at = -1;
        for (const part of SKELETON) {
          const i = hud.indexOf(part, at + 1);
          expect(i, `${route}: ${part}`).toBeGreaterThan(at);
          at = i;
        }
        // The bar never adds a bright button.
        expect(primaries(hud), route).toBe(0);
      });
    }
  }

  it('Simple mode hides INTEGRITY / EXPOSURE / STREAK on every screen', () => {
    for (const [route, render] of Object.entries(ROUTES)) {
      const hud = headerOf(render(fresh('simplest')));
      expect(hud, route).not.toMatch(/INTEGRITY|EXPOSURE|STREAK|hud-stats/);
    }
  });

  it('Advanced mode has them in a thin strip under the bar (not pinned), except on a LIBERATED milestone', () => {
    for (const [route, render] of Object.entries(ROUTES)) {
      const hud = headerOf(render(fresh('full')));
      if (route === 'milestone') {
        expect(hud, route).not.toContain('hud-stats');
        continue;
      }
      expect(hud, route).toMatch(/<\/div>\s*<div class="hud-stats">[\s\S]*INTEGRITY[\s\S]*EXPOSURE[\s\S]*STREAK/);
    }
    const strip = /\.hud \.hud-stats \{([^}]*)\}/.exec(css)[1];
    expect(strip).toMatch(/height: 28px/);
    expect(strip).not.toMatch(/sticky|fixed/);
  });

  it('the way on: What’s next in Simple, a progress chip in Advanced; none on mission screens', () => {
    expect(headerOf(ROUTES.district(fresh('simplest')))).toContain('<a class="hud-next" href="#/next">What’s next &#9654;</a>');
    const chip = headerOf(ROUTES.district(fresh('full')));
    expect(chip).toMatch(/<a class="hud-progress" href="#\/next" aria-label="What’s next\. The city is \d+% taken back\."/);
    expect(chip).toContain('class="hud-progress-bar"');
    for (const level of ['simplest', 'full']) {
      for (const route of ['briefing', 'steps', 'debrief', 'filed']) {
        const hud = headerOf(ROUTES[route](fresh(level)));
        expect(hud, `${level} ${route}`).toMatch(/<div class="hud-way"><\/div>/);
      }
    }
  });

  it('What’s next is a quiet outline where the page’s bright button goes the same way (the city, a Simple milestone)', () => {
    expect(headerOf(ROUTES.city(fresh('simplest')))).toContain('class="hud-next hud-next--quiet"');
    expect(headerOf(ROUTES.milestone(fresh('simplest')))).toContain('class="hud-next hud-next--quiet"');
    expect(css).toMatch(/\.hud-next\.hud-next--quiet[^{]*\{[^}]*border-color: var\(--line-quiet\)/);
  });

  it('More holds the mode switch, Focus music, Report a bug, Support us, Patreon and the studio', () => {
    const hud = renderHud(fresh('simplest'));
    const menu = hud.slice(hud.indexOf('id="hud-menu"'), hud.indexOf('</header>'));
    const text = textOf(menu);
    for (const item of ['Simple mode', 'Advanced mode', 'Focus music', 'Report a bug', 'Support us', 'Or any amount on Patreon', 'Reclaim City is by Multiverse Games']) {
      expect(text, item).toContain(item);
    }
    // The bar itself is just the name, the way on and More.
    const bar = hud.slice(0, hud.indexOf('id="hud-menu"'));
    expect(bar).not.toMatch(/stripe|patreon|data-bug-report|data-level=/);
  });

  it('Read it to me stays in the bar on mission screens, one tap away, with its lines', () => {
    for (const level of ['simplest', 'full']) {
      for (const route of ['briefing', 'steps', 'debrief']) {
        const hud = headerOf(ROUTES[route](fresh(level)));
        const bar = hud.slice(0, hud.indexOf('id="hud-menu"'));
        expect(bar, `${level} ${route}`).toMatch(/data-read-tools><button class="top-tool tt-switch" role="switch" aria-checked="false" data-action="read-aloud" data-say="[^"]+" data-say-lines=/);
      }
    }
    expect(headerOf(ROUTES.city(fresh('simplest')))).not.toContain('data-read-tools');
  });

  it('a mission screen asks Simple or Advanced the first time, with the two buttons right there', () => {
    const s = createInitialState();
    const html = renderHud(s, { tools: topTools(s, 'simplest', 'x') });
    expect(html).toMatch(/<div class="hud-ask"><div class="read-ask" data-read-ask>[\s\S]*data-level="simplest"[\s\S]*data-level="full"[\s\S]*Change it under More any time\./);
    expect(renderHud(fresh('simplest'), { tools: topTools(fresh('simplest'), 'simplest', 'x') })).not.toContain('data-read-ask');
  });

  it('everything in the bar and the panel is at least 44px tall', () => {
    for (const sel of ['.hud-next', '.hud-progress', '.hud-more', '.hud-menu-item', '.hud-music', '.top-tool', '.support-note-link']) {
      const rule = new RegExp(`(^|\\n)${sel.replace('.', '\\.')} \\{[^}]*min-height: 44px`);
      expect(css, sel).toMatch(rule);
    }
    expect(css).toMatch(/\.hud-menu \.read-level \{[^}]*min-height: 44px/);
    expect(css).toMatch(/\.hud-bar \{[^}]*min-height: 56px/);
  });

  it('the old 2×2 header is gone: no brand in three lines, no stats beside a bug icon', () => {
    expect(css).not.toMatch(/\.brief-simple \.hud-stat/);
    expect(renderHud(fresh('full'))).not.toContain('style="display: flex; justify-content: space-between');
  });
});

describe('More is a real disclosure', () => {
  // A stand-in document: just enough for initHudMenu.
  function fakeDoc() {
    const listeners = {};
    const button = { attrs: {}, focused: 0, setAttribute(k, v) { this.attrs[k] = v; }, focus() { this.focused += 1; } };
    const panel = { hidden: true };
    const node = (sel) => ({ closest: (q) => (q.split(',').map((x) => x.trim()).some((x) => sel.includes(x)) ? {} : null) });
    const doc = {
      addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn); },
      querySelectorAll: (q) => (q === '[data-hud-more]' ? [button] : q === '[data-hud-menu]' ? [panel] : []),
      fire: (t, e) => (listeners[t] || []).forEach((fn) => fn(e)),
    };
    const winListeners = {};
    const win = { addEventListener: (t, fn) => { (winListeners[t] ||= []).push(fn); }, fire: (t) => (winListeners[t] || []).forEach((fn) => fn({})) };
    return { doc, win, button, panel, node };
  }

  it('the button opens and closes the panel, and says so', () => {
    const { doc, win, button, panel, node } = fakeDoc();
    initHudMenu(doc, win);
    doc.fire('click', { target: node(['[data-hud-more]']) });
    expect(hudMenuOpen()).toBe(true);
    expect(button.attrs['aria-expanded']).toBe('true');
    expect(panel.hidden).toBe(false);
    // Drawn again (switching mode re-draws the screen), it stays open.
    expect(renderHud(fresh('simplest'))).toContain('data-hud-more aria-expanded="true"');
    expect(renderHud(fresh('simplest'))).toMatch(/id="hud-menu" data-hud-menu>/);
    doc.fire('click', { target: node(['[data-hud-more]']) });
    expect(hudMenuOpen()).toBe(false);
    expect(panel.hidden).toBe(true);
  });

  it('a tap inside the panel on a switch keeps it open; a tap outside closes it', () => {
    const { doc, win, node } = fakeDoc();
    initHudMenu(doc, win);
    doc.fire('click', { target: node(['[data-hud-more]']) });
    doc.fire('click', { target: node(['[data-hud-menu]']) });
    expect(hudMenuOpen()).toBe(true);
    doc.fire('click', { target: node([]) });
    expect(hudMenuOpen()).toBe(false);
  });

  it('a link or Report a bug in the panel closes it', () => {
    const { doc, win, node } = fakeDoc();
    initHudMenu(doc, win);
    doc.fire('click', { target: node(['[data-hud-more]']) });
    doc.fire('click', { target: node(['[data-hud-menu] a', '[data-hud-menu]']) });
    expect(hudMenuOpen()).toBe(false);
    doc.fire('click', { target: node(['[data-hud-more]']) });
    doc.fire('click', { target: node(['[data-hud-menu] [data-bug-report]', '[data-hud-menu]']) });
    expect(hudMenuOpen()).toBe(false);
  });

  it('Escape closes it and puts focus back on More; so does going to another screen', () => {
    const { doc, win, button, node } = fakeDoc();
    initHudMenu(doc, win);
    doc.fire('click', { target: node(['[data-hud-more]']) });
    doc.fire('keydown', { key: 'Escape' });
    expect(hudMenuOpen()).toBe(false);
    expect(button.focused).toBe(1);
    doc.fire('click', { target: node(['[data-hud-more]']) });
    win.fire('hashchange');
    expect(hudMenuOpen()).toBe(false);
  });

  it('app.js starts it once', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app.match(/initHudMenu\(document, window\);/g)).toHaveLength(1);
  });
});

describe('Support us, quietly, where something went right', () => {
  it('the LIBERATED milestone and a filed report have it as text links, never a second bright button', () => {
    for (const level of ['simplest', 'full']) {
      const milestone = renderMilestone(fresh(level), 'master-keys');
      expect(milestone).toContain('data-support-note="milestone"');
      expect(primaries(milestone)).toBe(1);
      const report = renderDebrief(filed(level), FIRST);
      expect(report).toContain('data-support-note="debrief"');
      expect(primaries(report)).toBe(1);
      // Not on a report still to be filed.
      expect(renderDebrief(fresh(level), FIRST)).not.toContain('data-support-note');
    }
    expect(supportNote('x')).toMatch(/class="support-note-link" href="https:\/\/buy\.stripe\.com[^"]*" target="_blank"/);
    expect(supportNote('x')).not.toContain('btn-');
  });

  it('not inside the campus cabinet', () => {
    vi.stubGlobal('window', { self: {}, top: {}, location: { search: '?cabinet=campus' } });
    expect(supportNote('milestone')).toBe('');
  });
});

describe('the city: one way forward, the map lower', () => {
  const cityBody = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');

  it('one bright button, and it names the mission What’s next would open', () => {
    for (const level of ['simplest', 'full']) {
      const s = fresh(level);
      const html = cityBody(renderCityMap(s));
      expect(primaries(html)).toBe(1);
      const up = nextUp(s);
      const btn = /<a class="btn-primary scout-action" href="([^"]+)">([\s\S]*?)<\/a>/.exec(html);
      expect(btn[1]).toBe(`#/mission/${up.mission.id}/briefing`);
      expect(textOf(btn[2])).toBe('START NEXT MISSION : GMAIL ▶');
      expect(btn[2]).toContain('<span class="go-phone">START</span><span class="go-wide">NEXT MISSION</span>: GMAIL &#9654;');
    }
  });

  it('half-way through a mission, the button keeps going with it', () => {
    let s = markMissionStarted(fresh('simplest'), FIRST);
    const m = nextUp(s).mission;
    s = markStep(s, FIRST, stepKey(visibleSteps(m, s, 'simplest')[0], 0), 'done');
    expect(nextUp(s).kind).toBe('resume');
    const html = cityBody(renderCityMap(s));
    expect(primaries(html)).toBe(1);
    expect(html).toMatch(/<a class="btn-primary scout-action" href="#\/mission\/gmail-recon-breach\/briefing">KEEP GOING: GMAIL &#9654;<\/a>/);
  });

  it('phone order: Scout and the button, the district cards, the map, then More places', () => {
    const html = cityBody(renderCityMap(fresh('full')));
    const order = ['<div class="city-hud">', '<div class="city-scout">', 'scout-action', '<div class="city-labels">', '<div class="city-readout">', '<div class="city-skyline">', '<nav class="city-actions"'];
    const at = order.map((x) => html.indexOf(x));
    for (const i of at) expect(i).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    // No CSS order shuffling on a phone: the page reads in the order it shows.
    expect(citySrc).not.toMatch(/\.city-(hud|scout) \{ order:/);
  });

  it('More places holds all six places, each at least 44px tall on a phone', () => {
    const html = cityBody(renderCityMap(fresh('simplest')));
    const nav = html.slice(html.indexOf('<nav class="city-actions"'), html.indexOf('</nav>'));
    expect(nav).toContain('<h2 class="city-actions__head" id="city-more-places">More places</h2>');
    expect([...nav.matchAll(/<a href="([^"]+)" class="city-btn">/g)].map((m) => m[1]))
      .toEqual(['#/quickquest', '#/stats', '#/reclamation/map', '#/prism', '#/government', '#/city-together']);
    const phone = citySrc.slice(citySrc.indexOf('.welcome-back--top { display: block; }'));
    expect(phone).toMatch(/\.city-btn \{[^}]*min-height: 44px/);
  });

  it('Scout’s first line is one sentence, the rest behind his ▾', () => {
    const html = cityBody(renderCityMap(fresh('simplest')));
    expect(html).toContain('We start with your email: take back the <a class="say-link" href="#/district/master-keys">Master Keys</a> district first.');
    expect(html).toMatch(/<details class="scout-more" data-fold="scout-more"><summary class="scout-more-toggle">Tell me more <span class="scout-more-caret" aria-hidden="true">&#9662;<\/span><\/summary><div class="scout-more-text">The whole city is occupied, and every building here is holding your data\./);
  });

  it('Simple: the cards show bars, not numbers or codes, and no readout', () => {
    const html = cityBody(renderCityMap(fresh('simplest')));
    expect(html).not.toMatch(/MISSIONS|BONUS|D-0\d|city-readout/);
    expect((html.match(/class="city-label__bar"/g) || []).length).toBe(8);
  });

  it('Advanced: the numbers stay, and the readout counts the districts on the map', () => {
    const html = cityBody(renderCityMap(fresh('full')));
    expect(html).toContain('0/28 MISSIONS');
    expect(html).toContain('D-01');
    expect((html.match(/<a href="#\/district\/[^"]+" class="city-label /g) || []).length).toBe(8);
    expect(html).toContain('DISTRICTS <b>8</b>');
    expect(html).toContain('SECURED <b>0</b>');
  });
});
