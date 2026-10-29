import { isAnalyticsOff, setAnalyticsOff, getOptedOutAt, setOptedOutAt, getOptedOutNonce, newNonce } from './utils/analytics-pref.js';
import { sendRestore, clearConfirmed } from './utils/restore-send.js';
import { track, trackNow, trackPageview, trackThenStop, waitForTracker } from './utils/analytics.js';
import { restoreEvents, deletedKinds } from './utils/restore.js';
import { GHOST_DIALOGUE, RESTORE_DIALOGUE } from './data/dialogue.js';
import { fetchCollective, fetchWhoami, shouldAutoLoad } from './utils/collective.js';
import { setChosenPod } from './utils/pod-pref.js';
import { initRouter, navigate, parseRoute, tracksPageview, RENDER_CAUSE } from './router.js';
import { localDay, hasSavedState, loadState, saveState, updateMission, updateStreak, streakAfterFiling, toggleAccount, markMissionStarted } from './state.js';
import { calcDistrictProgress, calcIntegrity, districtBreachedAddresses } from './utils/calc.js';
import { MISSIONS, missionDistrict } from './data/missions.js';
import { fileDebrief, applyRecheck, recheckWithChecklist, recordNotNeeded, missionEventData, visibleQuestions } from './utils/debrief.js';
import { ensureBurst, startBurst } from './utils/bursts.js';
import { applyCategoryAction } from './utils/pm-categories.js';
import { isMissionDone } from './utils/mission-status.js';
import { keyActivationTarget } from './utils/keyboard.js';
import { ACCOUNTS } from './data/accounts.js';
import { DISTRICTS } from './data/districts.js';
import { hasInterior } from './data/interiors/index.js';
import { generateMilestoneCard, shareMilestoneCard, shareStatCard } from './utils/milestone-card.js';
import { renderCityMap } from './screens/city-map.js';
import { renderDistrict } from './screens/district.js';
import { renderBuildingInterior } from './screens/building.js';
import { renderSaints } from './screens/saints.js';
import { renderBrokerMap } from './screens/broker-map.js';
import { renderBigCheck } from './screens/big-check.js';
import { initDecks, deckPositions, openFolds, restoreFolds, applyOpenDesktop, recordHandToggle, desktopFoldKey, rectOnScreen } from './components/deck.js';
import { nameMatches } from './utils/big-check.js';
import { loadBrokerData, brokerDataStatus, brokerData } from './utils/broker-data.js';
import { addDevice, removeDevice, newlySealed, markSealedSeen, setFloorOpen, lightCandle } from './utils/interior-state.js';
import { pageviewUrl, errorContext } from './utils/pageview-url.js';
import { renderBriefing } from './screens/briefing.js';
import { applyChecklistFiling, markMapSeen, markScoutSeen, markScoutPending, newlyLitIds, setBigCheck, setHome, homeOf } from './utils/broker-state.js';
import { guessFromWhoami } from './components/location-quiz.js';
import { mapScoutLine, mapScoutTriggers, cardScoutLine, bigCheckScoutLine } from './utils/broker-scout.js';
import { brokerLighting } from './utils/broker-lighting.js';
import { litIds, initialView, withRatio, zoomViewBox, zoomView, zoomAnchor, nearestStarId, VIEW_BOUNDS } from './utils/broker-view.js';
import { isTap, isWidest, keepStarInView, panView, pinchView, wheelView, wheelZooms, TAP_MAX_PX } from './utils/map-gestures.js';
import { HIT_PX } from './components/constellation.js';
import { checklistTicksFor } from './components/broker-checklist.js';
import { STUDIO_URL } from './components/hud.js';
import { mountClassAd } from './components/class-ad.js';
import { mountBugReporter } from './components/bug-reporter.js';
import { checklistFor } from './data/broker-checklists.js';
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
import { announceReady } from './utils/cabinet.js';
import { newScreenVisit, feelingDuration } from './components/scout.js';
import { noteFirstTwoFactor, twoFactorHugDue, markTwoFactorHugSeen } from './utils/scout-feelings.js';
import { briefingScout } from './screens/briefing.js';
import { shouldAskPermission, requestPermission, checkStreakReminder } from './utils/notifications.js';

initErrorTracking();

let state = ensureBurst(loadState());
let started = hasSavedState();

const app = document.getElementById('app');
// Folds the player set by hand this screen visit (see applyOpenDesktop), and the desktop width test.
let handFolds = new Map();
const desktopQuery = typeof matchMedia === 'function' ? matchMedia('(min-width: 900px)') : null;
function isDesktopWide() { return !!desktopQuery?.matches; }

let collectiveView = { status: 'idle' };
let whoamiView = { status: 'idle' };
let podPickerOpen = false;
// One line of feedback from a cancel/restore, shown only on the screen it belongs to.
let notice = { hash: null, text: '' };
let restoring = false;
// "Reset it anyway" on a password recon showed is fine (until the page reloads).
let resetAnywayMission = null;
// The last route drawn, and the building #/saints was opened from (memory only).
let lastRoute = null;
let saintsFrom = null;
// The broker map's view state (memory only, never in the URL).
let selectedId = null;
let view = null;
let newlyLit = [];
// The map's drawn size in CSS px ({ w, h }), measured after a render; it fills the phone's height.
let mapStage = null;
// This visit's bloom is still to be drawn (the data can arrive after the pageview render).
let mapVisitPending = false;
let mapFirstVisit = false;
let mapScoutDismissed = false;
// Scout's one-time lines (broker-scout.js), held for the visit (or the open card) that shows them:
// the map's { key, line }, the card's { id, line } and the Big Check's line. Each is marked seen in
// the save after the render that showed it, so a reload never repeats it.
let mapScout = null;
// This visit's triggered map lines that aren't the one shown: saved as pending (ruling T3-b).
let mapScoutPending = [];
let cardScout = null;
let bigCheckScout = null;
let editingResidency = false;
let mapListOpen = false;
// When the player last saw the city map before this visit (Scout waves after a while away).
let cityArrival;
// The first-2FA hug was on screen this visit; it counts as seen once they leave.
let twoFactorHugShown = false;
// Scout is cheering the player out of the briefing; ignore further clicks.
let leavingBriefing = false;
// Scout's reaction to the report just filed, shown on the district the player
// lands on: { districtId, reaction, landed }. Kept for that one visit.
let landingReaction = null;

function loadBrokerMapData() {
  loadBrokerData().then(() => renderCurrentRoute(), () => renderCurrentRoute());
}

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

// Looking the player up without asking: never once they've turned sharing off or gone ghost.
function guessAllowed() {
  return !isAnalyticsOff() && !hasGoneGhost();
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
  building: ({ id }) => renderBuildingInterior(state, id),
  saints: () => renderSaints(state, { from: saintsFrom }),
  'broker-map': () => {
    if (brokerDataStatus() === 'idle') loadBrokerMapData();
    const data = brokerDataStatus() === 'ready' ? brokerData() : null;
    if (data) {
      const lighting = brokerLighting(data.map, state, localDay());
      // The first draw of this visit blooms what the player hasn't seen lit yet (on a first
      // visit, every lit star). markMapSeen runs after it, and later re-draws pass none.
      if (mapVisitPending) {
        newlyLit = newlyLitIds(state, litIds(lighting));
        mapFirstVisit = !Array.isArray(state.brokerMap?.seenLit);
        // The first visit has Liz's line; the one-time lines start from the second.
        mapScout = mapFirstVisit ? null : mapScoutLine(state, data.map, lighting, newlyLit);
        mapScoutPending = mapScoutTriggers(state, data.map, lighting, newlyLit).filter((k) => k !== mapScout?.key);
      }
      if (!view && mapStage) view = initialView(data.map, data.layout, lighting, mapStage.h / mapStage.w);
    }
    return renderBrokerMap(state, {
      status: brokerDataStatus(), data, selectedId, view, newlyLit, stage: mapStage,
      firstVisit: mapFirstVisit && !mapScoutDismissed, editingResidency, listOpen: mapListOpen,
      quiz: { guess: guessFromWhoami(whoamiView), guessAllowed: guessAllowed(), guessStatus: whoamiView.status },
      scoutLine: mapScoutDismissed ? null : mapScout?.line ?? null,
      cardScoutLine: cardScout && cardScout.id === selectedId ? cardScout.line : null,
    });
  },
  'big-check': () => {
    if (brokerDataStatus() === 'idle') loadBrokerMapData();
    return renderBigCheck(state, { status: brokerDataStatus(), data: brokerDataStatus() === 'ready' ? brokerData() : null, today: localDay(), scoutLine: bigCheckScout });
  },
  briefing: ({ id }) => renderBriefing(state, id, { resetAnyway: resetAnywayMission === id }),
  debrief: ({ id }) => renderDebrief(state, id),
  recheck: ({ id }) => renderDebrief(state, id, { recheck: true }),
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
    <a href="${STUDIO_URL}welcome" target="_blank" rel="noopener" data-studio-link="welcome" style="font-family: var(--font-mono); font-size: 10px; color: rgba(198,255,0,0.6); margin-top: 40px; letter-spacing: 2px; text-decoration: none;">A MULTIVERSE GAMES GAME &middot; MORE FREE GAMES&nbsp;&#8599;</a>
    <button type="button" data-bug-report style="font-family: var(--font-mono); font-size: 10px; color: rgba(255,45,155,0.75); margin-top: 16px; letter-spacing: 2px; background: none; border: 0; min-height: 44px; padding: 8px 12px; cursor: pointer;">🐞 REPORT A BUG</button>
  </div>`;
}

// The building screen only counts as visited when it drew an actual interior.
const hasInteriorScreen = (route) => route.screen === 'building' && hasInterior(route.params.id) && state.accounts?.[route.params.id]?.enabled;

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
  // The sky's quiz starts from a guess, only for players who haven't turned sharing off or gone ghost.
  if (route.screen === 'broker-map' && whoamiView.status === 'idle' && homeOf(state) === null && guessAllowed()) loadWhoami();
  // A screen visit is what a pageview counts: arriving, not a re-draw.
  if (tracksPageview(cause)) startScreenVisit(route);
  try {
    // The saints gallery's back link: the building it was opened from. Kept
    // in memory only, never in the URL (pageviews read the URL).
    if (route.screen !== 'saints') saintsFrom = null;
    else if (lastRoute?.screen === 'building') saintsFrom = lastRoute.params.id;
    lastRoute = route;
    const renderFn = screens[route.screen] || screens.city;
    // The seal animation and Scout's line are in this render; remember they were seen
    // so a later re-render (a device add) does not replay them.
    const watched = hasInteriorScreen(route) ? newlySealed(state, route.params.id) : null;
    // The map re-draws on every zoom and tap: no screen fade on those (it flashes the sky).
    app.classList.toggle('map-refresh', route.screen === 'broker-map' && !tracksPageview(cause));
    // A re-draw (an action, data arriving) keeps each slide deck on its slide; arriving starts at slide 1.
    const decksBefore = tracksPageview(cause) ? null : deckPositions(app);
    // So does every fold the player opened (a saint's story, a full slip, an entry).
    const foldsBefore = tracksPageview(cause) ? null : openFolds(app);
    app.innerHTML = renderFn(route.params);
    if (route.screen === 'broker-map') afterBrokerMapRender(renderFn, route.params);
    restoreFolds(app, foldsBefore);
    // Arriving forgets the folds the player set by hand on the last screen.
    if (tracksPageview(cause)) handFolds = new Map();
    applyOpenDesktop(app, isDesktopWide(), handFolds);
    initDecks(app, decksBefore);
    // The Big Check's line is drawn once the data is in; then it's seen.
    if (route.screen === 'big-check' && bigCheckScout && brokerDataStatus() === 'ready') {
      const seen = markScoutSeen(state, 'bigCheck');
      if (seen !== state) setState(seen);
    }
    if (watched) {
      const seen = markSealedSeen(state, route.params.id, watched ?? []);
      if (seen !== state) setState(seen);
    }
    if (tracksPageview(cause)) trackPageview(pageviewUrl(route, location.href), route.screen);
    // Landing after SUBMIT REPORT: start at Scout's reaction, not the debrief's scroll position.
    if (tracksPageview(cause) && route.screen === 'district' && landingReaction?.landed) app.querySelector('[data-scout-reaction]')?.scrollIntoView({ block: 'start' });
    if (route.screen === 'city') {
      state.lastCityVisit = new Date().toISOString();
      setState(state);
    }
  } catch (error) {
    captureError(error, errorContext(route));
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
  // Each visit to the map opens fresh: zoomed in on the player's stars, nothing selected.
  if (route.screen === 'broker-map') {
    selectedId = null;
    cardReturn = null;
    view = null;
    newlyLit = [];
    editingResidency = false;
    mapListOpen = false;
    mapFirstVisit = false;
    mapScoutDismissed = false;
    mapScout = null;
    mapScoutPending = [];
    cardScout = null;
    mapVisitPending = true;
  }
  if (route.screen === 'big-check') bigCheckScout = bigCheckScoutLine(state);
  if (landingReaction) {
    const arriving = !landingReaction.landed && route.screen === 'district' && route.params.id === landingReaction.districtId;
    landingReaction = arriving ? { ...landingReaction, landed: true } : null;
  }
  if (route.screen === 'debrief' && twoFactorHugDue(state, route.params.id)) twoFactorHugShown = true;
}

// Scout cheers the player off (goDoIt on the briefing), then the game moves on.
function cheerThenGo(hash) {
  // A phone shows the Scout slide's sprite, a desktop the sidebar's: cheer with the one on
  // screen. A Scout slide scrolled out of its deck is not on screen: then go straight on.
  const slots = [...app.querySelectorAll('[data-scout="briefing"]')];
  const slot = slots.find((el) => rectOnScreen(el.getBoundingClientRect?.(), window.innerWidth, window.innerHeight));
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!slot || still) return navigate(hash);
  leavingBriefing = true;
  slot.outerHTML = briefingScout('goDoIt');
  setTimeout(() => {
    if (leavingBriefing) navigate(hash);
  }, feelingDuration('goDoIt') + 150);
}

// The map fills the viewport height below its header on a phone (Liz: "too tiny"), and stays
// about square on a wide screen. Measured after the draw; a changed size draws once more, in the
// same task, so nothing paints in between. Then this visit's bloom is marked seen.
function afterBrokerMapRender(renderFn, params) {
  const stage = app.querySelector('.map-stage');
  if (!stage) return;
  const w = stage.clientWidth;
  const top = stage.getBoundingClientRect().top + window.scrollY;
  const fill = window.innerHeight - top - 8;
  const h = Math.round(Math.max(320, window.innerWidth >= 900 ? Math.min(fill, w) : fill));
  if (w > 0 && (!mapStage || Math.abs(mapStage.w - w) > 1 || Math.abs(mapStage.h - h) > 1)) {
    mapStage = { w, h };
    if (view) view = withRatio(view, h / w);
    app.innerHTML = renderFn(params);
  }
  sizeSheet();
  if (mapVisitPending && brokerDataStatus() === 'ready') {
    const data = brokerData();
    let seen = markMapSeen(state, litIds(brokerLighting(data.map, state, localDay())));
    // This draw showed the visit's one-time line (if any): it never shows on a later visit.
    // The other lines this visit triggered wait for a later visit.
    seen = markScoutPending(seen, mapScoutPending);
    if (mapScout) seen = markScoutSeen(seen, mapScout.key);
    setState(seen);
    mapVisitPending = false;
    newlyLit = [];
  }
}

// A tap on the sky selects the nearest star within a 44px target (24 css px) and opens its card.
// A miss closes an open card; with no card open, a miss at the widest view zooms in on that point.
function tapSky(svg, clientX, clientY) {
  const data = brokerData();
  const ctm = svg.getScreenCTM?.();
  if (!data || !ctm || !ctm.a) return;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  const id = nearestStarId(data.layout, p.x, p.y, (HIT_PX + 2) / ctm.a);
  if (id) {
    openCard(id, selectedId ? cardReturn : '.map-stage');
    return;
  }
  if (selectedId) {
    closeCard();
    return;
  }
  const v = mapViewNow(data);
  if (isWidest(v)) {
    view = zoomView(v, 'in', p.x, p.y, VIEW_BOUNDS);
    renderCurrentRoute();
  }
}

// The star card. On a phone (<900px) it is a bottom sheet over the map (CSS: fixed, at most 60%
// of the screen, scrolls inside); from 900px it sits beside the map. Opening never scrolls the
// page: focus moves into the card, and on a phone the sky pans so the star shows above the sheet.
// Closing returns focus to whatever opened it (the stage, a zoom button or a list item).
let cardReturn = null;
const isPhone = () => !window.matchMedia?.('(min-width: 900px)').matches;

function openCard(id, returnTo) {
  selectedId = id;
  // Tapping a star is what Scout's first-visit note asks for; the note then gives the sky back.
  mapScoutDismissed = true;
  cardReturn = returnTo;
  // The first no-opt-out card carries Scout's line (in the card's flow); seen once it's drawn.
  const data = brokerData();
  const line = data ? cardScoutLine(state, brokerLighting(data.map, state, localDay()), id) : null;
  if (line) cardScout = { id, line };
  else if (cardScout?.id !== id) cardScout = null;
  renderCurrentRoute();
  if (line) setState(markScoutSeen(state, 'noOptOut'));
  keepSelectedInView();
  focusCard();
}

function closeCard() {
  const back = cardReturn;
  selectedId = null;
  cardReturn = null;
  cardScout = null;
  cardFocusPending = false;
  renderCurrentRoute();
  const el = (back && app.querySelector(back)) || app.querySelector('.map-stage');
  el?.focus({ preventScroll: true });
}

function keepSelectedInView() {
  if (!isPhone() || !selectedId) return;
  const data = brokerData();
  const svg = stageSvg();
  const card = app.querySelector('.star-card');
  const s = data?.layout?.stars?.find((x) => x?.[0] === selectedId);
  if (!s || !card || !svg) return;
  const r = svg.getBoundingClientRect();
  const visTop = Math.max(0, r.top);
  const visBottom = Math.min(r.bottom, card.getBoundingClientRect().top);
  let v = mapViewNow(data);
  // Screen point of the star for a view drawn in the same box (meet, same ratio).
  const onScreen = (w) => {
    const k = r.width / w.w;
    return { x: r.left + (s[1] - w.x) * k, y: r.top + (s[2] - w.y) * k };
  };
  let next = keepStarInView(v, r, onScreen(v), visTop, visBottom, VIEW_BOUNDS);
  if (!next) return;
  // The whole sky in view can't pan (it is centred on the map): step in on the star, then pan.
  const p0 = onScreen(next);
  if (p0.y > visBottom - 24 || p0.y < visTop + 24) {
    v = zoomView(v, 'in', s[1], s[2], VIEW_BOUNDS);
    next = keepStarInView(v, r, onScreen(v), visTop, visBottom, VIEW_BOUNDS) ?? v;
  }
  view = next;
  renderCurrentRoute();
}

// On a phone the sheet takes at most 60% of the map's visible height (and of the screen), so the
// sky above it always shows the selected star.
function sizeSheet() {
  const card = app.querySelector('.star-card');
  const stage = app.querySelector('.map-stage');
  if (!card || !stage) return;
  if (!isPhone()) { card.style.maxHeight = ''; return; }
  const r = stage.getBoundingClientRect();
  const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  card.style.maxHeight = `${Math.round(Math.max(200, Math.min(window.innerHeight * 0.6, visible * 0.6)))}px`;
}

// Focus moves to the card. A touch tap's compatibility mouse events land after pointerup and would
// blur it, so it is focused again when the tap's click is swallowed.
let cardFocusPending = false;
function focusCard() {
  cardFocusPending = true;
  app.querySelector('.star-card')?.focus({ preventScroll: true });
}

// Swipe the sheet's grab handle down to close it (phones).
let sheetDrag = null;
function sheetPointerDown(e) {
  const grab = e.target.closest?.('.star-card-grab');
  if (!grab || !app.contains(grab)) return;
  sheetDrag = { id: e.pointerId, y0: e.clientY, dy: 0 };
  try { grab.setPointerCapture(e.pointerId); } catch { /* the pointer may already be gone */ }
}
function sheetPointerMove(e) {
  if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
  e.preventDefault();
  sheetDrag.dy = Math.max(0, e.clientY - sheetDrag.y0);
  const card = app.querySelector('.star-card');
  if (card) card.style.transform = `translateY(${sheetDrag.dy}px)`;
}
function sheetPointerUp(e) {
  if (!sheetDrag || e.pointerId !== sheetDrag.id) return;
  const { dy } = sheetDrag;
  sheetDrag = null;
  if (e.type === 'pointerup' && dy > SHEET_CLOSE_PX) {
    swallowClickUntil = performance.now() + 400;
    closeCard();
  } else {
    const card = app.querySelector('.star-card');
    if (card) card.style.transform = '';
  }
}
const SHEET_CLOSE_PX = 60;

// Pinch-zoom and pan on the map stage (Liz: "I can't zoom"), with Pointer Events: up to two
// pointers. The stage has touch-action: none, so the page neither scrolls nor zooms on it; the
// rest of the page scrolls as usual. A drag writes the viewBox directly (no re-render); when the
// gesture ends the map re-draws once so labels and hit targets fit the new view. A press that
// stays within TAP_MAX_PX for under TAP_MAX_MS is a tap and selects; a drag never selects.
// Memory only: nothing here calls navigate, track or history.
let gesture = null;
// The click a handled press makes is swallowed (in the capture phase), so that a tap that
// scrolls the card under the finger never also clicks a link on it.
let swallowClickUntil = 0;
let wheelTimer = null;

const stageSvg = () => app.querySelector('.map-stage svg.constellation');
const pt = (e) => ({ x: e.clientX, y: e.clientY });

function drawViewBox(v) {
  const svg = stageSvg();
  if (svg) svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h ?? v.w}`);
}

function mapPointerDown(e) {
  const stage = e.target.closest?.('.map-stage');
  if (!stage || !app.contains(stage) || e.target.closest('.constellation-controls, .constellation-scout')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const data = brokerData();
  if (!data || !stageSvg()) return;
  if (!gesture) {
    gesture = { pointers: new Map(), start: { ...pt(e), t: e.timeStamp }, maxMoved: 0, multi: false, dragging: false, view: mapViewNow(data) };
  } else if (gesture.pointers.size >= 2) return;
  gesture.pointers.set(e.pointerId, pt(e));
  if (gesture.pointers.size > 1) gesture.multi = true;
  try { stage.setPointerCapture(e.pointerId); } catch { /* the pointer may already be gone */ }
}

function mapPointerMove(e) {
  if (!gesture || !gesture.pointers.has(e.pointerId)) return;
  const svg = stageSvg();
  if (!svg) return;
  e.preventDefault();
  const rect = svg.getBoundingClientRect();
  const prev = gesture.pointers.get(e.pointerId);
  const next = pt(e);
  if (gesture.pointers.size === 2) {
    const [ida, idb] = [...gesture.pointers.keys()];
    const before = [gesture.pointers.get(ida), gesture.pointers.get(idb)];
    gesture.pointers.set(e.pointerId, next);
    const after = [gesture.pointers.get(ida), gesture.pointers.get(idb)];
    gesture.view = pinchView(gesture.view, rect, before, after, VIEW_BOUNDS);
    gesture.dragging = true;
  } else {
    gesture.pointers.set(e.pointerId, next);
    if (!gesture.multi) gesture.maxMoved = Math.max(gesture.maxMoved, Math.hypot(next.x - gesture.start.x, next.y - gesture.start.y));
    if (!gesture.dragging && (gesture.multi || gesture.maxMoved >= TAP_MAX_PX)) {
      // Past the tap slop: the map catches up with the whole move so far.
      gesture.dragging = true;
      const from = gesture.multi ? prev : gesture.start;
      gesture.view = panView(gesture.view, rect, next.x - from.x, next.y - from.y, VIEW_BOUNDS);
    } else if (gesture.dragging) {
      gesture.view = panView(gesture.view, rect, next.x - prev.x, next.y - prev.y, VIEW_BOUNDS);
    }
  }
  if (gesture.dragging) {
    view = gesture.view;
    drawViewBox(view);
    app.querySelector('.map-stage')?.classList.add('is-dragging');
  }
}

function mapPointerUp(e) {
  if (!gesture || !gesture.pointers.has(e.pointerId)) return;
  gesture.pointers.delete(e.pointerId);
  if (gesture.pointers.size > 0) return; // one finger of a pinch lifted: the other pans on
  const g = gesture;
  gesture = null;
  swallowClickUntil = performance.now() + 400; // the click that follows this press is handled here
  const tap = e.type === 'pointerup' && !g.multi && isTap(g.start, { ...pt(e), t: e.timeStamp }, g.maxMoved);
  const svg = stageSvg();
  if (tap && svg) tapSky(svg, e.clientX, e.clientY);
  else if (g.dragging) renderCurrentRoute();
}

// Ctrl/cmd + wheel over the stage zooms about the pointer (a trackpad pinch arrives as a ctrl+wheel
// with small deltas). A plain wheel scrolls the page as usual; the +/- buttons are always there.
function mapWheel(e) {
  const stage = e.target.closest?.('.map-stage');
  if (!stage || !app.contains(stage)) return;
  const svg = stageSvg();
  const data = brokerData();
  if (!svg || !data || !wheelZooms(e)) return;
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
  const dy = e.deltaY * unit * (e.ctrlKey ? 4 : 1);
  view = wheelView(mapViewNow(data), svg.getBoundingClientRect(), dy, e.clientX, e.clientY, VIEW_BOUNDS);
  drawViewBox(view);
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => {
    if (parseRoute(location.hash).screen === 'broker-map') renderCurrentRoute();
  }, 180);
}

function mapViewNow(data) {
  if (view) return view;
  const ratio = mapStage ? mapStage.h / mapStage.w : 1;
  return initialView(data.map, data.layout, brokerLighting(data.map, state, localDay()), ratio);
}

// Map controls: in-memory only. No track(), no navigate(), nothing in the URL.
function mapAction(action, el) {
  const data = brokerData();
  if (action === 'map-zoom') {
    if (!data) return;
    const dir = el.dataset.dir;
    if (dir === 'reset') view = initialView(data.map, data.layout, brokerLighting(data.map, state, localDay()), mapStage ? mapStage.h / mapStage.w : 1);
    else {
      // About the selected star, else the lit bunch, else the centre: the player's stars stay in frame.
      const v = mapViewNow(data);
      const at = zoomAnchor(v, data.layout, brokerLighting(data.map, state, localDay()), selectedId);
      view = zoomViewBox(v, dir === 'in' ? 2 : 0.5, at?.x, at?.y, VIEW_BOUNDS);
    }
    renderCurrentRoute();
    app.querySelector(`[data-action="map-zoom"][data-dir="${dir === 'out' ? 'out' : dir === 'in' ? 'in' : 'reset'}"]`)?.focus();
  } else if (action === 'select-star') {
    const index = Number(el.dataset.star);
    const s = data?.layout?.stars?.[index];
    if (!s) return;
    const v = mapViewNow(data);
    const h = v.h ?? v.w;
    view = zoomViewBox({ ...v, x: s[1] - v.w / 2, y: s[2] - h / 2 }, 1, s[1], s[2], VIEW_BOUNDS);
    // Focus moves into the card (on a phone, the sheet) and comes back to this row on close.
    openCard(s[0], `[data-action="select-star"][data-star="${index}"]`);
  } else if (action === 'close-star') {
    closeCard();
  } else if (action === 'dismiss-scout') {
    mapScoutDismissed = true;
    renderCurrentRoute();
    app.querySelector('.map-stage')?.focus({ preventScroll: true });
  } else if (action === 'map-list') {
    mapListOpen = !mapListOpen;
    renderCurrentRoute();
    app.querySelector('[data-action="map-list"]')?.focus();
  } else if (QUIZ_ACTIONS.has(action)) {
    quizAction(action, el);
  }
}

// A Big Check tick, on the Big Check or on a star's card. Saved in the game only: no track(), no
// navigate(), nothing in the URL. The Big Check isn't re-drawn (its scroll and open groups stay);
// its group count changes in place. The map re-draws (a REFRESH), so the star lights.
function bigCheckChange(e) {
  const box = e.target;
  if (!(box instanceof HTMLInputElement) || box.type !== 'checkbox' || !box.matches('[data-big-check]')) return;
  const id = box.dataset.bigCheck;
  setState(setBigCheck(state, id, box.checked, localDay()));
  const screen = parseRoute(location.hash).screen;
  if (screen === 'big-check') {
    // Recounted from the boxes: only rows without a mission count (a stale mission-row tick doesn't).
    const details = box.closest('details');
    const count = details?.querySelector('[data-big-check-count]');
    if (count) count.textContent = String(details.querySelectorAll('.big-check-row:not(.big-check-row-mission) [data-big-check]:checked').length);
  } else if (screen === 'broker-map') {
    // The re-draw builds a new card: keep the sheet where it was, so the tapped box stays in view.
    const scrollTop = app.querySelector('.star-card')?.scrollTop ?? 0;
    renderCurrentRoute();
    const card = app.querySelector('.star-card');
    if (card) card.scrollTop = scrollTop;
    card?.querySelector(`[data-big-check="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  }
}

// The Big Check's filter hides rows in place (nothing is re-drawn, nothing leaves the page). While
// it holds a query, groups with a match open; clearing it puts each group back as it was. The work
// runs in an animation frame, one pending at a time, so fast typing over ~950 rows lays out once
// per frame; the frame reads the input's value then, so the last keystroke always wins.
let filterFrame = 0;
function bigCheckFilter(e) {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('[data-big-check-filter]')) return;
  if (filterFrame) return;
  filterFrame = requestAnimationFrame(() => {
    filterFrame = 0;
    if (input.isConnected) applyBigCheckFilter(input);
  });
}

function applyBigCheckFilter(input) {
  const screen = input.closest('.big-check');
  if (!screen) return;
  const query = input.value;
  const active = query.trim() !== '';
  let any = false;
  for (const details of screen.querySelectorAll('details')) {
    let shown = 0;
    for (const row of details.querySelectorAll('.big-check-row')) {
      const hit = nameMatches(row.querySelector('.big-check-name')?.textContent, query);
      row.hidden = !hit;
      if (hit) shown += 1;
    }
    details.hidden = shown === 0;
    if (active) {
      if (details.dataset.wasOpen === undefined) details.dataset.wasOpen = details.open ? '1' : '';
      details.open = shown > 0;
    } else if (details.dataset.wasOpen !== undefined) {
      details.open = details.dataset.wasOpen === '1';
      delete details.dataset.wasOpen;
    }
    if (shown) any = true;
  }
  const empty = screen.querySelector('.big-check-empty');
  if (empty) empty.hidden = any;
}

// The location quiz: saved in the game only (setHome). No track(), nothing in the URL.
const QUIZ_ACTIONS = new Set(['quiz-yes', 'quiz-pick', 'quiz-outside', 'quiz-unsaid', 'quiz-guess', 'change-home']);
function quizAction(action, el) {
  let value = null;
  if (action === 'quiz-yes') value = el.dataset.value;
  else if (action === 'quiz-pick') value = el.closest('.residency')?.querySelector('.residency-select')?.value || null;
  else if (action === 'quiz-outside') value = 'outside-us';
  else if (action === 'quiz-unsaid') value = 'unsaid';
  if (action === 'quiz-guess') {
    loadWhoami();
    return;
  }
  if (action === 'change-home') {
    editingResidency = true;
    renderCurrentRoute();
    app.querySelector('.residency-select')?.focus();
    return;
  }
  if (!value) {
    app.querySelector('.residency-select')?.focus();
    return;
  }
  setState(setHome(state, value));
  editingResidency = false;
  renderCurrentRoute();
  app.querySelector('[data-action="change-home"]')?.focus();
}

const MAP_ACTIONS = new Set(['map-zoom', 'select-star', 'close-star', 'map-list', 'dismiss-scout', ...QUIZ_ACTIONS]);

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
  // The "which did you file?" ticks stay in this browser: no track(), no event.
  const ticks = [...app.querySelectorAll('[data-broker-checklist] input[name="filed"]:checked')].map((el) => el.value);
  const withTicks = applyChecklistFiling(filed.state, missionId, filed.event?.status, ticks, localDay());
  setState(ensureBurst(streakAfterFiling(noteFirstTwoFactor(withTicks, mission, withTicks.missions[missionId]), filed.event)));
  afterMissionRecorded(mission, filed.event);
}

// Re-check: the answers are confirmed again, nothing is reopened or sent.
// No afterMissionRecorded, no track.
function submitRecheck(missionId) {
  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return navigate('#/city');
  // A broker mission's ticked lines get today's date; the rest keep theirs.
  const ticks = [...app.querySelectorAll('[data-broker-checklist] input[name="filed"]:checked')].map((el) => el.value);
  const next = checklistFor(missionId)
    ? recheckWithChecklist(state, mission, readAnswers(app, mission), ticks, localDay())
    : applyRecheck(state, mission, readAnswers(app, mission));
  if (!next) {
    // Unanswered, or an answer that would un-file it: say so, change nothing.
    const msg = app.querySelector('[data-recheck-msg]');
    if (msg) msg.hidden = false;
    return;
  }
  setState(next);
  navigate(hasInterior(mission.accountId) ? `#/building/${mission.accountId}` : `#/district/${missionDistrict(mission)}`);
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
  const addressesBreached = districtBreachedAddresses(state, districtId);
  const accountsSecured = Object.entries(ACCOUNTS).filter(
    ([id, a]) => a.district === districtId && state.accounts[id]?.enabled,
  ).length;
  return { accountsSecured, addressesBreached, integrityPercent: calcIntegrity(state) };
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
  const sent = Boolean(nonce) && (await reconnectAnalytics()) && (await trackNow('ghost-cancelled', { nonce }, { timeoutMs: 1500 }));
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
  const sent = Boolean(nonce) && (await reconnectAnalytics()) && (await trackNow('opt-out-cancelled', { nonce }, { timeoutMs: 1500 }));
  if (sent) setOptedOutAt(null);
  else setNotice(GHOST_DIALOGUE.cancelFailed);
}

// Re-send this browser's saved game after tonight's run deleted it.
// Which deletion a restore belongs to: its confirmed-event list is kept
// only while these stay the same (re-review 1).
function restoreStamp() {
  return `optedOut:${getOptedOutAt() || ''}|ghost:${getGhostInfo()?.at || ''}`;
}

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
    // Restore's own confirmed sender (reviewer I1): each event is posted and
    // counted only when the analytics server answers ok, one at a time, oldest
    // filing first, each request aborted after 15 s. The first failure stops
    // the restore with the ghost and opt-out flags kept, so RESTORE stays on
    // offer and a retry continues from the last confirmed event.
    const events = [...kinds.map((kind) => ({ name: 'data-restored', data: { kind } })), ...restoreEvents(state)];
    const result = await sendRestore(events, {
      stamp: restoreStamp(),
      onProgress: (n, total) => {
        if (n % 10 === 0 || n === total) {
          setNotice(RESTORE_DIALOGUE.progress(n, total));
          renderCurrentRoute();
        }
      },
    });
    if (!result.ok) {
      setNotice(RESTORE_DIALOGUE.stopped(result.sent, result.total));
      return;
    }
    clearConfirmed();
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
  const sky = e.target.closest?.('svg.constellation');
  if (sky && app.contains(sky)) {
    // Pointer presses are handled on pointerup (tap vs drag) and their clicks swallowed; a click
    // with no press before it (an older browser, a synthetic click) still selects.
    tapSky(sky, e.clientX, e.clientY);
    return;
  }
  const studio = e.target.closest?.('a[data-studio-link]');
  if (studio && app.contains(studio)) {
    track('studio-link', { from: studio.dataset.studioLink });
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el || !app.contains(el)) return;
  const action = el.dataset.action;
  if (MAP_ACTIONS.has(action)) {
    mapAction(action, el);
    return;
  }

  if (leavingBriefing && (action === 'go-do-it' || action === 'i-did-it')) {
    e.preventDefault();
    return;
  }
  if (action === 'add-device') {
    // Local only: no track(), nothing about devices leaves this phone.
    const input = el.closest('[data-devices]')?.querySelector('[data-device-input]');
    const next = addDevice(state, el.dataset.building, input?.value);
    if (next !== state) setState(next);
    renderCurrentRoute();
    app.querySelector('[data-device-input]')?.focus();
  } else if (action === 'light-candle') {
    // Local only: no track(); which saints you honor stays on this phone.
    const next = lightCandle(state, el.dataset.saint);
    if (next !== state) {
      setState(next);
      renderCurrentRoute();
      app.querySelector(`[data-action="light-candle"][data-saint="${CSS.escape(el.dataset.saint)}"]`)?.focus();
    }
  } else if (action === 'remove-device') {
    setState(removeDevice(state, el.dataset.building, Number(el.dataset.index)));
    renderCurrentRoute();
  } else if (action === 'go-do-it') {
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
  } else if (action === 'retry-broker-data') {
    loadBrokerMapData();
    renderCurrentRoute();
  } else if (action === 'submit-recheck') {
    submitRecheck(el.dataset.mission);
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
      // A survey chip (a button, on a phone) keeps focus across the redraw.
      if (el.tagName === 'BUTTON') [...app.querySelectorAll(`button[data-action="toggle-account"][data-account="${CSS.escape(id)}"]`)].find((b) => b.offsetParent !== null)?.focus();
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

// <details data-open-desktop>: closed on a phone, open from 900px (set after every render and
// on a breakpoint change). A fold the player opens or closes by hand keeps that this screen visit.
desktopQuery?.addEventListener?.('change', () => applyOpenDesktop(app, isDesktopWide(), handFolds));
app.addEventListener('toggle', (e) => {
  const d = e.target;
  if (!(d instanceof HTMLDetailsElement) || !d.hasAttribute('data-open-desktop')) return;
  recordHandToggle(d, [...app.querySelectorAll('details[data-open-desktop]')].indexOf(d), handFolds);
}, true);

// A building floor folded or unfolded. <details> toggle does not bubble, so
// listen in the capture phase. Local state only: no track().
app.addEventListener('toggle', (e) => {
  const details = e.target;
  if (!(details instanceof HTMLDetailsElement) || !details.dataset.floor) return;
  // A floor the script opened or folded for the screen width (data-open-desktop) is not the player's choice.
  if (details.hasAttribute('data-open-desktop')) {
    const all = [...app.querySelectorAll('details[data-open-desktop]')];
    if (!handFolds.has(desktopFoldKey(details, all.indexOf(details)))) return;
  }
  const id = details.closest('[data-building]')?.dataset.building;
  if (!id) return;
  const next = setFloorOpen(state, id, details.dataset.floor, details.open);
  if (next !== state) setState(next);
}, true);

// role="button" actions answer Enter and Space like real buttons.
app.addEventListener('keydown', (e) => {
  // Enter in a per-category number box files it, like its button.
  if (e.key === 'Enter' && e.target?.matches?.('[data-device-input]')) {
    e.preventDefault();
    e.target.closest('[data-devices]')?.querySelector('[data-action="add-device"]')?.click();
    return;
  }
  if (e.key === 'Enter' && e.target?.id?.startsWith?.('pm-cat-num-')) {
    const btn = e.target.closest('[data-pm-category]')?.querySelector('[data-action="pm-cat-flag"], [data-action="pm-cat-changed"]');
    if (btn) { e.preventDefault(); btn.click(); }
    return;
  }
  if (e.key === 'Escape' && selectedId && app.querySelector('.star-card')) {
    // Straight to closeCard: a click on CLOSE could be swallowed by a tap's click window.
    e.preventDefault();
    swallowClickUntil = 0;
    closeCard();
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
  // The first question changing ticks or clears the boxes once; the player can still change them.
  if (input.name === `q_${mission.debriefQs[0]?.id}`) {
    const ticks = checklistTicksFor(mission.debriefQs[0].id, input.value);
    // Not on a re-check: there only the lines the player ticks get a new date.
    const boxes = [...form.querySelectorAll('[data-broker-checklist]:not([data-mode="recheck"]) input[name="filed"]')];
    // Moving off an "all" answer clears the boxes only if they still exactly match what "all" ticked.
    const wasAll = form.dataset.prevAll === '1';
    form.dataset.prevAll = ticks === 'all' ? '1' : '';
    if (ticks) for (const box of boxes) box.checked = ticks === 'all';
    else if (wasAll && boxes.length && boxes.every((b) => b.checked)) for (const box of boxes) box.checked = false;
  }
  const shown = new Set(visibleQuestions(mission, readAnswers(form, mission)).map((q) => q.id));
  for (const group of form.querySelectorAll('[data-question]')) group.hidden = !shown.has(group.dataset.question);
}
document.addEventListener('click', (e) => {
  if (!swallowClickUntil) return;
  const late = performance.now() > swallowClickUntil;
  swallowClickUntil = 0;
  const refocus = cardFocusPending;
  cardFocusPending = false;
  if (late) return;
  // A deliberate CLOSE right after a tap is never eaten.
  if (e.target?.closest?.('[data-action="close-star"]')) return;
  e.preventDefault();
  e.stopPropagation();
  if (refocus) app.querySelector('.star-card')?.focus({ preventScroll: true });
}, true);
app.addEventListener('pointerdown', mapPointerDown);
app.addEventListener('pointerdown', sheetPointerDown);
app.addEventListener('pointermove', sheetPointerMove, { passive: false });
app.addEventListener('pointerup', sheetPointerUp);
app.addEventListener('pointercancel', sheetPointerUp);
app.addEventListener('pointermove', mapPointerMove, { passive: false });
app.addEventListener('pointerup', mapPointerUp);
app.addEventListener('pointercancel', mapPointerUp);
app.addEventListener('wheel', mapWheel, { passive: false });
// Older Safari pinch-zooms the page on its own gesture events; not on the map.
app.addEventListener('gesturestart', (e) => {
  if (e.target.closest?.('.map-stage')) e.preventDefault();
});

app.addEventListener('change', refreshDebriefForm);
app.addEventListener('input', refreshDebriefForm);
app.addEventListener('change', bigCheckChange);
app.addEventListener('input', bigCheckFilter);

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

// A rotated phone or a resized window re-measures the map (not the URL bar sliding on scroll).
let lastSize = { w: window.innerWidth, h: window.innerHeight };
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const size = { w: window.innerWidth, h: window.innerHeight };
    const big = size.w !== lastSize.w || Math.abs(size.h - lastSize.h) > 120;
    lastSize = size;
    // Leaving phone width: the sheet's inline height cap must not follow the card to the side layout.
    if (!isPhone()) app.querySelector('.star-card')?.style.removeProperty('max-height');
    if (big && parseRoute(location.hash).screen === 'broker-map') renderCurrentRoute();
  }, 150);
});

// Web fonts landing can move the header; the phone's map is sized from where it starts, so measure again.
document.fonts?.addEventListener?.('loadingdone', () => {
  if (parseRoute(location.hash).screen === 'broker-map') renderCurrentRoute();
});

initRouter(render);
mountClassAd();
mountBugReporter();
checkStreakReminder(state);
// Web cabinet: tell campus the game has booted (no-op outside cabinet mode).
announceReady();
