import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from '../../research/data-brokers/build/csv.js';
import { validateBroker } from '../../research/data-brokers/build/schema.js';
import { CATEGORY_MAP, COLUMN_MAPS, REGISTRY_META, importRows, mergeCandidates, splitDba } from '../../research/data-brokers/build/import-registry.js';

const fx = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'registries');
const rows = (s) => parseCsv(readFileSync(join(fx, `${s}.csv`), 'utf8'));
const SRC = { CA: 'registry-ca-2026-10-18', TX: 'registry-tx-2026-10-18', OR: 'registry-or-2026-10-18', VT: 'registry-vt-2026-10-19' };
const run = (state, existing = new Map()) => importRows(state, rows(state.toLowerCase()), existing, SRC[state]);
const byName = (m, name) => [...m.values()].find((b) => b.name === name);

describe('COLUMN_MAPS', () => {
  it('names a real header for every obtained registry', () => {
    for (const s of ['CA', 'TX', 'OR', 'VT']) expect(COLUMN_MAPS[s].name).toBeTruthy();
    for (const s of ['ca', 'tx', 'or', 'vt']) {
      const all = rows(s).flat();
      expect(all).toContain(COLUMN_MAPS[s.toUpperCase()].name);
    }
  });
});

describe('importRows', () => {
  it('CA row becomes broker with registries.CA', () => {
    const m = run('CA');
    const b = m.get('acxiom');
    expect(b).toBeDefined();
    expect(b.name).toBe('Acxiom LLC');
    expect(b.registries).toEqual({ CA: '2026', VT: null, TX: null, OR: null });
    expect(b.optOut).toEqual({ method: 'web-form', url: 'https://isapps.acxiom.com/optout/optout.aspx', status: 'unchecked' });
    expect(b.sources).toEqual([SRC.CA]);
    expect(b.website).toBe('https://www.acxiom.com');
    const sourceIds = new Set([SRC.CA]);
    for (const r of m.values()) expect(validateBroker(r, { sourceIds })).toEqual([]);
  });

  it('dedupe merges case/suffix variants', () => {
    // "Acxiom LLC" (CA) and "ACXIOM CORPORATION" (TX) are one broker.
    const m = run('TX', run('CA'));
    const matches = [...m.values()].filter((b) => b.name === 'Acxiom LLC' || b.aliases.includes('ACXIOM CORPORATION'));
    expect(matches).toHaveLength(1);
    const b = matches[0];
    expect(b.registries.CA).toBe('2026');
    expect(b.registries.TX).toBe('2026');
    expect(b.aliases).toContain('ACXIOM CORPORATION');
    expect(b.sources).toEqual([SRC.CA, SRC.TX]);
    // The first opt-out route wins; a later registry never overwrites it.
    expect(b.optOut.url).toBe('https://isapps.acxiom.com/optout/optout.aspx');
  });

  it('a DBA alone never merges two legal names; the pair becomes a merge candidate', () => {
    // OR "Geo Parent Holdings Inc" dba "Example Location" vs CA "Example Location Co.": different legal names.
    const m = run('OR', run('CA'));
    expect(m.get('example-location').registries.OR).toBeNull();
    const parent = byName(m, 'Geo Parent Holdings Inc');
    expect(parent.aliases).toContain('Example Location');
    expect(mergeCandidates(m.values())).toContainEqual(expect.objectContaining({ a: 'example-location', b: parent.id, shared: expect.stringMatching(/^Example Location/) }));
  });

  it('Nielsen/eXelate shape gives two records', () => {
    const ca = [['Data broker name:', 'Doing Business As (DBA), if applicable:'], ['eXelate, Inc.', '']];
    const or = [['FACILITY NAME', 'DOING BUSINESS AS'], ['The Nielsen Company, LLC', 'eXelate']];
    const m = importRows('OR', or, importRows('CA', ca, new Map(), SRC.CA), SRC.OR);
    expect(m.size).toBe(2);
    expect(m.get('exelate').registries.OR).toBeNull();
    expect(mergeCandidates(m.values())).toEqual([expect.objectContaining({ a: 'exelate', b: 'the-nielsen', shared: 'eXelate' })]);
  });

  it('EverConnect shape (3 OR rows sharing a DBA) gives three records', () => {
    const or = [['FACILITY NAME', 'DOING BUSINESS AS'],
      ['KEYWORD CONNECTS LLC', 'EverConnect'], ['33 MILE RADIUS LLC', 'EverConnect'], ['REMODELING.COM LLC', 'EverConnect']];
    const m = importRows('OR', or, new Map(), SRC.OR);
    expect(m.size).toBe(3);
    expect(mergeCandidates(m.values())).toHaveLength(3);
  });

  it('same-registry rows with different legal names never merge', () => {
    const ca = [['Data broker name:', 'Doing Business As (DBA), if applicable:'],
      ['Foo Data LLC', 'Bar'], ['Bar Inc', ''], ['Baz Corp', 'Bar']];
    const m = importRows('CA', ca, new Map(), SRC.CA);
    expect([...m.keys()].sort()).toEqual(['bar', 'baz', 'foo-data']);
  });

  it('an alias claimed by two records is listed, not silently resolved', () => {
    const or = [['FACILITY NAME', 'DOING BUSINESS AS'], ['ECONTEXT AI LTD', 'Complementics'], ['Complementics Partners LLC', 'Complementics']];
    const m = importRows('OR', or, new Map(), SRC.OR);
    expect(m.size).toBe(2);
    expect(mergeCandidates(m.values()).map((c) => c.shared)).toEqual(['Complementics']);
  });

  it('splits d/b/a out of a legal name before matching', () => {
    expect(splitDba('Compact Information Systems LLC d/b/a Deep Sync')).toEqual(['Compact Information Systems LLC', 'Deep Sync']);
    expect(splitDba('HireTeamMate Inc. dba hireEZ')).toEqual(['HireTeamMate Inc.', 'hireEZ']);
    expect(splitDba('Exponential Interactive, Inc. doing business as VDX.tv')).toEqual(['Exponential Interactive, Inc.', 'VDX.tv']);
    expect(splitDba('Exact Opco, LLC (dba Exact Customer)')).toEqual(['Exact Opco, LLC', 'Exact Customer']);
    expect(splitDba('BIGDBM')).toEqual(['BIGDBM']);
    const ca = [['Data broker name:', 'Doing Business As (DBA), if applicable:'], ['Compact Information Systems, LLC', 'Deep Sync']];
    const tx = [['Full Legal Name'], ['Compact Information Systems LLC d/b/a Deep Sync']];
    const m = importRows('TX', tx, importRows('CA', ca, new Map(), SRC.CA), SRC.TX);
    expect([...m.keys()]).toEqual(['compact-information-systems']);
    const b = m.get('compact-information-systems');
    expect(b.registries.TX).toBe('2026');
    expect(b.aliases).toContain('Deep Sync');
    expect(b.aliases).not.toContain('Compact Information Systems LLC d/b/a Deep Sync');
  });

  it('&/and and spacing variants of a legal name merge', () => {
    const ca = [['Data broker name:', 'Doing Business As (DBA), if applicable:'], ['Dun & Bradstreet, Inc.', ''], ['BEEN VERIFIED LLC', '']];
    const tx = [['Full Legal Name'], ['DUN AND BRADSTREET INC'], ['BeenVerified, LLC']];
    const m = importRows('TX', tx, importRows('CA', ca, new Map(), SRC.CA), SRC.TX);
    expect(m.size).toBe(2);
    for (const b of m.values()) expect(b.registries).toMatchObject({ CA: '2026', TX: '2026' });
  });

  it('blank opt-out stays unknown', () => {
    expect(byName(run('CA'), 'Example Location Co.').optOut).toBeNull();
    expect(byName(run('TX'), 'Freetext Brokers LLC').optOut).toBeNull();
  });

  it('email opt-out sets method email', () => {
    expect(byName(run('CA'), 'Mailbox Data Inc.').optOut).toEqual({ method: 'email', email: 'optout@mailbox.test' });
    expect(byName(run('OR'), 'Email Only Data LLC').optOut).toEqual({ method: 'email', email: 'optout@emailonly.test' });
  });

  it('a contact email is not an opt-out route', () => {
    // CA/TX "primary contact email" columns are general contacts, not opt-out routes.
    expect(byName(run('CA'), 'Example Location Co.').optOut).toBeNull();
  });

  it('bare-domain opt-out website becomes an https URL', () => {
    expect(byName(run('OR'), 'Bare Domain Data Inc').optOut).toEqual({ method: 'web-form', url: 'https://BareDomain.test', status: 'unchecked' });
  });

  it('a field listing only URLs uses the first; prose is never mined', () => {
    const m = run('CA');
    expect(byName(m, 'Two Links LLC').optOut).toEqual({ method: 'web-form', url: 'https://twolinks.test/opt-out', status: 'unchecked' });
    expect(byName(m, 'Prose Optout LLC').optOut).toBeNull();
  });

  it('placeholder DBA answers are not aliases', () => {
    expect(byName(run('CA'), 'Placeholder Data Corp').aliases).toEqual([]);
  });

  it('unknown category gives empty kind', () => {
    expect(byName(run('TX'), 'Freetext Brokers LLC').kind).toEqual([]);
    expect(run('CA').get('acxiom').kind).toEqual([]);
  });

  it('CA geolocation and reproductive-health flags map to location and health', () => {
    expect(byName(run('CA'), 'Example Location Co.').kind).toEqual(['location', 'health']);
  });

  it('one row matching two records never fuses them', () => {
    // CA "Alpha Data LLC" and TX "Beta Data LLC"; an OR row with legal name Alpha and DBA "Beta Data".
    const ca = [['Data broker name:', 'Doing Business As (DBA), if applicable:'], ['Alpha Data LLC', '']];
    const tx = [['Full Legal Name'], ['Beta Data LLC']];
    const or = [['FACILITY NAME', 'DOING BUSINESS AS'], ['ALPHA DATA LLC', 'Beta Data']];
    const m = importRows('OR', or, importRows('TX', tx, importRows('CA', ca, new Map(), SRC.CA), SRC.TX), SRC.OR);
    expect([...m.keys()].sort()).toEqual(['alpha-data', 'beta-data']);
    expect(m.get('alpha-data').registries).toMatchObject({ CA: '2026', OR: '2026', TX: null });
    expect(m.get('beta-data').registries).toMatchObject({ TX: '2026', OR: null });
  });

  it('re-import is idempotent', () => {
    const once = run('OR', run('TX', run('CA')));
    const snapshot = structuredClone(Object.fromEntries(once));
    const twice = run('OR', run('TX', run('CA', once)));
    expect(Object.fromEntries(twice)).toEqual(snapshot);
  });

  it('does not mutate its input map, and rejects states without a column map', () => {
    const before = run('CA');
    const copy = structuredClone(Object.fromEntries(before));
    run('TX', before);
    expect(Object.fromEntries(before)).toEqual(copy);
    expect(() => importRows('ZZ', [['x']], new Map(), 'registry-zz')).toThrow();
  });
});

describe('Vermont (VT)', () => {
  it('has registry metadata and no category labels to map', () => {
    expect(REGISTRY_META.VT.url).toBe('https://bizfilings.vermont.gov/databrokersearch/Search');
    expect(CATEGORY_MAP.VT).toEqual({});
    // Every mapped header is a real column of the fixture (copied from the bulk file).
    const header = rows('vt')[0];
    for (const h of [COLUMN_MAPS.VT.name, COLUMN_MAPS.VT.website, COLUMN_MAPS.VT.optOutUrl, ...Object.keys(COLUMN_MAPS.VT.onlyWhere)]) expect(header).toContain(h);
  });

  it('VT row becomes broker with registries.VT', () => {
    const m = run('VT');
    const b = byName(m, 'Vermont Only Data, Inc.');
    expect(b).toBeDefined();
    expect(b.id).toBe('vermont-only-data');
    expect(b.registries).toEqual({ CA: null, VT: '2026', TX: null, OR: null });
    expect(b.optOut).toEqual({ method: 'web-form', url: 'https://vtonly.test/opt-out', status: 'unchecked' });
    expect(b.website).toBe('https://www.vtonly.test');
    expect(b.sources).toEqual([SRC.VT]);
    // One record per broker, though the bulk file repeats a broker once per applicant contact.
    expect([...m.values()].filter((r) => r.name === 'Vermont Only Data, Inc.')).toHaveLength(1);
    const sourceIds = new Set([SRC.VT]);
    for (const r of m.values()) expect(validateBroker(r, { sourceIds })).toEqual([]);
  });

  it('only rows with DataBrokerStatus "Registered" are imported', () => {
    const m = run('VT');
    expect(byName(m, 'Lapsed Data LLC')).toBeUndefined();
    // A broker with a lapsed and a current registration is in.
    expect(byName(m, 'Renewed Data LLC').registries.VT).toBe('2026');
    expect(m.size).toBe(5);
  });

  it('VT row merges with an existing CA or OR record by legal name', () => {
    const m = run('VT', run('OR', run('CA')));
    const acx = m.get('acxiom');
    expect(acx.registries).toMatchObject({ CA: '2026', VT: '2026' });
    expect(acx.sources).toEqual([SRC.CA, SRC.VT]);
    // CA's opt-out route stays; VT's prose answer never overwrites it.
    expect(acx.optOut.url).toBe('https://isapps.acxiom.com/optout/optout.aspx');
    const geo = byName(m, 'Geo Parent Holdings Inc');
    expect(geo.registries).toMatchObject({ OR: '2026', VT: '2026' });
    expect(geo.aliases).toContain('GEO PARENT HOLDINGS, INC.');
    expect([...m.values()].filter((b) => b.registries.VT)).toHaveLength(5);
  });

  it('blank or prose opt-out stays null', () => {
    const m = run('VT');
    expect(byName(m, 'Blank Optout VT LLC').optOut).toBeNull();
    expect(byName(m, 'GEO PARENT HOLDINGS, INC.').optOut).toBeNull();
    expect(byName(m, 'ACXIOM LLC').optOut).toBeNull();
  });

  it('VT kind stays empty', () => {
    for (const b of run('VT').values()) expect(b.kind).toEqual([]);
  });
});
