import { MISSIONS } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { renderHud } from '../components/hud.js';
import { DISTRICT_DIALOGUE, pick } from '../data/dialogue.js';
import { calcDistrictProgress } from '../utils/calc.js';

const ROW = 'display: flex; align-items: center; gap: 12px; background: rgba(26,31,43,0.4); border: 1px solid rgba(255,255,255,0.05); padding: 12px 16px;';

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

function badge(severity) {
  return `<span class="badge badge--${severity}" style="flex-shrink: 0;">${severity.toUpperCase()}</span>`;
}

function optionRow(q, opt) {
  return `
  <label class="debrief-opt" style="${ROW}">
    <input type="radio" name="q_${q.id}" value="${opt.value}" style="width: 16px; height: 16px; flex-shrink: 0;">
    <span style="flex: 1; font-size: 14px; color: var(--offwhite); line-height: 1.5;">${opt.text}</span>
    ${opt.severity ? badge(opt.severity) : ''}
  </label>`;
}

function lockedRow(opt) {
  return `
  <div class="debrief-locked" style="${ROW} border-color: rgba(0,229,255,0.25); background: rgba(0,229,255,0.04);">
    <span style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--cyan); flex-shrink: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(0,229,255,0.4);"><span style="width: 7px; height: 7px; border-radius: 50%; background: var(--cyan);"></span></span>
    <span style="flex: 1; font-size: 14px; color: var(--offwhite); line-height: 1.5;">${opt.text}</span>
    ${opt.severity ? badge(opt.severity) : ''}
  </div>`;
}

function questionGroup(q) {
  return `
  <div style="margin-bottom: 28px;">
    <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 14px;">${q.label.toUpperCase()}</div>
    <div style="display: flex; flex-direction: column; gap: 6px;">
      ${q.options.map((opt) => optionRow(q, opt)).join('')}
    </div>
  </div>`;
}

function completedGroup(q, stored) {
  const value = stored[q.id];
  const opt = q.options.find((o) => o.value === value);
  const row = opt
    ? lockedRow(opt)
    : `<div style="${ROW}">
        <span style="flex: 1; font-size: 14px; color: rgba(237,239,243,0.5);">${value || 'Not recorded'}</span>
       </div>`;
  return `
  <div style="margin-bottom: 28px;">
    <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 14px;">${q.label.toUpperCase()}</div>
    ${row}
  </div>`;
}

function mapDebriefCategory(stored) {
  const finding = stored.finding;
  const action = stored.action;
  if (finding === 'no-breaches') return 'clean';
  if (finding === '1-2-breaches') return 'minor';
  if (finding === '3plus-breaches') return 'major';
  if (action === 'reset-password') return 'passwordReset';
  if (action === 'already-strong') return 'passwordStrong';
  if (action === 'enabled-2fa') return 'tfaEnabled';
  if (action === 'already-enabled') return 'tfaAlready';
  if (action === 'tightened' || action === 'already-tight') return 'clean';
  if (finding === 'skip' || action === 'later') return 'skip';
  if (action === 'claimed' || action === 'already-claimed') return 'claimed';
  if (action === 'alerts-enabled') return 'alertsEnabled';
  if (action === 'freeze-done') return 'freezeDone';
  if (action === 'optout-done') return 'optoutDone';
  if (action === 'action-done') return 'actionDone';
  return null;
}

function getProgressCheckIn(state, districtId, percent, dialogue) {
  if (!dialogue?.progress) return '';
  const milestones = [25, 50, 75, 100];
  const seen = state.seenProgress?.[districtId] || [];
  for (const m of milestones) {
    if (percent >= m && !seen.includes(m) && dialogue.progress[m]) {
      return `<div style="margin-top: 16px; padding: 14px 16px; background: rgba(198,255,0,0.04); border: 1px solid rgba(198,255,0,0.15);">
        <div class="section-label" style="color: rgba(198,255,0,0.6); margin-bottom: 6px;">PROGRESS: ${m}%</div>
        <div style="font-size: 13px; color: rgba(237,239,243,0.7); line-height: 1.6; font-style: italic;">${pick(dialogue.progress[m])}</div>
      </div>`;
    }
  }
  return '';
}

export function renderDebrief(state, missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return notFound(state);

  const account = ACCOUNTS[mission.accountId];
  const districtId = account?.district || '';
  const stored = state.missions[missionId] || {};
  const completed = stored.status === 'completed';

  const dialogue = DISTRICT_DIALOGUE[districtId];
  let scoutLine;
  let progressLine = '';
  if (completed) {
    const inlineResponse = mission.scoutDialog?.debrief?.[stored.finding] || mission.scoutDialog?.debrief?.[stored.action];
    const debriefCategory = mapDebriefCategory(stored);
    const variants = dialogue?.debrief?.[debriefCategory];
    scoutLine = (variants ? pick(variants) : null) || inlineResponse || 'Report received. Good work, agent.';
    const progress = calcDistrictProgress(state, districtId);
    progressLine = getProgressCheckIn(state, districtId, progress.percent, dialogue);
  } else {
    scoutLine = mission.scoutDialog?.briefing || 'Report back — what did you find?';
  }

  const questions = completed
    ? `<div class="completed-marker">${mission.debriefQs.map((q) => completedGroup(q, stored)).join('')}</div>`
    : mission.debriefQs.map((q) => questionGroup(q)).join('');

  const footer = completed
    ? `
    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
      <span class="badge badge--safe">SECURED</span>
      <a href="#/district/${districtId}" class="btn-primary" style="text-decoration: none;">BACK TO DISTRICT</a>
    </div>`
    : `<button class="btn-primary" data-action="submit-debrief" data-mission="${mission.id}">SUBMIT REPORT</button>`;

  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    <style>
      .debrief-opt { cursor: pointer; transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
      .debrief-opt:hover { border-color: rgba(0,229,255,0.5); box-shadow: 0 0 12px rgba(0,229,255,0.12); background: rgba(0,229,255,0.04); }
      .debrief-opt input[type="radio"] { accent-color: var(--cyan); }
    </style>
    ${renderHud(state)}
    <div style="display: flex; align-items: center; gap: 12px; padding: 14px 24px; background: rgba(9,11,16,0.97); border-bottom: 1px solid rgba(0,229,255,0.15);">
      <div style="font-family: var(--font-display); font-size: 10px; font-weight: 700; color: var(--cyan); letter-spacing: 3px; text-shadow: 0 0 10px rgba(0,229,255,0.3);">MISSION DEBRIEF</div>
      <div style="flex: 1; height: 1px; background: linear-gradient(90deg, rgba(0,229,255,0.2), transparent);"></div>
      <a href="#/mission/${mission.id}/briefing" style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.4); text-decoration: none;">&#8592; ${mission.title}</a>
    </div>
    <div style="flex: 1; padding: 24px;">
      <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 32px;">
        <div style="flex-shrink: 0;">
          <img src="assets/characters/scout_0.png" style="width: 52px; height: 52px; filter: drop-shadow(0 0 6px rgba(0,229,255,0.3));">
        </div>
        <div style="background: rgba(26,31,43,0.7); border: 1px solid rgba(0,229,255,0.15); padding: 12px 16px; flex: 1;">
          <div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.6;">${completed ? 'Report filed. Good work, agent.' : 'Welcome back, agent. What did you find?'}</div>
          <div style="font-size: 13px; color: rgba(237,239,243,0.55); line-height: 1.6; font-style: italic; margin-top: 8px;">${scoutLine}</div>
        </div>
      </div>
      ${questions}
      ${progressLine}
      ${footer}
    </div>
  </div>`;
}
