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

// Therapy apps (recon audit #86): what a player can find out. A new question
// id; an old save's health_audit answer still shows (question.legacy).
const THERAPY_APPS_DEBRIEF = [
  {
    id: "therapy_apps",
    label: "What did you find?",
    legacy: HEALTH_AUDIT_DEBRIEF[0],
    options: [
      { value: "none-used", text: "I haven't used a therapy or mental-health app", severity: "safe" },
      { value: "no-record", text: "No enforcement or breach on mine", severity: "safe" },
      { value: "has-record", text: "One of mine has an FTC case or breach", severity: "warn" },
      { value: "requested-delete", text: "Requested my data / deleted an account", severity: "safe" },
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
      { text: 'Fitbit: open the Fitbit app → your profile → Manage connected apps → revoke any you don’t use' },
      { text: 'Fitbit accounts are now Google accounts, so also review the apps connected to your Google Account', url: 'https://myaccount.google.com/linkedapps' },
      { text: 'Apple Watch: on your iPhone, Settings → Health → Data Access & Devices (iOS 18 and later: Settings → Apps → Health) → review each app listed' },
      { text: 'Garmin: open Garmin Connect settings → Profile & Privacy', url: 'https://connect.garmin.com/app/settings' },
      { text: 'Any tracker: check which third-party apps have been granted access to your health data' },
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
    briefing: "Now that you know who has access, cut the connections that should not exist. Disable third-party data sharing, revoke app permissions you do not recognize, and set data retention to the minimum your tracker allows. Download your data before restricting access, so you have your own copy.",
    steps: [
      { text: "Fitbit: download your data first (Fitbit accounts are now Google accounts, so it comes from Google Takeout), then revoke third-party apps in the Fitbit app → your profile → Manage connected apps", url: "https://takeout.google.com" },
      { text: "Apple Health: Settings → Health → Data Access & Devices (iOS 18 and later: Settings → Apps → Health) → tap each app → turn off any categories you do not want shared" },
      { text: "Garmin: Garmin Connect settings → Profile & Privacy → set sharing to the minimum", url: "https://connect.garmin.com/app/settings" },
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
    briefing: "Download a copy of everything your tracker has recorded. This is your data -- your sleep patterns, your activity history, your heart rate trends. Having your own archive means you are not dependent on any platform to access your own health history. Apple Health can export as a standard CDA file. Fitbit data comes out through Google Takeout, and Garmin has its own export tool. Once you have your copy, you own it regardless of what happens to the company.",
    steps: [
      { text: "Apple Health: Open Health app > tap your profile picture > Export All Health Data > save the zip file" },
      { text: "Fitbit: Fitbit accounts are now Google accounts. Download your data from Google Takeout", url: "https://takeout.google.com" },
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
    briefing: "After the Dobbs decision overturned Roe v. Wade in 2022, period tracking apps became a legal liability. Prosecutors in states with abortion bans can subpoena app data to prove pregnancy and timing. Flo -- the most popular period tracker with 300 million downloads -- was caught sharing health data with Facebook for ad targeting in 2019 and settled with the FTC. The app now offers an 'Anonymous Mode' that disconnects your data from your identity. Clue, based in Germany, committed to never selling data and is bound by EU privacy law. Natural Cycles says it never sells or shares cycle or health data, but it does share identifiers (device, IP address, hashed email) with ad platforms. If you use a period tracker, you need to know what it does with your data.",
    steps: [
      { text: "Flo: in the app’s privacy settings, look for Anonymous Mode and review data processing settings." },
      { text: "Clue: Review their privacy policy -- they are GDPR-bound and have committed to never selling data", url: "https://helloclue.com/privacy" },
      { text: "Natural Cycles: it says it never sells or shares cycle or health data. It does share identifiers (device, IP, hashed email) with ad platforms. Check Settings → Privacy for tracking toggles" },
      { text: "Consider whether you need cloud sync at all -- some trackers can work fully offline" },
    ],
    debriefQs: HEALTH_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"After Dobbs, prosecutors can subpoena app data, period trackers included. The cases so far have used texts, search history and chats. Flo got caught sharing with Facebook. If you track your cycle on your phone, you need to know exactly where that data goes. It's worth knowing before you need to."`,
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
    title: "Therapy app data check",
    briefing: "BetterHelp, the largest online therapy platform, paid a $7.8 million FTC settlement in 2023 for sharing therapy data with Facebook for ad targeting. They embedded the Facebook pixel on their intake questionnaire -- the form where you describe your mental health struggles. Facebook used this to target ads at you. Cerebral shared patients' health information with advertisers including Google, TikTok, and Snapchat, and agreed to an FTC order in April 2024 that included paying more than $7 million. Talkspace's privacy policy allows sharing 'de-identified' data, which researchers have repeatedly shown can be re-identified. If you have ever used an online therapy or mental health app, your diagnosis may be in an advertising database.",
    steps: [
      { text: 'Make a list of every therapy or mental-health app you’ve used' },
      { text: 'For each one, search “<app> FTC” and “<app> data breach”' },
      { text: 'In each app you still use, request a copy of your data. Delete the account for any you’ve stopped using' },
      { text: 'BetterHelp customers: the FTC sent refunds automatically in 2024 and 2025. There was no claim form', url: 'https://www.ftc.gov/enforcement/refunds/betterhelp-refunds' },
    ],
    debriefQs: THERAPY_APPS_DEBRIEF,
    scoutDialog: {
      briefing: `"BetterHelp embedded Facebook's tracking pixel on their therapy intake form. The form where you describe your depression, your anxiety, your trauma. Facebook used it to target ads at you. They paid 7.8 million to the FTC. That is what your mental health data was worth to them."`,
      debrief: {
        "none-used": `"None used. Nothing to chase here."`,
        "no-record": `"No case and no breach on yours. Keep an eye on it -- policies change."`,
        "has-record": `"One of yours has a record. Request your data, and delete the account if you've stopped using it."`,
        "requested-delete": `"Requested or deleted. Less of your most private data sitting on a server."`,
        "clean": `"No concerning sharing. Either you chose well or your provider shaped up after enforcement."`,
        "some-sharing": `"Found it and shut it down. Your mental health data is no one's ad targeting signal."`,
        "major-sharing": `"Your therapy data was being monetized. Now it is not. That is a real win."`,
        "skip": `"Take your time. This one will be here."`,
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
      { text: "MyFitnessPal: use the delete-account option in your account settings. Do not just uninstall the app." },
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
    title: "Delete Your 23andMe Data",
    briefing: "23andMe went bankrupt in 2025 and was bought by TTAM Research Institute in July 2025. Your DNA data moved with it. TTAM says it honors deletion, so deleting is still your choice and still permanent. Your DNA profile is the most permanent piece of personal data that exists: unlike a password, you cannot change your genome. During the bankruptcy, the California Attorney General urged customers to consider deleting their data.",
    steps: [
      { text: "Sign in to your 23andMe account" },
      { text: "Go to Settings → 23andMe Data → View, then scroll to Delete Data" },
      { text: "Click 'Submit Request' -- 23andMe deletes your account and data, except what its lab must keep by law: your genetic information, date of birth and sex (lab regulations such as CLIA)" },
      { text: "Also: in Settings → Preferences, turn off biobanking so your physical saliva sample isn't kept. This is separate from data deletion." },
      { text: "Confirm the request in the email they send." },
    ],
    debriefQs: GENETIC_DEBRIEF,
    scoutDialog: {
      briefing: `"23andMe changed hands in 2025, and your DNA went with it. The new owner says it honors deletion. Whether to delete is your call -- it's permanent either way."`,
      debrief: {
        "deleted": `"Deletion requested, sample destruction requested. That is the most permanent data protection action you can take. Confirm the emails they send -- both of them."`,
        "opted-out": `"Research opt-out is a start, but your data is still on their servers. Full deletion goes further."`,
        "no-account": `"Good. Keep it that way. If a relative used 23andMe, your DNA is partially exposed through familial matching -- but that is beyond your control."`,
        "skip": `"Take your time. Your DNA doesn't expire, so this decision is worth making on purpose."`,
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
      { text: "AncestryDNA: in your account's DNA settings, find the research consent and withdraw it" },
      { text: "MyHeritage: in your account's DNA settings, review and restrict data sharing" },
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
      { text: "If they have: encourage them to review privacy settings and consider deletion (especially 23andMe, which changed owners in 2025)" },
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
    title: "Prescription & pharmacy data check",
    briefing: "A telehealth visit that ends in a prescription leaves a trail: the telehealth service, its partner pharmacy, maybe a mail-order or discount app. Most of them aren't your doctor, so HIPAA may not cover them. Cerebral, an ADHD and mental health platform, shared patients' health information with advertisers through tracking pixels. This check is about who holds your prescription history, and what they're allowed to do with it.",
    steps: [
      { text: 'Telehealth prescriptions: list which pharmacies and apps have your prescription history (the telehealth service, its partner pharmacy, mail-order apps)' },
      { text: 'In each pharmacy or prescription app, check the privacy settings for marketing or “personalized offers” and turn off what you don’t want' },
      { text: 'For any telehealth app: search “<app> FTC” or “<app> data breach” to check its record' },
    ],
    debriefQs: HEALTH_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"Every prescription passes through more hands than your doctor's. Let's find out whose, and switch off what they don't need to do with it."`,
      debrief: {
        "clean": `"Nothing concerning in the settings. Keep watching -- policies change."`,
        "some-sharing": `"Found marketing use and turned it off. What you take is your business."`,
        "major-sharing": `"A lot of your prescription data was in play. You shut it down. Consider which apps you still need."`,
        "skip": `"Whenever you're ready."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "telehealth-prescription-data",
    accountId: "telehealth",
    phase: "fortify",
    title: "Review Prescription Data Sharing",
    briefing: "GoodRx -- the prescription discount app used by millions -- shared users' prescription data with Meta and Google for advertising. The FTC fined them $1.5 million and banned them from sharing health data for ads. Your GoodRx search for antidepressants, HIV medication, or fertility drugs was transmitted to advertising platforms. This is not covered by HIPAA because GoodRx is not a 'covered entity' -- it is a tech company, not a healthcare provider. HIPAA doesn't cover most health apps; the FTC's Health Breach Notification Rule does cover some, and GoodRx was its first case.",
    steps: [
      { text: "GoodRx: sign in and look for its privacy settings to opt out of data sharing" },
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
    briefing: "If your employer offers health insurance discounts for wearing a Fitbit, logging meals, or completing 'health assessments,' in outcome-based wellness programs your results can change what you pay. The data flows from your fitness tracker to the wellness platform (Personify Health (formerly Virgin Pulse), Rally Health, Vitality) to the insurance company. Life insurers can use outside data sources when pricing; what they use varies. The Affordable Care Act bars charging more for pre-existing conditions, and it sets limits on how big wellness-program incentives can be.",
    steps: [
      { text: "Check if your employer has a wellness program that connects to fitness trackers or health apps" },
      { text: "If so: review what data the wellness platform collects. Look for the privacy policy on the platform (Personify Health, Rally Health, Vitality, etc.)" },
      { text: "Consider disconnecting your personal fitness tracker from employer wellness programs" },
      { text: "Review your health insurance plan documents for references to 'wellness incentives' or 'biometric screenings' -- these feed data to insurers" },
    ],
    debriefQs: HEALTH_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"Your employer is offering you a discount to wear a Fitbit. In outcome-based programs, what the tracker records can change what you pay. Know the trade before you take the discount."`,
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
    briefing: "Apple Health and Android's Health Connect are hubs that many apps connect to. An app you let read a kind of health data can read it whatever app wrote it. So a calorie counter you allowed to read heart rate gets your watch's heart rate too. Review every app connected to your health data hub and revoke access from anything that does not need it. Be especially careful with apps that request write AND read access -- read access to your entire health profile is the real prize.",
    steps: [
      { text: "iPhone: Settings → Health → Data Access & Devices (iOS 18 and later: Settings → Apps → Health) → review every app. Remove any you no longer use." },
      { text: 'Android: open Health Connect (Android 14 and later: Settings → Security and privacy → Privacy controls → Health Connect, or search Settings for it; Android 13 and earlier: the Health Connect app) → App permissions → review each app', url: 'https://support.google.com/android/answer/12201230' },
      { text: "For each app: ask 'does this app need access to ALL my health data, or just the data it creates?'" },
      { text: "Revoke access from apps you tried once and forgot. Each one is an open pipeline." },
    ],
    debriefQs: HEALTH_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: `"Apple Health is a hub. Any app you once let read your heart rate, sleep or cycle data can still read it, from every source, until you take that away. The meditation app you tried once in 2021 might still be on the list. Let's review every connection."`,
      debrief: scoutHealth(
        `"Health data permissions locked down. Your biometric hub is no longer an all-you-can-read buffet."`,
        `"Already tight. You have been managing your health permissions."`,
        `"Some revoked. Come back for the rest -- each connected app is a potential data leak."`,
      ),
    },
    estimatedMinutes: 8,
  },
];
