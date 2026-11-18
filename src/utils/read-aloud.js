// "Read it to me". Scout reads, in his own recorded voice (utils/voice-line.js), line by line.
// A line the server has no recording for (or can't make right now) is read by the browser's own
// speech (speechSynthesis), which runs on the device. Nothing about the player is sent: the
// audio files are the game's own lines, fetched like its pictures.

import { voiceText, voiceUrl } from './voice-line.js';

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

function playLine(text, done, fail) {
  if (typeof window.Audio !== 'function') return fail();
  const a = new window.Audio(voiceUrl(text));
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
