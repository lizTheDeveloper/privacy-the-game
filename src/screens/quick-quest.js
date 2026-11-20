import { QUICK_QUESTS } from '../data/quests.js';
import { DISTRICTS } from '../data/districts.js';
import { renderHud } from '../components/hud.js';
import { deck } from '../components/deck.js';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderQuestCard(quest) {
  const district = DISTRICTS.find((d) => d.id === quest.targetDistrict);
  const districtLabel = district ? district.name.toUpperCase() : quest.targetDistrict.toUpperCase();

  return `
  <a href="#/district/${quest.targetDistrict}" class="panel" style="display: block; padding: 18px 20px; text-decoration: none; border: 1px solid rgba(0,229,255,0.12); transition: border-color 0.15s, background 0.15s;">
    <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px;">
      <div style="font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--offwhite); letter-spacing: 0.5px;">${esc(quest.title)}</div>
      <div class="badge" style="letter-spacing: 1px; font-size: 8px; color: rgba(0,229,255,0.6); background: rgba(0,229,255,0.05); border-color: rgba(0,229,255,0.15); flex-shrink: 0;">${districtLabel}</div>
    </div>
    <div style="font-size: 12px; line-height: 1.5; color: rgba(237,239,243,0.5);">${esc(quest.description)}</div>
  </a>`;
}

// On a phone: a tile per problem, four to a slide. The tile is the link; what the problem
// looks like, and the district it goes to, open from the ? beside it. From 900px the
// cards above, as they always were.
function questTile(quest) {
  const district = DISTRICTS.find((d) => d.id === quest.targetDistrict);
  const districtLabel = district ? district.name.toUpperCase() : quest.targetDistrict.toUpperCase();
  return `<li class="qq-tile"><a class="qq-go" href="#/district/${quest.targetDistrict}">${esc(quest.title)}</a><details class="qq-signs" data-fold="qq-${esc(quest.id)}"><summary aria-label="What it looks like: ${esc(quest.title)}">?</summary><div class="badge qq-badge">${districtLabel}</div><div class="qq-desc">${esc(quest.description)}</div></details></li>`;
}

function questDeck() {
  const slides = [];
  for (let i = 0; i < QUICK_QUESTS.length; i += 4) {
    slides.push({ html: `<ul class="qq-grid">${QUICK_QUESTS.slice(i, i + 4).map(questTile).join('')}</ul>` });
  }
  return deck(slides, { label: 'Quick Quest', className: 'qq-slides' });
}

export function renderQuickQuest(state) {
  return `
  <div class="scanlines">
    ${renderHud(state)}
    <div style="padding: 16px 24px;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
        <a class="btn-secondary" style="flex-shrink: 0; padding: 8px 14px; text-decoration: none;" href="#/city">← CITY</a>
        <div>
          <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,229,255,0.4);">QUICK QUEST</div>
          <div style="font-size: 12px; color: rgba(237,239,243,0.5); margin-top: 4px;">Something urgent? Pick your problem and we'll take you where you need to go.</div>
        </div>
      </div>
      <div class="desktop-only qq-list" style="display: grid; gap: 10px; max-width: 640px;">
        ${QUICK_QUESTS.map(renderQuestCard).join('')}
      </div>
      <div class="phone-only qq-deck">${questDeck()}</div>
    </div>
  </div>`;
}
