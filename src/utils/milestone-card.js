// The card's stats line. Breaches are what was found (email addresses only,
// Master Keys), never "fixed"; districts with no address checks leave it out.
// The address printed on every card: where the game is live (checked 2026-11-06).
export const CARD_URL = 'play.multiversegames.ai/reclaim-city/';

// The RECLAIM CITY wordmark is the only Orbitron on a card (it's the logo); every other word is
// IBM Plex Sans, as in the game. The words never depend on what the player's checks found.
// No word on a card is drawn under 21px: the milestone screen shows the 600px card about 322px
// wide on a 390px phone, so 21px reads at 11px or more there (the game's floor, 7.48.0).
const PLEX = '"IBM Plex Sans", sans-serif';
export const CARD_MIN_PX = 21;
const LOGO_FONT = '700 22px Orbitron, sans-serif';
const KICKER_FONT = `600 21px ${PLEX}`;
const MONO_FONT = '400 21px "JetBrains Mono", monospace';
const CARD_FONTS = [LOGO_FONT, KICKER_FONT, `700 32px ${PLEX}`, `800 56px ${PLEX}`];
const LINE = 27;

// Lines of at most `max` px, broken at the given separator (a long piece breaks at its spaces).
// The words are the card's own; only where the lines break moves.
function wrapLines(ctx, text, max, sep = ' ') {
  const lines = [];
  let line = '';
  for (const piece of String(text).split(sep)) {
    const next = line ? `${line}${sep}${piece}` : piece;
    if (!line || ctx.measureText(next).width <= max) { line = next; continue; }
    lines.push(line);
    line = piece;
  }
  if (line) lines.push(line);
  return sep === ' ' ? lines : lines.flatMap((l) => (ctx.measureText(l).width > max ? wrapLines(ctx, l, max) : [l]));
}

// A canvas draws in whatever face is loaded at that moment, and the card's Orbitron 700 is used
// nowhere else on the page, so the screens that share a card ask for its fonts as they open
// (app.js). Not awaited when sharing: a wait there could cost the tap its clipboard permission.
// Never throws.
export function loadCardFonts(fonts = globalThis.document?.fonts) {
  if (!fonts?.load) return Promise.resolve();
  return Promise.all(CARD_FONTS.map((f) => fonts.load(f).catch(() => null))).then(() => {}, () => {});
}

// One line under the share button saying what happened to the card.
export function shareStatusText(result) {
  if (!result?.ok) return 'Couldn’t make the card in this browser. Nothing was copied or saved.';
  if (result.method === 'clipboard') return 'Copied to your clipboard. Paste it anywhere.';
  if (result.method === 'share') return 'Sent to your share sheet.';
  if (result.method === 'download') return `Downloaded as ${result.filename || 'an image'}.`;
  return 'Done.';
}

export function milestoneCardLine({ accountsSecured = 0, addressesBreached = null, integrityPercent = 0 } = {}) {
  const parts = [`${accountsSecured} accounts secured`];
  if (Number.isFinite(addressesBreached)) {
    parts.push(`${addressesBreached} ${addressesBreached === 1 ? 'address' : 'addresses'} found in a breach`);
  }
  parts.push(`${integrityPercent}% integrity`);
  return parts.join(' · ');
}

export function generateMilestoneCard(districtName, stats) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 315;
  const ctx = canvas.getContext('2d');
  const name = String(districtName || '').toUpperCase();

  const gradient = ctx.createLinearGradient(0, 0, 0, 315);
  gradient.addColorStop(0, '#0c1220');
  gradient.addColorStop(0.55, '#090B10');
  gradient.addColorStop(1, '#0b101c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 315);

  ctx.strokeStyle = 'rgba(0,229,255,0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 10.5, 579, 294);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#00E5FF';
  ctx.font = LOGO_FONT;
  ctx.fillText('RECLAIM CITY', 300, 54);

  ctx.fillStyle = '#FF2D9B';
  ctx.font = KICKER_FONT;
  ctx.fillText('DISTRICT LIBERATED', 300, 86);

  let nameSize = 32;
  ctx.fillStyle = '#EDEFF3';
  ctx.font = `700 ${nameSize}px ${PLEX}`;
  while (name && ctx.measureText(name).width > 520 && nameSize > 24) {
    nameSize -= 2;
    ctx.font = `700 ${nameSize}px ${PLEX}`;
  }
  ctx.fillText(name, 300, 136, 540);

  // The stats line, broken at its dots onto up to three lines, centred between the name and the address.
  ctx.fillStyle = '#00E5FF';
  ctx.font = MONO_FONT;
  const lines = wrapLines(ctx, milestoneCardLine(stats || {}), 540, ' · ');
  const first = 212 - ((lines.length - 1) * LINE) / 2;
  lines.forEach((l, i) => ctx.fillText(l, 300, first + i * LINE, 540));

  ctx.fillStyle = 'rgba(237,239,243,0.4)';
  ctx.font = MONO_FONT;
  ctx.fillText(CARD_URL, 300, 288);

  return canvas;
}

// A figure from The Whole City on the same card: kicker, big number, one line.
export function generateStatCard({ kicker = '', big = '', what = '', sub = '' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 315;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 315);
  gradient.addColorStop(0, '#0c1220');
  gradient.addColorStop(0.55, '#090B10');
  gradient.addColorStop(1, '#0b101c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 315);

  ctx.strokeStyle = 'rgba(0,229,255,0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 10.5, 579, 294);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#00E5FF';
  ctx.font = LOGO_FONT;
  ctx.fillText('RECLAIM CITY', 300, 50);

  ctx.fillStyle = '#FF2D9B';
  ctx.font = KICKER_FONT;
  ctx.fillText(String(kicker).toUpperCase(), 300, 82, 540);

  let size = 56;
  ctx.fillStyle = '#C6FF00';
  ctx.font = `800 ${size}px ${PLEX}`;
  while (ctx.measureText(String(big)).width > 520 && size > 24) {
    size -= 4;
    ctx.font = `800 ${size}px ${PLEX}`;
  }
  ctx.fillText(String(big), 300, 140);

  // What it counts (and the sub-line), at most three lines between the figure and the address.
  ctx.font = MONO_FONT;
  const lines = [
    ...wrapLines(ctx, String(what), 540).map((t) => [t, '#EDEFF3']),
    ...(sub ? wrapLines(ctx, String(sub), 540).map((t) => [t, 'rgba(237,239,243,0.6)']) : []),
  ];
  const first = 214 - ((lines.length - 1) * LINE) / 2;
  lines.forEach(([t, colour], i) => { ctx.fillStyle = colour; ctx.fillText(t, 300, first + i * LINE, 540); });

  ctx.fillStyle = 'rgba(237,239,243,0.4)';
  ctx.font = MONO_FONT;
  ctx.fillText(CARD_URL, 300, 288);

  return canvas;
}

export async function shareStatCard(stat) {
  try {
    return await shareCanvas(generateStatCard(stat), 'reclaim-city-whole-city.png');
  } catch {
    return { ok: false };
  }
}

export async function shareMilestoneCard(districtName, stats) {
  try {
    return await shareCanvas(generateMilestoneCard(districtName, stats), 'reclaim-city-milestone.png');
  } catch {
    return { ok: false };
  }
}

async function shareCanvas(canvas, filename) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': Promise.resolve(blob) }),
      ]);
      return { ok: true, method: 'clipboard' };
    }
    throw new Error('clipboard unavailable');
  } catch {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: 'Reclaim City' });
        return { ok: true, method: 'share' };
      }
      throw new Error('share unavailable');
    } catch {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return { ok: true, method: 'download', filename };
    }
  }
}
