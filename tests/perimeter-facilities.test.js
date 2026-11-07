// UI sweep #2 and #9: every mission behind Perimeter's % SECURED can be started from its
// own page; facility badges don't say LOCKED over working START buttons; the quiz badge
// counts right answers, out of the data's total.
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state.js';
import { renderDistrict, facilityBadge, quizBadge } from '../src/screens/district.js';
import { getMissionsForDistrict } from '../src/data/missions.js';
import { calcDistrictProgress } from '../src/utils/calc.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';
import { CURATED_MESSAGES } from '../src/data/phishing.js';

const briefingIds = (html) => [...html.matchAll(/href="#\/mission\/([^/"]+)\/briefing"/g)].map((m) => m[1]);
const badges = (html) => [...html.matchAll(/<div class="badge"[^>]*>([^<]*)<\/div>/g)].map((m) => m[1].trim());

describe('Perimeter lists every mission it counts', () => {
  it('both Scam Defense missions have a START on the page', () => {
    const html = renderDistrict(createInitialState(), 'perimeter');
    expect(briefingIds(html)).toEqual(expect.arrayContaining(['scam_defense-recon-phishing-eye', 'scam_defense-fortify-tools']));
    // The quiz is still there too.
    expect(html).toContain('href="#/quiz/phishing"');
  });

  it('filing every listed mission reaches 100%', () => {
    let s = createInitialState();
    const listed = briefingIds(renderDistrict(s, 'perimeter'));
    for (const id of listed) s.missions[id] = { status: 'completed', action: 'action-done', completedAt: '2026-11-01T00:00:00Z' };
    expect(calcDistrictProgress(s, 'perimeter').percent).toBe(100);
    // And every mission in play in the district was listed.
    const inPlay = getMissionsForDistrict('perimeter').filter((m) => isMissionInPlay(s, m)).map((m) => m.id);
    expect(listed).toEqual(expect.arrayContaining(inPlay));
  });
});

describe('facility badges', () => {
  it('an untouched facility with START links says READY, never LOCKED', () => {
    const html = renderDistrict(createInitialState(), 'perimeter');
    expect(badges(html)).not.toContain('LOCKED');
    expect(facilityBadge(0, 3)).toBe('READY');
    expect(facilityBadge(1, 3)).toBe('1/3');
    expect(facilityBadge(3, 3)).toBe('SECURED');
  });

  it('the quiz badge counts right answers out of the data total', () => {
    const total = CURATED_MESSAGES.length;
    const answers = (nRight) => ({ curated: Object.fromEntries(CURATED_MESSAGES.map((m, i) => [m.id, { correct: i < nRight }])) });
    expect(quizBadge({ curated: {} })).toBe('READY');
    expect(quizBadge(answers(5))).toBe(`5/${total} RIGHT`);
    expect(quizBadge(answers(total))).toBe('TRAINED');
    // All answered, only 5 right: not SECURED, not TRAINED.
    const s = createInitialState();
    s.phishingQuiz = { ...answers(5), streak: 0, bestStreak: 0, quizAnswers: {} };
    const html = renderDistrict(s, 'perimeter');
    expect(html).toContain(`5/${total} RIGHT`);
    expect(html).not.toMatch(/data-quiz-badge[^>]*>(SECURED|TRAINED)/);
  });

  it('district.js has no hard-coded quiz total', async () => {
    const { readFileSync } = await import('node:fs');
    expect(readFileSync('src/screens/district.js', 'utf8')).not.toMatch(/total = 12\b/);
  });
});
