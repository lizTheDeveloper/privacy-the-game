// CLI: validate the whole dataset, the research records in staging/ and the curation config in
// build/ (the files a contributor may edit). Exits 1 on any error.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateAll } from './schema.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { errors, counts } = await validateAll(root);
for (const e of errors) console.error(e);
console.log(`brokers: ${counts.brokers} links: ${counts.links} published: ${counts.published} sources: ${counts.sources}`);
console.log(`staging: ${counts.stagingSources} sources, ${counts.stagingBrokers} brokers, ${counts.stagingLinks} links; config files: ${counts.configFiles}`);
if (errors.length) {
  console.error(`${errors.length} error(s)`);
  process.exit(1);
}
