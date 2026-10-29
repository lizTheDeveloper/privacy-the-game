// A government satellite's card, in the star card's place and style (a bottom sheet on a phone).
// The agency is a buyer: there's nothing to opt out of. The card lists the brokers the public
// record shows it buying from, each with that record, and whether the player has cut the line.
import { satelliteBand, satelliteLines } from '../utils/satellites.js';
import { shortName } from '../utils/broker-view.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// index: the satellite's place in SATELLITES. layout: to find each broker's star (its list index).
export function satelliteCard(map, layout, lighting, index, { scoutLine = null } = {}) {
  const sat = satelliteBand()[index];
  if (!sat) return '';
  const agency = (Array.isArray(map?.brokers) ? map.brokers : []).find((b) => b.id === sat.id);
  const info = satelliteLines(map, lighting)[sat.id];
  const starIndex = new Map((Array.isArray(layout?.stars) ? layout.stars : []).map((s, i) => [s?.[0], i]));
  const noWay = info.total - info.cuttable;
  const tally = info.cuttable === 0
    ? `${info.total} ${info.total === 1 ? 'line' : 'lines'}, and no known way out of ${info.total === 1 ? 'it' : 'any'}`
    : `${info.cut} of ${info.cuttable} ${info.cuttable === 1 ? 'line' : 'lines'} cut${noWay ? ` · ${noWay} with no known way out` : ''}`;
  const rows = info.lines.map((l) => {
    const i = starIndex.get(l.broker.id);
    const name = esc(shortName(l.broker.name));
    const who = Number.isInteger(i) ? `<button type="button" class="satellite-broker" data-action="select-star" data-star="${i}">${name}</button>` : name;
    const state = l.cut ? '<span class="star-card-state">Line cut</span>' : l.way ? '<span>Still selling</span>' : '<span class="star-card-none">No known way out</span>';
    const src = l.link.sources?.[0];
    const href = src?.archived || src?.url;
    return `<li>${who} · ${state}<span class="star-card-claim">${esc(l.link.claim)}</span>`
      + (href ? `<a class="star-card-src" href="${esc(href)}" target="_blank" rel="noopener">Source</a>` : '') + '</li>';
  }).join('');
  const scout = scoutLine ? `<div class="star-card-scout"><p>${esc(scoutLine)}</p></div>` : '';
  return `<section class="star-card satellite-card" tabindex="-1" role="dialog" aria-modal="false" aria-labelledby="satellite-card-title">`
    + '<div class="star-card-grab" data-sheet-grab aria-hidden="true"><span></span></div>'
    + `<h2 id="satellite-card-title">${esc(sat.initials)}</h2>`
    + `<p class="star-card-full">${esc(agency?.name ?? sat.initials)}</p>`
    + `<p><strong>${esc(agency?.name ?? sat.initials)} is a buyer.</strong> You can't opt out of a buyer. You can opt out of the brokers it buys from.</p>`
    + scout
    + `<p class="star-card-state">${esc(tally)}</p>`
    + `<div class="label">IT BUYS FROM</div><ul class="star-card-list">${rows}</ul>`
    + '<button type="button" class="star-card-close" data-action="close-sat">CLOSE</button>'
    + '</section>';
}

export const SATELLITE_CARD_CSS = '.satellite-broker{min-height:44px;padding:0;font:inherit;font-weight:700;color:var(--cyan);background:none;border:0;text-decoration:underline;cursor:pointer}';

