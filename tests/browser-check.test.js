import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { detectInAppBrowser, platformOf, storageWorks, privateHint, checkBrowser, IN_APP_IDS, SMALL_QUOTA } from '../src/utils/browser-check.js';
import {
  browserWarningHtml, fixSteps, saveNote, setBrowserStatus, initBrowserWarning, syncBrowserWarning, browserStatus,
} from '../src/components/browser-warning.js';
import { renderNext } from '../src/screens/next.js';
import { renderPasswordFinder } from '../src/screens/password-finder.js';
import { renderSaints } from '../src/screens/saints.js';
import { devicesAsk } from '../src/components/walkthrough.js';
import { createInitialState, loadState, saveState, hasSavedState } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { plainText } from '../src/utils/readability.js';

// Liz 2026-11-18: "if people are on like Instagram's browser or like, you know, the temporary
// browser, you have to tell them that their info is not saving."

const UA = {
  instagramIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 329.0.3.23.103 (iPhone14,5; iOS 17_4_1; en_US; en; scale=3.00; 1170x2532; 595393425)',
  instagramAndroid: 'Mozilla/5.0 (Linux; Android 13; SM-S911B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.105 Mobile Safari/537.36 Instagram 321.0.0.39.106 Android (33/13; 480dpi; 1080x2340; samsung; SM-S911B; dm1q; qcom; en_US; 571395523)',
  facebookIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0.38.108;FBBV/564431005;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.3.1;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/567052743]',
  facebookAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.231105.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.193 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/446.0.0.31.111;]',
  messengerIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/430.0.0.38.112;FBBV/512345678;FBDV/iPhone13,2;FBMD/iPhone;FBSN/iOS;FBSV/16.6;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
  messengerAndroid: 'Mozilla/5.0 (Linux; Android 12; SM-A525F Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.5993.111 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/434.0.0.30.115;]',
  tiktokIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_33.1.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US ByteFullLocale/en isDarkMode/1 WKWebView/1 RevealType/Dialog BytedanceWebview/d8a21c6',
  tiktokAndroid: 'Mozilla/5.0 (Linux; Android 12; SM-G991U Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.163 Mobile Safari/537.36 trill_2023208030 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/trill app_version/32.8.3 ByteLocale/en ByteFullLocale/en Region/US BytedanceWebview/d8a21c6',
  snapchatIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/12.62.0.36 (like Safari/8617.2.4.10.8, panda)',
  linkedinIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.29.6820',
  threadsIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Barcelona 323.0.0.29.105 (iPhone15,3; iOS 17_4; en_US; en; scale=3.00; 1290x2796; 589254032)',
  twitterIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone/9.61',
  pinterestIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]',
  lineIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.20.0',
  wechatIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42(0x18002a2a) NetType/WIFI Language/en',
  googleAppIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/309.0.616685607 Mobile/15E148 Safari/604.1',
  wkWebView: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  androidWebView: 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230805.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36',
  // Real browsers.
  safariIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  chromeIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1',
  firefoxIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/124.0 Mobile/15E148 Safari/605.1.15',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
  samsungAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36',
  firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:124.0) Gecko/124.0 Firefox/124.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  chromeDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  firefoxDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  edgeDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.2420.65',
};

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const throwing = () => ({ getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceededError'); }, removeItem() { throw new Error('SecurityError'); } });

beforeEach(() => { globalThis.localStorage = memory(); setBrowserStatus({ kind: null }); });
afterEach(() => { vi.unstubAllGlobals(); setBrowserStatus({ kind: null }); });

describe('which app’s browser is this?', () => {
  it.each([
    ['instagramIos', 'instagram', 'ios'], ['instagramAndroid', 'instagram', 'android'],
    ['facebookIos', 'facebook', 'ios'], ['facebookAndroid', 'facebook', 'android'],
    ['messengerIos', 'messenger', 'ios'], ['messengerAndroid', 'messenger', 'android'],
    ['tiktokIos', 'tiktok', 'ios'], ['tiktokAndroid', 'tiktok', 'android'],
    ['snapchatIos', 'snapchat', 'ios'], ['linkedinIos', 'linkedin', 'ios'], ['threadsIos', 'threads', 'ios'],
    ['twitterIos', 'twitter', 'ios'], ['pinterestIos', 'pinterest', 'ios'], ['lineIos', 'line', 'ios'],
    ['wechatIos', 'wechat', 'ios'], ['googleAppIos', 'google', 'ios'],
    ['wkWebView', 'webview', 'ios'], ['androidWebView', 'webview', 'android'],
  ])('%s is %s', (key, id, platform) => {
    expect(detectInAppBrowser(UA[key])?.id).toBe(id);
    expect(platformOf(UA[key])).toBe(platform);
    expect(IN_APP_IDS).toContain(id);
  });

  it.each(['safariIos', 'chromeIos', 'firefoxIos', 'chromeAndroid', 'samsungAndroid', 'firefoxAndroid', 'safariMac', 'chromeDesktop', 'firefoxDesktop', 'edgeDesktop'])(
    '%s is a real browser', (key) => {
      expect(detectInAppBrowser(UA[key])).toBeNull();
      expect(checkBrowser({ ua: UA[key] }).kind).toBeNull();
    },
  );

  it('a home-screen app is not an app’s browser, even with no Safari token', () => {
    expect(detectInAppBrowser(UA.wkWebView, { standalone: true })).toBeNull();
    // A named app is still that app.
    expect(detectInAppBrowser(UA.instagramIos, { standalone: true })?.id).toBe('instagram');
  });

  it('copes with no user agent at all', () => {
    expect(detectInAppBrowser('')).toBeNull();
    expect(detectInAppBrowser(undefined)).toBeNull();
    expect(checkBrowser().kind).toBeNull();
  });
});

describe('does storage work?', () => {
  it('a write that reads back is fine', () => {
    expect(storageWorks(() => memory())).toBe(true);
  });
  it('throwing on the bare read, on setItem, or not keeping the value is broken', () => {
    expect(storageWorks(() => { throw new Error('SecurityError'); })).toBe(false);
    expect(storageWorks(() => throwing())).toBe(false);
    expect(storageWorks(() => ({ setItem() {}, getItem: () => null, removeItem() {} }))).toBe(false);
    expect(storageWorks(() => null)).toBe(false);
  });
  it('broken storage wins over an app’s browser, and keeps the app for the steps', () => {
    const s = checkBrowser({ ua: UA.instagramIos, storageOk: false });
    expect(s).toEqual({ kind: 'no-storage', app: { id: 'instagram', name: 'Instagram' }, platform: 'ios' });
    expect(checkBrowser({ ua: UA.instagramIos }).kind).toBe('in-app');
  });
});

describe('a private window is only a hint', () => {
  const nav = (storage) => ({ storage });
  it('a small quota hints private', async () => {
    expect(await privateHint(nav({ estimate: async () => ({ quota: 50 * 1024 * 1024 }), persisted: async () => false }))).toBe(true);
  });
  it('a normal quota, persisted storage, or no storage API says nothing', async () => {
    expect(await privateHint(nav({ estimate: async () => ({ quota: 4 * 1024 * 1024 * 1024 }), persisted: async () => false }))).toBe(false);
    expect(await privateHint(nav({ estimate: async () => ({ quota: SMALL_QUOTA / 2 }), persisted: async () => true }))).toBe(false);
    expect(await privateHint(nav(undefined))).toBe(false);
    expect(await privateHint(undefined)).toBe(false);
  });
  it('Safari’s private file-system refusal hints private; other refusals don’t', async () => {
    const big = async () => ({ quota: 4e9 });
    expect(await privateHint(nav({ estimate: big, getDirectory: async () => { throw new Error('UnknownError: unknown transient reason'); } }))).toBe(true);
    expect(await privateHint(nav({ estimate: big, getDirectory: async () => { throw new Error('NotAllowedError'); } }))).toBe(false);
  });
  it('an API that throws is not a crash', async () => {
    expect(await privateHint(nav({ estimate: async () => { throw new Error('x'); } }))).toBe(false);
  });
});

const IG = { kind: 'in-app', app: { id: 'instagram', name: 'Instagram' }, platform: 'ios' };
const FB_ANDROID = { kind: 'in-app', app: { id: 'facebook', name: 'Facebook' }, platform: 'android' };
const TIKTOK = { kind: 'in-app', app: { id: 'tiktok', name: 'TikTok' }, platform: 'ios' };
const WEBVIEW = { kind: 'in-app', app: { id: 'webview', name: null }, platform: 'ios' };
const PRIVATE = { kind: 'private', app: null, platform: 'ios' };
const NO_STORAGE = { kind: 'no-storage', app: null, platform: 'other' };
const text = (h) => plainText(h);

describe('the warning', () => {
  it('nothing wrong, nothing drawn; hidden, nothing drawn', () => {
    expect(browserWarningHtml({ kind: null }, { start: true })).toBe('');
    expect(browserWarningHtml(IG, { start: true, dismissed: true })).toBe('');
  });

  it('Simple, Instagram on iPhone: what happens, then numbered steps that say “look for”', () => {
    const h = browserWarningHtml(IG, { start: true, simple: true, url: 'https://play.multiversegames.ai/reclaim-city/' });
    expect(text(h)).toContain('Instagram’s browser won’t save your progress. If you close it, you start over. To keep your progress:');
    expect(h).toContain('<ol class="bw-steps"><li>Tap ••• at the top right.</li><li>Look for “Open in external browser”.</li><li>No menu? Tap “Copy the link”. Then paste it into Safari.</li></ol>');
    expect(h).toContain('data-bw="copy">Copy the link</button>');
    expect(h).toContain('value="https://play.multiversegames.ai/reclaim-city/"');
    expect(h).toContain('data-bw="hide"');
    expect(h).not.toMatch(/cookie/i);
  });

  it('Facebook, TikTok and an unknown app get their own steps', () => {
    expect(fixSteps(FB_ANDROID).slice(0, 2)).toEqual(['Tap ⋮ at the top right. On some phones it’s at the bottom.', 'Look for “Open in Chrome” or “Open in browser”.']);
    expect(fixSteps(TIKTOK).slice(0, 2)).toEqual(['Tap ••• or the share arrow.', 'Look for “Open in browser”.']);
    expect(text(browserWarningHtml(WEBVIEW, { start: true }))).toContain('This app’s browser won’t save your progress.');
    expect(fixSteps(WEBVIEW)[0]).toBe('Look for ••• or a share button, at the top or the bottom.');
  });

  it('a private window says it only looks like one, and to use a normal window', () => {
    const t = text(browserWarningHtml(PRIVATE, { start: true }));
    expect(t).toContain('This looks like a private window. Private windows forget everything when you close them. Open this page in a normal window to keep your progress.');
    expect(fixSteps(PRIVATE)).toEqual(['Tap “Copy the link”.', 'Open a normal window. Not a private one.', 'Paste the link there.']);
  });

  it('broken storage says progress can’t be saved here', () => {
    const t = text(browserWarningHtml(NO_STORAGE, { start: true }));
    expect(t).toContain('This browser can’t save your progress. You can still play. But if you leave, you start over.');
    expect(fixSteps(NO_STORAGE)[1]).toBe('Open Safari (iPhone) or Chrome (Android) in a normal window. Not a private one.');
  });

  it('Advanced is shorter, with the same facts and the copy button', () => {
    for (const s of [IG, PRIVATE, NO_STORAGE]) {
      const adv = browserWarningHtml(s, { start: true, simple: false });
      const simple = browserWarningHtml(s, { start: true, simple: true });
      expect(text(adv).length).toBeLessThan(text(simple).length);
      expect(adv).toContain('data-bw="copy"');
      expect(adv).not.toContain('bw-steps');
    }
    expect(text(browserWarningHtml(IG, { start: true, simple: false }))).toContain('Instagram’s browser won’t save your progress.');
  });

  it('other screens get a slim bar that opens into the steps', () => {
    const slim = browserWarningHtml(IG, { start: false });
    expect(slim).toContain('bw--slim');
    expect(slim).toContain('data-bw="open" aria-expanded="false">How to fix</button>');
    expect(slim).toContain('aria-label="Hide this warning"');
    expect(slim).not.toContain('bw-steps');
    const opened = browserWarningHtml(IG, { start: false, open: true });
    expect(opened).toContain('bw-steps');
    expect(opened).toContain('Show less');
  });

  it('copy rules: curly apostrophes, no straight quotes in the words', () => {
    for (const s of [IG, FB_ANDROID, TIKTOK, WEBVIEW, PRIVATE, NO_STORAGE]) {
      for (const simple of [true, false]) {
        for (const start of [true, false]) {
          const t = text(browserWarningHtml(s, { start, simple, url: '' }));
          expect(t).not.toMatch(/['"]/);
        }
      }
    }
  });

  it('is never in the read-aloud lines: it lives outside #app', () => {
    const src = readFileSync('src/components/browser-warning.js', 'utf8');
    expect(src).not.toMatch(/data-say|data-read-tools/);
  });
});

describe('the lines that promised saving', () => {
  const simple = () => setReadLevel(createInitialState(), 'simplest');
  it('in a normal browser, they still promise it', () => {
    expect(renderNext(simple())).toContain('Your progress is saved on this phone. You can stop and come back any time.');
    expect(renderPasswordFinder(simple())).toContain('Your answers stay on this phone. You can stop and come back any time.');
    expect(renderSaints(createInitialState())).toContain('Candles stay on this phone.');
    expect(devicesAsk(simple())).toContain('Your answers stay on this phone.');
  });

  it('in an app’s browser, a private window or broken storage, they say it won’t keep', () => {
    setBrowserStatus(IG);
    let next = renderNext(simple());
    expect(next).not.toMatch(/saved on this phone|come back any time/);
    expect(next).toContain('This browser won’t keep your progress. Open this page in Safari to save it.');
    expect(renderPasswordFinder(simple())).toContain('This browser won’t keep your answers. Open this page in Safari to save them.');
    expect(renderSaints(createInitialState())).not.toContain('Candles stay on this phone.');
    expect(devicesAsk(simple())).not.toContain('stay on this phone');
    expect(devicesAsk(simple())).toContain('Your answers aren’t sent anywhere.');

    setBrowserStatus(PRIVATE);
    expect(renderNext(simple())).toContain('This private window won’t keep your progress. Open this page in a normal window to save it.');

    setBrowserStatus(NO_STORAGE);
    next = renderNext(simple());
    expect(next).toContain('This browser can’t save your progress. Open this page in a normal Safari or Chrome window to save it.');
    expect(renderPasswordFinder(simple())).not.toMatch(/stay on this phone|come back any time/);
  });

  it('no other screen promises the save stays on this phone', () => {
    const files = ['src/screens/next.js', 'src/screens/password-finder.js', 'src/screens/saints.js', 'src/components/walkthrough.js'];
    for (const f of files) expect(readFileSync(f, 'utf8')).not.toMatch(/saved on this phone|stay on this phone|come back any time/);
    expect(saveNote('next', { kind: null })).toContain('come back any time');
  });
});

describe('when localStorage throws', () => {
  it('the save functions never crash', () => {
    const bad = throwing();
    expect(() => saveState(createInitialState(), bad)).not.toThrow();
    expect(loadState(bad).version).toBe(1);
    expect(hasSavedState(bad)).toBe(false);
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    try {
      expect(() => saveState(createInitialState())).not.toThrow();
      expect(loadState().version).toBe(1);
      expect(storageWorks()).toBe(false);
      expect(() => renderNext(setReadLevel(createInitialState(), 'simplest'))).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: memory() });
    }
  });
});

// A tiny fake page: #app with a parent, so the warning can sit above it.
function fakePage() {
  const listeners = {};
  const host = {
    id: '', innerHTML: '', isConnected: true,
    addEventListener: (t, fn) => { listeners[t] = fn; },
    querySelector: () => null,
  };
  const inserted = [];
  const app = { parentNode: { insertBefore: (el) => inserted.push(el) }, focus() {} };
  vi.stubGlobal('document', { getElementById: (id) => (id === 'app' ? app : null), createElement: () => host });
  vi.stubGlobal('location', { origin: 'https://play.multiversegames.ai', pathname: '/reclaim-city/' });
  const click = (bw) => listeners.click({ target: { closest: () => ({ dataset: { bw } }) } });
  return { host, inserted, click };
}

describe('the live warning', () => {
  it('Instagram on iPhone: full on the start page, slim after, and Hide works with storage broken', async () => {
    const page = fakePage();
    vi.stubGlobal('navigator', { userAgent: UA.instagramIos });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    try {
      initBrowserWarning();
      expect(browserStatus().kind).toBe('no-storage');
      expect(browserStatus().app.id).toBe('instagram');
      syncBrowserWarning({ start: true, simple: true });
      expect(page.inserted).toHaveLength(1);
      expect(page.host.innerHTML).toContain('bw--full');
      expect(page.host.innerHTML).toContain('value="https://play.multiversegames.ai/reclaim-city/"');
      syncBrowserWarning({ start: false });
      expect(page.host.innerHTML).toContain('bw--slim');
      page.click('open');
      expect(page.host.innerHTML).toContain('bw-steps');
      page.click('hide');
      expect(page.host.innerHTML).toBe('');
      syncBrowserWarning({ start: true });
      expect(page.host.innerHTML).toBe('');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: memory() });
    }
  });

  it('a real browser draws nothing and adds nothing to the page', () => {
    const page = fakePage();
    vi.stubGlobal('navigator', { userAgent: UA.safariIos });
    initBrowserWarning();
    syncBrowserWarning({ start: true });
    expect(browserStatus().kind).toBeNull();
    expect(page.inserted).toHaveLength(0);
  });

  it('sends one event, with only the kind and an app id from the list', async () => {
    fakePage();
    const umami = { track: vi.fn() };
    vi.stubGlobal('umami', umami);
    vi.stubGlobal('navigator', { userAgent: UA.tiktokAndroid });
    initBrowserWarning();
    syncBrowserWarning({ start: true });
    syncBrowserWarning({ start: false });
    await new Promise((r) => setTimeout(r, 0));
    expect(umami.track).toHaveBeenCalledTimes(1);
    expect(umami.track).toHaveBeenCalledWith('browser-warning-shown', { kind: 'in-app', app: 'tiktok' });
  });
});
