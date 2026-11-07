// Task 7a, the phone trim pass: fewer words on a phone's first screen, nothing lost.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialState } from '../src/state.js';
import { renderQuickQuest } from '../src/screens/quick-quest.js';
import { QUICK_QUESTS } from '../src/data/quests.js';
import { DISTRICTS } from '../src/data/districts.js';
import { countWords, splitWords } from '../src/components/deck.js';
import { onPage, phoneHtml } from './helpers/on-page.mjs';

const CSS = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const TRIM_CSS = CSS.slice(CSS.indexOf('/* trim pass: start */'), CSS.indexOf('/* trim pass: end */'));
const norm = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const deckOf = (html, label) => html.match(new RegExp(`<div class="deck[^"]*" data-deck role="region" aria-roledescription="carousel" aria-label="${label}">[\\s\\S]*?</div><div class="deck-controls`))?.[0] ?? '';
const slidesOf = (deckHtml) => deckHtml.split(/<section class="slide[ "]/).slice(1).map((s) => s.slice(s.indexOf('>') + 1, s.lastIndexOf('</section>')));
const closedDetails = (html) => html.replace(/<details[\s\S]*?<\/details>/g, ' ');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
beforeEach(() => { globalThis.localStorage = memoryStorage(); });

describe('every string from the data that these screens draw reaches the page, and a phone', async () => {
  const { renderDistrict } = await import('../src/screens/district.js');
  const { renderBigCheck } = await import('../src/screens/big-check.js');
  const { renderTimeline } = await import('../src/screens/timeline.js');
  const { renderDebrief } = await import('../src/screens/debrief.js');
  const { renderCityMap } = await import('../src/screens/city-map.js');
  const { ACCOUNTS } = await import('../src/data/accounts.js');
  const { haveAccount } = await import('../src/data/districts.js');
  const { MISSIONS, getMissionsForDistrict } = await import('../src/data/missions.js');
  const { DISTRICT_DIALOGUE, BROKER_MAP_DIALOGUE } = await import('../src/data/dialogue.js');
  const { PASSWORD_MANAGERS } = await import('../src/data/missions-passwords.js');
  const { checklistFor } = await import('../src/data/broker-checklists.js');
  const { bigCheckGroups } = await import('../src/utils/big-check.js');
  const { brokerLighting } = await import('../src/utils/broker-lighting.js');
  const { updateMission } = await import('../src/state.js');
  const mini = JSON.parse(readFileSync(new URL('./fixtures/broker-map-mini.json', import.meta.url), 'utf8'));
  const layout = JSON.parse(readFileSync(new URL('../src/data/broker-layout.json', import.meta.url), 'utf8'));
  // Both the whole page (desktop) and what a phone shows.
  const both = (html, strs, label) => {
    for (const t of strs.filter(Boolean)) {
      onPage(html, t, label);
      onPage(phoneHtml(html), t, `${label} (phone)`);
    }
  };

  it('Quick Quest: every problem, what it looks like, and where it goes', () => {
    const html = renderQuickQuest(createInitialState());
    both(html, QUICK_QUESTS.flatMap((q) => [q.title, q.description, DISTRICTS.find((d) => d.id === q.targetDistrict)?.name]), 'quickquest');
  });

  it("every survey: the district, Scout's welcome, every account; each row's question on desktop, a chip's name on a phone", () => {
    for (const d of DISTRICTS.filter((x) => x.type !== 'facility' && !x.hasGarage)) {
      const s = { ...createInitialState(), customAccounts: { [d.id]: ['Old forum'] } };
      const html = renderDistrict(s, d.id, 'survey');
      const dialogue = DISTRICT_DIALOGUE[d.id] ?? {};
      const accounts = Object.entries(ACCOUNTS).filter(([, a]) => a.district === d.id);
      both(html, [d.name, d.description, dialogue.intro, dialogue.introLore, 'Old forum', ...accounts.map(([, a]) => a.name)], `survey-${d.id}`);
      if (d.askPasswordManager) both(html, PASSWORD_MANAGERS.map((pm) => pm.text), `survey-${d.id}`);
      for (const [id, a] of accounts) {
        if (!s.accounts[id]) continue;
        const q = (d.surveyQuestion || haveAccount)(a.name);
        onPage(html, q, `survey-${d.id}`);
        expect(phoneHtml(html), `survey-${d.id} (phone): ${q}`).toContain(`aria-label="${q.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"`);
      }
    }
  });

  it('the Reclamation: its facilities and their missions', () => {
    const d = DISTRICTS.find((x) => x.id === 'reclamation');
    const html = renderDistrict(createInitialState(), 'reclamation');
    const accounts = Object.entries(ACCOUNTS).filter(([, a]) => a.district === 'reclamation');
    both(html, [d.name, d.description, DISTRICT_DIALOGUE.reclamation?.intro, ...accounts.map(([, a]) => a.name),
      ...getMissionsForDistrict('reclamation').filter((m) => !m.legacy && accounts.some(([id]) => id === m.accountId)).map((m) => m.title)], 'reclamation');
  });

  it("the Big Check: Scout's first-visit line and every broker in its groups", () => {
    const T = '2026-10-23';
    const s = createInitialState();
    const html = renderBigCheck(s, { status: 'ready', data: { map: mini, layout }, today: T, scoutLine: BROKER_MAP_DIALOGUE.bigCheck });
    const groups = bigCheckGroups(mini, brokerLighting(mini, s, T));
    both(html, [BROKER_MAP_DIALOGUE.bigCheck, ...groups.flatMap((g) => [g.label, ...g.rows.map((r) => r.name)])], 'big-check');
  });

  it('the Social Timeline: every social account it asks about', () => {
    const s = createInitialState();
    const html = renderTimeline(s);
    both(html, ['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin'].filter((id) => s.accounts[id]?.enabled).map((id) => ACCOUNTS[id].name), 'timeline');
  });

  it("a broker debrief and its re-check: the mission, Scout's line, every question, option and checklist line", () => {
    const WF = 'people_search-fortify-web-forms';
    const m = MISSIONS.find((x) => x.id === WF);
    const fresh = createInitialState();
    const filed = updateMission(fresh, WF, { status: 'completed', completedAt: '2026-10-20T10:00:00Z' });
    const strs = [m.title, m.scoutDialog?.briefing, ...m.debriefQs.flatMap((q) => [q.label, ...(q.options || []).map((o) => o.text)]), ...checklistFor(WF).flatMap((l) => [l.label, l.hint])];
    both(renderDebrief(fresh, WF), strs, 'debrief');
    both(renderDebrief(filed, WF, { recheck: true }), strs.filter((t) => t !== "I'll come back to this"), 'recheck');
  });

  it('the city map: every district on the map', () => {
    const html = renderCityMap(createInitialState());
    // The map is the main campaign: chapters 1-8 (its labels read D-01..D-08). The later
    // districts (Freeway, Foundry, Grid, Clinic, Trail) open from inside the game, not the map.
    const onMap = DISTRICTS.filter((d) => d.chapter <= 8);
    expect(onMap).toHaveLength(8);
    for (const d of onMap) {
      expect(html, d.id).toContain(`href="#/district/${d.id}"`);
      onPage(html, d.name.replace(/^The /i, ''), 'city');
    }
  });
});

describe('the trim CSS', () => {
  it('no nowrap and no fixed width over 360px', () => {
    expect(TRIM_CSS.length).toBeGreaterThan(0);
    expect(TRIM_CSS).not.toMatch(/white-space:\s*nowrap/);
    for (const w of TRIM_CSS.match(/(?<![-\w])width:\s*(\d+)px/g) || []) expect(parseInt(w.split(':')[1], 10)).toBeLessThanOrEqual(360);
  });
  it('phone-only and desktop-only split at 900px; folds open on desktop by script, not ::details-content', () => {
    expect(TRIM_CSS).toMatch(/@media \(max-width: 899px\) \{ \.desktop-only \{ display: none !important; \} \}/);
    expect(TRIM_CSS).toMatch(/@media \(min-width: 900px\) \{ \.phone-only \{ display: none !important; \} \}/);
    expect(TRIM_CSS).toMatch(/@media \(min-width: 900px\)[\s\S]*\.phone-fold > summary, \.more-fold \{ display: none; \}/);
    expect(TRIM_CSS).not.toContain('::details-content');
  });
});

describe('Quick Quest: two slides of four tiles on a phone', () => {
  const html = renderQuickQuest(createInitialState());
  const d = deckOf(html, 'Quick Quest');
  const slides = slidesOf(d);

  it('the desktop list is as it was, marked desktop-only; the deck is phone-only', () => {
    expect(html).toMatch(/<div class="desktop-only qq-list"/);
    expect(html).toMatch(/<div class="phone-only qq-deck">/);
    for (const q of QUICK_QUESTS) expect(html.split(`href="#/district/${q.targetDistrict}"`).length - 1).toBeGreaterThanOrEqual(2);
  });

  it('every problem is a tile, in order, four to a slide; each tile is a link to its district', () => {
    expect(slides).toHaveLength(Math.ceil(QUICK_QUESTS.length / 4));
    const tiles = slides.flatMap((s) => [...s.matchAll(/<li class="qq-tile">([\s\S]*?)<\/li>/g)].map((m) => m[1]));
    expect(tiles).toHaveLength(QUICK_QUESTS.length);
    QUICK_QUESTS.forEach((q, i) => {
      const t = tiles[i];
      expect(t).toMatch(new RegExp(`<a class="qq-go" href="#/district/${q.targetDistrict}">`));
      expect(decode(norm(t.match(/<a class="qq-go"[^>]*>([\s\S]*?)<\/a>/)[1]))).toBe(q.title);
      // What it looks like, and where it goes, behind a tap.
      const fold = t.match(/<details class="qq-signs" data-fold="qq-[a-z0-9-]+"><summary aria-label="What it looks like: [^"]+">\?<\/summary>([\s\S]*)<\/details>/)?.[1] ?? '';
      expect(decode(norm(fold))).toContain(q.description);
      const district = DISTRICTS.find((x) => x.id === q.targetDistrict);
      expect(norm(fold)).toContain(district.name.toUpperCase());
    });
  });

  it('a slide shows only the titles: at most 35 words with the folds closed', () => {
    for (const s of slides) expect(countWords(closedDetails(s))).toBeLessThanOrEqual(35);
  });

  it('the tile grid is two columns and fits a 320px phone', () => {
    expect(TRIM_CSS).toMatch(/\.qq-grid \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    expect(TRIM_CSS).toMatch(/\.qq-signs > summary \{[^}]*min-height: 44px/);
    expect(TRIM_CSS).toMatch(/\.qq-go \{[^}]*min-height: 44px/);
  });
});

describe('surveys: one question and a grid of chips on a phone', async () => {
  const { renderDistrict, surveyAsk } = await import('../src/screens/district.js');
  const { ACCOUNTS } = await import('../src/data/accounts.js');
  const { haveAccount } = await import('../src/data/districts.js');
  const surveyed = DISTRICTS.filter((d) => d.type !== 'facility' && !d.hasGarage);

  it('the one question says what each row asked', () => {
    expect(surveyAsk(haveAccount)).toBe('Which of these accounts do you have?');
    expect(surveyAsk((n) => `Do you use ${n}?`)).toBe('Do you use any of these?');
    expect(surveyAsk((n) => `Have you registered for ${n}?`)).toBe('Have you registered for any of these?');
    // A question that doesn't end on the name (review M3): no "an any of these vehicle".
    const { withArticle } = { withArticle: (n) => `a ${n}` };
    expect(surveyAsk((n) => `Do you own ${withArticle(n)} vehicle?`)).toBe('Which of these do you have?');
  });

  it('every account is a chip: a button, pressed when on, its full question as its name', () => {
    for (const d of surveyed) {
      const s = createInitialState();
      const html = renderDistrict(s, d.id, 'survey');
      const grid = html.match(/<div class="phone-only survey-chips">([\s\S]*?)<\/div><!-- \/survey-chips -->/)?.[1] ?? '';
      expect(grid, d.id).not.toBe('');
      expect(norm(grid)).toContain(surveyAsk(d.surveyQuestion || haveAccount));
      const ids = Object.entries(ACCOUNTS).filter(([, a]) => a.district === d.id).map(([id]) => id);
      for (const id of ids) {
        const name = ACCOUNTS[id].name;
        if (!s.accounts[id]) {
          expect(grid, `${d.id}/${id}`).toMatch(new RegExp(`<button type="button" class="survey-chip survey-chip--soon" disabled>[^<]*${name.replace(/[()]/g, '\\$&')}`));
          continue;
        }
        const chip = grid.match(new RegExp(`<button type="button" class="survey-chip[^"]*" data-action="toggle-account" data-account="${id}" aria-pressed="(true|false)" aria-label="([^"]*)">`));
        expect(chip, `${d.id}/${id}`).toBeTruthy();
        expect(chip[1]).toBe(String(!!s.accounts[id].enabled));
        expect(decode(chip[2])).toBe((d.surveyQuestion || haveAccount)(name));
      }
      // Desktop keeps its rows.
      expect(html).toContain('<div class="desktop-only survey-rows">');
    }
  });

  it("Scout's welcome: on a phone only the first sentence shows before MORE; desktop keeps its lead", async () => {
    const html = renderDistrict(createInitialState(), 'vault', 'survey');
    const summary = html.match(/<details class="intro-more">\s*<summary[^>]*>([\s\S]*?)<\/summary>/)[1];
    // From the dialogue data: the lead's first sentence, then the rest of the lead.
    const { DISTRICT_DIALOGUE } = await import('../src/data/dialogue.js');
    const { splitIntro } = await import('../src/screens/district.js');
    const [first, ...more] = splitWords(splitIntro(DISTRICT_DIALOGUE.vault.intro).lead, 1);
    expect(more.length).toBeGreaterThan(0);
    expect(norm(summary.replace(/<span class="intro-lead-more">[\s\S]*?<\/span>/, ''))).toBe(norm(first));
    expect(norm(summary.match(/<span class="intro-lead-more">([\s\S]*?)<\/span>/)[1])).toBe(norm(more.join('')));
    expect(norm(html.match(/<div class="intro-lead-phone"[^>]*>([\s\S]*?)<\/div>/)[1])).toBe(norm(more.join('')));
    expect(CSS).toMatch(/@media \(max-width: 899px\)[^@]*\.intro-lead-more \{ display: none; \}/);
    expect(CSS).toMatch(/@media \(min-width: 900px\)[^@]*\.intro-lead-phone \{ display: none; \}/);
  });

  it("a facility's title is not said twice on a phone: its building's own label hides there", () => {
    const html = renderDistrict(createInitialState(), 'reclamation');
    expect(html).toContain('<span class="facility-icon">');
    expect(TRIM_CSS).toMatch(/@media \(max-width: 899px\) \{ \.facility-icon > div > div:last-child[,\s]/);
  });
});

describe("the Big Check: Scout's first-visit line as two slides", async () => {
  const { renderBigCheck } = await import('../src/screens/big-check.js');
  const { BROKER_MAP_DIALOGUE } = await import('../src/data/dialogue.js');
  const mini = JSON.parse(readFileSync(new URL('./fixtures/broker-map-mini.json', import.meta.url), 'utf8'));
  const layout = JSON.parse(readFileSync(new URL('../src/data/broker-layout.json', import.meta.url), 'utf8'));
  const html = renderBigCheck(createInitialState(), { status: 'ready', data: { map: mini, layout }, today: '2026-10-23', scoutLine: BROKER_MAP_DIALOGUE.bigCheck });
  const slides = slidesOf(deckOf(html, 'The long tail'));

  it('split at sentence ends, word for word, at most 20 words a slide', () => {
    expect(slides.length).toBeGreaterThanOrEqual(2);
    expect(decode(slides.map(norm).join(' '))).toBe(BROKER_MAP_DIALOGUE.bigCheck);
    for (const s of slides) expect(countWords(s)).toBeLessThanOrEqual(20);
    expect(html).toContain('class="deck deck--flow"');
  });
});

describe("a building's roof: the device list and the antenna note behind a tap on a phone", async () => {
  const { renderBuildingInterior } = await import('../src/screens/building.js');
  const { toggleAccount } = await import('../src/state.js');
  const html = renderBuildingInterior(toggleAccount(createInitialState(), 'gmail', true), 'gmail', { now: new Date('2026-10-20T00:00:00Z') });

  it('Your devices is a fold, open on desktop, its list, ADD and note inside', () => {
    const fold = html.match(/<details class="phone-fold devices-fold" data-fold="devices-gmail" data-open-desktop><summary>Your devices<\/summary>([\s\S]*?)<\/details>/)?.[1] ?? '';
    expect(fold).toContain('<div class="devices-title desktop-only">Your devices</div>');
    expect(fold).toContain('data-action="add-device"');
    expect(fold).toMatch(/<div class="dim interior-note">[^<]+<\/div>/);
  });

  it('the antenna note is a fold, open on desktop', () => {
    expect(html).toMatch(/<details class="phone-fold" data-fold="antenna-gmail" data-open-desktop><summary>[^<]+<\/summary><div class="dim interior-note">[^<]+<\/div><\/details>/);
  });
});

describe('a building on a phone: the floors below the roof start folded until the player chooses', async () => {
  const { renderBuildingInterior } = await import('../src/screens/building.js');
  const { toggleAccount } = await import('../src/state.js');
  const { setFloorOpen } = await import('../src/utils/interior-state.js');
  const APP = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const s = toggleAccount(createInitialState(), 'gmail', true);
  const r = (st) => renderBuildingInterior(st, 'gmail', { now: new Date('2026-10-20T00:00:00Z') });

  it('untouched: desk, ground and alcove are data-open-desktop (open from 900px by script); a choice wins', () => {
    for (const k of ['desk', 'ground', 'alcove']) expect(r(s)).toContain(`<details class="floor floor--${k}" data-open-desktop data-floor="${k}">`);
    expect(r(setFloorOpen(s, 'gmail', 'desk', false))).toContain('<details class="floor floor--desk" data-floor="desk">');
  });

  it("a fold the script makes for the screen width is not saved as the player's", () => {
    expect(APP).toMatch(/if \(details\.hasAttribute\('data-open-desktop'\)\) \{[\s\S]*?if \(!handFolds\.has\(desktopFoldKey\(details, all\.indexOf\(details\)\)\)\) return;/);
  });
});

describe('the Social Timeline and the broker checklist: the rest behind a tap on a phone', async () => {
  const { renderTimeline } = await import('../src/screens/timeline.js');
  const { renderDebrief } = await import('../src/screens/debrief.js');
  const { updateMission } = await import('../src/state.js');

  it("the timeline's intro: its first sentence, then MORE (the rest flows on in the paragraph on desktop)", () => {
    const html = renderTimeline(createInitialState());
    // A sentence, then MORE, then the rest in the sibling span (no sentence cut in two).
    expect(html).toMatch(/[.!?] <details class="more-fold" data-fold="timeline-how" data-open-desktop><summary>MORE<\/summary><\/details><span class="more-fold-text">[^<]+[\s\S]*?<\/span><\/div>/);
  });

  it("a platform card whose building says the same name hides the building's label on a phone", () => {
    const html = renderTimeline(createInitialState());
    expect(html).toContain('<span class="tl-icon tl-icon--same">');
    expect(TRIM_CSS).toMatch(/\.facility-icon > div > div:last-child, \.tl-icon--same > div > div:last-child \{ display: none; \}/);
  });

  it('the broker checklist note sits behind a fold, open on desktop, in both the debrief and the re-check', () => {
    const WF = 'people_search-fortify-web-forms';
    const fresh = createInitialState();
    const filed = updateMission(fresh, WF, { status: 'completed', completedAt: '2026-10-20T10:00:00Z' });
    for (const html of [renderDebrief(fresh, WF), renderDebrief(filed, WF, { recheck: true })]) {
      expect(html).toMatch(/<details class="phone-fold checklist-kept" data-fold="checklist-kept" data-open-desktop><summary>[^<]+<\/summary><div[^>]*>[^<]+<\/div><\/details>/);
    }
  });
});

describe('saints: the candle note behind a tap on a phone', async () => {
  const { renderSaints } = await import('../src/screens/saints.js');
  it('a fold, open on desktop, holding the note word for word', () => {
    expect(renderSaints(createInitialState())).toMatch(/<details class="phone-fold" data-fold="saints-candles" data-open-desktop><summary>[^<]+<\/summary><div class="dim interior-note">[^<]+<\/div><\/details>/);
  });
});

describe('the city map on a phone: each district\'s percentage is drawn, not written twice', async () => {
  const { renderCityMap } = await import('../src/screens/city-map.js');
  const html = renderCityMap(createInitialState());

  it('the bar carries the percentage as its name; the written one hides under 900px', () => {
    const bars = [...html.matchAll(/<div class="city-label__bar" role="img" aria-label="(\d+)%">/g)];
    expect(bars).toHaveLength(8);
    // Heard once: the written percentage is aria-hidden, the bar's name says it.
    const pcts = [...html.matchAll(/<span class="city-label__pct" aria-hidden="true">(\d+)%<\/span>/g)];
    expect(pcts.map((m) => m[1])).toEqual(bars.map((m) => m[1]));
    expect(html).toMatch(/@media \(max-width: 899px\) \{ \.city-label__pct \{ display: none; \} \}/);
  });
});

describe('building floors: a fold keyed by its floor, not its place in the page (review I-1)', async () => {
  const { renderBuildingInterior } = await import('../src/screens/building.js');
  const { toggleAccount } = await import('../src/state.js');
  const { setFloorOpen } = await import('../src/utils/interior-state.js');
  const { applyOpenDesktop, desktopFoldKey } = await import('../src/components/deck.js');
  const NOW = new Date('2026-10-20T00:00:00Z');
  // The page's data-open-desktop <details>, as stand-ins with their attributes.
  const foldsOf = (html) => [...html.matchAll(/<details([^>]*\sdata-open-desktop[^>]*)>/g)].map((m) => {
    const attrs = Object.fromEntries([...m[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((a) => [a[1], a[2] ?? '']));
    return { open: false, dataset: {}, getAttribute: (k) => attrs[k] ?? null };
  });
  const rootOf = (list) => ({ querySelectorAll: (sel) => (sel === 'details[data-open-desktop]' ? list : []) });
  const keyOf = (list, floorId) => {
    const i = list.findIndex((d) => d.getAttribute('data-floor') === floorId);
    return i < 0 ? null : desktopFoldKey(list[i], i);
  };
  const s0 = toggleAccount(createInitialState(), 'gmail', true);
  const r = (st) => renderBuildingInterior(st, 'gmail', { now: NOW });

  it("a floor's key is its floor id, the same before and after another floor is saved", () => {
    const before = foldsOf(r(s0));
    const after = foldsOf(r(setFloorOpen(s0, 'gmail', 'desk', false)));
    expect(keyOf(before, 'ground')).toBe('floor-ground');
    expect(keyOf(after, 'ground')).toBe('floor-ground');
    expect(keyOf(before, 'desk')).toBe('floor-desk');
    expect(keyOf(after, 'desk')).toBeNull(); // saved: no longer the script's to open
    expect(keyOf(after, 'alcove')).toBe('floor-alcove');
  });

  for (const [width, wide] of [['desktop', true], ['phone', false]]) {
    it(`${width}: folding the desk and redrawing leaves ground and alcove as they were`, () => {
      const hand = new Map();
      const first = foldsOf(r(s0));
      applyOpenDesktop(rootOf(first), wide, hand);
      // On a phone the player had opened ground by hand; on desktop it is open by script.
      if (!wide) hand.set(keyOf(first, 'ground'), true);
      // The player folds the desk (a hand toggle), and it is saved.
      hand.set(keyOf(first, 'desk'), false);
      const redraw = foldsOf(r(setFloorOpen(s0, 'gmail', 'desk', false)));
      applyOpenDesktop(rootOf(redraw), wide, hand);
      const open = (id) => redraw.find((d) => d.getAttribute('data-floor') === id).open;
      expect(open('ground')).toBe(true);
      expect(open('alcove')).toBe(wide);
    });
  }
});

describe('a newly sealed entry is seen on a phone too (review M-3)', async () => {
  const { renderBuildingInterior } = await import('../src/screens/building.js');
  const { toggleAccount, updateMission } = await import('../src/state.js');
  it('the ground floor renders open (at every width, not saved) while an entry is sealing', () => {
    let g = toggleAccount(createInitialState(), 'gmail', true);
    g = updateMission(g, 'gmail-fortify-password', { status: 'completed', action: 'reset-password', completedAt: '2026-10-17T00:00:00Z' });
    g = updateMission(g, 'gmail-fortify-2fa', { status: 'completed', method: 'passkey', completedAt: '2026-10-17T00:00:00Z' });
    g = { ...g, interior: { ...(g.interior || {}), gmail: { ...(g.interior?.gmail || {}), visited: true, sealedSeen: [] } } };
    const html = renderBuildingInterior(g, 'gmail', { now: new Date('2026-10-20T00:00:00Z') });
    if (!html.includes('entry--sealing')) throw new Error('fixture: expected a sealing entry');
    expect(html).toContain('<details class="floor floor--ground" open data-floor="ground">');
    expect(html).toContain('<details class="floor floor--desk" data-open-desktop data-floor="desk">');
  });
});
