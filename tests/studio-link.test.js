import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderHud, STUDIO_URL } from '../src/components/hud.js';

const hudState = { streak: { current: 0 }, accounts: {}, missions: {}, vehicles: [] };

describe('link home to Multiverse Games', () => {
  it('the HUD links to multiversegames.ai in a new tab, tagged as from the HUD', () => {
    const html = renderHud(hudState);
    expect(html).toContain(`href="${STUDIO_URL}hud"`);
    expect(STUDIO_URL.startsWith('https://multiversegames.ai/?')).toBe(true);
    expect(html).toMatch(/href="https:\/\/multiversegames\.ai\/[^"]*hud" target="_blank" rel="noopener"/);
    expect(html).toContain('data-studio-link="hud"');
    expect(html).toContain('Reclaim City is by Multiverse Games');
  });

  it('the welcome screen links home too', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app).toContain('href="${STUDIO_URL}welcome" target="_blank" rel="noopener"');
  });
});

describe('studio link click', () => {
  it('is counted through analytics.js, the only module that talks to the tracker', () => {
    const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
    expect(app).toContain("track('studio-link', { from: studio.dataset.studioLink })");
  });
});
