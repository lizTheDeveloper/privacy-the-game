// Breaker phase 3 round 3 (ruling): restore sends one event at a time, each
// awaited (bounded), oldest filing first, so Umami's created_at follows the
// save's order. A send that times out doesn't stop or reorder the rest.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { trackNow } from '../src/utils/analytics.js';

const APP = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const restoreFn = APP.slice(APP.indexOf('async function restoreData()'), APP.indexOf('async function restoreData()') + 3500);

describe('restore sends in order, one at a time', () => {
  it('the restore loop steps one event at a time and awaits each send', () => {
    expect(restoreFn).toMatch(/for \(let i = 0; i < events\.length; i \+= 1\) \{\s*await trackNow\(events\[i\]\.name, events\[i\]\.data\);/);
    // No fire-and-forget send of the restored events.
    expect(restoreFn).not.toMatch(/track\(e\.name, e\.data\)/);
  });

  describe('trackNow', () => {
    const store = {};
    beforeEach(() => {
      globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
      vi.useFakeTimers();
    });
    afterEach(() => { vi.useRealTimers(); delete globalThis.umami; });

    it('a slow first send finishes before the second starts (no abandoning timeout)', async () => {
      const log = [];
      const delays = { first: 30000, second: 10 };
      globalThis.umami = { track: (name) => { log.push(`start ${name}`); return new Promise((res) => setTimeout(() => { log.push(`end ${name}`); res(); }, delays[name])); } };
      const run = (async () => { for (const name of ['first', 'second']) await trackNow(name, {}); })();
      await vi.advanceTimersByTimeAsync(20000);
      expect(log).toEqual(['start first']);
      await vi.advanceTimersByTimeAsync(20000);
      await run;
      expect(log).toEqual(['start first', 'end first', 'start second', 'end second']);
    });

    it('a send that rejects is counted and the next one still goes, in order', async () => {
      const { failedSends } = await import('../src/utils/analytics.js');
      const before = failedSends();
      const log = [];
      globalThis.umami = { track: (name) => { log.push(name); return name === 'b' ? Promise.reject(new Error('net')) : Promise.resolve(); } };
      for (const name of ['a', 'b', 'c']) expect(await trackNow(name, {})).toBe(true);
      expect(log).toEqual(['a', 'b', 'c']);
      expect(failedSends() - before).toBe(1);
    });

    it('the cancel paths stay bounded so a hung request never freezes the screen', () => {
      expect(APP).toMatch(/trackNow\('ghost-cancelled', \{ nonce \}, \{ timeoutMs: 1500 \}\)/);
      expect(APP).toMatch(/trackNow\('opt-out-cancelled', \{ nonce \}, \{ timeoutMs: 1500 \}\)/);
    });

    it('restore reports sends that failed instead of claiming all arrived', () => {
      expect(restoreFn).toMatch(/failedSends\(\) - failedBefore/);
      expect(restoreFn).toMatch(/RESTORE_DIALOGUE\.partial\(failed, events\.length\)/);
    });
  });
});
