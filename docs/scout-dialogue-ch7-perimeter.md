# Scout Dialogue — Chapter 7: The Perimeter

> Borders & scam defense
> Tone: tactical field operative. Scout has seen what happens when defenses fail.
> Lore woven throughout — real cases, real laws, real organizations fighting back.

---

## 1. District Intro

**`district_intro`**

> Everything you've done so far — the passwords, the 2FA, the privacy settings — protects individual buildings. The Perimeter protects the city itself. These are the outer walls: the defenses that don't belong to any one account but shield all of them. SIM protection stops an attacker from hijacking your phone number and bypassing every lock you set. Device security means a stolen laptop gives the thief expensive hardware and zero data. Scam defense trains the one vulnerability no software can patch — you. And border crossing prep ensures that when you walk through customs, your entire digital life isn't handed over because someone asked you to unlock your phone. This district is different. There's no survey, no accounts to check off. Every mission here applies to you. Let's fortify the walls.

---

## 2. Facility Intros

### SIM Protection

**`facility_intro_sim_protection`**

> In 2023, the DOJ prosecuted a SIM swap ring that stole $400 million in cryptocurrency. The attack is simple: someone calls your carrier, convinces a customer service rep they're you, and transfers your phone number to their SIM card. Your phone goes dead. Their phone starts receiving your two-factor codes. The whole thing takes fifteen minutes. Carriers have gotten better at catching this, but the defense that actually works is a carrier PIN and a port-out lock — two settings that take five minutes to set up and make this attack dramatically harder.

### Device Security

**`facility_intro_device_security`**

> In 2021, Apple sued NSO Group for deploying Pegasus spyware on iPhones — zero-click exploits that required no interaction from the target. Pegasus was used by governments against journalists, human rights lawyers, and political dissidents. Citizen Lab at the University of Toronto was the research group that exposed it. You probably aren't a target of state-sponsored spyware. But you are a target of the mundane version: a stolen phone at a coffee shop, a laptop left on a bus, a device searched at a border checkpoint. Full-disk encryption, a strong lock screen, and Find My are the basics that make a stolen device useless to whoever takes it.

### Scam Defense

**`facility_intro_scam_defense`**

> The hard part about phishing isn't the obvious fakes. It's the real messages that look fake. Microsoft sends legitimate security alerts from accountprotection.microsoft.com — a domain that sounds made up. T-Mobile's real SIM change alerts come from a short code most people wouldn't recognize. The training here shows you both kinds, and the skill you're building is the pause before the click — the habit of checking the domain, hovering the link, and going to the site directly instead of following the email. That three-second pause is worth more than any software filter.

### Border Crossing

**`facility_intro_border_crossing`**

> U.S. Customs and Border Protection claims the authority to search any electronic device at the border without a warrant. In 2024, CBP searched over 43,000 devices. Riley v. California — the 2014 Supreme Court ruling that police need a warrant to search your phone — explicitly does not apply at the border. The legal justification is that border searches are a national security exception to the Fourth Amendment. This is not a hypothetical risk. Journalists, lawyers, and activists have had their devices searched, copied, and retained. The defense isn't legal — it's operational. You travel with a clean device. Your real accounts are logged out and recoverable through a separate, clean email. The device someone inspects shows a phone with normal apps and nothing sensitive. This is the same practice used by investigative journalists worldwide. It is legal, it is ethical, and it is the only reliable protection at a border.

**`facility_intro_border_crossing_legal`**

> To be clear: having a clean phone is not deception. You are not obligated to carry your personal data across a border. You are not required to have your real email logged in on the device you travel with. The ACLU and EFF both publish guides recommending exactly this approach. If you are asked to unlock your device and you are a U.S. citizen, you cannot be denied entry for refusing — but you can be detained, and your device can be confiscated. A clean device makes the question irrelevant.

---

## 3. Lore Entries

These are standalone lore blocks Scout delivers at key moments — after completing a facility, during progress check-ins, or as unlockable intel.

### `lore_carpenter`

> In 2018, the Supreme Court ruled in Carpenter v. United States that the government needs a warrant to access cell phone location data. Before that ruling, police could get months of your location history from your carrier with just a subpoena — no judge needed. Chief Justice Roberts wrote that a phone "faithfully follows its owner beyond public thoroughfares and into private residences, doctor's offices, political headquarters, and other potentially revealing locales." The vote was 5-4. One vote the other way and your location history would be available to any law enforcement agency that asked your carrier nicely. Carpenter didn't fix everything — it doesn't cover data brokers who sell location data commercially — but it drew a line.

### `lore_pegasus`

> NSO Group is an Israeli surveillance company that sells Pegasus spyware to governments. Pegasus can take over a phone with zero clicks — no link to tap, no file to open. It reads your messages, activates your camera and microphone, and exfiltrates your data silently. It has been found on the phones of journalists investigating cartels in Mexico, human rights workers in Saudi Arabia, opposition politicians in Hungary, and lawyers at the Hague. In 2021, Apple sued NSO Group. In 2023, President Biden signed an executive order restricting U.S. government use of commercial spyware. Citizen Lab — a research group at the University of Toronto — is the team that identified and documented most of Pegasus's deployments. They do this by analyzing the phones of targeted individuals who come to them for help. Their work is the reason we know any of this.

### `lore_signal`

> Signal is an encrypted messenger run by a nonprofit foundation. It stores almost nothing — not your contacts, not your messages, not your profile. When a grand jury subpoenaed Signal's records in 2016, the only data Signal could produce was the date each account was created and the date it last connected. That's it. No message content, no contacts, no groups. Meredith Whittaker, Signal's president, has testified to Congress against proposals for encryption backdoors, arguing that a backdoor for law enforcement is a backdoor for everyone. Signal runs on donations. It has no investors, no ad revenue, no data to sell. If you use it, consider supporting it.

### `lore_sim_swap_cases`

> SIM swapping went from a niche attack to a federal priority after a string of massive thefts. In 2024, a 20-year-old was sentenced to five years for SIM-swapping attacks that stole $1 million in cryptocurrency. A Canadian teenager was charged with stealing $36 million via SIM swaps targeting crypto investors. The FBI's Internet Crime Complaint Center received over 2,000 SIM swap complaints in 2023 alone, with losses exceeding $68 million. The attack surface is the carrier's customer service — social engineering a rep into transferring your number. Your defense is making that social engineering fail: a unique PIN, a port-out lock, and — critically — not relying on SMS for two-factor on high-value accounts.

### `lore_allies_perimeter`

> You're not fortifying these walls alone. These organizations have been fighting for digital rights for decades:
>
> **EFF (Electronic Frontier Foundation)** — eff.org — The oldest digital rights organization. Founded in 1990. They've been in every fight on this list: Carpenter, Pegasus, encryption backdoors, border device searches. Donate at eff.org.
>
> **ACLU** — aclu.org — They litigate the constitutional cases. Their technology and civil liberties project focuses on surveillance, privacy, and free speech online. Donate at aclu.org.
>
> **Signal Foundation** — signal.org/donate — The encrypted messenger that refuses to compromise. Every donation keeps it free, ad-free, and subpoena-proof.
>
> **Citizen Lab** — citizenlab.ca — The researchers at the University of Toronto who exposed Pegasus, documented government surveillance worldwide, and gave targeted individuals the forensic tools to know they'd been compromised. Support their work at citizenlab.ca.

---

## 4. Debrief Reactions

### Action Completed

**`debrief_action_done_1`**

> Wall reinforced. That's one more layer between you and whoever's trying to get in.

**`debrief_action_done_2`**

> Done. This is the kind of thing most people never do because nobody tells them it's possible. You just did it in ten minutes.

**`debrief_action_done_3`**

> Secured. The Perimeter is stronger than it was five minutes ago. That's not a metaphor — that's a literal description of what just happened.

### Already Done

**`debrief_already_done_1`**

> Already handled. You came in with your walls up. I respect that.

**`debrief_already_done_2`**

> Already in place. Someone's been paying attention. Marking it and moving on.

### Doesn't Apply

**`debrief_not_applicable_1`**

> Noted. Not everyone needs every wall. Skip what doesn't fit.

**`debrief_not_applicable_2`**

> Fair enough. This one's situational. The missions that do apply to you matter more than checking every box.

### Skip / Come Back Later

**`debrief_skip_1`**

> No pressure. The Perimeter doesn't move. These walls will be here when you're ready to build them.

**`debrief_skip_2`**

> Queued for later. Some of these need a laptop, some need your phone, some need five uninterrupted minutes. Come back when you've got the right setup.

**`debrief_skip_3`**

> Understood. The Perimeter is patient. Your data brokers are not — but that's The Reclamation's problem. We'll get there.

### Phishing Quiz — Correct

**`debrief_quiz_correct_1`**

> Sharp eye. You spotted the tell. That three-second pause before clicking is worth more than any spam filter.

**`debrief_quiz_correct_2`**

> Correct. You noticed the domain. That's the skill — not the answer to this specific message, but the habit of checking before clicking. Every. Single. Time.

**`debrief_quiz_correct_3`**

> Got it. The hard part about this training is that the real messages look sketchier than the fakes sometimes. You're calibrating your instincts, not memorizing a list.

### Phishing Quiz — Wrong

**`debrief_quiz_wrong_1`**

> That one trips people up. The tell was in the domain — check the part after the @ and compare it to the company's actual website. That mismatch is the flag.

**`debrief_quiz_wrong_2`**

> Missed this one. Don't worry — the whole point of training is getting it wrong here instead of getting it wrong when it counts. Read the tells and carry them forward.

**`debrief_quiz_wrong_3`**

> Wrong call, but now you know what to look for. The real messages are often the harder ones — legitimate companies send alerts from subdomains that sound fake. That ambiguity is what attackers exploit.

---

## 5. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter of The Perimeter fortified. The phone number lock and device hardening are the foundation — everything else builds on them.

**`progress_25_alt`**

> 25% through. You've already done the most urgent thing — SIM protection. The rest of The Perimeter is defensive depth.

### 50% Complete

**`progress_50`**

> Halfway through The Perimeter. Your devices are hardened, your phone number is locked. Now we train the human element — because the cleverest phishing email targets the person, not the software.

**`progress_50_alt`**

> 50% fortified. The walls are going up. The scam defense training is next — the one part of security that no app can do for you.

### 75% Complete

**`progress_75`**

> Three-quarters done. The outer walls are solid. If you're someone who crosses borders — or might someday — the crossing prep is worth doing now, before you need it. If not, you're nearly done.

**`progress_75_alt`**

> 75%. The Perimeter is holding. Most people never think about these defenses until something goes wrong. You're building them before that happens. That's the whole point.

### District Complete

**`progress_complete`**

> The Perimeter is fully fortified. Phone number locked, devices hardened, phishing instincts calibrated, border prep complete. These aren't account-level defenses — these are the walls that protect the whole city. Everything inside is safer because of what you just built. One district left: The Reclamation. That's where you stop playing defense and start taking your data back.

**`progress_complete_alt`**

> Perimeter: done. You've built the outer walls. SIM-swappers bounce off the carrier PIN. A stolen device gives up nothing. Phishing emails trigger a pause instead of a click. And if you ever walk through customs, your real life isn't on the device they search. Now — The Reclamation. The endgame. Time to go after the brokers.

---

## 6. Idle / Return Lines

**`return_short`** *(gone < 1 day)*

> Back already. The Perimeter's right where you left it — walls don't wander.

**`return_medium`** *(gone 1-3 days)*

> Welcome back. Your walls are still standing. The next mission is queued — grab whatever device you need and let's go.

**`return_long`** *(gone 4-7 days)*

> You're back. For what it's worth, every defense you've set up is still working. The carrier PIN didn't expire, the encryption didn't turn off, and the phishing emails got no less annoying. Pick up where you left off.

**`return_very_long`** *(gone 7+ days)*

> Hey. The Perimeter held. That's the thing about these defenses — they work while you're away. Your phone number is still locked, your devices are still encrypted, and the skills you built in scam defense don't have an expiration date. Ready to keep going?

**`return_idle_check_1`**

> The Perimeter is %PERCENT%% fortified. One more mission puts another wall up. Most of these take under ten minutes.

**`return_idle_check_2`**

> Still here? The next Perimeter mission is waiting. The walls don't build themselves — but they stay up once you build them.
