import { describe, it, expect } from 'vitest';
import { DISTRICT_DIALOGUE } from '../src/data/dialogue.js';
import { getMissionsForDistrict } from '../src/data/missions.js';
import { DISTRICTS } from '../src/data/districts.js';
import { renderDistrict } from '../src/screens/district.js';
import { createInitialState } from '../src/state.js';

// The five districts added after Scout's first eight (feature map row 22).
const LATE = ['foundry', 'freeway', 'grid', 'clinic', 'trail'];

// Everything a district's missions say: the fact base Scout may draw on.
const missionText = (id) => JSON.stringify(getMissionsForDistrict(id).map((m) => [m.briefing, m.steps, m.scoutDialog]));

// Everything Scout says in a district, minus the leading "25%." of a progress line.
function scoutText(d) {
  const lines = [d.intro, ...Object.values(d.progress).flat(), ...Object.values(d.debrief || {}).flat(), ...Object.values(d.lore).map((l) => l.text)];
  return lines.map((l) => l.replace(/^(25|50|75|100)%\.?/, '')).join('\n');
}

describe("Scout's voice reaches every district", () => {
  it('every district has an intro, all four progress lines and lore', () => {
    for (const d of DISTRICTS) {
      const dl = DISTRICT_DIALOGUE[d.id];
      expect(dl?.intro, d.id).toBeTruthy();
      for (const m of [25, 50, 75, 100]) expect(dl.progress?.[m]?.length, `${d.id} ${m}%`).toBeGreaterThan(0);
    }
    for (const id of LATE) expect(Object.keys(DISTRICT_DIALOGUE[id].lore).length, id).toBeGreaterThan(0);
  });

  it("every number Scout says in a late district is already in that district's missions (never invented)", () => {
    for (const id of LATE) {
      const facts = missionText(id);
      const numbers = scoutText(DISTRICT_DIALOGUE[id]).match(/\d[\d.,]*\d|\d/g) || [];
      for (const n of numbers) expect(facts, `${id}: "${n}"`).toContain(n);
    }
  });

  it('names who did it: no unnamed "they" doing the threatening', () => {
    for (const id of LATE) {
      const text = scoutText(DISTRICT_DIALOGUE[id]);
      expect(text, id).not.toMatch(/\bthey(?:'re| are| can| will| know| see| watch| sell| take| want)\b/i);
    }
  });

  it('a facility district shows Scout, then its facility intro once Scout is dismissed', () => {
    for (const id of ['grid', 'clinic', 'trail']) {
      const fresh = renderDistrict(createInitialState(), id);
      expect(fresh, id).toContain('data-action="dismiss-intro"');
      const seen = renderDistrict({ ...createInitialState(), seenIntros: { [id]: true } }, id);
      expect(seen, id).toContain(DISTRICTS.find((d) => d.id === id).facilityIntro.slice(0, 40));
    }
  });
});
