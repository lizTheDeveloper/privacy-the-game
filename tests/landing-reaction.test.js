import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { debriefReaction } from '../src/screens/debrief.js';
import { renderDistrict } from '../src/screens/district.js';
import { MISSIONS } from '../src/data/missions.js';
import { createInitialState } from '../src/state.js';

const BREACH = MISSIONS.find((m) => m.id === 'gmail-recon-breach');

function filed(record) {
  const s = createInitialState();
  s.accounts.gmail = { enabled: true };
  s.missions[BREACH.id] = record;
  return s;
}

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

describe('debriefReaction', () => {
  it('is null until the report is filed as completed', () => {
    expect(debriefReaction(filed({}), BREACH)).toBeNull();
    expect(debriefReaction(filed({ status: 'skipped' }), BREACH)).toBeNull();
  });

  it('carries the line and the feeling the debrief shows', () => {
    const r = debriefReaction(filed({ status: 'completed', finding: '3plus-breaches', password_exposed: 'yes' }), BREACH);
    expect(r.feeling).toBe('worried');
    expect(typeof r.line).toBe('string');
    expect(r.line.length).toBeGreaterThan(10);
  });

  it('a clean check makes Scout happy', () => {
    expect(debriefReaction(filed({ status: 'completed', finding: 'no-breaches' }), BREACH).feeling).toBe('happy');
  });
});

describe('the landing district shows the reaction', () => {
  it('renders the line at the top when passed, and nothing when not', () => {
    const s = filed({ status: 'completed', finding: 'no-breaches' });
    const reaction = { line: 'Clean record, agent.', feeling: 'happy', progressLine: '' };
    const withIt = renderDistrict(s, 'master-keys', 'recon', { reaction });
    expect(withIt).toContain('data-scout-reaction');
    expect(withIt).toContain('Clean record, agent.');
    expect(renderDistrict(s, 'master-keys', 'recon')).not.toContain('data-scout-reaction');
  });
});

describe('app wiring', () => {
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  it('picks the reaction before the progress check-in is marked seen, and only for the district landing', () => {
    const fn = src.slice(src.indexOf('function afterMissionRecorded('));
    expect(fn.indexOf('debriefReaction(state, mission)')).toBeLessThan(fn.indexOf('seenProgress[districtId].push'));
    expect(fn).toMatch(/landingReaction = reaction \? \{ districtId, reaction, landed: false \} : null;\n\s+\/\/[^\n]*\n\s+if \(reaction\?\.feeling === 'hug'\)/);
  });
});
