import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { welcomeBackNote, shouldAskPermission, REMINDERS_DELIVERABLE } from '../src/utils/notifications.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { createInitialState, localDay } from '../src/state.js';

const HOUR = 3600000;
const NOW = new Date(2026, 10, 2, 12, 0, 0).getTime();
const day = (offset) => localDay(new Date(NOW + offset * 24 * HOUR));
const played = (streak, lastDate) => ({ ...createInitialState(), streak: { current: streak, best: streak, lastDate }, missions: { 'gmail-recon-breach': { status: 'completed' } } });
const APP = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

describe('streak reminders are honest (feature map row 14)', () => {
  it('the game no longer asks for notification permission: nothing could be delivered with it', () => {
    expect(REMINDERS_DELIVERABLE).toBe(false);
    expect(shouldAskPermission(played(3, day(-1)))).toBe(false);
  });

  it('no system notification is built anywhere in the game', () => {
    const src = readFileSync(new URL('../src/utils/notifications.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/showNotification\(/);
    expect(APP).not.toMatch(/showNotification\(/);
  });

  it('a returning player sees what the streak check found, as a welcome-back note', () => {
    expect(welcomeBackNote(played(3, day(-1)), NOW - 30 * HOUR, NOW)).toBe('Your 3-day streak is still going. File one mission today to keep it.');
    expect(welcomeBackNote(played(3, day(-4)), NOW - 96 * HOUR, NOW)).toMatch(/^Your 3-day streak ended while you were away\. Everything you secured still counts\./);
  });

  it('says nothing for a short break, a first visit, or no streak', () => {
    expect(welcomeBackNote(played(3, day(-1)), NOW - 5 * HOUR, NOW)).toBeNull();
    expect(welcomeBackNote(played(3, day(-1)), 0, NOW)).toBeNull();
    expect(welcomeBackNote(played(0, day(-1)), NOW - 30 * HOUR, NOW)).toBeNull();
    expect(welcomeBackNote({ ...played(2, day(-1)), missions: {} }, NOW - 30 * HOUR, NOW)).toBeNull();
  });

  it('the city map labels it WELCOME BACK, and shows nothing without one', () => {
    const s = played(3, day(-1));
    const html = renderCityMap(s, { welcomeBack: 'Your 3-day streak is still going. File one mission today to keep it.' });
    expect(html).toMatch(/<div data-welcome-back class="welcome-back welcome-back--top"[^>]*><span[^>]*>WELCOME BACK<\/span>Your 3-day streak is still going\./);
    expect(html).toContain('welcome-back--scout');
    expect(renderCityMap(s, {})).not.toContain('data-welcome-back');
  });

  it('the check runs before the first screen is drawn, so the note can show on it', () => {
    expect(APP.indexOf('welcomeBack = checkStreakReminder(state);')).toBeGreaterThan(-1);
    expect(APP.indexOf('welcomeBack = checkStreakReminder(state);')).toBeLessThan(APP.indexOf('initRouter(render);'));
  });
});
