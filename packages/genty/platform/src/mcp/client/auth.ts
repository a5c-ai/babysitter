/**
 * GAP-TOOLS-032: MCP Authentication.
 *
 * Provides authentication primitives for MCP client connections,
 * supporting bearer token, OAuth, and API key strategies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type McpAuthType = 'bearer' | 'oauth' | 'apikey';

export interface McpBearerCredentials {
  token: string;
}

export interface McpOAuthCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface McpApiKeyCredentials {
  key: string;
  headerName: string;
}

export type McpCredentials = McpBearerCredentials | McpOAuthCredentials | McpApiKeyCredentials;

export interface McpAuthConfig {
  /** Authentication type. */
  type: McpAuthType;
  /** Credentials for the selected auth type. */
  credentials: McpCredentials;
}

// ---------------------------------------------------------------------------
// McpAuthProvider
// ---------------------------------------------------------------------------

export class McpAuthProvider {
  private config: McpAuthConfig;

  constructor(config: McpAuthConfig) {
    this.config = config;
  }

  /**
   * Get the authentication headers for an outgoing request.
   */
  getAuthHeaders(): Record<string, string> {
    switch (this.config.type) {
      case 'bearer': {
        const creds = this.config.credentials as McpBearerCredentials;
        return { Authorization: `Bearer ${creds.token}` };
      }
      case 'oauth': {
        const creds = this.config.credentials as McpOAuthCredentials;
        return { Authorization: `Bearer ${creds.accessToken}` };
      }
      case 'apikey': {
        const creds = this.config.credentials as McpApiKeyCredentials;
        return { [creds.headerName]: creds.key };
      }
    }
  }

  /**
   * Check if the OAuth token needs refreshing.
   * Returns true if the token is expired or close to expiry (within 60s).
   * Always returns false for non-OAuth auth types.
   */
  refreshIfNeeded(): boolean {
    if (this.config.type !== 'oauth') return false;

    const creds = this.config.credentials as McpOAuthCredentials;
    if (!creds.expiresAt) return false;

    return Date.now() >= creds.expiresAt - 60_000;
  }

  /**
   * Check whether the provider has valid-looking credentials.
   */
  isAuthenticated(): boolean {
    switch (this.config.type) {
      case 'bearer': {
        const creds = this.config.credentials as McpBearerCredentials;
        return !!creds.token;
      }
      case 'oauth': {
        const creds = this.config.credentials as McpOAuthCredentials;
        return !!creds.accessToken;
      }
      case 'apikey': {
        const creds = this.config.credentials as McpApiKeyCredentials;
        return !!creds.key && !!creds.headerName;
      }
    }
  }

  /**
   * Get the current auth type.
   */
  getType(): McpAuthType {
    return this.config.type;
  }
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

/**
 * Create a bearer token auth provider.
 */
export function createBearerAuth(token: string): McpAuthProvider {
  return new McpAuthProvider({
    type: 'bearer',
    credentials: { token },
  });
}

/**
 * Create an API key auth provider.
 */
export function createApiKeyAuth(key: string, headerName = 'X-API-Key'): McpAuthProvider {
  return new McpAuthProvider({
    type: 'apikey',
    credentials: { key, headerName },
  });
}
