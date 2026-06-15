import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubOAuthClient } from "../auth/github-oauth.js";
import type { GitHubOAuthConfig } from "../auth/types.js";

// ────────────────────────────────────────────────────────────────────────────
// Mock fetch
// ────────────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn<typeof globalThis.fetch>();
vi.stubGlobal("fetch", mockFetch);

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const TEST_CONFIG: GitHubOAuthConfig = {
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  callbackUrl: "https://example.com/auth/callback",
  scopes: ["read:user", "repo"],
};

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    clone: () => jsonResponse(data, status),
    formData: async () => new FormData(),
    redirected: false,
    type: "basic",
    url: "",
    bytes: async () => new Uint8Array(),
  } as Response;
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("GitHubOAuthClient", () => {
  let client: GitHubOAuthClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new GitHubOAuthClient(TEST_CONFIG);
  });

  // ── getAuthorizationUrl ─────────────────────────────────────────────────

  describe("getAuthorizationUrl()", () => {
    it("should return a GitHub authorization URL", () => {
      const url = client.getAuthorizationUrl("state-123");

      expect(url).toContain("https://github.com/login/oauth/authorize");
    });

    it("should include client_id", () => {
      const url = client.getAuthorizationUrl("state-123");

      expect(url).toContain("client_id=test-client-id");
    });

    it("should include redirect_uri", () => {
      const url = client.getAuthorizationUrl("state-123");

      expect(url).toContain("redirect_uri=");
      expect(url).toContain(encodeURIComponent("https://example.com/auth/callback"));
    });

    it("should include scopes", () => {
      const url = client.getAuthorizationUrl("state-123");

      // Scopes are joined with space and URL-encoded
      expect(url).toContain("scope=read%3Auser+repo");
    });

    it("should include state parameter", () => {
      const url = client.getAuthorizationUrl("state-123");

      expect(url).toContain("state=state-123");
    });

    it("should include code_challenge when codeVerifier is provided", () => {
      const url = client.getAuthorizationUrl("state-123", "verifier-xyz");

      expect(url).toContain("code_challenge=verifier-xyz");
      expect(url).toContain("code_challenge_method=S256");
    });

    it("should not include code_challenge when no codeVerifier", () => {
      const url = client.getAuthorizationUrl("state-123");

      expect(url).not.toContain("code_challenge");
    });
  });

  // ── exchangeCode ────────────────────────────────────────────────────────

  describe("exchangeCode()", () => {
    it("should POST to GitHub token URL", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        access_token: "gho_test123",
        token_type: "bearer",
        scope: "read:user,repo",
      }));

      await client.exchangeCode("auth-code-123");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://github.com/login/oauth/access_token");
      expect((init as RequestInit).method).toBe("POST");
    });

    it("should include client_id and client_secret in the request body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        access_token: "gho_test123",
        token_type: "bearer",
        scope: "read:user,repo",
      }));

      await client.exchangeCode("auth-code-123");

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.client_id).toBe("test-client-id");
      expect(body.client_secret).toBe("test-client-secret");
    });

    it("should include the authorization code in the request body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        access_token: "gho_test123",
        token_type: "bearer",
        scope: "read:user,repo",
      }));

      await client.exchangeCode("auth-code-123");

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.code).toBe("auth-code-123");
    });

    it("should include code_verifier when provided", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        access_token: "gho_test123",
        token_type: "bearer",
        scope: "read:user,repo",
      }));

      await client.exchangeCode("auth-code-123", "verifier-xyz");

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.code_verifier).toBe("verifier-xyz");
    });

    it("should return accessToken, tokenType, and scope", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        access_token: "gho_test123",
        token_type: "bearer",
        scope: "read:user,repo",
      }));

      const result = await client.exchangeCode("auth-code-123");

      expect(result.accessToken).toBe("gho_test123");
      expect(result.tokenType).toBe("bearer");
      expect(result.scope).toBe("read:user,repo");
    });

    it("should throw on non-OK response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 500));

      await expect(client.exchangeCode("bad-code")).rejects.toThrow(
        "GitHub OAuth token exchange failed",
      );
    });

    it("should throw on OAuth error in response body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        error: "bad_verification_code",
        error_description: "The code passed is incorrect or expired.",
      }));

      await expect(client.exchangeCode("expired-code")).rejects.toThrow(
        "GitHub OAuth error: bad_verification_code",
      );
    });

    it("should set Accept: application/json header", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        access_token: "gho_test123",
        token_type: "bearer",
        scope: "read:user,repo",
      }));

      await client.exchangeCode("code");

      const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers["Accept"]).toBe("application/json");
    });
  });

  // ── getUserProfile ──────────────────────────────────────────────────────

  describe("getUserProfile()", () => {
    it("should fetch user profile from GitHub API", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 12345,
        login: "tal",
        name: "Tal M",
        email: "tal@a5c.ai",
        avatar_url: "https://avatars.githubusercontent.com/u/12345",
      }));

      const user = await client.getUserProfile("gho_test123");

      expect(user.id).toBe("12345");
      expect(user.login).toBe("tal");
      expect(user.name).toBe("Tal M");
      expect(user.email).toBe("tal@a5c.ai");
      expect(user.avatarUrl).toBe("https://avatars.githubusercontent.com/u/12345");
      expect(user.provider).toBe("github");
    });

    it("should use Bearer token in Authorization header", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 12345, login: "tal", name: "Tal M", email: "tal@a5c.ai",
        avatar_url: "https://avatars.githubusercontent.com/u/12345",
      }));

      await client.getUserProfile("gho_test123");

      const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer gho_test123");
    });

    it("should use login as name fallback when name is null", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 12345, login: "tal", name: null, email: "tal@a5c.ai",
        avatar_url: "https://avatars.githubusercontent.com/u/12345",
      }));

      const user = await client.getUserProfile("gho_test123");

      expect(user.name).toBe("tal");
    });

    it("should generate noreply email when email is null", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 12345, login: "tal", name: "Tal M", email: null,
        avatar_url: "https://avatars.githubusercontent.com/u/12345",
      }));

      const user = await client.getUserProfile("gho_test123");

      expect(user.email).toBe("tal@users.noreply.github.com");
    });

    it("should throw on non-OK response", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));

      await expect(client.getUserProfile("bad-token")).rejects.toThrow(
        "GitHub API user fetch failed",
      );
    });

    it("should fetch from correct GitHub API URL", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 1, login: "test", name: "Test", email: null,
        avatar_url: "https://avatars.githubusercontent.com/u/1",
      }));

      await client.getUserProfile("token");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.github.com/user");
    });

    it("should convert numeric GitHub ID to string", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 99999, login: "test", name: "Test", email: null,
        avatar_url: "https://avatars.githubusercontent.com/u/99999",
      }));

      const user = await client.getUserProfile("token");
      expect(user.id).toBe("99999");
      expect(typeof user.id).toBe("string");
    });
  });
});
