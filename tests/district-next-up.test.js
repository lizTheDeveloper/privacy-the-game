import { describe, it, expect, beforeEach } from 'vitest';
import { renderDistrict, tabLeadMission, settleNextUp, afterTab, districtVisited, pinSurveyDone } from '../src/screens/district.js';
import { createInitialState, updateMission } from '../src/state.js';
import { setReadLevel, visibleSteps, markStep, stepKey, simpleTitle } from '../src/utils/reading.js';
import { getMissionsForDistrict, MISSIONS, missionDistrict } from '../src/data/missions.js';
import { DISTRICTS } from '../src/data/districts.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';
import { fileDebrief } from '../src/utils/debrief.js';
import { calcDistrictProgress } from '../src/utils/calc.js';

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
      // It is in Next up, under the district's name and bar and over the tabs (layout audit
      // 2026-11-20), and goes to the lead mission's briefing.
      const nextUp = html.indexOf('data-next-up');
      expect(nextUp).toBeGreaterThan(html.indexOf('% secured'));
      expect(nextUp).toBeLessThan(html.indexOf('?tab=survey'));
      expect(nextUp).toBeLessThan(at[0]);
      // Simple names it as the row does: its Simple name (7.38.0).
      const name = level === 'simplest' ? simpleTitle(lead) : lead.title;
      expect(html.slice(nextUp)).toMatch(new RegExp(`class="btn-primary btn-sm next-up-go" href="#/mission/${lead.id}/briefing" aria-label="Start ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">START</a>`));
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
    expect(html).toMatch(new RegExp(`<span class="next-up-label">Next:</span> <span class="next-up-name">${simpleTitle(lead)}</span>`));
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

  it('a lead behind a "Complete RECON first" gate is not the lead: no tab lights a gated mission', () => {
    // Fresh: every fortify mission is gated, so there is nothing on Fortify to light; Next up
    // points to Recon's lead instead (a finished or blocked tab is not a dead end).
    expect(tabLeadMission(fresh(), 'master-keys', 'fortify')).toBeNull();
    const html = strip(renderDistrict(fresh(), 'master-keys', 'fortify'));
    const recon = tabLeadMission(fresh(), 'master-keys', 'recon');
    expect(html).toContain('data-next-up="tab"');
    expect(html).not.toContain('data-next-up-twin');
    expect(primaryAt(html)).toHaveLength(1);
    expect(html).toContain(`class="btn-primary btn-sm next-up-go" href="#/mission/${recon.id}/briefing"`);
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
    // Pinned once the passwords question is answered (before that it sat over the chips).
    const html = strip(renderDistrict({ ...fresh('simplest'), passwordManager: 'apple' }, 'master-keys', 'survey'));
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

// Liz's layout audit (2026-11-20): a mid-game save defeated 7.34.1. On the Vault's Fortify tab the
// password-manager ask, the password resets, Scout's welcome and the bank notes all sat above the
// tabs, and Next up's START was at y≈1001 on a phone. The same save as the audit's: two email
// accounts, three money accounts, passwords in Apple Passwords, The Master Keys' Recon and Fortify
// filed (answers and all), the Vault's Recon filed but Venmo's.
function midGame(level) {
  let s = setReadLevel(createInitialState(), level);
  for (const [id, a] of Object.entries(s.accounts)) {
    if (a.district === 'master-keys') a.enabled = ['gmail', 'google'].includes(id);
    if (a.district === 'vault') a.enabled = ['primary_bank', 'credit_card', 'venmo'].includes(id);
  }
  s = { ...s, passwordManager: 'apple', gear: { phone: 'iphone', computer: 'windows' } };
  const file = (m) => {
    const answers = {};
    for (const q of m.debriefQs || []) {
      if (q.showIf) continue;
      const opt = (q.options || []).find((o) => o.severity !== 'skip') || (q.options || [])[0];
      if (q.type === 'number') answers[q.id] = '0';
      else if (q.multi) answers[q.id] = opt ? [opt.value] : [];
      else if (opt) answers[q.id] = opt.value;
    }
    const r = fileDebrief(s, m, answers);
    s = r ? r.state : updateMission(s, m.id, { status: 'completed' });
  };
  for (const m of MISSIONS) {
    if (!isMissionInPlay(s, m)) continue;
    const d = missionDistrict(m);
    if (d === 'master-keys' && m.phase !== 'reclaim') file(m);
    if (d === 'vault' && m.phase === 'recon' && m.accountId !== 'venmo') file(m);
  }
  return s;
}

describe('a mid-game save: the next mission comes before what the district says around it', () => {
  for (const level of ['simplest', 'full']) {
    it(`${level}: name and bar, Next up, tabs, list; then the password ask, resets, bank notes and Scout`, () => {
      const state = midGame(level);
      const html = strip(renderDistrict(state, 'vault', 'fortify'));
      const at = (k) => html.indexOf(k);
      // Everything the audit found above the tabs is still on the page (nothing removed) ...
      for (const k of ['data-pm-category="vault"', 'data-password-progress', 'bank-note-card', 'data-district-intro']) {
        expect(at(k), k).toBeGreaterThan(-1);
        // ... after the tabs and the mission list.
        expect(at(k), k).toBeGreaterThan(html.lastIndexOf('mission-row'));
      }
      expect(at('data-next-up')).toBeGreaterThan(at('% secured'));
      expect(at('data-next-up')).toBeLessThan(at('?tab=survey'));
      expect(at('?tab=survey')).toBeLessThan(at('mission-row'));
      // Nothing but the header between the top bar's end and Next up: no panel, no Scout.
      const between = html.slice(at('% secured'), at('data-next-up'));
      expect(between).not.toMatch(/class="panel|scout_0|bank-note/);
      expect(primaryAt(html)).toHaveLength(1);
    });
  }

  it('measured as on a 390×844 phone: the list’s START is on the first screen, so it is the bright one', () => {
    // Playwright on this save (Chromium, iPhone size): the lead row's START is at y=414 (it was
    // 1001); Next up's own START stays hidden. settleNextUp, with the button where it was measured:
    const classSet = (...c) => { const set = new Set(c); return { set, toggle: (x, on) => (on ? set.add(x) : set.delete(x)) }; };
    const twin = { classList: classSet('btn-secondary'), getBoundingClientRect: () => ({ top: 414, bottom: 458 }) };
    const go = { classList: classSet('btn-primary') };
    const row = { style: { display: '' }, querySelector: () => go };
    globalThis.scrollY = 0;
    settleNextUp({ querySelector: (sel) => ({ '[data-next-up]': row, '[data-next-up-twin]': twin }[sel] ?? null) }, 844);
    expect(twin.classList.set.has('btn-primary')).toBe(true);
    expect(row.style.display).toBe('none');
  });

  it('the password-manager ask does not gate the next mission: it asks for itself (7.30.0)', () => {
    // A Fortify password mission has steps by password manager and asks where the passwords are on
    // its own "Before you start", so the district's ask never has to stay above Next up.
    const state = midGame('simplest');
    const lead = tabLeadMission(state, 'vault', 'fortify');
    expect(lead).toBeTruthy();
    const html = strip(renderDistrict({ ...state, passwordManager: '' }, 'vault', 'fortify'));
    expect(html.indexOf('data-next-up')).toBeLessThan(html.indexOf('?tab=survey'));
  });
});

describe('Scout’s welcome: open on the first visit to a district, folded after', () => {
  it('first visit: open, with DISMISS', () => {
    const html = renderDistrict(fresh('simplest'), 'vault', 'recon', { firstVisit: true });
    expect(html).toContain('data-district-intro');
    expect(html).not.toContain('data-intro-fold');
    expect(html).toContain('data-action="dismiss-intro"');
  });
  it('a later visit: one line that opens it (still there, still dismissable)', () => {
    const html = renderDistrict(fresh('simplest'), 'vault', 'recon', { firstVisit: false });
    expect(html).toMatch(/<details class="intro-fold" data-intro-fold>/);
    expect(html).toContain('data-action="dismiss-intro"');
  });
  it('a save with work done in a district has been there; a new one has not', () => {
    expect(districtVisited(fresh(), 'vault')).toBe(false);
    expect(districtVisited(midGame('full'), 'vault')).toBe(true);
    expect(districtVisited({ ...fresh(), districtVisits: { vault: true } }, 'vault')).toBe(true);
    expect(renderDistrict(midGame('full'), 'vault', 'fortify')).toContain('data-intro-fold');
  });
  it('the Vault shows one Scout over its notes after the first visit, not a big one', () => {
    const html = renderDistrict(midGame('simplest'), 'vault', 'fortify');
    expect((html.match(/width: 52px; height: 52px/g) || []).length).toBe(1); // inside the fold
    expect(html.indexOf('width: 52px')).toBeGreaterThan(html.indexOf('data-intro-fold'));
  });
});

describe('a finished tab is not a dead end: Next up says where to go', () => {
  const lit = (html) => {
    const h = strip(html);
    const at = primaryAt(h);
    expect(at).toHaveLength(1);
    return h.slice(at[0], at[0] + 200);
  };

  it('Recon done, Fortify has work: Next up is Fortify’s lead, and says it is on Fortify', () => {
    const recon = getMissionsForDistrict('master-keys').filter((m) => m.phase === 'recon');
    const state = doneAll(fresh('full'), recon);
    const fortify = tabLeadMission(state, 'master-keys', 'fortify');
    expect(fortify).toBeTruthy();
    const html = renderDistrict(state, 'master-keys', 'recon');
    expect(html).toContain('data-next-up="tab"');
    expect(html).toContain('NEXT UP · FORTIFY TAB');
    expect(lit(html)).toContain(`href="#/mission/${fortify.id}/briefing"`);
  });

  it('a district taken back (the audit’s Master Keys at 100%): the milestone, until it has been seen', () => {
    const state = midGame('simplest');
    expect(calcDistrictProgress(state, 'master-keys').percent).toBe(100);
    for (const tab of ['recon', 'fortify']) {
      const html = renderDistrict(state, 'master-keys', tab);
      expect(html).toContain('data-next-up="milestone"');
      expect(lit(html)).toContain('href="#/milestone/master-keys"');
    }
    // No bonus mission first, on a district already taken back.
    expect(afterTab(state, DISTRICTS.find((d) => d.id === 'master-keys'), 'recon').kind).toBe('milestone');
  });

  it('milestone seen: What’s next in Simple; the district the next mission is in, in Advanced', () => {
    const seen = (s) => ({ ...s, seenMilestones: { 'master-keys': true } });
    const simple = renderDistrict(seen(midGame('simplest')), 'master-keys', 'recon');
    expect(simple).toContain('data-next-up="next"');
    expect(lit(simple)).toContain('href="#/next"');
    const advanced = renderDistrict(seen(midGame('full')), 'master-keys', 'recon');
    expect(advanced).toContain('data-next-up="district"');
    expect(lit(advanced)).toContain('href="#/district/vault"');
    // A 100% seen in play (afterMissionRecorded) counts as seen too.
    const played = { ...midGame('full'), seenProgress: { 'master-keys': [25, 50, 75, 100] } };
    expect(renderDistrict(played, 'master-keys', 'recon')).not.toContain('data-next-up="milestone"');
  });

  it('every district, every tab, both modes, fresh and mid-game: never more than one bright button', () => {
    for (const level of ['simplest', 'full']) {
      for (const state of [fresh(level), midGame(level)]) {
        for (const d of DISTRICTS) {
          for (const tab of ['survey', 'recon', 'fortify', 'reclaim']) {
            expect(primaryAt(renderDistrict(state, d.id, tab)).length, `${level} ${d.id} ${tab}`).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
});

describe('Survey: DONE WITH SURVEY does not pin over the passwords question', () => {
  const mk = DISTRICTS.find((d) => d.id === 'master-keys');
  it('unanswered: in the page’s flow, after the question', () => {
    const html = strip(renderDistrict(fresh('simplest'), 'master-keys', 'survey'));
    expect(pinSurveyDone(fresh(), mk)).toBe(false);
    expect(html).not.toContain('pin-bottom');
    expect(html).toMatch(/<div class="survey-done"[^>]*>\s*<a class="btn-primary"[^>]*>DONE WITH SURVEY/);
    expect(html.indexOf('data-pm-question')).toBeLessThan(html.indexOf('DONE WITH SURVEY'));
  });
  it('answered (one place or two): pinned again', () => {
    expect(pinSurveyDone({ ...fresh(), passwordManager: 'none' }, mk)).toBe(true);
    expect(pinSurveyDone({ ...fresh(), passwordManager: 'apple', passwordPlaces: ['apple', 'google'] }, mk)).toBe(true);
  });
  it('a district that doesn’t ask: pinned as before', () => {
    expect(pinSurveyDone(fresh(), DISTRICTS.find((d) => d.id === 'vault'))).toBe(true);
  });
  it('the question reads as a question, and its chips are 44px taps', () => {
    const html = renderDistrict(fresh('simplest'), 'master-keys', 'survey');
    expect(html).toContain('<div class="district-q" data-pm-question>Where are your passwords saved?</div>');
    expect(html).not.toContain('WHERE ARE YOUR PASSWORDS SAVED?');
    expect(html).toMatch(/<span class="pm-chip" data-action="set-password-manager"/);
  });
});
