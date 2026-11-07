import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, existsSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assessPr,
  assessIssueClose,
  assessIssueComments,
  claimedIssues,
  closingKeywordRefs,
  refsKeywordRefs,
  qualifiedRefs,
  hasWaybackLink,
  isTestPath,
  isAllowedBountyPath,
  BOUNTY_CONFIG_FILES,
  sanitizePath,
  guardComments,
  closeComment,
  plan,
  writeCount,
  selectWithinCap,
  commentsSince,
  nextLastRunAt,
  FILES_UNREADABLE,
  PER_AUTHOR_CAP,
  loadState,
  saveState,
  recordMarker,
  rotateLog,
  MARKER,
  EVIDENCE_GRACE_MS,
  WRITE_CAP,
} from '../scripts/bounty-guard/guard.mjs';

// Fixtures are the real karma-farming PRs (#435, #427, #254, #421) as
// `gh pr view --json` returned them, plus the REST author_association.
const fixture = (n) =>
  JSON.parse(readFileSync(new URL(`./fixtures/bounty-guard/pr-${n}.json`, import.meta.url), 'utf8'));

const NOW = new Date('2026-10-23T12:00:00Z');
const bountyIssues = new Set([42, 61, 131, 150, 200]);
const ctx = (over = {}) => ({ bountyIssues, flaggedAuthors: new Set(), now: NOW, ...over });

const WAYBACK = 'https://web.archive.org/web/20261022000000/https://example-broker.com/opt-out';
const file = (path, additions, deletions, changeType = 'MODIFIED', previousPath = null) => ({ path, previousPath, additions, deletions, changeType });

const legitBountyPr = (over = {}) => ({
  number: 900,
  title: 'data: Example Broker opt-out route',
  author: 'careful-human',
  authorAssociation: 'NONE',
  createdAt: '2026-10-22T12:00:00Z',
  labels: [],
  body: `Refs #200\n\n## Evidence\nFinal URL: https://example-broker.com/opt-out\nVerdict: works, asks for name + email.\nCaptures: ${WAYBACK}`,
  files: [file('research/data-brokers/build/link-overrides.json', 3, 1)],
  closingIssues: [],
  ...over,
});
const codePr = (files, over = {}) => legitBountyPr({ title: 'fix: tidy', body: 'small tidy', files, ...over });

describe('assessPr: the real karma-farming PRs', () => {
  it('#435 (rewrote the nightly purge job and gutted its tests) is closed as karma-farming', () => {
    const d = assessPr(fixture(435), ctx());
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
    expect(d.paths).toContain('collective/job/run.py');
    expect(d.reasons.join('\n')).toMatch(/net lines from existing tests/);
  });

  it('#427 (invented collective/data/brokers.tsv, "Fixes #42") is closed as karma-farming', () => {
    const d = assessPr(fixture(427), ctx());
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
    expect(d.paths).toEqual(['collective/data/brokers.tsv']);
  });

  it('#254 (docs_update.md for a bounty, author association NONE) is closed as karma-farming', () => {
    const d = assessPr(fixture(254), ctx());
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
    expect(d.paths).toEqual(['docs_update.md']);
  });

  it('#421 (CONTRIBUTOR association does not count as a maintainer) is closed', () => {
    const pr = fixture(421);
    expect(pr.authorAssociation).toBe('CONTRIBUTOR');
    const d = assessPr(pr, ctx());
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
  });

  it('an author already labelled karma-farming is closed even on an otherwise clean PR', () => {
    const d = assessPr(legitBountyPr({ author: 'TaherEzzi' }), ctx({ flaggedAuthors: new Set(['taherezzi']) }));
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
    expect(d.reasons.join('\n')).toMatch(/karma-farming/);
  });
});

describe('assessPr: collective/ and generated files', () => {
  it('touching collective/ closes even when the PR is not about a bounty', () => {
    const d = assessPr(codePr([file('collective/service/server.js', 1, 1)]), ctx());
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
  });

  it('a rename out of collective/ is caught by its old path', () => {
    const d = assessPr(codePr([file('src/run.py', 0, 0, 'RENAMED', 'collective/job/run.py')]), ctx());
    expect(d.action).toBe('close');
    expect(d.paths).toContain('collective/job/run.py');
  });

  it('hand-editing generated files closes (without the karma-farming label on its own)', () => {
    for (const path of ['research/data-brokers/brokers/acme.json', 'research/data-brokers/links.json', 'research/data-brokers/sources.json', 'src/data/broker-map.json']) {
      const d = assessPr(codePr([file(path, 1, 1)]), ctx());
      expect(d.action, path).toBe('close');
      expect(d.karmaFarming, path).toBe(false);
    }
  });
});

describe('assessPr: tests rule', () => {
  it('fixtures under tests/fixtures are data, not tests', () => {
    expect(isTestPath('tests/fixtures/verified-urls.json')).toBe(false);
    expect(isTestPath('tests/router.test.js')).toBe(true);
    expect(isTestPath('collective/job/tests/test_purge.py')).toBe(true);
    expect(isTestPath('collective/service/test/client-info.test.js')).toBe(true);
  });

  it('small edits to tests are fine; appending cases is fine (merged PR #2 did this)', () => {
    expect(assessPr(codePr([file('src/router.js', 1, 1), file('tests/router.test.js', 3, 10)]), ctx()).action).toBe('ok');
    expect(assessPr(codePr([file('src/router.js', 1, 1), file('tests/router.test.js', 15, 0)], { authorAssociation: 'CONTRIBUTOR' }), ctx()).action).toBe('ok');
  });

  it('on a non-bounty PR, deleting a test or removing >20 net lines flags for a maintainer, never karma-farming', () => {
    for (const files of [
      [file('tests/state.test.js', 0, 40, 'DELETED')],
      [file('tests/state.test.js', 2, 30)],
      [file('src/state-old.js', 0, 0, 'RENAMED', 'tests/state.test.js')],
    ]) {
      const d = assessPr(codePr(files), ctx());
      expect(d.action).toBe('flag');
      expect(d.karmaFarming).toBe(false);
      expect(d.needsMaintainer).toBe(true);
      expect(d.labels).toContain('needs-maintainer');
    }
  });

  it('lines added elsewhere, or a new test file, cannot offset lines cut from an existing test', () => {
    const d = assessPr(legitBountyPr({ files: [file('tests/a.test.js', 0, 30), file('tests/new.test.js', 100, 0, 'ADDED')] }), ctx());
    expect(d.reasons.join('\n')).toMatch(/30 net lines/);
    const d2 = assessPr(codePr([file('tests/a.test.js', 0, 25), file('tests/b.test.js', 30, 0)]), ctx());
    expect(d2.action).toBe('flag');
    expect(d2.needsMaintainer).toBe(true);
  });

  it('a rename within tests/ is not a deletion', () => {
    expect(assessPr(codePr([file('tests/b.test.js', 0, 0, 'RENAMED', 'tests/a.test.js')]), ctx()).action).toBe('ok');
  });

  it('outside PRs touching test config, fixtures, package.json or the guard are held for a maintainer (B3, probes C, E, F)', () => {
    for (const path of [
      'vitest.config.js',
      'tests/fixtures/verified-urls.json',
      'tests/fixtures/bounty-guard/pr-435.json',
      'scripts/bounty-guard/guard.mjs',
      'scripts/bounty-guard/install.sh',
      'package.json',
      'package-lock.json',
    ]) {
      for (const f of [file(path, 1, 1), file(path, 0, 400)]) {
        const d = assessPr(codePr([f]), ctx());
        expect(d.action, path).toBe('flag');
        expect(d.needsMaintainer, path).toBe(true);
        expect(d.karmaFarming, path).toBe(false);
        expect(d.paths, path).toContain(path);
      }
    }
    // Collaborators are trusted as before.
    expect(assessPr(codePr([file('vitest.config.js', 1, 1)], { authorAssociation: 'COLLABORATOR' }), ctx()).action).toBe('ok');
  });

  it('an outside PR rewriting more than 20 lines of one test in place (net 0) is held for a maintainer (probe D)', () => {
    const d = assessPr(codePr([file('tests/collective.test.js', 30, 30)]), ctx());
    expect(d).toMatchObject({ action: 'flag', needsMaintainer: true, karmaFarming: false });
    expect(d.reasons.join('\n')).toMatch(/Rewrites more than 20 lines of existing tests/);
    // Up to 20 lines rewritten, or a new test file, is still fine.
    expect(assessPr(codePr([file('tests/collective.test.js', 20, 20)]), ctx()).action).toBe('ok');
    expect(assessPr(codePr([file('tests/new.test.js', 300, 0, 'ADDED')]), ctx()).action).toBe('ok');
  });

  it('on a bounty PR, gutting tests is karma-farming', () => {
    const d = assessPr(legitBountyPr({ files: [file('tests/data.test.js', 0, 50)] }), ctx());
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
  });
});

describe('assessPr: bounty PRs', () => {
  it('a bounty PR that adds a file outside research/data-brokers/build/*.json is closed as karma-farming', () => {
    const d = assessPr(legitBountyPr({ files: [file('data/brokers.json', 12, 0, 'ADDED')] }), ctx());
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
    expect(d.paths).toEqual(['data/brokers.json']);
  });

  it('only the four dataset config files are allowed bounty paths; sweeps.json is generated (B1)', () => {
    expect(BOUNTY_CONFIG_FILES.map((p) => p.split('/').pop()).sort()).toEqual(['alias-blocklist.json', 'id-map.json', 'link-overrides.json', 'record-overrides.json']);
    for (const p of BOUNTY_CONFIG_FILES) expect(existsSync(p), p).toBe(true);
    expect(isAllowedBountyPath('research/data-brokers/build/brokers_update.json')).toBe(false);
    expect(isAllowedBountyPath('research/data-brokers/build/sweeps.json')).toBe(false);
    const sweeps = assessPr(legitBountyPr({ files: [file('research/data-brokers/build/sweeps.json', 3, 1)] }), ctx());
    expect(sweeps.action).toBe('close');
    const sweepsOutside = assessPr(codePr([file('research/data-brokers/build/sweeps.json', 3, 1)]), ctx());
    expect(sweepsOutside.action).toBe('close'); // a hand-edited generated file
  });

  it('a bounty PR adding a new data file under build/ is closed as karma-farming (audit probe A)', () => {
    const d = assessPr(legitBountyPr({
      body: `Refs #7 ${WAYBACK}`,
      files: [file('research/data-brokers/build/brokers_update.json', 500, 0, 'ADDED')],
    }), ctx({ bountyIssues: new Set([7]) }));
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(true);
    expect(d.reasons.join('\n')).toMatch(/new data file/);
    expect(d.paths).toEqual(['research/data-brokers/build/brokers_update.json']);
    // Renamed or copied into build/ is new too.
    const renamed = assessPr(legitBountyPr({ files: [file('research/data-brokers/build/x.json', 0, 0, 'RENAMED', 'research/data-brokers/build/id-map.json')] }), ctx());
    expect(renamed.action).toBe('close');
  });

  it('an outside non-bounty PR adding a data file under build/ is held for a maintainer', () => {
    const d = assessPr(codePr([file('research/data-brokers/build/extra.json', 40, 0, 'ADDED')]), ctx());
    expect(d).toMatchObject({ action: 'flag', needsMaintainer: true, karmaFarming: false });
    expect(d.labels).toContain('needs-maintainer');
    // A new build script is code, not a data file: fine.
    expect(assessPr(codePr([file('research/data-brokers/build/new-step.js', 40, 0, 'ADDED')]), ctx()).action).toBe('ok');
  });

  it('a nested file under build/ is not an allowed bounty path', () => {
    expect(assessPr(legitBountyPr({ files: [file('research/data-brokers/build/new/x.json', 1, 0, 'ADDED')] }), ctx()).action).toBe('close');
  });

  it('a bare "#N" mention in the body does not make a PR a bounty PR', () => {
    const d = assessPr(codePr([file('src/city-map.js', 2, 1)], { body: 'Same root cause as #200, but this is a map fix.' }), ctx());
    expect(d.action).toBe('ok');
    expect(d.bountyRefs).toEqual([]);
  });

  it('Refs, closing keywords, title refs, full URLs and owner/repo#N all count', () => {
    const repo = 'lizTheDeveloper/privacy-the-game';
    expect(claimedIssues({ title: 'x', body: 'Refs #200' })).toEqual([200]);
    expect(claimedIssues({ title: 'x', body: 'resolves #200' })).toEqual([200]);
    expect(claimedIssues({ title: 'opt-out check (#200)', body: '' })).toEqual([200]);
    expect(claimedIssues({ title: 'x', body: `see https://github.com/${repo}/issues/200 for context` })).toEqual([200]);
    expect(claimedIssues({ title: 'x', body: `as in ${repo}#200` })).toEqual([200]);
    expect(claimedIssues({ title: 'x', body: '', closingIssues: [200] })).toEqual([200]);
    expect(refsKeywordRefs('Refs #1, #2 and #3')).toEqual([1, 2, 3]);
    expect(qualifiedRefs('other/repo#5 and https://github.com/other/repo/issues/6')).toEqual([]);
  });

  it('a bounty PR with no Wayback link is flagged needs-evidence, not closed, inside 72h', () => {
    const d = assessPr(legitBountyPr({ body: 'Refs #200\nI checked it, it works.' }), ctx());
    expect(d.action).toBe('flag');
    expect(d.needsEvidence).toBe(true);
    expect(d.labels).toContain('needs-evidence');
  });

  it('evidence posted by the PR author as a comment on the bounty issue counts', () => {
    const issues = new Map([[200, { labels: ['bounty'], comments: [{ author: 'careful-human', body: `Done by hand: ${WAYBACK}` }] }]]);
    expect(assessPr(legitBountyPr({ body: 'Refs #200' }), ctx({ bountyIssues: issues })).action).toBe('ok');
    const othersEvidence = new Map([[200, { labels: [], comments: [{ author: 'someone-else', body: WAYBACK }] }]]);
    expect(assessPr(legitBountyPr({ body: 'Refs #200' }), ctx({ bountyIssues: othersEvidence })).action).toBe('flag');
  });

  it('closes a needs-evidence PR 72h after the guard asked for evidence', () => {
    const asked = new Date(NOW.getTime() - EVIDENCE_GRACE_MS - 1000).toISOString();
    const d = assessPr(legitBountyPr({ body: 'Refs #200\nI checked it.' }), ctx({ evidenceRequestedAt: asked }));
    expect(d.action).toBe('close');
    expect(d.karmaFarming).toBe(false);
    expect(d.reasons.join('\n')).toMatch(/72/);
    const recent = new Date(NOW.getTime() - 3600 * 1000).toISOString();
    expect(assessPr(legitBountyPr({ body: 'Refs #200' }), ctx({ evidenceRequestedAt: recent })).action).toBe('flag');
  });

  it('"Fixes #N" on a bounty issue is flagged and asks for Refs #N', () => {
    const d = assessPr(legitBountyPr({ body: `Fixes #200\n\nEvidence: ${WAYBACK}` }), ctx());
    expect(d.action).toBe('flag');
    expect(d.closingKeyword).toEqual([200]);
    expect(d.labels).toContain('refs-not-fixes');
  });

  it('closingIssuesReferences from GitHub count even if the body is clean', () => {
    const d = assessPr(legitBountyPr({ closingIssues: [200] }), ctx());
    expect(d.action).toBe('flag');
    expect(d.closingKeyword).toEqual([200]);
  });
});

describe('assessPr: file list problems', () => {
  it('a clean partial list flags for a maintainer with a fixed public message, never ok', () => {
    const d = assessPr(codePr([file('src/a.js', 1, 1)], { filesError: 'fetch failed: HTTP 502 secret-ish stderr' }), ctx());
    expect(d.action).toBe('flag');
    expect(d.labels).toEqual(['needs-maintainer']);
    expect(d.reasons).toEqual([FILES_UNREADABLE]);
    expect(d.cleanupOk).toBe(false);
    expect(JSON.stringify(d.reasons)).not.toMatch(/502|stderr/);
  });

  it('a partial list is still enforced: protected paths on it close, and author/evidence checks run', () => {
    expect(assessPr({ ...fixture(435), filesError: 'got 3 of 9 files' }, ctx()).action).toBe('close');
    const flagged = assessPr(codePr([], { author: 'TaherEzzi', filesError: 'fetch failed' }), ctx({ flaggedAuthors: new Set(['taherezzi']) }));
    expect(flagged.action).toBe('close');
    const asked = new Date(NOW.getTime() - EVIDENCE_GRACE_MS - 1000).toISOString();
    const noEvidence = assessPr(legitBountyPr({ body: 'Refs #200', files: [], filesError: 'fetch failed' }), ctx({ evidenceRequestedAt: asked }));
    expect(noEvidence.action).toBe('close');
  });

  it('more files than the API can list closes', () => {
    const d = assessPr(codePr([file('src/a.js', 1, 1)], { changedFiles: 3500, filesError: 'got 3000 of 3500 files' }), ctx());
    expect(d.action).toBe('close');
    expect(d.reasons.join('\n')).toMatch(/3500 files/);
  });

  it('repro from review: a 502 never makes the guard remove needs-evidence (so the 72h close still happens)', () => {
    const base = { flaggedAuthors: new Set(), maintainers: new Set(['lizthedeveloper']), viewer: 'lizTheDeveloper', now: NOW };
    const pr = { ...legitBountyPr({ body: 'Refs #200', labels: ['needs-evidence'], files: [], filesError: 'fetch failed' }), comments: [] };
    const { actions } = plan({ ...base, prs: [pr], issues: [{ number: 200, state: 'OPEN', labels: [], comments: [] }] });
    expect(actions.some((a) => a.kind === 'unlabel')).toBe(false);
    const skipped = { ...legitBountyPr({ body: `Refs #200 ${WAYBACK}`, labels: ['needs-evidence', 'guard-skip'] }), comments: [] };
    expect(plan({ ...base, prs: [skipped], issues: [] }).actions).toEqual([]);
  });
});

describe('assessPr: maintainer overrides', () => {
  it('collaborators and bots are never touched', () => {
    for (const authorAssociation of ['OWNER', 'MEMBER', 'COLLABORATOR']) {
      expect(assessPr({ ...fixture(435), authorAssociation }, ctx()).action, authorAssociation).toBe('ok');
    }
    const bot = codePr([file('collective/service/package.json', 1, 1)], { author: 'dependabot', isBot: true });
    expect(assessPr(bot, ctx()).action).toBe('ok');
  });

  it('karma-approved or guard-skip on the PR skips it', () => {
    for (const label of ['karma-approved', 'guard-skip']) {
      expect(assessPr({ ...fixture(435), labels: [label] }, ctx()).action, label).toBe('ok');
    }
  });

  it('a PR a maintainer reopened is not re-closed (the guard never reopens PRs itself)', () => {
    expect(assessPr({ ...fixture(427), maintainerReopened: true }, ctx()).action).toBe('ok');
  });

  it('label removals are never read as overrides, since the guard removes labels as the same account', () => {
    const d = assessPr(legitBountyPr({ body: 'Fixes #200', maintainerUnlabeled: ['needs-evidence', 'refs-not-fixes', 'karma-farming'] }), ctx());
    expect(d.needsEvidence).toBe(true);
    expect(d.labels).toEqual(['needs-evidence', 'refs-not-fixes']);
    expect(assessPr({ ...fixture(427), maintainerUnlabeled: ['karma-farming'] }, ctx()).action).toBe('close');
  });
});

describe('assessPr: legitimate shapes', () => {
  it('evidence + allowed path + Refs #N is ok', () => {
    expect(assessPr(legitBountyPr(), ctx())).toMatchObject({ action: 'ok', reasons: [] });
  });

  it('a non-bounty code PR from a stranger is ok', () => {
    expect(assessPr(codePr([file('src/city-map.js', 2, 1)], { body: 'Fixes #5' }), ctx()).action).toBe('ok');
  });
});

describe('text helpers', () => {
  it('finds closing keywords in all GitHub spellings', () => {
    expect(closingKeywordRefs('Closes #131\nFixes #131\nresolved: #9 and fix #3. Refs #4')).toEqual([131, 9, 3]);
    expect(closingKeywordRefs('Refs #4, see #5')).toEqual([]);
    expect(closingKeywordRefs('Fixes https://github.com/lizTheDeveloper/privacy-the-game/issues/77')).toEqual([77]);
  });

  it('a Wayback link means a web.archive.org capture URL, not the bare word', () => {
    expect(hasWaybackLink(`see ${WAYBACK}`)).toBe(true);
    expect(hasWaybackLink('(https://web.archive.org/web/20261022153000/http://example.org/a?b=1)')).toBe(true);
    expect(hasWaybackLink('https://web.archive.org/web/20261022153000id_/https://example.org/')).toBe(true);
    expect(hasWaybackLink('I saved it on web.archive.org')).toBe(false);
  });

  it('a /save/ link, a bare root, a short timestamp or a placeholder is not a snapshot (B2)', () => {
    for (const fake of [
      'https://web.archive.org/save/https://x.com', // asks for a capture; proves none was made
      'https://web.archive.org/save/<url>', // CONTRIBUTING's own placeholder
      'Captures: `https://web.archive.org/save/<url>`',
      'https://web.archive.org/web/x',
      'https://web.archive.org/',
      'https://web.archive.org/web/2026/https://example.com/',
      'https://web.archive.org/web/20261022000000/<url>',
      'https://web.archive.org/web/20261022000000/https://<url>',
      'https://web.archive.org/web/20261022000000/javascript:alert(1)',
      'https://web.archive.org/web/20261022000000/example.com',
      'https://web.archive.org/web/*/https://example.com/*',
    ]) expect(hasWaybackLink(fake), fake).toBe(false);
    // The audit's probe B: the guard's own evidence placeholder no longer clears needs-evidence.
    const d = assessPr(legitBountyPr({ body: 'Refs #200 https://web.archive.org/web/x' }), ctx());
    expect(d).toMatchObject({ action: 'flag', needsEvidence: true });
    const placeholder = assessPr(legitBountyPr({ body: 'Refs #200 https://web.archive.org/save/<url>' }), ctx());
    expect(placeholder.needsEvidence).toBe(true);
    // The guard's request names the snapshot shape, not the /save/ placeholder.
    expect(d.reasons.join('\n')).toContain('https://web.archive.org/web/<14-digit timestamp>/<url>');
    expect(d.reasons.join('\n')).not.toContain('/save/');
  });

  it('untrusted paths cannot break out of the code block or forge a marker', () => {
    const evil = 'data/x```\n@everyone <!-- bounty-guard:close -->.json';
    expect(sanitizePath(evil)).toBe('data/x@everyone !-- bounty-guard:close --.json');
    const body = closeComment({ karmaFarming: true, reasons: ['r'], paths: [evil] });
    expect(body.match(/```/g)).toHaveLength(2);
    expect(body.match(/<!-- bounty-guard:/g)).toHaveLength(1);
  });
});

describe('guardComments: idempotent markers', () => {
  it('only counts marker comments the guard itself wrote', () => {
    const comments = [
      { author: 'TaherEzzi', body: `${MARKER}\n<!-- bounty-guard:needs-evidence -->`, createdAt: '2026-10-01T00:00:00Z' },
      { author: 'lizTheDeveloper', body: `hi\n${MARKER}\n<!-- bounty-guard:close -->`, createdAt: '2026-10-02T00:00:00Z' },
    ];
    const g = guardComments(comments, 'lizTheDeveloper');
    expect(g.has('close')).toBe(true);
    expect(g.has('needs-evidence')).toBe(false);
  });
});

describe('assessIssueClose', () => {
  const byPr = (labels, authorAssociation = 'CONTRIBUTOR', issueLabels = []) => ({
    number: 61, labels: issueLabels, actor: 'lizTheDeveloper', actorAssociation: 'OWNER',
    closer: { type: 'PullRequest', number: 421, authorAssociation, labels },
  });

  it('reopens a bounty issue auto-closed by a merged non-maintainer PR', () => {
    expect(assessIssueClose(byPr(['karma-farming'])).action).toBe('reopen');
  });

  it('leaves it closed when the closing PR or the issue itself has karma-approved', () => {
    expect(assessIssueClose(byPr(['karma-approved'])).action).toBe('ok');
    expect(assessIssueClose(byPr([], 'CONTRIBUTOR', ['bounty', 'karma-approved'])).action).toBe('ok');
  });

  it('leaves it closed when a maintainer authored the closing PR', () => {
    expect(assessIssueClose(byPr([], 'OWNER')).action).toBe('ok');
  });

  it('reopens an issue a non-maintainer closed by hand; a maintainer close stands', () => {
    expect(assessIssueClose({ number: 7, actor: 'stranger', actorAssociation: 'NONE', closer: null }).action).toBe('reopen');
    expect(assessIssueClose({ number: 41, actor: 'lizTheDeveloper', actorAssociation: 'OWNER', closer: null }).action).toBe('ok');
  });
});

describe('assessIssueComments', () => {
  it('replies once per flagged author per issue', () => {
    const comments = [
      { author: 'TaherEzzi', body: '/claim', createdAt: '2026-10-20T00:00:00Z' },
      { author: 'TaherEzzi', body: 'done, see PR', createdAt: '2026-10-20T01:00:00Z' },
      { author: 'careful-human', body: 'claiming', createdAt: '2026-10-20T02:00:00Z' },
    ];
    const flagged = new Set(['taherezzi']);
    expect(assessIssueComments({ number: 131, comments }, flagged, 'lizTheDeveloper')).toEqual(['TaherEzzi']);
    const replied = [...comments, { author: 'lizTheDeveloper', body: `${MARKER}\n<!-- bounty-guard:ineligible:taherezzi -->`, createdAt: '2026-10-21T00:00:00Z' }];
    expect(assessIssueComments({ number: 131, comments: replied }, flagged, 'lizTheDeveloper')).toEqual([]);
    expect(assessIssueComments({ number: 131, comments }, flagged, 'lizTheDeveloper', ['ineligible:taherezzi'])).toEqual([]);
  });
});

describe('plan', () => {
  const base = { flaggedAuthors: new Set(), maintainers: new Set(['lizthedeveloper']), viewer: 'lizTheDeveloper', now: NOW };
  const issues = [{ number: 200, state: 'OPEN', labels: ['bounty'], comments: [] }];

  it('one malformed PR becomes an error; the rest of the run continues', () => {
    const bad = Object.defineProperty({ number: 1, author: 'x', authorAssociation: 'NONE', title: 't', body: '', comments: [], labels: [] }, 'files', { get() { throw new Error('boom'); } });
    const { actions, errors } = plan({ ...base, prs: [bad, { comments: [], labels: [], ...fixture(427) }], issues: [{ number: 42, state: 'OPEN', labels: [], comments: [] }] });
    expect(errors).toHaveLength(1);
    expect(actions.map((a) => a.number)).toEqual([427]);
  });

  it('the 72h clock starts at the earliest request, from state or a guard comment, so flooding cannot reset it', () => {
    const pr = { ...legitBountyPr({ body: 'Refs #200' }), comments: [] };
    const old = new Date(NOW.getTime() - EVIDENCE_GRACE_MS - 1000).toISOString();
    const state = { prs: { 900: { markers: ['needs-evidence'], evidenceRequestedAt: old } }, issues: {} };
    const { actions } = plan({ ...base, prs: [pr], issues, state });
    expect(actions[0].kind).toBe('close-pr');
  });

  it('a marker recorded in state suppresses the comment even if GitHub paging missed it', () => {
    const pr = { ...legitBountyPr({ body: 'Refs #200' }), comments: [] };
    const state = { prs: { 900: { markers: ['needs-evidence'], evidenceRequestedAt: NOW.toISOString() } }, issues: {} };
    const { actions } = plan({ ...base, prs: [pr], issues, state });
    expect(actions[0].comments).toEqual([]);
    expect(actions[0].labels).toEqual(['needs-evidence']);
  });

  it('reopen comments carry the close time, so a reopen whose comment already posted only retries the reopen', () => {
    const closed = { number: 61, state: 'CLOSED', labels: ['bounty'], comments: [], closedEvent: { createdAt: '2026-10-20T00:00:00Z', actor: 'lizTheDeveloper', closer: { type: 'PullRequest', number: 421, authorAssociation: 'CONTRIBUTOR', labels: [] } } };
    const first = plan({ ...base, prs: [], issues: [closed] }).actions[0];
    expect(first.kind).toBe('reopen-issue');
    expect(first.comments[0].marker).toBe('reopen:2026-10-20T00:00:00Z');
    const state = { prs: {}, issues: { 61: { markers: ['reopen:2026-10-20T00:00:00Z'] } } };
    expect(plan({ ...base, prs: [], issues: [closed], state }).actions[0].comments).toEqual([]);
  });
});

describe('write cap: priority order, deferral, per-author cap', () => {
  const act = (kind, author, priority, comments = 1) => ({ kind, author, priority, comments: Array(comments).fill({}) });

  it('a flood of low-priority work cannot block reopens or high-severity closes', () => {
    const flood = Array.from({ length: 40 }, (_, i) => act('ineligible-reply', `spam${i}`, 4));
    const urgent = [act('reopen-issue', 'x', 0), act('close-pr', 'y', 1)];
    const { run, deferred } = selectWithinCap([...flood, ...urgent]);
    expect(run.slice(0, 2).map((a) => a.kind)).toEqual(['reopen-issue', 'close-pr']);
    expect(writeCount(run).exceeded).toBe(false);
    expect(run.reduce((n, a) => n + a.comments.length, 0)).toBe(WRITE_CAP.comments);
    expect(deferred.length).toBe(42 - run.length);
  });

  it(`one author gets at most ${PER_AUTHOR_CAP} actions per run`, () => {
    const { run, deferred } = selectWithinCap([...Array.from({ length: 8 }, () => act('close-pr', 'farmer', 1)), act('close-pr', 'other', 2)]);
    expect(run.filter((a) => a.author === 'farmer')).toHaveLength(PER_AUTHOR_CAP);
    expect(run.some((a) => a.author === 'other')).toBe(true);
    expect(deferred).toHaveLength(8 - PER_AUTHOR_CAP);
  });

  it('never more than the close cap', () => {
    const { run } = selectWithinCap(Array.from({ length: 30 }, (_, i) => act('close-pr', `a${i}`, 1, 0)));
    expect(run).toHaveLength(WRITE_CAP.closes);
  });
});

describe('write count', () => {
  it(`refuses more than ${WRITE_CAP.closes} closes/reopens or ${WRITE_CAP.comments} comments`, () => {
    const close = { kind: 'close-pr', comments: [{}] };
    const reply = { kind: 'ineligible-reply', comments: [{}] };
    expect(writeCount(Array(10).fill(close)).exceeded).toBe(false);
    expect(writeCount(Array(11).fill(close)).exceeded).toBe(true);
    expect(writeCount(Array(20).fill(reply)).exceeded).toBe(false);
    expect(writeCount(Array(21).fill(reply)).exceeded).toBe(true);
  });
});

describe('state and log files', () => {
  it('round-trips markers and the first evidence request time', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bounty-guard-'));
    const f = join(dir, 'state.json');
    writeFileSync(f, '');
    const s = loadState(f);
    recordMarker(s, { kind: 'flag-pr', number: 9 }, 'needs-evidence', NOW);
    recordMarker(s, { kind: 'flag-pr', number: 9 }, 'needs-evidence', new Date(NOW.getTime() + 1000));
    recordMarker(s, { kind: 'reopen-issue', number: 61 }, 'reopen:x', NOW);
    saveState(f, s);
    expect(loadState(f)).toMatchObject({ prs: { 9: { markers: ['needs-evidence'], evidenceRequestedAt: NOW.toISOString() } }, issues: { 61: { markers: ['reopen:x'] } } });
  });

  it('saves atomically (no temp file left behind)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bounty-guard-'));
    saveState(join(dir, 'state.json'), { prs: {}, issues: {} });
    expect(readdirSync(dir)).toEqual(['state.json']);
  });

  it('comment window: full fetch on first run or a newly flagged author, else since the last good run minus a margin', () => {
    const flagged = new Set(['a']);
    expect(commentsSince({ lastRunAt: null }, flagged)).toBeNull();
    expect(commentsSince({ lastRunAt: '2026-10-23T12:00:00Z', flaggedAuthorsSeen: [] }, flagged)).toBeNull();
    expect(commentsSince({ lastRunAt: '2026-10-23T12:00:00Z', flaggedAuthorsSeen: ['a'] }, flagged)).toBe('2026-10-23T06:00:00.000Z');
  });

  it('the comment window never moves past a reply still owed', () => {
    const startedAt = '2026-10-23T12:00:00Z';
    expect(nextLastRunAt({ startedAt })).toBe('2026-10-23T12:00:00.000Z');
    expect(nextLastRunAt({ startedAt, previous: '2026-10-22T00:00:00Z', failed: 1 })).toBe('2026-10-22T00:00:00Z');
    const deferred = [{ kind: 'ineligible-reply', commentAt: '2026-10-20T05:00:00Z' }, { kind: 'close-pr' }];
    expect(nextLastRunAt({ startedAt, deferred })).toBe('2026-10-20T05:00:00.000Z');
    const issues = [{ number: 7, comments: [{ createdAt: '2026-10-19T01:00:00Z' }, { createdAt: '2026-10-21T01:00:00Z' }] }, { number: 8, comments: [{ createdAt: '2026-10-01T00:00:00Z' }] }];
    expect(nextLastRunAt({ startedAt, issueErrors: [7], issues })).toBe('2026-10-19T01:00:00.000Z');
  });

  it('plan gives deferred replies the flagged comment time and reports issue errors by number', () => {
    const base = { flaggedAuthors: new Set(['taherezzi']), maintainers: new Set(), viewer: 'lizTheDeveloper', now: NOW, prs: [] };
    const ok = { number: 131, state: 'OPEN', labels: [], comments: [{ author: 'TaherEzzi', body: '/claim', createdAt: '2026-10-20T00:00:00Z' }] };
    const bad = Object.defineProperty({ number: 9, state: 'OPEN', comments: [] }, 'labels', { get() { throw new Error('boom'); } });
    const { actions, issueErrors } = plan({ ...base, issues: [ok, bad] });
    expect(actions[0]).toMatchObject({ kind: 'ineligible-reply', commentAt: '2026-10-20T00:00:00Z' });
    expect(issueErrors).toEqual([9]);
  });

  it('rotates the log once it passes the cap', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bounty-guard-'));
    const log = join(dir, 'bounty-guard.log');
    writeFileSync(log, 'x'.repeat(50));
    expect(rotateLog(log, 100)).toBe(false);
    writeFileSync(log, 'x'.repeat(150));
    expect(rotateLog(log, 100)).toBe(true);
    expect(existsSync(log)).toBe(false);
    expect(statSync(`${log}.1`).size).toBe(150);
  });
});

describe('install files', () => {
  const read = (p) => readFileSync(new URL(`../scripts/bounty-guard/${p}`, import.meta.url), 'utf8');

  it('install.sh installs from origin/main into Application Support, read-only, after a dry run', () => {
    const sh = read('install.sh');
    expect(sh).toMatch(/git -C "\$repo" fetch origin/);
    expect(sh).toMatch(/git -C "\$repo" show "\$ref:scripts\/bounty-guard\/guard\.mjs"/);
    expect(sh).toMatch(/Library\/Application Support\/bounty-guard/);
    expect(sh).toMatch(/chmod 0444/);
    expect(sh).toMatch(/chmod 0555/);
    expect(sh).toMatch(/guard\.mjs\.tmp"\n[\s\S]*mv -f "\$dir\/guard\.mjs\.tmp" "\$dir\/guard\.mjs"/);
    expect(sh).toMatch(/mv -f "\$plist\.tmp" "\$plist"/);
    expect(sh).toMatch(/chmod 0700 "\$dir\/state"/);
    expect(sh.indexOf('rm -f "$dir/status.txt" "$dir/state.json"')).toBeLessThan(sh.indexOf('chmod 0555'));
    expect(sh).toMatch(/plutil -lint "\$plist\.tmp" >\/dev\/null \|\| \{ rm -f "\$plist\.tmp"/);
    expect(sh.indexOf('"$node_bin" "$dir/guard.mjs"')).toBeLessThan(sh.indexOf('launchctl bootstrap'));
  });

  it('nothing hardcodes a user home', () => {
    expect(read('install.sh')).not.toMatch(/\/Users\//);
    expect(read('com.multiverse.bounty-guard.plist')).not.toMatch(/\/Users\//);
    expect(read('com.multiverse.bounty-guard.plist')).toMatch(/__DIR__\/guard\.mjs/);
  });
});
