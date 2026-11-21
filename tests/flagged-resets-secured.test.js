// Q1 (Liz 2026-11-20: "Yes"): a district can't read 100% SECURED while passwords its password
// manager flagged are still unchanged. 100% means nothing left to do. Display only (security
// review, 2026-11-20): calcDistrictSecured is what's shown; calcDistrictProgress, which every
// event, pageview and navigation reads, never sees these numbers.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
import { calcDistrictProgress as missionProgress, calcDistrictSecured as calcDistrictProgress, flaggedResets } from '../src/utils/calc.js';
import { getMissionsForDistrict } from '../src/data/missions.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';
import { applyCategoryAction } from '../src/utils/pm-categories.js';

const BANKS = ['primary_bank', 'credit_card'];

// The Vault with two accounts and every mission in play filed.
function vaultDone() {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = toggleAccount(s, id, false);
  for (const a of BANKS) s = toggleAccount(s, a, true);
  for (const m of getMissionsForDistrict('vault').filter((x) => x.phase !== 'survey' && isMissionInPlay(s, x))) {
    s = updateMission(s, m.id, { status: 'completed' });
  }
  return { ...s, passwordManager: 'bitwarden' };
}

describe('flagged passwords keep a district under 100%', () => {
  it('no flags: exactly as before', () => {
    const s = vaultDone();
    const p = calcDistrictProgress(s, 'vault');
    expect(p.percent).toBe(100);
    expect(p.completed).toBe(p.total);
    expect(p.resets).toEqual({ flagged: 0, changed: 0, left: 0 });
    // And without a manager the stored numbers count for nothing, as the panel hides them.
    const none = { ...applyCategoryAction(s, 'vault', 'flag', '2'), passwordManager: 'none' };
    expect(calcDistrictProgress(none, 'vault')).toMatchObject({ percent: 100, total: p.total });
  });

  it('2 flagged here and 0 changed: below 100%, one more thing to do', () => {
    const base = calcDistrictProgress(vaultDone(), 'vault');
    const s = applyCategoryAction(vaultDone(), 'vault', 'flag', '2');
    const p = calcDistrictProgress(s, 'vault');
    expect(p.percent).toBeLessThan(100);
    expect(p.total).toBe(base.total + 1);
    expect(p.completed).toBe(base.completed);
    expect(p.resets).toEqual({ flagged: 2, changed: 0, left: 2 });
  });

  it('it fills as they are changed, and never rounds up to 100 with one left', () => {
    let s = applyCategoryAction(vaultDone(), 'vault', 'flag', '200');
    s = applyCategoryAction(s, 'vault', 'changed', '199');
    expect(calcDistrictProgress(s, 'vault').percent).toBe(99);
    s = applyCategoryAction(vaultDone(), 'vault', 'flag', '2');
    const none = calcDistrictProgress(s, 'vault').percent;
    s = applyCategoryAction(s, 'vault', 'changed', '1');
    expect(calcDistrictProgress(s, 'vault').percent).toBeGreaterThan(none);
  });

  it('all changed: 100%', () => {
    let s = applyCategoryAction(vaultDone(), 'vault', 'flag', '2');
    s = applyCategoryAction(s, 'vault', 'changed', '2');
    const p = calcDistrictProgress(s, 'vault');
    expect(p.percent).toBe(100);
    expect(p.completed).toBe(p.total);
  });

  it('"That’s all from here" with some left still leaves them to do', () => {
    let s = applyCategoryAction(vaultDone(), 'vault', 'flag', '2');
    s = applyCategoryAction(s, 'vault', 'clear');
    expect(calcDistrictProgress(s, 'vault').percent).toBeLessThan(100);
  });

  it('a flagged account’s own reset is a mission row: counted once, not again', () => {
    let s = createInitialState();
    for (const a of BANKS) s = toggleAccount(s, a, true);
    const before = calcDistrictProgress({ ...s, passwordManager: 'bitwarden' }, 'vault');
    // The report flagged 2, both of them these two accounts: their rows carry them.
    s = { ...s, passwordManager: 'bitwarden', pmFlagged: [...BANKS], pmFlaggedCount: 2, pmThrowaway: 0 };
    expect(calcDistrictProgress(s, 'vault').total).toBe(before.total);
    expect(flaggedResets(s, 'master-keys')).toEqual({ flagged: 0, changed: 0, left: 0 });
  });

  it('the report’s count beyond the city’s accounts keeps The Master Keys open until changed', () => {
    let s = { ...createInitialState(), passwordManager: 'bitwarden', pmFlagged: ['gmail'], pmFlaggedCount: 5, pmThrowaway: 1 };
    s = toggleAccount(s, 'gmail', true);
    // 5 flagged, 1 throwaway, 1 is Gmail's own row: 3 more to change.
    expect(flaggedResets(s, 'master-keys')).toMatchObject({ flagged: 3, left: 3 });
    // Two flagged from the Vault's ask are part of the same report: they count there, not here too.
    const v = applyCategoryAction(s, 'vault', 'flag', '2');
    expect(flaggedResets(v, 'master-keys')).toMatchObject({ flagged: 1, left: 1 });
    expect(flaggedResets(v, 'vault')).toMatchObject({ flagged: 2, left: 2 });
    // Changed through "Change the next 3": nothing left.
    expect(flaggedResets({ ...s, pmChanged: 3 }, 'master-keys')).toEqual({ flagged: 0, changed: 0, left: 0 });
  });

  it('mission progress never sees them: same total, completed and percent with or without flags', () => {
    for (const [flag, changed] of [['2', null], ['2', '1'], ['2', '2'], ['200', '199']]) {
      let s = applyCategoryAction(vaultDone(), 'vault', 'flag', flag);
      if (changed) s = applyCategoryAction(s, 'vault', 'changed', changed);
      expect(missionProgress(s, 'vault')).toEqual(missionProgress(vaultDone(), 'vault'));
    }
    const m = { ...createInitialState(), passwordManager: 'bitwarden', pmFlaggedCount: 9, pmThrowaway: 0 };
    // (The report's count does put "Change the next 3" in play, a bonus, as it has since 14b.)
    const core = ({ total, completed, percent }) => ({ total, completed, percent });
    expect(core(missionProgress(m, 'master-keys'))).toEqual(core(missionProgress({ ...m, pmFlaggedCount: undefined }, 'master-keys')));
  });

  it('a pm-cat SAVE never navigates, tracks or opens the milestone', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    const block = app.slice(app.indexOf("action.startsWith('pm-cat-')"), app.indexOf("action === 'district-opt-in'"));
    expect(block).not.toMatch(/navigate\(|#\/milestone|seenProgress|\btrack\w*\(|capture\w*\(/);
    expect(block).toContain('celebrateAllChanged(districtId)');
  });
});
