// Focus music never autoplays (Liz, 2026-11-13): no track starts until the player taps
// Focus music, and it plays Cultures of the Belt's calm tracks from the same portal.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { bootApp } from '../helpers/app-harness.mjs';
import { createInitialState } from '../../src/state.js';
import { PLAYLIST } from '../../src/utils/focus-music.js';

vi.setConfig({ testTimeout: 30000 });
afterEach(() => vi.unstubAllGlobals());

function fakeAudio() {
  const made = [];
  class FakeAudio {
    constructor(src) { this.src = src; this.paused = true; this.plays = 0; this.listeners = {}; made.push(this); }
    addEventListener(t, fn) { this.listeners[t] = fn; }
    play() { this.plays += 1; this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  vi.stubGlobal('Audio', FakeAudio);
  return made;
}

describe('focus music', () => {
  it('nothing plays on load, on a briefing, or after a step is ticked', async () => {
    const made = fakeAudio();
    const h = await bootApp({ state: createInitialState(), hash: '#/mission/fitness-audit-data-sharing/briefing' });
    await h.click('read-level', { level: 'full' });
    expect(made.reduce((n, a) => n + a.plays, 0)).toBe(0);
  });

  it('a tap on Focus music plays the first track; a second tap pauses it; nothing is sent', async () => {
    const made = fakeAudio();
    const h = await bootApp({ state: createInitialState(), hash: '#/mission/fitness-audit-data-sharing/briefing' });
    h.clearEgress();
    await h.click('focus-music', {});
    expect(made).toHaveLength(1);
    expect(made[0].plays).toBe(1);
    expect(made[0].src).toBe(PLAYLIST[0]);
    await h.click('focus-music', {});
    expect(made[0].paused).toBe(true);
    expect(h.egress()).toEqual([]);
  });

  it('plays Cultures of the Belt’s calm tracks from the same portal, never its battle or grief music', () => {
    expect(PLAYLIST.length).toBeGreaterThan(3);
    for (const src of PLAYLIST) {
      expect(src.startsWith('../cultures-of-the-belt/assets/music/')).toBe(true);
      expect(decodeURIComponent(src)).not.toMatch(/attack|died|dying|unhappy|combat|bed|late/i);
    }
  });
});

// Liz, 2026-11-19: on a computer, pop the music out into a window of its own so the same music
// plays on through the whole game. The page and the window talk over a BroadcastChannel.
function fakeChannels() {
  const all = [];
  class FakeChannel {
    constructor(name) { this.name = name; this.sent = []; this.onmessage = null; all.push(this); }
    postMessage(m) { this.sent.push(m); }
    close() {}
  }
  vi.stubGlobal('BroadcastChannel', FakeChannel);
  return all;
}

const desktop = (on) => vi.fn((q) => ({ matches: on && /min-width: 900px/.test(q) && /pointer: fine/.test(q), addEventListener() {} }));

describe('focus music pops out on a computer', () => {
  it('a tap on a computer opens the pop-out window instead of playing in the page', async () => {
    const made = fakeAudio();
    fakeChannels();
    vi.stubGlobal('matchMedia', desktop(true));
    const h = await bootApp({ state: createInitialState(), hash: '#/mission/fitness-audit-data-sharing/briefing' });
    h.window.self = h.window; h.window.top = h.window;
    h.window.open.mockReturnValue({ focus() {} });
    h.clearEgress();
    await h.click('focus-music', {});
    expect(h.window.open).toHaveBeenCalledTimes(1);
    const [url, name, features] = h.window.open.mock.calls[0];
    expect(url).toMatch(/^focus-music\.html\?track=0&t=0$/);
    expect(name).toBe('reclaim-city-focus-music');
    expect(features).toMatch(/popup/);
    expect(made.reduce((n, a) => n + a.plays, 0)).toBe(0);
    expect(h.egress()).toEqual([]);
  });

  it('a blocked pop-up plays in the page instead', async () => {
    const made = fakeAudio();
    fakeChannels();
    vi.stubGlobal('matchMedia', desktop(true));
    const h = await bootApp({ state: createInitialState(), hash: '#/mission/fitness-audit-data-sharing/briefing' });
    h.window.self = h.window; h.window.top = h.window;
    h.window.open.mockReturnValue(null);
    await h.click('focus-music', {});
    expect(made[0].plays).toBe(1);
  });

  it('a phone plays in the page, never a pop-up', async () => {
    const made = fakeAudio();
    fakeChannels();
    vi.stubGlobal('matchMedia', desktop(false));
    const h = await bootApp({ state: createInitialState(), hash: '#/mission/fitness-audit-data-sharing/briefing' });
    h.window.self = h.window; h.window.top = h.window;
    await h.click('focus-music', {});
    expect(h.window.open).not.toHaveBeenCalled();
    expect(made[0].plays).toBe(1);
  });

  it('with the pop-out open, the button pauses and plays it over the channel; every screen shows Music on', async () => {
    fakeAudio();
    const chans = fakeChannels();
    vi.stubGlobal('matchMedia', desktop(true));
    const h = await bootApp({ state: createInitialState(), hash: '#/city' });
    const ch = chans.find((c) => c.name === 'reclaim-city-focus-music');
    expect(ch.sent).toContainEqual({ type: 'hello' });
    // The pop-out (left open from before a reload) says it is playing.
    ch.onmessage({ data: { type: 'state', playing: true } });
    await h.settle(10);
    expect(h.app.innerHTML).toContain('class="hud-music"');
    await h.click('focus-music', {});
    expect(ch.sent.at(-1)).toEqual({ type: 'pause' });
    ch.onmessage({ data: { type: 'state', playing: false } });
    await h.settle(10);
    expect(h.app.innerHTML).not.toContain('class="hud-music"');
    await h.click('focus-music', {});
    expect(ch.sent.at(-1)).toEqual({ type: 'play' });
    // Closed: the next tap opens a fresh window.
    ch.onmessage({ data: { type: 'closed' } });
    h.window.self = h.window; h.window.top = h.window;
    h.window.open.mockReturnValue({ focus() {} });
    await h.click('focus-music', {});
    expect(h.window.open).toHaveBeenCalledWith(expect.stringMatching(/^focus-music\.html/), 'reclaim-city-focus-music', expect.any(String));
  });
});
