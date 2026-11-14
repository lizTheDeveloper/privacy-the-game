import { describe, it, expect } from 'vitest';
import { renderBriefing } from '../../src/screens/briefing.js';
import { renderDebrief } from '../../src/screens/debrief.js';
import { resumeLine } from '../../src/screens/city-map.js';
import { createInitialState, updateMission } from '../../src/state.js';
import { MISSIONS } from '../../src/data/missions.js';
import { missionSteps } from '../../src/utils/debrief.js';
import { PM_BURST_ID } from '../../src/utils/bursts.js';
import {
  setReadLevel, setGear, visibleSteps, stepKey, markStep, progressFor, missionsInProgress,
  gearQuestions, gearTag, alreadyOption, markAlready, readLevel,
} from '../../src/utils/reading.js';
import { recordSignal, readingOffer, markOffered } from '../../src/utils/reading-signals.js';
import { pathChips, stuckHelp, walkStepRow } from '../../src/components/walkthrough.js';
import { countWords, splitWords } from '../../src/components/deck.js';

const byId = (id) => MISSIONS.find((m) => m.id === id);
const fresh = () => createInitialState();
const norm = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const tickAll = (s, m, steps) => steps.reduce((acc, st) => markStep(acc, m.id, stepKey(st), 'done'), s);

describe('was a bug (breaker round, fixed in 7.14.0): a remembered device answer hides every device step in a mission that has none for that device', () => {
  // Player answers "Apple Watch" in fitness-audit-data-sharing (it has Apple Watch steps). The answer is
  // remembered per group. fitness-limit-sharing only has Fitbit and Garmin tracker steps, so visibleSteps
  // drops BOTH, and the player is left with no tracker step while the page says "Showing steps for Apple Watch".
  it('fitness-limit-sharing keeps a tracker step for an Apple Watch wearer', () => {
    const m = byId('fitness-limit-sharing');
    const s = setGear(fresh(), 'tracker', 'apple_watch');
    const shown = visibleSteps(m, s, 'full');
    const trackerSteps = m.steps.filter((st) => gearTag(st)?.group === 'tracker');
    expect(trackerSteps.length).toBeGreaterThan(0);
    // Either show the steps (the player has no matching ones) or ask again: hiding all of them is the bug.
    expect(shown.some((st) => trackerSteps.includes(st))).toBe(true);
  });

  it('fitness-audit-data-sharing leaves a Whoop/Oura wearer with 1 of 5 steps and no tracker steps', () => {
    const m = byId('fitness-audit-data-sharing');
    const s = setGear(fresh(), 'tracker', 'oura');
    const shown = visibleSteps(m, s, 'full');
    expect(shown.length).toBeGreaterThan(1);
  });

  it('the briefing does not claim "Showing steps for Apple Watch" when it shows none', () => {
    const m = byId('fitness-limit-sharing');
    const html = renderBriefing(setGear(fresh(), 'tracker', 'apple_watch'), m.id);
    const claims = /Showing steps for <strong>Apple Watch<\/strong>/.test(html);
    const hasWatchStep = /apple watch/i.test(norm(html.split('data-brief-step').slice(1).join(' ')));
    expect(claims && !hasWatchStep).toBe(false);
  });
});

describe('was a bug (breaker round, fixed in 7.14.0): switching reading level (which Scout offers after a struggle) throws away the ticks', () => {
  // Marks are keyed by step text; the Simplest steps are different text, so a player on step 3 of 4 who
  // takes Scout\'s "keep it simpler" offer is back at step 1, and the CONTINUE line disappears.
  const m = byId('gmail-recon-breach');
  it('has distinct simple steps (precondition)', () => {
    expect(m.simple.steps.length).toBeGreaterThan(1);
  });
  it('ticks made on Short still count after switching to Simplest', () => {
    let s = fresh();
    const short = visibleSteps(m, s, 'short');
    s = tickAll(s, m, short.slice(0, 2));
    expect(progressFor(s, m.id, short).handled).toBe(2);
    const simple = setReadLevel(s, 'simplest');
    expect(progressFor(simple, m.id, visibleSteps(m, simple)).handled).toBeGreaterThan(0);
  });
  it('the "pick up where you left off" line survives the switch', () => {
    let s = fresh();
    s = tickAll(s, m, visibleSteps(m, s, 'short').slice(0, 2));
    s = setReadLevel(s, 'simplest');
    expect(resumeLine(s)).not.toBeNull();
  });
});

describe('was a bug (breaker round, fixed in 7.14.0): pm-burst step text changes as the player works, so a ticked step un-ticks itself', () => {
  // The burst's "Start with the ones that are in the city too: A, B" step embeds account names, and tells the
  // player to file each account's Password Reset as they go. Filing one changes the text, so the key changes,
  // and the step the player already did comes back unticked.
  it('filing a flagged account\'s reset keeps the earlier ticks', () => {
    const burst = byId(PM_BURST_ID);
    let s = { ...fresh(), passwordManager: '1password', pmFlagged: ['gmail', 'yahoo'] };
    const before = missionSteps(burst, s);
    expect(before.some((st) => /in the city too/.test(st.text))).toBe(true);
    s = tickAll(s, burst, before);
    s = updateMission(s, 'gmail-fortify-password', { status: 'completed', action: 'changed' });
    const after = missionSteps(burst, s);
    const p = progressFor(s, burst.id, after);
    // every step the player ticked that still exists must still be ticked
    expect(p.handled).toBe(after.length);
  });
});

describe('was a bug (breaker round, fixed in 7.14.0): a damaged save entry crashes the city map\'s resume line', () => {
  it('missionsInProgress / resumeLine survive stepProgress with a null entry', () => {
    const s = { ...fresh(), stepProgress: { 'gmail-recon-breach': null } };
    expect(() => missionsInProgress(s, () => false)).not.toThrow();
    expect(() => resumeLine(s)).not.toThrow();
  });
});

describe('was a bug (breaker round, fixed in 7.14.0): menu-path chips split an aside\'s arrows, leaving a stray bracket and a bad search hint', () => {
  const real = [];
  for (const m of MISSIONS) for (const st of m.steps || []) real.push([m.id, st]);
  it('no chip has an unbalanced bracket', () => {
    const bad = [];
    for (const [id, st] of real) {
      const p = pathChips(st.text);
      if (!p) continue;
      const chips = [...p.chips.matchAll(/data-path-chip="\d+">([^<]*)</g)].map((x) => x[1]);
      for (const c of chips) if ((c.match(/\(/g) || []).length !== (c.match(/\)/g) || []).length) bad.push(`${id}: ${c}`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
  it('Stuck? never tells the player to search for a word with a stray bracket', () => {
    const bad = [];
    for (const [id, st] of real) {
      for (const l of stuckHelp(st)) {
        const q = l.match(/“([^”]*)”/g) || [];
        for (const t of q) if ((t.match(/\(/g) || []).length !== (t.match(/\)/g) || []).length) bad.push(`${id}: ${t}`);
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('guards: reading.js on odd inputs', () => {
  it('GUARD: a save from before this feature renders every briefing at every level', () => {
    const old = { ...fresh() };
    delete old.stepProgress; delete old.gear; delete old.reading; delete old.readingSignals;
    for (const m of MISSIONS.slice(0, 80)) {
      for (const l of ['short', 'full', 'simplest']) {
        const s = setReadLevel(old, l);
        expect(() => renderBriefing(s, m.id), m.id).not.toThrow();
      }
    }
    expect(resumeLine(old)).toBeNull();
  });
  it('GUARD: junk reading level falls back to short', () => {
    expect(readLevel({ reading: { level: '__proto__' } })).toBe('short');
    expect(readLevel({ reading: 'x' })).toBe('short');
  });
  it('GUARD: resumeLine skips a mission id that no longer exists', () => {
    const s = markStep(fresh(), 'gone-mission', 'k', 'done');
    expect(resumeLine(s)).toBeNull();
  });
  it('GUARD: no mission has two steps with the same key (ticks are keyed by text)', () => {
    const dups = [];
    for (const m of MISSIONS) {
      const lists = [m.steps, m.simple?.steps, ...Object.values(m.stepsByManager || {}), ...Object.values(m.reportSteps || {})].filter(Boolean);
      for (const l of lists) {
        const keys = l.map(stepKey);
        if (new Set(keys).size !== keys.length) dups.push(m.id);
      }
    }
    expect(dups).toEqual([]);
  });
  it('GUARD: step text cannot break out of the data-say attribute', () => {
    const m = byId('gmail-recon-breach');
    const html = walkStepRow({ mission: m, step: { text: 'Say "hi" <b onclick=x>there</b> & go → on' }, index: 0, current: true });
    const say = html.match(/data-say="([^"]*)"/)[1];
    expect(say).not.toMatch(/[<]/);
    expect(html.match(/data-say="/g).length).toBe(1);
  });
  it('GUARD: ticking then clearing the only mark takes the mission out of "in progress"', () => {
    let s = markStep(fresh(), 'gmail-recon-breach', 'k', 'done');
    s = markStep(s, 'gmail-recon-breach', 'k', null);
    expect(missionsInProgress(s, () => false)).toEqual([]);
  });
  it('GUARD: a one-step mission shows no step counter, and zero steps does not divide by zero', () => {
    const p = progressFor(fresh(), 'x', []);
    expect(p).toMatchObject({ total: 0, handled: 0, current: -1 });
  });
  it('GUARD: "already" pre-picks the first question\'s already option on the report', () => {
    const m = byId('gmail-fortify-password');
    const opt = alreadyOption(m);
    expect(opt.value).toBe('already-strong');
    const html = renderDebrief(markAlready(fresh(), m.id), m.id);
    expect(html).toMatch(new RegExp(`value="${opt.value}"[^>]*checked|checked[^>]*value="${opt.value}"`));
  });
  it('GUARD: the offer is made once and a "no" is remembered', () => {
    let s = fresh();
    for (let i = 0; i < 3; i++) s = recordSignal(s, 'skip');
    expect(readingOffer(s)).toBe('simpler');
    s = markOffered(s, 'simpler');
    expect(readingOffer(s)).toBeNull();
  });
});
