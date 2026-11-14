// The Simplest reading level: missions told with the ten hundred most used English words
// (the Up-Goer Five list, splasho.com/upgoer5, after xkcd 1133), plus the words people see on
// their own phone screens (tests/fixtures/plain-words/phone-words.txt), account names, and
// on-screen labels in quotes, which have to match what the player will see.
// tests/readability.test.js checks every word.
//
// Written first for the missions a new player meets, where people either get going or give
// up (Liz, 2026-11-13). Facts come from each mission's own briefing and steps, nothing new.
// Each one: { lead, steps: [{ text, url?, note? }], scout? }.

const HIBP = 'https://haveibeenpwned.com';
const PWNED_PASSWORDS = 'https://haveibeenpwned.com/Passwords';

// The password check asks for a real password, so even the simplest version says why it is safe.
const PASSWORD_SAFE_NOTE = [
  {
    label: 'Is this safe?',
    text: 'Yes. Your password never leaves your phone or computer. The website only gets a short code made from it, and no one can turn that code back into your password. First, check the top of the page says “haveibeenpwned.com”. This game will never ask for your password.',
  },
];

// The email leak check is the same mission for each email account. `first` is a step for an
// account that may share its address with another (Google with Gmail…); `extra` comes before
// the password check (Google's own Password Checkup, Yahoo's old break-ins).
function leakCheck(name, { first = [], extra = [] } = {}) {
  return {
    lead: `See if a business lost your ${name} email address to someone who broke in.`,
    steps: [
      ...first,
      { text: 'Open the “Have I Been Pwned” website', url: HIBP },
      { text: `Type your ${name} email address in the box at the top` },
      { text: 'Read what it says. “Good news” means it was not found. “Oh no — pwned!” means a business lost it to someone who broke in.' },
      ...extra,
      { text: 'Now check your password on the same website', url: PWNED_PASSWORDS, note: PASSWORD_SAFE_NOTE },
    ],
    scout: `"Someone with a password that got out can try it on your ${name} sign-in page. Let’s see if yours got out."`,
  };
}

// Google, Apple and Microsoft accounts often use the same address as Gmail, iCloud or Outlook.
const sameAs = (other) => [{ text: `Is this the same email address as your ${other}? Then your ${other} check already did this. You can stop here, and say so when you answer the questions at the end.` }];

export const MISSION_SIMPLE = {
  'gmail-recon-breach': leakCheck('Gmail'),
  'outlook-recon-breach': leakCheck('Outlook'),
  'icloud-recon-breach': leakCheck('iCloud'),
  'yahoo-recon-breach': leakCheck('Yahoo', {
    extra: [{ text: 'This website does not show the very old Yahoo break-ins. If you had Yahoo back then, think of what was in that old account as already out.' }],
  }),
  'protonmail-recon-breach': leakCheck('ProtonMail'),
  'apple_id-recon-breach': leakCheck('Apple Account', { first: sameAs('iCloud') }),
  'google-recon-breach': leakCheck('Google Account', {
    first: sameAs('Gmail'),
    extra: [{ text: 'Also open Google’s own “Password Checkup”', url: 'https://passwords.google.com/checkup' }],
  }),
  'microsoft-recon-breach': leakCheck('Microsoft Account', { first: sameAs('Outlook') }),

  'gmail-recon-login': {
    lead: 'See if anyone else has signed in to your Gmail.',
    steps: [
      { text: 'Open your Google security page', url: 'https://myaccount.google.com/security' },
      { text: 'Go down the page to “Your devices” and “Recent security events”' },
      { text: 'Look for a phone, computer or place that is not yours' },
    ],
    scout: '"Every time someone signs in, Google writes it down. Let’s look at it."',
  },

  'gmail-fortify-2fa': {
    lead: 'Turn on a second step, so your password alone can’t open your Gmail.',
    steps: [
      { text: 'Open the Google “2-Step Verification” page', url: 'https://myaccount.google.com/signinoptions/two-step-verification' },
      { text: 'If it is off, turn it on' },
      { text: 'If you can, pick a sign-in app or a security key, not text codes' },
    ],
    scout: '"A password is one lock. The second step is a second lock. Someone with your password still can’t get in."',
  },
};
