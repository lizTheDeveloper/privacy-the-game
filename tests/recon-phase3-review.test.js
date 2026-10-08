// Phase 3 reviewer, FIX FIRST. C1: the vehicle privacy report became in play
// for every car; as a core mission it dropped old non-GM saves below 100%.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS, getMissionsForDistrict } from '../src/data/missions.js';
import { createInitialState } from '../src/state.js';
import { calcDistrictProgress, isCoreMission } from '../src/utils/calc.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';
import { isCityComplete } from '../src/utils/ghost.js';
import { restoreEvents } from '../src/utils/restore.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

function only(ids) {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: ids.includes(id) } } };
  return s;
}

describe('C1: the vehicle privacy report never lowers an old save', () => {
  it('is a bonus that counts once done', () => {
    const m = MISSIONS.find((x) => x.id === 'car_general-recon-vin');
    expect(m.optional).toBe(true);
    expect(m.countsWhenDone).toBe(true);
  });

  it('a Ford-only save with The Freeway at 100% stays at 100%, the city stays complete, and restore sends the district', () => {
    let s = only(['car_ford']);
    const done = {};
    for (const m of getMissionsForDistrict('freeway')) {
      if (m.id === 'car_general-recon-vin' || !isMissionInPlay(s, m) || !isCoreMission(m)) continue;
      done[m.id] = { status: 'completed', completedAt: '2026-09-01T10:00:00.000Z' };
    }
    s = { ...s, missions: done };
    expect(calcDistrictProgress(s, 'freeway').percent).toBe(100);
    expect(isCityComplete(s)).toBe(true);
    expect(restoreEvents(s).some((e) => e.name === 'district-completed' && e.data.district === 'freeway')).toBe(true);
    // Filing the report later keeps it at 100%.
    const later = { ...s, missions: { ...s.missions, 'car_general-recon-vin': { status: 'completed', vehicle_label: 'collects-little' } } };
    expect(calcDistrictProgress(later, 'freeway').percent).toBe(100);
  });
});
