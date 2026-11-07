// The Social Timeline (screens/timeline.js) asks when the player joined each platform
// and how much they posted in each era. This is what those answers do, and all they do:
//
// - On a Reclaim tab, the platforms and eras where the player posted most come first
//   (timelineRank), so the review starts where most of their posts are.
// - Instagram and Facebook already have one Memory Lane mission per era (early, middle,
//   recent). Each of those rows shows its years and how much the player posted then
//   (timelineNote); the other review rows of a mapped platform show its busiest years.
//
// No mission is made up from the answers, and nothing here leaves the browser.

// A platform's history in eras: one (two years or less), two, or three.
export function getEras(joinYear, now = new Date()) {
  const year = now.getFullYear();
  const total = year - joinYear;
  if (total <= 0) return [];
  if (total <= 2) return [{ label: 'Your time on the platform', startYear: joinYear, endYear: year }];
  if (total <= 5) return [
    { label: 'Early days', startYear: joinYear, endYear: joinYear + Math.floor(total / 2) },
    { label: 'Recent years', startYear: joinYear + Math.floor(total / 2) + 1, endYear: year },
  ];
  const chunk = Math.floor(total / 3);
  return [
    { label: 'The early days', startYear: joinYear, endYear: joinYear + chunk },
    { label: 'The middle years', startYear: joinYear + chunk + 1, endYear: joinYear + chunk * 2 },
    { label: 'Recent history', startYear: joinYear + chunk * 2 + 1, endYear: year },
  ];
}

export const ACTIVITY_WEIGHT = { heavy: 3, moderate: 2, light: 1, none: 0 };
export const ACTIVITY_LABEL = { heavy: 'Posted a LOT', moderate: 'Pretty active', light: 'Posted sometimes', none: 'Barely posted' };

// The game's per-era review missions, in era order (early, middle, recent).
export const ERA_MISSIONS = {
  instagram: ['instagram-reclaim-early-years', 'instagram-reclaim-middle-years', 'instagram-reclaim-recent'],
  facebook: ['facebook-reclaim-early', 'facebook-reclaim-middle', 'facebook-reclaim-recent'],
};

// Which of the player's eras an era mission covers. Three eras map one to one; two eras
// (early days, recent years) are the early and recent missions; one era (two years or
// less on the platform) is the recent mission.
function eraIndexFor(slot, eraCount) {
  if (eraCount === 3) return slot;
  if (eraCount === 2) return slot === 0 ? 0 : slot === 2 ? 1 : null;
  if (eraCount === 1) return slot === 2 ? 0 : null;
  return null;
}

function profileOf(state, accountId) {
  const p = state?.socialHistory?.[accountId];
  return p?.joinYear ? p : null;
}

// The player's answer for one era, or null when they left it blank.
function eraActivity(profile, i) {
  const a = profile?.eras?.[i];
  return a in ACTIVITY_WEIGHT ? a : null;
}

// What the timeline says about one review mission: { years, activity } or null.
export function timelineNote(state, mission, now = new Date()) {
  if (mission?.phase !== 'reclaim') return null;
  const profile = profileOf(state, mission.accountId);
  if (!profile) return null;
  const eras = getEras(profile.joinYear, now);
  const slot = ERA_MISSIONS[mission.accountId]?.indexOf(mission.id) ?? -1;
  if (slot >= 0) {
    const i = eraIndexFor(slot, eras.length);
    if (i === null) return null;
    const era = eras[i];
    return { years: `${era.startYear}–${era.endYear}`, activity: eraActivity(profile, i) };
  }
  // Any other review mission for the platform: its busiest answered era.
  let best = null;
  eras.forEach((era, i) => {
    const a = eraActivity(profile, i);
    if (a && (!best || ACTIVITY_WEIGHT[a] > ACTIVITY_WEIGHT[best.activity])) best = { years: `${era.startYear}–${era.endYear}`, activity: a };
  });
  return best;
}

// Sort key for a Reclaim row: the posting weight its note carries (-1 with no answer).
export function timelineRank(state, mission, now = new Date()) {
  const note = timelineNote(state, mission, now);
  return note?.activity ? ACTIVITY_WEIGHT[note.activity] : -1;
}

// One line for a Reclaim row, or ''.
export function timelineLine(note) {
  if (!note) return '';
  return note.activity ? `Your timeline: ${note.years}, ${ACTIVITY_LABEL[note.activity].toLowerCase()}` : `Your timeline: ${note.years}`;
}

// SAVE on the timeline form: the year is needed; an era left blank stays blank (null).
export function socialProfileFromForm(joinYearRaw, eraValues = [], now = new Date()) {
  const joinYear = parseInt(joinYearRaw, 10);
  if (!joinYear) return { error: 'Pick the year you joined first. The eras to answer come from it.' };
  const eras = getEras(joinYear, now);
  return { profile: { joinYear, eras: eras.map((_, i) => (eraValues[i] in ACTIVITY_WEIGHT ? eraValues[i] : null)) } };
}
