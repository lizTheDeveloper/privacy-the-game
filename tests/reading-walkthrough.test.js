import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { renderDistrict } from '../src/screens/district.js';
import { resumeLine } from '../src/screens/city-map.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { MISSIONS, missionDistrict } from '../src/data/missions.js';
import {
  intelFor, setReadLevel, readLevel, gearTag, gearQuestions, setGear, visibleSteps, stepKey,
  markStep, progressFor, progressLabel, alreadyOption, canSayAlready, markAlready, missionsInProgress,
} from '../src/utils/reading.js';
import { recordSignal, readingOffer, markOffered } from '../src/utils/reading-signals.js';
import { pathChips, stuckHelp } from '../src/components/walkthrough.js';

const norm = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const byId = (id) => MISSIONS.find((m) => m.id === id);
const fresh = () => createInitialState();

// A mission with several plain steps and no device prefixes, for the walkthrough.
const MULTI = MISSIONS.find((m) => m.steps?.length >= 3 && !m.stepsByManager && !m.stepsBuilder && gearQuestions(m.steps).length === 0 && m.phase === 'fortify');
const FITNESS = byId('fitness-audit-data-sharing');

describe('reading levels', () => {
  const saved = {};
  afterEach(() => {
    for (const [id, v] of Object.entries(saved)) Object.assign(byId(id), v);
  });

  it('Short is the default; Full shows the intel as it always was', () => {
    expect(readLevel(fresh())).toBe('short');
    const m = { briefing: 'Long intel. Second sentence.', lead: 'Plain line.' };
    expect(intelFor(m, 'short')).toEqual({ intel: 'Plain line.', why: m.briefing });
    expect(intelFor(m, 'full')).toEqual({ intel: m.briefing, why: '' });
  });

  it('Simplest uses the mission’s simplest lead, else the plain lead', () => {
    const m = { briefing: 'B', lead: 'L', simple: { lead: 'S' } };
    expect(intelFor(m, 'simplest').intel).toBe('S');
    expect(intelFor({ briefing: 'B', lead: 'L' }, 'simplest').intel).toBe('L');
  });

  it('a mission with no lead (a player’s own account) shows its whole briefing at every level', () => {
    expect(intelFor({ briefing: 'B' }, 'short')).toEqual({ intel: 'B', why: '' });
  });

  it('the briefing shows the lead up front and the full intel behind "Why it matters"', () => {
    const m = MULTI;
    saved[m.id] = { lead: m.lead };
    m.lead = 'This stops apps reading your heart.';
    const html = renderBriefing(fresh(), m.id);
    expect(html).toContain('This stops apps reading your heart.');
    expect(html).toMatch(/<details class="brief-why" data-why><summary>Why it matters<\/summary>/);
    expect(norm(html)).toContain(norm(m.briefing));
    const full = renderBriefing(setReadLevel(fresh(), 'full'), m.id);
    expect(full).not.toContain('data-why');
  });

  it('Scout asks how much to read until the player picks, and the switch stays', () => {
    const html = renderBriefing(fresh(), MULTI.id);
    expect(html).toContain('data-read-ask');
    expect(html).toMatch(/data-action="read-level" data-level="short" aria-pressed="true"/);
    const picked = renderBriefing(setReadLevel(fresh(), 'full'), MULTI.id);
    expect(picked).not.toContain('data-read-ask');
    expect(picked).toMatch(/data-level="full" aria-pressed="true"/);
  });

  it('every briefing has Read it to me', () => {
    expect(renderBriefing(fresh(), MULTI.id)).toMatch(/data-action="read-aloud" data-say="[^"]{20,}"/);
  });
});

describe('device filtering', () => {
  it('tags a step by its opening label', () => {
    expect(gearTag({ text: 'Fitbit: open the Fitbit app' })).toEqual({ group: 'tracker', option: 'fitbit' });
    expect(gearTag({ text: 'On your iPhone: Settings → Privacy' })).toEqual({ group: 'phone', option: 'iphone' });
    expect(gearTag({ text: 'Android: Settings → Google' })).toEqual({ group: 'phone', option: 'android' });
    expect(gearTag({ text: 'Any tracker: check apps' })).toBeNull();
    expect(gearTag({ text: 'Open Settings' })).toBeNull();
  });

  it('asks only when a mission has steps for two or more options', () => {
    expect(gearQuestions([{ text: 'Fitbit: a' }, { text: 'b' }])).toEqual([]);
    expect(gearQuestions(FITNESS.steps)).toEqual([{ group: 'tracker', options: ['fitbit', 'apple_watch', 'garmin'] }]);
  });

  it('after the player says which, only their steps (and everyone’s) show', () => {
    const all = visibleSteps(FITNESS, fresh());
    expect(all).toHaveLength(FITNESS.steps.length);
    const mine = visibleSteps(FITNESS, setGear(fresh(), 'tracker', 'garmin')).map((s) => s.text);
    expect(mine.some((t) => /^Garmin:/.test(t))).toBe(true);
    expect(mine.some((t) => /^Fitbit:|^Apple Watch:/.test(t))).toBe(false);
    expect(mine.some((t) => /^Any tracker:/.test(t))).toBe(true);
    expect(visibleSteps(FITNESS, setGear(fresh(), 'tracker', 'all'))).toHaveLength(FITNESS.steps.length);
  });

  it('the briefing asks, then says what it is showing with a way to change it', () => {
    expect(renderBriefing(fresh(), FITNESS.id)).toContain('data-gear-ask="tracker"');
    const set = renderBriefing(setGear(fresh(), 'tracker', 'garmin'), FITNESS.id);
    expect(set).toContain('data-gear-set="tracker"');
    expect(norm(set)).toContain('Showing steps for Garmin');
    expect(set).toContain('data-action="gear-reset"');
  });

  it('setGear ignores a group or option that does not exist', () => {
    const s = fresh();
    expect(setGear(s, 'nope', 'x')).toBe(s);
    expect(setGear(s, 'phone', 'blackberry')).toBe(s);
  });
});

describe('the walkthrough', () => {
  const steps = () => visibleSteps(MULTI, fresh());

  it('a step key follows the words, not the position', () => {
    expect(stepKey({ text: 'Open <b>Settings</b>' })).toBe(stepKey({ text: 'Open Settings' }));
    expect(stepKey({ text: 'Open Settings' })).not.toBe(stepKey({ text: 'Open Privacy' }));
  });

  it('counts done and skipped steps and finds the next one', () => {
    const st = steps();
    let s = markStep(fresh(), MULTI.id, stepKey(st[0]), 'done');
    expect(progressFor(s, MULTI.id, st)).toMatchObject({ done: 1, handled: 1, current: 1, total: st.length });
    s = markStep(s, MULTI.id, stepKey(st[1]), 'skipped');
    expect(progressFor(s, MULTI.id, st)).toMatchObject({ skipped: 1, handled: 2, current: 2 });
    expect(progressLabel(progressFor(s, MULTI.id, st))).toBe(`Step 3 of ${st.length}`);
    s = markStep(s, MULTI.id, stepKey(st[0]), null);
    expect(progressFor(s, MULTI.id, st).current).toBe(0);
  });

  it('the briefing says "STEP n OF N", lights the next step and dims the done ones', () => {
    const st = steps();
    const s = markStep(fresh(), MULTI.id, stepKey(st[0]), 'done');
    const html = renderBriefing(s, MULTI.id);
    expect(html).toContain(`STEP 2 OF ${st.length}`);
    expect(html).toMatch(new RegExp(`data-step-key="${stepKey(st[0])}" class="walk-step is-done"`));
    expect(html).toMatch(new RegExp(`data-step-key="${stepKey(st[1])}" class="walk-step is-current"`));
    expect((html.match(/class="walk-step is-current"/g) || []).length).toBe(1);
    expect(html).toContain('data-action="step-done"');
    expect(html).toContain('data-action="step-stuck"');
  });

  it('a ticked step counts as started: the briefing offers I DID IT', () => {
    const st = steps();
    const html = renderBriefing(markStep(fresh(), MULTI.id, stepKey(st[0]), 'done'), MULTI.id);
    expect(html).toContain('data-action="i-did-it"');
  });

  it('when every step is handled it says so', () => {
    let s = fresh();
    for (const st of steps()) s = markStep(s, MULTI.id, stepKey(st), 'done');
    expect(renderBriefing(s, MULTI.id)).toContain(`ALL ${steps().length} STEPS HANDLED`);
  });

  it('the mission trail shows where the player is: read, steps, report', () => {
    expect(renderBriefing(fresh(), MULTI.id)).toMatch(/<li class="is-now" aria-current="step"><span class="mission-trail-n">1<\/span>Read/);
    const started = renderBriefing(markMissionStarted(fresh(), MULTI.id), MULTI.id);
    expect(started).toMatch(/aria-current="step"><span class="mission-trail-n">2<\/span>Steps 0\//);
    expect(renderDebrief(fresh(), MULTI.id)).toMatch(/aria-current="step"><span class="mission-trail-n">3<\/span>Report back/);
  });

  it('menu paths become chips, and an aside’s arrows stay words', () => {
    const p = pathChips('Open the app → Settings → Privacy');
    expect(p.lead).toBe('Open the app');
    expect(p.chips).toContain('<span class="walk-chip" data-path-chip="0">Settings</span>');
    expect(p.last).toBe('Privacy');
    expect(pathChips('Sign in (or on iPhone: Settings → your name)')).toBeNull();
    expect(pathChips('No arrows here')).toBeNull();
  });

  it('Stuck? names the place to search for and says skipping is fine', () => {
    const help = stuckHelp({ text: 'Open the app → Settings → Ad preferences → turn off everything you do not want shared' });
    expect(help[0]).toContain('“Ad preferences”');
    expect(help.at(-1)).toMatch(/OK to skip/);
    expect(stuckHelp({ text: 'x', help: 'Own help' })).toEqual(['Own help']);
  });
});

describe('progress outside the briefing', () => {
  it('a district row says CONTINUE and "Step n of N" once steps are ticked', () => {
    // A recon mission: its tab is open from the start (fortify waits for recon).
    const R = MISSIONS.find((m) => m.phase === 'recon' && m.steps?.length >= 3 && !m.stepsByManager && gearQuestions(m.steps).length === 0
      && renderDistrict(fresh(), missionDistrict(m), 'recon').includes(`#/mission/${m.id}/briefing`));
    const st = visibleSteps(R, fresh());
    const s = markStep(fresh(), R.id, stepKey(st[0]), 'done');
    const html = renderDistrict(s, missionDistrict(R), 'recon');
    expect(html).toMatch(new RegExp(`data-mission-progress>Step 2 of ${st.length}<`));
    expect(html).toMatch(new RegExp(`href="#/mission/${R.id}/briefing">CONTINUE`));
  });

  it('the city’s Scout offers to pick up the newest unfinished mission', () => {
    expect(resumeLine(fresh())).toBeNull();
    const st = visibleSteps(MULTI, fresh());
    const s = markStep(fresh(), MULTI.id, stepKey(st[0]), 'done');
    const line = resumeLine(s);
    expect(line.id).toBe(MULTI.id);
    expect(norm(line.text)).toContain(`You were on step 2 of ${st.length}`);
    // Filed: no longer offered.
    expect(missionsInProgress({ ...s, missions: { [MULTI.id]: { status: 'completed' } } }, (r) => Boolean(r?.status))).toEqual([]);
  });
});

describe('"I already have this"', () => {
  const withAlready = MISSIONS.find((m) => alreadyOption(m));
  const reconWithout = MISSIONS.find((m) => m.phase === 'recon' && !alreadyOption(m) && m.debriefQs?.length);

  it('is offered on fortify/reclaim missions and any mission with an "already" answer, never a recon look', () => {
    expect(canSayAlready(withAlready)).toBe(true);
    expect(canSayAlready(byId('gmail-fortify-2fa'))).toBe(true);
    expect(canSayAlready(reconWithout)).toBe(false);
    expect(renderBriefing(fresh(), withAlready.id)).toContain('data-action="already-have"');
    expect(renderBriefing(fresh(), reconWithout.id)).not.toContain('data-action="already-have"');
  });

  it('the report then has the "already" answer picked, and says why', () => {
    const { question, value } = alreadyOption(withAlready);
    const html = renderDebrief(markAlready(fresh(), withAlready.id), withAlready.id);
    expect(html).toMatch(new RegExp(`name="q_${question}" value="${value}" checked`));
    expect(html).toContain('Picked because you said you already have this');
    expect(renderDebrief(fresh(), withAlready.id)).not.toMatch(new RegExp(`value="${value}" checked`));
  });

  it('a 2FA mission (its report asks which kind) goes to the report with nothing picked for them', () => {
    const html = renderDebrief(markAlready(fresh(), 'gmail-fortify-2fa'), 'gmail-fortify-2fa');
    expect(html).not.toMatch(/ checked/);
    expect(norm(html)).toContain('Already done? Nice.');
  });
});

describe('reading signals stay on this phone', () => {
  it('Scout offers fewer words after three struggles, once', () => {
    let s = fresh();
    s = recordSignal(recordSignal(s, 'stuck'), 'skip');
    expect(readingOffer(s)).toBeNull();
    s = recordSignal(s, 'readAloud');
    expect(readingOffer(s)).toBe('simpler');
    expect(readingOffer(markOffered(s, 'simpler'))).toBeNull();
    expect(readingOffer(setReadLevel(s, 'simplest'))).toBeNull();
  });

  it('offers the full intel to someone who keeps opening it', () => {
    let s = fresh();
    for (let i = 0; i < 3; i++) s = recordSignal(s, 'why');
    expect(readingOffer(s)).toBe('full');
    expect(renderBriefing(s, MULTI.id)).toContain('data-read-offer="full"');
  });

  it('none of the reading, device or step handlers sends anything to analytics', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    const start = app.indexOf("} else if (action === 'read-level') {");
    const end = app.indexOf("} else if (action === 'i-did-it') {", start);
    expect(start).toBeGreaterThan(-1);
    const block = app.slice(start, end);
    expect(block).toContain("action === 'step-done'");
    expect(block).not.toMatch(/\btrack\(/);
    expect(block).not.toMatch(/captureError|fetch\(/);
    // The signals module itself imports nothing that can send.
    const signals = readFileSync(new URL('../src/utils/reading-signals.js', import.meta.url), 'utf8');
    const imports = signals.split('\n').filter((l) => /^import /.test(l)).join('\n');
    expect(imports).not.toMatch(/analytics|errors|collective/);
    expect(signals).not.toMatch(/fetch\(|track\(/);
  });
});
