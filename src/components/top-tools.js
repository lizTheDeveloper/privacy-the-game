// The reading controls in the top bar of the mission screens (briefing, steps, report).
import { readingOffer, OFFER_LINES } from '../utils/reading-signals.js';
import { readLevelChosen, readAloudOn, READ_LEVELS, READ_LEVEL_LABELS, READ_LEVEL_SHORT } from '../utils/reading.js';
import { plainText } from '../utils/readability.js';

const attrEsc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Read it to me: a switch in the top bar on every mission screen (Liz 2026-11-17), next to More
// (components/hud.js), so it is never more than one tap away. Simple / Advanced mode and Focus
// music are in the More panel, on every screen (Liz 2026-11-20: one short top bar).
// say: what Read it to me reads, one string or the lines in order (the intel and Scout's line on
// a briefing, the step on a step screen, Scout and the questions on a report).
// level: kept for the callers; the mode switch is drawn by the top bar.
export function topTools(state, level, say, upcoming = []) {
  // Read it to me is a switch (Liz 2026-11-18): on, each mission screen is read as it comes.
  const aloud = readAloudOn(state);
  // Each line is its own recording of Scout (utils/read-aloud.js).
  const lines = (Array.isArray(say) ? say : [say]).map((t) => plainText(String(t ?? '')).trim()).filter(Boolean);
  // upcoming: what the next screens will read (the next steps), fetched ahead while the switch is on.
  const next = upcoming.map((t) => plainText(String(t ?? '')).trim()).filter(Boolean);
  return `<div class="read-tools top-tools" data-read-tools><button class="top-tool tt-switch${aloud ? ' is-on' : ''}" role="switch" aria-checked="${aloud}" data-action="read-aloud" data-say="${attrEsc(lines.join(' '))}" data-say-lines="${attrEsc(JSON.stringify(lines))}" data-say-next="${attrEsc(JSON.stringify(next))}" aria-label="Read it to me"><span class="tt-track" aria-hidden="true"><span class="tt-knob"></span></span> <span class="tt-long">Read it to me</span><span class="tt-short" aria-hidden="true">Read</span></button></div>`;
}

// Under the bar on a mission screen: the first time, Scout asks how much to read, with the two
// buttons right there; or he offers a mode or Read it to me when the player seems stuck. After
// that it is a quiet switch under More. Nothing about the choice leaves this browser
// (utils/reading.js).
export function readAsk(state) {
  const offer = readingOffer(state);
  if (offer) {
    return `<div class="read-ask read-offer" data-read-offer="${offer}"><img src="assets/characters/scout_0.png" alt="" width="24" height="24"> <span>${OFFER_LINES[offer].line}</span>
        <span class="read-offer-buttons"><button class="btn-secondary" data-action="read-offer" data-offer="${offer}" data-answer="yes">${OFFER_LINES[offer].yes}</button><button class="walk-link" data-action="read-offer" data-offer="${offer}" data-answer="no">No thanks</button></span></div>`;
  }
  if (readLevelChosen(state)) return '';
  const buttons = READ_LEVELS.map((l) => `<button type="button" class="read-level" data-action="read-level" data-level="${l}" aria-label="${READ_LEVEL_LABELS[l]}"><span class="tt-long">${READ_LEVEL_LABELS[l]}</span><span class="tt-short" aria-hidden="true">${READ_LEVEL_SHORT[l]}</span></button>`).join('');
  return `<div class="read-ask" data-read-ask><span>Simple mode or Advanced mode?</span> <span class="read-levels" role="group" aria-label="How much to read">${buttons}</span> <span>Change it under More any time.</span></div>`;
}
