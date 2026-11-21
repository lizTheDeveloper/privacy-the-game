// Simple mode's words for each leak badge (Liz 2026-11-21, the layout review's last pick). Spy code
// names (MUSCULAR, TURBINE, DISHFIRE...) mean nothing to most players, so in Simple a badge says
// what the program did, in plain words, and its page opens with one sentence about it. The code name
// still shows, small, under the plain name on the badge's own page. Advanced keeps the code names.
//
// Every plain name and sentence is said from the entry's own summary and sources (the group files):
// nothing here goes further than they do. A badge that is already plain words (GM SOLD DRIVING,
// TV WATCHED YOU) keeps its badge and only gets the sentence. Each sentence names who did it.
//
// badge: the Simple badge (at most 24 characters). lead: the page's one plain sentence.
export const LEAK_SIMPLE = Object.freeze({
  prism: { badge: 'NSA GETS COMPANY DATA', lead: 'The NSA could get emails, chats and photos straight from nine big companies, including Google, Apple, Microsoft and Facebook.' },

  // The Snowden files
  muscular: { badge: 'TAPPED GOOGLE & YAHOO', lead: 'The NSA and Britain’s GCHQ secretly tapped the links between Google’s and Yahoo’s data centers and copied millions of records a day.' },
  'optic-nerve': { badge: 'WEBCAM PHOTOS TAKEN', lead: 'Britain’s GCHQ, with the NSA’s help, saved pictures from millions of people’s Yahoo webcam chats, whether or not they were suspects.' },
  'microsoft-nsa': { badge: 'MICROSOFT HELPED NSA', lead: 'Microsoft helped the NSA and the FBI get around its own encryption to read Outlook.com chats, and to reach OneDrive.' },
  'leaky-apps': { badge: 'NSA READS APP DATA', lead: 'The NSA and Britain’s GCHQ copy what phone apps send over the internet: address books, call logs and where your photos were taken.' },
  'squeaky-dolphin': { badge: 'UK SPIES WATCHED LIKES', lead: 'Britain’s GCHQ showed the NSA it could watch, as it happened, what people viewed on YouTube and liked on Facebook.' },
  turbine: { badge: 'NSA MASS HACKING', lead: 'The NSA built a system that hacks computers by the million, automatically, instead of one at a time.' },
  'cookie-selectors': { badge: 'NSA USES AD COOKIES', lead: 'The NSA uses the tracking cookies that Google, Facebook and others set for advertisers to pick out people to hack.' },
  'quantum-linkedin': { lead: 'Britain’s GCHQ sent telecom engineers fake copies of their own LinkedIn pages that infected their computers.' },
  xkeyscore: { badge: 'NSA SEARCH ENGINE', lead: 'The NSA’s search tool lets its analysts read emails, chats and browsing history without asking anyone first.' },
  fairview: { badge: 'AT&T HELPED NSA', lead: 'For decades AT&T has given the NSA access to billions of emails crossing its network, and put NSA equipment in its buildings.' },
  'verizon-215': { badge: 'ALL VERIZON CALL LOGS', lead: 'A secret court ordered Verizon to give the NSA, every day, the records of all its customers’ calls: who called whom, when and for how long.' },
  tempora: { badge: 'UK CABLE TAPS', lead: 'Britain’s GCHQ taps the cables that carry the world’s calls and internet traffic, keeps it for up to 30 days and shares it with the NSA.' },
  'gemalto-sim-heist': { badge: 'SIM CARD KEYS STOLEN', lead: 'The NSA and Britain’s GCHQ hacked the world’s biggest SIM card maker and stole the keys that protect phone calls and data.' },
  'address-books': { badge: 'NSA TAKES CONTACTS', lead: 'The NSA copies email address books and chat contact lists in bulk as phones sync them with Yahoo, Facebook and Google.' },
  'co-traveler': { badge: 'NSA PHONE TRACKING', lead: 'The NSA collects nearly five billion records a day of where cellphones are, American phones included.' },
  dishfire: { badge: 'NSA TAKES TEXTS', lead: 'The NSA collects almost 200 million text messages a day and mines them for where people are, who they know and their card details.' },
  'smartphone-hacking': { badge: 'NSA PHONE HACKERS', lead: 'The NSA and Britain’s GCHQ set up teams to break into iPhones, Android phones and BlackBerrys and read contacts and locations.' },
  'ant-catalog': { lead: 'The NSA has a catalog of tools that break into phones, computers and routers. Some survive wiping the computer.' },
  'router-interdiction': { badge: 'ROUTERS BUGGED', lead: 'The NSA intercepts routers shipped from the US, plants spy tools in them, reseals the box and sends them on.' },

  // Vault 7 (the CIA)
  'vault-7': { badge: 'CIA HACKING TOOLS', lead: 'WikiLeaks published the CIA’s tools for hacking iPhones, Android phones, Windows computers and Samsung TVs.' },
  'weeping-angel': { badge: 'TV LISTENS WHEN OFF', lead: 'The CIA and Britain’s MI5 built a tool that makes a Samsung TV look switched off while its microphone records the room.' },
  'cherry-blossom': { badge: 'CIA ROUTER HACK', lead: 'The CIA built software that takes over home Wi-Fi routers, from brands like D-Link and Linksys, and watches what goes through them.' },
  'dark-matter': { badge: 'CIA MAC HACKS', lead: 'The CIA built tools that infect Apple Macs so deeply that reinstalling the system doesn’t remove them.' },
  'cia-phone-hacking': { lead: 'The CIA built attacks that take over phones, send it your location, calls and messages, and switch on the camera and microphone.' },
  'before-encryption': { badge: 'CIA READS YOUR PHONE', lead: 'The CIA doesn’t break WhatsApp’s, Signal’s or Telegram’s encryption. It hacks the phone and takes the messages before they are locked.' },
  highrise: { badge: 'CIA TAKES TEXTS', lead: 'The CIA built a fake Android app that copies text messages and sends them to the CIA over the internet.' },
  scribbles: { badge: 'CIA DOCUMENT TRACKER', lead: 'The CIA hides tags in Word files that tell it when a leaker or a journalist opens a copy.' },
  athena: { badge: 'CIA WINDOWS SPYWARE', lead: 'The CIA built spyware for every Windows from XP to Windows 10 that reports back to the CIA and runs whatever it is sent.' },
  grasshopper: { badge: 'CIA SPYWARE KIT', lead: 'The CIA has a kit for building Windows spyware that checks your computer first and installs only where it will work.' },
  aftermidnight: { badge: 'CIA HIDDEN SPYWARE', lead: 'The CIA built Windows spyware that pretends to be part of Windows and fetches new hidden tools from the CIA on a schedule.' },
  elsa: { badge: 'CIA LAPTOP TRACKER', lead: 'The CIA built spyware that tracks where a Windows laptop goes by recording the Wi-Fi networks around it.' },
  couchpotato: { badge: 'CIA TAKES CAMERA VIDEO', lead: 'The CIA built a tool that collects the video from internet-connected security cameras.' },
  'cia-vehicles': { badge: 'CIA LOOKED AT CARS', lead: 'In 2014 the CIA listed hacking the control systems of cars and trucks as work it might take on.' },

  // Location data
  'weather-channel-la': { badge: 'LA SUED WEATHER APP', lead: 'Los Angeles sued the owner of The Weather Channel app for tracking people closely, even with the app closed, and passing it on for ads.' },
  'accuweather-reveal': { badge: 'ACCUWEATHER TRACKED', lead: 'A researcher caught the AccuWeather app sending people’s location to a company that makes money from it, even with location sharing off.' },
  venntel: { badge: 'LOCATION SOLD TO ICE', lead: 'ICE, Homeland Security, the FBI, the IRS and the DEA buy phone locations taken from ordinary apps, like games and weather apps.' },
  'babel-street-locate-x': { badge: 'PHONE TRACKER FOR SALE', lead: 'Babel Street sells agencies like ICE a map where they can draw a shape, see every phone inside it and follow one around.' },
  'fog-reveal': { badge: 'POLICE BUY LOCATION', lead: 'Police buy a search engine over location data from 250 million phones, often searching without a warrant.' },
  'x-mode-military': { badge: 'SOLD TO THE MILITARY', lead: 'X-Mode paid apps to collect where their users went, then sold it to U.S. military contractors.' },
  'gravy-breach': { badge: 'LOCATION BROKER HACKED', lead: 'Hackers stole files from Gravy Analytics, which sells phone locations to ICE and the FBI: millions of locations, each tagged with the app it came from.' },
  'ftc-gravy-venntel': { badge: 'FTC BARRED GRAVY', lead: 'The FTC found Gravy Analytics and Venntel sold people’s locations without consent, including visits to clinics and places of worship.' },
  'ftc-mobilewalla': { badge: 'FTC BARRED MOBILEWALLA', lead: 'Mobilewalla kept people’s locations from ad auctions, even ones it lost, and sold them. The FTC barred it from selling sensitive locations.' },
  'ftc-kochava': { badge: 'FTC SUED KOCHAVA', lead: 'The FTC sued the data broker Kochava for selling locations from hundreds of millions of phones, including visits to health clinics.' },
  'ftc-inmarket': { badge: 'FTC BANNED INMARKET', lead: 'InMarket took people’s locations through shopping apps and sorted them into groups to sell. The FTC banned it from selling locations.' },

  // Courts, carriers and police
  'aclu-v-clapper': { badge: 'NSA CALL LOGS ILLEGAL', lead: 'The ACLU sued over the NSA collecting every Verizon call record, and in 2015 a federal appeals court said the law never allowed it.' },
  'hepting-v-att': { badge: 'AT&T SECRET ROOM', lead: 'EFF sued AT&T for copying its customers’ internet traffic into a secret NSA room in San Francisco.' },
  'jewel-v-nsa': { badge: 'CUSTOMERS SUED NSA', lead: 'EFF sued the NSA for AT&T customers over the spying. The courts never ruled on whether it was legal.' },
  carpenter: { badge: 'WARRANT FOR LOCATION', lead: 'In 2018 the Supreme Court said police need a warrant to get your phone’s location history from your carrier.' },
  'carrier-location-sales': { lead: 'AT&T, Sprint, T-Mobile and Verizon sold their customers’ locations. A bounty hunter found a reporter’s phone for $300.' },
  hemisphere: { badge: 'AT&T CALLS FOR POLICE', lead: 'AT&T keeps call records back to 1987 and searches them for police, usually without a warrant, paid for by the White House drug office.' },
  'ring-police': { badge: 'RING GAVE POLICE VIDEO', lead: 'Amazon’s Ring gave police people’s camera video without a warrant or the owner’s consent, 11 times in the first seven months of 2022.' },
  'ring-employee-access': { lead: 'The FTC charged that Amazon’s Ring let any employee watch customers’ private videos. One watched thousands, from bedrooms and bathrooms.' },
  'alexa-kids-recordings': { lead: 'The FTC and the Justice Department charged that Amazon kept children’s Alexa recordings forever and used them to improve Alexa.' },
  'vizio-acr': { lead: 'Vizio recorded what 11 million of its TVs showed, second by second, without telling their owners, and sold it for ads.' },
  'gm-smart-driver': { lead: 'GM collected how millions of people drive and sold it to LexisNexis and Verisk, whose reports insurers used to set prices and deny cover.' },
  'verisk-driving-data': { lead: 'Hyundai and Honda sold their drivers’ data to Verisk, which turned it into driving reports for insurance companies.' },
  'geofence-warrants': { badge: 'GOOGLE LOCATION SEARCH', lead: 'Police get warrants that make Google search for every phone that was inside a circle on a map.' },
  stingrays: { badge: 'FAKE CELL TOWERS', lead: 'The FBI, ICE and local police use fake cell towers that make every phone nearby give up its location and identity.' },
  'tower-dumps': { badge: 'EVERY PHONE ON A TOWER', lead: 'Police can get the number of every phone that used a cell tower during a stretch of time, often tens of thousands at once.' },
  'atlas-of-surveillance': { badge: 'POLICE SPY TECH MAP', lead: 'EFF and a university map which police use drones, face recognition, fake cell towers and other spy tech, town by town.' },
  'tesla-camera-sharing': { lead: 'Tesla employees passed around private videos from customers’ car cameras in internal chats, nine former employees said.' },
});
