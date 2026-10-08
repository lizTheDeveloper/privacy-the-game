import { PASSWORD_EXPOSED_QUESTION } from './missions-passwords.js';
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
  PASSWORD_EXPOSED_QUESTION,
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

// Each messenger's lock by its own name (Signal: registration lock PIN;
// WhatsApp: two-step verification PIN; Telegram: two-step password). Same id
// and values as REGISTRATION_LOCK_DEBRIEF; words only.
function lockDebrief(label, yes) {
  return [{
    id: 'action',
    label,
    options: [
      { value: 'enabled-2fa', text: yes, severity: 'safe' },
      { value: 'already-enabled', text: 'It was already on', severity: 'safe' },
      { value: 'later', text: `I'll come back to this`, severity: 'skip' },
    ],
  }];
}

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

// The same values as LOGIN_DEBRIEF, worded for a device list (audit #35).
const DEVICE_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-breaches', text: 'All my devices', severity: 'safe' },
      { value: '1-2-breaches', text: 'A device I don’t recognize', severity: 'warn' },
      { value: '3plus-breaches', text: 'Several I don’t recognize', severity: 'crit' },
      { value: 'skip', text: `Couldn't check right now`, severity: 'skip' },
    ],
  },
];

// Discord's apps and sessions (audit #41). Same values as LOGIN_DEBRIEF.
const TOKEN_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-breaches', text: 'Nothing suspicious', severity: 'safe' },
      { value: '1-2-breaches', text: 'Found an app or session I don’t recognize', severity: 'warn' },
      { value: '3plus-breaches', text: 'Confirmed someone else was in', severity: 'crit' },
      { value: 'skip', text: `Couldn't check right now`, severity: 'skip' },
    ],
  },
];

// X's connected apps (audit #34): a new question id. A save from before it
// answered the login-style finding, which still shows (question.legacy).
const APPS_AUDIT_DEBRIEF = [
  {
    id: 'apps_audit',
    label: 'What did you find in Apps and sessions?',
    legacy: LOGIN_DEBRIEF[0],
    options: [
      { value: 'apps-clean', text: 'Nothing I don’t use', severity: 'safe' },
      { value: 'apps-revoked', text: 'Revoked old apps', severity: 'safe' },
      { value: 'apps-unknown', text: 'Found an app or session I don’t recognize', severity: 'warn' },
      { value: 'skip', text: `Couldn't check right now`, severity: 'skip' },
    ],
  },
];

// Google Drive's link-sharing audit (audit #44): a new question id. A save
// from before it answered the login-style finding, which still shows.
const SHARES_AUDIT_DEBRIEF = [
  {
    id: 'shares_audit',
    label: 'What did you find?',
    legacy: LOGIN_DEBRIEF[0],
    options: [
      { value: 'shares-none', text: 'No open links on anything sensitive', severity: 'safe' },
      { value: 'shares-restricted', text: 'Found some and restricted them', severity: 'safe' },
      { value: 'shares-many', text: 'Lots of sensitive files were open', severity: 'warn' },
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
      { text: 'Read the results -- look for the breach named "Instagram" (a January 2026 scrape, no passwords)' },
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
        'already-strong': `"Already locked down. Good."`,
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
      { text: `In Instagram's settings, find Activity Status and turn it off (stops showing when you're online)` },
      { text: 'Go to "Messages and story replies" → set "Message controls" to restrict who can DM you' },
      { text: 'In Accounts Center, look for the setting about activity from other businesses and review it (it changes how Meta uses that activity, not whether businesses send it)' },
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
      { text: 'Open X → Settings and privacy → Security and account access → Apps and sessions → Connected apps', url: 'https://x.com/settings/connected_apps' },
      { text: 'Review every app in the list -- check what permissions each has (read, write, DMs)' },
      { text: 'Revoke access on anything you don’t actively use or recognize' },
      { text: 'Back in Apps and sessions, open Sessions and log out any you don’t recognize' },
    ],
    debriefQs: APPS_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: '"Some of these connected apps are from 2014 and have write access to your account. That quiz about which sandwich you are still has permission to tweet as you."',
      debrief: {
        'apps-clean': '"Nothing you don’t use. Nobody else holds a key here."',
        'apps-revoked': '"Old apps revoked. Dead integrations with write access are better gone."',
        'apps-unknown': '"An app or session you don’t recognize. Revoke it, change your password, and check for posts you didn’t make."',
        ...scoutLogin(
        '"All clean -- no suspicious apps or sessions."',
        '"Found some old apps. Revoking dead integrations is always the right call."',
        `"Yikes -- unauthorized app with write access. Revoke it, change your password, and check for any posts you didn't make."`,
      ),
      },
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
      { text: 'Open Twitter Settings', url: 'https://x.com/settings/your_twitter_data/account' },
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
    briefing: `X has settings for whether people who have your email address or phone number can find you. A lookup like that is how the 200-million-address scrape was built. Check those settings first.`,
    steps: [
      { text: 'Open Twitter Privacy', url: 'https://x.com/settings/audience_and_tagging' },
      { text: `Under "Discoverability and contacts" → turn OFF "Let people who have your email address find you" and same for phone` },
      { text: `Go to Settings → "Privacy and safety" → "Ads preferences" → turn off "Personalized ads"` },
      { text: `Go to "Data sharing with business partners" and turn it off` },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"Check whether people with your email or phone number can find you. A lookup like that is how the 200-million-address scrape was built."`,
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
      { text: 'In the TikTok app, open Settings and privacy, then its security section (Security & permissions on recent versions), then Manage devices' },
      { text: 'Review every device listed' },
      { text: 'Remove any device you don’t recognize or no longer use' },
    ],
    debriefQs: DEVICE_DEBRIEF,
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
      { text: "Open TikTok → Settings and privacy → its security section" },
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
      { text: 'Also open Data privacy → Other applications → Permitted services, and remove old app integrations you don’t use' },
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
    briefing: `Given LinkedIn's 2012 breach (unsalted SHA-1 hashes, most cracked soon after), change any password from that era. LinkedIn supports authenticator apps: with one, a stolen password alone isn’t enough. A code phished from you still is, so check links too.`,
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
        'partial': '"Password done. Add 2FA when you can: it stops a stolen password from being enough on its own."',
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
    briefing: 'LinkedIn lets your connections see your connections list by default, and lets people find you by email and phone. These settings feed recruiter spam, data scrapers, and social engineering attacks. The privacy controls are buried but functional.',
    steps: [
      { text: 'Open LinkedIn Visibility Settings', url: 'https://www.linkedin.com/psettings/privacy' },
      { text: 'Under "Visibility" → "Who can see your connections" → set to "Only you"' },
      { text: 'Under "Visibility" → "Profile discovery using email" and "phone number" → set to "No one" or "1st-degree connections"' },
      { text: 'Under "Data privacy" → "Manage your data and activity" → limit ad-related data sharing' },
    ],
    debriefQs: PRIVACY_DEBRIEF,
    scoutDialog: {
      briefing: `"By default your connections can browse your whole connections list. Decide who should see your network, then fix that first."`,
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
      { text: 'iPhone: Settings → Linked Devices. Android: ⋮ (top right) → Linked devices' },
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
    briefing: `WhatsApp doesn't use passwords -- it uses your phone number. Without a two-step verification PIN, anyone who SIM-swaps your phone number can register your WhatsApp account on their phone. The PIN makes them wait.`,
    steps: [
      { text: 'Open WhatsApp → Settings → Account → Two-Step Verification' },
      { text: 'Tap Turn on, choose a 6-digit PIN and enter it twice' },
      { text: 'Add a recovery email address -- this lets you reset the PIN if you forget it' },
      { text: 'Done -- registering your number on a new phone now needs this PIN, or a 7-day wait from your account’s last use (WhatsApp’s rule when the PIN is unknown)' },
    ],
    debriefQs: lockDebrief('Did you set a two-step verification PIN?', 'Yes, PIN is set'),
    scoutDialog: {
      briefing: `"WhatsApp’s “password” is its two-step verification PIN. Without it, someone who steals your phone number can register your account on their phone. SIM-swap attacks make this real."`,
      debrief: {
        "enabled-2fa": `"Registration PIN set. Someone with your number now needs the PIN, or has to wait a week."`,
        "already-enabled": `"Already had a PIN. Good -- most people skip this."`,
        "later": `"This is how WhatsApp hijacking works: steal the number, register on a new phone. The PIN makes them wait a week."`,
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
    briefing: 'Signal keeps almost nothing server-side -- no message history, no contact lists. What it can hand over is when you registered and when you last connected. But Signal Desktop and iPad create linked sessions that see all new messages in real time. An unknown linked device defeats the whole point of using Signal.',
    steps: [
      { text: 'Open Signal on your phone' },
      { text: 'Android: tap your profile picture → Linked devices. iPhone: Settings → Linked devices' },
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
      { text: 'Set or confirm your Signal PIN when asked: it’s what the lock checks' },
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
    briefing: "Discord token-stealing malware is an entire genre. A stolen token can act as you without your password, because it’s a session that has already signed in. The check is the apps you’ve authorized and any sessions Discord shows you, then a new password if anything looks wrong.",
    steps: [
      { text: 'Open Discord and click the cog (User Settings)', url: 'https://discord.com/channels/@me' },
      { text: 'Go to Authorized Apps → Deauthorize anything you don’t actively use' },
      { text: 'If you see Devices in your settings, review the sessions there and log out any you don’t recognize. If you don’t have it, skip this' },
      { text: 'Found anything suspicious? Change your password, and turn on two-factor if it’s off' },
    ],
    debriefQs: TOKEN_DEBRIEF,
    scoutDialog: {
      briefing: '"Discord token stealers are a whole genre of malware. A stolen token gets in without your password or your 2FA code. Know what has access, and cut off what you don’t recognize."',
      debrief: scoutLogin(
        '"All clear. No stolen tokens detected."',
        '"Something you don’t recognize. Deauthorize it and change your password."',
        '"Someone else was in. Change your password now, log out anything you don’t recognize, and turn on two-factor."',
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: "discord-fortify-lockdown",
    accountId: "discord",
    phase: "fortify",
    title: "Lockdown: Discord",
    briefing: "A new, unique password and 2FA are the lockdown. Backup codes are critical because losing your authenticator without codes means losing the account.",
    steps: [
      { text: 'Open Discord Settings → "My Account"', url: 'https://discord.com/channels/@me' },
      { text: `Click "Change Password" -- open your password manager, generate a 20+ character random password, save it, paste it in` },
      { text: `Scroll to "Two-Factor Authentication" → click "Enable" → scan the QR code with your authenticator app` },
      { text: `IMPORTANT: Click "Download Backup Codes" and save them in your password manager. Losing these + your authenticator = permanent lockout` },
    ],
    debriefQs: LOCKDOWN_DEBRIEF,
    scoutDialog: {
      briefing: '"New password, then 2FA, then backup codes so you can’t lock yourself out. All three, in that order."',
      debrief: {
        "reset-password": '"Password changed, 2FA active, backup codes saved. Your Discord is properly fortified."',
        "already-strong": '"Already locked down. Make sure those backup codes are still accessible."',
        "partial": '"Password changed -- good. Come back for 2FA: it’s the second lock."',
        "later": `"Discord accounts get hijacked through stolen tokens and reused passwords. Don't wait."`,
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
    briefing: "Reddit supports 2FA via authenticator apps. Reddit's 2018 breach took a 2007 backup, so a password from 2007 or earlier should go. A unique password protects your pseudonymous identity.",
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
        'later': '"Reddit’s 2018 breach took a 2007 backup. If your account and password date from 2007 or earlier, change it. Come back."',
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
      { text: 'Set a password: a strong one from your password manager, different from everything else' },
      { text: `Add a recovery email address -- use one you've already secured` },
      { text: 'Check the confirmation email Telegram sends to verify the recovery address' },
    ],
    debriefQs: lockDebrief('Did you set a two-step verification password?', 'Yes, password is set'),
    scoutDialog: {
      briefing: `"Telegram's two-step password is the single most important setting. Without it, anyone who intercepts one SMS code owns your entire account. SIM-swap attacks make this real, not theoretical."`,
      debrief: {
        "enabled-2fa": `"Two-step password set. An intercepted SMS code alone no longer gets someone in."`,
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
      { text: 'Find files shared with “Anyone with the link”, using Drive’s search filters or the search sharedwith:public' },
      { text: 'For each sensitive file (ID scans, tax returns, contracts): right-click → Share → General access → Restricted' },
      { text: 'Check “Shared with me” for files others shared that you may have reshared' },
    ],
    debriefQs: SHARES_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: `"Every 'Anyone with the link' share is a public URL. If that link leaked -- in a Slack channel, an email, a forum post -- your document is effectively a public web page."`,
      debrief: {
        'shares-none': '"No sensitive documents with open links. Clean file system."',
        'shares-restricted': '"Found some open shares and restricted them. That’s the right call."',
        'shares-many': '"Lots of sensitive docs with open links. Those are effectively public web pages. Restrict them when you can."',
        ...scoutLogin(
          '"No sensitive documents with open links. Clean file system."',
          '"Found some open shares. Restricting access on the sensitive ones is the right call."',
          '"Multiple sensitive docs with public links. Those are effectively public web pages. Lock them down."',
        ),
      },
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
      briefing: '"Dropbox syncs to every linked device. An unknown device in this list already has copies of your files. Unlink first, then change the password."',
      debrief: {
        "reset-password": '"Devices audited, password changed, 2FA enabled. Your file archive is properly secured."',
        "already-strong": `"Already locked down. Good -- Dropbox's breach history makes this important."`,
        "partial": `"Password changed. Come back for 2FA -- it's the safety net for when passwords leak again."`,
        "later": `"Dropbox's 2012 breach took passwords, and Dropbox reset old ones in 2016. If yours is older than that, change it."`,
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
    briefing: 'GitHub’s security log shows sign-ins and changes to your account: new SSH keys, new tokens, new app grants. It doesn’t list each clone. An event you didn’t make can mean someone added a key or token that would let them clone your private repos, along with any secrets in the commit history.',
    steps: [
      { text: 'Open your security log. Review the last 90 days for sign-ins, new SSH keys, new tokens or OAuth grants you didn’t make', url: 'https://github.com/settings/security-log' },
      { text: 'Open Sessions and revoke any you don’t recognize', url: 'https://github.com/settings/sessions' },
      { text: 'Check your SSH keys and delete any you don’t recognize', url: 'https://github.com/settings/keys' },
      { text: 'Check your personal access tokens and delete any you don’t recognize', url: 'https://github.com/settings/tokens' },
    ],
    debriefQs: LOGIN_DEBRIEF,
    scoutDialog: {
      briefing: `"The security log shows keys and tokens being added, not each download. A key you didn't add is a door someone else can use."`,
      debrief: scoutLogin(
        '"All recognized activity. Nothing in the log you didn’t do."',
        '"Unfamiliar activity. Revoke the token or key and rotate your credentials."',
        '"Unauthorized access to GitHub. Treat your private repos as copied. Rotate ALL keys and tokens."',
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
      { text: 'Open GitHub Settings → "Password and authentication"', url: 'https://github.com/settings/security' },
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
        "no-breaches": '"No alerts. On a free plan, secret scanning covers public repos only, so check private ones by hand."',
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
      { text: 'Open Your Account → Login & security', url: 'https://www.amazon.com/your-account' },
      { text: `Click "Edit" next to Password → open your password manager, generate a random 20+ character password, save it, paste in` },
      { text: `In Login & security, turn on two-step verification` },
      { text: `Choose an authenticator app if offered, scan the QR code, and enter the code to confirm` },
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
      briefing: `"The real risk isn't losing Netflix -- it's that the password you used for Netflix is the same one you used for your email. Your password manager tells you in thirty seconds."`,
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
      { text: 'Have I Been Pwned doesn’t list the 2014 eBay breach. If you had eBay before 2014, treat that data as out there anyway' },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `eBay lost 145 million records in 2014. Encrypted passwords, yes, but also names, physical addresses, phone numbers, and dates of birth. That's identity theft material, not just a password problem.`,
      debrief: scoutBreach(
        '"Clean. New account or genuinely unaffected."',
        `"Found some exposure on this address. If your eBay password hasn't changed since 2014, change it."`,
        `"Multiple breaches on this address. eBay's own 2014 breach isn't even in that list. A credit freeze helps."`,
      ),
    },
    estimatedMinutes: 3,
  },
  {
    id: "ebay-fortify-lockdown",
    accountId: "ebay",
    phase: "fortify",
    title: "Lockdown: eBay",
    briefing: "eBay stores your payment methods and shipping address. A unique password and 2FA prevent someone from placing purchases or listing stolen goods under your name. If your password is from before eBay's 2014 breach, change it: that breach took encrypted passwords.",
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
      { text: "Have I Been Pwned doesn't list Uber's 2016 breach, so a clean result here doesn't clear Uber" },
    ],
    debriefQs: BREACH_DEBRIEF,
    scoutDialog: {
      briefing: `"Uber got breached in 2016 and paid the hackers $100,000 to keep quiet about 57 million records. Names, email addresses and phone numbers; the license numbers were drivers'. They didn't tell anyone for a year."`,
      debrief: scoutBreach(
        '"Clean on this list. Uber’s 2016 breach isn’t in it, so that one stays an unknown."',
        `"Found in a breach. Not Uber's own -- that one isn't in the list -- but the password question still matters."`,
        `"Multiple breaches on this address. If your Uber password matches any of them, change it."`,
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
      { text: `Consider requesting a copy of your data from Uber’s privacy settings to see what they have` },
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

  // ══════════════════════════════════════════════════════
  // SOCIAL MEDIA HISTORY REVIEW
  // Year-by-year — designed to be done one sitting per year.
  // Emotionally aware. No rushing. Come back tomorrow.
  // ══════════════════════════════════════════════════════

  // --- INSTAGRAM ---
  {
    id: 'instagram-reclaim-prep',
    accountId: 'instagram',
    phase: 'reclaim',
    title: 'Memory Lane Prep: Instagram',
    briefing: "Before we start going through your history, let's get the lay of the land. How old is your account? How many posts? This mission sets the stage — you'll download your data so you have a backup, and figure out how many years you're looking at. The actual review happens one year at a time in the missions that follow.",
    steps: [
      { text: "Open your profile. Scroll to your very earliest post. Note the year — that's your starting line." },
      { text: "Count your posts (it's in your profile header). This tells you how big the job is." },
      { text: "Export your data now — it takes time to generate: Settings → Accounts Center → Your information and permissions → Export your information", url: "https://accountscenter.instagram.com/info_and_permissions/dyi/" },
      { text: "While that processes, look at your story archive: Profile > Menu > Archive. These were 'temporary' but Instagram kept them all." },
    ],
    debriefQs: [{ id: 'finding', label: 'How old is your account?', options: [
      { value: 'cleaned-up', text: '1-3 years', severity: 'safe' },
      { value: 'some-removed', text: '4-7 years', severity: 'warn' },
      { value: 'mostly-fine', text: '8+ years', severity: 'crit' },
      { value: 'skip', text: "Started download, will check back", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"First step: figure out what we're dealing with. How many years of your life are in there? Download everything first — that's your safety net before we start reviewing.\"",
      debrief: {
        'cleaned-up': "\"A few years — that's manageable. One sitting per year, you'll be through it in a week.\"",
        'some-removed': "\"Several years of history. We'll take it one year at a time. No rush.\"",
        'mostly-fine': "\"That's a decade of your life on one platform. We'll go slow. One year per sitting, take breaks between.\"",
        'skip': "\"The download is the important first step. Come back when it's ready.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: 'instagram-reclaim-early-years',
    accountId: 'instagram',
    phase: 'reclaim',
    title: 'Memory Lane: Instagram Early Years',
    briefing: "Pick your earliest year on Instagram and just review that one year. Don't try to do more than one. Scroll through those posts and for each one, ask yourself: would I post this today? Check the location tags — did you tag your home, your workplace, your gym? Check who's in the photos. Some of those people might not be in your life anymore. That's okay. This is about what's public now, not what happened then.",
    steps: [
      { text: "Pick ONE year — your earliest. Scroll to those posts." },
      { text: "For each post: would you share this today? If not, archive it (it's not deleted, just hidden)." },
      { text: "Check location tags on posts from this year. Home, work, school — these paint a map of your life." },
      { text: "Look for photos showing the outside of your home — especially address numbers on the house or mailbox. These make your home findable on Google Street View." },
      { text: "Look at the comments. Any personal information shared in conversations?" },
      { text: "When you finish that year, stop. Come back tomorrow for the next one." },
    ],
    debriefQs: [{ id: 'finding', label: 'How was that year?', options: [
      { value: 'cleaned-up', text: 'Archived some posts — feels right', severity: 'safe' },
      { value: 'some-removed', text: 'Reviewed it, keeping most of it', severity: 'safe' },
      { value: 'mostly-fine', text: 'That year was fine — moving on', severity: 'safe' },
      { value: 'skip', text: "Got partway through — picking it up later", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"One year. That's it. Don't scroll past it, don't try to power through. Just that one year. You were a different person then, and that's fine. We're just making sure that person isn't oversharing on your behalf.\"",
      debrief: {
        'cleaned-up': "\"One year reviewed, some things archived. That's a real accomplishment. Come back tomorrow for the next year.\"",
        'some-removed': "\"Reviewed and kept it — that's a choice, not an accident. That counts.\"",
        'mostly-fine': "\"Clean year. On to the next one when you're ready.\"",
        'skip': "\"No worries. Even half a year is progress. Pick it up when you can.\"",
      },
    },
    estimatedMinutes: 15,
  },
  {
    id: 'instagram-reclaim-middle-years',
    accountId: 'instagram',
    phase: 'reclaim',
    title: 'Memory Lane: Instagram Middle Years',
    briefing: "Same drill — pick the next year you haven't reviewed yet. By now you've probably hit your stride on the platform: more posts, more stories, more reels. This is often where the location tags get heavy because you were comfortable and not thinking about it. Check tagged photos too — other people's posts with your face show up under your profile.",
    steps: [
      { text: "Pick the next year you haven't reviewed. Set a timer for 15 minutes if it helps." },
      { text: "Scroll through that year's posts. Archive anything that doesn't represent you anymore." },
      { text: "Check 'Photos of you' from this period — Profile > tagged photos. Untag anything you're not comfortable with." },
      { text: "Check story highlights from this era — these stay on your profile permanently." },
      { text: "Stop when you finish that year. You're building a habit, not running a marathon." },
    ],
    debriefQs: [{ id: 'finding', label: 'How was this year?', options: [
      { value: 'cleaned-up', text: 'Cleaned up some posts and tags', severity: 'safe' },
      { value: 'some-removed', text: 'Reviewed it, mostly good', severity: 'safe' },
      { value: 'mostly-fine', text: 'Nothing to change', severity: 'safe' },
      { value: 'skip', text: "Paused — will finish this year later", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"Next year. Same pace. If you hit a post that makes you feel something — good or bad — sit with it for a second before deciding. This isn't a race.\"",
      debrief: {
        'cleaned-up': "\"Another year reclaimed. You're building a cleaner, more intentional profile one year at a time.\"",
        'some-removed': "\"Good year. Keep the rhythm — one year per sitting is the pace.\"",
        'mostly-fine': "\"Nothing to change is a great outcome. On to the next.\"",
        'skip': "\"Half a year is still half a year. Come back for the rest.\"",
      },
    },
    estimatedMinutes: 15,
  },
  {
    id: 'instagram-reclaim-recent',
    accountId: 'instagram',
    phase: 'reclaim',
    title: 'Memory Lane: Instagram Recent + Reels',
    briefing: "The last couple years — and this is where reels come in. Reels get algorithmic reach way beyond your followers. A reel you posted for fun might have been seen by thousands of strangers. Check what's in the background: your home, your street, your license plate, your kids' school. Also review your saved collections and close friends list — these shape what Instagram shows you and who gets to see your private stories.",
    steps: [
      { text: "Review your last 1-2 years of posts, same as before." },
      { text: "Now check Reels specifically: Profile > Reels tab. Sort by views — the high-view ones reached strangers." },
      { text: "For each reel: what's in the background? House numbers, street signs, car license plates, school names, workplace logos — these are OSINT goldmines." },
      { text: "Review saved posts and collections — any sensitive content?" },
      { text: "Check your Close Friends list: Settings > Close Friends. Is everyone on it still someone you trust with private stories?" },
    ],
    debriefQs: [{ id: 'finding', label: 'How did the recent review go?', options: [
      { value: 'cleaned-up', text: 'Removed or restricted some reels and posts', severity: 'safe' },
      { value: 'some-removed', text: 'Mostly fine, tightened a few things', severity: 'safe' },
      { value: 'mostly-fine', text: 'Recent history looks good', severity: 'safe' },
      { value: 'skip', text: "Will finish later", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"Reels are the big one here. They go places your regular posts don't. A cooking video that shows your kitchen also shows your neighborhood through the window. Check what the algorithm shared with strangers.\"",
      debrief: {
        'cleaned-up': "\"Instagram history: reviewed, year by year. That's something most people never do. Your profile is yours now — intentional, not accidental.\"",
        'some-removed': "\"Recent stuff tightened up. The full history review is the real achievement here.\"",
        'mostly-fine': "\"All years reviewed, recent stuff clean. That's the whole Instagram timeline, reclaimed.\"",
        'skip': "\"Almost there. The recent stuff is usually the quickest review.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // --- FACEBOOK ---
  {
    id: 'facebook-reclaim-prep',
    optional: true,
    accountId: 'facebook',
    phase: 'reclaim',
    title: 'Memory Lane Prep: Facebook',
    briefing: "Facebook is probably the oldest social media account you have. Some people have 15+ years of posts on here — that's high school, college, first jobs, relationships that ended, opinions you've outgrown. Before we start the year-by-year review, let's figure out what we're dealing with and get your data downloaded.",
    steps: [
      { text: "Check your account age: open About on your profile, look for 'Joined Facebook' date" },
      { text: "Open Activity Log — this is your master record", url: "https://www.facebook.com/allactivity" },
      { text: 'Export your data: Settings & privacy → Settings → Accounts Center → Your information and permissions → Export your information', url: 'https://accountscenter.facebook.com/' },
      { text: "Check which apps still have access: Settings > Apps and websites. Revoke old ones now while you're here." },
    ],
    debriefQs: [{ id: 'finding', label: 'How long have you been on Facebook?', options: [
      { value: 'cleaned-up', text: '1-5 years', severity: 'safe' },
      { value: 'some-removed', text: '6-10 years', severity: 'warn' },
      { value: 'mostly-fine', text: '11+ years', severity: 'crit' },
      { value: 'skip', text: "Started download, coming back", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"Facebook remembers everything. Let's find out how much 'everything' is before we start going through it. Download first, review later.\"",
      debrief: {
        'cleaned-up': "\"A manageable history. A few sittings and you'll have reviewed it all.\"",
        'some-removed': "\"About a decade. That's a lot of life. One year at a time — we'll get through it.\"",
        'mostly-fine': "\"Over a decade of your life on one platform. This is going to take a few sessions, and that's completely normal. One year per sitting.\"",
        'skip': "\"Download processing. Come back when it's ready — it's the safety net for everything that follows.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: 'facebook-reclaim-early',
    optional: true,
    accountId: 'facebook',
    phase: 'reclaim',
    title: 'Memory Lane: Facebook Early Years',
    briefing: "Go to your Activity Log and filter to your earliest year on Facebook. This is usually the roughest — you were younger, the internet felt smaller, and nobody thought their posts would still be public in 2026. Wall posts from friends, status updates about your day, photos from parties. Take it slow. What would present-you think of past-you's Facebook?",
    steps: [
      { text: "Activity Log: filter to your earliest year. Read through your posts from that year only." },
      { text: "Check status updates — these often have way more personal detail than you'd share today." },
      { text: "Look at wall posts FROM other people — you can hide these from your timeline." },
      { text: "Check photos you were tagged in from this year. Untag if needed." },
      { text: "Use 'Manage activity' to bulk-archive posts from this year if you want them hidden but not deleted." },
      { text: "Stop after this year. Come back tomorrow." },
    ],
    debriefQs: [{ id: 'finding', label: 'How was that first year?', options: [
      { value: 'cleaned-up', text: 'Archived a bunch — glad I checked', severity: 'safe' },
      { value: 'some-removed', text: 'Reviewed it, not as bad as I expected', severity: 'safe' },
      { value: 'mostly-fine', text: 'That year was fine', severity: 'safe' },
      { value: 'skip', text: "That was a lot — taking a break", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"Your earliest Facebook year is usually the wildest one. You were younger, the world was different, and you probably didn't think anyone would read these posts a decade later. No judgment. Just review.\"",
      debrief: {
        'cleaned-up': "\"First year handled. That's often the hardest one. The rest get easier from here.\"",
        'some-removed': "\"Not as bad as expected — that's a good sign for the rest.\"",
        'mostly-fine': "\"Clean first year. Nice.\"",
        'skip': "\"The early years hit different. Take whatever time you need.\"",
      },
    },
    estimatedMinutes: 15,
  },
  {
    id: 'facebook-reclaim-middle',
    optional: true,
    accountId: 'facebook',
    phase: 'reclaim',
    title: 'Memory Lane: Facebook Next Year',
    briefing: "Pick up where you left off — the next year you haven't reviewed. Activity Log, filter by year. This is the mission you'll repeat until you're caught up: one year per sitting. Check-ins are the big privacy exposure on Facebook — they map everywhere you went. Old group memberships too. Groups you joined in 2015 still show on your profile.",
    steps: [
      { text: "Activity Log: filter to your next unreviewed year." },
      { text: "Review posts. Archive what doesn't serve you anymore." },
      { text: "Check check-ins from this year — they map your life: home, work, favorite spots." },
      { text: "Look for photos of your house or apartment — visible address numbers make your home findable. Porch photos, moving day posts, 'just bought a house!' celebrations." },
      { text: "Review groups you joined this year. Leave any you no longer want associated with." },
      { text: "Check 'Likes and reactions' — pages you liked years ago are still on your profile." },
      { text: "Done with this year? Stop. Tomorrow is another year." },
    ],
    debriefQs: [{ id: 'finding', label: 'Another year reviewed?', options: [
      { value: 'cleaned-up', text: 'Cleaned up posts, check-ins, or groups', severity: 'safe' },
      { value: 'some-removed', text: 'Reviewed — keeping most of it', severity: 'safe' },
      { value: 'mostly-fine', text: 'Clean year, moving on', severity: 'safe' },
      { value: 'skip', text: "Partway through — picking up later", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"Next year up. Same rhythm. Check-ins and group memberships are the ones people forget about — they're not in your feed but they're on your profile.\"",
      debrief: {
        'cleaned-up': "\"Another year reclaimed. You're chipping away at it. Come back tomorrow for the next one.\"",
        'some-removed': "\"Steady progress. One year at a time is the right pace.\"",
        'mostly-fine': "\"Clean year. Onward.\"",
        'skip': "\"No rush. Every year you review is one more year you've made intentional.\"",
      },
    },
    estimatedMinutes: 15,
  },
  {
    id: 'facebook-reclaim-recent',
    optional: true,
    accountId: 'facebook',
    phase: 'reclaim',
    title: 'Memory Lane: Facebook Recent + Tags',
    briefing: "The last stretch — your recent years plus everything tagged by other people. Tagged photos and posts from other people are often the biggest surprise: you don't always see them, but they're on your profile. This is also a good time to review your 'Memories' settings and make sure Facebook isn't resurfacing things you've already chosen to archive.",
    steps: [
      { text: "Review your most recent 1-2 years of posts." },
      { text: "Check all tagged photos: Activity Log > Photos and videos > Photos and videos of you." },
      { text: "Review posts others shared on your timeline that you may not have noticed." },
      { text: "In Facebook’s Memories settings, control what it resurfaces to you." },
      { text: "Final check: view your profile as a stranger (Profile > three dots > 'View As'). What do they see?" },
    ],
    debriefQs: [{ id: 'finding', label: 'How does the finished review feel?', options: [
      { value: 'cleaned-up', text: 'Cleaned up tags and recent posts — profile is tighter', severity: 'safe' },
      { value: 'some-removed', text: 'Mostly done, a few things left', severity: 'safe' },
      { value: 'mostly-fine', text: 'Whole history reviewed — I feel good about it', severity: 'safe' },
      { value: 'skip', text: "Almost there — finishing later", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"Last stretch. The 'View As' at the end is the real test — see your profile through a stranger's eyes. Everything you've cleaned up over these sessions shows in that view.\"",
      debrief: {
        'cleaned-up': "\"Facebook history: reviewed, year by year. That's something almost nobody does. Your profile is intentional now — curated by the person you are, not the person you were.\"",
        'some-removed': "\"Nearly there. The bulk of the work is done.\"",
        'mostly-fine': "\"Full review complete. That's years of your life, made intentional. Well done.\"",
        'skip': "\"So close. Come back for the final pass.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // --- X/TWITTER ---
  {
    id: 'twitter-reclaim-prep',
    accountId: 'twitter',
    phase: 'reclaim',
    title: 'Memory Lane Prep: X / Twitter',
    briefing: "Twitter is the platform where old posts come back to haunt people the most. Everything is public by default, old tweets get quote-tweeted with zero context, and screenshots live forever. Before you start reviewing, download your archive — it takes a while to generate, and it's your safety net.",
    steps: [
      { text: "Check your Joined date and tweet count on your profile." },
      { text: "Request your archive: Settings > Your Account > Download an archive of your data", url: "https://x.com/settings/download_your_data" },
      { text: "While it processes: try searching 'from:yourhandle' to browse your old tweets." },
      { text: "Note how many years you're looking at. Plan one year per sitting." },
    ],
    debriefQs: [{ id: 'finding', label: 'Archive requested?', options: [
      { value: 'cleaned-up', text: 'Yes, archive is processing', severity: 'safe' },
      { value: 'skip', text: "Will request it later", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"Download first, review later. The archive means nothing is lost even if you decide to clean house. It takes a few hours to generate.\"",
      debrief: {
        'cleaned-up': "\"Archive on the way. When it arrives, you'll have a complete backup. Now you can review freely.\"",
        'skip': "\"The archive is important — it's your insurance policy. Start there.\"",
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: 'twitter-reclaim-review',
    accountId: 'twitter',
    phase: 'reclaim',
    title: 'Memory Lane: X / Twitter Year Review',
    briefing: "Pick a year and go through your tweets from that period. Search 'from:yourhandle since:YYYY-01-01 until:YYYY-12-31' to filter. Hot takes age badly. Reply-guy energy from 2016 reads different in 2026. Your likes are private now (X hid them from everyone else in June 2024), so those are just for you. Do one year at a time.",
    steps: [
      { text: "Search your tweets from one year: 'from:yourhandle since:YYYY-01-01 until:YYYY-12-31'" },
      { text: "Read through them. Ask: would this tweet get me in trouble if it went viral today?" },
      { text: "Check quote tweets and replies — these have more context collapse risk than regular tweets." },
      { text: "Optional: review your likes from this period (Profile > Likes). Since June 2024 only you can see them." },
      { text: "Delete individual tweets you're not comfortable with, or note them for bulk deletion later." },
      { text: "One year done? Stop. Come back for the next one." },
    ],
    debriefQs: [{ id: 'finding', label: 'How was that year?', options: [
      { value: 'cleaned-up', text: 'Deleted some old tweets', severity: 'safe' },
      { value: 'some-removed', text: 'Reviewed it — mostly fine', severity: 'safe' },
      { value: 'mostly-fine', text: 'Nothing to change', severity: 'safe' },
      { value: 'skip', text: "Got partway through", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"One year of tweets. Read them like a stranger would, with zero context about what was happening in your life. That's how the internet reads them.\"",
      debrief: {
        'cleaned-up': "\"Good judgment calls. The archive has the originals if you ever want them back.\"",
        'some-removed': "\"Reviewed and comfortable — that's the right outcome.\"",
        'mostly-fine': "\"Clean year. Next one when you're ready.\"",
        'skip': "\"Even a few months reviewed is progress. Come back for the rest.\"",
      },
    },
    estimatedMinutes: 15,
  },
  {
    id: 'twitter-reclaim-bulk',
    accountId: 'twitter',
    phase: 'reclaim',
    title: 'Memory Lane: X / Twitter Bulk Cleanup',
    briefing: "After reviewing year by year, you might want a clean slate for old tweets while keeping your archive. Bulk-delete tools exist (Semiphemeral, TweetDelete, Redact and others), but some may no longer work after X's API changes. Your downloaded archive preserves everything. This is the 'keep the receipts, remove the live copies' approach.",
    steps: [
      { text: "Make sure you have your downloaded archive saved somewhere safe." },
      { text: "Decide your cutoff: do you want to keep tweets from the last year? Two years? All time?" },
      { text: "If a bulk-delete tool still works with X, consider one for tweets before your cutoff date; otherwise delete by hand." },
      { text: "Review your media tab (Profile > Media) for photos and videos you've shared." },
      { text: "Final check: scroll your profile as a stranger would. How does it look?" },
    ],
    debriefQs: [{ id: 'finding', label: 'Clean slate?', options: [
      { value: 'cleaned-up', text: 'Bulk-deleted old tweets, archive saved', severity: 'safe' },
      { value: 'some-removed', text: 'Deleted selectively, keeping most', severity: 'safe' },
      { value: 'mostly-fine', text: 'Decided to keep everything after reviewing', severity: 'safe' },
      { value: 'skip', text: "Still deciding", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"The nuclear option — but a smart one. Your archive has everything. The live copies don't need to exist for strangers to find.\"",
      debrief: {
        'cleaned-up': "\"Clean public profile, complete private archive. Best of both worlds.\"",
        'some-removed': "\"Selective cleanup is valid too. You chose what stays.\"",
        'mostly-fine': "\"Reviewed everything and kept it — that's an informed choice. It counts.\"",
        'skip': "\"Take your time deciding. The archive isn't going anywhere.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // --- TIKTOK ---
  {
    id: 'tiktok-reclaim-review',
    accountId: 'tiktok',
    phase: 'reclaim',
    title: 'Memory Lane: TikTok Deep Review',
    briefing: "TikTok is different from text-based platforms — your face, your voice, your home, your daily routine are all in the videos. The algorithm decides who sees them, and a video posted for 200 followers can surface on 50,000 For You pages. Review your videos one batch at a time, paying attention to what's in the BACKGROUND, not just the content.",
    steps: [
      { text: "Open your profile. Start from your oldest videos. Pick a batch of 10-20 to review." },
      { text: "For each video: what's visible in the background? House numbers, street signs, car plates, school logos, mail with your name on it?" },
      { text: "Check view counts — high-view videos were seen by many strangers. Anything too personal?" },
      { text: "Review duets and stitches: others may have used your content in ways you haven't seen." },
      { text: "Check your liked videos (heart icon) — these may be public depending on your settings." },
      { text: "Download your data for a full record", url: "https://www.tiktok.com/setting/download-your-data" },
      { text: "Done with this batch? Come back for the next 10-20 videos." },
    ],
    debriefQs: [{ id: 'finding', label: 'How was this batch?', options: [
      { value: 'cleaned-up', text: 'Removed or privated some videos', severity: 'safe' },
      { value: 'some-removed', text: 'Reviewed, keeping most', severity: 'safe' },
      { value: 'mostly-fine', text: 'All good', severity: 'safe' },
      { value: 'skip', text: "Will review more later", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"10-20 videos at a time. Watch them like a stranger would. What does the background tell someone about where you live, what you drive, where your kids go to school? That's the stuff the algorithm shared with thousands of people you don't know.\"",
      debrief: {
        'cleaned-up': "\"Good eye. The background details are what most people miss. Come back for the next batch when you're ready.\"",
        'some-removed': "\"Reviewed and comfortable. Next batch whenever.\"",
        'mostly-fine': "\"Clean batch. Keep going when you have time.\"",
        'skip': "\"Batches of 10-20 is the right pace. No rush.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // --- LINKEDIN ---
  {
    id: 'linkedin-reclaim-review',
    accountId: 'linkedin',
    phase: 'reclaim',
    title: 'Memory Lane: LinkedIn Audit',
    briefing: "LinkedIn feels professional so people forget to audit it. But it's a complete dossier: every job, every connection, every endorsement, every recommendation, every post. Data brokers scrape it. Recruiters screenshot it. Old connections you don't remember get full access to your work history, email, and phone number.",
    steps: [
      { text: "View your profile as others see it: Profile > eye icon > 'View as' (or open in incognito)." },
      { text: "Review your connections list. Do you actually know all these people? Remove unknowns." },
      { text: "Check activity: Profile > Activity. Old posts, comments, and reactions are visible." },
      { text: "Review recommendations — any for people or companies you'd rather not highlight?" },
      { text: "Check skills and endorsements. Outdated skills reveal more history than you might want." },
      { text: "Settings > Visibility: who can see your email, phone, connections list?" },
      { text: "Download your data: Settings > Data privacy > Get a copy of your data", url: "https://www.linkedin.com/mypreferences/d/download-my-data" },
    ],
    debriefQs: [{ id: 'finding', label: 'How does the profile look?', options: [
      { value: 'cleaned-up', text: 'Tightened visibility, removed old connections', severity: 'safe' },
      { value: 'some-removed', text: 'Made some updates, more to do', severity: 'safe' },
      { value: 'mostly-fine', text: 'Profile looks good as-is', severity: 'safe' },
      { value: 'skip', text: "Started, will finish later", severity: 'skip' },
    ]}],
    scoutDialog: {
      briefing: "\"LinkedIn is the one that sneaks up on you. It feels safe because it's 'professional.' But it's a full dossier that anyone can view — including data brokers who scrape it for people-search sites.\"",
      debrief: {
        'cleaned-up': "\"Profile tightened. Fewer unknown connections means less exposure. Data brokers get less to scrape.\"",
        'some-removed': "\"Good start. The connections cull is usually where the biggest wins are.\"",
        'mostly-fine': "\"Clean professional profile. That's actually rare.\"",
        'skip': "\"Come back when you have time. The connections list is the priority.\"",
      },
    },
    estimatedMinutes: 20,
  },
];