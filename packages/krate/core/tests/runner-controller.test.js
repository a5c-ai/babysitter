import assert from 'node:assert/strict';
import test from 'node:test';
import { createRunnerController, RUNNER_CONTROLLER_BOUNDARY } from '../src/runner-controller.js';

function makePool(overrides = {}) {
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'RunnerPool',
    metadata: {
      name: overrides.name || 'test-pool',
      namespace: overrides.namespace || 'krate-org-default',
      labels: overrides.labels || {}
    },
    spec: {
      organizationRef: 'organizationRef' in overrides ? overrides.organizationRef : 'default',
      image: overrides.image || 'ubuntu:24.04',
      warmReplicas: overrides.warmReplicas ?? 2,
      maxReplicas: overrides.maxReplicas ?? 10,
      trustTier: overrides.trustTier || 'trusted',
      serviceAccount: overrides.serviceAccount || null,
      resourceLimits: overrides.resourceLimits || {},
      resourceRequests: overrides.resourceRequests || {}
    },
    status: { readyReplicas: overrides.readyReplicas ?? 2, queueDepth: 0 }
  };
}

function makeJob(name = 'job-001') {
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'Job',
    metadata: { name, namespace: 'krate-org-default' },
    spec: { pipeline: 'pipe-1', step: 'test' }
  };
}

// ============================================================
// BOUNDARY export
// ============================================================

test('RUNNER_CONTROLLER_BOUNDARY is exported and describes the controller', () => {
  assert.equal(RUNNER_CONTROLLER_BOUNDARY.role, 'runner-controller');
  assert.ok(RUNNER_CONTROLLER_BOUNDARY.owns.includes('pool validation'));
  assert.ok(RUNNER_CONTROLLER_BOUNDARY.owns.includes('pod spec generation'));
  assert.ok(RUNNER_CONTROLLER_BOUNDARY.mustNotOwn.includes('Kubernetes API calls'));
});

// ============================================================
// validateRunnerPool
// ============================================================

test('validateRunnerPool returns valid for a well-formed RunnerPool', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  const result = ctrl.validateRunnerPool(pool);
  assert.equal(result.valid, true);
  assert.equal(result.name, 'test-pool');
  assert.equal(result.warmReplicas, 2);
  assert.equal(result.maxReplicas, 10);
  assert.equal(result.organizationRef, 'default');
});

test('validateRunnerPool rejects missing resource', () => {
  const ctrl = createRunnerController();
  const result = ctrl.validateRunnerPool(null);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'missing-resource');
});

test('validateRunnerPool rejects missing metadata.name', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  delete pool.metadata.name;
  const result = ctrl.validateRunnerPool(pool);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'missing-name');
});

test('validateRunnerPool rejects missing organizationRef', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ organizationRef: '' });
  const result = ctrl.validateRunnerPool(pool);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'missing-org');
});

test('validateRunnerPool rejects warmReplicas > maxReplicas', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ warmReplicas: 15, maxReplicas: 5 });
  const result = ctrl.validateRunnerPool(pool);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'replicas-conflict');
});

test('validateRunnerPool rejects negative warmReplicas', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ warmReplicas: -1 });
  const result = ctrl.validateRunnerPool(pool);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'invalid-min-replicas');
});

// ============================================================
// getPoolStatus
// ============================================================

test('getPoolStatus returns Empty when no runners exist', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  const status = ctrl.getPoolStatus(pool);
  assert.equal(status.phase, 'Empty');
  assert.equal(status.idle, 0);
  assert.equal(status.active, 0);
  assert.equal(status.total, 0);
});

test('getPoolStatus reflects Idle runners after createRunner', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  ctrl.createRunner(pool, null);
  ctrl.createRunner(pool, null);
  const status = ctrl.getPoolStatus(pool);
  assert.equal(status.idle, 2);
  assert.equal(status.active, 0);
  assert.equal(status.phase, 'Idle');
});

test('getPoolStatus reflects Active runners after job assignment', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  ctrl.createRunner(pool, 'run-1');
  const status = ctrl.getPoolStatus(pool);
  assert.equal(status.active, 1);
  assert.equal(status.phase, 'Active');
});

// ============================================================
// getCapacity
// ============================================================

test('getCapacity returns full capacity when pool is empty', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 5 });
  const cap = ctrl.getCapacity(pool);
  assert.equal(cap.maxReplicas, 5);
  assert.equal(cap.used, 0);
  assert.equal(cap.available, 5);
  assert.equal(cap.utilizationPct, 0);
});

test('getCapacity accounts for Running runners', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 4 });
  ctrl.createRunner(pool, 'job-a');
  ctrl.createRunner(pool, 'job-b');
  const cap = ctrl.getCapacity(pool);
  assert.equal(cap.used, 2);
  assert.equal(cap.available, 2);
  assert.equal(cap.utilizationPct, 50);
});

// ============================================================
// createRunner
// ============================================================

test('createRunner creates an Idle runner when no runRef given', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  const result = ctrl.createRunner(pool, null);
  assert.equal(result.error, false);
  assert.ok(result.runnerId);
  assert.equal(result.runner.status, 'Idle');
  assert.equal(result.runner.runRef, null);
  assert.equal(result.runner.poolName, 'test-pool');
});

test('createRunner creates a Running runner when runRef given', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  const result = ctrl.createRunner(pool, 'run-42');
  assert.equal(result.error, false);
  assert.equal(result.runner.status, 'Running');
  assert.equal(result.runner.runRef, 'run-42');
});

test('createRunner returns error when pool has no name', () => {
  const ctrl = createRunnerController();
  const result = ctrl.createRunner({ spec: {} }, null);
  assert.equal(result.error, true);
  assert.equal(result.reason, 'missing-pool');
});

// ============================================================
// terminateRunner
// ============================================================

test('terminateRunner removes runner from registry', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  const { runnerId } = ctrl.createRunner(pool, null);
  const result = ctrl.terminateRunner(runnerId);
  assert.equal(result.error, false);
  assert.ok(result.terminatedAt);
  assert.equal(ctrl.getRunner(runnerId), null);
});

test('terminateRunner returns error for unknown runner', () => {
  const ctrl = createRunnerController();
  const result = ctrl.terminateRunner('no-such-runner');
  assert.equal(result.error, true);
  assert.equal(result.reason, 'not-found');
});

// ============================================================
// scheduleJob
// ============================================================

test('scheduleJob assigns an idle runner to a job', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  ctrl.createRunner(pool, null); // seed an idle runner
  const job = makeJob('job-x');
  const result = ctrl.scheduleJob(pool, job);
  assert.equal(result.error, false);
  assert.ok(result.runnerId);
  assert.equal(result.reused, false);
  const runner = ctrl.getRunnerForJob('job-x');
  assert.ok(runner);
  assert.equal(runner.status, 'Running');
});

test('scheduleJob creates a new runner when no idle runner exists', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 5 });
  const job = makeJob('job-new');
  const result = ctrl.scheduleJob(pool, job);
  assert.equal(result.error, false);
  assert.ok(result.runnerId);
});

test('scheduleJob returns no-capacity error when pool is full', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ maxReplicas: 1 });
  ctrl.createRunner(pool, 'run-already'); // fill the pool
  const job = makeJob('job-over-limit');
  const result = ctrl.scheduleJob(pool, job);
  assert.equal(result.error, true);
  assert.equal(result.reason, 'no-capacity');
});

test('scheduleJob is idempotent for already-assigned job', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  const job = makeJob('job-dup');
  const first = ctrl.scheduleJob(pool, job);
  const second = ctrl.scheduleJob(pool, job);
  assert.equal(first.runnerId, second.runnerId);
  assert.equal(second.reused, true);
});

// ============================================================
// getRunnerForJob
// ============================================================

test('getRunnerForJob returns null for unscheduled job', () => {
  const ctrl = createRunnerController();
  assert.equal(ctrl.getRunnerForJob('no-job'), null);
});

// ============================================================
// generatePodSpec
// ============================================================

test('generatePodSpec returns valid K8s Pod with workspace volume mount', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ organizationRef: 'acme' });
  const workspace = { runRef: 'run-99', mountPath: '/workspace', pvcName: 'krate-ws-run-99' };
  const podSpec = ctrl.generatePodSpec({ runnerId: 'runner-abc', pool }, workspace);
  assert.equal(podSpec.kind, 'Pod');
  assert.equal(podSpec.spec.containers[0].image, 'ubuntu:24.04');
  assert.ok(podSpec.spec.volumes.some((v) => v.persistentVolumeClaim?.claimName === 'krate-ws-run-99'));
  assert.ok(podSpec.spec.containers[0].volumeMounts.some((m) => m.mountPath === '/workspace'));
});

test('generatePodSpec injects required env vars', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ organizationRef: 'myorg' });
  const podSpec = ctrl.generatePodSpec({ runnerId: 'runner-xyz', pool }, { runRef: 'run-7', mountPath: '/workspace', pvcName: 'krate-ws-run-7' });
  const env = podSpec.spec.containers[0].env;
  assert.ok(env.some((e) => e.name === 'KRATE_ORG' && e.value === 'myorg'));
  assert.ok(env.some((e) => e.name === 'KRATE_RUN_ID'));
  assert.ok(env.some((e) => e.name === 'KRATE_WORKSPACE_PATH'));
});

test('generatePodSpec uses serviceAccount from pool spec', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ serviceAccount: 'custom-sa' });
  pool.spec.serviceAccount = 'custom-sa';
  const podSpec = ctrl.generatePodSpec({ runnerId: 'r', pool }, null);
  assert.equal(podSpec.spec.serviceAccountName, 'custom-sa');
});

test('generatePodSpec applies resource limits from pool config', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  pool.spec.resourceLimits = { cpu: '4', memory: '8Gi' };
  pool.spec.resourceRequests = { cpu: '1', memory: '2Gi' };
  const podSpec = ctrl.generatePodSpec({ runnerId: 'r', pool }, null);
  assert.equal(podSpec.spec.containers[0].resources.limits.cpu, '4');
  assert.equal(podSpec.spec.containers[0].resources.requests.memory, '2Gi');
});

test('generatePodSpec has no volumes when workspace is null', () => {
  const ctrl = createRunnerController();
  const pool = makePool();
  const podSpec = ctrl.generatePodSpec({ runnerId: 'r', pool }, null);
  assert.equal(podSpec.spec.volumes.length, 0);
  assert.equal(podSpec.spec.containers[0].volumeMounts.length, 0);
});

test('generatePodSpec sets pool and org labels on Pod', () => {
  const ctrl = createRunnerController();
  const pool = makePool({ name: 'my-pool', organizationRef: 'acme' });
  const podSpec = ctrl.generatePodSpec({ runnerId: 'r', pool }, null);
  assert.equal(podSpec.metadata.labels['krate.a5c.ai/pool'], 'my-pool');
  assert.equal(podSpec.metadata.labels['krate.a5c.ai/org'], 'acme');
});
