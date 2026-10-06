import { describe, it, expect, beforeEach } from 'vitest';
import { renderGhostEarly, renderGhostDone } from '../src/screens/ghost.js';
import { renderCityTogether } from '../src/screens/city-together.js';
import { renderStats } from '../src/screens/stats.js';
import { markGoneGhost, GHOST_KEY } from '../src/utils/ghost.js';
import { setAnalyticsOff, setOptedOutAt } from '../src/utils/analytics-pref.js';
import { COLLECTIVE_DIALOGUE, GHOST_DIALOGUE } from '../src/data/dialogue.js';
import { createInitialState } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { isCoreMission } from '../src/utils/calc.js';
import { parseRoute } from '../src/router.js';
import { shouldAutoLoad } from '../src/utils/collective.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function completeCity() {
  const s = createInitialState();
  for (const m of MISSIONS) {
    if (isCoreMission(m) && s.accounts[m.accountId]?.enabled) s.missions[m.id] = { status: 'completed' };
  }
  return s;
}

const AT = '2026-10-06T10:00:00Z';
const mk = (asOf, ghosts = 311) => ({ status: 'ready', data: { asOf, city: { ghosts }, pods: [{ id: 'us-il-chicago', label: 'Chicago', ghosts: 12 }] } });
const BEFORE = mk('2026-10-06T03:00:00Z');
const AFTER = mk('2026-10-07T03:00:00Z');
const earlyGhost = (at = AT) => localStorage.setItem(GHOST_KEY, JSON.stringify({ at, silent: false, early: true }));

const txt = (h) => h.replaceAll('&#39;', "'");
const EXPLAINER_START = "Here's how we know any of this.";
const PENDING = "Your ghost is pending until tonight's run. Changed your mind?";

beforeEach(() => { globalThis.localStorage = memoryStorage(); setAnalyticsOff(false); });

describe('The Whole City: Scout explainer', () => {
  it('copy is verbatim', () => {
    expect(COLLECTIVE_DIALOGUE.explainer).toBe("Here's how we know any of this. While you play, the game tells our own server — not an ad company, ours — what you do here: which missions you start and finish, the answers you pick in each debrief (like what a breach check found, whether it included a password, or how an account is protected), which accounts you said you have, and the place your internet connection points to. Never your passwords, never what's inside your accounts. Every night we add everyone up, and a place only shows up once it has at least 50 players, so nobody can be picked out. Turn sharing off and that night we delete what this browser sent us this month from your connection. Want to see exactly what we can see about you? It's on Your City.");
  });
  for (const [name, collective] of [['ready', AFTER], ['loading', { status: 'loading' }], ['error', { status: 'error' }]]) {
    it(`shows in the ${name} state with a link to Your City`, () => {
      const html = txt(renderCityTogether(createInitialState(), { collective }));
      expect(html).toContain(EXPLAINER_START);
      expect(html).toContain('WHAT WE KNOW ABOUT YOU');
      expect(html).toContain('href="#/stats"');
    });
  }
});

describe('The Whole City: GO GHOST', () => {
  for (const [name, collective] of [['ready', AFTER], ['loading', { status: 'loading' }], ['error', { status: 'error' }]]) {
    it(`incomplete city links to the early ghost (${name})`, () => {
      const html = txt(renderCityTogether(createInitialState(), { collective }));
      expect(html).toMatch(/href="#\/ghost\/early"[^>]*>GO GHOST</);
    });
  }
  it('complete city links to the final mission', () => {
    const html = txt(renderCityTogether(completeCity(), { collective: AFTER }));
    expect(html).toMatch(/href="#\/ghost"[^>]*>GO GHOST</);
    expect(html).not.toContain('#/ghost/early');
  });
  it('pending early ghost shows the cancel block instead', () => {
    earlyGhost();
    const html = txt(renderCityTogether(createInitialState(), { collective: BEFORE }));
    expect(html).toContain(PENDING);
    expect(html).toContain('data-action="ghost-cancel"');
    expect(html).toContain("Cancel from this browser and connection — that's how our analytics recognise you.");
    expect(html).not.toMatch(/>GO GHOST</);
  });
  it('gone ghost and not pending: no button, just the fact', () => {
    earlyGhost();
    const html = txt(renderCityTogether(createInitialState(), { collective: AFTER }));
    expect(html).toContain("YOU'VE GONE GHOST");
    expect(html).not.toContain('data-action="ghost-cancel"');
    expect(html).not.toMatch(/>GO GHOST</);
  });
  it('a final-mission ghost is never pending', () => {
    markGoneGhost();
    const html = txt(renderCityTogether(completeCity(), { collective: { status: 'loading' } }));
    expect(html).toContain("YOU'VE GONE GHOST");
    expect(html).not.toContain('data-action="ghost-cancel"');
  });
});

describe('#/ghost/early', () => {
  it('routes', () => expect(parseRoute('#/ghost/early').screen).toBe('ghost-early'));

  it('loads the collective on entry', () => {
    expect(shouldAutoLoad('ghost-early', 'idle', ['ghost', 'ghost-done', 'ghost-early'])).toBe(true);
  });

  it('explains what happens and offers the switch', () => {
    const html = txt(renderGhostEarly(createInitialState(), {}));
    expect(GHOST_DIALOGUE.early).toBe("Going ghost now switches us off for good. Tonight we delete what this browser sent us this month from the connection you're on now — your missions leave the city's totals tomorrow — and you're added to the ghost count. (Ghosts who take back the whole city first keep their place in the totals.)");
    expect(html).toContain(GHOST_DIALOGUE.early);
    expect(html).toContain('data-action="go-ghost-early"');
    expect(html).toContain('GO GHOST NOW');
    expect(html).toMatch(/href="#\/city-together"[^>]*>NOT YET</);
  });

  it('sharing already off: the already-off line instead of the button', () => {
    setAnalyticsOff(true);
    const html = txt(renderGhostEarly(createInitialState(), {}));
    expect(html).toContain(GHOST_DIALOGUE.alreadyOff);
    expect(html).not.toContain('data-action="go-ghost-early"');
  });

  it('complete city: the final mission instead (data kept)', () => {
    const html = txt(renderGhostEarly(completeCity(), {}));
    expect(html).toContain('data-action="go-ghost"');
    expect(html).not.toContain('data-action="go-ghost-early"');
  });

  it('already gone ghost: the finale', () => {
    earlyGhost();
    const html = txt(renderGhostEarly(createInitialState(), { collective: BEFORE }));
    expect(html).toContain('YOU HAVE GONE GHOST');
    expect(html).not.toContain('data-action="go-ghost-early"');
  });
});

describe('early ghost finale', () => {
  it('pending: tomorrow line with the +1 count and the cancel block, no pod half', () => {
    earlyGhost();
    const html = txt(renderGhostDone(createInitialState(), { collective: BEFORE }));
    expect(html).toContain('YOU HAVE GONE GHOST');
    expect(html).toContain("Tomorrow your missions leave the city's totals. You'll be one of 312 ghosts.");
    expect(html).not.toMatch(/Chicago/);
    expect(html).toContain(PENDING);
    expect(html).toContain('data-action="ghost-cancel"');
    expect(html).toContain(GHOST_DIALOGUE.done);
  });

  it('pending without numbers', () => {
    earlyGhost();
    for (const collective of [{ status: 'error' }, { status: 'loading' }, { status: 'ready', data: { asOf: '2026-10-06T03:00:00Z', city: {}, pods: [] } }]) {
      const html = txt(renderGhostDone(createInitialState(), { collective }));
      expect(html).toContain("Tomorrow your missions leave the city's totals.");
      expect(html).not.toMatch(/one of|undefined|NaN|null/);
    }
  });

  it('after the run: went-through line, no cancel, and the restore block', () => {
    earlyGhost();
    const html = txt(renderGhostDone(createInitialState(), { collective: AFTER }));
    expect(html).toContain("Your ghost went through. Tonight's run deleted what this browser had sent us.");
    expect(html).not.toContain('data-action="ghost-cancel"');
    expect(html).not.toContain('Tomorrow your missions');
    expect(html).toContain('YOUR DATA WAS DELETED');
    expect(html).toContain('data-action="restore-data"');
    expect(html).toContain('BRING MY DATA BACK');
  });

  it('final-mission finale is unchanged: no cancel, no restore', () => {
    markGoneGhost();
    const html = txt(renderGhostDone(completeCity(), { collective: BEFORE }));
    expect(html).toMatch(/one of 13 in|312 across the city/);
    expect(html).not.toContain('data-action="ghost-cancel"');
    expect(html).not.toContain('data-action="restore-data"');
  });

  it('shows a notice from an action, escaped', () => {
    earlyGhost();
    const html = txt(renderGhostDone(createInitialState(), { collective: BEFORE, notice: '<b>x</b>' }));
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
  });
});

describe('Your City: PLAY STATS', () => {
  it('pending early ghost shows the cancel block', () => {
    earlyGhost();
    setAnalyticsOff(true);
    const html = txt(renderStats(createInitialState(), { collective: BEFORE }));
    expect(html).toContain(PENDING);
    expect(html).toContain('data-action="ghost-cancel"');
  });

  it('deleted early ghost shows the restore block', () => {
    earlyGhost();
    setAnalyticsOff(true);
    const html = txt(renderStats(createInitialState(), { collective: AFTER }));
    expect(html).toContain('YOUR DATA WAS DELETED');
    expect(html).toContain("We deleted what this browser had sent us. Your game is still saved here, so you can send it again and rejoin the city's totals.");
    expect(html).toContain('data-action="restore-data"');
    expect(html).not.toContain('data-action="ghost-cancel"');
  });

  it('opt-out that went through shows the restore block; pending shows nothing new', () => {
    setOptedOutAt(AT);
    setAnalyticsOff(true);
    expect(txt(renderStats(createInitialState(), { collective: AFTER }))).toContain('data-action="restore-data"');
    const pending = txt(renderStats(createInitialState(), { collective: BEFORE }));
    expect(pending).not.toContain('data-action="restore-data"');
    expect(pending).not.toContain('data-action="ghost-cancel"');
    expect(pending).toContain('data-action="toggle-analytics"');
  });

  it('before collective.json loads: a checking line, never cancel or restore', () => {
    earlyGhost();
    setAnalyticsOff(true);
    for (const collective of [undefined, { status: 'idle' }, { status: 'loading' }]) {
      const html = txt(renderStats(createInitialState(), { collective }));
      expect(html).toContain("Checking whether tonight's run has happened…");
      expect(html).not.toContain('data-action="ghost-cancel"');
      expect(html).not.toContain('data-action="restore-data"');
    }
    setOptedOutAt(AT);
    const err = txt(renderStats(createInitialState(), { collective: { status: 'error' } }));
    expect(err).toContain("We couldn't check whether tonight's run has happened.");
    expect(err).toContain('data-action="collective-retry"');
    expect(err).not.toContain('data-action="ghost-cancel"');
  });

  it('nobody deleted: no new blocks, and no view still renders', () => {
    const html = txt(renderStats(createInitialState()));
    expect(html).not.toContain('data-action="restore-data"');
    expect(html).not.toContain('data-action="ghost-cancel"');
    expect(html).not.toMatch(/undefined|NaN/);
  });
});
