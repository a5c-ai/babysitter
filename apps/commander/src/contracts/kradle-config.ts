/**
 * Mirrored kradle CONFIG kinds referenced by the composite `AgentStack`
 * (SPEC-KRADLE-MODEL §1.A). Faithful, field-by-field mirror of
 * `packages/kradle/charts/crds/agent-resources.yaml` (ground truth) — the
 * declarative, low-cardinality, etcd-backed building blocks a stack composes.
 *
 * All specs are preserve-unknown in the CRD; required fields per the YAML are
 * non-optional here. We do NOT import `@a5c-ai/kradle-sdk` — we mirror it (AC7).
 */

import type {
  KradleResource,
  KradlePreserveUnknown,
} from './kradle-resources';

// ---------------------------------------------------------------------------
// AgentToolProfile (`agent-resources.yaml:494-558`)
// Required: organizationRef, filesystemPolicy, approvalPolicyByTool
// ---------------------------------------------------------------------------

export interface AgentToolProfileSpec extends KradlePreserveUnknown {
  organizationRef: string;
  /** preserve-unknown; doc value: `read-only|repo-write|workspace-write|no-fs`. */
  filesystemPolicy: KradlePreserveUnknown;
  networkPolicy?: KradlePreserveUnknown;
  shellPolicy?: KradlePreserveUnknown;
  approvalPolicyByTool: KradlePreserveUnknown;
  /** Spec-doc extras (`agent-stack-management-spec.md:113-127`). */
  nativeTools?: string[];
  allowedCommands?: string[];
  deniedCommands?: string[];
  requiredSecretRefs?: string[];
  requiredConfigRefs?: string[];
  auditLevel?: string;
}

export type AgentToolProfile = KradleResource<'AgentToolProfile', AgentToolProfileSpec>;

// ---------------------------------------------------------------------------
// AgentMcpServer (`agent-resources.yaml:560-631`)
// Required: organizationRef, transport, scope
// ---------------------------------------------------------------------------

/** MCP transport (`stdio|sse|streamable-http`), preserve-unknown body. */
export interface AgentMcpServerTransport extends KradlePreserveUnknown {
  type?: 'stdio' | 'sse' | 'streamable-http';
  command?: string;
  args?: string[];
  url?: string;
  envFrom?: KradlePreserveUnknown;
  headersFrom?: KradlePreserveUnknown;
}

export type AgentMcpServerScope = 'global' | 'org' | 'repository' | 'stack' | 'dispatch';

export interface AgentMcpServerSpec extends KradlePreserveUnknown {
  organizationRef: string;
  transport: AgentMcpServerTransport;
  scope: AgentMcpServerScope;
  discovery?: KradlePreserveUnknown;
  health?: KradlePreserveUnknown;
  secretRefs?: string[];
  configRefs?: string[];
}

export type AgentMcpServer = KradleResource<'AgentMcpServer', AgentMcpServerSpec>;

// ---------------------------------------------------------------------------
// AgentSkill (`agent-resources.yaml:633-701`)
// Required: organizationRef, format, sourceRef
// ---------------------------------------------------------------------------

export type AgentSkillFormat = 'file' | 'directory' | 'package' | 'inline';

export interface AgentSkillSpec extends KradlePreserveUnknown {
  organizationRef: string;
  format: AgentSkillFormat;
  sourceRef: KradlePreserveUnknown;
  promptFragments?: string[];
  toolDeps?: string[];
  outputContract?: KradlePreserveUnknown;
}

export type AgentSkill = KradleResource<'AgentSkill', AgentSkillSpec>;

// ---------------------------------------------------------------------------
// AgentSubagent (`agent-resources.yaml:428-492`)
// Required: organizationRef, rolePrompt, taskKinds
// ---------------------------------------------------------------------------

export type AgentTaskKind =
  | 'research'
  | 'implementation'
  | 'validation'
  | 'review'
  | 'triage'
  | 'release-check';

export type AgentSubagentWorkspaceScope =
  | 'read-only'
  | 'branch-local'
  | 'isolated-worktree'
  | 'no-workspace';

export interface AgentSubagentSpec extends KradlePreserveUnknown {
  organizationRef: string;
  rolePrompt: string;
  /** Open string[] — the CRD does not enum-constrain; doc values in `AgentTaskKind`. */
  taskKinds: string[];
  toolSubset?: string[];
  workspaceScope?: AgentSubagentWorkspaceScope;
}

export type AgentSubagent = KradleResource<'AgentSubagent', AgentSubagentSpec>;

// ---------------------------------------------------------------------------
// AgentContextLabel (`agent-resources.yaml:803-861`)
// Required: organizationRef, promptFragment, allowedSources
// ---------------------------------------------------------------------------

export interface AgentContextLabelSpec extends KradlePreserveUnknown {
  organizationRef: string;
  /** A reviewed prompt fragment with provenance — NOT a bare "prompt tag". */
  promptFragment: string;
  allowedSources: string[];
  provenance?: KradlePreserveUnknown;
}

export type AgentContextLabel = KradleResource<'AgentContextLabel', AgentContextLabelSpec>;

// ---------------------------------------------------------------------------
// KradleWorkspacePolicy (`agent-resources.yaml:863-925`)
// NOTE real kind name is KradleWorkspacePolicy (NOT AgentWorkspacePolicy).
// Required: organizationRef, mode, retentionPolicy
// ---------------------------------------------------------------------------

export interface KradleWorkspacePolicySpec extends KradlePreserveUnknown {
  organizationRef: string;
  mode: string;
  retentionPolicy: KradlePreserveUnknown;
  trustTier?: string;
  cleanupPolicy?: KradlePreserveUnknown;
}

export type KradleWorkspacePolicy = KradleResource<
  'KradleWorkspacePolicy',
  KradleWorkspacePolicySpec
>;

// ---------------------------------------------------------------------------
// Identity chain: runtimeIdentity → AgentServiceAccount → AgentRoleBinding
// ---------------------------------------------------------------------------

/** `AgentServiceAccount` (`agent-resources.yaml:927-983`). */
export interface AgentServiceAccountSpec extends KradlePreserveUnknown {
  organizationRef: string;
  namespace: string;
  serviceAccountName: string;
}

export const AGENT_SERVICE_ACCOUNT_CONDITION_TYPES = [
  'ServiceAccountSynced',
  'TokenProjectionAllowed',
  'Ready',
] as const;
export type AgentServiceAccountConditionType =
  (typeof AGENT_SERVICE_ACCOUNT_CONDITION_TYPES)[number];

export type AgentServiceAccount = KradleResource<
  'AgentServiceAccount',
  AgentServiceAccountSpec
>;

/** `AgentRoleBinding` (`agent-resources.yaml:985-1046`). */
export type AgentRoleBindingScope =
  | 'namespace'
  | 'repository'
  | 'organization'
  | 'cluster';

export interface AgentRoleBindingSpec extends KradlePreserveUnknown {
  organizationRef: string;
  subject: KradlePreserveUnknown;
  roleRef: KradlePreserveUnknown;
  scope: AgentRoleBindingScope;
}

export type AgentRoleBinding = KradleResource<'AgentRoleBinding', AgentRoleBindingSpec>;

/** `AgentSecretGrant` (`agent-resources.yaml:1048-1127`). Never prompt-injectable. */
export interface AgentSecretGrantSpec extends KradlePreserveUnknown {
  organizationRef: string;
  subject: KradlePreserveUnknown;
  secretRef: KradlePreserveUnknown;
  purpose: string;
  allowedRepositories?: string[];
  /** preserve-unknown: `{ include, exclude }`. */
  allowedRefs?: KradlePreserveUnknown;
  allowedTriggerSources?: string[];
  mountPolicy?: string;
  requiredApproval?: string;
  rotationPolicy?: KradlePreserveUnknown;
}

export type AgentSecretGrant = KradleResource<'AgentSecretGrant', AgentSecretGrantSpec>;

/** `AgentConfigGrant` (`agent-resources.yaml:1129-1196`). */
export interface AgentConfigGrantSpec extends KradlePreserveUnknown {
  organizationRef: string;
  subject: KradlePreserveUnknown;
  configMapRef: KradlePreserveUnknown;
  purpose: string;
  allowedRepositories?: string[];
  mountPolicy?: string;
}

export type AgentConfigGrant = KradleResource<'AgentConfigGrant', AgentConfigGrantSpec>;

// ---------------------------------------------------------------------------
// AgentTriggerRule (`agent-resources.yaml:703-798`)
// Required: organizationRef, sources, taskKind AND anyOf[agentStack, agentDefinition]
// ---------------------------------------------------------------------------

export type AgentTriggerLifecycleState =
  | 'draft'
  | 'active'
  | 'paused'
  | 'disabled'
  | 'archived';

export type AgentTriggerSource =
  | 'ci'
  | 'webhook'
  | 'issue-comment'
  | 'pr-comment'
  | 'label'
  | 'push'
  | 'tag'
  | 'schedule'
  | 'manual'
  | 'repository-dispatch';

export interface AgentTriggerRuleSpec extends KradlePreserveUnknown {
  organizationRef: string;
  lifecycleState?: AgentTriggerLifecycleState;
  /** Open string[] — doc values in `AgentTriggerSource`. */
  sources: string[];
  /** preserve-unknown: workflow/job/step/branch/path/label/actor/mention/JSONPath. */
  match?: KradlePreserveUnknown;
  /** anyOf target: an `AgentStack` name. */
  agentStack?: string;
  /** anyOf target: an `AgentDefinition` name (persona path). */
  agentDefinition?: string;
  taskKind: string;
  promptTemplate?: string;
  contextLabels?: string[];
  contextBundleTemplate?: KradlePreserveUnknown;
  runnerPool?: string;
  approvalPolicy?: KradlePreserveUnknown;
  dedupePolicy?: KradlePreserveUnknown;
  concurrencyPolicy?: KradlePreserveUnknown;
  writeBackPolicy?: KradlePreserveUnknown;
}

export const AGENT_TRIGGER_RULE_CONDITION_TYPES = [
  'SourceConfigured',
  'MatcherValid',
  'TargetStackReady',
  'ContextTemplateValid',
  'DedupePolicyValid',
  'LifecycleActive',
] as const;
export type AgentTriggerRuleConditionType = (typeof AGENT_TRIGGER_RULE_CONDITION_TYPES)[number];

export type AgentTriggerRule = KradleResource<'AgentTriggerRule', AgentTriggerRuleSpec>;

// ---------------------------------------------------------------------------
// RunnerPool (`aggregated-resources.yaml:30-62`) — the runner anchor a stack/
// rule binds to. Status is NOT modelled by the CRD (no status subresource), so
// this is a spec-only resource.
// ---------------------------------------------------------------------------

export interface RunnerPoolSpec extends KradlePreserveUnknown {
  organizationRef: string;
  warmReplicas: number;
  maxReplicas: number;
}

export interface RunnerPool {
  apiVersion: 'kradle.a5c.ai/v1alpha1';
  kind: 'RunnerPool';
  metadata: { name: string; namespace?: string; labels?: Record<string, string> };
  spec: RunnerPoolSpec;
}
