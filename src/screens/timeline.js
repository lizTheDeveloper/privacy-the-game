import { ACCOUNTS } from '../data/accounts.js';
import { renderHud } from '../components/hud.js';
import { renderBuilding } from '../components/building.js';
import { getBuildingState } from '../utils/calc.js';
import { getEras } from '../utils/social-timeline.js';
import { fillBar } from '../components/fill-bar.js';
import { readLevel } from '../utils/reading.js';
import { seeEverything, simpleLead } from '../components/see-everything.js';

function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', maxAge: 2010 },
  { id: 'facebook', name: 'Facebook', maxAge: 2004 },
  { id: 'twitter', name: 'X / Twitter', maxAge: 2006 },
  { id: 'tiktok', name: 'TikTok', maxAge: 2016 },
  { id: 'linkedin', name: 'LinkedIn', maxAge: 2003 },
];

// What the answers do (utils/social-timeline.js), said once for the form and the intro.
export const TIMELINE_DOES = 'On your Reclaim missions, the platforms and years you posted most move to the top, and each review row shows its years and how much you posted then. Instagram and Facebook have a Memory Lane mission for each era.';
const ERA_HELP = 'We ask this for each era of your account. The eras you posted most in go first on your Reclaim missions. Leave an era blank if you aren’t sure.';

const ACTIVITY_LEVELS = [
  { value: 'none', label: 'Barely posted', description: 'A few posts, mostly lurked' },
  { value: 'light', label: 'Posted sometimes', description: 'A handful of posts per month' },
  { value: 'moderate', label: 'Pretty active', description: 'Posted regularly, shared stories/reels' },
  { value: 'heavy', label: 'Posted a LOT', description: 'Daily posts, stories, comments, the works' },
];

// The building beside a card's name: its own label says the same name (Instagram, Instagram),
// so on a phone that label hides (tl-icon--same, style.css); a different name stays.
function platformIcon(platform, bState) {
  const same = ACCOUNTS[platform.id]?.name === platform.name;
  return `<span class="tl-icon${same ? ' tl-icon--same' : ''}">${renderBuilding(platform.id, bState, 48)}</span>`;
}

// The button on a card whose form is open: it closes the form (the card's own SET UP/EDIT, changed).
const closeBtn = (platform) => `<button type="button" class="btn-secondary" data-action="cancel-social-profile" data-platform="${platform.id}" aria-expanded="true" style="flex-shrink: 0; min-height: 44px; padding: 0 16px;">CLOSE</button>`;

// lead: the first platform not set up yet, the page's one bright button. inner: the open form,
// drawn inside this card (Liz 2026-11-20: not at the bottom of the list).
function renderPlatformCard(state, platform, lead = false, inner = '') {
  const account = ACCOUNTS[platform.id];
  if (!account || !state.accounts[platform.id]?.enabled) return '';

  const profile = state.socialHistory?.[platform.id];
  const bState = getBuildingState(state, platform.id);

  if (inner) {
    return `
    <div data-timeline-card="${platform.id}" data-open style="background: rgba(26,31,43,0.6); border: 1px solid rgba(0,229,255,0.45); padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        ${platformIcon(platform, bState)}
        <div style="flex: 1;">
          <div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--offwhite); letter-spacing: 1px;">${esc(platform.name)}</div>
          ${profile?.joinYear ? `<div style="font-size: 13px; color: var(--offwhite); margin-top: 3px;">Editing your answers</div>` : ''}
        </div>
        ${closeBtn(platform)}
      </div>
      ${inner}
    </div>`;
  }

  if (profile?.joinYear) {
    const eras = getEras(profile.joinYear);
    const now = new Date().getFullYear();
    const yearsOn = now - profile.joinYear;

    const eraRows = eras.map((era, i) => {
      const activity = profile.eras?.[i] || 'unknown';
      const actLabel = ACTIVITY_LEVELS.find((a) => a.value === activity)?.label || 'Not set';
      const color = activity === 'heavy' ? 'var(--magenta)' : activity === 'moderate' ? 'var(--amber)' : activity === 'light' ? 'var(--cyan)' : 'rgba(237,239,243,0.3)';
      return `
      <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(26,31,43,0.4); border: 1px solid rgba(0,229,255,0.08); margin-bottom: 4px;">
        <div style="flex: 1;">
          <div style="font-size: 12px; color: var(--offwhite); font-weight: 500;">${esc(era.label)}</div>
          <div style="font-family: var(--font-mono); font-size: 9px; color: rgba(237,239,243,0.35); margin-top: 2px;">${era.startYear}–${era.endYear}</div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 10px; color: ${color}; font-weight: 600;">${esc(actLabel)}</div>
      </div>`;
    }).join('');

    return `
    <div data-timeline-card="${platform.id}" style="background: rgba(26,31,43,0.5); border: 1px solid rgba(0,229,255,0.2); padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
        ${platformIcon(platform, bState)}
        <div style="flex: 1;">
          <div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--offwhite); letter-spacing: 1px;">${esc(platform.name)}</div>
          <div style="font-family: var(--font-mono); font-size: 10px; color: rgba(0,229,255,0.6); margin-top: 3px;">Joined ${profile.joinYear} · ${yearsOn} year${yearsOn === 1 ? '' : 's'} of history</div>
        </div>
        <button type="button" class="btn-secondary" data-action="edit-social-profile" data-platform="${platform.id}" style="min-height: 44px; padding: 0 16px;">EDIT</button>
      </div>
      <div style="font-family: var(--font-display); font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.4); margin-bottom: 8px;">YOUR ERAS</div>
      ${eraRows}
      <div style="margin-top: 12px; text-align: center;">
        <a href="#/district/${esc(account.district)}?tab=reclaim" style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 1px; color: #00E5FF; padding: 8px 16px; border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.08); text-decoration: none;">START REVIEW MISSIONS</a>
      </div>
    </div>`;
  }

  return `
  <div data-timeline-card="${platform.id}" style="background: rgba(26,31,43,0.3); border: 2px dashed rgba(0,229,255,0.15); padding: 20px; margin-bottom: 16px;">
    <div style="display: flex; align-items: center; gap: 14px;">
      ${platformIcon(platform, bState)}
      <div style="flex: 1;">
        <div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--offwhite); letter-spacing: 1px;">${esc(platform.name)}</div>
      </div>
      <button type="button" class="${lead ? 'btn-primary' : 'btn-secondary'}" data-action="edit-social-profile" data-platform="${platform.id}" style="flex-shrink: 0; min-height: 44px; padding: 0 18px;">SET UP</button>
    </div>
  </div>`;
}

// An activity choice: its label, and under it what it means, in off-white (gray small text reads as
// optional). 44px tall.
function activityRow(name, a, checked) {
  return `<label style="display: flex; align-items: flex-start; gap: 12px; min-height: 44px; box-sizing: border-box; padding: 10px 14px; background: rgba(26,31,43,0.4); border: 1px solid rgba(255,255,255,0.08); cursor: pointer; margin-bottom: 6px;">
      <input type="radio" name="${name}" value="${a.value}"${checked ? ' checked' : ''} style="accent-color: var(--cyan); width: 18px; height: 18px; margin: 2px 0 0; flex-shrink: 0;">
      <span style="flex: 1;"><span style="display: block; font-size: 15px; font-weight: 600; color: var(--offwhite);">${esc(a.label)}</span><span style="display: block; font-size: 14px; color: var(--offwhite); margin-top: 2px;">${esc(a.description)}</span></span>
    </label>`;
}

const yearOptionsFor = (platform, picked) => {
  const out = [];
  for (let y = new Date().getFullYear(); y >= platform.maxAge; y--) out.push(`<option value="${y}"${y === picked ? ' selected' : ''}>${y}</option>`);
  return out.join('');
};

const FORM_LABEL = 'font-size: 15px; font-weight: 700; color: var(--offwhite); display: block; margin-bottom: 8px;';
const SELECT_STYLE = 'width: 100%; max-width: 220px; min-height: 44px; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.35); padding: 10px 16px; font-family: var(--font-mono); font-size: 15px; color: #EDEFF3;';

// Advanced: the whole form, inside the tapped card. profile: the saved answers, so EDIT keeps them.
export function renderSocialForm(platformId, profile = null) {
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return '';
  const year = profile?.joinYear ?? null;
  return `
  <div id="social-profile-form" data-platform="${platformId}" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,229,255,0.2);">
    <div style="font-family: var(--font-display); font-size: 10px; font-weight: 700; color: #00E5FF; letter-spacing: 3px; margin-bottom: 16px;">YOUR ${esc(platform.name.toUpperCase())} HISTORY</div>

    <div style="margin-bottom: 20px;">
      <label for="social-join-year" style="${FORM_LABEL}">What year did you join?</label>
      <select id="social-join-year" data-platform="${platformId}" style="${SELECT_STYLE}">
        <option value="">Select year...</option>
        ${yearOptionsFor(platform, year)}
      </select>
    </div>

    <div id="era-questions"${year ? '' : ' hidden'}>
      <div style="${FORM_LABEL} margin-bottom: 4px;">How active were you?</div>
      <div style="font-size: 14px; color: var(--offwhite); margin-bottom: 12px; line-height: 1.5;">${esc(ERA_HELP)}</div>

      <div id="era-container">${year ? renderEraQuestions(year, profile.eras) : ''}</div>
    </div>

    <div data-social-msg role="status" hidden style="font-size: 14px; color: var(--amber); line-height: 1.6; margin-top: 16px;"></div>
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 20px;">
      <button type="button" class="btn-primary" data-action="save-social-profile" data-platform="${platformId}" style="min-height: 44px;">SAVE</button>
      <button type="button" class="btn-secondary" data-action="cancel-social-profile" data-platform="${platformId}" style="min-height: 44px;">CANCEL</button>
    </div>
  </div>`;
}

// answers: the saved eras when re-editing the same join year, so EDIT keeps them.
export function renderEraQuestions(joinYear, answers = []) {
  const eras = getEras(joinYear);
  return eras.map((era, i) => `
    <div data-era="${i}" style="margin-bottom: 16px;">
      <div style="font-family: var(--font-display); font-size: 10px; font-weight: 600; letter-spacing: 1px; color: var(--cyan); margin-bottom: 4px;">${esc(era.label).toUpperCase()}</div>
      <div style="font-family: var(--font-mono); font-size: 13px; color: var(--offwhite); margin-bottom: 10px;">${era.startYear}–${era.endYear}</div>
      ${ACTIVITY_LEVELS.map((a) => activityRow(`era-${i}`, a, answers?.[i] === a.value)).join('')}
    </div>
  `).join('');
}

// Simple: one question at a time (Liz: multi-step tasks lose people). wiz (app.js memory):
// { queue: [platform ids], at, step: 'year' | era index, draft: { joinYear, eras } }.
export function renderSimpleStep(wiz) {
  const id = wiz.queue[wiz.at];
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === id);
  if (!platform) return '';
  const many = wiz.queue.length > 1 ? `<div style="font-size: 14px; color: var(--offwhite); margin-bottom: 8px;">${esc(platform.name)}: ${wiz.at + 1} of ${wiz.queue.length} platforms</div>` : '';
  const msg = '<div data-social-msg role="status" hidden style="font-size: 15px; color: var(--amber); line-height: 1.6; margin-top: 12px;"></div>';
  const back = wiz.step === 'year' ? '' : '<button type="button" class="btn-secondary" data-action="tl-back" style="min-height: 44px;">BACK</button>';
  const buttons = (label) => `<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 16px;"><button type="button" class="btn-primary" data-action="tl-next" style="min-height: 44px;">${label}</button>${back}</div>`;
  if (wiz.step === 'year') {
    return `<div data-tl-step="year" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,229,255,0.2);">${many}
      <label for="social-join-year" style="${FORM_LABEL} font-size: 18px;">What year did you join ${esc(platform.name)}?</label>
      <select id="social-join-year" style="${SELECT_STYLE}"><option value="">Pick a year…</option>${yearOptionsFor(platform, wiz.draft?.joinYear ?? null)}</select>
      ${msg}${buttons('NEXT')}</div>`;
  }
  const eras = getEras(wiz.draft.joinYear);
  const i = wiz.step;
  const era = eras[i];
  if (!era) return '';
  const last = i === eras.length - 1;
  return `<div data-tl-step="${i}" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,229,255,0.2);">${many}
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;"><span style="font-size: 14px; color: var(--offwhite); white-space: nowrap;">${i + 1} of ${eras.length}</span><div style="flex: 1;">${fillBar({ key: `timeline:${id}:eras`, done: i + 1, total: eras.length, size: 'small', label: `Question ${i + 1} of ${eras.length}` })}</div></div>
    <div style="${FORM_LABEL} font-size: 18px; margin-bottom: 4px;">${esc(era.label)}, ${era.startYear}–${era.endYear}: how much did you post?</div>
    <div style="font-size: 14px; color: var(--offwhite); margin-bottom: 12px;">Not sure? Leave it blank and tap ${last ? 'SAVE' : 'NEXT'}.</div>
    ${ACTIVITY_LEVELS.map((a) => activityRow(`era-${i}`, a, wiz.draft.eras?.[i] === a.value)).join('')}
    ${buttons(last ? 'SAVE' : 'NEXT')}</div>`;
}

// Simple's first question: which of the platforms the player uses, as chips; NEXT asks about each.
function pickCard(platforms, picked, lit) {
  const chips = platforms.map((p) => {
    const on = picked.includes(p.id);
    return `<button type="button" class="tl-chip${on ? ' is-on' : ''}" data-action="tl-pick" data-platform="${p.id}" aria-pressed="${on}">${on ? '✓ ' : ''}${esc(p.name)}</button>`;
  }).join('');
  return `<div data-tl-pick style="background: rgba(0,229,255,0.05); border: 1px solid rgba(0,229,255,0.45); border-left: 3px solid var(--cyan); padding: 16px; margin-bottom: 20px;">
    <div style="font-size: 18px; font-weight: 700; color: var(--offwhite); margin-bottom: 4px;">Which of these do you use?</div>
    <div style="font-size: 14px; color: var(--offwhite); margin-bottom: 12px;">Tap each one. Then we ask about them one at a time.</div>
    <div style="display: flex; flex-wrap: wrap; gap: 10px;">${chips}</div>
    <button type="button" class="${lit ? 'btn-primary' : 'btn-secondary'}" data-action="tl-start"${picked.length ? '' : ' disabled'} style="min-height: 44px; margin-top: 14px;">NEXT</button>
  </div>`;
}

export const TIMELINE_CSS = '<style>.tl-chip{min-height:44px;padding:0 16px;font:inherit;font-size:16px;color:var(--offwhite);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.25);border-radius:22px;cursor:pointer}.tl-chip.is-on{color:var(--offwhite);background:rgba(0,229,255,0.16);border-color:var(--cyan);font-weight:700}.tl-chip:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}button[data-action="tl-start"]:disabled{opacity:0.45;cursor:default}</style>';

export { getEras };

// ui (app.js memory): { edit: the platform whose full form is open (Advanced), wiz: Simple's
// one-at-a-time questions, picked: Simple's chips }.
// Simple's one sentence: what the timeline is for, and why it matters to you.
export const TIMELINE_LEAD = 'Tell us when you joined each social app, so your clean-up starts with the years you posted most.';

export function renderTimeline(state, ui = {}) {
  const platforms = SOCIAL_PLATFORMS.filter((p) => state.accounts[p.id]?.enabled);
  const simple = readLevel(state) === 'simplest';
  const wiz = simple && ui.wiz && ui.wiz.queue?.[ui.wiz.at] ? ui.wiz : null;
  const editing = !simple && platforms.some((p) => p.id === ui.edit) ? ui.edit : null;
  const openId = wiz ? wiz.queue[wiz.at] : editing;

  const isSet = (p) => Boolean(state.socialHistory?.[p.id]?.joinYear);
  const unconfigured = platforms.filter((p) => !isSet(p)).length;
  const picked = (ui.picked || []).filter((id) => platforms.some((p) => p.id === id && !isSet(p)));
  // The one bright button: an open form's SAVE/NEXT; else Simple's NEXT once a chip is picked; else
  // the first SET UP.
  const chipsLit = simple && !openId && picked.length > 0;
  const lead = openId || chipsLit ? null : platforms.find((p) => !isSet(p))?.id ?? null;
  const inner = (p) => (p.id !== openId ? '' : wiz ? renderSimpleStep(wiz) : renderSocialForm(p.id, state.socialHistory?.[p.id]));
  const cards = platforms.map((p) => renderPlatformCard(state, p, p.id === lead, inner(p))).join('');
  const pick = simple && !openId && unconfigured > 1 ? pickCard(platforms.filter((p) => !isSet(p)), picked, chipsLit) : '';
  const done = platforms.length - unconfigured;
  const intro = unconfigured > 0 ? `
        <div style="background: rgba(0,229,255,0.04); border: 1px solid rgba(0,229,255,0.15); padding: 14px 16px; margin-bottom: 20px;">
          <div style="font-size: 13px; color: rgba(237,239,243,0.65); line-height: 1.6;">Tell us when you joined each platform and how active you were. <details class="more-fold" data-fold="timeline-how" data-open-desktop><summary>MORE</summary></details><span class="more-fold-text">${esc(TIMELINE_DOES)} <strong style="color: var(--cyan);">No rushing.</strong></span></div>
        </div>
      ${`<div data-setup-note style="font-size: 11px; color: rgba(237,239,243,0.4); margin-bottom: 10px;">Tell us about your history here to plan your review.</div>`}` : '';
  // Simple: the sentence, the bar, the card with the bright button (or the open one) and the
  // platform question; the other cards and the intro behind See everything.
  const simpleBody = () => {
    const shown = (p) => p.id === lead || p.id === openId;
    const top = platforms.filter(shown).map((p) => renderPlatformCard(state, p, p.id === lead, inner(p))).join('');
    const rest = platforms.filter((p) => !shown(p)).map((p) => renderPlatformCard(state, p, false, inner(p))).join('');
    return `<div style="padding: 16px 24px 24px;">${simpleLead(TIMELINE_LEAD)}${progress}${top}${pick}${seeEverything('timeline', intro + rest)}</div>`;
  };
  // How many are set up, as a bar that fills.
  const progress = platforms.length
    ? `<div data-timeline-progress style="margin-bottom: 16px;"><div style="font-size: 14px; font-weight: 600; color: var(--offwhite); margin-bottom: 6px;">${done} of ${platforms.length} set up</div>${fillBar({ key: 'timeline:setup', done, total: platforms.length, size: 'mid', label: `${done} of ${platforms.length} set up` })}</div>`
    : '';

  return `
  <div class="scanlines" style="min-height: 100vh; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    ${TIMELINE_CSS}${renderHud(state)}
    <div style="padding: 20px 24px 0;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <a href="#/district/square" style="flex-shrink: 0; padding: 8px 14px; font-family: var(--font-display); font-size: 10px; font-weight: 600; color: var(--cyan); background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); letter-spacing: 1px; text-decoration: none;">&#8592; DISTRICT</a>
        <div style="flex: 1;">
          <div style="font-family: var(--font-display); font-size: 22px; font-weight: 800; color: #00E5FF; letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,229,255,0.4);">SOCIAL TIMELINE</div>
          ${simple ? '' : '<div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-top: 4px;">Map your social media history, so your review starts where most of your posts are.</div>'}
        </div>
      </div>
    </div>
    ${simple ? simpleBody() : `<div style="padding: 24px;">
      ${intro}
      ${progress}
      ${pick}
      ${cards}
    </div>`}
  </div>`;
}
