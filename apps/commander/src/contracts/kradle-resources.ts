/**
 * Mirrored kradle resource contracts (SPEC-KRADLE-MODEL §1, §2).
 *
 * Faithful, field-by-field mirror of the REAL kradle CRD schemas (the MAIN
 * checkout, ground truth — NOT the prose docs):
 *   - `packages/kradle/charts/crds/agent-resources.yaml`
 *   - `packages/kradle/charts/crds/aggregated-resources.yaml`
 *
 * Shared shell: every kind is Namespaced, `apiVersion: kradle.a5c.ai/v1alpha1`,
 * with `metadata{name,namespace,labels}` + `spec` + `status{phase ∈
 * [Pending,Ready,Blocked,Error], conditions[], observedGeneration}`
 * (`agent-resources.yaml:164-176`). Every product `spec` carries
 * `organizationRef` (required by the BFF POST). The aggregated execution kinds
 * (`AgentDispatchRun`/`AgentDispatchAttempt`/`AgentSession`) are schema-light in
 * the YAML (bare preserve-unknown `spec`/`status`); their field contracts come
 * from `agent-stack-management-spec.md` / `crd-schema-spec.md` and the live BFF.
 *
 * Discipline (AC7): we MIRROR the kradle SDK types — we do NOT import
 * `@a5c-ai/kradle-sdk`. TS strict, no `any` (use `unknown` + narrow). UI-only
 * metadata (world positions, progress rings, icons) stays OUT of these mirrored
 * types and lives in the game layer keyed by entity id.
 */

// ---------------------------------------------------------------------------
// Shared schema conventions
// ---------------------------------------------------------------------------

export const KRADLE_API_VERSION = 'kradle.a5c.ai/v1alpha1' as const;
export type KradleApiVersion = typeof KRADLE_API_VERSION;

/** CRD group (`agent-resources.yaml:6`). */
export const KRADLE_GROUP = 'kradle.a5c.ai' as const;

/**
 * The real CRD `status.phase` enum, shared by every namespaced kind
 * (`agent-resources.yaml:169` and repeated for every config kind). Replaces the
 * invented `Ready | Pending | Failed`.
 */
export type KradleResourcePhase = 'Pending' | 'Ready' | 'Blocked' | 'Error';

/**
 * @deprecated Use {@link KradleResourcePhase}. Retained as an alias so existing
 * sim/view annotations keep resolving while UI removal lands in a later phase;
 * it now denotes the real 4-value CRD enum (no `Failed`).
 */
export type KradlePhase = KradleResourcePhase;

/**
 * Stable label keys kradle stamps on resources for ownership / linkage
 * (`crd-schema-spec.md:251-262`, `resource-relationship-map.md:112-122`).
 */
export const KRADLE_LABELS = {
  org: 'kradle.a5c.ai/org',
  repository: 'kradle.a5c.ai/repository',
  agentStack: 'kradle.a5c.ai/agent-stack',
  triggerRule: 'kradle.a5c.ai/trigger-rule',
  dispatchRun: 'kradle.a5c.ai/dispatch-run',
  sourceKind: 'kradle.a5c.ai/source-kind',
  sourceName: 'kradle.a5c.ai/source-name',
  runnerPool: 'kradle.a5c.ai/runner-pool',
  serviceAccount: 'kradle.a5c.ai/service-account',
} as const;
export type KradleLabelKey = (typeof KRADLE_LABELS)[keyof typeof KRADLE_LABELS];

/** Where the resource is persisted (UI hint; not part of the CRD schema). */
export type KradleStorage = 'etcd' | 'postgres' | 'postgres/object storage';

/** Typed readiness/blocked/drift detail (Kubernetes-style condition). */
export interface KradleCondition {
  /** Stable enum condition type (e.g. 'Ready', 'CapabilitiesResolved'). */
  type: string;
  /** Kubernetes-style tri-state string. */
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  /** For humans; must not be parsed by controllers. */
  message?: string;
  observedGeneration?: number;
  lastTransitionTime?: string;
}

export interface KradleMetadata {
  /** Stable resource name. */
  name: string;
  /** Defaulted to the org namespace by the BFF when missing. */
  namespace?: string;
  /** Searchable ownership/repository/stack/trigger/source labels. */
  labels?: Record<string, string>;
  /** Set by the API server; read-only. */
  creationTimestamp?: string;
  /** Monotonic spec generation; compared against `status.observedGeneration`. */
  generation?: number;
}

export interface KradleResourceStatus {
  storage?: KradleStorage;
  /** Summary state for UI tables — the real 4-value CRD enum. */
  phase: KradleResourcePhase;
  /** Typed readiness/blocked/drift details. */
  conditions: KradleCondition[];
  /** Generation reconciled by the controller. */
  observedGeneration?: number;
}

/** Base shape every namespaced kradle resource follows. */
export interface KradleResource<TKind extends string, TSpec> {
  apiVersion: KradleApiVersion;
  kind: TKind;
  metadata: KradleMetadata;
  /** Desired state or immutable execution request. */
  spec: TSpec;
  status: KradleResourceStatus;
}

/**
 * Preserve-unknown object: a CRD field declared
 * `x-kubernetes-preserve-unknown-fields: true`, whose inner shape kradle does
 * not constrain. We model the documented keys we read and keep the bag open.
 */
export type KradlePreserveUnknown = Record<string, unknown>;

// ===========================================================================
// 1.A — CONFIG kind: AgentStack (the composite root)
// ===========================================================================

/** `AgentStack.spec.prompt` — system/developer framing (`crd-schema-spec.md:106`). */
export interface AgentStackPrompt extends KradlePreserveUnknown {
  system?: string;
  developer?: string;
}

/** `AgentStack.spec.agentsDocRef` → `AGENTS.md` (`crd-schema-spec.md:108`). */
export interface AgentStackAgentsDocRef extends KradlePreserveUnknown {
  source?: string;
  path?: string;
}

/** `AgentStack.spec.runtimeIdentity` → `AgentServiceAccount` (required). */
export interface AgentStackRuntimeIdentity extends KradlePreserveUnknown {
  serviceAccountRef: string;
}

/** `AgentStack.spec.internalTools` (`agent-resources.yaml:63`). */
export interface AgentStackInternalTools {
  /** Defaults to true in the CRD. */
  enabled?: boolean;
  filter?: string[];
}

/** `AgentStack.spec.externalTools` (`agent-resources.yaml:74`). */
export interface AgentStackExternalTools extends KradlePreserveUnknown {
  mcpServerRefs?: string[];
  cliToolRefs?: string[];
  openApiRefs?: string[];
}

/** `AgentStack.spec.permissionRefs` (`crd-schema-spec.md:121`). */
export interface AgentStackPermissionRefs extends KradlePreserveUnknown {
  /** → `AgentRoleBinding` names. */
  roleBindings?: string[];
  /** → `AgentSecretGrant` names. */
  secretGrants?: string[];
  /** → `AgentConfigGrant` names. */
  configGrants?: string[];
}

/** `AgentStack.spec.secretPolicy` (preserve-unknown). */
export interface AgentStackSecretPolicy extends KradlePreserveUnknown {
  allowOnForks?: boolean;
  allowedSecretRefs?: string[];
}

/** `AgentStack.spec.writeBackPolicy` (preserve-unknown). */
export interface AgentStackWriteBackPolicy extends KradlePreserveUnknown {
  requireApproval?: boolean;
  allowedTargets?: string[];
}

/** `AgentStack.spec.jitsiConfig` (meeting-agent extension, `agent-resources.yaml:144`). */
export interface AgentStackJitsiConfig extends KradlePreserveUnknown {
  participantName?: string;
  role?: 'observer' | 'participant' | 'moderator';
  autoJoin?: boolean;
  autoLeave?: boolean;
  capabilities?: KradlePreserveUnknown;
  tools?: string[];
}

/**
 * `AgentStack.spec` — the reusable agent definition and composite root that
 * references every other config kind (`agent-resources.yaml:31-163`; body
 * `crd-schema-spec.md:99-134`). The whole spec is preserve-unknown; required:
 * `organizationRef, baseAgent, adapter, runtimeIdentity`.
 */
export interface AgentStackSpec extends KradlePreserveUnknown {
  /** Required: org slug (BFF-enforced on every product spec). */
  organizationRef: string;
  /**
   * Required: base agent family — `claude-code | codex | gemini | opencode |
   * babysitter | adapters-remote | external` (`agent-stack-management-spec.md:70`).
   */
  baseAgent: string;
  /** Required: adapter ID / gateway route (e.g. `adapters.claude-code`). */
  adapter: string;
  provider?: string;
  model?: string;
  prompt?: AgentStackPrompt;
  agentsDocRef?: AgentStackAgentsDocRef;
  /** `prompt | deny | yolo | policy-derived` (`stack-builder.jsx:6`). */
  approvalMode?: 'prompt' | 'deny' | 'yolo' | 'policy-derived';
  /** Required: → `AgentServiceAccount`. */
  runtimeIdentity: AgentStackRuntimeIdentity;
  /** → `AgentToolProfile`. */
  toolProfileRef?: string;
  internalTools?: AgentStackInternalTools;
  externalTools?: AgentStackExternalTools;
  /** → `AgentMcpServer` (legacy top-level, alongside `externalTools.mcpServerRefs`). */
  mcpServerRefs?: string[];
  /** → `AgentSkill`. */
  skillRefs?: string[];
  /** → `AgentSubagent`. */
  subagentRefs?: string[];
  /** → `AgentContextLabel`. */
  contextLabelRefs?: string[];
  /** → `KradleWorkspacePolicy` (note real kind name). */
  workspacePolicyRef?: string;
  /** → `RunnerPool`. */
  runnerPool?: string;
  permissionRefs?: AgentStackPermissionRefs;
  secretPolicy?: AgentStackSecretPolicy;
  writeBackPolicy?: AgentStackWriteBackPolicy;
  /** Flat prompt fields the live builder writes (`stack-builder.jsx:34-36`). */
  systemPrompt?: string;
  developerPrompt?: string;
  taskPrompt?: string;
  /** Company-brain bindings (`agent-resources.yaml:90`). */
  memoryRepositoryRefs?: string[];
  memorySnapshotRef?: string;
  /** Per-layer Atlas bindings (`agent-resources.yaml:131`). */
  atlasLayerBindings?: KradlePreserveUnknown[];
  /** Meeting-agent extension (`agent-resources.yaml:136`). */
  jitsiCapability?: boolean;
  jitsiMeetingProviderRef?: string;
  jitsiConfig?: AgentStackJitsiConfig;
}

/**
 * The required readiness condition types an `AgentStack` reports
 * (`crd-schema-spec.md:134`; semantics `agent-stack-management-spec.md:325-338`).
 */
export const AGENT_STACK_CONDITION_TYPES = [
  'CapabilitiesResolved',
  'RuntimeIdentityReady',
  'RolesAdmitted',
  'SecretsAdmitted',
  'ConfigAdmitted',
  'ToolsAdmitted',
  'McpHealthy',
  'SkillsValidated',
  'SubagentsValid',
  'ContextLabelsValid',
  'PolicyAdmitted',
  'Ready',
] as const;
export type AgentStackConditionType = (typeof AGENT_STACK_CONDITION_TYPES)[number];

export type AgentStack = KradleResource<'AgentStack', AgentStackSpec>;

// ===========================================================================
// 1.B — AGGREGATED kind: AgentDispatchRun (the CI-like logical run)
// ===========================================================================

/** `AgentDispatchRun.spec.sourceEvent` — what triggered the run. */
export interface AgentDispatchSourceEvent {
  kind: string;
  name: string;
}

/**
 * `AgentDispatchRun.spec.sourceRefs` — breadcrumbs linking a dispatch back to
 * its work-item / source anchors (`crd-schema-spec.md:208-232`).
 */
export interface AgentDispatchSourceRefs {
  pullRequest?: string;
  pipeline?: string;
  job?: string;
  triggerRule?: string;
  issue?: string;
  check?: string;
  workItem?: string;
  [key: string]: string | undefined;
}

export interface AgentDispatchApprovalPolicy {
  requireWriteBackApproval?: boolean;
}

/**
 * `AgentDispatchRun.spec` — the logical run request
 * (`agent-stack-management-spec.md:261-284`). Required: `repository, agentStack,
 * taskKind` (plus source linkage). The YAML `spec` is preserve-unknown.
 */
export interface AgentDispatchRunSpec extends KradlePreserveUnknown {
  /** Required: target repository. */
  repository: string;
  ref?: string;
  branch?: string;
  sha?: string;
  sourceEvent?: AgentDispatchSourceEvent;
  sourceRefs?: AgentDispatchSourceRefs;
  /** Required: name of the AgentStack executing this dispatch. */
  agentStack: string;
  /** Required: task kind (e.g. 'ci-repair', 'review'). */
  taskKind: string;
  contextBundleRef?: string;
  workspaceRef?: string;
  runnerPool?: string;
  approvalPolicy?: AgentDispatchApprovalPolicy;
}

/**
 * The canonical lowercase run lifecycle union
 * (`agent-stack-management-spec.md:277`).
 */
export type AgentRunLifecyclePhase =
  | 'pending'
  | 'queued'
  | 'running'
  | 'waiting-for-approval'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

/**
 * `AgentDispatchRun.status.phase`. The lowercase lifecycle union PLUS the
 * capitalized terminals the live BFF emits (`runs/[name]/cancel/route.js:23`,
 * `run-actions.jsx:129`) PLUS the shared {@link KradleResourcePhase} values the
 * generic CRD list surfaces for the same kind. Distinct from a pure
 * `KradleResourcePhase`; the mapper (`backend/kradle/mappers.ts`) accepts BOTH
 * casings and normalizes to a board column.
 */
export type AgentRunPhase =
  | AgentRunLifecyclePhase
  // Capitalized terminals emitted by the live BFF.
  | 'Queued'
  | 'Running'
  | 'AwaitingApproval'
  | 'Succeeded'
  | 'Completed'
  | 'Cancelled'
  // Shared resource-phase values the generic CRD list surfaces for the kind.
  | KradleResourcePhase;

/** Cost projection carried on run/attempt/session status. */
export interface AgentRunCost extends KradlePreserveUnknown {
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  usd?: number;
}

/**
 * `AgentDispatchRun.status` — projected mux/attempt/artifact/approval refs
 * (`agent-stack-management-spec.md:261-284`). Extends the shared status with a
 * run-specific lifecycle phase.
 */
export interface AgentDispatchRunStatus extends Omit<KradleResourceStatus, 'phase'> {
  /** The run lifecycle phase (NOT the resource phase). */
  phase: AgentRunPhase;
  agentMuxRunId?: string;
  agentMuxSessionId?: string;
  /** Names of `AgentDispatchAttempt` records under this run. */
  attemptRefs?: string[];
  /** Names of child subagent `AgentDispatchRun` records. */
  childSubagentRuns?: string[];
  /** Names of `KradleArtifact` records produced. */
  artifacts?: string[];
  /** Names of `AgentApproval` gates raised. */
  approvals?: string[];
  cost?: AgentRunCost;
  eventCursor?: string;
  /** Digest of the resolved permission snapshot. */
  permissionSnapshotDigest?: string;
  /** Terminal reason string. */
  reason?: string;
  queueEnteredAt?: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * The readiness condition types an `AgentDispatchRun` reports
 * (`agent-stack-management-spec.md:351-360`).
 */
export const AGENT_DISPATCH_RUN_CONDITION_TYPES = [
  'ContextAssembled',
  'WorkspaceResolved',
  'RunnerAssigned',
  'AgentMuxSessionBound',
  'ApprovalSatisfied',
  'ArtifactsIndexed',
] as const;
export type AgentDispatchRunConditionType = (typeof AGENT_DISPATCH_RUN_CONDITION_TYPES)[number];

/**
 * `AgentDispatchRun` carries a run-specific `status` (lifecycle phase), so it
 * cannot reuse the shared {@link KradleResourceStatus}. Otherwise the standard
 * envelope.
 */
export type AgentDispatchRun = Omit<
  KradleResource<'AgentDispatchRun', AgentDispatchRunSpec>,
  'status'
> & { status: AgentDispatchRunStatus };

// ===========================================================================
// 1.B — AGGREGATED kind: AgentDispatchAttempt (the retry/resume/fork unit)
// ===========================================================================

/**
 * The concrete execution attempt under one run — the retry/resume/fork/
 * continuation unit (`glossary.md:14`). This entity is the centerpiece of the
 * model cut: it did not exist in Commander before.
 */
export type AgentAttemptReason =
  | 'initial'
  | 'retry'
  | 'resume'
  | 'repair'
  | 'rerun-after-fix'
  | 'continuation';

/** `AgentDispatchAttempt.spec.agentStackSnapshot` — pinned stack at launch. */
export interface AgentStackSnapshotRef {
  name: string;
  generation?: number;
}

/**
 * `AgentDispatchAttempt.spec` — the immutable launch request for one attempt
 * (`crd-schema-spec.md:234-248`; `agent-stack-management-spec.md:286-303`).
 */
export interface AgentDispatchAttemptSpec extends KradlePreserveUnknown {
  /** Required: the parent `AgentDispatchRun` name. */
  agentDispatchRun: string;
  /** Why this attempt was created. */
  attemptReason?: AgentAttemptReason;
  /** Pinned stack name + generation at launch. */
  agentStackSnapshot?: AgentStackSnapshotRef;
  contextBundleDigest?: string;
  permissionSnapshotDigest?: string;
  workspaceRef?: string;
  runnerPool?: string;
}

/**
 * `AgentDispatchAttempt.status`. `runtimeIdentity`/`runnerIdentity` are
 * immutable after launch (`crd-schema-spec.md:248`).
 */
export interface AgentDispatchAttemptStatus extends Omit<KradleResourceStatus, 'phase'> {
  phase: AgentRunPhase;
  agentMuxRunId?: string;
  agentMuxSessionId?: string;
  queueEnteredAt?: string;
  startedAt?: string;
  completedAt?: string;
  exitReason?: string;
  /** Names of `KradleArtifact` records this attempt produced. */
  producedArtifacts?: string[];
  /** Opaque subagent lifecycle events (preserve-unknown). */
  subagentEvents?: KradlePreserveUnknown[];
  /** Immutable after launch. */
  runtimeIdentity?: KradlePreserveUnknown;
  runnerIdentity?: KradlePreserveUnknown;
  cost?: AgentRunCost;
}

export type AgentDispatchAttempt = Omit<
  KradleResource<'AgentDispatchAttempt', AgentDispatchAttemptSpec>,
  'status'
> & { status: AgentDispatchAttemptStatus };

// ===========================================================================
// 1.B — AGGREGATED kind: AgentSession (Adapter chat linked to an attempt)
// ===========================================================================

/** `AgentSession.status.phase` (`glossary.md:15`). */
export type AgentSessionPhase = 'Active' | 'Completed' | 'Aborted';

/**
 * `AgentSession.spec` — the projection of an Agent Adapter chat/session linked
 * to a dispatch attempt. `agentMuxSessionId` + `dispatchRun` required
 * (`crd-schema-spec.md:43`); `dispatchAttempt` is the preferred grouping key.
 */
export interface AgentSessionSpec extends KradlePreserveUnknown {
  agentMuxSessionId?: string;
  /** Required: the owning `AgentDispatchRun` name. */
  dispatchRun: string;
  /** The owning `AgentDispatchAttempt` name (preferred grouping key). */
  dispatchAttempt?: string;
}

export interface AgentSessionStatus extends Omit<KradleResourceStatus, 'phase'> {
  phase: AgentSessionPhase;
  turnCount?: number;
  messageCount?: number;
  cost?: AgentRunCost;
  startedAt?: string;
  completedAt?: string;
}

export type AgentSession = Omit<KradleResource<'AgentSession', AgentSessionSpec>, 'status'> & {
  status: AgentSessionStatus;
};

/**
 * `AgentSessionTranscript` — the transcript ring linked to a session
 * (`aggregated-resources.yaml:1081`; UI Transcript tab). Schema-light.
 */
export interface AgentSessionTranscriptSpec extends KradlePreserveUnknown {
  agentSession?: string;
  dispatchRun?: string;
}
export type AgentSessionTranscript = KradleResource<
  'AgentSessionTranscript',
  AgentSessionTranscriptSpec
>;

/**
 * `AgentSessionAttachment` — attachments linked to a session
 * (`aggregated-resources.yaml:1118`). Schema-light.
 */
export interface AgentSessionAttachmentSpec extends KradlePreserveUnknown {
  agentSession?: string;
}
export type AgentSessionAttachment = KradleResource<
  'AgentSessionAttachment',
  AgentSessionAttachmentSpec
>;

// ===========================================================================
// CommanderTask — the card-backing alias (SPEC §2.3)
// ===========================================================================

/**
 * A Commander task is exactly an `AgentDispatchRun`-shaped kradle resource. The
 * card now ALSO carries attempt + session refs (via the run's
 * `status.attemptRefs` and the Run→Attempt→Session mapping in
 * `backend/kradle/mappers.ts`). UI progress (0..1) and icon specs are layered
 * on by the game store — they are NOT part of this mirrored contract.
 */
export type CommanderTask = AgentDispatchRun;
