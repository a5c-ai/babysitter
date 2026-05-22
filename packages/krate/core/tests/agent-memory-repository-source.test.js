// Slice 2.3a — AgentMemoryRepository & AgentMemorySource Controllers
// TDD: tests written BEFORE implementation.
//
// AgentMemoryRepository: org-level memory storage pointer, git repo ref validation.
// AgentMemorySource: read policies for memory paths, access control.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createResource,
  validateMemoryRepository,
  validateMemorySource,
  createAgentMemoryRepositoryController,
  createAgentMemorySourceController,
  AGENT_MEMORY_REPOSITORY_CONTROLLER_BOUNDARY,
  AGENT_MEMORY_SOURCE_CONTROLLER_BOUNDARY,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMemoryRepository(name, overrides = {}) {
  return createResource('AgentMemoryRepository', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'acme',
    repositoryRef: 'company-brain',
    defaultBranch: 'main',
    layoutProfile: 'standard',
    repoUrl: 'https://github.com/acme/company-brain.git',
    ...overrides,
  });
}

function makeMemorySource(name, overrides = {}) {
  return createResource('AgentMemorySource', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'acme',
    repositoryRef: 'company-brain',
    appliesTo: { kind: 'AgentStack', name: 'my-stack' },
    include: { paths: ['docs/**', 'records/**'] },
    paths: ['docs/**', 'records/**'],
    ...overrides,
  });
}

// ===========================================================================
// AgentMemoryRepository — controller factory
// ===========================================================================

test('createAgentMemoryRepositoryController returns controller with expected methods', () => {
  const controller = createAgentMemoryRepositoryController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validateMemoryRepository, 'function', 'must expose validateMemoryRepository');
  assert.equal(typeof controller.getRepositoryUrl, 'function', 'must expose getRepositoryUrl');
  assert.equal(typeof controller.getRetentionPolicy, 'function', 'must expose getRetentionPolicy');
  assert.equal(controller.role, 'agent-memory-repository-controller', 'must declare its role');
});

// ---------------------------------------------------------------------------
// validateMemoryRepository — happy path
// ---------------------------------------------------------------------------

test('validateMemoryRepository accepts valid config with name, orgRef, and repoUrl', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = makeMemoryRepository('brain-repo');

  const result = controller.validateMemoryRepository(repo);

  assert.equal(result.valid, true, 'valid config must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must contain an errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for a valid config');
});

// ---------------------------------------------------------------------------
// validateMemoryRepository — missing name
// ---------------------------------------------------------------------------

test('validateMemoryRepository rejects missing name', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentMemoryRepository',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: {
      organizationRef: 'acme',
      repositoryRef: 'company-brain',
      defaultBranch: 'main',
      layoutProfile: 'standard',
      repoUrl: 'https://github.com/acme/brain.git',
    },
    status: {},
  };

  const result = controller.validateMemoryRepository(repo);

  assert.equal(result.valid, false, 'missing name must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'at least one error must mention "name"'
  );
});

// ---------------------------------------------------------------------------
// validateMemoryRepository — missing repoUrl
// ---------------------------------------------------------------------------

test('validateMemoryRepository rejects missing repoUrl', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = makeMemoryRepository('no-url-repo');
  delete repo.spec.repoUrl;

  const result = controller.validateMemoryRepository(repo);

  assert.equal(result.valid, false, 'missing repoUrl must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some((e) => /repoUrl/i.test(e)),
    'at least one error must mention "repoUrl"'
  );
});

// ---------------------------------------------------------------------------
// validateMemoryRepository — invalid repoUrl (not git/http/ssh URL)
// ---------------------------------------------------------------------------

test('validateMemoryRepository rejects invalid repoUrl (not git/http/ssh URL)', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = makeMemoryRepository('bad-url-repo', { repoUrl: 'ftp://not-a-git-url.example.com/repo' });

  const result = controller.validateMemoryRepository(repo);

  assert.equal(result.valid, false, 'invalid repoUrl protocol must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some((e) => /repoUrl/i.test(e)),
    'at least one error must mention "repoUrl"'
  );
});

test('validateMemoryRepository accepts git+ssh URL (git@ format)', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = makeMemoryRepository('ssh-repo', { repoUrl: 'git@github.com:acme/company-brain.git' });

  const result = controller.validateMemoryRepository(repo);

  assert.equal(result.valid, true, 'git@host:path.git URL must pass validation');
  assert.equal(result.errors.length, 0, 'errors must be empty for valid git ssh URL');
});

test('validateMemoryRepository accepts ssh:// URL', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = makeMemoryRepository('ssh-proto-repo', { repoUrl: 'ssh://git@github.com/acme/brain.git' });

  const result = controller.validateMemoryRepository(repo);

  assert.equal(result.valid, true, 'ssh:// URL must pass validation');
  assert.equal(result.errors.length, 0, 'errors must be empty for valid ssh:// URL');
});

// ---------------------------------------------------------------------------
// getRepositoryUrl — returns configured URL
// ---------------------------------------------------------------------------

test('getRepositoryUrl returns the configured repoUrl from spec', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = makeMemoryRepository('url-repo', { repoUrl: 'https://github.com/acme/brain.git' });

  const url = controller.getRepositoryUrl(repo);

  assert.equal(url, 'https://github.com/acme/brain.git', 'must return spec repoUrl');
});

test('getRepositoryUrl throws on null resource', () => {
  const controller = createAgentMemoryRepositoryController();

  assert.throws(
    () => controller.getRepositoryUrl(null),
    /null|undefined/i,
    'getRepositoryUrl must throw on null resource'
  );
});

// ---------------------------------------------------------------------------
// getRetentionPolicy — returns retention config with defaults
// ---------------------------------------------------------------------------

test('getRetentionPolicy returns retention config with defaults (maxAgeDays: 90, maxSizeMb: 500)', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = makeMemoryRepository('retention-repo');

  const policy = controller.getRetentionPolicy(repo);

  assert.ok(policy, 'getRetentionPolicy must return a value');
  assert.equal(policy.maxAgeDays, 90, 'default maxAgeDays must be 90');
  assert.equal(policy.maxSizeMb, 500, 'default maxSizeMb must be 500');
});

test('getRetentionPolicy merges spec retentionPolicy with defaults', () => {
  const controller = createAgentMemoryRepositoryController();
  const repo = makeMemoryRepository('custom-retention-repo', {
    retentionPolicy: { maxAgeDays: 180, maxSizeMb: 1000 },
  });

  const policy = controller.getRetentionPolicy(repo);

  assert.equal(policy.maxAgeDays, 180, 'spec maxAgeDays must override default');
  assert.equal(policy.maxSizeMb, 1000, 'spec maxSizeMb must override default');
});

test('getRetentionPolicy throws on null resource', () => {
  const controller = createAgentMemoryRepositoryController();

  assert.throws(
    () => controller.getRetentionPolicy(null),
    /null|undefined/i,
    'getRetentionPolicy must throw on null resource'
  );
});

// ---------------------------------------------------------------------------
// validateMemoryRepository — rejects null resource
// ---------------------------------------------------------------------------

test('validateMemoryRepository rejects null resource', () => {
  const controller = createAgentMemoryRepositoryController();

  const result = controller.validateMemoryRepository(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some((e) => /null|undefined/i.test(e)),
    'error must mention null or undefined'
  );
});

// ---------------------------------------------------------------------------
// validateMemoryRepository standalone export
// ---------------------------------------------------------------------------

test('validateMemoryRepository standalone export follows existing pattern', () => {
  assert.equal(typeof validateMemoryRepository, 'function', 'validateMemoryRepository must be a named export');

  const repo = makeMemoryRepository('standalone-validate-repo');
  const result = validateMemoryRepository(repo);

  assert.ok(result, 'must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.ok(Array.isArray(result.errors), 'result must have an errors array');
  assert.equal(result.valid, true, 'a fully-specified repo must pass standalone validation');
});

// ---------------------------------------------------------------------------
// BOUNDARY — AgentMemoryRepository
// ---------------------------------------------------------------------------

test('AGENT_MEMORY_REPOSITORY_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(AGENT_MEMORY_REPOSITORY_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(
    AGENT_MEMORY_REPOSITORY_CONTROLLER_BOUNDARY.role,
    'agent-memory-repository-controller',
    'BOUNDARY role must be "agent-memory-repository-controller"'
  );
  assert.ok(
    Array.isArray(AGENT_MEMORY_REPOSITORY_CONTROLLER_BOUNDARY.owns),
    'BOUNDARY must declare owned concerns'
  );
});

// ===========================================================================
// AgentMemorySource — controller factory
// ===========================================================================

test('createAgentMemorySourceController returns controller with expected methods', () => {
  const controller = createAgentMemorySourceController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validateMemorySource, 'function', 'must expose validateMemorySource');
  assert.equal(typeof controller.getReadPolicy, 'function', 'must expose getReadPolicy');
  assert.equal(typeof controller.getIncludedPaths, 'function', 'must expose getIncludedPaths');
  assert.equal(typeof controller.getExcludedPaths, 'function', 'must expose getExcludedPaths');
  assert.equal(controller.role, 'agent-memory-source-controller', 'must declare its role');
});

// ---------------------------------------------------------------------------
// validateMemorySource — happy path
// ---------------------------------------------------------------------------

test('validateMemorySource accepts valid config (name, orgRef, repositoryRef, paths)', () => {
  const controller = createAgentMemorySourceController();
  const source = makeMemorySource('good-source');

  const result = controller.validateMemorySource(source);

  assert.equal(result.valid, true, 'valid config must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must contain an errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for a valid config');
});

// ---------------------------------------------------------------------------
// validateMemorySource — missing repositoryRef
// ---------------------------------------------------------------------------

test('validateMemorySource rejects missing repositoryRef', () => {
  const controller = createAgentMemorySourceController();
  const source = makeMemorySource('no-repo-source');
  delete source.spec.repositoryRef;

  const result = controller.validateMemorySource(source);

  assert.equal(result.valid, false, 'missing repositoryRef must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some((e) => /repositoryRef/i.test(e)),
    'at least one error must mention "repositoryRef"'
  );
});

// ---------------------------------------------------------------------------
// validateMemorySource — empty paths array
// ---------------------------------------------------------------------------

test('validateMemorySource rejects empty paths array', () => {
  const controller = createAgentMemorySourceController();
  const source = makeMemorySource('empty-paths-source', { paths: [] });

  const result = controller.validateMemorySource(source);

  assert.equal(result.valid, false, 'empty paths must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some((e) => /paths/i.test(e)),
    'at least one error must mention "paths"'
  );
});

// ---------------------------------------------------------------------------
// validateMemorySource — rejects null resource
// ---------------------------------------------------------------------------

test('validateMemorySource rejects null resource', () => {
  const controller = createAgentMemorySourceController();

  const result = controller.validateMemorySource(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.length > 0, 'errors must not be empty');
  assert.ok(
    result.errors.some((e) => /null|undefined/i.test(e)),
    'error must mention null or undefined'
  );
});

// ---------------------------------------------------------------------------
// getReadPolicy — returns access policy with defaults
// ---------------------------------------------------------------------------

test('getReadPolicy returns access policy from spec with defaults', () => {
  const controller = createAgentMemorySourceController();
  const source = makeMemorySource('policy-source');

  const policy = controller.getReadPolicy(source);

  assert.ok(policy, 'getReadPolicy must return a value');
  assert.ok('mode' in policy, 'policy must include a mode');
  assert.ok('maxDepth' in policy, 'policy must include a maxDepth default');
});

test('getReadPolicy merges spec readPolicy with defaults', () => {
  const controller = createAgentMemorySourceController();
  const source = makeMemorySource('custom-policy-source', {
    readPolicy: { mode: 'allow-list', maxDepth: 3 },
  });

  const policy = controller.getReadPolicy(source);

  assert.equal(policy.mode, 'allow-list', 'spec mode must override default');
  assert.equal(policy.maxDepth, 3, 'spec maxDepth must override default');
});

test('getReadPolicy throws on null resource', () => {
  const controller = createAgentMemorySourceController();

  assert.throws(
    () => controller.getReadPolicy(null),
    /null|undefined/i,
    'getReadPolicy must throw on null resource'
  );
});

// ---------------------------------------------------------------------------
// getIncludedPaths — returns the paths array
// ---------------------------------------------------------------------------

test('getIncludedPaths returns the paths array from spec', () => {
  const controller = createAgentMemorySourceController();
  const source = makeMemorySource('paths-source', { paths: ['docs/**', 'records/**', 'ontology/**'] });

  const paths = controller.getIncludedPaths(source);

  assert.ok(Array.isArray(paths), 'getIncludedPaths must return an array');
  assert.equal(paths.length, 3, 'must return all 3 paths');
  assert.ok(paths.includes('docs/**'), 'must include docs/**');
  assert.ok(paths.includes('records/**'), 'must include records/**');
  assert.ok(paths.includes('ontology/**'), 'must include ontology/**');
});

test('getIncludedPaths throws on null resource', () => {
  const controller = createAgentMemorySourceController();

  assert.throws(
    () => controller.getIncludedPaths(null),
    /null|undefined/i,
    'getIncludedPaths must throw on null resource'
  );
});

// ---------------------------------------------------------------------------
// getExcludedPaths — returns excluded paths or empty array
// ---------------------------------------------------------------------------

test('getExcludedPaths returns empty array when no excludedPaths in spec', () => {
  const controller = createAgentMemorySourceController();
  const source = makeMemorySource('no-exclude-source');

  const excluded = controller.getExcludedPaths(source);

  assert.ok(Array.isArray(excluded), 'getExcludedPaths must return an array');
  assert.equal(excluded.length, 0, 'must return empty array when no excludedPaths set');
});

test('getExcludedPaths returns excluded paths from spec', () => {
  const controller = createAgentMemorySourceController();
  const source = makeMemorySource('exclude-source', {
    excludedPaths: ['secrets/**', 'tmp/**'],
  });

  const excluded = controller.getExcludedPaths(source);

  assert.ok(Array.isArray(excluded), 'getExcludedPaths must return an array');
  assert.equal(excluded.length, 2, 'must return both excluded paths');
  assert.ok(excluded.includes('secrets/**'), 'must include secrets/**');
  assert.ok(excluded.includes('tmp/**'), 'must include tmp/**');
});

test('getExcludedPaths throws on null resource', () => {
  const controller = createAgentMemorySourceController();

  assert.throws(
    () => controller.getExcludedPaths(null),
    /null|undefined/i,
    'getExcludedPaths must throw on null resource'
  );
});

// ---------------------------------------------------------------------------
// validateMemorySource standalone export
// ---------------------------------------------------------------------------

test('validateMemorySource standalone export follows existing pattern', () => {
  assert.equal(typeof validateMemorySource, 'function', 'validateMemorySource must be a named export');

  const source = makeMemorySource('standalone-validate-source');
  const result = validateMemorySource(source);

  assert.ok(result, 'must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.ok(Array.isArray(result.errors), 'result must have an errors array');
  assert.equal(result.valid, true, 'a fully-specified source must pass standalone validation');
});

// ---------------------------------------------------------------------------
// BOUNDARY — AgentMemorySource
// ---------------------------------------------------------------------------

test('AGENT_MEMORY_SOURCE_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(AGENT_MEMORY_SOURCE_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(
    AGENT_MEMORY_SOURCE_CONTROLLER_BOUNDARY.role,
    'agent-memory-source-controller',
    'BOUNDARY role must be "agent-memory-source-controller"'
  );
  assert.ok(
    Array.isArray(AGENT_MEMORY_SOURCE_CONTROLLER_BOUNDARY.owns),
    'BOUNDARY must declare owned concerns'
  );
});

// ---------------------------------------------------------------------------
// validate — accumulates multiple errors (source)
// ---------------------------------------------------------------------------

test('validateMemorySource accumulates all errors when multiple fields are invalid', () => {
  const controller = createAgentMemorySourceController();
  const source = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentMemorySource',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: { organizationRef: 'acme', appliesTo: {}, include: {} },
    status: {},
  };

  const result = controller.validateMemorySource(source);

  assert.equal(result.valid, false, 'config with multiple missing fields must fail');
  assert.ok(result.errors.length >= 2, 'must accumulate at least two errors');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'errors must include a name error'
  );
  assert.ok(
    result.errors.some((e) => /repositoryRef/i.test(e)),
    'errors must include a repositoryRef error'
  );
});
