import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderBriefing } from '../src/screens/briefing.js';
import { renderDistrict } from '../src/screens/district.js';
import { MISSIONS } from '../src/data/missions.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { PASSWORD_MANAGERS } from '../src/data/missions-passwords.js';
import { createInitialState, saveState, loadState } from '../src/state.js';
import { parseRoute } from '../src/router.js';
import { isPrivateBreadcrumb } from '../src/utils/errorNoise.js';
import { restoreEvents } from '../src/utils/restore.js';
import { missionEventData } from '../src/utils/debrief.js';
import { reportBody } from '../src/components/bug-reporter.js';
import { umamiPayload } from '../src/utils/restore-send.js';
import { pageviewUrl, errorContext } from '../src/utils/pageview-url.js';
import {
  BANK_NOTE_ACCOUNTS, addBankNote, updateBankNote, removeBankNote, bankNotes, safeUrl, managerPointer,
  primaryLinkKind, ANY_BANK_STEPS,
} from '../src/utils/bank-notes.js';
import { renderBankNotesScreen, renderBankNotesPanel, PRIVACY_NOTE, NO_PASSWORDS_NOTE } from '../src/components/bank-notes.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
beforeEach(() => { globalThis.localStorage = memory(); });

const VAULT_MISSIONS = MISSIONS.filter((m) => ACCOUNTS[m.accountId]?.district === 'vault');
const mission = (id) => MISSIONS.find((m) => m.id === id);
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function withNotes(...notes) {
  let s = createInitialState();
  for (const n of notes) {
    const r = addBankNote(s, n);
    expect(r.error).toBeUndefined();
    s = r.state;
  }
  return s;
}

// Every in-game link resolves to a real screen; "#" and unknown routes fall back to the city map.
function deadHashLinks(html) {
  const bad = [];
  for (const [, href] of html.matchAll(/href="([^"]*)"/g)) {
    if (!href.startsWith('#')) continue;
    const hash = href.replace(/&amp;/g, '&');
    if (hash === '#' || (parseRoute(hash).screen === 'city' && hash !== '#/city')) bad.push(hash);
  }
  return bad;
}

const goUrl = (html) => html.match(/data-action="go-do-it"[^>]*data-url="([^"]*)"/)?.[1] ?? null;
const outLinks = (html) => [...html.matchAll(/<a [^>]*href="(https?:[^"]*)"/g)].map((m) => m[1]);

describe('the Vault has no dead ends (Liz 2026-11-01: "the vault doesn\'t take you anywhere")', () => {
  it('every Vault briefing, fresh or started, has somewhere to go: a site, or the bank notes', () => {
    const bad = [];
    for (const m of VAULT_MISSIONS) {
      for (const started of [false, true]) {
        const s = { ...createInitialState(), ...(started ? { startedMissions: { [m.id]: 'x' } } : {}) };
        const h = renderBriefing(s, m.id);
        // A site of the mission's own: GO DO IT, a step link, or a saved bank (not the HUD's links).
        const hasSite = goUrl(h)?.startsWith('https://') || /data-action="(?:mission-step|bank-note-open)"/.test(h);
        const hasNotes = h.includes('href="#/vault/banks?from=');
        if (!hasSite && !hasNotes) bad.push(m.id);
        const dead = deadHashLinks(h);
        if (dead.length) bad.push(`${m.id}: ${dead.join(' ')}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every Vault mission for an unknown bank, card, exchange or brokerage shows the bank notes', () => {
    const ids = VAULT_MISSIONS.filter((m) => BANK_NOTE_ACCOUNTS.has(m.accountId)).map((m) => m.id);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    for (const id of ids) expect(renderBriefing(createInitialState(), id)).toContain('data-bank-panel');
  });

  it('the Vault district screen links to the bank notes on every tab, and no link on it is dead', () => {
    for (const tab of ['survey', 'recon', 'fortify', 'reclaim']) {
      const h = renderDistrict(createInitialState(), 'vault', tab);
      expect(h).toContain('href="#/vault/banks"');
      expect(deadHashLinks(h)).toEqual([]);
    }
    // Not on other districts.
    expect(renderDistrict(createInitialState(), 'square', 'recon')).not.toContain('#/vault/banks');
  });

  it('the bank-notes screen links nowhere dead, with or without a mission to go back to', () => {
    const s = withNotes({ name: 'First CU', loginUrl: 'firstcu.example.org' });
    expect(deadHashLinks(renderBankNotesScreen(s))).toEqual([]);
    const h = renderBankNotesScreen(s, { from: 'primary_bank-fortify-2fa' });
    expect(h).toContain('href="#/mission/primary_bank-fortify-2fa/briefing"');
    expect(deadHashLinks(h)).toEqual([]);
    // An unknown "from" goes back to the Vault instead.
    expect(renderBankNotesScreen(s, { from: 'nope' })).toContain('href="#/district/vault"');
  });

  it('#/vault/banks is a screen, with an optional mission to go back to', () => {
    expect(parseRoute('#/vault/banks')).toEqual({ screen: 'bank-notes', params: { from: null } });
    expect(parseRoute('#/vault/banks?from=primary_bank-fortify-password')).toEqual({ screen: 'bank-notes', params: { from: 'primary_bank-fortify-password' } });
  });
});

describe('unknown bank: ask, never a dead end', () => {
  it('with no notes the panel asks which bank, links to the list, and gives steps that work at any bank', () => {
    const h = renderBriefing(createInitialState(), 'primary_bank-fortify-password');
    expect(h).toContain('Which bank?');
    expect(h).toContain('href="#/vault/banks?from=primary_bank-fortify-password"');
    expect(h).toContain('WORKS AT ANY BANK');
    for (const step of ANY_BANK_STEPS) expect(h).toContain(escHtml(step).replace(/&#39;/g, "'"));
    // Nothing to open yet: START keeps the steps on screen, never a "#".
    expect(h).toContain('data-action="start-mission"');
    expect(goUrl(h)).toBeNull();
  });

  it('the generic steps name the actor, never a vague "they"', () => {
    const text = ANY_BANK_STEPS.join(' ');
    expect(text).toMatch(/phisher/);
    expect(text).toMatch(/scammer with your login/);
    expect(text).not.toMatch(/\bthey\b/i);
  });

  it('a note with no address yet sends the player back to add one', () => {
    const h = renderBriefing(withNotes({ name: 'Mystery Bank' }), 'primary_bank-fortify-2fa');
    expect(h).toContain('Mystery Bank');
    expect(h).toContain('No address saved yet: add one');
  });
});

describe('more than one bank', () => {
  it('adds, edits and deletes several notes', () => {
    let s = withNotes({ name: 'Bank A', loginUrl: 'a.example.com' }, { name: 'Bank B' }, { name: 'Card C', resetUrl: 'https://c.example.com/reset' });
    expect(bankNotes(s).map((n) => n.name)).toEqual(['Bank A', 'Bank B', 'Card C']);
    const b = bankNotes(s)[1];
    s = updateBankNote(s, b.id, { name: 'Bank B2', loginUrl: 'https://b.example.com/login' }).state;
    expect(bankNotes(s)[1]).toEqual({ id: b.id, name: 'Bank B2', loginUrl: 'https://b.example.com/login', resetUrl: '' });
    s = removeBankNote(s, bankNotes(s)[0].id);
    expect(bankNotes(s).map((n) => n.name)).toEqual(['Bank B2', 'Card C']);
    // A new note never reuses a live id.
    s = addBankNote(s, { name: 'Bank D' }).state;
    expect(new Set(bankNotes(s).map((n) => n.id)).size).toBe(3);
  });

  it('the briefing links every saved bank, the mission\'s kind of page first', () => {
    const s = withNotes(
      { name: 'Bank A', loginUrl: 'https://a.example.com/login', resetUrl: 'https://a.example.com/reset' },
      { name: 'Bank B', loginUrl: 'https://b.example.com/' },
    );
    const reset = renderBriefing(s, 'primary_bank-fortify-password');
    expect(outLinks(reset)).toEqual(expect.arrayContaining(['https://a.example.com/reset', 'https://a.example.com/login', 'https://b.example.com/']));
    expect(reset.indexOf('https://a.example.com/reset')).toBeLessThan(reset.indexOf('https://a.example.com/login'));
    const login = renderBriefing(s, 'primary_bank-fortify-alerts');
    expect(login.indexOf('https://a.example.com/login')).toBeLessThan(login.indexOf('https://a.example.com/reset'));
    // Two places to go: the player picks one in the panel; the main button is START.
    expect(goUrl(reset)).toBeNull();
    expect(reset).toContain('data-action="start-mission"');
    // Each bank link records the start (I DID IT on return) without a track().
    expect(reset).toMatch(/class="bank-note-link"[^>]*data-action="bank-note-open" data-mission="primary_bank-fortify-password"/);
  });

  it('with one bank saved, its link is the way out and GO DO IT carries no bank address', () => {
    const s = withNotes({ name: 'Only Bank', loginUrl: 'https://only.example.com/' });
    const h = renderBriefing(s, 'primary_bank-fortify-2fa');
    expect(outLinks(h)).toContain('https://only.example.com/');
    expect(goUrl(h)).toBeNull();
    expect(h).toContain('data-action="start-mission"');
  });

  it('password missions go to the reset page first, the rest to the login page', () => {
    expect(primaryLinkKind(mission('primary_bank-fortify-password'))).toBe('reset');
    expect(primaryLinkKind(mission('primary_bank-recon-password'))).toBe('reset');
    expect(primaryLinkKind(mission('crypto_exchange-fortify-lockdown'))).toBe('reset');
    expect(primaryLinkKind(mission('primary_bank-fortify-alerts'))).toBe('login');
    expect(primaryLinkKind(mission('credit_card-recon-breach'))).toBe('login');
  });

  it('the screen lists every note with edit and delete, and the form edits the chosen one', () => {
    const s = withNotes({ name: 'Bank A' }, { name: 'Bank B', loginUrl: 'b.example.com' });
    const h = renderBankNotesScreen(s);
    expect(h).toContain('SAVED · 2');
    expect(h.match(/data-action="bank-note-edit"/g)).toHaveLength(2);
    expect(h.match(/data-action="bank-note-delete"/g)).toHaveLength(2);
    const id = bankNotes(s)[1].id;
    const edit = renderBankNotesScreen(s, { editId: id });
    expect(edit).toContain(`data-edit="${id}"`);
    expect(edit).toContain('value="Bank B"');
    expect(edit).toContain('value="https://b.example.com/"');
  });

  it('notes survive a save and a reload (the local save only)', () => {
    const storage = memory();
    const s = withNotes({ name: 'Bank A', loginUrl: 'a.example.com' }, { name: 'Bank B' });
    saveState(s, storage);
    expect(bankNotes(loadState(storage)).map((n) => n.name)).toEqual(['Bank A', 'Bank B']);
  });
});

describe('saved addresses are user data: checked and escaped', () => {
  it('only http(s) web addresses are kept', () => {
    expect(safeUrl('chase.example')).toBe('https://chase.example/');
    expect(safeUrl(' https://bank.example/login ')).toBe('https://bank.example/login');
    expect(safeUrl('http://cu.example/x')).toBe('http://cu.example/x');
    expect(safeUrl('')).toBe('');
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,hi', 'mailto:a@b.c', 'chrome://settings', 'file:///etc/passwd', 'not a url', 'bank', 'https://user:pw@bank.example/', '//evil.example']) {
      expect(safeUrl(bad), bad).toBeNull();
    }
  });

  it('a bad address is refused with a reason, and nothing is saved', () => {
    const s = createInitialState();
    expect(addBankNote(s, { name: 'X', loginUrl: 'javascript:alert(1)' })).toEqual({ state: s, error: 'loginUrl' });
    expect(addBankNote(s, { name: 'X', resetUrl: 'data:x' })).toEqual({ state: s, error: 'resetUrl' });
    expect(addBankNote(s, { name: '   ' })).toEqual({ state: s, error: 'name' });
    expect(renderBankNotesScreen(s, { error: 'loginUrl', draft: { name: 'X', loginUrl: 'javascript:alert(1)' } })).toContain('doesn’t look like a web address');
  });

  it('names and addresses are escaped, and links open with noopener noreferrer', () => {
    const name = '"><img src=x onerror=alert(1)>';
    const s = withNotes({ name, loginUrl: 'https://bank.example/?a="b"&c=<d>' });
    for (const h of [renderBriefing(s, 'primary_bank-fortify-2fa'), renderBankNotesScreen(s), renderBankNotesScreen(s, { editId: bankNotes(s)[0].id })]) {
      expect(h).not.toContain('<img src=x');
      expect(h).toContain('&lt;img src=x onerror=alert(1)&gt;');
      for (const [tag] of h.matchAll(/<a [^>]*class="bank-note-link"[^>]*>/g)) {
        expect(tag).toContain('target="_blank"');
        expect(tag).toContain('rel="noopener noreferrer"');
        expect(tag).toMatch(/href="https?:/);
      }
    }
  });

  it('a hand-edited save with a bad address draws no link', () => {
    const s = { ...createInitialState(), bankNotes: [{ id: 'b1', name: 'Bad', loginUrl: 'javascript:alert(1)', resetUrl: 'data:x' }] };
    const h = renderBriefing(s, 'primary_bank-fortify-2fa');
    expect(h).not.toContain('javascript:');
    expect(h).not.toContain('data:x');
    expect(renderBankNotesScreen(s)).not.toMatch(/href="(?:javascript|data):/);
  });
});

describe('never a password, and the player is told where it\'s kept', () => {
  it('no password input; fields opt out of autofill; the notes say what not to type and where it lives', () => {
    const h = renderBankNotesScreen(withNotes({ name: 'Bank A' }));
    expect(h).not.toMatch(/type="password"/);
    expect(h).not.toMatch(/autocomplete="(?:current|new)-password"/);
    expect(h).not.toMatch(/data-field="password"/i);
    for (const [tag] of h.matchAll(/<input [^>]*>/g)) {
      expect(tag).toContain('type="text"');
      expect(tag).toContain('autocomplete="off"');
    }
    expect(h).toContain(escHtml(NO_PASSWORDS_NOTE).replace(/&#39;/g, "'"));
    expect(h).toContain(PRIVACY_NOTE);
    expect(PRIVACY_NOTE).toMatch(/only in this browser/);
    expect(PRIVACY_NOTE).toMatch(/analytics/);
    // The privacy line is beside the form and on every mission panel.
    expect(h.slice(h.indexOf('data-bank-note-form'))).toContain(PRIVACY_NOTE);
    expect(renderBriefing(createInitialState(), 'credit_card-fortify-alerts')).toContain(PRIVACY_NOTE);
  });
});

describe('where the bank logins already live: the password manager the player told us', () => {
  const managers = PASSWORD_MANAGERS.map((p) => p.value).filter((v) => v !== 'none');

  it.each(managers)('%s: a pointer on the bank notes and the mission panel', (pm) => {
    const s = { ...createInitialState(), passwordManager: pm };
    const p = managerPointer(pm);
    expect(p?.text).toMatch(/bank/);
    for (const h of [renderBankNotesScreen(s), renderBankNotesPanel(s, mission('primary_bank-fortify-2fa'))]) {
      expect(h).toContain('data-pm-pointer');
      expect(h).toContain(escHtml(p.text).replace(/&#39;/g, "'"));
      // A browser page can't be a link: chrome:// and about: are copyable text.
      expect(h).not.toMatch(/href="(?:chrome|about|edge):/);
    }
  });

  it('Google and Chrome: passwords.google.com, and chrome://password-manager typed', () => {
    const h = renderBankNotesScreen({ ...createInitialState(), passwordManager: 'google' });
    expect(h).toMatch(/<a href="https:\/\/passwords\.google\.com"[^>]*rel="noopener noreferrer"/);
    expect(h).toMatch(/<code[^>]*>chrome:\/\/password-manager<\/code>/);
  });

  it('Firefox: about:logins typed; Bitwarden: the web vault; 1Password: search the app', () => {
    expect(renderBankNotesScreen({ ...createInitialState(), passwordManager: 'firefox' })).toMatch(/<code[^>]*>about:logins<\/code>/);
    expect(renderBankNotesScreen({ ...createInitialState(), passwordManager: 'bitwarden' })).toContain('href="https://vault.bitwarden.com"');
    expect(managerPointer('1password').text).toMatch(/1Password.*search for the bank/);
  });

  it('every manager link is one the game already uses or one that was checked by loading it', () => {
    const allowed = new Set(Object.keys(JSON.parse(readFileSync('tests/fixtures/verified-urls.json', 'utf8')).urls));
    for (const pm of managers) {
      const p = managerPointer(pm);
      if (p.url) expect(allowed.has(p.url), pm).toBe(true);
    }
  });

  it('unset: no manager pointer, a link to tell The Master Keys; "none": nothing at all', () => {
    const unset = renderBankNotesScreen(createInitialState());
    expect(unset).not.toContain('data-pm-pointer');
    expect(unset).toContain('href="#/district/master-keys?tab=survey"');
    const none = renderBankNotesScreen({ ...createInitialState(), passwordManager: 'none' });
    expect(none).not.toContain('data-pm-pointer');
    expect(none).not.toContain('class="bank-note-pm"');
    expect(managerPointer(undefined)).toBeNull();
    expect(managerPointer('none')).toBeNull();
  });
});

describe('bank notes never leave the browser', () => {
  const SECRET = 'Zyx Secret Credit Union';
  const SECRET_URL = 'https://zyx-secret-cu.example/login';
  const s = () => {
    let st = withNotes({ name: SECRET, loginUrl: SECRET_URL, resetUrl: 'https://zyx-secret-cu.example/reset' });
    st = { ...st, missions: { 'primary_bank-fortify-2fa': { status: 'completed', action: 'enabled-2fa', completedAt: '2026-11-01T00:00:00Z' } } };
    return st;
  };

  it('the bank-note actions in app.js send nothing: no track, no error-report context', () => {
    const app = readFileSync('src/app.js', 'utf8');
    const start = app.indexOf("} else if (action === 'bank-note-open') {");
    const end = app.indexOf("} else if (action === 'mission-step') {");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const blocks = [
      app.slice(start, end),
      app.slice(app.indexOf('function readBankForm'), app.indexOf('function saveBankForm')),
      app.slice(app.indexOf('function saveBankForm'), app.indexOf('\n}\n', app.indexOf('function saveBankForm'))),
      app.slice(app.indexOf("app.addEventListener('submit'"), app.indexOf("app.addEventListener('change', refreshDebriefForm)")),
    ];
    for (const block of blocks) {
      const b = block.replace(/\/\/[^\n]*/g, '');
      expect(b.length).toBeGreaterThan(20);
      expect(b).not.toMatch(/\btrack(?:Now|ThenStop)?\(|sendConfirmed|captureError|Sentry|fetch\(/);
    }
  });

  it('the bank-notes modules import nothing that sends', () => {
    for (const f of ['src/utils/bank-notes.js', 'src/components/bank-notes.js']) {
      const src = readFileSync(f, 'utf8').replace(/\/\/[^\n]*/g, '');
      expect(src).not.toMatch(/\bimport\b[^;]*(?:analytics|restore-send|errors\.js)|restore-send|errors\.js|Sentry|fetch\(|track\(/);
    }
  });

  it('no analytics event, restore replay or bug report carries them', () => {
    const st = s();
    const payloads = [
      restoreEvents(st),
      missionEventData(mission('primary_bank-fortify-2fa'), st.missions['primary_bank-fortify-2fa']),
      umamiPayload('mission-completed', missionEventData(mission('primary_bank-fortify-2fa'), st.missions['primary_bank-fortify-2fa']), { location: { hostname: 'x', pathname: '/' } }),
      reportBody('game_bug', 'the vault broke', { hash: '#/vault/banks?from=primary_bank-fortify-2fa', doc: null }),
      errorContext(parseRoute('#/vault/banks?from=primary_bank-fortify-2fa')),
      pageviewUrl(parseRoute('#/vault/banks'), 'https://x/#/vault/banks'),
    ];
    const text = JSON.stringify(payloads);
    expect(text).not.toContain('Zyx');
    expect(text).not.toContain('zyx-secret-cu');
  });

  it('click and input breadcrumbs on anything bank-note are dropped before an error report', () => {
    for (const message of [
      'div.bank-notes > div.panel > form.bank-note-form > label > input.bank-note-input',
      'div.panel.bank-note-panel > div > div > a.bank-note-link',
      'div.bank-notes > div > div > button.btn-secondary.bank-note-edit',
      'body > div#app > div.scanlines > div.bank-notes > div',
    ]) {
      expect(isPrivateBreadcrumb({ category: 'ui.click', message }), message).toBe(true);
      expect(isPrivateBreadcrumb({ category: 'ui.input', message }), message).toBe(true);
    }
  });

  it('names and addresses appear only as text, href and value: never in an id, name, title, aria-label or data- attribute', () => {
    const st = s();
    for (const h of [renderBriefing(st, 'primary_bank-fortify-2fa'), renderBankNotesScreen(st), renderBankNotesScreen(st, { editId: bankNotes(st)[0].id })]) {
      for (const [, attr, value] of h.matchAll(/\s([a-zA-Z-:]+)="([^"]*)"/g)) {
        if (/Zyx|zyx-secret/.test(value)) expect(['href', 'value'], `${attr}="${value}"`).toContain(attr);
      }
    }
  });

  it('every element showing a note sits inside a bank-note class (so PRIVATE_UI drops it)', () => {
    const panel = renderBankNotesPanel(s(), mission('primary_bank-fortify-2fa'));
    expect(panel).toMatch(/^\s*<div class="panel bank-note-panel"/);
    expect(renderBankNotesScreen(s())).toMatch(/<div class="bank-notes"/);
  });
});
