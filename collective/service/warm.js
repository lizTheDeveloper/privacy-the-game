// Records every line on Scout's list that has no recording yet, ahead of the first player who
// asks for it (Liz 2026-11-18: reroll Scout's voice for every changed line). Runs on the box, in
// the service's own image, so the voice, model and format are exactly voice.js's:
//
//   scripts/warm-voice.sh             # from the repo: records what is missing
//   scripts/warm-voice.sh --dry-run   # counts only, spends nothing
//
// A line is skipped when its file is already there and sound. Ids are a hash of the spoken text
// (src/utils/voice-line.js), so a changed line is a new id and lands here as missing; the old
// recording stays on disk, unused. A file that is not an mp3 or is shorter than about 0.2s
// (under 1,600 bytes at 64 kbps) is a bad recording and is made again.
//
// It spends from the same ElevenLabs quota as the service, so it checks what is left first and
// stops before the quota drops under --reserve characters (default 100,000), leaving room for
// players' first listens and the next text change. --max-chars caps one run. If the plan can't be
// read, or any limit isn't a number, it records nothing (fails closed); --allow-unknown-budget
// with --max-chars N spends at most N anyway. Requests go two at a time with a pause between
// them, and back off on 429 or 5xx.
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { elevenLabs } from './voice.js';

const ID = /^[0-9a-f]{16}$/;
export const MIN_BYTES = 1600; // ~0.2s at 64 kbps

// ID3 tag or an MPEG audio frame sync.
function looksLikeMp3(head) {
  return (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
}

// 'ok' | 'missing' | 'bad'
export async function recordingState(file, minBytes = MIN_BYTES) {
  let size;
  try { ({ size } = await stat(file)); } catch { return 'missing'; }
  if (size < minBytes) return 'bad';
  const head = (await readFile(file)).subarray(0, 3);
  return looksLikeMp3(head) ? 'ok' : 'bad';
}

// A NaN or negative allowance is 0.
const safe = (n) => (Number.isNaN(n) || n < 0 ? 0 : n);

function statusOf(err) {
  const m = /elevenlabs (\d{3})/.exec(String(err?.message || ''));
  return m ? Number(m[1]) : 0;
}

export async function warm({
  lines,
  cacheDir,
  synth,
  remaining = async () => null, // characters left on the ElevenLabs plan; null = unknown
  reserve = 100_000,
  maxChars = Infinity,
  allowUnknownBudget = false, // spend up to maxChars (which must be finite) when the plan can't be read
  concurrency = 2,
  pauseMs = 250,
  minBytes = MIN_BYTES,
  dryRun = false,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  log = () => {},
} = {}) {
  const todo = [];
  const counts = { lines: 0, ok: 0, missing: 0, bad: 0, made: 0, rerolled: 0, failed: 0, chars: 0, skippedForBudget: 0 };
  for (const [id, text] of Object.entries(lines)) {
    if (!ID.test(id) || typeof text !== 'string' || !text) continue;
    counts.lines++;
    const state = await recordingState(join(cacheDir, `${id}.mp3`), minBytes);
    counts[state]++;
    if (state !== 'ok') todo.push({ id, text, state });
  }
  counts.todoChars = todo.reduce((n, t) => n + t.text.length, 0);
  log(`${counts.lines} lines: ${counts.ok} recorded, ${counts.missing} missing, ${counts.bad} bad (${counts.todoChars} characters to record)`);
  if (dryRun || !todo.length) return counts;

  // Fails closed: an unreadable plan, a NaN or a negative number all mean nothing is spent.
  if (!Number.isFinite(reserve) || reserve < 0 || Number.isNaN(maxChars) || maxChars < 0) {
    counts.stopped = 'bad limits';
    log('reserve and max chars must be numbers >= 0; recording nothing');
    return counts;
  }
  const budgetFrom = (left) => {
    if (Number.isFinite(left)) return safe(Math.min(maxChars, left - reserve));
    if (allowUnknownBudget && Number.isFinite(maxChars)) return safe(maxChars);
    return null;
  };
  const left = await remaining();
  let allowance = budgetFrom(left);
  if (allowance === null) {
    counts.stopped = 'budget unknown';
    log('could not read the ElevenLabs plan; recording nothing (--allow-unknown-budget with --max-chars N overrides)');
    return counts;
  }
  log(`ElevenLabs characters left: ${Number.isFinite(left) ? left : 'unknown'}; keeping ${reserve} in reserve; this run may spend ${allowance}`);
  if (allowance === 0) { counts.stopped = 'no budget'; return counts; }
  await mkdir(cacheDir, { recursive: true });

  let next = 0;
  let sinceCheck = 0;
  let stop = false;
  const failed = [];
  async function worker() {
    while (!stop && next < todo.length) {
      const item = todo[next++];
      if (!(allowance > 0) || !(item.text.length <= allowance)) { counts.skippedForBudget++; continue; }
      allowance -= item.text.length;
      let body = null;
      for (let attempt = 0; attempt < 6 && !body; attempt++) {
        try {
          body = await synth(item.text);
          if (!body || body.length < minBytes || !looksLikeMp3(body)) throw new Error('bad audio');
        } catch (err) {
          body = null;
          const s = statusOf(err);
          if (s === 401 || s === 403) { stop = true; log(`ElevenLabs refused the key (${s}); stopping`); break; }
          if (s && s < 500 && s !== 429) break; // the request itself is wrong; trying again won't help
          await sleep(Math.min(60_000, 2000 * 2 ** attempt));
        }
      }
      if (!body) { counts.failed++; failed.push(item.id); allowance += item.text.length; continue; }
      const file = join(cacheDir, `${item.id}.mp3`);
      const tmp = `${file}.warm${process.pid}.tmp`;
      await writeFile(tmp, body);
      await rename(tmp, file);
      counts[item.state === 'bad' ? 'rerolled' : 'made']++;
      counts.chars += item.text.length;
      const done = counts.made + counts.rerolled;
      if (done % 50 === 0) log(`${done}/${todo.length} recorded, ${counts.chars} characters`);
      // Re-check the plan now and then: players are spending from it too.
      if (++sinceCheck >= 200) {
        sinceCheck = 0;
        const now = budgetFrom(await remaining());
        if (now === null) { stop = true; counts.stopped = 'budget unknown'; log('lost the ElevenLabs plan; stopping'); }
        else allowance = Math.min(allowance, now);
        if (allowance === 0) { stop = true; counts.stopped = 'no budget'; }
      }
      await sleep(pauseMs);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  if (failed.length) log(`failed: ${failed.join(' ')}`);
  return counts;
}

// Characters left on the plan, or null when that can't be known (any field missing or not a number).
export async function charactersLeft(apiKey, fetchImpl = fetch) {
  try {
    const res = await fetchImpl('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const s = await res.json();
    const { character_limit: limit, character_count: count } = s || {};
    if (typeof limit !== 'number' || typeof count !== 'number') return null;
    const left = limit - count;
    return Number.isFinite(left) ? left : null;
  } catch {
    return null;
  }
}

// A numeric flag: absent → fallback; present → a finite number >= 0, or the run refuses to start.
export function numberArg(argv, name, fallback) {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const raw = argv[i + 1];
  const n = raw === undefined || raw.trim() === '' ? NaN : Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`--${name} needs a number >= 0, got ${JSON.stringify(raw ?? '')}`);
  return n;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const linesFile = process.env.VOICE_LINES_FILE || '/voice/voice-lines.json';
  const cacheDir = process.env.VOICE_CACHE_DIR || '/voice-cache';
  const apiKey = process.env.ELEVENLABS_API_KEY || '';
  const dryRun = process.argv.includes('--dry-run');
  const log = (m) => console.log(`${new Date().toISOString()} ${m}`);
  if (!apiKey && !dryRun) { log('no ELEVENLABS_API_KEY'); process.exit(1); }
  let opts;
  try {
    opts = {
      reserve: numberArg(process.argv, 'reserve', 100_000),
      maxChars: numberArg(process.argv, 'max-chars', Infinity),
      concurrency: Math.max(1, Math.floor(numberArg(process.argv, 'concurrency', 2))),
      pauseMs: numberArg(process.argv, 'pause-ms', 250),
      // If the plan can't be read (say, a key without user_read), nothing is recorded unless this
      // is given together with --max-chars N, which is then the whole budget.
      allowUnknownBudget: process.argv.includes('--allow-unknown-budget'),
    };
    if (opts.allowUnknownBudget && !Number.isFinite(opts.maxChars)) throw new Error('--allow-unknown-budget needs --max-chars N');
  } catch (err) {
    log(err.message);
    process.exit(1);
  }
  const lines = JSON.parse(await readFile(linesFile, 'utf8'));
  const counts = await warm({
    ...opts,
    lines,
    cacheDir,
    dryRun,
    log,
    synth: (text) => elevenLabs(text, apiKey),
    remaining: () => charactersLeft(apiKey),
  });
  log(JSON.stringify(counts));
  process.exit(counts.failed || counts.stopped ? 2 : 0);
}
