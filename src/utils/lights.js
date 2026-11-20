// How much light the city shows, from the player's own progress. Pure: the map
// turns these tiers into rainbow LEDs, searchlights and fireworks.

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

// One district.
//   0 occupied: dark
//   1 contested: 1-4 windows on, by percent
//   2 secured: rainbow LED halo + a chasing rainbow ring round the lot
//   3 + any bonus done: searchlight and rainbow beacon on the tower
//   4 + half the bonuses: string lights round the lot
//   5 + every bonus (or there are none): fireworks
export function districtLights({ percent, bonusCompleted, bonusTotal } = {}) {
  const p = num(percent);
  if (p <= 0) return { tier: 0, windows: 0 };
  if (p < 100) return { tier: 1, windows: Math.min(4, Math.max(1, Math.ceil(p / 25))) };
  const total = num(bonusTotal);
  const share = total > 0 ? num(bonusCompleted) / total : 1;
  let tier = 2;
  if (share >= 1) tier = 5;
  else if (share >= 0.5) tier = 4;
  else if (share > 0) tier = 3;
  return { tier, windows: 4 };
}

// The whole city, by integrity: each threshold reached adds a stage.
//   1 plaza fountain   2 rainbow data streams + light column
//   3 rainbow horizon + sky searchlights   4 aurora + fireworks over the plaza
export const CITY_STAGES = [25, 50, 75, 100];

export function cityLights(integrity) {
  const i = num(integrity);
  return CITY_STAGES.filter((t) => i >= t).length;
}

// A pod of the broader city, by its published fortified pct (null if suppressed).
//   1 rainbow halo on its lit buildings   2 + chasing ring   3 + fireworks
export function podLights(pct) {
  const p = num(pct);
  if (p >= 50) return 3;
  if (p >= 25) return 2;
  return p > 0 ? 1 : 0;
}
