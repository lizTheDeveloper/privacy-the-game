// Thanksgiving with Grandma (Liz 2026-11-25): a Quick Quest that helps someone sitting with an older
// relative, with Simple mode one tap away inside it. Featured for the week; a bonus that counts only
// once done, so it never lowers a finished city.
import { describe, it, expect } from 'vitest';
import { createInitialState, updateMission, markMissionStarted } from '../src/state.js';
import { QUICK_QUESTS, isFeatured, questsInOrder } from '../src/data/quests.js';
import { MISSIONS } from '../src/data/missions.js';
import { HOLIDAY_GRANDMA_ID, HOLIDAY_GUIDE_URL } from '../src/data/missions-perimeter.js';
import { renderQuickQuest, questTarget } from '../src/screens/quick-quest.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderNext } from '../src/screens/next.js';
import { setReadLevel } from '../src/utils/reading.js';
import { calcIntegrity, calcExposure, calcDistrictProgress } from '../src/utils/calc.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';

const quest = QUICK_QUESTS.find((q) => q.id === 'holiday-grandma');
const mission = MISSIONS.find((m) => m.id === HOLIDAY_GRANDMA_ID);
const THANKSGIVING = new Date('2026-11-26T12:00:00');
const DECEMBER = new Date('2026-12-02T12:00:00');

describe('the quest and its mission', () => {
  it('goes straight to the mission, in The Perimeter, for a new player', () => {
    expect(mission).toBeTruthy();
    expect(mission.accountId).toBe('scam_defense');
    expect(questTarget(createInitialState(), quest)).toMatchObject({ href: `#/mission/${HOLIDAY_GRANDMA_ID}/briefing`, missionId: HOLIDAY_GRANDMA_ID });
  });

  it('first and tagged THIS WEEK around Thanksgiving; after, still in the list as any other quest', () => {
    expect(isFeatured(quest, THANKSGIVING)).toBe(true);
    expect(questsInOrder(THANKSGIVING)[0].id).toBe('holiday-grandma');
    const html = renderQuickQuest(createInitialState(), { now: THANKSGIVING });
    expect(html).toMatch(/<li class="qq-row qq-featured" data-quest="holiday-grandma" data-featured>/);
    expect(html).toContain('<span class="qq-featured-tag">THIS WEEK</span>');
    expect(isFeatured(quest, DECEMBER)).toBe(false);
    const later = renderQuickQuest(createInitialState(), { now: DECEMBER });
    expect(later).toContain('data-quest="holiday-grandma"');
    expect(later).not.toContain('qq-featured-tag');
  });

  it('names its actors and links Liz’s holiday guide', () => {
    const words = [mission.briefing, ...mission.steps.flatMap((s) => [s.text, ...(s.note || []).map((n) => n.text)])].join(' ');
    expect(words).toMatch(/Scam callers/);
    expect(words).toMatch(/SIM-swap crew/);
    expect(mission.steps.some((s) => s.url === HOLIDAY_GUIDE_URL)).toBe(true);
    // The guide's own words for what to do.
    expect(words).toContain('Hang up. Call them back at a number you already have.');
  });

  it('one physical action a step, and the phone PIN never goes on the paper by the phone', () => {
    expect(mission.steps.length).toBeGreaterThanOrEqual(25);
    const pin = mission.steps.filter((s) => /\bPIN\b/.test(s.text) && /^Write/.test(s.text));
    expect(pin).toHaveLength(1);
    expect(pin[0].text).toMatch(/not on the “Help me” paper/);
    // Grandma's phone is not the player's: no step starts with a device label the device filter reads.
    for (const s of mission.steps) expect(s.text, s.text).not.toMatch(/^(iPhone|Android|Samsung|Pixel|On (your |an )?(iPhone|Android))\b/i);
  });
});

describe('a bonus that never lowers a score', () => {
  it('is optional and seasonal', () => {
    expect(mission.optional).toBe(true);
    expect(mission.seasonal).toBe(true);
  });

  it('a city with everything else done stays at 100% integrity and 0 exposure; doing it keeps it there', () => {
    let s = createInitialState();
    for (const m of MISSIONS) {
      if (m.id === HOLIDAY_GRANDMA_ID || m.phase === 'survey' || !isMissionInPlay(s, m)) continue;
      s = updateMission(s, m.id, { status: 'completed' });
    }
    expect(isMissionInPlay(s, mission)).toBe(true);
    expect(calcIntegrity(s)).toBe(100);
    expect(calcExposure(s)).toBe(0);
    const perimeter = calcDistrictProgress(s, 'perimeter').percent;
    s = updateMission(s, HOLIDAY_GRANDMA_ID, { status: 'completed', action: 'completed' });
    expect(calcIntegrity(s)).toBe(100);
    expect(calcDistrictProgress(s, 'perimeter').percent).toBe(perimeter);
  });
});

describe('Simple mode, one tap from inside the quest', () => {
  const started = (level) => markMissionStarted(setReadLevel(createInitialState(), level), HOLIDAY_GRANDMA_ID);

  it('Advanced: the first step card’s bright button turns Simple mode on; DONE waits as an outline', () => {
    const html = renderBriefing(started('full'), HOLIDAY_GRANDMA_ID);
    expect(html).toMatch(/<button type="button" class="btn-primary focus-go" data-action="read-level" data-level="simplest" data-mode-switch>TURN ON SIMPLE MODE<\/button>/);
    expect(html).toMatch(/class="btn-secondary focus-go focus-done"/);
  });

  it('Simple: the card says it is on, and DONE is the bright button', () => {
    const html = renderBriefing(started('simplest'), HOLIDAY_GRANDMA_ID);
    expect(html).toContain('data-mode-on="simplest"');
    expect(html).toContain('Simple mode is on.');
    expect(html).not.toContain('data-mode-switch');
    expect(html).toMatch(/class="btn-primary focus-go focus-done"/);
  });

  it('the Advanced briefing’s step list has the switch too', () => {
    const html = renderBriefing(setReadLevel(createInitialState(), 'full'), HOLIDAY_GRANDMA_ID);
    expect(html).toContain('data-mode-switch');
  });
});

describe('What’s next (Simple’s home) points to it while it is featured', () => {
  it('one quiet line under the card, never a second bright button', () => {
    const html = renderNext(createInitialState(), { now: THANKSGIVING });
    expect(html).toMatch(new RegExp(`<a class="focus-notnow next-featured" href="#/mission/${HOLIDAY_GRANDMA_ID}/briefing" data-featured-quest="holiday-grandma">`));
    expect((html.match(/btn-primary/g) || []).length).toBe(1);
  });

  it('not after the week, and not once it is done', () => {
    expect(renderNext(createInitialState(), { now: DECEMBER })).not.toContain('data-featured-quest');
    const done = updateMission(createInitialState(), HOLIDAY_GRANDMA_ID, { status: 'completed', action: 'completed' });
    expect(renderNext(done, { now: THANKSGIVING })).not.toContain('data-featured-quest');
  });
});
