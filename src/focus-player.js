// The focus-music pop-out window (focus-music.html). On a computer the game's Focus music button
// opens this, and the music lives here: it keeps playing on every screen of the game, through a
// reload, and while the player is in another tab doing a step (utils/focus-music.js).
// The game and this window talk over a BroadcastChannel, which never leaves this browser.
// Nothing is saved but the volume, which stays on this computer.
import { PLAYLIST, TRACK_NAMES, CHANNEL } from './utils/focus-music.js';

const VOLUME_KEY = 'reclaim-city.music-volume';

export function startPlayer(doc = document, win = window) {
  const $ = (id) => doc.getElementById(id);
  const params = new URLSearchParams(win.location.search);
  const n = PLAYLIST.length;
  let track = Math.min(Math.max(parseInt(params.get('track'), 10) || 0, 0), n - 1);
  const startAt = Math.max(parseInt(params.get('t'), 10) || 0, 0);

  const audio = new win.Audio(PLAYLIST[track]);
  audio.preload = 'auto';
  audio.volume = readVolume(win) ?? 0.35;
  if (startAt) {
    audio.addEventListener('loadedmetadata', () => { try { audio.currentTime = startAt; } catch { /* not seekable yet */ } }, { once: true });
  }

  let channel = null;
  try { channel = new win.BroadcastChannel(CHANNEL); } catch { /* an old browser: the window still plays */ }
  const send = (m) => { try { channel?.postMessage(m); } catch { /* closed */ } };
  const tell = () => send({ type: 'state', playing: !audio.paused });

  const play = () => audio.play().then(() => { blocked(false); }, () => { blocked(true); tell(); });

  function blocked(on) {
    const note = $('note');
    if (!note) return;
    if (on) {
      note.dataset.blocked = '';
      note.textContent = 'Press Play to start the music.';
    } else if ('blocked' in note.dataset) {
      delete note.dataset.blocked;
      note.textContent = 'Keeps playing while you use Reclaim City in any tab. Close this window to stop.';
    }
  }

  function show() {
    $('count').textContent = `Track ${track + 1} of ${n}`;
    $('title').textContent = TRACK_NAMES[track] || '';
    const on = !audio.paused;
    const btn = $('play');
    btn.setAttribute('aria-pressed', String(on));
    btn.innerHTML = on ? '&#10074;&#10074; Pause' : '&#9654; Play';
    const ms = win.navigator?.mediaSession;
    if (ms && typeof win.MediaMetadata === 'function') {
      ms.metadata = new win.MediaMetadata({
        title: TRACK_NAMES[track] || 'Focus music',
        artist: 'Reclaim City · Focus music',
        artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
      });
    }
  }

  function go(to) {
    track = (to + n) % n;
    audio.src = PLAYLIST[track];
    show();
    play();
  }

  audio.addEventListener('play', () => { show(); tell(); });
  audio.addEventListener('pause', () => { show(); tell(); });
  audio.addEventListener('ended', () => go(track + 1));

  $('play').addEventListener('click', () => (audio.paused ? play() : audio.pause()));
  $('prev').addEventListener('click', () => go(track - 1));
  $('next').addEventListener('click', () => go(track + 1));
  const vol = $('volume');
  vol.value = String(Math.round(audio.volume * 100));
  vol.addEventListener('input', () => {
    audio.volume = Math.min(Math.max(Number(vol.value) / 100, 0), 1);
    try { win.localStorage.setItem(VOLUME_KEY, String(audio.volume)); } catch { /* storage off: fine */ }
  });
  $('back').addEventListener('click', () => {
    const opener = win.opener;
    if (opener && !opener.closed) { try { opener.focus(); return; } catch { /* another origin */ } }
    win.open('./', '_blank');
  });

  if (channel) {
    channel.onmessage = (e) => {
      const m = e?.data;
      if (!m || typeof m !== 'object') return;
      if (m.type === 'hello') tell();
      else if (m.type === 'play') play();
      else if (m.type === 'pause') audio.pause();
    };
  }
  win.addEventListener('pagehide', () => { audio.pause(); send({ type: 'closed' }); });

  const ms = win.navigator?.mediaSession;
  const handle = (action, fn) => { try { ms?.setActionHandler(action, fn); } catch { /* not supported */ } };
  handle('play', () => play());
  handle('pause', () => audio.pause());
  handle('nexttrack', () => go(track + 1));
  handle('previoustrack', () => go(track - 1));

  show();
  tell();
  // Opened from the player's tap on Focus music: start now. A browser that wants a tap in this
  // window too gets one (the Play button says so).
  play();
  return { audio, go, get track() { return track; } };
}

function readVolume(win) {
  try {
    const v = Number(win.localStorage.getItem(VOLUME_KEY));
    return win.localStorage.getItem(VOLUME_KEY) !== null && v >= 0 && v <= 1 ? v : null;
  } catch {
    return null;
  }
}

if (typeof document !== 'undefined' && document.getElementById?.('play')) startPlayer();
