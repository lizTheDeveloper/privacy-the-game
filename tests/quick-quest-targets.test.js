// Pick 14 (Liz 2026-11-20: "Do it"): Quick Quest goes straight to the fix. Each problem names the
// missions that fix it; a pick opens the first one the player can start, else its district.
import { describe, it, expect } from 'vitest';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
import { QUICK_QUESTS } from '../src/data/quests.js';
import { MISSIONS, missionDistrict } from '../src/data/missions.js';
import { DISTRICTS } from '../src/data/districts.js';
import { renderQuickQuest, questTarget } from '../src/screens/quick-quest.js';

const quest = (id) => QUICK_QUESTS.find((q) => q.id === id);
const only = (...accts) => {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = toggleAccount(s, id, false);
  for (const a of accts) s = toggleAccount(s, a, true);
  return s;
};

describe('every quest names missions that exist', () => {
  for (const q of QUICK_QUESTS) {
    it(q.id, () => {
      expect(q.targetMissions?.length, q.id).toBeGreaterThan(0);
      for (const id of q.targetMissions) {
        const m = MISSIONS.find((x) => x.id === id);
        expect(m, `${q.id} → ${id}`).toBeTruthy();
        expect(m.legacy, id).toBeFalsy();
        expect(m.phase, id).not.toBe('survey');
      }
      expect(DISTRICTS.some((d) => d.id === q.targetDistrict)).toBe(true);
    });
  }
});

describe('a pick opens the fix', () => {
  it('My email got hacked: the account’s breach check first, its password reset once that’s done', () => {
    let s = only('gmail');
    expect(questTarget(s, quest('email-hacked'))).toMatchObject({ href: '#/mission/gmail-recon-breach/briefing', missionId: 'gmail-recon-breach' });
    s = updateMission(s, 'gmail-recon-breach', { status: 'completed', finding: '1-2-breaches' });
    expect(questTarget(s, quest('email-hacked'))).toMatchObject({ href: '#/mission/gmail-fortify-password/briefing', label: 'Password Reset: Gmail' });
  });

  it('the player’s own account: Outlook when Gmail is off', () => {
    expect(questTarget(only('outlook'), quest('email-hacked')).missionId).toBe('outlook-recon-breach');
  });

  it('a done fix gives way to one not done yet', () => {
    let s = only('primary_bank', 'credit_card');
    for (const id of ['primary_bank-recon-password', 'primary_bank-fortify-password']) s = updateMission(s, id, { status: 'completed' });
    expect(questTarget(s, quest('bank-fraud')).missionId).toBe('credit_card-recon-password');
  });

  it('no account for it (or locked): its district, and the row says so', () => {
    const s = only();
    const to = questTarget(s, quest('email-hacked'));
    expect(to).toMatchObject({ href: '#/district/master-keys', label: 'The Master Keys', missionId: null });
    // The Field is opt-in: until it is on, its quest goes to the district, where it's asked.
    expect(questTarget(createInitialState(), quest('work-target')).href).toBe('#/district/field');
    const html = renderQuickQuest(s);
    expect(html).toContain('href="#/district/master-keys"');
    expect(html).toMatch(/Takes you to: <span class="qq-to-name">The Master Keys<\/span>/);
  });

  it('every row and card links to its target, phone and desktop alike', () => {
    const s = only('gmail', 'primary_bank', 'instagram', 'gdrive', 'amazon', 'irs');
    const html = renderQuickQuest(s);
    for (const q of QUICK_QUESTS) {
      const to = questTarget(s, q);
      expect(html.split(`href="${to.href}"`).length - 1, q.id).toBeGreaterThanOrEqual(2);
      if (to.missionId) expect(missionDistrict(MISSIONS.find((m) => m.id === to.missionId))).toBeTruthy();
    }
  });
});
