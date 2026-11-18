// The reading controls in the top bar of the mission screens (briefing, steps, report).
import { isPlaying } from '../utils/focus-music.js';
import { readingOffer, OFFER_LINES } from '../utils/reading-signals.js';
import { readLevelChosen, READ_LEVELS, READ_LEVEL_LABELS } from '../utils/reading.js';
import { plainText } from '../utils/readability.js';

const attrEsc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// How much to read, Read it to me and Focus music: in the top bar on every mission screen (Liz
// 2026-11-17). The first time, Scout asks how much to read just under them; after that it is a
// quiet switch. Nothing about the choice leaves this browser (utils/reading.js).
// say: what Read it to me reads, one string or the lines in order (the intel and Scout's line on
// a briefing, the step on a step screen, Scout and the questions on a report).
export function topTools(state, level, say) {
  const playing = isPlaying();
  // Each line is its own recording of Scout (utils/read-aloud.js).
  const lines = (Array.isArray(say) ? say : [say]).map((t) => plainText(String(t ?? '')).trim()).filter(Boolean);
  const offer = readingOffer(state);
  const ask = offer
    ? `<div class="read-ask read-offer" data-read-offer="${offer}"><img src="assets/characters/scout_0.png" alt="" width="24" height="24"> <span>${OFFER_LINES[offer].line}</span>
        <span class="read-offer-buttons"><button class="btn-secondary" data-action="read-offer" data-offer="${offer}" data-answer="yes">${OFFER_LINES[offer].yes}</button><button class="walk-link" data-action="read-offer" data-offer="${offer}" data-answer="no">No thanks</button></span></div>`
    : readLevelChosen(state)
    ? ''
    : '<div class="read-ask" data-read-ask>How much do you want to read? Change it here any time.</div>';
  const buttons = READ_LEVELS.map((l) => `<button class="read-level${l === level ? ' is-on' : ''}" data-action="read-level" data-level="${l}" aria-pressed="${l === level}">${READ_LEVEL_LABELS[l]}</button>`).join('');
  return `<div class="read-tools top-tools" data-read-tools>
        <div class="top-tools-row">
          <div class="read-levels" role="group" aria-label="How much to read">${buttons}</div>
          <button class="top-tool" data-action="read-aloud" data-say="${attrEsc(lines.join(' '))}" data-say-lines="${attrEsc(JSON.stringify(lines))}" aria-label="Read it to me"><span aria-hidden="true">&#128266;</span> <span class="tt-long">Read it to me</span><span class="tt-short" aria-hidden="true">Read</span></button>
          <button class="top-tool" data-action="focus-music" aria-pressed="${playing}" aria-label="Focus music${playing ? ' (on)' : ''}"><span aria-hidden="true">&#9835;</span> <span class="tt-long">Focus music${playing ? ' (on)' : ''}</span><span class="tt-short" aria-hidden="true">Music</span></button>
        </div>
        ${ask}
      </div>`;
}
