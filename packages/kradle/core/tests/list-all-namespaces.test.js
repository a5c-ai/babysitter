// namespaceArgs must support cluster-wide listing so the repository reconcile
// loop (running in the controllers namespace) can see Repository CRDs that live
// in per-org namespaces (kradle-org-<org>), not just its own namespace.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { namespaceArgs } from '../src/kubernetes-controller.js';

const namespaced = { namespaced: true };
const clusterScoped = { namespaced: false };

describe('namespaceArgs', () => {
  test('namespaced resource, default -> scoped with -n', () => {
    assert.deepEqual(namespaceArgs(namespaced, 'kradle-staging'), ['-n', 'kradle-staging']);
  });

  test('namespaced resource, allNamespaces -> --all-namespaces', () => {
    assert.deepEqual(namespaceArgs(namespaced, 'kradle-staging', true), ['--all-namespaces']);
  });

  test('cluster-scoped resource -> no namespace flag regardless of allNamespaces', () => {
    assert.deepEqual(namespaceArgs(clusterScoped, 'kradle-staging'), []);
    assert.deepEqual(namespaceArgs(clusterScoped, 'kradle-staging', true), []);
  });
});
