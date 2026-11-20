import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('../../src/utils/analytics.js', () => ({
  track: vi.fn(), trackNow: vi.fn(), trackPageview: vi.fn(), trackThenStop: vi.fn(), waitForTracker: vi.fn(),
}));
import * as analytics from '../../src/utils/analytics.js';
import { MISSIONS } from '../../src/data/missions.js';
import { BROKER_CHECKLISTS } from '../../src/data/broker-checklists.js';
import { createInitialState } from '../../src/state.js';
import { renderDebrief } from '../../src/screens/debrief.js';
import { renderDistrict } from '../../src/screens/district.js';
import { applyRecheck, missionEventData, recheckWithChecklist } from '../../src/utils/debrief.js';
import { materializeLegacy, recordChecklist, dayOf } from '../../src/utils/broker-state.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { pageviewUrl } from '../../src/utils/pageview-url.js';
import { parseRoute } from '../../src/router.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  vi.clearAllMocks();
});

const WEB = 'people_search-fortify-web-forms';
const EQ = 'credit_freeze-fortify-equifax';
const AT = '2026-03-01T12:00:00.000Z';
const AT_DAY = dayOf(AT);
const T = '2026-10-19';
const web = MISSIONS.find((m) => m.id === WEB);

const mini = JSON.parse(readFileSync('tests/fixtures/broker-map-mini.json', 'utf8'));
const miniIds = new Set(mini.brokers.map((b) => b.id));
const cl = Object.fromEntries(Object.entries(BROKER_CHECKLISTS).map(([m, lines]) => [
  m, lines.map((l) => (l.brokers ? { ...l, brokers: l.brokers.filter((b) => miniIds.has(b)) } : l)),
]));
const light = (s) => brokerLighting(mini, s, T, cl);
// Each star's state and date. via is provenance: materializeLegacy turns a
// legacy "all" into dated checklist lines on purpose.
const lit = (l) => Object.fromEntries(Object.entries(l.stars).map(([id, st]) => [id, [st.state, st.litOn]]));

const withMission = (id, rec) => {
  const s = createInitialState();
  s.missions = { ...s.missions, [id]: rec };
  return s;
};
const legacy = (answer) => withMission(WEB, { status: 'completed', optout_result: answer, completedAt: AT });
const count = (html, s) => html.split(s).length - 1;

// What submitRecheck does for a checklist mission.
const recheck = (s, answer, ticks, day = T) => recheckWithChecklist(s, web, { optout_result: answer }, ticks, day);

describe('broker re-check', () => {
  it('a re-check of a legacy all filing shows each line\'s date', () => {
    const html = renderDebrief(legacy('all-submitted'), WEB, { recheck: true });
    expect(html).toContain(`data-broker-checklist="${WEB}" data-mode="recheck"`);
    expect(html).toContain('FILED AGAIN?');
    expect(count(html, `Last filed ${AT_DAY}`)).toBe(3);
    expect(html).toContain('data-action="submit-recheck"');
    expect(html).toContain('SAVE RE-CHECK');
    expect(html).not.toMatch(/name="filed"[^>]*checked/);
    expect(html).not.toContain('WHICH OF THESE DID YOU FILE?');
  });

  it('a re-check of a legacy some-submitted filing asks Scout\'s question', () => {
    const html = renderDebrief(legacy('some-submitted'), WEB, { recheck: true });
    expect(html).toContain('TELL SCOUT WHICH ONES YOU FILED');
    expect(count(html, 'Not recorded yet')).toBe(3);
    expect(html).toContain('Only this browser keeps this. It\'s what lights stars in the sky above the city, and it\'s never sent anywhere.');
  });

  it('the open debrief has no recheck panel', () => {
    expect(renderDebrief(createInitialState(), WEB)).not.toContain('data-mode="recheck"');
  });

  it('a re-check with ticks dates only the ticked lines', () => {
    const base = materializeLegacy(legacy('all-submitted'), WEB);
    const next = recordChecklist(applyRecheck(base, web, { optout_result: 'all-submitted' }), WEB, ['spokeo'], T);
    const l = light(next);
    expect(l.stars.spokeo.litOn).toBe(T);
    expect(l.stars.whitepages.litOn).toBe(AT_DAY);
    expect(l.stars.beenverified.litOn).toBe(AT_DAY);
    expect(light(recheck(legacy('all-submitted'), 'all-submitted', ['spokeo']))).toEqual(l);
  });

  it('a re-check that changes the answer and ticks nothing leaves every star as it was', () => {
    const before = light(legacy('all-submitted'));
    const after = light(recheck(legacy('all-submitted'), 'some-submitted', []));
    expect(lit(after)).toEqual(lit(before));
    expect(after.pending).toEqual([]);
    expect(after.stars.spokeo.litOn).toBe(AT_DAY);
  });

  it('a legacy some filing re-checked to all with no ticks lights nothing new', () => {
    const s = legacy('some-submitted');
    const before = light(s);
    const next = recheck(s, 'all-submitted', []);
    expect(next.missions[WEB].optout_result).toBe('all-submitted');
    expect(next.brokerFiled[WEB].since).toBe(T);
    const after = light(next);
    expect(after.stars).toEqual(before.stars);
    expect(after.pending).toEqual(before.pending);
  });

  it('a re-check that would un-file it saves nothing', () => {
    expect(recheck(legacy('all-submitted'), 'skip', ['spokeo'])).toBe(null);
  });

  it('a re-check keeps the mission completed with its completedAt and sends nothing', () => {
    const s = legacy('all-submitted');
    const eventBefore = missionEventData(web, s.missions[WEB]);
    const next = recheck(s, 'some-submitted', ['spokeo']);
    expect(next.missions[WEB].status).toBe('completed');
    expect(next.missions[WEB].completedAt).toBe(AT);
    expect(next.missions[WEB].rechecked).toBeTruthy();
    expect(missionEventData(web, s.missions[WEB])).toEqual(eventBefore);
    expect(analytics.track).not.toHaveBeenCalled();
    expect(analytics.trackNow).not.toHaveBeenCalled();
  });

  it('the completed debrief links RE-CHECK', () => {
    const html = renderDebrief(legacy('all-submitted'), WEB);
    expect(html).toContain(`href="#/mission/${WEB}/recheck"`);
    expect(html).toContain('>RE-CHECK<');
    expect(html).not.toContain('Tell Scout which ones you filed.');
    expect(renderDebrief(legacy('some-submitted'), WEB)).toContain('Tell Scout which ones you filed.');
  });

  it('nothing says FILE AGAIN and there is no refile-brokers action', () => {
    const files = [];
    const walk = (dir) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.js')) files.push(p);
      }
    };
    walk('src');
    expect(files.length).toBeGreaterThan(10);
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toContain('FILE AGAIN');
      expect(text, f).not.toContain('refile-brokers');
    }
  });

  it('the district offers RE-CHECK only on done checklist missions', () => {
    const done = renderDistrict(legacy('all-submitted'), 'reclamation');
    expect(done).toContain(`href="#/mission/${WEB}/recheck"`);
    expect(renderDistrict(createInitialState(), 'reclamation')).not.toContain(`href="#/mission/${WEB}/recheck"`);
    const eq = renderDistrict(withMission(EQ, { status: 'completed', completedAt: AT }), 'reclamation');
    expect(eq).not.toContain(`#/mission/${EQ}/recheck`);
  });

  it('the re-check route stays private', () => {
    const href = 'https://x.test/reclaim-city/#/mission/people_search-fortify-web-forms/recheck';
    expect(pageviewUrl(parseRoute('#/mission/people_search-fortify-web-forms/recheck'), href)).toBe('https://x.test/reclaim-city/#/mission/recheck');
  });
});
