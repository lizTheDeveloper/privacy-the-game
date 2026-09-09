// New accounts to add to accounts.js
// Vault additions (from bench's ACCOUNT_CATEGORIES financial section)
// Capitol additions (from bench's government section)

export const VAULT_CAPITOL_ACCOUNTS = {
  // Chapter 2: The Vault -- additions
  crypto_exchange: {
    name: 'Crypto Exchange',
    district: 'vault',
    building: 'assets/buildings/iso_liberated.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    riskLevel: 'high',
  },
  investment_account: {
    name: 'Investment Account',
    district: 'vault',
    building: 'assets/buildings/iso_liberated.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    riskLevel: 'high',
  },
  // Chapter 6: The Capitol -- additions
  state_dmv: {
    name: 'State DMV',
    district: 'capitol',
    building: 'assets/buildings/iso_liberated.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    riskLevel: 'high',
  },
  healthcare_portal: {
    name: 'Healthcare Portal',
    district: 'capitol',
    building: 'assets/buildings/iso_liberated.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    securityUrl: 'https://www.healthcare.gov/login/',
    riskLevel: 'high',
  },
  student_loans: {
    name: 'Student Loan Servicer',
    district: 'capitol',
    building: 'assets/buildings/iso_liberated.png',
    buildingDark: 'assets/buildings/iso_occupied.png',
    securityUrl: 'https://studentaid.gov/fsa-id/sign-in/landing',
    riskLevel: 'high',
  },
};
