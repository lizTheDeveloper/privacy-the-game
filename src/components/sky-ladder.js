// The sky ladder beside the constellation: the opt-outs that cover the most stars first, each
// previewed on the sky before the player does it. A list on desktop, a bottom sheet on a phone.
// Rung buttons carry a list index, never a broker id; nothing here is tracked or put in a URL.
import { LADDER_COPY, PRESCREEN_LINKS, GPC_STATES } from '../data/sky-ladder.js';
import { nextRung } from '../utils/sky-ladder.js';
import { MISSIONS } from '../data/missions.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// simple: Simple mode says brokers, not stars.
export function rungCount(r, simple = false) {
  if (r.kind === 'gpc') return LADDER_COPY.gpc.count;
  if (simple) return r.count ? LADDER_COPY.brokers(r.count) : LADDER_COPY.zeroSimple;
  return r.count ? LADDER_COPY.stars(r.count) : LADDER_COPY.zero;
}

const STATUS = {
  done: (r) => `Done${r.doneOn ? ` · ${esc(r.doneOn)}` : ''}`,
  amber: () => 'Re-check due',
  preview: () => 'California only',
  todo: () => '',
};

function rungRow(r, index, isNext, simple = false) {
  const status = STATUS[r.status]?.(r) ?? '';
  return `<li><button type="button" class="sky-rung sky-rung--${r.status}${isNext ? ' sky-rung--next' : ''}" data-action="select-rung" data-rung="${index}">`
    + `<span class="sky-rung-name">${isNext ? '<span class="sky-rung-next">NEXT</span> ' : ''}${esc(r.label)}</span>`
    + `<span class="sky-rung-meta">${esc(rungCount(r, simple))}${status ? ` · <span class="sky-rung-status">${status}</span>` : ''}</span>`
    + '</button></li>';
}

function goLink(href, label) {
  return `<p class="star-card-go"><a href="${esc(href)}">${esc(label)}</a></p>`;
}

export function rungCard(r, { home = null, simple = false } = {}) {
  const parts = [`<h2 id="sky-rung-title">${esc(r.label)}</h2>`, `<p class="sky-rung-meta">${esc(rungCount(r, simple))}</p>`];
  if (r.status === 'done') parts.push(`<p class="star-card-state">${STATUS.done(r)}</p>`);
  if (r.status === 'amber') parts.push('<p class="star-card-state" style="color: var(--amber);">Re-check due</p>');
  if (r.kind === 'drop') {
    parts.push(`<p>${esc(r.text)}</p>`);
    if (r.status === 'preview') parts.push(`<p class="star-card-note"><strong>Why not me?</strong> ${esc(LADDER_COPY.drop.whyNot)}</p>`);
    else if (r.status !== 'done') parts.push(goLink(`#/mission/${r.mission}/briefing`, 'FILE DROP'));
  } else if (r.kind === 'gpc') {
    parts.push(`<p>${esc(LADDER_COPY.gpc.body)}</p><p class="star-card-note">${esc(r.text)}</p>`);
    const law = Object.hasOwn(GPC_STATES, home ?? '') ? GPC_STATES[home] : null;
    if (law) parts.push(`<p class="star-card-src"><a href="${esc(law.url)}" target="_blank" rel="noopener">Read the law</a></p>`);
    if (r.status !== 'done') parts.push(goLink(`#/mission/${r.mission}/briefing`, 'SET IT UP'));
  } else if (r.kind === 'prescreen') {
    parts.push(`<p>${esc(r.text)}</p><ul class="star-card-list">`
      + PRESCREEN_LINKS.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')
      + '</ul>');
    parts.push(r.status === 'todo'
      ? `<button type="button" class="sky-rung-did" data-action="prescreen-did">${esc(LADDER_COPY.prescreen.did)}</button>`
      : `<button type="button" class="star-card-close" data-action="prescreen-undo">${esc(LADDER_COPY.prescreen.undo)}</button>`);
  } else {
    if (r.text) parts.push(`<p class="star-card-note">${esc(r.text)}</p>`);
    if (r.status === 'amber') parts.push(goLink(`#/mission/${r.mission}/recheck`, 'RE-CHECK'));
    else if (r.status !== 'done') parts.push(goLink(`#/mission/${r.mission}/briefing`, 'GO'));
  }
  parts.push('<button type="button" class="star-card-close" data-action="close-rung">BACK TO THE LIST</button>');
  return parts.join('');
}

// rungs: ladder(). selected: the open rung's index or null. open: the phone sheet is pulled up.
// top: the location quiz, shown above the list until it's answered (it decides what the rungs say).
// inline: Simple's list under the next-rung card, in the page rather than a sheet over it.
export function ladderPanel(rungs, { selected = null, open = false, home = null, top = '', inline = false } = {}) {
  const next = nextRung(rungs);
  const nextIndex = next ? rungs.indexOf(next) : -1;
  const sel = Number.isInteger(selected) && rungs[selected] ? rungs[selected] : null;
  const barText = sel ? sel.label : inline ? 'EVERY OPT-OUT, BIGGEST FIRST' : top ? 'WHERE DO YOU LIVE?' : next ? `Next: ${next.label} ›` : 'ALL DONE';
  const bar = `<button type="button" class="sky-ladder-bar" data-action="ladder-toggle" aria-expanded="${open || sel ? 'true' : 'false'}">`
    + `<span class="sky-ladder-grab" aria-hidden="true"></span><span>${esc(barText)}</span></button>`;
  const body = sel
    ? `<div class="sky-rung-card" role="region" aria-labelledby="sky-rung-title" tabindex="-1">${rungCard(sel, { home, simple: inline })}</div>`
    : `${top}<div class="label">BIGGEST FIRST</div><ol class="sky-rungs">${rungs.map((r, i) => rungRow(r, i, i === nextIndex, inline)).join('')}</ol>`;
  return `<section class="sky-ladder${inline ? ' sky-ladder--inline' : ''}${open || sel ? ' is-open' : ''}" aria-label="Opt-outs, biggest first">${bar}<div class="sky-ladder-body">${body}</div></section>`;
}

const missionTitle = (id) => MISSIONS.find((m) => m.id === id)?.title ?? '';

// Simple's next step under the sky, holding the screen's one bright button: the location question
// while it's unanswered (quiz: its markup), else the biggest opt-out left.
export function nextRungCard(rungs, { quiz = '' } = {}) {
  if (quiz) {
    // The quiz carries its own WHERE DO YOU LIVE? heading.
    return `<section class="sky-next" data-sky-next>${quiz}</section>`;
  }
  const next = nextRung(rungs);
  if (!next) {
    return '<section class="sky-next sky-next--done" data-sky-next><div class="label">THE LADDER</div><p class="sky-next-done">Every opt-out on the ladder is done ✓</p></section>';
  }
  const index = rungs.indexOf(next);
  const parts = ['<div class="label">NEXT: THE BIGGEST OPT-OUT LEFT</div>', `<h2>${esc(next.label)}</h2>`, `<p class="sky-rung-meta">${esc(rungCount(next, true))}</p>`];
  if (next.kind === 'gpc') parts.push(`<p>${esc(LADDER_COPY.gpc.body)}</p>`);
  else if (next.text) parts.push(`<p>${esc(next.text)}</p>`);
  const go = (href, label, opens) => `<a class="btn-primary sky-next-go" href="${esc(href)}">${esc(label)} ›</a><p class="sky-next-opens">${esc(opens)}</p>`;
  if (next.kind === 'prescreen') {
    const [first, ...rest] = PRESCREEN_LINKS;
    parts.push(`<a class="btn-primary sky-next-go" href="${esc(first.url)}" target="_blank" rel="noopener">OPT OUT AT OPTOUTPRESCREEN.COM ›</a>`
      + '<p class="sky-next-opens">Opens OptOutPrescreen.com in a new tab; come back and tick it.</p>'
      + `<ul class="star-card-list">${rest.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('')}</ul>`
      + `<button type="button" class="btn-secondary sky-rung-did" data-action="prescreen-did">${esc(LADDER_COPY.prescreen.did)}</button>`);
  } else if (next.mission) {
    const title = missionTitle(next.mission);
    const opens = title ? `Opens the “${title}” mission.` : 'Opens its mission.';
    parts.push(next.status === 'amber' ? go(`#/mission/${next.mission}/recheck`, 'RE-CHECK', opens) : go(`#/mission/${next.mission}/briefing`, next.kind === 'drop' ? 'FILE DROP' : 'START', opens));
  }
  parts.push(`<button type="button" class="btn-secondary sky-next-see" data-action="select-rung" data-rung="${index}">SEE IT ON THE SKY</button>`);
  return `<section class="sky-next" data-sky-next>${parts.join('')}</section>`;
}

export const LADDER_CSS = `
.sky-next{margin-top:12px;padding:14px 16px;background:#11151F;border:1px solid rgba(0,229,255,0.45);border-left:3px solid var(--cyan);border-radius:8px;font-size:15px;line-height:1.5;color:var(--offwhite);overflow-wrap:anywhere}
.sky-next .label{font-family:var(--font-title);font-size:11px;font-weight:700;letter-spacing:1px;color:var(--cyan);margin:0 0 6px}
.sky-next h2{margin:0;font-family:var(--font-title);line-height:1.2;font-size:18px;font-weight:800;letter-spacing:0.5px;color:var(--offwhite)}
.sky-next p{margin:6px 0}
.sky-next .sky-rung-meta{font-size:13px;color:var(--offwhite)}
.sky-next-go{display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box;margin-top:8px;text-decoration:none}
.sky-next .sky-next-opens{font-size:14px;color:var(--offwhite)}
.sky-next-see,.sky-next .sky-rung-did{display:inline-flex;align-items:center;min-height:44px;margin:8px 8px 0 0}
.sky-next .residency .map-panel{margin-top:0;padding:0;background:none;border:0}
.sky-next .residency .label{font-family:var(--font-title);font-size:11px;font-weight:700;letter-spacing:1px;color:var(--cyan)}
.sky-next--done{border-color:rgba(198,255,0,0.45);border-left-color:var(--lime)}
.sky-next-done{color:var(--lime);font-weight:700}
.sky-ladder--inline{margin-top:12px}
.sky-ladder--inline .sky-ladder-bar{position:static;display:flex;flex-direction:row;justify-content:space-between;align-items:center;width:100%;min-height:44px;margin:0;padding:0;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:var(--cyan);background:transparent;border:0;cursor:pointer}
.sky-ladder--inline .sky-ladder-bar::after{content:'▾'}.sky-ladder--inline.is-open .sky-ladder-bar::after{content:'▴'}
.sky-ladder--inline .sky-ladder-grab{display:none}
.sky-ladder--inline:not(.is-open) .sky-ladder-body{display:none}
.sky-ladder{padding:12px 14px;background:#11151F;border:1px solid rgba(198,255,0,0.25);border-radius:8px;font-size:13px;line-height:1.5;color:var(--offwhite);overflow-wrap:anywhere}
.sky-ladder .label{font-family:var(--font-title);line-height:1.2;font-size:11px;font-weight:700;letter-spacing:1px;color:rgba(198,255,0,0.7);margin:0 0 6px}
.sky-ladder-bar{display:none}
.sky-rungs{list-style:none;margin:0;padding:0}
.sky-rung{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;min-height:44px;padding:8px 10px;text-align:left;font:inherit;color:var(--offwhite);background:rgba(26,31,43,0.5);border:0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer}
.sky-rung:hover,.sky-rung:focus-visible{background:rgba(0,229,255,0.08)}
.sky-rung:focus-visible,.sky-ladder-bar:focus-visible,.sky-rung-did:focus-visible{outline:2px solid var(--cyan);outline-offset:-2px}
.sky-rung-name{font-weight:700}
.sky-rung-meta{font-size:11px;color:rgba(237,239,243,0.6)}
.sky-rung--done .sky-rung-name,.sky-rung--done .sky-rung-status{color:var(--lime)}
.sky-rung--amber .sky-rung-status{color:var(--amber)}
.sky-rung--preview .sky-rung-name{color:rgba(237,239,243,0.75)}
.sky-rung-next{font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:#090B10;background:var(--lime);padding:1px 5px;border-radius:3px}
.sky-rung-card h2{margin:0;font-family:var(--font-title);line-height:1.2;font-size:16px;font-weight:800;letter-spacing:0.5px}
.sky-rung-card p{margin:6px 0}
.sky-rung-card a{color:var(--cyan)}
.sky-rung-card .star-card-go a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#090B10;background:var(--cyan);border-radius:6px;text-decoration:none}
.sky-rung-card .star-card-note{font-size:12px;color:rgba(237,239,243,0.75)}
.sky-rung-card .star-card-state{color:var(--lime)}
.sky-rung-card .star-card-list{margin:0;padding-left:18px}
.sky-rung-card .star-card-close{min-height:44px;margin-top:12px;padding:0 18px;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);background:transparent;border:1px solid rgba(0,229,255,0.4);border-radius:6px;cursor:pointer}
.sky-rung-did{min-height:44px;margin-top:10px;padding:0 18px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#090B10;background:var(--lime);border:0;border-radius:6px;cursor:pointer}
@media (min-width:900px){.sky-ladder{position:sticky;top:12px;max-height:calc(100svh - 40px);overflow-y:auto}}
@media (max-width:899.98px){
.broker-map{padding-bottom:72px}
.sky-ladder{position:fixed;left:0;right:0;bottom:0;z-index:39;max-height:60svh;overflow-y:auto;overscroll-behavior:contain;padding:0 14px calc(10px + env(safe-area-inset-bottom));border-radius:14px 14px 0 0;border-bottom:0;box-shadow:0 -8px 32px rgba(0,0,0,0.6)}
.sky-ladder-bar{position:sticky;top:0;display:flex;flex-direction:column;align-items:center;gap:4px;width:calc(100% + 28px);min-height:52px;margin:0 -14px 6px;padding:6px 14px 8px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:var(--lime);background:rgba(17,21,31,0.99);border:0;cursor:pointer}
.sky-ladder-grab{width:44px;height:5px;border-radius:3px;background:rgba(237,239,243,0.35)}
.sky-ladder:not(.is-open) .sky-ladder-body{display:none}
.sky-ladder:has(.sky-rung-card){max-height:46svh}
.sky-ladder:not(.is-open){padding-bottom:env(safe-area-inset-bottom)}
.sky-ladder-bar{background:#11151F}
.sky-ladder-body .residency .label{display:none}
.sky-ladder.sky-ladder--inline{position:static;max-height:none;overflow:visible;padding:0 14px 6px;border:1px solid rgba(0,229,255,0.25);border-radius:8px;box-shadow:none}
.sky-ladder.sky-ladder--inline .sky-ladder-bar{width:100%;margin:0;padding:0;background:transparent}
.broker-map--simple{padding-bottom:24px}
}`;
