// "Every string still reaches the page", checked against the data itself rather than a frozen
// snapshot: a string from the data modules (missions, dialogue, interiors, saints, quests…) that
// a screen draws must be in its text. A copy edit in the data moves both sides together.
import { expect } from 'vitest';
import { splitWords } from '../../src/components/deck.js';

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', middot: '·', rarr: '→', larr: '←' };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);

// The text a reader meets: tags gone, entities read, whitespace normalised.
export function textOf(html) {
  return decode(String(html ?? '')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

// What a phone shows: without the desktop-only copies (a .desktop-only block is followed by its
// .phone-only twin, on Quick Quest and the surveys).
export const phoneHtml = (html) => String(html).replace(/<div class="desktop-only[\s\S]*?(?=<div class="phone-only)/g, ' ');

// The string is on the page whole, or (split onto slides or behind a fold) sentence by sentence, in order.
export function onPage(html, str, label = '') {
  // Case is the stylesheet's or a label's business (some labels are drawn in capitals).
  const page = textOf(html).toLowerCase();
  const want = textOf(str).toLowerCase();
  if (!want || page.includes(want)) return;
  let from = 0;
  for (const s of splitWords(String(str), 1)) {
    const t = textOf(s).toLowerCase();
    if (!t) continue;
    const at = page.indexOf(t, from);
    expect(at, `${label}: ${t.slice(0, 90)}`).toBeGreaterThanOrEqual(0);
    from = at + t.length;
  }
}
