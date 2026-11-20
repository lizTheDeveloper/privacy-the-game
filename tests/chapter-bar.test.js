import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { calcChapterProgress, calcDistrictProgress, districtParts, foldLoneParts, PART_MAX } from '../src/utils/calc.js';
import { DISTRICTS } from '../src/data/districts.js';
import { renderNext } from '../src/screens/next.js';
import { _resetFillBars } from '../src/components/fill-bar.js';

// Liz 2026-11-18: "yes, make the district bar count the current chapter only". The What's next
// bar counted all of The Master Keys, so after one mission it was a sliver.
const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); _resetFillBars(); });

const simple = () => setReadLevel(createInitialState(), 'simplest');
const done = (s, ids) => ids.reduce((acc, id) => updateMission(acc, id, { status: 'completed', finding: 'no-breaches' }), s);
const MK = 'master-keys';
const ids = (part) => part.missions.map((m) => m.id);

describe('districtParts', () => {
  it('cuts The Master Keys into parts of a few missions each, check first, then lock', () => {
    const parts = districtParts(simple(), MK);
    expect(parts.length).toBeGreaterThan(2);
    for (const p of parts) {
      expect(p.missions.length).toBeGreaterThanOrEqual(3);
      expect(p.missions.length).toBeLessThanOrEqual(PART_MAX);
    }
    expect(parts.map((p) => p.chapter)).toEqual(parts.map((_, i) => i + 1));
    // Recon (checking) parts come before fortify (locking) parts.
    const phases = parts.map((p) => p.phase);
    expect(phases.lastIndexOf('recon')).toBeLessThan(phases.indexOf('fortify'));
    expect(parts[0].name).toBe('Check your accounts');
    expect(parts.at(-1).name).toBe('Lock them up');
  });

  it('holds the same missions the district’s own progress counts', () => {
    const s = simple();
    const all = districtParts(s, MK).flatMap(ids);
    expect(all.length).toBe(calcDistrictProgress(s, MK).total);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toContain('gmail-recon-breach');
    expect(all).not.toContain('gmail-recon-login'); // a bonus
  });

  it('leaves out accounts marked “I don’t have”, and the parts get smaller', () => {
    const before = districtParts(simple(), MK).flatMap(ids);
    const s = ['outlook', 'yahoo', 'protonmail', 'microsoft'].reduce((acc, a) => toggleAccount(acc, a, false), simple());
    const after = districtParts(s, MK).flatMap(ids);
    expect(after.length).toBe(before.length - 12);
    expect(after.some((id) => id.startsWith('outlook-'))).toBe(false);
    expect(after.length).toBe(calcDistrictProgress(s, MK).total);
  });
});

// Liz 2026-11-19: "a part with only one mission should fold". One tap filling a whole bar feels
// hollow, and it makes "OF N" bigger for nothing.
const fake = (phase, n, from = 0) => ({
  phase,
  name: { recon: 'Check your accounts', fortify: 'Lock them up', reclaim: 'Take your data back' }[phase],
  missions: Array.from({ length: n }, (_, i) => ({ id: `${phase}-${from + i}`, phase })),
});
const sizes = (parts) => parts.map((p) => p.missions.length);
const flat = (parts) => parts.flatMap(ids);
// A part holding a mission of another phase took in a folded one.
const foldedMission = (part) => part.missions.find((m) => m.phase !== part.phase);

describe('a part with one mission folds', () => {
  it('a phase with one mission folds into the part before it, missions in order', () => {
    const parts = [fake('recon', 5), fake('fortify', 5), fake('reclaim', 1)];
    const out = foldLoneParts(parts);
    expect(sizes(out)).toEqual([5, 6]);
    expect(flat(out)).toEqual(flat(parts));
    expect(out[1]).toMatchObject({ phase: 'fortify', name: 'Lock them up' });
  });

  it('a one-mission first part folds forward, into the part after it', () => {
    const parts = [fake('recon', 1), fake('fortify', 6), fake('fortify', 5, 6), fake('reclaim', 3)];
    const out = foldLoneParts(parts);
    expect(sizes(out)).toEqual([7, 5, 3]);
    expect(flat(out)).toEqual(flat(parts));
    expect(out[0].missions[0].id).toBe('recon-0');
    expect(out[0]).toMatchObject({ phase: 'fortify', name: 'Lock them up' });
  });

  it('two one-mission parts in a row make one part of two, named for the first', () => {
    const out = foldLoneParts([fake('recon', 1), fake('fortify', 1), fake('reclaim', 4)]);
    expect(sizes(out)).toEqual([2, 4]);
    expect(out[0].name).toBe('Check your accounts');
  });

  it('a one-mission district stays one part', () => {
    const out = foldLoneParts([fake('fortify', 1)]);
    expect(sizes(out)).toEqual([1]);
    expect(out[0].name).toBe('Lock them up');
  });

  it('parts of two or more are left as they are', () => {
    const parts = [fake('recon', 2), fake('fortify', 8), fake('fortify', 7, 8), fake('reclaim', 3)];
    expect(foldLoneParts(parts)).toEqual(parts);
    // The Master Keys has no lone part: every part is one kind of mission.
    for (const p of districtParts(simple(), MK)) expect(foldedMission(p)).toBeUndefined();
  });

  it('no real district has a one-mission part, and every mission is in exactly one part', () => {
    let folded = 0;
    for (const d of DISTRICTS) {
      const s = simple();
      const parts = districtParts(s, d.id);
      expect(parts.map((p) => p.chapter)).toEqual(parts.map((_, i) => i + 1));
      if (parts.length > 1) for (const p of parts) expect(p.missions.length).toBeGreaterThan(1);
      const all = flat(parts);
      expect(all.length).toBe(calcDistrictProgress(s, d.id).total);
      expect(new Set(all).size).toBe(all.length);
      folded += parts.filter(foldedMission).length;
    }
    expect(folded).toBeGreaterThan(0); // the data has folds (The Vault, The Capitol, The Perimeter)
  });

  it('The Capitol’s one take-back mission folds into its locks', () => {
    // 5 checks, 5 locks, 1 take-back: two parts, not three.
    const parts = districtParts(simple(), 'capitol');
    expect(parts.length).toBe(2);
    expect(parts.at(-1).missions.at(-1).phase).toBe('reclaim');
    expect(parts.at(-1).name).toBe('Lock them up');
  });
});

describe('calcChapterProgress', () => {
  it('pinned to a folded mission: the merged part, renumbered', () => {
    const s0 = simple();
    const parts = districtParts(s0, 'capitol');
    const last = parts.at(-1);
    const lone = foldedMission(last);
    expect(lone).toBeDefined();
    const s = done(s0, [lone.id]);
    const p = calcChapterProgress(s, 'capitol', { missionId: lone.id });
    expect(p).toMatchObject({ chapter: parts.length, of: parts.length, name: 'Lock them up', completed: 1, total: last.missions.length, done: false });
    expect(p.label).toBe(`PART ${parts.length} OF ${parts.length} · THE CAPITOL`);
  });

  it('pinned to a mission folded forward into part 1', () => {
    const parts = districtParts(simple(), 'perimeter');
    const lone = foldedMission(parts[0]);
    expect(lone?.phase).toBe('recon');
    expect(parts[0].missions[0]).toBe(lone); // still first, as the game hands it out
    const p = calcChapterProgress(done(simple(), [lone.id]), 'perimeter', { missionId: lone.id });
    expect(p).toMatchObject({ chapter: 1, of: parts.length, completed: 1, total: parts[0].missions.length, name: parts[0].name });
  });

  it('a new player is on part 1, with nothing done', () => {
    const p = calcChapterProgress(simple(), MK);
    expect(p).toMatchObject({ chapter: 1, completed: 0, done: false, next: null, name: 'Check your accounts' });
    expect(p.total).toBe(districtParts(simple(), MK)[0].missions.length);
    expect(p.label).toBe(`PART 1 OF ${p.of} · THE MASTER KEYS`);
  });

  it('one mission moves the bar a lot (it counts the part, not the district)', () => {
    const s = done(simple(), ['gmail-recon-breach']);
    const p = calcChapterProgress(s, MK);
    expect(p.completed).toBe(1);
    expect(p.completed / p.total).toBeGreaterThan(1 / PART_MAX - 0.001);
    expect(p.completed / p.total).toBeGreaterThan(calcDistrictProgress(s, MK).completed / calcDistrictProgress(s, MK).total * 3);
  });

  it('the report that finishes a part shows that part full, and says what’s next', () => {
    const first = ids(districtParts(simple(), MK)[0]);
    const s = done(simple(), first);
    const p = calcChapterProgress(s, MK, { missionId: first.at(-1) });
    expect(p).toMatchObject({ chapter: 1, completed: first.length, total: first.length, done: true });
    expect(p.next).toEqual({ chapter: 2, name: districtParts(s, MK)[1].name });
  });

  it('rolls over to the next part once the player moves on', () => {
    const first = ids(districtParts(simple(), MK)[0]);
    const s = done(simple(), first);
    const p = calcChapterProgress(s, MK);
    expect(p).toMatchObject({ chapter: 2, completed: 0, done: false });
    expect(p.label).toMatch(/^PART 2 OF \d+ · THE MASTER KEYS$/);
  });

  it('the current part is the earliest with missions left', () => {
    const parts = districtParts(simple(), MK);
    // Part 2 finished, part 1 one short: part 1 is current.
    const s = done(simple(), [...ids(parts[1]), ...ids(parts[0]).slice(1)]);
    expect(calcChapterProgress(s, MK)).toMatchObject({ chapter: 1, completed: parts[0].missions.length - 1 });
  });

  it('a whole district done: the last part, full, nothing next', () => {
    const s = done(simple(), districtParts(simple(), MK).flatMap(ids));
    const p = calcChapterProgress(s, MK);
    expect(p.chapter).toBe(p.of);
    expect(p.done).toBe(true);
    expect(p.next).toBe(null);
  });

  it('is null for a district with nothing in play', () => {
    expect(calcChapterProgress(simple(), 'freeway')).toBe(null);
  });
});

describe('What’s next shows the part', () => {
  it('a folded mission shows the merged part’s bar, with its renumbered key', () => {
    const parts = districtParts(simple(), 'capitol');
    const lone = foldedMission(parts.at(-1));
    const s = done(simple(), [lone.id]);
    const h = renderNext(s, { filed: { id: lone.id, reaction: { line: 'Done.', feeling: 'proud' } } });
    expect(h).toContain(`data-fill-bar="chapter:capitol:${parts.length}"`);
    expect(h).toContain(`<div class="fill-title">PART ${parts.length} OF ${parts.length} · THE CAPITOL</div>`);
    expect(h).toContain('<div class="fill-name">Lock them up</div>');
  });

  it('the bar is the part’s, with its own key, name and label', () => {
    const s = done(simple(), ['gmail-recon-breach']);
    const h = renderNext(s, { filed: { id: 'gmail-recon-breach', reaction: { line: 'Clean.', feeling: 'happy' } } });
    expect(h).toContain('data-fill-bar="chapter:master-keys:1"');
    expect(h).toMatch(/<div class="fill-title">PART 1 OF \d+ · THE MASTER KEYS<\/div>/);
    expect(h).toContain('<div class="fill-name">Check your accounts</div>');
    expect(h).toContain('Security is a process. Every mission fills this a little more.');
    expect(h).not.toContain('YOUR PROGRESS IN');
  });

  it('finishing a part: full green bar and “Part 1 done! Next: …”', () => {
    const first = ids(districtParts(simple(), MK)[0]);
    const s = done(simple(), first);
    const h = renderNext(s, { filed: { id: first.at(-1), reaction: { line: 'Done.', feeling: 'proud' } } });
    expect(h).toContain('data-chapter-done');
    expect(h).toMatch(/class="fill-bar fill-bar--big is-full[^"]*"[^>]*data-fill-bar="chapter:master-keys:1"/);
    expect(h).toContain('Part 1 done! Next: part 2, check your accounts.');
    // Coming back later, the bar has moved on to part 2, filling from empty.
    const later = renderNext(s);
    expect(later).toContain('data-fill-bar="chapter:master-keys:2"');
    expect(later).toContain('style="--from: 0%; --to: 0%;');
  });
});
