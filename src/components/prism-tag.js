// The ◈ PRISM label on an account run by a company named in the 2013 NSA slides (data/prism.js).
// It links to the PRISM map. Accounts PRISM didn't name get nothing.
import { prismLabel } from '../data/prism.js';

const TAG = 'display:inline-flex;align-items:center;gap:4px;min-height:22px;margin-left:8px;padding:1px 7px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;text-decoration:none;border-radius:3px;vertical-align:middle';

export function prismTag(accountId) {
  const l = prismLabel(accountId);
  if (!l) return '';
  const planned = l.kind === 'planned';
  const colours = planned
    ? 'color:rgba(255,45,155,0.7);border:1px dashed rgba(255,45,155,0.5);background:transparent'
    : 'color:#FF2D9B;border:1px solid rgba(255,45,155,0.6);background:rgba(255,45,155,0.1)';
  const why = planned ? `${l.company} was on the NSA's list to add to PRISM` : `${l.company} was named in the PRISM slides, from ${l.since}`;
  return `<a class="prism-tag${planned ? ' prism-tag--planned' : ''}" href="#/prism" aria-label="${why}: see the PRISM map" style="${TAG};${colours}"><span aria-hidden="true">◈</span>${l.text}</a>`;
}
