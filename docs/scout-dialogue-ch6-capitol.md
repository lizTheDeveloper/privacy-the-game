# Scout Dialogue — Chapter 6: The Capitol

> Government accounts — SSA, IRS, DMV, healthcare, student loans  
> Tone: cyberpunk deadpan, warm underneath, never shaming.  
> Scout treats government identity as the final layer — compromise here is identity theft in its original, legal sense.

---

## 1. District Intro

**`district_intro`**

> Welcome to The Capitol. This is where your legal identity lives — Social Security, tax records, your driver's license number, healthcare data, student loans. Every other district was about protecting your digital life. This one is about protecting your identity in the eyes of the law. When someone files a tax return in your name and collects your refund, that's not a nuisance — that's a federal crime committed against you, and you're the one who spends six months on the phone with the IRS proving you exist. The defense here is different: it's not just about securing accounts, it's about claiming them before someone else does.

**`district_intro_lore`**

> Some history you should know. In 2015, the Office of Personnel Management — the agency that does background checks on federal employees — was breached. 22 million records stolen. Not just names and Social Security numbers. Full SF-86 security clearance forms: every address you've lived at, every foreign contact, every financial problem, your mental health history, your relatives. And fingerprints — 5.6 million fingerprints. You can change a password. You cannot change your fingerprints.
>
> The attackers were never caught. The data was never recovered. Those 22 million federal employees and their families have been living with that exposure for over a decade. That's what government data breaches look like — not a password reset, but a permanent alteration of your risk profile.
>
> The organizations fighting to make sure this doesn't keep happening: [EPIC (Electronic Privacy Information Center)](https://epic.org/) has been suing federal agencies over data collection practices since the 1990s. The [ACLU](https://www.aclu.org/) fights surveillance at every level of government. These are the freedom fighters of The Capitol. We're going to do our part right now.

---

## 2. Debrief Reactions

### Account Claimed Successfully (Capitol-specific)

**`debrief_claimed_1`**

> Account registered. This is more important than it sounds. Before today, anyone with your Social Security number could have created this account and locked you out of your own government records. Now that door is closed. You got there first.

**`debrief_claimed_2`**

> You've claimed your account. Here's the thing about government portals: unlike Gmail, you don't get to create a second one if someone takes the first. One SSN, one account. Whoever registers first owns the login. Today, that's you.

**`debrief_claimed_3`**

> Account secured. Fun fact: the IRS Identity Protection PIN program exists because so many people were having fraudulent tax returns filed in their name that the IRS had to build an entirely new system to stop it. The fraud was so widespread they stopped calling it a wave and started calling it an epidemic. Your PIN is your vaccine.

---

### Account Already Claimed

**`debrief_already_claimed_1`**

> Already registered. Smart. A lot of people don't create their government accounts until they need them — and then discover someone else got there first with a stolen SSN. You avoided that.

**`debrief_already_claimed_2`**

> Account was already set up. You're one of the people who didn't wait for a crisis to register. That's the kind of foresight that makes The Capitol easier to liberate.

---

### No Breaches Found (Clean)

**`debrief_clean_1`**

> Clean. No breaches on your government credentials. Given what these accounts protect — your legal identity, your tax records, your benefits — that's the best possible outcome. Let's keep it that way.

**`debrief_clean_2`**

> No exposure found. Your government login isn't circulating. That's significant — a breached SSA credential doesn't just risk your data, it risks your Social Security benefits, your Medicare, your entire federal identity.

**`debrief_clean_3`**

> All clear. Your government credentials are off the market. In a world where Social Security numbers sell for $1 each on the dark web, keeping the login credentials separate and clean is the real defense.

---

### Found in 1–2 Breaches

**`debrief_minor_breach_1`**

> Some exposure. With government accounts, even indirect exposure matters. Your Social Security number was never designed to be a secret — it has no checksum, no verification mechanism, no way to confirm the person presenting it is actually you. It was invented in 1936 as a way to track worker contributions, not as a national ID. We've been using it as one for decades because nobody built anything better. Which means protecting the accounts tied to it is entirely on you.

**`debrief_minor_breach_2`**

> Found in a breach. The email you used to register for this government account appeared in a leak. If you reused the password — change it now. Government accounts are slow to recover once compromised. The IRS doesn't have a "forgot password" flow that works in five minutes.

**`debrief_minor_breach_3`**

> Breach exposure on a government-linked email. Not the end of the world, but the urgency here is higher than with your Netflix password. A stolen government login can redirect your tax refund, freeze your Social Security benefits, or change your address in federal systems. Fresh password, now.

---

### Found in 3+ Breaches

**`debrief_major_breach_1`**

> Multiple breaches on your government credentials. Here's the stakes: a compromised IRS account lets someone file a tax return in your name and collect your refund. A compromised SSA account lets someone change your direct deposit for Social Security benefits. A compromised healthcare portal exposes your medical history, prescriptions, and insurance information. New password immediately. 2FA. IRS IP PIN. We're locking all of it.

**`debrief_major_breach_2`**

> Significant exposure. Your email has been through enough breaches that if the password is reused, it's a matter of time. With government accounts, "a matter of time" means tax fraud, benefit theft, or identity documents issued to someone pretending to be you. Lock it down.

**`debrief_major_breach_3`**

> Three-plus breaches on government-linked credentials. The ID.me controversy makes this worse: if your government login uses ID.me for identity verification — which many federal and state agencies now require — a breached ID.me account is a breached identity verification across multiple agencies simultaneously. Privacy advocates pushed for Login.gov as an alternative precisely because of this risk. The [ACLU](https://www.aclu.org/) and [EPIC](https://epic.org/) have been fighting against mandatory facial recognition in government services. Check whether you can switch to Login.gov.

---

### Password Already Strong

**`debrief_password_strong_1`**

> Already unique and strong on a government account. That's exactly right. These are the accounts where a reused password does the most damage because recovery involves talking to a federal agency, which involves hold times measured in geological eras.

**`debrief_password_strong_2`**

> Strong password confirmed. Government account recovery is slow enough that prevention is the only practical strategy. You're doing prevention. Good.

---

### Password Reset Completed

**`debrief_password_reset_1`**

> New password on a government account. Every copy of the old one in every breach database just became useless for the one target that matters most — your legal identity. That's a good trade for five minutes of your time.

**`debrief_password_reset_2`**

> Fresh credentials. If someone tries the old password against your IRS account tonight, they'll get an error message. By the time they try again with a different approach, you'll have 2FA in place. That's how defense works: each layer buys time for the next one.

**`debrief_password_reset_3`**

> Government login secured. The bureaucracy that makes these systems frustrating to use is, ironically, part of the defense — an attacker who gets locked out of an IRS account faces the same hold times you do. The difference is they can't prove they're you.

---

### "I'll Come Back to This" (Skip)

**`debrief_skip_1`**

> Noted. This mission stays queued. With government accounts, I'll be direct: if you haven't claimed your SSA or IRS account yet, the window matters. Someone else can claim it with your SSN, and the process to reclaim it involves the phrases "notarized affidavit" and "six to eight weeks." But no rush. Your call.

**`debrief_skip_2`**

> Understood. Parking this one. Government accounts are the least fun to secure — the interfaces are terrible, the 2FA is sometimes SMS-only, and the whole experience feels like it was designed by a committee in 2009. Because it was. Come back when you have the patience. The mission will be here.

**`debrief_skip_3`**

> No problem. Government stuff is heavy. The city doesn't judge, and the IRS will still be there tomorrow. Probably with the same website from 2011.

---

### 2FA Enabled

**`debrief_2fa_enabled_1`**

> Two-factor is live on a government account. This matters more here than anywhere because of how hard it is to recover a compromised government login. The IRS doesn't have a chat support team. The SSA doesn't have a "verified by selfie" quick recovery flow. If someone gets in without 2FA, you're looking at weeks of phone trees and notarized documents to get it back.

**`debrief_2fa_enabled_2`**

> 2FA active. Your government account now requires something the attacker can't get from a breach database. Given that the IRS Identity Protection PIN program was created because the existing defenses weren't enough, every layer you add is one the tax fraud industry hasn't automated around yet.

**`debrief_2fa_enabled_3`**

> Government account fortified with two-factor. One less vector for identity theft in its truest sense — not the annoying kind where someone opens a credit card, but the federal kind where someone becomes you on paper.

---

### 2FA Already On

**`debrief_2fa_already_1`**

> Already had 2FA on a government account. Not everyone does — these portals don't make it easy. Check whether it's using Login.gov or ID.me for verification. Login.gov is the privacy-preserving option the government built after advocates pushed back on ID.me's facial recognition requirements. [EPIC](https://epic.org/) led that fight.

**`debrief_2fa_already_2`**

> Two-factor was already enabled. You're ahead of the curve on the accounts where it matters most. Confirmed.

---

### IRS IP PIN Obtained (Capitol-specific)

**`debrief_ip_pin_1`**

> IRS Identity Protection PIN obtained. This is a six-digit number that only you and the IRS know, and it must be included on your tax return for the IRS to process it. Without it, a fraudulent return filed in your name gets rejected automatically. This system was built because tax refund fraud was costing the government $5.8 billion a year. Your PIN just made you a $5,800 less attractive target.

**`debrief_ip_pin_2`**

> IP PIN secured. Here's how effective this is: before the IP PIN program, someone could file a fraudulent return with just your name, SSN, and date of birth — all of which are available for about $1 on the dark web. The IP PIN adds a factor the dark web doesn't have. Simple, effective, and it took the IRS years of catastrophic fraud to implement it.

**`debrief_ip_pin_already`**

> Already had an IP PIN. You're one of the people who opted in before it became urgent. The IRS has been expanding this program every year — it's now available to all taxpayers, not just confirmed fraud victims. You were early. That's the best kind of security.

---

## 3. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter of The Capitol liberated. You've started claiming and securing your government accounts. Here's what that means: your legal identity is now harder to impersonate than it was an hour ago. The bureaucracy is slow, the interfaces are bad, but what you're doing is the digital equivalent of locking your filing cabinet.

**`progress_25_alt`**

> 25% through The Capitol. The IRS says identity theft affected 1.1 million tax returns in 2023. You're making sure yours isn't one of them next year.

### 50% Complete

**`progress_50`**

> Halfway through The Capitol. The big ones are claimed — SSA, IRS. Here's some context for what you just did: the Social Security number is the most reused identifier in American life. It's on your tax returns, your medical records, your credit reports, your employment records, and your bank accounts. It was designed in 1936 with zero security features. No checksum, no expiration, no revocation mechanism. Every piece of security you're building here is compensating for a design decision made 90 years ago.
>
> The people trying to fix this: [EPIC](https://epic.org/) has been advocating for SSN reform since the 2000s. The [ACLU](https://www.aclu.org/) fights against government databases that over-collect. These organizations are the reason the conversation about replacing the SSN with something better hasn't died entirely.

**`progress_50_alt`**

> 50% liberated. Your government identity is getting real protection — not the kind the agencies provide by default, but the kind you built yourself. The DMV, healthcare, and student loan accounts are next.

### 75% Complete

**`progress_75`**

> Three-quarters done. The Capitol is almost fully secured. You know what's wild? The Real ID Act — passed in 2005 — turned every state DMV into a node in a federal identity verification network. Your driver's license photo, your address history, your citizenship documents — all in an interconnected database system that was never designed with breach response in mind. Securing your DMV account is securing your node in that network.

**`progress_75_alt`**

> 75%. Almost there. The government accounts that remain are the ones most people forget they have — healthcare portals, student loan servicers. The ones that sit unmonitored with old passwords and no 2FA, quietly accumulating your most sensitive data while you forget they exist.

### District Complete

**`progress_complete`**

> The Capitol is fully liberated. Every government account — Social Security, IRS, DMV, healthcare, student loans — claimed, secured, and defended. Here's what you've built: a wall around your legal identity that didn't exist an hour ago.
>
> **Intel:** The fight for government data privacy is ongoing. The OPM breach taught us that even the agencies responsible for securing classified information can fail catastrophically. The ID.me controversy showed us that the government will outsource identity verification to companies that use facial recognition unless someone pushes back. The people pushing back:
>
> - [EPIC](https://epic.org/) — Electronic Privacy Information Center. They've been filing FOIA requests and lawsuits against government surveillance programs since 1994. They fought the TSA's full-body scanners, the NSA's phone metadata program, and ID.me's facial recognition contracts.
> - [ACLU](https://www.aclu.org/) — They fight government surveillance at every level, from local police departments using facial recognition to federal agencies collecting biometric data.
> - [National Taxpayer Advocate](https://www.taxpayeradvocate.irs.gov/) — An independent office within the IRS that fights for taxpayer rights, including victims of identity theft.
>
> These are the allies who've been fighting for The Capitol before you got here. If you want to support the cause beyond securing your own accounts, they could use the backup.

**`progress_complete_alt`**

> District six: done. The Capitol is yours. Your legal identity — the one on paper, the one the government recognizes, the one that takes months to recover if stolen — is now behind real defenses. The SSN was designed in 1936 with no security features. In 2026, you just added them yourself. Ready for The Perimeter?

---

## 4. Idle / Return Lines

**`return_short`** *(gone < 1 day)*

> Welcome back. The Capitol's waiting. Government accounts don't get more fun with time, but they don't get less important either.

**`return_medium`** *(gone 1–3 days)*

> Hey — good to see you. Your government accounts are still where you left them, and more importantly, still in your name. The next mission is queued up. These are the accounts worth powering through even when the interfaces make you want to close the tab.

**`return_long`** *(gone 4–7 days)*

> You're back. Everything you secured in The Capitol is still locked down — that IP PIN is still active, those passwords are still unique. Government accounts don't need daily maintenance. They need to be set up right once, and that's what we're doing.

**`return_very_long`** *(gone 7+ days)*

> Hey, stranger. It's been a while, but the IRS didn't unsecure your account while you were away. Government security is like government everything — once it's set, it moves slowly, including in the wrong direction. Your progress stands. Pick up where you left off.

**`return_idle_check_1`**

> The Capitol is %PERCENT%% liberated. One more government account and your legal identity gets a little safer. Most of these take under ten minutes — which is still faster than any interaction you've ever had with a government phone tree.

**`return_idle_check_2`**

> Still here? Tax season isn't that far away, and the identity thieves who file fraudulent returns start submitting them in January. The earlier your defenses are up, the smaller the window. No pressure. Okay, slight pressure.
