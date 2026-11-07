// Repairing a save with no accounts, or loading one from before an account
// existed, fills the missing accounts from the new-city defaults: the Freeway's
// car accounts stay off until a vehicle is added (logic sweep #4).
import { describe, it, expect } from 'vitest';
import { loadState, createInitialState } from '../src/state.js';
import { ACCOUNTS } from '../src/data/accounts.js';

const store = (save) => {
  const m = new Map([['reclaim-city-state', JSON.stringify(save)]]);
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
const FREEWAY = Object.keys(ACCOUNTS).filter((id) => ACCOUNTS[id].district === 'freeway');
const on = (s, ids) => ids.filter((id) => s.accounts[id]?.enabled);

describe('missing accounts are filled from the defaults', () => {
  it('there are Freeway accounts, and a new city has none of them on', () => {
    expect(FREEWAY.length).toBeGreaterThanOrEqual(14);
    expect(on(createInitialState(), FREEWAY)).toEqual([]);
  });

  it('a damaged save with no accounts object keeps its missions and gets the new-city accounts', () => {
    const save = { ...createInitialState(), accounts: undefined, missions: { 'gmail-recon-breach': { status: 'completed' } } };
    const s = loadState(store(save));
    expect(s.missions['gmail-recon-breach'].status).toBe('completed');
    expect(on(s, FREEWAY)).toEqual([]);
    expect(s.accounts).toEqual(createInitialState().accounts);
  });

  it('a save from before the Freeway gets its car accounts off, and keeps every choice it made', () => {
    const fresh = createInitialState();
    const accounts = Object.fromEntries(Object.entries(fresh.accounts).filter(([, a]) => a.district !== 'freeway'));
    accounts.gmail = { ...accounts.gmail, enabled: false };
    const s = loadState(store({ ...fresh, accounts, vehicles: undefined }));
    expect(on(s, FREEWAY)).toEqual([]);
    expect(s.accounts.gmail.enabled).toBe(false);
    for (const id of FREEWAY) expect(s.accounts[id]).toEqual(fresh.accounts[id]);
  });

  it('an account a later release added outside the Freeway is filled as on, as for a new city', () => {
    const fresh = createInitialState();
    const id = Object.keys(fresh.accounts).find((k) => fresh.accounts[k].enabled);
    const { [id]: _gone, ...accounts } = fresh.accounts;
    const s = loadState(store({ ...fresh, accounts }));
    expect(s.accounts[id]).toEqual(fresh.accounts[id]);
  });

  it('a car account the player turned on is kept on', () => {
    const fresh = createInitialState();
    fresh.accounts[FREEWAY[0]].enabled = true;
    expect(loadState(store(fresh)).accounts[FREEWAY[0]].enabled).toBe(true);
  });

  it('filling from the defaults does not share objects with them', () => {
    const a = loadState(store({ ...createInitialState(), accounts: {} }));
    a.accounts[FREEWAY[0]].enabled = true;
    const b = loadState(store({ ...createInitialState(), accounts: {} }));
    expect(b.accounts[FREEWAY[0]].enabled).toBe(false);
  });
});
