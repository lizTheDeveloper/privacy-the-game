// "Who gets your data" (#/government): the government as named agencies and named pipes, not a
// "they" (Liz, 2026-10-29). The movie version is the glowing map; tap anything and the reality is a
// photocopied file: what, under which law, when, who checks, and the sources. A ruler gives the scale.
// Pure: (state, data, ui) in, markup out. Selection lives in app.js memory, never in the URL.
import { renderHud } from '../components/hud.js';
import { buildGovGraph } from '../utils/gov-graph.js';
import { authorityNames, agencyName } from '../data/leaks/index.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const n = (v) => String(Math.round(v * 10) / 10);

const MAGENTA = '#FF2D9B';
const CYAN = '#00E5FF';
const LIME = '#C6FF00';
const AMBER = '#FF9F00';
const PALE = '#EDEFF3';
const KIND_COLOUR = { origin: PALE, pipe: CYAN, intelligence: MAGENTA, foreign: MAGENTA, 'law-enforcement': AMBER, immigration: AMBER, military: AMBER, local: LIME, oversight: '#8a93a6' };

export const GOV_CSS = `<style>
.gov{max-width:1040px;margin:0 auto;padding:0 16px 40px;box-sizing:border-box;color:var(--offwhite)}
.gov .back-link{display:inline-flex;align-items:center;min-height:44px;margin:4px 16px 0 0;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);text-decoration:none}
.gov-banner{position:relative;margin:10px 0 0;padding:6px 10px;text-align:center;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#0b2a12;background:#3ccf5a;overflow:hidden}
.gov-banner s{text-decoration-thickness:2px}
.gov-banner b{position:absolute;right:10px;top:50%;transform:translateY(-50%) rotate(-4deg);padding:1px 8px;font-size:11px;color:#b3001e;border:2px solid #b3001e;background:rgba(255,255,255,0.75)}
.gov h1{margin:22px 0 6px;font-family:var(--font-display);font-size:clamp(28px,6vw,54px);font-weight:800;line-height:1;letter-spacing:2px;color:${PALE}}
.gov .gov-lede{max-width:62ch;margin:0 0 18px;font-size:16px;line-height:1.6;color:rgba(237,239,243,0.78)}
.gov-map{position:relative;margin:0 -4px;border:1px solid rgba(0,229,255,0.25);background:radial-gradient(ellipse at 50% 30%,#0f1626 0%,#06080d 75%);box-shadow:inset 0 0 80px rgba(0,229,255,0.06)}
.gov-map svg{display:block;width:100%;height:auto}
.gov-map .wide{display:block}.gov-map .narrow{display:none}
@media (max-width:700px){.gov-map .wide{display:none}.gov-map .narrow{display:block}}
.gov-map text{font-family:'JetBrains Mono',ui-monospace,monospace}
.gov-node{cursor:pointer}
.gov-node:focus{outline:none}.gov-node:focus-visible .gov-node-box{stroke:${LIME};stroke-width:2.5}
.gov-node-box{transition:stroke 150ms ease}
.gov-node.is-on .gov-node-box{stroke:${LIME};stroke-width:2.5}
.gov-edge{fill:none;vector-effect:non-scaling-stroke}
.gov-edge--checks{stroke-dasharray:4 5}
.gov-packet{display:none}
@media (prefers-reduced-motion:no-preference){.gov-packet{display:inline}}
@media (prefers-reduced-motion:no-preference){.gov-core circle:nth-child(2){transform-box:fill-box;transform-origin:center;animation:gov-spin 40s linear infinite}@keyframes gov-spin{to{transform:rotate(360deg)}}}
.gov-legend{display:flex;flex-wrap:wrap;gap:6px 18px;margin:10px 0 0;padding:0;list-style:none;font-size:12px;color:rgba(237,239,243,0.65)}.gov-legend li{display:flex;align-items:center;gap:8px}.gov-legend i{display:inline-block;width:18px;height:2px}.gov-legend i.dash{background:repeating-linear-gradient(90deg,#8a93a6 0 4px,transparent 4px 8px)}
.gov-file{position:relative;margin:18px 0 0;padding:22px 22px 18px;color:#1d1d1b;background:#d8d6cf;background-image:radial-gradient(rgba(0,0,0,0.06) 1px,transparent 1px),linear-gradient(180deg,#dcdad3,#cfccc4);background-size:3px 3px,100% 100%;box-shadow:0 10px 40px rgba(0,0,0,0.55);font-family:'Courier New',Courier,monospace;font-size:15px;line-height:1.55}
.gov-file h2{margin:0 0 4px;font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:700;letter-spacing:1px}
.gov-file .stamp{position:absolute;top:14px;right:16px;transform:rotate(6deg);padding:2px 8px;font-weight:700;font-size:12px;letter-spacing:2px;color:#9a1020;border:2px solid #9a1020;opacity:0.85}
.gov-file .kind{margin:0 0 12px;font-size:12px;letter-spacing:2px;color:#4a4842}
.gov-file p{margin:8px 0}
.gov-file dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;margin:10px 0}
.gov-file dt{font-weight:700;letter-spacing:1px}
.gov-file dd{margin:0}
.gov-file a{color:#0b3a8a}
.gov-file .row{padding:10px 0;border-top:1px dashed rgba(0,0,0,0.25)}
.gov-file .badge-link{display:inline-block;margin:2px 6px 2px 0;padding:2px 6px;font-weight:700;color:#7a0a3e;border:1px solid #7a0a3e;text-decoration:none}
.gov-file .src a{display:block;padding:3px 0;font-size:13px}
.gov-file .redact{position:relative}
@media (prefers-reduced-motion:no-preference){.gov-file .redact::after{content:'';position:absolute;inset:1px -2px;background:#111;transform-origin:right center;animation:gov-unredact 700ms cubic-bezier(.6,0,.2,1) both}
@keyframes gov-unredact{0%,25%{transform:scaleX(1)}100%{transform:scaleX(0)}}}
.gov-file .close{min-height:44px;margin-top:10px;padding:0 16px;font-family:inherit;font-size:13px;font-weight:700;color:#1d1d1b;background:transparent;border:2px solid #1d1d1b;cursor:pointer}
@media (max-width:520px){.gov-file{padding:18px 14px}.gov-file dl{grid-template-columns:1fr}.gov-file .stamp{position:static;display:inline-block;margin:0 0 8px;transform:rotate(-3deg)}}
.gov-section{margin-top:34px}
.gov-section h2{margin:0 0 4px;font-family:var(--font-display);font-size:20px;font-weight:800;letter-spacing:1px;color:${PALE}}
.gov-section .sub{margin:0 0 12px;font-size:14px;color:rgba(237,239,243,0.6)}
.gov-ruler{margin:8px 0 0}
.gov-ruler ol{list-style:none;margin:0;padding:0}
.gov-ruler li{display:grid;grid-template-columns:340px 1fr;grid-template-areas:'num bar' 'what what';gap:2px 14px;padding:8px 0;border-bottom:1px solid rgba(0,229,255,0.08)}
.gov-ruler .num{grid-area:num;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${PALE}}
.gov-ruler .num span{font-weight:400;color:rgba(237,239,243,0.55)}
.gov-ruler .bar{grid-area:bar;align-self:center;height:6px;background:repeating-linear-gradient(90deg,rgba(0,229,255,0.12) 0 1px,transparent 1px 9.09%)}
.gov-ruler .bar i{display:block;height:100%;background:linear-gradient(90deg,rgba(255,45,155,0.35),${MAGENTA});box-shadow:0 0 10px rgba(255,45,155,0.5)}
.gov-ruler .what{grid-area:what;font-size:12px;color:rgba(237,239,243,0.6)}
.gov-ruler .what a{color:var(--cyan)}
.gov-axis{position:relative;height:18px;margin-left:354px;font-family:var(--font-mono);font-size:10px;color:rgba(237,239,243,0.45)}
.gov-axis span{position:absolute;transform:translateX(-50%)}
.gov-ruler summary{min-height:44px;display:flex;align-items:center;cursor:pointer;font-family:var(--font-mono);font-size:12px;color:var(--cyan)}
@media (max-width:520px){.gov-ruler li{grid-template-columns:1fr;grid-template-areas:'num' 'bar' 'what'}.gov-axis{margin-left:0}}
.gov-myths{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px}
.gov-myth{display:grid;grid-template-rows:auto 1fr;border:1px solid rgba(255,45,155,0.3)}
.gov-myth .movie{padding:12px 14px;font-family:var(--font-display);font-size:15px;font-weight:800;letter-spacing:1px;color:${MAGENTA};background:rgba(255,45,155,0.07)}
.gov-myth .real{padding:12px 14px;color:#1d1d1b;background:#d8d6cf;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.5}
.gov-myth .real a{display:inline-block;margin-top:4px;font-size:12px;color:#0b3a8a}
.gov-list{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0}
.gov-list button{min-height:40px;padding:0 10px;font-family:var(--font-mono);font-size:12px;color:var(--offwhite);background:rgba(26,31,43,0.6);border:1px solid rgba(0,229,255,0.25);cursor:pointer}
.gov-list button[aria-pressed="true"]{border-color:${LIME};color:${LIME}}
</style>`;

// The radial display: you at the centre, then where your data leaves from, the pipes, the agencies (in
// sectors by kind) and, on the outer ring, who checks. Data packets stream outward from you.
const RINGS = Object.freeze({ origin: 140, pipe: 280, agency: 480, oversight: 610 });
// Clockwise from the lower left: federal law enforcement, intelligence (over the top), immigration and the
// military, then local police; who checks sits in the gap at the bottom.
const SECTORS = Object.freeze({ 'law-enforcement': 0, intelligence: 1, foreign: 1, immigration: 2, military: 2, local: 3 });

function layout(graph) {
  const pos = new Map();
  const place = (list, r, start, span, kindOf) => list.forEach((node, i) => {
    const a = start + (span * (i + 0.5)) / list.length;
    pos.set(node.id, { ...node, kind: kindOf(node), a, r, x: Math.cos(a) * r, y: Math.sin(a) * r });
  });
  const TAU = Math.PI * 2;
  place(graph.origins, RINGS.origin, -Math.PI / 2 - TAU / 10, TAU, () => 'origin');
  place(graph.pipes, RINGS.pipe, -Math.PI / 2 - TAU / 12, TAU, () => 'pipe');
  // Agencies: four sectors, intelligence at the top, a small gap between sectors.
  const sectors = [[], [], [], []];
  for (const row of graph.rows) for (const a of row.agencies) sectors[SECTORS[a.kind] ?? 3].push({ id: a.id, label: a.short || a.name, note: a.name, kind: a.kind });
  // Agencies round the top and sides (intelligence at the top); who checks sits on its own arc below.
  const gap = 0.12;
  const arc = (TAU * 0.8) / 4;
  sectors.forEach((list, si) => place(list, RINGS.agency, -Math.PI / 2 - (TAU * 0.4) + si * arc + gap / 2, arc - gap, (x) => x.kind));
  place(graph.oversight.map((a) => ({ id: a.id, label: a.short || a.name, note: a.name })), RINGS.oversight, Math.PI / 2 - 0.42, 0.84, () => 'oversight');
  return pos;
}

const fmt = (v) => (v >= 1e9 ? `${n(v / 1e9)} billion` : v >= 1e6 ? `${n(v / 1e6)} million` : v >= 1e4 ? `${Math.round(v / 1e3)},000` : v.toLocaleString('en-US'));

// fs: label font size in map units (bigger on the phone's copy, which is drawn smaller).
// The phone's copy: the same system as a vertical flow, boxes two to a row, tier by tier.
function tierSvg(graph, selected) {
  const W = 420;
  const cols = 2;
  const tiers = [
    { label: 'WHERE IT LEAVES YOU', nodes: graph.origins.map((o) => ({ ...o, kind: 'origin' })) },
    { label: 'THE PIPES', nodes: graph.pipes.map((p) => ({ ...p, kind: 'pipe', note: `${(graph.entriesByPipe[p.id] ?? []).length} on file` })) },
    ...graph.rows.filter((r) => r.agencies.length).map((r) => ({ label: r.label.toUpperCase(), nodes: r.agencies.map((a) => ({ id: a.id, label: a.short || a.name, kind: a.kind })) })),
    { label: 'WHO CHECKS', nodes: graph.oversight.map((a) => ({ id: a.id, label: a.short || a.name, kind: 'oversight' })) },
  ];
  const bw = (W - 44) / cols;
  const bh = 46;
  const pos = new Map();
  const heads = [];
  let y = 96;
  for (const t of tiers) {
    heads.push(`<text x="${W / 2}" y="${y}" font-size="11" letter-spacing="3" text-anchor="middle" fill="${CYAN}" fill-opacity="0.55">${esc(t.label)}</text>`);
    y += 12;
    t.nodes.forEach((node, i) => {
      const inRow = Math.min(cols, t.nodes.length - Math.floor(i / cols) * cols);
      const x0 = (W - inRow * bw - (inRow - 1) * 12) / 2;
      pos.set(node.id, { ...node, x: x0 + (i % cols) * (bw + 12), y: y + Math.floor(i / cols) * (bh + 10), w: bw, h: bh });
    });
    y += Math.ceil(t.nodes.length / cols) * (bh + 10) + 30;
  }
  const core = `<circle cx="${W / 2}" cy="40" r="26" fill="rgba(0,229,255,0.08)" stroke="${CYAN}" stroke-width="1.5"/><text x="${W / 2}" y="45" font-size="14" font-weight="700" text-anchor="middle" fill="${PALE}" letter-spacing="3">YOU</text>`;
  const edges = [...graph.origins.map((o) => ({ from: 'core', to: o.id, kind: 'feeds', refs: [] })), ...graph.edges];
  const anchor = (id, top) => {
    if (id === 'core') return { x: W / 2, y: 66 };
    const p = pos.get(id);
    return p ? { x: p.x + p.w / 2, y: top ? p.y : p.y + p.h } : null;
  };
  const paths = [];
  const packets = [];
  edges.forEach((e, i) => {
    const pa = e.from === 'core' ? null : pos.get(e.from);
    const pb = pos.get(e.to);
    const down = !pa || !pb || pb.y >= pa.y;
    const a = anchor(e.from, !down);
    const b = anchor(e.to, down);
    if (!a || !b) return;
    const my = (a.y + b.y) / 2;
    const side = e.kind === 'shares' || e.kind === 'checks' ? (a.x < W / 2 ? -40 : 40) : 0;
    const d = `M${n(a.x)} ${n(a.y)} C${n(a.x + side)} ${n(my)} ${n(b.x + side)} ${n(my)} ${n(b.x)} ${n(b.y)}`;
    const touches = selected && (e.from === selected || e.to === selected);
    const colour = e.kind === 'checks' ? '#8a93a6' : e.kind === 'shares' ? AMBER : e.kind === 'takes' ? MAGENTA : CYAN;
    const op = selected ? (touches ? 0.95 : 0.05) : e.kind === 'feeds' ? 0.3 : 0.28;
    paths.push(`<path class="gov-edge gov-edge--${e.kind}" d="${d}" stroke="${colour}" stroke-width="${e.kind === 'takes' ? 1.4 : 1}" stroke-opacity="${op}"/>`);
    if (e.kind !== 'checks' && (!selected || touches)) {
      const dur = 2.4 + (i % 7) * 0.35;
      packets.push(`<circle class="gov-packet" r="2.4" fill="${colour}"><animateMotion dur="${n(dur)}s" begin="-${n((i * 0.41) % dur)}s" repeatCount="indefinite" path="${d}"/></circle>`);
    }
  });
  const boxes = [...pos.values()].map((p) => {
    const colour = KIND_COLOUR[p.kind] ?? PALE;
    const on = p.id === selected;
    return `<g class="gov-node${on ? ' is-on' : ''}" data-action="gov-select" data-node="${esc(p.id)}" tabindex="0" role="button" aria-pressed="${on}" aria-label="${esc(p.label)}">`
      + `<rect class="gov-node-box" x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${p.h}" rx="2" fill="rgba(9,11,16,0.94)" stroke="${colour}" stroke-opacity="${on ? 1 : 0.55}" stroke-width="${on ? 2.2 : 1.2}"/>`
      + `<rect x="${n(p.x)}" y="${n(p.y)}" width="3" height="${p.h}" fill="${colour}"/>`
      + `<text x="${n(p.x + 11)}" y="${n(p.y + (p.note ? 20 : 28))}" font-size="${p.label.length > 17 ? 12 : 13.5}" font-weight="700" fill="${on ? LIME : colour}">${esc(p.label)}</text>`
      + (p.note ? `<text x="${n(p.x + 11)}" y="${n(p.y + 37)}" font-size="10" fill="rgba(237,239,243,0.55)">${esc(String(p.note).length > 24 ? `${String(p.note).slice(0, 23)}…` : p.note)}</text>` : '')
      + '</g>';
  }).join('');
  return `<svg viewBox="0 0 ${W} ${n(y)}" role="group" aria-label="Map of who gets your data, top to bottom: where it leaves you, the pipes, the agencies, and who checks" xmlns="http://www.w3.org/2000/svg">${core}${heads.join('')}${paths.join('')}${packets.join('')}${boxes}</svg>`;
}

function mapSvg(graph, selected, fs) {
  const pos = layout(graph);
  const R = 760;
  const grid = [RINGS.origin, RINGS.pipe, RINGS.agency, RINGS.oversight].map((r) => `<circle cx="0" cy="0" r="${r}" fill="none" stroke="${CYAN}" stroke-opacity="0.12" stroke-dasharray="2 6"/>`).join('')
    + Array.from({ length: 24 }, (_, i) => { const a = (i * Math.PI) / 12; return `<line x1="${n(Math.cos(a) * 60)}" y1="${n(Math.sin(a) * 60)}" x2="${n(Math.cos(a) * 690)}" y2="${n(Math.sin(a) * 690)}" stroke="${CYAN}" stroke-opacity="0.05"/>`; }).join('')
    + Array.from({ length: 120 }, (_, i) => { const a = (i * Math.PI) / 60; const r2 = i % 5 ? 698 : 708; return `<line x1="${n(Math.cos(a) * 690)}" y1="${n(Math.sin(a) * 690)}" x2="${n(Math.cos(a) * r2)}" y2="${n(Math.sin(a) * r2)}" stroke="${CYAN}" stroke-opacity="0.3"/>`; }).join('');
  const core = `<g class="gov-core"><circle r="46" fill="rgba(0,229,255,0.08)" stroke="${CYAN}" stroke-width="1.5"/><circle r="58" fill="none" stroke="${CYAN}" stroke-opacity="0.35" stroke-dasharray="1 5"/>`
    + `<text y="7" font-size="${fs * 1.3}" font-weight="700" text-anchor="middle" fill="${PALE}" letter-spacing="3">YOU</text></g>`;
  const paths = [];
  const packets = [];
  // The core feeds every origin: your data leaves from you.
  const edges = [...graph.origins.map((o) => ({ from: 'core', to: o.id, kind: 'feeds', refs: [] })), ...graph.edges];
  const at = (id) => (id === 'core' ? { x: 0, y: 0 } : pos.get(id));
  edges.forEach((e, i) => {
    const a = at(e.from);
    const b = at(e.to);
    if (!a || !b) return;
    // A gentle arc bowed away from the centre.
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const ml = Math.hypot(mx, my) || 1;
    const bow = e.kind === 'shares' || e.kind === 'checks' ? 60 : 18;
    const cx = mx + (mx / ml) * bow;
    const cy = my + (my / ml) * bow;
    const d = `M${n(a.x)} ${n(a.y)} Q${n(cx)} ${n(cy)} ${n(b.x)} ${n(b.y)}`;
    const touches = selected && (e.from === selected || e.to === selected);
    const colour = e.kind === 'checks' ? '#8a93a6' : e.kind === 'shares' ? AMBER : e.kind === 'takes' ? MAGENTA : CYAN;
    const weight = e.kind === 'takes' ? Math.min(3, 0.8 + e.refs.length * 0.25) : 0.9;
    const op = selected ? (touches ? 0.95 : 0.05) : e.kind === 'feeds' ? 0.28 : e.kind === 'takes' ? 0.3 : 0.38;
    paths.push(`<path class="gov-edge gov-edge--${e.kind}" d="${d}" stroke="${colour}" stroke-width="${n(weight)}" stroke-opacity="${op}"/>`);
    if (e.kind !== 'checks' && (!selected || touches)) {
      const dur = 2.4 + (i % 7) * 0.35;
      packets.push(`<circle class="gov-packet" r="${e.kind === 'takes' ? 3.2 : 2.2}" fill="${colour}"><animateMotion dur="${n(dur)}s" begin="-${n((i * 0.41) % dur)}s" repeatCount="indefinite" path="${d}"/></circle>`);
    }
  });
  const inbound = new Map();
  for (const e of graph.edges) if (e.kind === 'takes') inbound.set(e.to, (inbound.get(e.to) ?? 0) + e.refs.length);
  const nodes = [...pos.values()].map((p) => {
    const colour = KIND_COLOUR[p.kind] ?? PALE;
    const on = p.id === selected;
    const r = p.kind === 'pipe' ? 13 : p.kind === 'origin' ? 10 : 9;
    // Inner rings: the label centred under the node. Outer rings: a leader out along the radius, then a
    // short level run to the label.
    const inner = p.kind === 'origin' || p.kind === 'pipe';
    const right = p.x >= 0;
    const lx = p.x + Math.cos(p.a) * (r + 14);
    const ly = p.y + Math.sin(p.a) * (r + 14);
    const ex = lx + (right ? 16 : -16);
    const count = inbound.get(p.id);
    const read = p.kind === 'pipe' ? `${(graph.entriesByPipe[p.id] ?? []).length} ON FILE` : count ? `${count} PIPE${count === 1 ? '' : 'S'} IN` : '';
    return `<g class="gov-node${on ? ' is-on' : ''}" data-action="gov-select" data-node="${esc(p.id)}" tabindex="0" role="button" aria-pressed="${on}" aria-label="${esc(p.note && p.note !== p.label ? `${p.label}: ${p.note}` : p.label)}">`
      + `<circle class="gov-hit" cx="${n(p.x)}" cy="${n(p.y)}" r="${r + 22}" fill="transparent"/>`
      + `<circle class="gov-node-box" cx="${n(p.x)}" cy="${n(p.y)}" r="${r + 7}" fill="none" stroke="${colour}" stroke-opacity="${on ? 1 : 0.4}" stroke-width="1" stroke-dasharray="${p.kind === 'oversight' ? '2 3' : 'none'}"/>`
      + `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${r}" fill="rgba(9,11,16,0.95)" stroke="${colour}" stroke-width="${on ? 2.5 : 1.6}"/>`
      + `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r * 0.35)}" fill="${colour}"/>`
      + (inner
        ? `<text x="${n(p.x)}" y="${n(p.y + r + 10 + fs)}" font-size="${n(fs * 0.92)}" font-weight="700" text-anchor="middle" fill="${on ? LIME : colour}" letter-spacing="1" paint-order="stroke" stroke="#06080d" stroke-width="5">${esc(p.label)}</text>`
          + (read ? `<text x="${n(p.x)}" y="${n(p.y + r + 10 + fs * 1.9)}" font-size="${n(fs * 0.64)}" text-anchor="middle" fill="rgba(237,239,243,0.55)" letter-spacing="1" paint-order="stroke" stroke="#06080d" stroke-width="4">${esc(read)}</text>` : '')
        : `<polyline points="${n(p.x + Math.cos(p.a) * (r + 7))},${n(p.y + Math.sin(p.a) * (r + 7))} ${n(lx)},${n(ly)} ${n(ex)},${n(ly)}" fill="none" stroke="${colour}" stroke-opacity="0.6"/>`
          + `<text x="${n(ex + (right ? 4 : -4))}" y="${n(ly + fs * 0.35)}" font-size="${fs}" font-weight="700" text-anchor="${right ? 'start' : 'end'}" fill="${on ? LIME : colour}" letter-spacing="1">${esc(p.label)}</text>`
          + (read ? `<text x="${n(ex + (right ? 4 : -4))}" y="${n(ly + fs * 1.35)}" font-size="${n(fs * 0.68)}" text-anchor="${right ? 'start' : 'end'}" fill="rgba(237,239,243,0.5)" letter-spacing="1">${esc(read)}</text>` : ''))
      + '</g>';
  }).join('');
  return `<svg viewBox="${-R} ${-R} ${R * 2} ${R * 2}" role="group" aria-label="Map of who gets your data: you at the centre, where it leaves you, the pipes, the agencies, and who checks" xmlns="http://www.w3.org/2000/svg">`
    + `<defs><radialGradient id="gov-glow"><stop offset="0" stop-color="${CYAN}" stop-opacity="0.16"/><stop offset="0.6" stop-color="${CYAN}" stop-opacity="0.03"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></radialGradient></defs>`
    + `<circle r="700" fill="url(#gov-glow)"/>${grid}${paths.join('')}${packets.join('')}${core}${nodes}</svg>`;
}

const redact = (html) => `<span class="redact">${html}</span>`;

function sourcesHtml(list) {
  const items = arr(list).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('');
  return items ? `<div class="row src"><b>SOURCES</b>${items}</div>` : '';
}

const badge = (e) => `<a class="badge-link" href="#/leak/${esc(e.id)}">◈ ${esc(e.badge)}</a>`;

function fileFor(id, data, graph) {
  const origin = graph.origins.find((o) => o.id === id);
  const pipe = graph.pipes.find((p) => p.id === id);
  const agency = data.agencies.find((a) => a.id === id);
  const close = '<button type="button" class="close" data-action="gov-close">CLOSE THE FILE</button>';
  if (origin) {
    const feeds = graph.pipes.filter((p) => p.origins.includes(id));
    return `<h2>${esc(origin.label)}</h2><p class="kind">WHERE IT COMES FROM</p><p>${redact(esc(origin.note))}</p>`
      + `<div class="row"><b>TAKEN BY</b><p>${feeds.map((p) => `${esc(p.label)}: ${esc(p.note)}`).join('<br>')}</p></div>`
      + '<p><a href="#/prism">See which of your accounts are labelled →</a></p>' + close;
  }
  if (pipe) {
    const entries = graph.entriesByPipe[id] ?? [];
    const rows = entries.map((e) => `<div class="row">${badge(e)} <b>${esc(arr(e.flow?.to).join(', ') || e.agency)}</b>`
      + (e.flow?.authority ? `<br>Under: ${redact(esc(e.flow.authority))}` : '')
      + (e.flow?.checkedBy ? `<br>Checked by: ${redact(esc(e.flow.checkedBy))}` : '')
      + (e.scale ? `<br>Scale: ${esc(fmt(e.scale.value))} ${esc(e.scale.unit)} ${esc(e.scale.what ?? '')}` : '') + '</div>').join('');
    return `<h2>${esc(pipe.label)}</h2><p class="kind">A PIPE · ${entries.length} ON FILE</p><p>${esc(pipe.note)}</p>${rows}` + close;
  }
  if (agency) {
    const inbound = graph.edges.filter((e) => e.to === id && e.kind === 'takes');
    const ch = data.channels.filter((c) => c.from === id || c.to === id);
    const entries = data.entries.filter((e) => arr(e.flow?.to).includes(id) || arr(e.flow?.sharedWith).includes(id));
    return `<span class="stamp">FILE</span><h2>${esc(agency.name)}</h2><p class="kind">${esc((agency.kind ?? '').replace('-', ' ').toUpperCase())}${agency.parent ? ` · PART OF ${esc(agency.parent)}` : ''}</p>`
      + (agency.does ? `<p><b>What it does.</b> ${redact(esc(agency.does))}</p>` : '')
      + (agency.reality ? `<p><b>What it actually looks like.</b> ${redact(esc(agency.reality))}</p>` : '')
      + (agency.scale ? `<p><b>Scale.</b> ${esc(fmt(agency.scale.value))} ${esc(agency.scale.unit)} ${esc(agency.scale.what ?? '')}</p>` : '')
      + (inbound.length ? `<div class="row"><b>GETS DATA FROM</b><p>${inbound.map((e) => esc(graph.pipes.find((p) => p.id === e.from)?.label ?? e.from)).join(' · ')}</p></div>` : '')
      + ch.map((c) => `<div class="row"><b>${esc(c.from === 'COMPANIES' ? 'Companies' : c.from === 'DATA_BROKERS' ? 'Data brokers' : agencyName(c.from))} → ${esc(agencyName(c.to))}</b><dl><dt>WHAT</dt><dd>${redact(esc(c.data))}</dd><dt>UNDER</dt><dd>${redact(esc(authorityNames(c.authority) || 'No law named in the record'))}</dd><dt>WHEN</dt><dd>${redact(esc(c.when))}</dd><dt>CHECKED BY</dt><dd>${redact(esc(c.checkedBy))}</dd></dl>`
        + (c.scale ? `<p>Scale: ${esc(fmt(c.scale.value))} ${esc(c.scale.unit)} ${esc(c.scale.what ?? '')}</p>` : '') + sourcesHtml(c.sources) + '</div>').join('')
      + (entries.length ? `<div class="row"><b>ON FILE</b><p>${entries.map(badge).join('')}</p></div>` : '')
      + sourcesHtml(agency.sources) + close;
  }
  return '';
}

// Every sourced number, biggest first, each a bar on one shared log axis (1 to 100 billion): the sense
// of scale. The first 15 show; the rest fold open.
function ruler(items) {
  // One row per number: the same figure often appears on a program and on its badge; keep the one with a page.
  const seen = new Map();
  for (const it of items) {
    if (!Number.isFinite(it.scale?.value) || it.scale.value < 1) continue;
    const key = `${it.scale.value}|${it.scale.unit}`;
    if (!seen.has(key) || (!seen.get(key).href && it.href)) seen.set(key, it);
  }
  const pts = [...seen.values()].sort((a, b) => b.scale.value - a.scale.value);
  if (!pts.length) return '';
  const pct = (v) => Math.max(1.5, (Math.log10(v) / 11) * 100);
  const row = (it) => {
    const name = it.href ? `<a href="${esc(it.href)}">${esc(it.name)}</a>` : esc(it.name);
    return `<li><div class="num">${esc(fmt(it.scale.value))} <span>${esc(it.scale.unit)}</span></div>`
      + `<div class="bar"><i style="width:${n(pct(it.scale.value))}%"></i></div>`
      + `<div class="what">${name}${it.scale.what ? ` · ${esc(it.scale.what)}` : ''}</div></li>`;
  };
  const axis = '<div class="gov-axis" aria-hidden="true"><span style="left:0">1</span><span style="left:27.3%">1,000</span><span style="left:54.5%">1 million</span><span style="left:81.8%">1 billion</span></div>';
  const head = pts.slice(0, 15).map(row).join('');
  const rest = pts.slice(15).map(row).join('');
  return `<div class="gov-ruler">${axis}<ol>${head}</ol>${rest ? `<details><summary>Show all ${pts.length}</summary><ol>${rest}</ol></details>` : ''}</div>`;
}

export function renderGovernment(state, data, { selected = null } = {}) {
  const graph = buildGovGraph(data);
  const known = new Set([...graph.origins, ...graph.pipes, ...data.agencies].map((x) => x.id));
  const sel = known.has(selected) ? selected : null;
  const scaled = [
    ...data.entries.map((e) => ({ name: e.badge, scale: e.scale, href: `#/leak/${e.id}` })),
    ...data.channels.map((c) => ({ name: `${c.from === 'COMPANIES' ? 'companies' : c.from === 'DATA_BROKERS' ? 'brokers' : agencyName(c.from)} → ${agencyName(c.to)}`, scale: c.scale })),
    ...data.agencies.map((a) => ({ name: a.short || a.name, scale: a.scale })),
    ...data.programs.map((p) => ({ name: p.name, scale: p.scale })),
  ];
  const myths = data.paperwork.map((m) => `<div class="gov-myth"><div class="movie">“${esc(m.myth)}”</div><div class="real">${esc(m.reality)}${arr(m.sources).map((s) => `<br><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</div></div>`).join('');
  const everything = [...graph.origins, ...graph.pipes, ...data.agencies].map((x) => `<button type="button" data-action="gov-select" data-node="${esc(x.id)}" aria-pressed="${x.id === sel}">${esc(x.short || x.label || x.name)}</button>`).join('');
  return `${renderHud(state)}${GOV_CSS}<div class="screen gov">`
    + '<a class="back-link" href="#/prism">◈ PRISM</a><a class="back-link" href="#/reclamation/map">↑ THE BROKER SKY</a>'
    + '<div class="gov-banner"><s>TOP SECRET//SI//ORCON//NOFORN</s><b>PUBLIC RECORD</b></div>'
    + '<h1>Who gets your data</h1>'
    + '<p class="gov-lede">Not a van, and not a they. Named agencies, named pipes, a law for each, and a paper trail. Tap anything on the map to open its file.</p>'
    + `<div class="gov-map"><div class="wide">${mapSvg(graph, sel, 17)}</div><div class="narrow">${tierSvg(graph, sel)}</div></div>`
    + '<ul class="gov-legend"><li><i style="background:#EDEFF3"></i>Rings out from you: where it leaves you, the pipes, the agencies, and below them who checks</li><li><i style="background:#FF2D9B"></i>What an agency takes</li><li><i style="background:#FF9F00"></i>What agencies pass to each other</li><li><i class="dash"></i>Who checks</li></ul>'
    + (sel ? `<section class="gov-file" aria-live="polite" tabindex="-1">${fileFor(sel, data, graph)}</section>` : '')
    + `<div class="gov-section"><h2>The scale</h2><p class="sub">Every number on this page, on one ruler. Each step is ten times the last.</p>${ruler(scaled)}</div>`
    + (myths ? `<div class="gov-section"><h2>The movie, and the paperwork</h2><p class="sub">The myth does their work for them. The records are smaller, duller, and fixable.</p><div class="gov-myths">${myths}</div></div>` : '')
    + `<div class="gov-section"><h2>Everything on the map</h2><div class="gov-list">${everything}</div></div>`
    + '</div>';
}
