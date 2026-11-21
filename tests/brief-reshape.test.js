// The briefing and report, reshaped (layout audit picks 4-7, Liz 2026-11-20).
// 4: the bank panel moves to the step that needs it. 5: two places are a chip on each step.
// 6: Advanced reads a briefing as one scroll. 7: Simple answers the report one question per card.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../src/data/missions.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { setReadLevel, setReadAloud, visibleSteps, stepKey, markStep, setStepAnswer } from '../src/utils/reading.js';
import { setPasswordPlaces } from '../src/utils/password-places.js';
import { addBankNote, bankStepIndex } from '../src/utils/bank-notes.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { fileDebrief } from '../src/utils/debrief.js';
import { missionSteps } from '../src/utils/debrief.js';
import { clearOpened } from '../src/utils/opened-steps.js';
import { _resetFillBars } from '../src/components/fill-bar.js';

const byId = (id) => MISSIONS.find((m) => m.id === id);
const BANK_PW = byId('primary_bank-fortify-password');
const PM = byId('password_manager-recon-report');
const AMAZON = byId('amazon-recon-activity');
const BREACH = byId('gmail-recon-breach');
const strip = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaries = (html) => (strip(html).match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  clearOpened();
  _resetFillBars();
});

const base = (level = 'simplest') => ({ ...setReadLevel(createInitialState(), level), gear: { phone: 'iphone', computer: 'windows' } });
const two = (level) => setPasswordPlaces(base(level), ['apple', 'google']);
function withBanks(s) {
  for (const n of [{ name: 'Chase', loginUrl: 'https://chase.example/login' }, { name: 'Credit Union', loginUrl: 'https://cu.example/' }]) s = addBankNote(s, n).state;
  return s;
}
// Started, with the steps before step `at` ticked.
function onStep(s, m, at) {
  let st = markMissionStarted(s, m.id);
  for (const step of visibleSteps(m, st).slice(0, at)) st = markStep(st, m.id, stepKey(step), 'done');
  return st;
}

describe('4. the bank panel moves to the step that needs it', () => {
  for (const level of ['simplest', 'full']) {
    it(`${level}: the briefing has no YOUR BANKS panel; START is the one bright button`, () => {
      const html = renderBriefing(withBanks(two(level)), BANK_PW.id);
      expect(html).not.toContain('data-bank-panel');
      // The pointers are one tap away on the bank step (Advanced lists that step on its briefing).
      expect(html.replace(/<details class="bank-note-where"[\s\S]*?<\/details>/g, '')).not.toContain('chrome://password-manager');
      if (level === 'simplest') expect(html).not.toContain('data-bank-step');
      expect(primaries(html)).toBe(1);
      expect(html).toContain('data-action="start-mission"');
    });

    it(`${level}: the log-in step has the saved banks as chips, each saying what it opens, and the pointers behind “Where’s my password?”`, () => {
      const s = withBanks(two(level));
      const steps = visibleSteps(BANK_PW, s);
      const at = bankStepIndex(steps);
      expect(steps[at].text).toMatch(/^Log into your bank/);
      const html = renderBriefing(onStep(s, BANK_PW, at), BANK_PW.id);
      const chips = [...html.matchAll(/<a class="bank-note-link bank-note-chip" href="([^"]+)"[^>]*data-action="bank-note-open"[^>]*><span class="bank-note-chip-name">([^<]+)<\/span><span class="bank-note-chip-what">([^<]+)</g)];
      expect(chips.map((c) => c[1])).toEqual(['https://chase.example/login', 'https://cu.example/']);
      expect(chips.every((c) => c[3] === 'Opens its log-in page')).toBe(true);
      expect(html).toMatch(/<details class="bank-note-where" data-bank-where><summary>Where’s my password\?<\/summary>[\s\S]*data-pm-pointer[\s\S]*<\/details>/);
      expect(html).not.toContain('data-bank-line');
    });

    it(`${level}: every other step has one line, “Your banks: … · edit”`, () => {
      const s = withBanks(two(level));
      const at = bankStepIndex(visibleSteps(BANK_PW, s));
      const html = renderBriefing(onStep(s, BANK_PW, at + 1), BANK_PW.id);
      expect(html).not.toContain('data-bank-step');
      const line = html.match(/<p class="bank-note-line" data-bank-line>([\s\S]*?)<\/p>/)?.[1];
      expect(line).toMatch(/^Your banks: <a class="bank-note-link" href="https:\/\/chase\.example\/login"/);
      expect(line).toContain('Credit Union &#8599;');
      expect(line).toMatch(/<a class="bank-note-edit-link" href="#\/vault\/banks\?from=primary_bank-fortify-password">edit<\/a>$/);
    });
  }

  it('no saved banks: the bank step has a compact “Add your bank” that comes back to the mission; the others say nothing', () => {
    const s = two('simplest');
    const at = bankStepIndex(visibleSteps(BANK_PW, s));
    const html = renderBriefing(onStep(s, BANK_PW, at), BANK_PW.id);
    expect(html).toContain('<a class="btn-secondary bank-note-add" href="#/vault/banks?from=primary_bank-fortify-password">Add your bank</a>');
    expect(renderBriefing(onStep(s, BANK_PW, at + 1), BANK_PW.id)).not.toMatch(/data-bank-(?:line|step)/);
  });

  it('the bank step is the one that needs the address, for every bank mission', () => {
    const want = {
      'primary_bank-fortify-password': /^Log into your bank/,
      'primary_bank-recon-password': /^Go to your bank’s site/,
      'credit_card-recon-password': /^In the card issuer’s app/,
      'investment_account-recon-password': /^Open your brokerage’s own security page/,
      'primary_bank-fortify-2fa-upgrade': /^Open your primary bank’s security settings/,
      'crypto_exchange-fortify-lockdown': /^Log into your crypto exchange/,
    };
    for (const [id, re] of Object.entries(want)) {
      const steps = visibleSteps(byId(id), base('full'));
      expect(steps[bankStepIndex(steps)]?.text, id).toMatch(re);
    }
  });

  it('Simple: the lore is behind a “Story” disclosure', () => {
    let found = 0;
    for (const m of MISSIONS.slice(0, 80)) {
      const html = renderBriefing(base('simplest'), m.id);
      if (!html.includes('brief-lore-title')) continue;
      found++;
      expect(html, m.id).toMatch(/<details class="brief-story" data-story><summary>Story<\/summary>\s*<div class="section-label brief-lore-title"/);
    }
    expect(found).toBeGreaterThan(0);
  });
});

describe('5. two places: a chip on each step, no step that only states them', () => {
  const chip = (html) => html.match(/<span class="place-chip" data-place="(\w+)"><span aria-hidden="true">[^<]*<\/span> ([^<]+)<\/span>/)?.slice(1);
  const line = (html) => html.match(/<p class="place-line" data-place-line>([^<]+)<\/p>/)?.[1] ?? null;

  it('no mission has a step that only says where the passwords are', () => {
    for (const m of MISSIONS.filter((x) => x.stepsByManager)) {
      for (const [key, steps] of Object.entries(m.stepsByManager)) {
        for (const st of steps) expect(st.text, `${m.id} ${key}`).not.toMatch(/passwords are in two places/);
        if (key.includes('+')) expect(steps[0].place, `${m.id} ${key}`).toBeTruthy();
      }
    }
  });

  it('a reset in two places: the iPhone on every step, then “Now in Chrome” with one plain line', () => {
    const s = two('simplest');
    const steps = visibleSteps(BANK_PW, s);
    const seen = steps.map((_, i) => {
      const html = renderBriefing(onStep(s, BANK_PW, i), BANK_PW.id);
      return [...chip(html), line(html)];
    });
    expect(seen.slice(0, -1).every(([kind, label, l]) => kind === 'phone' && label === 'On your iPhone' && l === null)).toBe(true);
    expect(seen.at(-1)).toEqual(['computer', 'Now in Chrome', 'Now switch to your computer.']);
  });

  it('the password check in two places: the phone’s steps, then the computer’s, the first saying to do the same', () => {
    const s = two('simplest');
    const steps = missionSteps(PM, s);
    const first = steps.findIndex((st) => st.place?.kind === 'computer');
    expect(first).toBeGreaterThan(0);
    const html = renderBriefing(onStep(s, PM, first), PM.id);
    expect(chip(html)).toEqual(['computer', 'Now in Chrome']);
    expect(line(html)).toBe('Now do the same on your computer.');
    const after = renderBriefing(onStep(s, PM, first + 1), PM.id);
    if (steps[first + 1]?.place) expect(chip(after)).toEqual(['computer', 'In Chrome']);
  });

  it('“Change where my passwords are” is on the first card; both places are still remembered and used', () => {
    const s = two('simplest');
    const html = renderBriefing(onStep(s, BANK_PW, 0), BANK_PW.id);
    expect(html).toContain('>Change where my passwords are</button>');
    expect(renderBriefing(onStep(s, BANK_PW, 1), BANK_PW.id)).not.toContain('Change where my passwords are');
    expect(missionSteps(BANK_PW, s).at(-1).text).toMatch(/^Now update Chrome on your computer too/);
  });

  it('Advanced lists every step, with the chip where the place starts and where it changes', () => {
    const html = renderBriefing(two('full'), BANK_PW.id);
    expect((html.match(/class="place-chip"/g) || []).length).toBe(2);
    expect(html).toContain('Now in Chrome');
  });
});

describe('6. Advanced: a briefing is one scroll', () => {
  const adv = () => base('full');
  it('no deck on a phone; every step numbered; the action pinned', () => {
    const html = renderBriefing(adv(), BREACH.id);
    expect(html).not.toContain('data-deck');
    expect(html).toContain('brief--onepage');
    const steps = visibleSteps(BREACH, adv());
    expect((html.match(/data-step-num/g) || []).length).toBe(steps.length);
    expect(html).toMatch(/<div class="pin-bottom brief-go">[\s\S]*data-action="go-do-it"/);
  });

  it('long intel is trimmed to three lines with More; short intel is as it was', () => {
    const long = MISSIONS.find((m) => m.briefing.split(/\s+/).length > 40);
    expect(renderBriefing(adv(), long.id)).toMatch(/<details class="brief-intel-more"><summary><span class="brief-intel-text" data-intel/);
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toMatch(/\.brief-intel-more:not\(\[open\]\) \.brief-intel-text \{[^}]*-webkit-line-clamp: 3/);
    // On a computer too, the button stays on screen (sticky at every width, not only phones).
    expect(css).toMatch(/\.brief--onepage \.pin-bottom \{ position: sticky; bottom: 0;/);
  });

  it('Read it to me keeps the deck, slide by slide', () => {
    const html = renderBriefing(setReadAloud(adv(), true), BREACH.id);
    expect(html).toContain('data-deck');
    expect(html).toContain('brief--deck');
  });

  it('Simple’s briefing is unchanged by this: the compact page', () => {
    const html = renderBriefing(base('simplest'), BREACH.id);
    expect(html).toContain('brief-focus');
    expect(html).not.toContain('brief--onepage');
  });
});

// What app.js readAnswers takes from a form: the checked inputs (and typed numbers), by question.
function answersIn(html, mission) {
  const out = {};
  for (const q of mission.debriefQs) {
    const checked = [...html.matchAll(new RegExp(`<input type="(?:radio|checkbox)" name="q_${q.id}" value="([^"]*)" checked`, 'g'))].map((m) => m[1]);
    if (q.multi) { if (checked.length) out[q.id] = checked; } else if (checked.length) out[q.id] = checked[0];
  }
  return out;
}
const fields = (html) => [...html.matchAll(/<input type="(?:radio|checkbox|number)" name="(q_[^"]+)"(?: value="([^"]*)")?/g)].map((m) => `${m[1]}=${m[2] ?? ''}`).sort();

describe('7. Simple: the report, one question per card', () => {
  const started = (level) => markMissionStarted(base(level), AMAZON.id);

  it('one question shows at a time, with a fill bar and NEXT', () => {
    const html = renderDebrief(started('simplest'), AMAZON.id);
    expect(html).toContain('data-cards');
    expect((html.match(/is-card-now/g) || []).length).toBe(1);
    expect(html).toMatch(/data-question="pw_status" class="is-card-now"/);
    expect(html).toMatch(/data-fill-bar="report:amazon-recon-activity"/);
    expect(html).toContain('data-action="debrief-next"');
    // Back is hidden on the first card; SUBMIT REPORT waits for the last.
    expect(html).toMatch(/data-action="debrief-back" hidden/);
    expect(html).toMatch(/<span data-debrief-submit hidden>/);
    // Unanswered, nothing is bright.
    expect(primaries(html)).toBe(0);
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toContain('.debrief-form[data-cards] [data-question]:not(.is-card-now) { display: none; }');
  });

  it('a question the step cards answered is skipped, and shown at the end under “You told us:” with Change', () => {
    const s = setStepAnswer(started('simplest'), AMAZON.id, 'orders', 'orders-household');
    const html = renderDebrief(s, AMAZON.id);
    expect(html).toMatch(/data-question="orders" data-told/);
    expect(html).toMatch(/<div class="debrief-told" data-debrief-told hidden><p class="debrief-told-head">You told us:<\/p>/);
    expect(html).toContain('data-action="debrief-change" data-question="orders"');
  });

  it('every question answered on the steps: “You told us:” and SUBMIT REPORT, the one bright button', () => {
    let s = started('simplest');
    for (const [q, v] of [['pw_status', 'pw-clean'], ['orders', 'orders-clean'], ['activity', 'activity-clean']]) s = setStepAnswer(s, AMAZON.id, q, v);
    const html = renderDebrief(s, AMAZON.id);
    expect(html).not.toContain('is-card-now');
    expect(html).toMatch(/<div class="debrief-told" data-debrief-told><p/);
    expect(html).toMatch(/<span data-debrief-submit><button class="btn-primary" data-action="submit-debrief"/);
    expect(primaries(html)).toBe(1);
  });

  it('the cards are the same form fields as the full form, so SUBMIT files the same answers', () => {
    for (const m of [AMAZON, BREACH, byId('primary_bank-fortify-2fa')]) {
      let s = base('simplest');
      s = markMissionStarted(s, m.id);
      s = setStepAnswer(s, m.id, m.debriefQs[0].id, m.debriefQs[0].options[0].value);
      const simple = renderDebrief(s, m.id);
      const full = renderDebrief(setReadLevel(s, 'full'), m.id);
      expect(fields(simple), m.id).toEqual(fields(full));
      expect(answersIn(simple, m), m.id).toEqual(answersIn(full, m));
      const a = fileDebrief(s, m, { ...answersIn(simple, m), ...Object.fromEntries(m.debriefQs.filter((q) => !q.showIf && !(q.id in answersIn(simple, m))).map((q) => [q.id, q.options.at(-1).value])) });
      const b = fileDebrief(s, m, { ...answersIn(full, m), ...Object.fromEntries(m.debriefQs.filter((q) => !q.showIf && !(q.id in answersIn(full, m))).map((q) => [q.id, q.options.at(-1).value])) });
      // The same answers (when each was filed, a millisecond apart under load, aside).
      const untimed = (r) => Object.fromEntries(Object.entries(r || {}).filter(([k]) => !/At$|time|date/i.test(k)));
      expect(untimed(a?.state.missions[m.id]), m.id).toEqual(untimed(b?.state.missions[m.id]));
      expect(a?.state.missions[m.id]?.status, m.id).toBeTruthy();
      // One submit path: the same button, the same action.
      expect(simple).toContain('data-action="submit-debrief" data-mission="' + m.id + '"');
    }
  });

  it('the card asks in the step card’s words where they stand alone', () => {
    const html = renderDebrief(markMissionStarted(base('simplest'), BREACH.id), BREACH.id);
    expect(html).toContain('<h2 class="debrief-q">Were you in any leaks?</h2>');
  });

  it('Advanced keeps the full form; a re-check stays the full form', () => {
    const html = renderDebrief(started('full'), AMAZON.id);
    expect(html).not.toContain('data-cards');
    expect(html).not.toContain('is-card-now');
    expect(html).not.toContain('debrief-next');
    expect(html).toMatch(/<div class="pin-bottom">[\s\S]*data-action="submit-debrief"/);
  });

  it('app.js moves the cards and nothing else: no answer goes to track()', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const block = app.slice(app.indexOf("} else if (action === 'debrief-next'"), app.indexOf("} else if (action === 'submit-debrief') {"));
    expect(block).toContain('moveDebriefCard(app');
    expect(block).toContain('changeToldAnswer(app');
    expect(block).not.toMatch(/track\(|fetch\(|sendBeacon/);
    const deb = readFileSync('src/screens/debrief.js', 'utf8');
    expect(deb).not.toMatch(/track\(|fetch\(|sendBeacon/);
  });
});
