// Web cabinet mode: campus.themultiverse.school opens Reclaim City in an
// iframe at .../reclaim-city/?cabinet=campus. Active only when the page is
// framed AND the query is present. Outside that nothing about the game changes.
// Contract: mg:ready goes to the campus origin only (never '*'); real-money asks
// (the SUPPORT link, Patreon) are hidden. RC takes no launch pass.
export const CAMPUS_ORIGIN = 'https://campus.themultiverse.school';
export const GAME_KEY = 'reclaim-city';

export function isCabinetMode(win = globalThis.window) {
  try {
    if (!win || win.self === win.top) return false;
    return new URLSearchParams(win.location.search).get('cabinet') === 'campus';
  } catch {
    return false;
  }
}

const announced = new WeakSet();

// Tell campus the game has booted. Once per page load, cabinet mode only.
export function announceReady(win = globalThis.window) {
  if (!win || announced.has(win) || !isCabinetMode(win)) return false;
  try {
    win.parent.postMessage({ type: 'mg:ready', v: 1, game: GAME_KEY }, CAMPUS_ORIGIN);
    announced.add(win);
    return true;
  } catch {
    return false;
  }
}
