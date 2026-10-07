import { describe, it, expect } from 'vitest';
import { createInitialState, updateMission, saveState, loadState } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import {
  neededResets, resetCounts, passwordProgressLines, currentBurst, startBurst, ensureBurst, burstScout,
  isHeldBack, pmNumbers, applyBurst, pmBurstBriefingLine, returnPacingLine, PM_BURST_ID,
} from '../src/utils/bursts.js';
import { fileDebrief, missionEventData, missionSteps, visibleQuestions } from '../src/utils/debrief.js';
import { isMissionInPlay, isMissionDone } from '../src/utils/mission-status.js';
import { calcDistrictProgress } from '../src/utils/calc.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { restoreEvents } from '../src/utils/restore.js';

const set = (s, id, rec) => updateMission(s, id, rec);
const byId = (id) => MISSIONS.find((m) => m.id === id);
const s0 = createInitialState();
const leaked = (s, acct) => set(s, `${acct}-recon-breach`, { status: 'completed', finding: '1-2-breaches', password_exposed: 'yes' });
const PM_REPORT = byId('password_manager-recon-report');
const BURST = byId(PM_BURST_ID);
const view = { collective: { status: 'idle' }, whoami: { status: 'idle' } };

function allReconDone(s) {
  for (const m of MISSIONS) {
    if (m.phase === 'recon' && !m.optional && !m.unlock && s.accounts[m.accountId]?.enabled && !s.missions[m.id]) {
      s = set(s, m.id, { status: 'completed', finding: 'no-breaches' });
    }
  }
  return s;
}

describe('10a: counts across sources (no manager number)', () => {
  it('counts breach, password-manager and login reasons; Master Keys first', () => {
    // Recon Phase 2: a bank's old "breach check" re-checked the email and is
    // ignored; the bank's own password-manager verdict is the evidence now.
    let s = set(s0, 'primary_bank-recon-password', { status: 'completed', pw_status: 'pw-leaked' });
    s = leaked(s, 'yahoo');
    s = set(s, 'gmail-recon-login', { status: 'completed', finding: '1-2-breaches' });
    s = { ...s, pmFlagged: ['outlook'] };
    expect(neededResets(s).map((m) => m.accountId)).toEqual(['gmail', 'outlook', 'yahoo', 'primary_bank']);
    expect(resetCounts(s)).toMatchObject({ total: 4, done: 0, left: 4, source: 'mixed' });
    expect(passwordProgressLines(s)).toEqual(['4 passwords need changing. 4 to change.', '0 of 4 changed']);
  });

  it('says "flagged by your password manager" when that is the only source', () => {
    const s = { ...s0, pmFlagged: ['gmail', 'yahoo'] };
    expect(passwordProgressLines(s)[0]).toBe('Your password manager flagged 2 passwords. 2 to change.');
  });

  it('progress and all-done', () => {
    let s = leaked(leaked(s0, 'gmail'), 'yahoo');
    s = set(s, 'gmail-fortify-password', { status: 'completed', action: 'reset-password' });
    expect(passwordProgressLines(s)[1]).toBe('1 of 2 changed');
    s = set(s, 'yahoo-fortify-password', { status: 'completed', action: 'reset-password' });
    expect(passwordProgressLines(s)).toEqual(['All 2 changed.']);
  });

  it('nothing to say when nothing is needed', () => {
    expect(passwordProgressLines(s0)).toEqual([]);
  });
});

describe('10b: game-account bursts of three', () => {
  const five = () => ['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail'].reduce(leaked, s0);

  it('a burst is the first three in district order and is saved', () => {
    const s = ensureBurst(five(), '2026-10-06T10:00:00.000Z');
    expect(s.passwordBurst).toEqual({
      ids: ['gmail-fortify-password', 'outlook-fortify-password', 'icloud-fortify-password'],
      startedAt: '2026-10-06T10:00:00.000Z',
    });
    expect(ensureBurst(s, 'later')).toBe(s);   // an active burst is kept
  });

  it('survives a reload', () => {
    const store = new Map();
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
    const s = ensureBurst(five(), '2026-10-06T10:00:00.000Z');
    saveState(s, storage);
    expect(loadState(storage).passwordBurst).toEqual(s.passwordBurst);
    expect(currentBurst(loadState(storage))).toEqual(currentBurst(s));
  });

  it('Scout: start, count down, burst done, next burst, all done', () => {
    let s = ensureBurst(five());
    expect(burstScout(s)).toEqual({ text: "5 to change. Let's do 3 now — one at a time, and I'll keep count." });
    s = set(s, 'gmail-fortify-password', { status: 'completed', action: 'reset-password' });
    expect(burstScout(s)).toEqual({ text: '2 left in this burst.' });
    s = set(s, 'outlook-fortify-password', { status: 'completed', action: 'reset-password' });
    s = set(s, 'icloud-fortify-password', { status: 'completed', action: 'reset-password' });
    expect(currentBurst(s)).toEqual([]);
    expect(ensureBurst(s)).toBe(s);            // the next burst waits for the player
    expect(burstScout(s)).toEqual({
      text: "That's a burst. 2 still to change — take a breather, or line up the next 2.",
      button: 'LINE UP THE NEXT 2',
    });
    s = startBurst(s);
    expect(currentBurst(s)).toEqual(['yahoo-fortify-password', 'protonmail-fortify-password']);
    s = set(s, 'yahoo-fortify-password', { status: 'completed', action: 'reset-password' });
    s = set(s, 'protonmail-fortify-password', { status: 'completed', action: 'reset-password' });
    expect(burstScout(s)).toEqual({ text: "That's all 5. Every password that needed changing is changed." });
  });

  it('next mission prefers the burst and holds back other needed resets', () => {
    // Everything core done except the five resets.
    let s = five();
    for (const m of MISSIONS) {
      if (!m.optional && !m.unlock && m.phase !== 'survey' && s.accounts[m.accountId]?.enabled
        && !m.id.endsWith('-fortify-password') && !s.missions[m.id]) s = set(s, m.id, { status: 'completed' });
    }
    for (const m of MISSIONS) {
      if (m.id.endsWith('-fortify-password') && !['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail'].includes(m.accountId)) {
        s = set(s, m.id, { status: 'completed' });
      }
    }
    s = ensureBurst(s);
    expect(isHeldBack(s, byId('yahoo-fortify-password'))).toBe(true);
    expect(isHeldBack(s, byId('gmail-fortify-password'))).toBe(false);
    expect(renderCityMap(s, view)).toContain('#/mission/gmail-fortify-password/briefing');
    for (const id of ['gmail', 'outlook', 'icloud']) s = set(s, `${id}-fortify-password`, { status: 'completed' });
    const html = renderCityMap(s, view);
    expect(html).not.toContain('#/mission/yahoo-fortify-password/briefing');
    expect(html).not.toContain('#/mission/protonmail-fortify-password/briefing');
    // Still listed in the district.
    expect(renderDistrict(s, 'master-keys', 'fortify')).toContain('#/mission/yahoo-fortify-password/briefing');
  });

  it('the district header shows the count, Scout and the line-up button', () => {
    let s = ensureBurst(five());
    for (const id of ['gmail', 'outlook', 'icloud']) s = set(s, `${id}-fortify-password`, { status: 'completed' });
    const html = renderDistrict(s, 'master-keys', 'fortify');
    expect(html).toContain('3 of 5 changed');
    expect(html).toContain("That's a burst. 2 still to change");
    expect(html).toContain('data-action="line-up-burst"');
    expect(html).toContain('LINE UP THE NEXT 2');
  });
});

describe('11a and 12a: the report asks how many (local only)', () => {
  const withPm = { ...s0, passwordManager: 'bitwarden' };

  it('asks the number first, then throwaways, then the accounts here', () => {
    expect(PM_REPORT.debriefQs.map((q) => q.id)).toEqual(['flagged_count', 'throwaway_count', 'flagged']);
    expect(PM_REPORT.debriefQs[0].label).toBe('How many passwords did it flag?');
    expect(visibleQuestions(PM_REPORT, { flagged_count: 'skip' }).map((q) => q.id)).toEqual(['flagged_count']);
    expect(visibleQuestions(PM_REPORT, { flagged_count: '78' }).map((q) => q.id)).toEqual(['flagged_count', 'throwaway_count', 'flagged']);
  });

  it('stores the numbers; throwaways capped at the flagged count; pmChanged starts at 0', () => {
    const r = fileDebrief(withPm, PM_REPORT, { flagged_count: '78', throwaway_count: '90', flagged: ['gmail'] });
    expect(r.state.pmFlaggedCount).toBe(78);
    expect(r.state.pmThrowaway).toBe(78);
    expect(r.state.pmChanged).toBe(0);
    const r2 = fileDebrief(withPm, PM_REPORT, { flagged_count: '78', throwaway_count: '30', flagged: ['none'] });
    expect(pmNumbers(r2.state)).toMatchObject({ flagged: 78, throwaway: 30, real: 48, changed: 0, left: 48 });
  });

  it('rejects numbers out of range', () => {
    expect(fileDebrief(withPm, PM_REPORT, { flagged_count: '10000', throwaway_count: '0', flagged: ['none'] })).toBeNull();
    expect(fileDebrief(withPm, PM_REPORT, { flagged_count: 'lots', throwaway_count: '0', flagged: ['none'] })).toBeNull();
  });

  it('no event carries any count', () => {
    const r = fileDebrief(withPm, PM_REPORT, { flagged_count: '78', throwaway_count: '30', flagged: ['gmail'] });
    const data = missionEventData(PM_REPORT, r.state.missions[PM_REPORT.id]);
    expect(data).toEqual({ mission: PM_REPORT.id, district: 'master-keys', phase: 'recon', status: 'completed' });
    for (const e of restoreEvents(r.state)) {
      expect(JSON.stringify(e.data)).not.toMatch(/78|30|flagged_count|throwaway|pmChanged/);
    }
  });

  it('the throwaway question carries Scout’s line', () => {
    const html = renderDebrief(withPm, PM_REPORT.id);
    expect(html).toContain('Throwaways don’t need a new password — they need to go.');
    expect(html).toMatch(/type="number" name="q_flagged_count"/);
  });
});

describe('11b and 12c: Change the next 3', () => {
  const counted = (flagged, throwaway = 0, changed = 0) =>
    ({ ...s0, passwordManager: '1password', pmFlaggedCount: flagged, pmThrowaway: throwaway, pmChanged: changed });

  it('exists only with a manager and passwords left to change', () => {
    expect(isMissionInPlay(s0, BURST)).toBe(false);
    expect(isMissionInPlay({ ...counted(5), passwordManager: 'none' }, BURST)).toBe(false);
    expect(isMissionInPlay(counted(5), BURST)).toBe(true);
    expect(isMissionInPlay(counted(5, 5), BURST)).toBe(false);
    expect(isMissionInPlay(counted(0), BURST)).toBe(false);
  });

  it('re-opens after each burst and is done when all real ones are changed', () => {
    let r = fileDebrief(counted(5), BURST, { changed: '3', junk: 'no' });
    expect(r.event).toBeNull();               // 14b: one event, when the whole job is done
    expect(r.state.pmChanged).toBe(3);
    expect(isMissionDone(r.state.missions[BURST.id])).toBe(false);
    expect(isMissionInPlay(r.state, BURST)).toBe(true);
    r = fileDebrief(r.state, BURST, { changed: 'more', changed_more: '9', junk: 'no' });
    expect(r.state.pmChanged).toBe(5);       // capped
    expect(isMissionDone(r.state.missions[BURST.id])).toBe(true);
    expect(r.event).toEqual({ status: 'completed' });
  });

  it('junk raises throwaways, not changes, and alone sends nothing', () => {
    const r = fileDebrief(counted(10), BURST, { changed: '0', junk: 'yes', junk_count: '4' });
    expect(r.state.pmThrowaway).toBe(4);
    expect(r.state.pmChanged).toBe(0);
    expect(r.event).toBeNull();
    const both = fileDebrief(counted(10), BURST, { changed: '1', junk: 'yes', junk_count: '2' });
    expect(both.event).toBeNull();            // 14b: not done yet, so nothing sent
    const last = fileDebrief(counted(3), BURST, { changed: '1', junk: 'yes', junk_count: '2' });
    expect(last.event).toEqual({ status: 'completed' });
  });

  it('caps: changed + throwaway never exceed flagged', () => {
    expect(applyBurst(pmNumbers(counted(10, 2, 5)), 9, 9)).toEqual({ pmThrowaway: 5, pmChanged: 5 });
    expect(pmNumbers(counted(10, 50, 50))).toMatchObject({ flagged: 10, throwaway: 10, real: 0, changed: 0, left: 0 });
  });

  it('"not now" is a skip and changes nothing', () => {
    const r = fileDebrief(counted(10), BURST, { changed: 'later' });
    expect(r.state.pmChanged).toBe(0);
    expect(r.event).toEqual({ status: 'skipped' });
  });

  it('briefing lines', () => {
    expect(pmBurstBriefingLine(counted(78, 30))).toBe('48 is a lot. Nobody does that in one sitting. Three at a time, and the scary ones first.');
    expect(pmBurstBriefingLine(counted(7))).toBe("7 to change. Let's do three now.");
    expect(pmBurstBriefingLine(counted(7, 0, 7))).toBe("That's all 7. Every password your manager flagged is changed.");
    expect(pmBurstBriefingLine(counted(7, 2, 5))).toBe("That's all 5 that matter. The junk's gone, the real ones are changed.");
    expect(renderBriefing(counted(78, 30), BURST.id)).toContain('48 is a lot.');
  });

  it('steps: the manager’s report, flagged accounts here first, then the order', () => {
    const s = { ...counted(10), pmFlagged: ['gmail'] };
    const text = missionSteps(BURST, s).map((st) => st.text).join(' | ');
    expect(text).toMatch(/Watchtower/);
    expect(text).toMatch(/Start with the ones that are in the city too: Gmail/);
    expect(text).toMatch(/1\) email accounts, 2\) bank, payment and money apps, 3\) anything you use to sign in to other things \(Apple, Google, Microsoft or Facebook logins\), 4\) shopping with saved cards, 5\) social, 6\) the rest/);
    expect(text).toMatch(/compromised or leaked passwords before reused ones, and reused before weak/);
  });

  it('a bonus since 14b: never adds to the Master Keys core total while pending', () => {
    expect(calcDistrictProgress(counted(5), 'master-keys').total).toBe(calcDistrictProgress({ ...counted(5), pmFlaggedCount: undefined }, 'master-keys').total);
    expect(calcDistrictProgress(counted(5), 'master-keys').bonusTotal).toBe(calcDistrictProgress({ ...counted(5), pmFlaggedCount: undefined }, 'master-keys').bonusTotal + 1);
  });
});

describe('11c and 12a: counts follow the manager’s number', () => {
  it('manager lines, with throwaways and game accounts', () => {
    const s = { ...s0, passwordManager: '1password', pmFlaggedCount: 78, pmThrowaway: 0, pmChanged: 6 };
    expect(passwordProgressLines(s)).toEqual(['Your password manager flagged 78 passwords. 72 to change.', '6 of 78 changed']);
    const t = { ...s, pmThrowaway: 30, pmFlagged: ['gmail'] };
    expect(passwordProgressLines(t)).toEqual([
      '78 flagged, 30 throwaways — 48 that matter.',
      '6 of 48 changed, and 1 account here needs a new password',
    ]);
  });

  it('shown on the report, the burst mission and the Master Keys header', () => {
    let s = { ...s0, passwordManager: '1password', pmFlaggedCount: 12, pmThrowaway: 2, pmChanged: 3 };
    s = set(s, PM_REPORT.id, { status: 'completed', action: 'none-flagged', flagged: ['none'], flagged_count: 12, throwaway_count: 2 });
    expect(renderDebrief(s, PM_REPORT.id)).toContain('3 of 10 changed');
    expect(renderBriefing(s, PM_REPORT.id)).toContain('3 of 10 changed');
    expect(renderBriefing(s, BURST.id)).toContain('3 of 10 changed');
    expect(renderDistrict(s, 'master-keys', 'recon')).toContain('3 of 10 changed');
  });

  it('with a manager number there are no game-account bursts', () => {
    const s = { ...leaked(s0, 'gmail'), passwordManager: '1password', pmFlaggedCount: 10 };
    expect(currentBurst(s)).toEqual([]);
    expect(burstScout(s)).toBeNull();
    expect(ensureBurst(s)).toBe(s);
  });
});

describe('11e: return pacing', () => {
  const s = { ...s0, passwordManager: '1password', pmFlaggedCount: 20, pmChanged: 3, pmBurstAt: '2026-10-06T00:00:00.000Z' };
  const at = (h) => Date.parse('2026-10-06T00:00:00.000Z') + h * 3600000;

  it('only after six hours with more to change', () => {
    expect(returnPacingLine(s, at(5))).toBeNull();
    expect(returnPacingLine(s, at(7))).toBe('Welcome back. 17 still to change — want to do the next three?');
    expect(returnPacingLine({ ...s, pmChanged: 20 }, at(7))).toBeNull();
  });

  it('the city map offers the next burst', () => {
    const html = renderCityMap({ ...s, missions: { 'gmail-recon-breach': { status: 'completed', finding: 'no-breaches' } } }, view);
    expect(html).toContain('Welcome back. 17 still to change — want to do the next three?');
    expect(html).toContain(`#/mission/${PM_BURST_ID}/briefing`);
  });
});

describe('after switching the manager answer to No', () => {
  it('stops crediting the password manager in the reset counts', async () => {
    const { resetCounts } = await import('../src/utils/bursts.js');
    const { ACCOUNTS } = await import('../src/data/accounts.js');
    const state = {
      accounts: { gmail: { enabled: true } },
      missions: {},
      pmFlagged: ['gmail'],
      passwordManager: 'bitwarden',
    };
    expect(ACCOUNTS.gmail).toBeTruthy();
    expect(resetCounts(state).source).toBe('pm');
    expect(resetCounts({ ...state, passwordManager: 'none' }).source).toBe('mixed');
  });
});
