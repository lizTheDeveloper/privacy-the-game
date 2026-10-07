// Recon campaign, phase 3: every step URL in the game was checked live
// (tests/fixtures/verified-urls.json, with the date and how). A new or changed
// link fails here until someone checks it and adds it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../src/data/missions.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/verified-urls.json', import.meta.url), 'utf8'));

function stepUrls() {
  const out = new Map();
  for (const m of MISSIONS) {
    const lists = [m.steps || [], ...Object.values(m.stepsByManager || {}), ...Object.values(m.reportSteps || {})];
    for (const list of lists) {
      for (const s of list) {
        if (!s.url) continue;
        if (!out.has(s.url)) out.set(s.url, []);
        out.get(s.url).push(m.id);
      }
    }
  }
  return out;
}

describe('verified step URLs', () => {
  it('the allowlist says when it was checked, and how each URL answered', () => {
    expect(fixture.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const [url, how] of Object.entries(fixture.urls)) expect(typeof how === 'string' && how.length > 0, url).toBe(true);
  });

  it('every step URL in MISSIONS (legacy missions too) is in the allowlist', () => {
    const unverified = [...stepUrls()].filter(([url]) => !Object.hasOwn(fixture.urls, url)).map(([url, ids]) => `${url} (${ids[0]})`);
    expect(unverified).toEqual([]);
  });

  it('no step uses a link the audit or the live check found dead or wrong', () => {
    const dead = [
      'ksupport.kiausa.com', 'fsgroupprivacy.com', 'tesla.com/support/contact', '/draft/', 'privacynotincluded',
      'myadcenter.google.com/personalization', 'plaid.com/legal/data-protection-request', '2023169-betterhelp-inc"',
      'fitbit.com/settings', 'connect.garmin.com/modern', 'chat.openai.com', 'icloud.com/settings/"',
      'equifax.com/personal/help/workforce-solutions-contact', 'legalsolutions.thomsonreuters.com', 'nuwber.com', 'clustrmaps.com',
      'merlindata.com', 'tracersinfo.com', 'xmode.io', 'gravyanalytics.com', 'data.com/consumer-access', 'oracle.com/legal',
      'photos.google.com/map', 'strava.com/athlete/heatmap', 'allyourbases', 'ya_manage_login_and_security', 'advancedpeoplesearch',
    ];
    const urls = [...stepUrls().keys()].map((u) => `${u}"`);
    for (const d of dead) expect(urls.filter((u) => u.includes(d)), d).toEqual([]);
  });
});
