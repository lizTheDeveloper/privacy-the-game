// "OPT-OUTS FILED" on Your City counts every opt-out the player filed, not
// just the two car-broker missions (logic sweep #2). Opt-out missions are
// tagged in the data (`optOut: { questionId: [values that mean filed] }`);
// the pattern below is only a test-time net for an untagged one.
import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS } from '../src/data/missions.js';
import { createInitialState } from '../src/state.js';
import { fileDebrief, visibleQuestions } from '../src/utils/debrief.js';
import { calcFindings } from '../src/utils/calc.js';
import { renderStats } from '../src/screens/stats.js';
import { textOf } from './helpers/on-page.mjs';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

// Opt-out-looking missions that aren't an opt-out, and why.
const NOT_OPT_OUTS = {
  // Deletion requests: they share the opt-out debrief's words, but the
  // mission asks the maker to delete data, not to stop selling it.
  ...Object.fromEntries(MISSIONS.filter((m) => /^car_.*-reclaim-delete$/.test(m.id)).map((m) => [m.id, 'deletion request'])),
  // Microsoft's steps review and clear dashboard data; they don't switch
  // anything off (see the MICROSOFT_AI_DEBRIEF comment).
  'ai_microsoft-optout': 'clears data, no opt-out',
  // Ring has no partnership to leave: the steps turn off request emails and
  // explain that each police request can be declined.
  'smart_camera-fortify-police': 'no opt-out to file',
  // Audits: "No opt-out available for my region" is a finding; the opt-out
  // itself is the service's own -optout mission.
  'ai_google-recon': 'audit', 'ai_openai-recon': 'audit', 'ai_amazon-recon': 'audit',
};

const OPT_VALUES = new Set(['opted-out', 'filed-optout', 'all-submitted', 'some-submitted', 'objected']);
const looksLikeOptOut = (m) => /opt.?out/i.test(`${m.id} ${m.title}`)
  || (m.debriefQs || []).some((q) => q.options?.some((o) => OPT_VALUES.has(o.value) || /opt.?out|objection/i.test(o.text)));

const tagged = MISSIONS.filter((m) => m.optOut);

// Answers that file the opt-out: the tagged value for its question, the first
// non-deferred option for any other shown question.
function filingAnswers(m) {
  const answers = {};
  for (const [q, vals] of Object.entries(m.optOut)) answers[q] = vals[0];
  for (const q of visibleQuestions(m, answers)) {
    if (answers[q.id] === undefined) answers[q.id] = q.options.find((o) => o.severity !== 'skip').value;
  }
  return answers;
}

describe('opt-out missions are tagged in the data', () => {
  it('every opt-out-style mission carries an optOut tag (or a reason it is not one)', () => {
    const missing = MISSIONS.filter((m) => looksLikeOptOut(m) && !m.optOut && !NOT_OPT_OUTS[m.id]).map((m) => m.id);
    expect(missing).toEqual([]);
    for (const id of Object.keys(NOT_OPT_OUTS)) expect(MISSIONS.find((m) => m.id === id)?.optOut, id).toBeUndefined();
  });

  it('each tag names a real question and real, non-deferred answers', () => {
    expect(tagged.length).toBeGreaterThan(40);
    for (const m of tagged) {
      for (const [qid, vals] of Object.entries(m.optOut)) {
        const q = m.debriefQs.find((x) => x.id === qid);
        expect(q, `${m.id}.${qid}`).toBeDefined();
        expect(vals.length, m.id).toBeGreaterThan(0);
        for (const v of vals) {
          const opt = q.options.find((o) => o.value === v);
          expect(opt, `${m.id}: ${v}`).toBeDefined();
          expect(opt.severity, `${m.id}: ${v}`).not.toBe('skip');
        }
      }
    }
  });

  it('covers The Reclamation, The Foundry, The Freeway, The Grid and The Trail', () => {
    for (const id of ['people_search-fortify-web-forms', 'enterprise_data-fortify-lexisnexis', 'ai_openai-optout',
      'car_gm-optout-privacy', 'car_broker_verisk-optout', 'phone_carrier-reclaim-ads', 'loyalty_programs-fortify-optout',
      'genetic-opt-out-research']) {
      expect(MISSIONS.find((m) => m.id === id)?.optOut, id).toBeDefined();
    }
  });
});

describe('OPT-OUTS FILED counts every filed opt-out', () => {
  beforeEach(() => { globalThis.localStorage = memoryStorage(); });

  it('filing every tagged mission through the debrief counts each one, on the Stats screen too', () => {
    let s = createInitialState();
    for (const m of tagged) {
      const r = fileDebrief(s, m, filingAnswers(m));
      expect(r, m.id).not.toBeNull();
      expect(s = r.state).toBeTruthy();
      expect(s.missions[m.id].status, m.id).toBe('completed');
    }
    expect(calcFindings(s).optOutsFiled).toBe(tagged.length);
    expect(textOf(renderStats(s))).toContain(`${tagged.length} OPT-OUTS FILED`);
  });

  it('the 14 Reclamation broker opt-outs and the AI opt-outs are no longer 0', () => {
    let s = createInitialState();
    const broker = MISSIONS.filter((m) => m.debriefQs?.some((q) => q.id === 'optout_result'));
    for (const m of broker) s = fileDebrief(s, m, { optout_result: 'some-submitted' }).state;
    s = fileDebrief(s, MISSIONS.find((m) => m.id === 'ai_openai-optout'), { action: 'opted-out' }).state;
    expect(calcFindings(s).optOutsFiled).toBe(broker.length + 1);
  });

  it('an answer that is not a filing does not count', () => {
    let s = createInitialState();
    const byId = (id) => MISSIONS.find((m) => m.id === id);
    s = fileDebrief(s, byId('car_broker_lexisnexis-optout'), { action: 'no-data' }).state;
    s = fileDebrief(s, byId('ai_openai-optout'), { action: 'no-account' }).state;
    s = fileDebrief(s, byId('car_gm-optout-privacy'), { action: 'partial' }).state;
    s = fileDebrief(s, byId('people_search-fortify-web-forms'), { optout_result: 'skip' }).state;
    s = fileDebrief(s, byId('car_gm-reclaim-delete'), { action: 'opted-out' }).state;
    expect(calcFindings(s).optOutsFiled).toBe(0);
  });
});
