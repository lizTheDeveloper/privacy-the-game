import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderNext, nextUp, simpleTitle } from '../src/screens/next.js';
import { renderHud } from '../src/components/hud.js';
import { renderMilestone } from '../src/screens/milestone.js';
import { createInitialState, markMissionStarted, updateMission, toggleAccount } from '../src/state.js';
import { setReadLevel, markStep, visibleSteps, stepKey } from '../src/utils/reading.js';
import { MISSIONS } from '../src/data/missions.js';
import { parseRoute } from '../src/router.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

// Liz 2026-11-18: after a report, Simple mode "just dumps you in the master keys and you're
// suddenly in recon again". One card instead: what happened, the one next thing, and that the
// game will be there when they come back.
const app = readFileSync('src/app.js', 'utf8');
const simple = () => setReadLevel(createInitialState(), 'simplest');
const GMAIL = 'gmail-recon-breach';

describe('What’s next (#/next)', () => {
  it('is a route', () => {
    expect(parseRoute('#/next').screen).toBe('next');
  });

  it('a new player gets one card: their first mission, with START and "I don’t have Gmail"', () => {
    const h = renderNext(simple());
    expect(h).toContain(`data-next-card="next" data-mission="${GMAIL}"`);
    expect(h).toContain('YOUR FIRST MISSION');
    expect(h).toContain('<span class="focus-title-main">Gmail</span>');
    expect(h).toContain(`href="#/mission/${GMAIL}/briefing">START &#9654;</a>`);
    expect(h).toContain('data-action="not-mine" data-account="gmail" data-href="#/next">I don’t have Gmail</button>');
    expect(h).toContain('Your progress is saved on this phone.');
  });

  it('half-done comes first, and says which step', () => {
    const m = MISSIONS.find((x) => x.id === GMAIL);
    let s = markMissionStarted(simple(), GMAIL);
    s = markStep(s, GMAIL, stepKey(visibleSteps(m, s, 'simplest')[0]), 'done');
    expect(nextUp(s).kind).toBe('resume');
    const h = renderNext(s);
    expect(h).toContain('KEEP GOING');
    expect(h).toContain('You were on step 2 of 3.');
    expect(h).not.toContain('data-action="not-mine"');
  });

  it('right after a report: "Sent to Scout", Scout’s line, then the next mission', () => {
    const s = updateMission(simple(), GMAIL, { status: 'completed', finding: 'no-breaches' });
    const h = renderNext(s, { filed: { id: GMAIL, reaction: { line: 'Clean. Nice.', feeling: 'happy' } } });
    expect(h).toContain('&#10003; Sent to Scout');
    expect(h).toContain('Clean. Nice.');
    expect(h).toMatch(/<div class="next-label">NEXT<\/div>/);
    expect(h).not.toContain(`data-mission="${GMAIL}"`);
  });

  it('after "I don’t have Gmail": Scout says so, with Put Gmail back, and the next mission isn’t Gmail', () => {
    const s = toggleAccount(simple(), 'gmail', false);
    const h = renderNext(s, { notMine: 'gmail' });
    expect(h).toContain('Got it. I took Gmail off your list.');
    expect(h).toContain('data-action="toggle-account" data-account="gmail">Put Gmail back</button>');
    expect(nextUp(s).mission.accountId).not.toBe('gmail');
  });

  it('simpleTitle drops the phase words', () => {
    expect(simpleTitle({ title: 'Breach Recon: Gmail' })).toBe('Gmail');
    expect(simpleTitle({ title: 'Check the passwords saved on your phone or computer' })).toBe('Check the passwords saved on your phone or computer');
  });
});

describe('getting there', () => {
  it('Simple mode files a report onto What’s next; Advanced keeps the district', () => {
    const fn = app.slice(app.indexOf('function afterMissionRecorded'), app.indexOf('function districtCardStats'));
    expect(fn).toMatch(/else if \(readLevel\(state\) === 'simplest'\) \{[\s\S]*?justFiled = \{ id: missionId, reaction, landed: false \};[\s\S]*?navigate\('#\/next'\);/);
    expect(fn).toContain('navigate(`#/district/${districtId}${targetTab}`)');
  });

  it('opening the game in Simple mode starts on What’s next (not the map or a district)', () => {
    expect(app).toMatch(/if \(started && readLevel\(state\) === 'simplest' && \/\^\(#\?\|#\\\/city\|#\\\/district\\\/\.\*\)\$\/\.test\(location\.hash\)\) history\.replaceState\(null, '', '#\/next'\);\ninitRouter\(render\);/);
  });

  it('picking Simple mode on the welcome screen starts there too', () => {
    const handler = app.slice(app.indexOf("} else if (action === 'begin-game') {"), app.indexOf("} else if (action === 'whoami-open') {"));
    expect(handler).toContain("if (el.dataset.level === 'simplest') history.replaceState(null, '', '#/next');");
  });

  it('the top bar has What’s next in Simple mode (not on mission screens, not in Advanced)', () => {
    expect(renderHud(simple())).toContain('<a class="hud-next" href="#/next">What’s next &#9654;</a>');
    expect(renderHud(simple(), { tools: '<div></div>' })).not.toContain('hud-next');
    expect(renderHud(setReadLevel(createInitialState(), 'full'))).not.toContain('hud-next');
    expect(renderNext(simple())).not.toContain('hud-next');
  });

  it('a finished district’s celebration carries on to What’s next in Simple mode', () => {
    expect(renderMilestone(simple(), 'master-keys')).toContain('href="#/next"');
    expect(renderMilestone(setReadLevel(createInitialState(), 'full'), 'master-keys')).not.toContain('href="#/next"');
  });
});

describe('one message at a time', () => {
  it('"I don’t have …" replaces the "Sent to Scout" message', () => {
    const block = app.slice(app.indexOf("} else if (action === 'not-mine') {"), app.indexOf("} else if (action === 'toggle-account') {"));
    expect(block).toContain('justFiled = null;');
  });
});
