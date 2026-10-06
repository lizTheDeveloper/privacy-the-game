import { DISTRICTS } from '../data/districts.js';
import { calcDistrictProgress } from './calc.js';

export const GHOST_KEY = 'reclaim-city.gone-ghost';

// The whole city is taken back: every district with anything enabled has its
// core path done (the same core-only rule the city map uses since MUL-38).
export function isCityComplete(state) {
  let any = false;
  for (const d of DISTRICTS) {
    const p = calcDistrictProgress(state, d.id);
    if (p.total === 0) continue;
    any = true;
    if (p.percent !== 100) return false;
  }
  return any;
}

export function hasGoneGhost() {
  try {
    return Boolean(localStorage.getItem(GHOST_KEY));
  } catch {
    return false;
  }
}

// {at, silent, early, nonce}: `nonce` is the random value sent with
// went-ghost-early; a cancel must carry it. `silent` means sharing was already off, so no event was
// sent and the player is not part of any count. `early` means they went ghost
// before taking back the whole city, so tonight's run deletes what this
// browser sent. Older values were a bare ISO string, or JSON without `early`.
export function getGhostInfo() {
  let raw = null;
  try {
    raw = localStorage.getItem(GHOST_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object') {
      return { at: typeof v.at === 'string' ? v.at : null, silent: v.silent === true, early: v.early === true,
        nonce: typeof v.nonce === 'string' && v.nonce ? v.nonce : null };
    }
  } catch {
    // Not JSON: the older bare-timestamp form.
  }
  return { at: raw, silent: false, early: false, nonce: null };
}

export function markGoneGhost({ silent = false, early = false, nonce = null } = {}) {
  try {
    localStorage.setItem(GHOST_KEY, JSON.stringify({ at: new Date().toISOString(), silent, early, nonce }));
  } catch {
    // Storage blocked: the analytics switch still turns off.
  }
}

export function clearGhost() {
  try {
    localStorage.removeItem(GHOST_KEY);
  } catch {
    // Storage blocked: nothing was stored.
  }
}

// The browser clock and the server's asOf can disagree; only a file published
// more than this long after the moment counts as having run.
export const SKEW_MS = 10 * 60 * 1000;

// Tonight's run hasn't reached this moment yet: no published file, or the file
// is not more than SKEW_MS newer than `at`. Unparseable dates count as not yet run.
export function notYetRun(at, collectiveData) {
  if (!collectiveData) return true;
  const asOf = Date.parse(collectiveData.asOf);
  const t = Date.parse(at);
  if (Number.isNaN(asOf) || Number.isNaN(t)) return true;
  return asOf - t <= SKEW_MS;
}

// Only an early ghost can be cancelled: a final-mission ghost deletes nothing.
export function isGhostPending(ghostInfo, collectiveData) {
  if (!ghostInfo || !ghostInfo.early) return false;
  return notYetRun(ghostInfo.at, collectiveData);
}
