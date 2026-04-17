/**
 * CLI handlers for `instructions:*` commands.
 *
 * Each subcommand resolves a PromptContext for the given harness,
 * calls the appropriate composer, and outputs the result.
 *
 * @module cli/commands/instructions
 */

import { existsSync } from "node:fs";
import {
  composeBabysitSkillPrompt,
  composeProcessCreatePrompt,
  composeOrchestrationPrompt,
  composeBreakpointPrompt,
  PART_STRATA_MAP,
  composeByStrata,
  detectExecutionContext,
  deriveCapabilityFlags,
  renderCapabilityProcessGuide,
  processPathsForCapabilities,
} from "../../prompts";
import type { PromptContext, StratumTaggedPart } from "../../prompts";
import {
  resolveActiveProcessLibrary,
  getDefaultProcessLibrarySpec,
} from "../../processLibrary/active";
import {
  createPromptContextForHarness,
  getAdapterByName,
  KNOWN_HARNESSES,
} from "../../harness/registry";
import { getSessionFilePath } from "../../session/parse";

export interface InstructionsCommandArgs {
  subcommand: "babysit-skill" | "process-create" | "orchestrate" | "breakpoint-handling";
  harness: string;
  interactive: boolean | undefined;
  json: boolean;
  showStrata?: boolean;
}

type ComposerEntry = {
  fn: (ctx: PromptContext) => string;
  promptType: string;
  partsIncluded: string[];
  /** Tagged parts for strata-aware composition (GAP-PROMPT-001) */
  strataParts: string[];
};

const COMPOSERS: Record<InstructionsCommandArgs["subcommand"], ComposerEntry> = {
  "babysit-skill": {
    fn: composeBabysitSkillPrompt,
    promptType: "babysit-skill",
    partsIncluded: [
      "non-negotiables", "dependencies", "interview", "user-profile",
      "process-creation", "intent-fidelity-checks", "run-overlap-detection", "run-creation",
      "iteration", "effects", "breakpoint-handling", "results-posting",
      "loop-control", "completion-proof", "task-kinds", "task-examples",
      "quick-reference", "recovery", "process-guidelines", "critical-rules",
      "see-also",
      "project-instructions",
    ],
    strataParts: [
      "renderNonNegotiables", "renderDependencies", "renderInterview", "renderUserProfile",
      "renderProcessCreation", "renderIntentFidelityChecks", "renderRunOverlapDetection",
      "renderRunCreation", "renderIteration", "renderEffects", "renderBreakpointHandling",
      "renderResultsPosting", "renderLoopControl", "renderCompletionProof",
      "renderTaskKinds", "renderTaskExamples", "renderQuickReference", "renderRecovery",
      "renderProcessGuidelines", "renderCriticalRules", "renderSeeAlso",
      "renderProjectInstructions",
    ],
  },
  "process-create": {
    fn: composeProcessCreatePrompt,
    promptType: "process-create",
    partsIncluded: [
      "interview", "user-profile", "process-creation",
      "intent-fidelity-checks", "process-guidelines",
      "parallel-phase-detection", "task-kinds", "task-examples",
      "project-instructions",
    ],
    strataParts: [
      "renderInterview", "renderUserProfile", "renderProcessCreation",
      "renderIntentFidelityChecks", "renderProcessGuidelines",
      "renderParallelPhaseDetection", "renderTaskKinds", "renderTaskExamples",
      "renderProjectInstructions",
    ],
  },
  "orchestrate": {
    fn: composeOrchestrationPrompt,
    promptType: "orchestrate",
    partsIncluded: [
      "run-overlap-detection", "run-creation", "iteration", "effects", "breakpoint-handling",
      "results-posting", "loop-control", "completion-proof",
      "quick-reference", "recovery", "critical-rules",
    ],
    strataParts: [
      "renderRunOverlapDetection", "renderRunCreation", "renderIteration", "renderEffects",
      "renderBreakpointHandling", "renderResultsPosting", "renderLoopControl",
      "renderCompletionProof", "renderQuickReference", "renderRecovery", "renderCriticalRules",
    ],
  },
  "breakpoint-handling": {
    fn: composeBreakpointPrompt,
    promptType: "breakpoint-handling",
    partsIncluded: ["breakpoint-handling", "results-posting"],
    strataParts: ["renderBreakpointHandling", "renderResultsPosting"],
  },
};

/**
 * Resolve a PromptContext factory by harness name.
 */
function resolveContextFactory(
  harness: string,
): ((overrides?: Partial<PromptContext>) => PromptContext) | undefined {
  if (!getAdapterByName(harness)?.getPromptContext) {
    return undefined;
  }
  return (overrides?: Partial<PromptContext>) => {
    const context = createPromptContextForHarness(harness, overrides);
    if (!context) {
      throw new Error(`Harness "${harness}" does not provide a prompt context.`);
    }
    return context;
  };
}

/**
 * Try to resolve the active process-library root from the SDK directly.
 * Returns the library root and reference root if a binding exists,
 * or undefined values if resolution fails (no binding, network error, etc.).
 */
async function tryResolveProcessLibraryRoot(): Promise<{
  processLibraryRoot?: string;
  processLibraryReferenceRoot?: string;
}> {
  try {
    const resolved = await resolveActiveProcessLibrary();
    if (resolved.binding?.dir) {
      const defaultSpec = getDefaultProcessLibrarySpec();
      return {
        processLibraryRoot: defaultSpec.processRoot,
        processLibraryReferenceRoot: defaultSpec.referenceRoot,
      };
    }
  } catch {
    // No binding exists or resolution failed — fall back to manual instructions
  }
  return {};
}

/**
 * Detect whether the session-start hook has actually run by checking for the
 * session state file it creates (`<stateDir>/<sessionId>.md`).
 *
 * The definitive signal is now the PID-scoped session marker written by the
 * session-start hook; absence of the marker (even when env vars like
 * GEMINI_SESSION_ID / CODEX_SESSION_ID / BABYSITTER_SESSION_ID are present)
 * usually means hooks did not fire. Env-var-only resolution is a fallback
 * path that may bind to stale IDs inherited from ancestor shells, so it
 * cannot be trusted as proof that hooks are active. The hook writes the
 * state file as a side effect of `babysitter hook:run --hook-type session-start`.
 */
function detectHooksActive(harness: string): boolean {
  const adapter = getAdapterByName(harness);
  if (!adapter) return false;

  const sessionId = adapter.resolveSessionId({});
  if (!sessionId) return false;

  const stateDir = adapter.resolveStateDir({});
  if (!stateDir) return false;

  const stateFile = getSessionFilePath(stateDir, sessionId);
  return existsSync(stateFile);
}

/**
 * Route and handle an `instructions:*` subcommand.
 */
export async function handleInstructionsCommand(
  args: InstructionsCommandArgs,
): Promise<number> {
  const factory = resolveContextFactory(args.harness);
  if (!factory) {
    const known = KNOWN_HARNESSES.map((spec) => spec.name).join(", ");
    if (args.json) {
      console.log(
        JSON.stringify({
          error: "unknown_harness",
          message: `Unknown harness "${args.harness}". Known harnesses: ${known}`,
        }),
      );
    } else {
      console.error(
        `[instructions] Unknown harness "${args.harness}". Known harnesses: ${known}`,
      );
    }
    return 1;
  }

  const composer = COMPOSERS[args.subcommand];
  if (!composer) {
    const known = Object.keys(COMPOSERS).join(", ");
    if (args.json) {
      console.log(
        JSON.stringify({
          error: "unknown_subcommand",
          message: `Unknown subcommand "${args.subcommand}". Known subcommands: ${known}`,
        }),
      );
    } else {
      console.error(
        `[instructions] Unknown subcommand "${args.subcommand}". Known subcommands: ${known}`,
      );
    }
    return 1;
  }

  // Resolve the active process-library root before composing the prompt
  const libraryInfo = await tryResolveProcessLibraryRoot();

  // Detect whether hooks are actually active in this session.
  // If the session-start hook never ran (no breadcrumb file), override
  // hookDriven to false so the agent drives the loop in-turn.
  const hooksActive = detectHooksActive(args.harness);
  const hookOverride: Partial<PromptContext> = {};
  if (!hooksActive) {
    hookOverride.hookDriven = false;
  }

  // Detect execution context (CI, trigger, branch, actor) and derive
  // capability flags so the babysit skill can select context-appropriate
  // library processes when dispatching (e.g. GitHub collaboration,
  // scheduled reporting, local-dev relaxations).
  const executionContext = detectExecutionContext();
  const capabilityFlags = deriveCapabilityFlags(executionContext);

  const ctx = factory({
    interactive: args.interactive,
    ...libraryInfo,
    ...hookOverride,
  });

  // GAP-PROMPT-001: Use strata-aware composition when --show-strata is set
  let content: string;
  if (args.showStrata) {
    const taggedParts: StratumTaggedPart[] = composer.strataParts
      .map(name => PART_STRATA_MAP[name])
      .filter((p): p is StratumTaggedPart => p != null);
    content = composeByStrata(taggedParts, ctx, { showStrata: true });
  } else {
    content = composer.fn(ctx);
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          harness: args.harness,
          interactive: args.interactive,
          promptType: composer.promptType,
          hookDriven: ctx.hookDriven,
          hooksDetected: hooksActive,
          executionContext,
          capabilityFlags,
          suggestedProcesses: processPathsForCapabilities(capabilityFlags),
          content,
          partsIncluded: composer.partsIncluded,
        },
        null,
        2,
      ),
    );
  } else {
    if (!hooksActive && ctx.hookDriven !== false) {
      // Context factory defaulted hookDriven to true, but we overrode it.
      // This is a no-op because the override already happened, but it
      // clarifies the JSON output. The text output is self-explanatory
      // from the generated instructions.
    }
    const activeCapabilities = Object.entries(capabilityFlags)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
    const contextHeader = [
      '## Execution Context',
      '',
      `- CI: \`${executionContext.ci}\``,
      `- Trigger: \`${executionContext.trigger}\``,
      executionContext.branch.ref ? `- Branch: \`${executionContext.branch.ref}\`` : undefined,
      executionContext.repo ? `- Repo: \`${executionContext.repo.owner}/${executionContext.repo.name}\`` : undefined,
      executionContext.actor ? `- Actor: \`${executionContext.actor.login}\`${executionContext.actor.isBot ? ' (bot)' : ''}` : undefined,
      '',
      `Active context capabilities: ${activeCapabilities.length > 0 ? activeCapabilities.map(c => `\`${c}\``).join(', ') : '_(none)_'}`,
      '',
      'When selecting library processes to dispatch, prefer those whose triggers match the active capabilities above.',
      '',
      '---',
      '',
    ].filter((l): l is string => l !== undefined).join('\n');
    const processGuide = renderCapabilityProcessGuide(capabilityFlags);
    console.log(contextHeader + processGuide + content);
  }

  return 0;
}
