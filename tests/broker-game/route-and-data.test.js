import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseRoute } from '../../src/router.js';
import { loadBrokerData, brokerDataStatus, brokerData, resetBrokerData } from '../../src/utils/broker-data.js';
import { renderBrokerMap } from '../../src/screens/broker-map.js';
import { createInitialState } from '../../src/state.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  resetBrokerData();
});

const okFetch = () => {
  const calls = [];
  const fn = async (url) => { calls.push(url); return { ok: true, json: async () => ({ url }) }; };
  fn.calls = calls;
  return fn;
};

describe('broker map route and data', () => {
  it('the route is one fixed hash', () => {
    expect(parseRoute('#/reclamation/map')).toEqual({ screen: 'broker-map', params: {} });
    expect(parseRoute('#/reclamation/map/spokeo').screen).toBe('city');
    expect(parseRoute('#/reclamation/map?star=spokeo').screen).toBe('city');
  });

  it('loadBrokerData fetches both files once', async () => {
    const f = okFetch();
    expect(brokerDataStatus()).toBe('idle');
    const [a, b] = await Promise.all([loadBrokerData(f), loadBrokerData(f)]);
    await loadBrokerData(f);
    expect(f.calls.sort()).toEqual(['data/broker-layout.json', 'data/broker-map.json']);
    expect(a).toBe(b);
    expect(brokerDataStatus()).toBe('ready');
    expect(brokerData()).toEqual({ map: { url: 'data/broker-map.json' }, layout: { url: 'data/broker-layout.json' } });
  });

  it('a failed load rejects, clears the memo and can retry', async () => {
    const bad = async () => ({ ok: false, status: 500 });
    await expect(loadBrokerData(bad)).rejects.toThrow();
    expect(brokerDataStatus()).toBe('error');
    expect(brokerData()).toBeNull();
    const f = okFetch();
    await loadBrokerData(f);
    expect(brokerDataStatus()).toBe('ready');
    expect(f.calls).toHaveLength(2);
  });

  it('shows loading and error panels', () => {
    const state = createInitialState();
    expect(renderBrokerMap(state, { status: 'loading', data: null })).toContain('LOADING THE FIELD…');
    const html = renderBrokerMap(state, { status: 'error', data: null });
    expect(html).toContain("COULDN'T LOAD THE MAP");
    expect(html).toContain('data-action="retry-broker-data"');
    expect(html).toContain('TRY AGAIN');
    expect(html).toContain('#/district/reclamation');
  });
});
