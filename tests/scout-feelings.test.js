import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { renderScout, scoutSprite, feelingSheet, FEELINGS, FRAME_MS, newScreenVisit } from '../src/components/scout.js';
import {
  feelingForCity, feelingForDebrief, feelingForGhostDone, noteFirstTwoFactor, twoFactorHugDue,
} from '../src/utils/scout-feelings.js';
import { MISSIONS } from '../src/data/missions.js';
import { createInitialState } from '../src/state.js';
import { renderDebrief } from '../src/screens/debrief.js';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { renderMilestone } from '../src/screens/milestone.js';
import { renderCityTogether } from '../src/screens/city-together.js';
import { renderDataDeleted, renderNotice } from '../src/screens/stats.js';
import { RESTORE_DIALOGUE } from '../src/data/dialogue.js';
import { renderStats } from '../src/screens/stats.js';
import { renderGhost, renderGhostEarly } from '../src/screens/ghost.js';
import { setAnalyticsOff } from '../src/utils/analytics-pref.js';
import { isCoreMission } from '../src/utils/calc.js';

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

// renderScout as it was before feelings (v4.5.0), for the "no feeling" case.
function todaysScout(message, options = {}) {
  const action = options.actionText && options.actionHref
    ? `<a href="${options.actionHref}" style="flex-shrink: 0; display: inline-block; border: 1px solid var(--cyan); padding: 10px 18px; font-family: var(--font-display); font-size: 9px; font-weight: 700; color: var(--cyan); text-decoration: none; white-space: nowrap; letter-spacing: 1px; text-shadow: 0 0 8px rgba(0,229,255,0.4); box-shadow: 0 0 12px rgba(0,229,255,0.15), inset 0 0 12px rgba(0,229,255,0.05);">${options.actionText}</a>`
    : '';
  return `
  <div style="background: linear-gradient(180deg, transparent 0%, rgba(9,11,16,0.92) 25%, rgba(9,11,16,0.99) 100%); padding: 18px 20px 14px; border-top: 1px solid rgba(0,229,255,0.08);">
    <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end;">
      <div style="flex-shrink: 0; text-align: center;">
        <img src="assets/characters/scout_0.png" style="width: 64px; height: 64px; filter: drop-shadow(0 0 6px rgba(0,229,255,0.3));">
        <div style="font-family: var(--font-display); font-size: 7px; font-weight: 700; color: var(--cyan); margin-top: 3px; letter-spacing: 2px; text-shadow: 0 0 6px rgba(0,229,255,0.4);">SCOUT</div>
      </div>
      <div style="flex: 1; background: rgba(26,31,43,0.9); border: 1px solid rgba(0,229,255,0.25); padding: 12px 16px; position: relative; box-shadow: 0 0 15px rgba(0,229,255,0.05), inset 0 0 30px rgba(0,229,255,0.02);">
        <div style="font-size: 14px; color: var(--offwhite); line-height: 1.6;">${message}</div>
        <div style="position: absolute; bottom: 8px; right: 12px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid var(--cyan);"></div>
      </div>
      ${action}
    </div>
  </div>`;
}

const ALL = ['hug', 'proud', 'happy', 'wave', 'goDoIt', 'thinkingA', 'thinkingB', 'worried', 'sad'];
const mission = (id) => MISSIONS.find((m) => m.id === id);
const HOUR = 3600 * 1000;
const NOW = Date.parse('2026-10-06T12:00:00Z');
const ago = (h) => new Date(NOW - h * HOUR).toISOString();

beforeEach(() => { globalThis.localStorage = memoryStorage(); setAnalyticsOff(false); newScreenVisit(); });

describe('renderScout', () => {
  it('without a feeling is exactly today’s markup', () => {
    expect(renderScout('Hi')).toBe(todaysScout('Hi'));
    expect(renderScout('Hi', { actionText: 'GO', actionHref: '#/x' })).toBe(todaysScout('Hi', { actionText: 'GO', actionHref: '#/x' }));
    expect(renderScout('Hi', { feeling: undefined })).toBe(todaysScout('Hi'));
  });

  it('with a feeling swaps only the sprite: same bubble, label and action', () => {
    const html = renderScout('Hi', { feeling: 'wave', actionText: 'GO', actionHref: '#/x' });
    expect(html).not.toContain('scout_0.png');
    expect(html).toContain('assets/characters/scout/wave.png');
    const strip = (h) => h.replace(/<img src="assets\/characters\/scout_0.png"[^>]*>|<span class="scout-sprite"[\s\S]*?<\/span><\/span><\/span>/, 'SPRITE');
    expect(strip(html)).toBe(strip(todaysScout('Hi', { actionText: 'GO', actionHref: '#/x' })));
  });

  it('an unknown feeling falls back to today’s sprite', () => {
    expect(renderScout('Hi', { feeling: 'grumpy' })).toBe(todaysScout('Hi'));
  });
});

describe('feeling sheets', () => {
  it('maps every feeling to its sheet', () => {
    expect(Object.keys(FEELINGS).sort()).toEqual([...ALL].sort());
    expect(feelingSheet('goDoIt')).toBe('assets/characters/scout/go-do-it.png');
    expect(feelingSheet('thinkingA')).toBe('assets/characters/scout/thinking-a.png');
    expect(feelingSheet('thinkingB')).toBe('assets/characters/scout/thinking-b.png');
    expect(feelingSheet('hug')).toBe('assets/characters/scout/hug.png');
    expect(FEELINGS.hug.frames).toBe(9);
    for (const f of ALL) {
      const file = `src/${feelingSheet(f)}`;
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, file).toBeLessThan(8000);
      // A horizontal strip of 64px frames.
      const png = readFileSync(file);
      expect(png.readUInt32BE(16), file).toBe(64 * FEELINGS[f].frames);
      expect(png.readUInt32BE(20), file).toBe(64);
    }
  });

  it('plays once over its frames and holds the last', () => {
    const html = scoutSprite('worried', { size: 64 });
    expect(html).toContain(`animation: scout-play ${6 * FRAME_MS}ms steps(6) both`);
    expect(html).toContain('background-size: 448px 64px');
    expect(html).toContain('transform: scale(1.3333)');
    expect(html).toContain('width: 64px; height: 64px;');
  });

  it('a sequence plays one feeling after the other', () => {
    const html = scoutSprite(['sad', 'wave'], { size: 64 });
    expect(html.indexOf('scout/sad.png')).toBeLessThan(html.indexOf('scout/wave.png'));
    expect(html).toContain(`scout-play ${6 * FRAME_MS}ms steps(6) ${6 * FRAME_MS}ms both`);
  });

  it('reduced motion shows the last frame without animating', () => {
    const css = readFileSync('src/style.css', 'utf8');
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/\.scout-sprite__sheet\s*{[^}]*animation:\s*none/);
    expect(block).toMatch(/\.scout-sprite__sheet:not\(:last-child\)\s*{[^}]*display:\s*none/);
    // At rest (no animation) a sheet shows its last frame.
    expect(css).toMatch(/\.scout-sprite__sheet\s*{[^}]*background-position:\s*100% 0/);
  });
});

describe('hug once per screen visit', () => {
  it('a second hug on the same visit holds still', () => {
    const first = scoutSprite('hug', { size: 64 });
    const second = scoutSprite('hug', { size: 64 });
    expect(first).toContain('scout-play');
    expect(second).toContain('scout/hug.png');
    expect(second).not.toContain('scout-play');
    newScreenVisit();
    expect(scoutSprite('hug', { size: 64 })).toContain('scout-play');
  });

  it('a re-draw of the same visit does not replay a feeling', () => {
    expect(scoutSprite('wave', { size: 64 })).toContain('scout-play');
    expect(scoutSprite('wave', { size: 64 })).not.toContain('scout-play');
    expect(scoutSprite(['sad', 'wave'], { size: 64 })).toContain('scout-play');
    const held = scoutSprite(['sad', 'wave'], { size: 64 });
    expect(held).not.toContain('scout/sad.png');
    expect(held).toContain('scout/wave.png');
  });
});

describe('city map Scout', () => {
  const s = createInitialState();
  it('waves on a first visit', () => expect(feelingForCity(s, { before: null }, NOW)).toBe('wave'));
  it('nothing on an ordinary return', () => expect(feelingForCity(s, { before: ago(3) }, NOW)).toBeUndefined());
  it('waves after a long time away', () => expect(feelingForCity(s, { before: ago(30) }, NOW)).toBe('wave'));
  it('waves then hugs after more than a week', () => {
    expect(feelingForCity(s, { before: ago(24 * 7 + 1) }, NOW)).toEqual(['wave', 'hug']);
    expect(feelingForCity(s, { before: ago(24 * 7 - 1) }, NOW)).toBe('wave');
  });
  it('nothing when the arrival is unknown', () => expect(feelingForCity(s, undefined, NOW)).toBeUndefined());
  it('the map passes it to Scout; no arrival given is today’s map', () => {
    expect(renderCityMap(s, { arrival: { before: null } })).toContain('scout/wave.png');
    expect(renderCityMap(s)).not.toContain('scout-sprite');
  });
  it('proud once the city is taken back', () => {
    expect(feelingForCity(s, { before: ago(3) }, NOW, { cityComplete: true })).toBe('proud');
  });
});

describe('debrief Scout', () => {
  const breach = mission('gmail-recon-breach');
  const login = mission('gmail-recon-login');
  const pw = mission('gmail-fortify-password');
  const tfa = mission('gmail-fortify-2fa');
  const done = (rec) => ({ status: 'completed', ...rec });

  it('starts thinking before the report is filed', () => expect(feelingForDebrief(breach, {})).toBe('thinkingA'));
  it('breach findings', () => {
    expect(feelingForDebrief(breach, done({ finding: '3plus-breaches' }))).toBe('worried');
    expect(feelingForDebrief(breach, done({ finding: '1-2-breaches' }))).toBe('thinkingA');
    expect(feelingForDebrief(breach, done({ finding: 'no-breaches' }))).toBe('happy');
  });
  it('suspicious logins worry Scout', () => {
    expect(feelingForDebrief(login, done({ finding: '1-2-breaches' }))).toBe('worried');
    expect(feelingForDebrief(login, done({ finding: '3plus-breaches' }))).toBe('worried');
    expect(feelingForDebrief(login, done({ finding: 'no-breaches' }))).toBe('happy');
  });
  it('a reset password makes Scout proud', () => {
    expect(feelingForDebrief(pw, done({ action: 'reset-password' }))).toBe('proud');
  });
  it('2FA by method', () => {
    expect(feelingForDebrief(tfa, done({ method: 'passkey' }))).toBe('proud');
    expect(feelingForDebrief(tfa, done({ method: 'none', method_setup: 'authenticator' }))).toBe('proud');
    expect(feelingForDebrief(tfa, done({ method: 'sms' }))).toBe('thinkingB');
    expect(feelingForDebrief(tfa, done({ method: 'none', method_setup: 'email' }))).toBe('thinkingB');
    expect(feelingForDebrief(tfa, done({ method: 'none', method_setup: 'later' }))).toBeUndefined();
  });
  it('the screen passes the feeling to its Scout', () => {
    const st = createInitialState();
    expect(renderDebrief(st, breach.id)).toContain('scout/thinking-a.png');
    st.missions[breach.id] = done({ finding: '3plus-breaches' });
    expect(renderDebrief(st, breach.id)).toContain('scout/worried.png');
  });
});

describe('first 2FA: one hug per save', () => {
  const tfa = mission('gmail-fortify-2fa');
  const tfa2 = mission('outlook-fortify-2fa');
  it('remembers the first 2FA mission with a real method, and only that one', () => {
    let s = createInitialState();
    expect(noteFirstTwoFactor(s, tfa, { method: 'none', method_setup: 'later' })).toBe(s);
    s = noteFirstTwoFactor(s, tfa, { status: 'completed', method: 'sms' });
    expect(s.scoutHugs.twoFactor).toEqual({ mission: tfa.id, seen: false });
    expect(noteFirstTwoFactor(s, tfa2, { status: 'completed', method: 'passkey' })).toBe(s);
    expect(noteFirstTwoFactor(s, mission('gmail-recon-breach'), { status: 'completed', finding: 'no-breaches' })).toBe(s);
  });
  it('the debrief hugs until it has been seen', () => {
    let s = createInitialState();
    s.missions[tfa.id] = { status: 'completed', method: 'sms' };
    s = noteFirstTwoFactor(s, tfa, s.missions[tfa.id]);
    expect(twoFactorHugDue(s, tfa.id)).toBe(true);
    expect(twoFactorHugDue(s, tfa2.id)).toBe(false);
    expect(renderDebrief(s, tfa.id)).toContain('scout/hug.png');
    s = { ...s, scoutHugs: { twoFactor: { mission: tfa.id, seen: true } } };
    expect(twoFactorHugDue(s, tfa.id)).toBe(false);
    newScreenVisit();
    expect(renderDebrief(s, tfa.id)).toContain('scout/thinking-b.png');
  });
});

describe('ghost Scout', () => {
  it('finale: sad then wave; silent: wave', () => {
    expect(feelingForGhostDone({ at: 'x' })).toEqual(['sad', 'wave']);
    expect(feelingForGhostDone({ silent: true })).toBe('wave');
  });
});

describe('other moments', () => {
  it('briefing: no reset needed makes Scout happy; otherwise today’s sprite', () => {
    const s = createInitialState();
    expect(renderBriefing(s, 'gmail-recon-breach')).toContain('src="assets/characters/scout_0.png" data-scout="briefing"');
    s.missions['gmail-recon-breach'] = { status: 'completed', finding: 'no-breaches' };
    const html = renderBriefing(s, 'gmail-fortify-password');
    expect(html).toContain('NO RESET NEEDED');
    expect(html).toContain('scout/happy.png');
    expect(renderBriefing(s, 'gmail-fortify-password', { resetAnyway: true })).toContain('src="assets/characters/scout_0.png" data-scout="briefing"');
  });
  it('milestone hugs', () => {
    expect(renderMilestone(createInitialState(), 'master-keys')).toContain('scout/hug.png');
  });
  it('the Whole City explainer thinks', () => {
    expect(renderCityTogether(createInitialState(), { collective: { status: 'idle' } })).toContain('scout/thinking-a.png');
  });
  it('early ghost confirm worries; the go-ghost briefing thinks', () => {
    expect(renderGhostEarly(createInitialState())).toContain('scout/worried.png');
    expect(renderGhost(completeCity())).toContain('scout/thinking-b.png');
  });
  it('sharing turned off: Scout thinks it over; on: no Scout there', () => {
    expect(renderStats(createInitialState())).not.toContain('scout/thinking-b.png');
    setAnalyticsOff(true);
    expect(renderStats(createInitialState())).toContain('scout/thinking-b.png');
  });
  it('data deleted is sad; a finished restore hugs', () => {
    expect(renderDataDeleted()).toContain('scout/sad.png');
    expect(renderNotice(RESTORE_DIALOGUE.done)).toContain('scout/hug.png');
    expect(renderNotice('Something else')).not.toContain('scout');
  });
});
