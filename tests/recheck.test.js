import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../src/data/missions.js';
import { applyRecheck, missionEventData } from '../src/utils/debrief.js';
import { createInitialState } from '../src/state.js';
import { renderDebrief } from '../src/screens/debrief.js';

vi.mock('../src/utils/analytics.js', () => ({
  track: vi.fn(), trackNow: vi.fn(), trackPageview: vi.fn(), trackThenStop: vi.fn(), waitForTracker: vi.fn(),
}));
import * as analytics from '../src/utils/analytics.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  vi.clearAllMocks();
});

const mission = MISSIONS.find((m) => m.id === 'gmail-recon-login');
const answersWith = (pick) => {
  const a = {};
  for (const q of mission.debriefQs) if (!q.showIf) a[q.id] = pick(q);
  return a;
};
const first = (q) => q.options.find((o) => o.severity !== 'skip' && o.value !== 'skip' && o.value !== 'later').value;
const good = () => {
  const a = answersWith(first);
  // answer follow-ups made visible
  for (let i = 0; i < 3; i++) {
    for (const q of mission.debriefQs) if (q.showIf && a[q.id] === undefined) a[q.id] = first(q);
  }
  return a;
};
const completedState = (extra = {}) => {
  const s = createInitialState();
  s.missions = { ...s.missions, [mission.id]: { status: 'completed', completedAt: '2026-01-01T00:00:00.000Z', finding: 'old', ...extra } };
  return s;
};

describe('applyRecheck', () => {
  it('keeps status and completedAt, merges answers, sets rechecked', () => {
    const state = completedState();
    const next = applyRecheck(state, mission, good(), '2026-10-20T00:00:00.000Z');
    const rec = next.missions[mission.id];
    expect(rec.status).toBe('completed');
    expect(rec.completedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(rec.rechecked).toBe('2026-10-20T00:00:00.000Z');
    for (const q of mission.debriefQs) if (good()[q.id] !== undefined) expect(rec[q.id]).toBe(good()[q.id]);
    expect(state.missions[mission.id].rechecked).toBeUndefined();
  });

  it('returns null for skipped, not-needed, and unfiled missions', () => {
    for (const status of ['skipped', 'not-needed']) {
      const s = completedState();
      s.missions[mission.id] = { status };
      expect(applyRecheck(s, mission, good())).toBeNull();
    }
    const s = createInitialState();
    delete s.missions[mission.id];
    expect(applyRecheck(s, mission, good())).toBeNull();
  });

  it('returns null for incomplete answers or a skip answer, leaving the record alone', () => {
    const state = completedState();
    expect(applyRecheck(state, mission, {})).toBeNull();
    const skipQ = mission.debriefQs.find((q) => !q.showIf && q.options.some((o) => o.severity === 'skip'));
    expect(skipQ).toBeTruthy();
    const skipOpt = skipQ.options.find((o) => o.severity === 'skip');
    expect(applyRecheck(state, mission, { ...good(), [skipQ.id]: skipOpt.value })).toBeNull();
  });

  it('breach to clean re-check drops the hidden password_exposed answer', () => {
    const breach = MISSIONS.find((m) => m.id === 'gmail-recon-breach');
    const s = createInitialState();
    s.missions = { ...s.missions, [breach.id]: { status: 'completed', completedAt: '2026-01-01T00:00:00.000Z', finding: '1-2-breaches', password_exposed: 'no', action: 'x' } };
    const clean = breach.debriefQs[0].options.find((o) => o.value === 'no-breaches');
    expect(clean).toBeTruthy();
    const next = applyRecheck(s, breach, { [breach.debriefQs[0].id]: 'no-breaches' });
    const rec = next.missions[breach.id];
    expect(rec.finding).toBe('no-breaches');
    expect('password_exposed' in rec).toBe(false);
    expect(rec.action).not.toBe('x');
    expect(missionEventData(breach, rec).password_exposed).toBeUndefined();
  });

  it('is blocked for the password-manager report and burst missions', () => {
    for (const id of ['password_manager-recon-report', 'password_manager-fortify-burst']) {
      const m = MISSIONS.find((x) => x.id === id);
      expect(m).toBeTruthy();
      const s = createInitialState();
      s.missions = { ...s.missions, [id]: { status: 'completed', completedAt: 'x' } };
      expect(applyRecheck(s, m, { changed: '1', junk: 'no', flagged: ['none'], flagged_count: 0, throwaway_count: 0 })).toBeNull();
      const html = renderDebrief(s, id, { recheck: true });
      expect(html).toContain(`#/mission/${id}/briefing`);
      expect(html).not.toContain('submit-recheck');
    }
  });

  it('never reaches analytics: no track calls from applyRecheck', () => {
    applyRecheck(completedState(), mission, good());
    for (const fn of Object.values(analytics)) expect(fn).not.toHaveBeenCalled();
    const util = readFileSync('src/utils/debrief.js', 'utf8');
    expect(util).not.toMatch(/analytics/);
    // The app.js submit-recheck click is driven for real in tests/app/local-only-actions.test.js.
  });
});

describe('recheck screen', () => {
  it('shows an editable, prefilled form with RE-CHECK and submit-recheck for a completed mission', () => {
    const answers = good();
    const state = completedState(answers);
    const html = renderDebrief(state, mission.id, { recheck: true });
    expect(html).toContain('RE-CHECK');
    expect(html).toContain('data-action="submit-recheck"');
    expect(html).not.toContain('data-action="submit-debrief"');
    expect(html).not.toContain('SECURED');
    const q = mission.debriefQs[0];
    expect(html).toMatch(new RegExp(`name="q_${q.id}" value="${answers[q.id]}" checked`));
  });

  it('renders the normal briefing link, not a form, for non-completed missions', () => {
    for (const rec of [{ status: 'skipped' }, { status: 'not-needed' }, undefined]) {
      const s = createInitialState();
      s.missions = { ...s.missions };
      if (rec) s.missions[mission.id] = rec; else delete s.missions[mission.id];
      const html = renderDebrief(s, mission.id, { recheck: true });
      expect(html).toContain(`#/mission/${mission.id}/briefing`);
      expect(html).not.toContain('submit-recheck');
      expect(html).not.toContain('type="radio"');
    }
  });

  it('plain debrief of a completed mission is unchanged (SECURED, no form)', () => {
    const html = renderDebrief(completedState(good()), mission.id);
    expect(html).toContain('SECURED');
    expect(html).not.toContain('submit-recheck');
  });
});

describe('final fixes: re-check reopens a stale "not needed"', () => {
  it('re-checking a login check to a stranger reopens the account password reset', () => {
    const s = createInitialState();
    s.missions = {
      ...s.missions,
      'gmail-recon-breach': { status: 'completed', completedAt: '2026-09-01T00:00:00.000Z', finding: 'no-breaches' },
      'gmail-recon-login': { status: 'completed', completedAt: '2026-09-01T00:00:00.000Z', finding: 'no-breaches' },
      'gmail-fortify-password': { status: 'not-needed' },
    };
    const next = applyRecheck(s, mission, { finding: '1-2-breaches' }, '2026-10-20T00:00:00.000Z');
    expect(next.missions['gmail-recon-login'].finding).toBe('1-2-breaches');
    expect(next.missions['gmail-fortify-password'].status).not.toBe('not-needed');
    expect(next.missions['gmail-fortify-password'].reopened).toContain('login');
    // A clean re-check leaves it alone.
    const same = applyRecheck(s, mission, { finding: 'no-breaches' }, '2026-10-20T00:00:00.000Z');
    expect(same.missions['gmail-fortify-password'].status).toBe('not-needed');
  });
});

describe('final fixes: re-check hides skip answers', () => {
  it('the recheck form has no skip-severity, skip or later options; the plain form still does', () => {
    const s = completedState({ finding: 'no-breaches' });
    const html = renderDebrief(s, mission.id, { recheck: true });
    expect(html).not.toMatch(/value="skip"/);
    expect(html).not.toContain('badge--skip');
    expect(html).toContain('value="no-breaches"');
    expect(html).toContain('data-recheck-msg');
    expect(html).toContain('A re-check keeps this filed as it was. Pick an answer, or go back.');
    const fresh = createInitialState();
    expect(renderDebrief(fresh, mission.id)).toMatch(/value="skip"/);
  });
  it('2FA and reglock re-checks drop "later" too', () => {
    for (const [id, rec] of [['gmail-fortify-2fa', { method: 'sms' }], ['signal-fortify-reglock', { action: 'enabled-2fa' }], ['gmail-fortify-2fa-upgrade', { method: 'authenticator' }]]) {
      const s = createInitialState();
      s.missions = { ...s.missions, [id]: { status: 'completed', completedAt: 'x', ...rec } };
      const html = renderDebrief(s, id, { recheck: true });
      expect(html).toContain('submit-recheck');
      expect(html).not.toMatch(/value="(later|skip)"/);
    }
  });
  it('submitRecheck shows the message instead of doing nothing', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const body = app.slice(app.indexOf('function submitRecheck'), app.indexOf('function readAnswers'));
    expect(body).toMatch(/data-recheck-msg[\s\S]*hidden = false/);
  });
});

describe('final fixes: recheck-unavailable panel fits a phone', () => {
  it('uses 16px gutters and no 440px panel', () => {
    const html = renderDebrief(createInitialState(), mission.id, { recheck: true });
    expect(html).toContain('padding: 24px 16px;');
    expect(html).not.toContain('max-width: 440px');
    expect(html).not.toContain('padding: 40px');
  });
});
