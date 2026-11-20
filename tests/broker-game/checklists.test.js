import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { BROKER_CHECKLISTS, checklistFor, FREEZE_RINGS, LEGACY_ALL_ANSWERS } from '../../src/data/broker-checklists.js';
import { MISSIONS } from '../../src/data/missions.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const ids = new Set(map.brokers.map((b) => b.id));
const RECON = /-recon-/;

describe('broker checklists', () => {
  it('every line broker exists in broker-map.json', () => {
    for (const lines of Object.values(BROKER_CHECKLISTS)) for (const l of lines) for (const b of l.brokers ?? []) expect(ids.has(b), b).toBe(true);
  });
  it('lines account for the dataset mapping exactly, mission by mission', () => {
    const want = {};
    for (const b of map.brokers) for (const m of b.missions) if (!RECON.test(m)) (want[m] ??= new Set()).add(b.id);
    for (const [m, set] of Object.entries(want)) {
      expect(checklistFor(m), m).not.toBe(null);
      expect(new Set(checklistFor(m).flatMap((l) => [...(l.brokers ?? []), ...(l.notLit ?? [])])), m).toEqual(set);
    }
  });
  it('a site-only line lights nothing', () => {
    const portals = checklistFor('people_search-fortify-privacy-portals');
    expect(portals.map((l) => l.id)).toEqual(['usphonebook', 'thatsthem', 'peoplefinder']);
    for (const l of portals) expect(l.brokers ?? []).toEqual([]);
    expect(checklistFor('people_search-fortify-extended-sweep-1').flatMap((l) => l.brokers ?? [])).toEqual([]);
  });
  it('a line never names a broker in both brokers and notLit', () => {
    for (const lines of Object.values(BROKER_CHECKLISTS)) for (const l of lines) for (const b of l.notLit ?? []) expect(l.brokers ?? []).not.toContain(b);
  });
  it('no lit broker anywhere has a none opt-out', () => {
    const byId = new Map(map.brokers.map((b) => [b.id, b]));
    for (const lines of Object.values(BROKER_CHECKLISTS)) for (const l of lines) for (const id of l.brokers ?? []) expect(byId.get(id).optOut?.method, id).not.toBe('none');
  });
  it('Radaris has no line', () => {
    for (const lines of Object.values(BROKER_CHECKLISTS)) expect(lines.some((l) => l.brokers?.includes('radaris'))).toBe(false);
  });
  it('a line is exactly one of: a broker line, a site-only line, a sweep', () => {
    for (const lines of Object.values(BROKER_CHECKLISTS)) for (const l of lines) {
      const kinds = [l.brokers?.length > 0, l.notLit?.length > 0, !!l.sweep].filter(Boolean);
      expect(kinds.length, l.id).toBe(1);
    }
  });
  it('line ids are unique within a mission', () => {
    for (const [m, lines] of Object.entries(BROKER_CHECKLISTS)) expect(new Set(lines.map((l) => l.id)).size, m).toBe(lines.length);
  });
  it('every checklist mission exists in MISSIONS and is not recon', () => {
    const all = new Set(MISSIONS.map((m) => m.id));
    for (const m of Object.keys(BROKER_CHECKLISTS)) { expect(all.has(m), m).toBe(true); expect(RECON.test(m)).toBe(false); }
  });
  it('DROP is its own line in both DROP missions', () => {
    expect(checklistFor('people_search-reclaim-stragglers').find((l) => l.id === 'drop').sweep).toBe('drop');
    expect(checklistFor('location_brokers-reclaim-legal').map((l) => l.id)).toEqual(['drop']);
  });
  it('freeze missions have no checklist', () => expect(checklistFor('credit_freeze-fortify-equifax')).toBe(null));
  it('every FREEZE_RINGS broker exists', () => {
    for (const r of FREEZE_RINGS) for (const b of r.brokers) expect(ids.has(b), b).toBe(true);
    expect(FREEZE_RINGS.map((r) => r.mission)).toEqual(['credit_freeze-fortify-equifax', 'credit_freeze-fortify-experian', 'credit_freeze-fortify-transunion', 'credit_freeze-fortify-extras']);
  });
  it('hints and legacy answers are exact', () => {
    const find = (id) => Object.values(BROKER_CHECKLISTS).flat().find((l) => l.id === id);
    expect(find('drop').hint).toBe('California residents only. It lights the map only if you tell the map you live in California.');
    expect(find('daa').hint).toBe('Sets an opt-out cookie in this browser on this device. It deletes nothing.');
    // The NAI runs no one-shot opt-out any more (2026-10-24), so its line says so and lights nothing.
    expect(find('nai').hint).toBe('The NAI no longer opts you out in one go: it sends you to each member, or adds a Global Privacy Control signal in Chrome. It lights nothing on the map.');
    expect(LEGACY_ALL_ANSWERS).toEqual({ optout_result: ['all-submitted'], defense_done: ['done', 'already-done'] });
  });
  it('the table is frozen', () => {
    expect(Object.isFrozen(BROKER_CHECKLISTS)).toBe(true);
    expect(Object.isFrozen(BROKER_CHECKLISTS['ad_trackers-fortify-bulk'])).toBe(true);
  });
});
