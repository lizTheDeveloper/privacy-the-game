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

// States whose law, in force now, makes businesses honor a browser opt-out signal like GPC, each
// with the official page that says so (research 2026-10-29; every url is in verified-urls.json).
// Texas and Nebraska only bind businesses that already honor the signals for other states, and
// their lines say so. Maryland's law makes the signal optional, so it isn't here.
// { since: first day in force, url, line: the sentence the player sees }.
export const GPC_STATES = Object.freeze({
  'US-CA': Object.freeze({ since: '2023-01-01', url: "https://oag.ca.gov/privacy/ccpa", line: "California requires covered businesses to honor a Global Privacy Control signal as a request to stop selling or sharing your data." }),
  'US-CO': Object.freeze({ since: '2024-07-01', url: "https://coag.gov/resources/colorado-privacy-act/", line: "Since July 2024, Colorado requires businesses to accept opt-outs sent by signals like Global Privacy Control." }),
  'US-CT': Object.freeze({ since: '2025-01-01', url: "https://portal.ct.gov/ag/sections/privacy/the-connecticut-data-privacy-act", line: "Connecticut requires businesses covered by its privacy law to honor opt-out signals like Global Privacy Control." }),
  'US-DE': Object.freeze({ since: '2026-01-01', url: "https://attorneygeneral.delaware.gov/fraud/personal-data-privacy-portal/frequently-asked-questions/", line: "Since 2026, Delaware requires businesses to treat universal opt-out signals as valid requests." }),
  'US-MN': Object.freeze({ since: '2025-07-31', url: "https://www.revisor.mn.gov/statutes/cite/325M.14", line: "Minnesota law requires businesses to let you opt out of data sales and targeted ads with a browser opt-out signal." }),
  'US-MT': Object.freeze({ since: '2025-01-01', url: "https://mca.legmt.gov/bills/mca/title_0300/chapter_0140/part_0280/section_0090/0300-0140-0280-0090.html", line: "Montana law requires businesses to accept browser opt-out signals for data sales and targeted ads." }),
  'US-NE': Object.freeze({ since: '2025-01-01', url: "https://nebraskalegislature.gov/laws/statutes.php?statute=87-1111", line: "Nebraska lets you opt out with a browser setting; businesses that already honor these signals for other states must honor yours." }),
  'US-NH': Object.freeze({ since: '2025-01-01', url: "https://gc.nh.gov/rsa/html/LII/507-H/507-H-6.htm", line: "New Hampshire requires businesses to honor opt-out signals for data sales and targeted ads." }),
  'US-NJ': Object.freeze({ since: '2025-07-15', url: "https://pub.njleg.gov/bills/2022/PL23/266_.HTM", line: "New Jersey requires businesses to let you opt out of data sales and targeted ads with a universal opt-out signal." }),
  'US-OR': Object.freeze({ since: '2026-01-01', url: "https://www.doj.state.or.us/consumer-protection/id-theft-data-breaches/privacy/", line: "Since 2026, Oregon businesses must honor opt-out signals like Global Privacy Control." }),
  'US-TX': Object.freeze({ since: '2025-01-01', url: "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm", line: "Texas lets you opt out with a browser setting; businesses that already handle these signals for other states must honor it." }),
});

// Where to do it. optoutprescreen.com is the credit reporting companies' own site (it names all four);
// the FTC page explains it. Both checked in a browser 2026-10-29 (curl is refused by both).
export const PRESCREEN_LINKS = Object.freeze([
  Object.freeze({ label: 'OptOutPrescreen.com (opt out for five years, or start the permanent one)', url: 'https://www.optoutprescreen.com/' }),
  Object.freeze({ label: 'The FTC on prescreened offers', url: 'https://consumer.ftc.gov/articles/what-know-about-prescreened-offers-credit-and-insurance' }),
]);

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
    may: "Companies don't have to honor this in {state}, but many do.",
    unknown: 'Some states make companies honor this. Tell the map where you live to see whether yours does.',
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
