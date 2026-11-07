import { describe, it, expect } from 'vitest';
import { classifyResponse, localDate, matchesOnly, registrableDomain, preflight, writeDecision, checkAndWrite, MAX_DEAD_RATE } from '../../research/data-brokers/build/check-urls.js';

const c = (requestedUrl, finalUrl, status, error) => classifyResponse({ requestedUrl, finalUrl, status, error });

describe('classifyResponse', () => {
  it('404 is dead', () => {
    expect(c('https://a.com/optout', 'https://a.com/optout', 404)).toBe('dead');
  });
  it('410 is dead', () => {
    expect(c('https://a.com/optout', 'https://a.com/optout', 410)).toBe('dead');
  });
  it('403 is blocked', () => {
    expect(c('https://a.com/optout', 'https://a.com/optout', 403)).toBe('blocked');
  });
  it('429 is blocked', () => {
    expect(c('https://a.com/optout', 'https://a.com/optout', 429)).toBe('blocked');
  });
  it('500 is blocked', () => {
    expect(c('https://a.com/optout', 'https://a.com/optout', 500)).toBe('blocked');
  });
  it('DNS failure is dead', () => {
    expect(c('https://a.com/optout', null, null, 'ENOTFOUND')).toBe('dead');
  });
  it('a temporary DNS failure (EAI_AGAIN, as when offline) is blocked, not dead', () => {
    expect(c('https://a.com/optout', null, null, 'EAI_AGAIN')).toBe('blocked');
  });
  it('timeout is blocked', () => {
    expect(c('https://a.com/optout', null, null, 'TimeoutError')).toBe('blocked');
  });
  it('redirect to root is suspect', () => {
    expect(c('https://a.com/privacy/optout', 'https://a.com/', 200)).toBe('suspect');
  });
  it('cross-domain redirect is suspect', () => {
    expect(c('https://a.com/optout', 'https://other.org/optout', 200)).toBe('suspect');
  });
  it('same-path 200 is verified', () => {
    expect(c('https://a.com/optout', 'https://a.com/optout', 200)).toBe('verified');
  });
  it('www vs apex is same domain', () => {
    expect(c('https://a.com/optout', 'https://www.a.com/optout', 200)).toBe('verified');
  });
  it('a requested root stays verified at root', () => {
    expect(c('https://a.com/', 'https://a.com/', 200)).toBe('verified');
  });
});

describe('registrableDomain', () => {
  it('strips www and subdomains', () => {
    expect(registrableDomain('https://www.a.com/x')).toBe('a.com');
    expect(registrableDomain('https://privacy.shop.a.com')).toBe('a.com');
  });
  it('handles multi-part suffixes', () => {
    expect(registrableDomain('https://www.foo.co.uk/')).toBe('foo.co.uk');
    expect(registrableDomain('https://x.foo.com.au/')).toBe('foo.com.au');
    expect(registrableDomain('https://foo.co.jp/')).toBe('foo.co.jp');
  });
});

describe('localDate', () => {
  it('uses local calendar fields, zero-padded', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDate(new Date(2026, 9, 18, 0, 1))).toBe('2026-10-18');
  });
});

describe('matchesOnly', () => {
  const b = (optOut) => ({ id: 'x', optOut });
  it('no filter matches everything', () => expect(matchesOnly(b(null), undefined)).toBe(true));
  it('--only=unchecked matches a literal unchecked and a missing status', () => {
    expect(matchesOnly(b({ method: 'web-form', url: 'https://a.com/o', status: 'unchecked' }), 'unchecked')).toBe(true);
    expect(matchesOnly(b({ method: 'web-form', url: 'https://a.com/o' }), 'unchecked')).toBe(true);
    expect(matchesOnly(b({ method: 'web-form', url: 'https://a.com/o', status: 'verified' }), 'unchecked')).toBe(false);
  });
  it('other filters match only that status', () => {
    expect(matchesOnly(b({ method: 'web-form', url: 'https://a.com/o', status: 'blocked' }), 'blocked')).toBe(true);
    expect(matchesOnly(b({ method: 'web-form', url: 'https://a.com/o' }), 'blocked')).toBe(false);
  });
  it('a record with no opt-out never matches a filter', () => expect(matchesOnly(b(null), 'unchecked')).toBe(false));
});

describe('an offline or broken run never writes (V3)', () => {
  it('preflight: online when any known page answers, offline when none does', async () => {
    const down = async (u) => ({ requestedUrl: u, finalUrl: null, status: null, error: 'ENOTFOUND' });
    expect((await preflight(down)).ok).toBe(false);
    const oneUp = async (u) => (u.includes('iana') ? { requestedUrl: u, finalUrl: u, status: 403 } : down(u));
    expect((await preflight(oneUp)).ok).toBe(true);
  });

  it(`refuses to write when more than ${MAX_DEAD_RATE * 100}% come back dead, unless --force`, () => {
    // The whole dataset offline: every lookup fails.
    expect(writeDecision({ verified: 0, suspect: 0, blocked: 0, dead: 743 })).toMatchObject({ write: false, deadRate: 1 });
    expect(writeDecision({ verified: 0, suspect: 0, blocked: 0, dead: 743 }, { force: true }).write).toBe(true);
    expect(writeDecision({ verified: 79, suspect: 0, blocked: 0, dead: 21 }).write).toBe(false);
    // The real dataset's last run: 20 dead of 742 checked.
    expect(writeDecision({ verified: 632, suspect: 15, blocked: 75, dead: 20 }).write).toBe(true);
    expect(writeDecision({ verified: 80, suspect: 0, blocked: 0, dead: 20 }).write).toBe(true);
    expect(writeDecision({ verified: 0, suspect: 0, blocked: 0, dead: 0 }).write).toBe(true);
  });

  it('a run where every lookup fails writes nothing; --force writes; a healthy run writes', async () => {
    const jobs = () => Array.from({ length: 10 }, (_, i) => ({ f: `b${i}.json`, b: { id: `b${i}`, optOut: { method: 'web-form', url: `https://b${i}.example/opt-out`, status: 'verified', verifiedAt: '2026-10-01' } } }));
    const offline = async (url) => ({ requestedUrl: url, finalUrl: null, status: null, error: 'ENOTFOUND' });
    const writes = [];
    const writeRecord = async (f, b) => { writes.push([f, b.optOut.status]); };
    let r = await checkAndWrite({ jobs: jobs(), checkUrl: offline, writeRecord, today: '2026-11-06' });
    expect(r.counts.dead).toBe(10);
    expect(r.decision.write).toBe(false);
    expect(writes).toEqual([]);
    r = await checkAndWrite({ jobs: jobs(), checkUrl: offline, writeRecord, today: '2026-11-06', force: true });
    expect(writes).toHaveLength(10);
    writes.length = 0;
    const healthy = async (url) => (url.includes('b9') ? offline(url) : { requestedUrl: url, finalUrl: url, status: 200 });
    r = await checkAndWrite({ jobs: jobs(), checkUrl: healthy, writeRecord, today: '2026-11-06' });
    expect(r.counts).toEqual({ verified: 9, suspect: 0, blocked: 0, dead: 1 });
    expect(writes).toHaveLength(10); // every verifiedAt moves to today
    expect(writes.find(([f]) => f === 'b9.json')[1]).toBe('dead');
  });
});
