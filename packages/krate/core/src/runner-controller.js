import { createResource, clone } from './resource-model.js';
import { serviceAccountForJob } from './identity-policy.js';

export const RUNNER_CONTROLLER_BOUNDARY = {
  role: 'runner-controller',
  scope: 'RunnerPool lifecycle, runner scheduling, pod spec generation, job assignment',
  owns: ['pool validation', 'runner lifecycle', 'job scheduling', 'pod spec generation', 'capacity tracking'],
  delegatesTo: ['resource-model', 'identity-policy'],
  mustNotOwn: ['Kubernetes API calls', 'actual pod creation', 'network I/O']
};

const RUNNER_STATUSES = new Set(['Idle', 'Running', 'Terminating']);
const DEFAULT_IMAGE = 'ubuntu:24.04';
const DEFAULT_SERVICE_ACCOUNT = 'krate-runner';
const DEFAULT_NAMESPACE = 'krate-org-default';

export function createRunnerController() {
  // In-memory runner registry (runner id → runner record)
  const runners = new Map();
  // job ref → runner id
  const jobAssignments = new Map();

  return {
    role: 'runner-controller',

    // -------------------------------------------------------------------------
    // Pool management
    // -------------------------------------------------------------------------

    validateRunnerPool(resource) {
      if (!resource || typeof resource !== 'object') {
        return { valid: false, reason: 'missing-resource', message: 'resource is required' };
      }
      const name = resource.metadata?.name;
      if (!name) return { valid: false, reason: 'missing-name', message: 'metadata.name is required' };

      const spec = resource.spec || {};
      if (spec.organizationRef === undefined || spec.organizationRef === null || String(spec.organizationRef).trim() === '') return { valid: false, reason: 'missing-org', message: 'spec.organizationRef is required' };

      const min = Number(spec.warmReplicas ?? 0);
      const max = Number(spec.maxReplicas ?? 0);
      if (!Number.isInteger(min) || min < 0) return { valid: false, reason: 'invalid-min-replicas', message: 'spec.warmReplicas must be a non-negative integer' };
      if (!Number.isInteger(max) || max < 1) return { valid: false, reason: 'invalid-max-replicas', message: 'spec.maxReplicas must be a positive integer' };
      if (min > max) return { valid: false, reason: 'replicas-conflict', message: 'spec.warmReplicas must not exceed spec.maxReplicas' };

      return {
        valid: true,
        name,
        organizationRef: spec.organizationRef,
        warmReplicas: min,
        maxReplicas: max,
        image: spec.image || DEFAULT_IMAGE,
        labels: resource.metadata?.labels || {}
      };
    },

    getPoolStatus(pool) {
      const poolName = pool?.metadata?.name;
      const poolRunners = [...runners.values()].filter((r) => r.poolName === poolName);
      const idle = poolRunners.filter((r) => r.status === 'Idle').length;
      const active = poolRunners.filter((r) => r.status === 'Running').length;
      const terminating = poolRunners.filter((r) => r.status === 'Terminating').length;
      const total = poolRunners.length;
      const desired = Number(pool?.spec?.warmReplicas ?? 0);
      const maxReplicas = Number(pool?.spec?.maxReplicas ?? 0);

      return {
        poolName,
        idle,
        active,
        terminating,
        total,
        desired,
        maxReplicas,
        phase: total === 0 ? 'Empty' : active > 0 ? 'Active' : 'Idle',
        scaling: total < desired ? 'ScalingUp' : total > maxReplicas ? 'ScalingDown' : 'Stable'
      };
    },

    getCapacity(pool) {
      const poolName = pool?.metadata?.name;
      const poolRunners = [...runners.values()].filter((r) => r.poolName === poolName);
      const maxReplicas = Number(pool?.spec?.maxReplicas ?? 0);
      const used = poolRunners.filter((r) => r.status === 'Running').length;
      const available = Math.max(0, maxReplicas - used);

      return {
        poolName,
        maxReplicas,
        used,
        available,
        utilizationPct: maxReplicas > 0 ? Math.round((used / maxReplicas) * 100) : 0
      };
    },

    // -------------------------------------------------------------------------
    // Runner lifecycle
    // -------------------------------------------------------------------------

    createRunner(pool, runRef = null) {
      const poolName = pool?.metadata?.name;
      if (!poolName) return { error: true, reason: 'missing-pool', message: 'pool.metadata.name is required' };

      const namespace = pool?.metadata?.namespace || DEFAULT_NAMESPACE;
      const spec = pool?.spec || {};
      const runnerId = `runner-${poolName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const workspace = runRef ? { runRef, mountPath: '/workspace' } : null;
      const podSpec = this.generatePodSpec({ runnerId, pool }, workspace);

      const runner = {
        id: runnerId,
        poolName,
        namespace,
        status: runRef ? 'Running' : 'Idle',
        runRef: runRef || null,
        createdAt: new Date().toISOString(),
        image: spec.image || DEFAULT_IMAGE,
        podSpec
      };

      runners.set(runnerId, runner);
      if (runRef) jobAssignments.set(runRef, runnerId);

      return { error: false, runnerId, runner: clone(runner) };
    },

    terminateRunner(runnerId) {
      const runner = runners.get(runnerId);
      if (!runner) return { error: true, reason: 'not-found', message: `Runner not found: ${runnerId}` };

      // Remove job assignment if any
      if (runner.runRef) jobAssignments.delete(runner.runRef);

      runner.status = 'Terminating';
      runner.terminatedAt = new Date().toISOString();
      runners.delete(runnerId);

      return { error: false, runnerId, terminatedAt: runner.terminatedAt };
    },

    // -------------------------------------------------------------------------
    // Job scheduling
    // -------------------------------------------------------------------------

    scheduleJob(pool, job) {
      const jobRef = job?.metadata?.name || job?.ref;
      if (!jobRef) return { error: true, reason: 'missing-job-ref', message: 'job.metadata.name or job.ref is required' };

      const poolName = pool?.metadata?.name;
      if (!poolName) return { error: true, reason: 'missing-pool', message: 'pool.metadata.name is required' };

      // Check if already assigned
      if (jobAssignments.has(jobRef)) {
        const existingRunnerId = jobAssignments.get(jobRef);
        return { error: false, runnerId: existingRunnerId, reused: true };
      }

      // Find an idle runner in this pool
      const idleRunner = [...runners.values()].find(
        (r) => r.poolName === poolName && r.status === 'Idle'
      );

      if (idleRunner) {
        idleRunner.status = 'Running';
        idleRunner.runRef = jobRef;
        idleRunner.assignedAt = new Date().toISOString();
        jobAssignments.set(jobRef, idleRunner.id);
        return { error: false, runnerId: idleRunner.id, reused: false, runner: clone(idleRunner) };
      }

      // Check capacity for a new runner
      const capacity = this.getCapacity(pool);
      if (capacity.available <= 0) {
        return { error: true, reason: 'no-capacity', message: `Pool ${poolName} has no available capacity (${capacity.used}/${capacity.maxReplicas})` };
      }

      // Create a new runner
      const result = this.createRunner(pool, jobRef);
      if (result.error) return result;
      return { error: false, runnerId: result.runnerId, reused: false, runner: result.runner };
    },

    getRunnerForJob(jobRef) {
      const runnerId = jobAssignments.get(jobRef);
      if (!runnerId) return null;
      const runner = runners.get(runnerId);
      return runner ? clone(runner) : null;
    },

    // -------------------------------------------------------------------------
    // Pod spec generation
    // -------------------------------------------------------------------------

    generatePodSpec({ runnerId, pool }, workspace = null) {
      const spec = pool?.spec || {};
      const namespace = pool?.metadata?.namespace || DEFAULT_NAMESPACE;
      const image = spec.image || DEFAULT_IMAGE;
      const organizationRef = spec.organizationRef || 'default';
      const serviceAccountName = spec.serviceAccount || DEFAULT_SERVICE_ACCOUNT;
      const runId = workspace?.runRef || runnerId;

      const resourceLimits = spec.resourceLimits || {};
      const resourceRequests = spec.resourceRequests || {};

      const envVars = [
        { name: 'KRATE_ORG', value: organizationRef },
        { name: 'KRATE_RUN_ID', value: runId },
        { name: 'KRATE_WORKSPACE_PATH', value: workspace?.mountPath || '/workspace' }
      ];

      const volumes = [];
      const volumeMounts = [];

      if (workspace) {
        const pvcName = workspace.pvcName || `krate-ws-${runId}`;
        volumes.push({
          name: 'workspace',
          persistentVolumeClaim: { claimName: pvcName }
        });
        volumeMounts.push({
          name: 'workspace',
          mountPath: workspace.mountPath || '/workspace'
        });
      }

      return {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: `runner-${runnerId}`,
          namespace,
          labels: {
            'krate.a5c.ai/runner': runnerId,
            'krate.a5c.ai/pool': pool?.metadata?.name || 'unknown',
            'krate.a5c.ai/org': organizationRef
          }
        },
        spec: {
          serviceAccountName,
          restartPolicy: 'Never',
          containers: [{
            name: 'runner',
            image,
            env: envVars,
            volumeMounts,
            resources: {
              limits: Object.keys(resourceLimits).length ? resourceLimits : { cpu: '2', memory: '4Gi' },
              requests: Object.keys(resourceRequests).length ? resourceRequests : { cpu: '500m', memory: '1Gi' }
            }
          }],
          volumes
        }
      };
    },

    // -------------------------------------------------------------------------
    // Introspection helpers
    // -------------------------------------------------------------------------

    listRunners(poolName = null) {
      const all = [...runners.values()];
      if (poolName) return all.filter((r) => r.poolName === poolName).map(clone);
      return all.map(clone);
    },

    getRunner(runnerId) {
      const r = runners.get(runnerId);
      return r ? clone(r) : null;
    }
  };
}
