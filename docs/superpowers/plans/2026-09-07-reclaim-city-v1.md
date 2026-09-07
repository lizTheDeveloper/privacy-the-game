# Reclaim City v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a playable v1 of Reclaim City — Chapter 1 (The Master Keys) fully playable with all 4 mission phases, campaign mode, stats dashboard, and milestone cards.

**Architecture:** Vanilla JS with ES modules, no framework, no build step. Each screen is a render function that returns HTML from state. Hash-based routing switches screens. All player data lives in localStorage. Static content data (districts, accounts, missions) is defined as JS modules. Pixel art assets are referenced by path from the existing `assets/` directory.

**Tech Stack:** Vanilla JS (ES modules), HTML/CSS, localStorage, Vitest (unit tests), `npx serve` (dev server)

**Spec:** `docs/superpowers/specs/2026-09-07-reclaim-city-design.md`

**Design reference:** The `.dc.html` artboard files define the visual target for each screen. The cyberpunk design system uses Orbitron (display), Inter (body), JetBrains Mono (stats), with colors: Electric Cyan #00E5FF, Hot Magenta #FF2D9B, Acid Lime #C6FF00, Warning Amber #FF9F00, Midnight Black #090B10, Deep Charcoal #1A1F2B.

## Global Constraints

- No server-side code or accounts — browser-local only (localStorage)
- No build step — ES modules served directly, production is the same static files
- No npm framework dependencies — vanilla JS only
- Vitest is the sole dev dependency (for unit tests)
- All pixel art uses `image-rendering: pixelated` for crisp scaling
- Google Fonts loaded via `<link>`: Orbitron, Inter, JetBrains Mono
- v1 scope: Chapter 1 (The Master Keys) fully playable. Chapters 2-8 data stubs only.
- Responsive: desktop-first (960px content), but must not break on mobile

---

## File Structure

```
src/
  index.html              — entry point, font links, app shell
  style.css               — design system tokens + global styles
  app.js                  — init, router setup, screen mounting
  state.js                — state schema, localStorage read/write, update API
  router.js               — hash-based routing (#/city, #/district/master-keys, etc.)
  screens/
    city-map.js           — isometric city overview, building layout, navigation
    district.js           — district detail: building row, phase tabs, mission list
    briefing.js           — mission briefing: threat intel, steps, Scout sidebar
    debrief.js            — mission debrief: findings report, action taken
    milestone.js          — chapter complete: celebration, shareable card
    stats.js              — stats dashboard: integrity, exposure, progress bars
  data/
    districts.js          — 8 district definitions (id, name, chapter, description)
    accounts.js           — account definitions (id, districtId, name, building asset, links)
    missions.js           — mission definitions (id, accountId, phase, briefing, debrief Qs)
  components/
    hud.js                — top HUD bar (integrity %, exposure, streak)
    scout.js              — Scout dialog bubble component
    building.js           — building sprite renderer (state-aware)
  utils/
    calc.js               — stats calculations (integrity %, exposure score)
    milestone-card.js     — canvas-based shareable card generator
tests/
  state.test.js           — state management tests
  calc.test.js            — stats calculation tests
  data.test.js            — content data integrity tests
  router.test.js          — router tests
assets/                   — (existing) pixel art sprites
vitest.config.js          — vitest configuration
package.json              — dev dependencies only (vitest, serve)
```

---

### Task 1: Project Scaffold + Design System

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `src/index.html`
- Create: `src/style.css`

**Interfaces:**
- Produces: HTML entry point with `<div id="app">`, CSS design tokens as custom properties, dev server and test commands

- [x] **Step 1: Create package.json with dev dependencies**

```json
{
  "name": "reclaim-city",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "npx serve src -l 3000",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.2.0"
  }
}
```

- [x] **Step 2: Create vitest config**

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

- [x] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reclaim City</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [x] **Step 4: Create style.css with design system tokens**

All cyberpunk design tokens as CSS custom properties on `:root`. Global resets. Typography classes. Panel/border utilities. Scanline overlay. Neon glow utilities. Derive all values from the design screens (Main.dc.html etc.).

```css
:root {
  --cyan: #00E5FF;
  --magenta: #FF2D9B;
  --lime: #C6FF00;
  --amber: #FF9F00;
  --charcoal: #1A1F2B;
  --midnight: #090B10;
  --offwhite: #EDEFF3;

  --font-display: 'Orbitron', sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --glow-cyan: 0 0 12px rgba(0, 229, 255, 0.3);
  --glow-magenta: 0 0 12px rgba(255, 45, 155, 0.3);
  --glow-lime: 0 0 12px rgba(198, 255, 0, 0.3);
  --glow-amber: 0 0 12px rgba(255, 159, 0, 0.3);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-body);
  background: var(--midnight);
  color: var(--offwhite);
  min-height: 100vh;
}

img { image-rendering: pixelated; }

#app {
  max-width: 960px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
}

/* Scanline overlay — applied to screens that want it */
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent 0px, transparent 2px,
    rgba(0, 229, 255, 0.015) 2px, rgba(0, 229, 255, 0.015) 4px
  );
  pointer-events: none;
  z-index: 50;
}

/* Panel styles */
.panel {
  background: rgba(26, 31, 43, 0.5);
  border: 1px solid rgba(0, 229, 255, 0.15);
}

.panel--active {
  border-color: rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.05);
}
```

- [x] **Step 5: Install dependencies and verify dev server starts**

Run: `npm install && npx serve src -l 3000 &`
Open: `http://localhost:3000` — should show a blank dark page.
Kill the server.

- [x] **Step 6: Commit**

```bash
git add package.json vitest.config.js src/index.html src/style.css
git commit -m "feat: project scaffold with cyberpunk design system"
```

---

### Task 2: State Management + localStorage

**Files:**
- Create: `src/state.js`
- Create: `tests/state.test.js`

**Interfaces:**
- Produces:
  - `createInitialState()` → `State`
  - `loadState()` → `State`
  - `saveState(state)` → `void`
  - `updateMission(state, missionId, update)` → `State`
  - `toggleAccount(state, accountId, enabled)` → `State`
  - `updateStreak(state)` → `State`
  - `STATE_VERSION` → `number` (current: `1`)

- [x] **Step 1: Write failing tests for state management**

```js
// tests/state.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialState,
  loadState,
  saveState,
  updateMission,
  toggleAccount,
  updateStreak,
  STATE_VERSION,
} from '../src/state.js';

// Mock localStorage
const store = {};
const mockStorage = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, val) => { store[key] = val; }),
  removeItem: vi.fn((key) => { delete store[key]; }),
};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.clearAllMocks();
});

describe('createInitialState', () => {
  it('returns state with correct version', () => {
    const state = createInitialState();
    expect(state.version).toBe(STATE_VERSION);
  });

  it('has empty missions and default accounts', () => {
    const state = createInitialState();
    expect(state.missions).toEqual({});
    expect(Object.keys(state.accounts).length).toBeGreaterThan(0);
  });

  it('has streak initialized to zero', () => {
    const state = createInitialState();
    expect(state.streak.current).toBe(0);
    expect(state.streak.best).toBe(0);
  });
});

describe('loadState / saveState', () => {
  it('returns initial state when localStorage is empty', () => {
    const state = loadState(mockStorage);
    expect(state.version).toBe(STATE_VERSION);
  });

  it('round-trips through save and load', () => {
    const state = createInitialState();
    state.missions['gmail-recon-breach'] = {
      status: 'completed',
      finding: 'no-breaches',
    };
    saveState(state, mockStorage);
    const loaded = loadState(mockStorage);
    expect(loaded.missions['gmail-recon-breach'].status).toBe('completed');
  });
});

describe('updateMission', () => {
  it('sets mission status and preserves other state', () => {
    const state = createInitialState();
    const next = updateMission(state, 'gmail-recon-breach', {
      status: 'completed',
      finding: 'no-breaches',
      action: 'already-strong',
    });
    expect(next.missions['gmail-recon-breach'].status).toBe('completed');
    expect(next.version).toBe(state.version);
  });
});

describe('toggleAccount', () => {
  it('disables an account', () => {
    const state = createInitialState();
    const next = toggleAccount(state, 'gmail', false);
    expect(next.accounts.gmail.enabled).toBe(false);
  });
});

describe('updateStreak', () => {
  it('increments streak for same-day completion', () => {
    const state = createInitialState();
    state.streak.lastDate = new Date().toISOString().split('T')[0];
    state.streak.current = 3;
    const next = updateStreak(state);
    expect(next.streak.current).toBe(3); // same day, no change
  });

  it('increments streak for next-day completion', () => {
    const state = createInitialState();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    state.streak.lastDate = yesterday;
    state.streak.current = 3;
    const next = updateStreak(state);
    expect(next.streak.current).toBe(4);
  });

  it('resets streak if more than 1 day gap', () => {
    const state = createInitialState();
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    state.streak.lastDate = threeDaysAgo;
    state.streak.current = 5;
    const next = updateStreak(state);
    expect(next.streak.current).toBe(1);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/state.test.js`
Expected: FAIL — module not found

- [x] **Step 3: Implement state.js**

```js
// src/state.js
export const STATE_VERSION = 1;
const STORAGE_KEY = 'reclaim-city-state';

const DEFAULT_ACCOUNTS = {
  gmail: { enabled: true, name: 'Gmail', district: 'master-keys' },
  outlook: { enabled: true, name: 'Outlook', district: 'master-keys' },
  icloud: { enabled: true, name: 'iCloud Mail', district: 'master-keys' },
  yahoo: { enabled: true, name: 'Yahoo Mail', district: 'master-keys' },
  protonmail: { enabled: true, name: 'ProtonMail', district: 'master-keys' },
  apple_id: { enabled: true, name: 'Apple ID', district: 'master-keys' },
  google: { enabled: true, name: 'Google Account', district: 'master-keys' },
  microsoft: { enabled: true, name: 'Microsoft', district: 'master-keys' },
  facebook: { enabled: true, name: 'Facebook Login', district: 'master-keys' },
};

export function createInitialState() {
  return {
    version: STATE_VERSION,
    createdAt: new Date().toISOString(),
    accounts: structuredClone(DEFAULT_ACCOUNTS),
    missions: {},
    streak: { current: 0, best: 0, lastDate: null },
  };
}

export function loadState(storage = localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (parsed.version !== STATE_VERSION) return createInitialState();
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveState(state, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function updateMission(state, missionId, update) {
  return {
    ...state,
    missions: {
      ...state.missions,
      [missionId]: {
        ...state.missions[missionId],
        ...update,
        completedAt: update.status === 'completed' ? new Date().toISOString() : undefined,
      },
    },
  };
}

export function toggleAccount(state, accountId, enabled) {
  return {
    ...state,
    accounts: {
      ...state.accounts,
      [accountId]: { ...state.accounts[accountId], enabled },
    },
  };
}

export function updateStreak(state) {
  const today = new Date().toISOString().split('T')[0];
  const { lastDate, current, best } = state.streak;

  if (lastDate === today) return state;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isConsecutive = lastDate === yesterday;
  const newCurrent = isConsecutive ? current + 1 : 1;
  const newBest = Math.max(best, newCurrent);

  return {
    ...state,
    streak: { current: newCurrent, best: newBest, lastDate: today },
  };
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/state.test.js`
Expected: All PASS

- [x] **Step 5: Commit**

```bash
git add src/state.js tests/state.test.js
git commit -m "feat: state management with localStorage persistence"
```

---

### Task 3: Content Data Model — Chapter 1

**Files:**
- Create: `src/data/districts.js`
- Create: `src/data/accounts.js`
- Create: `src/data/missions.js`
- Create: `tests/data.test.js`

**Interfaces:**
- Consumes: Account IDs from `state.js`'s `DEFAULT_ACCOUNTS`
- Produces:
  - `DISTRICTS` → `Array<{id, name, chapter, description, flavor}>`
  - `ACCOUNTS` → `Record<id, {name, district, building, buildingDark, securityUrl, riskLevel}>`
  - `MISSIONS` → `Array<{id, accountId, phase, title, briefing, steps, debriefQs, scoutDialog, estimatedMinutes, externalUrl}>`
  - `getMissionsForDistrict(districtId)` → `Mission[]`
  - `getMissionsForAccount(accountId)` → `Mission[]`

- [x] **Step 1: Write data integrity tests**

```js
// tests/data.test.js
import { describe, it, expect } from 'vitest';
import { DISTRICTS } from '../src/data/districts.js';
import { ACCOUNTS } from '../src/data/accounts.js';
import { MISSIONS, getMissionsForDistrict, getMissionsForAccount } from '../src/data/missions.js';

describe('DISTRICTS', () => {
  it('has 8 districts', () => {
    expect(DISTRICTS).toHaveLength(8);
  });

  it('each district has required fields', () => {
    for (const d of DISTRICTS) {
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('chapter');
      expect(d).toHaveProperty('description');
    }
  });

  it('chapters are ordered 1-8', () => {
    const chapters = DISTRICTS.map((d) => d.chapter);
    expect(chapters).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('ACCOUNTS', () => {
  it('every account references a valid district', () => {
    const districtIds = new Set(DISTRICTS.map((d) => d.id));
    for (const [id, acct] of Object.entries(ACCOUNTS)) {
      expect(districtIds.has(acct.district), `${id} has invalid district ${acct.district}`).toBe(true);
    }
  });

  it('Chapter 1 accounts have building assets', () => {
    const ch1 = Object.entries(ACCOUNTS).filter(([, a]) => a.district === 'master-keys');
    for (const [id, acct] of ch1) {
      expect(acct.building, `${id} missing building`).toBeTruthy();
      expect(acct.buildingDark, `${id} missing buildingDark`).toBeTruthy();
    }
  });
});

describe('MISSIONS', () => {
  it('every mission references a valid account', () => {
    for (const m of MISSIONS) {
      expect(ACCOUNTS[m.accountId], `mission ${m.id} has invalid account ${m.accountId}`).toBeTruthy();
    }
  });

  it('every mission has briefing, steps, and debrief questions', () => {
    for (const m of MISSIONS) {
      expect(m.briefing, `${m.id} missing briefing`).toBeTruthy();
      expect(m.steps?.length, `${m.id} missing steps`).toBeGreaterThan(0);
      expect(m.debriefQs?.length, `${m.id} missing debrief questions`).toBeGreaterThan(0);
    }
  });

  it('phases are valid', () => {
    const validPhases = new Set(['survey', 'recon', 'fortify', 'reclaim']);
    for (const m of MISSIONS) {
      expect(validPhases.has(m.phase), `${m.id} has invalid phase ${m.phase}`).toBe(true);
    }
  });

  it('getMissionsForDistrict returns only that district missions', () => {
    const missions = getMissionsForDistrict('master-keys');
    expect(missions.length).toBeGreaterThan(0);
    for (const m of missions) {
      expect(ACCOUNTS[m.accountId].district).toBe('master-keys');
    }
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/data.test.js`
Expected: FAIL — modules not found

- [x] **Step 3: Create districts.js**

```js
// src/data/districts.js
export const DISTRICTS = [
  {
    id: 'master-keys',
    name: 'The Master Keys',
    chapter: 1,
    description: 'Email & Identity Providers — the foundation everything else sits on',
    flavor: 'Secure this first or nothing else matters.',
  },
  {
    id: 'vault',
    name: 'The Vault',
    chapter: 2,
    description: 'Financial — banks, payment apps, investments',
    flavor: 'Your money lives here.',
  },
  {
    id: 'square',
    name: 'The Square',
    chapter: 3,
    description: 'Social media & messaging',
    flavor: 'A hijacked social account impersonates you to people who trust you.',
  },
  {
    id: 'archives',
    name: 'The Archives',
    chapter: 4,
    description: 'Cloud storage & work accounts',
    flavor: 'Your files, tax returns, ID scans, professional reputation.',
  },
  {
    id: 'marketplace',
    name: 'The Marketplace',
    chapter: 5,
    description: 'Shopping & streaming',
    flavor: 'Lower stakes but real attack surface — stored payment methods, your address.',
  },
  {
    id: 'capitol',
    name: 'The Capitol',
    chapter: 6,
    description: 'Government accounts',
    flavor: 'Legal identity. Compromise here is identity theft in the fullest sense.',
  },
  {
    id: 'perimeter',
    name: 'The Perimeter',
    chapter: 7,
    description: 'Borders & scam defense',
    flavor: 'Cross-cutting defenses that protect the whole city.',
  },
  {
    id: 'reclamation',
    name: 'The Reclamation',
    chapter: 8,
    description: 'Data broker opt-outs',
    flavor: 'The endgame: getting your data back from the brokers who sell it.',
  },
];
```

- [x] **Step 4: Create accounts.js with Chapter 1 accounts and building mappings**

Define all 9 Master Keys accounts with their building asset paths, security URLs, and risk levels. Chapters 2-8 get stub accounts (id, name, district only — no building assets yet).

```js
// src/data/accounts.js
export const ACCOUNTS = {
  // Chapter 1: The Master Keys
  gmail: {
    name: 'Gmail',
    district: 'master-keys',
    building: 'assets/buildings/gmail.png',
    buildingDark: 'assets/buildings/gmail_dark.png',
    securityUrl: 'https://myaccount.google.com/security',
    riskLevel: 'high',
  },
  outlook: {
    name: 'Outlook',
    district: 'master-keys',
    building: 'assets/buildings/outlook.png',
    buildingDark: 'assets/buildings/outlook_dark.png',
    securityUrl: 'https://account.live.com/proofs/manage',
    riskLevel: 'high',
  },
  icloud: {
    name: 'iCloud Mail',
    district: 'master-keys',
    building: 'assets/buildings/icloud.png',
    buildingDark: 'assets/buildings/icloud_dark.png',
    securityUrl: 'https://account.apple.com/account/manage',
    riskLevel: 'high',
  },
  yahoo: {
    name: 'Yahoo Mail',
    district: 'master-keys',
    building: 'assets/buildings/yahoo.png',
    buildingDark: 'assets/buildings/yahoo_dark.png',
    securityUrl: 'https://login.yahoo.com/account/security',
    riskLevel: 'high',
  },
  protonmail: {
    name: 'ProtonMail',
    district: 'master-keys',
    building: 'assets/buildings/protonmail.png',
    buildingDark: 'assets/buildings/protonmail_dark.png',
    securityUrl: 'https://account.proton.me/u/0/mail/security',
    riskLevel: 'high',
  },
  apple_id: {
    name: 'Apple ID',
    district: 'master-keys',
    building: 'assets/buildings/apple_id.png',
    buildingDark: 'assets/buildings/apple_id_dark.png',
    securityUrl: 'https://account.apple.com/account/manage',
    riskLevel: 'high',
  },
  google: {
    name: 'Google Account',
    district: 'master-keys',
    building: 'assets/buildings/google.png',
    buildingDark: 'assets/buildings/google_dark.png',
    securityUrl: 'https://myaccount.google.com/security',
    riskLevel: 'high',
  },
  microsoft: {
    name: 'Microsoft',
    district: 'master-keys',
    building: 'assets/buildings/microsoft.png',
    buildingDark: 'assets/buildings/microsoft_dark.png',
    securityUrl: 'https://account.live.com/proofs/manage',
    riskLevel: 'high',
  },
  facebook: {
    name: 'Facebook Login',
    district: 'master-keys',
    building: 'assets/buildings/facebook.png',
    buildingDark: 'assets/buildings/facebook_dark.png',
    securityUrl: 'https://www.facebook.com/settings?tab=security',
    riskLevel: 'high',
  },
  // Chapters 2-8: stub accounts (name + district only, no building assets)
  primary_bank: { name: 'Primary Bank', district: 'vault', riskLevel: 'high' },
  credit_card: { name: 'Credit Card Portal', district: 'vault', riskLevel: 'high' },
  paypal: { name: 'PayPal', district: 'vault', riskLevel: 'high' },
  venmo: { name: 'Venmo', district: 'vault', riskLevel: 'medium' },
  cashapp: { name: 'Cash App', district: 'vault', riskLevel: 'medium' },
  instagram: { name: 'Instagram', district: 'square', riskLevel: 'medium' },
  twitter: { name: 'Twitter / X', district: 'square', riskLevel: 'medium' },
  tiktok: { name: 'TikTok', district: 'square', riskLevel: 'medium' },
  linkedin: { name: 'LinkedIn', district: 'square', riskLevel: 'medium' },
  whatsapp: { name: 'WhatsApp', district: 'square', riskLevel: 'medium' },
  signal: { name: 'Signal', district: 'square', riskLevel: 'low' },
  discord: { name: 'Discord', district: 'square', riskLevel: 'medium' },
  gdrive: { name: 'Google Drive', district: 'archives', riskLevel: 'high' },
  dropbox: { name: 'Dropbox', district: 'archives', riskLevel: 'high' },
  github: { name: 'GitHub', district: 'archives', riskLevel: 'high' },
  amazon: { name: 'Amazon', district: 'marketplace', riskLevel: 'medium' },
  netflix: { name: 'Netflix', district: 'marketplace', riskLevel: 'low' },
  ssa: { name: 'SSA (Social Security)', district: 'capitol', riskLevel: 'high' },
  irs: { name: 'IRS (Tax Account)', district: 'capitol', riskLevel: 'high' },
};
```

- [x] **Step 5: Create missions.js with full Chapter 1 missions**

Define the complete set of missions for all 9 Master Keys accounts across all 4 phases. Helper functions at the bottom. Each mission follows this schema (example for Gmail breach recon):

```js
// src/data/missions.js
import { ACCOUNTS } from './accounts.js';

export const MISSIONS = [
  // === CHAPTER 1: THE MASTER KEYS ===

  // Gmail — Recon
  {
    id: 'gmail-recon-breach',
    accountId: 'gmail',
    phase: 'recon',
    title: 'Breach Recon: Gmail',
    briefing: 'Data brokers buy and sell leaked credentials by the million. If your Gmail password appeared in a breach, it\'s already loaded into automated attack scripts hitting login pages around the clock.',
    steps: [
      { text: 'Open haveibeenpwned.com', url: 'https://haveibeenpwned.com' },
      { text: 'Enter your Gmail address' },
      { text: 'Read the results — note how many breaches (if any)' },
    ],
    debriefQs: [
      {
        id: 'finding',
        label: 'What did you find?',
        options: [
          { value: 'no-breaches', text: 'No breaches found', severity: 'safe' },
          { value: '1-2-breaches', text: 'Found in 1–2 breaches', severity: 'warn' },
          { value: '3plus-breaches', text: 'Found in 3+ breaches', severity: 'crit' },
          { value: 'skip', text: 'Couldn\'t check right now', severity: 'skip' },
        ],
      },
      {
        id: 'action',
        label: 'Did you reset your password?',
        options: [
          { value: 'reset-password', text: 'Yes, changed to a new unique password' },
          { value: 'already-strong', text: 'It was already unique and strong' },
          { value: 'later', text: 'I\'ll come back to this' },
        ],
      },
    ],
    scoutDialog: {
      briefing: '"Gmail is the master key. Most of your password resets flow through it — lose this and you lose access to everything downstream."',
      debrief: {
        'no-breaches': '"Clean — that\'s a solid start. Your email fortress is holding."',
        '1-2-breaches': '"Found some exposure. Not unusual — the important thing is we caught it and locked it down."',
        '3plus-breaches': '"That\'s a lot of exposure. Good thing we\'re here. Let\'s get that password changed immediately."',
        'skip': '"No rush. This mission will be here when you\'re ready."',
      },
    },
    estimatedMinutes: 3,
  },

  // Continue with the same schema for all 9 accounts × 4 phases:
  // gmail-recon-login, gmail-fortify-password, gmail-fortify-2fa, gmail-reclaim-privacy
  // outlook-recon-breach, outlook-recon-login, outlook-fortify-password, ...
  // (each with unique briefing text, steps, and Scout dialog variants)
  // ...
];

export function getMissionsForDistrict(districtId) {
  return MISSIONS.filter((m) => ACCOUNTS[m.accountId]?.district === districtId);
}

export function getMissionsForAccount(accountId) {
  return MISSIONS.filter((m) => m.accountId === accountId);
}
```

Write every mission for all 9 Master Keys accounts following this exact schema. Mission IDs use the pattern `{accountId}-{phase}-{action}` (e.g. `gmail-recon-breach`, `gmail-fortify-password`, `icloud-reclaim-privacy`). Each recon mission gets per-finding Scout dialog variants in `scoutDialog.debrief`. The `skip` debrief option always sets status to `'skipped'` — the mission stays available for retry.

- [x] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/data.test.js`
Expected: All PASS

- [x] **Step 7: Commit**

```bash
git add src/data/ tests/data.test.js
git commit -m "feat: content data model with Chapter 1 missions"
```

---

### Task 4: Router + Screen System

**Files:**
- Create: `src/router.js`
- Create: `src/app.js`
- Create: `tests/router.test.js`

**Interfaces:**
- Consumes: Screen render functions (stubbed initially)
- Produces:
  - `navigate(path)` — programmatic navigation, sets `location.hash`
  - `parseRoute(hash)` → `{screen, params}` — parses hash into screen name + params
  - `initRouter(renderFn)` — listens for hash changes, calls `renderFn(route)` on change
  - Routes: `/city`, `/district/:id`, `/mission/:id/briefing`, `/mission/:id/debrief`, `/milestone/:districtId`, `/stats`

- [x] **Step 1: Write router tests**

```js
// tests/router.test.js
import { describe, it, expect } from 'vitest';
import { parseRoute } from '../src/router.js';

describe('parseRoute', () => {
  it('parses city map route', () => {
    expect(parseRoute('#/city')).toEqual({ screen: 'city', params: {} });
  });

  it('parses district route', () => {
    expect(parseRoute('#/district/master-keys')).toEqual({
      screen: 'district',
      params: { id: 'master-keys' },
    });
  });

  it('parses mission briefing route', () => {
    expect(parseRoute('#/mission/gmail-recon-breach/briefing')).toEqual({
      screen: 'briefing',
      params: { id: 'gmail-recon-breach' },
    });
  });

  it('parses mission debrief route', () => {
    expect(parseRoute('#/mission/gmail-recon-breach/debrief')).toEqual({
      screen: 'debrief',
      params: { id: 'gmail-recon-breach' },
    });
  });

  it('parses stats route', () => {
    expect(parseRoute('#/stats')).toEqual({ screen: 'stats', params: {} });
  });

  it('parses milestone route', () => {
    expect(parseRoute('#/milestone/master-keys')).toEqual({
      screen: 'milestone',
      params: { districtId: 'master-keys' },
    });
  });

  it('defaults to city for unknown routes', () => {
    expect(parseRoute('#/unknown')).toEqual({ screen: 'city', params: {} });
    expect(parseRoute('')).toEqual({ screen: 'city', params: {} });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/router.test.js`
Expected: FAIL

- [x] **Step 3: Implement router.js**

```js
// src/router.js

const ROUTES = [
  { pattern: /^#\/city$/, screen: 'city', params: () => ({}) },
  { pattern: /^#\/district\/([^/]+)$/, screen: 'district', params: (m) => ({ id: m[1] }) },
  { pattern: /^#\/mission\/([^/]+)\/briefing$/, screen: 'briefing', params: (m) => ({ id: m[1] }) },
  { pattern: /^#\/mission\/([^/]+)\/debrief$/, screen: 'debrief', params: (m) => ({ id: m[1] }) },
  { pattern: /^#\/milestone\/([^/]+)$/, screen: 'milestone', params: (m) => ({ districtId: m[1] }) },
  { pattern: /^#\/stats$/, screen: 'stats', params: () => ({}) },
];

export function parseRoute(hash) {
  for (const route of ROUTES) {
    const match = hash.match(route.pattern);
    if (match) return { screen: route.screen, params: route.params(match) };
  }
  return { screen: 'city', params: {} };
}

export function navigate(path) {
  location.hash = path;
}

export function initRouter(onRoute) {
  const handle = () => onRoute(parseRoute(location.hash));
  window.addEventListener('hashchange', handle);
  handle();
}
```

- [x] **Step 4: Implement app.js — wires router to screen rendering**

```js
// src/app.js
import { initRouter, navigate } from './router.js';
import { loadState, saveState } from './state.js';

let state = loadState();

const app = document.getElementById('app');

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

// Make navigate and state available to onclick handlers
window.reclaimCity = { navigate, state, saveState };

initRouter(render);
```

- [x] **Step 5: Run router tests**

Run: `npx vitest run tests/router.test.js`
Expected: All PASS

- [x] **Step 6: Manual test — start dev server, verify routing works**

Run: `npx serve src -l 3000`
Navigate to `http://localhost:3000/#/city` — should show "RECLAIM CITY" placeholder.
Navigate to `http://localhost:3000/#/district/master-keys` — should show "District: master-keys".
Navigate to `http://localhost:3000/#/stats` — should show "Stats dashboard".

- [x] **Step 7: Commit**

```bash
git add src/router.js src/app.js tests/router.test.js
git commit -m "feat: hash router and app shell with screen stubs"
```

---

### Task 5: Stats Calculation Engine

**Files:**
- Create: `src/utils/calc.js`
- Create: `tests/calc.test.js`

**Interfaces:**
- Consumes: `State` from `state.js`, `MISSIONS` from `missions.js`, `ACCOUNTS` from `accounts.js`
- Produces:
  - `calcIntegrity(state)` → `number` (0-100, percentage of enabled missions completed)
  - `calcExposure(state)` → `number` (starts at 1000, drops with each completion)
  - `calcDistrictProgress(state, districtId)` → `{total, completed, percent}`
  - `calcFindings(state)` → `{breachesFound, passwordsReset, twoFactorEnabled, optOutsFiled}`
  - `getBuildingState(state, accountId)` → `'occupied' | 'in-progress' | 'liberated' | 'liberated-scarred'` (scarred = breach was found and fixed; visual trophy mark)

- [x] **Step 1: Write failing tests**

```js
// tests/calc.test.js
import { describe, it, expect } from 'vitest';
import {
  calcIntegrity,
  calcExposure,
  calcDistrictProgress,
  calcFindings,
  getBuildingState,
} from '../src/utils/calc.js';
import { createInitialState, updateMission } from '../src/state.js';

describe('calcIntegrity', () => {
  it('returns 0 for fresh state', () => {
    expect(calcIntegrity(createInitialState())).toBe(0);
  });

  it('returns percentage of completed missions', () => {
    let state = createInitialState();
    state = updateMission(state, 'gmail-recon-breach', { status: 'completed' });
    const integrity = calcIntegrity(state);
    expect(integrity).toBeGreaterThan(0);
    expect(integrity).toBeLessThan(100);
  });
});

describe('calcExposure', () => {
  it('starts at 1000 for fresh state', () => {
    expect(calcExposure(createInitialState())).toBe(1000);
  });

  it('decreases with completed missions', () => {
    let state = createInitialState();
    state = updateMission(state, 'gmail-recon-breach', { status: 'completed' });
    expect(calcExposure(state)).toBeLessThan(1000);
  });
});

describe('calcDistrictProgress', () => {
  it('returns 0% for no completions', () => {
    const result = calcDistrictProgress(createInitialState(), 'master-keys');
    expect(result.percent).toBe(0);
    expect(result.total).toBeGreaterThan(0);
  });
});

describe('getBuildingState', () => {
  it('returns occupied for no completions', () => {
    expect(getBuildingState(createInitialState(), 'gmail')).toBe('occupied');
  });

  it('returns in-progress for partial completions', () => {
    let state = createInitialState();
    state = updateMission(state, 'gmail-recon-breach', { status: 'completed' });
    expect(getBuildingState(state, 'gmail')).toBe('in-progress');
  });
});
```

- [x] **Step 2: Run tests — expect FAIL**

- [x] **Step 3: Implement calc.js**

```js
// src/utils/calc.js
import { MISSIONS, getMissionsForAccount } from '../data/missions.js';
import { ACCOUNTS } from '../data/accounts.js';

export function calcIntegrity(state) {
  const enabled = Object.entries(state.accounts).filter(([, a]) => a.enabled).map(([id]) => id);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey');
  if (relevant.length === 0) return 0;
  const completed = relevant.filter((m) => state.missions[m.id]?.status === 'completed').length;
  return Math.round((completed / relevant.length) * 100);
}

export function calcExposure(state) {
  const enabled = Object.entries(state.accounts).filter(([, a]) => a.enabled).map(([id]) => id);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey');
  const completed = relevant.filter((m) => state.missions[m.id]?.status === 'completed').length;
  const perMission = relevant.length > 0 ? 1000 / relevant.length : 0;
  return Math.max(0, Math.round(1000 - completed * perMission));
}

export function calcDistrictProgress(state, districtId) {
  const acctIds = Object.entries(ACCOUNTS).filter(([, a]) => a.district === districtId).map(([id]) => id);
  const enabled = acctIds.filter((id) => state.accounts[id]?.enabled);
  const relevant = MISSIONS.filter((m) => enabled.includes(m.accountId) && m.phase !== 'survey');
  const completed = relevant.filter((m) => state.missions[m.id]?.status === 'completed').length;
  return { total: relevant.length, completed, percent: relevant.length ? Math.round((completed / relevant.length) * 100) : 0 };
}

export function calcFindings(state) {
  const missions = Object.values(state.missions).filter((m) => m.status === 'completed');
  return {
    breachesFound: missions.filter((m) => m.finding && m.finding !== 'no-breaches').length,
    passwordsReset: missions.filter((m) => m.action === 'reset-password').length,
    twoFactorEnabled: missions.filter((m) => m.action === 'enabled-2fa').length,
    optOutsFiled: missions.filter((m) => m.action === 'filed-optout').length,
  };
}

export function getBuildingState(state, accountId) {
  const missions = getMissionsForAccount(accountId).filter((m) => m.phase !== 'survey');
  if (missions.length === 0) return 'occupied';
  const completed = missions.filter((m) => state.missions[m.id]?.status === 'completed');
  if (completed.length === 0) return 'occupied';
  if (completed.length < missions.length) return 'in-progress';
  const hadBreach = completed.some((m) => {
    const s = state.missions[m.id];
    return s?.finding && s.finding !== 'no-breaches';
  });
  return hadBreach ? 'liberated-scarred' : 'liberated';
}
```

- [x] **Step 4: Run tests — expect PASS**

- [x] **Step 5: Commit**

```bash
git add src/utils/calc.js tests/calc.test.js
git commit -m "feat: stats calculation engine"
```

---

### Task 6: HUD + Scout Components

**Files:**
- Create: `src/components/hud.js`
- Create: `src/components/scout.js`
- Create: `src/components/building.js`

**Interfaces:**
- Consumes: `calcIntegrity`, `calcExposure` from `calc.js`, `State` from `state.js`
- Produces:
  - `renderHud(state)` → HTML string for the top HUD bar
  - `renderScout(message, options?)` → HTML string for Scout dialog
  - `renderBuilding(accountId, buildingState, size?)` → HTML string for a building sprite

- [x] **Step 1: Implement hud.js**

Renders the top HUD bar matching the cyberpunk design: Orbitron "RECLAIM CITY" title, lime Integrity %, magenta Exposure score, amber Streak. Uses CSS classes from style.css. Returns an HTML string.

- [x] **Step 2: Implement scout.js**

Renders Scout's avatar (scout_0.png at 64px with cyan drop-shadow) plus a dialog box with cyan border. Accepts a message string and optional action button text/href. Returns HTML string.

- [x] **Step 3: Implement building.js**

Renders a building sprite based on account ID and state. Uses `ACCOUNTS[accountId].building` for liberated, `ACCOUNTS[accountId].buildingDark` for occupied. Applies CSS filters: `brightness(1.1) drop-shadow(0 0 8px cyan)` for liberated, `brightness(1.1) drop-shadow(0 0 8px cyan)` + a small magenta scar badge overlay for `liberated-scarred` (spec: "battle scar/trophy mark — pride, not shame"), `brightness(0.5)` for occupied, `brightness(0.8) saturate(0.7)` for in-progress. Returns HTML string with the `<img>` and account label.

- [x] **Step 4: Manual test — import components into app.js stub screens, verify rendering**

- [x] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: HUD, Scout, and building sprite components"
```

---

### Task 7: City Map Screen

**Files:**
- Create: `src/screens/city-map.js`
- Modify: `src/app.js` — replace city stub with real render

**Interfaces:**
- Consumes: `renderHud`, `renderScout`, `renderBuilding`, `DISTRICTS`, `calcDistrictProgress`, `getBuildingState`, `State`
- Produces: `renderCityMap(state)` → full HTML string for the isometric city map screen

- [x] **Step 1: Implement city-map.js**

Render the isometric city map matching Main.dc.html's design. Use the generic isometric building sprites (`iso_occupied.png`, `iso_liberated.png`, `iso_tower_occ.png`, `iso_tower_lib.png`, `iso_progress.png`) arranged in staggered rows. The building states for the foreground rows are driven by `getBuildingState` for accounts in each district. District labels float above with progress bars. Scout dialog at the bottom with "Next Mission" button. HUD at top.

**Chapter 1 "Start Here" highlight:** On the city map, Chapter 1 (Master Keys) gets a pulsing cyan border and a "▶ START HERE" label when no missions have been completed yet. Scout's initial dialog explains why email comes first. Other districts are visible but dimmer — all clickable (no artificial locks per spec), but the visual hierarchy makes the recommended path clear.

Click handlers: clicking a district label navigates to `#/district/{id}`. "Next Mission" navigates to the next available mission's briefing. "Stats" button navigates to `#/stats`.

- [x] **Step 2: Wire into app.js — replace the city stub**

- [x] **Step 3: Manual test — start dev server, verify city map renders with pixel art**

- [x] **Step 4: Commit**

```bash
git add src/screens/city-map.js src/app.js
git commit -m "feat: isometric city map screen"
```

---

### Task 8: District Screen

**Files:**
- Create: `src/screens/district.js`
- Modify: `src/app.js` — replace district stub

**Interfaces:**
- Consumes: `renderHud`, `renderBuilding`, `DISTRICTS`, `ACCOUNTS`, `getMissionsForDistrict`, `State`, `getBuildingState`, `calcDistrictProgress`
- Produces: `renderDistrict(state, districtId)` → full HTML string

- [x] **Step 1: Implement district.js**

Matching District.dc.html: header with back button + district name + integrity %, building skyline row showing each account's unique sprite in its current state, phase tabs (Survey/Recon/Fortify/Reclaim) with active tab highlighting, mission list with per-mission status (completed/active/upcoming), per-mission building thumbnail.

Click handlers: back button → `#/city`. Phase tabs filter the mission list. Clicking "Start" on an available mission → `#/mission/{id}/briefing`. Clicking a completed mission shows its debrief summary.

- [x] **Step 2: Wire into app.js**

- [x] **Step 3: Manual test — navigate to `#/district/master-keys`, verify building row and mission list**

- [x] **Step 4: Commit**

```bash
git add src/screens/district.js src/app.js
git commit -m "feat: district screen with building row and mission list"
```

---

### Task 9: Briefing + Debrief Screens

**Files:**
- Create: `src/screens/briefing.js`
- Create: `src/screens/debrief.js`
- Modify: `src/app.js` — replace stubs, wire state updates

**Interfaces:**
- Consumes: `MISSIONS`, `ACCOUNTS`, `renderScout`, `renderBuilding`, `State`, `navigate`
- Produces:
  - `renderBriefing(state, missionId)` → HTML string
  - `renderDebrief(state, missionId)` → HTML string

- [x] **Step 1: Implement briefing.js**

Matching Briefing.dc.html: header with breadcrumb (district/phase), mission title in Orbitron with cyan glow, "THREAT INTEL" panel with briefing text, "YOUR MOVE" panel with numbered steps (01/02/03 in JetBrains Mono), "GO DO IT" button that opens the external URL in a new tab and then navigates to `#/mission/{id}/debrief`, "Not now" that goes back to the district. Scout sidebar with portrait, dialog, and building transformation preview (dark → liberated using that account's specific building sprites).

- [x] **Step 2: Implement debrief.js**

Matching Debrief.dc.html: header "MISSION DEBRIEF", Scout message asking what was found, radio-style choice groups for each debrief question (findings + action), severity tags (SAFE/WARN/CRIT/SKIP), "SUBMIT REPORT" button that calls `updateMission` + `updateStreak` + `saveState` and then navigates back to the district.

The "Couldn't check right now" option sets status to `'skipped'` — the mission stays available.

- [x] **Step 3: Wire into app.js with state mutation on submit**

The debrief submit handler must:
1. Call `updateMission(state, missionId, {status, finding, action})`
2. Call `updateStreak(state)` 
3. Call `saveState(state)`
4. Check if district is now 100% — if so, navigate to `#/milestone/{districtId}`
5. Otherwise navigate to `#/district/{districtId}`

- [x] **Step 4: Manual test — complete a full mission cycle: district → briefing → external link → debrief → submit → back to district with updated state**

- [x] **Step 5: Commit**

```bash
git add src/screens/briefing.js src/screens/debrief.js src/app.js
git commit -m "feat: mission briefing and debrief screens with state updates"
```

---

### Task 10: Stats Dashboard Screen

**Files:**
- Create: `src/screens/stats.js`
- Modify: `src/app.js` — replace stats stub

**Interfaces:**
- Consumes: `calcIntegrity`, `calcExposure`, `calcDistrictProgress`, `calcFindings`, `DISTRICTS`, `State`
- Produces: `renderStats(state)` → HTML string

- [x] **Step 1: Implement stats.js**

Matching Stats.dc.html: header "YOUR CITY", three stat cards (Integrity ring in lime/cyan, Exposure ring in magenta, Streak in amber), district progress bars for all 8 districts with cyan fill, findings log (breaches found, passwords reset, 2FA enabled, opt-outs filed) with neon stat counters. Back button to city map.

The ring charts use inline SVG with `stroke-dasharray`/`stroke-dashoffset` to show percentage fill, matching the design screens.

- [x] **Step 2: Wire into app.js**

- [x] **Step 3: Manual test — navigate to `#/stats`, verify rings and progress bars update based on completed missions**

- [x] **Step 4: Commit**

```bash
git add src/screens/stats.js src/app.js
git commit -m "feat: stats dashboard with ring charts and progress bars"
```

---

### Task 11: Milestone Screen + Shareable Cards

**Files:**
- Create: `src/screens/milestone.js`
- Create: `src/utils/milestone-card.js`
- Modify: `src/app.js` — replace milestone stub

**Interfaces:**
- Consumes: `DISTRICTS`, `calcDistrictProgress`, `calcFindings`, `State`
- Produces:
  - `renderMilestone(state, districtId)` → HTML string
  - `generateMilestoneCard(districtName, stats)` → `HTMLCanvasElement` (for sharing)

- [x] **Step 1: Implement milestone.js**

Matching Milestone.dc.html: celebration header "LIBERATED" with cyan neon glow, liberated building skyline using account sprites, stats row (accounts secured, breaches fixed, percent), shareable card preview, "Share Card" button (copies card image to clipboard or opens share dialog), "Continue to next chapter" button.

- [x] **Step 2: Implement milestone-card.js**

Uses the Canvas API to generate a 600x315 card image (social media OG dimensions) with the cyberpunk styling: dark background, "RECLAIM CITY" branding, district name, stats, and "themultiverse.school/reclaim" URL. Returns a canvas element. The "Share" button converts this to a blob and uses `navigator.clipboard.write` (with PNG ClipboardItem) or falls back to `navigator.share` where available.

- [x] **Step 3: Wire into app.js**

- [x] **Step 4: Manual test — complete all Chapter 1 missions, verify milestone screen appears, verify card generation and share**

- [x] **Step 5: Commit**

```bash
git add src/screens/milestone.js src/utils/milestone-card.js src/app.js
git commit -m "feat: milestone celebration screen with shareable cards"
```

---

### Task 12: Survey Phase Flow

**Files:**
- Modify: `src/screens/district.js` — add survey phase UI
- Modify: `src/app.js` — wire survey state changes

**Interfaces:**
- Consumes: `toggleAccount`, `saveState`, `ACCOUNTS`
- Produces: Survey phase in district screen — toggle switches for "Do you use this account?"

- [x] **Step 1: Add survey phase to district.js**

When the Survey tab is active, show each account with a toggle: "Do you use [Account Name]?" Toggling off sets `accounts[id].enabled = false` and removes it from the city/mission list. Toggling on re-enables it. Changes persist immediately via `saveState`. Survey is always "complete" — it's the setup step. Add a "Done with survey — start recon" button that switches to the Recon tab.

- [x] **Step 2: Manual test — toggle accounts on/off, verify mission counts update, verify city map reflects disabled accounts**

- [x] **Step 3: Commit**

```bash
git add src/screens/district.js src/app.js
git commit -m "feat: survey phase with account toggle flow"
```

---

### Task 13: End-to-End Polish + Edge Cases

**Files:**
- Modify: `src/app.js` — global error handling, first-visit welcome
- Modify: `src/style.css` — responsive breakpoints, transitions
- Modify: various screens — loading states, empty states

**Interfaces:**
- Consumes: all modules
- Produces: polished, playable v1

- [x] **Step 1: First-visit welcome flow**

On first visit (no localStorage state), show a brief intro screen: "RECLAIM CITY / TAKE BACK YOUR DATA / Your city has been taken by data brokers. Take it back, building by building." with a "Begin" button that creates initial state and navigates to `#/city`.

- [x] **Step 2: Responsive CSS**

Add `@media` queries for `max-width: 768px`: stack HUD stats vertically, reduce building sizes in city map, make mission list full-width, adjust font sizes. The game should be usable on a phone browser even if it's designed desktop-first.

- [x] **Step 3: Navigation consistency**

Verify all back buttons work. Verify browser back/forward works with hash routing. Verify refreshing any screen restores correctly from localStorage.

- [x] **Step 4: Edge cases**

Handle: all accounts disabled (show "Enable some accounts in Survey to get started"), all missions completed (show celebration on city map), localStorage full or unavailable (graceful degradation), invalid mission/district IDs in URL (redirect to city).

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: welcome flow, responsive layout, edge cases"
```

---

---

### Task 14: Umami Analytics

**Files:**
- Modify: `src/index.html` — add Umami tracking script
- Modify: `src/app.js` — track page views on route changes, track custom events

**Interfaces:**
- Consumes: `initRouter` from `router.js`
- Produces: Analytics tracking on every screen view + custom events for mission completions

- [x] **Step 1: Add Umami script tag to index.html**

Add the Umami tracking script to `<head>`. The `data-website-id` comes from the Umami dashboard after creating the site. Use `defer` so it doesn't block rendering.

```html
<script defer src="https://analytics.themultiverse.school/script.js" data-website-id="SITE_ID_HERE"></script>
```

Note: Replace `SITE_ID_HERE` with the actual ID from Umami after creating the site. The analytics host may differ — check the Multiverse School's Umami instance URL.

- [x] **Step 2: Track route changes as page views**

In `app.js`, after each route render, call Umami's track function. Umami auto-tracks page views on SPAs via `hashchange` events when `data-auto-track` is enabled, but we want explicit custom events too.

```js
// In the render function, after mounting the screen:
if (typeof umami !== 'undefined') {
  umami.track(props => ({ ...props, url: location.hash, title: route.screen }));
}
```

- [x] **Step 3: Track custom game events**

Add event tracking for key actions: mission started, mission completed (with finding severity), district completed, account toggled. These go in the debrief submit handler and survey toggle handler.

```js
// In debrief submit:
if (typeof umami !== 'undefined') {
  umami.track('mission-completed', {
    mission: missionId,
    district: districtId,
    finding: selectedFinding,
    phase: mission.phase,
  });
}
```

- [x] **Step 4: Verify in dev — open Network tab, confirm Umami requests fire on navigation and mission completion**

- [x] **Step 5: Commit**

```bash
git add src/index.html src/app.js
git commit -m "feat: Umami analytics for page views and game events"
```

---

### Task 15: GlitchTip Error Tracking

**Files:**
- Modify: `src/index.html` — add Sentry/GlitchTip SDK
- Create: `src/utils/errors.js` — error capture initialization + helpers
- Modify: `src/app.js` — initialize error tracking, wrap render in try/catch

**Interfaces:**
- Produces:
  - `initErrorTracking()` — initializes Sentry SDK with GlitchTip DSN
  - Global `window.onerror` and `unhandledrejection` capture
  - Manual `captureError(error, context?)` for caught errors

- [x] **Step 1: Add Sentry browser SDK via CDN**

GlitchTip is Sentry-compatible, so use the Sentry browser SDK. Add to index.html `<head>`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/sentry-browser/7.119.0/bundle.min.js" integrity="sha384-LOOKUP_HASH_AT_BUILD_TIME" crossorigin="anonymous"></script>
```

Note: Look up the SRI hash from cdnjs.cloudflare.com at build time — the hash changes per version. Pin the exact version.
```

- [x] **Step 2: Create errors.js with initialization**

```js
// src/utils/errors.js
const GLITCHTIP_DSN = 'https://YOUR_KEY@glitchtip.themultiverse.school/PROJECT_ID';

export function initErrorTracking() {
  if (typeof Sentry === 'undefined') return;

  Sentry.init({
    dsn: GLITCHTIP_DSN,
    environment: location.hostname === 'localhost' ? 'development' : 'production',
    // Do not capture PII — this is a privacy game
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip any localStorage data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(
          (b) => b.category !== 'console' || !b.message?.includes('localStorage')
        );
      }
      return event;
    },
  });
}

export function captureError(error, context) {
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(error, { extra: context });
  }
  console.error(error);
}
```

Note: Replace DSN with the actual GlitchTip DSN after creating the project. `sendDefaultPii: false` is critical — this is a privacy game, we do not send user data to error trackers.

- [x] **Step 3: Initialize in app.js and wrap screen rendering**

```js
import { initErrorTracking, captureError } from './utils/errors.js';
initErrorTracking();

function render(route) {
  try {
    const renderFn = screens[route.screen] || screens.city;
    app.innerHTML = renderFn(route.params);
  } catch (error) {
    captureError(error, { screen: route.screen, params: route.params });
    app.innerHTML = `<div style="padding: 40px; text-align: center;">
      <h2 style="color: var(--magenta);">Something broke</h2>
      <p>The error has been reported. <a href="#/city">Return to city</a></p>
    </div>`;
  }
}
```

- [x] **Step 4: Wrap localStorage operations in state.js with error capture**

Add try/catch around `loadState` and `saveState` with `captureError` calls — localStorage can throw (quota exceeded, private browsing, disabled). These are the most likely runtime errors in a browser-local game.

- [x] **Step 5: Manual test — throw a deliberate error, verify it appears in GlitchTip dashboard**

- [x] **Step 6: Commit**

```bash
git add src/index.html src/utils/errors.js src/app.js src/state.js
git commit -m "feat: GlitchTip error tracking with PII scrubbing"
```

---

### v2 Backlog (not in this plan)

- Chapters 2-8: full mission content (requires reading remaining bench stations)
- Drip mode: opt-in, daily mission selection, browser push notifications, streak tracking with notifications
- Custom accounts: add/name custom accounts during survey, auto-generate mission sequences
- Transition animations: building state transitions, screen transitions
- Sound effects: mission complete chimes, building liberation sounds
- Additional pixel art: per-account buildings for Chapters 2-8 via PixelLab
