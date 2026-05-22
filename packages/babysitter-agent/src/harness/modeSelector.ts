/**
 * GAP-UX-014: Operator Mode Selection
 *
 * In-session mode switching between orchestration modes without
 * restarting the run. Affects prompt personality, breakpoint
 * frequency, and parallelism configuration.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Available orchestration modes. */
export type OrchestrationMode = "interactive" | "autonomous" | "plan" | "fast";

/** Mode configuration that affects runtime behavior. */
export interface ModeConfig {
  /** Mode identifier. */
  mode: OrchestrationMode;
  /** Human-readable label. */
  label: string;
  /** Description of this mode's behavior. */
  description: string;
  /** Whether breakpoints require human approval. */
  breakpointApproval: "always" | "auto" | "never";
  /** Whether to show plan before execution. */
  showPlan: boolean;
  /** Whether to parallelize independent effects. */
  parallelism: boolean;
  /** Output verbosity level. */
  verbosity: "minimal" | "normal" | "verbose";
}

// ---------------------------------------------------------------------------
// Mode definitions
// ---------------------------------------------------------------------------

const MODE_CONFIGS: Record<OrchestrationMode, ModeConfig> = {
  interactive: {
    mode: "interactive",
    label: "Interactive",
    description: "Full human-in-the-loop. All breakpoints prompt for approval. Shows plan before execution.",
    breakpointApproval: "always",
    showPlan: true,
    parallelism: false,
    verbosity: "verbose",
  },
  autonomous: {
    mode: "autonomous",
    label: "Autonomous",
    description: "Minimal human intervention. Auto-approves most breakpoints. Maximum parallelism.",
    breakpointApproval: "auto",
    showPlan: false,
    parallelism: true,
    verbosity: "minimal",
  },
  plan: {
    mode: "plan",
    label: "Plan Only",
    description: "Generates and presents a plan, then stops. No execution until explicitly approved.",
    breakpointApproval: "always",
    showPlan: true,
    parallelism: false,
    verbosity: "normal",
  },
  fast: {
    mode: "fast",
    label: "Fast",
    description: "Prioritizes speed. Auto-approves safe breakpoints. Parallel execution. Minimal output.",
    breakpointApproval: "auto",
    showPlan: false,
    parallelism: true,
    verbosity: "minimal",
  },
};

// ---------------------------------------------------------------------------
// Mode state
// ---------------------------------------------------------------------------

/**
 * Active mode state — module-level mutable singleton for in-session switching.
 *
 * This is intentionally module-scoped rather than instance-based because the
 * babysitter CLI runs as a single-session process. Not safe for concurrent
 * multi-session use within a single process. Use {@link resetMode} for test
 * isolation between test cases.
 */
let _activeMode: OrchestrationMode = "interactive";

/** Get the current active mode. */
export function getActiveMode(): OrchestrationMode {
  return _activeMode;
}

/** Get the configuration for the active mode. */
export function getActiveModeConfig(): ModeConfig {
  return MODE_CONFIGS[_activeMode];
}

/** Switch to a different orchestration mode. Returns the new mode config. */
export function switchMode(mode: OrchestrationMode): ModeConfig {
  _activeMode = mode;
  return MODE_CONFIGS[mode];
}

/** Get the configuration for a specific mode. */
export function getModeConfig(mode: OrchestrationMode): ModeConfig {
  return MODE_CONFIGS[mode];
}

/** Get all available modes. */
export function getAvailableModes(): ModeConfig[] {
  return Object.values(MODE_CONFIGS);
}

/** Reset mode to default (interactive). Exported for test isolation. */
export function resetMode(): void {
  _activeMode = "interactive";
}

/**
 * Check if the current mode skips interactive breakpoint prompts.
 * Returns true for "auto" (auto-approve based on rules) but NOT for "always" (always prompt).
 */
export function shouldAutoApprove(): boolean {
  return MODE_CONFIGS[_activeMode].breakpointApproval === "auto";
}

/** Check if the current mode wants to show plans before execution. */
export function shouldShowPlan(): boolean {
  return MODE_CONFIGS[_activeMode].showPlan;
}

/** Check if parallel execution is enabled in the current mode. */
export function isParallelEnabled(): boolean {
  return MODE_CONFIGS[_activeMode].parallelism;
}

/** Format mode information for display. */
export function formatModeInfo(mode?: OrchestrationMode): string {
  const config = mode ? MODE_CONFIGS[mode] : MODE_CONFIGS[_activeMode];
  return [
    `Mode: ${config.label} (${config.mode})`,
    config.description,
    `  Breakpoints: ${config.breakpointApproval}`,
    `  Plan: ${config.showPlan ? "shown" : "hidden"}`,
    `  Parallelism: ${config.parallelism ? "enabled" : "disabled"}`,
    `  Verbosity: ${config.verbosity}`,
  ].join("\n");
}
