import { ACCOUNTS } from '../data/accounts.js';
import { renderHud } from '../components/hud.js';
import { renderBuilding } from '../components/building.js';
import { getBuildingState } from '../utils/calc.js';
import { getEras } from '../utils/social-timeline.js';

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

function renderPlatformCard(state, platform) {
  const account = ACCOUNTS[platform.id];
  if (!account || !state.accounts[platform.id]?.enabled) return '';

  const profile = state.socialHistory?.[platform.id];
  const bState = getBuildingState(state, platform.id);

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
    <div style="background: rgba(26,31,43,0.5); border: 1px solid rgba(0,229,255,0.2); padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
        ${platformIcon(platform, bState)}
        <div style="flex: 1;">
          <div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--offwhite); letter-spacing: 1px;">${esc(platform.name)}</div>
          <div style="font-family: var(--font-mono); font-size: 10px; color: rgba(0,229,255,0.6); margin-top: 3px;">Joined ${profile.joinYear} · ${yearsOn} year${yearsOn === 1 ? '' : 's'} of history</div>
        </div>
        <span data-action="edit-social-profile" data-platform="${platform.id}" style="cursor: pointer; font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 1px; color: rgba(237,239,243,0.35); padding: 6px 12px; border: 1px solid rgba(255,255,255,0.08);">EDIT</span>
      </div>
      <div style="font-family: var(--font-display); font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.4); margin-bottom: 8px;">YOUR ERAS</div>
      ${eraRows}
      <div style="margin-top: 12px; text-align: center;">
        <a href="#/district/${esc(account.district)}?tab=reclaim" style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 1px; color: #00E5FF; padding: 8px 16px; border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.08); text-decoration: none;">START REVIEW MISSIONS</a>
      </div>
    </div>`;
  }

  return `
  <div style="background: rgba(26,31,43,0.3); border: 2px dashed rgba(0,229,255,0.15); padding: 20px; margin-bottom: 16px;">
    <div style="display: flex; align-items: center; gap: 14px;">
      ${platformIcon(platform, bState)}
      <div style="flex: 1;">
        <div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--offwhite); letter-spacing: 1px;">${esc(platform.name)}</div>
      </div>
      <span data-action="edit-social-profile" data-platform="${platform.id}" style="cursor: pointer; font-family: var(--font-display); font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #00E5FF; padding: 8px 16px; border: 1px solid rgba(0,229,255,0.3); background: rgba(0,229,255,0.08); box-shadow: 0 0 10px rgba(0,229,255,0.1);">SET UP</span>
    </div>
  </div>`;
}

export function renderSocialForm(platformId) {
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return '';

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= platform.maxAge; y--) {
    yearOptions.push(`<option value="${y}">${y}</option>`);
  }

  const activityOptions = ACTIVITY_LEVELS.map((a) =>
    `<label style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(26,31,43,0.4); border: 1px solid rgba(255,255,255,0.05); cursor: pointer; margin-bottom: 4px;">
      <input type="radio" name="era-activity" value="${a.value}" style="accent-color: var(--cyan); width: 16px; height: 16px;">
      <div style="flex: 1;">
        <div style="font-size: 13px; color: var(--offwhite); font-weight: 500;">${esc(a.label)}</div>
        <div style="font-size: 11px; color: rgba(237,239,243,0.4); margin-top: 2px;">${esc(a.description)}</div>
      </div>
    </label>`,
  ).join('');

  return `
  <div id="social-profile-form" data-platform="${platformId}" style="background: rgba(26,31,43,0.7); border: 1px solid rgba(0,229,255,0.25); padding: 24px; margin-top: 16px; box-shadow: 0 0 30px rgba(0,229,255,0.05);">
    <div style="font-family: var(--font-display); font-size: 10px; font-weight: 700; color: #00E5FF; letter-spacing: 3px; margin-bottom: 20px;">YOUR ${esc(platform.name.toUpperCase())} HISTORY</div>

    <div style="margin-bottom: 20px;">
      <label style="font-family: var(--font-display); font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5); display: block; margin-bottom: 8px;">WHAT YEAR DID YOU JOIN?</label>
      <select id="social-join-year" style="width: 100%; max-width: 200px; background: rgba(9,11,16,0.6); border: 1px solid rgba(0,229,255,0.2); padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; color: #EDEFF3; appearance: none;">
        <option value="">Select year...</option>
        ${yearOptions.join('')}
      </select>
    </div>

    <div id="era-questions" hidden>
      <div style="font-family: var(--font-display); font-size: 7px; font-weight: 600; letter-spacing: 2px; color: rgba(0,229,255,0.5); margin-bottom: 6px;">HOW ACTIVE WERE YOU?</div>
      <div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-bottom: 12px; line-height: 1.5;">${esc(ERA_HELP)}</div>

      <div id="era-container"></div>
    </div>

    <div data-social-msg role="status" hidden style="font-size: 13px; color: var(--amber); line-height: 1.6; margin-top: 16px;"></div>
    <div style="display: flex; gap: 16px; align-items: center; margin-top: 20px;">
      <span data-action="save-social-profile" data-platform="${platformId}" style="cursor: pointer; font-family: var(--font-display); font-size: 11px; font-weight: 700; color: #090B10; background: #00E5FF; padding: 14px 28px; letter-spacing: 2px; box-shadow: 0 0 20px rgba(0,229,255,0.35), 0 4px 0 #009bb3;">SAVE</span>
      <span data-action="cancel-social-profile" style="cursor: pointer; font-size: 13px; color: rgba(237,239,243,0.35);">CANCEL</span>
    </div>
  </div>`;
}

// answers: the saved eras when re-editing the same join year, so EDIT keeps them.
export function renderEraQuestions(joinYear, answers = []) {
  const eras = getEras(joinYear);
  return eras.map((era, i) => `
    <div data-era="${i}" style="margin-bottom: 16px;">
      <div style="font-family: var(--font-display); font-size: 9px; font-weight: 600; letter-spacing: 1px; color: var(--cyan); margin-bottom: 4px;">${esc(era.label).toUpperCase()}</div>
      <div style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.35); margin-bottom: 10px;">${era.startYear}–${era.endYear}</div>
      ${ACTIVITY_LEVELS.map((a) => `
        <label style="display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: rgba(26,31,43,0.4); border: 1px solid rgba(255,255,255,0.05); cursor: pointer; margin-bottom: 4px;">
          <input type="radio" name="era-${i}" value="${a.value}"${answers?.[i] === a.value ? ' checked' : ''} style="accent-color: var(--cyan); width: 14px; height: 14px;">
          <span style="font-size: 12px; color: var(--offwhite);">${esc(a.label)}</span>
          <span style="font-size: 10px; color: rgba(237,239,243,0.3); margin-left: auto;">${esc(a.description)}</span>
        </label>
      `).join('')}
    </div>
  `).join('');
}

export { getEras };

export function renderTimeline(state) {
  const platforms = SOCIAL_PLATFORMS.filter((p) => state.accounts[p.id]?.enabled);

  const cards = platforms.map((p) => renderPlatformCard(state, p)).join('');
  const unconfigured = platforms.filter((p) => !state.socialHistory?.[p.id]?.joinYear).length;

  return `
  <div class="scanlines" style="min-height: 100vh; background: linear-gradient(180deg, #090B10 0%, #0d1018 40%, #121828 100%);">
    ${renderHud(state)}
    <div style="padding: 20px 24px 0;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <a href="#/district/square" style="flex-shrink: 0; padding: 8px 14px; font-family: var(--font-display); font-size: 10px; font-weight: 600; color: var(--cyan); background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); letter-spacing: 1px; text-decoration: none;">&#8592; DISTRICT</a>
        <div style="flex: 1;">
          <div style="font-family: var(--font-display); font-size: 22px; font-weight: 800; color: #00E5FF; letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,229,255,0.4);">SOCIAL TIMELINE</div>
          <div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-top: 4px;">Map your social media history, so your review starts where most of your posts are.</div>
        </div>
      </div>
    </div>
    <div style="padding: 24px;">
      ${unconfigured > 0 ? `
        <div style="background: rgba(0,229,255,0.04); border: 1px solid rgba(0,229,255,0.15); padding: 14px 16px; margin-bottom: 20px;">
          <div style="font-size: 13px; color: rgba(237,239,243,0.65); line-height: 1.6;">Tell us when you joined each platform and how active you were. <details class="more-fold" data-fold="timeline-how" data-open-desktop><summary>MORE</summary></details><span class="more-fold-text">${esc(TIMELINE_DOES)} <strong style="color: var(--cyan);">No rushing.</strong></span></div>
        </div>
      ` : ''}
      ${unconfigured > 0 ? `<div data-setup-note style="font-size: 11px; color: rgba(237,239,243,0.4); margin-bottom: 10px;">Tell us about your history here to plan your review.</div>` : ''}
      ${cards}
      <div id="social-form-container"></div>
    </div>
  </div>`;
}
