// Password Reset missions, told for where the player's passwords are saved (Liz 2026-11-18: "for
// changing their passwords, we really need to get them in that password manager"). The mission's
// own steps stay; around them: do it where the passwords are saved, let that place make the new
// one, then check it saved. Picked by state.passwordManager, like the password check's steps.
// Passwords in two places (data/two-places.js): do it in the first, then update the second too.
import { COMPUTER_PLACE, TWO_PLACE_PAIRS, pairKey, phonePlace, computerPlace } from './two-places.js';

const SITE_LABEL = {
  apple: {
    where: 'Do this on your iPhone, iPad or Mac. That’s where your passwords are saved (the Passwords app).',
    make: 'When it asks for a new password, tap “Use Strong Password”. It makes a strong one and saves it for you.',
    check: (n) => `Check it saved: open the Passwords app and search for ${n}.`,
  },
  google: {
    where: 'Do this in Chrome or on your Android phone. That’s where your passwords are saved (Google Password Manager).',
    make: 'When it asks for a new password, tap the new password box. Pick “Use suggested password”. It saves it for you.',
    check: (n) => `Check it saved: open passwords.google.com and search for ${n}.`,
    checkUrl: 'https://passwords.google.com',
  },
  edge: {
    where: 'Do this in Microsoft Edge. That’s where your passwords are saved.',
    make: 'When it asks for a new password, click the new password box. Pick the “Suggested strong password”. Edge saves it for you.',
    check: (n) => `Check it saved: in Edge, click ⋯, then “Settings”, and search for “passwords”. Look for ${n}.`,
  },
  firefox: {
    where: 'Do this in Firefox. That’s where your passwords are saved.',
    make: 'When it asks for a new password, click the new password box. Pick “Use a securely generated password”. Firefox saves it for you.',
    check: (n) => `Check it saved: in Firefox, click ☰, then “Passwords”, and look for ${n}.`,
  },
};

const APPS = { '1password': '1Password', bitwarden: 'Bitwarden', proton: 'Proton Pass', dashlane: 'Dashlane', lastpass: 'LastPass', other: 'your password app' };

function forApp(app) {
  return {
    where: `Have ${app} open. That’s where your passwords are saved.`,
    make: `When it asks for a new password, use ${app} to make one (its password generator), and save it in ${app}.`,
    check: (n) => `Check it saved: open ${app} and look for ${n}.`,
  };
}

// The second place still has the old password: where to update it (the computer).
const UPDATE_SECOND = {
  google: 'In Chrome, click the three dots (⋮) at the top right, then “Settings”. Search for “passwords”, then click “Google Password Manager”.',
  apple: 'On your Mac, open the Passwords app.',
  edge: 'In Edge, click the three dots (⋯) at the top right, then “Settings”. Search for “passwords”.',
  firefox: 'In Firefox, click the three lines (☰) at the top right, then “Passwords”.',
};
// Where to see the new password, to type it in on the computer (the phone made it).
const SEE_NEW = {
  apple: 'Open the Passwords app on your iPhone. Tap the account to see the new password.',
  google: 'On your Android phone, open passwords.google.com. Tap the account to see the new password.',
};

// Two places: not a move. Do it in the first place, check it saved, then update the second.
// No step of its own says where (it had nothing to do on it): each step's chip says, phone first.
function forTwo(a, b) {
  const t = SITE_LABEL[a];
  return {
    places: { first: phonePlace(a), second: computerPlace(b, 'Now switch to your computer.') },
    make: t.make,
    check: t.check,
    checkUrl: t.checkUrl,
    also: (n) => ({
      text: `Now update ${COMPUTER_PLACE[b]} too. It still has the old password. Find ${n} there, and change the saved password to the new one.`,
      note: [{ label: 'How do I find it?', text: UPDATE_SECOND[b], open: true }, { label: 'Where do I see the new password?', text: SEE_NEW[a] }],
      // It happens on the computer, not on the site the step before opened.
      elsewhere: true,
    }),
  };
}

// The step that sets the new password: the first one that talks about a new, unique or
// generated password (or "change the password"). Not a "Verify …" step (Cash App's has no password).
const NEW_PASSWORD = /\b(new|unique|generate[ds]?|strong)\b[^.]*password|password[^.]*\b(manager|unique)\b|\bchange (the|that|your) password\b/i;

export function newPasswordStep(steps) {
  return steps.findIndex((st) => NEW_PASSWORD.test(st.text) && !/^Verify\b/.test(st.text));
}

// { apple: [...], google: [...], … } for a reset mission, or null when it has no new-password
// step (Cash App's is a PIN). 'none' keeps the mission's own steps: the ask offers to find a place.
export function resetStepsByManager(steps, accountName) {
  const at = newPasswordStep(steps);
  if (at === -1) return null;
  const build = (t) => {
    const list = [
      ...(t.places ? [] : [{ text: t.where }]),
      ...steps.slice(0, at + 1),
      { text: t.make },
      ...steps.slice(at + 1),
      // Without a link of its own, the check happens where the passwords are saved, not on the site.
      { text: t.check(accountName), ...(t.checkUrl ? { url: t.checkUrl } : { elsewhere: true }) },
    ];
    if (!t.places) return list;
    // Copies: the mission's own step objects are shared with its other lists.
    return [...list.map((st) => ({ ...st, place: t.places.first })), { ...t.also(accountName), place: t.places.second }];
  };
  return {
    ...Object.fromEntries(Object.entries(SITE_LABEL).map(([k, t]) => [k, build(t)])),
    ...Object.fromEntries(Object.entries(APPS).map(([k, app]) => [k, build(forApp(app))])),
    // "apple+google": an iPhone and Chrome on a computer.
    ...Object.fromEntries(TWO_PLACE_PAIRS.map(([a, b]) => [pairKey(a, b), build(forTwo(a, b))])),
  };
}
