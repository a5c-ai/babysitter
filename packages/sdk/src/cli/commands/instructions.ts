/**
 * CLI handlers for `instructions:*` commands.
 *
 * Each subcommand resolves a PromptContext for the given harness,
 * calls the appropriate composer, and outputs the result.
 *
 * @module cli/commands/instructions
 */

import {
  createClaudeCodeContext,
  createCodexContext,
  createPiContext,
  composeBabysitSkillPrompt,
  composeProcessCreatePrompt,
  composeOrchestrationPrompt,
  composeBreakpointPrompt,
} from "../../prompts";
import type { PromptContext } from "../../prompts";
import {
  resolveActiveProcessLibrary,
  getDefaultProcessLibrarySpec,
} from "../../processLibrary/active";
import { getAdapterByName } from "../../harness/registry";

export interface InstructionsCommandArgs {
  subcommand: "babysit-skill" | "process-create" | "orchestrate" | "breakpoint-handling";
  harness: string;
  interactive: boolean | undefined;
  json: boolean;
}

/**
 * Legacy fallback map — used only when an adapter does not implement
 * `getPromptContext()`.  New harnesses should add the method to their
 * adapter instead of extending this map.
 */
const KNOWN_HARNESSES: Record<string, (overrides?: Partial<PromptContext>) => PromptContext> = {
  "claude-code": createClaudeCodeContext,
  "codex": createCodexContext,
  "pi": createPiContext,
};

type ComposerEntry = {
  fn: (ctx: PromptContext) => string;
  promptType: string;
  partsIncluded: string[];
};

const COMPOSERS: Record<InstructionsCommandArgs["subcommand"], ComposerEntry> = {
  "babysit-skill": {
    fn: composeBabysitSkillPrompt,
    promptType: "babysit-skill",
    partsIncluded: [
      "non-negotiables", "dependencies", "interview", "user-profile",
      "process-creation", "intent-fidelity-checks", "run-creation",
      "iteration", "effects", "breakpoint-handling", "results-posting",
      "loop-control", "completion-proof", "task-kinds", "task-examples",
      "quick-reference", "recovery", "process-guidelines", "critical-rules",
      "see-also",
    ],
  },
  "process-create": {
    fn: composeProcessCreatePrompt,
    promptType: "process-create",
    partsIncluded: [
      "interview", "user-profile", "process-creation",
      "intent-fidelity-checks", "process-guidelines",
      "task-kinds", "task-examples",
    ],
  },
  "orchestrate": {
    fn: composeOrchestrationPrompt,
    promptType: "orchestrate",
    partsIncluded: [
      "run-creation", "iteration", "effects", "breakpoint-handling",
      "results-posting", "loop-control", "completion-proof",
      "quick-reference", "recovery", "critical-rules",
    ],
  },
  "breakpoint-handling": {
    fn: composeBreakpointPrompt,
    promptType: "breakpoint-handling",
    partsIncluded: ["breakpoint-handling", "results-posting"],
  },
};

/**
 * Resolve a PromptContext factory by harness name.
 *
 * Prefers the adapter's own `getPromptContext()` method when available,
 * falling back to the legacy KNOWN_HARNESSES map for adapters that have
 * not yet been updated.  Returns undefined for completely unknown names.
 */
function resolveContextFactory(
  harness: string,
): ((overrides?: Partial<PromptContext>) => PromptContext) | undefined {
  // Try adapter-based resolution first
  const adapter = getAdapterByName(harness);
  if (adapter?.getPromptContext) {
    return (overrides?: Partial<PromptContext>) => {
      const base = adapter.getPromptContext!({ interactive: overrides?.interactive });
      // Merge any additional overrides beyond interactive
      if (overrides) {
        return { ...base, ...overrides };
      }
      return base;
    };
  }

  // Fallback to legacy map
  return KNOWN_HARNESSES[harness];
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
        processLibraryRoot: resolved.binding.dir,
        processLibraryReferenceRoot: defaultSpec.referenceRoot,
      };
    }
  } catch {
    // No binding exists or resolution failed — fall back to manual instructions
  }
  return {};
}

/**
 * Route and handle an `instructions:*` subcommand.
 */
export async function handleInstructionsCommand(
  args: InstructionsCommandArgs,
): Promise<number> {
  const factory = resolveContextFactory(args.harness);
  if (!factory) {
    const known = Object.keys(KNOWN_HARNESSES).join(", ");
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

  const ctx = factory({
    interactive: args.interactive,
    ...libraryInfo,
  });
  const content = composer.fn(ctx);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          harness: args.harness,
          interactive: args.interactive,
          promptType: composer.promptType,
          content,
          partsIncluded: composer.partsIncluded,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(content);
  }

  return 0;
}
