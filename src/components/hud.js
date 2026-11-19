import { calcIntegrity, calcExposure } from '../utils/calc.js';
import { isCabinetMode } from '../utils/cabinet.js';
import { bugButtonHtml } from './bug-reporter.js';
import { displayStreak } from '../state.js';
import { readLevel, READ_LEVEL_LABELS } from '../utils/reading.js';
import { isPlaying } from '../utils/focus-music.js';

// Link home to the studio. The utm tags let the studio site count visits from the game.
export const STUDIO_URL = 'https://multiversegames.ai/?utm_source=reclaim-city&utm_medium=game&utm_content=';

// tools: the mission screens' reading controls (Simple / Full intel, Read it to me, Focus
// music), a row of their own in the top bar (Liz 2026-11-17: "put them at the top").
export function renderHud(state, { tools = '', nextLink = true } = {}) {
  const integrity = calcIntegrity(state);
  const exposure = calcExposure(state);
  const streak = displayStreak(state);
  // Web cabinet (campus iframe): no real-money asks.
  const supportBlock = isCabinetMode() ? '' : `<div class="hud-support">
        <a class="hud-support-link" href="https://buy.stripe.com/6oU8wOa387If097aKl6c00o" target="_blank" rel="noopener"><span class="hud-dollar" aria-hidden="true">$</span>SUPPORT US</a>
        <a class="hud-patreon" href="https://www.patreon.com/lizthedeveloper" target="_blank" rel="noopener">or any amount on Patreon</a>
      </div>`;
  // The other mode, one tap away, next to Support us (Liz 2026-11-18: "next to support, put simple
  // mode … people can just click on it and switch back"). Mission screens have the full switch in
  // their tools row instead.
  const other = readLevel(state) === 'full' ? 'simplest' : 'full';
  // Simple mode: What's next, from any screen (Liz 2026-11-18: "from the top thing, it can help
  // them orient to the next thing").
  const whatsNext = !tools && nextLink && readLevel(state) === 'simplest' ? '<a class="hud-next" href="#/next">What’s next &#9654;</a>' : '';
  // Focus music plays on through every screen (Liz 2026-11-19), so while it is on every screen
  // can stop it. Mission screens have the full button in their tools row.
  const musicButton = !tools && isPlaying() ? '<button type="button" class="hud-music" data-action="focus-music" aria-pressed="true" aria-label="Focus music (on): stop" title="Focus music is on. Click to stop."><span aria-hidden="true">&#9835;</span><span class="hud-music-label" aria-hidden="true"> Music on</span></button>' : '';
  const modeButton = tools ? '' : `<button type="button" class="hud-mode" data-action="read-level" data-level="${other}" aria-label="Switch to ${READ_LEVEL_LABELS[other]}">${READ_LEVEL_LABELS[other]}</button>`;
  return `
  <div${tools ? ' class="hud-bar hud-bar--tools"' : ''} style="display: flex; justify-content: space-between; align-items: center; padding: 10px 20px;${tools ? ' flex-wrap: wrap; row-gap: 8px;' : ''} background: linear-gradient(180deg, rgba(9,11,16,0.97) 0%, rgba(9,11,16,0.7) 70%, transparent 100%); border-bottom: 1px solid rgba(0,229,255,0.1);">
    <div>
      <div class="hud-brand">RECLAIM CITY</div>
      <div class="hud-tagline">TAKE BACK YOUR DATA</div>
      <a class="hud-studio" href="${STUDIO_URL}hud" target="_blank" rel="noopener" data-studio-link="hud">BY MULTIVERSE GAMES&nbsp;&#8599;</a>
    </div>
    <div style="display: flex; gap: 12px; align-items: center;">
      <div class="hud-stat hud-stat--lime">
        <span class="stat-value">${integrity}%</span>
        <span class="stat-label">INTEGRITY</span>
      </div>
      <div class="hud-stat hud-stat--magenta">
        <span class="stat-value">${exposure}</span>
        <span class="stat-label">EXPOSURE</span>
      </div>
      <div class="hud-stat hud-stat--amber">
        <span class="stat-value">${streak}d</span>
        <span class="stat-label">STREAK</span>
      </div>
      ${bugButtonHtml()}
      ${whatsNext}${musicButton}
      ${modeButton}
      ${supportBlock}
    </div>${tools ? `
    <div class="hud-tools">${tools}</div>` : ''}
  </div>`;
}
