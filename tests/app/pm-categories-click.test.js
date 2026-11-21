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

// Security review (2026-11-20): the milestone a pm-cat SAVE finishes must not send a pageview
// either. Arriving at #/milestone/<district> right after SAVE says the password answer as surely
// as district-completed would. A milestone reached by filing a mission keeps both.
describe('the milestone a password SAVE finishes is quiet', () => {
  const BANKS = ['primary_bank', 'credit_card'];
  const pageviews = (h) => h.egress().filter(([ch, arg]) => ch === 'umami.track' && typeof arg === 'function');
  const events = (h) => h.egress().filter(([ch, arg]) => ch === 'umami.track' && typeof arg === 'string').map((c) => c[1]);

  // The Vault with only these two accounts, every mission in play filed except `leave`.
  async function vaultState(leave = null) {
    const { toggleAccount } = await import('../../src/state.js');
    const { getMissionsForDistrict } = await import('../../src/data/missions.js');
    const { isMissionInPlay } = await import('../../src/utils/mission-status.js');
    let s = createInitialState();
    for (const id of Object.keys(s.accounts)) s = toggleAccount(s, id, false);
    for (const a of BANKS) s = toggleAccount(s, a, true);
    s = { ...s, passwordManager: 'bitwarden' };
    for (let i = 0; i < 2; i += 1) {
      for (const m of getMissionsForDistrict('vault').filter((x) => x.phase !== 'survey' && x.id !== leave && isMissionInPlay(s, x))) {
        s = updateMission(s, m.id, { status: 'completed', completedAt: '2026-10-01T00:00:00.000Z', method: 'authenticator' });
      }
    }
    return s;
  }

  it('SAVE that changes the last flagged passwords: milestone shown, no pageview, no event', async () => {
    const { applyCategoryAction } = await import('../../src/utils/pm-categories.js');
    const s = applyCategoryAction(await vaultState(), 'vault', 'flag', '2');
    const h = await bootApp({ state: s, hash: '#/district/vault' });
    h.clearEgress();
    h.setQuery('#pm-cat-num-vault', { value: '2' });
    await h.click('pm-cat-changed', { district: 'vault' });
    expect(h.location.hash).toBe('#/milestone/vault');
    await h.arrive();
    expect(h.app.innerHTML.length).toBeGreaterThan(0);
    expect(h.state().seenProgress.vault).toContain(100);
    expect(h.egress()).toEqual([]);

    // Quiet once: the next arrival anywhere (even the same milestone again) is an ordinary pageview.
    h.location.hash = '#/city';
    await h.arrive();
    expect(pageviews(h)).toHaveLength(1);
    h.location.hash = '#/milestone/vault';
    await h.arrive();
    expect(pageviews(h)).toHaveLength(2);
  });

  it('control: filing the last mission still sends district-completed and the milestone pageview', async () => {
    const { MISSIONS: ALL } = await import('../../src/data/missions.js');
    const last = ALL.find((m) => m.id === 'credit_card-fortify-alerts') ?? ALL.find((m) => m.id.startsWith('credit_card-fortify'));
    const h = await bootApp({ state: await vaultState(last.id), hash: `#/mission/${last.id}/debrief` });
    h.clearEgress();
    for (const q of last.debriefQs) {
      if (q.type === 'number') h.setQuery(`input[type="number"][name="q_${q.id}"]`, { value: '1' });
      else h.setQueryAll(`input[name="q_${q.id}"]:checked`, [{ value: q.options.find((o) => o.severity !== 'skip' && !['skip', 'later'].includes(o.value)).value }]);
    }
    await h.click('submit-debrief', { mission: last.id });
    expect(events(h)).toContain('district-completed');
    expect(h.location.hash).toBe('#/milestone/vault');
    await h.arrive();
    expect(pageviews(h)).toHaveLength(1);
  });
});

describe('an error report after the quiet milestone does not say it either', () => {
  it('page URL and navigation breadcrumbs to it are scrubbed; ordinary ones are kept', async () => {
    const { markQuietHash, scrubEventUrls } = await import('../../src/utils/pageview-url.js');
    markQuietHash('#/milestone/vault');
    const event = scrubEventUrls({
      request: { url: 'https://play.example/reclaim-city/#/milestone/vault' },
      breadcrumbs: [
        { category: 'navigation', data: { from: '/reclaim-city/#/district/vault', to: '/reclaim-city/#/milestone/vault' } },
        { category: 'navigation', data: { from: '/reclaim-city/#/milestone/vault', to: '/reclaim-city/#/city' } },
        { category: 'navigation', data: { from: '/reclaim-city/#/city', to: '/reclaim-city/#/milestone/square' } },
      ],
    });
    expect(JSON.stringify(event)).not.toContain('milestone/vault');
    expect(event.request.url).toBe('https://play.example/reclaim-city/#/quiet');
    expect(event.breadcrumbs).toHaveLength(1);
    expect(event.breadcrumbs[0].data.to).toBe('/reclaim-city/#/milestone/square');
  });
});
