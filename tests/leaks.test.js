import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LEAKS, leakById, leaksForAccount, AGENCIES, CHANNELS, PROGRAMS, PAPERWORK, AUTHORITIES, OUTSIDE, GOV_DATA } from '../src/data/leaks/index.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { renderLeak } from '../src/screens/leak.js';
import { renderGovernment } from '../src/screens/government.js';
import { buildGovGraph, pipeOf, PIPES } from '../src/utils/gov-graph.js';
import { prismTag } from '../src/components/prism-tag.js';
import { parseRoute } from '../src/router.js';
import { createInitialState } from '../src/state.js';
import { isPrivateBreadcrumb } from '../src/utils/errorNoise.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/verified-urls.json', import.meta.url), 'utf8'));
// ("planned" isn't here: a company's own plan, quoted, is a fact. The PRISM page's copy bans it.)
const HEDGE = /\b(reportedly|allegedly|may have|might have|not confirmed|unconfirmed)\b/i;
const agencyIds = new Set(AGENCIES.map((a) => a.id));
const allSources = () => [
  ...LEAKS.flatMap((e) => e.sources), ...AGENCIES.flatMap((a) => a.sources ?? []), ...CHANNELS.flatMap((c) => c.sources ?? []),
  ...PROGRAMS.flatMap((p) => p.sources ?? []), ...PAPERWORK.flatMap((m) => m.sources ?? []), ...AUTHORITIES.flatMap((a) => a.sources ?? []),
  ...OUTSIDE.flatMap((o) => o.sources ?? []),
];

describe('leak badges: the records', () => {
  it('every badge has a unique id, a badge, a title, an agency, a year, a summary and two or more sources', () => {
    expect(LEAKS.length).toBeGreaterThan(20);
    const ids = LEAKS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of LEAKS) {
      expect(e.id, e.id).toMatch(/^[a-z0-9-]+$/);
      expect(e.badge.length, e.id).toBeLessThanOrEqual(18);
      for (const k of ['title', 'agency', 'summary']) expect(typeof e[k] === 'string' && e[k].length > 0, `${e.id}.${k}`).toBe(true);
      expect(Number.isInteger(e.year), e.id).toBe(true);
      expect(e.sources.length, e.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('labels only accounts that exist', () => {
    for (const e of LEAKS) for (const id of e.accounts) expect(ACCOUNTS[id], `${e.id} → ${id}`).toBeTruthy();
  });

  it('every flow names known agencies and says who checks it', () => {
    for (const e of LEAKS) {
      expect(e.flow, e.id).toBeTruthy();
      for (const id of [...(e.flow.to ?? []), ...(e.flow.sharedWith ?? [])]) expect(agencyIds.has(id), `${e.id}: ${id}`).toBe(true);
      expect(e.flow.checkedBy?.length > 0, e.id).toBe(true);
    }
    const ends = new Set([...agencyIds, ...OUTSIDE.map((o) => o.id)]);
    for (const c of CHANNELS) for (const id of [c.from, c.to]) expect(ends.has(id), `${c.id}: ${id}`).toBe(true);
  });

  it('says it plainly (Liz 2026-10-29): no hedging words', () => {
    for (const e of LEAKS) expect(`${e.summary} ${JSON.stringify(e.flow)}`, e.id).not.toMatch(HEDGE);
    for (const m of PAPERWORK) expect(m.reality, m.id).not.toMatch(HEDGE);
  });

  it('every source is a checked URL', () => {
    const missing = [...new Set(allSources().map((s) => s.url))].filter((u) => !Object.hasOwn(fixture.urls, u));
    expect(missing).toEqual([]);
  });

  it('a scale number points at a source that exists', () => {
    for (const e of [...LEAKS, ...CHANNELS, ...AGENCIES, ...PROGRAMS]) {
      if (!e.scale) continue;
      expect(Number.isFinite(e.scale.value), e.id).toBe(true);
      expect(e.sources?.[e.scale.source ?? 0], e.id).toBeTruthy();
    }
  });
});

describe('leak badges: on the accounts and their own pages', () => {
  it('an account carries a badge for each leak that names it, each linking to its page', () => {
    const tagged = Object.keys(ACCOUNTS).find((id) => leaksForAccount(id).length > 0);
    expect(tagged).toBeTruthy();
    const html = prismTag(tagged);
    for (const e of leaksForAccount(tagged)) expect(html).toContain(`href="#/leak/${e.id}"`);
  });

  it('each badge has its own page with every source', () => {
    expect(parseRoute('#/leak/prism')).toEqual({ screen: 'leak', params: { id: 'prism' } });
    for (const e of LEAKS) {
      const h = renderLeak(createInitialState(), e);
      for (const s of e.sources) expect(h, `${e.id} ${s.url}`).toContain(`href="${s.url.replace(/&/g, '&amp;')}"`);
      expect(h).toContain('WHO GETS IT');
    }
    expect(renderLeak(createInitialState(), leakById('nope'))).toContain('NOT FOUND');
  });
});

describe('who gets your data: the government map', () => {
  it('is at #/government and draws you, the pipes, every agency and who checks', () => {
    expect(parseRoute('#/government')).toEqual({ screen: 'government', params: {} });
    const h = renderGovernment(createInitialState(), GOV_DATA);
    expect(h).toContain('Who gets your data');
    for (const a of AGENCIES) expect(h, a.id).toContain(`data-node="${a.id}"`);
    for (const p of PIPES) expect(h, p.id).toContain(`data-node="${p.id}"`);
  });

  it('every badge lands in a pipe, and every pipe has something on file', () => {
    const g = buildGovGraph(GOV_DATA);
    for (const e of LEAKS) expect(PIPES.map((p) => p.id), e.id).toContain(pipeOf(e));
    for (const p of PIPES) expect(g.entriesByPipe[p.id].length, p.id).toBeGreaterThan(0);
  });

  it('opening an agency shows its file: what, under which law, when, who checks', () => {
    const fbi = renderGovernment(createInitialState(), GOV_DATA, { selected: 'FBI' });
    expect(fbi).toContain('class="gov-file"');
    expect(fbi).toMatch(/UNDER<\/dt>/);
    expect(fbi).toMatch(/CHECKED BY<\/dt>/);
  });

  it('the scale ruler and the myths are there; clicks stay private', () => {
    const h = renderGovernment(createInitialState(), GOV_DATA);
    expect(h).toContain('The scale');
    expect(PAPERWORK.length).toBeGreaterThanOrEqual(6);
    for (const m of ['g.gov-node', 'div.gov-list > button']) expect(isPrivateBreadcrumb({ category: 'ui.click', message: m })).toBe(true);
  });
});
