// Breaker for recon campaign Phase 3 (git diff 8780bcd..HEAD). Each test names
// the promise it pins (P1 = X4, P2 = URLs and corrected facts, P3 = new
// question ids, P4 = car report, P5 = follow-up hiding, P6 = phone width). A
// test marked FAILS describes behaviour the breaker believes is wrong; the
// comment above it says why.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISSIONS } from '../../src/data/missions.js';
import { ACCOUNTS } from '../../src/data/accounts.js';
import { createInitialState, updateMission } from '../../src/state.js';
import { fileDebrief, missionEventData, visibleQuestions, debriefRecord } from '../../src/utils/debrief.js';
import { calcFindings, calcDistrictProgress } from '../../src/utils/calc.js';
import { isMissionInPlay } from '../../src/utils/mission-status.js';
import { restoreEvents } from '../../src/utils/restore.js';
import { migrateBrokenAnswers } from '../../src/utils/migrate-answers.js';
import { passwordResetNeed, resetNeedSources, notNeededReasons, reopenStaleNotNeeded } from '../../src/utils/password-need.js';
import { yourPart } from '../../src/utils/collective.js';
import { renderDebrief } from '../../src/screens/debrief.js';
import { renderBriefing } from '../../src/screens/briefing.js';
import { renderDistrict } from '../../src/screens/district.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const byId = (id) => MISSIONS.find((m) => m.id === id);
const s0 = createInitialState();
const set = (s, id, rec) => updateMission(s, id, rec);
const done = (s, id, fields = {}) => updateMission(s, id, { status: 'completed', ...fields });
function allOn() {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: true } } };
  return s;
}
function only(ids) {
  let s = createInitialState();
  for (const id of Object.keys(s.accounts)) s = { ...s, accounts: { ...s.accounts, [id]: { ...s.accounts[id], enabled: ids.includes(id) } } };
  return s;
}
const SENT = new Set(['mission', 'district', 'finding', 'phase', 'status', 'password_exposed', 'method', 'same_address']);
const PAIRS = [['google', 'gmail'], ['apple_id', 'icloud'], ['microsoft', 'outlook']];

describe('P1 pair edges', () => {
  it.each(PAIRS)('%s "same" with the partner not enabled or never checked is unknown, not an error', (acct, partner) => {
    let s = only([acct]);
    s = done(s, `${acct}-recon-breach`, { same_address: `same-as-${partner}` });
    expect(passwordResetNeed(s, acct)).toBe('unknown');
    expect(notNeededReasons(s, acct)).toEqual([]);
    expect(() => renderBriefing(s, `${acct}-fortify-password`)).not.toThrow();
    expect(() => renderDistrict(s, 'master-keys', 'recon')).not.toThrow();
  });

  it.each(PAIRS)('%s "same" with the partner SKIPPED (not done) gives the partner no say', (acct, partner) => {
    let s = done(allOn(), `${acct}-recon-breach`, { same_address: `same-as-${partner}` });
    s = set(s, `${partner}-recon-breach`, { status: 'skipped', finding: 'skip' });
    expect(passwordResetNeed(s, acct)).toBe('unknown');
    s = set(s, `${partner}-recon-breach`, { status: 'skipped', finding: '3plus-breaches', password_exposed: 'yes' });
    expect(resetNeedSources(s, acct)).toEqual([]);
  });

  it.each(PAIRS)('%s "same" with the partner clean, then breached later: a filed not-needed reset reopens', (acct, partner) => {
    const m = byId(`${partner}-recon-breach`);
    let s = done(allOn(), `${acct}-recon-breach`, { same_address: `same-as-${partner}` });
    s = fileDebrief(s, m, { finding: 'no-breaches' }).state;
    expect(passwordResetNeed(s, acct)).toBe('not-needed');
    s = set(s, `${acct}-fortify-password`, { status: 'not-needed' });
    const again = fileDebrief(s, m, { finding: '3plus-breaches', password_exposed: 'yes' });
    expect(passwordResetNeed(again.state, acct)).toBe('needed');
    expect(again.state.missions[`${acct}-fortify-password`].status).toBeUndefined();
    expect(again.state.missions[`${acct}-fortify-password`].reopened).toEqual(['breach']);
    expect(reopenStaleNotNeeded(again.state)).toEqual(again.state);
  });

  it.each(PAIRS)('%s switching different -> same -> different leaves no stale finding or password answer', (acct, partner) => {
    const m = byId(`${acct}-recon-breach`);
    let s = fileDebrief(allOn(), m, { same_address: 'different-address', finding: '3plus-breaches', password_exposed: 'yes' }).state;
    expect(s.missions[m.id].finding).toBe('3plus-breaches');
    s = fileDebrief(s, m, { same_address: `same-as-${partner}`, finding: '3plus-breaches', password_exposed: 'yes' }).state;
    const r = s.missions[m.id];
    expect(r.finding).toBeUndefined();
    expect(r.password_exposed).toBeUndefined();
    expect(calcFindings(s).breachesFound).toBe(0);
    expect(passwordResetNeed(s, acct)).toBe('unknown');
    s = fileDebrief(s, m, { same_address: 'different-address', finding: 'no-breaches' }).state;
    expect(s.missions[m.id].same_address).toBe('different-address');
    expect(passwordResetNeed(s, acct)).toBe('not-needed');
    const ev = restoreEvents(s).find((e) => e.data.mission === m.id).data;
    expect(ev.same_address).toBe('different-address');
    expect(ev.finding).toBe('no-breaches');
  });

  it.each(PAIRS)('%s "skip" on same_address files skipped, sends no finding, and is not read as "same"', (acct) => {
    const m = byId(`${acct}-recon-breach`);
    const r = debriefRecord(m, { same_address: 'skip' });
    expect(r.status).toBe('skipped');
    expect(r.record.finding).toBeUndefined();
    const s = set(allOn(), m.id, r.record);
    expect(passwordResetNeed(s, acct)).toBe('unknown');
  });

  it.each(PAIRS)('%s restore resends exactly the tracked keys for same, different and old-save records', (acct, partner) => {
    let s = done(allOn(), `${acct}-recon-breach`, { same_address: `same-as-${partner}`, finding: '3plus-breaches' });
    s = done(s, `${acct}-recon-login`, { same_address: 'different-address', finding: '1-2-breaches' });
    for (const e of restoreEvents(s)) for (const k of Object.keys(e.data)) expect(SENT.has(k) || k === 'restored', k).toBe(true);
  });

  // FAILS (P1): "Same" files a Google/Apple ID/Microsoft check with no finding,
  // and the password need then follows the partner's breach, so the game
  // shows a Password Reset mission on this account. build.sql counts the
  // address as fixed when EITHER account of the pair is reset ("Fixed by
  // either account of a pair"). But Your Part ("found / fixed") looks only at
  // the partner's own reset. A player who finds the breach on Gmail and does
  // the Google reset the game asks for is told "1 found, 0 fixed" while the
  // published figure counts the address fixed.
  it.each(PAIRS)('%s Your Part counts the breached address fixed when the same-address account was reset', (acct, partner) => {
    let s = done(allOn(), `${partner}-recon-breach`, { finding: '3plus-breaches', password_exposed: 'yes' });
    s = done(s, `${acct}-recon-breach`, { same_address: `same-as-${partner}` });
    expect(resetNeedSources(s, acct)).toEqual(['breach']);
    s = done(s, `${acct}-fortify-password`, { action: 'reset-password' });
    expect(yourPart(s)).toEqual({ found: 1, fixed: 1 });
  });

  // FAILS (P1): an old save that checked both accounts of a pair holds two
  // breach findings for one address. build.sql counts one address per
  // pair; Stats is labelled "ADDRESSES IN A BREACH" and calcFindings counts
  // both, so Stats and the published figure disagree about the same player
  // (and Your Part reports found: 2). "build.sql counts a pair as one address
  // unless the latest answer is different" should hold on the Stats side too.
  it.each(PAIRS)('%s an old save with both checks breached counts one address on Stats', (acct, partner) => {
    let s = done(allOn(), `${partner}-recon-breach`, { finding: '3plus-breaches', password_exposed: 'yes' });
    s = done(s, `${acct}-recon-breach`, { finding: '3plus-breaches', password_exposed: 'yes' });
    expect(calcFindings(s).breachesFound).toBe(1);
  });

  it.each(PAIRS)('%s a "different" second address that is breached counts on its own on Stats', (acct, partner) => {
    let s = done(allOn(), `${partner}-recon-breach`, { finding: '3plus-breaches', password_exposed: 'yes' });
    s = done(s, `${acct}-recon-breach`, { same_address: 'different-address', finding: '3plus-breaches', password_exposed: 'yes' });
    expect(calcFindings(s).breachesFound).toBe(2);
    expect(yourPart(s).found).toBe(2);
  });

  it('the login check of a pair prefills "same" only from a usable breach answer', () => {
    const login = byId('google-recon-login');
    const q = login.debriefQs[0];
    const html = renderDebrief(done(s0, 'google-recon-breach', { same_address: 'skip' }), 'google-recon-login');
    expect(html).not.toContain(`data-prefilled="${q.id}"`);
  });
});

describe('P5 follow-up hiding', () => {
  const chain = (extra = {}) => ({
    debriefQs: [
      { id: 'a', options: [{ value: 'x' }, { value: 'y' }] },
      { id: 'b', showIf: { question: 'a', values: ['x'] }, options: [{ value: 'p' }, { value: 'q' }] },
      { id: 'c', showIf: { question: 'b', values: ['p'] }, options: [{ value: 'm' }] },
      { id: 'd', showIf: { question: 'c', notValues: ['zzz'] }, options: [{ value: 'n' }] },
      ...(extra.qs || []),
    ],
  });

  it('three levels deep: hiding the root hides every descendant, whatever stale answers are left', () => {
    const answers = { a: 'y', b: 'p', c: 'm', d: 'n' };
    expect(visibleQuestions(chain(), answers).map((q) => q.id)).toEqual(['a']);
    expect(visibleQuestions(chain(), { ...answers, a: 'x' }).map((q) => q.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(visibleQuestions(chain(), { ...answers, a: 'x', b: 'q' }).map((q) => q.id)).toEqual(['a', 'b']);
  });

  it('a stale answer to a hidden follow-up is not required to file, and is not stored', () => {
    const m = { id: 'fake', phase: 'recon', ...chain() };
    const r = debriefRecord(m, { a: 'y', b: 'p', c: 'm', d: 'n' });
    expect(r.record.b).toBeUndefined();
    expect(r.record.c).toBeUndefined();
    expect(r.record.d).toBeUndefined();
  });

  it('a follow-up whose parent is missing from the mission never shows', () => {
    const m = { debriefQs: [{ id: 'a', options: [] }, { id: 'z', showIf: { question: 'ghost', notValues: ['q'] }, options: [] }] };
    expect(visibleQuestions(m, { a: 'x', z: 'v' }).map((q) => q.id)).toEqual(['a']);
  });

  it('every real follow-up names a parent that comes earlier in the same mission', () => {
    for (const m of MISSIONS) {
      const seen = new Set();
      for (const q of m.debriefQs || []) {
        if (q.showIf) expect(seen.has(q.showIf.question), `${m.id}.${q.id}`).toBe(true);
        seen.add(q.id);
      }
    }
  });

  it('every real two-level follow-up is hidden when its parent is hidden, whatever stale answers remain', () => {
    let checked = 0;
    for (const m of MISSIONS) {
      const qs = m.debriefQs || [];
      for (const q of qs.filter((x) => x.showIf)) {
        const parent = qs.find((x) => x.id === q.showIf.question);
        if (!parent?.showIf) continue;
        const stale = {};
        for (const x of qs) stale[x.id] = x.showIf?.values?.[0] ?? x.options?.[0]?.value ?? '0';
        const grand = parent.showIf;
        stale[grand.question] = grand.values ? '__none__' : grand.notValues[0];
        expect(visibleQuestions(m, stale).map((x) => x.id), `${m.id}: ${q.id}`).not.toContain(q.id);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('a pre-filled "different" opens the follow-up, a pre-filled "same" keeps it hidden, in the rendered form', () => {
    const diff = done(s0, 'microsoft-recon-breach', { same_address: 'different-address', finding: 'no-breaches' });
    const same = done(s0, 'microsoft-recon-breach', { same_address: 'same-as-outlook' });
    const grp = (html) => html.match(/<div data-question="finding"[^>]*>/)[0];
    expect(grp(renderDebrief(diff, 'microsoft-recon-login'))).not.toMatch(/\shidden(\s|>)/);
    expect(grp(renderDebrief(same, 'microsoft-recon-login'))).toMatch(/\shidden(\s|>)/);
  });
});

describe('P3 new question ids: file, reopen, restore, old saves', () => {
  const live = MISSIONS.filter((m) => !m.legacy);

  function defaults(m) {
    const a = {};
    for (const q of m.debriefQs) {
      if (q.type === 'number') a[q.id] = String(q.min ?? 0);
      else if (q.multi) a[q.id] = [q.options[0].value];
      else a[q.id] = q.options?.find((o) => o.severity !== 'skip')?.value ?? q.options?.[0]?.value;
    }
    return a;
  }

  it('every answer of every question files, reopens with a readable answer, and restores with only tracked keys', () => {
    const bad = [];
    for (const m of live) {
      if (m.debriefQs.some((q) => q.kind === 'two-factor') || m.id.includes('burst')) continue;
      for (const q of m.debriefQs) {
        for (const o of q.options || []) {
          const answers = { ...defaults(m), [q.id]: q.multi ? [o.value] : o.value };
          const f = fileDebrief(allOn(), m, answers);
          if (!f) continue;
          const st = f.state;
          if (st.missions[m.id]?.status !== 'completed') continue;
          const html = renderDebrief(st, m.id);
          if (/undefined|\[object|NaN/.test(html.replace(/<style[\s\S]*?<\/style>/g, ''))) bad.push(`${m.id}/${q.id}=${o.value}: render shows undefined`);
          const ev = restoreEvents(st).find((e) => e.data.mission === m.id);
          if (ev) for (const k of Object.keys(ev.data)) if (!SENT.has(k) && k !== 'restored') bad.push(`${m.id}: restore sends ${k}`);
          const evl = missionEventData(m, st.missions[m.id]);
          for (const k of Object.keys(evl)) if (!SENT.has(k)) bad.push(`${m.id}: live sends ${k}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('an old save under a replaced question id shows its old answer, for every legacy option', () => {
    const bad = [];
    for (const m of live) {
      for (const q of m.debriefQs.filter((x) => x.legacy)) {
        for (const o of q.legacy.options || []) {
          const st = done(allOn(), m.id, { [q.legacy.id]: o.value });
          const html = renderDebrief(st, m.id);
          const text = o.text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
          if (!html.includes(text) && !html.includes(o.text)) bad.push(`${m.id}: old ${q.legacy.id}=${o.value} not shown`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('the broken-answer migration still finds a replaced question’s old answer and keeps the filed status', () => {
    const bad = [];
    for (const m of live) {
      for (const q of m.debriefQs.filter((x) => x.legacy)) {
        const skipOpt = (q.legacy.options || []).find((o) => o.severity === 'skip' || o.value === 'skip' || o.value === 'later');
        if (!skipOpt) continue;
        const broken = `${skipOpt.value}', text: 'x', severity: 'skip`;
        const st = { missions: { [m.id]: { status: 'completed', [q.legacy.id]: broken } } };
        const out = migrateBrokenAnswers(st).missions[m.id];
        if (out[q.legacy.id] !== skipOpt.value) bad.push(`${m.id}: not cleaned`);
        // Ruling (Phase 3 re-review 4): the filed status is kept.
        if (out.status !== 'completed') bad.push(`${m.id}: filed status not kept`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('an old save with BOTH the old key and a new id keeps the new one and refiling clears both', () => {
    const m = byId('car_general-recon-vin');
    const q = m.debriefQs[0];
    const st = done(allOn(), m.id, { [q.legacy.id]: q.legacy.options[0].value, [q.id]: 'collects-little' });
    expect(renderDebrief(st, m.id)).toContain('Collects little');
    const f = fileDebrief(st, m, { [q.id]: 'collects-location' }).state.missions[m.id];
    expect(f[q.legacy.id]).toBeUndefined();
    expect(f[q.id]).toBe('collects-location');
  });

  it('no new answer other than same_address reaches a tracked event', () => {
    for (const m of live) {
      const rec = { status: 'completed', action: 'x', pw_status: 'pw-clean', activity: 'activity-clean', vehicle_label: 'collects-little',
        apps_audit: 'a', shares_audit: 'b', report_requests: 'c', ad_profile: 'd', audit_status: 'e', same_address: 'different-address' };
      for (const k of Object.keys(missionEventData(m, rec))) expect(SENT.has(k), `${m.id}.${k}`).toBe(true);
    }
  });
});

describe('P4 car privacy report', () => {
  const m = byId('car_general-recon-vin');
  const CARS = Object.keys(ACCOUNTS).filter((id) => /^car_(?!broker)/.test(id));

  it('zero cars: not in play, not in the district count, not in the list', () => {
    const s = only([]);
    expect(isMissionInPlay(s, m)).toBe(false);
    const html = renderDistrict(s, 'freeway', 'recon');
    expect(html).not.toContain('Vehicle Privacy Report');
  });

  // Ruling (Phase 3 reviewer C1): the report is a bonus that counts once
  // done, so it adds to the bonus count, not the core total.
  it.each(CARS)('%s alone puts the report in play, in the district list and in the bonus count', (car) => {
    const s = only([car]);
    expect(isMissionInPlay(s, m)).toBe(true);
    expect(renderDistrict(s, 'freeway', 'recon')).toContain('Vehicle Privacy Report');
    const none = calcDistrictProgress(only([]), 'freeway');
    expect(calcDistrictProgress(s, 'freeway').bonusTotal).toBeGreaterThan(none.bonusTotal);
  });

  it('a data broker account is not a car', () => {
    const s = only(['car_broker_lexisnexis', 'car_broker_verisk']);
    expect(isMissionInPlay(s, m)).toBe(false);
  });

  it('two cars show the report once', () => {
    const html = renderDistrict(only(['car_gm', 'car_vw']), 'freeway', 'recon');
    expect(html.split('Vehicle Privacy Report').length - 1).toBe(1);
  });

  it('a car removed after the report was filed keeps the record and restores it', () => {
    let s = done(only(['car_ford']), m.id, { vehicle_label: 'shares-or-sells' });
    s = { ...s, accounts: { ...s.accounts, car_ford: { ...s.accounts.car_ford, enabled: false } } };
    expect(isMissionInPlay(s, m)).toBe(false);
    expect(s.missions[m.id].vehicle_label).toBe('shares-or-sells');
    expect(restoreEvents(s).some((e) => e.data.mission === m.id)).toBe(true);
    expect(() => calcDistrictProgress(s, 'freeway')).not.toThrow();
  });

  it('the report is reachable: briefing and debrief render with no account', () => {
    const s = only(['car_gm']);
    expect(renderBriefing(s, m.id)).toContain('Vehicle Privacy Report');
    expect(renderDebrief(s, m.id)).toContain('WHAT DOES THE LABEL SAY');
  });
});

describe('P2 corrected facts and links', () => {
  const fixture = JSON.parse(readFileSync(new URL('../fixtures/verified-urls.json', import.meta.url), 'utf8'));

  // FAILS (P2): the URL allowlist test reads only step.url. Two step texts
  // (device_security-fortify-phone) still send the player to icloud.com/find
  // and google.com/android/find by name; neither was fetched or put in
  // verified-urls.json. "Every step URL in MISSIONS is in
  // tests/fixtures/verified-urls.json" does not hold for a link written in the
  // step text.
  it('every address written inside a step text is also in the verified list', () => {
    const known = Object.keys(fixture.urls).map((u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase());
    const bad = [];
    const walk = (o, id) => {
      if (Array.isArray(o)) return o.forEach((x) => walk(x, id));
      if (!o || typeof o !== 'object') return;
      if (typeof o.text === 'string' && !o.url) {
        // a placeholder workspace name is not a link
        o = { ...o, text: o.text.replace(/your-workspace\.slack\.com\/[a-z/]+/gi, '') };
        for (const hit of o.text.match(/\b(?:[a-z0-9-]+\.)+(?:com|org|gov|net|io|me)\/[a-z0-9\-_/.?=]+/gi) || []) {
          const h = hit.replace(/\/$/, '').toLowerCase();
          if (!known.some((k) => k === h || k.endsWith(`.${h}`) || k.endsWith(`/${h}`))) bad.push(`${id}: ${hit}`);
        }
      }
      Object.values(o).forEach((x) => walk(x, id));
    };
    for (const m of MISSIONS) walk([m.steps, m.stepsByManager, m.reportSteps], m.id);
    expect(bad).toEqual([]);
  });

  // FAILS (P2): audit #30 says "It goes through Login.gov" is false for
  // StudentAid.gov (it is an FSA ID account). Phase 3 fixed
  // student_loans-recon-claim but student_loans-fortify-password still tells
  // the player, in its briefing, a step and three Scout lines, that StudentAid.gov
  // goes through Login.gov and "shares the same identity provider" with SSA.
  it('no mission still says StudentAid.gov goes through Login.gov', () => {
    const hits = [];
    for (const m of MISSIONS) {
      if (m.accountId !== 'student_loans') continue;
      const txt = JSON.stringify([m.briefing, m.steps, m.scoutDialog]);
      if (/StudentAid\.gov goes through Login\.gov|same identity provider|Login\.gov chain|Check if Login\.gov 2FA carried over/i.test(txt)) hits.push(m.id);
    }
    expect(hits).toEqual([]);
  });

  it('stale facts the audit named are gone from live missions', () => {
    const live = MISSIONS.filter((m) => !m.legacy);
    const text = (m) => JSON.stringify(m);
    const stale = [
      [/\$\{[a-z]+\}/i, 'literal ${name}'],
      [/Amazon bought iRobot|Amazon.{0,20}acquir/i, 'Amazon bought iRobot'],
      [/Gemini Apps Activity/i, 'Gemini Apps Activity'],
      [/Help improve Amazon services/i, 'Help improve Amazon services'],
      [/Chtrbox/i, 'Chtrbox'],
      [/about to be sold|highest bidder/i, '23andMe about to be sold'],
      [/Natural Cycles[^"]{0,120}advertisers/i, 'Natural Cycles shares with advertisers'],
      [/fitbit\.com\/settings/i, 'fitbit.com/settings'],
      [/\\"undefined\\"|>undefined</, 'undefined text'],
      [/privacynotincluded|Mozilla car/i, 'Mozilla car guide'],
    ];
    const bad = [];
    for (const m of live) for (const [re, label] of stale) if (re.test(text(m))) bad.push(`${m.id}: ${label}`);
    expect(bad).toEqual([]);
  });

  it('GM Smart Driver and Honda Driver Feedback are only ever described as ended', () => {
    const bad = [];
    for (const m of MISSIONS.filter((x) => !x.legacy && /^car_(gm|honda)/.test(x.id))) {
      const t = JSON.stringify([m.title, m.briefing, m.steps, m.scoutDialog]);
      if (/(Smart Driver|Driver Feedback)/.test(t) && !/ended|gone|discontinued|left of/i.test(t)) bad.push(m.id);
    }
    expect(bad).toEqual([]);
  });

  it('Subaru STARLINK and VW Car-Net are never called insurance programs', () => {
    for (const m of MISSIONS.filter((x) => !x.legacy && /^car_(subaru|vw)/.test(x.id))) {
      const t = JSON.stringify([m.title, m.briefing, m.steps, m.scoutDialog]);
      expect(t, m.id).not.toMatch(/Car-Net[^"]{0,60}insurance program(?! is)|(?<!not an )insurance program[^"]{0,40}(STARLINK|Car-Net)/i);
    }
  });
});

describe('P6 phone width (rendered markup)', () => {
  // Rendered markup cannot prove layout, but a fixed width over 360px or a
  // nowrap on text is the usual cause of sideways scroll.
  it('no screen sets a fixed pixel width wider than 360 or white-space: nowrap on a text block', () => {
    let s = allOn();
    const screens = [];
    for (const m of MISSIONS.filter((x) => !x.legacy)) {
      screens.push([m.id + ' briefing', () => renderBriefing(s, m.id)], [m.id + ' debrief', () => renderDebrief(s, m.id)]);
    }
    const bad = [];
    for (const [name, fn] of screens) {
      const html = fn();
      for (const mm of html.matchAll(/(?:min-)?width:\s*(\d{3,4})px/g)) if (Number(mm[1]) > 360 && !/max-width/.test(html.slice(Math.max(0, mm.index - 4), mm.index))) bad.push(`${name}: width ${mm[1]}px`);
      if (/white-space:\s*nowrap/.test(html)) bad.push(`${name}: nowrap`);
    }
    expect([...new Set(bad)]).toEqual([]);
  });
});
