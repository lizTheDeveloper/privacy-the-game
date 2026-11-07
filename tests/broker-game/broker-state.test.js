import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { STATE_VERSION, loadState } from '../../src/state.js';
import {
  RESIDENCY, dayOf, cleanBrokerState, recordChecklist, setBigCheck, materializeLegacy,
} from '../../src/utils/broker-state.js';

const M = 'people_search-fortify-web-forms';

describe('broker-state', () => {
  it('STATE_VERSION stays 1', () => expect(STATE_VERSION).toBe(1));
  it('RESIDENCY', () => expect(RESIDENCY).toEqual(['yes', 'no', 'unsaid']));
  it('dayOf', () => {
    expect(dayOf('2026-03-01T12:00:00.000Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dayOf('nope')).toBeNull();
    expect(dayOf(undefined)).toBeNull();
    expect(dayOf(5)).toBeNull();
  });

  it('cleanBrokerState drops bad values and keeps missions', () => {
    const s = { missions: { a: { status: 'completed' } }, brokerFiled: 'x', caResident: 'maybe', bigCheck: [1] };
    expect(cleanBrokerState(s)).toEqual({ missions: { a: { status: 'completed' } } });
    const t = { missions: {}, brokerFiled: { m: { lines: { spokeo: '2026-07-01', whitepages: 'soon' }, since: 'x' }, n: null } };
    expect(cleanBrokerState(t).brokerFiled).toEqual({ m: { lines: { spokeo: '2026-07-01' } } });
  });
  it('cleanBrokerState keeps good values and cleans bigCheck', () => {
    const s = { missions: {}, caResident: 'yes', bigCheck: { a: '2026-01-02', b: '2026-02-30' }, brokerFiled: { m: { lines: { x: '2026-01-02' }, since: '2026-01-01' } } };
    expect(cleanBrokerState(s)).toEqual({ missions: {}, caResident: 'yes', bigCheck: { a: '2026-01-02' }, brokerFiled: { m: { lines: { x: '2026-01-02' }, since: '2026-01-01' } } });
  });
  it('cleanBrokerState drops __proto__ keys and never changes a prototype', () => {
    const s = JSON.parse('{"missions":{},"brokerFiled":{"__proto__":{"lines":{}},"m":{"lines":{"__proto__":"2026-01-02","x":"2026-01-02"}}},"bigCheck":{"__proto__":"2026-01-02","a":"2026-01-02"}}');
    const c = cleanBrokerState(s);
    expect(Object.getPrototypeOf(c.brokerFiled)).toBe(Object.prototype);
    expect(Object.hasOwn(c.brokerFiled, '__proto__')).toBe(false);
    expect(Object.keys(c.brokerFiled)).toEqual(['m']);
    expect(Object.getPrototypeOf(c.brokerFiled.m.lines)).toBe(Object.prototype);
    expect(Object.keys(c.brokerFiled.m.lines)).toEqual(['x']);
    expect(Object.getPrototypeOf(c.bigCheck)).toBe(Object.prototype);
    expect(Object.keys(c.bigCheck)).toEqual(['a']);
  });
  it('an old save without the fields is returned as is', () => { const s = { missions: {} }; expect(cleanBrokerState(s)).toBe(s); });
  it('a clean save with the fields is returned as is', () => {
    const s = { missions: {}, caResident: 'no', bigCheck: { a: '2026-01-02' }, brokerFiled: { m: { lines: { x: '2026-01-02' }, since: '2026-01-01' } } };
    expect(cleanBrokerState(s)).toBe(s);
  });

  describe('loadState', () => {
    const store = {};
    const storage = { getItem: vi.fn((k) => store[k] ?? null), setItem: (k, v) => { store[k] = v; } };
    beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });
    it('a corrupted broker field keeps the city', () => {
      const KEY = 'reclaim-city-state';
      const probe = { version: STATE_VERSION, missions: { a: { status: 'completed' } }, accounts: {}, brokerFiled: 7, caResident: {} };
      store[KEY] = JSON.stringify(probe);
      const s = loadState(storage);
      expect(s.missions.a.status).toBe('completed');
      expect(s.brokerFiled).toBeUndefined();
      expect(s.caResident).toBeUndefined();
    });
  });

  it('recordChecklist first filing sets lines and since', () => {
    const s = recordChecklist({}, M, ['spokeo', 'bogus'], '2026-10-19', { first: true });
    expect(s.brokerFiled[M]).toEqual({ lines: { spokeo: '2026-10-19' }, since: '2026-10-19' });
  });
  it('re-filing updates dates and never sets since', () => {
    let s = recordChecklist({}, M, ['spokeo'], '2026-10-19', { first: true });
    s = recordChecklist(s, M, ['spokeo', 'whitepages'], '2026-12-01');
    expect(s.brokerFiled[M]).toEqual({ lines: { spokeo: '2026-12-01', whitepages: '2026-12-01' }, since: '2026-10-19' });
    const t = recordChecklist({}, M, ['spokeo'], '2026-12-01');
    expect(t.brokerFiled[M].since).toBeUndefined();
  });
  it('first does not overwrite an existing since', () => {
    const s = { brokerFiled: { [M]: { lines: {}, since: '2026-01-01' } } };
    expect(recordChecklist(s, M, [], '2026-02-02', { first: true }).brokerFiled[M].since).toBe('2026-01-01');
  });
  it('a first filing with no ticks still records since', () => {
    expect(recordChecklist({}, M, [], '2026-10-19', { first: true }).brokerFiled[M]).toEqual({ lines: {}, since: '2026-10-19' });
  });
  it('recordChecklist does not mutate its input', () => {
    const s = { brokerFiled: { [M]: { lines: { spokeo: '2026-01-01' } } } };
    const copy = structuredClone(s);
    recordChecklist(s, M, ['spokeo'], '2026-02-02');
    expect(s).toEqual(copy);
  });
  it('recordChecklist on a mission with no checklist is a no-op', () => {
    const s = {};
    expect(recordChecklist(s, 'nope', ['spokeo'], '2026-10-19', { first: true })).toBe(s);
    expect(recordChecklist(s, M, [], '2026-10-19')).toBe(s);
  });

  it('an old save keeps a yes/no/unsaid California answer and drops anything else', () => {
    for (const v of RESIDENCY) expect(cleanBrokerState({ missions: {}, caResident: v }).caResident).toBe(v);
    expect('caResident' in cleanBrokerState({ missions: {}, caResident: 'maybe' })).toBe(false);
  });
  it('setBigCheck ticks and unticks', () => {
    let s = setBigCheck({}, 'acxiom', true, '2026-10-19');
    expect(s.bigCheck).toEqual({ acxiom: '2026-10-19' });
    s = setBigCheck(s, 'acxiom', false, '2026-10-20');
    expect(s.bigCheck).toEqual({});
  });

  describe('materializeLegacy', () => {
    const legacy = (extra = {}) => ({ missions: { [M]: { status: 'completed', optout_result: 'all-submitted', completedAt: '2026-03-01T12:00:00.000Z', ...extra } } });
    it('writes a legacy all filing into lines at its completedAt day', () => {
      const s = legacy();
      const day = dayOf('2026-03-01T12:00:00.000Z');
      expect(materializeLegacy(s, M).brokerFiled[M])
        .toEqual({ lines: { spokeo: day, whitepages: day, beenverified: day }, since: day });
    });
    it('keeps lines already recorded', () => {
      const s = { ...legacy(), brokerFiled: { [M]: { lines: { spokeo: '2026-10-19' } } } };
      const day = dayOf('2026-03-01T12:00:00.000Z');
      expect(materializeLegacy(s, M).brokerFiled[M]).toEqual({ lines: { spokeo: '2026-10-19', whitepages: day, beenverified: day }, since: day });
    });
    it('handles defense_done answers', () => {
      const D = 'ad_trackers-reclaim-individual';
      const s = { missions: { [D]: { status: 'completed', defense_done: 'done', completedAt: '2026-03-01T12:00:00.000Z' } } };
      expect(Object.keys(materializeLegacy(s, D).brokerFiled[D].lines).sort()).toEqual(['acxiom', 'epsilon', 'liveramp', 'lotame']);
    });
    it('leaves other filings alone', () => {
      expect(materializeLegacy(legacy({ optout_result: 'some-submitted' }), M)).toSatisfy((r) => !r.brokerFiled);
      const a = legacy({ optout_result: 'some-submitted' });
      expect(materializeLegacy(a, M)).toBe(a);
      const b = legacy({ status: 'skipped' });
      expect(materializeLegacy(b, M)).toBe(b);
      const c = legacy();
      expect(materializeLegacy(c, 'no-such-mission')).toBe(c);
      const d = { ...legacy(), brokerFiled: { [M]: { lines: {}, since: '2026-10-19' } } };
      expect(materializeLegacy(d, M)).toBe(d);
      const e = legacy({ completedAt: 'garbage' });
      expect(materializeLegacy(e, M)).toBe(e);
      const f = { missions: {} };
      expect(materializeLegacy(f, M)).toBe(f);
    });
  });

  it('broker-state.js never imports state.js', () => {
    expect(readFileSync('src/utils/broker-state.js', 'utf8')).not.toMatch(/from ['"]\.\.\/state\.js['"]/);
  });
});
