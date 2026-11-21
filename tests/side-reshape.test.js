// The side screens, reshaped (Liz 2026-11-20, picks 8, 10, 11, 12, 13): What you can do on every
// explainer; the broker map's next rung under a shorter sky; the government's files as a sheet on a
// phone; the timeline's form inside the tapped card; the Big Check starting with people search.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialState, updateMission } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { MISSIONS } from '../src/data/missions.js';
import { LEAKS, leakById, GOV_DATA } from '../src/data/leaks/index.js';
import { ACCOUNT_MISSIONS, GOV_MISSIONS, GOV_BROKER_MISSION, leakMissionIds } from '../src/data/leaks/actions.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { actionRows, whatYouCanDo } from '../src/components/what-you-can-do.js';
import { renderLeak } from '../src/screens/leak.js';
import { renderPrism } from '../src/screens/prism.js';
import { renderGovernment } from '../src/screens/government.js';
import { renderCityTogether } from '../src/screens/city-together.js';
import { renderBrokerMap } from '../src/screens/broker-map.js';
import { ladderPanel } from '../src/components/sky-ladder.js';
import { renderTimeline } from '../src/screens/timeline.js';
import { renderBigCheck } from '../src/screens/big-check.js';
import { setHome } from '../src/utils/broker-state.js';
import { textOf } from './helpers/on-page.mjs';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

const noStyle = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaries = (html) => (noStyle(html).match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
const fresh = (level = 'simplest') => setReadLevel(createInitialState(), level);
const IDS = new Set(MISSIONS.map((m) => m.id));
const withCar = (s) => {
  const out = { ...s, vehicles: [{ make: 'Chevrolet', model: 'Bolt', year: '2020', nickname: '', addedAt: '2026-11-01T00:00:00Z' }], accounts: { ...s.accounts } };
  for (const id of ['car_gm', 'car_broker_lexisnexis', 'car_broker_verisk']) out.accounts[id] = { ...out.accounts[id], enabled: true };
  return out;
};
const done = (s, id) => updateMission(s, id, { status: 'completed', action: 'action-done' });

describe('Pick 8: What you can do', () => {
  it('every mission id a leak, an account or the government map points at exists', () => {
    for (const e of LEAKS) for (const id of e.missions ?? []) expect(IDS.has(id), `${e.id} → ${id}`).toBe(true);
    for (const [acct, id] of Object.entries(ACCOUNT_MISSIONS)) {
      expect(ACCOUNTS[acct], acct).toBeTruthy();
      expect(IDS.has(id), `${acct} → ${id}`).toBe(true);
      // An account's mission is that account's own.
      expect(MISSIONS.find((m) => m.id === id).accountId).toBe(acct);
    }
    for (const id of GOV_MISSIONS) expect(IDS.has(id), id).toBe(true);
    expect(GOV_MISSIONS).toContain(GOV_BROKER_MISSION);
  });

  it('every leak has something to do, and a leak page has at most one bright button', () => {
    for (const e of LEAKS) {
      expect(leakMissionIds(e).length, e.id).toBeGreaterThan(0);
      for (const level of ['simplest', 'full']) expect(primaries(renderLeak(fresh(level), e)), `${e.id} ${level}`).toBeLessThanOrEqual(1);
    }
  });

  it('GM Smart Driver links the LexisNexis and Verisk opt-outs, each saying what it opens', () => {
    const gm = leakById('gm-smart-driver');
    expect(leakMissionIds(gm).slice(0, 2)).toEqual(['car_broker_lexisnexis-optout', 'car_broker_verisk-optout']);
    const html = renderLeak(withCar(fresh('full')), gm);
    const panel = html.slice(html.indexOf('data-what-you-can-do'), html.indexOf('SOURCES ·'));
    expect(panel).toMatch(/class="btn-primary wycd-go" data-wycd-mission="car_broker_lexisnexis-optout"/);
    expect(panel).toMatch(/class="btn-secondary wycd-go" data-wycd-mission="car_broker_verisk-optout"/);
    expect(textOf(panel)).toContain('Opens the “Opt Out: LexisNexis” mission, in The Freeway.');
    expect(textOf(panel)).toContain('Opens the “Opt Out: Verisk” mission, in The Freeway.');
    expect(primaries(html)).toBe(1);
    // Before the sources.
    expect(html.indexOf('data-what-you-can-do')).toBeLessThan(html.indexOf('SOURCES ·'));
  });

  it('without a car, a Freeway mission is "Add your car in the Garage first", once, to #/garage', () => {
    const html = renderLeak(fresh('full'), leakById('gm-smart-driver'));
    expect((html.match(/data-wycd-garage/g) || []).length).toBe(1);
    expect(html).toMatch(/class="btn-primary wycd-go" data-wycd-garage href="#\/garage"><span class="wycd-name">Add your car in the Garage first ›/);
    expect(textOf(html)).toContain('Add a car and The Freeway opens, with “Opt Out: LexisNexis” and “Opt Out: Verisk”');
    // The LexisNexis opt-out that needs no car is there too.
    expect(html).toContain('data-wycd-mission="enterprise_data-fortify-lexisnexis"');
    // Twelve car makers make one Garage row, not twelve.
    expect((renderLeak(fresh('full'), leakById('cia-vehicles')).match(/data-wycd-garage/g) || []).length).toBe(1);
  });

  it('undone first; a done mission shows as done; all done says so, with the list and no bright button', () => {
    const ids = ['car_broker_lexisnexis-optout', 'car_broker_verisk-optout'];
    let s = withCar(fresh('full'));
    s = done(s, ids[0]);
    const rows = actionRows(s, ids);
    expect(rows.map((r) => [r.mission.id, r.done])).toEqual([[ids[1], false], [ids[0], true]]);
    const some = whatYouCanDo(s, ids);
    expect(some).toMatch(/class="wycd-done" data-wycd-mission="car_broker_lexisnexis-optout"[^>]*><span class="wycd-name">✓ Opt Out: LexisNexis/);
    expect(textOf(some)).toContain('Done. Opens the “Opt Out: LexisNexis” mission again');
    s = done(s, ids[1]);
    const all = whatYouCanDo(s, ids, { lede: 'x' });
    expect(textOf(all)).toContain('You’ve done these ✓');
    expect(primaries(all)).toBe(0);
    expect((all.match(/class="wycd-done"/g) || []).length).toBe(2);
  });

  it('a mission out of play is left out; up to three show', () => {
    const s = fresh('full');
    s.accounts = { ...s.accounts, yahoo: { ...s.accounts.yahoo, enabled: false } };
    const rows = actionRows(s, leakMissionIds(leakById('prism')));
    expect(rows.length).toBe(3);
    expect(rows.map((r) => r.mission.id)).not.toContain('yahoo-reclaim-privacy');
  });

  it('PRISM: PRISM BREAK stays the one bright button; the companies\' reviews follow it, outlined', () => {
    for (const level of ['simplest', 'full']) {
      const html = renderPrism(fresh(level));
      expect(primaries(html), level).toBe(1);
      const panel = html.slice(html.indexOf('WHAT YOU CAN DO'), html.indexOf('WHAT YOU CAN DO') + 4000);
      expect(panel.indexOf('prism-break.org')).toBeLessThan(panel.indexOf('data-what-you-can-do'));
      expect(panel).toMatch(/class="btn-secondary wycd-go" data-wycd-mission="google-reclaim-privacy"/);
      expect(textOf(panel)).toContain('Opens prism-break.org in a new tab.');
    }
  });

  it('the government map has the panel (one bright button) and the Buying your data files link the broker opt-out', () => {
    for (const level of ['simplest', 'full']) {
      const html = renderGovernment(fresh(level), GOV_DATA);
      expect(primaries(html), level).toBe(1);
      expect(html).toMatch(/class="btn-primary wycd-go" data-wycd-mission="location_brokers-fortify-optout"/);
    }
    for (const node of ['o-apps', 'p-buying']) {
      const html = renderGovernment(fresh('full'), GOV_DATA, { selected: node });
      expect(html).toMatch(/<a class="gov-file-go" data-gov-broker href="#\/mission\/location_brokers-fortify-optout\/briefing"><b>Opt out of location brokers ›<\/b>/);
    }
    expect(renderGovernment(fresh('full'), GOV_DATA, { selected: 'NSA' })).not.toContain('data-gov-broker');
  });

  it('the Whole City: one bright button either way (Your part\'s breach check, or the first mission)', () => {
    const DATA = { k: 50, asOf: '2026-11-19T04:00:00Z', city: { players: 100, fortified: { pct: 18 } }, pods: [] };
    const s = fresh();
    const html = renderCityTogether(s, { collective: { status: 'ready', data: DATA } });
    expect(primaries(html)).toBe(1);
    expect(html).toContain('data-what-you-can-do');
    expect(html).toMatch(/class="btn-secondary wycd-go" data-wycd-mission="[^"]+-fortify-2fa"/);
    // Every breach check filed: the panel's first mission lights instead.
    let all = s;
    for (const m of MISSIONS) if (/-recon-breach$/.test(m.id)) all = done(all, m.id);
    const after = renderCityTogether(all, { collective: { status: 'ready', data: DATA } });
    expect(primaries(after)).toBe(1);
    expect(after).toMatch(/class="btn-primary wycd-go"/);
  });
});

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const T = '2026-11-20';
const sky = (s, opts = {}) => renderBrokerMap(s, { status: 'ready', data: { map, layout }, today: T, ...opts });

describe('Pick 10: the broker map, the next rung under a shorter sky', () => {
  it('Simple: "Brokers you\'ve reached" with a fill bar, and no "reach 18"', () => {
    const html = sky(fresh());
    expect(html).toContain('<h1 class="map-head" data-reach-head>Brokers you\'ve reached</h1>');
    expect(html).toMatch(/<div class="map-reach-bar"><div class="fill-bar/);
    expect(noStyle(html)).not.toMatch(/· reach \d/);
    expect(textOf(html)).not.toContain('FIELD COVERED');
  });

  it('Simple: the location question first, holding the one bright button; then the NEXT rung', () => {
    const asking = sky(fresh());
    expect(primaries(asking)).toBe(1);
    const card = asking.slice(asking.indexOf('data-sky-next'), asking.indexOf('</section>', asking.indexOf('data-sky-next')));
    expect(card).toContain('WHERE DO YOU LIVE?');
    expect(card).toMatch(/class="btn-primary residency-btn" data-action="quiz-pick"/);
    const answered = sky(setHome(fresh(), 'US-TX'));
    expect(primaries(answered)).toBe(1);
    const next = answered.slice(answered.indexOf('data-sky-next'));
    expect(next).toContain('NEXT: THE BIGGEST OPT-OUT LEFT');
    expect(next).toMatch(/<h2>Global Privacy Control<\/h2>/);
    expect(next).toMatch(/class="btn-primary sky-next-go" href="#\/mission\/[^"]+\/briefing">START ›<\/a><p class="sky-next-opens">Opens the “[^”]+” mission\.<\/p>/);
    expect(next).toContain('data-action="select-rung" data-rung="1"');
    // The ladder is in the page, folded, not a sheet over the sky.
    expect(answered).toContain('class="sky-ladder sky-ladder--inline"');
    expect(answered).toContain('EVERY OPT-OUT, BIGGEST FIRST');
  });

  it('Simple: the key shows four rows, the rest under More', () => {
    const html = sky(fresh());
    const key = html.slice(html.indexOf('class="map-key map-key--simple"'));
    const first = key.slice(0, key.indexOf('<details'));
    expect((first.match(/<li>/g) || []).length).toBe(4);
    expect(key).toMatch(/<details class="map-key-more" data-open-desktop><summary>More of the key \(\d+\)<\/summary>/);
  });

  it('Simple: the sky is a 220px banner on a phone, and Scout sits under it', () => {
    const app = readFileSync('src/app.js', 'utf8');
    expect(app).toMatch(/const banner = readLevel\(state\) === 'simplest' && window\.innerWidth < 900;\s*const h = banner \? 220 :/);
    expect(sky(fresh())).toMatch(/\.broker-map--simple \.map-stage\{height:220px;min-height:0\}/);
    const html = sky(fresh(), { firstVisit: true });
    expect(html.indexOf('class="constellation-scout"')).toBeGreaterThan(html.indexOf('class="constellation-controls"'));
  });

  it('Advanced: the sheet reads "Next: <rung> ›"', () => {
    const html = sky(setHome(fresh('full'), 'US-TX'));
    expect(html).toMatch(/class="sky-ladder-bar"[^>]*><span class="sky-ladder-grab" aria-hidden="true"><\/span><span>Next: Global Privacy Control ›<\/span>/);
    expect(html).not.toContain('data-sky-next');
  });

  it('both modes: DROP is said in one line and is a button; an opt-out says what opens; the first is a button', () => {
    for (const level of ['simplest', 'full']) {
      const html = sky(fresh(level));
      expect(textOf(html)).toContain("DROP is California's one form that asks every registered broker to delete you.");
      expect(html).toMatch(/<a class="btn-secondary" data-drop-go href="#\/mission\/people_search-reclaim-stragglers\/briefing">FILE DROP ›<\/a>/);
      const left = html.slice(html.indexOf('<ul class="map-left">'));
      expect(left).toMatch(/^<ul class="map-left"><li><a class="btn-secondary map-left-first"/);
      expect((left.match(/map-left-first/g) || []).length).toBe(1);
      expect(left).toMatch(/form in a new tab; come back and tick it\./);
    }
    // In a star's card too.
    const star = map.brokers.find((b) => b.optOut?.status === 'verified' && /\/./.test(new URL(b.optOut.url).pathname) && !b.kind?.includes?.('buyer'));
    expect(sky(fresh('full'), { selectedId: star.id })).toMatch(/<p class="star-card-opens">Opens [^<]+ form in a new tab; come back and tick it\.<\/p>/);
  });

  it('the ladder component keeps working on its own', () => {
    expect(ladderPanel([], { inline: true })).toContain('sky-ladder--inline');
  });
});

describe('Pick 11: government files open as a sheet on phones', () => {
  it('a sheet under 700px: fixed, up to 85% tall, scrolls inside; a 44px close; a dialog', () => {
    const html = renderGovernment(fresh('full'), GOV_DATA, { selected: 'NSA' });
    const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
    const phone = css.slice(css.indexOf('@media (max-width:700px){\n.gov-sheet-shade'));
    expect(phone).toMatch(/\.gov-file\{position:fixed;left:0;right:0;bottom:0;[^}]*max-height:85svh;overflow-y:auto/);
    expect(phone).toMatch(/\.gov-file \.gov-file-x button\{width:44px;height:44px/);
    expect(html).toMatch(/<section class="gov-file" role="dialog" aria-label="National Security Agency" tabindex="-1"><div class="gov-file-x"><button type="button" data-action="gov-close" aria-label="Close the file">×<\/button>/);
    expect(html).toContain('class="gov-sheet-shade" data-action="gov-close"');
    // The desktop radial map and the scale ruler stay.
    expect(html).toContain('<div class="wide"><svg');
    expect(html).toContain('<h2>The scale</h2>');
  });

  it('app.js: Escape closes it, the page stays put on a phone, focus goes back to the tapped node', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const gov = app.slice(app.indexOf('function govAction'), app.indexOf('const MAP_ACTIONS'));
    expect(gov).toContain("govReturn = { node: el.dataset.node, inList: Boolean(el.closest('.gov-list')) };");
    expect(gov).toMatch(/const y = window\.scrollY;\s*renderCurrentRoute\(\);\s*if \(phone\) window\.scrollTo\?\.\(0, y\);/);
    expect(gov).toContain('target?.focus({ preventScroll: Boolean(phone) });');
    expect(app).toMatch(/e\.key === 'Escape' && govSelected && app\.querySelector\('\.gov-file'\)\) \{\s*e\.preventDefault\(\);\s*govAction\('gov-close'/);
  });

  it('Simple: where data comes from and the pipes first; agencies once one is picked, with full names', () => {
    const narrow = (html) => html.slice(html.indexOf('<div class="narrow">'), html.indexOf('</div></div>', html.indexOf('<div class="narrow">')));
    const before = narrow(renderGovernment(fresh(), GOV_DATA));
    expect(before).toContain('data-node="o-apps"');
    expect(before).toContain('data-node="p-buying"');
    expect(before).not.toContain('data-node="NSA"');
    expect(before).not.toContain('data-node="ICE"');
    const after = narrow(renderGovernment(fresh(), GOV_DATA, { focus: 'p-buying' }));
    expect(after).toContain('data-node="ICE"');
    expect(after).toContain('U.S. Immigration and Customs Enforcement');
    // Only the ones that pipe reaches.
    expect(after).not.toContain('data-node="GCHQ"');
    // Advanced: the whole map, as before.
    expect(narrow(renderGovernment(fresh('full'), GOV_DATA))).toContain('data-node="NSA"');
  });
});

describe('Pick 12: the timeline form opens inside the card you tapped', () => {
  const card = (html, id) => {
    const i = html.indexOf(`data-timeline-card="${id}"`);
    const j = html.indexOf('data-timeline-card=', i + 30);
    return html.slice(i, j < 0 ? undefined : j);
  };

  it('Advanced: the whole form in the card; the card\'s button turns to CLOSE; SAVE and CANCEL are real buttons', () => {
    const s = fresh('full');
    const html = renderTimeline(s, { edit: 'facebook' });
    const fb = card(html, 'facebook');
    expect(fb).toContain('id="social-profile-form"');
    expect(fb).toContain('data-action="cancel-social-profile" data-platform="facebook" aria-expanded="true"');
    expect(fb).not.toContain('>SET UP<');
    expect(fb).toMatch(/<button type="button" class="btn-primary" data-action="save-social-profile" data-platform="facebook"[^>]*>SAVE<\/button>/);
    expect(fb).toMatch(/<button type="button" class="btn-secondary" data-action="cancel-social-profile" data-platform="facebook"[^>]*>CANCEL<\/button>/);
    expect(html).not.toMatch(/<span data-action=/);
    expect(primaries(html)).toBe(1);
    expect(card(html, 'instagram')).not.toContain('social-profile-form');
  });

  it('Advanced: EDIT keeps the answers, and descriptions sit under labels in off-white', () => {
    const s = fresh('full');
    const year = new Date().getFullYear() - 12;
    s.socialHistory = { instagram: { joinYear: year, eras: ['heavy', null, 'light'] } };
    const html = renderTimeline(s, { edit: 'instagram' });
    expect(html).toMatch(new RegExp(`<option value="${year}" selected>`));
    expect(html).toMatch(/name="era-0" value="heavy" checked/);
    expect(html).toMatch(/name="era-2" value="light" checked/);
    expect(html).toMatch(/Barely posted<\/span><span style="display: block; font-size: 14px; color: var\(--offwhite\);[^"]*">A few posts, mostly lurked/);
    expect(html).not.toContain('rgba(237,239,243,0.3)">A few posts');
  });

  it('Simple: "Which of these do you use?" as chips; NEXT lights once one is picked', () => {
    const s = fresh();
    const none = renderTimeline(s, {});
    expect(textOf(none)).toContain('Which of these do you use?');
    expect(none).toMatch(/class="tl-chip" data-action="tl-pick" data-platform="instagram" aria-pressed="false"/);
    expect(primaries(none)).toBe(1);
    const picked = renderTimeline(s, { picked: ['instagram', 'tiktok'] });
    expect(picked).toMatch(/class="tl-chip is-on" data-action="tl-pick" data-platform="tiktok" aria-pressed="true"/);
    expect(picked).toMatch(/class="btn-primary" data-action="tl-start"/);
    expect(primaries(picked)).toBe(1);
  });

  it('Simple: one question at a time inside the card, with "1 of 3" and a bar', () => {
    const s = fresh();
    const year = new Date().getFullYear() - 12;
    const yearStep = renderTimeline(s, { wiz: { queue: ['instagram', 'tiktok'], at: 0, step: 'year', draft: { joinYear: null, eras: [] } } });
    const ig = card(yearStep, 'instagram');
    expect(textOf(ig)).toContain('What year did you join Instagram?');
    expect(textOf(ig)).toContain('Instagram: 1 of 2 platforms');
    expect(primaries(yearStep)).toBe(1);
    expect(yearStep).not.toContain('Which of these do you use?');
    const era = renderTimeline(s, { wiz: { queue: ['instagram'], at: 0, step: 0, draft: { joinYear: year, eras: [] } } });
    const e = card(era, 'instagram');
    expect(textOf(e)).toContain('1 of 3');
    expect(e).toMatch(/class="fill-bar fill-bar--small[^"]*"[^>]*aria-valuemax="3" aria-valuenow="1"/);
    expect((e.match(/name="era-0"/g) || []).length).toBe(4);
    expect(e).not.toContain('name="era-1"');
    expect(e).toMatch(/class="btn-primary" data-action="tl-next"[^>]*>NEXT</);
    const last = renderTimeline(s, { wiz: { queue: ['instagram'], at: 0, step: 2, draft: { joinYear: year, eras: ['heavy'] } } });
    expect(card(last, 'instagram')).toMatch(/data-action="tl-next"[^>]*>SAVE</);
  });

  it('app.js saves through socialProfileFromForm, as before', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const fn = app.slice(app.indexOf('function saveTimeline'), app.indexOf('function timelineAction'));
    expect(fn).toContain('socialProfileFromForm(year, values)');
    expect(fn).toContain('state.socialHistory[platformId] = result.profile;');
  });
});

describe('Pick 13: the Big Check starts with the brokers that sell your address', () => {
  const html = renderBigCheck(fresh('full'), { status: 'ready', data: { map, layout }, today: T });
  it('People search is open and first, headed "Start here"; the rest folded', () => {
    const details = [...html.matchAll(/<details[^>]*>/g)].map((m) => m[0]);
    expect(details[0]).toBe('<details class="big-check-start" data-start-here open>');
    expect(details.slice(1).every((d) => !/\sopen/.test(d))).toBe(true);
    expect(details.length).toBeGreaterThan(5);
    expect(html).toContain('Start here: these sell your address');
  });

  it('every group\'s count is a fill bar', () => {
    const sums = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((m) => m[1]);
    const counted = sums.filter((x) => x.includes('data-big-check-count'));
    expect(counted.length).toBeGreaterThan(3);
    for (const x of counted) expect(x).toMatch(/<div class="fill-bar fill-bar--small/);
  });

  it('a mission row reads "Covered by: <mission> ›" on one line; the filter stays', () => {
    expect(html).toMatch(/<div class="big-check-mission">Covered by: <a href="#\/mission\/[^"]+\/briefing">[^<]+ ›<\/a><\/div>/);
    expect(html).toContain('data-big-check-filter');
  });

  it('a tick moves its group\'s bar (app.js)', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const fn = app.slice(app.indexOf('function bigCheckChange'), app.indexOf('function bigCheckFilter'));
    expect(fn).toContain("bar.style.setProperty('--to', pct);");
    expect(fn).toContain("bar.setAttribute('aria-valuenow', String(ticked));");
  });
});
