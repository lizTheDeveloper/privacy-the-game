// Broken broker steps found 2026-10-18/19 (research/data-brokers/staging/policies/NOTES.md):
// Radaris's domain was transferred by court order, FindPeopleSearch's domain is parked and
// PrivateEye has no removal form left. Each step stays as an honest note (old saves keep
// the mission and its step count), and nothing still sends the player there.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { MISSIONS } from '../src/data/missions.js';

const mission = (id) => {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error(`no mission ${id}`);
  return m;
};
const everything = (id) => JSON.stringify(mission(id));
const stepFor = (id, name) => mission(id).steps.find((s) => s.text.startsWith(name));

function allSteps() {
  return MISSIONS.flatMap((m) => [m.steps || [], ...Object.values(m.stepsByManager || {}), ...Object.values(m.reportSteps || {})].flat()
    .map((s) => ({ id: m.id, ...s })));
}

const BROKERS_DIR = new URL('../research/data-brokers/brokers/', import.meta.url);
const brokers = readdirSync(BROKERS_DIR).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, BROKERS_DIR), 'utf8')));
const norm = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();
const host = (u) => norm(u).replace(/\/.*/, '');

describe('broker dataset vs mission steps', () => {
  // By host, not exact URL: a dead broker's other paths (or a query-string variant) are just as dead.
  it('no step links to the site of an opt-out the dataset records as dead or suspect', () => {
    const bad = new Set(brokers.filter((b) => b.optOut?.url && ['dead', 'suspect'].includes(b.optOut.status)).map((b) => host(b.optOut.url)));
    expect(bad.size).toBeGreaterThan(0);
    const hits = allSteps().filter((s) => s.url && bad.has(host(s.url))).map((s) => `${s.id}: ${s.url}`);
    expect(hits).toEqual([]);
  });

  it('no step links to a broker whose opt-out the dataset records as gone (method "none")', () => {
    const gone = new Set(brokers.filter((b) => b.optOut?.url && b.optOut.method === 'none').map((b) => host(b.optOut.url)));
    expect(gone.has('radaris.com')).toBe(true);
    const hits = allSteps().filter((s) => s.url && gone.has(host(s.url))).map((s) => `${s.id}: ${s.url}`);
    expect(hits).toEqual([]);
  });
});

describe('Radaris (domain transferred by court order)', () => {
  const id = 'people_search-fortify-privacy-portals';
  it('the step stays, as a note with no link', () => {
    const s = stepFor(id, 'Radaris');
    expect(s).toBeTruthy();
    expect(s.url).toBeUndefined();
    expect(s.text).toMatch(/court order/);
    expect(s.text).toMatch(/no opt-out/);
  });
  it('the briefing no longer says Radaris has a privacy control center, or lists Nuwber here', () => {
    expect(mission(id).briefing).not.toContain('Radaris has a privacy control center');
    expect(mission(id).briefing).not.toContain('Nuwber');
  });
  // Anything a player reads may mention Radaris only in the past tense or as gone.
  it('nothing claims Radaris still has a portal, control center or opt-out', () => {
    const present = /Radaris\b[^.]{0,80}(?<!used to )\b(has|have|offers?|runs?)\b[^.]{0,60}\b(portal|control|opt-?out|removal|form)/i;
    const hits = MISSIONS.filter((m) => present.test(JSON.stringify(m))).map((m) => m.id);
    expect(hits).toEqual([]);
    expect(mission('people_search-fortify-removal-links').briefing).not.toMatch(/Radaris/);
  });
  it('Scout does not count brokers that can no longer be cleared', () => {
    expect(everything(id)).not.toContain('Ten brokers cleared');
    expect(everything('people_search-reclaim-stragglers')).not.toContain('Thirteen individual opt-outs');
    expect(mission(id).scoutDialog.briefing).toMatch(/Radaris/);
  });
});

describe('PrivateEye (no removal form) and FindPeopleSearch (parked)', () => {
  it('PrivateEye is a note with no link', () => {
    const s = stepFor('people_search-fortify-extended-sweep-1', 'PrivateEye');
    expect(s).toBeTruthy();
    expect(s.url).toBeUndefined();
    expect(s.text).toMatch(/no removal form/);
    expect(everything('people_search-fortify-extended-sweep-1')).not.toContain('Five more brokers cleared');
  });
  it('FindPeopleSearch is a note with no link, and the briefing says so', () => {
    const m = mission('people_search-fortify-extended-sweep-3');
    const s = stepFor(m.id, 'FindPeopleSearch');
    expect(s).toBeTruthy();
    expect(s.url).toBeUndefined();
    expect(s.text).toMatch(/parked/);
    expect(m.briefing).not.toContain('FindPeopleSearch and Findpeoplesearch');
  });
});

describe('opt-out links moved to the page that has the request', () => {
  it('Lotame points at its privacy-choices page, not the policy redirect', () => {
    const urls = allSteps().filter((s) => /lotame\.com/.test(s.url || '')).map((s) => s.url);
    expect(urls).toEqual(['https://www.lotame.com/privacy/information-privacy-choices-services/']);
  });
  it('Placer.ai points at its consumer policy, which has the contact', () => {
    const urls = allSteps().filter((s) => /placer\.ai/.test(s.url || '')).map((s) => s.url);
    expect(urls).toEqual(['https://www.placer.ai/privacy-policy/consumer-privacy-policy']);
  });
});

describe('copy that must be true for every player', () => {
  // Not every player was scanned by DeleteMe; the sites commonly list people, and the
  // player should check whether they're on them.
  it('extended-sweep-1 does not claim the player was found in a scan', () => {
    const all = everything('people_search-fortify-extended-sweep-1');
    expect(all).not.toMatch(/DeleteMe/);
    expect(all).not.toMatch(/your actual data|real scan|with your data/);
    expect(mission('people_search-fortify-extended-sweep-1').briefing).toMatch(/Look yourself up/);
  });

  // California's Delete Act requires registered data brokers to process DROP requests.
  // Scout says it the way the law does, without claiming a count or "every" broker.
  it('Scout words DROP the way the Delete Act does', () => {
    const m = mission('people_search-reclaim-stragglers');
    expect(m.scoutDialog.briefing).not.toContain('every registered data broker has to process it');
    expect(m.scoutDialog.briefing).toContain("California's Delete Act requires the registered data brokers to process it");
    expect(JSON.stringify(m.scoutDialog)).not.toMatch(/every registered broker|\b600\b/);
  });
});

describe('location brokers: what works and what the FTC did', () => {
  it('Gravy Analytics links its live Opt Out & Do Not Sell form, and Scout counts it', () => {
    const m = mission('location_brokers-fortify-optout');
    const s = stepFor(m.id, 'Opt out of Gravy Analytics');
    expect(s?.url).toBe('https://gravyanalytics.com/opt-out-do-not-sell');
    expect(everything(m.id)).not.toContain('Its old privacy page no longer works');
    expect(m.scoutDialog.debrief['some-submitted']).toMatch(/Gravy Analytics/);
  });

  // FTC orders against X-Mode, Gravy/Venntel and Mobilewalla restrict selling sensitive
  // location data; they are not bans on the companies, and the Gravy order was final in 2025.
  it('Scout does not overstate the FTC orders', () => {
    const scout = mission('location_brokers-reclaim-legal').scoutDialog.briefing;
    expect(scout).not.toMatch(/banned three/);
    expect(scout).not.toMatch(/delete all previously collected data/);
    expect(scout).toMatch(/brought cases against several location data brokers since 2024/);
    expect(everything('location_brokers-fortify-optout')).not.toMatch(/a 2024 FTC order/);
  });

  it('the DROP step names Gravy by its registered name', () => {
    expect(everything('location_brokers-reclaim-legal')).toContain('registered as Unacast');
  });
});

describe('dialogue.js words DROP the way the law does', () => {
  it('no line says DROP reaches every or all registered brokers', async () => {
    const src = readFileSync(new URL('../src/data/dialogue.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/(reaches|to) every (registered )?broker|of all registered data brokers/);
    expect(src).toMatch(/the law requires registered data brokers to process it/);
  });
});

// 2026-10-24: the NAI runs no one-shot opt-out any more (thenai.org/how-to-opt-out/, archived
// https://web.archive.org/web/20261024073031/https://thenai.org/how-to-opt-out/): a GPC Chrome extension,
// links to each member's own opt-out, and the DAA's tools. Only DAA WebChoices is a bulk opt-out.
describe('the NAI is a signpost, not a bulk opt-out', async () => {
  const { BROKER_CHECKLISTS } = await import('../src/data/broker-checklists.js');
  const { DISTRICT_DIALOGUE } = await import('../src/data/dialogue.js');
  it('no mission or dialogue says the NAI opts you out in one session', () => {
    const all = everything('ad_trackers-fortify-bulk') + everything('ad_trackers-recon-understand') + JSON.stringify(DISTRICT_DIALOGUE.reclamation);
    for (const p of ['NAI and DAA tools cover', 'NAI opt-out alone', 'Two tools, one hundred-plus', 'select and opt out of member', 'NAI Consumer Opt-Out', 'hundred-plus', '100+ Ad Networks']) expect(all).not.toContain(p);
    expect(everything('ad_trackers-fortify-bulk')).toContain('The NAI no longer has a one-click tool');
  });
  // Final review M8: one bulk tool now, so the recon debrief says so.
  it('the recon debrief names one bulk opt-out, the DAA\'s', () => {
    const debrief = JSON.stringify(mission('ad_trackers-recon-understand').scoutDialog.debrief);
    expect(debrief).not.toMatch(/bulk opt-out tools/);
    expect(debrief).toContain('the DAA bulk opt-out');
  });
  it('the checklist keeps the nai id but says it lights nothing', () => {
    const line = BROKER_CHECKLISTS['ad_trackers-fortify-bulk'].find((l) => l.id === 'nai');
    expect(line.label).toBe('NAI: GPC extension or member links');
    expect(line.hint).toMatch(/no longer opts you out in one go.*It lights nothing on the map\./);
  });
});

// Review M5 (2026-10-24): the copy hedges the cookie tool and keeps "about a hundred" tied to the data.
describe('the WebChoices copy says what the tool can do', async () => {
  const { DISTRICT_DIALOGUE } = await import('../src/data/dialogue.js');
  const map = JSON.parse(readFileSync(new URL('../src/data/broker-map.json', import.meta.url), 'utf8'));
  it('"about a hundred" holds while the DAA sweep has 90-110 members', () => {
    const copy = everything('ad_trackers-fortify-bulk') + DISTRICT_DIALOGUE.reclamation.facilityIntros.ad_trackers;
    expect(copy).toMatch(/about a hundred/);
    expect(mission('ad_trackers-fortify-bulk').title).toBe('Bulk Opt-Out: About 100 Ad Companies');
    expect(map.sweeps.daa.members.length).toBeGreaterThanOrEqual(90);
    expect(map.sweeps.daa.members.length).toBeLessThanOrEqual(110);
  });
  it('says the tool tries, and that blocking third-party cookies can make it fail', () => {
    const m = mission('ad_trackers-fortify-bulk');
    for (const t of [m.briefing, m.scoutDialog.briefing, DISTRICT_DIALOGUE.reclamation.facilityIntros.ad_trackers]) {
      expect(t).toMatch(/tries/);
      expect(t).toMatch(/blocks? third-party cookies/);
    }
    expect(everything('ad_trackers-fortify-bulk')).not.toMatch(/alternative is government regulation|fear more/);
  });
});
