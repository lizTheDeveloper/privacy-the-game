// Password Reset missions, told for where the player's passwords are saved (Liz 2026-11-18: "for
// changing their passwords, we really need to get them in that password manager"). The mission's
// own steps stay; around them: do it where the passwords are saved, let that place make the new
// one, then check it saved. Picked by state.passwordManager, like the password check's steps.

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
  const build = (t) => [
    { text: t.where },
    ...steps.slice(0, at + 1),
    { text: t.make },
    ...steps.slice(at + 1),
    { text: t.check(accountName), ...(t.checkUrl ? { url: t.checkUrl } : {}) },
  ];
  return {
    ...Object.fromEntries(Object.entries(SITE_LABEL).map(([k, t]) => [k, build(t)])),
    ...Object.fromEntries(Object.entries(APPS).map(([k, app]) => [k, build(forApp(app))])),
  };
}
