import { ACCOUNTS } from './accounts.js';
import { VAULT_CAPITOL_MISSIONS } from './missions-vault-capitol.js';
import { MISSIONS_SQUARE_ARCHIVES_MARKETPLACE } from './missions-square-archives-marketplace.js';
import { PERIMETER_MISSIONS } from './missions-perimeter.js';
import { RECLAMATION_MISSIONS } from './missions-reclamation.js';

const BREACH_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-breaches', text: 'No breaches found', severity: 'safe' },
      { value: '1-2-breaches', text: 'Found in 1–2 breaches', severity: 'warn' },
      { value: '3plus-breaches', text: 'Found in 3+ breaches', severity: 'crit' },
      { value: 'skip', text: 'Couldn’t check right now', severity: 'skip' },
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
      { value: 'skip', text: 'Couldn’t check right now', severity: 'skip' },
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
      { value: 'later', text: 'I’ll come back to this', severity: 'skip' },
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

function scoutBreach(clean, mild, severe) {
  return {
    'no-breaches': clean,
    '1-2-breaches': mild,
    '3plus-breaches': severe,
    'skip': '"No rush. This mission will be here when you’re ready."',
  };
}

function scoutLogin(clean, suspicious, confirmed) {
  return {
    'no-breaches': clean,
    '1-2-breaches': suspicious,
    '3plus-breaches': confirmed,
    'skip': '"Take your time — we’ll circle back."',
  };
}

const CHAPTER_1_MISSIONS = [
  // ══════════════════════════════════════════════════════
  // GMAIL
  // ══════════════════════════════════════════════════════
  {
    id: 'gmail-recon-breach',
    accountId: 'gmail',
    phase: 'recon',
    title: 'Breach Recon: Gmail',
    briefing: 'Data brokers buy and sell leaked credentials by the million. If your Gmail password appeared in a breach, it’s already loaded into automated attack scripts hitting login pages around the clock. Gmail is the master key — password resets for most of your other accounts flow through it.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter your Gmail address' },
      { text: 'Read the results — note how many breaches (if any)' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Gmail is the master key. Most of your password resets flow through it — lose this and you lose access to everything downstream."',
      debrief: scoutBreach(
        '"Clean — that’s a solid start. Your email fortress is holding."',
        '"Found some exposure. Not unusual — the important thing is we caught it."',
        '"That’s a lot of exposure. Good thing we’re here. Let’s lock it down."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'gmail-recon-login',
    accountId: 'gmail',
    phase: 'recon',
    title: 'Login History: Gmail',
    briefing: 'Your Google account logs every sign-in: device, location, browser. An unrecognized login means someone else has been inside your account, reading your mail and resetting your other passwords.',
    steps: [
      { text: 'Open Google Security', url: 'https://myaccount.google.com/security' },
      { text: 'Scroll to "Your devices" and "Recent security activity"' },
      { text: 'Look for devices or locations you don’t recognize' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Every sign-in leaves a trace. If someone else has been in here, we need to know — and cut them off."',
      debrief: scoutLogin(
        '"All clear. No strangers in the house."',
        '"Something’s off. Time to change the locks — password reset and 2FA are next."',
        '"Confirmed intruder. We’re going to fortify this immediately."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'gmail-fortify-password',
    accountId: 'gmail',
    phase: 'fortify',
    title: 'Password Reset: Gmail',
    briefing: 'A unique, long password is the single best defense for any account. If your Gmail password is reused anywhere — or was exposed in a breach — changing it closes that door permanently.',
    steps: [
      { text: 'Open Google Account settings', url: 'https://myaccount.google.com/security' },
      { text: 'Click "Password" under "How you sign in to Google"' },
      { text: 'Set a new password that’s unique to this account (16+ characters, use a password manager)' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"The strongest wall in your city. Make this one count — long, unique, stored in a password manager."',
      debrief: {
        'reset-password': '"Fresh password locked in. One less door they can walk through."',
        'already-strong': '"Already unique and strong — you’re ahead of the game."',
        'later': '"Come back when you’re ready. This one matters."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'gmail-fortify-2fa',
    accountId: 'gmail',
    phase: 'fortify',
    title: '2FA Setup: Gmail',
    briefing: 'Two-factor authentication means a stolen password alone isn’t enough. Even if someone has your credentials, they can’t get in without the second factor on your device.',
    steps: [
      { text: 'Open Google 2-Step Verification', url: 'https://myaccount.google.com/signinoptions/two-step-verification' },
      { text: 'Enable 2-Step Verification if not already on' },
      { text: 'Prefer an authenticator app or security key over SMS' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"A password is a lock. 2FA is a deadbolt. Both together is how you keep people out."',
      debrief: {
        'enabled-2fa': '"Deadbolt installed. Even with the key, they’re not getting in."',
        'already-enabled': '"Already locked down with 2FA. That’s the way."',
        'later': '"This one’s worth coming back to. It’s the biggest single upgrade."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'gmail-reclaim-privacy',
    accountId: 'gmail',
    phase: 'reclaim',
    title: 'Privacy Review: Gmail',
    briefing: 'Google collects a staggering amount of data by default: search history, location timeline, ad profile, app permissions. Most of it can be dialed back without losing functionality.',
    steps: [
      { text: 'Open Google Privacy Checkup', url: 'https://myaccount.google.com/privacycheckup' },
      { text: 'Review each section: Web & App Activity, Location History, YouTube History' },
      { text: 'Pause or auto-delete what you don’t need' },
      { text: 'Review third-party app access and revoke anything unnecessary' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Google knows more about you than you think. This is where you decide how much of that you’re comfortable with."',
      debrief: {
        'tightened': '"Data footprint reduced. Less for brokers to harvest."',
        'already-tight': '"Already locked down — well done."',
        'later': '"Privacy settings are a maze. Take your time."',
      },
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // OUTLOOK
  // ══════════════════════════════════════════════════════
  {
    id: 'outlook-recon-breach',
    accountId: 'outlook',
    phase: 'recon',
    title: 'Breach Recon: Outlook',
    briefing: 'Outlook and Hotmail addresses have been targets of massive breaches over the years. A leaked Outlook password gives attackers access to your Microsoft ecosystem — OneDrive, Office, Teams, and everything linked through Microsoft SSO.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter your Outlook/Hotmail address' },
      { text: 'Note how many breaches your email appears in' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Outlook is a gateway to the whole Microsoft universe. If this one’s compromised, OneDrive, Teams, and Office go with it."',
      debrief: scoutBreach(
        '"No breaches. The Microsoft gate holds."',
        '"Some exposure found. Let’s make sure that password is fresh."',
        '"Multiple breaches. This password needs to change today."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'outlook-recon-login',
    accountId: 'outlook',
    phase: 'recon',
    title: 'Login History: Outlook',
    briefing: 'Microsoft tracks recent sign-ins with timestamps and locations. Unfamiliar entries mean someone else has had access to your email, files, and any service you sign into with Microsoft.',
    steps: [
      { text: 'Open Microsoft account security', url: 'https://account.live.com/Activity' },
      { text: 'Review "Recent activity"' },
      { text: 'Flag any sign-ins from unfamiliar devices or locations' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Microsoft logs everything. Let’s see if anyone uninvited has been browsing your inbox."',
      debrief: scoutLogin(
        '"All known devices. Nobody’s been snooping."',
        '"Suspicious activity spotted. Good catch — let’s shut that down."',
        '"Unauthorized access confirmed. Password change and 2FA are now urgent."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'outlook-fortify-password',
    accountId: 'outlook',
    phase: 'fortify',
    title: 'Password Reset: Outlook',
    briefing: 'Your Microsoft password protects not just email but OneDrive, Office 365, and any app using Microsoft SSO. A unique, strong password here closes the door to your entire Microsoft life.',
    steps: [
      { text: 'Open Microsoft security settings', url: 'https://account.live.com/proofs/manage' },
      { text: 'Click "Change password"' },
      { text: 'Set a new unique password (16+ characters, password manager recommended)' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"This password guards your entire Microsoft world. Make it unique, make it long."',
      debrief: {
        'reset-password': '"New password set. The Microsoft gate is reinforced."',
        'already-strong': '"Already solid. Moving on."',
        'later': '"Don’t leave this one too long — it’s a high-value target."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'outlook-fortify-2fa',
    accountId: 'outlook',
    phase: 'fortify',
    title: '2FA Setup: Outlook',
    briefing: 'Microsoft supports authenticator apps, security keys, and phone verification. An authenticator app is the best balance of security and convenience — SMS can be intercepted via SIM swapping.',
    steps: [
      { text: 'Open Microsoft security settings', url: 'https://account.live.com/proofs/manage' },
      { text: 'Set up "Two-step verification"' },
      { text: 'Add the Microsoft Authenticator app or another authenticator' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"Two factors beat one factor, every time. Authenticator app over SMS if you can."',
      debrief: {
        'enabled-2fa': '"Two-step is live. Your Microsoft account just got a lot harder to crack."',
        'already-enabled': '"Already protected. Nice."',
        'later': '"This one’s high priority. Come back soon."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'outlook-reclaim-privacy',
    accountId: 'outlook',
    phase: 'reclaim',
    title: 'Privacy Review: Outlook',
    briefing: 'Microsoft collects browsing history, search data, and ad preferences across its ecosystem. The privacy dashboard lets you see and delete what’s been collected, and limit future tracking.',
    steps: [
      { text: 'Open Microsoft Privacy Dashboard', url: 'https://account.microsoft.com/privacy' },
      { text: 'Review and clear browsing, search, and location data' },
      { text: 'Adjust ad personalization settings' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Microsoft’s been keeping tabs. Let’s see what they’ve got and decide what stays."',
      debrief: {
        'tightened': '"Privacy tightened. Less data flowing to the ad machine."',
        'already-tight': '"Already locked down. Someone’s been paying attention."',
        'later': '"It’s a big dashboard. Chip away at it when you can."',
      },
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // ICLOUD
  // ══════════════════════════════════════════════════════
  {
    id: 'icloud-recon-breach',
    accountId: 'icloud',
    phase: 'recon',
    title: 'Breach Recon: iCloud Mail',
    briefing: 'Your iCloud address is tied to your Apple ID, which controls your photos, documents, device backups, and the ability to remotely wipe your devices. A leaked iCloud password is one of the most dangerous exposures possible.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter your iCloud email address' },
      { text: 'Note how many breaches (if any) your email appears in' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"iCloud is one of the big three identity providers. If someone gets these credentials, they get your photos, documents, location history, and can remote-wipe your devices."',
      debrief: scoutBreach(
        '"Clean. Your Apple fortress stands."',
        '"Some exposure. With iCloud the stakes are high — let’s move to fortify."',
        '"Multiple breaches on an Apple ID is serious. Password change is non-negotiable."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'icloud-recon-login',
    accountId: 'icloud',
    phase: 'recon',
    title: 'Login History: iCloud',
    briefing: 'Apple shows which devices are signed into your Apple ID. An unfamiliar device means someone else has access to your iCloud data — photos, backups, Find My, and potentially your physical location.',
    steps: [
      { text: 'Open Apple ID settings', url: 'https://appleid.apple.com/account/manage' },
      { text: 'Scroll to "Devices" to see everything signed into your Apple ID' },
      { text: 'Look for devices you don’t recognize' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Apple shows every device signed into your account. If there’s a stranger on the list, they can see your photos and track your location."',
      debrief: scoutLogin(
        '"All your devices. Nobody’s riding along."',
        '"Something unexpected in there. Remove unknown devices and change your password."',
        '"Unknown device confirmed. Remove it now, then we’ll fortify."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'icloud-fortify-password',
    accountId: 'icloud',
    phase: 'fortify',
    title: 'Password Reset: iCloud',
    briefing: 'Your Apple ID password is the key to your entire Apple ecosystem. A unique, strong password here protects your iPhone backups, photos, payment methods, and every app using Sign in with Apple.',
    steps: [
      { text: 'Open Apple ID settings', url: 'https://appleid.apple.com/account/manage' },
      { text: 'Go to "Sign-In and Security" and change your password' },
      { text: 'Choose a unique password not used anywhere else' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"This is the big one. Your Apple ID password protects everything Apple — phone backups, photos, payment methods, Find My."',
      debrief: {
        'reset-password': '"Apple ID secured with a fresh password. Major win."',
        'already-strong': '"Already unique and strong. Your Apple life is well-guarded."',
        'later': '"High priority. This one protects a lot of sensitive data."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'icloud-fortify-2fa',
    accountId: 'icloud',
    phase: 'fortify',
    title: '2FA Setup: iCloud',
    briefing: 'Apple’s two-factor authentication sends a verification code to your trusted devices. Without it, anyone with your password can access your entire iCloud account from any device.',
    steps: [
      { text: 'Open Apple ID settings', url: 'https://appleid.apple.com/account/manage' },
      { text: 'Go to "Sign-In and Security"' },
      { text: 'Enable Two-Factor Authentication if not already on' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"Apple’s 2FA sends codes to your trusted devices. Without it, a password is all someone needs."',
      debrief: {
        'enabled-2fa': '"Two-factor is live on your Apple ID. Excellent."',
        'already-enabled': '"Already on — Apple makes this pretty seamless."',
        'later': '"Come back to this soon. Apple ID without 2FA is a risk."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'icloud-reclaim-privacy',
    accountId: 'icloud',
    phase: 'reclaim',
    title: 'Privacy Review: iCloud',
    briefing: 'Apple collects less than Google or Microsoft, but there’s still data to manage: app tracking, analytics sharing, and which apps have access to your contacts, photos, and location.',
    steps: [
      { text: 'On your iPhone: Settings > Privacy & Security' },
      { text: 'Review Location Services, Tracking, and app permissions' },
      { text: 'On the web: Open Apple Privacy', url: 'https://privacy.apple.com' },
      { text: 'Download or delete data Apple has collected' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Apple’s better than most on privacy, but there’s still data to review. App tracking permissions are the big one."',
      debrief: {
        'tightened': '"Privacy tightened. Fewer apps tracking you across the web."',
        'already-tight': '"Already locked down. Apple’s privacy tools are solid when you use them."',
        'later': '"The settings are scattered across device and web. Take your time."',
      },
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // YAHOO
  // ══════════════════════════════════════════════════════
  {
    id: 'yahoo-recon-breach',
    accountId: 'yahoo',
    phase: 'recon',
    title: 'Breach Recon: Yahoo Mail',
    briefing: 'Yahoo suffered two of the largest data breaches in history — 3 billion accounts in 2013 and 500 million in 2014. If you’ve ever had a Yahoo account, your data was almost certainly exposed.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter your Yahoo email address' },
      { text: 'Note the breaches — Yahoo’s own breaches are likely listed' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Yahoo had two of the biggest breaches ever. Three billion accounts. If you’ve ever used Yahoo, expect to find something."',
      debrief: scoutBreach(
        '"Somehow clean. You might be the luckiest Yahoo user alive."',
        '"Expected. Yahoo’s breaches were massive. Let’s make sure your current password is fresh."',
        '"Multiple breaches — that’s par for Yahoo unfortunately. Fortify time."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'yahoo-recon-login',
    accountId: 'yahoo',
    phase: 'recon',
    title: 'Login History: Yahoo',
    briefing: 'Yahoo tracks recent account activity. Given Yahoo’s breach history, checking for unauthorized access is especially important — old compromised credentials could still be in use.',
    steps: [
      { text: 'Open Yahoo Account Security', url: 'https://login.yahoo.com/account/security' },
      { text: 'Click "Recent activity" or "View login activity"' },
      { text: 'Check for unfamiliar locations or devices' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"With Yahoo’s breach history, checking who’s been in here is essential."',
      debrief: scoutLogin(
        '"No intruders. Maybe they’ve forgotten about this one."',
        '"Suspicious activity. Change that password before they come back."',
        '"Unauthorized access confirmed. Lock it down now."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'yahoo-fortify-password',
    accountId: 'yahoo',
    phase: 'fortify',
    title: 'Password Reset: Yahoo',
    briefing: 'If your Yahoo password predates their mega-breaches, it’s been circulating on the dark web for years. Even if you’ve changed it since, make sure it’s truly unique and not reused from another account.',
    steps: [
      { text: 'Open Yahoo Account Security', url: 'https://login.yahoo.com/account/security' },
      { text: 'Click "Change password"' },
      { text: 'Set a new unique password — do not reuse one from any other account' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"Given Yahoo’s history, if this password is old, it’s been on every dark-web dump list for years."',
      debrief: {
        'reset-password': '"Fresh password on Yahoo. No more coasting on leaked credentials."',
        'already-strong': '"Already updated. Good discipline."',
        'later': '"If this password is old, it’s urgent. Come back soon."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'yahoo-fortify-2fa',
    accountId: 'yahoo',
    phase: 'fortify',
    title: '2FA Setup: Yahoo',
    briefing: 'Yahoo supports two-step verification via phone and authenticator apps. Given their breach history, 2FA is especially important here — it’s the safety net for when passwords get leaked.',
    steps: [
      { text: 'Open Yahoo Account Security', url: 'https://login.yahoo.com/account/security' },
      { text: 'Enable "Two-step verification"' },
      { text: 'Set up with an authenticator app for best security' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"After those breaches, 2FA on Yahoo isn’t optional — it’s damage control."',
      debrief: {
        'enabled-2fa': '"2FA active on Yahoo. Even if credentials leak again, they can’t get in."',
        'already-enabled': '"Good. Already protected."',
        'later': '"Priority here. Yahoo’s track record makes this essential."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'yahoo-reclaim-privacy',
    accountId: 'yahoo',
    phase: 'reclaim',
    title: 'Privacy Review: Yahoo',
    briefing: 'Yahoo (now part of Yahoo Inc.) collects and shares data for advertising. Their privacy controls let you opt out of personalized ads and data sales, and manage what’s been collected.',
    steps: [
      { text: 'Open Yahoo Privacy Dashboard', url: 'https://legal.yahoo.com/us/en/yahoo/privacy/dashboard/index.html' },
      { text: 'Review "Manage your privacy choices"' },
      { text: 'Opt out of personalized advertising and data sharing where possible' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Yahoo monetizes your data pretty aggressively. Their privacy dashboard lets you claw some of it back."',
      debrief: {
        'tightened': '"Data sharing reduced. Less of you flowing to the ad network."',
        'already-tight': '"Already opted out. Impressive."',
        'later': '"It’s worth doing eventually. Yahoo shares a lot by default."',
      },
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // PROTONMAIL
  // ══════════════════════════════════════════════════════
  {
    id: 'protonmail-recon-breach',
    accountId: 'protonmail',
    phase: 'recon',
    title: 'Breach Recon: ProtonMail',
    briefing: 'ProtonMail itself has strong security, but your Proton email address may have been exposed through breaches of other services where you used it to sign up. The risk is credential stuffing — attackers trying your leaked password on Proton.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter your ProtonMail address' },
      { text: 'Note any third-party breaches where this address appeared' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Proton’s servers are solid, but your Proton address might be in breaches from other sites where you used it to register."',
      debrief: scoutBreach(
        '"Clean. The bunker holds."',
        '"Third-party exposure — not Proton’s fault, but your password could still be at risk."',
        '"Multiple exposures. If your Proton password is reused, change it now."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'protonmail-recon-login',
    accountId: 'protonmail',
    phase: 'recon',
    title: 'Login History: ProtonMail',
    briefing: 'Proton logs authentication events. Checking your security log reveals any successful or failed login attempts from unfamiliar locations.',
    steps: [
      { text: 'Open Proton Account Security', url: 'https://account.proton.me/u/0/mail/security' },
      { text: 'Review "Security logs" or "Session management"' },
      { text: 'Look for unfamiliar IPs or locations' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Proton keeps detailed security logs. Let’s make sure nobody’s cracked the vault."',
      debrief: scoutLogin(
        '"All recognized sessions. The vault is secure."',
        '"Unfamiliar session spotted. Revoke it and change your password."',
        '"Breach confirmed on a privacy-focused provider. Lock it down and enable 2FA."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'protonmail-fortify-password',
    accountId: 'protonmail',
    phase: 'fortify',
    title: 'Password Reset: ProtonMail',
    briefing: 'Proton uses zero-knowledge encryption — they can’t read your mail even if compelled. But that means a lost or compromised password is catastrophic. Make it strong and backed up.',
    steps: [
      { text: 'Open Proton Account Settings', url: 'https://account.proton.me/u/0/mail/security' },
      { text: 'Change your password' },
      { text: 'Set a strong, unique password and store it in a password manager' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"Proton encrypts with your password. Lose it and you lose your mail permanently. Strong AND backed up."',
      debrief: {
        'reset-password': '"New password on the bunker. Strong and backed up, right?"',
        'already-strong': '"Already solid. Proton users tend to be security-conscious."',
        'later': '"Don’t wait too long — Proton’s encryption makes this password irreplaceable."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'protonmail-fortify-2fa',
    accountId: 'protonmail',
    phase: 'fortify',
    title: '2FA Setup: ProtonMail',
    briefing: 'Proton supports TOTP authenticator apps and security keys for two-factor authentication. Given Proton’s role as a privacy-first provider, 2FA here completes the security picture.',
    steps: [
      { text: 'Open Proton Account Security', url: 'https://account.proton.me/u/0/mail/security' },
      { text: 'Enable "Two-factor authentication"' },
      { text: 'Set up with an authenticator app — save your recovery codes securely' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"If you chose Proton for privacy, 2FA completes the picture. Don’t leave the front door unlocked on the most secure house."',
      debrief: {
        'enabled-2fa': '"2FA on Proton. The bunker is fully fortified."',
        'already-enabled': '"Already enabled. Expected from a Proton user."',
        'later': '"The irony of an unprotected Proton account. Come back to this."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'protonmail-reclaim-privacy',
    accountId: 'protonmail',
    phase: 'reclaim',
    title: 'Privacy Review: ProtonMail',
    briefing: 'Proton is privacy-focused by design, but there are still settings worth reviewing: default email encryption, metadata protection, and whether your recovery email could be a leak vector.',
    steps: [
      { text: 'Open Proton Mail Settings', url: 'https://account.proton.me/u/0/mail/security' },
      { text: 'Review recovery methods — a recovery email on Gmail exposes your Proton use' },
      { text: 'Check that PGP encryption defaults are sensible for your threat model' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Proton’s already privacy-first, but check your recovery email — a Gmail recovery address links your identities."',
      debrief: {
        'tightened': '"Settings tuned. Proton is as private as it can be."',
        'already-tight': '"Already dialed in. Your privacy game is strong."',
        'later': '"Worth a look when you have time. Small details matter here."',
      },
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // APPLE ID
  // ══════════════════════════════════════════════════════
  {
    id: 'apple_id-recon-breach',
    accountId: 'apple_id',
    phase: 'recon',
    title: 'Breach Recon: Apple ID',
    briefing: 'Your Apple ID controls access to every Apple service — App Store purchases, iCloud, Find My, Apple Pay. While Apple itself hasn’t had a major breach, your Apple ID email may appear in breaches from other services.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter the email associated with your Apple ID' },
      { text: 'Check for any breaches — cross-service credential reuse is the risk' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Apple’s own security is strong, but if you used the same email elsewhere and it leaked, attackers try those credentials everywhere."',
      debrief: scoutBreach(
        '"No exposure. The spire stands tall."',
        '"Some third-party exposure. Make sure your Apple password is unique."',
        '"Significant exposure. If your Apple ID password matches anything leaked, change it now."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'apple_id-recon-login',
    accountId: 'apple_id',
    phase: 'recon',
    title: 'Login History: Apple ID',
    briefing: 'Apple shows all devices currently signed into your Apple ID. Every device on this list has access to your iCloud data, photos, and Find My location. An unknown device is a serious red flag.',
    steps: [
      { text: 'Open Apple ID management', url: 'https://appleid.apple.com/account/manage' },
      { text: 'Review the "Devices" section' },
      { text: 'Remove any devices you don’t recognize or no longer own' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Every device on this list can see your photos, track your location, and read your messages. Make sure they’re all yours."',
      debrief: scoutLogin(
        '"All accounted for. Your Apple ecosystem is clean."',
        '"Unknown device found. Remove it and consider changing your password."',
        '"Unauthorized device confirmed. Remove, change password, enable 2FA — in that order."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'apple_id-fortify-password',
    accountId: 'apple_id',
    phase: 'fortify',
    title: 'Password Reset: Apple ID',
    briefing: 'Your Apple ID password guards the App Store, Apple Pay, iCloud Keychain, Find My, and Sign in with Apple. If this password is compromised, an attacker can lock you out of your own devices.',
    steps: [
      { text: 'Open Apple ID management', url: 'https://appleid.apple.com/account/manage' },
      { text: 'Go to Sign-In and Security > Password' },
      { text: 'Set a new, unique password not used anywhere else' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"This one guards Apple Pay, your keychain, and the ability to brick your devices. Treat it accordingly."',
      debrief: {
        'reset-password': '"Apple ID password refreshed. That’s your most personal account secured."',
        'already-strong': '"Already strong and unique. Good."',
        'later': '"This is a high-value target. Don’t sit on it too long."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'apple_id-fortify-2fa',
    accountId: 'apple_id',
    phase: 'fortify',
    title: '2FA Setup: Apple ID',
    briefing: 'Apple’s two-factor authentication sends a verification code to your trusted devices when you sign in on a new device. It’s one of the most seamless 2FA implementations available.',
    steps: [
      { text: 'Open Apple ID management', url: 'https://appleid.apple.com/account/manage' },
      { text: 'Go to Sign-In and Security' },
      { text: 'Enable Two-Factor Authentication (or confirm it’s already on)' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"Apple’s 2FA is seamless — it sends a code to your existing devices. Easy to set up, hard for attackers to bypass."',
      debrief: {
        'enabled-2fa': '"2FA active. Your Apple world is locked down."',
        'already-enabled': '"Already on. Apple pushes this hard, and for good reason."',
        'later': '"Quick setup. Worth doing today."',
      },
    },
    estimatedMinutes: 3,
  },
  {
    id: 'apple_id-reclaim-privacy',
    accountId: 'apple_id',
    phase: 'reclaim',
    title: 'Privacy Review: Apple ID',
    briefing: 'Review which apps use Sign in with Apple and what data they have access to. Also review app permissions on your devices — camera, microphone, contacts, and location access.',
    steps: [
      { text: 'Open Apple ID management', url: 'https://appleid.apple.com/account/manage' },
      { text: 'Review "Sign in with Apple" — revoke access for apps you no longer use' },
      { text: 'On your device: Settings > Privacy & Security > review each category' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Check which apps you’ve granted Sign in with Apple. Old apps with access are dead weight — revoke what you don’t use."',
      debrief: {
        'tightened': '"App access cleaned up. Less exposure surface."',
        'already-tight': '"Already minimal. Well done."',
        'later': '"The Sign in with Apple list tends to grow quietly. Worth a periodic review."',
      },
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // GOOGLE ACCOUNT
  // ══════════════════════════════════════════════════════
  {
    id: 'google-recon-breach',
    accountId: 'google',
    phase: 'recon',
    title: 'Breach Recon: Google Account',
    briefing: 'Your Google Account is an identity provider — "Sign in with Google" connects it to dozens or hundreds of other services. A compromised Google password unlocks everything behind that SSO.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter your Google email address' },
      { text: 'Also check Google’s built-in Password Checkup', url: 'https://passwords.google.com/checkup' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Google is an identity provider — Sign in with Google links it to everything. A breach here cascades."',
      debrief: scoutBreach(
        '"No exposure on the Google account. The identity hub is intact."',
        '"Some exposure. With Google SSO linking so many services, lock this down."',
        '"Widespread exposure on your identity provider. This is priority one."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'google-recon-login',
    accountId: 'google',
    phase: 'recon',
    title: 'Login History: Google Account',
    briefing: 'Google provides detailed security events including sign-ins, password changes, and third-party app access. Reviewing this reveals whether anyone else has been using your account as their own identity provider.',
    steps: [
      { text: 'Open Google Security', url: 'https://myaccount.google.com/security' },
      { text: 'Review "Your devices" and "Recent security activity"' },
      { text: 'Check "Third-party apps with account access" for anything suspicious' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Google’s security dashboard is thorough. Check devices, recent activity, and third-party apps that have access."',
      debrief: scoutLogin(
        '"Everything checks out. No unwanted guests."',
        '"Something’s off. Revoke suspicious access and change your password."',
        '"Unauthorized access to your identity provider. Fortify immediately."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'google-fortify-password',
    accountId: 'google',
    phase: 'fortify',
    title: 'Password Reset: Google Account',
    briefing: 'Your Google Account password protects Gmail, Drive, Photos, YouTube, and every app using Sign in with Google. Making this password unique and strong is one of the highest-value security actions you can take.',
    steps: [
      { text: 'Open Google Account settings', url: 'https://myaccount.google.com/security' },
      { text: 'Under "How you sign in to Google," click "Password"' },
      { text: 'Set a new, unique password (use a password manager)' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"This password is the skeleton key to your digital life. Gmail, Drive, Photos, YouTube, and hundreds of SSO connections."',
      debrief: {
        'reset-password': '"New password on the identity hub. Everything downstream is safer now."',
        'already-strong': '"Already unique and strong. Good discipline on a critical account."',
        'later': '"This is the highest-value password change you can make. Come back soon."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'google-fortify-2fa',
    accountId: 'google',
    phase: 'fortify',
    title: '2FA Setup: Google Account',
    briefing: 'Google supports multiple 2FA methods: authenticator apps, security keys, phone prompts, and backup codes. For an identity provider account, the strongest option you’re comfortable with is the right choice.',
    steps: [
      { text: 'Open Google 2-Step Verification', url: 'https://myaccount.google.com/signinoptions/two-step-verification' },
      { text: 'Enable 2-Step Verification' },
      { text: 'Add a security key or authenticator app as your primary method' },
      { text: 'Save your backup codes in a secure location' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"Google offers the most 2FA options of anyone. Security key is best, authenticator app is great, phone prompt is fine. Pick what you’ll actually use."',
      debrief: {
        'enabled-2fa': '"2FA on the identity hub. This single action protects everything behind Google SSO."',
        'already-enabled': '"Already protected. Make sure you have backup codes saved somewhere safe."',
        'later': '"This is arguably the single most important 2FA setup. Prioritize it."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'google-reclaim-privacy',
    accountId: 'google',
    phase: 'reclaim',
    title: 'Privacy Review: Google Account',
    briefing: 'Google’s Privacy Checkup walks through what data is collected and shared. Web & App Activity, Location History, YouTube History, and ad personalization can all be tightened without losing core functionality.',
    steps: [
      { text: 'Open Google Privacy Checkup', url: 'https://myaccount.google.com/privacycheckup' },
      { text: 'Review Web & App Activity, Location History, YouTube History' },
      { text: 'Set auto-delete timelines or pause collection' },
      { text: 'Review and limit ad personalization' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Google’s Privacy Checkup is comprehensive. This is where you decide how much of your digital life Google gets to index."',
      debrief: {
        'tightened': '"Data collection dialed back. A significant reduction in your exposure surface."',
        'already-tight': '"Already locked down. You’re ahead of most."',
        'later': '"It’s a deep settings tree. Chip away at it when you can."',
      },
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // MICROSOFT
  // ══════════════════════════════════════════════════════
  {
    id: 'microsoft-recon-breach',
    accountId: 'microsoft',
    phase: 'recon',
    title: 'Breach Recon: Microsoft Account',
    briefing: 'Your Microsoft Account is both a consumer identity (Xbox, Outlook, OneDrive) and an enterprise gateway (Office 365, Teams, Azure). A breach here opens doors on both sides of your digital life.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter the email associated with your Microsoft account' },
      { text: 'Note any breaches, especially from LinkedIn (owned by Microsoft)' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Microsoft spans consumer and enterprise. Xbox, Outlook, OneDrive, Office, Teams — all behind one account."',
      debrief: scoutBreach(
        '"Clean. The corporate tower is unbreached."',
        '"Some exposure. Make sure this password isn’t shared with your work accounts."',
        '"Multiple breaches on a Microsoft account is a wide blast radius. Lock it down."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'microsoft-recon-login',
    accountId: 'microsoft',
    phase: 'recon',
    title: 'Login History: Microsoft Account',
    briefing: 'Microsoft’s recent activity page shows sign-ins with timestamps, locations, and device info. Unfamiliar activity here could mean someone has access to your Office documents, OneDrive files, and email.',
    steps: [
      { text: 'Open Microsoft account activity', url: 'https://account.live.com/Activity' },
      { text: 'Review recent sign-in activity' },
      { text: 'Check for unfamiliar devices, locations, or failed attempts' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Microsoft logs sign-ins in detail. Let’s see if the corporate tower has had any uninvited visitors."',
      debrief: scoutLogin(
        '"All clear. No unauthorized access."',
        '"Suspicious login found. Time to change credentials."',
        '"Confirmed unauthorized access. Password change and 2FA are immediate priorities."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'microsoft-fortify-password',
    accountId: 'microsoft',
    phase: 'fortify',
    title: 'Password Reset: Microsoft Account',
    briefing: 'Your Microsoft password protects Outlook, OneDrive, Office, Xbox, and any service using Microsoft SSO. Microsoft also supports passwordless sign-in via the Authenticator app if you want to go further.',
    steps: [
      { text: 'Open Microsoft security settings', url: 'https://account.live.com/proofs/manage' },
      { text: 'Change your password' },
      { text: 'Set a new, unique password (consider going passwordless with Microsoft Authenticator)' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"Microsoft offers passwordless sign-in via their Authenticator app. Worth considering if you want to eliminate password risk entirely."',
      debrief: {
        'reset-password': '"New password on the Microsoft account. The tower is reinforced."',
        'already-strong': '"Already strong and unique. Solid."',
        'later': '"Don’t leave this one open. It’s a wide-reaching account."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'microsoft-fortify-2fa',
    accountId: 'microsoft',
    phase: 'fortify',
    title: '2FA Setup: Microsoft Account',
    briefing: 'Microsoft supports authenticator apps, security keys, phone verification, and passwordless sign-in. Their Authenticator app includes a one-tap approval flow that’s fast and secure.',
    steps: [
      { text: 'Open Microsoft security settings', url: 'https://account.live.com/proofs/manage' },
      { text: 'Enable "Two-step verification"' },
      { text: 'Add Microsoft Authenticator or another authenticator app' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"Microsoft’s Authenticator has a nice one-tap approval. Set it up and you won’t even need to type codes."',
      debrief: {
        'enabled-2fa': '"2FA active on Microsoft. One-tap approval is slick, right?"',
        'already-enabled': '"Already set up. Good."',
        'later': '"Quick to set up, big security payoff. Come back to this."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'microsoft-reclaim-privacy',
    accountId: 'microsoft',
    phase: 'reclaim',
    title: 'Privacy Review: Microsoft Account',
    briefing: 'Microsoft collects browsing history (via Edge), search data (via Bing), Cortana interactions, and diagnostic data from Windows. Their privacy dashboard lets you view and clear this data.',
    steps: [
      { text: 'Open Microsoft Privacy Dashboard', url: 'https://account.microsoft.com/privacy' },
      { text: 'Review and clear browsing, search, location, and voice data' },
      { text: 'Adjust ad personalization and diagnostic data sharing' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"If you use Windows or Edge, Microsoft has been collecting. The privacy dashboard lets you see the pile and start clearing it."',
      debrief: {
        'tightened': '"Data collection reduced. Your Microsoft footprint just got smaller."',
        'already-tight': '"Already cleaned up. You know the drill."',
        'later': '"It’s a big dashboard. Worth spending ten minutes on eventually."',
      },
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // FACEBOOK LOGIN
  // ══════════════════════════════════════════════════════
  {
    id: 'facebook-recon-breach',
    accountId: 'facebook',
    phase: 'recon',
    title: 'Breach Recon: Facebook',
    briefing: 'Facebook has been involved in multiple data incidents, including a 2019 breach that exposed 533 million phone numbers. Your Facebook credentials may also be targeted because Facebook Login is used as SSO for many third-party apps.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter the email or phone number associated with your Facebook account' },
      { text: 'Note any breaches — the 2019 Facebook breach is a common hit' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Facebook’s 2019 breach hit 533 million accounts. If you’ve been on Facebook more than a few years, expect to find something."',
      debrief: scoutBreach(
        '"Clean. Lucky, given Facebook’s track record."',
        '"Found some exposure. Facebook’s breach history makes this unsurprising."',
        '"Multiple breaches. Facebook Login connects to a lot of apps — this is wider than it looks."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'facebook-recon-login',
    accountId: 'facebook',
    phase: 'recon',
    title: 'Login History: Facebook',
    briefing: 'Facebook tracks active sessions and login locations. An unrecognized session means someone else can post as you, message your contacts, and access any app using Facebook Login.',
    steps: [
      { text: 'Open Facebook Security Settings', url: 'https://www.facebook.com/settings?tab=security' },
      { text: 'Click "Where You’re Logged In"' },
      { text: 'Review all active sessions and end any you don’t recognize' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Facebook shows every active session. If someone’s in there, they can impersonate you to everyone who trusts you."',
      debrief: scoutLogin(
        '"All known sessions. Nobody’s wearing your face."',
        '"Suspicious session found. End it and change your password."',
        '"Unauthorized access to your social identity. End all sessions, change password, enable 2FA."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: 'facebook-fortify-password',
    accountId: 'facebook',
    phase: 'fortify',
    title: 'Password Reset: Facebook',
    briefing: 'Your Facebook password protects your social identity and every app using Facebook Login. Because Facebook is a common SSO provider, a compromised Facebook password can cascade to dozens of other services.',
    steps: [
      { text: 'Open Facebook Security Settings', url: 'https://www.facebook.com/settings?tab=security' },
      { text: 'Click "Change password"' },
      { text: 'Set a new, unique password' },
    ],
    debriefQs: PASSWORD_DEBRIEF,
    scoutDialog: {
      briefing: '"Facebook Login connects to a lot of apps. This password is wider than just social media."',
      debrief: {
        'reset-password': '"New password on Facebook. Every app using Facebook Login is safer now."',
        'already-strong': '"Already unique. Good — Facebook is a high-value target."',
        'later': '"If Facebook Login connects to other apps, this password matters more than you think."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'facebook-fortify-2fa',
    accountId: 'facebook',
    phase: 'fortify',
    title: '2FA Setup: Facebook',
    briefing: 'Facebook supports authenticator apps, security keys, and SMS for two-factor authentication. An authenticator app is recommended — SMS can be intercepted via SIM swapping, which is a known attack vector on social media accounts.',
    steps: [
      { text: 'Open Facebook Security Settings', url: 'https://www.facebook.com/settings?tab=security' },
      { text: 'Click "Use two-factor authentication"' },
      { text: 'Set up with an authenticator app (not SMS)' },
    ],
    debriefQs: TWO_FA_DEBRIEF,
    scoutDialog: {
      briefing: '"Social media accounts are SIM-swap targets. Use an authenticator app, not SMS."',
      debrief: {
        'enabled-2fa': '"2FA active on Facebook. Much harder to hijack now."',
        'already-enabled': '"Already set up. Smart."',
        'later': '"Social media accounts are common targets. Don’t wait too long."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'facebook-reclaim-privacy',
    accountId: 'facebook',
    phase: 'reclaim',
    title: 'Privacy Review: Facebook',
    briefing: 'Facebook collects and sells more data than almost any other platform. Their privacy settings are intentionally complex, but you can significantly reduce your exposure: limit ad tracking, restrict who sees your posts, and revoke app permissions.',
    steps: [
      { text: 'Open Facebook Privacy Settings', url: 'https://www.facebook.com/settings?tab=privacy' },
      { text: 'Set "Who can see your future posts" to Friends' },
      { text: 'Review "Apps and Websites" and remove apps you don’t use' },
      { text: 'Open Off-Facebook Activity', url: 'https://www.facebook.com/allyourbases/allactivity/?activity_history=true&category_key=YOURAPPSPOSTS' },
      { text: 'Clear history and turn off future Off-Facebook Activity' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Facebook’s privacy settings are deliberately confusing. Off-Facebook Activity is the big one — it tracks you across the entire web."',
      debrief: {
        'tightened': '"Off-Facebook Activity cleared. That’s a massive data pipeline you just shut off."',
        'already-tight': '"Already locked down. Impressive — most people never find those settings."',
        'later': '"The Off-Facebook Activity setting alone is worth coming back for."',
      },
    },
    estimatedMinutes: 15,
  },
];

// Merge all chapter missions into one array — exported as MISSIONS
// so every existing import picks up the full set
export const MISSIONS = [
  ...CHAPTER_1_MISSIONS,
  ...VAULT_CAPITOL_MISSIONS,
  ...MISSIONS_SQUARE_ARCHIVES_MARKETPLACE,
  ...PERIMETER_MISSIONS,
  ...RECLAMATION_MISSIONS,
];

export function getMissionsForDistrict(districtId) {
  return MISSIONS.filter((m) => ACCOUNTS[m.accountId]?.district === districtId);
}

export function getMissionsForAccount(accountId) {
  return MISSIONS.filter((m) => m.accountId === accountId);
}
