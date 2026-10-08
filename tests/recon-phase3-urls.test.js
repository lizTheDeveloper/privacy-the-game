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

  // Breaker phase 3 (rounds 1 and 2): an address written in the step text is
  // a link too: any host with any TLD, with or without a path, and an IP
  // address with a path. Exempt, because they aren't places to go: service
  // names (login.gov, id.me), the player's own placeholder workspace, DNS
  // server names and bare IPs typed into a settings box, and router
  // addresses on the player's own network (an IP with no path).
  const NOT_A_PLACE = new Set(['login.gov', 'id.me', 'your-workspace.slack.com',
    // Setting names that look like hosts: LG's "Who.Where.What?" menu and a Firefox about:config pref.
    'who.where.what', 'privacy.resistfingerprinting']);
  // Typed into settings, not visited: each one checked to resolve or answer
  // (breaker phase 3 round 3: a wrong Private DNS name kills a phone's internet).
  const DNS = fixture.dns;
  const ADDRESS = /\b(?:\d{1,3}(?:\.\d{1,3}){3}|(?:[a-z0-9-]+\.)+[a-z]{2,24})\b(?:\/[^\s"'“”),;]*)?/gi;
  it('every address written inside step text is in the allowlist', () => {
    const known = Object.keys(fixture.urls).map((u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase());
    const hosts = known.map((k) => k.replace(/\/.*/, ''));
    const bad = [];
    for (const m of MISSIONS) {
      const lists = [m.steps || [], ...Object.values(m.stepsByManager || {}), ...Object.values(m.reportSteps || {})];
      for (const st of lists.flat()) {
        for (const hit of (st.text || '').match(ADDRESS) || []) {
          const h = hit.replace(/[.,;:]+$/, '').replace(/\/$/, '').toLowerCase();
          const host = h.replace(/\/.*/, '');
          if (NOT_A_PLACE.has(host)) continue;
          if (!h.includes('/') && Object.hasOwn(DNS.hostnames, host)) continue;
          if (/^\d+(\.\d+){3}$/.test(host) && !h.includes('/')) {
            if (!Object.hasOwn(DNS.resolvers, host) && !Object.hasOwn(DNS.routerDefaults, host)) bad.push(`${m.id}: ${hit} (an IP nobody checked)`);
            continue;
          }
          // Not a web address: file names and the like.
          if (/\.(js|json|png|jpg|jpeg|heic|pdf|zip|csv|txt|exe|app)$/.test(host)) continue;
          const ok = known.some((k) => k === h || k.endsWith(`/${h}`) || k.endsWith(`.${h}`))
            || (!h.includes('/') && hosts.some((kh) => kh === host || kh.endsWith(`.${host}`)));
          if (!ok) bad.push(`${m.id}: ${hit}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('every typed DNS name and server IP was checked, with the date', () => {
    expect(DNS.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(DNS.hostnames).sort()).toEqual(['dns.quad9.net', 'one.one.one.one']);
    // The name Cloudflare doesn't publish (it doesn't resolve) is never typed.
    const all = MISSIONS.flatMap((m) => (m.steps || []).map((st) => st.text)).join(' ');
    expect(all).not.toMatch(/one\.dot\.one/);
    for (const name of all.match(/\b[a-z0-9.-]+\.cloudflare-dns\.com\b/gi) || []) expect(Object.hasOwn(DNS.hostnames, name.toLowerCase()), name).toBe(true);
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
