// "Where are my passwords?" (Liz 2026-11-18): "walk them through, do they use Chrome as a
// password manager? Do they use your phone passwords? … they're not always going to know. Are
// your passwords in your phone or are your passwords in Google Chrome on your computer? Most
// people have a mixed [setup], like where they can only log in on one computer and they don't
// know why." One question per card; the player goes and looks, and says what they saw.
// The answers stay on this phone (state.passwordFinder); the place found becomes
// state.passwordManager, the same answer as the password check's question.

export const FINDER_QUESTIONS = {
  where: {
    ask: 'Where do you sign in to your accounts?',
    options: [
      ['phone', 'On my phone'],
      ['computer', 'On a computer'],
      ['both', 'On both'],
      ['app', 'I use a password app (like 1Password or Bitwarden)'],
    ],
  },
  phone: {
    ask: 'What kind of phone do you have?',
    options: [
      ['iphone', 'iPhone'],
      ['android', 'Android (Samsung, Pixel, Motorola and others)'],
    ],
  },
  browser: {
    ask: 'On your computer, what do you use to go on the internet?',
    options: [
      ['chrome', 'Chrome'],
      ['safari', 'Safari'],
      ['edge', 'Edge'],
      ['firefox', 'Firefox'],
      ['unknown', 'I don’t know'],
    ],
  },
  app: {
    ask: 'Which password app do you use?',
    options: [
      ['1password', '1Password'],
      ['bitwarden', 'Bitwarden'],
      ['proton', 'Proton Pass'],
      ['dashlane', 'Dashlane'],
      ['lastpass', 'LastPass'],
      ['other', 'A different one'],
    ],
  },
};

// "I don't know": how to tell, with what each one looks like.
export const BROWSER_HELP = [
  'On a Mac: look at the very top of the screen, next to the Apple. It says the name, like “Safari” or “Chrome”.',
  'On Windows: look at the picture you click to go online. A red, yellow and green circle is Chrome. A blue and green wave is Edge. An orange fox is Firefox.',
];

// Where each place keeps passwords, and how to open it. `manager` is the password check's answer.
export const PLACES = {
  // steps: what to do, in order (a numbered list, all the same size: Liz 2026-11-18, gray small
  // text read as optional). alt: only if that doesn't work, shown in its own labeled box.
  iphone: {
    mine: 'My iPhone',
    manager: 'apple',
    name: 'the Passwords app on your iPhone',
    short: 'your iPhone',
    steps: ['Open the Passwords app on your iPhone. It has a key on it.'],
    alt: 'No Passwords app? Open Settings, then tap “Passwords”.',
  },
  android: {
    mine: 'My Android phone',
    manager: 'google',
    name: 'Google Password Manager on your phone',
    short: 'your Android phone',
    steps: ['Tap the button below to open Google’s password page.', 'Sign in to Google if it asks.'],
    alt: 'Samsung phone? Also look in Settings, then “Security and privacy”, then “Samsung Pass”.',
    url: 'https://passwords.google.com',
  },
  chrome: {
    mine: 'Chrome on my computer',
    manager: 'google',
    name: 'Chrome on your computer',
    short: 'Chrome on your computer',
    steps: ['In Chrome, click the three dots (⋮) at the top right.', 'Click “Settings”.', 'Type “passwords” in the search box at the top.', 'Click “Google Password Manager”.'],
  },
  safari: {
    mine: 'My Mac',
    manager: 'apple',
    name: 'the Passwords app on your Mac',
    short: 'your Mac',
    steps: ['On your Mac, open the Passwords app. Search for “Passwords” if you can’t find it.'],
    alt: 'Older Mac with no Passwords app? In Safari, click “Safari” at the top, then “Settings”, then “Passwords”.',
  },
  edge: {
    mine: 'Edge on my computer',
    manager: 'edge',
    name: 'Edge on your computer',
    short: 'Edge on your computer',
    steps: ['In Edge, click the three dots (⋯) at the top right.', 'Click “Settings”.', 'Type “passwords” in the search box.', 'Click “Passwords”.'],
  },
  firefox: {
    mine: 'Firefox on my computer',
    manager: 'firefox',
    name: 'Firefox on your computer',
    short: 'Firefox on your computer',
    steps: ['In Firefox, click the three lines (☰) at the top right.', 'Click “Passwords”.'],
  },
};

export const SAW = [
  ['yes', 'Yes, I see my accounts'],
  ['empty', 'It’s empty'],
  ['lost', 'I couldn’t find it'],
];

// What to ask next, from the answers so far (f = state.passwordFinder). Every card can be left
// and come back to: the answers are saved as they are given.
export function finderCard(f = {}) {
  if (!f.where) return { kind: 'ask', key: 'where' };
  if (f.where === 'app') return f.app ? { kind: 'result' } : { kind: 'ask', key: 'app' };
  const phone = f.where === 'phone' || f.where === 'both';
  const computer = f.where === 'computer' || f.where === 'both';
  if (phone && !f.phone) return { kind: 'ask', key: 'phone' };
  if (phone && !f.phoneSaw) return { kind: 'look', key: 'phoneSaw', place: f.phone };
  if (computer && (!f.browser || f.browser === 'unknown')) return { kind: 'ask', key: 'browser', help: f.browser === 'unknown' };
  if (computer && !f.browserSaw) return { kind: 'look', key: 'browserSaw', place: f.browser };
  return { kind: 'result' };
}

// The places they looked in and saw their accounts, in order (phone first).
export function finderFound(f = {}) {
  const found = [];
  if (f.phone && f.phoneSaw === 'yes') found.push(f.phone);
  if (f.browser && f.browser !== 'unknown' && f.browserSaw === 'yes') found.push(f.browser);
  return found;
}

// The answer for the password check, and whether the passwords are split across places that
// don't share (an iPhone and Chrome: why a password works on one and not the other).
export function finderResult(f = {}) {
  if (f.where === 'app') return { managers: [f.app], mixed: false, found: [] };
  const found = finderFound(f);
  const managers = [...new Set(found.map((p) => PLACES[p].manager))];
  // Nothing saved anywhere: the place they looked first is where to start saving.
  const looked = [f.phone, f.browser].filter((p) => PLACES[p]);
  const start = looked.length ? PLACES[looked[0]].manager : null;
  return { managers, mixed: managers.length > 1, found, start };
}

export const FINDER_KEYS = ['where', 'phone', 'phoneSaw', 'browser', 'browserSaw', 'app'];

// An answer, and nothing after it is kept (a new "where" asks the rest again).
export function setFinderAnswer(state, key, value) {
  if (!FINDER_KEYS.includes(key)) return state;
  const prev = state.passwordFinder || {};
  const next = {};
  for (const k of FINDER_KEYS) {
    if (k === key) { next[k] = value; break; }
    if (prev[k] !== undefined) next[k] = prev[k];
  }
  // The answers after it in the list belong to a different path: start them fresh.
  return { ...state, passwordFinder: next };
}

// Back one card: forget the last answer given.
export function finderBack(state) {
  const prev = state.passwordFinder || {};
  const last = [...FINDER_KEYS].reverse().find((k) => prev[k] !== undefined);
  if (!last) return state;
  const next = { ...prev };
  delete next[last];
  return { ...state, passwordFinder: next };
}
