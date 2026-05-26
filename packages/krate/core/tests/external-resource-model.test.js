import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CONFIG_KINDS,
  AGGREGATED_KINDS,
  ALL_KINDS,
  RESOURCE_DEFINITIONS,
  createResource,
  validateResource,
  resourceSchemaForKind,
  storageClassForKind,
  listResourceDefinitions
} from '../src/resource-model.js';

const EXTERNAL_CONFIG_KINDS = [
  'ExternalBackendProvider',
  'ExternalBackendBinding',
  'ExternalBackendSyncPolicy',
  'ExternalProviderCapabilityManifest'
];

const EXTERNAL_AGGREGATED_KINDS = [
  'ExternalWebhookDelivery',
  'ExternalSyncEvent',
  'ExternalSyncState',
  'ExternalWriteIntent',
  'ExternalSyncConflict',
  'ExternalObjectLink'
];

const ALL_EXTERNAL_KINDS = [...EXTERNAL_CONFIG_KINDS, ...EXTERNAL_AGGREGATED_KINDS];

/** Minimal valid spec for each external kind, satisfying requiredSpec. */
function minimalSpecForKind(kind) {
  const specs = {
    ExternalBackendProvider: { organizationRef: 'default', providerType: 'github', endpoint: 'https://api.github.com' },
    ExternalBackendBinding: { organizationRef: 'default', providerRef: 'github-provider', credentialRef: 'github-creds' },
    ExternalBackendSyncPolicy: { organizationRef: 'default', providerRef: 'github-provider', syncInterval: '5m' },
    ExternalProviderCapabilityManifest: { organizationRef: 'default', providerRef: 'github-provider', capabilities: ['webhooks', 'pull-requests'] },
    ExternalWebhookDelivery: { organizationRef: 'default', providerRef: 'github-provider', eventType: 'push', payload: {} },
    ExternalSyncEvent: { organizationRef: 'default', providerRef: 'github-provider', eventKind: 'repository.created', resourceRef: 'repo-1' },
    ExternalSyncState: { organizationRef: 'default', providerRef: 'github-provider', resourceRef: 'repo-1', phase: 'synced' },
    ExternalWriteIntent: { organizationRef: 'default', providerRef: 'github-provider', resourceRef: 'repo-1', operation: 'update' },
    ExternalSyncConflict: { organizationRef: 'default', providerRef: 'github-provider', resourceRef: 'repo-1', conflictKind: 'update-collision' },
    ExternalObjectLink: { organizationRef: 'default', providerRef: 'github-provider', externalId: 'github-repo-12345', localRef: 'repo-1' }
  };
  return specs[kind];
}

describe('external resource config kind membership', () => {
  for (const kind of EXTERNAL_CONFIG_KINDS) {
    it(`resource model includes ${kind} in config kinds`, () => {
      assert.ok(CONFIG_KINDS.has(kind), `${kind} should be in CONFIG_KINDS`);
    });
  }
});

describe('external resource aggregated kind membership', () => {
  for (const kind of EXTERNAL_AGGREGATED_KINDS) {
    it(`resource model includes ${kind} in aggregated kinds`, () => {
      assert.ok(AGGREGATED_KINDS.has(kind), `${kind} should be in AGGREGATED_KINDS`);
    });
  }
});

describe('external resource ALL_KINDS membership', () => {
  for (const kind of ALL_EXTERNAL_KINDS) {
    it(`${kind} is in ALL_KINDS`, () => {
      assert.ok(ALL_KINDS.has(kind), `${kind} should be in ALL_KINDS`);
    });
  }
});

describe('RESOURCE_DEFINITIONS for external kinds', () => {
  for (const kind of ALL_EXTERNAL_KINDS) {
    it(`${kind} has valid definition with storage, context, plural, purpose, requiredSpec`, () => {
      const def = RESOURCE_DEFINITIONS[kind];
      assert.ok(def, `${kind} should exist in RESOURCE_DEFINITIONS`);
      assert.ok(['etcd', 'postgres'].includes(def.storage), `${kind} storage should be etcd or postgres`);
      assert.ok(typeof def.context === 'string' && def.context.length > 0, `${kind} context should be a non-empty string`);
      assert.ok(typeof def.plural === 'string' && def.plural.length > 0, `${kind} plural should be a non-empty string`);
      assert.ok(typeof def.purpose === 'string' && def.purpose.length > 0, `${kind} purpose should be a non-empty string`);
      assert.ok(Array.isArray(def.requiredSpec) && def.requiredSpec.length > 0, `${kind} requiredSpec should be a non-empty array`);
    });
  }
});

describe('createResource for external kinds', () => {
  it("createResource('ExternalBackendProvider', ...) creates valid resource with apiVersion", () => {
    const spec = minimalSpecForKind('ExternalBackendProvider');
    const resource = createResource('ExternalBackendProvider', { name: 'test-provider' }, spec);
    assert.equal(resource.apiVersion, 'krate.a5c.ai/v1alpha1');
    assert.equal(resource.kind, 'ExternalBackendProvider');
    assert.equal(resource.metadata.name, 'test-provider');
    assert.equal(resource.metadata.namespace, 'default');
    assert.ok(resource.metadata.labels !== undefined);
    assert.ok(resource.metadata.annotations !== undefined);
    assert.ok(typeof resource.spec === 'object');
    assert.ok(typeof resource.status === 'object');
  });

  it("createResource('ExternalBackendBinding', ...) creates valid resource", () => {
    const spec = minimalSpecForKind('ExternalBackendBinding');
    const resource = createResource('ExternalBackendBinding', { name: 'test-binding' }, spec);
    assert.equal(resource.apiVersion, 'krate.a5c.ai/v1alpha1');
    assert.equal(resource.kind, 'ExternalBackendBinding');
    assert.equal(resource.metadata.name, 'test-binding');
  });

  for (const kind of ALL_EXTERNAL_KINDS) {
    it(`creates a valid ${kind} resource`, () => {
      const spec = minimalSpecForKind(kind);
      const resource = createResource(kind, { name: `test-${kind.toLowerCase()}` }, spec);
      assert.equal(resource.apiVersion, 'krate.a5c.ai/v1alpha1');
      assert.equal(resource.kind, kind);
      assert.equal(resource.metadata.name, `test-${kind.toLowerCase()}`);
      assert.equal(resource.metadata.namespace, 'default');
      assert.ok(typeof resource.spec === 'object');
      assert.ok(typeof resource.status === 'object');
    });
  }
});

describe('All external config kinds have required spec fields (organizationRef)', () => {
  for (const kind of EXTERNAL_CONFIG_KINDS) {
    it(`${kind} has organizationRef in requiredSpec`, () => {
      const def = RESOURCE_DEFINITIONS[kind];
      assert.ok(def, `${kind} should exist in RESOURCE_DEFINITIONS`);
      assert.ok(def.requiredSpec.includes('organizationRef'), `${kind} requiredSpec should include organizationRef`);
    });
  }
});

describe('findResourceDefinition finds external kinds by plural name', () => {
  for (const kind of ALL_EXTERNAL_KINDS) {
    it(`listResourceDefinitions includes ${kind} and its plural name`, () => {
      const defs = listResourceDefinitions();
      const def = defs.find(d => d.kind === kind);
      assert.ok(def, `${kind} should be found in listResourceDefinitions()`);
      assert.ok(typeof def.plural === 'string' && def.plural.length > 0, `${kind} should have a plural name`);
    });
  }
});

describe('external config kinds use etcd storage', () => {
  for (const kind of EXTERNAL_CONFIG_KINDS) {
    it(`${kind} returns etcd`, () => {
      assert.equal(storageClassForKind(kind), 'etcd');
    });
  }
});

describe('external aggregated kinds use postgres storage', () => {
  for (const kind of EXTERNAL_AGGREGATED_KINDS) {
    it(`${kind} returns postgres`, () => {
      assert.equal(storageClassForKind(kind), 'postgres');
    });
  }
});

describe('validateResource rejects missing required spec fields for external kinds', () => {
  for (const kind of ALL_EXTERNAL_KINDS) {
    it(`throws on empty spec for ${kind}`, () => {
      const resource = {
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind,
        metadata: { name: `invalid-${kind.toLowerCase()}` },
        spec: {},
        status: {}
      };
      const def = RESOURCE_DEFINITIONS[kind];
      assert.throws(
        () => validateResource(resource),
        (err) => {
          assert.ok(err.message.includes(`${kind} spec.${def.requiredSpec[0]} is required`));
          return true;
        }
      );
    });
  }
});

describe('resourceSchemaForKind for external kinds', () => {
  for (const kind of ALL_EXTERNAL_KINDS) {
    it(`returns correct schema for ${kind}`, () => {
      const schema = resourceSchemaForKind(kind);
      assert.equal(schema.apiVersion, 'krate.a5c.ai/v1alpha1');
      assert.equal(schema.kind, kind);
      assert.ok(typeof schema.plural === 'string');
      assert.ok(['etcd', 'postgres'].includes(schema.storage));
      assert.ok(Array.isArray(schema.required.metadata));
      assert.ok(schema.required.metadata.includes('name'));
      assert.ok(Array.isArray(schema.required.spec));
      assert.ok(schema.required.spec.length > 0);
    });
  }
});

describe('kind set counts after external kinds added', () => {
  it('CONFIG_KINDS has 52 members (42 previous + 4 external config + 1 webhook config + 3 artifact config + 2 inference)', () => {
    assert.equal(CONFIG_KINDS.size, 52);
  });

  it('AGGREGATED_KINDS has 31 members (23 previous + 6 external aggregated + 2 artifact aggregated)', () => {
    assert.equal(AGGREGATED_KINDS.size, 31);
  });

  it('ALL_KINDS has 83 members (65 previous + 10 external + 1 webhook config + 5 artifact + 2 inference)', () => {
    assert.equal(ALL_KINDS.size, 83);
  });

  it('listResourceDefinitions returns 83 definitions', () => {
    assert.equal(listResourceDefinitions().length, 83);
  });
});
