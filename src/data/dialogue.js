// Structured Scout dialogue extracted from docs/scout-dialogue-ch*.md
// Used for district intros, progress check-ins, return lines, debrief variants,
// lore drops, and allied organization donation links.

function pick(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

export { pick };

export const DISTRICT_DIALOGUE = {
  'master-keys': {
    intro: `Welcome to The Master Keys. This is where it all starts — and I do mean all of it. Every password reset, every "verify your identity" prompt, every "sign in with" button traces back to a handful of email accounts and identity providers. Control these and you control the city. Lose these and, well — someone in a server farm you'll never visit gets to be you for a while. They won't even update your profile photo. Let's not let that happen.`,
    progress: {
      25: [
        `Quarter of the district liberated. The Master Keys are starting to turn. You've got a feel for the rhythm now — briefing, action, debrief, building lights up. Keep that momentum.`,
        `25% through The Master Keys. The first few missions are always the hardest — not because they're complicated, but because starting is the real mission. You've already done that part.`,
      ],
      50: [
        `Halfway through The Master Keys. Look at the city map — that's a lot of lit windows that weren't there before. Each one is an account you've actually secured. Not theoretically. Actually. That's rare. Most people are still staring at the checklist.`,
        `50% liberated. The occupied zone is visibly shrinking. You can probably feel a difference too — there's something about knowing your email accounts are locked down that makes the rest feel less overwhelming. That's by design.`,
      ],
      75: [
        `Three-quarters done. The Master Keys district is almost fully lit. A few buildings left, but the hard part is behind you. The surveillance towers are running out of things to surveil in this block.`,
        `75%. You're in the home stretch of the most important district in the city. Everything else — your banks, your social media, your government accounts — is safer because these master keys are secured. This was the foundation, and you built it.`,
      ],
      100: [
        `The Master Keys district is fully liberated. Every email account, every identity provider — secured, fortified, reclaimed. Look at that skyline. When you started, this whole block was dark. Surveillance cameras, data-broker antennas, glitching windows. Now it's lit up like it belongs to someone. Because it does. It belongs to you. Ready for the next district?`,
        `District one: done. The Master Keys are yours. That's your email secured, your identity providers locked down, and the foundation of your entire digital life fortified. Everything we do from here builds on this. Take a second to appreciate what you just did — most people never get this far. Then let's talk about The Vault.`,
      ],
    },
    return: {
      short: `Welcome back. Your city is exactly where you left it. Shall we pick up the next mission?`,
      medium: `Hey — good to see you. The city's been holding steady. Your progress is saved, the buildings you liberated are still lit, and the next mission is queued up whenever you're ready. No rush. Okay, slight rush. But mostly no rush.`,
      long: `You're back. For the record, the city didn't go anywhere and neither did your progress. Everything you did before still counts. The next mission is right where you left it. Some people liberate a city in a weekend. Some people take a month. Both end up with a liberated city.`,
      veryLong: `Hey, stranger. It's been a while, but every building you liberated is still standing. That's the thing about this — progress doesn't expire. You're not starting over. You're continuing. The next mission is ready when you are. Let's go.`,
    },
    debrief: {
      clean: [
        `Clean. No breaches. Either you've been careful, lucky, or this is a very new account. Whatever it is, I'll take it. One building secured, zero drama. My favorite kind of mission.`,
        `Nothing found. Your credentials aren't circulating in any known breach database, which is the digital equivalent of a clean bill of health. Let's keep it that way.`,
        `All clear. Somewhere in a data broker's spreadsheet, there's a gap where your password should be. Good.`,
      ],
      minor: [
        `Okay, one or two breaches. That's actually normal — most people show up in at least a couple. It means your email was in a database that got leaked, not that someone's actively in your account. The fix is straightforward: new password, unique to this account, and we move on. You're not behind — you're right on schedule.`,
        `A couple of breaches. Not ideal, not catastrophic. The breach happened to the company, not to you — your password was collateral damage in someone else's bad security. But now that it's out there, let's make sure it's useless to anyone who has it.`,
        `Found in a breach or two. Welcome to the club — the membership criteria is "having an email address in the 21st century." The important thing is you're here fixing it now instead of finding out the hard way later.`,
      ],
      major: [
        `Three or more breaches. That's a lot of exposure, but I want to be clear — this doesn't mean you did something wrong. It means you used the internet during a period when companies were spectacularly bad at securing their databases. Which is to say, you used the internet. The priority now is a strong, unique password and 2FA if you haven't already. We're turning this around.`,
        `Significant breach exposure. Your credentials have been in multiple leaked databases, which means they've been bought, sold, and bundled more times than a streaming service original. The good news: changing your password invalidates every copy instantly. Let's do that.`,
        `Three-plus breaches. Your email address has had quite the journey through the underground economy. None of that is your fault — the companies that lost this data are the ones who failed. But you're the one who gets to fix it, because that's how this works. Unfair, but here we are. Let's lock it down.`,
      ],
      passwordStrong: [
        `Already had a strong unique password? Look at you. This building was half-liberated before we even got here. That's one fewer thing on the list and one more reason to feel good about your past decisions.`,
        `Strong password already in place. You don't need me to tell you what to do — you already did it. Marking this one secured and moving on.`,
      ],
      passwordReset: [
        `New password set. That's one door closed and re-keyed. Whatever was in the breach databases is now a password to nothing. It'll keep circulating in data broker lists, but it'll just bounce off your account like a wrong key in a lock. Exactly how it should work.`,
        `Password updated. The old one is officially retired — it can go live on a breach database farm upstate where it'll be very happy and never bother you again.`,
        `Done. Your new password is already more secure than the old one by virtue of not being in a spreadsheet that's been downloaded forty thousand times. Progress.`,
      ],
      skip: [
        `Noted. This mission stays queued — it'll be here when you're ready. The city doesn't judge and neither do I. Some days you liberate five buildings. Some days you just do recon. Both count.`,
        `No problem. I'll keep this one warm for you. Coming back to it later is infinitely better than never coming back at all, and you're already here, which puts you ahead of most people.`,
        `Understood. Parking this for now. The building stays occupied a little longer, but it's not going anywhere, and you've got the intel for when the time is right.`,
      ],
      tfaEnabled: [
        `Two-factor is live. This account now has a deadbolt on top of the lock. Anyone who steals your password will get all the way to the front door and then just... stand there. It's a beautiful image. Well done.`,
        `2FA activated. Your account just became dramatically harder to compromise. The password is still important, but now it's one of two things someone would need — and the second one is in your pocket. I like those odds.`,
        `That's two-factor auth in place. You've just moved from "one stolen password away" to "one stolen password AND a stolen phone away," which is a completely different level of commitment most attackers won't bother with.`,
      ],
      tfaAlready: [
        `Already had 2FA? Outstanding. You secured this building before we even started the campaign. I'm just going to mark this one as "arrived pre-liberated" and take partial credit.`,
        `Two-factor was already enabled. You're making my job very easy, and I want you to know I appreciate that. Confirmed and logged.`,
      ],
    },
    lore: {},
    allies: [],
  },

  'vault': {
    intro: `Welcome to The Vault. This is where it gets real — not "someone might read your email" real, but "someone might drain your checking account at 3 AM on a Saturday" real. Every account in this district has your money or direct access to it. Payment apps, banks, credit cards, crypto, brokerage accounts. The difference between this district and the others is that the damage here is measured in dollars, and the clock starts the moment someone gets in. Under the Electronic Fund Transfer Act, you have 60 days to dispute unauthorized transactions. After that, your bank can legally tell you it's your problem. Sixty days sounds like a lot until you realize you haven't checked your investment account since March.`,
    progress: {
      25: [
        `Quarter of The Vault secured. The first few financial accounts are done. That knot in your stomach about whether your bank password is the same one you used on that recipe site in 2019? We're untying it, one account at a time.`,
        `25% through The Vault. You've started securing the accounts that hold your actual money. Most people never do this — they change their Netflix password and call it a day. You're doing the real work.`,
      ],
      50: [
        `Halfway through The Vault. Your primary accounts are secured. Fun fact: Zelle fraud victims lost over $440 million in 2022, and banks initially refused to reimburse most of them. It took congressional hearings and public pressure to change that. What you're doing right now — unique passwords, 2FA, transaction alerts — is the defense the banks won't build for you.`,
        `50% liberated. The big ones are done. Every financial account you secure removes a line item from someone's dark-web shopping list. Keep going.`,
      ],
      75: [
        `Three-quarters done. The Vault is almost fully secured. Here's something worth knowing: Venmo defaults all transactions to public. Your purchase history — who you pay, how much, how often — is visible to anyone who searches your name. If you haven't hit the Venmo privacy mission yet, it's coming.`,
        `75%. The Vault's defenses are looking solid. A few more accounts and your money is behind real walls instead of whatever "password123" was pretending to be.`,
      ],
      100: [
        `The Vault is fully liberated. Every financial account — bank, credit card, payment apps, crypto, investments — secured with unique passwords, two-factor authentication, and transaction alerts. You made your money harder to steal than 99% of the population's. Not because you bought expensive security software. Because you showed up and did the work.`,
        `District two: done. The Vault is yours. Banks spend billions on fraud prevention infrastructure and still let customers set "fluffy2019" as their only authentication factor. You just did more for your financial security in one sitting than their entire UX team has done in a decade.`,
      ],
    },
    return: {
      short: `Back already. The Vault's ready for you. Where were we?`,
      medium: `Good to see you. Your financial accounts haven't gotten any less important while you were away. Progress is saved, next mission is queued. Let's keep the momentum — the breach economy doesn't take days off.`,
      long: `You're back. Everything you secured is still secured — those passwords are still unique, that 2FA is still active. The Vault remembers your work even if your calendar forgot the game existed.`,
      veryLong: `Hey. It's been a while, but every financial account you locked down is still locked down. The breach databases got a few billion records larger since you were last here, but your secured accounts aren't part of the haul. The next mission is ready whenever you are.`,
    },
    debrief: {
      clean: [
        `Clean. No breaches on this financial account. That's money in the bank — literally.`,
        `No exposure found. Your financial credentials aren't circulating. Given what a breached bank login is worth on the dark web — about $40 for a checking account with a balance over $2,000 — that's a relief.`,
        `All clear. Somewhere, a credential broker just lost a potential sale. Good.`,
      ],
      minor: [
        `Found some exposure. With financial accounts, even one breach is urgent — this isn't a social media profile, this is access to your money. Fresh password, unique to this account, right now.`,
        `A breach or two. The good news: breached credentials from a third-party site don't mean someone's in your bank yet. The bad news: credential stuffing scripts try leaked passwords against financial sites first because the payoff is immediate.`,
        `Some exposure. Worth knowing: under the CFPB's Electronic Fund Transfer Act, you have 60 days to report unauthorized transactions. After that window, the bank's obligation shrinks. The fix is simple — new password, 2FA — but the urgency is real.`,
      ],
      major: [
        `Multiple breaches on a financial account. The credentials have been bundled, resold, and fed into automated login attempts. Change it, enable 2FA, and check your recent transactions.`,
        `Significant exposure. Your credentials have been on enough dark-web marketplaces to have their own frequent flyer miles. New unique password, 2FA, and scan your transaction history for anything you didn't authorize.`,
        `Three or more breaches. A stolen bank login with a balance over $2,000 sells for about $40 on the dark web. Let's make their purchase worthless.`,
      ],
      skip: [
        `Noted. I'll keep this one queued. With financial accounts the urgency is higher than with social media. But showing up at all puts you ahead of most people.`,
        `No judgment. But if there's one district where "I'll do it tomorrow" costs more than the others, it's this one. Come back soon.`,
        `Parking this for now. The Vault is patient, but the breach economy isn't.`,
      ],
    },
    lore: {
      sim_swapping: { title: 'SIM Swapping Economics', text: `The number one way people lose money to account takeover isn't a sophisticated hack. It's SIM swapping. Someone calls your carrier, convinces a customer service rep to transfer your phone number to their SIM card, and then they receive all your two-factor codes. Carrier employees have been caught accepting bribes of $100 to $500 per swap.` },
      zelle_fraud: { title: 'Zelle Fraud Hearings', text: `Zelle fraud victims lost over $440 million in 2022. Banks initially refused to reimburse most of them, arguing the transfers were "authorized." Congressional hearings and public pressure forced policy changes. The lesson: payment apps prioritize speed over security, and the fraud protection you expect isn't always there.` },
      cfpb: { title: 'CFPB 60-Day Rule', text: `Under the Electronic Fund Transfer Act, you have 60 days from your bank statement date to dispute unauthorized electronic transactions. After that window, the bank's liability shrinks. This means checking your statements regularly isn't paranoia — it's a legal deadline.` },
    },
    allies: [
      { name: 'EFF', url: 'https://www.eff.org/', description: 'The oldest digital rights organization — fighting for consumer protection laws.' },
      { name: 'CFPB', url: 'https://www.consumerfinance.gov/complaint/', description: 'File complaints about security failures at financial institutions.' },
    ],
  },

  'square': {
    intro: `Welcome to The Square. This is where you exist publicly — or at least, where a version of you exists publicly. Every photo you posted, every opinion you shared, every group you joined — it's all here, and it all belongs to the platforms. In 2018, Cambridge Analytica harvested 87 million Facebook profiles to build psychographic models for political targeting. Nobody consented. The data was already there, sitting in the open, because the default settings made it public. This is the district where your social identity lives, and right now, everyone has a copy. Let's change the locks.`,
    progress: {
      25: [`Quarter of The Square secured. The biggest social accounts are locked down. The ones where your real name and face are attached to your opinions.`, `25% through. You've started controlling who sees what. That's a bigger shift than it sounds.`],
      50: [`Halfway through The Square. Your social identity is getting harder to hijack. A compromised social account impersonates you to the people who trust you — that's the real damage.`, `50% liberated. The platforms still have your data, but the doors are locked and you control who gets a key.`],
      75: [`Three-quarters done. Messaging apps are next — the ones where your unfiltered conversations live. Signal, WhatsApp, Discord, Telegram.`, `75%. Almost there. The remaining accounts are the communication channels — where a compromise is a live wiretap.`],
      100: [`The Square is fully liberated. Every social account and messaging app — secured, privacy settings tightened, sessions audited. You've taken control of your public identity.`, `District three: done. The Square is yours. Cambridge Analytica harvested 87 million profiles because the defaults were "share everything." You just changed the defaults.`],
    },
    return: {
      short: `Back in The Square. The social accounts are right where you left them.`,
      medium: `Welcome back. Your social identity hasn't changed while you were away — but the platforms' data collection has continued. Let's keep locking things down.`,
      long: `You're back. Everything you secured is still secured. The platforms are still collecting, but your settings are holding.`,
      veryLong: `Hey. It's been a while. The platforms have had time to add three new tracking features since your last visit. Your secured accounts are still locked down. Let's update the rest.`,
    },
    debrief: {
      clean: [`Clean. No breaches on this social account. Given how many platform breaches there have been, that's genuinely good news.`, `No exposure found. Your social credentials are off the market.`],
      minor: [`Found some exposure. With social accounts, a breached password lets someone post as you, message as you, and access every DM you've ever sent. Fresh password, now.`, `A breach or two. Social account hijacking is personal — it's someone wearing your face to the people who trust you.`],
      major: [`Multiple breaches on a social account. Your credentials have been through the mill. New password, 2FA, and check your active sessions for anyone who shouldn't be there.`, `Significant exposure. Change the password and then check connected apps — old OAuth grants can be a backdoor even after a password change.`],
      skip: [`No rush. Social accounts aren't going anywhere. Come back when you're ready.`, `Queued. The Square is patient.`],
    },
    lore: {
      cambridge_analytica: { title: 'Cambridge Analytica', text: `In 2018, Cambridge Analytica harvested 87 million Facebook profiles through a personality quiz. They used the data to build psychographic models that predicted and manipulated voting behavior. Facebook knew about the harvesting for two years before acting. The fine was $5 billion. Facebook made that back in three weeks of ad revenue.` },
      haugen: { title: 'Frances Haugen', text: `In 2021, a Facebook whistleblower named Frances Haugen revealed internal research showing Instagram's algorithm was promoting self-harm content to teenagers — and that the company knew. The documents showed Facebook repeatedly chose growth over safety when the two conflicted.` },
      linkedin_scrape: { title: 'LinkedIn Scrape (2021)', text: `700 million LinkedIn profiles were scraped and sold on a dark web forum in 2021. LinkedIn argued in court that public profiles aren't really private. The court largely agreed. The lesson: if your profile is public, assume it's been copied.` },
    },
    allies: [
      { name: 'EFF', url: 'https://www.eff.org/', description: 'Fighting for user rights on platforms.' },
      { name: 'Fight for the Future', url: 'https://www.fightforthefuture.org/', description: 'Campaigning against surveillance and for digital rights.' },
      { name: 'Access Now', url: 'https://www.accessnow.org/', description: 'Global digital rights and the Digital Security Helpline.' },
    ],
  },

  'archives': {
    intro: `Welcome to The Archives. This is where the real you lives — not the curated version you post on social media, but the actual documents. Your tax returns. Your ID scans. Your employment contracts. Your code. Dropbox was breached in 2012 — 68 million credentials leaked — but they didn't tell anyone until 2016. Four years of silence while those passwords circulated. The CLOUD Act of 2018 gave US law enforcement the power to compel any American cloud provider to hand over data stored anywhere in the world. Your cloud is not a vault. It's a filing cabinet with a glass door. Let's put some locks on it.`,
    progress: {
      25: [`Quarter of The Archives secured. The cloud storage accounts are locked down. Your documents are behind real passwords now.`, `25%. The files that matter most — tax returns, ID scans, contracts — are safer than they were an hour ago.`],
      50: [`Halfway through The Archives. Cloud storage is done. Now we audit work accounts and code repos.`, `50% liberated. Your filing cabinet has locks on it now.`],
      75: [`Three-quarters done. The big accounts are secured. GitHub secrets scanned, shared links audited.`, `75%. Almost there. Your documents, your code, your work identity — nearly all locked down.`],
      100: [`The Archives are fully liberated. Your cloud storage, your code repos, your work accounts — all secured. The filing cabinet has real locks now.`, `District four: done. Dropbox took four years to tell you about their breach. You took one afternoon to lock everything down.`],
    },
    return: {
      short: `Back in The Archives. Your documents are right where you left them — and only where you left them.`,
      medium: `Welcome back. Your cloud accounts are still secured. Let's keep auditing.`,
      long: `You're back. Your files haven't moved. Neither has your progress. Pick up where you left off.`,
      veryLong: `Hey. The Archives have been quiet. Your security settings are holding. Let's finish what you started.`,
    },
    debrief: {
      clean: [`Clean. No breaches on this cloud account. Your files stay yours.`, `No exposure. The filing cabinet is holding.`],
      minor: [`Some exposure. Cloud accounts contain the documents you'd never post publicly. Fresh password, now.`, `A breach or two. If this account has your tax returns or ID scans, the urgency is real.`],
      major: [`Multiple breaches. Your cloud credentials have been circulating. Change the password and audit shared links — old shared files can be a backdoor.`, `Significant exposure. Lock it down and check for shared links you've forgotten about.`],
      skip: [`No rush. The Archives are patient. Come back when you're ready.`, `Queued. Your documents aren't going anywhere.`],
    },
    lore: {
      dropbox_breach: { title: 'Dropbox Breach (2012)', text: `Dropbox was breached in 2012. 68 million email-password pairs leaked. The company didn't disclose the full extent until 2016 — four years where those credentials were circulating while users had no idea.` },
      cloud_act: { title: 'CLOUD Act (2018)', text: `The CLOUD Act lets US law enforcement compel American cloud providers — Google, Microsoft, Dropbox, Apple — to hand over user data stored anywhere in the world. Your Google Drive files in an EU data center are still reachable by a US warrant.` },
    },
    allies: [
      { name: 'EFF', url: 'https://www.eff.org/', description: 'Fighting for privacy in the cloud.' },
      { name: 'Freedom of the Press Foundation', url: 'https://freedom.press/', description: 'Protecting journalists and their sources.' },
    ],
  },

  'marketplace': {
    intro: `Welcome to The Marketplace. The stakes here are lower than The Vault — nobody's draining your bank account through your Netflix password. But your credit card is saved in Amazon. Your home address is in eBay. Your real-time location history is in Uber. And your streaming accounts? They know you better than your therapist. Uber was breached in 2016 — 57 million records stolen. Instead of disclosing it, they paid the hackers $100,000 to delete the data and keep quiet. Then they hid it from regulators for a year. The CSO who authorized the payment was convicted of a federal crime. Let's lock the registers.`,
    progress: {
      25: [`Quarter of The Marketplace secured. The accounts with saved payment methods are getting locked down first.`, `25%. Your credit card number is stored in fewer unprotected accounts now.`],
      50: [`Halfway through The Marketplace. Shopping accounts secured. Your address and payment methods are behind better walls.`, `50% liberated. The accounts that know where you live are locked down.`],
      75: [`Three-quarters done. Streaming accounts are lower stakes but still matter — reused passwords here are the canary.`, `75%. Almost there. The remaining accounts are the ones most people forget about.`],
      100: [`The Marketplace is fully liberated. Shopping, streaming, delivery, ride-sharing — all secured. Your address and payment methods are behind real walls now.`, `District five: done. Uber hid their breach for a year. You secured yours in an afternoon. That's the difference between corporate security and personal security — you actually care.`],
    },
    return: {
      short: `Back in The Marketplace. The shopping accounts are ready for you.`,
      medium: `Welcome back. Your payment methods are still saved in these accounts — let's make sure they're behind good passwords.`,
      long: `You're back. Your secured accounts are still secured. The ones that aren't are still waiting.`,
      veryLong: `Hey. The Marketplace hasn't changed. Your saved payment methods are still there, still behind whatever password you set last time you were here. Let's upgrade the rest.`,
    },
    debrief: {
      clean: [`Clean. No breaches on this account. Your payment methods stay safe.`, `No exposure. The register is holding.`],
      minor: [`Some exposure. If this account has a saved credit card, check your recent statements.`, `A breach or two. Lower stakes than the bank, but your address and card are stored here.`],
      major: [`Multiple breaches on a shopping account. Check saved payment methods and recent orders you didn't place.`, `Significant exposure. Lock it down and check for saved addresses you've forgotten about.`],
      skip: [`No rush. Shopping accounts can wait. Come back when you're ready.`, `Queued. The register isn't going anywhere.`],
    },
    lore: {
      uber_coverup: { title: 'Uber Breach Cover-Up', text: `In 2016, Uber was breached. 57 million records stolen. Uber paid the hackers $100,000 through a bug bounty program to delete the data and sign NDAs. Then hid the breach from regulators for over a year. The CSO who authorized the scheme was convicted of obstruction of justice — the first time a corporate security executive was criminally convicted for covering up a breach.` },
      ring_amazon: { title: 'Amazon Ring & Police', text: `Amazon's Ring doorbell cameras have partnerships with over 2,000 police departments. Cops can request footage from Ring cameras near a crime scene. Your doorbell camera is a node in a surveillance network — one you paid $100 for and installed yourself.` },
    },
    allies: [
      { name: 'EFF', url: 'https://www.eff.org/', description: 'Fighting for consumer privacy.' },
      { name: 'The Markup', url: 'https://themarkup.org/', description: 'Investigative tech journalism — they built the Blacklight website privacy inspector.' },
    ],
  },

  'capitol': {
    intro: `Welcome to The Capitol. This is where your legal identity lives — Social Security, tax records, your driver's license number, healthcare data, student loans. Every other district was about protecting your digital life. This one is about protecting your identity in the eyes of the law. When someone files a tax return in your name and collects your refund, that's not a nuisance — that's a federal crime committed against you, and you're the one who spends six months on the phone with the IRS proving you exist. The defense here is different: it's not just about securing accounts, it's about claiming them before someone else does.`,
    introLore: `Some history you should know. In 2015, the Office of Personnel Management was breached. 22 million records stolen. Not just names and Social Security numbers. Full SF-86 security clearance forms: every address you've lived at, every foreign contact, every financial problem, your mental health history, your relatives. And fingerprints — 5.6 million fingerprints. You can change a password. You cannot change your fingerprints. The attackers were never caught. The data was never recovered.`,
    progress: {
      25: [`Quarter of The Capitol secured. The most critical government accounts are claimed. Nobody else can register them now.`, `25%. You've claimed your government accounts before someone else could. That's the most important step in this district.`],
      50: [`Halfway through The Capitol. Your government identity is getting locked down. The IRS IP PIN is the single most effective defense against tax identity theft.`, `50% liberated. Your legal identity is behind real walls now.`],
      75: [`Three-quarters done. Government accounts are frustrating to secure — the interfaces are terrible and the 2FA is sometimes SMS-only. But you're doing it anyway.`, `75%. Almost there. The remaining accounts are the ones that protect your legal identity at the state level.`],
      100: [
        `The Capitol is fully liberated. SSA claimed, IRS PIN set, healthcare portal secured, student loans locked down. Your legal identity is yours. The organizations fighting to make sure government agencies protect this data better: EPIC and the ACLU. These are allies in the same fight.`,
        `District six: done. The Capitol is yours. Government data breaches are permanent — you can't change your fingerprints or your Social Security number. But you can layer defenses on top, and that's exactly what you just did.`,
      ],
    },
    return: {
      short: `Back in The Capitol. The government accounts are ready for you.`,
      medium: `Welcome back. Your government accounts are exactly as important as they were last time. Let's keep securing them.`,
      long: `You're back. Your IRS account is still claimed. Your SSA lock is still active. The government's website design is still terrible. Some things don't change.`,
      veryLong: `Hey. The Capitol held. Your government accounts are still secured. The remaining ones are still waiting. The IRS will still be there tomorrow — probably with the same website from 2011.`,
    },
    debrief: {
      clean: [`Clean. No breaches on your government credentials. Given what these accounts protect — your legal identity, your tax records, your benefits — that's the best possible outcome.`, `No exposure found. Your government login isn't circulating.`, `All clear. Your government credentials are off the market.`],
      minor: [`Some exposure. With government accounts, even indirect exposure matters. Your Social Security number was never designed to be a secret. Fresh password, now.`, `Breach exposure on a government-linked email. The urgency here is higher than with your Netflix password.`],
      major: [`Multiple breaches on government credentials. A compromised IRS account lets someone file a tax return in your name. A compromised SSA account lets someone change your direct deposit. New password immediately. 2FA. IRS IP PIN.`, `Significant exposure. Lock it down.`],
      claimed: [`Account registered. Before today, anyone with your Social Security number could have created this account and locked you out. Now that door is closed. You got there first.`, `You've claimed your account. One SSN, one account. Whoever registers first owns the login. Today, that's you.`],
      skip: [`Noted. With government accounts, I'll be direct: if you haven't claimed your SSA or IRS account yet, the window matters. But no rush. Your call.`, `Government stuff is heavy. The city doesn't judge. Come back when you have the patience.`],
    },
    lore: {
      opm_hack: { title: 'OPM Hack (2015)', text: `The Office of Personnel Management was breached. 22 million records stolen including full SF-86 security clearance forms and 5.6 million fingerprints. The attackers were never caught. The data was never recovered.` },
      ssn_design: { title: 'SSN Was Never Meant for This', text: `Your Social Security number was invented in 1936 as a way to track worker contributions, not as a national ID. It has no checksum, no verification mechanism, no way to confirm the person presenting it is actually you. We've been using it as a national ID for decades because nobody built anything better.` },
      idme_controversy: { title: 'ID.me vs Login.gov', text: `ID.me uses facial recognition for identity verification. Privacy advocates pushed for Login.gov as an alternative. The debate is ongoing: convenience and fraud prevention vs. biometric surveillance by a private company.` },
    },
    allies: [
      { name: 'EPIC', url: 'https://epic.org/', description: 'Electronic Privacy Information Center — suing federal agencies over data collection since the 1990s.' },
      { name: 'ACLU', url: 'https://www.aclu.org/', description: 'Fighting surveillance at every level of government.' },
    ],
  },

  'perimeter': {
    intro: `Everything you've done so far — the passwords, the 2FA, the privacy settings — protects individual buildings. The Perimeter protects the city itself. These are the outer walls: the defenses that don't belong to any one account but shield all of them. SIM protection stops an attacker from hijacking your phone number. Device security means a stolen laptop gives the thief expensive hardware and zero data. Scam defense trains the one vulnerability no software can patch — you. And border crossing prep ensures that when you walk through customs, your entire digital life isn't handed over because someone asked you to unlock your phone. Every mission here applies to you. Let's fortify the walls.`,
    facilityIntros: {
      sim_protection: `In 2023, the DOJ prosecuted a SIM swap ring that stole $400 million in cryptocurrency. The attack is simple: someone calls your carrier, convinces a customer service rep they're you, and transfers your phone number to their SIM card. Your phone goes dead. Their phone starts receiving your two-factor codes. The whole thing takes fifteen minutes. A carrier PIN and a port-out lock take five minutes to set up and make this attack dramatically harder.`,
      device_security: `In 2021, Apple sued NSO Group for deploying Pegasus spyware on iPhones — zero-click exploits that required no interaction from the target. Citizen Lab at the University of Toronto was the research group that exposed it. You probably aren't a target of state-sponsored spyware. But you are a target of the mundane version: a stolen phone, a laptop left on a bus. Full-disk encryption, a strong lock screen, and Find My are the basics.`,
      scam_defense: `The hard part about phishing isn't the obvious fakes. It's the real messages that look fake. Microsoft sends legitimate security alerts from accountprotection.microsoft.com — a domain that sounds made up. The training here shows you both kinds, and the skill you're building is the pause before the click.`,
      border_prep: `U.S. Customs and Border Protection claims the authority to search any electronic device at the border without a warrant. In 2024, CBP searched over 43,000 devices. Riley v. California explicitly does not apply at the border. The defense isn't legal — it's operational. You travel with a clean device. This is the same practice used by investigative journalists worldwide. It is legal, it is ethical, and it is the only reliable protection at a border.`,
    },
    progress: {
      25: [`Quarter of The Perimeter fortified. The phone number lock and device hardening are the foundation.`, `25% through. You've already done the most urgent thing — SIM protection.`],
      50: [`Halfway through The Perimeter. Your devices are hardened, your phone number is locked. Now we train the human element.`, `50% fortified. The walls are going up.`],
      75: [`Three-quarters done. The outer walls are solid. If you're someone who crosses borders, the crossing prep is worth doing now.`, `75%. Most people never think about these defenses until something goes wrong. You're building them before that happens.`],
      100: [`The Perimeter is fully fortified. Phone number locked, devices hardened, phishing instincts calibrated, border prep complete. Everything inside is safer because of what you just built. One district left: The Reclamation.`, `Perimeter: done. SIM-swappers bounce off the carrier PIN. A stolen device gives up nothing. Phishing emails trigger a pause instead of a click. Now — The Reclamation. The endgame.`],
    },
    return: {
      short: `Back already. The Perimeter's right where you left it — walls don't wander.`,
      medium: `Welcome back. Your walls are still standing. The next mission is queued.`,
      long: `You're back. Every defense you've set up is still working. The carrier PIN didn't expire, the encryption didn't turn off.`,
      veryLong: `Hey. The Perimeter held. Your phone number is still locked, your devices are still encrypted, and the skills you built in scam defense don't have an expiration date.`,
    },
    debrief: {
      actionDone: [`Wall reinforced. That's one more layer between you and whoever's trying to get in.`, `Done. This is the kind of thing most people never do because nobody tells them it's possible. You just did it in ten minutes.`, `Secured. The Perimeter is stronger than it was five minutes ago.`],
      alreadyDone: [`Already handled. You came in with your walls up. I respect that.`, `Already in place. Someone's been paying attention.`],
      skip: [`No pressure. The Perimeter doesn't move. These walls will be here when you're ready.`, `Queued for later. Come back when you've got the right setup.`],
      quizCorrect: [`Sharp eye. You spotted the tell. That three-second pause before clicking is worth more than any spam filter.`, `Correct. You noticed the domain. That's the skill — not the answer to this specific message, but the habit of checking before clicking.`],
      quizWrong: [`That one trips people up. The tell was in the domain. Check the part after the @ and compare it to the company's actual website.`, `Missed this one. The whole point of training is getting it wrong here instead of getting it wrong when it counts.`],
    },
    lore: {
      carpenter: { title: 'Carpenter v. United States (2018)', text: `The Supreme Court ruled that the government needs a warrant to access cell phone location data. The vote was 5-4. One vote the other way and your location history would be available to any law enforcement agency that asked your carrier nicely.` },
      pegasus: { title: 'Pegasus Spyware', text: `NSO Group sells Pegasus spyware to governments. It can take over a phone with zero clicks. It has been found on the phones of journalists, human rights workers, and opposition politicians. Apple sued NSO Group in 2021. Citizen Lab documented most of the deployments.` },
      signal: { title: 'Signal Foundation', text: `Signal stores almost nothing. When subpoenaed, the only data Signal could produce was the date each account was created and the date it last connected. No message content, no contacts, no groups. Signal runs on donations.` },
    },
    allies: [
      { name: 'EFF', url: 'https://www.eff.org/', description: 'The oldest digital rights organization — in every fight on this list.' },
      { name: 'ACLU', url: 'https://www.aclu.org/', description: 'Litigating the constitutional cases for privacy and civil liberties.' },
      { name: 'Signal Foundation', url: 'https://signal.org/donate/', description: 'The encrypted messenger that refuses to compromise. Donate to keep it free.' },
      { name: 'Citizen Lab', url: 'https://citizenlab.ca/', description: 'The researchers who exposed Pegasus and government surveillance worldwide.' },
    ],
  },

  'reclamation': {
    intro: `Welcome to The Reclamation. This is the endgame.\n\nYou've secured your accounts. You've hardened your devices. You've learned to spot the scams. Now you learn who's been selling your data this whole time — and you take it back.\n\nThe data broker industry is worth over $200 billion a year. That's not a typo. Two hundred billion dollars generated by buying and selling information about people — about you — without your meaningful consent. This district is different from the others. You're not securing an account or hardening a device. You're reaching into the machinery that profits from your existence and pulling yourself out, one broker at a time.`,
    facilityIntros: {
      credit_freeze: `A credit freeze is the single most effective identity theft prevention available to you. It's free, it takes five minutes per bureau, and it prevents anyone from opening credit in your name. Before the Economic Growth Act of 2018, credit freezes cost $5-10 per bureau. Consumer advocates fought for years to make them free. They won. Use what they won.`,
      people_search: `Spokeo. Whitepages. BeenVerified. TruePeopleSearch. These are the retail layer of the surveillance economy. Type someone's name and get their address, phone number, email, relatives, and estimated income. Removing yourself is free, tedious, and impermanent — most will re-add you within 3-6 months. That's why the California DELETE Act matters: one request to the DROP platform covers 600+ registered brokers.`,
      enterprise_data: `This is the wholesale layer. People-search sites are the storefronts. Enterprise aggregators are the warehouses behind them — and their customers are banks, insurers, employers, landlords, and law enforcement. LexisNexis has your CLUE report. Thomson Reuters CLEAR is the one investigators use. Equifax Workforce Solutions reports your paycheck every pay period.`,
      ad_trackers: `People-search brokers sell your identity. Ad brokers sell your behavior — what you search, what you buy, what you click. Acxiom has profiles on 2.5 billion consumers worldwide. The good news: bulk opt-out tools exist. The NAI Consumer Opt-Out covers 100+ ad networks in one click.`,
      location_brokers: `This is the layer that crosses the line from commercial surveillance into something darker. Every time an ad loads on your phone, your precise GPS coordinates are broadcast to hundreds of companies in a real-time auction that takes 100 milliseconds. Near Intelligence sold location data of people visiting Planned Parenthood to anti-abortion groups. X-Mode Social sold location data from Muslim prayer apps to US military contractors.`,
      govt_id_defense: `Your driver's license and Social Security number are sitting in databases at every service that ever asked you to "verify your identity." Unlike a password, you cannot change your face or your Social Security number. The defense is layering other verification on top: credit freezes, IRS PINs, SSA locks.`,
    },
    progress: {
      25: [`Quarter of The Reclamation complete. Your credit is frozen. That's the foundation — nobody can open accounts in your name. Now we go after the brokers.`, `25% through the endgame. Credit bureaus locked down. Next: the people-search sites.`],
      50: [`Halfway through The Reclamation. The retail layer is handled. Now we go deeper. Enterprise aggregators. The wholesale layer.`, `50%. You've filed more opt-outs than most people will in their lifetime. But the supply chain has layers, and the wholesale end is where the real data lives.`],
      75: [`Three-quarters through. You've gone deeper into the surveillance economy than most people know exists. The last stretch is government ID defense.`, `75%. Credit frozen. Opted out of people-search sites. Filed requests with LexisNexis and Thomson Reuters. Blocked 100+ ad networks. The data they have on you right now is the most they'll ever have.`],
      100: [
        `The Reclamation is complete. The endgame is over. Your credit is frozen. Your name is being pulled from the people-search sites. The enterprise aggregators have your opt-out requests. Your phone isn't broadcasting your coordinates to the bidstream anymore. Look at the city. When you started, every district was dark. Now it's yours. Not because you deleted yourself from the internet — nobody can do that. But because you made a deliberate choice about what to share, with whom, and on what terms. That's what reclamation means. Not disappearing. Deciding.\n\nThe organizations fighting this fight — EFF, EPIC, Access Now, Fight for the Future, The Markup, Citizen Lab, Signal — they're still out there. Your opt-outs created paper trails. Their lawsuits turn those paper trails into enforcement. Consider supporting them.`,
        `City liberated. Every district. Every building. Every wall.\n\nThe data brokers will re-add you from public records in three to six months. Set a calendar reminder. Come back. Opt out again. Each time you do, the paper trail gets longer, the enforcement case gets stronger, and the cost of ignoring you goes up. The resistance is winning. The laws are changing. The fines are real. And your city is lit.`,
      ],
    },
    return: {
      short: `Back in The Reclamation. The opt-out queue is right where you left it.`,
      medium: `Welcome back. Your opt-outs are processing. Some brokers take 72 hours, some take 30 days, some take a stern letter. The next one on the list is ready when you are.`,
      long: `You're back. The Reclamation doesn't expire. The brokers are still there, still selling. But your filed opt-outs are working through their systems. Let's add more to the pile.`,
      veryLong: `Hey. The Reclamation is a long campaign — nobody finishes it in one sitting. Every opt-out you've filed is still in their systems. Every credit freeze is still active. You're further along than you were.`,
    },
    debrief: {
      optoutDone: [`Filed. One more broker that can't sell your data. They might re-add you in six months — and you'll opt out again, and the paper trail gets longer.`, `Done. That opt-out is now a data point. When the next enforcement case hits, your request is in the evidence pile.`, `Submitted. Another piece of the surveillance economy that no longer has your explicit permission.`],
      alreadyDone: [`Already filed. Someone's been through The Reclamation before. Confirmed and logged.`, `Already handled. Marking it secured.`],
      freezeDone: [`Frozen. Nobody opens credit in your name now without you unfreezing it first. That's prevention, not monitoring.`, `Credit locked at that bureau. Before 2018, this cost money. Consumer advocates fought for years to make it free. You just used what they won.`],
      idDefenseDone: [`Defense layered. You can't change your Social Security number or your face. But you can make them useless to anyone who steals a copy.`, `IRS PIN set. Nobody files a tax return in your name without a six-digit code that only you have.`],
      skip: [`Queued. The Reclamation is a campaign, not a sprint. Come back when you have a block of time.`, `No rush. The brokers have had your data for years. But don't leave it indefinitely.`],
    },
    lore: {
      data_broker_economy: { title: 'The $200B Industry', text: `The data broker industry generates over $200 billion in annual revenue. Larger than the global music, video game, and newspaper industries combined. The product is you — the specific, identifiable, enriched version of you. You are not the customer. You are the inventory.` },
      delete_act: { title: 'California DELETE Act', text: `In 2023, California passed the DELETE Act — the first law to create a single mechanism for opting out of all registered data brokers at once. The DROP platform processes one deletion request across 600+ registered brokers. $200/day fines per unfulfilled request. The CPPA has a dedicated enforcement strike force.` },
      bidstream: { title: 'The Ad Bidstream', text: `Every time an ad loads on your phone, your precise GPS coordinates are broadcast to hundreds of companies in a real-time auction that takes 100 milliseconds. The winning bidder shows you an ad. Every other company that participated got your location data for free. This happens dozens of times per hour.` },
      work_number: { title: 'The Work Number', text: `Equifax Workforce Solutions maintains employment and salary records for over 140 million Americans. Your employer reports your paycheck to them every pay period. Landlords and lenders buy this to verify your income. You did not consent to this.` },
      legal_victories: { title: 'The Resistance Is Winning', text: `GDPR established the right to erasure. California CCPA/CPRA gave the right to delete and opt out. The DELETE Act covers 600+ brokers. The FTC banned location data brokers. Illinois BIPA led to a $650M Facebook settlement. Vermont requires broker registration. None of these happened automatically. Every one was fought for.` },
    },
    allies: [
      { name: 'EFF', url: 'https://www.eff.org/', description: 'The oldest digital rights organization. In every fight on this list.' },
      { name: 'EPIC', url: 'https://epic.org/', description: 'FOIA requests and litigation that force transparency on data brokers.' },
      { name: 'Access Now', url: 'https://www.accessnow.org/', description: 'Global digital rights and the 24/7 Digital Security Helpline.' },
      { name: 'Fight for the Future', url: 'https://www.fightforthefuture.org/', description: 'Killed SOPA/PIPA, campaigned for facial recognition bans.' },
      { name: 'The Markup', url: 'https://themarkup.org/', description: 'Investigative data journalism. Built the Blacklight privacy inspector.' },
      { name: 'Consumer Reports', url: 'https://www.consumerreports.org/', description: 'Now rates companies on privacy, not just product quality.' },
      { name: 'Citizen Lab', url: 'https://citizenlab.ca/', description: 'Exposed Pegasus spyware and government surveillance worldwide.' },
      { name: 'Signal Foundation', url: 'https://signal.org/donate/', description: 'The encrypted messenger that refuses to compromise.' },
    ],
  },
};
