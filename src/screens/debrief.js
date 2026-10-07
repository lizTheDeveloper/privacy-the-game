import { MISSIONS, missionDistrict } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { renderHud } from '../components/hud.js';
import { DISTRICT_DIALOGUE, PASSWORD_DIALOGUE, TWO_FA_DIALOGUE, pick } from '../data/dialogue.js';
import { calcDistrictProgress, isEmailBreachCheck } from '../utils/calc.js';
import { questionOptions, prefillAnswer } from '../utils/debrief.js';
import { renderPasswordProgress } from '../components/password-progress.js';
import { PM_MISSION_ID } from '../utils/password-need.js';
import { PM_BURST_ID, pmNumbers } from '../utils/bursts.js';
import { twoFactorMethod, CODE_METHODS } from '../utils/two-factor.js';
import { scoutSprite } from '../components/scout.js';
import { feelingForDebrief, twoFactorHugDue } from '../utils/scout-feelings.js';

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

function optionRow(q, opt, checked = false) {
  return `
  <label class="debrief-opt" style="${ROW}">
    <input type="${q.multi ? 'checkbox' : 'radio'}" name="q_${q.id}" value="${opt.value}"${checked ? ' checked' : ''} style="width: 16px; height: 16px; flex-shrink: 0;">
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

// A follow-up question (showIf) starts hidden; app.js shows it once the
// question it depends on has one of its values.
function showIfAttrs(q) {
  if (!q.showIf) return '';
  const rule = q.showIf.values
    ? `data-show-if-values="${q.showIf.values.join(',')}"`
    : `data-show-if-not="${q.showIf.notValues.join(',')}"`;
  return ` hidden data-show-if-q="${q.showIf.question}" ${rule}`;
}

// A number answer: typed in, with any options (like "couldn't check") beside it.
function numberInput(q) {
  const max = q.max !== undefined ? ` max="${q.max}"` : '';
  return `
      <input type="number" name="q_${q.id}" min="${q.min ?? 0}"${max} inputmode="numeric" step="1" aria-label="${q.label}" style="width: 140px; max-width: 100%; background: transparent; border: 1px solid rgba(0,229,255,0.3); color: var(--offwhite); font-size: 18px; padding: 10px 12px; font-family: var(--font-mono);">`;
}

function questionGroup(q, state, mission) {
  const pre = mission ? prefillAnswer(q, mission, state) : undefined;
  return `
  <div data-question="${q.id}"${showIfAttrs(q)} style="margin-bottom: 28px;">
    <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 14px;">${q.label.toUpperCase()}</div>
    ${q.hint ? `<div style="font-size: 12px; color: rgba(237,239,243,0.5); line-height: 1.5; margin: -6px 0 12px;">${q.hint}</div>` : ''}
    ${q.multi ? `<div style="font-size: 12px; color: rgba(237,239,243,0.5); margin: -6px 0 12px;">Pick all that apply.</div>` : ''}
    ${pre ? `<div data-prefilled="${q.id}" style="font-size: 12px; color: var(--cyan); line-height: 1.5; margin: -6px 0 12px;">Filled in from your password manager report. Change it if the report says something else.</div>` : ''}
    ${q.scout ? `<div style="display: flex; gap: 10px; align-items: flex-start; margin: -4px 0 12px;">
      <img src="assets/characters/scout_0.png" alt="" style="width: 28px; height: 28px; flex-shrink: 0;">
      <div style="font-size: 13px; color: rgba(237,239,243,0.65); line-height: 1.6; font-style: italic;">${q.scout}</div>
    </div>` : ''}
    <div style="display: flex; flex-direction: column; gap: 6px;">
      ${q.type === 'number' ? numberInput(q) : ''}
      ${questionOptions(q, state).map((opt) => optionRow(q.type === 'number' ? { ...q, multi: true } : q, opt, pre !== undefined && opt.value === pre)).join('')}
    </div>
  </div>`;
}

// A stored answer that matches no option: a number answer shows its number;
// anything else (an old save's broken string) is "Not recorded", never raw.
function shownValue(q, value) {
  if (q.type === 'number' && /^\d+$/.test(String(value ?? ''))) return String(value);
  return 'Not recorded';
}

function completedGroup(q, stored, state) {
  const value = stored[q.id];
  const options = questionOptions(q, state);
  const optFor = (v) => options.find((o) => o.value === v) || (ACCOUNTS[v] ? { value: v, text: ACCOUNTS[v].name } : null);
  const opts = Array.isArray(value) ? value.map(optFor).filter(Boolean) : [optFor(value)].filter(Boolean);
  const row = opts.length
    ? `<div style="display: flex; flex-direction: column; gap: 6px;">${opts.map(lockedRow).join('')}</div>`
    : `<div style="${ROW}">
        <span style="flex: 1; font-size: 14px; color: rgba(237,239,243,0.5);">${shownValue(q, value)}</span>
       </div>`;
  return `
  <div style="margin-bottom: 28px;">
    <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 14px;">${q.label.toUpperCase()}</div>
    ${row}
  </div>`;
}

// The questions a filed debrief shows: follow-ups only when answered, and a
// save from before a question changed shows the question it answered then.
function completedQuestions(mission, stored, state) {
  // "Change the next 3" finished before its answers were kept: show the total.
  if (mission.id === PM_BURST_ID && stored.changed === undefined) {
    const total = pmNumbers(state)?.changed ?? (Number.isFinite(state.pmChanged) ? state.pmChanged : 0);
    return `
  <div style="margin-bottom: 28px;">
    <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 14px;">${mission.debriefQs[0].label.toUpperCase()}</div>
    <div style="${ROW}"><span style="flex: 1; font-size: 14px; color: var(--offwhite);">${total} changed in all</span></div>
  </div>`;
  }
  // Before v4.7.1 "More than 3" was kept as its number: show it as picked.
  if (mission.id === PM_BURST_ID && /^\d+$/.test(String(stored.changed)) && Number(stored.changed) > 3) {
    stored = { ...stored, changed: 'more', changed_more: Number(stored.changed) };
  }
  return mission.debriefQs.map((q) => {
    if (stored[q.id] !== undefined) return completedGroup(q, stored, state);
    if (q.legacy && stored[q.legacy.id] !== undefined) return completedGroup(q.legacy, stored, state);
    if (q.showIf) return '';
    return completedGroup(q, stored, state);
  }).join('');
}

const BREACHED = new Set(['1-2-breaches', '3plus-breaches']);

// Scout on what the player told us about passwords and 2FA, before the
// district's generic lines.
function passwordScoutLine(mission, stored) {
  if (mission.debriefQs.some((q) => q.kind === 'two-factor')) {
    const line = TWO_FA_DIALOGUE[twoFactorMethod(stored)];
    if (line) return line;
  }
  // "Your address leaked; your password didn't": only true of an email address.
  if (isEmailBreachCheck(mission.id) && BREACHED.has(stored.finding) && stored.password_exposed === 'no') return PASSWORD_DIALOGUE.breachNoPassword;
  return null;
}

function upgradeOffer(mission, stored) {
  if (!mission.debriefQs.some((q) => q.kind === 'two-factor')) return '';
  if (!CODE_METHODS.includes(twoFactorMethod(stored))) return '';
  return `
      <div style="margin-bottom: 24px;">
        <a href="#/mission/${mission.accountId}-fortify-2fa-upgrade/briefing" class="btn-secondary" style="display: inline-block; text-decoration: none;">UPGRADE FROM CODES &mdash; BONUS</a>
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

const DEBRIEF_SCOUT = 'filter: drop-shadow(0 0 6px rgba(0,229,255,0.3));';

function debriefScout(state, mission, stored) {
  const feeling = twoFactorHugDue(state, mission.id) ? 'hug' : feelingForDebrief(mission, stored);
  if (!feeling) return `<img src="assets/characters/scout_0.png" style="width: 52px; height: 52px; ${DEBRIEF_SCOUT}">`;
  return scoutSprite(feeling, { size: 52, style: DEBRIEF_SCOUT });
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

const SEVERITY_RANK = { crit: 3, warn: 2, safe: 1, skip: 0 };

// On a tie, the account's activity speaks first: money that moved is the
// more urgent fact, and its line already ends with "change the password".
const TIE_FIRST = ['activity'];

function mostSevere(mission, stored, values) {
  const rank = (v) => {
    const q = mission.debriefQs.find((x) => stored[x.id] === v);
    const sev = SEVERITY_RANK[q?.options?.find((o) => o.value === v)?.severity] ?? -1;
    return sev * 10 + (TIE_FIRST.includes(q?.id) ? 1 : 0);
  };
  return values.reduce((best, v) => (best === undefined || rank(v) > rank(best) ? v : best), undefined);
}

// Scout's reaction to a filed report: the line, the feeling, and any progress
// check-in. Shown on the debrief when reopened, and on the screen the player
// lands on right after SUBMIT REPORT. null unless the mission is completed.
export function debriefReaction(state, mission) {
  const stored = state.missions[mission.id] || {};
  if (stored.status !== 'completed') return null;
  const districtId = missionDistrict(mission) || '';
  const dialogue = DISTRICT_DIALOGUE[districtId];
  // The mission's own line for an answer: finding first, then every answered
  // question in debriefQs order (action and method for older saves).
  const ownLines = mission.scoutDialog?.debrief || {};
  const answerKeys = ['finding', ...mission.debriefQs.map((q) => q.id), 'action', 'method'];
  const lined = answerKeys.map((k) => stored[k]).filter((v) => typeof v === 'string' && Object.hasOwn(ownLines, v));
  // Several answers (recon Phase 2): the most severe one speaks, so a clean
  // password never hides "something moved that you didn't move".
  const answered = mission.scoutBySeverity ? mostSevere(mission, stored, lined) : lined[0];
  const inlineResponse = answered ? ownLines[answered] : null;
  // The district's clean/minor/major lines talk about breaches: only an email
  // address's breach check gets them, and only when the mission has no line
  // of its own for this answer.
  const category = mapDebriefCategory(stored);
  const breachLine = category === 'clean' || category === 'minor' || category === 'major';
  const variants = breachLine && !isEmailBreachCheck(mission.id) ? null : dialogue?.debrief?.[category];
  const line = passwordScoutLine(mission, stored) || inlineResponse || (variants ? pick(variants) : null) || 'Report received. Good work, agent.';
  const progress = calcDistrictProgress(state, districtId);
  return {
    line,
    progressLine: getProgressCheckIn(state, districtId, progress.percent, dialogue),
    feeling: twoFactorHugDue(state, mission.id) ? 'hug' : feelingForDebrief(mission, stored),
  };
}

export function renderDebrief(state, missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return notFound(state);

  const districtId = missionDistrict(mission) || '';
  const stored = state.missions[missionId] || {};
  const completed = stored.status === 'completed';

  let scoutLine;
  let progressLine = '';
  if (completed) {
    ({ line: scoutLine, progressLine } = debriefReaction(state, mission));
  } else {
    scoutLine = mission.scoutDialog?.briefing || 'Report back — what did you find?';
  }

  const progressPanel = mission.id === PM_MISSION_ID || mission.id === PM_BURST_ID ? renderPasswordProgress(state) : '';
  const questions = completed
    ? `<div class="completed-marker">${completedQuestions(mission, stored, state)}</div>${upgradeOffer(mission, stored)}${progressPanel}`
    : `<div data-debrief="${mission.id}">${mission.debriefQs.map((q) => questionGroup(q, state, mission)).join('')}</div>`;

  const targetTab = mission.phase ? `?tab=${mission.phase}` : '';
  const footer = completed
    ? `
    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
      <span class="badge badge--safe">SECURED</span>
      <a href="#/district/${districtId}${targetTab}" class="btn-primary" style="text-decoration: none;">BACK TO DISTRICT</a>
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
          ${debriefScout(state, mission, stored)}
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
