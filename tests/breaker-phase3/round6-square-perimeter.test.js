// Breaker round 6 for recon Phase 3: a content fact-check of every non-legacy mission in
// The Square, The Archives, The Marketplace, The Capitol and The Perimeter, checking what a
// player is told to do or believe against official pages. Sources checked 2026-10-07.
// Every test pins one specific string and fails while that string is present; the comment above
// each one cites the source that contradicts it. Claims that could not be confirmed either way
// are NOT tested (they are listed in the report instead).
import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';

const mission = (id) => {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error(`no mission ${id}`);
  return m;
};
// Every string a player can read in a mission (briefing, steps, debrief labels and options,
// Scout lines), joined, so quotes and apostrophes need no JSON escaping.
const collect = (o, out = []) => {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((x) => collect(x, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((x) => collect(x, out));
  return out;
};
const everything = (id) => collect(mission(id)).join('\n');

describe('round 6: government accounts', () => {
  // Source: SSA, "Apply for Retirement Benefits" https://www.ssa.gov/benefits/retirement/apply.html :
  // benefits can be applied for online, by phone (1-800-772-1213) or at a Social Security office.
  // Creating a my Social Security account stops someone creating a second online account with your
  // SSN; it does not stop a claim made by phone or in person. The debrief tells the player they
  // "prevented someone else from filing for benefits".
  it('ssa-recon-claim: an account does not prevent anyone from filing for benefits', () => {
    expect(everything('ssa-recon-claim')).not.toContain('prevented someone else from filing for Social Security benefits');
  });

  // Source: IRS, "Your online account" https://www.irs.gov/payments/your-online-account lists what the
  // account shows: return information and transcripts, balances, payments, notices, refund status,
  // IP PIN. It lists no direct-deposit bank account. The step sends the player to look for one, and
  // the debrief then promises "Your tax refund will go to your bank, not theirs", which a look at the
  // account cannot establish or change (the refund account is whatever was on the filed return).
  it('irs-reclaim-verify: the online account does not show the refund bank, and a look cannot decide where the refund goes', () => {
    const t = everything('irs-reclaim-verify');
    expect(t).not.toContain('Check your bank account for direct deposit');
    expect(t).not.toContain('Your tax refund will go to your bank, not theirs');
  });

  // Source: IRS, "Get an Identity Protection PIN" https://www.irs.gov/identity-theft-fraud-scams/get-an-identity-protection-pin :
  // the IP PIN is "a six-digit number" that must be on your return. It is not a sign-in factor and
  // enabling it changes nothing about the IRS account's login. The debrief asks "Did you set up
  // two-factor authentication?" / "Yes, 2FA is now enabled", so a player files that their IRS login
  // has 2FA when it may not.
  it('irs-fortify-ip-pin: getting an IP PIN is not enabling two-factor authentication', () => {
    expect(everything('irs-fortify-ip-pin')).not.toContain('Did you set up two-factor authentication?');
  });
});

describe('round 6: social privacy settings', () => {
  // Source: LinkedIn Help, "Who can see your connections"
  // https://www.linkedin.com/help/linkedin/answer/a540663/who-can-see-your-connections :
  // "By default, your 1st-degree connections can see and browse your list of connections."
  // The default is not public and not "everyone".
  it('linkedin-reclaim-privacy: the connections list is not public by default (briefing)', () => {
    expect(everything('linkedin-reclaim-privacy')).not.toContain('LinkedIn defaults your connections list to public');
  });

  // Same source as above. The Scout line says the list is "visible to anyone with an account".
  it('linkedin-reclaim-privacy: the connections list is not shown to everyone by default (Scout)', () => {
    const t = everything('linkedin-reclaim-privacy');
    expect(t).not.toContain('LinkedIn shows your connections to everyone by default');
    expect(t).not.toContain('visible to anyone with an account');
  });
});

describe('round 6: 2FA and phishing', () => {
  // Source: CISA, "Implementing Phishing-Resistant MFA"
  // https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf :
  // "App-based authenticators are vulnerable to phishing attacks" and SMS MFA is vulnerable to phishing;
  // "the only widely available phishing-resistant authentication is FIDO/WebAuthn". The LinkedIn
  // mission steps the player through an authenticator app and then says 2FA blocks phishing.
  it('linkedin-fortify-lockdown: 2FA from an authenticator app does not block phishing (debrief)', () => {
    expect(everything('linkedin-fortify-lockdown')).not.toContain('LinkedIn phishing is extremely effective -- 2FA blocks it');
  });

  // Same CISA source. The briefing calls an authenticator app "the primary defense against the
  // spear-phishing that targets professional accounts"; a phished one-time code can be replayed.
  it('linkedin-fortify-lockdown: an authenticator app is not the primary defense against spear-phishing (briefing)', () => {
    expect(everything('linkedin-fortify-lockdown')).not.toContain('primary defense against the spear-phishing');
  });

  // Source: Gmail Help, "Someone is sending emails from a spoofed address"
  // https://support.google.com/mail/answer/50200 : the sender name and address on a message can be
  // forged. The domain after the @ is therefore not "the one detail" that separates a real alert from
  // phishing; a spoofed or lookalike-but-passing message defeats the check, which is why Gmail adds its
  // own authentication warning.
  it('scam_defense-recon-phishing-eye: the domain after the @ is not the one detail that separates real from phishing', () => {
    expect(everything('scam_defense-recon-phishing-eye')).not.toContain('is one detail: the domain after the @');
  });

  // Source: CISA phishing-resistant MFA fact sheet (URL above) uses "phishing-resistant" for FIDO/WebAuthn
  // and PKI methods only. Checking sender domains by eye is a habit that fails against spoofed or
  // compromised senders; "phishing-resistant for life" is an overclaim.
  it('scam_defense-recon-phishing-eye: checking the domain does not make you "phishing-resistant for life"', () => {
    expect(everything('scam_defense-recon-phishing-eye')).not.toContain('phishing-resistant for life');
  });
});

describe('round 6: SIM and recovery claims', () => {
  // Source: FBI IC3 2021 Internet Crime Report https://www.ic3.gov/AnnualReport/Reports/2021_IC3Report.pdf :
  // 1,611 SIM-swap complaints against 323,972 phishing/vishing/smishing/pharming complaints (phishing
  // is the largest crime type by complaints). SIM swapping is not "the most common way high-value
  // accounts get stolen"; the Perimeter's own phishing mission calls phishing the #1 way.
  it('sim_protection-fortify-pin: SIM swapping is not the most common way accounts get stolen', () => {
    expect(everything('sim_protection-fortify-pin')).not.toContain('the most common way high-value accounts get stolen');
  });

  // Source: FTC, "SIM Swap Scams: How to Protect Yourself"
  // https://consumer.ftc.gov/consumer-alerts/2019/10/sim-swap-scams-how-protect-yourself :
  // scammers "use the 'forgot password' function ... after receiving the password reset codes via
  // text message". Any account that still lists the number for recovery or SMS codes stays exposed,
  // so a swap gives the attacker more than "spam calls".
  it('sim_protection-reclaim-remove-sms: a SIM swap still gives the attacker SMS recovery for accounts that keep the number', () => {
    expect(everything('sim_protection-reclaim-remove-sms')).not.toContain('nothing but the ability to receive your spam calls');
  });
});

describe('round 6: names of settings and features', () => {
  // Source: Android Authority, "Android Settings gets the Find Hub rebrand"
  // https://www.androidauthority.com/android-settings-find-hub-rebrand-3564677 : with Google Play
  // services 25.20.37, "Find My Device" was replaced by "Find Hub" across the Settings app (Google
  // announced the rename at the Android Show, May 2025). The same mission's last step already says Find Hub.
  it('device_security-fortify-phone: Android Settings no longer has a "Find My Device" toggle (it is Find Hub)', () => {
    expect(everything('device_security-fortify-phone')).not.toContain('Android → Settings → Security → Find My Device');
  });

  // Source: Telegram FAQ https://telegram.org/faq#q-how-does-two-step-verification-work : Two-Step
  // Verification is an additional password (with an optional recovery email), not a PIN. "Registration
  // lock PIN" is Signal's feature (and WhatsApp's two-step PIN); the debrief asks Telegram players
  // "Did you set a registration lock PIN?" and offers "Yes, PIN is set".
  it('telegram-fortify-twostep: Telegram two-step verification is a password, not a registration lock PIN', () => {
    expect(everything('telegram-fortify-twostep')).not.toContain('registration lock PIN');
  });
});

describe('round 6: service and breach facts', () => {
  // Source: Reddit's own announcement, "We had a security incident", r/announcements, 2018-08-01
  // https://www.reddit.com/r/announcements/comments/93qnm5/ : the data taken was a backup of the
  // database from 2007 (accounts and salted, hashed passwords up to May 2007) plus June 2018 email digests.
  // A password set between 2008 and 2017 was not in it, so "if this password is from before 2018, it
  // was in the breach" tells most Reddit players their password leaked when it did not.
  it('reddit-fortify-lockdown: a password from before 2018 was not in the 2018 breach', () => {
    expect(everything('reddit-fortify-lockdown')).not.toContain('If this password is from before 2018, it was in the breach');
  });

  // Source: GitHub Docs, "About secret scanning"
  // https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning :
  // secret scanning alerts are free for public repositories only; private repositories need GitHub
  // Secret Protection on a Team/Enterprise plan. A player with private repos on a free account has no
  // "Secret scanning alerts" page, and then files "No exposed secrets detected. Clean repos."
  it('github-reclaim-secrets: no alerts do not mean "Clean repos" (private repos are not scanned on free plans)', () => {
    expect(everything('github-reclaim-secrets')).not.toContain('No exposed secrets detected. Clean repos.');
  });

  // Source: Signal, "Big Brother" subpoena responses https://signal.org/bigbrother/ : the information
  // Signal can produce is "the date and time a user registered with Signal and the last date of a
  // user's connectivity". That is metadata, so "no metadata" is not literally true.
  it('signal-recon-devices: Signal does store some metadata (registration date, last connection)', () => {
    expect(everything('signal-recon-devices')).not.toContain('no contacts, no metadata');
  });

  // Source: Apple Support, "Control the location information you share on iPhone"
  // https://support.apple.com/guide/iphone/control-the-location-information-you-share-iph3dd5f9be/ios :
  // "Always" is the background-access option; many apps need it for what they do (the mission's own
  // step exempts maps and ride-share apps). "Every 'Always' location permission is an app selling your
  // daily commute" is false as a universal claim.
  it('device_security-reclaim-app-permissions: not every "Always" location permission is an app selling your movements', () => {
    expect(everything('device_security-reclaim-app-permissions')).not.toContain("Every 'Always' location permission is an app selling");
  });

  // Same source: an app that stops working without constant location access (navigation, ride
  // hailing, Find My, fitness, severe-weather alerts) is not therefore "monetizing it".
  it('device_security-reclaim-app-permissions: apps that break without background location are not all monetizing it', () => {
    expect(everything('device_security-reclaim-app-permissions')).not.toContain('are the ones that were monetizing it');
  });
});

describe('round 6: broken player-facing text', () => {
  // Not a claim about the outside world: a debrief option object ({ value: 'later', text: "I'll come
  // back to this", severity: 'skip' }) was pasted into the steps of two missions, so the player sees
  // "I'll come back to this" as a numbered step in the middle of the instructions (the same defect
  // round 5 fixed in the WhatsApp mission). Self-evident from src/data/missions-square-archives-marketplace.js,
  // signal-fortify-reglock (step 3) and telegram-fortify-twostep (step 2).
  for (const id of ['signal-fortify-reglock', 'telegram-fortify-twostep']) {
    it(`${id}: no debrief option is pasted into the steps`, () => {
      const bad = (mission(id).steps || []).filter((s) => 'severity' in s || 'value' in s || /come back to this/i.test(s.text || ''));
      expect(bad).toEqual([]);
    });
  }
});
