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
      'Microsoft 2007', 'Yahoo 2008', 'Google 2009', 'Facebook 2009', 'Paltalk 2009', 'YouTube 2010', 'Skype 2011', 'AOL 2011', 'Apple 2012',
    ]);
    expect(PRISM_PLANNED.name).toBe('Dropbox');
  });

  it('labels only accounts run by a named company; Dropbox as planned', () => {
    expect(prismLabel('gmail')).toMatchObject({ kind: 'named', text: 'PRISM · 2009', company: 'Google' });
    expect(prismLabel('outlook').since).toBe(2007);
    expect(prismLabel('icloud').since).toBe(2012);
    expect(prismLabel('dropbox')).toMatchObject({ kind: 'planned', text: 'PRISM · PLANNED' });
    // Bought by Facebook after 2013, or never named: no label.
    for (const id of ['instagram', 'whatsapp', 'protonmail', 'signal', 'amazon', 'twitter']) expect(prismLabel(id), id).toBe(null);
    for (const p of PRISM_PROVIDERS) for (const id of p.accounts) expect(ACCOUNTS[id], id).toBeTruthy();
  });

  it('the tag links to the PRISM map, and only where there is a label', () => {
    expect(prismTag('gmail')).toMatch(/^<a class="prism-tag" href="#\/prism"[^>]*>.*PRISM · 2009<\/a>$/);
    expect(prismTag('dropbox')).toContain('prism-tag--planned');
    expect(prismTag('signal')).toBe('');
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

  it('says only what the sources say: targets, the companies\' denial, upstream, and the 702 doubt', () => {
    expect(PRISM_COPY.everything).toMatch(/chosen targets, not every account/);
    expect(PRISM_COPY.what).toMatch(/companies all denied/);
    expect(PRISM_COPY.status).toMatch(/reported to have lapsed in June 2026/);
    expect(PRISM_COPY.defend).toMatch(/who you talked to and when/);
  });

  it('nothing on the page puts an account in a URL, and its clicks stay private', () => {
    const h = renderPrism(withAccounts('gmail'));
    expect(h).not.toMatch(/href="[^"]*[?&][^"]*gmail/);
    for (const m of ['div.screen.prism > div.prism-panel > ul.prism-companies > li > a.acct.acct--mine', 'a.prism-tag'])
      expect(isPrivateBreadcrumb({ category: 'ui.click', message: m })).toBe(true);
  });
});
