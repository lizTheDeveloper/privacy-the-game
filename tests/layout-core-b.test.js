// The mission briefing, step cards and report, questioned screen by screen from the Simple and
// the Advanced side (layout audit, 2026-11-20). Each test is one defect the audit found.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS, missionDistrict } from '../src/data/missions.js';
import { calcDistrictProgress } from '../src/utils/calc.js';
import { createInitialState, markMissionStarted, updateMission } from '../src/state.js';
import { setReadLevel, visibleSteps, stepKey, markStep, setStepAnswer } from '../src/utils/reading.js';
import { markOpened, clearOpened } from '../src/utils/opened-steps.js';
import { renderBriefing, ALREADY_STRONG } from '../src/screens/briefing.js';
import { renderDebrief, questionsLeftText } from '../src/screens/debrief.js';
import { onSiteSteps, sitePreview } from '../src/components/site-preview.js';
import { missionTrail } from '../src/components/walkthrough.js';
import { _resetFillBars } from '../src/components/fill-bar.js';

const byId = (id) => MISSIONS.find((m) => m.id === id);
const AMAZON = byId('amazon-recon-activity');
const BREACH = byId('gmail-recon-breach');
const ORDERS_STEP = AMAZON.steps.findIndex((st) => st.ask === 'orders');
const strip = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaries = (html) => (strip(html).match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
const doneClass = (html) => /<button class="([^"]*)\bfocus-done\b[^"]*" data-action="step-done"/.exec(html)?.[1] ?? null;

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  clearOpened();
  _resetFillBars();
});

function allOn(level = 'simplest') {
  let s = setReadLevel(createInitialState(), level);
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: true } } };
  return s;
}
// Started, every step before `upTo` ticked, and step `upTo`'s site opened.
function onStep(m, upTo, level = 'simplest') {
  let s = markMissionStarted(allOn(level), m.id);
  const steps = visibleSteps(m, s);
  for (const st of steps.slice(0, upTo)) s = markStep(s, m.id, stepKey(st), 'done');
  if (steps[upTo]) markOpened(m.id, stepKey(steps[upTo]));
  return s;
}

describe('1. DONE waits, as an outline, until the step’s question is answered', () => {
  for (const level of ['simplest', 'full']) {
    it(`${level}: the Amazon orders card`, () => {
      let s = onStep(AMAZON, ORDERS_STEP, level);
      const before = renderBriefing(s, AMAZON.id);
      expect(before).toContain('data-step-ask="orders"');
      expect(doneClass(before)).toMatch(/btn-secondary/);
      expect(primaries(before)).toBe(0);
      expect(before).not.toContain('Now tap DONE');
      // A Yes alone isn't an answer yet: "Did one of them order it?" is still to come.
      s = setStepAnswer(s, AMAZON.id, 'orders:yes', 'yes');
      expect(doneClass(renderBriefing(s, AMAZON.id))).toMatch(/btn-secondary/);
      s = setStepAnswer(s, AMAZON.id, 'orders', 'orders-unknown');
      const after = renderBriefing(s, AMAZON.id);
      expect(after).toContain('Now tap DONE');
      expect(doneClass(after)).toMatch(/btn-primary/);
      expect(primaries(after)).toBe(1);
    });
  }

  it('the breach card, and DONE still works when tapped early', () => {
    const at = visibleSteps(BREACH, allOn()).findIndex((st) => st.ask);
    const s = onStep(BREACH, at);
    const html = renderBriefing(s, BREACH.id);
    expect(doneClass(html)).toMatch(/btn-secondary/);
    // Not a gate: the same DONE, with its action, on the same step.
    expect(html).toMatch(/data-action="step-done" data-mission="gmail-recon-breach" data-step="[^"]+"/);
    expect(html).not.toMatch(/focus-done"[^>]*disabled/);
  });

  it('a step with no question keeps DONE bright', () => {
    const s = onStep(BREACH, 0);
    expect(doneClass(renderBriefing(s, BREACH.id))).toMatch(/btn-primary/);
  });
});

describe('2. a picked answer is cyan, not the “good” lime', () => {
  it('in style.css', () => {
    const css = readFileSync('src/style.css', 'utf8');
    const rule = css.match(/\.focus-ask-opt\.is-picked \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('border-color: var(--cyan)');
    expect(rule).not.toMatch(/lime|198,\s*255,\s*0/);
  });
});

describe('3. “When it opens:” never lists the next steps above a question', () => {
  it('a step that asks a question previews nothing', () => {
    expect(onSiteSteps(AMAZON.steps, ORDERS_STEP)).toEqual([]);
    expect(sitePreview(AMAZON.steps, ORDERS_STEP)).toBeNull();
    const html = renderBriefing(onStep(AMAZON, ORDERS_STEP), AMAZON.id);
    expect(html).not.toContain('data-site-preview');
    expect(html).not.toContain('Check that the email and phone number are yours');
  });

  it('every mission: no step with a question of its own previews the steps after it', () => {
    for (const m of MISSIONS) {
      const steps = m.steps || [];
      steps.forEach((st, i) => { if (st.ask) expect(onSiteSteps(steps, i), `${m.id} #${i}`).toEqual([]); });
    }
  });

  it('a step without a question still previews what to do on its site', () => {
    const steps = visibleSteps(BREACH, allOn());
    expect(onSiteSteps(steps, 0).length).toBeGreaterThan(0);
  });

  it('Advanced, on one page (YOUR MOVE lists every step): no second copy above GO DO IT', () => {
    const s = allOn('full');
    let checked = 0;
    for (const m of MISSIONS) {
      const html = renderBriefing(s, m.id);
      if (!html.includes('data-action="go-do-it"') || html.includes('brief--deck')) continue;
      expect(html, m.id).not.toContain('data-site-preview');
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('Advanced, as slides: the preview is for a phone only (on a computer the steps are stacked above it)', () => {
    const html = renderBriefing(allOn('full'), BREACH.id);
    expect(html).toContain('brief--deck');
    expect(html).toMatch(/<div class="phone-only"[^>]*>\s*<div class="site-preview/);
  });
});

describe('4. a report question reads as a question', () => {
  it('big, bold, in its own words; not grey capitals', () => {
    const html = renderDebrief(markMissionStarted(allOn(), BREACH.id), BREACH.id);
    expect(html).toContain('<h2 class="debrief-q">What did you find?</h2>');
    expect(html).not.toContain('WHAT DID YOU FIND?');
    const css = readFileSync('src/style.css', 'utf8');
    const rule = css.match(/\.debrief-q \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('font-size: 18px');
    expect(rule).toContain('font-weight: 700');
    expect(rule).toContain('color: var(--offwhite)');
  });
});

describe('5. SUBMIT REPORT lights only once every question has an answer', () => {
  const submit = (html) => /<button class="([^"]*)" data-action="submit-debrief"/.exec(html)?.[1];
  const left = (html) => /<span class="debrief-left" data-debrief-left( hidden)?>([^<]*)<\/span>/.exec(html);

  it('unanswered: an outline that says how many are left, and still clickable', () => {
    const html = renderDebrief(markMissionStarted(allOn(), AMAZON.id), AMAZON.id);
    expect(submit(html)).toBe('btn-secondary');
    expect(html).not.toMatch(/data-action="submit-debrief"[^>]*disabled/);
    const l = left(html);
    expect(l[1]).toBeUndefined();
    expect(l[2]).toMatch(/^\d+ questions left$/);
  });

  it('every question answered (SKIP counts): the one bright button, no count', () => {
    let s = markMissionStarted(allOn(), AMAZON.id);
    for (const q of AMAZON.debriefQs.filter((x) => !x.showIf)) {
      s = setStepAnswer(s, AMAZON.id, q.id, q.options.find((o) => o.severity === 'skip')?.value ?? q.options[0].value);
    }
    const html = renderDebrief(s, AMAZON.id);
    expect(submit(html)).toBe('btn-primary');
    expect(primaries(html)).toBe(1);
    expect(left(html)[1]).toBe(' hidden');
  });

  it('says it in plain words', () => {
    expect(questionsLeftText(1)).toBe('1 question left');
    expect(questionsLeftText(3)).toBe('3 questions left');
  });

  it('app.js keeps it up to date as answers are picked, and the last answer can scroll clear of the bar', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const refresh = app.slice(app.indexOf('function refreshDebriefForm'), app.indexOf("document.addEventListener('click'", app.indexOf('function refreshDebriefForm')));
    expect(refresh).toContain("classList.toggle('btn-primary', !left)");
    expect(refresh).toContain('questionsLeftText(left)');
    expect(refresh).not.toMatch(/track\(/);
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toMatch(/\.debrief-form \{ padding-bottom: \d+px; \}/);
  });
});

describe('6. SAFE / WARN / CRIT on the report form', () => {
  it('Simple: no tags (they hinted at the “right” answer)', () => {
    const html = renderDebrief(markMissionStarted(allOn('simplest'), BREACH.id), BREACH.id);
    expect(html).not.toMatch(/class="badge badge--(safe|warn|crit|skip)"/);
  });
  it('Advanced keeps them', () => {
    const html = renderDebrief(markMissionStarted(allOn('full'), BREACH.id), BREACH.id);
    expect(html).toMatch(/class="badge badge--safe"/);
    expect(html).toMatch(/class="badge badge--crit"/);
  });
});

describe('7. a filed report in Simple', () => {
  // Filed, with The Master Keys a quarter done (Scout's 25% check-in is due).
  const filed = (level) => {
    let s = updateMission(setReadLevel(createInitialState(), level), BREACH.id, { status: 'completed', finding: 'no-breaches' });
    for (const m of MISSIONS) {
      if (calcDistrictProgress(s, 'master-keys').percent >= 25) break;
      if (missionDistrict(m) === 'master-keys' && m.id !== BREACH.id && !m.optional) s = updateMission(s, m.id, { status: 'completed' });
    }
    return s;
  };
  it('goes on to What’s next, not the district', () => {
    const html = renderDebrief(filed('simplest'), BREACH.id);
    expect(html).toMatch(/href="#\/next" class="btn-primary"/);
    expect(html).not.toContain('BACK TO DISTRICT');
    expect(renderDebrief(filed('full'), BREACH.id)).toContain('BACK TO DISTRICT');
  });
  it('shows how far as the fill bar, not “PROGRESS: 25%”', () => {
    const simple = renderDebrief(filed('simplest'), BREACH.id);
    expect(simple).toContain('data-progress-check-in');
    expect(simple).toMatch(/data-fill-bar="district:master-keys"/);
    expect(simple).not.toMatch(/PROGRESS: \d+%/);
    expect(renderDebrief(filed('full'), BREACH.id)).toMatch(/PROGRESS: \d+%/);
  });
});

describe('8. the mission trail ticks the steps only when they are done', () => {
  it('“Steps 0/3” on the report has its number, not a tick', () => {
    const html = missionTrail('report', { handled: 0, total: 3 });
    const steps = html.match(/<li class="([^"]*)"[^>]*><span class="mission-trail-n">([^<]*)<\/span>Steps 0\/3/);
    expect(steps[1]).toBe('');
    expect(steps[2]).toBe('2');
    // Read is past, and ticked.
    expect(html).toMatch(/<li class="is-past"><span class="mission-trail-n">&#10003;<\/span>Read/);
  });
  it('all steps done: ticked', () => {
    expect(missionTrail('report', { handled: 3, total: 3 })).toMatch(/<li class="is-past"><span class="mission-trail-n">&#10003;<\/span>Steps 3\/3/);
  });
  it('“Already done” and a one-step mission keep their tick', () => {
    expect(missionTrail('report', { handled: 0, total: 3 }, { already: true })).toMatch(/&#10003;<\/span>Already done/);
    expect(missionTrail('report', { handled: 0, total: 1 })).toMatch(/&#10003;<\/span>Do it/);
  });
});

describe('9, 11, 12: asked once, said plainly, not repeated', () => {
  const PW = byId('gmail-fortify-password');
  it('Simple: the briefing leaves “where are your passwords saved” to the Before you start card', () => {
    const s = allOn('simplest');
    expect(renderBriefing(s, PW.id)).not.toContain('data-pm-ask');
    // Skipped that card: the briefing asks it, as before.
    const skipped = { ...s, stepProgress: { [PW.id]: { setup: 'skipped' } } };
    expect(renderBriefing(skipped, PW.id)).toContain('data-pm-ask');
    // Advanced asks it where it always did.
    expect(renderBriefing(allOn('full'), PW.id)).toContain('data-pm-ask');
  });

  it('Simple: “I already have this” on a password reset says what it means', () => {
    const html = renderBriefing(allOn('simplest'), PW.id);
    expect(html).toContain(ALREADY_STRONG);
    expect(html).not.toContain('I ALREADY HAVE THIS');
    expect(html).toMatch(/class="btn-secondary already-plain" data-action="already-have"/);
    expect(renderBriefing(allOn('full'), PW.id)).toContain('I ALREADY HAVE THIS');
  });

  it('Simple: the two-places step isn’t repeated in grey under its card; Change stays', () => {
    const BANK = byId('primary_bank-fortify-password');
    let s = markMissionStarted({ ...allOn('simplest'), gear: { phone: 'iphone', computer: 'windows' }, passwordManager: 'apple', passwordPlaces: ['apple', 'google'] }, BANK.id);
    const html = renderBriefing(s, BANK.id);
    expect(html).toMatch(/class="focus-step-text">Your passwords are in two places/);
    expect(html).not.toMatch(/data-pm-two>Your passwords are in two places/);
    expect(html).toMatch(/data-pm-two><button class="walk-link" data-action="set-password-manager"/);
    // On the next step the line comes back (that step doesn't say it).
    s = markStep(s, BANK.id, stepKey(visibleSteps(BANK, s)[0]), 'done');
    expect(renderBriefing(s, BANK.id)).toMatch(/data-pm-two>Your passwords are in two places/);
  });
});
