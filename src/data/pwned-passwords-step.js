// The Pwned Passwords check every Breach Recon mission ends with.
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
      text: 'Your browser scrambles the password into a hash and sends only the first 5 characters of that hash. The site never receives your password. Before you type, check the address bar says haveibeenpwned.com. Reclaim City will never ask for your password.',
    },
  ],
};
