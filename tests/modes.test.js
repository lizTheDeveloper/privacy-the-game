import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderHud } from '../src/components/hud.js';
import { topTools } from '../src/components/top-tools.js';
import { createInitialState } from '../src/state.js';
import { setReadLevel, readLevel, READ_LEVEL_LABELS } from '../src/utils/reading.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });
afterEach(() => vi.unstubAllGlobals());

// Liz 2026-11-18: Simple mode / Advanced mode, asked when the player taps PLAY, and switchable
// at the top next to "Support us" (with a tiny dollar sign).
const app = readFileSync('src/app.js', 'utf8');

describe('Simple mode and Advanced mode', () => {
  it('are the names of the two levels ("Full intel" is now Advanced mode)', () => {
    expect(READ_LEVEL_LABELS).toEqual({ simplest: 'Simple mode', full: 'Advanced mode' });
    const tools = topTools(setReadLevel(createInitialState(), 'full'), 'full', 'x');
    expect(tools).toContain('<span class="tt-long">Advanced mode</span><span class="tt-short" aria-hidden="true">Advanced</span>');
    expect(tools).not.toContain('Full intel');
  });

  it('PLAY asks which mode, and picking one starts the game in it', () => {
    const welcome = app.slice(app.indexOf('function modeChoice()'), app.indexOf('function renderWelcome()'));
    expect(welcome).toContain('How do you want to play?');
    expect(welcome).toMatch(/class="btn-primary mode-pick" data-action="begin-game" data-level="simplest">Simple mode/);
    expect(welcome).toMatch(/class="btn-secondary mode-pick" data-action="begin-game" data-level="full">Advanced mode/);
    const handler = app.slice(app.indexOf("} else if (action === 'begin-game') {"), app.indexOf("} else if (action === 'whoami-open') {"));
    expect(handler).toMatch(/if \(!el\.dataset\.level\) \{\s*choosingMode = true;/);
    expect(handler).toContain('state = setReadLevel(state, el.dataset.level);');
    expect(handler.indexOf('setReadLevel')).toBeLessThan(handler.indexOf('started = true'));
  });
});

describe('the top bar', () => {
  it('says Support us with a tiny dollar sign', () => {
    const h = renderHud(createInitialState());
    expect(h).toContain('<span class="hud-dollar" aria-hidden="true">$</span>SUPPORT US</a>');
  });

  it('offers the other mode next to Support us', () => {
    const advanced = renderHud(setReadLevel(createInitialState(), 'full'));
    expect(advanced).toContain('data-action="read-level" data-level="simplest" aria-label="Switch to Simple mode">Simple mode</button>');
    expect(advanced.indexOf('hud-mode')).toBeLessThan(advanced.indexOf('hud-support'));
    const simple = renderHud(setReadLevel(createInitialState(), 'simplest'));
    expect(simple).toContain('data-level="full" aria-label="Switch to Advanced mode">Advanced mode</button>');
  });

  it('leaves the switch to the tools row on mission screens', () => {
    expect(renderHud(createInitialState(), { tools: '<div>tools</div>' })).not.toContain('hud-mode');
  });

  it('the switch uses the same action as the mission screens’ switch', () => {
    const block = app.slice(app.indexOf("} else if (action === 'read-level') {"), app.indexOf("} else if (action === 'read-offer') {"));
    expect(block).toContain('setReadLevel(state, el.dataset.level)');
    expect(readLevel(setReadLevel(createInitialState(), 'full'))).toBe('full');
  });
});

describe('the step cards already told Scout', () => {
  it('a report the steps fully answered is sent by the last DONE, not asked again', async () => {
    const { MISSIONS } = await import('../src/data/missions.js');
    const { setStepAnswer, markStep, visibleSteps, stepKey } = await import('../src/utils/reading.js');
    const { stepReportAnswers } = await import('../src/utils/step-report.js');
    const { renderBriefing } = await import('../src/screens/briefing.js');
    const { markMissionStarted } = await import('../src/state.js');
    const m = MISSIONS.find((x) => x.id === 'gmail-recon-breach');
    let s = markMissionStarted(setReadLevel(createInitialState(), 'simplest'), m.id);
    expect(stepReportAnswers(s, m)).toBeNull();
    // Breaches found: the follow-up question isn't answered yet, so the report still asks.
    expect(stepReportAnswers(setStepAnswer(s, m.id, 'finding', '1-2-breaches'), m)).toBeNull();
    expect(stepReportAnswers(setStepAnswer(s, m.id, 'finding', 'made-up'), m)).toBeNull();
    s = setStepAnswer(s, m.id, 'finding', 'no-breaches');
    expect(stepReportAnswers(s, m)).toEqual({ finding: 'no-breaches' });
    const steps = visibleSteps(m, s);
    for (const st of steps.slice(0, -1)) s = markStep(s, m.id, stepKey(st), 'done');
    const h = renderBriefing(s, m.id);
    expect(h).toContain('data-sends>DONE &#10003; SEND TO SCOUT</button>');
    expect(h).toContain('Saved. Tap DONE to send it to Scout.');
    // Filed already: the report screen is the place to re-check, so nothing is sent from steps.
    expect(stepReportAnswers({ ...s, missions: { ...s.missions, [m.id]: { status: 'completed' } } }, m)).toBeNull();
  });

  it('the last DONE files it like SUBMIT REPORT', () => {
    const block = app.slice(app.indexOf('function fileFromSteps'), app.indexOf('// Re-check: the answers'));
    expect(block).toContain('fileDebrief(state, mission, answers)');
    expect(block).toContain('afterMissionRecorded(mission, filed.event)');
    expect(app).toMatch(/progressFor\(state, id, visibleSteps\(mission, state\)\)\.current === -1 && fileFromSteps\(mission\)\) return;/);
  });

  it('a Simple OPEN says how to get back', async () => {
    const { renderBriefing } = await import('../src/screens/briefing.js');
    const { markMissionStarted } = await import('../src/state.js');
    const h = renderBriefing(markMissionStarted(setReadLevel(createInitialState(), 'simplest'), 'gmail-recon-breach'), 'gmail-recon-breach');
    expect(h).toContain('target="_blank"');
    expect(h).toContain('tap <b>Back</b> to come back here.');
  });
});
