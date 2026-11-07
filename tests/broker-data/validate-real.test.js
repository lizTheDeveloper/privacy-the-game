// The real dataset, its research records and its curation config pass `npm run brokers:validate`,
// and the game's broker-map.json is exactly what a fresh export makes (no drift). Plus the
// tightened field rules (audit V2): each one rejects what it should.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {
  validateAll, validateSource, validateBroker, validateIdMap, validateAliasBlocklist,
  validateLinkOverrides, validateRecordOverrides, isRealDate, isHttpUrl, isWaybackSnapshot, SOURCE_KINDS,
} from '../../research/data-brokers/build/schema.js';
import { buildExport, serialize } from '../../research/data-brokers/build/export.js';

const ROOT = fileURLToPath(new URL('../../research/data-brokers/', import.meta.url));
const MAP = fileURLToPath(new URL('../../src/data/broker-map.json', import.meta.url));

describe('the real dataset', () => {
  it('validates: dataset, staging research records and the four config files, no errors', async () => {
    const { errors, counts } = await validateAll(ROOT);
    expect(errors).toEqual([]);
    expect(counts.brokers).toBeGreaterThan(900);
    expect(counts.sources).toBeGreaterThan(100);
    expect(counts.stagingSources).toBeGreaterThan(100);
    expect(counts.stagingLinks).toBeGreaterThan(100);
    expect(counts.configFiles).toBe(4);
  }, 30000); // reads ~1,300 JSON files: about 0.3s alone, a second or more in a loaded full run

  it('`npm run brokers:validate` runs the same checks and exits 0', () => {
    const out = execFileSync(process.execPath, [resolve(ROOT, 'build/validate.js')], { encoding: 'utf8' });
    expect(out).toMatch(/^brokers: \d+ links: \d+ published: \d+ sources: \d+$/m);
    expect(out).toMatch(/config files: 4$/m);
  }, 30000);

  it('src/data/broker-map.json is byte for byte a fresh export (no drift)', async () => {
    const fresh = serialize(await buildExport(ROOT));
    const committed = readFileSync(MAP, 'utf8');
    expect(committed.length).toBe(fresh.length);
    expect(committed === fresh).toBe(true);
  }, 30000);
});

const SRC = { url: 'https://example.com/a', archived: 'https://web.archive.org/web/20261018000000/https://example.com/a', kind: 'sec-10k', title: 'T', accessed: '2026-10-18' };
const bad = (over) => validateSource('s1', { ...SRC, ...over });

describe('tightened source rules (V2)', () => {
  it('the baseline source is valid', () => expect(bad({})).toEqual([]));

  it('url must be http(s) with a host', () => {
    for (const url of ['not a url', 'javascript:alert(1)', 'ftp://example.com/a', 'https://', 'example.com/a', 'TODO fill in']) expect(bad({ url }), url).not.toEqual([]);
    expect(bad({ url: 'http://example.com/a' })).toEqual([]);
  });

  it('archived must be a real Wayback snapshot of an http(s) page', () => {
    for (const archived of [
      'https://web.archive.org/', 'https://web.archive.org/web/2026/https://example.com/a',
      'https://web.archive.org/save/https://example.com/a', 'https://web.archive.org/web/20261018000000/<url>',
      'https://web.archive.org/web/20261018000000/example.com', 'https://archive.ph/abc', 'http://web.archive.org/web/20261018000000/https://example.com/a',
    ]) expect(bad({ archived }), archived).not.toEqual([]);
    expect(isWaybackSnapshot('https://web.archive.org/web/20261018000000id_/https://example.com/a?b=1')).toBe(true);
  });

  it('kind must be one of the README kinds', () => {
    expect(bad({ kind: 'made-up-kind' })).not.toEqual([]);
    expect(bad({ kind: 'member-list ' })).not.toEqual([]);
    for (const kind of SOURCE_KINDS) expect(bad({ kind }), kind).toEqual([]);
    expect(SOURCE_KINDS).toContain('member-list');
  });

  it('accessed must be a real day', () => {
    for (const accessed of ['2026-13-45', '2026-02-30', '2026-1-01', '10/18/2026']) expect(bad({ accessed }), accessed).not.toEqual([]);
    expect(isRealDate('2028-02-29')).toBe(true);
    expect(isRealDate('2026-02-29')).toBe(false);
  });
});

const BROKER = {
  id: 'acme', name: 'Acme', aliases: [], parent: null, kind: [], registries: {}, sells: [],
  optOut: { method: 'web-form', url: 'https://acme.example/opt-out' }, size: { known: false, signals: [] }, sources: [],
};
const vb = (over) => validateBroker({ ...BROKER, ...over });

describe('tightened broker rules (V2)', () => {
  it('the baseline broker is valid', () => expect(vb({})).toEqual([]));

  it('opt-out urls are http(s), or mailto: for the email method', () => {
    expect(vb({ optOut: { method: 'web-form', url: 'TODO fill in', status: 'verified' } })).not.toEqual([]);
    expect(vb({ optOut: { method: 'email', url: 'javascript:alert(1)' } })).not.toEqual([]);
    expect(vb({ optOut: { method: 'portal', url: 'mailto:privacy@acme.example' } })).not.toEqual([]);
    expect(vb({ optOut: { method: 'email', url: 'mailto:privacy@acme.example' } })).toEqual([]);
    expect(vb({ optOut: { method: 'email', email: 'privacy@acme.example' } })).toEqual([]);
    expect(vb({ optOut: { method: 'web-form', url: 'https://acme.example/x', verifiedAt: '2026-02-30' } })).not.toEqual([]);
  });

  it('registry years are 4-digit years', () => {
    expect(vb({ registries: { CA: 'banana' } })).not.toEqual([]);
    expect(vb({ registries: { CA: '26' } })).not.toEqual([]);
    expect(vb({ registries: { CA: '2026', VT: null } })).toEqual([]);
    expect(isHttpUrl('https://acme.example/')).toBe(true);
  });
});

describe('the curation config contributors edit (V1)', () => {
  const ctx = {
    brokerIds: new Set(['acme', 'beta']),
    sources: { s1: SRC },
    links: [{ from: 'acme', to: 'beta', type: 'owns' }],
    families: new Set(['sec', 'membership']),
  };

  it('id-map: family-scoped, entries a record id or { id, reason }, targets exist', () => {
    expect(validateIdMap({ sec: { 'acme-inc': 'acme' }, membership: { x: { id: 'beta', reason: 'r' } } }, ctx)).toEqual([]);
    expect(validateIdMap({ 'acme-inc': 'acme' }, ctx)).not.toEqual([]); // not family-scoped
    expect(validateIdMap({ sec: { x: 'nobody' } }, ctx)).not.toEqual([]);
    expect(validateIdMap({ sec: { x: { id: 'acme' } } }, ctx)).not.toEqual([]);
    expect(validateIdMap({ madeup: { x: 'acme' } }, ctx)).not.toEqual([]);
  });

  it('alias-blocklist: { record: [{ alias, reason }] }', () => {
    expect(validateAliasBlocklist({ acme: [{ alias: 'A', reason: 'r' }] }, ctx)).toEqual([]);
    expect(validateAliasBlocklist({ acme: ['A'] }, ctx)).not.toEqual([]);
    expect(validateAliasBlocklist({ nobody: [{ alias: 'A', reason: 'r' }] }, ctx)).not.toEqual([]);
  });

  it('link-overrides: known sections and fields; unpublish and reclaim name a real link', () => {
    expect(validateLinkOverrides({ unpublish: [{ from: 'acme', to: 'beta', type: 'owns', reason: 'r' }], drop: [{ from: 'x', to: 'y', type: 'buys', family: 'sec', reason: 'r' }] }, ctx)).toEqual([]);
    expect(validateLinkOverrides({ unpublish: [{ from: 'acme', to: 'beta', type: 'buys', reason: 'r' }] }, ctx)).not.toEqual([]);
    expect(validateLinkOverrides({ drop: [{ from: 'x', to: 'y', type: 'buys' }] }, ctx)).not.toEqual([]);
    expect(validateLinkOverrides({ delete: [] }, ctx)).not.toEqual([]);
    expect(validateLinkOverrides({ reassign: [{ from: 'acme', to: 'beta', type: 'owns', newFrom: 'nobody', reason: 'r' }] }, ctx)).not.toEqual([]);
    expect(validateLinkOverrides({ reclaim: [{ from: 'acme', to: 'beta', type: 'owns', claim: 'c', reason: 'r', extra: 1 }] }, ctx)).not.toEqual([]);
  });

  it('record-overrides: known fields, a reason, real records and sources', () => {
    expect(validateRecordOverrides({ acme: { parent: 'beta', source: 's1', reason: 'r' } }, ctx)).toEqual([]);
    expect(validateRecordOverrides({ acme: { parent: 'beta' } }, ctx)).not.toEqual([]);
    expect(validateRecordOverrides({ nobody: { name: 'N', reason: 'r' } }, ctx)).not.toEqual([]);
    expect(validateRecordOverrides({ acme: { source: 'nope', reason: 'r' } }, ctx)).not.toEqual([]);
    expect(validateRecordOverrides({ acme: { kind: ['made-up'], reason: 'r' } }, ctx)).not.toEqual([]);
    expect(validateRecordOverrides({ acme: { optOut: { url: 'https://x.example' }, reason: 'r' } }, ctx)).not.toEqual([]);
    expect(validateRecordOverrides({ acme: { website: 'x', reason: 'r' } }, ctx)).not.toEqual([]);
    expect(validateRecordOverrides({ acme: { replaces: { name: 'Old' }, reason: 'r' } }, ctx)).not.toEqual([]);
  });
});
