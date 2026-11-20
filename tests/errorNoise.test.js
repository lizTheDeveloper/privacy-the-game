import { describe, it, expect } from 'vitest';
import {
  eventHasOnlyThirdPartyFrames,
  frameIsOpaqueOrForeign,
} from '../src/utils/errorNoise.js';

const PAGE = 'https://play.multiversegames.ai';

const ev = (...frameNamesPerException) => ({
  exception: {
    values: frameNamesPerException.map((frames) => ({
      type: 'Error',
      value: 'boom',
      stacktrace: { frames: frames.map((filename) => ({ filename })) },
    })),
  },
});

describe('frameIsOpaqueOrForeign', () => {
  it('keeps same-origin and studio-CDN http frames', () => {
    expect(frameIsOpaqueOrForeign('https://play.multiversegames.ai/src/app.js', PAGE)).toBe(false);
    expect(frameIsOpaqueOrForeign('https://cdn.multiversegames.ai/lib/x.js', PAGE)).toBe(false);
    expect(frameIsOpaqueOrForeign('https://analytics.multiversestudios.xyz/u.js', PAGE)).toBe(false);
  });
  it('keeps scheme-less / build-tool frames (our bundles)', () => {
    expect(frameIsOpaqueOrForeign('/src/utils/errors.js', PAGE)).toBe(false);
    expect(frameIsOpaqueOrForeign('webpack://reclaim-city/src/app.js', PAGE)).toBe(false);
  });
  it('drops opaque extension frames', () => {
    expect(frameIsOpaqueOrForeign('webkit-masked-url://hidden/', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('about:srcdoc', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign(undefined, PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('user-script:42', PAGE)).toBe(true);
  });
  it('drops extension and foreign-origin frames', () => {
    expect(frameIsOpaqueOrForeign('chrome-extension://abcdef/content.js', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('moz-extension://abcdef/content.js', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('safari-web-extension://abcdef/script.js', PAGE)).toBe(true);
    expect(frameIsOpaqueOrForeign('https://evil.example/inject.js', PAGE)).toBe(true);
  });
  it('attributes blob: URLs via their embedded origin', () => {
    expect(frameIsOpaqueOrForeign('blob:' + PAGE + '/uuid', PAGE)).toBe(false);
    expect(frameIsOpaqueOrForeign('blob:https://evil.example/uuid', PAGE)).toBe(true);
  });
});

describe('eventHasOnlyThirdPartyFrames', () => {
  it('(a) keeps an event with our own bundled frame', () => {
    expect(eventHasOnlyThirdPartyFrames(ev([`${PAGE}/src/app.js`]), PAGE)).toBe(false);
  });
  it('(b) drops an event whose only frame is webkit-masked-url://hidden/', () => {
    expect(eventHasOnlyThirdPartyFrames(ev(['webkit-masked-url://hidden/']), PAGE)).toBe(true);
  });
  it('(c) keeps a mixed event (ours + third-party)', () => {
    expect(
      eventHasOnlyThirdPartyFrames(
        ev([`${PAGE}/src/app.js`, 'chrome-extension://abcdef/content.js']),
        PAGE,
      ),
    ).toBe(false);
    expect(
      eventHasOnlyThirdPartyFrames(
        ev(['https://evil.example/x.js'], [`${PAGE}/src/main.js`]),
        PAGE,
      ),
    ).toBe(false);
  });
  it('drops all-extension stacks even across multiple exception values', () => {
    expect(
      eventHasOnlyThirdPartyFrames(
        ev(['webkit-masked-url://hidden/'], ['about:blank', 'safari-web-extension://a/b.js']),
        PAGE,
      ),
    ).toBe(true);
  });
  it('is conservative: keeps events with no frames to attribute', () => {
    expect(eventHasOnlyThirdPartyFrames({ message: 'hi' }, PAGE)).toBe(false);
    expect(eventHasOnlyThirdPartyFrames({ exception: { values: [] } }, PAGE)).toBe(false);
    expect(eventHasOnlyThirdPartyFrames({ exception: { values: [{ type: 'Error' }] } }, PAGE)).toBe(false);
    expect(eventHasOnlyThirdPartyFrames({ exception: { values: [{ stacktrace: { frames: [] } }] } }, PAGE)).toBe(false);
  });
  it('prefers abs_path over filename when present', () => {
    const event = {
      exception: {
        values: [
          { stacktrace: { frames: [{ filename: 'eval at <anonymous>', abs_path: `${PAGE}/src/app.js` }] } },
        ],
      },
    };
    expect(eventHasOnlyThirdPartyFrames(event, PAGE)).toBe(false);
  });
});

describe('private breadcrumbs (interiors, saints)', () => {
  it('drops ui breadcrumbs that name devices, buildings or candles', async () => {
    const { scrubBreadcrumb } = await import('../src/utils/errorNoise.js');
    const cases = [
      { category: 'ui.click', message: 'div.devices > ul.devices-list > li.device > button.device-x[aria-label="Remove Mom’s iPad"]' },
      { category: 'ui.click', message: 'div.district-buildings > a.building-link[aria-label="Gmail: see inside"]' },
      { category: 'ui.click', message: 'section.saint-card > button.candle-btn[aria-label="Light a candle for Saint Aaron Swartz"]' },
      { category: 'ui.input', message: 'div.devices-add > input.devices-input[aria-label="Add a device"]' },
      { category: 'ui.input', message: 'input.device-input' },
      { category: 'ui.click', message: 'div.interior > details.floor > summary.floor-head' },
    ];
    for (const b of cases) expect(scrubBreadcrumb(b)).toBeNull();
  });
  it('lets unrelated breadcrumbs through untouched', async () => {
    const { scrubBreadcrumb } = await import('../src/utils/errorNoise.js');
    const nav = { category: 'navigation', data: { from: '/', to: '/#/city' } };
    const click = { category: 'ui.click', message: 'div.hud > a.btn-secondary' };
    const log = { category: 'console', message: 'hello' };
    expect(scrubBreadcrumb(nav)).toBe(nav);
    expect(scrubBreadcrumb(click)).toBe(click);
    expect(scrubBreadcrumb(log)).toBe(log);
  });
  it('errors.js wires it as beforeBreadcrumb and in beforeSend, and keeps scrubEventUrls', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/utils/errors.js', 'utf8');
    expect(src).toMatch(/beforeBreadcrumb:\s*scrubBreadcrumb/);
    expect(src).toMatch(/isPrivateBreadcrumb\(b\)/);
    expect(src).toMatch(/return scrubEventUrls\(event\)/);
  });
});

// Fixtures are the type/value pairs GlitchTip filed for Reclaim City (project 2,
// Sep–Oct 2026). In-app browsers run these in our page, so the frame guard
// sees /reclaim-city/ as the filename and cannot drop them.
const exc = (type, value, frames = ['/reclaim-city/']) => ({
  exception: { values: [{ type, value, stacktrace: { frames: frames.map((filename) => ({ filename })) } }] },
});

describe('isInjectedScriptNoise', () => {
  it('drops in-app browser, wallet and WebView bridge noise', async () => {
    const { isInjectedScriptNoise } = await import('../src/utils/errorNoise.js');
    const noise = [
      exc('TypeError', "undefined is not an object (evaluating 'window._META.IABInnerFrame')"),
      exc('TypeError', "undefined is not an object (evaluating 'window.webkit.messageHandlers')"),
      exc('TypeError', "undefined is not an object (evaluating 'window.__firefox__.reader')"),
      exc('ReferenceError', "Can't find variable: __firefox__"),
      exc('TypeError', "undefined is not an object (evaluating 'window.ethereum.selectedAddress = undefined')"),
      exc('Error', 'Error invoking postMessage: Java object is gone', ['iabjs://navigation_performance_logger_android']),
      exc('Error', 'Error invoking postMessage: Java exception was raised during method invocation'),
      exc('Error', 'Script message handler is unavailable', []),
      exc('Error', 'Error snippet: Error Domain=WKErrorDomain Code=12 "JavaScript execution targeted an invalid frame"', []),
      exc('Error', 'WKWebView API client did not respond to this postMessage', []),
      exc('i', 'Failed to connect to MetaMask', ['chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js']),
      exc('Error', 'Invalid call to runtime.sendMessage(). Tab not found.', []),
      exc('CustomEvent', 'Event `CustomEvent` (type=unhandledrejection) captured as promise rejection', []),
      { message: "TypeError: undefined is not an object (evaluating 'window._META.IABInnerFrame')" },
    ];
    for (const e of noise) expect(isInjectedScriptNoise(e), JSON.stringify(e)).toBe(true);
  });

  it("keeps Reclaim City's own errors, including every real one GlitchTip filed", async () => {
    const { isInjectedScriptNoise } = await import('../src/utils/errorNoise.js');
    const real = [
      exc('TypeError', "Cannot read properties of undefined (reading 'current')", ['/components/hud.js']),
      exc('Error', 'loadState: save had no accounts object', ['/state.js']),
      exc('Error', 'loadState: save had no streak object', ['/state.js']),
      exc('TypeError', "Cannot read properties of undefined (reading 'gmail')", ['/reclaim-city/state.js']),
      exc('ReferenceError', 'ALL_MISSIONS is not defined', ['/data/missions.js']),
      exc('ReferenceError', 'structuredClone is not defined', ['/reclaim-city/state.js']),
      exc('SecurityError', 'The operation is insecure.', ['/reclaim-city/state.js']),
      exc('TypeError', 'Failed to fetch', ['/router.js']),
      exc('UnhandledRejection', 'Non-Error promise rejection captured with value: undefined', []),
      exc('Error', 'toBlob failed', ['/reclaim-city/utils/milestone-card.js']),
      // Our cabinet handshake uses postMessage; a failure there is ours.
      exc('Error', "Failed to execute 'postMessage' on 'Window': Invalid target origin", ['/reclaim-city/utils/cabinet.js']),
      { message: 'rc-collective nightly job failed: boom' },
      {},
    ];
    for (const e of real) expect(isInjectedScriptNoise(e), JSON.stringify(e)).toBe(false);
  });

  it('keeps an event when any one of its exceptions is ours', async () => {
    const { isInjectedScriptNoise } = await import('../src/utils/errorNoise.js');
    const mixed = {
      exception: {
        values: [
          { type: 'TypeError', value: "undefined is not an object (evaluating 'window.webkit.messageHandlers')" },
          { type: 'TypeError', value: "Cannot read properties of undefined (reading 'current')" },
        ],
      },
    };
    expect(isInjectedScriptNoise(mixed)).toBe(false);
  });

  it('no file in src/ names the globals the filter treats as foreign', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const walk = (d) => readdirSync(d).flatMap((f) => {
      const p = join(d, f);
      return statSync(p).isDirectory() ? walk(p) : /\.(js|html)$/.test(f) ? [p] : [];
    });
    const foreign = /_META|IABInnerFrame|messageHandlers|__firefox__|window\.ethereum|MetaMask|WKErrorDomain|runtime\.sendMessage/;
    // The filter itself and its wiring in errors.js name them on purpose.
    const filterFiles = [join('src', 'utils', 'errorNoise.js'), join('src', 'utils', 'errors.js')];
    const hits = walk('src').filter((p) => !filterFiles.includes(p) && foreign.test(readFileSync(p, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('errors.js drops it in beforeSend', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/utils/errors.js', 'utf8');
    expect(src).toMatch(/if \(isInjectedScriptNoise\(event\)\) return null;/);
  });
});

describe('shouldReportRejection (our unhandledrejection listener)', () => {
  it('skips script-dispatched and non-Error rejections that Sentry already reports', async () => {
    const { shouldReportRejection } = await import('../src/utils/errors.js');
    // GlitchTip #103: a CustomEvent('unhandledrejection'), isTrusted false, no reason.
    expect(shouldReportRejection({ type: 'unhandledrejection', isTrusted: false, detail: null })).toBe(false);
    // #442/#103 pair: a real rejection with reason undefined (Sentry's handler files it once).
    expect(shouldReportRejection({ isTrusted: true, reason: undefined })).toBe(false);
    expect(shouldReportRejection({ isTrusted: true, reason: { error: {}, isError: true } })).toBe(false);
    expect(shouldReportRejection(null)).toBe(false);
  });
  it('reports a real rejection whose reason is an Error', async () => {
    const { shouldReportRejection } = await import('../src/utils/errors.js');
    expect(shouldReportRejection({ isTrusted: true, reason: new TypeError('Failed to fetch') })).toBe(true);
  });
});
