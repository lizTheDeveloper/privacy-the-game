// Snowden-era NSA and GCHQ programs that name a company, service or device in the city
// (Liz, 2026-10-29: leak badges). Spec: src/data/leaks/README.md. PRISM has its own page
// (src/data/prism.js) and is not repeated here.
//
// Every sentence below is something a listed source says; sources read 2026-10-29. Live-check log:
// research/leaks/snowden-urls.json. Washington Post and New York Times pages refuse fetch tools and
// are marked "needs browser check" there; each claim that leans on one of them is also stated in a
// second listed source that was read.
//
// ANT catalog: Wikipedia says the source of the catalog "is believed to be someone different than
// Edward Snowden", so its `leak` is 'reporting', not 'snowden'.

const W = (title, slug) => ({ label: `Wikipedia: ${title}`, url: `https://en.wikipedia.org/wiki/${slug}` });
const DISCLOSURES = W('Global surveillance disclosures (2013–present)', 'Global_surveillance_disclosures_(2013%E2%80%93present)');

export const LEAKS_SNOWDEN = Object.freeze([
  {
    id: 'muscular',
    badge: 'MUSCULAR',
    title: 'MUSCULAR',
    agency: 'NSA and GCHQ',
    leak: 'snowden',
    year: 2013,
    summary:
      'GCHQ and the NSA secretly broke into the main communications links that connect the data centres of Google and Yahoo. ' +
      'The NSA sent millions of records every day from inside Google and Yahoo networks to its headquarters at Fort Meade. ' +
      'Google data travelled unencrypted inside its private cloud, and the program needed no warrant.',
    accounts: ['gmail', 'google', 'gdrive', 'yahoo'],
    flow: {
      data: 'Email, metadata and content from inside Google and Yahoo networks',
      from: ['Google data-centre links', 'Yahoo data-centre links', 'an unnamed telecom operator (access point DS-200B)'],
      to: ['NSA', 'GCHQ'],
      sharedWith: [],
      authority: 'No warrant: the access point is outside the United States',
      when: 'In bulk, every day, from links between data centres',
      checkedBy: 'No court named in the documents; unlike PRISM, MUSCULAR needs no FISA warrant',
    },
    scale: { value: 181000000, unit: 'records', what: 'collected in 30 days, December 2012 to January 2013', source: 1 },
    sources: [
      { label: 'The Washington Post (2013): NSA infiltrates links to Yahoo, Google data centers worldwide, Snowden documents say', url: 'https://www.washingtonpost.com/world/national-security/nsa-infiltrates-links-to-yahoo-google-data-centers-worldwide-snowden-documents-say/2013/10/30/e51d661e-4166-11e3-8b74-d89d714ca4dd_story.html' },
      W('MUSCULAR', 'MUSCULAR'),
      DISCLOSURES,
    ],
  },
  {
    id: 'optic-nerve',
    badge: 'OPTIC NERVE',
    title: 'Optic Nerve',
    agency: 'GCHQ, with help from the NSA',
    leak: 'snowden',
    year: 2014,
    summary:
      'GCHQ, with aid from the NSA, intercepted and stored still images of Yahoo webcam chats in bulk, "regardless of whether individual users were an intelligence target or not". ' +
      'It saved one image every five minutes from each feed, including substantial quantities of sexually explicit images, and used them for experiments in automated facial recognition. ' +
      'Yahoo called it "a whole new level of violation of our users\' privacy".',
    accounts: ['yahoo'],
    flow: {
      data: 'Webcam still images, one every five minutes, plus Yahoo user IDs',
      from: ['Yahoo webcam chats', 'GCHQ internet cable taps'],
      to: ['GCHQ'],
      sharedWith: ['NSA'],
      authority: 'UK law, as GCHQ claims; no individual warrant',
      when: 'In bulk, from users who were not intelligence targets ("unselected")',
      checkedBy: 'No court named in the documents; no UK law stops British analysts viewing Americans\' images without an individual warrant',
    },
    scale: { value: 1800000, unit: 'Yahoo user accounts', what: 'webcam images collected in one six-month period of 2008', source: 0 },
    sources: [
      { label: 'The Guardian (2014): Optic Nerve: millions of Yahoo webcam images intercepted by GCHQ', url: 'https://www.theguardian.com/world/2014/feb/27/gchq-nsa-webcam-images-internet-yahoo' },
      W('Optic Nerve (GCHQ)', 'Optic_Nerve_(GCHQ)'),
    ],
  },
  {
    id: 'microsoft-nsa',
    badge: 'MS + NSA',
    title: 'Microsoft, Outlook.com and SkyDrive',
    agency: 'NSA and FBI',
    leak: 'snowden',
    year: 2013,
    summary:
      'Microsoft helped the NSA get around its own encryption so the NSA could intercept web chats on Outlook.com; "MS, working with the FBI, developed a surveillance capability." ' +
      'The NSA already had pre-encryption access to Outlook.com and Hotmail email through PRISM. ' +
      'Microsoft also worked with the FBI to give the NSA easier access to its cloud storage, SkyDrive (now OneDrive). PRISM material is routinely shared with the FBI and CIA.',
    accounts: ['outlook', 'microsoft', 'onedrive'],
    flow: {
      data: 'Outlook.com chats and email (before encryption), SkyDrive files',
      from: ['Microsoft'],
      to: ['NSA', 'FBI'],
      sharedWith: ['CIA'],
      authority: 'PRISM, under blanket orders from the FISA Court',
      when: 'Without an individual warrant, when an analyst has a "51% belief" the target is foreign',
      checkedBy: 'The FISA Court issues blanket orders; no judge reviews each target',
    },
    sources: [
      { label: 'The Guardian (2013): Microsoft handed the NSA access to encrypted messages', url: 'https://www.theguardian.com/world/2013/jul/11/microsoft-nsa-collaboration-user-data' },
      DISCLOSURES,
    ],
  },
  {
    id: 'leaky-apps',
    badge: 'LEAKY APPS',
    title: '"Leaky" phone apps',
    agency: 'NSA and GCHQ',
    leak: 'snowden',
    year: 2014,
    summary:
      'The NSA and GCHQ scoop up what smartphone apps send across the internet: address books, buddy lists, phone logs and the location data in photos posted to the mobile versions of Facebook, Flickr, LinkedIn and Twitter. ' +
      'The agencies also pull the profiles that mobile ad companies build, which can include age, gender, income, ethnicity, sexual orientation and location; a GCHQ report shows how to pluck them from Angry Birds. ' +
      'A 2008 document says "anyone using Google Maps on a smartphone is working in support of a GCHQ system."',
    accounts: ['facebook', 'twitter', 'linkedin', 'google', 'ad_trackers'],
    flow: {
      data: 'Address books, buddy lists, phone logs, photo geotags, location, ad profiles (age, gender, income, sexual orientation)',
      from: ['Facebook', 'Twitter', 'LinkedIn', 'Flickr', 'Google Maps', 'Angry Birds', 'mobile ad companies', 'cable taps and mobile networks'],
      to: ['NSA', 'GCHQ'],
      sharedWith: [],
      authority: 'The same laws and minimisation procedures as all other NSA activity',
      when: 'In bulk, as app data crosses the networks; app cookies are "currently our single largest type of events"',
      checkedBy: 'No court named in the documents',
    },
    marking: 'TOP SECRET//COMINT//REL TO USA, FVEY',
    sources: [
      { label: "The Guardian (2014): Angry Birds and 'leaky' phone apps targeted by NSA and GCHQ for user data", url: 'https://www.theguardian.com/world/2014/jan/27/nsa-gchq-smartphone-app-angry-birds-personal-data' },
      { label: 'ProPublica (2014): Spy Agencies Probe Angry Birds and Other Apps for Personal Data', url: 'https://www.propublica.org/article/spy-agencies-probe-angry-birds-and-other-apps-for-personal-data' },
      { label: 'The New York Times (2014): Spy Agencies Scour Phone Apps for Personal Data', url: 'https://www.nytimes.com/2014/01/28/world/spy-agencies-scour-phone-apps-for-personal-data.html' },
      DISCLOSURES,
    ],
  },
  {
    id: 'squeaky-dolphin',
    badge: 'SQUEAKY DOLPHIN',
    title: 'Squeaky Dolphin',
    agency: 'GCHQ',
    leak: 'snowden',
    year: 2014,
    summary:
      'GCHQ demonstrated to the NSA "broad real-time monitoring of online activity": YouTube video views, URLs "liked" on Facebook, and Blogspot/Blogger visits. ' +
      'Facebook and Google, which owns YouTube, said they never gave the British government permission and did not know the collection was happening. ' +
      'In 2010 GCHQ used unencrypted Twitter data to identify specific users and target them with propaganda.',
    accounts: ['google', 'facebook', 'twitter'],
    flow: {
      data: 'YouTube views, Facebook likes, Blogger visits, Twitter data',
      from: ['YouTube', 'Facebook', 'Blogger', 'Twitter', 'fibre-optic cable taps'],
      to: ['GCHQ'],
      sharedWith: ['NSA'],
      authority: 'none',
      when: 'In real time, without the companies\' knowledge or consent',
      checkedBy: 'No one: Facebook and Google say they did not authorise it',
    },
    sources: [
      { label: 'NBC News (2014): Exclusive: Snowden Docs Reveal UK Spies Snooped on YouTube, Facebook', url: 'https://www.nbcnews.com/news/investigations/exclusive-snowden-docs-reveal-uk-spies-snooped-youtube-facebook-n17381' },
      W('Squeaky Dolphin', 'Squeaky_Dolphin'),
      DISCLOSURES,
    ],
  },
  {
    id: 'turbine',
    badge: 'TURBINE',
    title: 'TURBINE, TURMOIL and QUANTUM',
    agency: 'NSA, with GCHQ',
    leak: 'snowden',
    year: 2014,
    summary:
      'TURBINE automates the NSA\'s hacking so it can control "millions of implants" by groups "instead of individually." TURMOIL sensors watch internet traffic and alert TURBINE, which "shoots" malware at a target within a fraction of a second. ' +
      'In QUANTUMHAND the NSA disguises itself as a fake Facebook server to infect a computer when its owner logs in. ' +
      'At Menwith Hill in England, run with GCHQ, the NSA tested QUANTUM attacks against users of Yahoo and Hotmail.',
    accounts: ['facebook', 'yahoo', 'outlook'],
    flow: {
      data: 'Files from hard drives, audio recorded through the computer',
      from: ['Facebook (impersonated)', 'Yahoo', 'Hotmail', 'internet cables'],
      to: ['NSA', 'GCHQ'],
      sharedWith: ['FIVE_EYES'],
      authority: 'none',
      when: 'Automatically, when a TURMOIL sensor spots a target\'s selector on the wire',
      checkedBy: 'No court named in the documents; TURBINE was built to "reduce the level of human oversight"',
    },
    scale: { value: 1000000, unit: 'implants', what: 'the scale TURBINE was designed for: "millions of implants"', source: 0 },
    sources: [
      { label: "The Intercept (2014): How the NSA Plans to Infect 'Millions' of Computers with Malware", url: 'https://theintercept.com/2014/03/12/nsa-plans-infect-millions-computers-malware/' },
      W('Tailored Access Operations', 'Tailored_Access_Operations'),
    ],
  },
  {
    id: 'cookie-selectors',
    badge: 'COOKIE TARGETS',
    title: 'Cookies as targeting selectors',
    agency: 'NSA and GCHQ',
    leak: 'snowden',
    year: 2013,
    summary:
      'The NSA piggybacks on the tools advertisers use to track people, using Google\'s PREF cookie to pick out targets for hacking. ' +
      'Its selectors include the unique cookies that Google, Facebook, Hotmail, Yahoo and Twitter send to a user\'s computer, and Google advertising cookies that track browsing habits. ' +
      'The NSA\'s Special Source Operations shared "logins, cookies, and GooglePREFID" with its hacking division and with GCHQ.',
    accounts: ['google', 'facebook', 'outlook', 'yahoo', 'twitter', 'ad_trackers'],
    flow: {
      data: 'Login cookies, Google PREF IDs, advertising cookies',
      from: ['Google', 'Facebook', 'Hotmail', 'Yahoo', 'Twitter', 'advertising cookies', 'internet cables'],
      to: ['NSA'],
      sharedWith: ['GCHQ'],
      authority: 'none',
      when: 'To single out a computer for hacking',
      checkedBy: 'No court named in the documents',
    },
    sources: [
      { label: 'The Washington Post (2013): NSA uses Google cookies to pinpoint targets for hacking', url: 'https://www.washingtonpost.com/news/the-switch/wp/2013/12/10/nsa-uses-google-cookies-to-pinpoint-targets-for-hacking/' },
      { label: "The Intercept (2014): How the NSA Plans to Infect 'Millions' of Computers with Malware", url: 'https://theintercept.com/2014/03/12/nsa-plans-infect-millions-computers-malware/' },
      DISCLOSURES,
    ],
  },
  {
    id: 'quantum-linkedin',
    badge: 'FAKE LINKEDIN',
    title: 'Quantum Insert and the fake LinkedIn pages',
    agency: 'GCHQ, with NSA technology',
    leak: 'snowden',
    year: 2013,
    summary:
      'GCHQ served engineers at the Belgian telecom Belgacom fake copies of their LinkedIn profiles carrying malware that turned their computers into tools for GCHQ. ' +
      'The attack, "Quantum Insert", is NSA technology that the NSA passed to GCHQ. ' +
      'LinkedIn said it "would not authorize such activity for any purpose".',
    accounts: ['linkedin'],
    flow: {
      data: 'Control of the target\'s computer and its company network',
      from: ['LinkedIn (impersonated)', 'Slashdot (impersonated)'],
      to: ['GCHQ'],
      sharedWith: ['NSA'],
      authority: 'none',
      when: 'Against telecom engineers chosen because they used LinkedIn',
      checkedBy: 'No court named in the documents; LinkedIn did not authorise it',
    },
    sources: [
      { label: 'Der Spiegel (2013): Quantum Spying: GCHQ Used Fake LinkedIn Pages to Target Engineers', url: 'https://www.spiegel.de/international/world/ghcq-targets-engineers-with-fake-linkedin-pages-a-932821.html' },
      W('Tailored Access Operations', 'Tailored_Access_Operations'),
      DISCLOSURES,
    ],
  },
  {
    id: 'xkeyscore',
    badge: 'XKEYSCORE',
    title: 'XKeyscore',
    agency: 'NSA',
    leak: 'snowden',
    year: 2013,
    summary:
      'XKeyscore lets NSA analysts search, "with no prior authorization", vast databases of emails, online chats and browsing histories; one presentation says it covers "nearly everything a typical user does on the internet". ' +
      'An analyst reads someone\'s Facebook chats by typing in a Facebook user name and a date range, and XKeyscore also tracks phone connections to Google\'s app store and Windows crash reports. ' +
      'The NSA shares XKeyscore with GCHQ and the other Five Eyes agencies, Germany\'s BND, Japan and Denmark.',
    accounts: ['facebook', 'twitter', 'google', 'microsoft'],
    flow: {
      data: 'Email content, online chats, websites visited, searches, and their metadata',
      from: ['Facebook', 'Twitter', 'Google app store', 'Windows crash reports', 'about 150 collection sites, over 700 servers'],
      to: ['NSA'],
      sharedWith: ['GCHQ', 'FIVE_EYES'],
      authority: 'The FISA Amendments Act requires an individual warrant only when the target is a US person',
      when: 'Any time an analyst fills in an on-screen form with a broad justification',
      checkedBy: 'No one: a search "is not reviewed by a court or any NSA personnel before it is processed"',
    },
    scale: { value: 41000000000, unit: 'records', what: 'stored in XKeyscore in a single 30-day period of 2012', source: 0 },
    sources: [
      { label: "The Guardian (2013): XKeyscore: NSA tool collects 'nearly everything a user does on the internet'", url: 'https://www.theguardian.com/world/2013/jul/31/nsa-top-secret-program-online-data' },
      { label: "The Intercept (2015): XKEYSCORE: NSA's Google for the World's Private Communications", url: 'https://theintercept.com/2015/07/01/nsas-google-worlds-private-communications/' },
      W('XKeyscore', 'XKeyscore'),
    ],
  },
  {
    id: 'fairview',
    badge: 'FAIRVIEW',
    title: 'FAIRVIEW and AT&T',
    agency: 'NSA',
    leak: 'snowden',
    year: 2015,
    summary:
      'The NSA\'s ability to spy on internet traffic passing through the United States rests on a decades-long partnership with AT&T, which the NSA praises for its "extreme willingness to help." ' +
      'AT&T gave the NSA access to billions of emails crossing its domestic networks and installed surveillance equipment in at least 17 of its internet hubs; in 2006 technician Mark Klein revealed Room 641A, the NSA room inside AT&T\'s building at 611 Folsom Street, San Francisco. ' +
      'AT&T buildings in eight US cities sit at the centre of the program, which taps traffic from other providers as well as AT&T\'s own customers.',
    accounts: ['phone_carrier'],
    flow: {
      data: 'Emails, phone calls and online chats crossing US territory',
      from: ['AT&T', 'other providers that route through AT&T'],
      to: ['NSA'],
      sharedWith: [],
      authority: 'Executive Order 12333 "transit authority" and FISA Section 702 upstream collection',
      when: 'Continuously, at AT&T hubs in eight US cities',
      checkedBy: 'No individual court order for foreign-to-foreign "transit" traffic under Executive Order 12333',
    },
    scale: { value: 60000000, unit: 'emails a day', what: 'foreign-to-foreign emails gathered through AT&T as of March 2013', source: 1 },
    sources: [
      { label: "ProPublica (2015): NSA Spying Relies on AT&T's 'Extreme Willingness to Help'", url: 'https://www.propublica.org/article/nsa-spying-relies-on-atts-extreme-willingness-to-help' },
      { label: "The Intercept (2018): The NSA's Hidden Spy Hubs in Eight U.S. Cities", url: 'https://theintercept.com/2018/06/25/att-internet-nsa-spy-hubs/' },
      { label: 'The New York Times (2015): AT&T Helped U.S. Spy on Internet on a Vast Scale', url: 'https://www.nytimes.com/2015/08/16/us/politics/att-helped-nsa-spy-on-an-array-of-internet-traffic.html' },
      W('Fairview (surveillance program)', 'FAIRVIEW'),
      W('Room 641A', 'Room_641A'),
    ],
  },
  {
    id: 'verizon-215',
    badge: 'VERIZON ORDER',
    title: 'The Verizon call-records order',
    agency: 'NSA and FBI',
    leak: 'snowden',
    year: 2013,
    summary:
      'A top-secret FISA Court order required Verizon to give the NSA, "on an ongoing, daily basis", the records of all telephone calls in its systems, within the US and abroad. ' +
      'The order covered both phone numbers on each call, call duration, unique identifiers and the time of every call, collected "indiscriminately and in bulk" whether or not anyone was suspected of wrongdoing. ' +
      'It relied on the Patriot Act\'s "business records" provision; in 2015 the USA Freedom Act put new limits on this bulk collection.',
    accounts: ['phone_carrier'],
    flow: {
      data: 'Call records ("telephony metadata"): both numbers, time, duration, unique identifiers',
      from: ['Verizon'],
      to: ['FBI', 'NSA'],
      sharedWith: [],
      authority: 'Patriot Act Section 215 ("business records", 50 USC 1861)',
      when: 'Every call, every day, for the life of the order',
      checkedBy: 'The FISA Court, in a secret blanket order for all customers; Verizon was barred from telling anyone',
    },
    scale: { value: 120000000, unit: 'Verizon subscribers', what: 'whose phone records the NSA collected', source: 1 },
    sources: [
      { label: 'The Guardian (2013): NSA collecting phone records of millions of Verizon customers daily', url: 'https://www.theguardian.com/world/2013/jun/06/nsa-phone-records-verizon-court-order' },
      DISCLOSURES,
      W('USA Freedom Act', 'USA_Freedom_Act'),
    ],
  },
  {
    id: 'tempora',
    badge: 'TEMPORA',
    title: 'Tempora',
    agency: 'GCHQ, sharing with the NSA',
    leak: 'snowden',
    year: 2013,
    summary:
      'GCHQ taps the fibre-optic cables that carry the world\'s phone calls and internet traffic and stores what it takes for up to 30 days: phone calls, email content, Facebook entries and browsing histories. ' +
      'BT, Vodafone Cable and Verizon Business, with four smaller firms, gave GCHQ "secret unlimited access" to their undersea cables. ' +
      'GCHQ shares it all with the NSA, and told American users "We have a light oversight regime compared with the US".',
    accounts: ['phone_carrier', 'facebook'],
    flow: {
      data: 'Phone call recordings, email content, Facebook entries, browsing history',
      from: ['BT', 'Vodafone Cable', 'Verizon Business', 'Level 3', 'Global Crossing', 'Viatel', 'Interoute', 'more than 200 fibre-optic cables'],
      to: ['GCHQ'],
      sharedWith: ['NSA'],
      authority: 'A foreign secretary\'s certificate under the Regulation of Investigatory Powers Act 2000',
      when: 'All traffic on tapped cables, buffered for days and searched later, without individual suspicion',
      checkedBy: 'GCHQ audits itself, and the results are secret; no court',
    },
    scale: { value: 600000000, unit: 'telephone events a day', what: 'handled by GCHQ by 2012', source: 0 },
    sources: [
      { label: "The Guardian (2013): GCHQ taps fibre-optic cables for secret access to world's communications", url: 'https://www.theguardian.com/uk/2013/jun/21/gchq-cables-secret-world-communications-nsa' },
      { label: 'The Guardian (2013): BT and Vodafone among telecoms companies passing details to GCHQ', url: 'https://www.theguardian.com/business/2013/aug/02/telecoms-bt-vodafone-cables-gchq' },
      W('Tempora', 'Tempora'),
    ],
  },
  {
    id: 'gemalto-sim-heist',
    badge: 'SIM KEY HEIST',
    title: 'The Great SIM Heist (Gemalto)',
    agency: 'NSA and GCHQ',
    leak: 'snowden',
    year: 2015,
    summary:
      'A joint NSA and GCHQ unit hacked Gemalto, the world\'s largest maker of SIM cards, and stole the encryption keys that protect cellphone calls and data. ' +
      'Gemalto\'s clients include AT&T, T-Mobile, Verizon, Sprint and some 450 wireless providers. ' +
      'With the keys the agencies listen to phones without the carrier\'s approval, without a warrant, and without leaving a trace on the network.',
    accounts: ['phone_carrier'],
    flow: {
      data: 'SIM encryption keys, then the calls and data they protect',
      from: ['Gemalto', 'SIM cards used by AT&T, T-Mobile, Verizon, Sprint'],
      to: ['NSA', 'GCHQ'],
      sharedWith: [],
      authority: 'none',
      when: 'Bulk key theft, then eavesdropping that leaves no trace on the carrier\'s network',
      checkedBy: 'No one: the keys "sidestep the need to get a warrant or a wiretap"',
    },
    scale: { value: 300000, unit: 'SIM keys', what: 'GCHQ compiled for Somali phone users by June 2010, "usefully shared with NSA"', source: 0 },
    sources: [
      { label: 'The Intercept (2015): The Great SIM Heist: How Spies Stole the Keys to the Encryption Castle', url: 'https://theintercept.com/2015/02/19/great-sim-heist/' },
      DISCLOSURES,
    ],
  },
  {
    id: 'address-books',
    badge: 'ADDRESS BOOKS',
    title: 'Address books and buddy lists',
    agency: 'NSA',
    leak: 'snowden',
    year: 2013,
    summary:
      'The NSA intercepts email address books and instant-messaging buddy lists in bulk as they cross global data links, mostly when phones and computers sync contacts with Yahoo, Facebook and Google. ' +
      'On one typical day it collected 444,743 address books from Yahoo, 105,068 from Hotmail, 82,857 from Facebook and 33,697 from Gmail. ' +
      'The take sweeps in tens of millions of Americans, collected overseas under Executive Order 12333 so no court approves it.',
    accounts: ['yahoo', 'outlook', 'facebook', 'gmail', 'google'],
    flow: {
      data: 'Email address books and buddy lists',
      from: ['Yahoo', 'Hotmail', 'Facebook', 'Gmail', 'global data links'],
      to: ['NSA'],
      sharedWith: [],
      authority: 'Executive Order 12333',
      when: 'In bulk, overseas, whenever contacts sync',
      checkedBy: 'No court: the FISA Court does not approve collection made overseas',
    },
    scale: { value: 250000000, unit: 'address books a year', what: 'at the rate seen in the NSA documents', source: 1 },
    sources: [
      { label: 'The Washington Post (2013): NSA collects millions of e-mail address books globally', url: 'https://www.washingtonpost.com/world/national-security/nsa-collects-millions-of-e-mail-address-books-globally/2013/10/14/8e58b5be-34f9-11e3-80c6-7e6dd8d22d8f_story.html' },
      { label: 'The Christian Science Monitor (2013): NSA collects e-mail address lists: Can users be protected?', url: 'https://www.csmonitor.com/USA/2013/1015/NSA-collects-e-mail-address-lists-Can-users-be-protected' },
      DISCLOSURES,
    ],
  },
  {
    id: 'co-traveler',
    badge: 'CO-TRAVELER',
    title: 'CO-TRAVELER cellphone location tracking',
    agency: 'NSA',
    leak: 'snowden',
    year: 2013,
    summary:
      'The NSA gathers nearly five billion records a day on the whereabouts of cellphones around the world by tapping the cables that connect mobile networks, which carry US phones as well as foreign ones. ' +
      'Its CO-TRAVELER tool uses the data to find people whose movements cross those of known targets. ' +
      'The NSA sweeps up Americans\' locations along with the rest.',
    accounts: ['phone_carrier'],
    flow: {
      data: 'Cellphone location records',
      from: ['cables linking mobile networks worldwide'],
      to: ['NSA'],
      sharedWith: [],
      authority: 'none',
      when: 'Every day, for any phone the cables carry',
      checkedBy: 'No court named in the documents',
    },
    scale: { value: 5000000000, unit: 'location records a day', what: 'gathered on cellphones worldwide', source: 1 },
    sources: [
      { label: 'The Washington Post (2013): NSA tracking cellphone locations worldwide, Snowden documents show', url: 'https://www.washingtonpost.com/world/national-security/nsa-tracking-cellphone-locations-worldwide-snowden-documents-show/2013/12/04/5492873a-5cf2-11e3-bc56-c6ca94801fac_story.html' },
      { label: 'CBS News (2013): Report: NSA collects billions of cell phone records daily', url: 'https://www.cbsnews.com/news/report-nsa-collects-billions-of-cell-phone-records-daily' },
      { label: 'Al Jazeera (2013): US spy agency gathers data on phone locations', url: 'https://www.aljazeera.com/news/2013/12/5/us-spy-agency-gathers-data-on-phone-locations' },
    ],
  },
  {
    id: 'dishfire',
    badge: 'DISHFIRE',
    title: 'Dishfire',
    agency: 'NSA, shared with GCHQ',
    leak: 'snowden',
    year: 2014,
    summary:
      'The NSA collects almost 200 million text messages a day from across the globe and mines them for location, contact networks and credit card details. ' +
      'Dishfire collects "pretty much everything it can", not only the messages of surveillance targets, and pulls missed-call alerts, roaming alerts and payments out of automated texts. ' +
      'GCHQ uses the database to search "untargeted and unwarranted" messages of people in the UK.',
    accounts: ['phone_carrier'],
    flow: {
      data: 'Text messages and contacts, locations, border crossings, financial transactions',
      from: ['SMS traffic worldwide'],
      to: ['NSA'],
      sharedWith: ['GCHQ'],
      authority: 'none',
      when: 'Untargeted: every text it can reach, stored for months or years',
      checkedBy: 'No court named in the documents; GCHQ searches the metadata without a warrant',
    },
    scale: { value: 194000000, unit: 'text messages a day', what: 'collected on average in April 2011', source: 0 },
    sources: [
      { label: "The Guardian (2014): NSA collects millions of text messages daily in 'untargeted' global sweep", url: 'https://www.theguardian.com/world/2014/jan/16/nsa-collects-millions-text-messages-daily-untargeted-global-sweep' },
      W('Dishfire', 'DISHFIRE'),
      DISCLOSURES,
    ],
  },
  {
    id: 'smartphone-hacking',
    badge: 'iSPY',
    title: 'iSpy: the NSA\'s smartphone teams',
    agency: 'NSA and GCHQ',
    leak: 'snowden',
    year: 2013,
    summary:
      'The NSA set up task forces to break into Apple\'s iPhone and iOS and Google\'s Android, and GCHQ assigned a team to crack the BlackBerry. ' +
      'The NSA has small programs that spy on 38 different features of iOS, and it reads contacts, location, photos and the Facebook and Yahoo Messenger apps on a phone.',
    accounts: ['apple_id', 'google', 'facebook', 'yahoo'],
    flow: {
      data: 'Contacts, location, photos, app data from Facebook and Yahoo Messenger',
      from: ['iPhone (iOS)', 'Android', 'BlackBerry'],
      to: ['NSA', 'GCHQ'],
      sharedWith: [],
      authority: 'none',
      when: 'Against phones the NSA defines as targets',
      checkedBy: 'No court named in the documents',
    },
    sources: [
      { label: 'Der Spiegel (2013): iSpy: How the NSA Accesses Smartphone Data', url: 'https://www.spiegel.de/international/world/how-the-nsa-spies-on-smartphones-including-the-blackberry-a-921161.html' },
      DISCLOSURES,
    ],
  },
  {
    id: 'ant-catalog',
    badge: 'ANT CATALOG',
    title: 'The NSA ANT catalog',
    agency: 'NSA (Tailored Access Operations)',
    leak: 'reporting',
    year: 2013,
    summary:
      'A 50-page NSA catalog lists back doors into routers, firewalls, computers and hard drives from Cisco, Huawei, Juniper, Dell, Western Digital, Seagate and Samsung. ' +
      'DROPOUTJEEP is an implant for the Apple iPhone that pulls files, text messages and the contact list off the phone. ' +
      'Many of the tools install "remotely", over the internet, and some survive a wiped hard drive and a fresh operating system.',
    accounts: ['apple_id', 'smart_network', 'device_security'],
    flow: {
      data: 'Full control of the device: files, texts, contacts, network traffic',
      from: ['Apple iPhone', 'Cisco, Juniper and Huawei routers and firewalls', 'Dell computers', 'hard drives'],
      to: ['NSA'],
      sharedWith: [],
      authority: 'none',
      when: 'Against targets chosen by Tailored Access Operations',
      checkedBy: 'No court named in the documents; the companies said they knew nothing of it',
    },
    sources: [
      { label: 'Der Spiegel (2013): Catalog Reveals NSA Has Back Doors for Numerous Devices', url: 'https://www.spiegel.de/international/world/catalog-reveals-nsa-has-back-doors-for-numerous-devices-a-940994.html' },
      W('ANT catalog', 'ANT_catalog'),
    ],
  },
  {
    id: 'router-interdiction',
    badge: 'ROUTER IMPLANTS',
    title: 'Routers bugged in the mail',
    agency: 'NSA',
    leak: 'snowden',
    year: 2014,
    summary:
      'The NSA routinely intercepts routers, servers and other network devices being exported from the US, implants backdoor surveillance tools, repackages them with a factory seal and sends them on. ' +
      'Photos from a June 2010 NSA newsletter show NSA staff opening a Cisco router\'s shipping box and loading "beacon" firmware. ' +
      'An NSA manager called these "some of the most productive operations in TAO".',
    accounts: ['smart_network'],
    flow: {
      data: 'Access to whole networks and all their users',
      from: ['Cisco routers and other US-made network gear in shipping'],
      to: ['NSA'],
      sharedWith: [],
      authority: 'none',
      when: 'Before the device reaches its buyer',
      checkedBy: 'No court named in the documents',
    },
    sources: [
      { label: 'The Guardian (2014): Glenn Greenwald: how the NSA tampers with US-made internet routers', url: 'https://www.theguardian.com/books/2014/may/12/glenn-greenwald-nsa-tampers-us-internet-routers-snowden' },
      { label: 'Ars Technica (2014): Photos of an NSA "upgrade" factory show Cisco router getting implant', url: 'https://arstechnica.com/tech-policy/2014/05/photos-of-an-nsa-upgrade-factory-show-cisco-router-getting-implant/' },
      DISCLOSURES,
    ],
  },
]);
