// The INTEL lore on a briefing: each briefing shows the next lore entry of its district
// that the player hasn't seen, and keeps showing that one when the player comes back to
// it. state.seenLore[districtId] lists the keys seen, in order; state.loreShown[missionId]
// is the key that mission's briefing shows. Both are local only (never sent).
import { DISTRICT_DIALOGUE } from '../data/dialogue.js';
import { findMission } from '../data/custom-missions.js';
import { missionDistrict } from '../data/missions.js';

function loreKeys(districtId) {
  return Object.keys(DISTRICT_DIALOGUE[districtId]?.lore || {});
}

// { districtId, key } for a mission's briefing, or null when its district has no lore.
export function briefingLore(state, missionId) {
  const mission = findMission(state, missionId);
  const districtId = mission ? missionDistrict(mission) : null;
  const keys = districtId ? loreKeys(districtId) : [];
  if (keys.length === 0) return null;
  const kept = state.loreShown?.[missionId];
  if (keys.includes(kept)) return { districtId, key: kept };
  const seen = state.seenLore?.[districtId] || [];
  const unseen = keys.find((k) => !seen.includes(k));
  if (unseen) return { districtId, key: unseen };
  // Every entry seen: round again, in order.
  return { districtId, key: keys[seen.length % keys.length] };
}

// After a briefing showed its lore: remember it. Returns true when the save changed.
export function markLoreShown(state, missionId) {
  const lore = briefingLore(state, missionId);
  if (!lore) return false;
  if (!state.loreShown) state.loreShown = {};
  if (!state.seenLore) state.seenLore = {};
  const seen = state.seenLore[lore.districtId] || (state.seenLore[lore.districtId] = []);
  let changed = false;
  if (state.loreShown[missionId] !== lore.key) {
    state.loreShown[missionId] = lore.key;
    changed = true;
  }
  if (!seen.includes(lore.key) || (changed && seen.length >= loreKeys(lore.districtId).length)) {
    seen.push(lore.key);
    changed = true;
  }
  return changed;
}
