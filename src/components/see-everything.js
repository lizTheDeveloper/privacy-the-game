// Simple mode's side screens (Liz 2026-11-21, the layout review's last pick): one plain sentence,
// one bright button, and everything else behind "See everything". Nothing is deleted: the rest of
// the screen is in the page, hidden until the player taps the button, and it stays open while
// they stay in the game (in memory only, like a district's "Show all"; a new visit starts folded).
// Advanced never uses this: its screens stay as they were.
//
// The button is a real <button> with aria-expanded (app.js 'see-everything' toggles it in place,
// without a re-draw, so the page stays where it is). Nothing about it is tracked.

const open = new Set();

export function _resetSeeEverything() { open.clear(); }

export function isSeeEverythingOpen(key) {
  return open.has(key);
}

// Returns whether the fold is now open.
export function toggleSeeEverything(key, on = !open.has(key)) {
  if (on) open.add(key);
  else open.delete(key);
  return on;
}

const attr = (s) => String(s).replace(/[^a-z0-9:_-]/gi, '-');

// key: which screen's fold (kept open across re-draws). inner: the rest of the screen.
export function seeEverything(key, inner, { label = 'See everything' } = {}) {
  if (!String(inner ?? '').trim()) return '';
  const k = attr(key);
  const on = open.has(k);
  return `<div class="see-all" data-see-everything="${k}">`
    + `<button type="button" class="list-more see-all-btn" data-action="see-everything" data-fold-key="${k}" aria-expanded="${on}" aria-controls="see-all-${k}">${label}</button>`
    + `<div class="see-all-body" id="see-all-${k}"${on ? '' : ' hidden'}>${inner}</div></div>`;
}

// The one plain sentence at the top of a Simple screen: what this is, and why it matters to you.
// Full size and off-white, so it never reads as optional.
export function simpleLead(text, { html = false } = {}) {
  const body = html ? text : String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<p class="simple-lead" data-simple-lead>${body}</p>`;
}
