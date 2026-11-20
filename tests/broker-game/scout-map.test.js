// Scout's lines on the field map (Plan 3, Task 3). Each shows once per save.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { BROKER_MAP_DIALOGUE } from '../../src/data/dialogue.js';
import { MAP_SCOUT_KEYS, mapScoutLine, mapScoutTriggers, cardScoutLine, bigCheckScoutLine } from '../../src/utils/broker-scout.js';
import { markScoutSeen, markScoutPending, cleanBrokerState, markMapSeen } from '../../src/utils/broker-state.js';
import { renderBrokerMap } from '../../src/screens/broker-map.js';
import { renderBigCheck } from '../../src/screens/big-check.js';
import { starCard } from '../../src/components/star-card.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { createInitialState, loadState, saveState } from '../../src/state.js';
import { isPrivateBreadcrumb } from '../../src/utils/errorNoise.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const T = '2026-10-19';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

// A small sky: one hub, twelve DROP-lit brokers, one checklist-lit one.
const sky = {
  brokers: [
    { id: 'hub', hub: true },
    { id: 'small' },
    ...Array.from({ length: 12 }, (_, i) => ({ id: `ca-${i}` })),
  ],
};
const lit = (via) => ({ state: 'lit', litOn: T, via });
const skyLighting = {
  stars: Object.fromEntries([
    ['hub', lit(['checklist'])],
    ['small', lit(['checklist'])],
    ...Array.from({ length: 12 }, (_, i) => [`ca-${i}`, lit(['drop'])]),
  ]),
};
const drops = (n) => Array.from({ length: n }, (_, i) => `ca-${i}`);
const seen = (state, ...keys) => keys.reduce((s, k) => markScoutSeen(s, k), state);

describe("Scout's map lines: the copy", () => {
  it('the map lines carry no digits', () => {
    for (const l of Object.values(BROKER_MAP_DIALOGUE)) expect(l).not.toMatch(/\d/);
  });
  it("the no-opt-out line starts with the spec's sentence", () => expect(BROKER_MAP_DIALOGUE.noOptOut.startsWith("Some of them don't let you leave.")).toBe(true));
  it("the nudge is the spec's sentence", () => expect(BROKER_MAP_DIALOGUE.nudge).toBe('Tell Scout which ones you filed.'));
  it("Liz's first-visit line is kept exactly", () => {
    expect(BROKER_MAP_DIALOGUE.firstVisit).toBe("There's a whole constellation of data brokers up there, trading in what drifted up out of the city. The lit stars are the ones your opt-outs reach. Tap one to see its name.");
  });
  it('the five new lines are the plan\'s copy, verbatim', () => {
    expect(BROKER_MAP_DIALOGUE.opened).toBe('This is the whole field, as far as the public record goes. Every star is a company on a state data broker registry or an ad industry member list, or one that public documents tie to them. The big ones are big because of what the records show them owning, supplying or selling to, not because we guessed. The shapes on the rim are the buyers the contract records show paying for it. Dim means not yet. Lime means you filed.');
    expect(BROKER_MAP_DIALOGUE.firstHub).toBe("That's a hub. A lot of the documented lines run through it, so it counts for more of the field than a small site does.");
    expect(BROKER_MAP_DIALOGUE.sweep).toBe("One request, a whole cluster lit. That's DROP: every broker registered in California has to process it.");
    expect(BROKER_MAP_DIALOGUE.noOptOut).toBe("Some of them don't let you leave. When there's no opt-out, a complaint to a regulator still puts it on the record.");
    expect(BROKER_MAP_DIALOGUE.bigCheck).toBe("This is the long tail: every broker on the map your opt-outs haven't reached yet. Where a mission covers one, it points you there. It's optional, and it never counts toward your districts, your city lights or the city's totals. It's here for when you want to finish the job.");
  });
  it('the keys', () => expect(MAP_SCOUT_KEYS).toEqual(['opened', 'sweep', 'firstHub', 'noOptOut', 'bigCheck']));
  // The opened line says every star is on a registry or an ad industry member list, or tied to
  // them by public documents. Each drawn star must have one of those, so the line can't silently
  // become false on a data release.
  it("every drawn star backs the opened line's claim", () => {
    const byId = new Map(map.brokers.map((b) => [b.id, b]));
    const linked = new Set(map.links.flatMap((k) => [k.from, k.to]));
    const archived = (s) => typeof s?.archived === 'string' && s.archived.startsWith('https://web.archive.org/');
    const why = (b) => {
      if (Object.values(b.registries ?? {}).some((v) => v !== null && v !== '')) return 'registry';
      if ((b.sources ?? []).some((s) => s?.kind === 'member-list')) return 'member-list';
      if (linked.has(b.id)) return 'link';
      if (typeof b.parent === 'string' && byId.has(b.parent)) return 'parent';
      // A record whose own archived documents put it in the data trade (journalism, filings,
      // its privacy page). See the Task 3 fix report: these need a copy ruling if not accepted.
      if ((b.sources ?? []).some((s) => s?.kind !== 'member-list' && archived(s))) return 'documents';
      return null;
    };
    const unbacked = layout.stars.map((s) => s[0]).filter((id) => !byId.has(id) || why(byId.get(id)) === null);
    expect(unbacked).toEqual([]);
  });
  it('every line is documented in the chapter 8 dialogue doc', () => {
    const doc = readFileSync('docs/scout-dialogue-ch8-reclamation.md', 'utf8');
    for (const l of Object.values(BROKER_MAP_DIALOGUE)) expect(doc).toContain(l);
  });
});

describe('mapScoutLine', () => {
  it('first open shows the opened line', () => {
    expect(mapScoutLine(createInitialState(), sky, skyLighting, new Set())).toEqual({ key: 'opened', line: BROKER_MAP_DIALOGUE.opened });
    // Even with a hub and a DROP sweep newly lit, opened comes first.
    expect(mapScoutLine(createInitialState(), sky, skyLighting, new Set(['hub', ...drops(12)])).key).toBe('opened');
  });

  it('a newly lit hub shows firstHub after opened is seen', () => {
    const s = seen(createInitialState(), 'opened');
    expect(mapScoutLine(s, sky, skyLighting, new Set(['hub']))).toEqual({ key: 'firstHub', line: BROKER_MAP_DIALOGUE.firstHub });
    expect(mapScoutLine(s, sky, skyLighting, new Set(['small']))).toBeNull();
    expect(mapScoutLine(s, sky, skyLighting, new Set())).toBeNull();
  });

  it('ten or more DROP-lit stars show sweep; nine do not', () => {
    const s = seen(createInitialState(), 'opened', 'firstHub');
    expect(mapScoutLine(s, sky, skyLighting, new Set(drops(10)))).toEqual({ key: 'sweep', line: BROKER_MAP_DIALOGUE.sweep });
    expect(mapScoutLine(s, sky, skyLighting, new Set(drops(9)))).toBeNull();
    // Nine DROP stars plus a checklist one is still nine through DROP.
    expect(mapScoutLine(s, sky, skyLighting, new Set([...drops(9), 'small']))).toBeNull();
    // An unseen firstHub with no newly lit hub doesn't block the sweep line.
    expect(mapScoutLine(seen(createInitialState(), 'opened'), sky, skyLighting, new Set(drops(10))).key).toBe('sweep');
  });

  it('a real DROP filing in California is a sweep', () => {
    const s = { ...seen(createInitialState(), 'opened', 'firstHub'), caResident: 'yes', brokerFiled: { 'people_search-reclaim-stragglers': { lines: { drop: '2026-10-01' }, since: '2026-10-01' } } };
    const l = brokerLighting(map, s, T);
    const ids = Object.keys(l.stars).filter((id) => l.stars[id].via.includes('drop'));
    expect(ids.length).toBeGreaterThanOrEqual(10);
    expect(mapScoutLine(s, map, l, new Set(ids)).key).toBe('sweep');
  });

  it('each map line shows once', () => {
    let s = createInitialState();
    const all = new Set(['hub', ...drops(12)]);
    const shown = [];
    for (let i = 0; i < 5; i++) {
      const got = mapScoutLine(s, sky, skyLighting, all);
      if (!got) break;
      shown.push(got.key);
      s = markScoutSeen(s, got.key);
      // A reload: the save goes through JSON and loadState's clean-up.
      saveState(s);
      s = loadState();
    }
    expect(shown).toEqual(['opened', 'sweep', 'firstHub']);
    expect(mapScoutLine(s, sky, skyLighting, all)).toBeNull();
    expect(s.brokerMap.scout).toEqual({ opened: 1, firstHub: 1, sweep: 1 });
  });
});

// Ruling T3-b: a line whose trigger fires but isn't the one shown is pending (0) and shows later.
describe('pending lines (ruling T3-b)', () => {
  // What app.js does on a map visit: pick the line, mark the other triggered lines pending, mark the
  // shown line seen, save, reload.
  const visit = (state, m, l, fresh) => {
    const got = mapScoutLine(state, m, l, fresh);
    let next = markScoutPending(state, mapScoutTriggers(state, m, l, fresh).filter((k) => k !== got?.key));
    if (got) next = markScoutSeen(next, got.key);
    saveState(next);
    return { got, state: loadState() };
  };

  it('triggers: firstHub for a newly lit hub, sweep for ten DROP stars; never opened', () => {
    const s = createInitialState();
    expect(mapScoutTriggers(s, sky, skyLighting, new Set(['hub', ...drops(10)]))).toEqual(['sweep', 'firstHub']);
    expect(mapScoutTriggers(s, sky, skyLighting, new Set(drops(9)))).toEqual([]);
    expect(mapScoutTriggers(seen(s, 'firstHub'), sky, skyLighting, new Set(['hub', ...drops(10)]))).toEqual(['sweep']);
  });

  // Final review M3: the DROP visit explains itself (sweep); firstHub waits for the next visit.
  it('a DROP-yes filing after opened is seen shows sweep now and firstHub on the next visit', () => {
    let s = { ...seen(createInitialState(), 'opened'), caResident: 'yes', brokerFiled: { 'people_search-reclaim-stragglers': { lines: { drop: '2026-10-01' }, since: '2026-10-01' } } };
    s = markMapSeen(s, []);
    const l = brokerLighting(map, s, T);
    const fresh = new Set(Object.keys(l.stars).filter((id) => ['lit', 'amber'].includes(l.stars[id].state)));
    let v = visit(s, map, l, fresh);
    expect(v.got.key).toBe('sweep');
    expect(v.state.brokerMap.scout).toEqual({ opened: 1, sweep: 1, firstHub: 0 });
    // The next visit: nothing newly lit, but firstHub was pending.
    v = visit(v.state, map, l, new Set());
    expect(v.got).toEqual({ key: 'firstHub', line: BROKER_MAP_DIALOGUE.firstHub });
    v = visit(v.state, map, l, new Set());
    expect(v.got).toBeNull();
    expect(v.state.brokerMap.scout).toEqual({ opened: 1, firstHub: 1, sweep: 1 });
  });

  it('a pending line survives a JSON reload and still shows after opened', () => {
    // Second visit: opened shows, the hub and sweep go pending.
    let v = visit(seen(createInitialState()), sky, skyLighting, new Set(['hub', ...drops(12)]));
    expect(v.got.key).toBe('opened');
    expect(v.state.brokerMap.scout).toEqual({ opened: 1, firstHub: 0, sweep: 0 });
    expect(JSON.parse(JSON.stringify(v.state)).brokerMap.scout.firstHub).toBe(0);
    v = visit(v.state, sky, skyLighting, new Set());
    expect(v.got.key).toBe('sweep');
    v = visit(v.state, sky, skyLighting, new Set());
    expect(v.got.key).toBe('firstHub');
    expect(visit(v.state, sky, skyLighting, new Set(['hub', ...drops(12)])).got).toBeNull();
  });

  it('markScoutPending never un-sees a line, and ignores unknown keys', () => {
    const s = seen(createInitialState(), 'sweep');
    expect(markScoutPending(s, ['sweep'])).toBe(s);
    expect(markScoutPending(s, ['nope', '__proto__'])).toBe(s);
    expect(markScoutPending(s, []).brokerMap.scout).toEqual({ sweep: 1 });
    expect(markScoutPending(s, ['firstHub']).brokerMap.scout).toEqual({ sweep: 1, firstHub: 0 });
  });

  it('cleanBrokerState keeps 0 and 1, drops anything else', () => {
    const ok = { brokerMap: { scout: { opened: 1, sweep: 0 } } };
    expect(cleanBrokerState(ok)).toBe(ok);
    expect(cleanBrokerState({ brokerMap: { scout: { opened: 1, sweep: 2, firstHub: -0.5, noOptOut: '0', bigCheck: null, nope: 0 } } }))
      .toEqual({ brokerMap: { scout: { opened: 1 } } });
  });
});

describe('the event lines', () => {
  const l = brokerLighting(map, createInitialState(), T);
  it('noOptOut shows for a no-opt-out star until seen', () => {
    expect(l.stars.radaris.state).toBe('no-opt-out');
    expect(cardScoutLine(createInitialState(), l, 'radaris')).toBe(BROKER_MAP_DIALOGUE.noOptOut);
    expect(cardScoutLine(createInitialState(), l, 'spokeo')).toBeNull();
    expect(cardScoutLine(markScoutSeen(createInitialState(), 'noOptOut'), l, 'radaris')).toBeNull();
  });
  it('bigCheck shows until seen', () => {
    expect(bigCheckScoutLine(createInitialState())).toBe(BROKER_MAP_DIALOGUE.bigCheck);
    expect(bigCheckScoutLine(markScoutSeen(createInitialState(), 'bigCheck'))).toBeNull();
  });
});

describe('markScoutSeen and the save', () => {
  it('sets brokerMap.scout[key] = 1 and keeps seenLit', () => {
    const s = markScoutSeen(markMapSeen(createInitialState(), ['spokeo']), 'opened');
    expect(s.brokerMap).toEqual({ seenLit: ['spokeo'], scout: { opened: 1 } });
    expect(markScoutSeen({}, 'bigCheck').brokerMap).toEqual({ scout: { bigCheck: 1 } });
    expect(markScoutSeen({ brokerMap: 'junk' }, 'sweep').brokerMap).toEqual({ scout: { sweep: 1 } });
  });
  it('an unknown key changes nothing', () => {
    const s = createInitialState();
    expect(markScoutSeen(s, 'nope')).toBe(s);
    expect(markScoutSeen(s, '__proto__')).toBe(s);
  });
  it('marking a seen key again returns the same state', () => {
    const s = markScoutSeen(createInitialState(), 'opened');
    expect(markScoutSeen(s, 'opened')).toBe(s);
  });
  it('cleanBrokerState keeps a valid scout object and drops junk', () => {
    const ok = { brokerMap: { seenLit: ['a'], scout: { opened: 1, bigCheck: 1 } } };
    expect(cleanBrokerState(ok)).toBe(ok);
    expect(cleanBrokerState({ brokerMap: { seenLit: ['a'], scout: { opened: 1, nope: 1, sweep: 'yes', firstHub: 3 } } }))
      .toEqual({ brokerMap: { seenLit: ['a'], scout: { opened: 1 } } });
    expect(cleanBrokerState({ brokerMap: { seenLit: ['a'], scout: ['opened'] } })).toEqual({ brokerMap: { seenLit: ['a'] } });
    expect(cleanBrokerState({ brokerMap: { scout: null } })).toEqual({ brokerMap: {} });
    const proto = JSON.parse('{"brokerMap":{"scout":{"__proto__":{"x":1},"sweep":1}}}');
    const c = cleanBrokerState(proto);
    expect(Object.keys(c.brokerMap.scout)).toEqual(['sweep']);
    expect(Object.getPrototypeOf(c.brokerMap.scout)).toBe(Object.prototype);
  });
  it('an old save with no scout keeps working, and a first visit is still a first visit', () => {
    const old = { brokerMap: { seenLit: ['a'] } };
    expect(cleanBrokerState(old)).toBe(old);
    // Marking a line seen never invents seenLit: the first-visit test (no seenLit) still holds.
    expect(Array.isArray(markScoutSeen(createInitialState(), 'bigCheck').brokerMap.seenLit)).toBe(false);
  });
});

describe('where the lines show', () => {
  const data = { map, layout };
  const draw = (state, opts = {}) => renderBrokerMap(state, { status: 'ready', data, today: T, ...opts });
  const stageOf = (h) => h.slice(h.indexOf('<div class="map-stage"'), h.indexOf('<p class="constellation-pick"'));

  it('a map line shows in the same dismissable overlay as the first-visit line', () => {
    const h = draw(createInitialState(), { scoutLine: BROKER_MAP_DIALOGUE.opened });
    const stage = stageOf(h);
    expect(stage).toContain('class="constellation-scout"');
    expect(stage).toContain(BROKER_MAP_DIALOGUE.opened);
    expect(stage).toContain('data-action="dismiss-scout"');
    expect(draw(createInitialState())).not.toContain('class="constellation-scout"');
  });

  it('a long line never covers most of the sky: the text scrolls inside a capped box, × stays put', () => {
    const h = draw(createInitialState(), { scoutLine: BROKER_MAP_DIALOGUE.opened });
    expect(h).toMatch(/\.constellation-scout p\{[^}]*max-height:min\(9em,30svh\)[^}]*overflow-y:auto/);
    expect(h).toMatch(/\.constellation-scout p\{[^}]*touch-action:pan-y/);
  });

  it("the first visit shows Liz's line, never the opened line", () => {
    const h = draw(createInitialState(), { firstVisit: true, scoutLine: BROKER_MAP_DIALOGUE.opened });
    expect(h).toContain("There's a whole constellation");
    expect(h).not.toContain('This is the whole field');
    expect((h.match(/class="constellation-scout"/g) ?? []).length).toBe(1);
  });

  it('the noOptOut line sits inside the card, in its flow, after the no-opt-out notice', () => {
    const l = brokerLighting(map, createInitialState(), T);
    const card = starCard(map, l, 'radaris', createInitialState(), { scoutLine: BROKER_MAP_DIALOGUE.noOptOut });
    expect(card.startsWith('<section class="star-card"')).toBe(true);
    const at = card.indexOf("Some of them don't let you leave.");
    expect(at).toBeGreaterThan(card.indexOf('No opt-out exists.'));
    expect(at).toBeLessThan(card.indexOf('data-action="close-star"'));
    expect(card).toContain('class="star-card-scout"');
    expect(starCard(map, l, 'radaris', createInitialState())).not.toContain("Some of them don't let you leave.");
  });

  it('the map passes the card its Scout line', () => {
    const h = draw(createInitialState(), { selectedId: 'radaris', cardScoutLine: BROKER_MAP_DIALOGUE.noOptOut });
    expect(h.slice(h.indexOf('<section class="star-card"'))).toContain("Some of them don't let you leave.");
  });

  it('the Big Check shows its line in a matching bubble on the first visit only', () => {
    const h = renderBigCheck(createInitialState(), { status: 'ready', data, today: T, scoutLine: BROKER_MAP_DIALOGUE.bigCheck });
    expect(h).toContain('This is the long tail');
    expect(h).toContain('class="big-check-scout"');
    expect(h).not.toContain('constellation-scout');
    expect(h).toMatch(/\.big-check-scout\{[^}]*display:flex/);
    expect(isPrivateBreadcrumb({ category: 'ui.click', message: 'div.big-check-scout > p' })).toBe(true);
    expect(h.indexOf('This is the long tail')).toBeLessThan(h.indexOf('data-big-check-filter'));
    expect(renderBigCheck(createInitialState(), { status: 'ready', data, today: T })).not.toContain('This is the long tail');
  });
});

describe('app wiring (source checks)', () => {
  const src = readFileSync('src/app.js', 'utf8');
  it('marks each line seen after the render that showed it', () => {
    const after = src.slice(src.indexOf('function afterBrokerMapRender('), src.indexOf('function tapSky('));
    expect(after).toMatch(/markScoutSeen\(/);
    expect(src).toMatch(/markScoutSeen\([^)]*'noOptOut'\)/);
    expect(src).toMatch(/markScoutSeen\([^)]*'bigCheck'\)/);
  });
  it('the first visit never computes a map line (Liz\'s line shows instead)', () => {
    expect(src).toMatch(/mapFirstVisit \? null : mapScoutLine\(/);
  });
  it('lines triggered but not shown are marked pending with the seen mark', () => {
    const after = src.slice(src.indexOf('function afterBrokerMapRender('), src.indexOf('function tapSky('));
    expect(after).toMatch(/markScoutPending\(/);
    expect(src).toMatch(/mapScoutTriggers\(/);
  });
});
