import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../src/data/missions.js';

// Liz (2026-10-08): "9.9.9.9 is the non-logging nonprofit one". Quad9's own site:
// "Quad9 is a not-for-profit organization" and "When your devices use Quad9
// normally, no data containing your IP address is ever logged" (quad9.net).
const DNS_MISSIONS = ['browser_fingerprint-reclaim-dns', 'smart_network-reclaim-dns'];

describe('encrypted DNS missions lead with Quad9', () => {
  for (const id of DNS_MISSIONS) {
    const m = MISSIONS.find((x) => x.id === id);
    it(`${id} says why Quad9: not-for-profit, no IP logging`, () => {
      expect(m.briefing).toMatch(/Quad9 is run by a Swiss not-for-profit foundation that says it never logs your IP address/);
    });
    it(`${id} lists Quad9 before Cloudflare in every step that names both`, () => {
      for (const s of m.steps) {
        const q = s.text.search(/Quad9|dns\.quad9\.net|9\.9\.9\.9/);
        const c = s.text.search(/Cloudflare|one\.one\.one\.one|1\.1\.1\.1/);
        // The iPhone app step names Cloudflare's app first on purpose: Quad9 has no app.
        if (q >= 0 && c >= 0 && !/1\.1\.1\.1 app/.test(s.text.slice(0, q))) expect(q).toBeLessThan(c);
      }
    });
  }
});
