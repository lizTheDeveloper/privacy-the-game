# Scout Dialogue -- Chapter 12: The Trail

> **Wired in v7.13.0** as `DISTRICT_DIALOGUE.trail` in `src/data/dialogue.js`, cut to what the Trail missions' own briefings support. Left out because the missions don't support them: the geotagged-photo safe-house case, the "2018 study" of insurers buying grocery data, the MIT "four points, 90%" figures (the missions keep the general finding), and the BNPL credit-reporting claims (the missions say Afterpay and Klarna's Pay in 4 don't report). The shipped lines are the source of truth; this draft is history.

> Passive data leakage: photos, loyalty cards, payments, browser fingerprints.
> Tone: philosophical, resigned but determined. This isn't about what someone did to you -- it's about data you left behind just by existing.

---

## 1. District Intro

**`district_intro`**

> The other districts were about accounts. Someone could hack them, breach them, steal them. This district is different. Nobody hacked you here. You just took photos, bought groceries, browsed the web, and swiped your credit card -- and every one of those ordinary actions left a trail that someone is selling. GPS coordinates embedded in your vacation photos. A grocery store that knows your diet better than your doctor. A browser configuration so unique it identifies you without a single cookie. Welcome to The Trail. This is the data you scatter just by participating in modern life. The good news: most of it can be stopped.

---

## 2. Facility Intros

### Photo Metadata

**`facility_intro_photo_metadata`**

> Every photo your phone takes embeds invisible coordinates. Not approximately -- precisely. GPS accurate to a few meters, the exact time, your device model. One photo of your living room posted to a forum reveals your home address. Domestic violence survivors have been found through a single geotagged photo shared by a well-meaning friend. Most people have thousands of these location pins in their camera roll right now. Two minutes in your camera settings stops it permanently.

### Loyalty Programs

**`facility_intro_loyalty_programs`**

> The loyalty card is the most honest surveillance tool ever invented. You knowingly trade a record of every purchase for a small discount. The part that wasn't on the sign-up form: your grocery store sells your purchase history to data brokers, who sell it to insurance companies, who adjust your premiums based on what you buy. A 2018 study showed health insurers were using grocery purchase data -- alcohol, tobacco, processed food -- as risk factors. The discount on your toothpaste is funding a profile that determines what you pay for health insurance.

### Payment Trail

**`facility_intro_payment_trail`**

> Every card swipe creates a record. Visa and Mastercard aggregate this into datasets they sell to marketers and analytics firms. Researchers at MIT showed that just four transaction data points -- four purchases -- are enough to uniquely identify a person in an "anonymized" dataset. The store, the date, the approximate amount. That's it. On top of that, Plaid -- the service that lets apps "connect to your bank" -- settled a $58 million class action for scraping more transaction data than users authorized. And Buy Now Pay Later services opened credit accounts in your name at checkout with a single click, reporting to credit bureaus and sharing transaction data with marketing partners.

### Browser Fingerprint

**`facility_intro_browser_fingerprint`**

> Cookies are yesterday's tracking. The industry moved on to browser fingerprinting -- a technique that identifies you by your browser's configuration without storing anything on your device. Your screen resolution, installed fonts, graphics card, timezone, language, plugin list -- combined, these create a fingerprint that EFF's research found is unique for 83% of browsers. Private browsing doesn't help because the fingerprint IS your configuration, not your stored data. And underneath all of this, your ISP logs every domain you visit via DNS queries, which Congress voted in 2017 to let them sell.

---

## 3. Debrief Reactions

### Audit — Nothing Concerning

**`debrief_audit_clean_1`**

> Clean, or close to it. Either you've been unusually careful about your passive data trail, or you don't engage much with the systems that create it. Either way, that's a strong position to defend.

**`debrief_audit_clean_2`**

> Nothing alarming. That's rarer than you'd think -- most people find at least one thing in The Trail that surprises them.

### Audit — Some Exposure

**`debrief_audit_minor_1`**

> Found some things you didn't expect. That's the whole point of this district -- the data you leave behind without realizing it. Now you see it, and seeing it is the first step to stopping it.

**`debrief_audit_minor_2`**

> Some exposure. Not unusual -- these systems are designed to collect without being noticed. The fact that you noticed is the change.

### Audit — Significant Exposure

**`debrief_audit_major_1`**

> Significant trail. Don't be discouraged -- this is the most common result. These systems have been collecting for years without anyone telling you to look. You're looking now. That's the inflection point.

**`debrief_audit_major_2`**

> A lot of passive data. Remember: this isn't about what you did wrong. It's about systems designed to extract value from ordinary behavior. Now you know the mechanism, and you can start shutting the pipelines off.

### Action — Completed

**`debrief_action_done_1`**

> Done. One less data pipeline running in the background. These are the changes that compound -- each one is small, but together they transform your passive exposure.

**`debrief_action_done_2`**

> Step completed. The trail is getting fainter. Every setting you change, every account you close, every opt-out you submit -- it all adds up to a person who's harder to track.

### Action — Already Done

**`debrief_already_1`**

> Already in place. You've been paying attention to the passive trail before most people knew it existed. That awareness is worth more than any single setting change.

**`debrief_already_2`**

> Already handled. The Trail is the district where the privacy-conscious shine -- these are the details that separate someone who cares from someone who's just heard of a password manager.

### Action — Skip

**`debrief_skip_1`**

> No rush. The trail isn't going anywhere -- that's kind of the whole problem. But it'll be here when you're ready.

**`debrief_skip_2`**

> Noted. Come back when you have a few minutes. Most of these changes are smaller than they look -- the hardest part is remembering to do them.

---

## 4. Progress Check-Ins

### 25% Complete

**`progress_25`**

> Quarter of the way through The Trail. You're seeing things now that most people never see -- the metadata in their photos, the data behind their loyalty cards. Awareness itself is a form of defense.

**`progress_25_alt`**

> 25%. The passive data trail is starting to thin out. Every pipeline you've shut off was running 24/7 in the background. It's not running anymore.

### 50% Complete

**`progress_50`**

> Halfway through The Trail. You've addressed the loudest data leaks -- the ones that were broadcasting your location, your purchases, your browsing to anyone who wanted to buy it. The remaining ones are quieter but worth closing.

**`progress_50_alt`**

> 50%. The invisible has become visible. You can't unsee the EXIF data in photos, the data-sharing toggles in loyalty apps, the DNS queries flowing to your ISP. That permanent awareness is the real prize.

### 75% Complete

**`progress_75`**

> Three-quarters done. The Trail is fading. You've stripped your photo metadata, cleaned your loyalty footprint, audited your payment connections, and hardened your browser. Most of the passive pipelines are shut down.

**`progress_75_alt`**

> 75%. A few missions left and you'll have addressed every major passive data channel. The data you scatter just by existing is now a trickle instead of a flood.

### District Complete

**`progress_complete`**

> The Trail is clear. You've done something most people never do: you've examined every passive data channel -- your photos, your purchases, your browsing, your payment records -- and shut down the ones that were running without your knowledge. The data trail you leave behind just by living your life is now deliberate, not accidental. You chose what to share. That's the difference between being tracked and being surveilled.

**`progress_complete_alt`**

> District twelve: done. The Trail is under your control. Photos without GPS, loyalty programs opted out, Plaid connections reviewed, browser hardened, DNS encrypted. The systems that were designed to collect without being noticed no longer work on you. You broke the passive surveillance model.

---

## 5. Idle / Return Lines

**`return_short`** *(gone < 1 day)*

> Welcome back. The Trail is where you left it -- which is less creepy when the trail is yours and not your data's.

**`return_medium`** *(gone 1-3 days)*

> Hey -- good timing. The passive data trail keeps growing while you're away, but the pipelines you've already shut down stay shut. Pick up where you left off?

**`return_long`** *(gone 4-7 days)*

> You're back. Every day you weren't here, your phone was still geotagging photos, your ISP was still logging DNS queries, and your loyalty cards were still tracking purchases. The ones you've already fixed are still fixed. Let's keep going.

**`return_very_long`** *(gone 7+ days)*

> Hey, stranger. The Trail is patient -- it was collecting data before you knew it existed, and it'll keep collecting until you stop it. Your progress is saved. The pipelines you closed are still closed. Let's finish what you started.

---

## 6. Lore

### `lore_exif_stalking`

> EXIF data has been used in stalking and domestic violence cases. In one documented case, a survivor's location was revealed through a photo shared by a friend -- the GPS coordinates in the image metadata pointed to the survivor's safe house. The photo was well-meaning. The metadata was lethal. This is why stripping EXIF isn't just a privacy preference. It's a safety practice.

### `lore_loyalty_insurance`

> In 2018, reporting revealed that health insurance companies were purchasing grocery store loyalty card data to assess the dietary habits of customers and adjust premiums. Alcohol purchases, tobacco, high-sugar foods -- all correlated with health risk factors. The loyalty discount that saved you fifty cents on toothpaste funded a profile that determined what you pay for insurance. The companies involved denied using the data for individual pricing, but admitted to using it for "population health modeling." The line between those is thinner than the denial suggests.

### `lore_plaid_settlement`

> Plaid settled a class-action lawsuit for $58 million in 2022. The suit alleged that when users connected their bank accounts through apps like Venmo, Robinhood, and budgeting tools, Plaid collected more data than authorized -- including full transaction histories -- and shared it with third parties for purposes beyond what users consented to. The settlement required Plaid to delete improperly collected data and limit future collection to what's "reasonably necessary." Your Plaid data access request (plaid.com/legal/data-protection-request) lets you see what they still have.

### `lore_card_deanonymization`

> Researchers at MIT published a study in Science showing that four data points from "anonymized" credit card records were sufficient to uniquely identify 90% of individuals in a dataset of 1.1 million people. The data points were simple: the store, the date, and the approximate amount. Adding the price of just one purchase raised re-identification to 94%. "Anonymized" transaction data is a legal fiction. The metadata IS the identity.

### `lore_isp_privacy_repeal`

> In 2017, Congress voted to repeal FCC broadband privacy rules that would have required ISPs to get customer consent before selling browsing data. The rules never took effect. Your ISP now has the legal right to log every domain you visit via DNS and sell that data to advertisers and data brokers. The ISPs promised self-regulation. The advertising revenue from selling browsing data tells you how that promise went. Encrypted DNS is your response: it sends your queries through an encrypted channel to a provider that doesn't sell them.

### `lore_browser_fingerprinting`

> EFF's Cover Your Tracks project (formerly Panopticlick) demonstrated that 83.6% of browsers visiting the site had a unique fingerprint -- identifiable without any cookies, local storage, or tracking scripts. The fingerprint is assembled from publicly available browser properties: your User-Agent string, screen resolution, installed fonts, WebGL renderer, timezone, language, Do Not Track setting, and canvas rendering. Each property alone is common. Combined, they're unique. The technique was first published in 2010 by researcher Peter Eckersley at EFF. It has since become the industry-standard tracking method for circumventing cookie blockers and ad blockers.

### `lore_allies`

> **EFF (Electronic Frontier Foundation)** -- [eff.org](https://www.eff.org/) -- Built Cover Your Tracks, filed the cases that established fingerprinting as a privacy violation, and advocates for legislation requiring opt-in consent for tracking. Donate at [eff.org](https://www.eff.org/).
>
> **The Markup** -- [themarkup.org](https://themarkup.org/) -- Their Blacklight tool scans any website and tells you exactly what trackers are running, including fingerprinting scripts. Their investigative reporting on loyalty program data sales and ad tracking has led to congressional hearings. Support independent journalism at [themarkup.org](https://themarkup.org/).
>
> **Consumer Reports** -- [consumerreports.org](https://www.consumerreports.org/) -- Now rates companies on privacy, including data-sharing practices for loyalty programs and financial services. Their Digital Lab tests apps for hidden data collection. Support them at [consumerreports.org](https://www.consumerreports.org/).
