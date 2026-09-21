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
