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

export function recordingUrl(text, list = ids) {
  const id = voiceId(text);
  return list && list.has(id) ? `api/voice/${id}.mp3` : null;
}

function playLine(text, done, fail) {
  const url = recordingUrl(text);
  if (!url || typeof window.Audio !== 'function') return fail();
  const a = new window.Audio(url);
  audio = a;
  a.onended = done;
  a.onerror = fail;
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

export function stopSpeaking() {
  speaking = false;
  run += 1;
  if (audio) { try { audio.pause(); } catch { /* already gone */ } audio = null; }
  if (canSynth()) window.speechSynthesis.cancel();
}
