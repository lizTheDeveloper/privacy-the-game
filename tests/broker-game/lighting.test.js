import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { BROKER_CHECKLISTS } from '../../src/data/broker-checklists.js';
import { dayOf, materializeLegacy, recordChecklist } from '../../src/utils/broker-state.js';
import {
  RECHECK_DAYS, isBuyer, lineDates, isChecklistPending, brokerLighting, fieldCoverage, fieldHeader,
} from '../../src/utils/broker-lighting.js';

const mini = JSON.parse(readFileSync('tests/fixtures/broker-map-mini.json', 'utf8'));
const realMap = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const miniIds = new Set(mini.brokers.map((b) => b.id));

// The real checklists, with each line's brokers restricted to the fixture's ids.
const cl = Object.fromEntries(Object.entries(BROKER_CHECKLISTS).map(([m, lines]) => [
  m, lines.map((l) => (l.brokers ? { ...l, brokers: l.brokers.filter((b) => miniIds.has(b)) } : l)),
]));

const T = '2026-10-19';
const WF = 'people_search-fortify-web-forms';
const STRAG = 'people_search-reclaim-stragglers';
const AT = '2026-03-01T12:00:00.000Z';
const AT_DAY = dayOf(AT);
const filed = (missionId, lines, since) => ({ [missionId]: since ? { lines, since } : { lines } });
const light = (state, today = T) => brokerLighting(mini, state, today, cl);
const stateOf = (l, id) => l.stars[id].state;
const litIds = (l) => Object.keys(l.stars).filter((id) => l.stars[id].state === 'lit' || l.stars[id].state === 'amber').sort();
const legacyAll = { missions: { [WF]: { status: 'completed', optout_result: 'all-submitted', completedAt: AT } } };
const dropState = (caResident, day = '2026-10-01') => ({
  brokerFiled: filed(STRAG, { drop: day }),
  ...(caResident === undefined ? {} : { caResident }),
});

describe('broker lighting', () => {
  it('RECHECK_DAYS', () => expect(RECHECK_DAYS).toBe(90));
  it('isBuyer', () => {
    expect(isBuyer({ kind: ['buyer'] })).toBe(true);
    expect(isBuyer({ kind: ['marketing'] })).toBe(false);
    expect(isBuyer({})).toBe(false);
  });

  it('nothing filed: every star dim, nope is no-opt-out, 0%', () => {
    const l = brokerLighting(mini, {}, '2026-10-19', cl);
    expect(l.stars.spokeo.state).toBe('dim'); expect(l.stars.nope.state).toBe('no-opt-out');
    expect(fieldCoverage(mini, l)).toEqual({ percent: 0, anyLit: false, hubsLit: 0, hubsTotal: 1 });
    expect(l).toMatchObject({ frozen: [], halo: [], pending: [], drop: 'off' });
    expect(l.stars.spokeo).toEqual({ state: 'dim', litOn: null, via: [] });
  });

  it('checklist lights exactly the ticked brokers', () => {
    const l = light({ brokerFiled: filed(WF, { spokeo: '2026-10-01' }, '2026-10-01') });
    expect(l.stars.spokeo).toEqual({ state: 'lit', litOn: '2026-10-01', via: ['checklist'] });
    expect(litIds(l)).toEqual(['spokeo']);
    expect(stateOf(l, 'whitepages')).toBe('dim');
  });

  it('legacy all submitted lights every broker the mission covers', () => {
    const l = light(legacyAll);
    // People-search, filed in March: lit, and re-check-due (amber) by October.
    for (const id of ['spokeo', 'whitepages', 'beenverified']) expect(l.stars[id], id).toEqual({ state: 'amber', litOn: AT_DAY, via: ['legacy'] });
    expect(stateOf(light(legacyAll, '2026-03-02'), 'whitepages')).toBe('lit');
    expect(litIds(l)).toEqual(['beenverified', 'spokeo', 'whitepages']);
    expect(l.pending).toEqual([]);
  });

  it('legacy defense done counts as all', () => {
    const M = 'enterprise_data-fortify-lexisnexis';
    const l = light({ missions: { [M]: { status: 'completed', defense_done: 'done', completedAt: AT } } });
    expect(l.stars['lexisnexis-risk-solutions']).toEqual({ state: 'lit', litOn: AT_DAY, via: ['legacy'] });
    const k = light({ missions: { [M]: { status: 'completed', defense_done: 'already-done', completedAt: AT } } });
    expect(stateOf(k, 'lexisnexis-risk-solutions')).toBe('lit');
  });

  it('legacy some submitted lights nothing and is pending', () => {
    const s = { missions: { [WF]: { status: 'completed', optout_result: 'some-submitted', completedAt: AT } } };
    const l = light(s);
    expect(litIds(l)).toEqual([]);
    expect(l.pending).toEqual(['people_search-fortify-web-forms']);
    expect(isChecklistPending(s, WF, cl)).toBe(true);
    expect(lineDates(s, WF, cl)).toEqual({});
  });

  it('filling in the checklist clears pending', () => {
    let s = { missions: { [WF]: { status: 'completed', optout_result: 'some-submitted', completedAt: AT } } };
    s = recordChecklist(s, WF, ['whitepages'], '2026-10-19');
    const l = light(s);
    expect(l.pending).toEqual([]);
    expect(litIds(l)).toEqual(['whitepages']);
    expect(isChecklistPending(s, WF, cl)).toBe(false);
  });

  it('an incomplete mission or one with no checklist is never pending', () => {
    expect(isChecklistPending({ missions: { [WF]: { status: 'in_progress' } } }, WF, cl)).toBe(false);
    expect(isChecklistPending({ missions: { 'credit_freeze-fortify-equifax': { status: 'completed' } } }, 'credit_freeze-fortify-equifax', cl)).toBe(false);
    expect(isChecklistPending({}, 'nope', cl)).toBe(false);
  });

  it('a new filing ignores its all-submitted answer', () => {
    const s = { ...legacyAll, brokerFiled: filed(WF, { spokeo: '2026-10-19' }, '2026-10-19') };
    const l = light(s);
    expect(litIds(l)).toEqual(['spokeo']);
    expect(stateOf(l, 'whitepages')).toBe('dim');
    expect(lineDates(s, WF, cl)).toEqual({ spokeo: '2026-10-19' });
  });

  it('legacy all, then a partial re-check, keeps the rest lit', () => {
    let s = materializeLegacy(legacyAll, WF);
    s = recordChecklist(s, WF, ['spokeo'], '2026-10-19');
    const l = light(s);
    expect(l.stars.spokeo).toMatchObject({ state: 'lit', litOn: '2026-10-19' });
    expect(l.stars.whitepages).toMatchObject({ state: 'amber', litOn: AT_DAY });
    expect(l.stars.beenverified).toMatchObject({ state: 'amber', litOn: AT_DAY });
  });

  it('legacy all with a re-check that never materialized keeps the rest lit too', () => {
    const s = { ...legacyAll, brokerFiled: filed(WF, { spokeo: '2026-10-19' }) };
    const l = light(s);
    expect(l.stars.spokeo).toEqual({ state: 'lit', litOn: '2026-10-19', via: ['checklist'] });
    expect(l.stars.whitepages).toEqual({ state: 'amber', litOn: AT_DAY, via: ['legacy'] });
  });

  it('a materialized legacy filing lights the same stars on the same days', () => {
    // `via` says where a date came from (legacy before, checklist after), so
    // the comparison is of what the map draws: state and litOn.
    const view = (l) => Object.fromEntries(Object.entries(l.stars).map(([id, s]) => [id, { state: s.state, litOn: s.litOn }]));
    const before = light(legacyAll);
    const after = light(materializeLegacy(legacyAll, WF));
    expect(view(after)).toEqual(view(before));
    expect(after.pending).toEqual(before.pending);
  });

  it('DROP with residency yes lights CA-registered brokers only', () => {
    const l = light(dropState('yes'));
    expect(l.drop).toBe('lit');
    for (const id of ['spokeo', 'acxiom', 'equifax-information-services', 'hub-a', 'tail-1']) expect(l.stars[id], id).toEqual({ state: 'lit', litOn: '2026-10-01', via: ['drop'] });
    expect(litIds(l)).toEqual(['acxiom', 'equifax-information-services', 'hub-a', 'spokeo', 'tail-1']);
    expect(stateOf(l, 'nope')).toBe('no-opt-out');
    expect(stateOf(l, 'whitepages')).toBe('dim');
    expect(stateOf(l, 'us-ice')).toBe('dim');
  });

  it('DROP filed in the location mission counts too', () => {
    const l = light({ brokerFiled: filed('location_brokers-reclaim-legal', { drop: '2026-10-01' }), caResident: 'yes' });
    expect(l.drop).toBe('lit');
    expect(stateOf(l, 'tail-1')).toBe('lit');
  });

  it.each([['no'], ['unsaid']])('DROP with residency %s lights nothing', (r) => {
    const l = light(dropState(r));
    expect(litIds(l)).toEqual([]);
    expect(l.drop).toBe('not-resident');
  });

  it('DROP with residency unanswered lights nothing and asks', () => {
    const l = light(dropState(undefined));
    expect(litIds(l)).toEqual([]);
    expect(l.drop).toBe('ask');
    expect(light({ caResident: 'yes' }).drop).toBe('off');
  });

  it('a site-only line is dated but lights nothing', () => {
    const P = 'people_search-fortify-privacy-portals';
    const s = { brokerFiled: filed(P, { usphonebook: '2026-10-01' }, '2026-10-01') };
    expect(lineDates(s, P, cl)).toEqual({ usphonebook: '2026-10-01' });
    const l = light(s);
    expect(l.stars.intelius).toBeUndefined();
    for (const [id, star] of Object.entries(l.stars)) expect(star.state, id).toBe(id === 'nope' ? 'no-opt-out' : 'dim');
    // The real map: the usphonebook line never lights its operator's record either.
    const r = brokerLighting(realMap, s, T);
    expect(r.stars['mississippi-tornado-alley'].state).toBe('dim');
    expect(brokerLighting(realMap, { brokerFiled: filed(P, { thatsthem: T, peoplefinder: T }) }, T).stars.spokeo.state).toBe('dim');
    expect(brokerLighting(realMap, { brokerFiled: filed(P, { peoplefinder: T }) }, T).stars.intelius.state).toBe('dim');
  });

  it('people-search turns amber at 90 days, not 89', () => {
    const s = { brokerFiled: filed(WF, { spokeo: '2026-07-01' }) };
    expect(stateOf(light(s, '2026-09-28'), 'spokeo')).toBe('lit');
    expect(stateOf(light(s, '2026-09-29'), 'spokeo')).toBe('amber');
    expect(light(s, '2026-09-29').stars.spokeo).toEqual({ state: 'amber', litOn: '2026-07-01', via: ['checklist'] });
  });

  it('non-people-search never goes amber', () => {
    const l = light({ brokerFiled: filed('ad_trackers-reclaim-individual', { acxiom: '2026-01-01' }) });
    expect(stateOf(l, 'acxiom')).toBe('lit');
  });

  it('a DROP-lit star never goes amber', () => {
    const l = light({ brokerFiled: { ...filed(WF, { spokeo: '2026-01-01' }), ...filed(STRAG, { drop: '2026-01-01' }) }, caResident: 'yes' });
    expect(l.stars.spokeo).toEqual({ state: 'lit', litOn: '2026-01-01', via: ['checklist', 'drop'] });
  });

  it('a date after today is lit, not amber', () => {
    const l = light({ brokerFiled: filed(WF, { spokeo: '2027-06-01' }) });
    expect(l.stars.spokeo).toEqual({ state: 'lit', litOn: '2027-06-01', via: ['checklist'] });
  });

  it('litOn is the latest of the dates', () => {
    const l = light({ brokerFiled: { ...filed(WF, { spokeo: '2026-09-01' }), ...filed(STRAG, { drop: '2026-05-01' }) }, caResident: 'yes', bigCheck: { spokeo: '2026-08-01' } });
    expect(l.stars.spokeo).toEqual({ state: 'lit', litOn: '2026-09-01', via: ['checklist', 'drop', 'big-check'] });
  });

  it('a bad today never turns a star amber and never throws', () => {
    const l = light({ brokerFiled: filed(WF, { spokeo: '2020-01-01' }) }, 'garbage');
    expect(stateOf(l, 'spokeo')).toBe('lit');
  });

  it('a freeze lights nothing and rings the bureau', () => {
    const l = light({ missions: { 'credit_freeze-fortify-equifax': { status: 'completed', freeze_status: 'now-frozen' } } });
    expect(l.frozen).toEqual(['equifax-information-services']);
    expect(stateOf(l, 'equifax-information-services')).toBe('dim');
    expect(litIds(l)).toEqual([]);
    expect(light({ missions: { 'credit_freeze-fortify-equifax': { status: 'completed', freeze_status: 'not-yet' } } }).frozen).toEqual([]);
  });

  it('a freeze answer on an unfinished mission rings nothing', () => {
    expect(light({ missions: { 'credit_freeze-fortify-equifax': { status: 'in_progress', freeze_status: 'now-frozen' } } }).frozen).toEqual([]);
  });

  it('NAI gives a halo, never a light', () => {
    const l = light({ brokerFiled: filed('ad_trackers-fortify-bulk', { nai: '2026-10-01' }) });
    expect(l.halo).toEqual(['criteo']);
    expect(stateOf(l, 'criteo')).toBe('dim');
    expect(litIds(l)).toEqual([]);
    expect(light({ brokerFiled: filed('ad_trackers-fortify-bulk', { nai: T, daa: T }) }).halo).toEqual(['criteo']);
  });

  it('on the real map, ticking nai lights and haloes nothing; daa haloes the WebChoices list', () => {
    const nai = brokerLighting(realMap, { brokerFiled: filed('ad_trackers-fortify-bulk', { nai: T }) }, T);
    expect(realMap.sweeps.nai).toBeUndefined();
    expect(nai.halo).toEqual([]);
    expect(litIds(nai)).toEqual([]);
    const daa = brokerLighting(realMap, { brokerFiled: filed('ad_trackers-fortify-bulk', { daa: T }) }, T);
    expect(daa.halo).toEqual([...realMap.sweeps.daa.members].sort());
    expect(litIds(daa)).toEqual([]);
  });

  it('a Big Check tick lights that broker', () => {
    const l = light({ bigCheck: { 'tail-2': '2026-10-01' } });
    expect(l.stars['tail-2']).toEqual({ state: 'lit', litOn: '2026-10-01', via: ['big-check'] });
    expect(litIds(l)).toEqual(['tail-2']);
  });

  it('buyers are never lit', () => {
    const l = light({ bigCheck: { 'us-ice': '2026-10-01' }, brokerFiled: filed(STRAG, { drop: '2026-10-01' }), caResident: 'yes' });
    expect(l.stars['us-ice']).toEqual({ state: 'dim', litOn: null, via: [] });
    const ca = { ...mini, brokers: mini.brokers.map((b) => (b.id === 'us-ice' ? { ...b, registries: { CA: '2026' } } : b)) };
    expect(brokerLighting(ca, dropState('yes'), T, cl).stars['us-ice'].state).toBe('dim');
  });

  it('unknown line ids are ignored', () => {
    const s = { brokerFiled: { [WF]: { lines: { gone: '2026-10-01' } }, 'no-such-mission': { lines: { spokeo: '2026-10-01' } } } };
    const l = light(s);
    expect(litIds(l)).toEqual([]);
    expect(lineDates(s, WF, cl)).toEqual({});
    expect(lineDates(s, 'no-such-mission', cl)).toEqual({});
  });

  it('bad dates are ignored', () => {
    const l = light({ brokerFiled: filed(WF, { spokeo: '2026-02-30', whitepages: 7 }), bigCheck: { 'tail-1': 'soon', 'tail-2': null } });
    expect(litIds(l)).toEqual([]);
    const k = light({ missions: { [WF]: { status: 'completed', optout_result: 'all-submitted', completedAt: 'whenever' } } });
    expect(litIds(k)).toEqual([]);
    expect(k.pending).toEqual([WF]);
  });

  it('coverage is reach-weighted, floored, deterministic', () => {
    const tick = (ids) => light({ bigCheck: Object.fromEntries(ids.map((id) => [id, '2026-10-01'])) });
    const reachable = ['spokeo', 'whitepages', 'beenverified', 'acxiom', 'lexisnexis-risk-solutions', 'equifax-information-services', 'hub-a', 'tail-1', 'tail-2', 'criteo'];
    expect(fieldCoverage(mini, tick(['spokeo'])).percent).toBe(6);
    expect(fieldCoverage(mini, tick(['hub-a']))).toEqual({ percent: 40, anyLit: true, hubsLit: 1, hubsTotal: 1 });
    expect(fieldCoverage(mini, tick(reachable.filter((id) => id !== 'tail-2'))).percent).toBe(93);
    expect(fieldCoverage(mini, tick(reachable)).percent).toBe(100);
    expect(fieldCoverage(mini, tick(['spokeo']))).toEqual(fieldCoverage(mini, tick(['spokeo'])));
  });

  describe('the device clock', () => {
    afterEach(() => vi.useRealTimers());
    it('never changes the output', () => {
      const s = { ...legacyAll, brokerFiled: { ...filed(STRAG, { drop: '2026-10-01' }), 'ad_trackers-fortify-bulk': { lines: { nai: T } } }, caResident: 'yes', bigCheck: { 'tail-2': '2026-06-01' } };
      const run = () => { const l = light(s); return { l, c: fieldCoverage(mini, l) }; };
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));
      const a = run();
      vi.setSystemTime(new Date('2031-07-15T18:30:00Z'));
      const b = run();
      expect(b).toEqual(a);
    });
  });

  it('coverage is 0 when nothing is reachable', () => {
    const none = { ...mini, brokers: mini.brokers.filter((b) => b.id === 'nope' || b.id === 'us-ice') };
    expect(fieldCoverage(none, brokerLighting(none, {}, T, cl))).toEqual({ percent: 0, anyLit: false, hubsLit: 0, hubsTotal: 0 });
  });

  it('an amber star still counts toward coverage', () => {
    const l = light({ brokerFiled: filed(WF, { spokeo: '2026-01-01' }) });
    expect(stateOf(l, 'spokeo')).toBe('amber');
    expect(fieldCoverage(mini, l).percent).toBe(6);
    const hub = { ...mini, brokers: mini.brokers.map((b) => (b.id === 'hub-a' ? { ...b, kind: ['people-search'] } : b)) };
    const h = brokerLighting(hub, { bigCheck: { 'hub-a': '2026-01-01' } }, T, cl);
    expect(h.stars['hub-a'].state).toBe('amber');
    expect(fieldCoverage(hub, h)).toEqual({ percent: 40, anyLit: true, hubsLit: 1, hubsTotal: 1 });
  });

  it('a no-opt-out star is never lit, even by DROP or a tick', () => {
    const base = light(dropState('yes'));
    const l = light({ ...dropState('yes'), bigCheck: { nope: '2026-10-01' } });
    expect(l.stars.nope).toEqual({ state: 'no-opt-out', litOn: null, via: [] });
    expect(fieldCoverage(mini, l)).toEqual(fieldCoverage(mini, base));
    // Even a checklist line naming it, or a sweep listing it.
    const lines = { ...cl, [WF]: [{ id: 'spokeo', label: 'x', brokers: ['nope'] }] };
    const swept = { ...mini, sweeps: { nai: { members: ['nope'] } } };
    const k = brokerLighting(swept, { brokerFiled: { ...filed(WF, { spokeo: T }), ...filed('ad_trackers-fortify-bulk', { nai: T }) } }, T, lines);
    expect(k.stars.nope.state).toBe('no-opt-out');
  });

  it('Radaris stays no-opt-out on the real map whatever is filed', () => {
    const everything = { brokerFiled: {}, caResident: 'yes', bigCheck: { radaris: T } };
    for (const [m, lines] of Object.entries(BROKER_CHECKLISTS)) everything.brokerFiled[m] = { lines: Object.fromEntries(lines.map((l) => [l.id, T])) };
    const l = brokerLighting(realMap, everything, T);
    expect(l.stars.radaris.state).toBe('no-opt-out');
    expect(l.stars['oracle-advertising'].state).toBe('no-opt-out');
  });

  it('a floored 0% with something lit reads <1% (ruling M8)', () => {
    expect(fieldHeader({ percent: 0, anyLit: false, hubsLit: 0, hubsTotal: 12 })).toBe('FIELD COVERED: 0% · HUBS LIT 0/12');
    expect(fieldHeader({ percent: 0, anyLit: true, hubsLit: 0, hubsTotal: 12 })).toBe('FIELD COVERED: <1% · HUBS LIT 0/12');
    const none = fieldCoverage(realMap, brokerLighting(realMap, {}, '2026-10-19'));
    expect(none).toMatchObject({ percent: 0, anyLit: false });
    const one = realMap.brokers.find((b) => b.reach === 1 && !isBuyer(b));
    const lit = { stars: Object.fromEntries(realMap.brokers.map((b) => [b.id, { state: b.id === one.id ? 'lit' : 'dim' }])) };
    const c = fieldCoverage(realMap, lit);
    expect(c).toMatchObject({ percent: 0, anyLit: true });
    expect(fieldHeader(c)).toContain('<1%');
  });
  it('fieldHeader', () => expect(fieldHeader({ percent: 31, hubsLit: 3, hubsTotal: 12 })).toBe('FIELD COVERED: 31% · HUBS LIT 3/12'));
  it('the real map has 12 hubs', () => expect(fieldCoverage(realMap, brokerLighting(realMap, {}, '2026-10-19')).hubsTotal).toBe(12));

  it('lighting is sorted and covers every broker', () => {
    const l = brokerLighting(realMap, {}, T);
    expect(Object.keys(l.stars).length).toBe(realMap.brokers.length);
    const s = { missions: { 'credit_freeze-fortify-extras': { status: 'completed', freeze_extras: 'both-frozen' } } };
    expect(brokerLighting(realMap, s, T).frozen).toEqual(['chex-systems', 'innovis-data-solutions']);
  });

  it('an old save with no broker fields never throws', () => {
    expect(() => brokerLighting(realMap, { missions: { [WF]: { status: 'completed' } } }, T)).not.toThrow();
    expect(() => brokerLighting(realMap, {}, T)).not.toThrow();
    expect(() => brokerLighting(realMap, null, T)).not.toThrow();
    expect(() => brokerLighting(realMap, undefined, T)).not.toThrow();
    const odd = { missions: { [WF]: null, x: 5 }, brokerFiled: { [WF]: null, [STRAG]: { lines: null }, 'ad_trackers-fortify-bulk': 3 }, bigCheck: 'x', caResident: {} };
    expect(() => brokerLighting(realMap, odd, T)).not.toThrow();
    expect(litIds(brokerLighting(realMap, odd, T))).toEqual([]);
    expect(() => lineDates(null, WF)).not.toThrow();
    expect(isChecklistPending(null, WF)).toBe(false);
    expect(() => brokerLighting({ brokers: [{ id: 'x' }, null] }, odd, T)).not.toThrow();
  });
});
