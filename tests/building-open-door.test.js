// Pick 9 (Liz 2026-11-20: "Do it"): a building shows the open door first, and lit. Roof, then
// the doors, then the alcove, then the records desk. One bright button on the screen.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialState, updateMission, toggleAccount } from '../src/state.js';
import { renderBuildingInterior } from '../src/screens/building.js';
import { setReadLevel } from '../src/utils/reading.js';
import { prismTag, prismTagCount } from '../src/components/prism-tag.js';
import { INTERIORS } from '../src/data/interiors/index.js';
import { firstUnsealedEntry } from '../src/utils/interior-state.js';
import { renderDistrict } from '../src/screens/district.js';
import { applyCategoryAction } from '../src/utils/pm-categories.js';
import { calcDistrictProgress } from '../src/utils/calc.js';
import { getMissionsForDistrict } from '../src/data/missions.js';
import { isMissionInPlay } from '../src/utils/mission-status.js';

const NOW = new Date('2026-10-20T00:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 864e5).toISOString();
const file = (s, id, rec, at = daysAgo(3)) => {
  const out = updateMission(s, id, { status: 'completed', ...rec });
  out.missions[id].completedAt = at;
  return out;
};
const simple = (s) => setReadLevel(s, 'simplest');
const adv = (s) => setReadLevel(s, 'full');
const render = (s, id = 'gmail') => renderBuildingInterior(toggleAccount(s, id, true), id, { now: NOW });
const primaries = (html) => (html.match(/class="[^"]*\bbtn-primary\b[^"]*"/g) || []).length;
const entryHtml = (html, id) => html.match(new RegExp(`<div class="entry[^"]*" data-entry="${id}"[\\s\\S]*?<!-- /entry -->`))?.[0] ?? '';
const rowHtml = (html, id) => html.match(new RegExp(`<div class="ant-row" data-row="${id}"[\\s\\S]*?<!-- /row -->`))?.[0] ?? '';
const floorAt = (html, kind) => html.indexOf(`floor--${kind}"`);

// Gmail mid-game: a leaked address, codes by text, sign-ins clean.
function gmailMid() {
  let s = file(createInitialState(), 'gmail-recon-breach', { finding: '1-2-breaches', password_exposed: 'unsure' });
  s = file(s, 'gmail-fortify-2fa', { method: 'sms', action: 'enabled-2fa' });
  return file(s, 'gmail-recon-login', { finding: 'no-breaches' });
}

describe('the floors, top to bottom: Roof, Ground, Alcove, Records desk', () => {
  for (const [name, level] of [['Simple', simple], ['Advanced', adv]]) {
    it(name, () => {
      const html = render(level(createInitialState()));
      expect(floorAt(html, 'roof')).toBeLessThan(floorAt(html, 'ground'));
      expect(floorAt(html, 'ground')).toBeLessThan(floorAt(html, 'alcove'));
      expect(floorAt(html, 'alcove')).toBeLessThan(floorAt(html, 'desk'));
      expect(html).toContain('Roof · Health check');
    });
  }
});

describe('the first open door: unfolded, and its SEAL IT the one bright button', () => {
  it('the first open door is open at every width; the others fold as before', () => {
    const html = render(adv(gmailMid()));
    expect(entryHtml(html, 'stuffing')).toMatch(/<details class="entry-fold" [^>]* open>/);
    expect(entryHtml(html, 'stuffing')).toContain('entry--first');
    for (const id of ['sim-swap', 'phishing', 'near-you', 'state']) expect(entryHtml(html, id)).toContain('data-open-desktop>');
  });

  it('exactly one btn-primary: the first door’s SEAL IT; the other SEAL ITs outlined', () => {
    for (const level of [simple, adv]) {
      const html = render(level(gmailMid()));
      expect(primaries(html)).toBe(1);
      expect(entryHtml(html, 'stuffing')).toMatch(/class="interior-btn btn-primary" href="#\/mission\/gmail-fortify-password\/briefing">SEAL IT/);
      for (const id of ['sim-swap', 'phishing']) {
        expect(entryHtml(html, id)).toMatch(/class="interior-btn interior-btn--quiet btn-secondary" href="[^"]+">SEAL IT/);
      }
      // No Fix it is lit while a SEAL IT is.
      expect(html).not.toMatch(/btn-primary ant-fix/);
    }
  });

  it('the ground floor starts open; a player who folds it keeps it folded', () => {
    const html = render(adv(gmailMid()));
    expect(html).toContain('<details class="floor floor--ground" open data-floor="ground">');
  });

  it('every building has at most one bright button, fresh and mid-game, in both modes', () => {
    for (const id of Object.keys(INTERIORS)) {
      for (const level of [simple, adv]) {
        for (const s of [createInitialState(), gmailMid()]) {
          expect(primaries(render(level(s), id)), id).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('a fresh building lights the first unchecked door’s START', () => {
    const html = render(adv(createInitialState()), 'facebook');
    expect(primaries(html)).toBe(1);
    expect(firstUnsealedEntry(toggleAccount(createInitialState(), 'facebook', true), 'facebook').id).toBe('stuffing');
    expect(entryHtml(html, 'stuffing')).toMatch(/class="interior-btn btn-primary"[^>]*>START/);
  });
});

describe('roof rows: Fix it for the weak ones, Check again for the healthy ones', () => {
  it('warn and crit rows get Fix it to the door they close; healthy rows a quiet Check again, never SWEEP', () => {
    const html = render(adv(gmailMid()));
    expect(rowHtml(html, 'two-factor')).toMatch(/>Fix it<\/a>/);
    expect(rowHtml(html, 'two-factor')).toContain('href="#/mission/gmail-fortify-2fa-upgrade/briefing"');
    expect(rowHtml(html, 'leak')).toContain('href="#/mission/gmail-fortify-password/briefing"');
    expect(rowHtml(html, 'devices')).toContain('<a class="ant-again" href="#/mission/gmail-recon-login/recheck">Check again</a>');
    expect(html).not.toMatch(/>SWEEP</);
  });

  it('with no open door, the worst row’s Fix it is lit, and only it', () => {
    // A leaked address whose password wasn't in the leak: the leak row is weak, no door is open.
    const s = file(createInitialState(), 'gmail-recon-breach', { finding: '1-2-breaches', password_exposed: 'no' });
    const html = render(adv(s));
    expect(rowHtml(html, 'leak')).toContain('data-status="warn"');
    expect(html).not.toContain('data-state="open"');
    expect(primaries(html)).toBe(1);
    expect(rowHtml(html, 'leak')).toMatch(/class="interior-btn btn-primary ant-fix" href="#\/mission\/gmail-fortify-password\/briefing">Fix it/);
    // The first unchecked door unfolds, its START outlined.
    expect(entryHtml(html, 'stuffing')).toContain('entry--first');
    expect(entryHtml(html, 'stuffing')).not.toContain('btn-primary');
  });

  it('a row whose door is open shows an outlined Fix it while that door’s SEAL IT is lit', () => {
    let s = file(createInitialState(), 'gmail-recon-breach', { finding: '1-2-breaches', password_exposed: 'no' });
    s = file(s, 'gmail-recon-login', { finding: '1-2-breaches' });
    const html = render(adv(s));
    expect(primaries(html)).toBe(1);
    expect(rowHtml(html, 'devices')).toMatch(/interior-btn--quiet btn-secondary ant-fix/);
  });

  it('Simple says the status in words, before the bars', () => {
    const html = render(simple(gmailMid()));
    expect(rowHtml(html, 'two-factor')).toMatch(/<span class="ant-word ant-word--warn">Could be better<\/span><span class="ant-bars/);
    expect(rowHtml(html, 'leak')).toContain('Needs fixing');
    expect(rowHtml(html, 'devices')).toContain('>Good<');
    expect(rowHtml(render(adv(gmailMid())), 'devices')).not.toContain('ant-word');
  });
});

describe('Simple: a filling bar, one leaks chip, and the rest under More', () => {
  const html = render(simple(gmailMid()));

  it('the count is a fill bar that says "1 of 4 doors locked"', () => {
    expect(html).toMatch(/data-fill-bar="building:gmail"/);
    expect(html).toContain('1 of 4 doors locked');
    expect(html).not.toContain('ENTRIES SEALED');
  });

  it('the badges fold into one chip that opens to them all', () => {
    const n = prismTagCount('gmail');
    expect(n).toBe(3);
    const chip = html.match(/<details class="leak-chip"[\s\S]*?<\/details>/)?.[0] ?? '';
    expect(chip).toContain('<summary>3 leaks name Gmail');
    expect(chip.match(/class="prism-tag/g)).toHaveLength(n);
    // Facebook's title carries none; its chip names it.
    const fb = render(simple(createInitialState()), 'facebook');
    expect(fb).toMatch(/<summary>\d+ leaks name Facebook/);
    expect(fb).toMatch(/<div class="interior-title">FACEBOOK LOGIN<\/div>/);
  });

  it('desk, alcove, devices, antennas and the floor hint wait under one "More about this building"', () => {
    const more = html.slice(html.indexOf('<details class="building-more"'));
    expect(more).toContain('<summary>More about this building</summary>');
    for (const s of ['Tap a floor to fold it.', 'Your devices', 'Why antennas fade', 'floor--alcove', 'floor--desk']) expect(more).toContain(s);
    const before = html.slice(0, html.indexOf('<details class="building-more"'));
    for (const s of ['tap a floor to fold it', 'Why antennas fade', 'data-devices', 'floor--desk', 'floor--alcove']) expect(before).not.toContain(s);
  });
});

describe('Advanced: the badges stay, under the count, tall enough to tap', () => {
  it('under the meter, not in the title, each at least 44px', () => {
    const html = render(adv(createInitialState()), 'facebook');
    expect(html).toMatch(/<div class="interior-title">FACEBOOK LOGIN<\/div>/);
    const meterAt = html.indexOf('interior-meter');
    const tagsAt = html.indexOf('<div class="interior-tags">');
    expect(tagsAt).toBeGreaterThan(meterAt);
    const tags = html.slice(tagsAt, html.indexOf('</div>', tagsAt));
    expect(tags.match(/class="prism-tag/g)).toHaveLength(prismTagCount('facebook'));
    for (const t of tags.match(/style="[^"]*"/g)) expect(t).toContain('min-height:44px');
    expect(html).not.toContain('leak-chip');
  });

  it('elsewhere the small badges are as they were', () => {
    expect(prismTag('gmail')).not.toContain('min-height:44px');
  });
});

describe('the Vault with flagged passwords left: SAVE is the next thing', () => {
  it('missions all done, 2 flagged: SAVE is the one bright button', () => {
    let s = createInitialState();
    // Twice: filing 2FA unlocks its backup mission.
    for (let i = 0; i < 2; i += 1) {
      for (const m of getMissionsForDistrict('vault').filter((x) => x.phase !== 'survey' && isMissionInPlay(s, x))) s = updateMission(s, m.id, { status: 'completed', method: 'authenticator' });
    }
    s = applyCategoryAction({ ...s, passwordManager: 'bitwarden' }, 'vault', 'flag', '2');
    for (const level of ['simplest', 'full']) {
      const html = renderDistrict(setReadLevel(s, level), 'vault', 'fortify').replace(/<style>[\s\S]*?<\/style>/g, '');
      expect(primaries(html), level).toBe(1);
      expect(html).toMatch(/class="btn-primary"[^>]*data-action="pm-cat-changed"/);
      expect(html).not.toMatch(/>100%</);
      const pct = calcDistrictProgress(s, 'vault').percent;
      expect(pct).toBeLessThan(100);
      expect(html).toContain(`>${pct}%<`);
    }
  });
});

describe('every district with only flagged passwords left has one bright button', () => {
  it('in both modes, on every tab', async () => {
    const { DISTRICTS } = await import('../src/data/districts.js');
    for (const d of DISTRICTS) {
      let s = { ...createInitialState(), passwordManager: 'bitwarden', districtsOn: { field: true } };
      for (let i = 0; i < 2; i += 1) {
        for (const m of getMissionsForDistrict(d.id).filter((x) => x.phase !== 'survey' && isMissionInPlay(s, x))) s = updateMission(s, m.id, { status: 'completed', method: 'authenticator' });
      }
      s = applyCategoryAction(s, d.id, 'flag', '2');
      if (!calcDistrictProgress(s, d.id).total) continue;
      for (const level of ['simplest', 'full']) {
        for (const tab of ['recon', 'fortify', 'reclaim']) {
          const html = renderDistrict(setReadLevel(s, level), d.id, tab).replace(/<style>[\s\S]*?<\/style>/g, '');
          expect(primaries(html), `${d.id} ${level} ${tab}`).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe('style', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  it('every new tap target is at least 44px', () => {
    for (const sel of ['.ant-again', '.leak-chip > summary', '.building-more > summary']) {
      const rule = css.match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\>]/g, '\\$&')} \\{[^}]*\\}`))?.[0] ?? '';
      expect(rule, sel).toMatch(/min-height: (4[4-9]|[5-9]\d)px/);
    }
  });
});
