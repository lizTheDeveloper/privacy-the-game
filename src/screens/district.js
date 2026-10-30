import { prismTag, prismMark } from '../components/prism-tag.js';
import { DISTRICTS, haveAccount } from '../data/districts.js';
import { ACCOUNTS } from '../data/accounts.js';
import { getMissionsForDistrict, missionDistrict } from '../data/missions.js';
import { calcDistrictProgress, getAccountPhaseGate, getBuildingState } from '../utils/calc.js';
import { renderHud } from '../components/hud.js';
import { renderScout } from '../components/scout.js';
import { renderBuilding } from '../components/building.js';
import { hasInterior } from '../data/interiors/index.js';
import { controllableProgress } from '../utils/interior-state.js';
import { DISTRICT_DIALOGUE, PASSWORD_DIALOGUE, pick } from '../data/dialogue.js';
import { PASSWORD_MANAGERS } from '../data/missions-passwords.js';
import { isMissionDone, isMissionDoneIn, isMissionInPlay } from '../utils/mission-status.js';
import { isPasswordMission, passwordResetNeed, isPmFlagged } from '../utils/password-need.js';
import { twoFactorMethod } from '../utils/two-factor.js';
import { renderPasswordProgress, renderCategoryAsk, renderCategoryQuiet } from '../components/password-progress.js';
import { neededResets } from '../utils/bursts.js';
import { checklistFor } from '../data/broker-checklists.js';
import { splitWords } from '../components/deck.js';

function renderDistrictIntro(state, districtId) {
  const dialogue = DISTRICT_DIALOGUE[districtId];
  if (!dialogue?.intro) return '';
  const seen = state.seenIntros?.[districtId];
  if (seen) return '';
  return `
  <div style="padding: 12px 24px 4px;">
    <div style="display: flex; gap: 14px; align-items: flex-start;">
      <div style="flex-shrink: 0; text-align: center;">
        <img src="assets/characters/scout_0.png" style="width: 52px; height: 52px; filter: drop-shadow(0 0 6px rgba(0,229,255,0.3));">
        <div style="font-family: var(--font-display); font-size: 7px; font-weight: 700; color: var(--cyan); margin-top: 3px; letter-spacing: 2px;">SCOUT</div>
      </div>
      <div style="flex: 1; background: rgba(26,31,43,0.8); border: 1px solid rgba(0,229,255,0.2); padding: 14px 16px;">
        ${introBody(dialogue)}
      </div>
    </div>
    <div style="text-align: right; margin-top: 8px;">
      <span data-action="dismiss-intro" data-district="${districtId}" style="cursor: pointer; font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.35); letter-spacing: 1px;">DISMISS</span>
    </div>
  </div>`;
}

// Scout's welcome opens with its first line or two; the rest (and any lore)
// waits behind MORE, so the phase work stays on the first screen (Liz,
// 2026-10-21). A lead ends at a paragraph break, or at the first sentence
// end once it has run 60 characters.
export function splitIntro(text) {
  const para = text.indexOf('\n\n');
  const re = /[.!?]["”’]?(?=\s)/g;
  let end = -1;
  let m;
  while ((m = re.exec(text))) {
    if (m.index + m[0].length >= 60) { end = m.index + m[0].length; break; }
  }
  if (para !== -1 && (end === -1 || para < end)) end = para;
  if (end === -1) return { lead: text, rest: '' };
  return { lead: text.slice(0, end), rest: text.slice(end).trim() };
}

const INTRO_TEXT = 'font-size: 13px; color: rgba(237,239,243,0.7); line-height: 1.7; font-style: italic;';
const INTRO_LORE = 'font-size: 12px; color: rgba(237,239,243,0.5); line-height: 1.6; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,229,255,0.1);';

// On a phone the lead stops at its first sentence: the rest of the lead opens with MORE,
// first thing (.intro-lead-phone); from 900px the lead shows whole, as it always did.
function introBody(dialogue) {
  const { lead, rest } = splitIntro(dialogue.intro);
  const lore = dialogue.introLore ? `<div style="${INTRO_LORE}">${dialogue.introLore}</div>` : '';
  if (!rest && !lore) return `<div style="${INTRO_TEXT}">${dialogue.intro}</div>`;
  const [first, ...more] = splitWords(lead, 1);
  const leadMore = more.join('').trim();
  const summaryLead = leadMore ? `${first.trim()}<span class="intro-lead-more"> ${leadMore}</span>` : lead;
  return `
        <details class="intro-more">
          <summary style="${INTRO_TEXT}">${summaryLead} <span class="intro-more-toggle"></span></summary>
          ${leadMore ? `<div class="intro-lead-phone" style="${INTRO_TEXT} margin-top: 8px;">${leadMore}</div>` : ''}
          ${rest ? `<div style="${INTRO_TEXT} margin-top: 8px;">${rest}</div>` : ''}
          ${lore}
        </details>`;
}

function renderAlliesSection(districtId) {
  const dialogue = DISTRICT_DIALOGUE[districtId];
  if (!dialogue?.allies?.length) return '';
  const links = dialogue.allies.map(a =>
    `<a href="${a.url}" target="_blank" rel="noopener" style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; background: rgba(26,31,43,0.4); border: 1px solid rgba(0,229,255,0.1); text-decoration: none; margin-bottom: 4px;">
      <div style="font-family: var(--font-display); font-size: 10px; font-weight: 700; color: var(--cyan); letter-spacing: 1px; white-space: nowrap;">${a.name}</div>
      <div style="font-size: 12px; color: rgba(237,239,243,0.5); line-height: 1.4;">${a.description}</div>
    </a>`
  ).join('');
  return `
  <div style="padding: 12px 24px;">
    <div class="section-label" style="color: rgba(198,255,0,0.5); margin-bottom: 10px;">ALLIED ORGANIZATIONS</div>
    <div style="font-size: 12px; color: rgba(237,239,243,0.45); margin-bottom: 10px; line-height: 1.5;">These organizations fight for your digital rights. Your opt-outs create the paper trail. Their lawsuits turn it into enforcement.</div>
    ${links}
  </div>`;
}

const PHASES = [
  { id: 'survey', label: 'SURVEY' },
  { id: 'recon', label: 'RECON' },
  { id: 'fortify', label: 'FORTIFY' },
  { id: 'reclaim', label: 'RECLAIM' },
];

// A building is tappable when it has an interior and the player has it.
function interiorHref(state, id) {
  return hasInterior(id) && state.accounts?.[id]?.enabled ? `#/building/${id}` : undefined;
}

// A building takes centre stage once the player has it (Survey) and has
// finished its Recon and Fortify missions; until then the phase work is the
// main thing on the screen and the building stays a small tile (Liz, 2026-10-21).
function isBuildingCleared(state, districtId, id) {
  if (!state.accounts?.[id]?.enabled) return false;
  return ['recon', 'fortify'].every((phase) => getAccountPhaseGate(state, districtId, id, phase).unlocked);
}

// One building in the skyline: a full card once cleared, else a small tile.
// Everything the badges need comes along only when it can be entered; its
// glow follows the share of doors within reach that are sealed.
function skylineBuilding(state, districtId, id) {
  const cleared = isBuildingCleared(state, districtId, id);
  const href = interiorHref(state, id);
  if (!href) return renderBuilding(id, getBuildingState(state, id), cleared ? 64 : 32);
  const { sealed, controllable } = controllableProgress(state, id);
  return renderBuilding(id, getBuildingState(state, id), cleared ? 64 : 32, {
    href,
    glow: controllable > 0 ? sealed / controllable : 0,
    sealed,
    controllable,
    isNew: !state.interior?.[id]?.visited,
    compact: !cleared,
  });
}

// Shown over a skyline with at least one cleared building you can go inside.
function skylineHint(state, districtId, accountIds) {
  if (!accountIds.some((id) => interiorHref(state, id) && isBuildingCleared(state, districtId, id))) return '';
  return `<div class="skyline-hint">Buildings you’ve cleared open up. Tap <b>INSIDE ▸</b> to walk through one.</div>`;
}

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
    // Old saves answered questions that have since changed (question.legacy).
    for (const q of [question, question.legacy].filter(Boolean)) {
      const option = q.options.find((o) => o.value === value);
      if (option) return option.text;
    }
  }
  return null;
}

function missionSummary(mission, record) {
  const parts = [optionText(mission, record.finding), optionText(mission, record.password_exposed)];
  // "Same address as my Gmail" (X4): the answer is the whole report.
  if (record.same_address && !record.finding) parts.push(optionText(mission, record.same_address));
  if (record.method) parts.push(optionText(mission, twoFactorMethod(record)));
  else if (Array.isArray(record.flagged)) {
    const names = record.flagged.filter((v) => ACCOUNTS[v]).map((v) => ACCOUNTS[v].name);
    parts.push(names.length ? `Flagged: ${names.join(', ')}` : optionText(mission, 'none'));
  } else parts.push(optionText(mission, record.action));
  return parts.filter(Boolean).join(' — ');
}

const NO_RESET_STYLE = 'letter-spacing: 1px; color: var(--lime); background: rgba(198,255,0,0.08); border-color: rgba(198,255,0,0.2);';

// A mission with no account (the password-manager report) has no building.
function missionIcon(state, mission) {
  if (ACCOUNTS[mission.accountId]) return renderBuilding(mission.accountId, getBuildingState(state, mission.accountId), 32);
  const icon = mission.inPlayIfAny ? '&#128663;' : '&#128273;';
  return `<div aria-hidden="true" style="width: 32px; text-align: center; font-size: 20px; color: var(--cyan); flex-shrink: 0;">${icon}</div>`;
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
    <a href="#/district/${districtId}?tab=${phase.id}" class="panel${active ? ' panel--active' : ''}" style="flex: 1 1 0; min-width: 0; text-align: center; padding: 10px 4px; font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 1px; text-decoration: none; border-bottom: 2px solid ${active ? 'var(--cyan)' : 'transparent'}; color: ${active ? 'var(--cyan)' : 'rgba(237,239,243,0.25)'}; background: ${active ? 'rgba(0,229,255,0.04)' : 'transparent'};">${phase.label}</a>`;
  });
  return `
  <div style="display: flex; flex-wrap: wrap; gap: 6px; padding: 16px 24px 0;">
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
  const notNeeded = record?.status === 'not-needed';
  const completed = isMissionDone(record);
  const skipped = record?.status === 'skipped';
  const dimmed = completed || skipped;
  const summary = completed && !notNeeded ? missionSummary(mission, record) : '';
  const noResetYet = !completed && isPasswordMission(mission) && passwordResetNeed(state, mission.accountId) === 'not-needed';

  let statusCell;
  if (notNeeded && passwordResetNeed(state, mission.accountId) === 'not-needed') {
    // A link, so the player can still choose "Reset it anyway" from the briefing.
    statusCell = `<a class="badge" style="${NO_RESET_STYLE} text-decoration: none;" href="#/mission/${mission.id}/briefing">NO RESET NEEDED</a>`;
  } else if (notNeeded) {
    // Filed "not needed" on evidence that no longer says so (an old email
    // re-check): it keeps its status and progress, but no longer claims it.
    statusCell = `<a class="badge" style="letter-spacing: 1px; color: rgba(237,239,243,0.55); background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.12); text-decoration: none;" href="#/mission/${mission.id}/briefing">FILED</a>`;
  } else if (completed) {
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
    ${missionIcon(state, mission)}
    <div class="mission-text" style="flex: 1; min-width: 0;">
      <div style="font-size: 14px; font-weight: ${dimmed ? 400 : 600}; color: ${dimmed ? 'rgba(237,239,243,0.6)' : 'var(--offwhite)'};">${esc(mission.title)}</div>
      ${summary ? `<div style="font-size: 11px; color: rgba(237,239,243,0.35); margin-top: 2px;">${esc(summary)}</div>` : ''}
      ${mission.optional ? `<div style="font-size: 11px; color: rgba(237,239,243,0.35); margin-top: 2px;">Optional bonus &mdash; never blocks progress or Secured.</div>` : ''}
      ${noResetYet ? `<div style="font-size: 11px; color: var(--lime); margin-top: 2px;">No reset needed &mdash; open it to see why.</div>` : ''}
      ${!completed && mission.replaces && isMissionDone(state.missions[mission.replaces]) ? `<div style="font-size: 11px; color: rgba(237,239,243,0.45); margin-top: 2px;">Your earlier email check still counts toward progress. This one checks the account itself.</div>` : ''}
      ${!completed && isPasswordMission(mission) && isPmFlagged(state, mission.accountId) ? `<div style="font-size: 11px; color: var(--magenta); margin-top: 2px;">Flagged by your password manager</div>` : ''}
    </div>
    ${mission.optional
      ? `<div class="badge" style="letter-spacing: 1px; color: rgba(255,45,155,0.7); background: rgba(255,45,155,0.06); border-color: rgba(255,45,155,0.2);">BONUS</div>`
      : `<div class="badge" style="letter-spacing: 1px; color: rgba(0,229,255,0.6); background: rgba(0,229,255,0.05); border-color: rgba(0,229,255,0.15);">${esc(mission.phase).toUpperCase()}</div>`}
    <div style="font-family: var(--font-mono); font-size: 11px; color: rgba(237,239,243,0.35); white-space: nowrap;">~${mission.estimatedMinutes} min</div>
    ${statusCell}
  </div>`;
}

const PHASE_PREREQ = { fortify: 'recon', reclaim: 'fortify' };

function renderMissionList(state, districtId, activeTab) {
  const missions = getMissionsForDistrict(districtId).filter(
    (m) => m.phase === activeTab && isMissionInPlay(state, m),
  );
  missions.sort((a, b) => (a.optional ? 1 : 0) - (b.optional ? 1 : 0));
  if (missions.length === 0) {
    return `
    <div style="padding: 12px 24px 24px;">
      <div class="panel" style="padding: 32px; text-align: center; font-family: var(--font-mono); font-size: 12px; color: rgba(237,239,243,0.4);">No missions available in this phase yet.</div>
    </div>`;
  }
  const prereq = PHASE_PREREQ[activeTab];
  if (prereq) {
    const byAccount = new Map();
    for (const m of missions) {
      if (!byAccount.has(m.accountId)) byAccount.set(m.accountId, []);
      byAccount.get(m.accountId).push(m);
    }
    const blocks = [...byAccount.entries()].map(([accountId, accountMissions]) => {
      const gate = getAccountPhaseGate(state, districtId, accountId, prereq);
      if (gate.unlocked) {
        return accountMissions.map((m) => renderMissionRow(state, m)).join('');
      }
      const accountName = ACCOUNTS[accountId]?.name || accountId;
      return `
      <div class="mission-row" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid rgba(0,229,255,0.05);">
        ${renderBuilding(accountId, getBuildingState(state, accountId), 32)}
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 13px; font-weight: 600; color: rgba(237,239,243,0.6);">Complete ${prereq.toUpperCase()} for ${esc(accountName)} first</div>
          <div style="font-size: 11px; color: rgba(237,239,243,0.35); margin-top: 2px;">Finish the remaining ${gate.remaining} ${prereq} mission${gate.remaining === 1 ? '' : 's'} for ${esc(accountName)} to unlock ${activeTab.toUpperCase()} for this building. Buildings you have fully cleared in ${prereq.toUpperCase()} stay open.</div>
        </div>
        <a class="btn-secondary" style="padding: 8px 16px; font-size: 9px; text-decoration: none; white-space: nowrap;" href="#/district/${districtId}?tab=${prereq}">GO TO ${prereq.toUpperCase()}</a>
      </div>`;
    }).join('');
    return `
    <div style="padding: 12px 24px 24px;">
      <div class="panel" style="padding: 4px;">
        ${blocks}
      </div>
    </div>`;
  }
  return `
  <div style="padding: 12px 24px 24px;">
    <div class="panel" style="padding: 4px;">
      ${missions.map((m) => renderMissionRow(state, m)).join('')}
    </div>
  </div>`;
}

// The one question over a phone's chip grid: what each row asks, of all of them at once.
// A question that ends on the name ("Do you use X?") asks "… any of these?"; any other shape
// (a vehicle question, say) gets the plain "Which of these do you have?".
export function surveyAsk(questionFn) {
  if (questionFn === haveAccount) return 'Which of these accounts do you have?';
  const MARK = '\u0000';
  const q = String(questionFn(MARK));
  const at = q.indexOf(MARK);
  return at > 0 && q.slice(at) === `${MARK}?` ? `${q.slice(0, at)}any of these?` : 'Which of these do you have?';
}

// On a phone the accounts are chips under one question; each chip is a button, pressed when
// the account is on, named with its own full question. From 900px, the rows as before.
function surveyChips(state, districtAccounts, questionFn) {
  const chips = districtAccounts.map(([id, account]) => {
    if (!state.accounts[id]) {
      return `<button type="button" class="survey-chip survey-chip--soon" disabled>${esc(account.name)} <span class="survey-chip-soon">COMING SOON</span></button>`;
    }
    const on = !!state.accounts[id].enabled;
    return `<button type="button" class="survey-chip${on ? ' is-on' : ''}" data-action="toggle-account" data-account="${id}" aria-pressed="${on}" aria-label="${esc(questionFn(account.name))}"><span class="survey-chip-mark" aria-hidden="true">${on ? '✓' : ''}</span>${esc(account.name)}${prismMark(id)}</button>`;
  }).join('');
  return `<div class="phone-only survey-chips"><div class="survey-ask">${esc(surveyAsk(questionFn))}</div><div class="survey-chip-grid">${chips}</div></div><!-- /survey-chips -->`;
}

function renderSurvey(state, districtId, districtAccounts, allDisabled) {
  const district = DISTRICTS.find((d) => d.id === districtId);
  const questionFn = district?.surveyQuestion || haveAccount;

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
        <div style="flex: 1; font-size: 14px; color: ${enabled ? 'var(--offwhite)' : 'rgba(237,239,243,0.45)'};">${esc(questionFn(account.name))}${prismTag(id)}</div>
        <span data-action="toggle-account" data-account="${id}" style="cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 6px 14px; border: 1px solid ${enabled ? 'rgba(198,255,0,0.4)' : 'rgba(237,239,243,0.15)'}; background: ${enabled ? 'rgba(198,255,0,0.08)' : 'rgba(255,255,255,0.02)'}; color: ${enabled ? 'var(--lime)' : 'rgba(237,239,243,0.35)'};">${enabled ? 'ON' : 'OFF'}</span>
      </div>`;
    })
    .join('');

  const customAccounts = (state.customAccounts?.[districtId] || []);
  const customRows = customAccounts.map((name, i) => `
    <div class="panel" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 8px;">
      <div style="flex: 1; font-size: 14px; color: var(--offwhite);">${esc(name)}</div>
      <span data-action="remove-custom-account" data-district="${districtId}" data-index="${i}" style="cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 6px 14px; border: 1px solid rgba(255,45,155,0.3); background: rgba(255,45,155,0.05); color: var(--magenta);">REMOVE</span>
    </div>`).join('');

  return `
  <div style="padding: 12px 24px 24px;">
    <div class="section-label" style="color: rgba(0,229,255,0.4); margin-bottom: 14px;">INVENTORY SURVEY</div>
    ${allDisabled ? `<div class="panel" style="padding: 14px 16px; margin-bottom: 12px; font-family: var(--font-mono); font-size: 11px; line-height: 1.6; color: rgba(237,239,243,0.5);">All accounts for this district are disabled. Turn any of them back on to start recon.</div>` : ''}
    <div class="desktop-only survey-rows">${rows}</div>
    ${surveyChips(state, districtAccounts, questionFn)}
    ${district?.askPasswordManager ? renderPasswordManagerQuestion(state) : ''}
    ${customRows}
    <div class="panel" style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; margin-bottom: 8px; margin-top: 16px;">
      <input id="custom-account-input" type="text" placeholder="Add another account..." style="flex: 1; background: transparent; border: 1px solid rgba(237,239,243,0.15); color: var(--offwhite); font-size: 14px; padding: 8px 12px; font-family: inherit; outline: none;" />
      <span data-action="add-custom-account" data-district="${districtId}" class="btn-secondary" style="cursor: pointer; padding: 8px 16px; font-family: var(--font-display); font-size: 9px; font-weight: 700; letter-spacing: 1px;">+ ADD</span>
    </div>
    <div style="margin-top: 20px; text-align: right;">
      <a class="btn-primary" style="text-decoration: none; display: inline-block; max-width: 100%;" href="#/district/${districtId}?tab=recon">DONE WITH SURVEY — START RECON</a>
    </div>
  </div>`;
}

// The per-category password-manager ask, at the top of every district.
function categoryAskBlock(state, districtId) {
  const html = renderCategoryAsk(state, districtId);
  return html ? `<div style="padding: 0 24px;">${html}</div>` : '';
}

// Master Keys always; other districts while one of their resets is needed.
function showsPasswordProgress(state, districtId) {
  if (districtId === 'master-keys') return true;
  return neededResets(state).some((m) => missionDistrict(m) === districtId);
}

function renderPasswordManagerQuestion(state) {
  const chosen = state.passwordManager;
  const chips = PASSWORD_MANAGERS.map((pm) => {
    const on = pm.value === chosen;
    return `<span data-action="set-password-manager" data-pm="${pm.value}" role="button" tabindex="0" aria-pressed="${on}" style="cursor: pointer; font-size: 12px; padding: 7px 12px; border: 1px solid ${on ? 'rgba(198,255,0,0.4)' : 'rgba(237,239,243,0.15)'}; background: ${on ? 'rgba(198,255,0,0.08)' : 'rgba(255,255,255,0.02)'}; color: ${on ? 'var(--lime)' : 'rgba(237,239,243,0.7)'};">${esc(pm.text)}</span>`;
  }).join('');
  const line = chosen === 'none' ? PASSWORD_DIALOGUE.noManager : chosen ? PASSWORD_DIALOGUE.hasManager : '';
  return `
    <div class="panel" style="padding: 14px; margin: 16px 0 8px;">
      <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 12px;">DO YOU USE A PASSWORD MANAGER?</div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">${chips}</div>
      ${line ? `<div style="display: flex; gap: 10px; align-items: flex-start; margin-top: 14px;">
        <img src="assets/characters/scout_0.png" alt="" style="width: 32px; height: 32px; flex-shrink: 0;">
        <div style="font-size: 13px; color: rgba(237,239,243,0.65); line-height: 1.6; font-style: italic;">${esc(line)}</div>
      </div>` : ''}
    </div>`;
}

function renderQuizFacility(state, facilityId, district) {
  const account = ACCOUNTS[facilityId];
  if (!account) return '';
  const buildingState = getBuildingState(state, facilityId);
  const connection = district.facilityConnections?.[facilityId];
  const quiz = state.phishingQuiz || { curated: {} };
  const answered = Object.keys(quiz.curated).length;
  const correct = Object.values(quiz.curated).filter(a => a.correct).length;
  const total = 12;
  const allDone = answered >= total;
  const pctWidth = Math.round((answered / total) * 100);
  const statusColor = allDone ? 'var(--lime)' : answered > 0 ? 'var(--cyan)' : 'rgba(237,239,243,0.3)';
  const statusText = allDone ? 'SECURED' : answered > 0 ? `${answered}/${total}` : 'READY';
  const btnLabel = allDone ? 'QUIZ MODE — KEEP PRACTICING' : answered > 0 ? 'CONTINUE TRAINING' : 'START TRAINING';

  return `
  <div style="margin-bottom: 16px;">
    ${connection ? `<div style="padding: 0 24px 6px; font-family: var(--font-mono); font-size: 10px; color: rgba(255,159,0,0.5); letter-spacing: 1px;">↳ ${esc(connection)}</div>` : ''}
    <div class="panel" style="margin: 0 16px; overflow: hidden;">
      <div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(26,31,43,0.6); border-bottom: 1px solid rgba(0,229,255,0.1);">
        ${renderBuilding(facilityId, buildingState, 40)}
        <div style="flex: 1; min-width: 0;">
          <div style="font-family: var(--font-display); font-size: 11px; font-weight: 700; color: var(--offwhite); letter-spacing: 1px;">${esc(account.name)}${prismTag(facilityId)}</div>
          <div style="margin-top: 6px; height: 3px; background: rgba(255,255,255,0.06); overflow: hidden;">
            <div style="width: ${pctWidth}%; height: 100%; background: ${allDone ? 'var(--lime)' : 'var(--cyan)'}; transition: width 300ms;"></div>
          </div>
        </div>
        <div class="badge" style="letter-spacing: 1px; color: ${statusColor}; background: rgba(0,229,255,0.04); border-color: rgba(0,229,255,0.15);">${statusText}</div>
      </div>
      <div style="padding: 16px; text-align: center;">
        <div style="font-size: 13px; color: rgba(237,239,243,0.55); line-height: 1.6; margin-bottom: 14px;">
          Real or fake? Identify phishing emails, texts, calls, and push notifications.
          ${answered > 0 ? `<span style="font-family: var(--font-mono); color: var(--cyan);">${correct}/${answered} correct so far.</span>` : ''}
        </div>
        <a class="btn-primary" style="display: inline-block; text-decoration: none; font-size: 10px; padding: 12px 24px;" href="#/quiz/phishing">${btnLabel}</a>
      </div>
    </div>
  </div>`;
}

function renderFacilitySection(state, facilityId, district) {
  if (facilityId === 'scam_defense') return renderQuizFacility(state, facilityId, district);

  const account = ACCOUNTS[facilityId];
  if (!account) return '';
  const missions = getMissionsForDistrict(district.id).filter((m) => m.accountId === facilityId && !m.legacy);
  const completed = missions.filter((m) => isMissionDoneIn(state, m)).length;
  const total = missions.length;
  const allDone = total > 0 && completed === total;
  const buildingState = getBuildingState(state, facilityId);
  const connection = district.facilityConnections?.[facilityId];

  const pctWidth = total > 0 ? Math.round((completed / total) * 100) : 0;
  const statusColor = allDone ? 'var(--lime)' : completed > 0 ? 'var(--cyan)' : 'rgba(237,239,243,0.3)';
  const statusText = allDone ? 'SECURED' : completed > 0 ? `${completed}/${total}` : 'LOCKED';

  const missionRows = missions.map((m) => {
    const record = state.missions[m.id];
    const done = isMissionDone(record);
    const skipped = record?.status === 'skipped';
    const summary = done ? missionSummary(m, record) : '';

    // A done row is dimmed piece by piece, so RE-CHECK stays full strength like RETRY.
    const dim = done ? 'opacity: 0.5;' : '';
    let action;
    if (done) {
      action = `<div class="badge" style="${dim} letter-spacing: 1px; color: var(--lime); background: rgba(198,255,0,0.08); border-color: rgba(198,255,0,0.2);">DONE</div>`;
      // A filed broker mission can be filed again: main's re-check mode.
      if (record.status === 'completed' && checklistFor(m.id)) {
        action = `<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">${action}<a class="btn-primary" style="padding: 6px 14px; font-size: 8px; text-decoration: none; box-shadow: 0 0 10px rgba(0,229,255,0.15), 0 2px 0 #009bb3;" href="#/mission/${m.id}/recheck">RE-CHECK</a></div>`;
      }
    } else if (skipped) {
      action = `<a class="btn-primary" style="padding: 6px 14px; font-size: 8px; text-decoration: none; box-shadow: 0 0 10px rgba(0,229,255,0.15), 0 2px 0 #009bb3;" href="#/mission/${m.id}/briefing">RETRY</a>`;
    } else {
      action = `<a class="btn-primary" style="padding: 6px 14px; font-size: 8px; text-decoration: none; box-shadow: 0 0 10px rgba(0,229,255,0.15), 0 2px 0 #009bb3;" href="#/mission/${m.id}/briefing">START</a>`;
    }

    return `
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid rgba(0,229,255,0.04);">
      <div style="${dim} font-family: var(--font-mono); font-size: 10px; color: ${done ? 'var(--lime)' : skipped ? 'rgba(237,239,243,0.3)' : 'var(--cyan)'}; width: 16px; text-align: center;">${done ? '✓' : skipped ? '↺' : '▸'}</div>
      <div style="${dim} flex: 1; min-width: 0;">
        <div style="font-size: 13px; font-weight: ${done ? 400 : 500}; color: ${done ? 'rgba(237,239,243,0.5)' : 'var(--offwhite)'};">${esc(m.title)}</div>
        ${summary ? `<div style="font-size: 10px; color: rgba(237,239,243,0.3); margin-top: 2px;">${esc(summary)}</div>` : ''}
      </div>
      <div style="${dim} font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.25);">~${m.estimatedMinutes}m</div>
      ${action}
    </div>`;
  }).join('');

  return `
  <div style="margin-bottom: 16px;">
    ${connection ? `<div style="padding: 0 24px 6px; font-family: var(--font-mono); font-size: 10px; color: rgba(255,159,0,0.5); letter-spacing: 1px;">↳ ${esc(connection)}</div>` : ''}
    <div class="panel" style="margin: 0 16px; overflow: hidden;">
      <div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(26,31,43,0.6); border-bottom: 1px solid rgba(0,229,255,0.1);">
        <span class="facility-icon">${renderBuilding(facilityId, buildingState, 40)}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-family: var(--font-display); font-size: 11px; font-weight: 700; color: var(--offwhite); letter-spacing: 1px;">${esc(account.name)}${prismTag(facilityId)}</div>
          <div style="margin-top: 6px; height: 3px; background: rgba(255,255,255,0.06); overflow: hidden;">
            <div style="width: ${pctWidth}%; height: 100%; background: ${allDone ? 'var(--lime)' : 'var(--cyan)'}; transition: width 300ms;"></div>
          </div>
        </div>
        <div class="badge" style="letter-spacing: 1px; color: ${statusColor}; background: rgba(0,229,255,0.04); border-color: rgba(0,229,255,0.15);">${statusText}</div>
      </div>
      <div>
        ${missionRows}
      </div>
    </div>
  </div>`;
}

// Scout's reaction to the report just filed (app.js passes it on the landing
// visit only): the same line and feeling the debrief shows when reopened.
function reactionBlock(reaction) {
  if (!reaction) return '';
  return `<div data-scout-reaction style="padding: 16px 24px 0;">
    <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 8px;">REPORT FILED</div>
    ${renderScout(reaction.line, { feeling: reaction.feeling })}
    ${reaction.progressLine || ''}
  </div>`;
}

// The Reclamation's way up to the Broker Constellation: the night sky above the city, where the
// player's data drifted (Liz, 2026-10-24). Controller ruling: the label is LOOK UP.
const MAP_WAY_IN = `
    <div style="padding: 16px 16px 4px;">
      <a class="map-way-in" href="#/reclamation/map" style="display: flex; align-items: center; gap: 14px; min-height: 44px; padding: 14px 16px; text-decoration: none; background: linear-gradient(180deg, #090B10 0%, #121826 100%); border: 1px solid rgba(198,255,0,0.3); box-shadow: 0 0 18px rgba(198,255,0,0.08);">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" style="flex-shrink: 0;"><path d="M6 12 L18 7 L30 14 L24 26" fill="none" stroke="#00E5FF" stroke-opacity=".5" stroke-width="1"/><circle cx="6" cy="12" r="2" fill="#3a4256"/><circle cx="18" cy="7" r="2.5" fill="#C6FF00"/><circle cx="30" cy="14" r="2" fill="#3a4256"/><circle cx="24" cy="26" r="1.8" fill="#C6FF00"/><path d="M0 40 V33 H6 V30 H12 V35 H18 V28 H24 V34 H30 V31 H36 V36 H40 V40 Z" fill="#1A1F2B"/></svg>
        <span style="flex: 1; min-width: 0;">
          <span style="display: block; font-family: var(--font-display); font-size: 14px; font-weight: 800; color: var(--lime); letter-spacing: 3px;">LOOK UP</span>
          <span style="display: block; font-size: 13px; color: var(--offwhite); margin-top: 4px; line-height: 1.5;">Your data drifted up out of the city. Go find it.</span>
          <span style="display: block; font-size: 11px; color: rgba(237,239,243,0.5); margin-top: 2px; line-height: 1.5;">Every data broker we could find, and which ones your opt-outs reach.</span>
        </span>
        <span aria-hidden="true" style="color: var(--lime); font-size: 18px;">↑</span>
      </a>
    </div>`;

function renderFacilityDistrict(state, district, reaction) {
  const districtAccounts = Object.entries(ACCOUNTS).filter(([, a]) => a.district === district.id);
  const progress = calcDistrictProgress(state, district.id);

  const buildings = districtAccounts
    .map(([id]) => skylineBuilding(state, district.id, id))
    .join('');

  const facilityOrder = district.facilityOrder || districtAccounts.map(([id]) => id);
  const facilities = facilityOrder
    .map((id) => renderFacilitySection(state, id, district))
    .join('');

  return `
  <div class="scanlines">
    ${renderHud(state)}
    ${reactionBlock(reaction)}
    <div style="display: flex; align-items: center; gap: 16px; padding: 16px 24px;">
      <a class="btn-secondary" style="flex-shrink: 0; padding: 8px 14px; text-decoration: none;" href="#/city">← CITY</a>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 20px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.15);">${esc(district.name)}</div>
          <div class="badge" style="letter-spacing: 1px; color: var(--cyan); background: rgba(0,229,255,0.05); border-color: rgba(0,229,255,0.25);">CHAPTER ${district.chapter}</div>
        </div>
        <div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-top: 4px;">${esc(district.description)}</div>
        ${renderCategoryQuiet(state, district.id)}
      </div>
      <div class="hud-stat hud-stat--cyan" style="flex-shrink: 0;">
        <span class="stat-value" style="color: var(--cyan); text-shadow: 0 0 8px rgba(0,229,255,0.3);">${progress.percent}%</span>
        <span class="stat-label" style="color: rgba(0,229,255,0.5);">SECURED</span>
      </div>
    </div>
    ${categoryAskBlock(state, district.id)}
    <div style="padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,229,255,0.08); background: rgba(26,31,43,0.3);">
      <div class="section-label" style="color: rgba(0,229,255,0.4); margin-bottom: 14px;">DISTRICT FACILITIES</div>
      ${skylineHint(state, district.id, districtAccounts.map(([id]) => id))}
      <div style="display: flex; gap: 8px; align-items: flex-end; justify-content: center; flex-wrap: wrap; padding-bottom: 4px;">
        ${buildings}
      </div>
    </div>
    ${district.id === 'reclamation' ? MAP_WAY_IN : ''}
    ${renderDistrictIntro(state, district.id)}
    ${district.facilityIntro && (state.seenIntros?.[district.id]) ? `
    <div style="padding: 16px 24px 8px;">
      <div style="font-size: 13px; color: rgba(237,239,243,0.55); line-height: 1.6; max-width: 640px;">${esc(district.facilityIntro)}</div>
    </div>` : ''}
    <div style="padding: 8px 0 24px;">
      ${facilities}
    </div>
    ${progress.percent >= 100 ? renderAlliesSection(district.id) : ''}
  </div>`;
}

export function renderDistrict(state, districtId, activeTab, { reaction = null } = {}) {
  const district = DISTRICTS.find((d) => d.id === districtId);
  if (!district) return renderNotFound();

  if (district.type === 'facility') {
    return renderFacilityDistrict(state, district, reaction);
  }

  const districtAccounts = Object.entries(ACCOUNTS).filter(([, a]) => a.district === districtId);
  const knownAccounts = districtAccounts.filter(([id]) => state.accounts[id]);
  const allDisabled = knownAccounts.length > 0 && knownAccounts.every(([id]) => !state.accounts[id].enabled);
  const progress = calcDistrictProgress(state, districtId);

  if (!activeTab) {
    // A filed legacy record counts too: an old save opens on Recon, not Survey.
    const filed = (id) => state.missions[id]?.status === 'completed';
    const hasCompletedAny = getMissionsForDistrict(districtId).some((m) => filed(m.id) || (m.replaces && filed(m.replaces)));
    activeTab = hasCompletedAny ? 'recon' : 'survey';
  }

  const buildings = districtAccounts
    .map(([id]) => skylineBuilding(state, districtId, id))
    .join('');

  let content;
  if (district.hasGarage && activeTab === 'survey') {
    const vehicleCount = (state.vehicles || []).length;
    content = `
    <div style="padding: 12px 24px 24px;">
      <div class="panel" style="padding: 32px; text-align: center;">
        <div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--cyan); letter-spacing: 2px; margin-bottom: 12px;">VEHICLE GARAGE</div>
        <div style="font-size: 13px; color: rgba(237,239,243,0.55); line-height: 1.6; margin-bottom: 20px;">${vehicleCount > 0 ? `You have ${vehicleCount} vehicle${vehicleCount === 1 ? '' : 's'} in your garage. Add more or start missions.` : 'Add your vehicles to see what data they collect and how to opt out.'}</div>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a class="btn-primary" style="text-decoration: none;" href="#/garage">OPEN GARAGE</a>
          ${vehicleCount > 0 ? `<a class="btn-secondary" style="text-decoration: none;" href="#/district/freeway?tab=recon">START RECON</a>` : ''}
        </div>
      </div>
    </div>`;
  } else if (districtId === 'square' && activeTab === 'reclaim') {
    const timelineConfigured = Object.keys(state.socialHistory || {}).length;
    const timelineBanner = `
    <div style="padding: 12px 24px 0;">
      <div style="background: rgba(0,229,255,0.04); border: 1px solid rgba(0,229,255,0.15); padding: 16px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <div style="font-family: var(--font-display); font-size: 10px; font-weight: 700; color: var(--cyan); letter-spacing: 2px; margin-bottom: 6px;">SOCIAL TIMELINE</div>
          <div style="font-size: 12px; color: rgba(237,239,243,0.55); line-height: 1.5;">${timelineConfigured > 0 ? `${timelineConfigured} platform${timelineConfigured === 1 ? '' : 's'} mapped. Review missions are sized to your history.` : `Map your social media history first — we'll break the review into right-sized segments based on how active you were.`}</div>
        </div>
        <a href="#/timeline" style="font-family: var(--font-display); font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #00E5FF; padding: 10px 18px; border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.08); text-decoration: none;">${timelineConfigured > 0 ? 'EDIT TIMELINE' : 'SET UP TIMELINE'}</a>
      </div>
    </div>`;
    content = timelineBanner + renderMissionList(state, districtId, activeTab);
  } else if (allDisabled && activeTab !== 'survey') {
    content = renderDisabledPanel(districtId);
  } else if (activeTab === 'survey') {
    content = renderSurvey(state, districtId, districtAccounts, allDisabled);
  } else {
    content = renderMissionList(state, districtId, activeTab);
  }

  return `
  <div class="scanlines">
    ${renderHud(state)}
    ${reactionBlock(reaction)}
    <div style="display: flex; align-items: center; gap: 16px; padding: 16px 24px;">
      <a class="btn-secondary" style="flex-shrink: 0; padding: 8px 14px; text-decoration: none;" href="#/city">← CITY</a>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 20px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.15);">${esc(district.name)}</div>
          <div class="badge" style="letter-spacing: 1px; color: var(--cyan); background: rgba(0,229,255,0.05); border-color: rgba(0,229,255,0.25);">CHAPTER ${district.chapter}</div>
        </div>
        <div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-top: 4px;">${esc(district.description)}</div>
        ${renderCategoryQuiet(state, district.id)}
      </div>
      <div class="hud-stat hud-stat--cyan" style="flex-shrink: 0;">
        <span class="stat-value" style="color: var(--cyan); text-shadow: 0 0 8px rgba(0,229,255,0.3);">${progress.percent}%</span>
        <span class="stat-label" style="color: rgba(0,229,255,0.5);">SECURED</span>
      </div>
    </div>
    ${categoryAskBlock(state, district.id)}
    <div style="padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,229,255,0.08); background: rgba(26,31,43,0.3);">
      <div class="section-label" style="color: rgba(0,229,255,0.4); margin-bottom: 14px;">DISTRICT BUILDINGS</div>
      ${skylineHint(state, district.id, districtAccounts.map(([id]) => id))}
      <div style="display: flex; gap: 8px; align-items: flex-end; justify-content: center; flex-wrap: wrap; padding-bottom: 4px;">
        ${buildings}
      </div>
    </div>
    ${showsPasswordProgress(state, districtId) ? `<div style="padding: 12px 24px 0;">${renderPasswordProgress(state, { withBurst: true })}</div>` : ''}
    ${renderDistrictIntro(state, districtId)}
    ${renderTabs(districtId, activeTab)}
    ${content}
    ${progress.percent >= 100 ? renderAlliesSection(districtId) : ''}
  </div>`;
}
