// Saints gallery: Scout's honor roll, in the spec's order. The candle is local
// only (state.candles); lighting one is never tracked or reported.
import { SAINTS } from '../data/interiors/saints.js';
import { renderHud } from '../components/hud.js';
import { isCandleLit } from '../utils/interior-state.js';
import { ACCOUNTS } from '../data/accounts.js';
import { hasInterior } from '../data/interiors/index.js';
import { deck } from '../components/deck.js';
import { saveNote } from '../components/browser-warning.js';
import { readLevel } from '../utils/reading.js';
import { seeEverything, simpleLead } from '../components/see-everything.js';

// Simple's one sentence. The gallery has no bright button: nothing here is a next step, and a
// candle is the player's own (lighting one is never tracked).
export const SAINTS_LEAD = 'These people told the world what was being watched, and many paid for it. Swipe to meet each one.';

export const SAINT_ORDER = ['swartz', 'snowden', 'klein', 'zimmermann', 'ellsberg', 'manning', 'drake', 'binney', 'poitras'];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// One button: pressed means lit. The words change too, so it never relies on the flame alone.
export function renderCandle(state, saint) {
  const lit = isCandleLit(state, saint.id);
  return `<button type="button" class="candle-btn${lit ? ' candle-btn--lit' : ''}" data-action="light-candle" data-saint="${esc(saint.id)}" aria-pressed="${lit}" aria-label="${lit ? 'Candle lit' : 'Light a candle'} for ${esc(saint.name)}"><span class="candle${lit ? ' candle--lit' : ''}" aria-hidden="true"></span><span class="candle-text">${lit ? 'Candle lit' : 'Light a candle'}</span></button>`;
}

function sources(list = []) {
  if (!list.length) return '';
  return `<details class="interior-sources"><summary>SOURCES · ${list.length}</summary>${list
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`)
    .join('')}</details>`;
}

// One saint: on a phone, one slide. The story waits behind "Their story"; at 900px
// and up it shows in full, as it always did (style.css, interiors slides).
function card(state, s) {
  return `
      <div class="saint-card" data-saint-card="${esc(s.id)}">
        <h2 class="saint-name">${esc(s.name)}</h2>
        <div class="dim alcove-title">${esc(s.title)} · ${esc(s.years)}</div>
        <div class="alcove-tribute"><span>Scout: “${esc(s.tribute)}”</span></div>
        <details class="saint-story" data-fold="saint-story-${esc(s.id)}" data-open-desktop><summary>Their story</summary><div class="alcove-story">${esc(s.story)}</div>
        ${sources(s.sources)}</details>
        ${s.id === 'snowden' ? '<a class="saint-prism" href="#/prism" style="display: inline-flex; align-items: center; min-height: 44px; margin: 4px 0; font-family: var(--font-mono); font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #FF2D9B; text-decoration: none;">◈ PRISM MAP →</a>' : ''}
        ${renderCandle(state, s)}
      </div>`;
}

// Back to the building the player came from (app memory, never the URL),
// else the city.
function backLink(state, from) {
  if (from && hasInterior(from) && ACCOUNTS[from] && state.accounts?.[from]?.enabled) {
    return `<a class="btn-secondary interior-back" href="#/building/${esc(from)}">← ${esc(ACCOUNTS[from].name.toUpperCase())}</a>`;
  }
  return '<a class="btn-secondary interior-back" href="#/city">← CITY</a>';
}

// The gallery's back link target, kept by app.js in memory (never in the URL) across draws:
// the building it was opened from; kept while the gallery re-draws; gone on leaving it.
export function saintsOrigin(route, lastRoute, current = null) {
  if (route?.screen !== 'saints') return null;
  if (lastRoute?.screen === 'building') return lastRoute.params?.id ?? null;
  return current;
}

export function renderSaints(state, { from = null } = {}) {
  const saints = SAINT_ORDER.map((id) => SAINTS[id]).filter(Boolean);
  const simple = readLevel(state) === 'simplest';
  const candles = `<details class="phone-fold" data-fold="saints-candles" data-open-desktop><summary>About candles</summary><div class="dim interior-note">${saveNote('candles')} Nothing here is sent anywhere.</div></details>`;
  return `
  <div class="scanlines">
    ${renderHud(state)}
    <div class="interior saints" data-saints>
      ${backLink(state, from)}
      <div class="interior-title">SAINTS</div>
      ${simple ? simpleLead(SAINTS_LEAD) : `<div class="interior-sub">People whose work made this map knowable</div>
      ${candles}`}
      ${deck(saints.map((s) => ({ html: card(state, s) })), { label: 'Saints', className: 'saints-deck', names: saints.map((s) => s.name) })}
      ${simple ? seeEverything('saints', `<div class="interior-sub">People whose work made this map knowable</div><div class="dim interior-note" style="margin-top: 8px;">About candles: ${saveNote('candles')} Nothing here is sent anywhere.</div>`) : ''}
    </div>
  </div>`;
}
