// The per-category password ask is local only: the real app.js click handler,
// driven with every way out of the device watched, never sends the flagged or
// changed counts anywhere (analytics.js is NOT mocked here, so any route to
// Umami, fetch or sendBeacon shows up in egress()).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { bootApp } from '../helpers/app-harness.mjs';
import { createInitialState, updateMission } from '../../src/state.js';
import { MISSIONS } from '../../src/data/missions.js';
import { isCoreMission } from '../../src/utils/calc.js';

// Each test boots the whole app fresh (vi.resetModules, then app.js and its ~150 modules):
// about 0.1s alone, past 1s in a loaded full run. The default 5s left too little headroom.
vi.setConfig({ testTimeout: 30000 });
afterEach(() => vi.unstubAllGlobals());

function savedGame() {
  let s = { ...createInitialState(), passwordManager: 'bitwarden' };
  // Some filed missions, so the save has real progress next to the counts.
  const core = MISSIONS.filter((m) => isCoreMission(m) && s.accounts[m.accountId]?.enabled).slice(0, 5);
  for (const m of core) s = updateMission(s, m.id, { status: 'completed', completedAt: '2026-10-01T00:00:00.000Z' });
  return s;
}

// The counts a player types, as they could appear in a payload.
const LEAKS = /pmByDistrict|flagged|changed|"7"|"3"|\b7\b|pm-cat|pm_cat|category/i;

describe('pm-cat-* clicks through the real app.js handler', () => {
  it('change the save and send nothing', async () => {
    const h = await bootApp({ state: savedGame(), hash: '#/district/vault' });
    h.clearEgress();
    h.setQuery('#pm-cat-num-vault', { value: '7' });
    await h.click('pm-cat-flag', { district: 'vault' });
    expect(h.state().pmByDistrict.vault).toMatchObject({ flagged: 7, changed: 0 });

    h.setQuery('#pm-cat-num-vault', { value: '3' });
    await h.click('pm-cat-changed', { district: 'vault' });
    expect(h.state().pmByDistrict.vault).toMatchObject({ flagged: 7, changed: 3 });

    await h.click('pm-cat-clear', { district: 'vault' });
    expect(h.state().pmByDistrict.vault.clear).toBe(true);
    await h.click('pm-cat-reopen', { district: 'vault' });
    expect(h.state().pmByDistrict.vault.clear).toBe(false);
    await h.click('pm-cat-none', { district: 'square' });
    expect(h.state().pmByDistrict.square.clear).toBe(true);

    const sent = h.egress();
    for (const row of sent) expect(JSON.stringify(row), row[0]).not.toMatch(LEAKS);
    expect(sent).toEqual([]);
  });

  it('a bad number shows the message and sends nothing', async () => {
    const h = await bootApp({ state: savedGame(), hash: '#/district/vault' });
    h.clearEgress();
    h.setQuery('#pm-cat-num-vault', { value: 'lots' });
    const msg = h.setQuery('[data-pm-cat-msg="vault"]', {});
    await h.click('pm-cat-flag', { district: 'vault' });
    expect(msg.hidden).toBe(false);
    expect(h.state().pmByDistrict?.vault).toBeUndefined();
    expect(h.egress()).toEqual([]);
  });

  it('the harness does see a send (control)', async () => {
    const h = await bootApp({ state: savedGame(), hash: '#/district/vault' });
    h.clearEgress();
    // toggle-account is tracked: if this stopped showing up, the test above would prove nothing.
    await h.click('toggle-account', { account: Object.keys(savedGame().accounts)[0] });
    expect(h.egress().some(([ch, name]) => ch === 'umami.track' && name === 'account-toggled')).toBe(true);
  });
});
