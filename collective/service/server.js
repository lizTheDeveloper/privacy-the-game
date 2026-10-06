import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { podForGeo } from './pods.js';
import { lookupGeo as defaultLookupGeo, getClientInfo } from './client-info.js';

const ALLOWED_ORIGINS = new Set([
  'https://multiversestudios.xyz', 'https://multiversegames.ai',
  'https://play.multiversegames.ai', 'https://play.multiversestudios.xyz',
]);
const COLLECTIVE_FILE = process.env.COLLECTIVE_FILE || '/data/collective.json';
const NO_GEO = { country: null, region: null, city: null };

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

// lookupGeo receives the request's raw headers and returns {country, region, city}.
export function createServer({
  readCollective = () => readFile(COLLECTIVE_FILE, 'utf8'),
  lookupGeo = defaultLookupGeo,
} = {}) {
  // No logging anywhere in this handler: whoami answers are about a person.
  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const cors = ALLOWED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : { Vary: 'Origin' };
    if (req.method === 'OPTIONS') return send(res, 204, '', { ...cors, 'Access-Control-Allow-Methods': 'GET' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' }, cors);
    const url = new URL(req.url, 'http://local');

    if (url.pathname === '/collective.json') {
      try {
        const text = await readCollective();
        JSON.parse(text);
        return send(res, 200, text, { ...cors, 'Cache-Control': 'public, max-age=3600' });
      } catch {
        return send(res, 503, { error: 'unavailable' }, { ...cors, 'Cache-Control': 'no-store' });
      }
    }

    if (url.pathname === '/whoami') {
      const geo = await (async () => lookupGeo(req.headers))().catch(() => NO_GEO);
      const screen = (url.searchParams.get('screen') || '').slice(0, 16) || undefined;
      const info = getClientInfo(req.headers['user-agent'] || '', screen);
      let pod = null;
      try {
        const p = podForGeo(JSON.parse(await readCollective()).pods, geo);
        if (p) pod = { id: p.id, label: p.label };
      } catch { /* no published pods tonight: pod stays null */ }
      const language = (url.searchParams.get('lang') || '').slice(0, 35) || null;
      return send(res, 200, { ...NO_GEO, ...geo, ...info, language, pod }, { ...cors, 'Cache-Control': 'no-store' });
    }

    return send(res, 404, { error: 'not found' }, cors);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(Number(process.env.PORT || 8080));
}
