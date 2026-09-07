import { initRouter, navigate, parseRoute } from './router.js';
import { hasSavedState, loadState, saveState, updateMission, updateStreak, toggleAccount } from './state.js';
import { calcDistrictProgress, calcIntegrity } from './utils/calc.js';
import { MISSIONS } from './data/missions.js';
import { ACCOUNTS } from './data/accounts.js';
import { DISTRICTS } from './data/districts.js';
import { generateMilestoneCard, shareMilestoneCard } from './utils/milestone-card.js';
import { renderCityMap } from './screens/city-map.js';
import { renderDistrict } from './screens/district.js';
import { renderBriefing } from './screens/briefing.js';
import { renderDebrief } from './screens/debrief.js';
import { renderStats } from './screens/stats.js';
import { renderMilestone } from './screens/milestone.js';

let state = loadState();
let started = hasSavedState();

const app = document.getElementById('app');

const screens = {
  city: () => renderCityMap(state),
  district: ({ id, tab }) => renderDistrict(state, id, tab || 'recon'),
  briefing: ({ id }) => renderBriefing(state, id),
  debrief: ({ id }) => renderDebrief(state, id),
  milestone: ({ districtId }) => renderMilestone(state, districtId),
  stats: () => renderStats(state),
};

function renderWelcome() {
  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 32px 24px;">
    <div style="font-family: var(--font-display); font-size: 42px; font-weight: 800; color: var(--cyan); letter-spacing: 6px; text-shadow: 0 0 24px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.2);">RECLAIM CITY</div>
    <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: rgba(0,229,255,0.6); letter-spacing: 5px; margin-top: 12px;">TAKE BACK YOUR DATA</div>
    <p style="max-width: 440px; font-size: 14px; line-height: 1.7; color: rgba(237,239,243,0.65); margin-top: 32px;">Your city has been taken by data brokers. Take it back, building by building.</p>
    <div data-action="begin-game" class="btn-primary" style="margin-top: 40px; display: inline-block;">BEGIN</div>
  </div>`;
}

function render(route) {
  if (!started) {
    app.innerHTML = renderWelcome();
    return;
  }
  try {
    const renderFn = screens[route.screen] || screens.city;
    app.innerHTML = renderFn(route.params);
  } catch (error) {
    console.error('Render failed', error);
    app.innerHTML = `<div style="padding: 40px; text-align: center;">
      <h2 style="color: var(--magenta);">Something broke</h2>
      <p>The error has been reported. <a href="#/city">Return to city</a></p>
    </div>`;
  }
}

function renderCurrentRoute() {
  render(parseRoute(location.hash));
}

function setState(next) {
  state = next;
  try {
    saveState(state);
  } catch {
    console.error('saveState failed; state kept in memory only');
    // TODO(telemetry): captureError here
  }
}

function submitDebrief(missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return navigate('#/city');

  const answers = {};
  for (const q of mission.debriefQs) {
    const el = app.querySelector(`input[name="q_${q.id}"]:checked`);
    if (el) answers[q.id] = el.value;
  }
  if (Object.keys(answers).length === 0) return;

  const deferred = Object.values(answers).some((v) => v === 'skip' || v === 'later');
  const updated = updateMission(state, missionId, {
    status: deferred ? 'skipped' : 'completed',
    finding: answers.finding,
    action: answers.action,
  });
  setState(updateStreak(updated));

  const districtId = ACCOUNTS[mission.accountId]?.district;
  const progress = calcDistrictProgress(state, districtId);
  if (progress.total > 0 && progress.percent === 100) {
    navigate(`#/milestone/${districtId}`);
  } else {
    navigate(`#/district/${districtId}`);
  }
}

function districtCardStats(districtId) {
  const missions = MISSIONS.filter((m) => ACCOUNTS[m.accountId]?.district === districtId);
  const completed = missions.filter((m) => state.missions[m.id]?.status === 'completed');
  const breachesFixed = completed.filter((m) => {
    const f = state.missions[m.id]?.finding;
    return f && f !== 'no-breaches';
  }).length;
  const accountsSecured = Object.entries(ACCOUNTS).filter(
    ([id, a]) => a.district === districtId && state.accounts[id]?.enabled,
  ).length;
  return { accountsSecured, breachesFixed, integrityPercent: calcIntegrity(state) };
}

async function handleShareCard(districtId) {
  const district = DISTRICTS.find((d) => d.id === districtId);
  if (!district) return;
  const cardStats = districtCardStats(districtId);
  const preview = document.getElementById('milestone-card-preview');
  try {
    const canvas = generateMilestoneCard(district.name, cardStats);
    if (preview) {
      preview.innerHTML = '';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.objectFit = 'contain';
      preview.appendChild(canvas);
    }
  } catch {
    if (preview) preview.innerHTML = '';
  }
  await shareMilestoneCard(district.name, cardStats);
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !app.contains(el)) return;
  const action = el.dataset.action;

  if (action === 'go-do-it') {
    if (el.dataset.url) window.open(el.dataset.url, '_blank', 'noopener');
    navigate(`#/mission/${el.dataset.mission}/debrief`);
  } else if (action === 'submit-debrief') {
    submitDebrief(el.dataset.mission);
  } else if (action === 'toggle-account') {
    const id = el.dataset.account;
    if (state.accounts[id]) {
      setState(toggleAccount(state, id, !state.accounts[id].enabled));
      renderCurrentRoute();
    }
  } else if (action === 'share-card') {
    handleShareCard(el.dataset.district);
  } else if (action === 'begin-game') {
    started = true;
    try {
      saveState(state);
    } catch {
      console.error('saveState failed; state kept in memory only');
      // TODO(telemetry): captureError here
    }
    renderCurrentRoute();
  }
});

window.reclaimCity = {
  navigate,
  get state() {
    return state;
  },
  saveState,
  updateMission,
  updateStreak,
  toggleAccount,
  setState,
};

initRouter(render);
