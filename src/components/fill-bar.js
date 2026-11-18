// A bar that visibly fills (Liz 2026-11-18: "we need to see a bar fill, we need to 'see security as
// a process'", "a big, visual, motivating, filling bar", "that like, visibly animatedly fills
// up", "on advanced mode even", "human like bar fill"). It fills from where it was last seen on
// this visit to where it is now, easing like a hand pouring (a little past, then settling), and
// the first time it's seen it fills from empty. A full bar turns green and glows.
// Remembered in memory only: a reload fills it up again from empty, which is the point.

const seen = new Map();

export function _resetFillBars() { seen.clear(); }

// key: what the bar is of (a mission's steps, a district), so its last value is its own.
// done / total: how far. size: 'big' (Simple's step screens, What's next), 'mid', or 'small'.
// label: what it says to a screen reader (the bar shows no numbers).
export function fillBar({ key, done, total, size = 'mid', label = '' }) {
  const to = total > 0 ? Math.max(0, Math.min(1, done / total)) : 0;
  const from = seen.has(key) ? seen.get(key) : 0;
  seen.set(key, to);
  const pct = (v) => `${Math.round(v * 1000) / 10}%`;
  const full = total > 0 && done >= total;
  // Steps show as segments, up to a dozen; more is one smooth bar.
  const segs = total > 1 && total <= 12 ? ` --segs: ${total};` : '';
  const grew = to > from;
  return `<div class="fill-bar fill-bar--${size}${full ? ' is-full' : ''}${grew ? ' is-growing' : ''}${done > 0 && !full ? ' has-some' : ''}${segs ? ' has-segs' : ''}" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" data-fill-bar="${key}" style="--from: ${pct(from)}; --to: ${pct(to)};${segs}"><span class="fill-bar-fill"></span></div>`;
}
