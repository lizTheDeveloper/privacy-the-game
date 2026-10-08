// Breaker round 2 for recon Phase 3 (git diff 7c0e5ca..HEAD, plus a fresh look).
// Passing tests pin the pair-aware counts against build.sql's rules; the
// failing ones (each commented) describe behaviour the breaker believes is
// wrong.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../../src/data/missions.js';
import { createInitialState } from '../../src/state.js';
import { calcFindings, districtBreachedAddresses, addressChecks } from '../../src/utils/calc.js';
import { yourPart } from '../../src/utils/collective.js';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/verified-urls.json', import.meta.url), 'utf8'));

// Put records straight into the save, so completedAt is whatever the test says
// (an old save has none).
function save(records) {
  const s = createInitialState();
  const missions = { ...s.missions };
  for (const [id, r] of Object.entries(records)) missions[id] = { status: 'completed', ...r };
  return { ...s, missions };
}
const T1 = '2026-01-01T00:00:00.000Z';
const T2 = '2026-02-01T00:00:00.000Z';
const agree = (s) => {
  const f = calcFindings(s).breachesFound;
  const y = yourPart(s).found;
  expect(f).toBe(y);
  return f;
};

describe('pair-aware counts (local) follow build.sql', () => {
  it('old save, no timestamps, both checks of a pair: the more severe answer counts once', () => {
    const s = save({
      'gmail-recon-breach': { finding: 'no-breaches' },
      'google-recon-breach': { finding: '3plus-breaches' },
    });
    expect(agree(s)).toBe(1);
    expect(addressChecks(s)).toHaveLength(1);
  });

  it('with timestamps the later answer wins, in either account order', () => {
    const a = save({
      'gmail-recon-breach': { finding: '3plus-breaches', completedAt: T1 },
      'google-recon-breach': { finding: 'no-breaches', completedAt: T2 },
    });
    expect(agree(a)).toBe(0);
    const b = save({
      'gmail-recon-breach': { finding: 'no-breaches', completedAt: T2 },
      'google-recon-breach': { finding: '3plus-breaches', completedAt: T1 },
    });
    expect(agree(b)).toBe(0);
  });

  it.each([['gmail', 'google'], ['icloud', 'apple_id'], ['outlook', 'microsoft']])(
    'a split %s/%s pair: each address is fixed only by its own reset, both directions', (first, second) => {
      const base = {
        [`${first}-recon-breach`]: { finding: '1-2-breaches' },
        [`${second}-recon-breach`]: { finding: '1-2-breaches', same_address: 'different-address' },
      };
      expect(yourPart(save(base))).toEqual({ found: 2, fixed: 0 });
      expect(yourPart(save({ ...base, [`${first}-fortify-password`]: {} }))).toEqual({ found: 2, fixed: 1 });
      expect(yourPart(save({ ...base, [`${second}-fortify-2fa`]: {} }))).toEqual({ found: 2, fixed: 1 });
      expect(yourPart(save({ ...base, [`${first}-fortify-password`]: {}, [`${second}-fortify-password`]: {} }))).toEqual({ found: 2, fixed: 2 });
    });

  it('an unsplit pair: a 2FA on either account fixes the one address', () => {
    const s = save({
      'icloud-recon-breach': { finding: '3plus-breaches' },
      'apple_id-recon-breach': { finding: '3plus-breaches' },
      'apple_id-fortify-2fa': {},
    });
    expect(yourPart(s)).toEqual({ found: 1, fixed: 1 });
  });

  it('a pair split by a second account that skipped still keeps the first address separate', () => {
    // build.sql: rc_split looks only at the second account's latest answer.
    const s = save({
      'gmail-recon-breach': { finding: '3plus-breaches' },
      'google-recon-breach': { status: 'skipped', finding: 'skip', same_address: 'different-address' },
      'google-fortify-password': {},
    });
    expect(yourPart(s)).toEqual({ found: 1, fixed: 0 });
  });

  it('a second account refiled as skip leaves the first account counting alone', () => {
    const s = save({
      'gmail-recon-breach': { finding: '1-2-breaches' },
      'google-recon-breach': { status: 'skipped', finding: 'skip' },
    });
    expect(agree(s)).toBe(1);
  });

  it('one account of a pair not enabled still counts its saved check (the SQL has no enabled flag)', () => {
    let s = save({ 'google-recon-breach': { finding: '1-2-breaches' }, 'gmail-fortify-password': {} });
    s = { ...s, accounts: { ...s.accounts, google: { ...s.accounts.google, enabled: false } } };
    expect(yourPart(s)).toEqual({ found: 1, fixed: 1 });
    expect(calcFindings(s).breachesFound).toBe(1);
  });

  it('the Master Keys card count equals Stats and Your Part when a pair is split', () => {
    const s = save({
      'gmail-recon-breach': { finding: '1-2-breaches' },
      'google-recon-breach': { finding: '3plus-breaches', same_address: 'different-address' },
      'outlook-recon-breach': { finding: 'no-breaches' },
    });
    expect(districtBreachedAddresses(s, 'master-keys')).toBe(2);
    expect(calcFindings(s).breachesFound).toBe(2);
  });

  it('yahoo and protonmail are single addresses and never pair with anything', () => {
    const s = save({ 'yahoo-recon-breach': { finding: '1-2-breaches' }, 'protonmail-recon-breach': { finding: '3plus-breaches' } });
    expect(yourPart(s)).toEqual({ found: 2, fixed: 0 });
  });

  it('a "same" filing (no finding) adds no address and leaves the partner alone', () => {
    const s = save({
      'gmail-recon-breach': { finding: '1-2-breaches' },
      'google-recon-breach': { same_address: 'same-as-gmail' },
    });
    expect(addressChecks(s)).toHaveLength(1);
  });
});

// The step-text scan only reads "host.tld/path" with five TLDs. An address
// written without a path ("dnsleaktest.com"), an IP address ("1.1.1.1/help") or
// another TLD is a link a player will type, so the promise "every address named
// in step text is checked" covers it too.
describe('step-text addresses beyond host/path', () => {
  const known = Object.keys(fixture.urls).map((u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase());
  // Names of services, not places to go; placeholders; hostnames to type into
  // a settings box.
  const NOT_A_PLACE = new Set(['login.gov', 'id.me', 'dns.quad9.net', 'your-workspace.slack.com']);
  const re = /\b(?:\d{1,3}(?:\.\d{1,3}){3}|(?:[a-z0-9-]+\.)+(?:com|org|gov|net|io|me|us|ai|co|edu|app|dev|tv|info|mil))\b(?:\/[^\s"'“”),;]*)?/gi;
  const stepTexts = [];
  for (const m of MISSIONS) {
    const lists = [m.steps || [], ...Object.values(m.stepsByManager || {}), ...Object.values(m.reportSteps || {})];
    for (const st of lists.flat()) stepTexts.push([m.id, st.text || '']);
  }
  const allKnownHosts = known.map((k) => k.replace(/\/.*/, ''));

  // FAILS. Believed wrong: "visit 1.1.1.1/help (Cloudflare) or dnsleaktest.com"
  // (smart_network-reclaim-dns), "Open myverizon.com" (sim_protection-fortify-pin)
  // and the same Cloudflare address elsewhere name places to type that are in
  // neither the allowlist nor the text scan, because the scan needs a TLD plus
  // a "/" and only five TLDs. The ledger promises no unchecked address in step
  // text. (Live check by the breaker: dnsleaktest.com answers 405 to HEAD;
  // https://myverizon.com fails TLS from curl while http redirects to the
  // sign-in page; 1.1.1.1/help redirects to one.one.one.one/help.)
  it('every address in step text, with or without a path, IP or any common TLD, is in the allowlist', () => {
    const bad = [];
    for (const [id, text] of stepTexts) {
      for (const hit of text.match(re) || []) {
        const h = hit.replace(/[.,;:]+$/, '').replace(/\/$/, '').toLowerCase();
        const host = h.replace(/\/.*/, '');
        if (NOT_A_PLACE.has(host)) continue;
        // DNS server addresses and hostnames are typed into settings; router
        // addresses are on the player's own network. Only a path makes an IP a page.
        if (/^\d+(\.\d+){3}$/.test(host) && !h.includes('/')) continue;
        if (/(cloudflare-dns\.com|quad9\.net)$/.test(host)) continue;
        const ok = known.some((k) => k === h || k.endsWith(`/${h}`)) || (!h.includes('/') && allKnownHosts.some((kh) => kh === host || kh.endsWith(`.${host}`)));
        if (!ok) bad.push(`${id}: ${hit}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('no briefing or Scout line prints a real address that is not in the allowlist', () => {
    const lines = [];
    for (const m of MISSIONS) {
      lines.push([m.id, m.briefing || ''], [m.id, m.scoutDialog?.briefing || '']);
      for (const v of Object.values(m.scoutDialog?.debrief || {})) lines.push([m.id, typeof v === 'string' ? v : '']);
    }
    // phishing look-alikes and brand names are examples, not links.
    const EXAMPLES = new Set(['login.gov', 'id.me', 'accounts.google.com', 'google-security-alert.com', 'accountprotection.microsoft.com',
      'paypa1.com', 'google-security.com', 'chase-verify.com']);
    const bad = [];
    for (const [id, text] of lines) {
      for (const hit of text.match(re) || []) {
        const host = hit.replace(/\/.*/, '').toLowerCase();
        if (EXAMPLES.has(host)) continue;
        const ok = known.some((k) => k === hit.toLowerCase() || k.startsWith(host));
        if (!ok) bad.push(`${id}: ${hit}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('upper case and trailing punctuation do not hide an address from the existing scan shape', () => {
    const scan = (t) => (t.match(/\b(?:[a-z0-9-]+\.)+(?:com|org|gov|net|io|me)\/[a-z0-9\-_/.?=]+/gi) || [])
      .map((x) => x.replace(/[./]$/, '').toLowerCase());
    expect(scan('Visit HaveIBeenPwned.com/Passwords.')).toEqual(['haveibeenpwned.com/passwords']);
    expect(scan('(see ssa.gov/myaccount), then')).toEqual(['ssa.gov/myaccount']);
  });
});
