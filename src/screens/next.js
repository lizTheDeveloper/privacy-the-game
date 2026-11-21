import { renderHud } from '../components/hud.js';
import { renderScout } from '../components/scout.js';
import { findMission } from '../data/custom-missions.js';
import { ACCOUNTS } from '../data/accounts.js';
import { nextAvailableMission } from './city-map.js';
import { notMineButton } from './briefing.js';
import { missionsInProgress, visibleSteps, progressFor, intelFor } from '../utils/reading.js';
import { esc } from './stats.js';
import { fillBar } from '../components/fill-bar.js';
import { confetti } from '../components/celebrate.js';
import { missionDistrict } from '../data/missions.js';
import { calcChapterProgress } from '../utils/calc.js';
import { saveNote } from '../components/browser-warning.js';

// Good news gets confetti (Liz 2026-11-18: "a little bit more celebration when things are good").
const GOOD = new Set(['happy', 'proud', 'hug']);

// The district's bar, filling from where it was: security as a process, one mission at a time.
// It counts the part of the district the player is in, not the whole district (Liz 2026-11-18:
// "yes, make the district bar count the current chapter only"), so one mission moves it a lot.
// Each part has its own bar key, so a new part fills from empty. filedId: the report just filed.
function districtBar(state, districtId, filedId) {
  const p = calcChapterProgress(state, districtId, { missionId: filedId });
  if (!p?.total) return '';
  const caption = !p.done
    ? 'Security is a process. Every mission fills this a little more.'
    : p.next
      ? `Part ${p.chapter} done! Next: part ${p.next.chapter}, ${esc(p.next.name.toLowerCase())}.`
      : 'All done here. You took it back.';
  return `<div class="next-progress" data-next-progress data-chapter="${p.chapter}"${p.done ? ' data-chapter-done' : ''}>
      <div class="fill-title">${esc(p.label)}</div>
      <div class="fill-name">${esc(p.name)}</div>
      ${fillBar({ key: `chapter:${districtId}:${p.chapter}`, done: p.completed, total: p.total, size: 'big', label: `${p.completed} of ${p.total} done` })}
      <p class="fill-caption">${caption}</p>
    </div>`;
}

// The bar counts the part the card's mission is in, so the two say the same thing (Liz's layout
// audit, 2026-11-20: the bar said "Part 1 · Check your accounts" over "Give your bank a new
// password"). Right after a report, it is the report's part, when the card is in the same district.
export function barMission(state, filed, up) {
  const filedMission = filed?.id ? findMission(state, filed.id) : null;
  if (filedMission) return filedMission.id;
  return up?.mission?.id || null;
}

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
  // Bars, not numbers (Liz 2026-11-18): how far along, or how long it is.
  const meta = kind === 'resume'
    ? (progress.current === -1
      ? 'You did all the steps. Now tell Scout what you found.'
      : `${fillBar({ key: `steps:${mission.id}`, done: progress.handled, total: progress.total, size: 'big', label: `Step ${progress.current + 1} of ${progress.total}` })}Pick up where you left off.`)
    : `${steps > 1 ? fillBar({ key: `steps:${mission.id}`, done: 0, total: steps, label: `${steps} steps` }) : ''}About ${mission.estimatedMinutes} min`;
  const go = kind === 'resume' ? 'KEEP GOING' : 'START';
  return `<section class="next-card" data-next-card="${kind}" data-mission="${mission.id}">
      <div class="next-label">${label}</div>
      <h1 class="focus-title"><span class="focus-title-main">${simpleTitle(mission)}</span></h1>
      <p class="focus-lead">${intelFor(mission, 'simplest').intel}</p>
      <div class="next-meta">${meta}</div>
      <div class="focus-actions">
        <a class="btn-primary focus-go" href="${href}">${go} &#9654;</a>
        ${kind === 'next' ? notMineButton(state, mission, '#/next') : ''}
      </div>
    </section>`;
}

export function renderNext(state, { filed = null, notMine = null } = {}) {
  const up = nextUp(state);
  const anyDone = Object.values(state.missions || {}).some((m) => m?.status);
  const good = Boolean(filed && GOOD.has(filed.reaction?.feeling));
  const sent = filed && state.missions?.[filed.id]?.status
    ? `<div class="next-sent" data-next-sent${good ? ' data-celebrate' : ''}>
        ${good ? `${confetti()}<div class="next-cheer celebrate-pop">Nice work!</div>` : ''}
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
      ${districtBar(state, missionDistrict(findMission(state, filed?.id) || up?.mission || {}) || '', barMission(state, filed, up))}
      ${nextCard(state, up, !anyDone && !sent)}
      <p class="next-saved">${saveNote('next')} This page will show you what's next.</p>
      <a class="focus-notnow next-city" href="#/city">See the whole city</a>
    </div>
  </div>`;
}
