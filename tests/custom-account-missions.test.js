import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state.js';
import { customMissionsFor, findMission, findCustomMission, cleanCustomName, isCustomMission, customAccountsIn } from '../src/data/custom-missions.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { fileDebrief } from '../src/utils/debrief.js';
import { calcDistrictProgress } from '../src/utils/calc.js';
import { pageviewUrl, errorContext } from '../src/utils/pageview-url.js';
import { isPrivateBreadcrumb } from '../src/utils/errorNoise.js';
import { parseRoute } from '../src/router.js';
import { MISSIONS } from '../src/data/missions.js';
import { currentScreen } from '../src/components/bug-reporter.js';

const withCustom = (district, names) => ({ ...createInitialState(), customAccounts: { [district]: names } });

describe('custom accounts get their own missions (feature map row 16)', () => {
  it('each added account gets a sign-in check, a password, a second step and recovery', () => {
    const ms = customMissionsFor(withCustom('square', ['Old forum']), 'square');
    expect(ms.map((m) => m.phase)).toEqual(['recon', 'fortify', 'fortify', 'reclaim']);
    for (const m of ms) {
      expect(m.title).toContain('Old forum');
      expect(m.custom && m.optional).toBe(true);
      expect(m.debriefQs.length).toBeGreaterThan(0);
      // The game knows nothing about the service: no links, so no invented pages.
      expect(m.steps.every((s) => !s.url)).toBe(true);
    }
  });

  it('ids carry a hash of the name, never the name, and stay the same for the same name', () => {
    const a = customMissionsFor(withCustom('vault', ['My Credit Union']), 'vault');
    const b = customMissionsFor(withCustom('vault', ['other', 'my credit union']), 'vault').slice(4);
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
    for (const m of a) {
      expect(m.id).not.toMatch(/credit|union/i);
      expect(isCustomMission(m.id)).toBe(true);
    }
  });

  it('never looks like one of the game’s own missions (no -fortify-password suffix, no clash)', () => {
    const own = new Set(MISSIONS.map((m) => m.id));
    for (const m of customMissionsFor(withCustom('master-keys', ['A', 'B']), 'master-keys')) {
      expect(m.id.endsWith('-fortify-password') || m.id.endsWith('-fortify-2fa')).toBe(false);
      expect(own.has(m.id)).toBe(false);
    }
  });

  it('a name loses markup characters and duplicates count once', () => {
    expect(cleanCustomName('  <b>Old</b>   "forum" & co  ')).toBe('bOld/b forum  co'.replace(/\s+/g, ' '));
    expect(customAccountsIn(withCustom('square', ['Old forum', 'old FORUM', '  ']), 'square')).toHaveLength(1);
  });

  it('shows on the district under each phase, labelled as not counting toward progress', () => {
    const s = withCustom('square', ['Old forum']);
    const recon = renderDistrict(s, 'square', 'recon');
    expect(recon).toContain('ACCOUNTS YOU ADDED');
    expect(recon).toContain('Sign-in check: Old forum');
    expect(recon).toContain('don’t count toward the district’s progress');
    expect(renderDistrict(s, 'square', 'fortify')).toContain('Second step: Old forum');
    expect(renderDistrict(s, 'square', 'reclaim')).toContain('Recovery: Old forum');
    expect(renderDistrict(s, 'square', 'survey')).toContain('Each account you add gets its own missions');
  });

  it('briefing and debrief open for a custom mission, and filing it is a real completion', () => {
    const s = withCustom('archives', ['Old NAS']);
    const m = customMissionsFor(s, 'archives')[0];
    expect(findMission(s, m.id)).toEqual(m);
    expect(findCustomMission(s, m.id)).toEqual(m);
    expect(renderBriefing(s, m.id)).toContain('Old NAS');
    const filed = fileDebrief(s, m, { finding: 'no-breaches' });
    expect(filed.state.missions[m.id].status).toBe('completed');
    expect(renderDebrief(filed.state, m.id)).toContain('Old NAS');
  });

  it('never changes a district’s progress, so a finished district stays finished', () => {
    const before = calcDistrictProgress(createInitialState(), 'square');
    const s = withCustom('square', ['Old forum', 'Another']);
    expect(calcDistrictProgress(s, 'square')).toEqual(before);
    const m = customMissionsFor(s, 'square')[0];
    const filed = fileDebrief(s, m, { finding: 'no-breaches' }).state;
    expect(calcDistrictProgress(filed, 'square')).toEqual(before);
  });

  it('a removed account’s missions are gone; its records stay in the save', () => {
    const s = withCustom('square', ['Old forum']);
    const m = customMissionsFor(s, 'square')[0];
    const filed = fileDebrief(s, m, { finding: 'no-breaches' }).state;
    const removed = { ...filed, customAccounts: { square: [] } };
    expect(findMission(removed, m.id)).toBeUndefined();
    expect(removed.missions[m.id].status).toBe('completed');
  });

  it('a second step the service doesn’t offer can be filed as such', () => {
    const s = withCustom('foundry', ['Some AI tool']);
    const twofa = customMissionsFor(s, 'foundry').find((m) => m.id.endsWith('_twofa'));
    const filed = fileDebrief(s, twofa, { method: 'none', method_setup: 'not-offered' });
    expect(filed.state.missions[twofa.id].status).toBe('completed');
  });
});

describe('custom accounts stay in this browser', () => {
  it('their mission screens go out as #/mission/custom, with no params in error reports', () => {
    const s = withCustom('square', ['Old forum']);
    const id = customMissionsFor(s, 'square')[0].id;
    for (const screen of ['briefing', 'debrief', 'recheck']) {
      const href = `https://play.multiversegames.ai/reclaim-city/#/mission/${id}/${screen}`;
      const route = parseRoute(`#/mission/${id}/${screen}`);
      expect(pageviewUrl(route, href)).toBe('https://play.multiversegames.ai/reclaim-city/#/mission/custom');
      expect(errorContext(route).params).toBeUndefined();
    }
    // The game's own missions still go out as they are.
    const own = parseRoute('#/mission/gmail-fortify-2fa/briefing');
    expect(pageviewUrl(own, 'x#/mission/gmail-fortify-2fa/briefing')).toBe('x#/mission/gmail-fortify-2fa/briefing');
  });

  it('a bug report from one of their screens names no mission', () => {
    expect(currentScreen('#/mission/custom_square_1a2b_signin/briefing')).toBe('#/mission/custom');
    expect(currentScreen('#/mission/gmail-fortify-2fa/briefing')).toBe('#/mission/gmail-fortify-2fa/briefing');
  });

  it('their rows and the add box are dropped from breadcrumbs', () => {
    expect(isPrivateBreadcrumb({ category: 'ui.click', message: 'div.panel.custom-account > span' })).toBe(true);
    expect(isPrivateBreadcrumb({ category: 'ui.input', message: 'input#custom-account-input' })).toBe(true);
  });

  // "app.js sends no event for them" is driven for real (start, step, GO DO IT, filing) in
  // tests/app/local-only-actions.test.js.
});
