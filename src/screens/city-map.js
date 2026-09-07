import { DISTRICTS } from '../data/districts.js';
import { MISSIONS } from '../data/missions.js';
import { calcDistrictProgress } from '../utils/calc.js';
import { renderHud } from '../components/hud.js';
import { renderScout } from '../components/scout.js';

const ROW_DEFS = [
  { top: 175, z: 4, gap: 1, shift: 0, clusters: [[[48, 0], [34, 1], [52, 0]], [[50, 0], [36, 1], [46, 0]]] },
  { top: 240, z: 6, gap: 0, shift: 35, clusters: [[[40, 1], [58, 0], [46, 0]], [[56, 0], [42, 1], [60, 0]]] },
  { top: 310, z: 8, gap: 0, shift: 0, clusters: [[[72, 0], [48, 1], [66, 0]], [[70, 0], [54, 1], [64, 0]]] },
  { top: 385, z: 10, gap: 0, shift: 30, clusters: [[[54, 1], [84, 0], [76, 0]], [[60, 1], [78, 0], [70, 0]]] },
];

const LABEL_POS = [
  { top: 262, left: 84 },
  { top: 246, right: 112 },
  { top: 322, left: 120 },
  { top: 306, right: 96 },
  { top: 392, left: 88 },
  { top: 376, right: 128 },
  { top: 448, left: 170 },
  { top: 470, right: 148 },
];

function nextAvailableMission(state) {
  return MISSIONS.find((m) => {
    const account = state.accounts[m.accountId];
    return Boolean(account && account.enabled) && state.missions[m.id]?.status !== 'completed';
  });
}

function buildingSpec(percent, tower, i) {
  if (percent === 0) {
    const bright = [0.32, 0.36, 0.4][i % 3];
    return {
      src: tower ? 'iso_tower_occ.png' : 'iso_occupied.png',
      filter: `brightness(${bright}) saturate(0.15)`,
    };
  }
  if (percent >= 100) {
    const size = [8, 10, 12][i % 3];
    const glow = tower ? 'rgba(198,255,0,0.35)' : 'rgba(0,229,255,0.4)';
    return {
      src: tower ? 'iso_tower_lib.png' : 'iso_liberated.png',
      filter: `brightness(${tower ? 1.15 : 1.1}) drop-shadow(0 0 ${size}px ${glow})`,
    };
  }
  const bright = [0.72, 0.78, 0.84][i % 3];
  return { src: 'iso_progress.png', filter: `brightness(${bright})` };
}

function renderRow(def, rowIndex, state) {
  const imgs = [];
  def.clusters.forEach((cluster, ci) => {
    const district = DISTRICTS[rowIndex * 2 + ci];
    const { percent } = calcDistrictProgress(state, district.id);
    cluster.forEach(([width, tower], i) => {
      const spec = buildingSpec(percent, tower === 1, i);
      imgs.push(`<img src="assets/${spec.src}" style="width: ${width}px; height: auto; filter: ${spec.filter};">`);
    });
  });
  return `
  <div style="position: absolute; top: ${def.top}px; left: 50%; transform: translateX(calc(-50% + ${def.shift}px)); z-index: ${def.z}; display: flex; gap: ${def.gap}px; align-items: flex-end;">
    ${imgs.join('\n    ')}
  </div>`;
}

function renderDistrictLabels(state, startHere) {
  return DISTRICTS.map((district, i) => {
    const { percent } = calcDistrictProgress(state, district.id);
    const isMaster = district.id === 'master-keys';
    const pos = LABEL_POS[i];
    const opacity = isMaster ? 1 : i % 2 === 0 ? 0.55 : 0.5;
    const name = isMaster ? 'MASTER KEYS' : district.name.toUpperCase();
    const nameStyle = isMaster
      ? 'font-family: var(--font-display); font-size: 9px; font-weight: 700; color: #00E5FF; text-shadow: 0 0 12px rgba(0,229,255,0.5); letter-spacing: 2px;'
      : 'font-family: var(--font-display); font-size: 8px; font-weight: 600; color: #00E5FF; text-shadow: 0 0 8px rgba(0,229,255,0.3); letter-spacing: 2px;';
    const percentColor = percent > 0 ? 'var(--lime)' : 'rgba(0,229,255,0.5)';
    const pulseClass = isMaster && startHere ? 'class="city-start-pulse"' : '';
    const startTag = isMaster && startHere
      ? '<div style="font-family: var(--font-mono); font-size: 8px; font-weight: 600; color: var(--cyan); letter-spacing: 1px; margin-top: 5px; text-shadow: 0 0 8px rgba(0,229,255,0.6);">▶ START HERE</div>'
      : '';
    const ready = isMaster ? '' : '<div style="font-family: var(--font-mono); font-size: 8px; color: rgba(0,229,255,0.5); margin-top: 2px;">READY</div>';
    const posStyle = Object.entries(pos).map(([k, v]) => `${k}: ${v}px`).join('; ');
    return `
    <a href="#/district/${district.id}" ${pulseClass} style="position: absolute; z-index: 12; text-decoration: none; opacity: ${opacity}; ${posStyle}">
      <div style="${nameStyle}">${name}</div>
      <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
        <div style="width: 60px; height: 3px; background: rgba(255,255,255,0.06); border: 1px solid rgba(0,229,255,0.15);">
          <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #00E5FF, #C6FF00);"></div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 600; color: ${percentColor};">${percent}%</div>
      </div>
      ${startTag}
      ${ready}
    </a>`;
  }).join('');
}

function renderCityScout(state) {
  const anyComplete = Object.values(state.missions).some((m) => m.status === 'completed');
  const next = nextAvailableMission(state);
  if (!anyComplete) {
    return renderScout(
      'The whole city is occupied, and every building here is holding your data. We start where everything connects: your email. Take back the <a href="#/district/master-keys" style="color: var(--cyan); font-weight: 600;">Master Keys</a> district first — everything else in the city builds on it.',
      next ? { actionText: 'NEXT MISSION', actionHref: `#/mission/${next.id}/briefing` } : {},
    );
  }
  if (next) {
    return renderScout(
      `Next mission: <span style="color: var(--cyan); font-weight: 600;">${next.title}</span>. Should take about ${next.estimatedMinutes} minutes.`,
      { actionText: 'NEXT MISSION', actionHref: `#/mission/${next.id}/briefing` },
    );
  }
  return renderScout(
    'Every mission on the board is complete. The city is yours again — go see what you reclaimed.',
    { actionText: 'VIEW STATS', actionHref: '#/stats' },
  );
}

export function renderCityMap(state) {
  const startHere = !Object.values(state.missions).some((m) => m.status === 'completed');
  const rows = ROW_DEFS.map((def, i) => renderRow(def, i, state)).join('');
  return `
<div class="scanlines" style="position: relative; width: 100%; height: 720px; overflow: hidden; background: linear-gradient(180deg, #050710 0%, #090B10 25%, #0d1018 60%, #121828 100%);">
  <style>
    .city-start-pulse {
      padding: 8px 10px;
      border: 1px solid rgba(0, 229, 255, 0.25);
      background: rgba(0, 229, 255, 0.04);
      animation: cityStartPulse 1.6s ease-in-out infinite;
    }
    @keyframes cityStartPulse {
      0%, 100% { border-color: rgba(0, 229, 255, 0.2); box-shadow: 0 0 4px rgba(0, 229, 255, 0.15); }
      50% { border-color: rgba(0, 229, 255, 0.85); box-shadow: 0 0 16px rgba(0, 229, 255, 0.5); }
    }
  </style>
  <div style="position: absolute; inset: 0; background-image: radial-gradient(1px 1px at 80px 25px, rgba(0,229,255,0.3), transparent), radial-gradient(1px 1px at 220px 55px, rgba(255,255,255,0.25), transparent), radial-gradient(1px 1px at 410px 15px, rgba(0,229,255,0.2), transparent), radial-gradient(1px 1px at 580px 40px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 750px 20px, rgba(198,255,0,0.2), transparent), radial-gradient(1px 1px at 890px 48px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 150px 70px, rgba(0,229,255,0.15), transparent), radial-gradient(1px 1px at 500px 8px, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 330px 62px, rgba(255,45,155,0.15), transparent), radial-gradient(1px 1px at 680px 32px, rgba(0,229,255,0.25), transparent); pointer-events: none;"></div>
  <div style="position: absolute; top: 90px; left: 50%; transform: translateX(-50%); z-index: 1; display: flex; gap: 2px; align-items: flex-end; opacity: 0.25; filter: brightness(0.25) saturate(0.05);">
    <img src="assets/iso_occupied.png" style="width: 34px; height: auto;">
    <img src="assets/iso_tower_occ.png" style="width: 20px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 30px; height: auto;">
    <img src="assets/iso_tower_occ.png" style="width: 24px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 36px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 28px; height: auto;">
    <img src="assets/iso_tower_occ.png" style="width: 22px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 32px; height: auto;">
    <img src="assets/iso_tower_occ.png" style="width: 18px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 34px; height: auto;">
  </div>
  <div style="position: absolute; top: 130px; left: 50%; transform: translateX(calc(-50% + 40px)); z-index: 2; display: flex; gap: 2px; align-items: flex-end; opacity: 0.35; filter: brightness(0.3) saturate(0.1);">
    <img src="assets/iso_tower_occ.png" style="width: 26px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 42px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 38px; height: auto;">
    <img src="assets/iso_tower_occ.png" style="width: 30px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 44px; height: auto;">
    <img src="assets/iso_tower_occ.png" style="width: 24px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 40px; height: auto;">
    <img src="assets/iso_occupied.png" style="width: 36px; height: auto;">
    <img src="assets/iso_tower_occ.png" style="width: 28px; height: auto;">
  </div>
  ${rows}
  <div style="position: absolute; top: 100px; left: 380px; z-index: 3; width: 5px; height: 5px; background: var(--magenta); border-radius: 50%; box-shadow: 0 0 6px var(--magenta), 0 0 12px rgba(255,45,155,0.3);"></div>
  <div style="position: absolute; top: 125px; right: 300px; z-index: 3; width: 4px; height: 4px; background: var(--magenta); border-radius: 50%; box-shadow: 0 0 5px var(--magenta);"></div>
  <div style="position: absolute; top: 175px; right: 210px; z-index: 5; width: 7px; height: 7px; background: var(--magenta); border-radius: 50%; box-shadow: 0 0 8px var(--magenta), 0 0 16px rgba(255,45,155,0.3);"></div>
  <div style="position: absolute; top: 248px; left: 310px; z-index: 7; width: 8px; height: 8px; background: var(--magenta); border-radius: 50%; box-shadow: 0 0 8px var(--magenta), 0 0 16px rgba(255,45,155,0.25);"></div>
  <div style="position: absolute; top: 430px; left: 240px; width: 120px; height: 50px; background: radial-gradient(ellipse, rgba(0,229,255,0.1) 0%, transparent 70%); z-index: 9; pointer-events: none;"></div>
  <div style="position: absolute; top: 440px; left: 460px; width: 100px; height: 40px; background: radial-gradient(ellipse, rgba(198,255,0,0.08) 0%, transparent 70%); z-index: 9; pointer-events: none;"></div>
  <div style="position: absolute; top: 360px; left: 350px; width: 80px; height: 35px; background: radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%); z-index: 7; pointer-events: none;"></div>
  ${renderDistrictLabels(state, startHere)}
  <div style="position: absolute; bottom: 95px; left: 0; right: 0; height: 80px; background: linear-gradient(180deg, transparent 0%, rgba(9,11,16,0.5) 60%, rgba(9,11,16,0.8) 100%); z-index: 11; pointer-events: none;"></div>
  <div style="position: absolute; top: 0; left: 0; right: 0; z-index: 30;">${renderHud(state)}</div>
  <a href="#/stats" style="position: absolute; top: 62px; right: 20px; z-index: 30; text-decoration: none; font-family: var(--font-display); font-size: 9px; font-weight: 700; letter-spacing: 2px; color: var(--cyan); border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.08); padding: 6px 14px; box-shadow: 0 0 10px rgba(0,229,255,0.1);">STATS</a>
  <div style="position: absolute; bottom: 0; left: 0; right: 0; z-index: 30;">${renderCityScout(state)}</div>
</div>`;
}
