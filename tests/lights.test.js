import { describe, it, expect } from 'vitest';
import { districtLights, cityLights, podLights, CITY_STAGES } from '../src/utils/lights.js';

describe('districtLights: a district lights up as it is taken back', () => {
  it('occupied: dark', () => {
    expect(districtLights({ percent: 0, bonusCompleted: 0, bonusTotal: 3 })).toEqual({ tier: 0, windows: 0 });
  });

  it('contested: windows come on as the percent climbs, 1 to 4', () => {
    expect(districtLights({ percent: 5, bonusCompleted: 0, bonusTotal: 3 })).toEqual({ tier: 1, windows: 1 });
    expect(districtLights({ percent: 25, bonusCompleted: 0, bonusTotal: 3 }).windows).toBe(1);
    expect(districtLights({ percent: 26, bonusCompleted: 0, bonusTotal: 3 }).windows).toBe(2);
    expect(districtLights({ percent: 60, bonusCompleted: 0, bonusTotal: 3 }).windows).toBe(3);
    expect(districtLights({ percent: 99, bonusCompleted: 0, bonusTotal: 3 })).toEqual({ tier: 1, windows: 4 });
  });

  it('a bonus done before the district is secured does not skip ahead', () => {
    expect(districtLights({ percent: 50, bonusCompleted: 3, bonusTotal: 3 }).tier).toBe(1);
  });

  it('secured: rainbow, then each share of bonus missions adds more', () => {
    expect(districtLights({ percent: 100, bonusCompleted: 0, bonusTotal: 4 })).toEqual({ tier: 2, windows: 4 });
    expect(districtLights({ percent: 100, bonusCompleted: 1, bonusTotal: 4 }).tier).toBe(3);
    expect(districtLights({ percent: 100, bonusCompleted: 2, bonusTotal: 4 }).tier).toBe(4);
    expect(districtLights({ percent: 100, bonusCompleted: 3, bonusTotal: 4 }).tier).toBe(4);
    expect(districtLights({ percent: 100, bonusCompleted: 4, bonusTotal: 4 }).tier).toBe(5);
  });

  it('a secured district with no bonus missions gets the full show', () => {
    expect(districtLights({ percent: 100, bonusCompleted: 0, bonusTotal: 0 }).tier).toBe(5);
  });

  it('bad input never throws or lights up', () => {
    expect(districtLights({})).toEqual({ tier: 0, windows: 0 });
    expect(districtLights({ percent: NaN })).toEqual({ tier: 0, windows: 0 });
  });
});

describe('cityLights: the whole city by integrity', () => {
  it('stages at 25, 50, 75 and 100', () => {
    expect(CITY_STAGES).toEqual([25, 50, 75, 100]);
    expect(cityLights(0)).toBe(0);
    expect(cityLights(24)).toBe(0);
    expect(cityLights(25)).toBe(1);
    expect(cityLights(50)).toBe(2);
    expect(cityLights(74)).toBe(2);
    expect(cityLights(75)).toBe(3);
    expect(cityLights(99)).toBe(3);
    expect(cityLights(100)).toBe(4);
  });

  it('bad input is stage 0', () => {
    expect(cityLights(undefined)).toBe(0);
    expect(cityLights(NaN)).toBe(0);
  });
});

describe('podLights: a pod glows with its fortified share', () => {
  it('no published pct: nothing', () => {
    expect(podLights(null)).toBe(0);
    expect(podLights(0)).toBe(0);
  });

  it('any fortified share glows; a quarter adds the ring; half adds fireworks', () => {
    expect(podLights(1)).toBe(1);
    expect(podLights(24)).toBe(1);
    expect(podLights(25)).toBe(2);
    expect(podLights(50)).toBe(3);
  });
});
