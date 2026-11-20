import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';
import { createInitialState } from '../../src/state.js';
import { calcDistrictProgress } from '../../src/utils/calc.js';
import { renderDebrief } from '../../src/screens/debrief.js';
import { fileDebrief, missionEventData } from '../../src/utils/debrief.js';
import { renderBrokerChecklist, checklistTicksFor } from '../../src/components/broker-checklist.js';
import { applyChecklistFiling } from '../../src/utils/broker-state.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const WEB = 'people_search-fortify-web-forms';
const lineIds = (html) => [...html.matchAll(/name="filed" value="([^"]+)"/g)].map((m) => m[1]);

describe('broker debrief checklist', () => {
  it('an open broker debrief lists one tick box per line', () => {
    const html = renderDebrief(createInitialState(), WEB);
    expect(lineIds(html)).toEqual(['spokeo', 'whitepages', 'beenverified']);
    expect(html).toContain(`data-broker-checklist="${WEB}"`);
    expect(html).toContain('WHICH OF THESE DID YOU FILE?');
    expect(html).toContain('Only this browser keeps this. It\'s what lights stars in the sky above the city, and it\'s never sent anywhere.');
    expect(html).not.toMatch(/name="filed"[^>]*checked/);
  });

  it('DROP is its own line with its hint', () => {
    const html = renderDebrief(createInitialState(), 'location_brokers-reclaim-legal');
    expect(lineIds(html)).toEqual(['drop']);
    expect(html).toContain('California residents only.');
  });

  it('a mission with no checklist renders none', () => {
    for (const id of ['credit_freeze-fortify-equifax', 'ad_trackers-fortify-platforms']) {
      expect(renderDebrief(createInitialState(), id)).not.toContain('data-broker-checklist');
    }
    expect(renderBrokerChecklist({ id: 'credit_freeze-fortify-equifax' }, createInitialState(), 'file')).toBe('');
  });

  it('the re-check form carries no file-mode checklist', () => {
    const s = { ...createInitialState(), missions: { [WEB]: { status: 'completed', optout_result: 'all-submitted', completedAt: '2026-10-01T12:00:00.000Z' } } };
    const html = renderDebrief(s, WEB, { recheck: true });
    expect(html).not.toContain('WHICH OF THESE DID YOU FILE?');
    expect(html).not.toMatch(/data-broker-checklist="[^"]+"(?! data-mode="recheck")/);
  });

  it('checklistTicksFor', () => {
    expect(checklistTicksFor('optout_result', 'all-submitted')).toBe('all');
    expect(checklistTicksFor('optout_result', 'some-submitted')).toBe(null);
    expect(checklistTicksFor('optout_result', 'skip')).toBe('none');
    expect(checklistTicksFor('defense_done', 'already-done')).toBe('all');
    expect(checklistTicksFor('other', 'all-submitted')).toBe(null);
  });

  it('a completed filing records the ticked lines with since', () => {
    const s = createInitialState();
    const out = applyChecklistFiling(s, WEB, 'completed', ['spokeo', 'whitepages'], '2026-10-23');
    expect(out.brokerFiled[WEB]).toEqual({ lines: { spokeo: '2026-10-23', whitepages: '2026-10-23' }, since: '2026-10-23' });
  });

  it('a skipped filing records no lines', () => {
    const s = createInitialState();
    expect(applyChecklistFiling(s, WEB, 'skipped', ['spokeo'], '2026-10-23')).toBe(s);
  });

  it('the checklist never reaches the mission record or its event', () => {
    const mission = MISSIONS.find((m) => m.id === WEB);
    const filed = fileDebrief(createInitialState(), mission, { optout_result: 'some-submitted' });
    const next = applyChecklistFiling(filed.state, WEB, filed.event.status, ['spokeo'], '2026-10-23');
    expect(Object.keys(next.missions[WEB])).not.toContain('filed');
    expect(Object.keys(next.missions[WEB])).not.toContain('lines');
    expect(JSON.stringify(next.missions[WEB])).not.toContain('spokeo');
    expect(JSON.stringify(missionEventData(mission, next.missions[WEB]))).not.toContain('spokeo');
  });

  it('district progress is the same with and without brokerFiled', () => {
    const mission = MISSIONS.find((m) => m.id === WEB);
    const filed = fileDebrief(createInitialState(), mission, { optout_result: 'some-submitted' });
    const next = applyChecklistFiling(filed.state, WEB, filed.event.status, ['spokeo'], '2026-10-23');
    expect(calcDistrictProgress(next, 'reclamation')).toEqual(calcDistrictProgress(filed.state, 'reclamation'));
  });
});

describe('site-only lines', () => {
  it("say the site doesn't have its own star", async () => {
    const { BROKER_CHECKLISTS } = await import('../../src/data/broker-checklists.js');
    const { renderBrokerChecklist } = await import('../../src/components/broker-checklist.js');
    const { MISSIONS } = await import('../../src/data/missions.js');
    let seen = 0;
    for (const [mid, lines] of Object.entries(BROKER_CHECKLISTS)) {
      const html = renderBrokerChecklist(MISSIONS.find((m) => m.id === mid) ?? { id: mid }, {}, 'file');
      const siteOnly = lines.filter((l) => l.notLit && !l.brokers).length;
      seen += siteOnly;
      expect((html.match(/This site doesn't have its own star\./g) ?? []).length).toBe(siteOnly);
    }
    expect(seen).toBeGreaterThan(0);
  });
});
