import { readLevel } from '../utils/reading.js';
import { topTools } from '../components/top-tools.js';
import { missionDistrict } from '../data/missions.js';
import { findMission } from '../data/custom-missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { renderHud, supportNote } from '../components/hud.js';
import { DISTRICT_DIALOGUE, PASSWORD_DIALOGUE, TWO_FA_DIALOGUE, pick } from '../data/dialogue.js';
import { calcDistrictProgress, isEmailBreachCheck } from '../utils/calc.js';
import { questionOptions, prefillAnswer, visibleQuestions, canRecheck, isSkipOption } from '../utils/debrief.js';
import { renderPasswordProgress } from '../components/password-progress.js';
import { PM_MISSION_ID } from '../utils/password-need.js';
import { PM_BURST_ID, pmNumbers } from '../utils/bursts.js';
import { twoFactorMethod, CODE_METHODS } from '../utils/two-factor.js';
import { scoutSprite } from '../components/scout.js';
import { splitWords } from '../components/deck.js';
import { renderBrokerChecklist } from '../components/broker-checklist.js';
import { checklistFor } from '../data/broker-checklists.js';
import { isChecklistPending } from '../utils/broker-lighting.js';
import { feelingForDebrief, twoFactorHugDue } from '../utils/scout-feelings.js';
import { alreadyOption, saidAlready, visibleSteps, progressFor, stepAnswers } from '../utils/reading.js';
import { missionTrail } from '../components/walkthrough.js';
import { fillBar } from '../components/fill-bar.js';
import { shortQuestionLabel } from './briefing.js';

const ROW = 'display: flex; align-items: center; gap: 12px; background: rgba(26,31,43,0.4); border: 1px solid rgba(255,255,255,0.05); padding: 12px 16px;';

function notFound(state) {
  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; flex-direction: column;">
    ${renderHud(state)}
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px;">
      <div class="panel" style="padding: 36px 40px; text-align: center; max-width: 440px;">
        <div class="section-label" style="color: var(--magenta); margin-bottom: 14px;">SIGNAL LOST</div>
        <div style="font-family: var(--font-title); line-height: 1.2; font-size: 20px; font-weight: 800; color: var(--offwhite); letter-spacing: 0.5px; margin-bottom: 12px;">MISSION NOT FOUND</div>
        <div style="font-size: 13px; color: rgba(237,239,243,0.5); line-height: 1.6; margin-bottom: 24px;">No mission matches that call sign. Return to the city map to pick one up.</div>
        <a href="#/city" class="btn-secondary" style="text-decoration: none;">BACK TO CITY</a>
      </div>
    </div>
  </div>`;
}

function badge(severity) {
  return `<span class="badge badge--${severity}" style="flex-shrink: 0;">${severity.toUpperCase()}</span>`;
}

// tags: SAFE / WARN / CRIT beside each answer. Advanced sees how each one is scored. Simple
// doesn't, on the form: there the tags gave away the "right" answer before the player said what
// they found. (A filed report keeps its tag: by then it is the result.)
function optionRow(q, opt, checked = false, tags = true) {
  return `
  <label class="debrief-opt" style="${ROW}">
    <input type="${q.multi ? 'checkbox' : 'radio'}" name="q_${q.id}" value="${opt.value}"${checked ? ' checked' : ''} style="width: 16px; height: 16px; flex-shrink: 0;">
    <span style="flex: 1; font-size: 14px; color: var(--offwhite); line-height: 1.5;">${opt.text}</span>
    ${opt.severity && tags ? badge(opt.severity) : ''}
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
// It starts shown when a pre-filled answer already shows it.
function showIfAttrs(q, shown) {
  if (!q.showIf) return '';
  const rule = q.showIf.values
    ? `data-show-if-values="${q.showIf.values.join(',')}"`
    : `data-show-if-not="${q.showIf.notValues.join(',')}"`;
  return `${shown ? '' : ' hidden'} data-show-if-q="${q.showIf.question}" ${rule}`;
}

// A number answer: typed in, with any options (like "couldn't check") beside it.
function numberInput(q, value) {
  const max = q.max !== undefined ? ` max="${q.max}"` : '';
  return `
      <input type="number" name="q_${q.id}" min="${q.min ?? 0}"${max} inputmode="numeric" step="1"${value !== undefined ? ` value="${value}"` : ''} aria-label="${q.label}" style="width: 140px; max-width: 100%; background: transparent; border: 1px solid rgba(0,229,255,0.3); color: var(--offwhite); font-size: 18px; padding: 10px 12px; font-family: var(--font-mono);">`;
}

// A question reads as a question, like the step cards' (style.css .debrief-q): big, bold, off-white,
// in its own words. Grey capitals are for the names of sections, and read as "optional".
function questionLabel(label) {
  return `<h2 class="debrief-q">${label}</h2>`;
}

// `given` is a stored answer to show again (re-check); it wins over a pre-fill.
// recheck: leave out the answers that would un-file it (skip / later).
// card: Simple's report, one question per card ({ now, told }): `now` is the card showing, `told`
// a question a step card already answered (it waits in "You told us:" instead).
function questionGroup(q, state, mission, shown = false, given = undefined, recheck = false, card = null) {
  // "I already have this" on the briefing picks the report's "already" answer.
  const already = mission && saidAlready(state, mission.id) ? alreadyOption(mission) : null;
  const alreadyPre = already?.question === q.id ? already.value : undefined;
  // An answer picked on a step card (screens/briefing.js stepAsk) comes first.
  const stepPre = mission ? stepAnswers(state, mission.id)[q.id] : undefined;
  const onStep = stepPre !== undefined && questionOptions(q, state).some((o) => o.value === stepPre);
  const pre = (onStep ? stepPre : undefined) ?? alreadyPre ?? (mission ? prefillAnswer(q, mission, state) : undefined);
  const has = given !== undefined && given !== null;
  const isPicked = (v) => (has ? (Array.isArray(given) ? given.includes(v) : given === v) : pre !== undefined && v === pre);
  const typed = has && q.type === 'number' && /^\d+$/.test(String(given)) ? String(given) : undefined;
  const preNote = onStep
    ? 'You picked this on the step. Change it if that’s not right.'
    : alreadyPre !== undefined
    ? 'Picked because you said you already have this. Change it if that’s not right.'
    : q.prefill === 'same-address'
    ? 'Filled in from your breach check. Change it if that’s wrong.'
    : 'Filled in from your password manager report. Change it if the report says something else.';
  return `
  <div data-question="${q.id}"${card?.now ? ' class="is-card-now"' : ''}${card?.told ? ' data-told' : ''}${showIfAttrs(q, shown)} style="margin-bottom: 28px;">
    ${questionLabel(card ? shortQuestionLabel(mission, q) || q.label : q.label)}
    ${q.hint ? `<div style="font-size: 12px; color: rgba(237,239,243,0.5); line-height: 1.5; margin: -6px 0 12px;">${q.hint}</div>` : ''}
    ${q.multi ? `<div style="font-size: 12px; color: rgba(237,239,243,0.5); margin: -6px 0 12px;">Pick all that apply.</div>` : ''}
    ${pre && !has ? `<div data-prefilled="${q.id}" style="font-size: 12px; color: var(--cyan); line-height: 1.5; margin: -6px 0 12px;">${preNote}</div>` : ''}
    ${q.scout ? `<div style="display: flex; gap: 10px; align-items: flex-start; margin: -4px 0 12px;">
      <img src="assets/characters/scout_0.png" alt="" style="width: 28px; height: 28px; flex-shrink: 0;">
      <div style="font-size: 13px; color: rgba(237,239,243,0.65); line-height: 1.6; font-style: italic;">${q.scout}</div>
    </div>` : ''}
    <div style="display: flex; flex-direction: column; gap: 6px;">
      ${q.type === 'number' ? numberInput(q, typed) : ''}
      ${questionOptions(q, state).filter((opt) => !recheck || !isSkipOption(opt)).map((opt) => optionRow(q.type === 'number' ? { ...q, multi: true } : q, opt, isPicked(opt.value), readLevel(state) !== 'simplest')).join('')}
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
    ${questionLabel(q.label)}
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
    ${questionLabel(mission.debriefQs[0].label)}
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
    // Asked only since a later release (X4's "same address?"): a save filed
    // before it never answered it.
    if (q.showIf || q.addedLater) return '';
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

// Only where the upgrade mission exists: a custom account shares the 2FA question
// but has no upgrade mission of its own.
function upgradeOffer(state, mission, stored) {
  if (!mission.debriefQs.some((q) => q.kind === 'two-factor')) return '';
  if (!CODE_METHODS.includes(twoFactorMethod(stored))) return '';
  const upgradeId = `${mission.accountId}-fortify-2fa-upgrade`;
  if (!findMission(state, upgradeId)) return '';
  return `
      <div style="margin-bottom: 24px;">
        <a href="#/mission/${upgradeId}/briefing" class="btn-secondary" style="display: inline-block; text-decoration: none;">UPGRADE FROM CODES &mdash; BONUS</a>
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

// Simple shows how far as a bar that fills (components/fill-bar.js), not "PROGRESS: 25%".
function getProgressCheckIn(state, districtId, progress, dialogue) {
  if (!dialogue?.progress) return '';
  const { percent } = progress;
  const milestones = [25, 50, 75, 100];
  const seen = state.seenProgress?.[districtId] || [];
  for (const m of milestones) {
    if (percent >= m && !seen.includes(m) && dialogue.progress[m]) {
      const head = readLevel(state) === 'simplest'
        ? `<div style="margin-bottom: 10px;">${fillBar({ key: `district:${districtId}`, done: progress.completed, total: progress.total, size: 'mid', label: `${percent}% secured` })}</div>`
        : `<div class="section-label" style="color: rgba(198,255,0,0.6); margin-bottom: 6px;">PROGRESS: ${m}%</div>`;
      return `<div data-progress-check-in style="margin-top: 16px; padding: 14px 16px; background: rgba(198,255,0,0.04); border: 1px solid rgba(198,255,0,0.15);">
        ${head}
        <div style="font-size: 13px; color: rgba(237,239,243,0.7); line-height: 1.6; font-style: italic;">${pick(dialogue.progress[m])}</div>
      </div>`;
    }
  }
  return '';
}

const SEVERITY_RANK = { crit: 3, warn: 2, safe: 1, skip: 0 };

// On a tie, the account's activity speaks first: money that moved is the
// more urgent fact, and its line already ends with "change the password".
// Next, an order nobody at home placed (Q-ORD), whose line ends the same way.
const TIE_FIRST = ['orders', 'activity'];

function mostSevere(mission, stored, values) {
  const rank = (v) => {
    const q = mission.debriefQs.find((x) => stored[x.id] === v);
    const sev = SEVERITY_RANK[q?.options?.find((o) => o.value === v)?.severity] ?? -1;
    return sev * 10 + TIE_FIRST.indexOf(q?.id) + 1;
  };
  return values.reduce((best, v) => (best === undefined || rank(v) > rank(best) ? v : best), undefined);
}

// The briefing already said this line. Said again here, only its first
// sentence shows; the rest waits behind "Remind me". Any other line is as it is.
export function scoutLineOnce(line, briefingLine) {
  if (!line || line !== briefingLine) return line;
  const [first, ...rest] = splitWords(line, 1);
  if (!rest.length) return line;
  const head = first.trim();
  return `${head}${cutQuote(head)} <details class="scout-remind" data-open-desktop><summary>Remind me</summary>${rest.join('').trim()}</details>`;
}

// A quote the first sentence opens and doesn't close: close it at the cut, for as long as the
// rest is folded away (style.css hides it once the details opens).
const QUOTE_PAIRS = [['"', '"'], ['\u201c', '\u201d'], ['&ldquo;', '&rdquo;']];
function cutQuote(head) {
  const pair = QUOTE_PAIRS.find(([open]) => head.startsWith(open));
  if (!pair) return '';
  const [open, close] = pair;
  const opens = head.split(open).length - 1;
  const closes = open === close ? 0 : head.split(close).length - 1;
  const unclosed = open === close ? opens % 2 === 1 : opens > closes;
  return unclosed ? `<span class="scout-cut-quote" aria-hidden="true">${close}</span>` : '';
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
    progressLine: getProgressCheckIn(state, districtId, progress, dialogue),
    feeling: twoFactorHugDue(state, mission.id) ? 'hug' : feelingForDebrief(mission, stored),
  };
}

// The open form. Follow-ups a pre-filled answer already shows start shown.
// Re-check: the stored answers come back as the starting point.
// The open form, and how many of the questions it shows have no answer yet (SKIP counts as one).
// cards (Simple, Liz 2026-11-20): the same form, one question showing at a time, the ones the step
// cards answered left out of the walk and listed at the end. It is the same fields either way, so
// SUBMIT REPORT reads and files the same answers (app.js submitDebrief).
function debriefForm(state, mission, given = null, recheck = false, cards = false) {
  const pre = {};
  const already = saidAlready(state, mission.id) ? alreadyOption(mission) : null;
  const onSteps = stepAnswers(state, mission.id);
  for (const q of mission.debriefQs) {
    const v = given?.[q.id] ?? onSteps[q.id] ?? (already?.question === q.id ? already.value : prefillAnswer(q, mission, state));
    if (v !== undefined) pre[q.id] = v;
  }
  const visible = visibleQuestions(mission, pre);
  const shown = new Set(visible.map((q) => q.id));
  const checklist = renderBrokerChecklist(mission, state, recheck ? 'recheck' : 'file');
  const unanswered = (q) => pre[q.id] === undefined || (Array.isArray(pre[q.id]) && !pre[q.id].length);
  const left = visible.filter(unanswered).length;
  if (!cards) {
    return { left, html: `<div data-debrief="${mission.id}" class="debrief-form">${mission.debriefQs.map((q) => questionGroup(q, state, mission, shown.has(q.id), given?.[q.id], recheck)).join('')}${checklist}</div>` };
  }
  const told = new Set(visible.filter((q) => onSteps[q.id] !== undefined && questionOptions(q, state).some((o) => o.value === onSteps[q.id])).map((q) => q.id));
  const walk = visible.filter((q) => !told.has(q.id));
  // The first card still to answer; all answered, the last (SUBMIT REPORT is on it).
  const now = walk.find(unanswered) || walk.at(-1) || null;
  const at = now ? walk.indexOf(now) : -1;
  const last = at === walk.length - 1;
  const groups = mission.debriefQs.map((q) => questionGroup(q, state, mission, shown.has(q.id), given?.[q.id], recheck, { now: q === now, told: told.has(q.id) })).join('');
  return {
    left,
    cards: { total: walk.length, done: walk.filter((q) => !unanswered(q)).length, first: at <= 0, last, nowAnswered: Boolean(now && !unanswered(now)) },
    html: `<div data-debrief-bar>${cardsBar(mission.id, walk.filter((q) => !unanswered(q)).length, walk.length)}</div>
    <div data-debrief="${mission.id}" data-cards class="debrief-form${last ? ' is-last' : ''}">${groups}${checklist}</div>
    ${toldSummary(state, mission, visible.filter((q) => told.has(q.id)), pre, last)}`,
  };
}

// How many of the report's cards are answered, as Simple's other bars (components/fill-bar.js).
export function cardsBar(missionId, done, total) {
  if (total < 2) return '';
  const left = total - done;
  return `<div class="debrief-cards-bar">${fillBar({ key: `report:${missionId}`, done, total, size: 'big', label: left ? questionsLeftText(left) : 'Every question answered' })}</div>`;
}

// "You told us:" what the step cards already answered, each with Change, on the last card.
function toldSummary(state, mission, qs, pre, show) {
  if (!qs.length) return '';
  const rows = qs.map((q) => {
    const opt = questionOptions(q, state).find((o) => o.value === pre[q.id]);
    return `<li data-told-row="${q.id}"><span>${shortQuestionLabel(mission, q) || q.label}</span> <b>${opt ? opt.text.split(' — ')[0] : ''}</b> <button class="walk-link" data-action="debrief-change" data-question="${q.id}">Change</button></li>`;
  }).join('');
  return `<div class="debrief-told" data-debrief-told${show ? '' : ' hidden'}><p class="debrief-told-head">You told us:</p><ul>${rows}</ul></div>`;
}

// ---- Simple's report cards, in the browser (app.js calls these) --------------------------------
// The card showing is the [data-question] with .is-card-now; a question the step cards answered
// has data-told until Change brings it back. Nothing here reads or sends an answer anywhere: it
// only shows and hides the form's own fields.

const answeredGroup = (g) => Boolean(g.querySelector('input:checked') || g.querySelector('input[type="number"]')?.value);
const cardList = (form) => [...form.querySelectorAll('[data-question]')].filter((g) => !g.hidden && !g.hasAttribute('data-told'));

export function syncDebriefCards(root) {
  const form = root.querySelector('[data-debrief][data-cards]');
  if (!form) return;
  const cards = cardList(form);
  let now = cards.find((g) => g.classList.contains('is-card-now'));
  if (!now) now = cards.find((g) => !answeredGroup(g)) || cards.at(-1) || null;
  for (const g of form.querySelectorAll('[data-question].is-card-now')) if (g !== now) g.classList.remove('is-card-now');
  now?.classList.add('is-card-now');
  const at = now ? cards.indexOf(now) : -1;
  const last = at === cards.length - 1;
  form.classList.toggle('is-last', last);
  const done = cards.filter(answeredGroup).length;
  const bar = root.querySelector('[data-debrief-bar]');
  if (bar) bar.innerHTML = cardsBar(form.dataset.debrief, done, cards.length);
  const nav = root.querySelector('[data-debrief-nav]');
  if (nav) {
    nav.querySelector('[data-action="debrief-back"]').hidden = at <= 0;
    const next = nav.querySelector('[data-action="debrief-next"]');
    next.hidden = last;
    const lit = Boolean(now && answeredGroup(now));
    next.classList.toggle('btn-primary', lit);
    next.classList.toggle('btn-secondary', !lit);
    nav.querySelector('[data-debrief-submit]').hidden = !last;
  }
  const told = root.querySelector('[data-debrief-told]');
  if (told) told.hidden = !last || !told.querySelector('li');
}

export function showDebriefCard(root, group) {
  const form = root.querySelector('[data-debrief][data-cards]');
  if (!form || !group) return;
  for (const g of form.querySelectorAll('[data-question].is-card-now')) g.classList.remove('is-card-now');
  group.classList.add('is-card-now');
  syncDebriefCards(root);
  group.scrollIntoView?.({ block: 'start' });
  group.querySelector('input')?.focus({ preventScroll: true });
}

// NEXT (+1) and Back (-1).
export function moveDebriefCard(root, by) {
  const form = root.querySelector('[data-debrief][data-cards]');
  if (!form) return;
  const cards = cardList(form);
  const at = cards.findIndex((g) => g.classList.contains('is-card-now'));
  const to = cards[Math.max(0, Math.min(cards.length - 1, at + by))];
  if (to) showDebriefCard(root, to);
}

// Change, beside an answer from the step cards: that question becomes a card again.
export function changeToldAnswer(root, questionId) {
  const form = root.querySelector('[data-debrief][data-cards]');
  const group = form?.querySelector(`[data-question="${questionId}"]`);
  if (!group) return;
  group.removeAttribute('data-told');
  root.querySelector(`[data-told-row="${questionId}"]`)?.remove();
  showDebriefCard(root, group);
}

// "2 questions left" beside SUBMIT REPORT, kept up to date by app.js as answers are picked.
export function questionsLeftText(n) {
  return n === 1 ? '1 question left' : `${n} questions left`;
}

// SUBMIT REPORT is the screen's one bright button only once every question has an answer. Before
// that it is an outline that says how many are left. It still works: tapped early, it says what's
// missing and goes to it (app.js submitDebrief).
export function submitReportButton(missionId, left) {
  return `<button class="${left ? 'btn-secondary' : 'btn-primary'}" data-action="submit-debrief" data-mission="${missionId}">SUBMIT REPORT</button>
    <span class="debrief-left" data-debrief-left${left ? '' : ' hidden'}>${questionsLeftText(left)}</span>`;
}

// Simple's report cards: Back, NEXT, and on the last card SUBMIT REPORT (the only bright button
// there). NEXT lights once its card is answered, like a step's DONE; it moves on either way.
function cardsNav(missionId, form) {
  const { first, last, nowAnswered } = form.cards;
  return `<div class="debrief-nav" data-debrief-nav>
      <button class="walk-link" data-action="debrief-back"${first ? ' hidden' : ''}>&#8249; Back</button>
      <button class="${nowAnswered && !last ? 'btn-primary' : 'btn-secondary'}" data-action="debrief-next" data-mission="${missionId}"${last ? ' hidden' : ''}>NEXT &#9654;</button>
      <span data-debrief-submit${last ? '' : ' hidden'}>${submitReportButton(missionId, form.left)}</span>
    </div>`;
}

// A re-check of a mission that was never filed as done: no form, the way in.
function recheckUnavailable(state, mission) {
  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; flex-direction: column;">
    ${renderHud(state)}
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 16px;">
      <div class="panel" style="padding: 28px 16px; text-align: center; width: 100%; max-width: 360px; box-sizing: border-box;">
        <div class="section-label" style="color: var(--cyan); margin-bottom: 14px;">RE-CHECK</div>
        <div style="font-size: 13px; color: rgba(237,239,243,0.6); line-height: 1.6; margin-bottom: 24px;">There is nothing to re-check yet. Run the mission first.</div>
        <a href="#/mission/${mission.id}/briefing" class="btn-primary" style="text-decoration: none;">${mission.title}</a>
      </div>
    </div>
  </div>`;
}

// What Scout says first on the report screen (also on the list of lines he has recorded).
export const DEBRIEF_GREETINGS = {
  filed: 'Report filed. Good work, agent.',
  recheck: 'Still true? Confirm each answer, or change it.',
  already: 'Already done? Nice. Tell me what you have, and it counts.',
  welcome: 'Welcome back, agent. What did you find?',
};

export function renderDebrief(state, missionId, { recheck = false } = {}) {
  const mission = findMission(state, missionId);
  if (!mission) return notFound(state);
  if (recheck && (state.missions[missionId]?.status !== 'completed' || !canRecheck(mission))) return recheckUnavailable(state, mission);

  const districtId = missionDistrict(mission) || '';
  const stored = state.missions[missionId] || {};
  const completed = stored.status === 'completed' && !recheck;

  let scoutLine;
  let progressLine = '';
  if (completed) {
    ({ line: scoutLine, progressLine } = debriefReaction(state, mission));
  } else {
    scoutLine = mission.scoutDialog?.briefing || 'Report back — what did you find?';
  }

  const progressPanel = mission.id === PM_MISSION_ID || mission.id === PM_BURST_ID ? renderPasswordProgress(state) : '';
  const simple = readLevel(state) === 'simplest';
  // Simple files its report one question per card; a re-check stays the full form.
  const cards = simple && !recheck;
  const form = completed ? null : debriefForm(state, mission, recheck ? stored : null, recheck, cards);
  const questions = completed
    ? `<div class="completed-marker">${completedQuestions(mission, stored, state)}</div>${upgradeOffer(state, mission, stored)}${progressPanel}`
    : form.html;

  const targetTab = mission.phase ? `?tab=${mission.phase}` : '';
  const greeting = completed ? DEBRIEF_GREETINGS.filed : recheck ? DEBRIEF_GREETINGS.recheck : saidAlready(state, mission.id) ? DEBRIEF_GREETINGS.already : DEBRIEF_GREETINGS.welcome;
  // Read it to me (in Scout's voice): his lines, then each question and its answers.
  const sayLines = [greeting, scoutLine, ...(completed ? [] : visibleQuestions(mission, recheck ? stored : {}).flatMap((q) => [(cards && shortQuestionLabel(mission, q)) || q.label, ...(q.options || []).map((o) => o.text)]))];
  const footer = completed
    ? `
    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
      <span class="badge badge--safe">SECURED</span>
      ${checklistFor(mission.id) ? `<a href="#/mission/${mission.id}/recheck" class="btn-secondary" style="text-decoration: none;">RE-CHECK</a>` : ''}
      ${simple
        // Simple's home is What's next, where Scout says what to do now (not the district's tabs).
        ? '<a href="#/next" class="btn-primary" style="text-decoration: none;">WHAT’S NEXT &#9654;</a>'
        : `<a href="#/district/${districtId}${targetTab}" class="btn-primary" style="text-decoration: none;">BACK TO DISTRICT</a>`}
    </div>${supportNote('debrief')}`
    : recheck
      ? `<div data-recheck-msg role="status" hidden style="font-size: 13px; color: var(--amber); line-height: 1.6; margin-bottom: 12px;">A re-check keeps this filed as it was. Pick an answer, or go back.</div>
    <button class="btn-primary" data-action="submit-recheck" data-mission="${mission.id}">SAVE RE-CHECK</button>`
      : `<div data-debrief-msg role="status" hidden style="font-size: 13px; color: var(--amber); line-height: 1.6; margin-bottom: 12px;">Answer every question to file the report.</div>
    ${form.cards ? cardsNav(mission.id, form) : submitReportButton(mission.id, form.left)}`;

  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    <style>
      .debrief-opt { cursor: pointer; transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease; }
      .debrief-opt:hover { border-color: rgba(0,229,255,0.5); box-shadow: 0 0 12px rgba(0,229,255,0.12); background: rgba(0,229,255,0.04); }
      .debrief-opt input[type="radio"] { accent-color: var(--cyan); }
    </style>
    ${renderHud(state, { tools: topTools(state, readLevel(state), sayLines) })}
    <div style="display: flex; align-items: center; gap: 12px; padding: 14px 24px; background: rgba(9,11,16,0.97); border-bottom: 1px solid rgba(0,229,255,0.15);">
      <div class="screen-eyebrow">${recheck ? 'RE-CHECK' : 'MISSION DEBRIEF'}</div>
      <div style="flex: 1; height: 1px; background: linear-gradient(90deg, rgba(0,229,255,0.2), transparent);"></div>
      <a class="debrief-back" href="#/mission/${mission.id}/briefing">&#8592; ${mission.title}</a>
    </div>
    <div style="flex: 1; padding: 24px;">
      ${recheck ? '' : missionTrail(completed ? 'filed' : 'report', progressFor(state, mission.id, visibleSteps(mission, state)), { already: saidAlready(state, mission.id) && !progressFor(state, mission.id, visibleSteps(mission, state)).handled })}
      <div style="display: flex; gap: 14px; align-items: flex-start; margin-bottom: 32px;">
        <div style="flex-shrink: 0;">
          ${debriefScout(state, mission, stored)}
        </div>
        <div style="background: rgba(26,31,43,0.7); border: 1px solid rgba(0,229,255,0.15); padding: 12px 16px; flex: 1;">
          <div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.6;">${greeting}</div>
          <div data-scout-line style="font-size: 13px; color: rgba(237,239,243,0.55); line-height: 1.6; font-style: italic; margin-top: 8px;">${scoutLineOnce(scoutLine, mission.scoutDialog?.briefing)}</div>
        </div>
      </div>
      ${questions}
      ${progressLine}
      ${completed && isChecklistPending(state, mission.id) ? '<div style="font-size: 13px; color: var(--amber); line-height: 1.6; margin-bottom: 16px;">Tell Scout which ones you filed.</div>' : ''}
      <div class="pin-bottom">${footer}</div>
    </div>
  </div>`;
}
