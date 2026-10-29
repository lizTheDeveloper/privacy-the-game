import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  BUG_CATEGORIES, feedbackHost, currentScreen, gameVersion, reportBody, sendReport, bugButtonHtml, dialogHtml,
} from '../src/components/bug-reporter.js';
import { renderHud } from '../src/components/hud.js';

afterEach(() => vi.unstubAllGlobals());

const hudState = { streak: { current: 0 }, accounts: {}, missions: {}, vehicles: [] };
const docWith = (href) => ({ querySelector: (sel) => (href && sel.includes('style.css') ? { getAttribute: () => href } : null) });

describe('the 🐞 bug reporter', () => {
  it('offers the same eight Bug Motel kinds as Multiverse Campus, in the same order', () => {
    expect(BUG_CATEGORIES.map((c) => `${c.emoji} ${c.slug}`)).toEqual([
      '🦋 design_bug', '🐞 non_urgent_bug', '🐜 community_bug', '🐛 newbie_question',
      '🪲 undocumented_feature', '🕷️ connectivity_bug', '👾 game_bug', '🦟 general_annoying_bug',
    ]);
    const html = dialogHtml();
    for (const c of BUG_CATEGORIES) expect(html).toContain(`data-bug-cat="${c.slug}"`);
    expect(html).toContain('🐞 REPORT A BUG');
  });

  it('the ladybug is in the HUD on every screen, in the campus cabinet too', () => {
    expect(renderHud(hudState)).toContain(bugButtonHtml());
    vi.stubGlobal('window', { self: {}, top: {}, location: { search: '?cabinet=campus' } });
    expect(renderHud(hudState)).toContain('data-bug-report');
  });

  it('talks to the feedback service on the same domain family as the page', () => {
    expect(feedbackHost('play.multiversegames.ai')).toBe('https://feedback.multiversegames.ai');
    expect(feedbackHost('play.multiversestudios.xyz')).toBe('https://feedback.multiversestudios.xyz');
    expect(feedbackHost('localhost')).toBe('https://feedback.multiversegames.ai');
  });

  it('a report is only the kind, the words, the screen and the version', () => {
    const body = reportBody('game_bug', '  The sky never loads.  ', { hash: '#/reclamation/map?x=1', doc: docWith('style.css?v=7.5.0') });
    expect(body).toEqual({ game: 'reclaim-city', category: 'game_bug', text: 'The sky never loads.', page: '#/reclamation/map', version: '7.5.0' });
    expect(Object.keys(reportBody('game_bug', 'x'.repeat(20), { hash: '', doc: docWith(null) })).sort()).toEqual(['category', 'game', 'page', 'text']);
  });

  it('the screen is the route only and the version comes from the stylesheet cache-bust', () => {
    expect(currentScreen('')).toBe('#/');
    expect(currentScreen('#/mission/x/briefing')).toBe('#/mission/x/briefing');
    expect(currentScreen(`#/${'a'.repeat(300)}`)).toHaveLength(200);
    expect(gameVersion(docWith('style.css?v=7.5.0'))).toBe('7.5.0');
    expect(gameVersion(docWith('style.css?v=<b>'))).toBe(null);
    const index = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(index).toContain(`style.css?v=${pkg.version}"`);
  });

  it('posts JSON to /v2/report and reports success, rate limits and network failures plainly', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    expect(await sendReport({ a: 1 }, { fetchImpl, host: 'https://feedback.example' })).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://feedback.example/v2/report');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ a: 1 });
    expect(init.credentials).toBeUndefined(); // no cookies cross to the feedback service

    const limited = await sendReport({}, { fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }) });
    expect(limited.ok).toBe(false);
    expect(limited.message).toMatch(/little while/);
    const bad = await sendReport({}, { fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: 'Text must be 10-2000 characters' }) }) });
    expect(bad).toEqual({ ok: false, message: 'Text must be 10-2000 characters' });
    const offline = await sendReport({}, { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
    expect(offline.message).toMatch(/connection/);
  });

  it('app.js mounts the reporter once at boot', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app.match(/^mountBugReporter\(\);$/gm)).toHaveLength(1);
  });
});

describe('the 🐞 on the welcome page', () => {
  it('the welcome page (no HUD) has its own REPORT A BUG button', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    const welcome = app.slice(app.indexOf('function renderWelcome()'), app.indexOf('// The building screen only counts'));
    expect(welcome).toMatch(/<button type="button" data-bug-report[^>]*>🐞 REPORT A BUG<\/button>/);
  });
});
