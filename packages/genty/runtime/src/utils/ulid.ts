/**
 * Minimal monotonic ULID generator for genty-runtime.
 *
 * Uses crypto.randomUUID() as an entropy source and embeds a millisecond
 * timestamp prefix to keep IDs roughly sortable.  This is intentionally
 * simpler than the `ulid` npm package because genty only needs unique,
 * time-ordered identifiers for background-task tracking -- it does not
 * need Crockford base-32 encoding or strict ULID spec compliance.
 */

import { randomUUID } from "node:crypto";

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base-32
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;

function encodeTime(now: number, len: number): string {
  let result = "";
  let remaining = now;
  for (let i = len; i > 0; i--) {
    const mod = remaining % ENCODING_LEN;
    result = ENCODING[mod] + result;
    remaining = (remaining - mod) / ENCODING_LEN;
  }
  return result;
}

function encodeRandom(len: number): string {
  const uuid = randomUUID().replace(/-/g, "");
  let result = "";
  for (let i = 0; i < len; i++) {
    const byte = parseInt(uuid.substring(i * 2, i * 2 + 2) || "0", 16);
    result += ENCODING[byte % ENCODING_LEN];
  }
  return result;
}

let lastTime = 0;
let lastRandom = "";

export function nextUlid(): string {
  const now = Date.now();
  const timePart = encodeTime(now, TIME_LEN);
  if (now === lastTime) {
    // Same millisecond: increment the random part to stay monotonic
    lastRandom = incrementBase32(lastRandom);
  } else {
    lastTime = now;
    lastRandom = encodeRandom(16);
  }
  return timePart + lastRandom;
}

function incrementBase32(s: string): string {
  const chars = s.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    const idx = ENCODING.indexOf(chars[i]);
    if (idx < ENCODING_LEN - 1) {
      chars[i] = ENCODING[idx + 1];
      return chars.join("");
    }
    chars[i] = ENCODING[0];
  }
  return chars.join("");
}
