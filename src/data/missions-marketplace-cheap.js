// The Marketplace: the cheap-goods apps (Temu, Shein). The price tag is low
// because the data is part of the payment. Sources, checked 2026-10-18:
//  - Temu Privacy Policy: shares personal info for targeted advertising,
//    "which may be considered a 'sale' under applicable U.S. state privacy
//    laws"; lists "data providers" among its sources. Opt-out toggle at
//    temu.com/bgp_personalized_advertising.html ("Allow Temu to share my data
//    to personalize my ad experience").
//  - Arkansas AG v. PDD Holdings/WhaleCo (filed 2024-06-25): "functionally
//    malware and spyware", "a data-theft business that sells goods online as a
//    means to an end". Nebraska (2025-06) and Kentucky (2025-07) filed similar
//    suits. Temu denies all of it. Allegations, never findings.
//  - Google suspended Pinduoduo (same parent, PDD Holdings) from Google Play in
//    March 2023; off-Play versions were found to contain malware.
//  - NY AG, 2022-10-12: Zoetop (SHEIN, ROMWE) paid $1.9M over a 2018 breach of
//    39M SHEIN accounts (names, emails, hashed passwords, card data). Zoetop
//    said 6.42M were affected; 32.5M+ accounts were never told.
//  - CNIL, 2025-09-01: SHEIN's EU arm fined €150M for ad cookies placed before
//    consent and after "Refuse all".
//  - SHEIN US Privacy Notice: opt out with "Do Not Sell or Share My Personal
//    Information" / "Manage Cookies" in the site footer or the app's Settings
//    menu; access and deletion requests through its Privacy Center. (Its
//    data-broker source is about influencers, "Used for Targeted Advertising:
//    No", so the game doesn't call Shein a broker customer.)
//  - FTC, Data Brokers (May 2014): brokers buy transaction-level purchase data
//    from retailers (what, how much, when, how you paid); one models the
//    purchase history of 190 million consumers from 2,600+ merchants.
import { pwQuestion, activityQuestion, pmSteps, reportInApp, scout, recon } from './missions-recon-accounts.js';

const PASSWORD_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you update your password?',
    options: [
      { value: 'reset-password', text: 'Yes, changed to a new unique password', severity: 'safe' },
      { value: 'already-strong', text: 'It was already unique and strong', severity: 'safe' },
      { value: 'later', text: 'I’ll come back to this', severity: 'skip' },
    ],
  },
];

const PRIVACY_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you review and tighten privacy settings?',
    options: [
      { value: 'tightened', text: 'Yes, reviewed and locked down', severity: 'safe' },
      { value: 'already-tight', text: 'Settings were already tight', severity: 'safe' },
      { value: 'later', text: 'I’ll come back to this', severity: 'skip' },
    ],
  },
];

// What the app can reach on the phone. Never tracked (missionEventData sends
// its own keys only).
function permissionsQuestion(service) {
  return {
    id: 'app_permissions',
    label: `What could the ${service} app reach on your phone?`,
    options: [
      { value: 'perms-broad', text: 'More than a shopping app needs (contacts, precise location, all photos, microphone…)', severity: 'warn' },
      { value: 'perms-minimal', text: 'Only what it needs, or nothing', severity: 'safe' },
      { value: 'perms-no-app', text: 'I don’t have the app, only the website', severity: 'safe' },
      { value: 'skip', text: 'Couldn’t check right now', severity: 'skip' },
    ],
  };
}

const PERMISSIONS_STEP = (service) => ({
  text: `Check what the ${service} app can reach. iPhone: Settings → Apps → ${service} (on older iOS, scroll down Settings to ${service}). Android: Settings → Apps → ${service} → Permissions. Switch off anything a shop doesn’t need: contacts, precise location, microphone, full photo access.`,
});

const PERMISSION_LINES = {
  'perms-broad': '"It could see more of your phone than a store has any reason to. Whatever you switched off just now, it can’t see anymore."',
  'perms-minimal': '"A shop that can only see the shop. That’s how it should be."',
  'perms-no-app': '"Website only. A browser tab can see a lot less than an app can."',
};

export const MARKETPLACE_CHEAP_ACCOUNTS_MISSIONS = [
  // ── TEMU ── (recon, password, the data you pay with)
  recon({
    id: 'temu-recon-activity',
    accountId: 'temu',
    title: 'Account Recon: Temu',
    briefing: 'Temu’s own privacy policy says it shares your personal information for targeted advertising, and that this “may be considered a ‘sale’” under US state privacy laws. It also lists “data providers” among the places it gets information about you. Arkansas, Nebraska and Kentucky have sued Temu’s parent companies, alleging the app collects far more from your phone than a store needs. Temu denies it. Start with what you can see: the password, the orders, and what the app can reach.',
    steps: [
      ...pmSteps('Temu'),
      { text: 'In the Temu app or on its website, open Your orders. Anything you didn’t order?' },
      { text: 'Check your saved addresses and payment methods.' },
      PERMISSIONS_STEP('Temu'),
    ],
    debriefQs: [
      pwQuestion('Temu'),
      activityQuestion('Any order, address or card you don’t recognize?'),
      permissionsQuestion('Temu'),
    ],
    scoutDialog: scout('"Cheap things are cheap for a reason. Part of the price is you. Let’s see what you’ve been paying."', {
      ...PERMISSION_LINES,
      'activity-confirmed': `"${reportInApp('Temu')}"`,
    }),
  }),
  {
    id: 'temu-fortify-password',
    accountId: 'temu',
    phase: 'fortify',
    title: 'Secure Login: Temu',
    briefing: 'A Temu account holds your home address and, usually, a saved card. Shopping accounts like this are often opened on impulse with a password that was already in use somewhere else. Give it its own password, and take off cards you don’t need stored.',
    steps: [
      { text: 'In the Temu app or on its website, open your account settings and find the security section.' },
      { text: 'Change the password: open your password manager, generate 20+ characters, save, paste' },
      { text: 'If Temu offers two-step verification there, turn it on.' },
      { text: 'Open Your payment methods and remove any card you don’t want stored. Checkout takes ten more seconds without it.' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"A password you made up in a hurry for a $4 phone case is still guarding your card number."',
      debrief: {
        'reset-password': '"Its own password now. A leak somewhere else doesn’t open this one."',
        'already-strong': '"Already unique. Good habit for an account you probably opened on a whim."',
        later: '"There’s a saved card behind this one. Come back to it."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'temu-reclaim-privacy',
    accountId: 'temu',
    phase: 'reclaim',
    title: 'The Real Price Tag: Temu',
    briefing: 'Temu shares your data with advertising partners so its ads can follow you, and its own policy says that may count as selling it. You can turn that off. While you’re there, cut the marketing notifications that keep pulling you back in. If you don’t really shop there anymore, the strongest move is deleting the account: data that isn’t there can’t be shared.',
    steps: [
      { text: 'Open Temu’s personalized advertising page while signed in', url: 'https://www.temu.com/bgp_personalized_advertising.html' },
      { text: 'Switch off “Allow Temu to share my data to personalize my ad experience.”' },
      { text: 'Not signed in? Turn it off in every browser and on every device you use with Temu.' },
      { text: 'In the app’s settings, open Notifications and turn off the promotional ones.' },
      { text: 'Not a regular shopper? Temu’s policy says you can delete your account from the app’s Settings. Do that instead of keeping it “just in case.”' },
      { text: 'Read what Temu says it collects and who it shares it with', url: 'https://www.temu.com/privacy-and-cookie-policy.html' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Temu calls it ‘personalizing your ad experience’. Their own policy says the law may call it a sale. There’s a toggle for that."',
      debrief: {
        tightened: '"Sharing off, the nagging off. You still get cheap stuff. They get less of you with it."',
        'already-tight': '"Already off. You read the fine print before it read you."',
        later: '"The toggle takes ten seconds. The profile they’re building doesn’t stop while you wait."',
      },
    },
    estimatedMinutes: 6,
  },

  // ── SHEIN ── (recon, password, the data you pay with)
  recon({
    id: 'shein-recon-activity',
    accountId: 'shein',
    title: 'Account Recon: Shein',
    briefing: 'In 2018 attackers took names, email addresses, hashed passwords and card data from 39 million SHEIN accounts. The company said 6.42 million people were affected and that it was notifying all of them. New York’s Attorney General found more than 32.5 million accounts were never told. The company paid $1.9 million in 2022. If you had Shein in 2018, the password from back then is out there. Check whether you’re still using it.',
    steps: [
      ...pmSteps('Shein'),
      { text: 'In the Shein app or on its website, open My Orders. Anything you didn’t order?' },
      { text: 'Check your address book and saved payment methods.' },
      PERMISSIONS_STEP('SHEIN'),
    ],
    debriefQs: [
      pwQuestion('Shein'),
      activityQuestion('Any order, address or card you don’t recognize?'),
      permissionsQuestion('Shein'),
    ],
    scoutDialog: scout('"Thirty-nine million accounts, and most of them were never told. Let’s check if one of them was yours."', {
      ...PERMISSION_LINES,
      'activity-confirmed': `"${reportInApp('Shein')}"`,
    }),
  }),
  {
    id: 'shein-fortify-password',
    accountId: 'shein',
    phase: 'fortify',
    title: 'Secure Login: Shein',
    briefing: 'Shein’s 2018 breach took hashed passwords and most customers were never told. If you’ve had the account that long and never changed the password, assume it’s known. Give it a new one of its own, and remove cards you don’t need stored.',
    steps: [
      { text: 'In the Shein app or on its website, open your account settings and find the security section.' },
      { text: 'Change the password: open your password manager, generate 20+ characters, save, paste' },
      { text: 'If Shein offers two-step verification there, turn it on.' },
      { text: 'Open your saved payment methods and remove any card you don’t want stored.' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"If the password is older than 2018, it’s not really yours anymore."',
      debrief: {
        'reset-password': '"New password. Whatever leaked in 2018 doesn’t open anything now."',
        'already-strong': '"Already unique. The 2018 list has nothing on you."',
        later: '"The 2018 password list didn’t expire. Come back to this one."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'shein-reclaim-privacy',
    accountId: 'shein',
    phase: 'reclaim',
    title: 'The Real Price Tag: Shein',
    briefing: 'Shein’s US privacy notice offers a “Do Not Sell or Share My Personal Information” opt-out, which tells you sharing for ads is happening unless you use it. In 2025 France fined Shein €150 million for setting advertising cookies before visitors agreed, and still setting them after they clicked “Refuse all.” So use the opt-out, then ask Shein what it actually holds on you.',
    steps: [
      { text: 'On Shein’s website, scroll to the very bottom' },
      { text: 'Click “Do Not Sell or Share My Personal Information” (it may say “Manage Cookies”).' },
      { text: 'In the app it’s in the Settings menu. Turn the sharing off.' },
      { text: 'Open Shein’s Privacy Center while signed in, and request a copy of your data. Seeing the list is the point.', url: 'https://us.shein.com/user/privacy-center' },
      { text: 'Not a regular shopper? Use the same Privacy Center to ask Shein to delete your account and data.' },
      { text: 'Read where Shein says your data comes from and who gets it', url: 'https://us.shein.com/Consumer-Privacy-Notice-s-101.html' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"A regulator caught them setting ad cookies on people who had clicked ‘Refuse all’. Click it anyway, then make them show you what they’ve got."',
      debrief: {
        tightened: '"Sharing off and a data request filed. When the file arrives, read it. Most people are surprised."',
        'already-tight': '"Already opted out. Keep an eye on it. Opt-outs can quietly reset when you switch devices or clear cookies."',
        later: '"The opt-out is one link at the bottom of the page. Worth the scroll."',
      },
    },
    estimatedMinutes: 8,
  },
];
