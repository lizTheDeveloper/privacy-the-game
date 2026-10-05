// ══════════════════════════════════════════════════════════════════
// OSINT SIEVE — "Bet You Can't Find Me"
// Self-assessment missions where players check their own exposure
// against real OSINT investigator techniques. Each mission is one
// lens an investigator would use. The Perimeter district.
// ══════════════════════════════════════════════════════════════════

const OSINT_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-exposure', text: 'Nothing concerning — I\'m well hidden', severity: 'safe' },
      { value: 'some-exposure', text: 'Found some exposure — fixing it now', severity: 'warn' },
      { value: 'significant-exposure', text: 'Found significant exposure — need to clean up', severity: 'crit' },
      { value: 'skip', text: "Will check later", severity: 'skip' },
    ],
  },
];

export const OSINT_SIEVE_MISSIONS = [
  // ══════════════════════════════════════════════════════
  // 1. PHOTO INTELLIGENCE
  // ══════════════════════════════════════════════════════
  {
    id: 'osint-sieve-photo-intel',
    accountId: 'device_security',
    phase: 'fortify',
    title: 'OSINT Sieve: Photo Intelligence',
    briefing: "An OSINT investigator starts with your photos. They reverse-image-search your profile picture to find every platform you're on. They zoom into backgrounds looking for house numbers, street signs, license plates, and reflections. They run your landscape photos through AI geolocation tools that can pinpoint a location from a single image. They check if your photos still have EXIF metadata with GPS coordinates baked in. Let's see what they'd find.",
    steps: [
      { text: "Reverse image search your main profile photo — drag it into Google Images and see where else it appears", url: "https://images.google.com/" },
      { text: "Now try Yandex — it's better at matching faces across platforms", url: "https://yandex.com/images/" },
      { text: "Pick 5-10 of your most recent social media photos. Zoom in on the background of each one. Can you see: house numbers? Street signs? Store names? License plates? School names?" },
      { text: "Check reflections — mirrors, windows, sunglasses, car paint, phone screens. What do they reveal about your location or surroundings?" },
      { text: "If you've shared photos on blogs, forums, or messaging apps (not just social media), check if they still have EXIF data: upload one to an EXIF viewer", url: "https://exif.tools/" },
      { text: "Try uploading a landscape/outdoor photo you've posted to an AI geolocation tool — can it guess where you were?", url: "https://geospy.ai/" },
    ],
    debriefQs: OSINT_DEBRIEF,
    scoutDialog: {
      briefing: "\"An investigator doesn't need your address. They need one photo with a street sign, one reflection showing your apartment building, one landscape shot that AI can geolocate. That's three data points to your front door. Let's see what your photos give away.\"",
      debrief: {
        'no-exposure': "\"Clean photos. No background leaks, no EXIF data, profile pic doesn't cross-link. That's rare — well done.\"",
        'some-exposure': "\"Found some leaks. The good news is you can crop, re-upload, or remove the worst ones. Fix the profile photo cross-linking first — that's the front door.\"",
        'significant-exposure': "\"Significant exposure. Your photos are telling a story you didn't mean to tell. Start with the profile picture — if it links your accounts, everything else follows.\"",
        'skip': "\"This one's worth doing. Your photos are the first thing an investigator looks at.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // ══════════════════════════════════════════════════════
  // 2. BEHAVIORAL PATTERNS
  // ══════════════════════════════════════════════════════
  {
    id: 'osint-sieve-behavioral',
    accountId: 'device_security',
    phase: 'fortify',
    title: 'OSINT Sieve: Behavioral Patterns',
    briefing: "Your posting habits reveal your life's rhythm. An investigator looks at WHEN you post to determine your timezone and daily routine — morning posts reveal when you wake up, gaps reveal your work hours, late-night posts show when you sleep. They look at WHERE you post from — the same café tagged three times a week, the gym selfie with the gym name visible, the office building in the background of your lunch photo. Repeated locations build a map of your daily life. Let's see what pattern your posts paint.",
    steps: [
      { text: "Open your most active social media account. Look at your last 20 posts. What times were they posted? Do they reveal your timezone? Your work schedule? When you sleep?" },
      { text: "Check location tags and check-ins from the last 6 months. Do any locations repeat? Your gym, your coffee shop, your office, your kids' school?" },
      { text: "Look at gym selfies or workout posts. Is the gym name or location visible? Your regular workout time?" },
      { text: "Search your posts for food/restaurant photos. Do they reveal your neighborhood or regular spots?" },
      { text: "Check commute-related posts — traffic complaints, transit photos, 'heading to work' stories. Do they reveal your route?" },
      { text: "Look at weekend vs. weekday posting patterns. Can someone tell when you're home vs. away?" },
    ],
    debriefQs: OSINT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Your gym selfie shows the gym name and your regular 6am time slot. Your Tuesday lunch photo is always from the same café two blocks from work. Your stories go quiet from 9-5 on weekdays. An investigator just built your weekly schedule without you telling them anything. Check your patterns.\"",
      debrief: {
        'no-exposure': "\"No detectable patterns. You either post irregularly or you're careful about timing. Either way, good.\"",
        'some-exposure': "\"Some patterns visible. The gym and café spots are the easiest to fix — stop tagging those locations. Posting times are harder, but you can use scheduling tools.\"",
        'significant-exposure': "\"Your posts are a daily planner. An investigator knows your gym, your coffee shop, your work hours, and your commute. Start by removing location tags from regular spots.\"",
        'skip': "\"Come back when you can spend 15 minutes scrolling your own posts with fresh eyes.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // ══════════════════════════════════════════════════════
  // 3. SOCIAL GRAPH EXPOSURE
  // ══════════════════════════════════════════════════════
  {
    id: 'osint-sieve-social-graph',
    accountId: 'device_security',
    phase: 'fortify',
    title: 'OSINT Sieve: Social Graph',
    briefing: "You might lock down your own profile, but your connections leak information about you. An investigator maps your social graph — your followers, your tagged photos, your most frequent commenters — to identify your family members, your partner, your workplace, your friend group. They find your mom's unlocked Facebook, your partner's public Instagram, your colleague who tags the whole team at the office holiday party. Your privacy is only as strong as the weakest link in your social circle.",
    steps: [
      { text: "Check your followers/following list. On a public account, this reveals who you know. Can someone identify your family, partner, or coworkers from the list?" },
      { text: "Look at tagged photos — not YOUR tags, but photos OTHER PEOPLE tagged you in. These bypass your privacy settings." },
      { text: "Check your most frequent commenters and people you interact with. These reveal your closest relationships." },
      { text: "Search for your name + 'family' or 'spouse' or 'partner' on Google. What comes up?" },
      { text: "Check if family members have public profiles that mention you or share your location (parents are the biggest leak)." },
      { text: "Look at group photos — office parties, family gatherings, friend outings. Are people tagged? Are locations tagged?" },
      { text: "Check mutual followers between your 'anonymous' accounts and your real-name accounts. Overlap reveals identity." },
    ],
    debriefQs: OSINT_DEBRIEF,
    scoutDialog: {
      briefing: "\"You locked down your profile. Great. But your mom tagged you at Thanksgiving with the full address of her house. Your coworker tagged the whole team at the company retreat. Your partner's public Instagram has a photo of your apartment with the building number visible. Your privacy ends where your social circle's privacy begins.\"",
      debrief: {
        'no-exposure': "\"Clean social graph. Either your circle is privacy-aware or you've done a thorough tag cleanup. Impressive.\"",
        'some-exposure': "\"Found some leaks through your connections. Ask family and close friends to untag you or restrict those posts. Most people don't realize they're exposing you.\"",
        'significant-exposure': "\"Your social circle is leaking your life. This is the hardest one to fix because it requires other people to change. Start with the biggest leaks and have honest conversations.\"",
        'skip': "\"The social graph check is uncomfortable because it involves other people. But it's often the biggest leak.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // ══════════════════════════════════════════════════════
  // 4. CROSS-PLATFORM CORRELATION
  // ══════════════════════════════════════════════════════
  {
    id: 'osint-sieve-cross-platform',
    accountId: 'device_security',
    phase: 'fortify',
    title: 'OSINT Sieve: Cross-Platform',
    briefing: "An investigator's favorite trick: you're careful on Instagram but sloppy on Reddit. You use your real name on LinkedIn but a pseudonym on Twitter — except the same profile photo links them. You use the same username on GitHub and a gaming forum, and the gaming forum has your city in the bio. Cross-platform correlation is how anonymous accounts get de-anonymized. Let's see if your accounts are linkable.",
    steps: [
      { text: "Search your primary username on a username checker — see how many platforms it appears on", url: "https://namechk.com/" },
      { text: "Do the same for any 'anonymous' usernames you use. Does the same name appear on platforms tied to your real identity?" },
      { text: "Reverse image search your profile photos from EACH platform. Do they cross-link?", url: "https://images.google.com/" },
      { text: "Check your bios across platforms. Do multiple accounts list the same city, profession, school, or interests?" },
      { text: "Try your email on Have I Been Pwned — breached data links your email to account names", url: "https://haveibeenpwned.com/" },
      { text: "Google your email address in quotes. What comes up? Forum posts? Old profiles? Mailing list archives?" },
      { text: "Check if your phone number is discoverable via password reset pages on platforms you use." },
    ],
    debriefQs: OSINT_DEBRIEF,
    scoutDialog: {
      briefing: "\"You think your Reddit is anonymous? Same username as your Steam account. Same Steam account has your real first name. Your Reddit posts mention your city and profession. An investigator just connected your anonymous hot takes to your LinkedIn in three clicks. Let's see how linkable your accounts are.\"",
      debrief: {
        'no-exposure': "\"Accounts are siloed. Different usernames, different photos, no cross-linking. That's OPSEC discipline.\"",
        'some-exposure': "\"Some cross-linking found. The username reuse is the easiest fix — change the username on the less important platform. Profile photo cross-linking means uploading a different image.\"",
        'significant-exposure': "\"Your accounts form a chain. One investigator query links everything together. Start with the username — that's the master key for cross-platform correlation.\"",
        'skip': "\"This one reveals how 'anonymous' your anonymous accounts really are. Worth the 15 minutes.\"",
      },
    },
    estimatedMinutes: 15,
  },

  // ══════════════════════════════════════════════════════
  // 5. DIGITAL BREADCRUMBS
  // ══════════════════════════════════════════════════════
  {
    id: 'osint-sieve-breadcrumbs',
    accountId: 'device_security',
    phase: 'fortify',
    title: 'OSINT Sieve: Digital Breadcrumbs',
    briefing: "The trail you leave without thinking about it. Your Amazon wishlist is public by default — it shows your name and city. Your Venmo transactions were public, showing who you pay and when. Your Strava running route goes right past your front door. Screenshots you share show your WiFi network name, which maps to your physical address. Unboxing videos show delivery labels with your full name and address. These aren't social media posts — they're ambient data you scatter just by living a digital life.",
    steps: [
      { text: "Check your Amazon wishlist privacy: go to Your Lists, click the three dots, check sharing settings. Public? Semi-public? Does it show your city?", url: "https://www.amazon.com/hz/wishlist/ls" },
      { text: "Check Venmo privacy settings: Settings > Privacy > make transactions private. Review past public transactions.", url: "https://account.venmo.com/settings/privacy" },
      { text: "If you use Strava or a fitness tracker: review your activity privacy settings. Does your running/cycling route reveal your home address? In the app: Settings > Privacy Controls > enable a Privacy Zone around your home address.", url: "https://www.strava.com/settings/privacy" },
      { text: "Search your recent screenshots — any showing WiFi network names? An SSID can be looked up on WiGLE to find your physical location.", url: "https://wigle.net/" },
      { text: "Check unboxing or haul videos you've posted. Any delivery labels, packaging with your address, or mail visible in the background?" },
      { text: "Google your full name in quotes. Then try your name + city. Then your name + employer. What does a stranger find?" },
      { text: "Check your LinkedIn: your job title + company narrows your location to a specific office building." },
    ],
    debriefQs: OSINT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Your Amazon wishlist says your name is [name] and you live in [city]. Your Strava shows you run the same route every Tuesday, starting and ending at the same house. Your Venmo shows you split dinner with the same three people every Friday. You posted a screenshot with your WiFi name visible — I just looked it up and found your address. None of this was on social media. This is the ambient trail.\"",
      debrief: {
        'no-exposure': "\"Clean trail. No ambient data leaking your location or identity through side channels. That's thorough.\"",
        'some-exposure': "\"Found some breadcrumbs. Amazon and Venmo are quick fixes — just privacy toggles. Strava needs a privacy zone around your home. Screenshots with WiFi names need to be scrubbed before sharing.\"",
        'significant-exposure': "\"Heavy trail. The ambient stuff is often worse than social media because you never think about it. Start with Amazon wishlist and Venmo — those are one-click fixes. Then Strava. Then audit your screenshots.\"",
        'skip': "\"The breadcrumbs check catches things no other mission covers. Worth the time.\"",
      },
    },
    estimatedMinutes: 15,
  },
];
