// Recon campaign, phase 2: breach counts are email addresses only, the same
// rule as build.sql's allowlist, and every label says what it counts.
import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, updateMission } from '../src/state.js';
import { yourPart } from '../src/utils/collective.js';
import { renderCityTogether } from '../src/screens/city-together.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const s0 = createInitialState();
const breach = (s, acct, finding) => updateMission(s, `${acct}-recon-breach`, { status: 'completed', finding });

describe('The Whole City', () => {
  it('your part counts email addresses, not service re-checks', () => {
    let s = breach(breach(s0, 'gmail', '1-2-breaches'), 'primary_bank', '3plus-breaches');
    s = breach(s, 'linkedin', '1-2-breaches');
    expect(yourPart(s)).toEqual({ found: 1, fixed: 0 });
    s = updateMission(s, 'gmail-fortify-password', { status: 'completed' });
    expect(yourPart(s)).toEqual({ found: 1, fixed: 1 });
  });

  it('says breach rates count email addresses only, and "addresses" in your part', () => {
    const s = breach(s0, 'gmail', '1-2-breaches');
    const html = renderCityTogether(s, { collective: { status: 'ready', data: { k: 50, city: { players: 60 }, pods: [] } } });
    expect(html).toContain('Breach rates now count email addresses only.');
    expect(html).toContain('You found 1 email address in a known breach');
    expect(html).not.toMatch(/breached accounts? and fixed/);
  });
});
