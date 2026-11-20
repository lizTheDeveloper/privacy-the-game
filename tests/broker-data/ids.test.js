import { describe, it, expect } from 'vitest';
import { normalizeName, slugify } from '../../research/data-brokers/build/ids.js';

describe('normalizeName', () => {
  it('strips legal suffixes and punctuation', () => {
    expect(normalizeName('Acxiom LLC')).toBe('acxiom');
    expect(normalizeName('ACXIOM CORPORATION')).toBe('acxiom');
    expect(normalizeName('Spokeo, Inc.')).toBe('spokeo');
    expect(normalizeName('Foo L.L.C.')).toBe('foo');
  });
  it('strips stacked trailing suffixes and collapses whitespace', () => {
    expect(normalizeName('  Thomson   Reuters Holdings Inc ')).toBe('thomson reuters');
  });
  it('treats & as "and" and strips Limited', () => {
    expect(normalizeName('Dun & Bradstreet, Inc.')).toBe('dun and bradstreet');
    expect(normalizeName('DUN AND BRADSTREET INC')).toBe('dun and bradstreet');
    expect(normalizeName('Black Pearl Group Limited')).toBe('black pearl group');
    expect(normalizeName('R.L. Polk & Co.')).toBe('rl polk');
    expect(normalizeName('R.L.POLK & COMPANY')).toBe('rlpolk');
    expect(normalizeName('Johnson & Johnson')).toBe('johnson and johnson');
  });
  it('keeps suffix words that are not trailing', () => {
    expect(normalizeName('Company Kitchen LLC')).toBe('company kitchen');
  });
});

describe('slugify', () => {
  it('normalizes then hyphenates', () => {
    expect(slugify('Thomson Reuters Holdings Inc')).toBe('thomson-reuters');
  });
});
