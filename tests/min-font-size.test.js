import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMilestoneCard, generateStatCard, CARD_MIN_PX } from '../src/utils/milestone-card.js';
import { cityStats } from '../src/screens/city-together.js';

// The owner (2026-11-21), after the move to IBM Plex Sans (7.47.0) made the small labels look smaller
// still: no readable text under 11px, in any font, on a 390px phone, in Simple or Advanced. 7.48.0
// raised every size under 11px (7px IN A ROW, 8px INTEGRITY, 9.5px district names...) to 11px.

const FLOOR = 11;
const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : ['.js', '.css', '.html'].includes(extname(p)) ? [p] : [];
});
const FILES = Object.fromEntries(walk(SRC).map((p) => [relative(SRC, p), readFileSync(p, 'utf8')]));
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const lineOf = (text, i) => text.slice(0, i).split('\n').length;

// Sizes under 11px that are not words. Each entry: file, the exact declaration, and why.
// (Nothing is on it today: every small size in src/ was text. Keep it that way, or say why here.)
const ALLOWED = [];
const allowed = (file, decl) => ALLOWED.some((a) => a.file === file && a.decl === decl);

describe('no readable text under 11px', () => {
  it('scans the whole game', () => {
    expect(Object.keys(FILES).length).toBeGreaterThan(50);
    expect(FILES['style.css']).toBeDefined();
    expect(FILES['screens/city-map.js']).toBeDefined();
  });

  it('every allowlist entry is still there and justified', () => {
    for (const a of ALLOWED) {
      expect(a.why, `${a.file}: ${a.decl}`).toMatch(/\w{12,}/);
      expect(FILES[a.file], a.file).toContain(a.decl);
    }
  });

  it('no CSS or inline font-size in px is under 11px (style.css, <style> blocks and JS templates)', () => {
    const bad = [];
    for (const [file, text] of Object.entries(FILES)) {
      const src = code(text);
      for (const m of src.matchAll(/font-size\s*:\s*([\d.]+)px/g)) {
        if (Number(m[1]) < FLOOR && !allowed(file, m[0])) bad.push(`${file}:${lineOf(src, m.index)} ${m[0]}`);
      }
      // The font shorthand: "font: 800 12px/1 ...".
      for (const m of src.matchAll(/\bfont\s*:\s*(?:[a-z\d]+\s+)*?([\d.]+)px/g)) {
        if (Number(m[1]) < FLOOR && !allowed(file, m[0])) bad.push(`${file}:${lineOf(src, m.index)} ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('no size picked in a template (font-size: ${simple ? 14 : 11}px) is under 11px', () => {
    const bad = [];
    for (const [file, text] of Object.entries(FILES)) {
      const src = code(text);
      for (const m of src.matchAll(/font-size\s*:\s*\$\{([^}]*)\}px/g)) {
        // The sizes are the ternary's results (after ? or :), not what it compares (i === 0).
        for (const n of m[1].matchAll(/(?:[?:]|^)\s*(\d+(?:\.\d+)?)(?![\w.])/g)) {
          if (Number(n[1]) < FLOOR) bad.push(`${file}:${lineOf(src, m.index)} ${m[0]}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('no font-size in rem or em that could land under 11px (0.6875rem is 11px)', () => {
    const bad = [];
    for (const [file, text] of Object.entries(FILES)) {
      const src = code(text);
      for (const m of src.matchAll(/font-size\s*:\s*([\d.]+)rem/g)) if (Number(m[1]) * 16 < FLOOR) bad.push(`${file} ${m[0]}`);
    }
    expect(bad).toEqual([]);
    // The one em size: a gear chip inside walkthrough steps of 14px and up (0.85em of 14px is 11.9px).
    const ems = Object.entries(FILES).flatMap(([file, text]) => [...code(text).matchAll(/font-size\s*:\s*[\d.]+em/g)].map((m) => `${file} ${m[0]}`));
    expect(ems).toEqual(['style.css font-size: 0.85em']);
  });

  it('the broker sky draws its names and satellites at 11 CSS px or more', () => {
    const c = FILES['components/constellation.js'];
    expect(c).toMatch(/^const LABEL_PX = (\d+);/m);
    for (const name of ['LABEL_PX', 'STAR_LABEL_PX', 'CONST_NAME_PX']) {
      const v = Number(c.match(new RegExp(`^(?:export )?const ${name} = ([\\d.]+);`, 'm'))[1]);
      expect(v, name).toBeGreaterThanOrEqual(FLOOR);
    }
    // A satellite's initials are drawn at font-size N inside a group scaled to 1 CSS px per unit.
    expect(c).toMatch(/<text class="sat-name" x="0" y="\d+" font-size="11" text-anchor="middle">/);
  });

  it('the phone copies of the PRISM and government maps read at 11px on a 390px phone', () => {
    // PRISM: the 360-unit drawing fills about 356px, so its sizes are near enough CSS px.
    const prism = FILES['screens/prism.js'];
    const narrow = prism.match(/const NARROW = \{([^}]*)\}/)[1];
    for (const m of narrow.matchAll(/(\w+Fs): (\d+)/g)) expect(Number(m[2]) * (356 / 360), m[1]).toBeGreaterThanOrEqual(FLOOR);
    expect(prism).toMatch(/@media \(max-width:639px\)\{\.prism-diagram\[data-fit=wide\]\{display:none\}/);
    // Government: 420 units drawn about 364px wide, so 13 units is 11.3px.
    const gov = FILES['screens/government.js'];
    expect(Number(gov.match(/^const FS = (\d+);/m)[1]) * (364 / 420)).toBeGreaterThanOrEqual(FLOOR);
    const tier = gov.slice(gov.indexOf('function tierSvg'), gov.indexOf('function mapSvg'));
    for (const m of tier.matchAll(/font-size="([\d.]+)"/g)) expect(Number(m[1]) * (364 / 420), m[0]).toBeGreaterThanOrEqual(FLOOR);
  });
});

describe('the share cards: no word under 21px, so the 600px card reads at 11px when shown 322px wide', () => {
  let saved;
  afterEach(() => { globalThis.document = saved; });
  const capture = (draw) => {
    saved = globalThis.document;
    const drawn = [];
    // About 0.6em a character, as in the card's monospace lines.
    const ctx = new Proxy({ font: '', measureText(t) { const px = Number(/(\d+)px/.exec(ctx.font)?.[1] ?? 10); return { width: String(t).length * px * 0.6 }; },
      fillText(t, x, y, max) { drawn.push({ t: String(t), font: ctx.font, y, max }); },
      createLinearGradient: () => ({ addColorStop() {} }) }, {
      get: (o, k) => (k in o ? o[k] : () => {}),
      set: (o, k, v) => { o[k] = v; return true; },
    });
    globalThis.document = { createElement: () => ({ getContext: () => ctx }) };
    draw();
    globalThis.document = saved;
    return drawn;
  };
  const px = (font) => Number(/(\d+)px/.exec(font)[1]);

  it('the milestone card', () => {
    expect(CARD_MIN_PX * (322 / 600)).toBeGreaterThanOrEqual(FLOOR);
    for (const stats of [{ accountsSecured: 9, addressesBreached: 12, integrityPercent: 100 }, { accountsSecured: 0, addressesBreached: null, integrityPercent: 0 }]) {
      const drawn = capture(() => generateMilestoneCard('The Master Keys', stats));
      for (const d of drawn) expect(px(d.font), d.t).toBeGreaterThanOrEqual(CARD_MIN_PX);
      // Every word of the stats line is drawn, broken at its dots, none squeezed past the card's width.
      const line = drawn.filter((d) => /accounts secured|integrity|breach/.test(d.t));
      const words = (s) => s.split(/\s+|\s·\s/).filter((w) => w !== '·');
      expect(words(line.map((d) => d.t).join(' · '))).toEqual(words(`${stats.accountsSecured} accounts secured${stats.addressesBreached === null ? '' : ` · ${stats.addressesBreached} addresses found in a breach`} · ${stats.integrityPercent}% integrity`));
      for (const d of line) expect(d.t.length * px(d.font) * 0.6, d.t).toBeLessThanOrEqual(540);
      // Inside the frame (10–305) and in order.
      const ys = drawn.map((d) => d.y);
      expect(ys).toEqual([...ys].sort((a, b) => a - b));
      expect(Math.max(...ys)).toBeLessThanOrEqual(292);
    }
  });

  it('every Whole City card', () => {
    const city = { players: 6000, actions: 1, breachChecks: 1, breachRatePct: 64, breach3PlusPct: 15, passwords: 1, twoFactor: 1, passkeyOrApp: 1, smsUpgrades: 1,
      creditFreezes: 1, privacy: 1, brokerOptOuts: 1, historyReviewed: 1, districts: 2, countries: 3, phonePct: 70, ghosts: 2, optedOut: 2 };
    const stats = cityStats(city);
    expect(stats.length).toBeGreaterThan(15);
    for (const stat of stats) {
      const drawn = capture(() => generateStatCard(stat));
      for (const d of drawn) expect(px(d.font), d.t).toBeGreaterThanOrEqual(CARD_MIN_PX);
      const body = drawn.slice(3, -1).map((d) => d.t).join(' ');
      expect(body).toBe([stat.what, stat.sub].filter(Boolean).join(' '));
      expect(drawn.length - 4).toBeLessThanOrEqual(3); // three lines at most between the figure and the address
    }
  });
});
