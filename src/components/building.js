import { ACCOUNTS } from '../data/accounts.js';

// href makes the building tappable (its interior); glow 0..1 adds a cyan
// drop-shadow. With neither, the markup is exactly what it always was.
// A tappable building wears an INSIDE badge on top (pulsing while isNew, so
// until its first visit) and, when sealed/controllable are given, a lock
// count under its name. A compact one is a small tile: no badge, no pulse.
export function renderBuilding(accountId, buildingState, size = 64, { href, glow = 0, sealed, controllable, isNew = false, compact = false, showName = true } = {}) {
  const account = ACCOUNTS[accountId];
  const scarred = buildingState === 'liberated-scarred';
  const liberated = buildingState === 'liberated' || scarred;

  let src;
  let filter;
  if (buildingState === 'occupied') {
    src = account?.buildingDark || 'assets/iso_occupied.png';
    filter = 'brightness(0.5)';
  } else if (buildingState === 'in-progress') {
    src = account?.building || 'assets/iso_occupied.png';
    filter = 'brightness(0.8) saturate(0.7)';
  } else if (liberated) {
    src = account?.building || 'assets/iso_liberated.png';
    filter = 'brightness(1.1) drop-shadow(0 0 8px rgba(0,229,255,0.4))';
  } else {
    src = account?.buildingDark || 'assets/iso_occupied.png';
    filter = 'brightness(0.5)';
  }

  const g = Math.min(1, Math.max(0, Number(glow) || 0));
  if (g > 0) filter += ` drop-shadow(0 0 10px rgba(0,229,255,${Math.round(g * 0.6 * 100) / 100}))`;

  const scar = scarred
    ? `<div style="position: absolute; top: 4px; right: 4px; width: 10px; height: 10px; background: var(--magenta); border-radius: 50%; box-shadow: 0 0 6px rgba(255,45,155,0.8), 0 0 12px rgba(255,45,155,0.4);"></div>`
    : '';

  const building = `
  <div style="position: relative; display: inline-block; text-align: center;">
    <img src="${src}" style="display: block; margin: 0 auto; width: ${size}px; height: auto; filter: ${filter};">
    ${scar}
    ${showName ? `<div style="font-family: var(--font-title); line-height: 1.2; font-size: 11px; letter-spacing: 0.5px; text-align: center; color: rgba(237,239,243,0.7); margin-top: 4px;">${account?.name || accountId}</div>` : ''}
  </div>`;
  if (!href) return building;
  const name = account?.name || accountId;
  const counted = Number.isInteger(sealed) && Number.isInteger(controllable) && controllable > 0;
  const label = counted ? `${name}: see inside. ${sealed} of ${controllable} doors sealed.` : `${name}: see inside`;
  const lock = counted
    ? `<span class="building-seals${sealed === controllable ? ' building-seals--all' : ''}" aria-hidden="true">🔒 ${sealed}/${controllable}</span>`
    : '';
  const badge = compact ? '' : `<span class="building-badge${isNew ? ' building-badge--new' : ''}" aria-hidden="true">INSIDE ▸</span>`;
  return `
  <a class="building-link${compact ? ' building-link--compact' : ''}" href="${esc(href)}" aria-label="${esc(label)}">${badge}${building}${lock}</a>`;
}

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
