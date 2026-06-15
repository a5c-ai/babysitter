import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

// ────────────────────────────────────────────────────────────────────────────
// We mock os.homedir() so auth-store writes to a temporary directory
// instead of the real home directory.
// ────────────────────────────────────────────────────────────────────────────

let testHomeDir: string;

vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return {
    ...actual,
    homedir: () => testHomeDir,
  };
});

async function importAuthStore() {
  return import("../cli/auth-store.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ────────────────────────────────────────────────────────────────────────────

function validAuthToken() {
  return {
    accessToken: "gho_abc123",
    refreshToken: "gho_refresh456",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    user: {
      id: "u-1",
      login: "testuser",
      name: "Test User",
      email: "test@example.com",
      avatarUrl: "https://example.com/avatar.png",
      provider: "github" as const,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("CLI Auth Store", () => {
  beforeEach(() => {
    testHomeDir = join(tmpdir(), `bmux-test-${randomUUID()}`);
    mkdirSync(testHomeDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testHomeDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe("getBmuxDir", () => {
    it("returns path under homedir", async () => {
      const { getBmuxDir } = await importAuthStore();
      const dir = getBmuxDir();
      expect(dir).toBe(join(testHomeDir, ".tasks-adapter"));
    });
  });

  describe("getAuthStorePath", () => {
    it("returns auth.json path", async () => {
      const { getAuthStorePath } = await importAuthStore();
      const path = getAuthStorePath();
      expect(path).toBe(join(testHomeDir, ".tasks-adapter", "auth.json"));
    });
  });

  describe("getClientConfigPath", () => {
    it("returns config.json path", async () => {
      const { getClientConfigPath } = await importAuthStore();
      const path = getClientConfigPath();
      expect(path).toBe(join(testHomeDir, ".tasks-adapter", "config.json"));
    });
  });

  describe("getKeysDir", () => {
    it("returns keys directory path", async () => {
      const { getKeysDir } = await importAuthStore();
      const dir = getKeysDir();
      expect(dir).toBe(join(testHomeDir, ".tasks-adapter", "keys"));
    });
  });

  describe("saveAuthState / loadAuthState", () => {
    it("saves and loads auth state", async () => {
      const { saveAuthState, loadAuthState } = await importAuthStore();
      const token = validAuthToken();

      saveAuthState(token);
      const loaded = loadAuthState();

      expect(loaded).not.toBeNull();
      expect(loaded!.accessToken).toBe(token.accessToken);
      expect(loaded!.refreshToken).toBe(token.refreshToken);
      expect(loaded!.user.login).toBe("testuser");
    });

    it("creates .tasks-adapter directory if it does not exist", async () => {
      const { saveAuthState, getBmuxDir } = await importAuthStore();
      const token = validAuthToken();

      saveAuthState(token);

      expect(existsSync(getBmuxDir())).toBe(true);
    });

    it("returns null when auth file does not exist", async () => {
      const { loadAuthState } = await importAuthStore();
      const loaded = loadAuthState();

      expect(loaded).toBeNull();
    });

    it("returns null when auth file contains invalid JSON", async () => {
      const { loadAuthState, getAuthStorePath, getBmuxDir } = await importAuthStore();
      mkdirSync(getBmuxDir(), { recursive: true });
      writeFileSync(getAuthStorePath(), "not json");

      const loaded = loadAuthState();
      expect(loaded).toBeNull();
    });

    it("returns null when auth file has invalid schema", async () => {
      const { loadAuthState, getAuthStorePath, getBmuxDir } = await importAuthStore();
      mkdirSync(getBmuxDir(), { recursive: true });
      writeFileSync(getAuthStorePath(), JSON.stringify({ foo: "bar" }));

      const loaded = loadAuthState();
      expect(loaded).toBeNull();
    });
  });

  describe("clearAuthState", () => {
    it("removes the auth file", async () => {
      const { saveAuthState, clearAuthState, getAuthStorePath } = await importAuthStore();
      saveAuthState(validAuthToken());
      expect(existsSync(getAuthStorePath())).toBe(true);

      clearAuthState();
      expect(existsSync(getAuthStorePath())).toBe(false);
    });

    it("does nothing when auth file does not exist", async () => {
      const { clearAuthState } = await importAuthStore();
      // Should not throw
      expect(() => clearAuthState()).not.toThrow();
    });
  });

  describe("loadClientConfig / saveClientConfig", () => {
    it("returns empty config when file does not exist", async () => {
      const { loadClientConfig } = await importAuthStore();
      const config = loadClientConfig();
      expect(config).toEqual({});
    });

    it("saves and loads serverUrl", async () => {
      const { saveClientConfig, loadClientConfig } = await importAuthStore();
      saveClientConfig({ serverUrl: "https://example.com" });

      const config = loadClientConfig();
      expect(config.serverUrl).toBe("https://example.com");
    });

    it("saves and loads authToken", async () => {
      const { saveClientConfig, loadClientConfig } = await importAuthStore();
      saveClientConfig({ authToken: "my-token" });

      const config = loadClientConfig();
      expect(config.authToken).toBe("my-token");
    });

    it("merges with existing config on save", async () => {
      const { saveClientConfig, loadClientConfig } = await importAuthStore();
      saveClientConfig({ serverUrl: "https://example.com" });
      saveClientConfig({ authToken: "my-token" });

      const config = loadClientConfig();
      expect(config.serverUrl).toBe("https://example.com");
      expect(config.authToken).toBe("my-token");
    });

    it("removes field when saved with empty string", async () => {
      const { saveClientConfig, loadClientConfig } = await importAuthStore();
      saveClientConfig({ serverUrl: "https://example.com", authToken: "tok" });
      saveClientConfig({ serverUrl: "" });

      const config = loadClientConfig();
      expect(config.serverUrl).toBeUndefined();
      expect(config.authToken).toBe("tok");
    });

    it("deletes config file when all fields are removed", async () => {
      const { saveClientConfig, getClientConfigPath } = await importAuthStore();
      saveClientConfig({ serverUrl: "https://example.com" });
      expect(existsSync(getClientConfigPath())).toBe(true);

      saveClientConfig({ serverUrl: "" });
      expect(existsSync(getClientConfigPath())).toBe(false);
    });

    it("trims whitespace from values", async () => {
      const { saveClientConfig, loadClientConfig } = await importAuthStore();
      saveClientConfig({ serverUrl: "  https://example.com  " });

      const config = loadClientConfig();
      expect(config.serverUrl).toBe("https://example.com");
    });

    it("returns empty config when file contains invalid JSON", async () => {
      const { loadClientConfig, getClientConfigPath, getBmuxDir } = await importAuthStore();
      mkdirSync(getBmuxDir(), { recursive: true });
      writeFileSync(getClientConfigPath(), "invalid");

      const config = loadClientConfig();
      expect(config).toEqual({});
    });
  });

  describe("isTokenExpired", () => {
    it("returns true when token is expired", async () => {
      const { isTokenExpired } = await importAuthStore();
      const pastDate = new Date(Date.now() - 1000).toISOString();
      expect(isTokenExpired(pastDate)).toBe(true);
    });

    it("returns false when token is not expired", async () => {
      const { isTokenExpired } = await importAuthStore();
      const futureDate = new Date(Date.now() + 60_000).toISOString();
      expect(isTokenExpired(futureDate)).toBe(false);
    });

    it("returns true when token expires exactly now", async () => {
      const { isTokenExpired } = await importAuthStore();
      const now = new Date().toISOString();
      // Date.now() >= expiry, so right at the boundary it should be expired
      expect(isTokenExpired(now)).toBe(true);
    });
  });
});
