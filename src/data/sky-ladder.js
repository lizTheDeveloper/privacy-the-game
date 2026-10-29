// The sky ladder (docs/superpowers/specs/2026-10-29-sky-ladder-and-satellites-design.md): where
// the player lives, and the opt-outs that cover many stars at once. Data only.

export const US_STATES = Object.freeze([
  ['US-AL', 'Alabama'], ['US-AK', 'Alaska'], ['US-AZ', 'Arizona'], ['US-AR', 'Arkansas'], ['US-CA', 'California'],
  ['US-CO', 'Colorado'], ['US-CT', 'Connecticut'], ['US-DE', 'Delaware'], ['US-DC', 'District of Columbia'], ['US-FL', 'Florida'],
  ['US-GA', 'Georgia'], ['US-HI', 'Hawaii'], ['US-ID', 'Idaho'], ['US-IL', 'Illinois'], ['US-IN', 'Indiana'],
  ['US-IA', 'Iowa'], ['US-KS', 'Kansas'], ['US-KY', 'Kentucky'], ['US-LA', 'Louisiana'], ['US-ME', 'Maine'],
  ['US-MD', 'Maryland'], ['US-MA', 'Massachusetts'], ['US-MI', 'Michigan'], ['US-MN', 'Minnesota'], ['US-MS', 'Mississippi'],
  ['US-MO', 'Missouri'], ['US-MT', 'Montana'], ['US-NE', 'Nebraska'], ['US-NV', 'Nevada'], ['US-NH', 'New Hampshire'],
  ['US-NJ', 'New Jersey'], ['US-NM', 'New Mexico'], ['US-NY', 'New York'], ['US-NC', 'North Carolina'], ['US-ND', 'North Dakota'],
  ['US-OH', 'Ohio'], ['US-OK', 'Oklahoma'], ['US-OR', 'Oregon'], ['US-PA', 'Pennsylvania'], ['US-RI', 'Rhode Island'],
  ['US-SC', 'South Carolina'], ['US-SD', 'South Dakota'], ['US-TN', 'Tennessee'], ['US-TX', 'Texas'], ['US-UT', 'Utah'],
  ['US-VT', 'Vermont'], ['US-VA', 'Virginia'], ['US-WA', 'Washington'], ['US-WV', 'West Virginia'], ['US-WI', 'Wisconsin'],
  ['US-WY', 'Wyoming'],
].map((pair) => Object.freeze(pair)));

export const STATE_NAME = Object.freeze(Object.fromEntries(US_STATES));

// OptOutPrescreen.com, run by the four nationwide consumer reporting companies: it stops them
// supplying your file for prescreened credit and insurance offers. It lights only those four
// reporting records (the same records the credit-freeze rings use), never their parents. The
// online opt-out lasts five years.
export const PRESCREEN = Object.freeze({
  brokers: Object.freeze(['equifax-information-services', 'experian-information-solutions', 'trans-union', 'innovis-data-solutions']),
  days: 1826,
});
