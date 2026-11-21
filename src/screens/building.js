// A building's interior: a cutaway of its floors, top to bottom. Roof (the
// player's own health check), the ground-floor entries, a saint's alcove, and
// the company's records desk. Spec: docs/superpowers/specs/2026-10-20-building-interiors-design.md
// Liz 2026-11-20 ("the open door first and lit"): the first door still open starts unfolded and
// its SEAL IT is the screen's one bright button; the desk moved to the bottom. In Simple mode the
// count is a filling bar, and the desk, the alcove and the notes wait under "More about this building".
import { prismTag, prismTagCount } from '../components/prism-tag.js';
import { fillBar } from '../components/fill-bar.js';
import { readLevel } from '../utils/reading.js';
import { simpleLead } from '../components/see-everything.js';
import { ACCOUNTS } from '../data/accounts.js';
import { DISTRICTS } from '../data/districts.js';
import { MISSIONS } from '../data/missions.js';
import { getInterior } from '../data/interiors/index.js';
import { SAINTS } from '../data/interiors/saints.js';
import { renderHud } from '../components/hud.js';
import { checkupRows, entryState, sealedCount, recordDate, freshness, currentTwoFactor } from '../utils/interior.js';
import { isMissionDoneIn, isMissionAvailable } from '../utils/mission-status.js';
import { canRecheck } from '../utils/debrief.js';
import { renderScout } from '../components/scout.js';
import { INTERIOR_LINES, pick } from '../data/dialogue.js';
import { renderCandle } from './saints.js';
import { devicesOf, isFloorOpen, floorChoice, newlySealed, interiorLineKind, controllableProgress, firstUnsealedEntry } from '../utils/interior-state.js';

const DAY = 864e5;
const LIT = { ok: 4, warn: 2, crit: 1, 'not-checked': 0 };
const DIM = { fresh: 1, aging: 0.6, stale: 0.35, unknown: 0.35 };
const ICON = { sealed: '🔒', open: '◇', beyond: '◌', 'not-checked': '?' };
// Simple mode says each roof row's status in words, before the antenna bars.
const STATUS_WORD = { ok: 'Good', warn: 'Could be better', crit: 'Needs fixing', 'not-checked': 'Not checked' };
// The door a roof row's fix closes, by the entries' rules (in order of preference).
const ROW_RULES = {
  password: ['password-unique'],
  leak: ['password-unique'],
  'two-factor': ['sim-swap', 'phishing'],
  reglock: ['reglock'],
  devices: ['devices'],
};
const STATE_LABEL = { sealed: 'Sealed', open: 'Open', beyond: 'Beyond your control', 'not-checked': 'Not checked yet' };
const METAPHOR = {
  'front-door': 'Front door',
  'phone-line': 'Phone line',
  'mail-slot': 'Mail slot',
  'back-room': 'Back room',
  vents: 'Vents',
  number: 'Phone number',
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const missionById = (id) => MISSIONS.find((m) => m.id === id);
const briefingHref = (id) => `#/mission/${esc(id)}/briefing`;
const recheckHref = (id) => `#/mission/${esc(id)}/recheck`;

function sourceLinks(sources = []) {
  if (!sources.length) return '';
  return `<details class="interior-sources"><summary>SOURCES · ${sources.length}</summary>${sources
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`)
    .join('')}</details>`;
}

// Floors remember whether the player folded them (state.interior[id].floors). The desk and
// alcove, never touched, start folded on a phone and open from 900px (data-open-desktop, set by
// script); the roof and the ground floor (where the doors are) start open.
// Simple's roof folds on a phone too (opts.phoneFolded), its head saying how it is ("2 need fixing").
const PHONE_FOLDED = new Set(['desk', 'alcove']);
function floor(ctx, kind, title, body, { phoneFolded = PHONE_FOLDED.has(kind), headNote = '' } = {}) {
  const unset = phoneFolded && floorChoice(ctx.state, ctx.accountId, kind) === undefined;
  // An entry sealing right now is seen: its floor opens at every width (not saved).
  const sealingHere = kind === 'ground' && ctx.sealing?.size > 0;
  const open = unset && !sealingHere ? ' data-open-desktop' : unset || isFloorOpen(ctx.state, ctx.accountId, kind) ? ' open' : '';
  return `
    <details class="floor floor--${kind}"${open} data-floor="${kind}">
      <summary class="floor-head"><span>${title}</span>${headNote}<span class="floor-chev" aria-hidden="true">▾</span></summary>
      <div class="floor-body">${body}</div>
    </details>`;
}

// The completed record behind a mission (or the old one it replaces).
function filedRecord(state, id) {
  const own = state.missions?.[id];
  if (own?.status === 'completed') return own;
  const old = missionById(id)?.replaces;
  return old && state.missions?.[old]?.status === 'completed' ? state.missions[old] : null;
}

// The mission a re-check refreshes: this one when it is filed as completed,
// else the old mission it replaces (Facebook's breach check). null when
// neither can be re-checked.
function recheckableId(state, mission) {
  if (!mission || !canRecheck(mission)) return null;
  if (state.missions?.[mission.id]?.status === 'completed') return mission.id;
  const old = mission.replaces ? missionById(mission.replaces) : null;
  return old && canRecheck(old) && state.missions?.[old.id]?.status === 'completed' ? old.id : null;
}

// LAST SWEEP: the newest dated filing behind the roof rows.
function lastSweep(state, rows, now) {
  let filed = false;
  let newest = null;
  for (const id of new Set(rows.map((r) => r.missionId).filter(Boolean))) {
    const rec = filedRecord(state, id);
    if (!rec) continue;
    filed = true;
    const t = Date.parse(recordDate(rec));
    if (!Number.isNaN(t) && (newest === null || t > newest)) newest = t;
  }
  if (!filed) return null;
  if (newest === null) return { text: 'date unknown', fresh: 'unknown' };
  const days = Math.max(0, Math.floor((now.getTime() - newest) / DAY));
  return { text: days === 0 ? 'today' : `${days}d`, fresh: freshness(new Date(newest).toISOString(), now) };
}

function meter(state, accountId, rows, now) {
  const { sealed, total } = sealedCount(state, accountId);
  const sweep = lastSweep(state, rows, now);
  const count = total === 0 ? '<span>NO ENTRIES CHECKED YET</span>' : `<span>ENTRIES SEALED <b>${sealed}/${total}</b></span>`;
  const age = sweep ? `<span class="dim">·</span><span>LAST SWEEP <b class="fresh-${sweep.fresh}">${esc(sweep.text)}</b></span>` : '';
  return `<div class="interior-meter">${count}${age}</div>`;
}

// Simple mode: the count in words, and beside it the doors as a bar that fills.
function doorBar(state, accountId) {
  const { sealed, controllable } = controllableProgress(state, accountId);
  const words = `${sealed} of ${controllable} ${controllable === 1 ? 'door' : 'doors'} locked`;
  return `<div class="interior-doors">
      <div class="interior-doors-words">${esc(words)}</div>
      ${fillBar({ key: `building:${accountId}`, done: sealed, total: controllable, size: 'mid', label: words })}
    </div>`;
}

// The badges for every leak that names this building. Advanced: under the count, each 44px tall.
// Simple: one chip that opens to them ("9 leaks name Facebook ›").
function leakBadges(accountId, account, simple) {
  const n = prismTagCount(accountId);
  if (!n) return '';
  // Simple: the plain names (NSA CABLE TAP, TAPPED GOOGLE & YAHOO), not the code names.
  const badges = `<div class="interior-tags">${prismTag(accountId, { tall: true, simple })}</div>`;
  if (!simple) return badges;
  const name = account.name.replace(/\s+(Login|Account)$/i, '');
  return `<details class="leak-chip" data-fold="leaks-${esc(accountId)}"><summary>${n} ${n === 1 ? 'leak names' : 'leaks name'} ${esc(name)} <span aria-hidden="true">›</span></summary>${badges}</details>`;
}

// A roof row's action: a row at warn or crit gets "Fix it" (to the door it closes; only the worst
// one lit, and only when no SEAL IT is); a healthy row a quiet "Check again"; an unchecked one START.
function roofRow(state, row, { fix = null, lit = false, simple = false } = {}) {
  const lit4 = LIT[row.status] ?? 0;
  const checked = row.status !== 'not-checked';
  const bars = [0, 1, 2, 3].map((i) => `<span class="bar${i < lit4 ? ' on' : ''}"></span>`).join('');
  const mission = row.missionId ? missionById(row.missionId) : null;
  const sweepId = checked ? recheckableId(state, mission) : null;
  const bad = row.status === 'warn' || row.status === 'crit';
  let action = '';
  if (bad) {
    const href = fix?.href ?? (sweepId ? recheckHref(sweepId) : mission ? briefingHref(mission.id) : null);
    if (href) action = `<a class="interior-btn ${lit ? 'btn-primary' : 'interior-btn--quiet btn-secondary'} ant-fix" href="${href}">Fix it</a>`;
  } else if (sweepId) action = `<a class="ant-again" href="${recheckHref(sweepId)}">Check again</a>`;
  else if (mission) action = `<a class="interior-btn interior-btn--quiet" href="${briefingHref(mission.id)}">START</a>`;
  // A skipped filing ("I'll come back") never had a date to lose.
  const when = checked && row.freshness === 'unknown' && row.missionId && filedRecord(state, row.missionId) ? '<span class="dim"> · date unknown</span>' : '';
  const word = simple ? `<span class="ant-word ant-word--${esc(row.status)}">${STATUS_WORD[row.status] ?? 'Not checked'}</span>` : '';
  return `
        <div class="ant-row" data-row="${esc(row.id)}" data-status="${esc(row.status)}" data-fresh="${esc(row.freshness)}">
          <span class="ant-label">${esc(row.label)}${when}</span>
          <span class="ant-status">${word}<span class="ant-bars ant-bars--${esc(row.status)}" style="opacity: ${DIM[row.freshness] ?? 0.35};" aria-label="${lit4} of 4 bars">${bars}</span></span>
          ${action}
        </div><!-- /row -->`;
}

// The player's own list of where they are signed in. Stays on this device.
function deviceList(state, accountId) {
  const list = devicesOf(state, accountId);
  const items = list.length
    ? list.map((d, i) => `
        <li class="device"><span class="device-name">${esc(d)}</span><button type="button" class="device-x" data-action="remove-device" data-building="${esc(accountId)}" data-index="${i}" aria-label="Remove ${esc(d)}">×</button></li>`).join('')
    : '<li class="device dim">not listed</li>';
  // On a phone the list waits behind "Your devices"; from 900px it shows as it always did.
  return `
      <div class="devices" data-devices>
        <details class="phone-fold devices-fold" data-fold="devices-${esc(accountId)}" data-open-desktop><summary>Your devices</summary>
        <div class="devices-title desktop-only">Your devices</div>
        <ul class="devices-list">${items}</ul>
        <div class="devices-add">
          <input class="devices-input" type="text" maxlength="40" autocomplete="off" data-device-input aria-label="Add a device" placeholder="e.g. old tablet">
          <button type="button" class="interior-btn interior-btn--quiet" data-action="add-device" data-building="${esc(accountId)}">ADD</button>
        </div>
        <div class="dim interior-note">Kept on this phone only. Nothing here is sent anywhere.</div>
        </details>
      </div>`;
}

function antennaNote(accountId, simple = false) {
  return `<details class="phone-fold" data-fold="antenna-${esc(accountId)}" data-open-desktop><summary>Why antennas fade</summary><div class="dim interior-note">The antennas fade as your last check gets older. A fresh ${simple ? 'check' : 'sweep'} lights them back up.</div></details>`;
}

// Simple's roof in one line: the worst news first. Rows at warn or crit each have a Fix it.
export function roofSummary(rows) {
  const bad = rows.filter((r) => r.status === 'crit' || r.status === 'warn').length;
  if (bad) return { text: `${bad} ${bad === 1 ? 'needs' : 'need'} fixing`, tone: rows.some((r) => r.status === 'crit') ? 'crit' : 'warn' };
  const unchecked = rows.filter((r) => r.status === 'not-checked').length;
  if (unchecked) return { text: `${unchecked} not checked`, tone: 'not-checked' };
  return { text: 'All good', tone: 'ok' };
}

// "Health check", not "Signal check": Signal is also an app in the city.
// Simple: on a phone the roof is one line ("▲ Roof · Health check   2 need fixing ▾") and its rows
// are one tap away, so the first open door's SEAL IT sits on the first screen. When a roof row's
// Fix it is the screen's one bright button, the roof starts open instead.
function roof(ctx, rows, plan) {
  const { state, accountId, simple } = ctx;
  const body = rows.map((r) => roofRow(state, r, { fix: plan.fixes.get(r.id), lit: plan.litRow === r.id, simple })).join('');
  const sum = simple ? roofSummary(rows) : null;
  return floor(ctx, 'roof', '▲ Roof · Health check', `
      <div class="ant${simple ? ' ant--simple' : ''}">${body}</div>
      ${simple ? '' : `${deviceList(state, accountId)}
      ${antennaNote(accountId)}`}`, simple ? {
    phoneFolded: !plan.litRow,
    headNote: `<span class="roof-sum roof-sum--${sum.tone}" data-roof-sum>${esc(sum.text)}</span>`,
  } : {});
}

// The desk table's last column: whether a judge signs off. Each part is a whole
// sentence of the slip, quoted as it stands: its scope ("what you actually wrote"),
// hedges and attributions included ("may", "Proton says", "Yahoo lists"). A slip
// that doesn't say gets a dash.
const JUDGE = [
  /A 2703\(d\) court order adds [^.]*\./,
  /To force [^.]*, police need a search warrant signed by a judge\./,
  /Yahoo lists a search warrant, signed by a judge, [^.]*\./,
  /Meta requires a search warrant, signed by a judge, [^.]*\./,
  /An emergency request needs no judge at all[^.]*\./,
  /^Everything on the police slip, plus National Security Letters: [^.]*\./,
  /No warrant is needed for each one\./,
  /Its 2026 status is unsettled: [^.]*court-approved certifications[^.]*\./,
  /A subpoena signed by an agency official, not a judge\./,
  /Since October 2022, [^.]*may answer without a US court being involved\./,
  /Subject lines aren’t end-to-end encrypted, and Proton says reaching them takes an order approved by a Swiss judge\./,
];

export function judgeCell(lane) {
  const said = JUDGE.map((re) => lane.gets.match(re)?.[0]).filter(Boolean);
  return said.length ? said.join(' · ') : '—';
}

function slipBody(lane) {
  return `${lane.actorNote ? `<div class="dim slip-note">${esc(lane.actorNote)}</div>` : ''}
        <div class="slip-gets">${esc(lane.gets)}</div>
        ${sourceLinks(lane.sources)}`;
}

// On a phone the slips are one table: who asks, with what, and whether a judge
// signs; each row's full slip opens under it. At 900px and up, the slips as before.
function deskTable(accountId, lanes) {
  const rows = lanes.map((lane) => `
        <tbody data-desk-row="${esc(lane.id)}">
          <tr><th scope="row" class="desk-cell desk-who">${esc(lane.actor)}</th><td class="desk-cell desk-tool">${esc(lane.tool)}</td><td class="desk-cell desk-judge">${esc(judgeCell(lane))}</td></tr>
          <tr><td colspan="3" class="desk-more-cell"><details class="desk-more" data-fold="desk-${esc(accountId)}-${esc(lane.id)}"><summary>The full slip</summary>${slipBody(lane)}</details></td></tr>
        </tbody>`).join('');
  return `
      <table class="desk-table">
        <thead><tr><th scope="col">Who asks</th><th scope="col">With what</th><th scope="col">Judge needed?</th></tr></thead>${rows}
      </table>`;
}

function desk(ctx, interior) {
  const slips = interior.desk.map((lane) => `
      <div class="slip" data-lane="${esc(lane.id)}">
        <div class="slip-stamp">${esc(lane.tool)}</div>
        <div class="slip-who">${esc(lane.actor)}</div>
        ${slipBody(lane)}
      </div>`).join('');
  // A desk with one lane (Signal's) is a single sticky note, not a stack of slips.
  const single = interior.desk.length === 1;
  return floor(ctx, 'desk', `▣ Records desk · ${esc(interior.company)}’s`, `
      <div class="dim interior-note">${esc(interior.deskIntro)}</div>
      ${single ? '' : deskTable(ctx.accountId, interior.desk)}
      <div class="desk${single ? ' desk--note' : ' desk--tabled'}">${slips}</div>`);
}

// Where SEAL IT (or START) goes: { href, recheck }, or null for no button.
//  - the mission is available and not done yet: its briefing;
//  - it is filed and can be re-checked: its re-check (a new answer there,
//    like a passkey, seals the entry);
//  - otherwise no button, just the fix.
// The 2FA upgrade only unlocks after the base 2FA mission is filed with text
// or email codes. When it is locked or done: the base mission while that is
// not filed, else the mission that records the current method.
function entryTarget(state, accountId, entry) {
  let mission = missionById(entry.fixMission);
  if (!mission) return null;
  if (mission.id === `${accountId}-fortify-2fa-upgrade`) {
    if (isMissionAvailable(state, mission) && !isMissionDoneIn(state, mission)) return { href: briefingHref(mission.id), recheck: false };
    const base = missionById(`${accountId}-fortify-2fa`);
    mission = base && !isMissionDoneIn(state, base) ? base : missionById(currentTwoFactor(state, accountId).missionId ?? base?.id);
    if (!mission) return null;
  }
  if (!isMissionDoneIn(state, mission)) return isMissionAvailable(state, mission) ? { href: briefingHref(mission.id), recheck: false } : null;
  const id = recheckableId(state, mission);
  return id ? { href: recheckHref(id), recheck: true } : null;
}

function actorLines(actor) {
  return String(actor).split(' · ').map((a) => `<span class="entry-actor">${esc(a)}</span>`).join('');
}

// first: the first door still to close, unfolded at every width; lit: its button is the screen's
// one bright button. Every other SEAL IT is outlined.
function entry(state, accountId, e, sealing, { first: isFirst = false, lit = false } = {}) {
  const s = entryState(state, accountId, e);
  const target = entryTarget(state, accountId, e);
  const filled = lit ? 'interior-btn btn-primary' : 'interior-btn interior-btn--quiet btn-secondary';
  let status = '';
  if (s.state === 'sealed') {
    status = `<div class="ok">Sealed.</div>${s.note ? `<div class="dim">${esc(s.note)}</div>` : ''}`;
  } else if (s.state === 'open') {
    status = `${e.fix ? `<div class="entry-fix">${esc(e.fix)}</div>` : ''}${target ? `<a class="${filled}" href="${target.href}">${target.recheck ? 'SEAL IT ▸ RE-CHECK' : 'SEAL IT ▸'}</a>` : ''}`;
  } else if (s.state === 'beyond') {
    status = `<div class="dim">Beyond your control.${e.narrows ? ` ${esc(e.narrows)}` : ''}</div>`;
  } else {
    status = `<div class="dim">Not checked yet.</div>${e.fix ? `<div class="entry-fix">${esc(e.fix)}</div>` : ''}${target ? `<a class="${lit ? 'interior-btn btn-primary' : 'interior-btn interior-btn--quiet'}" href="${target.href}">${target.recheck ? 'RE-CHECK' : 'START'}</a>` : ''}`;
  }
  // On a phone, one line (lock, where, who) that opens to the rest; at 900px and
  // up the line hides and the entry shows in full, as before (style.css).
  const actors = String(e.actor).split(' · ');
  const first = actors[0].split(/\s+/).length > 6 ? `${actors[0].split(/[,(]/)[0].trim()}…` : actors[0];
  const who = `${first}${actors.length > 1 ? ` +${actors.length - 1}` : ''}`;
  const label = STATE_LABEL[s.state] ?? 'Not checked yet';
  const icon = ICON[s.state] ?? '?';
  return `
      <div class="entry entry--${s.state}${sealing.has(e.id) ? ' entry--sealing' : ''}${isFirst ? ' entry--first' : ''}" data-entry="${esc(e.id)}" data-state="${s.state}">
        <details class="entry-fold" data-fold="entry-${esc(accountId)}-${esc(e.id)}"${isFirst ? ' open' : ' data-open-desktop'}><summary class="entry-line"><span class="entry-lock entry-lock--line" role="img" aria-label="${label}">${icon}</span><span class="entry-line-where">${esc(METAPHOR[e.metaphor] ?? e.metaphor)}</span><span class="entry-line-who">${esc(who)}</span></summary>
        <div class="entry-card">
        <div class="entry-lock" role="img" aria-label="${label}">${icon}</div>
        <div class="entry-text">
          <div class="entry-where">${esc(METAPHOR[e.metaphor] ?? e.metaphor)}</div>
          <div class="entry-actors">${actorLines(e.actor)}</div>
          ${e.actorNote ? `<div class="dim entry-note">${esc(e.actorNote)}</div>` : ''}
          <div class="entry-how">${esc(e.how)}</div>
          ${status}
          ${sourceLinks(e.sources)}
        </div>
        </div></details>
      </div><!-- /entry -->`;
}

function ground(ctx, interior, sealing, plan) {
  const { state, accountId } = ctx;
  return floor(ctx, 'ground', '▼ Ground floor · Entries', interior.entries
    .map((e) => entry(state, accountId, e, sealing, { first: e.id === plan.firstDoor?.id, lit: plan.doorLit && e.id === plan.firstDoor?.id }))
    .join(''));
}

function alcove(ctx, saint) {
  return floor(ctx, 'alcove', `✦ Alcove · ${esc(saint.name)}`, `
      <div class="alcove-tribute"><span>Scout: “${esc(saint.tribute)}”</span></div>
      ${renderCandle(ctx.state, saint)}
      <div class="dim alcove-title">${esc(saint.title)} · ${esc(saint.years)}</div>
      <div class="alcove-story">${esc(saint.story)}</div>
      ${sourceLinks(saint.sources)}
      <a class="interior-btn interior-btn--quiet saints-link" href="#/saints">All saints →</a>`);
}

function renderNoPlan(state, accountId) {
  const account = ACCOUNTS[accountId];
  const district = account ? DISTRICTS.find((d) => d.id === account.district) : null;
  const back = district
    ? `<a class="btn-secondary interior-back" href="#/district/${esc(district.id)}">← ${esc(district.name.toUpperCase())}</a>`
    : '<a class="btn-secondary interior-back" href="#/city">← CITY</a>';
  return `
  <div class="scanlines">
    ${renderHud(state)}
    <div class="interior">
      ${back}
      <div class="interior-empty">
        <div class="interior-title">${esc(account?.name ?? 'Unknown building')}</div>
        <p>No floor plan for this building yet.</p>
      </div>
    </div>
  </div>`;
}

// The screen's one bright button. The first door still open gets it (its SEAL IT); with no
// open door, the worst roof row's Fix it; with neither, the first unchecked door's START.
// fixes: roof row id -> { href } for each row at warn or crit whose door has somewhere to go.
function brightPlan(state, accountId, interior, rows) {
  const targetOf = (e) => Boolean(entryTarget(state, accountId, e));
  const firstDoor = firstUnsealedEntry(state, accountId, targetOf);
  const firstState = firstDoor ? entryState(state, accountId, firstDoor).state : null;
  const doorTarget = firstDoor ? entryTarget(state, accountId, firstDoor) : null;
  const fixes = new Map();
  for (const r of rows) {
    if (r.status !== 'warn' && r.status !== 'crit') continue;
    const doors = (ROW_RULES[r.id] ?? []).flatMap((rule) => interior.entries.filter((e) => e.rule === rule));
    const door = doors.find((e) => entryState(state, accountId, e).state !== 'sealed' && targetOf(e)) ?? doors.find(targetOf);
    if (door) fixes.set(r.id, entryTarget(state, accountId, door));
  }
  const sealLit = firstState === 'open' && Boolean(doorTarget);
  const worst = rows.find((r) => r.status === 'crit' && fixes.has(r.id)) ?? rows.find((r) => r.status === 'warn' && fixes.has(r.id));
  const litRow = !sealLit && worst ? worst.id : null;
  const doorLit = sealLit || (!litRow && Boolean(doorTarget));
  return { firstDoor, doorLit, litRow, fixes };
}

// Simple's one sentence: what the building is, and who the open doors let in.
export function buildingLead(account) {
  const name = String(account?.name ?? '').replace(/\s+(Login|Account)$/i, '');
  return `This building is your ${name} account. Each open door lets a hacker or scammer in, so lock them one by one.`;
}

export function renderBuildingInterior(state, accountId, { now = new Date() } = {}) {
  const interior = getInterior(accountId);
  const account = ACCOUNTS[accountId];
  if (!interior || !account || !state.accounts?.[accountId]?.enabled) return renderNoPlan(state, accountId);
  const district = DISTRICTS.find((d) => d.id === account.district);
  const rows = checkupRows(state, accountId, now);
  const saints = (interior.saints ?? []).map((id) => SAINTS[id]).filter(Boolean);
  const sealing = new Set(newlySealed(state, accountId));
  const simple = readLevel(state) === 'simplest';
  const ctx = { state, accountId, sealing, simple };
  const plan = brightPlan(state, accountId, interior, rows);
  const floorsBelow = `${saints.map((sa) => alcove(ctx, sa)).join('')}
      ${desk(ctx, interior)}`;
  const kind = interiorLineKind(state, accountId);
  const line = kind ? esc(pick(INTERIOR_LINES[kind]).replace(/\{name\}/g, account.name)) : '';
  // Simple: the same line in a small bubble (a 32px Scout beside it), not the full-width one.
  const scout = !kind ? ''
    : simple ? `<div class="interior-scout interior-scout--simple" data-scout="interior" role="note"><img src="assets/characters/scout_0.png" alt="Scout" width="32" height="32"><p>${line}</p></div>`
    : `<div class="interior-scout" data-scout="interior">${renderScout(line)}</div>`;
  return `
  <div class="scanlines">
    ${renderHud(state)}
    <div class="interior${simple ? ' interior--simple' : ''}" data-building="${esc(accountId)}">
      <a class="btn-secondary interior-back" href="#/district/${esc(account.district)}">← ${esc((district?.name ?? 'DISTRICT').toUpperCase())}</a>
      ${simple ? `<div class="interior-head"><div class="interior-title">${esc(account.name.toUpperCase())}</div><div class="interior-sub">${esc(district?.name ?? '')}</div></div>
      ${simpleLead(buildingLead(account))}
      ${leakBadges(accountId, account, true)}
      ${doorBar(state, accountId)}` : `<div class="interior-title">${esc(account.name.toUpperCase())}</div>
      <div class="interior-sub">${esc(district?.name ?? '')} · tap a floor to fold it</div>
      ${meter(state, accountId, rows, now)}
      ${leakBadges(accountId, account, false)}`}
      ${scout}
      ${roof(ctx, rows, plan)}
      ${ground(ctx, interior, sealing, plan)}
      ${simple ? `<details class="building-more" data-fold="more-${esc(accountId)}"><summary>More about this building</summary>
      <div class="dim interior-note">Tap a floor to fold it.</div>
      ${deviceList(state, accountId)}
      ${antennaNote(accountId, true)}
      ${floorsBelow}
      </details>` : floorsBelow}
    </div>
  </div>`;
}
