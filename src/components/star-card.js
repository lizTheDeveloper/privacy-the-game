// The card a tapped star opens: who the company is, what its records say it sells, the links we
// documented, and what the player can do. Pure: (map, lighting, id, state) in, markup out.
//
// Every opt-out link is one the dataset's checker marked `verified`; every other external link is
// a source's archived (Wayback) copy or a complaint form from tests/fixtures/verified-urls.json.
// External links open in a new tab with no referrer. No broker id or name goes in an id, name or
// title attribute (Sentry selectors carry those); the card's class `star-card` is in PRIVATE_UI.
import { shortName } from '../utils/broker-view.js';
import { MISSIONS } from '../data/missions.js';
import { tickable, litElsewhere } from '../utils/big-check.js';
import { smallScout } from './scout.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ext = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export const COMPLAINT_FORMS = Object.freeze([
  { url: 'https://cppa.ca.gov/webapplications/complaint', label: 'California Privacy Protection Agency' },
  { url: 'https://reportfraud.ftc.gov/', label: 'FTC' },
]);

const OPT_OUT_TEXT = 'OPT OUT ↗';
const THEIR_SITE_TEXT = 'THEIR SITE ↗';

// An http(s) URL, or null.
function parseUrl(url) {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

// A site's front page, not an opt-out page. A root URL on a subdomain made for privacy requests
// (optout.bigdbm.com, preferences.bombora.com) is the opt-out itself.
const OPT_OUT_HOST = /^(optout|opt-out|privacy|preferences|datasubject|consumerprivacy|ccparequest|dsar|form|requests?)\./i;
export const isBareHomepage = (u) => (u.pathname === '' || u.pathname === '/') && !u.search && !u.hash && !OPT_OUT_HOST.test(u.hostname);

// The opt-out (and their-site) hrefs a card shows (for the tests' "only verified" check).
export function optOutHrefs(html) {
  return [...String(html).matchAll(/<a href="([^"]*)"[^>]*>(?:OPT OUT|THEIR SITE) ↗<\/a>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
}

// Each link touching `id`, worded from this star's side.
const SIDE = {
  owns: ['Owns', 'Owned by'],
  supplies: ['Supplies', 'Supplied by'],
  buys: ['Buys from', 'Sells to'],
};

const SOURCE_KIND = {
  journalism: 'reporting',
  'privacy-policy': 'privacy page',
  'sec-10k': 'SEC 10-K',
  'sec-8k': 'SEC 8-K',
  'sec-20f': 'SEC 20-F',
  other: 'other',
  procurement: 'government contract',
  'annual-report': 'annual report',
  'ftc-order': 'FTC order',
  'ftc-complaint': 'FTC complaint',
  'cfpb-order': 'CFPB order',
  'press-release': 'press release',
  court: 'court record',
};

function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

const archivedLinks = (sources) => (Array.isArray(sources) ? sources : [])
  .filter((s) => isObj(s) && typeof s.archived === 'string' && s.archived.startsWith('https://web.archive.org/'))
  .map((s) => ext(s.archived, 'archived ↗'));

export function optOutBlock(b) {
  const o = b.optOut;
  if (!isObj(o)) return `<p>We don't know an opt-out route for this one yet.</p>`;
  if (o.method === 'none') {
    const forms = COMPLAINT_FORMS.map((f) => `<li>${ext(f.url, `${esc(f.label)} ↗`)}</li>`).join('');
    return `<p class="star-card-none">No opt-out exists.</p><p>What you can do instead: file a complaint, so it's on the record.</p><ul class="star-card-list">${forms}</ul>`;
  }
  if (o.status === 'verified') {
    // The checker vouched for this address (controller ruling M7): always a link, never "couldn't
    // confirm". A bare homepage is their site, not an opt-out page; an http:// link says so.
    const u = parseUrl(o.url);
    const email = typeof o.email === 'string' && o.email ? `<p>Or email ${esc(o.email)}</p>` : '';
    if (u) {
      const bare = isBareHomepage(u);
      const insecure = u.protocol === 'http:' ? `<p class="star-card-note">Their page isn't on a secure (https) link.</p>` : '';
      if (bare) {
        return `<p class="star-card-go">${ext(o.url, THEIR_SITE_TEXT)}</p><p class="star-card-note">We haven't found a direct opt-out page. Look for "Do Not Sell" or "Privacy" on their site.</p>${insecure}${email}`;
      }
      return `<p class="star-card-go">${ext(o.url, OPT_OUT_TEXT)}</p>${insecure}${email}`;
    }
    if (email) return `<p>Opt out by email: ${esc(o.email)}</p>`;
    return `<p>We don't know an opt-out route for this one yet.</p>`;
  }
  const day = typeof o.verifiedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.verifiedAt) ? o.verifiedAt : null;
  return day
    ? `<p>We couldn't confirm their opt-out page when we last checked (${day}).</p>`
    : `<p>We couldn't confirm their opt-out page.</p>`;
}

// California's legal options, for the two cases with no opt-out page to send the player to: no
// opt-out exists, or we only know the company's homepage. Each claim is from a primary source:
//   CCPA rights: Civil Code 1798.105 (delete what it collected from you), 1798.110 (know),
//     1798.120 (opt out of sale or sharing), 1798.121 (limit sensitive data), via leginfo.
//   Who the CCPA covers: 1798.140(d)(1)(B)-(C). Two request methods incl. a toll-free number, and
//     the online-only exception: 1798.130(a)(1)(A). Authorized agents: 1798.135(e) and the
//     Attorney General's CCPA FAQ (oag.ca.gov/privacy/ccpa, A.12).
//   DROP: privacy.ca.gov/drop/ (California residents; free; registered data brokers; since
//     2026-08-01 brokers must access DROP at least once every 45 days). Registration: the CPPA's
//     registry page (cppa.ca.gov/data_broker_registry/). Complaint form and its "It's unclear how to
//     submit a privacy request to a business" box: cppa.ca.gov/webapplications/complaint.
// The player's residency (state.caResident) sets how much shows: 'yes' all of it, unset or 'unsaid'
// all of it under CALIFORNIA LAW, said as "If you live in California", 'no' one line saying the rights are California's.
export const CA_LINKS = Object.freeze({
  rights: 'https://oag.ca.gov/privacy/ccpa',
  drop: 'https://privacy.ca.gov/drop/',
  registry: 'https://cppa.ca.gov/data_broker_registry/',
  complaint: 'https://cppa.ca.gov/webapplications/complaint',
});
export const CA_DROP_MISSION = 'people_search-reclaim-stragglers';

// 'none' (no opt-out exists), 'homepage' (only their front page), or null.
export function noRouteCase(b) {
  const o = b?.optOut;
  if (!isObj(o)) return null;
  if (o.method === 'none') return 'none';
  if (o.status !== 'verified') return null;
  const u = parseUrl(o.url);
  return u && isBareHomepage(u) ? 'homepage' : null;
}

export function californiaBlock(b, state = null) {
  const kase = noRouteCase(b);
  if (!kase) return '';
  const name = esc(shortName(b.name ?? b.id));
  const resident = state?.caResident;
  if (resident === 'no') {
    return `<p class="star-card-note star-card-ca">California residents get more options here under California law (the CCPA and DROP). You told the map you live outside California.</p>`;
  }
  const yes = resident === 'yes';
  const registered = Boolean(b.registries?.CA);
  const drop = registered
    ? `<p>${name} is on California's data broker registry, so DROP reaches it. DROP is one free request, run by the California Privacy Protection Agency (CPPA), that tells registered data brokers to delete your data and stop selling it. Since August 1, 2026, each one must check DROP at least once every 45 days. <a href="#/mission/${CA_DROP_MISSION}/briefing">DROP MISSION →</a></p>`
    : `<p>DROP, the CPPA's one free deletion request, goes to registered data brokers. We didn't find ${name} on California's data broker registry (${ext(CA_LINKS.registry, 'check it ↗')}). Any business that meets California's definition of a data broker must register with the CPPA every year.</p>`;
  const complaint = kase === 'homepage'
    ? `<p>If you can't find how to send ${name} a request, tell the CPPA: its ${ext(CA_LINKS.complaint, 'complaint form ↗')} has a box for "It's unclear how to submit a privacy request to a business."</p>`
    : `<p>If ${name} ignores a request, the CPPA complaint form above is where to report it.</p>`;
  return `<div class="label">${yes ? 'YOUR CALIFORNIA RIGHTS' : 'CALIFORNIA LAW'}</div><div class="star-card-ca">`
    + `<p>${yes ? 'You live in California, so state law gives you options here.' : 'If you live in California, state law gives you options here.'} If California's privacy law (the CCPA) covers ${name}, you can tell ${name} to:</p>`
    + '<ul class="star-card-list"><li>stop selling or sharing your personal information</li><li>limit how it uses your sensitive personal information</li><li>tell you what personal information it has collected about you</li><li>delete the personal information it collected from you</li></ul>'
    + `<p class="star-card-note">Among others, the CCPA covers a company that makes half its yearly revenue selling or sharing personal information, or that buys, sells or shares the data of 100,000 or more Californians or households a year.</p>`
    + `<p>A covered company must take requests to know or delete in at least two ways, one of them a toll-free phone number (a company that only operates online and deals with you directly can use email instead). Someone you authorize, an "authorized agent," can send these requests for you.</p>`
    + drop + complaint
    + `<p class="star-card-note">${ext(CA_LINKS.rights, 'Your CCPA rights, from California\'s Attorney General ↗')}</p>`
    + '</div>';
}

// A holding company often takes no opt-outs itself; the companies a published link shows it owning
// may. Their checker-confirmed pages, each named, when this record has no confirmed link of its own.
export function ownedRoutesBlock(map, b, byId) {
  const o = b.optOut;
  if (isObj(o) && (o.method === 'none' || (o.status === 'verified' && parseUrl(o.url)))) return '';
  const seen = new Set();
  const rows = (Array.isArray(map?.links) ? map.links : [])
    .filter((k) => isObj(k) && k.type === 'owns' && k.from === b.id && k.to !== b.id)
    .map((k) => byId.get(k.to))
    .filter((c) => c && !seen.has(c.id) && seen.add(c.id) && isObj(c.optOut) && c.optOut.status === 'verified' && c.optOut.method !== 'none' && parseUrl(c.optOut.url))
    .map((c) => {
      const u = parseUrl(c.optOut.url);
      const bare = isBareHomepage(u);
      return { name: shortName(c.name ?? c.id), url: c.optOut.url, bare };
    })
    .sort((x, y) => x.bare - y.bare || (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
  if (!rows.length) return '';
  const items = rows.map((r) => `<li>${esc(r.name)} · ${ext(r.url, r.bare ? THEIR_SITE_TEXT : OPT_OUT_TEXT)}</li>`).join('');
  return `<p class="star-card-owned">Companies it owns have their own:</p><ul class="star-card-list">${items}</ul>`;
}

function linksBlock(map, id, byId) {
  const name = (other) => esc(shortName(byId.get(other)?.name ?? other));
  const rows = (Array.isArray(map?.links) ? map.links : []).filter((k) => isObj(k) && SIDE[k.type] && (k.from === id || k.to === id) && k.from !== k.to);
  if (!rows.length) return '';
  const items = rows.map((k) => {
    const mine = k.from === id;
    const verb = SIDE[k.type][mine ? 0 : 1];
    const src = archivedLinks(k.sources);
    return `<li><strong>${verb} ${name(mine ? k.to : k.from)}</strong>${k.claim ? `<span class="star-card-claim">${esc(k.claim)}</span>` : ''}${src.length ? `<span class="star-card-src">${src.join(' · ')}</span>` : ''}</li>`;
  }).join('');
  return `<div class="label">DOCUMENTED LINKS</div><ul class="star-card-list">${items}</ul>`;
}

function sourcesBlock(b) {
  const items = (Array.isArray(b.sources) ? b.sources : [])
    .filter((s) => isObj(s) && typeof s.archived === 'string' && s.archived.startsWith('https://web.archive.org/'))
    .map((s) => `<li>${esc(SOURCE_KIND[s.kind] ?? 'source')}${host(s.url) ? ` · ${esc(host(s.url))}` : ''} · ${ext(s.archived, 'archived ↗')}</li>`)
    .join('');
  return items ? `<div class="label">SOURCES</div><ul class="star-card-list">${items}</ul>` : '';
}

function coverageBlock(b, state) {
  const missions = (Array.isArray(b.missions) ? b.missions : [])
    .filter((m) => typeof m === 'string' && !m.includes('-recon-'))
    .map((m) => MISSIONS.find((x) => x.id === m))
    .filter(Boolean);
  if (!missions.length) return `<div class="label">COVERED BY</div><p>No mission covers this one yet.</p>`;
  const done = (m) => state?.missions?.[m]?.status === 'completed';
  const items = missions.map((m) => `<li><a href="#/mission/${esc(m.id)}/${done(m.id) ? 'recheck' : 'briefing'}">${esc(m.title)}</a>${done(m.id) ? ' · done: re-check' : ''}</li>`).join('');
  return `<div class="label">COVERED BY</div><ul class="star-card-list">${items}</ul>`;
}

// The tick's look, shared by the map's STYLE and the Big Check's: a 44px row, a 24px box. `.vh`
// is visually hidden text a screen reader still reads (the tick's broker name).
export const TICK_CSS = '.big-check-tick{display:flex;align-items:center;gap:10px;min-height:44px;font-size:13px;color:var(--offwhite);cursor:pointer}.big-check-tick input{width:24px;height:24px;margin:0;flex-shrink:0;accent-color:var(--lime);cursor:pointer}.big-check-tick input:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}.big-check-freeze{font-size:12px;color:rgba(237,239,243,0.75);margin:0 0 4px}.vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0}';

const FREEZE_NOTE = "A freeze isn't an opt-out: tick this only if you used their opt-out.";

// The Big Check's tick: "I filed with them", for a broker no mission covers (or one ticked before
// a mission covered it, so it can be unticked). The id rides in data-big-check (error-report
// selectors leave data attributes out), never in an id or name; the broker's name is visually
// hidden text in the label (text never reaches a selector), so each box has its own name.
export function bigCheckTick(id, ticked, name = id, { frozen = false } = {}) {
  const note = frozen ? `<p class="big-check-freeze">${esc(FREEZE_NOTE)}</p>` : '';
  return `${note}<label class="big-check-tick"><input type="checkbox" data-big-check="${esc(id)}"${ticked ? ' checked' : ''}> I filed with them<span class="vh"> (${esc(name)})</span></label>`;
}

// A box is offered where the Big Check would list the broker: tickable and not lit by anything
// else (litElsewhere, the Big Check's own rule). A box already ticked always shows, so it can be
// unticked, even when a mission or another filing now covers the broker.
function tickBlock(b, star, lighting) {
  const ticked = Array.isArray(star?.via) && star.via.includes('big-check');
  if (!ticked && (!tickable(b) || litElsewhere(star))) return '';
  const frozen = Array.isArray(lighting?.frozen) && lighting.frozen.includes(b.id);
  return `<div class="label">THE BIG CHECK</div>${bigCheckTick(b.id, ticked, shortName(b.name ?? b.id) || b.id, { frozen })}`;
}

const STATE_LINE = {
  lit: (s) => `You filed${s.litOn ? ` on ${esc(s.litOn)}` : ''}. Your opt-out reaches this one.`,
  amber: (s) => `Re-check due: you filed${s.litOn ? ` on ${esc(s.litOn)}` : ''}. People-search sites often list people again, so check it.`,
};

// scoutLine: Scout's one-time no-opt-out line, in the card's flow (never over it) under the route.
export function starCard(map, lighting, id, state = null, { scoutLine = null } = {}) {
  if (typeof id !== 'string') return '';
  const brokers = Array.isArray(map?.brokers) ? map.brokers.filter((b) => isObj(b) && typeof b.id === 'string') : [];
  const byId = new Map(brokers.map((b) => [b.id, b]));
  const b = byId.get(id);
  if (!b) return '';
  const short = shortName(b.name ?? b.id);
  const full = String(b.name ?? '');
  const parent = typeof b.parent === 'string' && byId.has(b.parent) ? byId.get(b.parent) : null;
  const star = lighting?.stars?.[id] ?? null;
  const stateLine = star && STATE_LINE[star.state] ? `<p class="star-card-state">${STATE_LINE[star.state](star)}</p>` : '';
  const buyer = Array.isArray(b.kind) && b.kind.includes('buyer') ? `<p class="star-card-state">A buyer: our sources show it buying people's data.</p>` : '';
  const sells = (Array.isArray(b.sells) ? b.sells : []).filter((x) => typeof x === 'string' && x);
  const frozen = Array.isArray(lighting?.frozen) && lighting.frozen.includes(id)
    ? `<p class="star-card-note">Your credit is frozen here. A freeze stops new credit in your name; it doesn't stop this company selling what it holds.</p>` : '';
  const halo = Array.isArray(lighting?.halo) && lighting.halo.includes(id)
    ? '<p class="star-card-note">You opted out in this browser through the DAA WebChoices tool. That sets a cookie on this device; it deletes nothing.</p>' : '';
  return `<section class="star-card" tabindex="-1" role="dialog" aria-modal="false" aria-labelledby="star-card-title">`
    + '<div class="star-card-grab" aria-hidden="true"><span></span></div>'
    + `<h2 class="star-card-name" id="star-card-title">${esc(short)}</h2>`
    + (full && full !== short ? `<p class="star-card-full">${esc(full)}</p>` : '')
    + (parent ? `<p class="star-card-parent">Part of ${esc(shortName(parent.name ?? parent.id))}</p>` : '')
    + stateLine + buyer + frozen + halo
    + `<div class="label">OPT-OUT ROUTE</div>${optOutBlock(b)}${ownedRoutesBlock(map, b, byId)}${californiaBlock(b, state)}`
    + (scoutLine ? `<div class="star-card-scout" role="note">${smallScout('thinkingA', 28)}<p>${esc(scoutLine)}</p></div>` : '')
    + (sells.length ? `<div class="label">WHAT ITS RECORDS SAY IT SELLS</div><ul class="star-card-list">${sells.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')
    + linksBlock(map, id, byId)
    + sourcesBlock(b)
    + coverageBlock(b, state)
    + tickBlock(b, star, lighting)
    + '<button type="button" class="star-card-close" data-action="close-star">CLOSE</button>'
    + '</section>';
}
