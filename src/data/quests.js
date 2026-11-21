// Quick Quest: a problem in plain words, and the mission that fixes it (Liz 2026-11-20: "a list
// that goes straight to the fix"). targetMissions are tried in order; the first one the player can
// start (its account on, not locked behind a check it needs first) is where the pick goes, one not
// done yet before one done. None of them: the district, as before (screens/quick-quest.js).
// A Secure Login or Lockdown waits for its account's check, so each fix is followed by that check.
const fixThenCheck = (acct, check) => [`${acct}-fortify-password`, `${acct}${check}`];
// Email: the account's password reset, else its breach check (the reset unlocks after it).
const emailFix = (accts) => accts.flatMap((a) => fixThenCheck(a, '-recon-breach'));

export const QUICK_QUESTS = [
  {
    id: 'email-hacked',
    title: 'My email got hacked',
    description: 'Suspicious logins, password reset emails you didn\'t request, or locked out of your account.',
    targetDistrict: 'master-keys',
    targetMissions: emailFix(['gmail', 'outlook', 'yahoo', 'icloud', 'protonmail', 'google', 'microsoft', 'apple_id']),
  },
  {
    id: 'bank-fraud',
    title: 'Suspicious bank or card charge',
    description: 'A charge you don\'t recognize, a payment app notification that wasn\'t you.',
    targetDistrict: 'vault',
    targetMissions: [
      ...fixThenCheck('primary_bank', '-recon-password'),
      ...fixThenCheck('credit_card', '-recon-password'),
      ...fixThenCheck('paypal', '-recon-password'),
      ...fixThenCheck('venmo', '-recon-password'),
      ...fixThenCheck('cashapp', '-recon-password'),
    ],
  },
  {
    id: 'social-impersonation',
    title: 'Someone\'s impersonating me online',
    description: 'Posts you didn\'t write, DMs you didn\'t send, or a cloned account.',
    targetDistrict: 'square',
    targetMissions: [
      'instagram-fortify-lockdown', 'instagram-recon-login',
      'facebook-fortify-password', 'facebook-recon-password',
      'twitter-fortify-lockdown', 'twitter-recon-apps',
      'tiktok-fortify-lockdown', 'tiktok-recon-devices',
      'linkedin-fortify-lockdown', 'linkedin-recon-login',
    ],
  },
  {
    id: 'files-exposed',
    title: 'My files or data might be exposed',
    description: 'Shared links you didn\'t set, files accessed from an unfamiliar device.',
    targetDistrict: 'archives',
    targetMissions: ['gdrive-recon-shares', 'dropbox-fortify-devices', 'dropbox-recon-service', 'github-recon-security'],
  },
  {
    id: 'scam-contact',
    title: 'I got a scam call, text, or email',
    description: 'Phishing link clicked, suspicious caller who knew your info, smishing text.',
    targetDistrict: 'perimeter',
    targetMissions: ['sim_protection-fortify-pin', 'scam_defense-fortify-tools'],
  },
  {
    id: 'shopping-breach',
    title: 'My shopping account was breached',
    description: 'Orders you didn\'t place, address changed, or saved payment used without permission.',
    targetDistrict: 'marketplace',
    targetMissions: [
      'amazon-fortify-lockdown', 'amazon-recon-activity',
      'ebay-fortify-lockdown', 'ebay-recon-activity',
      'temu-fortify-password', 'temu-recon-activity',
      'shein-fortify-password', 'shein-recon-activity',
    ],
  },
  {
    id: 'identity-theft',
    title: 'I think someone filed taxes or claims in my name',
    description: 'IRS notice you didn\'t expect, denied benefits, or credit activity you don\'t recognize.',
    targetDistrict: 'capitol',
    targetMissions: ['irs-fortify-ip-pin', 'irs-recon-claim', 'govt_id_defense-fortify-irs-pin', 'credit_freeze-fortify-equifax'],
  },
  {
    id: 'data-broker',
    title: 'My personal info is showing up on search sites',
    description: 'Your address, phone number, or relatives listed on people-search sites.',
    targetDistrict: 'reclamation',
    targetMissions: ['people_search-recon-find-yourself'],
  },
  {
    id: 'work-target',
    title: 'My work makes me a target',
    description: 'You report, organize, run a clinic or a mutual aid network, and someone with more power wants to stop you.',
    targetDistrict: 'field',
    targetMissions: ['who_is_after_you-recon-threat-model'],
  },
];
