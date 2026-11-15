import { DISTRICTS, OPT_IN_DISTRICTS } from '../data/districts.js';
import { ACCOUNTS } from '../data/accounts.js';

// An opt-in district (The Field) is part of the player's city only once they
// turn it on: until then it adds nothing to the district count, the secured
// count, the city haze or the open-categories headline.
export function isDistrictOn(state, districtId) {
  if (!OPT_IN_DISTRICTS.has(districtId)) return true;
  return Object.entries(ACCOUNTS).some(([id, a]) => a.district === districtId && state?.accounts?.[id]?.enabled);
}

export function activeDistricts(state) {
  return DISTRICTS.filter((d) => isDistrictOn(state, d.id));
}

// Turn every building of an opt-in district on or off. Progress is kept either way.
export function setDistrictOn(state, districtId, on) {
  if (!OPT_IN_DISTRICTS.has(districtId)) return state;
  const accounts = { ...state.accounts };
  for (const [id, a] of Object.entries(ACCOUNTS)) {
    if (a.district !== districtId) continue;
    accounts[id] = { ...(accounts[id] || { name: a.name, district: a.district }), enabled: Boolean(on) };
  }
  return { ...state, accounts };
}
