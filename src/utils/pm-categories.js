// The per-category ask (Liz, 2026-10-06): at the top of every district, Scout
// asks whether the password manager flagged anything from here, until the
// player says there's no more — and they can always come back and add more.
// state.pmByDistrict[districtId] = { flagged, changed, clear }.
// Every number here stays in this browser: none of it is ever tracked.
import { DISTRICTS } from '../data/districts.js';
import { BURST_SIZE, hasManager } from './pm-numbers.js';

const MAX = 9999;
const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

// A whole number from 1 to MAX typed by the player, or null.
function positive(raw) {
  const s = String(raw ?? '').trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= MAX ? n : null;
}

const districtById = (id) => DISTRICTS.find((d) => d.id === id);

// "banks, payment apps, investments": what the district holds, in words.
export function categoryPhrase(districtId) {
  const d = districtById(districtId);
  if (!d) return '';
  if (d.pmCategory) return d.pmCategory;
  const desc = d.description.split(' — ')[0];
  return /^[A-Z][A-Z]/.test(desc) ? desc : desc.charAt(0).toLowerCase() + desc.slice(1);
}

export function categoryEntry(state, districtId) {
  const e = state?.pmByDistrict?.[districtId] || {};
  const flagged = num(e.flagged);
  return { flagged, changed: Math.min(num(e.changed), flagged), clear: e.clear === true };
}

function withEntry(state, districtId, entry) {
  return { ...state, pmByDistrict: { ...(state.pmByDistrict || {}), [districtId]: entry } };
}

// One of the ask's buttons. Returns the same state when nothing changes.
// action: 'flag' (adds to flagged) | 'changed' (adds to changed, capped) |
// 'clear' ("None from here", "That's all from here", "No more") | 'reopen'.
export function applyCategoryAction(state, districtId, action, raw) {
  if (!districtById(districtId)) return state;
  const e = categoryEntry(state, districtId);
  if (action === 'flag') {
    const n = positive(raw);
    if (n === null) return state;
    return withEntry(state, districtId, { ...e, flagged: Math.min(e.flagged + n, MAX), clear: false });
  }
  if (action === 'changed') {
    const n = positive(raw);
    if (n === null || e.flagged === 0) return state;
    return withEntry(state, districtId, { ...e, changed: Math.min(e.changed + n, e.flagged) });
  }
  if (action === 'clear') return withEntry(state, districtId, { ...e, clear: true });
  if (action === 'reopen') return withEntry(state, districtId, { ...e, clear: false });
  return state;
}

const nudge = (left) => {
  if (left > BURST_SIZE) return `Three at a time. Do ${BURST_SIZE} now; the rest will keep.`;
  if (left === 1) return 'Just the one. Might as well do it now.';
  return `Only ${left} — one burst and this part's done.`;
};

// What the ask shows on this district, or null (no manager):
//  { mode: 'ask', text }
//  { mode: 'working', left, lines, scout }
//  { mode: 'more', scout }
//  { mode: 'clear', quiet }   — the ask is gone; a quiet line + "Found more from here?"
export function categoryAsk(state, districtId) {
  if (!hasManager(state) || !districtById(districtId)) return null;
  const e = categoryEntry(state, districtId);
  const left = e.flagged - e.changed;
  if (e.clear) {
    let quiet = 'Nothing flagged from here.';
    if (e.flagged > 0) {
      quiet = left > 0
        ? `${e.changed} changed here. ${left} left — your call.`
        : `${e.changed} changed here.`;
    }
    return { mode: 'clear', quiet };
  }
  if (e.flagged === 0) {
    return { mode: 'ask', text: `Did your password manager flag any passwords from here — ${categoryPhrase(districtId)}?` };
  }
  if (left > 0) {
    const lines = [`${left} to change here.`];
    if (e.changed > 0) lines.push(`${e.changed} changed so far.`);
    return { mode: 'working', left, lines, scout: nudge(left) };
  }
  return { mode: 'more', scout: `All ${e.flagged} from here changed. Any more from here?` };
}

// Districts the player hasn't closed yet (for the headline), and whether
// they've used the asks at all.
export function openCategoryCount(state) {
  return DISTRICTS.filter((d) => !categoryEntry(state, d.id).clear).length;
}

export function usedCategories(state) {
  return Object.keys(state?.pmByDistrict || {}).length > 0;
}

export { categoryChangedTotal } from './pm-numbers.js';
