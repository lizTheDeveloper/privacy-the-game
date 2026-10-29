import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ladder, nextRung } from '../../src/utils/sky-ladder.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { setHome, setPrescreen } from '../../src/utils/broker-state.js';
import { GPC_MISSION, GPC_STATES } from '../../src/data/sky-ladder.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const T = '2026-10-29';
const rungs = (state) => ladder(map, state, brokerLighting(map, state, T));
const byId = (rs, id) => rs.find((r) => r.id === id);

describe('the sky ladder', () => {
  it('the order is fixed, biggest first, the same for California and Texas', () => {
    const ca = rungs(setHome({}, 'US-CA')).map((r) => r.id);
    const tx = rungs(setHome({}, 'US-TX')).map((r) => r.id);
    expect(ca).toEqual(tx);
    expect(ca.slice(0, 5)).toEqual(['drop', 'gpc', 'daa', 'prescreen', 'line:thomson-clear']);
    const counts = rungs({}).filter((r) => r.kind === 'line').map((r) => r.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it('DROP previews outside California and is a real task inside it', () => {
    const tx = byId(rungs(setHome({}, 'US-TX')), 'drop');
    expect(tx.status).toBe('preview');
    expect(tx.starIds).toHaveLength(603);
    expect(tx.text).toContain('Texas');
    expect(byId(rungs(setHome({}, 'US-CA')), 'drop').status).toBe('todo');
    expect(byId(rungs({}), 'drop').status).toBe('preview');
  });

  it('next skips previews', () => {
    expect(nextRung(rungs(setHome({}, 'US-TX'))).id).toBe('gpc');
    expect(nextRung(rungs(setHome({}, 'US-CA'))).id).toBe('drop');
    expect(nextRung([])).toBe(null);
  });

  it('GPC is done by its Perimeter mission, and covers no stars', () => {
    const done = { missions: { [GPC_MISSION]: { status: 'completed', action: 'completed', completedAt: '2026-10-02T10:00:00Z' } } };
    const g = byId(rungs(done), 'gpc');
    expect(g).toMatchObject({ status: 'done', doneOn: '2026-10-02', starIds: [], count: null });
    const later = { missions: { [GPC_MISSION]: { status: 'completed', action: 'later' } } };
    expect(byId(rungs(later), 'gpc').status).toBe('todo');
  });

  it('a rung is done when every star it covers is lit, however it was lit', () => {
    const r = byId(rungs({ bigCheck: { liveramp: '2026-10-20' } }), 'line:liveramp');
    expect(r.status).toBe('done');
    expect(r.doneOn).toBe('2026-10-20');
  });

  it('OptOutPrescreen covers the four bureaus and is done once recorded', () => {
    expect(byId(rungs({}), 'prescreen')).toMatchObject({ status: 'todo', count: 4 });
    expect(byId(rungs(setPrescreen({}, '2026-10-29')), 'prescreen')).toMatchObject({ status: 'done', doneOn: '2026-10-29' });
  });

  it('zero-star lines sit last with count 0', () => {
    const rs = rungs({});
    const firstZero = rs.findIndex((r) => r.count === 0);
    expect(firstZero).toBeGreaterThan(0);
    expect(rs.slice(firstZero).every((r) => r.count === 0)).toBe(true);
    expect(rs.slice(firstZero).map((r) => r.id)).toContain('line:nai');
  });

  it('GPC text by state', () => {
    const must = Object.keys(GPC_STATES);
    expect(must.length).toBeGreaterThan(0);
    expect(byId(rungs(setHome({}, 'US-CO')), 'gpc').text).toMatch(/Colorado requires/);
    expect(byId(rungs(setHome({}, 'US-TX')), 'gpc').text).toMatch(/already handle these signals for other states/);
    expect(must).not.toContain('US-MD');
    const not = ['US-AL', 'US-MS', 'US-WY'].find((s) => !must.includes(s));
    expect(byId(rungs(setHome({}, not)), 'gpc').text).toMatch(/don't have to honor this in /);
    // Not knowing where the player lives, the game says nothing about their law.
    for (const s of [{}, setHome({}, 'unsaid'), setHome({}, 'outside-us'), { caResident: 'no' }]) {
      expect(byId(rungs(s), 'gpc').text).toMatch(/Tell the map where you live/);
    }
  });

  it('every rung id is unique', () => {
    const ids = rungs({}).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
