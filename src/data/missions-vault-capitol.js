// Missions for The Vault (Chapter 2) and The Capitol (Chapter 6)
// Uses the same debrief schemas as missions.js -- redefined here for standalone use,
// merged by the integration code.

const BREACH_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-breaches', text: 'No breaches found', severity: 'safe' },
      { value: '1-2-breaches', text: 'Found in 1-2 breaches', severity: 'warn' },
      { value: '3plus-breaches', text: 'Found in 3+ breaches', severity: 'crit' },
      { value: 'skip', text: `Couldn't check right now`, severity: 'skip' },
    ],
  },
];

const LOGIN_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-breaches', text: 'No unrecognized logins', severity: 'safe' },
      { value: '1-2-breaches', text: 'Found suspicious activity', severity: 'warn' },
      { value: '3plus-breaches', text: 'Confirmed unauthorized access', severity: 'crit' },
      { value: 'skip', text: `Couldn't check right now`, severity: 'skip' },
    ],
  },
];

const PASSWORD_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you update your password?',
    options: [
      { value: 'reset-password', text: 'Yes, changed to a new unique password', severity: 'safe' },
      { value: 'already-strong', text: 'It was already unique and strong', severity: 'safe' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
    ],
  },
];

const TWO_FA_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you set up two-factor authentication?',
    options: [
      { value: 'enabled-2fa', text: 'Yes, 2FA is now enabled', severity: 'safe' },
      { value: 'already-enabled', text: 'It was already enabled', severity: 'safe' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
    ],
  },
];

const ALERTS_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you set up transaction alerts?',
    options: [
      { value: 'enabled-alerts', text: 'Yes, alerts are on', severity: 'safe' },
      { value: 'already-enabled', text: 'They were already on', severity: 'safe' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
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
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
    ],
  },
];

const ACCOUNT_CLAIMED_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you claim your account?',
    options: [
      { value: 'claimed', text: 'Yes, I created / verified my account', severity: 'safe' },
      { value: 'already-had', text: 'I already had an account', severity: 'safe' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
    ],
  },
];

function scoutBreach(clean, mild, severe) {
  return {
    'no-breaches': clean,
    '1-2-breaches': mild,
    '3plus-breaches': severe,
    'skip': `"No rush. This mission will be here when you're ready."`,
  };
}

function scoutLogin(clean, suspicious, confirmed) {
  return {
    'no-breaches': clean,
    '1-2-breaches': suspicious,
    '3plus-breaches': confirmed,
    'skip': `"Take your time -- we'll circle back."`,
  };
}

export const VAULT_CAPITOL_MISSIONS = [

  // ══════════════════════════════════════════════════════
  // THE VAULT -- Chapter 2
  // "Your money lives here."
  // ══════════════════════════════════════════════════════

  // ── PRIMARY BANK ──────────────────────────────────────
  {
    id: 'primary_bank-recon-breach',
    accountId: 'primary_bank',
    phase: 'recon',
    title: 'Breach Recon: Primary Bank',
    briefing: 'A compromised bank login is not a nuisance -- it is a loss. Actual money, actually gone. Banks will reimburse fraud in most cases, but the process involves weeks of frozen accounts, provisional credits, and phone calls with hold music composed by someone who hates you.',
    steps: [
      { text: `Open haveibeenpwned.com', url: 'https://haveibeenpwned.com` },
      { text: 'Enter the email address you used to register your bank account' },
      { text: 'Note the results -- if breached, that password is already in automated attack scripts' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `This is where it stops being theoretical. A breached bank credential is someone else's direct line to your checking account.`,
      debrief: scoutBreach(
        `"Clean. Your bank's front door is holding. That's real money you just protected."`,
        `"Some exposure. Could be from the bank, could be from any service that shares your email. Either way -- new password time."`,
        `"Multiple breaches. The stakes here are denominated in dollars. Let's fortify."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'primary_bank-fortify-password',
    accountId: 'primary_bank',
    phase: 'fortify',
    title: 'Secure Login: Primary Bank',
    briefing: `If your bank password is the same as any other account -- any other account at all -- it's already been tried against your bank by automated scripts. Your password manager can generate a unique one. Let it do its job.`,
    steps: [
      { text: `Log into your bank's website or app` },
      { text: 'Go to Settings → Security → Change Password' },
      { text: 'Use your password manager to generate a new unique password (16+ characters)' },
      { text: `Save it in your password manager -- don't try to memorize it` },
      { text: 'Verify you can log back in with the new password' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"Your password manager knows the drill by now. Generate, save, move on. The rhythm from Chapter 1 works here too."',
      debrief: {
        'reset-password': `"Fresh password on the vault door. That's real money locked down."`,
        "already-strong": `"Already unique. You treat your bank password with the respect it deserves."`,
        "later": `"The stakes here are measured in your actual bank balance. Come back soon."`,
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "primary_bank-fortify-2fa",
    accountId: "primary_bank",
    phase: "fortify",
    title: "2FA Setup: Primary Bank",
    briefing: "Most banks offer SMS-based 2FA, and some now support authenticator apps. Even SMS -- which can be bypassed by SIM swapping -- is dramatically better than nothing. Turn on whatever they offer.",
    steps: [
      { text: `Log into your bank's website` },
      { text: 'Go to Settings → Security → Two-Factor Authentication (may be called "Extra Security" or "Login Verification")' },
      { text: 'Enable it -- choose authenticator app if available, SMS if not' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: `A bank without 2FA is a vault with just a combination lock. Turn on whatever they offer -- we'll take SMS over nothing.`,
      debrief: {
        'enabled-2fa': '"2FA on the bank. Even a SIM swapper now needs your phone AND your password."',
        'already-enabled': '"Already enabled. Ahead of 80% of bank customers."',
        'later': '"Real money behind this door. Come back soon."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'primary_bank-fortify-alerts',
    accountId: 'primary_bank',
    phase: 'fortify',
    title: 'Transaction Alerts: Primary Bank',
    briefing: 'Transaction alerts tell you the moment money moves. Set them for every transaction over $1 -- not $100, not $50. Fraud starts with small test charges ($1, $5) to see if the card works before the big hit. If you catch the $1, you stop the $1,000.',
    steps: [
      { text: `Log into your bank's website or app` },
      { text: "Go to Settings → Notifications or Alerts" },
      { text: "Enable alerts for ALL transactions (set threshold to $0 or $1)" },
      { text: "Enable alerts for new payees, large withdrawals, and login attempts" },
      { text: "Choose push notifications and/or email -- whichever you actually read" },
    ],
    debriefQs: ALERTS_DEBRIEF,
    scoutDialog: {
      briefing: `A $1.00 charge from 'INTL DIGITAL SVCS\` is not a rounding error -- it's a thief testing your card before they max it out. Set alerts for everything over $1.`,
      debrief: {
        'enabled-alerts': `"Alerts on. You'll know about charges before the thief's coffee gets cold."`,
        "already-enabled": `"Already watching every dollar. Good instinct."`,
        "later": `"The alert setup takes two minutes. It catches fraud before it becomes a problem."`,
      },
    },
    estimatedMinutes: 3,
  },

  // ── CREDIT CARD PORTAL ────────────────────────────────
  {
    id: "credit_card-recon-breach",
    accountId: "credit_card",
    phase: "recon",
    title: "Breach Recon: Credit Card",
    briefing: "Your credit card portal stores your card number, billing address, and transaction history. The email you registered with has probably appeared in breaches from other services -- and if you reused the password, your credit card account is one automated login attempt from compromise.",
    steps: [
      { text: `Open haveibeenpwned.com', url: 'https://haveibeenpwned.com` },
      { text: "Enter the email associated with your credit card account" },
      { text: "Note any breaches -- especially from retail or financial services" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Credit card portals are less targeted than banks, but the email you registered with is in every breach database. If the password matches…"',
      debrief: scoutBreach(
        '"Clean. No exposure on the credit card front."',
        '"Some exposure. The card portal is only as safe as its password."',
        '"Multiple breaches. Change the password and check your recent statements for small test charges."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "credit_card-fortify-password",
    accountId: "credit_card",
    phase: "fortify",
    title: "Secure Login: Credit Card",
    briefing: "Your credit card portal password protects your card number, your billing address, and your credit limit. Generate a new one in your password manager -- you know the drill from Chapter 1.",
    steps: [
      { text: "Log into your credit card portal" },
      { text: "Go to Account Settings → Security → Change Password" },
      { text: "Generate a new unique password in your password manager" },
      { text: "While you're here, check if 2FA is available and turn it on" },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"Password manager, generate, save. The rhythm carries over. This one guards your credit limit."',
      debrief: {
        "reset-password": '"New password on the credit card portal. One less door to your wallet."',
        "already-strong": '"Already unique. Moving on."',
        "later": '"Someone with this password can see your full card number. Worth fixing."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "credit_card-fortify-alerts",
    accountId: "credit_card",
    phase: "fortify",
    title: "Transaction Alerts: Credit Card",
    briefing: "Same as the bank: set alerts for every transaction over $1. Credit cards are actually safer than debit cards for fraud (easier to dispute, doesn't drain your bank account directly), but you still want to catch it immediately.",
    steps: [
      { text: "Log into your credit card portal" },
      { text: "Go to Notifications or Alerts settings" },
      { text: "Enable transaction alerts for all purchases (threshold: $1 or $0)" },
      { text: "Enable alerts for new authorized users, balance threshold, and payment due dates" },
    ],
    debriefQs: ALERTS_DEBRIEF,
    scoutDialog: {
      briefing: '"Credit cards have better fraud protection than debit cards, but you still want to know immediately. The first sign of a stolen card is a $1 test charge."',
      debrief: {
        "enabled-alerts": '"Alerts on. Your credit card now reports every transaction in real time."',
        "already-enabled": `"Already monitoring. The Vault's perimeter alarm is working."`,
        "later": '"Two minutes of setup catches fraud in real time. Worth it."',
      },
    },
    estimatedMinutes: 3,
  },

  // ── PAYPAL ────────────────────────────────────────────
  {
    id: "paypal-recon-breach",
    accountId: "paypal",
    phase: "recon",
    title: "Breach Recon: PayPal",
    briefing: "PayPal is the most credential-stuffed service on the internet. In 2022, attackers accessed 35,000 accounts by trying passwords leaked from other sites. If you used the same password on PayPal and on that recipe site that got breached in 2019, your PayPal password is compromised too.",
    steps: [
      { text: `Open haveibeenpwned.com", url: "https://haveibeenpwned.com` },
      { text: "Enter your PayPal email address" },
      { text: "Note any breaches -- PayPal's own 2022 incident was credential stuffing, not a server breach" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"PayPal's 2022 breach wasn't even a hack -- attackers just tried passwords from other breaches and 35,000 of them worked. That's what password reuse does."`,
      debrief: scoutBreach(
        `"Clean. Your PayPal credentials aren't in the usual databases."`,
        `"Some exposure. If this password is shared with anything -- anything -- it's been tried on PayPal."`,
        `"Multiple breaches. Your email has been in enough dumps that automated tools are definitely trying it on PayPal. New password, now."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "paypal-fortify-password",
    accountId: "paypal",
    phase: "fortify",
    title: "Secure Login: PayPal",
    briefing: "PayPal connects to your bank and your cards. A unique password here is the difference between your money staying yours and a fraud dispute. Generate one in your password manager.",
    steps: [
      { text: `Open PayPal Security Settings", url: "https://www.paypal.com/myaccount/settings/security` },
      { text: `Click "Update" next to Password` },
      { text: "Generate a new unique password in your password manager" },
      { text: `While you're here, enable 2FA: click "Set up" next to "2-step verification"` },
      { text: "Choose authenticator app over SMS if available" },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"Password and 2FA in one visit. Your password manager generates the password, your authenticator app handles the second factor. Two minutes, two layers."',
      debrief: {
        "reset-password": '"New PayPal password and 2FA. Your money just got a fresh lock and a deadbolt."',
        "already-strong": '"Already unique with 2FA. Good -- PayPal is one of the few accounts where that discipline directly protects your bank balance."',
        "later": `"The credential-stuffing bots don't take breaks. Come back to this."`,
      },
    },
    estimatedMinutes: 5,
  },

  // ── VENMO ─────────────────────────────────────────────
  {
    id: "venmo-recon-breach",
    accountId: "venmo",
    phase: "recon",
    title: "Breach Recon: Venmo",
    briefing: "Venmo connects directly to your bank account or debit card. It's also the app where your transaction history defaults to public -- everyone can see who you pay and what you write in the memo. A breach here hits your money and your privacy simultaneously.",
    steps: [
      { text: `Open haveibeenpwned.com", url: "https://haveibeenpwned.com` },
      { text: "Enter the email or phone number tied to your Venmo" },
      { text: "Note any breaches" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"Venmo connects to your bank and defaults your transactions to public. It's optimized for convenience, not for the moment someone else has your password."`,
      debrief: scoutBreach(
        '"Clean. Your Venmo credentials are off the market."',
        '"Some exposure. This one connects to your bank. New password."',
        `"Multiple breaches. Change the password and check if anyone's sent themselves money from your account."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'venmo-fortify-password',
    accountId: 'venmo',
    phase: 'fortify',
    title: 'Secure Login: Venmo',
    briefing: `Venmo makes sending money frictionless -- tap, amount, send. That's great for you and catastrophic if someone else has your password. New password plus payment PIN in one visit.`,
    steps: [
      { text: `Open Venmo Settings', url: 'https://venmo.com/account/settings/security` },
      { text: 'Change your password (generate in password manager)' },
      { text: 'Enable "Security Lock" -- this requires PIN or biometrics for every payment' },
      { text: 'Set a PIN that is NOT your phone unlock PIN or your bank PIN' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: `"New password plus payment PIN. Even if someone gets your password, they still can't send your money without your face or your fingerprint."`,
      debrief: {
        "reset-password": `"Venmo locked: new password and payment PIN. Your frictionless payment app now has friction for attackers."`,
        "already-strong": `"Already unique with payment PIN. Good instinct on a direct-to-bank app."`,
        "later": `"This one connects to your bank. Don't sit on it."`,
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'venmo-reclaim-privacy',
    accountId: 'venmo',
    phase: 'reclaim',
    title: 'Privacy Lockdown: Venmo',
    briefing: `Venmo's default transaction privacy is public. Every payment you make -- the amount, the recipient, the memo -- is visible to anyone. A BuzzFeed reporter tracked the President's Venmo transactions in 2021. Two taps fix this.`,
    steps: [
      { text: `Open Venmo Privacy Settings', url: 'https://venmo.com/account/settings/privacy` },
      { text: 'Set "Default Privacy Setting" to Private' },
      { text: 'Set "Friends List" visibility to Private' },
      { text: 'Scroll through your past transactions -- change any public ones to private' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"Venmo defaults all transactions to public. Your rent, your dinner split, your therapist copay. A reporter found the President's Venmo in ten minutes. Fix this."`,
      debrief: {
        "tightened": `"Transactions set to private. Your financial life just disappeared from public view."`,
        "already-tight": `"Already private. You're one of the few Venmo users who found the setting."`,
        'later': '"This is the single highest-impact privacy setting in The Vault. Two taps."',
      },
    },
    estimatedMinutes: 3,
  },

  // ── CASH APP ──────────────────────────────────────────
  {
    id: 'cashapp-recon-breach',
    accountId: 'cashapp',
    phase: 'recon',
    title: 'Breach Recon: Cash App',
    briefing: `Cash App had a major breach in 2022 when a former employee downloaded data on 8.2 million users -- names, brokerage account numbers, portfolio values. The insider threat is the one your password can't stop, but securing the account limits what anyone can do with the stolen data.`,
    steps: [
      { text: `Open haveibeenpwned.com', url: 'https://haveibeenpwned.com` },
      { text: 'Enter the email or phone number tied to Cash App' },
      { text: 'Note any breaches' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"Cash App's 2022 breach was an inside job -- a former employee walked out with 8.2 million users\` data. The insider threat is the one the firewall doesn't see."`,
      debrief: scoutBreach(
        `"Clean. Your Cash App credentials aren't in the usual databases."`,
        `"Some exposure. Could be from Cash App's breach or another service."`,
        `"Multiple breaches. Secure the account and check your balance."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "cashapp-fortify-password",
    accountId: "cashapp",
    phase: "fortify",
    title: "Secure Login: Cash App",
    briefing: `Cash App uses magic-link login -- they send a code to your email or phone. That means whoever controls your email controls your Cash App. The password to secure here is your email's. While you're in the app, enable Security Lock.`,
    steps: [
      { text: "Open Cash App → tap your profile icon → Security & Privacy" },
      { text: `Enable "Security Lock" (requires PIN, Touch ID, or Face ID for every payment)` },
      { text: "Set a PIN that is NOT your phone unlock PIN" },
      { text: "Verify the email connected to Cash App is secured (unique password + 2FA from Chapter 1)" },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: `"Cash App's magic link means your email IS your password. If you secured your email in Chapter 1, half the work is done. Security Lock finishes the job."`,
      debrief: {
        "reset-password": '"Security Lock enabled. Every Cash App payment now requires your face or your fingerprint."',
        "already-strong": '"Already locked. You understand the magic-link chain of trust."',
        "later": `"If your email was secured in Chapter 1, you're halfway there. The Security Lock is the other half."`,
      },
    },
    estimatedMinutes: 3,
  },

  // ── CRYPTO EXCHANGE ───────────────────────────────────
  {
    id: "crypto_exchange-recon-breach",
    accountId: "crypto_exchange",
    phase: "recon",
    title: "Breach Recon: Crypto Exchange",
    briefing: "Crypto is the one place where stolen money is gone forever. No chargebacks, no fraud department, no reversal. The blockchain does not care about your feelings. Exchanges like Coinbase, Kraken, and Gemini have all had credential-related incidents.",
    steps: [
      { text: `Open haveibeenpwned.com", url: "https://haveibeenpwned.com` },
      { text: "Enter the email tied to your crypto exchange account" },
      { text: "Note any breaches -- crypto accounts are the highest-value targets in The Vault" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"A stolen bank password costs you weeks of paperwork. A stolen crypto password costs you your balance, permanently. No chargebacks on the blockchain."',
      debrief: scoutBreach(
        '"Clean. Your exchange credentials are off the grid."',
        '"Some exposure on a crypto account. This is priority-zero. New password, authenticator app, hardware key if they support it."',
        '"Multiple breaches. Change the password, enable every security option the exchange offers, and consider moving assets to cold storage."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "crypto_exchange-fortify-lockdown",
    accountId: "crypto_exchange",
    phase: "fortify",
    title: "Full Lockdown: Crypto Exchange",
    briefing: "Crypto accounts deserve the strongest security you have. New password, authenticator app (NOT SMS -- SIM swapping specifically targets crypto holders), withdrawal address whitelisting, and check for rogue API keys. All in one visit.",
    steps: [
      { text: "Log into your crypto exchange" },
      { text: "Change your password -- use your password manager, 20+ characters" },
      { text: "Enable 2FA with an authenticator app or hardware key (NOT SMS)" },
      { text: "Enable withdrawal address whitelisting (only pre-approved addresses can receive funds)" },
      { text: "Go to API Keys -- revoke any you didn't create or no longer use" },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"SIM swapping exists because of crypto. Attackers port your number, receive your SMS codes, drain your exchange. Authenticator app or hardware key. Never SMS on crypto."',
      debrief: {
        "reset-password": '"Crypto account locked down: new password, authenticator 2FA, whitelisted addresses. The vault within the Vault."',
        "already-strong": `"Already locked down. Make sure withdrawal whitelisting is on -- that's the kill switch even if everything else fails."`,
        "later": '"The urgency here is proportional to your balance. No chargebacks in crypto."',
      },
    },
    estimatedMinutes: 10,
  },

  // ── INVESTMENT ACCOUNT ────────────────────────────────
  {
    id: "investment_account-recon-breach",
    accountId: "investment_account",
    phase: "recon",
    title: "Breach Recon: Investment Account",
    briefing: "Your brokerage or retirement account probably holds more money than your bank account -- but probably has a weaker password. Fidelity had a breach in 2024 exposing 77,000 customers' personal data. These accounts hold your retirement savings, your SSN, and your bank routing numbers.",
    steps: [
      { text: `Open haveibeenpwned.com", url: "https://haveibeenpwned.com` },
      { text: "Enter the email tied to your brokerage (Fidelity, Schwab, Vanguard, Robinhood, etc.)" },
      { text: "Note any breaches" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Your retirement account probably holds more money than your bank account. It also probably has a password you set during signup and never thought about again."',
      debrief: scoutBreach(
        '"Clean. Your retirement nest egg is off the radar."',
        '"Some exposure. This account likely holds more than your checking account. Treat the password accordingly."',
        '"Multiple breaches. New password, 2FA, and check for unauthorized trades or beneficiary changes."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "investment_account-fortify-password",
    accountId: "investment_account",
    phase: "fortify",
    title: "Secure Login: Investment Account",
    briefing: "New password and 2FA on the account that holds your retirement savings. Fidelity and Schwab support security keys. For an account measured in decades of savings, use the strongest option available.",
    steps: [
      { text: "Log into your brokerage account" },
      { text: "Go to Security Settings → Change Password" },
      { text: "Generate a new unique password in your password manager" },
      { text: "Enable 2FA -- authenticator app or security key" },
      { text: `Check your beneficiary designations while you're here -- make sure they're correct` },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: `"Password, 2FA, and a beneficiary check -- all in one visit. An attacker who changes your beneficiary and waits is playing a longer game than most people think about."`,
      debrief: {
        "reset-password": `"Investment account secured: new password, 2FA, beneficiaries verified. Your retirement just got a full security upgrade."`,
        "already-strong": `"Already strong with 2FA. Did you check the beneficiaries? That's the silent risk."`,
        'later': '"The balance in this account is the urgency. Come back proportionally."',
      },
    },
    estimatedMinutes: 8,
  },


  // ══════════════════════════════════════════════════════
  // THE CAPITOL -- Chapter 6
  // "Legal identity. Compromise here is identity theft
  //  in the fullest sense."
  // ══════════════════════════════════════════════════════

  // ── SSA (SOCIAL SECURITY) ─────────────────────────────
  {
    id: "ssa-recon-claim",
    accountId: "ssa",
    phase: "recon",
    title: "Claim Your SSA Account",
    briefing: "The most important thing about your my Social Security account is whether it exists. If you haven't created one, an identity thief can create one using your SSN -- and control your Social Security record. The 2017 Equifax breach put 147 million SSNs on the market. Yours is almost certainly out there. Claim it first.",
    steps: [
      { text: `Go to my Social Security", url: "https://www.ssa.gov/myaccount/` },
      { text: `If you DON'T have an account: click "Create an Account" -- this prevents someone else from claiming your SSN` },
      { text: "If you DO have an account: log in and verify your address, phone, and direct deposit are correct" },
      { text: "Check for any benefit applications or address changes you didn't make" },
    ],
    debriefQs: ACCOUNT_CLAIMED_DEBRIEF,
    scoutDialog: {
      briefing: `"The Equifax breach put 147 million SSNs on the market. Your SSN is not a secret anymore -- it's a shared key. The defense is claiming the account before someone else does."`,
      debrief: {
        "claimed": '"Account claimed. You just prevented someone else from filing for Social Security benefits as you."',
        "already-had": '"Already claimed. Verify the contact info is still yours -- address changes are how benefits get redirected."',
        "later": '"This is a race. If someone claims it first, the cleanup takes months. Prioritize this."',
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "ssa-fortify-lockdown",
    accountId: "ssa",
    phase: "fortify",
    title: "Secure & Lock: SSA Account",
    briefing: "Your SSA account routes through Login.gov or ID.me. Whichever one you have, lock it down with a unique password and 2FA -- this same login protects your SSA, your IRS, your VA benefits, and any other federal service. Also consider SSA's Self Lock feature, which blocks E-Verify queries against your SSN.",
    steps: [
      { text: `Log into my Social Security", url: "https://www.ssa.gov/myaccount/` },
      { text: "Note whether your account uses Login.gov or ID.me" },
      { text: "Go to that provider's security settings and change the password (use password manager)" },
      { text: "Enable 2FA -- authenticator app on Login.gov, SMS verification on ID.me" },
      { text: `Back in SSA: consider enabling "Self Lock" to block E-Verify queries against your SSN` },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: `"Login.gov or ID.me is the skeleton key to federal services. Secure it once and you've locked down SSA, IRS, VA, and state unemployment. One action, multiple buildings."`,
      debrief: {
        "reset-password": '"Federal identity provider secured. Every government service behind it is now harder to breach."',
        "already-strong": `"Already locked down. The Capitol's front gate was pre-fortified."`,
        "later": '"This one login protects multiple government accounts. High priority."',
      },
    },
    estimatedMinutes: 10,
  },

  // ── IRS (TAX ACCOUNT) ────────────────────────────────
  {
    id: "irs-recon-claim",
    accountId: "irs",
    phase: "recon",
    title: "Claim Your IRS Account",
    briefing: "Tax identity theft is a $5.7 billion annual industry. Someone files a return with your SSN before you do, claims a fat refund, and you spend 18 months proving you're you. Step one: claim your IRS online account before they do.",
    steps: [
      { text: `Go to IRS Online Account", url: "https://www.irs.gov/payments/your-online-account` },
      { text: "If you DON'T have an account: create one through ID.me -- this prevents someone else from claiming your tax identity" },
      { text: "If you DO have an account: log in and check your tax return history" },
      { text: `Look for any returns filed that you didn't file, or address/bank changes you didn't make` },
    ],
    debriefQs: ACCOUNT_CLAIMED_DEBRIEF,
    scoutDialog: {
      briefing: `"Tax identity theft: someone files your return, takes your refund, and you find out when the IRS rejects your real return months later. Claim the account. File first."`,
      debrief: {
        "claimed": `"IRS account claimed. You just made it much harder for someone to file a tax return in your name."`,
        "already-had": `"Already claimed. Check the return history -- phantom tax returns are the canary for tax identity theft."`,
        'later': `"This is time-sensitive if you haven't filed this year's return yet. Claim it."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: 'irs-fortify-ip-pin',
    accountId: 'irs',
    phase: 'fortify',
    title: 'Get an IRS Identity Protection PIN',
    briefing: `The IRS Identity Protection PIN is a six-digit number that must be included on any tax return filed with your SSN. Without it, the return gets rejected -- even if the thief has your SSN, your name, and your address. It's effectively 2FA for your tax identity. Free, takes five minutes.`,
    steps: [
      { text: `Go to IRS Get an IP PIN', url: 'https://www.irs.gov/identity-theft-fraud-scams/get-an-identity-protection-pin` },
      { text: `Click "Get an IP PIN" and verify your identity through ID.me` },
      { text: "The IRS will issue you a 6-digit PIN -- write it down and store it with your tax documents" },
      { text: "You'll get a new PIN each year in January by mail or through your IRS account" },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: `"The IP PIN is the single most effective defense against tax identity theft. Even if someone has your SSN, they can't file a return without this number. Free. Five minutes."`,
      debrief: {
        "enabled-2fa": '"IP PIN obtained. Your tax return now requires a secret only you know. The $5.7 billion fraud industry just lost access to your refund."',
        'already-enabled': `"Already have one. You're in the minority of taxpayers who've taken this step."`,
        'later': '"Five minutes now saves 18 months of identity theft recovery later. Come back."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'irs-reclaim-verify',
    accountId: 'irs',
    phase: 'reclaim',
    title: 'Verify Tax Records: IRS',
    briefing: 'Log into your IRS account and verify that your filing address, direct deposit bank account, and tax transcript are correct. The classic tax fraud move is changing the refund bank account -- your return gets filed, your refund goes to their bank.',
    steps: [
      { text: `Log into your IRS account', url: 'https://www.irs.gov/payments/your-online-account` },
      { text: 'Check your address -- is it current?' },
      { text: 'Check your bank account for direct deposit -- is it YOUR bank?' },
      { text: `View your tax transcript -- any filings you didn't make?` },
      { text: 'Confirm your IP PIN is active for next tax season' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"The classic move: change the refund bank account. Your return gets filed, your refund goes to their bank, and you find out when the IRS rejects your real return. Check the deposit info."',
      debrief: {
        'tightened': '"Bank details verified, IP PIN confirmed. Your tax refund will go to your bank, not theirs."',
        'already-tight': `"Already reviewed. The Capitol's treasury is secure."`,
        "later": `"Check the direct deposit info at minimum. That's where the money goes."`,
      },
    },
    estimatedMinutes: 10,
  },

  // ── STATE DMV ─────────────────────────────────────────
  {
    id: 'state_dmv-recon-claim',
    accountId: 'state_dmv',
    phase: 'recon',
    title: 'Claim Your DMV Account',
    briefing: `Your driver's license number is in more databases than you think -- every landlord application, car rental, background check, and bar that scanned your ID made a copy. If your state has an online DMV portal, claim the account so no one can create one with your license number and change your address.`,
    steps: [
      { text: 'Search "[your state] DMV online account" in your browser' },
      { text: `Create an account if you don't have one` },
      { text: 'If you do: log in and verify your address and license status' },
      { text: `Check for duplicate license requests or address changes you didn't make` },
    ],
    debriefQs: ACCOUNT_CLAIMED_DEBRIEF,
    scoutDialog: {
      briefing: `"A duplicate license at someone else's address is a skeleton key for identity verification. Banks, police, and landlords all accept a driver's license as proof of identity."`,
      debrief: {
        'claimed': '"DMV account claimed. One fewer way for someone to get a copy of your license at their address."',
        'already-had': `"Already claimed. Verify the address -- that's the attack vector."`,
        "later": `"State DMV portals vary. Some don't exist. If yours does, claim it."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: 'state_dmv-fortify-password',
    accountId: 'state_dmv',
    phase: 'fortify',
    title: 'Secure Login: State DMV',
    briefing: 'State government IT is… variable. Some states have modern systems. Some run on code older than their interns. A strong, unique password compensates for a lot. If they offer 2FA, enable it -- you might be their only user who does.',
    steps: [
      { text: 'Log into your state DMV online account' },
      { text: 'Go to Account Settings → Security → Change Password' },
      { text: 'Generate a new unique password in your password manager' },
      { text: 'Check if 2FA is available -- enable it if so' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"State government IT budgets are not generous. Your strong password might be the most sophisticated security in their entire stack."',
      debrief: {
        'reset-password': `"DMV account secured. You've done what you can with what they give you."`,
        "already-strong": `"Already strong. Impressive, given how forgettable DMV passwords tend to be."`,
        "later": `"Your license number is an identity verification skeleton key. Worth securing."`,
      },
    },
    estimatedMinutes: 5,
  },

  // ── HEALTHCARE PORTAL ─────────────────────────────────
  {
    id: "healthcare_portal-recon-breach",
    accountId: "healthcare_portal",
    phase: "recon",
    title: "Breach Recon: Healthcare",
    briefing: `Healthcare records are worth 10x more than credit card numbers on the dark web. They contain your SSN, your insurance info, your prescriptions, and your medical history -- all in one record. The 2015 Anthem breach exposed 78.8 million records. Medical identity theft puts someone else's blood type in your chart.`,
    steps: [
      { text: `Open haveibeenpwned.com', url: 'https://haveibeenpwned.com` },
      { text: 'Enter the email you use for Healthcare.gov, your insurer, or patient portals like MyChart' },
      { text: 'Note breaches -- healthcare breaches often include SSN and insurance details' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Healthcare records are the most valuable stolen data on the dark web. SSN, insurance, prescriptions, medical history -- all in one record. And medical identity theft can literally affect your care."',
      debrief: scoutBreach(
        '"Clean. Your healthcare credentials are off the market."',
        '"Some exposure. Healthcare breaches are especially dangerous because the data is comprehensive."',
        `"Multiple breaches. New password, 2FA, and check your insurance statements for claims you didn't make."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'healthcare_portal-fortify-password',
    accountId: 'healthcare_portal',
    phase: 'fortify',
    title: 'Secure Login: Healthcare',
    briefing: 'Healthcare IT security budgets are notoriously thin. Your password is probably the strongest security layer between your medical records and the outside world. If the portal offers 2FA, consider it a minor miracle and enable it.',
    steps: [
      { text: `Log into your healthcare portal (Healthcare.gov, insurer, or MyChart)', url: 'https://www.healthcare.gov/login/` },
      { text: 'Go to Account Settings → Security → Change Password' },
      { text: 'Generate a new unique password in your password manager' },
      { text: 'Check for 2FA options and enable if available' },
      { text: 'Do the same for any separate patient portals (MyChart, etc.)' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: `Healthcare IT is underfunded. Your password is compensating for the entire industry's security budget. Make it count.`,
      debrief: {
        'reset-password': '"Healthcare portal secured. Your medical records have a real lock now."',
        'already-strong': `"Already strong. You're ahead of the healthcare IT curve."`,
        'later': '"Healthcare records are worth more than credit cards on the dark web. Worth fixing."',
      },
    },
    estimatedMinutes: 5,
  },

  // ── STUDENT LOANS ─────────────────────────────────────
  {
    id: 'student_loans-recon-claim',
    accountId: 'student_loans',
    phase: 'recon',
    title: 'Claim Your StudentAid Account',
    briefing: 'Your FSA ID can sign legal documents electronically -- including new federal loan applications. Nelnet, one of the largest servicers, had a breach in 2022 exposing 2.5 million borrowers" personal data. Claim your StudentAid.gov account and verify no one has filed for aid in your name.',
    steps: [
      { text: `Go to StudentAid.gov', url: 'https://studentaid.gov/fsa-id/sign-in/landing` },
      { text: "Create an account if you don't have one (it goes through Login.gov)" },
      { text: `If you have one: log in and go to "My Aid" to review your loan history` },
      { text: "Look for any loans you don't recognize -- they mean someone used your identity for federal aid" },
    ],
    debriefQs: ACCOUNT_CLAIMED_DEBRIEF,
    scoutDialog: {
      briefing: `"Your FSA ID signs legal documents. An attacker with your FSA ID could take out federal loans in your name. Claim the account, check 'My Aid' for ghost loans."`,
      debrief: {
        'claimed': '"StudentAid account claimed. No one can apply for federal aid as you without being noticed."',
        'already-had': `"Already claimed. Check 'My Aid' for loans you don't recognize -- that's the canary."`,
        'later': `"The FSA ID signs legal documents. Don't leave this unclaimed."`,
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "student_loans-fortify-password",
    accountId: "student_loans",
    phase: "fortify",
    title: "Secure Login: Student Loans",
    briefing: `StudentAid.gov goes through Login.gov -- if you already secured Login.gov for your SSA account, this might already be done. Check, and also secure your individual loan servicer's account separately.`,
    steps: [
      { text: 'If you secured Login.gov for the SSA mission, verify 2FA is still active there' },
      { text: `Log into your loan servicer's website separately` },
      { text: "Change that password too (different from Login.gov) using your password manager" },
      { text: "Check that your autopay bank account and contact info are correct" },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: `"If you secured Login.gov for SSA, StudentAid.gov is already protected -- they share the same identity provider. But your individual loan servicer has its own login. Secure that too."`,
      debrief: {
        "reset-password": `"Student loan accounts secured across both portals. The Capitol's education wing is locked."`,
        'already-strong': '"Already strong on both. The Login.gov chain is doing its job."',
        'later': '"Check if Login.gov 2FA carried over. If it did, you just need the servicer password."',
      },
    },
    estimatedMinutes: 5,
  },
];