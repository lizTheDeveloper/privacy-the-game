// The orders step asks its own question (Liz 2026-11-18): "Did you see any orders that you
// don't remember ordering? Yes or no … And then it also leads you to ask other people in the
// house that use that account." A Yes asks the people at home; "nobody did" is the one to report.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MISSIONS } from '../src/data/missions.js';
import { reportInApp } from '../src/data/missions-recon-accounts.js';
import { createInitialState, markMissionStarted, updateMission } from '../src/state.js';
import { visibleSteps, stepKey, markStep, setStepAnswer } from '../src/utils/reading.js';
import { stepReportAnswers } from '../src/utils/step-report.js';
import { fileDebrief, missionEventData } from '../src/utils/debrief.js';
import { passwordResetNeed, resetNeedSources, notNeededReasons } from '../src/utils/password-need.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDebrief, debriefReaction } from '../src/screens/debrief.js';
import { markOpened } from '../src/utils/opened-steps.js';
import { bootApp } from './helpers/app-harness.mjs';

vi.setConfig({ testTimeout: 30000 });
beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});
afterEach(() => vi.unstubAllGlobals());

const byId = (id) => MISSIONS.find((m) => m.id === id);
const ORDER_MISSIONS = ['amazon-recon-activity', 'temu-recon-activity', 'shein-recon-activity', 'ebay-recon-activity'];
const AMAZON = byId('amazon-recon-activity');
const ORDERS_STEP = AMAZON.steps.findIndex((st) => st.ask === 'orders');

function allOn() {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: true } } };
  return s;
}
// Started, with every step before `upTo` ticked and step `upTo`'s site opened (Simple mode
// shows DONE and the question once the site has been opened).
function onStep(m, upTo) {
  let s = markMissionStarted(allOn(), m.id);
  const steps = visibleSteps(m, s);
  for (const st of steps.slice(0, upTo)) s = markStep(s, m.id, stepKey(st), 'done');
  if (steps[upTo]) markOpened(m.id, stepKey(steps[upTo]));
  return s;
}
const answer = (s, m, pairs) => Object.entries(pairs).reduce((acc, [q, v]) => setStepAnswer(acc, m.id, q, v), s);

describe('the orders question', () => {
  it('each shopping recon asks it on its orders step, and asks every report question on a step', () => {
    for (const id of ORDER_MISSIONS) {
      const m = byId(id);
      const q = m.debriefQs.find((x) => x.id === 'orders');
      expect(q, id).toBeTruthy();
      expect(q.options.map((o) => o.value)).toEqual(['orders-clean', 'orders-household', 'orders-unknown', 'skip']);
      expect(q.hint).toMatch(/other people in your home who use this account/);
      const asked = m.steps.map((st) => st.ask).filter(Boolean);
      expect(asked.filter((a) => a === 'orders'), id).toHaveLength(1);
      expect(new Set(asked), id).toEqual(new Set(m.debriefQs.map((x) => x.id)));
      // The orders step is the one about orders or purchases.
      expect(m.steps.find((st) => st.ask === 'orders').text, id).toMatch(/orders|purchase history/i);
      // The activity question no longer asks about orders too.
      expect(m.debriefQs.find((x) => x.id === 'activity').label, id).not.toMatch(/order|purchase/i);
      // "Nobody did" gets Scout's report-it line.
      expect(m.scoutDialog.debrief['orders-unknown'], id).toBe(`"${reportInApp(m.title.split(': ')[1])}"`);
    }
  });

  it('the orders step card: Yes / No / Couldn’t check, and nothing more until a Yes', () => {
    const html = renderBriefing(onStep(AMAZON, ORDERS_STEP), AMAZON.id);
    expect(html).toContain('data-step-ask="orders"');
    expect(html).toContain('Did you see any orders you don’t remember ordering?');
    expect(html).toContain('data-question="orders:yes" data-value="yes"');
    expect(html).toContain('data-value="orders-clean"');
    expect(html).toContain('data-value="skip"');
    expect(html).not.toContain('Ask the other people in your home');
    expect(html).not.toContain('data-value="orders-household"');
  });

  it('a Yes asks the people at home, then "Did one of them order it?"', () => {
    const s = answer(onStep(AMAZON, ORDERS_STEP), AMAZON, { 'orders:yes': 'yes' });
    const html = renderBriefing(s, AMAZON.id);
    expect(html).toContain('Ask the other people in your home who use this account.');
    expect(html).toContain('Did one of them order it?');
    expect(html).toMatch(/data-value="orders-household"[^>]*>Yes, it was them/);
    expect(html).toMatch(/data-value="orders-unknown"[^>]*>No, nobody did/);
    // The Yes tells app.js which answers it leaves in place.
    expect(html).toContain('data-keep="orders-household orders-unknown"');
    expect(html).not.toContain('Saved. Now tap DONE.');
    expect(renderBriefing(answer(s, AMAZON, { orders: 'orders-unknown' }), AMAZON.id)).toContain('Saved. Now tap DONE.');
  });

  it('the whole report is answered on the steps, so the last DONE sends it', () => {
    const steps = visibleSteps(AMAZON, allOn());
    let s = onStep(AMAZON, steps.length - 1);
    s = answer(s, AMAZON, { pw_status: 'pw-clean', 'orders:yes': 'yes', orders: 'orders-unknown', activity: 'activity-clean' });
    expect(stepReportAnswers(s, AMAZON)).toEqual({ pw_status: 'pw-clean', orders: 'orders-unknown', activity: 'activity-clean' });
    expect(renderBriefing(s, AMAZON.id)).toContain('DONE &#10003; SEND TO SCOUT');
    // Without the orders answer it isn't the whole report.
    expect(stepReportAnswers(answer(s, AMAZON, { orders: null }), AMAZON)).toBeNull();
  });

  it('nobody at home: Scout says report it, even over a leaked password; it counts for the reset', () => {
    const filed = fileDebrief(allOn(), AMAZON, { pw_status: 'pw-leaked', orders: 'orders-unknown', activity: 'activity-clean' });
    expect(filed.event.status).toBe('completed');
    expect(debriefReaction(filed.state, AMAZON).line).toBe(AMAZON.scoutDialog.debrief['orders-unknown']);
    expect(resetNeedSources(filed.state, 'amazon')).toEqual(['pm', 'activity']);
    const clean = fileDebrief(allOn(), AMAZON, { pw_status: 'pw-clean', orders: 'orders-unknown', activity: 'activity-clean' }).state;
    expect(resetNeedSources(clean, 'amazon')).toEqual(['activity']);
  });

  it('someone at home ordered it: fine, and no reset for it', () => {
    const s = fileDebrief(allOn(), AMAZON, { pw_status: 'pw-clean', orders: 'orders-household', activity: 'activity-clean' }).state;
    expect(passwordResetNeed(s, 'amazon')).toBe('not-needed');
    expect(notNeededReasons(s, 'amazon')).toContain('Everything in its recent activity was yours or someone’s at home.');
    const solo = fileDebrief(allOn(), AMAZON, { pw_status: 'pw-clean', orders: 'orders-household', activity: 'skip' }).state;
    expect(debriefReaction(updateMission(solo, AMAZON.id, { status: 'completed' }), AMAZON).line).toBe(AMAZON.scoutDialog.debrief['orders-household']);
  });

  it('old saves filed with only the activity answer still count', () => {
    const s = updateMission(allOn(), AMAZON.id, { status: 'completed', pw_status: 'pw-clean', activity: 'activity-confirmed' });
    expect(resetNeedSources(s, 'amazon')).toEqual(['activity']);
  });

  it('the report screen asks it in full words, with the hint', () => {
    const html = renderDebrief(allOn(), AMAZON.id);
    expect(html).toContain('Did you see any orders you don’t remember ordering?');
    expect(html).toContain('Yes, but someone at home ordered it');
    expect(html).toContain('Yes, and nobody at home ordered it');
    expect(html).toContain('Not sure? Ask the other people in your home who use this account.');
  });

  it('the answer is never sent', () => {
    const filed = fileDebrief(allOn(), AMAZON, { pw_status: 'pw-clean', orders: 'orders-unknown', activity: 'activity-clean' });
    expect(JSON.stringify(missionEventData(AMAZON, filed.state.missions[AMAZON.id]))).not.toMatch(/orders/);
  });
});

describe('tapping the orders answers', () => {
  it('Yes keeps a follow-up answer, No clears the Yes, and nothing leaves the device', async () => {
    const h = await bootApp({ state: onStep(AMAZON, ORDERS_STEP), hash: `#/mission/${AMAZON.id}/briefing` });
    h.clearEgress();
    const keep = 'orders-household orders-unknown';
    await h.click('step-answer', { mission: AMAZON.id, question: 'orders:yes', value: 'yes', keep });
    await h.click('step-answer', { mission: AMAZON.id, question: 'orders', value: 'orders-household' });
    expect(h.state().stepProgress[AMAZON.id].answers).toEqual({ orders: 'orders-household' });
    // Yes again (it shows picked) keeps "it was them".
    await h.click('step-answer', { mission: AMAZON.id, question: 'orders:yes', value: 'yes', keep });
    expect(h.state().stepProgress[AMAZON.id].answers).toEqual({ 'orders:yes': 'yes', orders: 'orders-household' });
    // And once more un-picks the Yes and what came after it.
    await h.click('step-answer', { mission: AMAZON.id, question: 'orders:yes', value: 'yes', keep });
    expect(h.state().stepProgress[AMAZON.id].answers).toEqual({});
    // No after a Yes: just No.
    await h.click('step-answer', { mission: AMAZON.id, question: 'orders:yes', value: 'yes', keep });
    await h.click('step-answer', { mission: AMAZON.id, question: 'orders', value: 'orders-clean' });
    expect(h.state().stepProgress[AMAZON.id].answers).toEqual({ orders: 'orders-clean' });
    // A Yes after No clears the No.
    await h.click('step-answer', { mission: AMAZON.id, question: 'orders:yes', value: 'yes', keep });
    expect(h.state().stepProgress[AMAZON.id].answers).toEqual({ 'orders:yes': 'yes' });
    expect(h.egress()).toEqual([]);
  });
});
