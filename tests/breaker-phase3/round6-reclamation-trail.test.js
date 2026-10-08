// Breaker round 6 for recon Phase 3: content fact-check of the reclamation, freeway,
// foundry, grid, clinic and trail districts (every non-legacy mission). Sources checked
// 2026-10-07. Every test pins one specific string and fails while that string is present;
// the comment above each cites the official source that contradicts it.
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

describe('round 6: menu paths', () => {
  // Source: Apple Support, "Settings > Privacy & Security > Location Services"
  // (https://support.apple.com/guide/personal-safety/ips9bf20ad2f). The iPhone section is
  // "Privacy & Security", not "Privacy"; a player following "Settings > Privacy" will not find it.
  it('location_brokers-recon-understand: iPhone path is Privacy & Security > Location Services', () => {
    expect(everything('location_brokers-recon-understand')).not.toContain('Settings → Privacy → Location Services');
  });

  it('location_brokers-fortify-phone: iPhone path is Privacy & Security > Location Services', () => {
    expect(everything('location_brokers-fortify-phone')).not.toContain('Settings → Privacy → Location Services');
  });

  // Source: Apple Support, "Settings > Privacy & Security > Tracking"
  // (https://support.apple.com/en-us/102420). Same section rename; the sibling mission
  // ad_trackers-recon-understand already uses the right path.
  it('ad_trackers-fortify-bulk: iOS ad-tracking path is Privacy & Security > Tracking', () => {
    expect(everything('ad_trackers-fortify-bulk')).not.toContain('Settings → Privacy → Tracking');
  });

  // Source: Google Nest Help, "Turn on Guest Mode" https://support.google.com/googlenest/answer/10217706 :
  // "say 'Hey Google, turn on Guest Mode'". It is a voice command; the help page names no
  // Google Home app Settings > Privacy toggle for it.
  it('voice_assistant-fortify-sensitivity: Guest Mode is not a Google Home app Settings > Privacy toggle', () => {
    expect(everything('voice_assistant-fortify-sensitivity')).not.toContain('Google Home app > Settings > Privacy > Guest Mode');
  });
});

describe('round 6: what a step needs or achieves', () => {
  // Source: IRS, "How to register for IRS online self-help tools"
  // https://www.irs.gov/privacy-disclosure/how-to-register-for-irs-online-self-help-tools :
  // identity is verified (ID.me) with an SSN or ITIN and a government photo ID, not with
  // last year's tax return. A player who goes looking for return details is stopped by the wrong prompt.
  it("govt_id_defense-fortify-irs-pin: verifying for the IP PIN tool does not need last year's tax return info", () => {
    expect(everything('govt_id_defense-fortify-irs-pin')).not.toContain("last year's tax return info");
  });

  // Source: Google Nest Help (above) and Apple "Siri, Dictation & Privacy"
  // https://www.apple.com/legal/privacy/data/en/ask-siri-dictation :
  // "Apple doesn't store audio of your Siri requests unless you opt in to Improve Siri & Dictation".
  // The briefing says every Siri recording is stored.
  it('voice_assistant-recon-recordings: Siri audio is not stored by default', () => {
    expect(everything('voice_assistant-recon-recordings')).not.toMatch(/Siri, the recording is sent to a server, transcribed, and stored/);
  });

  // Source: Plaid, statement on the $58M settlement (reported by CyberScoop,
  // https://cyberscoop.com/plaid-settlement-58-million-privacy-suit/): "We do not, nor have we ever,
  // sold data", and the settlement made no finding of wrongdoing. The first Scout sentence says
  // "claims"; the next sentences then state the allegation as fact.
  it('payment_trail-recon-plaid: an unproven allegation is not stated as fact in Scout\'s briefing', () => {
    expect(mission('payment_trail-recon-plaid').scoutDialog.briefing).not.toContain('downloaded your full transaction history');
  });

  it('payment_trail-recon-plaid: "each one has your full bank transaction history" is the same unproven allegation', () => {
    expect(everything('payment_trail-recon-plaid')).not.toContain('Each one has your full bank transaction history');
  });

  // Source: CNBC, "Budgeting app Mint is shutting down" https://www.cnbc.com/2023/11/07/budgeting-app-mint-is-shutting-down-users-are-disappointed.html :
  // Mint closed in early 2024 (Intuit moved users to Credit Karma). The briefing lists it as an app
  // the player "probably used Plaid" with. Nothing there ties Mint to Plaid, and nobody can connect to Mint now.
  it('payment_trail-recon-plaid: Mint no longer exists, so it is not an app to look for in the Plaid Portal', () => {
    expect(mission('payment_trail-recon-plaid').briefing).not.toMatch(/\bMint\b/);
  });

  // Source: de Montjoye et al., "Unique in the shopping mall", Science 347 (2015)
  // https://www.science.org/doi/10.1126/science.1256297 : four spatiotemporal points identify
  // 90% of individuals in a dataset of 1.1 million people, not every person.
  it('payment_trail-reclaim-card-sharing: four purchases do not uniquely identify "a person" every time', () => {
    expect(mission('payment_trail-reclaim-card-sharing').scoutDialog.briefing).not.toContain('are enough to uniquely identify a person');
  });

  // Source: HealthCare.gov, "How health insurance companies set health plan premiums"
  // https://www.healthcare.gov/how-plans-set-your-premiums/ : insurers "can't take your current
  // health or medical history into account"; only age, location, tobacco use, family size and plan
  // category. A grocery history cannot be "sold to your health insurer to adjust your premiums".
  it('loyalty_programs-recon-audit: grocery purchases are not sold to health insurers to adjust premiums', () => {
    expect(mission('loyalty_programs-recon-audit').scoutDialog.briefing).not.toContain('to adjust your premiums');
  });
});

describe('round 6: legal, status and number claims', () => {
  // Source: Business Wire, 24 Oct 2024, "Californians Can File Claims ... $27.5 Million Class Action
  // Settlement Against Thomson Reuters" https://www.businesswire.com/news/home/20241024350787/en :
  // preliminary approval was 11 Oct 2024 and final approval 21 Feb 2025. There was no 2023 settlement.
  it('enterprise_data-fortify-thomson: the $27.5 million CLEAR settlement was not in 2023', () => {
    expect(mission('enterprise_data-fortify-thomson').briefing).not.toContain('$27.5 million in 2023');
  });

  // Source: FTC Consumer Sentinel Network Data Book 2024
  // https://www.ftc.gov/system/files/ftc_gov/pdf/csn-annual-data-book-2024.pdf : credit card fraud is the
  // top identity theft type (449,032 reports); employment or tax-related fraud is about 87,000.
  it('govt_id_defense-fortify-irs-pin: fraudulent tax returns are not the most common use of a stolen SSN', () => {
    expect(mission('govt_id_defense-fortify-irs-pin').scoutDialog.briefing).not.toContain('The most common use of a stolen Social Security number is fraudulent tax returns');
  });

  it('govt_id_defense-fortify-irs-pin: the skip line repeats the same "most common SSN exploit" claim', () => {
    expect(everything('govt_id_defense-fortify-irs-pin')).not.toContain('Fraudulent returns are the most common SSN exploit');
  });

  // Source: IAPP US State Privacy Legislation Tracker https://iapp.org/resources/article/us-state-privacy-legislation-tracker/ :
  // about 20 states have comprehensive privacy laws, each with thresholds. Not every broker, or every
  // player's state, is covered by an opt-out right.
  it('people_search-recon-find-yourself: not every broker is legally required to process an opt-out', () => {
    expect(everything('people_search-recon-find-yourself')).not.toContain('every broker is legally required to process your opt-out');
  });

  // The mission's own steps and Scout line list three brokers (Spokeo, Whitepages, BeenVerified);
  // the briefing says "five", and the next mission's "Six brokers down total" counts three plus three.
  it('people_search-fortify-web-forms: the briefing says five brokers but the mission lists three', () => {
    expect(mission('people_search-fortify-web-forms').briefing).not.toContain('These five brokers');
  });

  // Source: SafeRent Solutions, "About us" https://saferentsolutions.com/about-us/ : tenant screening
  // (formerly CoreLogic SafeRent) was spun off and is independent. Other bureaus also screen tenants,
  // so CoreLogic is not behind "every" landlord check.
  it('enterprise_data-fortify-property: CoreLogic is not behind every landlord background check (briefing)', () => {
    expect(mission('enterprise_data-fortify-property').briefing).not.toContain('behind every landlord background check');
  });

  it('enterprise_data-fortify-property: "Every landlord background check flows through them" (Scout)', () => {
    expect(mission('enterprise_data-fortify-property').scoutDialog.briefing).not.toContain('Every landlord background check flows through them');
  });

  // Source: FTC, Health Breach Notification Rule https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule :
  // it covers health apps that are outside HIPAA, and GoodRx (the case this very briefing cites) was the
  // FTC's first enforcement of it. "Regulatory vacuum" contradicts the next sentence's own fine.
  it('telehealth-prescription-data: apps outside HIPAA are not in a "regulatory vacuum"', () => {
    expect(mission('telehealth-prescription-data').briefing).not.toContain('regulatory vacuum');
  });

  // Source: Period-tracker reporting finds no known prosecution that used a period app's data:
  // https://lailluminator.com/2024/07/27/period-tracking/ (cases so far used texts, search history and
  // Facebook chats). Scout says it already happened.
  it('health-apps-period-tracker-audit: period tracker data has not "become evidence"', () => {
    expect(mission('health-apps-period-tracker-audit').scoutDialog.briefing).not.toContain('period tracker data became evidence');
  });

  it('health-apps-period-tracker-audit: "it is happening now" is not documented for period apps', () => {
    expect(mission('health-apps-period-tracker-audit').scoutDialog.briefing).not.toContain('it is happening now');
  });
});
