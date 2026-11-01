import { MISSIONS } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { DISTRICTS } from '../data/districts.js';
import { renderHud } from '../components/hud.js';
import { DISTRICT_DIALOGUE, PASSWORD_DIALOGUE } from '../data/dialogue.js';
import { missionDistrict } from '../data/missions.js';
import { missionSteps } from '../utils/debrief.js';
import { isPasswordMission, passwordResetNeed, notNeededReasons, emailBreachRecord, isPmFlagged, passwordReconNotes, reopenReasonLine, PM_MISSION_ID } from '../utils/password-need.js';
import { PM_BURST_ID, pmBurstBriefingLine } from '../utils/bursts.js';
import { renderPasswordProgress } from '../components/password-progress.js';
import { scoutSprite } from '../components/scout.js';
import { deck, splitWords, countWords } from '../components/deck.js';
import { renderBankNotesPanel } from '../components/bank-notes.js';
import { missionUsesBankNotes } from '../utils/bank-notes.js';

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
  // Where GO DO IT sends the player: the first step's link, else the account's security page. With
  // neither (the steps happen in an app, or in results the player already has), there is nothing to
  // open: the button is START, which keeps the steps on screen (Liz 2026-10-31: a "#" opened a second
  // copy of the game).
  // "Your bank", "your card", "your brokerage": the game can't know which, so the player's own bank
  // notes are the way out, a panel under the steps with a link to each saved bank (Liz 2026-11-01:
  // "it doesn't link you anywhere"). Their addresses stay in that panel (class bank-note-panel,
  // private to error reports), never in GO DO IT's data-url.
  const bankNotesHere = missionUsesBankNotes(mission);
  const goUrl = missionStepList.find((s) => s.url)?.url || account?.securityUrl || '';
  const noReset = isPasswordMission(mission) && !opts.resetAnyway
    && passwordResetNeed(state, mission.accountId) === 'not-needed';
  const noResetFiled = noReset && state.missions[mission.id]?.status === 'not-needed';
  const targetTab = mission.phase ? `?tab=${mission.phase}` : '';

  const colon = mission.title.lastIndexOf(':');
  const titleTop = colon > -1 ? mission.title.slice(0, colon) : '';
  const titleBottom = colon > -1 ? mission.title.slice(colon + 1).trim() : mission.title;

  // A step's row; `notes` lets a phone slide carry only the first note (the rest get slides).
  const stepRow = (step, i, notes = step.note) => {
    const num = String(i + 1).padStart(2, '0');
    const body = step.url
      ? `<a href="${step.url}" target="_blank" rel="noopener" data-action="mission-step" data-mission="${mission.id}" style="color: var(--cyan); font-weight: 600;">${step.text}</a>`
      : step.text;
    // A step that needs its reasons on screen (the Pwned Passwords check asks
    // for a real password, so it says why, who, and why that's safe).
    const note = notes?.length ? `
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
          ${notes.map((n) => stepNote(n)).join('')}
        </div>` : '';
    return `
    <div data-brief-step style="display: flex; gap: 14px; align-items: flex-start;">
      <div data-step-num style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--cyan); width: 28px; text-align: center; flex-shrink: 0; text-shadow: 0 0 8px rgba(0,229,255,0.4);">${num}</div>
      <div style="font-size: 15px; color: var(--offwhite); line-height: 1.5; min-width: 0; overflow-wrap: anywhere;">${body}${note}</div>
    </div>`;
  };
  const stepRows = missionStepList.map((step, i) => stepRow(step, i));
  const steps = stepRows.join('');

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
  const loreData = loreEntry(districtId, state);
  const lore = renderLoreSection(loreData);

  // The burst's line needs the password-manager report; until then (no numbers) the mission's own line.
  const scoutLine = noReset ? noResetScoutLine(state, mission) : (mission.id === PM_BURST_ID && pmBurstBriefingLine(state)) || reopenedLine(state, mission) || mission.scoutDialog?.briefing || 'Follow the steps above and report back when you\u2019re done.';
  const scoutFeeling = noReset ? 'happy' : undefined;

  const header = `
        <div style="font-family: var(--font-display); font-size: 26px; font-weight: 800; line-height: 1.4; letter-spacing: 1px; margin-bottom: 14px; color: var(--offwhite);">
          ${titleTop ? `${titleTop}<br>` : ''}<span style="color: var(--cyan); text-shadow: 0 0 15px rgba(0,229,255,0.3);">${titleBottom}</span>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px;">
          <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; color: var(--cyan); background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.2); padding: 4px 12px; letter-spacing: 1px;">${mission.phase.toUpperCase()} MISSION</div>
          ${mission.optional ? `<div style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; color: var(--magenta); background: rgba(255,45,155,0.08); border: 1px solid rgba(255,45,155,0.3); padding: 4px 12px; letter-spacing: 1px;">BONUS &mdash; NEVER BLOCKS PROGRESS</div>` : ''}
          <div style="font-family: var(--font-mono); font-size: 9px; color: rgba(237,239,243,0.4); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 4px 12px;">~${mission.estimatedMinutes} MIN</div>
          ${noReset ? NO_RESET_BADGE : ''}
        </div>
        ${isPasswordMission(mission) && isPmFlagged(state, mission.accountId) ? FLAGGED_NOTE : ''}
        ${isPasswordMission(mission) ? passwordReconNotes(state, mission.accountId).map((n) => `<div data-recon-note style="font-size: 13px; color: var(--offwhite); line-height: 1.6; margin: -12px 0 20px; border-left: 2px solid var(--magenta); padding-left: 10px;">${n}</div>`).join('') : ''}

        ${mission.id === PM_MISSION_ID || mission.id === PM_BURST_ID ? renderPasswordProgress(state) : ''}`;

  const actions = `
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          ${noReset ? renderNoResetActions(mission, districtId, targetTab, noResetFiled) : state.startedMissions?.[mission.id]
            ? `<a class="btn-primary" href="#/mission/${mission.id}/debrief" data-action="i-did-it" data-mission="${mission.id}" style="text-decoration: none;">I DID IT &#10003;</a>
          ${goUrl ? `<button class="btn-secondary" data-action="go-do-it" data-mission="${mission.id}" data-url="${goUrl}">GO DO IT AGAIN</button>` : ''}`
            : goUrl
              ? `<button class="btn-primary" data-action="go-do-it" data-mission="${mission.id}" data-url="${goUrl}">GO DO IT &#9654;</button>`
              : `<button class="btn-primary" data-action="start-mission" data-mission="${mission.id}">START &#9654;</button>`}
          ${noResetFiled ? '' : `<a href="#/district/${districtId}${targetTab}" style="font-size: 13px; color: rgba(237,239,243,0.35); text-decoration: none;">NOT NOW</a>`}
        </div>`;

  // A briefing that fits one phone screen stays as it is; a longer one is slides on a phone.
  const stepWords = missionStepList.reduce((n, st) => n + countWords(st.text) + (st.note || []).reduce((k, x) => k + countWords(`${x.label} ${x.text}`), 0), 0);
  const slides = countWords(mission.briefing) + (noReset ? 60 : stepWords) + countWords(scoutLine) > SHORT_WORDS
    ? briefingSlides({ header, briefing: mission.briefing, stepRows, stepRow, missionStepList, noResetPanel: noReset ? renderNoResetPanel(state, mission) : '', scoutLine, scoutFeeling, preview, loreData })
    : null;

  const bankPanel = bankNotesHere && !noReset ? renderBankNotesPanel(state, mission) : '';
  const main = slides ? `${deck(slides, { label: 'Mission briefing', className: 'brief-deck' })}
        ${bankPanel ? `<div style="margin-top: 20px;">${bankPanel}</div>` : ''}
        <div style="margin-top: 20px;">${actions}</div>` : `${header}
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
${bankPanel}
${actions}`;

  return `
  <div class="brief${slides ? ' brief--deck' : ''} scanlines" style="min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    ${renderHud(state)}
    <div style="flex: 1; display: flex; flex-wrap: wrap; align-items: stretch;">
      <div style="flex: 2 1 420px; min-width: 0; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 1px; margin-bottom: 20px;">
          <a href="#/district/${districtId}${targetTab}" style="color: rgba(237,239,243,0.4); text-decoration: none;">${district?.name || districtId}</a>
          <span style="color: rgba(237,239,243,0.2);">/</span>
          <span style="color: rgba(237,239,243,0.6); text-transform: uppercase;">${mission.phase}</span>
        </div>
${main}
      </div>

      <div class="brief-side" style="flex: 1 1 240px; background: rgba(26,31,43,0.4); border-left: 1px solid rgba(0,229,255,0.1); padding: 24px; flex-direction: column; align-items: center;">
        ${briefingScout(scoutFeeling)}
        <div style="font-family: var(--font-display); font-size: 9px; font-weight: 700; color: var(--cyan); margin-bottom: 16px; letter-spacing: 3px; text-shadow: 0 0 8px rgba(0,229,255,0.4);">SCOUT</div>
        <div style="background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.15); padding: 14px; width: 100%; margin-bottom: 20px;">
          <div style="font-size: 13px; color: rgba(237,239,243,0.6); line-height: 1.6; font-style: italic;">${scoutLine}</div>
        </div>
        ${preview}
        ${lore}
      </div>
    </div>
  </div>`;
}

// The whole briefing (intel, steps, Scout) within this many words fits a phone's first screen.
const SHORT_WORDS = 60;
const SLIDE_WORDS = 35;
// Scout and the closing slides: on a desktop the sidebar has them, so the whole section hides.
const PHONE_ONLY = 'slide--phone';
const MORE_INTEL_AFTER = 3; // intel slides before the rest goes behind "More intel"

// The slides, in order: title + first intel; up to two more intel; Scout; the steps; THIS
// LIBERATES + lore. At 900px and up they stack: the intel and step slides join into the
// panels they always were (style.css), and the Scout and last slides hide (the sidebar has them).
function briefingSlides({ header, briefing, stepRows, stepRow, missionStepList, noResetPanel, scoutLine, scoutFeeling, preview, loreData }) {
  const slides = [];
  // Slide 1's title and badges come out of its word budget.
  const firstBudget = Math.max(1, SLIDE_WORDS - countWords(header));
  const [first = '', ...after] = splitWords(briefing, firstBudget);
  const rest = splitWords(after.join(''), SLIDE_WORDS);
  const shown = rest.slice(0, MORE_INTEL_AFTER - 1);
  const more = rest.slice(MORE_INTEL_AFTER - 1).join('');
  const intel = [first, ...shown];
  intel.forEach((chunk, i) => {
    const pos = `${i === 0 ? ' is-first' : ''}${i === intel.length - 1 ? ' is-last' : ''}`;
    // Later intel slides repeat the label on a phone from style.css, so the text reads on unbroken.
    const label = i === 0 ? '<div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 10px;">THREAT INTEL</div>' : '';
    const moreHtml = i === intel.length - 1 && more
      ? `<details class="brief-more" data-open-desktop><summary>More intel</summary><div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7;">${more}</div></details>`
      : '';
    const panel = `<div class="panel brief-intel${pos}">${label}<div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7;" data-chunk>${chunk}</div>${moreHtml}</div>`;
    slides.push({ html: i === 0 ? `${header}${panel}` : panel });
  });

  // Scout, phone only (the sidebar shows the line on a desktop).
  splitWords(scoutLine, SLIDE_WORDS).forEach((chunk, i) => {
    slides.push({ className: PHONE_ONLY, html: `<div class="brief-scout">${i === 0 ? `${briefingScout(scoutFeeling)}<div class="section-label brief-scout-name">SCOUT</div>` : ''}<div class="brief-scout-bubble" data-chunk>${chunk}</div></div>` });
  });

  if (noResetPanel) slides.push({ html: noResetPanel });
  else {
    // Steps in order, at most SLIDE_WORDS a slide. A step with notes has a slide of its own
    // with its first note; each further note follows on its own slide(s), labelled "04 · WHO
    // RUNS IT", so the reasons all come before the next step.
    const groups = [];
    let words = SLIDE_WORDS + 1;
    stepRows.forEach((row, i) => {
      const st = missionStepList[i];
      if (st.note?.length) {
        groups.push({ rows: [stepRow(st, i, st.note.slice(0, 1))], alone: true });
        const num = String(i + 1).padStart(2, '0');
        for (const n of st.note.slice(1)) {
          splitWords(n.text, Math.max(1, SLIDE_WORDS - countWords(n.label))).forEach((chunk, k) => {
            groups.push({ note: stepNote(n, { num, chunk, first: k === 0 }), alone: true });
          });
        }
        words = SLIDE_WORDS + 1;
        return;
      }
      const n = countWords(row) - 1; // not its number
      if (words + n > SLIDE_WORDS || groups.at(-1)?.alone) {
        groups.push({ rows: [row] });
        words = n;
      } else {
        groups.at(-1).rows.push(row);
        words += n;
      }
    });
    groups.forEach((g, i) => {
      const pos = `${i === 0 ? ' is-first' : ''}${i === groups.length - 1 ? ' is-last' : ''}`;
      const label = i === 0 ? '<div class="section-label" style="color: var(--cyan); margin-bottom: 14px; text-shadow: 0 0 8px rgba(0,229,255,0.3);">YOUR MOVE</div>' : '';
      slides.push({ html: g.note
        ? `<div class="panel panel--active brief-steps brief-note${pos}">${g.note}</div>`
        : `<div class="panel panel--active brief-steps${pos}">${label}<div style="display: flex; flex-direction: column; gap: 14px;">${g.rows.join('')}</div></div>` });
    });
  }

  if (preview) slides.push({ className: PHONE_ONLY, html: `<div class="brief-last">${preview}</div>` });
  for (const html of loreSlides(loreData)) slides.push({ className: PHONE_ONLY, html });
  return slides;
}

// One of a step's notes. On a phone slide of its own (num set) its label reads "04 · WHO RUNS
// IT" (the number from style.css, so the text is said once); a continuation names it the same way.
function stepNote(n, { num = '', chunk = n.text, first = true } = {}) {
  const label = `<span style="font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: rgba(0,229,255,0.6); text-transform: uppercase;"${num ? ` class="brief-note-label" data-step="${num} · "` : ''}>${n.label}</span><br>`;
  const cont = num && !first ? ` class="brief-note-cont" data-label="${num} · ${n.label}"` : '';
  return `
          <div${cont} style="font-size: 13px; color: rgba(237,239,243,0.7); line-height: 1.55;">
            ${first ? label : ''}${num ? `<span data-chunk>${chunk}</span>` : chunk}
          </div>`;
}

const BRIEFING_SCOUT = 'margin-bottom: 12px; filter: drop-shadow(0 0 8px rgba(0,229,255,0.3));';

// The briefing's big Scout. app.js swaps it for goDoIt when the player heads out.
export function briefingScout(feeling) {
  if (!feeling) return `<img src="assets/characters/scout_0.png" data-scout="briefing" style="width: 96px; height: 96px; ${BRIEFING_SCOUT}">`;
  return scoutSprite(feeling, { size: 96, style: BRIEFING_SCOUT, attrs: 'data-scout="briefing"' });
}

// A reset filed "not needed" that the player's new answer put back on.
function reopenedLine(state, mission) {
  const rec = state.missions?.[mission.id];
  if (!isPasswordMission(mission) || !rec?.reopened || rec.status) return null;
  return reopenReasonLine(rec.reopened);
}

// "Clean record" only when the breach check found nothing.
// Only an email address has a breach check that means anything here; any
// other account's not-needed came from its own evidence (pw-clean).
function noResetScoutLine(state, mission) {
  const breach = emailBreachRecord(state, mission.accountId);
  if (breach?.status === 'completed' && breach.finding === 'no-breaches') return PASSWORD_DIALOGUE.notNeeded;
  if (breach?.status === 'completed' && breach.finding) return PASSWORD_DIALOGUE.notNeededAfterLeak;
  return PASSWORD_DIALOGUE.notNeededPm;
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

// The district lore this briefing shows: the first one not yet seen.
function loreEntry(districtId, state) {
  const dialogue = DISTRICT_DIALOGUE[districtId];
  if (!dialogue?.lore || Object.keys(dialogue.lore).length === 0) return null;
  const seenLore = state.seenLore?.[districtId] || [];
  const unseenKeys = Object.keys(dialogue.lore).filter(k => !seenLore.includes(k));
  const key = unseenKeys.length > 0 ? unseenKeys[0] : Object.keys(dialogue.lore)[0];
  return dialogue.lore[key] || null;
}

const LORE_LABEL = '<div class="section-label" style="color: rgba(255,159,0,0.5); margin-bottom: 8px;">INTEL</div>';
const loreTitle = (lore) => `<div class="section-label brief-lore-title" style="font-family: var(--font-display); font-size: 9px; font-weight: 700; color: rgba(255,159,0,0.7); letter-spacing: 1px; margin-bottom: 6px;">${lore.title}</div>`;
const loreText = (text, attrs = '') => `<div style="font-size: 12px; color: rgba(237,239,243,0.5); line-height: 1.6;"${attrs}>${text}</div>`;

function renderLoreSection(lore) {
  if (!lore) return '';
  return `
    <div style="width: 100%; margin-top: 16px; border-top: 1px solid rgba(0,229,255,0.1); padding-top: 14px;">
      ${LORE_LABEL}
      ${loreTitle(lore)}
      ${loreText(lore.text)}
    </div>`;
}

// The lore on phone slides, split at sentence ends like the intel.
function loreSlides(lore) {
  if (!lore) return [];
  return splitWords(lore.text, SLIDE_WORDS).map((chunk, i) => `<div class="brief-last brief-lore">${i === 0 ? `${LORE_LABEL}${loreTitle(lore)}` : ''}${loreText(chunk, ' data-chunk')}</div>`);
}
