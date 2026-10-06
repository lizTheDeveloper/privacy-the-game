// Port of Umami v3.1.0 (commit c78ff36db0c82e13c86e5073020472c6546313a3):
//   src/lib/detect.ts  (getDevice, getRegionCode, decodeHeader, getLocation, getClientInfo)
//   src/lib/ip.ts      (IP_ADDRESS_HEADERS, normalizeIp, resolveIp, getIpAddress, stripPort)
//   src/lib/url.ts     (safeDecodeURIComponent)
// Branch order and constants are kept as Umami has them so /whoami agrees with what Umami records.
// Deviations: CLOUD_MODE and CLIENT_IP_HEADER knobs are not ported (not set on our Umami);
// SKIP_LOCATION_HEADERS is honoured; nothing here logs.
import { statSync } from 'node:fs';
import net from 'node:net';
import maxmind from 'maxmind';
import ipaddr from 'ipaddr.js';
import { UAParser } from 'ua-parser-js';
import { browserName, detectOS } from 'detect-browser';

const GEO_PATH = process.env.GEO_PATH || '/geo/GeoLite2-City.mmdb';
let reader = null;
let readerMtime = 0;

// Reopen when the nightly job swaps in a new copy of Umami's database.
async function geoReader() {
  const mtime = statSync(GEO_PATH).mtimeMs;
  if (!reader || mtime !== readerMtime) {
    reader = await maxmind.open(GEO_PATH);
    readerMtime = mtime;
  }
  return reader;
}

const IP_ADDRESS_HEADERS = [
  'true-client-ip', // CDN
  'cf-connecting-ip', // Cloudflare
  'fastly-client-ip', // Fastly
  'x-nf-client-connection-ip', // Netlify
  'do-connecting-ip', // Digital Ocean
  'x-real-ip', // Reverse proxy
  'x-appengine-user-ip', // Google App Engine
  'x-forwarded-for',
  'forwarded',
  'x-client-ip',
  'x-cluster-client-ip',
  'x-forwarded',
];

const PROVIDER_HEADERS = [
  { countryHeader: 'cf-ipcountry', regionHeader: 'cf-region-code', cityHeader: 'cf-ipcity' },
  { countryHeader: 'x-vercel-ip-country', regionHeader: 'x-vercel-ip-country-region', cityHeader: 'x-vercel-ip-city' },
  { countryHeader: 'cloudfront-viewer-country', regionHeader: 'cloudfront-viewer-country-region', cityHeader: 'cloudfront-viewer-city' },
  { countryHeader: 'eo-ipcountry', regionHeader: 'eo-region-code', cityHeader: 'eo-ipcity' },
];

const MAX_HEADER = 256;

// Loopback, private, link-local and unspecified ranges: no geography to report.
// Pure check, no DNS (replaces is-localhost-ip, which resolves hostnames).
const LOCAL = new net.BlockList();
for (const [a, p] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16]]) LOCAL.addSubnet(a, p, 'ipv4');
for (const [a, p] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10]]) LOCAL.addSubnet(a, p, 'ipv6');
function isLocalIp(ip) {
  return LOCAL.check(ip, net.isIPv6(ip) ? 'ipv6' : 'ipv4');
}

// Node's req.headers is a plain object; Umami reads a Headers instance.
export function toHeaders(raw = {}) {
  const h = new Headers();
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    try { h.set(k, (Array.isArray(v) ? v.join(', ') : String(v)).slice(0, MAX_HEADER)); } catch { /* invalid header value: skip */ }
  }
  return h;
}

function normalizeIp(ip) {
  if (!ip) return ip;
  try {
    const parsed = ipaddr.parse(ip);
    if (parsed.kind() === 'ipv6' && parsed.isIPv4MappedAddress()) return parsed.toIPv4Address().toString();
    return parsed.toString();
  } catch {
    return ip;
  }
}

export function stripPort(ip) {
  if (!ip) return ip;
  if (ip.startsWith('[')) {
    const endBracket = ip.indexOf(']');
    if (endBracket !== -1) return ip.slice(0, endBracket + 1);
  }
  const idx = ip.lastIndexOf(':');
  if (idx !== -1) {
    if (ip.includes('.') || /^[a-zA-Z0-9.-]+$/.test(ip.slice(0, idx))) return ip.slice(0, idx);
  }
  return ip;
}

function resolveIp(ip) {
  if (!ip) return ip;
  const normalized = normalizeIp(ip);
  try {
    ipaddr.parse(normalized);
    return normalized;
  } catch {
    const stripped = stripPort(ip);
    if (stripped !== ip) return normalizeIp(stripped);
    return normalized;
  }
}

export function getIpAddress(headers) {
  const name = IP_ADDRESS_HEADERS.find((n) => headers.get(n));
  if (!name) return undefined;
  const ip = headers.get(name);
  if (name === 'x-forwarded-for') return resolveIp(ip?.split(',')?.[0]?.trim());
  if (name === 'forwarded') {
    const match = ip.match(/for=(\[?[0-9a-fA-F:.]+]?)/);
    if (match) return resolveIp(match[1]);
  }
  return resolveIp(ip);
}

function safeDecodeURIComponent(s) {
  if (s === undefined || s === null) return s;
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function getRegionCode(country, region) {
  if (!country || !region) return undefined;
  return region.includes('-') ? region : `${country}-${region}`;
}

function decodeHeader(s) {
  if (s === undefined || s === null) return s;
  return Buffer.from(s, 'latin1').toString('utf-8');
}

async function getLocation(ip = '', headers, openReader) {
  // Client-controlled header: anything that is not a literal IP is unknown. Never resolve names.
  const literal = stripPort(ip);
  if (!ip || net.isIP(literal) === 0 || isLocalIp(literal)) return null;

  if (!process.env.SKIP_LOCATION_HEADERS) {
    for (const provider of PROVIDER_HEADERS) {
      const countryHeader = headers.get(provider.countryHeader);
      if (countryHeader) {
        const country = decodeHeader(countryHeader);
        const region = decodeHeader(headers.get(provider.regionHeader));
        const city = decodeHeader(headers.get(provider.cityHeader));
        return { country, region: getRegionCode(country, region), city };
      }
    }
  }

  const result = (await openReader()).get(stripPort(ip));
  if (result) {
    const country = result.country?.iso_code ?? result?.registered_country?.iso_code;
    const region = result.subdivisions?.[0]?.iso_code;
    const city = result.city?.names?.en;
    return { country, region: getRegionCode(country, region), city };
  }
  return null;
}

// Umami stores '' / NULL for unknown; /whoami reports null.
export async function resolveLocation(ip, headers, openReader = geoReader) {
  const loc = await getLocation(ip, headers, openReader);
  const clean = (v) => safeDecodeURIComponent(v) || null;
  return { country: clean(loc?.country), region: clean(loc?.region), city: clean(loc?.city) };
}

export function lookupGeo(rawHeaders) {
  const headers = toHeaders(rawHeaders);
  return resolveLocation(getIpAddress(headers), headers);
}

function getDevice(userAgent, screen = '') {
  const { device } = UAParser(userAgent);
  const [width] = screen.split('x');
  const type = device?.type || 'desktop';
  if (type === 'desktop' && screen && +width <= 1920) return 'laptop';
  return type;
}

export function getClientInfo(userAgent, screen) {
  userAgent = String(userAgent || '').slice(0, 512);
  screen = screen === undefined ? undefined : String(screen).slice(0, 32);
  return {
    browser: browserName(userAgent) || null,
    os: detectOS(userAgent) || null,
    device: getDevice(userAgent, screen) || null,
  };
}
