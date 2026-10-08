// Phase 3 reviewer, FIX FIRST. C1: the vehicle privacy report became in play
// for every car; as a core mission it dropped old non-GM saves below 100%.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS, getMissionsForDistrict } from '../src/data/missions.js';
import { createInitialState } from '../src/state.js';
import { calcDistrictProgress, isCoreMission } from '../src/utils/calc.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';
import { isCityComplete } from '../src/utils/ghost.js';
import { restoreEvents } from '../src/utils/restore.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

function only(ids) {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: ids.includes(id) } } };
  return s;
}

describe('C1: the vehicle privacy report never lowers an old save', () => {
  it('is a bonus that counts once done', () => {
    const m = MISSIONS.find((x) => x.id === 'car_general-recon-vin');
    expect(m.optional).toBe(true);
    expect(m.countsWhenDone).toBe(true);
  });

  it('a Ford-only save with The Freeway at 100% stays at 100%, the city stays complete, and restore sends the district', () => {
    let s = only(['car_ford']);
    const done = {};
    for (const m of getMissionsForDistrict('freeway')) {
      if (m.id === 'car_general-recon-vin' || !isMissionInPlay(s, m) || !isCoreMission(m)) continue;
      done[m.id] = { status: 'completed', completedAt: '2026-09-01T10:00:00.000Z' };
    }
    s = { ...s, missions: done };
    expect(calcDistrictProgress(s, 'freeway').percent).toBe(100);
    expect(isCityComplete(s)).toBe(true);
    expect(restoreEvents(s).some((e) => e.name === 'district-completed' && e.data.district === 'freeway')).toBe(true);
    // Filing the report later keeps it at 100%.
    const later = { ...s, missions: { ...s.missions, 'car_general-recon-vin': { status: 'completed', vehicle_label: 'collects-little' } } };
    expect(calcDistrictProgress(later, 'freeway').percent).toBe(100);
  });
});

describe('I2: freezes are managed with your account login; PINs only where a bureau still issues them', () => {
  const ids = ['credit_freeze-fortify-equifax', 'credit_freeze-fortify-experian', 'credit_freeze-fortify-transunion', 'credit_freeze-fortify-extras', 'credit_freeze-reclaim-pins'];
  const t = (id) => JSON.stringify(MISSIONS.find((m) => m.id === id));
  it.each(ids)('%s: no PIN claim without "or your account login"', (id) => {
    const s = t(id);
    for (const bad of ['Save that PIN', 'save the PIN with your other bureau PINs', 'without your PINs', 'without your PIN', 'Save both PINs', 'up to five freeze PINs', 'Gather all freeze PINs', 'all five PINs', 'A freeze PIN is the key']) {
      expect(s, bad).not.toContain(bad);
    }
  });
  it('TransUnion: no "no one can open new credit" absolute', () => {
    expect(t('credit_freeze-fortify-transunion')).not.toMatch(/no one can open new credit|Nobody is opening credit|hits a wall at every bureau/);
    expect(t('credit_freeze-fortify-transunion')).toContain('Innovis');
  });
  it('the storage mission stores freeze logins and any PINs; its debrief values are unchanged', () => {
    const m = MISSIONS.find((x) => x.id === 'credit_freeze-reclaim-pins');
    expect(m.title).toBe('Store Your Freeze Logins and PINs');
    expect(m.debriefQs[0].options.map((o) => o.value)).toEqual(['stored-both', 'stored-digital', 'skip']);
    expect(m.debriefQs[0].label).toBe('Are your freeze logins and any PINs stored safely?');
  });
});

describe('I3: what a missing IP PIN does', () => {
  const m = () => JSON.stringify(MISSIONS.find((x) => x.id === 'irs-fortify-ip-pin'));
  it('e-filed returns are rejected; paper returns are delayed for verification', () => {
    expect(m()).toContain('An e-filed return without the right IP PIN is rejected; a paper return is delayed while the IRS verifies it');
    expect(m()).not.toMatch(/the return gets rejected -- even|gets rejected\./);
  });
});

describe('I2/I3 sweep: freeze and IP PIN absolutes', () => {
  const t = (id) => JSON.stringify(MISSIONS.find((m) => m.id === id));
  it('no freeze or IP PIN line promises that nobody can open credit or file', () => {
    expect(t('credit_freeze-fortify-equifax')).not.toContain('prevents anyone from opening new credit');
    expect(t('govt_id_defense-fortify-irs-pin')).not.toMatch(/prevents anyone from filing|Nobody is filing a tax return/);
    expect(t('govt_id_defense-fortify-irs-pin')).toContain('An e-filed return without the right IP PIN is rejected; a paper return is delayed while the IRS verifies it');
  });
});

describe('I4: the 2FA ENABLED stat counts only two-factor missions', async () => {
  const { calcFindings, isTwoFactorMission } = await import('../src/utils/calc.js');
  it('an IP PIN and a Signal registration lock are not 2FA; real 2FA missions are', () => {
    const s = { ...createInitialState(), missions: {
      'irs-fortify-ip-pin': { status: 'completed', action: 'enabled-2fa' },
      'govt_id_defense-fortify-irs-pin': { status: 'completed', action: 'enabled-2fa' },
      'signal-fortify-reglock': { status: 'completed', action: 'enabled-2fa' },
      'gmail-fortify-2fa': { status: 'completed', method: 'none', method_setup: 'authenticator', action: 'enabled-2fa' },
      'telegram-fortify-twostep': { status: 'completed', action: 'enabled-2fa' },
      'whatsapp-fortify-reglock': { status: 'completed', action: 'enabled-2fa' },
    } };
    expect(calcFindings(s).twoFactorEnabled).toBe(3);
    const byId = (id) => MISSIONS.find((m) => m.id === id);
    expect(isTwoFactorMission(byId('irs-fortify-ip-pin'))).toBe(false);
    expect(isTwoFactorMission(byId('signal-fortify-reglock'))).toBe(false);
    expect(isTwoFactorMission(byId('gmail-fortify-2fa'))).toBe(true);
  });
});

describe('round 7 and lows', () => {
  const t = (id) => JSON.stringify(MISSIONS.find((m) => m.id === id));
  it('CLEAR deletion limits are worded generally', () => {
    for (const id of ['enterprise_data-recon-supply-chain', 'enterprise_data-fortify-thomson']) {
      expect(t(id)).not.toMatch(/public officials/);
      expect(t(id)).toMatch(/may limit who can get records deleted|may limit who gets records deleted/);
    }
  });
});

describe('re-review 4 (ruling): no old save loses its finished city', async () => {
  const { migrateBrokenAnswers } = await import('../src/utils/migrate-answers.js');
  it('a pre-4.7.1 save at 100% with a broken "later" answer stays at 100%; only the value is cleaned', () => {
    let s = only(['scam_defense']);
    const done = {};
    for (const m of getMissionsForDistrict('perimeter')) {
      if (!isMissionInPlay(s, m) || !isCoreMission(m)) continue;
      done[m.id] = { status: 'completed', completedAt: '2026-09-01T10:00:00.000Z', action: 'done' };
    }
    const broken = Object.keys(done).find((id) => MISSIONS.find((m) => m.id === id).debriefQs.some((q) => q.id === 'action' && q.options.some((o) => o.value === 'later')));
    expect(broken).toBeTruthy();
    done[broken] = { status: 'completed', completedAt: '2026-09-01T10:00:00.000Z', action: "later', text: 'I'll come back to this', severity: 'skip" };
    s = { ...s, missions: done };
    expect(calcDistrictProgress(s, 'perimeter').percent).toBe(100);
    const m = migrateBrokenAnswers(s);
    expect(m.missions[broken]).toMatchObject({ status: 'completed', action: 'later', completedAt: '2026-09-01T10:00:00.000Z' });
    expect(calcDistrictProgress(m, 'perimeter').percent).toBe(100);
    expect(isCityComplete(m)).toBe(true);
  });
});
