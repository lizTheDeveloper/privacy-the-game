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
