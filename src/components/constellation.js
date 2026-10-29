// The Broker Constellation, drawn as one SVG string. Pure: (map, layout, lighting) in, markup out.
//
// Kept lean for ~900 stars on a phone: no per-star filters, only a few shared gradients in <defs>,
// and every animation is CSS inside a no-preference motion query (colours stay, motion stops).
// No href, no <a>, and no broker id in any attribute: ids stay in the layout arrays the app reads.

import { isBuyer } from '../utils/broker-lighting.js';
import { shortName } from '../utils/broker-view.js';
import { SATELLITE_IDS, satelliteBand, satelliteLines, satDimmed } from '../utils/satellites.js';

// Fill opacity of an amber (re-check due) star. It still counts in full; it just draws dimmer.
export const RECHECK_OPACITY = 0.55;

const LIME = '#C6FF00';
const AMBER = '#FF9F00';
const MAGENTA = '#FF2D9B';
const DIM = '#3a4256';
// Not-yet stars in faint natural tints (cool, blue-white, warm), all as dark as DIM: a real sky, and
// still plainly "not yet". Picked by a hash of the id, so it carries no meaning.
export const DIM_TINTS = Object.freeze([DIM, '#37435f', '#424a5c', '#463f4a', '#3d4a5a']);
const hashId = (id) => { let h = 2166136261; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619); return h >>> 0; };
// One not-yet star in TWINKLE_EVERY twinkles, slowly, out of step with the others.
export const TWINKLE_EVERY = 7;
const CYAN = '#00E5FF';
const BUYER = '#8a93a6';
const PALE = '#EDEFF3';
const MIDNIGHT = '#090B10';
const CHARCOAL = '#1A1F2B';

// Sizes when the caller does not say how wide the SVG is drawn (user units of the 1000-unit map).
const LABEL_SIZE = 22;
const LABEL_GAP = 6;
// Sizes in CSS px when it does (`px`), so they hold steady as the viewBox zooms.
const LABEL_PX = 12;
const STAR_LABEL_PX = 10;
const MIN_STAR_PX = 1.6;
export const HIT_PX = 22; // tap radius: a 44px target round every star, whatever its drawn size
// Non-hub stars get names once the map is zoomed to at least this many CSS px per map unit.
export const STAR_LABEL_SCALE = 1.8;
const ASSUMED_PX = 343; // a 375px phone less 16px gutters, for hit radii when `px` is not given
const LABEL_WRAP = 20;
const BLOOM_STEP_MS = 60;
export const BUYER_LINK_OPACITY = 0.15;
export const SELECTED_LINK_OPACITY = 0.8;
const BLOOM_WAVE = 20;

const n = (v) => String(Math.round(v * 100) / 100);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STYLE = `<style>
.constellation{display:block;width:100%;height:auto;background:radial-gradient(ellipse at 50% 45%,#121826 0%,${MIDNIGHT} 70%);border-radius:8px}
.constellation .skyline,.constellation .sky,.constellation .figures,.constellation .names,.constellation .links,.constellation .stars,.constellation .rings,.constellation .effects,.constellation .labels{pointer-events:none}
.constellation .link{stroke:${CYAN};stroke-width:1.4}
.constellation .figure{stroke:${PALE};stroke-width:.8;opacity:.2;vector-effect:non-scaling-stroke}
.constellation .figure--lit{stroke:${LIME};opacity:.5}
.constellation .const-name{font-family:'JetBrains Mono',ui-monospace,monospace;fill:${PALE};opacity:.34;letter-spacing:.25em;font-style:italic}
.constellation .link,.constellation .star-x,.constellation .buyer,.constellation .ring-frozen,.constellation .selected,.constellation .burst{vector-effect:non-scaling-stroke}
.constellation .hub-label,.constellation .star-label{font-family:'JetBrains Mono',ui-monospace,monospace;paint-order:stroke;stroke:${MIDNIGHT};stroke-linejoin:round;letter-spacing:.5px}
.constellation .hub-label{font-weight:700}
.constellation .star-hit{cursor:pointer;-webkit-tap-highlight-color:transparent}
.constellation .burst{opacity:0}
.constellation--focus .stars>:not(.is-hl),.constellation--focus .figures,.constellation--focus .links{opacity:.22}
.constellation .hl-ring{fill:none;stroke:${CYAN};stroke-width:1.4;vector-effect:non-scaling-stroke;opacity:.85}
.constellation .shimmer{fill:${PALE};opacity:.035}
.constellation .beams,.constellation .sats{pointer-events:none}
.constellation .beam{stroke:${PALE};stroke-width:1;stroke-dasharray:3 4;opacity:.38;vector-effect:non-scaling-stroke}
.constellation .beam--noway{stroke:${MAGENTA};opacity:.5}
.constellation .beam--cut{stroke:${PALE};stroke-dasharray:1 7;opacity:.1}
.constellation .beam--sel{opacity:.85}
.constellation .sat-body{fill:#1d2433;stroke:${PALE};stroke-width:1;vector-effect:non-scaling-stroke}
.constellation .sat-panel{fill:#22324a;stroke:${CYAN};stroke-width:.8;vector-effect:non-scaling-stroke}
.constellation .sat-dish{fill:none;stroke:${PALE};stroke-width:1;vector-effect:non-scaling-stroke}
.constellation .sat-name{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;fill:${PALE};paint-order:stroke;stroke:${MIDNIGHT};stroke-linejoin:round;letter-spacing:.5px}
.constellation .sat--dim{opacity:.35}
.constellation .sat--sel .sat-body{stroke:${LIME}}
.constellation .sat--sel .sat-name{fill:${LIME}}
.constellation .sat-hit{cursor:pointer;-webkit-tap-highlight-color:transparent}
@media (prefers-reduced-motion: no-preference){
.constellation .star--new,.constellation .glow,.constellation .burst,.constellation .selected{transform-box:fill-box;transform-origin:center}
@keyframes rc-bloom{0%{transform:scale(0);opacity:0}55%{transform:scale(2.4);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes rc-glow-in{0%{opacity:0;transform:scale(.2)}50%{opacity:1;transform:scale(1.8)}100%{opacity:1;transform:scale(1)}}
@keyframes rc-burst{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(6)}}
@keyframes rc-twinkle{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes rc-select{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.15)}}
.constellation .star--new{animation:rc-bloom 900ms cubic-bezier(.2,.8,.3,1) both}
.constellation .glow--new{animation:rc-glow-in 1200ms ease-out both}
.constellation .burst{animation:rc-burst 1100ms ease-out both}
.constellation .glow--hub{animation:rc-twinkle 4.2s ease-in-out infinite}
.constellation .star--tw{animation:rc-twinkle 5s ease-in-out infinite}
.constellation .selected{animation:rc-select 1.6s ease-in-out infinite}
.constellation .hl-ring{transform-box:fill-box;transform-origin:center;animation:rc-select 1.8s ease-in-out infinite}
@keyframes rc-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(0,-3px)}}
.constellation .sat-drift{animation:rc-drift 7s ease-in-out infinite}
@keyframes rc-shimmer{0%,100%{opacity:.02}50%{opacity:.07}}
.constellation .shimmer{animation:rc-shimmer 6s ease-in-out infinite}
}
</style>`;

const DEFS = `<defs>
<linearGradient id="rc-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" stop-color="${MIDNIGHT}"/><stop offset=".55" stop-color="#0d1220"/><stop offset="1" stop-color="${CHARCOAL}"/></linearGradient>
<linearGradient id="rc-city" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151a26"/><stop offset="1" stop-color="${MIDNIGHT}"/></linearGradient>
<radialGradient id="rc-glow"><stop offset="0" stop-color="${LIME}" stop-opacity=".6"/><stop offset=".35" stop-color="${LIME}" stop-opacity=".18"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
<radialGradient id="rc-milky"><stop offset="0" stop-color="#c9d6ff" stop-opacity=".075"/><stop offset=".45" stop-color="#9fb4e8" stop-opacity=".035"/><stop offset="1" stop-color="#9fb4e8" stop-opacity="0"/></radialGradient>
<radialGradient id="rc-neb"><stop offset="0" stop-color="${CYAN}" stop-opacity=".13"/><stop offset=".5" stop-color="${CYAN}" stop-opacity=".04"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></radialGradient>
<radialGradient id="rc-neb-lit"><stop offset="0" stop-color="${LIME}" stop-opacity=".16"/><stop offset=".5" stop-color="${CYAN}" stop-opacity=".05"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></radialGradient>
</defs>`;

// Reclaim City along the bottom of whatever is in view: the player is looking up from it.
// Built once, deterministically, in a 1000-wide local frame (y up from 0 to -SKYLINE_MAX):
// one path for the buildings and one for their lit windows.
const SKYLINE_MAX = 64;
const SKYLINE = (() => {
  let seed = 20261019;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  let d = 'M0 0';
  let win = '';
  let x = 0;
  while (x < 1000) {
    const w = Math.min(1000 - x, 14 + Math.floor(rnd() * 30));
    const tall = rnd() < 0.12;
    const h = Math.round(tall ? 42 + rnd() * 22 : 12 + rnd() * 26);
    d += `L${x} ${-h}`;
    if (tall && rnd() < 0.7) { const m = x + Math.round(w / 2); d += `L${m - 1} ${-h}L${m - 1} ${-h - 10}L${m + 1} ${-h - 10}L${m + 1} ${-h}`; }
    d += `L${x + w} ${-h}`;
    for (let wy = h - 6; wy > 4; wy -= 7) for (let wx = x + 3; wx < x + w - 4; wx += 6) if (rnd() < 0.18) win += `M${wx} ${-wy}h2v2h-2z`;
    x += w;
  }
  return { body: `${d}L1000 0Z`, windows: win };
})();

// A long name goes on two lines, split at the space nearest its middle.
function wrapLabel(text) {
  if (text.length <= LABEL_WRAP) return [text];
  let best = -1;
  for (let i = text.indexOf(' '); i !== -1; i = text.indexOf(' ', i + 1)) {
    if (best === -1 || Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2)) best = i;
  }
  return best === -1 ? [text] : [text.slice(0, best), text.slice(best + 1)];
}

// Label geometry, shared with the tests: monospace glyphs ~0.6em wide (0.62 for slack in the
// fallback fonts), plus the .5px letter-spacing per glyph (user units inside the SVG), plus room
// for the outline stroke and rounding (LABEL_PAD_EM in all). Lines 1.1em apart.
export const LABEL_CHAR_EM = 0.62;
export const LABEL_TRACK = 0.5;
export const LABEL_PAD_EM = 0.6;
export const LABEL_LINE_EM = 1.1;
// Space kept clear around each placed label, in em. Drawn glyphs and their outline stroke run past
// labelBox by about 0.2em, so this is what leaves a visible gap between two names.
// Constellation names, in CSS px at any zoom.
export const CONST_NAME_PX = 10;
export const LABEL_CLEAR_EM = 0.6;
// The least a hub's name may keep, when the full clearance leaves it nowhere to go.
export const LABEL_TIGHT_EM = 0.1;
// Up to this many of the player's own stars in view are named at any zoom; more (a DROP sweep)
// wait for the zoom, as every other star does.
export const OWN_NAMES_MAX = 12;

// The box a label covers: anchor x `lx` ('start' | 'end' | 'middle'), vertical centre `cy`.
export function labelBox(lines, fontSize, lx, anchor, cy) {
  const w = Math.max(...lines.map((t) => t.length)) * (fontSize * LABEL_CHAR_EM + LABEL_TRACK) + fontSize * LABEL_PAD_EM;
  const h = lines.length * fontSize * LABEL_LINE_EM;
  const left = anchor === 'end' ? lx - w : anchor === 'middle' ? lx - w / 2 : lx;
  return { left, right: left + w, top: cy - h / 2, bottom: cy + h / 2 };
}

const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

function labelMarkup({ cls, fill, fontSize, lines, lx, anchor, cy }) {
  const top = cy - (lines.length * fontSize * LABEL_LINE_EM) / 2;
  const base = (i) => n(top + fontSize * LABEL_LINE_EM * i + fontSize * 0.85);
  const a = anchor === 'start' ? '' : ` text-anchor="${anchor}"`;
  const head = `<text class="${cls}" x="${n(lx)}" y="${base(0)}" font-size="${n(fontSize)}" stroke-width="${n(fontSize * 0.28)}" fill="${fill}"${a}>`;
  if (lines.length === 1) return `${head}${esc(lines[0])}</text>`;
  return `${head}${lines.map((t, i) => `<tspan x="${n(lx)}" y="${base(i)}">${esc(t)}</tspan>`).join('')}</text>`;
}

function starState(broker, lighting) {
  if (isBuyer(broker)) return 'buyer';
  const s = lighting?.stars?.[broker.id]?.state;
  if (s === 'lit' || s === 'amber' || s === 'no-opt-out') return s;
  if (s === undefined && broker?.optOut?.method === 'none') return 'no-opt-out';
  return 'dim';
}

// `controls`: { w, h } in CSS px, a block in the top-right corner of the drawn SVG (the zoom
// buttons) that labels keep clear of. Needs `px`.
// highlight: star ids a selected ladder rung covers (they ring and the rest dim). shimmer: the
// whole-sky Global Privacy Control layer (browser-wide, so it marks no star).
export function constellationSvg({ map, layout, lighting, selectedId = null, newlyLit = new Set(), view = { x: 0, y: 0, w: 1000 }, px = null, controls = null, highlight = null, shimmer = false, selectedSat = null }) {
  const hl = new Set(highlight ?? []);
  const vx = Number.isFinite(view?.x) ? view.x : 0;
  const vy = Number.isFinite(view?.y) ? view.y : 0;
  const vw = Number.isFinite(view?.w) && view.w > 0 ? view.w : 1000;
  // A view may be taller than wide (a phone's map fills its height); square when h is not given.
  const vh = Number.isFinite(view?.h) && view.h > 0 ? view.h : vw;
  // CSS px per map unit, when the caller knows how wide the SVG is drawn.
  const scale = Number.isFinite(px) && px > 0 ? px / vw : null;
  const hitR = HIT_PX / (scale ?? ASSUMED_PX / vw);
  const labelSize = scale ? LABEL_PX / scale : LABEL_SIZE;
  const minR = scale ? MIN_STAR_PX / scale : 0;
  const nameStars = scale !== null && scale >= STAR_LABEL_SCALE;

  const byId = new Map();
  for (const b of Array.isArray(map?.brokers) ? map.brokers : []) if (b && typeof b.id === 'string') byId.set(b.id, b);

  // Drawn stars: in the layout and in the map, in layout order. `index` is the star's place in
  // layout.stars, the only handle the hit layer carries.
  const stars = [];
  const pos = new Map();
  const laid = Array.isArray(layout?.stars) ? layout.stars : [];
  laid.forEach((s, index) => {
    if (!Array.isArray(s)) return;
    const [id, x, y, r0] = s;
    const broker = byId.get(id);
    // The 12 government buyers are drawn as satellites above the field, not as stars.
    if (!broker || pos.has(id) || SATELLITE_IDS.has(id) || ![x, y, r0].every(Number.isFinite)) return;
    const st = { id, index, x, y, r: Math.max(r0, minR), broker, state: starState(broker, lighting) };
    stars.push(st);
    pos.set(id, st);
  });

  // Newly lit stars bloom in waves, in id order. Only lit ones: an amber (re-check due) star is
  // an old filing going stale, not new light, so it never blooms (by design).
  const blooming = [...(newlyLit instanceof Set ? newlyLit : new Set(newlyLit ?? []))]
    .filter((id) => pos.get(id)?.state === 'lit')
    .sort();
  const delay = new Map(blooming.map((id, i) => [id, (i % BLOOM_WAVE) * BLOOM_STEP_MS]));

  const sky = [];
  const links = [];
  const glows = [];
  const marks = [];
  const rings = [];
  const halos = [];
  const effects = [];
  const labels = [];
  const hits = [];

  const selId = selectedId !== null && pos.has(selectedId) ? selectedId : null;
  for (const l of Array.isArray(map?.links) ? map.links : []) {
    const a = pos.get(l?.from);
    const b = pos.get(l?.to);
    if (!a || !b) continue;
    const count = Array.isArray(l.sources) ? l.sources.length : 0;
    // Controller ruling M3 (2026-10-24): a buyer's links stay faint so the rim doesn't drown the map;
    // links touching the selected star brighten.
    let op = Math.min(0.6, 0.15 * (1 + count));
    if (a.state === 'buyer' || b.state === 'buyer') op = Math.min(op, BUYER_LINK_OPACITY);
    const touching = selId !== null && (a.id === selId || b.id === selId);
    if (touching) op = SELECTED_LINK_OPACITY;
    const dash = l.tier === 'C' ? ' stroke-dasharray="6 5"' : '';
    links.push(`<line class="link${touching ? ' link--selected' : ''}" x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" opacity="${n(op)}"${dash}/>`);
  }

  // The player's own stars in view, named before the zoom names everything when there are few.
  const ownUnnamed = [];
  // Constellation figures (layout.figures, star index pairs): same kind of company, never a link.
  // A figure whose two stars are both lit glows: the player is filling the constellation in.
  const byIndex = new Map(stars.map((st) => [st.index, st]));
  const figures = [];
  for (const f of Array.isArray(layout?.figures) ? layout.figures : []) {
    const a = Array.isArray(f) ? byIndex.get(f[0]) : null;
    const b = Array.isArray(f) ? byIndex.get(f[1]) : null;
    if (!a || !b) continue;
    const litBoth = a.state === 'lit' && b.state === 'lit';
    figures.push(`<line class="figure${litBoth ? ' figure--lit' : ''}" x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}"/>`);
  }
  const nameSize = scale ? CONST_NAME_PX / scale : LABEL_SIZE * 0.8;
  const constNames = (Array.isArray(layout?.names) ? layout.names : [])
    .filter((m) => Array.isArray(m) && typeof m[0] === 'string' && Number.isFinite(m[1]) && Number.isFinite(m[2]))
    .map(([label, x, y]) => ({ text: label.toUpperCase(), x, y }));
  // A name shows only whole and in view, clear of the names before it (the layout lists the biggest
  // kinds first); star labels keep clear of the names that show. Letter-spacing (.25em) widens them.
  const nameBox = (m) => {
    const b = labelBox([m.text], nameSize, m.x, 'middle', m.y - nameSize * 0.35);
    const extra = (m.text.length * nameSize * 0.25) / 2;
    return { left: b.left - extra, right: b.right + extra, top: b.top, bottom: b.bottom };
  };
  const shownNames = [];
  for (const m of constNames) {
    const box = nameBox(m);
    const inside = box.left >= vx && box.right <= vx + vw && box.top >= vy && box.bottom <= vy + vh;
    if (inside && !shownNames.some((q) => overlaps(box, q.box))) shownNames.push({ ...m, box });
  }
  const nameBoxes = shownNames.map((m) => m.box);

  const inView = (s) => s.x >= vx && s.x <= vx + vw && s.y >= vy && s.y <= vy + vh;
  const wanted = [];
  let lit = 0;
  let amber = 0;
  let none = 0;
  for (const s of stars) {
    const { x, y, r, state } = s;
    const cx = n(x);
    const cy = n(y);
    const hub = s.broker.hub === true;
    const d = delay.get(s.id);
    const anim = d === undefined ? '' : ` style="animation-delay:${d}ms"`;

    if (hub) sky.push(`<circle class="nebula" cx="${cx}" cy="${cy}" r="${n(70 + r * 6)}" fill="url(#${state === 'lit' || state === 'amber' ? 'rc-neb-lit' : 'rc-neb'})"/>`);

    const hk = hl.has(s.id) ? ' is-hl' : '';
    if (state === 'buyer') {
      marks.push(`<rect class="buyer${hk}" x="${n(x - r)}" y="${n(y - r)}" width="${n(2 * r)}" height="${n(2 * r)}" fill="none" stroke="${BUYER}" stroke-width="1.2" transform="rotate(45 ${cx} ${cy})"/>`);
    } else if (state === 'no-opt-out') {
      none += 1;
      const k = r + 1;
      marks.push(`<path class="star-x${hk}" d="M${n(x - k)} ${n(y - k)}L${n(x + k)} ${n(y + k)}M${n(x + k)} ${n(y - k)}L${n(x - k)} ${n(y + k)}" stroke="${MAGENTA}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`);
    } else if (state === 'lit') {
      lit += 1;
      const g = hub ? ' glow--hub' : '';
      const gn = d === undefined ? '' : ' glow--new';
      glows.push(`<circle class="glow${g}${gn}${hk}" cx="${cx}" cy="${cy}" r="${n(Math.max(7, r * 3.2))}" fill="url(#rc-glow)"${anim}/>`);
      marks.push(`<circle class="star star--lit${d === undefined ? '' : ' star--new'}${hk}" cx="${cx}" cy="${cy}" r="${n(r)}" fill="${LIME}"${anim}/>`);
      if (d !== undefined) effects.push(`<circle class="burst" cx="${cx}" cy="${cy}" r="${n(r + 2)}" fill="none" stroke="${LIME}" stroke-width="1"${anim}/>`);
    } else if (state === 'amber') {
      amber += 1;
      marks.push(`<circle class="star star--amber${hk}" cx="${cx}" cy="${cy}" r="${n(r)}" fill="${AMBER}" fill-opacity="${RECHECK_OPACITY}"/>`);
    } else {
      const h = hashId(s.id);
      const tw = h % TWINKLE_EVERY === 0;
      const twStyle = tw ? ` style="animation-delay:-${(h >>> 8) % 5000}ms;animation-duration:${4000 + ((h >>> 4) % 3000)}ms"` : '';
      marks.push(`<circle class="star star--dim${tw ? ' star--tw' : ''}${hk}" cx="${cx}" cy="${cy}" r="${n(r)}" fill="${DIM_TINTS[(h >>> 3) % DIM_TINTS.length]}"${twStyle}/>`);
    }

    if (hub || s.id === selId || (nameStars && inView(s))) wanted.push(s);
    else if ((state === 'lit' || state === 'amber') && inView(s)) ownUnnamed.push(s);

    hits.push(`<circle class="star-hit" cx="${cx}" cy="${cy}" r="${n(Math.max(hitR, r))}" data-star="${s.index}" fill="transparent" pointer-events="all"/>`);
  }

  if (ownUnnamed.length <= OWN_NAMES_MAX) wanted.push(...ownUnnamed);

  // Labels, placed without overlaps: the selected star first (it always shows), then the player's
  // own (lit or re-check) stars, then by reach
  // (ties by id). Each tries right, left, above, below, then the four corners; one that fits nowhere in view without
  // touching a placed label waits for a zoom or a tap.
  const reach = (s) => (Number.isFinite(s.broker.reach) ? s.broker.reach : 0);
  const mine = (s) => s.state === 'lit' || s.state === 'amber';
  wanted.sort((a, b) => (b.id === selId) - (a.id === selId) || mine(b) - mine(a) || reach(b) - reach(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const placed = [];
  const ctl = scale && Number.isFinite(controls?.w) && Number.isFinite(controls?.h)
    ? (controls.corner === 'bottom-right'
      ? { left: vx + vw - controls.w / scale, right: vx + vw, top: vy + vh - controls.h / scale, bottom: vy + vh }
      : { left: vx + vw - controls.w / scale, right: vx + vw, top: vy, bottom: vy + controls.h / scale })
    : null;
  // Every drawn star mark is an obstacle a label must not sit on (a ✕ reaches r+1 either side, a
  // buyer's diamond r√2). Only marks in view matter.
  const markBox = (s) => {
    const m = s.state === 'no-opt-out' ? s.r + 2 : s.state === 'buyer' ? s.r * 1.42 : s.r;
    // `bright`: a mark no label may cover even in a fallback (the player's own stars, no-opt-out ✕s, hubs).
    const bright = s.state === 'lit' || s.state === 'amber' || s.state === 'no-opt-out' || s.broker.hub === true;
    return { id: s.id, bright, left: s.x - m, right: s.x + m, top: s.y - m, bottom: s.y + m };
  };
  const marksInView = stars.filter((s) => s.x >= vx - 40 && s.x <= vx + vw + 40 && s.y >= vy - 40 && s.y <= vy + vh + 40).map(markBox);
  const fits = (b) => b.left >= vx && b.right <= vx + vw && b.top >= vy && b.bottom <= vy + vh && !(ctl && overlaps(b, ctl));
  for (const s of wanted) {
    const hub = s.broker.hub === true;
    const fontSize = hub ? labelSize : (scale ? STAR_LABEL_PX / scale : labelSize * (STAR_LABEL_PX / LABEL_PX));
    const gap = (fontSize / LABEL_SIZE) * LABEL_GAP;
    const lines = wrapLabel(shortName(s.broker.name ?? ''));
    const h = lines.length * fontSize * LABEL_LINE_EM;
    const options = [
      { lx: s.x + s.r + gap, anchor: 'start', cy: s.y },
      { lx: s.x - s.r - gap, anchor: 'end', cy: s.y },
      { lx: s.x, anchor: 'middle', cy: s.y - s.r - gap - h / 2 },
      { lx: s.x, anchor: 'middle', cy: s.y + s.r + gap + h / 2 },
      // Corners, tried only when no side has room.
      { lx: s.x + s.r, anchor: 'start', cy: s.y - s.r - gap - h / 2 },
      { lx: s.x - s.r, anchor: 'end', cy: s.y - s.r - gap - h / 2 },
      { lx: s.x + s.r, anchor: 'start', cy: s.y + s.r + gap + h / 2 },
      { lx: s.x - s.r, anchor: 'end', cy: s.y + s.r + gap + h / 2 },
    ];
    // avoidMarks: 'all' marks, only 'bright' ones, or 'none'.
    const clear = (o, avoidMarks, padEm = LABEL_CLEAR_EM) => {
      const b = labelBox(lines, fontSize, o.lx, o.anchor, o.cy);
      const pad = fontSize * padEm;
      const padded = { left: b.left - pad, right: b.right + pad, top: b.top - pad, bottom: b.bottom + pad };
      return fits(b) && !placed.some((q) => overlaps(padded, q.box)) && (hub || !nameBoxes.some((q) => overlaps(b, q)))
        && !marksInView.some((m) => m.id !== s.id && avoidMarks !== 'none' && (avoidMarks === 'all' || m.bright) && overlaps(b, m));
    };
    let pick = options.find((o) => clear(o, 'all'));
    // A hub always keeps a name: when every side touches a star or crowds a name, take one that
    // only clears the other labels, then one lifted clear, then tightly.
    // A hub's name may also sit one clearance further above or below its star.
    const lift = fontSize * LABEL_CLEAR_EM;
    const lifted = [
      { lx: s.x, anchor: 'middle', cy: s.y - s.r - gap - lift - h / 2 },
      { lx: s.x, anchor: 'middle', cy: s.y + s.r + gap + lift + h / 2 },
    ];
    // The player's own stars are what they came to see: they get the hub's fallback too.
    if (!pick && (hub || mine(s))) {
      // A hub's name may sit over any dot (with DROP lit, hundreds of stars surround it); one of
      // the player's own stars may cover dim dots but never another of theirs.
      const marks = hub ? 'none' : 'bright';
      pick = options.find((o) => clear(o, marks)) ?? lifted.find((o) => clear(o, marks))
        ?? options.find((o) => clear(o, marks, LABEL_TIGHT_EM));
    }
    if (!pick && s.id === selId) pick = options.find((o) => fits(labelBox(lines, fontSize, o.lx, o.anchor, o.cy))) ?? options[0];
    if (!pick) continue;
    const cls = hub ? 'hub-label' : 'star-label';
    const fill = s.state === 'lit' ? LIME : s.state === 'amber' ? AMBER : hub ? PALE : BUYER;
    placed.push({ s, box: labelBox(lines, fontSize, pick.lx, pick.anchor, pick.cy), markup: labelMarkup({ cls, fill, fontSize, lines, ...pick }) });
  }
  placed.sort((a, b) => a.s.index - b.s.index);
  for (const p of placed) labels.push(p.markup);

  const frozen = new Set(Array.isArray(lighting?.frozen) ? lighting.frozen : []);
  const halo = new Set(Array.isArray(lighting?.halo) ? lighting.halo : []);
  for (const s of stars) {
    if (frozen.has(s.id)) rings.push(`<circle class="ring-frozen" cx="${n(s.x)}" cy="${n(s.y)}" r="${n(s.r + 3)}" fill="none" stroke="${CYAN}" stroke-width="1.2" stroke-dasharray="2 2"/>`);
  }
  for (const s of stars) {
    if (halo.has(s.id)) halos.push(`<circle class="halo" cx="${n(s.x)}" cy="${n(s.y)}" r="${n(s.r + 4)}" fill="${PALE}" opacity="0.12"/>`);
  }

  for (const s of stars) if (hl.has(s.id)) effects.push(`<circle class="hl-ring" cx="${n(s.x)}" cy="${n(s.y)}" r="${n(s.r + 3.5)}"/>`);

  const sel = selectedId === null ? null : pos.get(selectedId);
  if (sel) effects.push(`<circle class="selected" cx="${n(sel.x)}" cy="${n(sel.y)}" r="${n(sel.r + 6)}" fill="none" stroke="${PALE}" stroke-width="1.5"/>`);

  // Government satellites: a band above the field, a beam down to each broker the record shows them
  // buying from. Sized in screen pixels like the labels. Each hit carries its satellite's index.
  const u = scale ? 1 / scale : vw / ASSUMED_PX;
  // Only agencies the map has: a satellite with no record would have nothing to show.
  const sats = satelliteBand(Number.isFinite(layout?.size) ? layout.size : 1000, u).filter((sat) => byId.has(sat.id));
  const satLines = satelliteLines(map, lighting);
  const beams = [];
  const satMarks = [];
  for (const sat of sats) {
    const info = satLines[sat.id];
    const selSat = selectedSat === sat.index;
    for (const line of info.lines) {
      const b = pos.get(line.broker.id);
      if (!b) continue;
      const cls = line.cut ? 'beam beam--cut' : line.way ? 'beam' : 'beam beam--noway';
      beams.push(`<line class="${cls}${selSat ? ' beam--sel' : ''}" x1="${n(sat.x)}" y1="${n(sat.y + 6 * u)}" x2="${n(b.x)}" y2="${n(b.y)}"/>`);
    }
    const k = n(u);
    satMarks.push(`<g class="sat${satDimmed(info) ? ' sat--dim' : ''}${selSat ? ' sat--sel' : ''}" transform="translate(${n(sat.x)} ${n(sat.y)}) scale(${k})"><g class="sat-drift">`
      + '<rect class="sat-panel" x="-15" y="-3" width="8" height="6"/><rect class="sat-panel" x="7" y="-3" width="8" height="6"/>'
      + '<line class="sat-dish" x1="-7" y1="0" x2="7" y2="0"/><rect class="sat-body" x="-4.5" y="-4.5" width="9" height="9" rx="1.5"/>'
      + '<path class="sat-dish" d="M-3 -4.5 Q0 -10 3 -4.5"/>'
      + `<text class="sat-name" x="0" y="15" font-size="9" text-anchor="middle">${esc(sat.initials)}</text></g></g>`);
    hits.push(`<circle class="sat-hit" cx="${n(sat.x)}" cy="${n(sat.y + 4 * u)}" r="${n(HIT_PX * u)}" data-sat="${sat.index}" fill="transparent" pointer-events="all"/>`);
  }

  const aria = `Map of data brokers: ${stars.length} companies, ${lit + amber} lit by your opt-outs (${amber} due for a re-check), ${none} with no opt-out`;

  // Hit circles sit on top and overlap in the dense crowd; the app resolves a tap with
  // nearestStar (broker-view.js) on the tap point, not with whichever circle is uppermost.
  return `<svg class="constellation${hl.size ? ' constellation--focus' : ''}" viewBox="${n(vx)} ${n(vy)} ${n(vw)} ${n(vh)}" role="img" aria-label="${esc(aria)}" xmlns="http://www.w3.org/2000/svg">${STYLE}${DEFS}`
    // A faint Milky Way band across the sky: a soft gradient, never points that could pass for stars.
    + `<g class="sky"><rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#rc-sky)"/><ellipse class="milky" cx="520" cy="470" rx="760" ry="150" transform="rotate(-24 520 470)" fill="url(#rc-milky)"/><ellipse class="milky" cx="430" cy="530" rx="420" ry="70" transform="rotate(-21 430 530)" fill="url(#rc-milky)"/>${shimmer ? '<rect class="shimmer" x="-1000" y="-1000" width="3000" height="3000"/>' : ''}${sky.join('')}</g>`
    + `<g class="skyline" transform="translate(${n(vx)} ${n(vy + vh)}) scale(${n(vw / 1000)})"><path d="${SKYLINE.body}" fill="url(#rc-city)" stroke="${CYAN}" stroke-opacity=".35" stroke-width="1" vector-effect="non-scaling-stroke"/><path d="${SKYLINE.windows}" fill="${LIME}" opacity=".55"/></g>`
    + `<g class="names">${shownNames.filter((m) => !placed.some((q) => overlaps(m.box, q.box))).map((m) => `<text class="const-name" x="${n(m.x)}" y="${n(m.y)}" font-size="${n(nameSize)}" text-anchor="middle">${esc(m.text)}</text>`).join('')}</g>`
    + `<g class="figures">${figures.join('')}</g>`
    + `<g class="links">${links.join('')}</g>`
    + `<g class="beams">${beams.join('')}</g>`
    + `<g class="stars">${glows.join('')}${marks.join('')}</g>`
    + `<g class="rings">${rings.join('')}${halos.join('')}</g>`
    + `<g class="effects">${effects.join('')}</g>`
    + `<g class="labels">${labels.join('')}</g>`
    + `<g class="sats">${satMarks.join('')}</g>`
    + `<g class="hits">${hits.join('')}</g>`
    + '</svg>';
}
