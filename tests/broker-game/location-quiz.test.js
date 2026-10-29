import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { guessFromWhoami, locationQuiz, homeLabel } from '../../src/components/location-quiz.js';
import { isPrivateBreadcrumb } from '../../src/utils/errorNoise.js';

describe('the location quiz', () => {
  it('guesses a state, outside the US, or nothing', () => {
    expect(guessFromWhoami({ status: 'ready', data: { country: 'US', region: 'US-TX' } })).toBe('US-TX');
    expect(guessFromWhoami({ country: 'US', region: 'US-CA', city: 'Oakland' })).toBe('US-CA');
    expect(guessFromWhoami({ country: 'DE', region: 'DE-BE' })).toBe('outside-us');
  });

  it('bad or missing guesses fall back to the picker', () => {
    for (const w of [null, undefined, {}, { status: 'error' }, { status: 'loading' }, { region: 'US-ZZ', country: 'US' }, { country: 'usa' }, 'US-TX']) {
      expect(guessFromWhoami(w)).toBe(null);
    }
    const h = locationQuiz({ guess: null });
    expect(h).toContain('Choose your state…');
    expect(h).not.toContain('Looks like');
  });

  it('every state, DC, and the two other answers are offered', () => {
    const h = locationQuiz({});
    expect(h.match(/<option value="US-/g)).toHaveLength(51);
    expect(h).toContain('OUTSIDE THE US');
    expect(h).toContain('RATHER NOT SAY');
  });

  it('with sharing off it never guesses on its own: it offers GUESS FOR ME', () => {
    expect(locationQuiz({ guessAllowed: false })).toContain('data-action="quiz-guess"');
    expect(locationQuiz({ guessAllowed: true })).not.toContain('quiz-guess');
    expect(locationQuiz({ guessStatus: 'loading' })).toContain('Guessing…');
  });

  it('the answer is never in markup ids, names or titles, and the clicks stay private', () => {
    for (const h of [locationQuiz({ guess: 'US-TX' }), locationQuiz({ home: 'US-TX' })]) {
      expect(h).not.toMatch(/\b(id|name|title)="[^"]*(US-|Texas)/);
    }
    for (const m of ['div.residency > button.btn-secondary.residency-btn', 'select.residency-select'])
      expect(isPrivateBreadcrumb({ category: 'ui.click', message: m })).toBe(true);
  });

  it('labels', () => {
    expect(homeLabel('US-NY')).toBe('New York');
    expect(homeLabel('outside-us')).toBe('Outside the US');
    expect(homeLabel('bogus')).toBe(null);
  });

  it('the guess fetch is gated on sharing and ghost', () => {
    const app = readFileSync('src/app.js', 'utf8');
    expect(app).toMatch(/route\.screen === 'broker-map' && whoamiView\.status === 'idle' && homeOf\(state\) === null && guessAllowed\(\)\) loadWhoami\(\);/);
    expect(app).toMatch(/function guessAllowed\(\) \{\n {2}return !isAnalyticsOff\(\) && !hasGoneGhost\(\);/);
  });

  it('the location never reaches track() or the URL from the quiz', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const quiz = app.slice(app.indexOf('function quizAction'), app.indexOf('// The sky ladder: selecting a rung'));
    expect(quiz).not.toMatch(/track\(|navigate\(|location\.hash|captureError/);
  });
});
