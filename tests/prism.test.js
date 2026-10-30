import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PRISM_PROVIDERS, PRISM_PLANNED, PRISM_SOURCES, PRISM_COPY, prismLabel } from '../src/data/prism.js';
import { prismTag } from '../src/components/prism-tag.js';
import { renderPrism } from '../src/screens/prism.js';
import { renderSaints } from '../src/screens/saints.js';
import { parseRoute } from '../src/router.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { createInitialState } from '../src/state.js';
import { isPrivateBreadcrumb } from '../src/utils/errorNoise.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/verified-urls.json', import.meta.url), 'utf8'));
// A save with exactly these accounts switched on.
const withAccounts = (...ids) => {
  const s = createInitialState();
  const off = Object.fromEntries(Object.entries(s.accounts ?? {}).map(([k, v]) => [k, { ...v, enabled: false }]));
  return { ...s, accounts: { ...off, ...Object.fromEntries(ids.map((id) => [id, { ...(s.accounts?.[id] ?? {}), enabled: true }])) } };
};

describe('the PRISM map', () => {
  it('names the nine companies from the slides, with the year each began', () => {
    expect(PRISM_PROVIDERS.map((p) => `${p.name} ${p.since}`)).toEqual([
      'Microsoft 2007', 'Yahoo 2008', 'Google 2009', 'Facebook (now Meta) 2009', 'Paltalk 2009', 'YouTube 2010', 'Skype 2011', 'AOL 2011', 'Apple 2012',
    ]);
    expect(PRISM_PLANNED.name).toBe('Dropbox');
  });

  it('labels every account: PRISM where the company was on the slides, NEXT for Dropbox, UPSTREAM for the rest', () => {
    expect(prismLabel('gmail')).toMatchObject({ kind: 'named', text: 'PRISM · 2009', company: 'Google' });
    expect(prismLabel('outlook').since).toBe(2007);
    expect(prismLabel('icloud').since).toBe(2012);
    expect(prismLabel('dropbox')).toMatchObject({ kind: 'next', text: 'PRISM · NEXT' });
    // Run today by a company on the slides, bought or built since.
    for (const [id, co] of [['instagram', 'Facebook (now Meta)'], ['whatsapp', 'Facebook (now Meta)'], ['ai_meta', 'Facebook (now Meta)'], ['linkedin', 'Microsoft'], ['github', 'Microsoft'], ['onedrive', 'Microsoft'], ['ai_google', 'Google'], ['icloud_drive', 'Apple']]) {
      expect(prismLabel(id, ACCOUNTS), id).toMatchObject({ kind: 'named', company: co });
    }
    // Not run by a company on the slides, but over the same tapped cables.
    for (const id of ['protonmail', 'signal', 'amazon', 'twitter', 'primary_bank', 'car_tesla', 'smart_tv']) expect(prismLabel(id, ACCOUNTS), id).toMatchObject({ kind: 'upstream', text: 'UPSTREAM' });
    // A topic, a defence or a data trail isn't an account: no label.
    for (const id of ['scam_defense', 'credit_freeze', 'people_search', 'browser_fingerprint', 'car_broker_verisk']) expect(prismLabel(id, ACCOUNTS), id).toBe(null);
    expect(prismLabel('not-an-account', ACCOUNTS)).toBe(null);
    for (const p of PRISM_PROVIDERS) for (const id of p.accounts) expect(ACCOUNTS[id], id).toBeTruthy();
  });

  it('the tag links to the PRISM map, and only where there is a label', () => {
    expect(prismTag("gmail")).toMatch(/^<a class="prism-tag prism-tag--named" href="#\/prism"[^>]*>.*PRISM · 2009<\/a>$/);
    expect(prismTag('dropbox')).toContain('PRISM · NEXT');
    expect(prismTag('signal')).toMatch(/class="prism-tag prism-tag--upstream"[^>]*>.*UPSTREAM<\/a>$/);
    expect(prismTag('not-an-account')).toBe('');
  });

  it('is at #/prism', () => {
    expect(parseRoute('#/prism')).toEqual({ screen: 'prism', params: {} });
  });

  it('lights the player\'s own accounts on the diagram and the list', () => {
    const none = renderPrism(withAccounts());
    expect(none).not.toContain(' ◂<');
    expect(none).toContain('Tell the city which accounts you have');
    const h = renderPrism(withAccounts('gmail', 'icloud'));
    expect(h).toContain('Google ◂<');
    expect(h).toContain('Apple ◂<');
    expect(h).not.toContain('Yahoo ◂<');
    expect(h).toMatch(/class="acct acct--mine" href="#\/(building|district)\/[^"]+">Gmail · yours/);
  });

  it('honors Saint Snowden, links the Guardian, the Post, Wikipedia and PRISM Break', () => {
    const h = renderPrism(createInitialState());
    for (const s of Object.values(PRISM_SOURCES)) expect(h, s.url).toContain(`href="${s.url.replace(/&/g, '&amp;')}"`);
    expect(h).toContain('SAINT EDWARD SNOWDEN');
    expect(h).toContain('href="#/saints"');
    expect(renderSaints(createInitialState())).toContain('href="#/prism"');
  });

  it('every source is a checked URL', () => {
    for (const s of Object.values(PRISM_SOURCES)) expect(Object.hasOwn(fixture.urls, s.url), s.url).toBe(true);
  });

  it('says it plainly, from the sources, with no hedging (Liz 2026-10-29: "it\'s in everything")', () => {
    const all = Object.values(PRISM_COPY).join(' ');
    expect(all).not.toMatch(/reportedly|allegedly|planned|not confirmed|unconfirmed|may have|might have/i);
    expect(PRISM_COPY.sub).toBe("It's in everything");
    expect(PRISM_COPY.everything).toContain('"nearly everything a user does on the internet"');
    expect(PRISM_COPY.what).toContain('"downstream"');
    expect(PRISM_COPY.you).toContain('without a warrant');
    // Strong, never invented: Dropbox is next on the slides, not a member.
    expect(PRISM_COPY.next).toBe('The slides named Dropbox as the next company coming on.');
    expect(PRISM_COPY.defend).toMatch(/who you talked to and when/);
  });

  it('every other account the player has is listed under the cables', () => {
    const h = renderPrism(withAccounts('gmail', 'signal', 'amazon'));
    const cables = h.slice(h.indexOf('EVERYTHING ELSE: THE CABLES'), h.indexOf('STILL RUNNING'));
    expect(cables).toContain('>Signal<');
    expect(cables).toContain('>Amazon<');
    expect(cables).not.toContain('>Gmail<');
  });

  it('nothing on the page puts an account in a URL, and its clicks stay private', () => {
    const h = renderPrism(withAccounts('gmail'));
    expect(h).not.toMatch(/href="[^"]*[?&][^"]*gmail/);
    for (const m of ['div.screen.prism > div.prism-panel > ul.prism-companies > li > a.acct.acct--mine', 'a.prism-tag'])
      expect(isPrivateBreadcrumb({ category: 'ui.click', message: m })).toBe(true);
  });
});
