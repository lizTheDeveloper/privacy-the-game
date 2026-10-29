import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { serialize } from '../../research/data-brokers/build/export.js';

const src = readFileSync('src/app.js', 'utf8');

describe('broker map wiring (source checks)', () => {
  it('Escape closes the card directly, not through a swallowable click', () => {
    const i = src.indexOf("e.key === 'Escape' && (selectedId || selectedSat !== null)");
    expect(i).toBeGreaterThan(-1);
    const block = src.slice(i, i + 400);
    expect(block).toContain('closeCard()');
    expect(block).not.toContain('close.click()');
  });
  it('the click swallow lets CLOSE through', () => {
    const i = src.indexOf('swallowClickUntil) return;');
    expect(src.slice(i, i + 700)).toContain('[data-action="close-star"]');
  });
  it('the sheet height cap is cleared outside phone width', () => {
    expect(src).toContain("card.style.maxHeight = ''");
    expect(src).toContain("removeProperty('max-height')");
  });
});

describe('export serialization', () => {
  it('is compact with a trailing newline', () => {
    const t = serialize({ a: [1, 2], b: { c: 1 } });
    expect(t).toBe('{"a":[1,2],"b":{"c":1}}\n');
  });
});

import { wheelZooms } from '../../src/utils/map-gestures.js';
import { shortName } from '../../src/utils/broker-view.js';

describe('desktop wheel', () => {
  it('a plain wheel scrolls the page; ctrl/cmd wheel and a trackpad pinch zoom', () => {
    expect(wheelZooms({ deltaY: 100 })).toBe(false);
    expect(wheelZooms({ deltaY: 100, ctrlKey: false, metaKey: false })).toBe(false);
    expect(wheelZooms({ deltaY: -4, ctrlKey: true })).toBe(true);
    expect(wheelZooms({ deltaY: -100, metaKey: true })).toBe(true);
    expect(wheelZooms(null)).toBe(false);
  });
  it('mapWheel only prevents default when it zooms', () => {
    const i = src.indexOf('function mapWheel');
    expect(src.slice(i, i + 500)).toContain('!wheelZooms(e)) return;');
  });
});

describe('shortName', () => {
  it('drops "and its subsidiaries and affiliates" and d/b/a tails', () => {
    expect(shortName('BeenVerified, LLC d/b/a BeenVerified and its subsidiaries and affiliates')).toBe('BeenVerified');
    expect(shortName('Acme Data, Inc. and its subsidiaries and affiliates')).toBe('Acme Data');
    expect(shortName('Foo Holdings LLC dba Foo People Search')).toBe('Foo Holdings');
    expect(shortName('Foo Holdings LLC DBA Foo')).toBe('Foo Holdings');
    expect(shortName('Spokeo, Inc.')).toBe('Spokeo');
  });
});

describe('first-visit Scout overlay wiring', () => {
  it('dismiss-scout is a map action and the press does not start a map gesture', () => {
    expect(src).toContain("'dismiss-scout'");
    expect(src).toContain(".constellation-controls, .constellation-scout'");
  });

  it('opening a star card dismisses the note, so the selected star is never left under it', () => {
    const body = src.slice(src.indexOf('function openCard('), src.indexOf('function closeCard('));
    expect(body).toMatch(/mapScoutDismissed = true;/);
  });
});
