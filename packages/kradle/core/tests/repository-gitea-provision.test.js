// Repository CRD -> Gitea repo provisioning (control plane create path)
//
// createRepository creates the Repository CRD (control plane). It must ALSO
// ensure the backing Gitea repo exists (data plane) via an injected gitea
// service, so a created Repository is actually browsable/clonable instead of a
// CRD with no backing repo. Provisioning is data-plane-first: a genuine Gitea
// failure aborts before the CRD is written (no orphan CRD); an already-exists
// response is idempotent success; and when no gitea service is configured the
// CRD is still created and the result says so.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createKradleApiController } from '../src/api-controller.js';

function makeGateway() {
  const calls = { createRepository: [] };
  const gateway = {
    role: 'kubernetes-resource-gateway',
    namespace: 'kradle-system',
    async createRepository(input) { calls.createRepository.push(input); return { operation: 'apply', resource: { kind: 'Repository', metadata: { name: input.name }, spec: input } }; },
  };
  return { calls, gateway };
}

function makeGiteaService(impl) {
  const calls = [];
  return {
    calls,
    service: {
      async createRepository(org, name, opts) { calls.push({ org, name, opts }); return impl ? impl(org, name, opts) : { id: 1, name }; },
    },
  };
}

describe('Repository -> Gitea provisioning', () => {
  test('provisions a private Gitea repo for an internal repository', async () => {
    const { calls: gwCalls, gateway } = makeGateway();
    const { calls: giteaCalls, service } = makeGiteaService();
    const controller = createKradleApiController({ resourceGateway: gateway, giteaService: service });

    const result = await controller.createRepository({ name: 'test', organizationRef: 'a5c-ai', visibility: 'internal' });

    assert.equal(giteaCalls.length, 1, 'gitea createRepository must be called once');
    assert.equal(giteaCalls[0].org, 'a5c-ai');
    assert.equal(giteaCalls[0].name, 'test');
    assert.equal(giteaCalls[0].opts.private, true, 'internal repos must be created private in Gitea');
    assert.equal(giteaCalls[0].opts.defaultBranch, 'main');
    assert.equal(gwCalls.createRepository.length, 1, 'CRD must still be created');
    assert.equal(result.gitea.provisioned, true);
  });

  test('creates a public Gitea repo (private:false) for a public repository', async () => {
    const { gateway } = makeGateway();
    const { calls: giteaCalls, service } = makeGiteaService();
    const controller = createKradleApiController({ resourceGateway: gateway, giteaService: service });

    await controller.createRepository({ name: 'pub', organizationRef: 'a5c-ai', visibility: 'public' });

    assert.equal(giteaCalls[0].opts.private, false);
  });

  test('when no gitea service is configured, still creates the CRD and reports not-configured', async () => {
    const { calls: gwCalls, gateway } = makeGateway();
    const controller = createKradleApiController({ resourceGateway: gateway, giteaService: null });

    const result = await controller.createRepository({ name: 'test', organizationRef: 'a5c-ai', visibility: 'internal' });

    assert.equal(gwCalls.createRepository.length, 1, 'CRD must be created even without gitea');
    assert.equal(result.gitea.provisioned, false);
    assert.equal(result.gitea.reason, 'not-configured');
  });

  test('is idempotent: an already-exists (409) from Gitea is treated as provisioned', async () => {
    const { calls: gwCalls, gateway } = makeGateway();
    const { service } = makeGiteaService(() => { throw new Error('Gitea POST /orgs/a5c-ai/repos failed with 409'); });
    const controller = createKradleApiController({ resourceGateway: gateway, giteaService: service });

    const result = await controller.createRepository({ name: 'test', organizationRef: 'a5c-ai', visibility: 'internal' });

    assert.equal(result.gitea.provisioned, true);
    assert.equal(result.gitea.alreadyExisted, true);
    assert.equal(gwCalls.createRepository.length, 1, 'CRD must still be created when repo already exists');
  });

  test('a genuine Gitea failure aborts before the CRD is created (data-plane-first, no orphan CRD)', async () => {
    const { calls: gwCalls, gateway } = makeGateway();
    const { service } = makeGiteaService(() => { throw new Error('Gitea POST /orgs/a5c-ai/repos failed with 500'); });
    const controller = createKradleApiController({ resourceGateway: gateway, giteaService: service });

    await assert.rejects(
      () => controller.createRepository({ name: 'test', organizationRef: 'a5c-ai', visibility: 'internal' }),
      /500/,
    );
    assert.equal(gwCalls.createRepository.length, 0, 'CRD must NOT be created when Gitea provisioning genuinely fails');
  });
});
