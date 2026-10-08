// ══════════════════════════════════════════════════════
// CHAPTER 12: THE TRAIL
// Passive data you leave behind just by existing.
// Photos, loyalty cards, payment records, browser fingerprints.
// ══════════════════════════════════════════════════════

const TRAIL_DEBRIEF = [
  {
    id: "action",
    label: "Did you complete this step?",
    options: [
      { value: "completed", text: "Done", severity: "safe" },
      { value: "already-done", text: "Already had this in place", severity: "safe" },
      { value: "not-applicable", text: "Doesn't apply to me", severity: "safe" },
      { value: "later", text: "I'll come back to this", severity: "skip" },
    ],
  },
];

const AUDIT_DEBRIEF = [
  {
    id: "finding",
    label: "What did you find?",
    options: [
      { value: "no-breaches", text: "Nothing concerning", severity: "safe" },
      { value: "1-2-breaches", text: "Found some exposure I didn't expect", severity: "warn" },
      { value: "3plus-breaches", text: "Significant exposure", severity: "crit" },
      { value: "skip", text: "I'll come back to this", severity: "skip" },
    ],
  },
];

function scoutTrail(completed, alreadyDone, na) {
  return {
    "completed": completed,
    "already-done": alreadyDone,
    "not-applicable": na,
    "later": "\"No rush. The trail isn't going anywhere -- that's kind of the whole problem.\"",
  };
}

// Plaid connections (recon audit #92): the Plaid Portal shows them now, so
// the answer is about them. A new question id; an old save's finding still
// shows (question.legacy).
const PLAID_DEBRIEF = [
  {
    id: "plaid_connections",
    label: "What did the Plaid Portal show?",
    legacy: AUDIT_DEBRIEF[0],
    options: [
      { value: "none", text: "No connections", severity: "safe" },
      { value: "disconnected", text: "Found old connections and disconnected them", severity: "safe" },
      { value: "many", text: "Lots of connections, including apps I forgot", severity: "warn" },
      { value: "skip", text: "I'll come back to this", severity: "skip" },
    ],
  },
];

export const TRAIL_MISSIONS = [

  // ══════════════════════════════════════════════════════
  // PHOTO METADATA
  // ══════════════════════════════════════════════════════
  {
    id: "photo_metadata-recon-check",
    accountId: "photo_metadata",
    phase: "recon",
    title: "Check What Your Photos Reveal",
    briefing: "Every photo your phone takes embeds invisible metadata called EXIF data: the GPS coordinates where the photo was taken, the exact date and time, your device model, and camera settings. One photo of your living room reveals your home address. One photo at a coffee shop reveals your daily routine. Most people have thousands of geotagged photos in their camera roll right now, and many have been shared without stripping this data.",
    steps: [
      { text: "iPhone: Open the Photos app, pick any recent photo, tap the (i) info button at the bottom. You'll see a map showing exactly where the photo was taken, the date, time, and camera details." },
      { text: "Android: Open Google Photos, pick a photo, swipe up or tap the three-dot menu > Details. Look for the Location section and the map pin." },
      { text: "Desktop: Right-click any photo file > Properties (Windows) or Get Info (Mac). On Windows, go to the Details tab and look for GPS Latitude/Longitude. On Mac, click 'More Info' in the Inspector." },
      { text: "Notice how precise the GPS is -- it's usually accurate to within a few meters. That's your home, your workplace, your gym, your therapist's office." },
    ],
    debriefQs: AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Most people don't know their photos are broadcasting their location. Not approximately -- precisely. GPS coordinates accurate to a few meters, embedded in every shot. When you text someone a photo, email it, or upload it to a forum that doesn't strip EXIF, you're handing them a pin on a map. Domestic violence survivors have been found through a single photo's metadata. That's how real this is.\"",
      debrief: {
        "no-breaches": "\"Good to know. Now that you've seen it, you can't unsee it -- and that awareness is the first defense.\"",
        "1-2-breaches": "\"Seeing the GPS data on your own photos is a wake-up call. The next mission lets you shut it off.\"",
        "3plus-breaches": "\"Thousands of geotagged photos. That's a complete location history of your life. Let's stop the bleeding.\"",
        "skip": "\"When you're ready. Just checking one photo takes thirty seconds and changes how you think about sharing.\"",
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "photo_metadata-fortify-strip",
    accountId: "photo_metadata",
    phase: "fortify",
    title: "Strip Metadata Before Sharing",
    briefing: "The fix has two parts: stop embedding location in new photos, and know which sharing methods strip metadata from existing ones. Some platforms (Twitter, Facebook, Instagram) strip EXIF on upload. Others (email, iMessage, Telegram, cloud shares, forums) don't. The safest move is to turn off location tagging at the camera level.",
    steps: [
      { text: "iPhone: Settings > Privacy & Security > Location Services > Camera > set to 'Never'. This stops new photos from getting GPS coordinates." },
      { text: "Android: Open your Camera app > Settings (gear icon) > look for 'Location tags,' 'Save location,' or 'Geo tag' > turn it OFF. The setting name varies by manufacturer." },
      { text: "For photos you've already taken: if you share via Twitter, Facebook, or Instagram, they strip EXIF automatically. If you share via email, text message, or cloud link (Google Drive, Dropbox) -- the EXIF travels with the file." },
      { text: "To strip EXIF from specific photos before sharing: iPhone > select photo > Share > Options (at the top) > turn off Location. Android > use a free EXIF remover app, or share via a platform that strips it." },
    ],
    debriefQs: TRAIL_DEBRIEF,
    scoutDialog: {
      briefing: "\"Two minutes in your camera settings and every future photo stops broadcasting your coordinates. For existing photos, the rule is simple: social media platforms strip EXIF because they want to own your location data themselves. Email, messaging apps, and cloud links pass it through raw. If you're sharing a photo with someone you don't fully trust, send it through a platform that strips, not through a channel that doesn't.\"",
      debrief: scoutTrail(
        "\"Camera location off. Every photo from here on is just a photo -- no GPS, no map pin, no trail. Simple change, permanent effect.\"",
        "\"Already had location tagging off. You're ahead of most people. The sharing awareness is the part that matters now -- knowing which channels strip and which don't.\"",
        "\"If you don't take photos or share them digitally, this one can wait. But if you ever do, come back -- it's a two-minute fix.\"",
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: "photo_metadata-reclaim-location-history",
    accountId: "photo_metadata",
    phase: "reclaim",
    title: "Audit Your Cloud Photo Location History",
    briefing: "Google Photos and Apple Photos both build a complete location map from your photo library. Every geotagged photo becomes a pin on a map that shows everywhere you've been, on what date, for years. This is a more detailed location history than most people realize they've created -- and it's accessible to anyone who gets into your cloud account.",
    steps: [
      { text: 'Google Photos: search for your town or neighborhood. Every photo that comes up was tagged with a place. Notice how many are tagged at home.' },
      { text: "Apple Photos: Open the Photos app on Mac or iPhone > Albums > Places. This is the same thing -- a map of everywhere your photos were taken." },
      { text: "Consider: would you want someone who got into your Google or Apple account to see this map? This is why the Master Keys district comes first -- your email account protects this data." },
      { text: "Google Photos: Settings > Sharing > check that partner sharing and shared libraries aren't exposing location data to people you didn't intend.", url: "https://photos.google.com/settings" },
    ],
    debriefQs: AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Most people don't know this map exists. Open it and look at it. Every pin is a moment in your life -- your home, your workplace, your vacations, your doctor's visits, places you went with people you may no longer want to be associated with. Google and Apple built this automatically from your geotagged photos. It's beautiful and it's terrifying. The question isn't whether to delete it -- it's whether you realized it was there.\"",
      debrief: {
        "no-breaches": "\"Clean map or minimal pins. Either you've been careful about geotagging or you don't take many photos. Either way, good position.\"",
        "1-2-breaches": "\"Seeing the map for the first time is unsettling. The good news: you turned off location tagging in the last mission, so no new pins are being added.\"",
        "3plus-breaches": "\"Years of location data, all in one map. That's the real cost of default-on geotagging. You've stopped the bleed -- the existing data is a risk you now know about and can manage.\"",
        "skip": "\"This one's just looking. No changes to make, just awareness. Worth the two minutes when you have them.\"",
      },
    },
    estimatedMinutes: 5,
  },

  // ══════════════════════════════════════════════════════
  // LOYALTY PROGRAMS
  // ══════════════════════════════════════════════════════
  {
    id: "loyalty_programs-recon-audit",
    accountId: "loyalty_programs",
    phase: "recon",
    title: "Audit Your Loyalty Cards",
    briefing: "Every loyalty card, rewards program, and store membership is a data pipeline. Your drugstore knows your prescriptions. Your grocery store knows your diet. Your airline knows your travel patterns. Your coffee shop knows your daily schedule. Each company sells this data to brokers, advertisers, and in some cases insurance companies. The 'discount' is the price of your data -- and it's usually worth far more to them than the 50 cents you saved on toothpaste.",
    steps: [
      { text: "Make a list of every loyalty/rewards program you're enrolled in. Check your wallet (physical cards), your phone (Apple Wallet, Google Pay, store apps), and your email (search for 'rewards,' 'points,' 'member')." },
      { text: "Common ones people forget: drugstore (CVS ExtraCare, Walgreens myWalgreens), grocery (Kroger Plus, Safeway Club, Costco), gas stations, airline miles, hotel points, coffee (Starbucks Rewards), retail (Target Circle, Best Buy, Sephora)." },
      { text: "For each one, consider: when did you last actually use the rewards? Is the discount worth the data they're collecting?" },
    ],
    debriefQs: AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: "\"The loyalty card is one of the most successful surveillance tools ever invented, and it doesn't even pretend to be something else. You knowingly trade a record of every purchase for a small discount. The difference between this and a data broker is that you opted in -- but you probably didn't opt in to your grocery purchase history being sold to your health insurance company to adjust your premiums. That part wasn't on the sign-up form.\"",
      debrief: {
        "no-breaches": "\"Few loyalty cards. Less data flowing to brokers. That's a surprisingly strong privacy position in a world that puts a loyalty program on everything.\"",
        "1-2-breaches": "\"A handful of loyalty programs. Each one is a data feed. The next mission helps you turn off what you can.\"",
        "3plus-breaches": "\"That's a lot of purchase data flowing to a lot of companies. Don't feel bad -- they're designed to be easy to join and hard to notice. Now you notice.\"",
        "skip": "\"When you're ready. The wallet check takes five minutes and the list is usually longer than people expect.\"",
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "loyalty_programs-fortify-optout",
    accountId: "loyalty_programs",
    phase: "fortify",
    title: "Opt Out of Loyalty Data Selling",
    briefing: "Most loyalty programs have a privacy settings page where you can opt out of data sharing with third parties. The setting exists because of CCPA and state privacy laws -- they're legally required to let you opt out of data sale. But they bury it. This mission walks you through the major ones.",
    steps: [
      { text: "CVS ExtraCare: Log into CVS.com > Account Settings > Privacy Preferences > opt out of 'sharing for marketing purposes' and 'sharing for analytics'", url: "https://www.cvs.com/account/compliance/do-not-sell" },
      { text: 'Kroger (and subsidiaries -- Ralphs, Fred Meyer, Harris Teeter, etc.): in your kroger.com account, review communication preferences. For a data deletion request, use the rights section of its privacy policy.', url: 'https://www.kroger.com/i/privacy-policy' },
      { text: 'Target Circle: sign in to target.com → Account and review its privacy and advertising settings.', url: 'https://www.target.com/account' },
      { text: "Starbucks: Open the Starbucks app > Account > Privacy Settings. Or visit starbucks.com privacy page.", url: "https://www.starbucks.com/terms/privacy-policy/" },
      { text: "For any loyalty program not listed: search '[company name] do not sell my personal information' -- CCPA requires a page with this exact language." },
    ],
    debriefQs: TRAIL_DEBRIEF,
    scoutDialog: {
      briefing: "\"Every one of these companies has a 'Do Not Sell My Personal Information' page, because California law requires it. Most of them made it hard to find on purpose. The pattern is always the same: log in, find Privacy or Account Settings, look for the opt-out toggle. They're counting on you not looking. Today you look.\"",
      debrief: scoutTrail(
        "\"Opt-outs submitted. The data that's already been sold is gone, but the pipeline from new purchases is narrower now. They'll keep collecting -- they just can't resell it as freely.\"",
        "\"Already opted out. You found the hidden settings page. That puts you in a very small minority.\"",
        "\"If you don't have these specific programs, search for the ones you do have. The 'do not sell' page exists for all of them.\"",
      ),
    },
    estimatedMinutes: 12,
  },
  {
    id: "loyalty_programs-reclaim-delete",
    accountId: "loyalty_programs",
    phase: "reclaim",
    title: "Delete Unused Loyalty Accounts",
    briefing: "The most effective privacy move is the simplest: close accounts you don't use. Every dormant loyalty account is a database entry that can be breached, sold, or subpoenaed. If you haven't used a rewards program in a year, the points aren't worth the data exposure. Close it. The data already collected stays in their systems, but no new data flows in.",
    steps: [
      { text: "Go through your loyalty program list from the audit mission. For each one you haven't used in 6+ months, log in and look for 'Delete Account,' 'Close Account,' or 'Deactivate.'" },
      { text: "If there's no obvious delete option: search '[company name] delete my account' or email their privacy team at privacy@[company].com with a CCPA deletion request." },
      { text: "Before deleting: redeem any points or rewards you've accumulated. They disappear with the account." },
      { text: "After deleting: unsubscribe from their emails and remove any physical cards from your wallet or phone." },
    ],
    debriefQs: TRAIL_DEBRIEF,
    scoutDialog: {
      briefing: "\"Every account you don't use is a liability, not an asset. It's a database with your name, address, purchase history, and payment method that you're not monitoring. When that company gets breached -- and statistically, they will -- your data is in the pile. Closing unused accounts is the cheapest, most effective privacy action you can take. The points you'll lose are worth less than you think.\"",
      debrief: scoutTrail(
        "\"Accounts closed. Fewer databases with your data, fewer breach notifications in your future. Each closed account is an attack surface that no longer exists.\"",
        "\"Already lean. You don't keep accounts you don't use. That discipline is rare and valuable.\"",
        "\"If you actively use all your loyalty programs, that's fine. The risk is the forgotten ones -- the gas station card from 2019, the hotel program from a trip you barely remember.\"",
      ),
    },
    estimatedMinutes: 15,
  },

  // ══════════════════════════════════════════════════════
  // PAYMENT TRAIL
  // ══════════════════════════════════════════════════════
  {
    id: "payment_trail-recon-plaid",
    accountId: "payment_trail",
    phase: "recon",
    title: "Review Your Plaid Connections",
    briefing: "If you've ever connected a bank account to an app -- Venmo, Robinhood, Coinbase, Mint, YNAB, or any budgeting tool -- you probably used Plaid. Plaid is the middleman that logs into your bank on your behalf. Plaid was sued for allegedly collecting more transaction data than users authorized, and settled for $58 million (announced in 2021 and approved in 2022). The Plaid Portal shows which apps you've connected, and lets you disconnect them.",
    steps: [
      { text: 'Open the Plaid Portal and sign in with your phone number. It lists every app you’ve connected through Plaid', url: 'https://my.plaid.com' },
      { text: 'Disconnect apps you no longer use' },
      { text: 'To get a full copy of your data, use Plaid’s data request form. It takes a while', url: 'https://my.plaid.com/data-subject-request-form' },
    ],
    debriefQs: PLAID_DEBRIEF,
    scoutDialog: {
      briefing: "\"Plaid settled a class action for $58 million over claims it took more transaction data than users consented to. Every time you 'connected your bank account' to an app, Plaid logged in as you and downloaded your full transaction history -- not just the data the app needed. Your rent payments, your medical bills, your donations, your bar tabs. All of it in Plaid's database. The Portal shows your connections in a couple of minutes.\"",
      debrief: {
        "none": "\"No connections. Fewer copies of your bank history out there.\"",
        "disconnected": "\"Old connections cut. The budgeting app you tried once doesn't need your bank anymore.\"",
        "many": "\"Lots of connections. Disconnect the ones you don't use when you can.\"",
        "no-breaches": "\"No Plaid connections, or nothing concerning. That's unusual -- most people have at least one app that used Plaid without their knowledge.\"",
        "1-2-breaches": "\"Found some connections you forgot about. Common. The budgeting app you tried for a month in 2021 still has access to your transaction history through Plaid.\"",
        "3plus-breaches": "\"Multiple Plaid connections. Each one has your full bank transaction history. Submitting the deletion request is the right move.\"",
        "skip": "\"When you're ready. The data access request alone is worth doing -- seeing what Plaid has on you changes your relationship with 'connect your bank' buttons.\"",
      },
    },
    estimatedMinutes: 5,
  },
  {
    id: "payment_trail-fortify-bnpl",
    accountId: "payment_trail",
    phase: "fortify",
    title: "Audit Buy Now, Pay Later Accounts",
    briefing: "Affirm, Klarna, Afterpay, and Zip report to credit bureaus and share transaction data with marketing partners. Each one is a financial account you may have opened for a single purchase and forgotten about. Unlike credit cards, BNPL accounts are often opened at checkout with minimal friction -- which means you may have more than you realize, each reporting to different credit bureaus.",
    steps: [
      { text: "Search your email for 'Affirm,' 'Klarna,' 'Afterpay,' 'Zip,' 'Sezzle,' 'PayPal Pay Later.' Each result is a BNPL account that exists in your name." },
      { text: "For each one found: log in and check for outstanding balances. Pay off and close any you don't actively use." },
      { text: "Affirm: app or affirm.com > Account > scroll to 'Close Account'", url: "https://www.affirm.com/account" },
      { text: "Klarna: app > Profile > Settings > 'Delete my Klarna data'", url: "https://app.klarna.com/settings" },
      { text: "Afterpay: app > Account > Settings > 'Close Account'" },
    ],
    debriefQs: TRAIL_DEBRIEF,
    scoutDialog: {
      briefing: "\"Buy Now Pay Later is the financial product designed to feel like it isn't one. One click at checkout, and you've opened a credit account that reports to bureaus, shares your purchase data with marketing partners, and stays open indefinitely. Most people who've shopped online in the last three years have at least one BNPL account they forgot about. Each one is a financial record with your name on it, and each one feeds the data economy.\"",
      debrief: scoutTrail(
        "\"BNPL accounts audited and cleaned up. Fewer open financial accounts, fewer data feeds, cleaner credit report.\"",
        "\"Already on top of your BNPL. That's financial hygiene most people never think about.\"",
        "\"If you've never used BNPL, you're in the clear. If you're not sure, the email search takes thirty seconds.\"",
      ),
    },
    estimatedMinutes: 10,
  },
  {
    id: "payment_trail-reclaim-card-sharing",
    accountId: "payment_trail",
    phase: "reclaim",
    title: "Review Credit Card Data Sharing",
    briefing: "Visa and Mastercard sell aggregated transaction data to marketers and analytics firms. Your card issuer (Chase, Citi, Amex, etc.) also has its own data-sharing agreements. The aggregated data is supposedly anonymized, but researchers have repeatedly shown that credit card transaction records can be de-anonymized with just a few data points -- the store, the date, and the amount are often enough to identify a specific person.",
    steps: [
      { text: 'Chase: sign in and review the privacy and marketing preferences in your profile settings to opt out of sharing for marketing' },
      { text: "Capital One: Log in > Settings > Privacy > 'Limit sharing of personal information'", url: "https://www.capitalone.com/privacy/" },
      { text: "American Express: Log in > Account Services > Privacy > opt out of 'sharing information with Amex business partners'", url: "https://global.americanexpress.com/privacy/opt-out" },
      { text: "Bank of America: Log in > Profile & Settings > Privacy > 'Manage your ad choices'", url: "https://www.bankofamerica.com/privacy/consumer-privacy-notice.go" },
      { text: "For any card not listed: search '[your card issuer] privacy opt out' or call the number on the back of your card and ask for their privacy department." },
    ],
    debriefQs: TRAIL_DEBRIEF,
    scoutDialog: {
      briefing: "\"Researchers at MIT showed that just four transaction data points -- four purchases -- are enough to uniquely identify a person in an 'anonymized' credit card dataset. The store, the date, and the amount. That's it. Visa and Mastercard sell this data because it's worth billions. Your card issuer has its own sharing agreements on top of that. The opt-outs don't stop the aggregation at the network level, but they limit what your specific issuer can sell about you.\"",
      debrief: scoutTrail(
        "\"Card data sharing dialed back. You can't stop Visa from aggregating, but your issuer's own sharing is now limited. Every opt-out narrows the data pipeline.\"",
        "\"Already opted out. You found the privacy settings your bank hoped you wouldn't look for.\"",
        "\"If you primarily use cash or crypto, the card data trail is minimal. But most people have at least one card worth checking.\"",
      ),
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // BROWSER FINGERPRINT
  // ══════════════════════════════════════════════════════
  {
    id: "browser_fingerprint-recon-test",
    accountId: "browser_fingerprint",
    phase: "recon",
    title: "Test Your Browser Fingerprint",
    briefing: "Cookies are yesterday's tracking. Browser fingerprinting is the technique that identifies you without storing anything on your device. Your browser's exact configuration -- screen resolution, installed fonts, WebGL renderer, timezone, language, plugins, canvas rendering -- creates a fingerprint that is unique among millions. In EFF’s 2010 study, 83% of browsers were unique. Private browsing mode doesn't help, because the fingerprint is your browser's configuration, not its stored data.",
    steps: [
      { text: "Open EFF's Cover Your Tracks tool (formerly Panopticlick)", url: "https://coveryourtracks.eff.org/" },
      { text: "Click 'Test Your Browser' and wait for the results. It will tell you how unique your browser fingerprint is." },
      { text: "Read the results: if it says your browser is unique among the tested browsers, that means trackers can identify you specifically -- without any cookies." },
      { text: "Try it in a private/incognito window too. Notice that the fingerprint is nearly identical -- private browsing doesn't change your browser's configuration." },
    ],
    debriefQs: AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Cookies are the tracking method you know about. Fingerprinting is the one you don't. Your browser leaks dozens of configuration details to every website you visit: your screen resolution, your operating system, your installed fonts, how your graphics card renders a specific image. Combined, these details are unique to you. The EFF built Cover Your Tracks to show you how identifiable you are. Most people are unique among hundreds of thousands. Some are unique among millions. Go look.\"",
      debrief: {
        "no-breaches": "\"Your browser has some protection against fingerprinting. That's unusual and means you're either using Firefox with resist-fingerprinting or Brave or Tor. Good.\"",
        "1-2-breaches": "\"Partially unique. Some details identify you, but your browser has some randomization built in. The next mission hardens what's left.\"",
        "3plus-breaches": "\"Fully unique fingerprint. Every website you visit can identify you specifically, with no cookies needed. That's what we're fixing.\"",
        "skip": "\"The test takes sixty seconds. It's worth seeing before you decide whether to act on it.\"",
      },
    },
    estimatedMinutes: 3,
  },
  {
    id: "browser_fingerprint-fortify-harden",
    accountId: "browser_fingerprint",
    phase: "fortify",
    title: "Harden Your Browser",
    briefing: "Firefox is the best mainstream browser for fingerprinting resistance because Mozilla actively works to make Firefox users look similar to each other. Enhanced Tracking Protection in Strict mode blocks known fingerprinters. The 'resist fingerprinting' flag goes further, lying to websites about your timezone, fonts, and screen size. uBlock Origin blocks the scripts that do the fingerprinting before they run.",
    steps: [
      { text: "Firefox: Settings > Privacy & Security > Enhanced Tracking Protection > select 'Strict'. This blocks known fingerprinting scripts and cross-site cookies.", url: "about:preferences#privacy" },
      { text: "Firefox advanced: In the address bar, type about:config > search 'privacy.resistFingerprinting' > set to true. This makes Firefox report generic values for timezone, screen size, and fonts." },
      { text: "Install uBlock Origin: the most effective content blocker. It blocks tracking scripts before they can fingerprint you.", url: "https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/" },
      { text: "Mobile: On iPhone, use Firefox Focus or Safari (which has built-in fingerprinting protection). On Android, Firefox or Brave both have fingerprinting resistance." },
      { text: "Re-test at coveryourtracks.eff.org after making changes to see the difference.", url: "https://coveryourtracks.eff.org/" },
    ],
    debriefQs: TRAIL_DEBRIEF,
    scoutDialog: {
      briefing: "\"Firefox is the answer here, and it's not close. Chrome is made by an advertising company -- Google's business model depends on tracking you. Firefox is made by a nonprofit whose mission is internet privacy. The 'resist fingerprinting' flag is the nuclear option: Firefox starts lying to websites about your configuration, making you look like every other Firefox user. The trade-off is that some websites may look slightly different (wrong timezone display, standardized fonts). It's a small price for disappearing from the fingerprinting system.\"",
      debrief: scoutTrail(
        "\"Browser hardened. You're now significantly harder to fingerprint. Re-test with Cover Your Tracks to see the improvement -- most people go from 'unique' to 'not unique.'\"",
        "\"Already hardened. You're running a privacy-focused setup. The fingerprinters have to work much harder to track you, and most won't bother.\"",
        "\"If you can't switch browsers right now, just installing uBlock Origin on whatever you use is still a major improvement.\"",
      ),
    },
    estimatedMinutes: 10,
  },
  {
    id: "browser_fingerprint-reclaim-dns",
    accountId: "browser_fingerprint",
    phase: "reclaim",
    title: "Encrypt Your DNS Lookups",
    briefing: "Every time you visit a website, your browser asks a DNS server to translate the domain name (google.com) into an IP address. By default, this request goes to your ISP in plain text -- which means your ISP has a complete log of every website you've visited. In 2017, Congress repealed FCC rules that would have required ISPs to get your permission before selling browsing history. Encrypted DNS (DNS over HTTPS or DNS over TLS) sends these requests through an encrypted channel to a DNS provider you chose. Your ISP still sees which servers you connect to. Typing different DNS server numbers into your settings is not the same thing: it changes who answers, not who can see.",
    steps: [
      { text: 'iPhone: install Cloudflare’s 1.1.1.1 app, which encrypts lookups on Wi-Fi and cellular. Typing 1.1.1.1 and 1.0.0.1 (or Quad9’s 9.9.9.9 and 149.112.112.112) into Settings > Wi-Fi > (i) > Configure DNS changes who answers, not who can see: those lookups stay unencrypted', url: 'https://one.one.one.one/' },
      { text: 'Android: Settings > Network & Internet > Advanced > Private DNS > enter \'one.one.one.one\' (Cloudflare) or \'dns.quad9.net\' (Quad9). This one is encrypted.' },
      { text: 'Mac: the 1.1.1.1 app (Cloudflare WARP) encrypts lookups for the whole Mac. Adding 1.1.1.1 and 9.9.9.9 under System Settings > Network > Details > DNS changes who answers, not who can see.' },
      { text: 'Windows 11: Settings > Network & Internet > your connection > DNS server assignment > Manual > enter 1.1.1.1 (Preferred) and 9.9.9.9 (Alternate), and set DNS over HTTPS to On. Without that setting (and on Windows 10) it\'s a plain change of who answers, not who can see.' },
      { text: 'Firefox: Settings > Privacy & Security > scroll to bottom > DNS over HTTPS > select \'Max Protection\' and choose Cloudflare or NextDNS. Chrome: Settings > Privacy and security > Security > Use secure DNS.', url: 'about:preferences#privacy' },
    ],
    debriefQs: TRAIL_DEBRIEF,
    scoutDialog: {
      briefing: "\"In 2017, Congress repealed the rules that would have made ISPs ask before selling your browsing history. Your ISP sees every site name you look up because DNS requests are sent in plain text by default. That's a complete list of every website you've loaded, timestamped, attached to your account. Encrypted DNS puts those lookups in an envelope instead of on a postcard. Your ISP still sees which servers you connect to, so it's an envelope, not a disguise.\"",
      debrief: scoutTrail(
        "\"Done. Where you turned on encrypted DNS, your ISP can't read your lookups. It can still see which servers you connect to, so this is one layer of several.\"",
        "\"Already encrypted. You were ahead of this one.\"",
        "\"If you can't change your DNS right now, the Firefox setting is the easiest -- it only applies to Firefox but it takes thirty seconds.\"",
      ),
    },
    estimatedMinutes: 8,
  },
];
