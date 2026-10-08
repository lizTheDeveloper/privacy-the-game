// Breaker round 5 for recon Phase 3: a content sweep of every mission in
// src/data/missions*.js (not only recon), checking what a player is told to do
// or believe against official pages. Sources checked 2026-10-07.
// Every test pins one specific string and fails while that string is present;
// the comment above each one cites the official source that contradicts it.
// Claims that could not be confirmed either way are NOT tested (see the report).
import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';

const mission = (id) => {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error(`no mission ${id}`);
  return m;
};
// Everything a player can read in a mission: briefing, steps, Scout lines, debrief options.
const everything = (id) => JSON.stringify(mission(id));

describe('round 5: legal and regulatory claims', () => {
  // Source: California Privacy Protection Agency, DROP page https://privacy.ca.gov/drop/ :
  // "To be eligible to submit a deletion request in DROP, you must be a California resident."
  // The mission tells every player it works outside California.
  it('people_search-reclaim-stragglers: DROP does not "work even if you are not in California"', () => {
    expect(everything('people_search-reclaim-stragglers')).not.toMatch(/works even if you're not in California/);
  });

  // Source: CPPA FAQ https://cppa.ca.gov/faq.html : the required link is labelled "Do Not Sell or
  // Share My Personal Information", "Your Privacy Choices" or "Your California Privacy Choices".
  // CCPA does not require one exact phrase, so a player searching for it can wrongly conclude
  // a company has no opt-out page.
  it('loyalty_programs-fortify-optout: CCPA does not require a page with "this exact language"', () => {
    expect(everything('loyalty_programs-fortify-optout')).not.toContain('CCPA requires a page with this exact language');
  });
});

describe('round 5: money and credit', () => {
  // Source: Afterpay US help (https://www.afterpay.com/en-US/help/4487846176793-Does-Afterpay-conduct-credit-checks):
  // "Afterpay does not currently report to credit bureaus in the United States".
  // Klarna: https://www.klarna.com/international/press/why-klarna-does-not-report-bnpl-payments-to-us-credit-bureaus/
  // (Pay in 4 is not reported). The briefing says all four report, "each reporting to different credit bureaus".
  it('payment_trail-fortify-bnpl: Klarna and Afterpay do not report to US credit bureaus', () => {
    expect(everything('payment_trail-fortify-bnpl')).not.toContain('Affirm, Klarna, Afterpay, and Zip report to credit bureaus');
  });

  // Source: CFPB list of consumer reporting companies
  // (https://files-prod.consumerfinance.gov/f/documents/cfpb_consumer-reporting-companies_list_2025.pdf):
  // Early Warning Services is a separate bank-account screening company (co-owned by Bank of America,
  // Capital One, JPMorgan Chase, PNC, Truist, U.S. Bank, Wells Fargo) and the CFPB lists no freeze for it.
  // So a ChexSystems freeze does not "block fraudulent bank account openings" at banks that use EWS,
  // and "banks check ChexSystems" is not what every bank does.
  it('credit_freeze-fortify-extras: a ChexSystems freeze does not block all fraudulent bank account openings', () => {
    const t = everything('credit_freeze-fortify-extras');
    expect(t).not.toContain('this blocks fraudulent bank account openings');
    expect(t).not.toContain('banks check ChexSystems, not the big three, for new account applications');
  });

  // Source: IRS, https://www.irs.gov/identity-theft-fraud-scams/retrieve-your-ip-pin :
  // "once you have opted in and obtained an IP PIN online, you will need to retrieve your IP PIN online
  // each calendar year as a CP01A Notice will not be mailed." This mission has the player opt in online,
  // then promises the new PIN "by mail". A player who waits for the mail files without a PIN and
  // the e-filed return is rejected (irs.gov get-an-identity-protection-pin).
  it('irs-fortify-ip-pin: an online opt-in never gets the annual PIN by mail', () => {
    expect(everything('irs-fortify-ip-pin')).not.toContain('by mail or through your IRS account');
  });

  // Source: eBay Inc. press release, 21 May 2014 "eBay Inc. To Ask eBay Users To Change Passwords"
  // (https://www.ebayinc.com/stories/news/ebay-inc-ask-ebay-users-change-passwords/): the compromised
  // database held "encrypted password[s]", and eBay reported no evidence of unauthorized activity.
  // "definitely compromised" overstates a breach of encrypted passwords.
  it('ebay-fortify-lockdown: an old password is not "definitely compromised" by an encrypted-password breach', () => {
    expect(everything('ebay-fortify-lockdown')).not.toContain('definitely compromised');
  });
});

describe('round 5: locks and protections that do less than claimed', () => {
  // Source: Venmo Help, "Login Security" https://help.venmo.com/cs/articles/login-security-vhel151 :
  // the feature is "Face ID & Passcode" / "Passcode & biometric unlock" under Settings > Preferences;
  // the passcode is asked "every time you open the app" and "you may also be asked to confirm your
  // Passcode when sending payments". Venmo has no "Security Lock" (that is Cash App's name), and
  // it does not guard every payment.
  it('venmo-fortify-password: Venmo has no "Security Lock" that guards every payment', () => {
    const steps = mission('venmo-fortify-password').steps.map((s) => s.text).join('\n');
    expect(steps).not.toContain('Security Lock');
    expect(steps).not.toContain('for every payment');
  });

  // Source: Ring support, "Getting started with Community Requests"
  // https://ring.com/support/articles/uds27/Community-request : the Control Center > Public Safety
  // opt-out only stops email notifications about Community Requests; the page has no
  // "Video Requests from Law Enforcement" setting. Request for Assistance was shut in 2024;
  // current service: Community Requests (blog.ring.com, 2025). The mission promises the toggle
  // "prevents police from requesting your footage" and an opt-out "entirely".
  it('smart_camera-fortify-police: the Ring toggle does not prevent police from requesting footage', () => {
    const t = everything('smart_camera-fortify-police');
    expect(t).not.toContain('Toggle OFF to prevent police from requesting your footage');
    expect(t).not.toContain('opt out of police video requests entirely');
  });

  // Source: WhatsApp Help Center, "About registration and two-step verification"
  // (https://faq.whatsapp.com/506595211487528) and "How to reset your two-step verification PIN"
  // (https://faq.whatsapp.com/2183055648554771): if you do not have the PIN, "wait 7 days"
  // (counted from the last time the account connected) and you can get in. So the PIN is not
  // required "any time" someone registers the number.
  it('whatsapp-fortify-reglock: the PIN is not required "any time" someone registers the number', () => {
    expect(everything('whatsapp-fortify-reglock')).not.toContain('required any time someone tries to register your number');
  });
});

describe('round 5: claims about what a step achieves', () => {
  // Source: 23andMe Customer Care, "Requesting 23andMe Account Closure"
  // https://customercare.23andme.com/hc/en-us/articles/212170688-Requesting-23andMe-Account-Closure :
  // 23andMe "and/or [its] contracted genotyping laboratory will retain your genetic information,
  // date of birth, and sex as required for compliance with ... CLIA ... California Business and
  // Professions Code Section 1265 and CAP", even after you delete the account.
  it('genetic-delete-23andme: submitting the request does not delete all genetic results from their servers', () => {
    expect(everything('genetic-delete-23andme')).not.toContain('this deletes your genetic results from their servers');
  });

  // Source: Adobe, Content analysis FAQ
  // https://helpx.adobe.com/account/individual/terms-policies-and-regulations/content-analysis-faq.html
  // and the Adobe Firefly FAQ: "Adobe does not analyze your content to train generative AI models"
  // (except Stock submissions) and "Adobe does not train Firefly Gen AI models on customer content."
  // Content analysis is for improving products. The briefing says it trains Firefly.
  it('ai_adobe-optout: Content Analysis does not train Firefly', () => {
    expect(everything('ai_adobe-optout')).not.toContain('analyze your creative work to train Firefly');
  });
});

describe('round 5: status and defaults', () => {
  // Source: X Engineering announcement, 12 June 2024: "Likes are now private for everyone" (reported by
  // AP, e.g. https://www.news4jax.com/business/2024/06/12/what-happened-to-the-likes-x-is-now-hiding-which-posts-you-like-from-other-users/ ).
  // Other people can no longer see your Likes tab. The mission tells players their likes are public.
  it('twitter-reclaim-review: likes are no longer public', () => {
    const t = everything('twitter-reclaim-review');
    expect(t).not.toContain('your likes are public too');
    expect(t).not.toContain('These are public on most accounts');
  });

  // Source: Amazon Customer Service, "Change Your Gift List Privacy Settings"
  // https://www.amazon.com/gp/help/customer/display.html?nodeId=GN4QEEU54LKE5976 :
  // "Your Gift List is set to Private during creation unless you choose a different privacy setting."
  it('osint-sieve-breadcrumbs: an Amazon list is private by default, not public', () => {
    expect(everything('osint-sieve-breadcrumbs')).not.toContain('Your Amazon wishlist is public by default');
  });

  // Source: Meta Help Center, "Export a copy of your Facebook information"
  // https://www.facebook.com/help/212802592074644 : Settings & privacy > Settings > Meta Account
  // (Accounts Center) > Your information and permissions > Export your information.
  // There is no "Settings > Your information > Download your information" path.
  it('facebook-reclaim-prep: the data-export path is Accounts Center > Your information and permissions', () => {
    expect(everything('facebook-reclaim-prep')).not.toContain('Settings > Your information > Download your information');
  });

  // Source: Instagram Help, "Review and export a copy of your Instagram information"
  // https://help.instagram.com/181231772500920 : Settings > Meta Account > Your information and
  // permissions > Export your information. There is no "Settings > Your activity > Download your information".
  it('instagram-reclaim-prep: the data-export path is Accounts Center > Your information and permissions', () => {
    expect(everything('instagram-reclaim-prep')).not.toContain('Settings > Your activity > Download your information');
  });
});

describe('round 5: broken player-facing text', () => {
  // Not a claim about the outside world: a code fragment leaked into the string
  // (a quote, "url:" and a URL pasted inside the text of one step). Self-evident from the source,
  // src/data/missions-perimeter.js line 255, so no external source applies.
  it('no step text contains a leaked url property', () => {
    const bad = [];
    for (const m of MISSIONS) {
      const groups = [m.steps || [], ...Object.values(m.stepsByManager || {}), ...Object.values(m.reportSteps || {})];
      for (const s of groups.flat()) if (/['"],\s*url:/.test(s.text || '')) bad.push(m.id);
    }
    expect(bad).toEqual([]);
  });
});
