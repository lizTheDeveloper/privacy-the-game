// Every leak badge, joined from the group files (README.md has the shape), plus PRISM itself, and the
// agency map's data. One place for lookups: by badge id, and by account.
import { LEAKS_SNOWDEN } from './snowden.js';
import { LEAKS_VAULT7 } from './vault7.js';
import { LEAKS_LOCATION } from './location.js';
import { LEAKS_COURTS } from './courts.js';
import { AGENCIES, AUTHORITIES, CHANNELS, PROGRAMS, PAPERWORK, OUTSIDE } from './agencies.js';
import { PRISM_PROVIDERS, PRISM_SOURCES, PRISM_COPY } from '../prism.js';

// PRISM as a badge of its own, so its page sits with the others.
const PRISM_ENTRY = Object.freeze({
  id: 'prism',
  badge: 'PRISM',
  title: 'PRISM',
  agency: 'NSA and FBI',
  leak: 'prism',
  year: 2013,
  summary: PRISM_COPY.what,
  accounts: Object.freeze(PRISM_PROVIDERS.flatMap((p) => p.accounts)),
  sources: Object.freeze([PRISM_SOURCES.guardian, PRISM_SOURCES.wapo, PRISM_SOURCES.slides, PRISM_SOURCES.wikiPrism, PRISM_SOURCES.eff702, PRISM_SOURCES.wiki702]),
  flow: Object.freeze({
    data: 'Audio and video chats, photographs, e-mails, documents and connection logs',
    from: Object.freeze(PRISM_PROVIDERS.map((p) => p.name)),
    to: Object.freeze(['NSA']),
    sharedWith: Object.freeze(['FBI', 'CIA', 'NCTC']),
    authority: 'FISA Section 702',
    when: 'Whenever the target is a person outside the US who is not American; their contacts in the US are collected too',
    checkedBy: 'The FISA Court approves the yearly certifications and procedures, not each target',
  }),
});

const uniq = (list) => {
  const seen = new Set();
  return list.filter((e) => e && typeof e.id === 'string' && !seen.has(e.id) && seen.add(e.id));
};

export const LEAKS = Object.freeze(uniq([PRISM_ENTRY, ...LEAKS_SNOWDEN, ...LEAKS_VAULT7, ...LEAKS_LOCATION, ...LEAKS_COURTS]));
const BY_ID = new Map(LEAKS.map((e) => [e.id, e]));

export const leakById = (id) => BY_ID.get(id) ?? null;
export const leaksForAccount = (accountId) => LEAKS.filter((e) => e.id !== 'prism' && Array.isArray(e.accounts) && e.accounts.includes(accountId));

const AGENCY_BY_ID = new Map(AGENCIES.map((a) => [a.id, a]));
export const agencyName = (id) => AGENCY_BY_ID.get(id)?.name ?? String(id ?? '');

export { AGENCIES, AUTHORITIES, CHANNELS, PROGRAMS, PAPERWORK, OUTSIDE };

const AUTHORITY_BY_ID = new Map(AUTHORITIES.map((a) => [a.id, a]));
// A channel's authority ids, as the laws' names (a leak entry's authority is already words).
export const authorityNames = (v) => (Array.isArray(v) ? v.map((id) => AUTHORITY_BY_ID.get(id)?.name ?? id).join('; ') : String(v ?? ''));

// The government map's data in one object.
export const GOV_DATA = Object.freeze({
  entries: LEAKS, agencies: AGENCIES, channels: CHANNELS, programs: PROGRAMS, paperwork: PAPERWORK, authorities: AUTHORITIES, outside: OUTSIDE,
});
