// New accounts to merge into ACCOUNTS in accounts.js
// Square additions: reddit, telegram, slack
// Archives additions: icloud_drive, onedrive, employer_sso
// Marketplace additions: spotify, ebay, uber

export const ACCOUNTS_SAM_ADDITIONS = {
  // Chapter 3: The Square -- additions
  reddit: {
    name: 'Reddit',
    district: 'square',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    securityUrl: 'https://www.reddit.com/settings/privacy',
    riskLevel: 'medium',
  },
  telegram: {
    name: 'Telegram',
    district: 'square',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    securityUrl: 'https://my.telegram.org/auth',
    riskLevel: 'medium',
  },
  slack: {
    name: 'Slack',
    district: 'square',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    riskLevel: 'medium',
  },
  // Chapter 4: The Archives -- additions
  icloud_drive: {
    name: 'iCloud Drive',
    district: 'archives',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    securityUrl: 'https://account.apple.com/account/manage',
    riskLevel: 'high',
  },
  onedrive: {
    name: 'OneDrive',
    district: 'archives',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    securityUrl: 'https://account.live.com/proofs/manage',
    riskLevel: 'high',
  },
  employer_sso: {
    name: 'Work / Employer SSO',
    district: 'archives',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    riskLevel: 'high',
  },
  // Chapter 5: The Marketplace -- additions
  spotify: {
    name: 'Spotify',
    district: 'marketplace',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    securityUrl: 'https://www.spotify.com/account/security/',
    riskLevel: 'low',
  },
  ebay: {
    name: 'eBay',
    district: 'marketplace',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    securityUrl: 'https://www.ebay.com/myb/AccountSettings',
    riskLevel: 'medium',
  },
  uber: {
    name: 'Uber',
    district: 'marketplace',
    building: 'assets/buildings/iso_occupied.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    buildingLib: 'assets/buildings/iso_liberated.png',
    securityUrl: 'https://account.uber.com/safety-security',
    riskLevel: 'medium',
  },
};
