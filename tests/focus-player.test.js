// The pop-out focus-music window (src/focus-player.js): plays the same calm playlist, answers
// the game over the channel, starts where the page left off, and says when it has closed.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLAYLIST, TRACK_NAMES, CHANNEL } from '../src/utils/focus-music.js';

afterEach(() => vi.unstubAllGlobals());

function fakeWindow(search = '') {
  const els = {};
  const el = (id) => (els[id] ||= { id, listeners: {}, dataset: {}, textContent: '', innerHTML: '', value: '', attrs: {},
    addEventListener(t, fn) { this.listeners[t] = fn; }, setAttribute(k, v) { this.attrs[k] = v; } });
  const audios = [];
  class FakeAudio {
    constructor(src) { this.src = src; this.paused = true; this.volume = 1; this.listeners = {}; audios.push(this); }
    addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); }
    emit(t) { for (const fn of this.listeners[t] || []) fn(); }
    play() { this.paused = false; this.emit('play'); return Promise.resolve(); }
    pause() { this.paused = true; this.emit('pause'); }
  }
  const chans = [];
  class FakeChannel { constructor(n) { this.name = n; this.sent = []; chans.push(this); } postMessage(m) { this.sent.push(m); } }
  const winListeners = {};
  const store = new Map();
  const win = {
    location: { search },
    Audio: FakeAudio,
    BroadcastChannel: FakeChannel,
    navigator: {},
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
    addEventListener: (t, fn) => { winListeners[t] = fn; },
    open: vi.fn(),
  };
  const doc = { getElementById: el };
  return { win, doc, els, audios, chans, winListeners };
}

describe('focus-music pop-out window', () => {
  it('starts the track the page was on and tells the game it is playing', async () => {
    const { startPlayer } = await import('../src/focus-player.js');
    const f = fakeWindow('?track=2&t=40');
    startPlayer(f.doc, f.win);
    await Promise.resolve();
    expect(f.audios[0].src).toBe(PLAYLIST[2]);
    expect(f.els.title.textContent).toBe(TRACK_NAMES[2]);
    const ch = f.chans[0];
    expect(ch.name).toBe(CHANNEL);
    expect(ch.sent.at(-1)).toEqual({ type: 'state', playing: true });
  });

  it('answers hello, play and pause from the game, and says closed when it goes', async () => {
    const { startPlayer } = await import('../src/focus-player.js');
    const f = fakeWindow();
    startPlayer(f.doc, f.win);
    await Promise.resolve();
    const ch = f.chans[0];
    ch.onmessage({ data: { type: 'pause' } });
    expect(f.audios[0].paused).toBe(true);
    expect(ch.sent.at(-1)).toEqual({ type: 'state', playing: false });
    ch.onmessage({ data: { type: 'play' } });
    await Promise.resolve();
    expect(f.audios[0].paused).toBe(false);
    ch.sent.length = 0;
    ch.onmessage({ data: { type: 'hello' } });
    expect(ch.sent).toEqual([{ type: 'state', playing: true }]);
    f.winListeners.pagehide();
    expect(ch.sent.at(-1)).toEqual({ type: 'closed' });
  });

  it('goes round the playlist: next after the last track is the first', async () => {
    const { startPlayer } = await import('../src/focus-player.js');
    const f = fakeWindow(`?track=${PLAYLIST.length - 1}`);
    const p = startPlayer(f.doc, f.win);
    f.audios[0].emit('ended');
    expect(p.track).toBe(0);
    expect(f.audios[0].src).toBe(PLAYLIST[0]);
  });

  it('a nonsense track number starts at a real track', async () => {
    const { startPlayer } = await import('../src/focus-player.js');
    const f = fakeWindow('?track=99&t=-5');
    const p = startPlayer(f.doc, f.win);
    expect(p.track).toBe(PLAYLIST.length - 1);
  });

  it('every track has a name and the page loads the player', () => {
    expect(TRACK_NAMES).toHaveLength(PLAYLIST.length);
    const html = readFileSync(new URL('../src/focus-music.html', import.meta.url), 'utf8');
    expect(html).toContain('src="focus-player.js"');
  });
});
