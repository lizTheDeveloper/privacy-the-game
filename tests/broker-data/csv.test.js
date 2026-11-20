import { describe, it, expect } from 'vitest';
import { parseCsv } from '../../research/data-brokers/build/csv.js';

describe('parseCsv', () => {
  it('handles BOM, quotes, escapes, embedded newlines and CRLF', () => {
    expect(parseCsv('﻿a,"b,c","d ""q"""\r\n1,"x\ny",3\n')).toEqual([['a', 'b,c', 'd "q"'], ['1', 'x\ny', '3']]);
  });
  it('keeps a last row with no trailing newline and empty fields', () => {
    expect(parseCsv('a,,c\n1,2,')).toEqual([['a', '', 'c'], ['1', '2', '']]);
  });
  it('returns no rows for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});
