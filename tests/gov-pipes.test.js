// Every leak entry names its pipe in the data (logic sweep #5). The government
// map used to guess from substrings of the id: "sharing" matched /ring/, eight
// overrides named ids that don't exist, and ten entries fell to the default.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LEAKS, GOV_DATA, AGENCIES } from '../src/data/leaks/index.js';
import { buildGovGraph, pipeOf, PIPES } from '../src/utils/gov-graph.js';
import { renderGovernment } from '../src/screens/government.js';
import { createInitialState } from '../src/state.js';

const PIPE_IDS = PIPES.map((p) => p.id);
const byId = (id) => LEAKS.find((e) => e.id === id);

describe('pipes come from the data', () => {
  it('every entry has a pipe of its own, and it is a real one', () => {
    for (const e of LEAKS) {
      expect(Object.hasOwn(e, 'pipe'), e.id).toBe(true);
      expect(PIPE_IDS, e.id).toContain(e.pipe);
      expect(pipeOf(e), e.id).toBe(e.pipe);
    }
  });

  it('nothing is guessed: an entry without a pipe goes nowhere', () => {
    expect(pipeOf({ id: 'tesla-camera-sharing-x', leak: 'snowden' })).toBeNull();
    expect(pipeOf({ id: 'ring', pipe: 'p-nope' })).toBeNull();
    const src = readFileSync(new URL('../src/utils/gov-graph.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/KEYWORDS|PIPE_BY_ID|BY_LEAK/);
    const g = buildGovGraph({ ...GOV_DATA, entries: [...LEAKS, { id: 'stray' }] });
    expect(Object.values(g.entriesByPipe).flat().map((e) => e.id)).not.toContain('stray');
  });

  it('every entry is on file in exactly one pipe on the map', () => {
    const g = buildGovGraph(GOV_DATA);
    const filed = Object.values(g.entriesByPipe).flat().map((e) => e.id);
    expect(filed.sort()).toEqual(LEAKS.map((e) => e.id).sort());
  });

  it('the entries the audit found misfiled are where their own summaries put them', () => {
    const want = {
      'verizon-215': 'p-phone', // a Section 215 call-records order
      turbine: 'p-hacking', // "automates the NSA's hacking"
      'quantum-linkedin': 'p-hacking', // malware served through fake LinkedIn pages
      'smartphone-hacking': 'p-hacking',
      'ant-catalog': 'p-hacking',
      'router-interdiction': 'p-hacking',
      'gemalto-sim-heist': 'p-hacking', // "hacked Gemalto"
      'address-books': 'p-cables', // intercepted "as they cross global data links"
      'co-traveler': 'p-phone', // cellphone location from the mobile networks' cables
      dishfire: 'p-phone', // text messages
      'hepting-v-att': 'p-cables', // beam splitters on AT&T's backbone fibre
      'ftc-mobilewalla': 'p-buying',
      'ftc-inmarket': 'p-buying',
      'geofence-warrants': 'p-orders', // a warrant served on Google
      'tesla-camera-sharing': 'p-kept', // Tesla staff; no police
      'alexa-kids-recordings': 'p-kept',
      'ring-employee-access': 'p-kept',
    };
    for (const [id, pipe] of Object.entries(want)) expect(byId(id)?.pipe, id).toBe(pipe);
  });

  it('the pipe of company staff and storage names who, and feeds no agency', () => {
    const kept = PIPES.find((p) => p.id === 'p-kept');
    expect(kept.note).toMatch(/Ring/);
    expect(kept.note).toMatch(/Tesla/);
    expect(kept.note).toMatch(/Amazon/);
    const g = buildGovGraph(GOV_DATA);
    const agencies = new Set(AGENCIES.map((a) => a.id));
    expect(g.edges.filter((e) => e.from === 'p-kept' && agencies.has(e.to))).toEqual([]);
    const h = renderGovernment(createInitialState(), GOV_DATA, { selected: 'p-kept' });
    expect(h).toContain('3 ON FILE');
    for (const id of ['tesla-camera-sharing', 'alexa-kids-recordings', 'ring-employee-access']) expect(h).toContain(`#/leak/${id}`);
  });
});
