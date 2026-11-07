# Open data broker dataset

A dataset of mostly US data brokers (and some of their UK and French parent companies) and the documented links between them: who owns whom, who supplies whom, who buys from whom. Every link cites a document, and every document has an archived copy.

It was built for [Reclaim City](https://github.com/lizTheDeveloper/privacy-the-game), a game about taking your data back. It is published separately for journalists, researchers and privacy advocates who want to check, reuse or extend it.

- **As of:** 2026-10-24 (`DATASET.json`)
- **License:** [CC BY 4.0](LICENSE)
- **Errors:** [open an issue](https://github.com/lizTheDeveloper/privacy-the-game/issues)

## How to cite

> Reclaim City open data broker dataset, as of 2026-10-24. https://github.com/lizTheDeveloper/privacy-the-game/tree/main/research/data-brokers (CC BY 4.0).

When you cite a specific link, also cite the source document it rests on (its `url` and `archived` copy in `sources.json`). The dataset is a pointer to the evidence, not the evidence itself.

## What's in it

| | Count |
|---|---|
| Broker records | 970 |
| Links (all tiers) | 158 |
| Published links (tier A) | 106 |
| Sources | 174 |

Published links by type:

| Type | Published |
|---|---|
| `owns` | 47 |
| `buys` | 44 |
| `supplies` | 15 |
| `matches-identity` | 0 |

Published links by source family:

| Family | Published | What the sources are |
|---|---|---|
| Procurement | 43 | US federal contract awards (USAspending) |
| Corporate filings | 39 | SEC 10-Ks (20 links) and statutory annual reports filed with non-US regulators (19 links: Experian, RELX, Publicis) |
| Enforcement | 24 | FTC and CFPB complaints and orders, and federal court records |

The other 52 links are kept but not published: 10 tier B, 27 tier C, and 15 tier A links that review held back because the source's wording did not support publishing the claim (for example, a procurement award that reads as a software licence, a filing that says reports "combine information from" bureaus rather than that one buys from another, or a complaint that describes what a contract permitted rather than what the companies did). See "Evidence tiers" below.

Of the 970 broker records, 806 come from the state registries, 97 were added by research (parent companies, subsidiaries named in filings, and government buyers), and 67 come only from the two industry member lists (see "Sweeps"). 93 records appear in at least one published link; most registered brokers have no documented link yet.

The count includes a few near-duplicates caused by typos in the registries themselves, such as `west-publising` beside `west-publishing` and `melissa-data-corporatoin` beside `melissa-data`. They are kept as separate records until research confirms they are the same company.

## Coverage

State data broker registries imported (details in `sources/registries/SOURCES.md`):

| Registry | Saved | Brokers listing it |
|---|---|---|
| California (CPPA) | 2026-10-18 | 603 |
| Texas (Secretary of State) | 2026-10-18 | 437 |
| Oregon (DCBS) | 2026-10-18 | 387 |
| Vermont (Secretary of State) | 2026-10-19 | 387 |

71 records are listed only by Vermont.

**Vermont's file is not publicly downloadable.** The Secretary of State offers it as a "Bulk Database Download" to anyone with a free bizfilings.vermont.gov account, and a maintainer downloaded it while logged in. Because it sits behind the login, it has no public URL and cannot be archived; its `archived` copy in `sources.json` is a Wayback capture of the registry's public search page instead, and `SOURCES.md` records the file's SHA-256 so a copy someone else downloads can be compared. The committed snapshot is minimised: it keeps only the columns that identify the business or that the import uses, and drops the names, emails, phone numbers and addresses of the people who filed (the full file is held by the maintainer). The file also lists lapsed registrations ("Unregistered"); only brokers with a current registration ("Registered") are imported. Vermont gives no opt-out link field, only a free-text description, so a Vermont-only record has an opt-out route only when that answer is a bare URL or email address.

`registries.CA: "2026"` means "listed in our snapshot" (saved 2026-10-18; Vermont's 2026-10-19), not the year the broker first registered.

## Evidence tiers and what gets published

Every link has a tier:

- **A:** a regulator or court document, an SEC filing, a statutory annual report filed with a non-US securities regulator (Experian and RELX in the UK, Publicis in France), or a US federal procurement record.
- **B:** the company's own statement (privacy policy, press release).
- **C:** reputable journalism.

**Only tier A links are published.** Tier B and C links are in `links.json` with `"published": false`. They are research leads awaiting a later review, not findings. The validator rejects any published link that is not tier A, or that does not cite at least one source of a tier A kind: `sec-10k`, `sec-8k`, `sec-20f`, `sec-40f`, `annual-report`, `ftc-complaint`, `ftc-order`, `cfpb-order`, `court` or `procurement` (`TIER_A_SOURCE_KINDS` in `build/schema.js`). It also rejects a link from a record to itself, two links with the same `from`, `to` and `type`, and any link, published or not, that cites a `member-list` source: being on the same industry list says nothing about who owns, supplies or buys from whom.

Broker records themselves (names, registry data, opt-out routes) are published in full.

## Methods and standards

These are the rules every published claim follows. They are what you need to judge whether to rely on one.

- **Narrow claims.** Each `claim` says only what its source says, and names the document. Allegations in a complaint are written as allegations ("the FTC alleges…"); a claim from a complaint describes what the complaint says, not a court finding. Some of those cases later settled. A link states settlement status only when it cites the order or settlement itself; there, if the company neither admitted nor denied the allegations, the claim says so. A link that cites only a complaint says nothing about how the case ended.
- **Archived and checkable.** Every source has a Wayback Machine copy (`archived`). Every published claim can be checked against that archived copy, not only against the live page.
- **Archived copies checked 2026-10-24.** Every distinct `archived` URL (174) was fetched. 51 failed; of those, 16 were fine (timeouts on large PDFs and slow pages), 34 had never been saved and were captured fresh or replaced with an existing copy, then fetched back and checked against what the dataset cites (`accessed` is 2026-10-24 for those), and 1 is unresolved: `sec-ramp-10k-fy2026`, LiveRamp's FY2026 10-K, which sec.gov refuses to the Wayback crawler, so its `archived` copy does not load yet. For the same reason the CoreLogic 2021 8-K (`sec-clgx-8k-2021-merger`) is archived as the filing's complete submission text (`0001193125-21-182272.txt`, captured 2025-04-04), which contains the 8-K verbatim.
- **Procurement archives are API records.** USAspending award pages are JavaScript shells that archive as blank pages, so procurement sources are archived as the award's JSON from the USAspending API (`api.usaspending.gov/api/v2/awards/<id>/`). The `url` is still the human-readable award page.
- **What counts as a purchase.** A procurement `buys` link is published only when the award's own description, or its product/service code, shows the government bought data or access to data. Awards that read as software or licences only are kept unpublished. Some published awards are narrow (for example, employee credit checks), and their claims say so.
- **Naming entities.** Complaints often use brand names ("LiveRamp", "Facebook"). Matching those names to a legal-entity record in this dataset is our identification, not the document's.
- **Merging companies.** Two records are merged only when their legal names match. Legal names are compared ignoring case, punctuation and legal-form suffixes (Inc, LLC, Limited, Corp and the like), so "eContext.ai Limited" (California and Oregon registries) and "eContext.ai LLC" (Texas) became one record; those registrations also share an address, a contact and the DBA Complementics. A shared brand or DBA name alone is never enough. Pairs that share only a brand are kept separate and listed in `sources/registries/MERGE-CANDIDATES.md`. Where two records already share a legal name after that comparison (for example `transunion` and `trans-union`), the merge prints a warning, because a new record matched by legal name can only go to one of them.
- **`parent` is the direct parent.** Where a filing says a company is "held indirectly" and doesn't name the direct parent, `parent` is left empty rather than guessed. The game's export (`src/data/broker-map.json`) is stricter: it shows a `parent` only when tier A evidence backs it, either a published `owns` link from the parent to the record, or a record override in `build/record-overrides.json` that sets that parent and cites a tier A source the record carries (for example `general-motors` under `general-motors-company`, from the FTC's C-4828 complaint). Otherwise the export's `parent` is `null`, even when the record in `brokers/` names one from a company's own statement.
- **Known gaps:**
  - Some holding-company to operating-company links are not yet sourced, so related records sit unconnected: TransUnion and Trans Union LLC, Dun & Bradstreet Holdings and Dun and Bradstreet Inc., RELX PLC and RELX Inc., and Verisk and Insurance Services Office.
  - Government buyers are modelled at the agency level (ICE, CBP, FBI…). Their parent departments are not.
  - Most Vermont-only records have no opt-out route yet: Vermont describes opt-outs in prose, which the import never mines for links (see Coverage).
- **Unknown stays unknown.** A missing size is `size.known: false`, never an estimate. An opt-out URL we couldn't check is marked as such, not assumed live or dead.

## Files

```
DATASET.json          { "asOf": "YYYY-MM-DD" }
brokers/<id>.json     one record per broker
links.json            every link, published or not
sources.json          every source document, keyed by id
sources/registries/   state registry snapshots as downloaded, SOURCES.md, MERGE-CANDIDATES.md
sources/MISSION-MAPPING.md   how records are tied to the game's missions
staging/<family>/     research output per source family, with researchers' NOTES.md and REJECTED.json
staging/membership/lists/   the NAI and DAA member lists as transcribed, one JSON file per list
build/                scripts and the curation config
```

The game reads a derived file, `src/data/broker-map.json`, which holds only published links (shape under "The game's export" below).

## Record shapes

### Broker (`brokers/<id>.json`)

| Field | Meaning |
|---|---|
| `id` | Stable slug; matches the filename. |
| `name` | Legal name where known. |
| `aliases` | DBAs and other names. An alias never merges two records. |
| `parent` | Id of the direct parent company, or `null`. |
| `kind` | Zero or more of `people-search`, `marketing`, `risk-identity`, `location`, `financial`, `health`, `automotive`, `identity-resolution`, `data-marketplace`, `ad-network`, `buyer`. Empty means not yet classified (681 records). Records added from a member list are `ad-network`. Government agencies are `buyer`. |
| `registries` | `{ "CA": "2026", "VT": …, "TX": …, "OR": … }`: the snapshot year a registry listed it in. |
| `website` | Primary website, where a registry gives one. |
| `sells` | What a source says it sells, in short phrases. |
| `optOut` | How to opt out, or `null` if no route is known (226 records, 67 of them added from a member list). See below. |
| `size` | `{ known, signals: [{ kind, value, source }] }`. `known: false` has no signals. |
| `missions` | Reclaim City missions that file with this broker (game use only). |
| `sources` | Ids in `sources.json` behind anything on the record. |

`optOut`:

| Field | Meaning |
|---|---|
| `method` | `web-form`, `email`, `mail`, `portal`, `sweep-only` or `none`. `none` means the broker offers no opt-out. |
| `url` / `email` | Where to go. |
| `status` | Result of the last automated check (below). |
| `verifiedAt` | The date of that check (YYYY-MM-DD), whatever its result. |
| `notes` | Anything a person needs to know to use it. |
| `alternates` | Other documented routes `[{ site, url, source }]`, such as a DBA site's own form. |

`optOut.status` values:

- `verified`: the URL loaded and stayed on the same site and page.
- `suspect`: it loaded, but redirected to another domain or to the site's home page. The form may have moved.
- `blocked`: we could not verify it (a 401/403/429/5xx response, a timeout or other network error). Often this is bot protection. It is **not** evidence that the page is gone.
- `dead`: a 404 or 410 response, or the domain no longer resolves (`ENOTFOUND`; a temporary lookup failure, `EAI_AGAIN`, is `blocked`).
- `unchecked`: not yet checked. A record with no `status` has also not been checked; `npm run brokers:check-urls -- --only=unchecked` checks both.

Current results for the 743 records with an opt-out entry: 632 verified, 15 suspect, 75 blocked, 20 dead, and 1 with no status (an email-only route, which has no URL to check). The check is automated and cannot fill in forms; a `verified` page can still fail to work. It covers only `optOut.url`, not `alternates`.

### Link (`links.json`)

```json
{ "from": "kochava", "to": "collective-data-solutions", "type": "owns", "tier": "A",
  "claim": "The FTC's July 2024 second amended complaint in FTC v. Kochava alleges …",
  "sources": ["enf-ftc-kochava-sac-2024"], "published": true }
```

| Field | Meaning |
|---|---|
| `from`, `to` | Broker ids. |
| `type` | `owns` (from owns to), `supplies` (from provides data to to), `buys` (from buys data from to), `matches-identity` (from matches identities with to). |
| `tier` | `A`, `B` or `C`. |
| `claim` | One sentence, as narrow as the source allows. |
| `sources` | One or more ids in `sources.json`. |
| `published` | `true` for tier A links, unless review held the link back (see `build/link-overrides.json`). Never `true` for B or C. |

### Source (`sources.json`)

| Field | Meaning |
|---|---|
| `url` | The original document. |
| `archived` | A Wayback Machine copy (always `https://web.archive.org/…`). |
| `kind` | `registry`, `sec-10k`, `sec-8k`, `sec-20f`, `sec-40f`, `annual-report`, `ftc-complaint`, `ftc-order`, `cfpb-order`, `court`, `procurement`, `privacy-policy`, `press-release`, `journalism`, `member-list` or `other`. `member-list` is an industry body's own list of member or participating companies; it can source a broker record or a sweep, never a link (see "Sweeps"). |
| `title` | What the document is. |
| `accessed` | The date we read it. |

## Sweeps

A sweep is one opt-out tool, run by an industry body, that covers many companies at once. Reclaim City's broker missions name sweeps by id on their checklist lines (`src/data/broker-checklists.js`). The dataset has one:

| Sweep | Tool | Members | Source |
|---|---|---|---|
| `daa` | DAA WebChoices | 99 | The list of participating companies that the Digital Advertising Alliance's WebChoices tool ([optout.aboutads.info](https://optout.aboutads.info/)) loads, `files.aboutads.info/prod-companies.json` ([archived](https://web.archive.org/web/20261024071700/https://files.aboutads.info/prod-companies.json)), read 2026-10-24 |

**There is no `nai` sweep.** As of 2026-10-24 the Network Advertising Initiative runs no one-shot opt-out: optout.networkadvertising.org redirects to [thenai.org/how-to-opt-out](https://thenai.org/how-to-opt-out/) ([archived](https://web.archive.org/web/20261024073031/https://thenai.org/how-to-opt-out/)), which offers a Global Privacy Control extension for Chrome, a page of links to each member's own opt-out, and the DAA's tools. A halo for it would claim an opt-out that does not happen. The NAI's member directory ([thenai.org/about-the-nai-2/members](https://thenai.org/about-the-nai-2/members/), [archived](https://web.archive.org/web/20261024071604/https://thenai.org/about-the-nai-2/members/), 75 members) is still a `member-list` source: it sources broker records, never a sweep. The validator still accepts `nai` as a sweep id, so a working NAI tool could be added back.

- **What a sweep claims.** Only that the company is on that tool's list on that date. It says nothing about what the company holds, whether the opt-out reaches all of it, or how long it lasts. WebChoices opt-outs are browser cookies: they cover one browser and are lost when its cookies are cleared, which is why the game marks these stars "browser only".
- **The DAA list is the tool's, not the DAA's directory.** The DAA's "participating companies" page (youradchoices.com/participating) is a partial list that also names brand advertisers (car makers, banks, drug companies) the tool does not opt you out of. The tool's page is a JavaScript application behind a bot check and archives as a blank page, so, as with procurement, the `archived` copy is the JSON file the page loads, and the `url` is the tool.
- **Matching.** A listed company joins an existing record when their legal names match under the rule in "Merging companies". The lists mostly give brand names, so "Criteo" matches "Criteo Corp." but "Facebook" does not match "Meta Platforms". A listing is also pinned onto an existing record in `build/id-map.json` (family `membership`, each pin with a `reason`) only when there is a documented tie: a state registry row lists that record under the list's name (VT's "Nielsen Marketing Cloud" for the DAA's "The Nielsen Marketing Cloud") or with the list's brand as its DBA (for example xAd, Inc. d/b/a GroundTruth); the registry's legal name differs from the list's only by a corporate suffix, foreign ones included (Pte, Ltd, SA, plc, GmbH, BV, AG), and both give the same website domain (Eyeota Pte Ltd and Eyeota, at eyeota.com; the global legal-suffix rule is unchanged); the list's own entry describes the listing as that company (the NAI's "Nielsen" entry describes "The Nielsen Marketing Cloud"); a tier A source already on the record names the brand as that same company or as its former legal name, quoted in the pin (Publicis's 2025 Universal Registration Document calls Lotame Solutions, Inc. "Lotame"); or the list names the company the same way on the same website as a listing that matched (Kargo and Kargo Global, at kargo.com). Two listings of one company on the same website (Adobe and Adobe Marketing Cloud) become one record the same way. Liz's rule (2026-10-19): a new record only for a listed company the registries don't already list.
- **New records.** Every other listing becomes a new record with `kind: ["ad-network"]`, no registries, `optOut: null`, unknown size and the list as its only source (67 records). Some share only a brand, an alias from research or journalism, or a website with a record already here (for example `facebook` beside `meta`, `experian-2` beside `experian`); they stay separate until a source ties the legal names. `staging/membership/NOTES.md` lists them for curators.
- **Membership never backs a link,** and `member-list` is not a tier A source kind.

The two lists reach 127 records, 47 of them on both. `build/sweeps.json` holds each sweep's `name`, `source` and sorted `members` (broker ids). The validator checks it: each sweep id is `nai` or `daa`, its source is a `member-list` source, and every member is a record, listed once.

## Reach and hubs

**Reach** is 1 plus the number of distinct records downstream of a broker along published links. It chains separate documented links together; it does not mean any particular data passed along the chain. For example, General Motors' reach includes the government agencies that buy from LexisNexis Risk Solutions, because GM supplied LexisNexis and those agencies buy from it, but no source says GM's data reached those agencies. `owns`, `supplies` and `matches-identity` point downstream from `from` to `to`. `buys` points the other way: if an agency buys from a vendor, the agency is downstream of the vendor. Each record is counted once, even when there are cycles. Size signals are recorded on broker records but don't affect reach. The code is `build/reach.js`.

**Hubs** are the 12 records with the highest reach, ties broken alphabetically by id, and only if their reach is above 1. For this release:

| Hub | Reach |
|---|---|
| TransUnion (`transunion`) | 18 |
| Experian plc (`experian`) | 16 |
| RELX PLC (`relx-plc`) | 14 |
| General Motors LLC (`general-motors`) | 11 |
| Equifax Inc. (`equifax`) | 9 |
| Experian Information Solutions, Inc (`experian-information-solutions`) | 7 |
| LexisNexis Risk Solutions Inc. (`lexisnexis-risk-solutions`) | 7 |
| TransUnion Risk and Alternative Data Solutions, Inc. (`transunion-risk-and-alternative-data-solutions`) | 7 |
| Avast (`avast`) | 6 |
| Babel Street, Inc. (`babel-street`) | 6 |
| West Publishing Corp (`west-publishing`) | 6 |
| Clearview AI, Inc. (`clearview-ai`) | 5 |

Clearview AI is the 12th hub because of the alphabetical tie-break: GoodRx, Jumpshot and Thomson Reuters Special Services also have reach 5.

Reading these numbers:

- Reach measures documented, published links only. It is not market size or the amount of data held, and it is not a traced data flow: each link in a chain rests on its own source.
- The hubs' direct links come from different kinds of source:
  - ownership of subsidiaries, from SEC filings and annual reports: TransUnion, Experian, RELX, Equifax (their reach also counts what those subsidiaries are documented to supply or sell);
  - supply of data, from FTC enforcement documents: General Motors, Avast;
  - government purchases, from federal procurement records: Experian Information Solutions, LexisNexis Risk Solutions, TransUnion Risk and Alternative Data Solutions, Babel Street, West Publishing, Clearview AI.
- A company whose documented links are mainly inbound, or not yet published, ranks low. LiveRamp and Acxiom each have reach 1 here: the published links point into them (for example, Jumpshot supplied LiveRamp; Omnicom owns Acxiom), and Acxiom's outbound links are tier C and unpublished.

## The game's export (`src/data/broker-map.json`)

`npm run brokers:export` writes this file from the dataset. It holds only published links. Its shape:

```json
{ "formatVersion": 1, "asOf": "2026-10-19",
  "brokers": [ { "id": "…", "name": "…", "parent": null, "kind": [], "registries": {}, "sells": [],
                 "optOut": { "method": "web-form", "url": "…", "status": "verified", "verifiedAt": "2026-10-19" },
                 "missions": [], "reach": 1, "hub": false,
                 "sources": [ { "url": "…", "archived": "https://web.archive.org/…", "kind": "filing" } ] } ],
  "links": [ { "from": "…", "to": "…", "type": "owns", "tier": "A", "claim": "…",
               "sources": [ { "url": "…", "archived": "https://web.archive.org/…" } ] } ],
  "sweeps": { "daa": { "name": "DAA WebChoices", "source": { "url": "…", "archived": "https://web.archive.org/…" }, "members": [ "…" ] } } }
```

| Field | Meaning |
|---|---|
| `formatVersion` | `1`. It changes when the shape changes in a way a reader must handle. |
| `asOf` | The dataset date, from `DATASET.json`. |
| `brokers` | Every broker record, sorted by `id`. |
| `brokers[].id`, `name`, `kind`, `registries` | As in `brokers/<id>.json`. |
| `brokers[].parent` | The direct parent's id, only when tier A evidence backs it (see "`parent` is the direct parent" above); otherwise `null`. `null` does not mean the company has no parent. |
| `brokers[].sells` | What a source says the company sells, often in the company's own words. `[]` when none is recorded. |
| `brokers[].optOut` | As in `brokers/<id>.json` (`method`, `url`, `email`, `status`, `verifiedAt`, `notes`, `alternates`), or `null` when no opt-out route is known. `null` means unknown, not that the broker offers none; that is `method: "none"`. |
| `brokers[].optOut.status` | Always present: `verified`, `suspect`, `blocked`, `dead` or `unchecked` (meanings under "`optOut.status` values"). `unchecked` means no automated check has a result, including routes with no URL to check. `blocked` means we could not verify the page, usually because of bot protection; it is not evidence the page is gone. Only `dead` (404/410 or a domain that no longer resolves) says that. |
| `brokers[].optOut.alternates` | Other documented routes. Their URLs are not checked yet. |
| `brokers[].missions` | Reclaim City missions that file with this broker; `[]` when none. |
| `brokers[].reach`, `hub` | Reach and hub status (see "Reach and hubs"). |
| `brokers[].sources` | The record's sources whose `kind` is not `registry`, as `url`, `archived` and `kind`, sorted by `url`; `[]` when none. Added without changing `formatVersion`, since readers that ignore it are unaffected. |
| `links` | Published links only, sorted by `from`, `to`, `type`. Each source is given as its `url` and `archived` copy. |
| `sweeps` | `{ daa: { name, source: { url, archived }, members: [id] } }` from `build/sweeps.json` (see "Sweeps"; there is no `nai` sweep); members sorted. Added without changing `formatVersion`: a reader treats a missing `sweeps` as `{}`. |

Not in the export: `aliases`, `website`, `size`, registry-kind `sources` on broker records, and every unpublished link. Use the dataset files for those.

## How to rebuild

Everything is regenerated by scripts. Curation decisions live in config under `build/`, never in hand edits to the records:

- `build/id-map.json`: per family, a staged id to the canonical record it means: a record id, or `{ id, reason }` (the `membership` family's pins all carry a reason).
- `build/alias-blocklist.json`: aliases removed from a record, each with a reason.
- `build/link-overrides.json`: links dropped, unpublished, moved to another entity or given a narrower claim, each with a reason. A drop acts on a link as research staged it, and names the staging `family` it targets.
- `build/record-overrides.json`: field corrections on a record (`name`, `parent`, `sells`, `kind`, `optOut.email`), each with a source and reason.
- `build/sweeps.json`: the one sweep, `daa`, and its members (see "Sweeps"). Unlike the other files here it is generated, never hand-edited, even though it lives in `build/`: `build/stage-membership.js` writes it, together with `staging/membership/`, from the transcribed lists in `staging/membership/lists/` and the `membership` pins in `build/id-map.json`. Its output is committed. The script leaves out records sourced only by the member lists when it matches, so re-running it on the committed tree reproduces the committed staging (a test checks this); run it before `merge-staging.js membership` whenever a list or a pin changes.

From the repository root (Node.js; built with v22):

```sh
# 1. Start empty
rm -rf research/data-brokers/brokers
echo '{}' > research/data-brokers/sources.json
echo '[]' > research/data-brokers/links.json

# 2. Import the registries. The last argument is each snapshot's Wayback capture. A capture can
#    predate our download (CA's is from 2026-08-06); SOURCES.md records that the file had not changed.
#    TX's export and VT's login-only bulk file cannot be archived, so theirs capture the registry page.
npm run brokers:import -- CA research/data-brokers/sources/registries/ca-2026-10-18.csv 2026-10-18 https://web.archive.org/web/20260806041805/https://cppa.ca.gov/data_broker_registry/registry.csv
npm run brokers:import -- TX research/data-brokers/sources/registries/tx-2026-10-18.csv 2026-10-18 https://web.archive.org/web/20261019051305/https://texas-sos.appianportalsgov.com/data-broker-registry
npm run brokers:import -- OR research/data-brokers/sources/registries/or-2026-10-18.csv 2026-10-18 https://web.archive.org/web/20261019051000/https://www4.cbs.state.or.us/ex/shared/downtemp/dfcs_db_optout.csv
npm run brokers:import -- VT research/data-brokers/sources/registries/vt-2026-10-19.csv 2026-10-19 https://web.archive.org/web/20261019163716/https://bizfilings.vermont.gov/databrokersearch/Search

# 3. Check the registry opt-out URLs (the merge uses the result)
npm run brokers:check-urls

# 4. Merge the research, in this order (tier A families first)
for f in sec enforcement procurement policies journalism membership; do
  node research/data-brokers/build/merge-staging.js "$f"
done

# 5. Tie records to the game's missions
node research/data-brokers/build/map-missions.js

# 6. Check the opt-out URLs again (or only the unchecked ones: -- --only=unchecked), then validate and export
npm run brokers:check-urls
npm run brokers:validate
npm run brokers:export

# 7. Lay out the constellation map
npm run brokers:layout
```

`merge-staging.js <family> --dry-run` shows what a merge would change without writing. `brokers:validate` checks the dataset, the research records in `staging/` and the curation config in `build/` (`id-map`, `alias-blocklist`, `link-overrides`, `record-overrides`); it exits non-zero on any error and prints the counts. The game's test suite runs it too, and checks that `src/data/broker-map.json` matches a fresh export. `brokers:check-urls` first checks that the machine is online, and writes nothing when more than 20% of the URLs come back dead (that looks like a network problem, not dead brokers) unless given `--force`. `brokers:export` writes `src/data/broker-map.json` and prints the hubs.

### Layout

`brokers:layout` reads `src/data/broker-map.json` (and each record's `size.known`) and writes `src/data/broker-layout.json`: one star `[id, x, y, r]` per broker in a 1000×1000 square, so the game draws the Broker Constellation without running a simulation on the phone. Buyers sit on the rim (radius 470). Brokers in any published link are placed by a seeded force layout inside radius 330. The 12 hubs stay within radius 230, at least 140 apart, and each linked broker is drawn toward the hubs it is linked to (or toward its linked neighbours when it has no hub), so every hub is a bright star with its crowd as a nebula around it. Links to buyers pull only weakly, so hubs are not dragged to the rim. Brokers with no documented links fill the outer ring between 350 and 440, on a golden-angle spiral with seeded jitter in angle and radius. A star's radius is `2 + 2.2 × log2(reach)`, plus 1 when the company's size is known. The script is deterministic: the same map gives a byte-identical file, so re-run it after every export and commit the result.

Steps 1, 2, 4 and 5 are deterministic. The URL checks are not: they depend on the day and on how each site treats automated requests, so `status` and `verifiedAt` will differ from ours. Because the merge replaces a registry opt-out URL marked `blocked` when research found one on the broker's own domain, a different step 3 result can also change which opt-out URL a record ends up with.

## Reporting an error

If a claim is wrong, a source doesn't say what we say it does, two records are the same company (or one record is two), or an opt-out route has changed, please [open an issue](https://github.com/lizTheDeveloper/privacy-the-game/issues) on this repository. Include the record or link ids and, if you can, a document that shows the correction. Corrections go into the config under `build/`, so they survive the next rebuild.
