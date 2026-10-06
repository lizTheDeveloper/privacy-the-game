// How many passwords need changing, and Scout pacing them in bursts. Shown on
// the Master Keys header, the password-manager report and "Change the next 3".
import { passwordProgressLines, burstScout } from '../utils/bursts.js';
import { categoryAsk } from '../utils/pm-categories.js';

export function renderPasswordProgress(state, { withBurst = false } = {}) {
  const lines = passwordProgressLines(state);
  if (lines.length === 0) return '';
  const burst = withBurst ? burstScout(state) : null;
  return `
  <div class="panel" data-password-progress style="padding: 14px 16px; margin-bottom: 16px; border-color: rgba(198,255,0,0.2);">
    <div class="section-label" style="color: rgba(198,255,0,0.6); margin-bottom: 8px;">PASSWORD RESETS</div>
    ${lines.map((l, i) => `<div style="font-size: ${i === 0 ? 14 : 13}px; color: ${i === 0 ? 'var(--offwhite)' : 'var(--lime)'}; line-height: 1.5;">${l}</div>`).join('')}
    ${burst ? `<div style="display: flex; gap: 10px; align-items: flex-start; margin-top: 12px;">
      <img src="assets/characters/scout_0.png" alt="" style="width: 32px; height: 32px; flex-shrink: 0;">
      <div style="font-size: 13px; color: rgba(237,239,243,0.7); line-height: 1.6; font-style: italic;">${burst.text}</div>
    </div>
    ${burst.button ? `<div style="margin-top: 12px;"><button class="btn-secondary" data-action="line-up-burst">${burst.button}</button></div>` : ''}` : ''}
  </div>`;
}

// The per-category ask at the top of a district (Task 14b). Same panel look
// as the counts above. Numbers typed here never leave this browser.

const scoutLine = (text) => `
    <div style="display: flex; gap: 10px; align-items: flex-start;">
      <img src="assets/characters/scout_0.png" alt="" style="width: 32px; height: 32px; flex-shrink: 0;">
      <div style="font-size: 13px; color: rgba(237,239,243,0.7); line-height: 1.6; font-style: italic;">${text}</div>
    </div>`;

// A number box and the button that files it, plus the button that closes the ask.
function askControls(districtId, { label, numAction, numButton, clearButton, clearAction = 'pm-cat-clear' }) {
  const id = `pm-cat-num-${districtId}`;
  return `
    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px;">
      <label for="${id}" style="font-size: 13px; color: rgba(237,239,243,0.7);">${label}</label>
      <input id="${id}" type="number" min="1" max="9999" step="1" inputmode="numeric" style="width: 84px; background: transparent; border: 1px solid rgba(0,229,255,0.3); color: var(--offwhite); font-size: 16px; padding: 8px 10px; font-family: var(--font-mono);">
      <button class="btn-secondary" style="padding: 8px 14px;" data-action="${numAction}" data-district="${districtId}">${numButton}</button>
    </div>
    <div style="margin-top: 10px;">
      <button class="btn-secondary" style="padding: 8px 14px;" data-action="${clearAction}" data-district="${districtId}">${clearButton}</button>
    </div>`;
}

export function renderCategoryAsk(state, districtId) {
  const ask = categoryAsk(state, districtId);
  if (!ask || ask.mode === 'clear') return '';
  let body;
  if (ask.mode === 'ask') {
    body = scoutLine(ask.text) + askControls(districtId, { label: 'How many?', numAction: 'pm-cat-flag', numButton: 'ADD', clearButton: 'NONE FROM HERE', clearAction: 'pm-cat-none' });
  } else if (ask.mode === 'working') {
    body = `${ask.lines.map((l, i) => `<div style="font-size: ${i === 0 ? 14 : 13}px; color: ${i === 0 ? 'var(--offwhite)' : 'var(--lime)'}; line-height: 1.5;">${l}</div>`).join('')}
    <div style="margin-top: 10px;">${scoutLine(ask.scout)}</div>
    ${askControls(districtId, { label: 'I changed', numAction: 'pm-cat-changed', numButton: 'SAVE', clearButton: 'THAT’S ALL FROM HERE' })}`;
  } else {
    body = scoutLine(ask.scout) + askControls(districtId, { label: 'How many?', numAction: 'pm-cat-flag', numButton: 'ADD', clearButton: 'NO MORE' });
  }
  return `
  <div class="panel" data-pm-category="${districtId}" style="padding: 14px 16px; margin-bottom: 16px; border-color: rgba(198,255,0,0.2);">
    <div class="section-label" style="color: rgba(198,255,0,0.6); margin-bottom: 10px;">FROM YOUR PASSWORD MANAGER</div>
    ${body}
  </div>`;
}

// Once the ask is closed: one quiet line on the district header, and the way back in.
export function renderCategoryQuiet(state, districtId) {
  const ask = categoryAsk(state, districtId);
  if (ask?.mode !== 'clear') return '';
  return `
        <div style="font-size: 11px; color: rgba(237,239,243,0.4); margin-top: 6px; line-height: 1.5;">${ask.quiet}
          <button data-action="pm-cat-reopen" data-district="${districtId}" style="background: none; border: none; padding: 0 0 0 4px; font: inherit; color: rgba(0,229,255,0.6); text-decoration: underline; cursor: pointer;">Found more from here?</button>
        </div>`;
}
