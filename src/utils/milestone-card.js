export function generateMilestoneCard(districtName, stats) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 315;
  const ctx = canvas.getContext('2d');
  const { accountsSecured = 0, breachesFixed = 0, integrityPercent = 0 } = stats || {};
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
  ctx.font = '700 20px Orbitron, sans-serif';
  ctx.fillText('RECLAIM CITY', 300, 62);

  ctx.fillStyle = '#FF2D9B';
  ctx.font = '600 11px Orbitron, sans-serif';
  ctx.fillText('DISTRICT LIBERATED', 300, 94);

  let nameSize = 32;
  ctx.fillStyle = '#EDEFF3';
  ctx.font = `700 ${nameSize}px Orbitron, sans-serif`;
  while (name && ctx.measureText(name).width > 520 && nameSize > 16) {
    nameSize -= 2;
    ctx.font = `700 ${nameSize}px Orbitron, sans-serif`;
  }
  ctx.fillText(name, 300, 152);

  ctx.fillStyle = '#00E5FF';
  ctx.font = '400 14px "JetBrains Mono", monospace';
  ctx.fillText(`${accountsSecured} accounts secured · ${breachesFixed} breaches fixed · ${integrityPercent}% integrity`, 300, 208);

  ctx.fillStyle = 'rgba(237,239,243,0.4)';
  ctx.font = '400 11px "JetBrains Mono", monospace';
  ctx.fillText('themultiverse.school/reclaim', 300, 282);

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
  ctx.font = '700 20px Orbitron, sans-serif';
  ctx.fillText('RECLAIM CITY', 300, 56);

  ctx.fillStyle = '#FF2D9B';
  ctx.font = '600 11px Orbitron, sans-serif';
  ctx.fillText(String(kicker).toUpperCase(), 300, 88);

  let size = 56;
  ctx.fillStyle = '#C6FF00';
  ctx.font = `800 ${size}px Orbitron, sans-serif`;
  while (ctx.measureText(String(big)).width > 520 && size > 24) {
    size -= 4;
    ctx.font = `800 ${size}px Orbitron, sans-serif`;
  }
  ctx.fillText(String(big), 300, 158);

  ctx.fillStyle = '#EDEFF3';
  ctx.font = '400 15px "JetBrains Mono", monospace';
  ctx.fillText(String(what), 300, 204, 540);
  if (sub) {
    ctx.fillStyle = 'rgba(237,239,243,0.6)';
    ctx.font = '400 12px "JetBrains Mono", monospace';
    ctx.fillText(String(sub), 300, 230, 540);
  }

  ctx.fillStyle = 'rgba(237,239,243,0.4)';
  ctx.font = '400 11px "JetBrains Mono", monospace';
  ctx.fillText('themultiverse.school/reclaim', 300, 282);

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
      return { ok: true, method: 'download' };
    }
  }
}
