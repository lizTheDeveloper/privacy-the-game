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

function makeManufacturerMissions(accountId) {
  const acct = FREEWAY_ACCOUNTS[accountId];
  if (!acct) return [];
  const name = acct.name;
  const subtitle = acct.subtitle ? ` (${acct.subtitle})` : '';
  const dataList = (acct.dataCollected || []).join(', ');
  const insuranceLine = acct.insuranceProgram
    ? ` Their "${acct.insuranceProgram}" program shares driving data with insurance companies.`
    : '';

  const missions = [
    {
      id: `${accountId}-recon-audit`,
      accountId,
      phase: 'recon',
      title: `Data Audit: ${name}`,
      briefing: `${name}${subtitle} collects ${dataList} from your connected vehicle.${insuranceLine} Before you can opt out, you need to know what they have on you. This mission walks you through requesting your data.`,
      steps: [
        { text: `Open ${name}'s privacy portal`, url: acct.securityUrl },
        { text: 'Submit a "Right to Know" or data access request' },
        { text: 'Enter your VIN or account email to verify identity' },
        { text: 'Note which data categories they report collecting' },
      ],
      debriefQs: CAR_AUDIT_DEBRIEF,
      scoutDialog: {
        briefing: `"${name} knows everywhere you've driven, how fast you went, and how hard you braked. Let's see exactly what they've got on file."`,
        debrief: {
          'no-sharing': '"Clean slate. That\'s rare for a connected car — nice work keeping it locked down."',
          'some-sharing': '"Some data flowing out. We can cut those pipes in the opt-out phase."',
          'full-sharing': '"They\'ve got the whole picture — location, driving habits, the works. Good thing we caught it."',
          'skip': '"No rush. Your car will still be here when you\'re ready."',
        },
      },
      estimatedMinutes: 5,
    },
  ];

  if (acct.insuranceProgram) {
    missions.push({
      id: `${accountId}-recon-insurance`,
      accountId,
      phase: 'recon',
      title: `Insurance Scan: ${name}`,
      briefing: `${name}'s "${acct.insuranceProgram}" program shares your driving behavior with insurance companies and data brokers like LexisNexis and Verisk. Your premiums can go up based on hard braking, late-night driving, or frequent short trips — and you may have consented without realizing it during the purchase process.`,
      steps: [
        { text: `Check your ${name} app for "${acct.insuranceProgram}" or similar`, url: acct.securityUrl },
        { text: 'Look under Settings > Privacy or Connected Services' },
        { text: 'Check if insurance data sharing is enabled' },
        { text: 'Note which insurance features are active' },
      ],
      debriefQs: CAR_AUDIT_DEBRIEF,
      scoutDialog: {
        briefing: `"The '${acct.insuranceProgram}' feature sounds innocent, but it's feeding your driving data straight to insurance companies. Let's see if it's on."`,
        debrief: {
          'no-sharing': '"Insurance sharing is off. That means your premiums aren\'t being influenced by ${name}\'s data."',
          'some-sharing': '"Some sharing active. We\'ll shut that down in the opt-out phase."',
          'full-sharing': '"Full insurance data pipeline. Your braking, speed, and trip times are all being scored. Let\'s fix that."',
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
    briefing: `Time to cut the data pipeline. ${name}'s privacy portal lets you request they stop selling or sharing your personal information. This covers CCPA and state-level privacy rights. They have 45 days to comply.`,
    steps: [
      { text: `Open ${name}'s privacy request form`, url: acct.securityUrl },
      { text: 'Select "Do Not Sell or Share My Personal Information"' },
      { text: 'Enter your VIN and verify your identity' },
      { text: 'Submit the request — save your confirmation number' },
    ],
    debriefQs: CAR_OPTOUT_DEBRIEF,
    scoutDialog: {
      briefing: `"They made it hard to find on purpose. But the law says they have to honor it. File the request and save the confirmation."`,
      debrief: {
        'opted-out': '"Request filed. They have 45 days to comply. One more data pipe cut."',
        'partial': '"Got partway there. Come back and finish when you can."',
        'later': '"Come back when you\'re ready. This one\'s worth doing."',
      },
    },
    estimatedMinutes: 8,
  });

  if (acct.insuranceProgram) {
    missions.push({
      id: `${accountId}-optout-app`,
      accountId,
      phase: 'fortify',
      title: `Disable ${acct.insuranceProgram}: ${name}`,
      briefing: `${name}'s "${acct.insuranceProgram}" feature is the pipeline sending your driving data to insurance companies. Disabling it in the app stops the flow at the source. You keep navigation, Bluetooth, and safety features.`,
      steps: [
        { text: `Open the ${name} app on your phone` },
        { text: `Go to Settings > Privacy or Connected Services` },
        { text: `Find "${acct.insuranceProgram}" and disable it` },
        { text: 'Confirm the change is saved' },
      ],
      debriefQs: APP_DISABLE_DEBRIEF,
      scoutDialog: {
        briefing: `"This is the switch that stops your car from snitching to insurance companies. Flip it."`,
        debrief: {
          'disabled': '"Done. Your car still drives the same — it just stopped reporting on you."',
          'no-app': '"No app, no pipeline. One less thing to worry about."',
          'later': '"Come back when you can. This one matters for your wallet."',
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
    briefing: `The final step: request ${name} delete the historical data they've already collected. This includes past location history, driving behavior records, and any data shared with partners. Under CCPA and similar state laws, they must comply.`,
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
        'opted-out': '"Deletion request filed. The building is liberated — no more data on their servers."',
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
    briefing: 'Verisk is another major data broker that receives driving data from car manufacturers. They compile insurance analytics that directly affect your premiums. This opt-out is separate from your manufacturer opt-out.',
    steps: [
      { text: 'Open Verisk FCRA portal', url: 'https://fcra.verisk.com/#/' },
      { text: 'Submit a consumer data request' },
      { text: 'Review what data they hold' },
      { text: 'File an opt-out or deletion request' },
    ],
    debriefQs: BROKER_DEBRIEF,
    scoutDialog: {
      briefing: '"Verisk is the other big broker. Same drill — find out what they have, then shut it down."',
      debrief: {
        'filed-optout': '"Both major brokers handled. Your driving data pipeline is now severed at every link."',
        'no-data': '"Clean. Verisk had nothing on you."',
        'later': '"Whenever you\'re ready. This one completes the chain."',
      },
    },
    estimatedMinutes: 8,
  },
];

const GENERAL_MISSIONS = [
  {
    id: 'car_general-recon-vin',
    accountId: 'car_gm',
    phase: 'recon',
    title: 'Vehicle Privacy Report',
    briefing: 'Before diving into individual manufacturers, get a bird\'s-eye view of what your car collects. Privacy4Cars offers a free VIN-based report that shows what data categories your specific vehicle transmits.',
    steps: [
      { text: 'Open Vehicle Privacy Report', url: 'https://vehicleprivacyreport.com/' },
      { text: 'Enter your VIN (found on registration or driver-side door jamb)' },
      { text: 'Review the report — note data categories and risk level' },
      { text: 'Check Mozilla\'s Privacy Not Included for your make', url: 'https://foundation.mozilla.org/en/privacynotincluded/categories/cars/' },
    ],
    debriefQs: CAR_AUDIT_DEBRIEF,
    scoutDialog: {
      briefing: '"This report uses your VIN to show exactly what data your specific car model is set up to collect. Good intel before we go manufacturer by manufacturer."',
      debrief: {
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
