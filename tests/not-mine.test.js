import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDistrict } from '../src/screens/district.js';
import { createInitialState, toggleAccount } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { setReadLevel } from '../src/utils/reading.js';
import { notMineLabel } from '../src/data/not-mine.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

// Liz 2026-11-18: the Simple briefing had no way to say "I don't have Gmail". Big words, on the
// secondary button so it isn't as big and blue as START.
const ID = 'gmail-recon-breach';
const withGmail = (level) => toggleAccount(setReadLevel(createInitialState(), level), 'gmail', true);
const button = /<button class="btn-secondary not-mine" data-action="not-mine" data-account="gmail" data-href="#\/next">I don’t have Gmail<\/button>/;

describe('"I don’t have Gmail" on the Simple briefing', () => {
  it('is there, as a secondary button, under START', () => {
    const h = renderBriefing(withGmail('simplest'), ID);
    expect(h).toMatch(button);
    expect(h.indexOf('data-action="not-mine"')).toBeGreaterThan(h.indexOf('class="btn-primary focus-go"'));
  });

  it('is not on Full intel, and not when Gmail is already off', () => {
    expect(renderBriefing(withGmail('full'), ID)).not.toContain('data-action="not-mine"');
    const off = toggleAccount(withGmail('simplest'), 'gmail', false);
    expect(renderBriefing(off, ID)).not.toContain('data-action="not-mine"');
  });

  it('uses big words, not the small capitals the other secondary buttons use', () => {
    const css = readFileSync('src/style.css', 'utf8');
    const rule = css.match(/\.btn-secondary\.not-mine \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/font-size: 2\dpx/);
    expect(rule).toContain('letter-spacing: 0');
  });

  it('says it plainly for every account that has one', () => {
    expect(notMineLabel('gmail')).toBe('I don’t have Gmail');
    expect(notMineLabel('instagram')).toBe('I don’t use Instagram');
    expect(notMineLabel('primary_bank')).toBe('I don’t have a bank account');
    expect(notMineLabel('ai_meta')).toBe('I don’t have Facebook or Instagram');
    // Worth doing even without one (the Capitol), added by the player (cars), or a topic.
    for (const id of ['ssa', 'irs', 'car_toyota', 'car_broker_lexisnexis', 'device_security', 'people_search', 'the_crew', 'nope']) expect(notMineLabel(id)).toBeNull();
    const odd = MISSIONS.map((m) => notMineLabel(m.accountId)).filter((l) => l && /Login|Portal|Account\b|Primary|Exchange/.test(l));
    expect(odd).toEqual([]);
  });

  it('shows on the Simple briefing of every mission whose account has a label', () => {
    const missing = [];
    for (const m of MISSIONS) {
      if (!notMineLabel(m.accountId) || !ACCOUNTS[m.accountId]) continue;
      const s = toggleAccount(setReadLevel(createInitialState(), 'simplest'), m.accountId, true);
      const h = renderBriefing(s, m.id);
      // A briefing that is a different panel (a password not needed) has no START either.
      if (h.includes('class="btn-primary focus-go"') && !h.includes('data-action="not-mine"')) missing.push(m.id);
    }
    expect(missing).toEqual([]);
  });

  it('turns the account off and goes back to the district', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const i = app.indexOf("} else if (action === 'not-mine') {");
    expect(i).toBeGreaterThan(-1);
    const block = app.slice(i, app.indexOf("} else if (action === 'toggle-account') {"));
    expect(block).toContain('toggleAccount(state, id, false)');
    expect(block).toContain("track('account-toggled', { account: id, enabled: false })");
    expect(block).toContain('location.hash = el.dataset.href');
  });
});

describe('the district after "I don’t have Gmail"', () => {
  it('Scout says it is off the list, with one tap to put it back', () => {
    const off = toggleAccount(withGmail('simplest'), 'gmail', false);
    const h = renderDistrict(off, 'master-keys', 'recon', { notMine: 'gmail' });
    expect(h).toContain('Got it. I took Gmail off your list.');
    expect(h).toMatch(/data-action="toggle-account" data-account="gmail">Put Gmail back<\/button>/);
  });

  it('says nothing once Gmail is back on, or without the briefing tap', () => {
    expect(renderDistrict(withGmail('simplest'), 'master-keys', 'recon', { notMine: 'gmail' })).not.toContain('data-not-mine');
    const off = toggleAccount(withGmail('simplest'), 'gmail', false);
    expect(renderDistrict(off, 'master-keys', 'recon')).not.toContain('data-not-mine');
  });
});
