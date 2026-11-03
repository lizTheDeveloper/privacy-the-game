# Scout Dialogue -- Chapter 11: The Clinic

> **Wired in v7.13.0** as `DISTRICT_DIALOGUE.clinic` in `src/data/dialogue.js`, cut to what the Clinic missions' own briefings support. Changed: 23andMe is no longer "about to be sold"; TTAM Research Institute bought it in July 2025. Left out because the missions don't support them: the "$58 billion" wellness figure, life insurers buying social-media data, GoodRx's "55 million users", BetterHelp's "2 million users", and Google's Fitbit ad commitment to the EU. The shipped lines are the source of truth; this draft is history.

> Health, fitness, and genetic data.
> Tone: Scout at their most protective. This data is about people's bodies.
> Angry at the HIPAA gap. Post-Dobbs urgency for reproductive data.

---

## 1. District Intro

**`district_intro`**

> This district is different from the others. Everything we have secured so far -- your email, your bank, your social media -- is data about what you do. The Clinic is data about what you are. Your heart rate. Your sleep. Your DNA. Your prescriptions. Your mental health diagnoses. And here is the part that makes me angry: almost none of it is protected by HIPAA. HIPAA protects the data your doctor stores. It does NOT protect the data your Fitbit collects, your period tracker logs, your therapy chatbot records, or your prescription discount app searches. That gap is not an accident. It is a business model. Let's close it.

---

## 2. Facility Intros

**`facility_intro_fitness_trackers`**

> Your fitness tracker is the most intimate sensor you own. It knows your resting heart rate, your stress levels, your sleep quality, and every route you run. Google acquired Fitbit in 2021 -- a decade of biometric data on 31 million people, transferred to the largest advertising company on Earth. Apple keeps health data on-device by default, but third-party apps can request access to all of it. The tracker on your wrist is collecting a continuous medical record. Let's find out who is reading it.

**`facility_intro_health_apps`**

> Flo, the most popular period tracker on Earth, shared reproductive health data with Facebook for ad targeting. BetterHelp, the largest online therapy platform, put Facebook's tracking pixel on the page where you describe your depression. MyFitnessPal got breached -- 150 million accounts. These are not edge cases. This is the health app industry. The HIPAA gap means there is no federal law stopping a mental health app from selling your diagnosis to an advertiser. The FTC has started enforcing, but they are playing catch-up.

**`facility_intro_genetic_testing`**

> This is the most urgent facility in The Clinic. 23andMe is bankrupt, and your DNA -- the one piece of data you can never change, never rotate, never re-issue -- is sitting on a server that is about to be sold to the highest bidder. The California Attorney General told everyone to delete their data. You cannot change your genome after a breach. A compromised password is a reset. A compromised Social Security number is a freeze. A compromised genome is permanent. Let's move.

**`facility_intro_telehealth`**

> BetterHelp paid $7.8 million to the FTC for sharing therapy data with Facebook. Cerebral sent mental health diagnoses to TikTok and Snapchat. GoodRx shared prescription searches with Meta and Google. Your search for antidepressants became an ad-targeting signal. None of this was covered by HIPAA because these companies are tech companies, not healthcare providers. The gap is the business.

**`facility_intro_health_insurance`**

> Employer wellness programs are a $58 billion industry built on your biometrics. The Fitbit discount your employer offers is not generosity -- it is a data pipeline to the insurance company. Life insurers buy social media data to set premiums. Your Instagram posts and grocery loyalty card purchases can affect your rates. The Affordable Care Act says they cannot charge more for pre-existing conditions. Wellness program "incentives" are the legal workaround.

---

## 3. Debrief Reactions

### Health data was clean

**`debrief_clean_1`**

> No concerning data sharing found. Your health data is staying where it should -- with you and your doctor. That is rarer than you think.

**`debrief_clean_2`**

> Clean. You either chose your apps carefully or got lucky. Either way, your biometrics are not in an advertising database today.

### Found and fixed data sharing

**`debrief_sharing_found_1`**

> You found the leak and plugged it. That data was being harvested quietly in the background -- most people never check. The fact that you did means it stops now.

**`debrief_sharing_found_2`**

> Data sharing disabled. Every connection you cut is a pipeline that stops carrying your biometrics to someone who should not have them.

### Major exposure found

**`debrief_major_1`**

> Significant exposure. Your health data was being monetized -- but now you know, and you stopped it. That is what this district is for. The system counts on you never looking.

**`debrief_major_2`**

> That is a lot of health data flowing out. You locked it down. In The Clinic, catching the leak is the hardest part. The fix is usually a few toggles.

### Action completed

**`debrief_done_1`**

> Done. One more piece of your body's data reclaimed. The Clinic is the most personal district -- every mission here matters more than it seems.

**`debrief_done_2`**

> Completed. This district is about your body, your health, your most private data. Every step here is worth ten steps elsewhere.

### Skip

**`debrief_skip_1`**

> No pressure. The Clinic is heavy -- it is about your body, not just your accounts. Come back when you are ready.

**`debrief_skip_2`**

> Understood. Some of these are harder than others. The mission will be here.

### Genetic data deleted

**`debrief_genetic_deleted`**

> Deletion requested, sample destruction requested. You just made the most permanent data protection decision possible. Unlike every other mission in this city, this one cannot be reversed by a future breach. Your DNA is being removed from their servers. Confirm both emails they send.

### No genetic testing account

**`debrief_genetic_none`**

> No genetic testing accounts. That is the best defense for data you cannot change. If a relative has tested, your DNA is partially exposed through familial matching -- but that is beyond your control.

---

## 4. Progress Check-Ins

### 25% Complete

**`progress_25`**

> A quarter of The Clinic secured. You are learning how your body has been turned into data -- and how little of it is protected by the laws most people think apply. Keep going.

**`progress_25_alt`**

> 25%. The fitness tracker audit alone put you ahead of most people. They do not know what their wristband is reporting. You do now.

### 50% Complete

**`progress_50`**

> Halfway through The Clinic. The hardest missions -- the genetic data, the therapy app audits -- are the ones that feel the most personal. That is because they are. Every one of these is about your body, not just your accounts.

**`progress_50_alt`**

> 50%. If you have handled the genetic testing section, you have done the most urgent work in this district. The 23andMe deletion alone was worth the trip.

### 75% Complete

**`progress_75`**

> Three-quarters of The Clinic liberated. Your biometric footprint is dramatically smaller than when you walked in. Heart rate data, prescription searches, DNA profiles -- locked down or deleted. The surveillance economy lost a data source today.

**`progress_75_alt`**

> 75%. Most people never think about their health data until a breach makes headlines. You are not most people. You looked, you found the leaks, and you closed them.

### District Complete

**`progress_complete`**

> The Clinic is fully liberated. Fitness trackers locked down. Health apps audited. Genetic data deleted or controlled. Prescription sharing stopped. Insurance data pipelines understood. This was the most personal district in the city -- the data here was about your body, your health, your most intimate moments. And now it is yours again.

**`progress_complete_alt`**

> Every facility in The Clinic -- secured. HIPAA does not protect your Fitbit data. The FTC does not have enough lawyers to sue every therapy app that shares with Facebook. The gap in the law is real. But you closed the gap for yourself. That matters. And the organizations fighting to close it for everyone could use your support.

---

## 5. Lore

### `lore_hipaa_gap`

> HIPAA -- the Health Insurance Portability and Accountability Act -- was signed in 1996, when "health data" meant paper records in a doctor's filing cabinet. It covers "covered entities": doctors, hospitals, pharmacies, insurers, and their "business associates." It does NOT cover Fitbit, Apple Health, Flo, BetterHelp, MyFitnessPal, GoodRx, or any consumer health app. This is not a loophole. It is a 30-year-old law that never imagined you would carry a continuous heart rate monitor in your pocket. Every health app that sells your data is operating in HIPAA's blind spot -- legally.

### `lore_23andme_bankruptcy`

> 23andMe filed for Chapter 11 bankruptcy in March 2025. At that point, the company held genetic data on approximately 15 million people -- DNA sequences, health predispositions, ancestry information, and familial connections. Under bankruptcy law, this data is a corporate asset. It can be sold to pay creditors. The California Attorney General and the California Privacy Protection Agency both issued public advisories urging customers to delete their data before the sale. The FTC has limited authority to block a data sale in bankruptcy. Your genome is the only data that is truly permanent. You cannot rotate it. You cannot freeze it. You cannot get a new one.

### `lore_betterhelp`

> In 2023, the FTC found that BetterHelp -- a platform where people seek therapy for depression, anxiety, trauma, and addiction -- had shared user health data with Facebook, Snapchat, Criteo, and Pinterest for advertising purposes. The sharing happened through the Facebook pixel embedded on BetterHelp's website, including on the intake questionnaire where users describe their mental health conditions. The FTC ordered BetterHelp to pay $7.8 million in partial refunds and banned the company from sharing health data for advertising. BetterHelp had more than 2 million users at the time.

### `lore_goodrx`

> GoodRx, the prescription discount app, shared users' medication searches with Meta, Google, and other advertising platforms. When you searched for antidepressants, HIV medication, or fertility drugs on GoodRx, that information was transmitted to advertising companies via tracking pixels. The FTC fined GoodRx $1.5 million in 2023 -- the first enforcement action under the Health Breach Notification Rule against a company that is not a traditional healthcare provider. GoodRx had 55 million users.

### `lore_flo`

> Flo, the most-downloaded period tracker with over 300 million downloads, shared users' period and pregnancy data with Facebook for ad targeting. The FTC found that Flo transmitted information about when users were trying to conceive, had a period, or were pregnant. After Dobbs, this became a legal liability -- prosecutors in states with abortion restrictions can potentially subpoena period tracker data to establish pregnancy timing. Flo added an "Anonymous Mode" in response. But the data already shared with Facebook cannot be unshared.

### `lore_golden_state_killer`

> In 2018, law enforcement identified the Golden State Killer -- responsible for at least 13 murders and 50 rapes between 1974 and 1986 -- by uploading crime scene DNA to GEDmatch, a public genealogy database. The DNA did not match anyone directly, but it matched distant relatives who had voluntarily uploaded their own DNA. Through familial DNA matching, investigators narrowed the suspect pool to one family, then one man. The case was solved because a distant relative -- someone the killer had likely never met -- uploaded their DNA to a website that was not originally designed for law enforcement use. GEDmatch later changed its policy to require opt-in for law enforcement matching, but the precedent was set. Your DNA is not just yours. It is shared by blood.

### `lore_google_fitbit`

> Google completed its acquisition of Fitbit in January 2021 for $2.1 billion. The deal came with a decade of health data from 31 million active users: heart rate histories, sleep patterns, exercise routines, stress levels, menstrual cycles, and GPS-tracked workout routes. Google committed to the EU that it would not use Fitbit health data for ad targeting for a period of years, but that commitment expires. Google is the largest advertising company on Earth. Fitbit is now a Google product. Your heart rate is now a Google datapoint.

---

## 6. Allied Organizations

**`allies`**

> You are not fighting this alone. These organizations are working to close the HIPAA gap and hold health data brokers accountable:

> **EFF (Electronic Frontier Foundation)** -- [eff.org](https://www.eff.org/) -- They litigated against health data sharing and advocate for comprehensive federal privacy legislation that would close the HIPAA gap.

> **Access Now** -- [accessnow.org](https://www.accessnow.org/) -- Global digital rights, including health data protection for vulnerable populations. Their Digital Security Helpline helps people under threat.

> **Patient Privacy Rights** -- [pprights.org](https://pprights.org/) -- Focused specifically on health data privacy. They pushed for stronger FTC enforcement against health apps.

> **The Markup** -- [themarkup.org](https://themarkup.org/) -- Their investigation exposed the Facebook pixel on hospital websites, sending patient visit data to Meta. That reporting led to congressional hearings.

---

## 7. Return / Idle Lines

**`return_short`** *(gone < 1 day)*

> Welcome back to The Clinic. Your health data is where you left it -- under your control.

**`return_medium`** *(gone 1-3 days)*

> The Clinic is still here. Your body generates data every second -- heart rate, steps, sleep. The question is who gets to see it. Let's keep closing that gap.

**`return_long`** *(gone 4-7 days)*

> You have been away. No judgment -- The Clinic is heavy. These missions are about your body, and that makes them harder. But every one you complete is a data pipeline that closes for good.

**`return_very_long`** *(gone 7+ days)*

> Hey. The Clinic waited. Your health data is still being generated every second of every day, and the companies collecting it did not take a break. But your progress is saved, and the next mission is ready. Let's reclaim your biometrics.

**`return_idle_check`**

> The Clinic is %PERCENT%% liberated. One more mission. Your heart rate data will still be there in three minutes. So will the opt-out page.
