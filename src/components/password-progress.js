// How many passwords need changing, and Scout pacing them in bursts. Shown on
// the Master Keys header, the password-manager report and "Change the next 3".
import { passwordProgressLines, burstScout } from '../utils/bursts.js';

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
