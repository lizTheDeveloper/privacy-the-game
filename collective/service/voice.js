// Scout's voice: /voice/<id>.mp3 (the game asks for reclaim-city/api/voice/<id>.mp3).
//
// Only lines on the list (voice-lines.json, built from the game's own words by
// scripts/voice-lines.mjs) are ever voiced, so the text sent to ElevenLabs is always the game's
// own, never anything a player typed, and the list caps what can ever be spent. A line is made
// the first time anyone asks for it and kept on disk; after that it is a file. A daily
// character budget stops a crawler spending a month's quota in an afternoon: past it, new lines
// get 503 and the game reads them with the browser's voice instead.
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export const SCOUT_VOICE_ID = 'PkXdd1CtcEwYvEaKpJSR'; // ElevenLabs "David – Space Adventurer Pirate" (Liz 2026-11-17)
const ID = /^[0-9a-f]{16}$/;

export function createVoice({
  linesFile = process.env.VOICE_LINES_FILE || '/voice/voice-lines.json',
  cacheDir = process.env.VOICE_CACHE_DIR || '/voice-cache',
  apiKey = process.env.ELEVENLABS_API_KEY || '',
  dailyChars = Number(process.env.VOICE_DAILY_CHARS || 150000),
  synth = (text) => elevenLabs(text, apiKey),
  now = () => Date.now(),
} = {}) {
  let lines = null;
  let linesAt = 0;
  let linesMtime = 0;
  const inflight = new Map();
  let day = '';
  let spent = 0;

  async function list() {
    // Re-read the list at most once a minute, and only when the file changed (a deploy).
    if (lines && now() - linesAt < 60_000) return lines;
    linesAt = now();
    try {
      const { mtimeMs } = await stat(linesFile);
      if (!lines || mtimeMs !== linesMtime) {
        lines = JSON.parse(await readFile(linesFile, 'utf8'));
        linesMtime = mtimeMs;
      }
    } catch {
      lines = lines || {};
    }
    return lines;
  }

  function budget(chars) {
    const today = new Date(now()).toISOString().slice(0, 10);
    if (today !== day) { day = today; spent = 0; }
    if (spent + chars > dailyChars) return false;
    spent += chars;
    return true;
  }

  // { status, body } — body is the mp3 for 200.
  async function clip(id) {
    if (!ID.test(id)) return { status: 404 };
    const file = join(cacheDir, `${id}.mp3`);
    try { return { status: 200, body: await readFile(file) }; } catch { /* not made yet */ }
    const text = (await list())[id];
    if (typeof text !== 'string') return { status: 404 };
    if (inflight.has(id)) return inflight.get(id);
    if (!budget(text.length)) return { status: 503 };
    const job = (async () => {
      try {
        const body = await synth(text);
        if (!body || !body.length) return { status: 503 };
        await mkdir(cacheDir, { recursive: true });
        const tmp = `${file}.${process.pid}.tmp`;
        await writeFile(tmp, body);
        await rename(tmp, file);
        return { status: 200, body };
      } catch {
        return { status: 503 };
      } finally {
        inflight.delete(id);
      }
    })();
    inflight.set(id, job);
    return job;
  }

  return { clip };
}

export async function elevenLabs(text, apiKey) {
  if (!apiKey) throw new Error('no key');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${SCOUT_VOICE_ID}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`elevenlabs ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
