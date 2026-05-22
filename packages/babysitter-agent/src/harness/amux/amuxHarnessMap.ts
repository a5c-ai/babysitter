import { normalizeBuiltInHarnessName } from "../builtInHarness";

/**
 * Mapping from babysitter harness identifiers to agent-mux adapter names.
 *
 * Pi is intentionally excluded -- it uses agent-core directly rather than
 * the agent-mux subprocess model.
 *
 * @module harness/amux/amuxHarnessMap
 */

/**
 * Maps babysitter-agent harness names to the
 * corresponding agent-mux adapter identifier.
 */
export const HARNESS_TO_AMUX_ADAPTER: Readonly<Record<string, string>> = {
  "claude-code": "claude",
  "codex": "codex",
  "gemini-cli": "gemini",
  "github-copilot": "copilot",
  "cursor": "cursor",
  "opencode": "opencode",
  "openclaw": "openclaw",
  "oh-my-pi": "omp",
  "hermes": "hermes",
  // Pi is NOT here -- uses agent-core directly.
};

/**
 * Resolve a babysitter harness name to an agent-mux adapter name.
 *
 * @throws {Error} if `harness` is "pi" (Pi uses agent-core, not agent-mux)
 *         or if the harness has no known mapping.
 */
export function mapHarnessToAmuxAdapter(harness: string): string {
  const normalizedHarness = normalizeBuiltInHarnessName(harness);
  if (normalizedHarness === "pi" || normalizedHarness === "agent-core") {
    throw new Error(
      `Harness "${harness}" uses agent-core and cannot be invoked via agent-mux.`,
    );
  }
  const adapter = HARNESS_TO_AMUX_ADAPTER[normalizedHarness];
  if (!adapter) {
    throw new Error(
      `No agent-mux adapter mapping for harness "${harness}". ` +
      `Known mappings: ${Object.keys(HARNESS_TO_AMUX_ADAPTER).join(", ")}`,
    );
  }
  return adapter;
}

/**
 * Check whether a harness name has a corresponding agent-mux adapter.
 */
export function hasAmuxAdapter(harness: string): boolean {
  const normalizedHarness = normalizeBuiltInHarnessName(harness);
  return normalizedHarness in HARNESS_TO_AMUX_ADAPTER;
}
