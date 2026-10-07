// Honest passwords and two-factor (approved by Liz 2026-10-06): breach checks
// ask whether the password itself leaked, 2FA asks what the account already
// has. Missions that appear only when they apply: the password manager's
// security report (CORE recon, but only for players who say they use a
// manager), and two BONUS missions — an upgrade from text/email codes and a
// backup way in for the most critical accounts. Saves that never answered
// the manager question keep exactly their old totals.
import { ACCOUNTS } from './accounts.js';

const BREACHED = ['1-2-breaches', '3plus-breaches'];

// Appended to every breach-check debrief.
export const PASSWORD_EXPOSED_QUESTION = {
  id: 'password_exposed',
  // X5 (recon audit): the breached site lost the password used THERE. Same
  // value ids, so password-need.js and analytics are unchanged.
  label: 'Did any of those breaches include the password you used on that site?',
  hint: 'Each breach lists what leaked — on Have I Been Pwned it’s under “Compromised data”. Look for “Passwords”. If you ever used that same password for this account, treat this account’s password as leaked.',
  showIf: { question: 'finding', values: BREACHED },
  options: [
    { value: 'yes', text: 'Yes — passwords were in the leaked data', severity: 'crit' },
    { value: 'no', text: 'No — only things like email or username', severity: 'safe' },
    { value: 'unsure', text: 'Not sure', severity: 'warn' },
  ],
};

const SKIP_LATER = { value: 'later', text: 'I’ll come back to this', severity: 'skip' };
const SKIP_LATER_NOT_NOW = { value: 'later', text: 'Not now', severity: 'skip' };

// What the 2FA debrief used to ask. Old saves answered this; their summaries
// still read from it.
const LEGACY_TWO_FA_QUESTION = {
  id: 'action',
  label: 'Did you set up two-factor authentication?',
  options: [
    { value: 'enabled-2fa', text: 'Yes, 2FA is now enabled', severity: 'safe' },
    { value: 'already-enabled', text: 'It was already enabled', severity: 'safe' },
    SKIP_LATER,
  ],
};

const METHOD_OPTIONS = [
  { value: 'passkey', text: 'A passkey or security key', severity: 'safe' },
  { value: 'authenticator', text: 'An authenticator app', severity: 'safe' },
  { value: 'sms', text: 'Text-message codes (SMS)', severity: 'warn' },
  { value: 'email', text: 'Codes by email', severity: 'warn' },
];

export const TWO_FA_METHOD_DEBRIEF = [
  {
    id: 'method',
    kind: 'two-factor',
    label: 'What protects this account now?',
    options: [...METHOD_OPTIONS, { value: 'none', text: 'Nothing yet — I’ll set it up now' }],
    legacy: LEGACY_TWO_FA_QUESTION,
  },
  {
    id: 'method_setup',
    label: 'Which did you set up?',
    showIf: { question: 'method', values: ['none'] },
    options: [...METHOD_OPTIONS, SKIP_LATER],
  },
];

export const PASSWORD_MANAGERS = [
  { value: 'apple', text: 'Apple Passwords / iCloud Keychain' },
  { value: 'google', text: 'Google Password Manager (incl. Chrome)' },
  { value: '1password', text: '1Password' },
  { value: 'bitwarden', text: 'Bitwarden' },
  { value: 'proton', text: 'Proton Pass' },
  { value: 'dashlane', text: 'Dashlane' },
  { value: 'lastpass', text: 'LastPass' },
  { value: 'firefox', text: 'Firefox' },
  { value: 'edge', text: 'Microsoft Edge' },
  { value: 'other', text: 'Other' },
  { value: 'none', text: 'No, I don’t use one' },
];

const NOTE_STEP = { text: 'Note which of your accounts it lists as compromised, leaked or reused' };

const PM_STEPS = {
  apple: [
    { text: 'iPhone or iPad: open the Passwords app and tap Security (on older iOS: Settings → Passwords → Security Recommendations)' },
    { text: 'Mac: open the Passwords app and choose Security' },
    NOTE_STEP,
  ],
  google: [
    { text: 'Open Google Password Checkup', url: 'https://passwords.google.com/checkup' },
    { text: 'Run the check (sign in if asked)' },
    NOTE_STEP,
  ],
  '1password': [
    { text: 'Open 1Password and choose Watchtower in the sidebar' },
    { text: 'Look at the compromised, vulnerable and reused password lists' },
    NOTE_STEP,
  ],
  bitwarden: [
    { text: 'Open the Reports page in the Bitwarden web vault', url: 'https://vault.bitwarden.com/#/reports' },
    { text: 'Run Exposed passwords and Reused passwords (some reports need a paid plan)' },
    NOTE_STEP,
  ],
  proton: [
    { text: 'Open Proton Pass and choose Pass Monitor' },
    { text: 'Look at the leaked, reused and weak password lists' },
    NOTE_STEP,
  ],
  dashlane: [
    { text: 'Open Dashlane and choose Password Health' },
    { text: 'Check Dark Web Monitoring for leaks tied to your email' },
    NOTE_STEP,
  ],
  lastpass: [
    { text: 'Open LastPass and choose Security Dashboard' },
    { text: 'Look at the at-risk passwords: leaked, reused or weak' },
    NOTE_STEP,
  ],
  firefox: [
    { text: 'In Firefox, type about:logins in the address bar and look for alerts on your saved logins' },
    { text: 'Check Mozilla Monitor for leaks tied to your email', url: 'https://monitor.mozilla.org' },
    NOTE_STEP,
  ],
  edge: [
    { text: 'In Microsoft Edge, open Settings → Passwords' },
    { text: 'Open Password Monitor and look at the leaked passwords it lists' },
    NOTE_STEP,
  ],
  other: [
    { text: 'Look for a Security, Health, Watchtower or Checkup report in your manager.' },
    NOTE_STEP,
  ],
};

export const PASSWORD_MANAGER_MISSION = {
  id: 'password_manager-recon-report',
  accountId: 'password_manager',
  district: 'master-keys',
  phase: 'recon',
  // Core for players who use a password manager (Liz, 2026-10-06: take its
  // report seriously); players without one never see it.
  unlock: { type: 'password-manager' },
  title: 'Check your password manager’s security report',
  briefing: 'Your password manager can see things we can’t — which passwords leaked and which you’ve reused. Whatever it flags, we change. Whatever it clears, we leave alone.',
  steps: PM_STEPS.other,
  stepsByManager: PM_STEPS,
  debriefQs: [
    {
      // Local only: the numbers never leave this browser.
      id: 'flagged_count',
      type: 'number',
      min: 0,
      max: 9999,
      label: 'How many passwords did it flag?',
      hint: 'Whatever it flags gets a new password; whatever it clears stays as it is.',
      options: [{ value: 'skip', text: 'Couldn’t check right now', severity: 'skip' }],
    },
    {
      id: 'throwaway_count',
      type: 'number',
      min: 0,
      maxFrom: 'flagged_count',
      label: 'How many of those are throwaways — test logins, joke passwords, accounts with nothing real behind them?',
      scout: 'Throwaways don’t need a new password — they need to go. Delete the entry from your password manager, or close the account if it still exists. One catch: a test login on a real service you depend on — your own servers, a work tool — isn’t a throwaway. It can still open a real door.',
      showIf: { question: 'flagged_count', notValues: ['skip'] },
      options: [],
    },
    {
      id: 'flagged',
      multi: true,
      label: 'Which of your accounts here did it flag as compromised or reused?',
      showIf: { question: 'flagged_count', notValues: ['skip'] },
      optionsFrom: 'password-accounts',
      options: [{ value: 'none', text: 'None of these were flagged', severity: 'safe' }],
    },
  ],
  scoutDialog: {
    briefing: '"Your password manager has been keeping notes. Let’s read them. Whatever it flags gets a new password — whatever it doesn’t, we leave alone."',
    debrief: {
      flagged: '"Now we know exactly which locks were copied. Those resets are on the list — every other password can stay put."',
      'none-flagged': '"Nothing flagged. Your manager’s been keeping watch and the report is clean. That’s the kind of boring I like."',
      skip: '"No rush. The report will be there next time you open your manager."',
    },
  },
  estimatedMinutes: 5,
};

// "Change the next 3": the manager's report, three at a time, until every
// flagged password that matters is changed. A bonus since Task 14b (Liz,
// 2026-10-06): the per-category asks on each district do the same job, so
// this never blocks Master Keys. A save that finished it while it was core
// keeps that progress (countsWhenDone: counted like core once done).
export const PM_BURST_MISSION = {
  id: 'password_manager-fortify-burst',
  accountId: 'password_manager',
  district: 'master-keys',
  phase: 'fortify',
  optional: true,
  countsWhenDone: true,
  unlock: { type: 'pm-burst' },
  title: 'Change the next 3',
  briefing: 'Your password manager’s report is the to-do list. Three at a time keeps it doable, and the order matters: the accounts that can unlock other accounts go first.',
  steps: PM_STEPS.other,
  stepsBuilder: 'pm-burst',
  reportSteps: PM_STEPS,
  debriefQs: [
    {
      id: 'changed',
      label: 'How many did you change?',
      options: [
        { value: '1', text: '1', severity: 'safe' },
        { value: '2', text: '2', severity: 'safe' },
        { value: '3', text: '3', severity: 'safe' },
        { value: 'more', text: 'More than 3', severity: 'safe' },
        { value: '0', text: 'None changed — only junk this time' },
        SKIP_LATER_NOT_NOW,
      ],
    },
    {
      id: 'changed_more',
      type: 'number',
      min: 4,
      max: 9999,
      label: 'How many?',
      showIf: { question: 'changed', values: ['more'] },
      options: [],
    },
    {
      id: 'junk',
      label: 'Were any of them junk?',
      showIf: { question: 'changed', notValues: ['later'] },
      options: [
        { value: 'no', text: 'No junk this time' },
        { value: 'yes', text: 'Some were junk — I deleted them' },
      ],
    },
    {
      id: 'junk_count',
      type: 'number',
      min: 1,
      max: 9999,
      label: 'How many did you delete?',
      showIf: { question: 'junk', values: ['yes'] },
      options: [],
    },
  ],
  scoutDialog: {
    briefing: '"Three at a time, and the scary ones first."',
    debrief: {
      later: '"Fair enough. The list will keep — come back for the next three."',
    },
  },
  estimatedMinutes: 10,
};

// Accounts with a -fortify-2fa mission (checked by tests against MISSIONS).
const TWO_FA_ACCOUNTS = ['gmail', 'outlook', 'icloud', 'yahoo', 'protonmail', 'apple_id', 'google', 'microsoft', 'facebook', 'primary_bank'];

// The accounts that unlock everything else: losing access to these is worst.
export const CRITICAL_ACCOUNTS = ['gmail', 'google', 'outlook', 'microsoft', 'apple_id', 'icloud', 'protonmail', 'yahoo', 'primary_bank']
  .filter((id) => ACCOUNTS[id] && TWO_FA_ACCOUNTS.includes(id));

// "Open Gmail security settings", or for an account with no single URL (a
// bank), "Open your primary bank’s security settings".
function openSettingsStep(a) {
  if (a.securityUrl) return { text: `Open ${a.name} security settings`, url: a.securityUrl };
  return { text: `Open your ${a.name.toLowerCase()}’s security settings` };
}

function upgradeMission(acct) {
  const a = ACCOUNTS[acct];
  return {
    id: `${acct}-fortify-2fa-upgrade`,
    accountId: acct,
    phase: 'fortify',
    optional: true,
    unlock: { type: '2fa-method', mission: `${acct}-fortify-2fa`, methods: ['sms', 'email'] },
    title: `Upgrade from text or email codes: ${a.name}`,
    briefing: 'Codes by text or email beat having no second step. But they travel through systems other people can get into: a SIM swap moves your phone number onto a scammer’s phone, and a hijacked inbox hands over every emailed code. An authenticator app or a passkey keeps the second step on a device you hold.',
    steps: [
      openSettingsStep(a),
      { text: 'Add an authenticator app or a passkey as a sign-in method' },
      { text: 'Then remove text messages as a sign-in method where the service allows it — keep the phone number for account recovery only if you want to' },
    ],
    debriefQs: [
      {
        id: 'method',
        label: 'What did you add?',
        options: [
          { value: 'authenticator', text: 'An authenticator app', severity: 'safe' },
          { value: 'passkey', text: 'A passkey or security key', severity: 'safe' },
          SKIP_LATER,
        ],
      },
    ],
    scoutDialog: {
      briefing: '"Codes were a good start. This is the finish."',
      debrief: {
        authenticator: '"Codes on your own device now. A SIM swap gets them a phone number and nothing else."',
        passkey: '"A passkey. Nothing to intercept, nothing to phish. Lovely."',
        later: '"Fair enough. Your codes still count — the upgrade is here when you want it."',
      },
    },
    estimatedMinutes: 5,
  };
}

function backupMission(acct) {
  const a = ACCOUNTS[acct];
  return {
    id: `${acct}-fortify-2fa-backup`,
    accountId: acct,
    phase: 'fortify',
    optional: true,
    unlock: { type: '2fa-done', mission: `${acct}-fortify-2fa` },
    title: `Add a backup way in: ${a.name}`,
    briefing: 'This is one of the accounts everything else hangs on. If the only device with your passkey or authenticator is lost, broken or stolen, you can lock yourself out — and account recovery can take days, or fail. A second way in, set up now, turns a lost phone into an inconvenience instead of a crisis.',
    steps: [
      openSettingsStep(a),
      { text: 'Add a second passkey or security key on another device, or a second authenticator, if the service allows it' },
      { text: 'Save your backup or recovery codes somewhere safe offline — printed, or in your password manager' },
      { text: 'Check that your recovery phone number and email are current' },
    ],
    debriefQs: [
      {
        id: 'action',
        label: 'What did you set up?',
        options: [
          { value: 'added-backup', text: 'A second way in, and my recovery codes are saved', severity: 'safe' },
          { value: 'codes-saved', text: 'Saved my recovery codes (no second device yet)', severity: 'warn' },
          SKIP_LATER,
        ],
      },
    ],
    scoutDialog: {
      briefing: '"Two keys to your own front door. One goes in a drawer you’ll forget about until the day you really need it."',
      debrief: {
        'added-backup': '"Spare key cut and stored. Lose a phone now and it’s a bad afternoon, not a lost account."',
        'codes-saved': '"Recovery codes saved — that’s the part most people skip. Add a second device when you can."',
        later: '"Whenever you’re ready. This one’s insurance — dull right up until the day it isn’t."',
      },
    },
    estimatedMinutes: 10,
  };
}

export const PASSWORD_MISSIONS = [
  PASSWORD_MANAGER_MISSION,
  PM_BURST_MISSION,
  ...TWO_FA_ACCOUNTS.map(upgradeMission),
  ...CRITICAL_ACCOUNTS.map(backupMission),
];
