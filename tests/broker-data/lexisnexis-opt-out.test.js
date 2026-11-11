import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSource, validateBroker } from '../../research/data-brokers/build/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

test('LexisNexis (lexisnexis.json) staged web-form opt-out route and Wayback sources pass schema validation', () => {
  const sources = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'research/data-brokers/staging/policies/sources.json'), 'utf8')
  );
  const staged = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'research/data-brokers/staging/policies/brokers/lexisnexis.json'), 'utf8')
  );
  const baseBroker = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'research/data-brokers/brokers/lexisnexis.json'), 'utf8')
  );

  assert.deepEqual(validateSource('pol-lexisnexis-optout', sources['pol-lexisnexis-optout']), []);
  assert.deepEqual(validateSource('pol-lexisnexis-privacy', sources['pol-lexisnexis-privacy']), []);

  const sourceIds = new Set([...Object.keys(sources), 'registry-vt-2026-10-19']);
  const merged = {
    ...baseBroker,
    aliases: staged.aliases,
    kind: staged.kind,
    sells: staged.sells,
    optOut: staged.optOut,
    sources: staged.sources,
  };

  assert.deepEqual(validateBroker(merged, { sourceIds }), []);
  assert.equal(merged.optOut.method, 'web-form');
  assert.equal(merged.optOut.url, 'https://optout.lexisnexis.com/');
  assert.equal(merged.optOut.status, 'verified');
});
