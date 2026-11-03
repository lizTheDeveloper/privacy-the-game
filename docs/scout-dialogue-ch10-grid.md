# Scout Dialogue — Chapter 10: The Grid

> **Wired in v7.13.0** as `DISTRICT_DIALOGUE.grid` in `src/data/dialogue.js`, cut to what the Grid missions' own briefings support. Left out because the missions don't support them: Ring's "2,000 police departments", Wyze "hid it for two years" (the missions say Wyze disclosed the 2019 exposure within days; the long silence was an unpatched camera flaw reported in 2022), the Amazon–iRobot deal, and the Nest Guard microphone. The shipped lines are the source of truth; this draft is history.

> Smart Home & IoT Devices
> Tone: Scout is unnerved. The call is coming from inside the house.
> Warm underneath, but genuinely unsettled by what people volunteered to install.

---

## 1. District Intro

**`district_intro`**

> You secured the perimeter. You locked down your accounts. You hardened your phone and your computer. Now look around your house. The call is coming from inside the building. Your TV is watching what you watch. Your voice assistant is recording what you say. Your doorbell camera is feeding a police surveillance network. Your robot vacuum mapped your house and sold the floor plan. You invited every one of these devices in. They came in friendly packaging, with friendly setup wizards, and friendly terms of service that said "we collect data to improve your experience." Your experience. Let's find out what they're actually collecting and shut the pipes that don't need to be open.

---

## 2. Facility Intros

**`facility_intro_smart_tv`**

> ACR -- Automatic Content Recognition. Your TV fingerprints what's on screen several times per second and matches it against a database. It knows what you watch on Netflix, what you watch on cable, and what you watch on a USB drive. Vizio got caught doing this without consent -- $2.2 million FTC fine. Every other manufacturer learned from that and started putting consent in the terms of service nobody reads. The setting is buried, and it's different on every brand. We're going to find it and turn it off.

**`facility_intro_voice_assistant`**

> In 2019, Bloomberg revealed that Amazon employs thousands of people worldwide to listen to Alexa recordings. They called them "annotators." They heard family arguments, medical conversations, and at least two incidents that sounded like assaults. Google and Apple had similar programs. They've since added opt-outs, but the default is still to save your recordings. Your voice assistant remembers everything you've said to it since the day you set it up.

**`facility_intro_smart_camera`**

> Ring has partnerships with over 2,000 police departments. Through the Neighbors app and direct law enforcement requests, your doorbell footage feeds a neighborhood surveillance network you didn't sign up for. In 2022, Ring admitted it handed footage to police without user consent 11 times in "emergency" situations. Wyze had a data breach exposing 2.4 million users and hid it for two years. These cameras were sold as security devices. Time to make sure they're securing you, not surveilling you.

**`facility_intro_smart_appliances`**

> Amazon bought iRobot -- the Roomba company -- for $1.7 billion. They already had your shopping history, your voice recordings, and your doorbell camera. The acquisition adds the floor plan of your house. Room dimensions. Furniture placement. Where the couch is relative to the TV. That's not a vacuum cleaner purchase. That's a spatial data acquisition. Your smart thermostat knows your daily schedule. Your baby monitor streams to the cloud. Let's find out what's on your network and what it's sending.

**`facility_intro_smart_network`**

> Every other facility in this district connects through one thing: your router. If your router's admin password is still "admin," or if WPS is enabled, or if UPnP is on, then none of the other work matters. A compromised router gives an attacker access to every device in your house. This is the foundation. We start here.

---

## 3. Debrief Reactions

### Device Audit Results

**`debrief_no_issues_1`**

> Already locked down. Either you're ahead of the curve or you read the privacy settings before accepting them. Both are rare. Well done.

**`debrief_no_issues_2`**

> Clean. No unexpected data collection. In this district, that's actually surprising -- the defaults are always set to maximum extraction.

**`debrief_some_issues_1`**

> Found some settings to change. That's the normal result -- every device ships with everything on. The manufacturer's incentive is to collect as much as possible and make the opt-out hard to find. You found it.

**`debrief_some_issues_2`**

> Some data collection active. Now it's not. The thing about IoT privacy settings is that they never turn themselves off -- you have to find them, every time, on every device.

**`debrief_major_issues_1`**

> Significant collection happening. Your devices were building a detailed profile of your daily life -- what you watch, what you say, who comes to your door, when you're home and when you're not. That pipeline is closed now.

**`debrief_major_issues_2`**

> Full data collection was active across the board. The good news: every setting you changed takes effect immediately. The devices don't argue. They just stop sending. The bad news: the data they already collected is on their servers. Some of it can be deleted, some can't.

### Action Completions

**`debrief_completed_1`**

> Done. One more device secured. Your house gets quieter every mission -- not in volume, in data transmission.

**`debrief_completed_2`**

> Locked down. The device still works. It just stopped reporting on you. That's always the thing that surprises people -- you can have smart features without the surveillance.

**`debrief_not_applicable_1`**

> Don't have this device? That's actually the most private option. Can't surveil you from hardware that doesn't exist.

**`debrief_not_applicable_2`**

> No device, no data. You passed this test before it started.

**`debrief_skip_1`**

> No problem. The device will still be here tomorrow. So will its data collection. Come back when you have the remote in hand.

**`debrief_skip_2`**

> Parking this one. Some of these missions need you physically at the device with the settings open. Come back when you're home and have a few minutes.

---

## 4. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter through The Grid. You've started shutting down the surveillance devices in your own house. Most people never get this far -- they don't even realize their TV is watching them. You do now.

**`progress_25_alt`**

> 25% secured. The first devices are locked down. Every one you fix makes the rest of your house safer -- a compromised device on the same network as your laptop is a bridge the attacker didn't have to build.

### 50% Complete

**`progress_50`**

> Halfway through The Grid. Your house is measurably less surveilled than it was when you started. The voice recordings are gone, the camera access is audited, the TV has stopped fingerprinting your screen. This is what privacy looks like in a smart home -- not unplugging everything, but controlling what each device is allowed to share.

**`progress_50_alt`**

> 50% secured. Half the grid is liberated. The other half is still phoning home, but the foundation is set -- your router is secure, your network is isolated, and the devices you've fixed stay fixed.

### 75% Complete

**`progress_75`**

> Three-quarters done. The Grid is almost clean. A few more settings to change, a few more pipes to close. Your house has gone from a surveillance apartment to a home that happens to have smart features.

**`progress_75_alt`**

> 75%. You've secured more IoT devices than most security professionals bother with. The remaining missions are the fine tuning -- DNS encryption, the last few app permissions, the devices you forgot were connected.

### District Complete

**`progress_complete`**

> The Grid is secured. Every smart device in your house has been audited, locked down, and isolated. Your TV watches what you watch, not what it reports to advertisers. Your voice assistant deletes what it hears. Your cameras work for you, not for Amazon's police partnerships. Your router is fortified. Your network is segmented. Your DNS is encrypted. You turned a surveillance apartment into a home. Most people live their entire lives without doing what you just did. The devices haven't changed. Your relationship to them has.

**`progress_complete_alt`**

> District ten: secured. The Grid is yours. You brought surveillance devices into your home because they were convenient. Now they're still convenient -- they just stopped spying on you. That's the whole point of this city. You don't have to unplug from the modern world. You just have to control what it takes from you.

---

## 5. Idle / Return Lines

**`return_short`** *(gone < 1 day)*

> Back already. Your devices missed you. Or more accurately, their servers missed your data. Ready for the next mission?

**`return_medium`** *(gone 1-3 days)*

> Welcome back. Your house has been quietly collecting data while you were away. The devices you already secured are still secured -- let's keep going.

**`return_long`** *(gone 4-7 days)*

> You're back. The Grid waited. Everything you secured is still locked down -- these settings don't un-set themselves. The devices you haven't reached yet are still phoning home, but that's what today is for.

**`return_very_long`** *(gone 7+ days)*

> Hey. It's been a while, but the work you did holds. Every setting you changed is still in effect. The Grid is patient -- your devices are still here, still connected, still worth securing. Pick up where you left off.

**`return_idle_1`**

> Your smart home is %PERCENT%% secured. One more mission and another device stops reporting on you.

**`return_idle_2`**

> Still here? Good. Every minute you spend on this is a minute your devices aren't sending data you didn't approve.

---

## 6. Lore

### `lore_amazon_acquisition`

> Amazon owns Ring (doorbell cameras), iRobot (Roomba vacuums), Alexa (voice assistant), and the largest e-commerce platform on earth. One company now has your doorbell footage, the floor plan of your house, recordings of your voice, and your complete purchase history. They can cross-reference all of it. The iRobot acquisition was ultimately blocked by EU regulators on antitrust grounds, but Amazon kept all the data-sharing agreements.

### `lore_vizio_ftc`

> In 2017, Vizio paid $2.2 million to the FTC for collecting viewing data on 11 million TVs without consumer consent. The TVs used ACR to identify what was on screen and transmitted the data alongside the viewer's IP address, MAC address, and Wi-Fi details. The FTC's complaint noted that Vizio shared this data with third parties who appended it with demographic information -- age, gender, income, marital status -- to build viewer profiles for targeted advertising.

### `lore_alexa_listeners`

> Bloomberg's 2019 investigation revealed that Amazon employed thousands of people worldwide to listen to Alexa recordings. Workers in offices from Boston to Costa Rica to Romania transcribed and annotated voice recordings that Alexa captured in people's homes. They overheard what they described as a woman singing in the shower, a child screaming for help, and at least two cases that sounded like sexual assault. Amazon said the workers "do not have direct access to information that can identify the person or account," but workers told Bloomberg they had access to the account number and the device's serial number.

### `lore_wyze_breach`

> In December 2019, a Wyze database was exposed containing the personal data of 2.4 million customers -- email addresses, Wi-Fi network names, and camera information. Wyze didn't publicly acknowledge the breach until security researchers published their findings. The company had known about the exposure for weeks. Wyze later suffered a second breach in 2023 when a server misconfiguration allowed approximately 13,000 users to briefly see thumbnails from other users' cameras.

### `lore_google_nest_microphone`

> In 2019, Google acknowledged that its Nest Guard home security device contained a built-in microphone that was never disclosed in any marketing materials or product specifications. Google said the microphone was "never intended to be a secret" and was included so that future software updates could add voice assistant features. The microphone had been in the device since its launch in 2017.

---

## 7. Allied Organizations

**`allies`**

> You're not doing this alone. These organizations have been fighting for your right to control what happens in your own home:

> **EFF (Electronic Frontier Foundation)** -- [eff.org](https://www.eff.org/) -- They've been on every IoT privacy case. Their "Who Has Your Back" report grades companies on how they handle law enforcement requests for user data. Ring consistently gets the lowest marks.

> **Fight for the Future** -- [fightforthefuture.org](https://www.fightforthefuture.org/) -- They led the campaign against Amazon's doorbell-to-police pipeline and organized the coalition that pushed Ring to add the opt-out for law enforcement video requests.

> **Mozilla Foundation** -- [mozillafoundation.org](https://www.mozillafoundation.org/) -- Their "*Privacy Not Included" guide reviews smart devices for privacy and security. It's the Consumer Reports of IoT privacy -- check it before you buy your next smart device.

> **iFixit** -- [ifixit.com](https://www.ifixit.com/) -- Right to repair advocates. When you can't open, inspect, or modify a device, you can't verify what it's doing. The right to repair is a privacy right.
