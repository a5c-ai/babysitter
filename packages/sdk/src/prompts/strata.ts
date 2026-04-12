/**
 * GAP-PROMPT-001: Prompt Strata Model
 * GAP-PERF-005: Cache-Aware Prompt Assembly
 *
 * Classifies prompt parts into three strata (stable, runtime, turnLocal)
 * and provides strata-aware composition for cache optimization and
 * deterministic prompt assembly.
 *
 * @module prompts/strata
 */

import { createHash } from 'node:crypto';
import type {
  PromptContext,
  PromptPart,
  PromptStratum,
  StratumTaggedPart,
  ComposeByStrataOptions,
  StratumChecksums,
  ComposeByStrataWithMetaResult,
} from './types';
import * as parts from './parts';

/**
 * Canonical stratum ordering: stable first (most cacheable), turnLocal last (most volatile).
 */
export const STRATUM_ORDER: readonly PromptStratum[] = ['stable', 'runtime', 'turnLocal'] as const;

/**
 * Default volatility score for parts that don't specify one.
 */
const DEFAULT_VOLATILITY_SCORE = 50;

/**
 * Factory for creating a StratumTaggedPart.
 */
export function tagPart(
  name: string,
  stratum: PromptStratum,
  render: PromptPart,
  volatilityScore?: number,
): StratumTaggedPart {
  return { name, stratum, render, volatilityScore };
}

/**
 * Map of all known prompt parts to their stratum classification.
 *
 * STABLE (11): System identity, core rules, tool definitions — rarely change.
 * RUNTIME (12): Capabilities, flags, workspace context — change per session.
 * TURN_LOCAL (6): Interview, user profile, task-specific — change every turn.
 *
 * Volatility scores (0=most stable, 100=most volatile) control intra-stratum
 * ordering for cache-prefix optimization (GAP-PERF-005).
 */
export const PART_STRATA_MAP: Record<string, StratumTaggedPart> = {
  // ── Stable stratum ───────────────────────────────────────────────────
  renderNonNegotiables: tagPart('renderNonNegotiables', 'stable', parts.renderNonNegotiables, 5),
  renderCriticalRules: tagPart('renderCriticalRules', 'stable', parts.renderCriticalRules, 5),
  renderTaskKinds: tagPart('renderTaskKinds', 'stable', parts.renderTaskKinds, 10),
  renderCompletionProof: tagPart('renderCompletionProof', 'stable', parts.renderCompletionProof, 10),
  renderTaskExamples: tagPart('renderTaskExamples', 'stable', parts.renderTaskExamples, 15),
  renderProcessGuidelines: tagPart('renderProcessGuidelines', 'stable', parts.renderProcessGuidelines, 15),
  renderCodingPhilosophy: tagPart('renderCodingPhilosophy', 'stable', parts.renderCodingPhilosophy, 20),
  renderToolPreferences: tagPart('renderToolPreferences', 'stable', parts.renderToolPreferences, 20),
  renderOutputEfficiency: tagPart('renderOutputEfficiency', 'stable', parts.renderOutputEfficiency, 20),
  renderGitSafety: tagPart('renderGitSafety', 'stable', parts.renderGitSafety, 20),
  renderPriorityLadder: tagPart('renderPriorityLadder', 'stable', parts.renderPriorityLadder, 22),
  renderRootCauseGuardrail: tagPart('renderRootCauseGuardrail', 'stable', parts.renderRootCauseGuardrail, 22),
  renderSeeAlso: tagPart('renderSeeAlso', 'stable', parts.renderSeeAlso, 25),

  // ── Runtime stratum ──────────────────────────────────────────────────
  renderLoopControl: tagPart('renderLoopControl', 'runtime', parts.renderLoopControl, 30),
  renderIteration: tagPart('renderIteration', 'runtime', parts.renderIteration, 30),
  renderEffects: tagPart('renderEffects', 'runtime', parts.renderEffects, 30),
  renderBreakpointHandling: tagPart('renderBreakpointHandling', 'runtime', parts.renderBreakpointHandling, 30),
  renderResultsPosting: tagPart('renderResultsPosting', 'runtime', parts.renderResultsPosting, 30),
  renderRunCreation: tagPart('renderRunCreation', 'runtime', parts.renderRunCreation, 35),
  renderParallelDispatch: tagPart('renderParallelDispatch', 'runtime', parts.renderParallelDispatch, 35),
  renderRunOverlapDetection: tagPart('renderRunOverlapDetection', 'runtime', parts.renderRunOverlapDetection, 40),
  renderParallelPhaseDetection: tagPart('renderParallelPhaseDetection', 'runtime', parts.renderParallelPhaseDetection, 40),
  renderDependencies: tagPart('renderDependencies', 'runtime', parts.renderDependencies, 45),
  renderRecovery: tagPart('renderRecovery', 'runtime', parts.renderRecovery, 45),
  renderQuickReference: tagPart('renderQuickReference', 'runtime', parts.renderQuickReference, 50),

  // ── Turn-local stratum ───────────────────────────────────────────────
  renderIntentFidelityChecks: tagPart('renderIntentFidelityChecks', 'turnLocal', parts.renderIntentFidelityChecks, 55),
  renderProcessCreation: tagPart('renderProcessCreation', 'turnLocal', parts.renderProcessCreation, 60),
  renderInterview: tagPart('renderInterview', 'turnLocal', parts.renderInterview, 70),
  renderUserProfile: tagPart('renderUserProfile', 'turnLocal', parts.renderUserProfile, 75),
  renderProjectInstructions: tagPart('renderProjectInstructions', 'turnLocal', parts.renderProjectInstructions, 80),
  renderContinuityOverlay: tagPart('renderContinuityOverlay', 'turnLocal', parts.renderContinuityOverlay, 90),
};

/**
 * Filter PART_STRATA_MAP by stratum.
 */
export function getPartsForStratum(stratum: PromptStratum): StratumTaggedPart[] {
  return Object.values(PART_STRATA_MAP).filter(p => p.stratum === stratum);
}

const DEFAULT_SEPARATOR = '\n\n---\n\n';

/**
 * Get effective volatility score for a part (defaults to 50).
 */
function getVolatility(part: StratumTaggedPart): number {
  return part.volatilityScore ?? DEFAULT_VOLATILITY_SCORE;
}

/**
 * Sort parts within a stratum by volatility score (ascending = most stable first).
 * Uses a stable sort to preserve insertion order for equal scores.
 */
function sortPartsByVolatility(partsInStratum: StratumTaggedPart[]): StratumTaggedPart[] {
  return [...partsInStratum].sort((a, b) => getVolatility(a) - getVolatility(b));
}

/**
 * Result of rendering a single stratum group.
 */
interface StratumRenderResult {
  stratum: PromptStratum;
  /** Formatted rendered parts (may include annotations) */
  formatted: string[];
  /** Raw rendered content without annotations (for checksumming) */
  raw: string[];
}

/**
 * Shared composition logic: renders all strata and returns per-stratum results.
 */
function renderAllStrata(
  taggedParts: StratumTaggedPart[],
  ctx: PromptContext,
  options?: ComposeByStrataOptions,
): StratumRenderResult[] {
  const showStrata = options?.showStrata ?? false;
  const shouldSortByVolatility = options?.sortByVolatility !== false;
  const results: StratumRenderResult[] = [];

  for (const stratum of STRATUM_ORDER) {
    let partsInStratum = taggedParts.filter(p => p.stratum === stratum);
    if (partsInStratum.length === 0) continue;

    if (shouldSortByVolatility) {
      partsInStratum = sortPartsByVolatility(partsInStratum);
    }

    const formatted: string[] = [];
    const raw: string[] = [];
    for (const part of partsInStratum) {
      const rendered = part.render(ctx);
      if (rendered.length === 0) continue;

      raw.push(rendered);
      if (showStrata) {
        const volLabel = part.volatilityScore != null ? ` vol:${part.volatilityScore}` : '';
        formatted.push(`<!-- [part: ${part.name}${volLabel}] -->\n${rendered}`);
      } else {
        formatted.push(rendered);
      }
    }

    if (formatted.length > 0) {
      results.push({ stratum, formatted, raw });
    }
  }

  return results;
}

/**
 * Assemble stratum render results into a final output string.
 */
function assembleOutput(
  results: StratumRenderResult[],
  separator: string,
  showStrata: boolean,
): string {
  const groups: string[] = [];
  for (const { stratum, formatted } of results) {
    if (showStrata) {
      groups.push(`<!-- [stratum: ${stratum}] -->\n${formatted.join(separator)}`);
    } else {
      groups.push(formatted.join(separator));
    }
  }
  return groups.join(separator);
}

/**
 * Compose prompt parts grouped by stratum in canonical order.
 *
 * Parts are grouped into stable -> runtime -> turnLocal sections.
 * Empty parts are skipped. Empty strata groups are omitted entirely.
 * When `showStrata` is true, stratum header labels are prepended to each group.
 *
 * GAP-PERF-005: Parts within each stratum are sorted by volatilityScore
 * ascending (most stable first) unless sortByVolatility is explicitly false.
 */
export function composeByStrata(
  taggedParts: StratumTaggedPart[],
  ctx: PromptContext,
  options?: ComposeByStrataOptions,
): string {
  const separator = options?.separator ?? DEFAULT_SEPARATOR;
  const showStrata = options?.showStrata ?? false;
  const results = renderAllStrata(taggedParts, ctx, options);
  return assembleOutput(results, separator, showStrata);
}

/**
 * GAP-PERF-005: Compute SHA256 checksum of concatenated rendered parts.
 */
function computeStratumChecksum(renderedParts: string[]): string {
  const hash = createHash('sha256');
  for (const part of renderedParts) {
    hash.update(part);
  }
  return hash.digest('hex');
}

/**
 * GAP-PERF-005: Compose prompt parts with strata metadata for cache optimization.
 *
 * Returns both the composed output and per-stratum SHA256 checksums.
 * Checksums enable cache-break detection between iterations.
 */
export function composeByStrataWithMeta(
  taggedParts: StratumTaggedPart[],
  ctx: PromptContext,
  options?: ComposeByStrataOptions,
): ComposeByStrataWithMetaResult {
  const separator = options?.separator ?? DEFAULT_SEPARATOR;
  const showStrata = options?.showStrata ?? false;
  const results = renderAllStrata(taggedParts, ctx, options);

  const stratumChecksums: StratumChecksums = {};
  for (const { stratum, raw } of results) {
    stratumChecksums[stratum] = computeStratumChecksum(raw);
  }

  return {
    output: assembleOutput(results, separator, showStrata),
    stratumChecksums,
  };
}

/**
 * GAP-PERF-005: Detect which strata changed between two compositions.
 *
 * Returns an array of strata whose checksums differ (including strata
 * that are newly added or removed between prev and next).
 */
export function detectStratumChanges(
  prev: StratumChecksums,
  next: StratumChecksums,
): PromptStratum[] {
  const changed: PromptStratum[] = [];
  for (const stratum of STRATUM_ORDER) {
    if (prev[stratum] !== next[stratum]) {
      changed.push(stratum);
    }
  }
  return changed;
}
