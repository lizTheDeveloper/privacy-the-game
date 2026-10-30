// Third-party frame guard for GlitchTip error reporting.
//
// Browser extensions and iOS Safari content blockers inject scripts into our
// pages; when those scripts throw, the platform hides their source
// (`webkit-masked-url://hidden/`, extension schemes, `about:`, anonymous
// evals) and the event reaches GlitchTip looking like one of our crashes.
// Closing each one with the `noise` label only suppresses that fingerprint in
// that repo, so we drop the whole class at the source instead: an event whose
// exception stack frames are ALL opaque or non-studio-origin cannot contain
// our bug, and never leaves the client.
//
// A single same-origin or studio-CDN frame in the stack keeps the event
// reportable (mixed stacks are usually our code calling into — or being
// called by — an extension), and events with no stacktrace at all are kept.
// Network-layer noise rules (server-side tier-2/tier-3 + each app's message
// filters) are untouched.

const STUDIO_HOST_SUFFIXES = [
  'multiversegames.ai',
  'multiversestudios.xyz',
  'themultiverse.school',
];

// Schemes that only exist for injected, hidden, or platform-internal scripts.
const OPAQUE_SCHEMES = new Set([
  'webkit-masked-url',
  'about',
  'data',
  'user-script',
  'javascript',
  'chrome',
  'chrome-extension',
  'chrome-search',
  'chrome-native',
  'moz-extension',
  'ms-browser-extension',
  'safari-web-extension',
  'safari-extension',
  'brave-extension',
  'opera-extension',
  'resource',
]);

export function isStudioHostname(hostname) {
  const h = String(hostname || '').toLowerCase();
  return STUDIO_HOST_SUFFIXES.some((s) => h === s || h.endsWith('.' + s));
}

// True when a frame filename cannot be attributed to our code: opaque
// (webkit-masked-url, about:, data:, missing filename) or hosted outside the
// page origin / studio domains. blob: is attributed via the origin embedded
// in the URL; relative and build-tool pseudo paths (no scheme) are ours.
export function frameIsOpaqueOrForeign(filename, pageOrigin) {
  const f = typeof filename === 'string' ? filename.trim() : '';
  if (!f) return true;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(f);
  if (!scheme) return false;
  const s = scheme[1].toLowerCase();
  if (s === 'http' || s === 'https' || s === 'blob') {
    try {
      const u = new URL(s === 'blob' ? f.slice('blob:'.length) : f);
      if (u.origin === pageOrigin) return false;
      return !isStudioHostname(u.hostname);
    } catch {
      return true;
    }
  }
  // Explicit opaque / injected-script list. Everything without an http(s)/blob
  // origin to attribute (relative paths, webpack://, unknown dev-tool
  // pseudo-schemes) is conservatively treated as OURS — the guard may drop
  // noise, never a real defect.
  return OPAQUE_SCHEMES.has(s);
}

// True iff every frame of every exception in the event is opaque/foreign.
export function eventHasOnlyThirdPartyFrames(event, pageOrigin) {
  const values = event && event.exception && Array.isArray(event.exception.values) ? event.exception.values : null;
  if (!values || values.length === 0) return false;
  let framesSeen = 0;
  for (const v of values) {
    const frames = v && v.stacktrace && Array.isArray(v.stacktrace.frames) ? v.stacktrace.frames : null;
    if (!frames || frames.length === 0) return false;
    for (const fr of frames) {
      framesSeen += 1;
      const name = (fr && (fr.abs_path || fr.filename)) || '';
      if (!frameIsOpaqueOrForeign(name, pageOrigin)) return false;
    }
  }
  return framesSeen > 0;
}

// Click and input breadcrumbs record the element's selector, aria-label and
// title. Inside a building or the saints gallery those name the player's
// devices, the building opened and the saints honored: drop them before an
// error report is built. Lean strict: any labelled element goes too.
const PRIVATE_UI = /aria-label=|title=|device-x|devices?-input|building-link|candle-btn|interior|saint|broker-checklist|constellation|star-card|residency|big-check|sky-ladder|rung|satellite|prism|gov-|leak/;

export function isPrivateBreadcrumb(b) {
  if (!b || typeof b.category !== 'string' || !b.category.startsWith('ui.')) return false;
  return PRIVATE_UI.test(String(b.message ?? ''));
}

// Sentry's beforeBreadcrumb: null drops the breadcrumb.
export function scrubBreadcrumb(b) {
  return isPrivateBreadcrumb(b) ? null : b;
}

// Injected-script noise by message. In-app browsers (Instagram/Facebook's
// _META bridge, iOS WKWebView message handlers, Android's Java bridge, Firefox
// iOS's __firefox__) and wallet extensions run their code in our page's
// context, so the frame guard above sees our page URL as the filename and
// keeps the event. These globals and bridge errors never come from Reclaim
// City's code (no file in src/ names them), so an event whose every exception
// matches one is dropped. Each pattern names a specific foreign global or
// bridge, never a shape our own errors could take.
const INJECTED_NOISE = [
  /\bwindow\._META\b|\bIABInnerFrame\b/,
  /\bwindow\.webkit\.messageHandlers\b/,
  /\b__firefox__\b/,
  /\bwindow\.ethereum\b/,
  /\bMetaMask\b/,
  /\bJava object is gone\b/,
  /\bJava exception was raised during method invocation\b/,
  /\bScript message handler is unavailable\b/,
  /\bWKErrorDomain\b/,
  /\bWKWebView API client did not respond\b/,
  /\bInvalid call to runtime\.sendMessage\(\)/,
  // A script dispatched `new CustomEvent('unhandledrejection')` (isTrusted
  // false, no reason): Sentry reports the event object itself. The game never
  // dispatches one; real rejections arrive as PromiseRejectionEvent.
  /^Event `CustomEvent` \(type=unhandledrejection\) captured as promise rejection$/,
];

function exceptionText(v) {
  return `${(v && v.type) || ''}: ${(v && v.value) || ''}`;
}

// True iff every exception in the event is known injected-script noise (its
// message names a foreign global or bridge above). Events with no exception
// are checked by their message alone. Anything else is kept: extension frames
// mixed with ours stay reportable (eventHasOnlyThirdPartyFrames handles stacks
// that are extension-only).
export function isInjectedScriptNoise(event) {
  const values = event && event.exception && Array.isArray(event.exception.values) ? event.exception.values : null;
  if (!values || values.length === 0) {
    const msg = event && typeof event.message === 'string' ? event.message : '';
    return Boolean(msg) && INJECTED_NOISE.some((re) => re.test(msg));
  }
  return values.every((v) => {
    const value = String((v && v.value) || '');
    return INJECTED_NOISE.some((re) => re.test(value) || re.test(exceptionText(v)));
  });
}
