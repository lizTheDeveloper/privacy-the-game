import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { finderCard, finderResult, setFinderAnswer, finderBack, PLACES } from '../src/data/password-finder.js';
import { renderPasswordFinder } from '../src/screens/password-finder.js';
import { passwordPlaceAsk, gearAsk } from '../src/components/walkthrough.js';
import { resetStepsByManager, newPasswordStep } from '../src/data/reset-steps.js';
import { createInitialState } from '../src/state.js';
import { setReadLevel, setGear } from '../src/utils/reading.js';
import { MISSIONS } from '../src/data/missions.js';
import { missionSteps } from '../src/utils/debrief.js';
import { PASSWORD_MANAGERS } from '../src/data/missions-passwords.js';
import { parseRoute } from '../src/router.js';
import { passwordPlaces, placesKey, setPasswordPlaces } from '../src/utils/password-places.js';
import { TWO_PLACE_PAIRS } from '../src/data/two-places.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { markMissionStarted } from '../src/state.js';
import { renderManagerPointer } from '../src/components/bank-notes.js';

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

  it('mixed: an iPhone and Chrome don’t share, so it explains, says that’s fine, and remembers both', () => {
    const s = answer({}, ['where', 'both'], ['phone', 'iphone'], ['phoneSaw', 'yes'], ['browser', 'chrome'], ['browserSaw', 'yes']);
    expect(finderResult(s.passwordFinder)).toMatchObject({ managers: ['apple', 'google'], mixed: true });
    const h = renderPasswordFinder(s);
    expect(h).toContain('a password can work on one and not the other');
    expect(h).toContain('Lots of people keep passwords in two places. It can be a backup. You don’t need to move them.');
    expect(h).toContain('We’ll remember both. When you change a password, we’ll remind you to update it in both places.');
    expect(h).toContain('data-action="finder-done" data-pm="apple" data-places="apple,google" data-finder-both>OK, REMEMBER BOTH &#10003;</button>');
    // No hidden migration (Liz 2026-11-18): it never asks them to pick one.
    expect(h).not.toMatch(/pick one|main place|every new password there|finder-pick/i);
    expect(h.match(/data-action="finder-done"/g)).toHaveLength(1);
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
    expect(done).toContain('setPasswordPlaces(state, places)');
    expect(done).toContain("el.dataset.places ? el.dataset.places.split(',') : [el.dataset.pm]");
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

// Liz 2026-11-18: "don't ask them to do a migration right there … just say, okay, you know,
// we'll remember that it's two places and prompt you to check both places."
describe('passwords in two places: remembered, and both get checked', () => {
  const two = setPasswordPlaces(createInitialState(), ['apple', 'google']);
  const gmail = MISSIONS.find((x) => x.id === 'gmail-fortify-password');

  it('both are recorded; passwordManager stays the first', () => {
    expect(two.passwordPlaces).toEqual(['apple', 'google']);
    expect(two.passwordManager).toBe('apple');
    expect(passwordPlaces(two)).toEqual(['apple', 'google']);
    expect(placesKey(two)).toBe('apple+google');
  });

  it('a one-place answer given since wins (the Change link, The Master Keys)', () => {
    expect(passwordPlaces({ ...two, passwordManager: 'edge' })).toEqual(['edge']);
    expect(placesKey(setPasswordPlaces(two, ['google']))).toBe('google');
    expect(passwordPlaces(setPasswordPlaces(two, ['']))).toEqual([]);
  });

  it('a reset: do it on the iPhone, check it saved, then update Chrome too (not a move)', () => {
    const steps = missionSteps(gmail, two).map((st) => st.text);
    expect(steps[0]).toBe('Your passwords are in two places: your iPhone and Chrome on your computer. That’s fine. Do this on your iPhone first. Then you’ll update Chrome on your computer too.');
    expect(steps).toContain('When it asks for a new password, tap “Use Strong Password”. It makes a strong one and saves it for you.');
    expect(steps).toContain('Check it saved: open the Passwords app and search for Gmail.');
    expect(steps.at(-1)).toBe('Now update Chrome on your computer too. It still has the old password. Find Gmail there, and change the saved password to the new one.');
    const last = missionSteps(gmail, two).at(-1);
    expect(last.note[0]).toMatchObject({ label: 'How do I find it?', open: true });
    expect(last.note[0].text).toMatch(/^In Chrome, click the three dots/);
    expect(last.note[1].text).toBe('Open the Passwords app on your iPhone. Tap the account to see the new password.');
    // It happens on the computer: no "On myaccount.google.com" from the step before.
    expect(last.elsewhere).toBe(true);
    for (const t of steps) expect(t).not.toMatch(/\b(move|import|export|consolidate|delete|pick one|main place)\b/i);
  });

  it('every pair the finder can find has steps on every reset and on the password check', () => {
    const pm = MISSIONS.find((x) => x.id === 'password_manager-recon-report');
    for (const [a, b] of TWO_PLACE_PAIRS) {
      expect(gmail.stepsByManager[`${a}+${b}`]).toBeTruthy();
      expect(pm.stepsByManager[`${a}+${b}`]).toBeTruthy();
    }
    expect(TWO_PLACE_PAIRS).toHaveLength(6);
  });

  it('the password check reads the report in both places', () => {
    const pm = MISSIONS.find((x) => x.id === 'password_manager-recon-report');
    const steps = missionSteps(pm, two).map((st) => st.text);
    expect(steps[0]).toMatch(/^Your passwords are in two places: your iPhone and Chrome on your computer\. That’s fine\. Each one has its own check\./);
    expect(steps.some((t) => /^iPhone or iPad: open the Passwords app/.test(t))).toBe(true);
    expect(steps.some((t) => /Google Password Checkup/.test(t))).toBe(true);
    expect(steps.at(-1)).toMatch(/each one says/);
  });

  it('the mission says both places, and that the steps cover both', () => {
    const h = passwordPlaceAsk(setReadLevel(two, 'full'), gmail);
    expect(h).toContain('Your passwords are in two places: <strong>your iPhone</strong> and <strong>Chrome on your computer</strong>. These steps cover both.');
  });

  it('the bank notes point at both places', () => {
    const h = renderManagerPointer(two);
    expect(h).toContain('Apple Passwords');
    expect(h).toContain('Google Password Manager');
  });

  it('these answers are never tracked', () => {
    const block = (start, end) => app.slice(app.indexOf(start), app.indexOf(end));
    for (const b of [
      block("} else if (action === 'finder-done') {", "} else if (action === 'set-password-manager') {"),
      block("} else if (action === 'set-password-manager') {", "} else if (action === 'not-mine') {"),
      block("} else if (action === 'setup-skip') {", "} else if (action === 'step-done'"),
    ]) {
      expect(b.length).toBeGreaterThan(50);
      expect(b).not.toMatch(/track\(|fetch\(|sendBeacon/);
    }
  });
});

// Liz 2026-11-18: "find out what their other devices are, if they're in simple mode … separate
// information gathering and signal gathering from action taking."
describe('Simple mode asks about the devices first, before any step', () => {
  const simple = setReadLevel(createInitialState(), 'simplest');
  const started = (s) => markMissionStarted(s, 'gmail-fortify-password');
  const brief = (s) => renderBriefing(started(s), 'gmail-fortify-password');

  it('the first screen after START is the devices card, with no step on it', () => {
    const h = brief(simple);
    expect(h).toContain('data-setup-card');
    expect(h).toContain('First, about your devices');
    expect(h).toContain('data-group="phone" data-value="iphone"');
    expect(h).toContain('data-group="phone" data-value="none"');
    for (const v of ['windows', 'mac', 'chromebook', 'shared', 'none']) expect(h).toContain(`data-group="computer" data-value="${v}"`);
    expect(h).toContain('class="simple-count">Before you start</div>');
    expect(h).not.toContain('data-step-card');
    expect(h).toContain('data-action="setup-skip"');
  });

  it('then where the passwords are, with a note up front for an iPhone and Windows', () => {
    const h = brief({ ...simple, gear: { phone: 'iphone', computer: 'windows' } });
    expect(h).toContain('Where are your passwords saved?');
    expect(h).toContain('Your iPhone and your Windows computer may not keep the same passwords. A password can be saved on one and not the other. That’s normal. We’ll help you check each place.');
    expect(h).not.toContain('data-step-card');
  });

  it('an iPhone and a Mac share: no note', () => {
    expect(brief({ ...simple, gear: { phone: 'iphone', computer: 'mac' } })).not.toContain('data-devices-note');
  });

  it('once answered, the step is alone on its card; the answers sit below it', () => {
    const h = brief({ ...setPasswordPlaces(simple, ['apple', 'google']), gear: { phone: 'iphone', computer: 'windows' } });
    expect(h).toContain('data-step-card');
    expect(h).not.toContain('data-setup-card');
    expect(h).not.toContain('data-pm-ask');
    expect(h.indexOf('data-step-card')).toBeLessThan(h.indexOf('data-pm-two'));
    expect(h).toContain('Your passwords are in two places');
  });

  it('skipping shows every step, as before', () => {
    const s = started(simple);
    const skipped = { ...s, stepProgress: { ...s.stepProgress, 'gmail-fortify-password': { setup: 'skipped' } } };
    expect(renderBriefing(skipped, 'gmail-fortify-password')).toContain('data-step-card');
  });

  it('Advanced mode is as it was: the question above the step', () => {
    const h = renderBriefing(started(setReadLevel(createInitialState(), 'full')), 'gmail-fortify-password');
    expect(h).not.toContain('data-setup-card');
  });

  it('the finder skips what the devices already said', () => {
    const gear = { phone: 'iphone', computer: 'windows' };
    expect(finderCard({ where: 'both' }, gear)).toEqual({ kind: 'look', key: 'phoneSaw', place: 'iphone' });
    expect(finderCard({ where: 'computer' }, { computer: 'chromebook' })).toEqual({ kind: 'look', key: 'browserSaw', place: 'chrome' });
    // No Safari on Windows; no phone, no "On my phone".
    const h = renderPasswordFinder({ ...createInitialState(), gear, passwordFinder: { where: 'both', phoneSaw: 'yes' } });
    expect(h).toContain('data-value="chrome"');
    expect(h).not.toContain('data-value="safari"');
    const noPhone = renderPasswordFinder({ ...createInitialState(), gear: { phone: 'none', computer: 'mac' } });
    expect(noPhone).not.toContain('data-value="phone"');
    expect(noPhone).not.toContain('data-value="both"');
    expect(noPhone).toContain('data-value="computer"');
  });

  it('the devices answers are the same ones the steps use, and only answers (no step is labelled “I share one”)', () => {
    const s = setGear(setGear(simple, 'phone', 'none'), 'computer', 'shared');
    expect(s.gear).toEqual({ phone: 'none', computer: 'shared' });
    expect(gearAsk(s, [{ group: 'phone', options: ['iphone', 'android'] }])).toContain('Showing all the steps.');
  });
});
