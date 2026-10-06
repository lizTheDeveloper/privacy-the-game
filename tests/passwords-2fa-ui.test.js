import { describe, it, expect } from 'vitest';
import { renderDebrief } from '../src/screens/debrief.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { createInitialState, updateMission } from '../src/state.js';
import { PASSWORD_DIALOGUE, TWO_FA_DIALOGUE, COLLECTIVE_DIALOGUE } from '../src/data/dialogue.js';
import { applyDebrief, recordNotNeeded } from '../src/utils/debrief.js';
import { MISSIONS } from '../src/data/missions.js';

const set = (s, id, rec) => updateMission(s, id, rec);
const byId = (id) => MISSIONS.find((m) => m.id === id);
const s0 = createInitialState();
const clean = (s, acct = 'gmail') => set(s, `${acct}-recon-breach`, { status: 'completed', finding: 'no-breaches' });
// The group (question block) that holds a question's inputs.
const group = (html, qid) => {
  const i = html.indexOf(`data-question="${qid}"`);
  if (i < 0) return null;
  return html.slice(html.lastIndexOf('<div', i), html.indexOf(`name="q_${qid}"`, i) + 20);
};

describe('breach debrief: the password question', () => {
  it('is in the form but hidden until a breach is picked', () => {
    const html = renderDebrief(s0, 'gmail-recon-breach');
    const g = group(html, 'password_exposed');
    expect(g).toContain('hidden');
    expect(g).toContain('data-show-if-q="finding"');
    expect(g).toContain('data-show-if-values="1-2-breaches,3plus-breaches"');
    expect(group(html, 'finding')).not.toContain('hidden');
    expect(html).toContain('DID ANY OF THOSE BREACHES INCLUDE YOUR PASSWORD?');
    expect(html).toContain('Compromised data');
  });

  it('a filed clean check shows no password question', () => {
    const html = renderDebrief(clean(s0), 'gmail-recon-breach');
    expect(html).not.toContain('INCLUDE YOUR PASSWORD');
  });

  it('a filed breach shows the answer and Scout says the password is fine', () => {
    const s = set(s0, 'gmail-recon-breach', { status: 'completed', finding: '1-2-breaches', password_exposed: 'no' });
    const html = renderDebrief(s, 'gmail-recon-breach');
    expect(html).toContain('INCLUDE YOUR PASSWORD');
    expect(html).toContain('No — only things like email or username');
    expect(html).toContain(PASSWORD_DIALOGUE.breachNoPassword);
  });

  it('an old save with a breach and no answer still renders', () => {
    const s = set(s0, 'gmail-recon-breach', { status: 'completed', finding: '1-2-breaches' });
    const html = renderDebrief(s, 'gmail-recon-breach');
    expect(html).toContain('SECURED');
    expect(html).not.toContain('INCLUDE YOUR PASSWORD');
  });
});

describe('2FA debrief', () => {
  it('asks what protects the account; the setup question waits for "nothing yet"', () => {
    const html = renderDebrief(s0, 'gmail-fortify-2fa');
    expect(html).toContain('WHAT PROTECTS THIS ACCOUNT NOW?');
    expect(group(html, 'method')).not.toContain('hidden');
    const g = group(html, 'method_setup');
    expect(g).toContain('hidden');
    expect(g).toContain('data-show-if-values="none"');
  });

  it('text codes count, with a plain warning and the upgrade offered', () => {
    const s = set(s0, 'gmail-fortify-2fa', { status: 'completed', action: 'already-enabled', method: 'sms' });
    const html = renderDebrief(s, 'gmail-fortify-2fa');
    expect(html).toContain(TWO_FA_DIALOGUE.sms);
    expect(TWO_FA_DIALOGUE.sms).toMatch(/SIM swap/);
    expect(TWO_FA_DIALOGUE.email).toMatch(/inbox/);
    expect(html).toContain('href="#/mission/gmail-fortify-2fa-upgrade/briefing"');
  });

  it('passkey or app gets admiration and no upgrade', () => {
    for (const method of ['passkey', 'authenticator']) {
      const s = set(s0, 'gmail-fortify-2fa', { status: 'completed', action: 'already-enabled', method });
      const html = renderDebrief(s, 'gmail-fortify-2fa');
      expect(html).toContain(TWO_FA_DIALOGUE[method]);
      expect(html).not.toContain('fortify-2fa-upgrade');
    }
  });

  it('none -> set up shows both answers and reacts to the method set up', () => {
    const s = set(s0, 'gmail-fortify-2fa', { status: 'completed', action: 'enabled-2fa', method: 'none', method_setup: 'email' });
    const html = renderDebrief(s, 'gmail-fortify-2fa');
    expect(html).toContain('Nothing yet — I’ll set it up now');
    expect(html).toContain('WHICH DID YOU SET UP?');
    expect(html).toContain(TWO_FA_DIALOGUE.email);
  });

  it('an old save shows its old answer, not "Not recorded"', () => {
    const s = set(s0, 'gmail-fortify-2fa', { status: 'completed', action: 'enabled-2fa' });
    const html = renderDebrief(s, 'gmail-fortify-2fa');
    expect(html).toContain('DID YOU SET UP TWO-FACTOR AUTHENTICATION?');
    expect(html).toContain('Yes, 2FA is now enabled');
    expect(html).not.toContain('Not recorded');
  });
});

describe('password manager report debrief', () => {
  it('is a multi-select of the player’s password accounts', () => {
    const s = { ...s0, passwordManager: 'bitwarden' };
    const html = renderDebrief(s, 'password_manager-recon-report');
    expect(html).toMatch(/type="checkbox" name="q_flagged" value="gmail"/);
    expect(html).toMatch(/type="checkbox" name="q_flagged" value="none"/);
  });

  it('a filed report lists what it flagged', () => {
    let s = { ...s0, passwordManager: 'bitwarden', pmFlagged: ['gmail'] };
    s = set(s, 'password_manager-recon-report', { status: 'completed', action: 'flagged', flagged: ['gmail'], flagged_count: 9, throwaway_count: 0 });
    const html = renderDebrief(s, 'password_manager-recon-report');
    expect(html).toContain('Gmail');
    expect(html).not.toContain('Not recorded');
  });
});

describe('applyDebrief and recordNotNeeded', () => {
  it('stores pmFlagged and reopens a no-longer-true "no reset needed"', () => {
    let s = { ...clean(s0), passwordManager: 'bitwarden' };
    s = recordNotNeeded(s, 'gmail-fortify-password');
    expect(s.missions['gmail-fortify-password'].status).toBe('not-needed');
    s = applyDebrief(s, byId('password_manager-recon-report'), { flagged_count: '5', throwaway_count: '0', flagged: ['gmail'] });
    expect(s.pmFlagged).toEqual(['gmail']);
    expect(s.missions['password_manager-recon-report'].status).toBe('completed');
    expect(s.missions['gmail-fortify-password'].status).toBeUndefined();
  });

  it('returns null for an incomplete form', () => {
    expect(applyDebrief(s0, byId('gmail-fortify-2fa'), { method: 'none' })).toBeNull();
  });

  it('recordNotNeeded only applies when no reset is needed', () => {
    expect(recordNotNeeded(s0, 'gmail-fortify-password')).toBe(s0);
  });
});

describe('briefing: no reset needed', () => {
  it('shows the badge, Scout’s line, the reasons, GOT IT and reset-anyway', () => {
    const html = renderBriefing(clean(s0), 'gmail-fortify-password');
    expect(html).toContain('NO RESET NEEDED');
    expect(html).toContain(PASSWORD_DIALOGUE.notNeeded);
    expect(html).toContain('Your breach check found no breaches.');
    expect(html).toContain('data-action="password-not-needed"');
    expect(html).toContain('data-action="reset-anyway"');
    expect(html).not.toContain('data-action="go-do-it"');
  });

  it('reset anyway is the normal flow', () => {
    const html = renderBriefing(clean(s0), 'gmail-fortify-password', { resetAnyway: true });
    expect(html).toContain('data-action="go-do-it"');
    expect(html).not.toContain('data-action="password-not-needed"');
  });

  it('a recorded not-needed keeps reset-anyway but no second GOT IT', () => {
    const s = recordNotNeeded(clean(s0), 'gmail-fortify-password');
    const html = renderBriefing(s, 'gmail-fortify-password');
    expect(html).toContain('NO RESET NEEDED');
    expect(html).not.toContain('data-action="password-not-needed"');
    expect(html).toContain('data-action="reset-anyway"');
  });

  it('needed or unknown: the briefing is unchanged', () => {
    for (const s of [s0, set(s0, 'gmail-recon-breach', { status: 'completed', finding: '3plus-breaches', password_exposed: 'yes' })]) {
      const html = renderBriefing(s, 'gmail-fortify-password');
      expect(html).not.toContain('NO RESET NEEDED');
      expect(html).toContain('data-action="go-do-it"');
    }
  });

  it('the password manager report shows the player’s manager steps', () => {
    const g = renderBriefing({ ...s0, passwordManager: 'google' }, 'password_manager-recon-report');
    expect(g).toContain('https://passwords.google.com/checkup');
    const a = renderBriefing({ ...s0, passwordManager: 'apple' }, 'password_manager-recon-report');
    expect(a).toContain('Security Recommendations');
    expect(a).toContain('data-url=""');
  });
});

describe('district screens', () => {
  it('the Master Keys survey asks about a password manager', () => {
    const html = renderDistrict(s0, 'master-keys', 'survey');
    expect(html).toContain('DO YOU USE A PASSWORD MANAGER?');
    expect(html.match(/data-action="set-password-manager"/g)).toHaveLength(11);
    expect(html).not.toContain(PASSWORD_DIALOGUE.noManager);
    expect(renderDistrict(s0, 'vault', 'survey')).not.toContain('PASSWORD MANAGER?');
  });

  it('marks the chosen manager; no manager gets Scout’s one-line nudge', () => {
    const html = renderDistrict({ ...s0, passwordManager: 'none' }, 'master-keys', 'survey');
    expect(html).toMatch(/data-pm="none"[^>]*aria-pressed="true"/);
    expect(html).toContain(PASSWORD_DIALOGUE.noManager);
  });

  it('the report mission is in recon only for players with a manager', () => {
    expect(renderDistrict(s0, 'master-keys', 'recon')).not.toContain('password_manager-recon-report');
    expect(renderDistrict({ ...s0, passwordManager: 'none' }, 'master-keys', 'recon')).not.toContain('password_manager-recon-report');
    expect(renderDistrict({ ...s0, passwordManager: 'lastpass' }, 'master-keys', 'recon')).toContain('#/mission/password_manager-recon-report/briefing');
  });

  it('fortify list: "no reset needed" before and after GOT IT', () => {
    const before = renderDistrict(clean(s0), 'master-keys', 'fortify');
    expect(before).toContain('No reset needed');
    expect(before).toContain('#/mission/gmail-fortify-password/briefing');
    const after = renderDistrict(recordNotNeeded(clean(s0), 'gmail-fortify-password'), 'master-keys', 'fortify');
    expect(after).toContain('NO RESET NEEDED');
  });

  it('upgrade row appears only after 2FA by codes', () => {
    const s = clean(s0);
    expect(renderDistrict(s, 'master-keys', 'fortify')).not.toContain('gmail-fortify-2fa-upgrade');
    const sms = set(s, 'gmail-fortify-2fa', { status: 'completed', action: 'already-enabled', method: 'sms' });
    expect(renderDistrict(sms, 'master-keys', 'fortify')).toContain('#/mission/gmail-fortify-2fa-upgrade/briefing');
  });

  it('an old 2FA save keeps its summary line', () => {
    const s = set(clean(s0), 'gmail-fortify-2fa', { status: 'completed', action: 'enabled-2fa' });
    expect(renderDistrict(s, 'master-keys', 'fortify')).toContain('Yes, 2FA is now enabled');
  });

  it('a 2FA summary names the method', () => {
    const s = set(clean(s0), 'gmail-fortify-2fa', { status: 'completed', action: 'enabled-2fa', method: 'none', method_setup: 'authenticator' });
    expect(renderDistrict(s, 'master-keys', 'fortify')).toContain('An authenticator app');
  });
});

describe('city map next mission', () => {
  it('skips a not-needed password reset and never suggests a locked bonus', () => {
    // Everything core done except one reclaim mission (so the city isn't
    // complete) and the gmail reset, which recon showed isn't needed.
    const core = MISSIONS.filter((m) => s0.accounts[m.accountId]?.enabled && !m.optional && m.phase !== 'survey');
    const leftOpen = core.find((m) => m.phase === 'reclaim');
    let s = s0;
    for (const m of core) {
      if (m.id !== 'gmail-fortify-password' && m !== leftOpen) s = set(s, m.id, { status: 'completed' });
    }
    s = clean(s);
    s = recordNotNeeded(s, 'gmail-fortify-password');
    const html = renderCityMap(s, { collective: { status: 'idle' }, whoami: { status: 'idle' } });
    expect(html).toContain(`#/mission/${leftOpen.id}/briefing`);
    expect(html).not.toContain('#/mission/gmail-fortify-password/briefing');
    expect(html).not.toMatch(/#\/mission\/[a-z_]+-fortify-2fa-upgrade\/briefing/);
    expect(html).not.toContain('#/mission/password_manager-recon-report/briefing');
  });
});

describe('privacy copy stays true', () => {
  it('no longer says one answer per debrief', () => {
    expect(COLLECTIVE_DIALOGUE.explainer).not.toContain('the one answer you pick in each debrief');
  });
});
