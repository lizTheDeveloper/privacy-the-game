// Recon campaign, phase 2: breach counts are email addresses only, the same
// rule as build.sql's allowlist, and every label says what it counts.
import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, updateMission } from '../src/state.js';
import { calcFindings, getBuildingState, isBreachFound, districtBreachedAddresses } from '../src/utils/calc.js';
import { yourPart } from '../src/utils/collective.js';
import { renderMilestone } from '../src/screens/milestone.js';
import { milestoneCardLine } from '../src/utils/milestone-card.js';
import { renderCityTogether } from '../src/screens/city-together.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const s0 = createInitialState();
const breach = (s, acct, finding) => updateMission(s, `${acct}-recon-breach`, { status: 'completed', finding });

describe('breach found = an email address breach check that found one', () => {
  it('an old service breach record is no longer a breach found', () => {
    const s = breach(breach(s0, 'primary_bank', '3plus-breaches'), 'gmail', '1-2-breaches');
    expect(isBreachFound('primary_bank-recon-breach', s.missions['primary_bank-recon-breach'])).toBe(false);
    expect(isBreachFound('gmail-recon-breach', s.missions['gmail-recon-breach'])).toBe(true);
    expect(calcFindings(s).breachesFound).toBe(1);
  });

  it('a bank fully done after an old "breached" email re-check is not scarred', () => {
    let s = breach(s0, 'primary_bank', '3plus-breaches');
    for (const kind of ['password', '2fa', 'alerts']) s = updateMission(s, `primary_bank-fortify-${kind}`, { status: 'completed' });
    expect(getBuildingState(s, 'primary_bank')).toBe('liberated');
  });
});

describe('the chapter-complete screen and share card', () => {
  it('Master Keys counts addresses found in a breach, with a label that says so', () => {
    const s = breach(breach(breach(s0, 'gmail', '1-2-breaches'), 'yahoo', '3plus-breaches'), 'outlook', 'no-breaches');
    expect(districtBreachedAddresses(s, 'master-keys')).toBe(2);
    const html = renderMilestone(s, 'master-keys');
    expect(html).not.toContain('BREACHES FIXED');
    expect(html).toContain('ADDRESSES FOUND IN A BREACH');
    expect(html).toMatch(/color: var\(--amber\)[^>]*>2</);
  });

  it('a district with no address checks shows no breach stat at all', () => {
    const s = breach(s0, 'primary_bank', '3plus-breaches');
    expect(districtBreachedAddresses(s, 'vault')).toBe(null);
    const html = renderMilestone(s, 'vault');
    expect(html).not.toMatch(/BREACH/);
  });

  it('the card line names addresses, and leaves them out where there are none to count', () => {
    expect(milestoneCardLine({ accountsSecured: 8, addressesBreached: 2, integrityPercent: 40 }))
      .toBe('8 accounts secured · 2 addresses found in a breach · 40% integrity');
    expect(milestoneCardLine({ accountsSecured: 8, addressesBreached: 1, integrityPercent: 40 }))
      .toBe('8 accounts secured · 1 address found in a breach · 40% integrity');
    expect(milestoneCardLine({ accountsSecured: 5, addressesBreached: null, integrityPercent: 40 }))
      .toBe('5 accounts secured · 40% integrity');
    expect(milestoneCardLine({ accountsSecured: 5, integrityPercent: 40 })).not.toMatch(/fixed/);
  });
});

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

describe('ruling: the chapter stat hides until an address was checked', () => {
  it('Master Keys with no address check shows no breach stat; a clean check shows 0', () => {
    expect(districtBreachedAddresses(s0, 'master-keys')).toBe(null);
    expect(renderMilestone(s0, 'master-keys')).not.toMatch(/FOUND IN A BREACH/);
    const skipped = updateMission(s0, 'gmail-recon-breach', { status: 'skipped', finding: 'skip' });
    expect(districtBreachedAddresses(skipped, 'master-keys')).toBe(null);
    const clean = breach(s0, 'gmail', 'no-breaches');
    expect(districtBreachedAddresses(clean, 'master-keys')).toBe(0);
    expect(renderMilestone(clean, 'master-keys')).toMatch(/ADDRESSES FOUND IN A BREACH/);
  });
});
