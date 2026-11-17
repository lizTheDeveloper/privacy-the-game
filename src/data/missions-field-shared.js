// Shared by The Field's mission files (missions-field-a/b/c.js).

// Fortify / reclaim: did you do it?
export const FIELD_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you do this?',
    options: [
      { value: 'completed', text: 'Done', severity: 'safe' },
      { value: 'already-done', text: 'Already had this in place', severity: 'safe' },
      { value: 'not-applicable', text: "Doesn't apply to my work", severity: 'safe' },
      { value: 'later', text: "I'll come back to this", severity: 'skip' },
    ],
  },
];

// Recon: what did looking show you?
export const FIELD_RECON_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'covered', text: 'I was already covered', severity: 'safe' },
      { value: 'some-gaps', text: 'A few gaps to close', severity: 'warn' },
      { value: 'wide-open', text: 'More open than I thought', severity: 'crit' },
      { value: 'skip', text: "I'll come back to this", severity: 'skip' },
    ],
  },
];

// Scout's debrief lines for FIELD_DEBRIEF. The "later" line is the same everywhere.
export function scoutField(completed, alreadyDone, na) {
  return {
    completed,
    'already-done': alreadyDone,
    'not-applicable': na,
    later: "\"Fine. Just don't wait for the day you need it. That's the one day you won't have time to set it up.\"",
  };
}

// The Field Opsec Kit (The Multiverse School) has a checklist bench per
// playbook at #pNN. Titles are the kit's plain-language ones, generated from
// tools/field_opsec_kit/content/playbooks/*.json in themultiverse.school.
export const FIELD_KIT_URL = 'https://themultiverse.school/tools/field-opsec';
export const FIELD_CLASS_URL = 'https://themultiverse.school/classes/field-opsec';
export const FIELD_PLAYBOOK_TITLES = {
  '01': "Figure out who is after you",
  '02': "Keep your identities apart",
  '03': "Lock down your phone and laptop",
  '04': "Message people without leaving a trail",
  '05': "Talk by voice safely",
  '06': "Keep your email safe from subpoenas",
  '07': "Meet a source in person safely",
  '08': "Hand off material without meeting",
  '09': "Receive files over Tor safely",
  '10': "Open leaked files without getting burned",
  '11': "Prepare your devices before crossing a border",
  '12': "Get through the airport and border desk",
  '13': "Handle a border device search",
  '14': "Clean up your devices after a trip",
  '15': "Work safely on hotel and cafe Wi-Fi",
  '16': "Pack for a protest",
  '17': "Lock down your online accounts",
  '18': "Respond when you get doxxed",
  '19': "Plan for platforms handing over your data",
  '20': "Stop your connections from exposing sources",
  '21': "Handle police at your door",
  '22': "Respond when your device is taken",
  '23': "Prepare for being forced to unlock",
  '24': "Protect a source from start to finish",
  '25': "Respond when you think you're compromised",
  '26': "Keep your team from becoming the leak",
  '27': "Don't slide into giving things up",
  '28': "Keep long working relationships safe",
  '29': "Plan how to meet when channels fail",
};
