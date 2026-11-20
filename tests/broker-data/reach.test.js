import { describe, it, expect } from 'vitest';
import { computeReach, pickHubs } from '../../research/data-brokers/build/reach.js';

const b = (...ids) => ids.map((id) => ({ id }));
const l = (from, to, type = 'supplies', published = true) => ({ from, to, type, published });

describe('computeReach', () => {
  it('isolated broker has reach 1', () => {
    expect(computeReach(b('a'), []).get('a')).toBe(1);
  });
  it('chain a→b→c gives a reach 3', () => {
    const r = computeReach(b('a', 'b', 'c'), [l('a', 'b'), l('b', 'c', 'owns')]);
    expect(r.get('a')).toBe(3);
    expect(r.get('b')).toBe(2);
    expect(r.get('c')).toBe(1);
  });
  it('cycle counted once', () => {
    const r = computeReach(b('a', 'b'), [l('a', 'b'), l('b', 'a', 'matches-identity')]);
    expect(r.get('a')).toBe(2);
    expect(r.get('b')).toBe(2);
  });
  it('unpublished edge does not add reach', () => {
    const r = computeReach(b('a', 'b'), [l('a', 'b', 'supplies', false)]);
    expect(r.get('a')).toBe(1);
  });
  it('buys edge is reversed', () => {
    // a buys from b => a is downstream of b
    const r = computeReach(b('a', 'b'), [l('a', 'b', 'buys')]);
    expect(r.get('b')).toBe(2);
    expect(r.get('a')).toBe(1);
  });
});

describe('pickHubs', () => {
  it('breaks ties by id', () => {
    const reach = new Map([['c', 5], ['a', 5], ['b', 5], ['z', 9]]);
    expect(pickHubs(reach, 3)).toEqual(['z', 'a', 'b']);
  });
});
