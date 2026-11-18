import { renderHud } from '../components/hud.js';
import { renderScout } from '../components/scout.js';
import { findMission } from '../data/custom-missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { nextAvailableMission } from './city-map.js';
import { notMineButton } from './briefing.js';
import { missionsInProgress, visibleSteps, progressFor, intelFor } from '../utils/reading.js';
import { esc } from './stats.js';

// Simple mode's "What's next" (Liz 2026-11-18: "it just dumps you in the master keys and you're
// suddenly in recon again … make it really clear for the simple mode what we're doing next …
// card by card, and just assume we're going to lose people and that we're coming back").
// One card: what just happened (a report sent, an account taken off the list), then the one
// thing to do next, and that the game will be here when they come back.
// filed: { id, reaction } right after a report; notMine: an account id just taken off the list.

// "Breach Recon: Gmail" is "Gmail" in Simple mode, as on its briefing.
export function simpleTitle(mission) {
  const colon = mission.title.indexOf(':');
  return colon > -1 ? mission.title.slice(colon + 1).trim() : mission.title;
}

// The mission to show, and how: half-done first (so nobody loses their place), then the next one.
export function nextUp(state) {
  for (const id of missionsInProgress(state, (rec) => Boolean(rec?.status))) {
    const mission = findMission(state, id);
    if (!mission) continue;
    const progress = progressFor(state, id, visibleSteps(mission, state, 'simplest'));
    if (progress.handled) return { mission, progress, kind: 'resume' };
  }
  const mission = nextAvailableMission(state);
  return mission ? { mission, progress: null, kind: 'next' } : null;
}

function nextCard(state, up, first) {
  if (!up) {
    return `<section class="next-card" data-next-card="done">
      <div class="next-label">ALL DONE</div>
      <h1 class="focus-title"><span class="focus-title-main">You did every mission.</span></h1>
      <p class="focus-lead">The city is yours again.</p>
      <a class="btn-primary focus-go" href="#/stats">SEE WHAT YOU DID &#9654;</a>
    </section>`;
  }
  const { mission, progress, kind } = up;
  const href = `#/mission/${mission.id}/briefing`;
  const steps = visibleSteps(mission, state, 'simplest').length;
  const label = kind === 'resume' ? 'KEEP GOING' : first ? 'YOUR FIRST MISSION' : 'NEXT';
  const meta = kind === 'resume'
    ? (progress.current === -1 ? 'You did all the steps. Now tell Scout what you found.' : `You were on step ${progress.current + 1} of ${progress.total}.`)
    : `${steps > 1 ? `${steps} steps · ` : ''}about ${mission.estimatedMinutes} min`;
  const go = kind === 'resume' ? 'KEEP GOING' : 'START';
  return `<section class="next-card" data-next-card="${kind}" data-mission="${mission.id}">
      <div class="next-label">${label}</div>
      <h1 class="focus-title"><span class="focus-title-main">${simpleTitle(mission)}</span></h1>
      <p class="focus-lead">${intelFor(mission, 'simplest').intel}</p>
      <p class="next-meta">${meta}</p>
      <div class="focus-actions">
        <a class="btn-primary focus-go" href="${href}">${go} &#9654;</a>
        ${kind === 'next' ? notMineButton(state, mission, '#/next') : ''}
      </div>
    </section>`;
}

export function renderNext(state, { filed = null, notMine = null } = {}) {
  const up = nextUp(state);
  const anyDone = Object.values(state.missions || {}).some((m) => m?.status);
  const sent = filed && state.missions?.[filed.id]?.status
    ? `<div class="next-sent" data-next-sent>
        <div class="next-sent-head">&#10003; Sent to Scout</div>
        ${filed.reaction ? renderScout(filed.reaction.line, { feeling: filed.reaction.feeling }) : ''}
      </div>`
    : '';
  const account = notMine && ACCOUNTS[notMine];
  const dropped = account && state.accounts?.[notMine]?.enabled === false
    ? `<div class="next-sent" data-not-mine>
        ${renderScout(`Got it. I took ${esc(account.name)} off your list.`, { feeling: 'happy' })}
        <button class="btn-secondary next-undo" data-action="toggle-account" data-account="${notMine}">Put ${esc(account.name)} back</button>
      </div>`
    : '';
  return `
  <div class="brief brief-focus brief-simple next-page scanlines" style="min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    ${renderHud(state, { nextLink: false })}
    <div class="focus-col">
      ${sent}${dropped}
      ${nextCard(state, up, !anyDone && !sent)}
      <p class="next-saved">Your progress is saved on this phone. You can stop and come back any time. This page will show you what's next.</p>
      <a class="focus-notnow next-city" href="#/city">See the whole city</a>
    </div>
  </div>`;
}
