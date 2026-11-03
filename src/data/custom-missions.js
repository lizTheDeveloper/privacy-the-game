// Missions for the accounts a player adds by hand ("Add another account..." on a
// district's survey). The design spec promised that a custom account gets its own
// missions; until v7.13.0 it got none (feature map row 16).
//
// The game knows nothing about a service it has never seen, so these say nothing
// about it: no links, no menu names, no claims about what it collects. They are the
// steps that work on almost any account (the sign-ins it shows, the password, a
// second step, the recovery email and phone), built on the same debrief templates as
// the game's own missions, with one line for the district's kind of account.
//
// PRIVATE, like bank notes. The name lives only in the local save
// (state.customAccounts). A mission id carries a hash of the name, never the name;
// these missions send no track() event (app.js), their routes leave the device as
// #/mission/custom (utils/pageview-url.js), and the rows carry the `custom-account`
// class that PRIVATE_UI drops from breadcrumbs.
//
// They are bonus missions: they never count toward a district's progress, its lights
// or the city's totals, so adding an account can never take a finished district
// below 100%.
import { MISSIONS, LOGIN_DEBRIEF, PASSWORD_DEBRIEF } from './missions.js';
import { TWO_FA_METHOD_DEBRIEF } from './missions-passwords.js';

export const CUSTOM_PREFIX = 'custom_';
export const CUSTOM_NAME_MAX = 60;

// What a player may call an account: printable text, no markup characters (titles
// and steps are drawn as HTML in places), one space between words.
export function cleanCustomName(raw) {
  return String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CUSTOM_NAME_MAX)
    .trim();
}

// FNV-1a over the lower-cased name: the same account always gets the same missions
// (and its filed records back if it is removed and added again).
function nameKey(name) {
  let h = 0x811c9dc5;
  for (const ch of name.toLowerCase()) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

// One line per district for its kind of account. Only "if it offers" claims.
const CATEGORY_LINE = {
  'master-keys': 'If this is an email account, it can probably reset the passwords of your other accounts, so it is worth doing first.',
  vault: 'Money moves fast. If it offers alerts for sign-ins or payments, turn them on while you are there.',
  square: 'Anyone who gets in here can post and message as you, to people who trust you.',
  archives: 'While you are in, look for files you shared by link a long time ago.',
  marketplace: 'If it keeps a saved card or your address, remove any you no longer need.',
  capitol: 'Some government accounts offer only text-message codes for a second step. Those still count.',
  foundry: 'If it has a setting about using what you type or upload to train or improve its models, decide whether you want it on.',
};

const OPEN_IT = (name) => ({ text: `Open ${name} yourself: type its address or use its app, not a link from an email or a text` });

const RECOVERY_DEBRIEF = [
  {
    id: 'action',
    label: 'Are the recovery email and phone ones you control now?',
    options: [
      { value: 'updated', text: 'Yes, I removed old ones or added current ones', severity: 'safe' },
      { value: 'already-current', text: 'They were already current', severity: 'safe' },
      { value: 'later', text: 'I’ll come back to this', severity: 'skip' },
    ],
  },
];

// The game's own two-factor question, plus the answer a service the game has never
// seen may need: it has no second step to offer.
const NOT_OFFERED = { value: 'not-offered', text: 'It doesn’t offer one', severity: 'safe' };
const CUSTOM_TWO_FA_DEBRIEF = TWO_FA_METHOD_DEBRIEF.map((q) =>
  q.id === 'method_setup' ? { ...q, options: [...q.options.slice(0, -1), NOT_OFFERED, q.options[q.options.length - 1]] } : q);

function buildMissions(districtId, name, key) {
  const accountId = `${CUSTOM_PREFIX}${districtId}_${key}`;
  const base = { accountId, district: districtId, custom: true, customName: name, optional: true, estimatedMinutes: 5 };
  const category = CATEGORY_LINE[districtId];
  return [
    {
      ...base,
      id: `${accountId}_signin`,
      phase: 'recon',
      title: `Sign-in check: ${name}`,
      briefing: `You added ${name} yourself, so the game doesn’t know its settings pages. These steps work on almost any account: see where it is signed in, and what it would use to let you back in. A device you don’t recognise can mean someone else has your password.${category ? ` ${category}` : ''}`,
      steps: [
        OPEN_IT(name),
        { text: 'Find its security or account settings, and look for where you are signed in: devices, sessions or recent activity' },
        { text: 'Sign out of anything you don’t recognise' },
        { text: 'Note the recovery email and phone number it has for you. A later mission checks them' },
      ],
      debriefQs: LOGIN_DEBRIEF,
      scoutDialog: {
        briefing: '"I don’t know this one. That’s fine: every account has a list of where it’s signed in. Let’s read it."',
        debrief: {
          'no-breaches': '"All yours. That’s the answer we wanted."',
          '1-2-breaches': '"Signed out and noted. If you can’t tell how that device got in, change the password next."',
          '3plus-breaches': '"Someone else was in. Change the password now, then add a second step. Both are the next missions."',
          'skip': '"No rush. It’ll be here."',
        },
      },
    },
    {
      ...base,
      id: `${accountId}_password`,
      phase: 'fortify',
      title: `Password: ${name}`,
      briefing: `Change this password only if you need to: if the sign-in check found something, if you have used this password anywhere else, or if ${name} told you about a breach. If none of those, it is already doing its job, and you can file it as unique and strong.`,
      steps: [
        OPEN_IT(name),
        { text: 'In its security or account settings, find “Change password”' },
        { text: 'Use a password you have never used anywhere else. A password manager can make one and remember it' },
        { text: 'If it offers to sign you out everywhere else, say yes' },
      ],
      debriefQs: PASSWORD_DEBRIEF,
      scoutDialog: {
        briefing: '"Only if it needs it. A strong, unique password doesn’t get better by changing it."',
        debrief: {
          'reset-password': '"New key, old lock retired. Nicely done."',
          'already-strong': '"Already unique. Then there was nothing to fix."',
          'later': '"It’ll keep. Come back when you have a minute."',
        },
      },
    },
    {
      ...base,
      id: `${accountId}_twofa`,
      phase: 'fortify',
      title: `Second step: ${name}`,
      briefing: `A second step means a stolen password isn’t enough on its own. Look for it under names like two-step verification, two-factor authentication or passkeys. Take the strongest one ${name} offers: a passkey or security key, then an authenticator app, then codes by text or email. Text codes still count; a SIM-swap crew who moves your number to their SIM gets those too, which is why the others come first.`,
      steps: [
        OPEN_IT(name),
        { text: 'In its security settings, look for two-step verification, two-factor authentication or passkeys' },
        { text: 'Pick the strongest it offers: a passkey or security key, then an authenticator app, then text or email codes' },
        { text: 'If it gives you backup codes, save them in your password manager or somewhere offline' },
      ],
      debriefQs: CUSTOM_TWO_FA_DEBRIEF,
      scoutDialog: {
        briefing: '"One more lock on the door. Whatever it offers, the strongest one is the one to pick."',
        debrief: {
          'not-offered': '"Then there’s no switch to flip. A unique password is doing all the work here, so keep it that way."',
          'later': '"Parked. It’ll be here."',
        },
      },
    },
    {
      ...base,
      id: `${accountId}_recovery`,
      phase: 'reclaim',
      title: `Recovery: ${name}`,
      briefing: `The recovery email and phone number are how ${name} lets you back in when you are locked out. Anyone who controls one of them can usually ask to be let in as you. Make sure each is one you still control, and that the email account is one you have secured too.`,
      steps: [
        OPEN_IT(name),
        { text: 'In its security or account settings, find the recovery email and phone number' },
        { text: 'Remove any you no longer use, and add ones you control now' },
        { text: 'If it offers backup or recovery codes, save them in your password manager or somewhere offline' },
      ],
      debriefQs: RECOVERY_DEBRIEF,
      scoutDialog: {
        briefing: '"The back door. It should only open for you."',
        debrief: {
          'updated': '"Back door re-keyed. Only you get let in now."',
          'already-current': '"Already yours. Good."',
          'later': '"No rush. Worth doing before you need it, though."',
        },
      },
    },
  ];
}

// The custom accounts in a district: { name, key }, duplicates (same name) once.
export function customAccountsIn(state, districtId) {
  const seen = new Set();
  const out = [];
  for (const raw of state?.customAccounts?.[districtId] || []) {
    const name = cleanCustomName(raw);
    if (!name) continue;
    const key = nameKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, key });
  }
  return out;
}

// Every custom mission in a district, in phase order per account.
export function customMissionsFor(state, districtId) {
  return customAccountsIn(state, districtId).flatMap(({ name, key }) => buildMissions(districtId, name, key));
}

export function isCustomMission(missionOrId) {
  const id = typeof missionOrId === 'string' ? missionOrId : missionOrId?.id;
  return typeof id === 'string' && id.startsWith(CUSTOM_PREFIX);
}

// A custom mission by id, if that account is still in the player's survey.
export function findCustomMission(state, id) {
  if (!isCustomMission(id)) return undefined;
  for (const districtId of Object.keys(state?.customAccounts || {})) {
    if (!id.startsWith(`${CUSTOM_PREFIX}${districtId}_`)) continue;
    const m = customMissionsFor(state, districtId).find((x) => x.id === id);
    if (m) return m;
  }
  return undefined;
}

// Any mission: the game's own, then this player's custom ones.
export function findMission(state, id) {
  return MISSIONS.find((m) => m.id === id) || findCustomMission(state, id);
}
