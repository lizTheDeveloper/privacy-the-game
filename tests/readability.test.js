import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../src/data/missions.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { MISSION_LEADS } from '../src/data/mission-leads.js';
import { MISSION_SIMPLE } from '../src/data/mission-simple.js';
import { fkGrade, fkGradeWithoutNames, isCompoundStep, words, wordsOutside, plainText } from '../src/utils/readability.js';

// Most US adults read at literacy Level 2 or 3 (Liz, 2026-11-13). These keep the copy honest.

const list = (f) => readFileSync(new URL(`./fixtures/plain-words/${f}`, import.meta.url), 'utf8')
  .split('\n').map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#'));
// The ten hundred most used words, words printed on phone screens, and the account names the
// player sees on their own screens (Gmail, iCloud, Proton Mail…).
const ALLOWED = new Set([
  ...list('ten-hundred.txt'),
  ...list('phone-words.txt'),
  ...Object.values(ACCOUNTS).flatMap((a) => plainText(a.name).toLowerCase().split(/[\s/()-]+/)),
]);

const BASE = JSON.parse(readFileSync(new URL('./fixtures/readability-baseline.json', import.meta.url), 'utf8'));
const live = MISSIONS.filter((m) => !m.legacy);
const pct = (xs, p) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * p)];

describe('the measures', () => {
  it('grades plain copy low and dense copy high', () => {
    expect(fkGrade('Open the app. Tap the box.')).toBeLessThan(3);
    expect(fkGrade('Comprehensive authentication infrastructure necessitates sophisticated organizational implementation.')).toBeGreaterThan(14);
  });

  it('a step with two actions is compound; a menu path or a step with a note is not', () => {
    expect(isCompoundStep('Download your data first, then revoke third-party apps')).toBe(true);
    expect(isCompoundStep('Turn off sharing; delete the history')).toBe(true);
    expect(isCompoundStep('Open Settings → Privacy → Ads')).toBe(false);
    expect(isCompoundStep('Open haveibeenpwned.com')).toBe(false);
  });

  it('allows quoted screen labels, numbers and plain endings; flags hard words', () => {
    expect(wordsOutside('Tap “Manage connected apps” and turn it off.', ALLOWED)).toEqual([]);
    expect(wordsOutside('Look at the 3 things you opened, then keep going.', ALLOWED)).toEqual([]);
    expect(wordsOutside('Don’t worry, it isn’t hard.', ALLOWED)).toEqual([]);
    expect(wordsOutside('Revoke the authentication token.', ALLOWED)).toEqual(['revoke', 'authentication', 'token']);
  });
});

describe('the ratchet: copy only gets plainer', () => {
  it(`briefings' reading grade does not rise (median ≤ ${BASE.briefingGradeMedian}, p90 ≤ ${BASE.briefingGradeP90})`, () => {
    const g = live.map((m) => fkGrade(m.briefing));
    expect(pct(g, 0.5)).toBeLessThanOrEqual(BASE.briefingGradeMedian + 0.005);
    expect(pct(g, 0.9)).toBeLessThanOrEqual(BASE.briefingGradeP90 + 0.005);
  });

  it(`steps that ask for two actions don't come back (≤ ${BASE.compoundSteps})`, () => {
    const n = live.reduce((k, m) => k + (m.steps || []).filter((s) => isCompoundStep(s.text)).length, 0);
    expect(n).toBeLessThanOrEqual(BASE.compoundSteps);
  });
});

describe('plain leads', () => {
  it('every mission a player can open has one', () => {
    const missing = live.filter((m) => !MISSION_LEADS[m.id]).map((m) => m.id);
    expect(missing).toEqual([]);
  });

  it('every lead is one short plain sentence (grade 6, names aside), no numbers, no omni-"they"', () => {
    for (const [id, lead] of Object.entries(MISSION_LEADS)) {
      expect(MISSIONS.some((m) => m.id === id), `${id}: no such mission`).toBe(true);
      expect(words(lead).length, `${id}: ${lead}`).toBeLessThanOrEqual(16);
      expect(fkGradeWithoutNames(lead), `${id}: ${lead}`).toBeLessThanOrEqual(6);
      // No figures (a brand like 23andMe is a name, not a number).
      expect(lead, id).not.toMatch(/\b\d[\d,.]*\b/);
      expect(lead, id).not.toMatch(/\bthey\b/i);
      expect(lead, id).toMatch(/[.!?]$/);
    }
  });
});

describe('Simplest', () => {
  it('uses only the ten hundred words, phone words, account names and quoted screen labels', () => {
    for (const [id, s] of Object.entries(MISSION_SIMPLE)) {
      const texts = [s.lead, s.scout, ...s.steps.flatMap((st) => [st.text, ...(st.note || []).flatMap((n) => [n.label, n.text])])].filter(Boolean);
      for (const t of texts) expect(wordsOutside(t, ALLOWED), `${id}: ${t}`).toEqual([]);
    }
  });

  it('belongs to a real mission, keeps every link the mission’s own steps have, and is attached', () => {
    for (const [id, s] of Object.entries(MISSION_SIMPLE)) {
      const m = MISSIONS.find((x) => x.id === id);
      expect(m, id).toBeTruthy();
      expect(m.simple, id).toBe(s);
      const urls = new Set(s.steps.map((st) => st.url).filter(Boolean));
      for (const st of m.steps) if (st.url) expect(urls.has(st.url), `${id} lost ${st.url}`).toBe(true);
    }
  });

  it('covers the missions a new player meets first', () => {
    for (const id of ['gmail-recon-breach', 'outlook-recon-breach', 'icloud-recon-breach', 'yahoo-recon-breach', 'gmail-recon-login', 'gmail-fortify-2fa']) {
      expect(MISSION_SIMPLE[id], id).toBeTruthy();
    }
  });
});
