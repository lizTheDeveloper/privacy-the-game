import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderDebrief, debriefReaction } from '../src/screens/debrief.js';
import { createInitialState } from '../src/state.js';
import { MISSIONS } from '../src/data/missions.js';
import { splitWords } from '../src/components/deck.js';
import { canRecheck } from '../src/utils/debrief.js';

beforeEach(() => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

const norm = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
// Scout's bubble: the italic line under the greeting.
const bubble = (html) => html.match(/<div data-scout-line[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/)?.[1] ?? '';
const outsideDetails = (html) => html.replace(/<details[\s\S]*?<\/details>/g, ' ');
// The closing quote added at the cut shows only while the rest is folded away.
const noCutQuote = (html) => html.replace(/<span class="scout-cut-quote"[^>]*>[^<]*<\/span>/g, '');

const mission = MISSIONS.find((m) => m.id === 'gmail-recon-login');
const briefingLine = mission.scoutDialog.briefing;
const [firstSentence, ...rest] = splitWords(briefingLine, 1);

describe("debrief and re-check say Scout's briefing line once", () => {
  it('the repeated briefing line collapses after its first sentence', () => {
    expect(rest.length).toBeGreaterThan(0);
    const state = createInitialState();
    const line = bubble(renderDebrief(state, mission.id));
    expect(norm(noCutQuote(outsideDetails(line)))).toBe(norm(firstSentence));
    expect(line).toMatch(/<details[^>]*><summary>Remind me<\/summary>/);
    // Nothing is lost: the whole line is still in the bubble, in order.
    expect(norm(noCutQuote(line).replace(/<summary>[^<]*<\/summary>/, ' '))).toBe(norm(briefingLine));
  });

  it('the re-check collapses it too', () => {
    const state = createInitialState();
    const m = MISSIONS.find((x) => canRecheck(x) && x.scoutDialog?.briefing && splitWords(x.scoutDialog.briefing, 1).length > 1);
    state.missions[m.id] = { status: 'completed', completedAt: '2026-01-01T00:00:00.000Z' };
    const line = bubble(renderDebrief(state, m.id, { recheck: true }));
    expect(norm(noCutQuote(outsideDetails(line)))).toBe(norm(splitWords(m.scoutDialog.briefing, 1)[0]));
    expect(line).toContain('<summary>Remind me</summary>');
  });

  it('every mission: the debrief bubble still holds the whole briefing line', () => {
    const state = createInitialState();
    for (const m of MISSIONS) {
      if (!m.scoutDialog?.briefing) continue;
      const line = bubble(renderDebrief(state, m.id));
      expect(norm(noCutQuote(line).replace(/<summary>[^<]*<\/summary>/, ' ')), m.id).toBe(norm(m.scoutDialog.briefing));
    }
  });

  it('a one-sentence briefing line needs no details', () => {
    const m = MISSIONS.find((x) => x.scoutDialog?.briefing && splitWords(x.scoutDialog.briefing, 1).length === 1);
    const line = bubble(renderDebrief(createInitialState(), m.id));
    expect(line).not.toContain('<details');
    expect(norm(line)).toBe(norm(m.scoutDialog.briefing));
  });

  it('a different debrief line is untouched', () => {
    const state = createInitialState();
    state.missions[mission.id] = { status: 'completed', completedAt: '2026-01-01T00:00:00.000Z', finding: 'clean' };
    const { line: reaction } = debriefReaction(state, mission);
    expect(reaction).not.toBe(briefingLine);
    const line = bubble(renderDebrief(state, mission.id));
    expect(line).not.toContain('<details');
    expect(norm(line)).toBe(norm(reaction));
  });

  it('a quote opened in the first sentence is closed at the cut while the rest is folded', () => {
    const line = bubble(renderDebrief(createInitialState(), mission.id));
    expect(briefingLine.startsWith('"')).toBe(true);
    expect(outsideDetails(line)).toMatch(/leaves a trace\.<span class="scout-cut-quote" aria-hidden="true">"<\/span>/);
    expect(readFileSync('src/style.css', 'utf8')).toMatch(/\[data-scout-line\]:has\(\.scout-remind\[open\]\) \.scout-cut-quote \{ display: none; \}/);
  });
});
