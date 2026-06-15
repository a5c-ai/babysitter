/**
 * Mirrored kradle workspace / artifact / approval / link contracts
 * (SPEC-KRADLE-MODEL §1.B, §2.3). Faithful to the REAL CRD kind names in
 * `packages/kradle/charts/crds/aggregated-resources.yaml`:
 *   - `KradleWorkspace` (short `kws`) — the git worktree/runtime surface (NOT
 *     the doc-only `AgentWorkspace`), with sibling `KradleWorkspaceRuntime`.
 *   - `KradleArtifact` (short `kart`) — durable agent output (NOT `AgentArtifact`).
 *   - `Review` — PR review decision; there is NO `AgentReviewArtifact` CRD.
 *   - `AgentApproval`, `AgentContextBundle`, `AgentTriggerExecution`,
 *     `AgentCapabilityRequirement`, `WorkItemSessionLink`, `WorkItemWorkspaceLink`.
 *
 * These aggregated specs are preserve-unknown in the YAML; the field contracts
 * come from the relationship map / glossary / live BFF and the shapes Commander
 * already surfaces. UI-only metadata stays OUT.
 */

import type {
  KradleResource,
  KradleResourceStatus,
  KradlePreserveUnknown,
} from './kradle-resources';

// ---------------------------------------------------------------------------
// KradleWorkspace — the git worktree/runtime surface (status-only contract)
// ---------------------------------------------------------------------------

/** Documented `KradleWorkspace.status.phase` union (`workspace-lifecycle-spec.md`). */
export type AgentWorkspacePhase = 'created' | 'ready' | 'missing' | 'conflicted' | 'archived';

/** Alias under the real kind name. */
export type KradleWorkspacePhase = AgentWorkspacePhase;

export interface WorkspaceGitStatus {
  branch: string;
  headSha: string;
  ahead?: number;
  behind?: number;
  dirty: boolean;
  uncommittedCount?: number;
}

/**
 * The documented `KradleWorkspace.status` shape Commander reads. (Historically
 * named `AgentWorkspaceStatus`; the kind is `KradleWorkspace`.)
 */
export interface KradleWorkspaceStatus {
  phase: AgentWorkspacePhase;
  gitStatus: WorkspaceGitStatus;
}

/** @deprecated Name retained for callers; this is `KradleWorkspace.status`. */
export type AgentWorkspaceStatus = KradleWorkspaceStatus;

/** `KradleWorkspace.spec` — preserve-unknown; the run/work-item it backs. */
export interface KradleWorkspaceSpec extends KradlePreserveUnknown {
  repository?: string;
  dispatchRun?: string;
  workItemRef?: string;
}

export type KradleWorkspace = Omit<
  KradleResource<'KradleWorkspace', KradleWorkspaceSpec>,
  'status'
> & { status: KradleResourceStatus & Partial<KradleWorkspaceStatus> };

/**
 * `KradleWorkspaceRuntime` (`aggregated-resources.yaml:1155`) — terminal /
 * dev-server surface tied to a workspace. Schema-light.
 */
export interface KradleWorkspaceRuntimeSpec extends KradlePreserveUnknown {
  workspaceRef?: string;
}
export type KradleWorkspaceRuntime = KradleResource<
  'KradleWorkspaceRuntime',
  KradleWorkspaceRuntimeSpec
>;

// ---------------------------------------------------------------------------
// KradleArtifact — durable agent output (patch/diagnosis/review/report)
// ---------------------------------------------------------------------------

export type PatchApplyStrategy =
  | 'comment-only'
  | 'branch-update'
  | 'pr-update'
  | 'local-workspace-only';

export type TestEvidenceStatus = 'passed' | 'failed' | 'unknown';

export interface PatchTestEvidence {
  status: TestEvidenceStatus;
  summary?: string;
}

/** The `kind: 'patch'` payload of a `KradleArtifact` (`kradle-workspace.ts` legacy shape). */
export interface PatchArtifact {
  kind: 'patch';
  /** Commit the patch was generated against. */
  baseRef: string;
  targetBranch?: string;
  /** Paths touched by the patch. */
  fileList: string[];
  /** Digest of the unified diff content. */
  diffDigest: string;
  /** Object-storage ref to the full patch body. */
  patchObjectRef: string;
  testEvidence: PatchTestEvidence;
  applyStrategy: PatchApplyStrategy;
}

/** Documented `KradleArtifact` output kinds. */
export type KradleArtifactKind = 'patch' | 'diagnosis' | 'review' | 'report';

/**
 * `KradleArtifact.spec` — preserve-unknown; the `patch`-kind payload above is
 * the most structured. Other kinds carry free-form bodies.
 */
export interface KradleArtifactSpec extends KradlePreserveUnknown {
  kind?: KradleArtifactKind;
  dispatchRun?: string;
  dispatchAttempt?: string;
  /** Present when `kind === 'patch'`. */
  patch?: Omit<PatchArtifact, 'kind'>;
}

export type KradleArtifact = KradleResource<'KradleArtifact', KradleArtifactSpec>;

// ---------------------------------------------------------------------------
// Review — PR review decision (`aggregated-resources.yaml:303-341`)
// Required: organizationRef, pullRequest
// ---------------------------------------------------------------------------

export interface ReviewSpec extends KradlePreserveUnknown {
  organizationRef: string;
  pullRequest: string;
  decision?: string;
  body?: string;
}

export type Review = KradleResource<'Review', ReviewSpec>;

// ---------------------------------------------------------------------------
// AgentApproval — human/policy gate (`aggregated-resources.yaml:896-931`)
// ---------------------------------------------------------------------------

export type AgentApprovalPhase = 'pending' | 'approved' | 'denied' | 'completed';

export interface AgentApprovalRequestedBy {
  kind: string;
  name: string;
}

export interface AgentApprovalAction {
  type: string;
  target: string;
  summary: string;
}

export interface AgentApprovalSpec extends KradlePreserveUnknown {
  /** The dispatch run requesting the action. */
  dispatchRun: string;
  /** Who raised the approval. */
  requestedBy: AgentApprovalRequestedBy;
  /** The gated action. */
  action: AgentApprovalAction;
  policyReasons?: string[];
}

export interface AgentApprovalStatusFields {
  phase: AgentApprovalPhase;
  decision?: 'approved' | 'denied';
  feedback?: string;
}

export type AgentApproval = Omit<KradleResource<'AgentApproval', AgentApprovalSpec>, 'status'> & {
  status: Omit<KradleResourceStatus, 'phase'> & AgentApprovalStatusFields;
};

// ---------------------------------------------------------------------------
// AgentContextBundle — digest-addressed redacted context snapshot
// (`aggregated-resources.yaml:822-857`)
// ---------------------------------------------------------------------------

export interface AgentContextBundleSpec extends KradlePreserveUnknown {
  dispatchRun?: string;
  digest?: string;
  sources?: KradlePreserveUnknown[];
}

export type AgentContextBundle = KradleResource<'AgentContextBundle', AgentContextBundleSpec>;

// ---------------------------------------------------------------------------
// AgentTriggerExecution — durable record of a rule evaluation + decision
// (`aggregated-resources.yaml:933-968`)
// ---------------------------------------------------------------------------

export interface AgentTriggerExecutionSpec extends KradlePreserveUnknown {
  triggerRule?: string;
  sourceEvent?: KradlePreserveUnknown;
  /** Doc decision: `created | coalesced | rejected`. */
  decision?: string;
}

export type AgentTriggerExecution = KradleResource<
  'AgentTriggerExecution',
  AgentTriggerExecutionSpec
>;

// ---------------------------------------------------------------------------
// AgentCapabilityRequirement — computed dependency (stack/tool/mcp/skill/subagent
// → roles/secrets/configs) (`aggregated-resources.yaml:970-1005`)
// ---------------------------------------------------------------------------

export interface AgentCapabilityRequirementSpec extends KradlePreserveUnknown {
  ownerRef?: string;
  requiredRoles?: string[];
  requiredSecretRefs?: string[];
  requiredConfigRefs?: string[];
}

export interface AgentCapabilityRequirementStatusFields {
  missingGrants?: string[];
}

export type AgentCapabilityRequirement = Omit<
  KradleResource<'AgentCapabilityRequirement', AgentCapabilityRequirementSpec>,
  'status'
> & { status: KradleResourceStatus & AgentCapabilityRequirementStatusFields };

// ---------------------------------------------------------------------------
// Work-item links (`aggregated-resources.yaml:1007-1079`)
// ---------------------------------------------------------------------------

export interface WorkItemSessionLinkSpec extends KradlePreserveUnknown {
  workItemRef?: string;
  agentSession?: string;
  runRefs?: string[];
  linkSource?: string;
  branchName?: string;
  createdBy?: string;
}

export type WorkItemSessionLink = KradleResource<'WorkItemSessionLink', WorkItemSessionLinkSpec>;

export interface WorkItemWorkspaceLinkSpec extends KradlePreserveUnknown {
  workItemRef?: string;
  workspace?: string;
}

export type WorkItemWorkspaceLink = KradleResource<
  'WorkItemWorkspaceLink',
  WorkItemWorkspaceLinkSpec
>;

// ---------------------------------------------------------------------------
// Write-back policy (also surfaced as `AgentStack.spec.writeBackPolicy`)
// ---------------------------------------------------------------------------

export interface WriteBackPolicy {
  requireApproval: boolean;
  allowedTargets: string[];
}
