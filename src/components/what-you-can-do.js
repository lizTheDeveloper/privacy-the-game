// "What you can do" (Liz 2026-11-20, "Do it"): the explainers (a badge's page, PRISM, the government
// map, the Whole City) used to end at their sources. Now each ends with up to three missions: the
// ones the player hasn't done first, each button saying what it opens. Pure: (state, ids) in, markup
// out. Which missions are done is read from the save and never sent anywhere.
import { MISSIONS, missionDistrict } from '../data/missions.js';
import { isMissionInPlay, isMissionDoneIn } from '../utils/mission-status.js';
import { DISTRICTS } from '../data/districts.js';
import { readLevel, plainWords } from '../utils/reading.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));
export const missionById = (id) => BY_ID.get(id) ?? null;

const hasCar = (state) => Array.isArray(state?.vehicles) && state.vehicles.length > 0;

// The rows to show, best first: { kind: 'mission', mission, done } or { kind: 'garage', missions }.
// A mission out of play is left out, except a Freeway one for a player with no car yet: those become
// one "Add your car in the Garage first" row. Undone first; at most `max`.
export function actionRows(state, ids, max = 3) {
  const rows = [];
  let garage = null;
  for (const id of ids) {
    const m = BY_ID.get(id);
    if (!m || m.legacy) continue;
    if (isMissionInPlay(state, m)) {
      rows.push({ kind: 'mission', mission: m, done: isMissionDoneIn(state, m) });
    } else if (missionDistrict(m) === 'freeway' && !hasCar(state)) {
      if (!garage) { garage = { kind: 'garage', missions: [], done: false }; rows.push(garage); }
      garage.missions.push(m);
    }
  }
  const undone = rows.filter((r) => !r.done);
  const done = rows.filter((r) => r.done);
  return [...undone, ...done].slice(0, max);
}

// Where it is, too: two districts can each have an "Opt Out: LexisNexis".
const districtName = (m) => DISTRICTS.find((d) => d.id === missionDistrict(m))?.name ?? '';
// named: the mission's name as the screen says it (Simple: plainWords, so 2FA is Two-step sign-in).
const asIs = (m) => m.title;
const opensMission = (m, again = false, named = asIs) => `Opens the “${esc(named(m))}” mission${again ? ' again' : ''}${districtName(m) ? `, in ${esc(districtName(m))}` : ''}`;

function row(r, cls, named = asIs) {
  if (r.kind === 'garage') {
    const names = r.missions.slice(0, 2).map((m) => `“${esc(named(m))}”`).join(' and ');
    const more = r.missions.length > 2 ? ` and ${r.missions.length - 2} more` : '';
    return `<li><a class="${cls} wycd-go" data-wycd-garage href="#/garage"><span class="wycd-name">Add your car in the Garage first ›</span>`
      + `<span class="wycd-opens">Opens the Garage. Add a car and The Freeway opens, with ${names}${more}.</span></a></li>`;
  }
  const m = r.mission;
  if (r.done) {
    return `<li><a class="wycd-done" data-wycd-mission="${esc(m.id)}" href="#/mission/${esc(m.id)}/briefing"><span class="wycd-name">✓ ${esc(named(m))}</span>`
      + `<span class="wycd-opens">Done. ${opensMission(m, true, named)}.</span></a></li>`;
  }
  return `<li><a class="${cls} wycd-go" data-wycd-mission="${esc(m.id)}" href="#/mission/${esc(m.id)}/briefing"><span class="wycd-name">${esc(named(m))} ›</span>`
    + `<span class="wycd-opens">${opensMission(m, false, named)}.</span></a></li>`;
}

// ids: candidate mission ids, best first. primary: the first undone row is the page's one bright
// button (false when the screen already has one). lede: one line above the buttons. label: the
// panel's heading (PRISM puts its rows under its own heading, so it passes '').
export function whatYouCanDo(state, ids, { primary = true, lede = '', label = 'WHAT YOU CAN DO', className = '' } = {}) {
  const rows = actionRows(state, ids);
  if (!rows.length) return '';
  const named = readLevel(state) === 'simplest' ? (m) => plainWords(m.title) : asIs;
  const allDone = rows.every((r) => r.done);
  let lit = !primary;
  const items = rows.map((r) => {
    const cls = !lit && !r.done ? 'btn-primary' : 'btn-secondary';
    if (cls === 'btn-primary') lit = true;
    return row(r, cls, named);
  }).join('');
  const head = label ? `<div class="wycd-label">${esc(label)}</div>` : '';
  const said = allDone ? '<p class="wycd-lede wycd-all-done">You’ve done these ✓</p>' : lede ? `<p class="wycd-lede">${esc(lede)}</p>` : '';
  return `<section class="wycd${className ? ` ${className}` : ''}" data-what-you-can-do>${WYCD_CSS}${head}${said}<ul class="wycd-list">${items}</ul></section>`;
}

export const WYCD_CSS = `<style>
.wycd{margin-top:14px;padding:14px 16px;background:rgba(26,31,43,0.5);border:1px solid rgba(0,229,255,0.3);border-left:3px solid var(--cyan);color:var(--offwhite)}
.wycd--inline{margin-top:14px;padding:12px 0 0;background:none;border:0;border-top:1px solid rgba(255,255,255,0.08)}
.wycd-label{font-family:var(--font-title);line-height:1.2;font-size:11px;font-weight:700;letter-spacing:1px;color:var(--cyan);margin-bottom:6px}
.wycd-lede{margin:0 0 10px;font-size:15px;line-height:1.5;color:var(--offwhite)}
.wycd-all-done{color:var(--lime);font-weight:700}
.wycd-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.wycd .wycd-go,.wycd .wycd-done{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:44px;box-sizing:border-box;padding:10px 14px;text-align:left;text-decoration:none;letter-spacing:0;overflow-wrap:anywhere}
.wycd .wycd-name{font-family:var(--font-title);line-height:1.2;font-size:13px;font-weight:700;letter-spacing:0.5px}
.wycd .wycd-opens{font-family:var(--font-body,system-ui,sans-serif);font-size:14px;font-weight:500;letter-spacing:0;text-transform:none}
.wycd a.btn-primary,.wycd a.btn-primary .wycd-opens{color:#090B10}
.wycd a.btn-secondary{color:var(--offwhite)}
.wycd a.btn-secondary .wycd-name{color:var(--cyan)}
.wycd .wycd-done{color:var(--offwhite);border:1px solid rgba(198,255,0,0.45);background:rgba(198,255,0,0.05)}
.wycd .wycd-done .wycd-name{color:var(--lime)}
</style>`;
