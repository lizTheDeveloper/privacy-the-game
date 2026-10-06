import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { podForGeo } from '../pods.js';

const PODS = [
  { id: 'us-il-chicago', level: 'city', country: 'US', region: 'US-IL', city: 'Chicago', label: 'Chicago' },
  { id: 'us-il-rest', level: 'region', country: 'US', region: 'US-IL', rest: true, label: 'Rest of Illinois' },
  { id: 'us-rest', level: 'country', country: 'US', rest: true, label: 'Rest of United States' },
  { id: 'gb', level: 'country', country: 'GB', includesWorld: true, label: 'United Kingdom & the rest of the world' },
];

test('podForGeo walks city, region, country, then the pod holding the rest of the world', () => {
  assert.equal(podForGeo(PODS, { country: 'US', region: 'US-IL', city: 'Chicago' }).id, 'us-il-chicago');
  assert.equal(podForGeo(PODS, { country: 'US', region: 'US-IL', city: 'Peoria' }).id, 'us-il-rest');
  assert.equal(podForGeo(PODS, { country: 'US', region: 'US-TX', city: 'Austin' }).id, 'us-rest');
  assert.equal(podForGeo(PODS, { country: 'FR', region: 'FR-IDF', city: 'Paris' }).id, 'gb');
  assert.equal(podForGeo([], { country: 'US' }), null);
});

async function call(server, path, headers = {}, method = 'GET') {
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers });
    return { status: res.status, headers: res.headers, body: method === 'HEAD' ? '' : await res.text() };
  } finally {
    server.close();
  }
}

const DOC = { k: 50, asOf: '2026-10-06T04:00:00Z', city: { players: 100 }, pods: PODS };
const fixed = (over = {}) => createServer({
  readCollective: async () => JSON.stringify(DOC),
  lookupGeo: async () => ({ country: 'US', region: 'US-IL', city: 'Chicago' }),
  ...over,
});

test('serves collective.json with caching', async () => {
  const r = await call(fixed(), '/collective.json');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('cache-control'), 'public, max-age=3600');
  assert.deepEqual(JSON.parse(r.body).city, { players: 100 });
});

test('missing collective.json is a 503, not an empty 200', async () => {
  const r = await call(fixed({ readCollective: async () => { throw new Error('ENOENT'); } }), '/collective.json');
  assert.equal(r.status, 503);
});

test('whoami returns geo, client info and pod, never cached', async () => {
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const r = await call(fixed(), '/whoami?screen=390x844&lang=en-US', { 'user-agent': ua, 'x-forwarded-for': '203.0.113.9' });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const body = JSON.parse(r.body);
  assert.equal(body.city, 'Chicago');
  assert.equal(body.country, 'US');
  assert.equal(body.device, 'mobile');
  assert.equal(body.os, 'iOS');
  assert.equal(body.language, 'en-US');
  assert.deepEqual(body.pod, { id: 'us-il-chicago', label: 'Chicago' });
});

test('whoami still answers when collective.json is missing (pod null)', async () => {
  const r = await call(fixed({ readCollective: async () => { throw new Error('ENOENT'); } }), '/whoami');
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(r.body).pod, null);
});

test('whoami answers with nulls when the geo lookup fails', async () => {
  const r = await call(fixed({ lookupGeo: async () => { throw new Error('no mmdb'); } }), '/whoami');
  assert.equal(r.status, 200);
  const b = JSON.parse(r.body);
  assert.equal(b.city, null);
  assert.equal(b.country, null);
});

test('CORS only for studio origins', async () => {
  const ok = await call(fixed(), '/collective.json', { origin: 'https://multiversestudios.xyz' });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://multiversestudios.xyz');
  assert.equal(ok.headers.get('vary'), 'Origin');
  const bad = await call(fixed(), '/collective.json', { origin: 'https://evil.example' });
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
});

test('unknown routes 404, writes 405', async () => {
  assert.equal((await call(fixed(), '/etc/passwd')).status, 404);
  assert.equal((await call(fixed(), '/collective.json', {}, 'POST')).status, 405);
});

import net from 'node:net';

test('malformed request target gets a 400 and the server keeps serving', async () => {
  const server = fixed();
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  try {
    const raw = await new Promise((resolve, reject) => {
      const s = net.connect(port, '127.0.0.1', () => s.write('GET // HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n'));
      let buf = '';
      s.on('data', (d) => { buf += d; });
      s.on('end', () => resolve(buf));
      s.on('error', reject);
    });
    assert.match(raw, /^HTTP\/1\.1 400 /);
    const ok = await fetch(`http://127.0.0.1:${port}/collective.json`);
    assert.equal(ok.status, 200);
    // garbage that the HTTP parser itself rejects
    const bad = await new Promise((resolve) => {
      const s = net.connect(port, '127.0.0.1', () => s.write('\x00\x01 nonsense\r\n\r\n'));
      let buf = '';
      s.on('data', (d) => { buf += d; });
      s.on('close', () => resolve(buf));
    });
    assert.match(bad, /^HTTP\/1\.1 400 /);
    assert.equal((await fetch(`http://127.0.0.1:${port}/collective.json`)).status, 200);
  } finally {
    server.close();
  }
});

test('oversized headers (past the 16 KB limit) are refused fast; near-limit ones are served', async () => {
  const t0 = Date.now();
  const server = createServer({ readCollective: async () => JSON.stringify(DOC) });
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  try {
    const huge = await fetch(`http://127.0.0.1:${port}/whoami`, { headers: { 'user-agent': 'a'.repeat(100 * 1024) } }).then((r) => r.status, () => 'closed');
    assert.ok([400, 431, 'closed'].includes(huge), String(huge));
    const near = await fetch(`http://127.0.0.1:${port}/whoami`, { headers: { 'user-agent': '('.repeat(8000), 'x-forwarded-for': '1'.repeat(4000) } });
    assert.equal(near.status, 200);
    assert.ok(Date.now() - t0 < 200, `took ${Date.now() - t0}ms`);
  } finally {
    server.close();
  }
});

test('HEAD has no body, OPTIONS is 204 with Allow-Methods, Vary on 404 and 405', async () => {
  const head = await call(fixed(), '/collective.json', {}, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  const opt = await call(fixed(), '/whoami', { origin: 'https://multiversegames.ai' }, 'OPTIONS');
  assert.equal(opt.status, 204);
  assert.equal(opt.headers.get('access-control-allow-methods'), 'GET');
  assert.equal(opt.headers.get('access-control-allow-origin'), 'https://multiversegames.ai');
  assert.equal((await call(fixed(), '/nope')).headers.get('vary'), 'Origin');
  assert.equal((await call(fixed(), '/whoami', {}, 'POST')).headers.get('vary'), 'Origin');
});
