import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('../src/utils/analytics.js', () => ({
  track: vi.fn(), trackNow: vi.fn(), trackThenStop: vi.fn(), waitForTracker: vi.fn(),
}));

import { track } from '../src/utils/analytics.js';
import { createInitialState, updateMission } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { DISTRICTS } from '../src/data/districts.js';
import {
  categoryAsk, categoryEntry, applyCategoryAction, categoryPhrase, openCategoryCount, categoryChangedTotal,
} from '../src/utils/pm-categories.js';
import {
  pmNumbers, applyBurst, pmDoneLine, passwordProgressLines, returnPacingLine, PM_BURST_ID,
} from '../src/utils/bursts.js';
import { fileDebrief, missionEventData } from '../src/utils/debrief.js';
import { calcDistrictProgress, calcIntegrity, getAccountPhaseGate, isCoreMission } from '../src/utils/calc.js';
import { isCityComplete } from '../src/utils/ghost.js';
import { isMissionInPlay, isMissionDone } from '../src/utils/mission-status.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { restoreEvents } from '../src/utils/restore.js';
import { COLLECTIVE_DIALOGUE } from '../src/data/dialogue.js';

const s0 = createInitialState();
const withPm = { ...s0, passwordManager: 'bitwarden' };
const BURST = MISSIONS.find((m) => m.id === PM_BURST_ID);
const act = (s, d, a, v) => applyCategoryAction(s, d, a, v);
const view = { collective: { status: 'idle' }, whoami: { status: 'idle' } };
const txt = (h) => h.replaceAll('&#39;', "'").replaceAll('&rsquo;', '’');

beforeEach(() => track.mockClear());

describe('14b: the per-category ask', () => {
  it('only for players with a password manager (not "No", not unanswered)', () => {
    expect(categoryAsk(s0, 'vault')).toBeNull();
    expect(categoryAsk({ ...s0, passwordManager: 'none' }, 'vault')).toBeNull();
    expect(categoryAsk(withPm, 'vault')).toMatchObject({ mode: 'ask' });
  });

  it('asks in Scout’s voice with the category, on every district incl. Master Keys', () => {
    expect(categoryPhrase('vault')).toBe('banks, payment apps, investments');
    expect(categoryAsk(withPm, 'vault').text).toBe('Did your password manager flag any passwords from here — banks, payment apps, investments?');
    for (const d of DISTRICTS) {
      const html = txt(renderDistrict(withPm, d.id));
      expect(html, d.id).toContain('Did your password manager flag any passwords from here');
      expect(html, d.id).toContain(`data-action="pm-cat-none" data-district="${d.id}"`);
      expect(html, d.id).toContain('scout_0.png');
    }
    expect(renderDistrict(s0, 'vault')).not.toContain('pm-cat-');
  });

  it('flagged → change in place, capped → "Any more from here?" → add more → that’s all', () => {
    let s = act(withPm, 'vault', 'flag', '5');
    expect(categoryEntry(s, 'vault')).toEqual({ flagged: 5, changed: 0, clear: false });
    let a = categoryAsk(s, 'vault');
    expect(a).toMatchObject({ mode: 'working', left: 5 });
    expect(a.lines).toContain('5 to change here.');
    expect(a.scout).toBe('Three at a time. Do 3 now; the rest will keep.');
    s = act(s, 'vault', 'changed', '2');
    a = categoryAsk(s, 'vault');
    expect(a.lines).toEqual(['3 to change here.', '2 changed so far.']);
    s = act(s, 'vault', 'changed', '9');        // capped at flagged
    expect(categoryEntry(s, 'vault').changed).toBe(5);
    a = categoryAsk(s, 'vault');
    expect(a).toMatchObject({ mode: 'more' });
    expect(a.scout).toBe('All 5 from here changed. Any more from here?');
    s = act(s, 'vault', 'flag', '2');
    expect(categoryAsk(s, 'vault')).toMatchObject({ mode: 'working', left: 2 });
    expect(categoryAsk(s, 'vault').scout).toBe("Only 2 — one burst and this part's done.");
    s = act(s, 'vault', 'clear');
    expect(categoryAsk(s, 'vault')).toMatchObject({ mode: 'clear', quiet: '5 changed here. 2 left — your call.' });
  });

  it('"None from here" clears; "No more" clears; the link reopens and keeps the record', () => {
    let s = act(withPm, 'square', 'clear');
    expect(categoryAsk(s, 'square')).toMatchObject({ mode: 'clear', quiet: 'Nothing flagged from here.' });
    let html = txt(renderDistrict(s, 'square'));
    expect(html).not.toContain('Did your password manager flag any passwords from here');
    expect(html).toContain('Found more from here?');
    expect(html).toContain('data-action="pm-cat-reopen" data-district="square"');
    s = act(s, 'square', 'reopen');
    expect(categoryEntry(s, 'square').clear).toBe(false);
    s = act(act(act(s, 'square', 'flag', '1'), 'square', 'changed', '1'), 'square', 'clear');
    html = txt(renderDistrict(s, 'square'));
    expect(html).toContain('1 changed here.');
    expect(html).toContain('Found more from here?');
  });

  it('ignores bad numbers', () => {
    expect(act(withPm, 'vault', 'flag', 'lots')).toBe(withPm);
    expect(act(withPm, 'vault', 'flag', '0')).toBe(withPm);
    expect(act(withPm, 'vault', 'flag', '-3')).toBe(withPm);
    expect(act(withPm, 'vault', 'changed', '2')).toBe(withPm);   // nothing flagged yet
    expect(act(withPm, 'nowhere', 'flag', '2')).toBe(withPm);
  });

  it('never blocks: district %, buildings, phase gates, integrity, city-complete unchanged', () => {
    let s = withPm;
    for (const m of MISSIONS) if (isCoreMission(m) && s.accounts[m.accountId]?.enabled) s = updateMission(s, m.id, { status: 'completed' });
    const before = { city: isCityComplete(s), integ: calcIntegrity(s), p: DISTRICTS.map((d) => calcDistrictProgress(s, d.id)) };
    let t = s;
    for (const d of DISTRICTS) t = act(t, d.id, 'flag', '9');
    expect(isCityComplete(t)).toBe(before.city);
    expect(calcIntegrity(t)).toBe(before.integ);
    expect(DISTRICTS.map((d) => calcDistrictProgress(t, d.id))).toEqual(before.p);
    expect(getAccountPhaseGate(t, 'vault', 'primary_bank', 'recon')).toEqual(getAccountPhaseGate(s, 'vault', 'primary_bank', 'recon'));
  });

  it('nothing from here is ever tracked', () => {
    let s = withPm;
    for (const [a, v] of [['flag', '7'], ['changed', '3'], ['clear'], ['reopen'], ['flag', '2'], ['changed', '6'], ['clear']]) s = act(s, 'vault', a, v);
    expect(track).not.toHaveBeenCalled();
    for (const e of restoreEvents(s)) expect(JSON.stringify(e.data)).not.toMatch(/pmByDistrict|flagged|changed/);
    // The click handler in app.js for these actions never calls track().
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    const start = app.indexOf("action.startsWith('pm-cat-')");
    expect(start).toBeGreaterThan(0);
    const branch = app.slice(start, app.indexOf('} else if', start));
    expect(branch).toContain('applyCategoryAction');
    expect(branch).not.toMatch(/track\w*\(/);
  });
});

describe('14b: per-category changes count toward the manager’s total', () => {
  const counted = { ...withPm, pmFlaggedCount: 10, pmThrowaway: 2, pmChanged: 2 };

  it('effective changed = min(real, bursts + categories)', () => {
    let s = act(act(counted, 'vault', 'flag', '4'), 'vault', 'changed', '3');
    expect(categoryChangedTotal(s)).toBe(3);
    expect(pmNumbers(s)).toMatchObject({ flagged: 10, throwaway: 2, real: 8, changed: 5, left: 3 });
    s = act(act(s, 'square', 'flag', '9'), 'square', 'changed', '9');
    expect(pmNumbers(s)).toMatchObject({ real: 8, changed: 8, left: 0 });
  });

  it('a burst after category changes does not double-count', () => {
    const s = act(act(counted, 'vault', 'flag', '4'), 'vault', 'changed', '3');
    expect(applyBurst(pmNumbers(s), 1, 0)).toEqual({ pmThrowaway: 2, pmChanged: 3 });
    const r = fileDebrief(s, BURST, { changed: '1', junk: 'no' });
    expect(pmNumbers(r.state)).toMatchObject({ changed: 6, left: 2 });
  });

  it('the headline says how many categories are still open, once the player has used them', () => {
    expect(passwordProgressLines(counted)).toHaveLength(2);
    const s = act(counted, 'vault', 'clear');
    expect(openCategoryCount(s)).toBe(DISTRICTS.length - 1);
    expect(passwordProgressLines(s)[2]).toBe(`${DISTRICTS.length - 1} of ${DISTRICTS.length} categories still open.`);
  });
});

describe('14b: "Change the next 3" is a bonus', () => {
  const counted = (flagged, changed = 0) => ({ ...withPm, pmFlaggedCount: flagged, pmThrowaway: 0, pmChanged: changed });

  it('is optional and kept', () => {
    expect(BURST).toBeTruthy();
    expect(BURST.optional).toBe(true);
    expect(isMissionInPlay(counted(5), BURST)).toBe(true);
  });

  it('pending in an old save: Master Keys % never drops', () => {
    const s = counted(5);
    const noBurst = { ...s, pmFlaggedCount: undefined };
    expect(calcDistrictProgress(s, 'master-keys').total).toBe(calcDistrictProgress(noBurst, 'master-keys').total);
    expect(calcDistrictProgress(s, 'master-keys').percent).toBeGreaterThanOrEqual(calcDistrictProgress(noBurst, 'master-keys').percent);
  });

  it('completed in an old save: still counts toward Master Keys', () => {
    let s = updateMission(counted(5, 5), BURST.id, { status: 'completed' });
    s = updateMission(s, 'gmail-recon-breach', { status: 'completed', finding: 'no-breaches' });
    const p = calcDistrictProgress(s, 'master-keys');
    const without = calcDistrictProgress({ ...s, missions: { 'gmail-recon-breach': s.missions['gmail-recon-breach'] } }, 'master-keys');
    expect(p.total).toBe(without.total + 1);
    expect(p.completed).toBe(without.completed + 1);
  });

  it('a whole Master Keys with a pending burst is 100%', () => {
    let s = counted(5);
    for (const m of MISSIONS) if (isCoreMission(m) && s.accounts[m.accountId]?.enabled) s = updateMission(s, m.id, { status: 'completed' });
    if (isMissionInPlay(s, MISSIONS.find((m) => m.id === 'password_manager-recon-report'))) s = updateMission(s, 'password_manager-recon-report', { status: 'completed' });
    expect(calcDistrictProgress(s, 'master-keys').percent).toBe(100);
    expect(isMissionDone(s.missions[BURST.id])).toBe(false);
  });

  it('sends mission-completed only when the whole job is done; restore agrees', () => {
    let r = fileDebrief(counted(7), BURST, { changed: '3', junk: 'no' });
    expect(r.event).toBeNull();
    expect(restoreEvents(r.state).filter((e) => e.data.mission === BURST.id)).toEqual([]);
    r = fileDebrief(r.state, BURST, { changed: '3', junk: 'no' });
    expect(r.event).toBeNull();
    r = fileDebrief(r.state, BURST, { changed: '1', junk: 'no' });
    expect(r.event).toEqual({ status: 'completed' });
    const sent = restoreEvents(r.state).filter((e) => e.data.mission === BURST.id);
    expect(sent).toHaveLength(1);
    const data = missionEventData(BURST, r.state.missions[BURST.id]);
    expect(JSON.stringify(data)).not.toMatch(/changed|junk/);
  });

  it('a finished burst’s debrief shows what was recorded', () => {
    let r = fileDebrief(counted(4), BURST, { changed: '3', junk: 'no' });
    r = fileDebrief(r.state, BURST, { changed: '0', junk: 'yes', junk_count: '1' });
    expect(isMissionDone(r.state.missions[BURST.id])).toBe(true);
    const html = renderDebrief(r.state, BURST.id);
    expect(html).not.toContain('Not recorded');
    expect(html).toContain('Some were junk');
    // An old save that finished before answers were kept shows the total.
    const old = updateMission(counted(4, 4), BURST.id, { status: 'completed' });
    const oldHtml = renderDebrief(old, BURST.id);
    expect(oldHtml).not.toContain('Not recorded');
    expect(oldHtml).toContain('4 changed in all');
  });
});

describe('14b: re-review follow-ups', () => {
  it('pmDoneLine is true when every flagged one was a throwaway', () => {
    expect(pmDoneLine({ flagged: 6, throwaway: 6, real: 0, changed: 0, left: 0 }))
      .toBe("All junk — nothing real to change. Delete the throwaways and you're done.");
    expect(pmDoneLine({ flagged: 6, throwaway: 2, real: 4, changed: 4, left: 0 })).toBe("That's all 4 that matter. The junk's gone, the real ones are changed.");
  });

  it('switching to "No" hides the counts, the asks and the pacing line but keeps the numbers', () => {
    const on = act({ ...withPm, pmFlaggedCount: 20, pmChanged: 3, pmBurstAt: '2026-10-06T00:00:00.000Z' }, 'vault', 'flag', '2');
    const later = Date.parse('2026-10-06T08:00:00.000Z');
    expect(returnPacingLine(on, later)).not.toBeNull();
    const off = { ...on, passwordManager: 'none' };
    expect(pmNumbers(off)).toBeNull();
    expect(passwordProgressLines(off)).toEqual([]);
    expect(returnPacingLine(off, later)).toBeNull();
    expect(renderDistrict(off, 'master-keys', 'recon')).not.toContain('PASSWORD RESETS');
    expect(renderDistrict(off, 'vault')).not.toContain('pm-cat-');
    expect(off.pmFlaggedCount).toBe(20);
    expect(off.pmByDistrict.vault.flagged).toBe(2);
    expect(renderDistrict({ ...off, passwordManager: 'bitwarden' }, 'vault')).toContain('2 to change here.');
    expect(renderCityMap({ ...off, missions: { 'gmail-recon-breach': { status: 'completed', finding: 'no-breaches' } } }, view)).not.toContain('Welcome back. 17 still to change');
  });

  it('the explainer stays literally true and general', () => {
    const e = COLLECTIVE_DIALOGUE.explainer;
    expect(e).toContain('which missions you start and finish');
    expect(e).toContain('like what a breach check found or how an account is protected');
    expect(e).toContain('a car you add');
    expect(e).toContain('things like');
    expect(e).toContain('Never your passwords');
  });
});
