import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMilestoneCard, generateStatCard, loadCardFonts } from '../src/utils/milestone-card.js';

// The owner (2026-11-21), after titles moved to IBM Plex Sans in 7.46.0: "replace Orbitron
// everywhere — except the logo." Buttons, tabs, folds, back links, labels, badges, big figures
// and the share cards' kicker are Plex (--font-title). Orbitron is only the RECLAIM CITY logo.

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : ['.js', '.css', '.html'].includes(extname(p)) ? [p] : [];
});
const FILES = Object.fromEntries(walk(SRC).map((p) => [relative(SRC, p), readFileSync(p, 'utf8')]));
// Comments may say "Orbitron"; only code counts. (A // after a ':' is a URL, not a comment.)
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const count = (s, re) => (s.match(re) || []).length;

// Every place the logo is allowed to be Orbitron. Nothing else may name it.
const ORBITRON_ALLOWED = {
  'style.css': [/--font-logo: 'Orbitron', sans-serif;/],
  'focus-music.html': [/--font-logo: 'Orbitron', sans-serif;/, /family=Orbitron:wght@700;800&/],
  'utils/milestone-card.js': [/const LOGO_FONT = '700 22px Orbitron, sans-serif';/],
  'index.html': [/family=Orbitron:wght@700;800&/],
};
// Every element drawn in the logo token.
const LOGO_TOKEN_USES = {
  'style.css': [/^\.hud-brand \{[^}]*font-family: var\(--font-logo\);/m],
  'app.js': [/<div class="welcome-logo" style="font-family: var\(--font-logo\);[^"]*">RECLAIM CITY<\/div>/],
  'focus-music.html': [/\.brand \{ font: 800 12px\/1 var\(--font-logo\);/],
};

describe('Orbitron only on the RECLAIM CITY logo', () => {
  it('scans the whole game', () => {
    expect(Object.keys(FILES).length).toBeGreaterThan(50);
    expect(FILES['screens/district.js']).toBeDefined();
  });

  it('nothing names Orbitron outside the logo allowlist', () => {
    for (const [file, text] of Object.entries(FILES)) {
      const allowed = ORBITRON_ALLOWED[file] || [];
      const src = code(text);
      for (const re of allowed) expect(src, `${file}: ${re}`).toMatch(re);
      expect(count(src, /Orbitron/g), `${file} names Orbitron outside the logo`).toBe(allowed.length);
    }
  });

  it('only the logo uses --font-logo', () => {
    for (const [file, text] of Object.entries(FILES)) {
      const uses = LOGO_TOKEN_USES[file] || [];
      const src = code(text);
      for (const re of uses) expect(src, `${file}: ${re}`).toMatch(re);
      expect(count(src, /var\(--font-logo\)/g), `${file} uses --font-logo outside the logo`).toBe(uses.length);
    }
  });

  it('--font-display is gone: one Plex token, --font-title, and one logo token', () => {
    for (const [file, text] of Object.entries(FILES)) expect(code(text), file).not.toMatch(/--font-display/);
    const css = FILES['style.css'];
    expect(css).toMatch(/--font-title: 'IBM Plex Sans', system-ui, sans-serif;/);
    expect(css).toMatch(/--font-mono: 'JetBrains Mono', monospace;/);
  });

  it('buttons, tabs, folds, labels and badges are Plex', () => {
    const css = FILES['style.css'];
    const rule = (sel) => css.match(new RegExp(`^${sel.replace(/[.>]/g, (c) => `\\${c}`)} \\{[^}]*\\}`, 'm'))?.[0] || '';
    for (const sel of ['.btn-primary', '.btn-secondary', '.interior-btn', '.section-label', '.stat-label', '.building-badge', '.floor-head',
      '.entry-where', '.devices-title', '.next-up-label', '.screen-eyebrow', '.pm-all-changed', '.intro-more-toggle',
      '.explainer-more > summary', '.phone-fold > summary', '.more-fold > summary', '.scout-remind > summary']) {
      expect(rule(sel), sel).toContain('font-family: var(--font-title)');
    }
    expect(FILES['screens/district.js']).toMatch(/: 'padding: 10px 4px; font-family: var\(--font-title\);/); // SURVEY RECON FORTIFY RECLAIM
    expect(FILES['screens/city-map.js']).toMatch(/\.city-btn \{[^}]*font-family: var\(--font-title\)/);
    expect(FILES['screens/city-map.js']).toMatch(/\.city-cluster::after \{[^}]*font-family: var\(--font-title\)/); // "// ENTER"
  });

  it('Plex tracking: no Plex text is spaced wider than 1px (Orbitron was 1–8px)', () => {
    for (const [file, text] of Object.entries(FILES)) {
      const src = code(text);
      // Each declaration block (a CSS rule or one inline style) that sets the Plex token.
      for (const m of src.matchAll(/[{"'`]([^{}"'`]*font-family:\s*var\(--font-title\)[^{}"'`]*)/g)) {
        for (const ls of m[1].matchAll(/letter-spacing:\s*([\d.]+)px/g)) {
          expect(Number(ls[1]), `${file}: ${m[1].trim().slice(0, 90)}`).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('loads Orbitron only in the weights the logo uses, and Plex 400–700', () => {
    const link = FILES['index.html'].match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)">/)[1];
    expect(link).toContain('family=Orbitron:wght@700;800&');
    expect(link).toContain('family=IBM+Plex+Sans:wght@400;500;600;700');
  });

  it('Focus music loads the game\'s own font link and uses its tokens: Orbitron on the logo, Plex and Inter elsewhere', () => {
    const link = (f) => FILES[f].match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)">/)?.[1];
    expect(link('focus-music.html')).toBe(link('index.html'));
    const css = code(FILES['focus-music.html']);
    expect(css).toMatch(/--font-title: 'IBM Plex Sans', system-ui, sans-serif;/);
    expect(css).toMatch(/--font-body: 'Inter', system-ui, sans-serif;/);
    expect(css).toMatch(/body \{[^}]*font: 15px\/1\.4 var\(--font-body\);/);
    expect(css).toMatch(/button \{[^}]*font-family: var\(--font-title\);/);
  });
});

describe('the share cards', () => {
  let saved;
  afterEach(() => { globalThis.document = saved; });
  const capture = (draw) => {
    saved = globalThis.document;
    const drawn = [];
    const ctx = new Proxy({ font: '', measureText: (t) => ({ width: String(t).length * 10 }), fillText(t) { drawn.push([String(t), ctx.font]); },
      createLinearGradient: () => ({ addColorStop() {} }) }, {
      get: (o, k) => (k in o ? o[k] : () => {}),
      set: (o, k, v) => { o[k] = v; return true; },
    });
    globalThis.document = { createElement: () => ({ getContext: () => ctx }) };
    draw();
    globalThis.document = saved;
    return drawn;
  };

  it('only the RECLAIM CITY wordmark is Orbitron; DISTRICT LIBERATED and the name are Plex', () => {
    const drawn = capture(() => generateMilestoneCard('The Master Keys', { accountsSecured: 3, addressesBreached: 1, integrityPercent: 40 }));
    const fontOf = (t) => drawn.find(([x]) => x === t)?.[1];
    expect(fontOf('RECLAIM CITY')).toBe('700 22px Orbitron, sans-serif');
    expect(fontOf('DISTRICT LIBERATED')).toMatch(/^600 21px "IBM Plex Sans"/);
    expect(fontOf('THE MASTER KEYS')).toMatch(/"IBM Plex Sans"/);
    expect(drawn.filter(([, f]) => /Orbitron/.test(f)).map(([t]) => t)).toEqual(['RECLAIM CITY']);
  });

  it('the stat card: wordmark Orbitron; kicker and big figure Plex', () => {
    const drawn = capture(() => generateStatCard({ kicker: 'The whole city', big: '6,000', what: 'players', sub: 'so far' }));
    const fontOf = (t) => drawn.find(([x]) => x === t)?.[1];
    expect(fontOf('RECLAIM CITY')).toMatch(/Orbitron/);
    expect(fontOf('THE WHOLE CITY')).toMatch(/"IBM Plex Sans"/);
    expect(fontOf('6,000')).toMatch(/^800 \d+px "IBM Plex Sans"/);
    expect(drawn.filter(([, f]) => /Orbitron/.test(f)).map(([t]) => t)).toEqual(['RECLAIM CITY']);
  });

  it('reads the same whatever the checks found: RECLAIM CITY, DISTRICT LIBERATED, the district name', () => {
    const head = (stats) => capture(() => generateMilestoneCard('The Vault', stats)).slice(0, 3);
    const a = head({ accountsSecured: 0, addressesBreached: null, integrityPercent: 0 });
    const b = head({ accountsSecured: 9, addressesBreached: 4, integrityPercent: 100 });
    expect(a).toEqual(b);
    expect(a.map(([t]) => t)).toEqual(['RECLAIM CITY', 'DISTRICT LIBERATED', 'THE VAULT']);
  });

  it('asks for the card fonts (including the wordmark’s Orbitron 700) and never throws', async () => {
    const asked = [];
    await loadCardFonts({ load: (f) => { asked.push(f); return Promise.resolve([]); } });
    expect(asked).toContain('700 22px Orbitron, sans-serif');
    expect(asked.some((f) => f.includes('IBM Plex Sans'))).toBe(true);
    await expect(loadCardFonts({ load: () => Promise.reject(new Error('offline')) })).resolves.toBeUndefined();
    await expect(loadCardFonts(undefined)).resolves.toBeUndefined();
  });
});
