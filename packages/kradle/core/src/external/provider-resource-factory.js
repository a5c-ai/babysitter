// External Provider Resource Factory — Slice B3+D1
//
// Provides:
//   - createDefaultProviderRegistry() — auto-registers GitHub provider
//   - createTypedProvider() — creates typed provider CRD resources (GitProvider, CiProvider, etc.)
//   - createExternalBackendProvider() — DEPRECATED, use createTypedProvider()

import { createProviderRegistry } from './provider-adapter.js';
import { GitHubGitForge } from './github/git-forge.js';
import { GitHubIssueTracking } from './github/issue-tracking.js';
import { GitHubCicd } from './github/cicd.js';

// Re-export for consumers that want the real classes from this module
export { GitHubGitForge, GitHubIssueTracking, GitHubCicd };

// Valid typed provider kinds
const TYPED_PROVIDER_KINDS = new Set([
  'GitProvider',
  'CiProvider',
  'IssueTrackerProvider',
  'AppHostingProvider',
  'ArtifactRegistryProvider',
]);

// ---------------------------------------------------------------------------
// GitHub provider descriptor — wraps real GitHub classes
// ---------------------------------------------------------------------------

/**
 * Build a GitHub provider adapter descriptor for the registry.
 * This descriptor exposes real GitHubGitForge, GitHubIssueTracking, and
 * GitHubCicd classes as factory methods.  Credential-free listing operations
 * return empty arrays; authenticated operations are created via createGitHubProvider().
 *
 * @returns {object} ExternalProviderAdapter descriptor
 */
function buildGitHubAdapterDescriptor() {
  return {
    descriptor() {
      return {
        providerType: 'github',
        displayName: 'GitHub',
        hosting: ['cloud', 'self-hosted'],
        authModes: ['github-app', 'pat'],
        interfaces: ['gitForge', 'issueTracking', 'cicd']
      };
    },

    health() {
      return { status: 'healthy', message: 'GitHub provider registered (no live connection)' };
    },

    /**
     * Create a GitHubGitForge instance bound to specific credentials.
     *
     * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} opts
     * @returns {GitHubGitForge}
     */
    createForge({ owner, installationToken, fetchImpl } = {}) {
      return new GitHubGitForge({ owner, installationToken, fetchImpl: fetchImpl ?? globalThis.fetch });
    },

    /**
     * Create a GitHubIssueTracking instance bound to specific credentials.
     *
     * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} opts
     * @returns {GitHubIssueTracking}
     */
    createIssueTracker({ owner, installationToken, fetchImpl } = {}) {
      return new GitHubIssueTracking({ owner, installationToken, fetchImpl: fetchImpl ?? globalThis.fetch });
    },

    /**
     * Create a GitHubCicd instance bound to specific credentials.
     *
     * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} opts
     * @returns {GitHubCicd}
     */
    createCicd({ owner, installationToken, fetchImpl } = {}) {
      return new GitHubCicd({ owner, installationToken, fetchImpl: fetchImpl ?? globalThis.fetch });
    },

    // Credential-free listing stubs — real operations require authenticated instances
    gitForge: {
      listRepositories: async () => [],
      createRepository: async () => { throw new Error('Use createForge() for authenticated git forge operations'); }
    },

    issueTracking: {
      listIssues: async () => [],
      createIssue: async () => { throw new Error('Use createIssueTracker() for authenticated issue tracking operations'); }
    },

    cicd: {
      listWorkflowRuns: async () => [],
      triggerWorkflow: async () => { throw new Error('Use createCicd() for authenticated CI/CD operations'); }
    },

    normalizeWebhook(payload) {
      // Passthrough — real normalization lives in the GitHub webhook controller
      return [{ type: payload?.action ?? 'unknown', payload }];
    },

    verifyWebhook(_request) {
      // Default: unverified; real HMAC verification is in webhook-controller
      return { valid: false, reason: 'use webhook-controller for HMAC verification' };
    }
  };
}

// ---------------------------------------------------------------------------
// D1: createDefaultProviderRegistry
// ---------------------------------------------------------------------------

/**
 * Create a provider registry pre-loaded with the GitHub provider.
 *
 * @returns {object} ProviderRegistry with github auto-registered
 */
export function createDefaultProviderRegistry() {
  const registry = createProviderRegistry();
  registry.register('github', buildGitHubAdapterDescriptor());
  return registry;
}

// ---------------------------------------------------------------------------
// D1: createTypedProvider
// ---------------------------------------------------------------------------

/**
 * Create a typed provider CRD resource (GitProvider, CiProvider, etc.).
 * Used by the external backend wizard to persist provider registrations.
 *
 * @param {string} kind - One of GitProvider, CiProvider, IssueTrackerProvider, AppHostingProvider, ArtifactRegistryProvider
 * @param {string} platform - Platform identifier (e.g. 'github', 'gitlab', 'vercel')
 * @param {{ name?: string, namespace?: string, organizationRef?: string, endpoint?: string, secretRef?: string }} spec
 * @returns {object} K8s-style typed provider resource
 */
export function createTypedProvider(kind, platform, {
  name,
  namespace = 'default',
  organizationRef = 'default',
  endpoint = '',
  secretRef = '',
} = {}) {
  if (!kind) throw new Error('createTypedProvider: kind is required');
  if (!TYPED_PROVIDER_KINDS.has(kind)) throw new Error(`createTypedProvider: unknown kind "${kind}", expected one of ${[...TYPED_PROVIDER_KINDS].join(', ')}`);
  if (!platform) throw new Error('createTypedProvider: platform is required');
  const resourceName = name || `${platform}-${kind.toLowerCase()}`;

  const now = new Date().toISOString();

  return {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind,
    metadata: {
      name: resourceName,
      namespace,
      labels: {},
      annotations: {}
    },
    spec: {
      organizationRef,
      platform,
      endpoint,
      ...(secretRef ? { secretRef } : {}),
    },
    status: {
      phase: 'Pending',
      createdAt: now
    }
  };
}

// ---------------------------------------------------------------------------
// D1: createExternalBackendProvider (DEPRECATED — use createTypedProvider)
// ---------------------------------------------------------------------------

/**
 * @deprecated Use createTypedProvider() instead.
 * Create an ExternalBackendProvider CRD resource.
 * Retained for backward compatibility. Maps to createTypedProvider('GitProvider', ...).
 *
 * @param {{ name: string, namespace?: string, providerType: string,
 *           displayName: string, config?: object, organizationRef?: string }} opts
 * @returns {object} K8s-style provider resource
 */
export function createExternalBackendProvider({
  name,
  namespace = 'default',
  providerType,
  displayName,
  config = {},
  organizationRef = 'default'
} = {}) {
  if (!name) throw new Error('createExternalBackendProvider: name is required');
  if (!providerType) throw new Error('createExternalBackendProvider: providerType is required');

  const now = new Date().toISOString();

  return {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'ExternalBackendProvider',
    metadata: {
      name,
      namespace,
      labels: {},
      annotations: {}
    },
    spec: {
      organizationRef,
      providerType,
      displayName: displayName || providerType,
      config: { ...config }
    },
    status: {
      phase: 'Pending',
      createdAt: now
    }
  };
}
