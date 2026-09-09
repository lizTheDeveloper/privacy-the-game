// ══════════════════════════════════════════════════════
// CHAPTER 7: THE PERIMETER
// The tactical district -- field operations, not account maintenance
// ══════════════════════════════════════════════════════

const ACTION_DEBRIEF = [
  {
    id: "action",
    label: "Did you complete this step?",
    options: [
      { value: "completed", text: "Done", severity: "safe" },
      { value: "already-done", text: "Already had this in place", severity: "safe" },
      { value: "not-applicable', text: 'Doesn't apply to me', severity: 'safe" },
      { value: "later', text: 'I'll come back to this', severity: 'skip" },
    ],
  },
];

const PHISHING_DEBRIEF = [
  {
    id: "finding",
    label: "What's your verdict?",
    options: [
      { value: "no-breaches", text: "I can spot these reliably now", severity: "safe" },
      { value: "1-2-breaches", text: "Got tripped up on a couple", severity: "warn" },
      { value: "skip', text: 'I'll come back to this', severity: 'skip" },
    ],
  },
];

function scoutAction(completed, alreadyDone, na) {
  return {
    "completed": completed,
    "already-done": alreadyDone,
    "not-applicable": na,
    "later": "\"The Perimeter holds while you regroup. Come back when you're ready.\"",
  };
}

export const PERIMETER_MISSIONS = [

  // ══════════════════════════════════════════════════════
  // SIM PROTECTION -- urgent, standalone
  // ══════════════════════════════════════════════════════
  {
    id: "sim_protection-fortify-pin",
    accountId: "sim_protection",
    phase: "fortify",
    title: "Lock Down Your Phone Number",
    briefing: "SIM swapping is when an attacker calls your carrier, pretends to be you, and transfers your number to their SIM card. Your phone goes dead. Their phone starts receiving your texts -- including every SMS two-factor code. The whole attack takes fifteen minutes. Your defense is a carrier account PIN and a port-out lock. These are two settings, one phone call or website visit, and they block the most common way high-value accounts get stolen.",
    steps: [
      { text: "T-Mobile: Open t-mobile.com/account → Profile → Security → set a unique Account PIN (not your birthday or SSN). Then enable \"Account Takeover Protection\" under the same Security page.", url: "https://www.t-mobile.com/account/profile/security" },
      { text: "AT&T: Open att.com/myatt → Profile → Sign-in info → set a Wireless Passcode. Then go to Account → Security → enable \"Extra Security\" (this requires the passcode for ALL account changes).", url: "https://www.att.com/acctmgmt/profile" },
      { text: "Verizon: Open myverizon.com → Account → Security → set an Account PIN. Then enable \"Number Lock\" on the same page.", url: "https://www.verizon.com/signin/" },
      { text: "Other carriers: Call customer service and ask for an account PIN/passcode and port-out protection. If they say they don't have it, ask for a supervisor." },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"This is the most urgent mission in The Perimeter. SIM swapping is the attack that bypasses everything -- your strong passwords, your careful account hygiene, all of it -- because it steals the phone number your two-factor codes are sent to. A carrier PIN and port lock take five minutes to set up and stop the most common version of this attack cold.\"",
      debrief: scoutAction(
        "\"Phone number locked down. The customer service rep now needs your PIN before anyone walks away with your number. That wall wasn't there five minutes ago.\"",
        "\"Already had both in place. You're one of the rare ones who locked the back door before someone walked through it.\"",
        "\"If you don't have a US carrier or use a different setup, the principle is the same: contact your provider and ask what protections exist against unauthorized SIM changes.\"",
      ),
    },
    estimatedMinutes: 8,
  },
  {
    id: "sim_protection-reclaim-remove-sms",
    accountId: "sim_protection",
    phase: "reclaim",
    title: "Remove SMS from High-Value Accounts",
    briefing: "Even with a carrier PIN, SMS is the weakest two-factor method. The real fix is making your phone number irrelevant to account security. If your important accounts use an authenticator app instead of SMS codes, then even a successful SIM swap gives the attacker nothing but the ability to receive your spam calls.",
    steps: [
      { text: "Google: Open myaccount.google.com/signinoptions/two-step-verification → under \"How you sign in,\" remove your phone number as a verification method. Keep Google Authenticator or your security key.", url: "https://myaccount.google.com/signinoptions/two-step-verification" },
      { text: "Microsoft: Open account.live.com/proofs/manage → remove \"Text a code to my phone\" as a sign-in method. Keep the Microsoft Authenticator app.", url: "https://account.live.com/proofs/manage" },
      { text: "Apple: If you use Trusted Phone Numbers, make sure you also have trusted devices as alternatives (iPhone, iPad, or Mac signed into iCloud)." },
      { text: "Banks: Log into your primary bank → Security Settings → check if they support authenticator app 2FA instead of SMS. Many now do (Chase, Bank of America, Schwab). Switch if available." },
      { text: "For any account where SMS is the ONLY 2FA option: add an authenticator app first, confirm it works, then remove the phone number." },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"The carrier PIN protects your number. This mission makes your number not matter. When your Google account uses an authenticator app instead of SMS, a SIM swap gives the attacker your phone number. Which lets them receive spam calls and pizza delivery confirmations. That's the whole prize. That's what we're going for.\"",
      debrief: scoutAction(
        "\"SMS removed from your high-value accounts. Your phone number is no longer the weak link. That's a fundamental security upgrade most people never make.\"",
        "\"Already on authenticator apps everywhere. The SIM tower was half-liberated before we started.\"",
        "\"Some accounts only support SMS. For those, the carrier PIN is your last line of defense -- which is why we did that mission first.\"",
      ),
    },
    estimatedMinutes: 15,
  },

  // ══════════════════════════════════════════════════════
  // DEVICE SECURITY -- two missions: phone + computer
  // ══════════════════════════════════════════════════════
  {
    id: "device_security-fortify-phone",
    accountId: "device_security",
    phase: "fortify",
    title: "Harden Your Phone",
    briefing: "Your phone is the most personal computer you own. It knows your location, has your messages, stores your photos, and holds the keys to every account with an authenticator app on it. Hardening it means: strong lock screen, encrypted storage, Find My enabled for remote wipe, and app permissions audited so your flashlight app isn't selling your location data.",
    steps: [
      { text: "Lock screen: iPhone → Settings → Face ID & Passcode → set a 6-digit (or alphanumeric) passcode. Android → Settings → Security → Screen Lock → set PIN (6+ digits) or password." },
      { text: "Auto-lock: iPhone → Settings → Display & Brightness → Auto-Lock → set to 1 minute. Android → Settings → Display → Screen timeout → 1 minute." },
      { text: "Notification previews: iPhone → Settings → Notifications → Show Previews → \"When Unlocked.\" Android → Settings → Notifications → Notifications on lock screen → \"Hide content.\"" },
      { text: "Find My: iPhone → Settings → [Your Name] → Find My → Find My iPhone → turn on, enable \"Send Last Location.\" Android → Settings → Security → Find My Device → turn on." },
      { text: "Encryption: Modern iPhones and Androids encrypt by default when you have a lock screen. Confirm yours is on: iPhone -- if you have a passcode, it's encrypted. Android → Settings → Security → Encryption -- should say \"Encrypted.\"" },
      { text: "Test Find My: Open icloud.com/find (iPhone) or google.com/android/find (Android) in a browser and confirm your device shows up." },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"Six steps, one device, done in ten minutes. The lock screen is obvious. The auto-lock timeout is what people miss -- a five-minute timeout means five minutes where anyone who picks up your phone walks right in. Notification previews are the other leak: someone can read your 2FA codes, your messages, and your email subjects without ever unlocking the device. And Find My is the kill switch you set up before you need it.\"",
      debrief: scoutAction(
        "\"Phone hardened. Strong lock, quick timeout, hidden previews, remote wipe ready, encryption confirmed. That's a phone that protects its owner.\"",
        "\"Already locked down. Did you check the notification previews though? That's the one most security-conscious people still have set to 'Always.'\"",
        "\"If you're securing a different primary device, the principles are the same: strong lock, fast timeout, remote wipe, encryption.\"",
      ),
    },
    estimatedMinutes: 10,
  },
  {
    id: "device_security-fortify-computer",
    accountId: "device_security",
    phase: "fortify",
    title: "Harden Your Computer",
    briefing: "Laptops get stolen from coffee shops, cars, and airports. Without full-disk encryption, a stolen laptop's hard drive can be read by plugging it into another computer -- no password needed. FileVault on Mac and BitLocker on Windows encrypt the entire disk behind your login password. If the laptop is stolen, the thief gets expensive hardware and zero data.",
    steps: [
      { text: "Mac: System Settings → Privacy & Security → scroll to FileVault → click \"Turn On FileVault\" if it's not already on. Save the recovery key somewhere safe (not on the Mac)." },
      { text: "Windows Pro/Enterprise: Search \"BitLocker\" in Start → Turn on BitLocker for your main drive. Save the recovery key to your Microsoft account or print it." },
      { text: "Windows Home: Settings → Privacy & Security → Device encryption → Turn on. (If this option doesn't appear, your hardware may not support it -- search \"Why can't I encrypt my device\" in Windows Help.)" },
      { text: "Linux: If not already using LUKS, this requires reinstalling. For now, check: run `lsblk -f` in terminal and look for \"crypto_LUKS\" on your root partition." },
      { text: "All platforms: Set your computer to require a password after sleep/screen saver. Mac → System Settings → Lock Screen → \"Require password after screen saver begins\" → Immediately. Windows → Settings → Accounts → Sign-in options → \"Require sign-in\" → When PC wakes from sleep." },
      { text: "Enable Find My: Mac → System Settings → [Your Name] → iCloud → Find My Mac → on. Windows → Settings → Privacy & Security → Find My Device → on." },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"Phones are encrypted by default. Laptops often aren't. That's a problem because laptops get left in coffee shops, stolen from cars, and forgotten at airport security. Without disk encryption, the thief doesn't need your password -- they pull the drive, plug it into another machine, and read everything. FileVault and BitLocker fix this. Five minutes now, total protection later.\"",
      debrief: scoutAction(
        "\"Computer hardened. Full-disk encryption, password on wake, remote locate enabled. A stolen laptop is now an expensive brick.\"",
        "\"Already encrypted and locked. Good -- you'd be surprised how many people with perfect account security have an unencrypted laptop.\"",
        "\"If you primarily use a phone or tablet, this can wait. But if you have a laptop with sensitive files, come back to this.\"",
      ),
    },
    estimatedMinutes: 10,
  },
  {
    id: "device_security-reclaim-app-permissions",
    accountId: "device_security",
    phase: "reclaim",
    title: "App Permission Audit",
    briefing: "Every app on your phone has asked for permissions -- camera, microphone, location, contacts, photos. Most people tap \"Allow\" during setup and never look again. The result: your calculator app knows where you live, your weather app has your contact list, and that game you played once has microphone access. Each permission is a data pipeline. Location is the worst -- apps with \"Always\" access sell your movement data to brokers who sell it to anyone.",
    steps: [
      { text: "iPhone: Settings → Privacy & Security → Location Services. Set everything to \"While Using App\" or \"Never\" except maps and ride-share apps. Note which apps had \"Always\" -- those were tracking you in the background." },
      { text: "iPhone: Same screen → Camera, Microphone, Contacts, Photos. Revoke access from any app that doesn't need it for core functionality. A shopping app doesn't need your microphone." },
      { text: "Android: Settings → Privacy → Permission Manager. Go through Location, Camera, Microphone, Contacts, Phone, SMS. Set location to \"Only while using\" for most apps." },
      { text: "Both platforms: Check \"Nearby Devices\" / \"Bluetooth\" permissions -- many apps request this for tracking, not functionality." },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"Every 'Always' location permission is an app selling your daily commute, your doctor visits, and your Friday night habits to data brokers. The Gravy Analytics breach in January 2025 proved this -- millions of people's location data leaked because apps were quietly feeding it to an aggregator that got hacked. Set everything to 'While Using' and see which apps break. The ones that break without constant location access are the ones that were monetizing it.\"",
      debrief: scoutAction(
        "\"Permissions cleaned. Fewer apps tracking your location, accessing your contacts, and listening through your microphone. Each revoked permission is a data pipeline shut off.\"",
        "\"Already minimal. You read the permission dialogs. There aren't many of you, and the data brokers hate every one of you.\"",
        "\"Even reviewing one category -- location -- is worth it when you get around to it. That's where the real damage happens.\"",
      ),
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // SCAM DEFENSE -- interactive, quiz-flavored
  // ══════════════════════════════════════════════════════
  {
    id: "scam_defense-recon-phishing-eye",
    accountId: "scam_defense",
    phase: "recon",
    title: "Train Your Phishing Eye",
    briefing: "The difference between a real security alert and a phishing email is one detail: the domain after the @. Display names lie. \"Google Security\" can be anyone. The domain is the fingerprint. Real: @accounts.google.com. Fake: @google-security-alert.com. The hard ones aren't the obvious scams -- they're the real alerts from legitimate companies that LOOK like phishing. Microsoft's real alert domain is accountprotection.microsoft.com. PayPal phishing uses paypa1.com -- that's a digit 1, not a letter L.",
    steps: [
      { text: "Open your email inbox right now. Find the most recent security-related email (password change confirmation, login alert, anything from a company about your account)." },
      { text: "Look at the FULL sender address -- not the display name, the actual email address. Click the sender name to expand it if needed. Check: does the domain after the @ match the company?" },
      { text: "Hover over any link in the email WITHOUT clicking. Read the URL that appears in the tooltip or bottom-left of your browser. Does the domain match? On mobile, long-press the link instead." },
      { text: "Memorize this rule: if the domain doesn't match, don't click. Go to the company's website directly by typing the URL yourself." },
    ],
    debriefQs: PHISHING_DEBRIEF,
    scoutDialog: {
      briefing: "\"Let's train your eye. The biggest tell in a phishing email isn't bad grammar or threats -- it's the domain. Every company sends from specific domains. Google uses accounts.google.com. Your bank uses their actual domain. Phishers use domains that look close but aren't: google-security.com, chase-verify.com, paypa1.com. One wrong character is all it takes. Once you train yourself to check the domain before anything else, you catch 90% of phishing on sight.\"",
      debrief: {
        "no-breaches": "\"Good eye. The domain check becomes automatic with practice -- two seconds, every email, and you're phishing-resistant for life.\"",
        "1-2-breaches": "\"The tricky ones are the real emails that look fake. Microsoft's actual domain -- accountprotection.microsoft.com -- sounds made up. But it's real. The skill is checking, not guessing.\"",
        "skip": "\"This one's worth coming back to. Phishing is the #1 way accounts get compromised -- not because the emails are sophisticated, but because people don't check the one detail that gives it away.\"",
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "scam_defense-fortify-tools",
    accountId: "scam_defense",
    phase: "fortify",
    title: "Set Up Your Defense Toolkit",
    briefing: "Three tools that protect you passively, plus one you use when something looks suspicious. Global Privacy Control tells every website \"do not sell my data\" -- legally enforceable under California law. Your advertising ID is the barcode that lets ad networks track you across apps -- delete it. And bookmark VirusTotal for when a link looks suspicious: paste the URL, don't click it.",
    steps: [
      { text: "Global Privacy Control -- Firefox: Settings → Privacy & Security → check \"Tell websites not to sell or share my data.\" Brave: already on by default. Chrome: install the Privacy Badger extension from the Chrome Web Store." },
      { text: "Verify GPC is working", url: "https://global-privacy-control.glitch.me/" },
      { text: "Disable advertising ID -- iPhone: Settings → Privacy & Security → Tracking → turn OFF \"Allow Apps to Request to Track.\" Android: Settings → Privacy → Ads → \"Delete advertising ID.\"" },
      { text: "Bookmark VirusTotal -- paste suspicious URLs here instead of clicking them", url: "https://www.virustotal.com/gui/home/url" },
      { text: "Bookmark Google Safe Browsing checker", url: "https://transparencyreport.google.com/safe-browsing/search" },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"Three passive defenses and one active tool, all in one mission. GPC is the rare case where a browser setting actually does something -- under California law, it's a legally binding opt-out that applies to every site you visit. The advertising ID is the barcode on your forehead that lets ad networks follow you across apps -- deleting it breaks the easiest tracking mechanism. And VirusTotal is your lab for when a link smells wrong: 70 security engines scan it so your browser doesn't have to.\"",
      debrief: scoutAction(
        "\"Defense toolkit deployed. GPC running, ad tracking disabled, link scanner bookmarked. Your daily browsing just got significantly more private, and you have a tool for when something looks suspicious.\"",
        "\"Already had the toolkit in place. You're operating at a level where the data brokers have to work much harder to track you.\"",
        "\"Even just one of these -- the advertising ID -- takes thirty seconds and cuts off a major tracking pipeline. Come back for the rest when you can.\"",
      ),
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // BORDER CROSSING -- narrative arc: prep → configure → clean
  // ══════════════════════════════════════════════════════
  {
    id: "border_prep-fortify-clean-email",
    accountId: "border_prep",
    phase: "fortify",
    title: "Create Your Clean Recovery Email",
    briefing: "If you travel internationally -- especially to countries where border agents can demand device access -- you need a clean recovery email. This is the anchor of your travel identity: a separate email account that exists solely to receive password resets for your real accounts while traveling. It's not connected to your name, phone number, or daily email. On the travel device, it looks like an ordinary empty inbox. Behind the scenes, it's your lifeline back to your real accounts.",
    steps: [
      { text: "Go to proton.me/mail and create a new free account", url: "https://proton.me/mail" },
      { text: "Use a name that is not obviously you -- initials, a common name, anything unremarkable. Do NOT use your real name." },
      { text: "Do NOT import contacts, set a profile photo, add a signature, or send any emails from it" },
      { text: "Set a strong, memorizable password -- you may need to type this from memory at your destination" },
      { text: "Write the address down on paper and store it separately from your device -- not in a note on your phone" },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"This is the keystone of your travel kit. Everything else in the border crossing sequence depends on this email existing and being clean. When you're through the border and on safe WiFi, this is how you get back into your real life. Keep it empty, keep it memorized, keep it off your phone until you need it. This is the same practice used by journalists, human rights workers, and lawyers who cross hostile borders routinely. It's legal. It's sensible. It's how professionals operate.\"",
      debrief: scoutAction(
        "\"Clean email established. That's the foundation. Next: we'll connect it to your real accounts as a backup recovery path, then prepare the travel device.\"",
        "\"Already have a clean recovery email. Smart -- you've done this drill before. Make sure it's still clean: no sent emails, no contacts, no connection to your real identity.\"",
        "\"If you don't cross borders where device searches happen, this mission can wait. But if your travel plans change, the time to prepare is before the trip, not at the airport.\"",
      ),
    },
    estimatedMinutes: 8,
  },
  {
    id: "border_prep-fortify-recovery-path",
    accountId: "border_prep",
    phase: "fortify",
    title: "Wire the Recovery Path",
    briefing: "Now connect the clean email to your real accounts as a backup recovery method. This is the bridge: your real accounts gain a recovery path through the clean email, so when you're safely through the border, you can reset your way back in. Important: test the recovery flow before you travel. Reset one account's password through the clean email to confirm it works. Don't discover a problem at the airport.",
    steps: [
      { text: "Google: myaccount.google.com/security → scroll to \"Ways we can verify it's you\" → add the clean email as a recovery email', url: 'https://myaccount.google.com/security" },
      { text: "Apple: account.apple.com → Sign-In and Security → add the clean email as a notification/recovery contact", url: "https://account.apple.com/account/manage" },
      { text: "Microsoft: account.live.com/proofs/manage → add the clean email as an alternate email", url: "https://account.live.com/proofs/manage" },
      { text: "Test it: sign out of ONE account, then recover it using \"Forgot password\" with the clean email. Confirm the reset email arrives and works. Then change the password back." },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"This is the wiring that makes the clean email useful. Without this step, the clean email is just an empty inbox. With it, it's a master key to your real accounts -- one that exists off-device, in your memory, invisible to a border search. The test step is not optional. If you skip it and the recovery flow doesn't work, you'll find out at your destination with no way to access your accounts.\"",
      debrief: scoutAction(
        "\"Recovery path wired and tested. Your real accounts are now recoverable through the clean email. The bridge is built.\"",
        "\"Already configured. Did you test the flow recently? Recovery methods can change when providers update their security settings.\"",
        "\"If you're not traveling soon, you can set this up before your next trip. Just leave enough time to test before departure.\"",
      ),
    },
    estimatedMinutes: 12,
  },
  {
    id: "border_prep-reclaim-travel-device",
    accountId: "border_prep",
    phase: "reclaim",
    title: "Prepare the Travel Device",
    briefing: "The final step: make your travel device clean. Log out of every real account, clear the browser, remove traces that connect the device to your real identity. When you're done, a border agent who searches the phone sees: a device with a few social accounts, an empty email inbox, and nothing interesting. Your real accounts are logged out, recoverable from a safe location through the clean email, and invisible to inspection.",
    steps: [
      { text: "Log out of ALL real accounts -- email, social media, banking, everything. On iPhone: Settings → [Your Name] → scroll down to see signed-in apps. On Android: Settings → Accounts." },
      { text: "Clear browser: Safari → Settings → Clear History and Website Data. Chrome → Settings → Privacy → Clear browsing data (all time, everything). Make sure saved passwords are cleared too." },
      { text: "Check Photos for screenshots of recovery codes, QR codes, or account settings. Delete them (and empty the Recently Deleted folder)." },
      { text: "Check Notes/Keep for passwords, account lists, or recovery codes. Delete them." },
      { text: "If you have a password manager on the device: either remove it entirely, or create a separate vault with only clean account credentials." },
      { text: "Final check: imagine a stranger methodically going through every app on this phone. Is there anything that reveals your real accounts or their connection to the clean email?" },
    ],
    debriefQs: ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"This is the part people mess up. They do all the account work and then leave breadcrumbs everywhere -- a password reset email in the clean inbox, a screenshot of a 2FA QR code in Photos, a note titled 'passwords' in Notes. A forensic examiner finds those in minutes. Your clean device needs to tell a consistent story, and that story is: ordinary person with minimal digital life. Not: person who carefully hid their real digital life three hours ago.\"",
      debrief: scoutAction(
        "\"Travel device clean. A border search sees a phone that tells a boring, consistent story. Your real life is recoverable from the other side. That's operational security.\"",
        "\"Already prepped. You know this drill. Safe travels.\"",
        "\"If you're not crossing a border soon, file this away. But when the trip comes, give yourself a full evening to do this properly -- not the morning of the flight.\"",
      ),
    },
    estimatedMinutes: 15,
  },
];
