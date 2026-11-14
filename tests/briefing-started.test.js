import { describe, it, expect } from 'vitest';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';

const MISSION = 'gmail-recon-breach';

describe('starting a mission is remembered (mobile: the other site opens in another tab)', () => {
  it('markMissionStarted records the mission without touching its status', () => {
    const s = markMissionStarted(createInitialState(), MISSION);
    expect(typeof s.startedMissions[MISSION]).toBe('string');
    expect(s.missions[MISSION]).toBeUndefined();
  });

  it('an unstarted briefing offers one START (a mission with several steps) and no I DID IT', () => {
    const html = renderBriefing(createInitialState(), MISSION);
    expect(html).toContain('data-action="start-mission"');
    expect(html).not.toContain('data-action="i-did-it"');
  });

  it('the Full intel level keeps GO DO IT before the start', () => {
    const html = renderBriefing(setReadLevel(createInitialState(), 'full'), MISSION);
    expect(html).toContain('data-action="go-do-it"');
  });

  it('a started mission shows one step at a time: its site, DONE, and a way to report back', () => {
    const html = renderBriefing(markMissionStarted(createInitialState(), MISSION), MISSION);
    expect(html).toContain('data-step-card');
    expect(html).toMatch(/data-step-card[\s\S]*STEP 1 OF \d[\s\S]*data-action="mission-step"[\s\S]*data-action="step-done"/);
    expect(html).toMatch(new RegExp(`href="#/mission/${MISSION}/debrief"[^>]*data-action="i-did-it"`));
  });

  it('step links record the start too', () => {
    const html = renderBriefing(createInitialState(), MISSION);
    expect(html).toMatch(new RegExp(`<a href="https?://[^"]+"[^>]*data-action="mission-step"[^>]*data-mission="${MISSION}"`));
  });
});
