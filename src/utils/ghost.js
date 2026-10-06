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

export function markGoneGhost() {
  try {
    localStorage.setItem(GHOST_KEY, new Date().toISOString());
  } catch {
    // Storage blocked: the analytics switch still turns off.
  }
}
