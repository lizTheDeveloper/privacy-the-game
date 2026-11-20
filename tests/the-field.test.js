// The Field (chapter 13): Field Opsec as an OPT-IN district. It starts off, never
// counts toward the city until a player turns it on, keeps progress when turned off,
// covers every course playbook, and links (shares) rather than repeats what other
// districts already teach.
import { describe, it, expect, beforeEach } from 'vitest';
import { DISTRICTS, OPT_IN_DISTRICTS } from '../src/data/districts.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { MISSIONS, getMissionsForDistrict, missionDistrict } from '../src/data/missions.js';
import { MISSION_LEADS } from '../src/data/mission-leads.js';
import { createInitialState, updateMission, loadState } from '../src/state.js';
import { calcDistrictProgress, calcIntegrity } from '../src/utils/calc.js';
import { isCityComplete } from '../src/utils/ghost.js';
import { isDistrictOn, activeDistricts, setDistrictOn } from '../src/utils/opt-in.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { renderStats } from '../src/screens/stats.js';
import { QUICK_QUESTS } from '../src/data/quests.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const FIELD = DISTRICTS.find((d) => d.id === 'field');
const fieldAccounts = Object.entries(ACCOUNTS).filter(([, a]) => a.district === 'field');
const fieldMissions = () => getMissionsForDistrict('field');
const core = () => fieldMissions().filter((m) => !m.optional && m.phase !== 'survey');

function completeAll(state, missions) {
  let s = state;
  for (const m of missions) s = updateMission(s, m.id, { status: 'completed' });
  return s;
}

// A save that has finished every other district's core path.
function everythingElseDone() {
  const others = MISSIONS.filter((m) => !m.legacy && !m.optional && m.phase !== 'survey' && missionDistrict(m) !== 'field');
  return completeAll(createInitialState(), others);
}

describe('The Field is opt-in', () => {
  it('is a chapter-13 facility district flagged optIn, with nine buildings in order', () => {
    expect(FIELD).toBeTruthy();
    expect(FIELD.chapter).toBe(13);
    expect(FIELD.type).toBe('facility');
    expect(OPT_IN_DISTRICTS.has('field')).toBe(true);
    expect(FIELD.facilityOrder).toEqual(fieldAccounts.map(([id]) => id));
    expect(fieldAccounts).toHaveLength(9);
  });

  it('starts off: no building enabled, no missions in play, zero total', () => {
    const s = createInitialState();
    for (const [id] of fieldAccounts) expect(s.accounts[id].enabled, id).toBe(false);
    expect(isDistrictOn(s, 'field')).toBe(false);
    expect(calcDistrictProgress(s, 'field').total).toBe(0);
    expect(activeDistricts(s).map((d) => d.id)).not.toContain('field');
  });

  it('an existing save gains the buildings switched off', () => {
    const old = createInitialState();
    for (const [id] of fieldAccounts) delete old.accounts[id];
    localStorage.setItem('reclaim-city-state', JSON.stringify(old));
    const s = loadState(localStorage);
    for (const [id] of fieldAccounts) expect(s.accounts[id]?.enabled, id).toBe(false);
  });

  it('off, it never blocks city-complete and never moves integrity', () => {
    const s = everythingElseDone();
    expect(isCityComplete(s)).toBe(true);
    const on = setDistrictOn(s, 'field', true);
    expect(isCityComplete(on)).toBe(false);
    expect(calcIntegrity(on)).toBeLessThan(calcIntegrity(s));
  });

  it('turned on and finished, the city is complete again', () => {
    const on = setDistrictOn(everythingElseDone(), 'field', true);
    const done = completeAll(on, core());
    expect(calcDistrictProgress(done, 'field').percent).toBe(100);
    expect(isCityComplete(done)).toBe(true);
  });

  it('turning it off keeps every record, and back on restores progress', () => {
    const on = setDistrictOn(createInitialState(), 'field', true);
    const some = completeAll(on, core().slice(0, 4));
    const before = calcDistrictProgress(some, 'field');
    const off = setDistrictOn(some, 'field', false);
    expect(calcDistrictProgress(off, 'field').total).toBe(0);
    for (const m of core().slice(0, 4)) expect(off.missions[m.id].status).toBe('completed');
    expect(calcDistrictProgress(setDistrictOn(off, 'field', true), 'field')).toEqual(before);
  });

  it('only opt-in districts can be switched by setDistrictOn', () => {
    const s = createInitialState();
    expect(setDistrictOn(s, 'vault', false)).toBe(s);
  });

  it('the district page shows the opt-in panel when off, the facilities and an off switch when on', () => {
    const off = renderDistrict(createInitialState(), 'field');
    expect(off).toContain('data-action="district-opt-in"');
    expect(off).not.toContain('data-action="district-opt-out"');
    const on = renderDistrict(setDistrictOn(createInitialState(), 'field', true), 'field');
    expect(on).not.toContain('data-action="district-opt-in"');
    expect(on).toContain('data-action="district-opt-out"');
    for (const [, a] of fieldAccounts) expect(on.includes(a.name) || on.includes(a.name.replace("'", '&#39;')), a.name).toBe(true);
  });

  it("the city map counts it only once it's on", () => {
    const n = DISTRICTS.length;
    expect(renderCityMap(createInitialState())).toContain(`DISTRICTS <b>${n - 1}</b>`);
    expect(renderCityMap(setDistrictOn(createInitialState(), 'field', true))).toContain(`DISTRICTS <b>${n}</b>`);
  });

  it('stats call it optional, not locked, while it is off', () => {
    expect(renderStats(createInitialState())).toContain('OPTIONAL · TURN IT ON IN THE DISTRICT');
  });

  it('a Quick Quest leads there, last in the list', () => {
    expect(QUICK_QUESTS.at(-1)).toMatchObject({ id: 'work-target', targetDistrict: 'field' });
  });
});

describe('The Field covers the course', () => {
  it('every building has exactly one core mission per phase', () => {
    for (const [id] of fieldAccounts) {
      const phases = core().filter((m) => m.accountId === id).map((m) => m.phase).sort();
      expect(phases, id).toEqual(['fortify', 'reclaim', 'recon']);
    }
  });

  it('every mission names its source playbooks, from its own building', () => {
    for (const m of fieldMissions()) {
      expect(m.playbooks?.length, m.id).toBeGreaterThan(0);
      for (const p of m.playbooks) expect(ACCOUNTS[m.accountId].playbooks, `${m.id} → ${p}`).toContain(p);
    }
  });

  it('every playbook 01-29 is covered by at least one mission', () => {
    const covered = new Set(fieldMissions().flatMap((m) => m.playbooks));
    const all = Array.from({ length: 29 }, (_, i) => String(i + 1).padStart(2, '0'));
    expect(all.filter((p) => !covered.has(p))).toEqual([]);
  });

  it('every mission has a lead and ids follow <building>-<phase>-<slug>', () => {
    for (const m of fieldMissions()) {
      expect(MISSION_LEADS[m.id], m.id).toBeTruthy();
      expect(m.id.startsWith(`${m.accountId}-${m.phase}-`), m.id).toBe(true);
    }
  });

  it("a core building's path stays a sitting or two (≤ 30 minutes)", () => {
    for (const [id] of fieldAccounts) {
      const mins = core().filter((m) => m.accountId === id).reduce((n, m) => n + m.estimatedMinutes, 0);
      expect(mins, id).toBeLessThanOrEqual(30);
    }
  });
});

describe('The Field shares instead of repeating', () => {
  it('every shared mission exists, is not the mission itself, and is never legacy', () => {
    for (const m of fieldMissions()) {
      for (const id of m.shares || []) {
        const target = MISSIONS.find((x) => x.id === id);
        expect(target, `${m.id} → ${id}`).toBeTruthy();
        expect(id, `${m.id} shares itself`).not.toBe(m.id);
        expect(target.legacy, `${m.id} → ${id}`).toBeFalsy();
      }
    }
  });

  // Shares never point at a mission that contradicts the playbooks (fact-check 2026-11-15):
  // these teach a 6-digit PIN, a recovery key in the controlling account, backup codes in the
  // password manager, "platforms strip EXIF", or a cleaned rather than empty phone.
  it('never shares a mission the Field playbooks call a mistake', () => {
    const banned = ['device_security-fortify-phone', 'device_security-fortify-computer', 'photo_metadata-fortify-strip', 'border_prep-reclaim-travel-device'];
    for (const m of fieldMissions()) for (const id of m.shares || []) {
      expect(banned.includes(id) || /-fortify-2fa-backup$/.test(id), `${m.id} → ${id}`).toBe(false);
    }
  });

  it('a briefing links every shared mission, ticked once done', () => {
    const withShares = fieldMissions().find((m) => (m.shares || []).length);
    if (!withShares) return;
    let s = setDistrictOn(createInitialState(), 'field', true);
    const html = renderBriefing(s, withShares.id);
    for (const id of withShares.shares) expect(html).toContain(`href="#/mission/${id}/briefing"`);
    s = updateMission(s, withShares.shares[0], { status: 'completed' });
    expect(renderBriefing(s, withShares.id)).toContain('&#10003; ');
  });
});
