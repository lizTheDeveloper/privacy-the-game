# Contributing

Thanks for helping. Reclaim City sends real people to real opt-out pages, and its data-broker dataset is cited by journalists. Everything we publish has to be true and checkable.

## Bounty issues (`bounty` label)

Bounties are paid in karma points. Before you start one:

1. **Claim it** by commenting on the issue, so two people don't do the same one.
2. **Do the check yourself, by hand, in a normal browser.** Automated or AI-generated answers aren't accepted, because the point is a person confirming what a real page does today.
3. **Submit your evidence as a comment on the issue.** That means the final URL, a one-line verdict, what the form asks for, and a Wayback capture of every page you used. Save each page at `https://web.archive.org/save/` and paste the capture link it gives you, which looks like `https://web.archive.org/web/20261022153000/https://example.com/opt-out` (a 14-digit timestamp, then the page). A `/save/` link is not a capture. Evidence without captures can't be accepted.

A maintainer turns your evidence into a dataset change. You don't need to open a pull request.

Karma is paid only after a maintainer verifies the evidence and applies `karma-approved`. Submissions with fabricated or AI-generated evidence are labelled `karma-farming`, earn nothing, and the account's later claims are closed automatically.

## Pull requests

If you do open one for a bounty (it says `Refs #N`, `Fixes #N` or similar, or links the issue):

- **Edit only the real dataset config:** `research/data-brokers/build/id-map.json`, `alias-blocklist.json`, `link-overrides.json` and `record-overrides.json`. (`build/sweeps.json` is generated too.) Generated files (`research/data-brokers/brokers/`, `links.json`, `sources.json`, `src/data/broker-map.json`) are never edited by hand; see "How to rebuild" in `research/data-brokers/README.md`.
- **Don't add new data files.** Paths like `data/brokers.json`, `research/data-brokers/build/brokers_update.json`, `collective/data/…` or `docs_update.md` aren't read by anything, and those PRs will be closed.
- **Don't delete or gut tests.** A bounty PR that deletes a test file, renames one away, or removes more than 20 net lines from existing test files is closed.
- Put the Wayback captures in the PR description or in your evidence comment on the issue. A bounty PR without them is labelled `needs-evidence` and closed 72 hours after we ask.
- Link the issue with `Refs #N`, not `Fixes #N`. A maintainer closes the issue once the evidence is checked; an issue closed any other way is reopened.
- Run `npm run brokers:validate` and `npx vitest run` before opening the PR.

## Any pull request from outside the team

- **Don't touch `collective/`.** It runs the nightly job that deletes opted-out players' data. A PR from anyone who isn't a collaborator that changes anything under `collective/` is closed and labelled `karma-farming`; changes there need a maintainer and their own issue.
- Hand-edited generated files (listed above) are closed.
- A PR that deletes tests, removes more than 20 net lines from existing test files, or rewrites more than 20 lines of one is held for a maintainer (`needs-maintainer`).
- So is a PR that changes `vitest.config.js`, anything under `tests/fixtures/`, `package.json` or `package-lock.json`, or the bounty guard (`scripts/bounty-guard/`), or that adds a data file under `research/data-brokers/build/`.

These rules are applied automatically every hour by `scripts/bounty-guard/guard.mjs`. A maintainer exempts a PR by adding `guard-skip` or `karma-approved`, and a PR a maintainer reopens is not closed again.
