# Scout Dialogue — Chapter 5: The Marketplace

> Shopping & Streaming  
> Tone: cyberpunk deadpan, warm underneath, never shaming.  
> Scout has seen too much and copes with specificity.  
> Lighter stakes, darker truths — loyalty programs are surveillance infrastructure.

---

## 1. District Intro

**`district_intro`**

> Welcome to The Marketplace. The stakes here are lower than The Vault — nobody's draining your bank account through your Netflix password. But your credit card is saved in Amazon. Your home address is in eBay. Your real-time location history is in Uber. And your streaming accounts? They know you better than your therapist. In 2006, Netflix released anonymized viewing data for a recommendation contest. Researchers de-anonymized it by cross-referencing with public IMDb reviews — and one lawsuit later, proved that a person's watch history could reveal their sexual orientation. That was 2006. The profiles are deeper now. Uber was breached in 2016 — 57 million records stolen. Instead of disclosing it, they paid the hackers $100,000 to delete the data and keep quiet. Then they hid it from regulators for a year. The CSO who authorized the payment was convicted of a federal crime. eBay lost 145 million accounts in 2014 and took three months to notice. The Marketplace is the district where your money passes through on its way somewhere else. Every transaction leaves a trail, and that trail is for sale. Let's lock the registers.

**`district_intro_short`**

> The Marketplace. Your card is saved, your address is stored, your purchase history is profiled. Lower stakes doesn't mean no stakes. Let's lock the registers.

---

## 2. Lore Drops

**`lore_ring_amazon`**

> "Amazon's Ring doorbell cameras have partnerships with over 2,000 police departments. Cops can request footage from Ring cameras near a crime scene, and Amazon built a portal to streamline the process. Your doorbell camera is a node in a surveillance network — one you paid $100 for and installed yourself. Amazon also owns Whole Foods, Twitch, MGM Studios, and a pharmacy. The amount of data they have on you depends on how many of those you use. For most people, it's more than they think."

**`lore_uber_coverup`**

> "In 2016, Uber was breached. 57 million driver and rider records stolen. Uber's response: pay the hackers $100,000 through a bug bounty program to delete the data and sign NDAs. Then hide the breach from regulators, investors, and the public for over a year. The CSO who authorized the scheme, Joe Sullivan, was convicted of obstruction of justice and misprision of a felony — the first time a corporate security executive was criminally convicted for covering up a breach. The lesson: when a company says 'we take security seriously,' check whether they also took it seriously the last time."

**`lore_netflix_deanonymization`**

> "In 2006, Netflix released 100 million 'anonymized' movie ratings for a recommendation algorithm contest. Two researchers at UT Austin de-anonymized the data by cross-referencing it with public IMDb reviews. They identified individual users, including a closeted lesbian woman whose viewing patterns revealed her sexual orientation. She sued Netflix. The dataset was withdrawn. But the principle holds: your consumption patterns are a fingerprint. What you watch, what you buy, what you listen to — it's enough to identify you, and it reveals more about your personality than most people share voluntarily."

**`lore_loyalty_programs`**

> "Loyalty programs are the oldest data broker trick in the retail playbook. Every time you swipe a rewards card, you're selling your purchase history for a 5% discount. That data is aggregated, profiled, and sold to data brokers, insurers, and advertisers. Your grocery store knows you're pregnant before your family does — Target figured this out in 2012. A loyalty card is not a discount. It's a surveillance contract you signed for the price of a free coffee."

**`lore_ebay_breach`**

> "eBay was breached in 2014. 145 million accounts — names, emails, physical addresses, encrypted passwords, security questions. The company took three months to detect the breach and another two weeks to notify users. The encrypted passwords used SHA-1 with salts — adequate in 2014, trivially crackable now. If your eBay password is from before 2014, consider it public."

**`lore_donate`**

> "The Markup (themarkup.org) is a nonprofit newsroom that investigates how technology harms people. They've exposed discriminatory ad targeting on Facebook, hidden price discrimination on Amazon, and surveillance partnerships between tech companies and law enforcement. They do the journalism that makes companies change behavior. The EFF (eff.org) fights the legal battles. Both are worth supporting if you want The Marketplace to be a place where customers have rights."

---

## 3. Mission Briefing Dialogue

### Amazon

**`briefing_breach_amazon`**

> "Amazon doesn't disclose breach data publicly, but your Amazon email address appears in plenty of third-party breaches. If you reuse passwords, your Amazon account — which stores your credit card, your address, your purchase history, and your Alexa voice recordings — is only as secure as the weakest site you've used that email on."

**`briefing_lockdown_amazon`**

> "Amazon stores your credit card, your address, your gift card balance, and a list of everything you've ever purchased. A compromised Amazon account means someone can buy things with your money, ship them to their address, and read your entire purchase history. 2FA and a unique password aren't optional here."

**`briefing_privacy_amazon`**

> "Amazon's privacy settings control ad personalization, Alexa voice recordings, and browsing history. If you have an Echo or Alexa device, Amazon has audio recordings of every voice command. You can listen to them and delete them. Most people don't know they exist."

### Streaming

**`briefing_streaming_audit`**

> "Streaming accounts are low-risk individually — nobody's stealing your identity through your Spotify. But they're the canary in the coal mine. If your Netflix password is the same as your bank password, the Netflix breach is where the attack starts. This mission checks your password manager's health report for reused streaming passwords."

### eBay

**`briefing_breach_ebay`**

> "145 million accounts. Three months to notice. Two weeks to tell you. eBay's 2014 breach was a masterclass in how not to handle a security incident. If your eBay account predates 2014, your credentials, your security questions, and your physical address were all exposed."

**`briefing_lockdown_ebay`**

> "eBay stores your payment methods, your shipping address, and your entire purchase and selling history. A compromised eBay account means fraudulent purchases on your card, items listed under your name, and a paper trail you didn't create."

### Uber

**`briefing_breach_uber`**

> "Uber's 2016 breach exposed 57 million records. Instead of telling you, they paid the hackers to delete the data and hid the whole thing for a year. The CSO went to federal prison. Your Uber account stores your payment methods, your home and work addresses, and a GPS log of everywhere you've ever been driven."

**`briefing_privacy_uber`**

> "Uber has a complete GPS history of every ride you've taken — pickup, dropoff, the route in between. You can download this data and see it yourself. You can also delete it. Most people don't know either option exists."

---

## 4. Debrief Reactions

### No Breaches Found

**`debrief_clean_1`**

> Clean registers in The Marketplace. No breach exposure. Your shopping accounts are the ones people forget about — they store your card, your address, and your habits, but nobody thinks to secure them. You just did.

**`debrief_clean_2`**

> No breaches. Your marketplace accounts flew under the radar — and in this case, that's good news. A clean credential is a closed door.

### Found in Breaches

**`debrief_minor_breach_1`**

> Some exposure on a marketplace account. The stakes feel lower here — it's shopping, not banking — but your credit card is saved in there. A breached password on an account with saved payment methods is a direct path to fraudulent charges.

**`debrief_major_breach_1`**

> Multiple breaches. For marketplace accounts, the danger isn't identity theft — it's your saved payment methods and your physical address. That combination lets someone buy things with your money and send them to their house. New password and check your recent orders.

### Password Audit (Streaming)

**`debrief_streaming_clean_1`**

> All streaming passwords unique. That means your Netflix, Spotify, and Disney+ are isolated — a breach in one doesn't cascade to the others or, more importantly, to your bank. That's the whole point.

**`debrief_streaming_reused_1`**

> Reused passwords found. Streaming accounts are the canary — if your Netflix password is the same as your bank password, the next Netflix breach compromises your bank. Fix the reuse. Your password manager handles the rest.

### Skip

**`debrief_skip_1`**

> Parking this. The Marketplace is the lowest-urgency district — but your credit card and home address are stored in these accounts. Don't leave them indefinitely.

**`debrief_skip_2`**

> No rush — but don't confuse low stakes with no stakes. A saved payment method on a breached account is real money at risk.

---

## 5. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter of The Marketplace secured. Shopping accounts feel like they don't matter until someone orders a TV with your Amazon card and ships it to their address. You're preventing that.

**`progress_25_alt`**

> 25% through. The Marketplace moves fast. These accounts are simpler than social or cloud — fewer settings, fewer connected apps. Most of it is breach check, password, 2FA, done.

### 50% Complete

**`progress_50`**

> Halfway through The Marketplace. Your payment methods and home address are stored across fewer unsecured accounts now. Every one you lock is one fewer place your card data sits behind a reused password.

**`progress_50_alt`**

> 50% liberated. The Marketplace is the easiest district to finish — the missions are shorter and the settings are simpler. You could clear the rest in one sitting.

### 75% Complete

**`progress_75`**

> Three-quarters done. The Marketplace is almost clear. The remaining accounts are the stragglers — the ones you use least but that still have your card on file. Worth the five minutes.

**`progress_75_alt`**

> 75%. Almost done with the registers. A few more and The Marketplace lights up.

### District Complete

**`progress_complete`**

> The Marketplace is liberated. Every shopping account — password reset, 2FA enabled. Every streaming account — checked for password reuse. Every ride service — location history reviewed. The Marketplace is the district people skip because the stakes feel low. But your credit card, your home address, and your GPS history aren't low stakes. They're just stored in places you don't think about. Now you've thought about them. On to The Capitol.

**`progress_complete_alt`**

> District five: done. The Marketplace was quick and the payoff is concrete — your card is no longer saved behind reused passwords, your Uber location history is reviewed, and your streaming accounts are isolated from your high-value credentials. These were the easy wins. The Capitol is next, and the stakes go back up.

---

## 6. Idle / Return Lines

**`return_short`** *(< 1 day)*

> Back in The Marketplace. Shopping accounts are the easiest to secure. Let's finish one.

**`return_medium`** *(1-3 days)*

> The Marketplace is waiting. Good news — these are the shortest missions in the game. Five minutes, one account, done.

**`return_long`** *(4-7 days)*

> You're back. Quick reminder: your Amazon account stores every purchase you've ever made, your home address, and at least one credit card. If the password is reused, it's a live vulnerability. Just saying.

**`return_very_long`** *(7+ days)*

> Welcome back to The Marketplace. In your absence, your credit card has continued sitting behind whatever password you last set on your Amazon account. If that password is strong and unique, no problem. If it's the same one you used on that recipe site that got breached, we should talk. Let's check.

**`return_idle_check`**

> The Marketplace is %PERCENT%% liberated. One more account. You've spent longer deciding what to order for dinner. This is faster than that.
