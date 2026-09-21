import { describe, it, expect } from 'vitest';
import { getAccountPhaseGate } from '../src/utils/calc.js';
import { renderDistrict } from '../src/screens/district.js';
import { getMissionsForDistrict } from '../src/data/missions.js';
import { createInitialState, updateMission } from '../src/state.js';

function completeMission(state, id) {
  return updateMission(state, id, { status: 'completed' });
}

function yahooReconIds(state) {
  return getMissionsForDistrict('master-keys')
    .filter((m) => m.phase === 'recon' && m.accountId === 'yahoo')
    .map((m) => m.id);
}

describe('getAccountPhaseGate (per-account progression)', () => {
  it('locks an account whose core prereq-phase missions are incomplete', () => {
    const state = createInitialState();
    const gate = getAccountPhaseGate(state, 'master-keys', 'yahoo', 'recon');
    expect(gate.total).toBe(1);
    expect(gate.remaining).toBe(1);
    expect(gate.unlocked).toBe(false);
  });

  it('ignores optional bonus missions when computing the prereq gate', () => {
    let state = createInitialState();
    state = completeMission(state, 'yahoo-recon-breach');
    expect(getAccountPhaseGate(state, 'master-keys', 'yahoo', 'recon').unlocked).toBe(true);
    expect(getAccountPhaseGate(state, 'master-keys', 'yahoo', 'recon').total).toBe(1);
  });

  it('unlocks only the account whose own prereq missions are all completed', () => {
    let state = createInitialState();
    for (const id of yahooReconIds(state)) state = completeMission(state, id);
    expect(getAccountPhaseGate(state, 'master-keys', 'yahoo', 'recon').unlocked).toBe(true);
    expect(getAccountPhaseGate(state, 'master-keys', 'gmail', 'recon').unlocked).toBe(false);
  });

  it('treats an account with no prereq missions as unlocked', () => {
    const state = createInitialState();
    const gate = getAccountPhaseGate(state, 'master-keys', 'yahoo', 'survey');
    expect(gate.total).toBe(0);
    expect(gate.unlocked).toBe(true);
  });
});

describe('district fortify tab (MUL-37 repro)', () => {
  it('shows fortify missions for a fully-reconed account while other accounts stay locked', () => {
    let state = createInitialState();
    for (const id of yahooReconIds(state)) state = completeMission(state, id);
    const html = renderDistrict(state, 'master-keys', 'fortify');
    expect(html).toContain('#/mission/yahoo-fortify-password/briefing');
    expect(html).toContain('Complete RECON for Gmail first');
    expect(html).not.toContain('before moving to');
  });

  it('locks each account individually when no recon is done', () => {
    const state = createInitialState();
    const html = renderDistrict(state, 'master-keys', 'fortify');
    expect(html).not.toContain('#/mission/yahoo-fortify-password/briefing');
    expect(html).toContain('Complete RECON for Gmail first');
    expect(html).toContain('Complete RECON for Yahoo Mail first');
  });
});
