/**
 * CLI handlers for `instructions:*` commands.
 *
 * Each subcommand resolves a PromptContext for the given harness,
 * calls the appropriate composer, and outputs the result.
 *
 * @module cli/commands/instructions
 */

import { existsSync, promises as fs } from "node:fs";
import * as path from "node:path";
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
import {
  detectCallerHarness,
  detectCallerHarnessViaHooksMux,
} from "../../harness/discovery";
import { getSessionFilePath } from "../../session/parse";
import {
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";
import { resolveRunsDir } from "../../config";

export interface InstructionsCommandArgs {
  subcommand: "babysit-skill" | "process-create" | "orchestrate" | "breakpoint-handling";
  harness?: string;
  interactive: boolean | undefined;
  json: boolean;
  showStrata?: boolean;
}

type ResolvedInstructionsHarness = {
  harness: string;
  source: "explicit" | "caller" | "hooks-mux" | "fallback";
  warnings: string[];
  evidence: string[];
};

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
  if (harness === "custom") {
    return (overrides?: Partial<PromptContext>) =>
      createPessimisticPromptContext(overrides);
  }
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

function createPessimisticPromptContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContext(
    {
      harness: "custom",
      harnessLabel: "Custom Harness",
      capabilities: ["task-tool", "breakpoint-routing"],
      pluginRootVar: "",
      loopControlTerm: "in-turn",
      sessionBindingFlags: "",
      hookDriven: false,
      interactiveToolName: "",
      sessionEnvVars: "`--session-id`, `AGENT_SESSION_ID`, or the PID-scoped session marker fallback",
      resumeFlags: "",
      cliSetupSnippet: createDefaultCliSetupSnippet(),
      iterateFlags: "",
      hasIntentFidelityChecks: false,
      hasNonNegotiables: false,
    },
    overrides,
  );
}

function resolveInstructionsHarness(
  harness: string | undefined,
): ResolvedInstructionsHarness {
  if (harness) {
    return {
      harness,
      source: "explicit",
      warnings: [],
      evidence: [],
    };
  }

  const caller = detectCallerHarness();
  if (caller) {
    return {
      harness: caller.name,
      source: "caller",
      warnings: [],
      evidence: caller.matchedEnvVars,
    };
  }

  const hooksMuxCaller = detectCallerHarnessViaHooksMux();
  if (hooksMuxCaller) {
    return {
      harness: hooksMuxCaller.name,
      source: "hooks-mux",
      warnings: [],
      evidence: hooksMuxCaller.matchedEnvVars,
    };
  }

  return {
    harness: "custom",
    source: "fallback",
    warnings: [
      "Host discovery failed for `instructions:*`; using the pessimistic custom-harness prompt context.",
    ],
    evidence: [],
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
 * GEMINI_SESSION_ID / CODEX_SESSION_ID / AGENT_SESSION_ID are present)
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

interface ExistingRunInfo {
  runId: string;
  runDir: string;
  processId: string;
  isBareRun: boolean;
  entrypoint: { importPath: string; exportName?: string };
  completionProof?: string;
}

async function detectExistingRun(): Promise<ExistingRunInfo | undefined> {
  try {
    const runsDir = resolveRunsDir();
    const entries = await fs.readdir(runsDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort().reverse();
    for (const runId of dirs.slice(0, 5)) {
      const runFile = path.join(runsDir, runId, "run.json");
      try {
        const raw = await fs.readFile(runFile, "utf8");
        const meta = JSON.parse(raw) as Record<string, unknown>;
        const entrypoint = meta["entrypoint"] as { importPath?: string; exportName?: string } | undefined;
        const processId = (meta["processId"] as string) ?? "";
        const isBareRun = entrypoint?.importPath === "bare-run";
        return {
          runId,
          runDir: path.join(runsDir, runId),
          processId,
          isBareRun,
          entrypoint: { importPath: entrypoint?.importPath ?? "", exportName: entrypoint?.exportName },
          completionProof: meta["completionProof"] as string | undefined
            ?? (meta["metadata"] as Record<string, unknown> | undefined)?.["completionProof"] as string | undefined,
        };
      } catch { continue; }
    }
  } catch { /* no runs dir */ }
  return undefined;
}

/**
 * Route and handle an `instructions:*` subcommand.
 */
export async function handleInstructionsCommand(
  args: InstructionsCommandArgs,
): Promise<number> {
  const resolvedHarness = resolveInstructionsHarness(args.harness);
  const factory = resolveContextFactory(resolvedHarness.harness);
  if (!factory) {
    const known = KNOWN_HARNESSES.map((spec) => spec.name).join(", ");
    if (args.json) {
      console.log(
        JSON.stringify({
          error: "unknown_harness",
          message: `Unknown harness "${resolvedHarness.harness}". Known harnesses: ${known}`,
        }),
      );
    } else {
      console.error(
        `[instructions] Unknown harness "${resolvedHarness.harness}". Known harnesses: ${known}`,
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
  const hooksActive = detectHooksActive(resolvedHarness.harness);
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
  const existingRun = await detectExistingRun();

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
          harness: resolvedHarness.harness,
          harnessSource: resolvedHarness.source,
          discoveryEvidence: resolvedHarness.evidence,
          interactive: args.interactive,
          promptType: composer.promptType,
          hookDriven: ctx.hookDriven,
          hooksDetected: hooksActive,
          warnings: resolvedHarness.warnings,
          executionContext,
          capabilityFlags,
          suggestedProcesses: processPathsForCapabilities(capabilityFlags),
          existingRun: existingRun ?? null,
          content,
          partsIncluded: composer.partsIncluded,
        },
        null,
        2,
      ),
    );
  } else {
    for (const warning of resolvedHarness.warnings) {
      console.error(`[instructions] Warning: ${warning}`);
    }
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
    const runStateBlock = existingRun
      ? [
          '## Existing Run State',
          '',
          `- Run ID: \`${existingRun.runId}\``,
          `- Run Dir: \`${existingRun.runDir}\``,
          `- Process ID: \`${existingRun.processId}\``,
          `- Bare Run: \`${existingRun.isBareRun}\``,
          `- Entrypoint: \`${existingRun.entrypoint.importPath}${existingRun.entrypoint.exportName ? '#' + existingRun.entrypoint.exportName : ''}\``,
          '',
          existingRun.isBareRun
            ? `**This is a bare run.** Use \`run:assign-process ${existingRun.runDir} --entry <path>#<export>\` to assign a process before iterating.`
            : `This run already has a process assigned. Use \`run:iterate ${existingRun.runDir} --json\` to continue.`,
          '',
          '---',
          '',
        ].join('\n')
      : '';
    console.log(contextHeader + processGuide + runStateBlock + content);
  }

  return 0;
}
