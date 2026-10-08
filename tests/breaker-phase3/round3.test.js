// Breaker round 3 for recon Phase 3 (git diff 55af713..HEAD).
// Passing tests pin what held; the failing ones (each commented) describe
// behaviour the breaker believes is wrong.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../../src/data/missions.js';
import { createInitialState } from '../../src/state.js';
import { restoreEvents } from '../../src/utils/restore.js';
import { DISTRICT_DIALOGUE } from '../../src/data/dialogue.js';

const APP = readFileSync(new URL('../../src/app.js', import.meta.url), 'utf8');
const CITY_MAP = readFileSync(new URL('../../src/screens/city-map.js', import.meta.url), 'utf8');

function stepTexts() {
  const out = [];
  for (const m of MISSIONS) {
    const lists = [m.steps || [], ...Object.values(m.stepsByManager || {}), ...Object.values(m.reportSteps || {})];
    for (const st of lists.flat()) out.push([m.id, st.text || '']);
  }
  return out;
}
const ADDRESS = /\b(?:\d{1,3}(?:\.\d{1,3}){3}|(?:[a-z0-9-]+\.)+[a-z]{2,24})\b(?:\/[^\s"'“”),;]*)?/gi;

const T = (d) => `2026-10-0${d}T10:00:00.000Z`;
function save(records) {
  const s = createInitialState();
  const missions = {};
  for (const [id, r] of Object.entries(records)) missions[id] = r;
  return { ...s, missions };
}
const order = (s) => restoreEvents(s).filter((e) => e.name === 'mission-completed').map((e) => e.data.mission);

describe('the step-text scan\'s exemptions', () => {
  // FAILS. Believed wrong: the Android Private DNS step (browser_fingerprint-reclaim-dns,
  // src/data/missions-trail.js:347; the Grid's smart_network step uses the
  // correct one.one.one.one) tells
  // the player to type 'one.dot.one.dot.one.dot.one.cloudflare-dns.com'. That
  // name does not exist: the breaker's dig and nslookup against 9.9.9.9 and
  // 1.1.1.1 return nothing for it, while Cloudflare's published Private DNS
  // names, 1dot1dot1dot1.cloudflare-dns.com and one.one.one.one, resolve to
  // 1.1.1.1 / 1.0.0.1. Android's Private DNS in strict mode with a name that
  // does not resolve leaves the phone with no working internet. The scan
  // exempts every cloudflare-dns.com host as "a DNS name typed into settings",
  // so the one address a player must type exactly was never checked by anyone.
  it('a Cloudflare Private DNS hostname typed into settings is one Cloudflare publishes', () => {
    const published = new Set(['1dot1dot1dot1.cloudflare-dns.com', 'one.one.one.one', 'security.cloudflare-dns.com',
      'family.cloudflare-dns.com', '1dot1dot1dot2.cloudflare-dns.com', '1dot1dot1dot3.cloudflare-dns.com']);
    const bad = [];
    for (const [id, text] of stepTexts()) {
      for (const hit of text.match(/\b(?:[a-z0-9-]+\.)+cloudflare-dns\.com\b/gi) || []) {
        if (!published.has(hit.toLowerCase())) bad.push(`${id}: ${hit}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every other DNS name typed into settings is one the provider publishes (Quad9, one.one.one.one)', () => {
    const published = new Set(['dns.quad9.net', 'one.one.one.one', '1dot1dot1dot1.cloudflare-dns.com']);
    const bad = [];
    for (const [id, text] of stepTexts()) {
      // "set to 'name'" / "enter 'name'" are the typed-in forms.
      for (const m of text.matchAll(/(?:enter|set to) '([^']+)'(?: \(Cloudflare\))?(?: or '([^']+)')?/g)) {
        for (const name of [m[1], m[2]].filter(Boolean)) if (!published.has(name.toLowerCase()) && /\./.test(name)) bad.push(`${id}: ${name}`);
      }
    }
    // The Cloudflare one is the previous test's finding; list only the others.
    expect(bad.filter((b) => !/cloudflare-dns/.test(b))).toEqual([]);
  });

  it('no step text hides an address under an exempted extension (.app, .zip, .pdf ...)', () => {
    const bad = [];
    for (const [id, text] of stepTexts()) {
      for (const hit of text.match(ADDRESS) || []) {
        const host = hit.replace(/\/.*/, '').replace(/[.,;:]+$/, '').toLowerCase();
        if (/\.(js|json|png|jpg|jpeg|heic|pdf|zip|csv|txt|exe|app)$/.test(host)) bad.push(`${id}: ${hit}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('no step text names a subdomain of an exempted service (id.me, login.gov, quad9, the Slack placeholder)', () => {
    const bad = [];
    for (const [id, text] of stepTexts()) {
      for (const hit of text.match(ADDRESS) || []) {
        const host = hit.replace(/\/.*/, '').toLowerCase();
        if (/\.(login\.gov|id\.me|dns\.quad9\.net|your-workspace\.slack\.com)$/.test(host)) bad.push(`${id}: ${hit}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('only the two documented exempt service names appear bare, and with no path', () => {
    const seen = new Set();
    for (const [, text] of stepTexts()) {
      for (const hit of text.match(ADDRESS) || []) {
        const h = hit.toLowerCase();
        if (['login.gov', 'id.me'].some((n) => h.startsWith(n))) seen.add(h);
      }
    }
    expect([...seen].sort()).toEqual(['id.me', 'login.gov']);
  });
});

describe('restore order', () => {
  it('sends oldest first; no completedAt (skipped, not-needed) before any dated one', () => {
    const s = save({
      'google-recon-breach': { status: 'completed', finding: 'no-breaches', completedAt: T(5) },
      'gmail-fortify-password': { status: 'not-needed' },
      'gmail-recon-breach': { status: 'completed', finding: '3plus-breaches', completedAt: T(1) },
      'yahoo-recon-breach': { status: 'skipped', finding: 'skip' },
    });
    expect(order(s)).toEqual(['gmail-fortify-password', 'yahoo-recon-breach', 'gmail-recon-breach', 'google-recon-breach']);
  });

  it('equal times and missing times keep the save\'s own order (sort is stable)', () => {
    const s = save({
      'outlook-recon-breach': { status: 'completed', finding: 'no-breaches', completedAt: T(2) },
      'yahoo-recon-breach': { status: 'completed', finding: 'no-breaches', completedAt: T(2) },
      'protonmail-recon-breach': { status: 'skipped', finding: 'skip' },
      'icloud-recon-breach': { status: 'skipped', finding: 'skip' },
    });
    expect(order(s)).toEqual(['protonmail-recon-breach', 'icloud-recon-breach', 'outlook-recon-breach', 'yahoo-recon-breach']);
  });

  it('still resends all three statuses, skips reopened (status-less) and unknown records, and marks each restored', () => {
    const s = save({
      'gmail-fortify-password': { status: 'completed', completedAt: T(1) },
      'outlook-fortify-password': { status: 'not-needed' },
      'yahoo-fortify-password': { status: 'skipped' },
      'icloud-fortify-password': { reopened: ['pm'] },
      'no-such-mission': { status: 'completed', completedAt: T(1) },
    });
    const ev = restoreEvents(s).filter((e) => e.name === 'mission-completed');
    expect(ev.map((e) => e.data.status).sort()).toEqual(['completed', 'not-needed', 'skipped']);
    expect(ev.every((e) => e.data.restored === '1')).toBe(true);
  });

  it('a record with a missing or non-string completedAt does not throw', () => {
    const s = save({
      'gmail-fortify-password': { status: 'completed', completedAt: null },
      'yahoo-fortify-password': { status: 'completed', completedAt: 1759312800000 },
      'outlook-fortify-password': { status: 'completed' },
    });
    expect(() => restoreEvents(s)).not.toThrow();
    expect(order(s)).toHaveLength(3);
  });

  it('a legacy (replaced) recon record is resent like any other', () => {
    const legacy = MISSIONS.find((m) => m.replaces) || MISSIONS.find((m) => /-recon-breach$/.test(m.id) && !m.accountId);
    const id = (MISSIONS.find((m) => m.id === 'bank-recon-breach') || legacy).id;
    const ev = restoreEvents(save({ [id]: { status: 'completed', finding: 'no-breaches', completedAt: T(1) } }));
    expect(ev.filter((e) => e.name === 'mission-completed').map((e) => e.data.mission)).toEqual([id]);
  });

  // FAILS. Believed wrong: restoreEvents' comment promises "the collective
  // job's 'latest filing wins' matches the save", but app.js sends the events
  // in batches of 10 inside one synchronous loop (track() per event, fetches
  // in flight together, Umami stamping created_at on arrival), so inside a
  // batch the order is not kept: two events can arrive reversed or in the same
  // millisecond, and build.sql then breaks that tie by severity, not by the
  // save's times. Two pair checks whose later answer is the milder one (gmail
  // 3plus at T1, google clean at T2; an old save holds both) sit next to each
  // other here and are dispatched together, so the published answer can be the
  // wrong one. Events whose relative order decides the answer must not go in
  // the same concurrent batch.
  it('the two checks of an address pair are never dispatched in one concurrent batch', () => {
    const size = Number(/for \(let i = 0; i < events\.length; i \+= (\d+)\)/.exec(APP)?.[1]);
    expect(size).toBeGreaterThan(0);
    const s = save({
      'gmail-recon-breach': { status: 'completed', finding: '3plus-breaches', completedAt: T(1) },
      'google-recon-breach': { status: 'completed', finding: 'no-breaches', completedAt: T(2) },
    });
    const ev = restoreEvents(s);
    const at = (m) => ev.findIndex((e) => e.data?.mission === m);
    expect(Math.floor(at('gmail-recon-breach') / size)).not.toBe(Math.floor(at('google-recon-breach') / size));
  });
});

describe('the Capitol return line', () => {
  it('is never shown: only the Master Keys return lines are read, by the city map', () => {
    expect(/DISTRICT_DIALOGUE\['master-keys'\]/.test(CITY_MAP)).toBe(true);
    const users = [...CITY_MAP.matchAll(/DISTRICT_DIALOGUE\[([^\]]+)\]/g)].map((m) => m[1]);
    expect(users).toContain("'master-keys'");
    // Nothing reads .return off a per-district entry.
    expect(CITY_MAP.match(/\.return\b/g).length).toBe(4);
  });

  it('the lines that ARE shown (Master Keys) name no specific protection the player may not have set up', () => {
    const lines = Object.values(DISTRICT_DIALOGUE['master-keys'].return).join(' ');
    expect(lines).not.toMatch(/\b(locked|encrypted|secured|frozen|claimed|2FA|PIN|password)\b/i);
  });

  it('the Capitol line itself still makes no claim about what the player did', () => {
    const r = DISTRICT_DIALOGUE.capitol.return;
    expect(r.long).not.toMatch(/IRS|SSA|lock is|still active/);
    expect(r.medium).not.toMatch(/secured/);
  });
});
