/**
 * Mirrored kradle AgentStack contract for the v4 Stacks foundry (SPEC-V4 §V4-5).
 *
 * Fidelity source: `packages/kradle/core/docs/agents/crd-schema-spec.md`
 * (`AgentStack.spec`): baseAgent, adapter, provider?, model, prompt
 * {system, developer}, approvalMode, toolProfileRef?, skillRefs?,
 * subagentRefs?, runnerPool? — plus the shared metadata/status.phase shell.
 *
 * This is the SIM-FACING stack shape (the foundry edits these): the full CRD
 * mirror with runtimeIdentity/permissionRefs/secretPolicy lives in
 * `kradle-resources.ts` (`AgentStackSpec`); the v4 sim mirrors only the
 * fields the Commander surfaces (personality prompts front and center).
 */

/** Personality prompts (§V4-5: prompt.system carries the written personality). */
export interface KradleStackPrompt {
  system: string;
  developer?: string;
}

export interface KradleStackSpec {
  /** Base agent family (e.g. 'claude-code'). */
  baseAgent: string;
  /** Adapter binding (e.g. 'claude-code' / 'adapters.claude-code'). */
  adapter: string;
  provider?: string;
  model: string;
  prompt: KradleStackPrompt;
  /** Approval posture; kradle uses yolo|prompt|deny, the sim accepts free-form. */
  approvalMode: string;
  toolProfileRef?: string;
  skillRefs?: string[];
  subagentRefs?: string[];
  runnerPool?: string;
}

export interface KradleStackMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
}

export interface KradleStackStatus {
  /** Summary state for UI tables (sim seeds use 'ready'). */
  phase: string;
}

/** The AgentStack resource shape the sim stores and the foundry edits. */
export interface KradleAgentStack {
  apiVersion?: string;
  kind?: 'AgentStack';
  metadata: KradleStackMetadata;
  spec: KradleStackSpec;
  status: KradleStackStatus;
}

/** Input accepted by `upsertStack` — a stack, optionally carrying its sim id. */
export interface KradleAgentStackInput extends KradleAgentStack {
  /** When present and known, updates that stack; otherwise a stk-cNN id is minted. */
  stackRef?: string;
}
