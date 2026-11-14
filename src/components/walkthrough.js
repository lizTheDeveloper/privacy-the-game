// The mission's steps as a walkthrough: each step can be ticked or skipped, the next one is
// lit with DONE and "Stuck?", menu paths (Settings → Privacy → Ads) are chips, and a bar says
// how far along the player is. See utils/reading.js for the why.

import { plainText } from '../utils/readability.js';
import { GEAR_GROUPS, gearChoice, stepKey, stepMarks } from '../utils/reading.js';

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
export function stuckHelp(step) {
  if (step.help) return [step.help];
  const lines = [];
  const path = pathChips(step.text);
  if (path) {
    // The place to search for: the last short stop on the path ("Ads", not "turn off anything you don't use").
    const stops = splitOutsideBrackets(step.text).slice(1).map((s) => plainText(s));
    const target = [...stops].reverse().find((s) => s.split(/\s+/).length <= 4) || '';
    lines.push(target
      ? `Can’t find “${target}”? Menus move around between phones and updates. Look for a search box at the top of the app or of Settings, and type “${target}”.`
      : 'Can’t find it? Menus move around between phones and updates. Look for a search box at the top of the app or of Settings.');
  }
  if (step.url) lines.push('The link opens the right page. If it asks you to sign in, sign in first, then look again.');
  lines.push('It’s OK to skip a step. Your other steps still count, and you can come back to this one.');
  return lines;
}

// One step. `current` lights it with its buttons; `mark` is 'done', 'skipped' or undefined.
export function walkStepRow({ mission, step, index, mark, current, notes = step.note, stepNote }) {
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
          <button class="walk-link" data-action="step-stuck" data-mission="${mission.id}" data-step="${key}" aria-expanded="false" aria-controls="stuck-${key}">Stuck?</button>
          <button class="walk-link" data-action="read-aloud" data-say="${attr(say)}" aria-label="Read this step out loud">&#128266; Read it to me</button>
        </div>
        <div class="walk-help" id="stuck-${key}" hidden>
          ${stuckHelp(step).map((l) => `<p>${l}</p>`).join('')}
          <button class="btn-secondary walk-skip" data-action="step-skip" data-mission="${mission.id}" data-step="${key}">SKIP THIS STEP</button>
        </div>` : '';
  return `
    <div data-brief-step data-step-key="${key}" class="walk-step ${state}" style="display: flex; gap: 14px; align-items: flex-start;">
      <button data-step-num class="walk-check" data-action="step-toggle" data-mission="${mission.id}" data-step="${key}" aria-pressed="${mark === 'done'}" aria-label="${checkLabel}">${mark === 'done' ? '&#10003;' : mark === 'skipped' ? '&#8631;' : num}</button>
      <div class="walk-body" style="font-size: 15px; color: var(--offwhite); line-height: 1.5; min-width: 0; overflow-wrap: anywhere;">${body}${mark === 'skipped' ? ' <span class="walk-tag">skipped</span>' : ''}${note}${help}</div>
    </div>`;
}

// "STEP 2 OF 5" and a bar; "ALL 5 STEPS HANDLED" at the end.
// bare: just the bar (step mode's card says which step it is).
export function walkProgress(p, { bare = false } = {}) {
  if (p.total < 2) return '';
  const pct = Math.round((p.handled / p.total) * 100);
  const label = p.current === -1
    ? `ALL ${p.total} STEPS HANDLED${p.skipped ? ` · ${p.skipped} SKIPPED` : ''}`
    : `STEP ${p.current + 1} OF ${p.total}`;
  return `
    <div class="walk-progress" data-walk-progress>
      ${bare ? '' : `<div class="walk-progress-label">${label}</div>`}
      <div class="walk-bar" role="progressbar" aria-label="Steps handled" aria-valuemin="0" aria-valuemax="${p.total}" aria-valuenow="${p.handled}"><span style="width: ${pct}%;"></span></div>
    </div>`;
}

// The device questions above the steps, once each; after answering, one line to change it.
export function gearAsk(state, questions) {
  return questions.map(({ group, options }) => {
    const g = GEAR_GROUPS[group];
    const choice = gearChoice(state, group);
    if (choice) {
      const change = `<button class="walk-link" data-action="gear-reset" data-group="${group}">Change</button>`;
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
  return `
    <ol class="mission-trail" aria-label="Mission progress">
      ${items.map(([id, label], i) => {
        const cls = i < at ? 'is-past' : i === at ? 'is-now' : '';
        return `<li class="${cls}"${i === at ? ' aria-current="step"' : ''}><span class="mission-trail-n">${i < at ? '&#10003;' : i + 1}</span>${label}</li>`;
      }).join('<li class="mission-trail-sep" aria-hidden="true"></li>')}
    </ol>`;
}

// The ticks for a mission (re-exported for the screens).
export { stepMarks };
