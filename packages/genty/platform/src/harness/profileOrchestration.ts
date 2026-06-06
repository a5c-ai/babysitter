/**
 * Profile-driven orchestration configuration — derive orchestration
 * preferences from a user profile so runs automatically align with
 * the operator's breakpoint tolerance, model preference, and tool
 * choices (GAP-PROF-001).
 */

// ---------------------------------------------------------------------------
// Types (inline to avoid cross-package import issues at build time)
// ---------------------------------------------------------------------------

export type BreakpointDensity = 'none' | 'sparse' | 'moderate' | 'frequent';

export interface OrchestrationConfig {
  breakpointDensity: BreakpointDensity;
  preferredModel: string | undefined;
  toolPreferences: {
    editor: string | undefined;
    shell: string | undefined;
    packageManagers: string[];
  };
}

export interface ProcessOptions {
  breakpointDensity?: BreakpointDensity;
  model?: string;
  toolPreferences?: {
    editor?: string;
    shell?: string;
    packageManagers?: string[];
  };
  [key: string]: unknown;
}

/**
 * Minimal subset of UserProfile that this module reads.
 * We accept any object matching this shape so we don't import the SDK
 * userTypes at compile time (the SDK is a build-time reference).
 */
export interface ProfileLike {
  breakpointTolerance?: {
    global?: string;
  };
  toolPreferences?: {
    editor?: string;
    shell?: string;
    packageManagers?: string[];
    [key: string]: unknown;
  };
  preferences?: {
    [key: string]: unknown;
  };
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

const TOLERANCE_TO_DENSITY: Record<string, BreakpointDensity> = {
  minimal: 'none',
  low: 'sparse',
  moderate: 'moderate',
  high: 'frequent',
  maximum: 'frequent',
};

function mapBreakpointDensity(tolerance: string | undefined): BreakpointDensity {
  if (!tolerance) return 'moderate';
  return TOLERANCE_TO_DENSITY[tolerance] ?? 'moderate';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Derive orchestration configuration from a user profile.
 */
export function deriveOrchestrationConfig(profile: ProfileLike): OrchestrationConfig {
  const breakpointDensity = mapBreakpointDensity(profile.breakpointTolerance?.global);

  // Model preference is an open-ended string stored under preferences
  const preferredModel = typeof profile.preferences?.preferredModel === 'string'
    ? profile.preferences.preferredModel
    : undefined;

  const toolPreferences = {
    editor: profile.toolPreferences?.editor,
    shell: profile.toolPreferences?.shell,
    packageManagers: profile.toolPreferences?.packageManagers ?? [],
  };

  return { breakpointDensity, preferredModel, toolPreferences };
}

/**
 * Merge profile-derived preferences into process options.
 * Explicit values in `options` take precedence over the profile.
 */
export function applyProfileToProcessOptions(
  profile: ProfileLike,
  options: ProcessOptions,
): ProcessOptions {
  const config = deriveOrchestrationConfig(profile);

  return {
    ...options,
    breakpointDensity: options.breakpointDensity ?? config.breakpointDensity,
    model: options.model ?? config.preferredModel,
    toolPreferences: {
      editor: options.toolPreferences?.editor ?? config.toolPreferences.editor,
      shell: options.toolPreferences?.shell ?? config.toolPreferences.shell,
      packageManagers: options.toolPreferences?.packageManagers ?? config.toolPreferences.packageManagers,
    },
  };
}
