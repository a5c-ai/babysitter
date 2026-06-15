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
  model: string;
  approvalMode: string;
  system: string;
  developer: string;
}

/** A blank new-stack draft (claude-code defaults). */
export function blankStackDraft(): StackDraft {
  return {
    stackRef: null,
    name: '',
    baseAgent: 'claude-code',
    adapter: 'claude-code',
    model: MODELS_BY_ADAPTER['claude-code'][0]!,
    approvalMode: 'prompt',
    system: '',
    developer: '',
  };
}

/** Shared draft body copied from an existing stack's spec. */
function draftBody(view: SimStackView): Omit<StackDraft, 'stackRef' | 'name'> {
  const spec = view.stack.spec;
  return {
    baseAgent: spec.baseAgent,
    adapter: spec.adapter,
    model: spec.model,
    approvalMode: spec.approvalMode,
    system: spec.prompt.system,
    developer: spec.prompt.developer ?? '',
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
  return {
    ...(draft.stackRef !== null ? { stackRef: draft.stackRef } : {}),
    metadata: { name },
    spec: {
      baseAgent: draft.baseAgent,
      adapter: draft.adapter,
      model: draft.model,
      prompt: {
        system: draft.system,
        ...(draft.developer.trim() !== '' ? { developer: draft.developer } : {}),
      },
      approvalMode: draft.approvalMode,
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
