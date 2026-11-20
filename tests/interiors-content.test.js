// Building Interiors, task 1: the content model. Every threat has a name and
// every claim has a source (spec: docs/superpowers/specs/2026-10-20-building-interiors-design.md).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { INTERIORS, hasInterior, getInterior } from '../src/data/interiors/index.js';
import { SAINTS, saintsForAccount } from '../src/data/interiors/saints.js';
import { MISSIONS } from '../src/data/missions.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/verified-urls.json', import.meta.url), 'utf8'));

const RULES = new Set(['password-unique', 'sim-swap', 'phishing', 'devices', 'reglock', 'beyond']);
const METAPHORS = new Set(['front-door', 'phone-line', 'mail-slot', 'back-room', 'vents', 'number']);
const interiors = Object.values(INTERIORS);
const saints = Object.values(SAINTS);

function strings(value, path = '', out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) strings(v, `${path}.${k}`, out);
  return out;
}

function everySourced() {
  const out = [];
  for (const i of interiors) {
    for (const l of i.desk) out.push([`${i.accountId} desk ${l.id}`, l.sources]);
    for (const e of i.entries) out.push([`${i.accountId} entry ${e.id}`, e.sources]);
  }
  for (const s of saints) out.push([`saint ${s.id}`, s.sources]);
  return out;
}

describe('interior content', () => {
  it('every interior has a desk, entries, and only known rules', () => {
    expect(interiors.length).toBeGreaterThan(0);
    for (const i of interiors) {
      expect(INTERIORS[i.accountId], i.accountId).toBe(i);
      expect(typeof i.company).toBe('string');
      expect(i.deskIntro.length).toBeGreaterThan(0);
      expect(i.desk.length, i.accountId).toBeGreaterThan(0);
      expect(i.entries.length, i.accountId).toBeGreaterThan(0);
      for (const l of i.desk) for (const k of ['id', 'actor', 'tool', 'gets']) expect(typeof l[k] === 'string' && l[k].length > 0, `${l.id}.${k}`).toBe(true);
      for (const e of i.entries) {
        expect(RULES.has(e.rule), `${i.accountId}/${e.id} rule ${e.rule}`).toBe(true);
        expect(METAPHORS.has(e.metaphor), `${i.accountId}/${e.id} metaphor ${e.metaphor}`).toBe(true);
        for (const k of ['id', 'actor', 'how']) expect(typeof e[k] === 'string' && e[k].length > 0, `${e.id}.${k}`).toBe(true);
      }
      expect(new Set(i.entries.map((e) => e.id)).size).toBe(i.entries.length);
      expect(new Set(i.desk.map((l) => l.id)).size).toBe(i.desk.length);
    }
    expect(hasInterior('gmail')).toBe(true);
    expect(hasInterior('netflix')).toBe(false);
    expect(getInterior('netflix')).toBe(null);
    expect(getInterior('gmail')).toBe(INTERIORS.gmail);
  });

  it('every lane, entry and saint has at least one source', () => {
    for (const [where, sources] of everySourced()) {
      expect(Array.isArray(sources) && sources.length > 0, where).toBe(true);
      for (const s of sources) {
        expect(typeof s.label === 'string' && s.label.length > 0, `${where} label`).toBe(true);
        expect(s.url, where).toMatch(/^https:\/\//);
      }
    }
  });

  it('every source url is in verified-urls.json', () => {
    const missing = everySourced().flatMap(([where, sources]) => sources.filter((s) => !Object.hasOwn(fixture.urls, s.url)).map((s) => `${where}: ${s.url}`));
    expect(missing).toEqual([]);
  });

  it('no interior or saint copy says "they"', () => {
    const hits = [...strings(INTERIORS, 'INTERIORS'), ...strings(SAINTS, 'SAINTS')].filter(([, s]) => /\bthey\b/i.test(s)).map(([p]) => p);
    expect(hits).toEqual([]);
  });

  it('no actor is an unnamed group', () => {
    const vague = /^(the )?(government|hackers?|someone|attackers?|criminals?)$/i;
    for (const i of interiors) {
      for (const x of [...i.desk, ...i.entries]) expect(vague.test(x.actor.trim()), `${i.accountId}/${x.id}: ${x.actor}`).toBe(false);
    }
  });

  it('fixMission ids exist in MISSIONS and belong to the same account', () => {
    const byId = new Map(MISSIONS.map((m) => [m.id, m]));
    for (const i of interiors) {
      for (const e of i.entries) {
        if (!e.fixMission) continue;
        expect(byId.has(e.fixMission), `${i.accountId}/${e.id}: ${e.fixMission}`).toBe(true);
        expect(byId.get(e.fixMission).accountId, e.fixMission).toBe(i.accountId);
      }
    }
  });

  it('saint ids referenced by interiors exist, and Swartz is spelled Swartz', () => {
    for (const i of interiors) {
      for (const id of i.saints) {
        expect(SAINTS[id], `${i.accountId}: ${id}`).toBeTruthy();
        expect(SAINTS[id].accounts, id).toContain(i.accountId);
      }
      expect(saintsForAccount(i.accountId).map((s) => s.id).sort()).toEqual([...i.saints].sort());
    }
    for (const s of saints) {
      expect(SAINTS[s.id]).toBe(s);
      for (const k of ['name', 'title', 'years', 'tribute', 'story']) expect(typeof s[k] === 'string' && s[k].length > 0, `${s.id}.${k}`).toBe(true);
    }
    const all = JSON.stringify([INTERIORS, SAINTS]);
    expect(all).not.toMatch(/Schwartz/i);
    expect(SAINTS.swartz.name).toMatch(/Aaron Swartz/);
    expect(saints.map((s) => s.id)).toEqual(['swartz', 'snowden', 'klein', 'zimmermann', 'ellsberg', 'manning', 'drake', 'binney', 'poitras']);
    expect(SAINTS.snowden.accounts.sort()).toEqual(['apple_id', 'facebook', 'gmail', 'google', 'icloud', 'microsoft', 'outlook', 'yahoo']);
    expect(SAINTS.zimmermann.accounts.sort()).toEqual(['protonmail', 'signal']);
    for (const s of saints) if (!['snowden', 'zimmermann'].includes(s.id)) expect(s.accounts, s.id).toEqual([]);
    expect(saintsForAccount('gmail').map((s) => s.id)).toEqual(['snowden']);
    expect(saintsForAccount('netflix')).toEqual([]);
  });

  it('gmail interior has the five named desk lanes and five entries', () => {
    expect(getInterior('gmail').desk.map((l) => l.id)).toEqual(['local-police', 'fbi', 'nsa-702', 'ice-hsi', 'uk-cloud-act']);
    expect(getInterior('gmail').entries.map((e) => e.metaphor)).toEqual(['front-door', 'phone-line', 'mail-slot', 'back-room', 'vents']);
    expect(getInterior('gmail').entries.map((e) => e.rule)).toEqual(['password-unique', 'sim-swap', 'phishing', 'devices', 'beyond']);
  });

  it('gmail vents name the CIA, Chinese state hackers (Aurora) and a Pegasus customer, each sourced', () => {
    const vents = getInterior('gmail').entries.filter((e) => e.metaphor === 'vents');
    const text = JSON.stringify(vents);
    expect(text).toMatch(/CIA/);
    expect(text).toMatch(/Aurora/);
    expect(text).toMatch(/Pegasus/);
    const urls = vents.flatMap((e) => e.sources.map((s) => s.url));
    expect(urls).toContain('https://wikileaks.org/ciav7p1/');
    expect(urls).toContain('https://en.wikipedia.org/wiki/Vault_7');
    expect(urls).toContain('https://googleblog.blogspot.com/2010/01/new-approach-to-china.html');
    expect(urls).toContain('https://en.wikipedia.org/wiki/Operation_Aurora');
    expect(urls).toContain('https://citizenlab.ca/tag/nso-group/');
    expect(urls).toContain('https://en.wikipedia.org/wiki/Pegasus_(spyware)');
  });

  it('the NSA lane words 702 as "has let", never as settled law in 2026', () => {
    const nsa = getInterior('gmail').desk.find((l) => l.id === 'nsa-702');
    expect(nsa.gets).toMatch(/has let/);
    expect(nsa.gets).toMatch(/specific targets/);
    expect(nsa.gets).toMatch(/your side of the conversation/);
    expect(JSON.stringify(nsa)).toMatch(/PRISM/);
    for (const agency of ['GCHQ', 'CSE', 'ASD', 'GCSB']) expect(JSON.stringify(nsa), agency).toContain(agency);
  });
});

describe('Master Keys and Signal interiors (task 7)', () => {
  const MASTER_KEYS = ['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'apple_id', 'google', 'microsoft', 'facebook'];
  const COMPANY = { gmail: 'Google', google: 'Google', outlook: 'Microsoft', microsoft: 'Microsoft', icloud: 'Apple', apple_id: 'Apple', yahoo: 'Yahoo', facebook: 'Meta', protonmail: 'Proton', signal: 'Signal' };
  const US_LANES = ['local-police', 'fbi', 'nsa-702', 'ice-hsi', 'uk-cloud-act'];

  it('all nine Master Keys accounts and signal have interiors', () => {
    for (const id of [...MASTER_KEYS, 'signal']) {
      expect(hasInterior(id), id).toBe(true);
      expect(getInterior(id).accountId).toBe(id);
      expect(getInterior(id).company, id).toBe(COMPANY[id]);
    }
  });

  it('every US company desk has the five lanes, and every PRISM-named one says so', () => {
    for (const id of MASTER_KEYS.filter((a) => a !== 'protonmail')) {
      const desk = getInterior(id).desk;
      expect(desk.map((l) => l.id), id).toEqual(US_LANES);
      const nsa = desk.find((l) => l.id === 'nsa-702');
      expect(nsa.gets, id).toMatch(/named in the 2013 PRISM documents/);
      expect(nsa.gets, id).toMatch(/has let/);
      for (const lane of desk) expect(lane.gets, `${id}/${lane.id}`).toContain(COMPANY[id]);
    }
  });

  it('each company desk cites that company’s own page on government requests', () => {
    const own = {
      Google: 'https://policies.google.com/terms/information-requests',
      Microsoft: 'https://www.microsoft.com/en-us/corporate-responsibility/reports/government-requests/customer-data',
      Apple: 'https://www.apple.com/legal/privacy/law-enforcement-guidelines-us.pdf',
      Yahoo: 'https://www.yahooinc.com/transparency/about/faq-glossary.html',
      Meta: 'https://www.meta.com/safety/communities/law/guidelines/',
    };
    for (const id of MASTER_KEYS.filter((a) => a !== 'protonmail')) {
      for (const lane of getInterior(id).desk) {
        expect(lane.sources.map((s) => s.url), `${id}/${lane.id}`).toContain(own[COMPANY[id]]);
      }
    }
  });

  it('the warrant line claims "requires" only where the company’s page says it', () => {
    const police = (id) => getInterior(id).desk.find((l) => l.id === 'local-police').gets;
    for (const id of ['gmail', 'google', 'outlook', 'microsoft', 'icloud', 'apple_id']) {
      expect(police(id), id).toMatch(/police need a search warrant signed by a judge/);
      expect(police(id), id).not.toMatch(/requires/);
    }
    expect(police('facebook')).toMatch(/requires a search warrant/);
    expect(police('yahoo')).not.toMatch(/requires/);
    expect(police('yahoo')).toMatch(/search warrant/);
    expect(police('facebook')).toMatch(/end-to-end encrypt/);
  });

  it('protonmail desk has no FBI/NSA/ICE/UK lanes and has a Swiss lane', () => {
    const p = getInterior('protonmail');
    const ids = p.desk.map((l) => l.id);
    for (const banned of US_LANES) expect(ids, banned).not.toContain(banned);
    for (const l of p.desk) expect(l.actor.trim(), l.id).not.toMatch(/^(FBI|NSA|ICE \/ HSI|UK investigators)/);
    const swiss = p.desk.find((l) => /swiss/.test(l.id));
    expect(swiss).toBeTruthy();
    expect(swiss.actor).toMatch(/Swiss/);
    expect(JSON.stringify(p.desk)).toMatch(/2021/);
    expect(JSON.stringify(p.desk)).toMatch(/climate activist/);
    expect(JSON.stringify(p.desk)).toMatch(/IP address/);
    expect(JSON.stringify(p.desk)).toMatch(/encrypt/);
    const urls = p.desk.flatMap((l) => l.sources.map((s) => s.url));
    expect(urls).toContain('https://proton.me/legal/transparency');
    expect(urls).toContain('https://proton.me/blog/climate-activist-arrest');
    expect(p.saints).toEqual(['zimmermann']);
  });

  it('iCloud and Apple ID say what Advanced Data Protection moves off the desk, and that iCloud Mail is not covered', () => {
    for (const id of ['icloud', 'apple_id']) {
      const i = getInterior(id);
      const text = JSON.stringify(i.desk) + i.deskIntro;
      expect(text, id).toMatch(/Advanced Data Protection/);
      expect(text, id).toMatch(/iCloud Mail/);
      expect(i.desk.flatMap((l) => l.sources.map((s) => s.url)), id).toContain('https://support.apple.com/en-us/102651');
    }
  });

  it('facebook is Meta and PRISM-named, with Snowden in the alcove', () => {
    const f = getInterior('facebook');
    expect(f.company).toBe('Meta');
    expect(f.saints).toEqual(['snowden']);
    expect(f.desk.find((l) => l.id === 'nsa-702').sources.map((s) => s.url)).toContain('https://www.theguardian.com/world/2013/jun/06/us-tech-giants-nsa-data');
  });

  it('signal desk is a single lane sourced to Signal’s subpoena responses', () => {
    const s = getInterior('signal');
    expect(s.desk).toHaveLength(1);
    const [lane] = s.desk;
    expect(lane.actor).toBe('Any agency, any legal process');
    expect(lane.gets).toMatch(/account/i);
    expect(lane.gets).toMatch(/last connect/i);
    expect(lane.sources.map((x) => x.url)).toContain('https://signal.org/bigbrother/');
    expect(s.deskIntro).toMatch(/devices/);
    expect(s.deskIntro).toMatch(/not on Signal’s servers/);
    expect(s.saints).toEqual(['zimmermann']);
  });

  it('signal entries: number/reglock, back-room/devices, vents/beyond, and the unlocked phone', () => {
    const e = getInterior('signal').entries;
    const by = Object.fromEntries(e.map((x) => [x.metaphor + '/' + x.rule, x]));
    expect(by['number/reglock']?.fixMission).toBe('signal-fortify-reglock');
    expect(by['back-room/devices']?.fixMission).toBe('signal-recon-devices');
    expect(by['vents/beyond']).toBeTruthy();
    expect(JSON.stringify(by['vents/beyond'])).toMatch(/spyware/i);
    const unlocked = e.find((x) => x.id === 'unlocked-phone');
    expect(unlocked.rule).toBe('beyond');
    expect(unlocked.narrows).toBe('Disappearing messages limit what is there.');
  });

  it('Snowden’s alcove is in every PRISM-named account, Zimmermann’s in protonmail and signal', () => {
    for (const id of ['gmail', 'google', 'outlook', 'microsoft', 'yahoo', 'icloud', 'apple_id', 'facebook']) expect(getInterior(id).saints, id).toEqual(['snowden']);
    for (const id of ['protonmail', 'signal']) expect(getInterior(id).saints, id).toEqual(['zimmermann']);
  });

  it('protonmail says subject lines are not end-to-end encrypted, and never that the desk cannot reach your mail at all', () => {
    const p = getInterior('protonmail');
    const text = p.deskIntro + JSON.stringify(p.desk);
    expect(text).toMatch(/Subject lines aren’t end-to-end encrypted/);
    expect(text).not.toMatch(/can’t reach your mail/);
    expect(text).not.toMatch(/can’t hand over what you wrote/);
  });
});

describe('final fixes: Proton phishing seal caveat', () => {
  it('a sealed Proton mail slot notes the authenticator backup, citing Proton support', async () => {
    const { getInterior } = await import('../src/data/interiors/index.js');
    const e = getInterior('protonmail').entries.find((x) => x.rule === 'phishing');
    expect(e.sealedNote).toBe('Sealed while you sign in with the security key. If an authenticator code still works as a backup, a page that asks for your password and a code is the tell.');
    expect(e.sources.map((x) => x.url)).toContain('https://proton.me/support/two-factor-authentication-2fa');
    expect(e.sealedNote).not.toMatch(/\bthey\b/i);
  });
});
