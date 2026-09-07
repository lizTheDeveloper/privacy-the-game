import { ACCOUNTS } from '../data/accounts.js';

export function renderBuilding(accountId, buildingState, size = 64) {
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

  const scar = scarred
    ? `<div style="position: absolute; top: 4px; right: 4px; width: 10px; height: 10px; background: var(--magenta); border-radius: 50%; box-shadow: 0 0 6px rgba(255,45,155,0.8), 0 0 12px rgba(255,45,155,0.4);"></div>`
    : '';

  return `
  <div style="position: relative; display: inline-block; text-align: center;">
    <img src="${src}" style="display: block; margin: 0 auto; width: ${size}px; height: auto; filter: ${filter};">
    ${scar}
    <div style="font-family: var(--font-display); font-size: 8px; letter-spacing: 1px; text-align: center; color: rgba(237,239,243,0.7); margin-top: 4px;">${account?.name || accountId}</div>
  </div>`;
}
