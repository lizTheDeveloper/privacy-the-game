# The Field: adversarial fact-check (2026-11-15)

An independent reviewer compared all 74 Field missions against the source
playbooks (`/Users/annhoward/src/themultiverse.school-wt-field-opsec-kit/tools/field_opsec_kit/source/playbooks/`).

**Result:** 0 INVENTED, 5 CHANGED, 16 WRONG TIER/CONTEXT, 32 DANGEROUS SIMPLIFICATION, 12 BAD SHARE.

The reviewer quoted the sources through sub-checkers and **did not re-read every quote**. A fixer
**must open the source playbook and confirm each quote before applying the fix.** If the
quote isn't in the source, don't apply that finding; report it.

## Policy for BAD SHARE

A shared mission is "part of this job". If the shared mission teaches something the
playbook calls a mistake (a 6-digit PIN against the playbook's 8+/10+, a recovery key saved to
the controlling account, backup codes in the password manager, "platforms strip EXIF", a
"cleaned" phone instead of an empty one), **drop the share** and keep the Field
step that states the playbook's rule. Never share a mission that contradicts the
playbook.

## Findings: missions-field-a.js

1. `who_is_after_you-reclaim-tier-drill` WRONG TIER: "Lower any routine beat you tiered for a worst case, if it has never drawn a single threatening email." D01 only asks you to check you aren't imagining a worst-case adversary; 01 tiers by capability. Fix: "Check you aren't picturing a worst case the beat has never drawn; re-tier by what that adversary can actually do."
2. `who_is_after_you-fortify-identities`: "stored at its highest tier". 02 step 7 says "at or above the highest tier of any identity in it", and also "Storing the register in the same vault as one of the identities" (currently only in a Scout line). Fix: "At or above the highest tier of any identity on it, and never inside one of the vaults it lists."
3. Same mission (minor): "(Incognito doesn't separate them)". Fix: "Use a real browser profile per identity, not Incognito."
4. `quiet_lines-fortify-work-inbox` BAD SHARE: `protonmail-fortify-2fa` accepts an authenticator app, but 06 step 3 requires "a hardware second factor"; `protonmail-reclaim-privacy` never removes personal recovery addresses. Fix: drop the shares, and add "Enroll a hardware key, not an app" and "Remove any recovery email pointing to a personal address."
5. Same mission: the canary step drops 06's "re-tier any active stories that touched it." Append it.
6. `the_meet-fortify-leaked-files` BAD SHARE: `photo_metadata-fortify-strip` says platforms strip EXIF and covers location only. 10: strip "before any document leaves your analysis environment", "Verify with multiple tools", "Never your daily driver." Drop the share; add "Strip GPS, device serial and timestamp with a dedicated tool on the analysis machine. Check the strip with a second tool."
7. Same mission, WRONG TIER: "re-image an outside USB stick… or destroy it". 10: from a source you do not know, "re-image is not enough; destroy after one-time read"; State: "the medium destroyed after analysis." Fix: "Unknown source or State: destroy it after one read."
8. Same mission: dropped "If a document tries to load external resources, phone home… stop, isolate the analysis machine, and proceed to Playbook 25", and Tails "Do not enable persistent storage… unless you have already planned the persistence". Add both.
9. `the_meet-fortify-plan`: "or fully powered off for the whole meet". 07 step 1 says "fully powered off (not airplane mode)". Restore "(not airplane mode)".
10. `the_meet-fortify-dead-drop`: opens and hashes the drop "at your bench". 08: treat the stick "per Playbook 10… before opening"; "you do not open the container outside the Playbook 10 workflow." Fix: "Open it only on a non-daily-driver analysis machine, then start the custody record."
11. `the_meet-fortify-onionshare` WRONG TIER: sends the address over Signal at every tier. 09 State: "The .onion address conveyed via one-time pad or pre-shared codebook." Add a State step.
12. Same mission: dropped "The source does not open the source files on the same machine they are about to send from", and the State rule to air-gap and wipe the receiving machine. Add both.

## Findings: missions-field-b.js

13 and 14. `the_crossing-reclaim-return-home`:
- No definition covers a device inspected at the desk while you watched. 14 step 2: inspected-and-returned includes a device that "was formally inspected by border authorities and returned at the desk."
- No State rule. 14 State: "Default to seized-and-returned procedure even if the device was returned without formal seizure… out-of-sight time at a State-tier destination is functionally equivalent to seizure", and "Rotate… every credential reachable from those credentials."
- Add all three.

15. `the_crossing-fortify-travel-device` BAD SHARE: `border_prep-reclaim-travel-device` leaves "a few social accounts" and a "separate vault". 11 says "Do *not* sign in to social accounts", "No password manager… at Mid and State", and "Deletion is not erasure." Drop the share.
16. `the_crossing-fortify-transit` and `the_crossing-reclaim-desk-drill`: the cover-story steps drop 12's "do not lie about facts the agent can verify" and 13's "Answer basic identity questions truthfully." Add: "A cover story leaves things out. It never states a false fact an agent can check."
17. `the_crossing-reclaim-desk-drill`: "plan to power it on without unlocking it" is missing 13 step 8's exception, "Do not power on the device on their request after they tell you it is being taken." Add it.
18. `the_crossing-recon-device-list` WRONG TIER: the State definition leaves out 11's "if you carry source material in your head". Add it.
19. `hostile_ground-reclaim-protest-moments` BAD SHARE: `photo_metadata-fortify-strip`. 16 step 8 names "Posting 'raw' photos to social media direct from the phone. Social-media platforms strip *some* metadata but not all, and the platform itself now has the unstripped originals" as a common mistake. Drop the share and state that rule.
20. Same mission, WRONG TIER: frame-and-blur is given at every tier. 16 State: "Do not stream live; do not publish photos that show attendee faces under any circumstances." Add a State step.
21. `hostile_ground-fortify-protest-kit`: "wear press credentials only if you're press". 16 Mid: "only if your role and jurisdiction make them protective; they are sometimes a target marker." Use the source's condition.
22. `hostile_ground-reclaim-tor`: State tier is sent to Tor with no legal caveat. 15: "The use of Tor and VPNs is restricted or criminalized in some jurisdictions." Add "Before you travel, check whether Tor or VPN use is illegal there."
23. `hostile_ground-reclaim-hostile-wifi` and `-reclaim-tor` WRONG TIER: both offer cellular or a hotspot as the safe fallback. 15 State: "Treat cellular in-country as also hostile." Add a State exception.
24. `lockdown-fortify-platform-plan`: nothing says not to lock or migrate after notice. 19: "Deleting messages, locking the account, or attempting to migrate after notice. Each of these creates additional legal exposure." The mission also drops "do not discuss the matter on the affected platform". Add both.
25. `lockdown-recon-device-record` BAD SHARE: `device_security-fortify-computer` says "Save the recovery key to your Microsoft account", which 03 names as a common mistake. Drop the share.
26. `lockdown-reclaim-account-checkup`: "end any you don't recognize". 17 step 8: "revoke anything you do not recognize or no longer use". Add "or no longer use".
27. `lockdown-reclaim-doxx-drill` WRONG TIER: police are presented as the answer at every tier. 18 State: "local law enforcement may not be reliably on your side. Coordinate with… CPJ, RSF, PEN International." Add a State step.
28. Same mission: "If a threat names a time or place, treat it as imminent". 18: "If a death threat is specific and credible… do not return to predictable patterns until reassessed." Restore the qualifier and the final clause.
29. Same mission BAD SHARE: `people_search-recon-find-yourself` belongs to the pre-emptive scrub, not the first-hour drill. Move it to `lockdown-fortify-doxx-scrub`.
30. `lockdown-fortify-social-graph`: drops 20's "the same email recovery, or the same phone number". Add "and no shared recovery email or phone number between personas."
31. Same mission: drops 20's "consider whether the affected source needs to be informed". Add it.
32. `lockdown-recon-social-graph` WRONG CONTEXT: the Scout line "Don't undo it in a rush. Undoing is a signal too." covers the whole graph, but 20 limits "do not undo it visibly" to an existing cross-link between personas. Fix the Scout line.
33. `lockdown-fortify-device-baseline`: drops 03's "Installing GrapheneOS and then signing into a personal Google account on it — the hardening is wasted." Add "and never sign into a personal account on it."
34. `lockdown-fortify-hardware-keys` BAD SHARE: `google-fortify-2fa-backup` puts codes "printed, or in your password manager", but 17 §6 says paper, apart from the password manager. Drop the share.

## Findings: missions-field-c.js

35. `the_door-reclaim-script` WRONG TIER: State tier is taught the chain and close-the-door. 21 S1: "Assume the door will be forced if you do not open it; opening it on your terms is better than having it kicked", and the first-thirty-seconds heading is "(Low and Mid)". Mark the chain/close steps Low and Mid, and add a State step: "Assume the door will be forced. Opening it on your terms beats having it kicked. Assume you won't be free to leave."
36. Same mission: "call the agency's published number to verify" is missing 21's "…before you do anything else". Append it.
37. `the_door-recon-ready` WRONG TIER: "Low (a routine visit…)". 21 Low assumes "a jurisdiction with broadly functional rule-of-law guarantees". Fix: "a routine visit, in a country whose courts would enforce your rights".
38. `the_door-recon-ready` and `the_door-fortify-kit` BAD SHARE: `device_security-fortify-phone` accepts a 6-digit passcode, but 03 asks for 8+ at Mid and 10+ at State, alphanumeric. Drop the share and state the tier lengths.
39. `the_door-reclaim-after-seizure`: "Never the compromised one" drops 22's "never a channel that runs through any account on the seized device". Add it.
40. Same mission WRONG TIER: no State branch. 22 S1: "initiate Playbook 25 - Burn Procedure for the identities and accounts the device touched." Add it.
41. Same mission: the inventory leaves out location history. 22 step 8: "travel and location history… reconstructible from photo geotags and… on-device location history". Add it.
42. `the_door-reclaim-seizure`: "call your lawyer first, then your editor". 22: "Lawyer first, editor / organization second, in parallel where possible." Add "in parallel where possible".
43. Same mission, Scout line: destroying evidence is "chargeable nearly everywhere". The source says "in every jurisdiction in scope" (22) and "in many jurisdictions" (21). Use the source wording.
44. Same mission: "Eject any mounted external drive" comes after the shutdown step, but 22 has eject before shutdown. Move it before.
45. `the_door-reclaim-warrant`: drops "they generally may not conduct a general search of the home on the arrest warrant alone". Add it, with "still don't consent".
46. `burn_protocol-fortify-trigger` DANGEROUS, AND THE MOST SERIOUS: "with a duress code phrase in every normal check-in" reads backwards. 23 S1: "the absence of the code-phrase is the trigger, not its presence". Fix: "Put the phrase in every normal check-in, and leave it out under compulsion. A check-in without it is the trigger." Also add the source's requirement that the check-in channel be hard to block.
47. `burn_protocol-fortify-trigger` and `-fortify-compelled` WRONG TIER: the Mid+ limit appears only in a Scout line. 23: "If you are not at Mid or above, do not perform this playbook." Make that the first step. Mark `-fortify-trigger` `optional: true` only if a different core fortify mission exists for the building. Otherwise keep it core and add the tier gate as step one.
48. `burn_protocol-fortify-compelled` BAD SHARE: `device_security-fortify-phone` (6-digit) contradicts the mission's own text. Drop it.
49. Same mission: the decoy unlock drops 23's warning that its "detection by an adversary may itself constitute a chargeable obstruction; ask the lawyer". Add it.
50. `burn_protocol-fortify-compelled` and `-recon-exposure` BAD SHARE: `border_prep-reclaim-travel-device` cleans an existing phone, but 23 says "Not 'carefully cleaned;' actually empty." Share `the_crossing-fortify-travel-device` instead.
51. `burn_protocol-reclaim-first-hour`: "Stop digging in; do not log out" is missing. Per 25 step 4, logging out may lose the evidence session, and at State tier it signals detection. Its common mistake: "Logging out, deleting messages, factory-resetting, 'to be safe.'" Add "Don't log out, delete messages or factory-reset yet."
52. `burn_protocol-fortify-source-end`: missing 24's "Do not destroy material in response to a subpoena". Add "If legal process arrives, call your lawyer before responding, and destroy nothing."
53. `burn_protocol-reclaim-clean-up` BAD SHARE: the `*-recon-login` shares remove only unknown devices, but 25 step 8 says "explicitly revoke all active sessions." Drop the shares and say "every session, not just unknown ones."
54. `burn_protocol-reclaim-after-hour` CHANGED (script): use 25 step 9's sentence word for word: "there has been a compromise on my side; assume our recent communications may have been observed; do not respond on the prior channel; here is what to do next per the runbook we agreed on." Confirm the exact wording in the .md.
55. Low-tier clean-up: add 25 Low's "brief notification of any contacts whose communication with you on that account may have been read."
56. `the_crew-fortify-state-tier`: 26 step 6 State storage is "encrypted-at-rest… per-session unlock… only on devices… confirmed to the… baseline… not synchronized to any cloud account." Add a step with all four.
57. Same mission: the alias step drops "does not connect to the person's real identity in any project communication". Add it.
58. `the_crew-reclaim-brinkmanship`: "Three or more is the slide" implies 0 to 2 is a pass. D10: "Any source, device, document, or admission of substance is a failure." Add it.
59. `the_crew-fortify-fallback`: drops 29's "do not message asking why", "If the abort signal is observed, do not proceed", and "there is no override; the contact does not call you to check." Add all three.
60. Same mission: setting T has no guidance. 29 warns against a window "so tight that ordinary delays produce false alarms" and against fallbacks that depend on "infrastructure that may also be down". Add both.
61. `the_crew-reclaim-hold-the-line`: the briefing is limited to employers and records demands but uses the warrant script, and it drops "If they detain you, switch to… Playbook 22." Widen the briefing and add the detention branch.
62. `the_crew-reclaim-long-game`: "Treat any 'just this once' request as the alarm". 28 step 3 says "Refuse 'just this once' exceptions." Fix: "Refuse it. The request itself is the alarm."
63. `the_crew-recon-weakest-link`: drops 26's "If the project's tier escalates mid-project… pause… Do not let the team continue at the old tier." Add it.
64. Same mission BAD SHARE: the teammate device check has no passcode rule and relies on `device_security-fortify-phone`. Add 03's tier lengths and drop the share.
65. `the_crew-fortify-raid-plan`: drops 26 step 11 (the organization's "legal posture regarding production of newsroom materials") and step 12 ("who is responsible for pre-publication legal review"). Add both.

## Flagged in the sources: needs the course author, NOT fixed here

- 16 says toggling airplane mode forces a passcode. As far as we know, only a restart or power-off does that.
- 13 cites RIPA section 49 as the offence. The offence is in section 53, and UK border demands usually go through Schedule 7 of the Terrorism Act 2000.
- Existing Reclaim City missions that conflict with the Field playbooks: `device_security-fortify-phone` (6-digit PIN) and the generated `*-fortify-2fa-backup` missions (codes "in your password manager").
