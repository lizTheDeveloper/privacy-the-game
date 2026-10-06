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

// {at, silent}: `silent` means sharing was already off, so no event was sent
// and the player is not part of any count. Older values were a bare ISO string.
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
    if (v && typeof v === 'object') return { at: typeof v.at === 'string' ? v.at : null, silent: v.silent === true };
  } catch {
    // Not JSON: the older bare-timestamp form.
  }
  return { at: raw, silent: false };
}

export function markGoneGhost({ silent = false } = {}) {
  try {
    localStorage.setItem(GHOST_KEY, JSON.stringify({ at: new Date().toISOString(), silent }));
  } catch {
    // Storage blocked: the analytics switch still turns off.
  }
}
