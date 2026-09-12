import { DISTRICTS } from '../data/districts.js';
import { MISSIONS } from '../data/missions.js';
import { calcDistrictProgress } from '../utils/calc.js';
import { renderHud } from '../components/hud.js';
import { renderScout } from '../components/scout.js';
import { DISTRICT_DIALOGUE, pick } from '../data/dialogue.js';

// ---------------------------------------------------------------------------
// Isometric grid. Classic 2:1 diamond tiles: a tile at (col, row) sits at
//   x = (col - row) * TW / 2,   y = (col + row) * TH / 2
// measured from the origin tile's centre. Depth (col + row) grows toward the
// camera, so it doubles as the draw order.
// ---------------------------------------------------------------------------
const TW = 80; // tile footprint width at depth-scale 1 (the 96px sprite drawn at 80px)
const TH = 40;
const BLOCK_PITCH = 3; // each city block is 2x2 building tiles + a 1-tile street
const ORIGIN_TOP = 232; // screen y of tile (0,0)'s centre; x is the map's horizontal centre
const BUILDING_W = TW; // 96x96 sprite -> 80x80
const TOWER_W = 54; // 64x128 sprite -> 54x108

function isoPoint(col, row) {
  return { x: ((col - row) * TW) / 2, y: ((col + row) * TH) / 2 };
}

// Screen centre of a block's 2x2 lot (the point between its four tiles).
function blockCentre(bc, br) {
  return isoPoint(bc * BLOCK_PITCH + 0.5, br * BLOCK_PITCH + 0.5);
}

// The eight districts occupy the ring of a 3x3 block grid; the middle block is
// the central plaza. Master Keys (chapter 1) is the front block, closest to the
// camera; the Reclamation endgame is the far block at the back.
// tiles: [tileCol, tileRow, isTower, sizeFactor] inside the 2x2 lot.
// label: which edge column the district's tactical label lives in.
const BLOCK_DEFS = [
  { district: 'master-keys', at: [2, 2], tiles: [[0, 0, 1], [1, 0, 0], [0, 1, 0, 0.96]], label: { side: 'right', top: 464 } },
  { district: 'vault', at: [1, 2], tiles: [[1, 0, 1], [0, 1, 0, 0.94], [1, 1, 0]], label: { side: 'left', top: 468 } },
  { district: 'square', at: [2, 1], tiles: [[0, 0, 0, 0.94], [0, 1, 1], [1, 1, 0]], label: { side: 'right', top: 360 } },
  { district: 'archives', at: [0, 2], tiles: [[0, 0, 0], [1, 0, 1], [1, 1, 0, 0.94]], label: { side: 'left', top: 364 } },
  { district: 'marketplace', at: [2, 0], tiles: [[0, 0, 1], [0, 1, 0, 0.94], [1, 1, 0]], label: { side: 'right', top: 256 } },
  { district: 'capitol', at: [0, 1], tiles: [[1, 0, 0], [0, 1, 0, 0.94], [1, 1, 1]], label: { side: 'left', top: 260 } },
  { district: 'perimeter', at: [1, 0], tiles: [[0, 0, 0, 0.94], [1, 0, 1], [0, 1, 0]], label: { side: 'right', top: 152 } },
  { district: 'reclamation', at: [0, 0], tiles: [[0, 0, 1], [1, 0, 0], [0, 1, 0, 0.94]], label: { side: 'left', top: 156 } },
];

// Silhouette blocks behind and beside the districts so the city keeps going
// past the lit neighbourhoods. Same grid, same tiles, just dim and unclickable.
const BACKDROP_DEFS = [
  { at: [-2, -1], tier: 'far', tiles: [[0, 0, 0], [1, 0, 1], [0, 1, 0], [1, 1, 0]] },
  { at: [-1, -2], tier: 'far', tiles: [[0, 0, 1], [1, 0, 0], [1, 1, 0]] },
  { at: [-1, -1], tier: 'far', tiles: [[0, 0, 0], [1, 0, 0], [0, 1, 1], [1, 1, 0]] },
  { at: [0, -1], tier: 'mid', tiles: [[0, 0, 1], [1, 0, 0], [0, 1, 0], [1, 1, 1]] },
  { at: [-1, 0], tier: 'mid', tiles: [[0, 0, 0], [1, 0, 1], [0, 1, 0], [1, 1, 0]] },
  { at: [1, -1], tier: 'mid', tiles: [[0, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { at: [-1, 1], tier: 'mid', tiles: [[0, 0, 1], [0, 1, 0], [1, 1, 0]] },
  { at: [2, -1], tier: 'mid', tiles: [[0, 0, 0], [0, 1, 1], [1, 1, 0]] },
  { at: [-1, 2], tier: 'mid', tiles: [[0, 0, 0], [1, 0, 1], [1, 1, 0]] },
];

// Vertical data packets that fall through the skyline. [left%, duration s, delay s, color, z]
const STREAMS = [
  [9, 7.5, 0, 'cyan', 1],
  [21, 11, -4, 'cyan', 1],
  [37, 9, -7, 'lime', 1],
  [58, 12.5, -2, 'cyan', 1],
  [74, 8, -5.5, 'magenta', 1],
  [88, 10, -1, 'cyan', 1],
  [46, 14, -9, 'cyan', 11],
  [66, 13, -3, 'cyan', 11],
];

const PHASE_ORDER = ['recon', 'fortify', 'reclaim'];

function nextAvailableMission(state) {
  for (const phase of PHASE_ORDER) {
    const mission = MISSIONS.find((m) => {
      const account = state.accounts[m.accountId];
      return m.phase === phase && Boolean(account && account.enabled) && state.missions[m.id]?.status !== 'completed';
    });
    if (mission) return mission;
  }
  return null;
}

function districtStatus(percent) {
  if (percent >= 100) return 'secured';
  if (percent > 0) return 'contested';
  return 'occupied';
}

// `tower` in the result says which sprite shape is actually drawn: the
// half-reclaimed sprite is a square building even on a tower tile.
function buildingSpec(percent, tower, i) {
  if (percent === 0) {
    const bright = [0.32, 0.36, 0.4][i % 3];
    return {
      src: tower ? 'iso_tower_occ.png' : 'iso_occupied.png',
      filter: `brightness(${bright}) saturate(0.15)`,
      tower,
    };
  }
  if (percent >= 100) {
    const size = [8, 10, 12][i % 3];
    const glow = tower ? 'rgba(198,255,0,0.35)' : 'rgba(0,229,255,0.4)';
    return {
      src: tower ? 'iso_tower_lib.png' : 'iso_liberated.png',
      filter: `brightness(${tower ? 1.15 : 1.1}) drop-shadow(0 0 ${size}px ${glow})`,
      tower,
    };
  }
  const bright = [0.72, 0.78, 0.84][i % 3];
  return { src: 'iso_progress.png', filter: `brightness(${bright})`, tower: false };
}

// Where a building sits inside its block's 2x2 lot box (box = 2TW x 2TH, the
// lot's ground diamond). Sprites are anchored by the bottom tip of their
// footprint diamond, which is the bottom-centre of the image. `tower` is the
// sprite shape being drawn (2:1 tower or square building).
function placeInLot([tc, tr, , size = 1], tower) {
  const { x: dx, y: dy } = isoPoint(tc - 0.5, tr - 0.5);
  const w = (tower ? TOWER_W : BUILDING_W) * size;
  const h = tower ? w * 2 : w;
  const cx = TW + dx; // tile centre inside the box
  const groundY = TH + dy + TH / 2; // bottom tip of the tile diamond
  return { tower: Boolean(tower), w, h, cx, left: cx - w / 2, bottom: 2 * TH - groundY, top: groundY - h, z: tc + tr + 1 };
}

// Absolute-position style for a block's lot box, plus its depth scale/z.
function lotStyle(bc, br) {
  const { x, y } = blockCentre(bc, br);
  const depth = bc + br;
  const scale = 1 + depth * 0.06 - 0.12; // 0.88 at the back, 1.12 at the front
  return {
    depth,
    scale,
    style: `left: ${x - TW}px; top: ${y - TH}px; width: ${2 * TW}px; height: ${2 * TH}px; --s: ${scale.toFixed(2)}; z-index: ${20 + depth * 2};`,
  };
}

function renderCluster(def, district, percent, index) {
  const status = districtStatus(percent);
  const [bc, br] = def.at;
  const lot = lotStyle(bc, br);
  const specs = def.tiles.map((tile, i) => buildingSpec(percent, tile[2] === 1, i));
  const placed = def.tiles.map((tile, i) => placeInLot(tile, specs[i].tower));
  const imgs = placed.map((p, i) => (
    `<img src="assets/${specs[i].src}" alt="" style="left: ${p.left.toFixed(1)}px; bottom: ${p.bottom}px; width: ${p.w.toFixed(1)}px; z-index: ${p.z}; filter: ${specs[i].filter};">`
  ));
  // Beacon on the block's tower tile, tooltip above the tallest roof.
  const towerIdx = Math.max(0, def.tiles.findIndex((tile) => tile[2] === 1));
  const towerP = placed[towerIdx];
  const peak = Math.min(...placed.map((p) => p.top));
  const beaconDelay = (index * 0.55).toFixed(2);
  return `
    <a class="city-cluster is-${status}" href="#/district/${district.id}" data-name="${district.name.toUpperCase()}"
       style="${lot.style} --peak: ${(2 * TH - peak + 8).toFixed(0)}px;">
      <span class="city-lot"></span>
      <span class="city-beacon" style="left: ${towerP.cx.toFixed(1)}px; top: ${(towerP.top + 3).toFixed(1)}px; animation-delay: ${beaconDelay}s;"></span>
      ${imgs.join('\n      ')}
    </a>`;
}

function renderDistrictBlocks(state) {
  return BLOCK_DEFS.map((def, i) => {
    const district = DISTRICTS.find((d) => d.id === def.district);
    const { percent } = calcDistrictProgress(state, district.id);
    return renderCluster(def, district, percent, i);
  }).join('');
}

function renderBackdropBlocks() {
  return BACKDROP_DEFS.map((def) => {
    const [bc, br] = def.at;
    const lot = lotStyle(bc, br);
    const imgs = def.tiles.map((tile) => placeInLot(tile, tile[2] === 1)).map((p) => (
      `<img src="assets/${p.tower ? 'iso_tower_occ.png' : 'iso_occupied.png'}" alt="" style="left: ${p.left.toFixed(1)}px; bottom: ${p.bottom}px; width: ${p.w.toFixed(1)}px; z-index: ${p.z};">`
    ));
    return `
    <div class="city-block city-block--${def.tier}" style="${lot.style}">
      ${imgs.join('\n      ')}
    </div>`;
  }).join('');
}

// The empty centre block: a lit plaza the whole city is arranged around.
function renderPlaza() {
  const lot = lotStyle(1, 1);
  const { x, y } = blockCentre(1, 1);
  return `
    <div class="city-plaza" style="${lot.style}"><span class="city-plaza__core"></span></div>
    <span class="city-spark" style="left: ${x - 4}px; top: ${y - 30}px; width: 5px; height: 5px; animation-delay: 0.3s;"></span>
    <span class="city-spark" style="left: ${x + 46}px; top: ${y + 2}px; width: 4px; height: 4px; animation-delay: 1.1s;"></span>
    <span class="city-spark" style="left: ${x - 54}px; top: ${y + 6}px; width: 3px; height: 3px; animation-delay: 2.2s;"></span>`;
}

// Iso tile grid on the ground plane, aligned to the tile lattice (tile (0,0)'s
// diamond spans x -40..40, y -20..20, so the pattern's top-left sits on a
// multiple of the tile size away from (-40, -20)).
const GROUND_LEFT = -TW / 2 - TW * 8;
const GROUND_TOP = -TH / 2 - TH * 7;
const GROUND_W = TW * 17;
const GROUND_H = TH * 19;

function renderDistrictLabels(state, startHere) {
  return BLOCK_DEFS.map((def) => {
    const district = DISTRICTS.find((d) => d.id === def.district);
    const { percent, completed, total } = calcDistrictProgress(state, district.id);
    const status = districtStatus(percent);
    const isMaster = district.id === 'master-keys';
    const { side, top } = def.label;
    const posStyle = `top: ${top}px; ${side}: 28px`;
    const classes = ['city-label', `is-${status}`, `city-label--${side}`];
    if (isMaster) classes.push('city-label--master');
    if (isMaster && startHere) classes.push('city-start-pulse');
    const name = isMaster ? 'MASTER KEYS' : district.name.replace(/^The /i, '').toUpperCase();
    const code = `D-0${district.chapter}`;
    const statusWord = { occupied: 'OCCUPIED', contested: 'CONTESTED', secured: 'SECURED' }[status];
    const startTag = isMaster && startHere
      ? '<div class="city-label__start">▶ START HERE</div>'
      : '';
    const cells = Array.from({ length: 10 }, (_, c) => {
      const lit = percent >= (c + 1) * 10 - 5;
      return `<i class="${lit ? 'lit' : ''}"></i>`;
    }).join('');
    return `
    <a href="#/district/${district.id}" class="${classes.join(' ')}" style="${posStyle}">
      <span class="city-label__tick"></span>
      <div class="city-label__head">
        <span class="city-label__code">${code}</span>
        <span class="city-label__status">${statusWord}</span>
      </div>
      <div class="city-label__name">${name}</div>
      <div class="city-label__meter">
        <div class="city-label__bar">${cells}</div>
        <span class="city-label__pct">${percent}%</span>
      </div>
      <div class="city-label__sub">${total ? `${completed}/${total} MISSIONS` : 'SURVEY TO UNLOCK'}</div>
      ${startTag}
    </a>`;
  }).join('');
}

function getReturnLine(state) {
  const lastVisit = state.lastCityVisit;
  if (!lastVisit) return null;
  const elapsed = Date.now() - new Date(lastVisit).getTime();
  const hours = elapsed / (1000 * 60 * 60);
  if (hours < 24) return null;

  const dialogue = DISTRICT_DIALOGUE['master-keys'];
  if (!dialogue?.return) return null;

  if (hours >= 168) return dialogue.return.veryLong;
  if (hours >= 96) return dialogue.return.long;
  if (hours >= 24) return dialogue.return.medium;
  return null;
}

function renderCityScout(state) {
  const anyComplete = Object.values(state.missions).some((m) => m.status === 'completed');
  const next = nextAvailableMission(state);

  const returnLine = getReturnLine(state);
  if (returnLine && anyComplete) {
    return renderScout(
      returnLine,
      next ? { actionText: 'NEXT MISSION', actionHref: `#/mission/${next.id}/briefing` } : { actionText: 'VIEW STATS', actionHref: '#/stats' },
    );
  }

  if (!anyComplete) {
    return renderScout(
      'The whole city is occupied, and every building here is holding your data. We start where everything connects: your email. Take back the <a href="#/district/master-keys" style="color: var(--cyan); font-weight: 600;">Master Keys</a> district first — everything else in the city builds on it.',
      next ? { actionText: 'NEXT MISSION', actionHref: `#/mission/${next.id}/briefing` } : {},
    );
  }
  if (next) {
    return renderScout(
      `Ready for the next one? <span style="color: var(--cyan); font-weight: 600;">${next.title}</span> — about ${next.estimatedMinutes} minutes.`,
      { actionText: 'NEXT MISSION', actionHref: `#/mission/${next.id}/briefing` },
    );
  }
  return renderScout(
    'Every mission complete. The city is yours again. Go see what you built.',
    { actionText: 'VIEW STATS', actionHref: '#/stats' },
  );
}

function renderAllOffline() {
  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <div class="panel" style="max-width: 480px; margin: 48px 24px; padding: 48px 32px; text-align: center;">
      <div style="font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,229,255,0.4);">ALL ACCOUNTS OFFLINE</div>
      <div style="font-size: 13px; line-height: 1.6; color: rgba(237,239,243,0.55); margin-top: 14px;">Enable some accounts in Survey to get started.</div>
      <div style="margin-top: 28px;">
        <a class="btn-primary" style="text-decoration: none;" href="#/district/master-keys?tab=survey">OPEN SURVEY</a>
      </div>
    </div>
  </div>`;
}

function renderStreams() {
  return STREAMS.map(([left, dur, delay, color, z]) => (
    `<span class="city-stream city-stream--${color}" style="left: ${left}%; animation-duration: ${dur}s; animation-delay: ${delay}s; z-index: ${z};"></span>`
  )).join('');
}

const CIRCUIT_SVG = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none" stroke="#00E5FF" stroke-width="1">'
  + '<path d="M0 40h48l16-16h36M100 24v40h40M20 120h40v-30h30M90 90h50l20 20M60 160v-24h60M140 64v40"/>'
  + '<g fill="#00E5FF" stroke="none"><circle cx="48" cy="40" r="2"/><circle cx="100" cy="24" r="2"/><circle cx="140" cy="64" r="2"/>'
  + '<circle cx="60" cy="90" r="2"/><circle cx="90" cy="90" r="2"/><circle cx="20" cy="120" r="2"/><circle cx="120" cy="136" r="2"/></g></svg>',
);

// One iso tile outline; tiled, it draws the ground lattice the buildings sit on.
const TILE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}" fill="none" stroke="#00E5FF" stroke-width="1">`
  + `<path d="M${TW / 2} 0.5L${TW - 0.5} ${TH / 2}L${TW / 2} ${TH - 0.5}L0.5 ${TH / 2}Z"/></svg>`,
);

const STYLE = `
  <style>
    .city-map {
      position: relative; width: 100%; height: 720px; overflow: hidden; isolation: isolate;
      background: linear-gradient(180deg, #03050b 0%, #070912 22%, #0b0f1a 55%, #101626 100%);
    }
    .city-map, .city-map * { box-sizing: border-box; }

    /* ---------- atmosphere ---------- */
    .city-stars { position: absolute; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        radial-gradient(1px 1px at 80px 25px, rgba(0,229,255,0.35), transparent),
        radial-gradient(1px 1px at 220px 55px, rgba(255,255,255,0.25), transparent),
        radial-gradient(1px 1px at 410px 15px, rgba(0,229,255,0.2), transparent),
        radial-gradient(1px 1px at 580px 40px, rgba(255,255,255,0.2), transparent),
        radial-gradient(1px 1px at 750px 20px, rgba(198,255,0,0.25), transparent),
        radial-gradient(1px 1px at 890px 48px, rgba(255,255,255,0.2), transparent),
        radial-gradient(1px 1px at 150px 70px, rgba(0,229,255,0.15), transparent),
        radial-gradient(1px 1px at 500px 8px, rgba(255,255,255,0.3), transparent),
        radial-gradient(1px 1px at 330px 62px, rgba(255,45,155,0.2), transparent),
        radial-gradient(1px 1px at 680px 32px, rgba(0,229,255,0.25), transparent),
        radial-gradient(1px 1px at 40px 110px, rgba(255,255,255,0.15), transparent),
        radial-gradient(1px 1px at 920px 96px, rgba(0,229,255,0.2), transparent);
    }
    .city-circuit { position: absolute; inset: 0 0 auto 0; height: 300px; pointer-events: none; z-index: 0; opacity: 0.08;
      background-image: url("data:image/svg+xml,${CIRCUIT_SVG}"); background-size: 160px 160px;
      -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 30%, #000 70%, rgba(0,0,0,0) 100%);
      mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 30%, #000 70%, rgba(0,0,0,0) 100%);
    }
    .city-haze { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
    .city-horizon { position: absolute; left: 0; right: 0; top: ${ORIGIN_TOP - 62}px; height: 1px; pointer-events: none; z-index: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.45) 30%, rgba(0,229,255,0.6) 50%, rgba(0,229,255,0.45) 70%, transparent 100%);
      box-shadow: 0 0 18px rgba(0,229,255,0.35), 0 0 40px rgba(0,229,255,0.15);
    }
    .city-floor { position: absolute; left: -40%; right: -40%; top: ${ORIGIN_TOP - 40}px; bottom: 0; pointer-events: none; z-index: 0; opacity: 0.55;
      perspective: 340px; perspective-origin: 50% 0; overflow: hidden;
      -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 22%, #000 75%, rgba(0,0,0,0) 100%);
      mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 22%, #000 75%, rgba(0,0,0,0) 100%);
    }
    .city-floor::before { content: ''; position: absolute; left: 0; right: 0; top: -120%; bottom: -40%;
      background:
        repeating-linear-gradient(90deg, rgba(0,229,255,0.16) 0 1px, transparent 1px 64px),
        repeating-linear-gradient(0deg, rgba(0,229,255,0.16) 0 1px, transparent 1px 48px);
      transform-origin: 50% 100%;
      animation: cityFloor 4s linear infinite;
    }
    @keyframes cityFloor {
      from { transform: rotateX(72deg) translateY(0); }
      to   { transform: rotateX(72deg) translateY(48px); }
    }
    .city-stream { position: absolute; top: -140px; width: 1px; height: 120px; pointer-events: none; opacity: 0.7;
      animation-name: cityStream; animation-timing-function: linear; animation-iteration-count: infinite; }
    .city-stream--cyan { background: linear-gradient(180deg, transparent, rgba(0,229,255,0.5) 60%, #00E5FF); box-shadow: 0 0 6px rgba(0,229,255,0.5); }
    .city-stream--lime { background: linear-gradient(180deg, transparent, rgba(198,255,0,0.4) 60%, #C6FF00); box-shadow: 0 0 6px rgba(198,255,0,0.4); }
    .city-stream--magenta { background: linear-gradient(180deg, transparent, rgba(255,45,155,0.4) 60%, #FF2D9B); box-shadow: 0 0 6px rgba(255,45,155,0.4); }
    @keyframes cityStream { from { transform: translateY(0); } to { transform: translateY(880px); } }
    .city-scan { position: absolute; left: 0; right: 0; top: -140px; height: 140px; pointer-events: none; z-index: 13;
      background: linear-gradient(180deg, transparent 0%, rgba(0,229,255,0.03) 60%, rgba(0,229,255,0.10) 100%);
      border-bottom: 1px solid rgba(0,229,255,0.28);
      animation: cityScan 9s linear infinite;
    }
    @keyframes cityScan { from { transform: translateY(0); } to { transform: translateY(880px); } }
    .city-vignette { position: absolute; inset: 0; pointer-events: none; z-index: 12;
      background: radial-gradient(ellipse 70% 60% at 50% 45%, transparent 55%, rgba(3,5,11,0.55) 100%); }
    .city-fade { position: absolute; bottom: 95px; left: 0; right: 0; height: 70px; pointer-events: none; z-index: 11;
      background: linear-gradient(180deg, transparent 0%, rgba(9,11,16,0.55) 60%, rgba(9,11,16,0.85) 100%); }

    /* ---------- frame + readout ---------- */
    .city-frame { position: absolute; left: 12px; right: 12px; top: 98px; bottom: 112px; pointer-events: none; z-index: 14; --c: rgba(0,229,255,0.5);
      background:
        linear-gradient(var(--c), var(--c)) left top / 22px 1px no-repeat,
        linear-gradient(var(--c), var(--c)) left top / 1px 22px no-repeat,
        linear-gradient(var(--c), var(--c)) right top / 22px 1px no-repeat,
        linear-gradient(var(--c), var(--c)) right top / 1px 22px no-repeat,
        linear-gradient(var(--c), var(--c)) left bottom / 22px 1px no-repeat,
        linear-gradient(var(--c), var(--c)) left bottom / 1px 22px no-repeat,
        linear-gradient(var(--c), var(--c)) right bottom / 22px 1px no-repeat,
        linear-gradient(var(--c), var(--c)) right bottom / 1px 22px no-repeat;
    }
    .city-readout { position: absolute; top: 66px; left: 20px; z-index: 30; display: flex; align-items: center; gap: 10px;
      font-family: var(--font-mono); font-size: 8px; letter-spacing: 1.5px; color: rgba(0,229,255,0.55); white-space: nowrap; }
    .city-readout b { color: rgba(0,229,255,0.85); font-weight: 600; }
    .city-readout .sep { color: rgba(0,229,255,0.25); }
    .city-readout__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--magenta); box-shadow: 0 0 8px var(--magenta);
      animation: cityBlink 1.2s steps(2, start) infinite; }
    .city-readout__dot.is-secured { background: var(--lime); box-shadow: 0 0 8px var(--lime); animation: none; }
    @keyframes cityBlink { to { visibility: hidden; } }

    .city-actions { position: absolute; top: 62px; right: 20px; z-index: 30; display: flex; gap: 8px; }
    .city-btn { text-decoration: none; font-family: var(--font-display); font-size: 9px; font-weight: 700; letter-spacing: 2px; padding: 7px 14px;
      border: 1px solid; position: relative; transition: box-shadow 150ms ease, background 150ms ease, transform 150ms ease;
      clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px)); }
    .city-btn--magenta { color: var(--magenta); border-color: rgba(255,45,155,0.4); background: rgba(255,45,155,0.08); text-shadow: 0 0 8px rgba(255,45,155,0.5); }
    .city-btn--magenta:hover { background: rgba(255,45,155,0.2); box-shadow: inset 0 0 14px rgba(255,45,155,0.25); transform: translateY(-1px); }
    .city-btn--cyan { color: var(--cyan); border-color: rgba(0,229,255,0.4); background: rgba(0,229,255,0.08); text-shadow: 0 0 8px rgba(0,229,255,0.5); }
    .city-btn--cyan:hover { background: rgba(0,229,255,0.2); box-shadow: inset 0 0 14px rgba(0,229,255,0.25); transform: translateY(-1px); }

    /* ---------- isometric city ---------- */
    .city-skyline { position: absolute; inset: 0; z-index: 2; }
    /* Zero-size origin at tile (0,0); every block is placed in px around it. */
    .city-iso { position: absolute; left: 50%; top: ${ORIGIN_TOP}px; width: 0; height: 0; transform-origin: 0 40%; }
    .city-ground { position: absolute; left: ${GROUND_LEFT}px; top: ${GROUND_TOP}px; width: ${GROUND_W}px; height: ${GROUND_H}px; pointer-events: none; z-index: 1; opacity: 0.32;
      background-image: url("data:image/svg+xml,${TILE_SVG}"); background-size: ${TW}px ${TH}px;
      -webkit-mask-image: radial-gradient(ellipse 46% 42% at 50% 54%, #000 30%, rgba(0,0,0,0.35) 62%, transparent 82%);
      mask-image: radial-gradient(ellipse 46% 42% at 50% 54%, #000 30%, rgba(0,0,0,0.35) 62%, transparent 82%); }
    .city-block, .city-cluster, .city-plaza { position: absolute; transform: scale(var(--s)); transform-origin: 50% 50%; }
    .city-block img, .city-cluster img { position: absolute; display: block; height: auto; }
    .city-block { pointer-events: none; }
    .city-block--far { opacity: 0.28; filter: brightness(0.25) saturate(0.05); }
    .city-block--mid { opacity: 0.4; filter: brightness(0.3) saturate(0.1); }

    /* The centre block: an empty plaza the districts ring around. */
    .city-plaza { pointer-events: none; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
      background: radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.22) 0%, rgba(0,229,255,0.08) 45%, rgba(0,229,255,0.03) 100%);
      animation: cityGroundPulse 4s ease-in-out infinite; }
    .city-plaza__core { position: absolute; left: 50%; top: 50%; width: 28px; height: 14px; margin: -7px 0 0 -14px; border: 1px solid rgba(0,229,255,0.6);
      transform: rotate(0deg); clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); background: rgba(0,229,255,0.25); box-shadow: 0 0 12px rgba(0,229,255,0.5); }

    /* A district: a clickable 2x2 lot with three buildings standing on it. */
    .city-cluster { display: block; text-decoration: none; cursor: pointer;
      transition: transform 220ms cubic-bezier(.2,.8,.2,1), filter 220ms ease; }
    .city-lot { position: absolute; inset: -6px -10px; pointer-events: none; z-index: 0; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
      background: radial-gradient(ellipse at 50% 55%, var(--ground) 0%, var(--ground-edge) 60%, transparent 100%);
      transition: opacity 200ms ease; }
    .city-lot::after { content: ''; position: absolute; inset: 0; clip-path: polygon(50% 1px, calc(100% - 2px) 50%, 50% calc(100% - 1px), 2px 50%, 50% calc(100% - 3px), calc(100% - 6px) 50%, 50% 3px, 6px 50%);
      background: var(--ground-line); }
    .city-cluster.is-occupied { --ground: rgba(255,45,155,0.22); --ground-edge: rgba(255,45,155,0.08); --ground-line: rgba(255,45,155,0.35); }
    .city-cluster.is-contested { --ground: rgba(0,229,255,0.3); --ground-edge: rgba(0,229,255,0.1); --ground-line: rgba(0,229,255,0.5); }
    .city-cluster.is-secured { --ground: rgba(198,255,0,0.34); --ground-edge: rgba(198,255,0,0.12); --ground-line: rgba(198,255,0,0.6); }
    .city-cluster.is-secured .city-lot { animation: cityGroundPulse 3s ease-in-out infinite; }
    @keyframes cityGroundPulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
    .city-cluster::after { content: attr(data-name) ' // ENTER'; position: absolute; left: 50%; bottom: var(--peak); transform: translate(-50%, 4px);
      font-family: var(--font-display); font-size: 8px; font-weight: 700; letter-spacing: 2px; color: var(--cyan); white-space: nowrap;
      padding: 5px 9px; border: 1px solid rgba(0,229,255,0.5); background: rgba(5,7,16,0.92); box-shadow: 0 0 12px rgba(0,229,255,0.25);
      opacity: 0; pointer-events: none; transition: opacity 160ms ease, transform 160ms ease; z-index: 6; }
    .city-cluster:hover { transform: translateY(-5px) scale(var(--s)); filter: brightness(1.25); z-index: 40; }
    .city-cluster:hover::after { opacity: 1; transform: translate(-50%, -6px); }
    .city-cluster:hover .city-lot { opacity: 1; animation: none; }
    .city-beacon { position: absolute; width: 5px; height: 5px; margin-left: -2.5px; border-radius: 50%; pointer-events: none; z-index: 5;
      animation: cityBeacon 1.6s ease-in-out infinite; }
    .is-occupied .city-beacon { background: var(--magenta); box-shadow: 0 0 6px var(--magenta), 0 0 14px rgba(255,45,155,0.4); }
    .is-contested .city-beacon { background: var(--cyan); box-shadow: 0 0 6px var(--cyan), 0 0 14px rgba(0,229,255,0.4); }
    .is-secured .city-beacon { background: var(--lime); box-shadow: 0 0 6px var(--lime), 0 0 14px rgba(198,255,0,0.4); animation-duration: 3.2s; }
    @keyframes cityBeacon { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
    .city-spark { position: absolute; border-radius: 50%; background: var(--magenta); box-shadow: 0 0 6px var(--magenta), 0 0 12px rgba(255,45,155,0.3); z-index: 25;
      animation: cityBeacon 2.4s ease-in-out infinite; }

    /* ---------- district labels ---------- */
    .city-labels { position: absolute; inset: 0; z-index: 12; pointer-events: none; }
    .city-label { position: absolute; pointer-events: auto; text-decoration: none; width: 138px; padding: 8px 10px 9px;
      background: linear-gradient(160deg, rgba(9,11,16,0.9), rgba(16,22,38,0.82)); border: 1px solid rgba(0,229,255,0.2);
      --bracket: rgba(0,229,255,0.75);
      opacity: 0.86; transition: opacity 150ms ease, border-color 150ms ease, box-shadow 150ms ease, transform 200ms cubic-bezier(.2,.8,.2,1); }
    .city-label::before, .city-label::after { content: ''; position: absolute; width: 9px; height: 9px; pointer-events: none; transition: border-color 150ms ease; }
    .city-label::before { top: -1px; left: -1px; border-top: 2px solid var(--bracket); border-left: 2px solid var(--bracket); }
    .city-label::after { bottom: -1px; right: -1px; border-bottom: 2px solid var(--bracket); border-right: 2px solid var(--bracket); }
    .city-label:hover { opacity: 1; border-color: rgba(0,229,255,0.7); box-shadow: 0 0 18px rgba(0,229,255,0.25), inset 0 0 24px rgba(0,229,255,0.05); transform: translateY(-2px); }
    .city-label.is-secured { border-color: rgba(198,255,0,0.3); --bracket: rgba(198,255,0,0.85); }
    .city-label.is-secured:hover { border-color: rgba(198,255,0,0.75); box-shadow: 0 0 18px rgba(198,255,0,0.25), inset 0 0 24px rgba(198,255,0,0.05); }
    .city-label--master { opacity: 1; width: 148px; }
    .city-label__tick { position: absolute; top: 50%; width: 18px; height: 1px; background: linear-gradient(90deg, rgba(0,229,255,0.6), rgba(0,229,255,0.1)); }
    .city-label__tick::after { content: ''; position: absolute; top: -2px; width: 5px; height: 5px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 6px var(--cyan); }
    .city-label--left .city-label__tick { right: -18px; }
    .city-label--left .city-label__tick::after { right: -3px; }
    .city-label--right .city-label__tick { left: -18px; transform: scaleX(-1); }
    .city-label--right .city-label__tick::after { right: -3px; }
    .city-label__head { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 7px; letter-spacing: 1.5px; }
    .city-label__code { color: rgba(237,239,243,0.4); }
    .city-label__status { font-weight: 700; padding-left: 8px; position: relative; }
    .city-label__status::before { content: ''; position: absolute; left: 0; top: 50%; width: 4px; height: 4px; margin-top: -2px; border-radius: 50%; background: currentColor; box-shadow: 0 0 6px currentColor; }
    .is-occupied .city-label__status { color: var(--magenta); }
    .is-occupied .city-label__status::before { animation: cityBeacon 1.4s ease-in-out infinite; }
    .is-contested .city-label__status { color: var(--cyan); }
    .is-secured .city-label__status { color: var(--lime); }
    .city-label__name { margin-top: 5px; font-family: var(--font-display); font-size: 9.5px; font-weight: 700; letter-spacing: 2px; color: var(--cyan);
      text-shadow: 0 0 10px rgba(0,229,255,0.45); white-space: nowrap; }
    .city-label--master .city-label__name { font-size: 10.5px; text-shadow: 0 0 12px rgba(0,229,255,0.6), 0 0 24px rgba(0,229,255,0.25); }
    .is-secured .city-label__name { color: var(--lime); text-shadow: 0 0 10px rgba(198,255,0,0.45); }
    .city-label__meter { display: flex; align-items: center; gap: 7px; margin-top: 6px; }
    .city-label__bar { display: flex; gap: 2px; flex: 1; height: 6px; }
    .city-label__bar i { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(0,229,255,0.14); }
    .city-label__bar i.lit { background: linear-gradient(90deg, #00E5FF, #6cf2c8); border-color: rgba(0,229,255,0.5); box-shadow: 0 0 5px rgba(0,229,255,0.5); }
    .city-label__bar i.lit:nth-child(n+7) { background: linear-gradient(90deg, #8ff58a, #C6FF00); border-color: rgba(198,255,0,0.5); box-shadow: 0 0 5px rgba(198,255,0,0.5); }
    .is-secured .city-label__bar { animation: cityBarGlow 2.4s ease-in-out infinite; }
    @keyframes cityBarGlow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.45); } }
    .city-label__pct { font-family: var(--font-mono); font-size: 9.5px; font-weight: 700; min-width: 28px; text-align: right; color: rgba(0,229,255,0.5); }
    .is-contested .city-label__pct { color: var(--lime); text-shadow: 0 0 8px rgba(198,255,0,0.4); }
    .is-secured .city-label__pct { color: var(--lime); text-shadow: 0 0 8px rgba(198,255,0,0.6); }
    .city-label__sub { margin-top: 4px; font-family: var(--font-mono); font-size: 7px; letter-spacing: 1px; color: rgba(237,239,243,0.32); }
    .city-label__start { margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(0,229,255,0.3); font-family: var(--font-mono); font-size: 8px; font-weight: 700;
      letter-spacing: 1.5px; color: var(--cyan); text-shadow: 0 0 8px rgba(0,229,255,0.7); }
    .city-start-pulse { border-color: rgba(0,229,255,0.35); animation: cityStartPulse 1.6s ease-in-out infinite; }
    @keyframes cityStartPulse {
      0%, 100% { border-color: rgba(0,229,255,0.3); box-shadow: 0 0 6px rgba(0,229,255,0.15); }
      50% { border-color: rgba(0,229,255,0.95); box-shadow: 0 0 22px rgba(0,229,255,0.55), inset 0 0 18px rgba(0,229,255,0.08); }
    }

    .city-hud { position: absolute; top: 0; left: 0; right: 0; z-index: 30; }
    .city-scout { position: absolute; bottom: 0; left: 0; right: 0; z-index: 30; }

    /* ---------- narrower desktops (the app is capped at 960px): shrink the city so the label columns stay clear ---------- */
    @media (max-width: 960px) { .city-iso { transform: scale(0.88); } }
    @media (max-width: 860px) { .city-iso { transform: scale(0.76); } }

    /* ---------- mobile: city shrinks, labels flow into a grid ---------- */
    @media (max-width: 768px) {
      .city-map { height: auto; display: flex; flex-direction: column; }
      .city-hud, .city-scout { position: relative; }
      .city-actions { position: relative; top: auto; right: auto; justify-content: flex-end; padding: 8px 14px 0; }
      .city-readout { position: relative; top: auto; left: auto; padding: 8px 14px 0; flex-wrap: wrap; row-gap: 4px; }
      .city-skyline { position: relative; height: 420px; margin-top: -60px; }
      .city-iso { top: ${ORIGIN_TOP - 40}px; transform: scale(0.8); }
      .city-frame, .city-fade, .city-vignette { display: none; }
      .city-floor { top: 170px; }
      .city-horizon { top: 150px; }
      .city-scan { z-index: 3; }
      .city-labels { position: relative; inset: auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 0 14px 18px; margin-top: -10px; }
      .city-label { position: relative !important; top: auto !important; left: auto !important; right: auto !important; width: auto; opacity: 1; }
      .city-label__tick { display: none; }
      .city-label--master { grid-column: 1 / -1; }
      .city-cluster::after { display: none; }
      /* Let the scout's speech bubble take the full row; the action button drops beneath it. */
      .city-scout > div > div { flex-wrap: wrap; }
      .city-scout > div > div > a { flex: 1 1 100%; text-align: center; }
    }
    @media (max-width: 420px) {
      .city-skyline { height: 300px; margin-top: -70px; }
      .city-iso { top: ${ORIGIN_TOP - 90}px; transform: scale(0.54); }
      .city-floor { top: 120px; }
      .city-horizon { top: 105px; }
      .city-labels { margin-top: -20px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .city-map *, .city-map *::before, .city-map *::after { animation: none !important; }
      .city-scan { display: none; }
    }
  </style>`;

export function renderCityMap(state) {
  if (Object.values(state.accounts).every((a) => !a.enabled)) {
    return renderAllOffline();
  }
  const startHere = !Object.values(state.missions).some((m) => m.status === 'completed');
  const progress = DISTRICTS.map((d) => calcDistrictProgress(state, d.id).percent);
  const securedCount = progress.filter((p) => p >= 100).length;
  const avg = progress.reduce((sum, p) => sum + p, 0) / progress.length / 100;
  const hazeMagenta = (0.22 * (1 - avg)).toFixed(3);
  const hazeCyan = (0.05 + 0.2 * avg).toFixed(3);
  const plaza = blockCentre(1, 1);
  return `
<div class="city-map scanlines">
  ${STYLE}
  <div class="city-stars"></div>
  <div class="city-circuit"></div>
  <div class="city-haze" style="background:
    radial-gradient(circle at 50% 118px, rgba(255,45,155,${hazeMagenta}) 0px, rgba(255,45,155,${(hazeMagenta * 0.45).toFixed(3)}) 90px, transparent 190px),
    radial-gradient(ellipse 34% 20% at 50% ${ORIGIN_TOP + plaza.y}px, rgba(0,229,255,${hazeCyan}) 0%, transparent 70%);"></div>
  <div class="city-floor"></div>
  ${renderStreams()}
  <div class="city-hud">${renderHud(state)}</div>
  <div class="city-readout">
    <span class="city-readout__dot ${securedCount === DISTRICTS.length ? 'is-secured' : ''}"></span>
    <span>SECTOR MAP <b>LIVE</b></span>
    <span class="sep">//</span>
    <span>DISTRICTS <b>${DISTRICTS.length}</b></span>
    <span class="sep">//</span>
    <span>SECURED <b>${securedCount}</b></span>
  </div>
  <div class="city-actions">
    <a href="#/quickquest" class="city-btn city-btn--magenta">⚡ QUICK QUEST</a>
    <a href="#/stats" class="city-btn city-btn--cyan">STATS</a>
  </div>
  <div class="city-skyline">
    <div class="city-horizon"></div>
    <div class="city-iso">
      <div class="city-ground"></div>
      ${renderBackdropBlocks()}
      ${renderPlaza()}
      ${renderDistrictBlocks(state)}
    </div>
  </div>
  <div class="city-vignette"></div>
  <div class="city-fade"></div>
  <div class="city-scan"></div>
  <div class="city-frame"></div>
  <div class="city-labels">
    ${renderDistrictLabels(state, startHere)}
  </div>
  <div class="city-scout">${renderCityScout(state)}</div>
</div>`;
}
