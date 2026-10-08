// Breaker round 7: checks that copy rewritten in rounds 5 and 6 is itself true.
// Sources checked 2026-10-07.
import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';

const everything = (id) => {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error(`no mission ${id}`);
  return JSON.stringify(m);
};

describe('round 7: rewritten copy', () => {
  // Source: Have I Been Pwned, Robinhood breach page https://haveibeenpwned.com/Breach/Robinhood :
  // compromised data is "Email addresses, Names" (over 5 million emails and 2 million names),
  // so "emails only" is false.
  it('investment_account-recon-password: HIBP Robinhood entry is not "emails only"', () => {
    expect(everything('investment_account-recon-password')).not.toMatch(/emails only/);
  });
});
