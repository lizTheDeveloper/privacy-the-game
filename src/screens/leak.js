// One badge's own page (#/leak/<id>): what the program or case is, who gets the data and under what
// law, which of the player's accounts it touches, and every source. Pure: (state, entry) in, markup
// out. The accounts the player has are read from the save and never sent anywhere.
import { renderHud } from '../components/hud.js';
import { ACCOUNTS } from '../data/accounts.js';
import { hasInterior } from '../data/interiors/index.js';
import { agencyName } from '../data/leaks/index.js';
import { DISTRICTS } from '../data/districts.js';
import { leakMissionIds } from '../data/leaks/actions.js';
import { whatYouCanDo } from '../components/what-you-can-do.js';
import { readLevel } from '../utils/reading.js';
import { seeEverything, simpleLead } from '../components/see-everything.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mine = (state, id) => Boolean(state?.accounts?.[id]?.enabled);

export const LEAK_LABEL = Object.freeze({
  snowden: 'The Snowden files', vault7: 'Vault 7 (WikiLeaks)', foia: 'Public-records request', lawsuit: 'Lawsuit',
  court: 'Court ruling', reporting: 'Investigative reporting', prism: 'The Snowden files',
});

export const LEAK_CSS = `<style>
.leak{max-width:820px;margin:0 auto;padding:0 16px 32px;box-sizing:border-box;color:var(--offwhite)}
.leak .back-link{display:inline-flex;align-items:center;min-height:44px;margin:4px 14px 0 0;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);text-decoration:none}
.leak h1{margin:8px 0 2px;font-family:var(--font-title);line-height:1.2;font-size:24px;font-weight:800;letter-spacing:0.5px;color:#FF2D9B;overflow-wrap:anywhere}
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
.leak .leak-code{display:block;margin:2px 0 0;font-family:var(--font-mono);font-size:11px;font-weight:400;letter-spacing:1px;color:rgba(237,239,243,0.6);text-shadow:none}
@media (max-width:520px){.leak-flow{grid-template-columns:1fr}.leak-flow dt{padding-top:6px}}
</style>`;

// Said once above the buttons: what the missions have in common with the page, and no more.
export const LEAK_WYCD_LEDE = 'These missions work on the same companies and data as this page.';

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

// The screen a badge was tapped on, kept by app.js in memory (never in the URL) while the player
// stays on leak pages; gone on leaving them. Like the saints gallery's saintsOrigin.
const ORIGINS = new Set(['building', 'prism', 'government', 'district', 'saints', 'city']);
export function leakOrigin(route, lastRoute, current = null) {
  if (route?.screen !== 'leak') return null;
  if (lastRoute && lastRoute.screen !== 'leak' && ORIGINS.has(lastRoute.screen)) {
    return { screen: lastRoute.screen, id: typeof lastRoute.params?.id === 'string' ? lastRoute.params.id : null };
  }
  return current;
}

// Back to where the badge was tapped, then the government map and PRISM, each once.
function backLinks(state, from) {
  const link = (href, text, back = false) => `<a class="back-link"${back ? ' data-leak-back' : ''} href="${href}">${text}</a>`;
  const gov = (back) => link('#/government', `${back ? '←' : '◎'} WHO GETS YOUR DATA`, back);
  const prism = (back) => link('#/prism', `${back ? '←' : '◈'} PRISM`, back);
  if (from?.screen === 'prism') return prism(true) + gov(false);
  let back = '';
  if (from?.screen === 'building' && from.id && ACCOUNTS[from.id] && hasInterior(from.id)) back = link(`#/building/${esc(from.id)}`, `← ${esc(ACCOUNTS[from.id].name.toUpperCase())}`, true);
  else if (from?.screen === 'district' && DISTRICTS.some((d) => d.id === from.id)) back = link(`#/district/${esc(from.id)}`, `← ${esc(DISTRICTS.find((d) => d.id === from.id).name.toUpperCase())}`, true);
  else if (from?.screen === 'saints') back = link('#/saints', '← SAINTS', true);
  else if (from?.screen === 'city') back = link('#/city', '← THE CITY', true);
  return back ? back + gov(false) + prism(false) : gov(true) + prism(false);
}

export function renderLeak(state, entry, { from = null } = {}) {
  if (!entry) {
    return `${renderHud(state)}${LEAK_CSS}<div class="screen leak">${backLinks(state, from)}<h1>NOT FOUND</h1><p>That badge isn't in the city's records.</p></div>`;
  }
  const meta = [entry.agency, entry.year, LEAK_LABEL[entry.leak] ?? ''].filter(Boolean).join(' · ');
  const saint = entry.leak === 'snowden' || entry.leak === 'prism'
    ? '<div class="leak-panel leak-saint"><div class="label">SAINT EDWARD SNOWDEN</div><p>We know this because Edward Snowden handed the documents to journalists. <a href="#/saints">Light him a candle →</a></p></div>'
    : '';
  const sources = list(entry.sources).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('');
  if (readLevel(state) === 'simplest' && entry.simpleLead) {
    // Simple: the plain name (the code name small under it), one sentence, What you can do with the
    // one bright button; everything else, as Advanced has it, behind See everything.
    const plain = entry.simpleBadge ? entry.simpleBadge : entry.title;
    const code = entry.simpleBadge ? `<span class="leak-code" data-leak-code>${esc(entry.badge)} · ${esc(String(entry.year))}</span>` : '';
    const rest = `<p class="leak-meta">${esc(meta.toUpperCase())}</p>`
      + `<div class="leak-panel"><div class="label">WHAT IT IS</div><p style="margin: 0;">${esc(entry.summary)}</p></div>`
      + flowBlock(entry.flow)
      + accountsBlock(state, entry)
      + saint
      + `<div class="leak-panel"><div class="label">SOURCES · ${list(entry.sources).length}</div><div class="leak-sources">${sources}</div></div>`;
    return `${renderHud(state)}${LEAK_CSS}<div class="screen leak">`
      + backLinks(state, from)
      + `<h1>${esc(plain)}${code}</h1>`
      + simpleLead(entry.simpleLead)
      + whatYouCanDo(state, leakMissionIds(entry), { lede: LEAK_WYCD_LEDE })
      + seeEverything(`leak:${entry.id}`, rest)
      + '</div>';
  }
  return `${renderHud(state)}${LEAK_CSS}<div class="screen leak">`
    + backLinks(state, from)
    + `<h1>${esc(entry.title)}</h1><p class="leak-meta">${esc(meta.toUpperCase())}</p>`
    + `<div class="leak-panel"><div class="label">WHAT IT IS</div><p style="margin: 0;">${esc(entry.summary)}</p></div>`
    + flowBlock(entry.flow)
    + accountsBlock(state, entry)
    // What you can do: before the sources, with the page's one bright button.
    + whatYouCanDo(state, leakMissionIds(entry), { lede: LEAK_WYCD_LEDE })
    + saint
    + `<div class="leak-panel"><div class="label">SOURCES · ${list(entry.sources).length}</div><div class="leak-sources">${sources}</div></div>`
    + '</div>';
}
