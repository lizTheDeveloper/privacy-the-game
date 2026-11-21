// Before you go: what to do on the site a step opens, said on the card with its OPEN button.
//
// A player (an Instagram comment Liz got, 2026-11-18): "Sometimes you tell me to click on a link
// to go somewhere but not what to do once I'm there. Then I go back to the game and the
// instructions are there. If you could put the instructions for what to do before I click the
// link, that would help." On a phone the other site covers the game, so the steps after the link
// can't be seen from there. The link's card lists them first. They stay their own cards too (they
// carry the DONE ticks and the step questions): this is a preview, not a merge.
import { plainText } from '../utils/readability.js';

export const WHEN_OPENS = 'When it opens:';
export const COME_BACK = 'Then come back here and tap DONE.';
// More on-site steps than the preview shows: the rest are on the next cards.
export const COME_BACK_MORE = 'Then come back here and tap DONE to see the rest.';
// Simple mode keeps it short; Advanced can show a little more.
export const PREVIEW_MAX = { simplest: 3, full: 4 };

const html = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The steps that happen on the site step i opens: the ones after it, up to the next step with a
// link of its own or one that happens somewhere else (`elsewhere`: an app, the phone's Settings,
// another site), ending with the first that asks a question (it is answered back here).
// None when step i asks a question itself: its answer comes first, on its own card. Listing the
// next steps there read as "do these before you answer" (the orders card listed steps 4 to 6).
export function onSiteSteps(steps, i) {
  if (!steps?.[i]?.url || steps[i].ask) return [];
  const out = [];
  for (const st of steps.slice(i + 1)) {
    if (st.url || st.elsewhere) break;
    out.push(st);
    if (st.ask) break;
  }
  return out;
}

// A step as the preview lists it: its first sentence, the doing part (the rest is on its own card),
// without "On that website," (the preview already says where). Keeps the OPEN button on a phone's
// first screen.
export function previewText(step) {
  const t = plainText(step?.text || '');
  const first = t.split(/(?<=[.!?])\s+(?=[A-Z“"])/)[0];
  const bare = first.replace(/^On (?:that|this|the) (?:website|site|page),?\s+/i, '');
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

// { steps, more } for a step with a link and something to do once it opens, else null.
export function sitePreview(steps, i, { max = PREVIEW_MAX.full } = {}) {
  const after = onSiteSteps(steps, i);
  if (!after.length) return null;
  return { steps: after.slice(0, max), more: after.length > max };
}

// The preview's words, in order, for Read it to me (scripts/voice-lines.mjs lists each one).
export function sitePreviewSay(preview) {
  if (!preview) return [];
  return [WHEN_OPENS, ...preview.steps.map(previewText), preview.more ? COME_BACK_MORE : COME_BACK];
}

// "When it opens:", the numbered steps, and come back. Full-size words: small gray reads as
// "optional" (Liz).
export function sitePreviewHtml(preview, { simple = false } = {}) {
  if (!preview) return '';
  const items = preview.steps.map((st) => `<li>${html(previewText(st))}</li>`).join('');
  return `
        <div class="site-preview${simple ? ' site-preview--simple' : ''}" data-site-preview>
          <p class="site-preview-label">${WHEN_OPENS}</p>
          <ol class="site-preview-steps">${items}</ol>
          <p class="site-preview-back">${preview.more ? COME_BACK_MORE : COME_BACK}</p>
        </div>`;
}
