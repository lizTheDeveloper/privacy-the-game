import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { calcChapterProgress, calcDistrictProgress, districtParts, PART_MAX } from '../src/utils/calc.js';
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

describe('calcChapterProgress', () => {
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
