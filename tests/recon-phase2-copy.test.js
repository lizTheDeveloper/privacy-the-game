// Recon campaign, phase 2: the new checks' copy stays literally true. These
// guard the facts the audit found wrong and the menu paths an official help
// page only partly confirmed (phrased generally, never invented).
import { describe, it, expect } from 'vitest';
import { RECON_ACCOUNT_MISSIONS } from '../src/data/missions-recon-accounts.js';

const byId = (id) => RECON_ACCOUNT_MISSIONS.find((m) => m.id === id);
function allText(m) {
  const parts = [m.title, m.briefing, ...m.steps.map((s) => s.text), m.scoutDialog.briefing, ...Object.values(m.scoutDialog.debrief)];
  for (const q of m.debriefQs) parts.push(q.label, q.hint || '', ...q.options.map((o) => o.text));
  return parts.join('\n');
}
// HIBP breach names (pulled 2026-10-07) the game may name.
const HIBP_NAMES = new Set(['LinkedIn', 'LinkedIn Scraped Data (2021)', 'Dropbox', 'Twitter (200M)', 'Twitter', 'Instagram', 'Facebook', 'Facebook Marketplace', 'Robinhood']);

describe('facts the audit found wrong never come back', () => {
  it.each([
    [/Chtrbox/i, 'there is no Chtrbox entry in HIBP'],
    [/common hit/i, 'the Facebook scrape almost never shows on an email search'],
    [/most credential-stuffed/i, 'unsourced superlative'],
    [/check the phone number/i, 'HIBP’s website no longer searches phone numbers'],
    [/\$\{/, 'literal template text'],
    [/Enter (the|your) email/i, 'a service check is not an email check'],
  ])('%s (%s)', (re) => {
    for (const m of RECON_ACCOUNT_MISSIONS) expect(allText(m), m.id).not.toMatch(re);
  });

  it('every breach the player is told to look for is a real HIBP breach name', () => {
    let named = 0;
    for (const m of RECON_ACCOUNT_MISSIONS) {
      const texts = [...m.steps.map((st) => st.text).filter((t) => /Have I Been Pwned results/.test(t)),
        ...m.debriefQs.filter((q) => q.id === 'service_breach').map((q) => q.label)];
      for (const t of texts) {
        for (const [, name] of t.matchAll(/“([^”]+)”/g)) {
          named += 1;
          expect(HIBP_NAMES.has(name), `${m.id}: “${name}”`).toBe(true);
        }
      }
    }
    expect(named).toBeGreaterThanOrEqual(10);
  });

  it('the breaches HIBP doesn’t list say so', () => {
    for (const id of ['cashapp-recon-password', 'ebay-recon-activity', 'uber-recon-activity', 'reddit-recon-password', 'discord-recon-password', 'amazon-recon-activity']) {
      expect(byId(id).briefing, id).toMatch(/isn’t in Have I Been Pwned’s (breach )?list/);
    }
  });

  it('scrapes say they had no passwords; LinkedIn and Dropbox say they did', () => {
    expect(byId('instagram-recon-service').briefing).toMatch(/no passwords/);
    expect(byId('twitter-recon-service').briefing).toMatch(/Neither included passwords/);
    expect(byId('linkedin-recon-service').briefing).toMatch(/included 164 million passwords/);
    expect(byId('dropbox-recon-service').briefing).toMatch(/included 68 million passwords/);
  });
});

describe('menu paths only partly confirmed are phrased generally', () => {
  it('Reddit says it has no documented path', () => {
    expect(allText(byId('reddit-recon-password'))).toMatch(/Reddit doesn’t give the menu path/);
  });

  it('PayPal’s logins page is website-only; automatic payments has its other name', () => {
    const t = allText(byId('paypal-recon-password'));
    expect(t).toMatch(/The PayPal app doesn’t have this page/);
    expect(t).toMatch(/Subscriptions and saved businesses/);
  });

  it('no unconfirmed Discord Devices list, Coinbase URL or eBay sign-in activity page', () => {
    expect(allText(byId('discord-recon-password'))).not.toMatch(/Devices/);
    expect(allText(byId('crypto_exchange-recon-password'))).not.toMatch(/accounts\.coinbase\.com/);
    expect(allText(byId('ebay-recon-activity'))).not.toMatch(/Sign-in activity|acctsec/);
  });
});
