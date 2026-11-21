import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderNext, nextUp, barMission } from '../src/screens/next.js';
import { renderMilestone, cityBar } from '../src/screens/milestone.js';
import { renderBankNotesScreen } from '../src/components/bank-notes.js';
import { addBankNote } from '../src/utils/bank-notes.js';
import { fillBar, _resetFillBars } from '../src/components/fill-bar.js';
import {
  browserWarningHtml, initBrowserWarning, syncBrowserWarning, setBrowserStatus, onPageClick,
} from '../src/components/browser-warning.js';
import { createInitialState, updateMission } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';
import { MISSIONS, missionDistrict, getMissionsForDistrict } from '../src/data/missions.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';
import { calcChapterProgress } from '../src/utils/calc.js';
import { fileDebrief } from '../src/utils/debrief.js';

// Liz's layout audit of the core screens (2026-11-20), "go screen by screen and question the layout
// again, look at it from the simple perspective, and the advanced perspective".

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); _resetFillBars(); });

const strip = (html) => html.replace(/<style>[\s\S]*?<\/style>/g, '');
const primaries = (html) => (strip(html).match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []);
const fresh = (level = 'simplest') => setReadLevel(createInitialState(), level);
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

// The audit's mid-game save: Master Keys' Recon and Fortify filed (answers and all, so the password
// report flagged passwords to change), the Vault's Recon filed but Venmo's.
function midGame(level = 'simplest') {
  let s = fresh(level);
  for (const [id, a] of Object.entries(s.accounts)) {
    if (a.district === 'master-keys') a.enabled = ['gmail', 'google'].includes(id);
    if (a.district === 'vault') a.enabled = ['primary_bank', 'credit_card', 'venmo'].includes(id);
  }
  s = { ...s, passwordManager: 'apple' };
  const file = (m) => {
    const answers = {};
    for (const q of m.debriefQs || []) {
      if (q.showIf) continue;
      const opt = (q.options || []).find((o) => o.severity !== 'skip') || (q.options || [])[0];
      if (q.type === 'number') answers[q.id] = '0';
      else if (q.multi) answers[q.id] = opt ? [opt.value] : [];
      else if (opt) answers[q.id] = opt.value;
    }
    const r = fileDebrief(s, m, answers);
    s = r ? r.state : updateMission(s, m.id, { status: 'completed' });
  };
  for (const m of MISSIONS) {
    if (!isMissionInPlay(s, m)) continue;
    const d = missionDistrict(m);
    if ((d === 'master-keys' && m.phase !== 'reclaim') || (d === 'vault' && m.phase === 'recon' && m.accountId !== 'venmo')) file(m);
  }
  return s;
}

describe('What’s next: the bar counts the part the card’s mission is in', () => {
  it('the audit’s save: the card is a Fortify mission, so the bar is its part, not Part 1', () => {
    const state = midGame();
    const up = nextUp(state);
    expect(up?.mission).toBeTruthy();
    const district = missionDistrict(up.mission);
    const cardPart = calcChapterProgress(state, district, { missionId: up.mission.id });
    // Without the card's mission, the bar fell back to the first part with work left: they disagreed.
    expect(calcChapterProgress(state, district).chapter).not.toBe(cardPart.chapter);
    const html = renderNext(state);
    expect(html).toContain(`data-chapter="${cardPart.chapter}"`);
    expect(html).toContain(cardPart.name);
  });

  it('right after a report, the bar is the report’s part', () => {
    const state = midGame();
    const filed = getMissionsForDistrict('vault').find((m) => m.phase === 'recon' && state.missions[m.id]?.status);
    expect(barMission(state, { id: filed.id }, nextUp(state))).toBe(filed.id);
    expect(barMission(state, null, nextUp(state))).toBe(nextUp(state).mission.id);
    expect(barMission(state, null, null)).toBeNull();
  });
});

describe('an empty bar doesn’t look started', () => {
  it('nothing done: is-empty (no fill drawn); something done: not', () => {
    expect(fillBar({ key: 'a', done: 0, total: 5 })).toMatch(/class="fill-bar [^"]*\bis-empty\b/);
    expect(fillBar({ key: 'b', done: 1, total: 5 })).not.toContain('is-empty');
  });
  it('the “you are here” segment is an outline, not a fill', () => {
    const rule = css.match(/\.fill-bar\.has-segs:not\(\.is-full\)::before \{[^}]*\}/)[0];
    expect(rule).toMatch(/border: 2px solid/);
    expect(rule).toMatch(/background: transparent/);
    expect(css).toMatch(/\.fill-bar\.is-empty \.fill-bar-fill \{ display: none; \}/);
  });
});

describe('the milestone', () => {
  it('Simple: the city’s bar, not “6% CITY INTEGRITY”, beside LIBERATED', () => {
    const html = renderMilestone(midGame('simplest'), 'master-keys');
    expect(html).toContain('data-city-bar');
    expect(html).not.toContain('CITY INTEGRITY');
    expect(cityBar(midGame())).toMatch(/1 of \d+ districts taken back/);
  });
  it('Advanced keeps CITY INTEGRITY', () => {
    const html = renderMilestone(midGame('full'), 'master-keys');
    expect(html).toContain('CITY INTEGRITY');
    expect(html).not.toContain('data-city-bar');
  });
  it('the page’s own gutter (not 40px), and the two buttons come before the share card’s frame', () => {
    for (const level of ['simplest', 'full']) {
      const html = renderMilestone(midGame(level), 'master-keys');
      expect(html).not.toMatch(/padding: 0 40px/);
      expect(html.indexOf('data-action="share-card"')).toBeLessThan(html.indexOf('milestone-card-preview'));
      expect(html.indexOf('milestone-stats')).toBeLessThan(html.indexOf('data-action="share-card"'));
      expect(primaries(html)).toHaveLength(1);
    }
  });
  it('the share card is drawn as the screen opens (app.js), not left an empty frame', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app).toMatch(/if \(route\.screen === 'milestone'\) drawMilestonePreview\(route\.params\.districtId\);/);
  });
});

describe('#/vault/banks', () => {
  const from = 'primary_bank-fortify-password';
  it('nothing saved: the form first, and no empty SAVED · 0', () => {
    const html = renderBankNotesScreen(midGame(), { from });
    expect(html).not.toContain('SAVED · 0');
    expect(html).not.toContain('data-bank-saved');
    expect(html).toContain('Nothing saved yet. Add each bank, card, brokerage or exchange you log in to.');
    expect(html.indexOf('data-bank-note-form')).toBeGreaterThan(-1);
  });
  it('labels are off-white sentence case, not cyan capitals', () => {
    const html = renderBankNotesScreen(midGame(), { from });
    expect(html).toContain('>Bank, card or app');
    expect(html).toContain('>Login page <span');
    expect(html).toContain('>Password-reset page <span');
    expect(html).not.toMatch(/BANK, CARD OR APP|LOGIN PAGE|PASSWORD-RESET PAGE/);
    expect(html).not.toMatch(/<label style="[^"]*rgba\(0,229,255/);
  });
  it('after a save, ← BACK TO the mission is the one bright button', () => {
    const { state } = addBankNote(midGame(), { name: 'Chase', loginUrl: 'chase.com', resetUrl: '' });
    const before = renderBankNotesScreen(state, { from });
    expect(primaries(before)).toEqual(['class="btn-primary bank-note-save"']);
    const after = renderBankNotesScreen(state, { from, saved: true });
    expect(primaries(after)).toHaveLength(1);
    expect(after).toMatch(/<a class="btn-primary" data-bank-back[^>]*>← BACK TO SECURE LOGIN: PRIMARY BANK<\/a>/);
    expect(after).toContain('class="btn-secondary bank-note-save"');
    expect(after).toContain('data-bank-saved');
    // Editing a note: SAVE CHANGES is the next thing again.
    const editing = renderBankNotesScreen(state, { from, saved: true, editId: state.bankNotes[0].id });
    expect(primaries(editing)).toEqual(['class="btn-primary bank-note-save"']);
  });
});

describe('the browser warning bar', () => {
  const ig = { kind: 'in-app', app: { id: 'instagram', name: 'instagram' }, platform: 'ios' };

  it('“How to fix” is an amber outline, so the screen keeps one filled button', () => {
    const rules = [...css.matchAll(/(?:^|\n)\.bw-more \{([^}]*)\}/g)].map((m) => m[1]);
    const last = rules[rules.length - 1];
    expect(last).toMatch(/background: transparent/);
    expect(last).toMatch(/border: 1px solid var\(--amber\)/);
    expect(primaries(browserWarningHtml(ig, { simple: true }))).toHaveLength(0);
  });

  it('on a mission’s steps: one short line that still says the progress won’t save (7.31.0)', () => {
    const html = browserWarningHtml(ig, { simple: true, compact: true });
    expect(html).toContain('bw--compact');
    expect(html).toContain('<p class="bw-title" title="Instagram’s browser won’t save your progress.">Progress won’t save.</p>');
    expect(html).toContain('data-bw="open"');
    expect(browserWarningHtml({ ...ig, kind: 'private' }, { compact: true })).toContain('won’t save');
    // Elsewhere the slim bar is as before.
    expect(browserWarningHtml(ig, { simple: true })).not.toContain('bw--compact');
    expect(css).toMatch(/\.bw--compact \.bw-title \{[^}]*white-space: nowrap/);
  });

  describe('opened, a tap anywhere else on the page folds it back', () => {
    let page;
    beforeEach(() => {
      const listeners = {};
      const docListeners = {};
      const host = {
        id: '', innerHTML: '', isConnected: true,
        addEventListener: (t, fn) => { listeners[t] = fn; },
        querySelector: () => null,
        contains: (el) => el === inside,
      };
      const inside = { closest: () => ({ dataset: { bw: 'open' } }) };
      const app = { parentNode: { insertBefore: () => {} }, focus() {} };
      vi.stubGlobal('document', {
        getElementById: (id) => (id === 'app' ? app : null),
        createElement: () => host,
        addEventListener: (t, fn) => { docListeners[t] = fn; },
      });
      vi.stubGlobal('location', { origin: 'https://play.multiversegames.ai', pathname: '/reclaim-city/' });
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 329.0.3.23.103' });
      setBrowserStatus({});
      initBrowserWarning();
      page = { host, inside, open: () => listeners.click({ target: inside }), docClick: (target) => docListeners.click({ target }) };
    });
    afterEach(() => { vi.unstubAllGlobals(); setBrowserStatus({}); });

    it('folds back on a tap outside it, and not on a tap inside it', () => {
      syncBrowserWarning({ start: false, simple: true });
      expect(page.host.innerHTML).toContain('bw--slim');
      page.open();
      expect(page.host.innerHTML).toContain('bw--full');
      page.docClick(page.inside);
      expect(page.host.innerHTML).toContain('bw--full');
      page.docClick({ closest: () => null });
      expect(page.host.innerHTML).toContain('bw--slim');
      expect(page.host.innerHTML).not.toContain('bw--full');
    });

    it('the start page keeps it whole', () => {
      syncBrowserWarning({ start: true, simple: true });
      onPageClick({ target: {} });
      expect(page.host.innerHTML).toContain('bw--full');
    });
  });
});

describe('taps of at least 44px on the core screens', () => {
  it('district tabs, ← CITY, the mission rows’ and Next up’s START, the city’s place buttons, the passwords chips', () => {
    const block = css.slice(css.indexOf('Layout audit (Liz 2026-11-20)'));
    for (const sel of ['.district-tab', '.district-back', '.next-up-go', '.mission-row .btn-sm', '.city-btn', '.pm-chip']) {
      const rule = block.split('\n').find((l) => l.includes(sel) && l.includes('{'));
      expect(rule, sel).toMatch(/min-height: 44px/);
    }
  });
});
