// Breaker phase 3 round 3 (ruling): restore sends one event at a time, each
// awaited (bounded), oldest filing first, so Umami's created_at follows the
// save's order. A send that times out doesn't stop or reorder the rest.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { trackNow } from '../src/utils/analytics.js';

const APP = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const restoreFn = APP.slice(APP.indexOf('async function restoreData()'), APP.indexOf('async function restoreData()') + 2500);

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

    it('sends are sequential and in order; a hung send times out and the next still goes, in order', async () => {
      const log = [];
      const pending = [];
      globalThis.umami = { track: (name) => { log.push(`start ${name}`); return new Promise((res) => pending.push(() => { log.push(`end ${name}`); res(); })); } };
      const run = (async () => {
        for (const name of ['a', 'b', 'c']) await trackNow(name, {}, { timeoutMs: 1000 });
      })();
      await vi.advanceTimersByTimeAsync(0);
      expect(log).toEqual(['start a']);
      pending.shift()();                          // a answers
      await vi.advanceTimersByTimeAsync(0);
      expect(log).toEqual(['start a', 'end a', 'start b']);
      await vi.advanceTimersByTimeAsync(1000);    // b hangs: timeout, then c
      expect(log).toEqual(['start a', 'end a', 'start b', 'start c']);
      pending.pop()();
      await run;
    });
  });
});
