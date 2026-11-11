import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBroker, validateSource } from '../../research/data-brokers/build/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

test('SageStream LLC (#409) broker and policy sources pass schema validation', () => {
  const brokerPath = path.join(root, 'research/data-brokers/staging/policies/brokers/sagestream.json');
  const sourcesPath = path.join(root, 'research/data-brokers/staging/policies/sources.json');

  const broker = JSON.parse(fs.readFileSync(brokerPath, 'utf8'));
  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));

  assert.deepEqual(validateSource('pol-sagestream-consumer-center', sources['pol-sagestream-consumer-center']), []);
  assert.deepEqual(validateSource('pol-sagestream-lexisnexis-optout', sources['pol-sagestream-lexisnexis-optout']), []);

  const sourceIds = new Set([...Object.keys(sources), 'registry-vt-2026-10-19']);
  const brokerErrs = validateBroker(broker, { sourceIds });
  assert.deepEqual(brokerErrs, [], `Broker validation errors: ${brokerErrs.join(', ')}`);
  assert.equal(broker.id, 'sagestream');
  assert.equal(broker.parent, 'lexisnexis');
  assert.equal(broker.optOut.method, 'web-form');
  assert.equal(broker.optOut.url, 'https://optout.lexisnexis.com/');
  assert.equal(broker.optOut.status, 'verified');
});
