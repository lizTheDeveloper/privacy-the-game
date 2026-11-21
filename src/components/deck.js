// A slide deck for phones. Under 900px the deck is a horizontal scroll-snap row
// with BACK / NEXT, dots and a "2 of 5" count; at 900px and up the slides are
// ordinary stacked blocks and the controls are hidden (all in style.css).
// The deck changes no hash and sends nothing to track().

// ---------------------------------------------------------------------------
// splitWords: whole sentences, grouped into chunks of at most `max` words.

const TOKEN = /<[^<>]*>|&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);|\s+|[^<&\s]+|[<&]/g;
const ENTITY = /&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g;
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
// Quote entities stand for their characters when reading a word; any other entity is opaque.
const QUOTE_ENTITY = { rdquo: '”', rsquo: '’', raquo: '»', ldquo: '“', lsquo: '‘', laquo: '«', quot: '"', apos: "'", '#39': "'", '#8217': '’', '#8221': '”' };
// A stop after these is not a sentence end. Initials (U.S., e.g., i.e., J.) are caught by pattern.
const ABBREVIATIONS = new Set(['vs', 'inc', 'no', 'mr', 'mrs', 'ms', 'dr', 'st', 'jr', 'sr', 'ltd', 'co', 'corp', 'ch', 'approx', 'fig', 'vol', 'dept', 'govt', 'mt', 'ft', 'jan', 'feb', 'mar', 'apr', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec']);

const tokenKind = (t) => {
  if (/^\s/.test(t)) return 'ws';
  if (t.length > 1 && t[0] === '<' && t.at(-1) === '>') return 'tag';
  if (t.length > 2 && t[0] === '&' && t.at(-1) === ';') return 'ent';
  return 'text';
};

// +1 for an opening element, -1 for a closing one, 0 for void/self-closing/comments.
function tagDepth(tag) {
  if (/^<[!?]/.test(tag) || /\/>$/.test(tag)) return 0;
  const m = tag.match(/^<(\/?)([a-zA-Z][\w-]*)/);
  if (!m || VOID.has(m[2].toLowerCase())) return 0;
  return m[1] ? -1 : 1;
}

// What a reader sees of a token: tags vanish, quote entities are quotes, other entities a placeholder.
function visible(t) {
  const kind = tokenKind(t);
  if (kind === 'tag') return '';
  if (kind === 'ent') return QUOTE_ENTITY[t.slice(1, -1)] ?? '\u0001';
  return t;
}

function endsSentence(word) {
  if (!/[.!?]["'”’»)\]]*$/.test(word)) return false;
  const core = word.replace(/["'”’»)\]]+$/, '').replace(/^["'“‘«(\[]+/, '');
  if (!core.endsWith('.')) return true; // ! and ? always end one.
  if (/^(?:[a-zA-Z]\.)+$/.test(core)) return false; // U.S., e.g., J.
  return !ABBREVIATIONS.has(core.slice(0, -1).toLowerCase());
}

export function countWords(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(ENTITY, '')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function splitWords(html, max = 35) {
  const text = String(html ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const tokens = text.match(TOKEN);
  // Cut points: after a space that follows a sentence end, outside any element.
  const sentences = [];
  let start = 0;
  let depth = 0;
  let wordStart = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const kind = tokenKind(t);
    if (kind === 'tag') depth = Math.max(0, depth + tagDepth(t));
    if (kind !== 'ws') continue;
    const word = tokens.slice(wordStart, i).map(visible).join('');
    wordStart = i + 1;
    if (depth > 0 || !endsSentence(word)) continue;
    // A lowercase start is the same sentence ("just... so", "etc. and").
    const next = tokens.slice(i + 1).map(visible).join('').replace(/^[\s"'“‘«(\[\u0001]+/, '');
    if (/^\p{Ll}/u.test(next)) continue;
    sentences.push(tokens.slice(start, i + 1).join(''));
    start = i + 1;
  }
  if (start < tokens.length) sentences.push(tokens.slice(start).join(''));

  const chunks = [];
  let chunk = '';
  let n = 0;
  for (const s of sentences) {
    const w = countWords(s);
    if (chunk && n + w > max) {
      chunks.push(chunk);
      chunk = '';
      n = 0;
    }
    chunk += s;
    n += w;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

// ---------------------------------------------------------------------------
// deck: the markup. The APG carousel: the deck a named region, each slide a group (not a
// landmark of its own).

const attr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const headingHtml = (heading) => (heading ? `<h3 class="slide-heading">${heading}</h3>` : '');

const DOTS_MAX = 8;

export function progressWidth(index, count) {
  return `${((index + 1) / count) * 100}%`;
}

// names: one per slide. Each dot is then a button labelled with its name (a screen reader
// hears the name; a tap goes there), on its own row, even past DOTS_MAX. On screen it is a dot
// (letters like "AS" meant nothing to a reader), with "1 of 9" beside BACK / NEXT.
export function deck(slides, { label, className = '', names = null } = {}) {
  const list = (slides || []).filter(Boolean);
  if (list.length === 0) return '';
  // One slide needs no deck: its content, as it is.
  if (list.length === 1) return headingHtml(list[0].heading) + list[0].html;
  const m = list.length;
  const cls = ['deck', className].filter(Boolean).join(' ');
  const sections = list
    .map((s, i) => `<section class="${attr(['slide', s.className].filter(Boolean).join(' '))}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${m}" tabindex="-1">${headingHtml(s.heading)}${s.html}</section>`)
    .join('');
  const named = Array.isArray(names) && names.length === m;
  const dots = named
    ? list.map((_, i) => `<button type="button" class="deck-dot deck-dot--named${i === 0 ? ' is-current' : ''}" data-deck-to="${i}" aria-label="${attr(names[i])}"${i === 0 ? ' aria-current="true"' : ''}><span class="deck-dot-mark" aria-hidden="true"></span></button>`).join('')
    : list.map((_, i) => `<span class="deck-dot${i === 0 ? ' is-current' : ''}"></span>`).join('');
  // Past DOTS_MAX slides the dots wrap; a thin bar says the same thing in one line.
  const progress = named
    ? `<span class="deck-dots deck-dots--named">${dots}</span>`
    : m > DOTS_MAX
      ? `<span class="deck-progress" aria-hidden="true"><span class="deck-progress-fill" style="width: ${progressWidth(0, m)}"></span></span>`
      : `<span class="deck-dots" aria-hidden="true">${dots}</span>`;
  return `<div class="${attr(cls)}" data-deck role="region" aria-roledescription="carousel" aria-label="${attr(label)}">${sections}</div>`
    + `<div class="deck-controls${named ? ' deck-controls--named' : ''}" data-deck-controls>`
    + '<button type="button" class="deck-btn" data-deck-prev disabled>BACK</button>'
    + progress
    + `<span class="deck-count" aria-live="polite">1 of ${m}</span>`
    + '<button type="button" class="deck-btn" data-deck-next>NEXT</button>'
    + '</div>';
}

// ---------------------------------------------------------------------------
// initDecks: the behaviour. Pure helpers first, so they test without a DOM.

export function slideIndex(scrollLeft, width, count) {
  if (!(width > 0) || !(count > 0)) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / width)));
}

export function deckStep(key) {
  return key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
}

// The deck's height for the slide on screen: only a phone row follows its slide.
export function deckHeight(slideHeight, isRow) {
  return isRow && slideHeight > 0 ? `${Math.ceil(slideHeight)}px` : '';
}

// Where focus goes after a move: a BACK / NEXT press keeps it on the button (keyboard users
// press again), unless that button is now disabled; an arrow key moves it to the slide heading.
export function focusAfter(via, pressedDisabled) {
  return via === 'button' && !pressedDisabled ? 'button' : 'heading';
}

// Some of this box is inside a w×h viewport: not hidden, not a slide scrolled out of its deck.
export function rectOnScreen(r, w, h) {
  return !!r && r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < w && r.top < h;
}

export function controlState(index, count) {
  return { prevDisabled: index <= 0, nextDisabled: index >= count - 1, count: `${index + 1} of ${count}` };
}

// The slide a BACK / NEXT / arrow press moves to. Steps from the slide already being
// scrolled to, so two quick taps move two slides.
export function stepTarget(target, current, step, count) {
  const from = target ?? current;
  return Math.min(count - 1, Math.max(0, from + step));
}

// The slide to show while scrolling. During a programmatic scroll the target wins (the
// half-way scroll position would pull the count back); it settles once the scroll is there.
export function resolveIndex(target, scrollLeft, width, count) {
  const atScroll = slideIndex(scrollLeft, width, count);
  if (target == null) return { index: atScroll, settled: true };
  return { index: target, settled: !(width > 0) || Math.abs(scrollLeft - target * width) < 2 };
}

// Scroll a deck without the CSS smooth behaviour (a redraw restoring its slide).
function jumpTo(d, left) {
  const before = d.style?.scrollBehavior ?? '';
  if (d.style) d.style.scrollBehavior = 'auto';
  if (d.scrollTo) d.scrollTo({ left, behavior: 'instant' });
  else d.scrollLeft = left;
  if (d.style) d.style.scrollBehavior = before;
}

const reducedMotion = () => {
  try {
    return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const typing = (el) => !!el?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');

// Where each deck under root is, by label: a re-draw of the same screen keeps its slide.
// Labels are the key, so every deck on one screen needs its own aria-label.
export function deckPositions(root) {
  const out = new Map();
  for (const d of root?.querySelectorAll?.('[data-deck]') ?? []) {
    const label = d.getAttribute?.('aria-label');
    const n = d.querySelectorAll(':scope > .slide').length;
    if (label) out.set(label, slideIndex(d.scrollLeft, d.clientWidth, n));
  }
  return out;
}

export function initDecks(root, positions = null) {
  if (!root?.querySelectorAll) return;
  for (const d of root.querySelectorAll('[data-deck]')) {
    if (d.dataset.deckReady) continue;
    d.dataset.deckReady = '1';
    const slides = [...d.querySelectorAll(':scope > .slide')];
    const controls = d.nextElementSibling?.hasAttribute?.('data-deck-controls') ? d.nextElementSibling : null;
    if (!controls || slides.length < 2) continue;
    const n = slides.length;
    const prev = controls.querySelector('[data-deck-prev]');
    const next = controls.querySelector('[data-deck-next]');
    const count = controls.querySelector('[aria-live]');
    const dots = [...controls.querySelectorAll('.deck-dot')];
    const fill = controls.querySelector('.deck-progress-fill');
    let current = -1;
    let target = null; // the slide a programmatic scroll is heading to
    let settleTimer = 0;

    // Only a phone-width deck is a row; at desktop width the slides are blocks and keys do nothing.
    const isRow = () => d.scrollWidth > d.clientWidth + 1;
    // The height follows the slide only once the scroll has landed: mid-swipe the controls
    // would jump, and shrinking early clips the slide still scrolling out.
    const fit = () => {
      if (d.style && current >= 0) d.style.height = deckHeight(slides[current]?.offsetHeight, isRow());
    };
    // Heading to a taller slide: grow now so it arrives whole (fit trims it on landing).
    const grow = (to) => {
      if (!d.style || !isRow()) return;
      const h = Math.max(parseFloat(d.style.height) || 0, slides[to]?.offsetHeight || 0);
      d.style.height = deckHeight(h, true);
    };
    let fitTimer = 0;
    const fitWhenStill = () => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fit, 150);
    };
    const show = (i) => {
      if (i === current) return;
      current = i;
      if (fill?.style) fill.style.width = progressWidth(i, n);
      const s = controlState(i, n);
      if (prev) prev.disabled = s.prevDisabled;
      if (next) next.disabled = s.nextDisabled;
      if (count) count.textContent = s.count;
      dots.forEach((dot, k) => {
        dot.classList.toggle('is-current', k === i);
        if (dot.dataset?.deckTo == null) return;
        if (k === i) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute?.('aria-current');
      });
    };
    // The scroll is over (scrollend, or the fallback timer): the position is the truth again.
    const settle = () => {
      clearTimeout(settleTimer);
      target = null;
      show(slideIndex(d.scrollLeft, d.clientWidth, n));
      fit();
    };
    const go = (step, pressed = null) => goTo(stepTarget(target, current, step, n), pressed);
    const goTo = (to, pressed = null) => {
      if (!(to >= 0 && to < n) || to === (target ?? current)) return;
      target = to;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 1000);
      grow(to);
      d.scrollTo?.({ left: to * d.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
      show(to);
      if (focusAfter(pressed ? 'button' : 'key', !!pressed?.disabled) === 'button') {
        pressed.focus?.({ preventScroll: true });
        return;
      }
      const slide = slides[to];
      const heading = slide.querySelector('h1, h2, h3, h4, h5, h6') || slide;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus?.({ preventScroll: true });
    };

    prev?.addEventListener('click', () => go(-1, prev));
    next?.addEventListener('click', () => go(1, next));
    for (const dot of dots) {
      if (dot.dataset?.deckTo != null) dot.addEventListener('click', () => goTo(Number(dot.dataset.deckTo), dot));
    }
    const onKey = (e) => {
      const step = deckStep(e.key);
      if (!step || e.altKey || e.ctrlKey || e.metaKey || typing(e.target) || !isRow()) return;
      e.preventDefault();
      go(step);
    };
    d.addEventListener('keydown', onKey);
    controls.addEventListener('keydown', onKey);
    let frame = 0;
    d.addEventListener('scroll', () => {
      if (frame) return;
      const raf = globalThis.requestAnimationFrame || ((f) => setTimeout(f, 16));
      frame = raf(() => {
        frame = 0;
        const r = resolveIndex(target, d.scrollLeft, d.clientWidth, n);
        if (r.settled && target != null) settle();
        else {
          show(r.index);
          if (target == null) fitWhenStill(); // a swipe: fit once it stops
        }
      });
    }, { passive: true });
    // A scroll that another tap cut short can end off target: only the target settles it
    // (the timer catches a swipe that took over).
    d.addEventListener('scrollend', () => {
      if (target != null && resolveIndex(target, d.scrollLeft, d.clientWidth, n).settled) settle();
      else if (target == null) {
        clearTimeout(fitTimer);
        fit();
      }
    });

    // A redraw keeps its slide: jump there with no animation, and draw the count for it
    // now (this runs before the first paint, so "1 of N" never shows).
    const kept = Math.min(positions?.get?.(d.getAttribute?.('aria-label')) ?? 0, n - 1);
    if (kept > 0) jumpTo(d, kept * d.clientWidth);
    show(kept > 0 ? kept : slideIndex(d.scrollLeft, d.clientWidth, n));
    fit();
    // A slide that changes size (a resize, a font arriving, a <details> opened) refits the deck;
    // so does crossing to or from desktop width, where the height is cleared.
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => {
        if (d.isConnected === false) return ro.disconnect(); // a redraw replaced this deck
        if (target == null) fit();
      });
      for (const s of slides) ro.observe(s);
    }
  }
}

// ---------------------------------------------------------------------------
// Folds: a <details data-fold="key"> the player opened stays open when the same
// screen re-draws (lighting a candle, adding a device). Keys are unique per screen.

export function openFolds(root) {
  const out = new Set();
  for (const d of root?.querySelectorAll?.('details[data-fold]') ?? []) {
    if (d.open) out.add(d.getAttribute('data-fold'));
  }
  return out;
}

export function restoreFolds(root, keys) {
  if (!keys?.size) return;
  for (const d of root?.querySelectorAll?.('details[data-fold]') ?? []) {
    if (keys.has(d.getAttribute('data-fold'))) d.open = true;
  }
}

// ---------------------------------------------------------------------------
// Open on desktop: a <details data-open-desktop> is closed on a phone and open
// from 900px, set by script after every render and on a breakpoint change (no
// ::details-content, which older browsers lack). From 900px every one is open,
// whatever the player did: its summary is hidden there, so a closed one would be
// out of reach. Under 900px one the player opened or closed by hand this screen
// visit keeps that choice (`hand`: key -> open), kept too across a trip to
// desktop width and back (a rotation).

// A building floor is keyed by its floor id: saving one floor drops it from the list, and an
// index key would then hand its choice to the next floor down.
export function desktopFoldKey(d, index) {
  const floor = d.getAttribute('data-floor');
  return d.getAttribute('data-fold') || (floor ? `floor-${floor}` : `${(d.getAttribute('class') || '').split(/\s+/)[0]}#${index}`);
}

export function applyOpenDesktop(root, wide, hand = new Map()) {
  const list = [...(root?.querySelectorAll?.('details[data-open-desktop]') ?? [])];
  list.forEach((d, i) => {
    const key = desktopFoldKey(d, i);
    const want = wide ? true : hand.has(key) ? hand.get(key) : false;
    d.dataset.autoOpen = want ? '1' : '0';
    if (d.open !== want) d.open = want;
  });
}

// From a toggle event: a state the script didn't set is the player's.
export function recordHandToggle(d, index, hand) {
  if (d.dataset.autoOpen === (d.open ? '1' : '0')) return;
  hand.set(desktopFoldKey(d, index), d.open);
  d.dataset.autoOpen = d.open ? '1' : '0';
}
