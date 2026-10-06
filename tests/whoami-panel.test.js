import { describe, it, expect, beforeEach } from 'vitest';
import { renderStats } from '../src/screens/stats.js';
import { createInitialState } from '../src/state.js';
import { setChosenPod } from '../src/utils/pod-pref.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

const COLLECTIVE = { status: 'ready', data: { asOf: 'x', city: {}, pods: [
  { id: 'us-il-chicago', label: 'Chicago' }, { id: 'us-ca-oakland', label: 'Oakland' }] } };
const WHO = { status: 'ready', data: { city: 'Chicago', region: 'US-IL', country: 'US', device: 'mobile', os: 'iOS',
  browser: 'safari', language: 'en-US', pod: { id: 'us-il-chicago', label: 'Chicago' } } };

describe('What we know about you', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('starts closed and does not fetch on its own', () => {
    const html = renderStats(createInitialState());
    expect(html).toContain('WHAT WE KNOW ABOUT YOU');
    expect(html).toContain('data-action="whoami-open"');
  });

  it('shows each value with where it came from', () => {
    const html = renderStats(createInitialState(), { whoami: WHO, collective: COLLECTIVE });
    expect(html).toMatch(/Chicago, US-IL, US/);
    expect(html).toMatch(/from your connection's address/);
    expect(html).toMatch(/mobile · iOS · safari · en-US/);
    expect(html).toMatch(/You count toward <b>Chicago<\/b>/);
    expect(html).toContain('data-action="pod-pick-open"');
  });

  it('a chosen pod is shown honestly next to what the analytics recorded', () => {
    setChosenPod('us-ca-oakland');
    const html = renderStats(createInitialState(), { whoami: WHO, collective: COLLECTIVE });
    expect(html).toMatch(/We'll count you in <b>Oakland<\/b>\. Our analytics still recorded Chicago/);
    expect(html).toContain('data-action="pod-pick-clear"');
  });

  it('picker offers only published pods', () => {
    const html = renderStats(createInitialState(), { whoami: WHO, collective: COLLECTIVE, podPickerOpen: true });
    expect(html).toContain('data-pod="us-il-chicago"');
    expect(html).toContain('data-pod="us-ca-oakland"');
    expect((html.match(/data-action="pod-pick"/g) || []).length).toBe(2);
  });

  it('errors and unknown values never print undefined', () => {
    const err = renderStats(createInitialState(), { whoami: { status: 'error' } });
    expect(err).toMatch(/couldn't reach our analytics/);
    const blank = renderStats(createInitialState(), { whoami: { status: 'ready', data: { pod: null } }, collective: { status: 'error' } });
    expect(blank).toMatch(/We couldn't place you/);
    expect(blank).not.toMatch(/undefined|null|NaN/);
  });

  it('escapes whoami strings and reports an unavailable picker', () => {
    const evil = { status: 'ready', data: { city: '<img src=x>', pod: null } };
    const html = renderStats(createInitialState(), { whoami: evil, collective: { status: 'error' }, podPickerOpen: true });
    expect(html).not.toContain('<img src=x>');
    expect(html).toContain('&lt;img src=x&gt;');
    expect(html).toMatch(/We can't load the list of places right now\./);
  });
});
