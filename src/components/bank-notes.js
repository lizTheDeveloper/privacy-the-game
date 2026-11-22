// The bank notes, drawn: the panel on a Vault mission that would otherwise have nowhere to go,
// and the screen where the player writes the list (#/vault/banks). See utils/bank-notes.js.
//
// PRIVATE: every element here that shows or edits a note has a `bank-note…` class (PRIVATE_UI in
// errorNoise.js drops those from error-report breadcrumbs). Names and addresses go only in text
// and in href/value, never in an id, name, title, aria-label or data-* attribute.
import { renderHud } from './hud.js';
import { passwordPlaces } from '../utils/password-places.js';
import { MISSIONS } from '../data/missions.js';
import {
  bankNotes, noteLink, primaryLinkKind, managerPointer, MANAGER_POINTER_TAIL, ANY_BANK_STEPS,
  COMMON_BANK_NAMES, NAME_MAX, URL_MAX,
} from '../utils/bank-notes.js';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const PRIVACY_NOTE = 'Saved only in this browser, on this device. Reclaim City doesn’t send your bank notes anywhere and doesn’t record any analytics about them.';
export const NO_PASSWORDS_NOTE = 'Don’t put your password here, just where to log in and where to reset it.';

const ERRORS = {
  name: 'Give it a name first: the bank, card or app, however you’d recognise it.',
  loginUrl: 'That login page doesn’t look like a web address. Try something like bank.com or https://www.bank.com/login.',
  resetUrl: 'That reset page doesn’t look like a web address. Try something like bank.com or https://www.bank.com/reset.',
  full: 'That’s a lot of banks. Delete one you don’t use before adding another.',
  missing: 'That note was deleted. Add it again below.',
};

const LINK = 'color: var(--cyan); font-weight: 600;';
const SMALL = 'font-size: 12px; color: rgba(237,239,243,0.55); line-height: 1.6;';

function banksHref(missionId) {
  return missionId ? `#/vault/banks?from=${encodeURIComponent(missionId)}` : '#/vault/banks';
}

function outLink(url, label, missionId, primary) {
  const action = missionId ? ` data-action="bank-note-open" data-mission="${esc(missionId)}"` : '';
  const style = primary
    ? 'display: inline-flex; align-items: center; min-height: 40px; padding: 8px 14px; font-family: var(--font-title); line-height: 1.2; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-decoration: none; color: #090B10; background: var(--cyan);'
    : 'display: inline-flex; align-items: center; min-height: 40px; padding: 8px 14px; font-family: var(--font-title); line-height: 1.2; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-decoration: none; color: var(--cyan); border: 1px solid rgba(0,229,255,0.35);';
  return `<a class="bank-note-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer"${action} style="${style}">${label} &#8599;</a>`;
}

// One saved bank's way out: the mission's kind of page first.
function noteLinks(note, missionId, kind) {
  const order = kind === 'reset' ? ['reset', 'login'] : ['login', 'reset'];
  const labels = { login: 'LOG IN', reset: 'RESET PASSWORD' };
  const links = order.map((k, i) => {
    const url = noteLink(note, k);
    return url ? outLink(url, labels[k], missionId, i === 0) : '';
  }).filter(Boolean);
  return links;
}

// Where the player's saved logins already live, from the manager they told us. Nothing for none.
export function renderManagerPointer(state, { tail = '' } = {}) {
  // Two places (the finder): a pointer for each, so both get checked.
  const places = passwordPlaces(state);
  if (places.length > 1) return places.map((pm, i) => renderManagerPointer({ ...state, passwordManager: pm, passwordPlaces: [] }, { tail: i === places.length - 1 ? tail : '' })).join('');
  const p = managerPointer(state?.passwordManager);
  if (!p) {
    if (state?.passwordManager === 'none') return '';
    return `<div class="bank-note-pm" style="${SMALL} margin-top: 12px;">Use a password manager? <a href="#/district/master-keys?tab=survey" style="${LINK}">Tell The Master Keys which one</a> and this will say where your bank logins are saved.</div>`;
  }
  const link = p.url ? ` <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" style="${LINK}">${esc(p.urlText)} &#8599;</a>` : '';
  const typed = p.typed
    ? `<div style="margin-top: 6px;">${p.typedText ? `${esc(p.typedText)} ` : ''}<code class="bank-note-typed" style="user-select: all; -webkit-user-select: all; font-family: var(--font-mono); font-size: 12px; color: var(--lime); background: rgba(198,255,0,0.06); border: 1px solid rgba(198,255,0,0.25); padding: 2px 6px; overflow-wrap: anywhere;">${esc(p.typed)}</code> <span style="color: rgba(237,239,243,0.45);">(a web page can’t open it for you: copy it into the address bar)</span></div>`
    : '';
  return `<div class="bank-note-pm" data-pm-pointer style="font-size: 13px; color: var(--offwhite); line-height: 1.6; margin-top: 12px; border-left: 2px solid var(--lime); padding-left: 10px;">${esc(p.text)}${link}${typed}${tail ? `<div style="${SMALL} margin-top: 6px;">${esc(tail)}</div>` : ''}</div>`;
}

function anyBankSteps(open, label = 'WORKS AT ANY BANK') {
  const items = ANY_BANK_STEPS.map((s) => `<li style="margin-bottom: 6px;">${esc(s)}</li>`).join('');
  // With no saved address these are the way through: open on a desktop, one tap away on a phone
  // (data-open-desktop), where the panel sits under the step slides.
  return `<details class="bank-note-any" data-any-bank${open ? ' data-open-desktop' : ''} style="margin-top: 14px;">
    <summary style="cursor: pointer; font-family: var(--font-title); line-height: 1.2; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: rgba(0,229,255,0.7); min-height: 32px;">${label}</summary>
    <ol style="margin: 10px 0 0; padding-left: 20px; font-size: 13px; color: rgba(237,239,243,0.8); line-height: 1.55;">${items}</ol>
  </details>`;
}

// ---- On the step that needs the bank (screens/briefing.js) -------------------------------------
// The briefing no longer carries the panel. The step that needs the bank's address gets the saved
// banks as chips, each saying what it opens, with the password-manager pointers one tap away
// ("Where's my password?"). Every other step gets one line. Nothing saved: a compact "Add your
// bank" that comes back to the mission.

const OPENS = { login: 'Opens its log-in page', reset: 'Opens its reset-password page' };

// A saved bank's chip: its name, and what it opens. No address yet: add one.
function bankChip(note, missionId, kind) {
  const order = kind === 'reset' ? ['reset', 'login'] : ['login', 'reset'];
  const which = order.find((k) => noteLink(note, k));
  if (!which) {
    return `<a class="bank-note-chip bank-note-chip--add" href="${banksHref(missionId)}"><span class="bank-note-chip-name">${esc(note.name)}</span><span class="bank-note-chip-what">No web address yet: add one</span></a>`;
  }
  return `<a class="bank-note-link bank-note-chip" href="${esc(noteLink(note, which))}" target="_blank" rel="noopener noreferrer" data-action="bank-note-open" data-mission="${esc(missionId)}"><span class="bank-note-chip-name">${esc(note.name)} &#8599;</span><span class="bank-note-chip-what">${OPENS[which]}</span></a>`;
}

// The bank step: the chips, then "Where's my password?" and the steps that work at any bank.
export function renderBankStep(state, mission) {
  const notes = bankNotes(state);
  const kind = primaryLinkKind(mission);
  const top = notes.length
    ? `<div class="bank-note-chips">${notes.map((n) => bankChip(n, mission.id, kind)).join('')}</div>
        <a class="bank-note-edit-link" href="${banksHref(mission.id)}">+ Add or edit your banks</a>`
    : `<a class="btn-secondary bank-note-add" href="${banksHref(mission.id)}">Add your bank</a>
        <p class="bank-note-add-why">Save where it logs in, and this step opens it for you. Then you come back here.</p>`;
  const pointer = renderManagerPointer(state, { tail: notes.length ? '' : 'The saved entry has the bank’s real web address in it: copy that into your bank notes.' });
  return `
        <div class="bank-note-step" data-bank-step>
          ${top}
          <details class="bank-note-where" data-bank-where><summary>Where’s my password?</summary>${pointer || `<p class="bank-note-where-none">Look in the place your passwords are saved, and search for your bank.</p>`}${privacyLine()}</details>
          ${anyBankSteps(false, 'Steps that work at any bank')}
        </div>`;
}

// Every other step: one line. Nothing saved: nothing (the bank step has the way to add one).
export function renderBankLine(state, mission) {
  const notes = bankNotes(state);
  if (!notes.length) return '';
  const kind = primaryLinkKind(mission);
  const order = kind === 'reset' ? ['reset', 'login'] : ['login', 'reset'];
  const links = notes.map((n) => {
    const url = order.map((k) => noteLink(n, k)).find(Boolean);
    return url
      ? `<a class="bank-note-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-action="bank-note-open" data-mission="${esc(mission.id)}">${esc(n.name)} &#8599;</a>`
      : `<a class="bank-note-name-link" href="${banksHref(mission.id)}">${esc(n.name)}</a>`;
  });
  return `<p class="bank-note-line" data-bank-line>Your banks: ${links.join(' <span aria-hidden="true">&middot;</span> ')} <span aria-hidden="true">&middot;</span> <a class="bank-note-edit-link" href="${banksHref(mission.id)}">edit</a></p>`;
}

const privacyLine = (extra = '') => `<div class="bank-note-privacy" style="${SMALL} margin-top: 12px;">&#128274; ${esc(PRIVACY_NOTE)}${extra}</div>`;

// On a mission for "your bank" / "your card" / "your exchange" / "your brokerage": where to go.
export function renderBankNotesPanel(state, mission) {
  const notes = bankNotes(state);
  const kind = primaryLinkKind(mission);
  const withLinks = notes.filter((n) => noteLink(n, 'login') || noteLink(n, 'reset'));
  let body;
  if (notes.length) {
    const rows = notes.map((n) => {
      const links = noteLinks(n, mission.id, kind);
      const none = `<a href="${banksHref(mission.id)}" style="${LINK} font-size: 13px;">No address saved yet: add one</a>`;
      return `<div class="bank-note-row" style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 0; border-top: 1px solid rgba(0,229,255,0.08);">
        <div class="bank-note-name" style="flex: 1 1 140px; min-width: 0; font-size: 15px; font-weight: 600; color: var(--offwhite); overflow-wrap: anywhere;">${esc(n.name)}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">${links.length ? links.join('') : none}</div>
      </div>`;
    }).join('');
    body = `<div style="font-size: 13px; color: rgba(237,239,243,0.7); line-height: 1.6; margin-bottom: 4px;">Do this at each one. ${kind === 'reset' ? 'Reset password goes straight to the page you saved.' : 'Log in goes straight to the page you saved.'}</div>
      ${rows}
      <div style="margin-top: 10px;"><a href="${banksHref(mission.id)}" style="${LINK} font-size: 13px;">+ Add another bank, or edit these</a></div>`;
  } else {
    body = `<div style="font-size: 14px; color: var(--offwhite); line-height: 1.6;">Which bank? Reclaim City doesn’t know, and most people have more than one. Write down where each one logs in and where it resets the password, and this mission links straight there.</div>
      <div style="margin-top: 12px;"><a class="btn-secondary" href="${banksHref(mission.id)}" style="text-decoration: none; display: inline-block;">ADD YOUR BANKS</a></div>`;
  }
  return `
        <div class="panel bank-note-panel" data-bank-panel style="padding: 20px; margin-bottom: 24px; border-color: rgba(198,255,0,0.25);">
          <div class="section-label" style="color: var(--lime); margin-bottom: 10px;">YOUR BANKS</div>
          ${body}
          ${renderManagerPointer(state, { tail: notes.length ? '' : 'The saved entry has the bank’s real web address in it: copy that into your bank notes.' })}
          ${anyBankSteps(withLinks.length === 0)}
          ${privacyLine()}
        </div>`;
}

const INPUT = 'display: block; width: 100%; box-sizing: border-box; margin-top: 6px; min-height: 44px; padding: 10px 12px; background: #090B10; color: var(--offwhite); border: 1px solid rgba(0,229,255,0.3); font: inherit; font-size: 16px;';
// Off-white sentence case: cyan is for what you can tap (the colour language, style.css).
const LABEL = 'display: block; font-size: 15px; font-weight: 600; color: var(--offwhite); margin-top: 14px;';
// Password managers fill login forms; this isn't one. type="text" only: never a password input.
const NO_AUTOFILL = 'autocomplete="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other"';

function nameOptions(state) {
  const own = (state?.customAccounts?.vault || []).filter((n) => typeof n === 'string' && n.trim());
  const names = [...new Set([...own, ...COMMON_BANK_NAMES])];
  return names.map((n) => `<option value="${esc(n)}"></option>`).join('');
}

// The screen: the list, the form (add, or edit one), and the privacy line beside it. With nothing
// saved, the form comes first and there is no empty list. saved: a note was just saved; coming from
// a mission, the way back to it is then the one bright button (Liz's layout audit, 2026-11-20).
export function renderBankNotesScreen(state, { from = null, editId = null, error = null, draft = null, saved = false } = {}) {
  const notes = bankNotes(state);
  const fromMission = from ? MISSIONS.find((m) => m.id === from) : null;
  const back = fromMission
    ? `<a class="btn-secondary" style="text-decoration: none; padding: 8px 14px;" href="#/mission/${esc(fromMission.id)}/briefing">← BACK TO MISSION</a>`
    : '<a class="btn-secondary" style="text-decoration: none; padding: 8px 14px;" href="#/district/vault">← THE VAULT</a>';
  const editing = editId ? notes.find((n) => n.id === editId) : null;
  const values = draft || editing || { name: '', loginUrl: '', resetUrl: '' };
  const backLit = Boolean(fromMission && saved && notes.length && !editing);

  const list = notes.length ? notes.map((n) => {
    const login = noteLink(n, 'login');
    const reset = noteLink(n, 'reset');
    const line = (label, url) => `<div style="font-size: 12px; color: rgba(237,239,243,0.6); margin-top: 4px; overflow-wrap: anywhere;">${label}: ${url ? `<a class="bank-note-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" style="${LINK}">${esc(url)} &#8599;</a>` : '<span style="color: rgba(237,239,243,0.35);">not saved</span>'}</div>`;
    return `<div class="bank-note-row" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; padding: 12px 0; border-top: 1px solid rgba(0,229,255,0.08);${editing?.id === n.id ? ' background: rgba(0,229,255,0.04);' : ''}">
      <div style="flex: 1 1 200px; min-width: 0;">
        <div class="bank-note-name" style="font-size: 15px; font-weight: 600; color: var(--offwhite); overflow-wrap: anywhere;">${esc(n.name)}</div>
        ${line('Login', login)}
        ${line('Reset', reset)}
      </div>
      <div style="display: flex; gap: 8px; flex-shrink: 0;">
        <button type="button" class="btn-secondary bank-note-edit" data-action="bank-note-edit" data-note="${esc(n.id)}" style="min-height: 40px; padding: 8px 14px; font-size: 11px;">EDIT</button>
        <button type="button" class="btn-secondary bank-note-delete" data-action="bank-note-delete" data-note="${esc(n.id)}" style="min-height: 40px; padding: 8px 14px; font-size: 11px; color: var(--magenta); border-color: rgba(255,45,155,0.35);">DELETE</button>
      </div>
    </div>`;
  }).join('') : `<div style="font-size: 13px; color: rgba(237,239,243,0.55); line-height: 1.6; padding: 8px 0;">Nothing saved yet. Add each bank, card, brokerage or exchange you log in to.</div>`;

  const err = error && ERRORS[error]
    ? `<div class="bank-note-error" data-bank-error role="status" style="font-size: 13px; color: var(--magenta); margin-top: 12px;">${esc(ERRORS[error])}</div>`
    : '<div class="bank-note-error" data-bank-error role="status" hidden></div>';

  const form = `
      <form class="bank-note-form" data-bank-note-form${editing ? ` data-edit="${esc(editing.id)}"` : ''} novalidate>
        <div class="section-label" style="color: var(--cyan); margin-bottom: 4px;">${editing ? 'EDIT THIS BANK' : 'ADD A BANK'}</div>
        ${notes.length ? '' : '<div class="bank-note-empty" style="font-size: 14px; color: var(--offwhite); line-height: 1.6; margin-top: 6px;">Nothing saved yet. Add each bank, card, brokerage or exchange you log in to.</div>'}
        <div style="font-size: 13px; color: var(--offwhite); line-height: 1.6; margin-top: 6px;">&#9888;&#65039; ${esc(NO_PASSWORDS_NOTE)}</div>
        <label style="${LABEL}">Bank, card or app
          <input class="bank-note-input" type="text" data-field="name" list="bank-note-names" maxlength="${NAME_MAX}" required value="${esc(values.name || '')}" placeholder="Type any name" ${NO_AUTOFILL} style="${INPUT}">
        </label>
        <datalist id="bank-note-names">${nameOptions(state)}</datalist>
        <label style="${LABEL}">Login page <span style="font-weight: 400; color: var(--text-quiet);">(optional)</span>
          <input class="bank-note-input" type="text" inputmode="url" data-field="loginUrl" maxlength="${URL_MAX}" value="${esc(values.loginUrl || '')}" placeholder="Where you sign in" ${NO_AUTOFILL} style="${INPUT}">
        </label>
        <label style="${LABEL}">Password-reset page <span style="font-weight: 400; color: var(--text-quiet);">(optional)</span>
          <input class="bank-note-input" type="text" inputmode="url" data-field="resetUrl" maxlength="${URL_MAX}" value="${esc(values.resetUrl || '')}" placeholder="Where you reset it" ${NO_AUTOFILL} style="${INPUT}">
        </label>
        <div style="${SMALL} margin-top: 8px;">Find the reset page by signing in and opening Settings or Security, or from the “Forgot password?” link on the real login page.</div>
        ${err}
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 16px;">
          <button type="submit" class="${backLit ? 'btn-secondary' : 'btn-primary'} bank-note-save" data-action="bank-note-save">${editing ? 'SAVE CHANGES' : '+ SAVE BANK'}</button>
          ${editing ? '<button type="button" class="btn-secondary bank-note-cancel" data-action="bank-note-cancel">CANCEL</button>' : ''}
        </div>
        ${privacyLine()}
      </form>`;

  return `
  <div class="scanlines">
    ${renderHud(state)}
    <div class="bank-notes" style="max-width: 720px; margin: 0 auto; padding: 16px;">
      <div style="margin-bottom: 16px;">${back}</div>
      <div style="font-family: var(--font-title); line-height: 1.2; font-size: 20px; font-weight: 800; color: var(--cyan); letter-spacing: 0.5px;">YOUR BANK NOTES</div>
      <div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.6; margin-top: 8px;">Reclaim City can’t know which banks you use. Write down where each one logs in and resets its password, and the Vault’s missions link straight there. You don’t have to: every mission also has steps that work at any bank.</div>
      ${renderManagerPointer(state, { tail: MANAGER_POINTER_TAIL })}
      ${notes.length ? `<div class="panel" data-bank-saved style="padding: 16px 20px; margin-top: 20px;">
        <div class="section-label" style="color: var(--lime); margin-bottom: 6px;">SAVED · ${notes.length}</div>
        ${list}
      </div>` : ''}
      <div class="panel panel--active" style="padding: 16px 20px; margin-top: 20px;">${form}</div>
      ${fromMission ? `<div style="margin-top: 20px;"><a class="${backLit ? 'btn-primary' : 'btn-secondary'}" data-bank-back style="text-decoration: none;" href="#/mission/${esc(fromMission.id)}/briefing">← BACK TO ${esc(fromMission.title.toUpperCase())}</a></div>` : ''}
    </div>
  </div>`;
}

// The Vault's way in, above its tabs.
export function renderBankNotesCard(state) {
  const n = bankNotes(state).length;
  return `
    <div style="padding: 12px 24px 0;">
      <a class="bank-note-card" href="#/vault/banks" style="display: flex; align-items: center; gap: 14px; min-height: 44px; padding: 14px 16px; text-decoration: none; background: rgba(198,255,0,0.04); border: 1px solid rgba(198,255,0,0.3);">
        <span aria-hidden="true" style="font-size: 22px;">&#127974;</span>
        <span style="flex: 1; min-width: 0;">
          <span style="display: block; font-family: var(--font-title); font-size: 12px; font-weight: 800; color: var(--lime); letter-spacing: 1px;">YOUR BANK NOTES${n ? ` · ${n}` : ''}</span>
          <span style="display: block; font-size: 13px; color: var(--offwhite); margin-top: 4px; line-height: 1.5;">${n ? 'Where each of your banks logs in and resets. Add or edit.' : 'More than one bank? Note where each logs in and resets, and the missions link there.'}</span>
          <span style="display: block; font-size: 11px; color: rgba(237,239,243,0.5); margin-top: 2px; line-height: 1.5;">Saved only in this browser. No analytics.</span>
        </span>
        <span aria-hidden="true" style="color: var(--lime); font-size: 18px;">›</span>
      </a>
    </div>`;
}
