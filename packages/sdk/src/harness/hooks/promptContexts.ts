/**
 * Harness-specific prompt context factories.
 *
 * @deprecated Adapters now derive their config from @a5c-ai/agent-mux metadata
 * via amuxMetadata.ts and derivePromptContext.ts. These factory functions are
 * retained for backward compatibility with prompts/context.ts re-exports.
 * New code should use createPromptContextForHarness() directly.
 */

import type { PromptContext } from "../../prompts/types";
import {
  createClaudeCodeCliSetupSnippet,
  createDefaultCliSetupSnippet,
  createPromptContext,
} from "../../prompts/contextShared";
import { listPluginTargetDescriptors, type PluginTargetDescriptor } from "@a5c-ai/atlas/catalog";

function getTargetDescriptors(): PluginTargetDescriptor[] {
  return listPluginTargetDescriptors();
}

function resolveCliSetupSnippet(target: PluginTargetDescriptor): string {
  if (target.cliSetupMode === 'claude-code') return createClaudeCodeCliSetupSnippet();
  return createDefaultCliSetupSnippet();
}

function resolvePluginRootVar(target: PluginTargetDescriptor): string {
  if (target.pluginRootEnvVar) return `\${${target.pluginRootEnvVar}}`;
  if (target.pluginRootEnvVarForExtension) return `\${${target.pluginRootEnvVarForExtension}}`;
  return '';
}

/**
 * Build a PromptContext from catalog data for a given harness.
 * Falls back to a minimal context when the catalog target is not found.
 */
export function createPromptContextFromCatalog(
  harness: string,
  overrides?: Partial<PromptContext>,
): PromptContext {
  const target = getTargetDescriptors().find(t => t.targetId === harness);
  if (!target) {
    return createPromptContext({
      harness,
      harnessLabel: harness,
      capabilities: [],
      pluginRootVar: '',
      loopControlTerm: 'in-turn',
      sessionBindingFlags: '',
      hookDriven: false,
      interactiveToolName: '',
      sessionEnvVars: '',
      resumeFlags: '',
      cliSetupSnippet: createDefaultCliSetupSnippet(),
      iterateFlags: '',
      hasIntentFidelityChecks: false,
      hasNonNegotiables: false,
    }, overrides);
  }

  return createPromptContext({
    harness: target.targetId,
    harnessLabel: target.displayName,
    capabilities: target.promptCapabilities ?? [],
    pluginRootVar: resolvePluginRootVar(target),
    loopControlTerm: target.loopControlTerm ?? 'in-turn',
    sessionBindingFlags: '',
    hookDriven: target.hookDriven ?? false,
    interactiveToolName: target.interactiveToolName ?? '',
    sessionEnvVars: target.sessionEnvVarsDescription ?? '',
    resumeFlags: '',
    cliSetupSnippet: resolveCliSetupSnippet(target),
    sdkVersionExpr: target.cliSetupMode === 'claude-code' ? '$SDK_VERSION' : '',
    iterateFlags: '',
    hasIntentFidelityChecks: target.hasIntentFidelityChecks ?? false,
    hasNonNegotiables: target.hasNonNegotiables ?? false,
  }, overrides);
}

export function createCodexContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('codex', overrides);
}

export function createCursorContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('cursor', overrides);
}

export function createGeminiCliContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('gemini-cli', overrides);
}

export function createGithubCopilotContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('github-copilot', overrides);
}

export function createOhMyPiContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('oh-my-pi', overrides);
}

export function createOpenClawContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('openclaw', overrides);
}

export function createOpenCodeContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('opencode', overrides);
}

export function createPiContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('pi', overrides);
}

export function createClaudeCodeContext(
  overrides?: Partial<PromptContext>,
): PromptContext {
  return createPromptContextFromCatalog('claude-code', overrides);
}
