/**
 * Harness auto-detection.
 *
 * Probes environment variables to determine which harness the current
 * process is running inside. Used when `--adapter auto` is passed
 * to the CLI, sparing the caller from having to know or care which
 * particular flavour of AI assistant has summoned us.
 */

import { getHooksMuxDetectionRules } from '@a5c-ai/atlas/catalog';
import type { HooksMuxDetectionRule } from '@a5c-ai/atlas/catalog';

export interface DetectedHarness {
  /** Adapter name (e.g. 'claude', 'codex', 'gemini'). */
  adapter: string;
  /** How confident we are in the detection. */
  confidence: 'high' | 'medium' | 'low';
  /** What signals were found in the environment. */
  evidence: string[];
}

/**
 * Ordered list of detection rules.
 * First high-confidence match wins; checked sequentially.
 */
const DETECTION_RULES: HooksMuxDetectionRule[] = getHooksMuxDetectionRules();

/**
 * Detect which harness the current process is running inside.
 *
 * Probes environment variables (and optionally process context)
 * looking for harness-specific signals. Returns the first
 * high-confidence match, or failing that the first match of any
 * confidence level.
 *
 * @param env - Environment variables to probe. Defaults to `process.env`.
 * @returns The detected harness, or `null` if nothing matched.
 */
export function detectHarness(
  env: Record<string, string | undefined> = process.env,
): DetectedHarness | null {
  let bestMatch: DetectedHarness | null = null;

  for (const rule of DETECTION_RULES) {
    // Check optional condition (e.g. absence of other signals)
    if (rule.absentSignals?.some((signal) => env[signal])) {
      continue;
    }

    // Collect evidence — which of the rule's signals are actually present
    const evidence: string[] = [];
    for (const signal of rule.signals) {
      if (env[signal] != null && env[signal] !== '') {
        evidence.push(signal);
      }
    }

    if (evidence.length === 0) {
      continue;
    }

    const match: DetectedHarness = {
      adapter: rule.adapter,
      confidence: rule.confidence,
      evidence,
    };

    // High confidence: return immediately (first match wins)
    if (match.confidence === 'high') {
      return match;
    }

    // Otherwise, keep the first non-high match as a fallback
    if (!bestMatch) {
      bestMatch = match;
    }
  }

  return bestMatch;
}
