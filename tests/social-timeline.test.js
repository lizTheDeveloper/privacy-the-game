// UI sweep #5: the Social Timeline's answers do what its copy says. Unanswered eras stay
// unanswered, SAVE with no year says what's missing, and the Reclaim list is ordered and
// annotated by the player's busiest platforms and eras (no missions made up).
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderTimeline, renderSocialForm, renderEraQuestions } from '../src/screens/timeline.js';
import { socialProfileFromForm, timelineNote, timelineRank, getEras, ERA_MISSIONS } from '../src/utils/social-timeline.js';
import { MISSIONS } from '../src/data/missions.js';
import { textOf } from './helpers/on-page.mjs';

const NOW = new Date();
const YEAR = NOW.getFullYear();

function player() {
  const s = createInitialState();
  for (const id of ['instagram', 'twitter', 'tiktok', 'linkedin', 'facebook']) s.accounts[id] = { ...(s.accounts[id] || {}), enabled: true };
  // Reclaim opens once Fortify is done for an account: file every square/master-keys recon + fortify.
  for (const m of MISSIONS) if (['recon', 'fortify'].includes(m.phase) && !m.legacy) s.missions[m.id] = { status: 'completed', action: 'action-done' };
  return s;
}

describe('saving the timeline', () => {
  it('an era left blank is saved blank, not as "Posted sometimes"', () => {
    const r = socialProfileFromForm(String(YEAR - 12), ['heavy', null, undefined]);
    expect(r.profile.eras).toEqual(['heavy', null, null]);
    const s = player();
    s.socialHistory = { instagram: r.profile };
    const card = textOf(renderTimeline(s));
    expect(card).toContain('Not set');
    expect(card).not.toContain('Posted sometimes');
  });

  it('SAVE with no year says what is missing', () => {
    expect(socialProfileFromForm('', []).error).toMatch(/year you joined/);
    expect(renderSocialForm('instagram')).toContain('data-social-msg');
  });

  it('EDIT keeps the answers already saved', () => {
    const html = renderEraQuestions(YEAR - 12, ['heavy', null, 'light']);
    expect(html).toMatch(/name="era-0" value="heavy" checked/);
    expect(html).toMatch(/name="era-2" value="light" checked/);
    expect(html).not.toMatch(/name="era-1" value="[a-z]+" checked/);
  });
});

describe('what the answers do on Reclaim', () => {
  it('each Instagram era mission carries its years and the answer for that era', () => {
    const s = player();
    s.socialHistory = { instagram: { joinYear: YEAR - 12, eras: ['light', 'heavy', null] } };
    const eras = getEras(YEAR - 12, NOW);
    const [early, middle, recent] = ERA_MISSIONS.instagram.map((id) => MISSIONS.find((m) => m.id === id));
    expect(timelineNote(s, early, NOW)).toEqual({ years: `${eras[0].startYear}–${eras[0].endYear}`, activity: 'light' });
    expect(timelineNote(s, middle, NOW).activity).toBe('heavy');
    expect(timelineNote(s, recent, NOW).activity).toBeNull();
    expect(timelineRank(s, middle, NOW)).toBeGreaterThan(timelineRank(s, early, NOW));
  });

  it('the busiest era and platform come first on the Square Reclaim tab, with its years shown', () => {
    const s = player();
    const before = renderDistrict(s, 'square', 'reclaim');
    const order = (html) => [...html.matchAll(/href="#\/mission\/([^/"]+)\/briefing"/g)].map((m) => m[1]);
    // Without answers: the data's order (Instagram's general privacy mission before its eras).
    expect(order(before).indexOf('instagram-reclaim-privacy')).toBeLessThan(order(before).indexOf('instagram-reclaim-middle-years'));
    s.socialHistory = {
      instagram: { joinYear: YEAR - 12, eras: ['light', 'heavy', null] },
      tiktok: { joinYear: YEAR - 1, eras: ['none'] },
    };
    const after = renderDistrict(s, 'square', 'reclaim');
    const ids = order(after);
    expect(ids.indexOf('instagram-reclaim-middle-years')).toBeLessThan(ids.indexOf('instagram-reclaim-early-years'));
    expect(ids.indexOf('instagram-reclaim-middle-years')).toBeLessThan(ids.indexOf('tiktok-reclaim-privacy'));
    const mid = getEras(YEAR - 12, NOW)[1];
    expect(textOf(after)).toContain(`Your timeline: ${mid.startYear}–${mid.endYear}, posted a lot`);
    // The same missions, only reordered.
    expect([...ids].sort()).toEqual([...order(before)].sort());
  });

  it('the copy no longer promises sizing that does not happen', () => {
    const s = player();
    s.socialHistory = { instagram: { joinYear: YEAR - 12, eras: ['light', 'heavy', null] } };
    const pages = [renderDistrict(s, 'square', 'reclaim'), renderTimeline(createInitialState()), renderSocialForm('instagram')].map(textOf).join(' ');
    expect(pages).not.toMatch(/sized to your history|right-sized|get their own missions|grouped together/i);
    expect(pages).toContain('move to the top');
  });
});
