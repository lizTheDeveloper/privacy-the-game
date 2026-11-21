import { describe, it, expect } from 'vitest';
import { createInitialState, updateMission } from '../src/state.js';
import { addDevice, removeDevice, newlySealed, markSealedSeen, setFloorOpen } from '../src/utils/interior-state.js';
import { INTERIOR_LINES } from '../src/data/dialogue.js';
import { renderBuildingInterior } from '../src/screens/building.js';
import { renderDistrict } from '../src/screens/district.js';
import { sealedCount } from '../src/utils/interior.js';
import { controllableProgress } from '../src/utils/interior-state.js';
import { setReadLevel } from '../src/utils/reading.js';

const NOW = new Date('2026-10-20T00:00:00Z');
const render = (s, id = 'gmail') => renderBuildingInterior(s, id, { now: NOW });
function file(state, id, update) {
  const s = updateMission(state, id, { status: 'completed', ...update });
  s.missions[id].completedAt = new Date(NOW.getTime() - 864e5).toISOString();
  return s;
}
const withPasskey = (s) => file(s, 'gmail-fortify-2fa', { method: 'passkey' });
// A player who has been inside once (seals after this animate).
const visited = (s) => ({ ...s, interior: { ...s.interior, gmail: { visited: true, sealedSeen: [], ...s.interior?.gmail } } });
const sealedState = () => {
  let s = createInitialState();
  s = file(s, 'gmail-fortify-password', { action: 'reset-password' });
  s = file(s, 'gmail-recon-login', { finding: 'no-breaches' });
  s = file(s, 'gmail-fortify-2fa', { method: 'passkey' });
  return s;
};

describe('devices', () => {
  it('addDevice trims, caps 40 chars, caps 12, skips empty and duplicates', () => {
    const s0 = createInitialState();
    const before = JSON.stringify(s0);
    let s = addDevice(s0, 'gmail', '   My   old\n phone  ');
    expect(s.devices.gmail).toEqual(['My old phone']);
    expect(addDevice(s, 'gmail', '   ').devices.gmail).toEqual(['My old phone']);
    expect(addDevice(s, 'gmail', 'My old phone').devices.gmail).toHaveLength(1);
    s = addDevice(s, 'gmail', 'x'.repeat(60));
    expect(s.devices.gmail[1]).toHaveLength(40);
    for (let i = 0; i < 20; i++) s = addDevice(s, 'gmail', `d${i}`);
    expect(s.devices.gmail).toHaveLength(12);
    expect(JSON.stringify(s0)).toBe(before);
  });
  it('removeDevice drops by index and ignores bad ones', () => {
    let s = addDevice(addDevice(createInitialState(), 'gmail', 'a'), 'gmail', 'b');
    expect(removeDevice(s, 'gmail', 0).devices.gmail).toEqual(['b']);
    expect(removeDevice(s, 'gmail', 9).devices.gmail).toEqual(['a', 'b']);
  });
  it('a device label with markup renders escaped', () => {
    const s = addDevice(createInitialState(), 'gmail', '<img src=x onerror=alert(1)>');
    const html = render(s);
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x');
  });
  it('shows "not listed" when empty and an add form + remove buttons otherwise', () => {
    expect(render(createInitialState())).toContain('not listed');
    expect(render(createInitialState())).toContain('data-action="add-device"');
    const html = render(addDevice(createInitialState(), 'gmail', 'Laptop'));
    expect(html).not.toContain('not listed');
    expect(html).toContain('data-action="remove-device"');
  });
  it('tolerates a malformed devices save', () => {
    const s = { ...createInitialState(), devices: { gmail: 'oops' } };
    expect(() => render(s)).not.toThrow();
    expect(addDevice(s, 'gmail', 'Laptop').devices.gmail).toEqual(['Laptop']);
  });
});

describe('sealing moments', () => {
  it('newlySealed reports an entry once; after markSealedSeen it is empty', () => {
    const s = withPasskey(visited(createInitialState()));
    const fresh = newlySealed(s, 'gmail');
    expect(fresh.length).toBeGreaterThan(0);
    expect(render(s)).toContain('entry--sealing');
    const seen = markSealedSeen(s, 'gmail', fresh);
    expect(newlySealed(seen, 'gmail')).toEqual([]);
    expect(render(seen)).not.toContain('entry--sealing');
  });
  it('a device add after the animation does not replay it', () => {
    let s = withPasskey(createInitialState());
    s = markSealedSeen(s, 'gmail', newlySealed(s, 'gmail'));
    expect(render(addDevice(s, 'gmail', 'Laptop'))).not.toContain('entry--sealing');
  });
  it('Scout shows fullySealed once, then newSeal on a later seal, else nothing on repeat visits', () => {
    const lineOf = (html) => html.includes('data-scout="interior"');
    let s = createInitialState();
    expect(lineOf(render(s))).toBe(true); // first visit
    s = markSealedSeen(s, 'gmail', newlySealed(s, 'gmail'));
    expect(lineOf(render(s))).toBe(false); // repeat visit
    const part = file(s, 'gmail-fortify-2fa', { method: 'authenticator' });
    const html = render(part);
    expect(html).toContain('data-scout="interior"');
    expect(INTERIOR_LINES.newSeal.some((l) => html.includes(l.replace('{name}', 'Gmail')))).toBe(true);
    // fully sealed
    let full = sealedState();
    const c = sealedCount(full, 'gmail');
    expect(c.total).toBeGreaterThan(0);
    expect(c.sealed).toBe(c.total);
    full = { ...full, interior: { gmail: { visited: true, sealedSeen: [] } } };
    const fh = render(full);
    expect(INTERIOR_LINES.fullySealed.some((l) => fh.includes(l.replace('{name}', 'Gmail')))).toBe(true);
    full = markSealedSeen(full, 'gmail', newlySealed(full, 'gmail'));
    expect(full.interior.gmail.fullySealedSeen).toBe(true);
    expect(lineOf(render(full))).toBe(false);
  });
  it('no INTERIOR_LINES string says "they"', () => {
    for (const lines of Object.values(INTERIOR_LINES)) {
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) expect(l).not.toMatch(/\bthey\b/i);
    }
    expect(JSON.stringify(INTERIOR_LINES)).not.toMatch(/they/i);
  });
});

describe('floors remember open/closed', () => {
  it('first visit: the roof and the doors open, desk and alcove open on desktop only; a closed floor renders closed; reopening restores', () => {
    // Advanced. (Simple folds the roof on a phone too: tests/simple-fold.test.js.)
    const s0 = setReadLevel(createInitialState(), 'full');
    const first = render(s0);
    expect(first.match(/<details class="floor[^"]*"[^>]* open/g)).toHaveLength(2);
    expect(first).toMatch(/<details class="floor floor--roof" open data-floor="roof">/);
    expect(first).toMatch(/<details class="floor floor--ground" open data-floor="ground">/);
    expect(first.match(/<details class="floor[^"]*" data-open-desktop data-floor="(desk|alcove)">/g)).toHaveLength(2);
    expect(render(setFloorOpen(s0, 'gmail', 'ground', false))).toMatch(/<details class="floor floor--ground" data-floor="ground">/);
    const s1 = setFloorOpen(s0, 'gmail', 'desk', false);
    const html = render(s1);
    expect(html).toMatch(/<details class="floor floor--desk" data-floor="desk">/);
    expect(render(setFloorOpen(s1, 'gmail', 'desk', true))).toMatch(/<details class="floor floor--desk" open data-floor="desk">/);
    // Simple: the roof opens on desktop only, like the desk and the alcove; the doors stay open.
    const simple = render(setReadLevel(createInitialState(), 'simplest'));
    expect(simple).toMatch(/<details class="floor floor--roof" data-open-desktop data-floor="roof">/);
    expect(simple).toMatch(/<details class="floor floor--ground" open data-floor="ground">/);
  });
  it('setFloorOpen is a no-op (same state) when the value is unchanged', () => {
    const s = createInitialState();
    expect(setFloorOpen(s, 'gmail', 'desk', true)).toBe(s);
  });
});

describe('fullySealed only when every controllable door is sealed', () => {
  it('passkey-only Gmail is not fullySealed and does not spend fullySealedSeen', () => {
    const s = withPasskey(createInitialState());
    const html = render(s);
    expect(INTERIOR_LINES.fullySealed.some((l) => html.includes(l.replace('{name}', 'Gmail')))).toBe(false);
    const seen = markSealedSeen(s, 'gmail', newlySealed(s, 'gmail'));
    expect(seen.interior.gmail.fullySealedSeen).toBeUndefined();
  });
  it('every controllable entry sealed -> fullySealed', () => {
    const full = visited(sealedState());
    const p = controllableProgress(full, 'gmail');
    expect(p.sealed).toBe(p.controllable);
    const html = render(full);
    expect(INTERIOR_LINES.fullySealed.some((l) => html.includes(l.replace('{name}', 'Gmail')))).toBe(true);
  });
});

describe('district glow', () => {
  it('glow is sealed/total and 0 with nothing checked; tiers unchanged', () => {
    const none = renderDistrict(createInitialState(), 'master-keys');
    const sealed = renderDistrict(withPasskey(createInitialState()), 'master-keys');
    expect(none).not.toMatch(/drop-shadow\(0 0 10px rgba\(0,229,255/);
    expect(sealed).toMatch(/drop-shadow\(0 0 10px rgba\(0,229,255/);
  });
  it('glow is sealed / controllable: passkey-only < 1, all controllable sealed = 1, none = 0', () => {
    const p = controllableProgress(withPasskey(createInitialState()), 'gmail');
    expect(p.sealed / p.controllable).toBeLessThan(1);
    expect(p.sealed).toBeGreaterThan(0);
    const f = controllableProgress(sealedState(), 'gmail');
    expect(f.sealed / f.controllable).toBe(1);
    expect(controllableProgress(createInitialState(), 'gmail').sealed).toBe(0);
  });
});

describe('first visit: doors already sealed are quietly seen', () => {
  it('no animation and the firstVisit line on a first visit to a sealed building; nothing replays after', () => {
    const s = withPasskey(createInitialState());
    expect(newlySealed(s, 'gmail')).toEqual([]);
    const html = render(s);
    expect(html).not.toContain('entry--sealing');
    expect(INTERIOR_LINES.firstVisit.some((l) => html.includes(l.replace('{name}', 'Gmail')))).toBe(true);
    const seen = markSealedSeen(s, 'gmail', newlySealed(s, 'gmail'));
    expect(seen.interior.gmail.visited).toBe(true);
    expect(seen.interior.gmail.sealedSeen.length).toBeGreaterThan(0);
    const again = render(seen);
    expect(again).not.toContain('entry--sealing');
    expect(again).not.toContain('data-scout="interior"');
  });
  it('a fully sealed building on a first visit shows firstVisit, then nothing', () => {
    const full = sealedState();
    const html = render(full);
    expect(INTERIOR_LINES.firstVisit.some((l) => html.includes(l.replace('{name}', 'Gmail')))).toBe(true);
    expect(html).not.toContain('entry--sealing');
    const seen = markSealedSeen(full, 'gmail', newlySealed(full, 'gmail'));
    expect(render(seen)).not.toContain('data-scout="interior"');
  });
  it('a seal after the first visit animates once', () => {
    let s = createInitialState();
    s = markSealedSeen(s, 'gmail', newlySealed(s, 'gmail'));
    s = withPasskey(s);
    expect(newlySealed(s, 'gmail').length).toBeGreaterThan(0);
    expect(render(s)).toContain('entry--sealing');
    s = markSealedSeen(s, 'gmail', newlySealed(s, 'gmail'));
    expect(render(s)).not.toContain('entry--sealing');
  });
});
