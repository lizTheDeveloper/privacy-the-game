// Recon campaign, phase 1: bugs found by the recon audit (X1, X2, X7, and the
// car insurance scan's literal ${name}). No analytics value changes meaning.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MISSIONS, getMissionsForAccount } from '../src/data/missions.js';
import { debriefRecord } from '../src/utils/debrief.js';
import { debriefReaction } from '../src/screens/debrief.js';
import { PASSWORD_DIALOGUE } from '../src/data/dialogue.js';
import { calcFindings, getBuildingState, isCoreMission } from '../src/utils/calc.js';
import { createInitialState, updateMission } from '../src/state.js';
import { renderMilestone } from '../src/screens/milestone.js';

const EMAIL_ACCOUNTS = ['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'google', 'apple_id', 'microsoft'];
const isEmailBreachCheck = (m) => EMAIL_ACCOUNTS.some((a) => m.id === `${a}-recon-breach`);
const byId = (id) => {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error(`no mission ${id}`);
  return m;
};

function allQuestions(m) {
  const out = [];
  for (const q of m.debriefQs || []) {
    out.push(q);
    if (q.legacy) out.push(q.legacy);
  }
  return out;
}

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});
afterEach(() => vi.restoreAllMocks());

// ── X2 ──────────────────────────────────────────────────────────────
describe('X2: every debrief option is a real value + text', () => {
  it('every option in every mission has a string text and a slug value', () => {
    const bad = [];
    for (const m of MISSIONS) {
      for (const q of allQuestions(m)) {
        for (const o of q.options || []) {
          if (typeof o.text !== 'string' || !o.text || !/^[a-z0-9-]+$/.test(String(o.value))) {
            bad.push(`${m.id} / ${q.id} / ${JSON.stringify(o.value)}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('"skip" and "later" answers file as skipped, not completed, in every mission', () => {
    const wrong = [];
    for (const m of MISSIONS) {
      for (const q of m.debriefQs || []) {
        if (q.showIf) continue;
        for (const o of q.options || []) {
          if (o.value !== 'skip' && o.value !== 'later') continue;
          const answers = {};
          for (const q2 of m.debriefQs) if (!q2.showIf) answers[q2.id] = q2 === q ? o.value : q2.options?.[0]?.value;
          const r = debriefRecord(m, answers);
          if (r?.status !== 'skipped') wrong.push(`${m.id} / ${q.id} = ${o.value} -> ${r?.status}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it("every option marked severity 'skip' files as skipped, in every mission", () => {
    const wrong = [];
    let checked = 0;
    for (const m of MISSIONS) {
      for (const q of m.debriefQs || []) {
        if (q.showIf) continue;
        for (const o of q.options || []) {
          if (o.severity !== 'skip') continue;
          const answers = {};
          for (const q2 of m.debriefQs) if (!q2.showIf) answers[q2.id] = q2 === q ? o.value : q2.options?.[0]?.value;
          const r = debriefRecord(m, answers);
          checked += 1;
          if (r?.status !== 'skipped') wrong.push(`${m.id} / ${q.id} = ${o.value} -> ${r?.status}`);
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(wrong).toEqual([]);
  });

  it('"Need to create an account first" on a bureau freeze files as skipped', () => {
    for (const id of ['credit_freeze-fortify-equifax', 'credit_freeze-fortify-experian', 'credit_freeze-fortify-transunion']) {
      expect(debriefRecord(byId(id), { freeze_status: 'no-account-yet' }).status).toBe('skipped');
    }
  });

  it.each([
    ['people_search-recon-find-yourself', 'broker_recon', 'skip'],
    ['credit_freeze-fortify-equifax', 'freeze_status', 'skip'],
    ['sim_protection-fortify-pin', 'action', 'later'],
  ])('%s: %s = %s files as skipped', (id, qid, value) => {
    const m = byId(id);
    const q = m.debriefQs.find((x) => x.id === qid);
    expect(q.options.map((o) => o.value)).toContain(value);
    expect(debriefRecord(m, { [qid]: value }).status).toBe('skipped');
  });

  it('the broker recon options read as written', () => {
    const q = byId('people_search-recon-find-yourself').debriefQs[0];
    expect(q.options).toEqual([
      { value: 'not-found', text: "Couldn't find myself on these sites", severity: 'safe' },
      { value: 'found-some', text: 'Found my info on some of them', severity: 'warn' },
      { value: 'found-all', text: "I'm listed on all of them", severity: 'crit' },
      { value: 'skip', text: "I'll look later", severity: 'skip' },
    ]);
  });
});

// ── X1 ──────────────────────────────────────────────────────────────
function filedState(mission, record) {
  const s = createInitialState();
  s.accounts[mission.accountId] = { enabled: true };
  s.missions[mission.id] = { status: 'completed', ...record };
  return s;
}

describe("X1: the mission's own Scout line beats the district's breach lines", () => {
  it('gmail-recon-login "Confirmed unauthorized access" gives its own line, no breach wording', () => {
    const m = byId('gmail-recon-login');
    for (const r of [0, 0.5, 0.999]) {
      vi.spyOn(Math, 'random').mockReturnValue(r);
      const { line } = debriefReaction(filedState(m, { finding: '3plus-breaches' }), m);
      expect(line).toBe(m.scoutDialog.debrief['3plus-breaches']);
      expect(line).not.toMatch(/breach/i);
    }
  });

  it("an email breach check uses its own line first, and the district's breach line when it has none", () => {
    const m = byId('gmail-recon-breach');
    const own = debriefReaction(filedState(m, { finding: '3plus-breaches', password_exposed: 'yes' }), m).line;
    expect(own).toBe(m.scoutDialog.debrief['3plus-breaches']);
    const bare = { ...m, scoutDialog: { ...m.scoutDialog, debrief: {} } };
    const { line } = debriefReaction(filedState(bare, { finding: '3plus-breaches', password_exposed: 'yes' }), bare);
    expect(line).toMatch(/breach/i);
  });

  it("a non-email breach check with no line of its own never gets the district's breach line", () => {
    const m = byId('primary_bank-recon-breach');
    const bare = { ...m, scoutDialog: { ...m.scoutDialog, debrief: {} } };
    for (const finding of ['no-breaches', '1-2-breaches', '3plus-breaches']) {
      const { line } = debriefReaction(filedState(bare, { finding }), bare);
      expect(line).toBe('Report received. Good work, agent.');
    }
  });

  it('the password line still comes first', () => {
    const m = byId('gmail-recon-breach');
    const { line } = debriefReaction(filedState(m, { finding: '1-2-breaches', password_exposed: 'no' }), m);
    expect(line).toBe(PASSWORD_DIALOGUE.breachNoPassword);
  });

  it('no recon mission outside the email breach checks says "breach" unless its own copy does', () => {
    const recon = MISSIONS.filter((m) => m.phase === 'recon' && !isEmailBreachCheck(m));
    expect(recon.length).toBeGreaterThan(50);
    const bad = [];
    for (const m of recon) {
      const own = Object.values(m.scoutDialog?.debrief || {});
      for (const q of allQuestions(m)) {
        for (const o of q.options || []) {
          for (const r of [0, 0.5, 0.999]) {
            vi.spyOn(Math, 'random').mockReturnValue(r);
            const reaction = debriefReaction(filedState(m, { [q.id]: o.value }), m);
            vi.restoreAllMocks();
            if (!reaction) continue;
            if (/breach/i.test(reaction.line) && !own.includes(reaction.line)) {
              bad.push(`${m.id} / ${q.id}=${o.value}: ${reaction.line.slice(0, 60)}`);
            }
          }
        }
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  });
});

// ── X7 ──────────────────────────────────────────────────────────────
function completeAccount(state, accountId, reconId, finding) {
  let s = state;
  for (const m of getMissionsForAccount(accountId).filter(isCoreMission)) {
    s = updateMission(s, m.id, m.id === reconId ? { status: 'completed', finding } : { status: 'completed' });
  }
  return s;
}

describe('X7: breaches found and scarred buildings count only real breach findings', () => {
  const CLEAN = [
    ['car_toyota', 'car_toyota-recon-audit', 'no-sharing'], // "No data sharing enabled"
    ['ai_openai', 'ai_openai-recon', 'no-sharing'], // "AI training was already off"
    ['smart_tv', 'smart_tv-recon-acr', 'no-issues'], // "Everything was already locked down"
  ];

  it('clean car, AI and smart TV answers give 0 breaches found', () => {
    let s = createInitialState();
    for (const [, id, finding] of CLEAN) s = updateMission(s, id, { status: 'completed', finding });
    expect(calcFindings(s).breachesFound).toBe(0);
  });

  it.each(CLEAN)('%s with every mission done and a clean recon is not scarred', (acct, id, finding) => {
    const s = completeAccount(createInitialState(), acct, id, finding);
    expect(getBuildingState(s, acct)).toBe('liberated');
  });

  it('login and phishing answers are not breaches found', () => {
    let s = createInitialState();
    s = updateMission(s, 'gmail-recon-login', { status: 'completed', finding: '3plus-breaches' });
    s = updateMission(s, 'scam_defense-recon-phishing-eye', { status: 'completed', finding: '1-2-breaches' });
    expect(calcFindings(s).breachesFound).toBe(0);
  });

  it('the chapter-complete screen counts no breaches for clean smart-home answers', () => {
    let s = createInitialState();
    s = updateMission(s, 'smart_tv-recon-acr', { status: 'completed', finding: 'no-issues' });
    const html = renderMilestone(s, 'grid');
    const n = html.match(/color: var\(--amber\)[^>]*>(\d+)</);
    expect(n?.[1]).toBe('0');
  });

  it('a breach check with breaches still counts and scars', () => {
    let s = createInitialState();
    s = updateMission(s, 'gmail-recon-breach', { status: 'completed', finding: '1-2-breaches' });
    s = updateMission(s, 'outlook-recon-breach', { status: 'completed', finding: 'no-breaches' });
    expect(calcFindings(s).breachesFound).toBe(1);
    const scarred = completeAccount(createInitialState(), 'gmail', 'gmail-recon-breach', '3plus-breaches');
    expect(getBuildingState(scarred, 'gmail')).toBe('liberated-scarred');
  });
});

// ── literal ${name} ─────────────────────────────────────────────────
describe('mission copy has no unfilled template placeholders', () => {
  it('no string in any mission contains a literal "${"', () => {
    const hits = [];
    const scan = (v, path) => {
      if (typeof v === 'string') { if (v.includes('${')) hits.push(path); return; }
      if (v && typeof v === 'object') for (const k of Object.keys(v)) scan(v[k], `${path}.${k}`);
    };
    for (const m of MISSIONS) scan(m, m.id);
    expect(hits).toEqual([]);
  });

  it('the insurance scan names the car', () => {
    const m = byId('car_toyota-recon-insurance');
    expect(m.scoutDialog.debrief['no-sharing']).toContain('Toyota');
  });
});
