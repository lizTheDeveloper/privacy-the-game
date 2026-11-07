// UI sweep #4: every mission link a debrief can draw goes to a mission that exists, for
// every account, the player's own (custom) accounts included. A custom account's 2FA
// debrief filed with codes offered "UPGRADE FROM CODES" to a mission that doesn't exist.
import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState } from '../src/state.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { MISSIONS } from '../src/data/missions.js';
import { DISTRICTS } from '../src/data/districts.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { customMissionsFor, findMission } from '../src/data/custom-missions.js';
import { CODE_METHODS } from '../src/utils/two-factor.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

function playerWithEverything() {
  const s = createInitialState();
  for (const id of Object.keys(ACCOUNTS)) s.accounts[id] = { ...(s.accounts[id] || {}), enabled: true };
  s.customAccounts = Object.fromEntries(DISTRICTS.map((d) => [d.id, ['Acme Credit Union']]));
  return s;
}

// Records that file each mission: every option of every question, one at a time, plus
// each code method on the two-factor question (the upgrade offer).
function recordsFor(mission) {
  const out = [{ status: 'completed' }];
  for (const q of mission.debriefQs || []) {
    for (const o of q.options || []) out.push({ status: 'completed', [q.id]: o.value });
    if (q.kind === 'two-factor' || q.id === 'method') for (const m of CODE_METHODS) out.push({ status: 'completed', method: m });
  }
  return out;
}

const missionLinks = (html) => [...html.matchAll(/href="#\/mission\/([^/"]+)\/(briefing|debrief|recheck)"/g)].map((m) => m[1]);

describe('debrief mission links resolve', () => {
  it('for every built-in and custom mission, every answer', () => {
    const base = playerWithEverything();
    const missions = [
      ...MISSIONS.filter((m) => !m.legacy),
      ...DISTRICTS.flatMap((d) => customMissionsFor(base, d.id)),
    ];
    expect(missions.some((m) => m.custom)).toBe(true);
    const broken = new Set();
    let checked = 0;
    for (const mission of missions) {
      for (const record of recordsFor(mission)) {
        const s = structuredClone(base);
        s.missions[mission.id] = record;
        for (const html of [renderDebrief(s, mission.id), renderDebrief(s, mission.id, { recheck: true })]) {
          for (const id of missionLinks(html)) {
            checked++;
            if (!findMission(s, id)) broken.add(`${mission.id} → ${id}`);
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect([...broken]).toEqual([]);
  });

  it('a custom account filed with SMS codes gets no upgrade link; a built-in one does', () => {
    const s = playerWithEverything();
    const custom = customMissionsFor(s, 'vault').find((m) => m.debriefQs.some((q) => q.kind === 'two-factor'));
    s.missions[custom.id] = { status: 'completed', method: 'sms' };
    expect(renderDebrief(s, custom.id)).not.toContain('UPGRADE FROM CODES');
    const builtIn = MISSIONS.find((m) => m.id === 'gmail-fortify-2fa');
    s.missions[builtIn.id] = { status: 'completed', method: 'sms' };
    expect(renderDebrief(s, builtIn.id)).toContain('href="#/mission/gmail-fortify-2fa-upgrade/briefing"');
  });
});
