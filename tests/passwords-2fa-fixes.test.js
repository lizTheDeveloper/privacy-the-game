import { describe, it, expect } from 'vitest';
import { renderDebrief } from '../src/screens/debrief.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState, updateMission } from '../src/state.js';
import { PASSWORD_DIALOGUE, COLLECTIVE_DIALOGUE, GHOST_DIALOGUE } from '../src/data/dialogue.js';
import { calcIntegrity, calcExposure, calcDistrictProgress } from '../src/utils/calc.js';
import { getMissionsForDistrict, MISSIONS } from '../src/data/missions.js';
import { isCoreMission } from '../src/utils/calc.js';
import { keyActivationTarget } from '../src/utils/keyboard.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderCityMap } from '../src/screens/city-map.js';

const set = (s, id, rec) => updateMission(s, id, rec);
const s0 = createInitialState();

describe('fix 1: the password-manager debrief knows its district', () => {
  it('BACK TO DISTRICT goes to Master Keys recon', () => {
    let s = { ...s0, passwordManager: 'bitwarden', pmFlagged: [] };
    s = set(s, 'password_manager-recon-report', { status: 'completed', action: 'none-flagged', flagged: ['none'] });
    const html = renderDebrief(s, 'password_manager-recon-report');
    expect(html).toContain('href="#/district/master-keys?tab=recon"');
    expect(html).not.toContain('#/district/?tab');
  });
});

describe('fix 2 and 6: privacy copy', () => {
  it('the explainer uses the ruled phrase', () => {
    expect(COLLECTIVE_DIALOGUE.explainer).toContain(
      'some of what you pick in debriefs — like what a breach check found or how an account is protected —',
    );
  });

  it('the ghost briefing says what we count', () => {
    expect(GHOST_DIALOGUE.briefing).toContain(
      'counts what people do here — which missions they start and finish, a few of the answers they pick, which accounts they said they have, and the place their connection points to — anonymously, on our own server',
    );
    expect(GHOST_DIALOGUE.briefing).not.toContain('counts which missions people start and finish —');
  });
});

describe('fix 3 and 4: the no-reset briefing', () => {
  it('no breach: the "Clean record" line', () => {
    const s = set(s0, 'gmail-recon-breach', { status: 'completed', finding: 'no-breaches' });
    const html = renderBriefing(s, 'gmail-fortify-password');
    expect(html).toContain(PASSWORD_DIALOGUE.notNeeded);
    expect(html).not.toContain(PASSWORD_DIALOGUE.notNeededAfterLeak);
  });

  it('leaks without the password: the ruled line', () => {
    expect(PASSWORD_DIALOGUE.notNeededAfterLeak).toBe(
      "There were leaks, but your password wasn't in them, and nothing's flagged it. Changing it now would just be busywork.",
    );
    const s = set(s0, 'gmail-recon-breach', { status: 'completed', finding: '3plus-breaches', password_exposed: 'no' });
    const html = renderBriefing(s, 'gmail-fortify-password');
    expect(html).toContain(PASSWORD_DIALOGUE.notNeededAfterLeak);
    expect(html).not.toContain(PASSWORD_DIALOGUE.notNeeded);
  });

  it('WHY NO RESET warns about reuse', () => {
    const s = set(s0, 'gmail-recon-breach', { status: 'completed', finding: 'no-breaches' });
    expect(renderBriefing(s, 'gmail-fortify-password')).toContain(
      'Unless you use this same password somewhere else — then change it here, because a leak there opens this door too.',
    );
  });
});

describe('fix 5: bonus missions that unlock later never lower integrity', () => {
  function oldSave() {
    let s = s0;
    // An old save: no manager answer, so no password-manager report.
    for (const m of getMissionsForDistrict('master-keys').filter(isCoreMission)) {
      if (m.unlock) continue;
      s = set(s, m.id, { status: 'completed', action: m.id.endsWith('-fortify-2fa') ? 'enabled-2fa' : undefined });
    }
    return s;
  }

  // What the save scored before Task 14, when unlockable missions didn't
  // exist: the same weighted formula over the other missions.
  function before(s) {
    const rel = MISSIONS.filter((m) => !m.unlock && m.phase !== 'survey' && s.accounts[m.accountId]?.enabled);
    let total = 0;
    let done = 0;
    for (const m of rel) {
      const w = m.optional ? 0.5 : 1;
      total += w;
      if (s.missions[m.id]?.status === 'completed') done += w;
    }
    return { integrity: Math.max(1, Math.round((done / total) * 100)), exposure: Math.max(0, Math.round(1000 - done * (1000 / total))) };
  }

  it('an old save with 2FA done keeps its integrity and exposure when backups unlock', () => {
    const s = oldSave();
    expect(calcIntegrity(s)).toBe(before(s).integrity);
    expect(calcExposure(s)).toBe(before(s).exposure);
  });

  it('a done unlockable bonus raises integrity', () => {
    const s = oldSave();
    const withBackup = set(s, 'gmail-fortify-2fa-backup', { status: 'completed', action: 'added-backup' });
    expect(calcIntegrity(withBackup)).toBeGreaterThanOrEqual(calcIntegrity(s));
    expect(calcExposure(withBackup)).toBeLessThan(calcExposure(s));
  });

  it('district % and bonus counts are unchanged by the rule', () => {
    const s = oldSave();
    expect(calcDistrictProgress(s, 'master-keys').percent).toBe(100);
    expect(calcDistrictProgress(s, 'master-keys').bonusTotal).toBeGreaterThan(0);
  });
});

describe('fix 7: Enter and Space activate role="button" actions', () => {
  const target = (match) => ({ closest: (sel) => (sel === '[role="button"][data-action]' ? match : null) });
  const btn = { dataset: { action: 'reset-anyway' } };

  it.each([['Enter'], [' ']])('%j activates', (key) => {
    expect(keyActivationTarget({ key, target: target(btn) })).toBe(btn);
  });

  it('other keys and non-buttons do nothing', () => {
    expect(keyActivationTarget({ key: 'a', target: target(btn) })).toBeNull();
    expect(keyActivationTarget({ key: 'Enter', target: target(null) })).toBeNull();
    expect(keyActivationTarget({ key: 'Enter', target: null })).toBeNull();
  });
});

describe('fix 9 (Liz): the password manager report is core for players with a manager', () => {
  const PM = 'password_manager-recon-report';
  const withPm = { ...s0, passwordManager: '1password' };

  it('counts toward Master Keys only with a manager', () => {
    expect(calcDistrictProgress(s0, 'master-keys').total).toBe(27);
    expect(calcDistrictProgress({ ...s0, passwordManager: 'none' }, 'master-keys').total).toBe(27);
    expect(calcDistrictProgress(withPm, 'master-keys').total).toBe(28);
    const done = set(withPm, PM, { status: 'completed', action: 'none-flagged', flagged: ['none'] });
    expect(calcDistrictProgress(done, 'master-keys').completed).toBe(1);
  });

  it('has no optional / bonus label', () => {
    expect(renderBriefing(withPm, PM)).not.toContain('BONUS');
    const row = renderDistrict(withPm, 'master-keys', 'recon');
    const at = row.indexOf(`#/mission/${PM}/briefing`);
    const rowHtml = row.slice(row.lastIndexOf('class="mission-row"', at), at);
    expect(rowHtml).not.toContain('Optional bonus');
    expect(rowHtml).not.toContain('>BONUS<');
  });

  it('briefing says plainly that its flags decide the resets', () => {
    expect(renderBriefing(withPm, PM)).toContain(
      'Your password manager can see things we can’t — which passwords leaked and which you’ve reused. Whatever it flags, we change. Whatever it clears, we leave alone.',
    );
    expect(renderDebrief(withPm, PM)).toContain('Whatever it flags gets a new password; whatever it clears stays as it is.');
  });

  it('counts toward integrity once in play', () => {
    const done = set(withPm, PM, { status: 'completed', action: 'none-flagged', flagged: ['none'] });
    expect(calcIntegrity(done)).toBeGreaterThan(calcIntegrity(withPm));
  });

  it('next mission suggests it before the password fortify missions', () => {
    let s = withPm;
    for (const m of MISSIONS) {
      if (m.phase === 'recon' && !m.optional && s.accounts[m.accountId]?.enabled) s = set(s, m.id, { status: 'completed', finding: 'no-breaches' });
    }
    const html = renderCityMap(s, { collective: { status: 'idle' }, whoami: { status: 'idle' } });
    expect(html).toContain(`#/mission/${PM}/briefing`);
  });

  it('switching to "none" after finishing it keeps it counting', () => {
    const done = set(withPm, PM, { status: 'completed', action: 'none-flagged', flagged: ['none'] });
    const after = { ...done, passwordManager: 'none' };
    expect(calcDistrictProgress(after, 'master-keys')).toEqual(calcDistrictProgress(done, 'master-keys'));
  });

  it('accounts it flagged show the flag on their reset briefing and row', () => {
    let s = { ...withPm, pmFlagged: ['gmail'] };
    s = set(s, 'gmail-recon-breach', { status: 'completed', finding: 'no-breaches' });
    s = set(s, PM, { status: 'completed', action: 'flagged', flagged: ['gmail'] });
    const brief = renderBriefing(s, 'gmail-fortify-password');
    expect(brief).toContain('Flagged by your password manager');
    expect(brief).toContain('data-action="go-do-it"');
    expect(brief).not.toContain('NO RESET NEEDED');
    expect(renderDistrict(s, 'master-keys', 'fortify')).toContain('Flagged by your password manager');
    expect(renderBriefing(s, 'yahoo-fortify-password')).not.toContain('Flagged by your password manager');
  });
});
