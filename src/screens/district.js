import { DISTRICTS } from '../data/districts.js';
import { ACCOUNTS } from '../data/accounts.js';
import { getMissionsForDistrict } from '../data/missions.js';
import { calcDistrictProgress, getBuildingState } from '../utils/calc.js';
import { renderHud } from '../components/hud.js';
import { renderBuilding } from '../components/building.js';

const PHASES = [
  { id: 'survey', label: 'SURVEY' },
  { id: 'recon', label: 'RECON' },
  { id: 'fortify', label: 'FORTIFY' },
  { id: 'reclaim', label: 'RECLAIM' },
];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function optionText(mission, value) {
  if (!value) return null;
  for (const question of mission.debriefQs) {
    const option = question.options.find((o) => o.value === value);
    if (option) return option.text;
  }
  return null;
}

function missionSummary(mission, record) {
  return [optionText(mission, record.finding), optionText(mission, record.action)]
    .filter(Boolean)
    .join(' — ');
}

function renderNotFound() {
  return `
  <div class="scanlines">
    <div class="panel" style="margin: 48px 24px; padding: 48px 24px; text-align: center;">
      <div style="font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,229,255,0.4);">DISTRICT NOT FOUND</div>
      <div style="font-size: 13px; color: rgba(237,239,243,0.5); margin-top: 12px;">This part of the city does not exist yet.</div>
      <div style="margin-top: 28px;">
        <a class="btn-secondary" style="text-decoration: none;" href="#/city">← CITY</a>
      </div>
    </div>
  </div>`;
}

function renderTabs(districtId, activeTab) {
  const tabs = PHASES.map((phase) => {
    const active = phase.id === activeTab;
    return `
    <a href="#/district/${districtId}?tab=${phase.id}" class="panel${active ? ' panel--active' : ''}" style="padding: 10px 18px; font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 1px; text-decoration: none; border-bottom: 2px solid ${active ? 'var(--cyan)' : 'transparent'}; color: ${active ? 'var(--cyan)' : 'rgba(237,239,243,0.25)'}; background: ${active ? 'rgba(0,229,255,0.04)' : 'transparent'};">${phase.label}</a>`;
  });
  return `
  <div style="display: flex; gap: 8px; padding: 16px 24px 0;">
    ${tabs.join('')}
  </div>`;
}

function renderDisabledPanel(districtId) {
  return `
  <div style="padding: 12px 24px 24px;">
    <div class="panel" style="padding: 32px; text-align: center;">
      <div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--cyan); letter-spacing: 1px; text-shadow: 0 0 12px rgba(0,229,255,0.3);">ALL ACCOUNTS FOR THIS DISTRICT ARE DISABLED</div>
      <div style="font-size: 13px; color: rgba(237,239,243,0.55); margin-top: 12px;">Re-enable them in <a href="#/district/${districtId}?tab=survey" style="color: var(--cyan); font-weight: 600;">Survey</a>.</div>
    </div>
  </div>`;
}

function renderMissionRow(state, mission) {
  const record = state.missions[mission.id];
  const completed = record?.status === 'completed';
  const skipped = record?.status === 'skipped';
  const dimmed = completed || skipped;
  const summary = completed ? missionSummary(mission, record) : '';

  let statusCell;
  if (completed) {
    statusCell = `<div class="badge" style="letter-spacing: 1px; color: var(--lime); background: rgba(198,255,0,0.08); border-color: rgba(198,255,0,0.2);">SECURED</div>`;
  } else if (skipped) {
    statusCell = `
      <div class="badge" style="letter-spacing: 1px; color: rgba(237,239,243,0.4); background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08);">SKIPPED</div>
      <a class="btn-primary" style="padding: 8px 16px; font-size: 9px; text-decoration: none; box-shadow: 0 0 10px rgba(0,229,255,0.15), 0 3px 0 #009bb3;" href="#/mission/${mission.id}/briefing">START</a>`;
  } else {
    statusCell = `<a class="btn-primary" style="padding: 8px 16px; font-size: 9px; text-decoration: none; box-shadow: 0 0 10px rgba(0,229,255,0.15), 0 3px 0 #009bb3;" href="#/mission/${mission.id}/briefing">START</a>`;
  }

  return `
  <div class="mission-row" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid rgba(0,229,255,0.05); ${dimmed ? 'opacity: 0.55;' : 'border: 1px solid rgba(0,229,255,0.2); background: rgba(0,229,255,0.03);'}">
    ${renderBuilding(mission.accountId, getBuildingState(state, mission.accountId), 32)}
    <div style="flex: 1; min-width: 0;">
      <div style="font-size: 14px; font-weight: ${dimmed ? 400 : 600}; color: ${dimmed ? 'rgba(237,239,243,0.6)' : 'var(--offwhite)'};">${esc(mission.title)}</div>
      ${summary ? `<div style="font-size: 11px; color: rgba(237,239,243,0.35); margin-top: 2px;">${esc(summary)}</div>` : ''}
    </div>
    <div class="badge" style="letter-spacing: 1px; color: rgba(0,229,255,0.6); background: rgba(0,229,255,0.05); border-color: rgba(0,229,255,0.15);">${esc(mission.phase).toUpperCase()}</div>
    <div style="font-family: var(--font-mono); font-size: 11px; color: rgba(237,239,243,0.35); white-space: nowrap;">~${mission.estimatedMinutes} min</div>
    ${statusCell}
  </div>`;
}

const PHASE_PREREQ = { fortify: 'recon', reclaim: 'fortify' };

function renderMissionList(state, districtId, activeTab) {
  const missions = getMissionsForDistrict(districtId).filter(
    (m) => m.phase === activeTab && state.accounts[m.accountId]?.enabled,
  );
  if (missions.length === 0) {
    return `
    <div style="padding: 12px 24px 24px;">
      <div class="panel" style="padding: 32px; text-align: center; font-family: var(--font-mono); font-size: 12px; color: rgba(237,239,243,0.4);">No missions available in this phase yet.</div>
    </div>`;
  }
  const prereq = PHASE_PREREQ[activeTab];
  if (prereq) {
    const prereqMissions = getMissionsForDistrict(districtId).filter(
      (m) => m.phase === prereq && state.accounts[m.accountId]?.enabled,
    );
    const prereqDone = prereqMissions.length > 0 && prereqMissions.every((m) => state.missions[m.id]?.status === 'completed');
    if (!prereqDone && prereqMissions.length > 0) {
      const remaining = prereqMissions.filter((m) => state.missions[m.id]?.status !== 'completed').length;
      return `
      <div style="padding: 12px 24px 24px;">
        <div class="panel" style="padding: 32px; text-align: center;">
          <div style="font-family: var(--font-display); font-size: 11px; font-weight: 700; color: var(--cyan); letter-spacing: 2px; margin-bottom: 10px;">COMPLETE ${prereq.toUpperCase()} FIRST</div>
          <div style="font-family: var(--font-mono); font-size: 12px; color: rgba(237,239,243,0.5); line-height: 1.6;">Finish the remaining ${remaining} ${prereq} mission${remaining === 1 ? '' : 's'} before moving to ${activeTab}.</div>
          <div style="margin-top: 16px;"><a class="btn-secondary" style="text-decoration: none;" href="#/district/${districtId}?tab=${prereq}">GO TO ${prereq.toUpperCase()}</a></div>
        </div>
      </div>`;
    }
  }
  return `
  <div style="padding: 12px 24px 24px;">
    <div class="panel" style="padding: 4px;">
      ${missions.map((m) => renderMissionRow(state, m)).join('')}
    </div>
  </div>`;
}

function renderSurvey(state, districtId, districtAccounts, allDisabled) {
  const rows = districtAccounts
    .map(([id, account]) => {
      if (!state.accounts[id]) {
        return `
      <div class="panel" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 8px; opacity: 0.55;">
        <div style="flex: 1; font-size: 14px; color: rgba(237,239,243,0.5);">${esc(account.name)}</div>
        <div class="badge" style="letter-spacing: 1px; color: rgba(237,239,243,0.4); background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08);">COMING SOON</div>
      </div>`;
      }
      const enabled = state.accounts[id].enabled;
      return `
      <div class="panel" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 8px;">
        <div style="flex: 1; font-size: 14px; color: ${enabled ? 'var(--offwhite)' : 'rgba(237,239,243,0.45)'};">Do you use ${esc(account.name)}?</div>
        <span data-action="toggle-account" data-account="${id}" style="cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 6px 14px; border: 1px solid ${enabled ? 'rgba(198,255,0,0.4)' : 'rgba(237,239,243,0.15)'}; background: ${enabled ? 'rgba(198,255,0,0.08)' : 'rgba(255,255,255,0.02)'}; color: ${enabled ? 'var(--lime)' : 'rgba(237,239,243,0.35)'};">${enabled ? 'ON' : 'OFF'}</span>
      </div>`;
    })
    .join('');

  return `
  <div style="padding: 12px 24px 24px;">
    <div class="section-label" style="color: rgba(0,229,255,0.4); margin-bottom: 14px;">INVENTORY SURVEY</div>
    ${allDisabled ? `<div class="panel" style="padding: 14px 16px; margin-bottom: 12px; font-family: var(--font-mono); font-size: 11px; line-height: 1.6; color: rgba(237,239,243,0.5);">All accounts for this district are disabled. Turn any of them back on to start recon.</div>` : ''}
    ${rows}
    <div style="margin-top: 20px; text-align: right;">
      <a class="btn-primary" style="text-decoration: none;" href="#/district/${districtId}?tab=recon">DONE WITH SURVEY — START RECON</a>
    </div>
  </div>`;
}

export function renderDistrict(state, districtId, activeTab) {
  const district = DISTRICTS.find((d) => d.id === districtId);
  if (!district) return renderNotFound();

  const districtAccounts = Object.entries(ACCOUNTS).filter(([, a]) => a.district === districtId);
  const knownAccounts = districtAccounts.filter(([id]) => state.accounts[id]);
  const allDisabled = knownAccounts.length > 0 && knownAccounts.every(([id]) => !state.accounts[id].enabled);
  const progress = calcDistrictProgress(state, districtId);

  if (!activeTab) {
    const hasCompletedAny = getMissionsForDistrict(districtId).some((m) => state.missions[m.id]?.status === 'completed');
    activeTab = hasCompletedAny ? 'recon' : 'survey';
  }

  const buildings = districtAccounts
    .map(([id]) => renderBuilding(id, getBuildingState(state, id)))
    .join('');

  let content;
  if (allDisabled && activeTab !== 'survey') {
    content = renderDisabledPanel(districtId);
  } else if (activeTab === 'survey') {
    content = renderSurvey(state, districtId, districtAccounts, allDisabled);
  } else {
    content = renderMissionList(state, districtId, activeTab);
  }

  return `
  <div class="scanlines">
    ${renderHud(state)}
    <div style="display: flex; align-items: center; gap: 16px; padding: 16px 24px;">
      <a class="btn-secondary" style="flex-shrink: 0; padding: 8px 14px; text-decoration: none;" href="#/city">← CITY</a>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 20px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.15);">${esc(district.name)}</div>
          <div class="badge" style="letter-spacing: 1px; color: var(--cyan); background: rgba(0,229,255,0.05); border-color: rgba(0,229,255,0.25);">CHAPTER ${district.chapter}</div>
        </div>
        <div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-top: 4px;">${esc(district.description)}</div>
      </div>
      <div class="hud-stat hud-stat--cyan" style="flex-shrink: 0;">
        <span class="stat-value" style="color: var(--cyan); text-shadow: 0 0 8px rgba(0,229,255,0.3);">${progress.percent}%</span>
        <span class="stat-label" style="color: rgba(0,229,255,0.5);">SECURED</span>
      </div>
    </div>
    <div style="padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,229,255,0.08); background: rgba(26,31,43,0.3);">
      <div class="section-label" style="color: rgba(0,229,255,0.4); margin-bottom: 14px;">DISTRICT BUILDINGS</div>
      <div style="display: flex; gap: 8px; align-items: flex-end; justify-content: center; flex-wrap: wrap; padding-bottom: 4px;">
        ${buildings}
      </div>
    </div>
    ${renderTabs(districtId, activeTab)}
    ${content}
  </div>`;
}
