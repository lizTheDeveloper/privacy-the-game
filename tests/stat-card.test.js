import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateStatCard } from '../src/utils/milestone-card.js';

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
    expect(c.ctx.texts).toEqual(expect.arrayContaining(['RECLAIM CITY', 'PASSWORDS CHANGED', '1,683', 'weak or reused passwords replaced', 'themultiverse.school/reclaim']));
  });

  it('adds the sub line only when there is one', () => {
    const c = generateStatCard({ kicker: 'FOUND IN A BREACH', big: '58%', what: 'of addresses checked', sub: '46% in three or more' });
    expect(c.ctx.texts).toContain('46% in three or more');
  });
});
