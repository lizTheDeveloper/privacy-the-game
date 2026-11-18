import { ACCOUNTS } from './accounts.js';

// "I don't have Gmail": the Simple briefing's way out of a mission for something the player
// doesn't have (Liz 2026-11-18). It turns the account off, the same as unticking it on the
// district's list. Only for things a person has or uses: the Capitol's accounts are worth
// making before a thief does, a car is only on the list because the player added it in the
// garage, and the topic districts (Perimeter, Reclamation, Trail, the Field) aren't things you own.
const HAVE = new Set(['master-keys', 'vault', 'marketplace']);
const USE = new Set(['square', 'archives', 'foundry']);

// Where the account's name doesn't fit "I don't have ___" or "I don't use ___".
const SAY = {
  apple_id: 'I don’t have an Apple ID',
  google: 'I don’t have a Google account',
  microsoft: 'I don’t have a Microsoft account',
  facebook: 'I don’t have Facebook',
  primary_bank: 'I don’t have a bank account',
  credit_card: 'I don’t have a credit card',
  crypto_exchange: 'I don’t have crypto',
  investment_account: 'I don’t have investments',
  twitter: 'I don’t use X (Twitter)',
  // The AI missions are about what you posted or said on the company's other apps.
  ai_meta: 'I don’t have Facebook or Instagram',
  ai_google: 'I don’t have a Google account',
  ai_microsoft: 'I don’t have a Microsoft account',
  ai_linkedin: 'I don’t have LinkedIn',
  ai_adobe: 'I don’t use Adobe',
  ai_amazon: 'I don’t have Alexa',
  ai_apple: 'I don’t have an iPhone or Mac',
  ai_x: 'I don’t have X (Twitter)',
  ai_reddit: 'I don’t have Reddit',
  smart_tv: 'I don’t have a smart TV',
  voice_assistant: 'I don’t have a voice assistant',
  smart_camera: 'I don’t have a smart camera',
  smart_appliances: 'I don’t have smart appliances',
  fitness_trackers: 'I don’t have a fitness tracker',
  genetic_testing: 'I’ve never done a DNA test',
};

export function notMineLabel(accountId) {
  const account = ACCOUNTS[accountId];
  if (!account) return null;
  if (Object.hasOwn(SAY, accountId)) return SAY[accountId];
  if (HAVE.has(account.district)) return `I don’t have ${account.name}`;
  if (USE.has(account.district)) return `I don’t use ${account.name}`;
  return null;
}
