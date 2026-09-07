import { initRouter, navigate } from './router.js';
import { loadState, saveState, updateMission, updateStreak, toggleAccount } from './state.js';

let state = loadState();

const app = document.getElementById('app');

// SCREEN MODULES: import renderers from src/screens/*.js here and replace the placeholder entries in `screens`
const screens = {
  city: () => `<div class="scanlines" style="padding: 40px; text-align: center;">
    <h1 style="font-family: var(--font-display); color: var(--cyan);">RECLAIM CITY</h1>
    <p>City map coming soon</p>
  </div>`,
  district: ({ id }) => `<div style="padding: 40px;"><p>District: ${id}</p></div>`,
  briefing: ({ id }) => `<div style="padding: 40px;"><p>Briefing: ${id}</p></div>`,
  debrief: ({ id }) => `<div style="padding: 40px;"><p>Debrief: ${id}</p></div>`,
  milestone: ({ districtId }) => `<div style="padding: 40px;"><p>Milestone: ${districtId}</p></div>`,
  stats: () => `<div style="padding: 40px;"><p>Stats dashboard</p></div>`,
};

function render(route) {
  const renderFn = screens[route.screen] || screens.city;
  app.innerHTML = renderFn(route.params);
}

function setState(next) {
  state = next;
  saveState(state);
}

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
