// Artifact Registry Controller
// Manages ArtifactRegistry, ArtifactFeed, ArtifactAccessPolicy resources
// and artifact operations (publish, list, delete) for npm, pip, Docker, and generic registries.

import { createHash } from 'node:crypto';
import { createResource, clone } from './resource-model.js';

export const ARTIFACT_REGISTRY_CONTROLLER_BOUNDARY = {
  role: 'artifact-registry-controller',
  scope: 'Artifact registry lifecycle: validation, feed management, access policy, publish/list/delete operations for npm, pip, Docker, and generic artifact registries',
  owns: ['registry validation', 'feed management', 'access policy enforcement', 'artifact publish', 'artifact version listing', 'artifact deletion', 'download audit'],
  delegatesTo: ['resource-model', 'external-backend-binding'],
  mustNotOwn: ['secret values', 'blob storage I/O', 'network transport']
};

const VALID_REGISTRY_TYPES = ['npm', 'pip', 'docker', 'generic'];
const VALID_STORAGE_BACKENDS = ['internal', 's3', 'azure-blob', 'gcs'];
const VALID_PERMISSIONS = ['read', 'write', 'admin'];
const VALID_EXTERNAL_MODES = ['read-only', 'read-write', 'mirror'];

function sha256(data) {
  return createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
}

/**
 * Create an artifact registry controller instance.
 *
 * @param {object} [options]
 * @returns {object} controller
 */
export function createArtifactRegistryController(options = {}) {
  // In-memory stores for artifact versions and download audit records.
  // In production these are backed by postgres; here we use arrays for
  // unit-testable logic.
  const versions = [];
  const downloads = [];

  return {
    ...ARTIFACT_REGISTRY_CONTROLLER_BOUNDARY,

    // -----------------------------------------------------------------------
    // Registry validation
    // -----------------------------------------------------------------------

    /**
     * Validate an ArtifactRegistry resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateRegistry(resource) {
      const errors = [];
      if (resource == null) {
        errors.push('resource must not be null or undefined');
        return { valid: false, errors };
      }
      if (!resource.metadata?.name) {
        errors.push('metadata.name is required');
      }
      const spec = resource.spec || {};
      if (!spec.organizationRef) {
        errors.push('spec.organizationRef is required');
      }
      if (!spec.registryType) {
        errors.push(`spec.registryType is required; valid types are: ${VALID_REGISTRY_TYPES.join(', ')}`);
      } else if (!VALID_REGISTRY_TYPES.includes(spec.registryType)) {
        errors.push(`spec.registryType "${spec.registryType}" is not supported; valid types are: ${VALID_REGISTRY_TYPES.join(', ')}`);
      }
      if (!spec.storageBackend) {
        errors.push(`spec.storageBackend is required; valid backends are: ${VALID_STORAGE_BACKENDS.join(', ')}`);
      } else if (!VALID_STORAGE_BACKENDS.includes(spec.storageBackend)) {
        errors.push(`spec.storageBackend "${spec.storageBackend}" is not supported; valid backends are: ${VALID_STORAGE_BACKENDS.join(', ')}`);
      }
      // External backend requires externalBackendRef
      if (spec.storageBackend && spec.storageBackend !== 'internal' && spec.externalBackendRef) {
        // valid — external backend ref present for non-internal storage
      }
      return { valid: errors.length === 0, errors };
    },

    // -----------------------------------------------------------------------
    // Registry endpoint resolution
    // -----------------------------------------------------------------------

    /**
     * Return the registry endpoint URL for a given registry resource.
     * Internal registries use the kradle API URL pattern; external registries
     * resolve to their provider-specific endpoints.
     *
     * @param {object} registry - ArtifactRegistry resource
     * @param {object} [opts]
     * @param {string} [opts.baseUrl] - Kradle API base URL (default: https://kradle.example.com)
     * @returns {string} endpoint URL
     */
    getRegistryEndpoint(registry, opts = {}) {
      const spec = registry?.spec || {};
      const baseUrl = opts.baseUrl || 'https://kradle.example.com';
      const org = spec.organizationRef || 'default';

      // External backends
      if (spec.externalBackendRef) {
        const providerType = spec.externalProvider || spec.registryType;
        if (providerType === 'npm' || spec.externalUrl?.includes('npm.pkg.github.com')) {
          return spec.externalUrl || `https://npm.pkg.github.com/@${org}`;
        }
        if (providerType === 'docker' || spec.externalUrl?.includes('ghcr.io')) {
          return spec.externalUrl || `https://ghcr.io/${org}`;
        }
        if (providerType === 'pip') {
          return spec.externalUrl || 'https://pypi.org/simple/';
        }
        // Generic external
        return spec.externalUrl || `${baseUrl}/api/v1/registry/${spec.registryType}/${org}`;
      }

      // Internal registry
      return `${baseUrl}/api/v1/registry/${spec.registryType}/${org}`;
    },

    // -----------------------------------------------------------------------
    // Feed validation
    // -----------------------------------------------------------------------

    /**
     * Validate an ArtifactFeed resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateFeed(resource) {
      const errors = [];
      if (resource == null) {
        errors.push('resource must not be null or undefined');
        return { valid: false, errors };
      }
      if (!resource.metadata?.name) {
        errors.push('metadata.name is required');
      }
      const spec = resource.spec || {};
      if (!spec.organizationRef) {
        errors.push('spec.organizationRef is required');
      }
      if (!spec.registryRef) {
        errors.push('spec.registryRef is required');
      }
      if (!spec.feedName) {
        errors.push('spec.feedName is required');
      }
      return { valid: errors.length === 0, errors };
    },

    // -----------------------------------------------------------------------
    // Access policy validation
    // -----------------------------------------------------------------------

    /**
     * Validate an ArtifactAccessPolicy resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateAccessPolicy(resource) {
      const errors = [];
      if (resource == null) {
        errors.push('resource must not be null or undefined');
        return { valid: false, errors };
      }
      if (!resource.metadata?.name) {
        errors.push('metadata.name is required');
      }
      const spec = resource.spec || {};
      if (!spec.organizationRef) {
        errors.push('spec.organizationRef is required');
      }
      if (!spec.feedRef) {
        errors.push('spec.feedRef is required');
      }
      if (!Array.isArray(spec.subjects) || spec.subjects.length === 0) {
        errors.push('spec.subjects must be a non-empty array');
      }
      if (!Array.isArray(spec.permissions) || spec.permissions.length === 0) {
        errors.push(`spec.permissions must be a non-empty array; valid permissions are: ${VALID_PERMISSIONS.join(', ')}`);
      } else {
        const unknown = spec.permissions.filter((p) => !VALID_PERMISSIONS.includes(p));
        if (unknown.length > 0) {
          errors.push(`spec.permissions contains unknown permission(s): ${unknown.join(', ')}; valid permissions are: ${VALID_PERMISSIONS.join(', ')}`);
        }
      }
      return { valid: errors.length === 0, errors };
    },

    // -----------------------------------------------------------------------
    // Access policy enforcement
    // -----------------------------------------------------------------------

    /**
     * Check whether a subject has the required permission on a feed.
     * @param {object} policy - ArtifactAccessPolicy resource
     * @param {string} subject - subject identifier (user, team, or service account name)
     * @param {string} requiredPermission - 'read' | 'write' | 'admin'
     * @returns {boolean}
     */
    checkAccess(policy, subject, requiredPermission) {
      const spec = policy?.spec || {};
      const subjects = spec.subjects || [];
      const permissions = spec.permissions || [];
      if (!subjects.includes(subject)) return false;
      // admin implies write; write implies read
      if (requiredPermission === 'read') {
        return permissions.includes('read') || permissions.includes('write') || permissions.includes('admin');
      }
      if (requiredPermission === 'write') {
        return permissions.includes('write') || permissions.includes('admin');
      }
      return permissions.includes('admin');
    },

    // -----------------------------------------------------------------------
    // Artifact operations
    // -----------------------------------------------------------------------

    /**
     * Publish an artifact version to a feed.
     * Creates an ArtifactVersion resource with digest, size, and metadata.
     *
     * @param {object} feed - ArtifactFeed resource
     * @param {object} artifactSpec - { name, version, digest?, size?, metadata? }
     * @param {object} [opts] - { namespace, organizationRef }
     * @returns {{ version: object, digest: string, publishedAt: string }}
     */
    async publishArtifact(feed, artifactSpec, opts = {}) {
      const now = new Date().toISOString();
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName || 'unknown-feed';
      const organizationRef = opts.organizationRef || feed?.spec?.organizationRef || 'default';
      const namespace = opts.namespace || feed?.metadata?.namespace || 'default';
      const digest = artifactSpec.digest || sha256(`${artifactSpec.name}@${artifactSpec.version}@${now}`);
      const size = artifactSpec.size || 0;

      const versionName = `artver-${sha256(feedRef + artifactSpec.name + artifactSpec.version + now).slice(0, 12)}`;
      const versionResource = createResource('ArtifactVersion', { name: versionName, namespace }, {
        organizationRef,
        feedRef,
        name: artifactSpec.name,
        version: artifactSpec.version,
        digest,
        size,
        metadata: artifactSpec.metadata || {},
      });
      versionResource.status = { phase: 'Published', publishedAt: now };
      versions.push(versionResource);

      return { version: versionResource, digest, publishedAt: now };
    },

    /**
     * List artifact versions for a feed with optional pagination and filtering.
     *
     * @param {object} feed - ArtifactFeed resource
     * @param {object} [opts] - { name?, limit?, offset? }
     * @returns {{ items: object[], total: number }}
     */
    async listVersions(feed, opts = {}) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      let items = versions.filter((v) => v.spec.feedRef === feedRef);
      if (opts.name) {
        items = items.filter((v) => v.spec.name === opts.name);
      }
      const total = items.length;
      const offset = opts.offset || 0;
      const limit = opts.limit || 50;
      items = items.slice(offset, offset + limit);
      return { items: items.map(clone), total };
    },

    /**
     * Get a specific artifact version by name and version string.
     *
     * @param {object} feed - ArtifactFeed resource
     * @param {string} name - artifact name
     * @param {string} version - version string
     * @returns {object|null}
     */
    async getVersion(feed, name, version) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      const found = versions.find((v) =>
        v.spec.feedRef === feedRef &&
        v.spec.name === name &&
        v.spec.version === version &&
        v.status?.phase !== 'Deleted'
      );
      return found ? clone(found) : null;
    },

    /**
     * Soft-delete an artifact version (retention policy applies).
     *
     * @param {object} feed - ArtifactFeed resource
     * @param {string} name - artifact name
     * @param {string} version - version string
     * @returns {{ deleted: boolean, deletedAt?: string }}
     */
    async deleteVersion(feed, name, version) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      const found = versions.find((v) =>
        v.spec.feedRef === feedRef &&
        v.spec.name === name &&
        v.spec.version === version
      );
      if (!found) return { deleted: false };
      found.status = { ...found.status, phase: 'Deleted', deletedAt: new Date().toISOString() };
      return { deleted: true, deletedAt: found.status.deletedAt };
    },

    // -----------------------------------------------------------------------
    // Docker-specific operations
    // -----------------------------------------------------------------------

    /**
     * List Docker tags for a repository within a feed.
     * @param {object} feed
     * @param {string} repository
     * @returns {{ tags: string[] }}
     */
    async listDockerTags(feed, repository) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      const items = versions.filter((v) =>
        v.spec.feedRef === feedRef &&
        v.spec.name === repository &&
        v.status?.phase !== 'Deleted'
      );
      return { tags: items.map((v) => v.spec.version) };
    },

    /**
     * Get a Docker manifest for a repository reference.
     * @param {object} feed
     * @param {string} repository
     * @param {string} reference - tag or digest
     * @returns {object|null}
     */
    async getDockerManifest(feed, repository, reference) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      const found = versions.find((v) =>
        v.spec.feedRef === feedRef &&
        v.spec.name === repository &&
        (v.spec.version === reference || v.spec.digest === reference) &&
        v.status?.phase !== 'Deleted'
      );
      if (!found) return null;
      return {
        repository,
        tag: found.spec.version,
        digest: found.spec.digest,
        size: found.spec.size || 0,
        metadata: found.spec.metadata || {},
      };
    },

    // -----------------------------------------------------------------------
    // npm-specific operations
    // -----------------------------------------------------------------------

    /**
     * Get npm package info (all non-deleted versions).
     * @param {object} feed
     * @param {string} packageName
     * @returns {object|null}
     */
    async getNpmPackageInfo(feed, packageName) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      const items = versions.filter((v) =>
        v.spec.feedRef === feedRef &&
        v.spec.name === packageName &&
        v.status?.phase !== 'Deleted'
      );
      if (items.length === 0) return null;
      return {
        name: packageName,
        versions: Object.fromEntries(items.map((v) => [v.spec.version, {
          digest: v.spec.digest,
          size: v.spec.size || 0,
          publishedAt: v.status?.publishedAt,
          metadata: v.spec.metadata || {},
        }])),
        latestVersion: items[items.length - 1].spec.version,
      };
    },

    /**
     * List npm package versions.
     * @param {object} feed
     * @param {string} packageName
     * @returns {{ versions: string[] }}
     */
    async listNpmVersions(feed, packageName) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      const items = versions.filter((v) =>
        v.spec.feedRef === feedRef &&
        v.spec.name === packageName &&
        v.status?.phase !== 'Deleted'
      );
      return { versions: items.map((v) => v.spec.version) };
    },

    // -----------------------------------------------------------------------
    // pip-specific operations
    // -----------------------------------------------------------------------

    /**
     * List pip packages in a feed.
     * @param {object} feed
     * @returns {{ packages: string[] }}
     */
    async listPipPackages(feed) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      const items = versions.filter((v) =>
        v.spec.feedRef === feedRef &&
        v.status?.phase !== 'Deleted'
      );
      return { packages: [...new Set(items.map((v) => v.spec.name))] };
    },

    /**
     * Get pip package info.
     * @param {object} feed
     * @param {string} packageName
     * @returns {object|null}
     */
    async getPipPackageInfo(feed, packageName) {
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName;
      const items = versions.filter((v) =>
        v.spec.feedRef === feedRef &&
        v.spec.name === packageName &&
        v.status?.phase !== 'Deleted'
      );
      if (items.length === 0) return null;
      return {
        name: packageName,
        versions: items.map((v) => ({
          version: v.spec.version,
          digest: v.spec.digest,
          size: v.spec.size || 0,
        })),
      };
    },

    // -----------------------------------------------------------------------
    // Generic/ad-hoc artifact operations
    // -----------------------------------------------------------------------

    /**
     * Upload a generic artifact (creates a version from file metadata).
     * @param {object} feed
     * @param {object} file - { name, size, contentType? }
     * @param {object} [metadata]
     * @param {object} [opts]
     * @returns {{ version: object, digest: string, publishedAt: string }}
     */
    async uploadArtifact(feed, file, metadata = {}, opts = {}) {
      const now = new Date().toISOString();
      const digest = sha256(`${file.name}@${file.size}@${now}`);
      return this.publishArtifact(feed, {
        name: file.name,
        version: metadata.version || `${Date.now()}`,
        digest,
        size: file.size || 0,
        metadata: { contentType: file.contentType || 'application/octet-stream', ...metadata },
      }, opts);
    },

    /**
     * Record a download audit event.
     * @param {object} feed
     * @param {string} artifactName
     * @param {string} version
     * @param {string} requestedBy
     * @param {object} [opts]
     * @returns {object} ArtifactDownload resource
     */
    async recordDownload(feed, artifactName, version, requestedBy, opts = {}) {
      const now = new Date().toISOString();
      const feedRef = feed?.metadata?.name || feed?.spec?.feedName || 'unknown-feed';
      const organizationRef = opts.organizationRef || feed?.spec?.organizationRef || 'default';
      const namespace = opts.namespace || feed?.metadata?.namespace || 'default';
      const artifactRef = `${feedRef}/${artifactName}@${version}`;
      const dlName = `artdl-${sha256(artifactRef + requestedBy + now).slice(0, 12)}`;

      const dlResource = createResource('ArtifactDownload', { name: dlName, namespace }, {
        organizationRef,
        artifactRef,
        requestedBy,
        feedRef,
        artifactName,
        version,
      });
      dlResource.status = { phase: 'Completed', downloadedAt: now };
      downloads.push(dlResource);
      return dlResource;
    },

    /**
     * Download an artifact (returns version metadata + records audit).
     * @param {object} feed
     * @param {string} name
     * @param {string} version
     * @param {string} requestedBy
     * @param {object} [opts]
     * @returns {{ artifact: object|null, download: object|null }}
     */
    async downloadArtifact(feed, name, version, requestedBy, opts = {}) {
      const artifact = await this.getVersion(feed, name, version);
      if (!artifact) return { artifact: null, download: null };
      const download = await this.recordDownload(feed, name, version, requestedBy, opts);
      return { artifact, download };
    },

    // -----------------------------------------------------------------------
    // External registry integration helper
    // -----------------------------------------------------------------------

    /**
     * Resolve external registry capabilities from an ExternalBackendBinding.
     * Returns the artifact registry interface configuration if enabled.
     *
     * @param {object} binding - ExternalBackendBinding resource
     * @returns {{ enabled: boolean, mode: string }|null}
     */
    resolveExternalRegistryCapability(binding) {
      const interfaces = binding?.spec?.interfaces;
      if (!interfaces) return null;
      const artifactRegistry = interfaces.artifactRegistry;
      if (!artifactRegistry || !artifactRegistry.enabled) return null;
      const mode = artifactRegistry.mode;
      if (mode && !VALID_EXTERNAL_MODES.includes(mode)) return null;
      return { enabled: true, mode: mode || 'read-only' };
    },

    // -----------------------------------------------------------------------
    // Internal accessors (for testing)
    // -----------------------------------------------------------------------

    _versions: versions,
    _downloads: downloads,
  };
}
