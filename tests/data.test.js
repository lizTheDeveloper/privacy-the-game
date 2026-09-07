import { describe, it, expect } from 'vitest';
import { DISTRICTS } from '../src/data/districts.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { MISSIONS, getMissionsForDistrict, getMissionsForAccount } from '../src/data/missions.js';

describe('DISTRICTS', () => {
  it('has 8 districts', () => {
    expect(DISTRICTS).toHaveLength(8);
  });

  it('each district has required fields', () => {
    for (const d of DISTRICTS) {
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('chapter');
      expect(d).toHaveProperty('description');
    }
  });

  it('chapters are ordered 1-8', () => {
    const chapters = DISTRICTS.map((d) => d.chapter);
    expect(chapters).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('ACCOUNTS', () => {
  it('every account references a valid district', () => {
    const districtIds = new Set(DISTRICTS.map((d) => d.id));
    for (const [id, acct] of Object.entries(ACCOUNTS)) {
      expect(districtIds.has(acct.district), `${id} has invalid district ${acct.district}`).toBe(true);
    }
  });

  it('Chapter 1 accounts have building assets', () => {
    const ch1 = Object.entries(ACCOUNTS).filter(([, a]) => a.district === 'master-keys');
    for (const [id, acct] of ch1) {
      expect(acct.building, `${id} missing building`).toBeTruthy();
      expect(acct.buildingDark, `${id} missing buildingDark`).toBeTruthy();
    }
  });
});

describe('MISSIONS', () => {
  it('every mission references a valid account', () => {
    for (const m of MISSIONS) {
      expect(ACCOUNTS[m.accountId], `mission ${m.id} has invalid account ${m.accountId}`).toBeTruthy();
    }
  });

  it('every mission has briefing, steps, and debrief questions', () => {
    for (const m of MISSIONS) {
      expect(m.briefing, `${m.id} missing briefing`).toBeTruthy();
      expect(m.steps?.length, `${m.id} missing steps`).toBeGreaterThan(0);
      expect(m.debriefQs?.length, `${m.id} missing debrief questions`).toBeGreaterThan(0);
    }
  });

  it('phases are valid', () => {
    const validPhases = new Set(['survey', 'recon', 'fortify', 'reclaim']);
    for (const m of MISSIONS) {
      expect(validPhases.has(m.phase), `${m.id} has invalid phase ${m.phase}`).toBe(true);
    }
  });

  it('has 45 missions for Chapter 1 (9 accounts × 5 missions)', () => {
    const ch1 = getMissionsForDistrict('master-keys');
    expect(ch1).toHaveLength(45);
  });

  it('each account has 5 missions', () => {
    const ch1Accounts = Object.entries(ACCOUNTS)
      .filter(([, a]) => a.district === 'master-keys')
      .map(([id]) => id);
    for (const acctId of ch1Accounts) {
      const missions = getMissionsForAccount(acctId);
      expect(missions, `${acctId} should have 5 missions`).toHaveLength(5);
    }
  });

  it('every mission has scoutDialog with briefing and debrief', () => {
    for (const m of MISSIONS) {
      expect(m.scoutDialog, `${m.id} missing scoutDialog`).toBeTruthy();
      expect(m.scoutDialog.briefing, `${m.id} missing scoutDialog.briefing`).toBeTruthy();
      expect(m.scoutDialog.debrief, `${m.id} missing scoutDialog.debrief`).toBeTruthy();
    }
  });

  it('getMissionsForDistrict returns only that district missions', () => {
    const missions = getMissionsForDistrict('master-keys');
    expect(missions.length).toBeGreaterThan(0);
    for (const m of missions) {
      expect(ACCOUNTS[m.accountId].district).toBe('master-keys');
    }
  });

  it('mission IDs are unique', () => {
    const ids = MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
