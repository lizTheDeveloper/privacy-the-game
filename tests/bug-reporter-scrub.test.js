// The bug reporter says where the player was by the same rule as pageviews and
// error reports (logic sweep #10): a building names an account and a re-check
// names a mission on one, so both stay on the device.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { currentScreen, reportBody } from '../src/components/bug-reporter.js';
import { sanitizeHref } from '../src/utils/pageview-url.js';

const SRC = readFileSync(new URL('../src/components/bug-reporter.js', import.meta.url), 'utf8');

describe('bug report page', () => {
  it('a building and a re-check are sent without the account or mission', () => {
    expect(reportBody('game_bug', 'the seal never lights', { hash: '#/building/chase' }).page).toBe('#/building');
    expect(reportBody('game_bug', 'the seal never lights', { hash: '#/mission/gmail-recon-breach/recheck' }).page).toBe('#/mission/recheck');
    expect(currentScreen('#/mission/custom_ab12cd/debrief')).toBe('#/mission/custom');
  });

  it('matches pageview-url.js for every kind of route', () => {
    for (const hash of ['#/', '#/city', '#/reclamation/map', '#/building/chase', '#/mission/gmail-recon-breach/briefing',
      '#/mission/gmail-recon-breach/recheck', '#/mission/custom_ab12cd/briefing', '#/leak/muscular', '#/government']) {
      expect(currentScreen(hash), hash).toBe(sanitizeHref(hash));
    }
  });

  it('still drops the query and caps the length', () => {
    expect(currentScreen('#/building/chase?from=x')).toBe('#/building');
    expect(currentScreen(`#/${'a'.repeat(300)}`)).toHaveLength(200);
  });

  it('the dialog shows the string it sends: both come from currentScreen()', () => {
    expect(SRC).toMatch(/\$\('\[data-bug-screen\]'\)\.textContent = currentScreen\(\);/);
    expect(SRC).toMatch(/page: currentScreen\(hash\)/);
  });
});
