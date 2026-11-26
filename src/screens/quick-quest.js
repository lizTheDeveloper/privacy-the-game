import { questsInOrder, isFeatured } from '../data/quests.js';
import { DISTRICTS } from '../data/districts.js';
import { MISSIONS, missionDistrict } from '../data/missions.js';
import { renderHud } from '../components/hud.js';
import { isMissionDoneIn, isMissionInPlay } from '../utils/mission-status.js';
import { getAccountPhaseGate } from '../utils/calc.js';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Where a pick goes: the first of the quest's missions the player can start, one not done yet
// before one done; else its district. A mission is out when its account is off (or it is
// still locked), or when it waits behind its account's check in a district that gates by phase
// (Liz 2026-11-20: "a list that goes straight to the fix").
// { href, label, missionId } — label is what "Takes you to:" names.
const PHASE_PREREQ = { fortify: 'recon', reclaim: 'fortify' };

function canStart(state, mission) {
  if (!mission || !isMissionInPlay(state, mission)) return false;
  const districtId = missionDistrict(mission);
  const district = DISTRICTS.find((d) => d.id === districtId);
  const prereq = PHASE_PREREQ[mission.phase];
  if (!prereq || district?.type === 'facility') return true;
  return getAccountPhaseGate(state, districtId, mission.accountId, prereq).unlocked;
}

export function questTarget(state, quest) {
  const open = (quest.targetMissions || []).map((id) => MISSIONS.find((m) => m.id === id)).filter((m) => canStart(state, m));
  const mission = open.find((m) => !isMissionDoneIn(state, m)) || open[0];
  if (mission) return { href: `#/mission/${mission.id}/briefing`, label: mission.title, missionId: mission.id };
  const district = DISTRICTS.find((d) => d.id === quest.targetDistrict);
  return { href: `#/district/${quest.targetDistrict}`, label: district?.name ?? quest.targetDistrict, missionId: null };
}

function districtLabel(quest) {
  const district = DISTRICTS.find((d) => d.id === quest.targetDistrict);
  return district ? district.name.toUpperCase() : quest.targetDistrict.toUpperCase();
}

// A featured quest's tag ("THIS WEEK"), beside its name, while it is featured.
function featuredTag(quest, now) {
  return isFeatured(quest, now) ? `<span class="qq-featured-tag">${esc(quest.featured.tag || 'NEW')}</span>` : '';
}

function renderQuestCard(state, quest, now) {
  const to = questTarget(state, quest);
  const featured = isFeatured(quest, now);
  return `
  <a href="${esc(to.href)}" class="panel${featured ? ' qq-featured' : ''}" data-quest="${esc(quest.id)}"${featured ? ' data-featured' : ''} style=""display: block; padding: 18px 20px; text-decoration: none; border: 1px solid rgba(0,229,255,0.12); transition: border-color 0.15s, background 0.15s;">
    <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px;">
      <div style="font-family: var(--font-title); line-height: 1.2; font-size: 14px; font-weight: 700; color: var(--offwhite); letter-spacing: 0.5px;">${esc(quest.title)}</div>${featuredTag(quest, now)}
      <div class="badge" style="letter-spacing: 1px; font-size: 11px; color: rgba(0,229,255,0.6); background: rgba(0,229,255,0.05); border-color: rgba(0,229,255,0.15); flex-shrink: 0;">${districtLabel(quest)}</div>
    </div>
    <div style="font-size: 12px; line-height: 1.5; color: rgba(237,239,243,0.5);">${esc(quest.description)}</div>
    <div class="qq-to">Takes you to: <span class="qq-to-name">${esc(to.label)}</span></div>
  </a>`;
}

// On a phone: one list that scrolls, a row per problem. The row is the link: the problem in
// plain words and where it takes you. What it looks like (and its district) open from the ?
// beside it. From 900px the cards above.
function questRow(state, quest, now) {
  const to = questTarget(state, quest);
  const featured = isFeatured(quest, now);
  return `<li class="qq-row${featured ? ' qq-featured' : ''}" data-quest="${esc(quest.id)}"${featured ? ' data-featured' : ''}><a class="qq-go" href="${esc(to.href)}">${featuredTag(quest, now)}<span class="qq-name">${esc(quest.title)}</span><span class="qq-to">Takes you to: <span class="qq-to-name">${esc(to.label)}</span></span></a><details class="qq-signs" data-fold="qq-${esc(quest.id)}"><summary aria-label="What it looks like: ${esc(quest.title)}">?</summary><div class="badge qq-badge">${districtLabel(quest)}</div><div class="qq-desc">${esc(quest.description)}</div></details></li>`;
}

export function renderQuickQuest(state, { now = new Date() } = {}) {
  const quests = questsInOrder(now);
  return `
  <div class="scanlines">
    ${renderHud(state)}
    <div style="padding: 16px 24px;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
        <a class="btn-secondary" style="flex-shrink: 0; display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; text-decoration: none;" href="#/city">← CITY</a>
        <div>
          <div style="font-family: var(--font-title); line-height: 1.2; font-size: 20px; font-weight: 800; color: var(--cyan); letter-spacing: 0.5px; text-shadow: 0 0 20px rgba(0,229,255,0.4);">QUICK QUEST</div>
          <div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-top: 4px;">Something urgent? Pick your problem and we'll take you where you need to go.</div>
        </div>
      </div>
      <div class="desktop-only qq-list" style="display: grid; gap: 10px; max-width: 640px;">
        ${quests.map((q) => renderQuestCard(state, q, now)).join('')}
      </div>
      <div class="phone-only"><ul class="qq-rows">${quests.map((q) => questRow(state, q, now)).join('')}</ul></div>
    </div>
  </div>`;
}
