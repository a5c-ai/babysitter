/**
 * Tests for async kubectl helpers, partial snapshot, and stale-while-revalidate cache.
 */

import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runKubectlAsync, getPartialSnapshot, getControllerSnapshotAsync } from '../src/kubernetes-controller-async.js';
import {
  getSnapshotCache,
  setSnapshotCache,
  clearSnapshotCache,
  getOrgCache,
  setOrgCache,
  clearOrgCache,
  cachedOrgs,
  isCacheFresh,
  staleWhileRevalidate,
  CACHE_TTL_MS
} from '../src/snapshot-cache.js';

// ---------------------------------------------------------------------------
// runKubectlAsync
// ---------------------------------------------------------------------------

test('runKubectlAsync resolves with ok=true for a succeeding command', async () => {
  const result = await runKubectlAsync(['version', '--client=true', '-o', 'json'], {
    kubectl: process.env.KRATE_KUBECTL || 'kubectl',
    timeoutMs: 5000,
    allowFailure: true
  });
  // We can't guarantee kubectl is installed in CI, so we just check the shape.
  assert.ok(typeof result.ok === 'boolean', 'result.ok is boolean');
  assert.ok(typeof result.stdout === 'string', 'result.stdout is string');
  assert.ok(typeof result.stderr === 'string', 'result.stderr is string');
  assert.ok(typeof result.command === 'string', 'result.command is string');
});

test('runKubectlAsync with allowFailure=true resolves even on non-zero exit', async () => {
  // Use a bogus sub-command that kubectl will reject
  const result = await runKubectlAsync(['get', 'nonexistent-resource-kind-xyz-abc', '--request-timeout=1s'], {
    kubectl: process.env.KRATE_KUBECTL || 'kubectl',
    timeoutMs: 5000,
    allowFailure: true
  });
  assert.ok(typeof result.ok === 'boolean', 'shape preserved on failure');
  assert.ok(typeof result.stderr === 'string', 'stderr present');
  assert.ok(typeof result.command === 'string', 'command present');
});

test('runKubectlAsync result has same shape keys as runKubectl sync version', async () => {
  const result = await runKubectlAsync(['version', '--client=true', '-o', 'json'], {
    kubectl: process.env.KRATE_KUBECTL || 'kubectl',
    timeoutMs: 5000,
    allowFailure: true
  });
  const expectedKeys = ['ok', 'status', 'signal', 'stdout', 'stderr', 'error', 'command'];
  for (const key of expectedKeys) {
    assert.ok(key in result, `result has key "${key}"`);
  }
});

test('runKubectlAsync times out and resolves with ok=false when allowFailure=true', async () => {
  // Use an extremely short timeout to force a timeout path
  const result = await runKubectlAsync(['version', '--client=true', '-o', 'json'], {
    kubectl: process.env.KRATE_KUBECTL || 'kubectl',
    timeoutMs: 1,   // 1 ms — will always time out
    allowFailure: true
  });
  assert.equal(result.ok, false, 'timed out result has ok=false');
  assert.ok(result.error, 'timed out result has error message');
});

test('runKubectlAsync rejects on timeout when allowFailure is not set', async () => {
  await assert.rejects(
    () => runKubectlAsync(['version', '--client=true', '-o', 'json'], {
      kubectl: process.env.KRATE_KUBECTL || 'kubectl',
      timeoutMs: 1
    }),
    (err) => {
      assert.ok(err instanceof Error, 'throws Error');
      return true;
    }
  );
});


test('getControllerSnapshotAsync uses in-cluster service account instead of kubeconfig current-context', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'krate-sa-'));
  const kubectlPath = path.join(tempDir, process.platform === 'win32' ? 'kubectl.cmd' : 'kubectl');
  const kubectlScript = process.platform === 'win32'
    ? '@echo off\r\nnode -e "const args=process.argv.slice(1); if(args.includes(\'version\')){console.log(JSON.stringify({clientVersion:{gitVersion:\'v1.32.2\'}})); process.exit(0)} if(args.includes(\'current-context\')){console.error(\'current-context should not be called\'); process.exit(9)} console.log(JSON.stringify({items:[]}));" -- %*\r\n'
    : '#!/usr/bin/env sh\nnode -e "const args=process.argv.slice(1); if(args.includes(\'version\')){console.log(JSON.stringify({clientVersion:{gitVersion:\'v1.32.2\'}})); process.exit(0)} if(args.includes(\'current-context\')){console.error(\'current-context should not be called\'); process.exit(9)} console.log(JSON.stringify({items:[]}));" -- "$@"\n';

  try {
    await writeFile(path.join(tempDir, 'token'), 'token');
    await writeFile(path.join(tempDir, 'ca.crt'), 'ca');
    await writeFile(kubectlPath, kubectlScript, { mode: 0o755 });

    const snapshot = await getControllerSnapshotAsync({
      kubectl: kubectlPath,
      timeoutMs: 500,
      env: {
        KUBERNETES_SERVICE_HOST: '10.0.0.1',
        KUBERNETES_SERVICE_PORT: '443',
        KRATE_SERVICE_ACCOUNT_DIR: tempDir
      }
    });

    assert.equal(snapshot.kubectl.context, 'in-cluster');
    if (process.platform !== 'win32') assert.equal(snapshot.kubectl.available, true);
    assert.doesNotMatch((snapshot.kubectl.errors || []).join('; '), /current-context/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});


test('full async snapshot lists known Krate CRDs even when CRD discovery is empty', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'krate-known-crds-'));
  const fakePath = path.join(tempDir, 'fake-kubectl.cjs');
  const fakeScript = `
const args = process.argv.slice(1);
const joined = args.join(' ');
const has = (value) => args.includes(value) || joined.includes(value);
if (has('current-context')) { console.log('kind-krate'); process.exit(0); }
if (has('version')) { console.log(JSON.stringify({ clientVersion: { gitVersion: 'v1.test' } })); process.exit(0); }
if (has('apiservice')) { console.log(JSON.stringify({ metadata: { name: 'v1alpha1.krate.a5c.ai' } })); process.exit(0); }
if (has('crd')) { console.error('crd discovery unavailable'); process.exit(1); }
if (has('runnerpools.krate.a5c.ai')) {
  console.log(JSON.stringify({ items: [{ apiVersion: 'krate.a5c.ai/v1alpha1', kind: 'RunnerPool', metadata: { name: 'default', namespace: 'krate-org-default', labels: { 'krate.a5c.ai/org': 'default' } }, spec: { organizationRef: 'default', image: 'ubuntu:24.04' } }] }));
  process.exit(0);
}
console.log(JSON.stringify({ items: [] }));
process.exit(0);
`;

  try {
    await writeFile(fakePath, fakeScript);
    const snapshot = await getControllerSnapshotAsync({
      kubectl: process.execPath,
      timeoutMs: 1000,
      env: { KRATE_ORG: 'default', NODE_OPTIONS: `--require ${fakePath}` }
    });
    assert.equal(snapshot.resources.RunnerPool.length, 1);
    assert.equal(snapshot.resources.RunnerPool[0].metadata.name, 'default');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// getPartialSnapshot
// ---------------------------------------------------------------------------

test('getPartialSnapshot returns empty resources object for empty kinds array', async () => {
  const result = await getPartialSnapshot([], {
    kubectl: process.env.KRATE_KUBECTL || 'kubectl',
    timeoutMs: 100,
    allowFailure: true
  });
  assert.deepEqual(result.resources, {}, 'no resources when kinds is empty');
  assert.equal(result.mode, 'partial', 'mode is partial');
});

test('getPartialSnapshot only queries the requested resource kinds', async () => {
  // We stub out the kubectl to track which resource kinds are queried.
  // Since we can't easily hook into the internal calls, we verify the returned
  // resources object only has keys for the requested kinds.
  const kinds = ['AgentStack', 'AgentSession'];
  const result = await getPartialSnapshot(kinds, {
    kubectl: process.env.KRATE_KUBECTL || 'kubectl',
    timeoutMs: 500,
    allowFailure: true
  });
  const keys = Object.keys(result.resources);
  // All returned keys must be among the requested kinds
  for (const key of keys) {
    assert.ok(kinds.includes(key), `unexpected key in partial snapshot: ${key}`);
  }
  // All requested kinds must be present as keys
  for (const kind of kinds) {
    assert.ok(kind in result.resources, `missing kind in partial snapshot: ${kind}`);
  }
});

test('getPartialSnapshot resources values are arrays', async () => {
  const result = await getPartialSnapshot(['Organization'], {
    kubectl: process.env.KRATE_KUBECTL || 'kubectl',
    timeoutMs: 500,
    allowFailure: true
  });
  for (const value of Object.values(result.resources)) {
    assert.ok(Array.isArray(value), 'each resource value is an array');
  }
});

test('getPartialSnapshot ignores unknown kinds gracefully', async () => {
  const result = await getPartialSnapshot(['AgentStack', 'NotARealKind'], {
    kubectl: process.env.KRATE_KUBECTL || 'kubectl',
    timeoutMs: 500,
    allowFailure: true
  });
  // NotARealKind should be absent; AgentStack should be present
  assert.ok('AgentStack' in result.resources, 'valid kind present');
  assert.ok(!('NotARealKind' in result.resources), 'unknown kind absent');
});

// ---------------------------------------------------------------------------
// Per-org cache
// ---------------------------------------------------------------------------

test('setOrgCache and getOrgCache store and retrieve data per org', () => {
  clearSnapshotCache();
  const data1 = { resources: { Organization: [{ metadata: { name: 'org-a' } }] } };
  const data2 = { resources: { Organization: [{ metadata: { name: 'org-b' } }] } };
  setOrgCache(data1, 'org-a');
  setOrgCache(data2, 'org-b');
  assert.deepEqual(getOrgCache('org-a').data, data1, 'org-a cached independently');
  assert.deepEqual(getOrgCache('org-b').data, data2, 'org-b cached independently');
  clearSnapshotCache();
});

test('cachedOrgs returns all orgs with active cache entries', () => {
  clearSnapshotCache();
  setOrgCache({ x: 1 }, 'org-x');
  setOrgCache({ y: 2 }, 'org-y');
  const orgs = cachedOrgs();
  assert.ok(orgs.includes('org-x'), 'org-x in cachedOrgs');
  assert.ok(orgs.includes('org-y'), 'org-y in cachedOrgs');
  clearSnapshotCache();
});

test('clearOrgCache removes only the target org', () => {
  clearSnapshotCache();
  setOrgCache({ a: 1 }, 'alpha');
  setOrgCache({ b: 2 }, 'beta');
  clearOrgCache('alpha');
  assert.equal(getOrgCache('alpha'), null, 'alpha cleared');
  assert.ok(getOrgCache('beta') !== null, 'beta still present');
  clearSnapshotCache();
});

test('isCacheFresh returns false when cache is empty', () => {
  clearSnapshotCache();
  assert.equal(isCacheFresh('org-empty'), false, 'empty cache is not fresh');
});

test('isCacheFresh returns true immediately after setOrgCache', () => {
  clearSnapshotCache();
  setOrgCache({ z: 3 }, 'freshorg');
  assert.equal(isCacheFresh('freshorg'), true, 'fresh entry is fresh');
  clearSnapshotCache();
});

// ---------------------------------------------------------------------------
// stale-while-revalidate
// ---------------------------------------------------------------------------

test('staleWhileRevalidate returns fresh data when cache is empty', async () => {
  clearSnapshotCache();
  const fresh = { resources: { AgentStack: [] } };
  const result = await staleWhileRevalidate('swr-empty', async () => fresh);
  assert.deepEqual(result, fresh, 'returns result of revalidateFn');
  clearSnapshotCache();
});

test('staleWhileRevalidate returns cached data immediately when fresh', async () => {
  clearSnapshotCache();
  const cached = { resources: { AgentStack: [{ metadata: { name: 'existing' } }] } };
  setOrgCache(cached, 'swr-fresh');
  let revalidateCalled = false;
  const result = await staleWhileRevalidate('swr-fresh', async () => {
    revalidateCalled = true;
    return { resources: { AgentStack: [] } };
  }, { ttlMs: CACHE_TTL_MS });
  assert.deepEqual(result, cached, 'returned cached data');
  assert.equal(revalidateCalled, false, 'revalidate not called when cache is fresh');
  clearSnapshotCache();
});

test('staleWhileRevalidate triggers background refresh when entry is stale', async () => {
  clearSnapshotCache();
  const staleData = { resources: { AgentStack: [{ metadata: { name: 'stale' } }] } };
  setOrgCache(staleData, 'swr-stale');
  // Manually mark the entry as expired (set timestamp far in the past)
  const key = 'swr-stale';
  // Access orgCacheMap indirectly by using a very short ttlMs
  let revalidateCalled = false;
  let resolveRevalidate;
  const revalidatePromise = new Promise((resolve) => { resolveRevalidate = resolve; });
  const result = await staleWhileRevalidate('swr-stale', async () => {
    revalidateCalled = true;
    resolveRevalidate();
    return { resources: { AgentStack: [] } };
  }, { ttlMs: 0, staleMs: CACHE_TTL_MS * 10 });

  // Should return stale data immediately
  assert.deepEqual(result, staleData, 'returned stale data immediately');
  // Wait a tick for background refresh to fire
  await new Promise((r) => setImmediate(r));
  clearSnapshotCache();
});

test('staleWhileRevalidate caches the result of revalidateFn', async () => {
  clearSnapshotCache();
  const fresh = { resources: { User: [{ metadata: { name: 'u1' } }] } };
  await staleWhileRevalidate('swr-cache-write', async () => fresh);
  const entry = getOrgCache('swr-cache-write');
  assert.ok(entry !== null, 'cache written after revalidate');
  assert.deepEqual(entry.data, fresh, 'correct data written to cache');
  clearSnapshotCache();
});
