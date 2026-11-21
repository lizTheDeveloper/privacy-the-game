import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderTimeline } from '../src/screens/timeline.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderStats } from '../src/screens/stats.js';
import { DISTRICTS } from '../src/data/districts.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { createInitialState } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { indefinite } from '../src/utils/article.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const count = (s, sub) => s.split(sub).length - 1;
const css = readFileSync('src/style.css', 'utf8');

describe('Social Timeline', () => {
  it('the set-up sentence appears once, above the list', () => {
    const s = createInitialState();
    for (const id of ['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin']) s.accounts[id] = { ...(s.accounts[id] || {}), enabled: true };
    const html = renderTimeline(s);
    const line = 'Tell us about your history here to plan your review.';
    expect(count(html, 'data-action="edit-social-profile"')).toBe(5);
    expect(count(html, line)).toBe(1);
    expect(html.indexOf(line)).toBeLessThan(html.indexOf('data-action="edit-social-profile"'));
  });

  it('with every platform set up, it is not shown', () => {
    const s = createInitialState();
    for (const id of ['facebook', 'twitter', 'tiktok', 'linkedin']) if (s.accounts[id]) s.accounts[id] = { ...s.accounts[id], enabled: false };
    s.accounts.instagram = { ...(s.accounts.instagram || {}), enabled: true };
    s.socialHistory = { instagram: { joinYear: 2015, eras: [] } };
    expect(renderTimeline(s)).not.toContain('Tell us about your history here');
  });
});

describe('district survey grammar', () => {
  // Every name a survey with an article asks about, and the article it takes by sound.
  // A new account in one of these districts fails here until it is added.
  const EXPECTED = {
    'Apple ID': 'an', 'Facebook Login': 'a', Gmail: 'a', 'Google Account': 'a', 'iCloud Mail': 'an', Microsoft: 'a', Outlook: 'an', ProtonMail: 'a', 'Yahoo Mail': 'a',
    'Primary Bank': 'a', 'Credit Card Portal': 'a', PayPal: 'a', Venmo: 'a', 'Cash App': 'a', 'Crypto Exchange': 'a', 'Investment Account': 'an',
    Amazon: 'an', eBay: 'an', Netflix: 'a', Shein: 'a', Spotify: 'a', Temu: 'a', Uber: 'an',
    BMW: 'a', Ford: 'a', GM: 'a', Honda: 'a', Hyundai: 'a', Kia: 'a', LexisNexis: 'a', Nissan: 'a', Stellantis: 'a', Subaru: 'a', Tesla: 'a', Toyota: 'a', Verisk: 'a', Volkswagen: 'a',
  };

  it('a/an follows sound: acronyms by letter, one-/uni-/use- words, every surveyed name', () => {
    const cases = {
      HBO: 'an', FBI: 'an', NSA: 'an', LLC: 'an', MBA: 'an', SSA: 'an', USB: 'a', 'U.S. bank': 'a', BMW: 'a', GM: 'a',
      Uber: 'an', Unicorn: 'a', 'one-time code': 'a', 'useful app': 'a', 'European bank': 'a', hour: 'an', 'honest broker': 'an',
      apple: 'an', pear: 'a', 'SIM card': 'a',
    };
    for (const [w, art] of Object.entries(cases)) expect(`${indefinite(w)} ${w}`, w).toBe(`${art} ${w}`);
    let seen = 0;
    for (const d of DISTRICTS) {
      if (!d.surveyQuestion) continue;
      const probe = d.surveyQuestion('Zz');
      if (!/\ba Zz\b/.test(probe)) continue; // this district's question has no article
      for (const a of Object.values(ACCOUNTS).filter((x) => x.district === d.id)) {
        expect(EXPECTED, `add ${a.name} to EXPECTED`).toHaveProperty([a.name]);
        const q = d.surveyQuestion(a.name);
        expect(q, q).toContain(` ${EXPECTED[a.name]} ${a.name}`);
        expect(q, q).not.toMatch(/\baccount account\b/i);
        seen++;
      }
    }
    expect(seen).toBe(Object.keys(EXPECTED).length);
    const vault = DISTRICTS.find((d) => d.id === 'vault');
    expect(vault.surveyQuestion('Investment Account')).toBe('Do you have an Investment Account?');
    expect(vault.surveyQuestion('PayPal')).toBe('Do you have a PayPal account?');
    expect(DISTRICTS.find((d) => d.id === 'marketplace').surveyQuestion('Uber')).toBe('Do you have an Uber account?');
  });

  it('the Vault survey on the page reads right', () => {
    const s = createInitialState();
    const html = renderDistrict(s, 'vault', 'survey');
    expect(html).not.toContain('a Investment Account account');
    expect(html).toContain('Do you have an Investment Account?');
  });
});

describe('Stats draws it tighter on phones', () => {
  it('three dials share a row and the four findings make a 2×2 grid, with the same words', () => {
    const html = renderStats(createInitialState());
    expect(html).toContain('class="stats-dials"');
    expect(html).toContain('class="stats-findings"');
    // Simple (the default) says "two-step sign-in"; Advanced keeps 2FA.
    for (const w of ['INTEGRITY', 'EXPOSURE', 'STREAK', 'BEST', 'ADDRESSES IN A BREACH', 'PASSWORDS RESET', 'TWO-STEP SIGN-IN ON', 'OPT-OUTS FILED']) expect(html).toContain(w);
    expect(renderStats(setReadLevel(createInitialState(), 'full'))).toContain('2FA ENABLED');
    const phone = css.slice(css.indexOf('/* stats: start */'), css.indexOf('/* stats: end */'));
    expect(phone).toMatch(/@media \(max-width: 899px\)/);
    expect(phone).toMatch(/\.stats-dials \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
    expect(phone).toMatch(/\.stats-findings \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    expect(phone).not.toMatch(/white-space:\s*nowrap/);
    // At 320px a dial is ~85px wide: its label may wrap, at 1px letter-spacing.
    expect(html).toMatch(/class="stat-dial-label"/);
    const narrow = phone.slice(phone.indexOf('@media (max-width: 899px)'));
    expect(narrow).toMatch(/\.stat-dial \{[^}]*overflow-wrap: anywhere/);
    expect(narrow).toMatch(/\.stat-dial-label \{[^}]*letter-spacing: 1px/);
  });
});
