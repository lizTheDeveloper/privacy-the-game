import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { finderCard, finderResult, setFinderAnswer, finderBack, PLACES } from '../src/data/password-finder.js';
import { renderPasswordFinder } from '../src/screens/password-finder.js';
import { passwordPlaceAsk } from '../src/components/walkthrough.js';
import { resetStepsByManager, newPasswordStep } from '../src/data/reset-steps.js';
import { createInitialState } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { MISSIONS } from '../src/data/missions.js';
import { missionSteps } from '../src/utils/debrief.js';
import { PASSWORD_MANAGERS } from '../src/data/missions-passwords.js';
import { parseRoute } from '../src/router.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

// Liz 2026-11-18: "walk them through, do they use Chrome as a password manager? Do they use your
// phone passwords? … they're not always going to know … Most people have a mixed [setup]."
const answer = (f, ...pairs) => pairs.reduce((s, [k, v]) => setFinderAnswer(s, k, v), { passwordFinder: f });
const cardOf = (s) => finderCard(s.passwordFinder);
const app = readFileSync('src/app.js', 'utf8');

describe('the finder asks one thing at a time', () => {
  it('phone: what kind, then go look', () => {
    let s = answer({}, ['where', 'phone']);
    expect(cardOf(s)).toEqual({ kind: 'ask', key: 'phone' });
    s = answer(s.passwordFinder, ['phone', 'iphone']);
    expect(cardOf(s)).toEqual({ kind: 'look', key: 'phoneSaw', place: 'iphone' });
    s = answer(s.passwordFinder, ['phoneSaw', 'yes']);
    expect(cardOf(s)).toEqual({ kind: 'result' });
    expect(finderResult(s.passwordFinder)).toMatchObject({ managers: ['apple'], mixed: false });
  });

  it('both: the phone, then the computer; "I don’t know" shows how to tell', () => {
    let s = answer({}, ['where', 'both'], ['phone', 'android'], ['phoneSaw', 'yes'], ['browser', 'unknown']);
    expect(cardOf(s)).toEqual({ kind: 'ask', key: 'browser', help: true });
    expect(renderPasswordFinder(s)).toContain('A red, yellow and green circle is Chrome.');
    s = answer(s.passwordFinder, ['browser', 'chrome']);
    expect(cardOf(s)).toEqual({ kind: 'look', key: 'browserSaw', place: 'chrome' });
  });

  it('mixed: an iPhone and Chrome don’t share, so it explains and asks which is the main place', () => {
    const s = answer({}, ['where', 'both'], ['phone', 'iphone'], ['phoneSaw', 'yes'], ['browser', 'chrome'], ['browserSaw', 'yes']);
    expect(finderResult(s.passwordFinder)).toMatchObject({ managers: ['apple', 'google'], mixed: true });
    const h = renderPasswordFinder(s);
    expect(h).toContain('These two don’t share. That’s why a password can work on one and not the other.');
    expect(h).toContain('data-action="finder-done" data-pm="apple">My iPhone</button>');
    expect(h).toContain('data-action="finder-done" data-pm="google">Chrome on my computer</button>');
  });

  it('an iPhone and a Mac share: one place, and it says so', () => {
    const s = answer({}, ['where', 'both'], ['phone', 'iphone'], ['phoneSaw', 'yes'], ['browser', 'safari'], ['browserSaw', 'yes']);
    expect(finderResult(s.passwordFinder)).toMatchObject({ managers: ['apple'], mixed: false });
    expect(renderPasswordFinder(s)).toContain('Good news: those two share.');
  });

  it('nothing saved: start saving in the place they looked', () => {
    const s = answer({}, ['where', 'computer'], ['browser', 'edge'], ['browserSaw', 'empty']);
    expect(finderResult(s.passwordFinder).start).toBe('edge');
    expect(renderPasswordFinder(s)).toContain('data-action="finder-done" data-pm="edge">OK, SAVE THEM THERE &#10003;</button>');
  });

  it('a password app is asked by name', () => {
    const s = answer({}, ['where', 'app'], ['app', 'bitwarden']);
    expect(renderPasswordFinder(s)).toContain('Your passwords are in Bitwarden.');
  });

  it('a new answer forgets the answers after it; Back forgets the last one', () => {
    let s = answer({}, ['where', 'both'], ['phone', 'iphone'], ['phoneSaw', 'yes']);
    expect(setFinderAnswer(s, 'where', 'computer').passwordFinder).toEqual({ where: 'computer' });
    s = finderBack(s);
    expect(s.passwordFinder).toEqual({ where: 'both', phone: 'iphone' });
  });

  it('every place leads to a real answer of the password check', () => {
    const values = new Set(PASSWORD_MANAGERS.map((pm) => pm.value));
    for (const p of Object.values(PLACES)) expect(values.has(p.manager)).toBe(true);
  });

  it('is a route, opened from the mission, and goes back to it', () => {
    expect(parseRoute('#/passwords?from=password_manager-recon-report')).toEqual({ screen: 'passwords', params: { from: 'password_manager-recon-report' } });
    const h = renderPasswordFinder(createInitialState(), { from: 'gmail-fortify-password' });
    expect(h).toContain('data-from="gmail-fortify-password"');
    const done = app.slice(app.indexOf("} else if (action === 'finder-done') {"), app.indexOf("} else if (action === 'set-password-manager') {"));
    expect(done).toContain('passwordManager: el.dataset.pm');
    expect(done).toContain("navigate(from ? `#/mission/${from}/briefing` : '#/next');");
    expect(done).not.toContain('track(');
  });
});

describe('Password Reset missions use where the passwords are saved', () => {
  const resets = MISSIONS.filter((m) => /-fortify-password$/.test(m.id));

  it('every reset with a password to change gets steps for each place (not Cash App’s PIN)', () => {
    const without = resets.filter((m) => !m.stepsByManager).map((m) => m.id);
    expect(without).toEqual(['cashapp-fortify-password']);
  });

  it('Gmail on an iPhone: do it there, tap “Use Strong Password”, check it saved', () => {
    const m = resets.find((x) => x.id === 'gmail-fortify-password');
    const steps = missionSteps(m, { passwordManager: 'apple' }).map((st) => st.text);
    expect(steps[0]).toMatch(/^Do this on your iPhone, iPad or Mac\./);
    expect(steps).toContain('When it asks for a new password, tap “Use Strong Password”. It makes a strong one and saves it for you.');
    expect(steps.at(-1)).toBe('Check it saved: open the Passwords app and search for Gmail.');
    // No answer yet: the mission's own steps.
    expect(missionSteps(m, {})).toBe(m.steps);
  });

  it('the bank searches for "your bank", and the new password step is the one that makes it', () => {
    const m = resets.find((x) => x.id === 'primary_bank-fortify-password');
    expect(newPasswordStep(m.steps)).toBe(2);
    expect(missionSteps(m, { passwordManager: 'google' }).at(-1)).toMatchObject({ text: 'Check it saved: open passwords.google.com and search for your bank.', url: 'https://passwords.google.com' });
  });

  it('no new-password step: nothing changes', () => {
    expect(resetStepsByManager([{ text: 'Set a PIN' }], 'X')).toBeNull();
  });

  it('the mission asks where the passwords are, with "Help me find where they are" first in Simple mode', () => {
    const m = resets.find((x) => x.id === 'gmail-fortify-password');
    const simple = passwordPlaceAsk(setReadLevel(createInitialState(), 'simplest'), m);
    expect(simple).toContain('href="#/passwords?from=gmail-fortify-password" data-finder-go>Help me find where they are &#9654;</a>');
    expect(simple).toContain('<details class="walk-gear-know"><summary>I know where</summary>');
    const advanced = passwordPlaceAsk(setReadLevel(createInitialState(), 'full'), m);
    expect(advanced).toContain('data-finder-go');
    expect(advanced).not.toContain('walk-gear-know');
  });
});
