import { describe, it, expect, beforeEach } from 'vitest';
import { renderDistrict, tabLeadMission, settleNextUp } from '../src/screens/district.js';
import { createInitialState, updateMission } from '../src/state.js';
import { setReadLevel, visibleSteps, markStep, stepKey } from '../src/utils/reading.js';
import { getMissionsForDistrict } from '../src/data/missions.js';
import { DISTRICTS } from '../src/data/districts.js';

// Liz (2026-11-19), on a district's one bright button sitting below a phone's first screen:
// "district yes if its nav". A bright button that takes you somewhere (the next mission's
// START) comes up under the tab bar as Next up; one that acts in place (TURN ON THE FIELD) stays.

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

const strip = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaryAt = (html) => [...strip(html).matchAll(/class="[^"]*\bbtn-primary\b[^"]*"/g)].map((m) => m.index);
const fresh = (level = 'full') => setReadLevel(createInitialState(), level);
const doneAll = (state, missions) => missions.reduce((s, m) => updateMission(s, m.id, { status: 'completed' }), state);

// Half The Master Keys' recon filed: the next one sits under five done rows.
function midRecon(level) {
  const recon = getMissionsForDistrict('master-keys').filter((m) => m.phase === 'recon');
  return { state: doneAll({ ...fresh(level), seenIntros: { 'master-keys': true } }, recon.slice(0, Math.floor(recon.length / 2))), recon };
}

describe('Next up: the lead mission comes up to the top of the tab', () => {
  for (const level of ['simplest', 'full']) {
    it(`${level}: one bright button, before the mission list, for the lead mission`, () => {
      const { state } = midRecon(level);
      const lead = tabLeadMission(state, 'master-keys', 'recon');
      expect(lead).toBeTruthy();
      const html = strip(renderDistrict(state, 'master-keys', 'recon'));
      const at = primaryAt(html);
      expect(at).toHaveLength(1);
      const list = html.indexOf('mission-row');
      expect(list).toBeGreaterThan(0);
      expect(at[0]).toBeLessThan(list);
      // It is in Next up, under the tab bar, and goes to the lead mission's briefing.
      const nextUp = html.indexOf('data-next-up');
      expect(nextUp).toBeGreaterThan(html.lastIndexOf('?tab=reclaim'));
      expect(nextUp).toBeLessThan(at[0]);
      expect(html.slice(nextUp)).toMatch(new RegExp(`class="btn-primary btn-sm next-up-go" href="#/mission/${lead.id}/briefing" aria-label="Start ${lead.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">START</a>`));
      // Nothing left the list: the lead row is still lit, with an outlined twin of the button.
      expect((html.match(/mission-row--lead/g) || []).length).toBe(1);
      expect(html).toMatch(new RegExp(`class="btn-secondary btn-sm" data-next-up-twin href="#/mission/${lead.id}/briefing">START</a>`));
    });
  }

  it('Simple reads plainly: "Next: <mission>"', () => {
    const { state } = midRecon('simplest');
    const lead = tabLeadMission(state, 'master-keys', 'recon');
    const html = renderDistrict(state, 'master-keys', 'recon');
    expect(html).toContain('next-up--simple');
    expect(html).toMatch(new RegExp(`<span class="next-up-label">Next:</span> <span class="next-up-name">${lead.title}</span>`));
  });

  it('Advanced keeps a NEXT UP label', () => {
    const { state } = midRecon('full');
    const html = renderDistrict(state, 'master-keys', 'recon');
    expect(html).not.toContain('next-up--simple');
    expect(html).toContain('<span class="next-up-label">NEXT UP</span>');
  });

  it('a begun mission says CONTINUE, with a real link name', () => {
    const { state } = midRecon('full');
    const lead = tabLeadMission(state, 'master-keys', 'recon');
    const [first] = visibleSteps(lead, state);
    const begun = markStep(state, lead.id, stepKey(first), 'done');
    const html = strip(renderDistrict(begun, 'master-keys', 'recon'));
    expect(html).toContain(`aria-label="Continue ${lead.title}">CONTINUE</a>`);
    expect(primaryAt(html)).toHaveLength(1);
  });

  it('a facility district: Next up under its fill bar, one bright button, before the rows', () => {
    const perimeter = DISTRICTS.find((d) => d.id === 'perimeter');
    const missions = getMissionsForDistrict('perimeter');
    const state = doneAll(fresh('full'), missions.slice(0, Math.floor(missions.length / 2)));
    const html = strip(renderDistrict(state, perimeter.id));
    const at = primaryAt(html);
    expect(at).toHaveLength(1);
    expect(html.indexOf('data-next-up')).toBeGreaterThan(html.indexOf('% secured'));
    expect(at[0]).toBeLessThan(html.indexOf('facility-row'));
    expect((html.match(/facility-row--lead/g) || []).length).toBe(1);
  });

  it('every mission done in a district with training: Next up is the phishing training', () => {
    const missions = getMissionsForDistrict('perimeter');
    const html = strip(renderDistrict(doneAll(fresh('full'), missions), 'perimeter'));
    const at = primaryAt(html);
    expect(at).toHaveLength(1);
    expect(html.slice(at[0], at[0] + 200)).toContain('href="#/quiz/phishing"');
    expect(html).toContain('<span class="next-up-name">Phishing training</span>');
  });

  it('a tab with nothing to do next has no Next up', () => {
    const recon = getMissionsForDistrict('master-keys').filter((m) => m.phase === 'recon');
    const html = renderDistrict(doneAll(fresh(), recon), 'master-keys', 'recon');
    expect(html).not.toContain('data-next-up');
  });

  it('a lead behind a "Complete RECON first" gate is not the lead: no tab lights a gated mission', () => {
    // Fresh: every fortify mission is gated, so there is nothing to light (and no Next up).
    expect(tabLeadMission(fresh(), 'master-keys', 'fortify')).toBeNull();
    expect(renderDistrict(fresh(), 'master-keys', 'fortify')).not.toContain('data-next-up');
  });
});

describe('an in-place bright button stays where it is', () => {
  it('The Field, off: TURN ON is the one bright button, a button (not a link), and nothing moves', () => {
    const html = strip(renderDistrict(fresh('full'), 'field'));
    const at = primaryAt(html);
    expect(at).toHaveLength(1);
    expect(html.slice(at[0] - 40, at[0] + 120)).toMatch(/<button class="btn-primary" data-action="district-opt-in"/);
    expect(html).not.toContain('data-next-up');
    expect(html).not.toContain('data-next-up-twin');
  });

  it('Survey: DONE WITH SURVEY stays the one bright button, pinned to the bottom of a phone, not moved up', () => {
    const html = strip(renderDistrict(fresh('simplest'), 'master-keys', 'survey'));
    expect(primaryAt(html)).toHaveLength(1);
    expect(html).not.toContain('data-next-up');
    expect(html).toMatch(/<div class="pin-bottom survey-done"[^>]*>\s*<a class="btn-primary"[^>]*>DONE WITH SURVEY/);
  });
});

describe('settleNextUp: Next up shows only when the list’s button is off the first screen', () => {
  const classSet = (...c) => { const set = new Set(c); return { set, toggle: (x, on) => (on ? set.add(x) : set.delete(x)) }; };
  function page(twinBottom) {
    const twinClasses = classSet('btn-secondary', 'btn-sm');
    const goClasses = classSet('btn-primary', 'btn-sm', 'next-up-go');
    const go = { classList: goClasses };
    const row = { style: { display: '' }, querySelector: (sel) => (sel === '.next-up-go' ? go : null) };
    const twin = { classList: twinClasses, getBoundingClientRect: () => ({ top: twinBottom - 27, bottom: twinBottom }) };
    const root = { querySelector: (sel) => ({ '[data-next-up]': row, '[data-next-up-twin]': twin }[sel] ?? null) };
    const lit = () => [twinClasses.set.has('btn-primary') && 'list', goClasses.set.has('btn-primary') && 'next-up'].filter(Boolean);
    return { root, row, lit, move: (y) => { twinBottom = y; } };
  }
  beforeEach(() => { globalThis.scrollY = 0; });

  it('on the first screen anyway: Next up is hidden, and the list’s button is the one bright button', () => {
    const p = page(617);
    settleNextUp(p.root, 844);
    expect(p.row.style.display).toBe('none');
    expect(p.lit()).toEqual(['list']);
  });

  it('below the first screen: Next up shows and is the one bright button', () => {
    const p = page(1115);
    settleNextUp(p.root, 844);
    expect(p.row.style.display).toBe('');
    expect(p.lit()).toEqual(['next-up']);
  });

  it('a picture landing pushes the list down: measured again, Next up comes back (nothing was removed)', () => {
    const p = page(841);
    settleNextUp(p.root, 844);
    expect(p.lit()).toEqual(['list']);
    p.move(958);
    settleNextUp(p.root, 844);
    expect(p.row.style.display).toBe('');
    expect(p.lit()).toEqual(['next-up']);
  });

  it('no Next up on the page (or no layout to measure): nothing happens', () => {
    expect(() => settleNextUp({ querySelector: () => null }, 844)).not.toThrow();
    expect(() => settleNextUp(null, 844)).not.toThrow();
  });
});
