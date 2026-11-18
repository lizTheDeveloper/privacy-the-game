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

// The email leak check is the same mission for each email account. `first` is a step for an
// account that may share its address with another (Google with Gmail…); `extra` comes last
// (Google's own Password Checkup, Yahoo's old break-ins).
function leakCheck(name, { first = [], extra = [] } = {}) {
  return {
    lead: `See if a business lost your ${name} email address to someone who broke in.`,
    steps: [
      ...first,
      { text: `Open the “Have I Been Pwned” website. You will check your ${name} email address there.`, url: HIBP },
      // Not "the box at the top": a player looks at the top of the game, not the other tab (Liz 2026-11-17).
      // The box and button as the site labels them (checked 2026-11-17).
      { text: `On that website, type your ${name} email address in the “Email address” box, and tap “Check”` },
      { text: 'Read what it says. “Good news” means it was not found. “Oh no — pwned!” means a business lost it to someone who broke in.' },
      ...extra,
      // No password step here (Liz 2026-11-17): checking passwords is its own mission, the
      // password check in The Master Keys, which starts from where the passwords are saved.
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

// Which of the mission's own steps each Simplest step stands for (null: a step of its own), so
// a tick made at one reading level still counts at the other (missions.js gives them one key).
const SAME_AS = {
  'yahoo-recon-breach': [0, 1, 2, null, 3],
  'google-recon-breach': [0, 1, 2, null, 3, 4],
};
for (const [id, s] of Object.entries(MISSION_SIMPLE)) {
  const map = SAME_AS[id] || s.steps.map((_, i) => i);
  s.steps.forEach((st, i) => {
    if (map[i] !== null && map[i] !== undefined) st.of = map[i];
  });
}
