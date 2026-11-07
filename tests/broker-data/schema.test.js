import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateBroker, validateLink, validateSource, validateDataset,
  KINDS, OPT_OUT_METHODS, LINK_TYPES, TIERS, TIER_A_SOURCE_KINDS,
} from '../../research/data-brokers/build/schema.js';

const sourceIds = new Set(['s1']);
const src = { url: 'https://example.com/a', archived: 'https://web.archive.org/web/20261018000000/https://example.com/a', kind: 'sec-10k', title: 'T', accessed: '2026-10-18' };
const broker = (o = {}) => ({
  id: 'acme', name: 'Acme', aliases: [], parent: null, kind: ['marketing'],
  registries: { CA: '2024', VT: null }, sells: ['lists'],
  optOut: { method: 'web-form', url: 'https://acme.example/optout' },
  size: { known: false, signals: [] }, sources: [], ...o,
});
const link = (o = {}) => ({ from: 'a', to: 'b', type: 'supplies', tier: 'A', claim: 'c', sources: ['s1'], published: true, ...o });

function tmpDataset({ brokers = [], links = [], sources = { s1: src } } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'brk-'));
  mkdirSync(join(dir, 'brokers'));
  mkdirSync(join(dir, 'staging'));
  writeFileSync(join(dir, 'staging', 'junk.json'), '{not json');
  for (const [file, b] of brokers) writeFileSync(join(dir, 'brokers', file), JSON.stringify(b));
  writeFileSync(join(dir, 'links.json'), JSON.stringify(links));
  writeFileSync(join(dir, 'sources.json'), JSON.stringify(sources));
  return dir;
}

describe('constants', () => {
  it('are frozen with the exact vocab', () => {
    expect(Object.isFrozen(KINDS)).toBe(true);
    expect(OPT_OUT_METHODS).toEqual(['web-form', 'email', 'mail', 'portal', 'sweep-only', 'none']);
    expect(LINK_TYPES).toEqual(['owns', 'supplies', 'buys', 'matches-identity']);
    expect(TIERS).toEqual(['A', 'B', 'C']);
    expect(KINDS).toHaveLength(11);
  });
});

describe('validateBroker', () => {
  const v = (b) => validateBroker(b, { sourceIds });
  it('valid broker passes', () => expect(v(broker())).toEqual([]));
  it('unknown kind fails', () => expect(v(broker({ kind: ['bogus'] })).length).toBeGreaterThan(0));
  it('optOut null is allowed', () => expect(v(broker({ optOut: null }))).toEqual([]));
  it('optOut.alternates: http(s) url, site, and a known source', () => {
    const oo = (alternates) => broker({ optOut: { method: 'web-form', url: 'https://acme.example/optout', alternates } });
    expect(v(oo([{ site: 'dba.example', url: 'https://dba.example/remove', source: 's1' }]))).toEqual([]);
    expect(v(oo([{ site: 'dba.example', url: 'ftp://dba.example/x', source: 's1' }])).length).toBe(1);
    expect(v(oo([{ site: 'dba.example', url: 'https://dba.example/x', source: 'nope' }])).length).toBe(1);
    expect(v(oo([{ url: 'https://dba.example/x', source: 's1' }])).length).toBe(1);
    expect(v(oo('x')).length).toBe(1);
  });
  it('optOut.method none needs no url', () => expect(v(broker({ optOut: { method: 'none' } }))).toEqual([]));
  it('web-form needs url', () => expect(v(broker({ optOut: { method: 'web-form' } })).length).toBeGreaterThan(0));
  it('email accepts email field or url', () => {
    expect(v(broker({ optOut: { method: 'email', email: 'a@b.com' } }))).toEqual([]);
    expect(v(broker({ optOut: { method: 'email' } })).length).toBeGreaterThan(0);
  });
  it('blocked optOut status is accepted', () => expect(v(broker({ optOut: { method: 'none', status: 'blocked' } }))).toEqual([]));
  it('bad optOut status fails', () => expect(v(broker({ optOut: { method: 'none', status: 'meh' } })).length).toBeGreaterThan(0));
  it('size.known false must have empty signals', () =>
    expect(v(broker({ size: { known: false, signals: [{ kind: 'x', value: '1', source: 's1' }] } })).length).toBeGreaterThan(0));
  it('bad registry key fails', () => expect(v(broker({ registries: { ZZ: '2024' } })).length).toBeGreaterThan(0));
  it('broker.sources ids must exist in sources.json', () =>
    expect(v(broker({ sources: ['nope'] })).length).toBeGreaterThan(0));
  it('size signal source must exist', () =>
    expect(v(broker({ size: { known: true, signals: [{ kind: 'x', value: '1', source: 'nope' }] } })).length).toBeGreaterThan(0));
});

describe('optOut.email', () => {
  it('must look like an email address when present', () => {
    expect(validateBroker(broker({ optOut: { method: 'email', email: 'privacy@acme.example' } }))).toEqual([]);
    expect(validateBroker(broker({ optOut: { method: 'email', email: 'see notes' } })).some((e) => /optOut.email/.test(e))).toBe(true);
  });
});

describe('validateLink', () => {
  const v = (l) => validateLink(l, { brokerIds: new Set(['a', 'b']), sourceIds });
  it('valid link passes', () => expect(v(link())).toEqual([]));
  it('link to unknown broker fails', () => expect(v(link({ to: 'zzz' })).length).toBeGreaterThan(0));
  it('link with no sources fails', () => expect(v(link({ sources: [] })).length).toBeGreaterThan(0));
  it('link source must exist', () => expect(v(link({ sources: ['nope'] })).length).toBeGreaterThan(0));
  it('only tier A may be published', () => {
    expect(v(link({ tier: 'B', published: true })).length).toBeGreaterThan(0);
    expect(v(link({ tier: 'B', published: false }))).toEqual([]);
    expect(v(link({ tier: 'B', published: undefined }))).toEqual([]);
  });
  it('a self link fails', () => expect(validateLink(link({ to: 'a' }), { brokerIds: new Set(['a']), sourceIds }).some((e) => /itself/.test(e))).toBe(true));
  it('a published link must cite a tier-A kind source when kinds are known', () => {
    const ids = new Set(['s1', 'pp']);
    const kinds = new Map([['s1', 'sec-10k'], ['pp', 'privacy-policy']]);
    const vk = (l) => validateLink(l, { brokerIds: new Set(['a', 'b']), sourceIds: ids, sourceKinds: kinds });
    expect(vk(link({ sources: ['pp'] })).some((e) => /tier-A source/.test(e))).toBe(true);
    expect(vk(link({ sources: ['pp', 's1'] }))).toEqual([]);
    expect(vk(link({ sources: ['pp'], published: false }))).toEqual([]);
  });
  it('tier-A source kinds match the README tier A: regulator, court, SEC, annual report, procurement', () => {
    for (const k of ['sec-10k', 'sec-8k', 'sec-20f', 'annual-report', 'ftc-complaint', 'ftc-order', 'cfpb-order', 'court', 'procurement']) expect(TIER_A_SOURCE_KINDS).toContain(k);
    for (const k of ['privacy-policy', 'press-release', 'journalism', 'other', 'registry']) expect(TIER_A_SOURCE_KINDS).not.toContain(k);
  });
});

describe('validateSource', () => {
  it('valid source passes', () => expect(validateSource('s1', src)).toEqual([]));
  it('source needs archived copy', () => {
    expect(validateSource('s1', { ...src, archived: '' }).length).toBeGreaterThan(0);
    expect(validateSource('s1', { ...src, archived: 'https://example.com/x' }).length).toBeGreaterThan(0);
  });
  it('source needs url and dated access', () => {
    expect(validateSource('s1', { ...src, url: '' }).length).toBeGreaterThan(0);
    expect(validateSource('s1', { ...src, accessed: '10/18/2026' }).length).toBeGreaterThan(0);
  });
});

describe('validateDataset', () => {
  it('empty dataset is valid and ignores staging/', async () => {
    const r = await validateDataset(tmpDataset());
    expect(r.errors).toEqual([]);
    expect(r.counts).toEqual({ brokers: 0, links: 0, published: 0, sources: 1 });
  });
  it('duplicate broker id fails', async () => {
    const r = await validateDataset(tmpDataset({ brokers: [['acme.json', broker()], ['acme2.json', broker()]] }));
    expect(r.errors.some((e) => /duplicate/i.test(e))).toBe(true);
  });
  it('id must match filename', async () => {
    const r = await validateDataset(tmpDataset({ brokers: [['other.json', broker()]] }));
    expect(r.errors.some((e) => /filename/i.test(e))).toBe(true);
  });
  it('parent must exist', async () => {
    const r = await validateDataset(tmpDataset({ brokers: [['acme.json', broker({ parent: 'ghost' })]] }));
    expect(r.errors.some((e) => /parent/i.test(e))).toBe(true);
  });
  it('counts published links and checks links against brokers', async () => {
    const dir = tmpDataset({ brokers: [['acme.json', broker()], ['b.json', broker({ id: 'b' })]], links: [link({ from: 'acme', to: 'b' }), link({ from: 'acme', to: 'ghost', published: false })] });
    const r = await validateDataset(dir);
    expect(r.counts).toMatchObject({ brokers: 2, links: 2, published: 1 });
    expect(r.errors.length).toBe(1);
  });
  it('a published link citing only non-tier-A kinds fails', async () => {
    const pp = { ...src, kind: 'privacy-policy' };
    const r = await validateDataset(tmpDataset({ brokers: [['acme.json', broker()], ['b.json', broker({ id: 'b' })]], links: [link({ from: 'acme', to: 'b' })], sources: { s1: pp } }));
    expect(r.errors.some((e) => /tier-A source/.test(e))).toBe(true);
  });
  it('duplicate (from, to, type) links fail', async () => {
    const r = await validateDataset(tmpDataset({ brokers: [['acme.json', broker()], ['b.json', broker({ id: 'b' })]], links: [link({ from: 'acme', to: 'b' }), link({ from: 'acme', to: 'b', claim: 'other', published: false })] }));
    expect(r.errors.some((e) => /duplicate \(from, to, type\)/.test(e))).toBe(true);
  });
  it('the same pair with a different type is not a duplicate', async () => {
    const r = await validateDataset(tmpDataset({ brokers: [['acme.json', broker()], ['b.json', broker({ id: 'b' })]], links: [link({ from: 'acme', to: 'b' }), link({ from: 'acme', to: 'b', type: 'owns' })] }));
    expect(r.errors).toEqual([]);
  });
});
