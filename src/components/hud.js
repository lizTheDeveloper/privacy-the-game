import { calcIntegrity, calcExposure } from '../utils/calc.js';
import { isCabinetMode } from '../utils/cabinet.js';
import { bugButtonHtml } from './bug-reporter.js';

// Link home to the studio. The utm tags let the studio site count visits from the game.
export const STUDIO_URL = 'https://multiversegames.ai/?utm_source=reclaim-city&utm_medium=game&utm_content=';

export function renderHud(state) {
  const integrity = calcIntegrity(state);
  const exposure = calcExposure(state);
  const streak = state.streak.current;
  // Web cabinet (campus iframe): no real-money asks.
  const supportBlock = isCabinetMode() ? '' : `<div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
        <a href="https://buy.stripe.com/6oU8wOa387If097aKl6c00o" target="_blank" rel="noopener" style="font-family: var(--font-display); font-size: 8px; font-weight: 600; letter-spacing: 1px; color: var(--lime); text-decoration: none; padding: 4px 10px; border: 1px solid rgba(198,255,0,0.3); background: rgba(198,255,0,0.06); display: inline-block;">SUPPORT</a>
        <a href="https://www.patreon.com/lizthedeveloper" target="_blank" rel="noopener" style="font-family: var(--font-mono); font-size: 7px; letter-spacing: 1px; color: rgba(198,255,0,0.5); text-decoration: none; display: inline-block;">or any amount on Patreon</a>
      </div>`;
  return `
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: linear-gradient(180deg, rgba(9,11,16,0.97) 0%, rgba(9,11,16,0.7) 70%, transparent 100%); border-bottom: 1px solid rgba(0,229,255,0.1);">
    <div>
      <div style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.15);">RECLAIM CITY</div>
      <div style="font-family: var(--font-mono); font-size: 8px; color: rgba(0,229,255,0.4); letter-spacing: 2px; margin-top: 1px;">TAKE BACK YOUR DATA</div>
      <a href="${STUDIO_URL}hud" target="_blank" rel="noopener" data-studio-link="hud" style="display: inline-block; font-family: var(--font-mono); font-size: 7px; color: rgba(198,255,0,0.55); letter-spacing: 2px; margin-top: 3px; text-decoration: none;">BY MULTIVERSE GAMES&nbsp;&#8599;</a>
    </div>
    <div style="display: flex; gap: 12px; align-items: center;">
      <div class="hud-stat hud-stat--lime">
        <span class="stat-value" style="color: var(--lime); text-shadow: 0 0 8px rgba(198,255,0,0.3);">${integrity}%</span>
        <span class="stat-label" style="color: rgba(198,255,0,0.5);">INTEGRITY</span>
      </div>
      <div class="hud-stat hud-stat--magenta">
        <span class="stat-value" style="color: var(--magenta); text-shadow: 0 0 8px rgba(255,45,155,0.3);">${exposure}</span>
        <span class="stat-label" style="color: rgba(255,45,155,0.5);">EXPOSURE</span>
      </div>
      <div class="hud-stat hud-stat--amber">
        <span class="stat-value" style="color: var(--amber); text-shadow: 0 0 8px rgba(255,159,0,0.3);">${streak}d</span>
        <span class="stat-label" style="color: rgba(255,159,0,0.5);">STREAK</span>
      </div>
      ${bugButtonHtml()}
      ${supportBlock}
    </div>
  </div>`;
}
