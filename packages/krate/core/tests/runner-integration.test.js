/**
 * Runner controller integration tests
 *
 * Exercises end-to-end runner workflows: pool creation with workspace,
 * job scheduling, pod spec generation with volume mounts, and capacity checks.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRunnerController } from '../src/runner-controller.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePool(overrides = {}) {
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'RunnerPool',
    metadata: {
      name: overrides.name || 'integration-pool',
      namespace: overrides.namespace || 'krate-org-default',
    },
    spec: {
      organizationRef: overrides.organizationRef ?? 'default',
      image: overrides.image || 'ubuntu:24.04',
      warmReplicas: overrides.warmReplicas ?? 2,
      maxReplicas: overrides.maxReplicas ?? 8,
      trustTier: overrides.trustTier || 'trusted',
      serviceAccount: overrides.serviceAccount || null,
      resourceLimits: overrides.resourceLimits || {},
      resourceRequests: overrides.resourceRequests || {},
    },
    status: { readyReplicas: overrides.readyReplicas ?? 2, queueDepth: 0 },
  };
}

function makeWorkspace(runRef = 'run-ws-001') {
  return {
    runRef,
    mountPath: '/workspace',
    pvcName: `krate-ws-${runRef}`,
  };
}

function makeJob(name = 'job-int-001') {
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'Job',
    metadata: { name, namespace: 'krate-org-default' },
    spec: { pipeline: 'pipe-int', step: 'build' },
  };
}

// ---------------------------------------------------------------------------
// createRunner with workspace generates correct pod spec
// ---------------------------------------------------------------------------

test('createRunner with workspace: generatePodSpec includes workspace volume mount', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ organizationRef: 'acme', name: 'acme-pool' });
  const workspace = makeWorkspace('run-42');

  const { runnerId, runner } = ctrl.createRunner(pool, 'run-42');
  assert.equal(runner.status, 'Running');

  const podSpec = ctrl.generatePodSpec({ runnerId, pool }, workspace);

  // Volume is present
  const vol = podSpec.spec.volumes.find(
    (v) => v.persistentVolumeClaim?.claimName === 'krate-ws-run-42'
  );
  assert.ok(vol, 'pod spec must include the workspace PVC volume');

  // Volume mount is present on the container
  const mount = podSpec.spec.containers[0].volumeMounts.find(
    (m) => m.mountPath === '/workspace'
  );
  assert.ok(mount, 'pod spec container must mount the workspace at /workspace');
});

test('createRunner with workspace: pod spec has correct org label', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ organizationRef: 'my-org', name: 'my-pool' });
  const workspace = makeWorkspace('run-99');

  const { runnerId } = ctrl.createRunner(pool, 'run-99');
  const podSpec = ctrl.generatePodSpec({ runnerId, pool }, workspace);

  assert.equal(podSpec.metadata.labels['krate.a5c.ai/org'], 'my-org');
  assert.equal(podSpec.metadata.labels['krate.a5c.ai/pool'], 'my-pool');
});

// ---------------------------------------------------------------------------
// scheduleJob assigns runner to job
// ---------------------------------------------------------------------------

test('scheduleJob assigns an idle pre-warmed runner to a job', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 5 });

  // Pre-warm two idle runners
  ctrl.createRunner(pool, null);
  ctrl.createRunner(pool, null);

  const job = makeJob('job-sched-001');
  const result = ctrl.scheduleJob(pool, job);

  assert.equal(result.error, false);
  assert.ok(result.runnerId, 'scheduleJob must return a runnerId');
  assert.equal(result.reused, false, 'first schedule should not reuse an existing assignment');

  const runner = ctrl.getRunnerForJob('job-sched-001');
  assert.ok(runner, 'runner must be retrievable by job name after scheduling');
  assert.equal(runner.status, 'Running');
});

test('scheduleJob is idempotent: same runnerId returned on repeat calls for same job', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  const job = makeJob('job-idem-001');

  const first = ctrl.scheduleJob(pool, job);
  const second = ctrl.scheduleJob(pool, job);

  assert.equal(first.runnerId, second.runnerId, 'repeated scheduleJob must return same runner');
  assert.equal(second.reused, true);
});

test('scheduleJob returns no-capacity when pool is exhausted', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 2 });

  ctrl.createRunner(pool, 'run-a');
  ctrl.createRunner(pool, 'run-b');

  const job = makeJob('job-over-cap');
  const result = ctrl.scheduleJob(pool, job);

  assert.equal(result.error, true);
  assert.equal(result.reason, 'no-capacity');
});

// ---------------------------------------------------------------------------
// generatePodSpec includes workspace volume mount
// ---------------------------------------------------------------------------

test('generatePodSpec with workspace sets KRATE_WORKSPACE_PATH env var', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ organizationRef: 'corp' });
  const workspace = makeWorkspace('run-77');
  const { runnerId } = ctrl.createRunner(pool, 'run-77');

  const podSpec = ctrl.generatePodSpec({ runnerId, pool }, workspace);
  const env = podSpec.spec.containers[0].env;

  const wsPathEnv = env.find((e) => e.name === 'KRATE_WORKSPACE_PATH');
  assert.ok(wsPathEnv, 'KRATE_WORKSPACE_PATH env var must be present');
  assert.equal(wsPathEnv.value, '/workspace');
});

test('generatePodSpec without workspace has empty volumes and volumeMounts', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ organizationRef: 'corp' });
  const { runnerId } = ctrl.createRunner(pool, null);

  const podSpec = ctrl.generatePodSpec({ runnerId, pool }, null);

  assert.equal(podSpec.spec.volumes.length, 0);
  assert.equal(podSpec.spec.containers[0].volumeMounts.length, 0);
});

// ---------------------------------------------------------------------------
// getCapacity returns correct available slots
// ---------------------------------------------------------------------------

test('getCapacity returns correct available slots after active runners are created', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 6 });

  ctrl.createRunner(pool, 'run-c1');
  ctrl.createRunner(pool, 'run-c2');
  // Only Running (active) runners count toward utilization; Idle runners do not
  ctrl.createRunner(pool, null); // idle runner does NOT count as used

  const cap = ctrl.getCapacity(pool);
  assert.equal(cap.maxReplicas, 6);
  assert.equal(cap.used, 2);     // only the two Running runners
  assert.equal(cap.available, 4);
});

test('getCapacity shows 0% utilization on empty pool', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 10 });
  const cap = ctrl.getCapacity(pool);

  assert.equal(cap.used, 0);
  assert.equal(cap.available, 10);
  assert.equal(cap.utilizationPct, 0);
});

test('getCapacity shows 100% utilization when pool is full', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 3 });
  ctrl.createRunner(pool, 'run-f1');
  ctrl.createRunner(pool, 'run-f2');
  ctrl.createRunner(pool, 'run-f3');

  const cap = ctrl.getCapacity(pool);
  assert.equal(cap.available, 0);
  assert.equal(cap.utilizationPct, 100);
});

// ---------------------------------------------------------------------------
// Full workflow: pool → schedule → terminate → verify capacity restored
// ---------------------------------------------------------------------------

test('terminating a runner restores pool capacity', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 2 });

  const { runnerId } = ctrl.createRunner(pool, 'run-term-1');
  ctrl.createRunner(pool, 'run-term-2');

  const beforeTerminate = ctrl.getCapacity(pool);
  assert.equal(beforeTerminate.available, 0);

  ctrl.terminateRunner(runnerId);

  const afterTerminate = ctrl.getCapacity(pool);
  assert.equal(afterTerminate.available, 1);
});
