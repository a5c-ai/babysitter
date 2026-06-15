import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthClient } from "../client/auth-client.js";
import { ServerError } from "../client/server-client.js";

// ────────────────────────────────────────────────────────────────────────────
// Mock fetch
// ────────────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn<typeof globalThis.fetch>();
vi.stubGlobal("fetch", mockFetch);

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : status === 401 ? "Unauthorized" : "Error",
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

function noContentResponse(): Response {
  return jsonResponse(null, 204);
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("AuthClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ── Constructor and auth state ──────────────────────────────────────────

  describe("isAuthenticated()", () => {
    it("should return true when token is provided", () => {
      const client = new AuthClient({ token: "test-token" });
      expect(client.isAuthenticated()).toBe(true);
    });

    it("should return true when tokenProvider is provided", () => {
      const client = new AuthClient({ tokenProvider: async () => "dynamic-token" });
      expect(client.isAuthenticated()).toBe(true);
    });

    it("should return false when neither token nor tokenProvider is set", () => {
      const client = new AuthClient({});
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  // ── login ───────────────────────────────────────────────────────────────

  describe("login()", () => {
    it("should POST to /auth/login and return AuthToken", async () => {
      const authToken = {
        accessToken: "access-123",
        refreshToken: "refresh-123",
        expiresAt: "2026-04-21T11:00:00.000Z",
        user: { id: "1", login: "tal", name: "Tal M", email: "tal@a5c.ai", avatarUrl: "https://example.com/avatar", provider: "github" },
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(authToken));

      const client = new AuthClient({});
      const result = await client.login("auth-code-123");

      expect(result.accessToken).toBe("access-123");
      expect(result.refreshToken).toBe("refresh-123");

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.code).toBe("auth-code-123");
    });

    it("should include codeVerifier when provided", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        accessToken: "access-123",
        refreshToken: "refresh-123",
        expiresAt: "2026-04-21T11:00:00.000Z",
        user: { id: "1", login: "tal", name: "Tal M", email: "tal@a5c.ai", avatarUrl: "https://example.com/avatar", provider: "github" },
      }));

      const client = new AuthClient({});
      await client.login("auth-code-123", "verifier-xyz");

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.codeVerifier).toBe("verifier-xyz");
    });

    it("should store tokens after login for subsequent requests", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        accessToken: "access-123",
        refreshToken: "refresh-123",
        expiresAt: "2026-04-21T11:00:00.000Z",
        user: { id: "1", login: "tal", name: "Tal M", email: "tal@a5c.ai", avatarUrl: "https://example.com/avatar", provider: "github" },
      }));

      const client = new AuthClient({});
      await client.login("auth-code-123");

      expect(client.isAuthenticated()).toBe(true);
    });
  });

  // ── logout ──────────────────────────────────────────────────────────────

  describe("logout()", () => {
    it("should POST to /auth/logout and clear tokens", async () => {
      mockFetch.mockResolvedValueOnce(noContentResponse());

      const client = new AuthClient({ token: "access-123", refreshToken: "refresh-123" });
      await client.logout();

      expect(client.isAuthenticated()).toBe(false);
    });

    it("should clear tokens even if the logout request fails", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: "Server error" }, 500));

      const client = new AuthClient({ token: "access-123", refreshToken: "refresh-123" });
      await expect(client.logout()).rejects.toThrow();
      expect(client.isAuthenticated()).toBe(false);
    });
  });

  // ── getUser ─────────────────────────────────────────────────────────────

  describe("getUser()", () => {
    it("should GET /auth/me with Authorization header", async () => {
      const user = { id: "1", login: "tal", name: "Tal M", email: "tal@a5c.ai", avatarUrl: "https://example.com/avatar", provider: "github" };
      mockFetch.mockResolvedValueOnce(jsonResponse(user));

      const client = new AuthClient({ token: "access-123" });
      const result = await client.getUser();

      expect(result.login).toBe("tal");
      const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer access-123");
    });
  });

  // ── Token refresh on 401 ───────────────────────────────────────────────

  describe("automatic token refresh", () => {
    it("should retry with refreshed token on 401 when refreshToken is available", async () => {
      // First call returns 401
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: "Unauthorized" }, 401));
      // Refresh call returns new tokens
      mockFetch.mockResolvedValueOnce(jsonResponse({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      }));
      // Retry with new token succeeds
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: "1", login: "tal", name: "Tal M", email: "tal@a5c.ai", avatarUrl: "https://example.com/avatar", provider: "github",
      }));

      const client = new AuthClient({ token: "old-token", refreshToken: "refresh-123" });
      const result = await client.getUser();

      expect(result.login).toBe("tal");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should invoke onTokenRefresh callback after refresh", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 401));
      mockFetch.mockResolvedValueOnce(jsonResponse({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      }));
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "1", login: "tal", name: "Tal", email: "t@a.com", avatarUrl: "https://a.com/a", provider: "github" }));

      const onRefresh = vi.fn();
      const client = new AuthClient({
        token: "old-token",
        refreshToken: "refresh-123",
        onTokenRefresh: onRefresh,
      });

      await client.getUser();

      expect(onRefresh).toHaveBeenCalledWith({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });
    });

    it("should throw 401 when no refreshToken is available", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: "Unauthorized" }, 401));

      const client = new AuthClient({ token: "expired-token" });

      await expect(client.getUser()).rejects.toThrow(ServerError);
    });
  });

  // ── tokenProvider ───────────────────────────────────────────────────────

  describe("tokenProvider", () => {
    it("should call tokenProvider for each request", async () => {
      let callCount = 0;
      const provider = vi.fn(async () => {
        callCount++;
        return `token-${callCount}`;
      });

      mockFetch.mockResolvedValue(jsonResponse({ id: "1", login: "tal", name: "Tal", email: "t@a.com", avatarUrl: "https://a.com/a", provider: "github" }));

      const client = new AuthClient({ tokenProvider: provider });
      await client.getUser();
      await client.getUser();

      expect(provider).toHaveBeenCalledTimes(2);
    });
  });

  // ── Breakpoint methods ──────────────────────────────────────────────────

  describe("breakpoint methods", () => {
    it("listBreakpoints should GET /breakpoints with auth", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.listBreakpoints();

      expect(result).toEqual([]);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/breakpoints");
    });

    it("listBreakpoints should append filters as query params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new AuthClient({ token: "test-token" });
      await client.listBreakpoints({ status: "pending", projectId: "proj-1" });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("status=pending");
      expect(url).toContain("projectId=proj-1");
    });

    it("getBreakpoint should GET /breakpoints/:id with auth", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "bp-001", status: "pending" }));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.getBreakpoint("bp-001");

      expect(result.id).toBe("bp-001");
    });

    it("submitBreakpoint should POST /breakpoints with auth", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "bp-new" }));

      const client = new AuthClient({ token: "test-token" });
      await client.submitBreakpoint(
        "Test question",
        { description: "", codeSnippets: [], fileReferences: [], tags: [] },
        { strategy: "single", targetResponders: [], timeoutMs: 60_000, presentToUser: false },
        { projectId: "proj-1", repoId: "repo-1" },
      );

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.text).toBe("Test question");
      expect(body.projectId).toBe("proj-1");
    });

    it("submitAnswer should POST /breakpoints/:id/answers with auth", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "answer-1" }));

      const client = new AuthClient({ token: "test-token" });
      await client.submitAnswer("bp-001", {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/breakpoints/bp-001/answers");
    });
  });

  // ── SSH key methods ─────────────────────────────────────────────────────

  describe("SSH key methods", () => {
    it("generateKey should POST /keys/generate", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ publicKey: "ssh-ed25519...", privateKey: "...", fingerprint: "SHA256:abc", algorithm: "ed25519", createdAt: "2026-04-21T10:00:00.000Z" }));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.generateKey();

      expect(result.fingerprint).toBe("SHA256:abc");
    });

    it("listKeys should GET /keys", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.listKeys();

      expect(result).toEqual([]);
    });

    it("pushKey should POST /keys/:id/push", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ prUrl: "https://github.com/org/repo/pull/1" }));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.pushKey("key-1", "org", "repo");

      expect(result.prUrl).toContain("github.com");
    });
  });

  // ── Project methods ─────────────────────────────────────────────────────

  describe("project methods", () => {
    it("listProjects should GET /projects", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.listProjects();
      expect(result).toEqual([]);
    });

    it("getProject should GET /projects/:id", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "proj-1", name: "Test Project" }));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.getProject("proj-1");
      expect(result.name).toBe("Test Project");
    });

    it("createProject should POST /projects", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "proj-new", name: "New Project" }));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.createProject("New Project", "A new project");

      expect(result.name).toBe("New Project");
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.name).toBe("New Project");
      expect(body.description).toBe("A new project");
    });

    it("updateProject should PUT /projects/:id", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "proj-1", name: "Updated" }));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.updateProject("proj-1", { name: "Updated" });

      expect(result.name).toBe("Updated");
    });

    it("deleteProject should DELETE /projects/:id", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(null, 204));

      const client = new AuthClient({ token: "test-token" });
      await client.deleteProject("proj-1");

      const [, init] = mockFetch.mock.calls[0];
      expect((init as RequestInit).method).toBe("DELETE");
    });
  });

  // ── Team methods ────────────────────────────────────────────────────────

  describe("team methods", () => {
    it("listTeams should GET /teams", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.listTeams();
      expect(result).toEqual([]);
    });

    it("createTeam should POST /teams", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "team-1", name: "Team Alpha" }));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.createTeam("Team Alpha", "Our team");
      expect(result.name).toBe("Team Alpha");
    });
  });

  // ── searchUsers ─────────────────────────────────────────────────────────

  describe("searchUsers()", () => {
    it("should GET /auth/users with query params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new AuthClient({ token: "test-token" });
      await client.searchUsers("tal", 10);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("q=tal");
      expect(url).toContain("limit=10");
    });

    it("should work without query params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new AuthClient({ token: "test-token" });
      await client.searchUsers();

      const [url] = mockFetch.mock.calls[0];
      expect(url).not.toContain("?");
    });
  });

  // ── GitHub repos ────────────────────────────────────────────────────────

  describe("listGitHubRepos()", () => {
    it("should GET /auth/github/repos", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      const client = new AuthClient({ token: "test-token" });
      const result = await client.listGitHubRepos();
      expect(result).toEqual([]);
    });
  });
});
