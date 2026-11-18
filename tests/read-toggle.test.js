import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { topTools } from '../src/components/top-tools.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { setReadLevel, readAloudOn, setReadAloud } from '../src/utils/reading.js';
import { voiceId, voiceText } from '../src/utils/voice-line.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

// Liz 2026-11-18: "make read to me a toggle instead of a button you have to press every time …
// make it visibly like a toggle", then "stream or prefetch … the next few readings so that they
// have it in the buffer … don't unload right away either".
const app = readFileSync('src/app.js', 'utf8');

describe('Read it to me is a switch', () => {
  it('looks and reads as one: role="switch", on or off, a track and a knob', () => {
    const off = topTools(createInitialState(), 'simplest', 'Hello');
    expect(off).toMatch(/<button class="top-tool tt-switch" role="switch" aria-checked="false" data-action="read-aloud"/);
    expect(off).toContain('<span class="tt-track" aria-hidden="true"><span class="tt-knob"></span></span>');
    const on = topTools(setReadAloud(createInitialState(), true), 'simplest', 'Hello');
    expect(on).toMatch(/class="top-tool tt-switch is-on" role="switch" aria-checked="true"/);
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toMatch(/\.tt-switch\.is-on \.tt-knob \{ transform: translateX\(16px\)/);
  });

  it('is remembered on this phone', () => {
    expect(readAloudOn(createInitialState())).toBe(false);
    expect(readAloudOn(setReadAloud(createInitialState(), true))).toBe(true);
  });

  it('tapping it turns it on (and lets the phone play sound) or off (and stops Scout)', () => {
    const block = app.slice(app.indexOf("} else if (action === 'read-aloud') {"), app.indexOf("} else if (action === 'gear-pick'"));
    expect(block).toMatch(/if \(on\) \{\s*unlockAudio\(\);\s*setState\(recordSignal\(setReadAloud\(state, true\), 'readAloud'\)\);/);
    expect(block).toMatch(/\} else \{\s*stopSpeaking\(\);\s*setState\(setReadAloud\(state, false\)\);/);
  });

  it('on, every screen is read as it comes, once (a re-draw of the same screen doesn’t start over)', () => {
    const fn = app.slice(app.indexOf('function autoRead()'), app.indexOf('function render(route'));
    expect(fn).toContain("if (key === lastSaid) return;");
    expect(fn).toContain('sayNow(lines)');
    expect(app).toMatch(/setState\(state\);\n    \}\n    autoRead\(\);\n  \} catch \(error\) \{/);
  });

  it('a step screen hands over the next two steps to fetch ahead', () => {
    const s = setReadAloud(markMissionStarted(setReadLevel(createInitialState(), 'simplest'), 'gmail-recon-breach'), true);
    const h = renderBriefing(s, 'gmail-recon-breach');
    const next = JSON.parse(/data-say-next="([^"]*)"/.exec(h)[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    expect(next[0]).toMatch(/^On that website, type your Gmail email address/);
    expect(next[1]).toMatch(/^Read what it says\./);
  });
});

describe('the buffer', () => {
  let prev;
  let mod;
  afterEach(() => {
    mod?._resetBuffer();
    mod?._setVoiceIds(null);
    globalThis.fetch = prev;
  });

  it('fetches Scout’s listed lines ahead, keeps them, and plays from memory', async () => {
    mod = await import('../src/utils/read-aloud.js');
    prev = globalThis.fetch;
    const listed = 'Open the Passwords app on your iPhone.';
    const mine = 'You have 12 flagged passwords';
    const fetched = [];
    globalThis.fetch = async (url) => { fetched.push(url); return { ok: true, blob: async () => new Blob(['x'], { type: 'audio/mpeg' }) }; };
    mod._setVoiceIds([voiceId(voiceText(listed))]);
    await mod.prefetch([listed, mine]);
    const url = `api/voice/${voiceId(voiceText(listed))}.mp3`;
    // Only the listed line is asked for; the player's own line never leaves the phone.
    expect(fetched).toEqual([url]);
    expect(mod._bufferedUrl(url)).toMatch(/^blob:/);
    // Asked again (going back a step): no second download.
    await mod.prefetch([listed]);
    expect(fetched).toEqual([url]);
  });
});
