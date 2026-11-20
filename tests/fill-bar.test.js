import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fillBar, _resetFillBars } from '../src/components/fill-bar.js';
import { confetti } from '../src/components/celebrate.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderPasswordFinder, BROWSER_ICONS } from '../src/screens/password-finder.js';
import { setFinderAnswer, PLACES } from '../src/data/password-finder.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { setReadLevel, visibleSteps, stepKey, markStep } from '../src/utils/reading.js';
import { findMission } from '../src/data/custom-missions.js';
import { markOpened, clearOpened } from '../src/utils/opened-steps.js';

// Liz 2026-11-18: "we need to see a bar fill, we need to 'see security as a process'",
// "a big, visual, motivating, filling bar … that like, visibly animatedly fills up".
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { _resetFillBars(); globalThis.localStorage = memory(); });

const vars = (html) => ({ from: html.match(/--from: ([\d.]+%)/)?.[1], to: html.match(/--to: ([\d.]+%)/)?.[1] });
const classes = (html) => html.match(/class="(fill-bar [^"]*)"/)[1].split(' ');

describe('fillBar', () => {
  it('fills from empty the first time, then from where it was last seen', () => {
    const a = fillBar({ key: 'steps:x', done: 1, total: 3 });
    expect(vars(a)).toEqual({ from: '0%', to: '33.3%' });
    expect(classes(a)).toContain('is-growing');
    const b = fillBar({ key: 'steps:x', done: 2, total: 3 });
    expect(vars(b)).toEqual({ from: '33.3%', to: '66.7%' });
    expect(classes(b)).toContain('is-growing');
    // The same value again (a re-render): no grow, no shine.
    const c = fillBar({ key: 'steps:x', done: 2, total: 3 });
    expect(vars(c)).toEqual({ from: '66.7%', to: '66.7%' });
    expect(classes(c)).not.toContain('is-growing');
  });

  it('each key remembers its own value', () => {
    fillBar({ key: 'a', done: 2, total: 4 });
    expect(vars(fillBar({ key: 'b', done: 1, total: 4 })).from).toBe('0%');
    expect(vars(fillBar({ key: 'a', done: 3, total: 4 })).from).toBe('50%');
  });

  it('a full bar is marked is-full (it turns green and glows); a started one has-some', () => {
    const full = classes(fillBar({ key: 'f', done: 3, total: 3 }));
    expect(full).toContain('is-full');
    expect(full).not.toContain('has-some');
    const some = classes(fillBar({ key: 's', done: 1, total: 3 }));
    expect(some).not.toContain('is-full');
    expect(some).toContain('has-some');
    expect(classes(fillBar({ key: 'z', done: 0, total: 3 }))).not.toContain('has-some');
  });

  it('shows segments up to a dozen, one smooth bar past that', () => {
    const few = fillBar({ key: 'g', done: 1, total: 5 });
    expect(classes(few)).toContain('has-segs');
    expect(few).toContain('--segs: 5;');
    const many = fillBar({ key: 'm', done: 1, total: 27 });
    expect(classes(many)).not.toContain('has-segs');
    expect(many).not.toContain('--segs');
  });

  it('shows no numbers: they live in its aria label', () => {
    const h = fillBar({ key: 'n', done: 2, total: 5, size: 'big', label: 'Step 3 of 5' });
    expect(h).toContain('role="progressbar"');
    expect(h).toContain('aria-label="Step 3 of 5"');
    expect(h).toContain('aria-valuenow="2"');
    expect(h.replace(/<[^>]*>/g, '').trim()).toBe('');
  });

  it('an empty total is an empty bar, not a crash or a full one', () => {
    const h = fillBar({ key: 'e', done: 0, total: 0 });
    expect(vars(h)).toEqual({ from: '0%', to: '0%' });
    expect(classes(h)).not.toContain('is-full');
  });
});

describe('the bar on the step screens', () => {
  const MISSION = 'gmail-recon-breach';
  const text = (html) => html.replace(/<[^>]*>/g, ' ');

  it('Simple step mode shows a big bar and no "Step X of Y" anywhere on the screen', () => {
    clearOpened();
    const s = markMissionStarted(setReadLevel(createInitialState(), 'simplest'), MISSION);
    markOpened(MISSION, stepKey(visibleSteps(findMission(s, MISSION), s)[0]));
    const html = renderBriefing(s, MISSION);
    expect(html).toMatch(/class="fill-bar fill-bar--big[^"]*"/);
    expect(text(html)).not.toMatch(/step \d+ of \d+/i);
  });

  it('all steps done: a full bar and confetti', () => {
    let s = markMissionStarted(setReadLevel(createInitialState(), 'simplest'), MISSION);
    for (const st of visibleSteps(findMission(s, MISSION), s)) s = markStep(s, MISSION, stepKey(st), 'done');
    const html = renderBriefing(s, MISSION);
    expect(html).toContain('ALL 3 STEPS DONE');
    expect(classes(html)).toContain('is-full');
    expect(html).toContain('class="confetti"');
  });

  it('confetti is pure markup, hidden from screen readers', () => {
    const c = confetti(10);
    expect(c).toContain('aria-hidden="true"');
    expect(c.match(/<i /g)).toHaveLength(10);
  });

  it('confetti is fixed to the screen and clipped, so it can never widen the page on a phone', () => {
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toMatch(/\.confetti \{[^}]*position: fixed;[^}]*overflow: hidden;/);
  });
});

describe('the password finder', () => {
  const finder = (...pairs) => renderPasswordFinder(pairs.reduce((s, [k, v]) => setFinderAnswer(s, k, v), { ...createInitialState(), passwordFinder: {} }));

  it('the browser buttons carry each browser’s own icon (and "I don’t know" none)', () => {
    const html = finder(['where', 'computer']);
    for (const [b, src] of Object.entries(BROWSER_ICONS)) {
      expect(html).toMatch(new RegExp(`<button type="button" class="finder-opt has-icon" data-action="finder-answer" data-key="browser" data-value="${b}"><img class="finder-icon" src="${src}" alt="" width="32" height="32">`));
      expect(readFileSync(`src/${src}`).length).toBeGreaterThan(500);
    }
    expect(html).toMatch(/data-value="unknown"><span>/);
  });

  it('Chrome: its icon on the heading, and every step a full-size numbered item', () => {
    const html = finder(['where', 'computer'], ['browser', 'chrome']);
    expect(html).toContain(`<img class="finder-icon finder-icon--head" src="${BROWSER_ICONS.chrome}"`);
    const list = html.match(/<ol class="finder-steps">([\s\S]*?)<\/ol>/);
    expect(list).not.toBeNull();
    expect(list[1].match(/<li>/g)).toHaveLength(PLACES.chrome.steps.length);
    expect(list[1]).toContain('Google Password Manager');
    expect(html).not.toContain('finder-look--alt');
  });

  it('an "only if that doesn’t work" line is in its own labeled box, never small gray text', () => {
    const html = finder(['where', 'phone'], ['phone', 'iphone']);
    expect(html).toContain('<div class="finder-alt"><strong>If that doesn’t work:</strong>');
    for (const place of Object.values(PLACES)) {
      expect(place.look).toBeUndefined();
      expect(place.steps.length).toBeGreaterThan(0);
    }
  });
});
