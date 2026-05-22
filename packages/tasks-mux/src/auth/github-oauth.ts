import type { GitHubOAuthConfig, User } from "./types.js";

// ── Constants ─────────────────────────────────────────────────────────────

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";

// ── GitHubOAuthClient ─────────────────────────────────────────────────────

/**
 * OAuth 2.0 client for GitHub authentication.
 * Uses native fetch() for HTTP calls with no external dependencies.
 */
export class GitHubOAuthClient {
  private readonly config: GitHubOAuthConfig;

  constructor(config: GitHubOAuthConfig) {
    this.config = config;
  }

  /**
   * Build the GitHub OAuth authorization URL.
   * Optionally supports PKCE via codeVerifier (S256 challenge).
   */
  getAuthorizationUrl(state: string, codeVerifier?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      scope: this.config.scopes.join(" "),
      state,
    });

    if (codeVerifier) {
      params.set("code_challenge", codeVerifier);
      params.set("code_challenge_method", "S256");
    }

    return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for an access token.
   */
  async exchangeCode(
    code: string,
    codeVerifier?: string,
  ): Promise<{ accessToken: string; tokenType: string; scope: string }> {
    const body: Record<string, string> = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.callbackUrl,
    };

    if (codeVerifier) {
      body.code_verifier = codeVerifier;
    }

    const response = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`GitHub OAuth token exchange failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      token_type: string;
      scope: string;
      error?: string;
      error_description?: string;
    };

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error} - ${data.error_description ?? "unknown"}`);
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  /**
   * Fetch the authenticated user's profile from GitHub.
   */
  async getUserProfile(accessToken: string): Promise<User> {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API user fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      id: number;
      login: string;
      name: string | null;
      email: string | null;
      avatar_url: string;
    };

    return {
      id: String(data.id),
      login: data.login,
      name: data.name ?? data.login,
      email: data.email ?? `${data.login}@users.noreply.github.com`,
      avatarUrl: data.avatar_url,
      provider: "github",
    };
  }
}
