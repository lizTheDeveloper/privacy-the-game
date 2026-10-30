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
  eff702: { label: 'EFF: Section 702', url: 'https://www.eff.org/702-spying' },
  brennan702: { label: 'Brennan Center (2026): Section 702 will not lapse if reauthorized by March 2027', url: 'https://www.brennancenter.org/media/16217/download/bcj-702-march-2027-deadline-one-pager-9.22.26.pdf' },
  prismBreak: { label: 'PRISM Break: opt out of global data surveillance programs like PRISM, XKeyscore and Tempora', url: 'https://prism-break.org/en/' },
});

// The nine companies in the 2013 slides, in the order they joined, and the game's accounts each one
// runs. An account is labelled only where the company itself was named. Instagram and WhatsApp,
// bought by Facebook later, weren't, so they carry no label.
export const PRISM_PROVIDERS = Object.freeze([
  { id: 'microsoft', name: 'Microsoft', since: 2007, accounts: ['outlook', 'microsoft'] },
  { id: 'yahoo', name: 'Yahoo', since: 2008, accounts: ['yahoo'] },
  { id: 'google', name: 'Google', since: 2009, accounts: ['gmail', 'google', 'gdrive'] },
  { id: 'facebook', name: 'Facebook', since: 2009, accounts: ['facebook'] },
  { id: 'paltalk', name: 'Paltalk', since: 2009, accounts: [] },
  { id: 'youtube', name: 'YouTube', since: 2010, accounts: [] },
  { id: 'skype', name: 'Skype', since: 2011, accounts: [] },
  { id: 'aol', name: 'AOL', since: 2011, accounts: [] },
  { id: 'apple', name: 'Apple', since: 2012, accounts: ['icloud', 'apple_id'] },
].map((p) => Object.freeze({ ...p, accounts: Object.freeze(p.accounts) })));

// The slides also named a company the NSA planned to add. Dropbox said it wasn't part of any such program.
export const PRISM_PLANNED = Object.freeze({ id: 'dropbox', name: 'Dropbox', accounts: Object.freeze(['dropbox']) });

// What the label on an account says, or null for an account PRISM didn't name.
export function prismLabel(accountId) {
  const p = PRISM_PROVIDERS.find((x) => x.accounts.includes(accountId));
  if (p) return { kind: 'named', text: `PRISM · ${p.since}`, company: p.name, since: p.since };
  if (PRISM_PLANNED.accounts.includes(accountId)) return { kind: 'planned', text: 'PRISM · PLANNED', company: PRISM_PLANNED.name, since: null };
  return null;
}

export const PRISM_COPY = Object.freeze({
  title: 'PRISM',
  sub: "The NSA's pipe into the companies you use",
  scout: "In 2013 the leaked slides named nine companies. If you have an account with one of them, your data sat where this pipe reached. That's not a guess. It's on the slides.",
  what: "PRISM was a National Security Agency program, running since 2007. The leaked slides claimed \"collection directly from the servers\" of the biggest US internet companies. The Washington Post reported that it pulled \"audio and video chats, photographs, e-mails, documents, and connection logs\". The companies all denied giving the government direct access to their servers. Under Section 702 of the surveillance law, the government could order them to hand over a target's account.",
  everything: "PRISM went after chosen targets, not every account at once. It wasn't the only pipe. Under what the NSA called upstream collection, it copied traffic straight off the internet's cables and switches (Saint Mark Klein found one of the rooms where that happened). The agency's director was reported to be driven to \"collect it all\".",
  you: "A target was supposed to be someone outside the US who isn't American. But if you wrote to a target, your side of the conversation was collected too, and the FBI has searched what was collected.",
  status: 'Is it still running? Section 702, the law behind PRISM, was reported to have lapsed in June 2026, and the court-approved certifications behind it reportedly run until March 2027. Congress has fought over renewing it every few years since 2008.',
  defend: "A pipe like this can only take what a company can read. End-to-end encryption, where only you and the person you're writing to hold the keys, leaves the company nothing readable to hand over but who you talked to and when. PRISM Break lists free tools built that way.",
  planned: 'The slides also named Dropbox as a company the NSA planned to add. Dropbox said it was not part of any such program.',
  snowdenTribute: "We know any of this because Edward Snowden handed the slides to journalists, and paid for it with his home. Light him a candle in the saints' gallery.",
});
