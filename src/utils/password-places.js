// Where the player's passwords are saved: one place, or two (data/two-places.js).
// state.passwordPlaces holds both; state.passwordManager stays the first, for everything that
// reads one answer. Local only, like every answer about the player's devices: never tracked.

export function passwordPlaces(state) {
  const pm = state?.passwordManager;
  const list = Array.isArray(state?.passwordPlaces) ? [...new Set(state.passwordPlaces.filter(Boolean))] : [];
  // A one-place answer given since (the Change link, The Master Keys' question) wins.
  if (list.length > 1 && list[0] === pm) return list.slice(0, 2);
  return pm ? [pm] : [];
}

// The key a mission's stepsByManager uses: "apple+google" for two places, else the one answer.
export function placesKey(state) {
  const p = passwordPlaces(state);
  return p.length > 1 ? p.join('+') : state?.passwordManager;
}

export function setPasswordPlaces(state, places = []) {
  const list = [...new Set(places.filter(Boolean))].slice(0, 2);
  return { ...state, passwordManager: list[0] || '', passwordPlaces: list };
}
