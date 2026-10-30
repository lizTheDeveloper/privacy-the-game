// Vault 7 (WikiLeaks, 2017): the CIA's hacking tools that name a device or service the player has.
// Spec: src/data/leaks/README.md. Every URL here was checked live on 2026-10-29; see
// research/leaks/vault7-urls.json. Every sentence below is something a listed source says.
// The CIA has never confirmed the documents; a jury convicted the CIA engineer who leaked them
// (Joshua Schulte, July 2022), which is on the 'vault-7' page.
//
// Shared sources, reused across entries.
const S = Object.freeze({
  yearZero: { label: 'WikiLeaks (2017): Vault 7: CIA Hacking Tools Revealed ("Year Zero" press release)', url: 'https://wikileaks.org/ciav7p1/' },
  wiki: { label: 'Wikipedia: Vault 7', url: 'https://en.wikipedia.org/wiki/Vault_7' },
  ciaStatement: { label: 'CIA (2017): CIA Statement on Claims by Wikileaks', url: 'https://www.cia.gov/stories/story/cia-statement-on-claims-by-wikileaks' },
  guardian: { label: "The Guardian (2017): WikiLeaks publishes 'biggest ever leak of secret CIA documents'", url: 'https://www.theguardian.com/media/2017/mar/07/wikileaks-publishes-biggest-ever-leak-of-secret-cia-documents-hacking-surveillance' },
});

const v7 = (anchor) => `https://wikileaks.org/vault7/#${encodeURIComponent(anchor)}`;

// The CIA's own answer to the leak (cia.gov, 2017-03-08) is the only statement of authority or
// oversight any source gives for these tools. It names no court.
const CIA_AUTHORITY = "None named in the documents; the CIA says its mission is \"to aggressively collect foreign intelligence overseas\"";
const CIA_CHECK = "The CIA names no court. It says its work is \"subject to rigorous oversight\"";

export const LEAKS_VAULT7 = Object.freeze([
  {
    id: 'vault-7',
    badge: 'VAULT 7',
    title: 'Vault 7: Year Zero',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      "On 7 March 2017 WikiLeaks published \"Year Zero\": 8,761 documents and files from the CIA's Center for Cyber Intelligence, with \"weaponized\" exploits against Apple's iPhone, Google's Android, Microsoft's Windows and Samsung TVs, \"which are turned into covert microphones\". " +
      'By the end of 2016 the CIA\'s hacking division had "over 5000 registered users" and "more than a thousand" hacking systems, trojans and viruses. ' +
      'In July 2022 a jury convicted former CIA software engineer Joshua Schulte of leaking the documents to WikiLeaks; in February 2024 he was sentenced to 40 years in prison.',
    accounts: ['apple_id', 'google', 'microsoft', 'smart_tv'],
    sources: [
      S.yearZero,
      S.guardian,
      S.wiki,
      { label: 'AP via Georgia Public Broadcasting (2022): A former CIA engineer is convicted in a massive theft of secrets released by WikiLeaks', url: 'https://www.gpb.org/news/2022/07/13/former-cia-engineer-convicted-in-massive-theft-of-secrets-released-by-wikileaks' },
      { label: 'Al Jazeera (2022): Ex-CIA engineer Joshua Schulte convicted over massive data leak', url: 'https://www.aljazeera.com/news/2022/7/14/ex-cia-engineer-joshua-schulte-convicted-of-largest-data' },
      { label: 'Al Jazeera (2024): Ex-CIA software engineer who leaked to WikiLeaks sentenced to 40 years', url: 'https://www.aljazeera.com/news/2024/2/2/ex-cia-software-engineer-who-leaked-to-wikileaks-sentenced-to-40-years' },
      { label: 'Wikipedia: Joshua Schulte', url: 'https://en.wikipedia.org/wiki/Joshua_Schulte' },
      S.ciaStatement,
    ],
    scale: { value: 8761, unit: 'documents', what: 'in "Year Zero", the first Vault 7 release', source: 0 },
    flow: {
      data: 'Whatever is on the hacked device: files, messages, audio, location',
      from: ['iPhones', 'Android phones', 'Windows computers', 'Samsung smart TVs'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'From CIA headquarters in Langley, and from a covert CIA hacker base in the U.S. consulate in Frankfurt',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'weeping-angel',
    badge: 'WEEPING ANGEL',
    title: 'Weeping Angel',
    agency: 'CIA and MI5',
    leak: 'vault7',
    year: 2017,
    summary:
      'Weeping Angel is a CIA implant for Samsung F Series smart TVs, built from "Extending", a tool from Britain\'s MI5, in joint workshops between the two agencies. ' +
      "It puts the TV in a \"Fake-Off\" mode: the owner believes the TV is off while it records conversations in the room through the built-in microphone and sends them over the internet to a covert CIA server. " +
      'An agent installs it on the TV with a USB stick.',
    accounts: ['smart_tv'],
    sources: [
      { label: "WikiLeaks (2017): Vault 7: Weeping Angel", url: v7('Weeping Angel') },
      { label: 'WikiLeaks (2017): Extending - User Guide (the Weeping Angel manual)', url: 'https://wikileaks.org/vault7/document/EXTENDING_User_Guide/' },
      S.yearZero,
      S.guardian,
      { label: "The Verge (2017): Here's how to use the CIA's 'weeping angel' smart TV hack", url: 'https://www.theverge.com/2017/4/25/15421326/smart-tv-hacking-cia-samsung-weeping-angel-vulnerability' },
      { label: 'The Intercept (2017): WikiLeaks Dump Shows CIA Could Turn Smart TVs into Listening Devices', url: 'https://theintercept.com/2017/03/07/wikileaks-dump-shows-cia-could-turn-smart-tvs-into-listening-devices/' },
      S.wiki,
      S.ciaStatement,
    ],
    flow: {
      data: 'Audio of conversations in the room',
      from: ['Samsung smart TVs'],
      to: ['CIA', 'MI5'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'After an agent installs it on the TV with a USB stick',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'cherry-blossom',
    badge: 'CHERRY BLOSSOM',
    title: 'Cherry Blossom',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'Cherry Blossom is CIA firmware for home and office Wi-Fi routers and access points, built with SRI International. ' +
      'The CIA listed hundreds of router models it targeted, from brands including D-Link, Linksys and 3Com; on some routers the CIA installs it over a wireless firmware upgrade, with no physical access. ' +
      'The infected router, a "FlyTrap", copies a target\'s traffic, scans it for email addresses, chat usernames and VoIP numbers, and redirects the target\'s browser.',
    accounts: ['smart_network'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: Cherry Blossom', url: v7('Cherry Blossom') },
      { label: 'WikiLeaks (2017): CherryBlossom -- Quick Start Guide', url: 'https://wikileaks.org/vault7/document/SRI-SLO-FF-2012-177-CherryBlossom_QuickStartGuide_SLO-FF-2012-170/' },
      { label: "Threatpost (2017): Wikileaks Alleges Years of CIA D-Link and Linksys Router Hacking Via 'Cherry Blossom' Program", url: 'https://threatpost.com/wikileaks-alleges-years-of-cia-d-link-and-linksys-router-hacking-via-cherry-blossom-program/126339/' },
      S.wiki,
      S.ciaStatement,
    ],
    marking: 'S//NF',
    flow: {
      data: 'All internet traffic through the router: email addresses, chat usernames, MAC addresses, VoIP numbers',
      from: ['Wi-Fi routers and access points (D-Link, Linksys, 3Com and others)'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'After new firmware is flashed onto the router, over the air where the router allows it',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'dark-matter',
    badge: 'DARK MATTER',
    title: 'Dark Matter',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      "Dark Matter is a set of CIA tools that infect Apple Mac firmware, so the infection survives a reinstall of the operating system. " +
      '"Sonic Screwdriver" hides in an Apple Thunderbolt-to-Ethernet adapter and boots CIA software on a Mac "even when a firmware password is enabled". ' +
      'NightSkies 1.2, a "beacon/loader/implant tool" for the iPhone, is "expressly designed to be physically installed onto factory fresh iPhones": the CIA has been infecting the iPhone supply chain of its targets since at least 2008.',
    accounts: ['apple_id'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: Dark Matter', url: v7('Dark Matter') },
      { label: 'Fortune (2017): WikiLeaks Says CIA Has Targeted iPhone Supply Chain Since 2008', url: 'https://fortune.com/2017/03/23/apple-wikileaks-iphone/' },
      { label: 'The Register (2017): Amazing new WikiLeaks CIA bombshell: Agents can install software on Apple Macs, iPhones right in front of them', url: 'https://www.theregister.com/security/2017/03/23/amazing-new-wikileaks-cia-bombshell-agents-can-install-software-on-apple-macs-iphones-right-in-front-of-them/1526061' },
      S.wiki,
      S.ciaStatement,
    ],
    flow: {
      data: 'Persistent control of the Mac or iPhone',
      from: ['Apple Macs', 'iPhones'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'With hands on the device: a Mac at boot, an iPhone before its owner first uses it',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'cia-phone-hacking',
    badge: 'CIA PHONE HACKS',
    title: "The CIA's Mobile Devices Branch",
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      "The CIA's Mobile Devices Branch built attacks to remotely hack and control popular smartphones. " +
      "An infected phone sends the CIA the user's geolocation, audio and text communications, and turns on the phone's camera and microphone. " +
      'As of 2016 the CIA had 24 "weaponized" Android zero-days, developed itself and obtained from GCHQ, the NSA and cyber arms contractors; a separate CIA unit builds malware for iPhones and iPads.',
    accounts: ['apple_id', 'google'],
    sources: [S.yearZero, S.guardian, S.wiki, S.ciaStatement],
    scale: { value: 24, unit: 'Android zero-days', what: 'the CIA held as of 2016', source: 0 },
    flow: {
      data: 'Geolocation, audio, text messages, camera and microphone',
      from: ['iPhones and iPads', 'Android phones'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'Remotely, on phones the CIA hacks',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'before-encryption',
    badge: 'CIA: BEFORE CRYPTO',
    title: 'Messages taken before encryption',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'WikiLeaks named WhatsApp, Signal and Telegram: the CIA hacks the phone the app runs on and collects "audio and message traffic before encryption is applied". ' +
      "The apps' encryption is not broken. The CIA takes the message off the phone itself, before the app encrypts it, by capturing what you type and touch. " +
      'The CIA takes control of the entire phone; reading the encrypted chats is "simply one of many" things that control gives it.',
    accounts: ['whatsapp', 'signal', 'telegram'],
    sources: [
      S.yearZero,
      { label: "The Intercept (2017): The CIA Didn't Break Signal or WhatsApp, Despite What You've Heard", url: 'https://theintercept.com/2017/03/07/the-cia-didnt-break-signal-or-whatsapp-despite-what-youve-heard/' },
      S.wiki,
      S.ciaStatement,
    ],
    flow: {
      data: 'Messages and audio, read before the app encrypts them',
      from: ['Hacked iPhones and Android phones running WhatsApp, Signal and Telegram'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'Once the CIA controls the phone',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'highrise',
    badge: 'HIGHRISE',
    title: 'HighRise',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'HighRise is a CIA app for Android 4.0 to 4.3 that intercepts SMS text messages and passes them over the internet to a CIA listening post. ' +
      'It is disguised as an app called "TideCheck" and is installed by hand on the phone.',
    accounts: ['google', 'phone_carrier'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: Highrise', url: v7('Highrise') },
      { label: 'WikiLeaks (2017): HighRise 2.0 Users Guide', url: 'https://wikileaks.org/vault7/document/HighRise-2_0-Users_Guide/' },
      { label: "SecurityWeek (2017): 'HighRise' Android Malware Used by CIA to Intercept SMS Messages", url: 'https://www.securityweek.com/highrise-android-malware-used-cia-intercept-sms-messages/' },
      { label: 'Infosecurity Magazine (2017): WikiLeaks Reveals CIA Tool Acting as SMS Proxy on Android', url: 'https://www.infosecurity-magazine.com/news/wikileaks-highrise-cia-android/' },
      S.ciaStatement,
    ],
    flow: {
      data: 'SMS text messages, incoming and outgoing',
      from: ['Android phones'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'After the app is installed and activated on the phone',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'scribbles',
    badge: 'SCRIBBLES',
    title: 'Scribbles',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'Scribbles hides "Web beacon"-style tags in Microsoft Office documents "likely to be copied by Insiders, Whistleblowers, Journalists or others". ' +
      'When the document is opened, the tag calls a CIA server and reports that it was opened and the IP address of the computer that opened it.',
    accounts: ['microsoft'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: Scribbles', url: v7('Scribbles') },
      { label: 'WikiLeaks (2017): Scribbles v1.0 RC1 - User Guide', url: 'https://wikileaks.org/vault7/document/Scribbles_v1_0_RC1-User_Guide/' },
      { label: "Threatpost (2017): WikiLeaks Reveals CIA Tool 'Scribbles' For Document Tracking", url: 'https://threatpost.com/wikileaks-reveals-cia-tool-scribbles-for-document-tracking/125299/' },
      { label: 'The Register (2017): CIA tracked leakers with hilariously bad Web beacon trick', url: 'https://www.theregister.com/security/2017/05/01/cia-tracked-leakers-with-hilariously-bad-web-beacon-trick/1405493' },
      S.wiki,
      S.ciaStatement,
    ],
    marking: 'SECRET//ORCON/NOFORN',
    flow: {
      data: 'When a marked document is opened, and the IP address of the computer that opened it',
      from: ['Microsoft Office documents'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'On documents likely to be copied by insiders, whistleblowers and journalists',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'athena',
    badge: 'ATHENA',
    title: 'Athena',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'Athena is CIA malware for every version of Microsoft Windows from XP to Windows 10, built with Siege Technologies, a New Hampshire company. ' +
      'Once installed it beacons to the CIA, loads payloads into memory for specific tasks, and moves files to and from the computer. ' +
      'It is loaded by an asset, by a remote operator, or through the supply chain.',
    accounts: ['microsoft'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: Athena', url: v7('Athena') },
      { label: 'SecurityWeek (2017): WikiLeaks Details Malware Made by CIA and U.S. Security Firm', url: 'https://www.securityweek.com/wikileaks-details-malware-made-cia-and-us-security-firm/' },
      { label: 'CyberScoop (2017): As investigation against Assange is dropped, WikiLeaks releases new CIA malware', url: 'https://cyberscoop.com/as-investigation-against-assange-is-dropped-wikileaks-releases-new-cia-malware/' },
      S.wiki,
      S.ciaStatement,
    ],
    flow: {
      data: 'Files on the computer, and control of it',
      from: ['Windows computers (XP to Windows 10)'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'Installed by an asset, a remote operator, or through the supply chain',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'grasshopper',
    badge: 'GRASSHOPPER',
    title: 'Grasshopper',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'Grasshopper is the CIA\'s kit for building custom malware for Microsoft Windows. ' +
      'It surveys the target first, checking the Windows version and which antivirus runs, so the payload installs "only if the target has the right configuration" and antivirus does not see it. ' +
      'One way it hides on a computer, "Stolen Goods", is taken from Carberp, criminal banking malware.',
    accounts: ['microsoft'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: Grasshopper', url: v7('Grasshopper') },
      { label: 'CSO Online (2017): WikiLeaks: CIA used bits of Carberp Trojan code for malware deployment', url: 'https://www.csoonline.com/article/561043/wikileaks-cia-used-bits-of-carberp-trojan-code-for-malware-deployment.html' },
      { label: 'SecurityWeek (2017): WikiLeaks Details CIA Tool for Creating Windows Malware Installers', url: 'https://www.securityweek.com/wikileaks-details-cia-tool-creating-windows-malware-installers/' },
      S.wiki,
      S.ciaStatement,
    ],
    scale: { value: 27, unit: 'documents', what: 'from the Grasshopper framework', source: 0 },
    flow: {
      data: 'Control of the computer, through whatever payload the CIA builds',
      from: ['Windows computers'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'Only on targets whose Windows version and antivirus pass its survey',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'aftermidnight',
    badge: 'AFTERMIDNIGHT',
    title: 'AfterMidnight and Assassin',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'AfterMidnight and Assassin are CIA malware frameworks for Microsoft Windows. ' +
      'AfterMidnight disguises itself as a Windows service and calls a CIA listening post on a schedule for new "Gremlins": hidden payloads that subvert software, survey the target and take its data. ' +
      'Assassin runs inside a Windows service and beacons to the CIA for tasks and to deliver what it collected.',
    accounts: ['microsoft'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: AfterMidnight', url: v7('AfterMidnight') },
      { label: 'Threatpost (2017): WikiLeaks Reveals Two CIA Malware Frameworks', url: 'https://threatpost.com/wikileaks-reveals-two-cia-malware-frameworks/125701/' },
      { label: 'Computerworld (2017): WikiLeaks posts user guides for CIA malware implants Assassin and AfterMidnight', url: 'https://www.computerworld.com/article/1680758/wikileaks-posts-user-guides-for-cia-malware-implants-assassin-and-aftermidnight.html' },
      S.wiki,
      S.ciaStatement,
    ],
    flow: {
      data: 'Data from the computer, and control of its software',
      from: ['Windows computers'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'On a schedule the operator sets, once installed',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'elsa',
    badge: 'ELSA',
    title: 'ELSA',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'ELSA is CIA malware that tracks where a Windows laptop goes. ' +
      'It records the name, MAC address and signal strength of every Wi-Fi network in range, even when the laptop is not connected, and looks up the position in public geolocation databases from Google and Microsoft. ' +
      'The CIA turns the log into "a tracking profile of the target device".',
    accounts: ['microsoft', 'google'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: Elsa', url: v7('Elsa') },
      { label: "SecurityWeek (2017): 'Elsa' Tool Allows CIA to Locate Users via Wi-Fi", url: 'https://www.securityweek.com/elsa-tool-allows-cia-locate-users-wi-fi/' },
      { label: 'The Register (2017): Spies do spying, part 97: The CIA has a tool to track targets via Wi-Fi', url: 'https://www.theregister.com/security/2017/06/29/spies-do-spying-part-97-the-cia-has-a-tool-to-track-targets-via-wi-fi/554020' },
      S.ciaStatement,
    ],
    flow: {
      data: 'Nearby Wi-Fi networks, turned into latitude, longitude and time',
      from: ['Windows laptops', 'Google and Microsoft geolocation databases'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'Continuously while the laptop runs with Wi-Fi on; the CIA retrieves the log with other exploits',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'couchpotato',
    badge: 'COUCHPOTATO',
    title: 'CouchPotato',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'CouchPotato is a CIA tool for collecting RTSP/H.264 video streams, the formats IP surveillance cameras stream over a network or the internet. ' +
      'It saves the stream as video, or saves a still image each time the picture changes. ' +
      'It needs the stream\'s address and runs inside a CIA in-memory loader.',
    accounts: ['smart_camera'],
    sources: [
      { label: 'WikiLeaks (2017): Vault 7: CouchPotato', url: v7('CouchPotato') },
      { label: 'WikiLeaks (2017): CouchPotato v1.0 -- User Guide', url: 'https://wikileaks.org/vault7/document/Couch_Potato-1_0-User_Guide/' },
      { label: 'SecurityWeek (2017): CIA\'s "CouchPotato" Collects Video Streams', url: 'https://www.securityweek.com/cias-couchpotato-collects-video-streams/' },
      S.wiki,
      S.ciaStatement,
    ],
    flow: {
      data: 'Live video, saved as video files or still images',
      from: ['Networked surveillance cameras'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'Once the CIA has the stream\'s address',
      checkedBy: CIA_CHECK,
    },
  },
  {
    id: 'cia-vehicles',
    badge: 'CIA: CARS',
    title: 'Vehicle control systems',
    agency: 'CIA',
    leak: 'vault7',
    year: 2017,
    summary:
      'In October 2014 the CIA\'s Embedded Devices Branch listed "Vehicle Systems" among its potential mission areas. ' +
      'WikiLeaks: "the CIA was also looking at infecting the vehicle control systems used by modern cars and trucks", which "would permit the CIA to engage in nearly undetectable assassinations".',
    accounts: ['car_gm', 'car_toyota', 'car_honda', 'car_ford', 'car_hyundai', 'car_kia', 'car_nissan', 'car_subaru', 'car_tesla', 'car_bmw', 'car_vw', 'car_stellantis'],
    sources: [
      S.yearZero,
      { label: 'WikiLeaks (2017): 2014-10-23 Branch Direction Meeting notes (CIA Embedded Devices Branch)', url: 'https://wikileaks.org/ciav7p1/cms/page_13763790.html' },
      { label: 'Infosecurity Magazine (2017): WikiLeaks: CIA Secret Exploits Target Car Hacking, Smart TVs', url: 'https://www.infosecurity-magazine.com/news/wikileaks-secret-exploits-target/' },
      { label: 'CSO Online (2017): Newer car tech opens doors to CIA attacks', url: 'https://www.csoonline.com/article/560557/cias-exploration-of-zero-day-attacks-against-vehicles-isnt-a-first.html' },
      S.wiki,
      S.ciaStatement,
    ],
    flow: {
      data: 'Control of the vehicle\'s computer systems',
      from: ['Cars and trucks'],
      to: ['CIA'],
      sharedWith: [],
      authority: CIA_AUTHORITY,
      when: 'The purpose "is not specified" in the documents',
      checkedBy: CIA_CHECK,
    },
  },
]);
