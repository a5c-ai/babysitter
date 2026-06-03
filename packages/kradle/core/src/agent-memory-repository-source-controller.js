// Agent Memory Repository & Source Controller — Slice 2.3a
//
// AgentMemoryRepository: org-level memory storage pointer, git repo ref validation.
// AgentMemorySource: read policies for memory paths, access control.

// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------

export const AGENT_MEMORY_REPOSITORY_CONTROLLER_BOUNDARY = {
  role: 'agent-memory-repository-controller',
  scope: 'AgentMemoryRepository lifecycle: validation, repo URL resolution, retention policy defaults',
  owns: ['memory repository validation', 'repo URL', 'retention policy defaults'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['git operations', 'secret values', 'Agent Mux sessions', 'memory search']
};

export const AGENT_MEMORY_SOURCE_CONTROLLER_BOUNDARY = {
  role: 'agent-memory-source-controller',
  scope: 'AgentMemorySource lifecycle: validation, read policy, included/excluded paths, access control',
  owns: ['memory source validation', 'read policy defaults', 'included paths', 'excluded paths'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['git operations', 'secret values', 'Agent Mux sessions', 'memory search']
};

// ---------------------------------------------------------------------------
// Constants — defaults
// ---------------------------------------------------------------------------

const DEFAULT_RETENTION_POLICY = Object.freeze({
  maxAgeDays: 90,
  maxSizeMb: 500,
});

const DEFAULT_READ_POLICY = Object.freeze({
  mode: 'allow-all',
  maxDepth: 5,
});

// Valid git/http/ssh URL schemes
// Accepted forms:
//   https://...   http://...   ssh://...   git://...   git@host:path (SCP-style)
const VALID_REPO_URL_PATTERNS = [
  /^https?:\/\//,
  /^ssh:\/\//,
  /^git:\/\//,
  /^git@[^:]+:.+/,
];

// ---------------------------------------------------------------------------
// Standalone validateMemoryRepository
// ---------------------------------------------------------------------------

/**
 * Validate an AgentMemoryRepository resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMemoryRepository(resource) {
  const errors = [];

  // Guard against null/undefined
  if (resource == null) {
    errors.push('resource must not be null or undefined');
    return { valid: false, errors };
  }

  // Validate metadata.name
  if (!resource.metadata?.name) {
    errors.push('metadata.name is required');
  }

  const spec = resource.spec || {};

  // Validate organizationRef
  if (!spec.organizationRef) {
    errors.push('spec.organizationRef is required');
  }

  // Validate repoUrl — presence
  if (!spec.repoUrl) {
    errors.push('spec.repoUrl is required; provide a git/http/ssh repository URL');
  } else {
    // Validate repoUrl — format (git/http/ssh/scp-style)
    const isValid = VALID_REPO_URL_PATTERNS.some((re) => re.test(spec.repoUrl));
    if (!isValid) {
      errors.push(
        'spec.repoUrl must be a valid git repository URL (https://, http://, ssh://, git://, or git@host:path format)'
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// AgentMemoryRepository controller factory
// ---------------------------------------------------------------------------

/**
 * Factory that returns an AgentMemoryRepository controller instance.
 */
export function createAgentMemoryRepositoryController() {
  return {
    role: 'agent-memory-repository-controller',

    /**
     * Validate an AgentMemoryRepository resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateMemoryRepository(resource) {
      return validateMemoryRepository(resource);
    },

    /**
     * Return the repository URL configured in spec.repoUrl.
     * @param {object} resource
     * @returns {string}
     */
    getRepositoryUrl(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      return resource.spec?.repoUrl ?? null;
    },

    /**
     * Return the effective retention policy for the memory repository.
     * Merges spec.retentionPolicy with defaults; spec values take precedence.
     * Defaults: maxAgeDays = 90, maxSizeMb = 500.
     * @param {object} resource
     * @returns {{ maxAgeDays: number, maxSizeMb: number }}
     */
    getRetentionPolicy(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const specPolicy = resource.spec?.retentionPolicy ?? {};
      return {
        maxAgeDays: specPolicy.maxAgeDays ?? DEFAULT_RETENTION_POLICY.maxAgeDays,
        maxSizeMb: specPolicy.maxSizeMb ?? DEFAULT_RETENTION_POLICY.maxSizeMb,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Standalone validateMemorySource
// ---------------------------------------------------------------------------

/**
 * Validate an AgentMemorySource resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMemorySource(resource) {
  const errors = [];

  // Guard against null/undefined
  if (resource == null) {
    errors.push('resource must not be null or undefined');
    return { valid: false, errors };
  }

  // Validate metadata.name
  if (!resource.metadata?.name) {
    errors.push('metadata.name is required');
  }

  const spec = resource.spec || {};

  // Validate organizationRef
  if (!spec.organizationRef) {
    errors.push('spec.organizationRef is required');
  }

  // Validate repositoryRef
  if (!spec.repositoryRef) {
    errors.push('spec.repositoryRef is required; provide a reference to the AgentMemoryRepository');
  }

  // Validate paths — must be present and non-empty
  const paths = spec.paths;
  if (!Array.isArray(paths) || paths.length === 0) {
    errors.push('spec.paths must be a non-empty array of memory path patterns');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// AgentMemorySource controller factory
// ---------------------------------------------------------------------------

/**
 * Factory that returns an AgentMemorySource controller instance.
 */
export function createAgentMemorySourceController() {
  return {
    role: 'agent-memory-source-controller',

    /**
     * Validate an AgentMemorySource resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateMemorySource(resource) {
      return validateMemorySource(resource);
    },

    /**
     * Return the effective read policy for the memory source.
     * Merges spec.readPolicy with defaults; spec values take precedence.
     * Defaults: mode = 'allow-all', maxDepth = 5.
     * @param {object} resource
     * @returns {{ mode: string, maxDepth: number }}
     */
    getReadPolicy(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const specPolicy = resource.spec?.readPolicy ?? {};
      return {
        mode: specPolicy.mode ?? DEFAULT_READ_POLICY.mode,
        maxDepth: specPolicy.maxDepth ?? DEFAULT_READ_POLICY.maxDepth,
      };
    },

    /**
     * Return the included memory path patterns from spec.paths.
     * @param {object} resource
     * @returns {string[]}
     */
    getIncludedPaths(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      return Array.isArray(resource.spec?.paths) ? [...resource.spec.paths] : [];
    },

    /**
     * Return the excluded memory path patterns from spec.excludedPaths.
     * Returns an empty array when not set.
     * @param {object} resource
     * @returns {string[]}
     */
    getExcludedPaths(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      return Array.isArray(resource.spec?.excludedPaths) ? [...resource.spec.excludedPaths] : [];
    },
  };
}
