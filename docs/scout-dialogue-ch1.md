# Scout Dialogue — Chapter 1: The Master Keys

> Email & Identity Providers  
> Tone: cyberpunk deadpan, warm underneath, never shaming.  
> Scout has seen too much and copes with specificity.

---

## 1. District Intro

**`district_intro`**

> Welcome to The Master Keys. This is where it all starts — and I do mean all of it. Every password reset, every "verify your identity" prompt, every "sign in with" button traces back to a handful of email accounts and identity providers. Control these and you control the city. Lose these and, well — someone in a server farm you'll never visit gets to be you for a while. They won't even update your profile photo. Let's not let that happen.

---

## 2. Mission Briefings

### 2a. Survey Phase

**`survey_briefing_why`**

> Before we storm any buildings, we need to know which buildings are yours. Not everyone has a Yahoo account. Some of you made one in 2004 to play fantasy football and genuinely forgot. That one still counts. Data brokers have longer memories than you do.

**`survey_briefing_scout_sidebar`**

> Be honest with yourself here. That Microsoft account you made for a free trial of Office in college? It's still out there. It has your name, your old phone number, and an enthusiasm for PowerPoint templates that no longer represents who you are.

---

### 2b. Breach Recon — Email Providers

#### Gmail

**`breach_recon_gmail_why`**

> Gmail is the skeleton key. It's your password reset address for half the internet, your Google Drive, your YouTube history, your search history, and probably the place where you store confirmation emails containing the last four digits of credit cards you've since canceled. A breached Gmail password doesn't just compromise your email — it compromises the comfortable fiction that your digital life has boundaries.

**`breach_recon_gmail_scout_sidebar`**

> Gmail accounts appear in breach databases more often than any other provider, mostly because everyone has one, and some people had one back when "password123" felt creative. We're checking if yours made the list.

#### Outlook

**`breach_recon_outlook_why`**

> Outlook handles your Microsoft account, which handles your Xbox profile, your OneDrive, your Skype — yes, Skype still exists — and any workplace that uses Microsoft 365. If this password leaked, someone could theoretically read your work emails, your personal emails, and your Skype chat history from 2012 simultaneously. That's more access to your life than most of your friends have.

**`breach_recon_outlook_scout_sidebar`**

> Microsoft has been around long enough that your Outlook account might actually be a Hotmail account in a trench coat. The breach databases don't care what it calls itself.

#### iCloud

**`breach_recon_icloud_why`**

> Your iCloud password is the key to your photos, your location history, your iMessages, your health data, Find My iPhone, and — let's be real — that note in your Notes app where you keep all your other passwords. Yes, that note. A compromised iCloud credential is less "someone reads your email" and more "someone has the complete narrative arc of your last five years."

**`breach_recon_icloud_scout_sidebar`**

> Apple's ecosystem is a walled garden, which is lovely until someone else gets the key to the gate. Then it's just a garden with very organized files on you.

#### Yahoo

**`breach_recon_yahoo_why`**

> Yahoo holds a special place in breach history. In 2013, every single Yahoo account was compromised. All three billion of them. If you had a Yahoo account in 2013, your credentials were leaked. This isn't a probability — it's a historical fact, like the moon landing, but less inspiring. We're checking if anything new has happened since then.

**`breach_recon_yahoo_scout_sidebar`**

> I know what you're thinking. "I don't use Yahoo anymore." The breach databases don't have a statute of limitations. If you reused that password anywhere — and we both know the odds — the blast radius is still expanding.

#### ProtonMail

**`breach_recon_proton_why`**

> ProtonMail is end-to-end encrypted, which means your actual email content is safe even if someone gets in. But your account credentials — your username, your login — those are a different story. A breached ProtonMail password tells the world "this person cares about privacy," which, ironically, makes you a more interesting target. Let's make sure your front door is solid.

**`breach_recon_proton_scout_sidebar`**

> The good news is ProtonMail appears in fewer breaches. The less good news is that caring enough to use ProtonMail means you'd really, really hate being the exception.

---

### 2c. Breach Recon — Identity Providers

#### Apple ID

**`breach_recon_apple_why`**

> Your Apple ID isn't just an account — it's the master switch for every Apple device you own. Whoever holds this credential can remote-wipe your phone, lock you out of your laptop, download your iCloud backups, and buy movies on your iTunes account. The movie purchases are the least of your problems, but they'd add insult to injury.

**`breach_recon_apple_scout_sidebar`**

> Apple has pretty strong security infrastructure. But infrastructure doesn't help when the password is "fluffy2019" and Fluffy's name is in your public Instagram bio.

#### Google

**`breach_recon_google_why`**

> Google knows more about you than you remember about yourself. Your Google account is your search history, your location timeline going back years, your saved Wi-Fi passwords, your Chrome autofill data, your contacts, your calendar, and every app you've ever signed into with "Continue with Google." A compromised Google credential is less of a breach and more of a biography.

**`breach_recon_google_scout_sidebar`**

> When we say "Google account" we mean the one account that quietly became the operating system of your daily life while you were busy Googling things.

#### Microsoft

**`breach_recon_microsoft_why`**

> Your Microsoft account bridges personal and professional. It's your Windows login, your Office 365, your LinkedIn (yes, Microsoft owns that), your Xbox, and your Outlook. If your employer uses Microsoft 365, it might also be how you access internal documents, Teams chats, and that one SharePoint site nobody understands. A leaked credential here has range.

**`breach_recon_microsoft_scout_sidebar`**

> Microsoft accounts have been around in various forms since the Hotmail era. There's a nonzero chance your current credential shares DNA with a password you set during the Clinton administration.

#### Facebook Login

**`breach_recon_facebook_why`**

> "Log in with Facebook" seemed convenient at the time. What actually happened is you gave dozens of apps a permanent key to your identity that routes through a company that has been fined billions of dollars for how it handles data. Your Facebook login isn't just your Facebook — it's every app, game, and quiz you ever authenticated through it. Some of those apps no longer exist. Your authorization does.

**`breach_recon_facebook_scout_sidebar`**

> Facebook breach data is so abundant that it's essentially public infrastructure at this point. We're checking if your particular contribution to this public resource includes a working password.

---

### 2d. Login History Review

**`login_history_why`**

> Breach databases tell you if your password leaked. Login history tells you if someone used it. Most email providers keep a log of every device, location, and IP address that's accessed your account recently. If there's a login from a city you've never visited on a device you've never owned — that's not a mystery. That's someone else being you, badly.

**`login_history_scout_sidebar`**

> Don't panic if you see a weird city name. Sometimes your VPN makes it look like you live in Virginia. But if you don't have a VPN and it still says Virginia — we should talk.

**`login_history_scout_sidebar_alt`**

> You're looking for anything that makes you squint. Unfamiliar device names, strange locations, 3 AM logins from a timezone that doesn't match your sleep schedule. Trust your gut here.

---

### 2e. Fortify — Password Reset

**`password_reset_why`**

> A unique password is one that exists nowhere else in the universe. Not "nowhere else on this site" — nowhere. If you use the same password for Gmail and for that recipe site that got breached in 2019, those are the same password as far as the breach economy is concerned. Attackers don't hand-type your password into Gmail. They have scripts that try leaked credentials across thousands of sites per minute while they do something else. Your reused password is their background process.

**`password_reset_scout_sidebar`**

> Use a password manager. Yes, it's another thing to set up. But the alternative is memorizing forty unique passwords, and your brain already forgot where you put your keys this morning.

**`password_reset_scout_sidebar_alt`**

> The ideal password looks like a cat walked across your keyboard during a thunderstorm. Let the password manager remember it so you don't have to.

---

### 2f. Fortify — 2FA Setup

**`2fa_setup_why`**

> Two-factor authentication means even if someone has your password, they still need your phone, your fingerprint, or a hardware key to get in. It's the deadbolt on top of the lock. Without it, your password is the only thing between your account and anyone with a laptop and a list. With it, they also need to physically steal something from you — and most cybercriminals are not committing to that level of cardio.

**`2fa_setup_scout_sidebar`**

> Authenticator app or hardware key is best. SMS codes work but can be intercepted through SIM swapping, which is when someone convinces your phone carrier they're you. It's easier than it should be. Your carrier's customer service rep is not a security professional. They're having a long day.

**`2fa_setup_scout_sidebar_alt`**

> If the service offers app-based 2FA, take it. If it only offers SMS, take it anyway — a flawed second lock still beats no second lock.

---

### 2g. Fortify — Recovery Options Audit

**`recovery_audit_why`**

> Recovery options are the back door to your account — the phone number and backup email that let you reset your password when you forget it. They also let anyone who controls that phone number or backup email reset your password when they want to. If your recovery phone is a number you no longer own — congratulations, someone at a Verizon store just became your account's legal next of kin.

**`recovery_audit_scout_sidebar`**

> Old phone numbers are the silent vulnerability. Phone carriers reassign numbers. Whoever has your old number can receive your password reset codes. They didn't even have to hack anything. They just signed a phone plan.

**`recovery_audit_scout_sidebar_alt`**

> Check that every recovery email and phone number still belongs to you. Not "belonged to you once." Belongs to you right now, today, in this timeline.

---

### 2h. Reclaim — Privacy Settings Review

**`privacy_settings_why`**

> Your account's privacy settings control who sees your data, what gets shared with third parties, and how much of your activity feeds advertising profiles. Most of these settings defaulted to "share everything" when you signed up, because the signup flow was designed by people whose bonuses depend on you sharing everything. Today we adjust the dials. Not all the way to zero — that breaks things — but to somewhere that reflects the fact that you're a person, not a product.

**`privacy_settings_scout_sidebar`**

> Every "personalized experience" toggle is a euphemism for "we watch what you do and tell advertisers about it." You can turn most of them off without the service noticeably degrading. They just won't admit that on the settings page.

**`privacy_settings_scout_sidebar_alt`**

> You'll find settings like "ad personalization," "activity tracking," and "data shared with partners." Partners, in this context, means companies you've never heard of who paid for the privilege of knowing you exist.

---

## 3. Debrief Reactions

### No Breaches Found (Clean)

**`debrief_clean_1`**

> Clean. No breaches. Either you've been careful, lucky, or this is a very new account. Whatever it is, I'll take it. One building secured, zero drama. My favorite kind of mission.

**`debrief_clean_2`**

> Nothing found. Your credentials aren't circulating in any known breach database, which is the digital equivalent of a clean bill of health. Let's keep it that way.

**`debrief_clean_3`**

> All clear. Somewhere in a data broker's spreadsheet, there's a gap where your password should be. Good.

---

### Found in 1–2 Breaches

**`debrief_minor_breach_1`**

> Okay, one or two breaches. That's actually normal — most people show up in at least a couple. It means your email was in a database that got leaked, not that someone's actively in your account. The fix is straightforward: new password, unique to this account, and we move on. You're not behind — you're right on schedule.

**`debrief_minor_breach_2`**

> A couple of breaches. Not ideal, not catastrophic. The breach happened to the company, not to you — your password was collateral damage in someone else's bad security. But now that it's out there, let's make sure it's useless to anyone who has it.

**`debrief_minor_breach_3`**

> Found in a breach or two. Welcome to the club — the membership criteria is "having an email address in the 21st century." The important thing is you're here fixing it now instead of finding out the hard way later.

---

### Found in 3+ Breaches

**`debrief_major_breach_1`**

> Three or more breaches. That's a lot of exposure, but I want to be clear — this doesn't mean you did something wrong. It means you used the internet during a period when companies were spectacularly bad at securing their databases. Which is to say, you used the internet. The priority now is a strong, unique password and 2FA if you haven't already. We're turning this around.

**`debrief_major_breach_2`**

> Significant breach exposure. Your credentials have been in multiple leaked databases, which means they've been bought, sold, and bundled more times than a streaming service original. The good news: changing your password invalidates every copy instantly. Let's do that.

**`debrief_major_breach_3`**

> Three-plus breaches. Your email address has had quite the journey through the underground economy. None of that is your fault — the companies that lost this data are the ones who failed. But you're the one who gets to fix it, because that's how this works. Unfair, but here we are. Let's lock it down.

---

### Password Was Already Strong

**`debrief_password_strong_1`**

> Already had a strong unique password? Look at you. This building was half-liberated before we even got here. That's one fewer thing on the list and one more reason to feel good about your past decisions.

**`debrief_password_strong_2`**

> Strong password already in place. You don't need me to tell you what to do — you already did it. Marking this one secured and moving on.

---

### Password Reset Completed

**`debrief_password_reset_1`**

> New password set. That's one door closed and re-keyed. Whatever was in the breach databases is now a password to nothing. It'll keep circulating in data broker lists, but it'll just bounce off your account like a wrong key in a lock. Exactly how it should work.

**`debrief_password_reset_2`**

> Password updated. The old one is officially retired — it can go live on a breach database farm upstate where it'll be very happy and never bother you again.

**`debrief_password_reset_3`**

> Done. Your new password is already more secure than the old one by virtue of not being in a spreadsheet that's been downloaded forty thousand times. Progress.

---

### "I'll Come Back to This" (Skip)

**`debrief_skip_1`**

> Noted. This mission stays queued — it'll be here when you're ready. The city doesn't judge and neither do I. Some days you liberate five buildings. Some days you just do recon. Both count.

**`debrief_skip_2`**

> No problem. I'll keep this one warm for you. Coming back to it later is infinitely better than never coming back at all, and you're already here, which puts you ahead of most people.

**`debrief_skip_3`**

> Understood. Parking this for now. The building stays occupied a little longer, but it's not going anywhere, and you've got the intel for when the time is right.

---

### 2FA Enabled

**`debrief_2fa_enabled_1`**

> Two-factor is live. This account now has a deadbolt on top of the lock. Anyone who steals your password will get all the way to the front door and then just... stand there. It's a beautiful image. Well done.

**`debrief_2fa_enabled_2`**

> 2FA activated. Your account just became dramatically harder to compromise. The password is still important, but now it's one of two things someone would need — and the second one is in your pocket. I like those odds.

**`debrief_2fa_enabled_3`**

> That's two-factor auth in place. You've just moved from "one stolen password away" to "one stolen password AND a stolen phone away," which is a completely different level of commitment most attackers won't bother with.

---

### 2FA Was Already On

**`debrief_2fa_already_1`**

> Already had 2FA? Outstanding. You secured this building before we even started the campaign. I'm just going to mark this one as "arrived pre-liberated" and take partial credit.

**`debrief_2fa_already_2`**

> Two-factor was already enabled. You're making my job very easy, and I want you to know I appreciate that. Confirmed and logged.

---

## 4. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter of the district liberated. The Master Keys are starting to turn. You've got a feel for the rhythm now — briefing, action, debrief, building lights up. Keep that momentum.

**`progress_25_alt`**

> 25% through The Master Keys. The first few missions are always the hardest — not because they're complicated, but because starting is the real mission. You've already done that part.

### 50% Complete

**`progress_50`**

> Halfway through The Master Keys. Look at the city map — that's a lot of lit windows that weren't there before. Each one is an account you've actually secured. Not theoretically. Actually. That's rare. Most people are still staring at the checklist.

**`progress_50_alt`**

> 50% liberated. The occupied zone is visibly shrinking. You can probably feel a difference too — there's something about knowing your email accounts are locked down that makes the rest feel less overwhelming. That's by design.

### 75% Complete

**`progress_75`**

> Three-quarters done. The Master Keys district is almost fully lit. A few buildings left, but the hard part is behind you. The surveillance towers are running out of things to surveil in this block. I can practically hear them recalculating.

**`progress_75_alt`**

> 75%. You're in the home stretch of the most important district in the city. Everything else — your banks, your social media, your government accounts — is safer because these master keys are secured. This was the foundation, and you built it.

### District Complete

**`progress_complete`**

> The Master Keys district is fully liberated. Every email account, every identity provider — secured, fortified, reclaimed. Look at that skyline. When you started, this whole block was dark. Surveillance cameras, data-broker antennas, glitching windows. Now it's lit up like it belongs to someone. Because it does. It belongs to you. Ready for the next district?

**`progress_complete_alt`**

> District one: done. The Master Keys are yours. That's your email secured, your identity providers locked down, and the foundation of your entire digital life fortified. Everything we do from here builds on this. Take a second to appreciate what you just did — most people never get this far. Then let's talk about The Vault.

---

## 5. Idle / Return Lines

**`return_short`** *(gone < 1 day)*

> Welcome back. Your city is exactly where you left it. Shall we pick up the next mission?

**`return_medium`** *(gone 1–3 days)*

> Hey — good to see you. The city's been holding steady. Your progress is saved, the buildings you liberated are still lit, and the next mission is queued up whenever you're ready. No rush. Okay, slight rush. But mostly no rush.

**`return_long`** *(gone 4–7 days)*

> You're back. For the record, the city didn't go anywhere and neither did your progress. Everything you did before still counts. The next mission is right where you left it. Some people liberate a city in a weekend. Some people take a month. Both end up with a liberated city.

**`return_very_long`** *(gone 7+ days)*

> Hey, stranger. It's been a while, but every building you liberated is still standing. That's the thing about this — progress doesn't expire. You're not starting over. You're continuing. The next mission is ready when you are. Let's go.

**`return_idle_check_1`**

> Still here? Just checking. The city's patient, but your data brokers are not. Whenever you're ready.

**`return_idle_check_2`**

> The Master Keys district is %PERCENT%% liberated. One more mission gets you closer. It's probably a three-minute thing. You've spent longer deciding what to watch tonight.
