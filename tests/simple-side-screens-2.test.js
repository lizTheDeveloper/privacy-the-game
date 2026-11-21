// Simple mode on the side screens, part 2 (Liz 2026-11-21): PRISM, the leak pages, the government
// map, the broker sky, the Big Check, a building, the social timeline and the phishing training.
// One plain sentence, one bright button, everything else behind "See everything"; the jargon in
// plain words, and the spy code names as what each program did. Advanced stays as it was.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialState } from '../src/state.js';
import { setReadLevel, plainWords } from '../src/utils/reading.js';
import { _resetSeeEverything } from '../src/components/see-everything.js';
import { renderPrism, PRISM_SIMPLE_LEAD } from '../src/screens/prism.js';
import { renderLeak } from '../src/screens/leak.js';
import { renderGovernment, GOV_SIMPLE_LEAD } from '../src/screens/government.js';
import { renderBrokerMap, simpleScoutLine } from '../src/screens/broker-map.js';
import { renderBigCheck, BIG_CHECK_LEAD } from '../src/screens/big-check.js';
import { renderBuildingInterior, buildingLead } from '../src/screens/building.js';
import { renderTimeline, TIMELINE_LEAD } from '../src/screens/timeline.js';
import { renderPhishingQuiz, PHISHING_LEAD } from '../src/screens/phishing-quiz.js';
import { renderCityTogether } from '../src/screens/city-together.js';
import { whatYouCanDo } from '../src/components/what-you-can-do.js';
import { prismTag } from '../src/components/prism-tag.js';
import { LEAKS, leakById, GOV_DATA } from '../src/data/leaks/index.js';
import { LEAK_SIMPLE } from '../src/data/leaks/simple.js';
import { leakMissionIds } from '../src/data/leaks/actions.js';
import { simplePrismText, prismLabel } from '../src/data/prism.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { BROKER_MAP_DIALOGUE } from '../src/data/dialogue.js';
import { textOf } from './helpers/on-page.mjs';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); _resetSeeEverything(); });

const noStyle = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaries = (html) => (noStyle(html).match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
const fresh = (level = 'simplest') => setReadLevel(createInitialState(), level);
const above = (html) => { const i = html.indexOf('data-see-everything'); return i < 0 ? html : html.slice(0, i); };
const folded = (html) => { const i = html.indexOf('class="see-all-body"'); return i < 0 ? '' : html.slice(i); };
const leads = (html) => (html.match(/data-simple-lead/g) || []).length;
const FOLD = /<button type="button" class="list-more see-all-btn" data-action="see-everything" data-fold-key="[^"]+" aria-expanded="false"(?: aria-controls="see-all-[^"]+")?>See everything<\/button><div class="see-all-body"(?: id="see-all-[^"]+")? hidden>/;

function expectPattern(html, { fold = true } = {}) {
  expect(leads(html)).toBe(1);
  expect(primaries(html)).toBe(1);
  expect(primaries(above(html))).toBe(1);
  const h = noStyle(html);
  expect(h.indexOf('data-simple-lead')).toBeLessThan(h.search(/class="[^"]*\bbtn-primary\b/));
  if (fold) expect(html).toMatch(FOLD);
}

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const sky = (s, opts = {}) => renderBrokerMap(s, { status: 'ready', data: { map, layout }, today: '2026-11-21', ...opts });
const check = (s, opts = {}) => renderBigCheck(s, { status: 'ready', data: { map }, today: '2026-11-21', ...opts });

describe('PRISM', () => {
  it('Simple: the diagram, one sentence about PRISM and you, PRISM BREAK lit; the slides and the rest folded', () => {
    const html = renderPrism(fresh());
    expectPattern(html);
    expect(html.indexOf('class="prism-diagram"')).toBeLessThan(html.indexOf('data-simple-lead'));
    expect(textOf(above(html))).toMatch(new RegExp(`${PRISM_SIMPLE_LEAD} \\d of your companies (was|were) on the slides\\.`));
    expect(above(html)).toMatch(/<a class="btn-primary" href="https:\/\/prism-break\.org/);
    for (const k of ['WHO WAS ON THE SLIDES', 'WHAT IT WAS', 'SAINT EDWARD SNOWDEN', 'SOURCES', 'NSA CABLE TAP label']) expect(folded(html), k).toContain(k);
  });

  it('Advanced: no sentence, no fold, UPSTREAM in the cables copy', () => {
    const html = renderPrism(fresh('full'));
    expect(html).not.toContain('data-simple-lead');
    expect(html).not.toContain('data-see-everything');
    expect(html).toContain('carries an UPSTREAM label');
  });
});

describe('the leak pages', () => {
  it('every badge has a plain sentence, and every code name a plain badge (24 characters at most)', () => {
    for (const e of LEAKS) {
      expect(e.simpleLead, e.id).toBeTruthy();
      expect(e.simpleLead.split(/\s+/).length, e.id).toBeLessThanOrEqual(30);
      if (e.simpleBadge) expect(e.simpleBadge.length, e.id).toBeLessThanOrEqual(24);
    }
    // Nothing in simple.js names a badge that doesn't exist.
    for (const id of Object.keys(LEAK_SIMPLE)) expect(leakById(id), id).not.toBeNull();
    // The 7.39.0 one keeps its words.
    expect(leakById('ant-catalog').simpleBadge).toBe('NSA SPY TOOLS');
  });

  it('a code name reads as what the program did', () => {
    const plain = { muscular: 'TAPPED GOOGLE & YAHOO', dishfire: 'NSA TAKES TEXTS', 'weeping-angel': 'TV LISTENS WHEN OFF', xkeyscore: 'NSA SEARCH ENGINE', venntel: 'LOCATION SOLD TO ICE', stingrays: 'FAKE CELL TOWERS' };
    for (const [id, words] of Object.entries(plain)) expect(leakById(id).simpleBadge, id).toBe(words);
  });

  it('Simple: the plain name, the code name small, one sentence, What you can do lit; the rest folded', () => {
    for (const e of LEAKS.filter((x) => x.id !== 'prism' && leakMissionIds(x).length)) {
      const html = renderLeak(fresh(), e);
      expect(leads(html), e.id).toBe(1);
      expect(primaries(html), e.id).toBeLessThanOrEqual(1);
      expect(primaries(folded(html)), e.id).toBe(0);
      expect(html, e.id).toMatch(FOLD);
      expect(folded(html), e.id).toContain('WHAT IT IS');
    }
    const html = renderLeak(fresh(), leakById('muscular'));
    expect(html).toMatch(/<h1>TAPPED GOOGLE &amp; YAHOO<span class="leak-code" data-leak-code>MUSCULAR · 2013<\/span><\/h1>/);
    expect(textOf(above(html))).toContain(leakById('muscular').simpleLead);
    expectPattern(html);
  });

  it('Advanced: the title, the meta line and every panel, as before', () => {
    const html = renderLeak(fresh('full'), leakById('muscular'));
    expect(html).toContain(`<h1>${leakById('muscular').title}</h1>`);
    expect(html).not.toContain('data-simple-lead');
    expect(html).not.toContain('data-see-everything');
  });

  it('badges: plain names in Simple (leaks and the PRISM label), code names in Advanced', () => {
    expect(prismTag('gmail', { simple: true })).toContain('TAPPED GOOGLE &amp; YAHOO');
    expect(prismTag('gmail', { simple: true })).toContain(simplePrismText(prismLabel('gmail', ACCOUNTS)));
    expect(textOf(prismTag('gmail', { simple: true }))).not.toMatch(/MUSCULAR|PRISM · /);
    expect(prismTag('gmail')).toContain('MUSCULAR');
    expect(prismTag('gmail')).toContain('PRISM · ');
    expect(simplePrismText({ kind: 'named', since: 2009 })).toBe('NSA HAS ACCESS · 2009');
    expect(simplePrismText({ kind: 'next' })).toBe('NEXT FOR THE NSA');
    expect(simplePrismText({ kind: 'upstream' })).toBe('NSA CABLE TAP');
  });
});

describe('Who gets your data', () => {
  it('Simple: one sentence, What you can do lit above the map; the key, the scale, the myths and the list folded', () => {
    const html = renderGovernment(fresh(), GOV_DATA);
    expectPattern(html);
    expect(textOf(html)).toContain(GOV_SIMPLE_LEAD);
    expect(above(html).indexOf('data-what-you-can-do')).toBeLessThan(above(html).indexOf('class="gov-map"'));
    for (const k of ['class="gov-legend"', 'The scale', 'The movie, and the paperwork', 'Everything on the map', 'TOP SECRET']) expect(folded(html), k).toContain(k);
  });

  it('Simple names agencies in full: the list, the ruler, and PART OF', () => {
    const html = renderGovernment(fresh(), GOV_DATA, { selected: 'NCTC' });
    expect(folded(html)).toContain('>National Counterterrorism Center</button>');
    expect(folded(html)).toContain('>Privacy and Civil Liberties Oversight Board</button>');
    expect(html).toContain('PART OF Office of the Director of National Intelligence');
    expect(renderGovernment(fresh('full'), GOV_DATA, { selected: 'NCTC' })).toContain('PART OF ODNI');
    expect(renderGovernment(fresh('full'), GOV_DATA)).toContain('>NCTC</button>');
  });

  it('a file\'s badges use the plain names in Simple', () => {
    const html = renderGovernment(fresh(), GOV_DATA, { selected: 'NSA' });
    const file = html.slice(html.indexOf('class="gov-file"'));
    expect(file).toContain('◈ TAPPED GOOGLE &amp; YAHOO');
    expect(file).not.toContain('◈ MUSCULAR');
    expect(renderGovernment(fresh('full'), GOV_DATA, { selected: 'NSA' })).toContain('◈ MUSCULAR');
  });
});

describe('The broker sky', () => {
  it('Simple: one sentence with no "field" or "stars", the next opt-out lit; the list, key, DROP and the rest folded', () => {
    const html = sky(fresh(), { firstVisit: true });
    expect(leads(html)).toBe(1);
    expect(primaries(above(html))).toBe(1);
    expect(primaries(folded(html))).toBe(0);
    expect(html).toMatch(FOLD);
    const top = textOf(above(html));
    expect(top).toContain('Data brokers sell facts about you.');
    expect(top).not.toMatch(/\bfield\b|\bstars?\b|\bhubs?\b|FIELD COVERED/i);
    expect(top).toContain(BROKER_MAP_DIALOGUE.firstVisitSimple);
    for (const k of ['class="constellation-list"', 'class="map-key', 'map-drop-line', 'THE BIG CHECK']) expect(folded(html), k).toContain(k);
    // DROP keeps its one-line explanation.
    expect(textOf(folded(html))).toMatch(/DROP is California's one form that asks every registered broker to delete you/);
  });

  it('Simple says brokers, not stars, on the ladder; and no hubs', () => {
    const html = sky(fresh());
    expect(textOf(html)).not.toMatch(/\d+ stars?\b|stars mapped/);
    expect(textOf(html)).toMatch(/\d+ brokers?\b/);
    expect(simpleScoutLine(BROKER_MAP_DIALOGUE.firstHub)).toBeNull();
    expect(simpleScoutLine(BROKER_MAP_DIALOGUE.opened)).toBe(BROKER_MAP_DIALOGUE.openedSimple);
    expect(simpleScoutLine(BROKER_MAP_DIALOGUE.sweep)).toBe(BROKER_MAP_DIALOGUE.sweep);
  });

  it('Advanced: FIELD COVERED and HUBS, the stars, no fold', () => {
    const html = sky(fresh('full'), { firstVisit: true });
    expect(html).toContain('FIELD COVERED');
    expect(html).toContain(BROKER_MAP_DIALOGUE.firstVisit);
    expect(html).not.toContain('data-see-everything');
  });
});

describe('The Big Check', () => {
  it('Simple: one sentence, Start here open with its first opt-out lit and first; the filter and the other groups folded', () => {
    const html = check(fresh());
    expectPattern(html);
    expect(textOf(html)).toContain(BIG_CHECK_LEAD);
    const start = above(html).slice(above(html).indexOf('data-start-here'));
    const firstRow = start.slice(start.indexOf('<li class="big-check-row'), start.indexOf('</li>'));
    expect(firstRow).toMatch(/<a class="btn-primary" data-big-check-next href="https?:/);
    expect(folded(html)).toContain('data-big-check-filter');
    // No id attribute anywhere on this screen (PRIVATE_UI): the fold has none either.
    expect(noStyle(html.slice(html.indexOf('<div class="big-check')))).not.toMatch(/\s(?:id|name|title)="/);
  });

  it('Simple says "Check", not "Sweep", in mission names; Advanced keeps them', () => {
    expect(textOf(check(fresh()))).not.toMatch(/\bSweep\b/);
    expect(textOf(check(fresh('full')))).toMatch(/Extended Sweep/);
  });
});

describe('A building', () => {
  it('Simple: one sentence naming who the open doors let in, before the one bright button', () => {
    const html = renderBuildingInterior(fresh(), 'gmail');
    expect(leads(html)).toBe(1);
    expect(textOf(html)).toContain(buildingLead(ACCOUNTS.gmail));
    expect(buildingLead(ACCOUNTS.gmail)).toMatch(/hacker or scammer/);
    expect(primaries(html)).toBe(1);
    expect(html.indexOf('data-simple-lead')).toBeLessThan(noStyle(html).search(/class="[^"]*\bbtn-primary\b/) + (html.length - noStyle(html).length));
    // The badges in Simple are the plain ones.
    expect(html).toContain('TAPPED GOOGLE &amp; YAHOO');
    expect(html).toContain('A fresh check lights them back up.');
    expect(renderBuildingInterior(fresh('full'), 'gmail')).toContain('MUSCULAR');
    expect(renderBuildingInterior(fresh('full'), 'gmail')).not.toContain('data-simple-lead');
  });
});

describe('The social timeline', () => {
  const social = (level) => {
    const s = fresh(level);
    for (const id of ['instagram', 'facebook', 'twitter']) s.accounts[id] = { ...(s.accounts[id] || {}), enabled: true };
    return s;
  };
  it('Simple: one sentence, the bar, the first SET UP lit and the platform question; the other cards folded', () => {
    const html = renderTimeline(social());
    expectPattern(html);
    expect(textOf(html)).toContain(TIMELINE_LEAD);
    expect((above(html).match(/data-action="edit-social-profile"/g) || []).length).toBe(1);
    expect(above(html)).toContain('data-tl-pick');
    const all = (renderTimeline(social('full')).match(/data-action="edit-social-profile"/g) || []).length;
    expect(all).toBeGreaterThan(2);
    expect((folded(html).match(/data-action="edit-social-profile"/g) || []).length).toBe(all - 1);
    expect(folded(html)).toContain('data-setup-note');
  });
  it('Advanced: every card, no fold', () => {
    const html = renderTimeline(social('full'));
    expect((html.match(/data-action="edit-social-profile"/g) || []).length).toBeGreaterThanOrEqual(3);
    expect(html).not.toContain('data-see-everything');
  });
});

describe('Scam defense training', () => {
  it('Simple: one sentence naming scammers, a bar that fills, "What gave it away?"', () => {
    const html = renderPhishingQuiz(fresh());
    expect(leads(html)).toBe(1);
    expect(textOf(html)).toContain(PHISHING_LEAD);
    expect(html).toMatch(/data-quiz-progress[^>]*>\s*<div class="fill-bar/);
    expect(html).toContain('WHAT GAVE IT AWAY?');
    expect(html).not.toContain('>THE TELL<');
  });
  it('Advanced: THE TELL and the thin bar, as before', () => {
    const html = renderPhishingQuiz(fresh('full'));
    expect(html).toContain('>THE TELL<');
    expect(html).not.toContain('data-simple-lead');
  });
});

describe('Plain words for jargon, in Simple only', () => {
  it('2FA is Two-step sign-in; a sweep is a check', () => {
    expect(plainWords('2FA Setup: Gmail')).toBe('Two-step sign-in Setup: Gmail');
    expect(plainWords('Extended Sweep: Phone & People Lookup')).toBe('Extended Check: Phone & People Lookup');
    expect(plainWords('A fresh SWEEP')).toBe('A fresh CHECK');
  });

  it('What you can do names missions plainly in Simple', () => {
    const ids = ['gmail-fortify-2fa'];
    expect(whatYouCanDo(fresh(), ids)).toContain('Two-step sign-in Setup: Gmail ›');
    expect(whatYouCanDo(fresh('full'), ids)).toContain('2FA Setup: Gmail ›');
  });

  it('The Whole City: TWO-STEP SIGN-IN ON in Simple, TWO-FACTOR ON in Advanced', () => {
    const data = { k: 50, city: { players: 1, actions: 2, twoFactor: 3, fortified: { pct: 1 } }, pods: [] };
    expect(renderCityTogether(fresh(), { collective: { status: 'ready', data } })).toContain('TWO-STEP SIGN-IN ON');
    expect(renderCityTogether(fresh('full'), { collective: { status: 'ready', data } })).toContain('TWO-FACTOR ON');
  });
});
