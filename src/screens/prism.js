// The PRISM map (#/prism): the nine companies named in the 2013 NSA slides, which of the player's
// accounts they run, what the program took, and Saint Snowden, who made it knowable. Pure: state in,
// markup out. Which accounts the player has is read from the save and never sent anywhere.
import { renderHud } from '../components/hud.js';
import { renderScout } from '../components/scout.js';
import { ACCOUNTS } from '../data/accounts.js';
import { hasInterior } from '../data/interiors/index.js';
import { PRISM_PROVIDERS, PRISM_PLANNED, PRISM_SOURCES, PRISM_COPY, NOT_AN_ACCOUNT } from '../data/prism.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = (src) => `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.label)}</a>`;
const mine = (state, id) => Boolean(state?.accounts?.[id]?.enabled);

const STYLE = `<style>
.prism{max-width:860px;margin:0 auto;padding:0 16px 32px;box-sizing:border-box;color:var(--offwhite)}
.prism .back-link{display:inline-flex;align-items:center;min-height:44px;margin-top:4px;font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--cyan);text-decoration:none}
.prism h1{margin:8px 0 2px;font-family:var(--font-display);font-size:30px;font-weight:800;letter-spacing:8px;color:#FF2D9B;text-shadow:0 0 22px rgba(255,45,155,0.45)}
.prism .prism-sub{margin:0 0 14px;font-family:var(--font-mono);font-size:11px;letter-spacing:2px;color:rgba(237,239,243,0.55)}
.prism-diagram{display:block;width:100%;height:auto;margin:6px 0 4px;background:radial-gradient(ellipse at 60% 50%,#151a28 0%,#090B10 70%);border:1px solid rgba(255,45,155,0.2);border-radius:8px}
.prism-diagram text{font-family:'JetBrains Mono',ui-monospace,monospace}
@media (prefers-reduced-motion:no-preference){.prism-diagram .beam{stroke-dasharray:4 6;animation:prism-flow 2.4s linear infinite}@keyframes prism-flow{to{stroke-dashoffset:-20}}}
.prism-key{font-size:11px;color:rgba(237,239,243,0.55);margin:0 0 14px}
.prism-panel{margin-top:14px;padding:14px 16px;background:rgba(26,31,43,0.5);border:1px solid rgba(255,255,255,0.06);font-size:14px;line-height:1.65;overflow-wrap:anywhere}
.prism-panel .label{font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(255,45,155,0.75);margin-bottom:6px}
.prism-panel p{margin:6px 0}
.prism-panel a{color:var(--cyan)}
.prism-companies{list-style:none;margin:0;padding:0}
.prism-companies li{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.prism-companies .co{font-family:var(--font-display);font-weight:700;letter-spacing:1px;min-width:110px}
.prism-companies .yr{font-family:var(--font-mono);font-size:11px;color:rgba(255,45,155,0.8)}
.prism-companies .acct{display:inline-flex;align-items:center;min-height:32px;padding:0 8px;font-size:12px;color:var(--offwhite);text-decoration:none;border:1px solid rgba(0,229,255,0.25);border-radius:4px}
.prism-companies .acct--mine{border-color:#FF2D9B;color:#FF2D9B}
.prism-companies .none{font-size:12px;color:rgba(237,239,243,0.4)}
.prism-sources a{display:block;padding:4px 0;font-size:12px}
.prism-saint{border-color:rgba(198,255,0,0.25)}
.prism-saint .label{color:rgba(198,255,0,0.75)}
.prism-go{display:inline-flex;align-items:center;min-height:44px;margin-top:6px;padding:0 16px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#090B10;background:var(--lime);border-radius:6px;text-decoration:none}
</style>`;

// Nine beams from the companies on the left into a prism, one bright beam out to the NSA. A company
// the player has an account with glows magenta.
function diagram(state) {
  const rows = PRISM_PROVIDERS.length;
  const top = 30;
  const step = 32;
  const h = top * 2 + step * (rows - 1);
  const px = 360;
  const py = h / 2;
  const beams = [];
  const nodes = [];
  PRISM_PROVIDERS.forEach((p, i) => {
    const y = top + i * step;
    const yours = p.accounts.some((id) => mine(state, id));
    const colour = yours ? '#FF2D9B' : '#00E5FF';
    beams.push(`<line class="beam" x1="232" y1="${y}" x2="${px - 30}" y2="${py}" stroke="${colour}" stroke-opacity="${yours ? 0.85 : 0.35}" stroke-width="${yours ? 2 : 1.2}"/>`);
    nodes.push(`<circle cx="222" cy="${y}" r="${yours ? 6 : 4.5}" fill="${colour}"/>`
      + `<text x="10" y="${y + 5}" font-size="13" fill="rgba(237,239,243,0.45)">${p.since}</text>`
      + `<text x="58" y="${y + 6}" font-size="17" fill="${yours ? '#FF2D9B' : '#EDEFF3'}">${esc(p.name.replace(/ \(.*\)$/, ''))}${yours ? ' ◂' : ''}</text>`);
  });
  const prism = `<path d="M${px - 30} ${py + 56} L${px + 30} ${py - 62} L${px + 90} ${py + 56} Z" fill="rgba(255,45,155,0.12)" stroke="#FF2D9B" stroke-width="2"/>`
    + `<text x="${px + 30}" y="${py + 42}" font-size="15" font-weight="700" text-anchor="middle" fill="#FF2D9B" letter-spacing="3">PRISM</text>`;
  const out = `<line class="beam" x1="${px + 70}" y1="${py}" x2="${px + 160}" y2="${py}" stroke="#FF2D9B" stroke-width="5" stroke-opacity="0.9"/>`
    + `<text x="${px + 168}" y="${py + 6}" font-size="18" font-weight="700" fill="#EDEFF3">NSA</text>`
    + `<text x="${px + 168}" y="${py + 26}" font-size="12" fill="rgba(237,239,243,0.55)">+ FBI</text>`;
  const count = PRISM_PROVIDERS.filter((p) => p.accounts.some((id) => mine(state, id))).length;
  const aria = `Diagram: the nine companies named in the PRISM slides, from Microsoft in 2007 to Apple in 2012, feeding one beam to the NSA. You have accounts with ${count} of them.`;
  return `<svg class="prism-diagram" viewBox="0 0 600 ${h}" role="img" aria-label="${esc(aria)}" xmlns="http://www.w3.org/2000/svg">${beams.join('')}${nodes.join('')}${prism}${out}</svg>`;
}

function companies(state) {
  const acct = (id) => {
    const a = ACCOUNTS[id];
    if (!a) return '';
    const yours = mine(state, id);
    // Your account's building when it has one, else its district.
    const href = yours && hasInterior(id) ? `#/building/${esc(id)}` : `#/district/${esc(a.district)}`;
    return `<a class="acct${yours ? ' acct--mine' : ''}" href="${href}">${esc(a.name)}${yours ? ' · yours' : ''}</a>`;
  };
  const rows = PRISM_PROVIDERS.map((p) => `<li><span class="co">${esc(p.name)}</span><span class="yr">since ${p.since}</span>`
    + (p.accounts.length ? p.accounts.map(acct).join('') : '<span class="none">no account in this city</span>') + '</li>').join('');
  const next = `<li><span class="co">${esc(PRISM_PLANNED.name)}</span><span class="yr">next</span>${PRISM_PLANNED.accounts.map(acct).join('')}</li>`;
  return `<ul class="prism-companies">${rows}${next}</ul><p class="prism-key">${esc(PRISM_COPY.next)}</p>`;
}

// Every other account the player has: all of it over the tapped cables.
function cables(state) {
  const named = new Set([...PRISM_PROVIDERS.flatMap((p) => p.accounts), ...PRISM_PLANNED.accounts]);
  const theirs = Object.keys(ACCOUNTS).filter((id) => !named.has(id) && !NOT_AN_ACCOUNT.has(id) && mine(state, id));
  const list = theirs.length
    ? `<p>${theirs.map((id) => `<span class="acct acct--mine" style="display: inline-flex; margin: 2px 4px 2px 0; padding: 2px 8px; font-size: 12px; border: 1px dashed rgba(255,45,155,0.6); color: #FF2D9B; border-radius: 4px;">${esc(ACCOUNTS[id].name)}</span>`).join('')}</p>`
    : '';
  return `<div class="prism-panel"><div class="label">EVERYTHING ELSE: THE CABLES</div><p>${esc(PRISM_COPY.cables)}</p>${list}</div>`;
}

export function renderPrism(state) {
  const yours = PRISM_PROVIDERS.flatMap((p) => p.accounts).filter((id) => mine(state, id)).length;
  const sources = Object.values(PRISM_SOURCES).map(link).join('');
  return `${renderHud(state)}${STYLE}<div class="screen prism">`
    + '<a class="back-link" href="#/city">← THE CITY</a>'
    + `<h1>${esc(PRISM_COPY.title)}</h1><p class="prism-sub">${esc(PRISM_COPY.sub.toUpperCase())}</p>`
    + `<div style="margin-bottom: 10px;">${renderScout(esc(PRISM_COPY.scout), { feeling: 'thinkingA' })}</div>`
    + diagram(state)
    + `<p class="prism-key">${yours ? `Magenta ◂: a company you told the city you have ${yours === 1 ? 'an account' : 'accounts'} with.` : 'Tell the city which accounts you have (in Master Keys) and yours light up here.'}</p>`
    + `<div class="prism-panel"><div class="label">WHO WAS ON THE SLIDES</div>${companies(state)}</div>`
    + `<div class="prism-panel"><div class="label">WHAT IT WAS</div><p>${esc(PRISM_COPY.what)}</p><p>${link(PRISM_SOURCES.guardian)} · ${link(PRISM_SOURCES.wapo)}</p></div>`
    + `<div class="prism-panel"><div class="label">IT'S IN EVERYTHING</div><p>${esc(PRISM_COPY.everything)}</p><p>${esc(PRISM_COPY.you)}</p><p>${link(PRISM_SOURCES.xkeyscore)} · ${link(PRISM_SOURCES.eff702)} · ${link(PRISM_SOURCES.wikiUpstream)} · ${link(PRISM_SOURCES.collectAll)} · <a href="#/saints">Saint Mark Klein</a></p></div>`
    + cables(state)
    + `<div class="prism-panel"><div class="label">STILL RUNNING</div><p>${esc(PRISM_COPY.status)}</p><p>${link(PRISM_SOURCES.wiki702)} · ${link(PRISM_SOURCES.brennan702)} · ${link(PRISM_SOURCES.eff702)}</p></div>`
    + `<div class="prism-panel"><div class="label">WHAT YOU CAN DO</div><p>${esc(PRISM_COPY.defend)}</p><a class="prism-go" href="${esc(PRISM_SOURCES.prismBreak.url)}" target="_blank" rel="noopener">PRISM BREAK ↗</a></div>`
    + `<div class="prism-panel prism-saint"><div class="label">SAINT EDWARD SNOWDEN</div><p>${esc(PRISM_COPY.snowdenTribute)}</p>`
    + `<p>${link(PRISM_SOURCES.snowden)} · ${link(PRISM_SOURCES.wikiSnowden)} · ${link(PRISM_SOURCES.wikiCitizenfour)} · ${link(PRISM_SOURCES.nsaFiles)} · ${link(PRISM_SOURCES.slides)}</p>`
    + '<a class="prism-go" href="#/saints">LIGHT A CANDLE →</a></div>'
    + `<div class="prism-panel"><div class="label">SOURCES</div><div class="prism-sources">${sources}</div></div>`
    + '</div>';
}
