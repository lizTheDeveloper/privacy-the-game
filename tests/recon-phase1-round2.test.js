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
  it('a broken skip/later answer becomes its clean id, filed as skipped, with no completedAt', () => {
    const storage = memStorage();
    saveState(oldSave(), storage);
    const s = loadState(storage);
    expect(s.missions['scam_defense-recon-phishing-eye']).toMatchObject({ status: 'skipped', finding: 'skip' });
    expect(s.missions['scam_defense-recon-phishing-eye'].completedAt).toBeUndefined();
    expect(s.missions['sim_protection-fortify-pin']).toMatchObject({ status: 'skipped', action: 'later' });
    expect(s.missions['sim_protection-fortify-pin'].completedAt).toBeUndefined();
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
const TRACKED = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method', 'pod']);

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
