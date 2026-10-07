// Recon campaign, phase 1 reviewer fixes: Scout's own line through every
// answered question, and the car insurance line.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS } from '../src/data/missions.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { debriefReaction } from '../src/screens/debrief.js';
import { createInitialState } from '../src/state.js';

const byId = (id) => MISSIONS.find((m) => m.id === id);
beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

function filed(m, record) {
  const s = createInitialState();
  s.accounts[m.accountId] = { enabled: true };
  s.missions[m.id] = { status: 'completed', ...record };
  return s;
}

describe("Scout's own line, through every answered question", () => {
  it('people_search-recon-find-yourself "found-some" shows its own line', () => {
    const m = byId('people_search-recon-find-yourself');
    const line = debriefReaction(filed(m, { broker_recon: 'found-some' }), m).line;
    expect(line).toBe(m.scoutDialog.debrief['found-some']);
    expect(line).toMatch(/^"Some exposure/);
  });

  it('every mission line keyed by an answer is what Scout says for that answer', () => {
    const wrong = [];
    let checked = 0;
    for (const m of MISSIONS) {
      const lines = m.scoutDialog?.debrief;
      if (!lines || m.debriefQs.some((q) => q.kind === 'two-factor')) continue;
      for (const [value, own] of Object.entries(lines)) {
        const q = m.debriefQs.find((x) => x.options?.some((o) => o.value === value));
        if (!q) continue;
        checked += 1;
        const line = debriefReaction(filed(m, { [q.id]: value }), m).line;
        if (line !== own) wrong.push(`${m.id} / ${q.id}=${value}`);
      }
    }
    expect(checked).toBeGreaterThan(300);
    expect(wrong).toEqual([]);
  });

  it('finding wins over another answered question', () => {
    const m = byId('gmail-recon-breach');
    const line = debriefReaction(filed(m, { finding: '3plus-breaches', password_exposed: 'yes' }), m).line;
    expect(line).toBe(m.scoutDialog.debrief['3plus-breaches']);
  });
});

describe('car insurance scan', () => {
  it('the no-sharing line says only what the check shows, for all six makes', () => {
    const scans = MISSIONS.filter((m) => m.id.endsWith('-recon-insurance'));
    expect(scans).toHaveLength(6);
    for (const m of scans) {
      const name = ACCOUNTS[m.accountId].name;
      expect(m.scoutDialog.debrief['no-sharing']).toBe(`"Insurance sharing is off. ${name} isn't sending new driving data to insurers through this program."`);
    }
  });
});
