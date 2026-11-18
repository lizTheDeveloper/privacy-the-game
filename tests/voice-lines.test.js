import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { collectVoiceLines, VOICE_LINES_FILE } from '../scripts/voice-lines.mjs';
import { voiceId, voiceText } from '../src/utils/voice-line.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { MISSIONS } from '../src/data/missions.js';

const LIST = JSON.parse(readFileSync(VOICE_LINES_FILE, 'utf8'));
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
const readLines = (html) => {
  const m = /data-say-lines="([^"]*)"/.exec(html);
  return m ? JSON.parse(decode(m[1])) : null;
};

describe('Scout’s recorded lines (Liz 2026-11-17)', () => {
  it('collective/voice-lines.json is up to date (run node scripts/voice-lines.mjs)', () => {
    expect(LIST).toEqual(collectVoiceLines());
  });

  it('a line’s id is the hash of what is spoken, markup and menu arrows aside', () => {
    expect(voiceText('Open <b>Settings</b> → Privacy > Location')).toBe('Open Settings, then Privacy, then Location');
    expect(voiceId('Open <b>Settings</b>')).toBe(voiceId('Open Settings'));
    expect(voiceId('a')).toMatch(/^[0-9a-f]{16}$/);
    expect(voiceId('a')).not.toBe(voiceId('b'));
  });

  it('every line the list holds is the game’s own words: no player data can be on it', () => {
    for (const [id, text] of Object.entries(LIST)) expect(voiceId(text), text).toBe(id);
  });

  it('what Read it to me says on a briefing, a step and a report is on the list, at both levels', () => {
    const missing = [];
    for (const m of MISSIONS.filter((x) => !x.legacy && /-recon-breach$/.test(x.id)).slice(0, 12)) {
      for (const level of ['simplest', 'full']) {
        const s = setReadLevel(createInitialState(), level);
        for (const html of [renderBriefing(s, m.id), renderBriefing(markMissionStarted(s, m.id), m.id), renderDebrief(s, m.id)]) {
          const lines = readLines(html);
          expect(lines, m.id).toBeTruthy();
          for (const l of lines) if (!LIST[voiceId(l)]) missing.push(`${m.id} ${level}: ${l}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
