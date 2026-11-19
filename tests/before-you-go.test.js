// Before you go: a step that opens another site says what to do there BEFORE its OPEN button.
// A player (Instagram, 2026-11-18): "Sometimes you tell me to click on a link to go somewhere but
// not what to do once I'm there. … If you could put the instructions for what to do before I
// click the link, that would help."
import { describe, it, expect, beforeEach } from 'vitest';
import { renderBriefing } from '../src/screens/briefing.js';
import { createInitialState, markMissionStarted } from '../src/state.js';
import { setReadLevel, visibleSteps, stepKey, markStep, progressFor } from '../src/utils/reading.js';
import { MISSIONS } from '../src/data/missions.js';
import { findMission } from '../src/data/custom-missions.js';
import { markOpened, clearOpened } from '../src/utils/opened-steps.js';
import { onSiteSteps, sitePreview, previewText, WHEN_OPENS, COME_BACK, COME_BACK_MORE, PREVIEW_MAX } from '../src/components/site-preview.js';
import { plainText } from '../src/utils/readability.js';

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const readLines = (html) => JSON.parse(decode(/data-say-lines="([^"]*)"/.exec(html)[1]));
const card = (html) => {
  const at = html.indexOf('data-step-card');
  return at === -1 ? '' : html.slice(at, html.indexOf('class="walk-help"', at));
};
const previewItems = (html) => [...(/data-site-preview[\s\S]*?<\/ol>/.exec(html)?.[0] || '').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => decode(m[1]));

// The mission started, every step before `i` ticked, and Simple's device questions skipped, so
// the step screen shows step i.
function atStep(level, mission, i) {
  let s = markMissionStarted(setReadLevel(createInitialState(), level), mission.id);
  const steps = visibleSteps(mission, s);
  for (const st of steps.slice(0, i)) s = markStep(s, mission.id, stepKey(st), 'done');
  s = { ...s, stepProgress: { ...s.stepProgress, [mission.id]: { ...s.stepProgress?.[mission.id], setup: 'skipped' } } };
  return { s, steps };
}

const LIVE = MISSIONS.filter((m) => !m.legacy);

beforeEach(() => clearOpened());

describe('which steps the preview lists', () => {
  const A = { text: 'Open A', url: 'https://a.example' };
  const B = { text: 'Open B', url: 'https://b.example' };
  it('the steps after the link, stopping at the next step with a link of its own', () => {
    const steps = [A, { text: 'a1' }, { text: 'a2' }, B, { text: 'b1' }];
    expect(onSiteSteps(steps, 0).map((s) => s.text)).toEqual(['a1', 'a2']);
    expect(onSiteSteps(steps, 3).map((s) => s.text)).toEqual(['b1']);
    expect(onSiteSteps(steps, 1)).toEqual([]); // no link, no preview
  });
  it('stops before a step that happens somewhere else, and after the one that asks a question', () => {
    expect(onSiteSteps([A, { text: 'a1' }, { text: 'in the app', elsewhere: true }, { text: 'a3' }], 0).map((s) => s.text)).toEqual(['a1']);
    expect(onSiteSteps([A, { text: 'read it', ask: 'finding' }, { text: 'after' }], 0).map((s) => s.text)).toEqual(['read it']);
  });
  it('each item is the step’s first sentence, without “On that website,”', () => {
    expect(previewText({ text: 'On that website, type your email. Then wait.' })).toBe('Type your email.');
    expect(previewText({ text: 'Settings → Privacy (e.g. this) and more' })).toBe('Settings → Privacy (e.g. this) and more');
  });
  it('Simple shows at most 3, and says there is more', () => {
    const steps = [A, ...['1', '2', '3', '4', '5'].map((text) => ({ text }))];
    const p = sitePreview(steps, 0, { max: PREVIEW_MAX.simplest });
    expect(p.steps.map((s) => s.text)).toEqual(['1', '2', '3']);
    expect(p.more).toBe(true);
    expect(sitePreview([A, B], 0)).toBeNull();
  });
});

describe('every step with a link says what to do there before its OPEN button', () => {
  for (const level of ['simplest', 'full']) {
    it(`${level}: every mission, every link step with on-site steps after it`, () => {
      const problems = [];
      let checked = 0;
      for (const m of LIVE) {
        const base = visibleSteps(m, setReadLevel(createInitialState(), level));
        if (base.length < 2) continue;
        base.forEach((st, i) => {
          if (!st.url) return;
          const { s, steps } = atStep(level, m, i);
          if (progressFor(s, m.id, steps).current !== i) return; // two steps with the same words
          const html = renderBriefing(s, m.id);
          const c = card(html);
          const after = onSiteSteps(steps, i);
          const openAt = c.search(level === 'simplest' ? /class="[^"]*simple-open/ : /class="[^"]*focus-open/);
          const previewAt = c.indexOf('data-site-preview');
          if (openAt === -1) problems.push(`${m.id} #${i}: no OPEN button`);
          if (!after.length) {
            if (previewAt !== -1) problems.push(`${m.id} #${i}: a preview with nothing in it`);
            return;
          }
          checked++;
          if (previewAt === -1 || previewAt > openAt) problems.push(`${m.id} #${i}: no preview before OPEN`);
          if (!c.includes(WHEN_OPENS)) problems.push(`${m.id} #${i}: no "When it opens:"`);
          const max = PREVIEW_MAX[level];
          const items = previewItems(c);
          expect(items, `${m.id} #${i}`).toEqual(after.slice(0, max).map(previewText));
          expect(c).toContain(after.length > max ? COME_BACK_MORE : COME_BACK);
          // Read it to me reads it before they leave: the step, then the preview, in order.
          const lines = readLines(html);
          const w = lines.indexOf(WHEN_OPENS);
          if (w < 1) problems.push(`${m.id} #${i}: preview not read aloud`);
          else expect(lines.slice(w + 1, w + 1 + items.length).map(plainText), `${m.id} #${i}`).toEqual(items.map(plainText));
        });
      }
      expect(problems).toEqual([]);
      expect(checked).toBeGreaterThan(level === 'simplest' ? 150 : 150);
    });
  }

  it('the preview stops at the next step with its own link', () => {
    for (const m of LIVE) {
      for (const level of ['simplest', 'full']) {
        const steps = visibleSteps(m, setReadLevel(createInitialState(), level));
        steps.forEach((st, i) => {
          const after = onSiteSteps(steps, i);
          for (const x of after) expect(x.url, `${m.id} #${i}`).toBeFalsy();
          const next = steps[i + after.length + 1];
          if (after.length && next && !after.at(-1).ask) expect(Boolean(next.url || next.elsewhere), `${m.id} #${i}`).toBe(true);
        });
      }
    }
  });

  it('Advanced: the briefing says what to do on the site GO DO IT opens, before GO DO IT', () => {
    const s = setReadLevel(createInitialState(), 'full');
    let seen = 0;
    for (const m of LIVE) {
      const html = renderBriefing(s, m.id);
      const go = /data-action="go-do-it"[^>]*data-url="([^"]*)"/.exec(html);
      if (!go) continue;
      const steps = visibleSteps(m, s);
      const at = steps.findIndex((st) => st.url === decode(go[1]));
      if (at === -1 || !onSiteSteps(steps, at).length) {
        expect(html, m.id).not.toContain('data-site-preview');
        continue;
      }
      const p = html.indexOf('data-site-preview');
      expect(p, m.id).toBeGreaterThan(-1);
      expect(p, m.id).toBeLessThan(go.index);
      // The list keeps every step, each with its own row.
      expect((html.match(/data-brief-step /g) || []).length, m.id).toBe(steps.length);
      expect(readLines(html), m.id).toContain(WHEN_OPENS);
      seen++;
    }
    expect(seen).toBeGreaterThan(50);
  });
});

describe('the steps after the link are still their own cards', () => {
  it('Simple, the Gmail leak check: OPEN, then each on-site step on its own card with DONE', () => {
    const m = findMission(createInitialState(), 'gmail-recon-breach');
    let s = markMissionStarted(createInitialState(), m.id);
    const steps = visibleSteps(m, s);
    let html = renderBriefing(s, m.id);
    expect(card(html)).toMatch(/data-site-preview[\s\S]*<li>Type your Gmail email address in the “Email address” box, and tap “Check”<\/li><li>Read what it says.<\/li>[\s\S]*simple-open/);
    expect(card(html)).not.toContain('data-action="step-done"');
    markOpened(m.id, stepKey(steps[0]));
    html = renderBriefing(s, m.id);
    expect(card(html)).toContain('data-action="step-done"');
    s = markStep(s, m.id, stepKey(steps[0]), 'done');
    for (const st of steps.slice(1)) {
      html = renderBriefing(s, m.id);
      expect(plainText(card(html))).toContain(plainText(st.text).slice(0, 30));
      expect(card(html)).not.toContain('data-site-preview');
      expect(card(html)).toContain('data-action="step-done"');
      s = markStep(s, m.id, stepKey(st), 'done');
    }
    expect(progressFor(s, m.id, steps).current).toBe(-1);
  });

  it('Advanced keeps every row in the list, each with its tick', () => {
    const s = setReadLevel(createInitialState(), 'full');
    const html = renderBriefing(s, 'gmail-recon-breach');
    const steps = visibleSteps(findMission(s, 'gmail-recon-breach'), s);
    expect((html.match(/data-brief-step /g) || []).length).toBe(steps.length);
    expect(html).toContain('DONE &#10003; NEXT');
  });
});

describe('the preview only lists steps on that site', () => {
  const previewOf = (id, level, i) => {
    const s = setReadLevel(createInitialState(), level);
    return onSiteSteps(visibleSteps(findMission(s, id), s), i).map((x) => x.text);
  };
  it('an in-app step after a website step is not on the website', () => {
    expect(previewOf('venmo-fortify-password', 'full', 0).join(' ')).not.toMatch(/Passcode & biometric/);
    expect(previewOf('apple_id-reclaim-privacy', 'full', 0).join(' ')).not.toMatch(/On your device/);
    expect(previewOf('car_toyota-recon-insurance', 'full', 1)).toEqual([]);
  });
  it('a Password Reset’s “check it saved” happens where the passwords are, not on the site', () => {
    const s = { ...setReadLevel(createInitialState(), 'full'), passwordManager: 'apple' };
    const steps = visibleSteps(findMission(s, 'gmail-fortify-password'), s);
    const i = steps.findIndex((x) => x.url);
    expect(onSiteSteps(steps, i).map((x) => x.text).join(' ')).not.toMatch(/Check it saved/);
  });
});
