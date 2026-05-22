import { createResource, clone } from './resource-model.js';

export const AGENT_WRITEBACK_CONTROLLER_BOUNDARY = {
  role: 'agent-writeback-controller',
  scope: 'KrateArtifact write pipeline, branch push approval flow, and PR merge with status check enforcement',
  owns: ['artifact creation', 'artifact listing', 'branch push requests', 'push approval/denial', 'PR merge requests', 'write intent validation', 'write intent status'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['git operations', 'secret values', 'agent execution', 'CI orchestration']
};

const VALID_WRITE_TYPES = new Set(['artifact', 'branch-push', 'pr-merge']);

/**
 * In-memory store of AgentWriteIntent records (plain objects, not K8s CRDs,
 * because AgentWriteIntent is not in the canonical resource taxonomy).
 * Controllers operate statelessly against caller-supplied resources maps;
 * the write intent shape mirrors what would live in an aggregated store.
 */

export function createAgentWritebackController() {
  return {
    role: 'agent-writeback-controller',

    // -----------------------------------------------------------------------
    // Artifacts
    // -----------------------------------------------------------------------

    createArtifact({ name, runRef, contentRef, kind = 'output', namespace = 'default', organizationRef = 'default' }) {
      if (!runRef) {
        return { error: true, reason: 'missing-run-ref', message: 'runRef is required to link an artifact to a dispatch run' };
      }
      if (!contentRef) {
        return { error: true, reason: 'missing-content-ref', message: 'contentRef is required to identify the artifact content' };
      }

      const now = new Date().toISOString();
      const artifactName = name || `artifact-${runRef}-${Date.now()}`;

      const artifact = createResource('KrateArtifact', { name: artifactName, namespace }, {
        organizationRef,
        dispatchRun: runRef,
        kind,
        digest: contentRef
      });
      artifact.status = { phase: 'Available', createdAt: now };

      return { error: false, artifact };
    },

    validateArtifact({ artifact }) {
      if (!artifact || typeof artifact !== 'object') {
        return { valid: false, error: true, reason: 'invalid-artifact', message: 'artifact must be an object' };
      }
      if (artifact.kind !== 'KrateArtifact') {
        return { valid: false, error: true, reason: 'wrong-kind', message: `Expected KrateArtifact, got: ${artifact.kind}` };
      }
      if (!artifact.spec?.dispatchRun) {
        return { valid: false, error: true, reason: 'missing-run-ref', message: 'artifact spec.dispatchRun is required' };
      }
      if (!artifact.spec?.digest) {
        return { valid: false, error: true, reason: 'missing-digest', message: 'artifact spec.digest is required' };
      }
      return { valid: true, error: false };
    },

    listArtifactsForRun({ runRef, resources = {} }) {
      const artifacts = resources.KrateArtifact || [];
      return artifacts.filter((a) => a.spec?.dispatchRun === runRef).map(clone);
    },

    // -----------------------------------------------------------------------
    // Branch push approval flow
    // -----------------------------------------------------------------------

    requestBranchPush({ runRef, branch, targetRepo, requestedBy, namespace = 'default', organizationRef = 'default' }) {
      if (!runRef) {
        return { error: true, reason: 'missing-run-ref', message: 'runRef is required' };
      }
      if (!branch) {
        return { error: true, reason: 'missing-branch', message: 'branch is required' };
      }
      if (!targetRepo) {
        return { error: true, reason: 'missing-target-repo', message: 'targetRepo is required' };
      }

      const now = new Date().toISOString();
      const intentName = `push-${runRef}-${Date.now()}`;

      const pushRequest = {
        kind: 'AgentWriteIntent',
        metadata: { name: intentName, namespace, labels: {}, annotations: {} },
        spec: { organizationRef, runRef, branch, targetRepo, writeType: 'branch-push', requestedBy: requestedBy || 'unknown', requestedAt: now },
        status: { approvalStatus: 'pending', phase: 'Pending', createdAt: now }
      };

      return { error: false, pushRequest };
    },

    approveBranchPush({ intentName, approvedBy, reason, resources = {} }) {
      if (!intentName) {
        return { error: true, reason: 'missing-intent-name', message: 'intentName is required' };
      }
      if (!approvedBy) {
        return { error: true, reason: 'missing-approved-by', message: 'approvedBy is required' };
      }

      const intents = resources.AgentWriteIntent || [];
      const intent = intents.find((i) => i.metadata?.name === intentName);
      if (!intent) {
        return { error: true, reason: 'not-found', message: `AgentWriteIntent not found: ${intentName}` };
      }
      if (intent.status?.approvalStatus !== 'pending') {
        return { error: true, reason: 'already-decided', message: `AgentWriteIntent ${intentName} has already been decided: ${intent.status?.approvalStatus}` };
      }

      const now = new Date().toISOString();
      const pushRequest = clone(intent);
      pushRequest.status = {
        ...pushRequest.status,
        approvalStatus: 'approved',
        phase: 'Approved',
        approvedBy,
        approvedAt: now,
        reason: reason || undefined
      };

      return { error: false, pushRequest };
    },

    denyBranchPush({ intentName, deniedBy, reason, resources = {} }) {
      if (!intentName) {
        return { error: true, reason: 'missing-intent-name', message: 'intentName is required' };
      }
      if (!deniedBy) {
        return { error: true, reason: 'missing-denied-by', message: 'deniedBy is required' };
      }

      const intents = resources.AgentWriteIntent || [];
      const intent = intents.find((i) => i.metadata?.name === intentName);
      if (!intent) {
        return { error: true, reason: 'not-found', message: `AgentWriteIntent not found: ${intentName}` };
      }
      if (intent.status?.approvalStatus !== 'pending') {
        return { error: true, reason: 'already-decided', message: `AgentWriteIntent ${intentName} has already been decided: ${intent.status?.approvalStatus}` };
      }

      const now = new Date().toISOString();
      const pushRequest = clone(intent);
      pushRequest.status = {
        ...pushRequest.status,
        approvalStatus: 'denied',
        phase: 'Denied',
        deniedBy,
        deniedAt: now,
        reason: reason || undefined
      };

      return { error: false, pushRequest };
    },

    // -----------------------------------------------------------------------
    // PR merge with status check enforcement
    // -----------------------------------------------------------------------

    requestPrMerge({ runRef, prRef, statusChecks = [], requestedBy, namespace = 'default', organizationRef = 'default' }) {
      if (!runRef) {
        return { error: true, reason: 'missing-run-ref', message: 'runRef is required' };
      }
      if (!prRef) {
        return { error: true, reason: 'missing-pr-ref', message: 'prRef is required' };
      }

      // Enforce status check gate — reject if any check is not 'success'
      const failing = statusChecks.filter((c) => c.state !== 'success');
      if (failing.length > 0) {
        const names = failing.map((c) => c.name).join(', ');
        return { error: true, reason: 'status-checks-failing', message: `The following status checks are not passing: ${names}` };
      }

      const now = new Date().toISOString();
      const intentName = `merge-${runRef}-${Date.now()}`;

      const mergeRequest = {
        kind: 'AgentWriteIntent',
        metadata: { name: intentName, namespace, labels: {}, annotations: {} },
        spec: { organizationRef, runRef, prRef, writeType: 'pr-merge', statusChecks: clone(statusChecks), requestedBy: requestedBy || 'unknown', requestedAt: now },
        status: { approvalStatus: 'pending', phase: 'Pending', createdAt: now }
      };

      return { error: false, mergeRequest };
    },

    // -----------------------------------------------------------------------
    // Write intent validation & status
    // -----------------------------------------------------------------------

    validateWriteIntent({ intent }) {
      if (!intent || typeof intent !== 'object') {
        return { valid: false, error: true, reason: 'invalid-intent', message: 'intent must be an object' };
      }
      const writeType = intent.spec?.writeType;
      if (!writeType || !VALID_WRITE_TYPES.has(writeType)) {
        return { valid: false, error: true, reason: 'invalid-write-type', message: `Unknown write type: ${writeType}. Must be one of: ${[...VALID_WRITE_TYPES].join(', ')}` };
      }
      if (!intent.spec?.runRef) {
        return { valid: false, error: true, reason: 'missing-run-ref', message: 'intent spec.runRef is required' };
      }
      return { valid: true, error: false };
    },

    getWriteIntentStatus({ intentName, resources = {} }) {
      if (!intentName) {
        return { error: true, reason: 'missing-intent-name', message: 'intentName is required' };
      }

      const intents = resources.AgentWriteIntent || [];
      const intent = intents.find((i) => i.metadata?.name === intentName);
      if (!intent) {
        return { error: true, reason: 'not-found', message: `AgentWriteIntent not found: ${intentName}` };
      }

      return {
        error: false,
        intent: clone(intent),
        approvalStatus: intent.status?.approvalStatus || 'pending',
        phase: intent.status?.phase || 'Pending',
        approvedBy: intent.status?.approvedBy || null,
        deniedBy: intent.status?.deniedBy || null,
        approvedAt: intent.status?.approvedAt || null,
        deniedAt: intent.status?.deniedAt || null,
        reason: intent.status?.reason || null
      };
    },

    // -----------------------------------------------------------------------
    // B2: Persistence
    // -----------------------------------------------------------------------

    async persistWriteIntent({ intent, applyResource }) {
      if (!intent) {
        return { error: true, reason: 'missing-intent', message: 'intent is required' };
      }
      if (typeof applyResource !== 'function') {
        return { error: true, reason: 'missing-apply-resource', message: 'applyResource function is required' };
      }
      try {
        const applyResult = await applyResource(intent);
        return { error: false, intent, applyResult };
      } catch (err) {
        return { error: true, reason: 'persist-failed', message: err?.message || 'applyResource failed' };
      }
    },

    // -----------------------------------------------------------------------
    // B2: Execution pipeline
    // -----------------------------------------------------------------------

    async executeWriteIntent({ intent, gateway }) {
      if (!intent) {
        return { error: true, reason: 'missing-intent', message: 'intent is required' };
      }

      const approvalStatus = intent.status?.approvalStatus;
      if (approvalStatus !== 'approved') {
        return { error: true, reason: 'not-approved', message: `WriteIntent is not approved (current status: ${approvalStatus})` };
      }

      const writeType = intent.spec?.writeType;

      try {
        if (writeType === 'branch-push') {
          const executionResult = await gateway.pushBranch({
            branch: intent.spec.branch,
            targetRepo: intent.spec.targetRepo,
            runRef: intent.spec.runRef
          });
          return { error: false, executionResult };
        }

        if (writeType === 'pr-merge') {
          // Validate status checks before merging
          const statusChecks = intent.spec?.statusChecks || [];
          const failing = statusChecks.filter((c) => c.state !== 'success');
          if (failing.length > 0) {
            const names = failing.map((c) => c.name).join(', ');
            return { error: true, reason: 'status-checks-failing', message: `The following status checks are not passing: ${names}` };
          }

          const executionResult = await gateway.mergePr({
            prRef: intent.spec.prRef,
            runRef: intent.spec.runRef
          });
          return { error: false, executionResult };
        }

        return { error: true, reason: 'unsupported-write-type', message: `Execution not supported for writeType: ${writeType}` };
      } catch (err) {
        return { error: true, reason: 'execution-failed', message: err?.message || 'Gateway execution failed' };
      }
    }
  };
}
