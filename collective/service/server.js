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
  const server = http.createServer((req, res) => {
    handle(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, { error: 'internal' });
      else res.end();
    });
  });
  server.on('clientError', (err, socket) => {
    if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    else socket.destroy();
  });
  return server;

  async function handle(req, res) {
    const origin = req.headers.origin;
    const cors = ALLOWED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : { Vary: 'Origin' };
    if (req.method === 'OPTIONS') return send(res, 204, '', { ...cors, 'Access-Control-Allow-Methods': 'GET' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' }, cors);
    let url;
    try {
      url = new URL(req.url, 'http://local');
    } catch {
      return send(res, 400, { error: 'bad request' }, cors);
    }

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
      const screen = (url.searchParams.get('screen') || '').slice(0, 32) || undefined;
      const info = getClientInfo((req.headers['user-agent'] || '').slice(0, 512), screen);
      let pod = null;
      try {
        const p = podForGeo(JSON.parse(await readCollective()).pods, geo);
        if (p) pod = { id: p.id, label: p.label };
      } catch { /* no published pods tonight: pod stays null */ }
      const language = (url.searchParams.get('lang') || '').slice(0, 35) || null;
      return send(res, 200, { ...NO_GEO, ...geo, ...info, language, pod }, { ...cors, 'Cache-Control': 'no-store' });
    }

    return send(res, 404, { error: 'not found' }, cors);
  }
}

// A stray rejection must not take the process down; log nothing (request data is private).
process.on('unhandledRejection', () => {});

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(Number(process.env.PORT || 8080));
}
