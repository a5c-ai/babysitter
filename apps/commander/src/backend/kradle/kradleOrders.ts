/**
 * Real-mode `Orders` over the kradle control plane (SPEC-KRADLE-MODEL §3/§4,
 * AC4). Resource-lifecycle verbs call the client; runtime verbs route to the
 * optional gateway `Orders` via the plane resolution; everything else stays a
 * documented warn-once no-op with the SAME signature (never throws).
 *
 * Commander dispatches **by stack** (`agentStack`/`stackRef`, SPEC §3.4) — it
 * has no persona system. The invented roster is removed from the model (SPEC
 * §2.4/§5.2); the roster `Orders` verbs (`createRosterAgent`/`deleteRosterAgent`/
 * `assignTaskAgent`/`assignTaskHuman`) survive here ONLY as documented no-ops
 * until the store slice is removed in the UI phase (they no longer write
 * definitions).
 *
 * `makeKradleOrders(client, options)` is built once in `bootReal`. It fires
 * client calls fire-and-forget (mirroring the gateway's frame verbs): on success
 * it asks the boot layer to schedule a debounced snapshot refresh so the board
 * reflects the write; on failure it logs and swallows (no retry loop). The
 * snapshot accessor lets `decide`/`abort` resolve a pending approval name / run
 * id for plane routing.
 */

import type { KradleAgentStackInput } from '../../contracts/kradle-stack';
import type { AgentDefinitionSpec } from '../../contracts/kradle-identity';
import type { AgentProcessTemplateSpec } from '../../contracts/kradle-resources';
import type { ColumnId, RosterRole, UpdateTaskPatch } from '../mock/simulation';
import type { TaskKind } from '../mock/scenario';
import { DEFAULT_STACK_BY_KIND, WORKER_ADAPTER_BY_KIND } from '../mock/scenario';
import type { Orders } from '../../game/store';
import type {
  ApprovalDecision,
  DispatchInput,
  KradleControllerClient,
  KradleControllerSnapshot,
  KradleResourceItem,
  ResourceApplyBody,
} from './controllerClient';
import { LABEL_DEFAULT_FOR } from './mappers';

export interface KradleOrdersOptions {
  /** Default dispatch repository (`config.kradleRepo`, §3.1). */
  repo: string;
  /** Read the latest cached snapshot (for approval/run resolution, §3.3). */
  getSnapshot(): KradleControllerSnapshot | null;
  /** Ask the boot layer to schedule a debounced refresh after a write (§6.3). */
  scheduleRefresh(): void;
  /** The gateway `Orders` when a gateway backend is also present (§3.3 routing). */
  gatewayOrders?: Orders;
}

// ---------------------------------------------------------------------------
// Small structural readers (the snapshot items are wide; narrow `unknown`).
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function specOf(item: KradleResourceItem): Record<string, unknown> {
  return isRecord(item.spec) ? item.spec : {};
}

function labelsOf(item: KradleResourceItem): Record<string, string> {
  const raw = item.metadata.labels;
  if (!isRecord(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function runItems(snapshot: KradleControllerSnapshot | null): KradleResourceItem[] {
  return snapshot?.agents?.runs?.items ?? [];
}

function pendingApprovals(snapshot: KradleControllerSnapshot | null): KradleResourceItem[] {
  const pending = snapshot?.agents?.approvals?.pending;
  if (Array.isArray(pending)) return pending;
  const all = snapshot?.agents?.approvals?.items ?? [];
  return all.filter((a) => {
    const phase = isRecord(a.status) ? asString(a.status.phase) : undefined;
    return phase === undefined || phase === 'Pending';
  });
}

function stackItems(snapshot: KradleControllerSnapshot | null): KradleResourceItem[] {
  return snapshot?.agents?.stacks?.items ?? [];
}

function definitionItems(snapshot: KradleControllerSnapshot | null): KradleResourceItem[] {
  return snapshot?.agents?.definitions?.items ?? [];
}

// ---------------------------------------------------------------------------
// Stack resolution for dispatch (§3.1).
// ---------------------------------------------------------------------------

const ADAPTER_FAMILY: Record<string, string> = {
  'claude-code': 'claude-code',
  codex: 'codex',
  'gemini-cli': 'gemini-cli',
  pi: 'pi',
};

function adapterFamily(adapter: string | undefined): string | undefined {
  if (adapter === undefined) return undefined;
  for (const family of Object.keys(ADAPTER_FAMILY)) {
    if (adapter === family || adapter.includes(family)) return family;
  }
  return adapter;
}

/**
 * §3.1 stack resolution: prefer a stack labeled `default-for=<taskKind>`, else
 * the first stack whose adapter family matches `WORKER_ADAPTER_BY_KIND`, else the
 * first stack. Returns the stack name or `null` when no stack exists.
 */
export function resolveDispatchStack(
  snapshot: KradleControllerSnapshot | null,
  taskKind: TaskKind,
): string | null {
  const stacks = stackItems(snapshot);
  if (stacks.length === 0) {
    // No live stacks in the snapshot: fall back to the kind's seeded default ref
    // (the dispatch route resolves it server-side / legacy AgentStack path).
    return DEFAULT_STACK_BY_KIND[taskKind] ?? null;
  }
  const labelled = stacks.find((s) => labelsOf(s)[LABEL_DEFAULT_FOR] === taskKind);
  if (labelled !== undefined) return labelled.metadata.name;

  const wantFamily = WORKER_ADAPTER_BY_KIND[taskKind];
  const byFamily = stacks.find((s) => adapterFamily(asString(specOf(s).adapter)) === wantFamily);
  if (byFamily !== undefined) return byFamily.metadata.name;

  return stacks[0]!.metadata.name;
}

/**
 * Dispatch-by-definition resolution: prefer an `AgentDefinition` chosen
 * explicitly (`definitionRef`), else one labeled `default-for=<taskKind>`.
 * Returns the definition name, or `null` when none applies (the caller then
 * falls back to dispatch-by-stack). The dispatch route accepts either via its
 * anyOf(agentStack|agentDefinition) (`dispatch/route.js:15`). We do NOT invent a
 * default definition — absent an explicit/labeled one, the stack path wins.
 */
export function resolveDispatchDefinition(
  snapshot: KradleControllerSnapshot | null,
  taskKind: TaskKind,
  definitionRef?: string | null,
): string | null {
  const definitions = definitionItems(snapshot);
  if (definitionRef !== undefined && definitionRef !== null && definitionRef !== '') {
    const chosen = definitions.find((d) => d.metadata.name === definitionRef);
    // Honor the explicit ref even when the snapshot has not surfaced it yet
    // (the dispatch route resolves it server-side / org-scoped).
    return chosen?.metadata.name ?? definitionRef;
  }
  const labelled = definitions.find((d) => labelsOf(d)[LABEL_DEFAULT_FOR] === taskKind);
  return labelled?.metadata.name ?? null;
}

// ---------------------------------------------------------------------------
// Inverse stack mapping (§4.5) for upsertStack → an `AgentStack` resource
// applied via the generic CRD gateway (SPEC §3.1/§3.2: the live builder POSTs an
// AgentStack to `/api/orgs/<org>/resources`, `stack-builder.jsx:77`). The server
// scopes the resource (namespace / org label / `spec.organizationRef`), so the
// client omits those server-forced fields.
// ---------------------------------------------------------------------------

/** The CRD-required default runtime identity when the draft left it blank. */
const DEFAULT_SERVICE_ACCOUNT_REF = 'default';

/**
 * Inverse stack mapping: a `KradleAgentStackInput` → the `AgentStack` resource
 * body applied via the generic CRD gateway. The CRD requires
 * `organizationRef, baseAgent, adapter, runtimeIdentity`
 * (`agent-resources.yaml:34-38`); the gateway POST injects `organizationRef` +
 * namespace + org label server-side, but a kubectl-applied body must carry them,
 * so we stamp `organizationRef` from the active org (`org`) here and emit a
 * `runtimeIdentity.serviceAccountRef` (the server does NOT inject identity).
 */
function stackInputToResourceBody(stack: KradleAgentStackInput, org: string): ResourceApplyBody {
  const sp = stack.spec;
  const name = stack.metadata.name;
  const labels: Record<string, string> = { ...(stack.metadata.labels ?? {}) };
  const serviceAccountRef =
    sp.runtimeIdentity?.serviceAccountRef ?? DEFAULT_SERVICE_ACCOUNT_REF;
  const spec: Record<string, unknown> = {
    // CRD-required: org slug stamped from the active org context.
    organizationRef: sp.organizationRef ?? org,
    baseAgent: sp.baseAgent,
    adapter: sp.adapter,
    model: sp.model,
    prompt: sp.prompt,
    approvalMode: sp.approvalMode,
    // CRD-required: runtime identity (→ AgentServiceAccount). Never server-injected.
    runtimeIdentity: { ...(sp.runtimeIdentity ?? {}), serviceAccountRef },
  };
  if (sp.provider !== undefined) spec.provider = sp.provider;
  if (sp.toolProfileRef !== undefined) spec.toolProfileRef = sp.toolProfileRef;
  if (sp.externalTools !== undefined) spec.externalTools = sp.externalTools;
  if (sp.skillRefs !== undefined) spec.skillRefs = sp.skillRefs;
  if (sp.subagentRefs !== undefined) spec.subagentRefs = sp.subagentRefs;
  if (sp.contextLabelRefs !== undefined) spec.contextLabelRefs = sp.contextLabelRefs;
  if (sp.workspacePolicyRef !== undefined) spec.workspacePolicyRef = sp.workspacePolicyRef;
  if (sp.runnerPool !== undefined) spec.runnerPool = sp.runnerPool;
  if (sp.permissionRefs !== undefined) spec.permissionRefs = sp.permissionRefs;
  if (sp.memoryRepositoryRefs !== undefined) spec.memoryRepositoryRefs = sp.memoryRepositoryRefs;
  return {
    apiVersion: stack.apiVersion ?? 'kradle.a5c.ai/v1alpha1',
    kind: 'AgentStack',
    metadata: { name, labels },
    spec,
  };
}

// ---------------------------------------------------------------------------
// AgentDefinition apply + identity accessors (the real "who / how-where").
// `AgentDefinition` is applied via the generic CRD gateway
// (POST /api/orgs/<org>/resources, kind=AgentDefinition); `personaRef`/`stackRef`
// are required by the CRD (`agent-resources.yaml:398-401`). The server scopes the
// resource (namespace / org label), but a kubectl-applied body must carry
// `organizationRef`, so we stamp it from the active org.
// ---------------------------------------------------------------------------

export interface ApplyDefinitionInput {
  name: string;
  spec: Omit<AgentDefinitionSpec, 'organizationRef'> & { organizationRef?: string };
  labels?: Record<string, string>;
}

function definitionInputToResourceBody(
  input: ApplyDefinitionInput,
  org: string,
): ResourceApplyBody {
  const { personaRef, stackRef, roleContext, scope, triggerRefs, meetingConfig, limits } =
    input.spec;
  const spec: Record<string, unknown> = {
    organizationRef: input.spec.organizationRef ?? org,
    personaRef,
    stackRef,
  };
  if (roleContext !== undefined) spec.roleContext = roleContext;
  if (scope !== undefined) spec.scope = scope;
  if (triggerRefs !== undefined) spec.triggerRefs = triggerRefs;
  if (meetingConfig !== undefined) spec.meetingConfig = meetingConfig;
  if (limits !== undefined) spec.limits = limits;
  return {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'AgentDefinition',
    metadata: { name: input.name, ...(input.labels ? { labels: input.labels } : {}) },
    spec,
  };
}

/**
 * Apply an `AgentDefinition` (create/update) via the generic CRD gateway. Returns
 * the applied resource name. Faithful to the CRD: `personaRef`/`stackRef` are
 * required by the caller's spec.
 */
export async function applyDefinition(
  client: KradleControllerClient,
  input: ApplyDefinitionInput,
): Promise<string> {
  const body = definitionInputToResourceBody(input, client.org);
  await client.applyResource(body);
  return input.name;
}

/** List `AgentDefinition` resources via the generic CRD gateway. */
export async function listDefinitions(
  client: KradleControllerClient,
): Promise<KradleResourceItem[]> {
  const result = await client.listResources('AgentDefinition');
  return result.items ?? [];
}

/** List `AgentPersona` resources via the generic CRD gateway. */
export async function listPersonas(
  client: KradleControllerClient,
): Promise<KradleResourceItem[]> {
  const result = await client.listResources('AgentPersona');
  return result.items ?? [];
}

// ---------------------------------------------------------------------------
// AgentProcessTemplate apply (the REAL per-taskKind process phase pipeline).
// Mirrors applyDefinition: stamps organizationRef from the active org, derives a
// deterministic resource name per task kind so the RunsOverlay editor edits the
// SAME persisted resource each time (so the mapper's metadata.name → processId
// round-trips), and applies through the generic CRD gateway.
// ---------------------------------------------------------------------------

export interface ApplyProcessTemplateInput {
  taskKind: string;
  phases: string[];
  displayName?: string;
  /** Optional explicit resource name; defaults to `process-<taskKind>`. */
  name?: string;
}

/** Deterministic, K8s-safe resource name for a task kind's process template. */
export function processTemplateResourceName(taskKind: string): string {
  return `process-${taskKind}`;
}

function processTemplateInputToResourceBody(
  input: ApplyProcessTemplateInput,
  org: string,
): ResourceApplyBody {
  const spec: AgentProcessTemplateSpec = {
    organizationRef: org,
    taskKind: input.taskKind,
    phases: input.phases,
  };
  if (input.displayName !== undefined && input.displayName !== '') {
    spec.displayName = input.displayName;
  }
  return {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'AgentProcessTemplate',
    metadata: { name: input.name ?? processTemplateResourceName(input.taskKind) },
    spec: spec as Record<string, unknown>,
  };
}

/**
 * Apply an `AgentProcessTemplate` (create/update) via the generic CRD gateway.
 * Returns the applied resource name. Faithful to the CRD: `organizationRef`,
 * `taskKind`, `phases` are all populated.
 */
export async function applyProcessTemplate(
  client: KradleControllerClient,
  input: ApplyProcessTemplateInput,
): Promise<string> {
  const body = processTemplateInputToResourceBody(input, client.org);
  await client.applyResource(body);
  return body.metadata.name;
}

// ---------------------------------------------------------------------------
// Decision routing (§3.3): AgentApproval (plane 1) vs gateway hook (plane 2).
// ---------------------------------------------------------------------------

function isPendingApprovalName(snapshot: KradleControllerSnapshot | null, name: string): boolean {
  return pendingApprovals(snapshot).some((a) => a.metadata.name === name);
}

function isKnownRun(snapshot: KradleControllerSnapshot | null, name: string): boolean {
  return runItems(snapshot).some((r) => r.metadata.name === name);
}

// ---------------------------------------------------------------------------
// Orders factory
// ---------------------------------------------------------------------------

export function makeKradleOrders(
  client: KradleControllerClient,
  options: KradleOrdersOptions,
): Orders {
  const { getSnapshot, scheduleRefresh, gatewayOrders } = options;
  const repo = options.repo || 'default';
  const warned = new Set<string>();

  function noop(name: string): void {
    if (warned.has(name)) return;
    warned.add(name);
    // eslint-disable-next-line no-console -- one-time documented-gap notice (real mode)
    console.warn(`kradleOrders: '${name}' has no kradle write path (documented no-op)`);
  }

  /** Run an async client call fire-and-forget; refresh on success, log on error. */
  function run(label: string, op: () => Promise<unknown>): void {
    op().then(
      () => {
        scheduleRefresh();
      },
      (error: unknown) => {
        // eslint-disable-next-line no-console -- verb failure is logged, not retried (AC9)
        console.warn(`kradleOrders: '${label}' failed`, error);
      },
    );
  }

  return {
    // --- runtime verbs: gateway plane (frames) -------------------------------
    abort(unitIds) {
      const snapshot = getSnapshot();
      for (const id of unitIds) {
        if (isKnownRun(snapshot, id)) {
          // A selected card/run → cancel the run (§1.5).
          run('abort/cancelRun', () => client.cancelRun(id));
        } else if (gatewayOrders) {
          // An active agent (unitId) → gateway /abort (§3).
          gatewayOrders.abort([id]);
        } else {
          noop('abort');
        }
      }
    },
    steer(unitIds, prompt) {
      if (gatewayOrders) {
        gatewayOrders.steer(unitIds, prompt);
      } else {
        noop('steer');
      }
    },
    decide(hookRequestId, decision) {
      const snapshot = getSnapshot();
      if (isPendingApprovalName(snapshot, hookRequestId)) {
        const approval: ApprovalDecision = decision === 'allow' ? 'approve' : 'deny';
        run('decide/decideApproval', () => client.decideApproval(hookRequestId, approval));
        return;
      }
      if (gatewayOrders) {
        gatewayOrders.decide(hookRequestId, decision);
        return;
      }
      noop('decide');
    },
    answerInquiry(hookRequestId, optionId) {
      const snapshot = getSnapshot();
      // §3.3: a gateway carries the optionId verbatim; route there when present.
      if (gatewayOrders && !isPendingApprovalName(snapshot, hookRequestId)) {
        gatewayOrders.answerInquiry(hookRequestId, optionId);
        return;
      }
      if (isPendingApprovalName(snapshot, hookRequestId)) {
        // kradle approvals are binary: map the option to approve/deny heuristically.
        const proceed =
          optionId === null ||
          /^(approve|proceed|allow|yes|continue|ship|go)$/i.test(optionId);
        const approval: ApprovalDecision = proceed ? 'approve' : 'deny';
        run('answerInquiry/decideApproval', () =>
          client.decideApproval(hookRequestId, approval),
        );
        return;
      }
      if (gatewayOrders) {
        gatewayOrders.answerInquiry(hookRequestId, optionId);
        return;
      }
      noop('answerInquiry');
    },

    // --- resource-lifecycle verbs: kradle plane ------------------------------
    createTask(input) {
      const snapshot = getSnapshot();
      // Dispatch BY DEFINITION when a matching `AgentDefinition` exists (the
      // persona-identity path): an explicitly chosen definition, else one labeled
      // `default-for=<taskKind>`. The definition pairs a persona ("who") to a
      // stack ("how/where"); the route resolves the stack from the definition.
      const definitionRef = resolveDispatchDefinition(snapshot, input.taskKind);
      if (definitionRef !== null) {
        const body: DispatchInput = {
          agentDefinition: definitionRef,
          repository: repo,
          ref: 'main',
          ...(input.title ? { task: input.title } : {}),
          taskKind: input.taskKind,
          actor: 'owner',
        };
        run('createTask/dispatch(definition)', () => client.dispatch(body));
        // Return a non-null marker so the composer (Foundry) treats the submit as
        // accepted and closes/clears. The real run id + card arrive on the next
        // snapshot refresh (the dispatch route emits an SSE frame + the poller
        // picks it up); returning null here made the form look broken on success.
        return `dispatched:${definitionRef}`;
      }
      // Else fall back to dispatch BY STACK (SPEC §3.4): the resolved stack name
      // is sent as `agentStack`/`stackRef`. The live route accepts either
      // (`dispatch/route.js:15`).
      const stackRef = resolveDispatchStack(snapshot, input.taskKind);
      if (stackRef === null) {
        noop('createTask');
        return null;
      }
      const body: DispatchInput = {
        agentStack: stackRef,
        stackRef,
        repository: repo,
        ref: 'main',
        ...(input.title ? { task: input.title } : {}),
        taskKind: input.taskKind,
        actor: 'owner',
      };
      run('createTask/dispatch', () => client.dispatch(body));
      // Non-null marker so the composer accepts/clears the submit; the real run id
      // + card reconcile on the next snapshot refresh (§6.3). Returning null here
      // made a successful dispatch look like a failure (the form stayed open).
      return `dispatched:${stackRef}`;
    },
    upsertStack(stack: KradleAgentStackInput) {
      // Apply the AgentStack via the generic CRD gateway (SPEC §3.1/§3.2). Apply
      // is an upsert, so the create/patch distinction collapses; when a stackRef
      // is supplied it names the resource being updated, else the stack's own
      // metadata.name is the new resource name.
      const body = stackInputToResourceBody(stack, client.org);
      if (stack.stackRef !== undefined && stack.stackRef !== '') {
        body.metadata.name = stack.stackRef;
        run('upsertStack/applyResource', () => client.applyResource(body));
        return stack.stackRef;
      }
      run('upsertStack/applyResource', () => client.applyResource(body));
      return stack.metadata.name;
    },
    upsertDefinition(input) {
      // SPEC-KRADLE-MODEL — apply the REAL `AgentDefinition` (persona↔stack
      // deployment binding) via the generic CRD gateway. `organizationRef` is
      // stamped from the active org by `applyDefinition`. The definition
      // reconciles onto the board on the next snapshot refresh.
      run('upsertDefinition/applyDefinition', () =>
        applyDefinition(client, {
          name: input.name,
          spec: {
            personaRef: input.personaRef,
            stackRef: input.stackRef,
            ...(input.roleContext !== undefined && input.roleContext !== ''
              ? { roleContext: input.roleContext }
              : {}),
          },
        }),
      );
      return input.name;
    },
    // --- roster verbs: REMOVED from the model (SPEC §2.4/§5.2) ----------------
    // kradle has no roster CRD; these survive only as documented no-ops until
    // the store slice is removed in the UI phase. They no longer write
    // definitions (the prior cut faked the roster onto AgentDefinition + labels).
    createRosterAgent(): string | null {
      noop('createRosterAgent');
      return null;
    },
    deleteRosterAgent() {
      noop('deleteRosterAgent');
    },

    // --- documented gaps (warn-once no-ops; same signatures, never throw) -----
    pauseUnits() {
      noop('pauseUnits');
    },
    resumeUnits() {
      noop('resumeUnits');
    },
    prioritize() {
      noop('prioritize');
    },
    toggleSim() {
      noop('toggleSim');
    },
    moveCard(_taskId: string, _column: ColumnId) {
      noop('moveCard');
    },
    setYolo() {
      // The card now READS yolo from the real `spec.approvalPolicy.autoApprove`
      // (mappers.ts), but persisting a toggle from Commander has no clean write
      // path: the client exposes only `applyResource` (full-resource upsert) and
      // `dispatch` — there is no per-run spec-patch route for an aggregated,
      // postgres-stored AgentDispatchRun, and `DispatchInput` carries neither
      // `approvalPolicy` nor `parentRunRef`. Left as a documented no-op until a
      // run-spec patch route exists; mirror for subtask parent assignment.
      noop('setYolo');
    },
    revertCard() {
      noop('revertCard');
    },
    release(): string | null {
      noop('release');
      return null;
    },
    rollbackCard() {
      noop('rollbackCard');
    },
    setSpeed(): boolean {
      noop('setSpeed');
      return false;
    },
    updateTask(_taskId: string, _patch: UpdateTaskPatch): boolean {
      noop('updateTask');
      return false;
    },
    updateProcessTemplate(kind: TaskKind, phases: string[]): number | null {
      // Persist the REAL `AgentProcessTemplate` (per-taskKind phase pipeline) via
      // the generic CRD gateway. The editor pre-validates a non-empty trimmed
      // phase list; we stamp organizationRef from the active org and target the
      // deterministic per-kind resource name so edits update the same persisted
      // template. The new revision (metadata.generation) lands on the next
      // snapshot refresh; we return a non-null sentinel so the editor closes.
      const trimmed = phases.map((p) => p.trim()).filter((p) => p.length > 0);
      if (trimmed.length === 0) return null;
      run('updateProcessTemplate/applyProcessTemplate', () =>
        applyProcessTemplate(client, { taskKind: kind, phases: trimmed }),
      );
      return 1;
    },
    writeFile(): boolean {
      noop('writeFile');
      return false;
    },
    assignTaskAgent(_taskId: string, _role: RosterRole, _agentId: string | null) {
      noop('assignTaskAgent');
    },
    assignTaskHuman() {
      noop('assignTaskHuman');
    },
    focusInquiryCard() {
      // Navigation is UI-local; no kradle call (matches realBoot.ts).
    },
  };
}
