// Which step links the player has opened, so Simplest can hold DONE back until they have
// been to the site (Liz 2026-11-17: "the done button should not appear at all until you've
// clicked the open button"). Kept for this browser session only and never sent anywhere.
// sessionStorage keeps it across a reload (a phone often reloads the game tab after a trip
// to another tab); a Set stands in where storage is blocked.

const KEY = 'rc-opened-steps';
const memory = new Set();

function load() {
  try {
    const raw = globalThis.sessionStorage?.getItem(KEY);
    if (raw) for (const k of JSON.parse(raw)) memory.add(k);
  } catch { /* storage blocked: memory only */ }
}
load();

const id = (missionId, stepKey) => `${missionId}::${stepKey}`;

export function wasOpened(missionId, stepKey) {
  return memory.has(id(missionId, stepKey));
}

export function markOpened(missionId, stepKey) {
  memory.add(id(missionId, stepKey));
  try { globalThis.sessionStorage?.setItem(KEY, JSON.stringify([...memory])); } catch { /* memory only */ }
}

// Tests start clean.
export function clearOpened() {
  memory.clear();
  try { globalThis.sessionStorage?.removeItem(KEY); } catch { /* nothing to clear */ }
}
