// The sky's "where do you live?" quiz. It starts from the rough location /whoami already gives the
// Stats screen (from the IP address, never stored) and the player confirms or corrects it. The
// answer decides which opt-outs work for them. Saved in the game only; never in a URL or an event.
// Inside <div class="residency">, so its clicks never become error breadcrumbs (errorNoise.js).
import { US_STATES, STATE_NAME } from '../data/sky-ladder.js';
import { SKY_LADDER_DIALOGUE } from '../data/dialogue.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The state /whoami's rough location points at: 'US-XX', 'outside-us', or null when it says nothing usable.
export function guessFromWhoami(whoami) {
  const data = whoami?.status === 'ready' ? whoami.data : whoami;
  if (!data || typeof data !== 'object') return null;
  if (typeof data.region === 'string' && Object.hasOwn(STATE_NAME, data.region)) return data.region;
  if (typeof data.country === 'string' && /^[A-Z]{2}$/.test(data.country) && data.country !== 'US') return 'outside-us';
  return null;
}

export function homeLabel(home) {
  if (home === 'outside-us') return 'Outside the US';
  if (home === 'unsaid') return 'Rather not say';
  return STATE_NAME[home] ?? null;
}

const btn = (action, label, extra = '') => `<button type="button" class="btn-secondary residency-btn" data-action="${action}"${extra}>${label}</button>`;

// home: homeOf(state). guess: guessFromWhoami(). guessAllowed: the player hasn't turned sharing
// off or gone ghost (then nothing is looked up until they ask). guessStatus: whoami's status.
export function locationQuiz({ home = null, guess = null, editing = false, guessAllowed = true, guessStatus = 'idle' } = {}) {
  if (home && !editing) {
    const change = home === 'outside-us' || home === 'unsaid' ? 'CHANGE' : `NOT IN ${esc(homeLabel(home).toUpperCase())}? CHANGE`;
    return `<div class="residency"><div class="map-panel"><div>Where you live: <strong>${esc(homeLabel(home))}</strong></div>`
      + `${btn('change-home', change, ' style="margin-top: 8px;"')}</div></div>`;
  }
  const parts = [`<div class="label">WHERE DO YOU LIVE?</div><div>${esc(SKY_LADDER_DIALOGUE.quiz)}</div>`];
  if (guess) {
    const where = guess === 'outside-us' ? 'outside the US' : `in ${homeLabel(guess)}`;
    parts.push(`<p class="residency-guess">Looks like you're ${esc(where)}. Is that right?</p>`
      + `<div class="residency-buttons">${btn('quiz-yes', 'YES', ` data-value="${esc(guess)}"`)}</div>`
      + `<p class="residency-note">${esc(SKY_LADDER_DIALOGUE.quizWhyGuess)}</p>`);
  } else if (guessStatus === 'loading') {
    parts.push('<p class="residency-guess" role="status">Guessing…</p>');
  } else if (!guessAllowed) {
    parts.push(`<div class="residency-buttons">${btn('quiz-guess', 'GUESS FOR ME')}</div><p class="residency-note">${esc(SKY_LADDER_DIALOGUE.quizGuessOff)}</p>`);
  }
  const options = US_STATES.map(([code, name]) => `<option value="${code}"${code === guess ? ' selected' : ''}>${esc(name)}</option>`).join('');
  parts.push(`<div class="residency-pick"><select class="residency-select" aria-label="Your state"><option value="">${guess ? 'No, I live in…' : 'Choose your state…'}</option>${options}</select>`
    + `${btn('quiz-pick', "THAT'S ME")}</div>`
    + `<div class="residency-buttons">${btn('quiz-outside', 'OUTSIDE THE US')}${btn('quiz-unsaid', 'RATHER NOT SAY')}</div>`);
  return `<div class="residency"><div class="map-panel">${parts.join('')}</div></div>`;
}

export const QUIZ_CSS = '.residency-guess{margin:10px 0 4px;font-size:14px}.residency-note{margin:6px 0 0;font-size:11px;color:rgba(237,239,243,0.55)}'
  + '.residency-pick{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.residency-select{min-height:44px;flex:1 1 200px;padding:0 10px;font:inherit;font-size:14px;color:var(--offwhite);background:#090B10;border:1px solid rgba(0,229,255,0.35);border-radius:6px}'
  + '.residency-select:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}';
