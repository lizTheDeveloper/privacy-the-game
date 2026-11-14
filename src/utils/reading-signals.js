// Signs that a player wants fewer words, or more. They decide only one thing: whether Scout
// offers, once, to switch reading level. Scout never switches it for them.
//
// These counts are about how someone reads. That is personal, so they live in this browser's
// save and are never sent to analytics, never put in an error report, and never shown to anyone
// but the player (tests/reading-walkthrough.test.js checks the handlers and this module).
//
// Wanting fewer words: opening "Stuck?", skipping a step, asking Scout to read aloud.
// Wanting more: opening "Why it matters" on Short or Simplest.

import { readLevel } from './reading.js';

export const SIGNAL_KINDS = ['stuck', 'skip', 'readAloud', 'why'];
const OFFER_AFTER = { simpler: 3, full: 3 };

export function recordSignal(state, kind) {
  if (!SIGNAL_KINDS.includes(kind)) return state;
  const prev = state.readingSignals || {};
  return { ...state, readingSignals: { ...prev, [kind]: (prev[kind] || 0) + 1 } };
}

// 'simpler' | 'full' | null: what Scout should offer now, if anything.
export function readingOffer(state) {
  const s = state?.readingSignals || {};
  const offered = s.offered || {};
  const level = readLevel(state);
  const struggle = (s.stuck || 0) + (s.skip || 0) + (s.readAloud || 0);
  if (level !== 'simplest' && !offered.simpler && struggle >= OFFER_AFTER.simpler) return 'simpler';
  if (level !== 'full' && !offered.full && (s.why || 0) >= OFFER_AFTER.full) return 'full';
  return null;
}

// The player answered the offer (yes or no): it is not made again.
export function markOffered(state, which) {
  const prev = state.readingSignals || {};
  return { ...state, readingSignals: { ...prev, offered: { ...prev.offered, [which]: true } } };
}

export const OFFER_LINES = {
  simpler: {
    line: 'Want me to keep it short and simple from here? Fewer words, same missions. You can switch back any time.',
    yes: 'YES, SIMPLER',
    level: 'simplest',
  },
  full: {
    line: 'You keep opening the full intel. Want it shown up front every time?',
    yes: 'YES, FULL INTEL',
    level: 'full',
  },
};
