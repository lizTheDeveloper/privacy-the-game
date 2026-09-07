import { renderHud } from '../components/hud.js';
import { DISTRICTS } from '../data/districts.js';
import {
  calcIntegrity,
  calcExposure,
  calcDistrictProgress,
  calcFindings,
} from '../utils/calc.js';

const RING_SIZE = 120;
const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ringChart({ fraction, color, glow, track, value, unit }) {
  const clamped = Math.min(1, Math.max(0, fraction));
  const offset = RING_CIRCUMFERENCE * (1 - clamped);
  return `
  <div style="position: relative; width: ${RING_SIZE}px; height: ${RING_SIZE}px; margin: 0 auto 14px;">
    <svg width="${RING_SIZE}" height="${RING_SIZE}" viewBox="0 0 ${RING_SIZE} ${RING_SIZE}" style="transform: rotate(-90deg);">
      <circle cx="60" cy="60" r="${RING_RADIUS}" fill="none" stroke="${track}" stroke-width="8"/>
      <circle cx="60" cy="60" r="${RING_RADIUS}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${RING_CIRCUMFERENCE}" stroke-dashoffset="${offset}" style="filter: drop-shadow(0 0 6px ${glow});"/>
    </svg>
    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
      <div style="font-family: var(--font-mono); font-size: 26px; font-weight: 700; color: ${color}; text-shadow: 0 0 10px ${glow};">${value}${unit ? `<span style="font-size: 13px; color: rgba(237,239,243,0.35);">${unit}</span>` : ''}</div>
    </div>
  </div>`;
}

function statCard({ label, labelColor, border, content }) {
  return `
  <div class="panel" style="flex: 1 1 240px; padding: 24px; text-align: center; border-color: ${border};">
    ${content}
    <div style="font-family: var(--font-display); font-size: 8px; font-weight: 600; color: ${labelColor}; letter-spacing: 2px;">${label}</div>
  </div>`;
}

function districtRow(state, district) {
  const progress = calcDistrictProgress(state, district.id);
  const locked = progress.total === 0;
  const accent = progress.percent === 100 ? '#C6FF00' : progress.percent > 0 ? '#00E5FF' : 'rgba(237,239,243,0.5)';
  const nameColor = locked ? 'rgba(237,239,243,0.3)' : accent;
  const bar = locked
    ? `<div style="flex: 1; display: flex; align-items: center; height: 4px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 1px; color: rgba(237,239,243,0.2);">LOCKED CONTENT</div>`
    : `<div style="flex: 1; height: 4px; background: rgba(0,229,255,0.06);"><div style="width: ${progress.percent}%; height: 100%; background: linear-gradient(90deg, #00E5FF, #C6FF00); box-shadow: 0 0 6px rgba(0,229,255,0.2);"></div></div>`;
  return `
  <a href="#/district/${district.id}" style="display: flex; align-items: center; gap: 14px; text-decoration: none; color: inherit;">
    <div style="width: 160px; flex-shrink: 0;">
      <div style="font-family: var(--font-display); font-size: 10px; font-weight: 600; letter-spacing: 1px; color: ${nameColor};">${district.name.toUpperCase()}</div>
      <div style="font-family: var(--font-mono); font-size: 8px; letter-spacing: 1px; color: rgba(237,239,243,0.25); margin-top: 3px;">CH ${district.chapter}</div>
    </div>
    ${bar}
    <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; width: 44px; text-align: right; color: ${locked ? 'rgba(237,239,243,0.2)' : accent};">${locked ? '' : `${progress.percent}%`}</div>
  </a>`;
}

function findingCard({ label, value, color, tint }) {
  return `
  <div class="panel" style="flex: 1 1 160px; text-align: center; padding: 16px 12px; border-color: ${tint};">
    <div style="font-family: var(--font-mono); font-size: 28px; font-weight: 700; color: ${color}; text-shadow: 0 0 8px ${tint};">${value}</div>
    <div style="font-family: var(--font-display); font-size: 8px; font-weight: 600; letter-spacing: 2px; color: rgba(237,239,243,0.4); margin-top: 6px;">${label}</div>
  </div>`;
}

export function renderStats(state) {
  const integrity = calcIntegrity(state);
  const exposure = calcExposure(state);
  const findings = calcFindings(state);

  return `
<div class="scanlines">
  ${renderHud(state)}
  <div style="display: flex; align-items: center; gap: 16px; padding: 14px 24px; background: rgba(9,11,16,0.97); border-bottom: 1px solid rgba(0,229,255,0.15);">
    <a href="#/city" class="btn-secondary" style="display: inline-block; text-decoration: none;">← CITY</a>
    <div style="font-family: var(--font-display); font-size: 14px; font-weight: 700; color: #00E5FF; letter-spacing: 3px; text-shadow: 0 0 12px rgba(0,229,255,0.3);">YOUR CITY</div>
    <div style="flex: 1;"></div>
  </div>
  <div style="padding: 20px 24px 32px;">
    <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
      ${statCard({
        label: 'INTEGRITY',
        labelColor: 'rgba(198,255,0,0.5)',
        border: 'rgba(198,255,0,0.1)',
        content: ringChart({
          fraction: integrity / 100,
          color: '#C6FF00',
          glow: 'rgba(198,255,0,0.4)',
          track: 'rgba(198,255,0,0.08)',
          value: integrity,
          unit: '%',
        }),
      })}
      ${statCard({
        label: 'EXPOSURE',
        labelColor: 'rgba(255,45,155,0.5)',
        border: 'rgba(255,45,155,0.1)',
        content: ringChart({
          fraction: exposure / 1000,
          color: '#FF2D9B',
          glow: 'rgba(255,45,155,0.4)',
          track: 'rgba(255,45,155,0.08)',
          value: exposure,
          unit: '',
        }),
      })}
      ${statCard({
        label: 'STREAK',
        labelColor: 'rgba(255,159,0,0.5)',
        border: 'rgba(255,159,0,0.1)',
        content: `
        <div style="height: ${RING_SIZE}px; margin: 0 auto 14px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-family: var(--font-mono); font-size: 40px; font-weight: 700; color: #FF9F00; line-height: 1; text-shadow: 0 0 15px rgba(255,159,0,0.3);">${state.streak.current}d</div>
          <div style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.35); margin-top: 6px; letter-spacing: 1px;">BEST ${state.streak.best}d</div>
        </div>`,
      })}
    </div>
    <div class="panel" style="padding: 20px 24px; margin-bottom: 16px;">
      <div class="section-label" style="color: rgba(0,229,255,0.4); margin-bottom: 16px;">DISTRICT PROGRESS</div>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${DISTRICTS.map((d) => districtRow(state, d)).join('')}
      </div>
    </div>
    <div class="panel" style="padding: 20px 24px;">
      <div class="section-label" style="color: rgba(0,229,255,0.4); margin-bottom: 16px;">FINDINGS LOG</div>
      <div style="display: flex; flex-wrap: wrap; gap: 16px;">
        ${findingCard({ label: 'BREACHES FOUND', value: findings.breachesFound, color: '#FF2D9B', tint: 'rgba(255,45,155,0.1)' })}
        ${findingCard({ label: 'PASSWORDS RESET', value: findings.passwordsReset, color: '#00E5FF', tint: 'rgba(0,229,255,0.1)' })}
        ${findingCard({ label: '2FA ENABLED', value: findings.twoFactorEnabled, color: '#C6FF00', tint: 'rgba(198,255,0,0.1)' })}
        ${findingCard({ label: 'OPT-OUTS FILED', value: findings.optOutsFiled, color: '#FF9F00', tint: 'rgba(255,159,0,0.1)' })}
      </div>
    </div>
  </div>
</div>`;
}
