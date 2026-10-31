import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderBriefing } from '../src/screens/briefing.js';
import { MISSIONS } from '../src/data/missions.js';
import { createInitialState } from '../src/state.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

// Liz 2026-10-31: "GO DO IT AGAIN" on Instagram's recon opened nothing (data-url="#": a second copy of
// the game). 83 missions had no site to open.
describe('GO DO IT never opens nothing', () => {
  it('no briefing has a go button whose url is "#" or empty', () => {
    const s = createInitialState();
    const bad = [];
    for (const m of MISSIONS) {
      for (const started of [false, true]) {
        const st = started ? { ...s, startedMissions: { [m.id]: '2026-10-31T00:00:00Z' } } : s;
        const h = renderBriefing(st, m.id);
        for (const [, url] of h.matchAll(/data-action="go-do-it"[^>]*data-url="([^"]*)"/g)) if (url === '#' || url === '') bad.push(`${m.id}${started ? ' (again)' : ''}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('a mission with nothing to open says START, stays on its steps, and has no GO DO IT AGAIN', () => {
    const s = createInitialState();
    const fresh = renderBriefing(s, 'instagram-recon-service');
    expect(fresh).toContain('data-action="start-mission"');
    expect(fresh).toContain('START &#9654;');
    expect(fresh).not.toContain('data-action="go-do-it"');
    const again = renderBriefing({ ...s, startedMissions: { 'instagram-recon-service': '2026-10-31T00:00:00Z' } }, 'instagram-recon-service');
    expect(again).toContain('I DID IT');
    expect(again).not.toContain('GO DO IT AGAIN');
  });

  it('a mission with a site still opens it', () => {
    const withUrl = MISSIONS.find((m) => (m.steps ?? []).some((st) => st.url));
    expect(renderBriefing(createInitialState(), withUrl.id)).toMatch(/data-action="go-do-it"[^>]*data-url="https?:/);
  });

  it('START records the start and re-draws the briefing; it never leaves for the debrief', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const i = app.indexOf("} else if (action === 'start-mission') {");
    expect(i).toBeGreaterThan(-1);
    const block = app.slice(i, i + 500);
    expect(block).toContain('markMissionStarted');
    expect(block).toContain('renderCurrentRoute()');
    expect(block).not.toContain('cheerThenGo');
  });
});

describe('buttons that refuse say why', () => {
  it('SUBMIT REPORT with a question unanswered shows a message and goes to the question', async () => {
    const { renderDebrief } = await import('../src/screens/debrief.js');
    const h = renderDebrief(createInitialState(), 'gmail-recon-breach');
    expect(h).toMatch(/data-debrief-msg role="status" hidden[^>]*>Answer every question to file the report\./);
    const app = readFileSync('src/app.js', 'utf8');
    const fn = app.slice(app.indexOf('function submitDebrief'), app.indexOf('function submitRecheck'));
    expect(fn).toMatch(/if \(!filed\) \{[\s\S]*msg\.hidden = false[\s\S]*focus/);
  });

  it('ADD with no number shows a message and puts the cursor in the box', async () => {
    const pp = readFileSync('src/components/password-progress.js', 'utf8');
    expect(pp).toContain('data-pm-cat-msg="${districtId}" role="status" hidden');
    const app = readFileSync('src/app.js', 'utf8');
    expect(app).toMatch(/kind === 'flag' \|\| kind === 'changed'\) \{[\s\S]{0,300}msg\.hidden = false[\s\S]{0,200}focus\(\)/);
  });
});

describe('the candle is a real toggle', () => {
  it('pressing a lit candle puts it out; lighting stays idempotent', async () => {
    const { lightCandle, putOutCandle, isCandleLit } = await import('../src/utils/interior-state.js');
    const lit = lightCandle(createInitialState(), 'snowden');
    expect(isCandleLit(lit, 'snowden')).toBe(true);
    const out = putOutCandle(lit, 'snowden');
    expect(isCandleLit(out, 'snowden')).toBe(false);
    expect(putOutCandle(out, 'snowden')).toBe(out);
    const app = readFileSync('src/app.js', 'utf8');
    expect(app).toContain("isCandleLit(state, el.dataset.saint) ? putOutCandle(state, el.dataset.saint) : lightCandle(state, el.dataset.saint)");
  });

  it('+ ADD with no name puts the cursor in the box', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const i = app.indexOf("action === 'add-custom-account'");
    expect(app.slice(i, i + 500)).toMatch(/if \(!name\) \{[\s\S]*input\?\.focus\(\)/);
  });
});
