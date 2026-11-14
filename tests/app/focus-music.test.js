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
