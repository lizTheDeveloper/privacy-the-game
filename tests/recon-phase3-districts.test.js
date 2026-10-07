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
const SENT_KEYS = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method']);

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
