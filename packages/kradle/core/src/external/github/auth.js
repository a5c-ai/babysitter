// GitHub App authentication helpers — Slice 3.3a
// Provides JWT signing (HMAC-SHA256 for test, RSA-SHA256 for production)
// and installation token exchange. No external dependencies; uses node:crypto.

import { createHmac, createSign } from 'node:crypto';

const GITHUB_API = 'https://api.github.com';

/**
 * Encode a value as Base64url (RFC 4648 §5, no padding).
 * @param {string|Buffer} data
 * @returns {string}
 */
function b64url(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  return buf.toString('base64url');
}

/**
 * Create a GitHub App JWT.
 *
 * In production, pass a PEM-encoded RSA private key and the function will
 * use RS256. For unit tests, pass any string key; if it does not look like
 * a PEM file the function falls back to HS256 (HMAC-SHA256) so tests can
 * run without real RSA keys.
 *
 * @param {{ appId: string, privateKey: string, expiresInSeconds?: number }} opts
 * @returns {Promise<string>} A signed JWT string.
 */
export async function createGitHubJwt({ appId, privateKey, expiresInSeconds = 600 } = {}) {
  if (!appId) throw new Error('createGitHubJwt: appId is required');
  if (!privateKey) throw new Error('createGitHubJwt: privateKey is required');

  const now = Math.floor(Date.now() / 1000);
  const isRsa = privateKey.includes('-----BEGIN');

  const alg = isRsa ? 'RS256' : 'HS256';

  const header = b64url(JSON.stringify({ alg, typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iat: now,
    exp: now + expiresInSeconds,
    iss: appId
  }));

  const signingInput = `${header}.${payload}`;

  let signature;
  if (isRsa) {
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    sign.end();
    signature = sign.sign(privateKey, 'base64url');
  } else {
    // HMAC-SHA256 fallback (test mode only)
    const hmac = createHmac('sha256', privateKey);
    hmac.update(signingInput);
    signature = hmac.digest('base64url');
  }

  return `${signingInput}.${signature}`;
}

/**
 * Exchange a GitHub App JWT for an installation access token.
 *
 * @param {{ appJwt: string, installationId: string|number, fetchImpl?: Function }} opts
 * @returns {Promise<{ token: string, expiresAt: string }>}
 */
export async function exchangeInstallationToken({ appJwt, installationId, fetchImpl = globalThis.fetch } = {}) {
  if (!appJwt) throw new Error('exchangeInstallationToken: appJwt is required');
  if (!installationId) throw new Error('exchangeInstallationToken: installationId is required');
  if (!fetchImpl) throw new Error('exchangeInstallationToken: a fetch implementation is required');

  const url = `${GITHUB_API}/app/installations/${installationId}/access_tokens`;

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${appJwt}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`exchangeInstallationToken: GitHub API returned ${response.status} — authentication or token exchange failed`);
  }

  const data = await response.json();
  return {
    token: data.token,
    expiresAt: data.expires_at
  };
}
