import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { splitWords, deck, initDecks, countWords, slideIndex, deckStep, controlState, stepTarget, resolveIndex, progressWidth, deckHeight, focusAfter, openFolds, restoreFolds } from '../src/components/deck.js';
import { MISSIONS } from '../src/data/missions.js';

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const words = (html) => norm(html.replace(/<[^>]*>/g, ' ')).split(' ').filter(Boolean);

// Real copy from the game: every briefing, step and Scout line (plain text with quotes,
// dashes and abbreviations; the HTML cases are in the sample below).
const strings = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
const realTexts = MISSIONS.flatMap((m) => strings([m.briefing, m.steps, m.scoutDialog])).filter((t) => t.split(' ').length > 2);

const sample = 'First sentence is short. Second one has <a href="https://x.example/a?b=1&amp;c=2">a link. With a dot</a> inside it! '
  + 'The U.S. government vs. Acme Inc. is a case &mdash; e.g. this one. '
  + 'She said, &ldquo;Stop.&rdquo; Then <strong>she left.</strong> Done? Yes.';

describe('splitWords', () => {
  it('splitWords keeps every word in order', () => {
    for (const t of [sample, ...realTexts]) {
      const chunks = splitWords(t, 12);
      expect(chunks.join('')).toBe(norm(t));
      expect(words(chunks.join(''))).toEqual(words(t));
    }
  });

  it('splitWords never exceeds max unless one sentence does', () => {
    const t = 'One two three four. Five six seven. Eight nine ten eleven twelve thirteen fourteen fifteen sixteen. Short.';
    const chunks = splitWords(t, 8);
    expect(chunks.map(norm)).toEqual(['One two three four. Five six seven.', 'Eight nine ten eleven twelve thirteen fourteen fifteen sixteen.', 'Short.']);
    for (const t2 of [sample, ...realTexts]) {
      for (const c of splitWords(t2, 35)) {
        // A chunk over the budget is a single sentence: no further split point.
        if (countWords(c) > 35) expect(splitWords(c, 1).length).toBe(1);
      }
    }
    expect(splitWords('', 35)).toEqual([]);
    expect(splitWords('Just one.', 35)).toEqual(['Just one.']);
  });

  it('splitWords never cuts inside a tag or entity', () => {
    const chunks = splitWords(sample, 1);
    for (const c of chunks) {
      // Every < has its >, every & is a whole entity.
      expect(c.replace(/<[^<>]*>/g, '')).not.toMatch(/[<>]/);
      expect(c.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+\d*);/gi, '')).not.toContain('&');
      // Open tags are closed in the same chunk: a sentence with a tag stays whole.
      const opens = (c.match(/<(a|strong|em|b|i|span)\b/g) || []).length;
      const closes = (c.match(/<\/(a|strong|em|b|i|span)>/g) || []).length;
      expect(opens).toBe(closes);
    }
    expect(chunks.map(norm)).toEqual([
      'First sentence is short.',
      'Second one has <a href="https://x.example/a?b=1&amp;c=2">a link. With a dot</a> inside it!',
      'The U.S. government vs. Acme Inc. is a case &mdash; e.g. this one.',
      'She said, &ldquo;Stop.&rdquo;',
      'Then <strong>she left.</strong>',
      'Done?',
      'Yes.',
    ]);
    // Lowercase after a stop is not a new sentence ("just... so"); initials are not either.
    expect(splitWords('Wait just... so long. J. Smith came. Ch. 5 is next.', 1).map(norm)).toEqual(['Wait just... so long.', 'J. Smith came.', 'Ch. 5 is next.']);
    // Plain text with a bare > or & ("Settings > Privacy & Security") is text, kept as is.
    expect(splitWords('Open Settings > Privacy & Security. Then tap it.', 1).map(norm)).toEqual(['Open Settings > Privacy & Security.', 'Then tap it.']);
  });

  it('countWords ignores tags and bare entities', () => {
    expect(countWords('<a href="x y z">one</a> two &mdash; three don&rsquo;t')).toBe(4);
  });
});

describe('deck', () => {
  it('deck renders sections, labels and controls', () => {
    const html = deck([{ html: '<p>A</p>', heading: 'First' }, { html: '<p>B</p>' }, { html: '<p>C</p>' }], { label: 'Mission briefing', className: 'brief-deck' });
    expect(html).toContain('<div class="deck brief-deck" data-deck role="region" aria-roledescription="carousel" aria-label="Mission briefing">');
    expect(html.match(/<section class="slide"/g)).toHaveLength(3);
    expect(html).toContain('aria-roledescription="slide" aria-label="1 of 3"');
    expect(html).toContain('aria-label="2 of 3"');
    expect(html).toContain('aria-label="3 of 3"');
    expect(html).toContain('First');
    expect(html.indexOf('<p>A</p>')).toBeLessThan(html.indexOf('<p>B</p>'));
    expect(html.indexOf('<p>B</p>')).toBeLessThan(html.indexOf('<p>C</p>'));
    // Controls in order: BACK, dots, live count, NEXT.
    const back = html.indexOf('data-deck-prev');
    const dots = html.indexOf('deck-dots');
    const count = html.indexOf('aria-live="polite"');
    const next = html.indexOf('data-deck-next');
    expect(back).toBeGreaterThan(html.indexOf('3 of 3'));
    expect(back).toBeLessThan(dots);
    expect(dots).toBeLessThan(count);
    expect(count).toBeLessThan(next);
    expect(html.match(/class="deck-dot[ "]/g)).toHaveLength(3);
    expect(html).toMatch(/aria-live="polite"[^>]*>1 of 3</);
    // BACK starts disabled; NEXT does not.
    expect(html).toMatch(/<button[^>]*data-deck-prev[^>]*disabled/);
    expect(html).not.toMatch(/<button[^>]*data-deck-next[^>]*disabled/);
  });

  it('one slide renders no controls', () => {
    expect(deck([{ html: '<p>Only</p>' }], { label: 'x' })).toBe('<p>Only</p>');
    expect(deck([], { label: 'x' })).toBe('');
  });

  it('controls are buttons with 44px min height', () => {
    const html = deck([{ html: 'a' }, { html: 'b' }], { label: 'x' });
    expect(html).toMatch(/<button type="button"[^>]*data-deck-prev[^>]*>BACK<\/button>/);
    expect(html).toMatch(/<button type="button"[^>]*data-deck-next[^>]*>NEXT<\/button>/);
    const css = deckCss();
    const rule = css.match(/\.deck-btn\s*\{[^}]*\}/)?.[0] || '';
    expect(rule).toMatch(/min-height:\s*44px/);
  });
});

function deckCss() {
  const css = readFileSync('src/style.css', 'utf8');
  const a = css.indexOf('/* deck: start */');
  const b = css.indexOf('/* deck: end */');
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  return css.slice(a, b);
}

describe('deck CSS', () => {
  it('no nowrap and no fixed width over 360 in the deck CSS', () => {
    // Media-query conditions (max-width: 899px) are breakpoints, not widths.
    const css = deckCss().replace(/@media[^{]*\{/g, '{');
    expect(css).not.toMatch(/white-space:\s*nowrap/);
    for (const m of css.matchAll(/(?:^|[^-])((?:min-)?width):\s*(\d+)px/g)) expect(Number(m[2])).toBeLessThanOrEqual(360);
  });

  it('phone: a scroll-snap row; desktop: blocks with no controls; reduced motion: instant', () => {
    const css = deckCss().replace(/\s+/g, ' ');
    const phone = css.slice(css.indexOf('@media (max-width: 899px)'));
    expect(phone).toMatch(/\.deck \{[^}]*display: flex;[^}]*overflow-x: auto;[^}]*scroll-snap-type: x mandatory;[^}]*overscroll-behavior-x: contain;/);
    expect(phone).toMatch(/\.slide \{[^}]*flex: 0 0 100%;[^}]*scroll-snap-align: start;[^}]*max-height:[^}]*overflow-y: auto;/);
    const desk = css.slice(css.indexOf('@media (min-width: 900px)'));
    expect(desk).toMatch(/\.deck \{[^}]*display: block;/);
    expect(desk).toMatch(/\.deck-controls \{[^}]*display: none;/);
    const still = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(still).toMatch(/\.deck \{[^}]*scroll-behavior: auto;/);
  });
});

describe('initDecks', () => {
  it('slide math: index from scroll, steps from keys, control state', () => {
    expect(slideIndex(0, 390, 4)).toBe(0);
    expect(slideIndex(390, 390, 4)).toBe(1);
    expect(slideIndex(600, 390, 4)).toBe(2);
    expect(slideIndex(99999, 390, 4)).toBe(3);
    expect(slideIndex(-20, 390, 4)).toBe(0);
    expect(slideIndex(100, 0, 4)).toBe(0);
    expect(deckStep('ArrowRight')).toBe(1);
    expect(deckStep('ArrowLeft')).toBe(-1);
    expect(deckStep('Enter')).toBe(0);
    expect(controlState(0, 3)).toEqual({ prevDisabled: true, nextDisabled: false, count: '1 of 3' });
    expect(controlState(1, 3)).toEqual({ prevDisabled: false, nextDisabled: false, count: '2 of 3' });
    expect(controlState(2, 3)).toEqual({ prevDisabled: false, nextDisabled: true, count: '3 of 3' });
  });

  it('initDecks is idempotent', () => {
    const listeners = [];
    const el = (extra = {}) => ({
      dataset: {},
      disabled: false,
      textContent: '',
      classList: { toggle() {} },
      setAttribute() {},
      hasAttribute: () => false,
      addEventListener: (type) => listeners.push(type),
      querySelector: () => null,
      querySelectorAll: () => [],
      ...extra,
    });
    const prev = el(); const next = el(); const count = el();
    const controls = el({ querySelector: (s) => ({ '[data-deck-prev]': prev, '[data-deck-next]': next, '[aria-live]': count }[s] || null), querySelectorAll: () => [] });
    const slides = [el(), el(), el()];
    const d = el({ scrollLeft: 0, clientWidth: 390, nextElementSibling: { ...controls, hasAttribute: (a) => a === 'data-deck-controls' }, querySelectorAll: (s) => (s === ':scope > .slide' ? slides : []) });
    const root = { querySelectorAll: (s) => (s === '[data-deck]' ? [d] : []) };
    initDecks(root);
    const once = listeners.length;
    expect(once).toBeGreaterThan(0);
    initDecks(root);
    initDecks(root);
    expect(listeners.length).toBe(once);
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    expect(count.textContent).toBe('1 of 3');
    expect(() => initDecks(null)).not.toThrow();
  });

  it('a programmatic scroll keeps its target: the half-way position does not pull the count back', () => {
    // Two quick NEXT taps from slide 0: the second steps from the target, not the old slide.
    expect(stepTarget(null, 0, 1, 4)).toBe(1);
    expect(stepTarget(1, 0, 1, 4)).toBe(2);
    expect(stepTarget(3, 2, 1, 4)).toBe(3);
    expect(stepTarget(null, 0, -1, 4)).toBe(0);
    // Mid-scroll toward slide 2 (still nearer slide 0): the target is shown, not settled.
    expect(resolveIndex(2, 100, 390, 4)).toEqual({ index: 2, settled: false });
    expect(resolveIndex(2, 780, 390, 4)).toEqual({ index: 2, settled: true });
    // No programmatic scroll (a swipe): the position decides.
    expect(resolveIndex(null, 400, 390, 4)).toEqual({ index: 1, settled: true });
  });

  it('two quick NEXT taps move two slides, scroll events mid-way do not undo them, a redraw restores instantly', () => {
    const fake = (extra = {}) => {
      const on = {};
      return {
        on, dataset: {}, disabled: false, textContent: '', style: { scrollBehavior: '' },
        classList: { toggle() {} }, setAttribute() {}, hasAttribute: () => true, focus() {},
        getAttribute: (a) => (a === 'aria-label' ? 'Briefing' : null),
        addEventListener: (type, fn) => { on[type] = fn; },
        querySelector: () => null, querySelectorAll: () => [], ...extra,
      };
    };
    const make = () => {
      const prev = fake(); const next = fake(); const count = fake();
      const controls = fake({ hasAttribute: (a) => a === 'data-deck-controls', querySelector: (s) => ({ '[data-deck-prev]': prev, '[data-deck-next]': next, '[aria-live]': count }[s] || null) });
      const scrolls = [];
      const d = fake({
        scrollLeft: 0, clientWidth: 390, scrollWidth: 1560, nextElementSibling: controls,
        querySelectorAll: (s) => (s === ':scope > .slide' ? [fake(), fake(), fake(), fake()] : []),
        scrollTo(o) { scrolls.push({ ...o, css: this.style.scrollBehavior }); },
      });
      return { d, prev, next, count, scrolls, root: { querySelectorAll: (s) => (s === '[data-deck]' ? [d] : []) } };
    };
    const raf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (f) => { f(); return 0; };
    try {
      const a = make();
      initDecks(a.root);
      a.next.on.click();
      a.d.scrollLeft = 40; // the smooth scroll has barely started
      a.d.on.scroll();
      expect(a.count.textContent).toBe('2 of 4');
      a.next.on.click();
      expect(a.scrolls.map((s) => s.left)).toEqual([390, 780]);
      a.d.scrollLeft = 500;
      a.d.on.scroll();
      expect(a.count.textContent).toBe('3 of 4');
      a.d.scrollLeft = 780;
      a.d.on.scroll();
      expect(a.count.textContent).toBe('3 of 4');
      // Settled: a swipe now drives the count again.
      a.d.scrollLeft = 1170;
      a.d.on.scroll();
      expect(a.count.textContent).toBe('4 of 4');
      expect(a.next.disabled).toBe(true);

      // A redraw kept at slide 3: an instant jump, and the count says so from the start.
      const b = make();
      initDecks(b.root, new Map([['Briefing', 2]]));
      expect(b.scrolls).toEqual([{ left: 780, behavior: 'instant', css: 'auto' }]);
      expect(b.d.style.scrollBehavior).toBe('');
      expect(b.count.textContent).toBe('3 of 4');
      expect(b.prev.disabled).toBe(false);
    } finally {
      globalThis.requestAnimationFrame = raf;
    }
  });

  it('app.js calls initDecks(app) after every render', () => {
    const src = readFileSync('src/app.js', 'utf8');
    expect(src).toMatch(/import \{[^}]*\binitDecks\b[^}]*\} from '\.\/components\/deck\.js';/);
    const i = src.indexOf('function render(route');
    const body = src.slice(i, src.indexOf('\n}\n', i));
    const draw = body.indexOf('app.innerHTML = renderFn(route.params);');
    const map = body.indexOf('afterBrokerMapRender(renderFn, route.params);');
    const init = body.indexOf('initDecks(app');
    expect(draw).toBeGreaterThan(-1);
    expect(init).toBeGreaterThan(map);
    expect(map).toBeGreaterThan(draw);
    // Not inside a screen-specific branch: it runs on REFRESH and NAVIGATE alike.
    const line = body.slice(body.lastIndexOf('\n', init), body.indexOf('\n', init));
    expect(line.trim()).toMatch(/^initDecks\(app/);
  });

  it('more than 8 slides: a thin progress bar instead of dots, and the live count stays', () => {
    const slides = (n) => Array.from({ length: n }, (_, i) => ({ html: `<p>Slide ${i}</p>` }));
    const eight = deck(slides(8), { label: 'Eight' });
    expect(eight.match(/class="deck-dot[ "]/g)).toHaveLength(8);
    expect(eight).not.toContain('deck-progress');
    const nine = deck(slides(9), { label: 'Nine' });
    expect(nine).not.toContain('deck-dot');
    expect(nine).toMatch(/<span class="deck-progress" aria-hidden="true"><span class="deck-progress-fill" style="width: 11\.\d+%"><\/span><\/span>/);
    expect(nine).toContain('<span class="deck-count" aria-live="polite">1 of 9</span>');
    expect(progressWidth(0, 9)).toBe(`${100 / 9}%`);
    expect(progressWidth(8, 9)).toBe('100%');
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.deck-progress \{[^}]*height: [1-4]px/);
    expect(css).toMatch(/\.deck-progress-fill \{[^}]*transition: width/);
  });

  it('the deck is as tall as the slide on screen (a row only; a desktop stack has its own height)', () => {
    expect(deckHeight(312.4, true)).toBe('313px');
    expect(deckHeight(0, true)).toBe('');
    expect(deckHeight(undefined, true)).toBe('');
    expect(deckHeight(312, false)).toBe('');
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
    const phone = css.slice(css.indexOf('@media (max-width: 899px)', css.indexOf('/* deck: start */')));
    expect(phone).toMatch(/\.deck \{[^}]*align-items: flex-start;[^}]*overflow-y: hidden;[^}]*transition: height/);
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('/* deck: start */')));
    expect(reduced).toMatch(/\.deck \{[^}]*transition: none/);
  });

  it('BACK / NEXT keep focus on the pressed button; arrow keys move focus to the slide heading', () => {
    expect(focusAfter('button', false)).toBe('button');
    // The press reached the end and its button is now disabled: focus goes to the slide.
    expect(focusAfter('button', true)).toBe('heading');
    expect(focusAfter('key', false)).toBe('heading');

    const focused = [];
    const fake = (name, extra = {}) => {
      const on = {};
      return {
        name, on, dataset: {}, disabled: false, textContent: '', style: {},
        classList: { toggle() {} }, setAttribute() {}, hasAttribute: () => true,
        focus() { focused.push(name); },
        getAttribute: () => 'Deck',
        addEventListener: (type, fn) => { on[type] = fn; },
        querySelector: () => null, querySelectorAll: () => [], ...extra,
      };
    };
    const heading = (i) => fake(`heading${i}`);
    const slides = [0, 1, 2].map((i) => fake(`slide${i}`, { offsetHeight: 200 + i * 100, querySelector: () => heading(i) }));
    const prev = fake('prev'); const next = fake('next'); const count = fake('count');
    const controls = fake('controls', { hasAttribute: (a) => a === 'data-deck-controls', querySelector: (s) => ({ '[data-deck-prev]': prev, '[data-deck-next]': next, '[aria-live]': count }[s] || null) });
    const d = fake('deck', { scrollLeft: 0, clientWidth: 390, scrollWidth: 1170, nextElementSibling: controls, querySelectorAll: (s) => (s === ':scope > .slide' ? slides : []), scrollTo() {} });
    initDecks({ querySelectorAll: (s) => (s === '[data-deck]' ? [d] : []) });
    expect(d.style.height).toBe('200px');
    next.on.click();
    expect(focused).toEqual(['next']);
    expect(d.style.height).toBe('300px');
    d.on.keydown({ key: 'ArrowRight', preventDefault() {}, target: { closest: () => null } });
    expect(focused).toEqual(['next', 'heading2']);
    expect(d.style.height).toBe('400px');
  });

  it('a slide can carry its own class (a phone-only slide hides whole on desktop)', () => {
    const html = deck([{ html: '<p>a</p>' }, { html: '<p>b</p>', className: 'slide--phone' }], { label: 'X' });
    expect(html).toContain('<section class="slide" role="group" aria-roledescription="slide" aria-label="1 of 2"');
    expect(html).toContain('<section class="slide slide--phone" role="group" aria-roledescription="slide" aria-label="2 of 2"');
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
    const desk = css.slice(css.indexOf('@media (min-width: 900px)', css.indexOf('/* deck: start */')));
    expect(desk).toMatch(/^@media[^@]*\.slide\.slide--phone \{ display: none; \}/);
  });

  it('the height fits only when the scroll lands: a swipe does not jump mid-gesture, NEXT to a shorter slide shrinks after landing', () => {
    vi.useFakeTimers();
    const raf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (f) => { f(); return 0; };
    try {
      const fake = (extra = {}) => {
        const on = {};
        return {
          on, dataset: {}, disabled: false, textContent: '', style: {},
          classList: { toggle() {} }, setAttribute() {}, hasAttribute: () => true, focus() {},
          getAttribute: () => 'Deck', addEventListener: (type, fn) => { on[type] = fn; },
          querySelector: () => null, querySelectorAll: () => [], ...extra,
        };
      };
      const slides = [400, 200, 300].map((h) => fake({ offsetHeight: h }));
      const prev = fake(); const next = fake(); const count = fake();
      const controls = fake({ hasAttribute: (a) => a === 'data-deck-controls', querySelector: (s) => ({ '[data-deck-prev]': prev, '[data-deck-next]': next, '[aria-live]': count }[s] || null) });
      const d = fake({ scrollLeft: 0, clientWidth: 390, scrollWidth: 1170, nextElementSibling: controls, querySelectorAll: (s) => (s === ':scope > .slide' ? slides : []), scrollTo() {} });
      initDecks({ querySelectorAll: (s) => (s === '[data-deck]' ? [d] : []) });
      expect(d.style.height).toBe('400px');
      // NEXT to a shorter slide: no shrink while the scroll runs (the outgoing slide would clip).
      next.on.click();
      expect(count.textContent).toBe('2 of 3');
      expect(d.style.height).toBe('400px');
      d.scrollLeft = 200; d.on.scroll();
      expect(d.style.height).toBe('400px');
      d.scrollLeft = 390; d.on.scroll();
      expect(d.style.height).toBe('200px');
      // A swipe: the count follows at half-way, the height waits for the swipe to stop.
      d.scrollLeft = 600; d.on.scroll();
      expect(count.textContent).toBe('3 of 3');
      expect(d.style.height).toBe('200px');
      d.scrollLeft = 780; d.on.scroll();
      expect(d.style.height).toBe('200px');
      vi.advanceTimersByTime(200);
      expect(d.style.height).toBe('300px');
      // Or scrollend says so straight away.
      d.scrollLeft = 390; d.on.scroll(); d.on.scrollend();
      expect(d.style.height).toBe('200px');
    } finally {
      globalThis.requestAnimationFrame = raf;
      vi.useRealTimers();
    }
  });

  it('a deck that leaves the page stops its ResizeObserver', () => {
    const made = [];
    const RO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; this.off = false; made.push(this); } observe() {} disconnect() { this.off = true; } };
    try {
      const el = (extra = {}) => ({ dataset: {}, style: {}, textContent: '', classList: { toggle() {} }, setAttribute() {}, hasAttribute: () => false, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], ...extra });
      const controls = el({ hasAttribute: (a) => a === 'data-deck-controls' });
      const slides = [el({ offsetHeight: 100 }), el({ offsetHeight: 150 })];
      const d = el({ isConnected: true, scrollLeft: 0, clientWidth: 390, scrollWidth: 780, nextElementSibling: controls, querySelectorAll: (s) => (s === ':scope > .slide' ? slides : []) });
      initDecks({ querySelectorAll: (s) => (s === '[data-deck]' ? [d] : []) });
      expect(made).toHaveLength(1);
      made[0].cb();
      expect(made[0].off).toBe(false);
      d.isConnected = false;
      made[0].cb();
      expect(made[0].off).toBe(true);
    } finally {
      globalThis.ResizeObserver = RO;
    }
  });
});

describe('named dots (the saints)', () => {
  it('names: each dot is a button labelled with its name, even past 8, the first one current', () => {
    const names = Array.from({ length: 9 }, (_, i) => `Saint Person ${String.fromCharCode(65 + i)}lpha`);
    const html = deck(names.map((n) => ({ html: `<h2>${n}</h2>` })), { label: 'Saints', names });
    expect(html).not.toContain('deck-progress');
    const dots = [...html.matchAll(/<button type="button" class="deck-dot[^"]*" data-deck-to="(\d)" aria-label="([^"]*)"( aria-current="true")?>/g)];
    expect(dots.map((m) => m[2])).toEqual(names);
    expect(dots.map((m) => +m[1])).toEqual([...names.keys()]);
    expect(dots.filter((m) => m[3]).length).toBe(1);
    expect(dots[0][3]).toBeTruthy();
    // The dots are on their own row, readable: not aria-hidden.
    expect(html).toMatch(/<span class="deck-dots deck-dots--named">/);
    expect(html).toContain('deck-controls deck-controls--named');
    // The visible mark is a dot, not initials ("AS" meant nothing to a reader); the name is the label.
    expect(html).toContain('<span class="deck-dot-mark" aria-hidden="true"></span>');
    expect(html).not.toContain('<span aria-hidden="true">PA</span>');
    expect(html).toContain('1 of 9');
  });

  it('a named dot moves the deck to its slide and keeps focus on the dot', () => {
    const fake = (extra = {}) => {
      const on = {};
      const attrs = {};
      return {
        on, attrs, dataset: {}, disabled: false, textContent: '', style: { scrollBehavior: '' }, focused: 0,
        classList: { toggle() {} }, setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; }, hasAttribute: () => true,
        focus() { this.focused++; }, getAttribute: () => 'Saints',
        addEventListener: (type, fn) => { on[type] = fn; },
        querySelector: () => null, querySelectorAll: () => [], ...extra,
      };
    };
    const dots = [0, 1, 2, 3].map((i) => fake({ dataset: { deckTo: String(i) } }));
    const prev = fake(); const next = fake(); const count = fake();
    const controls = fake({
      hasAttribute: (a) => a === 'data-deck-controls',
      querySelector: (s) => ({ '[data-deck-prev]': prev, '[data-deck-next]': next, '[aria-live]': count }[s] || null),
      querySelectorAll: (s) => (s === '.deck-dot' ? dots : []),
    });
    const scrolls = [];
    const d = fake({
      scrollLeft: 0, clientWidth: 390, scrollWidth: 1560, nextElementSibling: controls,
      querySelectorAll: (s) => (s === ':scope > .slide' ? [fake(), fake(), fake(), fake()] : []),
      scrollTo(o) { scrolls.push(o.left); },
    });
    initDecks({ querySelectorAll: (s) => (s === '[data-deck]' ? [d] : []) });
    expect(dots[0].attrs['aria-current']).toBe('true');
    dots[2].on.click();
    expect(scrolls).toEqual([780]);
    expect(count.textContent).toBe('3 of 4');
    expect(dots[2].attrs['aria-current']).toBe('true');
    expect(dots[0].attrs['aria-current']).toBeUndefined();
    expect(dots[2].focused).toBe(1);
  });

  it('named dots CSS: their own row, 44px tall targets, no nowrap', () => {
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
    const block = css.slice(css.indexOf('/* deck: start */'), css.indexOf('/* deck: end */'));
    expect(block).toMatch(/\.deck-controls--named\s*\{[^}]*flex-wrap: wrap/);
    expect(block).toMatch(/\.deck-dots--named\s*\{[^}]*flex: 1 1 100%/);
    expect(block).toMatch(/\.deck-dot--named\s*\{[^}]*min-height: 44px/);
    expect(block).not.toMatch(/white-space:\s*nowrap/);
  });
});

describe('folds kept across a redraw', () => {
  it('openFolds lists the open [data-fold] keys; restoreFolds reopens them', () => {
    const det = (key, open) => ({ open, getAttribute: (a) => (a === 'data-fold' ? key : null) });
    const before = { querySelectorAll: (s) => (s === 'details[data-fold]' ? [det('a', true), det('b', false), det('c', true)] : []) };
    const kept = openFolds(before);
    expect([...kept]).toEqual(['a', 'c']);
    const after = [det('a', false), det('b', false), det('c', false), det('d', false)];
    restoreFolds({ querySelectorAll: (s) => (s === 'details[data-fold]' ? after : []) }, kept);
    expect(after.map((x) => x.open)).toEqual([true, false, true, false]);
    expect(() => restoreFolds(null, kept)).not.toThrow();
    expect([...openFolds(null)]).toEqual([]);
  });

  it('app.js keeps folds open across a redraw', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app).toMatch(/openFolds\(app\)[\s\S]*app\.innerHTML = renderFn[\s\S]*restoreFolds\(app,/);
  });
});

describe('rectOnScreen (review M1: no cheer on a slide scrolled out of the deck)', async () => {
  const { rectOnScreen } = await import('../src/components/deck.js');
  it('in view, partly in view, scrolled off to either side, hidden', () => {
    expect(rectOnScreen({ left: 20, right: 300, top: 200, bottom: 400, width: 280, height: 200 }, 390, 844)).toBe(true);
    expect(rectOnScreen({ left: 380, right: 660, top: 200, bottom: 400, width: 280, height: 200 }, 390, 844)).toBe(true);
    expect(rectOnScreen({ left: 400, right: 680, top: 200, bottom: 400, width: 280, height: 200 }, 390, 844)).toBe(false);
    expect(rectOnScreen({ left: -400, right: -120, top: 200, bottom: 400, width: 280, height: 200 }, 390, 844)).toBe(false);
    expect(rectOnScreen({ left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }, 390, 844)).toBe(false);
    expect(rectOnScreen(undefined, 390, 844)).toBe(false);
  });
});
