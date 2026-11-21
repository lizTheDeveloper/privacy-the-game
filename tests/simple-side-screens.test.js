// Simple mode on the side screens (Liz 2026-11-21, the layout review's last pick): on each screen,
// one plain sentence saying what it is and why it matters, one bright button (the next thing to
// do), and everything else behind a "See everything" button. Advanced stays as it was.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialState, updateMission } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { seeEverything, toggleSeeEverything, _resetSeeEverything, isSeeEverythingOpen } from '../src/components/see-everything.js';
import { renderStats, STATS_LEAD } from '../src/screens/stats.js';
import { renderCityTogether, cityStats, nextBreachCheck, TOGETHER_LEAD, SIMPLE_PANELS } from '../src/screens/city-together.js';
import { renderGhost, renderGhostEarly, GHOST_LEADS } from '../src/screens/ghost.js';
import { GHOST_DIALOGUE } from '../src/data/dialogue.js';
import { renderGarage, nextCarOptOut, GARAGE_LEAD } from '../src/screens/garage.js';
import { renderSaints, SAINTS_LEAD } from '../src/screens/saints.js';
import { renderDistrict, SIMPLE_LIST_SHOWN } from '../src/screens/district.js';
import { getMissionsForDistrict, MISSIONS } from '../src/data/missions.js';
import { isCoreMission } from '../src/utils/calc.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';
import { DISTRICTS } from '../src/data/districts.js';
import { setChosenPod } from '../src/utils/pod-pref.js';
import { textOf } from './helpers/on-page.mjs';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); _resetSeeEverything(); });

const noStyle = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaries = (html) => (noStyle(html).match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
const fresh = (level = 'simplest') => setReadLevel(createInitialState(), level);
// The page before "See everything", and what is behind it.
const above = (html) => { const i = html.indexOf('data-see-everything'); return i < 0 ? html : html.slice(0, i); };
const folded = (html) => { const i = html.indexOf('class="see-all-body"'); return i < 0 ? '' : html.slice(i); };
const leads = (html) => (html.match(/data-simple-lead/g) || []).length;

// The pattern, on one Simple screen: one sentence (before the bright button), one bright button
// before the fold, and a "See everything" button that starts folded.
function expectPattern(html, { fold = true } = {}) {
  expect(leads(html)).toBe(1);
  expect(primaries(html)).toBe(1);
  expect(primaries(above(html))).toBe(1);
  const h = noStyle(html);
  expect(h.indexOf('data-simple-lead')).toBeLessThan(h.search(/class="[^"]*\bbtn-primary\b/));
  if (fold) {
    expect(html).toMatch(/<button type="button" class="list-more see-all-btn" data-action="see-everything" data-fold-key="[^"]+" aria-expanded="false" aria-controls="see-all-[^"]+">See everything<\/button><div class="see-all-body" id="see-all-[^"]+" hidden>/);
  }
}

const DATA = {
  k: 50, asOf: '2026-11-19T04:00:00Z',
  city: { players: 11865, actions: 40211, twoFactor: 1880, brokerOptOuts: 2900, fortified: { pct: 18 }, byAddress: [{ id: 'gmail', label: 'Gmail', checks: 9, breachRatePct: 85 }] },
  pods: [{ id: 'us-il-chicago', label: 'Chicago', players: 312, fortified: { pct: 22 } }],
};
const together = (s) => renderCityTogether(s, { collective: { status: 'ready', data: DATA } });

describe('See everything', () => {
  it('is a real button with aria-expanded, and the rest is in the page, hidden', () => {
    const html = seeEverything('x', '<p>the rest</p>');
    expect(html).toContain('<button type="button" class="list-more see-all-btn" data-action="see-everything" data-fold-key="x" aria-expanded="false" aria-controls="see-all-x">See everything</button>');
    expect(html).toContain('<div class="see-all-body" id="see-all-x" hidden><p>the rest</p></div>');
  });

  it('stays open across re-draws once opened (memory only), and nothing to fold is no button', () => {
    toggleSeeEverything('x');
    expect(isSeeEverythingOpen('x')).toBe(true);
    expect(seeEverything('x', '<p>r</p>')).toContain('aria-expanded="true"');
    expect(seeEverything('x', '<p>r</p>')).not.toContain(' hidden>');
    expect(seeEverything('y', '  ')).toBe('');
  });

  it('app.js opens it in place: no re-draw, nothing tracked', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const handler = app.slice(app.indexOf("action === 'see-everything'"), app.indexOf("action === 'show-all-missions'"));
    expect(handler).toContain('toggleSeeEverything(el.dataset.foldKey)');
    expect(handler).toContain("el.setAttribute('aria-expanded', String(on));");
    expect(handler).not.toMatch(/track\(|renderCurrentRoute/);
  });

  it('the button and the sentence are styled once, in style.css', () => {
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toMatch(/\.simple-lead \{[^}]*font-size: 17px;[^}]*color: var\(--text-strong\)/);
    expect(css).toMatch(/\.list-more \{[^}]*min-height: 44px/);
  });
});

describe('Your City (stats)', () => {
  it('Simple: the sentence, Next, the three dials and the district bars; the rest folded', () => {
    const html = renderStats(fresh());
    expectPattern(html);
    expect(textOf(html)).toContain(STATS_LEAD);
    const top = above(html);
    expect(top).toContain('data-stats-next');
    expect(top).toContain('INTEGRITY');
    expect(top).toContain('data-district-row="master-keys"');
    expect(top).not.toContain('FINDINGS LOG');
    for (const k of ['FINDINGS LOG', 'WHAT WE KNOW ABOUT YOU', 'PLAY STATS', 'toggle-analytics']) expect(folded(html)).toContain(k);
  });

  it('Advanced: no sentence, no fold, everything in place', () => {
    const html = renderStats(fresh('full'));
    expect(html).not.toContain('data-simple-lead');
    expect(html).not.toContain('data-see-everything');
    expect(html.indexOf('DISTRICT PROGRESS')).toBeLessThan(html.indexOf('FINDINGS LOG'));
    expect(html).toContain('2FA ENABLED');
  });
});

describe('The Whole City', () => {
  it('Simple: the ring, your part, two panels and one SHARE; the rest folded', () => {
    const s = fresh();
    const html = together(s);
    expectPattern(html);
    expect(textOf(html)).toContain(TOGETHER_LEAD);
    const top = above(html);
    expect(top).toContain('LEAKED EMAILS FIXED');
    expect(top).toMatch(new RegExp(`class="btn-primary" data-your-part-go href="#/mission/${nextBreachCheck(s).id}/briefing"`));
    const shown = cityStats(DATA.city).slice(0, SIMPLE_PANELS).map((st) => st.key);
    for (const k of shown) expect(top).toContain(`data-stat-panel="${k}"`);
    expect((html.match(/data-action="share-stat"/g) || []).length).toBe(1);
    expect(top).toMatch(/data-page-share[^>]*><button class="btn-secondary" data-action="share-stat" data-stat="players"/);
    for (const k of ['data-stat-panel="twoFactor"', 'PLACES', 'ADDRESSES FOUND IN A KNOWN BREACH', 'data-what-you-can-do', 'GO GHOST', 'Opening this page counts as a page view']) {
      expect(folded(html), k).toContain(k);
    }
  });

  it('Simple: with every breach check done, What you can do holds the bright button, above the fold', () => {
    let s = fresh();
    for (const m of MISSIONS) if (/-recon-breach$/.test(m.id)) s = updateMission(s, m.id, { status: 'completed', action: 'action-done' });
    const html = together(s);
    expect(primaries(above(html))).toBe(1);
    expect(above(html)).toMatch(/class="btn-primary wycd-go"/);
  });

  it('Advanced keeps a SHARE on every panel and no fold', () => {
    const html = together(fresh('full'));
    expect((html.match(/data-action="share-stat"/g) || []).length).toBe(cityStats(DATA.city).length);
    expect(html).not.toContain('data-see-everything');
    expect(html).toContain('CITY FORTIFIED');
  });
});

describe('Go ghost', () => {
  const complete = (level = 'simplest') => {
    const s = fresh(level);
    for (const m of MISSIONS) if (isCoreMission(m) && isMissionInPlay(s, m)) s.missions[m.id] = { status: 'completed' };
    return s;
  };
  const who = { status: 'ready', data: { city: 'Chicago', country: 'US', pod: { id: 'us-il-chicago', label: 'Chicago' } } };

  it('#/ghost Simple: Scout in short lines, "Step 1 of 2" as a bar, THAT\'S RIGHT lit, step 2 folded', () => {
    const html = renderGhost(complete(), { whoami: who });
    expectPattern(html);
    expect(textOf(html)).toContain(GHOST_LEADS.ghost);
    for (const l of GHOST_DIALOGUE.briefingSimple) {
      expect(l.split(/\s+/).length).toBeLessThanOrEqual(26);
      expect(html).toContain(l);
    }
    expect(html).not.toContain(GHOST_DIALOGUE.briefing);
    expect(above(html)).toMatch(/class="fill-bar[^"]*"[^>]*aria-label="Step 1 of 2"[^>]*aria-valuemax="2" aria-valuenow="1"/);
    expect(above(html)).toMatch(/<button class="btn-primary" data-action="whoami-confirm">THAT'S RIGHT<\/button>/);
    expect(above(html)).not.toContain('data-action="go-ghost"');
    expect(folded(html)).toMatch(/<button class="btn-secondary" data-action="go-ghost"/);
  });

  it('#/ghost Simple: after THAT\'S RIGHT, step 2 shows with GO GHOST lit, and nothing is folded', () => {
    const html = renderGhost(complete(), { whoami: who, whoamiConfirmed: true });
    expect(primaries(html)).toBe(1);
    expect(html).toMatch(/<button class="btn-primary" data-action="go-ghost"/);
    expect(html).toMatch(/aria-valuemax="2" aria-valuenow="2"/);
    expect(html).not.toContain('data-see-everything');
    // A place picked by hand, or our analytics out of reach, counts as step 1 done too.
    setChosenPod('us-il-chicago');
    expect(renderGhost(complete(), { whoami: who })).toMatch(/<button class="btn-primary" data-action="go-ghost"/);
    setChosenPod(null);
    expect(renderGhost(complete(), { whoami: { status: 'error' } })).toMatch(/<button class="btn-primary" data-action="go-ghost"/);
  });

  it('#/ghost Advanced: Scout\'s whole paragraph and both steps, as before', () => {
    const html = renderGhost(complete('full'), { whoami: who });
    expect(html).toContain(GHOST_DIALOGUE.briefing);
    expect(html).toContain('1 &middot; Look at what our analytics can see');
    expect(html).toMatch(/<button class="btn-primary" data-action="go-ghost">GO GHOST<\/button>/);
    expect(html).toContain('<button class="btn-secondary" data-action="whoami-confirm">');
    expect(html).not.toContain('data-simple-lead');
  });

  it('#/ghost/early Simple: one sentence above the three lines and GO GHOST NOW', () => {
    const html = renderGhostEarly(fresh(), {});
    expect(leads(html)).toBe(1);
    expect(primaries(html)).toBe(1);
    expect(html.indexOf('data-simple-lead')).toBeLessThan(html.indexOf('GO GHOST NOW'));
    expect(renderGhostEarly(fresh('full'), {})).not.toContain('data-simple-lead');
  });
});

describe('The garage', () => {
  const withCar = (s) => {
    const out = { ...s, vehicles: [{ make: 'Chevrolet', model: 'Bolt', year: '2020', nickname: '', addedAt: '2026-11-01T00:00:00Z' }], accounts: { ...s.accounts } };
    for (const id of ['car_gm', 'car_broker_lexisnexis', 'car_broker_verisk']) out.accounts[id] = { ...out.accounts[id], enabled: true };
    return out;
  };

  it('Simple, no car: the sentence and ADD YOUR CAR, which opens the form here (and is the card the form hides)', () => {
    const html = renderGarage(fresh());
    expect(leads(html)).toBe(1);
    expect(textOf(html)).toContain(GARAGE_LEAD);
    expect(primaries(html)).toBe(1);
    expect(html).toMatch(/<button type="button" class="btn-primary" data-action="show-add-vehicle" data-add-vehicle-card[^>]*>ADD YOUR CAR<\/button>/);
    expect((html.match(/data-add-vehicle-card/g) || []).length).toBe(1);
    expect(html.indexOf('data-add-vehicle-card')).toBeLessThan(html.indexOf('id="add-form-container"'));
  });

  it('Simple, with a car: the next opt-out is the bright button; the cars and ADD VEHICLE are folded', () => {
    const s = withCar(fresh());
    expect(nextCarOptOut(s).id).toBe('car_gm-optout-privacy');
    const html = renderGarage(s);
    expectPattern(html);
    expect(above(html)).toMatch(/class="btn-primary" data-garage-next href="#\/mission\/car_gm-optout-privacy\/briefing"/);
    expect(textOf(above(html))).toContain('Opens the “Privacy Opt-Out: GM” mission.');
    expect(folded(html)).toContain('2020 Chevrolet Bolt');
    expect(folded(html)).toContain('data-add-vehicle-card');
    // Then the brokers, then nothing left: ADD ANOTHER CAR.
    let all = s;
    for (const m of MISSIONS.filter((x) => ['car_gm', 'car_broker_lexisnexis', 'car_broker_verisk'].includes(x.accountId) && x.phase === 'fortify')) all = updateMission(all, m.id, { status: 'completed', action: 'action-done' });
    expect(nextCarOptOut(all)).toBe(null);
    expect(renderGarage(all)).toMatch(/class="btn-primary" data-action="show-add-vehicle" data-add-vehicle-card[^>]*>ADD ANOTHER CAR/);
  });

  it('Advanced: no sentence, no bright button, the dashed ADD VEHICLE card, as before', () => {
    const html = renderGarage(withCar(fresh('full')));
    expect(html).not.toContain('data-simple-lead');
    expect(primaries(html)).toBe(0);
    expect(html).toContain('VEHICLE GARAGE');
    expect(html).toMatch(/<div data-action="show-add-vehicle" data-add-vehicle-card role="button"/);
  });
});

describe('The saints', () => {
  it('Simple: one sentence, the deck, and About candles behind See everything; no bright button', () => {
    const html = renderSaints(fresh());
    expect(leads(html)).toBe(1);
    expect(textOf(html)).toContain(SAINTS_LEAD);
    expect(primaries(html)).toBe(0);
    expect(folded(html)).toContain('About candles');
    expect(above(html)).toContain('saints-deck');
    expect(renderSaints(fresh('full'))).toContain('<details class="phone-fold" data-fold="saints-candles" data-open-desktop>');
  });
});

describe('The facility districts in Simple (The Perimeter was 2,654px)', () => {
  const FACILITY = DISTRICTS.filter((d) => d.type === 'facility').map((d) => d.id);
  const rows = (html) => (noStyle(html).match(/class="facility-row[ "]/g) || []).length;
  const on = (s, id) => {
    const out = { ...s, accounts: { ...s.accounts } };
    for (const [k, a] of Object.entries(out.accounts)) if (a.district === id) out.accounts[k] = { ...a, enabled: true };
    return out;
  };

  it('every facility district: the lit mission and the next two, then "Show all N"', () => {
    expect(FACILITY).toEqual(expect.arrayContaining(['perimeter', 'reclamation', 'clinic', 'trail', 'field']));
    for (const id of FACILITY) {
      const s = on(fresh(), id);
      const html = renderDistrict(s, id);
      const total = getMissionsForDistrict(id).filter((m) => !m.legacy).length;
      expect(rows(html), id).toBe(SIMPLE_LIST_SHOWN);
      expect(html, id).toContain(`data-action="show-all-missions" data-list="${id}:facilities" aria-expanded="false">Show all ${total}</button>`);
      expect(primaries(html), id).toBe(1);
      expect(noStyle(html).match(/class="facility-row[^"]*"/)[0], id).toContain('facility-row--lead');
    }
  });

  it('"Show all" opens every facility in place, with "Show fewer"', () => {
    const html = renderDistrict(fresh(), 'perimeter', undefined, { openLists: new Set(['perimeter:facilities']) });
    expect(rows(html)).toBe(getMissionsForDistrict('perimeter').filter((m) => !m.legacy).length);
    expect(html).toContain('data-action="show-fewer-missions" data-list="perimeter:facilities" aria-expanded="true">Show fewer</button>');
    expect(html).toContain('href="#/quiz/phishing"');
  });

  it('done missions wait in a folded "Done (N)"; with all done, the phishing training is left up top', () => {
    const ms = getMissionsForDistrict('perimeter').filter((m) => !m.legacy);
    let s = fresh();
    s = updateMission(s, ms[0].id, { status: 'completed', action: 'action-done' });
    const html = renderDistrict(s, 'perimeter');
    expect(html).toMatch(/<details class="done-fold" data-fold="done:perimeter:facilities" data-done-fold>\s*<summary>Done \(1\)<\/summary>/);
    expect(rows(html)).toBe(SIMPLE_LIST_SHOWN + 1);
    for (const m of ms) s = updateMission(s, m.id, { status: 'completed', action: 'action-done' });
    const all = renderDistrict(s, 'perimeter');
    expect(all).toContain('href="#/quiz/phishing"');
    expect(all).toContain(`Done (${ms.length})`);
  });

  it('Advanced: every facility and every mission, as before', () => {
    const html = renderDistrict(fresh('full'), 'perimeter');
    expect(rows(html)).toBe(getMissionsForDistrict('perimeter').filter((m) => !m.legacy).length);
    expect(html).not.toContain('data-facility-list');
    expect(html).not.toContain('Show all');
  });
});
