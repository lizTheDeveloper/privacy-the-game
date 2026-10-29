// The 🐞 bug reporter: the HUD's ladybug opens a dialog with the same eight Bug Motel
// kinds Multiverse Campus uses (campus shared/src/index.ts BUG_CATEGORIES). Reports go
// to the studio's feedback-api (POST /v2/report), stored there and pinged to the studio
// Matrix room. Players are anonymous: a report is only the kind, the words they type,
// the screen they were on and the game version. No save data, no accounts, no screenshot.
import { track } from '../utils/analytics.js';

export const BUG_CATEGORIES = [
  { slug: 'design_bug', emoji: '🦋', label: 'Design bug' },
  { slug: 'non_urgent_bug', emoji: '🐞', label: 'Non-urgent bug' },
  { slug: 'community_bug', emoji: '🐜', label: 'Community bug' },
  { slug: 'newbie_question', emoji: '🐛', label: 'Not sure if newbie question or bug' },
  { slug: 'undocumented_feature', emoji: '🪲', label: 'Undocumented feature' },
  { slug: 'connectivity_bug', emoji: '🕷️', label: 'Connectivity bug' },
  { slug: 'game_bug', emoji: '👾', label: 'Game bug' },
  { slug: 'general_annoying_bug', emoji: '🦟', label: 'General annoying bug' },
];

export const MIN_TEXT = 10;
export const MAX_TEXT = 2000;
export const SEND_TIMEOUT_MS = 15000;

// Same pairing as analyticsHost: the .xyz play domain talks to the .xyz service.
export function feedbackHost(hostname = globalThis.location?.hostname || '') {
  return hostname.endsWith('multiversestudios.xyz') ? 'https://feedback.multiversestudios.xyz' : 'https://feedback.multiversegames.ai';
}

// The route only (e.g. "#/reclamation/map"), never a query string.
export function currentScreen(hash = globalThis.location?.hash || '') {
  return (hash.split('?')[0] || '#/').slice(0, 200);
}

// The release, from the stylesheet's cache-bust query (kept equal to package.json by a test).
export function gameVersion(doc = globalThis.document) {
  const href = doc?.querySelector?.('link[href*="style.css?v="]')?.getAttribute('href') || '';
  const m = href.match(/\?v=([0-9A-Za-z.+-]{1,40})$/);
  return m ? m[1] : null;
}

export function reportBody(slug, text, { hash, doc } = {}) {
  const body = { game: 'reclaim-city', category: slug, text: text.trim(), page: currentScreen(hash) };
  const version = gameVersion(doc);
  if (version) body.version = version;
  return body;
}

// The HUD's button. data-bug-report (not data-action) keeps it out of app.js's screen actions.
export function bugButtonHtml() {
  return `<button type="button" class="hud-bug" data-bug-report aria-label="Report a bug" title="Report a bug">🐞</button>`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function dialogHtml() {
  const grid = BUG_CATEGORIES.map((c) => `
      <button type="button" class="bug-cat" data-bug-cat="${c.slug}" aria-pressed="false">
        <span class="bug-cat__emoji" aria-hidden="true">${c.emoji}</span>
        <span class="bug-cat__label">${esc(c.label)}</span>
      </button>`).join('');
  return `<dialog class="bug-dialog" aria-labelledby="bug-dialog-title">
    <button type="button" class="bug-dialog__close" data-bug-close aria-label="Close">&times;</button>
    <div data-bug-form>
      <h2 id="bug-dialog-title" class="bug-dialog__title">🐞 REPORT A BUG</h2>
      <p class="bug-dialog__sub">What kind of bug is it?</p>
      <div class="bug-cat-grid">${grid}</div>
      <div data-bug-body hidden>
        <textarea class="bug-dialog__text" rows="4" maxlength="${MAX_TEXT}" aria-label="Describe the bug"></textarea>
        <p class="bug-dialog__privacy">We get only what you type, the kind of bug, the screen you're on (<code data-bug-screen></code>) and the game version. Nothing from your city or your accounts, and no name. Please don't type passwords or anything personal.</p>
        <p class="bug-dialog__error" data-bug-error role="alert" hidden></p>
        <button type="button" class="bug-dialog__send" data-bug-send disabled>SEND</button>
      </div>
    </div>
    <div class="bug-dialog__done" data-bug-done hidden>
      <span class="bug-dialog__done-emoji" aria-hidden="true">🐞</span>
      <p>Bug report sent. Thank you!</p>
    </div>
  </dialog>`;
}

export const STYLE = `
.hud-bug { font-size: 16px; line-height: 1; min-width: 32px; min-height: 32px; padding: 4px 6px; cursor: pointer;
  background: rgba(255,45,155,0.06); border: 1px solid rgba(255,45,155,0.25); }
.hud-bug:hover, .hud-bug:focus-visible { background: rgba(255,45,155,0.18); }
@media (max-width: 768px) { .hud-bug { min-width: 44px; min-height: 44px; } }
.bug-dialog { margin: auto; inset: 0; width: min(520px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: auto; padding: 24px;
  background: #0E121A; color: var(--offwhite); border: 1px solid rgba(0,229,255,0.35); box-shadow: 0 0 40px rgba(0,229,255,0.12); }
.bug-dialog::backdrop { background: rgba(5,6,10,0.75); }
.bug-dialog__close { position: absolute; top: 8px; right: 8px; min-width: 44px; min-height: 44px; background: none; border: 0;
  color: rgba(237,239,243,0.6); font-size: 24px; cursor: pointer; }
.bug-dialog__title { font-family: var(--font-display); font-size: 16px; font-weight: 800; letter-spacing: 3px; color: var(--cyan); margin: 0 40px 4px 0; }
.bug-dialog__sub { font-size: 13px; color: rgba(237,239,243,0.7); margin: 0 0 14px; }
.bug-cat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.bug-cat { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 8px 10px; text-align: left; cursor: pointer;
  background: rgba(0,229,255,0.04); border: 1px solid rgba(0,229,255,0.2); color: var(--offwhite); font: inherit; font-size: 12px; line-height: 1.3; }
.bug-cat:hover { background: rgba(0,229,255,0.1); }
.bug-cat[aria-pressed="true"] { border-color: var(--lime); background: rgba(198,255,0,0.1); box-shadow: inset 0 0 12px rgba(198,255,0,0.15); }
.bug-cat__emoji { font-size: 20px; flex-shrink: 0; }
.bug-dialog__text { display: block; width: 100%; box-sizing: border-box; margin-top: 14px; padding: 10px; resize: vertical;
  background: #090B10; color: var(--offwhite); border: 1px solid rgba(0,229,255,0.3); font: inherit; font-size: 14px; }
.bug-dialog__privacy { font-size: 11px; line-height: 1.5; color: rgba(237,239,243,0.55); margin: 8px 0 0; }
.bug-dialog__privacy code { color: var(--cyan); }
.bug-dialog__error { font-size: 12px; color: var(--magenta); margin: 8px 0 0; }
.bug-dialog__send { margin-top: 12px; min-height: 44px; padding: 10px 22px; cursor: pointer; font-family: var(--font-display); font-weight: 800; letter-spacing: 3px;
  color: var(--midnight, #090B10); background: var(--lime); border: 0; }
.bug-dialog__send:disabled { opacity: 0.4; cursor: default; }
.bug-dialog__done { text-align: center; padding: 24px 0; }
.bug-dialog__done-emoji { font-size: 40px; }
@media (max-width: 420px) { .bug-cat-grid { grid-template-columns: 1fr; } }
`;

export async function sendReport(body, { fetchImpl = globalThis.fetch, host = feedbackHost() } = {}) {
  let res;
  try {
    res = await fetchImpl(`${host}/v2/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, message: "Couldn't reach the bug desk. Check your connection and try again." };
  }
  if (res.ok) return { ok: true };
  if (res.status === 429) return { ok: false, message: "That's a lot of bugs at once. Try again in a little while." };
  const data = await res.json().catch(() => ({}));
  return { ok: false, message: data.error || "Couldn't send that. Try again." };
}

// One dialog for the page, outside #app so screen re-renders never touch it. Any
// [data-bug-report] button, wherever it is rendered, opens it.
export function mountBugReporter(doc = document, { send = sendReport } = {}) {
  const style = doc.createElement('style');
  style.textContent = STYLE;
  doc.head.appendChild(style);
  const wrap = doc.createElement('div');
  wrap.innerHTML = dialogHtml();
  const dialog = wrap.firstElementChild;
  doc.body.appendChild(dialog);

  const $ = (sel) => dialog.querySelector(sel);
  const text = $('.bug-dialog__text');
  const sendBtn = $('[data-bug-send]');
  const error = $('[data-bug-error]');
  let category = null;
  let closeTimer = null;

  const canSend = () => category && text.value.trim().length >= MIN_TEXT;
  const refresh = () => { sendBtn.disabled = !canSend(); };
  const showError = (msg) => { error.textContent = msg; error.hidden = !msg; };

  function reset() {
    clearTimeout(closeTimer);
    category = null;
    text.value = '';
    for (const b of dialog.querySelectorAll('[data-bug-cat]')) b.setAttribute('aria-pressed', 'false');
    $('[data-bug-body]').hidden = true;
    $('[data-bug-form]').hidden = false;
    $('[data-bug-done]').hidden = true;
    sendBtn.textContent = 'SEND';
    showError('');
    refresh();
  }

  function open() {
    reset();
    $('[data-bug-screen]').textContent = currentScreen();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  function close() {
    clearTimeout(closeTimer);
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  doc.addEventListener('click', (e) => {
    if (e.target.closest?.('[data-bug-report]')) open();
  });

  dialog.addEventListener('click', async (e) => {
    // A click on the backdrop lands on the dialog element itself.
    if (e.target === dialog || e.target.closest('[data-bug-close]')) return close();
    const cat = e.target.closest('[data-bug-cat]');
    if (cat) {
      category = BUG_CATEGORIES.find((c) => c.slug === cat.dataset.bugCat);
      for (const b of dialog.querySelectorAll('[data-bug-cat]')) b.setAttribute('aria-pressed', String(b === cat));
      $('[data-bug-body]').hidden = false;
      text.placeholder = `Describe the ${category.label.toLowerCase()}: what you did, what happened…`;
      sendBtn.textContent = `SEND ${category.emoji}`;
      refresh();
      text.focus();
      return;
    }
    if (e.target.closest('[data-bug-send]') && canSend()) {
      sendBtn.disabled = true;
      showError('');
      const result = await send(reportBody(category.slug, text.value));
      if (!result.ok) {
        showError(result.message);
        refresh();
        return;
      }
      track('bug-report', { category: category.slug });
      $('[data-bug-form]').hidden = true;
      $('[data-bug-done]').hidden = false;
      closeTimer = setTimeout(close, 1800);
    }
  });
  text.addEventListener('input', refresh);

  return { dialog, open, close };
}
