import { describe, it, expect } from 'vitest';
import {
  McpAuthProvider,
  createBearerAuth,
  createApiKeyAuth,
  type McpAuthConfig,
} from '../auth';

describe('mcp/client/auth', () => {
  // -------------------------------------------------------------------------
  // McpAuthProvider — Bearer
  // -------------------------------------------------------------------------

  describe('bearer auth', () => {
    it('returns Authorization header with Bearer prefix', () => {
      const provider = createBearerAuth('my-token');
      const headers = provider.getAuthHeaders();
      expect(headers).toEqual({ Authorization: 'Bearer my-token' });
    });

    it('reports authenticated when token is present', () => {
      const provider = createBearerAuth('abc');
      expect(provider.isAuthenticated()).toBe(true);
    });

    it('reports not authenticated when token is empty', () => {
      const provider = createBearerAuth('');
      expect(provider.isAuthenticated()).toBe(false);
    });

    it('refreshIfNeeded returns false for bearer', () => {
      const provider = createBearerAuth('token');
      expect(provider.refreshIfNeeded()).toBe(false);
    });

    it('returns correct type', () => {
      const provider = createBearerAuth('token');
      expect(provider.getType()).toBe('bearer');
    });
  });

  // -------------------------------------------------------------------------
  // McpAuthProvider — API Key
  // -------------------------------------------------------------------------

  describe('apikey auth', () => {
    it('returns custom header with key', () => {
      const provider = createApiKeyAuth('sk-123', 'X-API-Key');
      const headers = provider.getAuthHeaders();
      expect(headers).toEqual({ 'X-API-Key': 'sk-123' });
    });

    it('uses default header name', () => {
      const provider = createApiKeyAuth('sk-456');
      const headers = provider.getAuthHeaders();
      expect(headers).toEqual({ 'X-API-Key': 'sk-456' });
    });

    it('reports authenticated when key and header are present', () => {
      const provider = createApiKeyAuth('key', 'X-Key');
      expect(provider.isAuthenticated()).toBe(true);
    });

    it('reports not authenticated when key is empty', () => {
      const provider = createApiKeyAuth('', 'X-Key');
      expect(provider.isAuthenticated()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // McpAuthProvider — OAuth
  // -------------------------------------------------------------------------

  describe('oauth auth', () => {
    it('returns Bearer header with access token', () => {
      const config: McpAuthConfig = {
        type: 'oauth',
        credentials: {
          accessToken: 'oauth-token',
          refreshToken: 'refresh-me',
          expiresAt: Date.now() + 3_600_000,
        },
      };
      const provider = new McpAuthProvider(config);
      const headers = provider.getAuthHeaders();
      expect(headers).toEqual({ Authorization: 'Bearer oauth-token' });
    });

    it('refreshIfNeeded returns true when token is expired', () => {
      const config: McpAuthConfig = {
        type: 'oauth',
        credentials: {
          accessToken: 'token',
          expiresAt: Date.now() - 1000,
        },
      };
      const provider = new McpAuthProvider(config);
      expect(provider.refreshIfNeeded()).toBe(true);
    });

    it('refreshIfNeeded returns false when token is valid', () => {
      const config: McpAuthConfig = {
        type: 'oauth',
        credentials: {
          accessToken: 'token',
          expiresAt: Date.now() + 3_600_000,
        },
      };
      const provider = new McpAuthProvider(config);
      expect(provider.refreshIfNeeded()).toBe(false);
    });

    it('refreshIfNeeded returns false when no expiresAt', () => {
      const config: McpAuthConfig = {
        type: 'oauth',
        credentials: { accessToken: 'token' },
      };
      const provider = new McpAuthProvider(config);
      expect(provider.refreshIfNeeded()).toBe(false);
    });

    it('reports authenticated when accessToken is present', () => {
      const config: McpAuthConfig = {
        type: 'oauth',
        credentials: { accessToken: 'valid' },
      };
      const provider = new McpAuthProvider(config);
      expect(provider.isAuthenticated()).toBe(true);
    });
  });
});
