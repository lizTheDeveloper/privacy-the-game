// Agreement with Umami v3.1.0 (src/lib/detect.ts, src/lib/ip.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getIpAddress, getClientInfo, resolveLocation } from '../client-info.js';

const h = (o) => new Headers(o);
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const CHROME_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

test('ip: header precedence, first x-forwarded-for entry, mapped v6 and ports', () => {
  assert.equal(getIpAddress(h({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' })), '203.0.113.9');
  assert.equal(getIpAddress(h({ 'x-forwarded-for': '10.0.0.1', 'cf-connecting-ip': '198.51.100.7' })), '198.51.100.7');
  assert.equal(getIpAddress(h({ 'x-real-ip': '::ffff:192.0.2.1' })), '192.0.2.1');
  assert.equal(getIpAddress(h({ 'x-real-ip': '192.0.2.1:5555' })), '192.0.2.1');
  assert.equal(getIpAddress(h({ forwarded: 'for=192.0.2.60;proto=http' })), '192.0.2.60');
  assert.equal(getIpAddress(h({})), undefined);
});

test('device: Umami rule (type, or desktop -> laptop when width <= 1920)', () => {
  assert.equal(getClientInfo(IPHONE, '390x844').device, 'mobile');
  assert.equal(getClientInfo(IPAD, '820x1180').device, 'tablet');
  assert.equal(getClientInfo(CHROME_MAC, '1440x900').device, 'laptop');
  assert.equal(getClientInfo(CHROME_MAC, '2560x1440').device, 'desktop');
  assert.equal(getClientInfo(CHROME_MAC, undefined).device, 'desktop');
});

test('browser and os come from detect-browser as in Umami', () => {
  const i = getClientInfo(CHROME_MAC, '1440x900');
  assert.equal(i.browser, 'chrome');
  assert.equal(i.os, 'Mac OS');
  assert.equal(getClientInfo(IPHONE, '390x844').os, 'iOS');
});

test('location: provider headers win over the database; region is COUNTRY-sub', async () => {
  const loc = await resolveLocation('203.0.113.9', h({ 'cf-ipcountry': 'US', 'cf-region-code': 'IL', 'cf-ipcity': 'Chicago' }),
    async () => { throw new Error('db must not be consulted'); });
  assert.deepEqual(loc, { country: 'US', region: 'US-IL', city: 'Chicago' });
});

test('location: database mapping and local IPs', async () => {
  const db = () => ({ country: { iso_code: 'US' }, subdivisions: [{ iso_code: 'IL' }], city: { names: { en: 'Chicago' } } });
  assert.deepEqual(await resolveLocation('203.0.113.9', h({}), async () => ({ get: db })), { country: 'US', region: 'US-IL', city: 'Chicago' });
  assert.deepEqual(await resolveLocation('127.0.0.1', h({}), async () => ({ get: db })), { country: null, region: null, city: null });
  assert.deepEqual(await resolveLocation(undefined, h({}), async () => ({ get: db })), { country: null, region: null, city: null });
  const reg = () => ({ registered_country: { iso_code: 'DE' } });
  assert.deepEqual(await resolveLocation('203.0.113.9', h({}), async () => ({ get: reg })), { country: 'DE', region: null, city: null });
});
