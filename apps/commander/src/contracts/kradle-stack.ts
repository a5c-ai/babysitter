/**
 * Sim-facing kradle `AgentStack` subset (SPEC-KRADLE-MODEL §2.2).
 *
 * This is the EDITABLE subset the Foundry stack-builder writes
 * (`stack-builder.jsx`): base agent + adapter + model + the three prompts +
 * approval posture + the ref lists. The full composite mirror (with
 * `organizationRef`, `runtimeIdentity`, `permissionRefs`, `secretPolicy`,
 * `writeBackPolicy`, …) lives in `kradle-resources.ts` (`AgentStackSpec`).
 *
 * To keep the two from DRIFTING, every field name here is asserted (at compile
 * time, below) to be a key of the canonical `AgentStackSpec`. The value-type
 * widening — `approvalMode: string` (the sim accepts free-form, e.g. 'manual')
 * and required `model`/`prompt` — is the sim's deliberate, documented stance,
 * not drift.
 */

import type { AgentStackSpec } from './kradle-resources';

/** Personality prompts (prompt.system carries the written personality). */
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

/**
 * Compile-time no-drift guard: every editable field name MUST be a field of the
 * canonical composite spec. If a field is renamed in `AgentStackSpec` (or here)
 * without the other, this type resolves to `never` and breaks the build.
 */
type _StackSpecKeysSubsetOfComposite = keyof KradleStackSpec extends keyof AgentStackSpec
  ? true
  : never;
const _stackSpecKeysAreComposite: _StackSpecKeysSubsetOfComposite = true;
void _stackSpecKeysAreComposite;

export interface KradleStackMetadata {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
}

export interface KradleStackStatus {
  /**
   * Summary state for UI tables. The real CRD enum is
   * `Pending|Ready|Blocked|Error`; the sim seeds the lowercase `'ready'`, so we
   * keep this tolerant (`string`) rather than break byte-identical mock output.
   */
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
