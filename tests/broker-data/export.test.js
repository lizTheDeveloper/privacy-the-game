import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildExport, serialize } from '../../research/data-brokers/build/export.js';

async function fixture({ links, noMissions = [], edit = {}, sources, recordOverrides } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'brokers-'));
  await mkdir(join(dir, 'brokers'));
  const mk = (id) => ({ id, name: id.toUpperCase(), aliases: [], parent: null, kind: ['marketing'], registries: {}, sells: [], optOut: { method: 'none' }, missions: [] });
  for (const id of ['b', 'a', 'c']) {
    const b = mk(id);
    if (noMissions.includes(id)) delete b.missions;
    if (edit[id]) edit[id](b);
    await writeFile(join(dir, 'brokers', `${id}.json`), JSON.stringify(b));
  }
  await writeFile(join(dir, 'sources.json'), JSON.stringify(sources ?? {
    s1: { url: 'https://x.test/1', archived: 'https://web.archive.org/1', kind: 'filing', title: 't', accessed: '2026-10-18' },
  }));
  if (recordOverrides) {
    await mkdir(join(dir, 'build'));
    await writeFile(join(dir, 'build', 'record-overrides.json'), JSON.stringify(recordOverrides));
  }
  await writeFile(join(dir, 'links.json'), JSON.stringify(links ?? [
    { from: 'b', to: 'c', type: 'supplies', tier: 'A', claim: 'pub', sources: ['s1'], published: true },
    { from: 'a', to: 'b', type: 'owns', tier: 'B', claim: 'unpub', sources: ['s1'], published: false },
  ]));
  await writeFile(join(dir, 'DATASET.json'), JSON.stringify({ asOf: '2026-01-02' }));
  return dir;
}

describe('buildExport', () => {
  it('export drops unpublished links', async () => {
    const out = await buildExport(await fixture());
    expect(out.asOf).toBe('2026-01-02');
    expect(out.links).toHaveLength(1);
    expect(out.links[0]).toEqual({ from: 'b', to: 'c', type: 'supplies', tier: 'A', claim: 'pub', sources: [{ url: 'https://x.test/1', archived: 'https://web.archive.org/1' }] });
    expect(out.brokers.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(out.brokers.find((x) => x.id === 'b').reach).toBe(2);
    expect(out.brokers.find((x) => x.id === 'b').hub).toBe(true);
    expect(out.brokers[0]).not.toHaveProperty('size');
  });
  it('has formatVersion 1 first, then asOf, brokers, links', async () => {
    const out = await buildExport(await fixture());
    expect(Object.keys(out)).toEqual(['formatVersion', 'asOf', 'brokers', 'links']);
    expect(out.formatVersion).toBe(1);
  });
  it('includes sells, [] when absent, and never size', async () => {
    const out = await buildExport(await fixture({ edit: { a: (b) => { b.sells = ['lists']; b.size = { known: true, signals: [] }; }, b: (b) => { delete b.sells; } } }));
    expect(out.brokers.find((x) => x.id === 'a').sells).toEqual(['lists']);
    expect(out.brokers.find((x) => x.id === 'b').sells).toEqual([]);
    for (const b of out.brokers) expect(b).not.toHaveProperty('size');
  });
  it('optOut.status defaults to unchecked; a null optOut stays null; a set status is kept', async () => {
    const out = await buildExport(await fixture({ edit: {
      a: (b) => { b.optOut = { method: 'web-form', url: 'https://a.test/o' }; },
      b: (b) => { b.optOut = null; },
      c: (b) => { b.optOut = { method: 'web-form', url: 'https://c.test/o', status: 'blocked', verifiedAt: '2026-10-18' }; },
    } }));
    expect(out.brokers.find((x) => x.id === 'a').optOut).toEqual({ method: 'web-form', url: 'https://a.test/o', status: 'unchecked' });
    expect(out.brokers.find((x) => x.id === 'b').optOut).toBeNull();
    expect(out.brokers.find((x) => x.id === 'c').optOut.status).toBe('blocked');
  });
  describe('parent', () => {
    const S = {
      s1: { url: 'https://x.test/1', archived: 'https://web.archive.org/1', kind: 'sec-10k', title: 't', accessed: '2026-10-18' },
      ftc: { url: 'https://x.test/2', archived: 'https://web.archive.org/2', kind: 'ftc-complaint', title: 't', accessed: '2026-10-18' },
      pp: { url: 'https://x.test/3', archived: 'https://web.archive.org/3', kind: 'privacy-policy', title: 't', accessed: '2026-10-18' },
    };
    const childOf = (p, sources = []) => (b) => { b.parent = p; b.sources = sources; };
    it('is kept when a published owns link runs from the parent to the record', async () => {
      const out = await buildExport(await fixture({ sources: S, edit: { b: childOf('a') }, links: [{ from: 'a', to: 'b', type: 'owns', tier: 'A', claim: 'x', sources: ['s1'], published: true }] }));
      expect(out.brokers.find((x) => x.id === 'b').parent).toBe('a');
    });
    it('is null when the owns link is unpublished (tier B)', async () => {
      const out = await buildExport(await fixture({ sources: S, edit: { b: childOf('a', ['pp']) }, links: [{ from: 'a', to: 'b', type: 'owns', tier: 'B', claim: 'x', sources: ['pp'], published: false }] }));
      expect(out.brokers.find((x) => x.id === 'b').parent).toBeNull();
    });
    it('is null when there is no link and no override', async () => {
      const out = await buildExport(await fixture({ sources: S, edit: { b: childOf('a', ['ftc']) }, links: [] }));
      expect(out.brokers.find((x) => x.id === 'b').parent).toBeNull();
    });
    it('is kept when a record-override sets it and cites a tier-A source on the record', async () => {
      const out = await buildExport(await fixture({ sources: S, edit: { b: childOf('a', ['ftc']) }, links: [], recordOverrides: { b: { parent: 'a', source: 'ftc', reason: 'r' } } }));
      expect(out.brokers.find((x) => x.id === 'b').parent).toBe('a');
    });
    it('is null when the override cites a non-tier-A source, a source not on the record, or a different parent', async () => {
      const run = async (edit, ov) => (await buildExport(await fixture({ sources: S, edit: { b: edit }, links: [], recordOverrides: { b: ov } }))).brokers.find((x) => x.id === 'b').parent;
      expect(await run(childOf('a', ['pp']), { parent: 'a', source: 'pp', reason: 'r' })).toBeNull();
      expect(await run(childOf('a', []), { parent: 'a', source: 'ftc', reason: 'r' })).toBeNull();
      expect(await run(childOf('a', ['ftc']), { parent: 'c', source: 'ftc', reason: 'r' })).toBeNull();
    });
  });
  it('export is byte-identical across two runs', async () => {
    const dir = await fixture();
    expect(serialize(await buildExport(dir))).toBe(serialize(await buildExport(dir)));
  });
  it('emits missions as [] when a record has none', async () => {
    const out = await buildExport(await fixture({ noMissions: ['a'] }));
    expect(out.brokers.find((x) => x.id === 'a').missions).toEqual([]);
  });
  it('a broker that reaches nothing (reach 1) is never a hub, even in the top 12', async () => {
    const out = await buildExport(await fixture());
    expect(out.brokers.filter((x) => x.hub).map((x) => x.id)).toEqual(['b']);
    expect(out.brokers.find((x) => x.id === 'a').reach).toBe(1);
    expect(out.brokers.find((x) => x.id === 'c').hub).toBe(false);
  });
  it('throws on a published link citing an unknown source', async () => {
    const dir = await fixture({ links: [{ from: 'b', to: 'c', type: 'supplies', tier: 'A', claim: 'x', sources: ['nope'], published: true }] });
    await expect(buildExport(dir)).rejects.toThrow(/unknown source "nope"/);
  });
  it('export gives each broker its non-registry sources, sorted by url', async () => {
    const sources = {
      reg: { url: 'https://reg.test/', archived: 'https://web.archive.org/reg', kind: 'registry', title: 't', accessed: '2026-10-18' },
      z: { url: 'https://z.test/', archived: 'https://web.archive.org/z', kind: 'filing', title: 't', accessed: '2026-10-18' },
      m: { url: 'https://m.test/', archived: 'https://web.archive.org/m', kind: 'enforcement', title: 't', accessed: '2026-10-18' },
    };
    const out = await buildExport(await fixture({ sources, links: [], edit: { a: (b) => { b.sources = ['reg', 'z', { id: 'm' }]; }, b: (b) => { b.sources = ['reg']; } } }));
    expect(out.brokers.find((x) => x.id === 'a').sources).toEqual([
      { url: 'https://m.test/', archived: 'https://web.archive.org/m', kind: 'enforcement' },
      { url: 'https://z.test/', archived: 'https://web.archive.org/z', kind: 'filing' },
    ]);
    expect(out.brokers.find((x) => x.id === 'b').sources).toEqual([]);
    expect(out.brokers.find((x) => x.id === 'c').sources).toEqual([]);
    expect(out.formatVersion).toBe(1);
  });
});
