import { describe, it, expect, beforeEach } from 'vitest';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { setReadLevel, visibleSteps, stepKey, markStep } from '../src/utils/reading.js';
import { markOpened, clearOpened } from '../src/utils/opened-steps.js';

// Simplest on a phone (Liz 2026-11-17): a big Back at the top left, one thing to do at a time,
// DONE only after the step's site is open, and every step says which site it happens on.
const ID = 'gmail-recon-breach';
const mission = MISSIONS.find((m) => m.id === ID);
const started = (level) => markMissionStarted(setReadLevel(createInitialState(), level), ID);
const steps = (s) => visibleSteps(mission, s);
const doneButton = /data-action="step-done"/;

beforeEach(() => clearOpened());

describe('Simplest step screens', () => {
  it('hold DONE back until OPEN is tapped, and make OPEN the big button', () => {
    const s = started('simplest');
    const first = steps(s)[0];
    expect(first.url).toBeTruthy();
    const before = renderBriefing(s, ID);
    expect(before).not.toMatch(doneButton);
    expect(before).toMatch(/class="btn-primary focus-go focus-open simple-open"[^>]*>OPEN THE WEBSITE/);
    expect(before).toContain('<span class="simple-host">haveibeenpwned.com</span>');

    markOpened(ID, stepKey(first));
    const after = renderBriefing(s, ID);
    expect(after).toMatch(doneButton);
    expect(after).toContain('Open the website again');
  });

  it('say which site a step without a link happens on', () => {
    let s = started('simplest');
    s = markStep(s, ID, stepKey(steps(s)[0]), 'done');
    const html = renderBriefing(s, ID);
    expect(html).toMatch(/class="simple-where"[^>]*>.*On <b>haveibeenpwned\.com<\/b>/s);
    expect(html).toContain('“Email address” box');
    expect(html).not.toContain('box at the top');
    expect(html).toMatch(doneButton); // nothing to open on this step
  });

  it('keep one copy of the steps, a big Back, and where you are in words', () => {
    const html = renderBriefing(started('simplest'), ID);
    expect(html).toContain('class="simple-back"');
    expect(html).toContain('data-action="show-briefing"'); // Back from step 1 is the briefing
    expect(html).toContain('Step 1 of');
    expect(html).not.toContain('focus-steps-peek');
    expect(html).not.toContain('mission-trail');
    expect((html.match(/Finished already\? Report back/g) || []).length).toBe(1); // the one shortcut to the report
    expect((html.match(/data-action="read-aloud"/g) || []).length).toBe(1);
    expect(html).toContain('brief-simple'); // the score bar and Support step aside (style.css)
  });

  it('Back from a later step goes to the step before', () => {
    let s = started('simplest');
    s = markStep(s, ID, stepKey(steps(s)[0]), 'done');
    expect(renderBriefing(s, ID)).toMatch(/class="simple-back" data-action="step-back"/);
  });
});

describe('Full intel keeps its step screen', () => {
  it('shows DONE without opening the site, and keeps its list and links', () => {
    const html = renderBriefing(started('full'), ID);
    expect(html).toMatch(doneButton);
    expect(html).toContain('focus-steps-peek');
    expect(html).not.toContain('brief-simple');
    // The step says "Open haveibeenpwned.com", so its button just says OPEN.
    expect(html).toMatch(/class="btn-secondary focus-open"[^>]*>OPEN &#8599;/);
  });
});
