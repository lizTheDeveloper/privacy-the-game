import { DISTRICTS } from '../data/districts.js';
import { readLevel } from '../utils/reading.js';
import { ACCOUNTS } from '../data/accounts.js';
import { calcIntegrity, calcDistrictSecured, getBuildingState, districtBreachedAddresses } from '../utils/calc.js';
import { activeDistricts } from '../utils/opt-in.js';
import { fillBar } from '../components/fill-bar.js';
import { renderHud } from '../components/hud.js';
import { renderBuilding } from '../components/building.js';
import { scoutSprite } from '../components/scout.js';

// Simple mode's city bar on the milestone: one segment per district, the ones taken back full
// (Liz's layout audit, 2026-11-20: "6% CITY INTEGRITY" next to LIBERATED undercut the win).
export function cityBar(state) {
  const districts = activeDistricts(state).filter((d) => calcDistrictSecured(state, d.id).total > 0);
  const done = districts.filter((d) => calcDistrictSecured(state, d.id).percent >= 100).length;
  const total = districts.length;
  if (!total) return '';
  return `<div class="milestone-city" data-city-bar>
        <div class="fill-name">Your city</div>
        ${fillBar({ key: 'city:districts', done, total, size: 'big', label: `${done} of ${total} districts taken back` })}
        <p class="fill-caption">${done} of ${total} districts taken back.</p>
      </div>`;
}

export function renderMilestone(state, districtId) {
  const district = DISTRICTS.find((d) => d.id === districtId);

  if (!district) {
    return `
  <div class="scanlines" style="min-height: 100vh; background: var(--midnight); padding: 0 16px;">
    ${renderHud(state)}
    <div style="position: relative; display: flex; justify-content: center; padding: 80px 0;">
      <div class="panel" style="padding: 48px 64px; text-align: center;">
        <div style="font-family: var(--font-display); font-size: 20px; font-weight: 700; letter-spacing: 4px; color: var(--magenta); text-shadow: 0 0 15px rgba(255,45,155,0.4);">DISTRICT NOT FOUND</div>
        <div style="margin-top: 28px;">
          <a class="btn-secondary" href="#/city" style="display: inline-block; text-decoration: none;">RETURN TO CITY</a>
        </div>
      </div>
    </div>
  </div>`;
  }

  const districtAccountIds = Object.entries(ACCOUNTS)
    .filter(([, a]) => a.district === districtId)
    .map(([id]) => id);
  const enabledAccounts = districtAccountIds.filter((id) => state.accounts[id]?.enabled);
  const accountsSecured = enabledAccounts.length;
  // Addresses found in a breach (Master Keys only): what was found, not fixed.
  const addressesBreached = districtBreachedAddresses(state, districtId);
  const integrity = calcIntegrity(state);
  const simple = readLevel(state) === 'simplest';
  const nextDistrict = DISTRICTS.find((d) => d.chapter === district.chapter + 1);
  // Missions done, flagged passwords still to change (Q1). The milestone opens exactly as it
  // would without them (same events, same pageview: app.js never reads these numbers), and only
  // what is drawn here says so. Display only, never sent.
  const left = calcDistrictSecured(state, districtId).resets.left;
  const resetsLeft = left > 0 ? `${left} password${left === 1 ? '' : 's'} still to change` : '';
  // Simple mode carries on from What's next (one card), not the next district's tabs.
  const go = resetsLeft ? 'btn-secondary' : 'btn-primary';
  const continueLink = simple
    ? '<a class="' + go + '" href="#/next" style="display: inline-block; text-decoration: none;">WHAT’S NEXT &rarr;</a>'
    : nextDistrict
    ? `<a class="${go}" href="#/district/${nextDistrict.id}" style="display: inline-block; text-decoration: none;">CONTINUE TO ${nextDistrict.name.toUpperCase()} &rarr;</a>`
    : `<a class="${go}" href="#/stats" style="display: inline-block; text-decoration: none;">VIEW YOUR CITY</a>`;

  return `
  <div class="scanlines milestone-page" style="min-height: 100vh; background: linear-gradient(180deg, #090B10 0%, #0a1020 30%, #121828 100%); padding: 0 0 60px; overflow: clip;">
    ${renderHud(state)}
    <div class="milestone-body" style="position: relative; padding: 0 24px;">
    <div style="position: absolute; top: 42%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(0,229,255,0.08) 0%, rgba(198,255,0,0.03) 40%, transparent 70%); pointer-events: none;"></div>
    <div class="milestone-top" style="position: relative; text-align: center; padding-top: 44px;">
      <div style="margin-bottom: 12px;">${scoutSprite('hug', { size: 64, style: 'filter: drop-shadow(0 0 6px rgba(0,229,255,0.3));' })}</div>
      <div style="font-family: var(--font-display); font-size: 10px; font-weight: 600; color: var(--lime); letter-spacing: 4px; text-shadow: 0 0 12px rgba(198,255,0,0.4);">CHAPTER ${district.chapter} COMPLETE</div>
    </div>
    <div style="position: relative; text-align: center; margin-top: 16px;">
      <div class="milestone-word" style="font-family: var(--font-display); font-size: 56px; font-weight: 900; letter-spacing: 4px; line-height: 1.1; color: var(--lime); text-shadow: 0 0 30px rgba(198,255,0,0.4), 0 0 60px rgba(198,255,0,0.15);">${resetsLeft ? 'MISSIONS DONE' : 'LIBERATED'}</div>
      <div style="font-family: var(--font-display); font-size: 14px; font-weight: 600; letter-spacing: 3px; color: rgba(237,239,243,0.75); margin-top: 12px;">${resetsLeft ? '' : `${district.name.toUpperCase()} IS SECURE`}</div>
      ${resetsLeft ? `<div data-resets-left style="font-size: 17px; font-weight: 600; color: var(--offwhite); margin-top: 4px;">${resetsLeft.charAt(0).toUpperCase()}${resetsLeft.slice(1)}.</div>` : ''}
      <div style="font-size: 13px; color: var(--text-quiet); margin-top: 8px;">${district.description}</div>
    </div>
    <div class="milestone-buildings" style="position: relative; display: flex; gap: 4px; align-items: flex-end; justify-content: center; margin: 44px 0 10px;">
      ${enabledAccounts.map((id) => renderBuilding(id, getBuildingState(state, id), 56)).join('')}
    </div>
    <div class="milestone-rule" style="position: relative; width: 300px; max-width: 100%; height: 3px; margin: 0 auto 40px; background: linear-gradient(90deg, transparent, #00E5FF, #C6FF00, #00E5FF, transparent); box-shadow: 0 0 12px rgba(0,229,255,0.4);"></div>
    <div class="milestone-stats" style="position: relative; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 44px;">
      <div style="min-width: 150px; padding: 20px 28px; text-align: center; background: rgba(198,255,0,0.06); border: 1px solid rgba(198,255,0,0.25);">
        <div style="font-family: var(--font-mono); font-size: 36px; font-weight: 700; color: var(--lime); text-shadow: 0 0 15px rgba(198,255,0,0.3);">${accountsSecured}</div>
        <div style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 2px; color: var(--lime); margin-top: 6px;">ACCOUNTS SECURED</div>
      </div>
      ${addressesBreached === null ? '' : `<div style="min-width: 150px; padding: 20px 28px; text-align: center; background: rgba(255,159,0,0.06); border: 1px solid rgba(255,159,0,0.25);">
        <div style="font-family: var(--font-mono); font-size: 36px; font-weight: 700; color: var(--amber); text-shadow: 0 0 15px rgba(255,159,0,0.3);">${addressesBreached}</div>
        <div style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 2px; color: rgba(255,159,0,0.6); margin-top: 6px;">${addressesBreached === 1 ? 'ADDRESS' : 'ADDRESSES'} FOUND IN A BREACH</div>
      </div>`}
      ${simple ? '' : `<div style="min-width: 150px; padding: 20px 28px; text-align: center; background: rgba(255,255,255,0.03); border: 1px solid var(--line-quiet);">
        <div style="font-family: var(--font-mono); font-size: 36px; font-weight: 700; color: var(--offwhite);">${integrity}<span style="font-size: 18px; color: var(--text-dim);">%</span></div>
        <div style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 2px; color: var(--text-quiet); margin-top: 6px;">CITY INTEGRITY</div>
      </div>`}
    </div>
    ${simple ? `<div class="milestone-city-wrap" style="position: relative; max-width: 512px; margin: -20px auto 24px;">${cityBar(state)}</div>` : ''}
    <div class="pin-bottom milestone-actions" style="display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap;">
      <button class="btn-secondary" data-action="share-card" data-district="${districtId}">SHARE CARD</button>
      ${resetsLeft ? `<a class="btn-primary" href="#/district/${districtId}" style="display: inline-block; text-decoration: none;">CHANGE THEM &rarr;</a>` : ''}
      ${continueLink}
    </div>
    <div data-share-status role="status" aria-live="polite" style="min-height: 20px; margin: 12px 0 20px; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--offwhite);"></div>
    <div style="position: relative; background: rgba(26,31,43,0.6); border: 1px solid rgba(0,229,255,0.15); padding: 28px 36px 24px; width: 512px; max-width: 100%; margin: 0 auto 32px; box-shadow: 0 0 20px rgba(0,229,255,0.05);">
      <div style="position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: #090B10; padding: 2px 12px; font-family: var(--font-display); font-size: 7px; font-weight: 600; color: var(--text-dim); letter-spacing: 3px;">SHARE CARD</div>
      <div id="milestone-card-preview" style="width: 100%; aspect-ratio: 600 / 315; background: #05070b; border: 1px solid rgba(0,229,255,0.1); display: flex; align-items: center; justify-content: center;">
        <span style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; letter-spacing: 3px; color: var(--text-dim);">CARD PREVIEW</span>
      </div>
    </div>
    </div>
  </div>`;
}
