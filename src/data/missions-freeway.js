import { FREEWAY_ACCOUNTS } from './accounts-freeway.js';

const CAR_AUDIT_DEBRIEF = [
  {
    id: 'finding',
    label: 'What did you find?',
    options: [
      { value: 'no-sharing', text: 'No data sharing enabled', severity: 'safe' },
      { value: 'some-sharing', text: 'Some data sharing active', severity: 'warn' },
      { value: 'full-sharing', text: 'Full data sharing including insurance', severity: 'crit' },
      { value: 'skip', text: "Couldn't check right now", severity: 'skip' },
    ],
  },
];

const CAR_OPTOUT_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you file the opt-out?',
    options: [
      { value: 'opted-out', text: 'Yes, submitted the opt-out request', severity: 'safe' },
      { value: 'partial', text: 'Partially completed, will finish later', severity: 'warn' },
      { value: 'later', text: "I'll come back to this", severity: 'skip' },
    ],
  },
];

const BROKER_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you file the opt-out?',
    options: [
      { value: 'filed-optout', text: 'Yes, submitted the request', severity: 'safe' },
      { value: 'no-data', text: 'They had no data on me', severity: 'safe' },
      { value: 'later', text: "I'll come back to this", severity: 'skip' },
    ],
  },
];

const APP_DISABLE_DEBRIEF = [
  {
    id: 'action',
    label: 'Did you disable in-app tracking?',
    options: [
      { value: 'disabled', text: 'Yes, turned off data sharing in the app', severity: 'safe' },
      { value: 'no-app', text: "I don't have this app installed", severity: 'safe' },
      { value: 'later', text: "I'll come back to this", severity: 'skip' },
    ],
  },
];

// Recon audit (Freeway): a data request takes up to 45 days (extendable to
// 90), so the audit records the request, not an answer it can't have yet.
// New question ids; an old save's "finding" still shows (question.legacy).
const REQUEST_DEBRIEF = [
  {
    id: 'request',
    label: 'Did you file the data request?',
    legacy: CAR_AUDIT_DEBRIEF[0],
    options: [
      { value: 'request-filed', text: 'Filed my request (they have up to 45 days, extendable to 90)', severity: 'safe' },
      { value: 'already-filed', text: 'I’d already filed one', severity: 'safe' },
      { value: 'skip', text: "Couldn't do it right now", severity: 'skip' },
    ],
  },
];

const INSURER_DATA_DEBRIEF = [
  {
    id: 'insurer_data',
    label: 'What did you find?',
    legacy: CAR_AUDIT_DEBRIEF[0],
    options: [
      { value: 'none-found', text: 'No driving data in either report, and the program is off', severity: 'safe' },
      { value: 'program-on', text: 'The program was on, and I turned it off', severity: 'warn' },
      { value: 'found-in-report', text: 'My driving data is in a report', severity: 'crit' },
      { value: 'requested', text: 'Requested the reports, waiting', severity: 'safe' },
      { value: 'skip', text: "Couldn't check right now", severity: 'skip' },
    ],
  },
];

const VEHICLE_LABEL_DEBRIEF = [
  {
    id: 'vehicle_label',
    label: 'What does the label say your vehicle does?',
    legacy: CAR_AUDIT_DEBRIEF[0],
    options: [
      { value: 'collects-little', text: 'Collects little', severity: 'safe' },
      { value: 'collects-location', text: 'Collects location and driving data', severity: 'warn' },
      { value: 'shares-or-sells', text: 'Says it shares or sells data', severity: 'crit' },
      { value: 'skip', text: "Couldn't check right now", severity: 'skip' },
    ],
  },
];

// The insurance-app missions, by what the program really is now.
const APP_CHECK_DEBRIEF = [
  {
    id: 'action',
    label: 'What did you find in the app?',
    options: [
      { value: 'disabled', text: 'Turned off a data-sharing setting I found', severity: 'safe' },
      { value: 'nothing-on', text: 'Checked: nothing was on', severity: 'safe' },
      { value: 'no-app', text: "I don't have this app installed", severity: 'safe' },
      { value: 'later', text: "I'll come back to this", severity: 'skip' },
    ],
  },
];

const INSURANCE_LINE = {
  active: (p) => ` Their "${p}" program can send driving data to insurers if you're enrolled.`,
  ended: (p) => ` Their "${p}" program, which sent driving data to insurers, ended in April 2024.`,
  'not-insurance': () => '',
};

function makeManufacturerMissions(accountId) {
  const acct = FREEWAY_ACCOUNTS[accountId];
  if (!acct) return [];
  const name = acct.name;
  const subtitle = acct.subtitle ? ` (${acct.subtitle})` : '';
  const dataList = (acct.dataCollected || []).join(', ');
  const program = acct.insuranceProgram;
  const status = acct.insuranceStatus;
  const insuranceLine = program ? INSURANCE_LINE[status](program) : '';
  const requestUrl = acct.requestUrl || acct.securityUrl;

  const missions = [
    {
      id: `${accountId}-recon-audit`,
      accountId,
      phase: 'recon',
      title: `File a data request: ${name}`,
      briefing: `${name}${subtitle} collects ${dataList} from your connected vehicle.${insuranceLine} Before you can opt out, you need to know what they have on you. This mission files the request; the answer comes later.`,
      steps: [
        { text: `Open ${name}'s privacy request form`, url: requestUrl },
        { text: 'Choose the request to see your data (the brand’s privacy request form names it)' },
        { text: 'Verify your identity with your VIN or account email, and submit' },
        { text: 'They have up to 45 days to respond (extendable to 90). The report lists the categories they collect and who they share them with' },
      ],
      debriefQs: REQUEST_DEBRIEF,
      scoutDialog: {
        briefing: `"${name} may know where you've driven, how fast, and how hard you braked. A data request makes them tell you."`,
        debrief: {
          'request-filed': '"Filed. Now they have to tell you what they have, and who they gave it to."',
          'already-filed': '"Already in. Keep an eye out for their answer."',
          'no-sharing': '"Clean slate. That\'s rare for a connected car — nice work keeping it locked down."',
          'some-sharing': '"Some data flowing out. We can cut those pipes in the opt-out phase."',
          'full-sharing': '"They\'ve got the whole picture — location, driving habits, the works. Good thing we caught it."',
          'skip': '"No rush. Your car will still be here when you\'re ready."',
        },
      },
      estimatedMinutes: 5,
    },
  ];

  if (program) {
    missions.push({
      id: `${accountId}-recon-insurance`,
      accountId,
      phase: 'recon',
      title: `Insurance Data Check: ${name}`,
      briefing: `Driving data reaches insurers through data exchanges run by LexisNexis and Verisk. Your consumer reports from each show what they hold.${insuranceLine} The last step checks ${name}'s side.`,
      steps: [
        { text: 'Request your LexisNexis Consumer Disclosure Report. Its telematics section shows driving data insurers received', url: 'https://consumer.risk.lexisnexis.com/request' },
        { text: 'Request your Verisk report and look for Driving Data. Verisk’s driving-data exchange shut down in April 2024, so it shows past data', url: 'https://fcra.verisk.com' },
        { text: acct.insuranceStep },
      ],
      debriefQs: INSURER_DATA_DEBRIEF,
      scoutDialog: {
        briefing: `"Insurers don't guess about your driving if someone sold them the data. The two reports say whether anyone did."`,
        debrief: {
          'none-found': '"Nothing in the reports, nothing switched on. Good."',
          'program-on': `"It was on, and now it's off. ${name} isn't sending new driving data to insurers through it."`,
          'found-in-report': '"Your driving data is in a report. You can dispute anything wrong with the company that holds it."',
          'requested': '"Requested. The reports take a while to arrive."',
          'no-sharing': `"Insurance sharing is off. ${name} isn't sending new driving data to insurers through this program."`,
          'some-sharing': '"Some sharing active. We\'ll shut that down in the opt-out phase."',
          'full-sharing': '"Full insurance data pipeline. Your braking, speed, and trip times were being scored. Let\'s fix that."',
          'skip': '"Take your time — we\'ll circle back."',
        },
      },
      estimatedMinutes: 5,
    });
  }

  missions.push({
    id: `${accountId}-optout-privacy`,
    accountId,
    phase: 'fortify',
    title: `Privacy Opt-Out: ${name}`,
    briefing: `Time to cut the data pipeline. ${name}'s privacy portal lets you ask them to stop selling or sharing your personal information. That right comes from California's law and similar state laws. Under California's rules, a business has 15 business days to act on an opt-out.`,
    steps: [
      { text: `Open ${name}'s privacy request form`, url: acct.securityUrl },
      { text: 'Choose the opt-out of selling or sharing your data (the brand’s privacy request form names it)' },
      { text: 'Enter your VIN and verify your identity' },
      { text: 'Submit the request — save your confirmation number' },
    ],
    debriefQs: CAR_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: `"They made it hard to find on purpose. But the law says they have to honor it. File the request and save the confirmation."`,
      debrief: {
        'opted-out': '"Request filed. One more data pipe cut."',
        'partial': '"Got partway there. Come back and finish when you can."',
        'later': '"Come back when you\'re ready. This one\'s worth doing."',
      },
    },
    estimatedMinutes: 8,
  });

  if (program) {
    const app = {
      active: {
        title: `Turn off ${program}: ${name}`,
        briefing: `${name}'s "${program}" can send your driving data to insurers if you're enrolled. Turning it off stops new data at the source. You keep navigation, Bluetooth, and safety features.`,
        scout: `"If ${program} is on, this is the switch. If it's off, now you know."`,
      },
      ended: {
        title: `Check what's left of ${program}: ${name}`,
        briefing: `${name}'s "${program}" ended in April 2024, so there's no switch left for it. The app may still have other data-sharing settings. This is a quick look to make sure nothing else is on.`,
        scout: `"${program} is gone. Let's make sure nothing took its place."`,
      },
      'not-insurance': {
        title: `Check ${program} data sharing: ${name}`,
        briefing: `${program} is ${name}'s connected-services brand, not an insurance program. It shares odometer data only with an insurer you authorize. This is a quick look at its data-sharing preferences.`,
        scout: '"Not an insurance program. Still worth a look at what it shares."',
      },
    }[status];
    missions.push({
      id: `${accountId}-optout-app`,
      accountId,
      phase: 'fortify',
      title: app.title,
      briefing: app.briefing,
      steps: [
        { text: `Open the ${name} app on your phone` },
        { text: acct.insuranceStep },
        { text: 'Turn off any data-sharing setting you don’t want, and confirm the change is saved' },
      ],
      debriefQs: APP_CHECK_DEBRIEF,
      scoutDialog: {
        briefing: app.scout,
        debrief: {
          'disabled': '"Done. Your car still drives the same. It just shares less."',
          'nothing-on': '"Nothing on. Good."',
          'no-app': '"No app, no switch to flip. One less thing to worry about."',
          'later': '"Come back when you can."',
        },
      },
      estimatedMinutes: 5,
    });
  }

  missions.push({
    id: `${accountId}-reclaim-delete`,
    accountId,
    phase: 'reclaim',
    title: `Delete Data: ${name}`,
    briefing: `The final step: ask ${name} to delete the data they've already collected. That includes past location history, driving behavior records, and data shared with partners. California's law and similar state laws give you this right, with some exceptions. They have up to 45 days to respond (extendable to 90).`,
    steps: [
      { text: `Open ${name}'s privacy portal`, url: acct.securityUrl },
      { text: 'Select "Delete My Personal Information"' },
      { text: 'Verify your identity with VIN or account credentials' },
      { text: 'Submit the deletion request and save confirmation' },
    ],
    debriefQs: CAR_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: `"Opting out stops new data. Deletion wipes what they already have. Both matter."`,
      debrief: {
        'opted-out': '"Deletion request filed. They have up to 45 days to answer it."',
        'partial': '"Partway there. Come back to finish the deletion."',
        'later': '"When you\'re ready. The opt-out already stopped new collection."',
      },
    },
    estimatedMinutes: 5,
  });

  return missions;
}

const MANUFACTURER_IDS = [
  'car_gm', 'car_toyota', 'car_honda', 'car_ford',
  'car_hyundai', 'car_kia', 'car_nissan', 'car_subaru',
  'car_tesla', 'car_bmw', 'car_vw', 'car_stellantis',
];

const BROKER_MISSIONS = [
  {
    id: 'car_broker_lexisnexis-optout',
    accountId: 'car_broker_lexisnexis',
    phase: 'fortify',
    title: 'Opt Out: LexisNexis',
    briefing: 'LexisNexis aggregates driving data from multiple car manufacturers and resells it to insurance companies. Even if you opt out with your car maker, LexisNexis may still have historical data. Filing a separate opt-out here covers the broker side.',
    steps: [
      { text: 'Open LexisNexis consumer portal', url: 'https://consumer.risk.lexisnexis.com/consumer' },
      { text: 'Request your consumer disclosure report' },
      { text: 'Review what driving data they have on file' },
      { text: 'Submit an opt-out or deletion request' },
    ],
    debriefQs: BROKER_DEBRIEF,
    scoutDialog: {
      briefing: '"LexisNexis is the middleman. Your car maker sends data here, and insurance companies buy it. Cut the middleman."',
      debrief: {
        'filed-optout': '"Broker opt-out filed. That cuts one of the biggest data resellers out of the chain."',
        'no-data': '"No data on file — that\'s a good sign your car maker wasn\'t sharing yet."',
        'later': '"Come back when you can. This one protects you across all your vehicles."',
      },
    },
    estimatedMinutes: 8,
  },
  {
    id: 'car_broker_verisk-optout',
    accountId: 'car_broker_verisk',
    phase: 'fortify',
    title: 'Opt Out: Verisk',
    briefing: 'Verisk is another major data broker. It received driving data from car manufacturers until it shut its driving-data exchange in April 2024, and it still compiles insurance analytics that can affect your premiums. This request is separate from your manufacturer opt-out.',
    steps: [
      { text: 'Open Verisk FCRA portal', url: 'https://fcra.verisk.com' },
      { text: 'Submit a consumer data request' },
      { text: 'Review what data they hold' },
      { text: 'File an opt-out or deletion request' },
    ],
    debriefQs: BROKER_DEBRIEF,
    scoutDialog: {
      briefing: '"Verisk is the other big broker. Same drill — find out what they have, then shut it down."',
      debrief: {
        'filed-optout': '"Both major brokers handled. That covers the two big driving-data middlemen."',
        'no-data': '"Clean. Verisk had nothing on you."',
        'later': '"Whenever you\'re ready. This one completes the chain."',
      },
    },
    estimatedMinutes: 8,
  },
];

// Every car owner's report, not only GM's (recon audit #56): it belongs to
// no account and is in play when any car is.
const GENERAL_MISSIONS = [
  {
    id: 'car_general-recon-vin',
    district: 'freeway',
    inPlayIfAny: MANUFACTURER_IDS,
    phase: 'recon',
    title: 'Vehicle Privacy Report',
    briefing: 'Before diving into individual manufacturers, get a bird\'s-eye view of what your car collects. Privacy4Cars offers a free VIN-based report with a Vehicle Privacy Label: what this vehicle collects, shares and sells.',
    steps: [
      { text: 'Open Vehicle Privacy Report and enter your VIN (on your registration or the driver-side door jamb)', url: 'https://vehicleprivacyreport.com/' },
      { text: 'Read the Vehicle Privacy Label: what this vehicle collects, shares and sells' },
    ],
    debriefQs: VEHICLE_LABEL_DEBRIEF,
    scoutDialog: {
      briefing: '"This report uses your VIN to show what your specific car model is set up to collect. Good intel before we go manufacturer by manufacturer."',
      debrief: {
        'collects-little': '"Not much on the label. Good."',
        'collects-location': '"Location and driving data. Standard for a modern connected car. The requests are next."',
        'shares-or-sells': '"It says it shares or sells. Let\'s find out with whom, maker by maker."',
        'no-sharing': '"Low risk vehicle. You picked a good one."',
        'some-sharing': '"Some exposure — standard for modern connected cars. We\'ll lock it down."',
        'full-sharing': '"High-risk vehicle. Everything from location to cabin audio. Let\'s get to work."',
        'skip': '"No rush. The report will be there when you\'re ready."',
      },
    },
    estimatedMinutes: 5,
  },
];

export const FREEWAY_MISSIONS = [
  ...GENERAL_MISSIONS,
  ...MANUFACTURER_IDS.flatMap(makeManufacturerMissions),
  ...BROKER_MISSIONS,
];
