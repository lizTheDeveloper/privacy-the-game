// Scout's voice for "Read it to me" (Liz 2026-11-17: "get Scout to read everything to you").
//
// Each line the game can read has an id: a hash of its spoken text. The game asks its own
// server for api/voice/<id>.mp3. The server only voices lines on its list, which is built from
// the game's own words (scripts/voice-lines.mjs → collective/voice-lines.json), so nothing a
// player typed or chose is ever sent to the voice service. Any line not on the list is read by
// the browser's own voice instead.

import { plainText } from './readability.js';

// What is spoken: the words without markup, "→" and " > " said as ", then", spaces tidied.
export function voiceText(text) {
  return plainText(String(text ?? '')).replace(/\s*(→|›|\s>)\s*/g, ', then ').replace(/\s+/g, ' ').trim();
}

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK = (1n << 64n) - 1n;

// 64-bit FNV-1a over the UTF-8 bytes of the spoken text, as 16 hex digits.
export function voiceId(text) {
  let h = FNV_OFFSET;
  for (const b of new TextEncoder().encode(voiceText(text))) {
    h ^= BigInt(b);
    h = (h * FNV_PRIME) & MASK;
  }
  return h.toString(16).padStart(16, '0');
}

export const voiceUrl = (text) => `api/voice/${voiceId(text)}.mp3`;
