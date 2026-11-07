import { describe, it, expect } from 'vitest';
import {
  calcIntegrity,
  calcExposure,
  calcDistrictProgress,
  calcFindings,
  getBuildingState,
  isCoreMission,
  missionWeight,
} from '../src/utils/calc.js';
import { createInitialState, updateMission } from '../src/state.js';
import { MISSIONS, getMissionsForDistrict } from '../src/data/missions.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';

// Every core Master Keys mission filed: the weights and counts are knowable from the data.
function masterKeysDone() {
  let s = createInitialState();
  const core = getMissionsForDistrict('master-keys').filter((m) => isCoreMission(m) && isMissionInPlay(s, m));
  for (const m of core) s = updateMission(s, m.id, { status: 'completed' });
  // What scores (calc.js): every non-survey mission in play, an unlockable bonus only once done.
  const scored = MISSIONS.filter((m) => m.phase !== 'survey' && isMissionInPlay(s, m) && !(m.unlock && m.optional && !s.missions[m.id]));
  const total = scored.reduce((sum, m) => sum + missionWeight(m, false), 0);
  const done = core.reduce((sum, m) => sum + missionWeight(m, true), 0);
  return { s, core, total, done };
}

describe('calcIntegrity', () => {
  it('returns 0 for fresh state', () => {
    expect(calcIntegrity(createInitialState())).toBe(0);
  });

  it('returns the weighted percentage of completed missions', () => {
    const { s, core, total, done } = masterKeysDone();
    expect(core.length).toBeGreaterThan(10);
    expect(done).toBe(core.length); // core missions weigh 1
    expect(calcIntegrity(s)).toBe(Math.round((done / total) * 100));
    expect(calcIntegrity(s)).toBeGreaterThan(5);
  });

  it('one filing is never shown as 0%', () => {
    const state = updateMission(createInitialState(), 'gmail-recon-breach', { status: 'completed' });
    expect(calcIntegrity(state)).toBe(1);
  });
});

describe('calcExposure', () => {
  it('starts at 1000 for fresh state', () => {
    expect(calcExposure(createInitialState())).toBe(1000);
  });

  it('drops by 1000 / total weight for each completed weight', () => {
    const { s, total, done } = masterKeysDone();
    expect(calcExposure(s)).toBe(Math.round(1000 - (done * 1000) / total));
  });
});

describe('calcDistrictProgress', () => {
  it('returns 0% for no completions', () => {
    const result = calcDistrictProgress(createInitialState(), 'master-keys');
    expect(result.percent).toBe(0);
    expect(result.total).toBe(masterKeysDone().core.length);
  });

  it('counts each core mission once', () => {
    const { core } = masterKeysDone();
    const one = updateMission(createInitialState(), core[0].id, { status: 'completed' });
    expect(calcDistrictProgress(one, 'master-keys')).toMatchObject({ completed: 1, total: core.length, percent: Math.round(100 / core.length) });
    expect(calcDistrictProgress(masterKeysDone().s, 'master-keys')).toMatchObject({ completed: core.length, percent: 100 });
  });
});

describe('getBuildingState', () => {
  it('returns occupied for no completions', () => {
    expect(getBuildingState(createInitialState(), 'gmail')).toBe('occupied');
  });

  it('returns in-progress for partial completions', () => {
    let state = createInitialState();
    state = updateMission(state, 'gmail-recon-breach', { status: 'completed' });
    expect(getBuildingState(state, 'gmail')).toBe('in-progress');
  });
});
