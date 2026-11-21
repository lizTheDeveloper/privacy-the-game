// The Big Check: an optional checklist of every broker the player's missions and sweeps don't
// reach. Pure: (state, data) in, markup out. Ticks are saved in the game only (app.js), never
// tracked or put in the URL; the filter is in-place DOM work in app.js. The root's class
// `big-check` is in PRIVATE_UI (errorNoise.js), and no broker id or name goes in an id, name or
// title attribute.
import { renderHud } from '../components/hud.js';
import { smallScout } from '../components/scout.js';
import { optOutBlock, ownedRoutesBlock, bigCheckTick, TICK_CSS } from '../components/star-card.js';
import { brokerDataStatusBlock } from './broker-map.js';
import { brokerLighting } from '../utils/broker-lighting.js';
import { bigCheckGroups, filterBigCheck } from '../utils/big-check.js';
import { MISSIONS } from '../data/missions.js';
import { localDay } from '../state.js';
import { deck, splitWords } from '../components/deck.js';
import { fillBar } from '../components/fill-bar.js';
import { readLevel, plainWords } from '../utils/reading.js';
import { seeEverything, simpleLead } from '../components/see-everything.js';

const BACK = '<a class="back-link" href="#/reclamation/map">← THE MAP</a>';
const NOTE = "Optional. It never counts toward your districts, your city lights or the city's totals.";

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// No fixed width over 360px and no nowrap: the list has to fit a 320px phone.
const STYLE = `<style>
.big-check{padding:0 16px 24px;max-width:720px;margin:0 auto;box-sizing:border-box;overflow-wrap:anywhere}
.big-check .back-link{display:inline-flex;align-items:center;min-height:44px;margin-top:4px;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);text-decoration:none}
.big-check .big-check-head{font-family:var(--font-title);line-height:1.2;font-size:14px;font-weight:800;color:var(--lime);letter-spacing:0.5px;margin:12px 0 2px}
.big-check .big-check-head--none{color:var(--offwhite)}
.big-check-no-page{font-weight:600}
.big-check .big-check-note{font-size:12px;line-height:1.5;color:rgba(237,239,243,0.55);margin:0 0 12px}
.big-check .big-check-filter{display:block;width:100%;box-sizing:border-box;min-height:44px;margin:0 0 12px;padding:0 12px;font-family:var(--font-mono);font-size:16px;color:var(--offwhite);background:rgba(26,31,43,0.7);border:1px solid rgba(0,229,255,0.3);border-radius:6px}
.big-check .big-check-filter:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
.big-check details{margin:0 0 8px;background:rgba(26,31,43,0.5);border:1px solid rgba(255,255,255,0.06);border-radius:8px}
.big-check summary{display:list-item;box-sizing:border-box;min-height:44px;padding:12px 14px;line-height:20px;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:1px;color:var(--cyan);cursor:pointer}
.big-check summary:focus-visible{outline:2px solid var(--cyan);outline-offset:-2px}
.big-check-rows{list-style:none;margin:0;padding:0 14px 6px}
.big-check-row{padding:10px 0;border-top:1px solid rgba(255,255,255,0.05);font-size:13px;line-height:1.6;color:var(--offwhite)}
.big-check-name{margin:0;font-weight:700}
.big-check-row p{margin:4px 0}
.big-check-row a{color:var(--cyan)}
.big-check-row .star-card-go a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#090B10;background:var(--cyan);border-radius:6px;text-decoration:none}
.big-check-row .star-card-note,.big-check-row .star-card-owned{font-size:12px;color:rgba(237,239,243,0.75)}
.big-check-row .star-card-list{margin:0;padding-left:18px}
.big-check-row .star-card-list a{display:inline-flex;align-items:center;min-height:44px}
/* One line of text: the link runs on after "Covered by:" (wrapping like words, never dropping below it); its padding makes the tap 44px tall. */
.big-check-mission{display:block;box-sizing:border-box;min-height:44px;margin:4px 0;padding:10px 0;line-height:24px}
.big-check-mission a{display:inline;padding:14px 0;min-height:44px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.big-check summary .big-check-sum{display:inline}
.big-check summary .big-check-of{font-family:var(--font-body,system-ui,sans-serif);font-size:13px;font-weight:500;letter-spacing:0;color:var(--offwhite)}
.big-check summary .fill-bar{margin:8px 0 2px}
.big-check .big-check-start{border-color:rgba(0,229,255,0.45)}
.big-check .big-check-start>summary{color:var(--offwhite);font-size:14px}
.big-check .big-check-start .big-check-of .big-check-dot{display:none}
.big-check .big-check-start .big-check-of{display:block;margin-top:4px}
.big-check .big-check-start .big-check-kind{display:block;margin-top:2px;font-family:var(--font-mono);font-size:11px;font-weight:400;color:var(--cyan)}
.big-check-start-why{margin:0;padding:0 14px 8px;font-size:14px;line-height:1.5;color:var(--offwhite)}
.big-check-mission-go{display:flex;flex-wrap:wrap;align-items:center;gap:0 6px;min-height:44px}
.big-check-mission-go a{display:inline-flex;align-items:center;min-height:44px;min-width:0}
.big-check-ticked{font-size:12px;color:var(--lime)}
.big-check-empty{font-size:13px;color:rgba(237,239,243,0.7)}
.big-check-head + .big-check-scout{margin-top:10px}
.big-check-scout{display:flex;gap:8px;align-items:flex-start;box-sizing:border-box;margin:0 0 12px;padding:6px 8px;background:rgba(9,11,16,0.86);border:1px solid rgba(0,229,255,0.3);border-radius:8px}
.big-check-scout p,.big-check-scout-text{flex:1;min-width:0;margin:0;font-size:12px;line-height:1.4;color:var(--offwhite)}
.big-check-scout-text .deck-controls{margin-top:6px}
/* Simple: one bright opt-out (the first in Start here); the others outlined. */
.big-check--simple .big-check-row .star-card-go a{color:var(--cyan);background:transparent;border:1px solid rgba(0,229,255,0.45)}
.big-check--simple .big-check-row .star-card-go a.btn-primary{color:#090B10;background:var(--cyan);border-color:var(--cyan)}
${TICK_CSS}
</style>`;

const saysNote = (line) => typeof line === 'string' && line.includes('never counts toward your districts');

const missionTitle = (id, simple = false) => { const t = MISSIONS.find((m) => m.id === id)?.title ?? id; return simple ? plainWords(t) : t; };

// A row a mission covers: one line, "Covered by: <mission> ›".
function missionLine(id, state) {
  const done = state?.missions?.[id]?.status === 'completed';
  const simple = readLevel(state) === 'simplest';
  return done
    ? `<div class="big-check-mission">Covered by: ${esc(missionTitle(id, simple))} ✓ · <a href="#/mission/${esc(id)}/recheck">RE-CHECK ›</a></div>`
    : `<div class="big-check-mission">Covered by: <a href="#/mission/${esc(id)}/briefing">${esc(missionTitle(id, simple))} ›</a></div>`;
}

// We couldn't confirm the broker's opt-out page: there's nowhere sure to file, so the row says
// so instead of offering "I filed with them" (a tick already saved keeps its box).
export function unconfirmedPage(b) {
  const o = b?.optOut;
  return o !== null && typeof o === 'object' && o.method !== 'none' && o.status !== 'verified';
}

const NO_PAGE = 'No working opt-out page right now.';

function rowHtml(r, b, map, byId, state, primaryId = null) {
  if (!r.mission && unconfirmedPage(b)) {
    const box = r.ticked ? bigCheckTick(r.id, true, r.name, { frozen: r.frozen }) : '';
    return `<li class="big-check-row${r.ticked ? '' : ' big-check-row-nopage'}"><p class="big-check-name">${esc(r.name)}</p><p class="big-check-no-page">${NO_PAGE}</p>${ownedRoutesBlock(map, b, byId)}${box}</li>`;
  }
  // A tick from before a dataset release put this broker in a mission stays recorded (and lit),
  // and its box stays beside the mission link so it can be unticked. A mission row counts for
  // nothing in its group's count (class big-check-row-mission; app.js's live count skips it).
  const action = r.mission
    ? `${missionLine(r.mission, state)}${r.ticked ? bigCheckTick(r.id, true, r.name, { frozen: r.frozen }) : ''}`
    : bigCheckTick(r.id, r.ticked, r.name, { frozen: r.frozen });
  // Simple's one bright button: this row's opt-out link.
  const opt = r.id === primaryId ? optOutBlock(b).replace('<p class="star-card-go"><a ', '<p class="star-card-go"><a class="btn-primary" data-big-check-next ') : optOutBlock(b);
  return `<li class="big-check-row${r.mission ? ' big-check-row-mission' : ''}"><p class="big-check-name">${esc(r.name)}</p>${opt}${ownedRoutesBlock(map, b, byId)}${action}</li>`;
}

// "<label> · <ticked>/<tickable>": only rows with a box of their own (no mission) count, so a
// completionist can reach N/N. A group with nothing to tick shows just its label.
// A row has a box of its own: not in a mission, and somewhere to file (or already ticked).
const hasBox = (r, byId) => !r.mission && (r.ticked || !unconfirmedPage(byId.get(r.id)));

// Where to start (Liz 2026-11-20): people-search sites sell your address, so their group opens first
// with that said; the other groups start folded.
export const START_KIND = 'people-search';
export const START_HEAD = 'Start here: these sell your address';

function groupHtml(g, map, byId, state, primaryId = null) {
  const own = g.rows.filter((r) => hasBox(r, byId));
  const ticked = own.filter((r) => r.ticked).length;
  // The count is a bar that fills (app.js moves it with each tick), with the numbers beside the name.
  const count = own.length
    ? ` <span class="big-check-of"><span class="big-check-dot">· </span><span data-big-check-count>${ticked}</span> of ${own.length} ticked</span>${fillBar({ key: `big-check:${g.kind}`, done: ticked, total: own.length, size: 'small', label: `${g.label}: ${ticked} of ${own.length} ticked` })}`
    : '';
  // Simple: the row with the bright button leads its group, so it is the first thing in the list.
  const ordered = primaryId && g.rows.some((r) => r.id === primaryId) ? [...g.rows.filter((r) => r.id === primaryId), ...g.rows.filter((r) => r.id !== primaryId)] : g.rows;
  const rows = ordered.map((r) => rowHtml(r, byId.get(r.id), map, byId, state, primaryId)).join('');
  if (g.kind === START_KIND) {
    return `<details class="big-check-start" data-start-here open><summary><span class="big-check-sum">${esc(START_HEAD)}<span class="big-check-kind">${esc(g.label.toUpperCase())}</span></span>${count}</summary>`
      + '<p class="big-check-start-why">Opting out of each one takes your listing down.</p>'
      + `<ul class="big-check-rows">${rows}</ul></details>`;
  }
  return `<details><summary><span class="big-check-sum">${esc(g.label)}</span>${count}</summary><ul class="big-check-rows">${rows}</ul></details>`;
}

// Scout's first-visit line, in a bubble that looks like the map's (its own class: in the page's flow).
// On a phone a long line is slides of at most 20 words (the group list fills the rest of the screen); from 900px they flow as one paragraph.
const scoutBubble = (line) => (line
  ? `<div class="big-check-scout" role="note">${smallScout('thinkingA', 28)}<div class="big-check-scout-text">${deck(splitWords(esc(line), 20).map((html) => ({ html })), { label: 'The long tail', className: 'deck--flow' })}</div></div>`
  : '');

// Simple's next step: the first row, Start here first, with a verified opt-out page to open and
// no tick yet. Its link is the page's one bright button.
export function bigCheckNextId(groups, byId) {
  const ordered = [...groups.filter((g) => g.kind === START_KIND), ...groups.filter((g) => g.kind !== START_KIND)];
  for (const g of ordered) {
    for (const r of g.rows) {
      const o = byId.get(r.id)?.optOut;
      if (!r.mission && !r.ticked && o && o.status === 'verified' && typeof o.url === 'string' && o.url) return r.id;
    }
  }
  return null;
}

export const BIG_CHECK_LEAD = 'These are the data brokers your missions don’t reach yet. Opting out of one takes your listing down. It’s optional.';

function loadedView(state, { map }, today, query, scoutLine) {
  const lighting = brokerLighting(map, state, today);
  const groups = filterBigCheck(bigCheckGroups(map, lighting), query);
  const byId = new Map(map.brokers.map((b) => [b.id, b]));
  const empty = `<p class="big-check-empty" role="status"${groups.length ? ' hidden' : ''}>No brokers match</p>`;
  // The title is lime (done, good) only once something is ticked.
  const anyTicked = groups.some((g) => g.rows.some((r) => r.ticked));
  if (readLevel(state) === 'simplest') {
    // Simple: one sentence, Start here open with its first opt-out lit; the note, the filter and
    // the other groups behind See everything.
    const primaryId = bigCheckNextId(groups, byId);
    const start = groups.filter((g) => g.kind === START_KIND).map((g) => groupHtml(g, map, byId, state, primaryId)).join('');
    const others = groups.filter((g) => g.kind !== START_KIND).map((g) => groupHtml(g, map, byId, state, primaryId)).join('');
    return `<h1 class="big-check-head${anyTicked ? '' : ' big-check-head--none'}">THE BIG CHECK</h1>`
      + simpleLead(BIG_CHECK_LEAD)
      + scoutBubble(scoutLine)
      + start
      + seeEverything('big-check', (saysNote(scoutLine) ? '' : `<p class="big-check-note">${esc(NOTE)}</p>`)
        + `<input type="search" data-big-check-filter class="big-check-filter" placeholder="Filter by name" aria-label="Filter brokers by name" autocomplete="off" value="${esc(query)}">`
        + others + empty, { ids: false });
  }
  return `<h1 class="big-check-head${anyTicked ? '' : ' big-check-head--none'}">THE BIG CHECK</h1>`
    // Scout's first-visit line says the note too: then it is said once, by Scout.
    + (saysNote(scoutLine) ? '' : `<p class="big-check-note">${esc(NOTE)}</p>`)
    + scoutBubble(scoutLine)
    + `<input type="search" data-big-check-filter class="big-check-filter" placeholder="Filter by name" aria-label="Filter brokers by name" autocomplete="off" value="${esc(query)}">`
    // The people-search group first, open; the rest in their order, folded.
    + [...groups.filter((g) => g.kind === START_KIND), ...groups.filter((g) => g.kind !== START_KIND)].map((g) => groupHtml(g, map, byId, state)).join('')
    + empty;
}

// scoutLine: Scout's one-time line for the first visit (broker-scout.js), or null.
export function renderBigCheck(state, { status = 'idle', data = null, today = localDay(), query = '', scoutLine = null } = {}) {
  const body = status === 'ready' && data?.map ? loadedView(state, data, today, query, scoutLine) : brokerDataStatusBlock(status);
  return `${renderHud(state)}${STYLE}<div class="big-check${readLevel(state) === 'simplest' ? ' big-check--simple' : ''}">${BACK}${body}</div>`;
}
