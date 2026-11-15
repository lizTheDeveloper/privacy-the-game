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
