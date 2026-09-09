export const QUICK_QUESTS = [
  {
    id: 'email-hacked',
    title: 'My email got hacked',
    description: 'Suspicious logins, password reset emails you didn\'t request, or locked out of your account.',
    targetDistrict: 'master-keys',
  },
  {
    id: 'bank-fraud',
    title: 'Suspicious bank or card charge',
    description: 'A charge you don\'t recognize, a payment app notification that wasn\'t you.',
    targetDistrict: 'vault',
  },
  {
    id: 'social-impersonation',
    title: 'Someone\'s impersonating me online',
    description: 'Posts you didn\'t write, DMs you didn\'t send, or a cloned account.',
    targetDistrict: 'square',
  },
  {
    id: 'files-exposed',
    title: 'My files or data might be exposed',
    description: 'Shared links you didn\'t set, files accessed from an unfamiliar device.',
    targetDistrict: 'archives',
  },
  {
    id: 'scam-contact',
    title: 'I got a scam call, text, or email',
    description: 'Phishing link clicked, suspicious caller who knew your info, smishing text.',
    targetDistrict: 'perimeter',
  },
  {
    id: 'shopping-breach',
    title: 'My shopping account was breached',
    description: 'Orders you didn\'t place, address changed, or saved payment used without permission.',
    targetDistrict: 'marketplace',
  },
  {
    id: 'identity-theft',
    title: 'I think someone filed taxes or claims in my name',
    description: 'IRS notice you didn\'t expect, denied benefits, or credit activity you don\'t recognize.',
    targetDistrict: 'capitol',
  },
  {
    id: 'data-broker',
    title: 'My personal info is showing up on search sites',
    description: 'Your address, phone number, or relatives listed on people-search sites.',
    targetDistrict: 'reclamation',
  },
];
