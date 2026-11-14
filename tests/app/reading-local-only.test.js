// The reading level, device answers, step ticks, skips, Stuck?, Read it to me, focus music and
// "I already have this" stay on this device (utils/reading.js, utils/reading-signals.js).
// Driven through the real app.js handlers with every way out watched. The one thing sent is
// the game's existing mission-started, once, when a first tick starts a mission (the control).
import { describe, it, expect, afterEach, vi } from 'vitest';
import { bootApp } from '../helpers/app-harness.mjs';
import { createInitialState, markMissionStarted } from '../../src/state.js';
import { MISSIONS } from '../../src/data/missions.js';
import { visibleSteps, stepKey } from '../../src/utils/reading.js';

vi.setConfig({ testTimeout: 30000 });
afterEach(() => vi.unstubAllGlobals());

const FITNESS = MISSIONS.find((m) => m.id === 'fitness-audit-data-sharing');
const keys = (s) => visibleSteps(FITNESS, s).map(stepKey);
const umami = (h) => h.egress().filter(([ch]) => ch === 'umami.track');

describe('reading and step actions send nothing', () => {
  it('level, device, tick, untick, skip and Stuck? change the save and send nothing', async () => {
    const start = markMissionStarted(createInitialState(), FITNESS.id);
    const h = await bootApp({ state: start, hash: `#/mission/${FITNESS.id}/briefing` });
    h.clearEgress();
    await h.click('read-level', { level: 'simplest' });
    await h.click('gear-pick', { group: 'tracker', value: 'garmin' });
    const [k0, k1, k2] = keys(h.state());
    await h.click('step-done', { mission: FITNESS.id, step: k0 });
    await h.click('step-toggle', { mission: FITNESS.id, step: k0 });
    await h.click('step-toggle', { mission: FITNESS.id, step: k0 });
    await h.click('step-skip', { mission: FITNESS.id, step: k1 });
    h.setQuery(`#stuck-${k2}`, { value: undefined });
    await h.click('step-stuck', { mission: FITNESS.id, step: k2 });
    await h.click('read-aloud', { say: 'Open the app' });
    await h.click('focus-music', {});
    const s = h.state();
    expect(s.reading.level).toBe('simplest');
    expect(s.gear.tracker).toBe('garmin');
    expect(s.stepProgress[FITNESS.id].marks).toEqual({ [k0]: 'done', [k1]: 'skipped' });
    expect(s.readingSignals.skip).toBe(1);
    expect(h.egress()).toEqual([]);
  });

  it('I already have this sends nothing', async () => {
    const id = 'gmail-reclaim-privacy';
    const h = await bootApp({ state: createInitialState(), hash: `#/mission/${id}/briefing` });
    h.clearEgress();
    await h.click('already-have', { mission: id });
    expect(h.state().stepProgress[id].already).toBe(true);
    expect(h.egress()).toEqual([]);
  });

  it('control: the first tick of an unstarted mission sends mission-started, once, and nothing about the step', async () => {
    const h = await bootApp({ state: createInitialState(), hash: `#/mission/${FITNESS.id}/briefing` });
    h.clearEgress();
    const [k0, k1] = keys(h.state());
    await h.click('step-done', { mission: FITNESS.id, step: k0 });
    await h.click('step-done', { mission: FITNESS.id, step: k1 });
    const calls = umami(h);
    expect(calls.map((c) => c[1])).toEqual(['mission-started']);
    expect(JSON.stringify(h.egress())).not.toContain(k0);
    expect(h.state().startedMissions[FITNESS.id]).toBeTruthy();
  });
});
