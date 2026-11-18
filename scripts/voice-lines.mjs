// The lines Scout has a recorded voice for (Liz 2026-11-17). Writes collective/voice-lines.json:
// { id: text } for every line of the game's own words that "Read it to me" can read. The voice
// service (collective/service) only ever voices a line on this list, so the list is also the
// most it can ever spend. Run after changing mission or dialogue text:
//   node scripts/voice-lines.mjs
// tests/voice-lines.test.js fails while the file is out of date.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MISSIONS } from '../src/data/missions.js';
import * as DIALOGUE from '../src/data/dialogue.js';
import { DEBRIEF_GREETINGS } from '../src/screens/debrief.js';
import { voiceId, voiceText } from '../src/utils/voice-line.js';

// Longer than this is not one line (ElevenLabs takes up to 10,000 characters a request).
export const MAX_LINE = 2500;

function strings(value, out, depth = 0) {
  if (depth > 6 || value == null) return;
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) strings(v, out, depth + 1);
  else if (typeof value === 'object') for (const v of Object.values(value)) strings(v, out, depth + 1);
}

export function collectVoiceLines() {
  const texts = [];
  for (const m of MISSIONS) {
    if (m.legacy) continue;
    texts.push(m.lead, m.simple?.lead, m.briefing, m.simple?.scout);
    strings(m.scoutDialog, texts);
    const steps = [...(m.steps || []), ...(m.simple?.steps || []), ...Object.values(m.stepsByManager || {}).flat()];
    for (const st of steps) {
      texts.push(st.text);
      for (const n of st.note || []) texts.push(n.label, n.text);
    }
    for (const q of m.debriefQs || []) {
      texts.push(q.label, q.hint, q.scout);
      for (const o of q.options || []) texts.push(o.text);
    }
  }
  for (const v of Object.values(DIALOGUE)) if (typeof v !== 'function') strings(v, texts);
  strings(DEBRIEF_GREETINGS, texts);
  texts.push('Follow the steps above and report back when you’re done.', 'Report back — what did you find?');
  const lines = {};
  for (const t of texts) {
    if (typeof t !== 'string') continue;
    const spoken = voiceText(t);
    if (!spoken || spoken.length > MAX_LINE || !/[a-z]/i.test(spoken)) continue;
    lines[voiceId(t)] = spoken;
  }
  return Object.fromEntries(Object.entries(lines).sort(([a], [b]) => a.localeCompare(b)));
}

export const VOICE_LINES_FILE = new URL('../collective/voice-lines.json', import.meta.url);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const lines = collectVoiceLines();
  writeFileSync(VOICE_LINES_FILE, `${JSON.stringify(lines, null, 0).replace(/","/g, '",\n"')}\n`);
  const chars = Object.values(lines).reduce((n, t) => n + t.length, 0);
  console.log(`${Object.keys(lines).length} lines, ${chars} characters`);
}
