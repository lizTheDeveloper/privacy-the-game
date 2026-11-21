import { describe, it, expect, beforeEach } from 'vitest';
import { renderDistrict, tabLeadMission, listKey, SIMPLE_LIST_SHOWN, afterTab } from '../src/screens/district.js';
import { createInitialState, updateMission } from '../src/state.js';
import { setReadLevel, simpleTitle, simpleLead } from '../src/utils/reading.js';
import { getMissionsForDistrict, MISSIONS } from '../src/data/missions.js';
import { DISTRICTS } from '../src/data/districts.js';
import { PART_NAMES } from '../src/utils/calc.js';
import { isMissionInPlay, isMissionDone } from '../src/utils/mission-status.js';
import { fkGradeWithoutNames, words } from '../src/utils/readability.js';

// Liz (2026-11-20), on the district screen in Simple mode: "Simple only". Simple players got the
// Advanced district: tabs named SURVEY / RECON / FORTIFY / RECLAIM, up to 18 rows that all looked the
// same, names like "OSINT Sieve", and READY badges that looked like buttons. Advanced stays as it was.

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

const strip = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaries = (html) => [...strip(html).matchAll(/class="[^"]*\bbtn-primary\b[^"]*"[^>]*>/g)].map((m) => m[0]);
const fresh = (level) => setReadLevel(createInitialState(), level);
const doneAll = (state, missions) => missions.reduce((s, m) => updateMission(s, m.id, { status: 'completed' }), state);
const tabOf = (id, tab) => getMissionsForDistrict(id).filter((m) => m.phase === tab);
const inPlay = (state, id, tab) => tabOf(id, tab).filter((m) => isMissionInPlay(state, m));
const rowCount = (html) => (html.match(/class="mission-row[ "]/g) || []).length;
const missionLinks = (html) => new Set([...html.matchAll(/class="mission-row[^"]*"[\s\S]*?href="#\/mission\/([^/"]+)\/briefing"/g)].map((m) => m[1]));
const all = (id, tab) => new Set([listKey(id, tab)]);
const tabs = (html) => [...html.matchAll(/class="panel district-tab[^"]*"[^>]*>([^<]*)<\/a>/g)].map((m) => m[1]);
const listPart = (html) => html.slice(html.indexOf('data-mission-list'), html.indexOf('data-district-notes') > -1 ? html.indexOf('data-district-notes') : undefined);

// Half The Master Keys' recon filed.
function midRecon(level) {
  const recon = inPlay(fresh(level), 'master-keys', 'recon');
  return doneAll({ ...fresh(level), seenIntros: { 'master-keys': true } }, recon.slice(0, Math.floor(recon.length / 2)));
}

describe('Simple: the tabs are named in plain words, the same as What’s next’s parts', () => {
  it('Your accounts / Check your accounts / Lock them up / Take your data back, at the same URLs', () => {
    const html = renderDistrict(fresh('simplest'), 'master-keys', 'recon');
    expect(tabs(html)).toEqual(['Your accounts', PART_NAMES.recon, PART_NAMES.fortify, PART_NAMES.reclaim]);
    expect(tabs(html)).toEqual(['Your accounts', 'Check your accounts', 'Lock them up', 'Take your data back']);
    for (const t of ['survey', 'recon', 'fortify', 'reclaim']) expect(html).toContain(`href="#/district/master-keys?tab=${t}"`);
    expect(html).toContain('district-tab--simple');
    expect(html).toMatch(/district-tab[^"]*panel--active" aria-current="page"[^>]*>Check your accounts</);
  });

  it('Advanced keeps SURVEY / RECON / FORTIFY / RECLAIM', () => {
    const html = renderDistrict(fresh('full'), 'master-keys', 'recon');
    expect(tabs(html)).toEqual(['SURVEY', 'RECON', 'FORTIFY', 'RECLAIM']);
    expect(html).not.toContain('district-tab--simple');
  });

  it('a finished tab’s Next up says the plain tab name in Simple', () => {
    const state = doneAll(fresh('simplest'), tabOf('master-keys', 'recon'));
    const html = renderDistrict(state, 'master-keys', 'recon');
    expect(html).toContain('<span class="next-up-where">On “Lock them up”</span>');
  });
});

describe('Simple: the lit mission, the next two, then "Show all N"', () => {
  it('a new save: three rows, the lead first, and "Show all" with the real count', () => {
    const state = fresh('simplest');
    const missions = inPlay(state, 'master-keys', 'recon');
    expect(missions.length).toBeGreaterThan(SIMPLE_LIST_SHOWN);
    const html = strip(renderDistrict(state, 'master-keys', 'recon'));
    const list = listPart(html);
    expect(rowCount(list)).toBe(SIMPLE_LIST_SHOWN);
    const lead = tabLeadMission(state, 'master-keys', 'recon');
    expect([...missionLinks(list)][0]).toBe(lead.id);
    expect(list.match(/class="mission-row[^"]*"/)[0]).toContain('mission-row--lead');
    expect(html).toContain(`>Show all ${missions.length}</button>`);
    expect(html).toContain(`data-action="show-all-missions" data-list="master-keys:recon"`);
    // Nothing done yet: no Done group.
    expect(html).not.toContain('data-done-fold');
  });

  it('mid-way: the lit mission and the two not done after it; the done ones folded at the end', () => {
    const state = midRecon('simplest');
    const missions = inPlay(state, 'master-keys', 'recon');
    const done = missions.filter((m) => isMissionDone(state.missions[m.id]));
    expect(done.length).toBeGreaterThan(0);
    const html = strip(renderDistrict(state, 'master-keys', 'recon'));
    const list = listPart(html);
    const fold = list.slice(list.indexOf('data-done-fold'));
    const shown = list.slice(0, list.indexOf('data-done-fold'));
    // Shown: three missions, none of them done, the lead first.
    const shownIds = [...missionLinks(shown)];
    expect(shownIds).toHaveLength(SIMPLE_LIST_SHOWN);
    expect(shownIds[0]).toBe(tabLeadMission(state, 'master-keys', 'recon').id);
    for (const id of shownIds) expect(isMissionDone(state.missions[id]), id).toBe(false);
    // The done ones: in a closed "Done (N)" fold after "Show all", every one of them.
    expect(list).toMatch(new RegExp(`<details class="done-fold" data-fold="done:master-keys:recon" data-done-fold>\\s*<summary>Done \\(${done.length}\\)</summary>`));
    expect(list.indexOf('show-all-missions')).toBeLessThan(list.indexOf('data-done-fold'));
    expect(rowCount(fold)).toBe(done.length);
    expect(fold).toContain('mission-row--done');
    expect(html).toContain(`>Show all ${missions.length}</button>`);
  });

  it('"Show all" opens today’s list in place: every mission, and a way to fold it back', () => {
    const state = midRecon('simplest');
    const missions = inPlay(state, 'master-keys', 'recon');
    const html = strip(renderDistrict(state, 'master-keys', 'recon', { openLists: all('master-keys', 'recon') }));
    const list = listPart(html);
    expect(list).toContain('data-mission-list="all"');
    expect(rowCount(list)).toBe(missions.length);
    // Every mission not done has its row and its START; the done ones are in the list, in order.
    for (const m of missions.filter((x) => !isMissionDone(state.missions[x.id]))) expect(list, m.id).toContain(`#/mission/${m.id}/briefing`);
    expect((list.match(/mission-row--done/g) || []).length).toBe(missions.filter((x) => isMissionDone(state.missions[x.id])).length);
    expect(list).not.toContain('data-done-fold');
    expect(list).toContain('data-action="show-fewer-missions"');
    // Same one bright button.
    expect(primaries(html)).toHaveLength(1);
  });

  it('expanded, it is the same list as Advanced’s, row for row', () => {
    for (const [id, tab, state] of [['master-keys', 'recon', midRecon], ['square', 'recon', fresh], ['vault', 'fortify', fresh]]) {
      const ids = (html) => [...listPart(html).matchAll(/class="mission-row[^"]*"/g)].length;
      const simple = renderDistrict(state('simplest'), id, tab, { openLists: all(id, tab) });
      const advanced = renderDistrict(state('full'), id, tab);
      expect(ids(simple), `${id} ${tab}`).toBe(ids(advanced));
    }
  });

  it('a short tab has no "Show all"; a finished one says so, with its missions in Done', () => {
    const vaultRecon = inPlay(fresh('simplest'), 'vault', 'recon');
    const finished = doneAll(fresh('simplest'), vaultRecon);
    const html = strip(renderDistrict(finished, 'vault', 'recon'));
    expect(html).not.toContain('show-all-missions');
    expect(html).toContain('You did every mission here.');
    expect(html).toContain(`<summary>Done (${vaultRecon.length})</summary>`);
    // The tab is still not a dead end: Next up goes on.
    expect(primaries(html)).toHaveLength(1);
  });

  it('a gated tab (Simple): the first three "first" rows in plain words, then "Show all"', () => {
    const html = strip(renderDistrict(fresh('simplest'), 'vault', 'fortify'));
    const list = listPart(html);
    expect((list.match(/mission-row--gate/g) || []).length).toBe(SIMPLE_LIST_SHOWN);
    expect(list).toContain('First: “Check your accounts” for Primary Bank');
    expect(list).toContain('>GO THERE</a>');
    expect(list).not.toContain('Complete RECON');
    expect(html).toContain(`>Show all ${inPlay(fresh('simplest'), 'vault', 'fortify').length}</button>`);
  });

  it('every district, every tab, fresh and mid-game, Simple, short or opened: one bright button at most', () => {
    const states = [fresh('simplest'), midRecon('simplest')];
    for (const state of states) {
      for (const d of DISTRICTS) {
        for (const tab of ['survey', 'recon', 'fortify', 'reclaim']) {
          expect(primaries(renderDistrict(state, d.id, tab)).length, `${d.id} ${tab}`).toBeLessThanOrEqual(1);
          expect(primaries(renderDistrict(state, d.id, tab, { openLists: all(d.id, tab) })).length, `${d.id} ${tab} open`).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe('Advanced is unchanged: the whole list, every row', () => {
  // Row counts on a new save (and the Master Keys mid-recon): the list before 7.38.0.
  const SNAPSHOT = {
    'master-keys recon new': 19,
    'master-keys fortify new': 9,
    'master-keys recon mid': 19,
    'vault fortify new': 7,
    'square recon new': 13,
    'square fortify new': 10,
    'capitol recon new': 5,
  };
  it.each(Object.entries(SNAPSHOT))('%s: %i rows', (key, n) => {
    const [id, tab, when] = key.split(' ');
    const state = when === 'mid' ? midRecon('full') : fresh('full');
    const html = renderDistrict(state, id, tab);
    expect(rowCount(listPart(html))).toBe(n);
    expect(html).not.toContain('show-all-missions');
    expect(html).not.toContain('data-done-fold');
    expect(html).not.toContain('mission-about');
  });

  it('Advanced rows keep their whole titles; the gate keeps RECON', () => {
    const html = renderDistrict(fresh('full'), 'master-keys', 'recon');
    expect(html).toContain('>Breach Recon: Gmail</div>');
    const gated = renderDistrict(fresh('full'), 'master-keys', 'fortify');
    expect(gated).toContain('Complete RECON for Gmail first');
    expect(gated).toContain('>GO TO RECON</a>');
  });
});

describe('Simple: plain mission names', () => {
  it('a row is named as its briefing names it in Simple, with its plain line under it', () => {
    const state = fresh('simplest');
    const lead = tabLeadMission(state, 'master-keys', 'recon');
    const html = renderDistrict(state, 'master-keys', 'recon');
    expect(simpleTitle(lead)).toBe('Gmail');
    expect(html).toContain(`>${simpleTitle(lead)}</div>`);
    expect(html).toContain(`<div class="mission-about">${simpleLead(lead)}</div>`);
    expect(html).not.toContain('Breach Recon: Gmail');
  });

  it('no OSINT Sieve on The Perimeter: each one has a plain name, from its own plain line', () => {
    const html = renderDistrict(fresh('simplest'), 'perimeter');
    expect(html).not.toMatch(/OSINT/);
    for (const m of getMissionsForDistrict('perimeter').filter((x) => x.id.startsWith('osint-sieve'))) {
      expect(m.simpleTitle, m.id).toBeTruthy();
      expect(html).toContain(`>${m.simpleTitle}</div>`);
    }
    // Advanced keeps the names it had.
    expect(renderDistrict(fresh('full'), 'perimeter')).toContain('OSINT Sieve: Photo Intelligence');
  });

  it('the ANT CATALOG badge reads NSA SPY TOOLS in Simple, and still goes to its sources', () => {
    const simple = renderDistrict(fresh('simplest'), 'perimeter');
    expect(simple).not.toContain('ANT CATALOG');
    expect(simple).toMatch(/href="#\/leak\/ant-catalog"[^>]*>[\s\S]{0,80}NSA SPY TOOLS<\/a>/);
    expect(renderDistrict(fresh('full'), 'perimeter')).toContain('ANT CATALOG');
  });

  it('every plain name is short and plain (grade 6, 10 words), with no figures', () => {
    const named = MISSIONS.filter((m) => m.simpleTitle);
    expect(named.length).toBeGreaterThanOrEqual(9);
    for (const m of named) {
      expect(words(m.simpleTitle).length, m.id).toBeLessThanOrEqual(10);
      expect(fkGradeWithoutNames(m.simpleTitle), `${m.id}: ${m.simpleTitle}`).toBeLessThanOrEqual(6);
      expect(m.simpleTitle, m.id).not.toMatch(/\d/);
    }
  });

  it('a mission with no plain line (an account the player added) keeps its whole title', () => {
    const s = { ...fresh('simplest'), customAccounts: { square: ['Old forum'] } };
    expect(renderDistrict(s, 'square', 'recon')).toContain('Sign-in check: Old forum');
  });
});

describe('READY is plain grey text, not a badge, in both modes', () => {
  for (const level of ['simplest', 'full']) {
    it(level, () => {
      const html = renderDistrict(fresh(level), 'perimeter');
      expect(html).toContain('<div class="status-quiet">READY</div>');
      expect(html).toContain('<div class="status-quiet" data-quiz-badge>READY</div>');
      expect(html).not.toMatch(/class="badge"[^>]*>READY</);
    });
  }
  it('a count keeps its badge', () => {
    const m = getMissionsForDistrict('perimeter').find((x) => x.accountId === 'sim_protection');
    expect(renderDistrict(updateMission(fresh('full'), m.id, { status: 'completed' }), 'perimeter')).toMatch(/class="badge"[^>]*>1\/2</);
  });
});

describe('a tab that waits on the one before: the one bright button leads there (Liz 2026-11-20: "Yes")', () => {
  for (const level of ['simplest', 'full']) {
    it(`${level}: a fully gated Fortify tab has exactly one bright button, and it goes to Recon’s lead`, () => {
      for (const id of ['master-keys', 'vault', 'archives', 'capitol']) {
        const state = fresh(level);
        expect(tabLeadMission(state, id, 'fortify'), id).toBeNull();
        const html = renderDistrict(state, id, 'fortify');
        const lit = primaries(html);
        expect(lit, id).toHaveLength(1);
        const recon = tabLeadMission(state, id, 'recon');
        expect(lit[0], id).toContain(`href="#/mission/${recon.id}/briefing"`);
        // The GO TO rows stay outlined.
        expect(html).toMatch(/class="btn-secondary"[^>]*href="#\/district\/[^?]+\?tab=recon">GO/);
      }
    });
  }

  it('The Archives: Reclaim has a mission open, but a gated Fortify still points to Recon first', () => {
    const state = fresh('full');
    expect(tabLeadMission(state, 'archives', 'reclaim')).toBeTruthy();
    const next = afterTab(state, DISTRICTS.find((d) => d.id === 'archives'), 'fortify');
    expect(next.href).toBe(`#/mission/${tabLeadMission(state, 'archives', 'recon').id}/briefing`);
    expect(next.where).toBe('Recon tab');
  });
});
