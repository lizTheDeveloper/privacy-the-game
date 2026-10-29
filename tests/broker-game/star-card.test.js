import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { starCard, optOutHrefs, COMPLAINT_FORMS } from '../../src/components/star-card.js';
import { nearestStar, nearestStarId, zoomView, VIEW_BOUNDS } from '../../src/utils/broker-view.js';
import { screenToMap, isTap, isWidest, keepStarInView, panView, pinchView, wheelView, TAP_MAX_PX, MAX_W } from '../../src/utils/map-gestures.js';
import { brokerLighting } from '../../src/utils/broker-lighting.js';
import { renderBrokerMap } from '../../src/screens/broker-map.js';
import { isPrivateBreadcrumb } from '../../src/utils/errorNoise.js';
import { createInitialState } from '../../src/state.js';

const map = JSON.parse(readFileSync('src/data/broker-map.json', 'utf8'));
const layout = JSON.parse(readFileSync('src/data/broker-layout.json', 'utf8'));
const verified = JSON.parse(readFileSync('tests/fixtures/verified-urls.json', 'utf8'));
const TODAY = '2026-10-23';
const fresh = () => createInitialState();
const l = brokerLighting(map, fresh(), TODAY);
const byId = new Map(map.brokers.map((b) => [b.id, b]));
const hrefs = (html) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
const external = (html) => hrefs(html).filter((h) => /^https?:/.test(h));

// Every archived copy the dataset carries, on a record or a link.
const archived = new Set([
  ...map.brokers.flatMap((b) => (b.sources ?? []).map((s) => s.archived)),
  ...map.links.flatMap((k) => (k.sources ?? []).map((s) => s.archived)),
]);
// A verified opt-out of this broker, or of a company a published link shows it owning.
const verifiedRoute = (u, b) => [b, ...map.links.filter((k) => k.type === 'owns' && k.from === b.id).map((k) => byId.get(k.to))]
  .some((c) => c?.optOut?.status === 'verified' && c.optOut.method !== 'none' && c.optOut.url === u);
const allowedExternal = (u, b) => verifiedRoute(u, b)
  || (archived.has(u) && u.startsWith('https://web.archive.org/'))
  || Object.hasOwn(verified.urls, u);

describe('nearestStar / nearestStarId', () => {
  it('nearestStar finds the closest star within maxDist', () => {
    const [id, x, y] = layout.stars[0];
    expect(nearestStar(layout, x + 0.5, y, 24)).toBe(0);
    expect(nearestStarId(layout, x + 0.5, y, 24)).toBe(id);
  });
  it('nearestStar is null beyond maxDist', () => {
    expect(nearestStarId({ stars: [['a', 100, 100, 2]] }, 300, 300, 24)).toBeNull();
    expect(nearestStarId({}, 1, 1, 24)).toBeNull();
  });
});

describe('zoomView', () => {
  it('zoomView steps and clamps', () => {
    expect(zoomView({ x: 0, y: 0, w: 1000 }, 'in', 10, 10)).toEqual({ x: 0, y: 0, w: 500 });
    expect(zoomView({ x: 0, y: 0, w: 1000 }, 'out')).toEqual({ x: 0, y: 0, w: 1000 });
    expect(zoomView({ x: 0, y: 0, w: 500 }, 'in', 500, 500)).toEqual({ x: 375, y: 375, w: 250 });
    expect(zoomView({ x: 375, y: 375, w: 250 }, 'out')).toEqual({ x: 250, y: 250, w: 500 });
    expect(zoomView({ x: 0, y: 0, w: 500 }, 'out', 990, 990)).toEqual({ x: 0, y: 0, w: 1000 });
    expect(zoomView({ x: 0, y: 0, w: 1000 }, 'in', 990, 990)).toEqual({ x: 500, y: 500, w: 500 });
  });
  it('keeps a non-square box\'s ratio and may pass the view bounds', () => {
    const v = zoomView({ x: 0, y: -250, w: 1000, h: 1500 }, 'in', 500, 0, VIEW_BOUNDS);
    expect(v.w).toBe(500);
    expect(v.h).toBe(750);
    expect(v.y).toBe(-375); // half a screen of sky above the map's top
    expect(zoomView({ x: 0, y: -250, w: 1000, h: 1500 }, 'in', 500, 0).y).toBe(0);
  });
});

describe('gesture math', () => {
  const rect = { left: 16, top: 100, width: 300, height: 600 };
  const view = { x: 200, y: 100, w: 300, h: 600 };
  it('maps a screen point into the map', () => {
    expect(screenToMap(view, rect, 16, 100)).toEqual({ x: 200, y: 100 });
    expect(screenToMap(view, rect, 166, 400)).toEqual({ x: 350, y: 400 });
  });
  it('maps through a letterboxed (meet) box', () => {
    const p = screenToMap({ x: 0, y: 0, w: 100, h: 100 }, { left: 0, top: 0, width: 200, height: 400 }, 100, 200);
    expect(p).toEqual({ x: 50, y: 50 });
  });
  it('a still press is a tap, however slow; a drag is not', () => {
    expect(isTap({ x: 0, y: 0, t: 0 }, { x: 5, y: 5, t: 120 })).toBe(true);
    expect(isTap({ x: 0, y: 0, t: 0 }, { x: TAP_MAX_PX, y: 0, t: 10 })).toBe(false);
    expect(isTap({ x: 0, y: 0, t: 0 }, { x: 1, y: 0, t: 2500 })).toBe(true); // a slow tap selects
    expect(isTap({ x: 0, y: 0, t: 0 }, { x: 1, y: 0, t: 10 }, 12)).toBe(false); // moved 12px on the way
    expect(isTap(null, { x: 0, y: 0, t: 0 })).toBe(false);
  });
  it('the widest view is the widest a pinch or zoom-out allows', () => {
    expect(isWidest({ x: 0, y: -228.86, w: MAX_W, h: 1457.73 })).toBe(true);
    expect(isWidest(pinchView(view, rect, [{ x: 16, y: 400 }, { x: 316, y: 400 }], [{ x: 160, y: 400 }, { x: 170, y: 400 }], VIEW_BOUNDS))).toBe(true);
    expect(isWidest(view)).toBe(false);
  });
  it('the sheet keeps the selected star in the open sky above it', () => {
    // Stage 100..700 on screen; the sheet covers from 400 down. A star at y 600 is hidden.
    const v = keepStarInView(view, rect, { x: 166, y: 600 }, 100, 400, VIEW_BOUNDS);
    const target = 100 + 300 * 0.4;
    const star = screenToMap(view, rect, 166, 600);
    expect(screenToMap(v, rect, 166, target).y).toBeCloseTo(star.y);
    expect(v.x).toBe(view.x);
    expect(keepStarInView(view, rect, { x: 166, y: 200 }, 100, 400, VIEW_BOUNDS)).toBeNull();
    const side = keepStarInView(view, rect, { x: 20, y: 200 }, 100, 400, VIEW_BOUNDS);
    expect(screenToMap(side, rect, 166, 200).x).toBeCloseTo(screenToMap(view, rect, 20, 200).x);
  });
  it('a one-finger pan moves the map with the finger', () => {
    const v = panView(view, rect, 30, -60, VIEW_BOUNDS);
    expect(v).toEqual({ x: 170, y: 160, w: 300, h: 600 });
  });
  it('a pan is clamped to the view bounds', () => {
    expect(panView(view, rect, 5000, 0, VIEW_BOUNDS).x).toBe(0);
    expect(panView(view, rect, -5000, 0, VIEW_BOUNDS).x).toBe(700);
    expect(panView(view, rect, 0, 5000, VIEW_BOUNDS).y).toBe(-470); // the satellites' band (top -170), then half a screen of sky above it
  });
  it('a pinch zooms by the spread ratio about the fingers\' midpoint', () => {
    const before = [{ x: 116, y: 400 }, { x: 216, y: 400 }];
    const after = [{ x: 66, y: 400 }, { x: 266, y: 400 }];
    const v = pinchView(view, rect, before, after, VIEW_BOUNDS);
    expect(v.w).toBeCloseTo(150);
    expect(v.h).toBeCloseTo(300);
    // The map point under the midpoint (screen 166,400 = map 350,400) is still under it.
    const p = screenToMap(v, rect, 166, 400);
    expect(p.x).toBeCloseTo(350);
    expect(p.y).toBeCloseTo(400);
  });
  it('a pinch that also moves pans with the midpoint', () => {
    const before = [{ x: 116, y: 400 }, { x: 216, y: 400 }];
    const after = [{ x: 146, y: 400 }, { x: 246, y: 400 }];
    const v = pinchView(view, rect, before, after, VIEW_BOUNDS);
    expect(v.w).toBeCloseTo(300);
    expect(v.x).toBeCloseTo(170);
  });
  it('a pinch holds the width to 100–1000 map units', () => {
    const tiny = pinchView(view, rect, [{ x: 160, y: 400 }, { x: 170, y: 400 }], [{ x: 16, y: 400 }, { x: 316, y: 400 }], VIEW_BOUNDS);
    expect(tiny.w).toBe(100);
    const huge = pinchView(view, rect, [{ x: 16, y: 400 }, { x: 316, y: 400 }], [{ x: 160, y: 400 }, { x: 170, y: 400 }], VIEW_BOUNDS);
    expect(huge.w).toBe(1000);
    expect(huge.h).toBe(2000);
  });
  it('wheel zoom keeps the point under the pointer still', () => {
    const v = wheelView(view, rect, -100, 166, 400, VIEW_BOUNDS);
    expect(v.w).toBeLessThan(300);
    const p = screenToMap(v, rect, 166, 400);
    expect(p.x).toBeCloseTo(350);
    expect(p.y).toBeCloseTo(400);
    expect(wheelView(view, rect, 100, 166, 400, VIEW_BOUNDS).w).toBeGreaterThan(300);
    expect(wheelView(view, rect, 0, 166, 400, VIEW_BOUNDS)).toEqual(view);
  });
});

describe('starCard', () => {
  it('is one section with a heading, the full name and the parent', () => {
    const html = starCard(map, l, 'acxiom');
    expect(html.startsWith('<section class="star-card"')).toBe(true);
    expect(html.match(/<section/g).length).toBe(1);
    expect(html).toContain('Part of Omnicom');
    expect(html).toContain('<button type="button" class="star-card-close" data-action="close-star">CLOSE</button>');
  });
  it('says what it sells under its label', () => {
    const html = starCard(map, l, 'spokeo');
    expect(html).toContain('WHAT ITS RECORDS SAY IT SELLS');
    expect(html).toContain('phone and people lookup');
  });
  it('a verified opt-out is a link; any other status is not', () => {
    const v = starCard(map, l, 'spokeo');
    expect(v).toContain('<a href="https://www.spokeo.com/optout" target="_blank" rel="noopener noreferrer">OPT OUT ↗</a>');
    const blocked = starCard(map, l, '33across');
    expect(blocked).not.toContain('OPT OUT ↗');
    expect(blocked).not.toContain('https://www.33across.com"');
    expect(blocked).toContain("We couldn't confirm their opt-out page when we last checked (2026-10-19).");
    for (const st of ['dead', 'suspect']) {
      const b = map.brokers.find((x) => x.optOut?.status === st);
      const html = starCard(map, l, b.id);
      expect(html).not.toContain('OPT OUT ↗');
      expect(html).toContain("We couldn't confirm their opt-out page");
    }
  });
  it('no verified record ever reads "couldn\'t confirm" (M7)', () => {
    for (const b of map.brokers.filter((x) => x.optOut?.status === 'verified')) {
      expect(starCard(map, l, b.id), b.id).not.toContain("couldn't confirm");
    }
  });
  it('a verified http:// page is a link that says it is not secure (M7)', () => {
    const html = starCard(map, l, 'netunim');
    expect(html).toContain('<a href="http://www.countshark.net/grid_privacy/" target="_blank" rel="noopener noreferrer">OPT OUT ↗</a>');
    expect(html).toContain("Their page isn't on a secure (https) link.");
    expect(starCard(map, l, 'spokeo')).not.toContain('secure (https)');
  });
  it('a verified bare homepage is THEIR SITE, never OPT OUT (M7)', () => {
    const bare = map.brokers.filter((b) => {
      if (b.optOut?.status !== 'verified' || b.optOut.method === 'none') return false;
      const u = new URL(b.optOut.url);
      return (u.pathname === '' || u.pathname === '/') && !u.search && !u.hash;
    });
    expect(bare.length).toBeGreaterThan(100);
    for (const b of bare) {
      const html = starCard(map, l, b.id);
      expect(html, b.id).not.toContain('OPT OUT ↗');
      expect(html).toContain('THEIR SITE ↗');
      expect(html).toContain('We haven\'t found a direct opt-out page. Look for "Do Not Sell" or "Privacy" on their site.');
    }
    const anchor = starCard(map, l, 'anchor-computer');
    expect(anchor).toContain('THEIR SITE ↗');
    expect(anchor).toContain("Their page isn't on a secure (https) link.");
  });
  it('shows a verified opt-out email as text', () => {
    const b = map.brokers.find((x) => x.optOut?.status === 'verified' && x.optOut.email && x.optOut.method !== 'none');
    expect(starCard(map, l, b.id)).toContain(b.optOut.email);
  });
  it('a no-opt-out card offers the complaint forms', () => {
    const html = starCard(map, l, 'radaris');
    expect(html).toContain('No opt-out exists.');
    expect(html).toContain("What you can do instead: file a complaint, so it's on the record.");
    expect(html).toContain('<a href="https://cppa.ca.gov/webapplications/complaint" target="_blank" rel="noopener noreferrer">California Privacy Protection Agency ↗</a>');
    expect(html).toContain('<a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer">FTC ↗</a>');
    expect(html).not.toContain('OPT OUT ↗');
    expect(html).not.toContain('href="https://radaris.com');
    for (const u of COMPLAINT_FORMS.map((f) => f.url)) expect(Object.hasOwn(verified.urls, u)).toBe(true);
  });
  it('an unknown route says so', () => {
    expect(starCard(map, l, 'avast')).toContain("We don't know an opt-out route for this one yet.");
  });
  it('a card with no check date shows no date', () => {
    const html = starCard(map, l, 'lempire-talkus');
    expect(html).toContain("We couldn't confirm their opt-out page.");
    expect(html).not.toMatch(/undefined|\(\)/);
  });
  it('a card lists its links and their archived sources', () => {
    const html = starCard(map, l, 'avast');
    expect(html).toContain('Owns Jumpshot');
    expect(html).toContain('Supplies Jumpshot');
    expect(html).toContain('href="https://web.archive.org/web/20240222194152/https://www.ftc.gov/system/files/ftc_gov/pdf/Complaint-Avast.pdf"');
    expect(starCard(map, l, 'jumpshot')).toContain('Owned by Avast');
    expect(starCard(map, l, 'jumpshot')).toContain('Supplied by Avast');
    const buy = map.links.find((k) => k.type === 'buys');
    expect(starCard(map, l, buy.from)).toMatch(/Buys from /);
    expect(starCard(map, l, buy.to)).toMatch(/Sells to /);
  });
  it('lists its sources as archived links, with the original as text', () => {
    const html = starCard(map, l, 'spokeo');
    expect(html).toContain('SOURCES');
    expect(html).toContain('href="https://web.archive.org/web/20261004223117/https://www.spokeo.com/privacy"');
    expect(html).not.toContain('href="https://www.spokeo.com/privacy"');
  });
  it('names the missions that cover it, briefing or re-check', () => {
    const html = starCard(map, l, 'spokeo');
    expect(html).toContain('COVERED BY');
    expect(html).toContain('href="#/mission/people_search-fortify-web-forms/briefing"');
    expect(html).not.toContain('people_search-recon-find-yourself');
    const done = { ...fresh(), missions: { 'people_search-fortify-web-forms': { status: 'completed', completedAt: '2026-10-01T12:00:00.000Z' } } };
    expect(starCard(map, l, 'spokeo', done)).toContain('href="#/mission/people_search-fortify-web-forms/recheck"');
    expect(starCard(map, l, 'avast')).toContain('No mission covers this one yet.');
  });
  it('frozen and halo notes', () => {
    const lit = { ...l, frozen: ['equifax'], halo: ['equifax'] };
    const html = starCard(map, lit, 'equifax');
    expect(html).toContain("Your credit is frozen here. A freeze stops new credit in your name; it doesn't stop this company selling what it holds.");
    expect(html).toContain('You opted out in this browser through the DAA WebChoices tool. That sets a cookie on this device; it deletes nothing.');
    expect(starCard(map, l, 'equifax')).not.toContain('frozen here');
  });
  it('an unknown id draws nothing', () => {
    expect(starCard(map, l, 'nope')).toBe('');
    expect(starCard(map, l, null)).toBe('');
  });
  it('escapes record text', () => {
    const m = { brokers: [{ id: 'x', name: '<b>X</b>', sells: ['a<i>'], optOut: null, missions: [], sources: [] }], links: [] };
    const html = starCard(m, { stars: {}, frozen: [], halo: [] }, 'x');
    expect(html).not.toMatch(/<b>|<i>/);
  });
  it('the card is a non-modal dialog labelled by its title', () => {
    const html = starCard(map, l, map.brokers[0].id);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="false"');
    expect(html).toContain('aria-labelledby="star-card-title"');
    expect(html).toMatch(/<h2 class="star-card-name" id="star-card-title">/);
  });
  it('no broker id or name goes in an id, name or title attribute', () => {
    for (const b of map.brokers) {
      const html = starCard(map, l, b.id);
      // The one id is a fixed title hook for aria-labelledby, never a broker id or name.
      expect(html.replace(' id="star-card-title"', '')).not.toMatch(/\s(id|name|title)="/);
    }
  });
  it('a holding company with no route of its own lists the routes of the companies it owns', () => {
    const h = starCard(map, l, 'experian');
    expect(h).toContain('Companies it owns have their own:');
    expect(h).toContain(`Experian Information Solutions · <a href="${byId.get('experian-information-solutions').optOut.url}"`);
    // Confirmed opt-out pages before bare homepages.
    expect(h.indexOf('Experian Information Solutions ·')).toBeLessThan(h.indexOf('AtData ·'));
    // A broker with its own confirmed route doesn't list its companies'.
    for (const b of map.brokers.filter((x) => x.optOut?.status === 'verified' && /^https?:/.test(x.optOut.url ?? ''))) {
      expect(starCard(map, l, b.id)).not.toContain('Companies it owns have their own:');
    }
  });
  it('every opt-out URL any card shows is verified', () => {
    for (const b of map.brokers) for (const u of optOutHrefs(starCard(map, l, b.id))) expect(verifiedRoute(u, b), `${b.id} ${u}`).toBe(true);
  });
  it('every external link on a card is a verified opt-out, an archived source or a complaint form in verified-urls.json', () => {
    for (const b of map.brokers) {
      const html = starCard(map, l, b.id);
      for (const u of external(html)) expect(allowedExternal(u, b), `${b.id} ${u}`).toBe(true);
      const anchors = html.match(/<a href="https?:[^>]*>/g) ?? [];
      for (const a of anchors) expect(a).toContain('target="_blank" rel="noopener noreferrer"');
    }
  });
});

describe('the card on the map screen', () => {
  const data = { map, layout };
  it('every href on the map screen is allowed', () => {
    const html = renderBrokerMap(fresh(), { status: 'ready', data, today: TODAY, selectedId: 'spokeo', stage: { w: 343, h: 600 } });
    expect(html).toContain('class="star-card"');
    const spokeo = byId.get('spokeo');
    const screen = html.slice(html.indexOf('<div class="screen broker-map">')); // the HUD is shared
    for (const h of hrefs(screen)) {
      const ok = /^#\/(district\/reclamation|reclamation\/map|reclamation\/big-check|mission\/[^/]+\/(briefing|recheck))$/.test(h) || allowedExternal(h, spokeo);
      expect(ok, h).toBe(true);
    }
  });
  it('on a phone the card is a bottom sheet over the map, at most 60% of the screen, scrolling inside (M6)', () => {
    const html = renderBrokerMap(fresh(), { status: 'ready', data, today: TODAY, selectedId: 'spokeo', stage: { w: 343, h: 600 } });
    const phone = html.match(/@media \(max-width:899\.98px\)\{\.star-card\{([^}]*)\}/)?.[1] ?? '';
    for (const rule of ['position:fixed', 'bottom:0', 'max-height:60svh', 'overflow-y:auto', 'overscroll-behavior:contain']) expect(phone).toContain(rule);
    expect(html).toContain('<div class="star-card-grab" aria-hidden="true">');
    expect(html).toContain('class="map-stage" tabindex="-1"');
  });
  it('no card without a selection', () => {
    const html = renderBrokerMap(fresh(), { status: 'ready', data, today: TODAY, stage: { w: 343, h: 600 } });
    expect(html).not.toContain('class="star-card"');
  });
  it('the stage handles its own gestures; the page does not zoom or scroll on it', () => {
    const html = renderBrokerMap(fresh(), { status: 'ready', data, today: TODAY, stage: { w: 343, h: 600 } });
    expect(html).toMatch(/\.map-stage\{[^}]*touch-action:none/);
    expect(html).not.toMatch(/\.broker-map\{[^}]*touch-action/);
  });
  it('map, card and residency breadcrumbs never leave the device', () => {
    for (const m of ['svg.constellation', 'section.star-card > a', 'div.residency > button', 'button.star-card-close'])
      expect(isPrivateBreadcrumb({ category: 'ui.click', message: m })).toBe(true);
  });
});
