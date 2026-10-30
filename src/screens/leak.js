// One badge's own page (#/leak/<id>): what the program or case is, who gets the data and under what
// law, which of the player's accounts it touches, and every source. Pure: (state, entry) in, markup
// out. The accounts the player has are read from the save and never sent anywhere.
import { renderHud } from '../components/hud.js';
import { ACCOUNTS } from '../data/accounts.js';
import { hasInterior } from '../data/interiors/index.js';
import { agencyName } from '../data/leaks/index.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mine = (state, id) => Boolean(state?.accounts?.[id]?.enabled);

export const LEAK_LABEL = Object.freeze({
  snowden: 'The Snowden files', vault7: 'Vault 7 (WikiLeaks)', foia: 'Public-records request', lawsuit: 'Lawsuit',
  court: 'Court ruling', reporting: 'Investigative reporting', prism: 'The Snowden files',
});

export const LEAK_CSS = `<style>
.leak{max-width:820px;margin:0 auto;padding:0 16px 32px;box-sizing:border-box;color:var(--offwhite)}
.leak .back-link{display:inline-flex;align-items:center;min-height:44px;margin:4px 14px 0 0;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);text-decoration:none}
.leak h1{margin:8px 0 2px;font-family:var(--font-display);font-size:24px;font-weight:800;letter-spacing:4px;color:#FF2D9B;overflow-wrap:anywhere}
.leak .leak-meta{margin:0 0 12px;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:rgba(237,239,243,0.6)}
.leak-panel{margin-top:14px;padding:14px 16px;background:rgba(26,31,43,0.5);border:1px solid rgba(255,255,255,0.06);font-size:14px;line-height:1.65;overflow-wrap:anywhere}
.leak-panel .label{font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(255,45,155,0.75);margin-bottom:6px}
.leak-panel a{color:var(--cyan)}
.leak-flow{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:0}
.leak-flow dt{font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:rgba(237,239,243,0.55);padding-top:2px}
.leak-flow dd{margin:0}
.leak-accts{display:flex;flex-wrap:wrap;gap:6px}
.leak-acct{display:inline-flex;align-items:center;min-height:32px;padding:0 8px;font-size:12px;color:var(--offwhite);text-decoration:none;border:1px solid rgba(0,229,255,0.25);border-radius:4px}
.leak-acct--mine{border-color:#FF2D9B;color:#FF2D9B}
.leak-sources a{display:block;padding:5px 0;font-size:13px}
.leak-saint{border-color:rgba(198,255,0,0.25)}
.leak-saint .label{color:rgba(198,255,0,0.75)}
@media (max-width:520px){.leak-flow{grid-template-columns:1fr}.leak-flow dt{padding-top:6px}}
</style>`;

const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function flowBlock(flow) {
  if (!flow) return '';
  const row = (k, v) => (v && (!Array.isArray(v) || v.length) ? `<dt>${k}</dt><dd>${esc(Array.isArray(v) ? v.join(', ') : v)}</dd>` : '');
  return `<div class="leak-panel"><div class="label">WHO GETS IT</div><dl class="leak-flow">`
    + row('WHAT', flow.data)
    + row('TAKEN FROM', list(flow.from))
    + row('TAKEN BY', list(flow.to).map(agencyName))
    + row('SHARED WITH', list(flow.sharedWith).map(agencyName))
    + row('UNDER', flow.authority)
    + row('WHEN', flow.when)
    + row('CHECKED BY', flow.checkedBy)
    + '</dl><p style="margin: 10px 0 0;"><a href="#/government">See it on the government data map →</a></p></div>';
}

function accountsBlock(state, entry) {
  const ids = list(entry.accounts).filter((id) => ACCOUNTS[id]);
  if (!ids.length) return '';
  const items = ids.map((id) => {
    const yours = mine(state, id);
    const href = yours && hasInterior(id) ? `#/building/${esc(id)}` : `#/district/${esc(ACCOUNTS[id].district)}`;
    return `<a class="leak-acct${yours ? ' leak-acct--mine' : ''}" href="${href}">${esc(ACCOUNTS[id].name)}${yours ? ' · yours' : ''}</a>`;
  }).join('');
  return `<div class="leak-panel"><div class="label">IN YOUR CITY</div><div class="leak-accts">${items}</div></div>`;
}

export function renderLeak(state, entry) {
  if (!entry) {
    return `${renderHud(state)}${LEAK_CSS}<div class="screen leak"><a class="back-link" href="#/government">← WHO GETS YOUR DATA</a><h1>NOT FOUND</h1><p>That badge isn't in the city's records.</p></div>`;
  }
  const meta = [entry.agency, entry.year, LEAK_LABEL[entry.leak] ?? ''].filter(Boolean).join(' · ');
  const saint = entry.leak === 'snowden' || entry.leak === 'prism'
    ? '<div class="leak-panel leak-saint"><div class="label">SAINT EDWARD SNOWDEN</div><p>We know this because Edward Snowden handed the documents to journalists. <a href="#/saints">Light him a candle →</a></p></div>'
    : '';
  const sources = list(entry.sources).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('');
  return `${renderHud(state)}${LEAK_CSS}<div class="screen leak">`
    + '<a class="back-link" href="#/government">← WHO GETS YOUR DATA</a><a class="back-link" href="#/prism">◈ PRISM</a>'
    + `<h1>${esc(entry.title)}</h1><p class="leak-meta">${esc(meta.toUpperCase())}</p>`
    + `<div class="leak-panel"><div class="label">WHAT IT IS</div><p style="margin: 0;">${esc(entry.summary)}</p></div>`
    + flowBlock(entry.flow)
    + accountsBlock(state, entry)
    + saint
    + `<div class="leak-panel"><div class="label">SOURCES · ${list(entry.sources).length}</div><div class="leak-sources">${sources}</div></div>`
    + '</div>';
}
