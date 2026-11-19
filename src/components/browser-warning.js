// The "your progress won't save here" warning (Liz 2026-11-18): links from social
// posts open in the app's own browser, which often forgets the save when it closes,
// and many players can't tell that browser from their real one.
//
// It sits above #app (its own element, so a screen draw never wipes it): the full
// panel on the start page, a slim bar on every other screen that opens into the
// panel. Hiding it lasts until the page is closed, in memory only, so it works when
// storage doesn't. It is never read aloud (it's outside the top tools' lines).
//
// One analytics event per page load, when it is first shown: the kind and, from a
// fixed list, the app. Never the user agent.
import { checkBrowser, privateHint, storageWorks, IN_APP_IDS } from '../utils/browser-check.js';
import { track, waitForTracker } from '../utils/analytics.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// The real browser to send them to, and the menu button's look, on this phone.
function browserName(platform) {
  return platform === 'ios' ? 'Safari' : platform === 'android' ? 'Chrome' : 'Safari or Chrome';
}
function menuDots(platform) {
  return platform === 'ios' ? '•••' : platform === 'android' ? '⋮' : '••• or ⋮';
}

function title(status) {
  if (status.kind === 'in-app') return `${status.app?.name ? `${cap(status.app.name)}’s browser` : 'This app’s browser'} won’t save your progress.`;
  if (status.kind === 'private') return 'This looks like a private window.';
  return 'This browser can’t save your progress.';
}

// The slim bar's one line.
function slimLine(status) {
  if (status.kind === 'private') return 'Private windows forget your progress when you close them.';
  return title(status);
}

// How to get out of this app's browser. "Look for", since app menus change.
export function appSteps(app, platform) {
  const browser = browserName(platform);
  const dots = menuDots(platform);
  const id = app?.id;
  if (id === 'instagram' || id === 'threads') {
    return platform === 'android'
      ? [`Tap ${dots} at the top right.`, 'Look for “Open in Chrome” or “Open in browser”.']
      : [`Tap ${dots} at the top right.`, 'Look for “Open in external browser”.'];
  }
  if (id === 'facebook' || id === 'messenger') {
    return [`Tap ${dots} at the top right. On some phones it’s at the bottom.`, `Look for “Open in ${browser}” or “Open in browser”.`];
  }
  if (id === 'tiktok') return [`Tap ${dots} or the share arrow.`, 'Look for “Open in browser”.'];
  return [`Look for ${dots} or a share button, at the top or the bottom.`, `Tap “Open in browser” or “Open in ${browser}”.`];
}

export function fixSteps(status) {
  const browser = browserName(status.platform);
  if (status.kind === 'private') return ['Tap “Copy the link”.', 'Open a normal window. Not a private one.', 'Paste the link there.'];
  if (status.app) return [...appSteps(status.app, status.platform), `No menu? Tap “Copy the link”. Then paste it into ${browser}.`];
  // Storage that fails outside an app: often an old private window, or storage turned off.
  const where = status.platform === 'other' ? 'Safari (iPhone) or Chrome (Android)' : browser;
  return ['Tap “Copy the link”.', `Open ${where} in a normal window. Not a private one.`, 'Paste the link there.'];
}

function simpleBody(status) {
  if (status.kind === 'in-app') return '<p class="bw-line">If you close it, you start over.</p><p class="bw-ask">To keep your progress:</p>';
  if (status.kind === 'private') return '<p class="bw-line">Private windows forget everything when you close them. Open this page in a normal window to keep your progress.</p>';
  return '<p class="bw-line">You can still play. But if you leave, you start over.</p><p class="bw-ask">To keep your progress:</p>';
}

// Advanced mode: the same facts, in one line.
function advancedBody(status) {
  const browser = browserName(status.platform);
  if (status.kind === 'private') return '<p class="bw-line">Private windows forget everything when closed. Use a normal window to keep your progress.</p>';
  const how = status.app
    ? `${menuDots(status.platform)} menu → “Open in browser” (or “Open in ${browser}”), or copy the link into ${browser}.`
    : `Open this page in a normal ${browser} window to keep it.`;
  return `<p class="bw-line">${status.kind === 'in-app' ? 'Close it and you start over. ' : 'Play on, but it resets when you leave. '}${how}</p>`;
}

// The warning's HTML ('' when nothing is wrong or it was hidden). Pure, for the tests.
export function browserWarningHtml(status, { start = false, simple = true, open = false, dismissed = false, url = '' } = {}) {
  if (!status?.kind || dismissed) return '';
  const icon = '<span class="bw-icon" aria-hidden="true">!</span>';
  if (!start && !open) {
    return `<div class="bw bw--slim" data-bw-kind="${status.kind}" role="region" aria-label="Saving your progress">
      ${icon}<p class="bw-title">${slimLine(status)}</p>
      <button type="button" class="bw-more" data-bw="open" aria-expanded="false">${simple ? 'How to fix' : 'Fix'}</button>
      <button type="button" class="bw-x" data-bw="hide" aria-label="Hide this warning">&times;</button>
    </div>`;
  }
  const steps = simple ? `<ol class="bw-steps">${fixSteps(status).map((s) => `<li>${s}</li>`).join('')}</ol>` : '';
  return `<div class="bw bw--full${simple ? '' : ' bw--advanced'}" data-bw-kind="${status.kind}" role="region" aria-label="Saving your progress">
      <div class="bw-head">${icon}<p class="bw-title">${title(status)}</p></div>
      ${simple ? simpleBody(status) : advancedBody(status)}
      ${steps}
      <div class="bw-copy">
        <input class="bw-link" type="text" readonly value="${esc(url)}" data-bw-link aria-label="The link to this game">
        <button type="button" class="bw-copy-btn" data-bw="copy">Copy the link</button>
      </div>
      <p class="bw-copied" data-bw-copied role="status" aria-live="polite"></p>
      <div class="bw-foot">
        ${start ? '' : `<button type="button" class="bw-less" data-bw="open" aria-expanded="true">Show less</button>`}
        <button type="button" class="bw-hide" data-bw="hide">Hide this</button>
      </div>
    </div>`;
}

// The line under What's next, the password finder and the candles, which promised
// the save stays on this phone. In a browser that won't keep it, it says so instead.
const SAVE_NOTES = {
  next: { ok: 'Your progress is saved on this phone. You can stop and come back any time.', thing: 'progress', keep: 'it' },
  passwords: { ok: 'Your answers stay on this phone. You can stop and come back any time.', thing: 'answers', keep: 'them' },
  candles: { ok: 'Candles stay on this phone.', thing: 'candles', keep: 'them' },
  // The devices question says its answers aren't sent; the warning above says they won't keep.
  devices: { ok: 'Your answers stay on this phone.', risky: 'Your answers aren’t sent anywhere.' },
};

export function saveNote(key, status = current) {
  const note = SAVE_NOTES[key];
  if (!status?.kind) return note.ok;
  if (note.risky) return note.risky;
  if (status.kind === 'private') return `This private window won’t keep your ${note.thing}. Open this page in a normal window to save ${note.keep}.`;
  const verb = status.kind === 'no-storage' ? 'can’t save' : 'won’t keep';
  const where = status.app ? browserName(status.platform) : `a normal ${browserName(status.platform)} window`;
  return `This browser ${verb} your ${note.thing}. Open this page in ${where} to save ${note.keep}.`;
}

// --- The live warning (memory only) ---

let current = { kind: null, app: null, platform: 'other' };
let view = { start: false, simple: true };
let open = false;
let dismissed = false;
let reported = false;
let host = null;
let drawn = null;
let changed = null;

export function browserStatus() { return current; }

// For tests: set what was found, and forget hiding and the event.
export function setBrowserStatus(status) {
  current = { kind: null, app: null, platform: 'other', ...status };
  open = false;
  dismissed = false;
  reported = false;
  drawn = null;
  host = null;
}

function pageLink() {
  const loc = globalThis.location;
  return loc ? `${loc.origin}${loc.pathname}` : '';
}

function isStandalone() {
  try {
    return globalThis.navigator?.standalone === true || !!globalThis.matchMedia?.('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

// Find out once as the game opens. The private-window hint comes later (it's
// async); `onChange` re-draws the screen then, so its save line changes too.
export function initBrowserWarning({ onChange } = {}) {
  changed = onChange || null;
  const nav = globalThis.navigator;
  try {
    current = checkBrowser({ ua: nav?.userAgent || '', standalone: isStandalone(), storageOk: storageWorks() });
  } catch {
    return;
  }
  if (!current.kind) {
    privateHint(nav).then((yes) => {
      if (!yes || current.kind) return;
      current = { ...current, kind: 'private' };
      draw();
      changed?.();
    });
  }
}

export function syncBrowserWarning(next) {
  view = { ...view, ...next };
  draw();
}

function ensureHost() {
  if (host?.isConnected) return host;
  const doc = globalThis.document;
  const app = doc?.getElementById('app');
  if (!app?.parentNode) return null;
  host = doc.createElement('div');
  host.id = 'browser-warning';
  app.parentNode.insertBefore(host, app);
  host.addEventListener('click', onClick);
  return host;
}

// Never throws: a warning that can't draw must not take the screen down with it.
function draw(focus) {
  try {
    const html = browserWarningHtml(current, { ...view, open, dismissed, url: pageLink() });
    if (html === (drawn ?? '')) {
      if (focus) host?.querySelector(focus)?.focus();
      return;
    }
    const el = ensureHost();
    if (!el) return;
    el.innerHTML = html;
    drawn = html;
    if (focus) el.querySelector(focus)?.focus();
    if (html && !reported) {
      reported = true;
      report();
    }
  } catch {
    // The game goes on without the warning.
  }
}

// The one event, once Umami's script is in (it loads after the game starts).
async function report() {
  if (!(await waitForTracker({ timeoutMs: 8000 }))) return;
  const data = { kind: current.kind };
  if (current.app && IN_APP_IDS.includes(current.app.id)) data.app = current.app.id;
  track('browser-warning-shown', data);
}

function onClick(e) {
  const btn = e.target?.closest?.('[data-bw]');
  if (!btn) return;
  const what = btn.dataset.bw;
  if (what === 'open') {
    open = !open;
    draw(open ? '.bw-copy-btn' : '.bw-more');
  } else if (what === 'hide') {
    dismissed = true;
    draw();
    globalThis.document?.getElementById('app')?.focus?.();
  } else if (what === 'copy') {
    copyLink();
  }
}

async function copyLink() {
  const field = host?.querySelector('[data-bw-link]');
  const say = (text) => {
    const msg = host?.querySelector('[data-bw-copied]');
    if (msg) msg.textContent = text;
  };
  const url = pageLink();
  const browser = browserName(current.platform);
  try {
    await globalThis.navigator.clipboard.writeText(url);
    say(current.kind === 'private' ? 'Copied. Now paste it into a normal window.' : `Copied. Now paste it into ${browser}.`);
    return;
  } catch {
    // Some in-app browsers block the clipboard: select the link instead.
  }
  try {
    field?.focus();
    field?.select();
    field?.setSelectionRange?.(0, url.length);
    if (globalThis.document?.execCommand?.('copy')) {
      say(`Copied. Now paste it into ${current.kind === 'private' ? 'a normal window' : browser}.`);
      return;
    }
  } catch {
    // Fall through to the hand-copy line.
  }
  say('Press and hold the link above. Then tap Copy.');
}
