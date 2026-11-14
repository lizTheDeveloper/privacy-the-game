import { findMission } from '../data/custom-missions.js';
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
import { briefingLore } from '../utils/lore.js';
import { readLevel, readLevelChosen, intelFor, visibleSteps, gearQuestions, progressFor, stepMarks, stepKey as stepKeyOf, canSayAlready, READ_LEVELS, READ_LEVEL_LABELS } from '../utils/reading.js';
import { walkStepRow, walkProgress, gearAsk, missionTrail, pathChips, stuckHelp } from '../components/walkthrough.js';
import { plainText } from '../utils/readability.js';
import { readingOffer, OFFER_LINES } from '../utils/reading-signals.js';
import { isPlaying } from '../utils/focus-music.js';

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
  const mission = findMission(state, missionId);
  if (!mission) return notFound(state);

  const account = ACCOUNTS[mission.accountId];
  const districtId = missionDistrict(mission) || '';
  const district = DISTRICTS.find((d) => d.id === districtId);
  const level = readLevel(state);
  const { intel, why } = intelFor(mission, level);
  const allSteps = level === 'simplest' && mission.simple?.steps?.length ? mission.simple.steps : missionSteps(mission, state);
  const missionStepList = visibleSteps(mission, state, level);
  const progress = progressFor(state, mission.id, missionStepList);
  const marks = stepMarks(state, mission.id);
  const started = Boolean(state.startedMissions?.[mission.id]) || progress.handled > 0;
  // Where GO DO IT sends the player: the first step's link, else the account's security page. With
  // neither (the steps happen in an app, or in results the player already has), there is nothing to
  // open: the button is START, which keeps the steps on screen (Liz 2026-10-31: a "#" opened a second
  // copy of the game).
  // "Your bank", "your card", "your brokerage": the game can't know which, so the player's own bank
  // notes are the way out, a panel under the steps with a link to each saved bank (Liz 2026-11-01:
  // "it doesn't link you anywhere"). Their addresses stay in that panel (class bank-note-panel,
  // private to error reports), never in GO DO IT's data-url.
  const bankNotesHere = missionUsesBankNotes(mission);
  // Once a step is ticked, GO DO IT AGAIN opens the next step's link when it has one.
  const goUrl = missionStepList[progress.current]?.url || missionStepList.find((s) => s.url)?.url || account?.securityUrl || '';
  const noReset = isPasswordMission(mission) && !opts.resetAnyway
    && passwordResetNeed(state, mission.accountId) === 'not-needed';
  const noResetFiled = noReset && state.missions[mission.id]?.status === 'not-needed';
  const targetTab = mission.phase ? `?tab=${mission.phase}` : '';

  const colon = mission.title.lastIndexOf(':');
  const titleTop = colon > -1 ? mission.title.slice(0, colon) : '';
  const titleBottom = colon > -1 ? mission.title.slice(colon + 1).trim() : mission.title;

  // A step's row; `notes` lets a phone slide carry only the first note (the rest get slides).
  // The next step to do is lit with DONE, Stuck? and Read it to me (components/walkthrough.js).
  const stepRow = (step, i, notes = step.note) => walkStepRow({
    mission, step, index: i, notes, stepNote,
    mark: marks[stepKeyOf(step)],
    current: !noReset && i === progress.current && missionStepList.length > 1,
  });
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
  const loreData = loreEntry(state, mission.id);
  const lore = renderLoreSection(loreData);

  // The burst's line needs the password-manager report; until then (no numbers) the mission's own line.
  const scoutLine = noReset ? noResetScoutLine(state, mission) : (mission.id === PM_BURST_ID && pmBurstBriefingLine(state)) || reopenedLine(state, mission) || (level === 'simplest' && mission.simple?.scout) || mission.scoutDialog?.briefing || 'Follow the steps above and report back when you\u2019re done.';
  const scoutFeeling = noReset ? 'happy' : undefined;

  // Short and Simplest: one screen with the plain line and one START. Once started, a mission
  // with several steps is shown one step at a time (Liz 2026-11-13: "still hard to use").
  // Full intel keeps the long briefing below; a password reset that isn't needed keeps its panel.
  const bankPanelHtml = bankNotesHere && !noReset ? renderBankNotesPanel(state, mission) : '';
  // What the long briefing's header carries besides the title: the bonus tag, the password
  // manager's flag, recon's notes for this reset, the password progress panel.
  const extras = `${mission.optional ? '<div class="focus-bonus">BONUS &mdash; NEVER BLOCKS PROGRESS</div>' : ''}${isPasswordMission(mission) && isPmFlagged(state, mission.accountId) ? FLAGGED_NOTE.replace('margin: -12px 0 20px', 'margin: 8px 0') : ''}${isPasswordMission(mission) ? passwordReconNotes(state, mission.accountId).map((n) => `<div data-recon-note class="focus-recon-note">${n}</div>`).join('') : ''}${mission.id === PM_MISSION_ID || mission.id === PM_BURST_ID ? renderPasswordProgress(state) : ''}`;
  const page = { extras, state, mission, districtId, district, targetTab, titleTop, titleBottom, level, intel, why, scoutLine, missionStepList, progress, marks, allSteps, bankPanelHtml, loreData, account, goUrl };
  if (!noReset && missionStepList.length > 1 && started && !opts.peek) return stepModePage(page);
  if (!noReset && (level !== 'full' || opts.peek)) return compactBriefingPage({ ...page, started });

  const header = `
        ${missionTrail(started ? 'steps' : 'brief', progress)}
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

  // How much to read (Scout asks the first time), and Read it to me.
  const sayIntel = plainText(`${intel} ${scoutLine}`);
  const intelTools = readingTools(state, level, sayIntel);
  // The device questions and how far along the steps are.
  const gearHtml = noReset ? '' : gearAsk(state, gearQuestions(allSteps));
  const progressHtml = !noReset && missionStepList.length > 1 ? walkProgress(progress) : '';
  const movePanelTop = `${gearHtml}${progressHtml}`;

  const actions = `
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          ${noReset ? renderNoResetActions(mission, districtId, targetTab, noResetFiled) : started
            ? `<a class="btn-primary" href="#/mission/${mission.id}/debrief" data-action="i-did-it" data-mission="${mission.id}" style="text-decoration: none;">I DID IT &#10003;</a>
          ${goUrl ? `<button class="btn-secondary" data-action="go-do-it" data-mission="${mission.id}" data-url="${goUrl}">GO DO IT AGAIN</button>` : ''}`
            : goUrl
              ? `<button class="btn-primary" data-action="go-do-it" data-mission="${mission.id}" data-url="${goUrl}">GO DO IT &#9654;</button>`
              : `<button class="btn-primary" data-action="start-mission" data-mission="${mission.id}">START &#9654;</button>`}
          ${!noReset && canSayAlready(mission) ? `<button class="btn-secondary" data-action="already-have" data-mission="${mission.id}">I ALREADY HAVE THIS</button>` : ''}
          ${noResetFiled ? '' : `<a href="#/district/${districtId}${targetTab}" style="font-size: 13px; color: rgba(237,239,243,0.35); text-decoration: none;">NOT NOW</a>`}
        </div>`;

  // A briefing that fits one phone screen stays as it is; a longer one is slides on a phone.
  const stepWords = missionStepList.reduce((n, st) => n + countWords(st.text) + (st.note || []).reduce((k, x) => k + countWords(`${x.label} ${x.text}`), 0), 0);
  const slides = countWords(intel) + (noReset ? 60 : stepWords) + countWords(scoutLine) > SHORT_WORDS
    ? briefingSlides({ header, briefing: intel, why, intelTools, gearHtml, progressHtml, stepRows, stepRow, missionStepList, noResetPanel: noReset ? renderNoResetPanel(state, mission) : '', scoutLine, scoutFeeling, preview, loreData })
    : null;

  const bankPanel = bankNotesHere && !noReset ? renderBankNotesPanel(state, mission) : '';
  const main = slides ? `${deck(slides, { label: 'Mission briefing', className: 'brief-deck' })}
        ${bankPanel ? `<div style="margin-top: 20px;">${bankPanel}</div>` : ''}
        <div style="margin-top: 20px;">${actions}</div>` : `${header}
        <div class="panel" style="padding: 20px; margin-bottom: 24px;">
          <div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 10px;">THREAT INTEL</div>
          <div data-intel style="font-size: ${why ? 15 : 14}px; color: rgba(237,239,243,${why ? 0.9 : 0.75}); line-height: 1.7;">${intel}</div>
          ${whyHtml(why)}
          ${intelTools}
        </div>

        ${noReset ? renderNoResetPanel(state, mission) : `
        <div class="panel panel--active" style="padding: 20px; margin-bottom: 28px;">
          <div class="section-label" style="color: var(--cyan); margin-bottom: 14px; text-shadow: 0 0 8px rgba(0,229,255,0.3);">YOUR MOVE</div>
          ${movePanelTop}
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
const MOVE_LABEL = '<div class="section-label" style="color: var(--cyan); margin-bottom: 14px; text-shadow: 0 0 8px rgba(0,229,255,0.3);">YOUR MOVE</div>';
const SLIDE_WORDS = 35;
// Scout and the closing slides: on a desktop the sidebar has them, so the whole section hides.
const PHONE_ONLY = 'slide--phone';
const MORE_INTEL_AFTER = 3; // intel slides before the rest goes behind "More intel"

// The slides, in order: title + first intel; up to two more intel; Scout; the steps; THIS
// LIBERATES + lore. At 900px and up they stack: the intel and step slides join into the
// panels they always were (style.css), and the Scout and last slides hide (the sidebar has them).
function briefingSlides({ header, briefing, why = '', intelTools = '', gearHtml = '', progressHtml = '', stepRows, stepRow, missionStepList, noResetPanel, scoutLine, scoutFeeling, preview, loreData }) {
  const slides = [];
  // Slide 1's title and badges come out of its word budget.
  // The reading switch sits under the title on a phone, so the intel's first words follow it.
  const firstBudget = Math.max(1, SLIDE_WORDS - countWords(header) - countWords(intelTools.replace(/<button[\s\S]*?<\/button>/g, ' ')));
  const [first = '', ...after] = splitWords(briefing, firstBudget);
  const rest = splitWords(after.join(''), SLIDE_WORDS);
  const shown = rest.slice(0, MORE_INTEL_AFTER - 1);
  const more = rest.slice(MORE_INTEL_AFTER - 1).join('');
  const intel = [first, ...shown];
  intel.forEach((chunk, i) => {
    const pos = `${i === 0 ? ' is-first' : ''}${i === intel.length - 1 ? ' is-last' : ''}`;
    // Later intel slides repeat the label on a phone from style.css, so the text reads on unbroken.
    const label = i === 0 ? '<div class="section-label" style="color: rgba(0,229,255,0.5); margin-bottom: 10px;">THREAT INTEL</div>' : '';
    const last = i === intel.length - 1;
    const moreHtml = `${last && more
      ? `<details class="brief-more" data-open-desktop><summary>More intel</summary><div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7;">${more}</div></details>`
      : ''}${last ? whyHtml(why) : ''}`;
    const panel = `<div class="panel brief-intel${pos}">${label}<div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7;" data-chunk>${chunk}</div>${moreHtml}</div>`;
    slides.push({ html: i === 0 ? `${header}${intelTools}${panel}` : panel });
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
      const n = countWords(st.text); // its words, not its buttons or Stuck? help
      if (words + n > SLIDE_WORDS || groups.at(-1)?.alone) {
        groups.push({ rows: [row] });
        words = n;
      } else {
        groups.at(-1).rows.push(row);
        words += n;
      }
    });
    // On a phone the device question is a slide of its own, just before the steps.
    if (gearHtml) slides.push({ html: `<div class="panel panel--active brief-steps is-first">${MOVE_LABEL}${gearHtml}</div>` });
    groups.forEach((g, i) => {
      const pos = `${i === 0 && !gearHtml ? ' is-first' : ''}${i === groups.length - 1 ? ' is-last' : ''}`;
      const label = i === 0 ? `${gearHtml ? '' : MOVE_LABEL}${progressHtml}` : '';
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

// The district lore this briefing shows: the next one not yet seen (utils/lore.js).
function loreEntry(state, missionId) {
  const lore = briefingLore(state, missionId);
  return lore ? DISTRICT_DIALOGUE[lore.districtId].lore[lore.key] || null : null;
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

// The full intel behind one tap, for the Short and Simplest levels.
function whyHtml(why) {
  if (!why) return '';
  return `<details class="brief-why" data-why><summary>Why it matters</summary><div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7;">${why}</div></details>`;
}

// How much to read, and Read it to me. The first time, Scout asks; after that it is a quiet
// switch. Nothing about the choice leaves this browser (utils/reading.js).
function readingTools(state, level, say, playing = isPlaying()) {
  const offer = readingOffer(state);
  const ask = offer
    ? `<div class="read-ask read-offer" data-read-offer="${offer}"><img src="assets/characters/scout_0.png" alt="" width="24" height="24"> <span>${OFFER_LINES[offer].line}</span>
        <span class="read-offer-buttons"><button class="btn-secondary" data-action="read-offer" data-offer="${offer}" data-answer="yes">${OFFER_LINES[offer].yes}</button><button class="walk-link" data-action="read-offer" data-offer="${offer}" data-answer="no">No thanks</button></span></div>`
    : readLevelChosen(state)
    ? ''
    : '<div class="read-ask" data-read-ask><img src="assets/characters/scout_0.png" alt="" width="24" height="24"> How much do you want to read? You can change this any time.</div>';
  const buttons = READ_LEVELS.map((l) => `<button class="read-level${l === level ? ' is-on' : ''}" data-action="read-level" data-level="${l}" aria-pressed="${l === level}">${READ_LEVEL_LABELS[l]}</button>`).join('');
  const attr = String(say).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `
          <div class="read-tools" data-read-tools>
            ${ask}
            <div class="read-row">
              <div class="read-levels" role="group" aria-label="How much to read">${buttons}</div>
              <button class="walk-link" data-action="read-aloud" data-say="${attr}" aria-label="Read the briefing out loud">&#128266; Read it to me</button>
              <button class="walk-link" data-action="focus-music" aria-pressed="${playing}">&#9835; Focus music${playing ? ' (on)' : ''}</button>
            </div>
          </div>`;
}

// ---- The compact briefing and step mode --------------------------------------------------

const attrEsc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'the page'; } };

function pageShell(state, { districtId, district, targetTab, mission }, body, cls = '') {
  return `
  <div class="brief brief-focus ${cls} scanlines" style="min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    ${renderHud(state)}
    <div class="focus-col">
      <div class="focus-crumb">
        <a href="#/district/${districtId}${targetTab}">${district?.name || districtId}</a>
        <span>/</span>
        <span>${mission.phase}</span>
      </div>
      ${body}
    </div>
  </div>`;
}

function focusTitle(titleTop, titleBottom) {
  return `<h1 class="focus-title">${titleTop ? `<span class="focus-title-top">${titleTop}</span>` : ''}<span class="focus-title-main">${titleBottom}</span></h1>`;
}

// Scout's line, small, beside the sprite.
function scoutBubble(line) {
  return `<div class="focus-scout"><img src="assets/characters/scout_0.png" data-scout="briefing" alt="Scout" width="48" height="48"><div class="focus-scout-line">${line}</div></div>`;
}

// Reading level, Read it to me and Focus music, quietly at the bottom.
function readingBar(state, level, say) {
  const playing = isPlaying();
  const buttons = READ_LEVELS.map((l) => `<button class="read-level${l === level ? ' is-on' : ''}" data-action="read-level" data-level="${l}" aria-pressed="${l === level}">${READ_LEVEL_LABELS[l]}</button>`).join('');
  const offer = readingOffer(state);
  const offerHtml = offer
    ? `<div class="read-ask read-offer" data-read-offer="${offer}"><span>${OFFER_LINES[offer].line}</span>
        <span class="read-offer-buttons"><button class="btn-secondary" data-action="read-offer" data-offer="${offer}" data-answer="yes">${OFFER_LINES[offer].yes}</button><button class="walk-link" data-action="read-offer" data-offer="${offer}" data-answer="no">No thanks</button></span></div>`
    : '';
  const ask = !offer && !readLevelChosen(state) ? '<div class="read-ask" data-read-ask>How much do you want to read? You can change this any time.</div>' : '';
  return `
      <div class="read-tools focus-tools" data-read-tools>
        ${offerHtml}${ask}
        <div class="read-row">
          <div class="read-levels" role="group" aria-label="How much to read">${buttons}</div>
        </div>
        <div class="read-row">
          <button class="walk-link" data-action="read-aloud" data-say="${attrEsc(say)}" aria-label="Read this out loud">&#128266; Read it to me</button>
          <button class="walk-link" data-action="focus-music" aria-pressed="${playing}">&#9835; Focus music${playing ? ' (on)' : ''}</button>
        </div>
      </div>`;
}

function compactBriefingPage(p) {
  const { state, mission, districtId, targetTab, titleTop, titleBottom, level, intel, why, scoutLine, missionStepList, progress, allSteps, bankPanelHtml, loreData, started, goUrl } = p;
  const n = missionStepList.length;
  const many = n > 1;
  // The steps, each with its own site, so the briefing always has somewhere to go.
  const stepList = missionStepList.map((st) => `<li>${pathText(st.text)}${st.url ? ` <a href="${st.url}" target="_blank" rel="noopener" data-action="mission-step" data-mission="${mission.id}">${hostOf(st.url)} &#8599;</a>` : ''}</li>`).join('');
  // One step: it is shown, and GO DO IT works as it always has. Several: START opens step mode.
  const primary = started && !many
    ? `<a class="btn-primary focus-go" href="#/mission/${mission.id}/debrief" data-action="i-did-it" data-mission="${mission.id}">I DID IT &#10003;</a>`
    : many
      ? `<button class="btn-primary focus-go" data-action="${started ? 'show-steps' : 'start-mission'}" data-mission="${mission.id}">${started ? `BACK TO STEP ${Math.max(1, progress.current + 1)}` : 'START'} &#9654;</button>`
      : goUrl
        ? `<button class="btn-primary focus-go" data-action="go-do-it" data-mission="${mission.id}" data-url="${goUrl}">GO DO IT &#9654;</button>`
        : `<button class="btn-primary focus-go" data-action="start-mission" data-mission="${mission.id}">START &#9654;</button>`;
  const body = `
      ${missionTrail(started ? 'steps' : 'brief', progress)}
      ${focusTitle(titleTop, titleBottom)}
      <p class="focus-lead" data-intel>${intel}</p>
      ${why ? `<details class="brief-why" data-why><summary>Why it matters</summary><div class="focus-why">${why}</div></details>` : ''}
      ${p.extras}
      ${scoutBubble(scoutLine)}
      ${many ? `<div class="focus-meta">${n} steps &middot; about ${mission.estimatedMinutes} min</div>
      <details class="focus-steps-peek"><summary>See the steps</summary><ol style="overflow-wrap: anywhere;">${stepList}</ol></details>
      ${accountSite(mission, missionStepList, goUrl)}` : `<div class="focus-one-step">${missionStepList[0] ? stepCardText(mission, missionStepList[0]) : ''}</div>`}
      ${gearAsk(state, gearQuestions(allSteps))}
      ${bankPanelHtml}
      <div class="focus-actions">
        ${primary}
        ${canSayAlready(mission) ? `<button class="btn-secondary" data-action="already-have" data-mission="${mission.id}">I ALREADY HAVE THIS</button>` : ''}
        <a class="focus-notnow" href="#/district/${districtId}${targetTab}">NOT NOW</a>
      </div>
      ${readingBar(state, level, plainText(`${intel} ${scoutLine}`))}
      ${renderLoreSection(loreData)}`;
  return pageShell(state, p, body);
}

// "Settings → Health → Data Access" as chips when it is a plain path, else the words.
function pathText(text) {
  const path = pathChips(text);
  return path ? `${path.lead}${path.lead ? '<span class="walk-chip-sep"> → </span>' : ''}<span class="walk-path">${path.chips}</span>` : text;
}

// No step has a link of its own: the account's own security page (what GO DO IT opened).
function accountSite(mission, steps, goUrl) {
  if (!goUrl || steps.some((st) => st.url)) return '';
  return `<a class="btn-secondary focus-open" href="${goUrl}" target="_blank" rel="noopener" data-action="mission-step" data-mission="${mission.id}">OPEN ${hostOf(goUrl).toUpperCase()} &#8599;</a>`;
}

function stepCardText(mission, step) {
  const link = step.url
    ? `<a class="btn-secondary focus-open" href="${step.url}" target="_blank" rel="noopener" data-action="mission-step" data-mission="${mission.id}">OPEN ${hostOf(step.url).toUpperCase()} &#8599;</a>`
    : '';
  const notes = (step.note || []).map((n) => `<details class="focus-note"><summary>${n.label}</summary><p>${n.text}</p></details>`).join('');
  return `<div class="focus-step-text">${pathText(step.text)}</div>${link}${notes}`;
}

function stepModePage(p) {
  const { state, mission, titleTop, titleBottom, level, missionStepList, progress, marks, allSteps, bankPanelHtml } = p;
  const { total, current } = progress;
  const allDone = current === -1;
  const step = allDone ? null : missionStepList[current];
  const key = step ? stepKeyOf(step) : '';
  const say = step ? plainText(step.text).replace(/→/g, ', then ') : '';
  const card = allDone
    ? `
      <div class="focus-card is-done" data-step-card>
        <div class="focus-card-head">ALL ${total} STEPS DONE &#10003;${progress.skipped ? ` <span>(${progress.skipped} skipped)</span>` : ''}</div>
        <p class="focus-step-text">Nice work. Now tell Scout what you found.</p>
        <a class="btn-primary focus-go" href="#/mission/${mission.id}/debrief" data-action="i-did-it" data-mission="${mission.id}">REPORT BACK &#9654;</a>
        <button class="walk-link" data-action="step-back" data-mission="${mission.id}">&#8592; Back to the last step</button>
      </div>`
    : `
      <div class="focus-card" data-step-card data-step-key="${key}">
        <div class="focus-card-head">STEP ${current + 1} OF ${total}</div>
        ${stepCardText(mission, step)}
        ${accountSite(mission, missionStepList, p.goUrl)}
        <button class="btn-primary focus-go focus-done" data-action="step-done" data-mission="${mission.id}" data-step="${key}">DONE &#10003;</button>
        <div class="focus-row">
          ${progress.handled ? `<button class="walk-link" data-action="step-back" data-mission="${mission.id}">&#8592; Back</button>` : ''}
          <button class="walk-link" data-action="step-stuck" data-mission="${mission.id}" data-step="${key}" aria-expanded="false" aria-controls="stuck-${key}">Stuck?</button>
          <button class="walk-link" data-action="step-skip" data-mission="${mission.id}" data-step="${key}">Skip</button>
          <button class="walk-link" data-action="read-aloud" data-say="${attrEsc(say)}" aria-label="Read this step out loud">&#128266; Read it to me</button>
        </div>
        <div class="walk-help" id="stuck-${key}" hidden>${stuckHelp(step).map((l) => `<p>${l}</p>`).join('')}</div>
      </div>`;
  const list = missionStepList.map((st, i) => {
    const m = marks[stepKeyOf(st)];
    const cls = m === 'done' ? 'is-done' : m === 'skipped' ? 'is-skipped' : i === current ? 'is-current' : '';
    return `<li class="${cls}"><button class="walk-check" data-action="step-toggle" data-mission="${mission.id}" data-step="${stepKeyOf(st)}" aria-pressed="${m === 'done'}" aria-label="${m === 'done' ? `Step ${i + 1} done. Tap to undo.` : `Mark step ${i + 1} done`}">${m === 'done' ? '&#10003;' : m === 'skipped' ? '&#8631;' : i + 1}</button><span>${plainText(st.text)}${st.url ? ` <a href="${st.url}" target="_blank" rel="noopener" data-action="mission-step" data-mission="${mission.id}">${hostOf(st.url)} &#8599;</a>` : ''}</span></li>`;
  }).join('');
  const body = `
      ${missionTrail('steps', progress)}
      <div class="focus-mission">${titleTop ? `${titleTop}: ` : ''}${titleBottom}</div>
      ${gearAsk(state, gearQuestions(allSteps))}
      ${walkProgress(progress, { bare: true })}
      ${card}
      ${p.extras}
      ${bankPanelHtml}
      <details class="focus-steps-peek"><summary>All steps (${progress.handled}/${total})</summary><ol class="focus-all">${list}</ol></details>
      <div class="focus-actions focus-actions--quiet">
        ${allDone ? '' : `<a class="walk-link" href="#/mission/${mission.id}/debrief" data-action="i-did-it" data-mission="${mission.id}">Finished already? Report back</a>`}
        <button class="walk-link" data-action="show-briefing" data-mission="${mission.id}">Read the briefing again</button>
      </div>
      ${readingBar(state, level, say)}`;
  return pageShell(state, p, body, 'brief-steps-mode');
}
