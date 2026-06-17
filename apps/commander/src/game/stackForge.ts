/**
 * Agent-stack foundry pure logic (SPEC-V4 §V4-5 — "create agents from
 * agents"): stack-editor draft shapes, Forge-From clone defaults (the
 * suggested "<source> Mk II" name, full spec copy, NO stackRef so a fresh
 * stk-cNN id is minted), edit-in-place drafts for custom stacks, the
 * `upsertStack` input builder, and the roster personality excerpt (first
 * sentence of prompt.system).
 */

import type { SimStackView } from '../backend/mock/simulation';
import type { KradleAgentStackInput } from '../contracts/kradle-stack';
import { ADAPTERS, MODELS_BY_ADAPTER, type AdapterName } from '../backend/mock/scenario';

/** Approval postures offered by the stack editor (kradle: yolo|prompt|deny). */
export const APPROVAL_MODES = ['prompt', 'yolo', 'deny'] as const;

/** Form-state mirror of the editable stack fields. */
export interface StackDraft {
  /** Non-null = editing that existing stack in place; null = forging anew. */
  stackRef: string | null;
  name: string;
  baseAgent: string;
  adapter: string;
  provider: string;
  model: string;
  approvalMode: string;
  system: string;
  developer: string;
  /** `runtimeIdentity.serviceAccountRef` (→ `AgentServiceAccount`). */
  serviceAccountRef: string;
  /** `toolProfileRef` (→ `AgentToolProfile`). */
  toolProfileRef: string;
  /** CSV → `externalTools.mcpServerRefs`. */
  mcpServerRefs: string;
  /** CSV → `externalTools.cliToolRefs`. */
  cliToolRefs: string;
  /** CSV → `skillRefs`. */
  skillRefs: string;
  /** CSV → `subagentRefs`. */
  subagentRefs: string;
  /** CSV → `contextLabelRefs`. */
  contextLabelRefs: string;
  /** `workspacePolicyRef` (→ `KradleWorkspacePolicy`). */
  workspacePolicyRef: string;
  /** `runnerPool` (→ `RunnerPool`). */
  runnerPool: string;
  /** CSV → `permissionRefs.roleBindings`. */
  roleBindings: string;
  /** CSV → `permissionRefs.secretGrants`. */
  secretGrants: string;
  /** CSV → `permissionRefs.configGrants`. */
  configGrants: string;
  /** CSV → `memoryRepositoryRefs`. */
  memoryRepositoryRefs: string;
}

/** CSV ↔ string[] helpers (mirror `stack-builder.jsx:15-21`). */
export function splitCsv(value: string): string[] {
  return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
}
function joinCsv(arr: readonly string[] | undefined): string {
  return (arr ?? []).join(', ');
}

/** A blank new-stack draft (claude-code defaults). */
export function blankStackDraft(): StackDraft {
  return {
    stackRef: null,
    name: '',
    baseAgent: 'claude-code',
    adapter: 'claude-code',
    provider: '',
    model: MODELS_BY_ADAPTER['claude-code'][0]!,
    approvalMode: 'prompt',
    system: '',
    developer: '',
    serviceAccountRef: '',
    toolProfileRef: '',
    mcpServerRefs: '',
    cliToolRefs: '',
    skillRefs: '',
    subagentRefs: '',
    contextLabelRefs: '',
    workspacePolicyRef: '',
    runnerPool: '',
    roleBindings: '',
    secretGrants: '',
    configGrants: '',
    memoryRepositoryRefs: '',
  };
}

/** Shared draft body copied from an existing stack's spec. */
function draftBody(view: SimStackView): Omit<StackDraft, 'stackRef' | 'name'> {
  const spec = view.stack.spec;
  return {
    baseAgent: spec.baseAgent,
    adapter: spec.adapter,
    provider: spec.provider ?? '',
    model: spec.model,
    approvalMode: spec.approvalMode,
    system: spec.prompt.system,
    developer: spec.prompt.developer ?? '',
    serviceAccountRef: spec.runtimeIdentity?.serviceAccountRef ?? '',
    toolProfileRef: spec.toolProfileRef ?? '',
    mcpServerRefs: joinCsv(spec.externalTools?.mcpServerRefs),
    cliToolRefs: joinCsv(spec.externalTools?.cliToolRefs),
    skillRefs: joinCsv(spec.skillRefs),
    subagentRefs: joinCsv(spec.subagentRefs),
    contextLabelRefs: joinCsv(spec.contextLabelRefs),
    workspacePolicyRef: spec.workspacePolicyRef ?? '',
    runnerPool: spec.runnerPool ?? '',
    roleBindings: joinCsv(spec.permissionRefs?.roleBindings),
    secretGrants: joinCsv(spec.permissionRefs?.secretGrants),
    configGrants: joinCsv(spec.permissionRefs?.configGrants),
    memoryRepositoryRefs: joinCsv(spec.memoryRepositoryRefs),
  };
}

/**
 * §V4-5 Forge From: clone an existing stack as a template. The clone carries
 * the full spec, the suggested name "<source> Mk II", and NO stackRef — saving
 * mints a fresh deterministic stk-cNN id.
 */
export function forgeFromStack(view: SimStackView): StackDraft {
  return {
    stackRef: null,
    name: `${view.name} Mk II`,
    ...draftBody(view),
  };
}

/** Edit an existing (custom) stack in place — keeps its stackRef. */
export function editStackDraft(view: SimStackView): StackDraft {
  return {
    stackRef: view.stackRef,
    name: view.name,
    ...draftBody(view),
  };
}

/** Adapter switch: rebind baseAgent and reset the model to the family default. */
export function withAdapter(draft: StackDraft, adapter: string): StackDraft {
  const known = (ADAPTERS as readonly string[]).includes(adapter)
    ? (adapter as AdapterName)
    : null;
  return {
    ...draft,
    adapter,
    baseAgent: adapter,
    model: known !== null ? MODELS_BY_ADAPTER[known][0]! : draft.model,
  };
}

/**
 * Build the `upsertStack` input from a draft. Returns null when the draft is
 * not saveable (blank name — the sim would reject it anyway).
 */
export function draftToStackInput(draft: StackDraft): KradleAgentStackInput | null {
  const name = draft.name.trim();
  if (name === '') return null;

  const mcpServerRefs = splitCsv(draft.mcpServerRefs);
  const cliToolRefs = splitCsv(draft.cliToolRefs);
  const skillRefs = splitCsv(draft.skillRefs);
  const subagentRefs = splitCsv(draft.subagentRefs);
  const contextLabelRefs = splitCsv(draft.contextLabelRefs);
  const memoryRepositoryRefs = splitCsv(draft.memoryRepositoryRefs);
  const roleBindings = splitCsv(draft.roleBindings);
  const secretGrants = splitCsv(draft.secretGrants);
  const configGrants = splitCsv(draft.configGrants);

  const externalTools = {
    ...(mcpServerRefs.length > 0 ? { mcpServerRefs } : {}),
    ...(cliToolRefs.length > 0 ? { cliToolRefs } : {}),
  };
  const permissionRefs = {
    ...(roleBindings.length > 0 ? { roleBindings } : {}),
    ...(secretGrants.length > 0 ? { secretGrants } : {}),
    ...(configGrants.length > 0 ? { configGrants } : {}),
  };

  return {
    ...(draft.stackRef !== null ? { stackRef: draft.stackRef } : {}),
    metadata: { name },
    spec: {
      baseAgent: draft.baseAgent,
      adapter: draft.adapter,
      ...(draft.provider.trim() !== '' ? { provider: draft.provider.trim() } : {}),
      model: draft.model,
      prompt: {
        system: draft.system,
        ...(draft.developer.trim() !== '' ? { developer: draft.developer } : {}),
      },
      approvalMode: draft.approvalMode,
      ...(draft.serviceAccountRef.trim() !== ''
        ? { runtimeIdentity: { serviceAccountRef: draft.serviceAccountRef.trim() } }
        : {}),
      ...(draft.toolProfileRef.trim() !== '' ? { toolProfileRef: draft.toolProfileRef.trim() } : {}),
      ...(Object.keys(externalTools).length > 0 ? { externalTools } : {}),
      ...(skillRefs.length > 0 ? { skillRefs } : {}),
      ...(subagentRefs.length > 0 ? { subagentRefs } : {}),
      ...(contextLabelRefs.length > 0 ? { contextLabelRefs } : {}),
      ...(draft.workspacePolicyRef.trim() !== ''
        ? { workspacePolicyRef: draft.workspacePolicyRef.trim() }
        : {}),
      ...(draft.runnerPool.trim() !== '' ? { runnerPool: draft.runnerPool.trim() } : {}),
      ...(Object.keys(permissionRefs).length > 0 ? { permissionRefs } : {}),
      ...(memoryRepositoryRefs.length > 0 ? { memoryRepositoryRefs } : {}),
    },
    status: { phase: 'ready' },
  };
}

/** Roster excerpt (§V4-5): the first sentence of the system personality. */
export function personalityExcerpt(system: string, maxLength = 90): string {
  const trimmed = system.trim();
  if (trimmed === '') return '— no personality inscribed —';
  const match = /^[^.!?]*[.!?]/.exec(trimmed);
  const sentence = (match?.[0] ?? trimmed).trim();
  return sentence.length > maxLength ? `${sentence.slice(0, maxLength - 1)}…` : sentence;
}
