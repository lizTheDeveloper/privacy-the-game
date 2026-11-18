import { renderHud } from '../components/hud.js';
import { renderScout } from '../components/scout.js';
import { PASSWORD_MANAGERS } from '../data/missions-passwords.js';
import { FINDER_QUESTIONS, BROWSER_HELP, PLACES, SAW, finderCard, finderResult } from '../data/password-finder.js';

// "Where are my passwords?" (#/passwords): one card at a time (data/password-finder.js).
// from: the mission it was opened from, to go back to when it's done.

const hostOf = (url) => new URL(url).host;
const managerName = (v) => PASSWORD_MANAGERS.find((pm) => pm.value === v)?.text || v;
const attr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function choice(key, value, text, cls = 'finder-opt') {
  return `<button type="button" class="${cls}" data-action="finder-answer" data-key="${key}" data-value="${attr(value)}">${text}</button>`;
}

function askCard(card) {
  const q = FINDER_QUESTIONS[card.key];
  const help = card.help ? `<div class="finder-help" data-finder-help>${BROWSER_HELP.map((t) => `<p>${t}</p>`).join('')}</div>` : '';
  const options = q.options.filter(([v]) => !(card.help && v === 'unknown'));
  return `<h1 class="finder-q">${card.help ? 'Here’s how to tell.' : q.ask}</h1>${help}
      <div class="finder-opts">${options.map(([v, t]) => choice(card.key, v, t)).join('')}</div>`;
}

function lookCard(card) {
  const place = PLACES[card.place];
  const open = place.url
    ? `<a class="btn-primary focus-go" href="${place.url}" target="_blank" rel="noopener" data-action="finder-open">OPEN ${hostOf(place.url).toUpperCase()} &#8599;</a>
      <p class="simple-tab-hint"><span class="on-touch">It opens a new page. When you’re done there, tap <b>Back</b> to come back here.</span><span class="on-mouse">It opens in a new tab. When you’re done there, come back to this tab.</span></p>`
    : '';
  return `<div class="next-label">LET’S LOOK</div>
      <h1 class="finder-q">Look in ${place.name}.</h1>
      ${place.look.map((t, i) => `<p class="finder-look${i ? ' finder-look--alt' : ''}">${t}</p>`).join('')}
      ${open}
      <h2 class="finder-q finder-q--small">Do you see your accounts there, like your email?</h2>
      <div class="finder-opts">${SAW.map(([v, t]) => choice(card.key, v, t)).join('')}</div>`;
}

function useButton(manager, label) {
  return `<button type="button" class="btn-primary focus-go finder-use" data-action="finder-done" data-pm="${attr(manager)}">${label}</button>`;
}

function resultCard(f) {
  const r = finderResult(f);
  if (f.where === 'app') {
    return `<div class="next-label">FOUND THEM</div>
      <h1 class="finder-q">Your passwords are in ${managerName(f.app)}.</h1>
      <p class="finder-look">When you change a password, save the new one there.</p>
      ${useButton(f.app, 'THAT’S RIGHT &#10003;')}`;
  }
  if (r.mixed) {
    const [a, b] = r.found;
    const pick = (p) => `<button type="button" class="btn-secondary finder-pick" data-action="finder-done" data-pm="${PLACES[p].manager}">${PLACES[p].mine}</button>`;
    return `<div class="next-label">FOUND THEM, IN TWO PLACES</div>
      <h1 class="finder-q">Your passwords are in two places.</h1>
      <p class="finder-look">Some are in ${PLACES[a].name}. Some are in ${PLACES[b].name}.</p>
      <p class="finder-look">These two don’t share. That’s why a password can work on one and not the other.</p>
      <h2 class="finder-q finder-q--small">Pick one to be your main place. Save every new password there.</h2>
      <div class="finder-opts">${pick(a)}${pick(b)}</div>`;
  }
  if (r.managers.length) {
    const both = r.found.length > 1;
    return `<div class="next-label">FOUND THEM</div>
      <h1 class="finder-q">Your passwords are in ${both ? `${PLACES[r.found[0]].short} and ${PLACES[r.found[1]].short}` : PLACES[r.found[0]].name}.</h1>
      ${both ? '<p class="finder-look">Good news: those two share. A password saved on one is on the other too.</p>' : ''}
      <p class="finder-look">When you change a password, save the new one there.</p>
      ${useButton(r.managers[0], 'THAT’S MY PLACE &#10003;')}`;
  }
  const lost = f.phoneSaw === 'lost' || f.browserSaw === 'lost';
  return `<div class="next-label">NOTHING SAVED YET</div>
      <h1 class="finder-q">We didn’t find saved passwords.</h1>
      <p class="finder-look">That’s OK. ${r.start ? `Let’s start saving them in ${PLACES[f.phone || f.browser].name}.` : ''} It can make strong passwords and remember them for you.</p>
      ${lost ? '<p class="finder-look">Couldn’t find it? Tap Back and look again, or ask someone you trust to look with you.</p>' : ''}
      ${r.start ? useButton(r.start, 'OK, SAVE THEM THERE &#10003;') : ''}`;
}

export function renderPasswordFinder(state, { from = null } = {}) {
  const f = state.passwordFinder || {};
  const card = finderCard(f);
  const body = card.kind === 'ask' ? askCard(card) : card.kind === 'look' ? lookCard(card) : resultCard(f);
  const answered = Object.keys(f).some((k) => k !== 'done');
  const back = answered
    ? '<button class="simple-back" data-action="finder-back"><span aria-hidden="true">&#8249;</span> Back</button>'
    : `<a class="simple-back" href="${from ? `#/mission/${from}/briefing` : '#/next'}"><span aria-hidden="true">&#8249;</span> Back</a>`;
  const intro = answered ? '' : renderScout('Let’s find where your passwords are saved. I’ll ask one thing at a time.', { feeling: 'thinkingA' });
  return `
  <div class="brief brief-focus brief-simple finder-page scanlines" data-finder="${card.kind}" ${from ? `data-from="${attr(from)}"` : ''} style="min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    ${renderHud(state, { nextLink: false })}
    <div class="focus-col">
      <div class="simple-top">${back}<div class="simple-count">Where are my passwords?</div></div>
      ${intro}
      <section class="next-card finder-card">${body}</section>
      <p class="next-saved">Your answers stay on this phone. You can stop and come back any time.</p>
    </div>
  </div>`;
}
