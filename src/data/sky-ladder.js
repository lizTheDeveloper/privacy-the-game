// The sky ladder (docs/superpowers/specs/2026-10-29-sky-ladder-and-satellites-design.md): where
// the player lives, and the opt-outs that cover many stars at once. Data only.

export const US_STATES = Object.freeze([
  ['US-AL', 'Alabama'], ['US-AK', 'Alaska'], ['US-AZ', 'Arizona'], ['US-AR', 'Arkansas'], ['US-CA', 'California'],
  ['US-CO', 'Colorado'], ['US-CT', 'Connecticut'], ['US-DE', 'Delaware'], ['US-DC', 'District of Columbia'], ['US-FL', 'Florida'],
  ['US-GA', 'Georgia'], ['US-HI', 'Hawaii'], ['US-ID', 'Idaho'], ['US-IL', 'Illinois'], ['US-IN', 'Indiana'],
  ['US-IA', 'Iowa'], ['US-KS', 'Kansas'], ['US-KY', 'Kentucky'], ['US-LA', 'Louisiana'], ['US-ME', 'Maine'],
  ['US-MD', 'Maryland'], ['US-MA', 'Massachusetts'], ['US-MI', 'Michigan'], ['US-MN', 'Minnesota'], ['US-MS', 'Mississippi'],
  ['US-MO', 'Missouri'], ['US-MT', 'Montana'], ['US-NE', 'Nebraska'], ['US-NV', 'Nevada'], ['US-NH', 'New Hampshire'],
  ['US-NJ', 'New Jersey'], ['US-NM', 'New Mexico'], ['US-NY', 'New York'], ['US-NC', 'North Carolina'], ['US-ND', 'North Dakota'],
  ['US-OH', 'Ohio'], ['US-OK', 'Oklahoma'], ['US-OR', 'Oregon'], ['US-PA', 'Pennsylvania'], ['US-RI', 'Rhode Island'],
  ['US-SC', 'South Carolina'], ['US-SD', 'South Dakota'], ['US-TN', 'Tennessee'], ['US-TX', 'Texas'], ['US-UT', 'Utah'],
  ['US-VT', 'Vermont'], ['US-VA', 'Virginia'], ['US-WA', 'Washington'], ['US-WV', 'West Virginia'], ['US-WI', 'Wisconsin'],
  ['US-WY', 'Wyoming'],
].map((pair) => Object.freeze(pair)));

export const STATE_NAME = Object.freeze(Object.fromEntries(US_STATES));

// OptOutPrescreen.com, run by the four nationwide consumer reporting companies: it stops them
// supplying your file for prescreened credit and insurance offers. It lights only those four
// reporting records (the same records the credit-freeze rings use), never their parents. The
// online opt-out lasts five years.
export const PRESCREEN = Object.freeze({
  brokers: Object.freeze(['equifax-information-services', 'experian-information-solutions', 'trans-union', 'innovis-data-solutions']),
  days: 1826,
});

// Global Privacy Control is set up in Perimeter's "Set Up Your Defense Toolkit"; the rung is done
// when that mission is, with one of these answers.
export const GPC_MISSION = 'scam_defense-fortify-tools';
export const GPC_DONE = Object.freeze(['completed', 'already-done']);
export const DROP_MISSION = 'people_search-reclaim-stragglers';
export const DAA_MISSION = 'ad_trackers-fortify-bulk';

// States whose law makes businesses honor a browser opt-out signal like GPC, each with the
// official page that says so (research 2026-10-29; every url is in verified-urls.json).
// { since: first day in force, url, line: a sentence the player sees }.
export const GPC_STATES = Object.freeze({});

// Player-facing copy for the ladder. {state} is the player's state name; {count} a number.
export const LADDER_COPY = Object.freeze({
  drop: Object.freeze({
    label: 'California DROP',
    ca: 'One request, every broker registered in California. The law makes them delete you, and keep checking.',
    other: "California residents can erase these {count} with one request. {state} doesn't offer anything like it yet.",
    outside: "California residents can erase these {count} with one request. It's only for people who live there.",
    whyNot: "DROP checks that you live in California before it sends anything, so it can't work for you. It's here to show what one law can do.",
  }),
  gpc: Object.freeze({
    label: 'Global Privacy Control',
    count: 'every website, this browser',
    must: 'Companies must honor this in {state}.',
    may: "Companies don't have to honor this where you live, but many do.",
    body: 'One browser setting that tells every site you visit: do not sell or share my data. It stops future selling; it deletes nothing.',
  }),
  daa: Object.freeze({
    label: 'DAA WebChoices',
    body: 'Opts this browser out of interest-based ads from the ad companies on the list. It sets cookies; it deletes nothing.',
  }),
  prescreen: Object.freeze({
    label: 'OptOutPrescreen',
    body: 'The four big credit reporting companies sell your file for "you\'re pre-approved!" credit and insurance offers. One opt-out stops all four, for five years online or for good by mail.',
    did: 'I DID THIS',
    undo: 'UNDO',
  }),
  zero: '0 stars mapped yet',
  stars: (n) => `${n} ${n === 1 ? 'star' : 'stars'}`,
});
