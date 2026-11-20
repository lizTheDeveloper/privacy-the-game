# Bounty Fix

**Reward:** —
**Issue:** https://github.com/lizTheDeveloper/privacy-the-game/issues/50
**Repo:** https://github.com/lizTheDeveloper/privacy-the-game

---

## Issue

[opt-out check] Blis Global Ltd: confirm the opt-out route works

**What**: Check whether the opt-out route we list for Blis Global Ltd is a real, working one.

**Why it matters**: Players of Reclaim City use these links to opt out of data brokers, and the dataset is cited by journalists, so a wrong or dead link costs real people real time.

- Broker: Blis Global Ltd (`blis-global`)
- Method: web-form
- Current route: [https://www.blis.com](https://www.blis.com)
- Status: `blocked` (last checked 2026-10-18). Our robot was refused (a 401/403/429/5xx response, a timeout or another network error). This is often bot protection and is not evidence the page is gone.

**What to do**
1. Open the URL above in a normal browser (not a script).
2. Report whether it is a real opt-out or removal form, and where it actually ends up (the final URL after any redirects).
3. Look on the broker's own site for a newer opt-out URL, and report it if you find one.
4. Report what the form requires (email, phone, ID upload, account, payment). Do not submit it.
5. Capture whatever page you land on.

**What counts as done**
Comment on this issue with: the final URL, a one-line verdict (real opt-out form / not an opt-out / moved / gone), any newer URL, what it requires, and a Wayback capture (https://web.archive.org/save/<url>) of every page you used. Paste the capture links.

Code-literate volunteers may open a PR instead. Opt-out URLs come from the state registries and our research pass, not from a hand-edited file, and generated files (`brokers/`, `links.json`, `sources.json`, `src/data/broker-map.json`) must never be edited by hand; see "How to rebuild" in the [README](https://github.com/lizTheDeveloper/privacy-the-game/blob/main/research/data-brokers/README.md). If no file under `research/data-brokers/build/` fits your fix, a comment is the right route.

**Ground rules**
- No fake accounts.
- Never submit someone else's personal information.
- Don't share your own personal data in the issue. Redact it from screenshots and captures.
- If a form demands an ID upload or payment, stop and report that here instead.

---
Bounty: paid in karma points. Comment to claim it before you start, so two people don't do the same one.

---

## Process

### 1. Orient yourself first
Before touching any code:
- Read the README and any relevant docs
- Run: find . -type f | grep -v node_modules | grep -v .git | grep -v dist | head -60
- Grep for the key terms from the issue title to find the relevant files
- Read the files around the bug — understand what's currently happening

### 2. Find and read the tests
- Look for test files near the relevant code (*.test.ts, *.spec.js, __tests__, etc.)
- Read them — they tell you what behavior is expected
- Understand what a passing fix looks like before writing a line

### 3. Implement the fix
- Make the MINIMAL change that fixes the issue — nothing more
- Do not refactor, rename, reorganize, or clean up unrelated code
- Do not add dependencies unless the issue explicitly requires it
- Do not modify config files (package.json, tsconfig.json, etc.) unless that IS the fix
- One logical change, one commit

### 4. Verify
- Run the test suite: check package.json scripts for "test", "lint", "typecheck"
  Common commands: npm test, yarn test, pnpm test, pytest, go test ./..., cargo test
- If TypeScript is present: npx tsc --noEmit
- Fix any test failures your change caused — if a test was wrong before, update it

### 5. Commit and document
- git add -A
- git commit -m "fix: [opt-out check] Blis Global Ltd: confirm the opt-out route works"
- Write AGENT_SUMMARY.md with:
  - Root cause: what was wrong and why
  - Fix: what you changed and the reasoning
  - Verification: how to confirm it works
  - Concerns: anything a reviewer should know

---

## Stop conditions

If ANY of these are true, write "UNCERTAIN: [reason]" at the top of AGENT_SUMMARY.md, make NO code changes, and stop:
- The fix requires changing more than ~5 files
- You cannot determine what the correct behavior should be
- The issue requires a database migration, API key, or external service
- You find 3+ open PRs already attempting this fix (high competition)
- The repo is not in a language/framework you can reason about confidently

A clean UNCERTAIN is better than a bad PR.
