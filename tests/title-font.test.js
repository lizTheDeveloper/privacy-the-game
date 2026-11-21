import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderDistrict } from '../src/screens/district.js';
import { renderCityMap } from '../src/screens/city-map.js';
import { generateMilestoneCard } from '../src/utils/milestone-card.js';
import { createInitialState } from '../src/state.js';
import { setReadLevel } from '../src/utils/reading.js';

// The owner (2026-11-21): "can we switch the font for like, district titles from that one to
// IBM PLEX SANS - we have gotten some readability complaints". Titles and headings use
// --font-title (IBM Plex Sans); small labels, badges, buttons and the logo stay Orbitron.

const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const rule = (sel) => css.match(new RegExp(`^${sel.replace('.', '\\.')} \\{[^}]*\\}`, 'm'))?.[0] || '';

describe('titles in IBM Plex Sans', () => {
  it('loads IBM Plex Sans 400–700 from Google Fonts, alongside the others', () => {
    const link = html.match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)">/)[1];
    expect(link).toContain('family=IBM+Plex+Sans:wght@400;500;600;700');
    expect(link).toContain('family=Orbitron');
    expect(link).toContain('family=Inter');
  });

  it('a --font-title token; --font-display is still Orbitron', () => {
    expect(css).toMatch(/--font-title: 'IBM Plex Sans', system-ui, sans-serif;/);
    expect(css).toMatch(/--font-display: 'Orbitron', sans-serif;/);
  });

  it('district, building and mission titles use it, with Plex-sized tracking', () => {
    for (const sel of ['.district-name', '.interior-title', '.focus-title']) {
      const r = rule(sel);
      expect(r, sel).toContain('font-family: var(--font-title)');
      expect(r, sel).toContain('letter-spacing: 0.5px');
    }
  });

  it('small labels, buttons and the logo stay Orbitron', () => {
    for (const sel of ['.btn-primary', '.btn-secondary', '.section-label', '.building-badge', '.interior-btn', '.floor-head', '.entry-where', '.hud-brand']) {
      expect(rule(sel), sel).toContain('font-family: var(--font-display)');
    }
  });

  it('the city map’s district names, in both modes', () => {
    for (const level of ['simplest', 'full']) {
      const out = renderCityMap(setReadLevel(createInitialState(), level));
      expect(out).toMatch(/\.city-label__name \{[^}]*font-family: var\(--font-title\)/);
    }
  });

  it('a district’s own building rows name each building in it', () => {
    const out = renderDistrict(setReadLevel(createInitialState(), 'full'), 'master-keys');
    expect(out).toContain('font-family: var(--font-title)');
  });
});

describe('the share card', () => {
  let saved;
  afterEach(() => { globalThis.document = saved; });

  it('draws the district name in Plex; the wordmark and kicker stay Orbitron; the words are unchanged', () => {
    saved = globalThis.document;
    const drawn = [];
    const ctx = new Proxy({ font: '', measureText: (t) => ({ width: String(t).length * 10 }), fillText(t) { drawn.push([String(t), ctx.font]); },
      createLinearGradient: () => ({ addColorStop() {} }) }, {
      get: (o, k) => (k in o ? o[k] : () => {}),
      set: (o, k, v) => { o[k] = v; return true; },
    });
    globalThis.document = { createElement: () => ({ getContext: () => ctx }) };
    generateMilestoneCard('THE MASTER KEYS', { accountsSecured: 3, addressesBreached: 1, integrityPercent: 40 });
    const fontOf = (t) => drawn.find(([x]) => x === t)?.[1];
    expect(fontOf('THE MASTER KEYS')).toMatch(/"IBM Plex Sans"/);
    expect(fontOf('RECLAIM CITY')).toMatch(/Orbitron/);
    expect(fontOf('DISTRICT LIBERATED')).toMatch(/Orbitron/);
  });
});
