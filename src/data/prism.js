// The PRISM map (Liz, 2026-10-29: "a whole page about PRISM, and label things where monitored").
// Every line here is sourced, read 2026-10-29:
//  - The Guardian, 2013-06-07 (Greenwald and MacAskill): the slides claim "collection directly from
//    the servers" of Google, Apple, Facebook and others; the companies denied knowing of any such
//    program; in operation since 2007; the NSA was planning to add Dropbox.
//  - The Washington Post, 2013-06-06 (Gellman and Poitras): "tapping directly into the central servers
//    of nine leading U.S. Internet companies, extracting audio and video chats, photographs, e-mails,
//    documents, and connection logs".
//  - Wikipedia, PRISM: the nine providers and the year each began (Microsoft 2007, Yahoo 2008,
//    Google 2009, Facebook 2009, Paltalk 2009, YouTube 2010, Skype 2011, AOL 2011, Apple 2012);
//    began 2007 under the Protect America Act, then FISA Section 702.
//  - Wikipedia, Upstream collection: copied from the internet's backbone, "major Internet cables and
//    switches"; Binney says the NSA seeks to "collect it all". The Washington Post, 2013-07-14
//    (Nakashima and Warrick): "For NSA chief, terrorist threat drives passion to 'collect it all'".
//  - Section 702's 2026 status: see src/data/interiors/lanes.js (lapse reported June 2026,
//    certifications reportedly to March 2027).
//  - The Guardian, 2013-07-31 (Greenwald): "XKeyscore: NSA tool collects 'nearly everything a user
//    does on the internet'"; analysts need no prior authorization for searches.
//  - EFF, Decoding 702 (read 2026-10-29): the government "routinely collects and searches the online
//    communications of innocent Americans without a warrant" through "upstream" and "PRISM (now
//    called 'downstream')".
// Liz (2026-10-29): "it's in everything, use the maximum interpretation, don't hedge; we lose public
// oversight regularly." So the copy says it plainly, from those sources, with no "reportedly". It
// never invents a fact: Dropbox is "next", as the slides say, not a member.

export const PRISM_SOURCES = Object.freeze({
  guardian: { label: 'The Guardian (2013): NSA Prism program taps in to user data of Apple, Google and others', url: 'https://www.theguardian.com/world/2013/jun/06/us-tech-giants-nsa-data' },
  wapo: { label: 'The Washington Post (2013): U.S., British intelligence mining data from nine U.S. Internet companies in broad secret program', url: 'https://www.washingtonpost.com/investigations/us-intelligence-mining-data-from-nine-us-internet-companies-in-broad-secret-program/2013/06/06/3a0c0da8-cebf-11e2-8845-d970ccb04497_story.html' },
  slides: { label: 'The Guardian (2013): the NSA PRISM slides', url: 'https://www.theguardian.com/world/interactive/2013/nov/01/prism-slides-nsa-document' },
  snowden: { label: 'The Guardian (2013): Edward Snowden, the whistleblower behind the NSA surveillance revelations', url: 'https://www.theguardian.com/world/2013/jun/09/edward-snowden-nsa-whistleblower-surveillance' },
  nsaFiles: { label: 'The Guardian: The NSA files', url: 'https://www.theguardian.com/us-news/the-nsa-files' },
  collectAll: { label: "The Washington Post (2013): For NSA chief, terrorist threat drives passion to 'collect it all'", url: 'https://www.washingtonpost.com/world/national-security/for-nsa-chief-terrorist-threat-drives-passion-to-collect-it-all/2013/07/14/3d26ef80-ea49-11e2-a301-ea5a8116d211_story.html' },
  wikiPrism: { label: 'Wikipedia: PRISM', url: 'https://en.wikipedia.org/wiki/PRISM' },
  wikiUpstream: { label: 'Wikipedia: Upstream collection', url: 'https://en.wikipedia.org/wiki/Upstream_collection' },
  wikiSnowden: { label: 'Wikipedia: Edward Snowden', url: 'https://en.wikipedia.org/wiki/Edward_Snowden' },
  wikiCitizenfour: { label: 'Wikipedia: Citizenfour (Laura Poitras, 2014)', url: 'https://en.wikipedia.org/wiki/Citizenfour' },
  wiki702: { label: 'Wikipedia: Section 702', url: 'https://en.wikipedia.org/wiki/Section_702' },
  eff702: { label: 'EFF: Decoding 702: What is Section 702?', url: 'https://www.eff.org/702-spying' },
  xkeyscore: { label: "The Guardian (2013): XKeyscore: NSA tool collects 'nearly everything a user does on the internet'", url: 'https://www.theguardian.com/world/2013/jul/31/nsa-top-secret-program-online-data' },
  wikiXkeyscore: { label: 'Wikipedia: XKeyscore', url: 'https://en.wikipedia.org/wiki/XKeyscore' },
  brennan702: { label: 'Brennan Center (2026): Section 702 will not lapse if reauthorized by March 2027', url: 'https://www.brennancenter.org/media/16217/download/bcj-702-march-2027-deadline-one-pager-9.22.26.pdf' },
  prismBreak: { label: 'PRISM Break: opt out of global data surveillance programs like PRISM, XKeyscore and Tempora', url: 'https://prism-break.org/en/' },
});

// The nine companies in the 2013 slides, in the order they joined, and every account in the city each
// one runs today, including what it has bought since (Liz: maximum interpretation). Microsoft owns
// LinkedIn (2016) and GitHub (2018); Facebook, now Meta, owns Instagram and WhatsApp.
export const PRISM_PROVIDERS = Object.freeze([
  { id: 'microsoft', name: 'Microsoft', since: 2007, accounts: ['outlook', 'microsoft', 'onedrive', 'ai_microsoft', 'linkedin', 'ai_linkedin', 'github'] },
  { id: 'yahoo', name: 'Yahoo', since: 2008, accounts: ['yahoo'] },
  { id: 'google', name: 'Google', since: 2009, accounts: ['gmail', 'google', 'gdrive', 'ai_google'] },
  { id: 'facebook', name: 'Facebook (now Meta)', since: 2009, accounts: ['facebook', 'instagram', 'whatsapp', 'ai_meta'] },
  { id: 'paltalk', name: 'Paltalk', since: 2009, accounts: [] },
  { id: 'youtube', name: 'YouTube', since: 2010, accounts: [] },
  { id: 'skype', name: 'Skype', since: 2011, accounts: [] },
  { id: 'aol', name: 'AOL', since: 2011, accounts: [] },
  { id: 'apple', name: 'Apple', since: 2012, accounts: ['icloud', 'apple_id', 'icloud_drive', 'ai_apple'] },
].map((p) => Object.freeze({ ...p, accounts: Object.freeze(p.accounts) })));

// The slides named Dropbox as the next company coming on.
export const PRISM_PLANNED = Object.freeze({ id: 'dropbox', name: 'Dropbox', accounts: Object.freeze(['dropbox']) });

// Districts' entries that aren't an online account the player holds (a topic, a defence, a broker
// category, a data trail): no label.
export const NOT_AN_ACCOUNT = Object.freeze(new Set([
  'border_prep', 'device_security', 'scam_defense', 'sim_protection', 'credit_freeze', 'people_search', 'enterprise_data',
  'ad_trackers', 'location_brokers', 'govt_id_defense', 'car_broker_lexisnexis', 'car_broker_verisk', 'photo_metadata',
  'loyalty_programs', 'payment_trail', 'browser_fingerprint',
]));

// What the label on an account says. Every account in the city is online, and the internet's cables
// are tapped (upstream), so every one gets a label: PRISM where the company was on the slides, NEXT for
// Dropbox, UPSTREAM for the rest. Only an id that isn't an account gets null.
export function prismLabel(accountId, accounts = null) {
  const p = PRISM_PROVIDERS.find((x) => x.accounts.includes(accountId));
  if (p) return { kind: 'named', text: `PRISM · ${p.since}`, company: p.name, since: p.since };
  if (PRISM_PLANNED.accounts.includes(accountId)) return { kind: 'next', text: 'PRISM · NEXT', company: PRISM_PLANNED.name, since: null };
  if (NOT_AN_ACCOUNT.has(accountId) || (accounts && !Object.hasOwn(accounts, accountId))) return null;
  return { kind: 'upstream', text: 'UPSTREAM', company: null, since: null };
}

export const PRISM_COPY = Object.freeze({
  title: 'PRISM',
  sub: "It's in everything",
  scout: "Assume all of it is collected. The slides named nine companies. The cable taps took the rest. What we know is only what leaked.",
  what: "PRISM is the NSA's pipe into Microsoft, Yahoo, Google, Facebook, Paltalk, YouTube, Skype, AOL and Apple, running since 2007. The NSA's own slides call it \"collection directly from the servers\": audio and video chats, photographs, e-mails, documents and connection logs. Section 702 orders make the companies hand it over. The NSA now calls it \"downstream\".",
  everything: "And it's in everything. What PRISM doesn't pull from the companies, the NSA copies straight off the internet's cables: \"upstream\" collection, through rooms like the one Saint Mark Klein exposed at AT&T. The NSA's search tool for it, XKeyscore, collects \"nearly everything a user does on the internet\", and analysts search it with no prior authorization. The agency's director wanted to \"collect it all\".",
  you: "You don't have to be the target. The government routinely collects and searches the online communications of innocent Americans without a warrant, and the FBI searches what the NSA collects.",
  status: "Still running. Congress has renewed Section 702 again and again since 2008, and when the law lapsed in June 2026, the court certifications kept it going into 2027. Public oversight comes and goes. The collection doesn't.",
  defend: "A pipe can only take what it can read. End-to-end encryption, where only you and the person you're writing to hold the keys, leaves nothing readable but who you talked to and when. PRISM Break lists free tools built that way.",
  next: 'The slides named Dropbox as the next company coming on.',
  cables: 'Every other account in the city runs over the same tapped cables. That\'s why each one carries an UPSTREAM label.',
  snowdenTribute: "We know any of this because Edward Snowden handed the slides to journalists, and paid for it with his home. Light him a candle in the saints' gallery.",
});
