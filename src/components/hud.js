import { calcIntegrity, calcExposure } from '../utils/calc.js';
import { isCabinetMode } from '../utils/cabinet.js';
import { displayStreak } from '../state.js';
import { readLevel, READ_LEVELS, READ_LEVEL_LABELS } from '../utils/reading.js';
import { isPlaying } from '../utils/focus-music.js';
import { readAsk } from './top-tools.js';
import { bugButtonHtml } from './bug-reporter.js';

// Link home to the studio. The utm tags let the studio site count visits from the game.
export const STUDIO_URL = 'https://multiversegames.ai/?utm_source=reclaim-city&utm_medium=game&utm_content=';

const STRIPE_URL = 'https://buy.stripe.com/6oU8wOa387If097aKl6c00o';
const PATREON_URL = 'https://www.patreon.com/lizthedeveloper';

// ---------- The top bar (Liz 2026-11-20: "one short top bar, the same on every screen") ----------
// One row, about 56px on a phone, the same on every screen:
//   the name | the way on | (Read it to me, on the screens it can read) | More
// The way on is What's next in Simple mode and a small progress chip in Advanced mode (empty on
// mission screens, which have their own Back and their own next step, and on What's next itself).
// More opens a panel with everything else, nothing taken away: Simple / Advanced mode, Focus
// music, Report a bug, Support us and Patreon (not inside the campus cabinet), and the studio.
// Simple mode has no scores in the bar; Advanced mode has a thin strip of them under it that
// scrolls away with the page.
//
// tools: a mission screen's Read it to me switch (components/top-tools.js), kept in the bar so it
// is never more than one tap away. nextLink: false on screens that are already the way on.
// quietNext: the page's own bright button goes where What's next goes (the city, a milestone),
// so What's next is a quiet outline there. stats: false where the scores would read wrong (a
// LIBERATED district still has a low city INTEGRITY).

// The More panel stays open across a re-draw (switching mode re-draws the screen), and closes on a
// tap outside it, Escape, or going to another screen (initHudMenu).
let menuOpen = false;
export const hudMenuOpen = () => menuOpen;

function wayOn(state, { tools, nextLink, quietNext }) {
  if (tools || !nextLink) return '';
  if (readLevel(state) === 'simplest') {
    return `<a class="hud-next${quietNext ? ' hud-next--quiet' : ''}" href="#/next">What’s next &#9654;</a>`;
  }
  // Advanced: how much of the city is taken back, as a tiny bar, and the way to What's next.
  const pct = calcIntegrity(state);
  return `<a class="hud-progress${quietNext ? ' hud-next--quiet' : ''}" href="#/next" aria-label="What’s next. The city is ${pct}% taken back." title="What’s next"><span class="hud-progress-bar" aria-hidden="true"><span style="width: ${pct}%"></span></span><span class="hud-progress-pct" aria-hidden="true">${pct}%</span><span class="hud-progress-go" aria-hidden="true">&#9654;</span></a>`;
}

// Advanced mode's scores: one thin line under the bar, in the page (not pinned).
function statStrip(state) {
  return `<div class="hud-stats">
      <span class="hud-stat hud-stat--lime"><span class="stat-value">${calcIntegrity(state)}%</span> <span class="stat-label">INTEGRITY</span></span>
      <span class="hud-stat hud-stat--magenta"><span class="stat-value">${calcExposure(state)}</span> <span class="stat-label">EXPOSURE</span></span>
      <span class="hud-stat hud-stat--amber"><span class="stat-value">${displayStreak(state)}d</span> <span class="stat-label">STREAK</span></span>
    </div>`;
}

function menuPanel(state) {
  const level = readLevel(state);
  const playing = isPlaying();
  const modes = READ_LEVELS.map((l) => `<button type="button" class="read-level${l === level ? ' is-on' : ''}" data-action="read-level" data-level="${l}" aria-pressed="${l === level}">${READ_LEVEL_LABELS[l]}</button>`).join('');
  // Web cabinet (campus iframe): no real-money asks.
  const money = isCabinetMode() ? '' : `
        <a class="hud-menu-item hud-support-link" href="${STRIPE_URL}" target="_blank" rel="noopener"><span class="hud-dollar" aria-hidden="true">$</span>Support us</a>
        <a class="hud-menu-item hud-patreon" href="${PATREON_URL}" target="_blank" rel="noopener">Or any amount on Patreon</a>`;
  return `<div class="hud-menu" id="hud-menu" data-hud-menu${menuOpen ? '' : ' hidden'}>
        <div class="hud-menu-modes" role="group" aria-label="Simple mode or Advanced mode"><div class="read-levels">${modes}</div></div>
        <button type="button" class="hud-menu-item" data-action="focus-music" aria-pressed="${playing}"><span aria-hidden="true">&#9835;</span> Focus music${playing ? ' (on)' : ''}</button>
        ${bugButtonHtml()}${money}
        <a class="hud-menu-item hud-studio" href="${STUDIO_URL}hud" target="_blank" rel="noopener" data-studio-link="hud">Reclaim City is by Multiverse Games&nbsp;&#8599;</a>
      </div>`;
}

export function renderHud(state, { tools = '', nextLink = true, quietNext = false, stats = true } = {}) {
  // Focus music plays on through every screen (Liz 2026-11-19): while it is on, the bar can stop it.
  const music = isPlaying() ? '<button type="button" class="hud-music" data-action="focus-music" aria-pressed="true" aria-label="Focus music (on): stop" title="Focus music is on. Click to stop."><span aria-hidden="true">&#9835;</span></button>' : '';
  const strip = stats && readLevel(state) === 'full' ? statStrip(state) : '';
  const ask = tools ? readAsk(state) : '';
  return `
  <header class="hud${tools ? ' hud--tools' : ''}" data-hud>
    <div class="hud-bar">
      <div class="hud-brand">RECLAIM CITY<span class="hud-tagline"> TAKE BACK YOUR DATA</span></div>
      <div class="hud-way">${wayOn(state, { tools, nextLink, quietNext })}</div>
      <div class="hud-end">
        ${music}${tools}
        <div class="hud-more-wrap">
          <button type="button" class="hud-more" data-hud-more aria-expanded="${menuOpen}" aria-controls="hud-menu">More <span class="hud-more-caret" aria-hidden="true">&#9662;</span></button>
          ${menuPanel(state)}
        </div>
      </div>
    </div>${strip ? `
    ${strip}` : ''}${ask ? `
    <div class="hud-ask">${ask}</div>` : ''}
  </header>`;
}

// Support us, said quietly where something just went right (a district LIBERATED, a report filed):
// a text link, never a second bright button. Nothing inside the campus cabinet.
export function supportNote(from) {
  if (isCabinetMode()) return '';
  return `<div class="support-note" data-support-note="${from}"><span class="support-note-ask">Like what you’re doing here?</span> <a class="support-note-link" href="${STRIPE_URL}" target="_blank" rel="noopener">Support us</a> <a class="support-note-link" href="${PATREON_URL}" target="_blank" rel="noopener">or give any amount on Patreon</a></div>`;
}

// The More panel's open and close: a real disclosure. The button says aria-expanded; a tap outside
// the panel, Escape, or another screen closes it (Escape puts focus back on the button). doc: the
// document (a test passes a stand-in).
export function initHudMenu(doc = globalThis.document, win = globalThis.window) {
  const sync = (focusButton = false) => {
    for (const btn of doc.querySelectorAll('[data-hud-more]')) {
      btn.setAttribute('aria-expanded', String(menuOpen));
      if (focusButton) btn.focus();
    }
    for (const panel of doc.querySelectorAll('[data-hud-menu]')) panel.hidden = !menuOpen;
  };
  const close = (focusButton = false) => {
    if (!menuOpen) return;
    menuOpen = false;
    sync(focusButton);
  };
  doc.addEventListener('click', (e) => {
    const t = e.target;
    if (t?.closest?.('[data-hud-more]')) {
      menuOpen = !menuOpen;
      sync();
      return;
    }
    if (!menuOpen) return;
    // A link in the panel leaves (or opens a new tab); the bug report opens its own dialog.
    if (t?.closest?.('[data-hud-menu] a, [data-hud-menu] [data-bug-report]')) { close(); return; }
    if (!t?.closest?.('[data-hud-menu]')) close();
  });
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) close(true);
  });
  win?.addEventListener?.('hashchange', () => close());
}

// For tests: start closed.
export function _resetHudMenu() {
  menuOpen = false;
}
