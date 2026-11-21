import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { restoreEvents } from '../../src/utils/restore.js';
import { isPrivateBreadcrumb } from '../../src/utils/errorNoise.js';
import { createInitialState } from '../../src/state.js';
import { renderDebrief } from '../../src/screens/debrief.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const WEB = 'people_search-fortify-web-forms';

describe('broker filing privacy', () => {
  it('restoreEvents is identical with and without the broker fields', () => {
    const base = { ...createInitialState(), missions: { [WEB]: { status: 'completed', optout_result: 'all-submitted', completedAt: '2026-10-01T12:00:00.000Z' } } };
    const withBroker = { ...base, brokerFiled: { [WEB]: { lines: { spokeo: '2026-10-23' }, since: '2026-10-23' } }, caResident: 'yes', bigCheck: { spokeo: '2026-10-23' } };
    expect(JSON.stringify(restoreEvents(withBroker))).toBe(JSON.stringify(restoreEvents(base)));
  });

  it('the new modules never import analytics', () => {
    for (const f of ['src/utils/broker-state.js', 'src/utils/broker-lighting.js', 'src/components/broker-checklist.js', 'src/data/broker-checklists.js'])
      expect(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')).not.toMatch(/import[^;]*analytics|\btrack\(|umami|__rc/i);
  });

  it('checklist breadcrumbs never leave the device', () => {
    expect(isPrivateBreadcrumb({ category: 'ui.click', message: 'div.broker-checklist > label.debrief-opt > input[type="checkbox"][name="filed"]' })).toBe(true);
    expect(isPrivateBreadcrumb({ category: 'ui.click', message: 'button.btn-primary' })).toBe(false);
  });

  it('re-check mode can never auto-tick the checklist boxes', () => {
    const src = readFileSync('src/app.js', 'utf8');
    const line = src.split('\n').find((l) => l.includes('const boxes') && l.includes('input[name="filed"]'));
    expect(line).toContain(':not([data-mode="recheck"])');
  });

  it('a stored "all submitted" answer never renders the checklist pre-ticked', () => {
    const s = { ...createInitialState(), missions: { [WEB]: { status: 'completed', optout_result: 'all-submitted', completedAt: '2026-10-01T12:00:00.000Z' } } };
    for (const opts of [undefined, { recheck: true }]) {
      expect(renderDebrief(s, WEB, opts)).not.toMatch(/name="filed"[^>]*checked/);
    }
  });

  it('checklist boxes are at least 24px', () => {
    const html = renderDebrief(createInitialState(), WEB);
    const style = html.match(/name="filed"[^>]*style="([^"]*)"/)[1];
    expect(style).toMatch(/width: 2[4-9]px/);
    expect(style).toMatch(/height: 2[4-9]px/);
  });
});

describe('district done row', () => {
  it('keeps RE-CHECK at full opacity while the rest of the row is dimmed', () => {
    const src = readFileSync('src/screens/district.js', 'utf8');
    const row = src.slice(src.indexOf('const missionRows = ', src.indexOf('renderFacilitySection')));
    expect(row).not.toMatch(/border-bottom: 1px solid rgba\(0,229,255,0\.04\); \$\{done \? 'opacity: 0\.5;'/);
    expect(row).toContain('const dim');
  });
});

describe('review fixes', () => {
  it('moving off an "all" answer clears boxes that still match what it ticked', () => {
    const src = readFileSync('src/app.js', 'utf8');
    expect(src).toContain("form.dataset.prevAll = ticks === 'all' ? '1' : ''");
    expect(src).toMatch(/wasAll && boxes\.length && boxes\.every\(\(b\) => b\.checked\)/);
  });

  it('re-check label asks WHICH DID YOU FILE? while any line is undated', () => {
    const dated = { ...createInitialState(), missions: { [WEB]: { status: 'completed', optout_result: 'all-submitted', completedAt: '2026-10-01T12:00:00.000Z' } }, brokerFiled: { [WEB]: { lines: { spokeo: '2026-10-01' }, since: '2026-10-01' } } };
    expect(renderDebrief(dated, WEB, { recheck: true })).toContain('WHICH DID YOU FILE?');
    const all = { ...dated, brokerFiled: { [WEB]: { lines: { spokeo: '2026-10-01', whitepages: '2026-10-01', beenverified: '2026-10-01' }, since: '2026-10-01' } } };
    expect(renderDebrief(all, WEB, { recheck: true })).toContain('FILED AGAIN?');
    const pending = { ...dated, missions: { [WEB]: { status: 'completed', optout_result: 'some-submitted', completedAt: '2026-10-01T12:00:00.000Z' } }, brokerFiled: {} };
    expect(renderDebrief(pending, WEB, { recheck: true })).toContain('TELL SCOUT WHICH ONES YOU FILED');
  });
});
