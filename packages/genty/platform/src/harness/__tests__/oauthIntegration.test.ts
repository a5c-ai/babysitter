import { describe, it, expect, vi } from 'vitest';
import {
  buildAuthorizationUrl,
  exchangeCode,
  isTokenExpired,
  generatePkceChallenge,
  type OAuthConfig,
  type OAuthTokenSet,
} from '../oauthIntegration';

describe('oauthIntegration', () => {
  const config: OAuthConfig = {
    clientId: 'test-client',
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    scopes: ['read', 'write'],
    redirectUri: 'http://localhost:3000/callback',
  };

  // -------------------------------------------------------------------------
  // generatePkceChallenge
  // -------------------------------------------------------------------------

  describe('generatePkceChallenge', () => {
    it('generates a verifier and challenge pair', () => {
      const pkce = generatePkceChallenge();
      expect(pkce.codeVerifier).toBeTruthy();
      expect(pkce.codeChallenge).toBeTruthy();
      expect(pkce.codeVerifier).not.toBe(pkce.codeChallenge);
    });

    it('generates unique pairs', () => {
      const a = generatePkceChallenge();
      const b = generatePkceChallenge();
      expect(a.codeVerifier).not.toBe(b.codeVerifier);
    });
  });

  // -------------------------------------------------------------------------
  // buildAuthorizationUrl
  // -------------------------------------------------------------------------

  describe('buildAuthorizationUrl', () => {
    it('constructs URL with required params', () => {
      const { url, pkce } = buildAuthorizationUrl(config, 'state-123');
      expect(url).toContain('https://auth.example.com/authorize?');
      expect(url).toContain('client_id=test-client');
      expect(url).toContain('state=state-123');
      expect(url).toContain('code_challenge_method=S256');
      expect(url).toContain(`code_challenge=${pkce.codeChallenge}`);
      expect(url).toContain('scope=read+write');
      expect(url).toContain('response_type=code');
    });

    it('returns a PKCE challenge object', () => {
      const { pkce } = buildAuthorizationUrl(config, 'x');
      expect(pkce.codeVerifier).toBeTruthy();
      expect(pkce.codeChallenge).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // exchangeCode
  // -------------------------------------------------------------------------

  describe('exchangeCode', () => {
    it('exchanges code for token set', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'at-123',
          refresh_token: 'rt-456',
          expires_in: 3600,
          scope: 'read write',
        }),
      });

      const tokens = await exchangeCode(config, 'auth-code', 'verifier', mockFetch as unknown as typeof fetch);
      expect(tokens.accessToken).toBe('at-123');
      expect(tokens.refreshToken).toBe('rt-456');
      expect(tokens.scopes).toEqual(['read', 'write']);
      expect(tokens.expiresAt).toBeGreaterThan(Date.now());
    });

    it('throws on HTTP error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(
        exchangeCode(config, 'bad-code', 'verifier', mockFetch as unknown as typeof fetch),
      ).rejects.toThrow('Token exchange failed: 401');
    });
  });

  // -------------------------------------------------------------------------
  // isTokenExpired
  // -------------------------------------------------------------------------

  describe('isTokenExpired', () => {
    it('returns false for valid token', () => {
      const token: OAuthTokenSet = {
        accessToken: 'x',
        expiresAt: Date.now() + 3_600_000,
        scopes: ['read'],
      };
      expect(isTokenExpired(token)).toBe(false);
    });

    it('returns true for expired token', () => {
      const token: OAuthTokenSet = {
        accessToken: 'x',
        expiresAt: Date.now() - 1000,
        scopes: ['read'],
      };
      expect(isTokenExpired(token)).toBe(true);
    });

    it('accounts for buffer time', () => {
      const token: OAuthTokenSet = {
        accessToken: 'x',
        expiresAt: Date.now() + 30_000, // 30s left but 60s buffer
        scopes: ['read'],
      };
      expect(isTokenExpired(token, 60_000)).toBe(true);
      expect(isTokenExpired(token, 10_000)).toBe(false);
    });
  });
});
