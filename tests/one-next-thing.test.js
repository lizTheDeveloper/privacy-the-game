import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderNext } from '../src/screens/next.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderCityMap, nextAvailableMission, nextDistrictId } from '../src/screens/city-map.js';
import { renderMilestone } from '../src/screens/milestone.js';
import { renderHud } from '../src/components/hud.js';
import { createInitialState } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { DISTRICTS } from '../src/data/districts.js';
import { missionDistrict } from '../src/data/missions.js';

// A player (2026-11-18): "I need your help to ONLY highlight and emphasize the part that is
// supposed to do next." The filled cyan button (.btn-primary) is the one thing to tap next:
// one per screen, and on a list only the recommended row.

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

const primaries = (html) => (html.replace(/<style>[\s\S]*?<\/style>/g, '').match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
const LEVELS = ['simplest', 'full'];
const fresh = (level) => setReadLevel(createInitialState(), level);
const started = (level, id) => ({ ...fresh(level), startedMissions: { [id]: true } });
const TABS = ['survey', 'recon', 'fortify', 'reclaim'];

describe('one bright button per screen', () => {
  for (const level of LEVELS) {
    describe(level, () => {
      const first = nextAvailableMission(fresh(level));

      it('What’s next', () => {
        expect(primaries(renderNext(fresh(level)))).toBe(1);
      });

      it('a briefing before starting, and a step', () => {
        expect(primaries(renderBriefing(fresh(level), first.id))).toBe(1);
        expect(primaries(renderBriefing(started(level, first.id), first.id))).toBe(1);
      });

      it('the report', () => {
        expect(primaries(renderDebrief(started(level, first.id), first.id))).toBe(1);
      });

      it('the city map: the Scout’s next mission, and the top bar never adds one', () => {
        expect(primaries(renderCityMap(fresh(level)))).toBe(1);
        expect(primaries(renderHud(fresh(level)))).toBe(0);
      });

      it('every district, on every tab: at most one', () => {
        for (const d of DISTRICTS) {
          for (const tab of TABS) {
            const n = primaries(renderDistrict(fresh(level), d.id, tab));
            expect(n, `${d.id} ${tab}`).toBeLessThanOrEqual(1);
          }
        }
      });

      it('a milestone', () => {
        expect(primaries(renderMilestone(fresh(level), 'master-keys'))).toBe(1);
      });
    });
  }

  it('a mission list lights its lead row: one filled START, the rest outlined', () => {
    const html = renderDistrict(fresh('full'), 'master-keys', 'recon');
    expect(primaries(html)).toBe(1);
    expect((html.match(/mission-row--lead/g) || []).length).toBe(1);
    expect(html).toMatch(/btn-secondary btn-sm/);
  });

  it('a facility district (every row used to be filled) has one lead row', () => {
    const html = renderDistrict(fresh('full'), 'perimeter');
    expect(primaries(html)).toBe(1);
    expect((html.match(/facility-row--lead/g) || []).length).toBe(1);
  });
});

describe('the city map lights the district the next mission is in', () => {
  it('one card is lit, and it is the next mission’s district', () => {
    const s = fresh('full');
    const html = renderCityMap(s).replace(/<style>[\s\S]*?<\/style>/g, '');
    expect((html.match(/city-label--next/g) || []).length).toBe(1);
    expect(nextDistrictId(s)).toBe(missionDistrict(nextAvailableMission(s)));
    expect(html).toMatch(new RegExp(`href="#/district/${nextDistrictId(s)}" class="[^"]*city-label--next`));
  });

  it('the shortcut buttons are one quiet style, not three colours', () => {
    const html = renderCityMap(fresh('full'));
    expect(html).not.toMatch(/city-btn--(magenta|cyan|lime)"/);
  });
});

describe('the colour language is written down', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  it('as a comment over the rules that carry it', () => {
    expect(css).toContain('colour language: start');
    expect(css).toMatch(/CYAN, FILLED, WITH A GLOW[\s\S]*LIME[\s\S]*AMBER[\s\S]*MAGENTA/);
  });
  it('pressing a button shows it, keyboard focus shows, and reduced motion is honoured', () => {
    expect(css).toMatch(/\.btn-primary:active \{[^}]*transform/);
    expect(css).toMatch(/:focus-visible \{ outline: 2px solid var\(--cyan\)/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*#app\.is-arriving \.btn-primary \{ animation: none; \}/);
  });
});
