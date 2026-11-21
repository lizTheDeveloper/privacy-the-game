import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { isCabinetMode, announceReady, CAMPUS_ORIGIN } from '../src/utils/cabinet.js';
import { renderHud } from '../src/components/hud.js';
import { loadState, saveState, hasSavedState } from '../src/state.js';
import { shouldAskPermission, markAsked, checkStreakReminder } from '../src/utils/notifications.js';

function fakeWindow({ framed = true, search = '?cabinet=campus' } = {}) {
  const parent = { postMessage: vi.fn() };
  const win = { location: { search }, parent, top: framed ? {} : null };
  win.self = win;
  if (!framed) win.top = win;
  return win;
}

const hudState = { streak: { current: 0 }, accounts: {}, missions: {}, vehicles: [] };

afterEach(() => vi.unstubAllGlobals());

describe('cabinet mode detection', () => {
  it('is on only when framed and ?cabinet=campus', () => {
    expect(isCabinetMode(fakeWindow())).toBe(true);
    expect(isCabinetMode(fakeWindow({ framed: false }))).toBe(false);
    expect(isCabinetMode(fakeWindow({ search: '' }))).toBe(false);
    expect(isCabinetMode(fakeWindow({ search: '?cabinet=other' }))).toBe(false);
    expect(isCabinetMode(fakeWindow({ search: '?x=1&cabinet=campus' }))).toBe(true);
    expect(isCabinetMode(undefined)).toBe(false);
  });
});

describe('mg:ready handshake', () => {
  it('posts the ready message to the campus origin only, once', () => {
    const win = fakeWindow();
    expect(announceReady(win)).toBe(true);
    expect(announceReady(win)).toBe(false);
    expect(win.parent.postMessage).toHaveBeenCalledTimes(1);
    expect(win.parent.postMessage).toHaveBeenCalledWith(
      { type: 'mg:ready', v: 1, game: 'reclaim-city' },
      'https://campus.themultiverse.school',
    );
    expect(CAMPUS_ORIGIN).toBe('https://campus.themultiverse.school');
  });

  it('posts nothing outside cabinet mode', () => {
    const unframed = fakeWindow({ framed: false });
    const noQuery = fakeWindow({ search: '' });
    expect(announceReady(unframed)).toBe(false);
    expect(announceReady(noQuery)).toBe(false);
    expect(unframed.parent.postMessage).not.toHaveBeenCalled();
    expect(noQuery.parent.postMessage).not.toHaveBeenCalled();
  });

  it('never throws if the parent refuses the message', () => {
    const win = fakeWindow();
    win.parent.postMessage = () => { throw new Error('nope'); };
    expect(() => announceReady(win)).not.toThrow();
  });
});

describe('real-money asks', () => {
  it('HUD shows SUPPORT US and Patreon outside cabinet mode', () => {
    vi.stubGlobal('window', fakeWindow({ framed: false }));
    const html = renderHud(hudState);
    expect(html).toContain('>$</span>Support us<');
    expect(html).toContain('buy.stripe.com');
    expect(html).toContain('patreon.com');
  });

  it('HUD hides every money ask in cabinet mode, keeps the rest', () => {
    vi.stubGlobal('window', fakeWindow());
    const html = renderHud(hudState);
    expect(html).not.toMatch(/stripe|patreon|SUPPORT/i);
    expect(html).toContain('RECLAIM CITY');
    expect(html).toContain('data-hud-more');
    expect(html).toContain('data-bug-report');
    expect(renderHud({ ...hudState, reading: { level: 'full' } })).toContain('INTEGRITY');
  });
});

describe('storage-blocked frame', () => {
  function blockStorage() {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('The operation is insecure.', 'SecurityError'); },
    });
  }
  afterEach(() => { delete globalThis.localStorage; });

  it('state load/save/has do not throw when localStorage access throws', () => {
    blockStorage();
    expect(() => loadState()).not.toThrow();
    expect(loadState().accounts).toBeTruthy();
    expect(hasSavedState()).toBe(false);
    expect(() => saveState(loadState())).not.toThrow();
  });

  it('notification helpers do not throw either', () => {
    blockStorage();
    vi.stubGlobal('window', { Notification: {} });
    vi.stubGlobal('navigator', { serviceWorker: {} });
    vi.stubGlobal('Notification', { permission: 'granted' });
    expect(() => shouldAskPermission({ missions: {} })).not.toThrow();
    expect(() => markAsked()).not.toThrow();
    expect(() => checkStreakReminder({ missions: {}, streak: {} })).not.toThrow();
  });
});

describe('index.html', () => {
  const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  it('service worker registration is inside try/catch (a blocked frame throws on access)', () => {
    const m = html.match(/<script>\s*(?:\/\/[^\n]*\n\s*)?try\s*\{[\s\S]*?serviceWorker[\s\S]*?\}\s*catch/);
    expect(m).toBeTruthy();
  });
});
