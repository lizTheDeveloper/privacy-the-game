# Scout Dialogue — Chapter 3: The Square

> Social Media & Messaging  
> Tone: cyberpunk deadpan, warm underneath, never shaming.  
> Scout has seen too much and copes with specificity.  
> This district carries lore: the battles that were fought here before the player arrived.

---

## 1. District Intro

**`district_intro`**

> Welcome to The Square. This is where you exist publicly — or at least, where a version of you exists publicly. Every photo you posted, every opinion you shared, every group you joined — it's all here, and it all belongs to the platforms. In 2018, Cambridge Analytica harvested 87 million Facebook profiles to build psychographic models for political targeting. Nobody consented. The data was already there, sitting in the open, because the default settings made it public. In 2021, a whistleblower named Frances Haugen walked out of Instagram with internal research showing the algorithm was promoting self-harm content to teenagers — and that the company knew. LinkedIn had 700 million profiles scraped and sold on a dark web forum in 2021 — and argued in court that public profiles aren't really private. This is the district where your social identity lives, and right now, everyone has a copy. Let's change the locks.

**`district_intro_short`**

> The Square. Your social identity lives here — and right now, so does everyone else's copy of it. Time to decide what stays public and what gets locked down.

---

## 2. Lore Drops

These are one-liners Scout can deliver during briefings or as loading-screen flavor text. Frame as battlefield intelligence.

**`lore_cambridge_analytica`**

> "In 2018, a company called Cambridge Analytica harvested 87 million Facebook profiles through a personality quiz. They used the data to build psychographic models that predicted — and manipulated — voting behavior. Facebook knew about the harvesting for two years before acting. The fine was $5 billion. Facebook made that back in three weeks of ad revenue."

**`lore_haugen`**

> "In 2021, a Facebook engineer named Frances Haugen walked out with thousands of internal documents. One finding: Instagram's own research showed its algorithm was promoting eating disorder content to teenage girls — and the company buried it. The documents became the Facebook Papers. Congress held hearings. Nothing changed, but we know now."

**`lore_twitter_verification`**

> "Twitter used to verify public figures to prevent impersonation. Then it became a paid subscription. Now anyone with $8 can get a blue checkmark, and impersonation of public figures, companies, and government agencies became so common that multiple stock prices moved on fake tweets. Verification used to mean 'this person is who they say they are.' Now it means 'this person paid $8.'"

**`lore_tiktok`**

> "TikTok's parent company, ByteDance, stores data on US users in Oracle's cloud under a program called Project Texas. The US government isn't satisfied — there's an active forced-sale law requiring ByteDance to divest TikTok or face a ban. Meanwhile, TikTok's algorithm knows your interests better than you do, because it watches what you linger on, not what you click. Your scroll speed is data."

**`lore_linkedin_scrape`**

> "In 2021, someone scraped 700 million LinkedIn profiles — names, emails, phone numbers, job history — and posted them for sale. LinkedIn's defense? The data was already public. A court agreed. If your LinkedIn profile is visible to anyone, it's already in a database you've never heard of."

**`lore_section_230`**

> "Section 230 of the Communications Decency Act is one sentence that built the internet: 'No provider or user of an interactive computer service shall be treated as the publisher or speaker of any information provided by another information content provider.' It means platforms aren't liable for what users post. Without it, no comments section, no social media, no user reviews. The debate is whether it gives platforms too much immunity. Both sides want to change it. Neither side agrees on how."

**`lore_right_to_be_forgotten`**

> "In the EU, you have the right to be forgotten — you can request that search engines remove results about you. In the US, you don't. The closest thing is state privacy laws that let you request deletion from data brokers, but not from search engines or social platforms. The Streisand effect is the counterforce: trying to suppress information online sometimes makes it more visible. The law gives you a lever. Whether to pull it depends on whether anyone's looking."

**`lore_donate`**

> "The people fighting for your digital rights don't work for the platforms. They work at places like the Electronic Frontier Foundation (eff.org), Fight for the Future (fightforthefuture.org), and Access Now (accessnow.org). They're the ones suing to block mass surveillance, defending encryption, and keeping governments from banning privacy tools. If you want to support the resistance, that's where your money does the most good."

---

## 3. Mission Briefing Dialogue

### Instagram

**`briefing_breach_instagram`**

> "Instagram is Facebook in a prettier dress. Same parent company, same data practices, same breach exposure. Your Instagram email and password are in the same databases as every other Meta product."

**`briefing_sessions_instagram`**

> "Instagram tracks active sessions across every device. An unknown session means someone can post as you, DM your contacts, and view your private stories. That's identity theft with a filter on it."

**`briefing_lockdown_instagram`**

> "Instagram's security settings are deliberately minimalist — they want you spending time on the feed, not in settings. Password reset, 2FA, login activity — it's all there, just buried."

**`briefing_privacy_instagram`**

> "Public by default. Your posts, your followers, your activity status — all visible to anyone unless you change it. And even on a private account, Instagram still tracks everything you do for ad targeting. Privacy settings here are about reducing what strangers see, not what Instagram sees."

### Twitter / X

**`briefing_breach_twitter`**

> "Twitter's had multiple data incidents. A 2023 leak exposed 200 million email addresses tied to accounts. Your Twitter handle might feel disposable, but your email address is the real prize."

**`briefing_apps_twitter`**

> "Every time you clicked 'Sign in with Twitter' or authorized a third-party app, you gave it access to your account. Some of those apps no longer exist. Your authorization does. This audit finds and revokes the ones you forgot about."

**`briefing_lockdown_twitter`**

> "New password, 2FA enabled. Twitter removed SMS 2FA from free accounts in 2023 — you need an authenticator app or security key now, which is actually more secure. Silver lining."

**`briefing_privacy_twitter`**

> "Twitter's discoverability settings let people find your account by your phone number or email address. That's convenient for friends and useful for stalkers. Turn it off unless you're specifically trying to be found."

### WhatsApp / Signal / Telegram

**`briefing_whatsapp_devices`**

> "WhatsApp Web and desktop create linked devices that mirror your messages. If you set one up on a work computer six months ago, it's still reading everything. Check the list and cut what you don't recognize."

**`briefing_whatsapp_reglock`**

> "WhatsApp's registration lock is a PIN that prevents someone from registering your phone number on a new device. Without it, a SIM swap gives an attacker your entire chat history."

**`briefing_signal_reglock`**

> "Signal's registration lock works the same way — a PIN that prevents account takeover via SIM swap. Signal stores almost nothing server-side, which makes this PIN one of the only attack surfaces. Set it."

**`briefing_telegram_sessions`**

> "Here's what most people don't know about Telegram: regular chats are NOT end-to-end encrypted. They're stored on Telegram's servers, readable by Telegram. Only 'Secret Chats' are encrypted. So your regular Telegram messages are cloud-hosted, accessible from any active session — and if someone gets into your account, they can read everything."

### Discord / Reddit / Slack

**`briefing_discord_tokens`**

> "Discord uses authentication tokens that malware loves to steal. A stolen Discord token lets someone impersonate you without needing your password — they just slot it in and they're you. This audit checks for suspicious app connections and resets your security."

**`briefing_reddit_breach`**

> "Reddit was breached in 2018 — usernames, emails, and salted hashed passwords from 2007 and earlier. If your Reddit account predates 2018 and you haven't changed your password since, it's compromised. And if you've been using the same username across sites, your Reddit post history is now linked to your real identity."

**`briefing_slack_sso`**

> "If your Slack workspace uses SSO, your Slack security is only as strong as your identity provider. If it doesn't use SSO — if it's a community Slack with email/password login — treat it like any other account: unique password, 2FA."

---

## 4. Debrief Reactions

### No Breaches Found

**`debrief_clean_1`**

> Clean signal in The Square. Your social accounts aren't circulating in any known breach databases. In a district where 87 million Facebook profiles got harvested in a single incident, that's worth noting.

**`debrief_clean_2`**

> No breaches. Your social identity is intact — at least the credential part. The data you've posted voluntarily is a different conversation, but at least nobody stole the keys.

**`debrief_clean_3`**

> All clear. Somewhere, a data broker's spreadsheet has a gap where your social credentials should be. Small victory, real victory.

### Found in 1-2 Breaches

**`debrief_minor_breach_1`**

> A couple of hits. Standard for social accounts — LinkedIn alone leaked 700 million profiles. The exposure happened to the platform, not to you. But the password needs to be fresh and unique, because credential stuffing scripts don't care whose fault it was.

**`debrief_minor_breach_2`**

> Some exposure. Not surprising in The Square — these platforms have been breached so many times that your email appearing once or twice is almost a rite of passage. The fix is the same: unique password, move on.

### Found in 3+ Breaches

**`debrief_major_breach_1`**

> Multiple breaches on a social account. That means your email has been through LinkedIn's leak, maybe Facebook's, maybe Twitter's. Each one is another copy of your credentials in another database. The good news: one password change invalidates all of them. The better news: you're doing it right now.

**`debrief_major_breach_2`**

> Heavy exposure. The Square has some of the most-breached platforms on the internet. Three-plus hits means your credentials have been bought, sold, and bundled more times than a streaming service original. Fresh password, 2FA, and we close this chapter.

### Sessions/Devices Cleared

**`debrief_sessions_clean_1`**

> All recognized devices. Nobody's lurking in your social accounts. That old WhatsApp Web session from your ex's laptop? Not there. Good.

**`debrief_sessions_suspicious_1`**

> Unknown session found and revoked. That session could see your DMs, your contacts, your posts — everything you see. Now it sees nothing. Change the password to make sure it stays out.

### Password/2FA

**`debrief_password_reset_1`**

> New password on a social account. That's one fewer impersonation waiting to happen. Remember — a hijacked social account doesn't just expose your data. It impersonates you to everyone who trusts you.

**`debrief_2fa_enabled_1`**

> 2FA active on a social account. SIM swapping is the #1 way social accounts get hijacked — that's why an authenticator app beats SMS here. If you set up an authenticator, you just shut down the most common attack vector.

**`debrief_2fa_already_1`**

> Already had 2FA. You're ahead of the curve in The Square — most social accounts are still protected by nothing but a password. And in a lot of cases, a bad one.

### Skip

**`debrief_skip_1`**

> Noted. The Square's not going anywhere. These accounts are lower urgency than The Master Keys or The Vault — but a hijacked social account impersonates you to people who trust you. Come back when you can.

**`debrief_skip_2`**

> Parking this. Social accounts feel lower-stakes until someone posts as you. Take your time, but don't forget this one.

---

## 5. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter of The Square secured. The social district is big — seven platforms, each with its own privacy maze. But you're finding the pattern: breach check, sessions, lockdown, privacy. Same rhythm, different buildings.

**`progress_25_alt`**

> 25% through. The Square is the district where most people have the most accounts and the weakest passwords, because social accounts feel disposable. They're not — they're your public identity.

### 50% Complete

**`progress_50`**

> Halfway through The Square. Think about what you've done: breach checks, session audits, password resets, 2FA setups. Each one is a door that used to be open and isn't anymore. The platforms still have your data, but strangers don't have your credentials.

**`progress_50_alt`**

> 50% liberated. The occupied zone in The Square is visibly smaller. A few more platforms and this whole block lights up.

### 75% Complete

**`progress_75`**

> Three-quarters done. The Square is almost yours. A few messaging apps left — WhatsApp, Signal, the secure ones. These are the accounts where your private conversations live. Worth getting right.

**`progress_75_alt`**

> 75%. The Square's resistance is crumbling. Most of your social identity is secured. The remaining accounts are the communication channels — the ones where your words live, not just your profile.

### District Complete

**`progress_complete`**

> The Square is liberated. Every social account — secured. Every messaging app — locked. Every privacy setting — reviewed. The platforms still know who you are. But strangers can't impersonate you, hijack your accounts, or read your messages. That's what control looks like. Ready for The Archives?

**`progress_complete_alt`**

> District three: done. The Square was the biggest district by account count, and you cleared it. Your social identity — the version of you that exists publicly — is now under your control. The platforms will keep harvesting data. But the doors are locked, the sessions are cleared, and the passwords are fresh. That's the difference between being a product and being a person who uses a product.

---

## 6. Idle / Return Lines

**`return_short`** *(< 1 day)*

> Back in The Square. Your social accounts are where you left them — secured ones still secured, pending ones still waiting. Pick up where you stopped.

**`return_medium`** *(1-3 days)*

> Hey — The Square is holding. Social accounts don't tend to get breached on a Tuesday. But the pending ones are still pending. Let's knock out another one.

**`return_long`** *(4-7 days)*

> You're back. The Square hasn't changed, but the data brokers scraping it have been busy. Your secured accounts are fine. The unsecured ones are still unsecured. Let's close that gap.

**`return_very_long`** *(7+ days)*

> Welcome back to The Square. In the time you've been gone, approximately forty-seven million social media credentials were leaked in various breaches worldwide. Yours? Still secured — the ones you did. The ones you didn't? Let's fix that today.

**`return_idle_check`**

> The Square is %PERCENT%% liberated. One more mission. It's probably a five-minute thing. You've spent longer scrolling the very platforms we're trying to secure.
