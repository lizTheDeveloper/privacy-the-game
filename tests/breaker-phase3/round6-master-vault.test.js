// Breaker round 6 (Master Keys + Vault): content fact-check of every non-legacy
// mission in those two districts against official pages, checked 2026-10-07.
// Each test pins one string that is false or overclaims; the comment above it
// cites the contradicting source. Unconfirmable claims are not tested.
import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';

const everything = (id) => {
  const m = MISSIONS.find((x) => x.id === id && !x.legacy);
  if (!m) throw new Error(`no mission ${id}`);
  return JSON.stringify(m);
};

describe('round 6: Vault, false reassurance', () => {
  // Source: FBI IC3 PSA on SIM swapping https://www.ic3.gov/PSA/2022/PSA220208 : after a SIM swap
  // the criminal receives the victim's SMS one-time codes and uses them to log in. With SMS 2FA a
  // SIM swapper does NOT need the victim's phone; the line tells a player SMS 2FA stops them.
  it('primary_bank-fortify-2fa: "a SIM swapper now needs your phone AND your password" is false for SMS 2FA', () => {
    expect(everything('primary_bank-fortify-2fa')).not.toContain('Even a SIM swapper now needs your phone AND your password');
  });

  // Source: no bank, regulator (FDIC/CFPB/FTC) or study publishes this figure; it is an invented
  // statistic shown to the player as fact.
  it('primary_bank-fortify-2fa: invented "Ahead of 80% of bank customers"', () => {
    expect(everything('primary_bank-fortify-2fa')).not.toContain('80% of bank customers');
  });

  // Source: FBI IC3 PSA220208 (above) describes SIM swaps used to take over bank accounts, steal virtual
  // currency and reach personal data alike. It is not specific to, or caused by, crypto.
  it('crypto_exchange-fortify-lockdown: SIM swapping does not exist "because of crypto"', () => {
    expect(everything('crypto_exchange-fortify-lockdown')).not.toContain('SIM swapping exists because of crypto');
  });
  it('crypto_exchange-fortify-lockdown: SIM swapping does not "specifically target crypto holders"', () => {
    expect(everything('crypto_exchange-fortify-lockdown')).not.toContain('specifically targets crypto holders');
  });
});

describe('round 6: Vault, menu paths and what a setting does', () => {
  // Source: Cash App help, "Set Up Cash App Security Lock" https://cash.app/help/us/en-us/3120-enable-security-lock :
  // "Select your profile icon, select Security, select Security Lock". There is no "Security & Privacy" item on that path.
  it('cashapp-fortify-password: the path is profile icon -> Security, not "Security & Privacy"', () => {
    expect(everything('cashapp-fortify-password')).not.toContain('Security & Privacy');
  });

  // Source: same Cash App page: you "choose what you want to protect (Opening Cash App or Sending payments)",
  // so Security Lock need not cover "every payment", and the lock is a security code (PIN) with optional biometrics.
  it('cashapp-fortify-password: Security Lock is not "for every payment" by default', () => {
    expect(everything('cashapp-fortify-password')).not.toContain('for every payment');
  });
  it('cashapp-fortify-password: debrief does not promise every payment needs your face or fingerprint', () => {
    expect(everything('cashapp-fortify-password')).not.toContain('Every Cash App payment now requires your face or your fingerprint');
  });

  // Source: Venmo help, "Manage your Venmo privacy settings" https://help.venmo.com/cs/articles/who-can-see-my-venmo-payments-vhel351 :
  // "Dollar amounts are hidden in the feed"; public payments show the note, names and timestamp only.
  it('venmo-reclaim-privacy: public payments do not show "the amount"', () => {
    expect(everything('venmo-reclaim-privacy')).not.toContain('the amount, the recipient, the memo');
  });
});

describe('round 6: Master Keys, outdated products', () => {
  // Source: Microsoft Support, "End of support for Cortana" (Cortana in Windows ended late 2023;
  // search: support.microsoft.com "end of support for Cortana"). Windows no longer has Cortana, so Microsoft is not collecting "Cortana interactions" from Windows.
  it('microsoft-reclaim-privacy: briefing no longer lists Cortana interactions', () => {
    expect(everything('microsoft-reclaim-privacy')).not.toContain('Cortana interactions');
  });

  // Source: Meta, "Better Personalization and Changes to Controls for Your Activity From Other Businesses"
  // https://about.fb.com/news/2026/06/better-personalization-and-changes-to-controls-for-your-activity-from-other-businesses/ :
  // "Your activity off Meta technologies" (Off-Facebook Activity) is discontinued in July 2026 and replaced by
  // "Activity from other businesses", which controls personalization, not whether Meta receives the data.
  // Today (2026-10-07) the step sends players to a setting that no longer exists.
  it('facebook-reclaim-privacy: no step to "turn off future Off-Facebook Activity"', () => {
    expect(everything('facebook-reclaim-privacy')).not.toContain('turn off future Off-Facebook Activity');
  });
  it('facebook-reclaim-privacy: no step pointing to "Your activity off Meta technologies"', () => {
    expect(everything('facebook-reclaim-privacy')).not.toContain('Your activity off Meta technologies');
  });
  it('facebook-reclaim-privacy: Scout does not claim you "shut off" a data pipeline', () => {
    // Same source: Meta says businesses may still send it activity regardless of the choice.
    expect(everything('facebook-reclaim-privacy')).not.toContain('massive data pipeline you just shut off');
  });
});
