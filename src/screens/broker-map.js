// The Broker Constellation: the night sky above Reclaim City, where the player's data drifted.
// Pure: (state, data, view) in, markup out. Selection, zoom, the list and residency edits live in
// app.js memory and never reach the URL, an event or a breadcrumb: every control here carries a
// class PRIVATE_UI (errorNoise.js) matches, and no broker id goes in an id, name or title.
import { renderHud } from '../components/hud.js';
import { smallScout } from '../components/scout.js';
import { constellationSvg, RECHECK_OPACITY } from '../components/constellation.js';
import { brokerLighting, fieldCoverage, fieldHeader, isBuyer } from '../utils/broker-lighting.js';
import { whatsLeft, initialView, shortName } from '../utils/broker-view.js';
import { starCard, TICK_CSS } from '../components/star-card.js';
import { BROKER_MAP_DIALOGUE } from '../data/dialogue.js';
import { MISSIONS } from '../data/missions.js';
import { localDay } from '../state.js';
import { locationQuiz, QUIZ_CSS } from '../components/location-quiz.js';
import { homeOf } from '../utils/broker-state.js';
import { ladder } from '../utils/sky-ladder.js';
import { ladderPanel, LADDER_CSS } from '../components/sky-ladder.js';

const BACK = '<a class="back-link" href="#/district/reclamation">← THE RECLAMATION</a>';
const BIG_CHECK_HASH = '#/reclamation/big-check';
const DROP_MISSION = 'people_search-reclaim-stragglers';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STYLE = `<style>
#app.map-refresh>*{animation:none}
.broker-map{padding:0 16px 24px;max-width:960px;margin:0 auto;box-sizing:border-box}
.broker-map .back-link{display:inline-flex;align-items:center;min-height:44px;margin-top:4px;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);text-decoration:none}
.broker-map .map-head{font-family:var(--font-display);font-size:14px;font-weight:800;color:var(--lime);letter-spacing:2px;margin:12px 0 2px;overflow-wrap:anywhere}.broker-map .map-head .nw{display:inline-block}
.broker-map .map-sub{font-size:12px;color:rgba(237,239,243,0.55);margin:0 0 10px}
.constellation-scout{position:absolute;top:8px;left:8px;right:68px;display:flex;gap:8px;align-items:flex-start;padding:6px 4px 6px 8px;background:rgba(9,11,16,0.86);border:1px solid rgba(0,229,255,0.3);border-radius:8px;cursor:default}
/* A long line scrolls inside its box (at most about seven lines), so it never covers most of the sky; the × stays beside it. */
.constellation-scout p{flex:1;min-width:0;margin:0;font-size:11px;line-height:1.4;color:var(--offwhite);max-height:min(9em,30svh);overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:rgba(0,229,255,0.4) transparent}
.constellation-scout>svg,.constellation-scout>img,.constellation-scout>div{flex-shrink:0}
.constellation-scout-x{flex-shrink:0;width:44px;height:44px;margin:-6px 0 -6px 0;font-size:22px;color:var(--cyan);background:transparent;border:0;cursor:pointer}
.constellation-scout-x:focus-visible{outline:2px solid var(--cyan);outline-offset:-2px}
.map-stage{position:relative;width:100%;touch-action:none;-webkit-user-select:none;user-select:none;cursor:grab;height:calc(100svh - 150px);min-height:320px;border-radius:8px;overflow:hidden;background:#090B10}
.map-stage>svg.constellation{width:100%;height:100%;border-radius:8px}
.map-stage:focus{outline:none}.map-stage:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
.star-card{padding:14px 16px;background:rgba(17,21,31,0.96);border:1px solid rgba(0,229,255,0.3);border-radius:8px;font-size:13px;line-height:1.6;color:var(--offwhite);overflow-wrap:anywhere;outline:none}
.star-card h2{margin:0;font-family:var(--font-display);font-size:16px;font-weight:800;letter-spacing:1px;color:var(--offwhite)}
.star-card p{margin:4px 0}
.star-card .star-card-full,.star-card .star-card-parent{font-size:12px;color:rgba(237,239,243,0.6)}
.star-card .star-card-state{color:var(--lime)}
.star-card .star-card-note{font-size:12px;color:rgba(237,239,243,0.75)}
.star-card .star-card-none{color:#FF2D9B;font-weight:700}
.star-card .label{font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(0,229,255,0.6);margin:12px 0 4px}
.star-card a{color:var(--cyan)}
.star-card .star-card-go a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#090B10;background:var(--cyan);border-radius:6px;text-decoration:none}
.star-card-list{margin:0;padding-left:18px}
.star-card-scout{display:flex;gap:8px;align-items:flex-start;margin:10px 0 4px;padding:6px 8px;background:rgba(9,11,16,0.6);border:1px solid rgba(0,229,255,0.3);border-radius:8px}
.star-card-scout p{flex:1;min-width:0;margin:0;font-size:12px;line-height:1.4;color:var(--offwhite)}
.star-card-list li{margin:3px 0}
.star-card-claim{display:block;font-size:12px;color:rgba(237,239,243,0.7)}
.star-card-src{display:block;font-size:11px}
.star-card-close{min-height:44px;margin-top:12px;padding:0 18px;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);background:transparent;border:1px solid rgba(0,229,255,0.4);border-radius:6px;cursor:pointer}
.star-card-close:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
@media (max-width:899.98px){.star-card{background:#11151F;position:fixed;left:0;right:0;bottom:0;z-index:40;max-height:60svh;overflow-y:auto;overscroll-behavior:contain;padding-top:0;padding-bottom:calc(14px + env(safe-area-inset-bottom));border-radius:14px 14px 0 0;border-bottom:0;box-shadow:0 -8px 32px rgba(0,0,0,0.6)}
.star-card-grab{position:sticky;top:0;display:flex;justify-content:center;align-items:center;min-height:28px;margin:0 -16px 4px;background:rgba(17,21,31,0.98);touch-action:none;cursor:grab}
.star-card-grab span{width:44px;height:5px;border-radius:3px;background:rgba(237,239,243,0.35)}}
@media (min-width:900px){.constellation-wrap.has-card{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start}.star-card{max-height:calc(100svh - 40px);overflow-y:auto;position:sticky;top:12px}.star-card-grab{display:none}}
.map-stage.is-dragging{cursor:grabbing}
.constellation-controls{position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:6px}
@media (max-width:359.98px){.constellation-controls{top:auto;bottom:8px;flex-direction:row}.constellation-scout{right:8px}.broker-map .map-head{font-size:12px;margin-top:6px}.broker-map .map-sub{margin-bottom:6px}}
.constellation-zoom{min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--offwhite);background:rgba(9,11,16,0.82);border:1px solid rgba(0,229,255,0.35);border-radius:8px;cursor:pointer;padding:0}
.constellation-zoom--reset{font-size:10px;letter-spacing:1px}
.constellation-zoom:focus-visible,.constellation-star:focus-visible,.constellation-list:focus-visible,.residency-btn:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
.constellation-pick{min-height:22px;margin:8px 0 0;font-family:var(--font-mono);font-size:13px;color:var(--offwhite);overflow-wrap:anywhere}
.constellation-list{min-height:44px;margin-top:6px;padding:0 14px;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);background:transparent;border:1px solid rgba(0,229,255,0.3);cursor:pointer}
.constellation-stars{list-style:none;margin:8px 0 0;padding:0;max-height:50vh;overflow-y:auto}
.constellation-star{display:flex;width:100%;min-height:44px;align-items:center;gap:10px;padding:6px 10px;text-align:left;font-size:13px;color:var(--offwhite);background:rgba(26,31,43,0.5);border:0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;overflow-wrap:anywhere}
.constellation-star[aria-pressed="true"]{background:rgba(198,255,0,0.08)}
.map-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:14px 0 4px;padding:0;list-style:none;font-size:12px;color:rgba(237,239,243,0.7)}
.map-legend li{display:flex;align-items:center;gap:6px}
.map-panel{margin-top:14px;padding:12px 14px;background:rgba(26,31,43,0.5);border:1px solid rgba(255,255,255,0.06);font-size:13px;line-height:1.6;color:var(--offwhite);overflow-wrap:anywhere}
.map-panel .label{font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(0,229,255,0.6);margin-bottom:6px}
.map-panel a{color:var(--cyan)}
.residency-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.residency-btn{min-height:44px;padding:0 16px}
.map-left{list-style:none;margin:0;padding:0}
.map-left li{padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.map-whats-left .none{display:block;margin:0 0 4px;font-size:11px;color:rgba(237,239,243,0.45)}
.map-whats-left .sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);border:0}
.map-left .none-mark{margin-left:4px;color:rgba(237,239,243,0.45)}
.map-left a{display:inline-flex;align-items:center;min-height:44px}
.map-big-check{display:inline-flex;align-items:center;min-height:44px;margin-top:14px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:var(--cyan);text-decoration:none}
.map-big-check:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
${TICK_CSS}
${QUIZ_CSS}
${LADDER_CSS}
@media (min-width:900px){.constellation-wrap.has-side{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start}}
</style>`;

const swatch = (inner) => `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">${inner}</svg>`;
const LEGEND = [
  [swatch('<circle cx="9" cy="9" r="4" fill="#C6FF00"/>'), 'You filed'],
  [swatch(`<circle cx="9" cy="9" r="4" fill="#FF9F00" fill-opacity="${RECHECK_OPACITY}"/>`), 'Re-check due'],
  [swatch('<path d="M5 5L13 13M13 5L5 13" stroke="#FF2D9B" stroke-width="2" stroke-linecap="round"/>'), 'No opt-out exists'],
  [swatch('<circle cx="9" cy="9" r="4" fill="#3a4256"/>'), 'Not yet'],
  [swatch('<circle cx="9" cy="9" r="3" fill="#3a4256"/><circle cx="9" cy="9" r="6.5" fill="none" stroke="#00E5FF" stroke-width="1.2" stroke-dasharray="2 2"/>'), 'Credit frozen (still sells data)'],
  [swatch('<circle cx="9" cy="9" r="8" fill="#EDEFF3" opacity="0.25"/><circle cx="9" cy="9" r="3" fill="#3a4256"/>'), 'Opted out in this browser only', 'sweeps'],
  [swatch('<rect x="5" y="5" width="8" height="8" fill="none" stroke="#8a93a6" stroke-width="1.4" transform="rotate(45 9 9)"/>'), 'Buyers'],
  [swatch('<line x1="2" y1="14" x2="16" y2="4" stroke="#00E5FF" stroke-width="1.4" opacity=".6"/>'), 'A documented business link'],
  [swatch('<line x1="2" y1="12" x2="9" y2="6" stroke="#EDEFF3" stroke-width=".8" opacity=".45"/><line x1="9" y1="6" x2="16" y2="9" stroke="#EDEFF3" stroke-width=".8" opacity=".45"/><circle cx="9" cy="6" r="1.4" fill="#3a4256"/>'), 'Constellation: same kind of company, not a deal'],
];

// The zoom buttons' corner, in CSS px (44px buttons, 8px inset, gaps): labels keep clear of it.
const CONTROLS = { w: 60, h: 160 };
// Under 360px of screen the buttons lie in a row along the bottom-right instead (see the CSS).
const NARROW_VIEWPORT = 360;
const GUTTER = 32;
const CONTROLS_NARROW = { w: 3 * 44 + 2 * 6 + 20, h: 60, corner: 'bottom-right' };
export const controlsFor = (stage) => (stage?.w > 0 && stage.w + GUTTER < NARROW_VIEWPORT ? CONTROLS_NARROW : CONTROLS);

// The legend's "browser only" row describes stars the sweeps light; with no sweep members, none do.
export const hasSweepMembers = (map) => Object.values(map?.sweeps ?? {}).some((s) => Array.isArray(s?.members) && s.members.length > 0);

function dropBlock(drop, resident) {
  const text = {
    lit: 'DROP: filed. It lights the brokers registered in California.',
    'not-resident': esc(resident === 'unsaid' ? BROKER_MAP_DIALOGUE.dropUnsaid : BROKER_MAP_DIALOGUE.dropNotResident),
    ask: 'DROP: filed. Tell the map where you live to light it.',
  }[drop] ?? `DROP: not filed yet. <a href="#/mission/${DROP_MISSION}/briefing">File it</a>`;
  return `<div class="map-panel map-drop">${text}</div>`;
}

const missionTitle = (id) => MISSIONS.find((m) => m.id === id)?.title ?? id;

function nudgeBlock(pending) {
  if (!pending.length) return '';
  const links = pending.map((id) => `<li><a href="#/mission/${esc(id)}/recheck">${esc(missionTitle(id))}</a></li>`).join('');
  return `<div class="map-panel map-nudge"><div>${esc(BROKER_MAP_DIALOGUE.nudge)}</div><ul style="margin: 6px 0 0; padding-left: 18px;">${links}</ul></div>`;
}

// The no-mission sentence is said once, above the list; each row it applies to carries a mark.
const NO_MISSION = 'No mission covers this one yet: file with them, then tick it in the Big Check';
const NONE_MARK = '<span class="none-mark" aria-hidden="true">*</span>';

function leftBlock(rows) {
  const items = rows.map((r) => {
    const text = `${esc(r.name)} · reach ${r.reach}`;
    return r.mission
      ? `<li><a href="#/mission/${esc(r.mission)}/briefing">${text}</a></li>`
      : `<li><a href="${BIG_CHECK_HASH}">${text}<span class="sr-only"> (no mission yet)</span>${NONE_MARK}</a></li>`;
  }).join('');
  const note = rows.some((r) => !r.mission) ? `<span class="none">${NONE_MARK} ${NO_MISSION}</span>` : '';
  return `<div class="map-panel map-whats-left"><div class="label">WHAT'S LEFT THAT MATTERS</div>${note}<ul class="map-left">${items}</ul></div>`
    + `<a class="map-big-check" href="${BIG_CHECK_HASH}">THE BIG CHECK →</a>`;
}

const STATE_WORD = { lit: 'You filed', amber: 'Re-check due', dim: 'Not yet', 'no-opt-out': 'No opt-out exists' };

// The keyboard and screen-reader route to stars: the SVG is role="img", so its hit circles are
// invisible to assistive tech. Hubs and every lit star, by reach. data-star is a layout index.
function starList(map, layout, lighting, selectedId, open) {
  const toggle = `<button type="button" class="constellation-list" data-action="map-list" aria-expanded="${open ? 'true' : 'false'}">${open ? 'HIDE LIST' : 'LIST VIEW'}</button>`;
  if (!open) return toggle;
  const byId = new Map(map.brokers.map((b) => [b.id, b]));
  const rows = [];
  layout.stars.forEach((s, index) => {
    const b = byId.get(s?.[0]);
    if (!b || isBuyer(b)) return;
    const st = lighting.stars[b.id]?.state ?? 'dim';
    if (b.hub === true || st === 'lit' || st === 'amber') rows.push({ b, index, st });
  });
  const reach = (b) => (Number.isFinite(b.reach) ? b.reach : 0);
  rows.sort((p, q) => reach(q.b) - reach(p.b) || (p.b.id < q.b.id ? -1 : 1));
  const items = rows.map(({ b, index, st }) => `<li><button type="button" class="constellation-star" data-action="select-star" data-star="${index}" aria-pressed="${b.id === selectedId ? 'true' : 'false'}">${esc(shortName(b.name))} <span style="color: rgba(237,239,243,0.5); font-size: 11px;">· ${STATE_WORD[st] ?? 'Not yet'}</span></button></li>`).join('');
  return `${toggle}<ul class="constellation-stars">${items}</ul>`;
}

// The loading and error states, shared with the Big Check (it reads the same file).
export function brokerDataStatusBlock(status) {
  return status === 'error'
    ? `<div class="constellation constellation--error" role="alert"><p>COULDN'T LOAD THE MAP</p><button type="button" class="btn" data-action="retry-broker-data">TRY AGAIN</button></div>`
    : '<div class="constellation constellation--loading" role="status"><p>LOADING THE FIELD…</p></div>';
}

// scoutLine: this visit's one-time Scout line (broker-scout.js), shown in the first-visit note's
// place; the first visit's own line wins. cardScoutLine goes in the open star's card.
export function renderBrokerMap(state, {
  status = 'idle', data = null, today = localDay(), selectedId = null, view = null, newlyLit = new Set(),
  stage = null, firstVisit = false, scoutLine = null, cardScoutLine = null, editingResidency = false, listOpen = false,
  quiz = {}, rung = null, ladderOpen = false,
} = {}) {
  const body = status === 'ready' && data
    ? loadedView(state, data, { today, selectedId, view, newlyLit, stage, firstVisit, scoutLine, cardScoutLine, editingResidency, listOpen, quiz, rung, ladderOpen })
    : brokerDataStatusBlock(status);
  return `${renderHud(state)}${STYLE}<div class="screen broker-map">${BACK}${body}</div>`;
}

function loadedView(state, { map, layout }, { today, selectedId, view, newlyLit, stage, firstVisit, scoutLine, cardScoutLine, editingResidency, listOpen, quiz, rung, ladderOpen }) {
  const lighting = brokerLighting(map, state, today);
  const ratio = stage?.w > 0 && stage?.h > 0 ? stage.h / stage.w : 1;
  const v = view ?? initialView(map, layout, lighting, ratio);
  const rungs = ladder(map, state, lighting);
  const open = Number.isInteger(rung) && rungs[rung] && !selectedId ? rungs[rung] : null;
  const shimmer = rungs.find((r) => r.kind === 'gpc')?.status === 'done' || open?.kind === 'gpc';
  const svg = constellationSvg({ map, layout, lighting, selectedId, newlyLit, view: v, px: stage?.w ?? null, controls: controlsFor(stage), highlight: open ? open.starIds : null, shimmer });
  const selected = selectedId ? map.brokers.find((b) => b.id === selectedId) : null;
  // The tapped star's card: below the map on a phone, beside it from 900px.
  // The side column (desktop) or bottom sheet (phone) holds the star card or the ladder, never both.
  const card = selected
    ? starCard(map, lighting, selectedId, state, { scoutLine: cardScoutLine })
    : ladderPanel(rungs, { selected: open ? rung : null, open: ladderOpen, home: homeOf(state) });
  const height = stage?.h > 0 ? ` style="height:${Math.round(stage.h)}px"` : '';
  // Scout's line (the first visit's, else this visit's one-time line) floats over the top of the
  // sky (dismissable), so the map keeps the phone's height; it leaves the zoom buttons' corner clear.
  const line = firstVisit ? BROKER_MAP_DIALOGUE.firstVisit : scoutLine;
  const scout = line
    ? `<div class="constellation-scout" role="note">${smallScout('thinkingA', 28)}<p>${esc(line)}</p><button type="button" class="constellation-scout-x" data-action="dismiss-scout" aria-label="Dismiss">×</button></div>`
    : '';
  // Each half keeps to one line, so a phone never breaks "HUBS LIT" from its count.
  return `<h1 class="map-head">${fieldHeader(fieldCoverage(map, lighting)).split(' · ').map((part) => `<span class="nw">${esc(part)}</span>`).join(' · ')}</h1>`
    + '<p class="map-sub">estimated share of the field your opt-outs reach</p>'
    + `<div class="constellation-wrap has-side${selected ? ' has-card' : ''}"><div class="map-col">`
    + `<div class="map-stage" tabindex="-1"${height}>${svg}${scout}<div class="constellation-controls">`
    + '<button type="button" class="constellation-zoom" data-action="map-zoom" data-dir="in" aria-label="Zoom in">+</button>'
    + '<button type="button" class="constellation-zoom" data-action="map-zoom" data-dir="out" aria-label="Zoom out">−</button>'
    + '<button type="button" class="constellation-zoom constellation-zoom--reset" data-action="map-zoom" data-dir="reset" aria-label="Reset the view">RESET</button>'
    + '</div></div>'
    + `<p class="constellation-pick" aria-live="polite">${selected ? esc(shortName(selected.name)) : ''}</p>`
    + starList(map, layout, lighting, selectedId, listOpen)
    + `</div>${card}</div>`
    + `<details class="map-key" data-open-desktop><summary>KEY</summary><ul class="map-legend">${LEGEND.filter(([, , needs]) => needs !== 'sweeps' || hasSweepMembers(map)).map(([icon, label]) => `<li>${icon}${label}</li>`).join('')}</ul></details>`
    + nudgeBlock(lighting.pending)
    + locationQuiz({ ...quiz, home: homeOf(state), editing: editingResidency })
    + dropBlock(lighting.drop, state.caResident)
    + leftBlock(whatsLeft(map, lighting));
}
