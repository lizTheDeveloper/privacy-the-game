// UI sweep #1: after a verdict the player sees the answer, the tells, the Verify link and
// NEXT; NEXT moves on; quiz mode keeps its message across re-draws; THE TELL the player
// typed is shown beside the real tells.
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state.js';
import { renderPhishingQuiz, recordQuizVerdict, nextQuizMessage, keepPracticing, showsCuratedResult } from '../src/screens/phishing-quiz.js';
import { readFileSync } from 'node:fs';
import { CURATED_MESSAGES, MESSAGE_BANK } from '../src/data/phishing.js';
import { textOf } from './helpers/on-page.mjs';

const shownMsgId = (html) => Number(/data-msg-id="(\d+)"/.exec(html)?.[1] ?? /data-quiz-reveal="(\d+)"/.exec(html)?.[1]);

describe('curated set: answer, reveal, NEXT', () => {
  it('shows the verdict, the tells, Verify and NEXT for the message just answered', () => {
    const s = createInitialState();
    const first = CURATED_MESSAGES[0];
    expect(shownMsgId(renderPhishingQuiz(s))).toBe(first.id);
    const wrong = first.answer === 'pretext' ? 'genuine' : 'pretext';
    expect(recordQuizVerdict(s, 'curated', first.id, wrong, 'the domain')).toBe(true);
    const html = renderPhishingQuiz(s);
    const text = textOf(html);
    expect(html).toContain(`data-quiz-reveal="${first.id}"`);
    expect(text).toContain(`✗ WRONG — THIS IS ${first.answer === 'pretext' ? 'FAKE' : 'REAL'}`);
    for (const t of first.tells) expect(text).toContain(t);
    expect(html).toContain(`href="${first.verify.url}"`);
    expect(html).toContain('data-action="quiz-next"');
    // The tell the player typed, next to the real tells.
    expect(text).toContain('YOUR TELL');
    expect(text).toContain('the domain');
    // No second set of verdict buttons while the reveal is up.
    expect(html).not.toContain('data-action="quiz-verdict"');
  });

  it('a right answer says CORRECT', () => {
    const s = createInitialState();
    const first = CURATED_MESSAGES[0];
    recordQuizVerdict(s, 'curated', first.id, first.answer, '');
    expect(textOf(renderPhishingQuiz(s))).toContain('✓ CORRECT');
  });

  it('NEXT shows the next message, unanswered', () => {
    const s = createInitialState();
    recordQuizVerdict(s, 'curated', CURATED_MESSAGES[0].id, 'pretext', '');
    nextQuizMessage(s);
    const html = renderPhishingQuiz(s);
    expect(shownMsgId(html)).toBe(CURATED_MESSAGES[1].id);
    expect(html).toContain('data-action="quiz-verdict"');
    expect(html).not.toContain('data-quiz-reveal');
  });

  it('the last curated message is revealed too, before quiz mode starts', () => {
    const s = createInitialState();
    for (const m of CURATED_MESSAGES) {
      recordQuizVerdict(s, 'curated', m.id, m.answer, '');
      expect(renderPhishingQuiz(s)).toContain(`data-quiz-reveal="${m.id}"`);
      nextQuizMessage(s);
    }
    // Then the set's result, and quiz mode after KEEP PRACTICING.
    expect(renderPhishingQuiz(s)).toContain('data-quiz-result');
    keepPracticing(s);
    expect(renderPhishingQuiz(s)).toContain('data-action="quiz-bank-verdict"');
  });
});

// Layout audit (2026-11-20): finishing the twelve rolled straight into quiz mode at "0 answered".
describe('the curated set\'s result', () => {
  const primaries = (html) => (html.replace(/<style>[\s\S]*?<\/style>/g, '').match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
  const finish = (wrongIds = []) => {
    const s = createInitialState();
    for (const m of CURATED_MESSAGES) {
      const wrong = m.answer === 'pretext' ? 'genuine' : 'pretext';
      recordQuizVerdict(s, 'curated', m.id, wrongIds.includes(m.id) ? wrong : m.answer, '');
    }
    nextQuizMessage(s);
    return s;
  };

  it('shows the score as a filling bar, the kinds missed, BACK TO THE PERIMETER and KEEP PRACTICING', () => {
    const missed = CURATED_MESSAGES.slice(0, 2);
    const s = finish(missed.map((m) => m.id));
    const html = renderPhishingQuiz(s);
    const text = textOf(html);
    const right = CURATED_MESSAGES.length - 2;
    expect(text).toContain(`You got ${right} of ${CURATED_MESSAGES.length} right.`);
    expect(html).toMatch(new RegExp(`class="fill-bar[^"]*"[^>]*aria-valuemax="${CURATED_MESSAGES.length}" aria-valuenow="${right}"`));
    expect(html).toContain('data-quiz-missed');
    expect(text).toContain('The kinds you missed');
    // The one bright button goes back to The Perimeter; practice is outlined.
    expect(primaries(html)).toBe(1);
    expect(html).toMatch(/class="btn-primary"[^>]*href="#\/district\/perimeter"[^>]*>BACK TO THE PERIMETER</);
    expect(html).toMatch(/class="btn-secondary" data-action="quiz-keep-practicing"[^>]*>KEEP PRACTICING</);
    expect(html).not.toContain('data-action="quiz-bank-verdict"');
  });

  it('a clean run says nothing was missed', () => {
    const text = textOf(renderPhishingQuiz(finish()));
    expect(text).toContain('You didn’t miss one.');
  });

  it('stays until KEEP PRACTICING; a save already in quiz mode goes straight on', () => {
    const s = finish();
    expect(showsCuratedResult(s.phishingQuiz)).toBe(true);
    keepPracticing(s);
    expect(showsCuratedResult(s.phishingQuiz)).toBe(false);
    const old = finish();
    old.phishingQuiz.quizAnswers = { [MESSAGE_BANK[0].id]: { verdict: 'pretext', tell: '', correct: true } };
    expect(showsCuratedResult(old.phishingQuiz)).toBe(false);
  });

  it('app.js wires KEEP PRACTICING, and shows the result once (leaving it moves on)', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app).toMatch(/action === 'quiz-keep-practicing'\) \{\s*keepPracticing\(state\)/);
    expect(app).toMatch(/lastRoute\?\.screen === 'phishing' && route\.screen !== 'phishing'[^\n]*showsCuratedResult/);
  });
});

describe('the quiz screen reads plainly', () => {
  it('the quiz\'s run is IN A ROW (the game has its own STREAK), and Scout\'s line is off-white', () => {
    const html = renderPhishingQuiz(createInitialState());
    expect(html).toContain('>IN A ROW<');
    // STREAK is the top bar's (the game's days in a row, in Advanced mode's score strip); the quiz's own count isn't called that.
    expect((html.match(/>STREAK</g) || []).length).toBe(0);
    const advanced = renderPhishingQuiz({ ...createInitialState(), reading: { level: 'full' } });
    expect((advanced.match(/>STREAK</g) || []).length).toBe(1);
    expect(html).toMatch(/data-quiz-scout style="[^"]*color: var\(--offwhite\)/);
    expect(html).not.toMatch(/data-quiz-scout style="[^"]*font-style: italic/);
  });

  it('after a verdict, the page scrolls the verdict to the top so NEXT is on screen', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app).toMatch(/querySelector\('\[data-quiz-reveal\]'\)\?\.scrollIntoView\?\.\(\{ block: 'start' \}\)/);
  });
});

describe('quiz mode', () => {
  const done = () => {
    const s = createInitialState();
    for (const m of CURATED_MESSAGES) recordQuizVerdict(s, 'curated', m.id, m.answer, '');
    nextQuizMessage(s);
    keepPracticing(s);
    return s;
  };

  it('keeps the same message across re-draws (no reshuffle per render)', () => {
    const s = done();
    const ids = new Set();
    for (let i = 0; i < 8; i++) ids.add(shownMsgId(renderPhishingQuiz(s)));
    expect(ids.size).toBe(1);
  });

  it('reveals the answer and the typed tell, then NEXT moves to another bank message', () => {
    const s = done();
    const id = shownMsgId(renderPhishingQuiz(s));
    const msg = MESSAGE_BANK.find((m) => m.id === id);
    recordQuizVerdict(s, 'bank', id, msg.answer, 'sender looked off');
    const html = renderPhishingQuiz(s);
    expect(html).toContain(`data-quiz-reveal="${id}"`);
    expect(textOf(html)).toContain('✓ CORRECT');
    expect(textOf(html)).toContain('sender looked off');
    expect(html).toContain('data-action="quiz-bank-next"');
    nextQuizMessage(s);
    const next = shownMsgId(renderPhishingQuiz(s));
    expect(next).not.toBe(id);
    expect(s.phishingQuiz.quizAnswers[next]).toBeUndefined();
  });
});
