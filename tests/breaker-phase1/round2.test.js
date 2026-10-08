// Breaker round 2 for recon campaign Phase 1: the load-time migration, stored
// answers, the restore guard, the streak and the reopened debrief.
// A failing test names the behaviour it believes is wrong. Passing tests pin edges.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';
import { ACCOUNTS } from '../../src/data/accounts.js';
import { fileDebrief, debriefRecord, missionEventData, visibleQuestions, questionOptions } from '../../src/utils/debrief.js';
import { renderDebrief } from '../../src/screens/debrief.js';
import { restoreEvents } from '../../src/utils/restore.js';
import { createInitialState, loadState, saveState, streakAfterFiling } from '../../src/state.js';
import { migrateBrokenAnswers } from '../../src/utils/migrate-answers.js';

const byId = (id) => MISSIONS.find((m) => m.id === id);
const BROKEN_SKIP = "skip', text: 'I'll come back to this', severity: 'skip";
const BROKEN_DONE = "done', text: 'Yes, it's done', severity: 'safe";

function memStorage(initial) {
  const store = initial ? { 'reclaim-city-state': initial } : {};
  return { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
}

function stateWith(records) {
  const s = createInitialState();
  for (const id of Object.keys(ACCOUNTS)) s.accounts[id] = { enabled: true };
  Object.assign(s.missions, records);
  return s;
}

beforeEach(() => { globalThis.localStorage = memStorage(); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

// ── Migration: every load path ─────────────────────────────────────
describe('migration on load', () => {
  const save = (extra) => JSON.stringify({ ...createInitialState(), ...extra });

  it('a save with no missions key loads and is returned untouched', () => {
    const raw = JSON.parse(save({}));
    delete raw.missions;
    const s = loadState(memStorage(JSON.stringify(raw)));
    expect(s.missions).toBeUndefined();
    expect(s.accounts.gmail).toBeTruthy();
  });

  it('missions: null does not wipe the save', () => {
    const s = loadState(memStorage(save({ missions: null, streak: { current: 4, best: 4, lastDate: '2026-10-01' } })));
    expect(s.streak.current).toBe(4);
  });

  it('a corrupted mission record (null, number, string) is skipped, the others still repaired', () => {
    const s = loadState(memStorage(save({ missions: {
      a: null, b: 7, c: 'oops',
      'scam_defense-recon-phishing-eye': { status: 'completed', finding: BROKEN_SKIP },
    } })));
    expect(s.missions['scam_defense-recon-phishing-eye'].finding).toBe('skip');
    expect(s.missions.a).toBeNull();
    expect(s.missions.b).toBe(7);
  });

  it('unparseable JSON gives a fresh state, not a throw', () => {
    expect(() => loadState(memStorage('{not json'))).not.toThrow();
  });

  it('is idempotent: a second pass is a no-op and returns the same object', () => {
    const once = migrateBrokenAnswers(stateWith({ 'scam_defense-recon-phishing-eye': { status: 'completed', finding: BROKEN_SKIP, completedAt: 'x' } }));
    const twice = migrateBrokenAnswers(once);
    expect(twice).toBe(once);
    expect(once.answersRepaired).toBe(1);
  });

  it('a clean save is not changed in any record, only flagged', () => {
    const s = stateWith({
      'gmail-recon-breach': { status: 'completed', finding: '1-2-breaches', password_exposed: 'no', completedAt: 'x' },
      'sim_protection-fortify-pin': { status: 'skipped', action: 'later' },
    });
    const out = migrateBrokenAnswers(s);
    expect(out.missions).toEqual(s.missions);
  });

  it('a repaired non-skip broken answer stays completed and keeps completedAt', () => {
    const id = 'scam_defense-recon-phishing-eye';
    const out = migrateBrokenAnswers(stateWith({ [id]: { status: 'completed', finding: BROKEN_DONE, completedAt: '2026-09-01' } }));
    expect(out.missions[id]).toEqual({ status: 'completed', finding: 'done', completedAt: '2026-09-01' });
  });

  it('only completed records are demoted: a not-needed or skipped record keeps its status', () => {
    const out = migrateBrokenAnswers(stateWith({
      a: { status: 'not-needed', action: BROKEN_SKIP },
      b: { status: 'skipped', action: BROKEN_SKIP },
    }));
    expect(out.missions.a.status).toBe('not-needed');
    expect(out.missions.b.status).toBe('skipped');
  });

  it('no real option value contains an apostrophe, so a legitimate answer cannot be truncated', () => {
    for (const m of MISSIONS) for (const q of m.debriefQs || []) for (const o of q.options || []) {
      if (typeof o.value === 'string') expect(o.value, `${m.id}/${q.id}`).not.toContain("'");
    }
  });

  it('migration never lowers the completed count except for skip answers', () => {
    const records = {};
    for (const m of MISSIONS.slice(0, 80)) records[m.id] = { status: 'completed', finding: BROKEN_DONE, completedAt: 'x' };
    const out = migrateBrokenAnswers(stateWith(records));
    expect(Object.values(out.missions).filter((r) => r.status === 'completed').length).toBe(80);
  });
});

// ── Restore guard ───────────────────────────────────────────────────
describe('restoreEvents value guard', () => {
  it('every real option value of finding/password_exposed/method passes the guard', () => {
    const lost = [];
    for (const m of MISSIONS) for (const q of m.debriefQs || []) {
      if (!['finding', 'password_exposed', 'method'].includes(q.id)) continue;
      for (const o of q.options || []) {
        if (typeof o.value !== 'string') continue;
        const ev = restoreEvents({ missions: { [m.id]: { status: 'completed', [q.id]: o.value } }, accounts: {} })
          .find((e) => e.name === 'mission-completed');
        const sent = ev.data[q.id];
        if (q.id === 'method') continue; // method goes through twoFactorMethod
        if (sent !== o.value) lost.push(`${m.id}:${q.id}=${o.value}`);
      }
    }
    expect(lost).toEqual([]);
  });

  it('a stored answer record with every question id resends only whitelisted keys', () => {
    const allowed = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method', 'same_address', 'restored']);
    for (const m of MISSIONS) {
      const rec = { status: 'completed' };
      for (const q of m.debriefQs || []) rec[q.id] = q.options?.[0]?.value ?? 7;
      const ev = restoreEvents({ missions: { [m.id]: rec }, accounts: {} }).find((e) => e.name === 'mission-completed');
      for (const k of Object.keys(ev.data)) expect(allowed.has(k), `${m.id}: ${k}`).toBe(true);
    }
  });

  it('a non-string garbage finding (object, array of several) is dropped, not resent', () => {
    for (const bad of [{ a: 1 }, [1, 2]]) {
      const ev = restoreEvents({ missions: { 'gmail-recon-breach': { status: 'completed', finding: bad } }, accounts: {} })
        .find((e) => e.name === 'mission-completed');
      expect(ev.data.finding).toBeUndefined();
    }
  });

  it('a stored value with an uppercase or space is dropped', () => {
    const ev = restoreEvents({ missions: { 'gmail-recon-breach': { status: 'completed', finding: 'No Breaches' } }, accounts: {} })
      .find((e) => e.name === 'mission-completed');
    expect(ev.data.finding).toBeUndefined();
  });
});

// ── Stored answers: refiling, hidden questions, numbers ─────────────
describe('fileDebrief keeps answers', () => {
  it('refiling with a different parent answer never keeps the hidden follow-up (every showIf mission)', () => {
    const leaks = [];
    for (const m of MISSIONS) {
      const children = (m.debriefQs || []).filter((q) => q.showIf);
      if (!children.length || m.id === 'password_manager-fortify-burst') continue;
      for (const child of children) {
        const parent = m.debriefQs.find((q) => q.id === child.showIf.question);
        if (!parent || parent.type === 'number') continue;
        const vals = parent.options.map((o) => o.value);
        const showing = vals.find((v) => !child.showIf.values ? (v !== 'skip' && !child.showIf.notValues.includes(v)) : child.showIf.values.includes(v));
        const hiding = vals.find((v) => v !== showing && !visibleQuestions(m, { [parent.id]: v }).includes(child));
        if (showing === undefined || hiding === undefined) continue;
        const fill = (q) => (q.type === 'number' ? '3' : q.multi ? [q.options[0].value] : q.options[0]?.value);
        const base = {};
        for (const q of m.debriefQs) base[q.id] = fill(q);
        const first = fileDebrief(stateWith({}), m, { ...base, [parent.id]: showing });
        if (!first) continue;
        const again = fileDebrief(first.state, m, { ...base, [parent.id]: hiding });
        if (!again) continue;
        if (again.state.missions[m.id][child.id] !== undefined) leaks.push(`${m.id}:${child.id}`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it('refiling a completed breach check as clean drops the stale password_exposed', () => {
    const m = byId('gmail-recon-breach');
    const a = fileDebrief(stateWith({}), m, { finding: '1-2-breaches', password_exposed: 'no' });
    expect(a.state.missions[m.id].password_exposed).toBe('no');
    const b = fileDebrief(a.state, m, { finding: 'no-breaches', password_exposed: 'no' });
    expect(b.state.missions[m.id].password_exposed).toBeUndefined();
  });

  it('refiling completed as skipped removes completedAt and every old answer key', () => {
    const m = byId('gmail-recon-breach');
    const a = fileDebrief(stateWith({}), m, { finding: '1-2-breaches', password_exposed: 'no' });
    expect(a.state.missions[m.id].completedAt).toBeTruthy();
    const b = fileDebrief(a.state, m, { finding: 'skip' });
    expect(b.event).toEqual({ status: 'skipped' });
    expect(b.state.missions[m.id].completedAt).toBeUndefined();
    expect(b.state.missions[m.id].password_exposed).toBeUndefined();
  });

  const pm = byId('password_manager-recon-report') || MISSIONS.find((x) => x.debriefQs?.some((q) => q.id === 'flagged_count'));
  const rec = (a) => fileDebrief(stateWith({}), pm, a);

  it.each([
    ['negative', '-1'], ['NaN', 'NaN'], ['exponent', '1e3'], ['decimal', '2.5'], ['signed', '+3'],
    ['hex', '0x10'], ['huge over max', '99999999999999999999'], ['400 digits', '9'.repeat(400)],
    ['over max', '10000'], ['arabic digits', '٣'], ['blank', '   '], ['Infinity', 'Infinity'],
  ])('flagged_count %s is rejected', (_n, raw) => {
    expect(rec({ flagged_count: raw, throwaway_count: '0', flagged: ['none'] })).toBeNull();
  });

  it('flagged_count with surrounding spaces and leading zeros is stored as the plain number', () => {
    const r = rec({ flagged_count: ' 007 ', throwaway_count: '2', flagged: ['none'] });
    expect(r.state.missions[pm.id].flagged_count).toBe(7);
  });

  it('throwaway_count above flagged_count is capped, and 0 flagged caps throwaway to 0', () => {
    expect(rec({ flagged_count: '3', throwaway_count: '99', flagged: ['none'] }).state.missions[pm.id].throwaway_count).toBe(3);
    expect(rec({ flagged_count: '0', throwaway_count: '5', flagged: ['none'] }).state.missions[pm.id].throwaway_count).toBe(0);
  });

  it('a skipped PM report keeps no counts, no pmFlagged, and files skipped', () => {
    const r = rec({ flagged_count: 'skip' });
    expect(r.event).toEqual({ status: 'skipped' });
    const stored = r.state.missions[pm.id];
    for (const k of ['flagged', 'flagged_count', 'throwaway_count']) expect(stored[k]).toBeUndefined();
    expect(r.state.pmFlagged).toBeUndefined();
    expect(r.state.pmFlaggedCount).toBeUndefined();
  });

  it('a skipped PM report with stale hidden answers still stores none of them', () => {
    const r = rec({ flagged_count: 'skip', throwaway_count: '4', flagged: ['gmail'] });
    expect(r.state.missions[pm.id].throwaway_count).toBeUndefined();
    expect(r.state.missions[pm.id].flagged).toBeUndefined();
  });

  it('answers for unknown question ids are never stored', () => {
    const m = byId('gmail-recon-breach');
    const r = fileDebrief(stateWith({}), m, { finding: 'no-breaches', evil: 'x', status: 'skipped', completedAt: 'y' });
    expect(r.state.missions[m.id].evil).toBeUndefined();
    expect(r.state.missions[m.id].status).toBe('completed');
  });
});

// ── Tracking leak sweep ─────────────────────────────────────────────
describe('stored answers never reach track()', () => {
  it('missionEventData of a fully answered record has only whitelisted keys', () => {
    const allowed = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method', 'same_address']);
    for (const m of MISSIONS) {
      const rec = { status: 'completed' };
      for (const q of m.debriefQs || []) rec[q.id] = q.options?.[0]?.value ?? 7;
      for (const k of Object.keys(missionEventData(m, rec))) expect(allowed.has(k), `${m.id}: ${k}`).toBe(true);
    }
  });
});

// ── Streak ──────────────────────────────────────────────────────────
describe('streakAfterFiling across day boundaries', () => {
  const at = (iso) => vi.setSystemTime(new Date(iso));
  const fresh = (lastDate, current = 3, best = 5) => ({ ...createInitialState(), streak: { current, best, lastDate } });

  it('a skipped filing returns the very same state, even across a day boundary', () => {
    vi.useFakeTimers(); at('2026-10-08T00:00:01Z');
    const s = fresh('2026-10-07');
    expect(streakAfterFiling(s, { status: 'skipped' })).toBe(s);
  });

  it('yesterday at 23:59:59Z then a completed filing at 00:00:01Z extends the streak', () => {
    vi.useFakeTimers(); at('2026-10-08T00:00:01Z');
    expect(streakAfterFiling(fresh('2026-10-07'), { status: 'completed' }).streak).toEqual({ current: 4, best: 5, lastDate: '2026-10-08' });
  });

  it('a second completed filing the same day does not double count', () => {
    vi.useFakeTimers(); at('2026-10-08T12:00:00Z');
    const once = streakAfterFiling(fresh('2026-10-07'), { status: 'completed' });
    expect(streakAfterFiling(once, { status: 'completed' })).toBe(once);
  });

  it('a gap of two days resets to 1 and keeps best', () => {
    vi.useFakeTimers(); at('2026-10-09T12:00:00Z');
    expect(streakAfterFiling(fresh('2026-10-07'), { status: 'completed' }).streak).toEqual({ current: 1, best: 5, lastDate: '2026-10-09' });
  });

  it('complete Mon, skip Tue, complete Wed: the skipped day breaks the streak', () => {
    vi.useFakeTimers();
    at('2026-10-05T10:00:00Z');
    let s = streakAfterFiling(fresh(null, 0, 0), { status: 'completed' });
    at('2026-10-06T10:00:00Z');
    s = streakAfterFiling(s, { status: 'skipped' });
    at('2026-10-07T10:00:00Z');
    s = streakAfterFiling(s, { status: 'completed' });
    expect(s.streak.current).toBe(1);
  });

  it('null event (mid-job burst) and not-needed both extend', () => {
    vi.useFakeTimers(); at('2026-10-08T12:00:00Z');
    expect(streakAfterFiling(fresh('2026-10-07'), null).streak.current).toBe(4);
    expect(streakAfterFiling(fresh('2026-10-07'), { status: 'not-needed' }).streak.current).toBe(4);
  });

  it('a lastDate in the future (clock moved back) does not throw or lower best', () => {
    vi.useFakeTimers(); at('2026-10-08T12:00:00Z');
    const out = streakAfterFiling(fresh('2026-12-01'), { status: 'completed' });
    expect(out.streak.best).toBe(5);
    expect(out.streak.current).toBe(1);
  });
});

// ── Reopened debrief, every question type ───────────────────────────
describe('reopened debrief shows what was filed', () => {
  function answersFor(m, pick) {
    const a = {};
    for (const q of m.debriefQs) {
      if (q.type === 'number') a[q.id] = String(Math.max(q.min ?? 0, 5));
      else if (q.multi) a[q.id] = [q.options[pick % q.options.length].value];
      else a[q.id] = q.options[pick % q.options.length].value;
    }
    return a;
  }
  const pmState = () => ({ ...stateWith({}), passwordManager: 'other', pmFlaggedCount: 2, pmThrowaway: 0, pmChanged: 0 });

  it('every mission filed completed (each option in turn) reopens with no "Not recorded", undefined or NaN for an answered question', () => {
    const bad = [];
    for (const m of MISSIONS) {
      // The burst mission is covered by its own test below (a known failure).
      if (!m.debriefQs?.length || m.id === 'password_manager-fortify-burst') continue;
      const maxOpts = Math.max(...m.debriefQs.map((q) => q.options.length), 1);
      for (let pick = 0; pick < maxOpts; pick++) {
        const filed = fileDebrief(pmState(), m, answersFor(m, pick));
        if (!filed || filed.state.missions[m.id].status !== 'completed') continue;
        const html = renderDebrief(filed.state, m.id);
        if (/Not recorded|undefined|NaN|\[object/.test(html)) bad.push(`${m.id}#${pick}`);
      }
    }
    expect(bad).toEqual([]);
  });

  // BELIEVES WRONG: "Change the next 3" answered "More than 3" (changed=more,
  // changed_more=N) stores the last burst as changed: String(N) (e.g. "5"),
  // which matches none of the question's options (1,2,3,more,0,later), so the
  // finished job reopens with "Not recorded" for "How many did you change?"
  // and the follow-up "How many?" is lost. The stored answer should be
  // 'more' + changed_more so it round-trips like every other question.
  it('burst answered "More than 3" reopens showing the answer, not "Not recorded"', () => {
    const m = byId('password_manager-fortify-burst');
    const filed = fileDebrief(pmState(), m, { changed: 'more', changed_more: '5', junk: 'no' });
    expect(filed.state.missions[m.id].status).toBe('completed');
    const html = renderDebrief(filed.state, m.id);
    expect(html).not.toMatch(/Not recorded/);
  });

  it('burst answered with a listed number (1) reopens with that option', () => {
    const m = byId('password_manager-fortify-burst');
    const s = { ...pmState(), pmFlaggedCount: 1 };
    const filed = fileDebrief(s, m, { changed: '1', junk: 'no' });
    expect(filed.state.missions[m.id].status).toBe('completed');
    expect(renderDebrief(filed.state, m.id)).not.toMatch(/Not recorded/);
  });

  it('a stored multi answer whose options have all gone shows "Not recorded", never the array', () => {
    const m = MISSIONS.find((x) => x.debriefQs?.some((q) => q.id === 'flagged'));
    const s = stateWith({ [m.id]: { status: 'completed', flagged_count: 3, throwaway_count: 0, flagged: ['gone-account'] } });
    const html = renderDebrief(s, m.id);
    expect(html).not.toMatch(/gone-account/);
  });

  it('a number answer stored as 0 shows 0', () => {
    const m = MISSIONS.find((x) => x.debriefQs?.some((q) => q.id === 'flagged_count'));
    const s = stateWith({ [m.id]: { status: 'completed', flagged_count: 0, throwaway_count: 0, flagged: ['none'] } });
    expect(renderDebrief(s, m.id)).toMatch(/>\s*0\s*</);
  });

  it('an old-save raw string in a number question never prints', () => {
    const m = MISSIONS.find((x) => x.debriefQs?.some((q) => q.id === 'flagged_count'));
    const s = stateWith({ [m.id]: { status: 'completed', flagged_count: BROKEN_SKIP, throwaway_count: 1e21, flagged: ['none'] } });
    const html = renderDebrief(s, m.id);
    expect(html).not.toMatch(/severity:/);
  });
});
