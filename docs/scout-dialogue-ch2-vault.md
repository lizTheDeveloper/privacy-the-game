# Scout Dialogue — Chapter 2: The Vault

> Financial — banks, payment apps, crypto, investments  
> Tone: cyberpunk deadpan, warm underneath, never shaming.  
> Scout knows too much about how money moves in the dark.

---

## 1. District Intro

**`district_intro`**

> Welcome to The Vault. This is where it gets real — not "someone might read your email" real, but "someone might drain your checking account at 3 AM on a Saturday" real. Every account in this district has your money or direct access to it. Payment apps, banks, credit cards, crypto, brokerage accounts. The difference between this district and the others is that the damage here is measured in dollars, and the clock starts the moment someone gets in. Under the Electronic Fund Transfer Act, you have 60 days to dispute unauthorized transactions. After that, your bank can legally tell you it's your problem. Sixty days sounds like a lot until you realize you haven't checked your investment account since March.

**`district_intro_lore`**

> One thing you should know before we start: the number one way people lose money to account takeover isn't a sophisticated hack. It's SIM swapping. Someone calls your carrier, convinces a customer service rep to transfer your phone number to their SIM card, and then they receive all your two-factor codes. Carrier employees have been caught accepting bribes of $100 to $500 per swap. That's what your financial security is worth on the inside market. The Perimeter chapter will help you lock down your phone number. For now, we're securing the accounts themselves.

---

## 2. Debrief Reactions

### No Breaches Found (Clean)

**`debrief_clean_1`**

> Clean. No breaches on this financial account. That's money in the bank — literally. One fewer thing between you and sleep tonight.

**`debrief_clean_2`**

> No exposure found. Your financial credentials aren't circulating. Given what a breached bank login is worth on the dark web — about $40 for a checking account with a balance over $2,000 — that's a relief.

**`debrief_clean_3`**

> All clear. Somewhere, a credential broker just lost a potential sale. Good.

---

### Found in 1–2 Breaches

**`debrief_minor_breach_1`**

> Found some exposure. With financial accounts, even one breach is urgent — this isn't a social media profile, this is access to your money. If you reused this password anywhere, it's already being tested against every bank and payment app login page in automated runs. Let's change it now, not later.

**`debrief_minor_breach_2`**

> A breach or two. The good news: breached credentials from a third-party site don't mean someone's in your bank yet. The bad news: credential stuffing scripts try leaked passwords against financial sites first because the payoff is immediate. Fresh password, unique to this account, right now.

**`debrief_minor_breach_3`**

> Some exposure. Worth knowing: under the CFPB's Electronic Fund Transfer Act, you have 60 days to report unauthorized transactions. After that window, the bank's obligation shrinks. The fix is simple — new password, 2FA — but the urgency is real.

---

### Found in 3+ Breaches

**`debrief_major_breach_1`**

> Multiple breaches on a financial account. This email address has been through the breach economy several times. The credentials have been bundled, resold, and fed into automated login attempts. If this password is shared with anything else — anything — it's being tried right now. Change it, enable 2FA, and check your recent transactions.

**`debrief_major_breach_2`**

> Significant exposure. Your credentials have been on enough dark-web marketplaces to have their own frequent flyer miles. The priority here is speed: new unique password, 2FA, and scan your transaction history for anything you didn't authorize. You have 60 days from the date of the unauthorized transaction to dispute it, so check now.

**`debrief_major_breach_3`**

> Three or more breaches. Here's the math that matters: a stolen bank login with a balance over $2,000 sells for about $40 on the dark web. Someone with your breached credentials can buy their way into your account for the price of a meal. Let's make their purchase worthless — new password, 2FA, done.

---

### Password Already Strong

**`debrief_password_strong_1`**

> Already unique and strong? That's discipline. In a district where most people reuse their email password for their bank — yes, really — you're ahead. Confirmed and moving on.

**`debrief_password_strong_2`**

> Strong password already in place. Your vault door was already reinforced. That's real money you're protecting with good habits.

---

### Password Reset Completed

**`debrief_password_reset_1`**

> New password set. Every copy of the old one — in breach databases, in credential stuffing scripts, on dark-web marketplaces — just became a key to nothing. That's the most satisfying kind of obsolescence.

**`debrief_password_reset_2`**

> Fresh credentials on a financial account. Whatever was in the breach databases is now a password to an account that doesn't accept it. Attackers will find out the next time their scripts run. I hope the error message is disappointing.

**`debrief_password_reset_3`**

> Done. One less financial account with a reusable password. Your money is now behind a door that only your password manager knows how to open.

---

### "I'll Come Back to This" (Skip)

**`debrief_skip_1`**

> Noted. I'll keep this one queued. With financial accounts I'll be honest — the urgency is higher than with social media. But showing up at all puts you ahead of most people, and this mission will be here when you're ready.

**`debrief_skip_2`**

> Understood. No judgment. But I will say: if there's one district where "I'll do it tomorrow" costs more than the others, it's this one. Come back soon. The mission stays warm.

**`debrief_skip_3`**

> Parking this for now. The Vault is patient, but the breach economy isn't. Whenever you're ready.

---

### 2FA Enabled

**`debrief_2fa_enabled_1`**

> Two-factor is live on a financial account. This is the single biggest upgrade you can make here. Even if someone buys your breached credentials for $40, they hit a wall when the login asks for a code from your phone. The economics of the attack just stopped making sense.

**`debrief_2fa_enabled_2`**

> 2FA active. Your financial account now requires something the attacker can't buy on a marketplace — physical access to your device. SIM swappers can still bypass SMS-based 2FA, which is why we'll address that in The Perimeter. But for now, this is a major upgrade.

**`debrief_2fa_enabled_3`**

> Deadbolt installed on the vault door. A stolen password alone won't open it anymore. If they want in, they need your phone too — and most automated attacks don't come with a burglary component.

---

### 2FA Already On

**`debrief_2fa_already_1`**

> Already had 2FA on your financial account. That's the right call on anything that touches money. Quick check though: is it SMS-based or app-based? SMS can be intercepted via SIM swap. If it's SMS, consider upgrading to an authenticator app when you have a chance.

**`debrief_2fa_already_2`**

> Two-factor was already enabled. You're running the right configuration. Confirmed and logged.

---

### Transaction Alerts Enabled (Vault-specific)

**`debrief_alerts_enabled_1`**

> Transaction alerts are live. Every charge, every transfer, every login — you'll know about it before the statement arrives. This is your early warning system. Attackers who get in often start with a small $1 test charge to see if the card works. With alerts on, you catch even that.

**`debrief_alerts_enabled_2`**

> Alerts active. Here's why this matters: without alerts, most people discover unauthorized charges when they review their monthly statement — if they review it at all. With alerts, you find out in real time. That's the difference between catching a $1 test charge and discovering $4,000 missing three weeks later.

**`debrief_alerts_already_on`**

> Already had alerts on. Good. Check that they're set to notify on ALL transactions, not just ones over a threshold. Attackers test with small amounts first.

---

## 3. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter of The Vault secured. The first few financial accounts are done. That knot in your stomach about whether your bank password is the same one you used on that recipe site in 2019? We're untying it, one account at a time.

**`progress_25_alt`**

> 25% through The Vault. You've started securing the accounts that hold your actual money. Most people never do this — they change their Netflix password and call it a day. You're doing the real work.

### 50% Complete

**`progress_50`**

> Halfway through The Vault. Your primary accounts are secured. Fun fact: Zelle fraud victims lost over $440 million in 2022, and banks initially refused to reimburse most of them. It took congressional hearings and public pressure to change that. What you're doing right now — unique passwords, 2FA, transaction alerts — is the defense the banks won't build for you.

**`progress_50_alt`**

> 50% liberated. The big ones are done. Every financial account you secure removes a line item from someone's dark-web shopping list. Keep going.

### 75% Complete

**`progress_75`**

> Three-quarters done. The Vault is almost fully secured. Here's something worth knowing: Venmo defaults all transactions to public. Your purchase history — who you pay, how much, how often — is visible to anyone who searches your name. If you haven't hit the Venmo privacy mission yet, it's coming. It's a one-toggle fix that most people don't know they need.

**`progress_75_alt`**

> 75%. The Vault's defenses are looking solid. A few more accounts and your money is behind real walls instead of whatever "password123" was pretending to be.

### District Complete

**`progress_complete`**

> The Vault is fully liberated. Every financial account — bank, credit card, payment apps, crypto, investments — secured with unique passwords, two-factor authentication, and transaction alerts. Here's what you just did: you made your money harder to steal than 99% of the population's. Not because you bought expensive security software. Because you showed up and did the work that banks should have required from the start.
>
> **Intel:** If you believe financial institutions should be doing more to protect their customers, the [Consumer Financial Protection Bureau](https://www.consumerfinance.gov/complaint/) accepts complaints about security failures, and the [EFF](https://www.eff.org/) fights for stronger consumer protection laws. These are allies in the same fight. The Vault is yours. Let's keep moving.

**`progress_complete_alt`**

> District two: done. The Vault is yours. Your money is now behind real security — not the default settings the banks shipped with, but actual defenses you built yourself. Banks spend billions on fraud prevention infrastructure and still let customers set "fluffy2019" as their only authentication factor. You just did more for your financial security in one sitting than their entire UX team has done in a decade. Ready for The Square?

---

## 4. Idle / Return Lines

**`return_short`** *(gone < 1 day)*

> Back already. The Vault's ready for you. Where were we?

**`return_medium`** *(gone 1–3 days)*

> Good to see you. Your financial accounts haven't gotten any less important while you were away. Progress is saved, next mission is queued. Let's keep the momentum — the breach economy doesn't take days off.

**`return_long`** *(gone 4–7 days)*

> You're back. Everything you secured is still secured — those passwords are still unique, that 2FA is still active. The Vault remembers your work even if your calendar forgot the game existed. Pick up where you left off.

**`return_very_long`** *(gone 7+ days)*

> Hey. It's been a while, but every financial account you locked down is still locked down. The breach databases got a few billion records larger since you were last here, but your secured accounts aren't part of the haul. The next mission is ready whenever you are.

**`return_idle_check_1`**

> The Vault is %PERCENT%% liberated. One more mission and your money gets a little safer. Most of these take under five minutes. You've spent longer deciding whether to check your bank balance.

**`return_idle_check_2`**

> Still here? Your bank account doesn't know you're procrastinating, but the credential stuffing scripts running against it right now don't procrastinate either. Whenever you're ready.
