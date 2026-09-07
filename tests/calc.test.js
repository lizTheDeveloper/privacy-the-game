import { describe, it, expect } from 'vitest';
import {
  calcIntegrity,
  calcExposure,
  calcDistrictProgress,
  calcFindings,
  getBuildingState,
} from '../src/utils/calc.js';
import { createInitialState, updateMission } from '../src/state.js';

describe('calcIntegrity', () => {
  it('returns 0 for fresh state', () => {
    expect(calcIntegrity(createInitialState())).toBe(0);
  });

  it('returns percentage of completed missions', () => {
    let state = createInitialState();
    state = updateMission(state, 'gmail-recon-breach', { status: 'completed' });
    const integrity = calcIntegrity(state);
    expect(integrity).toBeGreaterThan(0);
    expect(integrity).toBeLessThan(100);
  });
});

describe('calcExposure', () => {
  it('starts at 1000 for fresh state', () => {
    expect(calcExposure(createInitialState())).toBe(1000);
  });

  it('decreases with completed missions', () => {
    let state = createInitialState();
    state = updateMission(state, 'gmail-recon-breach', { status: 'completed' });
    expect(calcExposure(state)).toBeLessThan(1000);
  });
});

describe('calcDistrictProgress', () => {
  it('returns 0% for no completions', () => {
    const result = calcDistrictProgress(createInitialState(), 'master-keys');
    expect(result.percent).toBe(0);
    expect(result.total).toBeGreaterThan(0);
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
