// ══════════════════════════════════════════════════════════════════
// THE GRID — Chapter 10
// Smart Home & IoT: your house is listening
// ══════════════════════════════════════════════════════════════════

const DEVICE_AUDIT_DEBRIEF = [
  {
    id: "finding",
    label: "What did you find?",
    options: [
      { value: "no-issues", text: "Everything was already locked down", severity: "safe" },
      { value: "some-issues", text: "Found some settings to change", severity: "warn" },
      { value: "major-issues", text: "Found significant data collection active", severity: "crit" },
      { value: "skip", text: "Couldn't check right now", severity: "skip" },
    ],
  },
];

const DEVICE_ACTION_DEBRIEF = [
  {
    id: "action",
    label: "Did you complete the action?",
    options: [
      { value: "completed", text: "Yes, done", severity: "safe" },
      { value: "not-applicable", text: "I don't have this device", severity: "safe" },
      { value: "later", text: "I'll come back to this", severity: "skip" },
    ],
  },
];

const NETWORK_DEBRIEF = [
  {
    id: "action",
    label: "Did you complete the network changes?",
    options: [
      { value: "completed", text: "Yes, secured", severity: "safe" },
      { value: "partial", text: "Partially done, need to finish", severity: "warn" },
      { value: "later", text: "I'll come back to this", severity: "skip" },
    ],
  },
];

// Who can see your cameras (recon audit #81): a new question id; an old
// save's finding still shows (question.legacy).
const CAMERA_ACCESS_DEBRIEF = [
  {
    id: "camera_access",
    label: "Who had access?",
    legacy: DEVICE_AUDIT_DEBRIEF[0],
    options: [
      { value: "only-me", text: "Only me / my household", severity: "safe" },
      { value: "removed-old", text: "Removed old shared users", severity: "safe" },
      { value: "stranger", text: "Someone I didn't know had access", severity: "crit" },
      { value: "skip", text: "Couldn't check right now", severity: "skip" },
    ],
  },
];

function scoutDevice(clean, some, major) {
  return {
    "no-issues": clean,
    "some-issues": some,
    "major-issues": major,
    "skip": "\"No rush. The devices will still be here tomorrow -- and so will their data collection. Come back when you can.\"",
  };
}

function scoutAction(done, na) {
  return {
    "completed": done,
    "not-applicable": na,
    "later": "\"This one's worth coming back to. Every day that passes is another day of recordings.\"",
  };
}

export const GRID_MISSIONS = [
  // ══════════════════════════════════════════════════════
  // SMART TV
  // ══════════════════════════════════════════════════════
  {
    id: "smart_tv-recon-acr",
    accountId: "smart_tv",
    phase: "recon",
    title: "Disable ACR on Your TV",
    briefing: "Your smart TV has a feature called Automatic Content Recognition. It takes a fingerprint of what's on screen several times per second and sends it to a server that identifies what you're watching -- live TV, streaming, Blu-ray, even video calls. Vizio paid $2.2 million to the FTC for doing this without telling anyone. Samsung, LG, Roku, and Fire TV all do it too, they just buried the consent in the terms of service. The good news: you can turn it off. The bad news: every manufacturer hides the setting somewhere different.",
    steps: [
      { text: "Samsung: Settings → All Settings → General & Privacy → Terms & Privacy → untick Viewing Information Services" },
      { text: "LG: Settings > All Settings > General > System > Additional Settings > LivePlus > toggle OFF. Also Settings → General → System → User Agreements → untick Viewing Information (and “Who.Where.What?” on 2022 and later sets)" },
      { text: "Roku/TCL: Settings > Privacy > Smart TV Experience > toggle OFF 'Use Information from TV Inputs'" },
      { text: "Fire TV/Insignia: Settings > Preferences > Privacy Settings > Device Usage Data > toggle OFF; also Collect App Usage Data > OFF" },
      { text: "Vizio: System > Reset & Admin > Viewing Data > toggle OFF. Newer Vizio sets (Vizio is now owned by Walmart) may also have a separate setting for data shared with Walmart" },
      { text: "Apple TV: Settings → General → Privacy & Security → Analytics & Improvements → turn off Share Apple TV Analytics" },
    ],
    debriefQs: DEVICE_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Your TV is watching you watch it. Every frame is fingerprinted and matched against a content database. They know what you watch, when you pause, and when you rewind. Vizio got caught doing this without consent -- $2.2 million FTC fine. Every other manufacturer learned one thing from that: ask for consent in the terms of service nobody reads. Let's turn it off.\"",
      debrief: scoutDevice(
        "\"ACR was already off. Either you're privacy-conscious or you have a very old TV. Either way, well done.\"",
        "\"Found some tracking active. That's the default -- they ship with everything on. Now it's off.\"",
        "\"Full content recognition was running. Your TV was reporting everything on screen -- shows, games, video calls, everything. That pipe is closed now.\""
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: "smart_tv-fortify-apps",
    accountId: "smart_tv",
    phase: "fortify",
    title: "Audit TV App Permissions",
    briefing: "Smart TVs run apps, and those apps request permissions -- microphone access for voice search, camera access if your TV has one, and network access to phone home with usage data. Some TVs come pre-loaded with apps you never installed and never use, but they're still running in the background, still collecting.",
    steps: [
      { text: "Open your TV's app list or app management settings" },
      { text: "Delete or disable apps you never use -- they still collect data in the background" },
      { text: "Check which apps have microphone or camera permissions and revoke any you don't need" },
      { text: "If your TV has a camera (some Samsung and LG models), cover it with tape or disable it in settings" },
      { text: "Disable 'personalized ads' or 'ad tracking' -- usually in Settings > Privacy or Ads" },
    ],
    debriefQs: DEVICE_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"Your TV came with apps you didn't ask for. Some of them are watching what you do and reporting back. Time to evict the ones that don't pay rent.\"",
      debrief: scoutAction(
        "\"Apps cleaned up, permissions revoked. Your TV is now a screen instead of a surveillance device.\"",
        "\"No smart TV? That's actually the most secure option. Can't spy on you if it's not smart.\""
      ),
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // VOICE ASSISTANT
  // ══════════════════════════════════════════════════════
  {
    id: "voice_assistant-recon-recordings",
    accountId: "voice_assistant",
    phase: "recon",
    title: "Review and Delete Voice Recordings",
    briefing: "Every time you talk to Alexa, Google Assistant, or Siri, the recording is sent to a server, transcribed, and stored. In 2019, Bloomberg revealed that Amazon employs thousands of people worldwide to listen to Alexa recordings to 'improve the service.' Google and Apple had similar programs. The recordings include everything picked up by the microphone -- not just your command, but background conversations, TV audio, and anything else happening in the room. You can review what they have and delete it.",
    steps: [
      { text: "Alexa: Open the Alexa app > More > Settings > Alexa Privacy > Manage Your Alexa Data" },
      { text: "Alexa: Under 'Choose how long to save recordings,' select 'Don't save recordings'" },
      { text: "Alexa: Under Help improve Alexa, turn off Use of voice recordings. Then delete the recordings in Review Voice History" },
      { text: "Google: Go to myactivity.google.com > Filter by 'Voice & Audio'" },
      { text: "Google: Delete all voice recordings, then go to Activity Controls > Web & App Activity > untick 'Include voice and audio activity'" },
      { text: "Siri (iPhone/Mac): Settings → Siri (on newer iPhones: Apple Intelligence & Siri) → Siri & Dictation History → Delete Siri & Dictation History" },
      { text: "Siri: Settings → Privacy & Security → Analytics & Improvements → turn off Improve Siri & Dictation" },
    ],
    debriefQs: DEVICE_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Amazon, Google, and Apple all hired human contractors to listen to voice assistant recordings. They heard arguments, medical conversations, and some things that are none of anyone's business. The recordings are still there unless you delete them. Let's clean house.\"",
      debrief: scoutDevice(
        "\"No recordings stored. You either set this up already or you've been whispering. Good.\"",
        "\"Found some recordings in there. Now they're gone. Set auto-delete to keep them from piling up again.\"",
        "\"Years of recordings. Conversations your assistant overheard that you forgot it was listening to. Deleted now. Set it to stop saving.\""
      ),
    },
    estimatedMinutes: 10,
  },
  {
    id: "voice_assistant-fortify-sensitivity",
    accountId: "voice_assistant",
    phase: "fortify",
    title: "Lock Down Always-Listening Features",
    briefing: "Voice assistants are always listening for their wake word. That means the microphone is always on, processing audio locally to detect 'Alexa' or 'Hey Google.' The companies say audio is only transmitted after the wake word, but false activations happen constantly -- your TV says something that sounds like 'Alexa' and suddenly it's recording. You can reduce the attack surface without unplugging the device.",
    steps: [
      { text: "Find the physical mute button on your device and learn where it is -- press it when you have sensitive conversations" },
      { text: "Alexa: Settings > Alexa Privacy > Manage Your Alexa Data > Enable 'Deletion by voice' so you can say 'Alexa, delete everything I said today'" },
      { text: "Alexa: Settings > Alexa Privacy > Manage Your Alexa Data > 'Choose how long to save recordings' > set to 3 months or 'Don't save'" },
      { text: "Google: Google Home app > Settings > Privacy > Guest Mode (pauses saving activity)" },
      { text: "Google: myactivity.google.com > Activity Controls > set auto-delete to 3 months" },
      { text: "HomePod: Use the Home app > Home Settings > Improve Siri > toggle OFF" },
      { text: "Consider moving voice assistants out of bedrooms and private spaces" },
    ],
    debriefQs: DEVICE_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"The mute button is the most important button on a voice assistant. It's the only physical guarantee that the microphone is off. Everything else is software -- and software has bugs. Learn where the button is and use it.\"",
      debrief: scoutAction(
        "\"Listening locked down. Auto-delete set. Mute button located. Your assistant now works for you, not the other way around.\"",
        "\"No voice assistant in the house? You passed this test before it started. No microphone, no problem.\""
      ),
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // SMART CAMERA
  // ══════════════════════════════════════════════════════
  {
    id: "smart_camera-recon-access",
    accountId: "smart_camera",
    phase: "recon",
    title: "Audit Camera Access and Sharing",
    briefing: "Smart cameras -- Ring, Nest, Wyze, Arlo -- have user management features. Anyone with access to your camera account can watch the live feed, review recordings, and sometimes download footage. If you shared access with an ex-partner, a former roommate, or a contractor who installed the camera, they may still have access. Wyze exposed 2.4 million customers' data in 2019 and disclosed it within days. Its long silence was about something else: a camera vulnerability it left unpatched for about three years, reported in 2022.",
    steps: [
      { text: 'Ring: open the Ring app → menu → Control Center → User Permissions. Remove Shared and Guest users who shouldn’t have access' },
      { text: 'Nest/Google: Google Home app → your profile → Home settings → tap a person → Remove' },
      { text: 'Wyze: Wyze app → Account → Sharing → review and remove old shared users' },
      { text: 'Arlo: Arlo app → Settings → Account → Grant Access → review and remove' },
      { text: 'Check for any unfamiliar linked email addresses on the camera account itself' },
      { text: 'Change the camera account password if you haven’t done so recently' },
    ],
    debriefQs: CAMERA_ACCESS_DEBRIEF,
    scoutDialog: {
      briefing: "\"Your camera sees everything in its field of view, 24/7. Who else can see it? Former roommates, ex-partners, the contractor who installed it -- if they were ever shared access, they might still have it. Let's check who's watching your cameras.\"",
      debrief: {
        "only-me": "\"Only your household. That's how it should be.\"",
        "removed-old": "\"Old shared users removed. Good catch -- they could have kept watching.\"",
        "stranger": "\"Someone you didn't know had access. That's a safety issue, not just privacy. Remove them, change the password, and turn on two-factor.\"",
        ...scoutDevice(
        "\"Access is clean. Only you can see your feeds. That's how it should be.\"",
        "\"Found some old shared users. Good catch -- they could have been watching this whole time.\"",
        "\"Multiple unauthorized viewers on your cameras. That's not just a privacy issue, that's a safety issue. They're removed now.\""
      ),
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: "smart_camera-fortify-police",
    accountId: "smart_camera",
    phase: "fortify",
    title: "Opt Out of Police Camera Partnerships",
    briefing: "Police can ask Ring users near an incident to share their footage through Ring's Community Requests. Sharing is up to you: you can decline any request, and you can turn off the emails about them in Control Center. Turning those off doesn't stop police from asking Ring directly with a warrant, or in what Ring calls an emergency: in 2022 Ring said it had given footage to police without the owner's consent 11 times that year under its emergency policy.",
    steps: [
      { text: 'Ring: open the Ring app → Menu → Control Center' },
      { text: 'Find the public safety section (Community Requests). There you can turn off the emails Ring sends about police requests' },
      { text: 'Know the rule that matters more: sharing is your choice. Each request asks you, and you can decline it' },
      { text: 'Also review the devices and services listed in Control Center, and remove any you don’t recognize' },
      { text: 'Nest/Google: Google publishes how it handles law enforcement requests in its Transparency Report' },
    ],
    debriefQs: DEVICE_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"Police can ask you for your doorbell footage, and the answer is yours to give. In 2022 Ring handed footage over without asking the owner 11 times. Know where the requests show up, and decline what you don't want to share.\"",
      debrief: scoutAction(
        "\"You know where the requests come in, and that you can say no. Your camera works for you.\"",
        "\"No Ring camera? One fewer surveillance partnership to worry about.\""
      ),
    },
    estimatedMinutes: 5,
  },
  {
    id: "smart_camera-reclaim-storage",
    accountId: "smart_camera",
    phase: "reclaim",
    title: "Review Cloud Storage and Retention",
    briefing: "Most smart cameras upload footage to cloud storage by default. That means your private moments live on Amazon's, Google's, or Wyze's servers. Reducing the retention period limits how much history exists if the account is ever breached. For indoor cameras, consider whether cloud upload is necessary at all -- local storage (SD card) keeps footage on your property.",
    steps: [
      { text: "Ring: Ring app > Devices > Video Settings > Video Storage Duration > set to the shortest period you're comfortable with" },
      { text: "Nest: Google Home app > Camera > Settings > review video history length" },
      { text: "Wyze: If your camera has an SD card slot, switch to local recording only (Wyze app > camera > Advanced Settings > Local Storage)" },
      { text: "For indoor cameras: consider disabling cloud upload entirely and using only local SD card storage" },
      { text: "Delete old cloud recordings you no longer need" },
    ],
    debriefQs: DEVICE_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"Every hour of footage on their servers is an hour of your private life that exists outside your control. Shorten the retention, switch indoor cameras to local storage, and delete old recordings. The cloud is just someone else's computer.\"",
      debrief: scoutAction(
        "\"Cloud storage tightened. Less footage sitting on corporate servers. Less exposure if the account is breached.\"",
        "\"No smart cameras? Your home is already harder to surveil remotely than most.\""
      ),
    },
    estimatedMinutes: 8,
  },

  // ══════════════════════════════════════════════════════
  // SMART APPLIANCES
  // ══════════════════════════════════════════════════════
  {
    id: "smart_appliances-recon-inventory",
    accountId: "smart_appliances",
    phase: "recon",
    title: "Audit Your Connected Appliances",
    briefing: "Robot vacuums map your floor plan and some sell that data. Smart thermostats know when you're home and when you're away. Baby monitors stream audio and video to the cloud. Smart locks log every entry and exit. Smart fridges track your eating habits. Most people don't realize how many devices in their home are phoning home. This mission is a survey: what's connected, and what's it sending?",
    steps: [
      { text: "Check your Wi-Fi router's connected devices list (usually at 192.168.1.1 or in your router app)" },
      { text: "Write down every smart device you find -- many people discover devices they forgot about" },
      { text: "For each device, check: does it have an app? What permissions does that app have? When did you last update its firmware?" },
      { text: "Robot vacuum (Roomba/iRobot): Open the iRobot app > Settings > Privacy > review map sharing settings" },
      { text: "Smart thermostat (Nest/Ecobee): Check if 'Home/Away Assist' is sharing your occupancy patterns" },
      { text: "Baby monitors: Check if the feed is accessible via a web URL (some cheap monitors broadcast unencrypted)" },
    ],
    debriefQs: DEVICE_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: "\"Amazon tried to buy iRobot, the Roomba company, for $1.7 billion. Regulators balked and the deal died in 2024. A robot vacuum maps your home, and that map is data. Let's find out what every connected device in your home is sending and to whom.\"",
      debrief: scoutDevice(
        "\"Everything accounted for and locked down. Your home network is cleaner than most corporate offices.\"",
        "\"Found some devices phoning home. That's normal -- the default is always maximum data collection. Now you know what's there.\"",
        "\"Significant data collection happening across multiple devices. Your house was generating a detailed profile of your daily life. Let's start shutting those pipes.\""
      ),
    },
    estimatedMinutes: 15,
  },
  {
    id: "smart_appliances-fortify-maps",
    accountId: "smart_appliances",
    phase: "fortify",
    title: "Disable Map and Occupancy Sharing",
    briefing: "Your robot vacuum has a detailed map of your home -- room dimensions, furniture placement, obstacles. Your smart thermostat knows your daily schedule: when you leave for work, when you come home, when you go to bed. This data is valuable for targeted advertising and home insurance risk assessment. You can limit what these devices share.",
    steps: [
      { text: "iRobot/Roomba: iRobot app > Settings > Privacy > disable 'Share map data' and 'Send usage data'" },
      { text: "Roborock: App > Settings > Privacy > opt out of user experience improvement program" },
      { text: "Nest Thermostat: Google Home app > thermostat > Settings > disable 'Home/Away Assist' if you don't use it" },
      { text: "Ecobee: App > Settings > Privacy > review 'Community Energy Savings' and 'Eco+ Demand Response' participation" },
      { text: "Smart plugs/switches: check each app for usage analytics sharing and disable" },
      { text: "Update firmware on all connected appliances -- old firmware has known vulnerabilities" },
    ],
    debriefQs: DEVICE_ACTION_DEBRIEF,
    scoutDialog: {
      briefing: "\"Your vacuum knows the dimensions of every room. Your thermostat knows your daily schedule. Combined, they build a surveillance profile more intimate than anything a data broker could buy. Disable the sharing and keep the functionality.\"",
      debrief: scoutAction(
        "\"Map and occupancy sharing disabled. Your appliances work for you now, not for their manufacturer's data pipeline.\"",
        "\"No connected appliances? Traditional devices: zero data collection, infinite battery life. Respect.\""
      ),
    },
    estimatedMinutes: 10,
  },

  // ══════════════════════════════════════════════════════
  // HOME NETWORK
  // ══════════════════════════════════════════════════════
  {
    id: "smart_network-recon-router",
    accountId: "smart_network",
    phase: "recon",
    title: "Secure Your Home Router",
    briefing: "Your router is the front door to every device in your house. If it's still using the default admin password (usually 'admin/admin' or printed on a sticker), anyone nearby can log in and intercept all your traffic. If WPS is enabled, attackers can brute-force your Wi-Fi password in hours. If UPnP is enabled, malware on any device can open ports to the internet without your knowledge. Most people never change these defaults.",
    steps: [
      { text: "Open your router's admin panel (usually http://192.168.1.1 or http://192.168.0.1 -- check the sticker on your router)" },
      { text: "Change the admin password from the default to something strong and unique" },
      { text: "Disable WPS (Wi-Fi Protected Setup) -- it has a known brute-force vulnerability" },
      { text: "Disable UPnP (Universal Plug and Play) -- it lets devices open network ports without your permission" },
      { text: "Check for firmware updates and install them -- router vulnerabilities are actively exploited" },
      { text: "Change your Wi-Fi password if it's the default one printed on the router" },
    ],
    debriefQs: NETWORK_DEBRIEF,
    scoutDialog: {
      briefing: "\"Your router is the gateway to everything. Every smart device, every laptop, every phone in your house goes through it. If the admin password is still 'admin,' someone parked outside can own your entire network. Let's lock the front door before worrying about the smart fridge.\"",
      debrief: {
        "completed": "\"Router secured. Default password changed, WPS off, UPnP off, firmware updated. That's the foundation for everything else in this district.\"",
        "partial": "\"Partially done. Come back and finish -- every setting you didn't change is a door left open.\"",
        "later": "\"This is the most important mission in The Grid. Everything else depends on your router being secure. Prioritize this one.\"",
      },
    },
    estimatedMinutes: 10,
  },
  {
    id: "smart_network-fortify-isolation",
    accountId: "smart_network",
    phase: "fortify",
    title: "Create an IoT Guest Network",
    briefing: "A smart light bulb with a security vulnerability can be used to attack your laptop on the same network. The fix: put your IoT devices on a separate network. Most modern routers support a 'guest network' that's isolated from your main network. Your smart devices can still reach the internet (for firmware updates and cloud features) but they can't see or talk to your computers, phones, or NAS. If one gets compromised, the blast radius stops at the guest network.",
    steps: [
      { text: "Open your router's admin panel" },
      { text: "Find 'Guest Network' or 'Guest Wi-Fi' settings" },
      { text: "Enable it with a different name (SSID) and password than your main network -- e.g., 'HomeNet-IoT'" },
      { text: "Enable 'AP Isolation' or 'Client Isolation' if available -- this prevents devices on the guest network from seeing each other" },
      { text: "Reconnect all smart devices (TVs, speakers, cameras, vacuums, thermostats) to the IoT network" },
      { text: "Keep your phones, laptops, and tablets on the main network" },
      { text: "Note: some smart devices need to be on the same network as your phone for initial setup -- set them up on main, then move them to the IoT network" },
    ],
    debriefQs: NETWORK_DEBRIEF,
    scoutDialog: {
      briefing: "\"A compromised smart light bulb shouldn't be able to reach your laptop. Network isolation is the answer -- put your IoT devices on a guest network where they can reach the internet but not your personal devices. If one gets hacked, the blast radius stops at the guest network wall.\"",
      debrief: {
        "completed": "\"IoT network isolated. Your smart devices are now in their own sandbox. A compromised camera can't pivot to your laptop. That's network security done right.\"",
        "partial": "\"Partially set up. Finish moving devices to the IoT network when you can -- every device on the main network is a potential bridge to your personal data.\"",
        "later": "\"This is an advanced move, but it's the single most effective thing you can do for home network security. Come back to it.\"",
      },
    },
    estimatedMinutes: 15,
  },
  {
    id: "smart_network-reclaim-dns",
    accountId: "smart_network",
    phase: "reclaim",
    title: "Encrypt Your DNS Lookups",
    briefing: "Every time your browser looks up a website, it sends a DNS query -- usually to your ISP, in plain text, so your ISP can see every site name you look up. In 2017, Congress repealed FCC rules that would have required ISPs to get your permission before selling your browsing history. Encrypted DNS (DNS over HTTPS or over TLS) hides those lookups from your ISP. It still sees which servers you connect to. Changing the DNS server numbers in your router is different: that changes who answers, not who can see.",
    steps: [
      { text: 'Encrypted, phone: Android: Settings > Network > Private DNS > set to \'one.one.one.one\' (Cloudflare) or \'dns.quad9.net\' (Quad9). iPhone: install Cloudflare’s 1.1.1.1 app, which encrypts lookups on Wi-Fi and cellular' },
      { text: 'Encrypted, browser: Firefox: Settings > Privacy & Security > DNS over HTTPS > Increased or Max Protection. Chrome: Settings > Privacy and security > Security > Use secure DNS' },
      { text: 'Plain, whole network: in your router settings, change the DNS servers to Cloudflare (1.1.1.1, 1.0.0.1) or Quad9 (9.9.9.9, 149.112.112.112). This changes who answers, not who can see: the lookups still travel unencrypted, so your ISP can still read them' },
      { text: 'Verify it\'s working: visit one.one.one.one/help (Cloudflare). It says whether your lookups are encrypted. dnsleaktest.com shows which servers are answering' },
    ],
    debriefQs: NETWORK_DEBRIEF,
    scoutDialog: {
      briefing: "\"Your ISP sees every domain you visit. Congress explicitly allowed them to sell this data in 2017. Encrypted DNS takes the lookups out of their view -- they go through an encrypted channel to a resolver you chose. They still see which servers you connect to. It takes five minutes and it's free.\"",
      debrief: {
        "completed": "\"Done. Where you turned on encrypted DNS, your ISP can't read your lookups anymore. It can still see which servers you connect to, so this is one layer, not invisibility.\"",
        "partial": "\"Partially configured. Even protecting one device is better than none -- finish the rest when you can.\"",
        "later": "\"This is one of the highest-value, lowest-effort privacy upgrades available. Five minutes to take your lookups out of your ISP's view. Come back soon.\"",
      },
    },
    estimatedMinutes: 8,
  },
];
