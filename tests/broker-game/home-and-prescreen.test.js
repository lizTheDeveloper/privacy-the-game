import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { setHome, homeOf, setPrescreen, cleanBrokerState } from '../../src/utils/broker-state.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { US_STATES, PRESCREEN } from '../../src/data/sky-ladder.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const STRAG = 'people_search-reclaim-stragglers';
const dropFiled = { brokerFiled: { [STRAG]: { lines: { drop: '2026-10-01' }, since: '2026-10-01' } } };
const caLit = (l) => map.brokers.filter((b) => b.registries?.CA && l.stars[b.id].via.includes('drop')).length;

describe('where the player lives', () => {
  it('lists the 50 states and DC', () => {
    expect(US_STATES).toHaveLength(51);
    expect(US_STATES.every(([code]) => /^US-[A-Z]{2}$/.test(code))).toBe(true);
    expect(Object.fromEntries(US_STATES)['US-TX']).toBe('Texas');
  });
  it('setHome keeps caResident in step', () => {
    expect(setHome({}, 'US-TX')).toEqual({ home: 'US-TX', caResident: 'no' });
    expect(setHome({}, 'US-CA')).toEqual({ home: 'US-CA', caResident: 'yes' });
    expect(setHome({}, 'outside-us')).toEqual({ home: 'outside-us', caResident: 'no' });
    expect(setHome({}, 'unsaid')).toEqual({ home: 'unsaid', caResident: 'unsaid' });
    expect(setHome({ home: 'US-TX', caResident: 'no' }, 'US-ZZ')).toEqual({});
  });
  it('homeOf reads old saves: yes is California, unsaid stays, an old no asks again', () => {
    expect(homeOf({ caResident: 'yes' })).toBe('US-CA');
    expect(homeOf({ caResident: 'unsaid' })).toBe('unsaid');
    expect(homeOf({ caResident: 'no' })).toBe(null);
    expect(homeOf({})).toBe(null);
    expect(homeOf({ home: 'US-OR', caResident: 'no' })).toBe('US-OR');
    expect(homeOf({ home: 'bogus', caResident: 'yes' })).toBe('US-CA');
  });
  it("old 'no' asks again and DROP stays off", () => {
    const l = brokerLighting(map, { ...dropFiled, caResident: 'no' }, '2026-10-29');
    expect(homeOf({ caResident: 'no' })).toBe(null);
    expect(l.drop).toBe('not-resident');
    expect(caLit(l)).toBe(0);
  });
  it('DROP lights only for California', () => {
    expect(caLit(brokerLighting(map, setHome(dropFiled, 'US-CA'), '2026-10-29'))).toBe(603);
    for (const h of ['US-TX', 'outside-us', 'unsaid']) expect(caLit(brokerLighting(map, setHome(dropFiled, h), '2026-10-29')), h).toBe(0);
  });
  it('cleanBrokerState drops a bad home or prescreen and keeps good ones', () => {
    expect(cleanBrokerState({ home: 'Texas', prescreen: 'soon' })).toEqual({});
    const s = { home: 'US-TX', caResident: 'no', prescreen: '2026-10-01' };
    expect(cleanBrokerState(s)).toBe(s);
  });
});

describe('OptOutPrescreen', () => {
  const light = (day, today) => brokerLighting(map, setPrescreen({}, day), today);
  it('lights exactly the four bureaus, never their parents', () => {
    const l = light('2026-10-01', '2026-10-29');
    const lit = Object.keys(l.stars).filter((id) => l.stars[id].state === 'lit').sort();
    expect(lit).toEqual([...PRESCREEN.brokers].sort());
    for (const id of PRESCREEN.brokers) expect(l.stars[id].via).toEqual(['prescreen']);
    for (const id of ['equifax', 'experian', 'transunion']) expect(l.stars[id].state, id).toBe('dim');
  });
  it('goes amber after five years', () => {
    expect(PRESCREEN.days).toBe(1826);
    expect(light('2026-01-01', '2030-12-31').stars['trans-union'].state).toBe('lit');
    expect(light('2026-01-01', '2031-01-02').stars['trans-union'].state).toBe('amber');
  });
  it('setPrescreen sets and clears', () => {
    expect(setPrescreen({}, '2026-10-29')).toEqual({ prescreen: '2026-10-29' });
    expect(setPrescreen({ prescreen: '2026-10-29' }, null)).toEqual({});
  });
});
