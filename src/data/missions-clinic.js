// ══════════════════════════════════════════════════════════════════
// THE CLINIC -- Chapter 11
// Health, fitness, and genetic data.
// Your body is data now. Almost none of it is protected by HIPAA.
// ══════════════════════════════════════════════════════════════════

const HEALTH_ACTION_DEBRIEF = [
  {
    id: "health_action",
    label: "Did you complete this?",
    options: [
      { value: "done", text: "Yes, completed", severity: "safe" },
      { value: "already-done", text: "Already had this handled", severity: "safe" },
      { value: "partial", text: "Got partway through -- will finish later", severity: "warn" },
      { value: "skip", text: "I will come back to this", severity: "skip" },
    ],
  },
];

const HEALTH_AUDIT_DEBRIEF = [
  {
    id: "health_audit",
    label: "What did you find?",
    options: [
      { value: "clean", text: "No concerning data sharing", severity: "safe" },
      { value: "some-sharing", text: "Found data being shared -- turned it off", severity: "warn" },
      { value: "major-sharing", text: "Significant data exposure -- locked it down", severity: "crit" },
      { value: "skip", text: "I will come back to this", severity: "skip" },
    ],
  },
];

const GENETIC_DEBRIEF = [
  {
    id: "genetic_action",
    label: "What did you do?",
    options: [
      { value: "deleted", text: "Requested data deletion and sample destruction", severity: "safe" },
      { value: "opted-out", text: "Opted out of research but kept my account", severity: "warn" },
      { value: "no-account", text: "I have never used a genetic testing service", severity: "safe" },
      { value: "skip", text: "I will come back to this", severity: "skip" },
    ],
  },
];

function scoutHealth(done, already, partial) {
  return {
    "done": done,
    "already-done": already,
    "partial": `"Progress counts. Come back and finish when you can."`,
    "skip": `"No rush. This one will be here."`,
  };
}

export const CLINIC_MISSIONS = [

  // ══════════════════════════════════════════════════════
  // FITNESS TRACKERS
  // ══════════════════════════════════════════════════════
  {
    id: "fitness-audit-data-sharing",
    accountId: "fitness_trackers",
    phase: "recon",
    title: "Audit Fitness Data Sharing",
    briefing: "Your fitness tracker records your heart rate, sleep patterns, stress levels, menstrual cycles, GPS routes, and how many steps you take to the bathroom at 3 AM. That data goes somewhere. If you use Fitbit, it goes to Google -- they acquired Fitbit in 2021, and a decade of health data for 31 million users transferred to the largest advertising company on Earth. Apple Watch data stays on-device by default, but third-party apps can request access to all of it. Garmin, Whoop, and Oura each have their own data-sharing policies that most users never read.",
    steps: [
      { text: "Fitbit: Open the Fitbit app > tap your profile > scroll to Manage Data > review what Google accesses", url: "https://www.fitbit.com/settings/data" },
      { text: "Apple Watch: On your iPhone, open Settings > Privacy & Security > Health > review each app listed" },
      { text: "Garmin: Open Garmin Connect > Settings > Account Information > Privacy Settings", url: "https://connect.garmin.com/modern/settings" },
      { text: "Any tracker: Check which third-party apps have been granted access to your health data" },
    ],
    debriefQs: HEALTH_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"Your fitness tracker knows your resting heart rate, your sleep quality, your stress levels, and every route you run. Google now owns Fitbit. That means the largest ad company on Earth has a decade of biometric data on 31 million people. Let's see who else is reading your heartbeat."`,
      debrief: {
        "clean": `"No data leaks from your tracker. That's rare -- most people have at least one third-party app with access."`,
        "some-sharing": `"Good catch. Those third-party connections are where health data quietly leaves the device."`,
        "major-sharing": `"Significant exposure, but you shut it down. Your biometrics are yours again."`,
        "skip": `"This one matters. Your heartbeat shouldn't be a product."`,
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "fitness-limit-sharing",
    accountId: "fitness_trackers",
    phase: "fortify",
    title: "Lock Down Fitness Data",
    briefing: "Now that you know who has access, cut the connections that should not exist. Disable third-party data sharing, revoke app permissions you do not recognize, and set data retention to the minimum your tracker allows. On Fitbit, you can download your data archive before restricting access -- do this so you have your own copy before Google's copy becomes the only one.",
    steps: [
      { text: "Fitbit: Settings > Manage Data > disable sharing with third-party apps. Download your data archive first.", url: "https://www.fitbit.com/settings/data/export" },
      { text: "Apple Health: Settings > Privacy & Security > Health > tap each app > turn off any categories you do not want shared" },
      { text: "Garmin: Garmin Connect > Settings > Privacy Settings > set data sharing to minimum", url: "https://connect.garmin.com/modern/settings" },
      { text: "Check for connected apps like Strava, MyFitnessPal, insurance apps -- revoke access from any you do not actively use" },
    ],
    debriefQs: HEALTH_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: `"Time to cut the wires. Every third-party app connected to your fitness tracker is a pipeline carrying your biometrics somewhere you did not choose. Revoke what you do not need. Keep your data archive -- it's your copy."`,
      debrief: scoutHealth(
        `"Fitness data locked down. Your heart rate is no longer someone else's business intelligence."`,
        `"Already tight. You're ahead of 95% of tracker users."`,
        `"Some connections cut. Come back to finish the rest."`,
      ),
    },
    estimatedMinutes: 10,
  },
  {
    id: "fitness-export-data",
    accountId: "fitness_trackers",
    phase: "reclaim",
    title: "Export Your Health Data",
    briefing: "Download a copy of everything your tracker has recorded. This is your data -- your sleep patterns, your activity history, your heart rate trends. Having your own archive means you are not dependent on any platform to access your own health history. Apple Health can export as a standard CDA file. Fitbit and Garmin have data export tools. Once you have your copy, you own it regardless of what happens to the company.",
    steps: [
      { text: "Apple Health: Open Health app > tap your profile picture > Export All Health Data > save the zip file" },
      { text: "Fitbit: Go to the data export page and request your archive", url: "https://www.fitbit.com/settings/data/export" },
      { text: "Garmin: Account > Data Management > Export Your Data", url: "https://www.garmin.com/en-US/account/datamanagement/" },
      { text: "Save the export to a secure location -- not cloud storage connected to the same fitness account" },
    ],
    debriefQs: HEALTH_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: `"Get your own copy. Companies go bankrupt, get acquired, change their terms. 23andMe just proved that. If you do not have your own export, your health history lives on someone else's server at someone else's discretion."`,
      debrief: scoutHealth(
        `"Data exported. Your health history is in your hands now, not just on their servers."`,
        `"Already have your exports. Good discipline."`,
        `"Partial export. Come back for the rest -- it's worth having the complete archive."`,
      ),
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // HEALTH APPS
  // ══════════════════════════════════════════════════════
  {
    id: "health-apps-period-tracker-audit",
    accountId: "health_apps",
    phase: "recon",
    title: "Audit Period Tracker Privacy",
    briefing: "After the Dobbs decision overturned Roe v. Wade in 2022, period tracking apps became a legal liability. Prosecutors in states with abortion bans can subpoena app data to prove pregnancy and timing. Flo -- the most popular period tracker with 300 million downloads -- was caught sharing health data with Facebook for ad targeting in 2019 and settled with the FTC. The app now offers an 'Anonymous Mode' that disconnects your data from your identity. Clue, based in Germany, committed to never selling data and is bound by EU privacy law. Natural Cycles shares data with advertisers. If you use a period tracker, you need to know what it does with your data.",
    steps: [
      { text: "Flo: Open the app > Profile > Privacy Settings > enable Anonymous Mode. Review 'Data Processing' settings." },
      { text: "Clue: Review their privacy policy -- they are GDPR-bound and have committed to never selling data", url: "https://helloclue.com/privacy" },
      { text: "Natural Cycles or others: Check Settings > Privacy for data sharing toggles. Consider switching if they share with advertisers." },
      { text: "Consider whether you need cloud sync at all -- some trackers can work fully offline" },
    ],
    debriefQs: HEALTH_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"After Dobbs, period tracker data became evidence. Prosecutors can subpoena it. Flo got caught sharing with Facebook. If you track your cycle on your phone, you need to know exactly where that data goes. This is not hypothetical -- it is happening now."`,
      debrief: {
        "clean": `"Your period tracker is clean. Keep watching -- policies change with acquisitions."`,
        "some-sharing": `"Good -- you found and stopped the sharing. In some states, that data could be subpoenaed."`,
        "major-sharing": `"Significant exposure on reproductive health data. You locked it down. That matters more than you know."`,
        "skip": `"Whenever you are ready. This one is time-sensitive for anyone in a state with reproductive restrictions."`,
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "health-apps-mental-health-audit",
    accountId: "health_apps",
    phase: "recon",
    title: "Review Mental Health App Data Practices",
    briefing: "BetterHelp, the largest online therapy platform, paid a $7.8 million FTC settlement in 2023 for sharing therapy data with Facebook for ad targeting. They embedded the Facebook pixel on their intake questionnaire -- the form where you describe your mental health struggles. Facebook used this to target ads at you. Cerebral shared patient mental health diagnoses with advertisers including Google, TikTok, and Snapchat. Talkspace's privacy policy allows sharing 'de-identified' data, which researchers have repeatedly shown can be re-identified. If you have ever used an online therapy or mental health app, your diagnosis may be in an advertising database.",
    steps: [
      { text: "BetterHelp: Check if you are eligible for the FTC settlement refund", url: "https://www.ftc.gov/betterhelp" },
      { text: "Cerebral: Log in and check Settings > Privacy for data sharing options. Consider requesting your data and deleting your account if no longer needed." },
      { text: "Any therapy app: Search '[app name] FTC' or '[app name] data sharing' to check if they have been caught" },
      { text: "For ongoing therapy: ask your provider directly what data is shared and with whom" },
    ],
    debriefQs: HEALTH_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"BetterHelp embedded Facebook's tracking pixel on their therapy intake form. The form where you describe your depression, your anxiety, your trauma. Facebook used it to target ads at you. They paid 7.8 million to the FTC. That is what your mental health data was worth to them."`,
      debrief: {
        "clean": `"No concerning sharing. Either you chose well or your provider shaped up after enforcement."`,
        "some-sharing": `"Found it and shut it down. Your mental health data is no one's ad targeting signal."`,
        "major-sharing": `"Your therapy data was being monetized. Now it is not. That is a real win."`,
        "skip": `"Take your time. But if you used BetterHelp, check the FTC settlement -- you might be owed money."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "health-apps-delete-breached",
    accountId: "health_apps",
    phase: "reclaim",
    title: "Delete Breached Health Accounts",
    briefing: "MyFitnessPal was breached in 2018 -- 150 million accounts with email addresses, usernames, and hashed passwords. Under Armour owned it at the time and sold it to Francisco Partners in 2020. If you created a MyFitnessPal account before 2018, your data was in that breach. Any health app you no longer actively use is an unmonitored attack surface storing your body data. Delete the accounts, not just the apps.",
    steps: [
      { text: "MyFitnessPal: Log in > Account (account.myfitnesspal.com) > scroll to Delete Account. Do not just uninstall the app.", url: "https://account.myfitnesspal.com" },
      { text: "Check haveibeenpwned.com to see if your email was in the MyFitnessPal breach or other health app breaches", url: "https://haveibeenpwned.com" },
      { text: "List any health apps you installed, tried once, and forgot about. Search your email for signup confirmations." },
      { text: "Delete the accounts on each one -- Settings > Account > Delete. Request data deletion where available." },
    ],
    debriefQs: HEALTH_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: `"The MyFitnessPal breach hit 150 million accounts. If you signed up before 2018, your data was in it. But the real danger is the health apps you forgot about -- the calorie counter from 2016, the sleep tracker you tried for a week. Each one is a database with your data and no one watching the door."`,
      debrief: scoutHealth(
        `"Breached accounts deleted. Dead health apps cleaned up. Your body data footprint just shrunk."`,
        `"Already cleaned up. Good hygiene."`,
        `"Some cleaned, more to go. Each one you delete is one fewer database with your biometrics."`,
      ),
    },
    estimatedMinutes: 12,
  },

  // ══════════════════════════════════════════════════════
  // GENETIC TESTING
  // ══════════════════════════════════════════════════════
  {
    id: "genetic-delete-23andme",
    accountId: "genetic_testing",
    phase: "recon",
    title: "Delete Your 23andMe Data (URGENT)",
    briefing: "23andMe filed for bankruptcy in 2025. Your DNA profile -- the most permanent, irrevocable piece of personal data that exists -- is now an asset on a bankruptcy auction block. Unlike a password, you cannot change your genome. Unlike a credit card, you cannot get a new one. 15 million people submitted saliva samples. The California Attorney General issued an advisory urging all 23andMe customers to delete their data and request destruction of their physical samples before the company is sold. This is not speculative risk. This is happening now.",
    steps: [
      { text: "Log into 23andMe", url: "https://you.23andme.com" },
      { text: "Go to Settings > 23andMe Data > scroll to 'Delete Your Data'" },
      { text: "Click 'Submit Request' -- this deletes your genetic results from their servers" },
      { text: "ALSO: Go to Settings > Preferences > scroll to 'Biobanked Samples' > request destruction of your physical saliva sample. This is separate from data deletion." },
      { text: "Confirm both requests via the emails they send. It takes up to 30 days." },
    ],
    debriefQs: GENETIC_DEBRIEF,
    scoutDialog: {
      briefing: `"This is the most urgent mission in The Clinic. 23andMe is bankrupt. Your DNA -- the one piece of data you can never change -- is sitting on a server that is about to be sold to the highest bidder. The California Attorney General told everyone to delete their data. We are doing that right now."`,
      debrief: {
        "deleted": `"Deletion requested, sample destruction requested. That is the most permanent data protection action you can take. Confirm the emails they send -- both of them."`,
        "opted-out": `"Research opt-out is a start, but your data is still on their servers during the bankruptcy sale. Consider full deletion."`,
        "no-account": `"Good. Keep it that way. If a relative used 23andMe, your DNA is partially exposed through familial matching -- but that is beyond your control."`,
        "skip": `"I understand, but this one is genuinely urgent. The bankruptcy sale could happen any time. Your DNA does not expire -- once it is sold, it cannot be un-sold."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "genetic-opt-out-research",
    accountId: "genetic_testing",
    phase: "fortify",
    title: "Opt Out of Genetic Research Programs",
    briefing: "23andMe, AncestryDNA, and MyHeritage all have research consent toggles. When enabled, your genetic data is included in studies sold to pharmaceutical companies and biotech firms. 23andMe had a $300 million deal with GlaxoSmithKline for access to their genetic database. Even if you are deleting your 23andMe account, check your other genetic testing accounts. AncestryDNA has its own research program. MyHeritage was breached in 2018 -- 92 million accounts. GEDmatch, originally a genealogy tool, was used by law enforcement to identify the Golden State Killer through familial DNA matching. They later changed their policy to require opt-in for law enforcement use.",
    steps: [
      { text: "AncestryDNA: Sign in > Settings > Privacy Settings > toggle off 'Informed Consent for Research'", url: "https://www.ancestry.com/account/settings" },
      { text: "MyHeritage: Log in > Settings > Privacy > review and restrict data sharing", url: "https://www.myheritage.com/dna/settings" },
      { text: "GEDmatch: If you uploaded your DNA, review your privacy settings -- law enforcement access requires your opt-in", url: "https://www.gedmatch.com" },
      { text: "Check if you uploaded your DNA to any other database (FamilyTreeDNA, LivingDNA, Promethease). Review and restrict each one." },
    ],
    debriefQs: GENETIC_DEBRIEF,
    scoutDialog: {
      briefing: `"23andMe sold access to your DNA to GlaxoSmithKline for 300 million dollars. That is what your genome was worth in bulk. AncestryDNA and MyHeritage have their own research programs. And GEDmatch -- the genealogy tool -- was used to catch the Golden State Killer by matching a distant relative's DNA. If you uploaded your DNA anywhere, review what you consented to."`,
      debrief: {
        "deleted": `"Research consent revoked. Your DNA is no longer a pharmaceutical company's R&D dataset."`,
        "opted-out": `"Research opt-out confirmed. Your data stays in their system but is excluded from studies. Full deletion goes further."`,
        "no-account": `"No genetic testing accounts. Smart. Once DNA data is out, you cannot get it back."`,
        "skip": `"Come back to this. Unlike a password, you cannot change your DNA after a breach."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "genetic-familial-exposure",
    accountId: "genetic_testing",
    phase: "reclaim",
    title: "Understand Familial DNA Exposure",
    briefing: "Even if you have never submitted a DNA sample, your relatives may have. A third cousin you have never met uploading their DNA to GEDmatch narrows your genetic identity significantly. The Golden State Killer was identified through DNA uploaded by a distant relative to a public genealogy database. Law enforcement agencies have used this technique in hundreds of cases. You cannot control this -- but you can understand the exposure. If close relatives have used 23andMe or AncestryDNA, your genetic information is partially in those databases through inference.",
    steps: [
      { text: "Ask close family members if they have used 23andMe, AncestryDNA, or other genetic testing" },
      { text: "If they have: encourage them to review privacy settings and consider deletion (especially 23andMe given the bankruptcy)" },
      { text: "Check if you or family members uploaded raw DNA to GEDmatch, FamilyTreeDNA, or other open databases" },
      { text: "Understand: even after deletion, familial connections already identified may persist in law enforcement databases" },
    ],
    debriefQs: HEALTH_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: `"Here is the hard truth about genetic data: it is shared by blood. If your third cousin uploaded their DNA to GEDmatch, a portion of your genome is in that database whether you consented or not. The Golden State Killer was caught because a distant relative's DNA narrowed the search to one family. You cannot undo this. But you can understand the exposure and help your family make informed choices."`,
      debrief: scoutHealth(
        `"Familial exposure mapped. You know what is out there. That awareness is itself a form of defense."`,
        `"Already had this conversation with your family. Rare and valuable."`,
        `"Started the conversation. It is a hard one to have. Come back to it."`,
      ),
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // TELEHEALTH
  // ══════════════════════════════════════════════════════
  {
    id: "telehealth-therapy-app-audit",
    accountId: "telehealth",
    phase: "recon",
    title: "Check If Your Therapy App Sold Your Data",
    briefing: "The FTC found that BetterHelp shared mental health data -- including intake questionnaire responses about depression, anxiety, and substance abuse -- with Facebook, Snapchat, Criteo, and Pinterest for advertising. The Facebook pixel on BetterHelp's site transmitted data about pages users visited, including pages describing specific mental health conditions. Cerebral, an ADHD and mental health platform, shared patient diagnoses with Google, TikTok, and Snapchat via advertising pixels embedded in their platform. If you used either service, your mental health data may be in advertising databases.",
    steps: [
      { text: "BetterHelp: Check if you qualify for the FTC refund (users between 2017-2023)", url: "https://www.ftc.gov/betterhelp" },
      { text: "Cerebral: Log in > Settings > review privacy and data sharing options. Request a copy of your data to see what was shared." },
      { text: "Talkspace: Review their privacy policy for 'de-identified' data sharing -- researchers have shown de-identified health data can be re-identified" },
      { text: "For any telehealth app: search '[app name] FTC' or '[app name] data breach' to check their record" },
    ],
    debriefQs: HEALTH_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"BetterHelp put Facebook's tracking pixel on the page where you describe your depression. Cerebral sent your ADHD diagnosis to TikTok. These are not hypotheticals. These are FTC findings. If you used online therapy, check if your most private disclosures became ad-targeting data."`,
      debrief: {
        "clean": `"Your telehealth provider is clean -- or at least has not been caught yet. Keep watching."`,
        "some-sharing": `"Found the leak. Therapy data used for ad targeting is one of the worst violations in this city."`,
        "major-sharing": `"Major exposure on your most sensitive data. You stopped it. Consider switching providers."`,
        "skip": `"If you used BetterHelp, the FTC settlement means you might be owed money. Worth checking."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "telehealth-prescription-data",
    accountId: "telehealth",
    phase: "fortify",
    title: "Review Prescription Data Sharing",
    briefing: "GoodRx -- the prescription discount app used by millions -- shared users' prescription data with Meta and Google for advertising. The FTC fined them $1.5 million and banned them from sharing health data for ads. Your GoodRx search for antidepressants, HIV medication, or fertility drugs was transmitted to advertising platforms. This is not covered by HIPAA because GoodRx is not a 'covered entity' -- it is a tech company, not a healthcare provider. The HIPAA gap means most health apps operate in a regulatory vacuum.",
    steps: [
      { text: "GoodRx: Log in > scroll to Privacy Settings > opt out of data sharing", url: "https://www.goodrx.com/privacy-settings" },
      { text: "Check other pharmacy/prescription apps: Amazon Pharmacy, Cost Plus Drugs, PillPack -- review their privacy settings" },
      { text: "If your pharmacy has an app (CVS, Walgreens, Rite Aid): check its privacy settings for 'personalized offers' or 'marketing'" },
      { text: "Consider using your insurance's pharmacy directly instead of third-party discount apps" },
    ],
    debriefQs: HEALTH_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: `"GoodRx sent your prescription searches to Meta and Google. Your search for antidepressants became an ad-targeting signal. HIPAA does not cover this because GoodRx is a tech company, not a doctor. That loophole is not a bug -- it is the business model."`,
      debrief: scoutHealth(
        `"Prescription data sharing stopped. What you take is between you and your doctor -- not you, your doctor, and Meta."`,
        `"Already opted out. Your prescription data was already private."`,
        `"Partial lockdown. Come back to finish -- prescription data is high-sensitivity."`,
      ),
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // HEALTH INSURANCE
  // ══════════════════════════════════════════════════════
  {
    id: "health-insurance-wellness-programs",
    accountId: "health_insurance",
    phase: "recon",
    title: "Understand Wellness Program Data Use",
    briefing: "If your employer offers health insurance discounts for wearing a Fitbit, logging meals, or completing 'health assessments,' your data is being used to influence premiums. Employer wellness programs are a $58 billion industry. The data flows from your fitness tracker to the wellness platform (Virgin Pulse, Rally Health, Vitality) to the insurance company. Life insurance companies buy social media data and consumer purchase data to set premiums -- your Instagram posts and grocery loyalty card purchases can affect your rates. The Affordable Care Act prohibits charging more for pre-existing conditions, but wellness program 'incentives' create a legal workaround.",
    steps: [
      { text: "Check if your employer has a wellness program that connects to fitness trackers or health apps" },
      { text: "If so: review what data the wellness platform collects. Look for the privacy policy on the platform (Virgin Pulse, Rally Health, Vitality, etc.)" },
      { text: "Consider disconnecting your personal fitness tracker from employer wellness programs" },
      { text: "Review your health insurance plan documents for references to 'wellness incentives' or 'biometric screenings' -- these feed data to insurers" },
    ],
    debriefQs: HEALTH_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"Your employer is offering you a discount to wear a Fitbit. What they are really doing is building a dataset that influences your insurance premiums. Wellness programs are a 58 billion dollar industry. The fitness tracker is the sensor. The discount is the incentive. Your biometrics are the product."`,
      debrief: {
        "clean": `"No wellness program data sharing. Either your employer does not have one, or you kept your tracker disconnected."`,
        "some-sharing": `"Found the connection. The question is whether the discount is worth the data. Your call -- but now it is an informed call."`,
        "major-sharing": `"Significant data flowing to the wellness platform. Now you know what the 'free' Fitbit was actually for."`,
        "skip": `"Worth checking. The discount seems free. The data is the price."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "health-insurance-data-permissions",
    accountId: "health_insurance",
    phase: "fortify",
    title: "Review Health Data Permissions",
    briefing: "Apple Health and Google Fit act as central hubs that dozens of apps connect to. Every app you have ever granted Health access can read data contributed by every other app. That means a calorie counter can read your heart rate data. A sleep tracker can read your reproductive health data. Review every app connected to your health data hub and revoke access from anything that does not need it. Be especially careful with apps that request write AND read access -- read access to your entire health profile is the real prize.",
    steps: [
      { text: "iPhone: Settings > Privacy & Security > Health > review every app. Remove any you no longer use." },
      { text: "Android: Settings > Apps > Google Fit > review connected apps and permissions", url: "https://myaccount.google.com/permissions" },
      { text: "For each app: ask 'does this app need access to ALL my health data, or just the data it creates?'" },
      { text: "Revoke access from apps you tried once and forgot. Each one is an open pipeline." },
    ],
    debriefQs: HEALTH_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: `"Apple Health is a hub. Every app connected to it can potentially read data from every other app. That means the meditation app you tried once in 2021 might still have access to your heart rate, your sleep data, and your reproductive health tracking. Let's review every connection."`,
      debrief: scoutHealth(
        `"Health data permissions locked down. Your biometric hub is no longer an all-you-can-read buffet."`,
        `"Already tight. You have been managing your health permissions."`,
        `"Some revoked. Come back for the rest -- each connected app is a potential data leak."`,
      ),
    },
    estimatedMinutes: 8,
  },
];
