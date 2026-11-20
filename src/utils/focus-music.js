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

// Each track's name, for the pop-out player and the computer's media keys.
export const TRACK_NAMES = [
  'Focus and Mine',
  'Mine Quietly',
  'The Cosmos is Peaceful',
  'You Make Progress Over Time',
  'Space is Deep',
  'Begin Slowly',
  'We Are All In This Together',
];

// On a computer the music pops out into a small window of its own (Liz, 2026-11-19: "pop it out
// on the desktop into a separate window ... the same music play throughout"). That window holds
// the music, so it keeps playing on every screen, through a reload, and while the player is in
// another tab doing a step. The game's buttons talk to it over a BroadcastChannel, which never
// leaves this browser. A phone (or a blocked pop-up, or the campus cabinet) plays in the page.
export const POPOUT_URL = 'focus-music.html';
export const POPOUT_NAME = 'reclaim-city-focus-music';
export const CHANNEL = 'reclaim-city-focus-music';
const POPOUT_FEATURES = 'popup,width=360,height=300';

let audio = null;
let track = 0;
// What the pop-out window last told us. alive: a pop-out is open; playing: its music is on.
const popout = { alive: false, playing: false };
let channel = null;
const listeners = new Set();

function notify() { for (const fn of listeners) { try { fn(); } catch { /* a listener's own problem */ } } }

// The game re-draws its buttons when the pop-out starts, stops or closes.
export function onMusicChange(fn) {
  listeners.add(fn);
  connect();
  return () => listeners.delete(fn);
}

function connect() {
  if (channel || typeof BroadcastChannel !== 'function') return channel;
  try { channel = new BroadcastChannel(CHANNEL); } catch { return null; }
  channel.onmessage = (e) => {
    const m = e?.data;
    if (!m || typeof m !== 'object') return;
    if (m.type === 'state') {
      popout.alive = true;
      popout.playing = Boolean(m.playing);
      // One music at a time: the pop-out playing silences the page.
      if (popout.playing) audio?.pause();
      notify();
    } else if (m.type === 'closed') {
      popout.alive = false;
      popout.playing = false;
      notify();
    }
  };
  // A pop-out left open from before this page loaded (a reload) answers with its state.
  try { channel.postMessage({ type: 'hello' }); } catch { /* closed */ }
  return channel;
}

// A computer with a mouse and room for a second window, not inside the campus iframe.
export function popoutSuits(win = globalThis.window) {
  try {
    if (!win || typeof win.open !== 'function' || win.self !== win.top) return false;
    const mm = typeof win.matchMedia === 'function' ? win.matchMedia.bind(win) : globalThis.matchMedia;
    return typeof mm === 'function' && mm('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches;
  } catch {
    return false;
  }
}

// The Focus music button. On a computer it opens (or plays, or pauses) the pop-out; elsewhere,
// or when the pop-up is blocked, the music plays in the page as before.
export async function toggleMusic() {
  connect();
  if (popout.alive && channel) {
    channel.postMessage({ type: popout.playing ? 'pause' : 'play' });
    if (!popout.playing) focusPopout();
    return;
  }
  if (isPlayingHere()) { pauseMusic(); return; }
  if (popoutSuits()) {
    // Pick up where the page's music was, if it had been playing.
    const at = audio ? Math.floor(audio.currentTime || 0) : 0;
    const win = window.open(`${POPOUT_URL}?track=${track}&t=${at}`, POPOUT_NAME, POPOUT_FEATURES);
    if (win) {
      audio?.pause();
      popout.alive = true;
      popout.playing = true; // until the window says otherwise
      return;
    }
  }
  await playMusic();
}

function focusPopout() {
  try { window.open('', POPOUT_NAME)?.focus?.(); } catch { /* blocked: the window is still there */ }
}

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

// Music is on: in this page or in the pop-out window.
export function isPlaying() {
  return isPlayingHere() || popout.playing;
}

// Music is on in this page (the phone's lock screen belongs to the page that plays).
export function isPlayingHere() {
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
