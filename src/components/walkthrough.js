// The mission's steps as a walkthrough: each step can be ticked or skipped, the next one is
// lit with DONE and Help, menu paths (Settings → Privacy → Ads) are chips, and a bar says
// how far along the player is. See utils/reading.js for the why.

import { plainText } from '../utils/readability.js';
import { GEAR_GROUPS, gearChoice, stepKey, stepMarks, readLevel } from '../utils/reading.js';
import { PASSWORD_MANAGERS } from '../data/missions-passwords.js';
import { fillBar } from './fill-bar.js';
import { twoPlaceNames } from '../data/two-places.js';
import { passwordPlaces } from '../utils/password-places.js';
import { saveNote } from './browser-warning.js';

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// "Settings → Health → Data Access" as chips; anything before the first arrow stays as words.
// Only plain text is split (a step with markup in it is left as it is).
export function pathChips(text) {
  if (!text.includes('→') || /</.test(text)) return null;
  const parts = splitOutsideBrackets(text);
  if (parts.length < 2) return null;
  const [lead, ...rest] = parts;
  const chips = rest.map((p, i) => `<span class="walk-chip" data-path-chip="${i}">${p}</span>`).join('<span class="walk-chip-sep"> → </span>');
  return { lead, chips, last: rest.at(-1) };
}

// Split at the arrows that aren't inside brackets: an aside's arrows ("(iOS 18 and later:
// Settings → Apps → Health)") stay as words inside the chip they belong to.
function splitOutsideBrackets(text) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(') depth++;
    if (c === ')') depth = Math.max(0, depth - 1);
    if (c === '→' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  parts.push(cur.trim());
  return parts;
}

// The words "Stuck?" opens for a step: the step's own help, else what usually helps.
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

// What to try when a step won't work: a few short lines about THIS step, in plain words.
// `site` is the page the step happens on when it has no link of its own.
// No line says "skip": the panel's own button does that (helpPanel).
export function stuckHelp(step, { site } = {}) {
  if (step.help) return [step.help];
  const lines = [];
  // The doing word: past a device label ("Samsung:") and a lead-in ("Separately,", "Also").
  const text = plainText(step.text).replace(/^[A-Z][\w&/ .-]{0,24}:\s+/, '').replace(/^(Separately|Also|Then|Next|Now),?\s+/i, '');
  if (!step.url && site && hostOf(site)) lines.push(`You do this on ${hostOf(site)}. Not open? Tap the button below.`);
  const path = pathChips(step.text);
  if (path) {
    // The place to search for: the last short stop on the path ("Ads", not "turn off anything you don't use").
    const stops = splitOutsideBrackets(step.text).slice(1).map((s) => plainText(s));
    const target = [...stops].reverse().find((s) => s.split(/\s+/).length <= 4) || '';
    lines.push(target
      ? `Can’t see “${target}”? Look for a search box at the top. Type “${target}” in it.`
      : 'Can’t see it? Look for a search box at the top of the page or of Settings.');
  }
  const label = text.match(/["“]([^"”]{2,40})["”]/)?.[1];
  if (/^(Enter|Type)\b/i.test(text)) lines.push('Find the empty box on the page. Tap it and type. Then tap the button next to it.');
  else if (step.url) lines.push('Tap the OPEN button. A new page opens. If it asks you to sign in, sign in first.');
  else if (/^(Note|Read|Look|Review|Check|Scroll|Flag)\b/i.test(text) || /results/i.test(text)) {
    lines.push('The answer is on the page you have open. Scroll down to see all of it.');
  } else if (/^(Open|Go)\b/i.test(text) && !site) {
    lines.push('Find the app on your phone or computer. Can’t see it? Swipe down on your home screen and type its name.');
  } else if (/^(Find|Search)\b/i.test(text)) {
    lines.push('Use the search box at the top of the page or app.');
  } else if (/^(Tap|Click|Turn|Toggle|Enable|Disable|Switch|Select|Pick|Remove|Delete|Log|Sign|Change|Set|Untick|Uncheck|Add|Save)\b/i.test(text) && !path) {
    lines.push('Look for a button or switch with the same words as this step. Tap it.');
  }
  if (label && !path) lines.push(`Look for the words “${label}” on the screen.`);
  if (step.ask) lines.push('Then pick what you found, right here on this card.');
  if (!lines.length) lines.push('Read it one more time, slowly, or tap Read it to me. Do what you can.');
  return lines;
}

// The Help panel: the lines, the page again (when the step has no link of its own), and
// a plain way out. Skipping is an action, not advice.
export function helpPanel({ mission, step, key, site }) {
  const again = !step.url && site && hostOf(site)
    ? `<a class="btn-secondary walk-again" href="${attr(site)}" target="_blank" rel="noopener" data-action="mission-step" data-mission="${mission.id}">OPEN ${hostOf(site).toUpperCase()} AGAIN &#8599;</a>`
    : '';
  return `
        <div class="walk-help" id="stuck-${key}" hidden>
          ${stuckHelp(step, { site }).map((l) => `<p>${l}</p>`).join('')}
          ${again}
          <button class="btn-secondary walk-skip" data-action="step-skip" data-mission="${mission.id}" data-step="${key}">SKIP THIS STEP FOR NOW</button>
          <p class="walk-help-small">You can come back to it. The other steps still count.</p>
        </div>`;
}

// Where a two-places step happens (data/two-places.js): "📱 On your iPhone", and on the first
// step after the place changes "💻 Now in Chrome" with one plain line under it. steps: the list
// the step is in, so "now" compares with the step before it.
export function placeMove(steps, i) {
  const p = steps?.[i]?.place;
  if (!p) return null;
  const prev = steps.slice(0, i).reverse().find((st) => st.place)?.place;
  const moved = Boolean(prev && prev.kind !== p.kind);
  return { place: p, moved, label: moved ? p.now : p.label, line: moved ? p.line || '' : '' };
}

// changesOnly: a list of every step (Advanced's YOUR MOVE) says the place on its first step and
// where it changes, not on every row.
export function placeChip(steps, i, { changesOnly = false } = {}) {
  const m = placeMove(steps, i);
  if (!m) return '';
  if (changesOnly && !m.moved && steps.slice(0, i).some((st) => st.place)) return '';
  const icon = m.place.kind === 'phone' ? '&#128241;' : '&#128187;';
  return `<div class="place-chip-row"><span class="place-chip" data-place="${m.place.kind}"><span aria-hidden="true">${icon}</span> ${m.label}</span></div>${m.line ? `<p class="place-line" data-place-line>${m.line}</p>` : ''}`;
}

// What Read it to me says for the chip: the line when the place changes, else the chip.
export function placeSay(steps, i) {
  const m = placeMove(steps, i);
  return m ? [m.line || m.label] : [];
}

// One step. `current` lights it with its buttons; `mark` is 'done', 'skipped' or undefined.
// lead: above the words (the place chip); extra: under them, always shown (the bank step's banks).
export function walkStepRow({ mission, step, index, mark, current, notes = step.note, stepNote, site, ask = '', lead = '', extra = '' }) {
  const key = stepKey(step);
  const num = String(index + 1).padStart(2, '0');
  const path = pathChips(step.text);
  const words = path ? `${path.lead}${path.lead ? '<span class="walk-chip-sep"> → </span>' : ''}<span class="walk-path">${path.chips}</span>` : step.text;
  const body = step.url
    ? `<a href="${step.url}" target="_blank" rel="noopener" data-action="mission-step" data-mission="${mission.id}" style="color: var(--cyan); font-weight: 600;">${words}</a>`
    : words;
  const note = notes?.length && stepNote ? `
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
          ${notes.map((n) => stepNote(n)).join('')}
        </div>` : '';
  const say = plainText(step.text).replace(/→/g, ', then ');
  const state = mark === 'done' ? 'is-done' : mark === 'skipped' ? 'is-skipped' : current ? 'is-current' : '';
  const checkLabel = mark === 'done' ? `Step ${index + 1} done. Tap to undo.` : `Mark step ${index + 1} done`;
  const help = current ? `
        <div class="walk-actions">
          <button class="btn-primary walk-done" data-action="step-done" data-mission="${mission.id}" data-step="${key}">DONE &#10003; NEXT</button>
          <button class="walk-link" data-action="step-stuck" data-mission="${mission.id}" data-step="${key}" aria-expanded="false" aria-controls="stuck-${key}">Help</button>
          <button class="walk-link" data-action="read-aloud" data-say="${attr(say)}" aria-label="Read this step out loud">&#128266; Read it to me</button>
        </div>${helpPanel({ mission, step, key, site })}` : '';
  return `
    <div data-brief-step data-step-key="${key}" class="walk-step ${state}" style="display: flex; gap: 14px; align-items: flex-start;">
      <button data-step-num class="walk-check" data-action="step-toggle" data-mission="${mission.id}" data-step="${key}" aria-pressed="${mark === 'done'}" aria-label="${checkLabel}">${mark === 'done' ? '&#10003;' : mark === 'skipped' ? '&#8631;' : num}</button>
      <div class="walk-body" style="font-size: 15px; color: var(--offwhite); line-height: 1.5; min-width: 0; overflow-wrap: anywhere;">${lead}${body}${mark === 'skipped' ? ' <span class="walk-tag">skipped</span>' : ''}${note}${extra}${current ? ask : ''}${help}</div>
    </div>`;
}

// "STEP 2 OF 5" and a bar; "ALL 5 STEPS HANDLED" at the end.
// bare: just the bar (step mode's card says which step it is).
// key: the mission, so its bar fills from where it was (components/fill-bar.js).
export function walkProgress(p, { bare = false, key = 'steps', size = 'mid' } = {}) {
  if (p.total < 2) return '';
  const label = p.current === -1
    ? `ALL ${p.total} STEPS HANDLED${p.skipped ? ` · ${p.skipped} SKIPPED` : ''}`
    : `STEP ${p.current + 1} OF ${p.total}`;
  return `
    <div class="walk-progress" data-walk-progress>
      ${bare ? '' : `<div class="walk-progress-label">${label}</div>`}
      ${fillBar({ key, done: p.handled, total: p.total, size, label: p.current === -1 ? 'All steps done' : `Step ${p.current + 1} of ${p.total}` })}
    </div>`;
}

// The device questions above the steps, once each; after answering, one line to change it.
export function gearAsk(state, questions) {
  return questions.map(({ group, options }) => {
    const g = GEAR_GROUPS[group];
    const choice = gearChoice(state, group);
    if (choice) {
      const change = `<button class="walk-link" data-action="gear-reset" data-group="${group}">Change</button>`;
      // "I don't have one" or "I share one" (About your devices): every step shows.
      if (g.options[choice]?.answerOnly) {
        return `<div class="walk-gear-set" data-gear-set="${group}">Showing all the steps. ${change}</div>`;
      }
      if (choice !== 'all' && !options.includes(choice)) {
        return `<div class="walk-gear-set" data-gear-set="${group}">No steps here just for <strong>${g.options[choice]?.label}</strong>, so all of them are shown. ${change}</div>`;
      }
      const shown = choice === 'all' ? 'all devices' : g.options[choice]?.label;
      return `<div class="walk-gear-set" data-gear-set="${group}">Showing steps for <strong>${shown}</strong>. ${change}</div>`;
    }
    const chips = options.map((o) => `<button class="walk-gear-chip" data-action="gear-pick" data-group="${group}" data-value="${o}">${g.options[o].label}</button>`).join('');
    return `
    <div class="walk-gear" data-gear-ask="${group}">
      <div class="walk-gear-q">${g.question} <span>Then you only see your steps.</span></div>
      <div class="walk-gear-chips">${chips}<button class="walk-gear-chip walk-gear-all" data-action="gear-pick" data-group="${group}" data-value="all">Show all</button></div>
    </div>`;
  }).join('');
}

// Where the player is in the whole mission: read it, do the steps, report back.
// stage: 'brief' | 'steps' | 'report' | 'filed'.
// already: the player said "I already have this", so there were no steps to do.
export function missionTrail(stage, p, { already = false } = {}) {
  const steps = already ? 'Already done' : p && p.total > 1 ? `Steps ${p.handled}/${p.total}` : 'Do it';
  const items = [
    ['brief', 'Read'],
    ['steps', steps],
    ['report', 'Report back'],
  ];
  const order = ['brief', 'steps', 'report', 'filed'];
  const at = order.indexOf(stage);
  // Past the steps without doing them all ("Steps 0/3" on the report): no tick beside a count
  // that says they aren't done. Its number, and not lit.
  const stepsLeft = !already && p && p.total > 1 && p.handled < p.total;
  return `
    <ol class="mission-trail" aria-label="Mission progress">
      ${items.map(([id, label], i) => {
        const past = i < at && !(id === 'steps' && stepsLeft);
        const cls = past ? 'is-past' : i === at ? 'is-now' : '';
        return `<li class="${cls}"${i === at ? ' aria-current="step"' : ''}><span class="mission-trail-n">${past ? '&#10003;' : i + 1}</span>${label}</li>`;
      }).join('<li class="mission-trail-sep" aria-hidden="true"></li>')}
    </ol>`;
}

// The ticks for a mission (re-exported for the screens).
export { stepMarks };

// The password check asks where the player's passwords are saved, right on the mission, so its
// steps are for their phone or browser. Same answer as the question in The Master Keys
// (state.passwordManager); it never leaves this browser.
// opts.saidOnStep: the step on screen already says where they are (its place chip), so only
// the way to change it shows, not the same sentence again in grey.
export function passwordPlaceAsk(state, mission, { saidOnStep = false } = {}) {
  if (!mission?.stepsByManager) return '';
  const chosen = PASSWORD_MANAGERS.find((pm) => pm.value === state?.passwordManager);
  const change = '<button class="walk-link" data-action="set-password-manager" data-pm="">Change</button>';
  // Two places (the finder): steps that cover both. Nothing to move.
  const two = twoPlaceNames(passwordPlaces(state));
  if (chosen && two && saidOnStep) {
    return `<div class="walk-gear-set" data-pm-set data-pm-two><button class="walk-link" data-action="set-password-manager" data-pm="">Change where my passwords are</button></div>`;
  }
  if (chosen && two) {
    return `<div class="walk-gear-set" data-pm-set data-pm-two>Your passwords are in two places: <strong>${two[0]}</strong> and <strong>${two[1]}</strong>. These steps cover both. ${change}</div>`;
  }
  if (chosen) {
    return `<div class="walk-gear-set" data-pm-set>Showing steps for <strong>${chosen.text}</strong>. ${change}</div>`;
  }
  const chips = PASSWORD_MANAGERS.map((pm) => `<button class="walk-gear-chip" data-action="set-password-manager" data-pm="${pm.value}">${pm.text}</button>`).join('');
  // Not everyone knows (Liz 2026-11-18): the finder asks one thing at a time and has them look.
  const find = `<a class="btn-secondary finder-go" href="#/passwords?from=${mission.id}" data-finder-go>Help me find where they are &#9654;</a>`;
  // Simple mode: the finder first, the list for those who know.
  const list = readLevel(state) === 'simplest'
    ? `<details class="walk-gear-know"><summary>I know where</summary><div class="walk-gear-chips">${chips}</div></details>`
    : `<div class="walk-gear-chips">${chips}</div>`;
  return `
    <div class="walk-gear" data-pm-ask>
      <div class="walk-gear-q">Where are your passwords saved? <span>Then you only see your steps.</span></div>
      ${devicesNote(state)}
      ${find}
      ${list}
    </div>`;
}

// --- About your devices (Simple mode) ------------------------------------------------------
// Liz 2026-11-18: "find out what their other devices are, if they're in simple mode, because you
// can help clarify what to do and where to go … separate information gathering and signal
// gathering from action taking." Asked once, before a mission's first step, and kept in
// state.gear (the same answers as the device questions above the steps). Never tracked.

const DEVICE_ASKS = [
  ['phone', 'What phone do you have?', ['iphone', 'android', 'none']],
  ['computer', 'What computer do you use?', ['windows', 'mac', 'chromebook', 'shared', 'none']],
];

export function devicesAnswered(state) {
  return DEVICE_ASKS.every(([group]) => gearChoice(state, group));
}

// A mission whose steps change with the player's phone or computer: a Password Reset or the
// password check (where the passwords are saved), or steps for an iPhone and an Android.
export function missionNeedsDevices(mission, questions = []) {
  return Boolean(mission?.stepsByManager) || questions.some((q) => q.group === 'phone' || q.group === 'computer');
}

export function devicesAsk(state) {
  const rows = DEVICE_ASKS.map(([group, ask, options]) => {
    const g = GEAR_GROUPS[group];
    const choice = gearChoice(state, group);
    if (choice) {
      return `<div class="walk-gear-set" data-gear-set="${group}">${ask} <strong>${g.options[choice]?.label || 'All of them'}</strong>. <button class="walk-link" data-action="gear-reset" data-group="${group}">Change</button></div>`;
    }
    const chips = options.map((o) => `<button class="walk-gear-chip" data-action="gear-pick" data-group="${group}" data-value="${o}">${g.options[o].label}</button>`).join('');
    return `<div class="walk-gear" data-gear-ask="${group}"><div class="walk-gear-q">${ask}</div><div class="walk-gear-chips">${chips}</div></div>`;
  }).join('');
  return `
    <div class="walk-devices" data-devices-ask>
      <h2 class="finder-q finder-q--small">First, about your devices</h2>
      <p class="walk-devices-why">Then we can tell you where to go. ${saveNote('devices')}</p>
      ${rows}
    </div>`;
}

// A phone and a computer that don't keep the same passwords: say so up front, before any step,
// so a password missing from one place never feels like the player did something wrong.
// An iPhone with Windows or a Chromebook, an Android phone with a Mac.
const APART = { iphone: ['windows', 'chromebook'], android: ['mac'] };
const DEVICE_WORDS = { iphone: 'Your iPhone', android: 'Your Android phone', windows: 'your Windows computer', mac: 'your Mac', chromebook: 'your Chromebook' };
export function devicesNote(state) {
  const phone = gearChoice(state, 'phone');
  const computer = gearChoice(state, 'computer');
  if (!APART[phone]?.includes(computer)) return '';
  return `<p class="walk-devices-note" data-devices-note>${DEVICE_WORDS[phone]} and ${DEVICE_WORDS[computer]} may not keep the same passwords. A password can be saved on one and not the other. That’s normal. We’ll help you check each place.</p>`;
}
