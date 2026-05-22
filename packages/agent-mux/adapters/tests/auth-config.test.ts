import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  decodeJwtPayload,
  parseAuthConfig,
  readAuthConfigIdentity,
  tryKeychainLookup,
} from '../src/auth-config.js';

let tmp: string;

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-auth-'));
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT payload', () => {
    const t = makeJwt({ email: 'me@example.com', sub: 'abc' });
    const p = decodeJwtPayload(t);
    expect(p?.email).toBe('me@example.com');
  });
  it('returns null on garbage', () => {
    expect(decodeJwtPayload('not.a.jwt')).toBeNull();
    expect(decodeJwtPayload('only-one-part')).toBeNull();
  });
});

describe('parseAuthConfig', () => {
  it('detects api_key from top-level key', () => {
    const r = parseAuthConfig({ OPENAI_API_KEY: 'sk-abc1234' });
    expect(r.method).toBe('api_key');
    expect(r.identity).toContain('1234');
  });

  it('detects oauth from nested tokens with refresh_token', () => {
    const r = parseAuthConfig({
      tokens: { access_token: 'aaaaXYZ9', refresh_token: 'r0', id_token: makeJwt({ email: 'u@a.b' }) },
    });
    expect(r.method).toBe('oauth');
    expect(r.hasRefreshToken).toBe(true);
    expect(r.identity).toBe('u@a.b');
  });

  it('detects oauth from flat shape and surfaces expiry', () => {
    const r = parseAuthConfig({ access_token: 'aaaa1234', refresh_token: 'r', expiry_date: 1700000000 });
    expect(r.method).toBe('oauth');
    expect(r.hasRefreshToken).toBe(true);
    expect(r.expiresAt).toBe(1700000000);
  });

  it('falls back to last-4 oauth identity when no email', () => {
    const r = parseAuthConfig({ access_token: 'aaaa9876', refresh_token: 'r' });
    expect(r.identity).toContain('9876');
  });

  it('returns config_file when nothing recognized', () => {
    const r = parseAuthConfig({ misc: 'data' });
    expect(r.method).toBe('config_file');
    expect(r.identity).toBeNull();
  });

  it('handles non-object input safely', () => {
    expect(parseAuthConfig(null).method).toBe('config_file');
    expect(parseAuthConfig('str' as unknown).method).toBe('config_file');
  });
});

describe('readAuthConfigIdentity', () => {
  it('returns null when no candidate exists', async () => {
    const r = await readAuthConfigIdentity([path.join(tmp, 'missing.json')]);
    expect(r).toBeNull();
  });

  it('reads OAuth config and surfaces method/refresh', async () => {
    const f = path.join(tmp, 'auth.json');
    fs.writeFileSync(
      f,
      JSON.stringify({
        tokens: { access_token: 'abcd1234', refresh_token: 'r', id_token: makeJwt({ email: 'x@y.z' }) },
      }),
    );
    const r = await readAuthConfigIdentity([f]);
    expect(r?.method).toBe('oauth');
    expect(r?.hasRefreshToken).toBe(true);
    expect(r?.identity).toBe('x@y.z');
  });

  it('keeps basename identity when JSON is malformed', async () => {
    const f = path.join(tmp, 'broken.json');
    fs.writeFileSync(f, '{not json');
    const r = await readAuthConfigIdentity([f]);
    expect(r?.identity).toBe('broken.json');
    expect(r?.method).toBe('config_file');
  });
});

describe('tryKeychainLookup', () => {
  it('returns null when keytar is not installed', async () => {
    const v = await tryKeychainLookup('definitely-not-a-real-service', 'noone');
    expect(v).toBeNull();
  });
});
