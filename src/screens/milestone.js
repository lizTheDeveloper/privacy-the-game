import { DISTRICTS } from '../data/districts.js';
import { ACCOUNTS } from '../data/accounts.js';
import { getMissionsForDistrict } from '../data/missions.js';
import { calcIntegrity, getBuildingState } from '../utils/calc.js';
import { renderHud } from '../components/hud.js';
import { renderBuilding } from '../components/building.js';

export function renderMilestone(state, districtId) {
  const district = DISTRICTS.find((d) => d.id === districtId);

  if (!district) {
    return `
  <div class="scanlines" style="min-height: 100vh; background: var(--midnight); padding: 0 40px;">
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
  const breachesFixed = getMissionsForDistrict(districtId).filter((m) => {
    const s = state.missions[m.id];
    return s?.status === 'completed' && s.finding && s.finding !== 'no-breaches';
  }).length;
  const integrity = calcIntegrity(state);
  const nextDistrict = DISTRICTS.find((d) => d.chapter === district.chapter + 1);
  const continueLink = nextDistrict
    ? `<a class="btn-primary" href="#/district/${nextDistrict.id}" style="display: inline-block; text-decoration: none;">CONTINUE TO ${nextDistrict.name.toUpperCase()} &rarr;</a>`
    : `<a class="btn-primary" href="#/stats" style="display: inline-block; text-decoration: none;">VIEW YOUR CITY</a>`;

  return `
  <div class="scanlines" style="min-height: 100vh; background: linear-gradient(180deg, #090B10 0%, #0a1020 30%, #121828 100%); padding: 0 40px 60px; overflow: hidden;">
    ${renderHud(state)}
    <div style="position: absolute; top: 42%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(0,229,255,0.08) 0%, rgba(198,255,0,0.03) 40%, transparent 70%); pointer-events: none;"></div>
    <div style="position: relative; text-align: center; padding-top: 44px;">
      <div style="font-family: var(--font-display); font-size: 10px; font-weight: 600; color: var(--lime); letter-spacing: 4px; text-shadow: 0 0 12px rgba(198,255,0,0.4);">CHAPTER ${district.chapter} COMPLETE</div>
    </div>
    <div style="position: relative; text-align: center; margin-top: 16px;">
      <div style="font-family: var(--font-display); font-size: 56px; font-weight: 900; letter-spacing: 4px; line-height: 1.1; color: var(--cyan); text-shadow: 0 0 30px rgba(0,229,255,0.5), 0 0 60px rgba(0,229,255,0.2);">LIBERATED</div>
      <div style="font-family: var(--font-display); font-size: 14px; font-weight: 600; letter-spacing: 3px; color: rgba(237,239,243,0.75); margin-top: 12px;">${district.name.toUpperCase()} IS SECURE</div>
      <div style="font-size: 13px; color: rgba(237,239,243,0.5); margin-top: 8px;">${district.description}</div>
    </div>
    <div style="position: relative; display: flex; gap: 4px; align-items: flex-end; justify-content: center; margin: 44px 0 10px;">
      ${enabledAccounts.map((id) => renderBuilding(id, getBuildingState(state, id), 56)).join('')}
    </div>
    <div style="position: relative; width: 300px; height: 3px; margin: 0 auto 40px; background: linear-gradient(90deg, transparent, #00E5FF, #C6FF00, #00E5FF, transparent); box-shadow: 0 0 12px rgba(0,229,255,0.4);"></div>
    <div style="position: relative; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 44px;">
      <div style="min-width: 150px; padding: 20px 28px; text-align: center; background: rgba(198,255,0,0.06); border: 1px solid rgba(198,255,0,0.25);">
        <div style="font-family: var(--font-mono); font-size: 36px; font-weight: 700; color: var(--lime); text-shadow: 0 0 15px rgba(198,255,0,0.3);">${accountsSecured}</div>
        <div style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 2px; color: rgba(198,255,0,0.6); margin-top: 6px;">ACCOUNTS SECURED</div>
      </div>
      <div style="min-width: 150px; padding: 20px 28px; text-align: center; background: rgba(255,159,0,0.06); border: 1px solid rgba(255,159,0,0.25);">
        <div style="font-family: var(--font-mono); font-size: 36px; font-weight: 700; color: var(--amber); text-shadow: 0 0 15px rgba(255,159,0,0.3);">${breachesFixed}</div>
        <div style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 2px; color: rgba(255,159,0,0.6); margin-top: 6px;">BREACHES FIXED</div>
      </div>
      <div style="min-width: 150px; padding: 20px 28px; text-align: center; background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.25);">
        <div style="font-family: var(--font-mono); font-size: 36px; font-weight: 700; color: var(--cyan); text-shadow: 0 0 15px rgba(0,229,255,0.3);">${integrity}<span style="font-size: 18px; color: rgba(237,239,243,0.3);">%</span></div>
        <div style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.6); margin-top: 6px;">CITY INTEGRITY</div>
      </div>
    </div>
    <div style="position: relative; background: rgba(26,31,43,0.6); border: 1px solid rgba(0,229,255,0.15); padding: 28px 36px 24px; width: 512px; max-width: 100%; margin: 0 auto 32px; box-shadow: 0 0 20px rgba(0,229,255,0.05);">
      <div style="position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: #090B10; padding: 2px 12px; font-family: var(--font-display); font-size: 7px; font-weight: 600; color: rgba(0,229,255,0.4); letter-spacing: 3px;">SHARE CARD</div>
      <div id="milestone-card-preview" style="width: 100%; aspect-ratio: 600 / 315; background: #05070b; border: 1px solid rgba(0,229,255,0.1); display: flex; align-items: center; justify-content: center;">
        <span style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; letter-spacing: 3px; color: rgba(237,239,243,0.3);">CARD PREVIEW</span>
      </div>
    </div>
    <div style="position: relative; display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap;">
      <button class="btn-secondary" data-action="share-card" data-district="${districtId}">SHARE CARD</button>
      ${continueLink}
    </div>
  </div>`;
}
