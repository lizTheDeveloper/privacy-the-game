// Recon campaign, Phase 2 (recon audit X3): per-account recon that checks the
// account itself, replacing 18 "Breach Recon" missions that re-checked the
// player's email address on Have I Been Pwned and called it the account's
// breach check. HIBP searches by address, so only the 8 email-address
// accounts keep an HIBP breach check.
//
// Each mission here `replaces` an old `<acct>-recon-breach`, which stays in
// MISSIONS marked `legacy: true` (hidden, never offered) so old saves load,
// keep their progress and restore the same events.
//
// New question ids, never new meanings for `finding`:
//  - pw_status      what the password manager says about THIS account (Q-PW)
//  - activity       something only the account itself can show (Q-ACT)
//  - service_breach whether this service's own HIBP breach is in the results (Q-SVC)
//  - changed_since  whether the password changed after that breach
//  - provider_breach whether the insurer or provider is on the HHS breach list
// None of them is sent with mission-completed (missionEventData sends its
// own keys only), and build.sql reads none of them.

const SKIP = { value: 'skip', text: 'Couldn’t check right now', severity: 'skip' };

// Q-PW. Pre-filled from the password manager report when it's filed.
function pwQuestion(service) {
  return {
    id: 'pw_status',
    prefill: 'pm-report',
    label: `What does your password manager say about your ${service} password?`,
    hint: `Use the report from “Check your password manager’s security report”. Search it for ${service}.`,
    options: [
      { value: 'pw-leaked', text: 'Listed as leaked or compromised', severity: 'crit' },
      { value: 'pw-reused', text: 'Listed as reused', severity: 'crit' },
      { value: 'pw-clean', text: 'Not flagged', severity: 'safe' },
      { value: 'pw-not-saved', text: 'It isn’t saved in a password manager', severity: 'warn' },
      SKIP,
    ],
  };
}

// Q-ACT, with a label written for the account.
function activityQuestion(label) {
  return {
    id: 'activity',
    label,
    options: [
      { value: 'activity-clean', text: 'All mine', severity: 'safe' },
      { value: 'activity-unknown', text: 'Something I don’t recognize', severity: 'warn' },
      { value: 'activity-confirmed', text: 'Confirmed something I didn’t do', severity: 'crit' },
      SKIP,
    ],
  };
}

// Q-SVC: is this service's own breach, by its HIBP name, in the results?
function serviceQuestion(label, hadPasswords) {
  return {
    id: 'service_breach',
    label,
    hint: 'Your email results list each breach by name. You checked this address in The Master Keys.',
    options: [
      { value: 'in-service-breach', text: 'Yes — it’s in my results', severity: hadPasswords ? 'crit' : 'warn' },
      { value: 'not-in-service-breach', text: 'No', severity: 'safe' },
      SKIP,
    ],
  };
}

function changedSinceQuestion(service, since) {
  return {
    id: 'changed_since',
    label: `Have you changed your ${service} password since ${since}?`,
    showIf: { question: 'service_breach', values: ['in-service-breach'] },
    options: [
      { value: 'yes', text: 'Yes', severity: 'safe' },
      { value: 'no', text: 'No', severity: 'crit' },
      { value: 'unsure', text: 'Not sure', severity: 'warn' },
    ],
  };
}

const pmStep = (what) => ({ text: `Open your password manager’s security report and search for ${what}. Note whether it says leaked, compromised or reused.` });

// Scout, in his understated voice. Every line is true whatever else the
// player answered: the line shown is the most severe answer's (scoutBySeverity).
const PW_LINES = {
  'pw-leaked': '"Your manager has seen this password in a leak. Changing it is the fix."',
  'pw-reused': '"Reused. The same key is lying around somewhere else. A new, unique one fixes that."',
  'pw-clean': '"Your manager has nothing on this one. We leave it alone."',
  'pw-not-saved': '"Not in a manager, so nothing can vouch for it. If you’ve used this password anywhere else, change it."',
  skip: '"No rush. This mission will be here when you’re ready."',
};

const ACTIVITY_LINES = {
  'activity-clean': '"All yours. That’s what we wanted to see."',
  'activity-unknown': '"Something you don’t recognize. It might be nothing. A new password closes the door either way."',
};

const CARD_CALL = 'Call the number on the back of your card and tell them what you didn’t do. Then change the password.';
const reportInApp = (name) => `Report it to ${name} from inside its app or its own website, not through a link or number from an email or text. Then change the password.`;

function scout(briefing, extra = {}) {
  return { briefing, debrief: { ...PW_LINES, ...ACTIVITY_LINES, ...extra } };
}

function recon(fields) {
  return { phase: 'recon', scoutBySeverity: true, estimatedMinutes: 5, ...fields };
}

export const RECON_ACCOUNT_MISSIONS = [
  // ── THE MASTER KEYS ─────────────────────────────────
  recon({
    id: 'facebook-recon-password',
    replaces: 'facebook-recon-breach',
    accountId: 'facebook',
    title: 'Password Recon: Facebook',
    briefing: 'Facebook’s best-known leak is a 2021 dataset of 509 million phone numbers tied to names. It was matched by phone number, so an email search almost never finds it, and Have I Been Pwned’s website no longer searches phone numbers. That dataset is why Facebook-themed scam texts work. Whether your Facebook password is safe is a question for your password manager.',
    steps: [
      pmStep('Facebook'),
      { text: 'In your Have I Been Pwned results from The Master Keys, look for “Facebook Marketplace” (2023) or “Facebook” (the 2021 scrape). Most people who were in the scrape won’t see it there, because it was matched by phone number.' },
      { text: 'Open Facebook → Accounts Center → Password and security → Security Checkup, and follow it.', url: 'https://accountscenter.facebook.com/password_and_security' },
    ],
    debriefQs: [
      pwQuestion('Facebook'),
      serviceQuestion('Is “Facebook” or “Facebook Marketplace” in your results?', false),
    ],
    serviceBreachName: 'Facebook',
    serviceBreachHadPasswords: false,
    scoutDialog: scout('"Facebook isn’t really an email-breach story. The leak that matters was phone numbers. Your password manager knows more about this password than any breach list."', {
      'in-service-breach': '"Your details are on that list. The 2021 scrape had no passwords, and Have I Been Pwned says the Marketplace hashes may not be Facebook passwords. Expect scam messages that look like Facebook, and don’t trust the links in them."',
      'not-in-service-breach': '"Not in your results. Remember the big one was matched by phone number, so that’s not the whole story."',
    }),
  }),

  // ── THE VAULT ───────────────────────────────────────
  recon({
    id: 'primary_bank-recon-password',
    replaces: 'primary_bank-recon-breach',
    accountId: 'primary_bank',
    title: 'Password & Activity Recon: Bank',
    briefing: 'The breach check in The Master Keys looked at your email address. This one looks at the bank itself: whether its password is leaked or reused, and whether anything moved that you didn’t move. A compromised bank login is not a nuisance. It is money, and getting it back takes weeks.',
    steps: [
      pmStep('your bank'),
      { text: 'Go to your bank’s site or app yourself. Type the address or open the app; don’t use a link from an email or text.' },
      { text: 'Open recent transactions for the last 60 days. Look for small test charges and transfers you didn’t make. (In the US, Regulation E gives you 60 days from the statement to report unauthorized electronic transfers.)' },
      { text: 'Open payees, Zelle recipients and linked external accounts. Delete anyone you don’t know.' },
      { text: 'If your bank has a sign-in history or devices page, open it too. Many banks show trusted devices or alerts instead of a history.' },
    ],
    debriefQs: [
      pwQuestion('bank'),
      activityQuestion('Anything in transactions, payees or linked accounts you didn’t do?'),
    ],
    scoutDialog: scout('"This is where it stops being theoretical. We’re looking at the bank itself this time, not your email."', {
      'activity-confirmed': `"${CARD_CALL}"`,
    }),
  }),
  recon({
    id: 'credit_card-recon-password',
    replaces: 'credit_card-recon-breach',
    accountId: 'credit_card',
    title: 'Password & Activity Recon: Credit Card',
    briefing: 'Your card portal holds your card number, billing address and credit limit. The breach check in The Master Keys looked at your email address, not this account. This one checks the card account itself: its password, and the charges, people and addresses on it.',
    steps: [
      pmStep('your card issuer'),
      { text: 'In the card issuer’s app or site, open the last 60 days of charges. Look for small “test” charges ($1–$5) from merchants you don’t know.' },
      { text: 'Check authorized users, and the cards-on-file or recurring merchants list if your issuer shows one.' },
      { text: 'Check that the mailing address and phone number on file are yours.' },
    ],
    debriefQs: [
      pwQuestion('credit card'),
      activityQuestion('Any charges, authorized users or address changes you didn’t make?'),
    ],
    scoutDialog: scout('"A one-dollar charge from a name you’ve never seen is how it usually starts. Let’s look."', {
      'activity-confirmed': '"Call the number on the back of the card and tell them what you didn’t do. A fraud claim usually gets you a new card number. Then change the password."',
    }),
  }),
  recon({
    id: 'paypal-recon-password',
    replaces: 'paypal-recon-breach',
    accountId: 'paypal',
    title: 'Password & Activity Recon: PayPal',
    briefing: 'In late 2022 about 35,000 PayPal accounts were accessed with passwords reused from other sites. That’s the risk here: not a PayPal breach, but a password that also lives somewhere else. PayPal connects to your bank and cards, so check the password and what the account has been doing.',
    steps: [
      pmStep('PayPal'),
      { text: 'On the PayPal website: Settings → Security → Manage your logins. Remove devices you don’t know. (The PayPal app doesn’t have this page.)', url: 'https://www.paypal.com/myaccount/security/devices/manage' },
      { text: 'Settings → Payments → Automatic payments (some accounts call it “Subscriptions and saved businesses”). Cancel any you don’t recognize.' },
      { text: 'Activity: look through the last 60 days.' },
    ],
    debriefQs: [
      pwQuestion('PayPal'),
      activityQuestion('Any device, automatic payment or transaction you don’t recognize?'),
    ],
    scoutDialog: scout('"Those 35,000 accounts weren’t hacked so much as walked into with old passwords. Let’s make sure yours isn’t one of the keys."', {
      'activity-confirmed': `"${reportInApp('PayPal')}"`,
    }),
  }),
  recon({
    id: 'venmo-recon-password',
    replaces: 'venmo-recon-breach',
    accountId: 'venmo',
    title: 'Password & Activity Recon: Venmo',
    briefing: 'Venmo connects to your bank account or debit card, and sending money is a tap. The breach check in The Master Keys looked at your email address. This one checks Venmo itself: its password, the devices it remembers, and the payments.',
    steps: [
      pmStep('Venmo'),
      { text: 'In your Venmo settings, open Remembered devices and remove any you don’t recognize.' },
      { text: 'Look through your transactions for anything you didn’t send or request.' },
      { text: 'While you’re in Settings → Privacy, note whether your default is Public. The privacy mission deals with it.' },
    ],
    debriefQs: [
      pwQuestion('Venmo'),
      activityQuestion('Any device or payment you don’t recognize?'),
    ],
    scoutDialog: scout('"Venmo is built so money moves fast. Let’s make sure only you are moving it."', {
      'activity-confirmed': `"${reportInApp('Venmo')}"`,
    }),
  }),
  recon({
    id: 'cashapp-recon-password',
    replaces: 'cashapp-recon-breach',
    accountId: 'cashapp',
    title: 'Password & Activity Recon: Cash App',
    briefing: 'In 2022 a former employee of Block, Cash App’s parent company, downloaded data on 8.2 million users. That breach isn’t in Have I Been Pwned’s list; Block notified affected customers directly. Your email check can’t tell you about it. The account can: its devices and its activity.',
    steps: [
      pmStep('Cash App'),
      { text: 'In Cash App, tap your profile icon → Your Devices. If any device isn’t yours, tap Log out all other devices.' },
      { text: 'Open the Activity tab and look through the last 60 days.' },
    ],
    debriefQs: [
      pwQuestion('Cash App'),
      activityQuestion('Any device or payment you don’t recognize?'),
    ],
    scoutDialog: scout('"The 2022 leak was an inside job. A password can’t stop that, but the devices list shows who’s signed in now."', {
      'activity-confirmed': `"${reportInApp('Cash App')}"`,
    }),
  }),
  recon({
    id: 'crypto_exchange-recon-password',
    replaces: 'crypto_exchange-recon-breach',
    accountId: 'crypto_exchange',
    title: 'Password & Activity Recon: Crypto Exchange',
    briefing: 'Crypto sent from your account is usually gone for good: there are no chargebacks. The breach check in The Master Keys looked at your email address. This one checks the exchange itself: its password, who is signed in, where withdrawals can go, and which API keys exist.',
    steps: [
      pmStep('your exchange'),
      { text: 'Look at who is signed in. Coinbase: the account activity page lists Active sessions and Confirmed devices. Kraken: your name → Security → Overview → Active sessions. Other exchanges: look in the security settings.' },
      { text: 'Check the withdrawal-address allowlist and API keys. Delete any you didn’t create.' },
      { text: 'Look through your transaction history for sends you didn’t make.' },
    ],
    debriefQs: [
      pwQuestion('exchange'),
      activityQuestion('Any session, device, withdrawal address, API key or send you don’t recognize?'),
    ],
    scoutDialog: scout('"No fraud department can reverse a blockchain. So we look before anything moves."', {
      'activity-confirmed': `"${reportInApp('your exchange')}"`,
    }),
  }),
  recon({
    id: 'investment_account-recon-password',
    replaces: 'investment_account-recon-breach',
    accountId: 'investment_account',
    title: 'Password & Activity Recon: Investment Account',
    briefing: 'Your brokerage or retirement account may hold more than your bank account, behind a password you set at signup. Account takeovers there usually work by changing the beneficiary, the linked bank or the mailing address first. This check looks at those, and at the password.',
    steps: [
      pmStep('your brokerage'),
      { text: 'Open your brokerage’s own security page and look at recent logins or devices. Schwab: Profile → Security Settings → Previous Login. Robinhood: Security and privacy → Devices. Vanguard app: Profile → Settings → Login & security → Device management. Fidelity: Security Center.' },
      { text: 'Check beneficiaries, linked bank accounts and the mailing address.' },
      { text: 'Robinhood customers: your Have I Been Pwned results may show “Robinhood” (2021, emails only). It’s the one brokerage in that list.' },
    ],
    debriefQs: [
      pwQuestion('brokerage'),
      activityQuestion('Any login, beneficiary, linked bank or address change you didn’t make?'),
    ],
    scoutDialog: scout('"Decades of savings, one password. Let’s see what it’s been up to."', {
      'activity-confirmed': `"${reportInApp('your brokerage')}"`,
    }),
  }),

  // ── THE CAPITOL ─────────────────────────────────────
  recon({
    id: 'healthcare_portal-recon-activity',
    replaces: 'healthcare_portal-recon-breach',
    accountId: 'healthcare_portal',
    title: 'Claims Recon: Healthcare',
    briefing: 'Medical identity theft shows up as care you never got: a visit, a prescription, equipment billed in your name. Your insurer’s claims list is where it appears. In the US, providers and insurers must report breaches affecting 500 or more people to HHS, which lists them publicly.',
    steps: [
      { text: 'Sign in to your insurer’s site or app (not a patient portal). Open claims or Explanation of Benefits (EOBs) for the last 12 months.' },
      { text: 'Look for visits, prescriptions or equipment you never got.' },
      { text: 'Search your insurer and your main hospital or clinic on the HHS breach portal.', url: 'https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf' },
      pmStep('your insurer or patient portal'),
    ],
    debriefQs: [
      activityQuestion('Any claim or prescription you didn’t get?'),
      {
        id: 'provider_breach',
        label: 'Is your insurer or provider on the HHS breach list?',
        options: [
          { value: 'on-hhs-list', text: 'Yes', severity: 'warn' },
          { value: 'not-on-hhs-list', text: 'No', severity: 'safe' },
          SKIP,
        ],
      },
      pwQuestion('insurer or patient portal'),
    ],
    scoutDialog: scout('"Medical fraud hides in paperwork nobody reads. Today we read it."', {
      'activity-confirmed': '"Call your insurer’s fraud line, using the number on your insurance card, and tell them which claims weren’t yours. Then change the password."',
      'on-hhs-list': '"They’re on the list. That means your records may be out there. Watch your claims, and the password is worth changing."',
      'not-on-hhs-list': '"Not on the list. That only covers breaches of 500 or more people, but it’s a good sign."',
    }),
  }),

  // ── THE SQUARE ──────────────────────────────────────
  recon({
    id: 'instagram-recon-service',
    replaces: 'instagram-recon-breach',
    accountId: 'instagram',
    title: 'Breach Recon: Instagram',
    briefing: 'Have I Been Pwned lists one Instagram breach: “Instagram”, a January 2026 scrape of 6.2 million email addresses, with phone numbers and usernames. It had no passwords. So the check here is whether your address is on that list, and what your password manager says about the password.',
    steps: [
      { text: 'In your Have I Been Pwned results from The Master Keys, look for “Instagram”.' },
      pmStep('Instagram'),
    ],
    debriefQs: [
      serviceQuestion('Is “Instagram” in your results?', false),
      pwQuestion('Instagram'),
    ],
    serviceBreachName: 'Instagram',
    serviceBreachHadPasswords: false,
    scoutDialog: scout('"One scrape, no passwords in it. Let’s see if you’re on it."', {
      'in-service-breach': '"Your email and username are on a scraped list. Expect fake “Instagram security” emails. The password wasn’t in it."',
      'not-in-service-breach': '"Not on it. Good."',
    }),
  }),
  recon({
    id: 'twitter-recon-service',
    replaces: 'twitter-recon-breach',
    accountId: 'twitter',
    title: 'Breach Recon: Twitter / X',
    briefing: 'Have I Been Pwned lists two Twitter breaches: “Twitter (200M)”, a 2021 scrape of email addresses, and “Twitter”, from January 2022, with email addresses and phone numbers. Neither included passwords. They tie your address to your account, which is what phishing needs.',
    steps: [
      { text: 'In your Have I Been Pwned results from The Master Keys, look for “Twitter (200M)” or “Twitter”.' },
      pmStep('X or Twitter'),
    ],
    debriefQs: [
      serviceQuestion('Is “Twitter (200M)” or “Twitter” in your results?', false),
      pwQuestion('X'),
    ],
    serviceBreachName: 'Twitter',
    serviceBreachHadPasswords: false,
    scoutDialog: scout('"Two scrapes, no passwords in either. They’re a phishing list, not a key."', {
      'in-service-breach': '"Your address is linked to your account on a public list. No password in it. Be suspicious of any email about your X account."',
      'not-in-service-breach': '"Not in either. Good."',
    }),
  }),
  recon({
    id: 'linkedin-recon-service',
    replaces: 'linkedin-recon-breach',
    accountId: 'linkedin',
    title: 'Breach Recon: LinkedIn',
    briefing: 'LinkedIn’s 2012 breach, listed on Have I Been Pwned as “LinkedIn”, included 164 million passwords, stored as unsalted SHA-1 hashes, which are easy to crack. “LinkedIn Scraped Data (2021)” is a different list with no passwords in it.',
    steps: [
      { text: 'In your Have I Been Pwned results from The Master Keys, look for “LinkedIn” (2012). “LinkedIn Scraped Data (2021)” had no passwords, so it doesn’t count here.' },
      pmStep('LinkedIn'),
    ],
    debriefQs: [
      serviceQuestion('Is “LinkedIn” (the 2012 breach) in your results?', true),
      changedSinceQuestion('LinkedIn', '2012'),
      pwQuestion('LinkedIn'),
    ],
    serviceBreachName: 'LinkedIn',
    serviceBreachHadPasswords: true,
    scoutDialog: scout('"This one did leak passwords. The question is whether yours is still the same one."', {
      'in-service-breach': '"Your 2012 LinkedIn password is out there. If it’s still that password, or you used it anywhere else, it goes."',
      'not-in-service-breach': '"Not in the 2012 one. Good."',
    }),
  }),
  recon({
    id: 'discord-recon-password',
    replaces: 'discord-recon-breach',
    accountId: 'discord',
    title: 'Password Recon: Discord',
    briefing: 'Discord isn’t in Have I Been Pwned’s breach list. The real risks are a reused password and a stolen login token, which is why the token mission exists. This one is about the password.',
    steps: [
      pmStep('Discord'),
      { text: 'Discord → User Settings → Authorized Apps. Deauthorize anything you don’t use.' },
    ],
    debriefQs: [pwQuestion('Discord')],
    scoutDialog: scout('"No breach list to check here. Your password manager is the one that knows."'),
  }),
  recon({
    id: 'reddit-recon-password',
    replaces: 'reddit-recon-breach',
    accountId: 'reddit',
    title: 'Password Recon: Reddit',
    briefing: 'Reddit’s 2018 breach (a backup of early accounts from 2007) isn’t in Have I Been Pwned’s list, so an email check says nothing about it. Your password manager can say whether the Reddit password is leaked or reused, and changing the password signs out your other sessions.',
    steps: [
      pmStep('Reddit'),
      { text: 'Reddit’s help describes an account activity page that shows recent IP addresses and can log out all your sessions. Reddit doesn’t give the menu path, so look for it in your account settings. Check the email address on the account too.' },
    ],
    debriefQs: [
      pwQuestion('Reddit'),
      activityQuestion('Any session, IP address or account change you don’t recognize?'),
    ],
    scoutDialog: scout('"Years of opinions under one username. Let’s make sure it’s still only you typing them."', {
      'activity-confirmed': '"Someone else has been in. Change the password. Reddit says a reset logs you out on every device."',
    }),
  }),

  // ── THE ARCHIVES ────────────────────────────────────
  recon({
    id: 'dropbox-recon-service',
    replaces: 'dropbox-recon-breach',
    accountId: 'dropbox',
    title: 'Breach Recon: Dropbox',
    briefing: 'Dropbox’s 2012 breach, listed on Have I Been Pwned as “Dropbox”, included 68 million passwords stored as hashes. Dropbox made affected users who hadn’t changed their password since 2012 reset it in 2016. A password from that era that you reused anywhere else is still a risk.',
    steps: [
      { text: 'In your Have I Been Pwned results from The Master Keys, look for “Dropbox”.' },
      pmStep('Dropbox'),
      { text: 'Dropbox → Settings → Security. Review web browsers, devices and linked apps. Remove anything you don’t know.' },
    ],
    debriefQs: [
      serviceQuestion('Is “Dropbox” in your results?', true),
      changedSinceQuestion('Dropbox', '2012'),
      pwQuestion('Dropbox'),
    ],
    serviceBreachName: 'Dropbox',
    serviceBreachHadPasswords: true,
    scoutDialog: scout('"This one leaked passwords. Let’s see if one of them was yours."', {
      'in-service-breach': '"Your Dropbox password from 2012 is out there. If it’s still that one, or you used it anywhere else, change it."',
      'not-in-service-breach': '"Not in it. Good."',
    }),
  }),

  // ── THE MARKETPLACE ─────────────────────────────────
  recon({
    id: 'amazon-recon-activity',
    replaces: 'amazon-recon-breach',
    accountId: 'amazon',
    title: 'Account Recon: Amazon',
    briefing: 'Amazon isn’t in Have I Been Pwned’s breach list, so the email check says nothing about it. A taken-over Amazon account shows itself in orders, addresses and saved cards. That’s what this checks, along with the password.',
    steps: [
      pmStep('Amazon'),
      { text: 'Open Your Orders. Anything you didn’t order?', url: 'https://www.amazon.com/your-orders/orders' },
      { text: 'In Your Account, check your saved addresses and Your Payments. Any address or card you don’t know?' },
      { text: 'Open Login & security. Check that the email and phone number are yours.' },
    ],
    debriefQs: [
      pwQuestion('Amazon'),
      activityQuestion('Any order, address, card or contact change you didn’t make?'),
    ],
    scoutDialog: scout('"Saved cards and one-click buying. Let’s make sure every click was yours."', {
      'activity-confirmed': `"${reportInApp('Amazon')}"`,
    }),
  }),
  recon({
    id: 'ebay-recon-activity',
    replaces: 'ebay-recon-breach',
    accountId: 'ebay',
    title: 'Account Recon: eBay',
    briefing: 'eBay’s 2014 breach (145 million names, addresses, birth dates and encrypted passwords) is real, but it isn’t in Have I Been Pwned’s list. If you had eBay before 2014, treat that data as out there. This checks the password and the account’s own activity.',
    steps: [
      pmStep('eBay'),
      { text: 'eBay → Account → Sign in and security. Check the devices listed there and anything you don’t recognize.' },
      { text: 'Check your purchase history and addresses.' },
    ],
    debriefQs: [
      pwQuestion('eBay'),
      activityQuestion('Any sign-in, purchase or address you don’t recognize?'),
    ],
    scoutDialog: scout('"The 2014 leak isn’t in the list we searched. The account’s own history is."', {
      'activity-confirmed': `"${reportInApp('eBay')}"`,
    }),
  }),
  recon({
    id: 'uber-recon-activity',
    replaces: 'uber-recon-breach',
    accountId: 'uber',
    title: 'Account Recon: Uber',
    briefing: 'Uber’s 2016 breach (57 million accounts; the license numbers taken were drivers’) isn’t in Have I Been Pwned’s list. A taken-over rider account shows up as trips and orders you didn’t take, paid with your card.',
    steps: [
      pmStep('Uber'),
      { text: 'Sign in at riders.uber.com and open My Trips. Any you didn’t take? Check Uber Eats orders too.', url: 'https://riders.uber.com' },
      { text: 'Open Wallet. Any payment method you don’t know?' },
    ],
    debriefQs: [
      pwQuestion('Uber'),
      activityQuestion('Any trip, order or payment method you don’t recognize?'),
    ],
    scoutDialog: scout('"Rides you never took are hard to miss once you look."', {
      'activity-confirmed': `"${reportInApp('Uber')}"`,
    }),
  }),
];

// Old mission id -> its replacement.
export const REPLACEMENT_FOR = Object.fromEntries(RECON_ACCOUNT_MISSIONS.map((m) => [m.replaces, m]));
