import { describe, it, expect } from 'vitest';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
import { renderBuildingInterior } from '../src/screens/building.js';
import { renderDistrict } from '../src/screens/district.js';
import { renderBuilding } from '../src/components/building.js';
import { renderHud } from '../src/components/hud.js';
import { parseRoute } from '../src/router.js';
import { getInterior } from '../src/data/interiors/index.js';
import { setReadLevel } from '../src/utils/reading.js';

const NOW = new Date('2026-10-20T00:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 864e5).toISOString();
function file(state, id, update, at = daysAgo(3)) {
  const s = updateMission(state, id, { status: 'completed', ...update });
  if (at === null) delete s.missions[id].completedAt;
  else s.missions[id].completedAt = at;
  return s;
}
const render = (s, id = 'gmail') => renderBuildingInterior(s, id, { now: NOW });
// The entry block for one metaphor, e.g. data-entry="sim-swap".
const entryHtml = (html, id) => {
  const m = html.match(new RegExp(`<div class="entry[^"]*" data-entry="${id}"[\\s\\S]*?<!-- /entry -->`));
  return m ? m[0] : '';
};
const rowHtml = (html, id) => {
  const m = html.match(new RegExp(`<div class="ant-row" data-row="${id}"[\\s\\S]*?<!-- /row -->`));
  return m ? m[0] : '';
};

describe('building screen', () => {
  it('routes #/building/<id>', () => {
    expect(parseRoute('#/building/gmail')).toEqual({ screen: 'building', params: { id: 'gmail' } });
  });

  it('renders four floors for gmail with the five desk actors named', () => {
    const html = render(createInitialState());
    expect(html.match(/<details class="floor/g)).toHaveLength(4);
    // The roof open; the floors below open from 900px by script (folded on a phone until chosen).
    expect(html.match(/<details class="floor[^"]*" (open|data-open-desktop) /g)).toHaveLength(4);
    // "Health check": Signal is also an app in the city.
    expect(html).toContain('Roof · Health check');
    expect(html).not.toContain('Signal check');
    expect(html).toContain('Records desk · Google’s');
    expect(html).toContain('Ground floor · Entries');
    expect(html).toContain('Alcove · Saint Edward Snowden');
    for (const actor of ['Your local police department', 'FBI', 'NSA', 'ICE / HSI', 'UK investigators, through the Home Office']) {
      expect(html).toContain(actor);
    }
    expect(html).toContain('GMAIL');
    expect(html).toContain('The Master Keys');
  });

  it('meter reads NO ENTRIES CHECKED YET on a fresh save and ENTRIES SEALED 1/3 after sms 2FA + unique password (front door sealed; phone line, mail slot open; back room not-checked)', () => {
    // Advanced mode's count (Simple's is a bar: tests/building-open-door.test.js).
    expect(render(setReadLevel(createInitialState(), 'full'))).toContain('NO ENTRIES CHECKED YET');
    let s = file(setReadLevel(createInitialState(), 'full'), 'gmail-fortify-2fa', { method: 'sms' }, daysAgo(23));
    s = file(s, 'gmail-fortify-password', { action: 'reset-password' }, daysAgo(30));
    const html = render(s);
    expect(html).toContain('ENTRIES SEALED <b>1/3</b>');
    expect(html).toContain('LAST SWEEP <b');
    expect(html).toMatch(/LAST SWEEP <b[^>]*>23d<\/b>/);
    expect(entryHtml(html, 'stuffing')).toContain('data-state="sealed"');
    expect(entryHtml(html, 'sim-swap')).toContain('data-state="open"');
    expect(entryHtml(html, 'phishing')).toContain('data-state="open"');
    expect(entryHtml(html, 'near-you')).toContain('data-state="not-checked"');
    expect(entryHtml(html, 'state')).toContain('data-state="beyond"');
  });

  it('open entry links SEAL IT to its fixMission briefing; not-checked shows START', () => {
    let s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' });
    let html = render(s);
    expect(entryHtml(html, 'sim-swap')).toContain('SEAL IT');
    // gmail-fortify-2fa is filed (sms), so the upgrade is unlocked.
    expect(entryHtml(html, 'sim-swap')).toContain('href="#/mission/gmail-fortify-2fa-upgrade/briefing"');
    expect(entryHtml(html, 'near-you')).toContain('START');
    expect(entryHtml(html, 'near-you')).toContain('href="#/mission/gmail-recon-login/briefing"');
    expect(entryHtml(html, 'near-you')).not.toContain('SEAL IT');

    // Open front door (pm flagged, no reset) seals through the password mission.
    s = { ...createInitialState(), pmFlagged: ['gmail'] };
    html = render(s);
    expect(entryHtml(html, 'stuffing')).toContain('data-state="open"');
    expect(entryHtml(html, 'stuffing')).toContain('href="#/mission/gmail-fortify-password/briefing"');
    // Not-checked 2FA entries START at the base 2FA mission, not the locked upgrade.
    expect(entryHtml(html, 'sim-swap')).toContain('href="#/mission/gmail-fortify-2fa/briefing"');
    expect(entryHtml(html, 'sim-swap')).not.toContain('gmail-fortify-2fa-upgrade');
  });

  it('SEAL IT falls back to the base 2FA mission when the base record is not completed', () => {
    // A 2FA method known only from the upgrade mission (base never filed): base is not done.
    const s = file(createInitialState(), 'gmail-fortify-2fa-upgrade', { method: 'sms' });
    const html = render(s);
    expect(entryHtml(html, 'sim-swap')).toContain('data-state="open"');
    expect(entryHtml(html, 'sim-swap')).toContain('href="#/mission/gmail-fortify-2fa/briefing"');
    expect(entryHtml(html, 'phishing')).toContain('href="#/mission/gmail-fortify-2fa/briefing"');
  });

  it('SEAL IT never dead-ends on a completed briefing (final review item 2)', () => {
    // Authenticator filer: the upgrade stays locked; the mail slot re-checks the base 2FA filing.
    const auth = render(file(createInitialState(), 'gmail-fortify-2fa', { method: 'authenticator' }));
    expect(entryHtml(auth, 'phishing')).toContain('data-state="open"');
    expect(entryHtml(auth, 'phishing')).toContain('href="#/mission/gmail-fortify-2fa/recheck"');
    expect(entryHtml(auth, 'phishing')).toContain('SEAL IT ▸ RE-CHECK');
    expect(entryHtml(auth, 'phishing')).not.toContain('/briefing"');
    // Upgrade filed (sms, then authenticator): the mission that records the method is re-checked.
    let up = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' }, daysAgo(9));
    up = file(up, 'gmail-fortify-2fa-upgrade', { method: 'authenticator' }, daysAgo(2));
    expect(entryHtml(render(up), 'phishing')).toContain('href="#/mission/gmail-fortify-2fa-upgrade/recheck"');
    // Completed login check with strangers: the back room re-checks it.
    const strangers = render(file(createInitialState(), 'gmail-recon-login', { finding: '1-2-breaches' }));
    expect(entryHtml(strangers, 'near-you')).toContain('data-state="open"');
    expect(entryHtml(strangers, 'near-you')).toContain('href="#/mission/gmail-recon-login/recheck"');
    expect(entryHtml(strangers, 'near-you')).toContain('SEAL IT ▸ RE-CHECK');
  });

  it('SEAL IT shows the fix with no button when the target is unavailable', () => {
    // Password-manager missions can't be re-checked; an entry pointing at one has no button.
    const interior = getInterior('gmail');
    const e = interior.entries.find((x) => x.id === 'near-you');
    const orig = e.fixMission;
    try {
      e.fixMission = 'password_manager-recon-report';
      let s = file(createInitialState(), 'gmail-recon-login', { finding: '3plus-breaches' });
      s = file(s, 'password_manager-recon-report', { action: 'none-flagged' });
      const html = entryHtml(render(s), 'near-you');
      expect(html).toContain('data-state="open"');
      expect(html).toContain('entry-fix');
      expect(html).not.toContain('interior-btn');
      // An unavailable (locked) briefing: no button either.
      e.fixMission = 'password_manager-fortify-burst';
      const locked = entryHtml(render(file(createInitialState(), 'gmail-recon-login', { finding: '3plus-breaches' })), 'near-you');
      expect(locked).toContain('entry-fix');
      expect(locked).not.toContain('interior-btn');
    } finally {
      e.fixMission = orig;
    }
  });

  it('sealed entries show the evaluator note; beyond shows what narrows it; vents actors wrap', () => {
    const s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'authenticator' });
    const html = render(s);
    expect(entryHtml(html, 'sim-swap')).toContain('A recovery phone number can still reopen this door');
    const vents = entryHtml(html, 'state');
    expect(vents).toContain('Advanced Protection');
    expect(vents).toContain('NSO Group’s Pegasus');
    expect(vents).not.toMatch(/nowrap/);
  });

  it('roof rows: a weak row gets Fix it (to the door it closes), an unfiled one START; bars by status', () => {
    const s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' });
    const html = render(s);
    const tf = rowHtml(html, 'two-factor');
    expect(tf).toContain('Fix it');
    expect(tf).not.toContain('SWEEP');
    // Codes by text: the phone line's fix, the upgrade.
    expect(tf).toContain('href="#/mission/gmail-fortify-2fa-upgrade/briefing"');
    expect(tf.match(/class="bar on"/g)).toHaveLength(2);
    const dev = rowHtml(html, 'devices');
    expect(dev).toContain('START');
    expect(dev).toContain('href="#/mission/gmail-recon-login/briefing"');
    expect(dev).not.toContain('/recheck');
  });

  it('a stale filing shows date unknown / dim bars, never fresh', () => {
    // An old save: the filing has no completedAt.
    let s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'passkey' }, null);
    let tf = rowHtml(render(s), 'two-factor');
    expect(tf).toContain('date unknown');
    expect(tf).toContain('opacity: 0.35');
    expect(tf).not.toContain('data-fresh="fresh"');
    s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'passkey' }, daysAgo(120));
    tf = rowHtml(render(s), 'two-factor');
    expect(tf).toContain('opacity: 0.35');
    expect(tf).toContain('data-fresh="stale"');
    s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'passkey' }, daysAgo(45));
    expect(rowHtml(render(s), 'two-factor')).toContain('opacity: 0.6');
    s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'passkey' }, daysAgo(2));
    expect(rowHtml(render(s), 'two-factor')).toContain('opacity: 1;');
  });

  it('#/building/netflix, #/building/nope, and disabled gmail render the calm no-floor-plan page', () => {
    const s = createInitialState();
    const netflix = render(s, 'netflix');
    expect(netflix).toContain('No floor plan for this building yet');
    expect(netflix).toMatch(/href="#\/district\/[a-z-]+"/);
    const nope = render(s, 'nope');
    expect(nope).toContain('No floor plan for this building yet');
    expect(nope).toContain('href="#/city"');
    const off = render(toggleAccount(s, 'gmail', false), 'gmail');
    expect(off).toContain('No floor plan for this building yet');
    expect(off).toContain('href="#/district/master-keys"');
    expect(off).not.toContain('Records desk');
  });

  it('escapes the id on the no-floor-plan page', () => {
    expect(render(createInitialState(), '<img src=x>')).not.toContain('<img src=x>');
  });

  it('no rendered interior contains white-space: nowrap or a fixed width over 360px', () => {
    let s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' });
    s = file(s, 'gmail-recon-login', { finding: '1-2-breaches' });
    for (const st of [createInitialState(), s]) {
      // The shared HUD is not part of the interior.
      const html = render(st).replace(renderHud(st), '');
      expect(html).not.toMatch(/white-space:\s*nowrap/);
      for (const m of html.matchAll(/(?:min-)?width:\s*(\d{3,4})px/g)) {
        if (!/max-width/.test(html.slice(Math.max(0, m.index - 4), m.index))) expect(Number(m[1])).toBeLessThanOrEqual(360);
      }
    }
  });

  it('not-checked entries show the fix beside START; the state icon has a readable label', () => {
    const html = render(createInitialState());
    const fix = getInterior('gmail').entries.find((e) => e.id === 'near-you').fix;
    expect(entryHtml(html, 'near-you')).toContain(fix.replace(/’/g, '’'));
    expect(entryHtml(html, 'near-you')).toContain('aria-label="Not checked yet"');
    expect(entryHtml(html, 'state')).toContain('aria-label="Beyond your control"');
    const s = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' });
    expect(entryHtml(render(s), 'sim-swap')).toContain('aria-label="Open"');
    const p = file(createInitialState(), 'gmail-fortify-2fa', { method: 'passkey' });
    expect(entryHtml(render(p), 'phishing')).toContain('aria-label="Sealed"');
  });

  it('no rendered state says "they", including notes and narrows', () => {
    const passkey = file(createInitialState(), 'gmail-fortify-2fa', { method: 'passkey' });
    const auth = file(createInitialState(), 'gmail-fortify-2fa', { method: 'authenticator' });
    let mixed = file(createInitialState(), 'gmail-fortify-2fa', { method: 'sms' });
    mixed = file(mixed, 'gmail-recon-login', { finding: '1-2-breaches' });
    for (const st of [createInitialState(), passkey, auth, mixed, { ...createInitialState(), pmFlagged: ['gmail'] }]) {
      const html = render(st);
      const text = html.replace(renderHud(st), '').replace(/<[^>]+>/g, ' ');
      expect(text).not.toMatch(/\bthey\b/i);
    }
    // The states above do reach the note and narrows copy.
    expect(render(auth)).toContain('A recovery phone number can still reopen this door');
    expect(render(passkey)).toContain('Advanced Protection Program');
  });

  it('source links open in a new tab with noopener; no "they" in the static labels', () => {
    const html = render(createInitialState());
    const links = [...html.matchAll(/<a [^>]*href="https?:[^"]*"[^>]*>/g)].map((m) => m[0]);
    expect(links.length).toBeGreaterThan(10);
    for (const a of links) {
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener"');
    }
    const text = html.replace(renderHud(createInitialState()), '').replace(/<[^>]+>/g, ' ');
    expect(text).not.toMatch(/\bthey\b/i);
  });

  it('the desk lanes and entry sources all appear', () => {
    const html = render(createInitialState());
    const interior = getInterior('gmail');
    for (const lane of interior.desk) for (const src of lane.sources) expect(html).toContain(src.url.replace(/&/g, '&amp;'));
    for (const e of interior.entries) for (const src of e.sources) expect(html).toContain(src.url.replace(/&/g, '&amp;'));
  });
});

describe('tappable buildings', () => {
  it('a tappable building wears an INSIDE badge, pulsing until its first visit', () => {
    const fresh = renderBuilding('gmail', 'occupied', 64, { href: '#/building/gmail', isNew: true });
    expect(fresh).toContain('class="building-badge building-badge--new"');
    expect(fresh).toContain('INSIDE ▸');
    const seen = renderBuilding('gmail', 'occupied', 64, { href: '#/building/gmail' });
    expect(seen).toContain('class="building-badge"');
    expect(seen).not.toContain('building-badge--new');
    expect(renderBuilding('gmail', 'occupied', 64)).not.toContain('INSIDE');
  });

  it('the lock count shows sealed of controllable doors, lime when all are sealed', () => {
    const some = renderBuilding('gmail', 'occupied', 64, { href: '#/building/gmail', sealed: 2, controllable: 4 });
    expect(some).toContain('🔒 2/4');
    expect(some).toContain('aria-label="Gmail: see inside. 2 of 4 doors sealed."');
    expect(some).not.toContain('building-seals--all');
    expect(renderBuilding('gmail', 'occupied', 64, { href: '#/building/gmail', sealed: 4, controllable: 4 })).toContain('building-seals--all');
    expect(renderBuilding('gmail', 'occupied', 64, { href: '#/building/gmail' })).not.toContain('🔒');
  });

  it('district strip: small tiles until a building is cleared, then the full card and hint', () => {
    let s = createInitialState();
    const html = renderDistrict(s, 'master-keys', 'survey');
    expect((html.match(/building-link building-link--compact/g) || []).length).toBe(9);
    expect(html).not.toContain('building-badge');
    expect(html).not.toContain('class="skyline-hint"');
    expect(html).toMatch(/aria-label="Gmail: see inside\. 0 of \d+ doors sealed\."/);
    // Gmail's Recon and Fortify done: it takes centre stage.
    s = file(s, 'gmail-recon-breach', { finding: 'no-breaches' });
    s = file(s, 'gmail-fortify-password', { action: 'already-strong' });
    s = file(s, 'gmail-fortify-2fa', { action: 'enabled-2fa', method: 'authenticator' });
    const cleared = renderDistrict(s, 'master-keys', 'survey');
    expect(cleared).toContain('class="skyline-hint"');
    expect((cleared.match(/building-badge--new/g) || []).length).toBe(1);
    expect((cleared.match(/building-link--compact/g) || []).length).toBe(8);
    s = { ...s, interior: { gmail: { visited: true } } };
    expect(renderDistrict(s, 'master-keys', 'survey')).not.toContain('building-badge--new');
    expect(renderDistrict(createInitialState(), 'vault', 'survey')).not.toContain('skyline-hint');
  });

  it('glow 0 and no href leave the markup byte-identical', () => {
    for (const st of ['occupied', 'in-progress', 'liberated', 'liberated-scarred']) {
      expect(renderBuilding('gmail', st, 64, {})).toBe(renderBuilding('gmail', st, 64));
      expect(renderBuilding('gmail', st, 64, { glow: 0 })).toBe(renderBuilding('gmail', st));
    }
  });

  it('href wraps the building in a link; glow adds a drop-shadow', () => {
    const linked = renderBuilding('gmail', 'occupied', 64, { href: '#/building/gmail' });
    expect(linked).toMatch(/^\s*<a class="building-link" href="#\/building\/gmail"/);
    expect(linked).toContain(renderBuilding('gmail', 'occupied', 64).trim());
    const glowing = renderBuilding('gmail', 'occupied', 64, { glow: 0.5 });
    expect(glowing).toContain('drop-shadow(0 0 10px rgba(0,229,255,0.3))');
  });

  it('district strip links enabled buildings with interiors, and only those', () => {
    const s = createInitialState();
    const html = renderDistrict(s, 'master-keys', 'survey');
    const links = [...html.matchAll(/class="building-link[^"]*" href="([^"]+)"/g)].map((m) => m[1]);
    expect(links).toEqual(['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'apple_id', 'google', 'microsoft', 'facebook'].map((id) => `#/building/${id}`));
    const off = renderDistrict(toggleAccount(s, 'gmail', false), 'master-keys', 'survey');
    expect(off).not.toContain('href="#/building/gmail"');
    const square = [...renderDistrict(s, 'square', 'survey').matchAll(/class="building-link[^"]*" href="([^"]+)"/g)].map((m) => m[1]);
    expect(square).toEqual(['#/building/signal']);
    expect(renderDistrict(s, 'vault', 'survey')).not.toContain('building-link');
  });
});

describe('the single-lane desk (task 7)', () => {
  it('signal desk is a single lane and renders as a note', () => {
    let s = createInitialState();
    if (!s.accounts.signal?.enabled) s = toggleAccount(s, 'signal', true);
    const html = renderBuildingInterior(s, 'signal', { now: NOW });
    expect(html).toContain('desk--note');
    expect(html.match(/class="slip[ "]/g)).toHaveLength(1);
    expect(html).toContain('Any agency, any legal process');
  });

  it('a desk with several lanes is not a note', () => {
    const html = renderBuildingInterior(createInitialState(), 'gmail', { now: NOW });
    expect(html).not.toContain('desk--note');
  });
});

describe('signal roof (fix round 1)', () => {
  it('has a registration-lock row with START, and no password or two-factor rows', () => {
    const s = toggleAccount(createInitialState(), 'signal', true);
    const html = renderBuildingInterior(s, 'signal', { now: NOW });
    expect(rowHtml(html, 'password')).toBe('');
    expect(rowHtml(html, 'two-factor')).toBe('');
    const lock = rowHtml(html, 'reglock');
    expect(lock).toContain('Registration lock');
    expect(lock).toContain('START');
    expect(lock).toContain('#/mission/signal-fortify-reglock/briefing');
  });
});

describe('final fixes: pw-clean row on a recon mission', () => {
  it('facebook pw-clean from facebook-recon-password: dated row with a quiet Check again on that mission', () => {
    let s = toggleAccount(createInitialState(), 'facebook', true);
    s = file(s, 'facebook-recon-password', { pw_status: 'pw-clean', service_breach: 'not-in-service-breach' }, daysAgo(4));
    const row = rowHtml(renderBuildingInterior(s, 'facebook', { now: NOW }), 'password');
    expect(row).toContain('data-status="ok"');
    expect(row).toContain('data-fresh="fresh"');
    expect(row).not.toContain('date unknown');
    expect(row).toContain('<a class="ant-again" href="#/mission/facebook-recon-password/recheck">Check again</a>');
    expect(row).not.toContain('SWEEP');
  });
  it('a skipped 2FA "later" row is crit and its Fix it opens the briefing (no re-check of a skip)', () => {
    const s = updateMission(createInitialState(), 'gmail-fortify-2fa', { status: 'skipped', method: 'none', method_setup: 'later', action: 'later' });
    const html = render(s);
    const row = rowHtml(html, 'two-factor');
    expect(row).toContain('data-status="crit"');
    expect(row).toContain('Fix it');
    expect(row).toContain('href="#/mission/gmail-fortify-2fa/briefing"');
    expect(entryHtml(html, 'phishing')).toContain('href="#/mission/gmail-fortify-2fa/briefing"');
  });
});

describe('district balance: Scout’s welcome opens with its lead', () => {
  it('every intro splits into a short lead and the rest, losing nothing', async () => {
    const { DISTRICT_DIALOGUE } = await import('../src/data/dialogue.js');
    const { splitIntro } = await import('../src/screens/district.js');
    for (const d of Object.values(DISTRICT_DIALOGUE)) {
      if (!d.intro) continue;
      const { lead, rest } = splitIntro(d.intro);
      expect(lead.length).toBeGreaterThan(20);
      expect(lead.length).toBeLessThanOrEqual(200);
      expect(`${lead} ${rest}`.replace(/\s+/g, ' ').trim()).toBe(d.intro.replace(/\s+/g, ' ').trim());
    }
  });

  it('the district page shows the lead with MORE, the rest inside, DISMISS kept', () => {
    const html = renderDistrict(createInitialState(), 'master-keys', 'survey');
    expect(html).toContain('<details class="intro-more">');
    // The whole lead from 900px; on a phone only its first sentence (the rest of it opens first under MORE).
    expect(html).toMatch(/<summary[^>]*>Welcome to The Master Keys\.<span class="intro-lead-more"> This is where it all starts — and I do mean all of it\.<\/span> <span class="intro-more-toggle">/);
    expect(html).toMatch(/<div class="intro-lead-phone"[^>]*>This is where it all starts — and I do mean all of it\.<\/div>/);
    expect(html).toContain('Control these and you control the city.');
    expect(html).toContain('data-action="dismiss-intro"');
  });
});
