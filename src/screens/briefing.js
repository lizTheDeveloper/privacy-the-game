import { MISSIONS } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { DISTRICTS } from '../data/districts.js';
import { renderHud } from '../components/hud.js';
import { DISTRICT_DIALOGUE, PASSWORD_DIALOGUE } from '../data/dialogue.js';
import { missionDistrict } from '../data/missions.js';
import { missionSteps } from '../utils/debrief.js';
import { isPasswordMission, passwordResetNeed, notNeededReasons, PM_MISSION_ID } from '../utils/password-need.js';
import { PM_BURST_ID, pmBurstBriefingLine } from '../utils/bursts.js';
import { renderPasswordProgress } from '../components/password-progress.js';
import { scoutSprite } from '../components/scout.js';

function notFound(state) {
  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; flex-direction: column;">
    ${renderHud(state)}
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px;">
      <div class="panel" style="padding: 36px 40px; text-align: center; max-width: 440px;">
        <div class="section-label" style="color: var(--magenta); margin-bottom: 14px;">SIGNAL LOST</div>
        <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--offwhite); letter-spacing: 2px; margin-bottom: 12px;">MISSION NOT FOUND</div>
        <div style="font-size: 13px; color: rgba(237,239,243,0.5); line-height: 1.6; margin-bottom: 24px;">No mission matches that call sign. Return to the city map to pick one up.</div>
        <a href="#/city" class="btn-secondary" style="text-decoration: none;">BACK TO CITY</a>
      </div>
    </div>
  </div>`;
}

const FLAGGED_NOTE = '<div style="font-size: 13px; font-weight: 600; color: var(--magenta); margin: -12px 0 20px;">Flagged by your password manager</div>';

const NO_RESET_BADGE = '<div style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; color: var(--lime); background: rgba(198,255,0,0.08); border: 1px solid rgba(198,255,0,0.3); padding: 4px 12px; letter-spacing: 1px;">NO RESET NEEDED</div>';

// opts.resetAnyway: the player chose to reset a password recon showed is fine.
export function renderBriefing(state, missionId, opts = {}) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return notFound(state);

  const account = ACCOUNTS[mission.accountId];
  const districtId = missionDistrict(mission) || '';
  const district = DISTRICTS.find((d) => d.id === districtId);
  const missionStepList = missionSteps(mission, state);
  // A mission with no account (the password-manager report) opens nothing
  // unless its steps link somewhere.
  const goUrl = missionStepList.find((s) => s.url)?.url || account?.securityUrl || (account ? '#' : '');
  const noReset = isPasswordMission(mission) && !opts.resetAnyway
    && passwordResetNeed(state, mission.accountId) === 'not-needed';
  const noResetFiled = noReset && state.missions[mission.id]?.status === 'not-needed';
  const targetTab = mission.phase ? `?tab=${mission.phase}` : '';

  const colon = mission.title.lastIndexOf(':');
  const titleTop = colon > -1 ? mission.title.slice(0, colon) : '';
  const titleBottom = colon > -1 ? mission.title.slice(colon + 1).trim() : mission.title;

  const steps = missionStepList.map((step, i) => {
    const num = String(i + 1).padStart(2, '0');
    const body = step.url
      ? `<a href="${step.url}" target="_blank" rel="noopener" data-action="mission-step" data-mission="${mission.id}" style="color: var(--cyan); font-weight: 600;">${step.text}</a>`
      : step.text;
    return `
    <div style="display: flex; gap: 14px; align-items: flex-start;">
      <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--cyan); width: 28px; text-align: center; flex-shrink: 0; text-shadow: 0 0 8px rgba(0,229,255,0.4);">${num}</div>
      <div style="font-size: 15px; color: var(--offwhite); line-height: 1.5;">${body}</div>
    </div>`;
  }).join('');

  const preview = account?.building && account?.buildingDark ? `
      <div class="section-label" style="color: rgba(0,229,255,0.4); margin-bottom: 12px;">THIS LIBERATES</div>
      <div style="display: flex; align-items: flex-end; gap: 12px;">
        <div style="text-align: center;">
          <img src="${account.buildingDark}" style="width: 48px; height: auto; filter: brightness(0.6);">
        </div>
        <div style="font-family: var(--font-mono); font-size: 14px; color: var(--cyan); padding-bottom: 18px; text-shadow: 0 0 6px rgba(0,229,255,0.4);">&#9654;</div>
        <div style="text-align: center;">
          <img src="${account.building}" style="width: 48px; height: auto; filter: brightness(1.1) drop-shadow(0 0 6px rgba(0,229,255,0.3));">
        </div>
      </div>
      <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; color: var(--cyan); margin-top: 10px;">${account.name}</div>` : '';

  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    ${renderHud(state)}
    <div style="flex: 1; display: flex; flex-wrap: wrap; align-items: stretch;">
      <div style="flex: 2 1 420px; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 1px; margin-bottom: 20px;">
          <a href="#/district/${districtId}${targetTab}" style="color: rgba(237,239,243,0.4); text-decoration: none;">${district?.name || districtId}</a>
          <span style="color: rgba(237,239,243,0.2);">/</span>
          <span style="color: rgba(237,239,243,0.6); text-transform: uppercase;">${mission.phase}</span>
        </div>

        <div style="font-family: var(--font-display); font-size: 26px; font-weight: 800; line-height: 1.4; letter-spacing: 1px; margin-bottom: 14px; color: var(--offwhite);">
          ${titleTop ? `${titleTop}<br>` : ''}<span style="color: var(--cyan); text-shadow: 0 0 15px rgba(0,229,255,0.3);">${titleBottom}</span>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 24px;">
          <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; color: var(--cyan); background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.2); padding: 4px 12px; letter-spacing: 1px;">${mission.phase.toUpperCase()} MISSION</div>
          ${mission.optional ? `<div style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; color: var(--magenta); background: rgba(255,45,155,0.08); border: 1px solid rgba(255,45,155,0.3); padding: 4px 12px; letter-spacing: 1px;">BONUS &mdash; NEVER BLOCKS PROGRESS</div>` : ''}
          <div style="font-family: var(--font-mono); font-size: 9px; color: rgba(237,239,243,0.4); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 4px 12px;">~${mission.estimatedMinutes} MIN</div>
          ${noReset ? NO_RESET_BADGE : ''}
        </div>
        ${isPasswordMission(mission) && (state.pmFlagged || []).includes(mission.accountId) ? FLAGGED_NOTE : ''}

        ${mission.id === PM_MISSION_ID || mission.id === PM_BURST_ID ? renderPasswordProgress(state) : ''}
        <div class="panel" style="padding: 20px; margin-bottom: 24px;">
          <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 10px;">THREAT INTEL</div>
          <div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7;">${mission.briefing}</div>
        </div>

        ${noReset ? renderNoResetPanel(state, mission) : `
        <div class="panel panel--active" style="padding: 20px; margin-bottom: 28px;">
          <div class="section-label" style="color: var(--cyan); margin-bottom: 14px; text-shadow: 0 0 8px rgba(0,229,255,0.3);">YOUR MOVE</div>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${steps}
          </div>
        </div>`}

        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          ${noReset ? renderNoResetActions(mission, districtId, targetTab, noResetFiled) : state.startedMissions?.[mission.id]
            ? `<a class="btn-primary" href="#/mission/${mission.id}/debrief" data-action="i-did-it" data-mission="${mission.id}" style="text-decoration: none;">I DID IT &#10003;</a>
          <button class="btn-secondary" data-action="go-do-it" data-mission="${mission.id}" data-url="${goUrl}">GO DO IT AGAIN</button>`
            : `<button class="btn-primary" data-action="go-do-it" data-mission="${mission.id}" data-url="${goUrl}">GO DO IT &#9654;</button>`}
          ${noResetFiled ? '' : `<a href="#/district/${districtId}${targetTab}" style="font-size: 13px; color: rgba(237,239,243,0.35); text-decoration: none;">NOT NOW</a>`}
        </div>
      </div>

      <div style="flex: 1 1 240px; background: rgba(26,31,43,0.4); border-left: 1px solid rgba(0,229,255,0.1); padding: 24px; display: flex; flex-direction: column; align-items: center;">
        ${briefingScout(noReset ? 'happy' : undefined)}
        <div style="font-family: var(--font-display); font-size: 9px; font-weight: 700; color: var(--cyan); margin-bottom: 16px; letter-spacing: 3px; text-shadow: 0 0 8px rgba(0,229,255,0.4);">SCOUT</div>
        <div style="background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.15); padding: 14px; width: 100%; margin-bottom: 20px;">
          <div style="font-size: 13px; color: rgba(237,239,243,0.6); line-height: 1.6; font-style: italic;">${noReset ? noResetScoutLine(state, mission) : mission.id === PM_BURST_ID ? pmBurstBriefingLine(state) : (mission.scoutDialog?.briefing || 'Follow the steps above and report back when you\u2019re done.')}</div>
        </div>
        ${preview}
        ${renderLoreSection(districtId, state)}
      </div>
    </div>
  </div>`;
}

const BRIEFING_SCOUT = 'margin-bottom: 12px; filter: drop-shadow(0 0 8px rgba(0,229,255,0.3));';

// The briefing's big Scout. app.js swaps it for goDoIt when the player heads out.
export function briefingScout(feeling) {
  if (!feeling) return `<img src="assets/characters/scout_0.png" data-scout="briefing" style="width: 96px; height: 96px; ${BRIEFING_SCOUT}">`;
  return scoutSprite(feeling, { size: 96, style: BRIEFING_SCOUT, attrs: 'data-scout="briefing"' });
}

// "Clean record" only when the breach check found nothing.
function noResetScoutLine(state, mission) {
  const finding = state.missions[`${mission.accountId}-recon-breach`]?.finding;
  return finding === 'no-breaches' ? PASSWORD_DIALOGUE.notNeeded : PASSWORD_DIALOGUE.notNeededAfterLeak;
}

function renderNoResetPanel(state, mission) {
  const reasons = notNeededReasons(state, mission.accountId)
    .map((r) => `<li style="margin-bottom: 6px;">${r}</li>`).join('');
  return `
        <div class="panel" style="padding: 20px; margin-bottom: 28px; border-color: rgba(198,255,0,0.25);">
          <div class="section-label" style="color: var(--lime); margin-bottom: 12px;">WHY NO RESET</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: var(--offwhite); line-height: 1.5;">${reasons}</ul>
          <div style="font-size: 13px; color: rgba(237,239,243,0.55); line-height: 1.6; margin-top: 10px;">A password only needs changing when it has leaked, been flagged, or someone else has been in the account.</div>
          <div style="font-size: 13px; color: rgba(237,239,243,0.75); line-height: 1.6; margin-top: 8px;">Unless you use this same password somewhere else — then change it here, because a leak there opens this door too.</div>
        </div>`;
}

function renderNoResetActions(mission, districtId, targetTab, filed) {
  const primary = filed
    ? `<a class="btn-primary" href="#/district/${districtId}${targetTab}" style="text-decoration: none;">BACK TO DISTRICT</a>`
    : `<button class="btn-primary" data-action="password-not-needed" data-mission="${mission.id}">GOT IT &#10003;</button>`;
  return `${primary}
          <span data-action="reset-anyway" data-mission="${mission.id}" role="button" tabindex="0" style="cursor: pointer; font-size: 13px; color: var(--cyan); text-decoration: underline;">Reset it anyway</span>`;
}

function renderLoreSection(districtId, state) {
  const dialogue = DISTRICT_DIALOGUE[districtId];
  if (!dialogue?.lore || Object.keys(dialogue.lore).length === 0) return '';
  const seenLore = state.seenLore?.[districtId] || [];
  const unseenKeys = Object.keys(dialogue.lore).filter(k => !seenLore.includes(k));
  const key = unseenKeys.length > 0 ? unseenKeys[0] : Object.keys(dialogue.lore)[0];
  const lore = dialogue.lore[key];
  if (!lore) return '';
  return `
    <div style="width: 100%; margin-top: 16px; border-top: 1px solid rgba(0,229,255,0.1); padding-top: 14px;">
      <div class="section-label" style="color: rgba(255,159,0,0.5); margin-bottom: 8px;">INTEL</div>
      <div style="font-family: var(--font-display); font-size: 9px; font-weight: 700; color: rgba(255,159,0,0.7); letter-spacing: 1px; margin-bottom: 6px;">${lore.title}</div>
      <div style="font-size: 12px; color: rgba(237,239,243,0.5); line-height: 1.6;">${lore.text}</div>
    </div>`;
}
