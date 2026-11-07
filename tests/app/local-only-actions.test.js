// Promises the game makes that something stays on this device ("no track()",
// "nothing leaves this browser"), checked by driving the real app.js handlers
// with every way out watched: umami.track (every analytics.js path ends
// there), fetch and navigator.sendBeacon. analytics.js is not mocked.
// Each group has a control: a tracked action through the same harness shows
// up, so an empty egress means "not sent", not "the harness can't see".
import { describe, it, expect, afterEach, vi } from 'vitest';
import { bootApp, FakeEl } from '../helpers/app-harness.mjs';
import { createInitialState } from '../../src/state.js';
import { MISSIONS } from '../../src/data/missions.js';
import { customMissionsFor } from '../../src/data/custom-missions.js';
import { addBankNote } from '../../src/utils/bank-notes.js';

// Each test boots the whole app fresh (vi.resetModules, then app.js and its ~150 modules):
// about 0.1s alone, past 1s in a loaded full run. The default 5s left too little headroom.
vi.setConfig({ testTimeout: 30000 });
afterEach(() => vi.unstubAllGlobals());

const umamiCalls = (h) => h.egress().filter(([ch]) => ch === 'umami.track');
const firstOption = (q) => q.options.find((o) => o.severity !== 'skip' && !['skip', 'later'].includes(o.value)).value;

// The debrief form's answers, as app.js reads them (readAnswers): every question answered.
function answerAll(h, mission) {
  for (const q of mission.debriefQs) {
    if (q.type === 'number') h.setQuery(`input[type="number"][name="q_${q.id}"]`, { value: '1' });
    else h.setQueryAll(`input[name="q_${q.id}"]:checked`, [{ value: firstOption(q) }]);
  }
}

describe('re-check never reaches analytics', () => {
  const mission = MISSIONS.find((m) => m.id === 'gmail-recon-login');
  const state = () => {
    const s = createInitialState();
    s.missions = { ...s.missions, [mission.id]: { status: 'completed', completedAt: '2026-01-01T00:00:00.000Z', finding: 'old' } };
    return s;
  };

  it('submit-recheck records the new answers and sends nothing', async () => {
    const h = await bootApp({ state: state(), hash: `#/mission/${mission.id}/recheck` });
    h.clearEgress();
    answerAll(h, mission);
    await h.click('submit-recheck', { mission: mission.id });
    expect(h.state().missions[mission.id].finding).not.toBe('old');
    expect(h.state().missions[mission.id].status).toBe('completed');
    expect(h.egress()).toEqual([]);
  });

  it('control: filing the same answers as a debrief is sent', async () => {
    const s = state();
    delete s.missions[mission.id];
    const h = await bootApp({ state: s, hash: `#/mission/${mission.id}/debrief` });
    h.clearEgress();
    answerAll(h, mission);
    await h.click('submit-debrief', { mission: mission.id });
    expect(umamiCalls(h).map((c) => c[1])).toContain('mission-completed');
  });
});

describe('lighting a candle stays on this phone', () => {
  it('light-candle and putting it out send nothing', async () => {
    const h = await bootApp({ state: createInitialState(), hash: '#/saints' });
    h.clearEgress();
    await h.click('light-candle', { saint: 'swartz' });
    expect(h.state().candles.swartz).toBe(true);
    await h.click('light-candle', { saint: 'swartz' });
    expect(h.state().candles?.swartz).toBeFalsy();
    expect(h.egress()).toEqual([]);
  });
});

describe('bank notes never leave the browser', () => {
  const SECRET = 'Zyx Secret Credit Union';
  const SECRET_URL = 'https://zyx-secret-cu.example/login';
  const form = (fields, edit) => {
    const f = new FakeEl({ dataset: edit ? { edit } : {}, matches: (sel) => sel === 'form[data-bank-note-form]' });
    for (const [k, v] of Object.entries(fields)) f.queries.set(`[data-field="${k}"]`, new FakeEl({ value: v }));
    return f;
  };

  it('save (button and Enter), open, edit and delete send nothing', async () => {
    const h = await bootApp({ state: createInitialState(), hash: '#/vault/banks' });
    h.clearEgress();
    h.setQuery('form[data-bank-note-form]', form({ name: SECRET, loginUrl: SECRET_URL, resetUrl: '' }));
    await h.click('bank-note-save');
    const notes = h.state().bankNotes;
    expect(notes.map((n) => n.name)).toEqual([SECRET]);

    const second = form({ name: `${SECRET} 2`, loginUrl: '', resetUrl: '' });
    h.setQuery('form[data-bank-note-form]', second);
    await h.fire('submit', second);
    expect(h.state().bankNotes).toHaveLength(2);

    await h.click('bank-note-open', { mission: 'primary_bank-fortify-password' });
    expect(h.state().startedMissions['primary_bank-fortify-password']).toBeTruthy();
    await h.click('bank-note-edit', { note: notes[0].id });
    h.setQuery('form[data-bank-note-form]', form({ name: `${SECRET} renamed`, loginUrl: SECRET_URL, resetUrl: '' }, notes[0].id));
    await h.click('bank-note-save');
    expect(h.state().bankNotes[0].name).toBe(`${SECRET} renamed`);
    await h.click('bank-note-delete', { note: notes[0].id });
    expect(h.state().bankNotes).toHaveLength(1);

    const out = JSON.stringify(h.egress());
    expect(out).not.toContain('Zyx');
    expect(out).not.toContain('zyx-secret');
    expect(h.egress()).toEqual([]);
  });

  it('control: a bank mission started from GO DO IT is sent (without the bank)', async () => {
    const r = addBankNote(createInitialState(), { name: SECRET, loginUrl: SECRET_URL });
    const h = await bootApp({ state: r.state, hash: '#/mission/primary_bank-fortify-password/briefing' });
    h.clearEgress();
    await h.click('start-mission', { mission: 'primary_bank-fortify-password' });
    expect(umamiCalls(h).map((c) => c[1])).toEqual(['mission-started']);
    expect(JSON.stringify(h.egress())).not.toContain('Zyx');
  });
});

describe("a custom account's missions send no event", () => {
  const NAME = 'My Quiet Credit Union';
  const state = () => ({ ...createInitialState(), customAccounts: { vault: [NAME] } });
  const ms = customMissionsFor(state(), 'vault');

  it('start, step, GO DO IT and filing the debrief send nothing', async () => {
    expect(ms.length).toBe(4);
    const h = await bootApp({ state: state(), hash: `#/mission/${ms[0].id}/briefing` });
    h.clearEgress();
    await h.click('start-mission', { mission: ms[0].id });
    await h.click('mission-step', { mission: ms[1].id });
    await h.click('go-do-it', { mission: ms[2].id });
    for (const m of ms) {
      answerAll(h, m);
      await h.click('submit-debrief', { mission: m.id });
      expect(h.state().missions[m.id]?.status, m.id).toBe('completed');
    }
    expect(JSON.stringify(h.egress())).not.toMatch(/Quiet|credit union/i);
    expect(umamiCalls(h)).toEqual([]);
  });

  it('control: the same actions on a built-in mission are sent', async () => {
    const real = MISSIONS.find((m) => m.id === 'gmail-recon-login');
    const h = await bootApp({ state: createInitialState(), hash: `#/mission/${real.id}/briefing` });
    h.clearEgress();
    await h.click('start-mission', { mission: real.id });
    answerAll(h, real);
    await h.click('submit-debrief', { mission: real.id });
    expect(umamiCalls(h).map((c) => c[1])).toEqual(['mission-started', 'mission-completed']);
  });
});

describe('the sky: where you live and the ladder stay in memory', () => {
  it('the location quiz saves the answer and never sends it or puts it in the URL', async () => {
    const h = await bootApp({ state: createInitialState(), hash: '#/reclamation/map' });
    h.clearEgress();
    await h.click('quiz-yes', { value: 'US-TX' });
    expect(h.state().home).toBe('US-TX');
    await h.click('change-home');
    const residency = new FakeEl({ matches: (sel) => sel === '.residency' });
    residency.queries.set('.residency-select', new FakeEl({ value: 'US-OR' }));
    // quiz-pick reads the select from its .residency: give the button one.
    const pick = new FakeEl({ dataset: { action: 'quiz-pick' }, matches: (sel) => sel === '[data-action]' });
    pick.closest = (sel) => (sel === '[data-action]' ? pick : sel === '.residency' ? residency : null);
    await h.fire('click', pick);
    expect(h.state().home).toBe('US-OR');
    await h.click('quiz-outside');
    expect(h.state().home).toBe('outside-us');
    await h.click('quiz-unsaid');
    expect(h.state().caResident).toBe('unsaid');

    const out = JSON.stringify(h.egress());
    expect(out).not.toMatch(/US-TX|US-OR|outside-us|unsaid|\bTX\b|\bOR\b/);
    expect(umamiCalls(h)).toEqual([]);
    expect(h.window.location.hash).toBe('#/reclamation/map');
  });

  it('ladder toggles and OptOutPrescreen I DID THIS send nothing', async () => {
    const h = await bootApp({ state: { ...createInitialState(), home: 'US-CA', caResident: 'yes' }, hash: '#/reclamation/map' });
    h.clearEgress();
    await h.click('ladder-toggle');
    await h.click('close-rung');
    await h.click('prescreen-did');
    expect(h.state().prescreen).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await h.click('prescreen-undo');
    expect(h.state().prescreen).toBeUndefined();
    expect(umamiCalls(h)).toEqual([]);
    expect(JSON.stringify(h.egress())).not.toMatch(/prescreen|rung|ladder/i);
    expect(h.window.location.hash).toBe('#/reclamation/map');
  });
});

describe('api/whoami is asked only while sharing is on and the player has not gone ghost', () => {
  const whoamiCalls = (h) => h.fetch.mock.calls.filter(([url]) => String(url).includes('whoami'));
  const fresh = () => createInitialState(); // no home: the sky would want a guess

  it('sharing off: arriving on the ghost screen, the sky, Your City or the city never looks the player up', async () => {
    for (const hash of ['#/ghost', '#/reclamation/map', '#/stats', '#/city']) {
      const h = await bootApp({ state: fresh(), hash, storage: { 'reclaim-city.analytics-off': '1', 'umami.disabled': '1' } });
      await h.settle(50);
      expect(whoamiCalls(h), hash).toEqual([]);
      expect(umamiCalls(h), hash).toEqual([]);
    }
  });

  it('gone ghost: the same', async () => {
    for (const hash of ['#/ghost', '#/reclamation/map']) {
      const h = await bootApp({ state: fresh(), hash, storage: { 'reclaim-city.gone-ghost': JSON.stringify({ at: '2026-10-01T00:00:00.000Z', silent: false, early: false }) } });
      await h.settle(50);
      expect(whoamiCalls(h), hash).toEqual([]);
    }
  });

  it('control: sharing on, the ghost screen and the sky do look up', async () => {
    for (const hash of ['#/ghost', '#/reclamation/map']) {
      const h = await bootApp({ state: fresh(), hash });
      await h.settle(50);
      expect(whoamiCalls(h).length, hash).toBeGreaterThan(0);
    }
  });
});
