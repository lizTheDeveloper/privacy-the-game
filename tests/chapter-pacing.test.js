import { describe, it, expect } from 'vitest';
import {
  calcDistrictProgress,
  getBuildingState,
  isCoreMission,
} from '../src/utils/calc.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { renderDistrict } from '../src/screens/district.js';
import { getMissionsForDistrict } from '../src/data/missions.js';
import { createInitialState, updateMission } from '../src/state.js';

function coreCh1() {
  return getMissionsForDistrict('master-keys').filter(isCoreMission);
}

function completeAll(state, ids) {
  let next = state;
  for (const id of ids) next = updateMission(next, id, { status: 'completed' });
  return next;
}

describe('MUL-38 Chapter 1 core/bonus split', () => {
  it('district progress total counts only core missions', () => {
    const progress = calcDistrictProgress(createInitialState(), 'master-keys');
    expect(progress.total).toBe(coreCh1().length);
    expect(progress.total).toBe(27);
    expect(progress.bonusTotal).toBe(22);
  });

  it('completing all core missions secures the district with zero bonus done', () => {
    const state = completeAll(createInitialState(), coreCh1().map((m) => m.id));
    const progress = calcDistrictProgress(state, 'master-keys');
    expect(progress.percent).toBe(100);
    expect(progress.bonusCompleted).toBe(0);
  });

  it('a building liberates once its core missions are done', () => {
    const ids = coreCh1().filter((m) => m.accountId === 'facebook').map((m) => m.id);
    const state = completeAll(createInitialState(), ids);
    expect(ids).toHaveLength(3);
    expect(getBuildingState(state, 'facebook')).toBe('liberated');
  });

  it('per-account core estimate stays under 15 minutes', () => {
    const perAccount = {};
    for (const m of coreCh1()) {
      perAccount[m.accountId] = (perAccount[m.accountId] || 0) + m.estimatedMinutes;
    }
    for (const [acct, mins] of Object.entries(perAccount)) {
      expect(mins, `${acct} core path too long`).toBeLessThanOrEqual(15);
    }
  });

  it('city map advertises the core count, not 49', () => {
    const html = renderCityMap(createInitialState());
    expect(html).toContain('0/27 MISSIONS');
    expect(html).not.toContain('0/49 MISSIONS');
  });

  it('district recon list badges the bonus login-history mission', () => {
    const html = renderDistrict(createInitialState(), 'master-keys', 'recon');
    expect(html).toContain('#/mission/yahoo-recon-login/briefing');
    expect(html).toContain('BONUS');
  });
});
