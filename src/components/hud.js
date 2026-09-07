import { calcIntegrity, calcExposure } from '../utils/calc.js';

export function renderHud(state) {
  const integrity = calcIntegrity(state);
  const exposure = calcExposure(state);
  const streak = state.streak.current;
  return `
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: linear-gradient(180deg, rgba(9,11,16,0.97) 0%, rgba(9,11,16,0.7) 70%, transparent 100%); border-bottom: 1px solid rgba(0,229,255,0.1);">
    <div>
      <div style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.15);">RECLAIM CITY</div>
      <div style="font-family: var(--font-mono); font-size: 8px; color: rgba(0,229,255,0.4); letter-spacing: 2px; margin-top: 1px;">TAKE BACK YOUR DATA</div>
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
    </div>
  </div>`;
}
