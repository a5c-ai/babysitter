// Slice 1.1 — Org Scoping Enforcement

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  orgNamespaceName,
  normalizeOrgSlug,
  createResource,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Helper: create a fake resource gateway for controller tests
// ---------------------------------------------------------------------------
function createFakeGateway(overrides = {}) {
  const calls = { applied: [], deleted: [], got: [] };
  return {
    calls,
    gateway: {
      role: 'kubernetes-resource-gateway',
      namespace: 'krate-system',
      resourceDefinitions: [],
      async snapshot() { return { source: 'kubernetes', namespace: 'krate-system', resources: {}, commands: [], events: [], permissions: [], storage: {} }; },
      async list() { return overrides.listResult || { items: [] }; },
      async get(kind, name) { calls.got.push({ kind, name }); return overrides.getResult !== undefined ? overrides.getResult : null; },
      async apply(resource) { calls.applied.push(resource); return { operation: 'apply', resource }; },
      async delete(kind, name) { calls.deleted.push({ kind, name }); return { operation: 'delete', resource: null }; },
      async createRepository(input) { return { operation: 'apply', resource: input }; },
      async createOrganization(input) { return { operation: 'create-organization', organization: { kind: 'Organization', metadata: { name: input.slug || input.name }, spec: { organizationRef: input.slug || input.name, ...input } } }; },
      watch() { return {}; }
    }
  };
}

async function makeController(overrides = {}, controllerOptions = {}) {
  const { calls, gateway } = createFakeGateway(overrides);
  const { createKrateApiController } = await import('../src/api-controller.js');
  const controller = createKrateApiController({ resourceGateway: gateway, ...controllerOptions });
  return { controller, calls };
}

// ---------------------------------------------------------------------------
// Test 1 — Org namespace derivation
// ---------------------------------------------------------------------------
describe('Slice 1.1 — Org namespace derivation', () => {
  test('orgNamespaceName derives krate-org-<slug> from org slug', () => {
    return import('../src/org-scoping.js').then(({ orgNamespaceName: scopedFn }) => {
      assert.equal(scopedFn('a5c-ai'), 'krate-org-a5c-ai');
      assert.equal(scopedFn('my-org'), 'krate-org-my-org');
      assert.equal(scopedFn('default'), 'krate-org-default');
    });
  });
});

// ---------------------------------------------------------------------------
// Test 2 — applyResourceForOrg creates resource in correct namespace
// ---------------------------------------------------------------------------
describe('Slice 1.1 — applyResource in org scope', () => {
  test('applyResourceForOrg creates resource in the correct org namespace', async () => {
    const { controller, calls } = await makeController();

    assert.equal(typeof controller.applyResourceForOrg, 'function',
      'controller must expose applyResourceForOrg(orgSlug, resource)');

    const resource = createResource('Repository', { name: 'my-repo' }, {
      organizationRef: 'a5c-ai',
      visibility: 'internal'
    });

    const result = await controller.applyResourceForOrg('a5c-ai', resource);

    assert.equal(
      result.resource.metadata.namespace,
      'krate-org-a5c-ai',
      'resource must be placed in the org namespace krate-org-a5c-ai'
    );
    assert.equal(calls.applied.length, 1);
    assert.equal(calls.applied[0].metadata.namespace, 'krate-org-a5c-ai');
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Cross-org reference denial (krate-org-* namespace mismatch)
// ---------------------------------------------------------------------------
describe('Slice 1.1 — Cross-org reference denial', () => {
  test('applyResource rejects a resource that references a different org namespace', async () => {
    const { controller, calls } = await makeController();

    const crossOrgResource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'Repository',
      metadata: {
        name: 'stolen-repo',
        namespace: 'krate-org-org-b',
        labels: {}
      },
      spec: {
        organizationRef: 'org-a',
        visibility: 'internal'
      }
    };

    await assert.rejects(
      () => controller.applyResource(crossOrgResource),
      (err) => {
        assert.match(
          err.message,
          /cross.org|org.*mismatch|namespace.*does not match/i,
          'error message must describe the cross-org violation'
        );
        return true;
      },
      'applyResource must reject resources with cross-org namespace/organizationRef mismatch'
    );

    assert.equal(calls.applied.length, 0, 'gateway.apply must not be called for a cross-org resource');
  });
});

// ---------------------------------------------------------------------------
// Test 4 — Org-scoped resource listing
// ---------------------------------------------------------------------------
describe('Slice 1.1 — Org-scoped resource listing', () => {
  test('listResource with org filter returns only resources from that org namespace', async () => {
    const repoOrgA = createResource(
      'Repository',
      { name: 'repo-alpha', namespace: 'krate-org-org-a' },
      { organizationRef: 'org-a', visibility: 'internal' }
    );
    const repoOrgB = createResource(
      'Repository',
      { name: 'repo-beta', namespace: 'krate-org-org-b' },
      { organizationRef: 'org-b', visibility: 'private' }
    );

    const { controller } = await makeController({ listResult: { items: [repoOrgA, repoOrgB] } });

    assert.equal(typeof controller.listResourceForOrg, 'function',
      'controller must expose listResourceForOrg(org, kind)');

    const result = await controller.listResourceForOrg('org-a', 'Repository');

    assert.ok(Array.isArray(result.items), 'result must have an items array');
    assert.equal(result.items.length, 1, 'only org-a resources should be returned');
    assert.equal(result.items[0].metadata.name, 'repo-alpha');
    assert.equal(
      result.items.every((item) => item.spec?.organizationRef === 'org-a'),
      true,
      'every returned item must belong to org-a'
    );
  });
});

// ---------------------------------------------------------------------------
// Test 5 — Org-scoped audit event
// ---------------------------------------------------------------------------
describe('Slice 1.1 — Org-scoped audit event', () => {
  test('applyResource emits an audit event with org context after a successful apply', async () => {
    const auditEvents = [];

    const resource = createResource(
      'Repository',
      { name: 'audited-repo', namespace: 'krate-org-a5c-ai' },
      { organizationRef: 'a5c-ai', visibility: 'internal' }
    );

    const { controller } = await makeController({}, {
      onAuditEvent: (event) => auditEvents.push(event)
    });

    await controller.applyResource(resource);

    assert.equal(auditEvents.length, 1, 'exactly one audit event must be emitted per apply');

    const event = auditEvents[0];

    assert.ok(event, 'audit event must be emitted');
    assert.equal(event.operation, 'apply', 'event.operation must be "apply"');
    assert.equal(event.org, 'a5c-ai', 'event.org must be the org slug');
    assert.equal(event.namespace, 'krate-org-a5c-ai', 'event.namespace must be the org namespace');
    assert.equal(event.kind, 'Repository', 'event.kind must match the resource kind');
    assert.equal(event.name, 'audited-repo', 'event.name must match the resource name');
    assert.ok(event.timestamp, 'event.timestamp must be present');
    assert.doesNotThrow(() => new Date(event.timestamp).toISOString(),
      'event.timestamp must be a valid ISO date string');
  });
});

// ---------------------------------------------------------------------------
// Test 6 — applyResourceForOrg rejects org mismatch in organizationRef
// ---------------------------------------------------------------------------
describe('Slice 1.1 — applyResourceForOrg org mismatch error path', () => {
  test('applyResourceForOrg rejects when organizationRef does not match target org', async () => {
    const { controller, calls } = await makeController();

    const resource = createResource('Repository', { name: 'mismatch-repo' }, {
      organizationRef: 'org-a',
      visibility: 'internal'
    });

    await assert.rejects(
      () => controller.applyResourceForOrg('org-b', resource),
      (err) => {
        assert.match(
          err.message,
          /org.*mismatch/i,
          'error must describe the org mismatch'
        );
        return true;
      }
    );

    assert.equal(calls.applied.length, 0, 'gateway.apply must not be called on org mismatch');
  });
});

// ---------------------------------------------------------------------------
// Test 7 — deleteResourceForOrg happy path
// ---------------------------------------------------------------------------
describe('Slice 1.1 — deleteResourceForOrg', () => {
  test('deleteResourceForOrg deletes resource in the correct org namespace', async () => {
    const orgResource = {
      resource: createResource('Repository', { name: 'my-repo', namespace: 'krate-org-org-a' }, {
        organizationRef: 'org-a',
        visibility: 'internal'
      })
    };

    const { controller, calls } = await makeController({ getResult: orgResource });

    assert.equal(typeof controller.deleteResourceForOrg, 'function',
      'controller must expose deleteResourceForOrg(org, kind, name)');

    await controller.deleteResourceForOrg('org-a', 'Repository', 'my-repo');

    assert.equal(calls.deleted.length, 1, 'gateway.delete must be called once');
    assert.equal(calls.deleted[0].name, 'my-repo');
  });
});

// ---------------------------------------------------------------------------
// Test 8 — deleteResourceForOrg cross-org denial
// ---------------------------------------------------------------------------
describe('Slice 1.1 — deleteResourceForOrg cross-org denial', () => {
  test('deleteResourceForOrg rejects when resource belongs to a different org', async () => {
    const foreignResource = {
      resource: createResource('Repository', { name: 'foreign-repo', namespace: 'krate-org-org-b' }, {
        organizationRef: 'org-b',
        visibility: 'internal'
      })
    };

    const { controller, calls } = await makeController({ getResult: foreignResource });

    await assert.rejects(
      () => controller.deleteResourceForOrg('org-a', 'Repository', 'foreign-repo'),
      (err) => {
        assert.match(
          err.message,
          /cross.org|does not match/i,
          'error must describe the cross-org denial'
        );
        return true;
      }
    );

    assert.equal(calls.deleted.length, 0, 'gateway.delete must not be called for cross-org denial');
  });
});

// ---------------------------------------------------------------------------
// Test 9 — getResourceForOrg happy path
// ---------------------------------------------------------------------------
describe('Slice 1.1 — getResourceForOrg', () => {
  test('getResourceForOrg returns resource when org matches', async () => {
    const orgResource = {
      resource: createResource('Repository', { name: 'my-repo', namespace: 'krate-org-org-a' }, {
        organizationRef: 'org-a',
        visibility: 'internal'
      })
    };

    const { controller } = await makeController({ getResult: orgResource });

    assert.equal(typeof controller.getResourceForOrg, 'function',
      'controller must expose getResourceForOrg(org, kind, name)');

    const result = await controller.getResourceForOrg('org-a', 'Repository', 'my-repo');

    assert.ok(result, 'result must be returned');
    assert.equal(result.resource.metadata.name, 'my-repo');
  });
});

// ---------------------------------------------------------------------------
// Test 10 — getResourceForOrg cross-org denial
// ---------------------------------------------------------------------------
describe('Slice 1.1 — getResourceForOrg cross-org denial', () => {
  test('getResourceForOrg rejects when resource belongs to a different org', async () => {
    const foreignResource = {
      resource: createResource('Repository', { name: 'stolen-repo', namespace: 'krate-org-org-b' }, {
        organizationRef: 'org-b',
        visibility: 'internal'
      })
    };

    const { controller } = await makeController({ getResult: foreignResource });

    await assert.rejects(
      () => controller.getResourceForOrg('org-a', 'Repository', 'stolen-repo'),
      (err) => {
        assert.match(
          err.message,
          /cross.org|does not match/i,
          'error must describe the cross-org denial'
        );
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Test 11 — createRepository emits audit event
// ---------------------------------------------------------------------------
describe('Slice 1.1 — createRepository audit', () => {
  test('createRepository emits an audit event', async () => {
    const auditEvents = [];

    const { controller } = await makeController({}, {
      onAuditEvent: (event) => auditEvents.push(event)
    });

    await controller.createRepository({
      name: 'new-repo',
      organizationRef: 'a5c-ai',
      visibility: 'internal'
    });

    assert.ok(auditEvents.length >= 1, 'at least one audit event must be emitted');
    const event = auditEvents.find((e) => e.operation === 'create-repository');
    assert.ok(event, 'audit event with operation "create-repository" must exist');
    assert.ok(event.timestamp, 'event.timestamp must be present');
  });
});

// ---------------------------------------------------------------------------
// Test 12 — createOrganization emits audit event
// ---------------------------------------------------------------------------
describe('Slice 1.1 — createOrganization audit', () => {
  test('createOrganization emits an audit event', async () => {
    const auditEvents = [];

    const { controller } = await makeController({}, {
      onAuditEvent: (event) => auditEvents.push(event)
    });

    await controller.createOrganization({
      slug: 'new-org',
      displayName: 'New Org'
    });

    assert.ok(auditEvents.length >= 1, 'at least one audit event must be emitted');
    const event = auditEvents.find((e) => e.operation === 'create-organization');
    assert.ok(event, 'audit event with operation "create-organization" must exist');
    assert.ok(event.timestamp, 'event.timestamp must be present');
  });
});

// ---------------------------------------------------------------------------
// Test 13 — Audit callback error resilience
// ---------------------------------------------------------------------------
describe('Slice 1.1 — Audit callback error resilience', () => {
  test('audit callback error does not crash apply operations', async () => {
    const { controller } = await makeController({}, {
      onAuditEvent: () => { throw new Error('audit system down'); }
    });

    const resource = createResource('Repository', { name: 'resilient-repo', namespace: 'krate-org-a5c-ai' }, {
      organizationRef: 'a5c-ai',
      visibility: 'internal'
    });

    // This must not throw despite the audit callback throwing
    const result = await controller.applyResource(resource);
    assert.ok(result, 'apply must succeed even when audit callback throws');
    assert.equal(result.operation, 'apply');
  });
});

// ---------------------------------------------------------------------------
// Test 14 — applyResourceForOrg normalizes un-normalized slug
// ---------------------------------------------------------------------------
describe('Slice 1.1 — applyResourceForOrg slug normalization', () => {
  test('applyResourceForOrg with un-normalized slug ("Org-A") normalizes the stored organizationRef to "org-a"', async () => {
    const { controller, calls } = await makeController();

    const resource = createResource('Repository', { name: 'norm-repo' }, {
      visibility: 'internal'
    });

    const result = await controller.applyResourceForOrg('Org-A', resource);

    assert.equal(result.resource.spec.organizationRef, 'org-a',
      'organizationRef must be normalized to lowercase');
    assert.equal(result.resource.metadata.namespace, 'krate-org-org-a',
      'namespace must use the normalized slug');
    assert.equal(calls.applied.length, 1);
    assert.equal(calls.applied[0].spec.organizationRef, 'org-a');
  });
});

// ---------------------------------------------------------------------------
// Test 15 — deleteResourceForOrg when resource has no namespace
// ---------------------------------------------------------------------------
describe('Slice 1.1 — deleteResourceForOrg no-namespace denial', () => {
  test('deleteResourceForOrg when resource has no namespace throws cross-org error', async () => {
    const noNsResource = {
      resource: createResource('Repository', { name: 'no-ns-repo' }, {
        organizationRef: 'org-a',
        visibility: 'internal'
      })
    };
    // Ensure metadata.namespace is absent
    delete noNsResource.resource.metadata.namespace;

    const { controller, calls } = await makeController({ getResult: noNsResource });

    await assert.rejects(
      () => controller.deleteResourceForOrg('org-a', 'Repository', 'no-ns-repo'),
      (err) => {
        assert.match(err.message, /cross.org|does not match/i,
          'error must describe cross-org denial for absent namespace');
        return true;
      }
    );

    assert.equal(calls.deleted.length, 0, 'gateway.delete must not be called');
  });
});

// ---------------------------------------------------------------------------
// Test 16 — getResourceForOrg when resource has no namespace
// ---------------------------------------------------------------------------
describe('Slice 1.1 — getResourceForOrg no-namespace denial', () => {
  test('getResourceForOrg when resource has no namespace throws cross-org error', async () => {
    const noNsResource = {
      resource: createResource('Repository', { name: 'no-ns-get-repo' }, {
        organizationRef: 'org-a',
        visibility: 'internal'
      })
    };
    delete noNsResource.resource.metadata.namespace;

    const { controller } = await makeController({ getResult: noNsResource });

    await assert.rejects(
      () => controller.getResourceForOrg('org-a', 'Repository', 'no-ns-get-repo'),
      (err) => {
        assert.match(err.message, /cross.org|does not match/i,
          'error must describe cross-org denial for absent namespace');
        return true;
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Test 17 — applyResource with organizationRef but no namespace auto-assigns
// ---------------------------------------------------------------------------
describe('Slice 1.1 — applyResource auto-assigns namespace from organizationRef', () => {
  test('applyResource with organizationRef but no namespace auto-assigns namespace', async () => {
    const { controller, calls } = await makeController();

    const resource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'Repository',
      metadata: {
        name: 'auto-ns-repo',
        labels: {}
      },
      spec: {
        organizationRef: 'org-a',
        visibility: 'internal'
      }
    };

    const result = await controller.applyResource(resource);

    assert.ok(result, 'apply must succeed');
    assert.equal(calls.applied.length, 1);
    assert.equal(calls.applied[0].metadata.namespace, 'krate-org-org-a',
      'namespace must be auto-assigned from organizationRef');
  });
});

// ---------------------------------------------------------------------------
// Test 18 — deleteResourceForOrg when resource not found returns gracefully
// ---------------------------------------------------------------------------
describe('Slice 1.1 — deleteResourceForOrg not found', () => {
  test('deleteResourceForOrg when resource not found returns gracefully', async () => {
    // getResult = null means resource not found
    const { controller, calls } = await makeController({ getResult: null });

    const result = await controller.deleteResourceForOrg('org-a', 'Repository', 'nonexistent-repo');

    assert.ok(result, 'delete must return a result even when resource is not found');
    assert.equal(calls.deleted.length, 1, 'gateway.delete must still be called');
    assert.equal(calls.deleted[0].name, 'nonexistent-repo');
  });
});

// ---------------------------------------------------------------------------
// Test 19 — normalizeOrgSlug collision detection note
// ---------------------------------------------------------------------------
describe('Slice 1.1 — normalizeOrgSlug collision detection', () => {
  test('normalizeOrgSlug collision: org-a-b and org_a_b normalize identically', () => {
    // This test documents that underscores and hyphens collapse to the same slug.
    // Real production code should add collision detection when creating organizations.
    assert.equal(normalizeOrgSlug('org-a-b'), normalizeOrgSlug('org_a_b'),
      'org-a-b and org_a_b must normalize to the same slug (collision)');
    assert.equal(normalizeOrgSlug('org_a_b'), 'org-a-b',
      'underscores must be replaced by hyphens in normalized form');
  });
});

// ---------------------------------------------------------------------------
// Test 20 — normalizeOrgSlug edge cases
// ---------------------------------------------------------------------------
describe('Slice 1.1 — normalizeOrgSlug edge cases', () => {
  test('normalizeOrgSlug handles empty string', () => {
    assert.equal(normalizeOrgSlug(''), '');
  });

  test('normalizeOrgSlug handles null/undefined', () => {
    assert.equal(normalizeOrgSlug(null), '');
    assert.equal(normalizeOrgSlug(undefined), '');
  });

  test('normalizeOrgSlug lowercases and strips special chars', () => {
    assert.equal(normalizeOrgSlug('My_Org!@#'), 'my-org');
  });

  test('normalizeOrgSlug strips leading and trailing hyphens', () => {
    assert.equal(normalizeOrgSlug('--my-org--'), 'my-org');
  });

  test('normalizeOrgSlug truncates to 63 chars', () => {
    const longSlug = 'a'.repeat(100);
    assert.ok(normalizeOrgSlug(longSlug).length <= 63);
  });
});

// ---------------------------------------------------------------------------
// Test 15 — listResourceForOrg with empty results
// ---------------------------------------------------------------------------
describe('Slice 1.1 — listResourceForOrg empty results', () => {
  test('listResourceForOrg returns empty items when no resources match', async () => {
    const repoOrgB = createResource(
      'Repository',
      { name: 'repo-beta', namespace: 'krate-org-org-b' },
      { organizationRef: 'org-b', visibility: 'private' }
    );

    const { controller } = await makeController({ listResult: { items: [repoOrgB] } });

    const result = await controller.listResourceForOrg('org-a', 'Repository');

    assert.ok(Array.isArray(result.items), 'result must have an items array');
    assert.equal(result.items.length, 0, 'no items should match org-a');
  });
});

// ---------------------------------------------------------------------------
// Test 16 — listResourceForOrg multi-org filtering
// ---------------------------------------------------------------------------
describe('Slice 1.1 — listResourceForOrg multi-org filtering', () => {
  test('listResourceForOrg correctly filters across multiple orgs', async () => {
    const repoA1 = createResource('Repository', { name: 'a-repo-1', namespace: 'krate-org-org-a' }, { organizationRef: 'org-a', visibility: 'internal' });
    const repoA2 = createResource('Repository', { name: 'a-repo-2', namespace: 'krate-org-org-a' }, { organizationRef: 'org-a', visibility: 'internal' });
    const repoB1 = createResource('Repository', { name: 'b-repo-1', namespace: 'krate-org-org-b' }, { organizationRef: 'org-b', visibility: 'private' });
    const repoC1 = createResource('Repository', { name: 'c-repo-1', namespace: 'krate-org-org-c' }, { organizationRef: 'org-c', visibility: 'public' });

    const { controller } = await makeController({ listResult: { items: [repoA1, repoA2, repoB1, repoC1] } });

    const resultA = await controller.listResourceForOrg('org-a', 'Repository');
    assert.equal(resultA.items.length, 2, 'org-a should have 2 repos');
    assert.deepEqual(resultA.items.map((i) => i.metadata.name).sort(), ['a-repo-1', 'a-repo-2']);

    const resultB = await controller.listResourceForOrg('org-b', 'Repository');
    assert.equal(resultB.items.length, 1, 'org-b should have 1 repo');
    assert.equal(resultB.items[0].metadata.name, 'b-repo-1');

    const resultC = await controller.listResourceForOrg('org-c', 'Repository');
    assert.equal(resultC.items.length, 1, 'org-c should have 1 repo');
  });
});

// ---------------------------------------------------------------------------
// Test 17 — deleteResource emits audit event
// ---------------------------------------------------------------------------
describe('Slice 1.1 — deleteResource audit', () => {
  test('deleteResource emits an audit event', async () => {
    const auditEvents = [];

    const { controller } = await makeController({}, {
      onAuditEvent: (event) => auditEvents.push(event)
    });

    await controller.deleteResource('Repository', 'some-repo');

    assert.ok(auditEvents.length >= 1, 'at least one audit event must be emitted');
    const event = auditEvents.find((e) => e.operation === 'delete');
    assert.ok(event, 'audit event with operation "delete" must exist');
    assert.equal(event.name, 'some-repo');
    assert.ok(event.timestamp, 'event.timestamp must be present');
  });
});

// ---------------------------------------------------------------------------
// Test 18 — Cross-org denial for system namespaces
// (Regression: resources targeting system namespaces like krate-system
//  with any organizationRef must also be blocked.)
// ---------------------------------------------------------------------------
describe('Slice 1.1 — Cross-org denial for system namespaces', () => {
  test('applyResource rejects resource targeting krate-system with an organizationRef', async () => {
    const { controller, calls } = await makeController();

    const systemNsResource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'Repository',
      metadata: {
        name: 'sneaky-repo',
        namespace: 'krate-system',
        labels: {}
      },
      spec: {
        organizationRef: 'org-a',
        visibility: 'internal'
      }
    };

    await assert.rejects(
      () => controller.applyResource(systemNsResource),
      (err) => {
        assert.match(
          err.message,
          /cross.org|org.*mismatch|namespace.*does not match/i,
          'error message must describe the namespace/org mismatch'
        );
        return true;
      }
    );

    assert.equal(calls.applied.length, 0, 'gateway.apply must not be called');
  });

  test('applyResource rejects resource targeting default namespace with an organizationRef', async () => {
    const { controller, calls } = await makeController();

    const defaultNsResource = {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'Repository',
      metadata: {
        name: 'sneaky-repo-2',
        namespace: 'default',
        labels: {}
      },
      spec: {
        organizationRef: 'org-a',
        visibility: 'internal'
      }
    };

    await assert.rejects(
      () => controller.applyResource(defaultNsResource),
      (err) => {
        assert.match(
          err.message,
          /cross.org|org.*mismatch|namespace.*does not match/i
        );
        return true;
      }
    );

    assert.equal(calls.applied.length, 0);
  });
});
