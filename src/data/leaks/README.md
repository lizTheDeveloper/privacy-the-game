# Leak badges (Liz, 2026-10-29)

Every surveillance program, leak or case that names a service the player has gets a badge on that
account, and every badge has its own page of sources at `#/leak/<id>`.

## One file per group

`src/data/leaks/<group>.js` exports one frozen array, `LEAKS_<GROUP>`, of programs:

```js
{
  id: 'muscular',              // kebab-case, unique across all groups: the page is #/leak/muscular
  badge: 'MUSCULAR',           // the badge text on an account: short, caps, ≤ 18 chars
  title: 'MUSCULAR',           // the page heading
  agency: 'NSA and GCHQ',      // who did it, named (never an omni-"they")
  leak: 'snowden',             // 'snowden' | 'vault7' | 'foia' | 'lawsuit' | 'reporting' | 'court'
  year: 2013,                  // the year it became public
  summary: '…',                // 2–4 plain sentences, see Copy
  accounts: ['gmail', 'yahoo'],// ids from src/data/accounts.js (accounts.js, accounts-*.js)
  sources: [{ label: 'The Washington Post (2013): …', url: 'https://…' }], // ≥ 2, best first
  // Who gets what, how (Liz: "make the government not a nebulous they"). Every value sourced.
  flow: {
    data: 'Email and chat content, account metadata',  // what is taken
    from: ['Google', 'Yahoo'],                          // where it's taken from (companies, cables, devices)
    to: ['NSA', 'GCHQ'],                                // the agency/agencies that take it (ids from agencies.js)
    sharedWith: ['FBI', 'CIA'],                         // who else gets it, if a source says so
    authority: 'Executive Order 12333',                 // the law, order or contract it runs under ('none'/'contract' allowed)
    when: 'Overseas, without a court order',            // under what circumstances it's used
    checkedBy: 'No court; the FISA Court does not review EO 12333 collection', // who verifies or approves it; say plainly if no one
  },
}
```

Agency names in `to`/`sharedWith` use these ids so the diagram can draw them: NSA, CIA, FBI, DEA, DHS, ICE, CBP, SECRET_SERVICE, IRS, MILITARY, NCTC, ODNI, GCHQ, FIVE_EYES, LOCAL_POLICE, STATE_POLICE, FUSION_CENTERS, FISC, PCLOB, CONGRESS. Ask the lead before inventing a new one.

## Copy (Liz's rules for this page)

- Maximum interpretation, no hedging: no "reportedly", "allegedly", "may have", "planned".
- Never invent: every sentence is something a listed source says. Quote short phrases where you can.
- Name the actor: "the NSA", "the CIA", "ICE", "GCHQ", never "they".
- Present tense for what still runs; past tense for what a source says ended.
- Labels: `label` is `Outlet (year): headline` or `Wikipedia: Title` or `EFF: …` / `ACLU: …`.

## Accounts

Only label an account when a source names that company, service or device (or, for a device type
such as a smart TV, router or car, the device type). A company that owns a named service today
counts (Microsoft owns LinkedIn and GitHub; Meta owns Instagram and WhatsApp).

## URLs

Every source URL must be checked live. Record each one in `research/leaks/<group>-urls.json` as
`{ "<url>": "how it answered, date" }`. Sites that refuse fetch tools (the Guardian, the Washington
Post, optoutprescreen.com) go in as `"needs browser check"` and the lead checks them in a browser.
