import assert from 'node:assert/strict';
import test from 'node:test';
import { createArtifactRegistryController } from '../src/artifact-registry-controller.js';
import { validateResource, createResource, RESOURCE_DEFINITIONS, CONFIG_KINDS, AGGREGATED_KINDS, ALL_KINDS } from '../src/resource-model.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRegistry(overrides = {}) {
  return {
    metadata: { name: 'my-npm-registry' },
    spec: {
      organizationRef: 'acme',
      registryType: 'npm',
      storageBackend: 'internal',
      ...overrides,
    },
  };
}

function makeFeed(overrides = {}) {
  return {
    metadata: { name: 'my-feed' },
    spec: {
      organizationRef: 'acme',
      registryRef: 'my-npm-registry',
      feedName: '@acme',
      ...overrides,
    },
  };
}

function makeAccessPolicy(overrides = {}) {
  return {
    metadata: { name: 'my-policy' },
    spec: {
      organizationRef: 'acme',
      feedRef: 'my-feed',
      subjects: ['user:alice', 'team:platform'],
      permissions: ['read', 'write'],
      ...overrides,
    },
  };
}

// ---------------------------------------------------------------------------
// Resource model integration
// ---------------------------------------------------------------------------

test('resource model includes ArtifactRegistry in CONFIG_KINDS', () => {
  assert.ok(CONFIG_KINDS.has('ArtifactRegistry'));
  assert.ok(CONFIG_KINDS.has('ArtifactFeed'));
  assert.ok(CONFIG_KINDS.has('ArtifactAccessPolicy'));
});

test('resource model includes ArtifactVersion and ArtifactDownload in AGGREGATED_KINDS', () => {
  assert.ok(AGGREGATED_KINDS.has('ArtifactVersion'));
  assert.ok(AGGREGATED_KINDS.has('ArtifactDownload'));
});

test('ALL_KINDS includes all 5 artifact kinds', () => {
  for (const kind of ['ArtifactRegistry', 'ArtifactFeed', 'ArtifactAccessPolicy', 'ArtifactVersion', 'ArtifactDownload']) {
    assert.ok(ALL_KINDS.has(kind), `ALL_KINDS should include ${kind}`);
  }
});

test('RESOURCE_DEFINITIONS has correct definitions for artifact kinds', () => {
  assert.equal(RESOURCE_DEFINITIONS.ArtifactRegistry.storage, 'etcd');
  assert.equal(RESOURCE_DEFINITIONS.ArtifactRegistry.context, 'artifacts');
  assert.equal(RESOURCE_DEFINITIONS.ArtifactRegistry.plural, 'artifactregistries');
  assert.equal(RESOURCE_DEFINITIONS.ArtifactVersion.storage, 'postgres');
  assert.equal(RESOURCE_DEFINITIONS.ArtifactDownload.storage, 'postgres');
});

test('createResource works for ArtifactRegistry', () => {
  const resource = createResource('ArtifactRegistry', { name: 'test-reg' }, { organizationRef: 'acme', registryType: 'npm', storageBackend: 'internal' });
  assert.equal(resource.kind, 'ArtifactRegistry');
  assert.equal(resource.spec.registryType, 'npm');
});

test('validateResource enforces required spec for ArtifactRegistry', () => {
  const resource = createResource('ArtifactRegistry', { name: 'test-reg' }, { organizationRef: 'acme', registryType: 'npm', storageBackend: 's3' });
  assert.doesNotThrow(() => validateResource(resource));
});

test('validateResource rejects ArtifactRegistry with missing required fields', () => {
  const resource = createResource('ArtifactRegistry', { name: 'test-reg' }, { organizationRef: 'acme' });
  assert.throws(() => validateResource(resource), /registryType/);
});

// ---------------------------------------------------------------------------
// Registry validation
// ---------------------------------------------------------------------------

test('validateRegistry accepts valid npm registry config', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateRegistry(makeRegistry({ registryType: 'npm' }));
  assert.ok(result.valid);
  assert.equal(result.errors.length, 0);
});

test('validateRegistry accepts valid docker registry config', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateRegistry(makeRegistry({ registryType: 'docker', storageBackend: 's3' }));
  assert.ok(result.valid);
  assert.equal(result.errors.length, 0);
});

test('validateRegistry accepts valid pip registry config', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateRegistry(makeRegistry({ registryType: 'pip', storageBackend: 'gcs' }));
  assert.ok(result.valid);
});

test('validateRegistry accepts generic type', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateRegistry(makeRegistry({ registryType: 'generic', storageBackend: 'azure-blob' }));
  assert.ok(result.valid);
});

test('validateRegistry rejects unknown type', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateRegistry(makeRegistry({ registryType: 'maven' }));
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('maven')));
  assert.ok(result.errors.some((e) => e.includes('not supported')));
});

test('validateRegistry rejects missing storageBackend', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateRegistry({ metadata: { name: 'r' }, spec: { organizationRef: 'acme', registryType: 'npm' } });
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('storageBackend')));
});

test('validateRegistry rejects null resource', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateRegistry(null);
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('null')));
});

// ---------------------------------------------------------------------------
// Feed validation
// ---------------------------------------------------------------------------

test('validateFeed accepts valid feed with registryRef', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateFeed(makeFeed());
  assert.ok(result.valid);
  assert.equal(result.errors.length, 0);
});

test('validateFeed rejects missing feedName', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateFeed(makeFeed({ feedName: '' }));
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('feedName')));
});

test('validateFeed rejects missing registryRef', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateFeed({ metadata: { name: 'f' }, spec: { organizationRef: 'acme', feedName: 'test' } });
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('registryRef')));
});

// ---------------------------------------------------------------------------
// Access policy validation
// ---------------------------------------------------------------------------

test('validateAccessPolicy accepts valid policy with subjects and permissions', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateAccessPolicy(makeAccessPolicy());
  assert.ok(result.valid);
});

test('validateAccessPolicy rejects empty subjects', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateAccessPolicy(makeAccessPolicy({ subjects: [] }));
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('subjects')));
});

test('validateAccessPolicy rejects unknown permissions', () => {
  const controller = createArtifactRegistryController();
  const result = controller.validateAccessPolicy(makeAccessPolicy({ permissions: ['read', 'delete'] }));
  assert.ok(!result.valid);
  assert.ok(result.errors.some((e) => e.includes('delete')));
});

// ---------------------------------------------------------------------------
// Registry endpoint
// ---------------------------------------------------------------------------

test('getRegistryEndpoint returns internal URL for internal backend', () => {
  const controller = createArtifactRegistryController();
  const registry = makeRegistry();
  const url = controller.getRegistryEndpoint(registry);
  assert.ok(url.includes('/api/v1/registry/npm/acme'));
  assert.ok(url.startsWith('https://kradle.example.com'));
});

test('getRegistryEndpoint returns external URL for npm.pkg.github.com', () => {
  const controller = createArtifactRegistryController();
  const registry = makeRegistry({
    registryType: 'npm',
    storageBackend: 's3',
    externalBackendRef: 'github-packages',
    externalUrl: 'https://npm.pkg.github.com/@acme',
  });
  const url = controller.getRegistryEndpoint(registry);
  assert.equal(url, 'https://npm.pkg.github.com/@acme');
});

test('getRegistryEndpoint returns external URL for ghcr.io', () => {
  const controller = createArtifactRegistryController();
  const registry = makeRegistry({
    registryType: 'docker',
    storageBackend: 's3',
    externalBackendRef: 'github-packages',
    externalUrl: 'https://ghcr.io/acme',
  });
  const url = controller.getRegistryEndpoint(registry);
  assert.equal(url, 'https://ghcr.io/acme');
});

test('getRegistryEndpoint generates default external npm URL when no externalUrl', () => {
  const controller = createArtifactRegistryController();
  const registry = makeRegistry({
    registryType: 'npm',
    storageBackend: 's3',
    externalBackendRef: 'github-packages',
  });
  const url = controller.getRegistryEndpoint(registry);
  assert.equal(url, 'https://npm.pkg.github.com/@acme');
});

// ---------------------------------------------------------------------------
// Artifact publish / list / get / delete
// ---------------------------------------------------------------------------

test('publishArtifact creates ArtifactVersion with digest', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  const result = await controller.publishArtifact(feed, {
    name: '@acme/utils',
    version: '1.0.0',
    size: 12345,
    metadata: { license: 'MIT' },
  });
  assert.ok(result.version);
  assert.equal(result.version.kind, 'ArtifactVersion');
  assert.equal(result.version.spec.name, '@acme/utils');
  assert.equal(result.version.spec.version, '1.0.0');
  assert.ok(result.digest);
  assert.ok(result.publishedAt);
  assert.equal(result.version.status.phase, 'Published');
});

test('listVersions returns paginated versions', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: 'pkg-a', version: '1.0.0', digest: 'aaa' });
  await controller.publishArtifact(feed, { name: 'pkg-a', version: '2.0.0', digest: 'bbb' });
  await controller.publishArtifact(feed, { name: 'pkg-b', version: '1.0.0', digest: 'ccc' });

  const all = await controller.listVersions(feed);
  assert.equal(all.total, 3);
  assert.equal(all.items.length, 3);

  const filtered = await controller.listVersions(feed, { name: 'pkg-a' });
  assert.equal(filtered.total, 2);

  const paginated = await controller.listVersions(feed, { limit: 1, offset: 1 });
  assert.equal(paginated.items.length, 1);
  assert.equal(paginated.total, 3);
});

test('getVersion returns specific version', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: 'my-lib', version: '3.2.1', digest: 'xyz' });
  const version = await controller.getVersion(feed, 'my-lib', '3.2.1');
  assert.ok(version);
  assert.equal(version.spec.name, 'my-lib');
  assert.equal(version.spec.version, '3.2.1');
});

test('getVersion returns null for non-existent version', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  const result = await controller.getVersion(feed, 'nope', '0.0.0');
  assert.equal(result, null);
});

test('deleteVersion marks as deleted', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: 'doomed', version: '1.0.0', digest: 'ddd' });
  const result = await controller.deleteVersion(feed, 'doomed', '1.0.0');
  assert.ok(result.deleted);
  assert.ok(result.deletedAt);

  // getVersion should not return soft-deleted versions
  const version = await controller.getVersion(feed, 'doomed', '1.0.0');
  assert.equal(version, null);
});

test('deleteVersion returns deleted: false for non-existent version', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  const result = await controller.deleteVersion(feed, 'nope', '0.0.0');
  assert.ok(!result.deleted);
});

// ---------------------------------------------------------------------------
// Docker-specific
// ---------------------------------------------------------------------------

test('Docker: listDockerTags returns tags', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed({ feedName: 'docker-feed' });
  await controller.publishArtifact(feed, { name: 'myapp', version: 'v1.0', digest: 'd1' });
  await controller.publishArtifact(feed, { name: 'myapp', version: 'v1.1', digest: 'd2' });
  await controller.publishArtifact(feed, { name: 'other', version: 'latest', digest: 'd3' });

  const result = await controller.listDockerTags(feed, 'myapp');
  assert.equal(result.tags.length, 2);
  assert.ok(result.tags.includes('v1.0'));
  assert.ok(result.tags.includes('v1.1'));
});

test('Docker: getDockerManifest returns manifest by tag', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: 'myapp', version: 'latest', digest: 'sha256:abc123', size: 50000 });
  const manifest = await controller.getDockerManifest(feed, 'myapp', 'latest');
  assert.ok(manifest);
  assert.equal(manifest.repository, 'myapp');
  assert.equal(manifest.tag, 'latest');
  assert.equal(manifest.digest, 'sha256:abc123');
  assert.equal(manifest.size, 50000);
});

// ---------------------------------------------------------------------------
// npm-specific
// ---------------------------------------------------------------------------

test('npm: getNpmPackageInfo returns package metadata', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: '@acme/sdk', version: '1.0.0', digest: 'n1', size: 100 });
  await controller.publishArtifact(feed, { name: '@acme/sdk', version: '2.0.0', digest: 'n2', size: 200 });

  const info = await controller.getNpmPackageInfo(feed, '@acme/sdk');
  assert.ok(info);
  assert.equal(info.name, '@acme/sdk');
  assert.equal(info.latestVersion, '2.0.0');
  assert.ok(info.versions['1.0.0']);
  assert.ok(info.versions['2.0.0']);
});

test('npm: getNpmPackageInfo returns null for unknown package', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  const info = await controller.getNpmPackageInfo(feed, '@acme/unknown');
  assert.equal(info, null);
});

test('npm: listNpmVersions returns versions', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: '@acme/lib', version: '0.1.0', digest: 'v1' });
  await controller.publishArtifact(feed, { name: '@acme/lib', version: '0.2.0', digest: 'v2' });

  const result = await controller.listNpmVersions(feed, '@acme/lib');
  assert.equal(result.versions.length, 2);
  assert.ok(result.versions.includes('0.1.0'));
  assert.ok(result.versions.includes('0.2.0'));
});

// ---------------------------------------------------------------------------
// pip-specific
// ---------------------------------------------------------------------------

test('pip: listPipPackages returns packages', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: 'my-package', version: '1.0', digest: 'p1' });
  await controller.publishArtifact(feed, { name: 'another-package', version: '2.0', digest: 'p2' });

  const result = await controller.listPipPackages(feed);
  assert.equal(result.packages.length, 2);
  assert.ok(result.packages.includes('my-package'));
  assert.ok(result.packages.includes('another-package'));
});

test('pip: getPipPackageInfo returns package info', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: 'flask-ext', version: '0.1.0', digest: 'pp1' });
  const info = await controller.getPipPackageInfo(feed, 'flask-ext');
  assert.ok(info);
  assert.equal(info.name, 'flask-ext');
  assert.equal(info.versions.length, 1);
  assert.equal(info.versions[0].version, '0.1.0');
});

// ---------------------------------------------------------------------------
// Generic/ad-hoc
// ---------------------------------------------------------------------------

test('Generic: uploadArtifact creates version from file', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  const result = await controller.uploadArtifact(feed, { name: 'build.tar.gz', size: 100000 }, { version: '20240101' });
  assert.ok(result.version);
  assert.equal(result.version.spec.name, 'build.tar.gz');
  assert.ok(result.digest);
});

test('Generic: downloadArtifact returns artifact and records audit', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  await controller.publishArtifact(feed, { name: 'release.zip', version: '1.0', digest: 'gen1', size: 50000 });
  const result = await controller.downloadArtifact(feed, 'release.zip', '1.0', 'user:bob');
  assert.ok(result.artifact);
  assert.ok(result.download);
  assert.equal(result.download.kind, 'ArtifactDownload');
  assert.equal(result.download.spec.requestedBy, 'user:bob');
});

test('Generic: downloadArtifact returns null for non-existent artifact', async () => {
  const controller = createArtifactRegistryController();
  const feed = makeFeed();
  const result = await controller.downloadArtifact(feed, 'nope', '0.0', 'user:bob');
  assert.equal(result.artifact, null);
  assert.equal(result.download, null);
});

// ---------------------------------------------------------------------------
// Access policy enforcement
// ---------------------------------------------------------------------------

test('Access policy enforces read permissions', () => {
  const controller = createArtifactRegistryController();
  const policy = makeAccessPolicy({ subjects: ['user:alice', 'user:bob'], permissions: ['read'] });
  assert.ok(controller.checkAccess(policy, 'user:alice', 'read'));
  assert.ok(!controller.checkAccess(policy, 'user:alice', 'write'));
  assert.ok(!controller.checkAccess(policy, 'user:alice', 'admin'));
  assert.ok(!controller.checkAccess(policy, 'user:charlie', 'read'));
});

test('Access policy enforces write permissions (implies read)', () => {
  const controller = createArtifactRegistryController();
  const policy = makeAccessPolicy({ subjects: ['user:alice'], permissions: ['write'] });
  assert.ok(controller.checkAccess(policy, 'user:alice', 'read'));
  assert.ok(controller.checkAccess(policy, 'user:alice', 'write'));
  assert.ok(!controller.checkAccess(policy, 'user:alice', 'admin'));
});

test('Access policy enforces admin permissions (implies read + write)', () => {
  const controller = createArtifactRegistryController();
  const policy = makeAccessPolicy({ subjects: ['team:platform'], permissions: ['admin'] });
  assert.ok(controller.checkAccess(policy, 'team:platform', 'read'));
  assert.ok(controller.checkAccess(policy, 'team:platform', 'write'));
  assert.ok(controller.checkAccess(policy, 'team:platform', 'admin'));
});

// ---------------------------------------------------------------------------
// External registry integration
// ---------------------------------------------------------------------------

test('resolveExternalRegistryCapability returns capability for enabled binding', () => {
  const controller = createArtifactRegistryController();
  const binding = {
    spec: { interfaces: { artifactRegistry: { enabled: true, mode: 'read-write' } } },
  };
  const result = controller.resolveExternalRegistryCapability(binding);
  assert.ok(result);
  assert.ok(result.enabled);
  assert.equal(result.mode, 'read-write');
});

test('resolveExternalRegistryCapability returns null for disabled binding', () => {
  const controller = createArtifactRegistryController();
  const binding = {
    spec: { interfaces: { artifactRegistry: { enabled: false } } },
  };
  const result = controller.resolveExternalRegistryCapability(binding);
  assert.equal(result, null);
});

test('resolveExternalRegistryCapability returns null for missing interfaces', () => {
  const controller = createArtifactRegistryController();
  const binding = { spec: {} };
  const result = controller.resolveExternalRegistryCapability(binding);
  assert.equal(result, null);
});

test('resolveExternalRegistryCapability defaults mode to read-only', () => {
  const controller = createArtifactRegistryController();
  const binding = {
    spec: { interfaces: { artifactRegistry: { enabled: true } } },
  };
  const result = controller.resolveExternalRegistryCapability(binding);
  assert.ok(result);
  assert.equal(result.mode, 'read-only');
});
