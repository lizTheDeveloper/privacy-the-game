import { renderHud } from '../components/hud.js';
import { renderScout, smallScout } from '../components/scout.js';
import { feelingForGhostDone } from '../utils/scout-feelings.js';
import { GHOST_DIALOGUE } from '../data/dialogue.js';
import { renderWhoamiPanel, renderDeletionBlock, renderNotice, esc } from './stats.js';
import { displayPodId, findPod, fmt } from '../utils/collective.js';
import { isCityComplete, hasGoneGhost, getGhostInfo, isGhostPending } from '../utils/ghost.js';
import { isAnalyticsOff } from '../utils/analytics-pref.js';
import { getChosenPod } from '../utils/pod-pref.js';
import { readLevel } from '../utils/reading.js';
import { fillBar } from '../components/fill-bar.js';
import { seeEverything, simpleLead } from '../components/see-everything.js';

const MUTED = 'font-size: 13px; color: rgba(237,239,243,0.6); line-height: 1.6;';
const STEP = 'font-family: var(--font-title); line-height: 1.2; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: var(--cyan); margin-bottom: 12px;';

function shell(state, inner) {
  return `
<div class="scanlines" style="min-height: 100vh; background: linear-gradient(180deg, #090B10 0%, #0a1020 30%, #121828 100%);">
  ${renderHud(state)}
  ${inner}
</div>`;
}

function locked(state) {
  return shell(state, `
  <div style="display: flex; justify-content: center; padding: 80px 24px;">
    <div class="panel" style="padding: 40px 48px; text-align: center;">
      <div style="${MUTED}">The last job unlocks when the whole city is yours.</div>
      <div style="margin-top: 24px;"><a class="btn-secondary" href="#/city" style="display: inline-block; text-decoration: none;">BACK TO CITY</a></div>
    </div>
  </div>`);
}

// Simple's one sentence for each ghost screen.
export const GHOST_LEADS = {
  ghost: 'Last job: see what this game can see about you, then switch it off.',
  early: 'Going ghost switches off what this phone sends us. Read what it does first.',
};

// Simple: is step 1 done? THAT'S RIGHT was tapped, a place was picked, or there was nothing to
// confirm (sharing already off, or our analytics couldn't be reached): then step 2 shows.
export function ghostStepOneDone(view = {}) {
  const st = view.whoami?.status;
  return Boolean(view.whoamiConfirmed) || Boolean(getChosenPod()) || st === 'error' || st === 'local' || isAnalyticsOff();
}

// Simple's #/ghost (Liz 2026-11-21): Scout in short lines, "Step 1 of 2" as a bar that fills, and
// step 2 once step 1 is done. Until then step 2 waits behind See everything, never gone.
function simpleGhost(state, view) {
  const one = ghostStepOneDone(view);
  const step = one ? 2 : 1;
  const lines = GHOST_DIALOGUE.briefingSimple.map((l) => `<p style="margin: 0 0 8px;">${l}</p>`).join('');
  const stepTwo = (lit) => `
    <div class="panel" data-ghost-step="2" style="padding: 20px 24px; margin-top: ${lit ? 16 : 0}px;">
      ${lit ? '' : `<div style="${STEP}">Step 2: Turn us off</div>`}
            <p style="font-size: 15px; color: var(--offwhite); line-height: 1.6; margin: 0 0 18px;">${isAnalyticsOff() ? GHOST_DIALOGUE.alreadyOff : GHOST_DIALOGUE.whatHappens}</p>
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <button class="${lit ? 'btn-primary' : 'btn-secondary'}" data-action="go-ghost" style="min-height: 44px;">GO GHOST</button>
        <a class="btn-secondary" href="#/city" style="display: inline-flex; align-items: center; min-height: 44px; text-decoration: none;">NOT YET</a>
      </div>
    </div>`;
  return shell(state, `
  <div style="max-width: 640px; margin: 0 auto; padding: 18px 24px 0;">
    <div style="font-family: var(--font-title); line-height: 1.2; font-size: 28px; font-weight: 900; letter-spacing: 0.5px; color: var(--cyan); text-shadow: 0 0 24px rgba(0,229,255,0.5);">GO GHOST</div>
    ${simpleLead(GHOST_LEADS.ghost)}
    <div data-ghost-steps style="margin: 0 0 4px;">
      <div style="font-size: 15px; font-weight: 600; color: var(--offwhite); margin-bottom: 6px;">Step ${step} of 2${one ? ': Turn us off' : ': See what we can see'}</div>
      ${fillBar({ key: 'ghost:steps', done: step, total: 2, size: 'mid', label: `Step ${step} of 2` })}
    </div>
    ${renderWhoamiPanel(view, { primary: !one })}
    ${one ? stepTwo(true) : ''}
    <div data-ghost-lines style="display: flex; gap: 10px; align-items: flex-start; margin-top: 20px; font-size: 15px; line-height: 1.5; color: var(--offwhite);">${smallScout('thinkingB', 40)}<div>${lines}</div></div>
    ${one ? '' : seeEverything('ghost', stepTwo(false))}
  </div>`);
}

export function renderGhost(state, view = {}) {
  if (hasGoneGhost()) return renderGhostDone(state, view);
  if (!isCityComplete(state)) return locked(state);
  if (readLevel(state) === 'simplest') return simpleGhost(state, view);
  return shell(state, `
  <div style="text-align: center; padding: 44px 24px 0;">
    <div style="font-family: var(--font-title); line-height: 1.2; font-size: 10px; font-weight: 600; color: var(--lime); letter-spacing: 1px;">ONE LAST JOB</div>
    <div style="font-family: var(--font-title); line-height: 1.2; font-size: 48px; font-weight: 900; letter-spacing: 0.5px; color: var(--cyan); text-shadow: 0 0 30px rgba(0,229,255,0.5); margin-top: 12px;">GO GHOST</div>
  </div>
  <div style="max-width: 640px; margin: 24px auto 0; padding: 0 24px;">
    ${renderScout(GHOST_DIALOGUE.briefing, { feeling: 'thinkingB' })}
    <div style="${STEP} margin-top: 28px;">1 &middot; Look at what our analytics can see</div>
    ${renderWhoamiPanel(view)}
    <div class="panel" style="padding: 20px 24px; margin-top: 24px;">
      <div style="${STEP}">2 &middot; Turn us off</div>
      <p style="${MUTED} margin: 0 0 18px;">${isAnalyticsOff() ? GHOST_DIALOGUE.alreadyOff : GHOST_DIALOGUE.whatHappens}</p>
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <button class="btn-primary" data-action="go-ghost">GO GHOST</button>
        <a class="btn-secondary" href="#/city" style="display: inline-block; text-decoration: none;">NOT YET</a>
      </div>
    </div>
  </div>`);
}

// Going ghost before the city is taken back: tonight's run deletes what this
// browser sent, like turning sharing off, and counts one more ghost.
// What going ghost early does, before the button that does it: off-white, one line each.
function earlyBullets() {
  return `<ul data-ghost-early-what style="margin: 0; padding-left: 18px; font-size: 15px; line-height: 1.55; color: var(--offwhite);">${GHOST_DIALOGUE.earlyBullets.map((b) => `<li style="margin: 0 0 8px;">${b}</li>`).join('')}</ul>`;
}

export function renderGhostEarly(state, view = {}) {
  if (hasGoneGhost()) return renderGhostDone(state, view);
  if (isCityComplete(state)) return renderGhost(state, view);
  const off = isAnalyticsOff();
  const action = off
    ? ''
    : `<button class="btn-primary" data-action="go-ghost-early">GO GHOST NOW</button>`;
  return shell(state, `
  <div style="text-align: center; padding: 44px 24px 0;">
    <div style="font-family: var(--font-title); line-height: 1.2; font-size: 10px; font-weight: 600; color: var(--magenta); letter-spacing: 1px;">BEFORE THE CITY IS YOURS</div>
    <div style="font-family: var(--font-title); line-height: 1.2; font-size: 48px; font-weight: 900; letter-spacing: 0.5px; color: var(--cyan); text-shadow: 0 0 30px rgba(0,229,255,0.5); margin-top: 12px;">GO GHOST</div>
  </div>
  <div style="max-width: 640px; margin: 24px auto 0; padding: 0 24px;">
    ${readLevel(state) === 'simplest' ? simpleLead(GHOST_LEADS.early) : ''}
    <div class="panel" style="padding: 20px 24px; margin-top: 24px;">
      <div style="display: flex; gap: 10px; align-items: flex-start; margin: 0 0 18px;">
        ${smallScout('worried')}
        ${off ? `<p style="${MUTED} margin: 0;">${GHOST_DIALOGUE.alreadyOff}</p>` : earlyBullets()}
      </div>
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        ${action}
        <a class="btn-secondary" href="#/city-together" style="display: inline-block; text-decoration: none;">NOT YET</a>
      </div>
    </div>
  </div>`);
}

// Tonight's run counts a went-ghost event. If the published file is already
// newer than the player's ghost moment it includes them; otherwise add one.
// Unparseable dates: add one.
function plusOne(c, info) {
  const asOf = Date.parse(c.asOf);
  const at = Date.parse(info?.at);
  if (Number.isNaN(asOf) || Number.isNaN(at)) return 1;
  return at > asOf ? 1 : 0;
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Early ghosts are counted city-wide only: their pod rows are deleted.
function earlyLine(c, info) {
  if (!isGhostPending(info, c)) return esc(GHOST_DIALOGUE.wentThrough);
  const base = `Tomorrow your missions leave the city's totals.`;
  if (!c || !isNum(c.city?.ghosts)) return esc(base);
  return esc(`${base} You'll be one of ${fmt(c.city.ghosts + plusOne(c, info))} ghosts.`);
}

function countsLine(view, info) {
  if (info?.silent) return GHOST_DIALOGUE.alreadyOff;
  const c = view.collective?.status === 'ready' ? view.collective.data : null;
  if (info?.early) return earlyLine(c, info);
  if (!c || !isNum(c.city?.ghosts)) return `You're the newest ghost in the city.`;
  const extra = plusOne(c, info);
  const cityPart = `${fmt(c.city.ghosts + extra)} across the city`;
  const podId = displayPodId(c, view.whoami?.status === 'ready' ? view.whoami.data : null);
  const pod = findPod(c, podId);
  if (pod && isNum(pod.ghosts)) {
    return `You're one of ${fmt(pod.ghosts + extra)} in ${esc(pod.label)} and ${cityPart}.`;
  }
  return `You're one of ${cityPart}.`;
}

export function renderGhostDone(state, view = {}) {
  if (!hasGoneGhost()) return renderGhost(state, view);
  const info = getGhostInfo();
  return shell(state, `
  <div style="text-align: center; padding: 56px 24px 0;">
    <div style="font-family: var(--font-title); line-height: 1.2; font-size: 44px; font-weight: 900; letter-spacing: 0.5px; color: var(--cyan); text-shadow: 0 0 30px rgba(0,229,255,0.5);">YOU HAVE GONE GHOST</div>
    ${readLevel(state) === 'simplest' ? `<p class="simple-lead" data-simple-lead style="margin-top: 16px;">${countsLine(view, info)}</p>` : `<div style="${MUTED} margin-top: 16px;">${countsLine(view, info)}</div>`}
  </div>
  <div style="max-width: 640px; margin: 32px auto 0; padding: 0 24px;">
    ${renderScout(info?.early ? GHOST_DIALOGUE.doneEarly : GHOST_DIALOGUE.done, { feeling: feelingForGhostDone(info) })}
    ${renderDeletionBlock(view.collective)}
    ${renderNotice(view.notice)}
    <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 28px;">
      <a class="btn-primary" href="#/city" style="display: inline-block; text-decoration: none;">BACK TO YOUR CITY</a>
      <a class="btn-secondary" href="#/city-together" style="display: inline-block; text-decoration: none;">THE WHOLE CITY</a>
    </div>
  </div>`);
}
