// reconcileRepositories — self-heal backing Gitea repos for existing Repository
// CRDs (kubectl-applied or created before provisioning existed, or lost to a
// Gitea DB reset). For each Repository that has no Gitea repo, create it;
// tolerate per-repo failures so one bad repo doesn't block the rest.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { reconcileRepositories } from '../src/repository-reconciler.js';

function fakeGitea({ existing = [], failCreateFor = [] } = {}) {
  const calls = { getRepository: [], createRepository: [] };
  return {
    calls,
    service: {
      async getRepository(org, name) {
        calls.getRepository.push({ org, name });
        return existing.includes(name) ? { id: 1, name } : null;
      },
      async createRepository(org, name, opts) {
        calls.createRepository.push({ org, name, opts });
        if (failCreateFor.includes(name)) throw new Error(`Gitea POST /orgs/${org}/repos failed with 500`);
        return { id: 2, name };
      },
    },
  };
}

const repo = (name, extra = {}) => ({ kind: 'Repository', metadata: { name }, spec: { organizationRef: 'a5c-ai', visibility: 'internal', ...extra } });

describe('reconcileRepositories', () => {
  test('creates a Gitea repo for a CRD that has no backing repo', async () => {
    const { calls, service } = fakeGitea({ existing: [] });
    const summary = await reconcileRepositories([repo('test')], { giteaService: service });

    assert.equal(calls.createRepository.length, 1);
    assert.equal(calls.createRepository[0].name, 'test');
    assert.equal(calls.createRepository[0].opts.private, true);
    assert.equal(summary.created, 1);
    assert.equal(summary.alreadyPresent, 0);
    assert.equal(summary.failed, 0);
  });

  test('skips repos that already exist in Gitea', async () => {
    const { calls, service } = fakeGitea({ existing: ['agent-sandbox'] });
    const summary = await reconcileRepositories([repo('agent-sandbox')], { giteaService: service });

    assert.equal(calls.createRepository.length, 0, 'must not re-create an existing repo');
    assert.equal(summary.alreadyPresent, 1);
    assert.equal(summary.created, 0);
  });

  test('a per-repo failure is collected and does not stop the others', async () => {
    const { calls, service } = fakeGitea({ existing: [], failCreateFor: ['bad'] });
    const summary = await reconcileRepositories([repo('bad'), repo('good')], { giteaService: service });

    assert.equal(calls.createRepository.length, 2, 'both repos attempted');
    assert.equal(summary.created, 1);
    assert.equal(summary.failed, 1);
    assert.equal(summary.errors[0].name, 'bad');
    assert.match(summary.errors[0].error, /500/);
  });

  test('treats a concurrent-create 409 as already present, not a failure', async () => {
    // Repo not seen at check time, but creation races another writer -> 409.
    const { service } = fakeGitea({ existing: [], failCreateFor: ['racy'] });
    // Override createRepository to throw a 409 (already-exists) instead of 500.
    service.createRepository = async () => { throw new Error('Gitea POST /orgs/a5c-ai/repos failed with 409'); };
    const summary = await reconcileRepositories([repo('racy')], { giteaService: service });

    assert.equal(summary.failed, 0, '409 must not count as a failure');
    assert.equal(summary.alreadyPresent, 1);
  });

  test('maps public visibility to a public Gitea repo', async () => {
    const { calls, service } = fakeGitea({ existing: [] });
    await reconcileRepositories([repo('pub', { visibility: 'public' })], { giteaService: service });
    assert.equal(calls.createRepository[0].opts.private, false);
  });

  test('no gitea service -> skips without throwing', async () => {
    const summary = await reconcileRepositories([repo('test')], { giteaService: null });
    assert.equal(summary.created, 0);
    assert.equal(summary.reason, 'not-configured');
  });
});
