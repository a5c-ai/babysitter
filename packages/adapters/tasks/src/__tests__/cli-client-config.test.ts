import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ────────────────────────────────────────────────────────────────────────────
// Mock the auth-store module to isolate client-config tests
// ────────────────────────────────────────────────────────────────────────────

const mockLoadClientConfig = vi.fn().mockReturnValue({});
const mockLoadAuthState = vi.fn().mockReturnValue(null);
const mockSaveAuthState = vi.fn();
const mockIsTokenExpired = vi.fn().mockReturnValue(false);

vi.mock("../cli/auth-store.js", () => ({
  loadClientConfig: () => mockLoadClientConfig(),
  loadAuthState: () => mockLoadAuthState(),
  saveAuthState: (state: unknown) => mockSaveAuthState(state),
  isTokenExpired: (exp: string) => mockIsTokenExpired(exp),
}));

// ────────────────────────────────────────────────────────────────────────────
// Mock the client module to avoid real network calls
// ────────────────────────────────────────────────────────────────────────────

const mockGetUser = vi.fn().mockResolvedValue({ login: "testuser", name: "Test" });

vi.mock("../client/index.js", () => ({
  DEFAULT_BMUX_SERVER_URL: "https://tasks-adapter.a5c.ai/api/v1",
  AuthClient: vi.fn().mockImplementation(function () { return {
    getUser: mockGetUser,
  }; }),
  ServerClient: vi.fn().mockImplementation(function (opts: Record<string, unknown>) { return {
    baseUrl: opts.baseUrl,
    defaultHeaders: opts.defaultHeaders,
  }; }),
}));

async function importClientConfig() {
  return import("../cli/client-config.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("CLI Client Config", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadClientConfig.mockReturnValue({});
    mockLoadAuthState.mockReturnValue(null);
    mockIsTokenExpired.mockReturnValue(false);
    // Clear relevant env vars
    delete process.env.BMUX_SERVER_URL;
    delete process.env.SERVER_URL;
    delete process.env.BMUX_AUTH_TOKEN;
    delete process.env.AUTH_TOKEN;
  });

  afterEach(() => {
    // Restore env
    process.env = { ...savedEnv };
  });

  describe("resolveServerUrl", () => {
    it("returns explicit URL when provided", async () => {
      const { resolveServerUrl } = await importClientConfig();
      const url = resolveServerUrl("https://custom.example.com");
      expect(url).toBe("https://custom.example.com");
    });

    it("falls back to BMUX_SERVER_URL env var", async () => {
      const { resolveServerUrl } = await importClientConfig();
      process.env.BMUX_SERVER_URL = "https://env.example.com";
      const url = resolveServerUrl();
      expect(url).toBe("https://env.example.com");
    });

    it("falls back to SERVER_URL env var", async () => {
      const { resolveServerUrl } = await importClientConfig();
      process.env.SERVER_URL = "https://legacy-env.example.com";
      const url = resolveServerUrl();
      expect(url).toBe("https://legacy-env.example.com");
    });

    it("falls back to config file serverUrl", async () => {
      const { resolveServerUrl } = await importClientConfig();
      mockLoadClientConfig.mockReturnValue({ serverUrl: "https://config.example.com" });
      const url = resolveServerUrl();
      expect(url).toBe("https://config.example.com");
    });

    it("falls back to DEFAULT_BMUX_SERVER_URL", async () => {
      const { resolveServerUrl } = await importClientConfig();
      const url = resolveServerUrl();
      expect(url).toBe("https://tasks-adapter.a5c.ai/api/v1");
    });

    it("strips trailing slashes", async () => {
      const { resolveServerUrl } = await importClientConfig();
      const url = resolveServerUrl("https://example.com///");
      expect(url).toBe("https://example.com");
    });

    it("ignores empty/whitespace explicit values", async () => {
      const { resolveServerUrl } = await importClientConfig();
      process.env.BMUX_SERVER_URL = "https://env.example.com";
      const url = resolveServerUrl("   ");
      expect(url).toBe("https://env.example.com");
    });

    it("prefers explicit over env over config over default", async () => {
      const { resolveServerUrl } = await importClientConfig();
      process.env.BMUX_SERVER_URL = "https://env.example.com";
      mockLoadClientConfig.mockReturnValue({ serverUrl: "https://config.example.com" });
      const url = resolveServerUrl("https://explicit.example.com");
      expect(url).toBe("https://explicit.example.com");
    });
  });

  describe("resolveApiBaseUrl", () => {
    it("appends /api/v1 when not present", async () => {
      const { resolveApiBaseUrl } = await importClientConfig();
      const url = resolveApiBaseUrl("https://example.com");
      expect(url).toBe("https://example.com/api/v1");
    });

    it("does not double-append /api/v1", async () => {
      const { resolveApiBaseUrl } = await importClientConfig();
      const url = resolveApiBaseUrl("https://example.com/api/v1");
      expect(url).toBe("https://example.com/api/v1");
    });
  });

  describe("resolveAuthToken", () => {
    it("returns explicit token when provided", async () => {
      const { resolveAuthToken } = await importClientConfig();
      const token = await resolveAuthToken(undefined, "explicit-token");
      expect(token).toBe("explicit-token");
    });

    it("falls back to BMUX_AUTH_TOKEN env var", async () => {
      const { resolveAuthToken } = await importClientConfig();
      process.env.BMUX_AUTH_TOKEN = "env-token";
      const token = await resolveAuthToken();
      expect(token).toBe("env-token");
    });

    it("falls back to AUTH_TOKEN env var", async () => {
      const { resolveAuthToken } = await importClientConfig();
      process.env.AUTH_TOKEN = "legacy-env-token";
      const token = await resolveAuthToken();
      expect(token).toBe("legacy-env-token");
    });

    it("falls back to config file authToken", async () => {
      const { resolveAuthToken } = await importClientConfig();
      mockLoadClientConfig.mockReturnValue({ authToken: "config-token" });
      const token = await resolveAuthToken();
      expect(token).toBe("config-token");
    });

    it("returns undefined when no token source is available", async () => {
      const { resolveAuthToken } = await importClientConfig();
      const token = await resolveAuthToken();
      expect(token).toBeUndefined();
    });

    it("returns stored session accessToken when not expired", async () => {
      const { resolveAuthToken } = await importClientConfig();
      mockLoadAuthState.mockReturnValue({
        accessToken: "stored-token",
        refreshToken: "stored-refresh",
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      });
      mockIsTokenExpired.mockReturnValue(false);

      const token = await resolveAuthToken();
      expect(token).toBe("stored-token");
    });

    it("returns stored token when expired but no refresh token available", async () => {
      const { resolveAuthToken } = await importClientConfig();
      mockLoadAuthState.mockReturnValue({
        accessToken: "expired-token",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
      mockIsTokenExpired.mockReturnValue(true);

      const token = await resolveAuthToken();
      expect(token).toBe("expired-token");
    });

    it("attempts token refresh when expired with refresh token", async () => {
      const { resolveAuthToken } = await importClientConfig();
      mockLoadAuthState.mockReturnValue({
        accessToken: "expired-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
      mockIsTokenExpired.mockReturnValue(true);
      // AuthClient.getUser will be called for refresh, but mock returns user
      // In this case no onTokenRefresh callback fires, so it falls back to stored token.

      const token = await resolveAuthToken();
      expect(token).toBe("expired-token");
    });

    it("returns stored token when refresh fails", async () => {
      const { resolveAuthToken } = await importClientConfig();
      mockLoadAuthState.mockReturnValue({
        accessToken: "expired-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
      mockIsTokenExpired.mockReturnValue(true);
      mockGetUser.mockRejectedValueOnce(new Error("Network error"));

      const token = await resolveAuthToken();
      expect(token).toBe("expired-token");
    });
  });

  describe("createCliServerClient", () => {
    it("creates a ServerClient with resolved options", async () => {
      const { createCliServerClient } = await importClientConfig();
      const client = await createCliServerClient({
        serverUrl: "https://example.com",
        authToken: "my-token",
      });

      expect(client).toBeDefined();
    });

    it("creates a ServerClient with defaults when no options provided", async () => {
      const { createCliServerClient } = await importClientConfig();
      const client = await createCliServerClient();

      expect(client).toBeDefined();
    });
  });
});
