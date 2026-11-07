import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateStatCard, generateMilestoneCard, shareStatusText } from '../src/utils/milestone-card.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function fakeCanvas() {
  const texts = [];
  const ctx = new Proxy({ texts, measureText: (t) => ({ width: String(t).length * 10 }), fillText: (t) => texts.push(String(t)),
    createLinearGradient: () => ({ addColorStop() {} }) }, {
    get: (o, k) => (k in o ? o[k] : () => {}),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  return { width: 0, height: 0, getContext: () => ctx, ctx };
}

describe('generateStatCard', () => {
  let saved;
  beforeEach(() => { saved = globalThis.document; globalThis.document = { createElement: () => fakeCanvas() }; });
  afterEach(() => { globalThis.document = saved; });

  it('draws the kicker, the number and the words on the milestone card frame', () => {
    const c = generateStatCard({ kicker: 'PASSWORDS CHANGED', big: '1,683', what: 'weak or reused passwords replaced', sub: '' });
    expect([c.width, c.height]).toEqual([600, 315]);
    expect(c.ctx.texts).toEqual(expect.arrayContaining(['RECLAIM CITY', 'PASSWORDS CHANGED', '1,683', 'weak or reused passwords replaced', 'play.multiversegames.ai/reclaim-city/']));
  });

  it('adds the sub line only when there is one', () => {
    const c = generateStatCard({ kicker: 'FOUND IN A BREACH', big: '58%', what: 'of addresses checked', sub: '46% in three or more' });
    expect(c.ctx.texts).toContain('46% in three or more');
  });

  // UI sweep #8: both cards print the live game's address (https://play.multiversegames.ai/reclaim-city/
  // answered 200 on 2026-11-06; themultiverse.school/reclaim answered 404).
  it('the milestone card prints the live address too', () => {
    const c = generateMilestoneCard('MASTER KEYS', { accountsSecured: 3, addressesBreached: 1, integrityPercent: 40 });
    expect(c.ctx.texts).toContain('play.multiversegames.ai/reclaim-city/');
    expect(c.ctx.texts.join(' ')).not.toContain('themultiverse.school');
  });
});

describe('share feedback (UI sweep #8)', () => {
  it('says what happened for each way a card can go', () => {
    expect(shareStatusText({ ok: true, method: 'clipboard' })).toMatch(/Copied/);
    expect(shareStatusText({ ok: true, method: 'download', filename: 'reclaim-city-milestone.png' })).toBe('Downloaded as reclaim-city-milestone.png.');
    expect(shareStatusText({ ok: true, method: 'share' })).toMatch(/share sheet/);
    expect(shareStatusText({ ok: false })).toMatch(/Couldn’t make the card/);
  });

  it('the share buttons have a status line beside them, and app.js fills it', async () => {
    const { renderMilestone } = await import('../src/screens/milestone.js');
    const { createInitialState } = await import('../src/state.js');
    expect(renderMilestone(createInitialState(), 'master-keys')).toContain('data-share-status');
    const app = readFileSync('src/app.js', 'utf8');
    expect(app).toContain('showShareStatus(app.querySelector(\'[data-share-status]\'), await shareMilestoneCard(');
    expect(app).toMatch(/showShareStatus\([^\n]*data-share-status=[^\n]*await shareStatCard\(stat\)\)/);
  });

  it('nothing in src/ prints the dead themultiverse.school/reclaim address', () => {
    const walk = (dir) => readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : /\.(js|html|css|json)$/.test(f) ? [p] : [];
    });
    const hits = walk('src').filter((f) => readFileSync(f, 'utf8').includes('themultiverse.school/reclaim'));
    expect(hits).toEqual([]);
  });
});
