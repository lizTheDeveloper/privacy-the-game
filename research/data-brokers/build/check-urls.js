// Opt-out URL checker: GETs every http(s) optOut.url and records whether it still lands on the same page.
// CLI: node check-urls.js [--only=<status>] [--force]   (writes optOut.status and optOut.verifiedAt; never deletes a URL)
// It first checks that this machine is online (a preflight), and writes nothing when more than
// MAX_DEAD_RATE of the URLs come back dead (an offline or DNS-broken run looks exactly like that)
// unless --force is given.
const MULTI = new Set(['co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.jp', 'co.nz', 'co.za', 'com.br', 'com.mx', 'co.in', 'com.cn']);

// Small eTLD+1 helper: enough for this dataset, not the full Public Suffix List.
export function registrableDomain(url) {
  const host = new URL(url).hostname.toLowerCase().replace(/\.$/, '');
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  const tail2 = parts.slice(-2).join('.');
  return parts.slice(MULTI.has(tail2) ? -3 : -2).join('.');
}

// Local calendar date as YYYY-MM-DD (not UTC).
export function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const isRoot = (url) => { const p = new URL(url).pathname; return p === '' || p === '/'; };

// A name that does not exist. EAI_AGAIN is a temporary lookup failure (offline, a flaky
// resolver): that is "could not verify", never proof the domain is gone.
const DNS_ERRORS = new Set(['ENOTFOUND']);

/** Above this share of dead results the run is not trusted and nothing is written (without --force). */
export const MAX_DEAD_RATE = 0.2;
/** Well-known pages the preflight loads: if none of them does, this machine can't check anything. */
export const PREFLIGHT_URLS = Object.freeze(['https://web.archive.org/', 'https://www.iana.org/', 'https://www.wikipedia.org/']);

// 'blocked' means "could not verify" (bot walls, rate limits, transient or network trouble), not "page is gone".
export function classifyResponse({ requestedUrl, finalUrl, status, error }) {
  if (!finalUrl || status == null) return DNS_ERRORS.has(error) ? 'dead' : 'blocked';
  if (status === 404 || status === 410) return 'dead';
  if (status >= 400) return 'blocked';
  if (isRoot(finalUrl) && !isRoot(requestedUrl)) return 'suspect';
  if (registrableDomain(finalUrl) !== registrableDomain(requestedUrl)) return 'suspect';
  return 'verified';
}

// --only=<status> filter. A record with an opt-out but no status has never been checked, so it counts as 'unchecked'.
export function matchesOnly(b, only) {
  if (!only) return true;
  if (!b?.optOut) return false;
  return (b.optOut.status ?? 'unchecked') === only;
}

/** Online when at least one preflight page answers at all (any HTTP status). */
export async function preflight(fetchOne, urls = PREFLIGHT_URLS) {
  const results = await Promise.all(urls.map((u) => fetchOne(u)));
  const ok = results.some((r) => r.finalUrl && r.status != null);
  return { ok, results };
}

/** Whether a finished run may be written: refused when the dead share is implausibly high. */
export function writeDecision(counts, { force = false, maxDeadRate = MAX_DEAD_RATE } = {}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const deadRate = total ? counts.dead / total : 0;
  if (deadRate > maxDeadRate && !force) {
    return { write: false, deadRate, reason: `${counts.dead} of ${total} came back dead (${(deadRate * 100).toFixed(0)}%, over ${maxDeadRate * 100}%). That looks like a network problem, not dead brokers: nothing written. Re-run with --force to write anyway.` };
  }
  return { write: true, deadRate, reason: null };
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function fetchOnce(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    res.body?.cancel().catch(() => {});
    return { requestedUrl: url, finalUrl: res.url, status: res.status };
  } catch (e) {
    return { requestedUrl: url, finalUrl: null, status: null, error: e.cause?.code ?? e.name };
  }
}

// One retry (after a short delay) on network errors, 429 and 5xx.
async function check(url) {
  const first = await fetchOnce(url);
  if (first.finalUrl && first.status !== 429 && first.status < 500) return first;
  await new Promise((r) => setTimeout(r, 2000));
  return fetchOnce(url);
}

/**
 * Check every job, then write: nothing is written until the whole run is known to be plausible
 * (writeDecision). jobs: [{ f, b }] (file name, broker record). Returns the counts and what was written.
 */
export async function checkAndWrite({ jobs, checkUrl, writeRecord, today, force = false, concurrency = 8 }) {
  const counts = { verified: 0, suspect: 0, blocked: 0, dead: 0 };
  const bad = [];
  const results = [];
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      const r = await checkUrl(job.b.optOut.url);
      const status = classifyResponse(r);
      counts[status]++;
      if (status !== 'verified') bad.push({ id: job.b.id, status, url: job.b.optOut.url, final: r.finalUrl ?? r.error, code: r.status });
      results.push({ ...job, status });
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const decision = writeDecision(counts, { force });
  let written = 0;
  if (decision.write) {
    for (const { f, b, status } of results) {
      if (b.optOut.status === status && b.optOut.verifiedAt === today) continue;
      b.optOut.status = status;
      b.optOut.verifiedAt = today;
      await writeRecord(f, b);
      written++;
    }
  }
  return { counts, bad, written, decision };
}

async function main() {
  const { readFile, writeFile, readdir } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join, resolve } = await import('node:path');
  const dir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'brokers');
  const today = localDate();
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
  const force = process.argv.includes('--force');
  const online = await preflight(fetchOnce);
  if (!online.ok) {
    console.error(`preflight failed: none of ${PREFLIGHT_URLS.join(', ')} answered (${online.results.map((r) => r.error ?? r.status).join(', ')}). Offline? Nothing checked, nothing written.`);
    process.exitCode = 1;
    return;
  }
  const jobs = [];
  for (const f of files) {
    const b = JSON.parse(await readFile(join(dir, f), 'utf8'));
    if (!matchesOnly(b, only)) continue;
    if (b.optOut?.url && /^https?:\/\//i.test(b.optOut.url)) jobs.push({ f, b });
  }
  const { counts, bad, written, decision } = await checkAndWrite({
    jobs, checkUrl: check, today, force,
    writeRecord: (f, b) => writeFile(join(dir, f), `${JSON.stringify(b, null, 2)}\n`),
  });
  console.table(bad.sort((x, y) => x.status.localeCompare(y.status) || x.id.localeCompare(y.id)));
  if (!decision.write) {
    console.error(decision.reason);
    process.exitCode = 1;
  }
  console.log(`checked ${jobs.length}: verified ${counts.verified}, suspect ${counts.suspect}, blocked ${counts.blocked}, dead ${counts.dead}; ${written} files written`);
}

const { fileURLToPath: f2p } = await import('node:url');
if (process.argv[1] && f2p(import.meta.url) === (await import('node:path')).resolve(process.argv[1])) await main();
