// Bank notes: the player's own list of where their money logs in (Liz, 2026-11-01: "we could
// have them store the location of their various bank logins and the bank password reset
// place"). The game can't know which bank someone uses, and people use more than one, so the
// player writes the list: a name, the login page, the password-reset page. Nothing else.
//
// PRIVATE. The list lives in the local save (state.bankNotes) and nowhere else: no track(), no
// error-report context, no URL, no id/name/title/aria-label attribute. Every element that shows
// or edits it carries a `bank-note` class, which PRIVATE_UI (errorNoise.js) drops from click and
// input breadcrumbs. Never a password: there is no password field and the form says so.

/** @typedef {{ id: string, name: string, loginUrl: string, resetUrl: string }} BankNote */

// Money accounts the game can't point at a site for: "your bank", "your card", "your exchange",
// "your brokerage". Their missions show the bank notes instead of a dead end.
export const BANK_NOTE_ACCOUNTS = new Set(['primary_bank', 'credit_card', 'crypto_exchange', 'investment_account']);

export const NAME_MAX = 80;
export const URL_MAX = 500;
export const NOTES_MAX = 30;

// Optional autocomplete only (a <datalist>): names, never URLs. The player can type anything.
export const COMMON_BANK_NAMES = [
  'Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One', 'U.S. Bank', 'PNC', 'Truist',
  'TD Bank', 'Ally', 'Discover', 'American Express', 'Chime', 'SoFi', 'USAA',
  'Navy Federal Credit Union', 'PenFed Credit Union', 'Your local credit union',
  'Fidelity', 'Charles Schwab', 'Vanguard', 'Robinhood', 'Coinbase', 'Kraken',
];

export function bankNotes(state) {
  return Array.isArray(state?.bankNotes) ? state.bankNotes.filter((n) => n && typeof n.name === 'string' && n.name.trim()) : [];
}

export function missionUsesBankNotes(mission) {
  return Boolean(mission && BANK_NOTE_ACCOUNTS.has(mission.accountId));
}

// A password mission goes to the reset page first; everything else starts at the login page.
export function primaryLinkKind(mission) {
  return /-(?:recon|fortify)-(?:password|lockdown)$/.test(mission?.id || '') ? 'reset' : 'login';
}

// A web address the player typed, made safe to put in an href: only http(s). "chase.com" gets
// https:// in front. '' for nothing typed, null for something that isn't a web address.
export function safeUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (s.length > URL_MAX || /\s/.test(s)) return null;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(s);
  // No scheme: only something that looks like a host (a dot before any slash) becomes https.
  if (!hasScheme && !/^[^/?#]+\.[^/?#]+/.test(s)) return null;
  let u;
  try {
    u = new URL(hasScheme ? s : `https://${s}`);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (!u.hostname || u.username || u.password) return null;
  return u.href;
}

// What the form gives back, checked. { note } to save, or { error } to say why not.
export function cleanBankNote(input) {
  const name = String(input?.name ?? '').trim().replace(/\s+/g, ' ').slice(0, NAME_MAX);
  if (!name) return { error: 'name' };
  const loginUrl = safeUrl(input?.loginUrl);
  if (loginUrl === null) return { error: 'loginUrl' };
  const resetUrl = safeUrl(input?.resetUrl);
  if (resetUrl === null) return { error: 'resetUrl' };
  return { note: { name, loginUrl, resetUrl } };
}

function newId(notes) {
  const used = new Set(notes.map((n) => n.id));
  let i = notes.length + 1;
  while (used.has(`b${i}`)) i += 1;
  return `b${i}`;
}

export function addBankNote(state, input) {
  const { note, error } = cleanBankNote(input);
  if (error) return { state, error };
  const notes = bankNotes(state);
  if (notes.length >= NOTES_MAX) return { state, error: 'full' };
  return { state: { ...state, bankNotes: [...notes, { id: newId(notes), ...note }] } };
}

export function updateBankNote(state, id, input) {
  const notes = bankNotes(state);
  if (!notes.some((n) => n.id === id)) return { state, error: 'missing' };
  const { note, error } = cleanBankNote(input);
  if (error) return { state, error };
  return { state: { ...state, bankNotes: notes.map((n) => (n.id === id ? { id, ...note } : n)) } };
}

export function removeBankNote(state, id) {
  const notes = bankNotes(state);
  const next = notes.filter((n) => n.id !== id);
  return next.length === notes.length ? state : { ...state, bankNotes: next };
}

// A saved note's link, checked again at draw time (a save can be edited by hand).
export function noteLink(note, kind) {
  const url = safeUrl(kind === 'reset' ? note?.resetUrl : note?.loginUrl);
  return url || '';
}

// Where the player's saved bank logins already are, from the password manager they told the
// game in The Master Keys (state.passwordManager). The same places missions-passwords.js sends
// people; a chrome:// or about: address can't be a link from a web page, so it is typed.
// { text, url?, typed? } or null (no manager, or "none": nothing manager-specific).
const MANAGER_POINTERS = {
  google: { text: 'Your bank logins are probably saved in Google Password Manager. Open it and search for the bank:', url: 'https://passwords.google.com', urlText: 'passwords.google.com', typed: 'chrome://password-manager', typedText: 'In Chrome you can also type this in the address bar:' },
  apple: { text: 'Your bank logins are probably saved in Apple Passwords. Open the Passwords app (or Settings → Passwords on older iPhones) and search for the bank.' },
  '1password': { text: 'Your bank logins are probably in 1Password. Open 1Password and search for the bank.' },
  bitwarden: { text: 'Your bank logins are probably in Bitwarden. Open your vault and search for the bank:', url: 'https://vault.bitwarden.com', urlText: 'vault.bitwarden.com' },
  proton: { text: 'Your bank logins are probably in Proton Pass. Open Proton Pass and search for the bank.' },
  dashlane: { text: 'Your bank logins are probably in Dashlane. Open Dashlane and search for the bank.' },
  lastpass: { text: 'Your bank logins are probably in LastPass. Open LastPass and search for the bank.' },
  firefox: { text: 'Your bank logins are probably saved in Firefox. Type this in the address bar and search for the bank:', typed: 'about:logins' },
  edge: { text: 'Your bank logins are probably saved in Microsoft Edge. Open Settings → Passwords and search for the bank.' },
  other: { text: 'Your bank logins are probably in your password manager. Open it and search for the bank.' },
};

export const MANAGER_POINTER_TAIL = 'The saved entry has the bank’s real web address in it: copy that into Login page below, so the next mission knows where to go.';

export function managerPointer(passwordManager) {
  return MANAGER_POINTERS[passwordManager] || null;
}

// Steps that work at any bank, for when the game doesn't know which one (or the note has no
// address yet). The threat is named: a phisher's lookalike page, a caller with your login.
export const ANY_BANK_STEPS = [
  'Type your bank’s address yourself, or open its app. Don’t use a link from an email or text: a phisher’s lookalike login page is built for exactly this visit.',
  'Don’t know the address? It’s printed on the back of your card and on your statement, with the bank’s real phone number.',
  'Once you’re signed in, look for Profile, Settings or Security. Most banks keep the password, 2-step and alerts there. On the app it’s often under your initials or a person icon.',
  'Can’t find it? Call the number on the back of your card and ask. If someone calls you first asking for a code, hang up: that’s a scammer with your login trying to get past 2-step.',
];
