// "Read it to me". Scout reads, in his own recorded voice (utils/voice-line.js), line by line.
// The game only asks the server for a line on Scout's list (data/voice-ids.txt: the game's own
// words). Any other line, such as one with the player's own numbers or a mission they made, is
// read by the browser's own speech (speechSynthesis) on the device and is never sent anywhere,
// not even as a hash. So is a listed line the server can't record right now.

import { voiceText, voiceId } from './voice-line.js';

const IDS_URL = 'data/voice-ids.txt';
let ids = null;
let idsLoading = null;

// The list, fetched once, the first time someone taps Read it to me. No list: the browser reads.
function loadIds() {
  if (ids) return Promise.resolve(ids);
  if (!idsLoading) {
    idsLoading = (typeof fetch === 'function' ? fetch(IDS_URL).then((r) => (r.ok ? r.text() : '')) : Promise.resolve(''))
      .catch(() => '')
      .then((t) => { ids = new Set(t.split('\n').filter((x) => /^[0-9a-f]{16}$/.test(x))); return ids; });
  }
  return idsLoading;
}

export function _setVoiceIds(list) { ids = list ? new Set(list) : null; idsLoading = null; }

let speaking = false;
let audio = null;
let run = 0;
// One player for every line: once a tap has let it play, a phone lets it play the next screen's
// lines too, without a tap of their own (the switch reads each screen as it comes).
let player = null;
let unlocked = false;

function getPlayer() {
  if (!player && typeof window !== 'undefined' && typeof window.Audio === 'function') player = new window.Audio();
  return player;
}

// A tenth of a second of silence, to play inside a tap.
function silentWav() {
  const n = 800;
  const buf = new Uint8Array(44 + n);
  const dv = new DataView(buf.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) buf[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  w(36, 'data'); dv.setUint32(40, n, true); buf.fill(128, 44);
  let s = '';
  for (const b of buf) s += String.fromCharCode(b);
  return `data:audio/wav;base64,${btoa(s)}`;
}

// Call inside a tap. Phones only let a page make sound after one.
export function unlockAudio() {
  if (unlocked || typeof window === 'undefined') return;
  unlocked = true;
  const a = getPlayer();
  if (a) {
    try {
      a.src = silentWav();
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch { /* no sound on this device */ }
  }
  if (canSynth()) { try { window.speechSynthesis.speak(new window.SpeechSynthesisUtterance('')); } catch { /* none */ } }
}

export function audioUnlocked() {
  return unlocked;
}

export function _resetAudio() { player = null; unlocked = false; }

export function canSpeak() {
  return typeof window !== 'undefined' && (typeof window.Audio === 'function'
    || ('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'));
}

const canSynth = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

function synthLine(text, done) {
  if (!canSynth()) return done();
  const u = new window.SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.lang = 'en-US';
  u.onend = done;
  u.onerror = done;
  window.speechSynthesis.speak(u);
}

// The buffer (Liz 2026-11-18: "once you've toggled it on we're gathering the next few … so they
// have it in the buffer … don't unload right away either"). Clips fetched ahead are kept in
// memory for the visit, the most recent MAX_CLIPS of them, so going back a step plays at once.
// A line not here yet streams from the server as before.
const MAX_CLIPS = 80;
const clips = new Map(); // url -> Promise of an object URL (or null)
const ready = new Map(); // url -> object URL, once fetched

function fetchClip(url) {
  if (clips.has(url)) {
    const p = clips.get(url);
    clips.delete(url);
    clips.set(url, p);
    return p;
  }
  if (typeof fetch !== 'function' || typeof URL?.createObjectURL !== 'function') return Promise.resolve(null);
  const p = fetch(url)
    .then((r) => (r.ok ? r.blob() : null))
    .then((b) => {
      if (!b || !clips.has(url)) return null;
      const u = URL.createObjectURL(b);
      ready.set(url, u);
      return u;
    })
    .catch(() => null);
  clips.set(url, p);
  while (clips.size > MAX_CLIPS) {
    const [old] = clips.keys();
    clips.delete(old);
    const u = ready.get(old);
    ready.delete(old);
    // Not while it's playing.
    if (u && player?.src !== u) URL.revokeObjectURL(u);
  }
  return p;
}

// Fetch these lines' recordings ahead, one after another (gentle on the server). Only lines on
// Scout's list: anything else is the browser's voice and never leaves the phone.
export async function prefetch(lines) {
  const list = (Array.isArray(lines) ? lines : [lines]).map(voiceText).filter(Boolean);
  if (!list.length) return;
  await loadIds();
  for (const line of list) {
    const url = recordingUrl(line);
    if (url) await fetchClip(url);
  }
}

export function _bufferedUrl(url) { return ready.get(url) || null; }
export function _resetBuffer() { clips.clear(); ready.clear(); }

export function recordingUrl(text, list = ids) {
  const id = voiceId(text);
  return list && list.has(id) ? `api/voice/${id}.mp3` : null;
}

function playLine(text, done, fail) {
  const url = recordingUrl(text);
  const a = url && getPlayer();
  if (!a) return fail();
  audio = a;
  a.onended = done;
  a.onerror = fail;
  a.src = ready.get(url) || url;
  const p = a.play();
  if (p && typeof p.catch === 'function') p.catch(fail);
}

// text: one string, or the lines in order (each its own recording). A second tap while
// Scout is reading stops him. Returns false when there is nothing to read or no way to say it.
export function speak(text) {
  if (speaking) {
    stopSpeaking();
    return false;
  }
  const lines = (Array.isArray(text) ? text : [text]).map(voiceText).filter(Boolean);
  if (!canSpeak() || !lines.length) return false;
  const mine = ++run;
  speaking = true;
  // The rest of this screen downloads while the first line plays.
  if (lines.length > 1) loadIds().then(() => prefetch(lines.slice(1)));
  const next = (i) => {
    if (mine !== run) return;
    if (!ids) { loadIds().then(() => next(i)); return; }
    if (i >= lines.length) { speaking = false; audio = null; return; }
    let moved = false;
    const go = () => { if (!moved) { moved = true; next(i + 1); } };
    // No recording: the browser reads this one line, then Scout carries on.
    const fallback = () => { if (!moved && mine === run) { audio = null; synthLine(lines[i], go); } };
    playLine(lines[i], go, fallback);
  };
  next(0);
  return true;
}

// Read these now, from the start, whatever was being read before (the switch, on a new screen).
export function sayNow(text) {
  stopSpeaking();
  return speak(text);
}

export function stopSpeaking() {
  speaking = false;
  run += 1;
  if (audio) { try { audio.pause(); } catch { /* already gone */ } audio = null; }
  if (canSynth()) window.speechSynthesis.cancel();
}
