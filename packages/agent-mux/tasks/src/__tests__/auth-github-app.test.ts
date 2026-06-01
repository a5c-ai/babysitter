import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubAppClient } from "../auth/github-app.js";
import type { GitHubAppConfig } from "../auth/types.js";

// ────────────────────────────────────────────────────────────────────────────
// Mock Octokit
// ────────────────────────────────────────────────────────────────────────────

const mockAppsCreateInstallationAccessToken = vi.fn();
const mockAppsListInstallations = vi.fn();
const mockReposGet = vi.fn();
const mockReposGetContent = vi.fn();
const mockReposCreateOrUpdateFileContents = vi.fn();
const mockGitGetRef = vi.fn();
const mockGitCreateRef = vi.fn();
const mockPullsCreate = vi.fn();

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn().mockImplementation(function () { return {
    apps: {
      createInstallationAccessToken: mockAppsCreateInstallationAccessToken,
      listInstallations: mockAppsListInstallations,
    },
    repos: {
      get: mockReposGet,
      getContent: mockReposGetContent,
      createOrUpdateFileContents: mockReposCreateOrUpdateFileContents,
    },
    git: {
      getRef: mockGitGetRef,
      createRef: mockGitCreateRef,
    },
    pulls: {
      create: mockPullsCreate,
    },
  }; }),
}));

vi.mock("@octokit/auth-app", () => ({
  createAppAuth: vi.fn(),
}));

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const TEST_CONFIG: GitHubAppConfig = {
  appId: "12345",
  privateKey: "-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----",
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("GitHubAppClient", () => {
  let client: GitHubAppClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GitHubAppClient(TEST_CONFIG);
  });

  // ── getInstallationToken ────────────────────────────────────────────────

  describe("getInstallationToken()", () => {
    it("should call apps.createInstallationAccessToken", async () => {
      mockAppsCreateInstallationAccessToken.mockResolvedValueOnce({
        data: { token: "ghs_test123" },
      });

      const token = await client.getInstallationToken(456);

      expect(mockAppsCreateInstallationAccessToken).toHaveBeenCalledWith({
        installation_id: 456,
      });
      expect(token).toBe("ghs_test123");
    });
  });

  // ── createKeyPR ─────────────────────────────────────────────────────────

  describe("createKeyPR()", () => {
    beforeEach(() => {
      mockAppsCreateInstallationAccessToken.mockResolvedValue({
        data: { token: "ghs_inst_token" },
      });
      mockReposGet.mockResolvedValue({
        data: { default_branch: "main" },
      });
      mockGitGetRef.mockResolvedValue({
        data: { object: { sha: "abc123" } },
      });
      mockGitCreateRef.mockResolvedValue({});
      mockReposCreateOrUpdateFileContents.mockResolvedValue({});
      mockPullsCreate.mockResolvedValue({
        data: { html_url: "https://github.com/org/repo/pull/42", number: 42 },
      });
    });

    it("should create a branch, commit key, and open PR", async () => {
      const result = await client.createKeyPR({
        owner: "org",
        repo: "repo",
        installationId: 456,
        userId: "tal",
        publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample tal@example.com",
        keyPath: ".breakpoints/.keys/trusted",
      });

      expect(result.prUrl).toBe("https://github.com/org/repo/pull/42");
      expect(result.prNumber).toBe(42);
      expect(result.branch).toContain("tasks-mux/add-key-tal-");
    });

    it("should get the default branch SHA", async () => {
      await client.createKeyPR({
        owner: "org",
        repo: "repo",
        installationId: 456,
        userId: "tal",
        publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample",
        keyPath: ".keys/trusted",
      });

      expect(mockGitGetRef).toHaveBeenCalledWith({
        owner: "org",
        repo: "repo",
        ref: "heads/main",
      });
    });

    it("should create a branch from the default branch", async () => {
      await client.createKeyPR({
        owner: "org",
        repo: "repo",
        installationId: 456,
        userId: "tal",
        publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample",
        keyPath: ".keys/trusted",
      });

      expect(mockGitCreateRef).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "org",
          repo: "repo",
          sha: "abc123",
        }),
      );
    });

    it("should commit the public key file", async () => {
      await client.createKeyPR({
        owner: "org",
        repo: "repo",
        installationId: 456,
        userId: "tal",
        publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample",
        keyPath: ".keys/trusted",
      });

      expect(mockReposCreateOrUpdateFileContents).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "org",
          repo: "repo",
          path: ".keys/trusted/tal.pub",
          message: "Add SSH public key for user tal",
        }),
      );
    });

    it("should create a PR targeting the default branch", async () => {
      await client.createKeyPR({
        owner: "org",
        repo: "repo",
        installationId: 456,
        userId: "tal",
        publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample",
        keyPath: ".keys/trusted",
      });

      expect(mockPullsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "org",
          repo: "repo",
          base: "main",
          title: "Add SSH key for user tal",
        }),
      );
    });

    it("should include key fingerprint in PR body", async () => {
      await client.createKeyPR({
        owner: "org",
        repo: "repo",
        installationId: 456,
        userId: "tal",
        publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample tal@example.com",
        keyPath: ".keys/trusted",
      });

      const prBody = mockPullsCreate.mock.calls[0][0].body;
      expect(prBody).toContain("SHA256:");
      expect(prBody).toContain("ssh-ed25519");
    });
  });

  // ── readFile ────────────────────────────────────────────────────────────

  describe("readFile()", () => {
    it("should read and decode a file from a repository", async () => {
      mockAppsCreateInstallationAccessToken.mockResolvedValue({
        data: { token: "ghs_inst_token" },
      });
      mockReposGetContent.mockResolvedValue({
        data: {
          type: "file",
          content: Buffer.from("hello world").toString("base64"),
        },
      });

      const content = await client.readFile({
        owner: "org",
        repo: "repo",
        installationId: 456,
        path: "README.md",
      });

      expect(content).toBe("hello world");
    });

    it("should throw when path is a directory", async () => {
      mockAppsCreateInstallationAccessToken.mockResolvedValue({
        data: { token: "ghs_inst_token" },
      });
      mockReposGetContent.mockResolvedValue({
        data: [{ type: "dir" }], // Array means directory
      });

      await expect(
        client.readFile({
          owner: "org",
          repo: "repo",
          installationId: 456,
          path: "src",
        }),
      ).rejects.toThrow('Path "src" is not a file');
    });

    it("should pass ref when provided", async () => {
      mockAppsCreateInstallationAccessToken.mockResolvedValue({
        data: { token: "ghs_inst_token" },
      });
      mockReposGetContent.mockResolvedValue({
        data: { type: "file", content: Buffer.from("content").toString("base64") },
      });

      await client.readFile({
        owner: "org",
        repo: "repo",
        installationId: 456,
        path: "file.txt",
        ref: "feature-branch",
      });

      expect(mockReposGetContent).toHaveBeenCalledWith(
        expect.objectContaining({ ref: "feature-branch" }),
      );
    });
  });

  // ── listInstallations ──────────────────────────────────────────────────

  describe("listInstallations()", () => {
    it("should return a list of installations", async () => {
      mockAppsListInstallations.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            account: { login: "org1", type: "Organization" },
            repository_selection: "all",
          },
          {
            id: 2,
            account: { login: "user1", type: "User" },
            repository_selection: "selected",
          },
        ],
      });

      const installations = await client.listInstallations();

      expect(installations).toHaveLength(2);
      expect(installations[0].id).toBe(1);
      expect(installations[0].account.login).toBe("org1");
      expect(installations[0].repositorySelection).toBe("all");
      expect(installations[1].account.type).toBe("User");
    });

    it("should handle missing account data", async () => {
      mockAppsListInstallations.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            account: null,
            repository_selection: "all",
          },
        ],
      });

      const installations = await client.listInstallations();

      expect(installations[0].account.login).toBe("unknown");
      expect(installations[0].account.type).toBe("unknown");
    });
  });
});
