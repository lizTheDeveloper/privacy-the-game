// The ◈ label on every account in the city (data/prism.js): PRISM · year where the company was on the
// 2013 NSA slides, PRISM · NEXT for Dropbox, UPSTREAM (the tapped cables) for the rest. Each links to
// the PRISM map.
import { prismLabel } from '../data/prism.js';
import { ACCOUNTS } from '../data/accounts.js';
import { leaksForAccount } from '../data/leaks/index.js';

const TAG = 'display:inline-flex;align-items:center;gap:4px;min-height:22px;margin-left:8px;padding:1px 7px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;text-decoration:none;border-radius:3px;vertical-align:middle';
const COLOURS = {
  named: 'color:#FF2D9B;border:1px solid rgba(255,45,155,0.6);background:rgba(255,45,155,0.1)',
  next: 'color:#FF2D9B;border:1px solid rgba(255,45,155,0.6);background:rgba(255,45,155,0.1)',
  upstream: 'color:rgba(255,45,155,0.8);border:1px dashed rgba(255,45,155,0.5);background:transparent',
};

export function prismTag(accountId) {
  const l = prismLabel(accountId, ACCOUNTS);
  if (!l) return leakTags(accountId);
  const name = ACCOUNTS[accountId]?.name ?? accountId;
  const why = l.kind === 'named' ? `${name} is run by ${l.company}, in PRISM since ${l.since}`
    : l.kind === 'next' ? `${l.company} was next on the PRISM slides`
    : `${name} runs over the internet cables the NSA taps`;
  const prism = `<a class="prism-tag prism-tag--${l.kind}" href="#/prism" aria-label="${why}: see the PRISM map" style="${TAG};${COLOURS[l.kind]}"><span aria-hidden="true">◈</span>${l.text}</a>`;
  return prism + leakTags(accountId);
}

// Every leak, program or case that names this entry (an account, or a district topic like Location
// Data Brokers): a badge each, to its own page of sources.
function leakTags(accountId) {
  return leaksForAccount(accountId).map((e) => `<a class="prism-tag leak-tag" href="#/leak/${e.id}" aria-label="${e.title}: ${e.agency}, ${e.year}. See its sources" style="${TAG};${COLOURS.named}"><span aria-hidden="true">◈</span>${e.badge}</a>`).join('');
}

// The phone survey chips are buttons, so they get a mark, not a link: solid for PRISM, hollow for upstream.
export function prismMark(accountId) {
  const l = prismLabel(accountId, ACCOUNTS);
  if (!l) return '';
  return ` <span class="survey-chip-prism" style="color: #FF2D9B;${l.kind === 'upstream' ? ' opacity: 0.6;' : ''}" aria-hidden="true">${l.kind === 'upstream' ? '◇' : '◈'}</span>`;
}
