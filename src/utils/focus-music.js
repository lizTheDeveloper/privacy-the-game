// Focus music: calm tracks the player can switch on while doing a mission's steps
// (Liz, 2026-11-13: music that helps people stay focused and remember what they were doing).
//
// On a phone the music keeps playing while the player is off in Settings or another app, and the
// lock screen / notification shows what they were doing: "Step 3 of 5 · Turn off ad sharing".
// The lock screen's "next" button ticks that step (the game's own DONE), so nobody has to come
// back just to tick it. Never autoplays: it starts only from the player's tap on Focus music,
// and stops on a reload. Nothing about it is saved or sent.

// The calm tracks from Cultures of the Belt, the studio's other game (Liz, 2026-11-13: "use
// cultures of the belt but don't autoplay"). Both games are served from the same play portal,
// so the path is relative and same-origin on either domain; nothing is copied here. Its
// battle, grief and bedtime tracks are left out: this is music to work to.
const COTB = '../cultures-of-the-belt/assets/music/';
export const PLAYLIST = [
  'Focus and Mine.mp3',
  'Mine Quietly.mp3',
  'The Cosmos is Peaceful.mp3',
  'You Make Progress Over Time (longer).mp3',
  'Space is Deep.mp3',
  'Begin Slowly.mp3',
  'We Are All In This Together.mp3',
].map((f) => COTB + encodeURIComponent(f));

let audio = null;
let track = 0;

function el() {
  if (audio || typeof Audio === 'undefined') return audio;
  audio = new Audio(PLAYLIST[track]);
  audio.volume = 0.35;
  audio.preload = 'none';
  // One track after another, round and round. Nothing starts on its own: only a tap plays.
  audio.addEventListener('ended', () => {
    track = (track + 1) % PLAYLIST.length;
    audio.src = PLAYLIST[track];
    audio.play().catch(() => {});
  });
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
