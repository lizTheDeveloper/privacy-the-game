import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { countWords, splitWords } from '../src/components/deck.js';
import { missionSteps } from '../src/utils/debrief.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { DISTRICT_DIALOGUE } from '../src/data/dialogue.js';
import { missionDistrict } from '../src/data/missions.js';
import { PM_BURST_ID, pmBurstBriefingLine } from '../src/utils/bursts.js';

const state = createInitialState();
// The page as read in order, without the "More intel" summary.
const read = (html) => norm(html.replace(/<summary>[^<]*<\/summary>/g, ' '));
const norm = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const deckOf = (html) => html.match(/<div class="deck[^"]*"[^>]*data-deck[\s\S]*?<\/div><div class="deck-controls"/)?.[0] ?? '';
const slidesOf = (html) => deckOf(html).split(/<section class="slide[ "]/).slice(1).map((s) => s.slice(s.indexOf('>') + 1, s.lastIndexOf('</section>')));

// A slide's body: its words minus labels, step numbers and text behind a closed <details>.
const body = (slide) => slide
  .replace(/<details[\s\S]*?<\/details>/g, ' ')
  .replace(/<div class="section-label[^"]*"[^>]*>[^<]*<\/div>/g, ' ')
  .replace(/<div data-step-num[^>]*>[^<]*<\/div>/g, ' ');

describe('briefings are slides on phones', () => {
  it("every briefing's intel and Scout line are still in the page", () => {
    for (const m of MISSIONS) {
      const page = read(renderBriefing(state, m.id));
      expect(page, m.id).toContain(norm(m.briefing));
      const scout = (m.id === PM_BURST_ID && pmBurstBriefingLine(state)) || m.scoutDialog.briefing;
      expect(page, m.id).toContain(norm(scout));
      for (const s of missionSteps(m, state)) expect(page, m.id).toContain(norm(s.text));
    }
  });

  it('no slide body over 35 words unless a single sentence is', () => {
    let decks = 0;
    for (const m of MISSIONS) {
      const slides = slidesOf(renderBriefing(state, m.id));
      if (slides.length) decks++;
      for (const s of slides) {
        const n = countWords(body(s));
        if (n <= 35) continue;
        // Over budget only for one step (its notes are reasons the player needs together)
        // or one sentence of intel / Scout.
        const steps = (s.match(/data-brief-step/g) || []).length;
        const chunk = s.match(/data-chunk>([\s\S]*?)<\/div>/)?.[1];
        const ok = steps === 1 || (chunk != null && splitWords(chunk, 1).length === 1);
        expect(ok, `${m.id}: ${n} words: ${norm(body(s)).slice(0, 120)}`).toBe(true);
      }
    }
    expect(decks).toBeGreaterThan(250);
  });

  it("the phone slides themselves carry the Scout line, and THIS LIBERATES and the lore close the deck", () => {
    let checked = 0;
    for (const m of MISSIONS) {
      const html = renderBriefing(state, m.id);
      const d = deckOf(html);
      if (!d) continue;
      checked++;
      const scout = (m.id === PM_BURST_ID && pmBurstBriefingLine(state)) || m.scoutDialog.briefing;
      const scoutSlides = slidesOf(html).filter((x) => x.includes('class="brief-scout"')).join(' ');
      {
        expect(read(scoutSlides), m.id).toContain(norm(scout));
        // Scout and closing slides are phone-only sections: on desktop no empty slide is left.
        expect(d.match(/<section class="slide slide--phone"[^>]*><div class="brief-scout"/g)?.length, m.id).toBeGreaterThan(0);
      }
      const slides = slidesOf(html);
      const tail = [];
      for (let k = slides.length - 1; k >= 0 && slides[k].includes('class="brief-last'); k--) tail.unshift(slides[k]);
      const account = ACCOUNTS[m.accountId];
      const lore = Object.values(DISTRICT_DIALOGUE[missionDistrict(m)]?.lore || {})[0];
      if (account?.building && account?.buildingDark) {
        expect(read(tail.join(' ')), m.id).toContain('THIS LIBERATES');
        expect(read(tail.join(' ')), m.id).toContain(norm(account.name));
      }
      if (lore) {
        expect(read(tail.join(' ')), m.id).toContain(norm(lore.title));
        expect(read(tail.join(' ')), m.id).toContain(norm(lore.text));
      }
      if (tail.length) expect(d.match(/<section class="slide slide--phone"[^>]*><div class="brief-last/g)?.length, m.id).toBe(tail.length);
    }
    expect(checked).toBeGreaterThan(250);
  });

  it('the action row is outside the deck', () => {
    for (const id of ['browser_fingerprint-reclaim-dns', 'gmail-recon-breach', 'temu-recon-activity']) {
      const html = renderBriefing(state, id);
      const d = deckOf(html);
      expect(d, id).not.toBe('');
      // GO DO IT where there's a site to open, START where there isn't (temu-recon-activity).
      const go = html.includes('data-action="go-do-it"') ? 'data-action="go-do-it"' : 'data-action="start-mission"';
      expect(d).not.toContain(go);
      expect(d).not.toContain('NOT NOW');
      expect(html).toContain(go);
      // The row comes after the deck's controls, before the sidebar.
      expect(html.indexOf(go)).toBeGreaterThan(html.indexOf('data-deck-controls'));
    }
  });

  it('the Scout slide is hidden at 900px and up, and the sidebar bubble under 900px', () => {
    const html = renderBriefing(state, 'browser_fingerprint-reclaim-dns');
    expect(deckOf(html)).toContain('class="brief-scout"');
    expect(deckOf(html)).toContain('data-scout="briefing"');
    expect(html).toMatch(/class="brief-side"[\s\S]*data-scout="briefing"/);
    expect(html).toContain('class="brief brief--deck');
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
    const block = css.slice(css.indexOf('/* briefing deck: start */'), css.indexOf('/* briefing deck: end */'));
    // Under 900px the sidebar (Scout, THIS LIBERATES, lore) is hidden: the slides show it.
    expect(block).toMatch(/@media \(max-width: 899px\)[^@]*\.brief--deck \.brief-side[^{-]*\{[^}]*display: none/);
    expect(block).toMatch(/@media \(min-width: 900px\)[^@]*\.brief-scout[^{]*\{[^}]*display: none/);
    // The last slide's THIS LIBERATES and lore: phone only; the sidebar keeps them on desktop.
    expect(block).toMatch(/@media \(min-width: 900px\)[^@]*\.brief-last[^{]*\{[^}]*display: none/);
    expect(block).not.toMatch(/white-space:\s*nowrap/);
  });

  it('the steps are packed in order; a step with notes keeps its first note, and each further note is a slide labelled with the step', () => {
    const m = MISSIONS.find((x) => x.id === 'gmail-recon-breach');
    const slides = slidesOf(renderBriefing(state, m.id));
    const i = m.steps.findIndex((s) => s.note?.length);
    const step = m.steps[i];
    const num = String(i + 1).padStart(2, '0');
    expect(step.note.length).toBe(3);
    const own = slides.find((s) => norm(s).includes(norm(step.text)));
    expect((own.match(/data-brief-step/g) || []).length).toBe(1);
    expect(norm(own)).toContain(norm(step.note[0].text));
    expect(own).not.toContain(step.note[1].label);
    // Each further note: its own slide(s), straight after, labelled "04 · WHO RUNS IT" on a phone.
    const at = slides.indexOf(own);
    expect(slides[at + 1]).toContain(`data-step="${num} · ">${step.note[1].label}<`);
    expect(norm(slides[at + 1])).toContain(norm(step.note[1].text));
    expect(slides[at + 2]).toContain(`data-step="${num} · ">${step.note[2].label}<`);
    // A note over the budget goes on at sentence ends; its next slide says whose note it is.
    expect(slides[at + 3]).toContain(`data-label="${num} · ${step.note[2].label}"`);
    expect(norm(slides[at + 2] + slides[at + 3]).replace(/\s+/g, ' ')).toContain(norm(step.note[2].text));
    for (const s of slides.slice(at + 1, at + 4)) {
      expect(s).not.toContain('data-brief-step');
      expect(countWords(body(s))).toBeLessThanOrEqual(35);
    }
    const all = read(slides.join(''));
    const order = [...m.steps.map((s) => s.text), ...step.note.map((n) => n.text)].map((t) => all.indexOf(norm(t)));
    expect(order.every((x, k) => x > -1 && (k === 0 || x > order[k - 1]))).toBe(true);
  });

  it('long intel: two more slides, then More intel behind a details', () => {
    const m = MISSIONS.find((x) => splitWords(x.briefing, 35).length > 4);
    const html = renderBriefing(state, m.id);
    expect(deckOf(html)).toMatch(/<details class="brief-more" data-open-desktop><summary>More intel<\/summary>/);
  });

  it('a short mission renders no deck', () => {
    const short = MISSIONS.find((m) => m.id === 'outlook-recon-login');
    const html = renderBriefing(state, short.id);
    expect(html).not.toContain('data-deck');
    expect(html).not.toContain('brief--deck');
    expect(norm(html)).toContain(norm(short.briefing));
  });
});

describe('the "change the next 3" burst before the report is in', () => {
  it('Scout says the mission\'s own line, never "null"', () => {
    const m = MISSIONS.find((x) => x.id === PM_BURST_ID);
    const html = renderBriefing(state, PM_BURST_ID);
    expect(pmBurstBriefingLine(state)).toBeNull();
    expect(html).not.toMatch(/>\s*null\s*</);
    expect(read(html)).toContain(norm(m.scoutDialog.briefing));
  });
});
