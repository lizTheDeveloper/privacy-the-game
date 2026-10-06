import { renderHud } from '../components/hud.js';
import { ringChart, esc } from './stats.js';
import { podBoard, displayPodId, findPod, yourPart, fmt } from '../utils/collective.js';

const MUTED = 'font-size: 13px; color: rgba(237,239,243,0.6); line-height: 1.6;';
const LABEL = 'color: rgba(0,229,255,0.4); margin-bottom: 16px;';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const plural = (n, one, many) => (n === 1 ? one : many);

function shell(inner, state) {
  return `
<div class="scanlines">
  ${renderHud(state)}
  <div style="display: flex; align-items: center; gap: 16px; padding: 14px 24px; background: rgba(9,11,16,0.97); border-bottom: 1px solid rgba(0,229,255,0.15);">
    <a href="#/city" class="btn-secondary" style="display: inline-block; text-decoration: none;">← CITY</a>
    <div style="font-family: var(--font-display); font-size: 14px; font-weight: 700; color: #00E5FF; letter-spacing: 3px; text-shadow: 0 0 12px rgba(0,229,255,0.3);">THE WHOLE CITY</div>
  </div>
  <div style="padding: 20px 24px 32px;">
    <div style="${MUTED} margin-bottom: 20px;">Everyone playing Reclaim City, together. No one is ranked.</div>
    ${inner}
  </div>
</div>`;
}

function cityScore(city) {
  const f = city.fortified;
  if (!f || !isNum(f.pct)) {
    return `<div class="panel" style="padding: 24px; margin-bottom: 16px; text-align: center;"><div style="${MUTED}">Not enough players yet to say.</div></div>`;
  }
  return `
  <div class="panel" style="padding: 24px; margin-bottom: 16px; text-align: center; border-color: rgba(198,255,0,0.1);">
    ${ringChart({ fraction: f.pct / 100, color: '#C6FF00', glow: 'rgba(198,255,0,0.4)', track: 'rgba(198,255,0,0.08)', value: `${fmt(f.pct)}%`, unit: '' })}
    <div style="font-family: var(--font-display); font-size: 8px; font-weight: 600; color: rgba(198,255,0,0.5); letter-spacing: 2px;">CITY FORTIFIED</div>
    <div style="${MUTED} margin-top: 10px;">Of breached accounts found by everyone, this share has been fixed.</div>
  </div>`;
}

function yourPodCard(data, whoami) {
  const id = displayPodId(data, whoami?.data);
  const pod = findPod(data, id);
  if (!pod) {
    return `<div class="panel" style="padding: 16px 24px; margin-bottom: 16px;"><a href="#/stats" style="${MUTED} color: #00E5FF; text-decoration: none;">Open "What we know about you" on Your City to see your part of the city.</a></div>`;
  }
  const parts = [esc(pod.label)];
  if (isNum(pod.players)) parts.push(`${fmt(pod.players)} players`);
  if (isNum(pod.fortified?.pct)) parts.push(`${fmt(pod.fortified.pct)}% fortified`);
  const ghost = isNum(pod.ghosts) ? `<div style="${MUTED}">${fmt(pod.ghosts)} have gone ghost here</div>` : '';
  return `
  <div class="panel" style="padding: 16px 24px; margin-bottom: 16px; border-color: rgba(255,45,155,0.3);">
    <div class="section-label" style="color: rgba(255,45,155,0.5); margin-bottom: 8px;">YOUR PLACE</div>
    <div style="font-family: var(--font-mono); font-size: 14px; color: #FF2D9B;">${parts.join(' · ')}</div>
    ${ghost}
  </div>`;
}

function board(data, yoursId) {
  const rows = podBoard(data).map((p) => {
    const yours = p.id === yoursId;
    const pct = isNum(p.fortified?.pct) ? `${fmt(p.fortified.pct)}%` : '—';
    const players = isNum(p.players) ? `${fmt(p.players)} players` : '';
    return `
    <div ${yours ? 'data-yours="true"' : ''} style="display: flex; gap: 14px; align-items: center; padding: 8px 10px; ${yours ? 'border: 1px solid rgba(255,45,155,0.4); background: rgba(255,45,155,0.05);' : ''}">
      <div style="flex: 1; font-family: var(--font-display); font-size: 10px; letter-spacing: 1px; color: ${yours ? '#FF2D9B' : '#00E5FF'};">${esc(p.label)}</div>
      <div style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.4);">${players}</div>
      <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; width: 48px; text-align: right; color: #C6FF00;">${pct}</div>
    </div>`;
  }).join('');
  if (!rows) return '';
  return `
  <div class="panel" style="padding: 20px 24px; margin-bottom: 16px;">
    <div class="section-label" style="${LABEL}">PLACES</div>
    <div style="display: flex; flex-direction: column; gap: 6px;">${rows}</div>
  </div>`;
}

function breachMap(city) {
  const rows = (city.byAddress || []).filter((a) => isNum(a.breachRatePct)).map((a) => `
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="width: 140px; flex-shrink: 0; font-family: var(--font-display); font-size: 10px; letter-spacing: 1px; color: #FF2D9B;">${esc(a.label || a.id)}</div>
      <div style="flex: 1; height: 4px; background: rgba(255,45,155,0.08);"><div style="width: ${Math.min(100, Math.max(0, a.breachRatePct))}%; height: 100%; background: #FF2D9B; box-shadow: 0 0 6px rgba(255,45,155,0.3);"></div></div>
      <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; width: 44px; text-align: right; color: #FF2D9B;">${fmt(a.breachRatePct)}%</div>
    </div>`).join('');
  if (!rows) return '';
  return `
  <div class="panel" style="padding: 20px 24px; margin-bottom: 16px; border-color: rgba(255,45,155,0.1);">
    <div class="section-label" style="color: rgba(255,45,155,0.5); margin-bottom: 16px;">ADDRESSES FOUND IN A KNOWN BREACH</div>
    <div style="display: flex; flex-direction: column; gap: 14px;">${rows}</div>
  </div>`;
}

function yourPartPanel(state, podLabel) {
  const { found, fixed } = yourPart(state);
  let body;
  if (found === 0) {
    body = 'Run a breach check in The Master Keys to add yourself to the map.';
  } else {
    body = `You found ${found} breached ${plural(found, 'account', 'accounts')} and fixed ${fixed}.`;
    if (found > fixed) body += ` Fixing the rest moves ${esc(podLabel || 'the city')} too.`;
  }
  return `
  <div class="panel" style="padding: 20px 24px; margin-bottom: 16px; border-color: rgba(255,159,0,0.15);">
    <div class="section-label" style="color: rgba(255,159,0,0.5); margin-bottom: 12px;">YOUR PART</div>
    <div style="${MUTED}">${body}</div>
  </div>`;
}

function footer(data) {
  const city = data.city || {};
  const lines = [];
  const when = data.asOf ? new Date(data.asOf) : null;
  if (when && !Number.isNaN(when.getTime())) lines.push(`As of ${esc(when.toLocaleString())}.`);
  lines.push('“Players” are anonymous browser sessions. Places with fewer than 50 players are grouped into a bigger place.');
  const tail = [];
  if (isNum(city.ghosts)) tail.push(`${fmt(city.ghosts)} people have gone ghost`);
  if (isNum(city.optedOut)) tail.push(`${fmt(city.optedOut)} opted out`);
  if (tail.length) lines.push(`${tail.join(' · ')}.`);
  return `<div style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.35); line-height: 1.8;">${lines.map((l) => `<div>${l}</div>`).join('')}</div>`;
}

export function renderCityTogether(state, { collective, whoami } = {}) {
  const view = collective || { status: 'idle' };
  if (view.status === 'error') {
    return shell(`<div class="panel" style="padding: 24px;"><div style="${MUTED}">Couldn't reach the city tonight.</div></div>`, state);
  }
  if (view.status !== 'ready' || !view.data) {
    return shell(`<div class="panel" style="padding: 24px;"><div style="${MUTED}">Gathering the city…</div></div>`, state);
  }
  const data = view.data;
  const city = data.city || {};
  const yoursId = displayPodId(data, whoami?.data);
  const yoursPod = findPod(data, yoursId);
  return shell(`
    ${cityScore(city)}
    ${yourPodCard(data, whoami)}
    ${board(data, yoursId)}
    ${breachMap(city)}
    ${yourPartPanel(state, yoursPod?.label)}
    ${footer(data)}`, state);
}
