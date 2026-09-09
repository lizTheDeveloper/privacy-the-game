const LAST_VISIT_KEY = 'reclaim_last_visit';
const NOTIF_ASKED_KEY = 'reclaim_notif_asked';

function notificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function shouldAskPermission(state) {
  if (!notificationsSupported()) return false;
  if (Notification.permission !== 'default') return false;
  if (localStorage.getItem(NOTIF_ASKED_KEY)) return false;
  const completedCount = Object.values(state.missions).filter((m) => m.status === 'completed').length;
  return completedCount >= 1;
}

export function markAsked() {
  localStorage.setItem(NOTIF_ASKED_KEY, '1');
}

export async function requestPermission() {
  markAsked();
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function checkStreakReminder(state) {
  if (!notificationsSupported()) return;
  if (Notification.permission !== 'granted') return;

  const now = Date.now();
  const lastVisit = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0', 10);
  localStorage.setItem(LAST_VISIT_KEY, String(now));

  if (!lastVisit) return;

  const hoursSince = (now - lastVisit) / (1000 * 60 * 60);
  if (hoursSince < 20) return;

  const streak = state.streak?.days || 0;
  const completedCount = Object.values(state.missions).filter((m) => m.status === 'completed').length;
  const totalMissions = Object.keys(state.missions).length;

  if (completedCount === 0) return;

  let body;
  if (streak > 0 && hoursSince < 48) {
    body = `Your ${streak}-day streak is still alive! Keep it going with a quick mission.`;
  } else if (streak > 0) {
    body = `Your ${streak}-day streak expired. Start a new one — pick up where you left off.`;
  } else if (completedCount < totalMissions) {
    body = `You've secured ${completedCount} missions. The city still needs you.`;
  } else {
    return;
  }

  navigator.serviceWorker.ready.then((reg) => {
    reg.showNotification('Reclaim City', {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'streak-reminder',
      renotify: false,
    });
  });
}
