// UI sweep #12: the one-off class banner said to delete it once the class (2026-10-29) was over.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

describe('the expired class banner is gone', () => {
  it('no file, no import, no mount call', () => {
    expect(existsSync('src/components/class-ad.js')).toBe(false);
    const app = readFileSync('src/app.js', 'utf8');
    expect(app).not.toContain('class-ad');
    expect(app).not.toContain('mountClassAd');
  });
});
