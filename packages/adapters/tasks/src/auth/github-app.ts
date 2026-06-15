import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

import type { GitHubAppConfig } from "./types.js";

// ── Types ─────────────────────────────────────────────────────────────────

export interface Installation {
  id: number;
  account: {
    login: string;
    type: string;
  };
  repositorySelection: string;
}

export interface CreateKeyPROpts {
  owner: string;
  repo: string;
  installationId: number;
  userId: string;
  publicKey: string;
  keyPath: string;
}

export interface CreateKeyPRResult {
  prUrl: string;
  prNumber: number;
  branch: string;
}

// ── GitHubAppClient ───────────────────────────────────────────────────────

/**
 * Client for interacting with GitHub as a GitHub App.
 * Uses @octokit/rest and @octokit/auth-app for authentication.
 */
export class GitHubAppClient {
  private readonly config: GitHubAppConfig;

  constructor(config: GitHubAppConfig) {
    this.config = config;
  }

  /**
   * Get an installation access token for a specific installation.
   */
  async getInstallationToken(installationId: number): Promise<string> {
    const octokit = this.createAppOctokit();

    const { data } = await octokit.apps.createInstallationAccessToken({
      installation_id: installationId,
    });

    return data.token;
  }

  /**
   * Create a pull request to add an SSH public key to a repository.
   */
  async createKeyPR(opts: CreateKeyPROpts): Promise<CreateKeyPRResult> {
    const octokit = await this.createInstallationOctokit(opts.installationId);
    const branch = `tasks-adapter/add-key-${opts.userId}-${Date.now()}`;

    // Get the default branch ref
    const { data: repo } = await octokit.repos.get({
      owner: opts.owner,
      repo: opts.repo,
    });
    const defaultBranch = repo.default_branch;

    // Get the HEAD SHA of the default branch
    const { data: ref } = await octokit.git.getRef({
      owner: opts.owner,
      repo: opts.repo,
      ref: `heads/${defaultBranch}`,
    });
    const baseSha = ref.object.sha;

    // Create a new branch
    await octokit.git.createRef({
      owner: opts.owner,
      repo: opts.repo,
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    });

    // Create or update the key file at {keyPath}/{userId}.pub
    const filePath = `${opts.keyPath}/${opts.userId}.pub`;
    await octokit.repos.createOrUpdateFileContents({
      owner: opts.owner,
      repo: opts.repo,
      path: filePath,
      message: `Add SSH public key for user ${opts.userId}`,
      content: Buffer.from(opts.publicKey).toString("base64"),
      branch,
    });

    // Create a pull request
    const { data: pr } = await octokit.pulls.create({
      owner: opts.owner,
      repo: opts.repo,
      title: `Add SSH key for user ${opts.userId}`,
      head: branch,
      base: defaultBranch,
      body: [
        `This PR adds an SSH public key for user \`${opts.userId}\`.`,
        "",
        `**Key path:** \`${filePath}\``,
        `**Key fingerprint:** \`${this.extractKeyFingerprint(opts.publicKey)}\``,
        `**Key type:** \`${this.extractKeyType(opts.publicKey)}\``,
      ].join("\n"),
    });

    return {
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch,
    };
  }

  /**
   * Read a file from a repository.
   */
  async readFile(opts: {
    owner: string;
    repo: string;
    installationId: number;
    path: string;
    ref?: string;
  }): Promise<string> {
    const octokit = await this.createInstallationOctokit(opts.installationId);

    const { data } = await octokit.repos.getContent({
      owner: opts.owner,
      repo: opts.repo,
      path: opts.path,
      ref: opts.ref,
    });

    if (Array.isArray(data) || data.type !== "file") {
      throw new Error(`Path "${opts.path}" is not a file`);
    }

    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  /**
   * List all installations for this GitHub App.
   */
  async listInstallations(): Promise<Installation[]> {
    const octokit = this.createAppOctokit();

    const { data } = await octokit.apps.listInstallations();

    return data.map((inst) => ({
      id: inst.id,
      account: {
        login: inst.account?.login ?? "unknown",
        type: inst.account?.type ?? "unknown",
      },
      repositorySelection: inst.repository_selection,
    }));
  }

  // ── Internal helpers ──────────────────────────────────────────────────

  /**
   * Extract the key type prefix from an SSH public key string.
   */
  private extractKeyType(publicKey: string): string {
    const parts = publicKey.trim().split(/\s+/);
    return parts[0] ?? "unknown";
  }

  /**
   * Extract a short fingerprint-like identifier from an SSH public key.
   * Returns the first 16 chars of the base64 key data for identification.
   */
  private extractKeyFingerprint(publicKey: string): string {
    const parts = publicKey.trim().split(/\s+/);
    const keyData = parts[1] ?? "";
    return keyData.length > 16 ? `SHA256:${keyData.substring(0, 16)}...` : `SHA256:${keyData}`;
  }

  private createAppOctokit(): Octokit {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.config.appId,
        privateKey: this.config.privateKey,
      },
    });
  }

  private async createInstallationOctokit(installationId: number): Promise<Octokit> {
    const token = await this.getInstallationToken(installationId);
    return new Octokit({ auth: token });
  }
}
