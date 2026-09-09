// Missions for The Square (Ch. 3), The Archives (Ch. 4), The Marketplace (Ch. 5)
// Breaks from rigid 5-per-account format -- missions are purposeful and distinct.
// Low-stakes accounts grouped by action. Messaging apps get unique missions.

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

const LOCKDOWN_DEBRIEF = [
  {
    id: 'action',
    label: 'What did you do?',
    options: [
      { value: 'reset-password', text: 'Changed password and enabled 2FA', severity: 'safe' },
      { value: 'already-strong', text: 'Password and 2FA were already solid', severity: 'safe' },
      { value: 'partial', text: 'Did the password, will do 2FA later', severity: 'warn' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
    ],
  },
];

const REGISTRATION_LOCK_DEBRIEF = [
  {
    id: "action",
    label: "Did you set a registration lock PIN?",
    options: [
      { value: "enabled-2fa", text: 'Yes, PIN is set', severity: 'safe' },
      { value: "already-enabled", text: 'It was already enabled', severity: 'safe' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
    ],
  },
];

const SECRETS_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-breaches', text: 'No exposed secrets', severity: 'safe' },
      { value: '1-2-breaches', text: 'Found secrets -- rotated them', severity: 'warn' },
      { value: '3plus-breaches', text: 'Found secrets -- still need to rotate', severity: 'crit' },
      { value: 'skip', text: `Couldn't check right now`, severity: 'skip' },
    ],
  },
];

const PASSWORD_HEALTH_DEBRIEF = [
  {
    id: "finding",
    label: "What did your password manager say?",
    options: [
      { value: "no-breaches", text: 'All unique -- no reuse', severity: 'safe' },
      { value: "1-2-breaches", text: 'Found reused passwords -- changed them', severity: 'warn' },
      { value: "3plus-breaches", text: 'Found reused passwords -- still need to change some', severity: 'crit' },
      { value: 'skip', text: `Couldn't check right now`, severity: 'skip' },
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

export const MISSIONS_SQUARE_ARCHIVES_MARKETPLACE = [

  // ══════════════════════════════════════════════════════
  // CHAPTER 3: THE SQUARE -- Social Media & Messaging
  // ══════════════════════════════════════════════════════

  // ── INSTAGRAM ── (4 missions)
  {
    id: 'instagram-recon-breach',
    accountId: 'instagram',
    phase: 'recon',
    title: 'Breach Recon: Instagram',
    briefing: 'Instagram has been hit by credential-stuffing attacks and third-party data scrapes that exposed millions of profiles. Your Instagram login is also your key to a social identity that people who know you actually trust -- a hijacked account sends DMs as you.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Type the email address linked to your Instagram into the search box and press Enter' },
      { text: 'Read the results -- look for "Instagram" or Instagram-adjacent services (like the 2019 Chtrbox scrape)' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Instagram is where people trust your identity. A hijacked account sends crypto scam DMs to everyone who follows you. As you."',
      debrief: scoutBreach(
        '"Clean. Your curated self-image remains uncompromised."',
        `"Some exposure -- your email appeared in a dump. Let's make sure nobody rode it into your account."`,
        `"Multiple breaches on the email behind your Instagram. If that password overlaps, someone's already tried it."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'instagram-recon-login',
    accountId: 'instagram',
    phase: 'recon',
    title: 'Active Sessions: Instagram',
    briefing: 'Instagram tracks active sessions with device type and approximate location. An unfamiliar session means someone can see your DMs, post as you, and message your contacts.',
    steps: [
      { text: 'Open the Instagram app on your phone' },
      { text: 'Tap your profile icon → tap the ☰ menu → Settings and privacy' },
      { text: `Tap "Accounts Center" → "Password and security" → "Where you're logged in"` },
      { text: `Review every device. Tap any you don't recognize and select "Log out"` },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: `"Instagram shows every device currently logged in. If there's a phone in Jakarta that you've never held, we have a problem."`,
      debrief: scoutLogin(
        `"All known devices. Nobody's wearing your face in your DMs."`,
        '"Suspicious session. Ended it? Good. Change your password next -- before they notice."',
        '"Unauthorized access to your social identity. End all sessions, new password, 2FA. In that order."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'instagram-fortify-lockdown',
    accountId: 'instagram',
    phase: 'fortify',
    title: 'Lockdown: Instagram',
    briefing: 'Instagram accounts are prime targets because they have direct social value -- an attacker can impersonate you or sell the username. A unique password plus 2FA via authenticator app (not SMS -- social accounts are SIM-swap magnets) is the standard.',
    steps: [
      { text: 'Open the Instagram app → ☰ → Settings and privacy → Accounts Center → Password and security' },
      { text: 'Tap "Change password" -- open your password manager, generate a random 20+ character password, save it, then paste it into both fields' },
      { text: 'Go back to "Password and security" → "Two-factor authentication" → select your Instagram account' },
      { text: 'Choose "Authentication app" (NOT "Text message"). Open your authenticator app, scan the QR code, and enter the 6-digit code' },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"Instagram usernames have resale value. A strong password plus an authenticator app is the difference between keeping your handle and finding it selling crypto."',
      debrief: {
        'reset-password': '"New password and 2FA active. Your carefully curated online persona is much harder to steal."',
        'already-strong': `"Already locked down. You're ahead of about 98% of Instagram users."`,
        'partial': '"Password done -- good start. Come back for 2FA soon. Social accounts are SIM-swap targets."',
        'later': `"Your social identity is a target. Don't sit on this."`,
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'instagram-reclaim-privacy',
    accountId: 'instagram',
    phase: 'reclaim',
    title: 'Privacy Review: Instagram',
    briefing: `Instagram defaults to sharing a lot: your activity status, who can message you, whether your account is public, and how much data feeds Meta's ad machine. Most of these are toggles that take thirty seconds each.`,
    steps: [
      { text: `Open Instagram → ☰ → Settings and privacy → "Account privacy" -- set to Private if you want only followers to see your posts` },
      { text: `Under "How others can interact with you" → turn off "Activity Status" (stops showing when you're online)` },
      { text: 'Go to "Messages and story replies" → set "Message controls" to restrict who can DM you' },
      { text: 'Go to Accounts Center → "Your information and permissions" → "Your activity off Meta technologies" → disconnect tracking' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `Instagram is owned by Meta, which means every like, search, and DM feeds the ad profile. You can't stop all of it, but you can close a few curtains.`,
      debrief: {
        'tightened': '"Privacy tightened. Instagram is still watching, but strangers see much less of you."',
        'already-tight': '"Already locked down. Impressive discipline for a platform designed to overshare."',
        'later': '"The defaults are deliberately permissive. Worth a pass when you have five minutes."',
      },
    },
    estimatedMinutes: 5,
  },

  // ── TWITTER / X ── (4 missions)
  {
    id: 'twitter-recon-breach',
    accountId: 'twitter',
    phase: 'recon',
    title: 'Breach Recon: Twitter / X',
    briefing: `Twitter has had multiple data incidents, including a 2023 leak of 200 million email addresses scraped via an API vulnerability they ignored for months. If you've ever had a Twitter account, your email was likely exposed.`,
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: "Enter the email linked to your Twitter / X account" },
      { text: "Look for the Twitter breach specifically -- it's one of the most common hits" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Twitter leaked 200 million email addresses through an API bug they sat on for months. If you ever had an account, your email is probably in a list somewhere."',
      debrief: scoutBreach(
        '"Clean -- either lucky or a very new account."',
        '"Some exposure. The 2023 scrape caught a lot of people."',
        `"Multiple breaches. Twitter's been a sieve. Make sure that password isn't reused anywhere."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'twitter-recon-apps',
    accountId: 'twitter',
    phase: 'recon',
    title: 'Connected Apps Audit: Twitter / X',
    briefing: `Over the years you've probably authorized dozens of Twitter apps -- scheduling tools, analytics, games, "What Hogwarts house are you" quizzes. Each one still has access to your account unless you revoke it.`,
    steps: [
      { text: 'Open Twitter Connected Apps', url: 'https://twitter.com/settings/connected_apps' },
      { text: 'Review every app in the list -- check what permissions each has (read, write, DMs)' },
      { text: `Click "Revoke access" on anything you don't actively use or recognize` },
      { text: `While you're there, check "Sessions" for any you don't recognize` },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Some of these connected apps are from 2014 and have write access to your account. That quiz about which sandwich you are still has permission to tweet as you."',
      debrief: scoutLogin(
        '"All clean -- no suspicious apps or sessions."',
        '"Found some old apps. Revoking dead integrations is always the right call."',
        `"Yikes -- unauthorized app with write access. Revoke it, change your password, and check for any posts you didn't make."`,
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: "twitter-fortify-lockdown",
    accountId: "twitter",
    phase: "fortify",
    title: "Lockdown: Twitter / X",
    briefing: "A hijacked Twitter account posts to a public audience under your name. Twitter removed free SMS 2FA in 2023 -- an authenticator app is free, more secure, and the only reasonable option now.",
    steps: [
      { text: 'Open Twitter Settings', url: 'https://twitter.com/settings/your_twitter_data/account' },
      { text: `Go to "Your Account" → "Change your password" -- open your password manager, generate a 20+ character random password, save it, paste into both fields` },
      { text: `Go to Settings → "Security and account access" → "Security" → "Two-factor authentication"` },
      { text: `Choose "Authentication app." Scan the QR code with your authenticator app. Enter the 6-digit code to confirm` },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"A compromised Twitter account is a megaphone pointed at your professional reputation. New password and authenticator app -- Twitter killed free SMS 2FA, so the app is the only real option."',
      debrief: {
        "reset-password": '"New password and 2FA active. Your public voice is re-secured."',
        "already-strong": '"Already locked down. Smart, given the breach history."',
        "partial": '"Password done. Without 2FA, a leaked password is still all it takes to post as you."',
        "later": '"This is a public-facing account. The blast radius of a compromise is visible to everyone."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "twitter-reclaim-privacy",
    accountId: "twitter",
    phase: "reclaim",
    title: "Privacy Review: Twitter / X",
    briefing: `Twitter lets people find you by email and phone number by default. That's how the 2023 scrape worked -- and it's still on unless you turned it off. The discoverability toggles are the most important settings here.`,
    steps: [
      { text: 'Open Twitter Privacy', url: 'https://twitter.com/settings/audience_and_tagging' },
      { text: `Under "Discoverability and contacts" → turn OFF "Let people who have your email address find you" and same for phone` },
      { text: `Go to Settings → "Privacy and safety" → "Ads preferences" → turn off "Personalized ads"` },
      { text: `Go to "Data sharing with business partners" and turn it off` },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"Twitter lets people find you by phone number and email by default. That's exactly how the 200-million-address scrape worked. Turn those off."`,
      debrief: {
        "tightened": '"Discoverability settings tightened. Harder for scrapers to tie your account to your real identity."',
        "already-tight": '"Already locked down. You clearly learned from the scrape."',
        "later": '"The discoverability toggles are the ones that matter most here."',
      },
    },
    estimatedMinutes: 5,
  },

  // ── TIKTOK ── (3 missions)
  {
    id: "tiktok-recon-devices",
    accountId: "tiktok",
    phase: "recon",
    title: "Device Check: TikTok",
    briefing: "TikTok collects more data than most platforms -- keystroke patterns, clipboard contents, device identifiers, face and voice data from your videos. An unauthorized device gets access to all of it, plus your DMs and drafts.",
    steps: [
      { text: 'Open TikTok Security Settings', url: 'https://www.tiktok.com/setting/security' },
      { text: `Tap "Manage devices" -- review every device listed` },
      { text: "Remove any device you don't recognize or no longer use" },
      { text: `While you're here, check haveibeenpwned.com for the email/phone linked to TikTok`, url: `https://haveibeenpwned.com` },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"TikTok knows your face, your voice, your typing patterns, and your attention span. The device list tells you who else has access to that profile."',
      debrief: scoutLogin(
        `"All your devices. The algorithm's portrait of you stays between you and TikTok. Which is already a lot of people, but at least it's not more."`,
        '"Unknown device spotted. Remove it. They had access to your video drafts and DMs."',
        `"Multiple unknown devices. Clean house and change your password. Someone's been inside the algorithm."`,
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: "tiktok-fortify-lockdown",
    accountId: "tiktok",
    phase: "fortify",
    title: "Lockdown: TikTok",
    briefing: "TikTok accounts are targets for both credential theft and content hijacking. An authenticator app is recommended over SMS -- social media accounts are prime SIM-swap targets.",
    steps: [
      { text: "Open TikTok → Profile → ☰ → Settings and privacy → Security" },
      { text: `Tap "Password" → open your password manager, generate a 20+ character random password, save it, paste into both fields` },
      { text: `Go back to Security → "2-Step Verification" → choose "Authenticator App"` },
      { text: "Open your authenticator app, scan the QR code, enter the 6-digit code to confirm" },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"TikTok has your face and your voice on video. Unique password plus authenticator app makes sure nobody else gets to use them."',
      debrief: {
        "reset-password": '"Locked down. Your video identity is much harder to steal now."',
        "already-strong": '"Already solid. Good instincts."',
        "partial": '"Password done. 2FA next -- TikTok accounts get hijacked for follower counts."',
        "later": '"TikTok has more of your biometric data than you think. Come back."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "tiktok-reclaim-privacy",
    accountId: "tiktok",
    phase: "reclaim",
    title: "Privacy Review: TikTok",
    briefing: `TikTok's default is everyone-can-see-everything. A private account and restricted interactions won't stop the algorithm from watching you, but they stop strangers from interacting with your content and data.`,
    steps: [
      { text: 'Open TikTok → Settings and privacy → Privacy' },
      { text: 'Toggle "Private account" ON if you want only followers to see your videos' },
      { text: 'Under "Interactions" → restrict who can comment, duet, stitch, and send you messages' },
      { text: 'Go to Settings → Privacy → "Ads personalization" → toggle OFF "Personalized ads"' },
      { text: 'Go to Settings → Privacy → "Download your data" to see what TikTok has collected on you' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"TikTok's defaults are deliberately open. Private account, restricted interactions, and disabled ad personalization -- that's the trifecta."`,
      debrief: {
        "tightened": `"Privacy settings adjusted. TikTok still collects data, but strangers interact less and advertisers know less."`,
        "already-tight": `"Already locked down. A rare sight on TikTok."`,
        "later": `"The privacy settings here are dense. Take it section by section."`,
      },
    },
    estimatedMinutes: 5,
  },

  // ── LINKEDIN ── (4 missions)
  {
    id: "linkedin-recon-breach",
    accountId: "linkedin",
    phase: "recon",
    title: "Breach Recon: LinkedIn",
    briefing: "LinkedIn was breached in 2012 -- 117 million passwords leaked, stored with unsalted SHA-1, which means they were cracked within hours. In 2021, 700 million profiles were scraped. Your professional identity is prime material for targeted phishing.",
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: "Enter the email linked to your LinkedIn" },
      { text: "The 2012 LinkedIn breach is extremely common in results -- expect to see it" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"LinkedIn leaked 117 million passwords in 2012 and stored them with unsalted SHA-1. If you've had an account since then, your password was cracked within hours of the dump going public."`,
      debrief: scoutBreach(
        '"Clean. You might be the only LinkedIn user who dodged the 2012 breach."',
        `"Found in a breach. If that password hasn't been changed since 2016, it's been traded for a decade."`,
        `"Multiple breaches including LinkedIn's own. Your professional identity has been circulating. Lock it down."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "linkedin-recon-login",
    accountId: "linkedin",
    phase: "recon",
    title: "Active Sessions: LinkedIn",
    briefing: "An unauthorized session on LinkedIn means someone can message your professional network as you, accept connections, scrape your contacts, and access your profile data. LinkedIn is the one platform where a hijack directly affects your career.",
    steps: [
      { text: 'Open LinkedIn Settings', url: 'https://www.linkedin.com/psettings/sign-in-and-security' },
      { text: `Click "Where you're signed in"` },
      { text: "Review every session -- end any you don't recognize" },
      { text: `Also check "Permitted services" for old app integrations and revoke unused ones` },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"LinkedIn is the platform where a hijack means someone can message your boss as you. Check the session list."',
      debrief: scoutLogin(
        '"All clear. Your professional network is intact."',
        '"Suspicious session. End it -- a compromised LinkedIn sends messages to your professional contacts."',
        '"Unauthorized access to your professional identity. Lock it down before someone sends connection requests as you."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "linkedin-fortify-lockdown",
    accountId: "linkedin",
    phase: "fortify",
    title: "Lockdown: LinkedIn",
    briefing: `Given LinkedIn's 2012 breach (unsalted SHA-1 hashes cracked in hours), any password from that era is long compromised. LinkedIn supports authenticator apps -- it's the primary defense against the spear-phishing that targets professional accounts.`,
    steps: [
      { text: 'Open LinkedIn Sign-in & Security', url: 'https://www.linkedin.com/psettings/sign-in-and-security' },
      { text: 'Click "Change password" -- open your password manager, generate a 20+ character random password, save it, paste into both fields' },
      { text: 'Go back and click "Two-step verification" → "Set up"' },
      { text: 'Choose "Authenticator app." Scan the QR code. Enter the code to confirm' },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: `"LinkedIn is the platform where people's guard is lowest because it 'feels professional." That's exactly why attackers love it. Unique password, authenticator app."`,
      debrief: {
        "reset-password": `"Locked down. Recruiters can still spam you, but at least they'll be real recruiters."`,
        'already-strong': '"Already solid. Professional paranoia is a virtue."',
        'partial': '"Password done. LinkedIn phishing is extremely effective -- 2FA blocks it."',
        'later': '"LinkedIn phishing is the most effective on the internet because people expect professional messages. Protect the account."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'linkedin-reclaim-privacy',
    accountId: 'linkedin',
    phase: 'reclaim',
    title: 'Privacy Review: LinkedIn',
    briefing: 'LinkedIn defaults your connections list to public and lets people find you by email and phone. These settings feed recruiter spam, data scrapers, and social engineering attacks. The privacy controls are buried but functional.',
    steps: [
      { text: 'Open LinkedIn Visibility Settings', url: 'https://www.linkedin.com/psettings/privacy' },
      { text: 'Under "Visibility" → "Who can see your connections" → set to "Only you"' },
      { text: 'Under "Visibility" → "Profile discovery using email" and "phone number" → set to "No one" or "1st-degree connections"' },
      { text: 'Under "Data privacy" → "Manage your data and activity" → limit ad-related data sharing' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"LinkedIn shows your connections to everyone by default. That's your entire professional network, visible to anyone with an account. Fix that first."`,
      debrief: {
        "tightened": `"Connections hidden, discoverability restricted. Your professional network is no longer a public directory."`,
        "already-tight": `"Already locked down. LinkedIn's privacy settings are deeply buried -- respect for finding them."`,
        'later': '"The connections list visibility is the most important toggle. Start there."',
      },
    },
    estimatedMinutes: 5,
  },

  // ── WHATSAPP ── (3 missions -- no separate 2FA, registration lock IS 2FA)
  {
    id: 'whatsapp-recon-devices',
    accountId: 'whatsapp',
    phase: 'recon',
    title: 'Linked Devices: WhatsApp',
    briefing: `WhatsApp Web and Desktop create linked sessions. If someone scanned your QR code when you weren't looking -- even for five seconds -- they've had a live mirror of every conversation since.`,
    steps: [
      { text: 'Open WhatsApp on your phone' },
      { text: 'Tap "Settings" (gear icon) → "Linked Devices"' },
      { text: 'Review every linked device listed -- each one can see all your messages in real time' },
      { text: `Tap any device you don't recognize → "Log Out"` },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: `"WhatsApp Web sessions are a live mirror of your conversations. If someone linked a device while you were getting coffee, they've been reading every message since."`,
      debrief: scoutLogin(
        `"All known devices. Nobody's eavesdropping through a linked session."`,
        `"Unknown linked device. Good catch -- they've been reading your messages in real time. Removed?"`,
        '"Multiple unknown devices. Someone has had a front-row seat to your conversations. Remove them all."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'whatsapp-fortify-reglock',
    accountId: 'whatsapp',
    phase: 'fortify',
    title: 'Registration Lock: WhatsApp',
    briefing: `WhatsApp doesn't use passwords -- it uses your phone number. Without a registration lock PIN, anyone who SIM-swaps your phone number can steal your WhatsApp account in seconds. The PIN blocks this.`,
    steps: [
      { text: 'Open WhatsApp → Settings → Account → Two-Step Verification' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
      { text: 'Add a recovery email address -- this lets you reset the PIN if you forget it' },
      { text: 'Done -- this PIN is now required any time someone tries to register your number on a new device' },
    ],
    debriefQs: REGISTRATION_LOCK_DEBRIEF,
    scoutDialog: {
      briefing: `"WhatsApp's "password" is a registration lock PIN. Without it, someone who steals your phone number steals your entire chat history. SIM-swap attacks make this real."`,
      debrief: {
        "enabled-2fa": `"Registration PIN set. Your WhatsApp is now SIM-swap resistant."`,
        "already-enabled": `"Already had a PIN. Good -- most people skip this."`,
        "later": `"This is how WhatsApp hijacking works: steal the number, register on a new phone. The PIN blocks that."`,
      },
    },
    estimatedMinutes: 3,
  },
  {
    id: "whatsapp-reclaim-privacy",
    accountId: "whatsapp",
    phase: "reclaim",
    title: "Privacy Settings: WhatsApp",
    briefing: `WhatsApp shares your last seen, profile photo, and about status with everyone by default. That's useful for social engineers and stalkers. Less useful for you.`,
    steps: [
      { text: 'Open WhatsApp → Settings → Privacy' },
      { text: 'Set "Last Seen" to "My Contacts" (or "Nobody")' },
      { text: 'Set "Profile Photo" to "My Contacts"' },
      { text: 'Set "About" to "My Contacts"' },
      { text: 'Optional: turn off "Read Receipts" if you want to read messages without the sender knowing' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `WhatsApp shares your last-seen and profile photo with everyone by default. That's valuable for anyone profiling you. Fix it in thirty seconds.`,
      debrief: {
        'tightened': '"Privacy tightened. Strangers see much less of your WhatsApp presence now."',
        'already-tight': '"Already restricted. You clearly value your boundaries."',
        'later': `"Small settings, but they matter if someone's watching."`,
      },
    },
    estimatedMinutes: 3,
  },

  // ── SIGNAL ── (2 missions -- no breach recon needed, Signal stores nothing)
  {
    id: 'signal-recon-devices',
    accountId: 'signal',
    phase: 'recon',
    title: 'Linked Devices: Signal',
    briefing: 'Signal stores almost nothing server-side -- no message history, no contacts, no metadata. But Signal Desktop and iPad create linked sessions that see all new messages in real time. An unknown linked device defeats the whole point of using Signal.',
    steps: [
      { text: 'Open Signal on your phone' },
      { text: 'Tap your profile icon → "Linked Devices"' },
      { text: `Review every linked device -- remove any you don't use or recognize` },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: `Signal's linked devices get everything new. If there's one you don't recognize, your private conversations aren't private. That defeats the whole reason you use Signal.`,
      debrief: scoutLogin(
        `"All recognized devices. Your secure messenger is actually secure."`,
        `"Unknown linked device. Removed? Good. Your conversations are private again."`,
        `"Multiple unknown devices on Signal. That's deeply concerning. Clean house and set a registration lock."`,
      ),
    },
    estimatedMinutes: 2,
  },
  {
    id: 'signal-fortify-reglock',
    accountId: 'signal',
    phase: 'fortify',
    title: 'Registration Lock: Signal',
    briefing: 'Signal uses a registration lock PIN to prevent someone from re-registering your number on a new device. Without it, a SIM-swap gives an attacker your Signal identity -- on the most secure messenger available.',
    steps: [
      { text: 'Open Signal → tap your profile icon → Settings → Account' },
      { text: 'Tap "Registration Lock" → toggle it ON' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
      { text: 'Signal will remind you of the PIN periodically to help you remember it' },
    ],
    debriefQs: REGISTRATION_LOCK_DEBRIEF,
    scoutDialog: {
      briefing: '"If you chose Signal for privacy, the registration lock completes the picture. Without it, the most secure messenger in the world falls to a phone call to your carrier."',
      debrief: {
        'enabled-2fa': '"Registration lock set. Signal is now resistant to phone number theft."',
        'already-enabled': '"Already enabled. Expected from a Signal user."',
        'later': '"One toggle. Thirty seconds. Come back."',
      },
    },
    estimatedMinutes: 2,
  },

  // ── DISCORD ── (4 missions -- token theft is unique and important)
  {
    id: 'discord-recon-breach',
    accountId: 'discord',
    phase: 'recon',
    title: 'Breach Recon: Discord',
    briefing: 'Discord accounts are high-value targets for social engineering. A hijacked account posts phishing links in servers where members trust each other -- "free Nitro" links that steal credentials from everyone in the community.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter the email linked to your Discord account' },
      { text: 'Also check for breaches from Discord bots and third-party services you authenticated via Discord' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: '"Discord is where communities trust each other. A hijacked account posts "free Nitro" links that steal credentials from everyone in the server. Your account is a weapon if compromised."',
      debrief: scoutBreach(
        '"Clean. Your server memberships are safe."',
        `"Some exposure. Make sure your Discord password isn't shared with whatever leaked."`,
        `"Multiple breaches. Change the Discord password before someone uses your account to phish your communities."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "discord-recon-tokens",
    accountId: "discord",
    phase: "recon",
    title: "Token & App Audit: Discord",
    briefing: "Discord token-stealing malware is an entire genre. A stolen token gives full account access without needing your password -- it bypasses 2FA entirely. The fix is checking active sessions and authorized apps, then changing your password (which invalidates all tokens).",
    steps: [
      { text: 'Open Discord Settings', url: 'https://discord.com/channels/@me' },
      { text: `Click the gear icon → "Devices" → review all active sessions and remove unknowns` },
      { text: `Go to "Authorized Apps" → review every app with access → click "Deauthorize" on anything you don't actively use` },
      { text: "If you found anything suspicious, change your password immediately -- this kills all stolen tokens" },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: '"Discord token stealers are a whole genre of malware. A stolen token bypasses 2FA. The only fix is changing your password, which invalidates every token in existence for your account."',
      debrief: scoutLogin(
        '"All clear. No stolen tokens detected."',
        '"Found a suspicious session or app. Revoking it and changing your password kills the token."',
        '"Unauthorized access. Password change immediately -- that invalidates every active token."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: "discord-fortify-lockdown",
    accountId: "discord",
    phase: "fortify",
    title: "Lockdown: Discord",
    briefing: "Changing your Discord password invalidates all active tokens -- it's both a password reset and a session wipe. 2FA adds a second layer, and backup codes are critical because losing your authenticator without codes means losing the account.",
    steps: [
      { text: `Open Discord Settings → "My Account"", url: "https://discord.com/channels/@me` },
      { text: `Click "Change Password" -- open your password manager, generate a 20+ character random password, save it, paste it in` },
      { text: `Scroll to "Two-Factor Authentication" → click "Enable" → scan the QR code with your authenticator app` },
      { text: `IMPORTANT: Click "Download Backup Codes" and save them in your password manager. Losing these + your authenticator = permanent lockout` },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"New password kills all existing tokens. 2FA blocks future token theft from being enough on its own. Backup codes prevent you from locking yourself out. All three, in that order."',
      debrief: {
        "reset-password": '"Password changed (tokens killed), 2FA active, backup codes saved. Your Discord is properly fortified."',
        "already-strong": '"Already locked down. Make sure those backup codes are still accessible."',
        "partial": '"Password changed -- good, tokens are killed. Come back for 2FA. Without it, a new token steal works again."',
        "later": `"Discord token theft is the most common way accounts get hijacked in gaming communities. Don't wait."`,
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "discord-reclaim-privacy",
    accountId: "discord",
    phase: "reclaim",
    title: "Privacy Review: Discord",
    briefing: `Discord's default allows anyone in a shared server to DM you -- that's how most Discord phishing starts. A DM from a "server admin" asking you to verify your account. The DM restriction is the most important privacy setting.`,
    steps: [
      { text: 'Open Discord Settings → "Privacy & Safety"' },
      { text: `Set 'Server Privacy Defaults" → disable "Allow direct messages from server members" for servers where you don't need it` },
      { text: `Under "How Discord Uses Your Data" → disable everything related to personalization and data usage` },
      { text: `Review "Authorized Apps" one more time -- some apps have permission to read your messages` },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `Discord's default allows server members to DM you freely. That's how phishing starts -- a DM from a 'server admin' asking you to verify. Restrict DMs on any server you're not actively chatting in.`,
      debrief: {
        'tightened': '"DM restrictions set, data sharing disabled. Less attack surface."',
        'already-tight': `"Already restricted. Smart -- Discord's DM phishing is relentless."`,
        'later': '"The server DM setting is the priority. Start there."',
      },
    },
    estimatedMinutes: 5,
  },

  // ── REDDIT ── (3 missions)
  {
    id: 'reddit-recon-breach',
    accountId: 'reddit',
    phase: 'recon',
    title: 'Breach Recon: Reddit',
    briefing: `Reddit was breached in 2018 -- usernames, emails, and hashed passwords from accounts created before 2007. Your Reddit comment history is often more revealing than your other social accounts. If someone ties your username to your real identity via a leaked email, that's years of unfiltered opinions.`,
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: "Enter the email linked to your Reddit account" },
      { text: "Old Reddit accounts with pre-2007 passwords are the most at risk" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"Reddit knows what you think about things you'd never discuss in person. If someone ties your username to your real identity via that email, they get years of unfiltered opinions."`,
      debrief: scoutBreach(
        '"Clean. Your pseudonymous self is safe."',
        `"Some exposure. Reddit accounts are pseudonymous, but the email behind them isn't."`,
        `"Multiple breaches. If someone connects your Reddit username to your real identity via that email… that's a lot of context."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "reddit-fortify-lockdown",
    accountId: "reddit",
    phase: "fortify",
    title: "Lockdown: Reddit",
    briefing: "Reddit supports 2FA via authenticator apps. Given the 2018 breach, if your password is old, it's been on dark-web dump lists for years. A unique password protects your pseudonymous identity.",
    steps: [
      { text: 'Open Reddit Settings', url: 'https://www.reddit.com/settings/' },
      { text: `Under "Account" → "Change password" -- open your password manager, generate a 20+ character random password, save it, paste in` },
      { text: `Scroll to "Two-factor authentication" → click "Enable" → scan the QR code with your authenticator app` },
      { text: "Save the backup codes that Reddit generates" },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: `"A unique password for Reddit protects the pseudonymous identity you've been building for years. That karma count isn't nothing.`,
      debrief: {
        'reset-password': '"Locked down. Your Reddit identity is re-secured."',
        'already-strong': '"Already solid. Good discipline on a pseudonymous account."',
        'partial': '"Password done. 2FA is quick on Reddit -- come back."',
        'later': '"If this password is from before 2018, it was in the breach. Come back."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'reddit-reclaim-privacy',
    accountId: 'reddit',
    phase: 'reclaim',
    title: 'Privacy Review: Reddit',
    briefing: `Reddit collects browsing data for ad targeting and defaults to showing your activity publicly. The bigger question: does your comment history across subreddits paint a picture you're comfortable with?`,
    steps: [
      { text: 'Open Reddit Safety & Privacy', url: 'https://www.reddit.com/settings/privacy' },
      { text: 'Under "Privacy" → disable "Personalization based on general location" and "Personalization based on activity"' },
      { text: `Review your profile visibility -- what's shown to strangers` },
      { text: 'Consider whether your post/comment history across subreddits reveals more than you intend' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"Reddit's privacy settings control ad targeting and visibility. But the real question is whether your comment history paints a picture you're comfortable with strangers seeing."`,
      debrief: {
        "tightened": '"Privacy settings adjusted. Your Reddit footprint is smaller."',
        "already-tight": '"Already minimal. Unusually privacy-conscious for a platform built on pseudonymity."',
        "later": '"The personalization toggles are quick. The comment history audit is a longer project."',
      },
    },
    estimatedMinutes: 5,
  },

  // ── TELEGRAM ── (2 missions -- two-step password is the critical one)
  {
    id: "telegram-recon-sessions",
    accountId: "telegram",
    phase: "recon",
    title: "Active Sessions: Telegram",
    briefing: "Telegram shows all active sessions with device, IP, and location. Unlike Signal, Telegram cloud chats are NOT end-to-end encrypted by default -- so an unauthorized session gets full access to your message history.",
    steps: [
      { text: "Open Telegram on your phone or desktop" },
      { text: `Go to Settings → Devices (or "Active Sessions")` },
      { text: "Review every session listed -- each one can read your entire cloud chat history" },
      { text: `Tap "Terminate" on any session you don't recognize` },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: `"Telegram cloud chats aren't end-to-end encrypted by default. An active session you don't recognize means someone has been reading your message history. All of it.`,
      debrief: scoutLogin(
        '"All known sessions. Your conversations are yours."',
        '"Unknown session terminated. They had access to your entire chat history."',
        '"Multiple unknown sessions. Terminate everything, set a two-step password, and consider which conversations were exposed."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: 'telegram-fortify-twostep',
    accountId: 'telegram',
    phase: 'fortify',
    title: 'Two-Step Password: Telegram',
    briefing: `Telegram relies on SMS codes by default. Anyone who can intercept your texts -- through SIM-swapping, SS7 attacks, or a compromised carrier employee -- can take over your account instantly. The two-step password blocks this. It's Telegram's single most important security setting.`,
    steps: [
      { text: 'Open Telegram → Settings → Privacy and Security → Two-Step Verification' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
      { text: `Add a recovery email address -- use one you've already secured` },
      { text: 'Check the confirmation email Telegram sends to verify the recovery address' },
    ],
    debriefQs: REGISTRATION_LOCK_DEBRIEF,
    scoutDialog: {
      briefing: `"Telegram's two-step password is the single most important setting. Without it, anyone who intercepts one SMS code owns your entire account. SIM-swap attacks make this real, not theoretical."`,
      debrief: {
        "enabled-2fa": `"Two-step password set. Telegram is now resistant to SMS interception and SIM-swap attacks."`,
        "already-enabled": `"Already set. The right call for a phone-number-based messenger."`,
        "later": `"If you use Telegram for anything private, this is critical. SMS can be intercepted."`,
      },
    },
    estimatedMinutes: 3,
  },

  // ── SLACK ── (2 missions -- workplace-dependent, SSO changes the picture)
  {
    id: "slack-fortify-lockdown",
    accountId: "slack",
    phase: "fortify",
    title: "Lockdown: Slack",
    briefing: `Slack is where your team shares credentials, API keys, and things they'd never put in email. If your workspace uses SSO (Google, Okta, etc.), the identity provider is what you need to secure. If it uses direct password login, secure that.`,
    steps: [
      { text: 'Check if your workspace uses SSO or direct password login (look at how you sign in)' },
      { text: 'If SSO: ensure the identity provider (Google, Okta) has a unique password and 2FA (you may have done this in The Master Keys)' },
      { text: 'If direct password: go to your-workspace.slack.com/account/settings and change your password -- generate a random 20+ character password in your password manager' },
      { text: 'Enable 2FA: go to your-workspace.slack.com/account/settings → "Two-Factor Authentication" → set up with authenticator app' },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"Slack holds internal communications, shared credentials, and things people say when they think only the team is listening. The lock depends on whether you use SSO or a direct password."',
      debrief: {
        'reset-password': `"Workspace access secured. Whether SSO or direct, you're locked down."`,
        'already-strong': '"Already solid. Good -- Slack credentials are career-grade secrets."',
        'partial': '"Identity provider secured. If Slack has its own password too, come back for that."',
        'later': '"Slack holds too much internal information to leave unsecured."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'slack-reclaim-apps',
    accountId: 'slack',
    phase: 'reclaim',
    title: 'Connected Apps: Slack',
    briefing: `Every Slack integration you've authorized has some level of access to your workspace messages. Old bots, test apps, and one-off integrations accumulate quietly. Each one is a potential data leak.`,
    steps: [
      { text: `Open your Slack workspace in a browser → click your workspace name → "Settings & administration" → "Manage apps"` },
      { text: "Or go to your-workspace.slack.com/apps/manage" },
      { text: `Review every app and integration -- remove anything you don't actively use` },
      { text: 'Pay special attention to apps with "Read messages" permissions' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Every Slack integration you authorized can read messages in the channels you added it to. Some of those integrations are from projects that ended two years ago."',
      debrief: {
        'tightened': '"Old integrations cleaned up. Fewer eyes on your workplace conversations."',
        'already-tight': '"Already minimal. Good -- Slack integrations accumulate like browser tabs."',
        'later': `"The apps with 'read messages' permission are the ones to audit first."`,
      },
    },
    estimatedMinutes: 5,
  },


  // ══════════════════════════════════════════════════════
  // CHAPTER 4: THE ARCHIVES -- Cloud Storage & Work
  // ══════════════════════════════════════════════════════

  // ── GOOGLE DRIVE ── (2 missions -- Google Account secured in Master Keys)
  {
    id: 'gdrive-recon-shares',
    accountId: 'gdrive',
    phase: 'recon',
    title: 'Shared Links Audit: Google Drive',
    briefing: `Every "Anyone with the link" share in Google Drive is a public URL to your file. Over years of collaboration, you've probably shared tax returns, contracts, or ID scans with links that are still active. If that link ends up in a search index or a Slack channel that gets scraped, the file is effectively public.`,
    steps: [
      { text: 'Open Google Drive', url: 'https://drive.google.com' },
      { text: `In the search bar, type "type:document" or "type:spreadsheet" and click the sharing icon to filter shared files` },
      { text: `Look for files shared as "Anyone with the link" -- right-click → "Share" → change to "Restricted" for sensitive ones` },
      { text: `Check "Shared with me" for files others shared that you may have reshared` },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: `"Every 'Anyone with the link" share is a public URL. If that link leaked -- in a Slack channel, an email, a forum post -- your document is effectively a public web page."`,
      debrief: scoutLogin(
        '"No sensitive documents with open links. Clean file system."`',
        '"Found some open shares. Restricting access on the sensitive ones is the right call."`',
        '"Multiple sensitive docs with public links. Those are effectively public web pages. Lock them down."`',
      ),
    },
    estimatedMinutes: 8,
  },
  {
    id: "gdrive-reclaim-apps",
    accountId: "gdrive",
    phase: "reclaim",
    title: "Third-Party App Permissions: Google Drive",
    briefing: "Over the years, you've granted Google Drive access to apps -- document editors, backup tools, that one PDF converter. Each one can read your files. Some of those apps no longer exist but still have permission.",
    steps: [
      { text: 'Open Google Account Permissions', url: 'https://myaccount.google.com/permissions' },
      { text: `Look for any app that says "Has access to Google Drive"` },
      { text: `Click each one → "Remove Access" on anything you don't actively use` },
      { text: `Also review "Shared drives" in Google Drive for old team access you should leave` },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Third-party apps with Drive access can read your files. Some of those permissions are from apps you tried once in 2018 and never used again. They still have access."',
      debrief: {
        "tightened": '"App permissions cleaned up. Fewer eyes on your documents."',
        "already-tight": '"Already minimal. Disciplined permission hygiene is rare."',
        "later": '"The third-party app list is the quick win. Start there."',
      },
    },
    estimatedMinutes: 8,
  },

  // ── DROPBOX ── (3 missions -- 2012 breach makes recon important)
  {
    id: "dropbox-recon-breach",
    accountId: "dropbox",
    phase: "recon",
    title: "Breach Recon: Dropbox",
    briefing: "Dropbox was breached in 2012 -- 68 million email/password pairs leaked. They didn't disclose it until 2016. If you had a Dropbox account during that period, your password was in the wild for four years before anyone told you.",
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: "Enter the email linked to your Dropbox" },
      { text: "The 2012 Dropbox breach is a very common hit -- 68 million records" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"Dropbox leaked 68 million credentials in 2012 and didn't tell anyone for four years. If you had an account back then, your password was trading hands while you were happily syncing files."`,
      debrief: scoutBreach(
        '"Clean. Either a new account or genuinely lucky."',
        `"Found in a breach. If that password hasn't changed since 2016, it's been traded for a decade."`,
        `"Multiple breaches including Dropbox's own. That email and password pair has been very well circulated."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "dropbox-fortify-devices",
    accountId: "dropbox",
    phase: "fortify",
    title: "Lockdown & Device Audit: Dropbox",
    briefing: "Dropbox syncs files across linked devices. An unauthorized device silently downloads everything. Changing your password, enabling 2FA, and unlinking unknown devices closes every door at once.",
    steps: [
      { text: 'Open Dropbox Security', url: 'https://www.dropbox.com/account/security' },
      { text: `Under "Devices" → review every linked device → click the X to unlink any you don't use or recognize` },
      { text: `Under "Web sessions" → end any unfamiliar sessions` },
      { text: `Click "Change password" -- open your password manager, generate a random 20+ character password, save it, paste in` },
      { text: `Enable "Two-step verification" → choose "Use a mobile app" → scan the QR code with your authenticator` },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"Dropbox syncs to every linked device. An unknown device in this list already has copies of your files. Unlink first, then change the password to invalidate everything."',
      debrief: {
        "reset-password": '"Devices audited, password changed, 2FA enabled. Your file archive is properly secured."',
        "already-strong": `"Already locked down. Good -- Dropbox's breach history makes this important."`,
        "partial": `"Password changed. Come back for 2FA -- it's the safety net for when passwords leak again."`,
        "later": `"Dropbox had a major breach. If this password is old, it's compromised."`,
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "dropbox-reclaim-shares",
    accountId: "dropbox",
    phase: "reclaim",
    title: "Shared Folders Cleanup: Dropbox",
    briefing: `Shared Dropbox folders from old projects are still syncing to other people's computers. If you've since added sensitive files to those folders, those collaborators still have access. Old shares accumulate silently.`,
    steps: [
      { text: 'Open Dropbox Sharing', url: 'https://www.dropbox.com/share' },
      { text: 'Review every shared folder -- click each one to see who has access' },
      { text: 'Remove old collaborators from folders they no longer need' },
      { text: 'Check "Shared links" tab → revoke links to any sensitive files' },
      { text: `Review 'Connected apps" and remove any you don't use` },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"Shared Dropbox folders from old projects are still syncing to other people's computers. If you added a tax return to a folder you once shared with a contractor, they have it."`,
      debrief: {
        'tightened': '"Old shares cleaned up. Fewer people have access to your files."',
        'already-tight': '"Already minimal. Clean file system discipline."',
        'later': '"Old shared folders are the priority. They accumulate without notification."',
      },
    },
    estimatedMinutes: 8,
  },

  // ── GITHUB ── (3 missions -- secrets scanning is the unique one)
  {
    id: 'github-recon-security',
    accountId: 'github',
    phase: 'recon',
    title: 'Security Log: GitHub',
    briefing: 'GitHub provides a detailed security log showing authentication events, SSH key usage, and personal access token activity. An unfamiliar event means someone may have cloned your private repos -- silently downloading your code and any secrets in the commit history.',
    steps: [
      { text: 'Open GitHub Security Settings', url: 'https://github.com/settings/security' },
      { text: 'Click "Security log" in the sidebar → review recent events' },
      { text: 'Look for unfamiliar IP addresses, SSH key usage, or API token activity' },
      { text: 'Under "Sessions" → review active sessions and sign out of any unknowns' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: `"GitHub's security log shows every auth event. An unfamiliar SSH key usage or API call means someone may have cloned your private repos -- that's silent data exfiltration."`,
      debrief: scoutLogin(
        '"All recognized activity. Your repos are untouched."`',
        '"Unfamiliar activity. Revoke the token or key and rotate your credentials."`',
        '"Unauthorized access to GitHub. Assume private repos were cloned. Rotate ALL keys and tokens."`',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: "github-fortify-lockdown",
    accountId: "github",
    phase: "fortify",
    title: "Lockdown: GitHub",
    briefing: "Your GitHub password protects your code, your professional reputation, and any secrets accidentally committed. GitHub now requires 2FA for public repo contributors. Old personal access tokens with broad permissions are a common backdoor -- rotate them.",
    steps: [
      { text: `Open GitHub Settings → "Password and authentication"", url: "https://github.com/settings/security` },
      { text: "Change your password -- open your password manager, generate 20+ characters, save, paste" },
      { text: `Under "Two-factor authentication" → enable with authenticator app if not already on` },
      { text: `Go to Settings → "Developer settings" → "Personal access tokens" → revoke any old tokens with broad scopes` },
      { text: "Create new fine-grained tokens with minimal permissions for anything that still needs API access" },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: `"Your GitHub password guards your professional work product. Old personal access tokens with 'repo" scope are the thing to find -- they give full read/write to private repos and never expire."`,
      debrief: {
        "reset-password": '"Password changed, 2FA enabled, old tokens revoked. Your code is properly secured."',
        "already-strong": '"Already locked down with fresh tokens. Professional-grade security."',
        "partial": '"Password done. The old personal access tokens are the next priority -- some are years old with full repo scope."',
        "later": `"Your career and your code live here. Don't leave this open."`,
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "github-reclaim-secrets",
    accountId: "github",
    phase: "reclaim",
    title: "Secrets Scan: GitHub",
    briefing: `The most dangerous thing in a GitHub repo isn't the code -- it's the secrets accidentally committed: API keys, database passwords, cloud credentials, tokens. They live in your commit history even if you deleted the file. GitHub has built-in secret scanning that catches common patterns.`,
    steps: [
      { text: 'Open your GitHub repos list', url: 'https://github.com' },
      { text: `For each repo: go to "Security" tab → "Secret scanning alerts" → review any flagged secrets` },
      { text: "For any exposed secret: rotate it immediately at the source (AWS console, Stripe dashboard, etc.)" },
      { text: `Enable "Push protection" in repo settings → Code security → to block future secrets from being pushed` },
    ],
    debriefQs: SECRETS_DEBRIEF,
    scoutDialog: {
      briefing: `"The most dangerous thing in a repo isn't the code -- it's the API key someone committed in 2021 and then deleted the file. The commit history still has it. GitHub's secret scanning catches the common patterns."`,
      debrief: {
        "no-breaches": '"No exposed secrets detected. Clean repos."',
        "1-2-breaches": '"Found and rotated secrets. Good catch -- those were live credentials in your commit history."',
        "3plus-breaches": `"Multiple exposed secrets. The ones you haven't rotated yet are still live. Prioritize cloud credentials and API keys."`,
        "skip": '"Worth doing when you have time. Old commits hide old secrets."',
      },
    },
    estimatedMinutes: 10,
  },


  // ══════════════════════════════════════════════════════
  // CHAPTER 5: THE MARKETPLACE -- Shopping & Streaming
  // ══════════════════════════════════════════════════════

  // ── AMAZON ── (3 missions)
  {
    id: "amazon-recon-breach",
    accountId: "amazon",
    phase: "recon",
    title: "Breach Recon: Amazon",
    briefing: "Amazon hasn't had a major credential breach, but your Amazon email likely appears in breaches from other services. Since Amazon stores your credit cards and home address, a reused password means someone can place orders on your card to their address.",
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: "Enter the email linked to your Amazon account" },
      { text: "If the email is in any breach, and you reused that password for Amazon -- your stored payment methods are at risk" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"Amazon has your credit card, your home address, and a complete history of everything you've bought. Lower stakes than a bank, higher stakes than people realize."`,
      debrief: scoutBreach(
        '"Clean. Your shopping account is behind an unexposed email."',
        '"Email appeared in a breach. If that password overlaps with Amazon, someone could be ordering right now."',
        '"Multiple breaches. Your Amazon email is well-circulated in breach databases. Unique password, immediately."',
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "amazon-fortify-lockdown",
    accountId: "amazon",
    phase: "fortify",
    title: "Lockdown: Amazon",
    briefing: "Amazon stores payment methods and your home address. 2FA here prevents unauthorized purchases even if your password leaks from another service. One reused password + one breach = someone else's packages on your card.",
    steps: [
      { text: 'Open Amazon Login & Security', url: 'https://www.amazon.com/gp/css/account/info/ref=ya_manage_login_and_security' },
      { text: `Click "Edit" next to Password → open your password manager, generate a random 20+ character password, save it, paste in` },
      { text: `Click "Edit" next to "Two-Step Verification (2SV)" → click "Get Started"` },
      { text: `Choose "Authenticator app" → scan the QR code → enter the 6-digit code to confirm` },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"Amazon 2FA. Because nobody should be able to buy a 65-inch TV on your card just because they found your password in a dump."',
      debrief: {
        "reset-password": '"New password and 2FA active. Shopping requires your phone now."',
        "already-strong": '"Already locked down. Smart for an account with saved payment methods."',
        "partial": '"Password done. 2FA is the safety net for stored payment methods."',
        "later": '"Stored credit cards and your home address. Worth protecting."',
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "amazon-reclaim-privacy",
    accountId: "amazon",
    phase: "reclaim",
    title: "Privacy Review: Amazon",
    briefing: "Amazon uses your browsing and purchase history for ad targeting across the entire web. They also have Alexa recordings if you use Echo devices. Your Amazon privacy settings control more than you'd expect.",
    steps: [
      { text: 'Open Amazon Advertising Preferences', url: 'https://www.amazon.com/adprefs' },
      { text: `Turn off "Interest-Based Ads from Amazon"` },
      { text: `Go to Amazon → Account → "Manage Your Data" → review what Amazon has collected` },
      { text: `If you use Alexa: go to Amazon → Account → "Manage Your Content and Devices" → review voice recordings` },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: '"Amazon knows what you buy, what you browse, what you almost bought, and what you keep looking at. That profile feeds ads across the entire web. Also, if you have an Echo, they have your voice recordings."',
      debrief: {
        "tightened": '"Ad targeting limited and data reviewed. Amazon knows less about your shopping intentions now."',
        "already-tight": '"Already limited. You resist the recommendation engine."',
        "later": '"The ad settings are quick. The Alexa recordings are a longer project."',
      },
    },
    estimatedMinutes: 5,
  },

  // ── STREAMING PASSWORD AUDIT ── (1 combined mission for low-stakes accounts)
  {
    id: "streaming-fortify-passwords",
    accountId: "netflix",
    phase: "fortify",
    title: "Streaming Password Audit",
    briefing: `Netflix, Spotify, and other streaming accounts are individually low-stakes, but they're the canary in the coal mine. If your Netflix password matches your bank password, the Netflix breach is really a bank breach. Your password manager's health report shows you in thirty seconds.`,
    steps: [
      { text: `Open your password manager's password health or audit feature (1Password: Watchtower, Bitwarden: Reports, LastPass: Security Dashboard)` },
      { text: 'Filter for streaming and entertainment accounts: Netflix, Spotify, Disney+, Hulu, YouTube, HBO Max, Apple TV+' },
      { text: `For any that show 'reused" or "weak": click the account, open the service's settings, and generate a new unique password` },
      { text: `The goal isn't to protect Netflix -- it's to make sure Netflix's password doesn't unlock something that matters` },
    ],
    debriefQs: PASSWORD_HEALTH_DEBRIEF,
    scoutDialog: {
      briefing: `"Streaming accounts sell for two dollars on the dark web. The real risk isn't losing Netflix -- it's that the password you used for Netflix is the same one you used for your email. Your password manager tells you in thirty seconds."`,
      debrief: {
        'no-breaches': '"All unique. No reuse vectors from your streaming accounts."',
        '1-2-breaches': '"Found reused passwords and changed them. You just closed a cascade path."',
        '3plus-breaches': `"Multiple reused passwords found. The ones you've changed are fixed -- come back for the rest."`,
        'skip': '"Worth doing when you have your password manager open."',
      },
    },
    estimatedMinutes: 10,
  },

  // ── EBAY ── (2 missions -- 2014 breach is the headline)
  {
    id: 'ebay-recon-breach',
    accountId: 'ebay',
    phase: 'recon',
    title: 'Breach Recon: eBay',
    briefing: 'eBay was breached in 2014 -- 145 million records including encrypted passwords, names, addresses, phone numbers, and dates of birth. If you had an eBay account before 2015, your personal data was in that dump.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter the email linked to your eBay account' },
      { text: 'The 2014 eBay breach exposed names, addresses, phone numbers, and dates of birth -- not just passwords' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `eBay lost 145 million records in 2014. Encrypted passwords, yes, but also names, physical addresses, phone numbers, and dates of birth. That's identity theft material, not just a password problem.`,
      debrief: scoutBreach(
        '"Clean. New account or genuinely unaffected."',
        `"Expected for eBay. If that password hasn't changed since 2014, it's been cracked for a decade."`,
        `"Multiple breaches including eBay's own. Your name, address, and phone were in that dump. A credit freeze helps."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "ebay-fortify-lockdown",
    accountId: "ebay",
    phase: "fortify",
    title: "Lockdown: eBay",
    briefing: "eBay stores your payment methods and shipping address. A unique password and 2FA prevent someone from placing purchases or listing stolen goods under your name. Given the 2014 breach, any old password is definitely compromised.",
    steps: [
      { text: 'Open eBay Account Security', url: 'https://www.ebay.com/myb/AccountSettings' },
      { text: `Under "Sign-in and Security" → "Password" → change it -- open your password manager, generate 20+ characters, save, paste` },
      { text: `Under "2-step verification" → turn it on → follow the prompts for phone or authenticator` },
      { text: "While you're here, review saved payment methods and remove any expired or unnecessary cards" },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"eBay 2FA. Because nobody should be winning auctions with your money except you."',
      debrief: {
        "reset-password": '"New password and 2FA on eBay. Your marketplace identity is secured."',
        "already-strong": `"Already locked down. Good -- eBay's breach was massive."`,
        "partial": '"Password done. 2FA blocks unauthorized purchases even if the new password leaks."',
        "later": '"Stored payment methods. Worth protecting."',
      },
    },
    estimatedMinutes: 5,
  },

  // ── UBER ── (2 missions -- cover-up breach story + location data)
  {
    id: "uber-recon-breach",
    accountId: "uber",
    phase: "recon",
    title: "Breach Recon: Uber",
    briefing: "Uber was breached in 2016 -- 57 million user records exposed. They tried to cover it up by paying the attackers $100,000 to delete the data and keep quiet. They were breached again in 2022. If you used Uber in 2016, your data was exposed and you weren't told.",
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: "Enter the email linked to your Uber account" },
      { text: "Also check the phone number -- Uber's 2016 breach included phone numbers and driver's license numbers" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"Uber got breached in 2016 and paid the hackers $100,000 to keep quiet about 57 million records. Names, email addresses, phone numbers, driver's license numbers. They didn't tell anyone for a year."`,
      debrief: scoutBreach(
        '"Clean. Either a new account or you dodged the cover-up breach."',
        `"Found in a breach. Uber's 2016 incident exposed emails, phone numbers, and license numbers."`,
        `"Multiple breaches. Your data was part of the breach Uber tried to pay off and pretend didn't happen."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "uber-reclaim-privacy",
    accountId: "uber",
    phase: "reclaim",
    title: "Privacy & Location Review: Uber",
    briefing: "Uber has a GPS trace of everywhere you've ever ridden -- your home, your workplace, your doctor, your ex's apartment. That's some of the most sensitive location data any company holds on you. Review what they share and set a strong password while you're in there.",
    steps: [
      { text: 'Open Uber Account Settings', url: 'https://account.uber.com/safety-security' },
      { text: "Change your password to a unique one -- open your password manager, generate 20+ characters, save, paste" },
      { text: 'Go to Uber Privacy Settings', url: 'https://account.uber.com/privacy' },
      { text: `Review "Data sharing" and "Advertising preferences" -- limit what you can` },
      { text: `Consider downloading your data (Uber → Account → Privacy → "Download your data") to see what they have` },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"Uber has a GPS trace of everywhere you've gone in their cars. Home, work, the doctor, that one address you visited three times and never talked about. Review what they share."`,
      debrief: {
        "tightened": `"Password updated and data sharing limited. Uber still has the location data, but it's shared less broadly."`,
        "already-tight": '"Already limited. Your location data is as private as Uber allows."',
        "later": '"The location data is the important one here. Worth a look."',
      },
    },
    estimatedMinutes: 8,
  },
];