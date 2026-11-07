// UI sweep #1: after a verdict the player sees the answer, the tells, the Verify link and
// NEXT; NEXT moves on; quiz mode keeps its message across re-draws; THE TELL the player
// typed is shown beside the real tells.
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state.js';
import { renderPhishingQuiz, recordQuizVerdict, nextQuizMessage } from '../src/screens/phishing-quiz.js';
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
    expect(renderPhishingQuiz(s)).toContain('data-action="quiz-bank-verdict"');
  });
});

describe('quiz mode', () => {
  const done = () => {
    const s = createInitialState();
    for (const m of CURATED_MESSAGES) recordQuizVerdict(s, 'curated', m.id, m.answer, '');
    nextQuizMessage(s);
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
