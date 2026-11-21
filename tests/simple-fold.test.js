// Liz's layout rule (7.45.1): on a phone in Simple, each screen's one bright button sits on the
// first screen. A building's roof folds to one line on a phone ("2 need fixing"), Scout's line is a
// small bubble, and the name and the district share a line. The broker sky drops the empty line
// under the map. Advanced is unchanged. Vitest has no layout, so these check the structure that
// makes the space; the pixel numbers are measured in a browser (see the PR).
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
import { renderBuildingInterior, roofSummary } from '../src/screens/building.js';
import { renderBrokerMap } from '../src/screens/broker-map.js';
import { setReadLevel } from '../src/utils/reading.js';
import { INTERIORS } from '../src/data/interiors/index.js';
import { INTERIOR_LINES } from '../src/data/dialogue.js';
import { _resetSeeEverything } from '../src/components/see-everything.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); _resetSeeEverything(); });

const NOW = new Date('2026-11-21T00:00:00Z');
const file = (s, id, rec) => updateMission(s, id, { status: 'completed', ...rec });
const simple = (s) => setReadLevel(s, 'simplest');
const adv = (s) => setReadLevel(s, 'full');
const render = (s, id = 'gmail') => renderBuildingInterior(toggleAccount(s, id, true), id, { now: NOW });
const primaries = (html) => (html.replace(/<style>[\s\S]*?<\/style>/g, '').match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
const roofTag = (html) => html.match(/<details class="floor floor--roof"[^>]*>/)?.[0] ?? '';
const roofHtml = (html) => html.match(/<details class="floor floor--roof"[\s\S]*?<\/details>/)?.[0] ?? '';

function mid(b = 'gmail') {
  let s = file(createInitialState(), `${b}-recon-breach`, { finding: '1-2-breaches', password_exposed: 'unsure' });
  s = file(s, `${b}-fortify-2fa`, { method: 'sms', action: 'enabled-2fa' });
  return file(s, `${b}-recon-login`, { finding: 'no-breaches' });
}

describe('Simple building: the roof is one line on a phone, its rows one tap away', () => {
  it('the roof folds on a phone (open from 900px), its head says how it is, and every row is still inside', () => {
    for (const b of ['gmail', 'facebook', 'outlook']) {
      for (const s of [createInitialState(), mid(b)]) {
        const html = render(simple(s), b);
        expect(roofTag(html), b).toBe('<details class="floor floor--roof" data-open-desktop data-floor="roof">');
        expect(roofHtml(html)).toMatch(/<summary class="floor-head"><span>▲ Roof · Health check<\/span><span class="roof-sum roof-sum--[a-z-]+" data-roof-sum>[^<]+<\/span><span class="floor-chev"/);
        // Folded, not removed: the same rows as Advanced.
        const rows = (h) => (roofHtml(h).match(/data-row="[^"]+"/g) || []);
        expect(rows(html).length).toBeGreaterThan(0);
        expect(rows(html)).toEqual(rows(render(adv(s), b)));
      }
    }
  });

  it('the head counts what needs fixing, else what is unchecked, else says all good', () => {
    expect(render(simple(mid()))).toContain('<span class="roof-sum roof-sum--crit" data-roof-sum>3 need fixing</span>');
    expect(render(simple(createInitialState()))).toMatch(/<span class="roof-sum roof-sum--not-checked" data-roof-sum>\d+ not checked<\/span>/);
    expect(roofSummary([{ status: 'warn' }, { status: 'ok' }])).toEqual({ text: '1 needs fixing', tone: 'warn' });
    expect(roofSummary([{ status: 'ok' }, { status: 'ok' }])).toEqual({ text: 'All good', tone: 'ok' });
  });

  it('the first door stays below the roof and keeps the one bright button', () => {
    for (const b of Object.keys(INTERIORS)) {
      for (const s of [createInitialState(), mid(b)]) {
        const html = render(simple(s), b);
        expect(html.indexOf('floor--roof"')).toBeLessThan(html.indexOf('floor--ground"'));
        expect(primaries(html), b).toBeLessThanOrEqual(1);
        // The bright button is never folded away inside the roof on a phone.
        expect(roofHtml(html)).not.toContain('btn-primary');
      }
    }
  });

  it('when a roof row’s Fix it is the bright button, the roof starts open', () => {
    const s = file(createInitialState(), 'gmail-recon-breach', { finding: '1-2-breaches', password_exposed: 'no' });
    const html = render(simple(s));
    expect(roofTag(html)).toBe('<details class="floor floor--roof" open data-floor="roof">');
    expect(roofHtml(html)).toMatch(/class="interior-btn btn-primary ant-fix"[^>]*>Fix it/);
    expect(primaries(html)).toBe(1);
  });

  it('a roof the player folded stays folded, and the choice is theirs', () => {
    const s = simple(createInitialState());
    const folded = { ...s, interior: { gmail: { visited: true, floors: { roof: false } } } };
    expect(roofTag(render(folded))).toBe('<details class="floor floor--roof" data-floor="roof">');
  });
});

describe('Simple building: the rest above the door, tighter', () => {
  it('Scout’s line is a small bubble, with every word of it', () => {
    const html = render(simple(createInitialState()));
    const bubble = html.match(/<div class="interior-scout interior-scout--simple" data-scout="interior" role="note">[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(bubble).toContain('<img src="assets/characters/scout_0.png" alt="Scout" width="32" height="32">');
    const line = bubble.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '';
    expect(INTERIOR_LINES.firstVisit.map((l) => l.replace(/\{name\}/g, 'Gmail'))).toContain(line);
  });

  it('the name and the district share one line; the door count sits beside its bar', () => {
    const html = render(simple(mid()));
    expect(html).toContain('<div class="interior-head"><div class="interior-title">GMAIL</div><div class="interior-sub">The Master Keys</div></div>');
    expect(html).toMatch(/<div class="interior-doors">\s*<div class="interior-doors-words">1 of 4 doors locked<\/div>\s*<div class="fill-bar/);
    // The leaks chip is still there, still a fold.
    expect(html).toContain('<summary>3 leaks name Gmail');
  });

  it('the styles that make the space are Simple-only', () => {
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toContain('.interior-scout.interior-scout--simple {');
    expect(css).toMatch(/\.interior--simple \.interior-doors \{ display: flex;/);
    // The roof's one line is its head: a 44px tap target.
    expect(css).toMatch(/\.floor-head \{[^}]*min-height: 44px/);
  });
});

// 7.45.2: with two-step sign-in set up before the breach check, the open door is the 2nd or 3rd
// in the list and its SEAL IT fell below a phone's first screen (843 to 899px on 390x844). In
// Simple the open door's fix and its SEAL IT now come before how they get in. Same words.
describe('Simple building: an open door shows its fix and SEAL IT before how they get in', () => {
  const smsOnly = (b) => file(createInitialState(), `${b}-fortify-2fa`, { method: 'sms', action: 'enabled-2fa' });
  const authOnly = (b) => file(createInitialState(), `${b}-fortify-2fa`, { method: 'authenticator', action: 'enabled-2fa' });
  const entries = (html) => html.match(/<div class="entry entry--[\s\S]*?<!-- \/entry -->/g) || [];
  const litDoor = (html) => entries(html).find((e) => e.includes('btn-primary')) ?? '';
  const at = (html, re) => html.search(re);
  const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').sort();

  it('the lit open door: fix, then SEAL IT, then how they get in, in every building', () => {
    let checked = 0;
    for (const b of Object.keys(INTERIORS)) {
      for (const s of [smsOnly(b), authOnly(b), mid(b)]) {
        const door = litDoor(render(simple(s), b));
        if (!door.includes('data-state="open"')) continue;
        checked++;
        const seal = at(door, /class="interior-btn btn-primary"[^>]*>SEAL IT/);
        expect(seal, b).toBeGreaterThan(-1);
        expect(seal, b).toBeLessThan(at(door, /class="entry-how"/));
        if (door.includes('entry-fix')) expect(at(door, /class="entry-fix"/), b).toBeLessThan(seal);
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('every open door in Simple is in that order, lit or outlined; others keep theirs', () => {
    for (const b of Object.keys(INTERIORS)) {
      for (const e of entries(render(simple(authOnly(b)), b))) {
        const how = at(e, /class="entry-how"/);
        const btn = at(e, /class="interior-btn /);
        if (btn < 0) continue;
        if (e.includes('data-state="open"')) expect(btn, b).toBeLessThan(how);
        else expect(btn, b).toBeGreaterThan(how);
      }
    }
  });

  it('nothing is dropped: each door has the same words in Simple and Advanced, one bright button', () => {
    for (const b of Object.keys(INTERIORS)) {
      for (const s of [smsOnly(b), authOnly(b)]) {
        const sim = entries(render(simple(s), b));
        const ad = entries(render(adv(s), b));
        expect(sim.length, b).toBe(ad.length);
        sim.forEach((e, i) => expect(words(e), `${b} #${i}`).toEqual(words(ad[i])));
        expect(primaries(render(simple(s), b)), b).toBe(1);
      }
    }
  });

  it('Advanced keeps how they get in before the fix and SEAL IT', () => {
    const door = litDoor(render(adv(authOnly('outlook')), 'outlook'));
    expect(door).toContain('data-state="open"');
    const how = at(door, /class="entry-how"/);
    expect(how).toBeGreaterThan(-1);
    expect(how).toBeLessThan(at(door, /class="entry-fix"/));
    expect(at(door, /class="entry-fix"/)).toBeLessThan(at(door, /class="interior-btn btn-primary"/));
  });

  it('the room under the moved button is a Simple-only style', () => {
    const css = readFileSync('src/style.css', 'utf8');
    expect(css).toContain('.interior--simple .interior-btn + .entry-how { margin-top: 12px; }');
  });
});

describe('Advanced building: unchanged', () => {
  it('the roof starts open with its rows, devices and antennas, the big Scout bubble, no summary', () => {
    for (const s of [createInitialState(), mid()]) {
      const html = render(adv(s));
      expect(roofTag(html)).toBe('<details class="floor floor--roof" open data-floor="roof">');
      expect(html).not.toContain('roof-sum');
      expect(html).not.toContain('interior-scout--simple');
      expect(html).not.toContain('interior-head');
      expect(html).not.toContain('interior--simple');
      expect(html).toMatch(/<div class="interior-title">GMAIL<\/div>\s*<div class="interior-sub">The Master Keys · tap a floor to fold it<\/div>/);
      expect(html).toContain('<div class="interior-scout" data-scout="interior">');
      expect(roofHtml(html)).toContain('data-devices');
    }
  });
});

describe('the broker sky, Simple: no empty line between Scout and the next opt-out', () => {
  const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
  const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
  const sky = (s, opts = {}) => renderBrokerMap(s, { status: 'ready', data: { map, layout }, today: '2026-11-21', ...opts });

  it('the empty name line takes no room in Simple; it stays for screen readers and for a tapped star', () => {
    const html = sky({ ...simple(createInitialState()), home: 'US-NY' }, { firstVisit: true });
    expect(html).toContain('.broker-map--simple .constellation-pick:empty{min-height:0;margin:0}');
    expect(html).toContain('<p class="constellation-pick" aria-live="polite"></p>');
    expect(html).toMatch(/class="constellation-scout" role="note"/);
    expect(primaries(html)).toBe(1);
    // Advanced keeps the rule out of play: its screen is not .broker-map--simple.
    expect(sky(adv(createInitialState()), { firstVisit: true })).toContain('class="screen broker-map"');
  });
});
