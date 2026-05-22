import * as os from 'node:os';
import * as path from 'node:path';
import { promises as fsp } from 'node:fs';

/**
 * Resolve a set of candidate paths (supports `~/` prefix) against the user's
 * home directory and return the first one that exists.
 */
export async function findExistingAuthFile(candidates: string[]): Promise<string | null> {
  const home = os.homedir();
  for (const raw of candidates) {
    const abs = raw.startsWith('~')
      ? path.join(home, raw.slice(raw.startsWith('~/') ? 2 : 1))
      : raw;
    try {
      const st = await fsp.stat(abs);
      if (st.isFile()) return abs;
    } catch {
      // keep looking
    }
  }
  return null;
}

export type AuthMethod = 'api_key' | 'oauth' | 'config_file';

export interface AuthIdentityInfo {
  filePath: string;
  identity: string;
  method: AuthMethod;
  hasRefreshToken?: boolean;
  expiresAt?: number;
}

const DEFAULT_TOKEN_KEYS = [
  'apiKey',
  'api_key',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'token',
  'accessToken',
  'access_token',
];

/**
 * Best-effort decode of a JWT payload (no signature verification). Returns
 * the parsed payload object, or null if the input doesn't look like a JWT.
 */
export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    const payloadB64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

/**
 * Inspect a parsed auth-config object and return a best-effort identity +
 * method. Recognized shapes:
 *
 *  - Top-level api key: `{ apiKey | OPENAI_API_KEY | … }`
 *  - OAuth nested:      `{ tokens: { access_token, refresh_token, id_token, … } }`
 *  - OAuth flat:        `{ access_token, refresh_token, id_token, expiry_date }`
 *  - Email present:     `{ email: "you@…" }` or JWT id_token containing email
 */
export function parseAuthConfig(
  parsed: unknown,
  tokenKeys: string[] = DEFAULT_TOKEN_KEYS,
): { identity: string | null; method: AuthMethod; hasRefreshToken: boolean; expiresAt?: number } {
  if (!parsed || typeof parsed !== 'object') {
    return { identity: null, method: 'config_file', hasRefreshToken: false };
  }
  const obj = parsed as Record<string, unknown>;
  const nestedTokens = (obj['tokens'] && typeof obj['tokens'] === 'object')
    ? (obj['tokens'] as Record<string, unknown>)
    : null;

  const idToken = pickString(nestedTokens, 'id_token') ?? pickString(obj, 'id_token');
  const accessToken = pickString(nestedTokens, 'access_token') ?? pickString(obj, 'access_token');
  const refreshToken = pickString(nestedTokens, 'refresh_token') ?? pickString(obj, 'refresh_token');
  const expiryDate = (() => {
    const v = obj['expiry_date'] ?? obj['expiresAt'] ?? obj['expires_at'];
    return typeof v === 'number' ? v : undefined;
  })();

  let identity: string | null = null;

  if (idToken) {
    const payload = decodeJwtPayload(idToken);
    const email = payload && typeof payload['email'] === 'string' ? (payload['email'] as string) : null;
    const sub = payload && typeof payload['sub'] === 'string' ? (payload['sub'] as string) : null;
    if (email) identity = email;
    else if (sub) identity = `sub:${sub.slice(0, 8)}`;
  }

  if (!identity && typeof obj['email'] === 'string') {
    identity = obj['email'] as string;
  }

  if (refreshToken || accessToken || idToken) {
    if (!identity && accessToken && accessToken.length > 4) {
      identity = `oauth:...${accessToken.slice(-4)}`;
    }
    return {
      identity,
      method: 'oauth',
      hasRefreshToken: Boolean(refreshToken),
      ...(expiryDate !== undefined ? { expiresAt: expiryDate } : {}),
    };
  }

  for (const k of tokenKeys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 4) {
      return { identity: identity ?? `...${v.slice(-4)}`, method: 'api_key', hasRefreshToken: false };
    }
  }

  return { identity, method: 'config_file', hasRefreshToken: false };
}

/**
 * Read an agent auth config file (if present) and attempt to extract a
 * recognizable identity. Returns null if no candidate exists.
 */
export async function readAuthConfigIdentity(
  candidates: string[],
  tokenKeys?: string[],
): Promise<AuthIdentityInfo | null> {
  const filePath = await findExistingAuthFile(candidates);
  if (!filePath) return null;
  let identity = path.basename(filePath);
  let method: AuthMethod = 'config_file';
  let hasRefreshToken = false;
  let expiresAt: number | undefined;
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const info = parseAuthConfig(parsed, tokenKeys);
    if (info.identity) identity = info.identity;
    method = info.method;
    hasRefreshToken = info.hasRefreshToken;
    if (info.expiresAt !== undefined) expiresAt = info.expiresAt;
  } catch {
    // opaque file; keep the basename identity
  }
  return {
    filePath,
    identity,
    method,
    hasRefreshToken,
    ...(expiresAt !== undefined ? { expiresAt } : {}),
  };
}

/**
 * Probe the OS keychain (via optional `keytar`) for a credential. Returns
 * null when keytar is not installed, the lookup fails, or no entry exists.
 * Never throws — keytar is treated as a soft optional dependency.
 */
export async function tryKeychainLookup(
  service: string,
  account: string,
): Promise<string | null> {
  try {
    const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
    const mod = (await dynamicImport('keytar').catch(() => null)) as
      | { getPassword?: (s: string, a: string) => Promise<string | null> }
      | null;
    if (!mod || typeof mod.getPassword !== 'function') return null;
    const v = await mod.getPassword(service, account);
    return v ?? null;
  } catch {
    return null;
  }
}
