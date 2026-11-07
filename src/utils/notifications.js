// Streak reminders, honestly (v7.13.0).
//
// The game has no push server and sends no email, and checkStreakReminder could only
// run when the game was opened: the "reminder" fired after the player had already come
// back, so it never reminded anyone (feature map row 14). Until real push arrives with
// the app, the game doesn't ask for notification permission (nothing could be delivered
// with it) and shows no system notification. What the check found is shown on the city
// map instead, labelled for what it is: a WELCOME BACK note about the streak.
//
// The permission helpers stay, unused, for when push is real: flip
// REMINDERS_DELIVERABLE then, and not before.

import { streakNow } from '../state.js';

const LAST_VISIT_KEY = 'reclaim_last_visit';
const NOTIF_ASKED_KEY = 'reclaim_notif_asked';

// True only once something can reach a player who isn't in the game (push from the app).
export const REMINDERS_DELIVERABLE = false;

// A storage-blocked iframe throws on any localStorage access.
function store(op, key, value) {
  try {
    return op === 'get' ? localStorage.getItem(key) : localStorage.setItem(key, value);
  } catch {
    return null;
  }
}

function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function shouldAskPermission(state) {
  if (!REMINDERS_DELIVERABLE) return false;
  if (!notificationsSupported()) return false;
  if (Notification.permission !== 'default') return false;
  if (store('get', NOTIF_ASKED_KEY)) return false;
  const completedCount = Object.values(state.missions).filter((m) => m.status === 'completed').length;
  return completedCount >= 1;
}

export function markAsked() {
  store('set', NOTIF_ASKED_KEY, '1');
}

export async function requestPermission() {
  markAsked();
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// The welcome-back note for a player returning after 20 hours or more, or null.
// lastVisit and now are ms timestamps.
export function welcomeBackNote(state, lastVisit, now = Date.now()) {
  if (!lastVisit) return null;
  const hoursSince = (now - lastVisit) / (1000 * 60 * 60);
  if (hoursSince < 20) return null;

  const { current, kept, filedToday } = streakNow(state, new Date(now));
  const completedCount = Object.values(state.missions || {}).filter((m) => m.status === 'completed').length;
  if (completedCount === 0 || kept === 0) return null;

  // The same reading of the streak as the HUD and Stats (streakNow).
  const days = `${kept}-day streak`;
  if (current > 0 && filedToday) return `Your ${days} is still going, and today already counts.`;
  if (current > 0) return `Your ${days} is still going. File one mission today to keep it.`;
  return `Your ${days} ended while you were away. Everything you secured still counts. One mission today starts a new one.`;
}

// Run once as the game opens: remembers this visit, and returns the welcome-back note
// for this one (null for none). It used to post a system notification here, to a
// player who was already looking at the game.
export function checkStreakReminder(state, now = Date.now()) {
  const lastVisit = parseInt(store('get', LAST_VISIT_KEY) || '0', 10);
  store('set', LAST_VISIT_KEY, String(now));
  return welcomeBackNote(state, lastVisit, now);
}
