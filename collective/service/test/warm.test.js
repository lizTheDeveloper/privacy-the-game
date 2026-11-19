import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { warm, charactersLeft, numberArg } from '../warm.js';

const A = 'aaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbb';
const C = 'cccccccccccccccc';
const mp3 = (tag) => Buffer.concat([Buffer.from('ID3'), Buffer.alloc(2000, tag)]);

function setup(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'warm-'));
  const cacheDir = join(dir, 'cache');
  mkdirSync(cacheDir);
  for (const [id, body] of Object.entries(files)) writeFileSync(join(cacheDir, `${id}.mp3`), body);
  const sent = [];
  const synth = async (text) => { sent.push(text); return mp3(text.length); };
  return { cacheDir, sent, synth, sleep: async () => {}, remaining: async () => 1e9 };
}

test('records only the missing lines; a sound recording is never made again', async () => {
  const s = setup({ [A]: mp3(1) });
  const counts = await warm({ ...s, lines: { [A]: 'Old line.', [B]: 'New line.', [C]: 'Another.' } });
  assert.deepEqual(s.sent.sort(), ['Another.', 'New line.']);
  assert.equal(counts.made, 2);
  assert.equal(counts.ok, 1);
  assert.deepEqual(readFileSync(join(s.cacheDir, `${A}.mp3`)), mp3(1));
  assert.ok(existsSync(join(s.cacheDir, `${B}.mp3`)));
});

test('a tiny or non-mp3 file is a bad recording and is rerolled', async () => {
  const s = setup({ [A]: mp3(1).subarray(0, 500), [B]: Buffer.from('{"detail":"quota_exceeded"}'.padEnd(2000)) });
  const counts = await warm({ ...s, lines: { [A]: 'Short.', [B]: 'Error file.' } });
  assert.equal(counts.bad, 2);
  assert.equal(counts.rerolled, 2);
  assert.equal(readFileSync(join(s.cacheDir, `${A}.mp3`)).length, 2003);
});

test('dry run spends nothing', async () => {
  const s = setup();
  const counts = await warm({ ...s, dryRun: true, lines: { [A]: 'One.', [B]: 'Two.' } });
  assert.equal(counts.missing, 2);
  assert.equal(counts.todoChars, 8);
  assert.deepEqual(s.sent, []);
});

test('stops before the plan drops under the reserve', async () => {
  const s = setup();
  const counts = await warm({ ...s, remaining: async () => 1015, reserve: 1000, lines: { [A]: 'x'.repeat(10), [B]: 'y'.repeat(10) } });
  assert.equal(s.sent.length, 1);
  assert.equal(counts.skippedForBudget, 1);
});

test('backs off on 429 and keeps going; a refused key stops the run', async () => {
  const s = setup();
  let calls = 0;
  const flaky = async () => { if (calls++ === 0) throw new Error('elevenlabs 429'); return mp3(2); };
  const counts = await warm({ ...s, synth: flaky, concurrency: 1, lines: { [A]: 'One.' } });
  assert.equal(counts.made, 1);

  const t = setup();
  const refused = async () => { throw new Error('elevenlabs 401'); };
  const c2 = await warm({ ...t, synth: refused, concurrency: 1, lines: { [A]: 'One.', [B]: 'Two.' } });
  assert.equal(c2.made, 0);
  assert.equal(c2.failed, 1);
});

test('a subscription answer without numbers records nothing', async () => {
  const s = setup();
  for (const body of [{}, { character_limit: 'lots', character_count: 5 }, { character_limit: null, character_count: null }, { tier: 'pro' }]) {
    const fetchImpl = async () => ({ ok: true, json: async () => body });
    const left = await charactersLeft('k', fetchImpl);
    assert.equal(left, null, JSON.stringify(body));
    const counts = await warm({ ...s, remaining: () => charactersLeft('k', fetchImpl), lines: { [A]: 'One.', [B]: 'Two.' } });
    assert.equal(counts.stopped, 'budget unknown');
    assert.equal(counts.made, 0);
  }
  assert.equal(await charactersLeft('k', async () => ({ ok: true, json: async () => ({ character_limit: 100, character_count: 40 }) })), 60);
  assert.deepEqual(s.sent, []);
});

test('NaN, negative or unknown budgets fail closed; the override needs a finite cap', async () => {
  const lines = { [A]: 'One.', [B]: 'Two.' };
  for (const remaining of [async () => NaN, async () => Infinity, async () => undefined, async () => -5, async () => 50]) {
    const s = setup();
    const counts = await warm({ ...s, remaining, reserve: 100, lines });
    assert.equal(counts.made, 0);
    assert.deepEqual(s.sent, []);
  }
  for (const bad of [{ reserve: NaN }, { maxChars: NaN }, { reserve: -1 }]) {
    const s = setup();
    const counts = await warm({ ...s, ...bad, lines });
    assert.equal(counts.stopped, 'bad limits');
    assert.deepEqual(s.sent, []);
  }
  const u = setup();
  const none = await warm({ ...u, remaining: async () => null, allowUnknownBudget: true, lines });
  assert.equal(none.made, 0); // no --max-chars: still nothing
  const capped = await warm({ ...u, remaining: async () => null, allowUnknownBudget: true, maxChars: 4, lines });
  assert.equal(capped.made, 1);
});

test('the budget going unreadable mid-run stops it', async () => {
  const s = setup();
  let calls = 0;
  const remaining = async () => (calls++ === 0 ? 1e9 : NaN);
  const lines = Object.fromEntries(Array.from({ length: 205 }, (_, i) => [i.toString(16).padStart(16, '0'), `Line ${i}.`]));
  const counts = await warm({ ...s, remaining, concurrency: 1, lines });
  assert.equal(counts.made, 200);
  assert.equal(counts.stopped, 'budget unknown');
});

test('numeric flags must be finite numbers >= 0', () => {
  assert.equal(numberArg(['--reserve', '5000'], 'reserve', 1), 5000);
  assert.equal(numberArg([], 'max-chars', Infinity), Infinity);
  for (const v of ['abc', '', 'NaN', 'Infinity', '-3', undefined]) {
    const argv = v === undefined ? ['--max-chars'] : ['--max-chars', v];
    assert.throws(() => numberArg(argv, 'max-chars', Infinity), /needs a number/);
  }
});
