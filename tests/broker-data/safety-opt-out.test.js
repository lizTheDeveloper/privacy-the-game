import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSource, validateBroker } from '../../research/data-brokers/build/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

test('Safety Holdings Inc. (safety.json) staged opt-out policy and sources pass schema validation', () => {
  const sourcesPath = path.join(ROOT, 'research/data-brokers/staging/policies/sources.json');
  const brokerPath = path.join(ROOT, 'research/data-brokers/staging/policies/brokers/safety.json');
  const baseBrokerPath = path.join(ROOT, 'research/data-brokers/brokers/safety.json');

  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  const staged = JSON.parse(fs.readFileSync(brokerPath, 'utf8'));
  const baseBroker = JSON.parse(fs.readFileSync(baseBrokerPath, 'utf8'));

  assert.ok(sources['pol-sambasafety-privacy'], 'pol-sambasafety-privacy must exist in sources.json');
  assert.ok(sources['pol-sambasafety-consumer-portal'], 'pol-sambasafety-consumer-portal must exist in sources.json');

  assert.deepEqual(validateSource('pol-sambasafety-privacy', sources['pol-sambasafety-privacy']), []);
  assert.deepEqual(validateSource('pol-sambasafety-consumer-portal', sources['pol-sambasafety-consumer-portal']), []);

  const sourceIds = new Set([...Object.keys(sources), 'registry-vt-2026-10-19']);
  const merged = {
    ...baseBroker,
    aliases: staged.aliases,
    kind: staged.kind,
    sells: staged.sells,
    optOut: staged.optOut,
    sources: staged.sources,
  };

  const brokerErrors = validateBroker(merged, { sourceIds });
  assert.deepEqual(brokerErrors, []);
  assert.equal(merged.optOut.method, 'none');
  assert.equal(merged.optOut.status, 'verified');
  assert.equal(merged.optOut.url, 'https://www.sambasafety.com/privacy-policy/');
});
