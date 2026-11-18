// Pwned Passwords: the fallback in the password check (missions-passwords.js) for a player who
// says they don't save passwords anywhere. Breach Recon missions used to end with it; since
// 2026-11-17 (Liz) checking passwords is its own mission, which starts from the report built
// into the player's phone or browser, because that report gives a number for every saved
// password at once.
//
// The email search on haveibeenpwned.com answers "which companies leaked my
// account?". It says nothing about the password itself, and the password is
// what attackers actually use: breached passwords from every leak are pooled
// into the lists that credential-stuffing scripts try against every login
// page. So the password gets its own check, on HIBP's own page, and the
// briefing says why that is safe to do — the game teaches players never to
// type a password into a page they reached from a link, so a mission that
// asks them to has to earn the exception out loud.

export const PWNED_PASSWORDS_URL = 'https://haveibeenpwned.com/Passwords';

export const PWNED_PASSWORD_STEP = {
  text: 'Separately, check this account’s password at Pwned Passwords',
  url: PWNED_PASSWORDS_URL,
  note: [
    {
      label: 'Why separately',
      text: 'The email search shows which companies leaked your account. This shows whether the password itself is in the lists attackers try on every login page — even if it leaked from a site you never think about.',
    },
    {
      label: 'Who runs it',
      text: 'Have I Been Pwned is run by security researcher Troy Hunt and has been since 2013. Password managers like 1Password check against it, and the FBI contributes the passwords it recovers.',
    },
    {
      label: 'Why it’s safe',
      // Open on the card, not folded: this is the one place the game asks for a password (Liz 2026-11-17).
      open: true,
      text: 'Your browser scrambles the password into a hash and sends only the first 5 characters of that hash. The site never receives your password, and never asks for your email. Before you type, check the address bar says haveibeenpwned.com. Reclaim City will never ask for your password.',
    },
  ],
};

// The same check in plain words, for the password check's fallback step. Open on the card: it is
// the one place the game asks someone to type a password, and it never says "the same website"
// (Liz 2026-11-17).
export const PASSWORD_SAFE_NOTE = [
  {
    label: 'Is this safe?',
    open: true,
    text: 'Most of the time, never type your password into a website. This one is different. Your phone turns your password into a code first, and only the start of that code is sent. The website never gets your password, and it never gets your email address. First, check the top of the page says “haveibeenpwned.com”. This game will never ask for your password.',
  },
];
