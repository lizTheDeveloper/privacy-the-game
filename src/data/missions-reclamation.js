// ══════════════════════════════════════════════════════════════════
// THE RECLAMATION -- Chapter 8
// Data broker opt-outs, credit freezes, government ID defense.
// The endgame: getting your data back from the brokers who sell it.
// ══════════════════════════════════════════════════════════════════

const FREEZE_STATUS_DEBRIEF = [
  {
    id: "freeze_status",
    label: "Is your credit already frozen here?",
    options: [
      { value: "already-frozen", text: "Yes, already frozen", severity: "safe" },
      { value: "now-frozen", text: "Just froze it", severity: "safe" },
      { value: "no-account-yet', text: 'Need to create an account first -- I'll come back', severity: 'skip" },
      { value: "skip', text: 'Couldn't do this right now', severity: 'skip" },
    ],
  },
];

const FREEZE_EXTRAS_DEBRIEF = [
  {
    id: "freeze_extras",
    label: "Did you freeze these extra bureaus?",
    options: [
      { value: "both-frozen", text: "Both frozen -- Innovis and ChexSystems", severity: "safe" },
      { value: "one-frozen", text: "Got one, will come back for the other", severity: "warn" },
      { value: "skip', text: 'I'll come back to this', severity: 'skip" },
    ],
  },
];

const PINS_STORED_DEBRIEF = [
  {
    id: "pins_stored",
    label: "Are your freeze PINs stored safely?",
    options: [
      { value: "stored-both", text: "Yes -- in password manager AND printed", severity: "safe" },
      { value: "stored-digital", text: "In my password manager only", severity: "warn" },
      { value: "skip', text: 'I'll organize these later', severity: 'skip" },
    ],
  },
];

const BROKER_RECON_DEBRIEF = [
  {
    id: "broker_recon",
    label: "What did you find?",
    options: [
      { value: "not-found', text: 'Couldn't find myself on these sites', severity: 'safe" },
      { value: "found-some", text: "Found my info on some of them", severity: "warn" },
      { value: "found-all', text: 'I'm listed on all of them', severity: 'crit" },
      { value: "skip', text: 'I'll look later', severity: 'skip" },
    ],
  },
];

const OPTOUT_DEBRIEF = [
  {
    id: "optout_result",
    label: "How did the opt-outs go?",
    options: [
      { value: "all-submitted", text: "Submitted all of them", severity: "safe" },
      { value: "some-submitted", text: "Got through some -- will finish later", severity: "warn" },
      { value: "skip', text: 'I'll come back to this', severity: 'skip" },
    ],
  },
];

const DEFENSE_DEBRIEF = [
  {
    id: "defense_done",
    label: "Did you complete this?",
    options: [
      { value: "done', text: 'Yes, it's done', severity: 'safe" },
      { value: "already-done", text: "Already had this in place", severity: "safe" },
      { value: "skip', text: 'I'll come back to this', severity: 'skip" },
    ],
  },
];

const ID_SURVEY_DEBRIEF = [
  {
    id: "id_exposure",
    label: "How many services have a copy of your government ID?",
    options: [
      { value: "few", text: "Just a few (bank, employer)", severity: "safe" },
      { value: "moderate", text: "More than I expected (5-10)", severity: "warn" },
      { value: "many', text: 'A lot -- I've uploaded my ID everywhere', severity: 'crit" },
      { value: "skip', text: 'I'll think about this later', severity: 'skip" },
    ],
  },
];

const CREDIT_CHECK_DEBRIEF = [
  {
    id: "credit_report",
    label: "What did your credit reports show?",
    options: [
      { value: "all-clean", text: "Everything is mine -- no surprises", severity: "safe" },
      { value: "found-something', text: 'Found something I don't recognize', severity: 'warn" },
      { value: "found-fraud', text: 'Multiple accounts I didn't open', severity: 'crit" },
      { value: "skip', text: 'I'll pull reports later', severity: 'skip" },
    ],
  },
];

export const RECLAMATION_MISSIONS = [

  // ══════════════════════════════════════════════════════
  // CREDIT BUREAU FREEZE -- one mission per bureau
  // ══════════════════════════════════════════════════════
  {
    id: "credit_freeze-fortify-equifax",
    accountId: "credit_freeze",
    phase: "fortify",
    title: "Freeze Credit: Equifax",
    briefing: "A credit freeze prevents anyone from opening new credit in your name -- even if they have your Social Security number. It's free, takes five minutes, and is the single most effective defense against identity theft. Equifax is the bureau that leaked 147 million SSNs in 2017. Freeze them first.",
    steps: [
      { text: "Go to the Equifax Security Freeze page", url: "https://www.equifax.com/personal/credit-report-services/credit-freeze/" },
      { text: "Click \"Place a freeze\" -- you'll need to create an Equifax account if you don't have one" },
      { text: "Enter your name, SSN, date of birth, and address to verify your identity" },
      { text: "Once confirmed, Equifax gives you a PIN or confirmation number -- write it down immediately" },
      { text: "Save the PIN in your password manager AND write it on paper stored with your backup codes" },
    ],
    debriefQs: FREEZE_STATUS_DEBRIEF,
    scoutDialog: {
      briefing: "\"Equifax -- the bureau that leaked 147 million Social Security numbers in 2017 and then set up a breach-check website that was itself riddled with security problems. They've earned the right to be frozen first. Five minutes. Free. Blocks anyone from opening credit in your name through Equifax.\"",
      debrief: {
        "already-frozen": "\"Already frozen. Good. One of three major bureaus locked.\"",
        "now-frozen": "\"Equifax frozen. Save that PIN -- you'll need it to temporarily unfreeze when you apply for a mortgage, credit card, or apartment. Unfreezing is also free and takes effect within an hour.\"",
        "no-account-yet": "\"The account creation process is the longest part. Come back when you have ten minutes and your SSN handy.\"",
        "skip": "\"Don't sit on this one. A credit freeze is the single biggest bang-for-your-time security action you can take.\"",
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "credit_freeze-fortify-experian",
    accountId: "credit_freeze",
    phase: "fortify",
    title: "Freeze Credit: Experian",
    briefing: "Experian is the second major credit bureau. They're notorious for burying the free freeze option behind upsells for paid credit monitoring. Stay focused: the freeze is free and legally required. Monitoring is their upsell -- it only tells you about fraud after it happens, while a freeze prevents it.",
    steps: [
      { text: "Go to the Experian Security Freeze Center", url: "https://www.experian.com/freeze/center.html" },
      { text: "Click \"Add a Security Freeze\" -- ignore any prompts to sign up for CreditLock or monitoring" },
      { text: "Create an Experian account or log in -- verify your identity with your SSN and personal info" },
      { text: "Confirm the freeze and save the PIN or confirmation they provide" },
      { text: "If they redirect you to a paid product page, look for the small \"freeze\" link -- it's there, just hidden" },
    ],
    debriefQs: FREEZE_STATUS_DEBRIEF,
    scoutDialog: {
      briefing: "\"Experian will try very hard to sell you credit monitoring instead. You don't need it. A freeze is free and actually prevents fraud. Monitoring just sends you an alert after someone has already opened a credit card in your name. Ignore the upsells. Find the freeze.\"",
      debrief: {
        "already-frozen": "\"Already frozen. Two of three locked.\"",
        "now-frozen": "\"Experian frozen. They probably tried to sell you something on the way out -- that's their entire business model around freeze pages.\"",
        "no-account-yet": "\"Experian's account creation can be finicky. Come back with your SSN and some patience.\"",
        "skip": "\"Two out of three frozen still leaves one door open. Come back for this.\"",
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "credit_freeze-fortify-transunion",
    accountId: "credit_freeze",
    phase: "fortify",
    title: "Freeze Credit: TransUnion",
    briefing: "TransUnion is the third major bureau. With all three frozen, no one can open new credit in your name through any standard channel. This is the triple lock -- the most effective single defense against financial identity theft.",
    steps: [
      { text: "Go to the TransUnion Credit Freeze page", url: "https://www.transunion.com/credit-freeze" },
      { text: "Click \"Add a freeze\" and create a TransUnion account or log in" },
      { text: "Verify your identity with your SSN and personal details" },
      { text: "Confirm the freeze -- save the PIN with your other bureau PINs" },
    ],
    debriefQs: FREEZE_STATUS_DEBRIEF,
    scoutDialog: {
      briefing: "\"Last of the big three. After this, anyone who tries to open credit in your name hits a wall at every bureau. They can't even check your credit score without your PIN. The triple lock is the gold standard.\"",
      debrief: {
        "already-frozen": "\"All three major bureaus frozen. The triple lock is in place.\"",
        "now-frozen": "\"Triple lock achieved. Equifax, Experian, TransUnion -- all frozen. Nobody is opening credit in your name without your PINs.\"",
        "no-account-yet": "\"Almost there. Come back and finish this one -- two out of three is like locking two of three doors.\"",
        "skip": "\"You're close. This is the last of the big three.\"",
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "credit_freeze-fortify-extras",
    accountId: "credit_freeze",
    phase: "fortify",
    title: "Freeze the Hidden Bureaus: Innovis & ChexSystems",
    briefing: "Most people freeze the big three and stop. But Innovis is a fourth credit bureau used by some lenders, and ChexSystems tracks bank account applications. Without ChexSystems frozen, someone can open bank accounts in your name even with the big three locked. These are the gaps identity thieves walk through.",
    steps: [
      { text: "Go to Innovis Security Freeze", url: "https://www.innovis.com/personal/securityFreeze" },
      { text: "Fill out the freeze form -- same process as the big three (SSN, address, DOB)" },
      { text: "Then go to ChexSystems Security Freeze", url: "https://www.chexsystems.com/security-freeze" },
      { text: "Fill out their freeze request -- this blocks fraudulent bank account openings" },
      { text: "Save both PINs with your other freeze PINs" },
    ],
    debriefQs: FREEZE_EXTRAS_DEBRIEF,
    scoutDialog: {
      briefing: "\"Everyone gets Equifax, Experian, TransUnion. Almost nobody gets Innovis and ChexSystems. That's the gap. ChexSystems is how identity thieves open bank accounts when credit bureaus are locked -- banks check ChexSystems, not the big three, for new account applications.\"",
      debrief: {
        "both-frozen": "\"Five bureaus frozen. You just closed the gaps most people don't even know exist.\"",
        "one-frozen": "\"One down. Come back for the other -- ChexSystems is the one that blocks bank account fraud.\"",
        "skip": "\"The big three are the priority, but these close real gaps. Come back when you have ten minutes.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "credit_freeze-reclaim-pins",
    accountId: "credit_freeze",
    phase: "reclaim",
    title: "Secure Your Freeze PINs",
    briefing: "You now have up to five freeze PINs. Losing a PIN means calling bureau phone trees and going through identity verification to get a replacement -- which can take weeks. Store them in two places: your password manager (for quick access) and a printed sheet (for if you lose access to your password manager).",
    steps: [
      { text: "Gather all freeze PINs: Equifax, Experian, TransUnion, Innovis, ChexSystems" },
      { text: "Create an entry in your password manager for each bureau with the PIN and login info" },
      { text: "Print a sheet with all five PINs and store it with your backup codes (not on your phone or computer)" },
      { text: "Test: can you find each PIN from both your password manager and the printed sheet?" },
    ],
    debriefQs: PINS_STORED_DEBRIEF,
    scoutDialog: {
      briefing: "\"A freeze PIN is the key to your credit lock. Lose it and you're on hold with bureau phone systems for days while someone named 'AI Virtual Assistant' asks you to describe your issue. Print them. Store them. Don't trust a single device.\"",
      debrief: {
        "stored-both": "\"PINs secured in two places. The Credit Bureau Freeze building is fully liberated -- locked down and the keys are safe.\"",
        "stored-digital": "\"Good start, but a single point of failure. Print a backup. If you lose access to your password manager, you lose access to your credit freeze PINs.\"",
        "skip": "\"Don't skip this. A freeze without recoverable PINs is a different kind of locked out.\"",
      },
    },
    estimatedMinutes: 5,
  },

  // ══════════════════════════════════════════════════════
  // PEOPLE-SEARCH BROKERS -- search, then batched opt-outs
  // ══════════════════════════════════════════════════════
  {
    id: "people_search-recon-find-yourself",
    accountId: "people_search",
    phase: "recon",
    title: "Find Yourself on People-Search Sites",
    briefing: "Data brokers compile your name, address, phone number, email, age, and relatives -- then publish it for anyone to search. Before we start removing you, let's see how bad it is. Search your full name on a few of the biggest sites and see what comes up.",
    steps: [
      { text: "Go to Spokeo and search your full name", url: "https://www.spokeo.com" },
      { text: "Go to Whitepages and search your name + city", url: "https://www.whitepages.com" },
      { text: "Go to TruePeopleSearch and search your name", url: "https://www.truepeoplesearch.com" },
      { text: "Note what's visible: your address, phone number, age, relatives, past addresses" },
    ],
    debriefQs: BROKER_RECON_DEBRIEF,
    scoutDialog: {
      briefing: "\"People-search sites are the retail layer of the data broker economy. They buy records from public sources, purchase histories, loyalty programs, and court records, then publish your profile for anyone to search. Your name, address, phone number, age, relatives -- it's all there. Let's see how much.\"",
      debrief: {
        "not-found": "\"Rare. Either you've been through this before, or you've lived an unusually private life. Let's check the deeper layers too.\"",
        "found-some": "\"Some exposure. That's typical. The opt-out process is tedious but each broker has a web form. We'll work through them in small batches.\"",
        "found-all": "\"Everywhere. Also typical, unfortunately. The good news: every broker is legally required to process your opt-out. The bad news: there are a lot of them. Let's start.\"",
        "skip": "\"This one's worth seeing. Knowing what's out there is the first step to taking it back.\"",
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "people_search-fortify-web-forms",
    accountId: "people_search",
    phase: "fortify",
    title: "The Big Purge: Web Form Brokers",
    briefing: "These five brokers all have simple web form opt-outs: search for your listing, paste the URL or enter your email, click remove. Each one takes 2-3 minutes. Most removals process within 24-72 hours.",
    steps: [
      { text: "Spokeo: Go to their opt-out page, search for your listing, paste the URL, enter your email, click \"Remove this listing\"", url: "https://www.spokeo.com/optout" },
      { text: "Whitepages: Go to suppression requests, search your name, find your listing, request removal", url: "https://www.whitepages.com/suppression-requests" },
      { text: "BeenVerified: Go to their opt-out FAQ, follow the steps to search and remove", url: "https://www.beenverified.com/faq/opt-out/" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Three brokers, three web forms, three minutes each. Spokeo, Whitepages, BeenVerified. These are the highest-traffic people-search sites -- removing yourself here has the biggest impact per minute of effort.\"",
      debrief: {
        "all-submitted": "\"Three down. Most take 24-72 hours to process -- check back in a few days to confirm your listings are gone.\"",
        "some-submitted": "\"Each one you finish is one fewer place your info is listed. Come back for the rest.\"",
        "skip": "\"These are quick wins -- three minutes each. Worth the time.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "people_search-fortify-removal-links",
    accountId: "people_search",
    phase: "fortify",
    title: "The Big Purge: Removal Link Brokers",
    briefing: "These brokers have dedicated removal pages. Intelius and TruePeopleSearch require you to find your listing first, then click through to their removal flow. FastPeopleSearch and Radaris have their own privacy/removal portals.",
    steps: [
      { text: "Intelius: Go to opt-out, search for yourself, request removal", url: "https://www.intelius.com/opt-out" },
      { text: "TruePeopleSearch: Go to removal page, find your record, submit removal", url: "https://www.truepeoplesearch.com/removal" },
      { text: "FastPeopleSearch: Go to removal, find your listing, click remove", url: "https://www.fastpeoplesearch.com/removal" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Second wave. Intelius, TruePeopleSearch, FastPeopleSearch. Skip tracers and private investigators use these. Each one you remove narrows the field of places someone can look you up for free.\"",
      debrief: {
        "all-submitted": "\"Six brokers down total. You're systematically dismantling your public profile. Most people never get this far.\"",
        "some-submitted": "\"Every form you submit is progress. The links aren't going anywhere.\"",
        "skip": "\"These are slightly lower traffic than the first batch but still widely used. Come back when you have ten minutes.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "people_search-fortify-privacy-portals",
    accountId: "people_search",
    phase: "fortify",
    title: "The Big Purge: Privacy Portal Brokers",
    briefing: "The remaining people-search brokers. Radaris has a privacy control center. USPhonebook, ThatsThem, PeopleFinder, and Nuwber each have their own opt-out links. MyLife is the worst -- they assign you a public \"reputation score\" that needs to be removed separately.",
    steps: [
      { text: "Radaris: Go to privacy control, search your name, request removal", url: "https://radaris.com/control/privacy" },
      { text: "USPhonebook: Submit opt-out", url: "https://www.usphonebook.com/opt-out" },
      { text: "ThatsThem: Submit opt-out", url: "https://thatsthem.com/optout" },
      { text: "PeopleFinder: Submit opt-out", url: "https://www.peoplefinder.com/optout" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"The long tail. These individually get less traffic but collectively they're a big surface. Every one you remove is one fewer copy of your personal information floating around for anyone to find.\"",
      debrief: {
        "all-submitted": "\"Ten brokers cleared. The retail layer is thinning out. A few more and we hit the nuclear option.\"",
        "some-submitted": "\"Steady progress. Every form submitted is one fewer listing.\"",
        "skip": "\"Come back in small batches. Two or three at a time is fine.\"",
      },
    },
    estimatedMinutes: 12,
  },
  {
    id: "people_search-reclaim-stragglers",
    accountId: "people_search",
    phase: "reclaim",
    title: "The Stragglers + California DROP",
    briefing: "The last individual brokers -- including MyLife, which publishes a public \"reputation score\" for you -- plus the nuclear option: California's DELETE Act (DROP) platform. DROP sends a single deletion request to 600+ registered data brokers at once. It works even if you're not in California.",
    steps: [
      { text: "MyLife: Request opt-out and removal of your \"reputation score\"", url: "https://www.mylife.com/privacy-policy#opt-out" },
      { text: "Nuwber: Submit removal request", url: "https://nuwber.com/removal/link" },
      { text: "ClustrMaps: Submit opt-out", url: "https://clustrmaps.com/bl/opt-out" },
      { text: "California DROP: Submit one request covering 600+ registered brokers", url: "https://privacy.ca.gov/drop/" },
      { text: "Google Results About You: Request removal of personal info from search results", url: "https://support.google.com/websearch/troubleshooter/9685456" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"MyLife publishes a public 'reputation score' for you that anyone can see -- get it removed. And then the California DROP. One form, 600+ brokers. The DELETE Act requires every registered data broker to process your request. $200/day fines per unfulfilled request. The CPPA has a dedicated enforcement strike force. This is the closest thing to a nuke in data broker defense.\"",
      debrief: {
        "all-submitted": "\"People-Search Brokers: liberated. Thirteen individual opt-outs plus the DROP covering 600 more. Your name is being scrubbed from the retail layer of the data economy. Brokers re-add you from public records over time -- check back every 3-6 months.\"",
        "some-submitted": "\"The California DROP alone covers hundreds of brokers. If you can only do one thing in this batch, do that.\"",
        "skip": "\"The DROP platform is the single highest-impact form in this whole district. Start there when you come back.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // ══════════════════════════════════════════════════════
  // ENTERPRISE DATA AGGREGATORS
  // ══════════════════════════════════════════════════════
  {
    id: "enterprise_data-recon-supply-chain",
    accountId: "enterprise_data",
    phase: "recon",
    title: "Intel Brief: The Data Supply Chain",
    briefing: "People-search sites are the retail end of the data broker economy. Enterprise aggregators are the wholesale end. Companies like LexisNexis, Thomson Reuters, and CoreLogic buy records from courts, utilities, employers, and DMVs -- then repackage everything into profiles they sell to banks, insurers, employers, landlords, and law enforcement. Even if you removed yourself from Spokeo and Whitepages, LexisNexis still has your data because they buy from different sources. You have to opt out of both layers.",
    steps: [
      { text: "Read what LexisNexis collects about you on their opt-out page", url: "https://optout.lexisnexis.com/" },
      { text: "Read about Thomson Reuters CLEAR -- this is the tool investigators use", url: "https://legalsolutions.thomsonreuters.com/law-products/clear/consumer-privacy-form" },
      { text: "Look up Equifax Workforce Solutions (The Work Number) -- your employer reports your salary here every pay period", url: "https://www.equifax.com/personal/help/workforce-solutions-contact/" },
      { text: "Take in the supply chain: public records → brokers → aggregators → banks, insurers, landlords, law enforcement" },
    ],
    debriefQs: BROKER_RECON_DEBRIEF,
    scoutDialog: {
      briefing: "\"People-search sites are the corner stores. Enterprise aggregators are the warehouses. LexisNexis sells to law enforcement, insurance, and landlords. Thomson Reuters CLEAR is what investigators actually use to find people. CoreLogic knows every property you've ever rented or owned. And Equifax Workforce Solutions -- separate from your credit file -- has your employment and salary history because your employer reports every paycheck there. The supply chain goes: public records flow into brokers, brokers sell to aggregators, aggregators sell to banks, insurers, landlords, and law enforcement. You have to cut the chain at every level.\"",
      debrief: {
        "not-found": "\"Unusual. Either you're very new to the system or very good at staying out of it.\"",
        "found-some": "\"Some enterprise exposure. Normal -- these companies have been building profiles for decades.\"",
        "found-all": "\"Deep exposure. These aggregators have been compiling your data since before you had an email address. But they're all subject to opt-out laws.\"",
        "skip": "\"This briefing is dense. Come back when you have time to absorb it -- understanding the supply chain matters for what comes next.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "enterprise_data-fortify-lexisnexis",
    accountId: "enterprise_data",
    phase: "fortify",
    title: "Opt Out: LexisNexis",
    briefing: "LexisNexis is one of the two largest enterprise data aggregators. They sell your data to law enforcement, insurance companies, landlords, and background check services. Your CLUE report -- your insurance claims history -- lives here. Opting out involves submitting a form and verifying your identity.",
    steps: [
      { text: "Go to the LexisNexis Consumer Opt-Out page", url: "https://optout.lexisnexis.com/" },
      { text: "Select \"Consumer Opt Out\" and fill in your personal information" },
      { text: "They may ask for identity verification -- have your ID ready" },
      { text: "Submit the request -- processing takes several weeks" },
    ],
    debriefQs: DEFENSE_DEBRIEF,
    scoutDialog: {
      briefing: "\"LexisNexis has your insurance claims history, address history, and sometimes criminal records. Every landlord background check, every insurance quote -- they pull from LexisNexis. This is one of the two most important enterprise opt-outs you can do.\"",
      debrief: {
        "done": "\"LexisNexis opt-out submitted. This takes weeks to process -- they're not in a hurry. But they're legally required to comply.\"",
        "already-done": "\"Already opted out. Good -- this is one most people never think to do.\"",
        "skip": "\"High priority. LexisNexis feeds data to thousands of downstream services.\"",
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "enterprise_data-fortify-thomson",
    accountId: "enterprise_data",
    phase: "fortify",
    title: "Opt Out: Thomson Reuters CLEAR",
    briefing: "Thomson Reuters CLEAR is the primary tool used by investigators and law enforcement for skip tracing and background checks. Thomson Reuters only has a consumer opt-out because a $27.5 million class-action settlement forced them to create one. That should tell you how much they valued keeping your data.",
    steps: [
      { text: "Go to the Thomson Reuters CLEAR consumer privacy form", url: "https://legalsolutions.thomsonreuters.com/law-products/clear/consumer-privacy-form" },
      { text: "Fill in your personal information for the privacy request" },
      { text: "Submit the form -- they may follow up with identity verification" },
    ],
    debriefQs: DEFENSE_DEBRIEF,
    scoutDialog: {
      briefing: "\"Thomson Reuters CLEAR is what law enforcement and private investigators actually use to find people. They only have this opt-out page because a $27.5 million lawsuit forced them to create it. Before that, there was no way for consumers to request removal. That tells you everything about how the data broker industry treats your information.\"",
      debrief: {
        "done": "\"Thomson Reuters CLEAR opt-out submitted. The two biggest wholesale data brokers are now processing your removal.\"",
        "already-done": "\"Already submitted. You're thorough.\"",
        "skip": "\"This one matters. Thomson Reuters feeds investigative databases across the country.\"",
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "enterprise_data-fortify-property",
    accountId: "enterprise_data",
    phase: "fortify",
    title: "Opt Out: CoreLogic & TransUnion TLO",
    briefing: "CoreLogic owns the property records database behind every landlord background check -- your rental history, ownership records, and tenant screening data. TransUnion TLO is TransUnion's skip-tracing product, separate from your credit file. Freezing your credit does NOT freeze TLO. You have to opt out separately.",
    steps: [
      { text: "Submit a CoreLogic consumer privacy request", url: "https://www.corelogic.com/privacy/consumer-data-privacy-request/" },
      { text: "Submit a TransUnion consumer privacy request (TLO is included)", url: "https://www.transunion.com/consumer-privacy" },
      { text: "Note: TransUnion TLO is separate from your credit freeze -- opting out here does not affect your credit file or freeze" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"CoreLogic knows every property you've ever rented or owned. Every landlord background check flows through them. TransUnion TLO is their skip-tracing product -- it's a separate database from your credit file. Freezing your credit at TransUnion does NOT freeze TLO. You have to opt out separately. Most people don't know this.\"",
      debrief: {
        "all-submitted": "\"Property and skip-tracing databases -- both processing your removal. Two more layers of the supply chain severed.\"",
        "some-submitted": "\"One down. Come back for the other -- both matter if you've ever rented.\"",
        "skip": "\"If landlords and background checks matter to you, these are high priority.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "enterprise_data-reclaim-deep-layer",
    accountId: "enterprise_data",
    phase: "reclaim",
    title: "The Deep Layer: Remaining Aggregators",
    briefing: "The rest of the wholesale layer. Verisk has every auto and home insurance claim you've filed. Equifax Workforce Solutions (The Work Number) has your salary from every paycheck -- your employer reports it there. Data Axle has 300 million consumer records. Sift Science assigns you a secret \"trust score\" based on your behavior across websites. These are the companies nobody's heard of that have the most data.",
    steps: [
      { text: "Opt out of Verisk / ISO ClaimSearch (insurance claims)", url: "https://www.verisk.com/privacy-notice/" },
      { text: "Contact Equifax Workforce Solutions about your data (The Work Number)", url: "https://www.equifax.com/personal/help/workforce-solutions-contact/" },
      { text: "Opt out of Data Axle (300M consumer records)", url: "https://www.data.com/consumer-access/" },
      { text: "Request your Sift Science trust score, then opt out", url: "https://sift.com/service-privacy" },
      { text: "Opt out of Merlin Information Services (utility connection records)", url: "https://merlindata.com/consumer-opt-out/" },
      { text: "Opt out of Tracers (debt collectors and PIs)", url: "https://www.tracersinfo.com/consumer-privacy/" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"The deep layer. Equifax Workforce Solutions has your salary from every paycheck your employer has ever reported -- and they sell it to landlords and lenders. Verisk has every insurance claim you've filed. Sift Science assigns you a secret 'trust score' based on your behavior across hundreds of websites that use their API. Data Axle has 300 million consumer records from mailing lists and purchase histories. Merlin knows when you turned on your electricity, which means they know when you moved. This is the infrastructure of the surveillance economy. Every form you submit rips another wire out of the machine.\"",
      debrief: {
        "all-submitted": "\"Enterprise Aggregators: liberated. The wholesale layer of the data supply chain is processing your removal. Retail (people-search) and wholesale (enterprise) -- both dismantled.\"",
        "some-submitted": "\"Every form is another data pipeline severed. Equifax Workforce and Sift Science are the ones most people don't know about -- prioritize those.\"",
        "skip": "\"Start with Equifax Workforce Solutions when you come back -- they have your salary history.\"",
      },
    },
    estimatedMinutes: 20,
  },

  // ══════════════════════════════════════════════════════
  // AD & TRACKING NETWORKS
  // ══════════════════════════════════════════════════════
  {
    id: "ad_trackers-recon-understand",
    accountId: "ad_trackers",
    phase: "recon",
    title: "Intel Brief: Ad & Tracking Brokers",
    briefing: "People-search brokers sell your identity. Ad data brokers sell your behavior -- what you browse, buy, search for, and where you go. These profiles include your real name, email, phone, home address, and detailed behavioral data. The distinction matters: people-search opt-outs remove your public records. Ad network opt-outs remove your behavioral profile.",
    steps: [
      { text: "Check what Google knows about your ad profile", url: "https://myadcenter.google.com/personalization" },
      { text: "Check what Meta/Facebook knows about your ad profile", url: "https://www.facebook.com/adpreferences/ad_settings" },
      { text: "On your phone, check how many apps have tracking permission (iOS: Settings → Privacy → Tracking)" },
    ],
    debriefQs: BROKER_RECON_DEBRIEF,
    scoutDialog: {
      briefing: "\"Three layers of data brokers, three kinds of data. People-search sells your identity. Enterprise aggregators sell your records. Ad brokers sell your behavior -- what you buy, where you go, what you read, what you search for. Together, they let a stranger build a complete picture of who you are. We cleared the first two layers. This is the third.\"",
      debrief: {
        "not-found": "\"Minimal tracking footprint. Either you're already using privacy tools or you don't use many apps.\"",
        "found-some": "\"Some behavioral tracking. Google and Meta are the biggest -- we'll tackle them plus the bulk opt-out tools.\"",
        "found-all": "\"Deep behavioral tracking. That's the default for anyone who uses the internet normally. The good news: bulk opt-out tools cover a hundred networks at once.\"",
        "skip": "\"Understanding what's being tracked is step one. Come back when you have a few minutes.\"",
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "ad_trackers-fortify-bulk",
    accountId: "ad_trackers",
    phase: "fortify",
    title: "Bulk Opt-Out: 100+ Ad Networks",
    briefing: "The NAI Consumer Opt-Out and DAA WebChoices tools let you opt out of targeted advertising from over a hundred ad networks in one session. Also: disable your phone's advertising ID (the unique identifier that ties your app usage to your real identity) and install Global Privacy Control (built into Firefox, Brave, and DuckDuckGo), which California law requires businesses to honor as an opt-out.",
    steps: [
      { text: "Run the NAI Consumer Opt-Out -- covers 100+ ad networks", url: "https://optout.networkadvertising.org/" },
      { text: "Run the DAA WebChoices opt-out", url: "https://optout.aboutads.info/" },
      { text: "Disable your advertising ID -- iOS: Settings → Privacy → Tracking → toggle off; Android: Settings → Privacy → Ads → Delete advertising ID" },
      { text: "Install or switch to a browser with Global Privacy Control built in (Firefox, Brave, or DuckDuckGo)" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Two tools, one hundred-plus networks. NAI and DAA are industry self-regulation -- they work because the alternative is government regulation, which ad networks fear more. Global Privacy Control is the legal hammer: California law requires every business to treat the GPC signal as an opt-out of data sale and sharing. And disabling your advertising ID breaks the link between your apps and your real identity. This is the most efficient mission in the whole district.\"",
      debrief: {
        "all-submitted": "\"Bulk opt-outs submitted, GPC installed, ad ID disabled. You just went dark to the advertising tracking layer. They can still show you ads -- they just can't target them based on your behavioral profile.\"",
        "some-submitted": "\"The NAI opt-out alone covers the most networks. Come back for the rest.\"",
        "skip": "\"The bulk tools are the highest leverage here -- one session covers a hundred networks.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "ad_trackers-fortify-platforms",
    accountId: "ad_trackers",
    phase: "fortify",
    title: "Platform Settings: Google, Meta, Apple",
    briefing: "Google, Meta, and Apple are the three biggest advertising platforms. Each has ad personalization settings that control how much of your data feeds their ad targeting. Google and Meta default to maximum tracking. Apple defaults to asking per-app since iOS 14.5. These settings are buried but powerful.",
    steps: [
      { text: "Google: Turn off Ad Personalization", url: "https://myadcenter.google.com/personalization" },
      { text: "Meta: Go to Ad Preferences → Ad Settings, limit data use for ads", url: "https://www.facebook.com/adpreferences/ad_settings" },
      { text: "Apple: Review App Tracking Transparency settings", url: "https://support.apple.com/en-us/HT212025" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Every 'personalized experience' toggle is a euphemism for 'we watch what you do and tell advertisers about it.' You can turn most of them off without the service noticeably degrading. They just won't admit that on the settings page.\"",
      debrief: {
        "all-submitted": "\"Big three platforms limited. You'll still see ads -- they just won't be eerily specific about that thing you searched for yesterday.\"",
        "some-submitted": "\"Google and Meta are the two that matter most.\"",
        "skip": "\"Buried but powerful settings. Come back when you have ten minutes.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "ad_trackers-reclaim-individual",
    accountId: "ad_trackers",
    phase: "reclaim",
    title: "Individual Opt-Outs: The Invisible Brokers",
    briefing: "These are the behind-the-scenes ad data brokers most people never hear of. LiveRamp ties your offline identity to your online activity. Acxiom has been building consumer profiles since the 1960s. Oracle Data Cloud tracks browsing across millions of sites. These companies are invisible by design -- nobody opts out of a company they've never heard of. That's the business model.",
    steps: [
      { text: "Opt out of LiveRamp -- they match your real name to your browser cookies", url: "https://liveramp.com/opt_out/" },
      { text: "Opt out of Acxiom -- one of the oldest and largest consumer data brokers", url: "https://isapps.acxiom.com/optout/optout.aspx" },
      { text: "Opt out of Oracle Data Cloud / BlueKai", url: "https://www.oracle.com/legal/privacy/advertising-privacy-policy.html#optout" },
      { text: "Opt out of Lotame (cross-device audience data)", url: "https://www.lotame.com/about-lotame/privacy/lotames-products-services-privacy-policy/" },
      { text: "Opt out of Epsilon (breached in 2019)", url: "https://www.epsilon.com/us/consumer-information" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"LiveRamp is the company that connects your real name to your browser cookies -- they're the reason ads follow you across devices. Acxiom has been building consumer profiles since before the internet existed. They started with direct mail in the 1960s. These companies are invisible by design. Nobody opts out of a company they've never heard of. That's the business model. Until now.\"",
      debrief: {
        "all-submitted": "\"Ad & Tracking Networks: liberated. Bulk opt-outs, platform settings, and the invisible brokers -- you just disconnected from the behavioral tracking layer. Three layers of the data economy dismantled: retail, wholesale, and advertising.\"",
        "some-submitted": "\"Every opt-out is one fewer company profiling your behavior. Come back for the rest.\"",
        "skip": "\"Lower urgency than people-search and enterprise, but these are the ones that make ads feel like surveillance.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // ══════════════════════════════════════════════════════
  // LOCATION DATA BROKERS
  // ══════════════════════════════════════════════════════
  {
    id: "location_brokers-recon-understand",
    accountId: "location_brokers",
    phase: "recon",
    title: "Intel Brief: Location Data Brokers",
    briefing: "Location data brokers buy raw GPS coordinates from apps on your phone, then sell \"anonymized\" movement patterns. The data is almost never truly anonymous -- a daily path from one house to one workplace identifies exactly one person. This data has been used to track people visiting abortion clinics, mosques, protest sites, and immigration lawyers. X-Mode Social sold location data from Muslim prayer apps to US military contractors. Gravy Analytics was breached in January 2025, exposing millions of people's movements. Near Intelligence sold location data of Planned Parenthood visitors to anti-abortion groups.",
    steps: [
      { text: "Go to your phone's Location Services settings (iOS: Settings → Privacy → Location Services)" },
      { text: "Count how many apps have \"Always\" access vs \"While Using\" vs \"Never\"" },
      { text: "Look for apps that have no reason to know your location -- games, calculators, flashlights, social media" },
      { text: "Note: every app with location permission is a potential feed into the location data pipeline" },
    ],
    debriefQs: [
      {
        id: "location_review",
        label: "How many apps have location access?",
        options: [
          { value: "few-apps", text: "Very few -- most are set to Never", severity: "safe" },
          { value: "more-than-expected", text: "More than I expected", severity: "warn" },
          { value: "many-apps", text: "Dozens of apps have location permission", severity: "crit" },
          { value: "skip', text: 'I'll check later', severity: 'skip" },
        ],
      },
    ],
    scoutDialog: {
      briefing: "\"This is where privacy becomes a safety issue. Location data has been used to track people visiting abortion clinics, mosques, protest sites, and immigration lawyers. This isn't theoretical -- it happened. X-Mode Social sold GPS data from Muslim prayer apps to US military contractors. Near Intelligence sold Planned Parenthood visitor data to anti-abortion groups -- then filed for bankruptcy when it was exposed. Gravy Analytics was breached in 2025 and millions of people's movements were dumped online. The data comes from apps on your phone. Every app with location permission is a potential feed into this pipeline.\"",
      debrief: {
        "few-apps": "\"Tight permissions. Most apps should be 'While Using' or 'Never.' You're ahead of most people on the most sensitive data category.\"",
        "more-than-expected": "\"More than expected. That's normal -- apps ask for location during setup and most people tap Allow without thinking. Time to review and tighten.\"",
        "many-apps": "\"Dozens of feeds into the location data market. Let's shut most of them off.\"",
        "skip": "\"Come back to this. Location data is the most sensitive thing data brokers trade.\"",
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "location_brokers-fortify-phone",
    accountId: "location_brokers",
    phase: "fortify",
    title: "Lock Down Phone Location Permissions",
    briefing: "The most effective defense against location data brokers is restricting which apps can see your GPS. Set everything to \"While Using\" or \"Never\" except navigation apps. Apps set to \"Always\" broadcast your coordinates around the clock -- that data enters the ad bidstream and can be bought by anyone.",
    steps: [
      { text: "Open Settings → Privacy → Location Services on your phone" },
      { text: "Review every app. Set most to \"While Using\" or \"Never\"" },
      { text: "Only maps and ride-sharing should be \"While Using.\" Nothing should be \"Always\" unless you have a specific reason" },
      { text: "Deny location entirely to games, calculators, flashlights, shopping apps, and social media" },
    ],
    debriefQs: DEFENSE_DEBRIEF,
    scoutDialog: {
      briefing: "\"Every app set to 'Always' is broadcasting your coordinates to its servers around the clock. That data gets sold through the ad bidstream to anyone who buys it -- hedge funds, governments, anti-abortion groups, military contractors. Set everything to 'While Using' or 'Never.' Your flashlight does not need to know where you are.\"",
      debrief: {
        "done": "\"Location permissions locked down. You just cut off the primary data feed that location brokers rely on.\"",
        "already-done": "\"Already locked down. Good -- you're ahead of most people on the most sensitive category of data.\"",
        "skip": "\"This is the single most impactful thing you can do for location privacy. Five minutes in Settings.\"",
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "location_brokers-fortify-optout",
    accountId: "location_brokers",
    phase: "fortify",
    title: "Opt Out: Location Data Companies",
    briefing: "Individual opt-outs from the major location data brokers. Most require an email rather than a web form -- these companies don't make it easy. SafeGraph sells foot-traffic data to hedge funds. X-Mode (now Outlogic) sold prayer app data to the military. Gravy Analytics was breached in 2025.",
    steps: [
      { text: "Opt out of SafeGraph -- email privacy@safegraph.com citing your right to data deletion", url: "https://www.safegraph.com/privacy-policy" },
      { text: "Opt out of X-Mode Social (Outlogic) via their web form", url: "https://xmode.io/opt-out/" },
      { text: "Opt out of Placer.ai -- email privacy@placer.ai", url: "https://www.placer.ai/privacy" },
      { text: "Opt out of Gravy Analytics -- email privacy@gravyanalytics.com", url: "https://gravyanalytics.com/privacy/" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"These companies buy your GPS data from apps, package it into movement profiles, and sell it. SafeGraph to hedge funds. X-Mode to the US military. Near Intelligence to anti-abortion groups. Most hide their opt-outs behind email addresses instead of web forms. They're betting you won't bother. Prove them wrong.\"",
      debrief: {
        "all-submitted": "\"Location broker opt-outs submitted. Email ones take longer -- follow up if you don't get confirmation within 30 days.\"",
        "some-submitted": "\"Partial progress. X-Mode and SafeGraph are the highest priority if you can only do two.\"",
        "skip": "\"Location data is the most sensitive category. Come back when you can send a few emails.\"",
      },
    },
    estimatedMinutes: 12,
  },
  {
    id: "location_brokers-reclaim-legal",
    accountId: "location_brokers",
    phase: "reclaim",
    title: "Legal Tools: DROP + GDPR + Complaints",
    briefing: "For location brokers without opt-out pages -- or to catch ones you missed -- use the legal tools. California DROP covers Gravy Analytics (they're registered). GDPR erasure requests work for EU/UK data. And filing complaints creates the paper trail regulators use to build enforcement cases -- the FTC has banned three location brokers since 2024.",
    steps: [
      { text: "Submit through California DROP (covers Gravy Analytics and hundreds more)", url: "https://privacy.ca.gov/drop/" },
      { text: "Generate a GDPR erasure request if applicable (EU/UK)", url: "https://www.datarequests.org/generator/" },
      { text: "If any broker ignores your request: file an FTC complaint", url: "https://reportfraud.ftc.gov/" },
      { text: "Also file with the California Privacy Protection Agency (CPPA)", url: "https://cppa.ca.gov/complaints/" },
    ],
    debriefQs: OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: "\"When there is no opt-out page, that does not mean no legal obligation to delete your data. Having no web form is a bet that you won't send a letter. Make them lose that bet. The FTC banned three location data brokers since 2024. Venntel was ordered to delete all previously collected data. Your request matters even when it's ignored -- it becomes evidence in the next enforcement case. Your letter is part of the paper trail that makes lawsuits and regulations possible.\"",
      debrief: {
        "all-submitted": "\"Location Data Brokers: liberated. Phone permissions locked, individual opt-outs sent, legal tools deployed. You've dismantled the location tracking layer as thoroughly as an individual can. Check phone permissions whenever you install a new app.\"",
        "some-submitted": "\"California DROP is the highest leverage. One form, hundreds of brokers.\"",
        "skip": "\"The DROP platform is the most important tool here. Start there when you come back.\"",
      },
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // GOVERNMENT ID DEFENSE
  // ══════════════════════════════════════════════════════
  {
    id: "govt_id_defense-recon-who-has-it",
    accountId: "govt_id_defense",
    phase: "recon",
    title: "Survey: Who Has Your Government ID?",
    briefing: "Your driver's license isn't just in your wallet -- it's in databases at every service that ever asked you to verify your identity. When one gets breached, attackers get a copy. Unlike a password, you can't change your face or license number. The list is longer than you think: banks, employers, landlords, car rental, rideshare, crypto, dating apps, telehealth, insurance, background check companies, and the ID verification services themselves (ID.me, Jumio, Onfido).",
    steps: [
      { text: "Think through every time you uploaded or showed a photo of your ID" },
      { text: "Banks, employers (I-9 verification), landlords (rental applications)" },
      { text: "Car rental, rideshare/gig platforms (Uber, Lyft), crypto exchanges (Coinbase, Kraken)" },
      { text: "Dating apps with verification, social media verification, age verification services" },
      { text: "Online notary, telehealth, insurance, hotels, background check companies (Checkr, HireRight)" },
      { text: "ID verification services themselves: ID.me, Jumio, Onfido -- and government portals that use them" },
    ],
    debriefQs: ID_SURVEY_DEBRIEF,
    scoutDialog: {
      briefing: "\"The list is longer than you think. Every time someone asked for a photo of your ID, that photo went into a database. And the ID verification services -- ID.me, Jumio, Onfido -- are the companies that other companies hire to check your license. A single breach at one of them exposes millions of government IDs at once. You cannot un-breach a driver's license. The defense is layering other protections on top.\"",
      debrief: {
        "few": "\"Limited exposure. Still worth setting up the layered defenses -- IRS PIN and SSA lock are free and block the most common identity theft vectors.\"",
        "moderate": "\"More than expected. Each service with your ID is a potential breach surface. Let's layer defenses.\"",
        "many": "\"Widely distributed. The defense isn't retrieval -- it's layering: credit freeze (done), IRS PIN, SSA lock, fraud alerts. These make a stolen ID much harder to exploit.\"",
        "skip": "\"Think about this when you have time. The list is longer than most people expect.\"",
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "govt_id_defense-fortify-irs-pin",
    accountId: "govt_id_defense",
    phase: "fortify",
    title: "Get an IRS Identity Protection PIN",
    briefing: "An IRS IP PIN is a six-digit number that prevents anyone from filing a tax return in your name -- even with your Social Security number. Without it, someone with your SSN can file a fraudulent return, claim your refund, and leave you untangling the mess for months. Free. Ten minutes. A new PIN is generated each year.",
    steps: [
      { text: "Go to the IRS IP PIN request tool", url: "https://www.irs.gov/identity-theft-fraud-scams/get-an-identity-protection-pin" },
      { text: "Click \"Get an IP PIN\" and verify your identity -- you'll need last year's tax return info" },
      { text: "The IRS generates a six-digit PIN for the current tax year" },
      { text: "Save the PIN with your tax documents -- you'll need it when filing your return" },
    ],
    debriefQs: DEFENSE_DEBRIEF,
    scoutDialog: {
      briefing: "\"After the Equifax breach, assume someone has your SSN. The most common use of a stolen Social Security number is fraudulent tax returns -- file before you do, claim your refund, disappear. The IRS IP PIN blocks that. Six digits, generated annually, and nobody files a return in your name without it. Free. Ten minutes. No reason not to.\"",
      debrief: {
        "done": "\"IRS PIN set. Nobody is filing a tax return in your name without that code.\"",
        "already-done": "\"Already set up. You refresh it each year, right?\"",
        "skip": "\"High priority if tax season is approaching. Fraudulent returns are the most common SSN exploit.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "govt_id_defense-fortify-ssa-lock",
    accountId: "govt_id_defense",
    phase: "fortify",
    title: "Enable SSA Self Lock",
    briefing: "The Social Security Administration's Self Lock blocks electronic access to your Social Security record. This prevents someone from creating a my Social Security account in your name, viewing your earnings, or changing your direct deposit. Creating the account -- even before enabling the lock -- prevents someone else from creating one in your name first.",
    steps: [
      { text: "Go to my Social Security", url: "https://www.ssa.gov/myaccount/" },
      { text: "Create an account if you don't have one -- this itself prevents someone else from registering as you" },
      { text: "Once logged in, enable Self Lock under security settings" },
      { text: "Note: you'll temporarily unlock when you need to access your record" },
    ],
    debriefQs: DEFENSE_DEBRIEF,
    scoutDialog: {
      briefing: "\"If you don't already have a my Social Security account, create one now -- that alone prevents someone from creating one in your name. Then lock it. The SSA Self Lock blocks electronic access to your earnings record, direct deposit, and benefits. Nobody changes your Social Security payments without your say.\"",
      debrief: {
        "done": "\"SSA locked. Your Social Security record is walled off from electronic access.\"",
        "already-done": "\"Already locked. Smart -- SSA fraud is one of the harder kinds to untangle.\"",
        "skip": "\"Creating the account is itself a defense. Come back when you have ten minutes.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "govt_id_defense-reclaim-credit-check",
    accountId: "govt_id_defense",
    phase: "reclaim",
    title: "Pull Credit Reports & Check for Fraud",
    briefing: "Even with a credit freeze, pull your actual credit reports to check for accounts you didn't open. AnnualCreditReport.com gives you free reports from all three bureaus. If you find anything, IdentityTheft.gov generates an official FTC report and a personalized recovery plan -- you don't have to figure it out alone.",
    steps: [
      { text: "Go to AnnualCreditReport.com -- the only official free credit report site", url: "https://www.annualcreditreport.com/" },
      { text: "Pull reports from Equifax, Experian, and TransUnion" },
      { text: "Review every account listed -- look for anything you don't recognize" },
      { text: "If you find fraud: file a report at IdentityTheft.gov for a recovery plan", url: "https://www.identitytheft.gov/" },
    ],
    debriefQs: CREDIT_CHECK_DEBRIEF,
    scoutDialog: {
      briefing: "\"Credit reports are the definitive record of accounts opened in your name. If someone used your identity, it shows up here -- credit cards, loans, phone contracts. AnnualCreditReport.com is the only official site -- ignore any others. If you find something, IdentityTheft.gov generates an official FTC report and a step-by-step recovery plan.\"",
      debrief: {
        "all-clean": "\"Government ID Defense: liberated. Credit frozen, IRS PIN set, SSA locked, credit reports verified clean. You've layered every defense available against identity theft. Your face and license number can't be changed -- but you've made them much harder to exploit.\"",
        "found-something": "\"Found something. Don't panic -- go to IdentityTheft.gov. It generates an official FTC report and walks you through recovery step by step.\"",
        "found-fraud": "\"Multiple fraudulent accounts. Serious but recoverable. IdentityTheft.gov gives you an official report and a personalized plan. With credit frozen and IRS PIN set, the bleeding is stopped -- now we clean up.\"",
        "skip": "\"Pulling credit reports is the final verification. Come back when you have twenty minutes.\"",
      },
    },
    estimatedMinutes: 15,
  },
];
