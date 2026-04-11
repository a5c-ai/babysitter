/**
 * GAP-PROMPT-001: Prompt Strata Model
 *
 * Classifies prompt parts into three strata (stable, runtime, turnLocal)
 * and provides strata-aware composition for cache optimization and
 * deterministic prompt assembly.
 *
 * @module prompts/strata
 */

import type {
  PromptContext,
  PromptPart,
  PromptStratum,
  StratumTaggedPart,
  ComposeByStrataOptions,
} from './types';
import * as parts from './parts';

/**
 * Canonical stratum ordering: stable first (most cacheable), turnLocal last (most volatile).
 */
export const STRATUM_ORDER: readonly PromptStratum[] = ['stable', 'runtime', 'turnLocal'] as const;

/**
 * Factory for creating a StratumTaggedPart.
 */
export function tagPart(name: string, stratum: PromptStratum, render: PromptPart): StratumTaggedPart {
  return { name, stratum, render };
}

/**
 * Map of all known prompt parts to their stratum classification.
 *
 * STABLE (7): System identity, core rules, tool definitions — rarely change.
 * RUNTIME (11): Capabilities, flags, workspace context — change per session.
 * TURN_LOCAL (5): Interview, user profile, task-specific — change every turn.
 */
export const PART_STRATA_MAP: Record<string, StratumTaggedPart> = {
  // ── Stable stratum ───────────────────────────────────────────────────
  renderNonNegotiables: tagPart('renderNonNegotiables', 'stable', parts.renderNonNegotiables),
  renderCriticalRules: tagPart('renderCriticalRules', 'stable', parts.renderCriticalRules),
  renderTaskKinds: tagPart('renderTaskKinds', 'stable', parts.renderTaskKinds),
  renderTaskExamples: tagPart('renderTaskExamples', 'stable', parts.renderTaskExamples),
  renderProcessGuidelines: tagPart('renderProcessGuidelines', 'stable', parts.renderProcessGuidelines),
  renderSeeAlso: tagPart('renderSeeAlso', 'stable', parts.renderSeeAlso),
  renderCompletionProof: tagPart('renderCompletionProof', 'stable', parts.renderCompletionProof),

  // ── Runtime stratum ──────────────────────────────────────────────────
  renderDependencies: tagPart('renderDependencies', 'runtime', parts.renderDependencies),
  renderQuickReference: tagPart('renderQuickReference', 'runtime', parts.renderQuickReference),
  renderRecovery: tagPart('renderRecovery', 'runtime', parts.renderRecovery),
  renderLoopControl: tagPart('renderLoopControl', 'runtime', parts.renderLoopControl),
  renderRunCreation: tagPart('renderRunCreation', 'runtime', parts.renderRunCreation),
  renderIteration: tagPart('renderIteration', 'runtime', parts.renderIteration),
  renderEffects: tagPart('renderEffects', 'runtime', parts.renderEffects),
  renderBreakpointHandling: tagPart('renderBreakpointHandling', 'runtime', parts.renderBreakpointHandling),
  renderResultsPosting: tagPart('renderResultsPosting', 'runtime', parts.renderResultsPosting),
  renderRunOverlapDetection: tagPart('renderRunOverlapDetection', 'runtime', parts.renderRunOverlapDetection),
  renderParallelPhaseDetection: tagPart('renderParallelPhaseDetection', 'runtime', parts.renderParallelPhaseDetection),
  renderParallelDispatch: tagPart('renderParallelDispatch', 'runtime', parts.renderParallelDispatch),

  // ── Turn-local stratum ───────────────────────────────────────────────
  renderInterview: tagPart('renderInterview', 'turnLocal', parts.renderInterview),
  renderUserProfile: tagPart('renderUserProfile', 'turnLocal', parts.renderUserProfile),
  renderProcessCreation: tagPart('renderProcessCreation', 'turnLocal', parts.renderProcessCreation),
  renderIntentFidelityChecks: tagPart('renderIntentFidelityChecks', 'turnLocal', parts.renderIntentFidelityChecks),
  renderProjectInstructions: tagPart('renderProjectInstructions', 'turnLocal', parts.renderProjectInstructions),
};

/**
 * Filter PART_STRATA_MAP by stratum.
 */
export function getPartsForStratum(stratum: PromptStratum): StratumTaggedPart[] {
  return Object.values(PART_STRATA_MAP).filter(p => p.stratum === stratum);
}

const DEFAULT_SEPARATOR = '\n\n---\n\n';

/**
 * Compose prompt parts grouped by stratum in canonical order.
 *
 * Parts are grouped into stable -> runtime -> turnLocal sections.
 * Empty parts are skipped. Empty strata groups are omitted entirely.
 * When `showStrata` is true, stratum header labels are prepended to each group.
 */
export function composeByStrata(
  taggedParts: StratumTaggedPart[],
  ctx: PromptContext,
  options?: ComposeByStrataOptions,
): string {
  const separator = options?.separator ?? DEFAULT_SEPARATOR;
  const showStrata = options?.showStrata ?? false;

  const stratumGroups: string[] = [];

  for (const stratum of STRATUM_ORDER) {
    const partsInStratum = taggedParts.filter(p => p.stratum === stratum);
    if (partsInStratum.length === 0) continue;

    const renderedParts: string[] = [];
    for (const part of partsInStratum) {
      const rendered = part.render(ctx);
      if (rendered.length === 0) continue;

      if (showStrata) {
        renderedParts.push(`<!-- [part: ${part.name}] -->\n${rendered}`);
      } else {
        renderedParts.push(rendered);
      }
    }

    if (renderedParts.length === 0) continue;

    if (showStrata) {
      stratumGroups.push(
        `<!-- [stratum: ${stratum}] -->\n${renderedParts.join(separator)}`
      );
    } else {
      stratumGroups.push(renderedParts.join(separator));
    }
  }

  return stratumGroups.join(separator);
}
