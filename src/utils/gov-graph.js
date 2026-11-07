// The government data map's graph (Liz, 2026-10-29: "make the government not a nebulous they"):
// where data comes from → the pipes that take it → the agencies that get it → who checks.
// Pure: built from src/data/leaks (entries, AGENCIES, CHANNELS, AUTHORITIES). Nothing here is tracked.

// The places data leaves from, in the player's own terms.
export const ORIGINS = Object.freeze([
  { id: 'o-accounts', label: 'Your accounts', note: 'Email, cloud, social, the AI assistants' },
  { id: 'o-cables', label: "The internet's cables", note: 'Everything that crosses them' },
  { id: 'o-apps', label: 'Your apps', note: 'Weather, games, fitness: their location data is sold' },
  { id: 'o-devices', label: 'Your devices', note: 'Phones, TVs, routers, cars, cameras' },
  { id: 'o-carrier', label: 'Your phone carrier', note: 'Call records and where your phone is' },
]);

// The pipes, each a kind of collection. Every leak entry names its own (`pipe` in src/data/leaks).
export const PIPES = Object.freeze([
  { id: 'p-orders', label: 'Orders to companies', note: 'PRISM / downstream, court and agency orders', origins: ['o-accounts'] },
  { id: 'p-cables', label: 'Cable taps', note: 'Upstream, XKeyscore, MUSCULAR, Tempora', origins: ['o-cables', 'o-accounts'] },
  { id: 'p-hacking', label: 'Hacking tools', note: 'Vault 7, the NSA and GCHQ phone teams', origins: ['o-devices'] },
  { id: 'p-buying', label: 'Buying your data', note: 'Location and data brokers: a purchase, no warrant', origins: ['o-apps', 'o-devices'] },
  { id: 'p-phone', label: 'Phone records', note: 'Carrier call records and location', origins: ['o-carrier'] },
  { id: 'p-police', label: 'Police tech', note: 'Doorbell cameras, cell-site simulators, plate readers', origins: ['o-devices', 'o-carrier'] },
  { id: 'p-kept', label: 'Kept by the company', note: 'Ring staff watched customers\' videos, Tesla staff shared car-camera images, Amazon kept Alexa recordings for years', origins: ['o-devices'] },
]);
const PIPE_IDS = new Set(PIPES.map((p) => p.id));

// The entry's pipe, as its data names it; null for none (not drawn, never guessed).
export function pipeOf(entry) {
  return PIPE_IDS.has(entry?.pipe) ? entry.pipe : null;
}

// Agency rows, by kind, so the map reads as groups rather than a crowd.
export const AGENCY_ROWS = Object.freeze([
  { id: 'r-intel', label: 'Intelligence', kinds: ['intelligence', 'foreign'] },
  { id: 'r-federal', label: 'Federal law enforcement', kinds: ['law-enforcement'] },
  { id: 'r-border', label: 'Immigration and the military', kinds: ['immigration', 'military'] },
  { id: 'r-local', label: 'Your local police', kinds: ['local'] },
]);

const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// { origins, pipes, rows: [{ ...row, agencies }], oversight, edges, entriesByPipe }.
// edges: { from, to, kind: 'feeds'|'takes'|'shares'|'checks', refs: [entry or channel ids] }.
export function buildGovGraph({ entries = [], agencies = [], channels = [] } = {}) {
  const known = new Map(agencies.map((a) => [a.id, a]));
  const oversight = agencies.filter((a) => a.kind === 'oversight');
  const rows = AGENCY_ROWS.map((r) => ({ ...r, agencies: agencies.filter((a) => r.kinds.includes(a.kind)) }));
  const edges = new Map();
  const edge = (from, to, kind, ref) => {
    if (!from || !to || from === to) return;
    const key = `${from}>${to}>${kind}`;
    const e = edges.get(key) ?? { from, to, kind, refs: [] };
    if (ref && !e.refs.includes(ref)) e.refs.push(ref);
    edges.set(key, e);
  };
  for (const p of PIPES) for (const o of p.origins) edge(o, p.id, 'feeds');
  const entriesByPipe = Object.fromEntries(PIPES.map((p) => [p.id, []]));
  for (const e of entries) {
    const pipe = pipeOf(e);
    if (!pipe) continue;
    entriesByPipe[pipe].push(e);
    for (const to of arr(e.flow?.to)) if (known.has(to)) edge(pipe, to, 'takes', e.id);
    for (const to of arr(e.flow?.sharedWith)) if (known.has(to) && known.get(to).kind !== 'oversight') edge(arr(e.flow?.to)[0], to, 'shares', e.id);
    // Who checks: an oversight body named in the entry's checkedBy text (the FISA Court, the PCLOB, Congress).
    const checked = String(e.flow?.checkedBy ?? '');
    for (const o of oversight) {
      const names = [o.name, o.short].filter(Boolean);
      if (names.some((n) => checked.includes(n))) edge(o.id, pipe, 'checks', e.id);
    }
  }
  // Channels that start outside government come in through the pipe they use.
  const VIA = { COMPANIES: 'p-orders', DATA_BROKERS: 'p-buying' };
  for (const c of channels) {
    if (Object.hasOwn(VIA, c.from) && known.has(c.to)) edge(VIA[c.from], c.to, 'takes', c.id);
    else if (known.has(c.from) && known.has(c.to)) edge(c.from, c.to, known.get(c.from).kind === 'oversight' ? 'checks' : 'shares', c.id);
  }
  return { origins: ORIGINS, pipes: PIPES, rows, oversight, edges: [...edges.values()], entriesByPipe };
}
