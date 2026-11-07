// Schema constants and validators for the open data-broker dataset.
// Validators return arrays of error strings; empty means valid.

export const KINDS = Object.freeze(['people-search', 'marketing', 'risk-identity', 'location', 'financial', 'health', 'automotive', 'identity-resolution', 'data-marketplace', 'ad-network', 'buyer']);
export const OPT_OUT_METHODS = Object.freeze(['web-form', 'email', 'mail', 'portal', 'sweep-only', 'none']);
export const LINK_TYPES = Object.freeze(['owns', 'supplies', 'buys', 'matches-identity']);
export const TIERS = Object.freeze(['A', 'B', 'C']);
export const OPT_OUT_STATUSES = Object.freeze(['verified', 'suspect', 'dead', 'blocked', 'unchecked']);
export const REGISTRY_KEYS = Object.freeze(['CA', 'VT', 'TX', 'OR']);
// Source kinds that count as tier-A evidence (README "Evidence tiers"): regulator and court documents,
// SEC filings, statutory annual reports filed with non-US regulators, and US federal procurement records.
// A published link must cite at least one source of one of these kinds.
export const TIER_A_SOURCE_KINDS = Object.freeze(['sec-10k', 'sec-8k', 'sec-20f', 'sec-40f', 'annual-report', 'ftc-complaint', 'ftc-order', 'cfpb-order', 'court', 'procurement']);
// An industry body's published list of member or participating companies (README "Sweeps"). It can source a
// broker record and back a sweep, but never a link: membership says nothing about who owns, supplies or buys from whom.
export const MEMBER_LIST_KIND = 'member-list';
// Every source kind (README "sources.json"). The tier-A kinds and member-list depend on exact spelling.
export const SOURCE_KINDS = Object.freeze(['registry', ...TIER_A_SOURCE_KINDS, 'privacy-policy', 'press-release', 'journalism', MEMBER_LIST_KIND, 'other']);
// Sweeps a broker mission's checklist can name (src/data/broker-checklists.js): one opt-out tool that covers many companies.
export const SWEEP_IDS = Object.freeze(['nai', 'daa']);

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isStr = (x) => typeof x === 'string' && x.trim() !== '';
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

/** YYYY-MM-DD that is a real calendar day (not 2026-13-45 or 2026-02-30). */
export function isRealDate(x) {
  if (typeof x !== 'string' || !DATE.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}

/** An absolute http(s) URL with a host (no javascript:, data:, relative or "TODO" text). */
export function isHttpUrl(x) {
  if (!isStr(x) || /\s/.test(x)) return false;
  try {
    const u = new URL(x);
    return (u.protocol === 'https:' || u.protocol === 'http:') && /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(u.hostname);
  } catch {
    return false;
  }
}

/** A Wayback snapshot of an http(s) page: https://web.archive.org/web/<14-digit timestamp>/<url>. */
export const WAYBACK_SNAPSHOT = /^https:\/\/web\.archive\.org\/web\/(?:19|20)\d{12}(?:[a-z]{2}_)?\/(https?:\/\/\S+)$/;
export const isWaybackSnapshot = (x) => isStr(x) && WAYBACK_SNAPSHOT.test(x) && isHttpUrl(x.match(WAYBACK_SNAPSHOT)[1]);

/** A registry listing year: four digits. */
export const isRegistryYear = (x) => typeof x === 'string' && /^(?:19|20)\d{2}$/.test(x);

export function validateSource(id, s) {
  const p = `source ${id}`;
  if (!isObj(s)) return [`${p}: must be an object`];
  const errs = [];
  if (!isStr(s.url)) errs.push(`${p}: url is required`);
  else if (!isHttpUrl(s.url)) errs.push(`${p}: url must be an http(s) URL`);
  if (!isStr(s.archived)) errs.push(`${p}: archived copy is required`);
  else if (!isWaybackSnapshot(s.archived)) errs.push(`${p}: archived must be a Wayback snapshot, https://web.archive.org/web/<14-digit timestamp>/<http(s) url>`);
  if (!isStr(s.kind)) errs.push(`${p}: kind is required`);
  else if (!SOURCE_KINDS.includes(s.kind)) errs.push(`${p}: unknown kind "${s.kind}" (expected ${SOURCE_KINDS.join('|')})`);
  if (!isStr(s.title)) errs.push(`${p}: title is required`);
  if (!isRealDate(s.accessed)) errs.push(`${p}: accessed must be a real date, YYYY-MM-DD`);
  return errs;
}

function validateOptOut(o, p, sourceIds) {
  if (o === null) return [];
  if (!isObj(o)) return [`${p}: optOut must be an object or null`];
  const errs = [];
  if (!OPT_OUT_METHODS.includes(o.method)) {
    errs.push(`${p}: optOut.method must be one of ${OPT_OUT_METHODS.join('|')}`);
    return errs;
  }
  if (o.method === 'web-form' || o.method === 'portal') {
    if (!isStr(o.url)) errs.push(`${p}: optOut.url is required for ${o.method}`);
  } else if (o.method === 'email') {
    if (!isStr(o.url) && !isStr(o.email)) errs.push(`${p}: optOut needs url (mailto:) or email for email method`);
  }
  // Any url is a page to open (http/s), or for the email method a mailto: address.
  if (o.url !== undefined && o.url !== null) {
    const mailto = o.method === 'email' && typeof o.url === 'string' && /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(o.url);
    if (!isHttpUrl(o.url) && !mailto) errs.push(`${p}: optOut.url must be an http(s) URL${o.method === 'email' ? ' or a mailto: address' : ''}`);
  }
  if (o.email !== undefined && !(isStr(o.email) && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(o.email))) errs.push(`${p}: optOut.email must be an email address`);
  if (o.status !== undefined && !OPT_OUT_STATUSES.includes(o.status)) errs.push(`${p}: optOut.status must be one of ${OPT_OUT_STATUSES.join('|')}`);
  if (o.verifiedAt !== undefined && o.verifiedAt !== null && !isRealDate(o.verifiedAt)) errs.push(`${p}: optOut.verifiedAt must be a real date, YYYY-MM-DD`);
  // Other opt-out routes a source documents (a DBA site's own form, a newer page) beside the main one.
  if (o.alternates !== undefined) {
    if (!Array.isArray(o.alternates)) errs.push(`${p}: optOut.alternates must be an array`);
    else for (const [i, a] of o.alternates.entries()) {
      if (!isObj(a) || !isStr(a.site)) errs.push(`${p}: optOut.alternates[${i}] needs site`);
      if (!isStr(a?.url) || !/^https?:\/\/\S+$/i.test(a.url)) errs.push(`${p}: optOut.alternates[${i}].url must be an http(s) URL`);
      if (!sourceIds.has(a?.source)) errs.push(`${p}: optOut.alternates[${i}] source "${a?.source}" not in sources.json`);
    }
  }
  return errs;
}

export function validateBroker(b, { sourceIds = new Set() } = {}) {
  if (!isObj(b)) return ['broker: must be an object'];
  const p = `broker ${b.id ?? '(no id)'}`;
  const errs = [];
  if (!isStr(b.id)) errs.push(`${p}: id is required`);
  if (!isStr(b.name)) errs.push(`${p}: name is required`);
  if (!Array.isArray(b.aliases) || !b.aliases.every(isStr)) errs.push(`${p}: aliases must be an array of strings`);
  if (b.parent !== null && !isStr(b.parent)) errs.push(`${p}: parent must be a broker id or null`);
  // An empty kind list is allowed: the registry import flags unknown categories that way.
  if (!Array.isArray(b.kind)) errs.push(`${p}: kind must be an array`);
  else for (const k of b.kind) if (!KINDS.includes(k)) errs.push(`${p}: unknown kind "${k}"`);
  if (!isObj(b.registries)) errs.push(`${p}: registries must be an object`);
  else {
    for (const [k, v] of Object.entries(b.registries)) {
      if (!REGISTRY_KEYS.includes(k)) errs.push(`${p}: unknown registry "${k}"`);
      else if (v !== null && !isRegistryYear(v)) errs.push(`${p}: registries.${k} must be a 4-digit year string or null`);
    }
  }
  if (!Array.isArray(b.sells) || !b.sells.every(isStr)) errs.push(`${p}: sells must be an array of strings`);
  if (b.optOut === undefined) errs.push(`${p}: optOut is required (use null if unknown)`);
  else errs.push(...validateOptOut(b.optOut, p, sourceIds));
  if (b.missions !== undefined && !(Array.isArray(b.missions) && b.missions.every(isStr))) errs.push(`${p}: missions must be an array of strings`);

  if (!isObj(b.size) || typeof b.size.known !== 'boolean' || !Array.isArray(b.size.signals)) errs.push(`${p}: size must be {known:boolean, signals:[]}`);
  else {
    if (!b.size.known && b.size.signals.length) errs.push(`${p}: size.known false must have empty signals`);
    for (const [i, s] of b.size.signals.entries()) {
      if (!isObj(s) || !isStr(s.kind) || !isStr(s.value)) errs.push(`${p}: size.signals[${i}] needs kind and value`);
      else if (!sourceIds.has(s.source)) errs.push(`${p}: size.signals[${i}] source "${s.source}" not in sources.json`);
    }
  }

  if (!Array.isArray(b.sources)) errs.push(`${p}: sources must be an array`);
  else {
    for (const s of b.sources) {
      const id = typeof s === 'string' ? s : s?.id;
      if (!sourceIds.has(id)) errs.push(`${p}: source "${id}" not in sources.json`);
    }
  }
  return errs;
}

// sourceKinds (optional Map id -> kind): when given, a published link must cite a TIER_A_SOURCE_KINDS source,
// and no link, published or not, may cite a member-list source.
export function validateLink(l, { brokerIds = new Set(), sourceIds = new Set(), sourceKinds } = {}) {
  if (!isObj(l)) return ['link: must be an object'];
  const p = `link ${l.from}->${l.to}`;
  const errs = [];
  if (!brokerIds.has(l.from)) errs.push(`${p}: unknown from broker "${l.from}"`);
  if (!brokerIds.has(l.to)) errs.push(`${p}: unknown to broker "${l.to}"`);
  if (l.from === l.to) errs.push(`${p}: a link cannot point from a record to itself`);
  if (!LINK_TYPES.includes(l.type)) errs.push(`${p}: type must be one of ${LINK_TYPES.join('|')}`);
  if (!TIERS.includes(l.tier)) errs.push(`${p}: tier must be one of ${TIERS.join('|')}`);
  if (!isStr(l.claim)) errs.push(`${p}: claim is required`);
  if (!Array.isArray(l.sources) || l.sources.length === 0) errs.push(`${p}: at least one source is required`);
  else for (const s of l.sources) if (!sourceIds.has(s)) errs.push(`${p}: source "${s}" not in sources.json`);
  if (l.published !== undefined && typeof l.published !== 'boolean') errs.push(`${p}: published must be boolean`);
  if (l.published === true && l.tier !== 'A') errs.push(`${p}: only tier A may be published`);
  if (l.published === true && sourceKinds && Array.isArray(l.sources) && !l.sources.some((s) => TIER_A_SOURCE_KINDS.includes(sourceKinds.get(s)))) {
    errs.push(`${p}: a published link must cite at least one tier-A source (${TIER_A_SOURCE_KINDS.join('|')})`);
  }
  if (sourceKinds && Array.isArray(l.sources) && l.sources.some((s) => sourceKinds.get(s) === MEMBER_LIST_KIND)) {
    errs.push(`${p}: a member-list source can't back a link`);
  }
  return errs;
}

// sweeps: build/sweeps.json, { <sweep id>: { name, source, members: [broker id] } }. sources: the sources.json object.
export function validateSweeps(sweeps, { brokerIds = new Set(), sources = {} } = {}) {
  if (!isObj(sweeps)) return ['sweeps: must be an object'];
  const errs = [];
  for (const [id, sw] of Object.entries(sweeps)) {
    const p = `sweep ${id}`;
    if (!SWEEP_IDS.includes(id)) errs.push(`${p}: unknown sweep id (expected ${SWEEP_IDS.join('|')})`);
    if (!isObj(sw)) { errs.push(`${p}: must be an object`); continue; }
    if (!isStr(sw.name)) errs.push(`${p}: name is required`);
    if (!isStr(sw.source) || !Object.hasOwn(sources, sw.source)) errs.push(`${p}: source "${sw.source}" not in sources.json`);
    else if (sources[sw.source]?.kind !== MEMBER_LIST_KIND) errs.push(`${p}: source "${sw.source}" must be a ${MEMBER_LIST_KIND} source, not ${sources[sw.source]?.kind}`);
    if (!Array.isArray(sw.members)) { errs.push(`${p}: members must be an array`); continue; }
    const seen = new Set();
    for (const m of sw.members) {
      if (seen.has(m)) errs.push(`${p}: duplicate member "${m}"`);
      seen.add(m);
      if (!brokerIds.has(m)) errs.push(`${p}: unknown member "${m}"`);
    }
  }
  return errs;
}

async function readJson(path, errors, fallback) {
  const { readFile } = await import('node:fs/promises');
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (e) {
    errors.push(`${path}: ${e.message}`);
    return fallback;
  }
}

// A missing file is null; an unreadable or invalid one is an error.
async function readOptionalJson(path, errors) {
  const { readFile } = await import('node:fs/promises');
  let text;
  try { text = await readFile(path, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; errors.push(`${path}: ${e.message}`); return null; }
  try { return JSON.parse(text); } catch (e) { errors.push(`${path}: ${e.message}`); return null; }
}

// Reads only brokers/*.json, links.json, sources.json and (if present) build/sweeps.json under `dir`; staging/ is never touched.
export async function validateDataset(dir) {
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const errors = [];

  const sources = await readJson(join(dir, 'sources.json'), errors, {});
  const links = await readJson(join(dir, 'links.json'), errors, []);
  const sourceIds = new Set();
  const sourceKinds = new Map();
  if (!isObj(sources)) errors.push('sources.json: must be an object');
  else for (const [id, s] of Object.entries(sources)) { sourceIds.add(id); sourceKinds.set(id, s?.kind); errors.push(...validateSource(id, s)); }
  if (!Array.isArray(links)) errors.push('links.json: must be an array');

  let files = [];
  try { files = (await readdir(join(dir, 'brokers'))).filter((f) => f.endsWith('.json')).sort(); }
  catch (e) { if (e.code !== 'ENOENT') errors.push(`brokers/: ${e.message}`); }

  const brokers = [];
  const seen = new Map();
  for (const f of files) {
    const b = await readJson(join(dir, 'brokers', f), errors, null);
    if (!b) continue;
    brokers.push(b);
    if (b.id !== f.slice(0, -5)) errors.push(`brokers/${f}: id "${b.id}" does not match filename`);
    if (seen.has(b.id)) errors.push(`duplicate broker id "${b.id}" (${seen.get(b.id)} and ${f})`);
    else seen.set(b.id, f);
    errors.push(...validateBroker(b, { sourceIds }));
  }
  const brokerIds = new Set(seen.keys());
  for (const b of brokers) {
    if (isStr(b.parent) && !brokerIds.has(b.parent)) errors.push(`broker ${b.id}: parent "${b.parent}" does not exist`);
  }
  const linkList = Array.isArray(links) ? links : [];
  const linkKeys = new Set();
  for (const l of linkList) {
    errors.push(...validateLink(l, { brokerIds, sourceIds, sourceKinds }));
    const k = `${l?.from}|${l?.to}|${l?.type}`;
    if (linkKeys.has(k)) errors.push(`link ${l?.from}->${l?.to}: duplicate (from, to, type) ${k}`);
    linkKeys.add(k);
  }

  const sweeps = await readOptionalJson(join(dir, 'build', 'sweeps.json'), errors);
  if (sweeps !== null) errors.push(...validateSweeps(sweeps, { brokerIds, sources: isObj(sources) ? sources : {} }));

  return {
    errors,
    counts: { brokers: brokers.length, links: linkList.length, published: linkList.filter((l) => l?.published === true).length, sources: sourceIds.size },
  };
}

// ---------------------------------------------------------------------------
// Curation config (build/*.json): the files a bounty contributor may edit. The same shape rules
// merge-staging.js enforces when it reads them, plus checks against the dataset they act on.
// cfg: { idMap, aliasBlocklist, linkOverrides, recordOverrides } (parsed JSON);
// ctx: { brokerIds: Set, sources: object, links: array, families: Set of staging family names }.

const LINK_OVERRIDE_KINDS = Object.freeze({
  drop: { need: ['from', 'to', 'type', 'reason'], optional: ['family'] },
  unpublish: { need: ['from', 'to', 'type', 'reason'], optional: [] },
  reassign: { need: ['from', 'to', 'type', 'newFrom', 'reason'], optional: [] },
  reclaim: { need: ['from', 'to', 'type', 'claim', 'reason'], optional: ['replaces'] },
});
const RECORD_OVERRIDE_FIELDS = Object.freeze(['name', 'parent', 'sells', 'kind', 'optOut', 'source', 'dropSources', 'replaces', 'reason']);
const REPLACEABLE = Object.freeze(['name', 'parent', 'sells', 'kind', 'optOut']);
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

export function validateIdMap(idMap, { brokerIds = new Set(), families = null } = {}) {
  const p = 'build/id-map.json';
  if (!isObj(idMap)) return [`${p}: must be an object of staging families`];
  const errs = [];
  for (const [family, map] of Object.entries(idMap)) {
    if (families && !families.has(family)) errs.push(`${p}: unknown staging family "${family}"`);
    if (!isObj(map)) { errs.push(`${p} ${family}: must be { stagedId: canonicalId | { id, reason } }`); continue; }
    for (const [staged, v] of Object.entries(map)) {
      const q = `${p} ${family}.${staged}`;
      let id = v;
      if (isObj(v)) {
        if (!isStr(v.id) || !isStr(v.reason)) errs.push(`${q}: an object entry needs id and reason`);
        for (const k of Object.keys(v)) if (k !== 'id' && k !== 'reason') errs.push(`${q}: unknown field "${k}"`);
        id = v.id;
      } else if (!isStr(v)) { errs.push(`${q}: must be a record id or { id, reason }`); continue; }
      if (isStr(id) && !brokerIds.has(id)) errs.push(`${q}: "${id}" is not a record in brokers/`);
    }
  }
  return errs;
}

export function validateAliasBlocklist(list, { brokerIds = new Set() } = {}) {
  const p = 'build/alias-blocklist.json';
  if (!isObj(list)) return [`${p}: must be { brokerId: [{ alias, reason }] }`];
  const errs = [];
  for (const [id, entries] of Object.entries(list)) {
    if (!brokerIds.has(id)) errs.push(`${p} ${id}: not a record in brokers/`);
    if (!Array.isArray(entries) || entries.length === 0) { errs.push(`${p} ${id}: must be a non-empty array of { alias, reason }`); continue; }
    for (const [i, x] of entries.entries()) {
      if (!isObj(x) || !isStr(x.alias) || !isStr(x.reason)) errs.push(`${p} ${id}[${i}]: needs alias and reason`);
      else for (const k of Object.keys(x)) if (k !== 'alias' && k !== 'reason') errs.push(`${p} ${id}[${i}]: unknown field "${k}"`);
    }
  }
  return errs;
}

export function validateLinkOverrides(ov, { brokerIds = new Set(), links = [], families = null } = {}) {
  const p = 'build/link-overrides.json';
  if (!isObj(ov)) return [`${p}: must be an object`];
  const errs = [];
  const finalKeys = new Set(links.map((l) => `${l?.from}|${l?.to}|${l?.type}`));
  for (const [kind, list] of Object.entries(ov)) {
    const rule = LINK_OVERRIDE_KINDS[kind];
    if (!rule) { errs.push(`${p}: unknown section "${kind}" (expected ${Object.keys(LINK_OVERRIDE_KINDS).join('|')})`); continue; }
    if (!Array.isArray(list)) { errs.push(`${p} ${kind}: must be an array`); continue; }
    const seen = new Set();
    for (const [i, o] of list.entries()) {
      const q = `${p} ${kind}[${i}]`;
      if (!isObj(o)) { errs.push(`${q}: must be an object`); continue; }
      for (const f of rule.need) if (!isStr(o[f])) errs.push(`${q}: ${f} is required`);
      for (const f of Object.keys(o)) if (!rule.need.includes(f) && !rule.optional.includes(f)) errs.push(`${q}: unknown field "${f}"`);
      if (isStr(o.type) && !LINK_TYPES.includes(o.type)) errs.push(`${q}: type must be one of ${LINK_TYPES.join('|')}`);
      if (o.family !== undefined && !(isStr(o.family) && (!families || families.has(o.family)))) errs.push(`${q}: family must be a staging family name`);
      if (o.replaces !== undefined && !isStr(o.replaces)) errs.push(`${q}: replaces must be the old claim string`);
      if (kind === 'reassign' && isStr(o.newFrom) && !brokerIds.has(o.newFrom)) errs.push(`${q}: newFrom "${o.newFrom}" is not a record in brokers/`);
      const key = `${o.from}|${o.to}|${o.type}`;
      if (seen.has(key)) errs.push(`${q}: duplicate ${kind} for ${key}`);
      seen.add(key);
      // unpublish and reclaim act on the final links (README "How to rebuild"); drop and reassign on staged ones.
      if ((kind === 'unpublish' || kind === 'reclaim') && !finalKeys.has(key)) errs.push(`${q}: no link ${key} in links.json`);
    }
  }
  return errs;
}

export function validateRecordOverrides(ov, { brokerIds = new Set(), sources = {} } = {}) {
  const p = 'build/record-overrides.json';
  if (!isObj(ov)) return [`${p}: must be { brokerId: { ...fields, reason } }`];
  const errs = [];
  const isSource = (id) => isStr(id) && Object.hasOwn(sources, id);
  for (const [id, o] of Object.entries(ov)) {
    const q = `${p} ${id}`;
    if (!brokerIds.has(id)) errs.push(`${q}: not a record in brokers/`);
    if (!isObj(o)) { errs.push(`${q}: must be an object`); continue; }
    for (const f of Object.keys(o)) if (!RECORD_OVERRIDE_FIELDS.includes(f)) errs.push(`${q}: unknown field "${f}"`);
    if (!isStr(o.reason)) errs.push(`${q}: reason is required`);
    if ('name' in o && !isStr(o.name)) errs.push(`${q}: name must be a string`);
    if ('parent' in o && o.parent !== null && !(isStr(o.parent) && brokerIds.has(o.parent))) errs.push(`${q}: parent must be a record id or null`);
    if ('sells' in o && !(Array.isArray(o.sells) && o.sells.every(isStr))) errs.push(`${q}: sells must be an array of strings`);
    if ('kind' in o && !(Array.isArray(o.kind) && o.kind.every((k) => KINDS.includes(k)))) errs.push(`${q}: kind must be an array of ${KINDS.join('|')}`);
    if ('optOut' in o) {
      if (!isObj(o.optOut)) errs.push(`${q}: optOut must be an object`);
      else for (const [f, v] of Object.entries(o.optOut)) {
        if (f !== 'email') errs.push(`${q}: optOut.${f} is not supported (only optOut.email)`);
        else if (!(isStr(v) && EMAIL.test(v))) errs.push(`${q}: optOut.email must be an email address`);
      }
    }
    if ('source' in o && !isSource(o.source)) errs.push(`${q}: source "${o.source}" not in sources.json`);
    if ('dropSources' in o && !(Array.isArray(o.dropSources) && o.dropSources.every(isStr))) errs.push(`${q}: dropSources must be an array of source ids`);
    if ('replaces' in o) {
      if (!isObj(o.replaces)) errs.push(`${q}: replaces must be an object`);
      else for (const f of Object.keys(o.replaces)) {
        if (!REPLACEABLE.includes(f)) errs.push(`${q}: replaces.${f} is not a replaceable field`);
        else if (!(f in o)) errs.push(`${q}: replaces.${f} without a new ${f}`);
      }
    }
  }
  return errs;
}

// The research records merge-staging.js reads (staging/<family>/): every source is a real,
// archived source; staged brokers and links cite sources that exist.
export async function validateStaging(dir, { mainSources = {} } = {}) {
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const errors = [];
  const families = [];
  let entries = [];
  try { entries = await readdir(join(dir, 'staging'), { withFileTypes: true }); }
  catch (e) { if (e.code !== 'ENOENT') errors.push(`staging/: ${e.message}`); }
  let counts = { sources: 0, brokers: 0, links: 0 };
  for (const ent of entries.filter((x) => x.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const family = ent.name;
    families.push(family);
    const base = join(dir, 'staging', family);
    const pfx = (e) => `staging/${family}/${e}`;
    const sources = (await readOptionalJson(join(base, 'sources.json'), errors)) ?? {};
    if (!isObj(sources)) { errors.push(pfx('sources.json: must be an object')); continue; }
    for (const [id, s] of Object.entries(sources)) errors.push(...validateSource(id, s).map(pfx));
    counts.sources += Object.keys(sources).length;
    const known = (id) => Object.hasOwn(sources, id) || Object.hasOwn(mainSources, id);
    let files = [];
    try { files = (await readdir(join(base, 'brokers'))).filter((f) => f.endsWith('.json')).sort(); }
    catch (e) { if (e.code !== 'ENOENT') errors.push(pfx(`brokers/: ${e.message}`)); }
    for (const f of files) {
      const b = await readJson(join(base, 'brokers', f), errors, null);
      if (!isObj(b)) continue;
      counts.brokers += 1;
      if (b.id !== f.slice(0, -5)) errors.push(pfx(`brokers/${f}: id "${b.id}" does not match filename`));
      if (!isStr(b.name)) errors.push(pfx(`brokers/${f}: name is required`));
      for (const s of Array.isArray(b.sources) ? b.sources : []) {
        const id = typeof s === 'string' ? s : s?.id;
        if (!known(id)) errors.push(pfx(`brokers/${f}: source "${id}" is in neither this family's sources.json nor sources.json`));
      }
      if (!Array.isArray(b.sources) || b.sources.length === 0) errors.push(pfx(`brokers/${f}: at least one source is required`));
    }
    const links = (await readOptionalJson(join(base, 'links.json'), errors)) ?? [];
    if (!Array.isArray(links)) { errors.push(pfx('links.json: must be an array')); continue; }
    counts.links += links.length;
    for (const [i, l] of links.entries()) {
      const q = pfx(`links.json[${i}] ${l?.from}->${l?.to}`);
      if (!isObj(l) || !isStr(l.from) || !isStr(l.to)) { errors.push(`${q}: needs from and to`); continue; }
      if (!LINK_TYPES.includes(l.type)) errors.push(`${q}: type must be one of ${LINK_TYPES.join('|')}`);
      if (!TIERS.includes(l.tier)) errors.push(`${q}: tier must be one of ${TIERS.join('|')}`);
      if (!isStr(l.claim)) errors.push(`${q}: claim is required`);
      if (!Array.isArray(l.sources) || l.sources.length === 0) errors.push(`${q}: at least one source is required`);
      else for (const s of l.sources) if (!known(s)) errors.push(`${q}: source "${s}" is in neither this family's sources.json nor sources.json`);
    }
  }
  return { errors, families: new Set(families), counts };
}

// Everything `npm run brokers:validate` checks: the dataset (brokers/, links.json, sources.json,
// build/sweeps.json), the research records in staging/, and the curation config in build/.
export async function validateAll(dir) {
  const { join } = await import('node:path');
  const dataset = await validateDataset(dir);
  const errors = [...dataset.errors];
  const sources = (await readOptionalJson(join(dir, 'sources.json'), [])) ?? {};
  const links = (await readOptionalJson(join(dir, 'links.json'), [])) ?? [];
  const { readdir } = await import('node:fs/promises');
  let brokerFiles = [];
  try { brokerFiles = (await readdir(join(dir, 'brokers'))).filter((f) => f.endsWith('.json')); } catch { /* reported by validateDataset */ }
  const brokerIds = new Set(brokerFiles.map((f) => f.slice(0, -5)));
  const staging = await validateStaging(dir, { mainSources: isObj(sources) ? sources : {} });
  errors.push(...staging.errors);
  const families = staging.families.size ? staging.families : null;
  const cfg = async (f) => readOptionalJson(join(dir, 'build', f), errors);
  const ctx = { brokerIds, sources: isObj(sources) ? sources : {}, links: Array.isArray(links) ? links : [], families };
  const config = {
    'id-map.json': [await cfg('id-map.json'), validateIdMap],
    'alias-blocklist.json': [await cfg('alias-blocklist.json'), validateAliasBlocklist],
    'link-overrides.json': [await cfg('link-overrides.json'), validateLinkOverrides],
    'record-overrides.json': [await cfg('record-overrides.json'), validateRecordOverrides],
  };
  let configFiles = 0;
  for (const [, [value, check]] of Object.entries(config)) {
    if (value === null) continue;
    configFiles += 1;
    errors.push(...check(value, ctx));
  }
  return { errors, counts: { ...dataset.counts, stagingSources: staging.counts.sources, stagingBrokers: staging.counts.brokers, stagingLinks: staging.counts.links, configFiles } };
}
