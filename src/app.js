import { isAnalyticsOff, setAnalyticsOff, getOptedOutAt, setOptedOutAt, getOptedOutNonce, newNonce } from './utils/analytics-pref.js';
import { track, trackNow, trackPageview, trackThenStop, waitForTracker } from './utils/analytics.js';
import { restoreEvents, deletedKinds } from './utils/restore.js';
import { GHOST_DIALOGUE, RESTORE_DIALOGUE } from './data/dialogue.js';
import { fetchCollective, fetchWhoami, shouldAutoLoad } from './utils/collective.js';
import { setChosenPod } from './utils/pod-pref.js';
import { initRouter, navigate, parseRoute, tracksPageview, RENDER_CAUSE } from './router.js';
import { hasSavedState, loadState, saveState, updateMission, updateStreak, toggleAccount, markMissionStarted } from './state.js';
import { calcDistrictProgress, calcIntegrity, isBreachFound } from './utils/calc.js';
import { MISSIONS, missionDistrict } from './data/missions.js';
import { fileDebrief, recordNotNeeded, missionEventData, visibleQuestions } from './utils/debrief.js';
import { ensureBurst, startBurst } from './utils/bursts.js';
import { applyCategoryAction } from './utils/pm-categories.js';
import { isMissionDone } from './utils/mission-status.js';
import { keyActivationTarget } from './utils/keyboard.js';
import { ACCOUNTS } from './data/accounts.js';
import { DISTRICTS } from './data/districts.js';
import { generateMilestoneCard, shareMilestoneCard, shareStatCard } from './utils/milestone-card.js';
import { renderCityMap } from './screens/city-map.js';
import { renderDistrict } from './screens/district.js';
import { renderBriefing } from './screens/briefing.js';
import { renderDebrief, debriefReaction } from './screens/debrief.js';
import { renderStats } from './screens/stats.js';
import { renderCityTogether, cityStats } from './screens/city-together.js';
import { renderGhost, renderGhostDone, renderGhostEarly } from './screens/ghost.js';
import { isCityComplete, hasGoneGhost, markGoneGhost, clearGhost, getGhostInfo, isGhostPending, notYetRun } from './utils/ghost.js';
import { renderMilestone } from './screens/milestone.js';
import { renderQuickQuest } from './screens/quick-quest.js';
import { renderPhishingQuiz } from './screens/phishing-quiz.js';
import { renderGarage, renderAddForm } from './screens/garage.js';
import { renderTimeline, renderSocialForm, renderEraQuestions, getEras } from './screens/timeline.js';
import { CAR_MANUFACTURERS } from './data/accounts-freeway.js';
import { initErrorTracking, captureError } from './utils/errors.js';
import { newScreenVisit, feelingDuration } from './components/scout.js';
import { noteFirstTwoFactor, twoFactorHugDue, markTwoFactorHugSeen } from './utils/scout-feelings.js';
import { briefingScout } from './screens/briefing.js';
import { shouldAskPermission, requestPermission, checkStreakReminder } from './utils/notifications.js';

initErrorTracking();


let state = ensureBurst(loadState());
let started = hasSavedState();

const app = document.getElementById('app');

let collectiveView = { status: 'idle' };
let whoamiView = { status: 'idle' };
let podPickerOpen = false;
// One line of feedback from a cancel/restore, shown only on the screen it belongs to.
let notice = { hash: null, text: '' };
let restoring = false;
// "Reset it anyway" on a password recon showed is fine (until the page reloads).
let resetAnywayMission = null;
// When the player last saw the city map before this visit (Scout waves after a while away).
let cityArrival;
// The first-2FA hug was on screen this visit; it counts as seen once they leave.
let twoFactorHugShown = false;
// Scout is cheering the player out of the briefing; ignore further clicks.
let leavingBriefing = false;
// Scout's reaction to the report just filed, shown on the district the player
// lands on: { districtId, reaction, landed }. Kept for that one visit.
let landingReaction = null;

function setNotice(text, hash = location.hash) {
  notice = { hash, text };
}

function currentNotice() {
  return notice.hash === location.hash ? notice.text : '';
}

function collectiveData() {
  return collectiveView.status === 'ready' ? collectiveView.data : null;
}

function loadCollective() {
  if (collectiveView.status === 'loading' || collectiveView.status === 'ready') return;
  collectiveView = { status: 'loading' };
  fetchCollective().then((r) => {
    collectiveView = r.ok ? { status: 'ready', data: r.data } : { status: 'error' };
    renderCurrentRoute();
  });
}

function loadWhoami() {
  if (whoamiView.status === 'loading') return;
  whoamiView = { status: 'loading' };
  renderCurrentRoute();
  fetchWhoami().then((r) => {
    whoamiView = r.ok ? { status: 'ready', data: r.data } : { status: 'error' };
    renderCurrentRoute();
  });
}

const screens = {
  city: () => renderCityMap(state, { collective: collectiveView, whoami: whoamiView, arrival: cityArrival }),
  district: ({ id, tab }) => renderDistrict(state, id, tab, {
    reaction: landingReaction?.landed && landingReaction.districtId === id ? landingReaction.reaction : null,
  }),
  briefing: ({ id }) => renderBriefing(state, id, { resetAnyway: resetAnywayMission === id }),
  debrief: ({ id }) => renderDebrief(state, id),
  milestone: ({ districtId }) => renderMilestone(state, districtId),
  quickquest: () => renderQuickQuest(state),
  phishing: () => renderPhishingQuiz(state),
  garage: () => renderGarage(state),
  timeline: () => renderTimeline(state),
  together: () => renderCityTogether(state, { collective: collectiveView, whoami: whoamiView, notice: currentNotice() }),
  ghost: () => renderGhost(state, { whoami: whoamiView, collective: collectiveView }),
  'ghost-done': () => renderGhostDone(state, { whoami: whoamiView, collective: collectiveView, notice: currentNotice() }),
  'ghost-early': () => renderGhostEarly(state, { whoami: whoamiView, collective: collectiveView, notice: currentNotice() }),
  stats: () => renderStats(state, { whoami: whoamiView, collective: collectiveView, podPickerOpen, notice: currentNotice() }),
};

function renderWelcome() {
  return `
  <div class="scanlines" style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 32px 24px;">
    <div style="font-family: var(--font-display); font-size: 42px; font-weight: 800; color: var(--cyan); letter-spacing: 6px; text-shadow: 0 0 24px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.2);">RECLAIM CITY</div>
    <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: rgba(0,229,255,0.6); letter-spacing: 5px; margin-top: 12px;">A DATA PRIVACY GAME</div>
    <p style="max-width: 440px; font-size: 15px; line-height: 1.7; color: rgba(237,239,243,0.65); margin-top: 32px;">Secure your accounts, opt out of data brokers, and learn to spot scams &mdash; one mission at a time. Every action you take is real.</p>
    <div data-action="begin-game" class="btn-primary" style="margin-top: 40px; display: inline-block;">PLAY &mdash; IT'S FREE</div>
    <div style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.35); margin-top: 16px; letter-spacing: 1px;">NO ACCOUNT NEEDED &middot; YOUR DATA STAYS IN YOUR BROWSER</div>
  </div>`;
}

function render(route, cause = RENDER_CAUSE.REFRESH) {
  if (!started) {
    app.innerHTML = renderWelcome();
    return;
  }
  if (shouldAutoLoad(route.screen, collectiveView.status)) loadCollective();
  if (shouldAutoLoad(route.screen, collectiveView.status, ['ghost', 'ghost-done', 'ghost-early'])) loadCollective();
  // Your City needs the published file's date to tell a pending deletion from one that went through.
  if ((getGhostInfo()?.early || getOptedOutAt()) && shouldAutoLoad(route.screen, collectiveView.status, ['stats'])) loadCollective();
  if (route.screen === 'ghost' && whoamiView.status === 'idle') loadWhoami();
  // A screen visit is what a pageview counts: arriving, not a re-draw.
  if (tracksPageview(cause)) startScreenVisit(route);
  try {
    const renderFn = screens[route.screen] || screens.city;
    app.innerHTML = renderFn(route.params);
    if (tracksPageview(cause)) trackPageview(location.href, route.screen);
    // Landing after SUBMIT REPORT: start at Scout's reaction, not the debrief's scroll position.
    if (tracksPageview(cause) && route.screen === 'district' && landingReaction?.landed) app.querySelector('[data-scout-reaction]')?.scrollIntoView({ block: 'start' });
    if (route.screen === 'city') {
      state.lastCityVisit = new Date().toISOString();
      setState(state);
    }
  } catch (error) {
    captureError(error, { screen: route.screen, params: route.params });
    app.innerHTML = `<div style="padding: 40px; text-align: center;">
      <h2 style="color: var(--magenta);">Something broke</h2>
      <p>The error has been reported. <a href="#/city">Return to city</a></p>
    </div>`;
  }
}

// Re-draw the current screen (data arrived, an action changed state). Not a
// pageview unless the caller says this is the player arriving on the screen.
// A new screen visit: Scout's feelings may play again, and the map remembers
// when the player last saw it.
function startScreenVisit(route) {
  newScreenVisit();
  leavingBriefing = false;
  if (twoFactorHugShown) {
    twoFactorHugShown = false;
    setState(markTwoFactorHugSeen(state));
  }
  if (route.screen === 'city') cityArrival = { before: state.lastCityVisit || null };
  if (landingReaction) {
    const arriving = !landingReaction.landed && route.screen === 'district' && route.params.id === landingReaction.districtId;
    landingReaction = arriving ? { ...landingReaction, landed: true } : null;
  }
  if (route.screen === 'debrief' && twoFactorHugDue(state, route.params.id)) twoFactorHugShown = true;
}

// Scout cheers the player off (goDoIt on the briefing), then the game moves on.
function cheerThenGo(hash) {
  const slot = app.querySelector('[data-scout="briefing"]');
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!slot || still) return navigate(hash);
  leavingBriefing = true;
  slot.outerHTML = briefingScout('goDoIt');
  setTimeout(() => {
    if (leavingBriefing) navigate(hash);
  }, feelingDuration('goDoIt') + 150);
}

function renderCurrentRoute(cause = RENDER_CAUSE.REFRESH) {
  render(parseRoute(location.hash), cause);
}

function setState(next) {
  state = next;
  try {
    saveState(state);
  } catch (error) {
    captureError(error, { screen: 'saveState' });
  }
}

function submitDebrief(missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return navigate('#/city');

  // Nothing happens until every question on screen is answered.
  const filed = fileDebrief(state, mission, readAnswers(app, mission));
  if (!filed) return;
  setState(ensureBurst(updateStreak(noteFirstTwoFactor(filed.state, mission, filed.state.missions[missionId]))));
  afterMissionRecorded(mission, filed.event);
}

// What the debrief form says now: radio values, pick-all lists, numbers
// (or the option beside a number, like "couldn't check").
function readAnswers(root, mission) {
  const answers = {};
  for (const q of mission.debriefQs) {
    const checked = [...root.querySelectorAll(`input[name="q_${q.id}"]:checked`)].map((el) => el.value);
    if (q.type === 'number') {
      const typed = root.querySelector(`input[type="number"][name="q_${q.id}"]`)?.value;
      if (checked.length) answers[q.id] = checked[0];
      else if (typed !== undefined && typed !== '') answers[q.id] = typed;
    } else if (q.multi) {
      if (checked.length) answers[q.id] = checked;
    } else if (checked.length) answers[q.id] = checked[0];
  }
  return answers;
}

// "GOT IT" on a password reset the player's own recon showed isn't needed.
function markNotNeeded(missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return;
  const next = recordNotNeeded(state, missionId);
  if (next === state) return;
  setState(ensureBurst(updateStreak(next)));
  afterMissionRecorded(mission, { status: 'not-needed' });
}

// Shared tail of filing a mission: progress check-ins, the event, the
// district milestone or back to the district.
// event: what to track ({ status }), or null to send nothing.
function afterMissionRecorded(mission, event) {
  const missionId = mission.id;
  const record = state.missions[missionId];
  const status = event?.status;
  const districtId = missionDistrict(mission);
  // Already taken back before this filing (a bonus mission in a finished
  // district): no second district-completed, no second milestone.
  const wasComplete = Boolean(state.seenProgress?.[districtId]?.includes(100));
  // Scout's reaction, before this filing's progress check-in is marked seen
  // below; picked once so a re-draw doesn't change the line.
  const reaction = debriefReaction(state, mission);

  // Track progress milestones for Scout check-ins
  if (districtId && isMissionDone(record)) {
    const progress = calcDistrictProgress(state, districtId);
    if (!state.seenProgress) state.seenProgress = {};
    if (!state.seenProgress[districtId]) state.seenProgress[districtId] = [];
    for (const m of [25, 50, 75, 100]) {
      if (progress.percent >= m && !state.seenProgress[districtId].includes(m)) {
        state.seenProgress[districtId].push(m);
      }
    }
    setState(state);
  }

  // Track which lore entries have been seen
  if (districtId) {
    if (!state.seenLore) state.seenLore = {};
    if (!state.seenLore[districtId]) state.seenLore[districtId] = [];
  }

  // "Change the next 3" sends one event, when the whole job is done (not per
  // burst); no counts are ever sent.
  if (event) track('mission-completed', missionEventData(mission, { ...record, status: event.status }));
  if (status === 'completed' && shouldAskPermission(state)) {
    requestPermission();
  }

  const progress = calcDistrictProgress(state, districtId);
  if (progress.total > 0 && progress.percent === 100 && !wasComplete) {
    track('district-completed', { district: districtId });
    navigate(`#/milestone/${districtId}`);
  } else {
    const targetTab = mission.phase ? `?tab=${mission.phase}` : '';
    landingReaction = reaction ? { districtId, reaction, landed: false } : null;
    // The first-2FA hug plays on the landing screen, so it counts as seen.
    if (reaction?.feeling === 'hug') setState(markTwoFactorHugSeen(state));
    navigate(`#/district/${districtId}${targetTab}`);
  }
}

function districtCardStats(districtId) {
  const missions = MISSIONS.filter((m) => ACCOUNTS[m.accountId]?.district === districtId);
  const completed = missions.filter((m) => state.missions[m.id]?.status === 'completed');
  const breachesFixed = completed.filter((m) => isBreachFound(m.id, state.missions[m.id])).length;
  const accountsSecured = Object.entries(ACCOUNTS).filter(
    ([id, a]) => a.district === districtId && state.accounts[id]?.enabled,
  ).length;
  return { accountsSecured, breachesFixed, integrityPercent: calcIntegrity(state) };
}

// Turn sharing back on and wait for the analytics script to be able to send.
async function reconnectAnalytics() {
  setAnalyticsOff(false);
  if (typeof window.__rcLoadAnalytics === 'function') window.__rcLoadAnalytics();
  return waitForTracker({ timeoutMs: 3000 });
}

// Call off an early ghost before tonight's run. The ghost flag clears either way.
async function cancelGhost() {
  // The cancel carries the nonce sent with went-ghost-early: only that matches.
  const nonce = getGhostInfo()?.nonce;
  const sent = Boolean(nonce) && (await reconnectAnalytics()) && (await trackNow('ghost-cancelled', { nonce }));
  clearGhost();
  // From the finale, go where the ghost state (and any failure) is shown.
  const hash = parseRoute(location.hash).screen === 'ghost-done' ? '#/city-together' : location.hash;
  setNotice(sent ? '' : GHOST_DIALOGUE.cancelFailed, hash);
  if (hash !== location.hash) navigate(hash);
  else renderCurrentRoute();
}

// Sharing back on while an opt-out is still pending: tell tonight's run not to delete.
async function cancelOptOut() {
  const nonce = getOptedOutNonce();
  const sent = Boolean(nonce) && (await reconnectAnalytics()) && (await trackNow('opt-out-cancelled', { nonce }));
  if (sent) setOptedOutAt(null);
  else setNotice(GHOST_DIALOGUE.cancelFailed);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Re-send this browser's saved game after tonight's run deleted it.
async function restoreData() {
  if (restoring) return;
  const kinds = deletedKinds({ ghostInfo: getGhostInfo(), optedOutAt: getOptedOutAt(), collective: collectiveData() });
  if (kinds.length === 0) return;
  restoring = true;
  const wasOff = isAnalyticsOff();
  try {
    if (!(await reconnectAnalytics())) {
      // Nothing was sent: leave sharing as the player had it.
      setAnalyticsOff(wasOff);
      setNotice(RESTORE_DIALOGUE.failed);
      return;
    }
    for (const kind of kinds) track('data-restored', { kind });
    const events = restoreEvents(state);
    for (let i = 0; i < events.length; i += 10) {
      for (const e of events.slice(i, i + 10)) track(e.name, e.data);
      setNotice(RESTORE_DIALOGUE.progress(Math.min(i + 10, events.length), events.length));
      renderCurrentRoute();
      if (i + 10 < events.length) await sleep(500);
    }
    clearGhost();
    setOptedOutAt(null);
    if (parseRoute(location.hash).screen === 'ghost-done') {
      setNotice(RESTORE_DIALOGUE.done, '#/stats');
      navigate('#/stats');
      return;
    }
    setNotice(RESTORE_DIALOGUE.done);
  } finally {
    restoring = false;
    renderCurrentRoute();
  }
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

app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !app.contains(el)) return;
  const action = el.dataset.action;

  if (leavingBriefing && (action === 'go-do-it' || action === 'i-did-it')) {
    e.preventDefault();
    return;
  }
  if (action === 'go-do-it') {
    const mission = MISSIONS.find((m) => m.id === el.dataset.mission);
    // Save first: on phones the new tab can get this one reloaded.
    setState(markMissionStarted(state, el.dataset.mission));
    if (el.dataset.url) window.open(el.dataset.url, '_blank', 'noopener');
    track('mission-started', { mission: el.dataset.mission, phase: mission?.phase });
    cheerThenGo(`#/mission/${el.dataset.mission}/debrief`);
  } else if (action === 'i-did-it') {
    // A plain link without JS; here Scout cheers first.
    e.preventDefault();
    cheerThenGo(`#/mission/${el.dataset.mission}/debrief`);
  } else if (action === 'mission-step') {
    // A step link opens the real site itself (default action is left alone);
    // just remember the start so the briefing offers "I did it" on return.
    const firstTime = !state.startedMissions?.[el.dataset.mission];
    setState(markMissionStarted(state, el.dataset.mission));
    if (firstTime) {
      const mission = MISSIONS.find((m) => m.id === el.dataset.mission);
      track('mission-started', { mission: el.dataset.mission, phase: mission?.phase });
    }
    setTimeout(() => renderCurrentRoute(), 0);
  } else if (action === 'submit-debrief') {
    submitDebrief(el.dataset.mission);
  } else if (action === 'password-not-needed') {
    markNotNeeded(el.dataset.mission);
  } else if (action === 'reset-anyway') {
    resetAnywayMission = el.dataset.mission;
    renderCurrentRoute();
  } else if (action === 'line-up-burst') {
    setState(startBurst(state));
    renderCurrentRoute();
  } else if (action.startsWith('pm-cat-')) {
    // The per-category ask. Local only: nothing here is ever tracked.
    const districtId = el.dataset.district;
    const kind = { 'pm-cat-flag': 'flag', 'pm-cat-changed': 'changed', 'pm-cat-none': 'clear', 'pm-cat-clear': 'clear', 'pm-cat-reopen': 'reopen' }[action];
    const raw = app.querySelector(`#pm-cat-num-${districtId}`)?.value;
    const next = applyCategoryAction(state, districtId, kind, raw);
    if (next !== state) {
      setState(next);
      renderCurrentRoute();
    }
  } else if (action === 'set-password-manager') {
    setState({ ...state, passwordManager: el.dataset.pm });
    renderCurrentRoute();
  } else if (action === 'toggle-account') {
    const id = el.dataset.account;
    if (state.accounts[id]) {
      const enabled = !state.accounts[id].enabled;
      setState(toggleAccount(state, id, enabled));
      track('account-toggled', { account: id, enabled });
      renderCurrentRoute();
    }
  } else if (action === 'toggle-analytics') {
    if (isAnalyticsOff()) {
      const optedOutAt = getOptedOutAt();
      if ((optedOutAt || getGhostInfo()?.early) && collectiveView.status !== 'ready') {
        // Pending or already deleted depends on the published file: never
        // cancel (or forget the opt-out) before it has loaded.
        loadCollective();
        renderCurrentRoute();
        return;
      }
      if (isGhostPending(getGhostInfo(), collectiveData())) {
        // Sharing back on is calling off the early ghost too.
        await cancelGhost();
        return;
      } else if (optedOutAt && notYetRun(optedOutAt, collectiveData())) {
        // The farewell is already on our server; without this, tonight's run still deletes.
        await cancelOptOut();
      } else {
        setAnalyticsOff(false);
        // Turning it back on in a session that never loaded the script: load it now.
        if (typeof window.__rcLoadAnalytics === 'function') window.__rcLoadAnalytics();
      }
    } else {
      // Say goodbye first so tonight's job can find and delete this browser's data.
      const nonce = newNonce();
      await trackThenStop('opted-out', nonce ? { nonce } : undefined);
      setOptedOutAt(new Date().toISOString(), nonce);
    }
    renderCurrentRoute();
  } else if (action === 'share-card') {
    handleShareCard(el.dataset.district);
  } else if (action === 'share-stat') {
    const stat = cityStats(collectiveData()?.city).find((st) => st.key === el.dataset.stat);
    if (stat) shareStatCard(stat);
  } else if (action === 'quiz-verdict') {
    const msgId = Number(el.dataset.msgId);
    const verdict = el.dataset.verdict;
    const tell = app.querySelector(`[data-quiz-tell="${msgId}"]`)?.value || '';
    if (!state.phishingQuiz) state.phishingQuiz = { curated: {}, streak: 0, bestStreak: 0, quizRound: 0, quizAnswers: {} };
    const { CURATED_MESSAGES } = await import('./data/phishing.js');
    const msg = CURATED_MESSAGES.find(m => m.id === msgId);
    if (!msg) return;
    const correct = verdict === msg.answer;
    state.phishingQuiz.curated[msgId] = { verdict, tell, correct };
    if (correct) {
      state.phishingQuiz.streak = (state.phishingQuiz.streak || 0) + 1;
      state.phishingQuiz.bestStreak = Math.max(state.phishingQuiz.bestStreak || 0, state.phishingQuiz.streak);
    } else {
      state.phishingQuiz.streak = 0;
    }
    setState(state);
    renderCurrentRoute();
  } else if (action === 'quiz-next') {
    renderCurrentRoute();
  } else if (action === 'quiz-bank-verdict') {
    const msgId = Number(el.dataset.msgId);
    const verdict = el.dataset.verdict;
    const tell = app.querySelector(`[data-quiz-bank-tell="${msgId}"]`)?.value || '';
    if (!state.phishingQuiz) state.phishingQuiz = { curated: {}, streak: 0, bestStreak: 0, quizRound: 0, quizAnswers: {} };
    const { MESSAGE_BANK } = await import('./data/phishing.js');
    const msg = MESSAGE_BANK.find(m => m.id === msgId);
    if (!msg) return;
    const correct = verdict === msg.answer;
    state.phishingQuiz.quizAnswers[msgId] = { verdict, tell, correct };
    if (correct) {
      state.phishingQuiz.streak = (state.phishingQuiz.streak || 0) + 1;
      state.phishingQuiz.bestStreak = Math.max(state.phishingQuiz.bestStreak || 0, state.phishingQuiz.streak);
    } else {
      state.phishingQuiz.streak = 0;
    }
    setState(state);
    renderCurrentRoute();
  } else if (action === 'quiz-bank-next') {
    renderCurrentRoute();
  } else if (action === 'add-custom-account') {
    const districtId = el.dataset.district;
    const input = app.querySelector('#custom-account-input');
    const name = input?.value?.trim();
    if (!name) return;
    if (!state.customAccounts) state.customAccounts = {};
    if (!state.customAccounts[districtId]) state.customAccounts[districtId] = [];
    state.customAccounts[districtId].push(name);
    setState(state);
    renderCurrentRoute();
  } else if (action === 'dismiss-intro') {
    const districtId = el.dataset.district;
    if (!state.seenIntros) state.seenIntros = {};
    state.seenIntros[districtId] = true;
    setState(state);
    renderCurrentRoute();
  } else if (action === 'remove-custom-account') {
    const districtId = el.dataset.district;
    const index = Number(el.dataset.index);
    if (state.customAccounts?.[districtId]) {
      state.customAccounts[districtId].splice(index, 1);
      setState(state);
      renderCurrentRoute();
    }
  } else if (action === 'show-add-vehicle') {
    const container = app.querySelector('#add-form-container');
    if (container) {
      container.innerHTML = renderAddForm();
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else if (action === 'cancel-add-vehicle') {
    const container = app.querySelector('#add-form-container');
    if (container) container.innerHTML = '';
  } else if (action === 'add-vehicle') {
    const make = app.querySelector('#vehicle-make')?.value;
    const model = app.querySelector('#vehicle-model')?.value?.trim();
    const year = app.querySelector('#vehicle-year')?.value?.trim();
    const nickname = app.querySelector('#vehicle-nickname')?.value?.trim();
    if (!make || !model || !year) return;
    if (!state.vehicles) state.vehicles = [];
    state.vehicles.push({ make, model, year, nickname: nickname || '', addedAt: new Date().toISOString() });
    const mfr = CAR_MANUFACTURERS.find((m) => m.makes.some((n) => n.toLowerCase() === make.toLowerCase()));
    if (mfr && state.accounts[mfr.id]) {
      state.accounts[mfr.id].enabled = true;
    }
    state.accounts.car_broker_lexisnexis = { ...state.accounts.car_broker_lexisnexis, enabled: true };
    state.accounts.car_broker_verisk = { ...state.accounts.car_broker_verisk, enabled: true };
    setState(state);
    track('vehicle-added', { make, year });
    renderCurrentRoute();
  } else if (action === 'remove-vehicle') {
    const index = Number(el.dataset.index);
    if (state.vehicles && state.vehicles[index]) {
      state.vehicles.splice(index, 1);
      setState(state);
      renderCurrentRoute();
    }
  } else if (action === 'edit-social-profile') {
    const container = app.querySelector('#social-form-container');
    const platformId = el.dataset.platform;
    if (container) {
      container.innerHTML = renderSocialForm(platformId);
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const yearSelect = app.querySelector('#social-join-year');
      if (yearSelect) {
        const profile = state.socialHistory?.[platformId];
        if (profile?.joinYear) yearSelect.value = String(profile.joinYear);
        yearSelect.addEventListener('change', () => {
          const year = parseInt(yearSelect.value, 10);
          const eraDiv = app.querySelector('#era-questions');
          const eraContainer = app.querySelector('#era-container');
          if (year && eraDiv && eraContainer) {
            eraContainer.innerHTML = renderEraQuestions(year);
            eraDiv.hidden = false;
          }
        });
        if (profile?.joinYear) yearSelect.dispatchEvent(new Event('change'));
      }
    }
  } else if (action === 'cancel-social-profile') {
    const container = app.querySelector('#social-form-container');
    if (container) container.innerHTML = '';
  } else if (action === 'save-social-profile') {
    const platformId = el.dataset.platform;
    const yearSelect = app.querySelector('#social-join-year');
    const joinYear = parseInt(yearSelect?.value, 10);
    if (!joinYear) return;
    const eras = getEras(joinYear);
    const eraActivities = eras.map((_, i) => {
      const checked = app.querySelector(`input[name="era-${i}"]:checked`);
      return checked?.value || 'light';
    });
    if (!state.socialHistory) state.socialHistory = {};
    state.socialHistory[platformId] = { joinYear, eras: eraActivities };
    setState(state);
    renderCurrentRoute();
  } else if (action === 'begin-game') {
    started = true;
    try {
      saveState(state);
    } catch (error) {
      captureError(error, { screen: 'saveState' });
    }
    // Leaving the welcome screen is the first real view of the game.
    renderCurrentRoute(RENDER_CAUSE.NAVIGATE);
  } else if (action === 'whoami-open') {
    loadCollective();
    loadWhoami();
  } else if (action === 'go-ghost') {
    if (!isCityComplete(state) || hasGoneGhost()) return;
    if (isAnalyticsOff()) {
      // Sharing was already off: nothing to send, nothing to count.
      markGoneGhost({ silent: true });
    } else {
      markGoneGhost();
      await trackThenStop('went-ghost');
    }
    navigate('#/ghost/done');
  } else if (action === 'go-ghost-early') {
    if (isCityComplete(state) || hasGoneGhost() || isAnalyticsOff()) return;
    const nonce = newNonce();
    markGoneGhost({ early: true, nonce });
    await trackThenStop('went-ghost-early', nonce ? { nonce } : undefined);
    navigate('#/ghost/done');
  } else if (action === 'ghost-cancel') {
    if (!isGhostPending(getGhostInfo(), collectiveData())) return;
    await cancelGhost();
  } else if (action === 'restore-data') {
    await restoreData();
  } else if (action === 'collective-retry') {
    loadCollective();
    renderCurrentRoute();
  } else if (action === 'pod-pick-open') {
    podPickerOpen = true;
    loadCollective();
    renderCurrentRoute();
  } else if (action === 'pod-pick') {
    setChosenPod(el.dataset.pod);
    podPickerOpen = false;
    renderCurrentRoute();
  } else if (action === 'pod-pick-clear') {
    setChosenPod(null);
    podPickerOpen = false;
    renderCurrentRoute();
  } else if (action === 'whoami-confirm') {
    podPickerOpen = false;
    renderCurrentRoute();
  }
});

// role="button" actions answer Enter and Space like real buttons.
app.addEventListener('keydown', (e) => {
  // Enter in a per-category number box files it, like its button.
  if (e.key === 'Enter' && e.target?.id?.startsWith?.('pm-cat-num-')) {
    const btn = e.target.closest('[data-pm-category]')?.querySelector('[data-action="pm-cat-flag"], [data-action="pm-cat-changed"]');
    if (btn) { e.preventDefault(); btn.click(); }
    return;
  }
  const el = keyActivationTarget(e);
  if (!el || !app.contains(el)) return;
  e.preventDefault();
  el.click();
});

// Debrief follow-ups appear once the answers they depend on are given; in a
// pick-all-that-apply list, "none" and "couldn't check" stand alone, and a
// "couldn't check" beside a number clears the number (and the other way round).
function refreshDebriefForm(e) {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.name.startsWith('q_')) return;
  const form = input.closest('[data-debrief]');
  if (!form) return;
  if (input.type === 'checkbox' && input.checked) {
    const alone = input.value === 'none' || input.value === 'skip';
    for (const other of form.querySelectorAll(`input[name="${input.name}"]`)) {
      if (other === input) continue;
      if (other.type === 'number') { if (alone) other.value = ''; continue; }
      if (alone || other.value === 'none' || other.value === 'skip') other.checked = false;
    }
  }
  if (input.type === 'number' && input.value !== '') {
    for (const other of form.querySelectorAll(`input[type="checkbox"][name="${input.name}"]`)) other.checked = false;
  }
  const mission = MISSIONS.find((m) => m.id === form.dataset.debrief);
  if (!mission) return;
  const shown = new Set(visibleQuestions(mission, readAnswers(form, mission)).map((q) => q.id));
  for (const group of form.querySelectorAll('[data-question]')) group.hidden = !shown.has(group.dataset.question);
}
app.addEventListener('change', refreshDebriefForm);
app.addEventListener('input', refreshDebriefForm);

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
checkStreakReminder(state);
