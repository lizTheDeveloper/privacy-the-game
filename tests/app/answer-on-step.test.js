// The step where the player reads the answer asks the report's question right there
// (data/missions.js askSteps, screens/briefing.js stepAsk). Liz: "on step 3 of 4 it's like,
// read the results, note how many breaches … and it doesn't have the place for them to
// enter the information right there." The answer stays on the device and the report
// starts from it.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { bootApp } from '../helpers/app-harness.mjs';
import { createInitialState, markMissionStarted } from '../../src/state.js';
import { MISSIONS } from '../../src/data/missions.js';
import { visibleSteps, stepKey, markStep, setStepAnswer } from '../../src/utils/reading.js';
import { renderBriefing } from '../../src/screens/briefing.js';
import { renderDebrief } from '../../src/screens/debrief.js';

vi.setConfig({ testTimeout: 30000 });
afterEach(() => vi.unstubAllGlobals());

const GMAIL = MISSIONS.find((m) => m.id === 'gmail-recon-breach');
const onStep3 = () => {
  let s = markMissionStarted(createInitialState(), GMAIL.id);
  const [k0, k1] = visibleSteps(GMAIL, s).map(stepKey);
  s = markStep(s, GMAIL.id, k0, 'done');
  return markStep(s, GMAIL.id, k1, 'done');
};

describe('answer on the step', () => {
  it('Gmail breach step 3 of 4 shows "what did you find" with every report answer', () => {
    expect(GMAIL.steps[2].ask).toBe('finding');
    const html = renderBriefing(onStep3(), GMAIL.id);
    expect(html).toContain('Step 3 of 3');
    expect(html).toContain('data-step-ask="finding"');
    // Few words: Yes / No / Couldn't check first; "How many?" waits for a Yes.
    expect(html).toContain('Were you in any leaks?');
    expect(html).toContain('data-question="finding:yes" data-value="yes"');
    expect(html).toContain('data-value="no-breaches"');
    expect(html).toContain('data-value="skip"');
    expect(html).not.toContain('How many?');
    const yes = renderBriefing(setStepAnswer(onStep3(), GMAIL.id, 'finding:yes', 'yes'), GMAIL.id);
    expect(yes).toContain('How many?');
    expect(yes).toContain('data-value="1-2-breaches"');
    expect(yes).toContain('data-value="3plus-breaches"');
    // The password follow-up waits for a "found in breaches" answer.
    expect(html).not.toContain('data-ask-q="password_exposed"');
  });

  it('a breached answer brings the password question onto the same card', () => {
    const s = setStepAnswer(onStep3(), GMAIL.id, 'finding', '1-2-breaches');
    const html = renderBriefing(s, GMAIL.id);
    expect(html).toContain('data-ask-q="password_exposed"');
    expect(html).toMatch(/data-value="1-2-breaches" aria-pressed="true"/);
    expect(renderBriefing(setStepAnswer(onStep3(), GMAIL.id, 'finding', 'no-breaches'), GMAIL.id)).not.toContain('data-ask-q="password_exposed"');
  });

  it('the report starts from the answers given on the step, and says so', () => {
    let s = setStepAnswer(onStep3(), GMAIL.id, 'finding', '3plus-breaches');
    s = setStepAnswer(s, GMAIL.id, 'password_exposed', 'yes');
    const html = renderDebrief(s, GMAIL.id);
    expect(html).toMatch(/value="3plus-breaches" checked/);
    expect(html).toMatch(/value="yes" checked/);
    expect(html).toContain('You picked this on the step.');
  });

  it('picking (and un-picking) an answer keeps it on the device and sends nothing', async () => {
    const h = await bootApp({ state: onStep3(), hash: `#/mission/${GMAIL.id}/briefing` });
    h.clearEgress();
    await h.click('step-answer', { mission: GMAIL.id, question: 'finding', value: '1-2-breaches' });
    expect(h.state().stepProgress[GMAIL.id].answers).toEqual({ finding: '1-2-breaches' });
    await h.click('step-answer', { mission: GMAIL.id, question: 'finding', value: '1-2-breaches' });
    expect(h.state().stepProgress[GMAIL.id].answers).toEqual({});
    await h.click('step-answer', { mission: GMAIL.id, question: 'finding:yes', value: 'yes' });
    await h.click('step-answer', { mission: GMAIL.id, question: 'finding', value: '3plus-breaches' });
    expect(h.state().stepProgress[GMAIL.id].answers.finding).toBe('3plus-breaches');
    await h.click('step-answer', { mission: GMAIL.id, question: 'finding', value: 'no-breaches' });
    expect(h.state().stepProgress[GMAIL.id].answers).toEqual({ finding: 'no-breaches' });
    expect(h.egress()).toEqual([]);
  });

  it('every email breach check and sign-in check asks on one of its own steps', () => {
    const missing = MISSIONS
      .filter((m) => /-recon-(breach|login)$/.test(m.id) && m.debriefQs?.some((q) => q.id === 'finding'))
      .filter((m) => !m.steps.some((st) => st.ask === 'finding'))
      .map((m) => m.id);
    expect(missing).toEqual([]);
  });

  it('no breach check has a Pwned Passwords step any more (the password check is its own mission)', () => {
    expect(MISSIONS.flatMap((m) => m.steps).filter((st) => /^Separately, check this account/.test(st.text))).toEqual([]);
  });
});
