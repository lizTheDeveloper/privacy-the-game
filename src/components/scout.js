// Scout's feelings (Task 16). Each feeling is one horizontal sprite sheet of
// 64x64 frames (built by tools/build-scout-sheets.py) that plays once and holds
// its last frame. Frame 0 is Scout at rest: scout_0.png (48px) padded to 64
// with Scout at (12, 12), so a frame is drawn shifted up-left by that much to
// keep Scout exactly where scout_0.png sits.
export const FRAME_MS = 110;

export const FEELINGS = {
  hug: { file: 'hug', frames: 9 },
  proud: { file: 'proud', frames: 7 },
  happy: { file: 'happy', frames: 7 },
  wave: { file: 'wave', frames: 7 },
  goDoIt: { file: 'go-do-it', frames: 7 },
  thinkingA: { file: 'thinking-a', frames: 7 },
  thinkingB: { file: 'thinking-b', frames: 7 },
  worried: { file: 'worried', frames: 7 },
  sad: { file: 'sad', frames: 7 },
};

export function feelingSheet(feeling) {
  return `assets/characters/scout/${FEELINGS[feeling].file}.png`;
}

// How long a feeling (or a sequence of them) takes to play.
export function feelingDuration(feeling) {
  return toList(feeling).reduce((ms, f) => ms + (FEELINGS[f].frames - 1) * FRAME_MS, 0);
}

function toList(feeling) {
  return (Array.isArray(feeling) ? feeling : [feeling]).filter((f) => FEELINGS[f]);
}

export function isFeeling(feeling) {
  return toList(feeling).length > 0;
}

// A feeling plays once per screen visit: a re-draw of the same screen (data
// arrived, an action changed state) holds the last frame instead of replaying,
// so Scout never hugs twice on one visit. app.js starts a visit on navigation.
let played = new Set();

export function newScreenVisit() {
  played = new Set();
}

function claimPlay(key) {
  if (played.has(key)) return false;
  played.add(key);
  return true;
}

// Scout's sprite for a feeling, in a box the size today's <img> has.
// opts.size: the box in px; opts.style: extra style for the box (filter,
// margins); opts.attrs: extra attributes.
export function scoutSprite(feeling, { size = 64, style = '', attrs = '' } = {}) {
  const list = toList(feeling);
  const animate = claimPlay(list.join('+'));
  // Held: only the last feeling's last frame.
  const layers = animate ? list : list.slice(-1);
  let delay = 0;
  const sheets = layers.map((f, i) => {
    const { frames } = FEELINGS[f];
    const ms = (frames - 1) * FRAME_MS;
    let anim = '';
    if (animate) {
      const parts = [`scout-play ${ms}ms steps(${frames - 1})${delay ? ` ${delay}ms` : ''} both`];
      if (delay) parts.push(`scout-show 1ms ${delay}ms backwards`);
      if (i < layers.length - 1) parts.push(`scout-hide 1ms ${delay + ms}ms forwards`);
      anim = ` animation: ${parts.join(', ')};`;
    }
    delay += ms;
    return `<span class="scout-sprite__sheet" style="background-image: url(${feelingSheet(f)}); background-size: ${frames * 64}px 64px;${anim}"></span>`;
  }).join('');
  // The stage is scout_0.png's 48px box scaled to the sprite size, exactly as
  // the <img> is; the 64px sheet frames sit at (-12, -12) inside it, on whole pixels.
  const scale = Number((size / 48).toFixed(4));
  return `<span class="scout-sprite" role="img" aria-label="Scout" data-feeling="${list.join(' ')}"${attrs ? ` ${attrs}` : ''} style="width: ${size}px; height: ${size}px;${style ? ` ${style}` : ''}"><span class="scout-sprite__stage" style="transform: scale(${scale});">${sheets}</span></span>`;
}

export function renderScout(message, options = {}) {
  const action = options.actionText && options.actionHref
    ? `<a href="${options.actionHref}" style="flex-shrink: 0; display: inline-block; border: 1px solid var(--cyan); padding: 10px 18px; font-family: var(--font-display); font-size: 9px; font-weight: 700; color: var(--cyan); text-decoration: none; white-space: nowrap; letter-spacing: 1px; text-shadow: 0 0 8px rgba(0,229,255,0.4); box-shadow: 0 0 12px rgba(0,229,255,0.15), inset 0 0 12px rgba(0,229,255,0.05);">${options.actionText}</a>`
    : '';
  const sprite = isFeeling(options.feeling)
    ? scoutSprite(options.feeling, { size: 64, style: 'filter: drop-shadow(0 0 6px rgba(0,229,255,0.3));' })
    : '<img src="assets/characters/scout_0.png" style="width: 64px; height: 64px; filter: drop-shadow(0 0 6px rgba(0,229,255,0.3));">';
  return `
  <div style="background: linear-gradient(180deg, transparent 0%, rgba(9,11,16,0.92) 25%, rgba(9,11,16,0.99) 100%); padding: 18px 20px 14px; border-top: 1px solid rgba(0,229,255,0.08);">
    <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end;">
      <div style="flex-shrink: 0; text-align: center;">
        ${sprite}
        <div style="font-family: var(--font-display); font-size: 7px; font-weight: 700; color: var(--cyan); margin-top: 3px; letter-spacing: 2px; text-shadow: 0 0 6px rgba(0,229,255,0.4);">SCOUT</div>
      </div>
      <div style="flex: 1; background: rgba(26,31,43,0.9); border: 1px solid rgba(0,229,255,0.25); padding: 12px 16px; position: relative; box-shadow: 0 0 15px rgba(0,229,255,0.05), inset 0 0 30px rgba(0,229,255,0.02);">
        <div style="font-size: 14px; color: var(--offwhite); line-height: 1.6;">${message}</div>
        <div style="position: absolute; bottom: 8px; right: 12px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid var(--cyan);"></div>
      </div>
      ${action}
    </div>
  </div>`;
}

// The small inline Scout used beside a line of text (today: a 32px img).
export function smallScout(feeling, size = 32) {
  return scoutSprite(feeling, { size, style: 'flex-shrink: 0;' });
}
