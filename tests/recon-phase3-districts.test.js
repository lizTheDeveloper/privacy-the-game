// Recon campaign, phase 3: every remaining non-OK row in the audit's mission
// table, district by district. Copy tests pin the corrected facts; the steps
// and answers match what each service really shows.
import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../src/data/missions.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { debriefRecord, missionEventData, visibleQuestions } from '../src/utils/debrief.js';

const byId = (id) => MISSIONS.find((m) => m.id === id);
const text = (m) => JSON.stringify(m);
const stepText = (m) => m.steps.map((s) => s.text).join(' | ');
const stepUrls = (m) => m.steps.map((s) => s.url).filter(Boolean);
const values = (m, qid) => m.debriefQs.find((q) => q.id === qid).options.map((o) => o.value);
const SENT_KEYS = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method', 'same_address']);

// A new debrief question: every option files, and nothing new is tracked.
function filesCleanly(m, qid) {
  const q = m.debriefQs.find((x) => x.id === qid);
  for (const o of q.options) {
    const answers = {};
    for (const vq of visibleQuestions(m, { [qid]: o.value })) answers[vq.id] = vq.id === qid ? o.value : vq.options[0].value;
    const r = debriefRecord(m, answers);
    expect(r, `${m.id} ${o.value}`).toBeTruthy();
    expect(r.record[qid]).toBe(o.value);
    expect(r.status).toBe(o.severity === 'skip' || o.value === 'skip' ? 'skipped' : 'completed');
    for (const k of Object.keys(missionEventData(m, r.record))) expect(SENT_KEYS.has(k), k).toBe(true);
  }
}

describe('The Master Keys', () => {
  it.each(['icloud-recon-login', 'apple_id-recon-login'])('%s is a device check on account.apple.com', (id) => {
    const m = byId(id);
    expect(m.title).toMatch(/^Device Check: /);
    expect(stepUrls(m)).toEqual(['https://account.apple.com']);
    expect(stepText(m)).toContain('Devices');
    expect(stepText(m)).toContain('Remove from account');
    expect(m.briefing).toMatch(/not a sign-in history/);
    expect(text(m)).not.toContain('icloud.com/settings');
    const finding = m.debriefQs.find((q) => q.id === 'finding');
    expect(finding.options.map((o) => [o.value, o.text])).toEqual([
      ['no-breaches', 'All my devices'],
      ['1-2-breaches', 'A device I don’t recognize'],
      ['3plus-breaches', 'A device I know isn’t mine'],
      ['skip', 'Couldn’t check right now'],
    ]);
  });

  it('Yahoo: HIBP has only the 2012 Yahoo Voices breach, not the 2013–2014 ones', () => {
    const m = byId('yahoo-recon-breach');
    expect(stepText(m)).not.toMatch(/likely listed/);
    expect(stepText(m)).toContain('doesn’t include Yahoo’s 2013–2014 breaches');
    expect(m.scoutDialog.briefing).toContain('aren’t even in Have I Been Pwned’s list');
    expect(m.scoutDialog.debrief['no-breaches']).toContain('Yahoo’s 2013 breach isn’t in there');
    expect(m.briefing).not.toMatch(/If you’ve ever had a Yahoo account/);
  });

  it('ProtonMail: session management first, security logs are off by default', () => {
    const m = byId('protonmail-recon-login');
    expect(stepUrls(m)).toEqual(['https://account.proton.me']);
    expect(stepText(m)).toContain('Session management');
    expect(stepText(m)).toContain('Revoke');
    expect(stepText(m)).toMatch(/if logging is off, turn it on/i);
  });

  it('Google login checks use Google’s current labels and the linked-apps page', () => {
    const g = byId('google-recon-login');
    expect(stepText(g)).toContain('Manage all devices');
    expect(stepText(g)).toContain('Recent security events');
    expect(stepUrls(g)).toContain('https://myaccount.google.com/linkedapps');
    expect(stepText(g)).not.toContain('Third-party apps with account access');
    expect(stepText(byId('gmail-recon-login'))).toContain('Recent security events');
  });

  it('Facebook login check goes through Accounts Center', () => {
    const m = byId('facebook-recon-login');
    expect(stepUrls(m)).toEqual(['https://accountscenter.facebook.com/password_and_security']);
    expect(stepText(m)).toContain('Where you’re logged in');
    expect(text(m)).not.toContain('settings?tab=security');
  });

  it('old Facebook breach check (legacy, reachable from old saves) no longer promises a common hit', () => {
    const m = byId('facebook-recon-breach');
    expect(text(m)).not.toMatch(/common hit|533 million/);
  });
});

describe('The Square', () => {
  it('X connected apps: its own apps_audit answers, not login answers', () => {
    const m = byId('twitter-recon-apps');
    expect(m.debriefQs.map((q) => q.id)).toEqual(['apps_audit']);
    expect(values(m, 'apps_audit')).toEqual(['apps-clean', 'apps-revoked', 'apps-unknown', 'skip']);
    expect(stepText(m)).toContain('Security and account access → Apps and sessions');
    filesCleanly(m, 'apps_audit');
    // An old save's login-style answer still shows.
    expect(m.debriefQs[0].legacy.id).toBe('finding');
  });

  it('TikTok device check has no Have I Been Pwned step and uses device answers', () => {
    const m = byId('tiktok-recon-devices');
    expect(text(m)).not.toMatch(/haveibeenpwned/i);
    expect(stepText(m)).toContain('Security & permissions');
    expect(stepText(m)).toContain('Manage devices');
    expect(m.debriefQs[0].options.map((o) => o.text).slice(0, 3)).toEqual(['All my devices', 'A device I don’t recognize', 'Several I don’t recognize']);
  });

  it('LinkedIn names where permitted services live', () => {
    expect(stepText(byId('linkedin-recon-login'))).toContain('Data privacy → Other applications');
  });

  it('WhatsApp and Signal give both phone paths', () => {
    const w = stepText(byId('whatsapp-recon-devices'));
    expect(w).toContain('iPhone');
    expect(w).toContain('Android');
    const s = stepText(byId('signal-recon-devices'));
    expect(s).toContain('iPhone');
    expect(s).toContain('Android');
  });

  it('Discord token audit makes no unconfirmed claims', () => {
    const m = byId('discord-recon-tokens');
    expect(stepText(m)).toContain('Authorized Apps');
    expect(stepText(m)).toMatch(/If you see Devices/);
    expect(text(m)).not.toMatch(/invalidates|kills all stolen tokens|kills the token/);
    expect(m.debriefQs[0].options.map((o) => o.text).slice(0, 3)).toEqual(['Nothing suspicious', 'Found an app or session I don’t recognize', 'Confirmed someone else was in']);
  });

  it('old Instagram and Uber checks (legacy) drop facts that aren’t true', () => {
    expect(text(byId('instagram-recon-breach'))).not.toContain('Chtrbox');
    expect(text(byId('uber-recon-breach'))).not.toMatch(/Also check the phone number/);
  });

  it('the X privacy review dates the scrape correctly', () => {
    expect(text(byId('twitter-reclaim-privacy'))).not.toContain('2023 scrape');
  });
});

describe('The Archives', () => {
  it('Google Drive: the real People filter, and its own shares_audit answers', () => {
    const m = byId('gdrive-recon-shares');
    expect(stepText(m)).toContain('Anyone with the link');
    expect(stepText(m)).toContain('sharedwith:public');
    expect(stepText(m)).toContain('Restricted');
    expect(stepText(m)).not.toContain('type:document');
    expect(m.debriefQs.map((q) => q.id)).toEqual(['shares_audit']);
    expect(values(m, 'shares_audit')).toEqual(['shares-none', 'shares-restricted', 'shares-many', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('finding');
    filesCleanly(m, 'shares_audit');
  });

  it('GitHub: the log shows keys and tokens added, not each clone', () => {
    const m = byId('github-recon-security');
    expect(stepUrls(m)).toEqual([
      'https://github.com/settings/security-log', 'https://github.com/settings/sessions',
      'https://github.com/settings/keys', 'https://github.com/settings/tokens',
    ]);
    expect(text(m)).not.toMatch(/silently cloned|SSH key usage|may have cloned/);
    expect(m.briefing).toContain('added a key or token');
  });

  it('no Scout line in the district ends with a stray backtick', () => {
    for (const id of ['gdrive-recon-shares', 'github-recon-security']) {
      for (const line of Object.values(byId(id).scoutDialog.debrief)) expect(line, id).not.toMatch(/`$/);
      expect(byId(id).scoutDialog.briefing).not.toMatch(/'Anyone with the link"/);
    }
  });
});

describe('The Capitol', () => {
  it('IRS: no unsourced figure, no promise that an account blocks fraud', () => {
    const m = byId('irs-recon-claim');
    expect(text(m)).not.toMatch(/5\.7 billion|prevents someone else/);
    expect(text(byId('irs-fortify-ip-pin'))).not.toMatch(/5\.7 billion/);
    expect(stepUrls(m)).toEqual(['https://www.irs.gov/payments/online-account-for-individuals']);
    expect(stepText(m)).toContain('photo ID');
    expect(stepText(m)).toMatch(/transcripts/);
  });

  it('DMV: alerts are the protection, not claiming the account', () => {
    const m = byId('state_dmv-recon-claim');
    expect(text(m)).not.toMatch(/so no one can create one/);
    expect(m.briefing).toContain('alerts');
    expect(m.scoutDialog.debrief.claimed).not.toMatch(/One fewer way/);
  });

  it('StudentAid: an FSA ID, not Login.gov, and My Aid is linked', () => {
    const m = byId('student_loans-recon-claim');
    expect(text(m)).not.toContain('Login.gov');
    expect(stepUrls(m)).toEqual(['https://studentaid.gov/fsa-id/create-account/launch', 'https://studentaid.gov/my-aid/']);
    expect(m.briefing).not.toContain('borrowers"');
    expect(m.scoutDialog.debrief.claimed).not.toMatch(/No one can apply/);
  });
});

describe('The Reclamation', () => {
  it('data supply chain: request the two reports, read CLEAR’s page; answers record requests', () => {
    const m = byId('enterprise_data-recon-supply-chain');
    expect(stepUrls(m)).toEqual([
      'https://consumer.risk.lexisnexis.com/request',
      'https://employees.theworknumber.com/employment-data-report',
      'https://legal.thomsonreuters.com/en/legal-notices/privacy-records',
    ]);
    expect(text(m)).not.toMatch(/every pay period|reports every paycheck/);
    expect(m.debriefQs.map((q) => q.id)).toEqual(['report_requests']);
    expect(values(m, 'report_requests')).toEqual(['requested-both', 'requested-one', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('broker_recon');
    filesCleanly(m, 'report_requests');
  });

  it('ad trackers: live ad-profile pages and answers about ad profiles', () => {
    const m = byId('ad_trackers-recon-understand');
    expect(stepUrls(m)).toEqual(['https://myadcenter.google.com/home', 'https://accountscenter.facebook.com/ad_preferences']);
    expect(stepText(m)).toContain('Settings → Privacy & Security → Tracking');
    expect(values(m, 'ad_profile')).toEqual(['few-signals', 'some-signals', 'lots-signals', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('broker_recon');
    filesCleanly(m, 'ad_profile');
  });
});

describe('old saves on replaced questions', () => {
  it('a pre-4.7.1 broken broker_recon answer on the supply-chain brief still repairs, shows and restores', async () => {
    const { migrateBrokenAnswers } = await import('../src/utils/migrate-answers.js');
    const { restoreEvents } = await import('../src/utils/restore.js');
    const { renderDebrief } = await import('../src/screens/debrief.js');
    const { createInitialState } = await import('../src/state.js');
    const s = { ...createInitialState(), missions: { 'enterprise_data-recon-supply-chain': { status: 'completed', broker_recon: "found-all', text: 'I'm listed on all of them', severity: 'crit" } } };
    const fixed = migrateBrokenAnswers(s);
    expect(fixed.missions['enterprise_data-recon-supply-chain'].broker_recon).toBe('found-all');
    expect(renderDebrief(fixed, 'enterprise_data-recon-supply-chain')).toContain('I\'m listed on all of them');
    expect(restoreEvents(fixed).some((e) => e.data.mission === 'enterprise_data-recon-supply-chain' && e.data.status === 'completed')).toBe(true);
  });
});

describe('The Freeway', () => {
  const MAKES = {
    car_gm: ['GM', 'https://www.gm.com/consumer-privacy'],
    car_toyota: ['Toyota', 'https://privacy.toyota.com/'],
    car_honda: ['Honda', 'https://privacyportal.onetrust.com/webform/50eb4a6d-ca54-42d6-9746-67aa2da0e52f/6ec559a6-cf6f-48b2-b98e-543b3bcd65a6'],
    car_ford: ['Ford', 'https://privacyportal.onetrust.com/webform/1d20b685-0942-4b4d-a0af-b799c97f5cf6/2e4928b6-d77a-4f76-9518-1bfb9721669d'],
    car_hyundai: ['Hyundai', 'https://owners.hyundaiusa.com/us/en/privacy/data-request/new-request'],
    car_kia: ['Kia', 'https://customercare.kiausa.com'],
    car_nissan: ['Nissan', 'https://privacyportal.onetrust.com/webform/00db3d80-61f2-406b-9665-493b342a269d/57adada6-a5f9-4204-85a3-5e5162bca5c8'],
    car_subaru: ['Subaru', 'https://privacyportal.onetrust.com/webform/1d87978c-8b58-46ba-83c1-acbc9aa41e6a/fb603d38-a944-4a5c-90e0-3b0aabb3052a'],
    car_tesla: ['Tesla', 'https://www.tesla.com/contactus?issue=dataPrivacyRequest'],
    car_bmw: ['BMW', 'https://my.bmwusa.com/dataprivacy?type=access'],
    car_vw: ['Volkswagen', 'https://privacy.vwgoa.com/'],
    car_stellantis: ['Stellantis', 'https://privacyportal.onetrust.com/webform/abdee64f-f547-46bd-97a7-f56d58479fce/d33c9846-4a86-4ee4-97fc-92dae7e3a7cf'],
  };

  it.each(Object.entries(MAKES))('%s data audit files a request at the right form', (acct, [name, url]) => {
    const m = byId(`${acct}-recon-audit`);
    expect(m.title).toBe(`File a data request: ${name}`);
    expect(stepUrls(m)).toEqual([url]);
    expect(stepText(m)).toMatch(/45 days/);
    expect(m.debriefQs.map((q) => q.id)).toEqual(['request']);
    expect(values(m, 'request')).toEqual(['request-filed', 'already-filed', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('finding');
    filesCleanly(m, 'request');
  });

  it('no Freeway link is one of the dead or wrong ones', () => {
    const all = MISSIONS.filter((m) => m.district === 'freeway' || ACCOUNTS[m.accountId]?.district === 'freeway');
    const urls = all.flatMap(stepUrls).concat(Object.values(ACCOUNTS).filter((a) => a.district === 'freeway').map((a) => a.securityUrl));
    for (const bad of ['ksupport.kiausa.com', '/draft/', 'fsgroupprivacy', 'tesla.com/support/contact', 'privacynotincluded', '664c75ee', 'honda.com/privacy/your-privacy-choices', 'subaru.com/support/consumer-privacy']) {
      expect(urls.filter((u) => u?.includes(bad)), bad).toEqual([]);
    }
  });

  it('the vehicle privacy report is for every car owner, with its own answers', async () => {
    const { isMissionInPlay } = await import('../src/utils/mission-status.js');
    const { createInitialState } = await import('../src/state.js');
    const m = byId('car_general-recon-vin');
    expect(m.accountId).toBeUndefined();
    expect(m.district).toBe('freeway');
    const s = createInitialState();
    const cars = Object.keys(s.accounts).filter((id) => id.startsWith('car_'));
    const off = { ...s, accounts: Object.fromEntries(Object.entries(s.accounts).map(([id, a]) => [id, { ...a, enabled: cars.includes(id) ? false : a.enabled }])) };
    expect(isMissionInPlay(off, m)).toBe(false);
    const toyota = { ...off, accounts: { ...off.accounts, car_toyota: { ...off.accounts.car_toyota, enabled: true } } };
    expect(isMissionInPlay(toyota, m)).toBe(true);
    expect(stepUrls(m)).toEqual(['https://vehicleprivacyreport.com/']);
    expect(text(m)).not.toMatch(/Mozilla|risk level/);
    expect(values(m, 'vehicle_label')).toEqual(['collects-little', 'collects-location', 'shares-or-sells', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('finding');
    filesCleanly(m, 'vehicle_label');
  });

  const INSURANCE = {
    car_gm: [/Smart Driver ended in April 2024/, /FTC/],
    car_toyota: [/Data Privacy Portal/, /Insure Connect/],
    car_honda: [/Driver Feedback ended in April 2024/],
    car_kia: [/Kia Access/, /LexisNexis/],
    car_subaru: [/odometer/],
    car_vw: [/DriveView/],
  };

  it.each(Object.entries(INSURANCE))('%s insurance check uses both reports and the true make-specific step', (acct, facts) => {
    const m = byId(`${acct}-recon-insurance`);
    expect(m.title).toMatch(/^Insurance Data Check: /);
    expect(stepUrls(m)).toEqual(['https://consumer.risk.lexisnexis.com/request', 'https://fcra.verisk.com']);
    for (const f of facts) expect(stepText(m)).toMatch(f);
    expect(values(m, 'insurer_data')).toEqual(['none-found', 'program-on', 'found-in-report', 'requested', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('finding');
    expect(stepText(m)).not.toMatch(/Settings > Privacy/);
    filesCleanly(m, 'insurer_data');
  });

  it('no mission says an ended program, STARLINK or Car-Net shares driving data with insurers now', () => {
    for (const acct of ['car_gm', 'car_honda', 'car_subaru', 'car_vw']) {
      for (const m of MISSIONS.filter((x) => x.accountId === acct)) {
        expect(text(m), m.id).not.toMatch(/is the pipeline sending|program shares driving data with insurance|feeding your driving data straight/);
        expect(text(m), m.id).not.toMatch(/Car-Net/);
      }
    }
    expect(byId('car_subaru-optout-app').briefing).toContain('not an insurance program');
    for (const acct of ['car_gm', 'car_honda']) expect(byId(`${acct}-optout-app`).briefing).toContain('ended in April 2024');
  });

  it('opt-out timing is 15 business days, not 45 days', () => {
    const m = byId('car_toyota-optout-privacy');
    expect(text(m)).not.toMatch(/45 days/);
    expect(m.briefing).toContain('15 business days');
    expect(text(byId('car_toyota-reclaim-delete'))).not.toMatch(/no more data on their servers/);
  });
});

describe('Freeway old saves', () => {
  it('an old car audit or VIN report answer still shows, counts and restores', async () => {
    const { renderDebrief } = await import('../src/screens/debrief.js');
    const { restoreEvents } = await import('../src/utils/restore.js');
    const { calcDistrictProgress } = await import('../src/utils/calc.js');
    const { createInitialState } = await import('../src/state.js');
    let s = createInitialState();
    s = { ...s, accounts: { ...s.accounts, car_gm: { ...s.accounts.car_gm, enabled: true } } };
    const before = calcDistrictProgress(s, 'freeway').completed;
    s = { ...s, missions: {
      'car_gm-recon-audit': { status: 'completed', finding: 'some-sharing' },
      'car_general-recon-vin': { status: 'completed', finding: 'full-sharing' },
    } };
    expect(calcDistrictProgress(s, 'freeway').completed).toBe(before + 2);
    expect(renderDebrief(s, 'car_gm-recon-audit')).toContain('Some data sharing active');
    expect(renderDebrief(s, 'car_general-recon-vin')).toContain('Full data sharing including insurance');
    const ev = restoreEvents(s).filter((e) => e.data.mission?.startsWith('car_'));
    expect(ev.map((e) => e.data.district)).toEqual(['freeway', 'freeway']);
  });
});

describe('The Foundry', () => {
  it('Meta: no invented Instagram toggle; US players have no opt-out; answers fit', () => {
    const m = byId('ai_meta-recon');
    expect(text(m)).not.toContain('Data use for AI improvement');
    expect(text(byId('ai_meta-optout'))).not.toContain('Data use for AI improvement');
    expect(stepText(m)).toMatch(/US: there’s no opt-out/);
    expect(stepText(m)).toMatch(/May 27, 2025/);
    expect(values(m, 'meta_ai')).toEqual(['no-option', 'objected', 'limited-public', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('finding');
    filesCleanly(m, 'meta_ai');
  });

  it('Gemini’s setting is Keep Activity', () => {
    for (const id of ['ai_google-recon', 'ai_google-optout']) {
      expect(text(byId(id))).not.toContain('Gemini Apps Activity');
      expect(text(byId(id))).toContain('Keep Activity');
    }
  });

  it('Alexa: Help improve Alexa → Use of voice recordings; the old local option is gone', () => {
    for (const id of ['ai_amazon-recon', 'ai_amazon-optout']) {
      expect(text(byId(id))).not.toContain('Help improve Amazon services');
      expect(stepText(byId(id))).toContain('Use of voice recordings');
    }
    expect(text(byId('ai_amazon-recon'))).toMatch(/March 2025/);
  });

  it('ChatGPT links go to chatgpt.com and promise nothing more than the toggle does', () => {
    for (const id of ['ai_openai-recon', 'ai_openai-optout']) {
      expect(text(byId(id))).not.toContain('chat.openai.com');
    }
    expect(text(byId('ai_openai-optout'))).not.toMatch(/stay private/);
  });
});

describe('The Grid', () => {
  it('TV paths include the missing menus', () => {
    const t = stepText(byId('smart_tv-recon-acr'));
    expect(t).toContain('General & Privacy → Terms & Privacy');
    expect(t).toContain('User Agreements');
    expect(t).toContain('Analytics & Improvements');
    expect(t).toContain('Walmart');
  });

  it('voice assistant paths are current', () => {
    const t = stepText(byId('voice_assistant-recon-recordings'));
    expect(t).toContain('Apple Intelligence & Siri');
    expect(t).toContain('Analytics & Improvements');
    expect(t).toContain('Include voice and audio activity');
    expect(t).toContain('Use of voice recordings');
  });

  it('camera access: real paths, who-has-access answers, the true Wyze history', () => {
    const m = byId('smart_camera-recon-access');
    expect(stepText(m)).toContain('Control Center → User Permissions');
    expect(stepText(m)).toContain('Home settings');
    expect(values(m, 'camera_access')).toEqual(['only-me', 'removed-old', 'stranger', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('finding');
    expect(text(m)).not.toMatch(/didn't disclose it for two years|for two years and said nothing/);
    expect(m.briefing).toContain('within days');
    filesCleanly(m, 'camera_access');
  });

  it('Amazon never bought iRobot', () => {
    const line = byId('smart_appliances-recon-inventory').scoutDialog.briefing;
    expect(line).not.toMatch(/Amazon bought iRobot/);
    expect(line).toContain('the deal died in 2024');
  });
});

describe('The Clinic', () => {
  it('Fitbit is a Google account now; Garmin’s settings moved', () => {
    const m = byId('fitness-audit-data-sharing');
    expect(text(m)).not.toContain('fitbit.com/settings');
    expect(stepText(m)).toContain('Manage connected apps');
    expect(stepUrls(m)).toEqual(['https://myaccount.google.com/linkedapps', 'https://connect.garmin.com/app/settings']);
    for (const id of ['fitness-limit-sharing', 'fitness-export-data']) expect(text(byId(id))).not.toMatch(/fitbit\.com\/settings|connect\.garmin\.com\/modern/);
  });

  it('Natural Cycles says it doesn’t sell or share cycle data', () => {
    const t = text(byId('health-apps-period-tracker-audit'));
    expect(t).not.toMatch(/Natural Cycles shares data with advertisers/);
    expect(t).toContain('never sells or shares cycle or health data');
  });

  it('therapy app check: refunds were automatic, its own answers', () => {
    const m = byId('health-apps-mental-health-audit');
    expect(m.title).toBe('Therapy app data check');
    expect(text(m)).not.toMatch(/eligible for the FTC settlement refund|might be owed money/);
    expect(text(m)).toMatch(/automatically/);
    expect(stepUrls(m)).not.toContain('https://www.ftc.gov/legal-library/browse/cases-proceedings/2023169-betterhelp-inc');
    expect(values(m, 'therapy_apps')).toEqual(['none-used', 'no-record', 'has-record', 'requested-delete', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('health_audit');
    filesCleanly(m, 'therapy_apps');
  });

  it('the telehealth audit is about prescriptions and pharmacies now, not a copy', () => {
    const m = byId('telehealth-therapy-app-audit');
    expect(m.title).toBe('Prescription & pharmacy data check');
    expect(text(m)).not.toMatch(/BetterHelp|qualify for the FTC refund|owed money/);
  });

  it('23andMe was sold to TTAM in July 2025', () => {
    const m = byId('genetic-delete-23andme');
    expect(m.title).not.toMatch(/URGENT/);
    expect(m.briefing).toContain('TTAM Research Institute');
    expect(text(m)).not.toMatch(/highest bidder|auction block|bankruptcy sale could happen/);
  });

  it('Virgin Pulse is Personify Health now', () => {
    expect(text(byId('health-insurance-wellness-programs'))).toContain('Personify Health (formerly Virgin Pulse)');
  });

  it('no Clinic step links a dead page', () => {
    const urls = MISSIONS.filter((m) => ['fitness_trackers', 'health_apps', 'genetic_testing', 'telehealth', 'health_insurance'].includes(m.accountId)).flatMap(stepUrls);
    for (const bad of ['myfitnesspal.com/account/delete_account', 'ancestry.com/account/settings', 'myheritage.com/dna/settings', '2023169-betterhelp-inc"', 'you.23andme.com']) {
      expect(urls.filter((u) => `${u}"`.includes(bad)), bad).toEqual([]);
    }
  });
});

describe('The Trail', () => {
  it('Plaid: the Portal shows connections now; the data request is a separate, slower form', () => {
    const m = byId('payment_trail-recon-plaid');
    expect(stepUrls(m)).toEqual(['https://my.plaid.com', 'https://my.plaid.com/data-subject-request-form']);
    expect(text(m)).not.toContain('plaid.com/legal/data-protection-request');
    expect(m.briefing).toMatch(/announced in 2021 and approved in 2022/);
    expect(values(m, 'plaid_connections')).toEqual(['none', 'disconnected', 'many', 'skip']);
    expect(m.debriefQs[0].legacy.id).toBe('finding');
    filesCleanly(m, 'plaid_connections');
  });

  it('the 83% figure is labelled as EFF’s 2010 study', () => {
    expect(byId('browser_fingerprint-recon-test').briefing).toContain('In EFF’s 2010 study, 83% of browsers were unique');
  });
});

describe('phone width', () => {
  it('a step with a long unbroken token (a URL path in the text) wraps instead of widening the page', async () => {
    const { renderBriefing } = await import('../src/screens/briefing.js');
    const { createInitialState } = await import('../src/state.js');
    const html = renderBriefing(createInitialState(), 'sim_protection-reclaim-remove-sms');
    expect(html).toMatch(/line-height: 1\.5; min-width: 0; overflow-wrap: anywhere;">/);
  });

  it('no mission string starts or ends with a stray backtick', () => {
    const bad = [];
    const walk = (id, o) => {
      if (typeof o === 'string') { if (/^\s*`|`\s*$/.test(o)) bad.push(`${id}: ${o.slice(-40)}`); } else if (o && typeof o === 'object') for (const v of Object.values(o)) walk(id, v);
    };
    for (const m of MISSIONS) walk(m.id, m);
    expect(bad).toEqual([]);
  });
});

describe('Capitol logins after breaker phase 3', () => {
  it('StudentAid is an FSA ID, separate from the SSA login', () => {
    const m = byId('student_loans-fortify-password');
    expect(text(m)).not.toMatch(/Login\.gov/);
    expect(m.briefing).toContain('FSA ID');
  });

  it('SSA lockdown: Self Lock is E-Verify’s (USCIS), and no claim that one login covers IRS, VA and unemployment', () => {
    const t = text(byId('ssa-fortify-lockdown'));
    expect(t).not.toMatch(/SSA's Self Lock|Back in SSA: consider enabling|state unemployment/);
    expect(t).toContain('myE-Verify');
  });
});

describe('SSA record lock (breaker phase 3 sweep)', () => {
  it('names SSA’s real Block Electronic Access, not an in-app Self Lock', () => {
    const m = byId('govt_id_defense-fortify-ssa-lock');
    expect(text(m)).not.toMatch(/Self Lock/);
    expect(stepText(m)).toContain('Block Electronic Access');
    expect(stepText(m)).toContain('1-800-772-1213');
  });
});

describe('breaker phase 3 round 2 rulings', () => {
  it('restore sends missions oldest filing first, so build.sql’s "latest" matches the save', async () => {
    const { restoreEvents } = await import('../src/utils/restore.js');
    const { createInitialState } = await import('../src/state.js');
    const s = { ...createInitialState(), missions: {
      'google-recon-breach': { status: 'completed', finding: 'no-breaches', completedAt: '2026-10-05T10:00:00.000Z' },
      'gmail-recon-breach': { status: 'completed', finding: '3plus-breaches', completedAt: '2026-10-01T10:00:00.000Z' },
      'yahoo-recon-breach': { status: 'skipped', finding: 'skip' },
      'outlook-recon-breach': { status: 'completed', finding: 'no-breaches', completedAt: '2026-10-03T10:00:00.000Z' },
    } };
    const order = restoreEvents(s).filter((e) => e.name === 'mission-completed').map((e) => e.data.mission);
    expect(order).toEqual(['yahoo-recon-breach', 'gmail-recon-breach', 'outlook-recon-breach', 'google-recon-breach']);
  });

  it('the Capitol’s welcome-back line claims nothing the player may not have done', async () => {
    const { DISTRICT_DIALOGUE } = await import('../src/data/dialogue.js');
    const line = DISTRICT_DIALOGUE.capitol.return.long;
    expect(line).not.toMatch(/SSA lock is still active|IRS account is still claimed/);
  });
});

describe('breaker phase 3 round 4: carriers and Health Connect', () => {
  const steps = (id) => byId(id).steps.map((s) => s.text);
  it('AT&T: the extra security passcode is for signing in online; Wireless Account Lock locks the number', () => {
    const att = steps('sim_protection-fortify-pin').filter((t) => /^AT&T/.test(t)).join(' ');
    expect(att).toContain('Wireless Account Lock');
    expect(att).toMatch(/signing in online/);
    expect(att).not.toMatch(/ALL account changes/);
    expect(stepUrls(byId('sim_protection-fortify-pin'))).toContain('https://www.att.com/support/article/wireless/000102016/');
  });

  it('Verizon: a 4-digit Account PIN at vzw.com/PIN; Number Lock is its own switch', () => {
    const vz = steps('sim_protection-fortify-pin').filter((t) => /^Verizon/.test(t)).join(' ');
    expect(vz).toMatch(/4-digit Account PIN/);
    expect(vz).toContain('vzw.com/PIN');
    expect(vz).toContain('Edit profile and settings');
    expect(vz).not.toMatch(/same page/);
  });

  it('Android health permissions live in Health Connect; no claim that every app reads everything', () => {
    const m = byId('health-insurance-data-permissions');
    expect(stepText(m)).toContain('Health Connect');
    expect(stepText(m)).not.toContain('Google Fit');
    expect(m.briefing).not.toMatch(/can read data contributed by every other app/);
  });
});
