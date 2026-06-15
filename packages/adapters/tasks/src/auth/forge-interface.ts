import type { GitForgeConfig, GitHubAppConfig } from "./types.js";
import { GitHubAppClient } from "./github-app.js";

// ── Types ─────────────────────────────────────────────────────────────────

export interface PullRequestOpts {
  owner: string;
  repo: string;
  title: string;
  head: string;
  base: string;
  body?: string;
}

export interface PullRequestResult {
  prUrl: string;
  prNumber: number;
}

export interface PushFileOpts {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
}

export interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

// ── GitForge Interface ────────────────────────────────────────────────────

/**
 * Pluggable interface for interacting with Git forges (GitHub, GitLab, etc.).
 */
export interface GitForge {
  createPR(opts: PullRequestOpts): Promise<PullRequestResult>;
  readFile(opts: { owner: string; repo: string; path: string; ref?: string }): Promise<string>;
  pushFile(opts: PushFileOpts): Promise<void>;
  listRepos(owner: string): Promise<RepoInfo[]>;
}

// ── GitHubForge ───────────────────────────────────────────────────────────

/**
 * GitHub implementation of the GitForge interface.
 * Wraps GitHubAppClient for repository operations.
 */
export class GitHubForge implements GitForge {
  private readonly client: GitHubAppClient;
  private readonly installationId: number;

  constructor(client: GitHubAppClient, installationId: number) {
    this.client = client;
    this.installationId = installationId;
  }

  async createPR(opts: PullRequestOpts): Promise<PullRequestResult> {
    const result = await this.client.createKeyPR({
      owner: opts.owner,
      repo: opts.repo,
      installationId: this.installationId,
      userId: "forge",
      publicKey: opts.body ?? "",
      keyPath: opts.head,
    });

    return {
      prUrl: result.prUrl,
      prNumber: result.prNumber,
    };
  }

  async readFile(opts: { owner: string; repo: string; path: string; ref?: string }): Promise<string> {
    return this.client.readFile({
      ...opts,
      installationId: this.installationId,
    });
  }

  pushFile(opts: PushFileOpts): Promise<void> {
    void opts;
    // Delegated to Octokit createOrUpdateFileContents via the client
    return Promise.reject(new Error("pushFile not yet implemented for GitHubForge"));
  }

  listRepos(owner: string): Promise<RepoInfo[]> {
    void owner;
    // Delegated to Octokit list repos endpoint
    return Promise.reject(new Error("listRepos not yet implemented for GitHubForge"));
  }
}

// ── Factory ───────────────────────────────────────────────────────────────

/**
 * Create a GitForge instance from a configuration object.
 * Currently only supports GitHub.
 */
export function createForge(config: GitForgeConfig): GitForge {
  switch (config.type) {
    case "github": {
      const appConfig: GitHubAppConfig = {
        appId: config.credentials.appId ?? "",
        privateKey: config.credentials.privateKey ?? "",
        webhookSecret: config.credentials.webhookSecret,
      };
      const installationId = parseInt(config.credentials.installationId ?? "0", 10);
      const client = new GitHubAppClient(appConfig);
      return new GitHubForge(client, installationId);
    }
    case "gitlab":
      throw new Error("GitLab forge not yet implemented");
    case "bitbucket":
      throw new Error("Bitbucket forge not yet implemented");
    default:
      throw new Error(`Unknown forge type: ${config.type as string}`);
  }
}
