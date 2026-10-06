import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// sw.js is a classic script, so evaluate it with stubs and pull the pieces out.
const src = readFileSync('src/sw.js', 'utf8');
const ctx = { self: { addEventListener() {} }, location: { origin: 'https://x.test' }, URL, caches: {} };
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__t = { shouldIntercept, CACHE_NAME };', ctx);
const { shouldIntercept, CACHE_NAME } = ctx.__t;

describe('service worker', () => {
  it('never intercepts API requests', () => {
    expect(shouldIntercept(new URL('https://x.test/api/whoami'))).toBe(false);
    expect(shouldIntercept(new URL('https://x.test/reclaim-city/api/collective.json'))).toBe(false);
  });
  it('still handles the app shell', () => {
    expect(shouldIntercept(new URL('https://x.test/reclaim-city/app.js'))).toBe(true);
    expect(shouldIntercept(new URL('https://x.test/'))).toBe(true);
  });
  it('cache name moved past v1 so old stored API answers are dropped', () => {
    expect(CACHE_NAME).not.toBe('reclaim-city-v1');
  });
});
