import { describe, it, expect } from 'vitest';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState, markMissionStarted } from '../src/state.js';

const MISSION = 'gmail-recon-breach';

describe('starting a mission is remembered (mobile: the other site opens in another tab)', () => {
  it('markMissionStarted records the mission without touching its status', () => {
    const s = markMissionStarted(createInitialState(), MISSION);
    expect(typeof s.startedMissions[MISSION]).toBe('string');
    expect(s.missions[MISSION]).toBeUndefined();
  });

  it('an unstarted briefing offers GO DO IT and no I DID IT', () => {
    const html = renderBriefing(createInitialState(), MISSION);
    expect(html).toContain('data-action="go-do-it"');
    expect(html).not.toContain('I DID IT');
  });

  it('a started briefing leads with I DID IT, linking to the debrief, and keeps GO DO IT AGAIN', () => {
    const html = renderBriefing(markMissionStarted(createInitialState(), MISSION), MISSION);
    expect(html).toMatch(new RegExp(`href="#/mission/${MISSION}/debrief"[^>]*>I DID IT`));
    expect(html).toContain('GO DO IT AGAIN');
    expect(html).toContain('data-action="go-do-it"');
  });

  it('step links record the start too', () => {
    const html = renderBriefing(createInitialState(), MISSION);
    expect(html).toMatch(new RegExp(`<a href="https?://[^"]+"[^>]*data-action="mission-step"[^>]*data-mission="${MISSION}"`));
  });
});
