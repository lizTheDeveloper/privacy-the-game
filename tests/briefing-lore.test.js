// UI sweep #6: briefings walk through their district's lore. Each briefing shows the next
// entry the player hasn't seen, and the same one again when the player comes back to it.
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { briefingLore, markLoreShown } from '../src/utils/lore.js';
import { DISTRICT_DIALOGUE } from '../src/data/dialogue.js';
import { MISSIONS, missionDistrict } from '../src/data/missions.js';

const VAULT = ['primary_bank-recon-password', 'primary_bank-fortify-password', 'primary_bank-fortify-2fa', 'primary_bank-fortify-alerts'];

function vaultPlayer() {
  const s = createInitialState();
  s.accounts.primary_bank = { ...(s.accounts.primary_bank || {}), enabled: true };
  return s;
}

const loreTitleOn = (html) => /brief-lore-title[^>]*>([^<]*)</.exec(html)?.[1];

describe('briefing lore advances', () => {
  it('four Vault briefings show four different entries, in order, and keep them', () => {
    const s = vaultPlayer();
    const keys = Object.keys(DISTRICT_DIALOGUE.vault.lore);
    expect(keys.length).toBeGreaterThanOrEqual(3);
    const titles = [];
    for (const id of VAULT.filter((id) => MISSIONS.some((m) => m.id === id))) {
      const html = renderBriefing(s, id);
      titles.push(loreTitleOn(html));
      markLoreShown(s, id);
      // Back to the same briefing: the same entry.
      expect(loreTitleOn(renderBriefing(s, id))).toBe(titles.at(-1));
    }
    const expected = keys.map((k) => DISTRICT_DIALOGUE.vault.lore[k].title);
    expect(titles.slice(0, keys.length)).toEqual(expected.slice(0, titles.length));
    expect(new Set(titles.slice(0, keys.length)).size).toBe(Math.min(titles.length, keys.length));
  });

  it('every lore entry of every district can be reached', () => {
    const s = createInitialState();
    for (const [districtId, d] of Object.entries(DISTRICT_DIALOGUE)) {
      const keys = Object.keys(d.lore || {});
      if (!keys.length) continue;
      const missions = MISSIONS.filter((m) => !m.legacy && missionDistrict(m) === districtId);
      const shown = new Set();
      for (const m of missions) {
        shown.add(briefingLore(s, m.id).key);
        markLoreShown(s, m.id);
      }
      if (missions.length >= keys.length) expect([...shown].sort()).toEqual([...keys].sort());
    }
  });

  it('once every entry is seen, briefings go round again', () => {
    const s = vaultPlayer();
    const keys = Object.keys(DISTRICT_DIALOGUE.vault.lore);
    s.seenLore = { vault: [...keys] };
    expect(briefingLore(s, VAULT[0]).key).toBe(keys[0]);
    markLoreShown(s, VAULT[0]);
    expect(briefingLore(s, VAULT[1]).key).toBe(keys[1 % keys.length]);
  });
});
