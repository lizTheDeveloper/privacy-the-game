import { describe, it, expect } from 'vitest';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { setReadLevel, visibleSteps, stepKey } from '../src/utils/reading.js';
import { findMission } from '../src/data/custom-missions.js';
import { markOpened, clearOpened } from '../src/utils/opened-steps.js';

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

  it('a started mission shows one step at a time: its site, DONE once it is open, and a way to report back', () => {
    clearOpened();
    const s = markMissionStarted(createInitialState(), MISSION);
    const first = visibleSteps(findMission(s, MISSION), s)[0];
    let html = renderBriefing(s, MISSION);
    expect(html).toContain('data-step-card');
    if (first.url) {
      expect(html).not.toContain('data-action="step-done"');
      markOpened(MISSION, stepKey(first));
      html = renderBriefing(s, MISSION);
    }
    // Simple mode: a bar that fills, not "Step 1 of 3" (Liz 2026-11-18); the words are its label.
    expect(html).not.toContain('class="simple-count"');
    expect(html).toMatch(/class="fill-bar fill-bar--big[^"]*" role="progressbar" aria-label="Step 1 of \d"[\s\S]*data-step-card[\s\S]*data-action="mission-step"[\s\S]*data-action="step-done"/);
    expect(html).toMatch(new RegExp(`href="#/mission/${MISSION}/debrief"[^>]*data-action="i-did-it"`));
  });

  it('step links record the start too', () => {
    const html = renderBriefing(createInitialState(), MISSION);
    expect(html).toMatch(new RegExp(`<a href="https?://[^"]+"[^>]*data-action="mission-step"[^>]*data-mission="${MISSION}"`));
  });
});
