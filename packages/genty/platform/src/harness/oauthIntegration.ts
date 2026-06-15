/**
 * GAP-SEC-006: OAuth Integration.
 *
 * Provides types and pure helpers for constructing OAuth 2.0 authorization
 * flows with PKCE support. Actual HTTP transport is injectable via fetch.
 */

import { createHash, randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OAuthConfig {
  /** OAuth client ID. */
  clientId: string;
  /** Authorization endpoint URL. */
  authorizationUrl: string;
  /** Token endpoint URL. */
  tokenUrl: string;
  /** Requested scopes. */
  scopes: string[];
  /** Redirect URI for the authorization callback. */
  redirectUri: string;
}

export interface OAuthTokenSet {
  /** The access token. */
  accessToken: string;
  /** Optional refresh token. */
  refreshToken?: string;
  /** Expiry time as epoch milliseconds. */
  expiresAt: number;
  /** Scopes granted. */
  scopes: string[];
}

export interface PkceChallenge {
  /** The code verifier (random string). */
  codeVerifier: string;
  /** The code challenge (S256 hash of verifier). */
  codeChallenge: string;
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

/**
 * Generate a PKCE code verifier and challenge pair.
 */
export function generatePkceChallenge(): PkceChallenge {
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Build the full authorization URL with PKCE challenge and state parameter.
 */
export function buildAuthorizationUrl(config: OAuthConfig, state: string): {
  url: string;
  pkce: PkceChallenge;
} {
  const pkce = generatePkceChallenge();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    code_challenge: pkce.codeChallenge,
    code_challenge_method: 'S256',
  });

  const separator = config.authorizationUrl.includes('?') ? '&' : '?';
  const url = `${config.authorizationUrl}${separator}${params.toString()}`;

  return { url, pkce };
}

/**
 * Exchange an authorization code for a token set.
 * Uses an injectable fetch function for testability.
 */
export async function exchangeCode(
  config: OAuthConfig,
  code: string,
  codeVerifier: string,
  fetchFn: typeof globalThis.fetch = globalThis.fetch,
): Promise<OAuthTokenSet> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  const response = await fetchFn(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    expiresAt: Date.now() + expiresIn * 1000,
    scopes: typeof data.scope === 'string'
      ? (data.scope as string).split(' ')
      : config.scopes,
  };
}

/**
 * Check whether a token set has expired (with optional buffer in ms).
 */
export function isTokenExpired(tokenSet: OAuthTokenSet, bufferMs = 60_000): boolean {
  return Date.now() >= tokenSet.expiresAt - bufferMs;
}
