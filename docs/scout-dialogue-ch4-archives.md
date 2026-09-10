# Scout Dialogue — Chapter 4: The Archives

> Cloud Storage & Work Accounts  
> Tone: cyberpunk deadpan, warm underneath, never shaming.  
> Scout has seen too much and copes with specificity.  
> This district carries lore: the real you lives in these files.

---

## 1. District Intro

**`district_intro`**

> Welcome to The Archives. This is where the real you lives — not the curated version you post on social media, but the actual documents. Your tax returns. Your ID scans. Your employment contracts. Your code. The photo of your passport you took "just in case." Dropbox was breached in 2012 — 68 million credentials leaked — but they didn't tell anyone until 2016. Four years of silence while those passwords circulated. The CLOUD Act of 2018 gave US law enforcement the power to compel any American cloud provider to hand over data stored anywhere in the world. If your files are on Google Drive, Dropbox, or OneDrive, they're one subpoena away from someone's desk — regardless of which country the server is in. GitHub is the other archive most people forget. Every API key, every password, every database credential you've ever accidentally committed to a public repo is indexed, searchable, and actively hunted by automated scanners within seconds of the push. Your cloud is not a vault. It's a filing cabinet with a glass door. Let's put some locks on it.

**`district_intro_short`**

> The Archives. Your real documents live here — tax returns, ID scans, code, everything you wouldn't post publicly. Time to audit who else has access.

---

## 2. Lore Drops

**`lore_dropbox_breach`**

> "Dropbox was breached in 2012. 68 million email-password pairs leaked. The company didn't disclose the full extent until 2016 — four years where those credentials were circulating in breach databases while users had no idea. If your Dropbox password predates 2016, it's been public for a decade."

**`lore_cloud_act`**

> "The CLOUD Act, passed in 2018, lets US law enforcement compel American cloud providers — Google, Microsoft, Dropbox, Apple — to hand over user data stored anywhere in the world. Your Google Drive files in an EU data center are still reachable by a US warrant. The legal protection is not the server's location. It's whether the company is American."

**`lore_github_secrets`**

> "GitHub secret scanning catches thousands of leaked credentials every day — API keys, database passwords, cloud tokens, accidentally committed to public repos. Automated bots scan every public push within seconds. There's an entire economy built on harvesting committed secrets before the developer notices their mistake. If you've ever pushed credentials to a public repo, even briefly, assume they were captured."

**`lore_enterprise_sso`**

> "Enterprise SSO is a double-edged tool. It protects you by centralizing authentication — one strong identity, one MFA policy, access to everything. It also means your employer can see every app you access through it, when you accessed it, and for how long. It's security and surveillance in the same package. The protection is real. So is the monitoring."

**`lore_google_docs_animals`**

> "When you open a Google Doc as an 'anonymous' viewer, Google assigns you a random animal avatar — Anonymous Aardvark, Anonymous Bison. The document owner sees the animal, not your name. But Google knows exactly who you are. The anonymity is from the doc owner, not from Google. There is no anonymous on Google's infrastructure."

**`lore_donate`**

> "The people defending digital rights in this space include the Electronic Frontier Foundation (eff.org) — the oldest and largest digital rights organization — and the Freedom of the Press Foundation (freedom.press), which builds tools like SecureDrop to protect whistleblowers and journalists. If your archives contain anything worth protecting — and they do — these are the organizations building the legal and technical walls around them."

---

## 3. Mission Briefing Dialogue

### Google Drive

**`briefing_shared_links_gdrive`**

> "Google Drive makes sharing easy. Too easy. Every 'anyone with the link' share you've ever created is still live unless you manually revoked it. That shared folder from a group project in 2019? Still accessible. That resume you shared with a recruiter? Still out there. This audit finds them all."

**`briefing_third_party_gdrive`**

> "Every app that asked 'Allow access to your Google Drive?' is still in there — editing permissions, read access, sometimes full access to every file. Some of those apps no longer exist as companies. Your authorization does."

### Dropbox

**`briefing_breach_dropbox`**

> "Dropbox's 2012 breach leaked 68 million credentials. If your Dropbox account predates 2016 — when they finally disclosed the full scope — your old password has been in circulation for over a decade. Even if you changed it since, this is why we check."

**`briefing_lockdown_dropbox`**

> "Dropbox shows every device and session connected to your account. An old laptop you sold, a work computer you left — if you didn't unlink them, they can still sync your files. Every device on this list is a copy of your archive walking around in the world."

**`briefing_shared_dropbox`**

> "Shared Dropbox folders are permanent unless actively unshared. That shared folder with your old roommate? Still syncing. The project folder with a former coworker? They still have access. This cleanup finds the shares you forgot about."

### GitHub

**`briefing_security_log_github`**

> "GitHub's security log shows every authentication event, every token creation, every SSH key addition. If someone added a deploy key you don't recognize, they have read access to your repos. If they added a personal access token, they might have write access."

**`briefing_lockdown_github`**

> "GitHub personal access tokens are the keys to your code kingdom. Old tokens from deprecated scripts, CI pipelines you no longer use, integrations you forgot about — each one is an active credential that can read, write, or admin your repos. Rotate them."

**`briefing_secrets_scan_github`**

> "This is the most developer-specific mission in the game. If you've ever pushed code to a public repo, you might have accidentally committed an API key, a database password, a cloud credential, or a .env file. GitHub's secret scanning catches some of these. Your own grep catches the rest. Every committed secret is a door you left open."

---

## 4. Debrief Reactions

### No Breaches Found

**`debrief_clean_1`**

> Clean archives. No breach exposure on your cloud accounts. Your documents — the real ones, the ones you wouldn't post publicly — are behind clean credentials. That matters more here than anywhere.

**`debrief_clean_2`**

> No breaches found. In a district where Dropbox sat on a 68-million-credential leak for four years, a clean result is worth appreciating.

### Found in Breaches

**`debrief_minor_breach_1`**

> Some exposure. Cloud accounts are high-value targets because they contain documents, not just profiles. A breach here means someone potentially had access to your files, not just your email address. Fresh password, now.

**`debrief_major_breach_1`**

> Multiple breaches on a cloud account. This is the Archives — tax returns, ID scans, contracts. The credentials that guard these are worth treating as critical. New password, 2FA, and audit every shared link while you're in there.

### Shared Links/Folders Cleaned

**`debrief_shared_cleaned_1`**

> Shared links revoked. Every 'anyone with the link' share you killed was a document floating in the open. Now it's not. Simple math, real impact.

**`debrief_shared_cleaned_2`**

> Folders unshared. That's fewer people with silent, perpetual access to your files. The people you shared with probably forgot about the folder too — but the link didn't forget.

### Secrets Found (GitHub)

**`debrief_secrets_found_1`**

> Secrets found in your repos. Every committed credential is an active key someone could use right now. Rotate the credentials immediately — changing the password in the repo history isn't enough, because git history is permanent. Rotate the key at the source.

**`debrief_secrets_clean_1`**

> No secrets found. Either you've been careful, or you haven't been pushing code publicly. Either way, clean repos are clean repos.

### Skip

**`debrief_skip_1`**

> Noted. The Archives will wait. But remember — these aren't social profiles. These are your actual documents. The urgency is real, even if it doesn't feel like it.

**`debrief_skip_2`**

> Parking this for now. Come back when you can — the files in The Archives are the most sensitive data you own, even if they're the least exciting to secure.

---

## 5. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter of The Archives secured. This district is smaller than The Square but higher stakes. Every file in here is something you wouldn't want a stranger to read. Keep going.

**`progress_25_alt`**

> 25% through. You're auditing the places where your real documents live — the things that would actually matter if someone got in. This is important work.

### 50% Complete

**`progress_50`**

> Halfway through The Archives. Shared links audited, passwords reset, devices checked. The glass door is getting some curtains. Your files are still in the cloud, but the access controls are actually controlled now.

**`progress_50_alt`**

> 50% liberated. If the CLOUD Act means a warrant can reach your files, at least unauthorized access can't. That's the part you control.

### 75% Complete

**`progress_75`**

> Three-quarters done. The Archives are almost secured. If you have GitHub repos, the secrets scan is the last high-value mission — committed credentials are the single most common way cloud infrastructure gets compromised.

**`progress_75_alt`**

> 75%. The bulk of your archives are locked down. A few more audits and this district is clean.

### District Complete

**`progress_complete`**

> The Archives are liberated. Your cloud storage — audited, locked, cleaned. Every shared link reviewed. Every old device unlinked. Every lingering permission revoked. Your documents are still in the cloud — the cloud is not a vault — but the access controls are yours now. The CLOUD Act can still reach them. Unauthorized access can't. That's the line you can draw, and you drew it.

**`progress_complete_alt`**

> District four: done. The Archives were the quiet district — no social drama, no financial urgency, just your files sitting in the cloud behind passwords that may or may not have been unique. Now they are. Every shared link, every device, every third-party app — audited and locked. Your documents are as secure as cloud storage allows. Ready for The Marketplace?

---

## 6. Idle / Return Lines

**`return_short`** *(< 1 day)*

> Back in The Archives. Your files are where you left them. So are the missions. Let's continue.

**`return_medium`** *(1-3 days)*

> The Archives are holding. Cloud accounts don't change much day to day — but shared links accumulate silently. Good time to audit one.

**`return_long`** *(4-7 days)*

> You're back. Fun fact: in the time you've been away, approximately 12,000 API keys were accidentally committed to public GitHub repos worldwide. Yours? Let's check.

**`return_very_long`** *(7+ days)*

> Welcome back to The Archives. Your secured accounts are still secured — that's the nice thing about good passwords. The unsecured ones haven't gotten more secure on their own, though. That's the less nice thing. Let's pick up where we left off.

**`return_idle_check`**

> The Archives are %PERCENT%% liberated. Your tax returns and ID scans are in there. One more mission is worth it.
