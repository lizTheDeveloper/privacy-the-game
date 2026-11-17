import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// v7.10.1 capped the desktop button row at calc(100% - 420px). The phone rule never reset it,
// so below ~430px wide the cap went negative and squeezed QUICK QUEST, STATS, LOOK UP, PRISM,
// WHO GETS IT and WHOLE CITY into a 28px sliver down the left edge (fixed in 7.16.3).
const src = readFileSync(new URL('../src/screens/city-map.js', import.meta.url), 'utf8');

describe('city buttons on phones', () => {
  it('the phone layout lifts the desktop width cap on the button row', () => {
    // The phone block is the one that swaps the welcome-back banner to the top.
    const mobile = src.slice(src.indexOf('.welcome-back--top { display: block; }'));
    const rule = mobile.match(/\.city-actions\s*\{([^}]*)\}/);
    expect(rule, 'phone .city-actions rule').toBeTruthy();
    expect(rule[1]).toMatch(/max-width:\s*none/);
  });
});
