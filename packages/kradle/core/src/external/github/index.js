// GitHub External Provider — Slice 3.3a / 3.3b
// Entry point for the GitHub provider adapter.
// Re-exports auth helpers, git forge class, issue tracking, CI/CD, boundary objects, and provider factory.

export { createGitHubJwt, exchangeInstallationToken } from './auth.js';

import { GitHubGitForge } from './git-forge.js';
import { GitHubIssueTracking } from './issue-tracking.js';
import { GitHubCicd } from './cicd.js';

export { GitHubGitForge };
export { GitHubIssueTracking };
export { GitHubCicd };

// ---------------------------------------------------------------------------
// Boundary declarations
// ---------------------------------------------------------------------------

export const GITHUB_GIT_FORGE_BOUNDARY = Object.freeze({
  role: 'github-git-forge',
  scope: 'GitHub App authentication (JWT signing, installation token exchange) and Git forge operations (repositories, PRs, refs, deploy keys, branch protection)',
  owns: [
    'GitHub App JWT creation',
    'installation token exchange',
    'repository listing',
    'pull request lifecycle',
    'ref enumeration',
    'deploy key synchronisation',
    'branch protection synchronisation'
  ],
  delegatesTo: [],
  mustNotOwn: [
    'GitHub secret storage',
    'Kubernetes resources',
    'CI pipeline execution',
    'webhook delivery'
  ]
});

export const GITHUB_ISSUE_TRACKING_BOUNDARY = Object.freeze({
  role: 'github-issue-tracking',
  scope: 'GitHub Issues API: listing, creating, updating, closing issues and managing issue comments',
  owns: [
    'issue listing',
    'issue creation',
    'issue updates',
    'issue closing',
    'comment listing',
    'comment creation'
  ],
  delegatesTo: [],
  mustNotOwn: [
    'GitHub secret storage',
    'Kubernetes resources',
    'CI pipeline execution',
    'webhook delivery',
    'pull requests',
    'branch protection'
  ]
});

export const GITHUB_CICD_BOUNDARY = Object.freeze({
  role: 'github-cicd',
  scope: 'GitHub Actions API: workflow runs, jobs, rerun/cancel operations, and check runs',
  owns: [
    'workflow run listing',
    'job listing',
    'workflow rerun',
    'workflow cancellation',
    'check run creation',
    'check run updates'
  ],
  delegatesTo: [],
  mustNotOwn: [
    'GitHub secret storage',
    'Kubernetes resources',
    'webhook delivery',
    'issue tracking',
    'pull requests'
  ]
});

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

/**
 * Create a GitHub ExternalProviderAdapter.
 *
 * Returns a lightweight descriptor that carries GitHub App credentials and
 * exposes factory methods for constructing GitHubGitForge, GitHubIssueTracking,
 * and GitHubCicd instances bound to specific installation tokens.
 *
 * @param {{ appId: string, privateKey: string, installationId?: string, fetchImpl?: Function }} opts
 * @returns {{ type: string, config: object, createForge: Function, createIssueTracker: Function, createCicd: Function }}
 */
export function createGitHubProvider({ appId, privateKey, installationId, fetchImpl } = {}) {
  if (!appId) throw new Error('createGitHubProvider: appId is required');
  if (!privateKey) throw new Error('createGitHubProvider: privateKey is required');

  return {
    type: 'github',
    config: Object.freeze({ appId, installationId }),

    /**
     * Construct a GitHubGitForge for the given owner and installation token.
     * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} forgeOpts
     * @returns {GitHubGitForge}
     */
    createForge({ owner, installationToken, fetchImpl: forgeFetch } = {}) {
      return new GitHubGitForge({
        owner,
        installationToken,
        fetchImpl: forgeFetch ?? fetchImpl ?? globalThis.fetch
      });
    },

    /**
     * Construct a GitHubIssueTracking for the given owner and installation token.
     * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} opts
     * @returns {GitHubIssueTracking}
     */
    createIssueTracker({ owner, installationToken, fetchImpl: trackerFetch } = {}) {
      return new GitHubIssueTracking({
        owner,
        installationToken,
        fetchImpl: trackerFetch ?? fetchImpl ?? globalThis.fetch
      });
    },

    /**
     * Construct a GitHubCicd for the given owner and installation token.
     * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} opts
     * @returns {GitHubCicd}
     */
    createCicd({ owner, installationToken, fetchImpl: cicdFetch } = {}) {
      return new GitHubCicd({
        owner,
        installationToken,
        fetchImpl: cicdFetch ?? fetchImpl ?? globalThis.fetch
      });
    }
  };
}
