import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The play portal serves .css with a 7-day cache and index.html with none.
// Without a fresh query string a returning player runs new scripts against
// last week's stylesheet (v6.3.0 shipped that way).
describe('stylesheet cache-bust', () => {
  it('index.html asks for style.css?v=<package.json version>', () => {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
    const links = [...html.matchAll(/href="(style\.css[^"]*)"/g)].map((m) => m[1]);
    expect(links).toEqual([`style.css?v=${version}`]);
  });
});
