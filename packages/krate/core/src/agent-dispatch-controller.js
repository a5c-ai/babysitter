import { createPermissionReviewer } from './agent-permission-review.js';
import { createAgentStackController } from './agent-stack-controller.js';
import { assembleContextBundle } from './agent-context-bundles.js';
import { createResource, clone } from './resource-model.js';
import { createAgentMuxClient } from './agent-mux-client.js';
import { createAgentMemoryController } from './agent-memory-controller.js';
import { createAgentApprovalController } from './agent-approval-controller.js';
import { createAgentWorkspaceController } from './agent-workspace-controller.js';
import { createHooksLifecycleEmitter } from './hooks-lifecycle.js';

const MODEL_RATES = {
  'claude-sonnet-4-20250514': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-opus-4-20250514': { inputPer1k: 0.015, outputPer1k: 0.075 },
  'claude-haiku-4-20250514': { inputPer1k: 0.0008, outputPer1k: 0.004 },
  'gpt-4o': { inputPer1k: 0.005, outputPer1k: 0.015 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'gemini-1.5-pro': { inputPer1k: 0.00125, outputPer1k: 0.005 },
};
const DEFAULT_RATE = { inputPer1k: 0.003, outputPer1k: 0.015 };

function estimateCost(event) {
  if (!event?.usage) return 0;
  const model = event.model || 'claude-sonnet-4-20250514';
  const rate = MODEL_RATES[model] || DEFAULT_RATE;
  const inputCost = ((event.usage.inputTokens || 0) / 1000) * rate.inputPer1k;
  const outputCost = ((event.usage.outputTokens || 0) / 1000) * rate.outputPer1k;
  return inputCost + outputCost;
}

export const AGENT_DISPATCH_CONTROLLER_BOUNDARY = {
  role: 'agent-dispatch-controller',
  scope: 'Manual dispatch orchestration with permission gating, context assembly, workspace provisioning, stack resolution, K8s Job dispatch, and event persistence',
  owns: ['dispatch creation', 'attempt lifecycle', 'K8s Job dispatch binding', 'workspace provisioning', 'stack resolution', 'session event persistence'],
  delegatesTo: ['agent-permission-review', 'agent-stack-controller', 'agent-context-bundles', 'agent-mux-client', 'agent-memory-controller', 'agent-approval-controller', 'agent-workspace-controller'],
  mustNotOwn: ['secret values', 'UI rendering']
};

export function createAgentDispatchController(options = {}) {
  const permissionReviewer = options.permissionReviewer || createPermissionReviewer();
  const stackController = options.stackController || createAgentStackController();
  const agentMuxClient = options.agentMuxClient || createAgentMuxClient();
  const memoryController = options.memoryController || createAgentMemoryController();
  const approvalController = options.approvalController || createAgentApprovalController();
  const workspaceController = options.workspaceController || createAgentWorkspaceController();
  const eventBus = options.eventBus || null;
  const lifecycleEmitter = options.lifecycleEmitter || (eventBus ? createHooksLifecycleEmitter(eventBus) : null);

  return {
    role: 'agent-dispatch-controller',

    /**
     * Resolve an AgentStack CRD into a concrete execution config for agent-mux.
     *
     * @param {object} stack - AgentStack resource
     * @param {{ organizationRef?: string }} opts
     * @returns {{ adapter: string, provider: string, model: string, prompt: object, mcpServers: string[], skills: string[], approvalMode: string, env: Record<string,string> }}
     */
    resolveStack(stack, { organizationRef = 'default' } = {}) {
      if (!stack || !stack.spec) {
        throw new Error('resolveStack requires a valid AgentStack resource with spec');
      }
      const spec = stack.spec;

      // Merge flat mcpServerRefs with structured externalTools.mcpServerRefs (deduplicated)
      const mergedMcpServers = [
        ...(spec.mcpServerRefs || []),
        ...(spec.externalTools?.mcpServerRefs || [])
      ].filter((v, i, a) => a.indexOf(v) === i);

      const memoryConfig = {};
      if (spec.memoryRepositoryRefs && spec.memoryRepositoryRefs.length > 0) {
        memoryConfig.memoryRepositoryRefs = clone(spec.memoryRepositoryRefs);
      }
      if (spec.memorySnapshotRef) {
        memoryConfig.memorySnapshotRef = spec.memorySnapshotRef;
      }

      return {
        adapter: spec.adapter || spec.baseAgent || 'claude-code',
        provider: spec.provider || 'anthropic',
        model: spec.model || 'claude-sonnet-4-20250514',
        prompt: {
          system: spec.systemPrompt || null,
          developer: spec.developerPrompt || null,
          task: spec.taskPrompt || null,
        },
        mcpServers: clone(mergedMcpServers),
        skills: clone(spec.skillRefs || []),
        approvalMode: spec.approvalMode || 'prompt',
        env: {
          KRATE_ORG: organizationRef,
          KRATE_STACK_NAME: stack.metadata?.name || 'unknown',
        },
        memoryConfig: Object.keys(memoryConfig).length > 0 ? memoryConfig : null,
      };
    },

    /**
     * Check if the run has exceeded its token or cost budget.
     *
     * @param {object} run - AgentDispatchRun resource
     * @param {object} event - SSE event with optional usage field
     * @returns {{ exceeded: boolean, reason?: string, current?: number, limit?: number, totalTokens?: number, totalCost?: number }}
     */
    checkBudget(run, event) {
      const maxTokens = run.spec?.budget?.maxTokens ?? Infinity;
      const maxCostUsd = run.spec?.budget?.maxCostUsd ?? Infinity;
      const currentTokens = run.status?.tokenUsage?.totalTokens || 0;
      const eventTokens = event?.usage?.totalTokens
        || ((event?.usage?.inputTokens || 0) + (event?.usage?.outputTokens || 0));
      const totalTokens = currentTokens + eventTokens;
      const currentCost = run.status?.costUsd || 0;
      const totalCost = currentCost + estimateCost(event);

      if (totalTokens > maxTokens) {
        return { exceeded: true, reason: 'token_limit', current: totalTokens, limit: maxTokens };
      }
      if (totalCost > maxCostUsd) {
        return { exceeded: true, reason: 'cost_limit', current: totalCost, limit: maxCostUsd };
      }
      return { exceeded: false, totalTokens, totalCost };
    },

    /**
     * Persist a session event from an agent-mux session.
     * Appends to the transcript, updates the dispatch attempt status,
     * marks the run as Completed/Failed on terminal events, and emits to event bus.
     *
     * @param {object} event - The SSE event object
     * @param {object} run - AgentDispatchRun resource (mutated in place)
     * @param {object} attempt - AgentDispatchAttempt resource (mutated in place)
     * @param {{ namespace?: string, organizationRef?: string, transcript?: object }} opts
     * @returns {{ run: object, attempt: object, transcript: object, notification: object|null }}
     */
    persistSessionEvent(event, run, attempt, { namespace = 'default', organizationRef = 'default', transcript = null } = {}) {
      if (!event || typeof event !== 'object') {
        return { run, attempt, transcript, notification: null };
      }

      // Budget enforcement — check before persisting
      const budgetCheck = this.checkBudget(run, event);
      if (budgetCheck.exceeded) {
        const now = new Date().toISOString();
        run.status.phase = 'Failed';
        run.status.failedAt = now;
        run.status.failureReason = 'budget_exceeded';
        run.status.budgetExceeded = { reason: budgetCheck.reason, current: budgetCheck.current, limit: budgetCheck.limit };
        attempt.status.failedAt = now;
        attempt.status.failureReason = 'budget_exceeded';
        if (eventBus) {
          eventBus.emit({ type: 'run-complete', status: 'failed', name: run.metadata?.name, reason: 'budget_exceeded', timestamp: now });
        }
        const budgetNotification = { type: 'run-complete', status: 'failed', name: run.metadata?.name, reason: 'budget_exceeded', timestamp: now };
        return { run, attempt, transcript, notification: budgetNotification };
      }

      const now = new Date().toISOString();

      // 1. Append to AgentSessionTranscript
      if (!transcript) {
        const sessionRef = attempt?.status?.agentMuxSessionId || 'unknown';
        transcript = createResource('AgentSessionTranscript', { name: `transcript-${sessionRef}`, namespace }, {
          organizationRef,
          sessionRef,
          messages: [],
          cost: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        }, { phase: 'Streaming', startedAt: now });
      }

      const role = event.role || 'system';
      const content = event.content || event.text || event.message || '';
      const message = {
        role,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        timestamp: event.timestamp || now,
      };
      if (event.toolUse) message.toolUse = event.toolUse;
      if (event.toolResult) message.toolResult = event.toolResult;
      transcript.spec.messages.push(message);

      // Accumulate token usage
      if (event.usage) {
        transcript.spec.cost.inputTokens += event.usage.inputTokens || 0;
        transcript.spec.cost.outputTokens += event.usage.outputTokens || 0;
        transcript.spec.cost.totalTokens = transcript.spec.cost.inputTokens + transcript.spec.cost.outputTokens;

        if (!run.status.tokenUsage) run.status.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
        run.status.tokenUsage.inputTokens = (run.status.tokenUsage.inputTokens || 0) + (event.usage.inputTokens || 0);
        run.status.tokenUsage.outputTokens = (run.status.tokenUsage.outputTokens || 0) + (event.usage.outputTokens || 0);
        run.status.tokenUsage.totalTokens = run.status.tokenUsage.inputTokens + run.status.tokenUsage.outputTokens;
        run.status.costUsd = (run.status.costUsd || 0) + estimateCost(event);
      }

      // 2. Update AgentDispatchAttempt status
      attempt.status.lastEventAt = now;
      attempt.status.eventCount = (attempt.status.eventCount || 0) + 1;

      // 3. Terminal event handling
      let notification = null;
      if (event.type === 'completion') {
        run.status.phase = 'Completed';
        run.status.completedAt = now;
        attempt.status.completedAt = now;
        transcript.status.phase = 'Reconciled';
        transcript.status.reconciledAt = now;

        notification = {
          type: 'run-complete',
          status: 'completed',
          name: run.metadata?.name,
          org: organizationRef,
          timestamp: now,
        };

        if (lifecycleEmitter) {
          lifecycleEmitter.emitRunCompleted(run, { phase: 'Completed' });
          lifecycleEmitter.emitSessionEnded({ sessionId: attempt.status?.agentMuxSessionId, runId: attempt.status?.agentMuxRunId });
        }
      } else if (event.type === 'error') {
        run.status.phase = 'Failed';
        run.status.failedAt = now;
        run.status.failureReason = event.error || event.message || 'Unknown error';
        attempt.status.failedAt = now;
        attempt.status.failureReason = event.error || event.message || 'Unknown error';
        transcript.status.phase = 'Failed';

        notification = {
          type: 'run-complete',
          status: 'failed',
          name: run.metadata?.name,
          org: organizationRef,
          timestamp: now,
        };

        if (lifecycleEmitter) {
          lifecycleEmitter.emitRunCompleted(run, { phase: 'Failed' });
          lifecycleEmitter.emitSessionEnded({ sessionId: attempt.status?.agentMuxSessionId, runId: attempt.status?.agentMuxRunId });
        }
      }

      // 5. Emit to event bus for SSE broadcast
      if (eventBus) {
        eventBus.emit({
          type: 'session-event',
          runName: run.metadata?.name,
          eventType: event.type || 'message',
          timestamp: now,
        });
        if (notification) {
          eventBus.emit(notification);
        }
      }

      return { run, attempt, transcript, notification };
    },

    async createManualDispatch({ repository, ref, sourceRefs = [], agentStack, taskKind, actor, namespace = 'default', organizationRef = 'default', resources = {}, callbackUrl } = {}, options = {}) {
      // 1. Find stack
      const stack = (resources.AgentStack || []).find(s => s.metadata?.name === agentStack);
      if (!stack) return { error: true, reason: 'stack-not-found', message: `AgentStack '${agentStack}' not found` };

      // 2. Permission review
      const review = permissionReviewer.reviewPermissions({ repository, ref, actor, agentStack, resources });
      if (review.decision === 'denied') {
        return { error: true, reason: 'permission-denied', message: 'Dispatch denied by permission review', review };
      }
      const permissionSnapshot = permissionReviewer.createPermissionSnapshot(review);

      // 3. Memory snapshot — use stack-scoped memoryRepositoryRefs if present, else fall back to all repos
      let memorySnapshot = null;
      const allMemoryRepos = resources.AgentMemoryRepository || [];
      const stackMemoryRefs = stack.spec?.memoryRepositoryRefs || [];
      const scopedMemoryRepos = stackMemoryRefs.length > 0
        ? allMemoryRepos.filter((r) => stackMemoryRefs.includes(r.metadata?.name))
        : allMemoryRepos;
      if (scopedMemoryRepos.length > 0) {
        const memRepo = scopedMemoryRepos[0];
        const timeTravel = memoryController.resolveTimeTravel({ mode: 'current', commits: [] });
        memorySnapshot = memoryController.createMemorySnapshot({
          memoryRepository: memRepo.metadata.name,
          requestedRef: ref,
          resolvedCommit: timeTravel.resolvedCommit || ref,
          queryManifest: {},
          selectedRecords: [],
          selectedDocuments: [],
          ontologyDigest: '',
          namespace,
          organizationRef,
        });
      }

      // 4. Approval gate — if review requires approval, create approval and return early
      if (review.decision === 'requires-approval') {
        const now = new Date().toISOString();
        const runName = `dispatch-${Date.now()}`;

        const run = createResource('AgentDispatchRun', { name: runName, namespace }, {
          organizationRef,
          repository,
          sourceRefs: clone(sourceRefs),
          agentStack,
          taskKind: taskKind || 'diagnostic',
          contextBundleRef: null,
        });
        run.status = { phase: 'AwaitingApproval', queuedAt: now };
        if (memorySnapshot) {
          run.spec.memorySnapshotRef = memorySnapshot.metadata.name;
        }

        const approvalResult = approvalController.createApprovalRequest({
          dispatchRun: runName,
          action: 'secret-access',
          requestedBy: actor,
          context: `Dispatch requires approval for agent stack: ${agentStack}`,
          namespace,
          organizationRef,
          resources,
        });

        return {
          error: false,
          run,
          approval: approvalResult.error ? null : approvalResult.approval,
          awaitingApproval: true,
          memorySnapshot,
          permissionSnapshot,
          review,
        };
      }

      // 5. Workspace provisioning — reuse or create
      let workspaceResult = null;
      let mountSpec = null;
      const branch = ref || 'main';

      const reusable = workspaceController.findReusableWorkspace({
        organizationRef, repository, branch, resources,
      });

      if (reusable) {
        const claimResult = workspaceController.claimWorkspace({
          name: reusable.metadata.name,
          runRef: `dispatch-pending`,
          resources,
        });
        if (!claimResult.error) {
          workspaceResult = { workspace: claimResult.workspace, reused: true };
          const mount = workspaceController.getMountSpec({ workspace: claimResult.workspace });
          if (!mount.error) mountSpec = { volume: mount.volume, volumeMount: mount.volumeMount };
        }
      }

      if (!workspaceResult) {
        const createResult = workspaceController.createWorkspace({
          organizationRef, repository, branch, namespace,
          volumeSpec: {},
        });
        if (!createResult.error) {
          workspaceResult = { workspace: createResult.workspace, pvcManifest: createResult.pvcManifest, reused: false };
          const mount = workspaceController.getMountSpec({ workspace: createResult.workspace });
          if (!mount.error) mountSpec = { volume: mount.volume, volumeMount: mount.volumeMount };
        }
      }

      // 6. Assemble context bundle
      const contextBundle = assembleContextBundle({ stack, repository, ref, sourceRefs, contextLabels: [], resources });

      // 7. Create resources
      const now = new Date().toISOString();
      const runName = `dispatch-${Date.now()}`;

      const run = createResource('AgentDispatchRun', { name: runName, namespace }, {
        organizationRef,
        repository,
        sourceRefs: clone(sourceRefs),
        agentStack,
        taskKind: taskKind || 'diagnostic',
        contextBundleRef: contextBundle.metadata.name,
      });
      run.status = { phase: 'Pending', queuedAt: now };
      if (memorySnapshot) {
        run.spec.memorySnapshotRef = memorySnapshot.metadata.name;
      }
      if (workspaceResult) {
        run.spec.workspaceRef = workspaceResult.workspace.metadata.name;
      }
      if (mountSpec) {
        run.spec.mountSpec = mountSpec;
      }

      if (lifecycleEmitter) {
        lifecycleEmitter.emitRunCreated(run);
        if (workspaceResult) {
          lifecycleEmitter.emitWorkspaceProvisioned(workspaceResult.workspace);
        }
      }

      // Update workspace runRef to actual dispatch name
      if (workspaceResult) {
        workspaceResult.workspace.status.runRef = runName;
      }

      const attempt = createResource('AgentDispatchAttempt', { name: `${runName}-attempt-1`, namespace }, {
        organizationRef,
        agentDispatchRun: runName,
        attemptReason: 'initial',
        agentStackSnapshot: clone(stack.spec),
        contextBundleDigest: contextBundle.spec.digest,
      });
      attempt.status = { permissionSnapshot, queueEnteredAt: now };

      // 7. Dispatch as K8s Job
      let transcript = null;
      let jobResult = null;

      const executionConfig = this.resolveStack(stack, { organizationRef });
      const pvcName = workspaceResult?.workspace?.spec?.volumeClaimName || workspaceResult?.pvcManifest?.metadata?.name || null;
      const resolvedCallbackUrl = callbackUrl || process.env.KRATE_CALLBACK_URL || null;

      try {
        // Inject memory config env vars into the Job when memory repos are scoped
        const jobEnv = { ...executionConfig.env };
        if (executionConfig.memoryConfig) {
          if (executionConfig.memoryConfig.memoryRepositoryRefs) {
            jobEnv.KRATE_MEMORY_REPOS = executionConfig.memoryConfig.memoryRepositoryRefs.join(',');
          }
          if (executionConfig.memoryConfig.memorySnapshotRef) {
            jobEnv.KRATE_MEMORY_SNAPSHOT = executionConfig.memoryConfig.memorySnapshotRef;
          }
        }

        const { jobManifest, jobName } = agentMuxClient.createAgentJob({
          adapter: executionConfig.adapter,
          provider: executionConfig.provider,
          model: executionConfig.model,
          org: organizationRef,
          runId: runName,
          stackName: stack.metadata?.name,
          budget: stack.spec?.budget,
          image: stack.spec?.image,
          serviceAccount: stack.spec?.runtimeIdentity?.serviceAccountRef,
          callbackUrl: resolvedCallbackUrl,
          prompt: executionConfig.prompt,
          env: jobEnv,
          workspace: pvcName ? { pvcName } : undefined,
          resources: stack.spec?.resources,
        });

        attempt.status.jobName = jobName;
        attempt.status.jobNamespace = jobManifest.metadata.namespace;
        run.spec.jobRef = jobName;

        try {
          const submitResult = await agentMuxClient.submitAgentJob(jobManifest);
          run.status.phase = 'Running';
          attempt.status.startedAt = now;
          attempt.status.jobSubmitted = true;
          jobResult = { jobName: submitResult.jobName, namespace: submitResult.namespace, submitted: true };

          if (lifecycleEmitter) {
            lifecycleEmitter.emitSessionStarted({ sessionId: jobName, runId: runName });
            lifecycleEmitter.emitStepStarted(run, 'launch');
          }
        } catch {
          // Job manifest was generated but submission failed — queue for retry
          run.status.phase = 'Queued';
          run.status.conditions = [{ type: 'JobSubmitted', status: 'False', reason: 'SubmitFailed', message: 'K8s Job submission failed' }];
          jobResult = { jobName, namespace: jobManifest.metadata.namespace, submitted: false };
        }
      } catch (err) {
        run.status.phase = 'Queued';
        run.status.conditions = [{ type: 'JobSubmitted', status: 'False', reason: 'ManifestFailed', message: err.message || 'Job manifest generation failed' }];
      }

      return { error: false, run, attempt, contextBundle, permissionSnapshot, memorySnapshot, transcript, workspace: workspaceResult, mountSpec, jobResult };
    }
  };
}
