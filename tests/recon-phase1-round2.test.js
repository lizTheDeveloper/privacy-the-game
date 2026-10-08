// Recon campaign, phase 1, after the breaker round: old saves, restore,
// stored answers, the password line, and the streak.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MISSIONS } from '../src/data/missions.js';
import { PASSWORD_DIALOGUE } from '../src/data/dialogue.js';
import { fileDebrief, missionEventData } from '../src/utils/debrief.js';
import { renderDebrief, debriefReaction } from '../src/screens/debrief.js';
import { restoreEvents } from '../src/utils/restore.js';
import { track } from '../src/utils/analytics.js';
import { createInitialState, loadState, saveState, streakAfterFiling } from '../src/state.js';
import { migrateBrokenAnswers } from '../src/utils/migrate-answers.js';

const byId = (id) => MISSIONS.find((m) => m.id === id);
const OLD_SKIP_FINDING = "skip', text: 'I'll come back to this', severity: 'skip";
const OLD_LATER_ACTION = "later', text: 'I'll come back to this', severity: 'skip";
const OLD_NA_ACTION = "not-applicable', text: 'Doesn't apply to me', severity: 'safe";

function memStorage() {
  const store = {};
  return { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
}

function oldSave() {
  const s = createInitialState();
  s.missions['scam_defense-recon-phishing-eye'] = { status: 'completed', finding: OLD_SKIP_FINDING, completedAt: '2026-09-01T00:00:00.000Z' };
  s.missions['sim_protection-fortify-pin'] = { status: 'completed', action: OLD_LATER_ACTION, completedAt: '2026-09-01T00:00:00.000Z' };
  s.missions['sim_protection-reclaim-remove-sms'] = { status: 'completed', action: OLD_NA_ACTION, completedAt: '2026-09-02T00:00:00.000Z' };
  s.missions['gmail-recon-breach'] = { status: 'completed', finding: 'no-breaches', completedAt: '2026-09-03T00:00:00.000Z' };
  return s;
}

beforeEach(() => { globalThis.localStorage = memStorage(); });
afterEach(() => { vi.restoreAllMocks(); delete globalThis.umami; });

// ── Ruling 1: migrate old saves on load ────────────────────────────
describe('old saves with a broken answer are repaired on load', () => {
  // Ruling (Phase 3 re-review 4): a filed record keeps its status, so no old
  // save loses its finished city; only the broken value is cleaned.
  it('a broken skip/later answer becomes its clean id and keeps its filed status', () => {
    const storage = memStorage();
    saveState(oldSave(), storage);
    const s = loadState(storage);
    expect(s.missions['scam_defense-recon-phishing-eye']).toMatchObject({ finding: 'skip' });
    expect(s.missions['scam_defense-recon-phishing-eye'].status).toBe(oldSave().missions['scam_defense-recon-phishing-eye'].status);
    expect(s.missions['sim_protection-fortify-pin']).toMatchObject({ action: 'later' });
    expect(s.missions['sim_protection-fortify-pin'].status).toBe(oldSave().missions['sim_protection-fortify-pin'].status);
  });

  it('a broken answer that was not a skip keeps its status and completedAt', () => {
    const storage = memStorage();
    saveState(oldSave(), storage);
    const m = loadState(storage).missions['sim_protection-reclaim-remove-sms'];
    expect(m).toMatchObject({ status: 'completed', action: 'not-applicable', completedAt: '2026-09-02T00:00:00.000Z' });
  });

  it('clean records are untouched', () => {
    const s = migrateBrokenAnswers(oldSave());
    expect(s.missions['gmail-recon-breach']).toEqual(oldSave().missions['gmail-recon-breach']);
  });

  it('is idempotent, and runs once (marked done in the save)', () => {
    const once = migrateBrokenAnswers(oldSave());
    expect(migrateBrokenAnswers(once)).toEqual(once);
    expect(once.answersRepaired).toBe(1);
    const marked = { ...oldSave(), answersRepaired: 1 };
    expect(migrateBrokenAnswers(marked)).toBe(marked);
    const storage = memStorage();
    saveState(oldSave(), storage);
    const first = loadState(storage);
    saveState(first, storage);
    expect(loadState(storage)).toEqual(first);
  });

  it('a value that matches no option shows "Not recorded"; a number answer still shows its number', () => {
    const s = createInitialState();
    s.missions['scam_defense-recon-phishing-eye'] = { status: 'completed', finding: 'no-such-answer' };
    const html = renderDebrief(s, 'scam_defense-recon-phishing-eye');
    expect(html).toContain('Not recorded');
    expect(html).not.toContain('no-such-answer');
    const pm = byId('password_manager-recon-report');
    s.passwordManager = 'bitwarden';
    const filed = fileDebrief(s, pm, { flagged_count: '4', throwaway_count: '1', flagged: ['none'] });
    expect(renderDebrief(filed.state, pm.id)).toMatch(/>4</);
  });
});

// ── Ruling 2: restore never sends a non-slug value ─────────────────
describe('restore guard', () => {
  it('drops any answer value that is not a clean id', () => {
    const s = createInitialState();
    s.missions['scam_defense-recon-phishing-eye'] = { status: 'completed', finding: OLD_SKIP_FINDING };
    s.missions['gmail-recon-breach'] = { status: 'completed', finding: 'No Breaches', password_exposed: 'yes' };
    const evs = restoreEvents(s);
    const ph = evs.find((e) => e.data.mission === 'scam_defense-recon-phishing-eye');
    expect(ph.data.finding).toBeUndefined();
    const gm = evs.find((e) => e.data.mission === 'gmail-recon-breach');
    expect(gm.data.finding).toBeUndefined();
    expect(gm.data.password_exposed).toBe('yes');
  });
});

// ── Ruling 3: every answered question is stored; tracking stays whitelisted ─
const TRACKED = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method', 'same_address', 'pod']);

function firstAnswers(m) {
  const a = {};
  for (const q of m.debriefQs) {
    if (q.showIf) continue;
    const opt = q.options?.find((o) => o.severity !== 'skip' && o.value !== 'skip' && o.value !== 'later') ?? q.options?.[0];
    if (q.type === 'number') a[q.id] = '2';
    else if (q.multi) a[q.id] = [opt.value];
    else a[q.id] = opt?.value;
  }
  return a;
}

describe('filed answers', () => {
  it('stores every answered question by its id (single, multi and number)', () => {
    const broker = byId('people_search-recon-find-yourself');
    const s1 = fileDebrief(createInitialState(), broker, { broker_recon: 'found-some' }).state;
    expect(s1.missions[broker.id].broker_recon).toBe('found-some');
    expect(renderDebrief(s1, broker.id)).toContain('Found my info on some of them');
    const pm = byId('password_manager-recon-report');
    const s = { ...createInitialState(), passwordManager: 'bitwarden' };
    const s2 = fileDebrief(s, pm, { flagged_count: '3', throwaway_count: '1', flagged: ['none'] }).state;
    expect(s2.missions[pm.id]).toMatchObject({ flagged_count: 3, throwaway_count: 1, flagged: ['none'] });
  });

  it('refiling clears the previous answers to every question', () => {
    const m = byId('credit_freeze-fortify-equifax');
    const s1 = fileDebrief(createInitialState(), m, { freeze_status: 'now-frozen' }).state;
    const s2 = fileDebrief(s1, m, { freeze_status: 'skip' }).state;
    expect(s2.missions[m.id]).toMatchObject({ status: 'skipped', freeze_status: 'skip' });
  });

  it('only whitelisted keys ever reach track(), for every mission, live and restored', () => {
    globalThis.umami = { track: vi.fn() };
    let s = { ...createInitialState(), passwordManager: 'bitwarden' };
    for (const m of MISSIONS) {
      const filed = fileDebrief(s, m, firstAnswers(m));
      if (!filed) continue;
      s = filed.state;
      if (filed.event) track('mission-completed', missionEventData(m, { ...s.missions[m.id], status: filed.event.status }));
    }
    for (const e of restoreEvents(s)) track(e.name, e.data);
    const sent = globalThis.umami.track.mock.calls.filter(([n]) => n === 'mission-completed');
    expect(sent.length).toBeGreaterThan(100);
    const leaked = new Set();
    for (const [, data] of sent) for (const k of Object.keys(data)) if (!TRACKED.has(k) && k !== 'restored') leaked.add(k);
    expect([...leaked]).toEqual([]);
    for (const k of ['freeze_status', 'broker_recon', 'optout_result', 'flagged_count', 'throwaway_count', 'flagged']) {
      expect(sent.some(([, d]) => k in d)).toBe(false);
    }
  });
});

// ── Ruling 4: the inbox password line only on email breach checks ──
describe('password line', () => {
  it('a non-email breach check with password_exposed=no gets its own line', () => {
    const m = byId('primary_bank-recon-breach');
    const s = createInitialState();
    s.missions[m.id] = { status: 'completed', finding: '1-2-breaches', password_exposed: 'no' };
    expect(debriefReaction(s, m).line).toBe(m.scoutDialog.debrief['1-2-breaches']);
  });

  it('an email breach check with password_exposed=no still gets the password line first', () => {
    const m = byId('gmail-recon-breach');
    const s = createInitialState();
    s.missions[m.id] = { status: 'completed', finding: '1-2-breaches', password_exposed: 'no' };
    expect(debriefReaction(s, m).line).toBe(PASSWORD_DIALOGUE.breachNoPassword);
  });
});

// ── Ruling 5: a skipped filing does not extend the streak ──────────
describe('streakAfterFiling', () => {
  const day = (iso) => new Date(`${iso}T12:00:00.000Z`).getTime();
  const base = () => ({ ...createInitialState(), streak: { current: 2, best: 2, lastDate: '2026-10-06' } });

  it('a skipped filing leaves the streak alone', () => {
    vi.useFakeTimers({ toFake: ['Date'], now: day('2026-10-07') });
    try {
      const s = base();
      expect(streakAfterFiling(s, { status: 'skipped' }).streak).toEqual(s.streak);
    } finally { vi.useRealTimers(); }
  });

  it('a completed filing, a not-needed one or a mid-job burst (no event) extends it', () => {
    vi.useFakeTimers({ toFake: ['Date'], now: day('2026-10-07') });
    try {
      for (const ev of [{ status: 'completed' }, { status: 'not-needed' }, null]) {
        expect(streakAfterFiling(base(), ev).streak).toEqual({ current: 3, best: 3, lastDate: '2026-10-07' });
      }
    } finally { vi.useRealTimers(); }
  });
});

// ── Round 2: the burst keeps the chosen option ─────────────────────
describe('"Change the next 3" stores the option the player picked', () => {
  const pm = () => ({ ...createInitialState(), passwordManager: 'other', pmFlaggedCount: 10, pmThrowaway: 0, pmChanged: 0 });
  const burst = () => byId('password_manager-fortify-burst');

  it('"More than 3" stores changed: more plus changed_more, adds N, and reopens with both', () => {
    // Five flagged, five changed: the job is done, so the debrief is filed.
    const filed = fileDebrief({ ...pm(), pmFlaggedCount: 5 }, burst(), { changed: 'more', changed_more: '5', junk: 'no' });
    const rec = filed.state.missions[burst().id];
    expect(rec).toMatchObject({ status: 'completed', changed: 'more', changed_more: 5 });
    expect(filed.state.pmChanged).toBe(5);
    const html = renderDebrief(filed.state, burst().id);
    expect(html).toContain('More than 3');
    expect(html).toMatch(/>5</);
    expect(html).not.toMatch(/Not recorded/);
  });

  it('a listed number stays its option value, and totals still add across bursts', () => {
    let s = fileDebrief(pm(), burst(), { changed: '2', junk: 'no' }).state;
    expect(s.missions[burst().id].changed).toBe('2');
    expect(s.missions[burst().id].changed_more).toBeUndefined();
    s = fileDebrief(s, burst(), { changed: '3', junk: 'yes', junk_count: '1' }).state;
    expect(s.pmChanged).toBe(5);
    expect(s.pmThrowaway).toBe(1);
  });

  it('an old save that stored "More than 3" as its number reopens as "More than 3"', () => {
    const s = pm();
    s.missions[burst().id] = { status: 'completed', changed: '7', junk: 'no' };
    const html = renderDebrief(s, burst().id);
    expect(html).toContain('More than 3');
    expect(html).not.toMatch(/Not recorded/);
  });

  it('no burst answer reaches track()', () => {
    globalThis.umami = { track: vi.fn() };
    const filed = fileDebrief(pm(), burst(), { changed: 'more', changed_more: '10', junk: 'no' });
    expect(filed.event).toEqual({ status: 'completed' });
    track('mission-completed', missionEventData(burst(), { ...filed.state.missions[burst().id], status: 'completed' }));
    for (const e of restoreEvents(filed.state)) track(e.name, e.data);
    for (const [, d] of globalThis.umami.track.mock.calls) {
      for (const k of ['changed', 'changed_more', 'junk', 'junk_count']) expect(k in (d || {})).toBe(false);
    }
  });
});

// ── Round 2: streak days are the player's local calendar day ───────
describe('streak uses the local calendar day', () => {
  const realTZ = process.env.TZ;
  const inZone = (tz, iso) => { process.env.TZ = tz; vi.useFakeTimers({ toFake: ['Date'], now: new Date(iso) }); };
  afterEach(() => { vi.useRealTimers(); process.env.TZ = realTZ; });
  const start = () => ({ ...createInitialState(), streak: { current: 0, best: 0, lastDate: null } });

  it('Pacific evening filings on consecutive local days extend the streak', () => {
    inZone('America/Los_Angeles', '2026-10-06T20:00:00-07:00'); // 03:00Z on the 7th
    let s = streakAfterFiling(start(), { status: 'completed' });
    expect(s.streak).toEqual({ current: 1, best: 1, lastDate: '2026-10-06' });
    vi.setSystemTime(new Date('2026-10-07T21:00:00-07:00')); // 04:00Z on the 8th
    s = streakAfterFiling(s, { status: 'completed' });
    expect(s.streak).toEqual({ current: 2, best: 2, lastDate: '2026-10-07' });
  });

  it('two filings on one local day that straddle midnight UTC count once', () => {
    inZone('America/Los_Angeles', '2026-10-07T16:30:00-07:00'); // 23:30Z
    const once = streakAfterFiling(start(), { status: 'completed' });
    vi.setSystemTime(new Date('2026-10-07T17:30:00-07:00')); // 00:30Z on the 8th
    expect(streakAfterFiling(once, { status: 'completed' })).toBe(once);
    expect(once.streak.current).toBe(1);
  });

  it('a Pacific old save with a UTC lastDate a day ahead of local today neither resets nor double counts', () => {
    // Filed 2026-10-07 18:00 PDT: the old code wrote the UTC date, 10-08.
    inZone('America/Los_Angeles', '2026-10-07T20:00:00-07:00');
    const old = { ...createInitialState(), streak: { current: 4, best: 6, lastDate: '2026-10-08' } };
    const same = streakAfterFiling(old, { status: 'completed' });
    expect(same.streak).toEqual({ current: 4, best: 6, lastDate: '2026-10-07' });
    vi.setSystemTime(new Date('2026-10-08T09:00:00-07:00'));
    expect(streakAfterFiling(same, { status: 'completed' }).streak).toEqual({ current: 5, best: 6, lastDate: '2026-10-08' });
  });

  it('a Pacific old save whose UTC lastDate equals local yesterday extends', () => {
    inZone('America/Los_Angeles', '2026-10-08T09:00:00-07:00');
    const old = { ...createInitialState(), streak: { current: 4, best: 6, lastDate: '2026-10-07' } };
    expect(streakAfterFiling(old, { status: 'completed' }).streak).toEqual({ current: 5, best: 6, lastDate: '2026-10-08' });
  });

  it('a Tokyo old save whose UTC lastDate lags local yesterday by a day does not reset', () => {
    // Filed 2026-10-08 08:00 JST: the old code wrote the UTC date, 10-07.
    inZone('Asia/Tokyo', '2026-10-09T20:00:00+09:00');
    const old = { ...createInitialState(), streak: { current: 4, best: 6, lastDate: '2026-10-07' } };
    expect(streakAfterFiling(old, { status: 'completed' }).streak).toEqual({ current: 5, best: 6, lastDate: '2026-10-09' });
  });

  it('a real two-day gap still resets, old save or new', () => {
    inZone('America/Los_Angeles', '2026-10-10T12:00:00-07:00');
    const old = { ...createInitialState(), streak: { current: 4, best: 6, lastDate: '2026-10-07' } };
    expect(streakAfterFiling(old, { status: 'completed' }).streak).toEqual({ current: 1, best: 6, lastDate: '2026-10-10' });
  });
});
