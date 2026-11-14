// Focus music: a calm loop the player can switch on while doing a mission's steps
// (Liz, 2026-11-13: music that helps people stay focused and remember what they were doing).
//
// On a phone the music keeps playing while the player is off in Settings or another app, and the
// lock screen / notification shows what they were doing: "Step 3 of 5 · Turn off ad sharing".
// The lock screen's "next" button ticks that step (the game's own DONE), so nobody has to come
// back just to tick it. Off until the player turns it on; the choice stays in this browser.

const SRC = 'assets/audio/focus-loop.mp3';
let audio = null;

export function musicOn(state) {
  return Boolean(state?.focusMusic);
}

export function setMusic(state, on) {
  return { ...state, focusMusic: Boolean(on) };
}

function el() {
  if (audio || typeof Audio === 'undefined') return audio;
  audio = new Audio(SRC);
  audio.loop = true;
  audio.volume = 0.35;
  audio.preload = 'none';
  return audio;
}

// Start (from a tap: browsers only play after one). Resolves false when the browser says no.
export async function playMusic() {
  const a = el();
  if (!a) return false;
  try {
    await a.play();
    return true;
  } catch {
    return false;
  }
}

export function pauseMusic() {
  audio?.pause();
}

export function isPlaying() {
  return Boolean(audio && !audio.paused);
}

// What the lock screen says. `step` is the plain text of the next step, or null when all done.
export function nowPlayingText({ missionTitle, progress, stepText }) {
  if (!progress || !progress.total) return { title: missionTitle, artist: 'Reclaim City' };
  if (progress.current === -1) return { title: 'All steps done · file your report', artist: `Reclaim City · ${missionTitle}` };
  const step = String(stepText || '').replace(/\s+/g, ' ').trim();
  const short = step.length > 70 ? `${step.slice(0, 67).trimEnd()}…` : step;
  return { title: `Step ${progress.current + 1} of ${progress.total} · ${short}`, artist: `Reclaim City · ${missionTitle}` };
}

// Tell the phone what the player is doing, and what "next" on the lock screen does.
export function showNowPlaying(text, { onNext, onPlay, onPause } = {}) {
  const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : null;
  if (!ms || typeof window.MediaMetadata !== 'function') return;
  ms.metadata = new window.MediaMetadata({
    title: text.title,
    artist: text.artist,
    artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
  });
  const set = (action, fn) => { try { ms.setActionHandler(action, fn || null); } catch { /* not supported */ } };
  set('nexttrack', onNext);
  set('play', onPlay);
  set('pause', onPause);
}
