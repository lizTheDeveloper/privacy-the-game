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

// Security review (2026-11-20): password-manager answers change only what the player sees. A
// playthrough (filing the missions that finish a district, its milestone, SAVE on the passwords,
// restore, going ghost) sends exactly the same events, pageviews and navigations with 0 flagged
// passwords as with 2. Only the Secured % on screen differs.
describe('flagged passwords never change what is tracked', () => {
  const BANKS = ['primary_bank', 'credit_card'];
  const firstOption = (q) => q.options.find((o) => o.severity !== 'skip' && !['skip', 'later'].includes(o.value)).value;

  async function vaultState(leave, flagged) {
    const { toggleAccount } = await import('../../src/state.js');
    const { getMissionsForDistrict } = await import('../../src/data/missions.js');
    const { isMissionInPlay } = await import('../../src/utils/mission-status.js');
    const { applyCategoryAction } = await import('../../src/utils/pm-categories.js');
    let s = createInitialState();
    for (const id of Object.keys(s.accounts)) s = toggleAccount(s, id, false);
    for (const a of BANKS) s = toggleAccount(s, a, true);
    s = { ...s, passwordManager: 'bitwarden' };
    for (let i = 0; i < 2; i += 1) {
      for (const m of getMissionsForDistrict('vault').filter((x) => x.phase !== 'survey' && x.id !== leave && isMissionInPlay(s, x))) {
        s = updateMission(s, m.id, { status: 'completed', completedAt: '2026-10-01T00:00:00.000Z', method: 'authenticator' });
      }
    }
    return flagged ? applyCategoryAction(s, 'vault', 'flag', String(flagged)) : s;
  }

  // Everything observable from outside the device: each umami.track call (events by name and
  // data; pageviews by the url and title they send), fetch, sendBeacon, and every arrival (what a
  // Sentry navigation breadcrumb would record). The ghost nonce is random per run.
  function observed(h, arrivals) {
    const rows = h.egress().map(([ch, a, b]) => {
      if (ch !== 'umami.track') return [ch, a, b];
      if (typeof a === 'function') return ['pageview', a({})];
      return ['event', a, b && { ...b, nonce: b.nonce ? 'N' : undefined }];
    });
    return JSON.parse(JSON.stringify({ rows, arrivals }));
  }

  async function playthrough(flagged) {
    const { MISSIONS: ALL } = await import('../../src/data/missions.js');
    const last = ALL.find((m) => m.id === 'credit_card-fortify-alerts') ?? ALL.find((m) => m.id.startsWith('credit_card-fortify'));
    const h = await bootApp({ state: await vaultState(last.id, flagged), hash: `#/mission/${last.id}/debrief` });
    const sentryCalls = [];
    vi.stubGlobal('Sentry', { init() {}, close() {}, addBreadcrumb: (b) => sentryCalls.push(b), captureException: (e) => sentryCalls.push(String(e)) });
    const arrivals = [];
    const go = async (hash) => { if (hash) h.location.hash = hash; arrivals.push(h.location.hash); await h.arrive(); };
    h.clearEgress();
    const shown = {};

    // Filing the last mission: district-completed, then the milestone.
    for (const q of last.debriefQs) {
      if (q.type === 'number') h.setQuery(`input[type="number"][name="q_${q.id}"]`, { value: '1' });
      else h.setQueryAll(`input[name="q_${q.id}"]:checked`, [{ value: firstOption(q) }]);
    }
    await h.click('submit-debrief', { mission: last.id });
    await go();
    shown.milestone = h.app.innerHTML;
    // Back to the district: SAVE the passwords (with none flagged, the same click finds nothing).
    await go('#/district/vault');
    const { calcDistrictSecured } = await import('../../src/utils/calc.js');
    shown.before = calcDistrictSecured(h.state(), 'vault').percent;
    h.setQuery('#pm-cat-num-vault', { value: '2' });
    await h.click('pm-cat-changed', { district: 'vault' });
    arrivals.push(h.location.hash);
    await go('#/city');
    // Restore: the events it would resend.
    const { restoreEvents } = await import('../../src/utils/restore.js');
    const restored = restoreEvents(h.state());
    // Going ghost (early: the city isn't complete in either run).
    const { isCityComplete } = await import('../../src/utils/ghost.js');
    const cityComplete = isCityComplete(h.state());
    await go('#/ghost/early');
    await h.click(cityComplete ? 'go-ghost' : 'go-ghost-early');
    await go();
    return { out: observed(h, arrivals), restored, cityComplete, sentryCalls, shown };
  }

  it('0 flagged and 2 flagged: identical events, pageviews, arrivals, restore and ghost', async () => {
    const none = await playthrough(0);
    const two = await playthrough(2);
    expect(none.out.rows.some((r) => r[0] === 'event' && r[1] === 'district-completed')).toBe(true);
    expect(none.out.rows.some((r) => r[0] === 'pageview' && r[1].title === 'milestone')).toBe(true);
    expect(none.out.arrivals[0]).toBe('#/milestone/vault');
    expect(none.out.rows.some((r) => r[0] === 'event' && r[1] === 'went-ghost-early')).toBe(true);
    expect(none.restored.length).toBeGreaterThan(0);
    expect(two.out).toEqual(none.out);
    expect(two.restored).toEqual(none.restored);
    expect(two.cityComplete).toBe(none.cityComplete);
    expect(two.sentryCalls).toEqual(none.sentryCalls);
    // What is shown does differ: the milestone and the district say the passwords are left.
    expect(none.shown.milestone).toContain('LIBERATED');
    expect(two.shown.milestone).toContain('MISSIONS DONE');
    expect(two.shown.milestone).toContain('2 passwords still to change.');
    expect(two.shown.milestone).not.toContain('LIBERATED');
    expect(none.shown.before).toBe(100);
    expect(two.shown.before).toBeLessThan(100);
  });

  it('a whole city: went-ghost either way (isCityComplete never reads the flags)', async () => {
    const { isCityComplete } = await import('../../src/utils/ghost.js');
    const { applyCategoryAction } = await import('../../src/utils/pm-categories.js');
    const { DISTRICTS } = await import('../../src/data/districts.js');
    const { getMissionsForDistrict } = await import('../../src/data/missions.js');
    const { isMissionInPlay } = await import('../../src/utils/mission-status.js');
    let s = { ...createInitialState(), passwordManager: 'bitwarden' };
    // Every mission in play, a few passes (filing some puts others in play).
    for (let i = 0; i < 4; i += 1) {
      for (const d of DISTRICTS) for (const m of getMissionsForDistrict(d.id)) if (m.phase !== 'survey' && isMissionInPlay(s, m)) s = updateMission(s, m.id, { status: 'completed', method: 'authenticator' });
    }
    let f = s;
    for (const d of DISTRICTS) f = applyCategoryAction(f, d.id, 'flag', '2');
    expect(isCityComplete(s)).toBe(true);
    expect(isCityComplete(f)).toBe(true);
    const runs = [];
    for (const st of [s, f]) {
      const h = await bootApp({ state: st, hash: '#/ghost' });
      h.clearEgress();
      await h.click(isCityComplete(st) ? 'go-ghost' : 'go-ghost-early');
      runs.push(observed(h, [h.location.hash]));
    }
    expect(runs[0].rows.some((r) => r[1] === 'went-ghost')).toBe(true);
    expect(runs[1]).toEqual(runs[0]);
  });

  it('changing the last flagged password: a celebration here, no event, no pageview, no navigation', async () => {
    const h = await bootApp({ state: { ...(await vaultState(null, 2)), seenMilestones: { vault: true } }, hash: '#/district/vault' });
    const panel = h.setQuery('[data-pm-category="vault"]', { loose: true });
    panel.prepend = vi.fn();
    h.clearEgress();
    h.setQuery('#pm-cat-num-vault', { value: '2' });
    await h.click('pm-cat-changed', { district: 'vault' });
    expect(h.location.hash).toBe('#/district/vault');
    expect(h.egress()).toEqual([]);
    expect(panel.prepend).toHaveBeenCalledTimes(1);
    expect(panel.prepend.mock.calls[0][0].textContent).toBe('All changed ✓');
  });
});
