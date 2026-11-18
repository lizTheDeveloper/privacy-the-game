import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from '../server.js';
import { createVoice } from '../voice.js';

const ID = '0123456789abcdef';
function setup({ dailyChars = 1000, fail = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'voice-'));
  const linesFile = join(dir, 'lines.json');
  writeFileSync(linesFile, JSON.stringify({ [ID]: 'Welcome back, agent.', ffffffffffffffff: 'x'.repeat(900) }));
  const sent = [];
  const synth = async (text) => { sent.push(text); if (fail) throw new Error('down'); return Buffer.from(`mp3:${text}`); };
  const voice = createVoice({ linesFile, cacheDir: join(dir, 'cache'), dailyChars, synth });
  return { dir, voice, sent };
}

test('a listed line is voiced once, kept on disk, then served from the file', async () => {
  const { dir, voice, sent } = setup();
  const [a, b] = await Promise.all([voice.clip(ID), voice.clip(ID)]);
  assert.equal(a.status, 200);
  assert.equal(b.body.toString(), 'mp3:Welcome back, agent.');
  assert.deepEqual(sent, ['Welcome back, agent.']);
  assert.ok(existsSync(join(dir, 'cache', `${ID}.mp3`)));
  assert.equal((await voice.clip(ID)).status, 200);
  assert.equal(sent.length, 1);
});

test('only lines on the list are ever voiced; nothing else is sent', async () => {
  const { voice, sent } = setup();
  assert.equal((await voice.clip('aaaaaaaaaaaaaaaa')).status, 404);
  assert.equal((await voice.clip('../etc/passwd')).status, 404);
  assert.deepEqual(sent, []);
});

test('the daily budget stops new lines (503: the game reads them itself)', async () => {
  const { voice, sent } = setup({ dailyChars: 500 });
  assert.equal((await voice.clip('ffffffffffffffff')).status, 503);
  assert.equal((await voice.clip(ID)).status, 200);
  assert.deepEqual(sent, ['Welcome back, agent.']);
});

test('a failed voicing is 503 and is not kept', async () => {
  const { dir, voice } = setup({ fail: true });
  assert.equal((await voice.clip(ID)).status, 503);
  assert.ok(!existsSync(join(dir, 'cache', `${ID}.mp3`)));
});

test('the route serves mp3 that browsers keep, and 404s for anything else', async () => {
  const { voice } = setup();
  const server = createServer({ voice, readCollective: async () => '{}', lookupGeo: async () => ({}) });
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const ok = await fetch(`${base}/voice/${ID}.mp3`, { headers: { origin: 'https://play.multiversegames.ai' } });
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('content-type'), 'audio/mpeg');
    assert.match(ok.headers.get('cache-control'), /immutable/);
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://play.multiversegames.ai');
    assert.equal((await fetch(`${base}/voice/${ID}.wav`)).status, 404);
    assert.equal((await fetch(`${base}/voice/bbbbbbbbbbbbbbbb.mp3`)).status, 404);
  } finally {
    server.close();
  }
});
