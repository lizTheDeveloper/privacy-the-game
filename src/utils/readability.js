// How hard a piece of copy is to read. Used by the readability tests (the ratchet in
// tests/readability.test.js) and by the reading signals, which need a word count.
//
// Most US adults read at PIAAC literacy Level 2 or 3, and many lose their place in a
// multi-step task (Liz, 2026-11-13). These measures keep the copy honest about that.

// Markup and entities out, so a link's href or an &mdash; isn't counted as words.
export function plainText(html = '') {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function words(text = '') {
  return plainText(text).match(/[A-Za-z0-9][A-Za-z0-9’'&.-]*/g) || [];
}

// A syllable estimate good enough to rank copy (the usual vowel-group count).
export function syllables(word) {
  let w = String(word).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

// Flesch-Kincaid grade level. A single line with no full stop counts as one sentence.
export function fkGrade(text) {
  const t = plainText(text);
  const ws = words(t).filter((w) => /[a-z]/i.test(w));
  if (!ws.length) return 0;
  const sentences = Math.max(1, (t.match(/[.!?]+(\s|$)/g) || []).length);
  const syl = ws.reduce((n, w) => n + syllables(w), 0);
  return 0.39 * (ws.length / sentences) + 11.8 * (syl / ws.length) - 15.59;
}

// A step that asks for a second action: a second sentence, a "; " or a "then" that starts
// with a doing word ("Open the app. Tap Delete.", "Download it, then revoke the apps").
// A sentence that only explains is not a second action, and a menu path
// (Settings → Privacy → Ads) is one action, shown as chips. "Same address as…? Then…" and
// "If …, then …" are a choice, not a second action.
const DOING = 'open|tap|click|go|turn|select|set|delete|remove|check|review|enter|type|change|add|find|look|save|download|sign|log|choose|pick|scroll|search|copy|paste|write|print|request|submit|fill|create|confirm|disable|enable|toggle|revoke|end|unlink|archive|hide|clear|pause|use|install|call|email|ask|repeat|visit|filter|read|note|verify|switch';
const SECOND_ACTION = new RegExp(`(?:[.!?]\\s+|;\\s+|,?\\s+(?:and\\s+)?then\\s+)(?:${DOING})\\b`, 'i');
export function isCompoundStep(text) {
  const t = plainText(text);
  if (/^(same address|if |no account|signed in\?)/i.test(t)) return false;
  // An aside in brackets ("(or on iPhone: Settings → your name, then scroll down)") is not a second step.
  return SECOND_ACTION.test(t.replace(/\([^)]*\)/g, ''));
}

// The words of `text` that are not in the allowed set (lower-cased). Quoted on-screen
// labels ('Manage connected apps', “Turn off”) are allowed as they are: the player has to
// match them to their screen. Numbers and simple word endings are allowed.
export function wordsOutside(text, allowed) {
  // A quote opens after a space or bracket and closes before one, so "don't" is no quote.
  const unquoted = plainText(text).replace(/(^|[\s(])[‘'“"][^‘'’“"”]{1,60}[’'”"](?=[\s.,;:!?)]|$)/g, '$1 ');
  const out = [];
  for (const raw of unquoted.match(/[A-Za-z0-9][A-Za-z0-9’'-]*/g) || []) {
    const w = raw.toLowerCase().replace(/’/g, "'");
    if (/^[0-9]+$/.test(w)) continue;
    if (!knownWord(w, allowed)) out.push(w);
  }
  return [...new Set(out)];
}

function knownWord(w, allowed) {
  if (allowed.has(w)) return true;
  if (w.includes('-')) return w.split('-').every((p) => !p || knownWord(p, allowed));
  const bases = [
    w.replace(/'s$/, ''), w.replace(/n't$/, ''), w.replace(/'(re|ll|ve|d|m)$/, ''),
    w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ies$/, 'y'),
    w.replace(/ed$/, ''), w.replace(/d$/, ''), w.replace(/ied$/, 'y'), w.replace(/([a-z])\1ed$/, '$1'),
    w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/([a-z])\1ing$/, '$1'),
    w.replace(/er$/, ''), w.replace(/r$/, ''), w.replace(/est$/, ''), w.replace(/ly$/, ''),
  ];
  return bases.some((b) => b && b !== w && allowed.has(b));
}

// The grade of a sentence with its names taken out (Microsoft, ProtonMail, Login.gov): the
// player reads those off their own screen, so they shouldn't make a line count as harder.
export function fkGradeWithoutNames(text) {
  const masked = plainText(text)
    .replace(/\b[\w-]+\.(gov|com|org|me|io)\b/gi, 'it')
    .replace(/\b[a-z]+[A-Z][\w’'-]*/g, 'it')
    .replace(/(^|[^.!?]\s)([A-Z][\w’'&-]*(\s[A-Z][\w’'&-]*)*)/g, (m, pre) => `${pre}it`);
  return fkGrade(masked);
}
