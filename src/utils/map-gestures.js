// Gesture math for the Broker Constellation (Liz: "I can't zoom"). Pure: screen points, the
// drawn box and the current view in, a new view out. app.js tracks the pointers; nothing here is
// tracked or put in a URL.
import { zoomViewBox } from './broker-view.js';

export const TAP_MAX_PX = 8; // a press that moves this far is a drag, never a tap
export const MIN_W = 100;
export const MAX_W = 1000;
const WHEEL_RATE = 0.002; // per wheel delta pixel: one ordinary notch (100) is about 1.22×

// A plain wheel scrolls the page; ctrl/cmd+wheel and a trackpad pinch (a ctrl wheel event) zoom.
export const wheelZooms = (e) => !!(e && (e.ctrlKey || e.metaKey));

const fin = (v, d) => (Number.isFinite(v) ? v : d);

function box(view) {
  const w = fin(view?.w, 1000) > 0 ? fin(view?.w, 1000) : 1000;
  const h = fin(view?.h, w) > 0 ? fin(view?.h, w) : w;
  return { x: fin(view?.x, 0), y: fin(view?.y, 0), w, h, square: !Number.isFinite(view?.h) };
}

// The SVG's px-per-unit scale and where the view's corner sits, as preserveAspectRatio "meet" draws it.
function fitOf(v, rect) {
  const s = Math.min(rect.width / v.w, rect.height / v.h);
  return { s, ox: rect.left + (rect.width - v.w * s) / 2, oy: rect.top + (rect.height - v.h * s) / 2 };
}

// A screen (client) point as a map point, for the view drawn into `rect` (the SVG's client box).
export function screenToMap(view, rect, sx, sy) {
  const v = box(view);
  const { s, ox, oy } = fitOf(v, rect);
  return { x: v.x + (sx - ox) / s, y: v.y + (sy - oy) / s };
}

// A press is a tap when it ends close to where it started and never wandered further (`maxMoved`,
// the furthest it got from the start, in px), however long it was held: a slow tap still selects.
// A drag never selects.
export function isTap(start, end, maxMoved = 0) {
  if (!start || !end) return false;
  const moved = Math.max(Math.hypot(end.x - start.x, end.y - start.y), fin(maxMoved, 0));
  return moved < TAP_MAX_PX;
}

// Whether the view is as wide as this screen allows (a miss there zooms in).
export const isWidest = (view) => fin(view?.w, 0) >= MAX_W - 1e-6;

const KEEP_MARGIN = 24;

// While the phone's card sheet covers the bottom of the stage, the selected star stays in the
// sky above it: if the star's screen point is outside [visTop, visBottom] (plus a margin) or off
// the stage's sides, pan so it sits 40% of the way down the open sky. null when it already shows.
export function keepStarInView(view, rect, star, visTop, visBottom, bounds = {}) {
  if (!star || !(visBottom - visTop > 2 * KEEP_MARGIN)) return null;
  const okY = star.y >= visTop + KEEP_MARGIN && star.y <= visBottom - KEEP_MARGIN;
  const okX = star.x >= rect.left + KEEP_MARGIN && star.x <= rect.left + rect.width - KEEP_MARGIN;
  if (okX && okY) return null;
  const dx = okX ? 0 : rect.left + rect.width / 2 - star.x;
  const dy = okY ? 0 : visTop + (visBottom - visTop) * 0.4 - star.y;
  return panView(view, rect, dx, dy, bounds);
}

// The box at (nx, ny) of nw × nh, clamped to the bounds (factor 1: no zoom, just the clamp).
const out = (v, nx, ny, nw, nh, bounds) => zoomViewBox(v.square ? { x: nx, y: ny, w: nw } : { x: nx, y: ny, w: nw, h: nh }, 1, nx, ny, { ...bounds, minW: MIN_W, maxW: MAX_W });

// One finger (or a mouse drag) moved by (dx, dy) screen px: the map moves with it.
export function panView(view, rect, dx, dy, bounds = {}) {
  const v = box(view);
  const { s } = fitOf(v, rect);
  return out(v, v.x - fin(dx, 0) / s, v.y - fin(dy, 0) / s, v.w, v.h, bounds);
}

// Two fingers moved from `before` [a, b] to `after` [a, b] (screen points): zoom by how much
// further apart they are, about the map point that was under their midpoint, which then sits
// under their new midpoint (so a pinch that drifts also pans). Width held to MIN_W–MAX_W.
export function pinchView(view, rect, before, after, bounds = {}) {
  const v = box(view);
  const [a0, b0] = before;
  const [a1, b1] = after;
  const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y);
  const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y);
  if (!(d0 > 0) || !(d1 > 0)) return out(v, v.x, v.y, v.w, v.h, bounds);
  const anchor = screenToMap(v, rect, (a0.x + b0.x) / 2, (a0.y + b0.y) / 2);
  const nw = Math.min(MAX_W, Math.max(MIN_W, (v.w * d0) / d1));
  const nh = (v.h * nw) / v.w;
  const { s, ox, oy } = fitOf({ ...v, w: nw, h: nh }, rect);
  const mx = (a1.x + b1.x) / 2;
  const my = (a1.y + b1.y) / 2;
  return out(v, anchor.x - (mx - ox) / s, anchor.y - (my - oy) / s, nw, nh, bounds);
}

// A wheel or trackpad scroll of deltaY px over (sx, sy): up zooms in, the point under the pointer stays put.
export function wheelView(view, rect, deltaY, sx, sy, bounds = {}) {
  const v = box(view);
  const p = screenToMap(v, rect, sx, sy);
  const f = Math.exp(-fin(deltaY, 0) * WHEEL_RATE);
  return zoomViewBox(v.square ? { x: v.x, y: v.y, w: v.w } : { x: v.x, y: v.y, w: v.w, h: v.h }, f, p.x, p.y, { ...bounds, minW: MIN_W, maxW: MAX_W });
}
